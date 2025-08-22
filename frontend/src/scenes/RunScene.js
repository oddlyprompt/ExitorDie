import Phaser from 'phaser';
import { gameRNG } from '../utils/SeededRNG.js';
import { gameState } from '../utils/GameState.js';

export class RunScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RunScene' });
  }

  create() {
    // Background
    this.createBackground();
    
    // HUD
    this.createHUD();
    
    // Generate first room
    this.generateRoom();
    
    // Track screen shake camera
    this.cameras.main.setBackgroundColor(0x1a1a1a);
  }

  createBackground() {
    // Animated background with depth effect
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x0f0f23, 0x0f0f23, 1);
    bg.fillRect(0, 0, 375, 667);

    // Add some atmospheric particles
    this.createParticles();
  }

  createParticles() {
    const particles = this.add.group();
    
    for (let i = 0; i < 15; i++) {
      const particle = this.add.circle(
        gameRNG.nextInt(0, 375),
        gameRNG.nextInt(0, 667),
        gameRNG.nextInt(1, 3),
        0x333333,
        0.3
      );
      
      // Floating animation
      this.tweens.add({
        targets: particle,
        y: particle.y - gameRNG.nextInt(20, 50),
        duration: gameRNG.nextInt(3000, 6000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
      
      particles.add(particle);
    }
  }

  createHUD() {
    // HUD container
    this.hud = this.add.container(0, 0);
    
    // HP Hearts
    this.hpContainer = this.add.container(20, 30);
    this.updateHPDisplay();
    
    // Greed Bar
    this.greedContainer = this.add.container(20, 70);
    this.createGreedBar();
    
    // Stats container (top right)
    this.statsContainer = this.add.container(280, 30);
    this.updateStats();
    
    // Depth indicator
    this.depthText = this.add.text(187.5, 30, `DEPTH: ${gameState.depth}`, {
      fontSize: '16px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    this.hud.add([this.hpContainer, this.greedContainer, this.statsContainer, this.depthText]);
  }

  updateHPDisplay() {
    this.hpContainer.removeAll(true);
    
    // Add HP hearts
    for (let i = 0; i < gameState.maxHP; i++) {
      const heart = this.add.text(i * 25, 0, i < gameState.hp ? '♥' : '♡', {
        fontSize: '20px',
        fill: i < gameState.hp ? '#ff6b6b' : '#666666',
        fontFamily: 'Courier New'
      });
      this.hpContainer.add(heart);
    }
  }

  createGreedBar() {
    this.greedContainer.removeAll(true);
    
    // Greed label
    const label = this.add.text(0, 0, 'GREED:', {
      fontSize: '12px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    });
    
    // Greed bar background
    const barBg = this.add.rectangle(60, 0, 100, 12, 0x333333);
    
    // Greed bar fill
    const fillWidth = (gameState.greed / 10) * 100;
    const barFill = this.add.rectangle(60 - (100 - fillWidth) / 2, 0, fillWidth, 12, 0xfeca57);
    
    // Greed text
    const greedText = this.add.text(170, 0, `${gameState.greed}/10`, {
      fontSize: '12px',
      fill: '#feca57',
      fontFamily: 'Courier New'
    });
    
    this.greedContainer.add([label, barBg, barFill, greedText]);
  }

  updateStats() {
    this.statsContainer.removeAll(true);
    
    const exitOdds = gameState.getExitOdds();
    const deathRisk = gameState.getDeathRisk();
    
    const exitText = this.add.text(0, 0, `EXIT: ${exitOdds}%`, {
      fontSize: '12px',
      fill: exitOdds > 20 ? '#4ecdc4' : '#cccccc',
      fontFamily: 'Courier New'
    });
    
    const riskText = this.add.text(0, 15, `RISK: ${deathRisk}%`, {
      fontSize: '12px',
      fill: deathRisk > 30 ? '#ff6b6b' : '#cccccc',
      fontFamily: 'Courier New'
    });
    
    this.statsContainer.add([exitText, riskText]);
  }

  generateRoom() {
    gameState.visitRoom('standard');
    
    // Clear previous room
    if (this.roomContainer) {
      this.roomContainer.destroy();
    }
    
    this.roomContainer = this.add.container(187.5, 400);
    
    // Room description
    const roomDesc = this.getRoomDescription();
    const descText = this.add.text(0, -100, roomDesc, {
      fontSize: '14px',
      fill: '#cccccc',
      fontFamily: 'Courier New',
      align: 'center',
      wordWrap: { width: 300 }
    }).setOrigin(0.5);
    
    // Generate room modifier
    const modifier = this.generateRoomModifier();
    
    // Room choices
    this.createRoomChoices(modifier);
    
    this.roomContainer.add(descText);
    
    // Update HUD
    this.updateHUD();
    
    // Depth transition effect
    this.cameras.main.flash(200, 0, 0, 0, false);
  }

  getRoomDescription() {
    const descriptions = [
      "You enter a dimly lit chamber with ancient stone walls.",
      "A musty corridor stretches ahead, shadows dancing in the torchlight.",
      "You find yourself in a circular room with mysterious symbols carved into the floor.",
      "The path leads to a narrow passage with strange echoes.",
      "A grand hall opens before you, filled with the scent of forgotten ages.",
      "You step into a cramped alcove with walls that seem to whisper.",
      "The room ahead glimmers with an otherworldly light.",
      "Ancient pillars support the ceiling of this forgotten chamber."
    ];
    
    return gameRNG.choice(descriptions);
  }

  generateRoomModifier() {
    const budget = gameState.getHazardBudget();
    const modifiers = [
      { type: 'trap', cost: 2, name: 'Spiked Floor', effect: 'Take 1 damage, but better loot awaits' },
      { type: 'shrine', cost: 1, name: 'Healing Shrine', effect: 'Trade 2 Greed for 1 HP' },
      { type: 'curse', cost: 3, name: 'Cursed Altar', effect: 'Higher rarity loot, but increased death risk' },
      { type: 'beacon', cost: 4, name: 'Exit Beacon', effect: 'Guarantees exit option next room' },
      { type: 'treasure', cost: 2, name: 'Treasure Pile', effect: 'Take for loot and +1 Greed' }
    ];
    
    // Filter modifiers by budget and select randomly
    const affordableModifiers = modifiers.filter(m => m.cost <= budget);
    return affordableModifiers.length > 0 ? gameRNG.choice(affordableModifiers) : null;
  }

  createRoomChoices(modifier) {
    const choices = [];
    
    // Always have Continue option
    choices.push({
      text: 'CONTINUE',
      action: () => this.continueChoice()
    });
    
    // Exit option based on exit odds
    const exitOdds = gameState.getExitOdds();
    if (gameRNG.next() * 100 < exitOdds) {
      choices.push({
        text: 'EXIT (Safe)',
        action: () => this.exitChoice(),
        color: '#4ecdc4'
      });
    }
    
    // Add modifier choice if present
    if (modifier) {
      choices.push({
        text: modifier.name.toUpperCase(),
        action: () => this.modifierChoice(modifier),
        color: this.getModifierColor(modifier.type),
        description: modifier.effect
      });
    }
    
    // Create choice buttons
    choices.forEach((choice, index) => {
      this.createChoiceButton(
        0,
        (index - Math.floor(choices.length / 2)) * 60,
        choice.text,
        choice.action,
        choice.color || '#ffffff',
        choice.description
      );
    });
  }

  createChoiceButton(x, y, text, action, color = '#ffffff', description = null) {
    const button = this.add.container(x, y);
    
    // Button background
    const bg = this.add.rectangle(0, 0, 250, 45, 0x333333, 0.8);
    bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);
    
    // Button text
    const buttonText = this.add.text(0, description ? -8 : 0, text, {
      fontSize: '14px',
      fill: color,
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Description text
    if (description) {
      const descText = this.add.text(0, 8, description, {
        fontSize: '10px',
        fill: '#aaaaaa',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      button.add(descText);
    }
    
    button.add([bg, buttonText]);
    button.setSize(250, 45);
    button.setInteractive();
    
    // Hover effects
    button.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.2);
      buttonText.setScale(1.05);
    });
    
    button.on('pointerout', () => {
      bg.setFillStyle(0x333333, 0.8);
      buttonText.setScale(1);
    });
    
    button.on('pointerup', () => {
      action();
    });
    
    this.roomContainer.add(button);
  }

  getModifierColor(type) {
    const colors = {
      trap: '#ff6b6b',
      shrine: '#4ecdc4',
      curse: '#8b5cf6',
      beacon: '#feca57',
      treasure: '#45b7d1'
    };
    return colors[type] || '#ffffff';
  }

  continueChoice() {
    gameState.increaseGreed(1);
    gameState.roomsSinceLoot++;
    
    // Death risk check
    const deathRisk = gameState.getDeathRisk();
    if (gameRNG.next() * 100 < deathRisk) {
      this.triggerDeath();
      return;
    }
    
    // Check for loot
    if (this.shouldGiveLoot()) {
      this.scene.start('LootRevealScene');
    } else {
      // Continue to next room
      this.generateRoom();
    }
  }

  exitChoice() {
    // Calculate final score
    gameState.score = gameState.calculateScore();
    this.scene.start('GameOverScene', { victory: true });
  }

  modifierChoice(modifier) {
    switch (modifier.type) {
      case 'trap':
        this.cameras.main.shake(300, 0.02);
        if (gameState.takeDamage(1)) {
          this.triggerDeath();
          return;
        }
        // Better loot next time
        gameState.roomsSinceLoot = Math.max(0, gameState.roomsSinceLoot - 1);
        break;
        
      case 'shrine':
        if (gameState.greed >= 2) {
          gameState.decreaseGreed(2);
          gameState.heal(1);
          this.showHealEffect();
        }
        break;
        
      case 'treasure':
        gameState.increaseGreed(1);
        gameState.treasureValue += gameRNG.nextInt(50, 150);
        break;
    }
    
    this.updateHUD();
    
    // Continue to next room or loot
    if (this.shouldGiveLoot()) {
      this.scene.start('LootRevealScene');
    } else {
      this.generateRoom();
    }
  }

  shouldGiveLoot() {
    // Base loot chance + pity system + streak chest
    let lootChance = 0.15;
    
    if (gameState.shouldActivatePity()) {
      lootChance *= 1.5;
    }
    
    if (gameState.safeRoomStreak >= 3) {
      lootChance += 0.3;
      gameState.safeRoomStreak = 0;
    }
    
    if (gameRNG.next() < lootChance) {
      gameState.roomsSinceLoot = 0;
      return true;
    }
    
    return false;
  }

  triggerDeath() {
    // Death screen shake and fade
    this.cameras.main.shake(500, 0.05);
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    
    this.time.delayedCall(1000, () => {
      gameState.score = gameState.calculateScore();
      this.scene.start('GameOverScene', { victory: false });
    });
  }

  showHealEffect() {
    // Green pulse effect
    const healEffect = this.add.circle(187.5, 333.5, 200, 0x4ecdc4, 0.3);
    
    this.tweens.add({
      targets: healEffect,
      alpha: 0,
      scale: 2,
      duration: 500,
      ease: 'Power2',
      onComplete: () => healEffect.destroy()
    });
  }

  updateHUD() {
    this.updateHPDisplay();
    this.createGreedBar();
    this.updateStats();
    this.depthText.setText(`DEPTH: ${gameState.depth}`);
  }
}