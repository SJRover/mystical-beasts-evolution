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

  // 1. A full meadow: beasts wandering, essence dropping, a crate landing.
  S.meadow = async () => {
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
    };
  };

  // 3. A premium crate opening on a Legendary.
  S.crate = async () => {
    document.querySelectorAll('#discovery-modal.active').forEach((m) => m.classList.remove('active'));
    await SCENES.base({ level: 1, essence: 2.1e9 });
    SCENES.scatter([['ignis'], ['torrent'], ['magmadon'], ['aven'], ['blazehorn'], ['aqualion']], { top: 30, bottom: 57 });
    await wait(600);
    act = (f) => { if (f === 0) FX.premiumOpen(window.innerWidth / 2, window.innerHeight * 0.5, 'aurelion'); };
  };

  // 4. The Beastopedia, scrolling.
  S.collection = async () => {
    await SCENES.base({ level: 3, essence: 6.4e12, all: true });
    document.getElementById('menu-toggle-btn').click();
    await wait(300);
    document.getElementById('tab-beastopedia').click();
    await wait(300);
    renderBeastopedia();
    await wait(800);
    const box = document.getElementById('content-beastopedia');
    const scroller = [box, ...box.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 40 && getComputedStyle(e).overflowY !== 'visible') || box.closest('.sidebar-content') || document.scrollingElement;
    act = (f) => { if (f === 0) caption('Discover them all', 79); scroller.scrollTop = f * 9; };
  };

  // 5. The Battle tab: its painted worlds.
  S.worlds = async () => {
    for (let k = 1; k <= 40; k++) BATTLE.B().best['1-' + k] = 60;
    for (let k = 1; k <= 26; k++) BATTLE.B().best['2-' + k] = 60;
    for (let k = 1; k <= 30; k++) if (k % 3) BATTLE.B().stars['1-' + k] = true;
    document.getElementById('tab-sanctuary').click();
    await wait(300);
    BATTLE.renderTab();
    await wait(800);
    const box = document.getElementById('content-sanctuary');
    const scroller = [box, ...box.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 40 && getComputedStyle(e).overflowY !== 'visible') || box.closest('.sidebar-content') || document.scrollingElement;
    act = (f) => { if (f === 0) caption('Battle mode\nis here!', 79); scroller.scrollTop = f * 4; };
  };

  /** Start a battle on a level with a deck, everything on the field already won. */
  async function battle(world, n, deck) {
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
    run.marker = [0.3, 0.7, 0.5, 0.2, 0.8][Math.floor(f / every) % 5];
    tap(cards[0]);
  }

  // 6. A battle: the countdown ends, beasts pour out and meet the enemy.
  S.battle = async () => {
    await battle(1, 8, ['blazehorn', 'aqualion', 'aeris', 'chronos', 'paper_tiger', 'lantern_koi']);
    act = (f) => { if (f > 12) playCards(f, 7); };
  };

  // 7. A horde.
  S.horde = async () => {
    await battle(1, 13, ['leviathan', 'eclipse', 'aqualion', 'siren', 'fold_phoenix', 'origami_dragon']);
    act = (f) => { playCards(f, 6); if (f === 0) caption('Use specials', 17); if (f === 30 || f === 75) special(); if (f === 60) caption(''); };
  };

  // 8. A boss: it arrives, then the win.
  S.boss = async () => {
    await battle(1, 10, ['ragnarok', 'aurelion', 'voidwalker', 'infinity', 'paper_kirin', 'thousand_cranes']);
    act = (f) => { playCards(f, 6); if (f === 0) caption('Beat the bosses', 17); if (f === 50) caption(''); if (f === 70) special(); };
  };

  // 9. The end card over the battle: the icon, the name, and the news.
  S.end = async () => {
    caption('');
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

  async function run(name) {
    act = () => {};
    await S[name]();
    return name;
  }
  return { run, act: (f) => act(f), S };
})();
