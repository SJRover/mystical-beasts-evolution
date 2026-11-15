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

  async function run(name) {
    if (S._release) { S._release(); S._release = null; }
    await S[name]();
    return document.querySelectorAll('.beast-container').length;
  }
  return { run, caption, names: ['field', 'merge', 'premium', 'spin', 'biomes', 'zoom', 'beastopedia'] };
})();
'ok';
