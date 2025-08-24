import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { RunScene } from './scenes/RunScene.js';
import { LootRevealScene } from './scenes/LootRevealScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { HighScoresScene } from './scenes/HighScoresScene.js';
import { CodexScene } from './scenes/CodexScene.js';
import { OptionsScene } from './scenes/OptionsScene.js';

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 375,
  height: 667,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 375,
    height: 667
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [
    BootScene,
    TitleScene, 
    RunScene,
    LootRevealScene,
    GameOverScene,
    HighScoresScene,
    CodexScene,
    OptionsScene
  ]
};

// Create game instance
const game = new Phaser.Game(config);

// Global game reference for fullscreen toggle
window.game = game;

// Fullscreen button functionality
window.toggleFullscreen = () => {
  if (game.scale.isFullscreen) {
    game.scale.stopFullscreen();
  } else {
    game.scale.startFullscreen();
  }
};

export default game;