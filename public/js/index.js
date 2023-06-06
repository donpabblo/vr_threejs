import * as THREE from './three.module.min.js';
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

class MyWorld {

    constructor(avatar) {
        this._previousRAF = null;
        this._avatar = avatar;
        this._environment = 'simple_office.glb';
        this.init();
        this.animate();
        this.test = "Testo davvero molto lungo";
    }

    init() {
        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        //this._renderer.shadowMap.enabled = true;
        //this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this._renderer.useLegacyLights = false;
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._renderer.domElement.id = 'threejs';
        document.body.appendChild(this._renderer.domElement);

        if (!this._avatar) {
            this._renderer.xr.enabled = true;
            //document.body.appendChild(XRButton.createButton(this._renderer));
            document.body.appendChild(VRButton.createButton(this._renderer));
        }

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
        this._camera.position.set(25, 10, 25);
        if (!this._avatar) {
            this._camera.position.set(0, 1.7, 0);
        }

        this._scene = new THREE.Scene();
        this._entityManager = new entity_manager.EntityManager();
        this._messagingManager = new messaging_manager.MessagingManager();

        this.loadLight();
        this.loadEnvironment();
        this.loadControllers();
        if (this._avatar) {
            this.loadPlayer();
        }
        this._previousRAF = null;

        this.statsVR = new StatsVR(this._scene, this._camera);
        this.statsVR.setX(-0.5);
        this.statsVR.setY(0.5);
        this.statsVR.setZ(-5);

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
                this.statsVR.startTimer();
                if (this._previousRAF === null) {
                    this._previousRAF = time;
                }
                this.statsVR.setCustom1(this.test);
                this.statsVR.update();
                this._renderer.render(this._scene, this._camera);
                this.statsVR.endTimer();
                this.step(time - this._previousRAF);
                this.checkFingerPress();
                this._previousRAF = time;
            });
        }
    }

    checkFingerPress() {
        const clickables = this._entityManager.FilterComponents('ClickableComponent');
        for (let clickable of clickables) {
            let curentObject = clickable.object;
            if (this.handModel1 && this.handModel1.intersectBoxObject(curentObject)) {
                clickable.publish({});
            }
        }
    }

    step(timeElapsed) {
        const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
        this._entityManager.Update(timeElapsedS);
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

    loadControllers() {
        const controller1 = this._renderer.xr.getController(0);
        this._scene.add(controller1);

        const controller2 = this._renderer.xr.getController(1);
        this._scene.add(controller2);
        //const swordMaterial = new THREE.MeshBasicMaterial({ color: 0xdb3236 });
        //const swordLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 4.0, 0.03), swordMaterial);
        //swordLeft.geometry.translate(0, -1.8, 0);
        //swordLeft.geometry.rotateX(Math.PI / 2);
        //controller2.add(swordLeft);
        //const swordLeftHandGuard = new THREE.Mesh(
        //    new THREE.CylinderGeometry(0.005, 0.05, 0.2, 6),
        //    swordMaterial
        //);
        //swordLeftHandGuard.geometry.rotateX(Math.PI / 2);
        //controller2.add(swordLeftHandGuard);

        const controllerModelFactory = new XRControllerModelFactory();
        const handModelFactory = new XRHandModelFactory();

        // Right Hand
        const controllerGrip1 = this._renderer.xr.getControllerGrip(0);
        controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
        this._scene.add(controllerGrip1);

        const hand1 = this._renderer.xr.getHand(0);
        this.handModel1 = new OculusHandModel(hand1);
        hand1.add(this.handModel1);
        //hand1.add(handModelFactory.createHandModel(hand1));
        this._scene.add(hand1);

        hand1.addEventListener('pinchstart', () => {
            console.log("Hand 1: pinchstart");
            this.test = "Hand 1: pinchstart";
        });
        hand1.addEventListener('pinchend', () => {
            console.log("Hand 1: pinchend");
            this.test = "Hand 1: pinchend";
        });

        // Hand 2
        const controllerGrip2 = this._renderer.xr.getControllerGrip(1);
        controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
        this._scene.add(controllerGrip2);

        const hand2 = this._renderer.xr.getHand(1);
        hand2.addEventListener('pinchstart', (event) => {
            this.test = "pinchstart";
            const controller = event.target;
            const clickables = this._entityManager.FilterComponents('ClickableComponent');
            for (let clickable of clickables) {
                clickable.publish({});
            }
            //const indexTip = controller.joints['index-finger-tip'];
            //const object = this.collideObject(indexTip);
            //if (object) {
            //    this.test = "Publish message";
            //    object.publish({});
            //}
        });
        hand2.addEventListener('pinchend', (event) => {
            console.log("Hand 2: pinchend");
            this.test = "Hand 2: pinchend";
        });
        hand2.add(handModelFactory.createHandModel(hand2));
        this._scene.add(hand2);

        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1)]);

        const line = new THREE.Line(geometry);
        line.name = 'line';
        line.scale.z = 5;

        controller1.add(line.clone());
        controller2.add(line.clone());
    }

    collideObject(indexTip) {
        const tmpVector1 = new THREE.Vector3();
        const tmpVector2 = new THREE.Vector3();
        const clickables = this._entityManager.FilterComponents('ClickableComponent');
        for (let clickable of clickables) {
            const distance = indexTip.getWorldPosition(tmpVector1).distanceTo(clickable.getWorldPosition(tmpVector2));
            console.log(distance);
            return null;
        }
        return null;
    }

    loadLight() {
        let light = new THREE.AmbientLight(0xFFFFFF, 0.25);
        this._scene.add(light);
    }

    loadEnvironment() {
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
                            case "ExitComponent":
                                currCmp = new interaction_component.ExitComponent(this._messagingManager, cmp.topic);
                                break;
                        }
                        currEntity.AddComponent(currCmp);
                    }
                    this._entityManager.Add(currEntity, '');
                }
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
    _APP = new MyWorld();
});