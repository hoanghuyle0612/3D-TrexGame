import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {ObstaclesManager} from "./obstacleManager.js";

import { World } from "./world.js";
import { Player } from "./player.js";

export class Game {
  constructor(scene, camera) {

    this._initializeScreen(scene, camera);
    this._gameStarted = true;
    this.gameOver = false;

    this.score = 0.0;
    this.scoreText_ = '00000';

    this.world = new World({scene});
    this.obstacleManager = new ObstaclesManager({scene});
    this.player = new Player({ scene: scene, obstacleManager: this.obstacleManager });

  }
  restart(){
    document.getElementById('game-over').classList.toggle('inactive');
    this._gameStarted = true;
  }

  GameOver(){
    return this.gameOver;
  }

  GameStarted(){
    return this._gameStarted;
  }

  update(timeElapsed){
    if (this.gameOver || !this._gameStarted) {
      console.log("gameover");
      return;
    }
    this.obstacleManager.update(timeElapsed);
    this.world.update(timeElapsed);
    this.player.update(timeElapsed);
    this.UpdateScore(timeElapsed);
    if (this.player.gameOver_) {
      this._gameOver();
    }
  }
  _gameOver() {
    console.log("game over");
    document.getElementById('game-over').classList.toggle('active');
    this.gameOver = true;
  }

  _initializeScreen(scene, camera) {
    camera.position.set(-5, 5, 10);
    camera.lookAt(8, 3, 0);
    // const controls = new OrbitControls(camera, document.body);
  
  }
  UpdateScore(timeElapsed) {
    this.score += timeElapsed * 10.0;
    const scoreText = Math.round(this.score).toLocaleString(
        'en-US', {minimumIntegerDigits: 5, useGrouping: false});

    if (scoreText == this.scoreText_) {
      return;
    }
    document.getElementById('score-text').innerText = scoreText;
  }
}
