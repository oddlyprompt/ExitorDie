import Phaser from 'phaser';
import { gameState } from '../utils/GameState.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.victory = data.victory || false;
  }

  create() {
    // Background
    const bg = this.add.graphics();
    if (this.victory) {
      bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x0a3d2e, 0x0a3d2e, 1);
    } else {
      bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x3d0a0a, 0x3d0a0a, 1);
    }
    bg.fillRect(0, 0, 375, 667);

    // Title
    const titleText = this.victory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = this.victory ? '#4ecdc4' : '#ff6b6b';
    
    this.add.text(187.5, 100, titleText, {
      fontSize: '36px',
      fill: titleColor,
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Run summary
    this.createRunSummary();
    
    // Buttons
    this.createButtons();
    
    // Debug toggle for replay log
    if (process.env.NODE_ENV === 'development') {
      this.createDebugButtons();
    }
  }

  createRunSummary() {
    const summaryContainer = this.add.container(187.5, 280);
    
    // Stats background
    const statsBg = this.add.rectangle(0, 0, 320, 200, 0x333333, 0.8);
    statsBg.setStrokeStyle(2, this.victory ? 0x4ecdc4 : 0xff6b6b);
    
    // Final score (large)
    const scoreText = this.add.text(0, -70, `SCORE: ${gameState.score}`, {
      fontSize: '24px',
      fill: '#feca57',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Run statistics
    const stats = [
      `Depth Reached: ${gameState.depth}`,
      `Artifacts Found: ${gameState.artifacts.length}`,
      `Treasure Value: ${gameState.treasureValue}`,
      `Final Greed: ${gameState.greed}/10`,
      `Rooms Visited: ${gameState.roomsVisited}`
    ];
    
    stats.forEach((stat, index) => {
      const statText = this.add.text(0, -30 + (index * 20), stat, {
        fontSize: '14px',
        fill: '#cccccc',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      summaryContainer.add(statText);
    });
    
    summaryContainer.add([statsBg, scoreText]);
    
    // Show artifacts collected
    if (gameState.artifacts.length > 0) {
      this.createArtifactsList();
    }
  }

  createArtifactsList() {
    const artifactsContainer = this.add.container(187.5, 450);
    
    const title = this.add.text(0, -40, 'ARTIFACTS COLLECTED:', {
      fontSize: '16px',
      fill: '#8b5cf6',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    artifactsContainer.add(title);
    
    gameState.artifacts.slice(0, 3).forEach((artifact, index) => {
      const artifactText = this.add.text(0, -15 + (index * 15), 
        `• ${artifact.name} (${artifact.rarity})`, {
        fontSize: '12px',
        fill: '#cccccc',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      
      artifactsContainer.add(artifactText);
    });
    
    if (gameState.artifacts.length > 3) {
      const moreText = this.add.text(0, 30, `... and ${gameState.artifacts.length - 3} more`, {
        fontSize: '12px',
        fill: '#666666',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      artifactsContainer.add(moreText);
    }
  }

  createButtons() {
    // Retry button
    this.createButton(187.5, 520, 'RETRY', () => this.retry(), '#ff6b6b');
    
    // Title button
    this.createButton(187.5, 570, 'TITLE', () => this.goToTitle(), '#cccccc');
    
    // Submit score button (if backend available)
    this.createButton(187.5, 620, 'SUBMIT SCORE', () => this.submitScore(), '#4ecdc4');
  }

  createButton(x, y, text, callback, color = '#ffffff') {
    const button = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 150, 35, 0x333333, 0.8);
    bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);
    
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '14px',
      fill: color,
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    button.add([bg, buttonText]);
    button.setSize(150, 35);
    button.setInteractive();
    
    button.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.2);
      buttonText.setScale(1.05);
    });
    
    button.on('pointerout', () => {
      bg.setFillStyle(0x333333, 0.8);
      buttonText.setScale(1);
    });
    
    button.on('pointerup', callback);
  }

  createDebugButtons() {
    // Download replay log button
    const debugBtn = this.add.text(10, 10, 'Download Replay', {
      fontSize: '12px',
      fill: '#666666',
      fontFamily: 'Courier New'
    }).setInteractive();
    
    debugBtn.on('pointerup', () => {
      this.downloadReplayLog();
    });
  }

  retry() {
    // Reset game state and start new run with same settings
    const wasDailyRun = gameState.isDailyRun;
    const originalSeed = gameState.seed;
    
    gameState.reset();
    
    if (wasDailyRun) {
      gameState.isDailyRun = true;
      gameState.seed = originalSeed;
    }
    
    this.scene.start('RunScene');
  }

  goToTitle() {
    this.scene.start('TitleScene');
  }

  async submitScore() {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
      
      const scoreData = {
        seed: gameState.seed,
        version: gameState.contentPack.version,
        daily: gameState.isDailyRun,
        score: gameState.score,
        depth: gameState.depth,
        artifacts: gameState.artifacts.length,
        replayLog: gameState.replayLog
      };
      
      // This will be implemented when backend is ready
      console.log('Score submission data:', scoreData);
      
      // Show submission feedback
      const feedback = this.add.text(187.5, 650, 'Score submitted!', {
        fontSize: '12px',
        fill: '#4ecdc4',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: feedback,
        alpha: 0,
        duration: 2000,
        onComplete: () => feedback.destroy()
      });
      
    } catch (error) {
      console.error('Score submission failed:', error);
      
      const errorText = this.add.text(187.5, 650, 'Submission failed', {
        fontSize: '12px',
        fill: '#ff6b6b',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: errorText,
        alpha: 0,
        duration: 2000,
        onComplete: () => errorText.destroy()
      });
    }
  }

  downloadReplayLog() {
    const replayData = JSON.stringify(gameState.replayLog, null, 2);
    const blob = new Blob([replayData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `exit-or-die-replay-${gameState.seed}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}