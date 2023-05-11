import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const basePath = './';

class BasicWorldDemo {

    constructor() {
        this.init();
        this.animate();
    }

    init() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.x = -30;
        this.camera.position.y = 64;
        this.camera.position.z = 219;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
        this.scene.fog = new THREE.Fog(0xffffff, 0, 750);

        const light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
        light.position.set(0.5, 1, 0.75);
        this.scene.add(light);

        this.loadAssets();

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        document.body.appendChild(VRButton.createButton(this.renderer));

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        /*
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.listenToKeyEvents( window ); // optional
        this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
		this.controls.dampingFactor = 0.05;
		this.controls.screenSpacePanning = false;
		this.controls.minDistance = 100;
		this.controls.maxDistance = 500;
		this.controls.maxPolarAngle = Math.PI / 2;
        */
    }

    loadAssets() {
        this.loadFloor();
        this.loadSkyBox()
        this.loadRoom();
    }

    animate() {
        this.renderer.setAnimationLoop(() => {
            this.renderer.render(this.scene, this.camera);
        });
       /*
        this.controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
        requestAnimationFrame((time) => {
            this.renderer.render(this.scene, this.camera);
            this.animate();
        });
        */
        //console.log(this.camera.position.x, this.camera.position.y, this.camera.position.z);
    }

    loadFloor() {
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0xFFFFFF }));
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this.scene.add(plane);
    }

    loadRoom() {
        this.loadModel(basePath + '/models/storage_room.glb').then(glb => {
            glb.scene.scale.set(10, 10, 10);
            this.scene.add(glb.scene);
        });
    }

    loadSkyBox() {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            basePath + '/img/posx_.jpg',
            basePath + '/img/negx_.jpg',
            basePath + '/img/posy_.jpg',
            basePath + '/img/negy_.jpg',
            basePath + '/img/posz_.jpg',
            basePath + '/img/negz_.jpg',
        ]);
        this.scene.background = texture;
    }

    async loadModel(path) {
        const loader = new GLTFLoader();
        try {
            const glb = await loader.loadAsync(path);
            return glb;
        } catch (err) {
            console.error(err);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

}

let _APP = null;
window.addEventListener('DOMContentLoaded', () => {
    _APP = new BasicWorldDemo();
});