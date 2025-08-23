/**
 * Global game state management - v1.1.0 Major Update
 * Includes: Equipment system, Fair RNG, Milestone rooms, Username, Custom seeds
 */
import { ProceduralNameGenerator } from './ProceduralNames.js';
import { EquipSystem } from './EquipSystem.js';
import { runModifiers } from './RunModifiers.js';

export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    // Core stats
    this.hp = 4;
    this.maxHP = 4;
    this.greed = 0;
    this.depth = 0;
    this.score = 0;

    // Run data
    this.seed = Date.now();
    this.seedString = ''; // Original string seed if custom
    this.isDailyRun = false;
    this.username = this.getStoredUsername();
    this.treasureValue = 0;
    this.roomsVisited = 0;
    this.safeRoomStreak = 0;
    this.roomsSinceLoot = 0;
    this.rollIndex = 0; // For deterministic item generation

    // Fair RNG system
    this.riskAccumulator = 0; // Death risk bucket system
    this.safeRoomsRemaining = 2; // Rooms 1-2 are safe
    
    // Initialize replay log as empty array
    this.replayLog = [];
    
    // Milestone system
    this.nextMilestone = 5;
    this.guaranteedExit = false;
    this.altarBonus = 0; // Exit odds bonus from altar

    // Equipment system
    this.equipSystem = new EquipSystem();
    
    // Active effects from equipment
    this.activeEffects = {};
    this.exitBonus = 0;
    this.riskPenalty = 0;
    this.lootBonus = 0;

    // Options
    this.fastWheel = this.getStoredOption('fastWheel', false);

    // Replay log - Simple array of actions for backend validation
    this.replayLog = [];

    // Discovered items for Codex
    this.discoveredItems = new Set();

    // Game config (will be loaded from content pack)
    this.contentPack = this.getDefaultContentPack();
    this.nameGenerator = new ProceduralNameGenerator(this.contentPack);
  }

  // Default content pack v1.1.0 (fallback if server unavailable)
  getDefaultContentPack() {
    return {
      version: '1.1.0',
      rarity_weights: {
        "Common": 40, "Uncommon": 22, "Rare": 12, "Epic": 8,
        "Mythic": 6, "Ancient": 4, "Relic": 3, "Legendary": 2,
        "Transcendent": 1.5, "1/1": 1.5
      },
      value_multipliers: {
        "Common": 1, "Uncommon": 1.2, "Rare": 1.5, "Epic": 2, "Mythic": 2.5,
        "Ancient": 3, "Relic": 3.5, "Legendary": 4, "Transcendent": 5, "1/1": 6
      },
      hazard_curve: {"base": 1.5, "per_depth": 0.45, "per_greed": 0.7, "cap": 55},
      exit_curve: {"base": 4.0, "per_depth": 0.7, "per_greed": 0.4, "cap": 35},
      pity: {"no_drop_streak": 2, "bonus_next": 6},
      streak_chest: {"interval": 3, "rarity_boost_multiplier": 1.5},
      
      // Name generation components
      prefixes: [], // Will be populated by ProceduralNameGenerator
      bases: [],
      suffixes: [],
      glyphs: ["⟡", "†", "Ω", "∆"],
      
      // Affix system
      affix_bands: {
        "Common": {"minAffixes": 2, "maxAffixes": 2, "rolls": [{"id": "value_pct", "+": [1, 4]}]},
        "Uncommon": {"minAffixes": 2, "maxAffixes": 3, "rolls": [{"id": "value_pct", "+": [2, 6]}]},
        "Rare": {"minAffixes": 2, "maxAffixes": 4, "rolls": [{"id": "value_pct", "+": [4, 10]}]},
        "Epic": {"minAffixes": 3, "maxAffixes": 4, "rolls": [{"id": "value_pct", "+": [8, 16]}]},
        "Mythic": {"minAffixes": 3, "maxAffixes": 5, "rolls": [{"id": "value_pct", "+": [12, 22]}]},
        "Ancient": {"minAffixes": 3, "maxAffixes": 5, "rolls": [{"id": "value_pct", "+": [16, 28]}]},
        "Relic": {"minAffixes": 3, "maxAffixes": 5, "rolls": [{"id": "value_pct", "+": [20, 32]}]},
        "Legendary": {"minAffixes": 3, "maxAffixes": 5, "rolls": [{"id": "value_pct", "+": [24, 36]}]},
        "Transcendent": {"minAffixes": 4, "maxAffixes": 5, "rolls": [{"id": "value_pct", "+": [28, 40]}]},
        "1/1": {"minAffixes": 4, "maxAffixes": 5, "rolls": [{"id": "value_pct", "+": [32, 45]}]}
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
        { id: 'phoenix', name: 'Phoenix Feather', rarity: 'Legendary', effects: [{id: 'on_death_revive', v: 1}], lore: 'One life, rekindled.' },
        { id: 'lucky_coin', name: 'Lucky Coin', rarity: 'Epic', effects: [{id: 'exit_plus', v: 5}], lore: 'Fortune favors the bold.' },
        { id: 'smoke_bomb', name: 'Smoke Bomb', rarity: 'Rare', effects: [{id: 'skip_room', v: 1}], lore: 'A brief vanishing act.' },
        { id: 'bandage', name: 'Field Bandage', rarity: 'Uncommon', effects: [{id: 'heal_charges', v: 1}], lore: 'A strip of hope.' },
        { id: 'cursed_chalice', name: 'Cursed Chalice', rarity: 'Mythic', effects: [{id: 'risk_plus_pct', v: 5}, {id: 'loot_chance_plus_pct', v: 20}], lore: 'Sweet poison of ambition.' }
      ],
      
      flavor_sets: {
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

  // Username management
  getStoredUsername() {
    return localStorage.getItem('exit_or_die_username') || '';
  }

  setUsername(username) {
    // Validate username
    const cleanUsername = username.replace(/[^A-Za-z0-9_]/g, '').substr(0, 16);
    if (cleanUsername.length >= 3) {
      this.username = cleanUsername;
      localStorage.setItem('exit_or_die_username', this.username);
      return true;
    }
    return false;
  }

  getDisplayUsername() {
    if (this.username) return this.username;
    return `Wanderer${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
  }

  // Options management
  getStoredOption(key, defaultValue) {
    const stored = localStorage.getItem(`exit_or_die_${key}`);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  }

  setOption(key, value) {
    localStorage.setItem(`exit_or_die_${key}`, JSON.stringify(value));
    this[key] = value;
  }

  // Seed management
  setSeedFromString(seedString) {
    this.seedString = seedString;
    if (seedString) {
      // Hash string to 64-bit number
      this.seed = this.hashSeedString(seedString);
    } else {
      this.seed = Date.now();
    }
  }

  hashSeedString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Check if current depth is milestone
  isMilestoneRoom() {
    return this.depth > 0 && this.depth % 5 === 0;
  }

  // Calculate current death risk percentage with fair RNG
  getDeathRisk() {
    const curves = this.contentPack.hazard_curve;
    let baseRisk = curves.base + (this.depth * curves.per_depth) + (this.greed * curves.per_greed);
    baseRisk = Math.min(baseRisk, curves.cap);
    
    // Apply equipment penalties
    if (this.riskPenalty) {
      baseRisk += this.riskPenalty;
    }
    
    // Apply RunModifiers for equipment effects
    const finalRisk = runModifiers.calculateFinalRisk(baseRisk);
    
    return Math.round(finalRisk);
  }

  // Calculate current exit odds percentage  
  getExitOdds() {
    const curves = this.contentPack.exit_curve;
    let baseOdds = curves.base + (this.depth * curves.per_depth) + (this.greed * curves.per_greed);
    baseOdds = Math.min(baseOdds, curves.cap);
    
    // Apply equipment bonuses
    if (this.exitBonus) {
      baseOdds += this.exitBonus;
    }
    
    // Apply altar bonus
    if (this.altarBonus) {
      baseOdds += this.altarBonus;
      this.altarBonus = 0; // One-time use
    }
    
    // Apply RunModifiers for equipment effects
    const finalExit = runModifiers.calculateFinalExit(baseOdds);
    
    return Math.round(finalExit);
  }

  // Fair death check with accumulator system
  checkDeath(rng) {
    // Safe rooms check
    if (this.safeRoomsRemaining > 0) {
      this.safeRoomsRemaining--;
      return false; // No death in safe rooms
    }
    
    const riskPercent = this.getDeathRisk();
    
    // For low risk (< 15%), use accumulator system
    if (riskPercent < 15) {
      this.riskAccumulator += riskPercent;
      if (this.riskAccumulator >= 100) {
        this.riskAccumulator -= 100;
        return true; // Death occurs
      }
      return false;
    } else {
      // High risk uses direct probability
      return rng.next() * 100 < riskPercent;
    }
  }

  // Check if pity system should activate
  shouldActivatePity() {
    const threshold = this.contentPack.pity?.no_drop_streak || 2;
    return this.roomsSinceLoot >= threshold;
  }

  // Get flavor text for current depth
  getFlavorText(rng) {
    const flavorSets = this.contentPack.flavor_sets;
    if (!flavorSets) return "You find yourself in a mysterious chamber.";

    let category = 'early';
    if (this.depth > 15) category = 'late';
    else if (this.depth > 8) category = 'mid';

    const flavors = flavorSets[category] || flavorSets.early;
    return rng.choice(flavors);
  }

  // Equipment management
  equipItem(item, slotIndex) {
    const replaced = this.equipSystem.equipItem(item, slotIndex);
    this.equipSystem.applyEffects(this);
    
    // Log equip decision
    this.replayLog.push({
      depth: this.depth,
      action: 'equip_item',
      item: item.hash,
      slot: slotIndex,
      replaced: replaced ? replaced.hash : null
    });
    
    return replaced;
  }

  bankItem(item) {
    this.equipSystem.bankItem(item);
    this.treasureValue += item.value;
    
    // Log bank decision
    this.replayLog.equipDecisions.push({
      action: 'bank',
      item: item.hash,
      value: item.value
    });
  }

  // Generate procedural item
  generateProceduralItem(rng, rarity) {
    this.rollIndex++;
    
    const nameData = this.nameGenerator.generateName(rng, rarity, this.depth, this.rollIndex);
    const affixes = this.nameGenerator.generateAffixes(rng, rarity, this.contentPack.affix_bands);
    const value = this.nameGenerator.calculateValue(nameData.baseValue, rarity, affixes, this.contentPack.value_multipliers);
    
    return {
      type: 'procedural',
      hash: nameData.hash,
      name: nameData.name,
      rarity: rarity,
      value: value,
      affixes: affixes,
      effects: [], // Procedural items are treasures, no effects
      lore: this.generateLore(rarity, nameData.components),
      components: nameData.components
    };
  }

  generateLore(rarity, components) {
    const loreTemplates = {
      'Common': ['A simple item from forgotten times.', 'Basic but functional.'],
      'Uncommon': ['Shows signs of careful craftsmanship.', 'Uncommon but reliable.'],
      'Rare': ['Forged with skill and purpose.', 'Rare and sought after.'],
      'Epic': ['Imbued with mystical properties.', 'An epic artifact of power.'],
      'Mythic': ['Legends speak of its creation.', 'A mythic treasure beyond compare.'],
      'Ancient': ['Ancient beyond mortal memory.', 'From the dawn of civilizations.'],
      'Relic': ['A sacred relic of immense power.', 'Blessed by forgotten gods.'],
      'Legendary': ['Its legend echoes through eternity.', 'Forged in the fires of legend.'],
      'Transcendent': ['Transcends mortal understanding.', 'Beyond the realm of mortals.'],
      '1/1': ['The one and only of its kind.', 'Unique in all existence.']
    };
    
    const templates = loreTemplates[rarity] || loreTemplates['Common'];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Calculate final score with greed multiplier and equipment
  calculateScore() {
    const greedMultiplier = 1 + (this.greed * 0.1);
    const equippedValue = this.equipSystem.getEquippedItems().reduce((sum, item) => sum + (item.value || 0), 0);
    const bankedValue = this.equipSystem.getBankedValue();
    
    return Math.floor((this.treasureValue + equippedValue + bankedValue) * greedMultiplier);
  }

  // Calculate hazard budget for room modifiers
  getHazardBudget() {
    // Budget increases with depth and greed, allowing more expensive modifiers
    const depthBudget = Math.floor(this.depth / 3) + 1; // 1-4 budget based on depth
    const greedBudget = Math.floor(this.greed / 4); // 0-2 budget based on greed
    return Math.min(depthBudget + greedBudget, 5); // Cap at 5
  }

  // Recalculate run modifiers from equipped items and consumables
  recalculateModifiers() {
    try {
      console.log('🔧 Starting recalculateModifiers...');
      console.log('🔧 equipSystem:', this.equipSystem);
      
      if (!this.equipSystem) {
        console.warn('⚠️ equipSystem is null/undefined, initializing...');
        this.equipSystem = new EquipSystem();
      }
      
      console.log('🔧 Getting equipped items...');
      const equippedArtifacts = this.equipSystem.getEquippedItems();
      console.log('🔧 Equipped artifacts:', equippedArtifacts);
      
      console.log('🔧 Filtering consumables from inventory...');
      console.log('🔧 Current inventory:', this.inventory);
      const consumables = this.inventory ? this.inventory.filter(item => item && item.charges && item.charges > 0) : [];
      console.log('🔧 Consumables found:', consumables);
      
      console.log('🔧 Calling runModifiers.calculateFromEquipment...');
      runModifiers.calculateFromEquipment(equippedArtifacts, consumables);
      console.log('🔧 Modifiers recalculated:', runModifiers.getSummary());
    } catch (error) {
      console.error('❌ Error in recalculateModifiers:', error);
      console.error('❌ Error details:', error.message, error.stack);
      // Reset to safe state
      runModifiers.reset();
    }
  }

  // Enhanced damage system with revive support
  takeDamage(amount) {
    this.hp -= amount;
    
    if (this.hp <= 0) {
      // Check for revive charges
      if (runModifiers.useRevive()) {
        this.hp = 1;
        this.deathCause = null;
        
        // Log the revive event
        this.replayLog.push({
          depth: this.depth,
          action: 'revive',
          details: 'Phoenix saves you'
        });
        
        console.log('♻ Player revived! HP restored to 1');
        return false; // Player survived
      }
      
      this.hp = 0;
      console.log('💀 Player died');
      return true; // Player died
    }
    
    return false; // Player survived
  }

  // Milestone room entry effects
  onMilestoneEntry() {
    // Apply heal from equipment
    if (runModifiers.heal_on_milestone > 0) {
      const healAmount = runModifiers.heal_on_milestone;
      this.heal(healAmount);
      
      console.log(`🩹 Milestone healing: +${healAmount} HP from equipment`);
      
      // Log the milestone heal
      this.replayLog.push({
        depth: this.depth,
        action: 'milestone_heal',
        details: `Equipment healed ${healAmount} HP`
      });
    }
  }

  // Enhanced continue action with greed modifiers
  onContinueAction() {
    // Apply base greed increase
    const baseGreedIncrease = 1;
    const modifierGreedIncrease = runModifiers.greed_delta_on_continue;
    const totalGreedIncrease = Math.max(0, baseGreedIncrease + modifierGreedIncrease);
    
    this.increaseGreed(totalGreedIncrease);
    
    console.log(`💰 Continue action: +${totalGreedIncrease} greed (base: ${baseGreedIncrease}, modifier: ${modifierGreedIncrease})`);
  }

  // Take damage with revive check
  takeDamage(amount = 1) {
    this.hp = Math.max(0, this.hp - amount);
    
    if (this.hp <= 0 && this.equipSystem.canRevive()) {
      // Use revive effect
      if (this.equipSystem.useRevive()) {
        this.hp = this.maxHP; // Full heal on revive
        return false; // Player survives
      }
    }
    
    return this.hp <= 0;
  }

  // Heal HP
  heal(amount = 1) {
    this.hp = Math.min(this.maxHP, this.hp + amount);
  }

  // Use consumables
  useSmokeBomb() {
    return this.equipSystem.useConsumable('smokeBombs');
  }

  useFieldBandage() {
    if (this.equipSystem.useConsumable('fieldBandages') && this.hp < this.maxHP) {
      this.heal(1);
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
    
    // Log room visit action
    this.replayLog.push({
      depth: this.depth,
      action: 'visit_room',
      roomType: roomType,
      choice: choice,
      milestone: this.isMilestoneRoom()
    });
  }
  
  // Log RNG usage
  consumeRoll() {
    // Log RNG consumption action
    this.replayLog.push({
      action: 'consume_roll',
      depth: this.depth
    });
  }
  
  // Add item to replay log
  recordItem(itemHash) {
    this.replayLog.items.push(itemHash);
  }

  // Get seed display (last 4 chars)
  getSeedDisplay() {
    return this.seed.toString().slice(-4);
  }

  // Get consumable counts
  getSmokeBombCount() {
    return this.equipSystem.getConsumableCount('smokeBombs');
  }

  getFieldBandageCount() {
    return this.equipSystem.getConsumableCount('fieldBandages');
  }

  // Update content pack and regenerate name generator
  updateContentPack(contentPack) {
    this.contentPack = contentPack;
    this.nameGenerator = new ProceduralNameGenerator(contentPack);
  }
}

// Global game state instance
export const gameState = new GameState();