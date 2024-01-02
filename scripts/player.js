import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

class Player {
  constructor(params) {
    this.position_ = new THREE.Vector3(0, 0, 0);
    this.velocity_ = 0.0;
    this.playerBox_ = new THREE.Box3();
    this.gameOver_ = false;
    this.params_ = params;

    this.LoadModel_();
    this.InitInput_();
  }

  LoadModel_() {
    const loader = new FBXLoader();
    loader.setPath('/resources/Dinosaurs/FBX/');
    loader.load('Trex.fbx', (fbx) => {
      fbx.scale.setScalar(0.001);
      fbx.quaternion.setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), Math.PI / 2);

      this.mesh_ = fbx;
      this.params_.scene.add(this.mesh_);

      fbx.traverse(c => {
        let materials = c.material;
        if (!(c.material instanceof Array)) {
          materials = [c.material];
        }

        for (let m of materials) {
          if (m) {
            m.specular = new THREE.Color(0x000000);
            m.color.offsetHSL(0, 0, 0.25);
          }
        }    
        c.castShadow = true;
        c.receiveShadow = true;
      });

      const m = new THREE.AnimationMixer(fbx);
      this.mixer_ = m;

      for (let i = 0; i < fbx.animations.length; ++i) {
        if (fbx.animations[i].name.includes('Run')) {
          const clip = fbx.animations[i];
          const action = this.mixer_.clipAction(clip);
          action.play();
        }
      }
    });
  }

  InitInput_() {
    this.keys_ = {
        spacebar: false,
    };
    this.oldKeys = {...this.keys_};

    document.addEventListener('keydown', (e) => this.OnKeyDown_(e), false);
    document.addEventListener('keyup', (e) => this.OnKeyUp_(e), false);
  }

  OnKeyDown_(event) {
    switch(event.keyCode) {
      case 32:
        this.keys_.space = true;
        break;
    }
  }

  OnKeyUp_(event) {
    switch(event.keyCode) {
      case 32:
        this.keys_.space = false;
        break;
    }
  }

  CheckCollisions_() {
    const colliders = this.params_.obstacleManager.GetColliders();

    this.playerBox_.setFromObject(this.mesh_);

    for (let c of colliders) {
      const cur = c.collider;

      if (cur.intersectsBox(this.playerBox_)) {
        this.gameOver_ = true;
        console.log('hit');
      }
    }
  }

  update(timeElapsed) {
    if (this.keys_.space && this.position_.y == 0.0) {
      this.velocity_ = 30;
    }

    const acceleration = -75 * timeElapsed;

    this.position_.y += timeElapsed * (
        this.velocity_ + acceleration * 0.5);
    this.position_.y = Math.max(this.position_.y, 0.0);

    this.velocity_ += acceleration;
    this.velocity_ = Math.max(this.velocity_, -100);

    if (this.mesh_) {
      this.mixer_.update(timeElapsed);
      this.mesh_.position.copy(this.position_);
      this.CheckCollisions_();
    }
  }
}

export { Player };
