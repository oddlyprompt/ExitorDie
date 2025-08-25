import Phaser from 'phaser';
import { gameState } from '../utils/GameState.js';
import { fetchScores } from '../utils/leaderboard.js';
// --- Safe backend base URL (no trailing slash) ---
const backendUrlRaw =
  (import.meta && import.meta.env && import.meta.env.VITE_BACKEND_URL) ||
  window.__BACKEND_URL || '';
const BACKEND_URL = String(backendUrlRaw).replace(/\/$/, ''); // '' is fine (will 404 gracefully)

export class HighScoresScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HighScoresScene' });
    this.currentPage = 0;
    this.scores = [];
    this.loading = false;
    this.currentFilter = 'ALL';
    this.filterButtons = [];
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

    // Filters
    this.createFilterButtons();

    // Container for scores
    this.scoresContainer = this.add.container(0, 0);

    // Nav buttons + page label
    this.createNavigationButtons();

    // Back
    this.createButton(187.5, 520, 'BACK TO MENU', () => this.returnToTitle());

    // First load
    this.loadScores();
  }

  // --------- LOAD SCORES ----------
  // replace your entire loadScores() with this
async loadScores() {
  if (this.loading) return;
  this.loading = true;

  try {
    const page   = Number(this.currentPage) || 0;
    const filter = this.currentFilter; // 'ALL' | 'DAILY' | 'CUSTOM'

    // Pull straight from Supabase
    const rows = await fetchScores(page, 10, filter);

    // Normalize to what displayScores() expects
    this.scores = rows.map(r => ({
      username:   r.username ?? '—',
      score:      r.score ?? 0,
      depth:      r.depth ?? 0,
      seedString: r.seed_string ?? '',
      mode:       r.mode ?? null,
      created_at: r.created_at
    }));

    this.displayScores();
    this.updateNavigationButtons();
  } catch (err) {
    console.warn('Error loading scores:', err);
    this.displayError('Unable to connect to server');
  } finally {
    this.loading = false;
  }
}

  // ---------- FILTER BUTTONS ----------
  createFilterButtons() {
    const filters = ['ALL', 'DAILY', 'CUSTOM'];
    const startX = 60;
    const buttonWidth = 85;

    this.filterButtons = [];
    filters.forEach((filter, index) => {
      const x = startX + (index * buttonWidth);
      const btn = this.createFilterButton(x, 100, filter, () => this.setFilter(filter));
      this.filterButtons.push({ button: btn, filter });
    });

    this.updateFilterButtons();
  }

  createFilterButton(x, y, text, callback) {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 80, 25, 0x333333, 0.8);
    bg.setStrokeStyle(1, 0x666666);

    const label = this.add.text(0, 0, text, {
      fontSize: '10px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(80, 25);
    button.setInteractive();
    button.on('pointerup', callback);

    button.bg = bg;     // keep refs for styling
    button.text = label;
    return button;
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

  // ---------- SCORE LIST ----------
  displayScores() {
    this.scoresContainer.removeAll(true);

    if (!this.scores.length) {
      const noScores = this.add.text(187.5, 200, 'No scores found', {
        fontSize: '14px',
        fill: '#666666',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      this.scoresContainer.add(noScores);
      return;
    }

    const headers = this.add.text(20, 140, 'RANK  PLAYER               SCORE  DEPTH', {
      fontSize: '10px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    });
    this.scoresContainer.add(headers);

    this.scores.forEach((score, index) => {
      const rank = (this.currentPage * 10) + index + 1;
      const y = 165 + (index * 25);

      const isCurrentUser = score.username === gameState.username;
      const color = isCurrentUser ? '#4ecdc4' : '#ffffff';

      const username = (score.username || '');
      const shortName = username.length > 16 ? `${username.slice(0,16)}...` : username;

      const line = `${rank.toString().padStart(2,' ')}    ${shortName.padEnd(19,' ')} ${String(score.score||0).padStart(5,' ')}   ${String(score.depth||0).padStart(2,' ')}`;

      const entry = this.add.text(20, y, line, {
        fontSize: '10px',
        fill: color,
        fontFamily: 'Courier New'
      });
      this.scoresContainer.add(entry);

      if (score.seedString) {
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

  // ---------- PAGER ----------
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
    this.pageText.setText(`Page ${this.currentPage + 1}`);
    const hasPrevious = this.currentPage > 0;
    const hasNext = this.scores.length === 10;
    this.prevButton.setAlpha(hasPrevious ? 1 : 0.5);
    this.nextButton.setAlpha(hasNext ? 1 : 0.5);
  }

  previousPage() {
    if (this.currentPage > 0 && !this.loading) {
      this.currentPage--;
      this.loadScores();
    }
  }

  nextPage() {
    if (this.scores.length === 10 && !this.loading) {
      this.currentPage++;
      this.loadScores();
    }
  }

  // ---------- tiny UI helpers ----------
  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 120, 30, 0x333333, 0.8);
    bg.setStrokeStyle(2, 0xff6b6b);

    const label = this.add.text(0, 0, text, {
      fontSize: '12px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(120, 30);
    button.setInteractive();

    button.on('pointerover', () => { bg.setFillStyle(0xff6b6b, 0.3); label.setScale(1.05); });
    button.on('pointerout',  () => { bg.setFillStyle(0x333333, 0.8); label.setScale(1.0); });
    button.on('pointerdown', () => { label.setScale(0.95); });
    button.on('pointerup',   () => { label.setScale(1.05); callback(); });

    return button;
  }

  returnToTitle() {
    this.scene.start('TitleScene');
  }
}