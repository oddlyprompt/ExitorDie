import Phaser from 'phaser';
import { gameRNG } from '../utils/SeededRNG.js';
import { gameState } from '../utils/GameState.js';

export class LootRevealScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LootRevealScene' });
  }

  init(data) {
    // Receive pre-rolled rarity and item data - NEVER roll again
    this.rolledRarity = data.rolledRarity;
    this.itemData = data.itemData;
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

    // Create deterministic roulette wheel
    this.createRouletteWheel();
    
    // Spin button
    this.createSpinButton();
    
    // Track animation state
    this.isSpinning = false;
  }

  createRouletteWheel() {
    this.wheelContainer = this.add.container(187.5, 300);
    
    const radius = 100;
    const rarities = gameState.contentPack.rarities;
    const anglePerSlice = (Math.PI * 2) / rarities.length;
    
    // Build slice map for deterministic targeting
    this.sliceMap = [];
    
    // Wheel background
    const wheelBg = this.add.circle(0, 0, radius + 10, 0x333333);
    wheelBg.setStrokeStyle(4, 0xff6b6b);
    this.wheelContainer.add(wheelBg);
    
    // Create wheel slices
    rarities.forEach((rarity, index) => {
      const startAngle = index * anglePerSlice - Math.PI / 2;
      const endAngle = (index + 1) * anglePerSlice - Math.PI / 2;
      const midAngle = startAngle + anglePerSlice / 2;
      
      // Store slice mapping for deterministic landing
      this.sliceMap.push({
        rarity: rarity.name,
        startAngle: startAngle,
        endAngle: endAngle,
        midAngle: midAngle,
        color: rarity.color
      });
      
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
      const labelX = Math.cos(midAngle) * (radius * 0.7);
      const labelY = Math.sin(midAngle) * (radius * 0.7);
      
      let displayName = rarity.name;
      if (rarity.name === '1/1') displayName = '1/1';
      else if (rarity.name.length > 6) displayName = rarity.name.substr(0, 4) + '.';
      else displayName = rarity.name.substr(0, 6);
      
      const label = this.add.text(labelX, labelY, displayName, {
        fontSize: rarity.name === '1/1' ? '12px' : '10px',
        fill: '#ffffff',
        fontFamily: 'Courier New',
        fontWeight: rarity.name === '1/1' ? 'bold' : 'normal'
      }).setOrigin(0.5);
      
      this.wheelContainer.add([slice, label]);
    });
    
    // Fixed pointer at 12 o'clock (wheel rotates, pointer stays)
    this.pointer = this.add.triangle(187.5, 200 - 15, 0, 0, -10, 20, 10, 20, 0xff6b6b);
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
    
    // Find the target slice for our pre-rolled rarity
    const targetSlice = this.sliceMap.find(slice => slice.rarity === this.rolledRarity.name);
    if (!targetSlice) {
      console.error('Target slice not found for rarity:', this.rolledRarity.name);
      return;
    }
    
    // Calculate target angle (wheel needs to rotate so target slice is at 12 o'clock)
    // The pointer is at -Math.PI/2 (12 o'clock), so we want the midAngle to align there
    let targetAngle = -targetSlice.midAngle - Math.PI / 2;
    
    // Add small jitter for natural feel
    const jitter = gameRNG.nextFloat(-0.1, 0.1);
    targetAngle += jitter;
    
    // Add extra spins for dramatic effect (2-4 full rotations)
    const extraSpins = gameRNG.nextInt(2, 4) * Math.PI * 2;
    const finalAngle = targetAngle + extraSpins;
    
    // Use fast wheel option if enabled
    const spinDuration = gameState.fastWheel ? 900 : 3000;
    
    // Spin animation - rotate the wheel container, not the pointer
    this.tweens.add({
      targets: this.wheelContainer,
      rotation: finalAngle,
      duration: spinDuration,
      ease: 'Power2',
      onComplete: () => {
        this.revealLoot();
      }
    });
    
    // Add visual feedback during spin
    const tickInterval = spinDuration / 30;
    this.time.addEvent({
      delay: tickInterval,
      repeat: 29,
      callback: () => {
        // Small flash effect during spin
        const flash = this.add.circle(187.5, 300, 3, 0xffffff, 0.6);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          scale: 2,
          duration: tickInterval * 2,
          onComplete: () => flash.destroy()
        });
      }
    });
  }

  revealLoot() {
    this.isSpinning = false;
    
    // Add to game state
    if (this.itemData.type === 'artifact') {
      gameState.addArtifact(this.itemData);
    } else {
      gameState.treasureValue += this.itemData.value;
    }
    
    // Show item card popup
    this.showItemCard();
    
    // Confetti for Epic+ rarity
    if (['Epic', 'Mythic', 'Ancient', 'Relic', 'Legendary', 'Transcendent', '1/1'].includes(this.rolledRarity.name)) {
      this.createConfetti();
    }
  }

  showItemCard() {
    // Create modal overlay
    const overlay = this.add.rectangle(187.5, 333.5, 375, 667, 0x000000, 0.7);
    overlay.setInteractive();
    
    // Item card container
    const cardContainer = this.add.container(187.5, 333.5);
    
    // Card background
    const cardBg = this.add.rectangle(0, 0, 280, 200, 0x2a2a2a, 0.95);
    cardBg.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(this.rolledRarity.color).color);
    
    // Item name with rarity color
    const nameText = this.add.text(0, -60, this.itemData.name, {
      fontSize: '18px',
      fill: this.rolledRarity.color,
      fontFamily: 'Courier New',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    // 1/1 badge for special rarity
    if (this.rolledRarity.name === '1/1') {
      const badge = this.add.container(100, -60);
      const badgeBg = this.add.rectangle(0, 0, 30, 20, 0xdc2626);
      const badgeText = this.add.text(0, 0, '1/1', {
        fontSize: '10px',
        fill: '#ffffff',
        fontFamily: 'Courier New',
        fontWeight: 'bold'
      }).setOrigin(0.5);
      badge.add([badgeBg, badgeText]);
      cardContainer.add(badge);
    }
    
    // Item value
    const valueText = this.add.text(0, -30, `Value: ${this.itemData.value}`, {
      fontSize: '14px',
      fill: '#feca57',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Item lore (one line)
    const loreText = this.add.text(0, 0, this.itemData.lore, {
      fontSize: '12px',
      fill: '#cccccc',
      fontFamily: 'Courier New',
      align: 'center',
      wordWrap: { width: 250 }
    }).setOrigin(0.5);
    
    // Rarity name
    const rarityText = this.add.text(0, 25, this.rolledRarity.name.toUpperCase(), {
      fontSize: '12px',
      fill: this.rolledRarity.color,
      fontFamily: 'Courier New',
      fontWeight: 'bold'
    }).setOrigin(0.5);
    
    cardContainer.add([cardBg, nameText, valueText, loreText, rarityText]);
    
    // Show card with animation
    cardContainer.setScale(0);
    this.tweens.add({
      targets: cardContainer,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Auto-close after 1.2 seconds
    this.time.delayedCall(1200, () => {
      this.tweens.add({
        targets: [overlay, cardContainer],
        alpha: 0,
        scale: 0.8,
        duration: 200,
        onComplete: () => {
          overlay.destroy();
          cardContainer.destroy();
          this.showContinueButton();
        }
      });
    });
  }

  showContinueButton() {
    // Remove spin button
    this.spinButton.destroy();
    
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
    
    continueBtn.on('pointerover', () => {
      btnBg.setFillStyle(0x4ecdc4, 0.2);
      btnText.setScale(1.05);
    });
    
    continueBtn.on('pointerout', () => {
      btnBg.setFillStyle(0x333333, 0.8);
      btnText.setScale(1);
    });
    
    continueBtn.on('pointerup', () => {
      this.scene.start('RunScene');
    });
  }

  createConfetti() {
    // Create colorful confetti particles
    for (let i = 0; i < 25; i++) {
      const confetti = this.add.circle(
        gameRNG.nextInt(50, 325),
        gameRNG.nextInt(0, 200),
        gameRNG.nextInt(3, 8),
        Phaser.Display.Color.RandomRGB().color
      );
      
      this.tweens.add({
        targets: confetti,
        y: 700,
        x: confetti.x + gameRNG.nextInt(-50, 50),
        rotation: gameRNG.nextFloat(0, Math.PI * 4),
        alpha: 0,
        duration: gameRNG.nextInt(1000, 2500),
        ease: 'Power2',
        onComplete: () => confetti.destroy()
      });
    }
  }
}