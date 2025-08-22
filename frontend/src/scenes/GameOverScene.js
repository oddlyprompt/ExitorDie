import Phaser from 'phaser';
import { gameState } from '../utils/GameState.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    // Check if this was a victory (successful exit) or death
    this.isVictory = data && data.victory;
    console.log('🎯 GameOverScene init - isVictory:', this.isVictory);
  }

  create() {
    console.log('🎯 GameOverScene create() called');
    try {
      // Background - different color for victory
      const bg = this.add.graphics();
      if (this.isVictory) {
        bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x004a00, 0x004a00, 1); // Green tint for victory
      } else {
        bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x4a0000, 0x4a0000, 1); // Red tint for death
      }
      bg.fillRect(0, 0, 375, 667);

      // Title text - different for victory vs death
      const titleText = this.isVictory ? 'VICTORY!' : 'GAME OVER';
      const titleColor = this.isVictory ? '#4ecdc4' : '#ff6b6b';
      
      this.add.text(187.5, 150, titleText, {
        fontSize: '36px',
        fill: titleColor,
        fontFamily: 'Courier New'
      }).setOrigin(0.5);

      // Message based on victory or death
      const message = this.isVictory ? this.getVictoryMessage() : this.getDeathMessage();
      this.add.text(187.5, 200, message, {
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

  getVictoryMessage() {
    const victoryMessages = [
      "You emerged from the depths with your treasures!",
      "Fortune smiled upon you as you escaped the dungeon!",
      "Your courage and cunning led you to victory!",
      "The darkness could not claim you this day!",
      "You've proven yourself a true treasure hunter!"
    ];
    
    // Use depth to pick a consistent message per run
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

      // Add equipped items if any (with safety check)
      const inventory = gameState.inventory || [];
      if (inventory.length > 0) {
        stats.push('Items Found:');
        inventory.forEach(item => {
          const itemName = item?.name || 'Unknown Item';
          const itemRarity = item?.rarity || 'Unknown';
          stats.push(`• ${itemName} (${itemRarity})`);
        });
      }

      // Add equipped artifacts (with safety check)  
      const equippedArtifacts = gameState.equippedArtifacts || [];
      if (equippedArtifacts.length > 0) {
        stats.push('');
        stats.push('Equipped Artifacts:');
        equippedArtifacts.forEach(artifact => {
          const artifactName = artifact?.name || 'Unknown Artifact';
          stats.push(`• ${artifactName}`);
        });
      }

      console.log('🎯 Stats to display:', stats);

      this.add.text(187.5, 280, stats.join('\n'), {
        fontSize: '12px',
        fill: '#ffffff',
        fontFamily: 'Courier New',
        align: 'center'
      }).setOrigin(0.5);
      
      console.log('✅ Stats displayed successfully');
    } catch (error) {
      console.error('❌ Error in displayStats:', error);
      // Fallback display
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