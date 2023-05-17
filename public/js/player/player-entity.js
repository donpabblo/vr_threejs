import * as THREE from '../three.module.js';

import { FBXLoader } from '../loaders/FBXLoader.js';

import { entity } from './entity.js';
import { finite_state_machine } from './finite-state-machine.js';
import { player_state } from './player-state.js';
import { OBB } from '../math/OBB.js';



export const player_entity = (() => {

  class CharacterFSM extends finite_state_machine.FiniteStateMachine {
    constructor(proxy) {
      super();
      this._proxy = proxy;
      this._Init();
    }

    _Init() {
      this._AddState('idle', player_state.IdleState);
      this._AddState('walk', player_state.WalkState);
      this._AddState('run', player_state.RunState);
      this._AddState('attack', player_state.AttackState);
      this._AddState('death', player_state.DeathState);
    }
  };

  class BasicCharacterControllerProxy {
    constructor(animations) {
      this._animations = animations;
    }

    get animations() {
      return this._animations;
    }
  };


  class BasicCharacterController extends entity.Component {
    constructor(params) {
      super();
      this._Init(params);
    }

    _Init(params) {
      this._params = params;
      this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
      this._acceleration = new THREE.Vector3(1, 0.125, 50.0);
      this._velocity = new THREE.Vector3(0, 0, 0);
      this._position = new THREE.Vector3();

      this._animations = {};
      this._stateMachine = new CharacterFSM(
        new BasicCharacterControllerProxy(this._animations));

      this._LoadModels();
    }

    InitComponent() {
      this._RegisterHandler('health.death', (m) => { this._OnDeath(m); });
    }

    _OnDeath(msg) {
      this._stateMachine.SetState('death');
    }

    _LoadModels() {
      const loader = new FBXLoader();
      loader.setPath('./models/guard/');
      loader.load('castle_guard_01.fbx', (fbx) => {
        this._target = fbx;
        this._target.scale.setScalar(0.035);

        //this._target.userData.obb = new OBB();
        //this._target.userData.obb.halfSize.copy( size ).multiplyScalar( 0.5 );

        this._params.scene.add(this._target);

        this._bones = {};

        for (let b of this._target.children[1].skeleton.bones) {
          this._bones[b.name] = b;
        }

        this._target.traverse(c => {
          c.castShadow = true;
          c.receiveShadow = true;
          if (c.material && c.material.map) {
            c.material.map.encoding = THREE.sRGBEncoding;
          }
        });

        this.Broadcast({
          topic: 'load.character',
          model: this._target,
          bones: this._bones,
        });

        this._mixer = new THREE.AnimationMixer(this._target);

        const _OnLoad = (animName, anim) => {
          const clip = anim.animations[0];
          const action = this._mixer.clipAction(clip);

          this._animations[animName] = {
            clip: clip,
            action: action,
          };
        };

        this._manager = new THREE.LoadingManager();
        this._manager.onLoad = () => {
          this._stateMachine.SetState('idle');
        };

        const loader = new FBXLoader(this._manager);
        loader.setPath('./models/guard/');
        loader.load('Sword And Shield Idle.fbx', (a) => { _OnLoad('idle', a); });
        loader.load('Sword And Shield Run.fbx', (a) => { _OnLoad('run', a); });
        loader.load('Sword And Shield Walk.fbx', (a) => { _OnLoad('walk', a); });
        loader.load('Sword And Shield Slash.fbx', (a) => { _OnLoad('attack', a); });
        loader.load('Sword And Shield Death.fbx', (a) => { _OnLoad('death', a); });
      });
    }

    _FindCollisionsOBB() {
      const objects = this._params.collidables;
      const obbPlayer = this._target.userData.obb;
      for (let j = 0, jl = objects.length; j < jl; j++) {
        const objectToTest = objects[j];
        const obbToTest = objectToTest.userData.obb;
        if (obbPlayer.intersectsOBB(obbToTest) === true) {
          return objectToTest;
        }
      }

    }

    _FindCollisions(pos) {
      var cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
      var playerCube = new THREE.Mesh(cubeGeometry);
      playerCube.position.set(pos.x, 2.5, pos.z);
      var originPoint = playerCube.position.clone();
      for (var vertexIndex = 0; vertexIndex < playerCube.geometry.attributes.position.count; vertexIndex++) {
        var vector = new THREE.Vector3();
        vector.fromBufferAttribute(playerCube.geometry.attributes.position, vertexIndex);
        vector.applyMatrix4(playerCube.matrixWorld);
        var directionVector = vector.sub(playerCube.position);
        var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects(this._params.collidables);
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
          return collisionResults;
        }
        return [];
      }
    }

    _FindCollisionsRayCaster(pos, fwd) {
      let rayCaster = new THREE.Raycaster(new THREE.Vector3(), fwd, 0, 3);
      rayCaster.ray.origin.copy(pos);
      const intersections = rayCaster.intersectObjects( this._params.collidables );
      return intersections;
    }

    _FindIntersections(pos, fwd) {
      const _IsAlive = (c) => {
        const h = c.entity.GetComponent('HealthComponent');
        if (!h) {
          return true;
        }
        return h._health > 0;
      };

      const grid = this.GetComponent('SpatialGridController');
      const nearby = grid.FindNearbyEntities(5).filter(e => _IsAlive(e));
      var collisions = [];

      for (let i = 0; i < nearby.length; ++i) {
        const e = nearby[i].entity;
        const d = ((pos.x - e._position.x) ** 2 + (pos.z - e._position.z) ** 2) ** 0.5;

        // HARDCODED
        if (d <= 4) {
          collisions.push(nearby[i].entity);
        }
      }

      //let objCollisions = this._FindCollisions(pos);
      //let objCollisions = this._FindCollisionsOBB();
      let objCollisions = this._FindCollisionsRayCaster(pos, fwd);
      collisions = collisions.concat(objCollisions);
      return collisions;
    }

    Update(timeInSeconds) {
      if (!this._stateMachine._currentState) {
        return;
      }

      const input = this.GetComponent('BasicCharacterControllerInput');
      this._stateMachine.Update(timeInSeconds, input);

      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }

      // HARDCODED
      if (this._stateMachine._currentState._action) {
        this.Broadcast({
          topic: 'player.action',
          action: this._stateMachine._currentState.Name,
          time: this._stateMachine._currentState._action.time,
        });
      }

      const currentState = this._stateMachine._currentState;
      if (currentState.Name != 'walk' &&
        currentState.Name != 'run' &&
        currentState.Name != 'idle') {
        return;
      }

      const velocity = this._velocity;
      const frameDecceleration = new THREE.Vector3(
        velocity.x * this._decceleration.x,
        velocity.y * this._decceleration.y,
        velocity.z * this._decceleration.z
      );
      frameDecceleration.multiplyScalar(timeInSeconds);
      frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
        Math.abs(frameDecceleration.z), Math.abs(velocity.z));

      velocity.add(frameDecceleration);

      const controlObject = this._target;
      const _Q = new THREE.Quaternion();
      const _A = new THREE.Vector3();
      const _R = controlObject.quaternion.clone();

      const acc = this._acceleration.clone();
      if (input._keys.shift) {
        acc.multiplyScalar(2.0);
      }

      if (input._keys.forward) {
        velocity.z += acc.z * timeInSeconds;
      }
      if (input._keys.backward) {
        velocity.z -= acc.z * timeInSeconds;
      }
      if (input._keys.left) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
        _R.multiply(_Q);
      }
      if (input._keys.right) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
        _R.multiply(_Q);
      }

      controlObject.quaternion.copy(_R);

      const oldPosition = new THREE.Vector3();
      oldPosition.copy(controlObject.position);

      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(controlObject.quaternion);
      forward.normalize();

      const sideways = new THREE.Vector3(1, 0, 0);
      sideways.applyQuaternion(controlObject.quaternion);
      sideways.normalize();

      sideways.multiplyScalar(velocity.x * timeInSeconds);
      forward.multiplyScalar(velocity.z * timeInSeconds);

      const pos = controlObject.position.clone();
      pos.add(forward);
      pos.add(sideways);

      const collisions = this._FindIntersections(pos, forward);
      if (collisions.length > 0) {
        return;
      }

      controlObject.position.copy(pos);
      this._position.copy(pos);

      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);

      //this._target.userData.obb.copy(this._target.geometry.userData.obb);
      //this._target.userData.obb.applyMatrix4(this._target.matrixWorld);
    }

  };

  return {
    BasicCharacterControllerProxy: BasicCharacterControllerProxy,
    BasicCharacterController: BasicCharacterController,
  };

})();