/**
 * Seeded RNG using mulberry32 algorithm for deterministic gameplay
 */
export class SeededRNG {
  constructor(seed) {
    this.seed = seed;
    this.state = seed;
  }

  // Generate next random number [0, 1)
  next() {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Generate random integer [min, max]
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Generate random float [min, max)
  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }

  // Choose random element from array
  choice(array) {
    return array[this.nextInt(0, array.length - 1)];
  }

  // Weighted choice from array of {item, weight} objects
  weightedChoice(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = this.nextFloat(0, totalWeight);
    
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item.item;
      }
    }
    
    return items[items.length - 1].item;
  }

  // Generate UUID-like string for item hashing
  generateId() {
    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, (c) => {
      const r = this.nextInt(0, 15);
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Global RNG instance
export let gameRNG = new SeededRNG(Date.now());

export function setSeed(seed) {
  gameRNG = new SeededRNG(seed);
}