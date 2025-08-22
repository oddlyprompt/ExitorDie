import Phaser from 'phaser';
import { gameState } from '../utils/GameState.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    console.log('🎯 GameOverScene create() called');
    try {
      // Background
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x4a0000, 0x4a0000, 1);
      bg.fillRect(0, 0, 375, 667);

      // Game Over text
      this.add.text(187.5, 150, 'GAME OVER', {
        fontSize: '36px',
        fill: '#ff6b6b',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);

      // Death message based on cause
      const deathMessage = this.getDeathMessage();
      this.add.text(187.5, 200, deathMessage, {
        fontSize: '14px',
        fill: '#cccccc',
        fontFamily: 'Courier New',
        align: 'center',
        wordWrap: { width: 300 }
      }).setOrigin(0.5);

      // Stats display
      console.log('🎯 Creating stats display...');
      this.displayStats();

      // Buttons
      console.log('🎯 Creating buttons...');
      this.createButton(187.5, 500, 'NEW RUN', () => this.newRun());
      this.createButton(187.5, 550, 'HIGH SCORES', () => this.showHighScores());
      this.createButton(187.5, 600, 'TITLE SCREEN', () => this.returnToTitle());

      // Auto-submit score if we have a username
      if (gameState.username) {
        console.log('🎯 Auto-submitting score for user:', gameState.username);
        this.submitScore();
      }
      
      console.log('✅ GameOverScene created successfully');
    } catch (error) {
      console.error('❌ Error in GameOverScene create():', error);
      console.error('❌ Error stack:', error.stack);
    }
  }

  getDeathMessage() {
    const messages = {
      'cursed_treasure': "The cursed gold claimed your soul...",
      'room_hazard': "The dungeon's dangers overwhelmed you...",
      'greed': "Your greed became your downfall...",
      'bad_luck': "Fortune was not on your side...",
      'default': "You fell to the dungeon's perils..."
    };
    
    return messages[gameState.deathCause] || messages.default;
  }

  displayStats() {
    const stats = [
      `Depth Reached: ${gameState.depth}`,
      `Rooms Visited: ${gameState.roomsVisited}`,
      `Treasure Value: ${gameState.treasureValue}`,
      `Final Score: ${gameState.score}`,
      ''
    ];

    // Add equipped items if any
    if (gameState.inventory.length > 0) {
      stats.push('Items Found:');
      gameState.inventory.forEach(item => {
        stats.push(`• ${item.name} (${item.rarity})`);
      });
    }

    if (gameState.equippedArtifacts.length > 0) {
      stats.push('');
      stats.push('Equipped Artifacts:');
      gameState.equippedArtifacts.forEach(artifact => {
        stats.push(`• ${artifact.name}`);
      });
    }

    this.add.text(187.5, 280, stats.join('\n'), {
      fontSize: '12px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      align: 'center'
    }).setOrigin(0.5);
  }

  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);
    
    // Button background
    const bg = this.add.rectangle(0, 0, 180, 30, 0x333333, 0.8);
    bg.setStrokeStyle(2, 0xff6b6b);
    
    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '12px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(180, 30);
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

  async submitScore() {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
      
      const response = await fetch(`${backendUrl}/api/score/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: gameState.username,
          score: gameState.score,
          depth: gameState.depth,
          seed: gameState.seed,
          seedString: gameState.seedString || null,
          isDailyRun: gameState.isDailyRun,
          treasureValue: gameState.treasureValue,
          roomsVisited: gameState.roomsVisited,
          equippedItems: gameState.equippedArtifacts.map(item => item.name),
          replayLog: gameState.replayLog
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Score submitted successfully:', result);
        
        // Show confirmation if needed
        if (result.validated) {
          this.add.text(187.5, 450, 'Score submitted and validated!', {
            fontSize: '10px',
            fill: '#4ecdc4',
            fontFamily: 'Courier New'
          }).setOrigin(0.5);
        }
      } else {
        console.warn('Failed to submit score');
      }
    } catch (error) {
      console.warn('Error submitting score:', error);
    }
  }

  newRun() {
    this.scene.start('TitleScene');
  }

  showHighScores() {
    this.scene.start('HighScoresScene');
  }

  returnToTitle() {
    this.scene.start('TitleScene');
  }
}