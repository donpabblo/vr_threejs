import { entity } from "./entity.js";
import { finite_state_machine } from './finite-state-machine.js';
import { actionable_state } from './actionable-state.js';
import * as THREE from '../three.module.min.js';
import * as ThreeMeshUI from '../three-mesh-ui.js';

export const interaction_component = (() => {

    class PickableComponent extends entity.Component {
        constructor() {
            super(this.object);
            this.object = object;
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
    
    class LedComponent extends entity.Component {

        constructor(messagingManager, object, topic) {
            super();
            this.messagingManager = messagingManager;
            this.object = object;
            this.messagingManager.subscribe(topic, (m) => { this._OnClicked(m); });
        }

        _OnClicked(m) {
            let emission = this.object.material.emissiveIntensity === 0 ? 1 : 0;
            this.object.material.emissiveIntensity = emission;
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
    /*
    class ConfirmComponent extends entity.Component {
        constructor(scene, camera, messagingManager, handModels) {
            super();
            this.container = new ThreeMeshUI.Block({
                justifyContent: 'center',
                contentDirection: 'row-reverse',
                fontFamily: '../../font/Roboto-msdf.json',
                fontTexture: '../../font/Roboto-msdf.png',
                fontSize: 0.07,
                padding: 0.02,
                backgroundOpacity: 0.0001,
                width: 1.2
            });
            //this.container.position.set(0, 0.5, -0.5);
            //this.container.rotation.x = -0.40;
            this.camera = camera;
            this.scene = scene;
            this.handModels = handModels;
            this.active = false;
            this.messagingManager = messagingManager;
            this.clock = new THREE.Clock();

            this._CreateButtons();

            messagingManager.subscribe("confirm_cmp", (m) => { this._OnMessage(m); });
        }

        _OnMessage(m) {
            if (m.procediBehaviour) {
                this.procediBehaviour = m.procediBehaviour;
            }
            //if (this.active) {
            //    this.scene.remove(this.container);//Elimina le ButtonUI
            //    this.active = false;
            //} else {
            this.scene.add(this.container);
            if (m.confirm) {
                this.container.add(this.buttonProcedi, this.buttonAnnulla);
            } else {
                this.container.add(this.buttonProcedi);
            }
            this.active = true;
            //}
        }

        Update() {
            if (this.active) {
                this.container.position.copy(this.camera.position);
                this.container.rotation.copy(this.camera.rotation);
                this.container.updateMatrix();
                this.container.translateY(- 0.3);
                this.container.translateZ(- 0.8);
                this.container.rotateX(-0.4);

                for (let handModel of this.handModels) {
                    if (handModel.intersectBoxObject(this.buttonProcedi)) {
                        this.buttonProcedi.setState('hovered');
                        this.buttonProcediHovered = true;
                        this.clock.start();
                        this.lastInteraction = 0;
                    }
                    if (handModel.intersectBoxObject(this.buttonAnnulla)) {
                        this.buttonAnnulla.setState('hovered');
                        this.buttonAnnullaHovered = true;
                        this.clock.start();
                        this.lastInteraction = 0;
                    }
                }

                if (this.buttonProcediHovered || this.buttonAnnullaHovered) {
                    let currentTime = this.clock.getElapsedTime();
                    if (currentTime - this.lastInteraction >= 0.5) {
                        this.messagingManager.publish("text_cmp", {});//Elimina la TextUI
                        this.scene.remove(this.container);//Elimina le ButtonUI
                        if (this.procediBehaviour) {
                            this.messagingManager.publish(this.procediBehaviour.topic, this.procediBehaviour.message);
                        }
                        this.active = false;
                        this.buttonProcediHovered = false;
                        this.buttonAnnullaHovered = false;
                        this.clock.stop();
                    }
                }
                ThreeMeshUI.update();
            }
        }

        _CreateButtons(confirm) {
            const buttonOptions = {
                width: 0.5,
                height: 0.1,
                justifyContent: 'center',
                offset: 0.05,
                margin: 0.02,
                borderRadius: 0.005
            };
            // Options for component.setupState().
            // It must contain a 'state' parameter, which you will refer to with component.setState( 'name-of-the-state' ).

            const hoveredStateAttributes = {
                state: 'hovered',
                attributes: {
                    offset: 0.035,
                    backgroundColor: new THREE.Color(0x999999),
                    backgroundOpacity: 1,
                    fontColor: new THREE.Color(0xffffff)
                },
            };

            const idleStateAttributes = {
                state: 'idle',
                attributes: {
                    offset: 0.035,
                    backgroundColor: new THREE.Color(0x666666),
                    backgroundOpacity: 0.3,
                    fontColor: new THREE.Color(0xffffff)
                },
            };

            this.buttonProcedi = new ThreeMeshUI.Block(buttonOptions);
            this.buttonAnnulla = new ThreeMeshUI.Block(buttonOptions);

            this.buttonProcedi.add(
                new ThreeMeshUI.Text({ content: 'Procedi' })
            );

            this.buttonAnnulla.add(
                new ThreeMeshUI.Text({ content: 'Annulla' })
            );

            //const selectedAttributes = {
            //    offset: 0.02,
            //    backgroundColor: new THREE.Color(0x777777),
            //    fontColor: new THREE.Color(0x222222)
            //};

            //this.buttonProcedi.setupState({
            //    state: 'selected',
            //    attributes: selectedAttributes,
            //    onSet: () => {
            //        this.active = false;
            //        this.messagingManager.publish("text_cmp", {});//Elimina la TextUI
            //        this.scene.remove(this.container);//Elimina le ButtonUI
            //        this.messagingManager.publish(this.procediBehaviour.topic, this.procediBehaviour.message);//Elimina la TextUI
            //    }
            //});
            this.buttonProcedi.setupState(hoveredStateAttributes);
            this.buttonProcedi.setupState(idleStateAttributes);

            //buttonAnnulla.setupState({
            //    state: 'selected',
            //    attributes: selectedAttributes,
            //    onSet: () => {
            //        this.active = false;
            //        this.messagingManager.publish("text_cmp", {});//Elimina la TextUI
            //        this.scene.remove(this.container);//Elimina le ButtonUI
            //    }
            //});
            this.buttonAnnulla.setupState(hoveredStateAttributes);
            this.buttonAnnulla.setupState(idleStateAttributes);

        }
    }
    */

    class TextComponent extends entity.Component {

        constructor(scene, camera, messagingManager) {
            super();
            this.container = new ThreeMeshUI.Block({
                fontFamily: '../../font/Roboto-msdf.json',
                fontTexture: '../../font/Roboto-msdf.png',
                width: 1.3,
                height: 0.5,
                padding: 0.05,
                justifyContent: 'center',
                textAlign: 'left'
            });
            //this.container.position.set(0, 1.5, -0.5);
            //this.container.rotation.x = -0.40;
            this.camera = camera;
            this.scene = scene;

            messagingManager.subscribe("text_cmp", (m) => { this._OnMessage(m); });
        }

        _OnMessage(m) {
            this.container.children = [this.container.children[0]];
            if (m.show) {
                this.container.add(new ThreeMeshUI.Text({
                    content: m.text
                }));
                this.scene.add(this.container);
            } else {
                this.scene.remove(this.container);
            }
        }

        Update() {
            this.container.position.copy(this.camera.position);
            this.container.rotation.copy(this.camera.rotation);
            this.container.updateMatrix();
            this.container.translateZ(- 1.5);
            ThreeMeshUI.update();
        }
    }

    class ExitComponent extends entity.Component {

        constructor(messagingManager) {
            super();
            this.messagingManager = messagingManager;
            this.messagingManager.subscribe("session", (m) => { this._OnSession(m); });
            this.messagingManager.subscribe("exit", (m) => { this._OnClicked(m); });
            this.calculateState = false;
            this.saveState = false;
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

        _OnSession(m) {
            this.session = m.session;
        }

        _OnClicked(m) {
            if (this.session) {
                if (m.reset) {
                    this.calculateState = false;
                    this.saveState = false;
                    this.messagingManager.publish("text_cmp", { show: false });
                } else {
                    if (m.rightPinch) {
                        if (this.saveState) {
                            this._updateSCORM(this.score);
                            this.calculateState = false;
                            this.saveState = false;
                            this.session.end();
                        }
                        if (this.calculateState) {
                            this.score = this._calculateScore();
                            let message = "Hai totalizzato un numero di azioni corrette pari al " + this.score + "%. Right Pinch per uscire dalla simulazione, Left Pinch per riprendere.";
                            this.messagingManager.publish("text_cmp", { show: true, text: message });
                            this.calculateState = false;
                            this.saveState = true;
                        } else {
                            this.messagingManager.publish("text_cmp", { show: false });
                        }
                    } else {
                        this.messagingManager.publish("text_cmp", { show: true, text: "Vuoi davvero uscire dall'ufficio? Right Pinch se intendi visualizzare il punteggio totalizzato, altrimenti Left Pinch per annullare" });
                        this.calculateState = true;
                    }
                }

                /*
                if (m.exit) {
                    _updateSCORM(this.score);
                } else if (m.calculate) {
                    this.score = this._calculateScore();
                    let message = "Hai totalizzato un numero di azioni corrette pari al " + this.score + "%";
                    this.messagingManager.publish("text_cmp", { text: message });
                    this.messagingManager.publish("confirm_cmp", { confirm: false, procediBehaviour: { topic: "exit", message: { exit: true } } });
                } else {
                    this.messagingManager.publish("text_cmp", { text: "Vuoi davvero uscire dall'ufficio? Clic su Procedi se intendi visualizzare il punteggio totalizzato, altrimenti clic su Annulla!" });
                    this.messagingManager.publish("confirm_cmp", { confirm: true, procediBehaviour: { topic: "exit", message: { calculate: true } } });
                }
                */
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
        TextComponent: TextComponent,
        LedComponent: LedComponent
        //ConfirmComponent: ConfirmComponent
    };
})()