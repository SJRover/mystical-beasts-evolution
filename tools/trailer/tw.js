// A clock the trailer recorder controls (loaded before the game, not shipped). Every timer, every
// animation frame and every CSS animation runs on it, so the game can be filmed one frame at a
// time and comes out perfectly smooth. Until __TW.manual() it follows real time; after that it
// only moves when __TW.step(ms) is called.
(() => {
  const real = {
    now: performance.now.bind(performance), dnow: Date.now,
    raf: window.requestAnimationFrame.bind(window), caf: window.cancelAnimationFrame.bind(window),
    st: window.setTimeout.bind(window), ct: window.clearTimeout.bind(window),
  };
  const T = (window.__TW = { t: real.now(), dbase: real.dnow() - real.now(), rafs: new Map(), timers: new Map(), id: 1, auto: true });
  performance.now = () => T.t;
  Date.now = () => Math.floor(T.dbase + T.t);
  window.requestAnimationFrame = (cb) => { const id = T.id++; T.rafs.set(id, cb); return id; };
  window.cancelAnimationFrame = (id) => { T.rafs.delete(id); };
  window.setTimeout = (cb, ms = 0, ...a) => { const id = T.id++; T.timers.set(id, { at: T.t + Math.max(0, +ms || 0), cb, a, every: 0 }); return id; };
  window.setInterval = (cb, ms = 0, ...a) => { const id = T.id++; const every = Math.max(4, +ms || 0); T.timers.set(id, { at: T.t + every, cb, a, every }); return id; };
  window.clearTimeout = window.clearInterval = (id) => { T.timers.delete(id); };
  const run = (cb, a) => { try { typeof cb === 'function' ? cb(...a) : (0, eval)(cb); } catch (e) { console.error(e); } };
  /** Move the clock on by `ms`: due timers in order, CSS animations, then one round of frames. */
  T.step = (ms) => {
    const end = T.t + ms;
    for (let guard = 0; guard < 5000; guard++) {
      let id = null, tm = null;
      for (const [k, v] of T.timers) if (v.at <= end && (!tm || v.at < tm.at)) { id = k; tm = v; }
      if (!tm) break;
      T.t = Math.max(T.t, tm.at);
      if (tm.every) tm.at += tm.every; else T.timers.delete(id);
      run(tm.cb, tm.a);
    }
    T.t = end;
    if (document.getAnimations) for (const an of document.getAnimations()) {
      if (!an.__tw) { an.__tw = true; an.pause(); }
      an.currentTime = (an.currentTime || 0) + ms;
    }
    const cbs = [...T.rafs.values()];
    T.rafs.clear();
    for (const cb of cbs) run(cb, [T.t]);
  };
  // Following real time until the recorder takes over.
  let last = real.now();
  const tick = () => {
    if (!T.auto) return;
    const n = real.now();
    T.step(Math.min(100, n - last));
    last = n;
    real.raf(tick);
  };
  real.raf(tick);
  T.manual = () => { T.auto = false; };
  T.autoRun = () => { if (T.auto) return; T.auto = true; last = real.now(); real.raf(tick); };
  /** Wait real time while the clock follows it (for setting up a shot). */
  T.wait = (ms) => new Promise((r) => real.st(r, ms));
})();
