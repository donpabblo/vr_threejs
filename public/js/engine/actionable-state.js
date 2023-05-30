import { player_state } from './player-state.js'

export const actionable_state = (() => {

  class OnState extends player_state.State {
    constructor(parent) {
      super(parent);
    }

    get Name() {
      return 'on';
    }

    Enter(prevState) {
      this._parent.object.visible = true;
    }

    Exit() {
      console.log("EXITING ON STATE");
    }

    Update(_) {
    }
  };

  class OffState extends player_state.State {
    constructor(parent) {
      super(parent);
    }

    get Name() {
      return 'off';
    }

    Enter(prevState) {
      this._parent.object.visible = false;
    }

    Exit() {
      console.log("EXITING OFF STATE");
    }

    Update(_) {
    }
  };

  return {
    OnState: OnState,
    OffState: OffState
  };

})();