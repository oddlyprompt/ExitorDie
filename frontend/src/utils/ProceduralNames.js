/**
 * Procedural Item Name Generator - 1000+ unique combinations
 * Deterministic based on seed + item data
 */

export class ProceduralNameGenerator {
  constructor(contentPack) {
    console.log('🎯 ProceduralNameGenerator constructor, contentPack:', contentPack);
    
    // Ensure we have a valid contentPack object
    const validContentPack = contentPack || {};
    
    this.prefixes = validContentPack.prefixes || this.getDefaultPrefixes();
    this.bases = validContentPack.bases || this.getDefaultBases();
    this.suffixes = validContentPack.suffixes || this.getDefaultSuffixes();
    this.glyphs = validContentPack.glyphs || ["⟡", "†", "Ω", "∆"];
    
    console.log('🎯 ProceduralNameGenerator initialized with:', {
      prefixes: this.prefixes.length,
      bases: this.bases.length,
      suffixes: this.suffixes.length,
      glyphs: this.glyphs.length
    });
  }

  getDefaultPrefixes() {
    return [
      // Tier 1 (Common/Uncommon bias)
      {id: "worn", name: "Worn", tierBias: 1},
      {id: "simple", name: "Simple", tierBias: 1},
      {id: "crude", name: "Crude", tierBias: 1},
      {id: "basic", name: "Basic", tierBias: 1},
      {id: "plain", name: "Plain", tierBias: 1},
      {id: "rough", name: "Rough", tierBias: 1},
      {id: "old", name: "Old", tierBias: 1},
      {id: "weathered", name: "Weathered", tierBias: 1},
      {id: "tarnished", name: "Tarnished", tierBias: 1},
      {id: "faded", name: "Faded", tierBias: 1},
      {id: "chipped", name: "Chipped", tierBias: 1},
      {id: "dull", name: "Dull", tierBias: 1},
      {id: "common", name: "Common", tierBias: 1},
      {id: "standard", name: "Standard", tierBias: 1},
      {id: "typical", name: "Typical", tierBias: 1},
      
      // Tier 2 (Higher rarity bias)
      {id: "radiant", name: "Radiant", tierBias: 2},
      {id: "gloomforged", name: "Gloomforged", tierBias: 2},
      {id: "venomous", name: "Venomous", tierBias: 2},
      {id: "obsidian", name: "Obsidian", tierBias: 2},
      {id: "crimson", name: "Crimson", tierBias: 2},
      {id: "shadow", name: "Shadow", tierBias: 2},
      {id: "ethereal", name: "Ethereal", tierBias: 2},
      {id: "arcane", name: "Arcane", tierBias: 2},
      {id: "mystic", name: "Mystic", tierBias: 2},
      {id: "ancient", name: "Ancient", tierBias: 2},
      {id: "cursed", name: "Cursed", tierBias: 2},
      {id: "blessed", name: "Blessed", tierBias: 2},
      {id: "divine", name: "Divine", tierBias: 2},
      {id: "infernal", name: "Infernal", tierBias: 2},
      {id: "celestial", name: "Celestial", tierBias: 2},
      {id: "void", name: "Void", tierBias: 2},
      {id: "crystal", name: "Crystal", tierBias: 2},
      {id: "spectral", name: "Spectral", tierBias: 2},
      {id: "runic", name: "Runic", tierBias: 2},
      {id: "gilded", name: "Gilded", tierBias: 2},
      {id: "pristine", name: "Pristine", tierBias: 2},
      {id: "masterwork", name: "Masterwork", tierBias: 2},
      {id: "legendary", name: "Legendary", tierBias: 3},
      {id: "transcendent", name: "Transcendent", tierBias: 3},
      {id: "primordial", name: "Primordial", tierBias: 3}
    ];
  }

  getDefaultBases() {
    return [
      {id: "blade", name: "Blade", base_value: 120},
      {id: "spear", name: "Spear", base_value: 110},
      {id: "sword", name: "Sword", base_value: 130},
      {id: "dagger", name: "Dagger", base_value: 90},
      {id: "axe", name: "Axe", base_value: 125},
      {id: "mace", name: "Mace", base_value: 115},
      {id: "staff", name: "Staff", base_value: 140},
      {id: "wand", name: "Wand", base_value: 95},
      {id: "orb", name: "Orb", base_value: 150},
      {id: "idol", name: "Idol", base_value: 160},
      {id: "talisman", name: "Talisman", base_value: 130},
      {id: "amulet", name: "Amulet", base_value: 135},
      {id: "ring", name: "Ring", base_value: 100},
      {id: "crown", name: "Crown", base_value: 200},
      {id: "pendant", name: "Pendant", base_value: 110},
      {id: "charm", name: "Charm", base_value: 85},
      {id: "relic", name: "Relic", base_value: 180},
      {id: "artifact", name: "Artifact", base_value: 170},
      {id: "tome", name: "Tome", base_value: 145},
      {id: "scroll", name: "Scroll", base_value: 80},
      {id: "crystal", name: "Crystal", base_value: 155},
      {id: "gem", name: "Gem", base_value: 120},
      {id: "stone", name: "Stone", base_value: 105},
      {id: "shard", name: "Shard", base_value: 95},
      {id: "coin", name: "Coin", base_value: 90},
      {id: "key", name: "Key", base_value: 110},
      {id: "mirror", name: "Mirror", base_value: 125},
      {id: "lens", name: "Lens", base_value: 115},
      {id: "sigil", name: "Sigil", base_value: 140},
      {id: "ward", name: "Ward", base_value: 135}
    ];
  }

  getDefaultSuffixes() {
    return [
      // Tier 1 (Common/Uncommon bias)
      {id: "of_rust", name: "of Rust", tierBias: 1},
      {id: "of_stone", name: "of Stone", tierBias: 1},
      {id: "of_wood", name: "of Wood", tierBias: 1},
      {id: "of_iron", name: "of Iron", tierBias: 1},
      {id: "of_copper", name: "of Copper", tierBias: 1},
      {id: "of_bronze", name: "of Bronze", tierBias: 1},
      {id: "of_silver", name: "of Silver", tierBias: 1},
      {id: "of_bone", name: "of Bone", tierBias: 1},
      {id: "of_ash", name: "of Ash", tierBias: 1},
      {id: "of_dust", name: "of Dust", tierBias: 1},
      {id: "of_mud", name: "of Mud", tierBias: 1},
      {id: "of_clay", name: "of Clay", tierBias: 1},
      {id: "of_sand", name: "of Sand", tierBias: 1},
      {id: "of_earth", name: "of Earth", tierBias: 1},
      {id: "of_water", name: "of Water", tierBias: 1},
      
      // Tier 2 (Higher rarity bias)
      {id: "of_dawn", name: "of Dawn", tierBias: 2},
      {id: "of_shadows", name: "of Shadows", tierBias: 2},
      {id: "of_the_depths", name: "of the Depths", tierBias: 2},
      {id: "of_embers", name: "of Embers", tierBias: 2},
      {id: "of_storms", name: "of Storms", tierBias: 2},
      {id: "of_winter", name: "of Winter", tierBias: 2},
      {id: "of_summer", name: "of Summer", tierBias: 2},
      {id: "of_night", name: "of Night", tierBias: 2},
      {id: "of_light", name: "of Light", tierBias: 2},
      {id: "of_flames", name: "of Flames", tierBias: 2},
      {id: "of_ice", name: "of Ice", tierBias: 2},
      {id: "of_thunder", name: "of Thunder", tierBias: 2},
      {id: "of_lightning", name: "of Lightning", tierBias: 2},
      {id: "of_the_void", name: "of the Void", tierBias: 2},
      {id: "of_eternity", name: "of Eternity", tierBias: 2},
      {id: "of_power", name: "of Power", tierBias: 2},
      {id: "of_wisdom", name: "of Wisdom", tierBias: 2},
      {id: "of_courage", name: "of Courage", tierBias: 2},
      {id: "of_vengeance", name: "of Vengeance", tierBias: 2},
      {id: "of_justice", name: "of Justice", tierBias: 2},
      {id: "of_chaos", name: "of Chaos", tierBias: 2},
      {id: "of_order", name: "of Order", tierBias: 2},
      {id: "of_mystery", name: "of Mystery", tierBias: 2},
      {id: "of_secrets", name: "of Secrets", tierBias: 2},
      {id: "of_whispers", name: "of Whispers", tierBias: 2},
      {id: "of_dreams", name: "of Dreams", tierBias: 2},
      {id: "of_nightmares", name: "of Nightmares", tierBias: 2},
      {id: "of_souls", name: "of Souls", tierBias: 2},
      {id: "of_spirits", name: "of Spirits", tierBias: 2},
      {id: "of_the_ancients", name: "of the Ancients", tierBias: 3},
      {id: "of_infinity", name: "of Infinity", tierBias: 3},
      {id: "of_creation", name: "of Creation", tierBias: 3},
      {id: "of_destruction", name: "of Destruction", tierBias: 3},
      {id: "of_the_cosmos", name: "of the Cosmos", tierBias: 3},
      {id: "of_reality", name: "of Reality", tierBias: 3},
      {id: "of_existence", name: "of Existence", tierBias: 3},
      {id: "of_transcendence", name: "of Transcendence", tierBias: 3},
      {id: "of_ascension", name: "of Ascension", tierBias: 3},
      {id: "of_perfection", name: "of Perfection", tierBias: 3},
      {id: "of_the_one", name: "of the One", tierBias: 3}
    ];
  }

  // Weighted selection based on rarity tier
  selectWeightedByTier(items, rng, rarityTier) {
    // Calculate tier bias - higher rarity = prefer higher tierBias
    const tierPreference = Math.min(rarityTier / 3, 3); // 0-3 scale
    
    const weightedItems = items.map(item => ({
      ...item,
      weight: item.tierBias <= tierPreference ? item.tierBias * 2 : 1
    }));
    
    const totalWeight = weightedItems.reduce((sum, item) => sum + item.weight, 0);
    let random = rng.nextFloat(0, totalWeight);
    
    for (const item of weightedItems) {
      random -= item.weight;
      if (random <= 0) {
        return item;
      }
    }
    
    return weightedItems[0];
  }

  // Get rarity tier (0-9)
  getRarityTier(rarity) {
    const tiers = {
      'Common': 0, 'Uncommon': 1, 'Rare': 2, 'Epic': 3, 'Mythic': 4,
      'Ancient': 5, 'Relic': 6, 'Legendary': 7, 'Transcendent': 8, '1/1': 9
    };
    return tiers[rarity] || 0;
  }

  // Generate procedural item name
  generateName(rng, rarity, depth, rollIndex) {
    const rarityTier = this.getRarityTier(rarity);
    
    // Select components with tier bias
    const prefix = this.selectWeightedByTier(this.prefixes, rng, rarityTier);
    const base = this.selectWeightedByTier(this.bases, rng, rarityTier);
    const suffix = this.selectWeightedByTier(this.suffixes, rng, rarityTier);
    
    // Glyph chance - only for Epic+ with scaling probability
    let glyph = null;
    if (rarityTier >= 3) { // Epic+
      const glyphChance = 0.1 + (rarityTier - 3) * 0.05; // 10% base, +5% per tier
      if (rng.next() < glyphChance) {
        glyph = rng.choice(this.glyphs);
      }
    }
    
    // Construct name
    let name = `${prefix.name} ${base.name} ${suffix.name}`;
    if (glyph) {
      name += ` ${glyph}`;
    }
    
    // Generate deterministic hash
    const hashData = JSON.stringify({
      depth,
      rollIndex,
      prefixId: prefix.id,
      baseId: base.id,
      suffixId: suffix.id,
      glyph: glyph || null
    });
    
    const hash = this.simpleHash(hashData);
    
    return {
      name,
      hash,
      baseValue: base.base_value,
      components: {
        prefix: prefix.id,
        base: base.id,
        suffix: suffix.id,
        glyph
      }
    };
  }

  // Simple hash function
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substr(0, 8);
  }

  // Generate affixes based on rarity
  generateAffixes(rng, rarity, affixBands) {
    const band = affixBands[rarity];
    if (!band) return [];
    
    const numAffixes = rng.nextInt(band.minAffixes, band.maxAffixes);
    const affixes = [];
    
    for (let i = 0; i < numAffixes; i++) {
      for (const roll of band.rolls) {
        const value = rng.nextInt(roll['+'][0], roll['+'][1]);
        affixes.push({
          id: roll.id,
          value: value
        });
      }
    }
    
    return affixes;
  }

  // Calculate final item value
  calculateValue(baseValue, rarity, affixes, valueMultipliers) {
    const rarityMultiplier = valueMultipliers[rarity] || 1;
    const affixSum = affixes.reduce((sum, affix) => sum + (affix.value / 100), 0);
    
    return Math.floor(baseValue * rarityMultiplier * (1 + affixSum));
  }
}