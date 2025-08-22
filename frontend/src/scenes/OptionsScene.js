import Phaser from 'phaser';
import { gameState } from '../utils/GameState.js';

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OptionsScene' });
  }

  create() {
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x2d1b69, 0x2d1b69, 1);
    bg.fillRect(0, 0, 375, 667);

    // Title
    this.add.text(187.5, 100, 'OPTIONS', {
      fontSize: '28px',
      fill: '#ff6b6b',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Fast Wheel Toggle
    this.createToggle(
      187.5, 200,
      'FAST WHEEL',
      'Reduces wheel spin time to 900ms',
      gameState.fastWheel,
      (value) => { gameState.fastWheel = value; }
    );

    // Future options can be added here
    this.add.text(187.5, 300, 'More options coming soon...', {
      fontSize: '14px',
      fill: '#666666',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Back button
    this.createBackButton();
  }

  createToggle(x, y, title, description, initialValue, onToggle) {
    const container = this.add.container(x, y);
    
    // Title
    const titleText = this.add.text(0, -20, title, {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Description
    const descText = this.add.text(0, 0, description, {
      fontSize: '12px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Toggle button
    const toggleBg = this.add.rectangle(0, 25, 60, 25, 0x333333, 0.8);
    toggleBg.setStrokeStyle(2, initialValue ? 0x4ecdc4 : 0x666666);
    
    const toggleText = this.add.text(0, 25, initialValue ? 'ON' : 'OFF', {
      fontSize: '12px',
      fill: initialValue ? '#4ecdc4' : '#666666',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    container.add([titleText, descText, toggleBg, toggleText]);
    
    // Make interactive
    toggleBg.setInteractive();
    toggleText.setInteractive();
    
    const toggle = () => {
      const newValue = !initialValue;
      initialValue = newValue;
      
      toggleBg.setStrokeStyle(2, newValue ? 0x4ecdc4 : 0x666666);
      toggleText.setText(newValue ? 'ON' : 'OFF');
      toggleText.setColor(newValue ? '#4ecdc4' : '#666666');
      
      onToggle(newValue);
    };
    
    toggleBg.on('pointerup', toggle);
    toggleText.on('pointerup', toggle);
    
    // Hover effects
    toggleBg.on('pointerover', () => {
      toggleBg.setFillStyle(0x555555, 0.8);
    });
    
    toggleBg.on('pointerout', () => {
      toggleBg.setFillStyle(0x333333, 0.8);
    });
  }

  createBackButton() {
    const backButton = this.add.container(60, 600);
    
    const bg = this.add.rectangle(0, 0, 100, 35, 0x333333, 0.8);
    bg.setStrokeStyle(2, 0xff6b6b);
    
    const buttonText = this.add.text(0, 0, 'BACK', {
      fontSize: '14px',
      fill: '#ff6b6b',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    backButton.add([bg, buttonText]);
    backButton.setSize(100, 35);
    backButton.setInteractive();
    
    backButton.on('pointerover', () => {
      bg.setFillStyle(0xff6b6b, 0.2);
      buttonText.setScale(1.05);
    });
    
    backButton.on('pointerout', () => {
      bg.setFillStyle(0x333333, 0.8);
      buttonText.setScale(1);
    });
    
    backButton.on('pointerup', () => {
      this.scene.start('TitleScene');
    });
  }
}