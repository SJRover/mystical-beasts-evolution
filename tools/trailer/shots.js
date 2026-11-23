// The 1.4 gameplay trailer's shots, staged inside the running game under the recorder's clock
// (tw.js). Each shot: setup() runs on real time, then the recorder steps `pre` frames unseen and
// films `frames` frames, calling act(f) before each. Everything shown is the game's own.
window.TRAILER = (() => {
  const W = () => window.__TW;
  const wait = (ms) => W().wait(ms);
  const caption = (text, top) => SCENES.caption(text, top);
  const touch = (type, target, x, y) => {
    const t = new Touch({ identifier: 1, target, clientX: x, clientY: y });
    const list = type === 'touchend' ? [] : [t];
    target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: list, targetTouches: list, changedTouches: [t] }));
  };
  const centre = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const tap = (el) => { const [x, y] = centre(el); const o = { bubbles: true, pointerId: 7, clientX: x, clientY: y, isPrimary: true }; el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new PointerEvent('pointerup', o)); };
  const ease = (k) => k * k * (3 - 2 * k);

  /** A drag of beast `a` onto beast `b` from frame f0 over n frames, let go on frame f0 + n + 2. */
  function dragPlan(a, b, f0, n) {
    let from = null, to = null;
    return (f) => {
      if (f === f0) { from = centre(a.dom); to = centre(b.dom); touch('touchstart', a.dom, from[0], from[1]); }
      if (f > f0 && f <= f0 + n) {
        const k = ease((f - f0) / n);
        const x = from[0] + (to[0] - from[0]) * k, y = from[1] + (to[1] - from[1]) * k;
        window.mouseX = x; window.mouseY = y;
        touch('touchmove', document.body, x, y);
        window.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [new Touch({ identifier: 1, target: document.body, clientX: x, clientY: y })] }));
      }
      if (f === f0 + n + 2) { touch('touchend', document.body, to[0], to[1]); window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: to[0], clientY: to[1] })); }
    };
  }

  const S = {};
  let act = () => {};
  window.checkMergeAchievements = () => {};
  const realDiscovery = window.triggerDiscoveryModal;
  const discoveries = (on) => { window.triggerDiscoveryModal = on ? realDiscovery : () => {}; };
  if (typeof MERGE_ACH !== 'undefined' && window.BATTLE) { const B = BATTLE.B(); B.mach = B.mach || {}; for (const a of MERGE_ACH) B.mach[a.id] = B.mach[a.id] || 1; }
  async function endBattle() {
    if (!BATTLE.run) return;
    BATTLE.run.paused = false;
    BATTLE.run.retreated = true;
    BATTLE.run.battle.finish('lost');
    // The result screen comes on the game's clock: move it on ourselves rather than wait for it.
    for (let i = 0; i < 80 && !document.querySelector('.bt-modal [data-a=map]'); i++) { W().step(100); await wait(20); }
    const b = document.querySelector('.bt-modal [data-a=map]');
    if (b) b.click();
    W().step(100);
    await wait(200);
    document.querySelectorAll('.bt-modal').forEach((m) => m.remove());
  }
  if (window.BATTLE && BATTLE.checkMergeAch) BATTLE.checkMergeAch = () => {};
  const quiet = document.createElement('style');
  quiet.textContent = '#toast-container, .toast-alert { display: none !important; }';
  document.head.appendChild(quiet);
  /** Nothing left over from the shot before: cards, crate scenes, toasts. */
  function clean() {
    document.querySelectorAll('.modal-overlay.active').forEach((m) => m.classList.remove('active'));
    document.querySelectorAll('.fx-overlay, .toast-alert').forEach((e) => e.remove());
  }

  // 1. A full meadow: beasts wandering, essence dropping, a crate landing.
  S.meadow = async () => {
    discoveries(false);
    clean();
    await SCENES.base({ level: 3, essence: 6.4e12, all: true });
    SCENES.scatter([['phoenix'], ['leviathan'], ['eclipse', 1], ['siren'], ['astral'], ['aeris'], ['chronos'], ['blazehorn'], ['aqualion'], ['nebulon'], ['aven'], ['glaciator']], { top: 26, bottom: 58 });
    SCENES.coins(5);
    await wait(1500);
    act = (f) => {
      if (f === 6) caption('Collect beasts');
      if (f === 40) spawnCrateOnField();
    };
  };

  // 2. Two merges: a pair dragged together, the flash, the new beast and its discovery card.
  S.merge = async () => {
    discoveries(true);
    const realCrate = window.spawnCrateOnField;
    window.spawnCrateOnField = () => {};
    setTimeout(() => { window.spawnCrateOnField = realCrate; }, 20000);
    clean();
    await SCENES.base({ level: 2, essence: 3.8e10 });
    const others = [['geon', 12, 33], ['gargoyle', 86, 31], ['frostbite', 87, 58], ['hydradon', 40, 28], ['aqualion', 14, 60]].map(([id, x, y]) => PT.spawnInView(id, false, false, x, y));
    const a = PT.spawnInView('chronos', false, false, 24, 47);
    const b = PT.spawnInView('chronos', false, false, 64, 41);
    // The beast they make has not been seen yet, so its discovery card comes up.
    state.unlockedBeasts = state.unlockedBeasts.filter((id) => id !== 'pyroclasm' && id !== 'glaciator' && id !== 'astral' && id !== 'aether');
    PT.still(a, b, ...others);
    await wait(1200);
    PT.still(a, b, ...others);
    const drag = dragPlan(a, b, 8, 22);
    act = (f) => {
      if (f === 2) caption('Merge them');
      drag(f);
      if (f === 40) caption('');
      // The discovery card for a moment, then the new beast on the field.
      if (f === 74) document.querySelectorAll('#discovery-modal.active').forEach((m) => m.classList.remove('active'));
    };
  };

  // 3. A premium crate opening on a Legendary.
  S.crate = async () => {
    discoveries(false);
    document.querySelectorAll('#discovery-modal.active').forEach((m) => m.classList.remove('active'));
    await SCENES.base({ level: 1, essence: 2.1e9 });
    SCENES.scatter([['ignis'], ['torrent'], ['magmadon'], ['aven'], ['blazehorn'], ['aqualion']], { top: 30, bottom: 57 });
    await wait(600);
    act = (f) => { if (f === 0) FX.premiumOpen(window.innerWidth / 2, window.innerHeight * 0.5, 'aurelion'); };
  };

  // 4. The Beastopedia, scrolling.
  S.collection = async () => {
    discoveries(false);
    clean();
    await SCENES.base({ level: 3, essence: 6.4e12, all: true });
    // Every beast of both solar systems, the Relics and the Folded Legends.
    for (const id of Object.keys(BEAST_TEMPLATES)) if (!/shadow_fiend|void_parasite/.test(id) && !state.unlockedBeasts.includes(id)) state.unlockedBeasts.push(id);
    for (const l of BATTLE_DATA.LEGEND_LIST) BATTLE.B().legends[l.id] = true;
    document.getElementById('menu-toggle-btn').click();
    await wait(300);
    document.getElementById('tab-beastopedia').click();
    await wait(300);
    renderBeastopedia();
    await wait(1200);
    // The element that scrolls: up from a beast's card until one does.
    let scroller = document.querySelector('.beastopedia-card');
    while (scroller && !(scroller.scrollHeight > scroller.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(scroller).overflowY))) scroller = scroller.parentElement;
    scroller = scroller || document.scrollingElement;
    const span = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    // Down through every section, gently at the start and the end.
    act = (f) => { if (f === 0) caption('Discover them all', 79); const k = Math.min(1, f / 92); scroller.scrollTop = span * (k * k * (3 - 2 * k)); };
  };

  // 5. The Battle tab: its painted worlds.
  S.worlds = async () => {
    discoveries(false);
    clean();
    // Every world open, as a player far along sees it.
    state.prestigeLevel = Math.max(state.prestigeLevel, 9);
    for (const [w, won, stars] of [[1, 40, 31], [2, 40, 24], [3, 40, 17], [4, 40, 22], [5, 40, 9], [6, 18, 3]]) {
      for (let k = 1; k <= won; k++) BATTLE.B().best[`${w}-${k}`] = 60;
      for (let k = 1; k <= stars; k++) BATTLE.B().stars[`${w}-${Math.min(won, k * Math.max(1, Math.floor(won / stars)))}`] = true;
    }
    document.getElementById('sidebar-panel').classList.add('active');
    document.getElementById('tab-sanctuary').click();
    await wait(300);
    BATTLE.renderTab();
    await wait(800);
    const box = document.getElementById('content-sanctuary');
    const scroller = [box, ...box.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 40 && getComputedStyle(e).overflowY !== 'visible') || box.closest('.sidebar-content') || document.scrollingElement;
    act = (f) => { if (f === 0) caption('Battle mode\nis here!', 9); scroller.scrollTop = f * 4; };
  };

  /** Start a battle on a level with a deck, everything on the field already won. */
  async function battle(world, n, deck, prestige = 0) {
    await endBattle();
    for (const id of deck) if (!BATTLE_DATA.LEGENDS[id]) BATTLE.B().bestPrestige[id] = prestige;
    window.triggerDiscoveryModal = () => {};
    clean();
    document.getElementById('sidebar-panel').classList.remove('active');
    caption('');
    for (let k = 1; k < n; k++) BATTLE.B().best[`${world}-${k}`] = 60;
    BATTLE.B().howSeen = true;
    BATTLE.B().tipSeen = true;
    for (const id of deck) { if (BATTLE_DATA.LEGENDS[id]) BATTLE.B().legends[id] = true; else if (!state.unlockedBeasts.includes(id)) state.unlockedBeasts.push(id); }
    state.unlockedEvolved = deck.slice(0, 3).filter((id) => !BATTLE_DATA.LEGENDS[id]);
    BATTLE.closeSheets();
    BATTLE.openWorld(BATTLE_DATA.WORLDS[world - 1]);
    await wait(300);
    BATTLE.openLevel(BATTLE_DATA.WORLDS[world - 1], n);
    await wait(500);
    const B = BATTLE.B();
    B.decks[BATTLE_DATA.WORLDS[world - 1].system] = deck.slice();
    document.querySelectorAll('.bt-sheet').forEach((s) => s.remove());
    BATTLE.openLevel(BATTLE_DATA.WORLDS[world - 1], n);
    await wait(500);
    [...document.querySelectorAll('.bt-sheet')].pop().querySelector('.bt-go').click();
    await wait(400);
  }
  /** Follow the fight: the thickest knot of units fighting (a boss counts four), smoothly. */
  function follow(zoom = 1.1) {
    const run = BATTLE.run;
    if (!run) return;
    if (zoom === 'fit' || zoom < 0.7) {
      // Out wide: the whole field (or most of it), centred a little towards the fight.
      const z = zoom === 'fit' ? run.fit : zoom;
      run.cam.zoom += (z - run.cam.zoom) * 0.08;
      run.cam.x += (500 - run.cam.x) * 0.08;
      run.cam.y += ((zoom === 'fit' ? 1000 : 1150) - run.cam.y) * 0.08;
      return;
    }
    const live = run.battle.units.filter((u) => u.state !== 'dying' && !u.burrowed && Number.isFinite(u.x) && Number.isFinite(u.y));
    if (!live.length) return;
    const hot = live.filter((u) => u.state === 'fight' || u.state === 'capture' || u.boss);
    const pool = hot.length >= 2 ? hot : live;
    let tx = 0, ty = 0, tw = 0;
    for (const u of pool) {
      let n = 0;
      for (const o of pool) if (Math.hypot(o.x - u.x, o.y - u.y) < 280) n++;
      const w = n * n * (u.boss ? 4 : 1);
      tx += u.x * w; ty += u.y * w; tw += w;
    }
    tx = Math.max(320, Math.min(680, tx / tw));
    ty = Math.max(450, Math.min(1650, ty / tw));
    run.cam.zoom += (zoom - run.cam.zoom) * 0.05;
    run.cam.x += (tx - run.cam.x) * 0.05;
    run.cam.y += (ty - run.cam.y) * 0.05;
  }
  /** A special from a special-slot beast with an enemy close to it (none wasted on nothing). */
  let specialsLeft = 0;
  function specialNear(R = 180) {
    const b = BATTLE.run && BATTLE.run.battle;
    if (!b || specialsLeft <= 0) return;
    for (let i = 0; i < 3; i++) {
      if (!b.canSpecial(i)) continue;
      const u = b.onField(i).find((m) => b.units.some((o) => o.side === 'foe' && o.state !== 'dying' && !o.burrowed && Math.hypot(o.x - m.x, o.y - m.y) < R));
      if (u && b.special(i, u)) { specialsLeft--; return u; }
    }
  }
  /** One of the special slots' beasts on the field does its special. */
  function special() {
    const b = BATTLE.run && BATTLE.run.battle;
    if (!b) return;
    for (let i = 0; i < 3; i++) if (b.canSpecial(i)) { b.special(i); return; }
  }
  /** Play the ready cards across the lanes every `every` frames. */
  function playCards(f, every = 9) {
    if (f % every) return;
    const run = BATTLE.run;
    if (!run || run.battle.result) return;
    const cards = [...document.querySelectorAll('.bt-cardbtn.ready')];
    if (!cards.length) return;
    run.marker = [0.3, 0.7, 0.5, 0.2, 0.8][((Math.floor(f / every) % 5) + 5) % 5];
    tap(cards[0]);
  }

  /** A battle shot that closes in on the special when it happens (the showcase). */
  function fightZoom(text, zoom, specials, every = 5) {
    specialsLeft = specials;
    let focus = null;
    act = (f) => {
      playCards(f, every);
      const hero = f >= 4 && f % 2 === 0 ? specialNear(220) : null;
      if (hero) focus = { u: hero, until: f + 50 };
      const run = BATTLE.run;
      if (focus && f < focus.until && run) {
        run.cam.zoom += (1.7 - run.cam.zoom) * 0.18;
        run.cam.x += (Math.max(320, Math.min(680, focus.u.x)) - run.cam.x) * 0.2;
        run.cam.y += (Math.max(450, Math.min(1650, focus.u.y - 40)) - run.cam.y) * 0.2;
      } else follow(zoom);
      if (f === 0) caption(text || '', 15);
      if (f === 45) caption('');
    };
  }
  /** A battle shot: play cards, follow the fight, specials when enemies are close, a caption a moment. */
  function fight(text, zoom, specials, every = 6) {
    specialsLeft = specials;
    act = (f) => {
      playCards(f, every);
      follow(zoom);
      if (f >= 6 && f % 3 === 0) specialNear(200);
      if (f === 0) caption(text || '', 15);
      if (f === 45) caption('');
    };
  }

  // 6. World 1: the first clash.
  S.battle = async () => {
    await battle(1, 8, ['blazehorn', 'aqualion', 'aeris', 'chronos', 'paper_tiger', 'lantern_koi']);
    fight('', 'fit', 0, 5);
  };
  // 7. World 2, the Iron Kingdom: its boss, the Minotaur Lord, who charges.
  S.kingdom = async () => {
    await battle(2, 20, ['void_monarch', 'dark_matter_leviathan', 'ent_guardian', 'venom_dragon', 'webspinner', 'bark_titan'], 3);
    fight('Fight bosses', 1.1, 1);
  };
  // 8. World 4, the Moon Hollows (the Low Gravity system): cloakers, burrowers, chargers.
  S.moon = async () => {
    await battle(4, 28, ['singularity_monarch', 'void_jellyfish', 'astral_monarch', 'cosmic_jellyfish', 'dark_pterodactyl', 'cosmic_wing'], 0);
    fight('Two solar systems', 0.55, 1);
  };
  // 9. World 6, the Eclipse Court: summoners and healers, and the specials.
  S.eclipse = async () => {
    await battle(6, 25, ['singularity_monarch', 'void_jellyfish', 'astral_monarch', 'cosmic_jellyfish', 'dark_pterodactyl', 'cosmic_wing'], 10);
    fight('Use specials', 1.15, 3, 5);
  };
  // 10. World 3's boss, the Hive Empress.
  S.hive = async () => {
    await battle(3, 30, ['void_monarch', 'dark_matter_leviathan', 'ent_guardian', 'venom_dragon', 'webspinner', 'bark_titan'], 11);
    fight('', 1.15, 2, 5);
  };
  // 11. The last boss of all, the Eclipse Emperor.
  S.emperor = async () => {
    await battle(6, 40, ['singularity_monarch', 'void_jellyfish', 'astral_monarch', 'cosmic_jellyfish', 'dark_pterodactyl', 'cosmic_wing'], 13);
    fight('', 1.1, 3, 5);
  };

  // 9. The end card over the battle: the icon, the name, and the news.
  S.end = async () => {
    caption('');
    clean();
    document.querySelectorAll('.bt-modal').forEach((m) => m.remove());
    const d = document.createElement('div');
    d.id = 'trailer-end';
    const small = Math.min(window.innerWidth, window.innerHeight);
    d.innerHTML = `<img src="/assets/icon.png" alt=""><b>Merge Beasts</b><span>Battle mode is here!</span>`;
    d.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:' + Math.round(small * 0.03) + 'px;background:radial-gradient(circle at 50% 45%, rgba(40,30,90,0.82), rgba(8,6,24,0.94));animation:trEnd 0.5s ease-out both;';
    const st = document.createElement('style');
    st.textContent = `@keyframes trEnd { from { opacity: 0; transform: scale(1.06); } to { opacity: 1; transform: none; } }
      #trailer-end img { width: ${Math.round(small * 0.38)}px; height: ${Math.round(small * 0.38)}px; border-radius: 22%; box-shadow: 0 ${Math.round(small * 0.02)}px ${Math.round(small * 0.08)}px rgba(0,0,0,0.6); }
      #trailer-end b { font-family: var(--font-game); font-size: ${Math.round(small * 0.12)}px; color: #fff; -webkit-text-stroke: ${Math.round(small * 0.012)}px #1a1440; paint-order: stroke fill; }
      #trailer-end span { font-family: var(--font-game); font-size: ${Math.round(small * 0.075)}px; color: #ffd43b; -webkit-text-stroke: ${Math.round(small * 0.009)}px #3a2000; paint-order: stroke fill; }`;
    document.head.appendChild(st);
    document.body.appendChild(d);
    await wait(300);
    act = () => {};
  };

  // ------------------------------------------------------------ the battle showcase (Sam, 23 Nov)
  // Worlds, ways of playing, beasts, enemies and bosses: wide for the whole field, close for the
  // specials, fast; then rare beasts being won.
  S.sc_wide = async () => { await battle(1, 8, ['blazehorn', 'aqualion', 'aeris', 'chronos', 'paper_tiger', 'lantern_koi']); fight('Battle mode', 'fit', 0, 5); };
  S.sc_minotaur = async () => { await battle(2, 20, ['void_monarch', 'dark_matter_leviathan', 'ent_guardian', 'venom_dragon', 'webspinner', 'bark_titan'], 3); fight('Fight bosses', 1.15, 1); };
  S.sc_freeze = async () => { await battle(1, 13, ['leviathan', 'aqualion', 'eclipse', 'siren', 'fold_phoenix', 'origami_dragon']); fightZoom('Evolved specials', 1.0, 1); };
  S.sc_horde = async () => { await battle(3, 25, ['void_monarch', 'dark_matter_leviathan', 'ent_guardian', 'venom_dragon', 'webspinner', 'bark_titan'], 9); fight('Plan your six', 0.5, 0, 5); };
  S.sc_moon = async () => { await battle(4, 16, ['singularity_monarch', 'void_jellyfish', 'astral_monarch', 'cosmic_jellyfish', 'dark_pterodactyl', 'cosmic_wing'], 0); fight('', 1.15, 1); };
  S.sc_gravity = async () => { await battle(6, 25, ['singularity_monarch', 'void_jellyfish', 'astral_monarch', 'cosmic_jellyfish', 'dark_pterodactyl', 'cosmic_wing'], 10); fightZoom('', 1.05, 2); };
  S.sc_pirates = async () => { await battle(5, 13, ['singularity_monarch', 'void_jellyfish', 'astral_monarch', 'cosmic_jellyfish', 'dark_pterodactyl', 'cosmic_wing'], 4); fight('', 0.6, 1); };
  S.sc_fortress = async () => { await battle(3, 28, ['void_monarch', 'dark_matter_leviathan', 'ent_guardian', 'venom_dragon', 'webspinner', 'bark_titan'], 10); fight('', 'fit', 0, 5); };
  S.sc_gorgon = async () => { await battle(2, 30, ['void_monarch', 'dark_matter_leviathan', 'ent_guardian', 'venom_dragon', 'webspinner', 'bark_titan'], 5); fight('', 1.15, 1); };
  S.sc_starfall = async () => { await battle(3, 33, ['dark_matter_leviathan', 'void_monarch', 'ent_guardian', 'venom_dragon', 'webspinner', 'bark_titan'], 11); fightZoom('', 1.05, 1); };
  S.sc_emperor = async () => {
    await battle(6, 40, ['singularity_monarch', 'void_jellyfish', 'astral_monarch', 'cosmic_jellyfish', 'dark_pterodactyl', 'cosmic_wing'], 13);
    fight('The last boss', 0.6, 2, 5);
    const wide = act;
    // Out wide for a bar, then in close.
    act = (f) => { wide(f); if (f >= 70) follow(1.2); };
  };
  // A tenth star wins the Paper Crane: the results with "New Folded Legend".
  S.sc_legend = async () => {
    const B = BATTLE.B();
    for (const l of BATTLE_DATA.LEGEND_LIST) delete B.legends[l.id];
    B.stars = {};
    for (let k = 21; k <= 29; k++) B.stars['1-' + k] = true;
    await battle(1, 2, ['void_monarch', 'dark_matter_leviathan', 'ent_guardian', 'venom_dragon', 'webspinner', 'bark_titan'], 4);
    fight('', 'fit', 0, 4);
  };
  // A Relic from a merge achievement, in its own card.
  S.sc_relic = async () => {
    await endBattle();
    discoveries(true);
    clean();
    await SCENES.base({ level: 3, essence: 6.4e12, all: true });
    SCENES.scatter([['phoenix'], ['leviathan'], ['eclipse', 1], ['siren'], ['astral'], ['aeris']], { top: 30, bottom: 58 });
    await wait(600);
    act = (f) => {
      if (f === 0) caption('Earn rare Relics', 15);
      if (f === 4) { if (!state.unlockedEvolved.includes('rose_window')) state.unlockedEvolved.push('rose_window'); triggerDiscoveryModal('rose_window'); }
    };
  };
  // A Dark Matter beast out of a premium crate.
  S.sc_crate = async () => {
    discoveries(false);
    clean();
    await SCENES.base({ level: 5, essence: 2.1e15 });
    SCENES.scatter([['ignis'], ['torrent'], ['magmadon'], ['aven'], ['blazehorn'], ['aqualion']], { top: 30, bottom: 57 });
    await wait(600);
    act = (f) => { if (f === 0) FX.premiumOpen(window.innerWidth / 2, window.innerHeight * 0.5, 'dark_matter_leviathan'); };
  };

  async function run(name) {
    act = () => {};
    await S[name]();
    return name;
  }
  return { run, act: (f) => act(f), S };
})();
