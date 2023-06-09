import { entity } from "./entity.js";
import * as THREE from '../three.module.min.js';

export const controller_input = (() => {

  class IndexTipController extends entity.Component {
    constructor(params) {
      super();
      this._params = params;
      this.clock = new THREE.Clock();
      this.clock.start();
      this.lastInteraction = 0;
    }

    Update() {
      let currentTime = this.clock.getElapsedTime();
      if (currentTime - this.lastInteraction >= 1) {
        const clickables = this._parent._parent.FilterComponents('ClickableComponent');
        for (let clickable of clickables) {
          let curentObject = clickable.object;
          if (this._params.handModel && this._params.handModel.intersectBoxObject(curentObject)) {
            clickable.publish({});
            this.lastInteraction = currentTime;
          }
        }
      }
    }
  };

  class PinchController extends entity.Component {
    constructor(params) {
      super();
      this._params = params;
      this._Init();
    }

    _Init() {
      if (this._params.pinchStart) {
        this._params.hand.addEventListener('pinchstart', this._params.pinchStart);
      }
      if (this._params.pinchEnd) {
        this._params.hand.addEventListener('pinchend', this._params.pinchEnd);
      }
    }
  }

  class Sword extends entity.Component {
    constructor(params) {
      super();
      this._params = params;
      this._Init();
    }

    _Init() {
      const swordMaterial = new THREE.MeshBasicMaterial({ color: 0xdb3236 });
      const sword = new THREE.Mesh(new THREE.BoxGeometry(0.03, 4.0, 0.03), swordMaterial);
      sword.geometry.translate(0, -1.8, 0);
      sword.geometry.rotateX(Math.PI / 2);
      this._params.controller.add(sword);
      const swordLeftHandGuard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.05, 0.2, 6),
        swordMaterial
      );
      swordLeftHandGuard.geometry.rotateX(Math.PI / 2);
      this._params.controller.add(swordLeftHandGuard);
    }
  }

  return {
    IndexTipController: IndexTipController,
    PinchController: PinchController,
    Sword: Sword
  };

})();