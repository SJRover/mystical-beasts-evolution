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
    const branch = sys === 'prime' ? state.primeSystem : state.lowGravitySystem;
    return (branch && branch.prestigeLevel) || 0;
  }
  /** A beast has been on your field at this prestige: its battle version is at least that. */
  function noteOwned(id) {
    if (!id || state.inBeastHub || !D.canBattle(id) || D.LEGENDS[id]) return;
    const p = sysPrestige(D.systemOf(id));
    const b = B();
    if ((b.bestPrestige[id] || 0) < p) b.bestPrestige[id] = p;
  }
  const prestigeOf = (id) => B().bestPrestige[id] || 0;
  /** Folded Legends you have won: they battle in every world, Prime and Low Gravity. */
  const legendsOwned = () => D.LEGEND_LIST.map((l) => l.id).filter((id) => B().legends[id]);
  const owned = (sys) => [...state.unlockedBeasts.filter((id) => D.canBattle(id) && D.systemOf(id) === sys && !D.LEGENDS[id]), ...legendsOwned()];
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
    if (w.id === 4) return reachedLowGravity() && cleared(`1-${D.WORLDS[0].levels}`);
    return cleared(`${w.id - 1}-${D.WORLDS[w.id - 2].levels}`);
  };
  const lockText = (w) => (w.id === 4 ? 'Reach the Low Gravity system and win World 1 to open' : `Clear World ${w.id - 1} to open`);
  /** Any level you have won stays open to play again; the next one opens when you win the one before. */
  const levelOpen = (w, n) => worldOpen(w) && (n === 1 || cleared(`${w.id}-${n}`) || cleared(`${w.id}-${n - 1}`));
  function totals() {
    const b = B();
    let worlds = 0, lgWorlds = 0;
    for (const w of D.WORLDS) if (cleared(`${w.id}-${w.levels}`)) { if (w.system === 'prime') worlds++; else lgWorlds++; }
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
      kills, killsOf: b.kills, killsByRole, killsByWorld, lowTierWin: !!b.lowTierWin, achDone, achTotal,
    };
  }

  // ================================================================== pictures
  const pics = new Map();
  /** A beast's picture (a data URL), made once; a Folded Legend's from legends_art.js. */
  function beastPic(id, px = 160) {
    const key = id + '|' + px;
    if (!pics.has(key)) pics.set(key, D.LEGENDS[id] ? LEGEND_ART.picture(id, px, false) : ART.picture('beast', id, false, false, px, true, true));
    return pics.get(key);
  }
  function rarityColour(id) { const t = D.T(id); return (RARITIES[t.rarity] || {}).color || '#fff'; }
  function statChips(s) {
    return `<span class="bt-stat atk">ATK ${s.atk}</span><span class="bt-stat hp">HP ${s.hp}</span><span class="bt-stat spd">SPD ${s.spd}</span><span class="bt-stat rng">RNG ${s.rng}</span>`;
  }
  const miniStats = (s) => `<i class="atk">A${s.atk}</i><i class="hp">H${s.hp}</i><i class="spd">S${s.spd}</i><i class="rng">R${s.rng}</i>`;
  const heartsHtml = (d) => { let s = ''; for (let i = 1; i <= 5; i++) s += `<span class="bt-dstar ${d >= i ? 'full' : d >= i - 0.5 ? 'half' : ''}">★</span>`; return s; };
  const RULE_ICON = { quick: '⏱', range: '🎯', speed: '💨', rarity: '◇', three: '3' };
  function ruleText(rule) {
    const v = rule.value;
    return {
      quick: `Only beasts that recharge in ${v} seconds or less (Tier ${v} and below).`,
      range: `Only beasts with Range ${v} or more.`,
      speed: `Only beasts with Speed ${v} or more.`,
      rarity: 'Only Common and Rare beasts.',
      three: 'Three beasts at most.',
    }[rule.kind];
  }
  const PERK_LOOK = {
    fury: { icon: '🔥', short: 'Heavy hit every 3rd swing' },
    rally: { icon: '⏩', short: 'Cards recharge 25% faster' },
    fortify: { icon: '🛡', short: 'Your pile lasts 20 s' },
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
    }[w.theme];
    const sky = g.createLinearGradient(0, 0, 0, 120);
    sky.addColorStop(0, LOOK.sky[0]); sky.addColorStop(1, LOOK.sky[1]);
    g.fillStyle = sky; g.fillRect(0, 0, 240, 180);
    // Stars over the dark worlds.
    if (['shadow', 'moon', 'rings', 'eclipse', 'invasion'].includes(w.theme)) for (let i = 0; i < 40; i++) { g.globalAlpha = 0.3 + r() * 0.6; g.fillStyle = '#fff'; g.fillRect(r() * 240, r() * 100, 1.5, 1.5); }
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
    if (boss) put(boss.id, 124, 150, 78 / Math.max(1, boss.look.size || 1) * 1.15);
    if (front[1]) put(front[3] ? front[3].id : front[1].id, 62, 170, 62);
    if (front[0]) put(front[0].id, 186, 172, 62);
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
          <div class="bt-world-meta">${open ? `${done >= w.levels ? 'All won' : `Level ${Math.min(w.levels, done + 1)} of ${w.levels}`} · <span class="bt-gold">★ ${stars}/${w.levels}</span>` : lockText(w)}</div>
          <div class="bt-bar"><i style="width:${(done / w.levels) * 100}%"></i></div>
        </div>
        <div class="bt-world-go">${open ? '▶' : '🔒'}</div>
      </button>`;
    };
    const primeWorlds = D.WORLDS.filter((w) => w.system === 'prime').map(worldCard).join('');
    const lgWorlds = D.WORLDS.filter((w) => w.system === 'low_gravity').map(worldCard).join('');
    const spins = b.freeSpins || 0;
    sec.innerHTML = `
      <div class="shop-section-title">Battle</div>
      <div class="sanctuary-intro">Send six of your beasts to fight. Empty the enemy's coin pile before they empty yours.</div>
      <div class="bt-summary">
        <div><b class="bt-gold">★ ${t.stars}</b><span>stars</span></div>
        <div><b>${t.clears}</b><span>levels won</span></div>
        <div><b>${t.bosses}</b><span>bosses</span></div>
        <button id="bt-use-spin" class="${spins ? 'on' : ''}"><b>${spins}</b><span>${spins ? 'spin now ›' : 'free spins'}</span></button>
      </div>
      <div class="bt-system">Prime Solar System</div>
      ${primeWorlds}
      <div class="bt-system">Low Gravity Solar System <small>Low Gravity beasts only</small></div>
      ${lgWorlds}
      <div class="bt-row">
        <button class="bt-btn" id="bt-open-legends">Folded Legends <small>${legendsOwned().length}/${D.LEGEND_LIST.length}</small></button>
        <button class="bt-btn" id="bt-open-how">How to play</button>
      </div>
      <div class="bt-row">
        <button class="bt-btn" id="bt-open-wiki">Foe Wiki <small>${t.seen}/${D.ENEMY_LIST.length}</small></button>
        <button class="bt-btn" id="bt-open-ach">Achievements <small>${Object.keys(b.ach).length}/${D.ACHIEVEMENTS.length}</small></button>
      </div>`;
    sec.querySelectorAll('.bt-world[data-world]').forEach((btn) => btn.addEventListener('click', () => {
      const w = D.WORLDS[Number(btn.dataset.world) - 1];
      if (!worldOpen(w)) { showWarning('World locked', w.id === 4 ? `Reach the Low Gravity solar system (its warp opens at Prime prestige 9) and win World 1 to open ${w.name}.` : `Clear the last level of World ${w.id - 1} to open ${w.name}.`); return; }
      click();
      openWorld(w);
    }));
    sec.querySelector('#bt-use-spin').addEventListener('click', () => {
      if (!(B().freeSpins > 0)) { showWarning('No free spins yet', 'You get a free spin for every five stars, and some achievements give them too.'); return; }
      click();
      if (typeof showDailySpinModal === 'function') showDailySpinModal();
    });
    sec.querySelector('#bt-open-wiki').addEventListener('click', () => { click(); openWiki(); });
    sec.querySelector('#bt-open-how').addEventListener('click', () => { click(); openHow(); });
    sec.querySelector('#bt-open-ach').addEventListener('click', () => { click(); openAchievements(); });
    sec.querySelector('#bt-open-legends').addEventListener('click', () => { click(); openLegends(); });
  }

  // ================================================================== full-screen sheets
  const sheets = [];
  function sheet(title, sub = '') {
    const s = el(`<div class="bt-sheet"><div class="bt-sheet-head"><button class="bt-back" aria-label="Back">‹</button><div class="bt-sheet-title">${title}<small>${sub}</small></div></div><div class="bt-sheet-body"></div></div>`);
    document.body.appendChild(s);
    requestAnimationFrame(() => s.classList.add('on'));
    const close = () => { s.classList.remove('on'); setTimeout(() => s.remove(), 220); const i = sheets.indexOf(api); if (i >= 0) sheets.splice(i, 1); };
    s.querySelector('.bt-back').addEventListener('click', () => { click(); close(); });
    const api = { el: s, body: s.querySelector('.bt-sheet-body'), close };
    sheets.push(api);
    return api;
  }
  const closeSheets = () => { while (sheets.length) sheets[sheets.length - 1].close(); };

  // ------------------------------------------------------------------ a world's levels
  function openWorld(w) {
    const sh = sheet(`World ${w.id}: ${w.name}`, `${w.system === 'prime' ? 'Prime' : 'Low Gravity'} beasts and Folded Legends`);
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
          <img class="bt-level-art" src="${ENEMY_ART.still(feat, 96, !known)}" alt="">
          <span class="bt-level-n">${n}</span>
          ${lv.boss ? '<span class="bt-level-boss">BOSS</span>' : ''}
          ${lv.rule ? `<span class="bt-level-rule" title="${D.RULES[lv.rule.kind].name}">${RULE_ICON[lv.rule.kind]}</span>` : ''}
          ${won ? `<span class="bt-level-done ${b.stars[id] ? 'star' : ''}"><i>✓</i>${b.stars[id] ? '<em>★</em>' : ''}</span>` : ''}
          ${open ? '' : '<span class="bt-level-lock">🔒</span>'}
        </button>`;
      }
      sh.body.innerHTML = `
        <div class="bt-chest ${b.chests[w.id] ? 'done' : ''}"><svg class="bt-chest-icon" viewBox="0 0 48 42"><path d="M4 18 Q4 4 24 4 Q44 4 44 18 Z" fill="#b8762a" stroke="#4a2a0a" stroke-width="2"/><rect x="4" y="18" width="40" height="20" rx="2" fill="#8a5420" stroke="#4a2a0a" stroke-width="2"/><rect x="4" y="16" width="40" height="5" fill="#ffd43b" stroke="#8a5a00" stroke-width="1.5"/><rect x="11" y="4.5" width="5" height="33" fill="#ffd43b" opacity="0.9"/><rect x="32" y="4.5" width="5" height="33" fill="#ffd43b" opacity="0.9"/><rect x="19" y="17" width="10" height="11" rx="2" fill="#ffe680" stroke="#8a5a00" stroke-width="1.5"/><circle cx="24" cy="21.5" r="1.8" fill="#3a2400"/><path d="M14 4 Q24 -3 34 4" fill="none" stroke="#fff6c8" stroke-width="1.5" opacity="0.6"/></svg><div><b>World chest</b><span>One chest for the whole world: earn all ${w.levels} stars in ${w.name} for a guaranteed ${RARITIES[w.chest.rarity].name} or better, Tier ${w.chest.tier} or higher.</span></div><em>${chest}</em></div>
        <div class="bt-dim bt-levels-note">Won levels can be played again, for stars or for the enemies a challenge needs.</div>
        <div class="bt-levels">${tiles}</div>
        <div class="bt-dim bt-rule-key">Rule levels: ⏱ quick cards · 🎯 long reach · 💨 swift · ◇ Commons and Rares · 3 three beasts</div>`;
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
  const deckKey = (sys, level) => (level && level.rule ? `${sys}|${level.rule.kind}|${level.rule.value}` : sys);
  function bestDeck(sys, level) {
    return owned(sys).filter((id) => allowedIn(level, id)).sort((a, c) => powerOf(c) - powerOf(a)).slice(0, deckMax(level));
  }
  function foesOf(level) {
    const ids = [...new Set([...level.spawns.map((s) => s.foe), ...(level.rally || [])])];
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
    let deck = (b.decks[key] || (level.rule ? [] : b.decks[sys]) || []).filter((id) => mine.includes(id) && allowedIn(level, id)).slice(0, max);
    if (!deck.length) deck = bestDeck(sys, level);
    if (!b.pickSort) b.pickSort = { key: 'tier', dir: -1, rarity: 'all' };
    const sort = b.pickSort;
    const known = !!b.played[level.id] || cleared(level.id);
    const sh = sheet(level.boss ? `${n}. ${known ? level.name : 'Boss level'}` : `${w.name} ${n}`, level.boss ? (known ? 'Boss level' : 'Who is it? Play to find out') : D.PATTERNS[level.pattern].name);
    const draw = () => {
      const played = !!b.played[level.id] || cleared(level.id);
      const foes = foesOf(level).map((id) => {
        const known = played && !!b.seen[id];
        const e = D.ENEMIES[id];
        return `<div class="bt-foe ${known ? '' : 'unseen'} ${e.role === 'boss' ? 'boss' : ''}" data-id="${id}"><img src="${ENEMY_ART.still(id, 112, !known)}" alt=""><span>${known ? e.name : '???'}</span></div>`;
      }).join('');
      const slots = [0, 1, 2, 3, 4, 5].map((i) => {
        if (i >= max) return '<div class="bt-slot barred"><span>✕</span></div>';
        const id = deck[i];
        if (!id) return '<div class="bt-slot empty"><span>+</span></div>';
        const t = D.T(id);
        return `<button class="bt-slot ${t.legend ? 'legend' : ''}" data-id="${id}" style="--rc:${rarityColour(id)}"><img data-pic="${id}" alt=""><b>T${t.tier}</b>${prestigeOf(id) ? `<i>P${prestigeOf(id)}</i>` : ''}</button>`;
      }).join('');
      let pool = mine.filter((id) => sort.rarity === 'all' || D.T(id).rarity === sort.rarity);
      pool.sort((a, c) => (sortValue(a, sort.key) - sortValue(c, sort.key)) * sort.dir);
      pool = [...pool.filter((id) => allowedIn(level, id)), ...pool.filter((id) => !allowedIn(level, id))];
      const list = pool.map((id) => {
        const t = D.T(id);
        const s = D.beastStats(id, prestigeOf(id));
        const inDeck = deck.includes(id);
        const ok = allowedIn(level, id);
        return `<button class="bt-pick ${inDeck ? 'in' : ''} ${ok ? '' : 'barred'} ${t.legend ? 'legend' : ''}" data-id="${id}">
          <img data-pic="${id}" alt="">
          <div class="bt-pick-body"><div class="bt-pick-name">${t.name}${prestigeOf(id) ? ` <i class="bt-prest">Prestige ${prestigeOf(id)}</i>` : ''}${t.legend ? ' <i class="bt-prest legend">Legend</i>' : ''}</div>
          <div class="bt-pick-meta"><span style="color:${rarityColour(id)}">Tier ${t.tier} ${RARITIES[t.rarity].name}</span> · recharges in ${D.cooldownOf(id)}s${ok ? '' : ' · <b class="bt-no">not allowed here</b>'}</div>
          <div class="bt-stats">${statChips(s)}</div></div>
          <div class="bt-pick-tick">${ok ? (inDeck ? '✓' : '+') : '✕'}</div>
        </button>`;
      }).join('');
      const best = b.best[level.id];
      const pat = D.PATTERNS[level.pattern];
      const theme = level.theme ? D.THEMES[level.theme] : null;
      const rule = level.rule ? `<div class="bt-rule"><span class="bt-rule-icon">${RULE_ICON[level.rule.kind]}</span><div><b>Rule: ${D.RULES[level.rule.kind].name}</b><span>${ruleText(level.rule)}</span></div></div>` : '';
      sh.body.innerHTML = `
        <div class="bt-card">
          <div class="bt-card-row"><div><b>Enemies</b><span class="bt-dim">${played ? 'tap one you have met to read about it' : 'play this level to see who comes'}</span></div><div class="bt-goal"><span class="bt-gold">★</span> win in under ${fmt(level.starTime)}${best ? `<br><span class="bt-dim">best ${fmt(best)}${b.stars[level.id] ? ' ★' : ''}</span>` : ''}</div></div>
          <div class="bt-foes">${foes}</div>
          <div class="bt-tags"><span class="bt-tag">${pat.name}</span>${theme ? `<span class="bt-tag">${theme.name}</span>` : ''}<span class="bt-dim">${pat.tip}${theme ? ` ${theme.tip}` : ''}</span></div>
          <div class="bt-dim bt-reward">${cleared(level.id) ? 'Won before: play again for the star or a faster time.' : `First win: essence${level.boss ? ' and a premium crate' : ''}.`}</div>
        </div>
        ${rule}
        <div class="bt-card">
          <div class="bt-card-row"><div><b>Your ${max === 6 ? 'six' : 'three'}</b><span class="bt-dim">${sys === 'prime' ? 'Prime' : 'Low Gravity'} beasts you have discovered</span></div><button class="bt-btn small" id="bt-auto">Best ${max === 6 ? 'six' : 'three'}</button></div>
          <div class="bt-slots">${slots}</div>
        </div>
        <div class="bt-card bt-perk-card">
          <div class="bt-card-row"><b>Perk</b><span class="bt-dim">optional</span></div>
          <div class="bt-perks">${D.PERKS.map((p) => { const open = p.unlock(totals()); const L = PERK_LOOK[p.id]; return `<button class="bt-perk ${b.perk === p.id && open ? 'on' : ''} ${open ? '' : 'locked'}" data-perk="${p.id}"><span class="bt-perk-icon">${open ? L.icon : '🔒'}</span><b>${p.name}</b><span>${open ? L.short : p.how}</span></button>`; }).join('')}</div>
        </div>
        <div class="bt-sortbar">
          <div class="bt-sorts">${SORTS.map(([k, name]) => `<button class="bt-sort ${sort.key === k ? 'on' : ''}" data-k="${k}">${name}</button>`).join('')}<button class="bt-sort dir" data-dir="1">${sort.dir < 0 ? '↓ High' : '↑ Low'}</button></div>
          <select class="bt-rarity-filter" aria-label="Rarity">${['all', ...RANK].map((r) => `<option value="${r}" ${sort.rarity === r ? 'selected' : ''}>${r === 'all' ? 'All rarities' : RARITIES[r].name}</option>`).join('')}</select>
        </div>
        <div class="bt-picks">${list || '<div class="bt-dim">No beasts match. Discover beasts in the meadow to battle with them.</div>'}</div>
        <div class="bt-go-bar"><button class="bt-go" ${deck.length ? '' : 'disabled'}>Battle!</button></div>`;
      sh.body.querySelectorAll('img[data-pic]').forEach((img) => beastPic(img.dataset.pic, 128).then((u) => { img.src = u; }));
      sh.body.querySelectorAll('.bt-foe').forEach((f) => f.addEventListener('click', () => { if (played && b.seen[f.dataset.id]) { click(); openFoe(f.dataset.id); } }));
      const toggle = (id) => {
        if (!allowedIn(level, id)) { showWarning('Not allowed here', ruleText(level.rule)); return; }
        if (deck.includes(id)) deck = deck.filter((x) => x !== id);
        else if (deck.length < max) deck.push(id);
        else { showWarning(`${max === 6 ? 'Six' : 'Three'} at most`, 'Take a beast out first.'); return; }
        b.decks[key] = deck.slice();
        click();
        draw();
      };
      sh.body.querySelectorAll('.bt-pick, .bt-slot[data-id]').forEach((p) => p.addEventListener('click', () => toggle(p.dataset.id)));
      sh.body.querySelector('#bt-auto').addEventListener('click', () => { deck = bestDeck(sys, level); b.decks[key] = deck.slice(); click(); draw(); });
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
        const go = () => start(level, deck, () => { draw(); if (onChange) onChange(); renderTab(); });
        if (!b.howSeen) openHow(go); else go();
      });
    };
    draw();
  }

  // ================================================================== the battle
  let run = null;

  function start(level, deck, onDone) {
    if (run) return;
    const cards = deck.map((id) => ({ id, prestige: prestigeOf(id) }));
    const perk = D.PERKS.find((p) => p.id === B().perk && p.unlock(totals()));
    const battle = new BE.Battle(level, cards, perk ? { ...perk.opts, perk: perk.id } : {});
    // Played once (won, lost or left), a level shows who is in it.
    B().played[level.id] = true;
    const rule = level.rule ? ` · ${D.RULES[level.rule.kind].name}` : '';
    const screen = el(`<div id="battle-screen">
      <canvas id="bt-canvas"></canvas>
      <div class="bt-hud">
        <button class="bt-hud-btn" id="bt-pause" aria-label="Pause">❚❚</button>
        <div class="bt-hud-title"><b>${level.boss ? level.name : `${D.WORLDS[level.world - 1].name} ${level.n}`}${perk ? ` · ${perk.name}` : ''}${rule}</b><span id="bt-clock">0:00</span></div>
        <button class="bt-hud-btn" id="bt-view" aria-label="Zoom">⤢</button>
        <button class="bt-hud-btn" id="bt-speed">1×</button>
      </div>
      <div class="bt-tip" id="bt-tip">Tap a spot in your blue zone, then tap a card: the beast comes out there. You can also drag a card onto the field.</div>
      <div class="bt-deck">
        <div class="bt-deck-info"><span id="bt-count">0/10 on the field</span><span id="bt-star"></span></div>
        <div class="bt-cards">${battle.cards.map((c, i) => `<div class="bt-cardcell"><button class="bt-cardbtn" data-i="${i}" style="--rc:${rarityColour(c.id)}"><img alt=""><b>T${D.T(c.id).tier}</b><div class="bt-cd"></div><span class="bt-cd-n"></span></button><div class="bt-cs">${miniStats(c.stats)}</div></div>`).join('')}</div>
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
    cards.forEach((c, i) => beastPic(c.id, 128).then((u) => { run && (run.cardEls[i].querySelector('img').src = u); }));
    Promise.all(cards.map((c) => beastPic(c.id, 256).then((u) => loadSprite(c.id, u)))).then(() => { if (run) { run.ready = true; sfx('count'); } });
    bindBattleInput();
    if (typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.music(level.boss, level.n, D.WORLDS[level.world - 1].system);
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
          else if (e.clientY < run.vh - run.bottom) toast('Let go inside your blue zone to place a beast');
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
        if (inZone(y) && x > 10 && x < W - 10) { setMarker(x, y); sfx('tap'); }
        else if (y > 0 && y < SAFE_Y - 120) toast('Tap inside your blue zone to choose where beasts come out');
      }
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      tapAt = null;
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, run.cam.zoom * (e.deltaY < 0 ? 1.12 : 0.89)); }, { passive: false });
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
    if (!b.canDeploy(i)) {
      if (b.result) return;
      if (b.yours.length >= BE.MAX_YOURS) toast(`${BE.MAX_YOURS} beasts is the most on the field at once`);
      else toast(`${D.T(b.cards[i].id).name} is still recharging`);
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
  /** How fast a shot flies and how high it arcs (a fraction of the distance). */
  const SHOT = {
    arrow: { v: 2600, arc: 0.12 }, bolt: { v: 3000, arc: 0.06 }, bullet: { v: 5200, arc: 0 }, laser: { beam: 0.2 }, beam: { beam: 0.22 },
    cannonball: { v: 1500, arc: 0.3 }, stone: { v: 1700, arc: 0.28 }, potion: { v: 1400, arc: 0.35 }, note: { v: 1300, arc: 0.08, wobble: 1 },
    fireball: { v: 1900, arc: 0.1 }, bubble: { v: 1200, arc: 0.06, wobble: 1 }, gust: { v: 2200, arc: 0.02 }, rock: { v: 1600, arc: 0.26 },
    void: { v: 1600, arc: 0.05, wobble: 1 }, star: { v: 2000, arc: 0.1 }, holy: { v: 1800, arc: 0.06 }, magic: { v: 1800, arc: 0.1, wobble: 1 },
  };

  /** How a beast attacks up close, from how it moves and its best stat. */
  const beastStyles = new Map();
  function beastStyle(id) {
    if (!beastStyles.has(id)) {
      const s = D.beastStats(id, 0);
      const mo = motionOf(id);
      const top = ['atk', 'hp', 'spd'].sort((a, c) => s[c] - s[a])[0];
      beastStyles.set(id, mo === 'fly' || mo === 'float' ? 'swoop' : mo === 'swim' ? 'roll' : mo === 'hop' || top === 'spd' ? 'pounce' : top === 'hp' ? 'ram' : 'slam');
    }
    return beastStyles.get(id);
  }

  function events(list) {
    for (const ev of list) {
      const u = ev.unit;
      switch (ev.type) {
        case 'deploy': sfx('deploy'); burst(u.x, u.y, colourOf(u), 14, 160, 'spark'); ring(u.x, u.y, u.r * 1.8, colourOf(u)); break;
        case 'spawn':
          sfx('spawn');
          if (D.ENEMIES[u.kind].look.shadow) burst(u.x, u.y - 10, '#6a5a8a', 8, 90, 'smoke'); else burst(u.x, u.y, '#c8b8a0', 8, 80, 'smoke');
          if (u.elite) { burst(u.x, u.y - u.r, '#ffd84a', 16, 200, 'star'); ring(u.x, u.y, u.r * 2.2, '#ffd84a'); }
          if (!B().seen[u.kind]) seenNow(u.kind);
          break;
        case 'wave': run.banner = { text: ev.text, t: 2.2, max: 2.2 }; sfx('rally'); break;
        case 'swing':
          if (ev.ranged) {
            const style = shotStyle(u);
            const sp = SHOT[style] || SHOT.magic;
            for (const t of ev.targets) {
              const d = Math.hypot(t.x - u.x, t.y - u.y);
              run.shots.push({ x: u.x, y: u.y - u.r * 1.1, tx: t.x, ty: t.y - t.r * 0.7, t: 0, dur: sp.beam || 0.06 + d / sp.v, arc: (sp.arc || 0) * d, wobble: sp.wobble || 0, style, col: colourOf(u), heavy: ev.heavy, side: u.side, seed: Math.random() * 6 });
            }
            if (ev.heavy) ring(u.x, u.y - u.r, u.r * 2, colourOf(u));
          }
          if (ev.heavy) run.shake = Math.max(run.shake, u.boss ? 9 : 4);
          if (ev.heavy && typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.hit(u, true);
          break;
        case 'hit':
          if (!ev.heavy && typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.hit(ev.by, false);
          hitFx(u, ev.by, ev.heavy);
          if (ev.heavy) text(u.x + u.r * 1.1, u.y - u.r * 1.6, `${Math.round(ev.dmg)}`, '#ffe066');
          u._hurt = 1;
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
        case 'rally': sfx('rally'); text(500, 300, 'Their defenders come out!', '#ff8a8a'); break;
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
      if (!shoots(by) && beastStyle(by.kind) === 'slam') burst(u.x, u.y, '#a89880', 3 * n, 90, 'smoke');
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
  function heart(ctx, x, y, size, frac, mine, elite) {
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
    ctx.strokeStyle = mine ? '#ffffff' : elite ? '#ffd43b' : '#1a0a12';
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
    ctx.strokeText(label, lx, ly);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, lx, ly);
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
    pile(ctx, 'foe', battle.piles.foe, battle.pileMax.foe, t);
    pile(ctx, 'you', battle.piles.you, battle.pileMax.you, t);
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
    for (const u of units) (u.side === 'you' ? drawBeast : drawFoe)(ctx, u, t);
    for (const s of run.shots) drawShot(ctx, s, z, t);
    // Hearts over everyone still standing, over the top of each one's head.
    for (const u of units) {
      if (u.state === 'dying') continue;
      const hgt = u.side === 'you' ? u.r * 2.85 : u.r * (D.ENEMIES[u.kind].look.plan === 'float' ? 3.0 : 3.5);
      const size = Math.max(15, Math.min(u.boss ? 42 : 30, u.r * z * (u.boss ? 0.9 : 0.85)));
      heart(ctx, sx(u.x), Math.max(run.top + size * 0.55, sy(u.y - hgt) - size * 0.45), size, u.hp / u.maxHp, u.side === 'you', u.elite);
    }
    drawFx(ctx, z);
    ctx.restore();
    if (run.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${run.flash * 0.7})`; ctx.fillRect(0, 0, run.vw, run.vh); }
    const midY = run.top + (run.vh - run.top - run.bottom) * 0.42;
    // Waves and rushes are called out across the top of the field.
    if (run.banner) {
      const k = run.banner.t / run.banner.max;
      const a = Math.min(1, k * 4, (1 - k) * 8);
      const fs = Math.min(34, run.vw * 0.085);
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(90,10,20,0.78)';
      const bw = Math.min(run.vw - 24, fs * (run.banner.text.length * 0.62 + 2));
      const by = run.top + 46;
      ctx.fillRect(run.vw / 2 - bw / 2, by - fs * 0.85, bw, fs * 1.3);
      ctx.fillStyle = '#ffd43b'; ctx.fillRect(run.vw / 2 - bw / 2, by - fs * 0.85, bw, 3); ctx.fillRect(run.vw / 2 - bw / 2, by + fs * 0.45 - 3, bw, 3);
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
    const img = run.sprites[u.kind];
    if (!img) return;
    const z = run.cam.zoom;
    const S = u.r * 3 * z;
    const mo = motionOf(u.kind);
    const walk = run.walk.get(u.uid) || 0;
    let ox = 0, oy = 0, scx = 1, scy = 1, rot = 0, alpha = 1;
    if (u.state === 'walk') {
      const ph = walk * Math.PI * 2;
      if (mo === 'hop') { oy = -Math.abs(Math.sin(ph)) * S * 0.14; scy = 1 + Math.sin(ph * 2) * 0.05; }
      else if (mo === 'fly' || mo === 'float' || mo === 'swim') { oy = -S * 0.08 + Math.sin(t * 3 + u.uid) * S * 0.04; rot = Math.sin(t * 2 + u.uid) * 0.05; }
      else { oy = -Math.abs(Math.sin(ph)) * S * 0.05; rot = Math.sin(ph) * 0.06; }
    } else {
      oy = Math.sin(t * 2.4 + u.uid) * S * 0.015;
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
      switch (beastStyle(u.kind)) {
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
      // Ranged: rise as the shot gathers, then a kick back from the target.
      if (p < 0) { oy -= wind * S * 0.06; scx *= 1 + wind * 0.05 * hv; scy *= 1 + wind * 0.05 * hv; }
      else { const k = p < 0.4 ? 1 - p / 0.4 : 0; ox -= nx * k * S * 0.08 * hv; oy -= ny * k * S * 0.08 * hv; scx *= 1 + k * 0.08; scy *= 1 - k * 0.06; }
    }
    if (u.state === 'dying') {
      const d = Math.min(1, u.dyingT / BE.DYING);
      alpha = 1 - d; rot = d * 2.4; scx = scy = 1 - d * 0.6; oy -= d * S * 0.2;
    }
    if (u.state === 'capture') oy -= Math.abs(Math.sin(t * 9)) * S * 0.05;
    const x = sx(u.x), y = sy(u.y);
    // Ground shadow, smaller under a flier.
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    const fl = mo === 'fly' || mo === 'float' ? 0.7 : 1;
    ctx.beginPath(); ctx.ellipse(x, y, S * 0.3 * fl, S * 0.09 * fl, 0, 0, Math.PI * 2); ctx.fill();
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
    ctx.drawImage(img, -S / 2, -S * 0.92, S, S);
    if (u._hurt > 0 && run.whites[u.kind]) { ctx.globalAlpha = alpha * u._hurt * 0.75; ctx.drawImage(run.whites[u.kind], -S / 2, -S * 0.92, S, S); }
    ctx.restore();
  }

  function drawFoe(ctx, u, t) {
    const z = run.cam.zoom;
    const e = D.ENEMIES[u.kind];
    const ph = swingPhase(u);
    const heavyNow = ph >= 0 && (ph < 0.45 ? nextIsHeavy(u) : u.lastHeavy);
    const pose = {
      t: t + u.uid * 0.37, walk: (run.walk.get(u.uid) || 0) % 1, atk: ph, heavy: heavyNow,
      hurt: u._hurt || 0, dying: u.state === 'dying' ? Math.min(1, u.dyingT / BE.DYING) : 0,
      capture: u.state === 'capture', seed: u.uid, ranged: shoots(u),
    };
    ctx.save();
    ctx.translate(sx(u.x), sy(u.y));
    // Drawn to fill its footprint (battle_data.js enemyRadius), an elite a size up.
    const px = (90 * z * D.enemySize(u.kind) * (u.elite ? 1.15 : 1)) / (e.look.size || 1);
    if (u.boss) { ctx.globalAlpha = 0.25; ctx.drawImage(ENEMY_ART.glowSprite('#ff3c3c'), -u.r * z * 2.2, -u.r * z * 3.4, u.r * z * 4.4, u.r * z * 4.4); ctx.globalAlpha = 1; }
    if (u.elite && u.state !== 'dying') {
      ctx.globalAlpha = 0.32 + 0.1 * Math.sin(t * 5 + u.uid); ctx.drawImage(ENEMY_ART.glowSprite('#ffd43b'), -u.r * z * 1.9, -u.r * z * 3.3, u.r * z * 3.8, u.r * z * 3.8); ctx.globalAlpha = 1;
    }
    // Something big shakes the ground a little as it walks.
    if ((u.boss || e.look.build === 'heavy') && u.state === 'walk' && Math.abs(Math.sin((pose.walk) * Math.PI * 2)) > 0.97) burst(u.x + (Math.random() - 0.5) * u.r, u.y, '#a89880', 1, 40, 'smoke');
    ENEMY_ART.draw(ctx, u.kind, pose, px);
    ctx.restore();
  }

  function drawFx(ctx, z) {
    for (const p of run.fx) {
      const a = Math.max(0, p.life / p.max);
      if (p.kind === 'ring') {
        ctx.globalAlpha = a; ctx.strokeStyle = p.col; ctx.lineWidth = Math.max(1.5, 5 * z * a);
        ctx.beginPath(); ctx.ellipse(sx(p.x), sy(p.y), p.r * z * (1 - a * 0.7), p.r * z * (1 - a * 0.7) * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (p.kind === 'text') {
        ctx.globalAlpha = Math.min(1, a * 1.5);
        const fs = Math.max(12, 26 * z * 1.2);
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
    run.screen.querySelector('#bt-count').textContent = `${b.yours.length}/${BE.MAX_YOURS} on the field`;
    const now = performance.now();
    run.screen.querySelector('#bt-tip').classList.toggle('on', now < run.tipUntil || now < run.toastUntil);
    run.cardEls.forEach((btn, i) => {
      const c = b.cards[i];
      const left = Math.max(0, c.ready - b.time);
      const frac = left / c.cooldown;
      btn.style.setProperty('--cd', `${(frac * 360).toFixed(0)}deg`);
      btn.querySelector('.bt-cd-n').textContent = left > 0 ? Math.ceil(left) : '';
      btn.classList.toggle('ready', left <= 0 && b.yours.length < BE.MAX_YOURS && !b.result && run.countdown <= 0);
      btn.classList.toggle('full', b.yours.length >= BE.MAX_YOURS);
    });
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
      if (battle.piles.you >= battle.pileMax.you) b.flawless = (b.flawless || 0) + 1;
      if (!b.fastest || time < b.fastest) b.fastest = Math.round(time);
      if (level.boss && battle.maxTierUsed <= 8) b.underdog = true;
      if (level.n >= 10 && battle.maxTierUsed <= 3) b.lowTierWin = true;
      if (first) {
        const cps = typeof calculateTotalCps === 'function' ? calculateTotalCps() : 0;
        const ess = Math.max(150 * level.n * level.world * level.world, cps * 60 * D.clearMinutes(level.world, level.n));
        grant({ essence: ess, premium: level.boss ? 1 : 0, cap: D.BOSS_CRATE_CAP[level.world] }, rewards, '', level);
      }
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
    if (typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.sting(won);
    const w = D.WORLDS[level.world - 1];
    const next = level.n < w.levels ? level.n + 1 : null;
    const m = el(`<div class="bt-modal"><div class="bt-panel ${won ? 'won' : 'lost'}">
      <h2>${won ? 'Victory!' : r.retreated ? 'Retreated' : 'Defeat'}</h2>
      <div class="bt-result-star ${starNow ? 'on' : ''}">★</div>
      <div class="bt-dim">${won ? `Won in ${fmt(time)}` : battle.piles.you <= 0 ? 'They took your coin pile.' : 'You retreated.'} · star under ${fmt(level.starTime)}${starNow ? (newStar ? ': earned!' : '') : ''}</div>
      ${legends.map((id) => `<div class="bt-legend-new"><img data-legend="${id}" alt=""><div><small>New Folded Legend</small><b>${D.LEGENDS[id].name}</b><span>Tier ${D.LEGENDS[id].tier} ${RARITIES[D.LEGENDS[id].rarity].name}, won for: ${D.LEGENDS[id].how.toLowerCase()}. It battles in every world.</span></div></div>`).join('')}
      ${rewards.length ? `<div class="bt-rewards"><div class="bt-rw-head">${won ? 'Level rewards' : 'Rewards'}</div>${rewards.map((x) => `<div>${x}</div>`).join('')}</div>` : ''}
      ${ach.length ? `<div class="bt-rewards ach">${ach.map((a) => `<div><b>🏆 ${a.name}</b>${a.notes.length ? `<span>${a.notes.join(' · ')}</span>` : ''}</div>`).join('')}</div>` : ''}
      ${newPerks.length ? `<div class="bt-rewards perk">${newPerks.map((p) => `<div><b>${PERK_LOOK[p.id].icon} New perk: ${p.name}</b><span>${PERK_LOOK[p.id].short}. Choose it on a level's screen.</span></div>`).join('')}</div>` : ''}
      ${[...rewards, ...ach.flatMap((a) => a.notes)].some((x) => x.includes('free spin')) ? '<div class="bt-dim">Use free spins from the Battle tab.</div>' : ''}
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
    m.querySelector('[data-a=retry]').addEventListener('click', () => { click(); const deck = r.battle.cards.map((c) => c.id); leave(); start(level, deck, r.onDone); });
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
    if (rw.chest) {
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
  function openHow(then) {
    const m = el(`<div class="bt-modal"><div class="bt-panel bt-how"><h2>How to play</h2>
      <ul>
        <li>Tap a spot in your blue zone, then tap a card. That beast comes out there and walks up the field.</li>
        <li>A card needs to recharge after you play it: one second for each tier. Ten of your beasts can be out at once.</li>
        <li>Stand on the enemy's coin pile to take it. Take it all to win. If they take all of yours, you lose.</li>
        <li>Win fast for a star.</li>
      </ul>
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
        html += `<button class="bt-wiki-cell ${seen ? '' : 'unseen'} ${e.role === 'boss' ? 'boss' : ''}" data-id="${e.id}"><img src="${ENEMY_ART.still(e.id, 160, !seen)}" alt=""><span>${seen ? e.name : '???'}</span></button>`;
      }
      html += '</div>';
    }
    sh.body.innerHTML = html;
    sh.body.querySelectorAll('.bt-wiki-cell').forEach((c) => c.addEventListener('click', () => {
      if (!b.seen[c.dataset.id]) { showWarning('Not met yet', 'Meet this foe in a battle to learn about it.'); return; }
      click();
      openFoe(c.dataset.id);
    }));
  }
  function openFoe(id) {
    const e = D.ENEMIES[id];
    const s = D.enemyStats(id, D.levelPoints(e.world, e.debut));
    const roles = { grunt: 'Foot soldier', tank: 'Tough', runner: 'Fast', ranged: 'Shoots from afar', caster: 'Magic from afar', brute: 'Hits hard', swarm: 'Comes in crowds', boss: 'Boss: hits three at once' };
    const kills = B().kills[id] || 0;
    const m = el(`<div class="bt-modal"><div class="bt-panel bt-foe-card">
      <img src="${ENEMY_ART.still(id, 240)}" alt="">
      <h2>${e.name}</h2>
      <div class="bt-diff">${heartsHtml(D.difficulty(id))}</div>
      <div class="bt-dim">World ${e.world}: ${D.WORLDS[e.world - 1].name} · first seen at level ${e.debut} · ${roles[e.role]}</div>
      <p>${e.note}</p>
      <div class="bt-stats">${statChips(s)}</div>
      <div class="bt-dim">Stats when first met; they grow level by level. Defeated: ${kills}.</div>
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
    ['Grand Master', '👑', (a) => a.id === 'all_ach'],
  ];
  /** A reward as small pictures: crates, premium crates, spins, or the legend it gives. */
  function rewardChips(rw) {
    const out = [];
    if (rw.crates) out.push(`<span class="bt-rw"><i>📦</i>${rw.crates}</span>`);
    if (rw.premium) out.push(`<span class="bt-rw premium"><i>🎁</i>${rw.premium}${rw.cap && rw.cap < 20 ? `<small>≤T${rw.cap}</small>` : ''}</span>`);
    if (rw.spins) out.push(`<span class="bt-rw"><i>🎡</i>${rw.spins}</span>`);
    if (rw.essence) out.push(`<span class="bt-rw"><i>✨</i>${formatNumber(rw.essence)}</span>`);
    if (rw.legend) out.push(`<span class="bt-rw legend"><img data-legend="${rw.legend}" alt="">${D.LEGENDS[rw.legend].name.replace(/^The /, '')}</span>`);
    return out.join('');
  }
  function openAchievements() {
    const b = B();
    const t = totals();
    const sh = sheet('Battle Achievements', `${Object.keys(b.ach).length} of ${D.ACHIEVEMENTS.length} earned`);
    let html = '';
    for (const [name, icon, test] of ACH_GROUPS) {
      const list = D.ACHIEVEMENTS.filter(test);
      if (!list.length) continue;
      html += `<div class="bt-system">${name} <small>${list.filter((a) => b.ach[a.id]).length}/${list.length}</small></div><div class="bt-achs">`;
      for (const a of list) {
        const done = !!b.ach[a.id];
        const pr = achProgress(a, t);
        const pct = pr ? Math.min(100, (pr[0] / pr[1]) * 100) : done ? 100 : 0;
        html += `<div class="bt-ach ${done ? 'done' : ''} ${a.id === 'all_ach' ? 'grand' : ''}">
          <div class="bt-medal"><span>${icon}</span></div>
          <div class="bt-ach-body"><b>${a.name}</b><span>${a.desc}</span>
            ${done ? '<em class="bt-ach-got">Earned</em>' : pr ? `<div class="bt-bar"><i style="width:${pct}%"></i></div><em>${Math.min(pr[0], pr[1])}/${pr[1]}</em>` : ''}</div>
          <div class="bt-ach-rw">${rewardChips(a.reward)}</div>
        </div>`;
      }
      html += '</div>';
    }
    sh.body.innerHTML = html;
    sh.body.querySelectorAll('img[data-legend]').forEach((img) => LEGEND_ART.picture(img.dataset.legend, 96, !b.legends[img.dataset.legend]).then((u) => { img.src = u; }));
  }

  /** The Folded Legends: won by challenges in battle, never from spins or crates. */
  function openLegends() {
    const b = B();
    const t = totals();
    const sh = sheet('Folded Legends', `${legendsOwned().length} of ${D.LEGEND_LIST.length} won · battle rewards only`);
    sh.body.innerHTML = `<div class="bt-dim bt-legends-note">Paper beasts folded from your victories. Each is won by a challenge here, never from the wheel or a crate, and battles in every world, Prime and Low Gravity.</div>
      <div class="bt-legends">${D.LEGEND_LIST.map((l) => {
        const got = !!b.legends[l.id];
        return `<button class="bt-legend ${got ? 'got' : ''}" data-id="${l.id}" style="--rc:${RARITIES[l.rarity].color}">
          <img data-legend="${l.id}" alt="">
          <b>${got ? l.name : '???'}</b>
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
      <div style="color:${RARITIES[l.rarity].color};font-weight:800">Tier ${l.tier} ${RARITIES[l.rarity].name} · Folded Legend</div>
      ${got ? `<p>${l.lore}</p><div class="bt-stats">${statChips(D.beastStats(id))}</div><div class="bt-dim">Recharges in ${l.tier} s. Battles in every world.</div>`
        : `<p><b>To win it:</b> ${l.how}.<br><span class="bt-dim">So far ${D.legendProgress(id, totals())}.</span></p>`}
      <div class="bt-dim">Won in battle only: never from the wheel or a crate.</div>
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
              box.innerHTML = `<div class="bt-details-title">Battle${p ? ` · Prestige ${p}` : ''} · recharges in ${D.cooldownOf(id)}s</div><div class="bt-stats">${statChips(D.beastStats(id, p))}</div>`;
            }
          }
        } catch (e) { console.error(e); }
        return r;
      };
      updateDetailsModalContent.battleHooked = true;
    }
    renderTab();
  }

  return { init, renderTab, start, openWorld, openLevel, openWiki, openAchievements, openHow, openLegends, openLegend, noteOwned, B, totals, get run() { return run; }, closeSheets };
})();
