import { entity } from "./entity.js";
import { finite_state_machine } from './finite-state-machine.js';
import { actionable_state } from './actionable-state.js';
import * as THREE from '../three.module.min.js';
import * as ThreeMeshUI from '../three-mesh-ui.js';

export const interaction_component = (() => {

    class PickableComponent extends entity.Component {
        constructor() {
            super();
        }

        InitComponent() {
        }
    };

    class CollidableComponent extends entity.Component {
        constructor(object) {
            super();
            this._object = object;
        }

        InitComponent() {
        }
    };

    class ActivableComponentFSM extends finite_state_machine.FiniteStateMachine {
        constructor(object) {
            super();
            this.object = object;
            this._Init();
        }

        _Init() {
            this._AddState('on', actionable_state.OnState);
            this._AddState('off', actionable_state.OffState);
        }
    }

    class ClickableComponent extends entity.Component {
        constructor(messagingManager, object, topic) {
            super();
            this.messagingManager = messagingManager;
            this.object = object;
            this.topic = topic;
        }
        publish(message) {
            this.messagingManager.publish(this.topic, message);
        }
    }

    class MonitorComponent extends entity.Component {

        constructor(messagingManager, object, topic) {
            super();
            this.messagingManager = messagingManager;
            this.messagingManager.subscribe(topic, (m) => { this._OnClicked(m); });
            this.stateMachine = new ActivableComponentFSM(object);
            this.stateMachine.SetState('on');
        }

        unsubscribe(topic, callback) {
            this.messagingManager.unsubscribe(topic, callback);
        }

        _OnClicked(m) {
            const state = this.stateMachine._currentState.Name == 'off' ? 'on' : 'off';
            this.stateMachine.SetState(state);
        }

        Update() {
            this.stateMachine.Update();
        }

    }

    class GrabbableComponent extends entity.Component {
        constructor(object) {
            super();
            this.object = object;
        }
    }

    class NeonComponent extends entity.Component {

        constructor(messagingManager, object, topic) {
            super();
            this.messagingManager = messagingManager;
            this.object = object;
            this.messagingManager.subscribe(topic, (m) => { this._OnClicked(m); });
        }

        _OnClicked(m) {
            this.object.children[0].visible = !this.object.children[0].visible;
            this.object.children[1].visible = !this.object.children[1].visible;
        }
    }

    class TextComponent extends entity.Component {

        constructor(scene, camera, messagingManager) {
            super();
            this.textMessage = "CIAO IO SONO PAOLO SERVILLO TU CHI SEI";
            this.container = new ThreeMeshUI.Block({
                width: 1.3,
                height: 0.5,
                padding: 0.1,
                justifyContent: 'center',
                textAlign: 'left',
                fontFamily: '../../font/Roboto-msdf.json',
                fontTexture: '../../font/Roboto-msdf.png',
                // interLine: 0,
            });
            this.container.position.set(0, 1.5, -1.8);
            this.container.rotation.x = -0.40;

            scene.add(this.container);

            this.container.add(
                new ThreeMeshUI.Text({
                    // content: 'This library supports line-break-friendly-characters,',
                    content: 'This library supports line break friendly characters',
                    fontSize: 0.055
                }),

                new ThreeMeshUI.Text({
                    content: ' As well as multi font size lines with consistent vertical spacing',
                    fontSize: 0.08
                })
            );
            messagingManager.subscribe("message", (m) => { this._OnMessage(m); });
        }

        Update() {
            //this.container.position.copy(this.camera.position);
            //this.container.rotation.copy(this.camera.rotation);
            //this.container.updateMatrix();
            //this.container.translateZ(- 5);

            this.container.set({
                //borderRadius: [0, 0.2 + 0.2 * Math.sin(Date.now() / 500), 0, 0],
                borderWidth: 0.01 - 0.02 * Math.sin(Date.now() / 500),
                borderColor: new THREE.Color(0.5 + 0.5 * Math.sin(Date.now() / 500), 0.5, 1),
                borderOpacity: 1
            });

            if (this.textMessage) {
                this.container.children = [this.container.children[0]];
                this.container.add(new ThreeMeshUI.Text({
                    // content: 'This library supports line-break-friendly-characters,',
                    content: this.textMessage,
                    fontSize: 0.055
                }));
            }
            this.textMessage = null;
            ThreeMeshUI.update();
        }

        _OnMessage(m) {
            this.textMessage = m.message;
        }
    }

    class ExitComponent extends entity.Component {

        constructor(messagingManager, topic, isVR) {
            super();
            this.isVR = isVR;
            this.messagingManager = messagingManager;
            this.messagingManager.subscribe(topic, (m) => { this._OnClicked(m); });
            this.onExit = false;
        }

        _calculateScore() {
            let rawScore = 0;
            const neons = this._parent._parent.FilterComponents('NeonComponent');
            const monitors = this._parent._parent.FilterComponents('MonitorComponent');
            let numComponents = neons.length + monitors.length;
            for (let neon of neons) {
                if (!neon.object.children[0].visible) {
                    rawScore++;
                }
            }
            for (let monitor of monitors) {
                if (monitor.stateMachine._currentState.Name === 'off') {
                    rawScore++;
                }
            }
            let actualScore = Math.round(rawScore / numComponents * 100);
            return actualScore.toString();
        }

        _OnClicked(m) {
            if (this.isVR) {
                if (!this.onExit) {
                    this.messagingManager.publish("message", { visible: true, message: "Stai per uscire dall'ufficio. Le tue azioni saranno valutate!" });
                    this.onExit = true;
                } else {
                    //this.messagingManager.publish("message", { visible: true, message: "100 punti" });
                    let score = this._calculateScore();
                    let message = "Hai totalizzato un numero di azioni corrette pari al " + score + "%";
                    this.messagingManager.publish("message", { visible: true, message: message });
                    _updateSCORM(score);
                }
            } else {
                let conf = confirm("Stai per uscire dall'ufficio. Le tue azioni saranno valutate!");
                if (conf) {
                    let score = this._calculateScore();
                    var msg_str = "Il tuo punteggio è %d%%"; alert(msg_str.replace("%d", score).replace("%%", "%"));
                    _updateSCORM(score);
                }
            }
        }

        _updateSCORM(score) {
            try {
                scorm.SetInteractionValue("cmi.score.scaled", "0");
                computeTime();
                scorm.SetScoreRaw(score + "");
                scorm.SetScoreMax(100);
                scorm.SetScoreMin(0);
                var mode = scorm.GetMode();
                if (mode != "review" && mode != "browse") {
                    if (score < 100) {
                        scorm.SetCompletionScormActivity("incomplete");
                        scorm.SetSuccessStatus("failed");
                        if (scorm.version == '2004') {
                            scorm.SetInteractionValue("cmi.score.scaled", score / 100);
                        }
                    }
                    else {
                        scorm.SetCompletionScormActivity("completed");
                        scorm.SetSuccessStatus("passed");
                        if (scorm.version == '2004') {
                            scorm.SetInteractionValue("cmi.score.scaled", score / 100);
                        }
                    }
                    scorm.SetExit("");
                }
                exitPageStatus = true;
                scorm.save();
                scorm.quit();
            } catch (err) {
                console.log(err);
            }
        }
    }

    return {
        ClickableComponent: ClickableComponent,
        MonitorComponent: MonitorComponent,
        NeonComponent: NeonComponent,
        PickableComponent: PickableComponent,
        CollidableComponent: CollidableComponent,
        ExitComponent: ExitComponent,
        TextComponent: TextComponent
    };
})()