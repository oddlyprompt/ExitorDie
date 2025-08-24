import Phaser from 'phaser';
import { gameState } from '../utils/GameState.js';

export class CodexScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CodexScene' });
  }

  create() {
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x2d1b69, 0x2d1b69, 1);
    bg.fillRect(0, 0, 375, 667);

    // Title
    this.add.text(187.5, 60, 'CODEX', {
      fontSize: '28px',
      fill: '#8b5cf6',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Completion percentage
    this.updateCompletionRate();
    
    // Artifact list container
    this.codexContainer = this.add.container(187.5, 200);
    
    // Load discovered artifacts
    this.loadCodexEntries();
    
    // Back button
    this.createBackButton();
  }

  updateCompletionRate() {
    // Calculate discovery percentage
    const totalArtifacts = gameState.contentPack.artifacts.length;
    const discoveredArtifacts = this.getDiscoveredArtifacts().length;
    const completionRate = Math.floor((discoveredArtifacts / totalArtifacts) * 100);
    
    this.add.text(187.5, 100, `DISCOVERED: ${discoveredArtifacts}/${totalArtifacts} (${completionRate}%)`, {
      fontSize: '14px',
      fill: '#feca57',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
  }

  getDiscoveredArtifacts() {
    // Use the new discovery tracking system
    const discovered = [];
    for (const itemId of gameState.discoveredItems) {
      // Find the artifact in the content pack
      const artifact = gameState.contentPack.artifacts.find(a => a.id === itemId);
      if (artifact) {
        discovered.push(artifact);
      }
    }
    return discovered;
  }

  loadCodexEntries() {
    this.codexContainer.removeAll(true);
    
    const discoveredArtifacts = this.getDiscoveredArtifacts();
    const allArtifacts = gameState.contentPack.artifacts;
    
    if (discoveredArtifacts.length === 0) {
      const emptyText = this.add.text(0, 0, 'No artifacts discovered yet.\nComplete runs to unlock entries.', {
        fontSize: '16px',
        fill: '#666666',
        fontFamily: 'Courier New',
        align: 'center'
      }).setOrigin(0.5);
      
      this.codexContainer.add(emptyText);
      return;
    }
    
    // Create scrollable list
    this.createScrollableList(discoveredArtifacts, allArtifacts);
  }

  createScrollableList(discovered, all) {
    const entries = [];
    
    // Add discovered artifacts
    discovered.forEach((artifact, index) => {
      const entry = this.createCodexEntry(artifact, true, index);
      entries.push(entry);
    });
    
    // Add placeholder for undiscovered artifacts
    const undiscovered = all.filter(a => !discovered.some(d => d.name === a.name));
    undiscovered.slice(0, 3).forEach((artifact, index) => {
      const placeholderArtifact = {
        name: '???',
        rarity: artifact.rarity,
        lore: 'Unknown artifact. Discover it to unlock this entry.',
        effect: '???'
      };
      const entry = this.createCodexEntry(placeholderArtifact, false, discovered.length + index);
      entries.push(entry);
    });
    
    // Add all entries to container
    entries.forEach(entry => this.codexContainer.add(entry));
  }

  createCodexEntry(artifact, discovered, index) {
    const entryContainer = this.add.container(0, (index * 80) - 100);
    
    // Entry background
    const entryBg = this.add.rectangle(0, 0, 320, 70, 0x333333, discovered ? 0.8 : 0.4);
    entryBg.setStrokeStyle(2, discovered ? this.getRarityColor(artifact.rarity) : 0x666666);
    
    // Artifact name
    const nameText = this.add.text(-140, -20, artifact.name, {
      fontSize: '16px',
      fill: discovered ? this.getRarityColor(artifact.rarity) : '#666666',
      fontFamily: 'Courier New'
    });
    
    // Rarity
    const rarityText = this.add.text(-140, -5, artifact.rarity, {
      fontSize: '12px',
      fill: discovered ? '#cccccc' : '#666666',
      fontFamily: 'Courier New'
    });
    
    // Lore text
    const loreText = this.add.text(-140, 10, artifact.lore, {
      fontSize: '10px',
      fill: discovered ? '#aaaaaa' : '#666666',
      fontFamily: 'Courier New',
      wordWrap: { width: 280 }
    });
    
    entryContainer.add([entryBg, nameText, rarityText, loreText]);
    
    // Set effect indicator
    if (discovered && artifact.effect && artifact.effect !== '???') {
      const effectIcon = this.add.text(140, 0, this.getEffectIcon(artifact.effect), {
        fontSize: '20px',
        fill: this.getRarityColor(artifact.rarity),
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      
      entryContainer.add(effectIcon);
    }
    
    return entryContainer;
  }

  getRarityColor(rarity) {
    const rarityColors = {
      'Common': '#9ca3af',
      'Uncommon': '#22c55e',
      'Rare': '#3b82f6',
      'Epic': '#8b5cf6',
      'Mythic': '#f59e0b',
      'Ancient': '#ef4444',
      'Relic': '#ec4899',
      'Legendary': '#06b6d4',
      'Transcendent': '#eab308',
      '1/1': '#dc2626'
    };
    
    return rarityColors[rarity] || '#cccccc';
  }

  getEffectIcon(effect) {
    const effectIcons = {
      'loot_chance': '🍀',
      'greed_resist': '🛡️',
      'death_save': '💖',
      'treasure_bonus': '💰',
      'risk_reduction': '⚡',
      'unknown': '❓'
    };
    
    return effectIcons[effect] || '⚡';
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