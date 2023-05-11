import * as THREE from 'three';
import { Vector3 } from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class BasicWorldDemo {

    constructor() {
        this.objects = [];
        this.boxes = {};

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.prevTime = null;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.vertex = new THREE.Vector3();
        this.color = new THREE.Color();

        this.pointer = new THREE.Vector2();
        this.radius = 100;
        this.raycaster = new THREE.Raycaster();
        this.previousIntersected = null;

        this.init();
        this.animate();
    }

    init() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

        this.scene = new THREE.Scene();
        //this.scene.background = new THREE.Color(0xffffff);
        //this.scene.fog = new THREE.Fog(0xffffff, 0, 750);

        const light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
        light.position.set(0.5, 1, 0.75);
        this.scene.add(light);

        this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 30);

        this.loadControls();
        this.loadAssets();


        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('mousemove', (event) => {
            this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    loadAssets() {
        //this.loadFloor();
        this.loadSkyBox()
        this.loadRoom();
    }

    animate() {
        requestAnimationFrame((time) => {
            if (this.prevTime === null) {
                this.prevTime = time;
            }
            this.manageControls(time);
            this.manageInteraction();
            this.renderer.render(this.scene, this.camera);
            this.prevTime = time;
            this.animate();
        });

    }

    manageInteraction() {
        if (!this.controls.isLocked) {
            const overlay = document.getElementById('overlay');
            this.raycaster.setFromCamera(this.pointer, this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children, false);
            if (intersects.length > 0) {
                if (this.previousIntersected != intersects[0].object && intersects[0].object.userData.type === "box") {
                    this.previousIntersected = intersects[0].object;
                    overlay.innerHTML += '<span><strong>Mittente: </strong>' + this.previousIntersected.userData.info.mittente + '</span>';
                    overlay.innerHTML += '<span><strong>Destinatario: </strong>' + this.previousIntersected.userData.info.destinatario + '</span>';
                    overlay.innerHTML += '<span><strong>Peso: </strong>' + this.previousIntersected.userData.info.peso + '</span>';
                    overlay.innerHTML += '<span><strong>Destinazione: </strong>' + this.previousIntersected.userData.info.destinazione + '</span>';
                    overlay.style.display = '';
                }
            } else {
                this.previousIntersected = null;
                overlay.style.display = 'none';
                overlay.innerHTML = '';
            }
        }
    }

    manageControls(time) {
        if (this.controls.isLocked === true) {
            document.getElementById('overlay').style.display = 'none';
            this.raycaster.ray.origin.copy(this.controls.getObject().position);
            this.raycaster.ray.origin.y -= 10;

            const intersections = this.raycaster.intersectObjects(this.objects, false);
            const onObject = intersections.length > 0;
            const delta = (time - this.prevTime) / 1000;
            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;
            this.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize(); // this ensures consistent movements in all directions
            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 400.0 * delta;
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 400.0 * delta;

            if (onObject === true) {
                this.velocity.y = Math.max(0, this.velocity.y);
                this.canJump = true;
            }

            this.controls.moveRight(- this.velocity.x * delta);
            this.controls.moveForward(- this.velocity.z * delta);

            /*
            this.controls.getObject().position.y += (this.velocity.y * delta); // new behavior
            if (this.controls.getObject().position.y < 10) {
                this.velocity.y = 0;
                this.controls.getObject().position.y = 10;
                this.canJump = true;
            }
            */
        }
    }

    loadControls() {
        this.controls = new PointerLockControls(this.camera, document.body);

        const info = document.getElementById('info');
        info.addEventListener('click', () => {
            this.controls.lock();
        });
        this.controls.addEventListener('lock', function () {
            info.innerHTML = "ESC to interact with objects";
        });
        this.controls.addEventListener('unlock', function () {
            info.innerHTML = "Click here to play: Move: WASD, Look: MOUSE, Camera Up/Down UI";
        });

        this.scene.add(this.controls.getObject());
        this.controls.getObject().position.y += 10;
        this.controls.moveForward(-30);

        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (this.canJump === true) this.velocity.y += 350;
                    this.canJump = false;
                    break;
                case 'KeyU':
                    this.controls.getObject().position.y += 1;
                    break;
                case 'KeyI':
                    this.controls.getObject().position.y -= 1;
                    break;
            }
        });
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
                case 'Escape':
                    document.getElementById('overlay').style.display = 'none';
                    break;
            }
        });
    }

    loadFloor() {
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0xFFFFFF }));
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this.scene.add(plane);

        /*
        // floor
        let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
        floorGeometry.rotateX(- Math.PI / 2);
        // vertex displacement
        let position = floorGeometry.attributes.position;
        for (let i = 0, l = position.count; i < l; i++) {
            this.vertex.fromBufferAttribute(position, i);
            this.vertex.x += Math.random() * 20 - 10;
            this.vertex.y += Math.random() * 2;
            this.vertex.z += Math.random() * 20 - 10;
            position.setXYZ(i, this.vertex.x, this.vertex.y, this.vertex.z);
        }
        floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices
        position = floorGeometry.attributes.position;
        const colorsFloor = [];
        for (let i = 0, l = position.count; i < l; i++) {
            this.color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
            colorsFloor.push(this.color.r, this.color.g, this.color.b);
        }
        floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsFloor, 3));
        const floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.scene.add(floor);
        */
    }

    loadRoom() {
        this.loadModel('models/mersus.gltf').then(glb => {
            glb.scene.scale.set(10, 10, 10);
            this.scene.add(glb.scene);
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


    loadMockBoxes() {
        const yOffset = 3;
        const zOffset = 3;
        let mock = [{
            id: "1",
            size: { x: 3, y: 3, z: 3 },
            position: { x: 3, y: 3.9, z: 0 },
            type: "big",
            info: { mittente: "Giancarlo Magalli", destinatario: "Pippo Baudo", peso: "1.4Kg", destinazione: "Piazza Mazzini, 24 - 001000 Roma" }
        },
        {
            id: "3",
            size: { x: 3, y: 3, z: 3 },
            position: { x: 3, y: 11.7, z: 0 },
            type: "big",
            info: { mittente: "Mike Bongiorno", destinatario: "Carlo Conti", peso: "13.8Kg", destinazione: "Via Giulio Cesare, 132 - 001000 Roma" }
        }
        ];
        for (let box of mock) {
            box.position.z += zOffset;
            box.position.y += yOffset;
            let newBox = this.newBox(box);
            this.boxes[box.id] = newBox;
            this.scene.add(newBox);
        }
    }

    newBox(box) {
        const color = new THREE.Color();
        const boxGeometry = new THREE.BoxGeometry(box.size.x, box.size.y, box.size.z).toNonIndexed();
        let position = boxGeometry.attributes.position;
        const colorsBox = [];
        for (let i = 0, l = position.count; i < l; i++) {
            color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
            colorsBox.push(color.r, color.g, color.b);
        }
        boxGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsBox, 3));
        //const boxMaterial = new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: true });
        const texture = new THREE.TextureLoader().load('textures/crate.gif');
        const boxMaterial = new THREE.MeshBasicMaterial({ map: texture });
        boxMaterial.color.setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75);

        const newBox = new THREE.Mesh(boxGeometry, boxMaterial);
        newBox.position.x = box.position.x;
        newBox.position.y = box.position.y;
        newBox.position.z = box.position.z;
        newBox.userData = { type: "box", info: box.info };
        return newBox;
    }
}

let _APP = null;
window.addEventListener('DOMContentLoaded', () => {
    _APP = new BasicWorldDemo();
});