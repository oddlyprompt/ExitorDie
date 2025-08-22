/**
 * WebAudio SFX System for Exit or Die
 * Generates procedural sound effects without external files
 */

export class AudioSystem {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.7;
    this.isInitialized = false;
    
    console.log('🎵 AudioSystem created');
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Create AudioContext (requires user interaction)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      
      // Load settings from localStorage
      this.loadSettings();
      
      this.isInitialized = true;
      console.log('✅ AudioSystem initialized');
    } catch (error) {
      console.warn('❌ AudioSystem initialization failed:', error);
    }
  }

  loadSettings() {
    const musicVol = localStorage.getItem('exit_or_die_music_volume');
    const sfxVol = localStorage.getItem('exit_or_die_sfx_volume');
    
    if (musicVol !== null) this.musicVolume = parseFloat(musicVol);
    if (sfxVol !== null) this.sfxVolume = parseFloat(sfxVol);
    
    console.log('🎵 Audio settings loaded:', { music: this.musicVolume, sfx: this.sfxVolume });
  }

  saveSettings() {
    localStorage.setItem('exit_or_die_music_volume', this.musicVolume.toString());
    localStorage.setItem('exit_or_die_sfx_volume', this.sfxVolume.toString());
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  // Core sound generation method
  createOscillator(type, frequency, duration, volume = 1.0) {
    if (!this.isInitialized || this.sfxVolume === 0) return null;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
    
    return { oscillator, gainNode };
  }

  // Create noise (for whoosh effects)
  createNoise(duration, volume = 1.0, filterFreq = 1000) {
    if (!this.isInitialized || this.sfxVolume === 0) return null;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + duration);
    
    gainNode.gain.setValueAtTime(volume * this.sfxVolume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    source.start(this.audioContext.currentTime);
    
    return { source, filter, gainNode };
  }

  // SFX Library
  playWheelTick() {
    console.log('🎵 Playing wheel tick');
    this.createOscillator('square', 800, 0.04, 0.2);
  }

  playLootChime() {
    console.log('🎵 Playing loot chime');
    setTimeout(() => this.createOscillator('sine', 880, 0.15, 0.3), 0);
    setTimeout(() => this.createOscillator('sine', 1320, 0.15, 0.3), 150);
  }

  playTrapThud() {
    console.log('🎵 Playing trap thud');
    this.createOscillator('sawtooth', 90, 0.3, 0.5);
  }

  playHealSparkle() {
    console.log('🎵 Playing heal sparkle');
    setTimeout(() => this.createOscillator('sine', 1200, 0.12, 0.25), 0);
    setTimeout(() => this.createOscillator('sine', 1500, 0.12, 0.25), 120);
    setTimeout(() => this.createOscillator('sine', 1800, 0.12, 0.25), 240);
  }

  playEquipClick() {
    console.log('🎵 Playing equip click');
    this.createOscillator('square', 400, 0.1, 0.2);
  }

  playMilestoneWhoosh() {
    console.log('🎵 Playing milestone whoosh');
    this.createNoise(0.5, 0.3, 600);
  }

  playDeathBoom() {
    console.log('🎵 Playing death boom');
    const osc = this.createOscillator('sine', 60, 0.7, 0.6);
    if (osc && osc.gainNode) {
      // Quick attack, long decay
      osc.gainNode.gain.setValueAtTime(0.01, this.audioContext.currentTime);
      osc.gainNode.gain.exponentialRampToValueAtTime(0.6 * this.sfxVolume, this.audioContext.currentTime + 0.05);
      osc.gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.7);
    }
  }

  playButtonHover() {
    console.log('🎵 Playing button hover');
    this.createOscillator('sine', 600, 0.05, 0.1);
  }

  playButtonClick() {
    console.log('🎵 Playing button click');
    this.createOscillator('square', 400, 0.08, 0.15);
  }

  playVictory() {
    console.log('🎵 Playing victory sound');
    // Victory fanfare
    setTimeout(() => this.createOscillator('sine', 523, 0.2, 0.4), 0);    // C5
    setTimeout(() => this.createOscillator('sine', 659, 0.2, 0.4), 200);  // E5
    setTimeout(() => this.createOscillator('sine', 784, 0.3, 0.4), 400);  // G5
    setTimeout(() => this.createOscillator('sine', 1047, 0.4, 0.4), 600); // C6
  }

  // Ensure audio context is running (call on user interaction)
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
      console.log('🎵 AudioContext resumed');
    }
  }
}

// Global audio instance
export const audioSystem = new AudioSystem();

// Auto-initialize on first user interaction
let autoInitialized = false;
const initOnInteraction = () => {
  if (!autoInitialized) {
    audioSystem.initialize();
    audioSystem.resume();
    autoInitialized = true;
    console.log('🎵 Audio auto-initialized on user interaction');
  }
};

// Listen for user interactions to initialize audio
if (typeof window !== 'undefined') {
  ['click', 'touchstart', 'keydown'].forEach(event => {
    document.addEventListener(event, initOnInteraction, { once: true });
  });
}