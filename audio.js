/**
 * Mystic Beasts Evolution - Generative Audio Synthesizer Engine
 * Uses Web Audio API to create endless generative ambient music and custom rarity SFX.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.delayNode = null;
    this.feedbackNode = null;
    
    this.musicPlaying = false;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.volume = 0.5;

    // Generative music states
    this.chords = [
      [130.81, 164.81, 196.00, 246.94], // Cmaj7 (C3, E3, G3, B3)
      [146.83, 174.61, 220.00, 261.63], // Dm7 (D3, F3, A3, C4)
      [110.00, 130.81, 164.81, 196.00], // Am7 (A2, C3, E3, G3)
      [174.61, 220.00, 261.63, 329.63]  // Fmaj7 (F3, A3, C4, E4)
    ];
    this.chordIndex = 0;
    this.pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // C Pentatonic (C4-G5)
    
    this.chordIntervalId = null;
    this.melodyIntervalId = null;
    this.activePadOscillators = [];
    this.preferredOscType = 'triangle';
  }

  init() {
    if (this.ctx) return;
    
    // Create AudioContext
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Setup node graph: Source -> Gain Nodes -> Delay (for space) -> Destination
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.35 : 0, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);
    
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 0.7 : 0, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    // Set up a lovely stereo delay effect for ambient spaces
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(0.4, this.ctx.currentTime);
    
    this.feedbackNode = this.ctx.createGain();
    this.feedbackNode.gain.setValueAtTime(0.4, this.ctx.currentTime);
    
    // Feedback loop: delay -> feedback -> delay
    this.delayNode.connect(this.feedbackNode);
    this.feedbackNode.connect(this.delayNode);
    
    // Output delay to master
    this.delayNode.connect(this.masterGain);
  }

  setVolume(val) {
    this.volume = parseFloat(val);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.1);
    }
  }

  toggleMusic(enabled) {
    this.musicEnabled = enabled;
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.linearRampToValueAtTime(enabled ? 0.35 : 0, this.ctx.currentTime + 0.5);
    }
    if (enabled && !this.musicPlaying) {
      this.startMusic();
    }
  }

  toggleSfx(enabled) {
    this.sfxEnabled = enabled;
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(enabled ? 0.7 : 0, this.ctx.currentTime);
    }
  }

  startMusic() {
    this.init();
    if (this.musicPlaying) return;
    
    // Resume context if suspended (browser security)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    this.musicPlaying = true;
    
    // Play initial chord
    this.playNextAmbientChord();
    
    // Change ambient pad chord every 8 seconds
    this.chordIntervalId = setInterval(() => {
      this.playNextAmbientChord();
    }, 8000);

    // Play generative melody plucks procedurally
    this.playGenerativeMelody();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.chordIntervalId) clearInterval(this.chordIntervalId);
    if (this.melodyIntervalId) clearTimeout(this.melodyIntervalId);
    
    // Stop all active pad oscillators
    this.activePadOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.activePadOscillators = [];
  }

  // Plays detuned pad synth chords
  playNextAmbientChord() {
    if (!this.musicPlaying || !this.musicEnabled) return;

    const chord = this.chords[this.chordIndex];
    this.chordIndex = (this.chordIndex + 1) % this.chords.length;

    const now = this.ctx.currentTime;
    const fadeTime = 7.5; // Smooth overlap of pad sounds

    // Keep track of old oscillators and fade them out completely
    const oldOscillators = [...this.activePadOscillators];
    this.activePadOscillators = [];

    oldOscillators.forEach(item => {
      const { osc, gainNode } = item;
      try {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.5);
        setTimeout(() => {
          try { osc.stop(); } catch (e) {}
        }, 2000);
      } catch (e) {}
    });

    // Create new chord pad sounds
    chord.forEach(freq => {
      // Detuned dual triangle oscillators for massive warm chorus sound
      for (let detune of [-4, 4]) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = this.preferredOscType || 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);

        gainNode.gain.setValueAtTime(0, now);
        // Slowly swell chord
        gainNode.gain.linearRampToValueAtTime(0.06, now + 2.5);
        // Maintain level, then start natural fade out
        gainNode.gain.setValueAtTime(0.06, now + fadeTime - 1.5);
        gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);

        osc.connect(gainNode);
        gainNode.connect(this.musicGain);

        osc.start(now);
        
        this.activePadOscillators.push({ osc, gainNode });
        
        // Stop oscillator after full fade out
        setTimeout(() => {
          try { osc.stop(); } catch (e) {}
        }, fadeTime * 1000 + 500);
      }
    });
  }

  // Recursively plays improvised notes on pentatonic scale
  playGenerativeMelody() {
    if (!this.musicPlaying) return;

    const now = this.ctx.currentTime;
    
    // Only play sometimes to keep the sound spacious and relaxing
    if (Math.random() > 0.45 && this.musicEnabled) {
      // Pick random note from scale
      const noteFreq = this.pentatonicScale[Math.floor(Math.random() * this.pentatonicScale.length)];
      
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      // Soft sinus pluck
      osc.type = Math.random() > 0.6 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(noteFreq, now);

      gainNode.gain.setValueAtTime(0, now);
      // Fast attack, slow release
      gainNode.gain.linearRampToValueAtTime(0.06, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gainNode);
      // Route through delay for spaciousness, and also music gain
      gainNode.connect(this.musicGain);
      gainNode.connect(this.delayNode);

      osc.start(now);
      osc.stop(now + 1.5);
    }

    // Schedule next note in 1 to 3 seconds randomly (completely organic melody)
    const nextNoteDelay = 1000 + Math.random() * 2000;
    this.melodyIntervalId = setTimeout(() => {
      this.playGenerativeMelody();
    }, nextNoteDelay);
  }

  changeBiomeMusic(biomeIndex) {
    const biomeMusic = [
      // Biome 0: Forest Meadow (relaxing, original)
      {
        chords: [
          [130.81, 164.81, 196.00, 246.94], // Cmaj7
          [146.83, 174.61, 220.00, 261.63], // Dm7
          [110.00, 130.81, 164.81, 196.00], // Am7
          [174.61, 220.00, 261.63, 329.63]  // Fmaj7
        ],
        scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99],
        oscType: 'triangle',
        delay: 0.4,
        feedback: 0.4
      },
      // Biome 1: Volcanic Canyon (deeper, darker minor)
      {
        chords: [
          [97.99, 116.54, 146.83, 174.61], // Gm7
          [110.00, 130.81, 164.81, 196.00], // Am7
          [73.42, 92.50, 110.00, 138.59],   // Dm7
          [97.99, 116.54, 138.59, 164.81]   // Ebmaj7
        ],
        scale: [196.00, 220.00, 233.08, 293.66, 349.23, 392.00, 440.00, 466.16, 587.33],
        oscType: 'triangle',
        delay: 0.5,
        feedback: 0.45
      },
      // Biome 2: Crystal Cavern (shimmering major E)
      {
        chords: [
          [164.81, 207.65, 246.94, 311.13], // Emaj7
          [220.00, 277.18, 329.63, 415.30], // Amaj7
          [164.81, 196.00, 246.94, 293.66], // Em7
          [196.00, 246.94, 293.66, 392.00]  // Gmaj7
        ],
        scale: [329.63, 369.99, 415.30, 493.88, 554.37, 659.25, 739.99, 830.61, 987.77],
        oscType: 'sine',
        delay: 0.3,
        feedback: 0.5
      },
      // Biome 3: Sky Sanctuary (very open, airy)
      {
        chords: [
          [146.83, 220.00, 293.66, 369.99], // Dsus2
          [164.81, 246.94, 329.63, 415.30], // Esus2
          [174.61, 261.63, 349.23, 440.00], // Fmaj7
          [196.00, 293.66, 392.00, 493.88]  // G6
        ],
        scale: [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25, 739.99, 880.00],
        oscType: 'sine',
        delay: 0.6,
        feedback: 0.35
      },
      // Biome 4: Cosmic Nebula (chilly, cold minor C)
      {
        chords: [
          [130.81, 155.56, 196.00, 233.08], // Cm7
          [116.54, 138.59, 174.61, 207.65], // Abmaj7
          [146.83, 174.61, 220.00, 261.63], // Dm7b5
          [155.56, 196.00, 233.08, 293.66]  // Ebmaj7
        ],
        scale: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 622.25, 698.46, 783.99],
        oscType: 'sine',
        delay: 0.45,
        feedback: 0.4
      },
      // Biome 5: Celestial Cosmos (floating open fifths)
      {
        chords: [
          [110.00, 164.81, 220.00, 277.18], // Aadd9
          [146.83, 196.00, 261.63, 293.66], // Dsus2
          [164.81, 220.00, 293.66, 329.63], // Esus4
          [130.81, 196.00, 246.94, 293.66]  // Cmaj9
        ],
        scale: [220.00, 246.94, 277.18, 329.63, 369.99, 440.00, 493.88, 554.37, 659.25],
        oscType: 'triangle',
        delay: 0.5,
        feedback: 0.4
      },
      // Biome 6: Demonic Abyss (deep, heavy tension)
      {
        chords: [
          [82.41, 98.00, 123.47, 146.83],   // Em7
          [87.31, 110.00, 130.81, 164.81],  // Fmaj7
          [73.42, 92.50, 110.00, 130.81],   // Dm7
          [97.99, 123.47, 146.83, 174.61]   // G7
        ],
        scale: [164.81, 196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88],
        oscType: 'triangle',
        delay: 0.4,
        feedback: 0.5
      },
      // Biome 7: Omega Nexus (tech-like robotic minor)
      {
        chords: [
          [110.00, 146.83, 174.61, 220.00], // Asus4
          [130.81, 164.81, 220.00, 246.94], // C6
          [146.83, 196.00, 220.00, 293.66], // D7sus4
          [97.99, 130.81, 164.81, 196.00]   // Gsus4
        ],
        scale: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
        oscType: 'sawtooth',
        delay: 0.35,
        feedback: 0.4
      },
      // Biome 8: Eldritch Spire (mystical whole-tone)
      {
        chords: [
          [116.54, 155.56, 174.61, 233.08], // Bbsus4
          [123.47, 164.81, 196.00, 246.94], // Cbmaj7
          [110.00, 146.83, 164.81, 220.00], // Am#5
          [138.59, 174.61, 207.65, 277.18]  // Dbmaj7
        ],
        scale: [220.00, 246.94, 277.18, 311.13, 349.23, 392.00, 440.00, 493.88, 554.37],
        oscType: 'triangle',
        delay: 0.5,
        feedback: 0.4
      },
      // Biome 9: Singularity Void (ultra-slow, deep voids)
      {
        chords: [
          [65.41, 130.81, 196.00, 246.94],  // C2/C3 drone
          [73.42, 146.83, 220.00, 277.18],  // D2/D3 drone
          [55.00, 110.00, 164.81, 220.00],  // A1/A2 drone
          [65.41, 130.81, 164.81, 196.00]   // C2/Eb3 drone
        ],
        scale: [130.81, 155.56, 196.00, 233.08, 261.63, 311.13, 349.23, 392.00],
        oscType: 'sine',
        delay: 0.8,
        feedback: 0.7
      },
      // Biome 10+: Glittery Lava Plains (energized, fast)
      {
        chords: [
          [130.81, 164.81, 196.00, 261.63], // Cmaj
          [146.83, 174.61, 220.00, 293.66], // Dmin
          [164.81, 196.00, 246.94, 329.63], // Emin
          [174.61, 220.00, 261.63, 349.23]  // Fmaj
        ],
        scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99],
        oscType: 'triangle',
        delay: 0.4,
        feedback: 0.4
      }
    ];

    const idx = Math.min(biomeIndex, biomeMusic.length - 1);
    const music = biomeMusic[idx];

    this.chords = music.chords;
    this.pentatonicScale = music.scale;
    this.preferredOscType = music.oscType || 'triangle';
    this.chordIndex = 0;

    // Apply delay and feedback parameters dynamically to change space size!
    if (this.ctx && this.delayNode && this.feedbackNode) {
      const now = this.ctx.currentTime;
      this.delayNode.delayTime.setValueAtTime(music.delay, now);
      this.feedbackNode.gain.setValueAtTime(music.feedback, now);
    }

    if (this.musicPlaying) {
      this.playNextAmbientChord();
    }
  }

  // --- SOUND EFFECTS ---

  playClick() {
    if (!this.sfxEnabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    // Start slightly higher and pitch sweep down quickly
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playCrateDrop() {
    if (!this.sfxEnabled) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.35);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playCrateOpen() {
    if (!this.sfxEnabled) return;
    this.init();

    const now = this.ctx.currentTime;
    
    // Wood crack noise (White noise)
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    // Bright magic ding
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2); // C6 sweep

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);

    noiseNode.start(now);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playMerge() {
    if (!this.sfxEnabled) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(261.63, now); // C4
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.22); // G5 sweep

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);
    gainNode.connect(this.delayNode); // Add spatial delay

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playOrbCollect(multiplier = 0) {
    if (!this.sfxEnabled) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    // Frequency shifts slightly higher if player harvests rapidly
    const pitchOffset = Math.min(multiplier * 20, 200);
    const startFreq = 880 + pitchOffset; // A5 base
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, now + 0.12);

    gainNode.gain.setValueAtTime(0.06, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playUnlock(rarity) {
    if (!this.sfxEnabled) return;
    this.init();

    const now = this.ctx.currentTime;
    
    if (rarity === 'COMMON') {
      // Simple double chime
      const freqs = [523.25, 659.25]; // C5, E5
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gainNode.gain.setValueAtTime(0.15, now + idx * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } else if (rarity === 'RARE') {
      // Major triad arpeggio
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gainNode.gain.setValueAtTime(0.12, now + idx * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        gainNode.connect(this.delayNode);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } else if (rarity === 'SUPER_RARE') {
      // Shimmering celestial roll with vibrato LFO
      const freqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
      
      const vibrato = this.ctx.createOscillator();
      const vibratoGain = this.ctx.createGain();
      vibrato.frequency.value = 8; // Hz
      vibratoGain.gain.value = 15; // cents
      vibrato.connect(vibratoGain);
      vibrato.start(now);

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        vibratoGain.connect(osc.frequency); // hook vibrato
        
        gainNode.gain.setValueAtTime(0.08, now + idx * 0.06);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.6);
        
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        gainNode.connect(this.delayNode);
        
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.7);
      });
      setTimeout(() => { try { vibrato.stop(); } catch(e) {} }, 1500);

    } else if (rarity === 'ULTRA_RARE') {
      // Massive polyphonic arpeggiated sweep with sweeping lowpass filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(5000, now + 0.8);
      filter.connect(this.sfxGain);

      const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // Large C chord
      
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        
        gainNode.gain.setValueAtTime(0.06, now + idx * 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 1.2);
        
        osc.connect(gainNode);
        gainNode.connect(filter);
        gainNode.connect(this.delayNode);
        
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 1.5);
      });
    } else if (rarity === 'LEGENDARY' || rarity === 'GODLY') {
      // Mind-blowing gold/legendary cosmic swell with delays and sub bass
      this.playPrestige(); // Play the prestige epic chimes
      // And add a super high chime sequence
      const chords = [1046.50, 1318.51, 1567.98, 2093.00]; // C6, E6, G6, C7
      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05 + 0.5);
        gainNode.gain.setValueAtTime(0.12, now + idx * 0.05 + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.5 + 0.8);
        osc.connect(gainNode);
        gainNode.connect(this.sfxGain);
        gainNode.connect(this.delayNode);
        osc.start(now + idx * 0.05 + 0.5);
        osc.stop(now + idx * 0.05 + 0.5 + 0.9);
      });
    }
  }

  playPrestige() {
    if (!this.sfxEnabled) return;
    this.init();

    const now = this.ctx.currentTime;
    
    // Slow sub bass swell
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(60, now);
    subOsc.frequency.linearRampToValueAtTime(120, now + 1.5);
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.4, now + 0.3);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    // Sparkly chime cluster
    for (let i = 0; i < 12; i++) {
      const delay = i * 0.12;
      const freq = 600 + Math.random() * 800;
      
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gainNode.gain.setValueAtTime(0.06, now + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
      
      osc.connect(gainNode);
      gainNode.connect(this.sfxGain);
      gainNode.connect(this.delayNode);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.5);
    }
    
    subOsc.start(now);
    subOsc.stop(now + 2.0);
  }
}

// Export modules if running in Node environment, otherwise define globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioEngine;
} else {
  window.AudioEngine = AudioEngine;
}
