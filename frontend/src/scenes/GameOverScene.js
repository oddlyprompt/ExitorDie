// frontend/src/scenes/GameOverScene.js
import Phaser from 'phaser';
// Rename the import so it doesn't clash with the method name below
import { submitScore as recordScore } from '../utils/leaderboard.js';
import { gameState } from '../utils/GameState.js';
import { audioSystem } from '../utils/AudioSystem.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    // Was this a victory (exit) or a death?
    this.isVictory = !!(data && data.victory);
    console.log('🎯 GameOverScene init - isVictory:', this.isVictory);
  }

  create() {
    console.log('🎯 GameOverScene create() called');

    try {
      // ----- Background (green for victory, red for death)
      const bg = this.add.graphics();
      if (this.isVictory) {
        bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x004a00, 0x004a00, 1);
      } else {
        bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x4a0000, 0x4a0000, 1);
      }
      bg.fillRect(0, 0, 375, 667);

      // ----- Title
      const titleText = this.isVictory ? 'VICTORY!' : 'GAME OVER';
      const titleColor = this.isVictory ? '#4ecdc4' : '#ff6b6b';

      if (this.isVictory) audioSystem.playVictory();

      this.add.text(187.5, 150, titleText, {
        fontSize: '36px',
        fill: titleColor,
        fontFamily: 'Courier New'
      }).setOrigin(0.5);

      // ----- Message
      const message = this.isVictory ? this.getVictoryMessage() : this.getDeathMessage();
      this.add.text(187.5, 200, message, {
        fontSize: '14px',
        fill: '#cccccc',
        fontFamily: 'Courier New',
        align: 'center',
        wordWrap: { width: 300 }
      }).setOrigin(0.5);

      // ----- Stats
      console.log('🎯 Creating stats display...');
      this.displayStats();

      // ----- Buttons
      console.log('🎯 Creating buttons...');
      this.createButton(187.5, 500, 'NEW RUN', () => this.newRun());
      this.createButton(187.5, 550, 'HIGH SCORES', () => this.showHighScores());
      this.createButton(187.5, 600, 'TITLE SCREEN', () => this.returnToTitle());

      // ----- Auto-submit score if we have a username
      if (gameState.username) {
        console.log('🎯 Auto-submitting score for user:', gameState.username);
        this.submitScore(); // calls the method below
      }

      console.log('✅ GameOverScene created successfully');
    } catch (error) {
      console.error('❌ Error in GameOverScene create():', error);
      console.error('❌ Error stack:', error.stack);
    }
  }

  getDeathMessage() {
    const messages = {
      cursed_treasure: "The cursed gold claimed your soul...",
      room_hazard: "The dungeon's dangers overwhelmed you...",
      greed: "Your greed became your downfall...",
      bad_luck: "Fortune was not on your side...",
      default: "You fell to the dungeon's perils..."
    };
    return messages[gameState.deathCause] || messages.default;
  }

  getVictoryMessage() {
    const victoryMessages = [
      "You emerged from the depths with your treasures!",
      "Fortune smiled upon you as you escaped the dungeon!",
      "Your courage and cunning led you to victory!",
      "The darkness could not claim you this day!",
      "You've proven yourself a true treasure hunter!"
    ];
    const messageIndex = (gameState.depth || 0) % victoryMessages.length;
    return victoryMessages[messageIndex];
  }

  displayStats() {
    console.log('🎯 displayStats called with gameState:', gameState);

    try {
      const stats = [
        `Depth Reached: ${gameState.depth || 0}`,
        `Rooms Visited: ${gameState.roomsVisited || 0}`,
        `Treasure Value: ${gameState.treasureValue || 0}`,
        `Final Score: ${gameState.score || 0}`,
        ''
      ];

      const inventory = gameState.inventory || [];
      if (inventory.length > 0) {
        stats.push('Items Found:');
        inventory.forEach(item => {
          const itemName = item?.name || 'Unknown Item';
          const itemRarity = item?.rarity || 'Unknown';
          stats.push(`• ${itemName} (${itemRarity})`);
        });
      }

      const equippedArtifacts = gameState.equippedArtifacts || [];
      if (equippedArtifacts.length > 0) {
        stats.push('');
        stats.push('Equipped Artifacts:');
        equippedArtifacts.forEach(artifact => {
          const artifactName = artifact?.name || 'Unknown Artifact';
          stats.push(`• ${artifactName}`);
        });
      }

      this.add.text(187.5, 280, stats.join('\n'), {
        fontSize: '12px',
        fill: '#ffffff',
        fontFamily: 'Courier New',
        align: 'center'
      }).setOrigin(0.5);

      console.log('✅ Stats displayed successfully');
    } catch (error) {
      console.error('❌ Error in displayStats:', error);
      this.add.text(187.5, 280, 'Game statistics unavailable', {
        fontSize: '12px',
        fill: '#ffffff',
        fontFamily: 'Courier New',
        align: 'center'
      }).setOrigin(0.5);
    }
  }

  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 180, 30, 0x333333, 0.8);
    bg.setStrokeStyle(2, 0xff6b6b);

    const buttonText = this.add.text(0, 0, text, {
      fontSize: '12px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(180, 30);
    button.setInteractive();

    button.on('pointerover', () => {
      bg.setFillStyle(0xff6b6b, 0.3);
      buttonText.setScale(1.05);
    });

    button.on('pointerout', () => {
      bg.setFillStyle(0x333333, 0.8);
      buttonText.setScale(1);
    });

    button.on('pointerdown', () => buttonText.setScale(0.95));
    button.on('pointerup', () => {
      buttonText.setScale(1.05);
      callback();
    });

    return button;
  }

  // ===== fixed version (no recursion, braces correct) =====
  async submitScore() {
    try {
      await recordScore({
        username:   gameState.username    || 'Wanderer',
        score:      gameState.score       || 0,
        depth:      gameState.depth       || 0,
        seedString: gameState.seedString  || '',
        mode: gameState.isDailyRun ? 'daily' : (gameState.seedString ? 'custom' : null)
      });

      // Simple confirmation text
      this.add.text(187.5, 450, 'Score submitted to leaderboard!', {
        fontSize: '10px',
        fill: '#4ecdc4',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);

    } catch (err) {
      console.warn('⚠️ Failed to submit score:', err);
      this.add.text(187.5, 450, 'Could not submit score', {
        fontSize: '10px',
        fill: '#ff6b6b',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
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
