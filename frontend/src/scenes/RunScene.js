import Phaser from 'phaser';
import { gameRNG } from '../utils/SeededRNG.js';
import { gameState } from '../utils/GameState.js';
import { audioSystem } from '../utils/AudioSystem.js';
import { runModifiers } from '../utils/RunModifiers.js';
import { GreedBarRenderer } from '../utils/greedBar.js';

export class RunScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RunScene' });
    console.log('🎯 RunScene constructor called');
  }

  init(data = {}) {
  // keep your existing flag logic
  this.shouldGenerateNewRoom =
    data && data.shouldGenerateNewRoom !== false;

  // If TitleScene passed a seed, lock the RNG to it
  if (typeof data.seed !== 'undefined') {
    setSeed(data.seed);                 // apply to global RNG
    gameState.seed = data.seed;         // store numeric seed
    if (data.seedString) {
      gameState.seedString = data.seedString.trim(); // keep the label the player typed
    }
  }
}

  create() {
    console.log('🎯 RunScene create() method called');
    try {
      // Initialize error handling for the whole scene
      this.scene.manager.game.events.on('prestep', () => {
        // Catch any uncaught errors during game loop
      });

      // Background
      console.log('🎯 Creating background...');
      this.createBackground();
      
      // HUD - Fixed layout to prevent overlap
      console.log('🎯 Creating HUD...');
      this.createHUD();
      
      // Generate room - either first room or new room after loot
      if (this.shouldGenerateNewRoom) {
        console.log('🎯 Generating NEW room after loot...');
        this.generateRoom();
      } else {
        console.log('🎯 Generating FIRST room...');
        this.generateRoom();
      }
      
      // Track screen shake camera
      console.log('🎯 Setting camera background...');
      this.cameras.main.setBackgroundColor(0x1a1a1a);
      
      console.log('✅ RunScene created successfully!');
    } catch (error) {
      console.error('❌ CRITICAL ERROR in RunScene create():', error);
      console.error('❌ Error stack:', error.stack);
      
      // Show error message on screen
      this.add.text(187.5, 300, `LOADING ERROR:\n${error.message}`, {
        fontSize: '16px',
        fill: '#ff0000',
        fontFamily: 'Courier New',
        align: 'center'
      }).setOrigin(0.5);
      
      // Add back to title button
      const backButton = this.add.text(187.5, 400, 'BACK TO TITLE', {
        fontSize: '14px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      
      backButton.setInteractive();
      backButton.on('pointerup', () => {
        this.scene.start('TitleScene');
      });
    }
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
    // Initialize greed bar renderer
    this.greedBarRenderer = new GreedBarRenderer(this);
    
    // Fixed HUD layout with much more spacing
    this.hud = this.add.container(0, 0);
    
    // ==============================================
    // TOP ROW: Hearts, Depth, Exit/Risk (row 1)
    // ==============================================
    
    // HP Hearts (left side)
    this.hpContainer = this.add.container(20, 20);
    this.updateHPDisplay();
    
    // Depth display (center)
    const depthFontSize = this.getResponsiveFontSize(14, 2.0, 18);
    this.depthText = this.add.text(187.5, 20, `DEPTH: ${gameState.depth}`, {
      fontSize: depthFontSize,
      fill: '#cccccc',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Seed badge (center, below depth)
    const seedFontSize = this.getResponsiveFontSize(10, 1.5, 14);
    this.seedText = this.add.text(187.5, 38, `🎲 ${gameState.getSeedDisplay()}`, {
      fontSize: seedFontSize,
      fill: '#888888',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Exit/Risk stats (right side)
    this.statsContainer = this.add.container(320, 20);
    this.updateStats();
    
    // ==============================================
    // SECOND ROW: Greed Bar (much more spacing - row 2)
    // ==============================================
    this.greedBarContainer = this.greedBarRenderer.createGreedBar(90, 60);
    
    // ==============================================
    // THIRD ROW: Equipment (well below greed bar - row 3)
    // ==============================================
    this.equipContainer = this.add.container(20, 85);
    this.updateEquipmentDisplay();
    
    // ==============================================
    // FOURTH ROW: Consumables (below equipment - row 4)
    // ==============================================
    this.consumablesContainer = this.add.container(20, 110);
    this.updateConsumablesDisplay();

    // Add all components to main HUD container
    this.hud.add([
      this.hpContainer,
      this.depthText,
      this.seedText,
      this.statsContainer,
      this.greedBarContainer,
      this.equipContainer,
      this.consumablesContainer
    ]);
  }

  updateHPDisplay() {
    this.hpContainer.removeAll(true);
    
    // Add HP hearts with glow effect
    for (let i = 0; i < gameState.maxHP; i++) {
      const heartSize = this.getResponsiveFontSize(16, 2.2, 20);
      const heart = this.add.text(i * 22, 0, i < gameState.hp ? '♥' : '♡', {
        fontSize: heartSize,
        fill: i < gameState.hp ? '#ff6b6b' : '#666666',
        fontFamily: 'Courier New'
      });
      
      // Add subtle glow for filled hearts
      if (i < gameState.hp) {
        heart.setStroke('#000000', 1);
        heart.setShadow(0, 0, '#ff6b6b', 3, true, false);
      }
      
      this.hpContainer.add(heart);
    }
  }

  // Remove old createGreedBar method since it's now handled by GreedBarRenderer
  
  /**
   * Calculate responsive font size based on game scale
   * @param {number} minSize - Minimum font size in pixels
   * @param {number} vwMultiplier - Viewport width multiplier
   * @param {number} maxSize - Maximum font size in pixels
   * @returns {string} - Font size as string with 'px'
   */
  getResponsiveFontSize(minSize, vwMultiplier, maxSize) {
    const gameWidth = this.scale.gameSize.width;
    const scaleFactor = gameWidth / 375; // Base width of 375px
    
    const calculatedSize = Math.max(minSize, Math.min(maxSize, vwMultiplier * scaleFactor * 8));
    return `${Math.round(calculatedSize)}px`;
  }

  updateEquipmentDisplay() {
    this.equipContainer.removeAll(true);
    
    const equippedItems = gameState.equipSystem.getEquippedItems();
    
    if (equippedItems.length > 0 || gameState.equipSystem.bankedItems.length > 0) {
      const label = this.add.text(0, 0, 'EQUIP:', {
        fontSize: '12px',
        fill: '#cccccc',
        fontFamily: 'Courier New'
      });
      this.equipContainer.add(label);
      
      let xOffset = 50;
      
      // Show equipped items
      for (let i = 0; i < 2; i++) {
        const item = gameState.equipSystem.slots[i];
        const slotText = this.add.text(xOffset, 0, item ? `E${i+1}:${item.name.substr(0, 8)}` : `E${i+1}:---`, {
          fontSize: '10px',
          fill: item ? this.getRarityColor(item.rarity) : '#666666',
          fontFamily: 'Courier New'
        });
        this.equipContainer.add(slotText);
        xOffset += 80;
      }
      
      // Show banked count
      if (gameState.equipSystem.bankedItems.length > 0) {
        const bankedText = this.add.text(xOffset, 0, `BANK:${gameState.equipSystem.bankedItems.length}`, {
          fontSize: '10px',
          fill: '#feca57',
          fontFamily: 'Courier New'
        });
        this.equipContainer.add(bankedText);
      }
    }
  }

  updateConsumablesDisplay() {
    this.consumablesContainer.removeAll(true);
    
    const smokeBombs = gameState.getSmokeBombCount();
    const bandages = gameState.getFieldBandageCount();
    
    if (smokeBombs > 0 || bandages > 0) {
      const label = this.add.text(0, 0, 'ITEMS:', {
        fontSize: '12px',
        fill: '#cccccc',
        fontFamily: 'Courier New'
      });
      this.consumablesContainer.add(label);
      
      let xOffset = 45;
      
      if (smokeBombs > 0) {
        const smokeText = this.add.text(xOffset, 0, `💨${smokeBombs}`, {
          fontSize: '12px',
          fill: '#9ca3af',
          fontFamily: 'Courier New'
        });
        this.consumablesContainer.add(smokeText);
        xOffset += 35;
      }
      
      if (bandages > 0) {
        const bandageText = this.add.text(xOffset, 0, `🩹${bandages}`, {
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
    
    // Use responsive font size for stats
    const statsFontSize = this.getResponsiveFontSize(10, 1.5, 14);
    
    // Exit percentage with color coding and glow
    const exitColor = exitOdds > 20 ? '#4ecdc4' : '#cccccc';
    const exitText = this.add.text(0, 0, `EXIT: ${exitOdds}%`, {
      fontSize: statsFontSize,
      fill: exitColor,
      fontFamily: 'Courier New'
    }).setOrigin(1, 0);
    
    // Add glow effect for good exit odds
    if (exitOdds > 20) {
      exitText.setShadow(0, 0, '#4ecdc4', 2, true, false);
    }
    
    // Risk percentage with color coding and glow
    const riskColor = deathRisk > 35 ? '#ff6b6b' : '#cccccc';
    const riskText = this.add.text(0, 15, `RISK: ${deathRisk}%`, {
      fontSize: statsFontSize,
      fill: riskColor,
      fontFamily: 'Courier New'
    }).setOrigin(1, 0);
    
    // Add glow effect for high risk
    if (deathRisk > 35) {
      riskText.setShadow(0, 0, '#ff6b6b', 2, true, false);
    }
    
    this.statsContainer.add([exitText, riskText]);
  }

  generateRoom() {
    console.log('🎯 generateRoom() called');
    try {
      console.log('🎯 Current gameState.depth:', gameState.depth);
      gameState.visitRoom('standard');
      console.log('🎯 visitRoom() called successfully');
      
      // Recalculate modifiers from equipment at start of each room
      gameState.recalculateModifiers();
      
      // Clear previous room
      if (this.roomContainer) {
        console.log('🎯 Destroying previous room container');
        this.roomContainer.destroy();
      }
      
      console.log('🎯 Creating new room container at position 187.5, 400');
      this.roomContainer = this.add.container(187.5, 400);
      
      // Check if this is a milestone room
      const isMilestone = gameState.isMilestoneRoom();
      console.log('🎯 Is milestone room:', isMilestone);
      
      if (isMilestone) {
        console.log('🎯 Creating milestone room...');
        this.createMilestoneRoom();
      } else {
        console.log('🎯 Creating standard room...');
        this.createStandardRoom();
      }
      
      // Update HUD
      console.log('🎯 Updating HUD...');
      this.updateHUD();
      
      // Depth transition effect (dark flicker)
      console.log('🎯 Adding camera flash effect...');
      this.cameras.main.flash(150, 20, 20, 20, false);
      
      console.log('✅ generateRoom() completed successfully');
    } catch (error) {
      console.error('❌ Error in generateRoom():', error);
      console.error('❌ Error stack:', error.stack);
    }
  }

  createMilestoneRoom() {
    // Play milestone whoosh sound
    audioSystem.playMilestoneWhoosh();

    // Milestone banner
    const banner = this.add.container(0, -150);
    const bannerBg = this.add.rectangle(0, 0, 280, 40, 0xfeca57, 0.9);
    bannerBg.setStrokeStyle(3, 0xffd700);
    const bannerText = this.add.text(0, 0, `✦ MILESTONE ROOM ${gameState.depth} ✦`, {
      fontSize: '16px',
      fill: '#000000',
      fontFamily: 'Courier New',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    banner.add([bannerBg, bannerText]);
    this.roomContainer.add(banner);

    // Flavor text
    const flavorText = gameState.getFlavorText(gameRNG);
    const descText = this.add.text(0, -90, flavorText, {
      fontSize: '14px',
      fill: '#cccccc',
      fontFamily: 'Courier New',
      align: 'center',
      wordWrap: { width: 300 }
    }).setOrigin(0.5);
    this.roomContainer.add(descText);

    // Milestone choices
    this.createMilestoneChoices();
  }

  createStandardRoom() {
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
  }

  createMilestoneChoices() {
    const choices = [];

    // Always have Continue option (guarantees boosted loot)
    choices.push({
      text: 'CONTINUE',
      action: () => this.milestoneContinue(),
      color: '#4ecdc4',
      description: 'Guaranteed boosted loot drop'
    });

    // Exit option based on exit odds
    const exitOdds = gameState.getExitOdds();
    if (gameRNG.next() * 100 < exitOdds || gameState.guaranteedExit) {
      choices.push({
        text: 'EXIT (Safe)',
        action: () => this.exitChoice(),
        color: '#4ecdc4',
        description: 'Leave safely with current loot'
      });
    }

    // Gauntlet option - risk for double reward
    choices.push({
      text: 'GAUNTLET',
      action: () => this.gauntletChoice(),
      color: '#ff6b6b',
      description: 'Take 1 damage → Double boosted loot'
    });

    // Altar option - consume greed for benefits
    if (gameState.greed >= 2) {
      choices.push({
        text: 'ALTAR',
        action: () => this.altarChoice(),
        color: '#8b5cf6',
        description: 'Trade 2 Greed → Heal +1 & +10% exit odds'
      });
    }

    // Add consumable options
    this.addConsumableChoices(choices);

    // Create choice buttons
    this.layoutChoiceButtons(choices);
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
    if (gameRNG.next() * 100 < exitOdds || gameState.guaranteedExit) {
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

    // Add consumable options
    this.addConsumableChoices(choices);
    
    // Create choice buttons
    this.layoutChoiceButtons(choices);
  }

  addConsumableChoices(choices) {
    // Add consumable actions if available
    if (gameState.getSmokeBombCount() > 0) {
      choices.push({
        text: 'USE SMOKE BOMB',
        action: () => this.useSmokeBomb(),
        color: '#9ca3af',
        description: 'Skip room hazard, continue safely'
      });
    }
    
    if (gameState.getFieldBandageCount() > 0 && gameState.hp < gameState.maxHP) {
      choices.push({
        text: 'USE FIELD BANDAGE',
        action: () => this.useFieldBandage(),
        color: '#22c55e',
        description: '+1 HP (if not at max)'
      });
    }
  }

  layoutChoiceButtons(choices) {
    // ALL buttons should be the same size for consistency
    const buttonsPerRow = 2;
    const buttonWidth = 160;
    
    // Use consistent height for ALL buttons - taller to accommodate any subtext
    const buttonHeight = 70; // Always use larger size for uniformity
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
        buttonHeight // Always pass the same height
      );
    });
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

  createChoiceButton(x, y, text, action, color = '#ffffff', description = null, width = 160, height = 50) {
    const button = this.add.container(x, y);
    
    // Use the height parameter directly - no more dynamic sizing
    const buttonHeight = height;
    
    // Button background with soft glow
    const bg = this.add.rectangle(0, 0, width, buttonHeight, 0x333333, 0.8);
    bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);
    
    // Add subtle inner glow effect
    const glowBg = this.add.rectangle(0, 0, width - 4, buttonHeight - 4, 
      Phaser.Display.Color.HexStringToColor(color).color, 0.05);
    
    // Use consistent font sizes for all buttons
    const mainFontSize = this.getResponsiveFontSize(12, 1.8, 16);
    const subFontSize = this.getResponsiveFontSize(9, 1.2, 12);
    
    // Main button text - center vertically if no description, otherwise move up
    const textY = description ? -buttonHeight * 0.15 : 0;
    const buttonText = this.add.text(0, textY, text, {
      fontSize: mainFontSize,
      fill: color,
      fontFamily: 'Courier New',
      align: 'center',
      wordWrap: { width: width - 20 }
    }).setOrigin(0.5);
    
    // Add text glow effect
    buttonText.setShadow(0, 0, color, 2, false, true);
    
    // Description text - only if description exists
    let descText = null;
    if (description) {
      const descY = buttonHeight * 0.2;
      descText = this.add.text(0, descY, description, {
        fontSize: subFontSize,
        fill: '#aaaaaa',
        fontFamily: 'Courier New',
        align: 'center',
        wordWrap: { width: width - 20 }
      }).setOrigin(0.5);
      
      // Subtle glow for description
      descText.setShadow(0, 0, '#666666', 1, false, true);
    }
    
    // Add all elements to button
    const elements = [glowBg, bg, buttonText];
    if (descText) elements.push(descText);
    button.add(elements);
    
    button.setSize(width, buttonHeight);
    button.setInteractive();
    
    // Enhanced hover effects
    button.on('pointerover', () => {
      bg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.25);
      glowBg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.15);
      
      this.tweens.add({
        targets: buttonText,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 100,
        ease: 'Power2'
      });
      
      buttonText.setShadow(0, 0, color, 4, false, true);
    });
    
    button.on('pointerout', () => {
      bg.setFillStyle(0x333333, 0.8);
      glowBg.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.05);
      
      this.tweens.add({
        targets: buttonText,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power2'
      });
      
      buttonText.setShadow(0, 0, color, 2, false, true);
    });
    
    button.on('pointerup', () => {
      this.tweens.add({
        targets: button,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          action();
        }
      });
    });
    
    this.roomContainer.add(button);
    
    return button;
  }

  // Milestone room actions
  milestoneContinue() {
    console.log('🎯 Milestone CONTINUE clicked');
    
    // Log the action for replay validation
    gameState.replayLog.push({
      depth: gameState.depth,
      action: 'milestone_continue',
      details: 'Chose continue at milestone'
    });
    
    gameState.increaseGreed(1);
    gameState.roomsSinceLoot = 0; // Reset since guaranteed loot
    
    // CRITICAL FIX: Advance depth before loot reveal
    gameState.depth++;
    console.log('🎯 Advanced to depth:', gameState.depth);
    
    // Guaranteed boosted loot
    this.triggerLootReveal(true); // true = milestone boost
  }

  gauntletChoice() {
    console.log('🎯 Milestone GAUNTLET clicked');
    
    // Log the action for replay validation
    gameState.replayLog.push({
      depth: gameState.depth,
      action: 'milestone_gauntlet',
      details: 'Chose gauntlet at milestone'
    });
    
    // Take guaranteed damage
    this.cameras.main.shake(300, 0.03);
    if (gameState.takeDamage(1)) {
      console.log('🎯 Gauntlet killed player');
      this.triggerDeath();
      return;
    }
    
    // Play trap thud sound for damage
    audioSystem.playTrapThud();
    
    console.log('🎯 Gauntlet damage taken, HP now:', gameState.hp);
    gameState.roomsSinceLoot = 0;
    
    // CRITICAL FIX: Advance depth before loot reveal
    gameState.depth++;
    console.log('🎯 Advanced to depth:', gameState.depth);
    
    // Double boosted loot (two spins)
    this.triggerLootReveal(true, true); // milestone boost + double
  }

  altarChoice() {
    console.log('🎯 Milestone ALTAR clicked');
    
    // Log the action for replay validation
    gameState.replayLog.push({
      depth: gameState.depth,
      action: 'milestone_altar',
      details: 'Chose altar at milestone'
    });
    
    gameState.decreaseGreed(2);
    gameState.heal(1);
    gameState.altarBonus = 10; // +10% exit odds next room
    
    // Play heal sparkle sound
    audioSystem.playHealSparkle();
    
    this.showHealEffect();
    
    // Continue to next room
    this.generateRoom();
  }

  // Standard room actions
  continueChoice() {
    // Log the action for replay validation
    gameState.replayLog.push({
      depth: gameState.depth,
      action: 'continue',
      details: 'Safe continue'
    });
    
    gameState.increaseGreed(1);
    gameState.roomsSinceLoot++;
    gameState.safeRoomStreak++;
    
    // Fair death check
    if (gameState.checkDeath(gameRNG)) {
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
    // Log the action for replay validation
    gameState.replayLog.push({
      depth: gameState.depth,
      action: 'exit',
      details: 'Successfully exited'
    });
    
    // Calculate final score
    gameState.score = gameState.calculateScore();
    
    // Transition to victory screen
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
        gameState.guaranteedExit = true;
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
    console.log('🎯 Checking for loot...');
    // Base loot chance
    let lootChance = 0.18;
    console.log('🎯 Base loot chance:', lootChance);
    
    // Pity system (updated to 2 rooms, 6% bonus)
    if (gameState.shouldActivatePity()) {
      const bonusMultiplier = gameState.contentPack.pity?.bonus_next || 6;
      lootChance += bonusMultiplier / 100;
      console.log('🎯 Pity system activated, new chance:', lootChance);
    }
    
    // Streak chest every 3 safe rooms
    if (gameState.safeRoomStreak >= 3) {
      lootChance += 0.35;
      gameState.safeRoomStreak = 0;
      console.log('🎯 Streak chest activated, new chance:', lootChance);
    }
    
    // Curse modifier increases loot chance
    if (this.curseActive) {
      lootChance += 0.15;
      this.curseActive = false;
      console.log('🎯 Curse modifier activated, new chance:', lootChance);
    }
    
    // Equipment loot bonus
    if (gameState.lootBonus) {
      lootChance += gameState.lootBonus / 100;
      console.log('🎯 Equipment loot bonus activated, new chance:', lootChance);
    }
    
    // Apply RunModifiers loot chance bonus
    const finalLootChance = runModifiers.calculateFinalLootChance(lootChance);
    console.log('🎯 Final loot chance after modifiers:', finalLootChance);
    
    const roll = gameRNG.next();
    console.log('🎯 Loot roll:', roll, 'vs chance:', finalLootChance);
    
    if (roll < finalLootChance) {
      gameState.roomsSinceLoot = 0;
      console.log('✅ LOOT GRANTED!');
      return true;
    }
    
    console.log('❌ No loot this time');
    return false;
  }

  triggerLootReveal(milestoneBoost = false, doubleReward = false) {
    // Pre-roll rarity and generate item data BEFORE going to LootReveal
    const rolledRarity = this.rollLootRarity(milestoneBoost);
    
    // Generate procedural item instead of fixed artifacts
    const itemData = gameState.generateProceduralItem(gameRNG, rolledRarity.name);
    
    // Pass the pre-rolled data to LootReveal scene
    this.scene.start('LootRevealScene', {
      rolledRarity: rolledRarity,
      itemData: itemData,
      doubleReward: doubleReward
    });
  }

  rollLootRarity(milestoneBoost = false) {
    const rarities = gameState.contentPack.rarities || gameState.contentPack.rarity_weights;
    
    // Convert to array format if needed
    let rarityArray = rarities;
    if (!Array.isArray(rarities)) {
      rarityArray = Object.entries(rarities).map(([name, weight]) => {
        const colorMap = {
          'Common': '#9ca3af', 'Uncommon': '#22c55e', 'Rare': '#3b82f6', 'Epic': '#8b5cf6',
          'Mythic': '#f59e0b', 'Ancient': '#ef4444', 'Relic': '#ec4899', 'Legendary': '#06b6d4',
          'Transcendent': '#eab308', '1/1': '#dc2626'
        };
        return { name, weight, color: colorMap[name] || '#cccccc' };
      });
    }
    
    // Apply milestone boost (+1 rarity step)
    let adjustedRarities = [...rarityArray];
    if (milestoneBoost) {
      // Shift weights toward higher rarities
      adjustedRarities = adjustedRarities.map((r, index) => ({
        ...r,
        weight: index < 3 ? r.weight * 0.6 : r.weight * 1.4
      }));
    }
    
    // Apply pity system bonus
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

  getRarityColor(rarity) {
    const colors = {
      'Common': '#9ca3af', 'Uncommon': '#22c55e', 'Rare': '#3b82f6', 'Epic': '#8b5cf6',
      'Mythic': '#f59e0b', 'Ancient': '#ef4444', 'Relic': '#ec4899', 'Legendary': '#06b6d4',
      'Transcendent': '#eab308', '1/1': '#dc2626'
    };
    return colors[rarity] || '#cccccc';
  }

  triggerDeath() {
    // Log the death action for replay validation
    gameState.replayLog.push({
      depth: gameState.depth,
      action: 'death',
      details: 'Player died'
    });
    
    // Calculate final score before death
    gameState.score = gameState.calculateScore();
    
    // Play death boom sound
    audioSystem.playDeathBoom();
    
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
    const healEffect = this.add.circle(20 + (gameState.maxHP * 20) / 2, 20, 50, 0x4ecdc4, 0.5);
    
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
    // Update all HUD components
    this.updateHPDisplay();
    
    // Update greed bar using the new renderer
    if (this.greedBarContainer && this.greedBarRenderer) {
      this.greedBarRenderer.updateGreedBar(this.greedBarContainer, gameState.greed, 10);
    }
    
    this.updateStats();
    this.updateEquipmentDisplay();
    this.updateConsumablesDisplay();
    
    // Update depth text with responsive sizing
    const depthFontSize = this.getResponsiveFontSize(14, 2.0, 18);
    this.depthText.setText(`DEPTH: ${gameState.depth}`);
    this.depthText.setFontSize(depthFontSize);
    
    // Update seed text
    const seedFontSize = this.getResponsiveFontSize(10, 1.5, 14);
    this.seedText.setText(`🎲 ${gameState.getSeedDisplay()}`);
    this.seedText.setFontSize(seedFontSize);
  }
}