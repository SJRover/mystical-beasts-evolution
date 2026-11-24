// App Store screenshot scenes for 1.3, staged inside the running game (not shipped).
// tools/store_shots.mjs loads this after tools/playtest.js and calls `await SCENES.run(name)` for
// each scene, then captures the screen. Everything shown is the game's own art, UI and effects.
window.SCENES = (() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const today = () => new Date().toDateString();

  function caption(text, top) {
    document.querySelectorAll('.store-caption').forEach((e) => e.remove());
    if (!text) return;
    const d = document.createElement('div');
    d.className = 'store-caption';
    d.textContent = text;
    const small = Math.min(window.innerWidth, window.innerHeight);
    d.style.cssText = `position:fixed;left:6%;right:6%;top:${top || (window.innerWidth > 600 ? 15 : 13.5)}%;z-index:99999;text-align:center;pointer-events:none;white-space:pre-line;` +
      `font-family:var(--font-game);font-weight:800;font-size:${Math.round(small * 0.082)}px;line-height:1.08;color:#fff;letter-spacing:0.01em;` +
      `-webkit-text-stroke:${Math.max(3, Math.round(small * 0.011))}px #1a1440;paint-order:stroke fill;text-shadow:0 ${Math.round(small * 0.01)}px 0 rgba(10,8,30,0.85),0 0 ${Math.round(small * 0.05)}px rgba(10,8,30,0.55);`;
    document.body.appendChild(d);
  }

  /** The caption in a band over a slightly smaller game, so it covers nothing. */
  function band(text) {
    unband();
    const W = window.innerWidth, H = window.innerHeight, k = W > 600 ? 0.84 : 0.8;
    const b = document.body.style;
    b.transformOrigin = '50% 100%'; b.transform = `scale(${k})`; b.height = '100vh'; b.overflow = 'hidden';
    b.borderRadius = `${Math.round(W * 0.05)}px ${Math.round(W * 0.05)}px 0 0`; b.boxShadow = '0 0 40px rgba(0,0,0,0.6)';
    const bg = document.createElement('style');
    bg.className = 'store-band';
    bg.textContent = 'html { background: radial-gradient(circle at 50% 0%, #4a2a9a, #1a1040 70%) !important; min-height: 100vh; }';
    document.head.appendChild(bg);
    document.querySelectorAll('#toast-container > *, .toast-notification, .toast-alert').forEach((e) => e.remove());
    const d = document.createElement('div');
    d.className = 'store-band';
    d.textContent = text;
    const small = Math.min(W, H);
    d.style.cssText = `position:fixed;left:4%;right:4%;top:0;height:${Math.round(H * (1 - k))}px;display:flex;align-items:center;justify-content:center;text-align:center;white-space:pre-line;z-index:2147483647;pointer-events:none;` +
      `font-family:'Fredoka',sans-serif;font-weight:800;font-size:${Math.round(small * (W > 600 ? 0.07 : 0.085))}px;line-height:1.05;color:#fff;` +
      `-webkit-text-stroke:${Math.max(3, Math.round(small * 0.011))}px #1a1440;paint-order:stroke fill;text-shadow:0 ${Math.round(small * 0.01)}px 0 rgba(10,8,30,0.85);`;
    document.documentElement.appendChild(d);
  }
  function unband() {
    document.querySelectorAll('.store-band').forEach((e) => e.remove());
    const b = document.body.style;
    b.transform = ''; b.transformOrigin = ''; b.height = ''; b.overflow = ''; b.borderRadius = ''; b.boxShadow = '';
    document.documentElement.style.background = '';
  }

  /** A clean, settled game: past the tutorial and pop-ups, nothing on the field. */
  async function base({ level = 0, essence = 1.2e6, all = false } = {}) {
    PT.dismiss();
    await sleep(300);
    PT.dismiss();
    document.querySelectorAll('.toast-alert, #daily-spin-modal.active').forEach((e) => e.remove ? e.classList.remove('active') : 0);
    document.querySelectorAll('.toast-alert').forEach((e) => e.remove());
    const sb = document.getElementById('sidebar-panel'); if (sb) sb.classList.remove('active');
    const bd = document.getElementById('sidebar-backdrop'); if (bd) bd.classList.remove('active');
    state.isTutorialCompleted = true;
    state.lastDailySpinDate = today();
    state.doubleEssenceEndTime = 0;
    state.upgrades.meadowCapacity = 20;
    state.unlockedIncubators = [true, true, true];
    if (all) state.unlockedBeasts = Object.keys(BEAST_TEMPLATES).filter((id) => !/shadow_fiend|void_parasite/.test(id) && (BEAST_TEMPLATES[id].system || 'prime') === 'prime' && BEAST_TEMPLATES[id].tier <= 15);
    if (state.prestigeLevel !== level || state.currentSolarSystem !== 'prime' || state.inBeastHub) {
      state.prestigeLevel = level;
      state.currentSolarSystem = 'prime';
      state.inBeastHub = false;
      applyBiomeBg(level);
    }
    state.essence = essence;
    // No merge achievement pops up over a shot (raising the prestige here would earn some).
    if (typeof MERGE_ACH !== 'undefined' && window.BATTLE) { const Bt = BATTLE.B(); Bt.mach = Bt.mach || {}; for (const a of MERGE_ACH) Bt.mach[a.id] = true; }
    PT.clear();
    WORLD.centre();
    const w = window.innerWidth;
    if (w > 600) WORLD.zoomAt(w / 2, window.innerHeight / 2, w > 900 ? 1.3 : 1.05);
    if (typeof updateHUD === 'function') updateHUD();
    state.lastTrashedBeast = null;
    if (typeof updateTrashBinUI === 'function') updateTrashBinUI();
    if (typeof updateIncubatorsVisibility === 'function') updateIncubatorsVisibility();
    caption('');
    await sleep(200);
  }

  /** Beasts spread over the part of the screen between the HUD and the incubators. */
  function scatter(list, { top = 27, bottom = 57, left = 8, right = 80 } = {}) {
    const n = list.length, cols = Math.ceil(Math.sqrt(n * 0.8)), rows = Math.ceil(n / cols);
    const out = [];
    list.forEach(([id, ev], i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const sx = left + ((c + 0.5 + (r % 2 ? 0.25 : -0.15)) / cols) * (right - left);
      const sy = top + ((r + 0.5) / rows) * (bottom - top);
      out.push(PT.spawnInView(id, !!ev, false, sx, sy));
    });
    return out;
  }

  function coins(n) {
    for (let i = 0; i < n; i++) {
      const p = WORLD.viewPct(12 + Math.random() * 70, 30 + Math.random() * 26);
      dropEssenceCrystalOnGround('sparky', p.x, p.y, i % 3 === 0);
    }
  }

  const S = {};

  const tap = (el) => { const r = el.getBoundingClientRect(); const o = { bubbles: true, pointerId: 7, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, isPrimary: true }; el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new PointerEvent('pointerup', o)); };
  /** End a battle left running by the scene before (a new one will not start while it runs). */
  async function endBattle() {
    if (BATTLE.run) {
      BATTLE.run.paused = false;
      BATTLE.run.retreated = true;
      BATTLE.run.battle.finish('lost');
      for (let i = 0; i < 40 && !document.querySelector('.bt-modal [data-a=map]'); i++) await sleep(100);
      const b = document.querySelector('.bt-modal [data-a=map]');
      if (b) b.click();
      await sleep(400);
    }
    document.querySelectorAll('.bt-modal').forEach((m) => m.remove());
    BATTLE.closeSheets();
    await sleep(250);
  }
  /** A battle on a level (no rule), its earlier levels won, with a six whose first three are evolved. */
  async function battle(world, n, deck, evolved = 3) {
    await endBattle();
    await base({ level: 3, essence: 6.4e12, all: true });
    const B = BATTLE.B();
    for (let k = 1; k < n; k++) B.best[`${world}-${k}`] = 60;
    B.howSeen = true; B.tipSeen = true;
    for (const id of deck) { if (BATTLE_DATA.LEGENDS[id]) B.legends[id] = true; else if (!state.unlockedBeasts.includes(id)) state.unlockedBeasts.push(id); }
    state.unlockedEvolved = deck.slice(0, evolved).filter((id) => !BATTLE_DATA.LEGENDS[id]);
    B.decks = {}; B.decks[BATTLE_DATA.WORLDS[world - 1].system] = deck.slice();
    BATTLE.closeSheets();
    document.getElementById('sidebar-panel').classList.remove('active');
    BATTLE.openWorld(BATTLE_DATA.WORLDS[world - 1]); await sleep(300);
    BATTLE.openLevel(BATTLE_DATA.WORLDS[world - 1], n); await sleep(600);
    [...document.querySelectorAll('.bt-sheet')].pop().querySelector('.bt-go').click();
    await sleep(4300);
  }
  /** Play ready cards across the lanes for a while (real time). */
  async function playFor(ms, every = 320, until = null) {
    const end = Date.now() + ms;
    let k = 0;
    while (Date.now() < end) {
      const run = BATTLE.run;
      if (!run || run.battle.result || (until && until(run.battle))) break;
      const cards = [...document.querySelectorAll('.bt-cardbtn.ready')];
      if (cards.length) { run.marker = [0.3, 0.7, 0.5, 0.2, 0.8][k++ % 5]; tap(cards[0]); }
      await sleep(every);
    }
  }

  /** The camera on the thickest part of the fight (a boss counts four). */
  function frameFight(zoom = 1.1) {
    const run = BATTLE.run;
    if (!run) return;
    const live = run.battle.units.filter((u) => u.state !== 'dying' && !u.burrowed);
    const hot = live.filter((u) => u.state === 'fight' || u.state === 'capture' || u.boss);
    const pool = hot.length >= 2 ? hot : live;
    if (!pool.length) return;
    let tx = 0, ty = 0, tw = 0;
    for (const u of pool) { let n = 0; for (const o of pool) if (Math.hypot(o.x - u.x, o.y - u.y) < 280) n++; const w = n * n * (u.boss ? 4 : 1); tx += u.x * w; ty += u.y * w; tw += w; }
    run.cam.zoom = zoom;
    run.cam.x = Math.max(320, Math.min(680, tx / tw));
    run.cam.y = Math.max(450, Math.min(1650, ty / tw));
  }
  function specialNear() {
    const b = BATTLE.run.battle;
    for (let i = 0; i < 3; i++) {
      if (!b.canSpecial(i)) continue;
      const u = b.onField(i).find((m) => b.units.some((o) => o.side === 'foe' && o.state !== 'dying' && !o.burrowed && Math.hypot(o.x - m.x, o.y - m.y) < 200));
      if (u && b.special(i, u)) return u;
    }
    return null;
  }
  S.battle = async () => {
    for (const id of ['void_monarch', 'dark_matter_leviathan', 'ent_guardian', 'venom_dragon', 'webspinner', 'bark_titan']) BATTLE.B().bestPrestige[id] = 4;
    await battle(2, 26, ['void_monarch', 'dark_matter_leviathan', 'ent_guardian', 'venom_dragon', 'webspinner', 'bark_titan']);
    await playFor(11000, 300);
    frameFight(1.0);
    await sleep(300);
    band('Battle mode\nis here!');
  };
  S.specials = async () => {
    for (const id of ['singularity_monarch', 'void_jellyfish', 'astral_monarch', 'cosmic_jellyfish', 'dark_pterodactyl', 'cosmic_wing']) BATTLE.B().bestPrestige[id] = 10;
    await battle(6, 25, ['singularity_monarch', 'void_jellyfish', 'astral_monarch', 'cosmic_jellyfish', 'dark_pterodactyl', 'cosmic_wing']);
    await playFor(9000, 300);
    let hero = null;
    for (let k = 0; k < 40 && !(hero = specialNear()); k++) await playFor(300, 300);
    frameFight(1.15);
    // Centred on the beast doing its special, so its call-out shows whole.
    if (hero) { BATTLE.run.cam.x = Math.max(320, Math.min(680, hero.x)); BATTLE.run.cam.y = Math.max(450, Math.min(1650, hero.y - 60)); }
    await sleep(300);
    band('Evolved beasts\nhave specials');
  };
  S.boss = async () => {
    for (const id of ['singularity_monarch', 'void_jellyfish', 'astral_monarch', 'cosmic_jellyfish', 'dark_pterodactyl', 'cosmic_wing']) BATTLE.B().bestPrestige[id] = 13;
    await battle(6, 40, ['singularity_monarch', 'void_jellyfish', 'astral_monarch', 'cosmic_jellyfish', 'dark_pterodactyl', 'cosmic_wing']);
    await playFor(60000, 400, (b) => b.units.some((u) => u.boss && u.y > 420));
    await playFor(5500, 400);
    frameFight(1.1);
    await sleep(300);
    band('Beat the bosses');
  };
  S.worlds = async () => {
    await endBattle();
    await base({ level: 3, essence: 6.4e12, all: true });
    // Far enough along for the Low Gravity worlds, with the usual meadow behind.
    state.prestigeLevel = 9;
    const B = BATTLE.B();
    for (const [w, won, stars] of [[1, 40, 31], [2, 40, 24], [3, 40, 17], [4, 40, 22], [5, 40, 9], [6, 18, 3]]) {
      for (let k = 1; k <= won; k++) B.best[`${w}-${k}`] = 60;
      for (let k = 1; k <= stars; k++) B.stars[`${w}-${Math.min(won, k * Math.max(1, Math.floor(won / stars)))}`] = true;
    }
    document.getElementById('sidebar-panel').classList.add('active');
    switchTab('sanctuary');
    BATTLE.renderTab();
    await sleep(900);
    // Scrolled so the six worlds are all in view, from the first heading down.
    const head = [...document.querySelectorAll('#content-sanctuary *')].find((e) => /prime solar system/i.test(e.textContent) && e.children.length === 0);
    let el = head;
    while (el && !(el.scrollHeight > el.clientHeight + 20 && getComputedStyle(el).overflowY !== 'visible')) el = el.parentElement;
    const scroller = el || document.scrollingElement;
    if (head) scroller.scrollTop += head.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 6;
    band('Six worlds to conquer');
  };
  S.legends = async () => {
    await endBattle();
    await base({ level: 3, essence: 6.4e12, all: true });
    for (const l of BATTLE_DATA.LEGEND_LIST.slice(0, 11)) BATTLE.B().legends[l.id] = true;
    document.getElementById('sidebar-panel').classList.add('active');
    switchTab('sanctuary');
    BATTLE.renderTab();
    BATTLE.openLegends();
    await sleep(1200);
    // On a tablet the sheet's cards are small: larger, to fill the screen.
    if (window.innerWidth > 600) { const body = [...document.querySelectorAll('.bt-sheet')].pop().querySelector('.bt-sheet-body'); if (body) body.style.zoom = '1.75'; await sleep(300); }
    band('Win Folded Legends');
    S._release = () => BATTLE.closeSheets();
  };

  S.field = async () => {
    await base({ level: 0, essence: 1.24e6 });
    scatter([['sparky'], ['ember'], ['dewdrop'], ['cinder'], ['zephyr'], ['pyreling', 1], ['aqualet'], ['terrapin'], ['ignis'], ['torrent'], ['sylph'], ['aven'], ['magmadon'], ['nebulon']]);
    coins(5);
    spawnCrateOnField();
    await sleep(2600);
    caption('Collect and merge\nmystical beasts.');
  };

  S.merge = async () => {
    await base({ level: 2, essence: 3.8e10 });
    // The two Chronos with clear ground around them, so the finger lands on the right one.
    const others = [['geon', 12, 33], ['gargoyle', 88, 31], ['astral', 47, 58], ['frostbite', 87, 55], ['hydradon', 40, 30]].map(([id, x, y]) => PT.spawnInView(id, false, false, x, y));
    const a = PT.spawnInView('chronos', false, false, 22, 46);
    const b = PT.spawnInView('chronos', false, false, 64, 40);
    PT.still(a, b, ...others);
    await sleep(1800);
    PT.still(a, b, ...others);
    await sleep(300);
    // A finger holding one Chronos part of the way to the other: the match lights up and the
    // arrow at the top points to it.
    const r = a.dom.getBoundingClientRect(), q = b.dom.getBoundingClientRect();
    const ax = r.left + r.width / 2, ay = r.top + r.height / 2;
    const bx = q.left + q.width / 2, by = q.top + q.height / 2;
    const T = (type, target, x, y) => {
      const t = new Touch({ identifier: 1, target, clientX: x, clientY: y });
      target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: [t], targetTouches: [t], changedTouches: [t] }));
    };
    T('touchstart', a.dom, ax, ay);
    for (let i = 1; i <= 10; i++) {
      const px = ax + (bx - ax) * 0.55 * (i / 10), py = ay + (by - ay) * 0.55 * (i / 10);
      mouseX = px; mouseY = py;
      T('touchmove', document.body, px, py);
      window.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [new Touch({ identifier: 1, target: document.body, clientX: px, clientY: py })] }));
      await sleep(30);
    }
    await sleep(500);
    caption('Drag matching\nbeasts together.', window.innerWidth > 600 ? 19 : 18.5);
    S._release = () => {
      const t = new Touch({ identifier: 1, target: document.body, clientX: bx, clientY: by + 400 });
      document.body.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [t] }));
      window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: bx, clientY: by + 400 }));
    };
  };

  S.premium = async () => {
    await base({ level: 1, essence: 2.1e9 });
    scatter([['ignis'], ['torrent'], ['magmadon'], ['aven'], ['blazehorn'], ['aqualion']], { top: 30, bottom: 57 });
    await sleep(800);
    caption('');
    const done = FX.premiumOpen(window.innerWidth / 2, window.innerHeight * 0.5, 'aurelion');
    for (let i = 0; i < 60 && !document.querySelector('.fx-banner'); i++) await sleep(50);
    await sleep(700);
    caption('Open crates for\nrare beasts.', 6.5);
    S._wait = done;
  };

  S.spin = async () => {
    await base({ level: 3, essence: 6.4e12, all: true });
    scatter([['phoenix'], ['leviathan'], ['eclipse'], ['siren'], ['astral']], { top: 30, bottom: 57 });
    state.lastDailySpinDate = null;
    const rr = rollRarity;
    rollRarity = () => 'LEGENDARY';
    showDailySpinModal();
    await sleep(400);
    triggerDailySpin();
    rollRarity = rr;
    await sleep(5200);
    document.querySelectorAll('.toast-alert').forEach((t) => t.remove());
    caption('Spin for a free\nbeast every day.', 6.5);
  };

  S.biomes = async () => {
    await base({ level: 4, essence: 4.6e14 });
    scatter([['cosmos'], ['genesis'], ['eclipse', 1], ['supernova'], ['singularity'], ['nebulatitan'], ['wyrm'], ['astral'], ['omega'], ['aurelion']], { top: 27, bottom: 57 });
    coins(4);
    await sleep(2600);
    caption('Ascend through\n24 worlds.');
  };

  S.zoom = async () => {
    await base({ level: 2, essence: 7.7e10 });
    const ids = ['geon', 'aeris', 'chronos', 'astral', 'aether', 'glaciator', 'pyroclasm', 'phoenix', 'leviathan', 'eclipse', 'genesis', 'siren', 'titan', 'cosmos', 'sparky', 'ember', 'dewdrop', 'zephyr', 'sylph', 'aven', 'nebulon', 'gargoyle', 'aqualion', 'hydradon'];
    ids.forEach((id, i) => {
      const x = 6 + ((i * 37) % 84), y = 24 + ((i * 53) % 62);
      spawnBeastOnField(id, x, y, i % 7 === 0, false);
    });
    for (let i = 0; i < 6; i++) dropEssenceCrystalOnGround('sparky', 8 + Math.random() * 80, 15 + Math.random() * 70, false);
    WORLD.zoomAt(window.innerWidth / 2, window.innerHeight / 2, 0.01);
    await sleep(2600);
    caption('Pinch to explore\na bigger map.');
  };

  S.beastopedia = async () => {
    await base({ level: 3, essence: 6.4e12, all: true });
    scatter([['phoenix'], ['leviathan'], ['eclipse']], { top: 30, bottom: 57 });
    document.getElementById('menu-toggle-btn').click();
    await sleep(300);
    document.getElementById('tab-beastopedia').click();
    await sleep(300);
    state.unlockedBeasts = Object.keys(BEAST_TEMPLATES).filter((id) => !/shadow_fiend|void_parasite/.test(id) && (BEAST_TEMPLATES[id].system || 'prime') === 'prime' && BEAST_TEMPLATES[id].tier <= 15);
    renderBeastopedia();
    await sleep(600);
    const total = (document.getElementById('beastopedia-pct').textContent.match(/\/ (\d+)/) || [])[1];
    caption(`Discover all\n${total} beasts.`, 79);
  };

  // ------------------------------------------------------------ 1.5: the giants and the comet
  /** Far into the game: both solar systems at prestige 15, the comet reached, Worlds 1 to 6 won (and World 7 for World 8). */
  function late(w8) {
    const B = BATTLE.B();
    for (const w of [1, 2, 3, 4, 5, 6]) for (let k = 1; k <= 40; k++) B.best[`${w}-${k}`] = 60;
    if (w8) for (let k = 1; k <= 20; k++) B.best[`7-${k}`] = 60;
    state.cometUnlocked = true; state.cometIntroSeen = true;
    if (window.LIMITED) state.limitedBannerSeen = true;
    document.querySelectorAll('.limited-banner-wrap, .limited-banner').forEach((e) => e.remove());
  }
  /** The camera a little in from the whole field, on the fight, so a giant shows whole with the fight round it (Sam, 24 Nov: not too zoomed in). */
  function frameWide(k = 1.3) {
    const run = BATTLE.run;
    if (!run) return;
    frameFight(run.fit * k);
    // (The giants in the upper part of the view with the fight below them, and the top of the view no
    // higher than just above their cave, whose dark mouth would otherwise fill a third of the shot.)
    const halfH = (run.vh - run.top - run.bottom) / 2 / run.cam.zoom;
    const bosses = run.battle.units.filter((u) => u.boss && u.state !== 'dying');
    if (bosses.length) run.cam.y = bosses.reduce((a, u) => a + u.y, 0) / bosses.length + halfH * 0.32;
    run.cam.y = Math.max(halfH + 110, Math.min(BattleEngine.ARENA.h - halfH + 30, run.cam.y));
  }
  const COMET_SIX = ['singularity_dragon_20', 'ouroboros_1', 'mind_leviathan_1', 'ouroboros_3', 'eclipse_seraph_4', 'architect_4'];
  /** Keep the field full, the tanks first and towards the giant, the snipers after (they stop far back on their own). */
  function crowd(b) {
    if (!b || b.result) return;
    const bosses = b.units.filter((u) => u.boss && u.state !== 'dying');
    const bx = bosses.length ? bosses.reduce((a, u) => a + u.x, 0) / bosses.length / BattleEngine.ARENA.w : 0.5;
    for (const i of [1, 2, 3, 4, 5, 0]) {
      if (!b.canDeploy(i)) continue;
      const x = Math.max(0.15, Math.min(0.85, bx + (Math.random() - 0.5) * (i <= 2 ? 0.3 : 0.45)));
      b.deploy(i, x);
    }
  }
  /** Real time: keep the field full for a while (until `until` says so). */
  async function crowdFor(ms, until = null) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      const b = BATTLE.run && BATTLE.run.battle;
      if (!b || b.result || (until && until(b))) break;
      crowd(b);
      await sleep(120);
    }
  }
  /** A giant fight: the level, until its giant is well into the field, then a few seconds more. */
  async function giant(world, n, text, k = 1.3, secs = 5500, need = 1, minY = 420) {
    document.getElementById('sidebar-panel').style.visibility = '';
    late(world === 8);
    for (const id of COMET_SIX) { BATTLE.B().bestPrestige[id] = 15; if (!state.unlockedBeasts.includes(id)) state.unlockedBeasts.push(id); }
    await battle(world, n, COMET_SIX);
    await crowdFor(60000, (b) => b.units.filter((u) => u.boss && u.state !== 'dying' && u.y > minY).length >= need);
    const until = Date.now() + secs;
    while (Date.now() < until) { await crowdFor(400); specialNear(); }
    document.querySelectorAll('.limited-banner-wrap, .limited-banner').forEach((e) => e.remove());
    frameWide(k);
    await sleep(350);
    band(text);
  }
  S.w7boss = () => giant(7, 20, 'Giant mutant bosses', 1.3, 3000, 1, 760);
  S.w8duo = () => giant(8, 18, 'Two or three\ngiants at once', 1.1, 3500, 2);
  S.w8eater = () => giant(8, 20, 'Face the World-Eater', 1.2, 7000);
  S.cometbattle = () => giant(8, 5, 'Comet beasts\nwith huge specials', 1.35, 4000);
  // The comet's meadow: its beasts from hatchlings to Cosmic.
  S.comet = async () => {
    await endBattle();
    await base({ level: 15, essence: 4.2e19 });
    late(false);
    state.lowGravitySystem = Object.assign(state.lowGravitySystem || freshBranch('low_gravity'), { prestigeLevel: 15 });
    warpToSolarSystem('comet');
    await sleep(1600);
    PT.dismiss();
    document.querySelectorAll('.modal-overlay.active').forEach((m) => m.classList.remove('active'));
    document.querySelectorAll('.ask-confirm, .limited-banner-wrap, .limited-banner').forEach((e) => (e.closest('.modal-overlay') || e).remove());
    PT.clear();
    document.querySelectorAll('.crate-container').forEach((c) => c.remove());
    // (Part way to its next prestige, no boost running, the side panel shut.)
    state.prestigeLevel = 6; state.essence = 4.2e18; state.rewardBoostUntil = 0; state.doubleEssenceEndTime = 0;
    document.getElementById('sidebar-panel').classList.remove('active');
    const bd = document.getElementById('sidebar-backdrop'); if (bd) bd.classList.remove('active');
    scatter([['singularity_dragon_20'], ['nebula_jelly_3'], ['quasar_phoenix_16'], ['emerald_serpent_6'], ['ouroboros_20'], ['prism_stag_10'], ['mind_leviathan_13'], ['grey_envoy_4']], { top: 26, bottom: 60 });
    if (typeof updateHUD === 'function') updateHUD();
    await sleep(1800);
    // (The side panel sits just off the right edge; the band shrinks the page and would bring it into view.)
    document.getElementById('sidebar-panel').style.visibility = 'hidden';
    band('A third world:\nthe Interstellar Comet');
  };

  async function run(name) {
    if (S._release) { S._release(); S._release = null; }
    await S[name]();
    return document.querySelectorAll('.beast-container').length;
  }
  return { run, caption, base, scatter, coins, battle, names: ['field', 'merge', 'premium', 'spin', 'biomes', 'zoom', 'beastopedia', 'battle', 'specials', 'boss', 'worlds', 'legends', 'w7boss', 'w8duo', 'w8eater', 'comet', 'cometbattle'] };
})();
'ok';
