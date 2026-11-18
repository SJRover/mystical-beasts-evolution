/**
 * Merge Beasts: the meadow as a world bigger than the screen (version 1.3).
 *
 * The background and the beasts' field sit inside one #world element, WORLD.SCALE times the
 * screen's width and height, which the camera moves and scales: two fingers pinch to zoom, and one
 * finger on open ground drags the map (1.4; a mouse wheel and a drag do the same on a computer).
 * One finger on a beast still drags it, and taps still collect crystals and open crates.
 *
 * Positions stay percentages of the field, as the saves and all the game's rules have them; the
 * distance rules (merging, infection, shadow attacks) are divided by WORLD.SCALE in game.js so they
 * cover the same ground as before. Beasts, crates and purchases appear where the camera is looking.
 */
const WORLD = (() => {
  const SCALE = 1.8;
  window.WORLD_SCALE = SCALE;
  const MAX_ZOOM = 1.6;
  let el = null, vp = null, vw = 390, vh = 844;
  let z = 0.74, tx = 0, ty = 0;
  const minZoom = () => 1 / SCALE;

  function init() {
    vp = document.getElementById('meadow-viewport');
    const bg = document.getElementById('meadow-bg');
    const pg = document.getElementById('beast-playground');
    if (!vp || !bg || !pg || document.getElementById('world')) return;
    el = document.createElement('div');
    el.id = 'world';
    vp.insertBefore(el, bg);
    el.appendChild(bg);
    el.appendChild(pg);
    measure();
    centre();
    listen();
    window.addEventListener('resize', () => {
      padAt = 0;
      const cx = (vw / 2 - tx) / z / (vw * SCALE), cy = (vh / 2 - ty) / z / (vh * SCALE);
      measure();
      tx = vw / 2 - cx * vw * SCALE * z;
      ty = vh / 2 - cy * vh * SCALE * z;
      apply();
    });
  }

  function measure() {
    vw = vp.clientWidth || window.innerWidth;
    vh = vp.clientHeight || window.innerHeight;
    el.style.width = `${vw * SCALE}px`;
    el.style.height = `${vh * SCALE}px`;
  }

  /**
   * 1.4: how much of the screen the bars cover, top (the HUD) and bottom (the spawner bar and the
   * incubators), in screen pixels. The camera may go that far past the world's top and bottom
   * edges, so a beast at an edge can always be brought out into the open at any zoom: they used to
   * wander under the bars and could not be reached (Sam, 17 Nov). Measured again now and then.
   */
  let padT = 0, padB = 0, padAt = 0;
  function pads() {
    const now = performance.now();
    if (now - padAt < 1000) return;
    padAt = now;
    const vr = vp.getBoundingClientRect();
    const hud = document.getElementById('hud-overlay');
    padT = hud && hud.offsetParent !== null ? Math.max(0, Math.min(vh * 0.3, hud.getBoundingClientRect().bottom - vr.top)) : 0;
    let b = 0;
    for (const id of ['spawner-overlay', 'incubator-pedestal', 'incubator-pedestal-2', 'incubator-pedestal-3']) {
      const e = document.getElementById(id);
      if (!e || e.offsetParent === null) continue;
      const r = e.getBoundingClientRect();
      if (r.height > 0 && r.top < vr.bottom) b = Math.max(b, vr.bottom - r.top);
    }
    padB = Math.min(vh * 0.35, b);
  }

  function clamp() {
    z = Math.max(minZoom(), Math.min(MAX_ZOOM, z));
    pads();
    tx = Math.min(0, Math.max(vw - vw * SCALE * z, tx));
    ty = Math.min(padT, Math.max(vh - vh * SCALE * z - padB, ty));
  }

  let settle = 0;
  function moving() {
    el.classList.add('moving');
    clearTimeout(settle);
    settle = setTimeout(() => el.classList.remove('moving'), 220);
  }

  function apply() {
    clamp();
    moving();
    if (typeof BIOMES !== 'undefined') BIOMES.zoomChanged(z);
    el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${z.toFixed(4)})`;
    if (typeof updatePlaygroundRect === 'function') updatePlaygroundRect();
  }

  /** Back to the middle of the world at the usual zoom. */
  function centre() {
    z = 0.74;
    tx = vw / 2 - (vw * SCALE * z) / 2;
    ty = vh / 2 - (vh * SCALE * z) / 2;
    apply();
  }

  function zoomAt(sx, sy, nz) {
    const wx = (sx - tx) / z, wy = (sy - ty) / z;
    z = Math.max(minZoom(), Math.min(MAX_ZOOM, nz));
    tx = sx - wx * z;
    ty = sy - wy * z;
    apply();
  }

  /** A point given as a percentage of the screen, as a percentage of the world. */
  function viewPct(sxPct, syPct) {
    const sx = (sxPct / 100) * vw, sy = (syPct / 100) * vh;
    return {
      x: Math.max(1, Math.min(92, ((sx - tx) / z / (vw * SCALE)) * 100)),
      y: Math.max(9, Math.min(90, ((sy - ty) / z / (vh * SCALE)) * 100)),
    };
  }

  const worldSize = () => ({ w: vw * SCALE, h: vh * SCALE });
  const zoom = () => z;
  /**
   * 1.4: if a beast at (x, y) per cent of the world, `size` world pixels across, has its middle
   * under the top bar or the bottom bars on screen, the way out on screen (towards the middle).
   */
  function underBar(x, y, size) {
    pads();
    const sx = tx + ((x / 100) * vw * SCALE + size / 2) * z;
    const sy = ty + ((y / 100) * vh * SCALE + size / 2) * z;
    if (sx < 0 || sx > vw) return null;
    if (sy > padT + 6 && sy < vh - padB - 6) return null;
    if (sy < -size * z || sy > vh + size * z) return null;
    return { dx: vw / 2 - sx, dy: vh * 0.45 - sy };
  }

  // ---------------------------------------------------------------- gestures
  let pinch = null;
  function cancelBeastDrag() {
    try {
      if (typeof draggedBeast === 'undefined' || !draggedBeast) return;
      if (dragElement) dragElement.classList.remove('dragging');
      state.beastsOnField.forEach((b) => b.dom.classList.remove('hovering-compatible'));
      document.querySelectorAll('.hovering-compatible').forEach((e) => e.classList.remove('hovering-compatible'));
      dragStartedMoving = false;
      draggedBeast = null;
      dragElement = null;
    } catch (e) { /* nothing held */ }
  }
  const mid = (t) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });
  const gap = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  function listen() {
    for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
    vp.addEventListener('touchstart', (e) => {
      if (e.touches.length >= 2) {
        cancelBeastDrag();
        const m = mid(e.touches);
        pinch = { d: gap(e.touches), z, wx: (m.x - tx) / z, wy: (m.y - ty) / z };
        e.preventDefault();
      }
    }, { capture: true, passive: false });
    vp.addEventListener('touchmove', (e) => {
      if (!pinch || e.touches.length < 2) return;
      e.preventDefault();
      e.stopPropagation();
      const m = mid(e.touches);
      z = Math.max(minZoom(), Math.min(MAX_ZOOM, pinch.z * (gap(e.touches) / Math.max(1, pinch.d))));
      tx = m.x - pinch.wx * z;
      ty = m.y - pinch.wy * z;
      apply();
    }, { capture: true, passive: false });
    const endPinch = (e) => { if (pinch && e.touches.length < 2) pinch = null; };
    vp.addEventListener('touchend', endPinch, { capture: true });
    vp.addEventListener('touchcancel', endPinch, { capture: true });

    // 1.4: one finger on open ground drags the map, once it has moved a little (so taps still tap).
    let one = null;
    const free = (t) => !(t && t.closest && t.closest('.beast-container, .crate-container, .essence-crystal, .premium-crate, button, a, input'));
    const holding = () => { try { return typeof draggedBeast !== 'undefined' && !!draggedBeast; } catch (e) { return false; } };
    vp.addEventListener('touchstart', (e) => {
      one = e.touches.length === 1 && !pinch && free(e.target) ? { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty, on: false } : null;
    }, { passive: true });
    vp.addEventListener('touchmove', (e) => {
      if (!one || pinch || e.touches.length !== 1 || holding()) { one = null; return; }
      const dx = e.touches[0].clientX - one.x, dy = e.touches[0].clientY - one.y;
      if (!one.on && Math.hypot(dx, dy) < 9) return;
      one.on = true;
      e.preventDefault();
      tx = one.tx + dx;
      ty = one.ty + dy;
      apply();
    }, { passive: false });
    vp.addEventListener('touchend', () => { one = null; });
    vp.addEventListener('touchcancel', () => { one = null; });
    // The same with the left mouse button on open ground.
    let drag = null;
    vp.addEventListener('mousedown', (e) => { if (e.button === 0 && free(e.target)) drag = { x: e.clientX, y: e.clientY, tx, ty, on: false }; });
    window.addEventListener('mousemove', (e) => {
      if (!drag || holding()) { drag = null; return; }
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on && Math.hypot(dx, dy) < 9) return;
      drag.on = true;
      tx = drag.tx + dx;
      ty = drag.ty + dy;
      apply();
    });
    window.addEventListener('mouseup', () => { drag = null; });

    // On a computer: the wheel zooms round the pointer, a right-button drag looks round.
    vp.addEventListener('wheel', (e) => {
      if (e.target.closest && e.target.closest('.modal, .panel, #menu-overlay, .tab-content')) return;
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, z * Math.exp(-e.deltaY * 0.0015));
    }, { passive: false });
    let pan = null;
    vp.addEventListener('mousedown', (e) => { if (e.button === 2) pan = { x: e.clientX, y: e.clientY, tx, ty }; });
    window.addEventListener('mousemove', (e) => { if (pan) { tx = pan.tx + (e.clientX - pan.x); ty = pan.ty + (e.clientY - pan.y); apply(); } });
    window.addEventListener('mouseup', () => { pan = null; });
    vp.addEventListener('contextmenu', (e) => { if (e.target.closest('#world')) e.preventDefault(); });
  }

  // ---------------------------------------------------------------- while dragging a beast
  // An arrow at the top of the screen points to the nearest beast it can merge with (or says there
  // is none), and holding it near an edge of the screen moves the map that way, the beast staying
  // under the finger. Matches are the beasts the game itself lights up (.hovering-compatible).
  let nav = null;
  function navEl() {
    if (nav) return nav;
    nav = document.createElement('div');
    nav.id = 'merge-nav';
    nav.innerHTML = '<div class="mn-arrow"></div><div class="mn-text"></div>';
    document.body.appendChild(nav);
    return nav;
  }
  function placeHeld() {
    // dragMove's own sums, for when the map moves under a finger that is still.
    const b = draggedBeast, rect = playgroundRect, ws = worldSize();
    const pctX = ((mouseX - rect.left - dragStartX) / rect.width) * 100;
    const pctY = ((mouseY - rect.top - dragStartY) / rect.height) * 100;
    const s = b._size || parseFloat(dragElement.style.width) || 80;
    b.x = Math.max(0.5, Math.min(pctX, 99 - (s / ws.w) * 100));
    b.y = Math.max(5, Math.min(pctY, 98 - (s / ws.h) * 100));
    dragElement.style.transform = `translate3d(${(b.x / 100) * ws.w}px, ${(b.y / 100) * ws.h}px, 0) scaleX(${b.direction < 0 ? -1.15 : 1.15}) scaleY(1.15)`;
  }
  let lastT = 0;
  function assist(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0);
    lastT = now;
    let holding = false;
    try { holding = typeof draggedBeast !== 'undefined' && draggedBeast && dragStartedMoving && !pinch; } catch (e) { holding = false; }
    const el = navEl();
    if (!holding) { el.classList.remove('on'); requestAnimationFrame(assist); return; }
    // Nearest match.
    const b = draggedBeast, ws = worldSize();
    const bx = (b.x / 100) * ws.w, by = (b.y / 100) * ws.h;
    let best = null, bd = Infinity;
    for (const o of state.beastsOnField) {
      if (o === b || !o.dom.classList.contains('hovering-compatible')) continue;
      const d = Math.hypot((o.x / 100) * ws.w - bx, (o.y / 100) * ws.h - by);
      if (d < bd) { bd = d; best = o; }
    }
    el.classList.add('on');
    const arrow = el.firstChild, text = el.lastChild;
    if (best) {
      const sx = playgroundRect.left + ((best.x / 100) * ws.w + (best._size || 80) / 2) * z;
      const sy = playgroundRect.top + ((best.y / 100) * ws.h + (best._size || 80) / 2) * z;
      const ang = Math.atan2(sy - mouseY, sx - mouseX);
      arrow.style.transform = `rotate(${ang}rad)`;
      arrow.style.display = '';
      const onScreen = sx > 0 && sx < vw && sy > 0 && sy < vh;
      const name = (BEAST_TEMPLATES[best.type] || {}).name || 'Match';
      text.textContent = onScreen ? `${name} is here` : `${name}: ${Math.round(bd / 40)} steps`;
      el.classList.toggle('near', onScreen);
    } else {
      arrow.style.display = 'none';
      text.textContent = 'No match on the field';
      el.classList.remove('near');
    }
    // Near an edge: move the map that way.
    const E = 56;
    let px = 0, py = 0;
    if (mouseX < E) px = (E - mouseX) / E; else if (mouseX > vw - E) px = -(mouseX - (vw - E)) / E;
    if (mouseY < E + 40) py = (E + 40 - mouseY) / (E + 40); else if (mouseY > vh - E) py = -(mouseY - (vh - E)) / E;
    if (px || py) {
      const sp = 520 * dt;
      const ox = tx, oy = ty;
      tx += px * sp;
      ty += py * sp;
      apply();
      if (tx !== ox || ty !== oy) placeHeld();
    }
    requestAnimationFrame(assist);
  }
  requestAnimationFrame(assist);

  return { init, viewPct, worldSize, zoom, centre, zoomAt, SCALE, isPinching: () => !!pinch, underBar };
})();

// Loaded after the page's markup and before game.js, so the world is ready before any beast is placed.
if (document.getElementById('meadow-viewport')) WORLD.init();
else document.addEventListener('DOMContentLoaded', () => WORLD.init());
