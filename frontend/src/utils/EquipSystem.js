/**
 * Equipment System - Equip/Bank artifacts with active effects
 */

export class EquipSystem {
  constructor() {
    this.slots = [null, null]; // E1, E2
    this.bankedItems = [];
    this.consumables = {
      smokeBombs: 0,
      fieldBandages: 1 // Start with 1
    };
  }

  reset() {
    this.slots = [null, null];
    this.bankedItems = [];
    this.consumables = {
      smokeBombs: 0,
      fieldBandages: 1
    };
  }

  // Check if slot is available
  isSlotFree(slotIndex) {
    return slotIndex >= 0 && slotIndex < 2 && this.slots[slotIndex] === null;
  }

  // Equip item to specific slot
  equipItem(item, slotIndex) {
    if (slotIndex < 0 || slotIndex >= 2) return false;
    
    const replacedItem = this.slots[slotIndex];
    this.slots[slotIndex] = item;
    
    return replacedItem;
  }

  // Bank item (value only, no effects)
  bankItem(item) {
    this.bankedItems.push(item);
  }

  // Get equipped items
  getEquippedItems() {
    return this.slots.filter(item => item !== null);
  }

  // Get total banked value
  getBankedValue() {
    return this.bankedItems.reduce((sum, item) => sum + (item.value || 0), 0);
  }

  // Check if specific artifact is equipped
  hasEquipped(artifactId) {
    return this.slots.some(item => item && (item.id === artifactId || item.hash === artifactId));
  }

  // Get active effects from equipped items
  getActiveEffects() {
    const effects = {};
    
    this.slots.forEach(item => {
      if (item && item.effects) {
        item.effects.forEach(effect => {
          if (!effects[effect.id]) {
            effects[effect.id] = 0;
          }
          effects[effect.id] += effect.v || 1;
        });
      }
    });
    
    return effects;
  }

  // Add consumable
  addConsumable(type, amount = 1) {
    if (this.consumables.hasOwnProperty(type)) {
      this.consumables[type] += amount;
    }
  }

  // Use consumable
  useConsumable(type, amount = 1) {
    if (this.consumables.hasOwnProperty(type) && this.consumables[type] >= amount) {
      this.consumables[type] -= amount;
      return true;
    }
    return false;
  }

  // Get consumable count
  getConsumableCount(type) {
    return this.consumables[type] || 0;
  }

  // Apply equipped effects to game state
  applyEffects(gameState) {
    const effects = this.getActiveEffects();
    
    // Apply effects to game state
    gameState.activeEffects = effects;
    
    // Modify game state based on effects
    if (effects.exit_plus) {
      gameState.exitBonus = effects.exit_plus;
    }
    
    if (effects.risk_plus_pct) {
      gameState.riskPenalty = effects.risk_plus_pct;
    }
    
    if (effects.loot_chance_plus_pct) {
      gameState.lootBonus = effects.loot_chance_plus_pct;
    }
    
    // Set consumable counts from artifacts
    if (effects.skip_room) {
      this.consumables.smokeBombs = effects.skip_room;
    }
    
    if (effects.heal_charges) {
      this.consumables.fieldBandages += effects.heal_charges;
    }
  }

  // Check for revive effect
  canRevive() {
    const effects = this.getActiveEffects();
    return effects.on_death_revive > 0;
  }

  // Use revive effect
  useRevive() {
    // Find item with revive effect and remove one charge
    for (let i = 0; i < this.slots.length; i++) {
      const item = this.slots[i];
      if (item && item.effects) {
        const reviveEffect = item.effects.find(e => e.id === 'on_death_revive');
        if (reviveEffect && reviveEffect.v > 0) {
          reviveEffect.v--;
          if (reviveEffect.v <= 0) {
            // Remove effect or item if no charges left
            item.effects = item.effects.filter(e => e.id !== 'on_death_revive');
            if (item.effects.length === 0) {
              this.slots[i] = null; // Remove item if no effects left
            }
          }
          return true;
        }
      }
    }
    return false;
  }

  // Serialize for save/replay
  serialize() {
    return {
      slots: this.slots,
      bankedItems: this.bankedItems,
      consumables: this.consumables
    };
  }

  // Deserialize from save/replay
  deserialize(data) {
    this.slots = data.slots || [null, null];
    this.bankedItems = data.bankedItems || [];
    this.consumables = data.consumables || { smokeBombs: 0, fieldBandages: 1 };
  }
}