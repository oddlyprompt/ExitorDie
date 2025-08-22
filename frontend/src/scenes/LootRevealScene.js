import Phaser from 'phaser';
import { gameRNG } from '../utils/SeededRNG.js';
import { gameState } from '../utils/GameState.js';

export class LootRevealScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LootRevealScene' });
  }

  create() {
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x2d1b69, 0x2d1b69, 1);
    bg.fillRect(0, 0, 375, 667);

    // Title
    this.add.text(187.5, 80, 'LOOT DISCOVERED!', {
      fontSize: '24px',
      fill: '#feca57',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Pre-roll the loot rarity (deterministic)
    this.rolledRarity = this.rollLootRarity();
    
    // Create roulette wheel
    this.createRouletteWheel();
    
    // Spin button
    this.createSpinButton();
    
    // Track animation state
    this.isSpinning = false;
  }

  rollLootRarity() {
    const rarities = gameState.contentPack.rarities;
    
    // Apply pity system bonus
    let adjustedRarities = [...rarities];
    if (gameState.shouldActivatePity()) {
      adjustedRarities = adjustedRarities.map(r => ({
        ...r,
        weight: r.weight * (r.name === 'Common' ? 0.5 : 1.2)
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

  createRouletteWheel() {
    this.wheelContainer = this.add.container(187.5, 300);
    
    const radius = 100;
    const rarities = gameState.contentPack.rarities;
    const anglePerSlice = (Math.PI * 2) / rarities.length;
    
    // Wheel background
    const wheelBg = this.add.circle(0, 0, radius + 10, 0x333333);
    wheelBg.setStrokeStyle(4, 0xff6b6b);
    this.wheelContainer.add(wheelBg);
    
    // Create wheel slices
    this.wheelSlices = [];
    rarities.forEach((rarity, index) => {
      const startAngle = index * anglePerSlice - Math.PI / 2;
      const endAngle = (index + 1) * anglePerSlice - Math.PI / 2;
      
      // Slice graphics
      const slice = this.add.graphics();
      slice.fillStyle(Phaser.Display.Color.HexStringToColor(rarity.color).color, 0.8);
      slice.beginPath();
      slice.moveTo(0, 0);
      slice.arc(0, 0, radius, startAngle, endAngle);
      slice.closePath();
      slice.fillPath();
      
      // Slice border
      slice.lineStyle(2, 0x000000);
      slice.strokePath();
      
      // Rarity label
      const labelAngle = startAngle + anglePerSlice / 2;
      const labelX = Math.cos(labelAngle) * (radius * 0.7);
      const labelY = Math.sin(labelAngle) * (radius * 0.7);
      
      const label = this.add.text(labelX, labelY, rarity.name.substr(0, 3).toUpperCase(), {
        fontSize: '10px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      
      this.wheelContainer.add([slice, label]);
      this.wheelSlices.push({ slice, rarity, angle: labelAngle });
    });
    
    // Wheel pointer
    const pointer = this.add.triangle(0, -radius - 15, 0, 0, -10, 20, 10, 20, 0xff6b6b);
    this.wheelContainer.add(pointer);
  }

  createSpinButton() {
    this.spinButton = this.add.container(187.5, 500);
    
    const buttonBg = this.add.rectangle(0, 0, 150, 50, 0x333333, 0.8);
    buttonBg.setStrokeStyle(2, 0xff6b6b);
    
    const buttonText = this.add.text(0, 0, 'SPIN!', {
      fontSize: '18px',
      fill: '#ff6b6b',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    this.spinButton.add([buttonBg, buttonText]);
    this.spinButton.setSize(150, 50);
    this.spinButton.setInteractive();
    
    this.spinButton.on('pointerover', () => {
      buttonBg.setFillStyle(0xff6b6b, 0.3);
      buttonText.setScale(1.1);
    });
    
    this.spinButton.on('pointerout', () => {
      buttonBg.setFillStyle(0x333333, 0.8);
      buttonText.setScale(1);
    });
    
    this.spinButton.on('pointerup', () => {
      if (!this.isSpinning) {
        this.spinWheel();
      }
    });
  }

  spinWheel() {
    this.isSpinning = true;
    this.spinButton.setAlpha(0.5);
    
    // Calculate target angle to land on pre-rolled rarity
    const rarities = gameState.contentPack.rarities;
    const targetIndex = rarities.findIndex(r => r.name === this.rolledRarity.name);
    const anglePerSlice = (Math.PI * 2) / rarities.length;
    const targetAngle = (targetIndex * anglePerSlice) + (anglePerSlice / 2);
    
    // Add extra spins for dramatic effect
    const extraSpins = gameRNG.nextInt(3, 6) * Math.PI * 2;
    const finalAngle = targetAngle + extraSpins;
    
    // Spin animation
    this.tweens.add({
      targets: this.wheelContainer,
      rotation: finalAngle,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => {
        this.revealLoot();
      }
    });
    
    // Add spin sound effect (visual feedback)
    this.time.addEvent({
      delay: 100,
      repeat: 29,
      callback: () => {
        const flash = this.add.circle(187.5, 300, 5, 0xffffff, 0.8);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          scale: 3,
          duration: 200,
          onComplete: () => flash.destroy()
        });
      }
    });
  }

  revealLoot() {
    this.isSpinning = false;
    
    // Generate actual loot item
    const lootItem = this.generateLootItem(this.rolledRarity);
    
    // Add to game state
    if (lootItem.type === 'artifact') {
      gameState.addArtifact(lootItem);
    } else {
      gameState.treasureValue += lootItem.value;
    }
    
    // Display loot details
    this.displayLootDetails(lootItem);
    
    // Confetti for Epic+ rarity
    if (['Epic', 'Mythic', 'Ancient', 'Relic', 'Legendary', 'Transcendent', 'OneOfOne'].includes(this.rolledRarity.name)) {
      this.createConfetti();
    }
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
        lore: 'A valuable treasure from the depths.'
      };
    } else {
      // Get available artifacts of this rarity
      const availableArtifacts = gameState.contentPack.artifacts.filter(a => a.rarity === rarity.name);
      const baseArtifact = availableArtifacts.length > 0 ? gameRNG.choice(availableArtifacts) : null;
      
      return {
        type: 'artifact',
        id: gameRNG.generateId(),
        name: baseArtifact ? baseArtifact.name : `${rarity.name} Artifact`,
        rarity: rarity.name,
        effect: baseArtifact ? baseArtifact.effect : 'unknown',
        value: this.calculateArtifactValue(rarity),
        lore: baseArtifact ? baseArtifact.lore : 'A mysterious artifact with unknown powers.',
        cursed: gameRNG.next() < 0.1 // 10% chance of curse
      };
    }
  }

  calculateTreasureValue(rarity) {
    const baseValues = {
      'Common': 50,
      'Uncommon': 100,
      'Rare': 200,
      'Epic': 500,
      'Mythic': 1000,
      'Ancient': 2000,
      'Relic': 4000,
      'Legendary': 8000,
      'Transcendent': 15000,
      'OneOfOne': 30000
    };
    
    const baseValue = baseValues[rarity.name] || 50;
    return baseValue + gameRNG.nextInt(-baseValue * 0.2, baseValue * 0.2);
  }

  calculateArtifactValue(rarity) {
    return Math.floor(this.calculateTreasureValue(rarity) * 1.5);
  }

  displayLootDetails(item) {
    // Remove spin button
    this.spinButton.destroy();
    
    // Loot details container
    const detailsContainer = this.add.container(187.5, 500);
    
    // Item name with rarity color
    const nameText = this.add.text(0, -40, item.name, {
      fontSize: '18px',
      fill: this.rolledRarity.color,
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Item value
    const valueText = this.add.text(0, -15, `Value: ${item.value}`, {
      fontSize: '14px',
      fill: '#feca57',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Item lore
    const loreText = this.add.text(0, 5, item.lore, {
      fontSize: '12px',
      fill: '#cccccc',
      fontFamily: 'Courier New',
      align: 'center',
      wordWrap: { width: 300 }
    }).setOrigin(0.5);
    
    // Cursed indicator
    if (item.cursed) {
      const cursedText = this.add.text(0, 30, '⚠️ CURSED ⚠️', {
        fontSize: '14px',
        fill: '#ff6b6b',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      detailsContainer.add(cursedText);
    }
    
    detailsContainer.add([nameText, valueText, loreText]);
    
    // Continue button
    const continueBtn = this.add.container(187.5, 580);
    const btnBg = this.add.rectangle(0, 0, 120, 40, 0x333333, 0.8);
    btnBg.setStrokeStyle(2, 0x4ecdc4);
    const btnText = this.add.text(0, 0, 'CONTINUE', {
      fontSize: '14px',
      fill: '#4ecdc4',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    continueBtn.add([btnBg, btnText]);
    continueBtn.setSize(120, 40);
    continueBtn.setInteractive();
    
    continueBtn.on('pointerup', () => {
      this.scene.start('RunScene');
    });
  }

  createConfetti() {
    // Create colorful confetti particles
    for (let i = 0; i < 20; i++) {
      const confetti = this.add.circle(
        gameRNG.nextInt(0, 375),
        gameRNG.nextInt(0, 200),
        gameRNG.nextInt(3, 8),
        Phaser.Display.Color.RandomRGB().color
      );
      
      this.tweens.add({
        targets: confetti,
        y: 700,
        rotation: gameRNG.nextFloat(0, Math.PI * 4),
        alpha: 0,
        duration: gameRNG.nextInt(1000, 2000),
        ease: 'Power2',
        onComplete: () => confetti.destroy()
      });
    }
  }
}