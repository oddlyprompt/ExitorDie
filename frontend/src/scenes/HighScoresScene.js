import Phaser from 'phaser';
import { gameState } from '../utils/GameState.js';
import { fetchScores } from '../utils/leaderboard.js';
// Safe way to read the backend URL (works even if env isn’t defined)
const BACKEND_URL =
  (typeof import.meta !== 'undefined' &&
   import.meta.env &&
   import.meta.env.VITE_BACKEND_URL) || '';
export class HighScoresScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HighScoresScene' });
    this.currentPage = 0;
    this.scores = [];
    this.loading = false;
  }

  create() {
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x2d1b69, 0x2d1b69, 1);
    bg.fillRect(0, 0, 375, 667);

    // Title
    this.add.text(187.5, 60, 'HIGH SCORES', {
      fontSize: '24px',
      fill: '#ff6b6b',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Filter buttons
    this.createFilterButtons();

    // Scores container
    this.scoresContainer = this.add.container(0, 0);

    // Navigation buttons
    this.createNavigationButtons();

    // Back button - positioned above navigation buttons with proper spacing
    this.createButton(187.5, 520, 'BACK TO MENU', () => this.returnToTitle());

    // Load initial scores
    async loadScores() {
  if (this.loading) return;
  this.loading = true;

  try {
    const pageSize = 10;
    this.scores = await fetchScores(this.currentPage, pageSize, this.currentFilter);
    this.displayScores();
    this.updateNavigationButtons();
  } catch (err) {
    console.warn('Error loading scores:', err);
    this.displayError('Unable to connect to server');
  } finally {
    this.loading = false;
  }
}
  createFilterButtons() {
    const filters = ['ALL', 'DAILY', 'CUSTOM'];
    const startX = 60;
    const buttonWidth = 85;
    
    this.currentFilter = 'ALL';
    this.filterButtons = [];

    filters.forEach((filter, index) => {
      const x = startX + (index * buttonWidth);
      const button = this.createFilterButton(x, 100, filter, () => this.setFilter(filter));
      this.filterButtons.push({ button, filter });
    });

    this.updateFilterButtons();
  }

  createFilterButton(x, y, text, callback) {
    const button = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 80, 25, 0x333333, 0.8);
    bg.setStrokeStyle(1, 0x666666);
    
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '10px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(80, 25);
    button.setInteractive();

    button.on('pointerup', callback);
    
    // Store references for styling
    button.bg = bg;
    button.text = buttonText;

    return button;
  }

  async loadScores() {
    if (this.loading) return;
    
    this.loading = true;
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
      
      let url = `${backendUrl}/api/leaderboard?page=${this.currentPage}&limit=10`;
      
      if (this.currentFilter === 'DAILY') {
        url += '&daily=true';
      } else if (this.currentFilter === 'CUSTOM') {
        url += '&custom=true';
      }

      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        this.scores = data.rows || [];
        
        this.displayScores();
        this.updateNavigationButtons();
      } else {
        this.displayError('Failed to load scores');
      }
    } catch (error) {
      console.warn('Error loading scores:', error);
      this.displayError('Unable to connect to server');
    }
    
    this.loading = false;
  }

  displayScores() {
    // Clear existing scores
    this.scoresContainer.removeAll(true);

    if (this.scores.length === 0) {
      const noScores = this.add.text(187.5, 200, 'No scores found', {
        fontSize: '14px',
        fill: '#666666',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      
      this.scoresContainer.add(noScores);
      return;
    }

    // Headers
    const headers = this.add.text(20, 140, 'RANK  PLAYER               SCORE  DEPTH', {
      fontSize: '10px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    });
    this.scoresContainer.add(headers);

    // Score entries
    this.scores.forEach((score, index) => {
      const rank = (this.currentPage * 10) + index + 1;
      const y = 165 + (index * 25);
      
      // Highlight current user's score
      const isCurrentUser = score.username === gameState.username;
      const color = isCurrentUser ? '#4ecdc4' : '#ffffff';
      
      // Format username (truncate if too long but allow more space)
      const username = score.username.length > 16 ? 
        score.username.substring(0, 16) + '...' : 
        score.username;
      
      const scoreText = `${rank.toString().padStart(2, ' ')}    ${username.padEnd(19, ' ')} ${score.score.toString().padStart(5, ' ')}   ${score.depth.toString().padStart(2, ' ')}`;
      
      const entry = this.add.text(20, y, scoreText, {
        fontSize: '10px',
        fill: color,
        fontFamily: 'Courier New'
      });
      
      this.scoresContainer.add(entry);
      
      // Add seed info for custom runs
      if (score.seedString && score.seedString !== '') {
        const seedInfo = this.add.text(25, y + 12, `Seed: ${score.seedString}`, {
          fontSize: '8px',
          fill: '#888888',
          fontFamily: 'Courier New'
        });
        this.scoresContainer.add(seedInfo);
      }
    });
  }

  displayError(message) {
    this.scoresContainer.removeAll(true);
    
    const errorText = this.add.text(187.5, 200, message, {
      fontSize: '14px',
      fill: '#ff6b6b',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    this.scoresContainer.add(errorText);
  }

  createNavigationButtons() {
    this.prevButton = this.createButton(90, 560, 'PREVIOUS', () => this.previousPage());
    this.nextButton = this.createButton(285, 560, 'NEXT', () => this.nextPage());
    
    this.pageText = this.add.text(187.5, 560, `Page ${this.currentPage + 1}`, {
      fontSize: '12px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
  }

  updateNavigationButtons() {
    // Update page text
    this.pageText.setText(`Page ${this.currentPage + 1}`);
    
    // Enable/disable buttons based on data
    const hasPrevious = this.currentPage > 0;
    const hasNext = this.scores.length === 10; // Full page suggests more data
    
    this.prevButton.setAlpha(hasPrevious ? 1 : 0.5);
    this.nextButton.setAlpha(hasNext ? 1 : 0.5);
  }

  setFilter(filter) {
    if (this.currentFilter === filter || this.loading) return;
    
    this.currentFilter = filter;
    this.currentPage = 0;
    this.updateFilterButtons();
    this.loadScores();
  }

  updateFilterButtons() {
    this.filterButtons.forEach(({ button, filter }) => {
      const isActive = filter === this.currentFilter;
      button.bg.setFillStyle(isActive ? 0xff6b6b : 0x333333, 0.8);
      button.bg.setStrokeStyle(1, isActive ? 0xff6b6b : 0x666666);
    });
  }

  previousPage() {
    if (this.currentPage > 0 && !this.loading) {
      this.currentPage--;
      this.loadScores();
    }
  }

  nextPage() {
    if (this.scores.length === 10 && !this.loading) { // Full page suggests more data
      this.currentPage++;
      this.loadScores();
    }
  }

  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 120, 30, 0x333333, 0.8);
    bg.setStrokeStyle(2, 0xff6b6b);
    
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '12px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    button.add([bg, buttonText]);
    button.setSize(120, 30);
    button.setInteractive();

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

  returnToTitle() {
    this.scene.start('TitleScene');
  }
}