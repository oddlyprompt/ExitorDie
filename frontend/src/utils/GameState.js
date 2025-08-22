/**
 * Global game state management
 */
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    // Core stats
    this.hp = 3;
    this.maxHP = 3;
    this.greed = 0;
    this.depth = 0;
    this.score = 0;

    // Run data
    this.seed = Date.now();
    this.isDailyRun = false;
    this.artifacts = [];
    this.treasureValue = 0;
    this.roomsVisited = 0;
    this.safeRoomStreak = 0;
    this.roomsSinceLoot = 0;

    // Replay log
    this.replayLog = {
      seed: this.seed,
      contentVersion: '1.0.0',
      rooms: [],
      choices: [],
      rolls: 0,
      items: []
    };

    // Game config (will be loaded from content pack)
    this.contentPack = this.getDefaultContentPack();
  }

  // Default content pack (fallback if server unavailable)
  getDefaultContentPack() {
    return {
      version: '1.0.0',
      curves: {
        deathRisk: {
          base: 0.025,
          perDepth: 0.007,
          perGreed: 0.008,
          cap: 0.6
        },
        exitOdds: {
          base: 0.05,
          perDepth: 0.01,
          perGreed: 0.005,
          cap: 0.4
        },
        hazardBudget: {
          base: 2,
          perDepth: 0.3
        },
        pitySystem: {
          threshold: 3,
          bonusMultiplier: 1.5
        }
      },
      rarities: [
        { name: 'Common', weight: 40, color: '#9ca3af' },
        { name: 'Uncommon', weight: 22, color: '#22c55e' },
        { name: 'Rare', weight: 12, color: '#3b82f6' },
        { name: 'Epic', weight: 8, color: '#8b5cf6' },
        { name: 'Mythic', weight: 6, color: '#f59e0b' },
        { name: 'Ancient', weight: 4, color: '#ef4444' },
        { name: 'Relic', weight: 3, color: '#ec4899' },
        { name: 'Legendary', weight: 2, color: '#06b6d4' },
        { name: 'Transcendent', weight: 1.5, color: '#eab308' },
        { name: 'OneOfOne', weight: 1.5, color: '#dc2626' }
      ],
      artifacts: [
        { id: 'lucky_coin', name: 'Lucky Coin', rarity: 'Uncommon', effect: 'loot_chance', value: 100, lore: 'A tarnished coin that brings unexpected fortune.' },
        { id: 'iron_will', name: 'Iron Will', rarity: 'Rare', effect: 'greed_resist', value: 200, lore: 'Strengthens resolve against temptation.' },
        { id: 'phoenix_feather', name: 'Phoenix Feather', rarity: 'Epic', effect: 'death_save', value: 500, lore: 'Burns bright when death approaches.' }
      ],
      sets: [
        { id: 'treasure_hunter', name: 'Treasure Hunter', pieces: ['lucky_coin', 'treasure_map'], bonus: 'Double loot chance' }
      ]
    };
  }

  // Calculate current death risk percentage
  getDeathRisk() {
    const curves = this.contentPack.curves.deathRisk;
    const risk = Math.min(
      curves.base + (this.depth * curves.perDepth) + (this.greed * curves.perGreed),
      curves.cap
    );
    return Math.round(risk * 100);
  }

  // Calculate current exit odds percentage  
  getExitOdds() {
    const curves = this.contentPack.curves.exitOdds;
    const odds = Math.min(
      curves.base + (this.depth * curves.perDepth) + (this.greed * curves.perGreed),
      curves.cap
    );
    return Math.round(odds * 100);
  }

  // Get hazard budget for current room
  getHazardBudget() {
    const curves = this.contentPack.curves.hazardBudget;
    return Math.floor(curves.base + (this.depth * curves.perDepth));
  }

  // Check if pity system should activate
  shouldActivatePity() {
    return this.roomsSinceLoot >= this.contentPack.curves.pitySystem.threshold;
  }

  // Add artifact to inventory
  addArtifact(artifact) {
    this.artifacts.push(artifact);
    this.replayLog.items.push(artifact);
  }

  // Calculate final score with greed multiplier
  calculateScore() {
    const greedMultiplier = 1 + (this.greed * 0.1);
    return Math.floor((this.treasureValue + this.artifacts.reduce((sum, a) => sum + a.value, 0)) * greedMultiplier);
  }

  // Take damage
  takeDamage(amount = 1) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }

  // Heal HP
  heal(amount = 1) {
    this.hp = Math.min(this.maxHP, this.hp + amount);
  }

  // Increase greed (capped at 10)
  increaseGreed(amount = 1) {
    this.greed = Math.min(10, this.greed + amount);
  }

  // Decrease greed
  decreaseGreed(amount = 1) {
    this.greed = Math.max(0, this.greed - amount);
  }

  // Log room visit
  visitRoom(roomType, choice = null) {
    this.depth++;
    this.roomsVisited++;
    
    this.replayLog.rooms.push({
      depth: this.depth,
      type: roomType,
      choice: choice
    });
  }
}

// Global game state instance
export const gameState = new GameState();