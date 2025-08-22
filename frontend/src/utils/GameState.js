/**
 * Global game state management - v1.0.2 Polish Update
 */
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    // Core stats - Updated for v1.0.2
    this.hp = 4; // Increased from 3
    this.maxHP = 4;
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

    // Consumables - New in v1.0.2
    this.smokeBombs = 0;
    this.fieldBandages = 1; // Start with 1 bandage

    // Options
    this.fastWheel = false;

    // Replay log
    this.replayLog = {
      seed: this.seed,
      contentVersion: '1.0.2',
      rooms: [],
      choices: [],
      rolls: 0,
      items: []
    };

    // Discovered items for Codex
    this.discoveredItems = new Set();

    // Game config (will be loaded from content pack)
    this.contentPack = this.getDefaultContentPack();
  }

  // Default content pack v1.0.2 (fallback if server unavailable)
  getDefaultContentPack() {
    return {
      version: '1.0.2',
      curves: {
        deathRisk: {
          base: 0.015, // 1.5%
          perDepth: 0.0045, // 0.45%
          perGreed: 0.007, // 0.7%
          cap: 0.55 // 55%
        },
        exitOdds: {
          base: 0.04, // 4%
          perDepth: 0.007, // 0.7%
          perGreed: 0.004, // 0.4%
          cap: 0.35 // 35%
        },
        hazardBudget: {
          base: 1.5,
          perDepth: 0.45
        },
        pitySystem: {
          threshold: 2, // 2 rooms instead of 3
          bonusMultiplier: 6 // 6% instead of 5%
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
        { name: '1/1', weight: 1.5, color: '#dc2626' }
      ],
      artifacts: [
        { id: 'phoenix', name: 'Phoenix Feather', rarity: 'Legendary', effect: 'on_death_revive', value: 8000, lore: 'One life, rekindled.' },
        { id: 'lucky_coin', name: 'Lucky Coin', rarity: 'Epic', effect: 'exit_plus', value: 1000, lore: 'Fortune favors the bold.' },
        { id: 'smoke_bomb', name: 'Smoke Bomb', rarity: 'Rare', effect: 'skip_room', value: 300, lore: 'A brief vanishing act.' },
        { id: 'bandage', name: 'Field Bandage', rarity: 'Uncommon', effect: 'heal_charges', value: 120, lore: 'A strip of hope.' },
        { id: 'cursed_chalice', name: 'Cursed Chalice', rarity: 'Mythic', effect: 'risk_plus_loot_plus', value: 2500, lore: 'Sweet poison of ambition.' }
      ],
      sets: [
        { id: 'shadow_idols', name: 'Idols of Shadow', pieces: ['idol_a', 'idol_b', 'idol_c'], bonus: 'Rarity step +1' }
      ],
      flavorSets: {
        early: [
          "Ancient pillars support the ceiling.",
          "Wet stone and distant whispers.",
          "Faint torchlight dances on moss.",
          "A draft smells of rust and history."
        ],
        mid: [
          "Corridors twist like veins of the earth.",
          "Dusty banners sag from old wars.",
          "A chime echoes from nowhere.",
          "Fissures breathe a colder night."
        ],
        late: [
          "Stone sweats cold fear.",
          "The dark watches back.",
          "Your footsteps argue with silence.",
          "Old prayers flake off the walls."
        ]
      }
    };
  }

  // Calculate current death risk percentage
  getDeathRisk() {
    const curves = this.contentPack.curves?.deathRisk || this.contentPack.hazard_curve;
    if (curves.base !== undefined) {
      // New format
      const risk = Math.min(
        curves.base + (this.depth * curves.perDepth) + (this.greed * curves.perGreed),
        curves.cap
      );
      return Math.round(risk * 100);
    } else {
      // Legacy format
      const risk = Math.min(
        curves.base + (this.depth * curves.per_depth) + (this.greed * curves.per_greed),
        curves.cap
      );
      return Math.round(risk);
    }
  }

  // Calculate current exit odds percentage  
  getExitOdds() {
    const curves = this.contentPack.curves?.exitOdds || this.contentPack.exit_curve;
    if (curves.base !== undefined) {
      // New format
      const odds = Math.min(
        curves.base + (this.depth * curves.perDepth) + (this.greed * curves.perGreed),
        curves.cap
      );
      return Math.round(odds * 100);
    } else {
      // Legacy format
      const odds = Math.min(
        curves.base + (this.depth * curves.per_depth) + (this.greed * curves.per_greed),
        curves.cap
      );
      return Math.round(odds);
    }
  }

  // Get hazard budget for current room
  getHazardBudget() {
    const curves = this.contentPack.curves?.hazardBudget || { base: 1.5, perDepth: 0.45 };
    return Math.floor(curves.base + (this.depth * curves.perDepth));
  }

  // Check if pity system should activate
  shouldActivatePity() {
    const threshold = this.contentPack.curves?.pitySystem?.threshold || 
                     this.contentPack.pity?.no_drop_streak || 2;
    return this.roomsSinceLoot >= threshold;
  }

  // Get flavor text for current depth
  getFlavorText(rng) {
    const flavorSets = this.contentPack.flavorSets || this.contentPack.flavor_sets;
    if (!flavorSets) return "You find yourself in a mysterious chamber.";

    let category = 'early';
    if (this.depth > 15) category = 'late';
    else if (this.depth > 8) category = 'mid';

    const flavors = flavorSets[category] || flavorSets.early;
    return rng.choice(flavors);
  }

  // Add artifact to inventory
  addArtifact(artifact) {
    this.artifacts.push(artifact);
    this.replayLog.items.push(artifact.hash || artifact.id);
    
    // Mark as discovered for Codex
    this.discoveredItems.add(artifact.id || artifact.hash);

    // Handle consumable effects
    if (artifact.id === 'smoke_bomb') {
      this.smokeBombs++;
    } else if (artifact.id === 'bandage') {
      this.fieldBandages++;
    }
  }

  // Calculate final score with greed multiplier
  calculateScore() {
    const greedMultiplier = 1 + (this.greed * 0.1);
    return Math.floor((this.treasureValue + this.artifacts.reduce((sum, a) => sum + (a.value || 0), 0)) * greedMultiplier);
  }

  // Take damage with screen shake trigger
  takeDamage(amount = 1) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }

  // Heal HP
  heal(amount = 1) {
    this.hp = Math.min(this.maxHP, this.hp + amount);
  }

  // Use field bandage
  useFieldBandage() {
    if (this.fieldBandages > 0 && this.hp < this.maxHP) {
      this.fieldBandages--;
      this.heal(1);
      return true;
    }
    return false;
  }

  // Use smoke bomb
  useSmokeBomb() {
    if (this.smokeBombs > 0) {
      this.smokeBombs--;
      return true;
    }
    return false;
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
    
    if (choice) {
      this.replayLog.choices.push(choice);
    }
  }
  
  // Log RNG usage
  consumeRoll() {
    this.replayLog.rolls++;
  }
  
  // Add item to replay log
  recordItem(itemHash) {
    this.replayLog.items.push(itemHash);
  }

  // Get seed display (last 4 chars)
  getSeedDisplay() {
    return this.seed.toString().slice(-4);
  }
}

// Global game state instance
export const gameState = new GameState();