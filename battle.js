/**
 * Merge Beasts battle mode (1.4): the Battle tab, the world and level screens, the deck, the
 * battle itself on a canvas, the results and rewards, the foe wiki and the battle achievements.
 * The rules are battle_engine.js, the numbers battle_data.js, the enemies' look enemies.js and the
 * sounds battle_audio.js. Saved under state.battle (one new key; nothing else in the save changes).
 */
const BATTLE = (() => {
  const D = BATTLE_DATA, BE = BattleEngine;
  const W = BE.ARENA.w, H = BE.ARENA.h;
  const RANK = ['COMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE', 'LEGENDARY', 'GODLY', 'DARK_MATTER'];
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const sfx = (k) => { if (typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.play(k); };
  const click = () => { if (typeof audio !== 'undefined' && audio) audio.playClick(); };

  // ================================================================== saved progress
  function B() {
    if (!state.battle) state.battle = { v: 1, best: {}, stars: {}, seen: {}, bosses: {}, flawless: 0, fastest: 0, underdog: false, freeSpins: 0, starGifts: 0, chests: {}, ach: {}, decks: { prime: [], low_gravity: [] }, bestPrestige: {}, fury: false };
    const b = state.battle;
    for (const k of ['best', 'stars', 'seen', 'bosses', 'chests', 'ach', 'bestPrestige', 'kills', 'legends', 'played']) b[k] = b[k] || {};
    b.decks = b.decks || { prime: [], low_gravity: [] };
    // Premium crates won in battle and not opened yet: the highest tier each can hold.
    b.crates = b.crates || [];
    return b;
  }
  function sysPrestige(sys) {
    if (sys === state.currentSolarSystem) return state.prestigeLevel || 0;
    const branch = sys === 'prime' ? state.primeSystem : sys === 'comet' ? state.cometSystem : state.lowGravitySystem;
    return (branch && branch.prestigeLevel) || 0;
  }
  /** A beast has been on your field at this prestige: its battle version is at least that. */
  function noteOwned(id) {
    if (!id || state.inBeastHub || !D.canBattle(id) || D.LEGENDS[id]) return;
    const p = Math.min(15, sysPrestige(D.systemOf(id)));
    const b = B();
    if ((b.bestPrestige[id] || 0) < p) b.bestPrestige[id] = p;
  }
  const prestigeOf = (id) => Math.min(15, B().bestPrestige[id] || 0);
  /** Folded Legends you have won: they battle in every world, Prime and Low Gravity. */
  const legendsOwned = () => D.LEGEND_LIST.map((l) => l.id).filter((id) => B().legends[id]);
  // Beasts of the world's system, the Relics (merge rewards, every world) and the Folded Legends.
  // (World 7: every system's beasts.)
  const owned = (sys) => [...state.unlockedBeasts.filter((id) => D.canBattle(id) && (sys === 'any' || D.systemOf(id) === sys || D.systemOf(id) === 'any') && !D.LEGENDS[id]), ...legendsOwned()];
  const cleared = (id) => !!B().best[id];
  /** Whether you have reached the Low Gravity solar system (its warp portal opens at Prime prestige 9). */
  const reachedLowGravity = () => state.currentSolarSystem === 'low_gravity' || ((state.primeSystem && state.primeSystem.prestigeLevel) || 0) >= 9 || (state.currentSolarSystem === 'prime' && state.prestigeLevel >= 9);
  /**
   * World 1 is open from the start, and each world after the one before it. World 4 (the first
   * Low Gravity world) opens once you have reached that system and won World 1: waiting for the
   * end of World 3 would keep most players out of it.
   */
  const worldOpen = (w) => {
    if (w.id === 1) return true;
    // 1.5: World 7 opens once Worlds 1, 2, 4 and 5 are won in full (Sam, 23 Nov).
    if (w.id === 7) return [1, 2, 4, 5].every((k) => cleared(`${k}-40`));
    if (w.id === 4) return reachedLowGravity() && cleared(`1-${D.WORLDS[0].levels}`);
    return cleared(`${w.id - 1}-${D.WORLDS[w.id - 2].levels}`);
  };
  const lockText = (w) => (w.id === 7 ? 'Win Worlds 1, 2, 4 and 5 to open' : w.id === 4 ? 'Reach the Low Gravity system and win World 1 to open' : `Clear World ${w.id - 1} to open`);
  /** Any level you have won stays open to play again; the next one opens when you win the one before. */
  const levelOpen = (w, n) => worldOpen(w) && (n === 1 || cleared(`${w.id}-${n}`) || cleared(`${w.id}-${n - 1}`));
  function totals() {
    const b = B();
    let worlds = 0, lgWorlds = 0;
    for (const w of D.WORLDS) if (cleared(`${w.id}-${w.levels}`)) { if (w.system === 'prime') worlds++; else if (w.system === 'low_gravity') lgWorlds++; }
    // Kills, by kind of enemy, by world and by the enemy itself (for the legends' challenges).
    const killsByRole = {}, killsByWorld = {};
    let kills = 0;
    for (const [id, c] of Object.entries(b.kills)) {
      const e = D.ENEMIES[id];
      if (!e) continue;
      kills += c;
      killsByRole[e.role] = (killsByRole[e.role] || 0) + c;
      killsByWorld[e.world] = (killsByWorld[e.world] || 0) + c;
    }
    const achTotal = D.ACHIEVEMENTS.filter((a) => a.id !== 'all_ach').length;
    const achDone = D.ACHIEVEMENTS.filter((a) => a.id !== 'all_ach' && b.ach[a.id]).length;
    return {
      clears: Object.keys(b.best).length, stars: Object.keys(b.stars).length, bosses: Object.keys(b.bosses).length,
      worlds, lgWorlds, seen: Object.keys(b.seen).length, flawless: b.flawless || 0, fastest: b.fastest || 0, underdog: !!b.underdog,
      kills, killsOf: b.kills, killsByRole, killsByWorld, lowTierWin: !!b.lowTierWin, achDone, achTotal, blitz: !!b.blitz, perkWon: b.perkWon || {},
      // 1.5: World 7 won, and how many of its ten bosses beaten (the twins count as one).
      w7: cleared('7-20') ? 1 : 0,
      mutantBosses: new Set(Object.keys(b.kills).filter((id) => D.ENEMIES[id] && D.ENEMIES[id].role === 'mutant').map((id) => (id === 'twin_luna' ? 'twin_sol' : id))).size,
    };
  }

  // ================================================================== pictures
  const pics = new Map();
  /** A beast's picture (a data URL), made once; a Folded Legend's from legends_art.js. */
  function beastPic(id, px = 160, evolved = false) {
    const key = id + '|' + px + (evolved ? '|e' : '');
    // Battle sprites (256) first: the battle waits for them.
    if (!pics.has(key)) pics.set(key, D.LEGENDS[id] ? LEGEND_ART.picture(id, px, false) : ART.picture('beast', id, !!evolved, false, px, true, true, px >= 256));
    return pics.get(key);
  }
  const picReady = new Map();
  /** Set an img to a beast's picture: at once if it is made, else when made. */
  function fillPic(img, px) {
    const id = img.dataset.pic, evo = !!img.dataset.evo, key = id + '|' + px + (evo ? '|e' : '');
    if (picReady.has(key)) { img.src = picReady.get(key); return; }
    beastPic(id, px, evo).then((u) => { picReady.set(key, u); img.src = u; });
  }
  /**
   * An enemy's picture as an img: at once if it is made, else a blank one that fillStills() fills
   * when it scrolls into view, a few between frames (the Foe Wiki holds 192).
   */
  const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  function stillImg(id, size, sil = false, cls = '') {
    const ready = ENEMY_ART.stillReady(id, size, !!sil);
    return ready ? `<img${cls ? ` class="${cls}"` : ''} src="${ready}" alt="">` : `<img${cls ? ` class="${cls}"` : ''} data-still="${id}|${size}|${sil ? 1 : 0}" src="${BLANK}" alt="">`;
  }
  function fillStills(root) {
    const imgs = root.querySelectorAll('img[data-still]');
    if (!imgs.length) return;
    const paint = (img) => ART.queuePaint(() => { if (!img.isConnected) return; const [id, size, sil] = img.dataset.still.split('|'); img.src = ENEMY_ART.still(id, Number(size), sil === '1'); img.removeAttribute('data-still'); });
    if (typeof IntersectionObserver !== 'function') { imgs.forEach(paint); return; }
    const io = new IntersectionObserver((ents) => { for (const en of ents) if (en.isIntersecting) { io.unobserve(en.target); paint(en.target); } }, { rootMargin: '300px 0px' });
    imgs.forEach((img) => io.observe(img));
  }
  /** A deck entry: a beast's id, with a star on the end for its evolved form. */
  const baseOf = (x) => String(x).replace(/\*$/, '');
  const isEvo = (x) => String(x).endsWith('*');
  const evolvedOwned = (id) => !D.LEGENDS[id] && ((state.unlockedEvolved || []).includes(id));
  // (1.5: a comet beast has a special from Tier 10 without evolving.)
  const specialOwned = (id) => evolvedOwned(id) || (!!(BEAST_TEMPLATES[id] || {}).comet && !!D.abilityOf(id));
  /** How a beast or enemy fights, as a little label. */
  const KIND = { single: ['⚔️', 'Single'], area: ['💥', 'Area'], ranged: ['🎯', 'Ranged'] };
  const kindChip = (k) => `<span class="bt-kindchip ${k}">${KIND[k][0]} ${KIND[k][1]}</span>`;
  function rarityColour(id) { const t = D.T(id); return (RARITIES[t.rarity] || {}).color || '#fff'; }
  function statChips(s) {
    return `<span class="bt-stat atk">ATK ${s.atk}</span><span class="bt-stat hp">HP ${s.hp}</span><span class="bt-stat spd">SPD ${s.spd}</span><span class="bt-stat rng">RNG ${s.rng}</span>`;
  }
  const miniStats = (s) => `<i class="atk">A${s.atk}</i><i class="hp">H${s.hp}</i><i class="spd">S${s.spd}</i><i class="rng">R${s.rng}</i>`;
  const heartsHtml = (d) => { let s = ''; for (let i = 1; i <= 5; i++) s += `<span class="bt-dstar ${d >= i ? 'full' : d >= i - 0.5 ? 'half' : ''}">★</span>`; return s; };
  const RULE_ICON = { quick: '⏱', range: '🎯', speed: '💨', rarity: '◇', three: '3', slow: '🐢', few: '5', tough: '❤', spring: '💧' };
  /** The four patterns unlike the rest get a badge on their level's tile. */
  const PATTERN_ICON = { champion: '👑', horde: '👥', fortress: '🏰', tide: '🌊' };
  function ruleText(rule) {
    const v = rule.value;
    return {
      quick: `Only beasts that recharge in ${v} seconds or less (Tier ${v} and below).`,
      range: `Only beasts with Range ${v} or more.`,
      speed: `Only beasts with Speed ${v} or more.`,
      rarity: 'Only Common and Rare beasts.',
      three: 'Three beasts at most.',
      slow: 'Every card takes twice as long to recharge, so choose each one with care.',
      few: 'At most five of your beasts on the field at once.',
      tough: `Only beasts with Health ${v} or more.`,
    }[rule.kind];
  }
  const PERK_SVG = {
    fury: '<path d="M24 4C28 12 36 16 36 28C36 38 30 44 24 44C18 44 12 38 12 29C12 22 16 18 19 14C19 20 21 23 24 24C22 16 22 10 24 4Z" fill="#ff7a2a" stroke="#4a1a00" stroke-width="2.4" stroke-linejoin="round"/><path d="M24 22C27 27 30 30 30 35C30 39 27 42 24 42C21 42 18 39 18 35C18 31 21 29 24 22Z" fill="#ffd43b"/><path d="M16 30C16 26 18 23 20 21" stroke="#ffe8a0" stroke-width="2" fill="none" stroke-linecap="round"/>',
    rally: '<path d="M14 10H32C32 18 26 21 26 24C26 27 32 30 32 38H14C14 30 20 27 20 24C20 21 14 18 14 10Z" fill="#cfefff" stroke="#2a1a0a" stroke-width="2.2" stroke-linejoin="round"/><path d="M17 13H29C28 18 24 20 23 23C22 20 18 18 17 13Z" fill="#ffd43b"/><path d="M16 37C17 32 21 30 23 29C25 30 29 32 30 37Z" fill="#ffd43b"/><rect x="10" y="5" width="26" height="5" rx="2" fill="#8a5a2a" stroke="#2a1a0a" stroke-width="2"/><rect x="10" y="38" width="26" height="5" rx="2" fill="#8a5a2a" stroke="#2a1a0a" stroke-width="2"/><path d="M36 17l5 7l-5 7M31 17l5 7l-5 7" stroke="#5cc8ff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    fortify: '<path d="M24 4L40 10V22C40 33 33 40 24 44C15 40 8 33 8 22V10Z" fill="#3a8aff" stroke="#10204a" stroke-width="2.4" stroke-linejoin="round"/><path d="M24 8L36 12.5V22C36 31 31 36.5 24 40Z" fill="#2a6ad8"/><circle cx="24" cy="23" r="8" fill="#ffd43b" stroke="#8a5a00" stroke-width="2"/><circle cx="24" cy="23" r="4.2" fill="none" stroke="#c8901a" stroke-width="1.8"/>',
    wellspring: '<path d="M24 32V15" stroke="#5cc8ff" stroke-width="4" stroke-linecap="round"/><path d="M24 15C18 13 14 18 13 27M24 15C30 13 34 18 35 27" stroke="#9ae6ff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M24 3C27 7 28 9 28 11A4 4 0 0 1 20 11C20 9 21 7 24 3Z" fill="#5cc8ff" stroke="#10304a" stroke-width="1.8"/><path d="M9 33H39L36 43H12Z" fill="#9a9ab8" stroke="#2a2a3a" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="24" cy="33" rx="15" ry="3.6" fill="#5cc8ff" stroke="#2a2a3a" stroke-width="2"/>',
    deep_pool: '<path d="M24 4C31 14 38 21 38 30A14 14 0 0 1 10 30C10 21 17 14 24 4Z" fill="#2a6ad8" stroke="#0a1a4a" stroke-width="2.4" stroke-linejoin="round"/><path d="M12 28q3-3 6 0t6 0t6 0t6 0" stroke="#9ae6ff" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M13 34q3-3 6 0t6 0t6 0t5 0" stroke="#5cc8ff" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M19 15C17 18 16 20 15.5 22" stroke="#cfefff" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  };
  const perkIcon = (id) => `<svg class="bt-perk-svg" viewBox="0 0 48 48" aria-hidden="true">${PERK_SVG[id] || ''}</svg>`;
  const PERK_LOOK = {
    fury: { icon: '🔥', short: 'Heavy hit every 3rd swing' },
    rally: { icon: '⏩', short: 'Cards rest 25% less' },
    fortify: { icon: '🛡', short: 'Your pile lasts 20 s' },
    wellspring: { icon: '💧', short: 'Mana fills 25% faster' },
    deep_pool: { icon: '🌊', short: 'Hold 65 mana' },
  };

  /**
   * A little painting of a world for its card on the Battle tab: its sky and ground, something of
   * its place (a castle, a crashed ship, Earth over the moon...) and three of its people, the boss
   * behind. Made once.
   */
  const worldArts = new Map();
  function worldArt(w) {
    if (worldArts.has(w.id)) return worldArts.get(w.id);
    const c = document.createElement('canvas');
    c.width = 240; c.height = 180;
    const g = c.getContext('2d');
    const r = D.seeded(D.hash('worldart|' + w.id));
    const LOOK = {
      shadow: { sky: ['#140f26', '#3b2a5e'], ground: ['#2f4a44', '#16231f'] },
      kingdom: { sky: ['#5aa0e0', '#cfe8ff'], ground: ['#7cab55', '#466e2e'] },
      invasion: { sky: ['#1e0a14', '#b0482a'], ground: ['#8a5a34', '#3e2414'] },
      moon: { sky: ['#03040a', '#1c2038'], ground: ['#a4a8b8', '#5a5e70'] },
      rings: { sky: ['#06071a', '#2e2458'], ground: ['#6a5644', '#2a2018'] },
      eclipse: { sky: ['#040208', '#30143e'], ground: ['#3c2654', '#160c24'] },
      mutants: { sky: ['#07020f', '#3a1450'], ground: ['#3a2a3a', '#120a14'] },
    }[w.theme];
    const sky = g.createLinearGradient(0, 0, 0, 120);
    sky.addColorStop(0, LOOK.sky[0]); sky.addColorStop(1, LOOK.sky[1]);
    g.fillStyle = sky; g.fillRect(0, 0, 240, 180);
    // Stars over the dark worlds.
    if (['shadow', 'moon', 'rings', 'eclipse', 'invasion', 'mutants'].includes(w.theme)) for (let i = 0; i < 40; i++) { g.globalAlpha = 0.3 + r() * 0.6; g.fillStyle = '#fff'; g.fillRect(r() * 240, r() * 100, 1.5, 1.5); }
    g.globalAlpha = 1;
    const disc = (x, y, rad, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill(); };
    const glowAt = (x, y, rad, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
    if (w.theme === 'shadow') {
      glowAt(190, 34, 40, 'rgba(220,210,255,0.5)'); disc(190, 34, 15, '#e8e0ff');
      g.strokeStyle = '#0b0912'; g.lineCap = 'round';
      for (const [x, h] of [[22, 70], [52, 52], [212, 64]]) { g.lineWidth = 6; g.beginPath(); g.moveTo(x, 130); g.lineTo(x, 130 - h); g.stroke(); g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x, 130 - h * (0.5 + i * 0.15)); g.lineTo(x + (i % 2 ? 18 : -18), 130 - h * (0.75 + i * 0.1)); g.stroke(); } }
    } else if (w.theme === 'kingdom') {
      disc(40, 30, 14, '#fff6c0');
      g.fillStyle = '#8a8a98';
      g.fillRect(120, 56, 90, 64); for (let x = 120; x < 210; x += 15) g.fillRect(x, 50, 9, 8);
      g.fillRect(108, 36, 26, 84); g.fillRect(196, 36, 26, 84);
      g.fillStyle = '#6a6a78'; g.fillRect(152, 84, 26, 36);
      g.fillStyle = '#c83a4a'; g.beginPath(); g.moveTo(121, 36); g.lineTo(121, 16); g.lineTo(140, 22); g.lineTo(121, 28); g.fill();
      g.beginPath(); g.moveTo(209, 36); g.lineTo(209, 16); g.lineTo(228, 22); g.lineTo(209, 28); g.fill();
    } else if (w.theme === 'invasion') {
      glowAt(80, 110, 70, 'rgba(255,140,60,0.5)');
      g.fillStyle = '#5a6270'; g.beginPath(); g.ellipse(170, 40, 46, 13, -0.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#9ad8ff'; g.beginPath(); g.ellipse(166, 32, 18, 10, -0.2, Math.PI, 0); g.fill();
      for (let i = 0; i < 5; i++) disc(134 + i * 18, 44 + i * -3, 3, i % 2 ? '#7aff5a' : '#ffd84a');
      g.fillStyle = 'rgba(120,255,90,0.25)'; g.beginPath(); g.moveTo(150, 48); g.lineTo(190, 48); g.lineTo(206, 130); g.lineTo(134, 130); g.fill();
    } else if (w.theme === 'moon') {
      disc(186, 40, 22, '#3a7ad8'); g.fillStyle = '#5ac85a'; g.beginPath(); g.ellipse(180, 36, 10, 7, 0.6, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(194, 48, 6, 4, 0.2, 0, Math.PI * 2); g.fill();
      glowAt(186, 40, 32, 'rgba(120,180,255,0.3)');
      g.fillStyle = 'rgba(200,232,255,0.3)'; g.strokeStyle = '#e8f4ff'; g.lineWidth = 2; g.beginPath(); g.ellipse(50, 122, 44, 30, 0, Math.PI, 0); g.fill(); g.stroke();
    } else if (w.theme === 'rings') {
      disc(170, 52, 30, '#d8a060'); g.fillStyle = 'rgba(160,100,50,0.5)'; g.fillRect(140, 46, 60, 6);
      g.strokeStyle = 'rgba(240,220,180,0.8)'; g.lineWidth = 4; g.beginPath(); g.ellipse(170, 52, 56, 13, -0.3, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#3a2a1a'; g.fillRect(28, 68, 6, 52); g.fillStyle = '#e8e0d0'; g.beginPath(); g.moveTo(34, 70); g.lineTo(70, 84); g.lineTo(34, 100); g.fill();
      g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(46, 84, 5, 0, Math.PI * 2); g.fill();
    } else if (w.theme === 'mutants') {
      // A sick green glow, a cracked moon.
      glowAt(120, 50, 120, 'rgba(160,255,90,0.3)');
      disc(196, 30, 18, '#c8ff9a'); glowAt(196, 30, 30, 'rgba(200,255,150,0.4)');
      g.strokeStyle = '#4a7a2a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(186, 22); g.lineTo(196, 31); g.lineTo(190, 42); g.moveTo(196, 31); g.lineTo(209, 33); g.stroke();
    } else {
      glowAt(120, 46, 70, 'rgba(255,200,90,0.65)'); disc(120, 46, 26, '#05030a');
      g.strokeStyle = '#ffd27a'; g.lineWidth = 2; g.beginPath(); g.arc(120, 46, 27, 0, Math.PI * 2); g.stroke();
      for (const x of [26, 214]) { g.fillStyle = '#2a1a3a'; g.fillRect(x - 9, 40, 18, 90); g.fillStyle = '#4a2a5a'; g.fillRect(x - 12, 36, 24, 8); }
    }
    // The ground: a rise across the bottom.
    const gr = g.createLinearGradient(0, 110, 0, 180);
    gr.addColorStop(0, LOOK.ground[0]); gr.addColorStop(1, LOOK.ground[1]);
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, 124); g.quadraticCurveTo(60, 110, 120, 118); g.quadraticCurveTo(180, 126, 240, 112); g.lineTo(240, 180); g.lineTo(0, 180); g.fill();
    // Three of the world's people: the boss behind, two in front.
    const list = D.ENEMY_LIST.filter((e) => e.world === w.id);
    const boss = list.find((e) => e.role === 'boss');
    const front = list.filter((e) => e.role !== 'boss').slice(0, 6);
    const pose = { t: 0.3, walk: 0.15, atk: -1, heavy: false, hurt: 0, dying: 0, seed: 1 };
    const put = (id, x, y, px) => { g.save(); g.translate(x, y); ENEMY_ART.draw(g, id, pose, px); g.restore(); };
    if (w.theme === 'mutants') {
      // Pools of glowing slime, then three of its giants: Pyraxis behind, Gorrak and Trisskar in front.
      for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(140,255,90,0.35)'; g.beginPath(); g.ellipse(26 + i * 62, 150 + (i % 2) * 14, 18, 5, 0, 0, Math.PI * 2); g.fill(); }
      const giant = (id, x, y, h, mut) => { const e = D.ENEMIES[id]; g.save(); g.translate(x, y); ENEMY_ART.draw(g, id, { ...pose, mut: mut || {} }, ((h / 80) * 60) / e.look.size); g.restore(); };
      giant('dragon', 120, 128, 96, { phase: 1 });
      giant('hulk_goblin', 54, 178, 86, { riders: 3 });
      giant('three_headed_serpent', 190, 178, 84, {});
    } else {
      if (boss) put(boss.id, 124, 150, 78 / Math.max(1, boss.look.size || 1) * 1.15);
      if (front[1]) put(front[3] ? front[3].id : front[1].id, 62, 170, 62);
      if (front[0]) put(front[0].id, 186, 172, 62);
    }
    // A soft dark edge.
    const vg = g.createRadialGradient(120, 90, 60, 120, 90, 150);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = vg; g.fillRect(0, 0, 240, 180);
    const url = c.toDataURL();
    worldArts.set(w.id, url);
    return url;
  }

  // ================================================================== the Battle tab
  function renderTab() {
    const host = document.getElementById('content-sanctuary');
    if (!host) return;
    let sec = document.getElementById('battle-section');
    if (!sec) {
      sec = el('<div id="battle-section"></div>');
      host.insertBefore(sec, host.firstChild);
    }
    const t = totals();
    const b = B();
    const worldCard = (w) => {
      const open = worldOpen(w);
      let done = 0, stars = 0;
      for (let n = 1; n <= w.levels; n++) { if (cleared(`${w.id}-${n}`)) done++; if (b.stars[`${w.id}-${n}`]) stars++; }
      return `<button class="bt-world bt-theme-${w.theme} ${open ? '' : 'locked'}" data-world="${w.id}">
        <div class="bt-world-art" style="background-image:url(${worldArt(w)})"></div>
        <div class="bt-world-body">
          <div class="bt-world-name">World ${w.id}: ${w.name}</div>
          <div class="bt-world-meta">${open ? `${done >= w.levels ? 'All won' : `Level ${Math.min(w.levels, done + 1)} of ${w.levels}`} · <span class="${w.system === 'low_gravity' ? 'bt-lgstar' : w.system === 'any' ? 'bt-bluestar' : 'bt-gold'}">★ ${stars}/${w.levels}</span>` : lockText(w)}</div>
          <div class="bt-bar"><i style="width:${(done / w.levels) * 100}%"></i></div>
        </div>
        <div class="bt-world-go">${open ? '▶' : '🔒'}</div>
      </button>`;
    };
    const primeWorlds = D.WORLDS.filter((w) => w.system === 'prime').map(worldCard).join('');
    const lgWorlds = D.WORLDS.filter((w) => w.system === 'low_gravity').map(worldCard).join('');
    const mutantWorlds = D.WORLDS.filter((w) => w.system === 'any').map(worldCard).join('');
    const spins = b.freeSpins || 0;
    sec.innerHTML = `
      <div class="shop-section-title">Battle</div>
      <div class="bt-summary">
        <div><b class="bt-gold">★ ${t.stars}</b><span>stars</span></div>
        <div><b>${t.clears}</b><span>levels won</span></div>
        <div><b>${t.bosses}</b><span>bosses</span></div>
        <button id="bt-use-spin" class="${spins ? 'on' : ''}"><b>${spins}</b><span>${spins ? 'spin now ›' : 'free spins'}</span></button>
      </div>
      <div class="bt-system">Prime Solar System</div>
      ${primeWorlds}
      <div class="bt-system">Low Gravity Solar System</div>
      ${lgWorlds}
      ${mutantWorlds ? `<div class="bt-system mutants">Universal Mutants</div>${mutantWorlds}` : ''}
      <div class="bt-row">
        <button class="bt-btn" id="bt-open-legends">Folded Legends <small>${legendsOwned().length}/${D.LEGEND_LIST.length}</small></button>
        <button class="bt-btn" id="bt-open-ach">Achievements <small>${Object.keys(b.ach).length + Object.keys(b.mach || {}).length}/${D.ACHIEVEMENTS.length + MERGE_ACH.length}</small></button>
      </div>
      <div class="bt-row">
        <button class="bt-btn" id="bt-open-wiki">Foe Wiki <small>${t.seen}/${D.ENEMY_LIST.length}</small></button>
        <button class="bt-btn" id="bt-open-how">Rules</button>
      </div>`;
    sec.querySelectorAll('.bt-world[data-world]').forEach((btn) => btn.addEventListener('click', () => {
      const w = D.WORLDS[Number(btn.dataset.world) - 1];
      if (!worldOpen(w)) { showWarning('World locked', w.id === 7 ? 'Win Worlds 1, 2, 4 and 5 in full first. World 7 is the end of the game: bring your strongest beasts from both solar systems.' : w.id === 4 ? 'Win World 1 and reach the Low Gravity system first.' : `Win World ${w.id - 1} first.`); return; }
      click();
      openWorld(w);
    }));
    sec.querySelector('#bt-use-spin').addEventListener('click', () => {
      if (!(B().freeSpins > 0)) { showWarning('No free spins yet', 'You get one for every five stars.'); return; }
      click();
      if (typeof showDailySpinModal === 'function') showDailySpinModal();
    });
    sec.querySelector('#bt-open-wiki').addEventListener('click', () => { click(); openWiki(); });
    sec.querySelector('#bt-open-how').addEventListener('click', () => { click(); showRules(); });
    sec.querySelector('#bt-open-ach').addEventListener('click', () => { click(); openAchievements(); });
    checkMergeAch();
    sec.querySelector('#bt-open-legends').addEventListener('click', () => { click(); openLegends(); });
  }

  // ================================================================== full-screen sheets
  const sheets = [];
  function sheet(title, sub = '') {
    const s = el(`<div class="bt-sheet"><div class="bt-sheet-head"><button class="bt-back" aria-label="Back">‹</button><div class="bt-sheet-title">${title}<small>${sub}</small></div></div><div class="bt-sheet-body"></div></div>`);
    document.body.appendChild(s);
    document.body.classList.add('bt-sheets-open');
    requestAnimationFrame(() => s.classList.add('on'));
    const close = () => { s.classList.remove('on'); setTimeout(() => s.remove(), 220); const i = sheets.indexOf(api); if (i >= 0) sheets.splice(i, 1); if (!sheets.length) document.body.classList.remove('bt-sheets-open'); };
    s.querySelector('.bt-back').addEventListener('click', () => { click(); close(); });
    const api = { el: s, body: s.querySelector('.bt-sheet-body'), close };
    sheets.push(api);
    return api;
  }
  const closeSheets = () => { while (sheets.length) sheets[sheets.length - 1].close(); };

  // ------------------------------------------------------------------ a world's levels
  function openWorld(w) {
    const sh = sheet(`World ${w.id}: ${w.name}`);
    if (w.system === 'low_gravity') sh.el.classList.add('lg');
    if (w.id === 7) sh.el.classList.add('mutants');
    const draw = () => {
      const b = B();
      let stars = 0;
      for (let n = 1; n <= w.levels; n++) if (b.stars[`${w.id}-${n}`]) stars++;
      const chest = b.chests[w.id] ? 'Opened' : `${stars}/${w.levels} stars`;
      let tiles = '';
      for (let n = 1; n <= w.levels; n++) {
        const id = `${w.id}-${n}`;
        const lv = D.level(w.id, n);
        const open = levelOpen(w, n);
        const won = cleared(id);
        // The level's face: its boss, or the enemy that first appears in it, hidden until played.
        const feat = lv.bossFoe || lv.fresh || lv.spawns[0].foe;
        const known = (b.played[id] || won) && b.seen[feat];
        tiles += `<button class="bt-level ${open ? '' : 'locked'} ${won ? 'won' : ''} ${lv.boss ? 'boss' : ''}" data-n="${n}">
          ${stillImg(feat, 96, !known, 'bt-level-art')}
          <span class="bt-level-n">${n}</span>
          ${lv.boss ? '<span class="bt-level-boss">BOSS</span>' : ''}
          ${lv.rule ? `<span class="bt-level-rule" title="${D.RULES[lv.rule.kind].name}">${RULE_ICON[lv.rule.kind]}</span>` : ''}
          ${PATTERN_ICON[lv.pattern] ? `<span class="bt-level-pat" title="${D.PATTERNS[lv.pattern].name}">${PATTERN_ICON[lv.pattern]}</span>` : ''}
          ${won ? `<span class="bt-level-done ${b.stars[id] ? 'star' : ''}"><i>✓</i>${b.stars[id] ? '<em>★</em>' : ''}</span>` : ''}
          ${open ? '' : '<span class="bt-level-lock">🔒</span>'}
        </button>`;
      }
      sh.body.innerHTML = `
        <div class="bt-chest ${b.chests[w.id] ? 'done' : ''}"><svg class="bt-chest-icon" viewBox="0 0 48 42"><path d="M4 18 Q4 4 24 4 Q44 4 44 18 Z" fill="#b8762a" stroke="#4a2a0a" stroke-width="2"/><rect x="4" y="18" width="40" height="20" rx="2" fill="#8a5420" stroke="#4a2a0a" stroke-width="2"/><rect x="4" y="16" width="40" height="5" fill="#ffd43b" stroke="#8a5a00" stroke-width="1.5"/><rect x="11" y="4.5" width="5" height="33" fill="#ffd43b" opacity="0.9"/><rect x="32" y="4.5" width="5" height="33" fill="#ffd43b" opacity="0.9"/><rect x="19" y="17" width="10" height="11" rx="2" fill="#ffe680" stroke="#8a5a00" stroke-width="1.5"/><circle cx="24" cy="21.5" r="1.8" fill="#3a2400"/><path d="M14 4 Q24 -3 34 4" fill="none" stroke="#fff6c8" stroke-width="1.5" opacity="0.6"/></svg><div><b>World chest</b><span>${w.chest.comet ? `Earn every star in this world for ${BEAST_TEMPLATES[w.chest.comet].name}, a Tier 20 Cosmic comet beast.` : `Earn every star in this world for a ${RARITIES[w.chest.rarity].name} or better, Tier ${w.chest.tier} or higher.`}</span></div><em>${chest}</em></div>
        <div class="bt-levels">${tiles}</div>`;
      fillStills(sh.body);
      sh.body.querySelectorAll('.bt-level').forEach((btn) => btn.addEventListener('click', () => {
        const n = Number(btn.dataset.n);
        if (!levelOpen(w, n)) { showWarning('Level locked', `Win level ${n - 1} first.`); return; }
        click();
        openLevel(w, n, draw);
      }));
    };
    draw();
  }

  // ------------------------------------------------------------------ a level: foes, rule, deck
  /** A rough strength, for the Best six button. */
  const powerOf = (id) => { const s = D.beastStats(id, prestigeOf(id)); return s.atk * s.hp * (1 + 0.12 * (s.spd + s.rng)); };
  const allowedIn = (level, id) => !level || D.ruleAllows(level.rule, id, D.beastStats(id, prestigeOf(id)));
  const deckMax = (level) => (level && level.rule && level.rule.kind === 'three' ? 3 : 6);
  /** A level with a rule keeps its own six, so your usual six is not lost. */
  const limits = (level) => !!(level && level.rule && D.DECK_RULES.includes(level.rule.kind));
  const deckKey = (sys, level) => (limits(level) ? `${sys}|${level.rule.kind}|${level.rule.value}` : sys);
  function bestDeck(sys, level, fits = (id) => allowedIn(level, id), cap = null) {
    const statsOf = (id) => (cap && !D.LEGENDS[id] ? D.syncStats(id, cap) : D.beastStats(id, prestigeOf(id)));
    const pw = (id) => { const s = statsOf(id); return s.atk * s.hp * (1 + 0.12 * (s.spd + s.rng)); };
    const pool = owned(sys).filter(fits).sort((a, c) => pw(c) - pw(a));
    const max = deckMax(level);
    const body = (id) => (((D.T(id) || {}).svgParams || {}).body) || id;
    const picked = [];
    const take = (id) => { if (picked.length < max && !picked.includes(id) && picked.filter((x) => body(x) === body(id)).length < 2) picked.push(id); };
    if (max >= 6) {
      const top = pool.slice(0, 14);
      const tough = (id) => { const s = statsOf(id); return s.hp * Math.sqrt(s.atk); };
      for (const id of [...top].sort((a, c) => tough(c) - tough(a))) { if (picked.length >= 2) break; take(id); }
      for (const id of top.filter((x) => statsOf(x).rng >= 3)) { if (picked.length >= 4) break; take(id); }
    }
    for (const id of pool) take(id);
    for (const id of pool) if (picked.length < max && !picked.includes(id)) picked.push(id);
    const six = picked;
    // Evolved beasts first, into the ability slots.
    return [...six.filter(specialOwned), ...six.filter((id) => !specialOwned(id))];
  }
  /** The ability slots: the left three of the six (Sam, 19 Nov). */
  const ABILITY_SLOTS = 3;
  const hasSpecial = (id, i) => i < ABILITY_SLOTS && specialOwned(id);
  /**
   * Sync down (Sam, 19 Nov): when a level's rule leaves you fewer beasts than it allows, your
   * beasts can battle as the rule's own level (no higher than its tier, no rarer than it lets in),
   * so they all count. Only for rules a weaker version can meet: quick cards and plain stock.
   */
  function syncCap(level) {
    const r = level && level.rule;
    if (!r) return null;
    if (r.kind === 'quick') return { tier: r.value, rarity: 'RARE' };
    if (r.kind === 'rarity') return { tier: null, rarity: 'RARE' };
    return null;
  }
  function foesOf(level) {
    const ids = [...new Set([...level.spawns.map((s) => s.foe), ...(level.rally || []), ...(level.garrison || []).map((s) => s.foe)])];
    return ids.sort((a, c) => (D.ENEMIES[a].role === 'boss') - (D.ENEMIES[c].role === 'boss') || D.ENEMIES[a].debut - D.ENEMIES[c].debut);
  }
  const SORTS = [['tier', 'Tier'], ['rarity', 'Rarity'], ['atk', 'ATK'], ['hp', 'HP'], ['spd', 'SPD'], ['rng', 'RNG']];
  function sortValue(id, key) {
    const t = D.T(id);
    if (key === 'tier') return t.tier * 10 + RANK.indexOf(t.rarity);
    if (key === 'rarity') return RANK.indexOf(t.rarity) * 100 + t.tier;
    return D.beastStats(id, prestigeOf(id))[key] * 1000 + t.tier;
  }
  function openLevel(w, n, onChange) {
    const level = D.level(w.id, n);
    const sys = w.system;
    const b = B();
    const key = deckKey(sys, level);
    const max = deckMax(level);
    const mine = owned(sys);
    const cap = syncCap(level);
    if (!b.sync) b.sync = {};
    const synced = () => !!(cap && b.sync[level.id]);
    // Allowed here: by the rule, or by anything once synced down.
    const ok = (id) => allowedIn(level, id) || (synced() && !D.LEGENDS[id]);
    let deck = (b.decks[key] || (limits(level) ? [] : b.decks[sys]) || []).map(baseOf).filter((id, i, a) => a.indexOf(id) === i && mine.includes(id) && ok(id)).slice(0, max);
    if (!deck.length) deck = bestDeck(sys, level, ok, synced() ? cap : null);
    if (!b.pickSort) b.pickSort = { key: 'tier', dir: -1, rarity: 'all' };
    const sort = b.pickSort;
    const known = !!b.played[level.id] || cleared(level.id);
    const sh = sheet(level.boss ? `${n}. ${known ? level.name : 'Boss level'}` : `${w.name} ${n}`, level.boss ? (known ? 'Boss level' : 'Who is it? Play to find out') : D.PATTERNS[level.pattern].name);
    if (sys === 'low_gravity') sh.el.classList.add('lg');
    if (w.id === 7) sh.el.classList.add('mutants');
    let io = null;
    const draw = () => {
      const played = !!b.played[level.id] || cleared(level.id);
      const foes = foesOf(level).map((id) => {
        const known = played && !!b.seen[id];
        const e = D.ENEMIES[id];
        const tr = known && D.traitOf(id) ? D.TRAITS[D.traitOf(id)] : null;
        return `<div class="bt-foe ${known ? '' : 'unseen'} ${e.role === 'boss' || e.role === 'mutant' ? 'boss' : ''}" data-id="${id}">${stillImg(id, 112, !known)}${tr ? `<i class="bt-foe-trait" title="${tr.name}">${tr.icon}</i>` : ''}<span>${known ? e.name : '???'}</span></div>`;
      }).join('');
      const slots = [0, 1, 2, 3, 4, 5].map((i) => {
        if (i >= max) return '<div class="bt-slot barred"><span>✕</span></div>';
        const id = deck[i];
        const abil = i < ABILITY_SLOTS ? ' ability' : '';
        if (!id) return `<div class="bt-slot empty${abil}" data-slot="${i}"><span>+</span></div>`;
        const t = D.T(id);
        const sp = hasSpecial(id, i);
        return `<button class="bt-slot${abil} ${t.legend ? 'legend' : ''} ${sp ? 'evo' : ''}" data-id="${id}" data-slot="${i}" style="--rc:${rarityColour(id)}"><img data-pic="${id}" ${evolvedOwned(id) ? 'data-evo="1"' : ''} alt=""><b>T${synced() && cap.tier ? Math.min(t.tier, cap.tier) : t.tier}</b>${sp ? `<em>${D.ABILITIES[D.abilityOf(id)].icon}</em>` : ''}${prestigeOf(id) && !synced() ? `<i>P${prestigeOf(id)}</i>` : ''}</button>`;
      }).join('');
      let pool = mine.filter((id) => sort.rarity === 'all' || D.T(id).rarity === sort.rarity);
      pool.sort((a, c) => (sortValue(a, sort.key) - sortValue(c, sort.key)) * sort.dir);
      pool = [...pool.filter((id) => ok(id)), ...pool.filter((id) => !ok(id))];
      const list = pool.map((id) => {
        const t = D.T(id);
        const sy = synced() && !D.LEGENDS[id];
        const s = sy ? D.syncStats(id, cap) : D.beastStats(id, prestigeOf(id));
        const tierNow = sy && cap.tier ? Math.min(t.tier, cap.tier) : t.tier;
        const inDeck = deck.includes(id);
        const allowed = ok(id);
        const ab = specialOwned(id) ? D.ABILITIES[D.abilityOf(id)] : null;
        return `<button class="bt-pick ${inDeck ? 'in' : ''} ${allowed ? '' : 'barred'} ${t.legend ? 'legend' : ''}" data-id="${id}">
          <img data-pic="${id}" alt="">
          <div class="bt-pick-body"><div class="bt-pick-name">${t.name}${prestigeOf(id) ? ` <i class="bt-prest">Prestige ${prestigeOf(id)}</i>` : ''}${t.legend ? ' <i class="bt-prest legend">Legend</i>' : ''}</div>
          <div class="bt-pick-meta"><span style="color:${rarityColour(id)}">Tier ${t.tier} ${RARITIES[t.rarity].name}</span>${sy ? ` <b class="bt-synced">⇩ T${tierNow}</b>` : ''} · 💧${sy ? D.costOfTier(tierNow) : D.costOf(id)} · ${sy ? tierNow : D.cooldownOf(id)}s${allowed ? '' : ' · <b class="bt-no">not allowed here</b>'}</div>
          <div class="bt-stats">${statChips(s)}${kindChip(sy ? (34 + 20 * Math.max(0, s.rng - 1) >= 74 ? 'ranged' : D.attackKind(id, prestigeOf(id)) === 'area' ? 'area' : 'single') : D.attackKind(id, prestigeOf(id)))}</div>
          ${ab ? `<span class="bt-evo-chip">✦ Evolved: ${ab.icon} ${ab.name} <small>in a left slot</small></span>` : ''}</div>
          <div class="bt-pick-tick">${allowed ? (inDeck ? '✓' : '+') : '✕'}</div>
        </button>`;
      }).join('');
      const best = b.best[level.id];
      const pat = D.PATTERNS[level.pattern];
      const theme = level.theme ? D.THEMES[level.theme] : null;
      const rule = level.rule ? `<div class="bt-rule"><span class="bt-rule-icon">${RULE_ICON[level.rule.kind]}</span><div><b>${D.RULES[level.rule.kind].name}</b><span>${D.RULES[level.rule.kind].short(level.rule.value)}</span></div></div>` : '';
      sh.body.innerHTML = `
        <div class="bt-card">
          <div class="bt-card-row"><div><b>Enemies</b></div><div class="bt-goal"><span class="bt-gold">★</span> win in under ${fmt(level.starTime)}${best ? `<br><span class="bt-dim">best ${fmt(best)}${b.stars[level.id] ? ' ★' : ''}</span>` : ''}</div></div>
          <div class="bt-foes">${foes}</div>
          ${w.id === 7 ? mutantCard(level, played) : ''}
          <div class="bt-tags"><span class="bt-tag" data-tip="${pat.tip}">${pat.name} ⓘ</span>${theme ? `<span class="bt-tag" data-tip="${theme.tip}">${theme.name} ⓘ</span>` : ''}</div>
          ${cleared(level.id) ? '' : `<div class="bt-dim bt-reward">First win: essence${level.boss ? ' and a premium crate' : ''}</div>`}
        </div>
        ${rule}
        <div class="bt-card">
          <div class="bt-card-row"><div><b>Your ${max === 6 ? 'six' : 'three'}</b></div><button class="bt-btn small" id="bt-auto">Best ${max === 6 ? 'six' : 'three'}</button></div>
          <div class="bt-slot-key"><span>✦ special slots</span><span>drag to swap</span></div>
          <div class="bt-slots">${slots}</div>
          ${cap && (synced() || mine.filter((id) => allowedIn(level, id)).length < max) ? `<button class="bt-sync ${synced() ? 'on' : ''}" id="bt-sync">${synced() ? '✓ Synced down' : '⇩ Sync down'}<small>${synced() ? 'Your beasts battle as ' + (cap.tier ? 'Tier ' + cap.tier + ' at most.' : 'Commons and Rares.') : 'Too few of yours meet the rule. Synced, they battle as ' + (cap.tier ? 'Tier ' + cap.tier : 'Rare') + ' versions.'}</small></button>` : ''}
        </div>
        <div class="bt-card bt-perk-card">
          <div class="bt-card-row"><b>Perk</b></div>
          <div class="bt-perks">${D.PERKS.map((p) => { const open = p.unlock(totals()); const L = PERK_LOOK[p.id]; return `<button class="bt-perk ${b.perk === p.id && open ? 'on' : ''} ${open ? '' : 'locked'}" data-perk="${p.id}"><span class="bt-perk-icon">${perkIcon(p.id)}${open ? '' : '<i class="bt-perk-lock">🔒</i>'}</span><b>${p.name}</b><span>${open ? L.short : p.how}</span></button>`; }).join('')}</div>
        </div>
        <div class="bt-sortbar">
          <div class="bt-sorts">${SORTS.map(([k, name]) => `<button class="bt-sort ${sort.key === k ? 'on' : ''}" data-k="${k}">${name}</button>`).join('')}<button class="bt-sort dir" data-dir="1">${sort.dir < 0 ? '↓ High' : '↑ Low'}</button></div>
          <select class="bt-rarity-filter" aria-label="Rarity">${['all', ...RANK].map((r) => `<option value="${r}" ${sort.rarity === r ? 'selected' : ''}>${r === 'all' ? 'All rarities' : RARITIES[r].name}</option>`).join('')}</select>
        </div>
        <div class="bt-picks">${list || '<div class="bt-dim">No beasts match.</div>'}</div>
        <div class="bt-go-bar"><button class="bt-go" ${deck.length ? '' : 'disabled'}>Battle!</button></div>`;
      // Pictures only for what is on screen (or nearly): the list can hold a hundred beasts.
      if (io) io.disconnect();
      io = typeof IntersectionObserver === 'function' ? new IntersectionObserver((ents) => { for (const en of ents) if (en.isIntersecting) { io.unobserve(en.target); fillPic(en.target, 128); } }, { rootMargin: '300px 0px' }) : null;
      sh.body.querySelectorAll('img[data-pic]').forEach((img) => { if (io && img.closest('.bt-picks')) io.observe(img); else fillPic(img, 128); });
      fillStills(sh.body);
      sh.body.querySelectorAll('.bt-foe').forEach((f) => f.addEventListener('click', () => { if (played && b.seen[f.dataset.id]) { click(); openFoe(f.dataset.id); } }));
      const toggle = (id) => {
        if (!ok(id)) { showWarning('Not allowed here', ruleText(level.rule)); return; }
        if (deck.includes(id)) deck = deck.filter((x) => x !== id);
        else if (deck.length < max) deck.push(id);
        else { showWarning(`${max === 6 ? 'Six' : 'Three'} at most`, 'Take a beast out first.'); return; }
        b.decks[key] = deck.slice();
        click();
        draw();
      };
      sh.body.querySelectorAll('.bt-tag[data-tip]').forEach((tg) => tg.addEventListener('click', () => { click(); showWarning(tg.textContent.replace(' ⓘ', ''), tg.dataset.tip + '.'); }));
      sh.body.querySelectorAll('.bt-pick').forEach((p) => p.addEventListener('click', () => toggle(p.dataset.id)));
      // Slots: a tap takes the beast out; a drag onto another slot swaps the two (Sam, 19 Nov),
      // so you choose which three have their specials.
      sh.body.querySelectorAll('.bt-slot[data-id]').forEach((slot) => {
        let down = null;
        slot.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, moved: false }; try { slot.setPointerCapture(e.pointerId); } catch (err) { /* not ours */ } });
        slot.addEventListener('pointermove', (e) => {
          if (!down) return;
          const dx = e.clientX - down.x, dy = e.clientY - down.y;
          if (!down.moved && Math.hypot(dx, dy) < 8) return;
          down.moved = true;
          slot.classList.add('dragging');
          slot.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
        });
        const end = (e) => {
          if (!down) return;
          const moved = down.moved;
          down = null;
          slot.classList.remove('dragging');
          slot.style.transform = '';
          if (!moved) { toggle(slot.dataset.id); return; }
          slot.style.visibility = 'hidden';
          const under = document.elementFromPoint(e.clientX, e.clientY);
          slot.style.visibility = '';
          const to = under && under.closest('.bt-slot[data-slot]');
          const a = Number(slot.dataset.slot), c = to ? Number(to.dataset.slot) : -1;
          if (c < 0 || c === a || c >= max) return;
          const next = deck.slice();
          const moving = next[a];
          if (c >= next.length) { next.splice(a, 1); next.push(moving); }
          else { next[a] = next[c]; next[c] = moving; }
          deck = next.filter(Boolean);
          b.decks[key] = deck.slice();
          click();
          draw();
        };
        slot.addEventListener('pointerup', end);
        slot.addEventListener('pointercancel', () => { down = null; slot.classList.remove('dragging'); slot.style.transform = ''; });
      });
      const syncBtn = sh.body.querySelector('#bt-sync');
      if (syncBtn) syncBtn.addEventListener('click', () => {
        b.sync[level.id] = !b.sync[level.id];
        if (!b.sync[level.id]) deck = deck.filter((id) => allowedIn(level, id));
        else if (deck.length < max) deck = bestDeck(sys, level, ok, cap);
        b.decks[key] = deck.slice();
        click();
        draw();
      });
      sh.body.querySelector('#bt-auto').addEventListener('click', () => { deck = bestDeck(sys, level, ok, synced() ? cap : null); b.decks[key] = deck.slice(); click(); draw(); });
      sh.body.querySelectorAll('.bt-sort').forEach((btn) => btn.addEventListener('click', () => {
        click();
        if (btn.dataset.dir) sort.dir = -sort.dir; else sort.key = btn.dataset.k;
        draw();
      }));
      sh.body.querySelector('.bt-rarity-filter').addEventListener('change', (e) => { sort.rarity = e.target.value; draw(); });
      sh.body.querySelectorAll('.bt-perk').forEach((btn) => btn.addEventListener('click', () => {
        const p = D.PERKS.find((x) => x.id === btn.dataset.perk);
        if (!p.unlock(totals())) { showWarning(`${p.name} is locked`, `${p.how} to earn it.`); return; }
        b.perk = b.perk === p.id ? null : p.id;
        click();
        draw();
      }));
      sh.body.querySelector('.bt-go').addEventListener('click', () => {
        if (!deck.length) return;
        click();
        saveGame();
        const go = () => start(level, deck, () => { draw(); if (onChange) onChange(); renderTab(); }, synced() ? cap : null);
        if (!b.howSeen) openHow(go); else go();
      });
    };
    draw();
  }

  // ================================================================== the battle
  let run = null;

  function start(level, deck, onDone, sync = null) {
    if (run) return;
    const cards = deck.map(baseOf).map((id, i) => ({ id, prestige: sync ? 0 : prestigeOf(id), evolved: hasSpecial(id, i), sync }));
    const perk = D.PERKS.find((p) => p.id === B().perk && p.unlock(totals()));
    const battle = new BE.Battle(level, cards, perk ? { ...perk.opts, perk: perk.id } : {});
    // Played once (won, lost or left), a level shows who is in it.
    B().played[level.id] = true;
    const rule = level.rule ? ` · ${D.RULES[level.rule.kind].name}` : '';
    const screen = el(`<div id="battle-screen" class="${D.WORLDS[level.world - 1].system === 'low_gravity' ? 'lg' : level.world === 7 ? 'mutants' : ''}">
      <canvas id="bt-canvas"></canvas>
      <div class="bt-hud">
        <button class="bt-hud-btn" id="bt-pause" aria-label="Pause">❚❚</button>
        <div class="bt-hud-title"><b>${level.boss ? level.name : `${D.WORLDS[level.world - 1].name} ${level.n}`}${perk ? ` · ${perk.name}` : ''}${rule}</b><span id="bt-clock">0:00</span></div>
        <button class="bt-hud-btn" id="bt-view" aria-label="Zoom">⤢</button>
        <button class="bt-hud-btn" id="bt-speed">1×</button>
      </div>
      <div class="bt-bossbars" id="bt-bossbars"></div>
      <div class="bt-tip" id="bt-tip">Tap your blue zone, then a card.</div>
      <div class="bt-deck">
        <div class="bt-deck-info"><span id="bt-count">0/10 on the field</span><span id="bt-star"></span></div>
        <div class="bt-mana"><div class="bt-mana-fill" id="bt-mana-fill"></div><span id="bt-mana-n">💧 0</span></div>
        <div class="bt-cards">${battle.cards.map((c, i) => `<div class="bt-cardcell ${c.evolved ? 'evo' : ''}"><button class="bt-cardbtn" data-i="${i}" style="--rc:${rarityColour(c.id)}"><img alt=""><b>T${c.sync && c.sync.tier ? Math.min(D.T(c.id).tier, c.sync.tier) : D.T(c.id).tier}</b><i class="bt-cost">${c.cost}</i><i class="bt-kind">${KIND[D.attackKind(c.id, c.prestige)][0]}</i>${c.evolved ? `<span class="bt-special" title="${D.ABILITIES[c.ability].name}">✦ ${D.ABILITIES[c.ability].icon}</span>` : ''}<div class="bt-cd"></div><span class="bt-cd-n"></span></button><div class="bt-cs">${miniStats(c.stats)}</div></div>`).join('')}</div>
      </div>
    </div>`);
    document.body.appendChild(screen);
    document.body.classList.add('bt-in-battle');
    const canvas = screen.querySelector('#bt-canvas');
    run = {
      level, battle, screen, canvas, ctx: canvas.getContext('2d'), onDone,
      sprites: {}, whites: {}, cam: { zoom: 1, x: W / 2, y: H / 2 }, fit: 1, max: 2,
      marker: 0.3, markY: 1720, speed: 1, paused: false, over: false, last: performance.now(), acc: 0,
      fx: [], shots: [], shake: 0, flash: 0, bg: null, dpr: Math.min(2, window.devicePixelRatio || 1),
      cardEls: [...screen.querySelectorAll('.bt-cardbtn')], walk: new Map(), coinsAt: 0, tipUntil: B().tipSeen ? 0 : performance.now() + 9000,
      toastUntil: 0, alarmAt: 0, ended: false,
      // Three, two, one, then the battle starts.
      countdown: 3, goT: 0, banner: null, markPulse: 0,
    };
    resize();
    run.bg = paintArena(level);
    // An evolved beast looks evolved in either kind of slot (only the left three have the special).
    cards.forEach((c, i) => beastPic(c.id, 128, evolvedOwned(c.id)).then((u) => { run && (run.cardEls[i].querySelector('img').src = u); }));
    Promise.all(cards.map((c) => beastPic(c.id, 256, evolvedOwned(c.id)).then((u) => loadSprite(evolvedOwned(c.id) ? c.id + '*' : c.id, u)))).then(() => { if (run) { run.ready = true; sfx('count'); } });
    bindBattleInput();
    if (typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.music(level.boss, level.n, D.WORLDS[level.world - 1].system, level.world);
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  }

  function loadSprite(id, url) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        run.sprites[id] = img;
        // A white copy for the flash when it is hit.
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        g.globalCompositeOperation = 'source-in';
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, c.width, c.height);
        run.whites[id] = c;
        res();
      };
      img.onerror = () => res();
      img.src = url;
    });
  }

  /** Camera: arena units to screen (CSS) pixels. */
  function resize() {
    if (!run) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    run.vw = vw; run.vh = vh;
    run.canvas.width = Math.round(vw * run.dpr);
    run.canvas.height = Math.round(vh * run.dpr);
    run.canvas.style.width = vw + 'px';
    run.canvas.style.height = vh + 'px';
    // Between the bars (measured: they include the phone's notch and home bar).
    const hudEl = run.screen.querySelector('.bt-hud'), deckEl = run.screen.querySelector('.bt-deck');
    run.top = hudEl ? hudEl.getBoundingClientRect().bottom : 58;
    run.bottom = deckEl ? vh - deckEl.getBoundingClientRect().top : 128;
    const avail = vh - run.top - run.bottom;
    run.fit = Math.min(vw / W, avail / H) * 0.98;
    // As big as the meadow's world at most (its width spread over the arena), and no less than twice the fit.
    const worldW = (typeof WORLD !== 'undefined' && WORLD.worldSize) ? WORLD.worldSize().w : vw * 1.8;
    run.max = Math.max(run.fit * 2.4, (worldW / W) * 1.15);
    // The battle opens on the whole field (Sam, 18 Nov: it opened too far in; reviewer 2: their pile
    // was under the top bar). The ⤢ button goes in close on your half and back out.
    run.start = run.fit;
    run.close = Math.min(run.max, Math.max(run.fit * 1.9, (vw / W) * 1.3));
    if (!run.cam.set) run.cam = { zoom: run.start, x: W / 2, y: H / 2, set: true };
    clampCam();
  }
  function clampCam() {
    const c = run.cam;
    c.zoom = Math.max(run.fit, Math.min(run.max, c.zoom));
    const halfW = run.vw / 2 / c.zoom, halfH = (run.vh - run.top - run.bottom) / 2 / c.zoom;
    c.x = halfW * 2 >= W ? W / 2 : Math.max(halfW, Math.min(W - halfW, c.x));
    c.y = halfH * 2 >= H ? H / 2 : Math.max(halfH - 80, Math.min(H - halfH + 30, c.y));
  }
  const sx = (x) => (x - run.cam.x) * run.cam.zoom + run.vw / 2;
  const sy = (y) => (y - run.cam.y) * run.cam.zoom + run.top + (run.vh - run.top - run.bottom) / 2;
  const ax = (px) => (px - run.vw / 2) / run.cam.zoom + run.cam.x;
  const ay = (py) => (py - run.top - (run.vh - run.top - run.bottom) / 2) / run.cam.zoom + run.cam.y;
  /** Your zone: beasts can be placed anywhere below this line. Taps a little above it still count. */
  const SAFE_Y = BE.ZONE_Y;
  const inZone = (y) => y > SAFE_Y - 120;

  // ------------------------------------------------------------------ input
  function setMarker(x, y) {
    run.marker = Math.max(0.02, Math.min(0.98, x / W));
    run.markY = Math.max(SAFE_Y + 20, Math.min(H - 30, y));
    run.markPulse = 1;
  }
  function bindBattleInput() {
    const sc = run.screen, cv = run.canvas;
    sc.querySelector('#bt-pause').addEventListener('click', () => { click(); pause(true); });
    sc.querySelector('#bt-speed').addEventListener('click', (e) => { click(); run.speed = run.speed === 1 ? 2 : 1; e.currentTarget.textContent = `${run.speed}×`; e.currentTarget.classList.toggle('fast', run.speed > 1); });
    // In close on your half, or out to the whole field.
    sc.querySelector('#bt-view').addEventListener('click', () => {
      click();
      const zoomedIn = run.cam.zoom > run.fit * 1.05;
      run.cam.zoom = zoomedIn ? run.fit : run.close;
      run.cam.x = run.marker * W;
      run.cam.y = zoomedIn ? H / 2 : H;
      clampCam();
    });
    // Cards: a tap plays at the marker; a drag plays where it is let go (in your zone).
    run.cardEls.forEach((btn) => {
      let down = null;
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); down = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false }; try { btn.setPointerCapture(e.pointerId); } catch (err) { /* a pointer the page did not see start */ } });
      btn.addEventListener('pointermove', (e) => {
        if (!down || e.pointerId !== down.id) return;
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 14) down.moved = true;
        if (down.moved) { run.drag = { i: Number(btn.dataset.i), x: e.clientX, y: e.clientY }; }
      });
      const up = (e) => {
        if (!down || e.pointerId !== down.id) return;
        const i = Number(btn.dataset.i);
        if (down.moved && run.drag) {
          const x = ax(e.clientX), y = ay(e.clientY);
          if (inZone(y) && x > 0 && x < W && e.clientY < run.vh - run.bottom) { setMarker(x, y); play(i); }
          else if (e.clientY < run.vh - run.bottom) toast('Drop it in your blue zone');
        } else play(i);
        run.drag = null;
        down = null;
      };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', () => { run.drag = null; down = null; });
    });
    // The arena: tap your zone to choose where beasts come out; drag to look around; pinch or wheel to zoom.
    const ptrs = new Map();
    let pinch = null, tapAt = null;
    cv.addEventListener('pointerdown', (e) => {
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* as above */ }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) tapAt = { x: e.clientX, y: e.clientY, t: performance.now() };
      if (ptrs.size === 2) { const [a, c] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - c.x, a.y - c.y), zoom: run.cam.zoom, mx: (a.x + c.x) / 2, my: (a.y + c.y) / 2 }; tapAt = null; }
    });
    cv.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 2 && pinch) {
        const [a, c] = [...ptrs.values()];
        const d = Math.hypot(a.x - c.x, a.y - c.y);
        zoomAt(pinch.mx, pinch.my, (pinch.zoom * d) / pinch.d);
      } else if (ptrs.size === 1) {
        if (tapAt && Math.hypot(e.clientX - tapAt.x, e.clientY - tapAt.y) > 10) tapAt = null;
        if (!tapAt) { run.cam.x -= dx / run.cam.zoom; run.cam.y -= dy / run.cam.zoom; clampCam(); }
      }
    });
    const end = (e) => {
      if (tapAt && ptrs.size === 1 && performance.now() - tapAt.t < 400) {
        const x = ax(e.clientX), y = ay(e.clientY);
        // One of your evolved beasts tapped on the field: its special, there (Sam, 18 Nov).
        const hero = specialAt(x, y);
        if (hero) run.battle.special(hero.card, hero);
        else if (inZone(y) && x > 10 && x < W - 10) { setMarker(x, y); sfx('tap'); }
        else if (y > 0 && x > 10 && x < W - 10) { run.marker = Math.max(0.02, Math.min(0.98, x / W)); run.markPulse = 1; run.laneT = 1.2; sfx('tap'); }
      }
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      tapAt = null;
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, run.cam.zoom * (e.deltaY < 0 ? 1.12 : 0.89)); }, { passive: false });
  }
  /** Your evolved beast at a tapped point (arena units) whose special is ready, if any. */
  function specialAt(x, y) {
    const b = run.battle;
    let best = null, bd = Infinity;
    for (const u of b.units) {
      if (u.side !== 'you' || !u.evolved || u.state === 'dying' || !b.canSpecial(u.card)) continue;
      const d = Math.hypot(u.x - x, u.y - u.r - y);
      if (d < u.r * 1.5 + 26 / run.cam.zoom && d < bd) { bd = d; best = u; }
    }
    return best;
  }
  function zoomAt(px, py, z) {
    const bx = ax(px), by = ay(py);
    run.cam.zoom = Math.max(run.fit, Math.min(run.max, z));
    run.cam.x = bx - (px - run.vw / 2) / run.cam.zoom;
    run.cam.y = by - (py - run.top - (run.vh - run.top - run.bottom) / 2) / run.cam.zoom;
    clampCam();
  }

  function play(i) {
    if (!run || run.paused || run.over || !run.ready) return;
    if (run.countdown > 0) { toast('Get ready…'); return; }
    const b = run.battle;
    const c = b.cards[i];
    if (!b.canDeploy(i)) {
      if (b.result) return;
      if (b.yours.length >= b.cap) toast(`${b.cap} on the field at most`);
      else if (b.time < c.ready) toast(`${D.T(c.id).name} is still recharging`);
      else toast(`Needs ${c.cost} mana`);
      sfx('nope');
      return;
    }
    b.deploy(i, run.marker, run.markY);
    if (run.tipUntil) { run.tipUntil = 0; B().tipSeen = true; }
  }
  function toast(text) {
    if (!run) return;
    const t = run.screen.querySelector('#bt-tip');
    t.textContent = text;
    t.classList.add('low');
    t.style.bottom = `${Math.round(run.bottom + 10)}px`;
    run.toastUntil = performance.now() + 1700;
    run.tipUntil = 0;
  }

  // ------------------------------------------------------------------ the loop
  function frame(now) {
    if (!run) return;
    const dt = Math.min(0.1, (now - run.last) / 1000);
    run.last = now;
    if (!run.paused && run.ready) {
      if (run.countdown > 0) {
        const before = Math.ceil(run.countdown);
        run.countdown -= dt;
        const after = Math.ceil(Math.max(0, run.countdown));
        if (after !== before) { sfx(after > 0 ? 'count' : 'go'); if (after <= 0) run.goT = 0.9; }
      } else {
        run.acc += dt * run.speed;
        const STEP = 1 / 30;
        while (run.acc >= STEP) {
          run.battle.step(STEP);
          run.acc -= STEP;
          for (const u of run.battle.units) if (u.state === 'walk') run.walk.set(u.uid, (run.walk.get(u.uid) || 0) + (u.speed * STEP) / (u.side === 'you' ? 60 : 50));
          events(run.battle.drain());
        }
      }
      tickFx(dt * run.speed, dt);
    }
    draw(now / 1000, dt);
    hud();
    if (run.battle.result && !run.ended) { run.ended = true; if (typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.endMusic(run.battle.result === 'won'); setTimeout(finish, 1700); }
    requestAnimationFrame(frame);
  }

  /** Whether a unit's blows are drawn as shots (battle_engine.js: Range 3 and up, or a shooter). */
  const shoots = (u) => u.reach >= BE.SHOT_REACH || !!u.shooter;
  function colourOf(u) {
    if (u.side === 'you') return (ELEMENTS[(D.T(u.kind) || {}).element] || { color: '#ffd43b' }).color;
    const e = D.ENEMIES[u.kind];
    return e.look.shadow ? e.look.trim : e.look.eye === '#2a1a10' ? e.look.trim : e.look.eye;
  }

  /**
   * What a ranged unit shoots: a beast by its element (a fireball, a bubble, a gust, a rock, a beam
   * of light, a void orb, a spinning star, a holy orb), an enemy by its weapon (arrows, bolts,
   * bullets, a laser, a cannonball, a stone, a thrown potion, notes, or magic).
   */
  function shotStyle(u) {
    if (u.side === 'you') return { FIRE: 'fireball', WATER: 'bubble', WIND: 'gust', EARTH: 'rock', LIGHT: 'beam', VOID: 'void', COSMIC: 'star', DEITY: 'holy' }[(D.T(u.kind) || {}).element] || 'magic';
    const wpn = D.ENEMIES[u.kind].look.weapon || 'none';
    return { bow: 'arrow', longbow: 'arrow', crossbow: 'bolt', rifle: 'bullet', long_rifle: 'bullet', raygun: 'laser', cannon: 'cannonball', sling: 'stone', potion: 'potion', flute: 'note', lute: 'note', drum: 'note' }[wpn] || 'magic';
  }
  /** The burst at a beast's mouth as its shot leaves: colour, particle, how many, how fast. */
  const LAUNCH = {
    fireball: ['#ff8a3a', 'spark', 9, 150], bubble: ['#bfe8ff', 'spark', 7, 110], gust: ['#eaffff', 'smoke', 6, 130],
    rock: ['#a88a68', 'smoke', 7, 120], beam: ['#fff2b0', 'star', 7, 160], void: ['#b080ff', 'wisp', 7, 90],
    star: ['#ffe066', 'star', 8, 170], holy: ['#ffe8a0', 'star', 8, 140], magic: ['#d8b0ff', 'spark', 7, 130],
  };
  /** How fast a shot flies and how high it arcs (a fraction of the distance). */
  const SHOT = {
    arrow: { v: 2600, arc: 0.12 }, bolt: { v: 3000, arc: 0.06 }, bullet: { v: 5200, arc: 0 }, laser: { beam: 0.2 }, beam: { beam: 0.22 },
    cannonball: { v: 1500, arc: 0.3 }, stone: { v: 1700, arc: 0.28 }, potion: { v: 1400, arc: 0.35 }, note: { v: 1300, arc: 0.08, wobble: 1 },
    fireball: { v: 1900, arc: 0.1 }, bubble: { v: 1200, arc: 0.06, wobble: 1 }, gust: { v: 2200, arc: 0.02 }, rock: { v: 1600, arc: 0.26 },
    void: { v: 1600, arc: 0.05, wobble: 1 }, star: { v: 2000, arc: 0.1 }, holy: { v: 1800, arc: 0.06 }, magic: { v: 1800, arc: 0.1, wobble: 1 },
  };

  /** How a beast attacks up close, from how it moves and its best stat. */
  const beastStyles = new Map();
  /**
   * How a beast walks and fights (Sam, 18 Nov: "improved walking or running animation and unique
   * and varied attack animation depending on their stats or who they are ... same with beasts"),
   * from how it gets about, its best stat and a fixed pick of its own so two alike still differ.
   * Walkers: quick ones trot, tough ones waddle with a thud each step, strong ones stride. Hoppers
   * bound, fliers flap, floaters drift, swimmers undulate. Up close: sluggers slam down or chomp
   * twice, quick ones pounce or strike three times in a flurry, tough ones ram or stomp a ring
   * into the ground, fliers swoop, floaters swoop or twirl, swimmers roll. Ranged beasts with
   * Range as their best stat rise over a glowing ring to channel their shot; others spit and kick.
   */
  function beastStyle(id) {
    if (!beastStyles.has(id)) {
      const s = D.beastStats(id, 0);
      const mo = motionOf(id);
      const top = ['atk', 'hp', 'spd'].sort((a, c) => s[c] - s[a])[0];
      const own = D.hash(id + '|moves') % 2;
      let atk;
      if (mo === 'fly') atk = 'swoop';
      else if (mo === 'float') atk = own ? 'twirl' : 'swoop';
      else if (mo === 'swim') atk = 'roll';
      else if (mo === 'hop') atk = top === 'atk' ? 'slam' : 'pounce';
      else if (top === 'spd') atk = own ? 'flurry' : 'pounce';
      else if (top === 'hp') atk = own ? 'stomp' : 'ram';
      else atk = own ? 'chomp' : 'slam';
      const walk = mo === 'walk' ? (top === 'spd' ? 'trot' : top === 'hp' ? 'waddle' : 'stride') : mo;
      const ranged = s.rng >= Math.max(s.atk, s.hp, s.spd) ? 'channel' : 'spit';
      beastStyles.set(id, { atk, walk, ranged, pace: 1 + Math.min(0.6, (s.spd - 1) * 0.05) });
    }
    return beastStyles.get(id);
  }

  /** An evolved form's special: its name over it, and its own burst. */
  function specialFx(ev) {
    const u = ev.unit, a = ev.ability, A = D.ABILITIES[a];
    bigText(u.x, u.y - u.r * 2.4, `${A.icon} ${A.name}!`, '#ffe066', 1.6);
    sfx('sp_' + a);
    const R = { blast: 190, freeze: 210, gust: 230, quake: 210, heal: 240, gravity: 280, rally: 280 }[a];
    const col = { blast: '#ff7a2a', freeze: '#9ae8ff', gust: '#eaffff', quake: '#c8a070', heal: '#7af0a0', gravity: '#b080ff', rally: '#ff6a5a', starfall: '#ffe066', dash: '#ffffff', shield: '#9ad8ff', volley: '#ffe8a0', leap: '#d8c8a8' }[a];
    if (R) { ring(u.x, u.y, R, col); ring(u.x, u.y, R * 0.6, col); burst(u.x, u.y - u.r * 0.5, col, 26, 260, a === 'gravity' ? 'wisp' : a === 'gust' || a === 'quake' ? 'smoke' : 'spark'); }
    if (a === 'quake' || a === 'blast') run.shake = Math.max(run.shake, 10);
    if (a === 'heal' || a === 'rally') for (const o of ev.targets) burst(o.x, o.y - o.r, col, 6, 90, 'star');
    if (a === 'freeze') for (const o of ev.targets) burst(o.x, o.y - o.r, '#e8fbff', 6, 80, 'star');
    if (a === 'starfall' || a === 'volley') {
      const style = a === 'starfall' ? 'star' : shotStyle(u);
      const sp = SHOT[style] || SHOT.magic;
      for (const o of ev.targets) {
        const fx = a === 'starfall' ? o.x - 120 : u.x, fy = a === 'starfall' ? o.y - 700 : u.y - u.r;
        const d = Math.hypot(o.x - fx, o.y - fy);
        run.shots.push({ x: fx, y: fy, tx: o.x, ty: o.y - o.r * 0.7, t: 0, dur: sp.beam || 0.06 + d / (sp.v || 1800), arc: 0, wobble: 0, style, col, heavy: true, side: u.side, seed: Math.random() * 6 });
      }
    }
    if (a === 'leap' && ev.from) { burst(ev.from.x, ev.from.y, '#d8c8a8', 10, 120, 'smoke'); ring(u.x, u.y, 140, col); burst(u.x, u.y, '#d8c8a8', 16, 200, 'smoke'); }
    if (a === 'dash') burst(u.x, u.y, '#ffffff', 14, 160, 'smoke');
  }
  /** A big call-out over the field; one near another still showing goes above it. */
  function bigText(x, y, s, col, life = 1.6) {
    let yy = y;
    for (let k = 0; k < 4; k++) {
      if (!run.fx.some((p) => p.kind === 'text' && p.big && p.life > 0.3 && Math.abs(p.x - x) < 120 && Math.abs(p.y - yy) < 34)) break;
      yy -= 36;
    }
    run.fx.push({ kind: 'text', x, y: yy, s, col, life, max: life, big: true });
  }
  /** An enemy's ability as it happens: a leap's dust, coming up from underground, a heal, a summons. */
  function traitFx(ev) {
    const u = ev.unit, T = D.TRAITS[ev.kind === 'surface' ? 'burrow' : ev.kind];
    if (ev.kind === 'leap') { burst(ev.from.x, ev.from.y, '#c8b8a0', 10, 120, 'smoke'); ring(u.x, u.y, u.r * 2, '#ffd08a'); }
    if (ev.kind === 'surface') { burst(u.x, u.y, '#8a6a48', 18, 180, 'smoke'); ring(u.x, u.y, u.r * 2.2, '#a88a68'); run.shake = Math.max(run.shake, 4); }
    if (ev.kind === 'heal') { ring(u.x, u.y, 220, '#7af0a0'); for (const o of ev.targets) burst(o.x, o.y - o.r, '#7af0a0', 4, 70, 'star'); }
    if (ev.kind === 'summon') { ring(u.x, u.y, u.r * 2.6, '#c070ff'); burst(u.x, u.y, '#c070ff', 12, 140, 'wisp'); }
    if (ev.kind === 'cloak') burst(u.x, u.y - u.r, '#d8e0ff', 8, 90, 'wisp');
    if (T && ev.kind !== 'cloak') bigText(u.x, u.y - u.r * 2.6, `${T.icon} ${T.name}!`, '#ffb0b0', 1.2);
  }
  /** Over a unit: frozen (an icy sheen), stunned (stars going round), shielded (a bubble), roused by
   * a war cry (a red glow), dashing (streaks behind). */
  function statusFx(ctx, u, t, z) {
    const now = run.battle.time;
    const x = sx(u.x), y = sy(u.y), R = u.r * z;
    if (u.side === 'you' && u.evolved && run.battle.canSpecial(u.card)) {
      const k = (t * 1.4) % 1;
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = Math.max(2, 3.5 * z);
      ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.ellipse(x, y, R * 1.2, R * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(x, y, R * (1.2 + k), R * (0.42 + k * 0.35), 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.95; ctx.fillStyle = '#ffe680'; ctx.font = `800 ${Math.max(11, 18 * z)}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('✦', x + R * 1.1, y - R * 2.2 + Math.sin(t * 5) * 3);
      ctx.globalAlpha = 1;
    }
    if (u.stunUntil > now) {
      if (u.frozen) { ctx.globalAlpha = 0.45; ctx.drawImage(ENEMY_ART.glowSprite('#bfefff'), x - R * 1.6, y - R * 3, R * 3.2, R * 3.2); ctx.globalAlpha = 1; }
      else for (let i = 0; i < 3; i++) { const a = t * 6 + (i * Math.PI * 2) / 3; ctx.fillStyle = '#ffe066'; ctx.font = `${Math.max(9, 14 * z)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('★', x + Math.cos(a) * R * 0.9, y - R * 2.6 + Math.sin(a) * R * 0.3); }
    }
    if (u.shieldUntil > now) { ctx.globalAlpha = 0.28 + 0.08 * Math.sin(t * 6); ctx.fillStyle = '#9ad8ff'; ctx.beginPath(); ctx.ellipse(x, y - R * 1.2, R * 1.5, R * 1.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 0.8; ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = Math.max(1.5, 2.5 * z); ctx.stroke(); ctx.globalAlpha = 1; }
    if (u.buffUntil > now) { ctx.globalAlpha = 0.35; ctx.drawImage(ENEMY_ART.glowSprite('#ff6a5a'), x - R * 1.5, y - R * 2.6, R * 3, R * 3); ctx.globalAlpha = 1; }
    if (u.slowUntil > now) { ctx.globalAlpha = 0.6; ctx.drawImage(ENEMY_ART.glowSprite('#7ab8ff'), x - R * 1.3, y - R * 2.4, R * 2.6, R * 2.6); ctx.globalAlpha = 0.95; ctx.fillStyle = '#bfe8ff'; ctx.font = `800 ${Math.max(10, 15 * z)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('❄', x - R * 0.9, y - R * 2.3); ctx.globalAlpha = 1; }
    if (u.trait === 'aura') { ctx.globalAlpha = 0.22 + 0.08 * Math.sin(t * 3); ctx.strokeStyle = '#8ad8ff'; ctx.lineWidth = Math.max(1, 2 * z); ctx.beginPath(); ctx.ellipse(x, y, 180 * z, 180 * z * 0.35, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    // World 7: burning (flames licking up) and poisoned (green bubbles).
    if (u.burnUntil > now) { for (let i = 0; i < 3; i++) { const fx = x + (i - 1) * R * 0.5, k = (t * 3 + i * 0.37) % 1; ctx.globalAlpha = 0.85 * (1 - k); ctx.fillStyle = i % 2 ? '#ffb43a' : '#ff6a1a'; ctx.beginPath(); ctx.ellipse(fx, y - R * (0.6 + k * 1.4), R * 0.16 * (1 - k * 0.5), R * 0.3 * (1 - k * 0.4), 0, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; }
    if (u.poisonUntil > now) { for (let i = 0; i < 3; i++) { const k = (t * 1.2 + i / 3) % 1; ctx.globalAlpha = 0.8 * (1 - k); ctx.strokeStyle = '#9dff4a'; ctx.lineWidth = Math.max(1, 2 * z); ctx.beginPath(); ctx.arc(x + Math.sin(t * 3 + i * 2) * R * 0.6, y - R * (1 + k * 1.6), Math.max(2, R * 0.12), 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1; }
    if (u.dashUntil > now || u.charging) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1.5, 3 * z); for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * R * 0.5, y + R * 0.4); ctx.lineTo(x + i * R * 0.5, y + R * 2.4); ctx.stroke(); } }
  }

  // ------------------------------------------------------------------ World 7 (1.5): the giants on screen
  const MOVE_WORD = { throw: 'Goblin throw', leap: 'Leap', slam: 'Slam', swarm: 'Swarm', sting: 'Stings', lane: 'Frost lane', boulder: 'Ice boulder', tail: 'Tail swipe', brood: 'Hatchlings', charge: 'Lunge', mirror: 'Mirror', clones: 'Glass doubles', beam: 'Beam', gas: 'Poison clouds', breath: 'Fire breath', gust: 'Wing gust', roar: 'Roar', steps: 'Footsteps', blink: 'Blink' };
  const MOVE_SFX = { throw: 'm_throw', leap: 'm_roar', slam: 'm_warn', breath: 'm_inhale', tail: 'm_hiss', swarm: 'm_buzz', sting: 'm_buzz', lane: 'm_freeze', boulder: 'm_warn', brood: 'm_hiss', charge: 'm_roar', mirror: 'm_mirror', clones: 'm_mirror', blink: 'm_blink', beam: 'm_charge', gas: 'm_gas', gust: 'm_warn', roar: 'm_roar' };
  const TYPE_RGB = { fire: '255,122,42', frost: '154,232,255', poison: '157,255,74', crush: '255,176,90', shock: '255,242,122' };
  /** A boss's move as it starts and lands, its phases, rage, a stun that stops it. */
  function mutantFx(ev) {
    const u = ev.unit;
    const TY = typeof MUTANTS !== 'undefined' ? MUTANTS.TYPES : {};
    switch (ev.kind) {
      case 'cast':
        if (ev.move !== 'steps' && ev.move !== 'blink') bigText(u.x, u.y - u.r * 3.1, `${ev.name || MOVE_WORD[ev.move] || ''}!`, '#ffb8a8', 1.2);
        if (MOVE_SFX[ev.move]) sfx(MOVE_SFX[ev.move]);
        break;
      case 'land': {
        const col = (TY[ev.mtype] || {}).col || '#e0b070';
        if (ev.move === 'slam' || ev.move === 'leap' || ev.move === 'steps') {
          const big = ev.move !== 'steps';
          ring(ev.x, ev.y, ev.r || 150, col); if (big) ring(ev.x, ev.y, (ev.r || 150) * 0.6, col);
          burst(ev.x, ev.y, '#a89880', big ? 24 : 6, big ? 300 : 140, 'smoke');
          run.shake = Math.max(run.shake, big ? 16 : 3); sfx(big ? 'm_slam' : 'm_step');
        } else if (ev.move === 'roar') { ring(u.x, u.y, 250, '#ffe8a0'); ring(u.x, u.y, 160, '#ffe8a0'); run.shake = Math.max(run.shake, 8); }
        else if (ev.move === 'tail') { ring(u.x, u.y - u.r * 0.3, 240, '#ffd08a'); run.shake = Math.max(run.shake, 8); sfx('m_whip'); }
        else if (ev.move === 'gust') { burst(u.x, u.y + u.r, '#eaffff', 26, 380, 'smoke'); sfx('sp_gust'); }
        else if (ev.move === 'breath') sfx('m_breath');
        else if (ev.move === 'mirror') { ring(u.x, u.y, 220, '#e0d0ff'); burst(u.x, u.y - u.r, '#ffffff', 20, 260, 'star'); }
        else if (ev.move === 'swarm' || ev.move === 'clones' || ev.move === 'brood') burst(u.x, u.y - u.r * 1.2, ev.move === 'clones' ? '#e8f0ff' : ev.move === 'brood' ? '#c8ff8a' : '#ffe27a', 18, 220, 'spark');
        else if (ev.move === 'charge') run.shake = Math.max(run.shake, 10);
        break;
      }
      case 'zone-land': {
        const z = ev.zone, col = (TY[z.type] || {}).col || '#ffffff';
        if (z.shape === 'lane') { for (let y = z.y; y < BE.ARENA.h; y += 150) burst(z.x, y, '#e8fbff', 5, 160, 'star'); run.shake = Math.max(run.shake, 8); sfx('sp_freeze'); }
        else { ring(z.x, z.y, z.r, col); burst(z.x, z.y, col, z.small ? 10 : 16, 220, z.type === 'poison' ? 'wisp' : 'smoke'); sfx(z.small ? 'm_splat' : z.type === 'poison' ? 'm_gas' : 'm_slam'); if (!z.small) run.shake = Math.max(run.shake, 6); }
        break;
      }
      case 'throw': (run.throws = run.throws || []).push({ from: ev.from, to: ev.to, start: run.battle.time, dur: ev.dur, peon: ev.peon, spin: Math.random() * 6 }); break;
      case 'beam': (run.beams = run.beams || []).push({ x: u.x, y: u.y - u.r * 1.4, a: ev.a, len: ev.len, w: ev.w, until: run.battle.time + 0.45, col: (TY[ev.mtype] || {}).col || '#fff27a' }); sfx('m_beam'); run.shake = Math.max(run.shake, 8); break;
      case 'phase':
        run.banner = { text: ev.text, t: 2.4, max: 2.4, champ: true }; sfx('m_phase'); run.shake = Math.max(run.shake, 12); ring(u.x, u.y, u.r * 3, '#ff6a3c');
        if (ev.burst) { ring(u.x, u.y, ev.burst.r, '#9dff4a'); burst(u.x, u.y - u.r, '#9dff4a', 30, 300, 'wisp'); }
        break;
      case 'enrage': run.banner = { text: ev.text, t: 2.4, max: 2.4, champ: true }; sfx('m_enrage'); break;
      case 'stagger': bigText(u.x, u.y - u.r * 3.4, '💥 Staggered!', '#ffe066', 1.6); burst(u.x, u.y, '#c8b8a0', 30, 360, 'smoke'); ring(u.x, u.y, u.r * 2.4, '#ffe066'); run.shake = Math.max(run.shake, 18); sfx('m_slam'); break;
      case 'interrupt': bigText(u.x, u.y - u.r * 3.1, '💫 Interrupted!', '#9ae6ff', 1.6); sfx('m_clang'); ring(u.x, u.y, u.r * 2, '#9ae6ff'); break;
      case 'blink': burst(ev.from.x, ev.from.y - 60, '#e8e0ff', 16, 200, 'star'); burst(u.x, u.y - 60, '#e8e0ff', 16, 200, 'star'); sfx('m_blink'); break;
      case 'revive': run.banner = { text: ev.text, t: 2.2, max: 2.2, champ: true }; ring(u.x, u.y, u.r * 3, '#ffe066'); burst(u.x, u.y - u.r, '#ffe066', 30, 260, 'star'); sfx('m_revive'); break;
      case 'text': bigText(u.x, u.y - u.r * 3.1, ev.text, ev.col || '#ffd0a0', 1.5); break;
      case 'pile': {
        // A giant's blow lands on your coins.
        const p = BE.PILES.you;
        burst(p.x + (Math.random() - 0.5) * 60, p.y - 20, '#ffd84a', Math.min(30, 6 + ev.sec * 6), 260, 'coin');
        text(p.x + 100, p.y - 130, `-${ev.sec.toFixed(1)}s`, '#ff6a6a');
        run.shake = Math.max(run.shake, 3 + ev.sec * 2);
        if (ev.sec >= 1) sfx('alarm');
        if (!(run.pileToastAt > performance.now())) { run.pileToastAt = performance.now() + 6000; toast('A giant is smashing your coins!'); }
        break;
      }
      case 'shards': for (const o of ev.targets) run.shots.push({ x: u.x, y: u.y - u.r * 1.4, tx: o.x, ty: o.y - o.r * 0.7, t: 0, dur: 0.28, arc: 40, wobble: 0, style: 'star', col: '#e8e0ff', heavy: true, side: 'foe', seed: Math.random() * 6 }); break;
      default: break;
    }
  }
  /** What a blow on a boss did (weak spot, resisted, armour, flanked, core), now and then. */
  const TAG = { weak: ['Weak spot!', '#8aff8a'], resist: ['Resisted', '#c8c8d8'], armour: ['Armour', '#c8c8d8'], flank: ['Flanked!', '#ffe066'], core: ['Core hit!', '#ffd86a'] };
  function tagFx(u, tag) {
    if (!TAG[tag] || (u._tagAt || 0) > run.battle.time) return;
    u._tagAt = run.battle.time + 1.4;
    run.fx.push({ kind: 'text', x: u.x + (Math.random() - 0.5) * u.r, y: u.y - u.r * 2.2, s: TAG[tag][0], col: TAG[tag][1], life: 1, max: 1, vy: -60 });
  }
  /**
   * The ground where a big attack will land, drawn true to where it hits (no squashing): faint at
   * first, filling towards its edge as the moment comes, its rim blinking faster; frost left on a
   * lane, clouds of poison.
   */
  function drawZones(ctx, t, z) {
    const now = run.battle.time;
    for (const q of run.battle.zones) {
      const rgb = TYPE_RGB[q.type] || '255,90,90';
      const k = q.linger ? 1 : Math.max(0, Math.min(1, (now - q.start) / Math.max(0.05, q.at - q.start)));
      const blink = 0.5 + 0.5 * Math.sin(t * (10 + k * 14));
      const path = (s = 1) => {
        ctx.beginPath();
        if (q.shape === 'ring') ctx.arc(sx(q.x), sy(q.y), Math.max(1, q.r * z * s), 0, Math.PI * 2);
        else if (q.shape === 'cone') { const cx = sx(q.x), cy = sy(q.y); ctx.moveTo(cx, cy); ctx.arc(cx, cy, Math.max(1, q.r * z * s), q.a - q.spread, q.a + q.spread); ctx.closePath(); }
        else if (q.shape === 'line') { const L = q.len * s, hw = q.w / 2, ca = Math.cos(q.a), sa = Math.sin(q.a); [[q.x - sa * hw, q.y + ca * hw], [q.x + ca * L - sa * hw, q.y + sa * L + ca * hw], [q.x + ca * L + sa * hw, q.y + sa * L - ca * hw], [q.x + sa * hw, q.y - ca * hw]].forEach(([x, y], i) => (i ? ctx.lineTo(sx(x), sy(y)) : ctx.moveTo(sx(x), sy(y)))); ctx.closePath(); }
        else if (q.shape === 'lane') ctx.rect(sx(q.x - q.w / 2), sy(q.y), q.w * z, (q.y2 - q.y) * z * s);
      };
      ctx.save();
      if (q.linger) {
        if (q.kind === 'ice') {
          path(); ctx.fillStyle = `rgba(200,240,255,${0.22 + 0.05 * Math.sin(t * 3)})`; ctx.fill(); ctx.strokeStyle = 'rgba(230,250,255,0.6)'; ctx.lineWidth = Math.max(1, 2 * z); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          for (let i = 0; i < 8; i++) { const yy = q.y + ((i * 211 + t * 30) % Math.max(1, q.y2 - q.y)); ctx.beginPath(); ctx.arc(sx(q.x + Math.sin(i * 7) * q.w * 0.35), sy(yy), Math.max(1.2, 3 * z), 0, Math.PI * 2); ctx.fill(); }
        } else if (q.kind === 'gas') {
          const left = Math.max(0, Math.min(1, (q.until - now) / 1.5));
          for (let i = 0; i < 5; i++) { const a = i * 1.26 + t * 0.4, cx = sx(q.x + Math.cos(a) * q.r * 0.45), cy = sy(q.y + Math.sin(a) * q.r * 0.35), R = q.r * z * 0.7; const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); gr.addColorStop(0, `rgba(157,255,74,${0.34 * left})`); gr.addColorStop(1, 'rgba(157,255,74,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.restore();
        continue;
      }
      path(); ctx.fillStyle = `rgba(${rgb},${0.1 + 0.1 * k})`; ctx.fill();
      ctx.strokeStyle = `rgba(${rgb},${0.5 + 0.45 * blink})`; ctx.lineWidth = Math.max(1.5, 4 * z);
      if (!q.small) ctx.setLineDash([Math.max(4, 14 * z), Math.max(3, 8 * z)]);
      ctx.stroke(); ctx.setLineDash([]);
      path(k); ctx.fillStyle = `rgba(${rgb},${0.18 + 0.22 * k})`; ctx.fill();
      if (q.small) { const cx = sx(q.x), cy = sy(q.y), R = q.r * z; ctx.strokeStyle = `rgba(${rgb},0.9)`; ctx.lineWidth = Math.max(1, 2 * z); ctx.beginPath(); ctx.moveTo(cx - R * 0.5, cy); ctx.lineTo(cx + R * 0.5, cy); ctx.moveTo(cx, cy - R * 0.5); ctx.lineTo(cx, cy + R * 0.5); ctx.stroke(); }
      ctx.restore();
    }
  }
  const lerpN = (a, b2, k) => a + (b2 - a) * k;
  /** Fire from a dragon's jaws, goblins in the air, beams, and the twins' tether. */
  function drawMutantFx(ctx, t, z) {
    const b = run.battle, now = b.time;
    for (const u of b.units) {
      const c = u.cast;
      if (!c || c.move.kind !== 'breath' || c.stage !== 'act' || u.state === 'dying') continue;
      // From the jaws (high on the body) down onto the ground it burns: the cone from its feet.
      const a = c.angle != null ? c.angle : c.a0, R = c.move.range;
      const mx = u.x + Math.cos(a) * u.r * 0.3, my = u.y - u.r * 2.7;
      const x0 = sx(mx), y0 = sy(my), fx = sx(u.x + Math.cos(a) * R), fy = sy(u.y + Math.sin(a) * R);
      const gr = ctx.createLinearGradient(x0, y0, fx, fy);
      gr.addColorStop(0, 'rgba(255,250,200,0.95)'); gr.addColorStop(0.25, 'rgba(255,190,60,0.85)'); gr.addColorStop(0.7, 'rgba(255,90,20,0.55)'); gr.addColorStop(1, 'rgba(200,30,0,0)');
      const sp = 0.2 + 0.03 * Math.sin(t * 30);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x0, y0);
      for (let k = 0; k <= 8; k++) { const aa = a - sp + (2 * sp * k) / 8; ctx.lineTo(sx(u.x + Math.cos(aa) * R), sy(u.y + Math.sin(aa) * R)); }
      ctx.closePath(); ctx.fill();
      if (Math.random() < 0.7) { const d = 0.2 + Math.random() * 0.8; burst(lerpN(mx, u.x + Math.cos(a) * R, d), lerpN(my, u.y + Math.sin(a) * R, d), Math.random() < 0.5 ? '#ffb43a' : '#ff6a1a', 2, 120, 'spark'); }
    }
    if (run.throws) {
      run.throws = run.throws.filter((th) => now - th.start < th.dur);
      for (const th of run.throws) {
        const k = (now - th.start) / th.dur;
        const gx = th.from.x + (th.to.x - th.from.x) * k, gy = th.from.y + (th.to.y - th.from.y) * k;
        const lift = Math.sin(k * Math.PI) * 520;
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(sx(th.to.x + (gx - th.to.x) * 0.3), sy(th.to.y + (gy - th.to.y) * 0.3), 22 * z * (0.4 + k * 0.6), 7 * z * (0.4 + k * 0.6), 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        const e = D.ENEMIES[th.peon];
        ctx.save(); ctx.translate(sx(gx), sy(gy - lift) + 20 * z); ctx.rotate(th.spin + k * 9); ctx.translate(0, -20 * z);
        ENEMY_ART.draw(ctx, th.peon, { t: now * 3, walk: 0, walkRaw: now * 4, atk: -1, heavy: false, hurt: 0, dying: 0, seed: 7, mut: {} }, (90 * z * D.enemySize(th.peon)) / (e.look.size || 1));
        ctx.restore();
      }
    }
    if (run.beams) {
      run.beams = run.beams.filter((bm) => bm.until > now);
      for (const bm of run.beams) {
        const k = (bm.until - now) / 0.45;
        const x0 = sx(bm.x), y0 = sy(bm.y), x1 = sx(bm.x + Math.cos(bm.a) * bm.len), y1 = sy(bm.y + Math.sin(bm.a) * bm.len);
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.5 * k; ctx.strokeStyle = bm.col; ctx.lineWidth = bm.w * z; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.globalAlpha = 0.95 * k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = bm.w * z * 0.3; ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    const sol = b.units.find((u) => u.kind === 'twin_sol' && u.state !== 'dying'), luna = b.units.find((u) => u.kind === 'twin_luna' && u.state !== 'dying');
    if (sol && luna && sol.linked) {
      const x0 = sx(sol.x), y0 = sy(sol.y - sol.r * 1.6), x1 = sx(luna.x), y1 = sy(luna.y - luna.r * 1.6);
      const gr = ctx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(255,207,58,0.7)'); gr.addColorStop(1, 'rgba(154,216,255,0.7)');
      ctx.strokeStyle = gr; ctx.lineWidth = Math.max(2, 6 * z); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y0);
      for (let i = 1; i <= 12; i++) { const k = i / 12; ctx.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k + Math.sin(k * Math.PI * 4 + t * 8) * 8 * z * Math.sin(k * Math.PI)); }
      ctx.stroke();
    }
  }
  /** Each boss's health along the top: its name, phase marks, rage coming. */
  function bossBars(b) {
    const host = run.screen.querySelector('#bt-bossbars');
    if (!host) return;
    const bosses = b.units.filter((u) => u.mutant && u.side === 'foe');
    const key = bosses.map((u) => u.uid).join(',');
    if (host.dataset.key !== key) {
      host.dataset.key = key;
      host.innerHTML = bosses.map((u) => `<div class="bt-bossbar" data-uid="${u.uid}"><span class="bt-bb-name">${D.ENEMIES[u.kind].name}</span><span class="bt-bb-tag"></span><div class="bt-bb-track"><div class="bt-bb-fill"></div>${(u.mutant.phases || []).map((p) => `<i style="left:${p.at * 100}%"></i>`).join('')}</div></div>`).join('');
    }
    for (const u of bosses) {
      const row = host.querySelector(`[data-uid="${u.uid}"]`);
      if (!row) continue;
      row.querySelector('.bt-bb-fill').style.width = `${Math.max(0, (u.hp / u.maxHp) * 100).toFixed(1)}%`;
      row.classList.toggle('dead', u.state === 'dying');
      row.classList.toggle('enraged', !!u.enraged);
      const left = (u.mutant.enrage || 180) - (b.time - u.spawnT);
      const tag = u.enraged ? 'Enraged!' : left < 45 ? `Rage in ${Math.ceil(left)}s` : u.phase ? `Phase ${u.phase + 1}` : '';
      const tg = row.querySelector('.bt-bb-tag');
      if (tg.textContent !== tag) tg.textContent = tag;
    }
  }
  /** A World 7 level's card: how it is won, the hint, and each boss's weaknesses once met. */
  function mutantCard(level, played) {
    const b = B();
    const rows = (level.bossIds || []).map((id) => {
      const e = D.ENEMIES[id], n = MUTANTS.bossNotes(id);
      if (!(played && b.seen[id])) return '<div class="bt-mut-row"><b>???</b><span class="bt-dim">Play the level to learn about this boss.</span></div>';
      return `<div class="bt-mut-row"><b>${e.name}</b><div class="bt-mut-chips">${n.weak ? `<span class="bt-mchip weak">Weak to ${n.weak}</span>` : ''}${n.resist ? `<span class="bt-mchip resist">Resists ${n.resist}</span>` : ''}${n.type ? `<span class="bt-mchip">${n.type.icon} ${n.type.name}: ${n.type.text}</span>` : ''}</div>${n.armour ? `<span class="bt-dim">${n.armour}</span>` : ''}${n.twin ? `<span class="bt-dim">${n.twin}</span>` : ''}</div>`;
    }).join('');
    return `<div class="bt-mutcard"><div class="bt-mut-rule">Beat the boss to win. Their camp has no coin pile, so guard yours.</div>${level.tip ? `<div class="bt-mut-tip">💡 ${level.tip}</div>` : ''}${rows}</div>`;
  }
  /** One to five bleeding, dripping red stars: how dangerous a World 7 foe is, against World 7 only (Sam, 23 Nov). */
  const BLOOD_STAR = '<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5 1.4-7.1-5.3-5 7.2-.9z" fill="#c8102e" stroke="#4a0008" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.6 18.4c-.2 2.4.4 4 .9 5.6.5-1.4.9-2.8.9-4.6zM15.4 18.8c.1 2.2.6 3.4 1.1 4.6.4-1.2.6-2.3.4-3.7z" fill="#c8102e" stroke="#4a0008" stroke-width=".9"/><circle class="drip" cx="8.5" cy="26" r="1.4" fill="#c8102e"/><circle class="drip d2" cx="16.5" cy="25" r="1.2" fill="#c8102e"/><path d="M8.6 7.4l2.2-1" stroke="#ff8a9a" stroke-width="1.3" stroke-linecap="round"/></svg>';
  const bloodHtml = (d) => { let s = ''; for (let i = 1; i <= 5; i++) s += `<span class="bt-blood ${d >= i ? 'full' : d >= i - 0.5 ? 'half' : ''}">${BLOOD_STAR}</span>`; return s; };
  const dangerHtml = (id) => (D.ENEMIES[id].world === 7 && typeof MUTANTS !== 'undefined' ? `<span class="bt-bloods">${bloodHtml(MUTANTS.bloodStars(id))}</span>` : heartsHtml(D.difficulty(id)));

  function events(list) {
    for (const ev of list) {
      const u = ev.unit;
      switch (ev.type) {
        case 'deploy': sfx('deploy'); burst(u.x, u.y, colourOf(u), 14, 160, 'spark'); ring(u.x, u.y, u.r * 1.8, colourOf(u)); break;
        case 'spawn':
          sfx('spawn');
          if (D.ENEMIES[u.kind].look.shadow) burst(u.x, u.y - 10, '#6a5a8a', 8, 90, 'smoke'); else burst(u.x, u.y, '#c8b8a0', 8, 80, 'smoke');
          if (u.elite) { burst(u.x, u.y - u.r, '#ffd84a', 16, 200, 'star'); ring(u.x, u.y, u.r * 2.2, '#ffd84a'); }
          if (u.champ) { burst(u.x, u.y - u.r, '#ff6a3c', 26, 260, 'spark'); ring(u.x, u.y, u.r * 2.6, '#ff6a3c'); run.shake = Math.max(run.shake || 0, 7); }
          if (!B().seen[u.kind]) seenNow(u.kind);
          break;
        case 'wave': run.banner = { text: ev.text, t: 2.2, max: 2.2, champ: !!ev.champ }; sfx('rally'); break;
        case 'special': specialFx(ev); break;
        case 'special-miss': bigText(u.x, u.y - u.r * 2.4, 'Nothing in reach', '#c8d0e8', 1.1); sfx('nope'); break;
        case 'portal': for (const [rr, life] of [[2.8, 1.3], [2, 1.1], [1.3, 0.9]]) run.fx.push({ kind: 'ring', x: u.x, y: u.y, r: u.r * rr, life, max: life, col: '#b080ff' }); burst(u.x, u.y - u.r, '#b080ff', 22, 170, 'wisp'); bigText(u.x, u.y - u.r * 2.6, '🌀 Portal!', '#d8b0ff', 1.1); break;
        case 'trait': traitFx(ev); break;
        case 'mutant': mutantFx(ev); break;
        case 'swing':
          if (ev.ranged) {
            const style = shotStyle(u);
            const sp = SHOT[style] || SHOT.magic;
            for (const t of ev.targets) {
              const d = Math.hypot(t.x - u.x, t.y - u.y);
              run.shots.push({ x: u.x, y: u.y - u.r * 1.1, tx: t.x, ty: t.y - t.r * 0.7, t: 0, dur: sp.beam || 0.06 + d / sp.v, arc: (sp.arc || 0) * d, wobble: sp.wobble || 0, style, col: colourOf(u), heavy: ev.heavy, side: u.side, seed: Math.random() * 6 });
            }
            if (ev.heavy) ring(u.x, u.y - u.r, u.r * 2, colourOf(u));
            if (u.side === 'you') {
              const L = LAUNCH[style] || LAUNCH.magic;
              burst(u.x, u.y - u.r * 1.1, L[0], ev.heavy ? L[2] * 2 : L[2], L[3], L[1]);
              // A heavy shot is a volley: two more follow the first, fanned a little (drawn only).
              if (ev.heavy && !sp.beam) for (const t of ev.targets.slice(0, 1)) for (const k of [1, 2]) {
                const d = Math.hypot(t.x - u.x, t.y - u.y);
                const side = k === 1 ? -1 : 1;
                run.shots.push({ x: u.x + side * u.r * 0.6, y: u.y - u.r * 1.1, tx: t.x + side * t.r * 0.5, ty: t.y - t.r * 0.7, t: -0.07 * k, dur: 0.06 + d / sp.v, arc: (sp.arc || 0) * d + 30 * k, wobble: sp.wobble || 0, style, col: colourOf(u), heavy: false, side: u.side, seed: Math.random() * 6 });
              }
            }
          }
          if (ev.splash && ev.splash.length && ev.targets[0]) ring(ev.targets[0].x, ev.targets[0].y, 80, '#ffd08a');
          if (ev.heavy) run.shake = Math.max(run.shake, u.boss ? 9 : 4);
          if (ev.heavy && typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.hit(u, true);
          break;
        case 'hit':
          // A burn's or poison's tick: a small number now and then, no blow.
          if (ev.dot) { if (Math.random() < 0.3) text(u.x + u.r * 0.8, u.y - u.r * 1.4, `${Math.round(ev.dmg)}`, u.burnUntil > run.battle.time ? '#ffb43a' : '#b8ff6a'); break; }
          if (!ev.heavy && ev.by && typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.hit(ev.by, false);
          hitFx(u, ev.by, ev.heavy);
          if (ev.heavy) text(u.x + u.r * 1.1, u.y - u.r * 1.6, `${Math.round(ev.dmg)}`, '#ffe066');
          u._hurt = 1;
          if (ev.tag && u.mutant) tagFx(u, ev.tag);
          break;
        case 'death':
          if (typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.death(u);
          if (u.side === 'foe' && ev.by && ev.by.side === 'you') { const k = B().kills; k[u.kind] = (k[u.kind] || 0) + 1; }
          if (u.side === 'you') { burst(u.x, u.y - u.r * 0.5, colourOf(u), 18, 200, 'star'); burst(u.x, u.y, '#ffffff', 8, 90, 'smoke'); }
          else if (D.ENEMIES[u.kind].look.shadow) burst(u.x, u.y - u.r, D.ENEMIES[u.kind].look.trim, 18, 120, 'wisp');
          else { burst(u.x, u.y - u.r * 0.6, '#d8cfc0', 12, 140, 'smoke'); burst(u.x, u.y - u.r * 0.6, colourOf(u), 10, 200, 'spark'); }
          if (u.elite) burst(u.x, u.y - u.r, '#ffd84a', 20, 240, 'coin');
          if (u.boss) { run.shake = 14; ring(u.x, u.y, 260, '#ffffff'); }
          break;
        case 'capture': sfx(u.side === 'foe' ? 'alarm' : 'coins'); if (u.side === 'foe') toast('An enemy is taking your coins!'); break;
        case 'rally': sfx('rally'); run.banner = { text: 'Their defenders come out!', t: 1.8, max: 1.8 }; break;
        case 'end': {
          const pile = ev.side === 'foe' ? BE.PILES.foe : BE.PILES.you;
          if (typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.play('explosion');
          run.shake = 22; run.flash = 1;
          burst(pile.x, pile.y, '#ffb347', 60, 520, 'spark');
          burst(pile.x, pile.y, '#3a2a20', 30, 300, 'smoke');
          burst(pile.x, pile.y, '#ffd84a', 40, 420, 'coin');
          ring(pile.x, pile.y, 520, '#ffe9a0');
          break;
        }
        default: break;
      }
    }
  }

  /** What a blow looks like where it lands: by the beast's element, or by the enemy's weapon. */
  function hitFx(u, by, heavy) {
    const x = u.x, y = u.y - u.r * 0.7;
    const n = heavy ? 2.4 : 1;
    if (!by) return;
    if (by.side === 'you') {
      switch ((D.T(by.kind) || {}).element) {
        case 'FIRE': burst(x, y, '#ff7a2a', 7 * n, 200, 'spark'); burst(x, y, '#ffd84a', 3 * n, 150, 'spark'); burst(x, y - 10, '#5a4a40', 2 * n, 60, 'smoke'); break;
        case 'WATER': burst(x, y, '#6ac8ff', 8 * n, 230, 'drop'); ring(x, y + u.r * 0.6, u.r * 1.3, '#bfe8ff'); break;
        case 'WIND': ring(x, y, u.r * 1.5, '#e8fbff'); burst(x, y, '#ffffff', 4 * n, 220, 'spark'); break;
        case 'EARTH': burst(x, y, '#a87a48', 6 * n, 220, 'chip'); burst(x, y + u.r * 0.6, '#8a7a60', 2 * n, 70, 'smoke'); break;
        case 'LIGHT': burst(x, y, '#fff6c0', 6 * n, 210, 'star'); break;
        case 'VOID': burst(x, y, '#b04aff', 6 * n, 120, 'wisp'); burst(x, y, '#ff6be0', 2 * n, 160, 'spark'); break;
        case 'COSMIC': burst(x, y, '#7ae8ff', 6 * n, 220, 'star'); break;
        case 'DEITY': ring(x, y, u.r * 1.6, '#ffe9a0'); burst(x, y, '#ffd84a', 6 * n, 200, 'spark'); break;
        default: burst(x, y, colourOf(by), 6 * n, 200, 'spark');
      }
      if (!shoots(by) && ['slam', 'stomp'].includes(beastStyle(by.kind).atk)) burst(u.x, u.y, '#a89880', 3 * n, 90, 'smoke');
    } else {
      const st = ENEMY_ART.styleOf(D.ENEMIES[by.kind].look.weapon);
      const col = colourOf(by);
      if (st === 'slash') run.fx.push({ kind: 'slash', x, y, r: u.r * (heavy ? 1.6 : 1.2), a: -0.8 + Math.random() * 0.5, life: 0.28, max: 0.28, col: by.elite ? '#ffd84a' : '#ffffff' });
      else if (st === 'claw') run.fx.push({ kind: 'claw', x, y, r: u.r * (heavy ? 1.4 : 1.1), life: 0.32, max: 0.32, col: '#ffd0d0' });
      else if (st === 'smash') { ring(u.x, u.y, u.r * (heavy ? 2.6 : 1.8), '#d8c8a8'); burst(u.x, u.y, '#a89880', 5 * n, 120, 'smoke'); if (heavy) run.shake = Math.max(run.shake, 6); }
      else if (st === 'thrust' || st === 'stab' || st === 'punch') burst(x, y, '#ffffff', 5 * n, 240, 'spark');
      else if (st === 'gun') burst(x, y, '#ffe9a0', 5 * n, 260, 'spark');
      else if (st === 'throw') burst(x, y, col, 8 * n, 180, 'drop');
      else burst(x, y, col, 6 * n, 200, 'star');
    }
  }

  // ------------------------------------------------------------------ effects
  function burst(x, y, col, n, speed, kind) {
    n = Math.round(n);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.35 + Math.random() * 0.65);
      const life = kind === 'smoke' || kind === 'wisp' ? 0.7 + Math.random() * 0.5 : 0.35 + Math.random() * 0.4;
      run.fx.push({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'wisp' ? 60 : kind === 'coin' ? 180 : kind === 'drop' || kind === 'chip' ? 120 : 0), life, max: life, col, size: kind === 'smoke' ? 10 + Math.random() * 12 : kind === 'wisp' ? 6 + Math.random() * 8 : 3 + Math.random() * 4, rot: Math.random() * 6 });
    }
    if (run.fx.length > 500) run.fx.splice(0, run.fx.length - 500);
  }
  function ring(x, y, r, col) { run.fx.push({ kind: 'ring', x, y, r, life: 0.45, max: 0.45, col }); }
  function text(x, y, s, col) { run.fx.push({ kind: 'text', x, y, s, life: 1.1, max: 1.1, col, vy: -50 }); }
  function tickFx(dt, real) {
    for (const p of run.fx) {
      p.life -= dt;
      if (p.kind === 'ring' || p.kind === 'text' || p.kind === 'slash' || p.kind === 'claw') { if (p.vy) p.y += p.vy * dt; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const drag = p.kind === 'smoke' || p.kind === 'wisp' ? 2.2 : 3.2;
      p.vx -= p.vx * drag * dt; p.vy -= p.vy * drag * dt;
      if (p.kind === 'coin') p.vy += 500 * dt;
      if (p.kind === 'drop' || p.kind === 'chip') p.vy += 700 * dt;
      if (p.kind === 'wisp') p.vy -= 40 * dt;
    }
    run.fx = run.fx.filter((p) => p.life > 0);
    for (const s of run.shots) s.t += dt;
    run.shots = run.shots.filter((s) => s.t < s.dur);
    run.shake = Math.max(0, run.shake - dt * 30);
    run.flash = Math.max(0, run.flash - dt * 1.6);
    run.goT = Math.max(0, run.goT - real);
    run.markPulse = Math.max(0, run.markPulse - real * 2.5);
    run.laneT = Math.max(0, (run.laneT || 0) - real);
    if (run.banner) { run.banner.t -= real; if (run.banner.t <= 0) run.banner = null; }
    for (const u of run.battle.units) if (u._hurt) u._hurt = Math.max(0, u._hurt - dt * 6);
    // Coins fly off a pile being taken, to whoever is taking it.
    run.coinsAt -= dt;
    if (run.coinsAt <= 0) {
      run.coinsAt = 0.12;
      for (const u of run.battle.units) if (u.state === 'capture') {
        const pile = u.side === 'you' ? BE.PILES.foe : BE.PILES.you;
        run.fx.push({ kind: 'fly', x: pile.x + (Math.random() - 0.5) * 60, y: pile.y - 20, tx: u.x, ty: u.y - u.r, life: 0.5, max: 0.5, col: '#ffd84a' });
      }
    }
  }

  // ------------------------------------------------------------------ the arena's look
  /** The battlefield, painted once for the level: the world's theme, varied by the level. */
  function paintArena(level) {
    const k = 1;
    const c = document.createElement('canvas');
    c.width = W * k; c.height = H * k;
    const g = c.getContext('2d');
    g.scale(k, k);
    const r = D.seeded(D.hash('arena|' + level.id));
    const theme = D.WORLDS[level.world - 1].theme;
    const T = {
      shadow: { top: '#2c2448', mid: '#30484e', low: '#3f6448', path: 'rgba(190,180,230,0.16)', blob: ['#355048', '#3a3058', '#2c4046', '#456650'], edge: '#16131f' },
      kingdom: { top: '#5f7d4a', mid: '#6f9a4e', low: '#7cab55', path: 'rgba(214,190,140,0.75)', blob: ['#86b85c', '#6a944a', '#93b860', '#5f8a44'], edge: '#3f5a2c' },
      invasion: { top: '#4a2a22', mid: '#7a4a2e', low: '#8a6a3a', path: 'rgba(40,30,30,0.35)', blob: ['#8a5634', '#6a3a26', '#9a6a3c', '#5a3424'], edge: '#2a1810' },
      moon: { top: '#3a3e52', mid: '#6a6e82', low: '#8a8e9e', path: 'rgba(220,225,240,0.22)', blob: ['#7a7e90', '#5a5e70', '#9a9eae', '#6a6e80'], edge: '#1a1c28' },
      rings: { top: '#141830', mid: '#2a2a48', low: '#3a3a5a', path: 'rgba(240,210,160,0.2)', blob: ['#4a4060', '#3a3050', '#5a5070', '#2a2a44'], edge: '#0a0a18' },
      mutants: { top: '#1a0e22', mid: '#2a2236', low: '#34304a', path: 'rgba(160,255,90,0.14)', blob: ['#3a2a4a', '#2a3a2a', '#4a3a5a', '#2a4a34'], edge: '#0a0610' },
      eclipse: { top: '#0e0818', mid: '#1e1230', low: '#2e1c44', path: 'rgba(255,200,100,0.14)', blob: ['#2a1a40', '#3a2050', '#1a1030', '#4a2a5a'], edge: '#05030a' },
    }[theme];
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, T.top); grd.addColorStop(0.5, T.mid); grd.addColorStop(1, T.low);
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // Patches of colour over the ground.
    for (let i = 0; i < 260; i++) {
      g.globalAlpha = 0.18 + r() * 0.22;
      g.fillStyle = T.blob[Math.floor(r() * T.blob.length)];
      g.beginPath(); g.ellipse(r() * W, r() * H, 20 + r() * 70, 12 + r() * 40, r() * 3, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    // A path winding from pile to pile.
    g.strokeStyle = T.path; g.lineCap = 'round';
    g.lineWidth = theme === 'kingdom' ? 120 : 150;
    g.beginPath();
    let px = 500;
    g.moveTo(500, 60);
    for (let y = 200; y <= 1960; y += 180) { px = Math.max(320, Math.min(680, px + (r() - 0.5) * 260)); g.quadraticCurveTo(px + (r() - 0.5) * 200, y - 90, px, y); }
    g.stroke();
    if (theme === 'kingdom') {
      // Cobbles on the road.
      g.fillStyle = 'rgba(120,100,80,0.35)';
      for (let i = 0; i < 500; i++) { const y = r() * H; g.beginPath(); g.ellipse(500 + (r() - 0.5) * 140 + Math.sin(y / 300) * 60, y, 7, 5, 0, 0, Math.PI * 2); g.fill(); }
    }
    // Props down both sides (never in the middle, where the fighting is).
    const prop = (x, y, s) => {
      if (theme === 'shadow') {
        if (r() < 0.55) { // a bare tree
          g.strokeStyle = '#0d0b14'; g.lineWidth = 9 * s; g.lineCap = 'round';
          g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 90 * s); g.stroke();
          g.lineWidth = 4 * s;
          for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.2; g.beginPath(); g.moveTo(x, y - (40 + r() * 40) * s); g.lineTo(x + Math.cos(a) * 50 * s, y - 70 * s + Math.sin(a) * 40 * s); g.stroke(); }
        } else { // glowing mushrooms
          for (let i = 0; i < 3; i++) {
            const mx = x + (r() - 0.5) * 50 * s, my = y + (r() - 0.5) * 20 * s;
            const gl = g.createRadialGradient(mx, my - 8 * s, 0, mx, my - 8 * s, 30 * s); gl.addColorStop(0, 'rgba(160,140,255,0.4)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = gl; g.beginPath(); g.arc(mx, my - 8 * s, 30 * s, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#d8d0ff'; g.fillRect(mx - 2 * s, my - 10 * s, 4 * s, 10 * s);
            g.fillStyle = '#8a7aff'; g.beginPath(); g.ellipse(mx, my - 10 * s, 10 * s, 6 * s, 0, Math.PI, 0); g.fill();
          }
        }
      } else if (theme === 'kingdom') {
        if (r() < 0.5) { // a round tree
          g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(x + 10 * s, y + 4 * s, 40 * s, 14 * s, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#6a4a2a'; g.fillRect(x - 5 * s, y - 40 * s, 10 * s, 40 * s);
          for (const [dx, dy, rr, col] of [[0, -70, 38, '#3f7a34'], [-20, -58, 26, '#4a8a3a'], [18, -60, 28, '#4a8a3a'], [-6, -82, 22, '#5a9a44']]) { g.fillStyle = col; g.beginPath(); g.arc(x + dx * s, y + dy * s, rr * s, 0, Math.PI * 2); g.fill(); }
        } else if (r() < 0.5) { // a haystack
          g.fillStyle = '#d8b450'; g.beginPath(); g.ellipse(x, y - 18 * s, 30 * s, 24 * s, 0, Math.PI, 0); g.lineTo(x + 30 * s, y); g.lineTo(x - 30 * s, y); g.fill();
          g.strokeStyle = '#b8902a'; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * 10 * s, y); g.lineTo(x + i * 8 * s, y - 34 * s); g.stroke(); }
        } else { // a fence
          g.strokeStyle = '#7a5a34'; g.lineWidth = 5 * s;
          for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x + i * 22 * s, y); g.lineTo(x + i * 22 * s, y - 30 * s); g.stroke(); }
          g.lineWidth = 4 * s; for (const yy of [-10, -22]) { g.beginPath(); g.moveTo(x - 4 * s, y + yy * s); g.lineTo(x + 70 * s, y + yy * s); g.stroke(); }
        }
      } else if (theme === 'moon') {
        if (r() < 0.6) { // a crater
          g.fillStyle = 'rgba(30,32,44,0.45)'; g.beginPath(); g.ellipse(x, y, 50 * s, 24 * s, 0, 0, Math.PI * 2); g.fill();
          g.strokeStyle = 'rgba(220,224,240,0.45)'; g.lineWidth = 5 * s; g.beginPath(); g.ellipse(x, y - 3 * s, 50 * s, 24 * s, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
        } else if (r() < 0.5) { // a flag
          g.strokeStyle = '#d8d8e0'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 60 * s); g.stroke();
          g.fillStyle = ['#ff5a3a', '#3a8aff', '#ffd23a'][Math.floor(r() * 3)]; g.fillRect(x, y - 60 * s, 30 * s, 18 * s);
        } else { // a boulder
          g.fillStyle = '#9a9eae'; g.strokeStyle = '#4a4e5e'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y - 14 * s, 26 * s, 18 * s, 0, 0, Math.PI * 2); g.fill(); g.stroke();
        }
      } else if (theme === 'rings') {
        if (r() < 0.55) { // an asteroid
          g.fillStyle = '#6a5a4a'; g.strokeStyle = '#2a2018'; g.lineWidth = 3;
          g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const rr = (22 + r() * 12) * s; g.lineTo(x + Math.cos(a) * rr, y - 20 * s + Math.sin(a) * rr * 0.8); } g.closePath(); g.fill(); g.stroke();
        } else { // a crate of loot
          g.fillStyle = '#8a5a2a'; g.strokeStyle = '#3a2410'; g.lineWidth = 3; g.fillRect(x - 18 * s, y - 30 * s, 36 * s, 30 * s); g.strokeRect(x - 18 * s, y - 30 * s, 36 * s, 30 * s);
          g.fillStyle = '#ffd23a'; g.beginPath(); g.ellipse(x, y - 32 * s, 12 * s, 5 * s, 0, 0, Math.PI * 2); g.fill();
        }
      } else if (theme === 'eclipse') {
        if (r() < 0.5) { // a broken pillar
          g.fillStyle = '#3a2a4a'; g.strokeStyle = '#1a0a2a'; g.lineWidth = 3; g.fillRect(x - 12 * s, y - (40 + r() * 50) * s, 24 * s, 90 * s); g.strokeRect(x - 12 * s, y - 90 * s, 24 * s, 90 * s);
          g.fillStyle = '#ffd23a'; g.globalAlpha = 0.5; g.fillRect(x - 12 * s, y - 52 * s, 24 * s, 4 * s); g.globalAlpha = 1;
        } else { // a glyph ring
          g.strokeStyle = 'rgba(208,128,255,0.45)'; g.lineWidth = 3 * s; g.beginPath(); g.ellipse(x, y, 40 * s, 18 * s, 0, 0, Math.PI * 2); g.stroke();
          g.beginPath(); g.ellipse(x, y, 26 * s, 11 * s, 0, 0, Math.PI * 2); g.stroke();
        }
      } else {
        if (r() < 0.45) { // a crater, some glowing
          g.fillStyle = 'rgba(30,15,10,0.5)'; g.beginPath(); g.ellipse(x, y, 46 * s, 22 * s, 0, 0, Math.PI * 2); g.fill();
          g.strokeStyle = 'rgba(160,110,70,0.6)'; g.lineWidth = 5 * s; g.beginPath(); g.ellipse(x, y - 3 * s, 46 * s, 22 * s, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
          if (r() < 0.5) { const gl = g.createRadialGradient(x, y, 0, x, y, 40 * s); gl.addColorStop(0, 'rgba(140,255,90,0.55)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, 40 * s, 0, Math.PI * 2); g.fill(); }
        } else { // metal wreckage
          g.fillStyle = '#5a6068'; g.strokeStyle = '#2a2e34'; g.lineWidth = 3;
          g.beginPath(); g.moveTo(x - 30 * s, y); g.lineTo(x - 10 * s, y - 40 * s); g.lineTo(x + 26 * s, y - 24 * s); g.lineTo(x + 34 * s, y); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#ff7a3a'; g.beginPath(); g.arc(x + 4 * s, y - 20 * s, 4 * s, 0, Math.PI * 2); g.fill();
        }
      }
    };
    for (let i = 0; i < 46; i++) {
      const side = i % 2 ? 1 : -1;
      const x = 500 + side * (330 + r() * 160);
      prop(x, 160 + r() * 1700, 0.8 + r() * 0.6);
    }
    // The ends: their camp at the top, your meadow at the bottom.
    const topGrad = g.createLinearGradient(0, 0, 0, 380);
    topGrad.addColorStop(0, 'rgba(0,0,0,0.5)'); topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = topGrad; g.fillRect(0, 0, W, 380);
    // Your zone (where beasts can be placed): plainly blue, edged, and named (reviewer 2: it was not).
    const lowGrad = g.createLinearGradient(0, SAFE_Y, 0, H);
    lowGrad.addColorStop(0, 'rgba(80,170,255,0.2)'); lowGrad.addColorStop(1, 'rgba(80,170,255,0.34)');
    g.fillStyle = lowGrad; g.fillRect(0, SAFE_Y, W, H - SAFE_Y);
    g.strokeStyle = 'rgba(170,225,255,0.8)'; g.setLineDash([22, 12]); g.lineWidth = 5;
    g.beginPath(); g.moveTo(0, SAFE_Y); g.lineTo(W, SAFE_Y); g.stroke(); g.setLineDash([]);
    g.font = '800 30px Fredoka, sans-serif'; g.textAlign = 'left';
    g.fillStyle = 'rgba(200,235,255,0.75)'; g.fillText('YOUR ZONE', 26, SAFE_Y + 40);
    if (theme === 'kingdom') { // castle wall along the top
      g.fillStyle = '#8a8a96'; g.fillRect(0, 0, W, 40);
      for (let x = 0; x < W; x += 50) g.fillRect(x, 40, 30, 16);
      g.fillStyle = '#aa2a3a'; for (const x of [140, 860]) { g.fillRect(x, 0, 30, 90); }
    }
    if (theme === 'rings' || theme === 'eclipse') { // stars over the dark
      for (let i = 0; i < 260; i++) { g.globalAlpha = 0.25 + r() * 0.6; g.fillStyle = '#ffffff'; g.fillRect(r() * W, r() * H, 2 + r() * 2, 2 + r() * 2); }
      g.globalAlpha = 1;
    }
    if (theme === 'rings') { // the planet's rings sweeping across
      for (let i = 0; i < 5; i++) { g.strokeStyle = `rgba(${210 - i * 15},${180 - i * 10},${140 - i * 10},0.18)`; g.lineWidth = 40 + i * 12; g.beginPath(); g.ellipse(500, 1000, 1400 + i * 90, 360 + i * 30, -0.35, 0, Math.PI * 2); g.stroke(); }
    }
    if (theme === 'mutants') { // World 7: no coin pile at their end, but the lair the giants come out of
      const gl = g.createRadialGradient(500, 110, 20, 500, 110, 300); gl.addColorStop(0, 'rgba(150,255,90,0.5)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(500, 110, 300, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2a2230'; g.beginPath(); g.moveTo(250, 200); for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; g.lineTo(500 + Math.cos(a) * 270 + (r() - 0.5) * 30, 200 + Math.sin(a) * 200 + (r() - 0.5) * 24); } g.lineTo(750, 200); g.closePath(); g.fill();
      g.fillStyle = '#07040c'; g.beginPath(); g.moveTo(320, 205); for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * Math.PI; g.lineTo(500 + Math.cos(a) * 180 + (r() - 0.5) * 20, 205 + Math.sin(a) * 140 + (r() - 0.5) * 16); } g.lineTo(680, 205); g.closePath(); g.fill();
      const inner = g.createRadialGradient(500, 170, 10, 500, 170, 150); inner.addColorStop(0, 'rgba(160,255,90,0.35)'); inner.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = inner; g.beginPath(); g.arc(500, 170, 150, 0, Math.PI * 2); g.fill();
      for (const [x, y] of [[452, 150], [476, 148], [532, 158], [556, 156]]) { g.fillStyle = '#ff4a3a'; g.beginPath(); g.ellipse(x, y, 5, 3, 0, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = '#efe6d2'; g.lineWidth = 6; g.lineCap = 'round';
      for (let i = 0; i < 9; i++) { const x = 300 + r() * 400, y = 230 + r() * 70, a = r() * Math.PI; g.beginPath(); g.moveTo(x - Math.cos(a) * 18, y - Math.sin(a) * 8); g.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 8); g.stroke(); }
    }
    if (theme === 'eclipse') { // the eclipse itself above their pile
      const gl = g.createRadialGradient(500, 60, 60, 500, 60, 260); gl.addColorStop(0, 'rgba(255,200,90,0.55)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(500, 60, 260, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#05030a'; g.beginPath(); g.arc(500, 60, 70, 0, Math.PI * 2); g.fill();
    }
    if (theme === 'moon') { // the moon base's dome at the top, and Earth in the dark
      g.fillStyle = 'rgba(200,232,255,0.35)'; g.strokeStyle = '#e8f4ff'; g.lineWidth = 4; g.beginPath(); g.ellipse(500, 30, 320, 90, 0, 0, Math.PI); g.fill(); g.stroke();
    }
    if (theme === 'invasion') { // a crashed ship's hull at the top
      g.fillStyle = '#4a5058'; g.beginPath(); g.ellipse(500, -40, 520, 120, 0, 0, Math.PI); g.fill();
      for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#7aff5a' : '#ff5a3a'; g.beginPath(); g.arc(80 + i * 105, 40, 7, 0, Math.PI * 2); g.fill(); }
    }
    // A soft edge so the map fades out at its sides.
    const ed = g.createLinearGradient(0, 0, 120, 0);
    ed.addColorStop(0, T.edge); ed.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = ed; g.fillRect(0, 0, 120, H);
    const ed2 = g.createLinearGradient(W, 0, W - 120, 0);
    ed2.addColorStop(0, T.edge); ed2.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = ed2; g.fillRect(W - 120, 0, 120, H);
    return c;
  }

  // ------------------------------------------------------------------ drawing a frame
  function heartPath(ctx, x, y, h) {
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.35);
    ctx.bezierCurveTo(x - h * 0.05, y + h * 0.28, x - h * 0.55, y + h * 0.05, x - h * 0.5, y - h * 0.18);
    ctx.bezierCurveTo(x - h * 0.45, y - h * 0.45, x - h * 0.1, y - h * 0.48, x, y - h * 0.22);
    ctx.bezierCurveTo(x + h * 0.1, y - h * 0.48, x + h * 0.45, y - h * 0.45, x + h * 0.5, y - h * 0.18);
    ctx.bezierCurveTo(x + h * 0.55, y + h * 0.05, x + h * 0.05, y + h * 0.28, x, y + h * 0.35);
    ctx.closePath();
  }
  /**
   * Health over a unit. Yours: a red heart with a white rim, emptying from the top. An enemy's
   * (Sam, 17 Nov: the black one was hard to see): a white heart with a dark rim and an angry face,
   * the white draining from the top as it is hurt; the face shows on both the full and the empty part.
   */
  /** A small gold crown (champions, and their call-out). */
  function crown(ctx, x, y, w) {
    const h = w * 0.62;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + h / 2);
    ctx.lineTo(x - w / 2, y - h * 0.15); ctx.lineTo(x - w * 0.25, y + h * 0.12); ctx.lineTo(x, y - h / 2);
    ctx.lineTo(x + w * 0.25, y + h * 0.12); ctx.lineTo(x + w / 2, y - h * 0.15); ctx.lineTo(x + w / 2, y + h / 2);
    ctx.closePath();
    ctx.fillStyle = '#ffd43b'; ctx.fill();
    ctx.lineWidth = Math.max(1, w * 0.07); ctx.strokeStyle = '#7a4a00'; ctx.stroke();
    ctx.fillStyle = '#ff3c3c';
    ctx.beginPath(); ctx.arc(x, y + h * 0.2, w * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function heart(ctx, x, y, size, frac, mine, elite, champ) {
    const h = size;
    const top = y + h * 0.35 - frac * h * 0.84;
    heartPath(ctx, x, y, h);
    ctx.fillStyle = mine ? 'rgba(60,10,16,0.78)' : 'rgba(26,24,38,0.88)';
    ctx.fill();
    ctx.save();
    heartPath(ctx, x, y, h);
    ctx.clip();
    ctx.fillStyle = mine ? '#ff3a4a' : '#ffffff';
    ctx.fillRect(x - h, top, h * 2, h);
    if (mine) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - h * 0.22, y - h * 0.18, h * 0.12, h * 0.08, -0.5, 0, Math.PI * 2); ctx.fill(); }
    if (!mine) {
      // The face: slanted brows over slit eyes and a frown, dark on white and pale on the empty part.
      const face = (col) => {
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.2, h * 0.08); ctx.lineCap = 'round';
        for (const sd of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(x + sd * h * 0.3, y - h * 0.16); ctx.lineTo(x + sd * h * 0.08, y - h * 0.05); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(x + sd * h * 0.19, y + h * 0.02, h * 0.07, h * 0.045, sd * 0.35, 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath(); ctx.arc(x, y + h * 0.26, h * 0.13, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      };
      ctx.save(); ctx.beginPath(); ctx.rect(x - h, top, h * 2, h * 2); ctx.clip(); face('#2a0a14'); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(x - h, top - h * 2, h * 2, h * 2); ctx.clip(); face('rgba(255,210,210,0.75)'); ctx.restore();
    }
    ctx.restore();
    heartPath(ctx, x, y, h);
    ctx.lineWidth = Math.max(1.6, h * 0.12);
    ctx.strokeStyle = mine ? '#ffffff' : champ ? '#ff6a3c' : elite ? '#ffd43b' : '#1a0a12';
    ctx.stroke();
    if (!mine) { ctx.lineWidth = Math.max(0.8, h * 0.04); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; heartPath(ctx, x, y, h * 1.16); ctx.stroke(); }
  }

  /**
   * The coin pile (Sam, 17 Nov: more detail): an open chest behind a heap of coins, with stacks,
   * gems and, while it is full, a crown on top. Yours a wooden chest lined blue; theirs iron lined
   * red. Painted once for each of eight sizes as it empties, then stamped.
   */
  const pileArt = new Map();
  const PILE_K = 1.6;
  function pileSprite(side, step) {
    const key = side + step;
    if (pileArt.has(key)) return pileArt.get(key);
    const R = BE.PILE_R;
    const Wd = R * 2.8, Ht = R * 2.4;
    const c = document.createElement('canvas');
    c.width = Math.ceil(Wd * PILE_K); c.height = Math.ceil(Ht * PILE_K);
    const g = c.getContext('2d');
    g.scale(PILE_K, PILE_K);
    g.translate(Wd / 2, Ht * 0.64);
    const f = step / 7;
    const r = D.seeded(D.hash('pile|' + side));
    const mine = side === 'you';
    const C = mine ? { wood: '#8a5a2a', woodD: '#5a3a1a', band: '#ffd43b', bandD: '#b8861a', lining: '#2a4ab0' } : { wood: '#3e3e4c', woodD: '#24242e', band: '#d0903a', bandD: '#8a5a1a', lining: '#a02a2a' };
    const line = '#2a1a0a';
    // Shadow on the ground.
    g.fillStyle = 'rgba(0,0,0,0.32)';
    g.beginPath(); g.ellipse(0, R * 0.22, R * 1.25, R * 0.36, 0, 0, Math.PI * 2); g.fill();
    // The chest, behind: an open lid leaning back, its lining, the box with bands and a lock.
    const cw = R * 1.3, ch = R * 0.62, cy = -R * 0.22;
    g.lineJoin = 'round';
    g.fillStyle = C.wood; g.strokeStyle = line; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(-cw / 2, cy - ch); g.lineTo(-cw / 2 + 6, cy - ch - R * 0.62); g.quadraticCurveTo(0, cy - ch - R * 0.82, cw / 2 - 6, cy - ch - R * 0.62); g.lineTo(cw / 2, cy - ch); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C.lining; g.beginPath(); g.moveTo(-cw / 2 + 7, cy - ch - 2); g.lineTo(-cw / 2 + 11, cy - ch - R * 0.52); g.quadraticCurveTo(0, cy - ch - R * 0.68, cw / 2 - 11, cy - ch - R * 0.52); g.lineTo(cw / 2 - 7, cy - ch - 2); g.closePath(); g.fill();
    g.strokeStyle = C.band; g.lineWidth = 4;
    for (const bx of [-cw * 0.3, cw * 0.3]) { g.beginPath(); g.moveTo(bx, cy - ch); g.lineTo(bx * 0.92, cy - ch - R * 0.66); g.stroke(); }
    g.fillStyle = C.wood; g.strokeStyle = line; g.lineWidth = 2.4;
    g.beginPath(); g.rect(-cw / 2, cy - ch, cw, ch); g.fill(); g.stroke();
    g.fillStyle = C.woodD; g.fillRect(-cw / 2 + 2, cy - ch * 0.42, cw - 4, ch * 0.4);
    for (let i = 1; i < 4; i++) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-cw / 2 + 2, cy - ch + (ch * i) / 4); g.lineTo(cw / 2 - 2, cy - ch + (ch * i) / 4); g.stroke(); }
    g.fillStyle = C.band; g.strokeStyle = C.bandD; g.lineWidth = 1.4;
    for (const bx of [-cw * 0.3, cw * 0.3]) { g.fillRect(bx - 4, cy - ch, 8, ch); g.strokeRect(bx - 4, cy - ch, 8, ch); }
    g.fillRect(-cw / 2, cy - ch - 2, cw, 6); g.strokeRect(-cw / 2, cy - ch - 2, cw, 6);
    g.fillStyle = C.band; g.beginPath(); g.roundRect ? g.roundRect(-8, cy - ch * 0.62, 16, 18, 4) : g.rect(-8, cy - ch * 0.62, 16, 18); g.fill(); g.stroke();
    g.fillStyle = '#1a1208'; g.beginPath(); g.arc(0, cy - ch * 0.62 + 7, 2.6, 0, Math.PI * 2); g.fill(); g.fillRect(-1.2, cy - ch * 0.62 + 8, 2.4, 6);
    // Coins brimming over the chest's rim while it is full.
    const coin = (x, y, s, tilt) => {
      g.save(); g.translate(x, y); g.rotate(tilt);
      g.fillStyle = '#a8761a'; g.beginPath(); g.ellipse(0, 2.2 * s, 9 * s, 4.4 * s, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffd84a'; g.strokeStyle = '#a8761a'; g.lineWidth = 1.1;
      g.beginPath(); g.ellipse(0, 0, 9 * s, 4.4 * s, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.strokeStyle = '#e0a82a'; g.lineWidth = 0.9; g.beginPath(); g.ellipse(0, 0, 6 * s, 2.8 * s, 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(255,255,240,0.75)'; g.beginPath(); g.ellipse(-3 * s, -1.4 * s, 2.4 * s, 0.9 * s, -0.2, 0, Math.PI * 2); g.fill();
      g.restore();
    };
    if (f > 0.55) for (let i = 0; i < 9; i++) coin(-cw * 0.4 + (i / 8) * cw * 0.8 + (r() - 0.5) * 6, cy - ch - 2 - r() * 6 * f, 0.9, (r() - 0.5) * 0.6);
    // The heap: coins packed into a mound, drawn from the top down so the nearer ones cover the rest.
    const Hm = R * 0.95 * f, Wb = R * (0.7 + 0.38 * f);
    const coins = [];
    const count = Math.round(24 + 110 * f);
    for (let i = 0; i < count; i++) {
      const u = r() * 2 - 1, d = r();
      const lim = Hm * (1 - u * u);
      coins.push({ x: u * Wb, y: (d - 0.3) * R * 0.34 - r() * lim, s: 0.8 + r() * 0.35, tilt: (r() - 0.5) * 0.9 });
    }
    coins.sort((a, b) => a.y - b.y);
    // Gems and a crown sit among the coins (their places fixed, shown when the heap reaches them).
    const gems = [[-0.45, 0.5, '#e8304a'], [0.35, 0.62, '#3a8aff'], [0.05, 0.3, '#3ad87a'], [-0.15, 0.82, '#c84aff'], [0.55, 0.28, '#ffd0f0']];
    const gem = (x, y, col, s) => {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.fillStyle = col; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(0, -8); g.lineTo(7, -2); g.lineTo(0, 8); g.lineTo(-7, -2); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(0, -8); g.lineTo(3, -2); g.lineTo(-3, -2); g.closePath(); g.fill();
      g.restore();
    };
    let gi = 0;
    for (let ci = 0; ci < coins.length; ci++) {
      const k = coins[ci];
      coin(k.x, k.y, k.s, k.tilt);
      while (gi < gems.length && ci === Math.floor(((gi + 1) / (gems.length + 1)) * coins.length)) {
        const [gx, gh, col] = gems[gi++];
        if (Hm * gh > 6) gem(gx * Wb, -Hm * gh * (1 - gx * gx), col, 1);
      }
    }
    // Two stacks of coins at the sides, shorter as it empties.
    for (const [sx0, n0] of [[-Wb - 8, 7], [Wb + 6, 5]]) {
      const n = Math.max(1, Math.round(n0 * (0.3 + 0.7 * f)));
      for (let i = 0; i < n; i++) coin(sx0 + (i % 2 ? 0.8 : -0.8), R * 0.12 - i * 3.6, 0.85, 0);
    }
    // A crown on top of a full heap.
    if (f > 0.85) {
      const y0 = -Hm - 4;
      g.fillStyle = '#ffd43b'; g.strokeStyle = '#8a5a00'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(-14, y0); g.lineTo(-16, y0 - 14); g.lineTo(-8, y0 - 7); g.lineTo(0, y0 - 18); g.lineTo(8, y0 - 7); g.lineTo(16, y0 - 14); g.lineTo(14, y0); g.closePath(); g.fill(); g.stroke();
      for (const [gx, col] of [[-8, '#e8304a'], [0, '#3a8aff'], [8, '#3ad87a']]) { g.fillStyle = col; g.beginPath(); g.arc(gx, y0 - 3, 2.4, 0, Math.PI * 2); g.fill(); }
    }
    const spr = { c, w: Wd, h: Ht, oy: Ht * 0.64 };
    pileArt.set(key, spr);
    return spr;
  }

  function pile(ctx, side, left, max, t) {
    const p = BE.PILES[side];
    const x = sx(p.x), y = sy(p.y), z = run.cam.zoom;
    const frac = Math.max(0, left / max);
    const spr = pileSprite(side, Math.ceil(frac * 7));
    ctx.drawImage(spr.c, x - (spr.w / 2) * z, y - spr.oy * z, spr.w * z, spr.h * z);
    const heapR = BE.PILE_R * z * (0.55 + 0.45 * frac);
    for (let i = 0; i < 5; i++) { const a = t * 2 + i * 1.7; const k = 0.5 + 0.5 * Math.sin(a * 2.3); if (k < 0.35) continue; const px = x + Math.cos(a) * heapR * 0.6, py = y - heapR * 0.55 + Math.sin(a * 1.3) * heapR * 0.25; ctx.fillStyle = `rgba(255,255,240,${k})`; const s = Math.max(1.5, z * 4) * k; ctx.beginPath(); ctx.moveTo(px, py - s * 2); ctx.lineTo(px + s * 0.5, py - s * 0.5); ctx.lineTo(px + s * 2, py); ctx.lineTo(px + s * 0.5, py + s * 0.5); ctx.lineTo(px, py + s * 2); ctx.lineTo(px - s * 0.5, py + s * 0.5); ctx.lineTo(px - s * 2, py); ctx.lineTo(px - s * 0.5, py - s * 0.5); ctx.closePath(); ctx.fill(); }
    // A banner: blue for yours, red for theirs.
    const fx = x + BE.PILE_R * z * 1.05, fy = y - BE.PILE_R * z * 0.2;
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = Math.max(1.5, z * 4);
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 90 * z); ctx.stroke();
    ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.arc(fx, fy - 92 * z, Math.max(1.5, 4 * z), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = side === 'you' ? '#3a8aff' : '#d83a3a';
    const wave = Math.sin(t * 4) * 6 * z;
    ctx.beginPath(); ctx.moveTo(fx, fy - 88 * z); ctx.quadraticCurveTo(fx + 25 * z, fy - 82 * z + wave, fx + 50 * z, fy - 76 * z); ctx.lineTo(fx + 40 * z, fy - 68 * z + wave * 0.5); ctx.lineTo(fx + 50 * z, fy - 60 * z); ctx.quadraticCurveTo(fx + 25 * z, fy - 62 * z + wave, fx, fy - 58 * z); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = Math.max(1, z * 2); ctx.stroke();
    // The timer ring and seconds left.
    const R = BE.PILE_R * z * 1.45;
    const cy = y - BE.PILE_R * z * 0.3;
    ctx.lineWidth = Math.max(3, 9 * z);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.arc(x, cy, R, 0, Math.PI * 2); ctx.stroke();
    const taking = run.battle.units.some((u) => u.side !== side && u.state === 'capture');
    ctx.strokeStyle = side === 'you' ? (taking && Math.floor(t * 6) % 2 ? '#ff4a4a' : '#5cc8ff') : '#ffb347';
    ctx.beginPath(); ctx.arc(x, cy, R, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    const fs = Math.max(12, 22 * z * 1.4);
    ctx.font = `800 ${fs}px Fredoka, sans-serif`;
    ctx.lineWidth = Math.max(3, fs * 0.22);
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    const label = `${left.toFixed(1)}s`;
    // Beside the ring on the left (below it the card bar covered your pile's seconds; above it the
    // title bar covered theirs).
    ctx.textAlign = 'right';
    const lx = x - R - fs * 0.4, ly = cy + fs * 0.35;
    // Drawn after the hearts (pileLabel), so a crowd at the pile does not hide it.
    (run.pileLabels || (run.pileLabels = [])).push({ label, lx, ly, fs });
  }
  function pileLabels(ctx) {
    for (const p of run.pileLabels || []) {
      ctx.font = `800 ${p.fs}px Fredoka, sans-serif`; ctx.textAlign = 'right';
      ctx.lineWidth = Math.max(3, p.fs * 0.22); ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.strokeText(p.label, p.lx, p.ly);
      ctx.fillStyle = '#ffffff'; ctx.fillText(p.label, p.lx, p.ly);
    }
  }

  function draw(t) {
    const { ctx, battle } = run;
    const z = run.cam.zoom;
    ctx.setTransform(run.dpr, 0, 0, run.dpr, 0, 0);
    ctx.fillStyle = '#0c0d14';
    ctx.fillRect(0, 0, run.vw, run.vh);
    ctx.save();
    if (run.shake > 0) ctx.translate((Math.random() - 0.5) * run.shake, (Math.random() - 0.5) * run.shake);
    ctx.drawImage(run.bg, sx(0), sy(0), W * z, H * z);
    // Your zone lights up for a moment when you tap it.
    if (run.markPulse > 0 || run.drag) { ctx.fillStyle = `rgba(120,210,255,${0.14 * Math.max(run.markPulse, run.drag ? 1 : 0)})`; ctx.fillRect(sx(0), sy(SAFE_Y), W * z, (H - SAFE_Y) * z); }
    // (World 7: no coin pile at their end; the giants' attacks show on the ground first.)
    if (!battle.bossFight) pile(ctx, 'foe', battle.piles.foe, battle.pileMax.foe, t);
    if (battle.zones && battle.zones.length) drawZones(ctx, t, z);
    pile(ctx, 'you', battle.piles.you, battle.pileMax.you, t);
    run.pileLabels = [];
    // The marker: where the next beast comes out.
    const mx = sx(run.marker * W), my = sy(run.markY == null ? BE.PILES.you.y - 30 : run.markY);
    const mr = Math.max(14, 40 * z);
    ctx.globalAlpha = 0.6 + 0.25 * Math.sin(t * 4);
    ctx.fillStyle = '#7ad8ff';
    ctx.beginPath(); ctx.moveTo(mx, my - mr * 0.95 - 8); ctx.lineTo(mx - 11, my - mr * 0.45); ctx.lineTo(mx + 11, my - mr * 0.45); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(mx, my, mr, mr * 0.36, 0, 0, Math.PI * 2); ctx.strokeStyle = '#7ad8ff'; ctx.lineWidth = 2.5; ctx.stroke();
    if (run.markPulse > 0) { ctx.globalAlpha = run.markPulse; ctx.beginPath(); ctx.ellipse(mx, my, mr * (2 - run.markPulse), mr * 0.36 * (2 - run.markPulse), 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // Units, back to front.
    const units = [...battle.units].sort((a, c) => a.y - c.y);
    for (const u of units) { (u.side === 'you' ? drawBeast : drawFoe)(ctx, u, t); if (u.state !== 'dying' && !u.burrowed) statusFx(ctx, u, t, z); }
    for (const s of run.shots) if (s.t >= 0) drawShot(ctx, s, z, t);
    if (battle.mut) drawMutantFx(ctx, t, z);
    // Hearts over everyone still standing, over the top of each one's head.
    for (const u of units) {
      if (u.state === 'dying' || u.burrowed || u.cloakUntil > battle.time || u.mutant) continue;
      const hgt = u.side === 'you' ? u.r * 2.85 : u.r * (D.ENEMIES[u.kind].look.plan === 'float' ? 3.0 : 3.5);
      const size = Math.max(15, Math.min(u.boss ? 42 : 30, u.r * z * (u.boss ? 0.9 : 0.85)));
      const size2 = u.champ ? Math.min(40, size * 1.25) : size;
      const hy = Math.max(run.top + size2 * 0.55 + (u.champ ? size2 * 0.5 : 0), sy(u.y - hgt) - size2 * 0.45);
      heart(ctx, sx(u.x), hy, size2, u.hp / u.maxHp, u.side === 'you', u.elite, u.champ);
      if (u.champ) crown(ctx, sx(u.x), hy - size2 * 0.62, size2 * 0.62);
    }
    pileLabels(ctx);
    drawFx(ctx, z);
    // A lane chosen with your zone off the screen: a line down the lane for a moment, and an arrow
    // at the bottom of the view showing where your beasts will come out.
    if (my > run.vh - run.bottom - 10 || run.laneT > 0) {
      const bx = Math.max(16, Math.min(run.vw - 16, mx)), by = run.vh - run.bottom - 14;
      if (run.laneT > 0) {
        ctx.globalAlpha = Math.min(1, run.laneT) * 0.55;
        ctx.strokeStyle = '#7ad8ff'; ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(bx, run.top + 10); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
      }
      if (my > run.vh - run.bottom - 10) {
        ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 5);
        ctx.fillStyle = '#7ad8ff'; ctx.strokeStyle = '#0a2a44'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx, by + 10); ctx.lineTo(bx - 13, by - 6); ctx.lineTo(bx + 13, by - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (run.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${run.flash * 0.7})`; ctx.fillRect(0, 0, run.vw, run.vh); }
    const midY = run.top + (run.vh - run.top - run.bottom) * 0.42;
    // Waves and rushes are called out across the top of the field.
    if (run.banner) {
      const k = run.banner.t / run.banner.max;
      const a = Math.min(1, k * 4, (1 - k) * 8);
      let fs = Math.min(34, run.vw * 0.085);
      ctx.font = `800 ${fs}px Fredoka, sans-serif`;
      const room = run.vw - 24 - fs * (run.banner.champ ? 3.2 : 1.2);
      const tw = ctx.measureText(run.banner.text).width;
      if (tw > room) fs *= room / tw;
      ctx.globalAlpha = a;
      ctx.fillStyle = run.banner.champ ? 'rgba(130,30,0,0.85)' : 'rgba(90,10,20,0.78)';
      const bw = Math.min(run.vw - 24, fs * (run.banner.text.length * 0.62 + 2) + (run.banner.champ ? fs * 1.6 : 0));
      const by = run.top + (run.vh - run.top - run.bottom) * 0.3;
      ctx.fillRect(run.vw / 2 - bw / 2, by - fs * 0.85, bw, fs * 1.3);
      ctx.fillStyle = '#ffd43b'; ctx.fillRect(run.vw / 2 - bw / 2, by - fs * 0.85, bw, 3); ctx.fillRect(run.vw / 2 - bw / 2, by + fs * 0.45 - 3, bw, 3);
      if (run.banner.champ) { crown(ctx, run.vw / 2 - bw / 2 + fs * 0.75, by - fs * 0.2, fs * 0.8); crown(ctx, run.vw / 2 + bw / 2 - fs * 0.75, by - fs * 0.2, fs * 0.8); }
      ctx.font = `800 ${fs}px Fredoka, sans-serif`; ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff'; ctx.fillText(run.banner.text, run.vw / 2, by + fs * 0.2);
      ctx.globalAlpha = 1;
    }
    // The countdown: three, two, one, Fight!
    if (run.ready && (run.countdown > 0 || run.goT > 0)) {
      const n = Math.ceil(run.countdown);
      const k = run.countdown > 0 ? run.countdown - Math.floor(run.countdown) : run.goT / 0.9;
      const s = run.countdown > 0 ? 1 + (k > 0.75 ? (k - 0.75) * 3 : 0) : 1 + (1 - k) * 0.4;
      const label = run.countdown > 0 ? String(n) : 'Fight!';
      const fs = Math.min(140, run.vw * 0.3) * (run.countdown > 0 ? 1 : 0.6) * s;
      ctx.globalAlpha = run.countdown > 0 ? Math.min(1, k * 3 + 0.25) : Math.min(1, k * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; if (run.countdown > 0) ctx.fillRect(0, run.top, run.vw, run.vh - run.top - run.bottom);
      ctx.font = `900 ${fs}px Fredoka, sans-serif`; ctx.textAlign = 'center';
      ctx.lineWidth = fs * 0.12; ctx.strokeStyle = '#2a1a00'; ctx.strokeText(label, run.vw / 2, midY + fs * 0.35);
      ctx.fillStyle = run.countdown > 0 ? '#ffffff' : '#ffd43b'; ctx.fillText(label, run.vw / 2, midY + fs * 0.35);
      ctx.globalAlpha = 1;
    }
    // A card being dragged.
    if (run.drag) {
      const img = run.cardEls[run.drag.i].querySelector('img');
      ctx.globalAlpha = 0.8;
      if (img.complete && img.naturalWidth) ctx.drawImage(img, run.drag.x - 32, run.drag.y - 32, 64, 64);
      ctx.globalAlpha = 1;
    }
  }

  /** A shot in flight, drawn by its kind. */
  function drawShot(ctx, s, z, t) {
    const k = Math.min(1, s.t / s.dur);
    const at = (q) => {
      let x = s.x + (s.tx - s.x) * q, y = s.y + (s.ty - s.y) * q - Math.sin(q * Math.PI) * s.arc;
      if (s.wobble) { const len = Math.hypot(s.tx - s.x, s.ty - s.y) || 1; const w = Math.sin(q * 12 + s.seed) * 10 * s.wobble; x += (-(s.ty - s.y) / len) * w; y += ((s.tx - s.x) / len) * w; }
      return [sx(x), sy(y)];
    };
    const [x, y] = at(k);
    const [px, py] = at(Math.max(0, k - 0.06));
    const ang = Math.atan2(y - py, x - px);
    const big = s.heavy ? 1.6 : 1;
    const R = Math.max(3, 7 * z * big);
    const glowAt = (gx, gy, r, col, a = 1) => { ctx.globalAlpha = a; ctx.drawImage(ENEMY_ART.glowSprite(col), gx - r, gy - r, r * 2, r * 2); ctx.globalAlpha = 1; };
    const trail = (col, n, r0) => { for (let i = 1; i <= n; i++) { const [tx, ty] = at(Math.max(0, k - i * 0.05)); ctx.globalAlpha = 0.5 * (1 - i / (n + 1)); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(tx, ty, r0 * (1 - i / (n + 2)), 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; };
    ctx.save();
    switch (s.style) {
      case 'arrow': case 'bolt': {
        const L = (s.style === 'bolt' ? 18 : 26) * z * big;
        ctx.translate(x, y); ctx.rotate(ang);
        ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = Math.max(1.5, 2.4 * z); ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, 0); ctx.stroke();
        ctx.fillStyle = '#d8dce4'; ctx.beginPath(); ctx.moveTo(4 * z + 2, 0); ctx.lineTo(-4 * z, -4 * z - 1); ctx.lineTo(-4 * z, 4 * z + 1); ctx.closePath(); ctx.fill();
        ctx.fillStyle = s.style === 'bolt' ? '#3a3a44' : '#f4f0e8'; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(-L - 5 * z, -4 * z - 1); ctx.lineTo(-L + 6 * z, 0); ctx.lineTo(-L - 5 * z, 4 * z + 1); ctx.closePath(); ctx.fill();
        break;
      }
      case 'bullet': {
        const L = 30 * z * big;
        ctx.translate(x, y); ctx.rotate(ang);
        const gr = ctx.createLinearGradient(-L, 0, 0, 0); gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(1, '#fff6c8');
        ctx.strokeStyle = gr; ctx.lineWidth = Math.max(2, 4 * z * big); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, 0); ctx.stroke();
        break;
      }
      case 'laser': case 'beam': {
        // A beam all the way, bright then fading.
        const a = 1 - k;
        const [x0, y0] = [sx(s.x), sy(s.y)], [x1, y1] = [sx(s.tx), sy(s.ty)];
        const col = s.style === 'beam' ? '#fff2b0' : s.col;
        ctx.lineCap = 'round';
        ctx.globalAlpha = a * 0.45; ctx.strokeStyle = col; ctx.lineWidth = Math.max(4, 16 * z * big); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.globalAlpha = a; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, 4 * z * big); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        glowAt(x1, y1, R * 3, col, a);
        break;
      }
      case 'cannonball': trail('rgba(90,90,90,0.8)', 5, R * 1.1); ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(x, y, R * 1.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x - R * 0.4, y - R * 0.4, R * 0.35, 0, Math.PI * 2); ctx.fill(); break;
      case 'stone': case 'rock': {
        if (s.style === 'rock') trail('rgba(140,110,80,0.6)', 3, R * 0.8);
        ctx.translate(x, y); ctx.rotate(s.t * 14);
        ctx.fillStyle = s.style === 'rock' ? '#8a6a48' : '#9a9aa6'; ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 1.2;
        const rr = R * (s.style === 'rock' ? 1.3 : 0.8);
        ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const q = rr * (0.75 + ((i * 37) % 10) / 30); ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q); } ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      }
      case 'potion': {
        ctx.translate(x, y); ctx.rotate(s.t * 10);
        glowAt(0, 0, R * 2.4, s.col, 0.6);
        ctx.fillStyle = s.col; ctx.strokeStyle = '#1c1426'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(0, R * 0.3, R * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#d8c8a8'; ctx.fillRect(-R * 0.3, -R * 1.1, R * 0.6, R * 0.7);
        break;
      }
      case 'note': {
        ctx.font = `800 ${Math.max(12, 26 * z * big)}px serif`; ctx.textAlign = 'center';
        ctx.fillStyle = s.col; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2;
        const ch = Math.floor(s.seed) % 2 ? '♪' : '♫';
        ctx.strokeText(ch, x, y + R); ctx.fillText(ch, x, y + R);
        break;
      }
      case 'fireball': glowAt(x, y, R * 3.2, '#ff7a2a', 0.85); trail('#ff9a3a', 5, R); ctx.fillStyle = '#fff2a0'; ctx.beginPath(); ctx.arc(x, y, R * 0.65, 0, Math.PI * 2); ctx.fill(); break;
      case 'bubble': ctx.fillStyle = 'rgba(120,200,255,0.35)'; ctx.strokeStyle = '#bfe8ff'; ctx.lineWidth = Math.max(1, 1.6 * z); ctx.beginPath(); ctx.arc(x, y, R * 1.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x - R * 0.45, y - R * 0.45, R * 0.3, 0, Math.PI * 2); ctx.fill(); break;
      case 'gust': {
        ctx.translate(x, y); ctx.rotate(ang);
        ctx.strokeStyle = 'rgba(235,250,255,0.9)'; ctx.lineCap = 'round';
        for (const [o, w] of [[0, 1], [-R * 1.2, 0.6]]) { ctx.lineWidth = Math.max(1.5, 3 * z * big * w); ctx.beginPath(); ctx.arc(o, 0, R * 1.4, -1.2, 1.2); ctx.stroke(); }
        break;
      }
      case 'void': glowAt(x, y, R * 2.8, '#b04aff', 0.8); ctx.fillStyle = '#12061e'; ctx.beginPath(); ctx.arc(x, y, R * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ff6be0'; ctx.lineWidth = Math.max(1, 1.5 * z); ctx.beginPath(); ctx.arc(x, y, R * (1.1 + 0.2 * Math.sin(s.t * 30)), 0, Math.PI * 2); ctx.stroke(); break;
      case 'star': {
        glowAt(x, y, R * 2.6, '#7ae8ff', 0.7);
        ctx.translate(x, y); ctx.rotate(s.t * 9);
        ctx.fillStyle = '#fff8c0'; ctx.beginPath();
        for (let i = 0; i < 5; i++) { const a = i * 1.2566 - Math.PI / 2; ctx.lineTo(Math.cos(a) * R * 1.4, Math.sin(a) * R * 1.4); ctx.lineTo(Math.cos(a + 0.628) * R * 0.55, Math.sin(a + 0.628) * R * 0.55); }
        ctx.closePath(); ctx.fill();
        break;
      }
      case 'holy': {
        glowAt(x, y, R * 3, '#ffe9a0', 0.85);
        ctx.strokeStyle = 'rgba(255,240,190,0.9)'; ctx.lineWidth = Math.max(1, 1.4 * z);
        for (let i = 0; i < 6; i++) { const a = s.t * 6 + i; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * R * 0.8, y + Math.sin(a) * R * 0.8); ctx.lineTo(x + Math.cos(a) * R * 1.8, y + Math.sin(a) * R * 1.8); ctx.stroke(); }
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, R * 0.6, 0, Math.PI * 2); ctx.fill();
        break;
      }
      default: glowAt(x, y, R * 2.6, s.col, 0.85); trail(s.col, 4, R * 0.7); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, R * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function swingPhase(u) {
    // Wind-up just before a blow (from the engine's countdown to it), then the strike after.
    if (u.state === 'fight' && u.swing < 0.3) return 0.45 * (1 - u.swing / 0.3);
    const since = run.battle.time - u.lastSwing;
    if (since >= 0 && since < 0.32) return 0.45 + 0.55 * (since / 0.32);
    return -1;
  }
  function nextIsHeavy(u) { return (u.swings + 1) % (u.side === 'you' ? run.battle.heavyEvery : 5) === 0; }

  const motions = new Map();
  /** How a beast moves (walk, hop, fly...): a legend says; for a beast, worked out once by drawing it. */
  function motionOf(id) {
    if (!motions.has(id)) motions.set(id, D.LEGENDS[id] ? D.LEGENDS[id].motion : ART.motion(id));
    return motions.get(id);
  }

  /**
   * A beast, from its picture, posed by squashing, stretching, tilting and moving it. Up close it
   * attacks in its own way (Sam, 18 Nov: more kinds of attack): sluggers rise and slam down,
   * quick ones and hoppers pounce at the enemy, tough ones lean back and ram, fliers swoop, and
   * swimmers roll into it. Ranged beasts rise as their shot gathers and kick back as it goes.
   */
  function drawBeast(ctx, u, t) {
    const sk = evolvedOwned(u.kind) ? u.kind + '*' : u.kind;
    const img = run.sprites[sk];
    if (!img) return;
    const z = run.cam.zoom;
    const S = u.r * 3 * z;
    const mo = motionOf(u.kind);
    const st = beastStyle(u.kind);
    const walk = (run.walk.get(u.uid) || 0) * st.pace;
    let ox = 0, oy = 0, scx = 1, scy = 1, rot = 0, alpha = 1, under = 0;
    if (u.state === 'walk') {
      const ph = walk * Math.PI * 2;
      const foot = Math.abs(Math.sin(ph));
      switch (st.walk) {
        case 'hop': {
          // A bound: crouch, stretch up into the air, squash on landing.
          const air = Math.abs(Math.sin(ph * 0.75));
          oy = -air * S * 0.2;
          scy = air > 0.2 ? 1 + air * 0.08 : 1 - (0.2 - air) * 0.6;
          scx = 2 - scy;
          if (air < 0.08 && !u._landed) { u._landed = true; burst(u.x, u.y, '#c8b8a0', 2, 40, 'smoke'); } else if (air > 0.3) u._landed = false;
          break;
        }
        case 'fly': {
          // Wings beating: quick lifts on each downstroke, a squash and stretch with it.
          const flap = Math.sin(t * 11 + u.uid);
          oy = -S * 0.16 + flap * S * 0.035 + Math.sin(t * 1.7 + u.uid) * S * 0.03;
          scy = 1 + flap * 0.05; scx = 1 - flap * 0.03;
          rot = Math.sin(t * 1.3 + u.uid) * 0.06;
          break;
        }
        case 'float':
          oy = -S * 0.1 + Math.sin(t * 2.2 + u.uid) * S * 0.05;
          rot = Math.sin(t * 1.4 + u.uid) * 0.09;
          if (Math.random() < 0.06) burst(u.x + (Math.random() - 0.5) * u.r, u.y - u.r * 0.6, colourOf(u), 1, 25, 'spark');
          break;
        case 'swim':
          // Undulating through the air as if through water, a bubble now and then.
          ox = Math.sin(ph * 1.2) * S * 0.07;
          oy = -S * 0.07 + Math.sin(t * 2.6 + u.uid) * S * 0.03;
          rot = Math.cos(ph * 1.2) * 0.14;
          if (Math.random() < 0.04) burst(u.x, u.y - u.r * 0.8, '#bfe8ff', 1, 30, 'spark');
          break;
        case 'trot':
          // Quick light steps, up on its toes, a bounce in each.
          oy = -foot * S * 0.07; scy = 1 + foot * 0.04; rot = Math.sin(ph) * 0.05;
          break;
        case 'waddle':
          // Heavy, rocking side to side, squashing down with a thud at each step.
          oy = -foot * S * 0.025; rot = Math.sin(ph) * 0.13; scy = 1 - (1 - foot) * 0.06; scx = 2 - scy;
          if (foot < 0.06 && !u._landed) { u._landed = true; burst(u.x + Math.sin(ph) * u.r * 0.5, u.y, '#b8a890', 2, 35, 'smoke'); } else if (foot > 0.3) u._landed = false;
          break;
        default: // stride: a firm step with a nod
          oy = -foot * S * 0.05; rot = Math.sin(ph) * 0.06; scy = 1 + Math.cos(ph * 2) * 0.025;
      }
    } else {
      oy = Math.sin(t * 2.4 + u.uid) * S * 0.015;
      if (mo === 'fly' || mo === 'float' || mo === 'swim') oy -= S * 0.1;
    }
    const ph = swingPhase(u);
    const heavyNow = ph >= 0 && (ph < 0.45 ? nextIsHeavy(u) : u.lastHeavy);
    const hv = heavyNow ? 1.5 : 1;
    const tgt = u.target;
    let nx = 0, ny = -1;
    if (tgt) { const d = Math.hypot(tgt.x - u.x, tgt.y - u.y) || 1; nx = (tgt.x - u.x) / d; ny = (tgt.y - u.y) / d; }
    const dirx = nx < 0 ? -1 : 1;
    const wind = ph >= 0 && ph < 0.45 ? ph / 0.45 : 0;
    const p = ph >= 0.45 ? (ph - 0.45) / 0.55 : -1;
    const hit = p < 0 ? 0 : Math.sin(Math.min(1, p / 0.7) * Math.PI);
    if (ph >= 0 && !shoots(u)) {
      switch (st.atk) {
        case 'flurry': {
          // Three quick strikes in the time of one.
          if (p < 0) { scx *= 1 + wind * 0.06; scy *= 1 - wind * 0.06; }
          else { const jab = Math.abs(Math.sin(Math.min(1, p / 0.8) * Math.PI * 3)); ox += nx * jab * S * 0.2 * hv; oy += ny * jab * S * 0.2 * hv; rot += dirx * jab * 0.1; scx *= 1 + jab * 0.06; }
          break;
        }
        case 'chomp': {
          // Two bites: squash down onto it, open up, squash again.
          if (p < 0) { scy *= 1 + wind * 0.1; scx *= 1 - wind * 0.05; ox -= nx * wind * S * 0.04; }
          else { const b = Math.abs(Math.sin(Math.min(1, p / 0.8) * Math.PI * 2)); ox += nx * b * S * 0.15 * hv; oy += ny * b * S * 0.15 * hv; scy *= 1 - b * 0.16 * hv; scx *= 1 + b * 0.1 * hv; }
          break;
        }
        case 'stomp': {
          // Up on its back legs, then down hard: a ring of dust.
          if (p < 0) { oy -= wind * S * 0.14 * hv; scy *= 1 + wind * 0.1; rot -= dirx * wind * 0.12; }
          else { const k = p < 0.2 ? 1 - p / 0.2 : 0; oy -= k * S * 0.14 * hv; const sq = p < 0.5 ? Math.sin((p / 0.5) * Math.PI) : 0; scy *= 1 - sq * 0.15; scx *= 1 + sq * 0.12; if (p > 0.15 && !u._stomped) { u._stomped = true; ring(u.x, u.y, u.r * (heavyNow ? 3.2 : 2.2), '#d8c8a8'); } }
          if (p < 0) u._stomped = false;
          break;
        }
        case 'twirl': {
          // A spin into it, trailing sparkles.
          if (p < 0) { oy -= wind * S * 0.08; rot -= dirx * wind * 0.3; }
          else { rot += dirx * Math.min(1, p / 0.7) * Math.PI * 2; ox += nx * hit * S * 0.22 * hv; oy += ny * hit * S * 0.22 * hv; if (Math.random() < 0.5) burst(u.x, u.y - u.r * 0.6, colourOf(u), 1, 60, 'spark'); }
          break;
        }
        case 'slam':
          if (p < 0) { oy -= wind * S * 0.2 * hv; scy *= 1 + wind * 0.08; scx *= 1 - wind * 0.04; }
          else { const k = p < 0.25 ? 1 - p / 0.25 : 0; oy -= k * S * 0.2 * hv; const sq = p < 0.5 ? Math.sin((p / 0.5) * Math.PI) : 0; scy *= 1 - sq * 0.18 * hv; scx *= 1 + sq * 0.16 * hv; ox += nx * sq * S * 0.05; }
          break;
        case 'pounce':
          if (p < 0) { scy *= 1 - wind * 0.1; scx *= 1 + wind * 0.08; oy += wind * S * 0.03; }
          else { ox += nx * hit * S * 0.3 * hv; oy += ny * hit * S * 0.3 * hv - hit * S * 0.18; rot += dirx * hit * 0.25; scy *= 1 + hit * 0.06; }
          break;
        case 'ram':
          if (p < 0) { ox -= nx * wind * S * 0.08; oy -= ny * wind * S * 0.08; rot -= dirx * wind * 0.16; }
          else { ox += nx * hit * S * 0.22 * hv; oy += ny * hit * S * 0.22 * hv; rot += dirx * hit * 0.12; scx *= 1 + hit * 0.1; scy *= 1 - hit * 0.08; }
          break;
        case 'swoop':
          if (p < 0) { oy -= wind * S * 0.18; rot -= dirx * wind * 0.12; }
          else { ox += nx * hit * S * 0.28 * hv; oy += ny * hit * S * 0.28 * hv + hit * S * 0.06; rot += dirx * hit * 0.45; }
          break;
        default: // roll
          if (p < 0) { ox -= nx * wind * S * 0.06; scx *= 1 + wind * 0.06; }
          else { ox += nx * hit * S * 0.24 * hv; oy += ny * hit * S * 0.24 * hv; rot += dirx * (heavyNow ? p * Math.PI * 2 : hit * 0.5); }
      }
    } else if (ph >= 0) {
      if (st.ranged === 'channel') {
        // Up over a glowing ring as the shot gathers, held there as it goes, then down.
        const k = p < 0 ? wind : p < 0.5 ? 1 : 1 - (p - 0.5) / 0.5;
        oy -= k * S * 0.12; under = k; rot += Math.sin(t * 9) * 0.04 * k;
        if (p >= 0 && p < 0.3) { scx *= 1 + (1 - p / 0.3) * 0.08; scy *= 1 - (1 - p / 0.3) * 0.05; }
      } else {
        // Spit: rise as the shot gathers, then a kick back from the target.
        if (p < 0) { oy -= wind * S * 0.06; scx *= 1 + wind * 0.05 * hv; scy *= 1 + wind * 0.05 * hv; }
        else { const k = p < 0.4 ? 1 - p / 0.4 : 0; ox -= nx * k * S * 0.08 * hv; oy -= ny * k * S * 0.08 * hv; scx *= 1 + k * 0.08; scy *= 1 - k * 0.06; }
      }
    }
    if (u.state === 'dying') {
      const d = Math.min(1, u.dyingT / BE.DYING);
      alpha = 1 - d; rot = d * 2.4; scx = scy = 1 - d * 0.6; oy -= d * S * 0.2;
    }
    if (u.state === 'capture') oy -= Math.abs(Math.sin(t * 9)) * S * 0.05;
    const x = sx(u.x), y = sy(u.y);
    // Ground shadow, smaller the higher it is.
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    const fl = Math.max(0.45, 1 + oy / S * 1.6) * (mo === 'fly' || mo === 'float' ? 0.85 : 1);
    ctx.beginPath(); ctx.ellipse(x + ox, y, S * 0.3 * fl, S * 0.09 * fl, 0, 0, Math.PI * 2); ctx.fill();
    // The channelling ring under a long-range beast.
    if (under > 0) {
      ctx.save();
      ctx.globalAlpha = 0.75 * under;
      ctx.strokeStyle = colourOf(u); ctx.lineWidth = Math.max(1.5, 3 * z);
      ctx.beginPath(); ctx.ellipse(x, y, S * 0.36, S * 0.11, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = Math.max(1, 1.5 * z);
      ctx.beginPath(); ctx.ellipse(x, y, S * 0.24, S * 0.075, 0, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 5; i++) { const a = t * 3 + (i * Math.PI * 2) / 5; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * S * 0.3, y + Math.sin(a) * S * 0.09, Math.max(1, 2 * z), 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    // A heavy blow, or a shot, gathering: a glow in the beast's colour.
    if (ph >= 0 && ph < 0.6 && (heavyNow || shoots(u))) {
      const k = ph < 0.45 ? ph / 0.45 : 1;
      ctx.globalAlpha = (heavyNow ? 0.55 : 0.35) * k;
      const gs = S * (heavyNow ? 1.7 : 1.2);
      ctx.drawImage(ENEMY_ART.glowSprite(colourOf(u)), x + ox - gs / 2, y + oy - S * 0.45 - gs / 2, gs, gs);
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + ox, y + oy);
    ctx.rotate(rot);
    ctx.scale(scx * (tgt && dirx < 0 ? -1 : 1), scy);
    // A legend's picture stands on a line higher up its picture than a beast's does.
    const foot = D.LEGENDS[u.kind] ? 0.81 : 0.92;
    ctx.drawImage(img, -S / 2, -S * foot, S, S);
    if (u._hurt > 0 && run.whites[sk]) { ctx.globalAlpha = alpha * u._hurt * 0.75; ctx.drawImage(run.whites[sk], -S / 2, -S * foot, S, S); }
    ctx.restore();
  }

  function drawFoe(ctx, u, t) {
    const z = run.cam.zoom;
    const e = D.ENEMIES[u.kind];
    if (u.burrowed) {
      // A mound of earth on the move, with a spray of dirt.
      const x = sx(u.x), y = sy(u.y), R = u.r * z;
      ctx.fillStyle = '#5a4430'; ctx.beginPath(); ctx.ellipse(x, y, R * 1.1, R * 0.5, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7a5e40'; ctx.beginPath(); ctx.ellipse(x, y - R * 0.12, R * 0.8, R * 0.32, 0, Math.PI, Math.PI * 2); ctx.fill();
      if (Math.random() < 0.15) burst(u.x, u.y, '#8a6a48', 1, 50, 'smoke');
      return;
    }
    const ghost = u.cloakUntil > run.battle.time;
    if (ghost) ctx.globalAlpha = 0.22 + 0.08 * Math.sin(t * 9);
    const ph = swingPhase(u);
    const heavyNow = ph >= 0 && (ph < 0.45 ? nextIsHeavy(u) : u.lastHeavy);
    const pose = {
      t: t + u.uid * 0.37, walk: (run.walk.get(u.uid) || 0) % 1, walkRaw: run.walk.get(u.uid) || 0, atk: ph, heavy: heavyNow,
      hurt: u._hurt || 0, dying: u.state === 'dying' ? Math.min(1, u.dyingT / BE.DYING) : 0,
      capture: u.state === 'capture', seed: u.uid, ranged: shoots(u),
      mut: u.mutant ? MUTANTS.pose(run.battle, u) : null,
    };
    ctx.save();
    ctx.translate(sx(u.x), sy(u.y));
    // Drawn to fill its footprint (battle_data.js enemyRadius), an elite a size up.
    const px = (90 * z * D.enemySize(u.kind) * (u.elite ? 1.15 : 1) * (u.champ ? 1.45 : 1)) / (e.look.size || 1);
    if (u.champ && u.state !== 'dying') {
      // A champion: a red-gold glow and a pulsing ring on the ground round it.
      ctx.globalAlpha = 0.5 + 0.15 * Math.sin(t * 4 + u.uid); ctx.drawImage(ENEMY_ART.glowSprite('#ff6a3c'), -u.r * z * 1.8, -u.r * z * 2.9, u.r * z * 3.6, u.r * z * 3.6);
      const k = (t * 0.8 + u.uid * 0.13) % 1;
      ctx.globalAlpha = 0.85 * (1 - k); ctx.strokeStyle = '#ffb03c'; ctx.lineWidth = Math.max(1.5, 3 * z);
      ctx.beginPath(); ctx.ellipse(0, 0, u.r * z * (0.9 + k * 0.7), u.r * z * (0.3 + k * 0.22), 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (u.boss && !u.mutant) { ctx.globalAlpha = 0.25; ctx.drawImage(ENEMY_ART.glowSprite('#ff3c3c'), -u.r * z * 2.2, -u.r * z * 3.4, u.r * z * 4.4, u.r * z * 4.4); ctx.globalAlpha = 1; }
    if (u.elite && u.state !== 'dying') {
      ctx.globalAlpha = 0.32 + 0.1 * Math.sin(t * 5 + u.uid); ctx.drawImage(ENEMY_ART.glowSprite('#ffd43b'), -u.r * z * 1.9, -u.r * z * 3.3, u.r * z * 3.8, u.r * z * 3.8); ctx.globalAlpha = 1;
    }
    // Something big shakes the ground a little as it walks.
    if ((u.boss || e.look.build === 'heavy') && u.state === 'walk' && Math.abs(Math.sin((pose.walk) * Math.PI * 2)) > 0.97) burst(u.x + (Math.random() - 0.5) * u.r, u.y, '#a89880', 1, 40, 'smoke');
    ENEMY_ART.draw(ctx, u.kind, pose, px);
    ctx.restore();
    if (ghost) ctx.globalAlpha = 1;
  }

  function drawFx(ctx, z) {
    for (const p of run.fx) {
      const a = Math.max(0, p.life / p.max);
      if (p.kind === 'ring') {
        ctx.globalAlpha = a; ctx.strokeStyle = p.col; ctx.lineWidth = Math.max(1.5, 5 * z * a);
        ctx.beginPath(); ctx.ellipse(sx(p.x), sy(p.y), p.r * z * (1 - a * 0.7), p.r * z * (1 - a * 0.7) * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (p.kind === 'text') {
        ctx.globalAlpha = Math.min(1, a * 1.5);
        const fs = Math.max(p.big ? 19 : 12, 26 * z * (p.big ? 1.5 : 1.2));
        ctx.font = `800 ${fs}px Fredoka, sans-serif`; ctx.textAlign = 'center';
        ctx.lineWidth = fs * 0.2; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeText(p.s, sx(p.x), sy(p.y)); ctx.fillStyle = p.col; ctx.fillText(p.s, sx(p.x), sy(p.y));
      } else if (p.kind === 'slash') {
        // A crescent cut across the target.
        const k = 1 - a;
        ctx.globalAlpha = a; ctx.strokeStyle = p.col; ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(2, 7 * z * a);
        ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), p.r * z, p.a - 1.1 + k * 0.6, p.a + 0.2 + k * 1.2); ctx.stroke();
      } else if (p.kind === 'claw') {
        ctx.globalAlpha = a; ctx.strokeStyle = p.col; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, 4 * z * a);
        for (let i = -1; i <= 1; i++) { const x = sx(p.x) + i * p.r * z * 0.35; ctx.beginPath(); ctx.moveTo(x - p.r * z * 0.4, sy(p.y) - p.r * z * 0.6); ctx.lineTo(x + p.r * z * 0.3, sy(p.y) + p.r * z * 0.6); ctx.stroke(); }
      } else if (p.kind === 'fly') {
        const k = 1 - a;
        const x = sx(p.x + (p.tx - p.x) * k), y = sy(p.y + (p.ty - p.y) * k) - Math.sin(k * Math.PI) * 40 * z;
        ctx.globalAlpha = 1; ctx.fillStyle = '#ffd84a'; ctx.strokeStyle = '#a8761a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(x, y, Math.max(2.5, 7 * z), Math.max(2, 5 * z), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.globalAlpha = p.kind === 'smoke' ? a * 0.5 : p.kind === 'wisp' ? a * 0.7 : a;
        ctx.fillStyle = p.col;
        const r = Math.max(1, p.size * z * (p.kind === 'smoke' ? 1 + (1 - a) : 1));
        ctx.beginPath();
        if (p.kind === 'star') { const x = sx(p.x), y = sy(p.y); for (let i = 0; i < 5; i++) { const ang = i * 1.2566 - Math.PI / 2; ctx.lineTo(x + Math.cos(ang) * r * 1.6, y + Math.sin(ang) * r * 1.6); ctx.lineTo(x + Math.cos(ang + 0.628) * r * 0.6, y + Math.sin(ang + 0.628) * r * 0.6); } ctx.closePath(); }
        else if (p.kind === 'coin') ctx.ellipse(sx(p.x), sy(p.y), r, r * 0.7, 0, 0, Math.PI * 2);
        else if (p.kind === 'drop') ctx.ellipse(sx(p.x), sy(p.y), r * 0.7, r, Math.atan2(p.vy, p.vx) + Math.PI / 2, 0, Math.PI * 2);
        else if (p.kind === 'chip') { const x = sx(p.x), y = sy(p.y); const ang = p.rot + p.life * 8; for (let i = 0; i < 4; i++) ctx.lineTo(x + Math.cos(ang + i * 1.57) * r, y + Math.sin(ang + i * 1.57) * r * 0.8); ctx.closePath(); }
        else ctx.arc(sx(p.x), sy(p.y), r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ the HUD
  function hud() {
    const b = run.battle;
    const time = b.result ? b.endAt : b.time;
    const clock = run.screen.querySelector('#bt-clock');
    const under = time <= b.level.starTime;
    // The clock is battle time: at 2× it runs twice as fast, and says so.
    clock.innerHTML = `${fmt(time)}${run.speed > 1 ? ' <small>2×</small>' : ''}`;
    run.screen.querySelector('#bt-star').innerHTML = `<span class="${under ? 'bt-gold' : 'bt-dim'}">★ under ${fmt(b.level.starTime)}</span>`;
    run.screen.querySelector('#bt-count').textContent = `${b.yours.length}/${b.cap} on the field${b.cap > b.maxYours ? ' · home guard' : ''}`;
    const now = performance.now();
    run.screen.querySelector('#bt-tip').classList.toggle('on', now < run.tipUntil || now < run.toastUntil);
    // Mana: the bar, with a mark every ten.
    run.screen.querySelector('#bt-mana-fill').style.width = `${(b.mana / b.manaMax) * 100}%`;
    run.screen.querySelector('#bt-mana-n').textContent = `💧 ${Math.floor(b.mana)}/${b.manaMax}`;
    run.cardEls.forEach((btn, i) => {
      const c = b.cards[i];
      const left = Math.max(0, c.ready - b.time);
      const frac = left / c.cooldown;
      btn.style.setProperty('--cd', `${(frac * 360).toFixed(0)}deg`);
      btn.querySelector('.bt-cd-n').textContent = left > 0 ? Math.ceil(left) : '';
      btn.classList.toggle('ready', left <= 0 && b.mana >= c.cost && b.yours.length < b.cap && !b.result && run.countdown <= 0);
      btn.classList.toggle('poor', b.mana < c.cost);
      btn.classList.toggle('full', b.yours.length >= b.cap);
      // An evolved card whose beast is out with its special unused: the card names the special.
      btn.classList.toggle('special', b.canSpecial(i) && run.countdown <= 0);
    });
    if (b.mut) bossBars(b);
  }

  // ------------------------------------------------------------------ pause, finish, results
  function pause(on) {
    if (!run) return;
    run.paused = on;
    if (!on) return;
    const m = el(`<div class="bt-modal"><div class="bt-panel"><h2>Paused</h2>
      <button class="bt-go" data-a="resume">Keep fighting</button>
      <button class="bt-btn" data-a="quit">Retreat (counts as a loss)</button></div></div>`);
    run.screen.appendChild(m);
    m.querySelector('[data-a=resume]').addEventListener('click', () => { click(); m.remove(); run.paused = false; run.last = performance.now(); });
    m.querySelector('[data-a=quit]').addEventListener('click', () => { click(); m.remove(); run.paused = false; run.retreated = true; run.battle.finish('lost'); });
  }

  function seenNow(id) {
    const b = B();
    if (b.seen[id]) return;
    b.seen[id] = Date.now();
    run.newFoes = (run.newFoes || 0) + 1;
    (run.newFoeIds = run.newFoeIds || []).push(id);
    const e = D.ENEMIES[id];
    text(500, 260, `New foe: ${e.name}`, '#9ae6ff');
  }

  function finish() {
    if (!run) return;
    const r = run;
    const b = B();
    const battle = r.battle;
    const level = r.level;
    const won = battle.result === 'won';
    const time = battle.endAt || battle.time;
    const first = won && !cleared(level.id);
    const starNow = won && time <= level.starTime;
    const newStar = starNow && !b.stars[level.id];
    const rewards = [];
    const perksBefore = D.PERKS.filter((p) => p.unlock(totals())).map((p) => p.id);
    if (won) {
      b.best[level.id] = Math.min(b.best[level.id] || Infinity, Math.round(time));
      if (starNow) b.stars[level.id] = true;
      if (level.boss) b.bosses[level.id] = true;
      const full = battle.piles.you >= battle.pileMax.you;
      if (full && level.n >= 5) b.flawless = (b.flawless || 0) + 1;
      if (!b.fastest || time < b.fastest) b.fastest = Math.round(time);
      if (level.n >= 10 && time < 40) b.blitz = true;
      // The perks' challenges (battle_data.js PERKS).
      const pw = b.perkWon || (b.perkWon = {});
      const elements = new Set(battle.cards.map((c) => (D.T(c.id) || {}).element));
      if (level.n >= 5 && battle.cards.length >= 3 && elements.size === 1) pw.fury = true;
      if (level.n >= 10 && battle.cards.length <= 3 && deckMax(level) === 6) pw.rally = true;
      if (level.boss && full) pw.fortify = true;
      if (level.n >= 10 && !battle.manaFilled) pw.wellspring = true;
      if (level.n >= 10 && battle.deployed <= 12) pw.deep_pool = true;
      if (level.boss && battle.maxTierUsed <= 8) b.underdog = true;
      if (level.n >= 5 && battle.maxTierUsed <= 3) b.lowTierWin = true;
      if (first) {
        const cps = typeof calculateTotalCps === 'function' ? calculateTotalCps() : 0;
        const ess = Math.max(150 * level.n * level.world * level.world, cps * 60 * D.clearMinutes(level.world, level.n));
        grant({ essence: ess, premium: level.boss ? 1 : 0, cap: D.BOSS_CRATE_CAP[level.world], shards: level.world === 7 ? 20 + 5 * level.n : 0 }, rewards, '', level);
      }
      if (newStar && level.world === 7) grant({ shards: 60 }, rewards, '', level);
      if (newStar) {
        const s = totals().stars;
        while (Math.floor(s / 5) > (b.starGifts || 0)) { b.starGifts = (b.starGifts || 0) + 1; grant({ spins: 1 }, rewards, '5 stars', level); }
        const w = D.WORLDS[level.world - 1];
        let all = true;
        for (let n = 1; n <= w.levels; n++) if (!b.stars[`${w.id}-${n}`]) { all = false; break; }
        if (all && !b.chests[w.id]) { b.chests[w.id] = true; grant({ chest: w }, rewards, '', level); }
      }
    }
    // Achievements first (the last of them gives a legend), then any legends now earned.
    const ach = checkAchievements(level);
    const legends = checkLegends();
    const newPerks = D.PERKS.filter((p) => p.unlock(totals()) && !perksBefore.includes(p.id));
    if (legends.length && typeof renderBeastopedia === 'function') { try { renderBeastopedia(); } catch (e) { console.error(e); } }
    saveGame();
    if (typeof updateHUD === 'function') updateHUD();
    if (typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.sting(won, D.WORLDS[level.world - 1].system);
    const w = D.WORLDS[level.world - 1];
    const next = level.n < w.levels ? level.n + 1 : null;
    const m = el(`<div class="bt-modal"><div class="bt-panel ${won ? 'won' : 'lost'}">
      <h2>${won ? 'Victory!' : r.retreated ? 'Retreated' : 'Defeat'}</h2>
      ${first && level.n === w.levels && (level.world === 3 || level.world === 6 || level.world === 7) ? `<div class="bt-finale">${level.world === 3 ? 'You have beaten every world of the Prime solar system!' : level.world === 6 ? 'You have beaten every world of the Low Gravity solar system!' : 'You have beaten the Universal Mutants, the hardest battles in either universe!'}</div>` : ''}
      <div class="bt-result-star ${starNow ? 'on' : ''}">★</div>
      <div class="bt-dim">${won ? `Won in ${fmt(time)}` : battle.piles.you <= 0 ? 'They took your coin pile.' : 'You retreated.'} · star under ${fmt(level.starTime)}${starNow ? (newStar ? ': earned!' : '') : ''}</div>
      ${legends.map((id) => `<div class="bt-legend-new"><img data-legend="${id}" alt=""><div><small>New Folded Legend</small><b>${D.LEGENDS[id].name}, ${D.LEGENDS[id].title}</b><span>Tier ${D.LEGENDS[id].tier} ${RARITIES[D.LEGENDS[id].rarity].name}</span></div></div>`).join('')}
      ${rewards.length ? `<div class="bt-rewards"><div class="bt-rw-head">${won ? 'Level rewards' : 'Rewards'}</div>${rewards.map((x) => `<div>${x}</div>`).join('')}</div>` : ''}
      ${ach.length ? `<div class="bt-rewards ach">${ach.map((a) => `<div><b>🏆 ${a.name}</b>${a.notes.length ? `<span>${a.notes.join(' · ')}</span>` : ''}</div>`).join('')}</div>` : ''}
      ${newPerks.length ? `<div class="bt-rewards perk">${newPerks.map((p) => `<div><b>${perkIcon(p.id)} New perk: ${p.name}</b><span>${PERK_LOOK[p.id].short}. Choose it on a level's screen.</span></div>`).join('')}</div>` : ''}
      ${r.newFoeIds && r.newFoeIds.length ? `<div class="bt-dim">New in the Foe Wiki: ${r.newFoeIds.map((id) => D.ENEMIES[id].name).join(', ')}.</div>` : ''}
      <div class="bt-row">
        <button class="bt-btn" data-a="map">Levels</button>
        <button class="bt-btn" data-a="retry">${won ? 'Play again' : 'Try again'}</button>
        ${won && next ? `<button class="bt-go" data-a="next">Next level</button>` : ''}
      </div></div></div>`);
    r.screen.appendChild(m);
    m.querySelectorAll('img[data-legend]').forEach((img) => LEGEND_ART.picture(img.dataset.legend, 160).then((u) => { img.src = u; }));
    if (legends.length && typeof audio !== 'undefined' && audio && audio.playUnlock) setTimeout(() => audio.playUnlock(D.LEGENDS[legends[0]].rarity), 900);
    const leave = () => {
      window.removeEventListener('resize', resize);
      if (typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.leave();
      r.screen.remove();
      document.body.classList.remove('bt-in-battle');
      run = null;
      if (r.onDone) r.onDone();
    };
    // Levels: back to the world's level grid (the level's own screen closes too).
    m.querySelector('[data-a=map]').addEventListener('click', () => { click(); leave(); const top = sheets[sheets.length - 1]; if (top && sheets.length > 1) top.close(); });
    m.querySelector('[data-a=retry]').addEventListener('click', () => { click(); const deck = r.battle.cards.map((c) => c.id); leave(); start(level, deck, r.onDone, r.battle.cards[0] && r.battle.cards[0].sync); });
    const nb = m.querySelector('[data-a=next]');
    if (nb) nb.addEventListener('click', () => { click(); leave(); const top = sheets[sheets.length - 1]; if (top) top.close(); openLevel(w, next, r.onDone); });
  }

  /** Essence for a crate the meadow had no room for (Sam, 18 Nov): a little, scaled to the level. */
  function crateEssence(level) {
    const n = level ? level.n : 1, w = level ? level.world : 1;
    const cps = typeof calculateTotalCps === 'function' ? calculateTotalCps() : 0;
    return Math.round(Math.max(60 * n * w * w, cps * 20 * (1 + w / 3)));
  }
  /** Room for one more crate in the meadow (it holds five at most, and none while you are in the Hub). */
  const crateRoom = () => !state.inBeastHub && typeof cratesOnField === 'function' && typeof MAX_FIELD_CRATES !== 'undefined' && cratesOnField() < MAX_FIELD_CRATES;

  /** Pay out a reward and note it for the results. */
  function grant(rw, notes, why = '', level = null) {
    if (rw.essence) { state.essence += rw.essence; notes.push(`+${formatNumber(rw.essence)} essence`); }
    // 1.5: hours of your income at once, and an essence boost for a while.
    if (rw.income) { const cps = typeof calculateTotalCps === 'function' ? calculateTotalCps() : 0; const ess = Math.max(1e6, cps * 60 * rw.income); state.essence += ess; notes.push(`+${formatNumber(ess)} essence (${rw.income >= 60 ? `${rw.income / 60} hours` : `${rw.income} minutes`} of your income)`); }
    if (rw.boost) {
      const now = Date.now(), live = (state.rewardBoostUntil || 0) > now;
      state.rewardBoostMult = Math.max(live ? state.rewardBoostMult || 1 : 1, rw.boost.mult);
      state.rewardBoostUntil = Math.max(now, state.rewardBoostUntil || 0) + rw.boost.minutes * 60000;
      notes.push(`Essence x${rw.boost.mult} for ${rw.boost.minutes >= 60 ? `${rw.boost.minutes / 60} hour${rw.boost.minutes > 60 ? 's' : ''}` : `${rw.boost.minutes} minutes`}`);
    }
    if (rw.crates) {
      let dropped = 0, paid = 0;
      for (let i = 0; i < rw.crates; i++) { if (crateRoom()) { spawnCrateOnField(); dropped++; } else paid++; }
      if (dropped) notes.push(`${dropped} crate${dropped > 1 ? 's' : ''} dropped in your meadow`);
      if (paid) { const ess = paid * crateEssence(level); state.essence += ess; notes.push(`+${formatNumber(ess)} essence (no room in the meadow for ${paid} crate${paid > 1 ? 's' : ''})`); }
    }
    if (rw.premium) {
      // A premium crate won in battle may hold a beast up to its cap: Tier 15 for the early ones.
      const cap = rw.cap || 20;
      if (cap >= 20) state.premiumCratesCount += rw.premium;
      else for (let i = 0; i < rw.premium; i++) B().crates.push(cap);
      if (typeof updatePremiumCratesDisplay === 'function') updatePremiumCratesDisplay();
      notes.push(`+${rw.premium} premium crate${rw.premium > 1 ? 's' : ''}${cap < 20 ? ` (up to Tier ${cap})` : ''}, in your spawner bar`);
    }
    if (rw.spins) { B().freeSpins = (B().freeSpins || 0) + rw.spins; if (typeof updateDailySpinHUD === 'function') updateDailySpinHUD(); notes.push(`+${rw.spins} free spin${rw.spins > 1 ? 's' : ''}${why ? ` (${why})` : ''}`); }
    if (rw.legend) notes.push(`The ${D.LEGENDS[rw.legend].name.replace(/^The /, '')} joins you`);
    // 1.5: comet shards (they buy comet eggs on the comet).
    if (rw.shards) { state.cometShards = (state.cometShards || 0) + rw.shards; notes.push(`+${formatNumber(rw.shards)} comet shards`); }
    if (rw.chest && rw.chest.chest.comet && typeof deliverCometBeast === 'function') {
      const id = rw.chest.chest.comet;
      deliverCometBeast(id);
      notes.push(`World chest: ${BEAST_TEMPLATES[id].name} (Tier ${BEAST_TEMPLATES[id].tier} ${RARITIES[BEAST_TEMPLATES[id].rarity].name}), waiting on the comet`);
    } else if (rw.chest) {
      const w = rw.chest;
      const pool = Object.keys(BEAST_TEMPLATES).filter((id) => D.canBattle(id) && D.systemOf(id) === w.system && BEAST_TEMPLATES[id].tier >= w.chest.tier && RANK.indexOf(BEAST_TEMPLATES[id].rarity) >= RANK.indexOf(w.chest.rarity));
      const id = pool[Math.floor(Math.random() * pool.length)];
      if (id) {
        if (state.currentSolarSystem === w.system && !state.inBeastHub) { const p = WORLD.viewPct(45, 50); spawnBeastOnField(id, p.x, p.y, false, false); }
        checkDiscovery(id);
        notes.push(`World chest: ${BEAST_TEMPLATES[id].name} (Tier ${BEAST_TEMPLATES[id].tier} ${RARITIES[BEAST_TEMPLATES[id].rarity].name})`);
      }
    }
  }

  /** The merge achievements (relics.js): the counts they test. */
  function mergeTotals() {
    const s = state.mergeStats || {};
    const boss = ['shadow_fiend', 'shadow_fiend_evolved', 'void_parasite', 'void_parasite_evolved'];
    const all = Object.values(BEAST_TEMPLATES).filter((t) => !t.relic && !t.comet && !boss.includes(t.id));
    return [
      { merges: s.merges || 0, mergesOf: s.mergesOf || {}, mutations: s.mutations || 0, cures: s.cures || 0, evolved: s.evolved || 0 },
      { discovered: all.filter((t) => state.unlockedBeasts.includes(t.id)).length, allBeasts: all.length, prestige: Math.max(state.prestigeLevel || 0, (state.primeSystem && state.primeSystem.prestigeLevel) || 0) },
    ];
  }
  /** A Relic for your meadow, evolved or not (and discovered). */
  function giveRelic(id, evolved, notes) {
    const t = BEAST_TEMPLATES[id];
    if (!t) return;
    if (evolved && !state.unlockedEvolved.includes(id)) state.unlockedEvolved.push(id);
    if (!state.inBeastHub && !document.body.classList.contains('bt-in-battle')) { const p = WORLD.viewPct(45, 48); spawnBeastOnField(id, p.x, p.y, !!evolved, false); }
    checkDiscovery(id);
    notes.push(`${t.name}${evolved ? ' (evolved)' : ''} joins your meadow`);
  }
  /** Merge achievements just earned: their rewards, and a toast for each. */
  function checkMergeAch() {
    if (typeof MERGE_ACH === 'undefined') return;
    const done = B().mach || (B().mach = {});
    const [s, x] = mergeTotals();
    for (const a of MERGE_ACH) {
      if (done[a.id]) continue;
      const [have, need] = a.count(s, x);
      if (have < need) continue;
      done[a.id] = true;
      const notes = [];
      if (a.reward.relic) giveRelic(a.reward.relic, a.reward.evolved, notes);
      grant(a.reward, notes, a.name);
      if (typeof spawnToastNotification === 'function') spawnToastNotification('🏅 ' + a.name, notes.join('. '), a.reward.relic ? getBeastSVG(a.reward.relic, !!a.reward.evolved) : '');
    }
    if (typeof saveGame === 'function') saveGame();
  }

  /** Achievements now earned, each with what it paid ({ name, notes }). */
  function checkAchievements(level = null) {
    const b = B();
    const got = [];
    // Twice round, so earning the last of the others earns the one for all of them.
    for (let pass = 0; pass < 2; pass++) {
      const t = totals();
      for (const a of D.ACHIEVEMENTS) {
        if (b.ach[a.id] || !a.test(t)) continue;
        b.ach[a.id] = Date.now();
        const notes = [];
        grant(a.reward, notes, '', level);
        got.push({ name: a.name, notes });
      }
    }
    return got;
  }
  /** Folded Legends whose challenges are now met join you (never from spins or crates). */
  function checkLegends() {
    const b = B();
    const t = totals();
    const got = [];
    for (const l of D.LEGEND_LIST) {
      if (b.legends[l.id] || !D.legendEarned(l.id, t)) continue;
      b.legends[l.id] = Date.now();
      got.push(l.id);
    }
    return got;
  }

  /** The rules, short. Shown once before the first battle, and from the tab. */
  const HOW = [
    'Tap your blue zone, then a card.',
    'Empty their coin pile before they empty yours.',
    'Win fast for a star.',
  ];
  /**
   * The battle rules, in Settings under Rules (Sam, 18 Nov: the rules were too much text on the
   * level screens): the basics, the rules some levels set, the kinds of level, themes and perks.
   */
  function renderRules() {
    const host = document.getElementById('content-settings');
    if (!host) return;
    let sec = document.getElementById('settings-rules');
    if (!sec) {
      sec = el('<div id="settings-rules"></div>');
      const danger = [...host.querySelectorAll('.shop-section-title')].find((e) => /Danger/.test(e.textContent));
      host.insertBefore(sec, danger || null);
    }
    const row = (icon, name, text) => `<div class="bt-rules-row"><span class="bt-rules-icon">${icon}</span><b>${name}</b><span>${text}</span></div>`;
    const R = D.RULES;
    const was = sec.querySelector('details.bt-rules-all');
    const open = was ? was.open : false;
    sec.innerHTML = `
      <details class="bt-rules-all" ${open ? 'open' : ''}><summary class="shop-section-title">Battle Rules <span class="bt-arrow">▸</span></summary>
      <div class="settings-group bt-rules">
        <div class="bt-rules-h">Basics</div>
        <ul>${HOW.map((s) => `<li>${s}</li>`).join('')}<li>Every beast costs mana. A Tier 1 costs 3, a Tier 10 costs 10 and a Tier 20 costs 17. You hold 50 and get 10 back every 5 seconds.</li><li>Cards also recharge one second per tier.</li><li>Ten of your beasts on the field at most, two more while an enemy takes your coins.</li></ul>
        <div class="bt-rules-h">How beasts fight</div>
        ${row(KIND.single[0], KIND.single[1], 'Hits one enemy up close')}
        ${row(KIND.area[0], KIND.area[1], 'Hits everything near its target, at half strength')}
        ${row(KIND.ranged[0], KIND.ranged[1], 'Shoots one enemy from afar (Range 3 and up)')}
        <div class="bt-rules-h">Evolved forms</div>
        <ul><li>An evolved beast in one of the three left slots of your six has its special.</li><li>Tap it on the field (a gold ring shows it is ready) for its special there, once a battle.</li><li>Drag slots to swap them.</li></ul>
        ${Object.values(D.ABILITIES).map((a) => row(a.icon, a.name, a.text)).join('')}
        <div class="bt-rules-h">Level rules</div>
        ${row(RULE_ICON.quick, R.quick.name, 'Low tiers only')}
        ${row(RULE_ICON.range, R.range.name, 'High Range only')}
        ${row(RULE_ICON.speed, R.speed.name, 'High Speed only')}
        ${row(RULE_ICON.tough, R.tough.name, 'High Health only')}
        ${row(RULE_ICON.rarity, R.rarity.name, R.rarity.short())}
        ${row(RULE_ICON.three, R.three.name, R.three.short())}
        ${row(RULE_ICON.few, R.few.name, R.few.short())}
        ${row(RULE_ICON.slow, R.slow.name, R.slow.short())}
        ${row(RULE_ICON.spring, R.spring.name, R.spring.short())}
        <div class="bt-rules-h">Levels</div>
        ${Object.entries(D.PATTERNS).map(([k, p]) => row(PATTERN_ICON[k] || '•', p.name, p.tip)).join('')}
        ${Object.values(D.THEMES).map((p) => row('✦', p.name, p.tip)).join('')}
        <div class="bt-rules-h">Enemy abilities</div>
        ${Object.values(D.TRAITS).map((a) => row(a.icon, a.name, a.text)).join('')}
        <div class="bt-rules-h">Perks</div>
        ${D.PERKS.map((p) => row(perkIcon(p.id), p.name, `${PERK_LOOK[p.id].short}. ${p.how} to unlock.`)).join('')}
        <div class="bt-rules-h">Sync down</div>
        <ul><li>When a quick cards or plain stock level leaves you too few beasts, Sync down lets yours battle as that level's tier and rarity.</li></ul>
      </div></details>`;
    // Each part folds too: its heading opens what is under it.
    const box = sec.querySelector('.bt-rules');
    const parts = [];
    let cur = null;
    for (const node of [...box.childNodes]) {
      if (node.nodeType === 1 && node.classList.contains('bt-rules-h')) { cur = document.createElement('details'); cur.className = 'bt-rules-part'; const s = document.createElement('summary'); s.textContent = node.textContent; cur.appendChild(s); parts.push(cur); node.remove(); continue; }
      if (cur) cur.appendChild(node); else node.remove();
    }
    parts.forEach((p) => box.appendChild(p));
  }
  /** The Rules in Settings, opened and scrolled to. */
  function showRules() {
    renderRules();
    const tab = document.getElementById('tab-settings');
    if (tab) tab.click();
    setTimeout(() => { const s = document.getElementById('settings-rules'); if (s) { const d = s.querySelector('details.bt-rules-all'); if (d) d.open = true; s.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }, 120);
  }
  function openHow(then) {
    const m = el(`<div class="bt-modal"><div class="bt-panel bt-how"><h2>How to play</h2>
      <ul>${HOW.map((s) => `<li>${s}</li>`).join('')}</ul>
      <button class="bt-go" data-a="ok">Got it</button></div></div>`);
    document.body.appendChild(m);
    m.querySelector('[data-a=ok]').addEventListener('click', () => { click(); m.remove(); B().howSeen = true; if (then) then(); });
  }

  // ================================================================== wiki, achievements, legends
  function openWiki() {
    const sh = sheet('Foe Wiki', `${totals().seen} of ${D.ENEMY_LIST.length} met`);
    const b = B();
    let html = '';
    for (const w of D.WORLDS) {
      const list = D.ENEMY_LIST.filter((x) => x.world === w.id);
      html += `<div class="bt-system">World ${w.id}: ${w.name} <small>${list.filter((e) => b.seen[e.id]).length}/${list.length}</small></div><div class="bt-wiki">`;
      for (const e of list) {
        const seen = !!b.seen[e.id];
        html += `<button class="bt-wiki-cell ${seen ? '' : 'unseen'} ${e.role === 'boss' || e.role === 'mutant' ? 'boss' : ''}" data-id="${e.id}">${stillImg(e.id, 160, !seen)}<span>${seen ? e.name : '???'}</span></button>`;
      }
      html += '</div>';
    }
    sh.body.innerHTML = html;
    fillStills(sh.body);
    sh.body.querySelectorAll('.bt-wiki-cell').forEach((c) => c.addEventListener('click', () => {
      if (!b.seen[c.dataset.id]) { showWarning('Not met yet', 'Meet it in a battle first.'); return; }
      click();
      openFoe(c.dataset.id);
    }));
  }
  function openFoe(id) {
    const e = D.ENEMIES[id];
    const s = D.enemyStats(id, D.levelPoints(e.world, e.debut));
    const roles = { grunt: 'Foot soldier', tank: 'Tough', runner: 'Fast', ranged: 'Shoots from afar', caster: 'Magic from afar', brute: 'Hits hard', swarm: 'Comes in crowds', boss: 'Boss: hits three at once', mutant: 'Giant: many attacks of its own' };
    const kills = B().kills[id] || 0;
    const m = el(`<div class="bt-modal"><div class="bt-panel bt-foe-card">
      <img src="${ENEMY_ART.still(id, 240)}" alt="">
      <h2>${e.name}</h2>
      <div class="bt-diff">${dangerHtml(id)}</div>
      <div class="bt-dim">World ${e.world}: ${D.WORLDS[e.world - 1].name} · first seen at level ${e.debut} · ${roles[e.role]}</div>
      <div>${kindChip(D.enemyAttackKind(id))}${D.traitOf(id) ? ` <span class="bt-kindchip trait">${D.TRAITS[D.traitOf(id)].icon} ${D.TRAITS[D.traitOf(id)].name}</span>` : ''}</div>
      ${D.traitOf(id) ? `<div class="bt-dim">${D.TRAITS[D.traitOf(id)].text}</div>` : ''}
      ${e.role === 'mutant' ? (() => { const n = MUTANTS.bossNotes(id), mv = [...new Set(MUTANTS.BOSSES[id].moves.map((x) => x.name || MOVE_WORD[x.kind]).filter(Boolean))]; return `<div class="bt-mut-chips">${n.weak ? `<span class="bt-mchip weak">Weak to ${n.weak}</span>` : ''}${n.resist ? `<span class="bt-mchip resist">Resists ${n.resist}</span>` : ''}${n.type ? `<span class="bt-mchip">${n.type.icon} ${n.type.name}</span>` : ''}</div><div class="bt-dim">Its attacks: ${mv.join(', ')}.</div>${n.armour ? `<div class="bt-dim">${n.armour}</div>` : ''}${n.twin ? `<div class="bt-dim">${n.twin}</div>` : ''}`; })() : ''}
      <p>${e.note}</p>
      <div class="bt-stats">${statChips(s)}</div>
      <div class="bt-dim">Defeated: ${kills}</div>
      <button class="bt-go" data-a="ok">Close</button></div></div>`);
    document.body.appendChild(m);
    m.querySelector('[data-a=ok]').addEventListener('click', () => { click(); m.remove(); });
    m.addEventListener('click', (ev) => { if (ev.target === m) m.remove(); });
  }

  /** What each achievement counts, as [have, want], for its progress bar. */
  function achProgress(a, t) {
    const num = Number((a.id.match(/_(\d+)$/) || [])[1]);
    if (a.id === 'first_win') return [t.clears, 1];
    if (a.id.startsWith('clear_')) return [t.clears, num];
    if (a.id.startsWith('stars_')) return [t.stars, num];
    if (a.id.startsWith('boss_')) return [t.bosses, num];
    if (a.id.startsWith('world_')) return [Object.keys(B().best).filter((k) => k.startsWith(`${num}-`)).length, D.WORLDS[num - 1].levels];
    if (a.id === 'flawless') return [t.flawless, 1];
    if (a.id === 'flawless_10') return [t.flawless, 10];
    if (a.id === 'foes_all') return [t.seen, D.ENEMY_LIST.length];
    if (a.id.startsWith('foes_')) return [t.seen, num];
    if (a.id === 'all_ach') return [t.achDone, t.achTotal];
    return null;
  }
  const ACH_GROUPS = [
    ['Battles won', '⚔️', (a) => a.id === 'first_win' || a.id.startsWith('clear_')],
    ['Stars', '⭐', (a) => a.id.startsWith('stars_')],
    ['Bosses', '💀', (a) => a.id.startsWith('boss_')],
    ['Worlds', '🏰', (a) => a.id.startsWith('world_')],
    ['Feats', '⚡', (a) => ['blitz', 'underdog', 'flawless', 'flawless_10'].includes(a.id)],
    ['Foes met', '📖', (a) => a.id.startsWith('foes_')],
    ['Perks', '🎖', (a) => a.id.startsWith('perk_')],
    ['Grand Master', '👑', (a) => a.id === 'all_ach'],
  ];
  /** A reward as small pictures: crates, premium crates, spins, or the legend it gives. */
  function rewardChips(rw, got = true) {
    const out = [];
    if (rw.crates) out.push(`<span class="bt-rw"><i>📦</i>${rw.crates}</span>`);
    if (rw.premium) out.push(`<span class="bt-rw premium"><i>🎁</i>${rw.premium}${rw.cap && rw.cap < 20 ? `<small>≤T${rw.cap}</small>` : ''}</span>`);
    if (rw.spins) out.push(`<span class="bt-rw"><i>🎡</i>${rw.spins}</span>`);
    if (rw.essence) out.push(`<span class="bt-rw"><i>✨</i>${formatNumber(rw.essence)}</span>`);
    if (rw.income) out.push(`<span class="bt-rw"><i>✨</i>${rw.income >= 60 ? `${rw.income / 60}h` : `${rw.income}m`} income</span>`);
    if (rw.boost) out.push(`<span class="bt-rw premium"><i>⚡</i>x${rw.boost.mult} ${rw.boost.minutes >= 60 ? `${rw.boost.minutes / 60}h` : `${rw.boost.minutes}m`}</span>`);
    if (rw.shards) out.push(`<span class="bt-rw premium"><i>☄</i>${formatNumber(rw.shards)} shards</span>`);
    if (rw.legend) out.push(`<span class="bt-rw legend"><img data-legend="${rw.legend}" alt="">${D.LEGENDS[rw.legend].name.replace(/^The /, '')}</span>`);
    if (rw.perk) out.push(`<span class="bt-rw perk">${perkIcon(rw.perk)}${D.PERKS.find((p) => p.id === rw.perk).name}</span>`);
    if (rw.relic) out.push(`<span class="bt-rw legend relic ${got ? '' : 'hidden'}"><img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(RELIC_ART.svg(rw.relic, { evolved: !!rw.evolved, noGround: true }))}" alt="">${BEAST_TEMPLATES[rw.relic].name.replace(/^The /, '')}${rw.evolved ? ' ✦' : ''}</span>`);
    return out.join('');
  }
  /** The merge achievements (relics.js), in groups, like the battle ones. */
  const MERGE_GROUPS = [['Merging', '🔀', (a) => /m_merge|m_sparky/.test(a.id)], ['Discovery', '🔎', (a) => /discover/.test(a.id)], ['Mutations', '🧬', (a) => /mutate/.test(a.id)], ['Cures', '💊', (a) => /cure/.test(a.id)], ['Evolution', '✦', (a) => /evolve/.test(a.id)], ['Prestige', '⛰', (a) => /prestige/.test(a.id)]];
  function mergeAchHtml() {
    const done = B().mach || {};
    const [s, x] = mergeTotals();
    let html = '';
    for (const [name, icon, test] of MERGE_GROUPS) {
      const list = MERGE_ACH.filter(test);
      html += `<div class="bt-system">${name} <small>${list.filter((a) => done[a.id]).length}/${list.length}</small></div><div class="bt-achs">`;
      for (const a of list) {
        const got = !!done[a.id];
        const [have, need] = a.count(s, x);
        html += `<div class="bt-ach ${got ? 'done' : ''}">
          <div class="bt-medal"><span>${(a.reward || {}).perk ? perkIcon(a.reward.perk) : icon}</span></div>
          <div class="bt-ach-body"><b>${a.name}</b><span>${a.desc}</span>
            ${got ? '<em class="bt-ach-got">Earned</em>' : `<div class="bt-bar"><i style="width:${Math.min(100, (have / need) * 100)}%"></i></div><em>${Math.min(have, need).toLocaleString()}/${need.toLocaleString()}</em>`}</div>
          <div class="bt-ach-rw">${rewardChips(a.reward, got)}</div>
        </div>`;
      }
      html += '</div>';
    }
    return html;
  }
  function openAchievements(which = 'battle') {
    const b = B();
    const t = totals();
    const mergeDone = Object.keys(b.mach || {}).length;
    const sh = sheet('Achievements', `${Object.keys(b.ach).length + mergeDone} of ${D.ACHIEVEMENTS.length + MERGE_ACH.length} earned`);
    const tabs = `<div class="bt-ach-tabs"><button class="${which === 'battle' ? 'on' : ''}" data-w="battle">Battle</button><button class="${which === 'merge' ? 'on' : ''}" data-w="merge">Merge</button></div>`;
    const bindTabs = () => sh.body.querySelectorAll('.bt-ach-tabs button').forEach((btn) => btn.addEventListener('click', () => { click(); sh.close(); openAchievements(btn.dataset.w); }));
    if (which === 'merge') { sh.body.innerHTML = tabs + mergeAchHtml(); bindTabs(); return; }
    let html = tabs;
    for (const [name, icon, test] of ACH_GROUPS) {
      const list = D.ACHIEVEMENTS.filter(test);
      if (!list.length) continue;
      html += `<div class="bt-system">${name} <small>${list.filter((a) => b.ach[a.id]).length}/${list.length}</small></div><div class="bt-achs">`;
      for (const a of list) {
        const done = !!b.ach[a.id];
        const pr = achProgress(a, t);
        const pct = pr ? Math.min(100, (pr[0] / pr[1]) * 100) : done ? 100 : 0;
        html += `<div class="bt-ach ${done ? 'done' : ''} ${a.id === 'all_ach' ? 'grand' : ''}">
          <div class="bt-medal"><span>${(a.reward || {}).perk ? perkIcon(a.reward.perk) : icon}</span></div>
          <div class="bt-ach-body"><b>${a.name}</b><span>${a.desc}</span>
            ${done ? '<em class="bt-ach-got">Earned</em>' : pr ? `<div class="bt-bar"><i style="width:${pct}%"></i></div><em>${Math.min(pr[0], pr[1])}/${pr[1]}</em>` : ''}</div>
          <div class="bt-ach-rw">${rewardChips(a.reward)}</div>
        </div>`;
      }
      html += '</div>';
    }
    sh.body.innerHTML = html;
    bindTabs();
    sh.body.querySelectorAll('img[data-legend]').forEach((img) => LEGEND_ART.picture(img.dataset.legend, 96, !b.legends[img.dataset.legend]).then((u) => { img.src = u; }));
  }

  /** The Folded Legends: won by challenges in battle, never from spins or crates. */
  function openLegends() {
    const b = B();
    const t = totals();
    const sh = sheet('Folded Legends', `${legendsOwned().length} of ${D.LEGEND_LIST.length} won`);
    sh.body.innerHTML = `<div class="bt-legends">${D.LEGEND_LIST.map((l) => {
        const got = !!b.legends[l.id];
        return `<button class="bt-legend ${got ? 'got' : ''}" data-id="${l.id}" style="--rc:${RARITIES[l.rarity].color}">
          <img data-legend="${l.id}" alt="">
          <b>${got ? l.name : '???'}</b>
          ${got ? `<i class="bt-legend-title">${l.title}</i>` : ''}
          <span>${got ? `Tier ${l.tier} ${RARITIES[l.rarity].name}` : l.how}</span>
          ${got ? '' : `<em>${D.legendProgress(l.id, t)}</em>`}
        </button>`;
      }).join('')}</div>`;
    sh.body.querySelectorAll('img[data-legend]').forEach((img) => LEGEND_ART.picture(img.dataset.legend, 160, !b.legends[img.dataset.legend]).then((u) => { img.src = u; }));
    sh.body.querySelectorAll('.bt-legend').forEach((c) => c.addEventListener('click', () => { click(); openLegend(c.dataset.id); }));
  }
  function openLegend(id) {
    const l = D.LEGENDS[id];
    const got = !!B().legends[id];
    const m = el(`<div class="bt-modal"><div class="bt-panel bt-legend-card" style="--rc:${RARITIES[l.rarity].color}">
      <img alt="">
      <h2>${got ? l.name : '???'}</h2>
      ${got ? `<div class="bt-legend-title big">${l.title[0].toUpperCase() + l.title.slice(1)}</div>` : ''}
      <div style="color:${RARITIES[l.rarity].color};font-weight:800">Tier ${l.tier} ${RARITIES[l.rarity].name} · Folded Legend</div>
      ${got ? `<p>${l.lore}</p><div class="bt-stats">${statChips(D.beastStats(id))}</div>`
        : `<p><b>To win it:</b> ${l.how}.<br><span class="bt-dim">So far ${D.legendProgress(id, totals())}.</span></p>`}
      <button class="bt-go" data-a="ok">Close</button></div></div>`);
    document.body.appendChild(m);
    LEGEND_ART.picture(id, 240, !got).then((u) => { m.querySelector('img').src = u; });
    m.querySelector('[data-a=ok]').addEventListener('click', () => { click(); m.remove(); });
    m.addEventListener('click', (ev) => { if (ev.target === m) m.remove(); });
  }
  /** The Beastopedia gets a third section, after the two solar systems: the Folded Legends. */
  function beastopediaLegends() {
    const grid = document.getElementById('beastopedia-grid');
    if (!grid) return;
    const b = B();
    const n = legendsOwned().length;
    const head = el(`<div class="bt-bp-head"><div><span class="bt-bp-dot"></span><span>Folded Legends</span></div><span class="bt-bp-count">${n} / ${D.LEGEND_LIST.length}</span></div>`);
    grid.appendChild(head);
    const sub = document.createElement('div');
    sub.className = 'beastopedia-grid';
    D.LEGEND_LIST.forEach((l, i) => {
      const got = !!b.legends[l.id];
      const card = el(`<div class="beastopedia-card bt-bp-legend ${got ? '' : 'locked'}" data-legend-id="${l.id}">
        <div class="beastopedia-card-num" style="justify-content:center"><span class="beastopedia-card-rarity rarity-${l.rarity.toLowerCase()}" style="${l.rarity !== 'DARK_MATTER' ? `color:${RARITIES[l.rarity].color};` : ''}font-weight:bold;font-size:8px;text-transform:uppercase;${got ? '' : 'opacity:0.45;'}">${RARITIES[l.rarity].name}</span></div>
        <div class="beastopedia-card-icon"><img alt="" style="width:86%;height:86%;object-fit:contain"></div>
        <div class="beastopedia-card-name" style="font-size:9px;margin-top:4px;text-align:center;">${got ? l.name : '???'}</div>
      </div>`);
      LEGEND_ART.picture(l.id, 128, !got).then((u) => { card.querySelector('img').src = u; });
      card.addEventListener('click', () => { click(); openLegend(l.id); });
      sub.appendChild(card);
    });
    grid.appendChild(sub);
  }

  // ================================================================== hooks into the game
  function init() {
    // Every beast that comes onto the field (merged, hatched, from a crate or the wheel) counts
    // towards its battle version at this prestige.
    if (typeof spawnBeastOnField === 'function' && !spawnBeastOnField.battleHooked) {
      const orig = spawnBeastOnField;
      spawnBeastOnField = function (beastId, ...rest) { const r = orig.call(this, beastId, ...rest); try { noteOwned(beastId); } catch (e) { /* never stop a spawn */ } return r; };
      spawnBeastOnField.battleHooked = true;
    }
    document.addEventListener('visibilitychange', () => {
      if (!run) return;
      if (document.hidden && !run.paused && !run.battle.result) pause(true);
      run.last = performance.now();
    });
    // The first time 1.4 opens: what is on the field now counts at today's prestige.
    const b = B();
    if (!b.seededOwned) { (state.beastsOnField || []).forEach((x) => noteOwned(x.type)); b.seededOwned = true; }
    checkLegends();
    renderRules();
    setTimeout(checkMergeAch, 1500);
    // The tab is Battle now; the Sanctuary sits underneath.
    const tab = document.querySelector('#tab-sanctuary span');
    if (tab) tab.textContent = 'Battle';
    const icon = document.querySelector('#tab-sanctuary svg');
    if (icon) icon.innerHTML = '<path d="M6.9 3.4 3.4 6.9l4.2 4.2-3.3 3.3 1.4 1.4-1.8 1.8 2.1 2.1 1.8-1.8 1.4 1.4 3.3-3.3 3.3 3.3 1.4-1.4 1.8 1.8 2.1-2.1-1.8-1.8 1.4-1.4-3.3-3.3 4.2-4.2-3.5-3.5-4.2 4.2-3.5-3.5L12 7.1 6.9 3.4zm8.2 7.6 3.5-3.5-.4-.4-3.5 3.5.4.4zM5.4 7.3 7.3 5.4l3.3 3.3-1.9 1.9-3.3-3.3z"/>';
    if (typeof renderSanctuary === 'function' && !renderSanctuary.battleHooked) {
      const orig = renderSanctuary;
      renderSanctuary = function (...a) { const r = orig.apply(this, a); try { renderTab(); } catch (e) { console.error(e); } return r; };
      renderSanctuary.battleHooked = true;
    }
    if (typeof renderBeastopedia === 'function' && !renderBeastopedia.battleHooked) {
      const orig = renderBeastopedia;
      renderBeastopedia = function (...a) { const r = orig.apply(this, a); try { beastopediaLegends(); } catch (e) { console.error(e); } return r; };
      renderBeastopedia.battleHooked = true;
      try { renderBeastopedia(); } catch (e) { console.error(e); }
    }
    // The Beastopedia's details show a beast's battle stats too (your best version of it).
    if (typeof updateDetailsModalContent === 'function' && !updateDetailsModalContent.battleHooked) {
      const orig = updateDetailsModalContent;
      updateDetailsModalContent = function (...a) {
        const r = orig.apply(this, a);
        try {
          const id = typeof detailsBeastId !== 'undefined' ? detailsBeastId : null;
          const info = document.getElementById('details-beast-info');
          let box = document.getElementById('details-battle-stats');
          if (!box && info) { box = el('<div id="details-battle-stats" class="bt-details"></div>'); info.after(box); }
          if (box) {
            if (!id || !D.canBattle(id)) { box.innerHTML = ''; }
            else {
              const p = prestigeOf(id);
              box.innerHTML = `<div class="bt-details-title">Battle${p ? ` · Prestige ${p}` : ''} · <b class="bt-mana-cost">💧 ${D.costOf(id)} mana</b> · recharges in ${D.cooldownOf(id)}s</div><div class="bt-stats">${statChips(D.beastStats(id, p))}${kindChip(D.attackKind(id, p))}</div>`;
            }
          }
        } catch (e) { console.error(e); }
        return r;
      };
      updateDetailsModalContent.battleHooked = true;
    }
    renderTab();
  }

  return { init, renderTab, start, openWorld, openLevel, openWiki, openAchievements, openHow, openLegends, openLegend, noteOwned, B, totals, get run() { return run; }, closeSheets, checkMergeAch };
})();
