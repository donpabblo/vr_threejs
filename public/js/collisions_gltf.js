import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBB } from 'three/addons/math/OBB.js';
import { entity } from './player/entity.js';
import { player_entity } from './player/player-entity.js'
import { player_input } from './player/player-input.js';
import { third_person_camera } from './player/third-person-camera.js';
import { entity_manager } from './player/entity-manager.js';
import { spatial_hash_grid } from './player/spatial-hash-grid.js';
import { spatial_grid_controller } from './player/spatial-grid-controller.js';

class BasicWorldDemo {

    constructor() {
        this._previousRAF = null;
        this.collidableMeshList = [];

        this.init();
        this.animate();

    }

    init() {
        this._threejs = new THREE.WebGLRenderer({
            antialias: true,
        });
        this._threejs.outputEncoding = THREE.sRGBEncoding;
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);
        this._threejs.domElement.id = 'threejs';

        document.body.appendChild(this._threejs.domElement);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 1000.0;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(25, 10, 25);

        this._scene = new THREE.Scene();
        this._entityManager = new entity_manager.EntityManager();
        this._grid = new spatial_hash_grid.SpatialHashGrid([[-1000, -1000], [1000, 1000]], [100, 100]);

        this.loadAssets();
        this.loadPlayer();

        this._mixers = [];
        this._previousRAF = null;

    }

    loadPlayer() {
        const params = {
            camera: this._camera,
            scene: this._scene,
            collidables: this.collidableMeshList
        };
        const player = new entity.Entity();
        player.AddComponent(new player_input.BasicCharacterControllerInput(params));
        player.AddComponent(new player_entity.BasicCharacterController(params));
        player.AddComponent(new spatial_grid_controller.SpatialGridController({ grid: this._grid }));
        this._entityManager.Add(player, 'player');

        const camera = new entity.Entity();
        camera.AddComponent(
            new third_person_camera.ThirdPersonCamera({
                camera: this._camera,
                target: this._entityManager.Get('player')
            }));
        this._entityManager.Add(camera, 'player-camera');

    }

    loadAssets() {
        this.loadLight();
        //this.loadFloor();
        this.loadSkyBox()
        this.loadControls();
        //this.loadWall();
        this.loadGltf();
    }

    loadWall() {
        var material = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            side: THREE.DoubleSide
        });

        var geometryLateral = new THREE.BoxGeometry(30, 20, 1);
        var wall1 = new THREE.Mesh(geometryLateral, material);
        wall1.position.x = 30;

        //wall1.userData.obb = new OBB();
        this.collidableMeshList.push(wall1);
        this._scene.add(wall1);
    }

    animate() {
        requestAnimationFrame((time) => {
            if (this._previousRAF === null) {
                this._previousRAF = time;
            }
            this.animate();
            this._threejs.render(this._scene, this._camera);
            this.step(time - this._previousRAF);
            this._previousRAF = time;
        });
    }

    step(timeElapsed) {
        const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
        this._entityManager.Update(timeElapsedS);
    }

    loadControls() {
        const controls = new OrbitControls(
            this._camera, this._threejs.domElement);
        controls.target.set(0, 10, 0);
        controls.update();
    }

    loadLight() {
        let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        light.position.set(-100, 100, 100);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.001;
        light.shadow.mapSize.width = 4096;
        light.shadow.mapSize.height = 4096;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.left = 50;
        light.shadow.camera.right = -50;
        light.shadow.camera.top = 50;
        light.shadow.camera.bottom = -50;
        this._scene.add(light);
        light = new THREE.AmbientLight(0xFFFFFF, 0.25);
        this._scene.add(light);
    }

    loadFloor() {
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 10, 10),
            new THREE.MeshStandardMaterial({
                color: 0x808080,
            }));
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this._scene.add(plane);
    }

    loadGltf() {
        this.loadModel('models/office.gltf').then(glb => {
            glb.scene.scale.set(5, 5, 5);
            this._scene.add(glb.scene);
            let chair = this._scene.getObjectByName("Scene");
            this.collidableMeshList.push(chair);
        });
    }

    loadSkyBox() {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            './img/posx_.jpg',
            './img/negx_.jpg',
            './img/posy_.jpg',
            './img/negy_.jpg',
            './img/posz_.jpg',
            './img/negz_.jpg',
        ]);
        texture.encoding = THREE.sRGBEncoding;
        this._scene.background = texture;
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
    _APP = new BasicWorldDemo();
});