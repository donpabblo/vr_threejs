import { entity } from "./entity.js";

export const controller_input = (() => {

  class IndexTipController extends entity.Component {
    constructor(params) {
      super();
      this._params = params;
      this._Init();
    }

    _Init() {
      this.handModel = this._params.handModel;
    }

    Update() {
      const clickables = this._parent._parent.FilterComponents('ClickableComponent');
      for (let clickable of clickables) {
        let curentObject = clickable.object;
        if (this.handModel && this.handModel.intersectBoxObject(curentObject)) {
          clickable.publish({});
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
      this.hand = this._params.hand;
      if (this._params.pinchstart) {
        hand.addEventListener('pinchstart', this._params.pinchstart);
      }
      if (this._params.pinchend) {
        hand.addEventListener('pinchend', this._params.pinchend);
      }
    }
  }

  return {
    IndexTipController: IndexTipController,
    PinchController: PinchController
  };

})();