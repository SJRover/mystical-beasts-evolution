// Playtest helpers, loaded into the running game from the console or a test driver (not shipped).
// Every action goes through the game's own input: touches on the field, clicks on its buttons.
window.PT = (() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.message)));
  window.addEventListener('unhandledrejection', (e) => errors.push('promise: ' + String(e.reason && e.reason.message || e.reason)));
  const centre = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const touch = (type, target, x, y) => {
    const t = new Touch({ identifier: 1, target, clientX: x, clientY: y });
    target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [t], targetTouches: type === 'touchend' ? [] : [t], changedTouches: [t] }));
  };
  /** Drag one beast onto a point on screen with a finger, in small steps, and let go. */
  async function dragTo(beast, x, y, steps = 14) {
    const a = centre(beast.dom);
    touch('touchstart', beast.dom, a.x, a.y);
    for (let i = 1; i <= steps; i++) { const px = a.x + ((x - a.x) * i) / steps, py = a.y + ((y - a.y) * i) / steps; mouseX = px; mouseY = py; touch('touchmove', document.body, px, py); window.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [new Touch({ identifier: 1, target: document.body, clientX: px, clientY: py })] })); await sleep(16); }
    await sleep(60);
    touch('touchend', document.body, x, y);
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
    await sleep(250);
  }
  /** Bring a beast into view and drag it onto another. */
  async function merge(a, b) {
    const p = centre(b.dom);
    await dragTo(a, p.x, p.y);
  }
  function dismiss() {
    for (const t of ['Skip', 'Collect Earnings', 'Awesome!', 'Continue', 'OK', 'Close', 'Got it!']) {
      const b = [...document.querySelectorAll('button')].find((b) => b.offsetParent && b.textContent.trim() === t);
      if (b) b.click();
    }
  }
  function clear() {
    state.beastsOnField.forEach((b) => b.dom.remove());
    state.beastsOnField.length = 0;
    document.querySelectorAll('.essence-crystal, .crate-container').forEach((e) => e.remove());
  }
  function spawnInView(id, ev = false, inf = false, sx = 50, sy = 45) {
    const p = WORLD.viewPct(sx, sy);
    return spawnBeastOnField(id, p.x, p.y, ev, inf);
  }
  async function fps(ms = 2500) {
    let n = 0; const t0 = performance.now();
    await new Promise((res) => { const f = (t) => { n++; if (t - t0 < ms) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    return +(n / (ms / 1000)).toFixed(1);
  }
  /** Hold a beast still (for a test that needs it to stay put). */
  const still = (...bs) => bs.forEach((b) => { b.spd = 0; b.spdT = 0; b.spdNext = 999; b.vx = b.vy = 0; b.tvx = b.tvy = 0; b.actNext = 999; });
  return { sleep, errors, dragTo, merge, dismiss, clear, spawnInView, fps, centre, still };
})();
'ok';
