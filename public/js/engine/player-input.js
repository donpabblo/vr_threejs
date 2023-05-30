import * as THREE from '../three.module.min.js';
import { entity } from "./entity.js";

export const player_input = (() => {

  class BasicCharacterControllerInput extends entity.Component {
    constructor(params) {
      super();
      this._params = params;
      this._Init();
    }

    _Init() {
      this._keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        space: false,
        shift: false,
        dance: false
      };
      this._raycaster = new THREE.Raycaster();
      document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
      document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
      document.addEventListener('mouseup', (e) => this._onMouseUp(e), false);
    }

    _onMouseUp(event) {
      const rect = document.getElementById('threejs').getBoundingClientRect();
      const pos = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: ((event.clientY - rect.top) / rect.height) * -2 + 1,
      };

      //const ray = new THREE.Ray();
      //ray.origin.set(this._parent._position.x, this._parent._position.y, this._parent._position.z);
      //ray.direction.set(pos.x, pos.y, 0.5).unproject(this._params.camera).sub(ray.origin).normalize();

      const ray = new THREE.Ray();
      ray.origin.setFromMatrixPosition(this._params.camera.matrixWorld);
      ray.direction.set(pos.x, pos.y, 0.5).unproject(this._params.camera).sub(ray.origin).normalize();

      //const length = 100;
      //const hex = 0xffff00;
      //const arrowHelper = new THREE.ArrowHelper(ray.direction, ray.origin, length, hex);
      //this._params.scene.add( arrowHelper );
      // hack
      //document.getElementById('quest-ui').style.visibility = 'hidden';
      const clickables = this._parent._parent.FilterComponents('ClickableComponent');
      const playerPosition = new THREE.Vector3(this._parent._position.x, this._parent._position.y, this._parent._position.z);
      for (let p of clickables) {
        const box = new THREE.Box3().setFromObject(p.object);
        const center = new THREE.Vector3();
        box.getCenter(center);
        if (ray.intersectsBox(box) && center.distanceTo(playerPosition) < 9) {
          p.publish({});
        }
      }
      /*
      for (let p of pickables) {
        // GOOD ENOUGH
        const box = new THREE.Box3().setFromObject(p._mesh);

        if (ray.intersectsBox(box)) {
          p.Broadcast({
              topic: 'input.picked'
          });
          break;
        }
      }
      */
    }

    _onKeyDown(event) {
      switch (event.keyCode) {
        case 87: // w
        case 38:
          this._keys.forward = true;
          break;
        case 65: // a
        case 37:
          this._keys.left = true;
          break;
        case 83: // s
        case 40:
          this._keys.backward = true;
          break;
        case 68: // d
        case 39:
          this._keys.right = true;
          break;
        case 32: // SPACE
          this._keys.space = true;
          break;
        case 16: // SHIFT
          this._keys.shift = true;
          break;
        case 80: // p
          this._keys.dance = true;
          break;
      }
    }

    _onKeyUp(event) {
      switch (event.keyCode) {
        case 87: // w
        case 38:
          this._keys.forward = false;
          break;
        case 65: // a
        case 37:
          this._keys.left = false;
          break;
        case 83: // s
        case 40:
          this._keys.backward = false;
          break;
        case 68: // d
        case 39:
          this._keys.right = false;
          break;
        case 32: // SPACE
          this._keys.space = false;
          break;
        case 16: // SHIFT
          this._keys.shift = false;
          break;
        case 80: // p
          this._keys.dance = false;
          break;
      }
    }
  };

  return {
    BasicCharacterControllerInput: BasicCharacterControllerInput
  };

})();