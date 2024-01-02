import * as THREE from "three";
import { math } from "./math";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";




const _VS = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;


  const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;



class BackgroundCloud {
  constructor(params) {
    this.params_ = params;
    this.position_ = new THREE.Vector3();
    this.quaternion_ = new THREE.Quaternion();
    this.scale_ = 1.0;
    this.mesh_ = null;

    this.LoadModel_();
  }

  LoadModel_() {
    const loader = new GLTFLoader();
    loader.setPath('/resources/Clouds/GLTF/');
    loader.load('Cloud' + math.rand_int(1, 3) + '.glb', (glb) => {
      this.mesh_ = glb.scene;
      this.params_.scene.add(this.mesh_);

      this.position_.x = math.rand_range(0, 2000);
      this.position_.y = math.rand_range(100, 200);
      this.position_.z = math.rand_range(500, -1000);
      this.scale_ = math.rand_range(10, 20);

      const q = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), math.rand_range(0, 360));
      this.quaternion_.copy(q);

      this.mesh_.traverse(c => {
        if (c.geometry) {
          c.geometry.computeBoundingBox();
        }

        let materials = c.material;
        if (!(c.material instanceof Array)) {
          materials = [c.material];
        }

        for (let m of materials) {
          if (m) {
            m.specular = new THREE.Color(0x000000);
            m.emissive = new THREE.Color(0xC0C0C0);
          }
        }    
        c.castShadow = true;
        c.receiveShadow = true;
      });
    });
  }

  Update(timeElapsed) {
    if (!this.mesh_) {
      return;
    }

    this.position_.x -= timeElapsed * 10;
    if (this.position_.x < -100) {
      this.position_.x = math.rand_range(2000, 3000);
    }

    this.mesh_.position.copy(this.position_);
    this.mesh_.quaternion.copy(this.quaternion_);
    this.mesh_.scale.setScalar(this.scale_);
  }
};

class BackgroundCrap {
  constructor(params) {
    this.params_ = params;
    this.position_ = new THREE.Vector3();
    this.quaternion_ = new THREE.Quaternion();
    this.scale_ = 1.0;
    this.mesh_ = null;

    this.LoadModel_();
  }

  LoadModel_() {
    const assets = [
        ['SmallPalmTree.glb', 'PalmTree.png', 3],
        ['BigPalmTree.glb', 'PalmTree.png', 5],
        ['Skull.glb', 'Ground.png', 1],
        ['Scorpion.glb', 'Scorpion.png', 1],
        ['Pyramid.glb', 'Ground.png', 20],
        ['Monument.glb', 'Ground.png', 10],
        ['Cactus1.glb', 'Ground.png', 5],
        ['Cactus2.glb', 'Ground.png', 5],
        ['Cactus3.glb', 'Ground.png', 5],
    ];
    const [asset, textureName, scale] = assets[math.rand_int(0, assets.length - 1)];

    const texLoader = new THREE.TextureLoader();
    const texture = texLoader.load('/resources/DesertPack/Blend/Textures/' + textureName);
    texture.colorSpace = THREE.SRGBColorSpace;

    const loader = new GLTFLoader();
    loader.setPath('/resources/DesertPack/GLTF/');
    loader.load(asset, (glb) => {
      this.mesh_ = glb.scene;
      this.params_.scene.add(this.mesh_);

      this.position_.x = math.rand_range(0, 2000);
      this.position_.z = math.rand_range(500, -1000);
      this.scale_ = scale;

      const q = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), math.rand_range(0, 360));
      this.quaternion_.copy(q);

      this.mesh_.traverse(c => {
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

  Update(timeElapsed) {
    if (!this.mesh_) {
      return;
    }

    this.position_.x -= timeElapsed * 10;
    if (this.position_.x < -100) {
      this.position_.x = math.rand_range(2000, 3000);
    }

    this.mesh_.position.copy(this.position_);
    this.mesh_.quaternion.copy(this.quaternion_);
    this.mesh_.scale.setScalar(this.scale_);
  }
};

class World {
  constructor(params) {
    this.params_ = params;
    this.clouds_ = [];
    this.crap_ = [];

    this.params_.scene.background = new THREE.Color(0x808080);
    this.params_.scene.fog = new THREE.FogExp2(0x87cefa, 0.002);
    this.creatGround(this.params_.scene);
    this.createSky(this.params_.scene);
    this.setupLight(this.params_.scene);
    this.SpawnClouds_();
    this.SpawnCrap_();
  }

  creatGround(scene) {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20000, 20000, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0xf6f47f,
      })
    );
    ground.castShadow = false;
    ground.receiveShadow = true;
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
  }

  createSky(scene){
    const uniforms = {
      topColor: { value: new THREE.Color(0x0077FF) },
      bottomColor: { value: new THREE.Color(0x89b2eb) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };
    const skyGeo = new THREE.SphereGeometry(1000, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: _VS,
        fragmentShader: _FS,
        side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));
  }

  setupLight(scene){
    let dLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dLight.position.set(60, 100, 10);
    dLight.target.position.set(40, 0, 0);
    dLight.castShadow = true;
    dLight.shadow.bias = -0.001;
    dLight.shadow.mapSize.width = 4096;
    dLight.shadow.mapSize.height = 4096;
    dLight.shadow.camera.far = 200.0;
    dLight.shadow.camera.near = 1.0;
    dLight.shadow.camera.left = 50;
    dLight.shadow.camera.right = -50;
    dLight.shadow.camera.top = 50;
    dLight.shadow.camera.bottom = -50;
    scene.add(dLight);

    let hemiLight = new THREE.HemisphereLight(0x202020, 0x004080, 0.6);
    scene.add(hemiLight);

    // const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    // scene.add(ambientLight);
  }

  SpawnClouds_() {
    for (let i = 0; i < 25; ++i) {
      const cloud = new BackgroundCloud(this.params_);

      this.clouds_.push(cloud);
    }
  }

  SpawnCrap_() {
    for (let i = 0; i < 50; ++i) {
      const crap = new BackgroundCrap(this.params_);

      this.crap_.push(crap);
    }
  }

  update(timeElapsed) {
    for (let c of this.clouds_) {
      c.Update(timeElapsed);
    }
    for (let c of this.crap_) {
      c.Update(timeElapsed);
    }
  }
}


export { World, BackgroundCloud, BackgroundCrap}
