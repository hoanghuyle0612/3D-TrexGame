import * as THREE from "three";
import { math } from "./math.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

const START_POS = 100;
const SEPARATION_DISTANCE = 20;

class Obstacles {
  constructor(params) {
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.scale = 1.0;
    this.collider = new THREE.Box3();

    this.params_ = params;
    this.LoadModel_();
  }

  LoadModel_() {
    const texLoader = new THREE.TextureLoader();
    const texture = texLoader.load(
      "/resources/DesertPack/Blend/Textures/Ground.png"
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    const loader = new FBXLoader();
    loader.setPath("/resources/DesertPack/FBX/");
    loader.load("Cactus3.fbx", (fbx) => {
      fbx.scale.setScalar(0.01);
      this.mesh = fbx;
      this.params_.scene.add(this.mesh);

      fbx.traverse((c) => {
        if (c.geometry) {
          c.geometry.computeBoundingBox();
        }

        let materials = c.material;
        if (!(c.material instanceof Array)) {
          materials = [c.material];
        }
        for (let m of materials) {
          if (m) {
            if (texture) {
              m.map = texture;
            }
            m.specular = new THREE.Color(0x000000);
          }
        }
        c.castShadow = true;
        c.receiveShadow = true;
      });
    });
  }

  updateCollider_() {
    this.collider.setFromObject(this.mesh);
  }
  update(timeElapsed) {
    if (!this.mesh) {
      return;
    }
    this.mesh.position.copy(this.position);
    this.mesh.quaternion.copy(this.quaternion);
    this.mesh.scale.setScalar(this.scale);
    this.updateCollider_();
  }
}

class ObstaclesManager {
  constructor(params) {
    this.obstacles = [];
    this.unusedObstacles = [];
    this.speed = 20;
    this.params_ = params;
    this.separationDistance = SEPARATION_DISTANCE;
  }

  GetColliders() {
    return this.obstacles;
  }

  LastObjectPosition() {
    if (this.obstacles.length == 0) {
      return SEPARATION_DISTANCE;
    }

    return this.obstacles[this.obstacles.length - 1].position.x;
  }

  SpawnObstacle(scale, offset) {
    let obstacle = null;
    if (this.unusedObstacles.length > 0) {
      obstacle = this.unusedObstacles.pop();
      obstacle.mesh.visible = true;
    } else {
      obstacle = new Obstacles(this.params_);
    }
    obstacle.quaternion.setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.random() * Math.PI * 2.0
    );
    obstacle.position.x = START_POS + offset;
    obstacle.scale = scale * 0.01;
    this.obstacles.push(obstacle);
  }

  SpawnCluster() {
    const scaleIndex = math.rand_int(0, 1);
    const scales = [1, 0.5];
    const ranges = [2, 3];
    const scale = scales[scaleIndex];
    const numObjects = math.rand_int(1, ranges[scaleIndex]);

    for (let i = 0; i < numObjects; ++i) {
      const offset = i * 1 * scale;
      this.SpawnObstacle(scale, offset);
      
    }
  }

  MaybeSpawn() {
    const closest = this.LastObjectPosition();
    if (Math.abs(START_POS - closest) > this.separationDistance) {
      this.SpawnCluster();
      this.separationDistance = math.rand_range(
        SEPARATION_DISTANCE,
        SEPARATION_DISTANCE * 1.5
      );
    }
  }

  update(timeElapsed) {
    this.MaybeSpawn();
    this.updateColliders(timeElapsed);
  }

  updateColliders(timeElapsed) {
    const invisible = [];
    const visible = [];

    for (let obj of this.obstacles) {
      obj.position.x -= timeElapsed * this.speed;

      if (obj.position.x < -20) {
        invisible.push(obj);
        obj.mesh.visible = false;
      } else {
        visible.push(obj);
      }
      obj.update(timeElapsed);
    }

    this.obstacles = visible;
    this.unusedObstacles.push(...invisible);
  }
}

export { ObstaclesManager, Obstacles };
