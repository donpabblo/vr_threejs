import * as THREE from './three.module.min.js';
import { GLTFLoader } from './loaders/GLTFLoader.js';
import { XRButton } from './webxr/XRButton.js';

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
            document.body.appendChild(XRButton.createButton(this._renderer));
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
            this._camera.position.set(0, 18, 10);
        }

        this._scene = new THREE.Scene();
        this._entityManager = new entity_manager.EntityManager();
        this._messagingManager = new messaging_manager.MessagingManager();

        this.loadLight();
        this.loadEnvironment();
        if (this._avatar) {
            this.loadPlayer();
        }
        this._previousRAF = null;
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
                if (this._previousRAF === null) {
                    this._previousRAF = time;
                }
                this._renderer.render(this._scene, this._camera);
                this.step(time - this._previousRAF);
                this._previousRAF = time;
            });
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

    loadLight() {
        let light = new THREE.AmbientLight(0xFFFFFF, 0.25);
        this._scene.add(light);
    }

    loadEnvironment() {
        this.loadModel('models/' + this._environment).then(glb => {
            if (this._avatar) {
                glb.scene.scale.set(5, 5, 5);
            } else {
                glb.scene.scale.set(2, 2, 2);
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