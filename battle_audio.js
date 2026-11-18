/**
 * Merge Beasts battle mode (1.4): the battle's sounds, made in Web Audio like the rest of the
 * game's (audio.js), and its music. Each beast's hits sound like what it is made of (a stone
 * thud, a fire whoosh, a watery slap, a chime of light, a cosmic zap); each enemy's like its
 * weapon (a sword's clang, a bow's twang, a club's thud, a ray gun's pew) or its stuff (shadow
 * folk whisper and pop). Music: Sam's battle MP3s at the root, listed in battle_music.json by
 * build.js (BATTLE_MODE.md); with none for a battle, the solar system's own music carries on.
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
      const t = BATTLE_DATA.T(u.kind) || {};
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
    // The countdown: a tick for three, two and one, then a bright two-note call to fight.
    count(ctx, t) { tone(ctx, 'triangle', 660, 660, 0.14, 0.2, t); tone(ctx, 'sine', 1320, 1320, 0.1, 0.06, t); },
    go(ctx, t) { tone(ctx, 'sawtooth', 523, 523, 0.12, 0.12, t); tone(ctx, 'sawtooth', 784, 784, 0.35, 0.14, t + 0.12); tone(ctx, 'triangle', 1047, 1047, 0.35, 0.1, t + 0.12); hiss(ctx, 8000, 5000, 0.5, 0.5, 0.08, t + 0.12, 'highpass'); },
    nope(ctx, t) { tone(ctx, 'square', 220, 180, 0.12, 0.06, t); },
  };
  function play(kind, priority = true) {
    const ctx = ready();
    if (!ctx || !once[kind] || !allowed(priority)) return;
    once[kind](ctx, ctx.currentTime);
  }

  // ---------------------------------------------------------------- music
  // battle_music.json (written by build.js from the MP3s at the root with "battle" in their name):
  // tracks by solar system, casual and boss, and victory and defeat stings. Sam makes the music.
  let track = null, resumeSystem = false, list = null, stingTrack = null, fadeT = null;
  async function manifest() {
    if (list) return list;
    try { list = await (await fetch('battle_music.json', { cache: 'no-store' })).json(); }
    catch (e) { list = { prime: { casual: [], boss: [] }, low_gravity: { casual: [], boss: [] }, victory: [], defeat: [] }; }
    return list;
  }
  /** The battle's music: a boss level's track, else the next casual track, for its solar system. */
  async function music(boss, n, system = 'prime') {
    stopMusic();
    if (typeof audio === 'undefined' || !audio || !audio.musicEnabled) return;
    const m = await manifest();
    const sys = m[system] || m.prime;
    const pool = boss && sys.boss.length ? sys.boss : sys.casual;
    if (!pool || !pool.length) return;
    const file = pool[(n - 1) % pool.length];
    audio.init();
    resumeSystem = audio.musicPlaying;
    audio.stopMusic();
    track = new Audio(encodeURI(file));
    track.loop = true;
    track.volume = Math.min(1, (audio.volume || 0.5) * 0.9);
    track.play().catch(() => {});
  }
  function stopMusic() {
    clearInterval(fadeT);
    if (track) { track.pause(); track = null; }
    if (resumeSystem && typeof audio !== 'undefined' && audio) { resumeSystem = false; audio.startMusic(); }
  }
  /**
   * The battle is over: its music fades out over a second and a half (Sam, 18 Nov: stopping dead
   * was an anticlimax) while the victory or defeat music comes in.
   */
  function endMusic() {
    clearInterval(fadeT);
    const tr = track;
    if (!tr) return;
    const v0 = tr.volume;
    const t0 = performance.now();
    fadeT = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / 1600);
      tr.volume = Math.max(0, v0 * (1 - k));
      if (k >= 1) { clearInterval(fadeT); tr.pause(); if (track === tr) track = null; }
    }, 50);
  }
  /** Leaving the results: the solar system's music comes back. */
  function leave() {
    if (stingTrack) { stingTrack.pause(); stingTrack = null; }
    stopMusic();
  }

  /**
   * A short piece of music, synthesised: notes as [time, beats long, frequency] for each voice. A
   * brass lead (a filtered sawtooth with a little vibrato), soft chords, a bass, and drums.
   */
  function piece(ctx, t0, beat, parts) {
    const bus = ctx.createGain();
    bus.gain.value = 0.9;
    bus.connect(audio.sfxGain);
    const note = (type, f, at, dur, vol, o = {}) => {
      const when = t0 + at * beat, len = dur * beat;
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(f, when);
      if (o.glide) osc.frequency.exponentialRampToValueAtTime(f * o.glide, when + len);
      if (o.vib) { const lfo = ctx.createOscillator(); const lg = ctx.createGain(); lfo.frequency.value = 5.5; lg.gain.value = f * o.vib; lfo.connect(lg); lg.connect(osc.frequency); lfo.start(when); lfo.stop(when + len + 0.3); }
      const g = ctx.createGain();
      const att = o.att || 0.02, rel = o.rel || 0.12;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(vol, when + att);
      g.gain.setValueAtTime(vol, Math.max(when + att, when + len - rel));
      g.gain.exponentialRampToValueAtTime(0.0001, when + len + rel);
      let node = osc;
      if (o.lp) { const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = o.lp; f2.Q.value = 1.2; osc.connect(f2); node = f2; }
      node.connect(g);
      g.connect(bus);
      osc.start(when);
      osc.stop(when + len + rel + 0.05);
    };
    const drum = (kind, at, vol = 1) => {
      const when = t0 + at * beat;
      if (kind === 'kick') { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(130, when); o.frequency.exponentialRampToValueAtTime(42, when + 0.18); const g = out(ctx, 0.55 * vol, when, 0.25); o.connect(g); o.start(when); o.stop(when + 0.3); }
      else if (kind === 'snare') hiss(ctx, 2600, 1400, 0.9, 0.16, 0.28 * vol, when);
      else if (kind === 'cymbal') hiss(ctx, 9000, 6000, 0.5, 1.6, 0.16 * vol, when, 'highpass');
      else if (kind === 'timp') { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(98 * (vol > 1 ? 1 : 1), when); o.frequency.exponentialRampToValueAtTime(80, when + 0.5); const g = out(ctx, 0.4, when, 0.6); o.connect(g); o.start(when); o.stop(when + 0.65); hiss(ctx, 400, 120, 0.8, 0.3, 0.15, when, 'lowpass'); }
    };
    for (const [at, dur, f, v] of parts.lead || []) { note('sawtooth', f, at, dur, (v || 1) * 0.12, { lp: 2600, vib: 0.006, att: 0.03 }); note('square', f / 2, at, dur, (v || 1) * 0.035, { lp: 1400 }); }
    for (const [at, dur, fs] of parts.pads || []) for (const f of fs) note('triangle', f, at, dur, 0.05, { att: 0.12, rel: 0.4 });
    for (const [at, dur, f, glide] of parts.bass || []) note('triangle', f, at, dur, 0.22, { lp: 900, glide });
    for (const [at, dur, f] of parts.bell || []) { note('sine', f, at, dur, 0.06, { rel: 0.5 }); note('sine', f * 2, at, dur * 0.6, 0.025, { rel: 0.4 }); }
    for (const [at, kind, v] of parts.drums || []) drum(kind, at, v);
  }
  const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI number to frequency
  const chord = (...ns) => ns.map(NOTE);
  /** A rising fanfare that lands on a big held chord with a roll and a cymbal: about five seconds. */
  function victoryFanfare(ctx, t) {
    const B = 0.2;
    piece(ctx, t, B, {
      lead: [[0, 0.7, NOTE(67)], [0.75, 0.7, NOTE(72)], [1.5, 0.7, NOTE(76)], [2.25, 1.5, NOTE(79)], [4, 0.7, NOTE(76)], [4.75, 2.2, NOTE(79)],
        [7.5, 1, NOTE(81)], [8.5, 0.5, NOTE(79)], [9, 0.5, NOTE(77)], [9.5, 1, NOTE(76)], [10.5, 1, NOTE(74)], [11.5, 0.5, NOTE(76)], [12, 0.5, NOTE(77)], [12.5, 1, NOTE(79)],
        [14, 7, NOTE(84), 1.2]],
      pads: [[0, 4, chord(60, 64, 67)], [4, 3.5, chord(60, 65, 69)], [7.5, 3, chord(65, 69, 72)], [10.5, 3.5, chord(67, 71, 74)], [14, 7, chord(60, 64, 67, 72)]],
      bass: [[0, 2, NOTE(48)], [2, 2, NOTE(55)], [4, 3.5, NOTE(53)], [7.5, 3, NOTE(53)], [10.5, 3.5, NOTE(55)], [14, 7, NOTE(48)]],
      bell: [[14, 1, NOTE(84)], [14.5, 1, NOTE(88)], [15, 1, NOTE(91)], [15.5, 2, NOTE(96)]],
      drums: [[0, 'kick'], [1, 'snare'], [2, 'kick'], [3, 'snare'], [4, 'kick'], [5, 'snare'], [6, 'kick'], [7, 'snare'], [7.5, 'kick'], [9, 'snare'], [10.5, 'kick'], [11.5, 'snare'],
        [12.5, 'timp'], [12.75, 'timp'], [13, 'timp'], [13.25, 'timp'], [13.5, 'timp'], [13.75, 'timp'], [14, 'kick', 1.3], [14, 'cymbal', 1.4]],
    });
  }
  /** A slow fall in a minor key, down to a low held chord that fades: about five seconds. */
  function defeatTheme(ctx, t) {
    const B = 0.3;
    piece(ctx, t, B, {
      lead: [[0, 1, NOTE(76), 0.8], [1, 1, NOTE(74), 0.8], [2, 1, NOTE(72), 0.8], [3, 2, NOTE(71), 0.8], [5.5, 1, NOTE(69), 0.7], [6.5, 1, NOTE(68), 0.7], [7.5, 1.2, NOTE(67), 0.65], [9, 5, NOTE(69), 0.6]],
      pads: [[0, 3, chord(57, 60, 64)], [3, 2.5, chord(53, 57, 60)], [5.5, 3.5, chord(52, 56, 59)], [9, 5.5, chord(45, 52, 57, 60)]],
      bass: [[0, 3, NOTE(45)], [3, 2.5, NOTE(41)], [5.5, 3.5, NOTE(40)], [9, 5.5, NOTE(33), 0.97]],
      drums: [[0, 'timp'], [3, 'timp'], [5.5, 'timp'], [8.5, 'timp'], [8.75, 'timp'], [9, 'kick', 0.8]],
    });
  }
  /** The end of a battle: Sam's victory or defeat music (his own solar system's if there is one), else ours. */
  async function sting(won, system = 'prime') {
    const m = await manifest();
    const all = (won ? m.victory : m.defeat) || [];
    const lg = (f) => f.toLowerCase().replace(/[^a-z0-9]/g, '').includes('lowgravity');
    const own = all.filter((f) => (system === 'low_gravity') === lg(f));
    const pool = own.length ? own : all;
    if (typeof audio !== 'undefined' && audio && audio.musicEnabled && pool.length) {
      stingTrack = new Audio(encodeURI(pool[Math.floor(Math.random() * pool.length)]));
      stingTrack.volume = Math.min(1, (audio.volume || 0.5));
      stingTrack.play().catch(() => {});
      return;
    }
    const ctx = ready();
    if (!ctx) return;
    (won ? victoryFanfare : defeatTheme)(ctx, ctx.currentTime + 0.05);
  }

  return { hit, death, play, music, stopMusic, endMusic, leave, sting, voiceOf };
})();
