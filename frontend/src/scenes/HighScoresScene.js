import Phaser from 'phaser';

export class HighScoresScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HighScoresScene' });
  }

  create() {
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x1a2d69, 0x1a2d69, 1);
    bg.fillRect(0, 0, 375, 667);

    // Title
    this.add.text(187.5, 60, 'HIGH SCORES', {
      fontSize: '28px',
      fill: '#feca57',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Tab buttons
    this.createTabs();
    
    // Scoreboard container
    this.scoreContainer = this.add.container(187.5, 200);
    
    // Load initial scores
    this.currentTab = 'global';
    this.loadScores('global');
    
    // Back button
    this.createBackButton();
  }

  createTabs() {
    this.tabContainer = this.add.container(187.5, 120);
    
    const globalTab = this.createTab(-80, 0, 'GLOBAL', () => this.switchTab('global'));
    const dailyTab = this.createTab(80, 0, 'DAILY', () => this.switchTab('daily'));
    
    this.tabContainer.add([globalTab, dailyTab]);
    
    // Track active tab
    this.tabs = { global: globalTab, daily: dailyTab };
    this.updateTabStyles();
  }

  createTab(x, y, text, callback) {
    const tab = this.add.container(x, y);
    
    const bg = this.add.rectangle(0, 0, 100, 30, 0x333333, 0.8);
    bg.setStrokeStyle(2, 0x666666);
    
    const tabText = this.add.text(0, 0, text, {
      fontSize: '14px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    tab.add([bg, tabText]);
    tab.setSize(100, 30);
    tab.setInteractive();
    
    tab.on('pointerup', callback);
    
    // Store references for styling
    tab.bg = bg;
    tab.text = tabText;
    
    return tab;
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    this.updateTabStyles();
    this.loadScores(tabName);
  }

  updateTabStyles() {
    Object.entries(this.tabs).forEach(([name, tab]) => {
      if (name === this.currentTab) {
        tab.bg.setStrokeStyle(2, 0xfeca57);
        tab.text.setColor('#feca57');
      } else {
        tab.bg.setStrokeStyle(2, 0x666666);
        tab.text.setColor('#cccccc');
      }
    });
  }

  async loadScores(category) {
    // Clear existing scores
    this.scoreContainer.removeAll(true);
    
    // Loading text
    const loadingText = this.add.text(0, 0, 'Loading scores...', {
      fontSize: '16px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    this.scoreContainer.add(loadingText);
    
    try {
      // Mock scores for now (will be replaced with backend API)
      const mockScores = this.getMockScores(category);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.displayScores(mockScores);
      
    } catch (error) {
      console.error('Failed to load scores:', error);
      this.displayError();
    }
  }

  getMockScores(category) {
    // Mock leaderboard data
    const globalScores = [
      { rank: 1, name: 'RogueKing', score: 15420, depth: 24, artifacts: 8 },
      { rank: 2, name: 'DeepDelver', score: 12850, depth: 21, artifacts: 6 },
      { rank: 3, name: 'LootHunter', score: 11200, depth: 19, artifacts: 7 },
      { rank: 4, name: 'ExitMaster', score: 9780, depth: 18, artifacts: 5 },
      { rank: 5, name: 'GreedyOne', score: 8950, depth: 16, artifacts: 4 },
      { rank: 6, name: 'ShadowWalk', score: 7340, depth: 15, artifacts: 3 },
      { rank: 7, name: 'TreasureSeeker', score: 6890, depth: 14, artifacts: 5 },
      { rank: 8, name: 'DungeonDiver', score: 5420, depth: 12, artifacts: 2 },
      { rank: 9, name: 'RiskTaker', score: 4200, depth: 11, artifacts: 3 },
      { rank: 10, name: 'Survivor', score: 3150, depth: 9, artifacts: 1 }
    ];

    const dailyScores = [
      { rank: 1, name: 'DailyChamp', score: 8750, depth: 16, artifacts: 4 },
      { rank: 2, name: 'MorningRun', score: 7200, depth: 14, artifacts: 3 },
      { rank: 3, name: 'SpeedRunner', score: 6100, depth: 13, artifacts: 2 },
      { rank: 4, name: 'Challenger', score: 5400, depth: 12, artifacts: 3 },
      { rank: 5, name: 'DailyGrind', score: 4800, depth: 11, artifacts: 2 }
    ];

    return category === 'global' ? globalScores : dailyScores;
  }

  displayScores(scores) {
    this.scoreContainer.removeAll(true);
    
    // Header
    const header = this.add.text(0, -150, 'RANK  NAME            SCORE    DEPTH  ARTIFACTS', {
      fontSize: '12px',
      fill: '#666666',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    this.scoreContainer.add(header);
    
    // Score entries
    scores.forEach((entry, index) => {
      const y = -120 + (index * 25);
      
      // Rank color based on position
      let rankColor = '#cccccc';
      if (entry.rank === 1) rankColor = '#feca57';
      else if (entry.rank === 2) rankColor = '#c0c0c0';
      else if (entry.rank === 3) rankColor = '#cd7f32';
      
      const scoreText = this.add.text(0, y, 
        `${entry.rank.toString().padStart(2, ' ')}    ${entry.name.padEnd(12, ' ')} ${entry.score.toString().padStart(8, ' ')}   ${entry.depth.toString().padStart(2, ' ')}     ${entry.artifacts}`, {
        fontSize: '12px',
        fill: rankColor,
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      
      this.scoreContainer.add(scoreText);
    });
    
    // Pagination (placeholder)
    const pageInfo = this.add.text(0, 200, 'Page 1 of 10', {
      fontSize: '12px',
      fill: '#666666',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    this.scoreContainer.add(pageInfo);
  }

  displayError() {
    this.scoreContainer.removeAll(true);
    
    const errorText = this.add.text(0, 0, 'Failed to load scores.\nCheck your connection.', {
      fontSize: '16px',
      fill: '#ff6b6b',
      fontFamily: 'Courier New',
      align: 'center'
    }).setOrigin(0.5);
    
    this.scoreContainer.add(errorText);
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