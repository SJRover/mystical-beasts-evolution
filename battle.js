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
    for (const k of ['best', 'stars', 'seen', 'bosses', 'chests', 'ach', 'bestPrestige']) b[k] = b[k] || {};
    b.decks = b.decks || { prime: [], low_gravity: [] };
    return b;
  }
  function sysPrestige(sys) {
    if (sys === state.currentSolarSystem) return state.prestigeLevel || 0;
    const branch = sys === 'prime' ? state.primeSystem : state.lowGravitySystem;
    return (branch && branch.prestigeLevel) || 0;
  }
  /** A beast has been on your field at this prestige: its battle version is at least that. */
  function noteOwned(id) {
    if (!id || state.inBeastHub || !D.canBattle(id)) return;
    const p = sysPrestige(D.systemOf(id));
    const b = B();
    if ((b.bestPrestige[id] || 0) < p) b.bestPrestige[id] = p;
  }
  const prestigeOf = (id) => B().bestPrestige[id] || 0;
  const owned = (sys) => state.unlockedBeasts.filter((id) => D.canBattle(id) && D.systemOf(id) === sys);
  const cleared = (id) => !!B().best[id];
  const worldOpen = (w) => w.id === 1 || cleared(`${w.id - 1}-${D.WORLDS[w.id - 2].levels}`);
  const levelOpen = (w, n) => worldOpen(w) && (n === 1 || cleared(`${w.id}-${n - 1}`));
  function totals() {
    const b = B();
    let worlds = 0;
    for (const w of D.WORLDS) if (cleared(`${w.id}-${w.levels}`)) worlds++;
    return {
      clears: Object.keys(b.best).length, stars: Object.keys(b.stars).length, bosses: Object.keys(b.bosses).length,
      worlds, seen: Object.keys(b.seen).length, flawless: b.flawless || 0, fastest: b.fastest || 0, underdog: !!b.underdog,
    };
  }

  // ================================================================== pictures
  const pics = new Map();
  /** A beast's picture (a data URL), made once. */
  function beastPic(id, px = 160) {
    const key = id + '|' + px;
    if (!pics.has(key)) pics.set(key, ART.picture('beast', id, false, false, px, true, true));
    return pics.get(key);
  }
  function rarityColour(id) { const t = BEAST_TEMPLATES[id]; return (RARITIES[t.rarity] || {}).color || '#fff'; }
  function statChips(s) {
    return `<span class="bt-stat atk">ATK ${s.atk}</span><span class="bt-stat hp">HP ${s.hp}</span><span class="bt-stat spd">SPD ${s.spd}</span><span class="bt-stat rng">RNG ${s.rng}</span>`;
  }
  const heartsHtml = (d) => { let s = ''; for (let i = 1; i <= 5; i++) s += `<span class="bt-dstar ${d >= i ? 'full' : d >= i - 0.5 ? 'half' : ''}">★</span>`; return s; };

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
    const worlds = D.WORLDS.map((w) => {
      const open = worldOpen(w);
      let done = 0, stars = 0;
      for (let n = 1; n <= w.levels; n++) { if (cleared(`${w.id}-${n}`)) done++; if (b.stars[`${w.id}-${n}`]) stars++; }
      return `<button class="bt-world bt-theme-${w.theme} ${open ? '' : 'locked'}" data-world="${w.id}">
        <div class="bt-world-art"></div>
        <div class="bt-world-body">
          <div class="bt-world-name">World ${w.id}: ${w.name}</div>
          <div class="bt-world-meta">${open ? `Level ${Math.min(w.levels, done + 1)} of ${w.levels} · <span class="bt-gold">★ ${stars}/${w.levels}</span>` : `Clear World ${w.id - 1} to open`}</div>
          <div class="bt-bar"><i style="width:${(done / w.levels) * 100}%"></i></div>
        </div>
        <div class="bt-world-go">${open ? '▶' : '🔒'}</div>
      </button>`;
    }).join('');
    sec.innerHTML = `
      <div class="shop-section-title">Battle</div>
      <div class="sanctuary-intro">Send six of your beasts to fight. Empty the enemy's coin pile before they empty yours.</div>
      <div class="bt-summary">
        <div><b class="bt-gold">★ ${t.stars}</b><span>stars</span></div>
        <div><b>${t.clears}</b><span>levels won</span></div>
        <div><b>${t.bosses}</b><span>bosses</span></div>
        <div><b>${b.freeSpins || 0}</b><span>free spins</span></div>
      </div>
      <div class="bt-system">Prime Solar System</div>
      ${worlds}
      <div class="bt-world locked bt-theme-lowgrav"><div class="bt-world-art"></div><div class="bt-world-body"><div class="bt-world-name">Low Gravity worlds</div><div class="bt-world-meta">After the Star Invasion: battles with your Low Gravity beasts. Coming soon.</div></div><div class="bt-world-go">🔒</div></div>
      <div class="bt-row">
        <button class="bt-btn" id="bt-open-how">How battles work</button>
      </div>
      <div class="bt-row">
        <button class="bt-btn" id="bt-open-wiki">Foe Wiki <small>${t.seen}/${D.ENEMY_LIST.length}</small></button>
        <button class="bt-btn" id="bt-open-ach">Achievements <small>${Object.keys(b.ach).length}/${D.ACHIEVEMENTS.length}</small></button>
      </div>`;
    sec.querySelectorAll('.bt-world[data-world]').forEach((btn) => btn.addEventListener('click', () => {
      const w = D.WORLDS[Number(btn.dataset.world) - 1];
      if (!worldOpen(w)) { showWarning('World locked', `Clear the last level of World ${w.id - 1} to open ${w.name}.`); return; }
      click();
      openWorld(w);
    }));
    sec.querySelector('#bt-open-wiki').addEventListener('click', () => { click(); openWiki(); });
    sec.querySelector('#bt-open-how').addEventListener('click', () => { click(); openHow(); });
    sec.querySelector('#bt-open-ach').addEventListener('click', () => { click(); openAchievements(); });
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
    const sh = sheet(`World ${w.id}: ${w.name}`, `${w.system === 'prime' ? 'Prime' : 'Low Gravity'} beasts only`);
    const draw = () => {
      const b = B();
      let stars = 0;
      for (let n = 1; n <= w.levels; n++) if (b.stars[`${w.id}-${n}`]) stars++;
      const chest = b.chests[w.id] ? 'Opened' : `${stars}/${w.levels} stars`;
      let tiles = '';
      for (let n = 1; n <= w.levels; n++) {
        const id = `${w.id}-${n}`;
        const open = levelOpen(w, n);
        const boss = n % D.BOSS_EVERY === 0;
        tiles += `<button class="bt-level ${open ? '' : 'locked'} ${cleared(id) ? 'won' : ''} ${boss ? 'boss' : ''}" data-n="${n}">
          <span class="bt-level-n">${boss ? '☠' : n}</span>
          <span class="bt-level-star ${b.stars[id] ? 'on' : ''}">★</span>
          ${cleared(id) ? `<span class="bt-level-time">${fmt(b.best[id])}</span>` : ''}
        </button>`;
      }
      sh.body.innerHTML = `
        <div class="bt-chest ${b.chests[w.id] ? 'done' : ''}"><div class="bt-chest-icon"></div><div><b>World chest</b><span>Every star in ${w.name}: a guaranteed ${RARITIES[w.chest.rarity].name} or better, Tier ${w.chest.tier} or higher.</span></div><em>${chest}</em></div>
        <div class="bt-levels">${tiles}</div>`;
      sh.body.querySelectorAll('.bt-level').forEach((btn) => btn.addEventListener('click', () => {
        const n = Number(btn.dataset.n);
        if (!levelOpen(w, n)) { showWarning('Level locked', `Win level ${n - 1} first.`); return; }
        click();
        openLevel(w, n, draw);
      }));
    };
    draw();
  }

  // ------------------------------------------------------------------ a level: foes, star, deck
  function bestDeck(sys) {
    return owned(sys).sort((a, c) => {
      const sa = D.beastStats(a, prestigeOf(a)), sc = D.beastStats(c, prestigeOf(c));
      const pa = sa.atk * sa.hp, pc = sc.atk * sc.hp;
      return pc - pa;
    }).slice(0, 6);
  }
  function foesOf(level) {
    const ids = [...new Set([...level.spawns.map((s) => s.foe), ...(level.rally || [])])];
    return ids.sort((a, c) => (D.ENEMIES[a].role === 'boss') - (D.ENEMIES[c].role === 'boss') || D.ENEMIES[a].debut - D.ENEMIES[c].debut);
  }
  function openLevel(w, n, onChange) {
    const level = D.level(w.id, n);
    const sys = w.system;
    const b = B();
    let deck = (b.decks[sys] || []).filter((id) => state.unlockedBeasts.includes(id) && D.canBattle(id) && D.systemOf(id) === sys).slice(0, 6);
    if (!deck.length) deck = bestDeck(sys);
    const sh = sheet(level.boss ? `${n}. ${level.name}` : `${w.name} ${n}`, level.boss ? 'Boss level' : '');
    const draw = () => {
      const foes = foesOf(level).map((id) => {
        const seen = !!b.seen[id];
        const e = D.ENEMIES[id];
        return `<div class="bt-foe ${seen ? '' : 'unseen'} ${e.role === 'boss' ? 'boss' : ''}" data-id="${id}" title="${seen ? e.name : '???'}"><img src="${ENEMY_ART.still(id, 72, !seen)}" alt=""><span>${seen ? e.name : '???'}</span></div>`;
      }).join('');
      const slots = [0, 1, 2, 3, 4, 5].map((i) => {
        const id = deck[i];
        if (!id) return `<div class="bt-slot empty"><span>+</span></div>`;
        const t = BEAST_TEMPLATES[id];
        return `<button class="bt-slot" data-id="${id}" style="--rc:${rarityColour(id)}"><img data-pic="${id}" alt=""><b>T${t.tier}</b>${prestigeOf(id) ? `<i>P${prestigeOf(id)}</i>` : ''}</button>`;
      }).join('');
      const list = owned(sys).sort((a, c) => BEAST_TEMPLATES[c].tier - BEAST_TEMPLATES[a].tier || RANK.indexOf(BEAST_TEMPLATES[c].rarity) - RANK.indexOf(BEAST_TEMPLATES[a].rarity)).map((id) => {
        const t = BEAST_TEMPLATES[id];
        const s = D.beastStats(id, prestigeOf(id));
        const inDeck = deck.includes(id);
        return `<button class="bt-pick ${inDeck ? 'in' : ''}" data-id="${id}">
          <img data-pic="${id}" alt="">
          <div class="bt-pick-body"><div class="bt-pick-name">${t.name}${prestigeOf(id) ? ` <i class="bt-prest">Prestige ${prestigeOf(id)}</i>` : ''}</div>
          <div class="bt-pick-meta"><span style="color:${rarityColour(id)}">Tier ${t.tier} ${RARITIES[t.rarity].name}</span> · rests ${D.cooldownOf(id)}s</div>
          <div class="bt-stats">${statChips(s)}</div></div>
          <div class="bt-pick-tick">${inDeck ? '✓' : '+'}</div>
        </button>`;
      }).join('');
      const best = b.best[level.id];
      sh.body.innerHTML = `
        <div class="bt-card">
          <div class="bt-card-row"><div><b>Enemies</b><span class="bt-dim">tap one you have met to read about it</span></div><div class="bt-goal"><span class="bt-gold">★</span> win in under ${fmt(level.starTime)}${best ? `<br><span class="bt-dim">best ${fmt(best)}${b.stars[level.id] ? ' ★' : ''}</span>` : ''}</div></div>
          <div class="bt-foes">${foes}</div>
          <div class="bt-dim bt-reward">${cleared(level.id) ? 'Won before: win again for the star or a faster time.' : `First win: essence${level.boss ? ' and a premium crate' : ''}.`}</div>
        </div>
        <div class="bt-card">
          <div class="bt-card-row"><div><b>Your six</b><span class="bt-dim">${sys === 'prime' ? 'Prime' : 'Low Gravity'} beasts you have discovered</span></div><button class="bt-btn small" id="bt-auto">Best six</button></div>
          <div class="bt-slots">${slots}</div>
        </div>
        <div class="bt-card">
          <div class="bt-card-row"><div><b>Perk</b><span class="bt-dim">one per battle, once earned</span></div></div>
          <div class="bt-perks">${D.PERKS.map((p) => { const open = p.unlock(totals()); return `<button class="bt-perk ${b.perk === p.id && open ? 'on' : ''} ${open ? '' : 'locked'}" data-perk="${p.id}"><b>${p.name}</b><span>${open ? p.desc : p.how}</span></button>`; }).join('')}</div>
        </div>
        <div class="bt-picks">${list || '<div class="bt-dim">Discover beasts in the meadow to battle with them.</div>'}</div>
        <div class="bt-go-bar"><button class="bt-go" ${deck.length ? '' : 'disabled'}>Battle!</button></div>`;
      sh.body.querySelectorAll('img[data-pic]').forEach((img) => beastPic(img.dataset.pic, 128).then((u) => { img.src = u; }));
      sh.body.querySelectorAll('.bt-foe').forEach((f) => f.addEventListener('click', () => { if (b.seen[f.dataset.id]) { click(); openFoe(f.dataset.id); } }));
      const toggle = (id) => {
        if (deck.includes(id)) deck = deck.filter((x) => x !== id);
        else if (deck.length < 6) deck.push(id);
        else { showWarning('Six at most', 'Take a beast out of your six first.'); return; }
        b.decks[sys] = deck.slice();
        click();
        draw();
      };
      sh.body.querySelectorAll('.bt-pick, .bt-slot[data-id]').forEach((p) => p.addEventListener('click', () => toggle(p.dataset.id)));
      sh.body.querySelector('#bt-auto').addEventListener('click', () => { deck = bestDeck(sys); b.decks[sys] = deck.slice(); click(); draw(); });
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
    const screen = el(`<div id="battle-screen">
      <canvas id="bt-canvas"></canvas>
      <div class="bt-hud">
        <button class="bt-hud-btn" id="bt-pause" aria-label="Pause">❚❚</button>
        <div class="bt-hud-title"><b>${level.boss ? level.name : `${D.WORLDS[level.world - 1].name} ${level.n}`}${perk ? ` · ${perk.name}` : ''}</b><span id="bt-clock">0:00</span></div>
        <button class="bt-hud-btn" id="bt-speed">1×</button>
      </div>
      <div class="bt-tip" id="bt-tip">Tap a card to send that beast up from the marker. Tap your zone to move the marker, or drag a card to a spot.</div>
      <div class="bt-deck">
        <div class="bt-deck-info"><span id="bt-count">0/10 on the field</span><span id="bt-star"></span></div>
        <div class="bt-cards">${cards.map((c, i) => `<button class="bt-cardbtn" data-i="${i}" style="--rc:${rarityColour(c.id)}"><img alt=""><b>T${BEAST_TEMPLATES[c.id].tier}</b><div class="bt-cd"></div><span class="bt-cd-n"></span></button>`).join('')}</div>
      </div>
    </div>`);
    document.body.appendChild(screen);
    document.body.classList.add('bt-in-battle');
    const canvas = screen.querySelector('#bt-canvas');
    run = {
      level, battle, screen, canvas, ctx: canvas.getContext('2d'), onDone,
      sprites: {}, whites: {}, cam: { zoom: 1, x: W / 2, y: H / 2 }, fit: 1, max: 2,
      marker: 0.3, speed: 1, paused: false, over: false, last: performance.now(), acc: 0,
      fx: [], shots: [], shake: 0, flash: 0, bg: null, dpr: Math.min(2, window.devicePixelRatio || 1),
      cardEls: [...screen.querySelectorAll('.bt-cardbtn')], walk: new Map(), coinsAt: 0, tipUntil: performance.now() + 6000,
      alarmAt: 0, ended: false,
    };
    resize();
    run.bg = paintArena(level);
    cards.forEach((c, i) => beastPic(c.id, 128).then((u) => { run && (run.cardEls[i].querySelector('img').src = u); }));
    Promise.all(cards.map((c) => beastPic(c.id, 256).then((u) => loadSprite(c.id, u)))).then(() => { if (run) run.ready = true; });
    bindBattleInput();
    if (typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.music(level.boss, level.n);
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

  /** Camera: arena units to screen (CSS) pixels. Fit the whole arena between the bars at first. */
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
    run.max = Math.max(run.fit * 2.2, (worldW / W) * 1.15);
    if (!run.cam.set) { run.cam = { zoom: run.fit, x: W / 2, y: H / 2, set: true }; }
    clampCam();
  }
  function clampCam() {
    const c = run.cam;
    c.zoom = Math.max(run.fit, Math.min(run.max, c.zoom));
    const halfW = run.vw / 2 / c.zoom, halfH = (run.vh - run.top - run.bottom) / 2 / c.zoom;
    c.x = halfW * 2 >= W ? W / 2 : Math.max(halfW, Math.min(W - halfW, c.x));
    c.y = halfH * 2 >= H ? H / 2 : Math.max(halfH, Math.min(H - halfH, c.y));
  }
  const sx = (x) => (x - run.cam.x) * run.cam.zoom + run.vw / 2;
  const sy = (y) => (y - run.cam.y) * run.cam.zoom + run.top + (run.vh - run.top - run.bottom) / 2;
  const ax = (px) => (px - run.vw / 2) / run.cam.zoom + run.cam.x;
  const ay = (py) => (py - run.top - (run.vh - run.top - run.bottom) / 2) / run.cam.zoom + run.cam.y;
  const SAFE_Y = 1600;

  // ------------------------------------------------------------------ input
  function bindBattleInput() {
    const sc = run.screen, cv = run.canvas;
    sc.querySelector('#bt-pause').addEventListener('click', () => { click(); pause(true); });
    sc.querySelector('#bt-speed').addEventListener('click', (e) => { click(); run.speed = run.speed === 1 ? 2 : 1; e.currentTarget.textContent = `${run.speed}×`; });
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
          if (y > SAFE_Y - 160 && x > 0 && x < W) { run.marker = x / W; play(i); }
        } else play(i);
        run.drag = null;
        down = null;
      };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', () => { run.drag = null; down = null; });
    });
    // The arena: tap your zone to move the marker; drag to look around; pinch or wheel to zoom.
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
        if (y > SAFE_Y - 160 && x > 20 && x < W - 20) { run.marker = x / W; sfx('tap'); }
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
    const b = run.battle;
    if (!b.canDeploy(i)) {
      if (b.yours.length >= BE.MAX_YOURS) toast('Ten beasts is the most on the field');
      return;
    }
    b.deploy(i, run.marker);
    run.tipUntil = 0;
  }
  let toastT = null;
  function toast(text) {
    const t = run.screen.querySelector('#bt-tip');
    t.textContent = text;
    t.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('on'), 1400);
  }

  // ------------------------------------------------------------------ the loop
  function frame(now) {
    if (!run) return;
    const dt = Math.min(0.1, (now - run.last) / 1000);
    run.last = now;
    if (!run.paused && run.ready) {
      run.acc += dt * run.speed;
      const STEP = 1 / 30;
      while (run.acc >= STEP) {
        run.battle.step(STEP);
        run.acc -= STEP;
        for (const u of run.battle.units) if (u.state === 'walk') run.walk.set(u.uid, (run.walk.get(u.uid) || 0) + (u.speed * STEP) / (u.side === 'you' ? 60 : 50));
        events(run.battle.drain());
      }
      tickFx(dt * run.speed);
    }
    draw(now / 1000, dt);
    hud();
    if (run.battle.result && !run.ended) { run.ended = true; setTimeout(finish, 1700); }
    requestAnimationFrame(frame);
  }

  function colourOf(u) {
    if (u.side === 'you') return (ELEMENTS[(BEAST_TEMPLATES[u.kind] || {}).element] || { color: '#ffd43b' }).color;
    const e = D.ENEMIES[u.kind];
    return e.look.shadow ? e.look.trim : e.look.eye === '#2a1a10' ? e.look.trim : e.look.eye;
  }

  function events(list) {
    for (const ev of list) {
      const u = ev.unit;
      switch (ev.type) {
        case 'deploy': sfx('deploy'); burst(u.x, u.y, colourOf(u), 14, 160, 'spark'); ring(u.x, u.y, u.r * 1.8, colourOf(u)); break;
        case 'spawn': sfx('spawn'); if (D.ENEMIES[u.kind].look.shadow) burst(u.x, u.y - 10, '#1a1426', 10, 90, 'smoke'); else burst(u.x, u.y, '#c8b8a0', 8, 80, 'smoke'); if (!B().seen[u.kind]) seenNow(u.kind); break;
        case 'swing':
          if (ev.ranged) for (const t of ev.targets) run.shots.push({ x: u.x, y: u.y - u.r, tx: t.x, ty: t.y - t.r * 0.6, t: 0, dur: 0.22 + Math.hypot(t.x - u.x, t.y - u.y) / 2600, col: colourOf(u), heavy: ev.heavy, side: u.side });
          if (ev.heavy) run.shake = Math.max(run.shake, u.boss ? 9 : 4);
          if (ev.heavy && typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.hit(u, true);
          break;
        case 'hit':
          if (!ev.heavy && typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.hit(ev.by, false);
          burst(u.x, u.y - u.r * 0.6, colourOf(ev.by), ev.heavy ? 16 : 5, ev.heavy ? 220 : 120, 'spark');
          if (ev.heavy) { ring(u.x, u.y - u.r * 0.5, u.r * 2.4, colourOf(ev.by)); text(u.x, u.y - u.r * 2, `${Math.round(ev.dmg)}`, '#ffe066'); }
          u._hurt = 1;
          break;
        case 'death':
          if (typeof BATTLE_SFX !== 'undefined') BATTLE_SFX.death(u);
          if (u.side === 'you') { burst(u.x, u.y - u.r * 0.5, colourOf(u), 18, 200, 'star'); burst(u.x, u.y, '#ffffff', 8, 90, 'smoke'); }
          else if (D.ENEMIES[u.kind].look.shadow) burst(u.x, u.y - u.r, D.ENEMIES[u.kind].look.trim, 18, 120, 'wisp');
          else { burst(u.x, u.y - u.r * 0.6, '#d8cfc0', 12, 140, 'smoke'); burst(u.x, u.y - u.r * 0.6, colourOf(u), 10, 200, 'spark'); }
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

  // ------------------------------------------------------------------ effects
  function burst(x, y, col, n, speed, kind) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.35 + Math.random() * 0.65);
      const life = kind === 'smoke' || kind === 'wisp' ? 0.7 + Math.random() * 0.5 : 0.35 + Math.random() * 0.4;
      run.fx.push({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (kind === 'wisp' ? 60 : kind === 'coin' ? 180 : 0), life, max: life, col, size: kind === 'smoke' ? 10 + Math.random() * 12 : kind === 'wisp' ? 6 + Math.random() * 8 : 3 + Math.random() * 4 });
    }
    if (run.fx.length > 500) run.fx.splice(0, run.fx.length - 500);
  }
  function ring(x, y, r, col) { run.fx.push({ kind: 'ring', x, y, r, life: 0.45, max: 0.45, col }); }
  function text(x, y, s, col) { run.fx.push({ kind: 'text', x, y, s, life: 1.1, max: 1.1, col, vy: -50 }); }
  function tickFx(dt) {
    for (const p of run.fx) {
      p.life -= dt;
      if (p.kind === 'ring' || p.kind === 'text') { if (p.vy) p.y += p.vy * dt; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const drag = p.kind === 'smoke' || p.kind === 'wisp' ? 2.2 : 3.2;
      p.vx -= p.vx * drag * dt; p.vy -= p.vy * drag * dt;
      if (p.kind === 'coin') p.vy += 500 * dt;
      if (p.kind === 'wisp') p.vy -= 40 * dt;
    }
    run.fx = run.fx.filter((p) => p.life > 0);
    for (const s of run.shots) s.t += dt;
    run.shots = run.shots.filter((s) => s.t < s.dur);
    run.shake = Math.max(0, run.shake - dt * 30);
    run.flash = Math.max(0, run.flash - dt * 1.6);
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
      shadow: { top: '#1e1730', mid: '#22323a', low: '#2f4a38', path: 'rgba(170,160,210,0.13)', blob: ['#273a36', '#2e2440', '#1f2e33', '#344a3c'], edge: '#121019' },
      kingdom: { top: '#5f7d4a', mid: '#6f9a4e', low: '#7cab55', path: 'rgba(214,190,140,0.75)', blob: ['#86b85c', '#6a944a', '#93b860', '#5f8a44'], edge: '#3f5a2c' },
      invasion: { top: '#4a2a22', mid: '#7a4a2e', low: '#8a6a3a', path: 'rgba(40,30,30,0.35)', blob: ['#8a5634', '#6a3a26', '#9a6a3c', '#5a3424'], edge: '#2a1810' },
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
    const lowGrad = g.createLinearGradient(0, SAFE_Y, 0, H);
    lowGrad.addColorStop(0, 'rgba(120,200,255,0)'); lowGrad.addColorStop(1, 'rgba(120,200,255,0.16)');
    g.fillStyle = lowGrad; g.fillRect(0, SAFE_Y, W, H - SAFE_Y);
    g.strokeStyle = 'rgba(160,220,255,0.35)'; g.setLineDash([18, 14]); g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, SAFE_Y); g.lineTo(W, SAFE_Y); g.stroke(); g.setLineDash([]);
    if (theme === 'kingdom') { // castle wall along the top
      g.fillStyle = '#8a8a96'; g.fillRect(0, 0, W, 40);
      for (let x = 0; x < W; x += 50) g.fillRect(x, 40, 30, 16);
      g.fillStyle = '#aa2a3a'; for (const x of [140, 860]) { g.fillRect(x, 0, 30, 90); }
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
  function heart(ctx, x, y, size, frac, mine) {
    const h = size;
    const shape = () => {
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.35);
      ctx.bezierCurveTo(x - h * 0.05, y + h * 0.28, x - h * 0.55, y + h * 0.05, x - h * 0.5, y - h * 0.18);
      ctx.bezierCurveTo(x - h * 0.45, y - h * 0.45, x - h * 0.1, y - h * 0.48, x, y - h * 0.22);
      ctx.bezierCurveTo(x + h * 0.1, y - h * 0.48, x + h * 0.45, y - h * 0.45, x + h * 0.5, y - h * 0.18);
      ctx.bezierCurveTo(x + h * 0.55, y + h * 0.05, x + h * 0.05, y + h * 0.28, x, y + h * 0.35);
      ctx.closePath();
    };
    shape();
    ctx.fillStyle = mine ? 'rgba(60,10,16,0.75)' : 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.save();
    shape();
    ctx.clip();
    const top = y + h * 0.35 - frac * h * 0.84;
    ctx.fillStyle = mine ? '#ff3a4a' : '#0a0a0e';
    ctx.fillRect(x - h, top, h * 2, h);
    if (mine) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - h * 0.22, y - h * 0.18, h * 0.12, h * 0.08, -0.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    shape();
    ctx.lineWidth = Math.max(1.4, h * 0.11);
    ctx.strokeStyle = mine ? '#ffffff' : '#ffffff';
    ctx.stroke();
  }

  function pile(ctx, side, left, max, t) {
    const p = BE.PILES[side];
    const x = sx(p.x), y = sy(p.y), z = run.cam.zoom;
    const frac = Math.max(0, left / max);
    // The coins: a heap that shrinks as it is taken.
    const heapR = BE.PILE_R * z * (0.55 + 0.45 * frac);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(x, y + heapR * 0.35, heapR * 1.15, heapR * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    const rows = 4;
    for (let i = 0; i < rows; i++) {
      const w = heapR * (1 - i * 0.2);
      const yy = y + heapR * 0.2 - i * heapR * 0.22;
      ctx.fillStyle = i % 2 ? '#f4c430' : '#ffd84a';
      ctx.strokeStyle = '#a8761a'; ctx.lineWidth = Math.max(1, z * 2);
      ctx.beginPath(); ctx.ellipse(x, yy, w, w * 0.42, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    for (let i = 0; i < 4; i++) { const a = t * 2 + i * 1.7; ctx.fillStyle = `rgba(255,255,240,${0.4 + 0.4 * Math.sin(a * 2)})`; ctx.beginPath(); ctx.arc(x + Math.cos(a) * heapR * 0.5, y - heapR * 0.3 + Math.sin(a * 1.3) * heapR * 0.2, Math.max(1.2, z * 3), 0, Math.PI * 2); ctx.fill(); }
    // A banner: blue for yours, red for theirs.
    const fx = x + heapR * 0.9, fy = y - heapR * 0.6;
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = Math.max(1.5, z * 4);
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 70 * z); ctx.stroke();
    ctx.fillStyle = side === 'you' ? '#3a8aff' : '#d83a3a';
    const wave = Math.sin(t * 4) * 6 * z;
    ctx.beginPath(); ctx.moveTo(fx, fy - 70 * z); ctx.quadraticCurveTo(fx + 25 * z, fy - 64 * z + wave, fx + 46 * z, fy - 58 * z); ctx.lineTo(fx, fy - 44 * z); ctx.closePath(); ctx.fill();
    // The timer ring and seconds left.
    const R = BE.PILE_R * z * 1.35;
    ctx.lineWidth = Math.max(3, 9 * z);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.arc(x, y - heapR * 0.1, R, 0, Math.PI * 2); ctx.stroke();
    const taking = run.battle.units.some((u) => u.side !== side && u.state === 'capture');
    ctx.strokeStyle = side === 'you' ? (taking && Math.floor(t * 6) % 2 ? '#ff4a4a' : '#5cc8ff') : '#ffb347';
    ctx.beginPath(); ctx.arc(x, y - heapR * 0.1, R, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    const fs = Math.max(12, 22 * z * 1.4);
    ctx.font = `800 ${fs}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = Math.max(3, fs * 0.22);
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    const label = `${left.toFixed(1)}s`;
    const ly = side === 'you' ? y + R + fs * 0.9 : y - R - fs * 0.3;
    ctx.strokeText(label, x, ly);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x, ly);
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
    pile(ctx, 'foe', battle.piles.foe, battle.pileMax.foe, t);
    pile(ctx, 'you', battle.piles.you, battle.pileMax.you, t);
    // The deploy marker.
    const mx = sx(run.marker * W), my = sy(BE.PILES.you.y - 30);
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 4);
    ctx.fillStyle = '#7ad8ff';
    ctx.beginPath(); ctx.moveTo(mx, my - 34 * z - 10); ctx.lineTo(mx - 14, my - 10 * z); ctx.lineTo(mx + 14, my - 10 * z); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(mx, my, Math.max(14, 40 * z), Math.max(5, 14 * z), 0, 0, Math.PI * 2); ctx.strokeStyle = '#7ad8ff'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.globalAlpha = 1;
    // Units, back to front.
    const units = [...battle.units].sort((a, c) => a.y - c.y);
    for (const u of units) (u.side === 'you' ? drawBeast : drawFoe)(ctx, u, t);
    // Shots in flight.
    for (const s of run.shots) {
      const k = s.t / s.dur;
      const x = sx(s.x + (s.tx - s.x) * k), y = sy(s.y + (s.ty - s.y) * k) - Math.sin(k * Math.PI) * 30 * z;
      const r = Math.max(3, (s.heavy ? 11 : 6) * z * 1.4);
      ctx.drawImage(ENEMY_ART.glowSprite(s.col), x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    // Hearts over everyone still standing.
    for (const u of units) {
      if (u.state === 'dying') continue;
      const hgt = u.side === 'you' ? u.r * 2.6 : u.r * 2.55;
      const size = Math.max(11, Math.min(u.boss ? 34 : 24, u.r * z * (u.boss ? 0.9 : 0.75)));
      heart(ctx, sx(u.x), sy(u.y - hgt) - size * 0.4, size, u.hp / u.maxHp, u.side === 'you');
    }
    drawFx(ctx, z);
    ctx.restore();
    if (run.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${run.flash * 0.7})`; ctx.fillRect(0, 0, run.vw, run.vh); }
    // A card being dragged.
    if (run.drag) {
      const img = run.cardEls[run.drag.i].querySelector('img');
      ctx.globalAlpha = 0.8;
      if (img.complete && img.naturalWidth) ctx.drawImage(img, run.drag.x - 32, run.drag.y - 32, 64, 64);
      ctx.globalAlpha = 1;
    }
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
  /** How a beast moves (walk, hop, fly...): worked out once, as it draws the beast to find out. */
  function motionOf(id) {
    if (!motions.has(id)) motions.set(id, ART.motion(id));
    return motions.get(id);
  }

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
    const tgt = u.target;
    const dirx = tgt ? Math.sign(tgt.x - u.x) || 1 : 1;
    if (ph >= 0 && u.reach < 90) {
      if (ph < 0.45) { const k = ph / 0.45; oy += k * S * 0.05; scx = 1 + k * (heavyNow ? 0.12 : 0.05); scy = 1 - k * (heavyNow ? 0.1 : 0.04); }
      else { const k = Math.sin(((ph - 0.45) / 0.55) * Math.PI); oy -= k * S * (heavyNow ? 0.22 : 0.12); ox += dirx * k * S * 0.06; scy = 1 + k * 0.08; }
    } else if (ph >= 0) {
      const k = ph < 0.45 ? ph / 0.45 : 1 - (ph - 0.45) / 0.55;
      scx = scy = 1 + k * (heavyNow ? 0.12 : 0.05);
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
    // A heavy blow building: a glow in the beast's colour.
    if (heavyNow && ph >= 0 && ph < 0.6) {
      const k = ph < 0.45 ? ph / 0.45 : 1;
      ctx.globalAlpha = 0.5 * k; ctx.drawImage(ENEMY_ART.glowSprite(colourOf(u)), x - S * 0.8, y - S * 1.25, S * 1.6, S * 1.6); ctx.globalAlpha = 1;
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
    const ph = swingPhase(u);
    const heavyNow = ph >= 0 && (ph < 0.45 ? nextIsHeavy(u) : u.lastHeavy);
    const pose = {
      t: t + u.uid * 0.37, walk: (run.walk.get(u.uid) || 0) % 1, atk: ph, heavy: heavyNow,
      hurt: u._hurt || 0, dying: u.state === 'dying' ? Math.min(1, u.dyingT / BE.DYING) : 0,
      capture: u.state === 'capture', seed: u.uid,
    };
    ctx.save();
    ctx.translate(sx(u.x), sy(u.y));
    if (u.boss) {
      ctx.globalAlpha = 0.25; ctx.drawImage(ENEMY_ART.glowSprite('#ff3c3c'), -u.r * z * 2.2, -u.r * z * 3.2, u.r * z * 4.4, u.r * z * 4.4); ctx.globalAlpha = 1;
    }
    ENEMY_ART.draw(ctx, u.kind, pose, 60 * z);
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
    clock.textContent = fmt(time);
    run.screen.querySelector('#bt-star').innerHTML = `<span class="${under ? 'bt-gold' : 'bt-dim'}">★ under ${fmt(b.level.starTime)}</span>`;
    run.screen.querySelector('#bt-count').textContent = `${b.yours.length}/${BE.MAX_YOURS} on the field`;
    run.screen.querySelector('#bt-tip').classList.toggle('on', performance.now() < run.tipUntil);
    run.cardEls.forEach((btn, i) => {
      const c = b.cards[i];
      const left = Math.max(0, c.ready - b.time);
      const frac = left / c.cooldown;
      btn.style.setProperty('--cd', `${(frac * 360).toFixed(0)}deg`);
      btn.querySelector('.bt-cd-n').textContent = left > 0 ? Math.ceil(left) : '';
      btn.classList.toggle('ready', left <= 0 && b.yours.length < BE.MAX_YOURS && !b.result);
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
    m.querySelector('[data-a=quit]').addEventListener('click', () => { click(); m.remove(); run.paused = false; run.battle.finish('lost'); });
  }

  function seenNow(id) {
    const b = B();
    if (b.seen[id]) return;
    b.seen[id] = Date.now();
    run.newFoes = (run.newFoes || 0) + 1;
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
    if (won) {
      b.best[level.id] = Math.min(b.best[level.id] || Infinity, Math.round(time));
      if (starNow) b.stars[level.id] = true;
      if (level.boss) b.bosses[level.id] = true;
      if (battle.piles.you >= battle.pileMax.you) b.flawless = (b.flawless || 0) + 1;
      if (!b.fastest || time < b.fastest) b.fastest = Math.round(time);
      if (level.boss && battle.maxTierUsed <= 8) b.underdog = true;
      if (first) {
        const cps = typeof calculateTotalCps === 'function' ? calculateTotalCps() : 0;
        const ess = Math.max(150 * level.n * level.world * level.world, cps * 60 * D.clearMinutes(level.world, level.n));
        grant({ essence: ess, premium: level.boss ? 1 : 0 }, rewards);
      }
      if (newStar) {
        const s = totals().stars;
        while (Math.floor(s / 5) > (b.starGifts || 0)) { b.starGifts = (b.starGifts || 0) + 1; grant({ spins: 1 }, rewards, '5 stars'); }
        const w = D.WORLDS[level.world - 1];
        let all = true;
        for (let n = 1; n <= w.levels; n++) if (!b.stars[`${w.id}-${n}`]) { all = false; break; }
        if (all && !b.chests[w.id]) { b.chests[w.id] = true; grant({ chest: w }, rewards); }
      }
    }
    const ach = checkAchievements(rewards);
    saveGame();
    if (typeof updateHUD === 'function') updateHUD();
    if (typeof BATTLE_SFX !== 'undefined') { BATTLE_SFX.stopMusic(); BATTLE_SFX.sting(won); }
    const w = D.WORLDS[level.world - 1];
    const next = level.n < w.levels ? level.n + 1 : null;
    const m = el(`<div class="bt-modal"><div class="bt-panel ${won ? 'won' : 'lost'}">
      <h2>${won ? 'Victory!' : 'Defeat'}</h2>
      <div class="bt-result-star ${starNow ? 'on' : ''}">★</div>
      <div class="bt-dim">${won ? `Won in ${fmt(time)}` : battle.piles.you <= 0 ? 'They took your coin pile.' : 'You retreated.'} · star under ${fmt(level.starTime)}${starNow ? (newStar ? ': earned!' : '') : ''}</div>
      ${rewards.length ? `<div class="bt-rewards">${rewards.map((x) => `<div>${x}</div>`).join('')}</div>` : ''}
      ${ach.length ? `<div class="bt-rewards ach">${ach.map((a) => `<div>🏆 ${a}</div>`).join('')}</div>` : ''}
      ${r.newFoes ? `<div class="bt-dim">${r.newFoes} new ${r.newFoes > 1 ? 'foes' : 'foe'} in the wiki.</div>` : ''}
      <div class="bt-row">
        <button class="bt-btn" data-a="map">Levels</button>
        <button class="bt-btn" data-a="retry">${won ? 'Play again' : 'Try again'}</button>
        ${won && next ? `<button class="bt-go" data-a="next">Next level</button>` : ''}
      </div></div></div>`);
    r.screen.appendChild(m);
    const leave = () => {
      window.removeEventListener('resize', resize);
      r.screen.remove();
      document.body.classList.remove('bt-in-battle');
      run = null;
      if (r.onDone) r.onDone();
    };
    m.querySelector('[data-a=map]').addEventListener('click', () => { click(); leave(); });
    m.querySelector('[data-a=retry]').addEventListener('click', () => { click(); const deck = r.battle.cards.map((c) => c.id); leave(); start(level, deck, r.onDone); });
    const nb = m.querySelector('[data-a=next]');
    if (nb) nb.addEventListener('click', () => { click(); leave(); const top = sheets[sheets.length - 1]; if (top) top.close(); openLevel(w, next, r.onDone); });
  }

  /** Pay out a reward and note it for the results. */
  function grant(rw, notes, why = '') {
    if (rw.essence) { state.essence += rw.essence; notes.push(`+${formatNumber(rw.essence)} essence`); }
    if (rw.crates) { for (let i = 0; i < rw.crates; i++) spawnCrateOnField(); notes.push(`${rw.crates} crates dropped in your meadow`); }
    if (rw.premium) { state.premiumCratesCount += rw.premium; if (typeof updatePremiumCratesDisplay === 'function') updatePremiumCratesDisplay(); notes.push(`+${rw.premium} premium crate${rw.premium > 1 ? 's' : ''}`); }
    if (rw.spins) { B().freeSpins = (B().freeSpins || 0) + rw.spins; if (typeof updateDailySpinHUD === 'function') updateDailySpinHUD(); notes.push(`+${rw.spins} free spin${rw.spins > 1 ? 's' : ''}${why ? ` (${why})` : ''}`); }
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

  function checkAchievements(notes) {
    const b = B();
    const t = totals();
    const got = [];
    for (const a of D.ACHIEVEMENTS) {
      if (b.ach[a.id] || !a.test(t)) continue;
      b.ach[a.id] = Date.now();
      got.push(a.name);
      grant(a.reward, notes, a.name);
    }
    return got;
  }

  /** The rules, in a few sentences. Shown once before the first battle, and from the tab. */
  function openHow(then) {
    const m = el(`<div class="bt-modal"><div class="bt-panel bt-how"><h2>How battles work</h2>
      <p>Pick six of your beasts. In the battle their cards sit along the bottom: tap one and that beast walks up the field from the marker in your zone, which you move by tapping your zone, or drag a card to the spot you want.</p>
      <p>A card rests after it is played, one second for each tier (Tier 20 rests 20 seconds), and ten of your beasts can be on the field at once.</p>
      <p>Beasts and enemies fight whatever is nearest in reach. Every beast has four stats: Attack, Health, Speed and Range. A light hit lands every second and a heavy one, five times as strong, every fifth.</p>
      <p>Each side has a coin pile with 15 seconds in it. Anyone standing at the other side's pile, not fighting, takes a second a second; two at once take twice as fast. Empty theirs to win. If they empty yours, it blows up.</p>
      <p>Hearts show health: red for your beasts, black for enemies. Win quickly for a star; every five stars is a free spin, and every star in a world opens its chest. Higher tiers, rarer beasts and beasts you have owned in later prestiges are stronger.</p>
      <button class="bt-go" data-a="ok">Got it</button></div></div>`);
    document.body.appendChild(m);
    m.querySelector('[data-a=ok]').addEventListener('click', () => { click(); m.remove(); B().howSeen = true; if (then) then(); });
  }

  // ================================================================== wiki and achievements
  function openWiki() {
    const sh = sheet('Foe Wiki', `${totals().seen} of ${D.ENEMY_LIST.length} met`);
    const b = B();
    let html = '';
    for (const w of D.WORLDS) {
      html += `<div class="bt-system">World ${w.id}: ${w.name}</div><div class="bt-wiki">`;
      for (const e of D.ENEMY_LIST.filter((x) => x.world === w.id)) {
        const seen = !!b.seen[e.id];
        html += `<button class="bt-wiki-cell ${seen ? '' : 'unseen'} ${e.role === 'boss' ? 'boss' : ''}" data-id="${e.id}"><img src="${ENEMY_ART.still(e.id, 80, !seen)}" alt=""><span>${seen ? e.name : '???'}</span></button>`;
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
    const m = el(`<div class="bt-modal"><div class="bt-panel bt-foe-card">
      <img src="${ENEMY_ART.still(id, 160)}" alt="">
      <h2>${e.name}</h2>
      <div class="bt-diff">${heartsHtml(D.difficulty(id))}</div>
      <div class="bt-dim">World ${e.world}: ${D.WORLDS[e.world - 1].name} · first seen at level ${e.debut} · ${roles[e.role]}</div>
      <p>${e.note}</p>
      <div class="bt-stats">${statChips(s)}</div>
      <div class="bt-dim">Stats when first met; they grow level by level.</div>
      <button class="bt-go" data-a="ok">Close</button></div></div>`);
    document.body.appendChild(m);
    m.querySelector('[data-a=ok]').addEventListener('click', () => { click(); m.remove(); });
    m.addEventListener('click', (ev) => { if (ev.target === m) m.remove(); });
  }
  function openAchievements() {
    const sh = sheet('Battle Achievements', '');
    const b = B();
    const desc = (r) => [r.essence && `${formatNumber(r.essence)} essence`, r.crates && `${r.crates} crates`, r.premium && `${r.premium} premium crate${r.premium > 1 ? 's' : ''}`, r.spins && `${r.spins} free spin${r.spins > 1 ? 's' : ''}`].filter(Boolean).join(', ');
    sh.body.innerHTML = `<div class="bt-achs">${D.ACHIEVEMENTS.map((a) => `<div class="bt-ach ${b.ach[a.id] ? 'done' : ''}"><div class="bt-ach-icon">${b.ach[a.id] ? '🏆' : '🔒'}</div><div><b>${a.name}</b><span>${a.desc}</span><em>${desc(a.reward)}</em></div></div>`).join('')}</div>`;
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
    // The first time 1.4 opens: what is on the field now counts at today's prestige.
    const b = B();
    if (!b.seededOwned) { (state.beastsOnField || []).forEach((x) => noteOwned(x.type)); b.seededOwned = true; }
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
              box.innerHTML = `<div class="bt-details-title">Battle${p ? ` · Prestige ${p}` : ''} · rests ${D.cooldownOf(id)}s</div><div class="bt-stats">${statChips(D.beastStats(id, p))}</div>`;
            }
          }
        } catch (e) { console.error(e); }
        return r;
      };
      updateDetailsModalContent.battleHooked = true;
    }
    renderTab();
  }

  return { init, renderTab, start, openWorld, openLevel, openWiki, openAchievements, openHow, noteOwned, B, totals, get run() { return run; }, closeSheets };
})();
