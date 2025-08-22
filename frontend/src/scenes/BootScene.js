import Phaser from 'phaser';
import { setSeed } from '../utils/SeededRNG.js';
import { gameState } from '../utils/GameState.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Create loading text
    this.add.text(187.5, 300, 'LOADING...', {
      fontSize: '24px',
      fill: '#ff6b6b',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Create simple loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(137.5, 350, 100, 20);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xff6b6b, 1);
      progressBar.fillRect(137.5, 350, 100 * value, 20);
    });

    // Load basic assets (we'll add more as needed)
    this.createColorTextures();
  }

  createColorTextures() {
    // Create solid color textures for UI elements
    const colors = {
      'red': 0xff6b6b,
      'green': 0x4ecdc4,
      'blue': 0x45b7d1,
      'purple': 0x96ceb4,
      'orange': 0xfeca57,
      'white': 0xffffff,
      'black': 0x000000,
      'gray': 0x666666,
      'darkgray': 0x333333
    };

    Object.entries(colors).forEach(([name, color]) => {
      this.add.graphics()
        .fillStyle(color)
        .fillRect(0, 0, 1, 1)
        .generateTexture(name, 1, 1)
        .destroy();
    });
  }

  async create() {
    // Try to fetch content pack from backend
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
      
      // Fetch content pack (when backend is ready)
      // const contentResponse = await fetch(`${backendUrl}/api/content`);
      // if (contentResponse.ok) {
      //   const contentPack = await contentResponse.json();
      //   gameState.contentPack = contentPack;
      // }

      // Fetch daily seed (when backend is ready)
      // const dailyResponse = await fetch(`${backendUrl}/api/daily`);
      // if (dailyResponse.ok) {
      //   const dailyData = await dailyResponse.json();
      //   gameState.dailySeed = dailyData.seed;
      // }

    } catch (error) {
      console.log('Backend not available, using defaults');
    }

    // Initialize default seed
    setSeed(Date.now());
    
    // Short delay then transition to title
    this.time.delayedCall(1000, () => {
      this.scene.start('TitleScene');
    });
  }
}