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

    // Add atmospheric particles
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
    
    // HP Hearts (now 4 max)
    this.hpContainer = this.add.container(20, 30);
    this.updateHPDisplay();
    
    // Greed Bar
    this.greedContainer = this.add.container(20, 70);
    this.createGreedBar();
    
    // Stats container (top right)
    this.statsContainer = this.add.container(280, 30);
    this.updateStats();
    
    // Depth indicator with seed display
    this.depthText = this.add.text(187.5, 20, `DEPTH: ${gameState.depth}`, {
      fontSize: '16px',
      fill: '#cccccc',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Seed indicator (shows determinism)
    this.seedText = this.add.text(187.5, 40, `🎲 ${gameState.getSeedDisplay()}`, {
      fontSize: '12px',
      fill: '#888888',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Consumables display
    this.consumablesContainer = this.add.container(20, 110);
    this.updateConsumablesDisplay();

    this.hud.add([this.hpContainer, this.greedContainer, this.statsContainer, this.depthText, this.seedText, this.consumablesContainer]);
  }

  updateHPDisplay() {
    this.hpContainer.removeAll(true);
    
    // Add HP hearts (max 4 now)
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

  updateConsumablesDisplay() {
    this.consumablesContainer.removeAll(true);
    
    if (gameState.smokeBombs > 0 || gameState.fieldBandages > 0) {
      const label = this.add.text(0, 0, 'ITEMS:', {
        fontSize: '12px',
        fill: '#cccccc',
        fontFamily: 'Courier New'
      });
      this.consumablesContainer.add(label);
      
      let xOffset = 50;
      
      if (gameState.smokeBombs > 0) {
        const smokeText = this.add.text(xOffset, 0, `💨 ${gameState.smokeBombs}`, {
          fontSize: '12px',
          fill: '#9ca3af',
          fontFamily: 'Courier New'
        });
        this.consumablesContainer.add(smokeText);
        xOffset += 40;
      }
      
      if (gameState.fieldBandages > 0) {
        const bandageText = this.add.text(xOffset, 0, `🩹 ${gameState.fieldBandages}`, {
          fontSize: '12px',
          fill: '#22c55e',
          fontFamily: 'Courier New'
        });
        this.consumablesContainer.add(bandageText);
      }
    }
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
      fill: deathRisk > 35 ? '#ff6b6b' : '#cccccc',
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
    
    // Procedural flavor text
    const flavorText = gameState.getFlavorText(gameRNG);
    const descText = this.add.text(0, -120, flavorText, {
      fontSize: '14px',
      fill: '#cccccc',
      fontFamily: 'Courier New',
      align: 'center',
      wordWrap: { width: 300 }
    }).setOrigin(0.5);
    
    // Generate room modifier based on hazard budget
    const modifier = this.generateRoomModifier();
    
    // Room choices
    this.createRoomChoices(modifier);
    
    this.roomContainer.add(descText);
    
    // Update HUD
    this.updateHUD();
    
    // Depth transition effect (dark flicker)
    this.cameras.main.flash(150, 20, 20, 20, false);
  }

  generateRoomModifier() {
    const budget = gameState.getHazardBudget();
    const modifiers = [
      { type: 'trap', cost: 1.5, name: 'Spiked Floor', effect: 'Take 1 damage, but better loot awaits', color: '#ff6b6b' },
      { type: 'shrine', cost: 1, name: 'Healing Shrine', effect: 'Trade 2 Greed for 1 HP', color: '#4ecdc4' },
      { type: 'curse', cost: 2, name: 'Cursed Altar', effect: 'Higher rarity loot, but +5% death risk', color: '#8b5cf6' },
      { type: 'beacon', cost: 3, name: 'Exit Beacon', effect: 'Guarantees exit option next room', color: '#feca57' },
      { type: 'treasure', cost: 1.5, name: 'Treasure Pile', effect: 'Take for gold and +1 Greed', color: '#45b7d1' }
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
      action: () => this.continueChoice(),
      color: '#ffffff'
    });
    
    // Exit option based on exit odds
    const exitOdds = gameState.getExitOdds();
    if (gameRNG.next() * 100 < exitOdds) {
      choices.push({
        text: 'EXIT (Safe)',
        action: () => this.exitChoice(),
        color: '#4ecdc4',
        description: 'Leave safely with current loot'
      });
    }
    
    // Add modifier choice if present
    if (modifier) {
      choices.push({
        text: modifier.name.toUpperCase(),
        action: () => this.modifierChoice(modifier),
        color: modifier.color,
        description: modifier.effect
      });
    }
    
    // Add consumable actions if available
    if (gameState.smokeBombs > 0) {
      choices.push({
        text: 'USE SMOKE BOMB',
        action: () => this.useSmokeBomb(),
        color: '#9ca3af',
        description: 'Skip room hazard, continue safely'
      });
    }
    
    if (gameState.fieldBandages > 0 && gameState.hp < gameState.maxHP) {
      choices.push({
        text: 'USE FIELD BANDAGE',
        action: () => this.useFieldBandage(),
        color: '#22c55e',
        description: '+1 HP (if not at max)'
      });
    }
    
    // Create choice buttons
    const buttonsPerRow = 2;
    const buttonWidth = 160;
    const buttonHeight = 50;
    const spacing = 10;
    
    choices.forEach((choice, index) => {
      const row = Math.floor(index / buttonsPerRow);
      const col = index % buttonsPerRow;
      const totalWidth = (buttonWidth + spacing) * Math.min(choices.length - row * buttonsPerRow, buttonsPerRow) - spacing;
      const startX = -totalWidth / 2 + col * (buttonWidth + spacing) + buttonWidth / 2;
      const y = (row - Math.floor((choices.length - 1) / buttonsPerRow) / 2) * (buttonHeight + spacing);
      
      this.createChoiceButton(
        startX,
        y,
        choice.text,
        choice.action,
        choice.color,
        choice.description,
        buttonWidth,
        buttonHeight
      );
    });
  }

  createChoiceButton(x, y, text, action, color = '#ffffff', description = null, width = 160, height = 50) {
    const button = this.add.container(x, y);
    
    // Button background
    const bg = this.add.rectangle(0, 0, width, height, 0x333333, 0.8);
    bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);
    
    // Button text
    const fontSize = text.length > 12 ? '11px' : '13px';
    const buttonText = this.add.text(0, description ? -8 : 0, text, {
      fontSize: fontSize,
      fill: color,
      fontFamily: 'Courier New',
      align: 'center',
      wordWrap: { width: width - 10 }
    }).setOrigin(0.5);
    
    // Description text
    if (description) {
      const descText = this.add.text(0, 8, description, {
        fontSize: '9px',
        fill: '#aaaaaa',
        fontFamily: 'Courier New',
        align: 'center',
        wordWrap: { width: width - 10 }
      }).setOrigin(0.5);
      button.add(descText);
    }
    
    button.add([bg, buttonText]);
    button.setSize(width, height);
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

  continueChoice() {
    gameState.increaseGreed(1);
    gameState.roomsSinceLoot++;
    gameState.safeRoomStreak++;
    
    // Death risk check
    const deathRisk = gameState.getDeathRisk();
    if (gameRNG.next() * 100 < deathRisk) {
      this.triggerDeath();
      return;
    }
    
    // Check for loot
    if (this.shouldGiveLoot()) {
      this.triggerLootReveal();
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
        // Screen shake effect (120ms)
        this.cameras.main.shake(120, 0.02);
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
        
      case 'curse':
        // Temporary curse effect - increase loot rarity but add risk
        this.curseActive = true;
        break;
        
      case 'beacon':
        // Set flag for guaranteed exit next room
        this.guaranteedExit = true;
        break;
        
      case 'treasure':
        gameState.increaseGreed(1);
        gameState.treasureValue += gameRNG.nextInt(75, 200);
        break;
    }
    
    this.updateHUD();
    
    // Continue to next room or loot
    if (this.shouldGiveLoot()) {
      this.triggerLootReveal();
    } else {
      this.generateRoom();
    }
  }

  useSmokeBomb() {
    if (gameState.useSmokeBomb()) {
      // Skip room safely
      gameState.roomsSinceLoot++;
      gameState.safeRoomStreak++;
      
      // Show smoke effect
      this.showSmokeEffect();
      
      // Check for loot
      if (this.shouldGiveLoot()) {
        this.triggerLootReveal();
      } else {
        this.generateRoom();
      }
    }
  }

  useFieldBandage() {
    if (gameState.useFieldBandage()) {
      this.showHealEffect();
      this.updateHUD();
    }
  }

  shouldGiveLoot() {
    // Base loot chance
    let lootChance = 0.18;
    
    // Pity system (updated to 2 rooms, 6% bonus)
    if (gameState.shouldActivatePity()) {
      const bonusMultiplier = gameState.contentPack.curves?.pitySystem?.bonusMultiplier || 
                             gameState.contentPack.pity?.bonus_next || 6;
      lootChance += bonusMultiplier / 100;
    }
    
    // Streak chest every 3 safe rooms
    if (gameState.safeRoomStreak >= 3) {
      lootChance += 0.35;
      gameState.safeRoomStreak = 0;
    }
    
    // Curse modifier increases loot chance
    if (this.curseActive) {
      lootChance += 0.15;
      this.curseActive = false;
    }
    
    if (gameRNG.next() < lootChance) {
      gameState.roomsSinceLoot = 0;
      return true;
    }
    
    return false;
  }

  triggerLootReveal() {
    // Pre-roll rarity and generate item data BEFORE going to LootReveal
    const rolledRarity = this.rollLootRarity();
    const itemData = this.generateLootItem(rolledRarity);
    
    // Pass the pre-rolled data to LootReveal scene
    this.scene.start('LootRevealScene', {
      rolledRarity: rolledRarity,
      itemData: itemData
    });
  }

  rollLootRarity() {
    const rarities = gameState.contentPack.rarities;
    
    // Apply pity system bonus
    let adjustedRarities = [...rarities];
    if (gameState.shouldActivatePity()) {
      adjustedRarities = adjustedRarities.map(r => ({
        ...r,
        weight: r.name === 'Common' ? r.weight * 0.5 : r.weight * 1.2
      }));
    }
    
    // Curse effect boosts higher rarities
    if (this.curseActive) {
      adjustedRarities = adjustedRarities.map((r, index) => ({
        ...r,
        weight: index < 3 ? r.weight * 0.7 : r.weight * 1.4
      }));
    }
    
    // Weighted selection
    const totalWeight = adjustedRarities.reduce((sum, r) => sum + r.weight, 0);
    let random = gameRNG.nextFloat(0, totalWeight);
    
    for (const rarity of adjustedRarities) {
      random -= rarity.weight;
      if (random <= 0) {
        return rarity;
      }
    }
    
    return adjustedRarities[0]; // fallback
  }

  generateLootItem(rarity) {
    const itemTypes = ['treasure', 'artifact'];
    const type = gameRNG.choice(itemTypes);
    
    if (type === 'treasure') {
      return {
        type: 'treasure',
        name: `${rarity.name} Treasure`,
        rarity: rarity.name,
        value: this.calculateTreasureValue(rarity),
        lore: 'Valuable treasure from the depths.'
      };
    } else {
      // Get available artifacts of this rarity
      const availableArtifacts = gameState.contentPack.artifacts.filter(a => a.rarity === rarity.name);
      const baseArtifact = availableArtifacts.length > 0 ? gameRNG.choice(availableArtifacts) : null;
      
      // Generate hash (deterministic)
      const hash_data = `${gameState.contentPack.version}:${gameState.depth}:${gameRNG.state}:${rarity.name}`;
      const itemHash = this.simpleHash(hash_data);
      
      return {
        type: 'artifact',
        id: baseArtifact ? baseArtifact.id : itemHash,
        hash: itemHash,
        name: baseArtifact ? baseArtifact.name : `${rarity.name} Artifact`,
        rarity: rarity.name,
        effect: baseArtifact ? baseArtifact.effect : 'unknown',
        value: this.calculateArtifactValue(rarity),
        lore: baseArtifact ? baseArtifact.lore : 'A mysterious artifact with unknown powers.',
        cursed: gameRNG.next() < 0.1 // 10% chance of curse
      };
    }
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substr(0, 8);
  }

  calculateTreasureValue(rarity) {
    const baseValues = {
      'Common': 50, 'Uncommon': 100, 'Rare': 200, 'Epic': 500, 'Mythic': 1000,
      'Ancient': 2000, 'Relic': 4000, 'Legendary': 8000, 'Transcendent': 15000, '1/1': 30000
    };
    
    const baseValue = baseValues[rarity.name] || 50;
    return baseValue + gameRNG.nextInt(-baseValue * 0.2, baseValue * 0.2);
  }

  calculateArtifactValue(rarity) {
    return Math.floor(this.calculateTreasureValue(rarity) * 1.5);
  }

  triggerDeath() {
    // Death screen shake and fade
    this.cameras.main.shake(500, 0.05);
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    
    // Show "You Died" text
    const deathText = this.add.text(187.5, 333.5, 'YOU DIED', {
      fontSize: '36px',
      fill: '#ff6b6b',
      fontFamily: 'Courier New',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    const statsText = this.add.text(187.5, 380, 
      `Depth ${gameState.depth} • Greed ${gameState.greed}/10\nMultiplier: x${(1 + gameState.greed * 0.1).toFixed(1)}`, {
      fontSize: '14px',
      fill: '#cccccc',
      fontFamily: 'Courier New',
      align: 'center'
    }).setOrigin(0.5);
    
    this.time.delayedCall(1500, () => {
      gameState.score = gameState.calculateScore();
      this.scene.start('GameOverScene', { victory: false });
    });
  }

  showHealEffect() {
    // Green pulse effect around HP
    const healEffect = this.add.circle(20 + (gameState.maxHP * 25) / 2, 30, 60, 0x4ecdc4, 0.4);
    
    this.tweens.add({
      targets: healEffect,
      alpha: 0,
      scale: 2,
      duration: 600,
      ease: 'Power2',
      onComplete: () => healEffect.destroy()
    });
  }

  showSmokeEffect() {
    // Smoke cloud effect
    for (let i = 0; i < 8; i++) {
      const smoke = this.add.circle(
        187.5 + gameRNG.nextInt(-50, 50),
        400 + gameRNG.nextInt(-30, 30),
        gameRNG.nextInt(10, 20),
        0x666666,
        0.6
      );
      
      this.tweens.add({
        targets: smoke,
        alpha: 0,
        scale: 2,
        y: smoke.y - 50,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => smoke.destroy()
      });
    }
  }

  updateHUD() {
    this.updateHPDisplay();
    this.createGreedBar();
    this.updateStats();
    this.updateConsumablesDisplay();
    this.depthText.setText(`DEPTH: ${gameState.depth}`);
  }
}