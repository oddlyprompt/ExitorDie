import Phaser from 'phaser';
import { setSeed, gameRNG } from '../utils/SeededRNG.js';
import { gameState } from '../utils/GameState.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    // Background gradient effect
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x2d1b69, 0x2d1b69, 1);
    gradient.fillRect(0, 0, 375, 667);

    // Title
    this.add.text(187.5, 150, 'EXIT\nOR\nDIE', {
      fontSize: '48px',
      fill: '#ff6b6b',
      fontFamily: 'Courier New',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(187.5, 250, 'A Roguelike Adventure', {
      fontSize: '16px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Menu buttons
    this.createButton(187.5, 320, 'NEW RUN', () => this.startNewRun());
    this.createButton(187.5, 370, 'DAILY RUN', () => this.startDailyRun());
    this.createButton(187.5, 420, 'HIGH SCORES', () => this.showHighScores());
    this.createButton(187.5, 470, 'CODEX', () => this.showCodex());
    this.createButton(187.5, 520, 'OPTIONS', () => this.showOptions());

    // Fullscreen button
    this.createButton(187.5, 600, 'FULLSCREEN', () => this.toggleFullscreen());

    // Version info
    this.add.text(10, 650, 'v1.0.0', {
      fontSize: '12px',
      fill: '#666666',
      fontFamily: 'Courier New'
    });
  }

  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);
    
    // Button background
    const bg = this.add.rectangle(0, 0, 200, 40, 0x333333, 0.8);
    bg.setStrokeStyle(2, 0xff6b6b);
    
    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(200, 40);
    button.setInteractive();

    // Hover effects
    button.on('pointerover', () => {
      bg.setFillStyle(0xff6b6b, 0.3);
      buttonText.setScale(1.05);
    });

    button.on('pointerout', () => {
      bg.setFillStyle(0x333333, 0.8);
      buttonText.setScale(1);
    });

    button.on('pointerdown', () => {
      buttonText.setScale(0.95);
    });

    button.on('pointerup', () => {
      buttonText.setScale(1.05);
      callback();
    });

    return button;
  }

  startNewRun() {
    gameState.reset();
    gameState.isDailyRun = false;
    
    // Generate new seed
    const seed = Date.now() + gameRNG.nextInt(0, 999999);
    setSeed(seed);
    gameState.seed = seed;
    
    this.scene.start('RunScene');
  }

  startDailyRun() {
    gameState.reset();
    gameState.isDailyRun = true;
    
    // Use daily seed (or generate one if backend unavailable)
    const dailySeed = gameState.dailySeed || this.getDailySeed();
    setSeed(dailySeed);
    gameState.seed = dailySeed;
    
    this.scene.start('RunScene');
  }

  getDailySeed() {
    // Generate consistent daily seed based on current date
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = ((hash << 5) - hash + today.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash);
  }

  showHighScores() {
    this.scene.start('HighScoresScene');
  }

  showCodex() {
    this.scene.start('CodexScene');
  }

  showOptions() {
    // Options modal (placeholder)
    const modal = this.add.container(187.5, 333.5);
    
    const bg = this.add.rectangle(0, 0, 300, 400, 0x000000, 0.9);
    bg.setStrokeStyle(2, 0xff6b6b);
    
    const title = this.add.text(0, -150, 'OPTIONS', {
      fontSize: '24px',
      fill: '#ff6b6b',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    const closeBtn = this.add.text(120, -170, 'X', {
      fontSize: '20px',
      fill: '#ff6b6b',
      fontFamily: 'Courier New'
    }).setOrigin(0.5).setInteractive();

    closeBtn.on('pointerup', () => {
      modal.destroy();
    });

    modal.add([bg, title, closeBtn]);
  }

  toggleFullscreen() {
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
    } else {
      this.scale.startFullscreen();
    }
  }
}