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
    this.add.text(187.5, 120, 'EXIT\nOR\nDIE', {
      fontSize: '48px',
      fill: '#ff6b6b',
      fontFamily: 'Courier New',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(187.5, 210, 'A Roguelike Adventure', {
      fontSize: '16px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Username input
    this.createUsernameInput();
    
    // Custom seed input
    this.createCustomSeedInput();

    // Menu buttons
    this.createButton(187.5, 380, 'NEW RUN', () => this.startNewRun());
    this.createButton(187.5, 430, 'DAILY RUN', () => this.startDailyRun());
    this.createButton(187.5, 480, 'PLAY SEED', () => this.startCustomSeed());
    this.createButton(187.5, 530, 'HIGH SCORES', () => this.showHighScores());
    this.createButton(187.5, 580, 'CODEX', () => this.showCodex());
    this.createButton(187.5, 630, 'OPTIONS', () => this.showOptions());

    // Version info
    this.add.text(10, 650, 'v1.1.0', {
      fontSize: '12px',
      fill: '#666666',
      fontFamily: 'Courier New'
    });
  }

  createUsernameInput() {
    // Username label
    this.add.text(187.5, 250, 'USERNAME (3-16 chars)', {
      fontSize: '12px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Username input field background
    const inputBg = this.add.rectangle(187.5, 275, 200, 30, 0x333333, 0.8);
    inputBg.setStrokeStyle(2, 0x666666);

    // Username display/input
    this.usernameText = this.add.text(187.5, 275, gameState.getDisplayUsername(), {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Make username field clickable
    inputBg.setInteractive();
    inputBg.on('pointerup', () => {
      this.editUsername();
    });

    this.usernameText.setInteractive();
    this.usernameText.on('pointerup', () => {
      this.editUsername();
    });
  }

  createCustomSeedInput() {
    // Custom seed label
    this.add.text(187.5, 310, 'CUSTOM SEED (optional)', {
      fontSize: '12px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Seed input field background
    const seedBg = this.add.rectangle(187.5, 335, 200, 30, 0x333333, 0.8);
    seedBg.setStrokeStyle(2, 0x666666);

    // Seed display/input
    this.seedText = this.add.text(187.5, 335, gameState.seedString || 'Click to enter seed', {
      fontSize: '12px',
      fill: gameState.seedString ? '#ffffff' : '#888888',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Make seed field clickable
    seedBg.setInteractive();
    seedBg.on('pointerup', () => {
      this.editSeed();
    });

    this.seedText.setInteractive();
    this.seedText.on('pointerup', () => {
      this.editSeed();
    });
  }

  editUsername() {
    const currentUsername = gameState.username || '';
    const newUsername = window.prompt('Enter username (3-16 characters, A-Z, 0-9, _):', currentUsername);
    
    if (newUsername !== null) {
      if (newUsername === '') {
        // Clear username
        gameState.username = '';
        localStorage.removeItem('exit_or_die_username');
        this.usernameText.setText(gameState.getDisplayUsername());
        this.usernameText.setColor('#ffffff');
      } else if (gameState.setUsername(newUsername)) {
        // Valid username
        this.usernameText.setText(gameState.username);
        this.usernameText.setColor('#ffffff');
      } else {
        // Invalid username
        alert('Invalid username. Must be 3-16 characters using only A-Z, a-z, 0-9, and _');
      }
    }
  }

  editSeed() {
    const currentSeed = gameState.seedString || '';
    const newSeed = window.prompt('Enter custom seed (leave empty for random):', currentSeed);
    
    if (newSeed !== null) {
      gameState.setSeedFromString(newSeed);
      
      if (newSeed) {
        this.seedText.setText(newSeed.length > 20 ? newSeed.substr(0, 20) + '...' : newSeed);
        this.seedText.setColor('#ffffff');
      } else {
        this.seedText.setText('Click to enter seed');
        this.seedText.setColor('#888888');
      }
    }
  }

  createButton(x, y, text, callback) {
    console.log(`🎯 Creating button: ${text} at position ${x}, ${y}`);
    const button = this.add.container(x, y);
    
    // Button background
    const bg = this.add.rectangle(0, 0, 200, 35, 0x333333, 0.8);
    bg.setStrokeStyle(2, 0xff6b6b);
    
    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(200, 35);
    button.setInteractive();

    // Add debugging to all events
    button.on('pointerover', () => {
      console.log(`🎯 ${text} button hovered`);
      bg.setFillStyle(0xff6b6b, 0.3);
      buttonText.setScale(1.05);
    });

    button.on('pointerout', () => {
      console.log(`🎯 ${text} button unhovered`);
      bg.setFillStyle(0x333333, 0.8);
      buttonText.setScale(1);
    });

    button.on('pointerdown', () => {
      console.log(`🎯 ${text} button pressed down`);
      buttonText.setScale(0.95);
    });

    button.on('pointerup', () => {
      console.log(`🎯 ${text} button released - executing callback`);
      buttonText.setScale(1.05);
      try {
        callback();
      } catch (error) {
        console.error(`❌ Error in ${text} button callback:`, error);
      }
    });

    console.log(`✅ Button ${text} created successfully`);
    return button;
  }

  startNewRun() {
    console.log('🎯 NEW RUN button clicked - starting new run');
    try {
      gameState.reset();
      gameState.isDailyRun = false;
      
      // Use custom seed if provided, otherwise generate new
      if (gameState.seedString) {
        console.log('🎯 Using custom seed:', gameState.seed);
        setSeed(gameState.seed);
      } else {
        console.log('🎯 Generating new seed...');
        const seed = Date.now() + gameRNG.nextInt(0, 999999);
        console.log('🎯 Generated seed:', seed);
        setSeed(seed);
        gameState.seed = seed;
      }
      
      console.log('🎯 Transitioning to RunScene...');
      this.scene.start('RunScene');
      console.log('🎯 Scene.start called successfully');
    } catch (error) {
      console.error('❌ Error in startNewRun:', error);
    }
  }

  startDailyRun() {
    gameState.reset();
    gameState.isDailyRun = true;
    
    // Use daily seed (or generate one if backend unavailable)
    const dailySeed = gameState.dailySeed || this.getDailySeed();
    setSeed(dailySeed);
    gameState.seed = dailySeed;
    gameState.seedString = 'daily-' + new Date().toISOString().split('T')[0];
    
    this.scene.start('RunScene');
  }

  startCustomSeed() {
    if (!gameState.seedString) {
      alert('Please enter a custom seed first');
      return;
    }
    
    gameState.reset();
    gameState.isDailyRun = false;
    
    setSeed(gameState.seed);
    
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
    this.scene.start('OptionsScene');
  }
}