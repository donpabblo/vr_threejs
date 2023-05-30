import { entity } from "./entity.js";
import { finite_state_machine } from './finite-state-machine.js';
import { actionable_state } from './actionable-state.js';

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

    class ExitComponent extends entity.Component {

        constructor(messagingManager, topic) {
            super();
            this.messagingManager = messagingManager;
            this.messagingManager.subscribe(topic, (m) => { this._OnClicked(m); });
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
            return actualScore;
        }

        _OnClicked(m) {
            let conf = confirm("Stai per uscire dall'ufficio. Le tue azioni saranno valutate!");
            if (conf) {
                let score = this._calculateScore();
                var msg_str = "Il tuo punteggio è %d%%"; alert(msg_str.replace("%d", score).replace("%%", "%"));
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
    }

    return {
        ClickableComponent: ClickableComponent,
        MonitorComponent: MonitorComponent,
        NeonComponent: NeonComponent,
        PickableComponent: PickableComponent,
        CollidableComponent: CollidableComponent,
        ExitComponent: ExitComponent
    };
})()