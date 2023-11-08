import * as THREE from './three.module.min.js';
import * as ThreeMeshUI from './three-mesh-ui.js';
import { GLTFLoader } from './loaders/GLTFLoader.js';
import { XRButton } from './webxr/XRButton.js';
import { VRButton } from './webxr/VRButton.js';
import { XRControllerModelFactory } from './webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from './webxr/XRHandModelFactory.js';
import { StatsVR } from './utils/statsvr.js'
import { OculusHandModel } from './webxr/OculusHandModel.js';

import { entity } from './engine/entity.js';
import { player_entity } from './engine/player-entity.js'
import { player_input } from './engine/player-input.js';
import { third_person_camera } from './engine/third-person-camera.js';
import { entity_manager } from './engine/entity-manager.js';
import { messaging_manager } from './engine/messaging-manager.js';
import { interaction_component } from './engine/interaction-component.js';
import { controller_input } from './engine/controller-input.js';

class MyWorld {

    constructor(avatar) {
        this._previousRAF = null;
        this._avatar = avatar;
        if (avatar) {
            this._environment = 'roblox_office.glb';
        } else {
            this._environment = 'simple_office.glb';
            //this._environment = 'test_shadow.glb';
        }
        this.init();
        this.animate();
        this.test = "Testo davvero molto lungo";
    }

    init() {
        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.shadowMap.enabled = true;
        //this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        //this._renderer.setClearColor(0x000000);
        this._renderer.useLegacyLights = false;
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._renderer.domElement.id = 'threejs';
        document.body.appendChild(this._renderer.domElement);

        if (!this._avatar) {
            this._renderer.xr.enabled = true;

            document.body.appendChild(XRButton.createButton(this._renderer));
            //document.body.appendChild(VRButton.createButton(this._renderer));
        }

        this._renderer.xr.addEventListener('sessionstart', (event) => {
            this._messagingManager.publish("session", { session: event.target.getSession() });
        });

        window.addEventListener('resize', () => {
            this._camera.aspect = window.innerWidth / window.innerHeight;
            this._camera.updateProjectionMatrix();
            this._renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const fov = 50;
        const aspect = window.innerWidth / window.innerHeight;
        var near = 1.0;
        var far = 100;
        if (!this._avatar) {
            near = 0.1;
            far = 10;
        }
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        if (this._avatar) {
            this._camera.position.set(25, 10, 25);
        }

        this._scene = new THREE.Scene();
        this._entityManager = new entity_manager.EntityManager();
        this._messagingManager = new messaging_manager.MessagingManager();

        this.loadLight();
        this.loadEnvironment().then(() => {
            if (this._avatar) {
                this.loadPlayer();
                this.loadTutor();
            } else {
                this.loadControllers();
            }
        });
        this._previousRAF = null;



        //this.statsVR = new StatsVR(this._scene, this._camera);
        //this.statsVR.setX(-0.5);
        //this.statsVR.setY(0.5);
        //this.statsVR.setZ(-5);
        //this.test = "ASSA";

    }


    animate() {
        if (this._avatar) {
            requestAnimationFrame((time) => {
                if (this._previousRAF === null) {
                    this._previousRAF = time;
                }
                this.animate();
                this._renderer.render(this._scene, this._camera);
                this.step(time - this._previousRAF);
                this._previousRAF = time;
            });
        } else {
            this._renderer.setAnimationLoop((time) => {
                //this.statsVR.startTimer();
                if (this._previousRAF === null) {
                    this._previousRAF = time;
                }
                //this.statsVR.setCustom1(this.test);
                //this.statsVR.update();
                this._renderer.render(this._scene, this._camera);
                //this.statsVR.endTimer();
                this.step(time - this._previousRAF);
                //ThreeMeshUI.update();
                this._previousRAF = time;
                this.spotLightHelper.update();

            });
        }
    }

    step(timeElapsed) {
        const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
        this._entityManager.Update(timeElapsedS);
    }

    loadTutor() {
        const params = {
            camera: this._camera,
            scene: this._scene,
            fbx_path: './models/ai/'
        };
        const tutor = new entity.Entity();
        tutor.AddComponent(new player_input.BasicCharacterControllerInput(params));
        tutor.AddComponent(new player_entity.BasicCharacterController(params));
        this._entityManager.Add(tutor, 'tutor');

    }

    loadPlayer() {
        const params = {
            camera: this._camera,
            scene: this._scene,
            fbx_path: './models/' + this._avatar + '/'
        };
        const player = new entity.Entity();
        player.AddComponent(new player_input.BasicCharacterControllerInput(params));
        player.AddComponent(new player_entity.BasicCharacterController(params));
        this._entityManager.Add(player, 'player');

        const camera = new entity.Entity();
        camera.AddComponent(
            new third_person_camera.ThirdPersonCamera({
                camera: this._camera,
                target: this._entityManager.Get('player')
            }));
        this._entityManager.Add(camera, 'player-camera');

    }

    leftPinchEnd = () => {
        this.test = "LEFT";
        this._messagingManager.publish("exit", { reset: true });
    }
    rightPinchEnd = () => {
        this.test = "RIGHT";
        this._messagingManager.publish("exit", { rightPinch: true });
    }

    debug(leftHand, rightHand) {
        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'q':
                    leftHand.dispatchEvent({ type: "pinchend" });
                    break;
                case 'y':
                    rightHand.dispatchEvent({ type: "pinchend" });
                    break;
                case 'e':
                    this._messagingManager.publish("exit", {});
                    break;
                case '':
                    this._messagingManager.publish("text_cmp", {});
                    break;
            }
        });
    }

    loadControllers() {
        const rightHand = this._renderer.xr.getHand(1);
        const rightHandModel = new OculusHandModel(rightHand);
        rightHand.add(rightHandModel);
        this._scene.add(rightHand);
        const rightHandEntity = new entity.Entity();
        rightHandEntity.AddComponent(new controller_input.PinchController({ hand: rightHand, pinchEnd: this.rightPinchEnd }));
        rightHandEntity.AddComponent(new controller_input.IndexTipController({ handModel: rightHandModel }));
        this._entityManager.Add(rightHandEntity, 'rightHandEntity');

        //const controller = this._renderer.xr.getController(0);
        //this._scene.add(controller);

        const leftHand = this._renderer.xr.getHand(0);
        const leftHandModel = new OculusHandModel(leftHand);
        leftHand.add(leftHandModel);
        this._scene.add(leftHand);
        const leftHandEntity = new entity.Entity();
        leftHandEntity.AddComponent(new controller_input.PinchController({ hand: leftHand, pinchEnd: this.leftPinchEnd }));
        leftHandEntity.AddComponent(new controller_input.IndexTipController({ handModel: leftHandModel }));
        //rightHandEntity.AddComponent(new controller_input.Sword({ controller: controller }));
        this._entityManager.Add(leftHandEntity, 'leftHandEntity');

        const textUIEntity = new entity.Entity();
        textUIEntity.AddComponent(new interaction_component.TextComponent(this._scene, this._camera, this._messagingManager));
        this._entityManager.Add(textUIEntity, 'textUIEntity');

        //const buttonUIEntity = new entity.Entity();
        //buttonUIEntity.AddComponent(new interaction_component.ConfirmComponent(this._scene, this._camera, this._messagingManager, [leftHandModel, rightHandModel]));
        //this._entityManager.Add(buttonUIEntity, 'buttonUIEntity');

        this._messagingManager.publish("text_cmp", { show: true, text: "E' appena finita la giornata lavorativa e sei solo in ufficio. Metti in pratica tutti i comportamenti virtuosi appresi durante il corso. Al termine, usa la porta per uscire dall'ufficio e conoscere il punteggio che hai totalizzato." });

        //leftHand.dispatchEvent({ type: "pinchend" });
        //rightHand.dispatchEvent({ type: "pinchend" });

        //this._messagingManager.publish("exit", {});
        //rightHand.dispatchEvent({ type: "pinchend" });
        this.debug(leftHand, rightHand);



        //const leftPinchController = new entity.Entity();
        //leftPinchController.AddComponent(new controller_input.PinchController({ hand: leftHand, pinchEnd: () => { this._messagingManager.publish("text_cmp", { show: true, text: "LEFT PINCH" }); /*this._messagingManager.publish("exit", { reset: true }); */ } }));
        //this._entityManager.Add(leftPinchController, 'leftPinchController');
        //
        //const rightPinchController = new entity.Entity();
        //rightPinchController.AddComponent(new controller_input.PinchController({ hand: rightHand, pinchEnd: () => { this._messagingManager.publish("text_cmp", { show: true, text: "RIGHT PINCH" }); /*this._messagingManager.publish("exit", { rightPinch: true }); */ } }));
        //this._entityManager.Add(rightPinchController, 'rightPinchController');


        //this._messagingManager.publish("confirm_cmp", { confirm: false });

        //this._messagingManager.publish("text_cmp", {});
        //this._messagingManager.publish("exit", {});

        /*
        const controller1 = this._renderer.xr.getController(0);
        this._scene.add(controller1);

        const controller2 = this._renderer.xr.getController(1);
        this._scene.add(controller2);

        //const controllerModelFactory = new XRControllerModelFactory();
        //const handModelFactory = new XRHandModelFactory();

        // Left Hand
        //const controllerGrip1 = this._renderer.xr.getControllerGrip(0);
        //controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
        //this._scene.add(controllerGrip1);

        const hand1 = this._renderer.xr.getHand(0);
        this.handModel1 = new OculusHandModel(hand1);
        hand1.add(this.handModel1);
        this._scene.add(hand1);

        hand1.addEventListener('pinchstart', () => {
            this.test = "Left pinchstart";
        });
        hand1.addEventListener('pinchend', () => {
            this.test = "Left pinchend";
        });

        // Right Hand
        //const controllerGrip2 = this._renderer.xr.getControllerGrip(1);
        //controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
        //this._scene.add(controllerGrip2);

        const hand2 = this._renderer.xr.getHand(1);
        this.handModel2 = new OculusHandModel(hand2);
        hand2.add(this.handModel2);
        this._scene.add(hand2);
        hand2.addEventListener('pinchstart', (event) => {
            this.test = "Right pinchstart";
        });
        hand2.addEventListener('pinchend', (event) => {
            this.test = "Right pinchend";
        });
        this._scene.add(hand2);
        */

        //const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1)]);
        //const line = new THREE.Line(geometry);
        //line.name = 'line';
        //line.scale.z = 5;
        //controller1.add(line.clone());
        //controller2.add(line.clone());

    }

    loadLight() {
        let light = new THREE.AmbientLight(0xFFFFFF, 1);
        this._scene.add(light);

        /*
        var objgeometry = new THREE.BoxGeometry(8, 12, 8);
        var objmaterial = new THREE.MeshPhongMaterial({
            color: 0x1C1C03,
            wireframe: false
        });
        var obj = new THREE.Mesh(objgeometry, objmaterial);
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.position.z = 0;
        obj.position.x = 0;
        obj.position.y = 1;
        this._scene.add(obj);

        var sLight = new THREE.SpotLight(0xFFFFFF, 10); // spotfény segédgeometriával
        sLight.position.set(0, 2, -1);
        sLight.castShadow = true;
        sLight.distance = 300;
        sLight.target = obj;
        sLight.angle = Math.PI * 0.2;
        sLight.shadow.camera.near = 0.1;
        sLight.shadow.camera.far = 100;
        sLight.shadow.mapSize.width = 2048;
        sLight.shadow.mapSize.height = 2048;

        this._scene.add(sLight);

        this.spotLightHelper = new THREE.SpotLightHelper(sLight);
        this._scene.add(this.spotLightHelper);
        */
    }

    loadEnvironment() {
        return new Promise((resolve, reject) => {
            this.loadModel('models/' + this._environment).then(glb => {
                if (this._avatar) {
                    glb.scene.scale.set(5, 5, 5);
                }
                this._scene.add(glb.scene);
                let scene = this._scene.getObjectByName("Scene");
                const environmentEntity = new entity.Entity();
                environmentEntity.AddComponent(new interaction_component.CollidableComponent(scene));
                this._entityManager.Add(environmentEntity, 'environment');

                this._scene.traverse((obj) => {
                    if (obj.userData.components) {
                        const currEntity = new entity.Entity();
                        const components = JSON.parse(obj.userData.components);
                        for (let cmp of components) {
                            var currCmp;
                            switch (cmp.type) {
                                case "ClickableComponent":
                                    currCmp = new interaction_component.ClickableComponent(this._messagingManager, obj, cmp.topic);
                                    break;
                                case "MonitorComponent":
                                    currCmp = new interaction_component.MonitorComponent(this._messagingManager, obj, cmp.topic);
                                    break;
                                case "NeonComponent":
                                    currCmp = new interaction_component.NeonComponent(this._messagingManager, obj, cmp.topic);
                                    break;
                                case "LedComponent":
                                    currCmp = new interaction_component.LedComponent(this._messagingManager, obj, cmp.topic);
                                    break;
                                case "ExitComponent":
                                    currCmp = new interaction_component.ExitComponent(this._messagingManager);
                                    break;
                            }
                            currEntity.AddComponent(currCmp);
                        }
                        this._entityManager.Add(currEntity, '');
                    }
                });
                resolve();
            });
        });
    }

    async loadModel(path) {
        const loader = new GLTFLoader();
        try {
            const glb = await loader.loadAsync(path);
            return glb;
        } catch (err) {
            console.error(error);
        }
    }
}

let _APP = null;
window.addEventListener('DOMContentLoaded', () => {
    if (navigator.xr) {
        navigator.xr.isSessionSupported("immersive-vr").then((isSupported) => {
            if (isSupported) {
                _APP = new MyWorld();
            } else {
                document.getElementById("choose-player").style.visibility = "visible";
                document.getElementById("claire").addEventListener("click", () => {
                    _APP = new MyWorld("claire");
                    document.getElementById("choose-player").style.visibility = "hidden";
                });
                document.getElementById("aj").addEventListener("click", () => {
                    _APP = new MyWorld("aj");
                    document.getElementById("choose-player").style.visibility = "hidden";
                });
            }
        });
    }
});