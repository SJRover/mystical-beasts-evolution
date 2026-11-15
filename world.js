/**
 * Merge Beasts: the meadow as a world bigger than the screen (version 1.3).
 *
 * The background and the beasts' field sit inside one #world element, WORLD.SCALE times the
 * screen's width and height, which the camera moves and scales: two fingers pinch to zoom and
 * drag to look round (a mouse wheel and a right-button drag do the same on a computer). One
 * finger still drags beasts, collects crystals and opens crates, exactly as before.
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

  function clamp() {
    z = Math.max(minZoom(), Math.min(MAX_ZOOM, z));
    tx = Math.min(0, Math.max(vw - vw * SCALE * z, tx));
    ty = Math.min(0, Math.max(vh - vh * SCALE * z, ty));
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

  return { init, viewPct, worldSize, zoom, centre, zoomAt, SCALE, isPinching: () => !!pinch };
})();

// Loaded after the page's markup and before game.js, so the world is ready before any beast is placed.
if (document.getElementById('meadow-viewport')) WORLD.init();
else document.addEventListener('DOMContentLoaded', () => WORLD.init());
