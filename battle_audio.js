/**
 * Merge Beasts battle mode (1.4): the battle's sounds, made in Web Audio like the rest of the
 * game's (audio.js), and its music. Each beast's hits sound like what it is made of (a stone
 * thud, a fire whoosh, a watery slap, a chime of light, a cosmic zap); each enemy's like its
 * weapon (a sword's clang, a bow's twang, a club's thud, a ray gun's pew) or its stuff (shadow
 * folk whisper and pop). Music: `Battle Music N.mp3` and `Battle Boss Music.mp3` at the root
 * when they exist (BATTLE_MODE.md), else the solar system's own music carries on.
 */
const BATTLE_SFX = (() => {
  let noise = null;
  let lastAt = 0, inWindow = 0;

  function ready() {
    if (typeof audio === 'undefined' || !audio || !audio.sfxEnabled) return null;
    audio.init();
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    if (!noise) {
      const n = audio.ctx.sampleRate;
      noise = audio.ctx.createBuffer(1, n, n);
      const d = noise.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    return audio.ctx;
  }

  /** Not too many at once: a crowded battle would otherwise roar. */
  function allowed(priority) {
    const now = performance.now();
    if (now - lastAt > 90) { lastAt = now; inWindow = 0; }
    if (inWindow >= (priority ? 8 : 4)) return false;
    inWindow++;
    return true;
  }

  function out(ctx, vol, when, dur) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    g.connect(audio.sfxGain);
    return g;
  }
  function tone(ctx, type, f0, f1, dur, vol, when = ctx.currentTime, detune = 0) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, when);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), when + dur);
    o.detune.value = detune;
    o.connect(out(ctx, vol, when, dur));
    o.start(when);
    o.stop(when + dur + 0.02);
  }
  function hiss(ctx, f0, f1, q, dur, vol, when = ctx.currentTime, type = 'bandpass') {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, when);
    f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), when + dur);
    s.connect(f);
    f.connect(out(ctx, vol, when, dur));
    s.start(when, Math.random() * 0.5);
    s.stop(when + dur + 0.02);
  }

  /** What a beast or enemy sounds like when it hits. */
  function voiceOf(u) {
    if (u.side === 'you') {
      const t = BEAST_TEMPLATES[u.kind] || {};
      const body = (t.svgParams || {}).body || 'droplet';
      if (['golem', 'stone', 'spiky_stone', 'shell', 'tree'].includes(body)) return 'stone';
      if (['dragon', 'dino', 'lion', 'wolf', 'bull', 'hydra'].includes(body)) return 'roar';
      return { FIRE: 'fire', EARTH: 'stone', WATER: 'water', WIND: 'wind', LIGHT: 'chime', DEITY: 'chime', COSMIC: 'zap', VOID: 'void' }[t.element] || 'chime';
    }
    const e = BATTLE_DATA.ENEMIES[u.kind];
    const look = (e && e.look) || {};
    if (look.shadow) return 'shadow';
    const w = look.weapon || '';
    if (['raygun', 'rifle', 'long_rifle', 'laser_sword'].includes(w) || ['saucer', 'drone', 'tank', 'eye'].includes(look.body) || look.plan === 'tripod') return 'laser';
    if (['bow', 'longbow', 'crossbow'].includes(w)) return 'twang';
    if (['staff', 'orb_staff', 'lantern', 'lute', 'flute', 'potion'].includes(w) || look.body === 'brain') return 'magic';
    if (['club', 'hammer', 'pick', 'shovel'].includes(w) || look.build === 'heavy') return 'thud';
    if (['claws', 'blades'].includes(w) || ['crawler', 'quad', 'blob', 'serpent'].includes(look.plan)) return 'slash';
    return 'metal';
  }

  const VOICES = {
    stone(ctx, k, t) { tone(ctx, 'sine', 140 * k, 50, 0.22, 0.5, t); hiss(ctx, 900, 200, 1.2, 0.12, 0.35, t, 'lowpass'); },
    roar(ctx, k, t) { tone(ctx, 'sawtooth', 120 * k, 70, 0.25, 0.22, t); hiss(ctx, 600, 300, 2, 0.2, 0.25, t); },
    fire(ctx, k, t) { hiss(ctx, 400, 2400 * k, 1.5, 0.22, 0.45, t); tone(ctx, 'triangle', 200 * k, 90, 0.18, 0.15, t); },
    water(ctx, k, t) { tone(ctx, 'sine', 700 * k, 180, 0.12, 0.35, t); hiss(ctx, 1600, 500, 3, 0.1, 0.18, t); },
    wind(ctx, k, t) { hiss(ctx, 1800 * k, 600, 0.8, 0.2, 0.4, t, 'highpass'); },
    chime(ctx, k, t) { tone(ctx, 'triangle', 1200 * k, 1100 * k, 0.28, 0.18, t); tone(ctx, 'sine', 1800 * k, 1700 * k, 0.22, 0.12, t + 0.02); },
    zap(ctx, k, t) { tone(ctx, 'square', 1500 * k, 220, 0.14, 0.12, t); tone(ctx, 'sine', 900 * k, 300, 0.1, 0.15, t); },
    void(ctx, k, t) { tone(ctx, 'sawtooth', 160 * k, 60, 0.26, 0.14, t, -20); tone(ctx, 'sawtooth', 164 * k, 62, 0.26, 0.14, t, 20); },
    shadow(ctx, k, t) { hiss(ctx, 2600 * k, 500, 2.2, 0.16, 0.3, t); tone(ctx, 'sine', 300 * k, 120, 0.14, 0.12, t); },
    laser(ctx, k, t) { tone(ctx, 'square', 1800 * k, 300, 0.16, 0.1, t); tone(ctx, 'sawtooth', 1200 * k, 200, 0.12, 0.08, t + 0.01); },
    twang(ctx, k, t) { tone(ctx, 'triangle', 500 * k, 420 * k, 0.16, 0.25, t); hiss(ctx, 4000, 2000, 4, 0.05, 0.12, t); },
    magic(ctx, k, t) { tone(ctx, 'sine', 600 * k, 1500 * k, 0.2, 0.18, t); tone(ctx, 'triangle', 900 * k, 2200 * k, 0.18, 0.1, t + 0.04); },
    thud(ctx, k, t) { tone(ctx, 'sine', 110 * k, 45, 0.2, 0.55, t); hiss(ctx, 500, 150, 1, 0.1, 0.3, t, 'lowpass'); },
    slash(ctx, k, t) { hiss(ctx, 3000 * k, 900, 1.4, 0.12, 0.35, t); },
    metal(ctx, k, t) { for (const f of [1200, 1730, 2410]) tone(ctx, 'sine', f * k, f * k * 0.98, 0.18, 0.08, t); hiss(ctx, 5000, 3000, 6, 0.04, 0.15, t); },
  };

  function hit(u, heavy) {
    const ctx = ready();
    if (!ctx || !allowed(heavy)) return;
    const t = ctx.currentTime;
    const v = voiceOf(u);
    const k = heavy ? 0.75 : 1 + (Math.random() - 0.5) * 0.12;
    VOICES[v](ctx, k, t);
    if (heavy) { tone(ctx, 'sine', 90, 35, 0.35, 0.55, t); hiss(ctx, 700, 120, 0.8, 0.25, 0.3, t, 'lowpass'); }
  }

  function death(u) {
    const ctx = ready();
    if (!ctx || !allowed(true)) return;
    const t = ctx.currentTime;
    if (u.side === 'you') {
      tone(ctx, 'triangle', 880, 330, 0.35, 0.2, t);
      tone(ctx, 'sine', 660, 220, 0.4, 0.14, t + 0.06);
      return;
    }
    const v = voiceOf(u);
    if (v === 'shadow') { hiss(ctx, 400, 4000, 1.5, 0.3, 0.35, t); tone(ctx, 'sine', 500, 1400, 0.12, 0.12, t + 0.18); }
    else if (v === 'laser' || v === 'metal') { hiss(ctx, 3000, 400, 0.7, 0.35, 0.3, t); tone(ctx, 'square', 300, 60, 0.3, 0.1, t); }
    else if (v === 'slash' || v === 'magic') { tone(ctx, 'sine', 500, 1200, 0.1, 0.15, t); tone(ctx, 'sine', 1200, 200, 0.25, 0.15, t + 0.08); }
    else { tone(ctx, 'triangle', 240, 90, 0.3, 0.3, t); hiss(ctx, 800, 200, 1, 0.2, 0.18, t, 'lowpass'); }
  }

  const once = {
    deploy(ctx, t) { hiss(ctx, 300, 2400, 1.2, 0.18, 0.25, t); tone(ctx, 'triangle', 520, 1040, 0.16, 0.12, t + 0.04); },
    spawn(ctx, t) { tone(ctx, 'sine', 220, 160, 0.18, 0.08, t); },
    shoot(ctx, t) { tone(ctx, 'sine', 900, 1400, 0.08, 0.08, t); },
    coins(ctx, t) { for (let i = 0; i < 3; i++) tone(ctx, 'triangle', 2400 + Math.random() * 900, 2300, 0.07, 0.08, t + i * 0.05); },
    alarm(ctx, t) { for (let i = 0; i < 2; i++) tone(ctx, 'square', 880, 860, 0.1, 0.07, t + i * 0.16); },
    rally(ctx, t) { tone(ctx, 'sawtooth', 220, 230, 0.5, 0.12, t); tone(ctx, 'sawtooth', 330, 335, 0.5, 0.08, t + 0.05); },
    explosion(ctx, t) { hiss(ctx, 1600, 60, 0.6, 1.4, 0.8, t, 'lowpass'); tone(ctx, 'sine', 70, 25, 1.2, 0.8, t); },
    victory(ctx, t) { [523, 659, 784, 1047].forEach((f, i) => tone(ctx, 'triangle', f, f, 0.35, 0.18, t + i * 0.12)); },
    defeat(ctx, t) { [392, 330, 262, 196].forEach((f, i) => tone(ctx, 'triangle', f, f * 0.98, 0.4, 0.16, t + i * 0.16)); },
    star(ctx, t) { [1047, 1319, 1568].forEach((f, i) => tone(ctx, 'sine', f, f, 0.25, 0.14, t + i * 0.08)); },
    tap(ctx, t) { tone(ctx, 'triangle', 700, 600, 0.06, 0.1, t); },
  };
  function play(kind, priority = true) {
    const ctx = ready();
    if (!ctx || !once[kind] || !allowed(priority)) return;
    once[kind](ctx, ctx.currentTime);
  }

  // ---------------------------------------------------------------- music
  let track = null, resumeSystem = false;
  const exists = new Map();
  async function has(file) {
    if (exists.has(file)) return exists.get(file);
    let ok = false;
    try { ok = (await fetch(encodeURI(file), { method: 'HEAD' })).ok; } catch (e) { ok = false; }
    exists.set(file, ok);
    return ok;
  }
  /** The battle's music, if Sam's files are there: else the solar system's keeps playing. */
  async function music(boss, n) {
    stopMusic();
    if (typeof audio === 'undefined' || !audio || !audio.musicEnabled) return;
    let file = null;
    if (boss && await has('Battle Boss Music.mp3')) file = 'Battle Boss Music.mp3';
    if (!file) {
      const list = [];
      for (let i = 1; i <= 8; i++) { if (await has(`Battle Music ${i}.mp3`)) list.push(`Battle Music ${i}.mp3`); else break; }
      if (list.length) file = list[(n - 1) % list.length];
    }
    if (!file) return;
    audio.init();
    resumeSystem = audio.musicPlaying;
    audio.stopMusic();
    track = new Audio(encodeURI(file));
    track.loop = true;
    track.volume = Math.min(1, (audio.volume || 0.5) * 0.9);
    track.play().catch(() => {});
  }
  function stopMusic() {
    if (track) { track.pause(); track = null; }
    if (resumeSystem && typeof audio !== 'undefined' && audio) { resumeSystem = false; audio.startMusic(); }
  }
  async function sting(won) {
    const file = won ? 'Battle Victory.mp3' : 'Battle Defeat.mp3';
    if (typeof audio !== 'undefined' && audio && audio.musicEnabled && await has(file)) { const a = new Audio(encodeURI(file)); a.volume = Math.min(1, (audio.volume || 0.5)); a.play().catch(() => {}); }
    else play(won ? 'victory' : 'defeat');
  }

  return { hit, death, play, music, stopMusic, sting, voiceOf };
})();
