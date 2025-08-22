/**
 * RunModifiers - Aggregates all equipment and temporary effects
 * Calculates final modifiers applied to risk, exit, loot, etc.
 */

export class RunModifiers {
  constructor() {
    this.reset();
  }

  reset() {
    // Base modifiers - all effects aggregate into these
    this.risk_pct_add = 0;          // additive risk %
    this.risk_pct_mult = 1.0;       // multiplicative (1.0 = none)
    this.exit_pct_add = 0;          // additive exit %
    this.exit_pct_mult = 1.0;       // multiplicative
    this.rarity_step_plus = 0;      // +1 step for rolls
    this.loot_chance_add = 0;       // % add to base loot chance
    this.greed_delta_on_continue = 0; // extra greed per continue
    this.heal_on_milestone = 0;     // auto-heal at milestone rooms
    this.revive_charges = 0;        // prevent death & consume charge
    this.skip_room_charges = 0;     // smoke bomb
    this.heal_charges = 0;          // bandages
    
    console.log('🔧 RunModifiers reset');
  }

  // Calculate modifiers from equipped artifacts and consumables
  calculateFromEquipment(equippedArtifacts, consumables = []) {
    console.log('🔧 Calculating RunModifiers from equipment:', {
      equipped: equippedArtifacts.length,
      consumables: consumables.length
    });
    
    this.reset();
    
    // Process equipped artifacts
    equippedArtifacts.forEach(artifact => {
      this.applyArtifactEffects(artifact);
    });
    
    // Process consumables (items with charges)
    consumables.forEach(consumable => {
      this.applyConsumableEffects(consumable);
    });
    
    console.log('✅ Final RunModifiers:', this.getSummary());
  }

  applyArtifactEffects(artifact) {
    if (!artifact || !artifact.effects) return;
    
    console.log('🔧 Applying artifact effects:', artifact.name, artifact.effects);
    
    artifact.effects.forEach(effect => {
      const value = effect.v || effect.value || 0;
      
      switch (effect.id) {
        case 'risk_add':
          this.risk_pct_add += value;
          break;
        case 'risk_mult':
          this.risk_pct_mult *= value;
          break;
        case 'exit_add':
          this.exit_pct_add += value;
          break;
        case 'exit_mult':
          this.exit_pct_mult *= value;
          break;
        case 'rarity_step':
          this.rarity_step_plus += value;
          break;
        case 'loot_chance':
          this.loot_chance_add += value;
          break;
        case 'greed_delta_on_continue':
          this.greed_delta_on_continue += value;
          break;
        case 'heal_on_milestone':
          this.heal_on_milestone += value;
          break;
        case 'revive_charges':
          this.revive_charges += value;
          break;
        case 'skip_room_charges':
          this.skip_room_charges += value;
          break;
        case 'heal_charges':
          this.heal_charges += value;
          break;
        default:
          console.warn('⚠️ Unknown effect:', effect.id);
      }
    });
  }

  applyConsumableEffects(consumable) {
    // Consumables are items with charges that provide temporary effects
    if (!consumable.charges || consumable.charges <= 0) return;
    
    switch (consumable.id) {
      case 'smoke_bomb':
        this.skip_room_charges += consumable.charges;
        break;
      case 'field_bandage':
        this.heal_charges += consumable.charges;
        break;
    }
  }

  // Get human-readable summary for tooltips
  getSummary() {
    const effects = [];
    
    if (this.risk_pct_add !== 0) {
      effects.push(`Risk ${this.risk_pct_add > 0 ? '+' : ''}${this.risk_pct_add}%`);
    }
    if (this.risk_pct_mult !== 1.0) {
      const pct = Math.round((this.risk_pct_mult - 1) * 100);
      effects.push(`Risk ${pct > 0 ? '+' : ''}${pct}%`);
    }
    if (this.exit_pct_add !== 0) {
      effects.push(`Exit ${this.exit_pct_add > 0 ? '+' : ''}${this.exit_pct_add}%`);
    }
    if (this.exit_pct_mult !== 1.0) {
      const pct = Math.round((this.exit_pct_mult - 1) * 100);
      effects.push(`Exit ${pct > 0 ? '+' : ''}${pct}%`);
    }
    if (this.rarity_step_plus !== 0) {
      effects.push(`Rarity +${this.rarity_step_plus}`);
    }
    if (this.loot_chance_add !== 0) {
      effects.push(`Loot +${this.loot_chance_add}%`);
    }
    if (this.greed_delta_on_continue !== 0) {
      effects.push(`Greed ${this.greed_delta_on_continue > 0 ? '+' : ''}${this.greed_delta_on_continue}/continue`);
    }
    if (this.heal_on_milestone !== 0) {
      effects.push(`Heal +${this.heal_on_milestone} at milestones`);
    }
    if (this.revive_charges > 0) {
      effects.push(`${this.revive_charges} revive${this.revive_charges > 1 ? 's' : ''}`);
    }
    if (this.skip_room_charges > 0) {
      effects.push(`${this.skip_room_charges} skip${this.skip_room_charges > 1 ? 's' : ''}`);
    }
    if (this.heal_charges > 0) {
      effects.push(`${this.heal_charges} heal${this.heal_charges > 1 ? 's' : ''}`);
    }
    
    return effects.length > 0 ? effects.join(', ') : 'No effects';
  }

  // Get effect glyphs for HUD display
  getEffectGlyphs() {
    const glyphs = [];
    
    if (this.risk_pct_add < 0 || this.risk_pct_mult < 1.0) glyphs.push('⚔'); // risk reduction
    if (this.risk_pct_add > 0 || this.risk_pct_mult > 1.0) glyphs.push('💀'); // risk increase
    if (this.exit_pct_add > 0 || this.exit_pct_mult > 1.0) glyphs.push('🔥'); // exit boost
    if (this.rarity_step_plus > 0) glyphs.push('✨'); // rarity boost
    if (this.loot_chance_add > 0) glyphs.push('💰'); // loot boost
    if (this.revive_charges > 0) glyphs.push('♻'); // revive
    if (this.heal_on_milestone > 0 || this.heal_charges > 0) glyphs.push('🩹'); // healing
    if (this.skip_room_charges > 0) glyphs.push('🫧'); // skip rooms
    
    return glyphs.join('');
  }

  // Calculate final risk percentage (used by RunScene)
  calculateFinalRisk(baseRisk) {
    try {
      const result = Math.max(0, Math.min(95, (baseRisk + this.risk_pct_add) * this.risk_pct_mult));
      console.log('🔧 Risk calculation:', { baseRisk, add: this.risk_pct_add, mult: this.risk_pct_mult, result });
      return result;
    } catch (error) {
      console.error('❌ Error in calculateFinalRisk:', error);
      return baseRisk; // Return safe fallback
    }
  }

  // Calculate final exit percentage (used by RunScene)  
  calculateFinalExit(baseExit) {
    try {
      const result = Math.max(0, Math.min(95, (baseExit + this.exit_pct_add) * this.exit_pct_mult));
      console.log('🔧 Exit calculation:', { baseExit, add: this.exit_pct_add, mult: this.exit_pct_mult, result });
      return result;
    } catch (error) {
      console.error('❌ Error in calculateFinalExit:', error);
      return baseExit; // Return safe fallback
    }
  }

  // Calculate final loot chance (used by RunScene)
  calculateFinalLootChance(baseLootChance) {
    try {
      const result = Math.max(0, Math.min(1.0, baseLootChance + (this.loot_chance_add / 100)));
      console.log('🔧 Loot chance calculation:', { baseLootChance, add: this.loot_chance_add, result });
      return result;
    } catch (error) {
      console.error('❌ Error in calculateFinalLootChance:', error);
      return baseLootChance; // Return safe fallback
    }
  }

  // Use a revive charge (returns true if consumed)
  useRevive() {
    if (this.revive_charges > 0) {
      this.revive_charges--;
      console.log('♻ Revive charge used, remaining:', this.revive_charges);
      return true;
    }
    return false;
  }

  // Use a skip room charge
  useSkipRoom() {
    if (this.skip_room_charges > 0) {
      this.skip_room_charges--;
      console.log('🫧 Skip room charge used, remaining:', this.skip_room_charges);
      return true;
    }
    return false;
  }

  // Use a heal charge
  useHeal() {
    if (this.heal_charges > 0) {
      this.heal_charges--;
      console.log('🩹 Heal charge used, remaining:', this.heal_charges);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const runModifiers = new RunModifiers();