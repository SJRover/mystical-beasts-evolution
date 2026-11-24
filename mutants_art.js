/**
 * Merge Beasts 1.5: World 7's giants and their goblins, drawn (mutants.js has their numbers and
 * moves).
 *
 * Each is drawn on the battle canvas from shapes, facing down the field towards your coin pile,
 * with its feet at (0, 0), in units where a giant's body is about 80 tall (ENEMY_ART scales it by
 * its size). Posed every frame: walking, its blow (pose.atk), and each of its moves as it winds up
 * and lands (pose.mut from MUTANTS.pose: the move, its stage and progress, its phase, raging, in
 * the air, Gorrak's riders, the serpent's heads and what each is striking at).
 *
 * Sam (23 Nov): more detail, legs above all (jointed, with knees, feet, toes and claws), and
 * Gorrak's riders drawn exactly as the goblins he throws, since those are peons you fight.
 *
 * MUTANT_ART.draw(ctx, P, look, pose): P is ENEMY_ART's palette for the enemy.
 */
const MUTANT_ART = (() => {
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = (k) => k * k * (3 - 2 * k);
  const lerp = (a, b, k) => a + (b - a) * k;
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const HI = 'rgba(255,255,255,0.22)', LO = 'rgba(0,0,0,0.22)';

  // ------------------------------------------------------------------ drawing helpers
  let LW = 0.6, LINE = '#1c1426';
  function shape(ctx, fill, draw, line = LINE, lw = LW) {
    ctx.beginPath(); draw(); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (line) { ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  function ell(ctx, x, y, rx, ry, fill, line = LINE, rot = 0, lw = LW) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (line) { ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function stroke(ctx, col, w, draw) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); draw(); ctx.stroke(); }
  function vgrad(ctx, y0, y1, top, bottom) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, top); g.addColorStop(1, bottom); return g; }
  function rgrad(ctx, x, y, r, inner, outer) { const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, inner); g.addColorStop(1, outer); return g; }
  /** A tapered limb from (x1, y1) to (x2, y2), w1 wide at the start and w2 at the end. */
  function limb(ctx, x1, y1, x2, y2, w1, w2, fill, line = LINE) {
    const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a), ny = Math.cos(a);
    ctx.beginPath();
    ctx.moveTo(x1 + nx * w1, y1 + ny * w1);
    ctx.lineTo(x2 + nx * w2, y2 + ny * w2);
    ctx.arc(x2, y2, w2, a + Math.PI / 2, a - Math.PI / 2, true);
    ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
    ctx.arc(x1, y1, w1, a - Math.PI / 2, a + Math.PI / 2, true);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (line) { ctx.strokeStyle = line; ctx.lineWidth = LW; ctx.lineJoin = 'round'; ctx.stroke(); }
    // A soft light down one side, so it reads as round.
    ctx.strokeStyle = HI; ctx.lineWidth = Math.min(w1, w2) * 0.45; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1 - nx * w1 * 0.45, y1 - ny * w1 * 0.45); ctx.lineTo(x2 - nx * w2 * 0.45, y2 - ny * w2 * 0.45); ctx.stroke();
  }
  /**
   * A limb, neck or tail of joined segments drawn as one smooth shape: the outline of every
   * segment first, then every fill over the top, so no joint shows (Sam, 23 Nov). pts: points;
   * r: the radius at each; fill: one colour. opts.line false: no outline; opts.light false: no sheen.
   */
  function chain(ctx, pts, r, fill, opts = {}) {
    const seg = (i, grow, col) => {
      const a = pts[i], b = pts[i + 1], r1 = Math.max(0.1, r[i] + grow), r2 = Math.max(0.1, r[i + 1] + grow);
      const ang = Math.atan2(b.y - a.y, b.x - a.x), nx = -Math.sin(ang), ny = Math.cos(ang);
      ctx.beginPath();
      ctx.moveTo(a.x + nx * r1, a.y + ny * r1); ctx.lineTo(b.x + nx * r2, b.y + ny * r2);
      ctx.arc(b.x, b.y, r2, ang + Math.PI / 2, ang - Math.PI / 2, true);
      ctx.lineTo(a.x - nx * r1, a.y - ny * r1);
      ctx.arc(a.x, a.y, r1, ang - Math.PI / 2, ang + Math.PI / 2, true);
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    };
    const n = pts.length - 1;
    if (n < 1) return;
    if (opts.line !== false) for (let i = 0; i < n; i++) seg(i, LW, opts.lineCol || LINE);
    for (let i = 0; i < n; i++) seg(i, 0, fill);
    if (opts.light !== false) {
      ctx.strokeStyle = HI; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(0.3, Math.min(...r) * 0.55);
      ctx.beginPath();
      pts.forEach((p, i) => { const q = pts[Math.min(n, i + 1)], o = pts[Math.max(0, i - 1)]; const ang = Math.atan2(q.y - o.y, q.x - o.x); const ox = Math.sin(ang) * r[i] * 0.42, oy = -Math.cos(ang) * r[i] * 0.42; if (i) ctx.lineTo(p.x + ox, p.y + oy); else ctx.moveTo(p.x + ox, p.y + oy); });
      ctx.stroke();
    }
  }
  /** A scaled tube (a serpent's body, a tail, a neck): one shape, a pale belly down it, scale marks. */
  function tube(ctx, pts, r, col, belly, scaleCol, opts = {}) {
    chain(ctx, pts, r, col, opts);
    if (belly) chain(ctx, pts.map((p, i) => ({ x: p.x, y: p.y + r[i] * 0.3 })), r.map((x) => x * 0.42), belly, { line: false, light: false });
    if (scaleCol) { ctx.strokeStyle = scaleCol; ctx.lineWidth = LW * 0.7; pts.forEach((p, i) => { if (i % 2) return; ctx.beginPath(); ctx.arc(p.x - r[i] * 0.4, p.y - r[i] * 0.3, r[i] * 0.3, 0.3, Math.PI - 0.3); ctx.moveTo(p.x + r[i] * 0.7, p.y - r[i] * 0.3); ctx.arc(p.x + r[i] * 0.4, p.y - r[i] * 0.3, r[i] * 0.3, 0.3, Math.PI - 0.3); ctx.stroke(); }); }
  }
  function glow(ctx, x, y, r, col, a = 0.8) {
    if (r <= 0) return;
    if (typeof ENEMY_ART !== 'undefined' && ENEMY_ART.glowSprite) { const was = ctx.globalAlpha; ctx.globalAlpha = was * a; ctx.drawImage(ENEMY_ART.glowSprite(col), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = was; return; }
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function eye(ctx, x, y, r, col, angry = 0, side = 1, slit = false) {
    glow(ctx, x, y, r * 3.2, col, 0.5);
    ell(ctx, x, y, r, r * 0.8, col, LINE);
    if (slit) ell(ctx, x, y, r * 0.18, r * 0.66, '#120a10', null); else ell(ctx, x + r * 0.15, y, r * 0.38, r * 0.62, '#120a10', null);
    ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.25, r * 0.22, '#ffffff', null);
    if (angry) stroke(ctx, LINE, LW * 1.6, () => { ctx.moveTo(x - side * r * 1.4, y - r * 1.5); ctx.lineTo(x + side * r * 1.2, y - r * 0.8); });
  }
  /** A bare foot from the front: the pad, toes with nails. */
  function foot(ctx, x, y, w, col, nail = '#efe2bc', toes = 3) {
    ell(ctx, x, y - w * 0.3, w, w * 0.45, col);
    for (let i = 0; i < toes; i++) {
      const tx = x + (i - (toes - 1) / 2) * ((w * 1.45) / toes);
      ell(ctx, tx, y - w * 0.06, w * 0.32, w * 0.26, col);
      ell(ctx, tx, y + w * 0.06, w * 0.18, w * 0.12, nail, LINE, 0, LW * 0.6);
    }
  }
  /** A paw from the front: toes over the pad and a hooked claw out of each. */
  function paw(ctx, x, y, w, col, claw = '#f4ead0', toes = 4) {
    ell(ctx, x, y - w * 0.32, w, w * 0.5, col);
    for (let i = 0; i < toes; i++) {
      const tx = x + (i - (toes - 1) / 2) * ((w * 1.6) / toes);
      ell(ctx, tx, y - w * 0.12, w * 0.3, w * 0.27, col);
      shape(ctx, claw, () => { ctx.moveTo(tx - w * 0.1, y - w * 0.02); ctx.quadraticCurveTo(tx + w * 0.02, y + w * 0.34, tx + w * 0.13, y + w * 0.14); ctx.lineTo(tx + w * 0.09, y - w * 0.04); }, LINE, LW * 0.6);
    }
  }
  /** A jointed leg: thigh, a knee cap, shin, ankle. */
  function leg(ctx, hip, knee, ankle, w, col, dark) {
    chain(ctx, [hip, knee, ankle], [w, w * 0.8, w * 0.56], col);
    const was = ctx.globalAlpha; ctx.globalAlpha = was * 0.3;
    chain(ctx, [{ x: lerp(hip.x, knee.x, 0.7), y: lerp(hip.y, knee.y, 0.7) }, knee, ankle], [w * 0.5, w * 0.62, w * 0.5], dark, { line: false, light: false });
    ctx.globalAlpha = was;
  }
  function gait(A, cad = 0.8) {
    const W = A.walk * cad;
    return { W, s: Math.sin(W * TAU), c: Math.cos(W * TAU), bob: Math.abs(Math.cos(W * TAU)) };
  }
  function blow(atk) {
    if (atk < 0) return { wind: 0, hit: 0, p: -1 };
    const wind = atk < 0.45 ? ease(atk / 0.45) : 0;
    const p = atk < 0.45 ? -1 : (atk - 0.45) / 0.55;
    const hitIn = p < 0 ? 0 : p < 0.3 ? ease(p / 0.3) : 1;
    const back = p < 0.3 ? 0 : ease((p - 0.3) / 0.7);
    return { wind, hit: p < 0 ? 0 : hitIn * (1 - back), p };
  }
  function move(A, kind) {
    const m = A.m;
    if (m.move !== kind) return { on: false, wind: 0, act: 0, k: 0 };
    return { on: true, wind: m.stage === 'wind' ? ease(m.k) : 1, act: m.stage === 'act' ? m.k : 0, k: m.k };
  }
  function fist(ctx, x, y, r, fill) {
    ell(ctx, x, y, r, r * 0.9, fill);
    for (let i = -1; i <= 1; i++) { ell(ctx, x + i * r * 0.5, y - r * 0.55, r * 0.28, r * 0.24, fill, LINE, 0, LW * 0.7); }
    stroke(ctx, LO, LW * 0.8, () => { ctx.moveTo(x - r * 0.75, y - r * 0.1); ctx.quadraticCurveTo(x, y + r * 0.2, x + r * 0.75, y - r * 0.1); });
  }
  function steam(ctx, x, y, t, col = '#ffffff', n = 3) {
    for (let i = 0; i < n; i++) { const k = (t * 0.9 + i / n) % 1; ctx.globalAlpha = 0.45 * (1 - k); ell(ctx, x + Math.sin(t * 3 + i) * 3, y - k * 16, 2.5 + k * 5, 2 + k * 4, col, null); }
    ctx.globalAlpha = 1;
  }
  /** Rows of little scale arcs over an area (x0..x1, y0..y1). */
  function scales(ctx, x0, y0, x1, y1, s, col) {
    ctx.strokeStyle = col; ctx.lineWidth = LW * 0.7;
    for (let y = y0, r = 0; y < y1; y += s * 0.7, r++) for (let x = x0 + (r % 2) * s * 0.5; x < x1; x += s) { ctx.beginPath(); ctx.arc(x, y, s * 0.45, 0.2, Math.PI - 0.2); ctx.stroke(); }
  }
  /** Stitches across a seam. */
  function stitches(ctx, pts, col = '#2a1a10') {
    stroke(ctx, col, LW * 0.9, () => { ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); });
    for (let i = 0; i < pts.length - 1; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]; const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2; stroke(ctx, col, LW * 0.8, () => { ctx.moveTo(mx + Math.cos(a) * 1.6, my + Math.sin(a) * 1.6); ctx.lineTo(mx - Math.cos(a) * 1.6, my - Math.sin(a) * 1.6); }); }
  }

  // ------------------------------------------------------------------ the goblins
  /**
   * A goblin: the runts Gorrak carries and throws, his war band's brutes and shamans. The same
   * drawing sits on his shoulders (opts.seat) and kicks in his fist (opts.held). About 40 tall.
   */
  function goblinBody(ctx, P, look, A, opts = {}) {
    const kind = look.kind || 'runt', t = A.t, seed = A.seed || 0;
    const g = gait(A, 1.35), b = blow(A.atk);
    const skin = P.skin, dk = shade(skin, -0.3), dk2 = shade(skin, -0.45), lt = shade(skin, 0.22);
    const brute = kind === 'brute', sham = kind === 'shaman';
    const seat = !!opts.seat, held = !!opts.held;
    const step = seat || held ? 0 : g.s;
    const bob = seat || held ? 0 : g.bob * 1.6;
    const wob = Math.sin(t * 5 + seed);
    const bw = brute ? 1.35 : 1;
    ctx.save(); ctx.translate(0, -bob);
    // Legs: bony and bowed, knobbly knees, big bare feet.
    for (const sd of [-1, 1]) {
      if (seat) { const kick = Math.sin(t * 4 + sd * 1.3) * 1.6; leg(ctx, { x: sd * 3.4, y: -14 }, { x: sd * 5, y: -8 }, { x: sd * 4.4, y: -2.4 + kick }, 2.3, dk, dk2, lt); foot(ctx, sd * 4.6, -0.8 + kick, 2.8, dk); continue; }
      if (held) { const kick = Math.sin(t * 14 + sd * 2) * 2.4; leg(ctx, { x: sd * 3.4, y: -14 }, { x: sd * 8, y: -11 + kick }, { x: sd * 10.5, y: -5 + kick }, 2.3, dk, dk2, lt); foot(ctx, sd * 10.8, -3.6 + kick, 2.6, dk); continue; }
      const lift = Math.max(0, sd * step) * 3.2, fx = sd * 5.6 * bw + sd * step * 1.6;
      leg(ctx, { x: sd * 3.4 * bw, y: -15 }, { x: sd * 6.4 * bw, y: -8.5 - lift * 0.5 }, { x: fx, y: -2.6 - lift }, 2.4 * bw, dk, dk2, lt);
      foot(ctx, fx + sd * 0.8, -0.6 - lift, 3.1 * bw, dk);
    }
    // Arms: skinny, the weapon hand (right) and the other, drawn behind the body so they grow out
    // of the shoulders (the hands and the weapon go over it, below).
    let R = { x: 8.6 * bw + step * -1.6, y: -15.6 }, L = { x: -8.6 * bw + step * 1.6, y: -15.6 };
    if (seat) { L = { x: -7.6, y: -27 }; R = { x: 7.6 + wob * 0.6, y: -31 - wob * 1.4 }; }
    if (held) { L = { x: -9.6, y: -27 + Math.sin(t * 12) * 2 }; R = { x: 9.6, y: -27 - Math.sin(t * 12) * 2 }; }
    if (b.wind || b.p >= 0) R = b.wind ? { x: lerp(R.x, 7.4, b.wind), y: lerp(R.y, -33, b.wind) } : { x: lerp(7.4, 11.6, b.hit), y: lerp(-33, -14, b.hit) };
    for (const [s, f, sd] of [[{ x: -4.6 * bw, y: -24.6 }, L, -1], [{ x: 4.6 * bw, y: -24.6 }, R, 1]]) {
      const ex = (s.x + f.x) / 2 + sd * 2.2, ey = (s.y + f.y) / 2 + 1.2;
      chain(ctx, [s, { x: ex, y: ey }, f], [1.75 * bw, 1.5 * bw, 1.3 * bw], skin);
    }
    // A ragged loincloth on a rope belt, a pouch and a tooth on a string.
    shape(ctx, P.cloth, () => { ctx.moveTo(-6 * bw, -17); ctx.lineTo(6 * bw, -17); ctx.lineTo(5.4 * bw, -10); ctx.lineTo(3, -12); ctx.lineTo(1.4, -9.4); ctx.lineTo(-0.6, -11.6); ctx.lineTo(-2.6, -9.6); ctx.lineTo(-4.2, -11.8); ctx.lineTo(-5.6 * bw, -10); });
    stroke(ctx, shade(P.cloth, -0.4), LW * 0.6, () => { ctx.moveTo(-3, -15); ctx.lineTo(-1, -14); ctx.moveTo(2, -15.4); ctx.lineTo(3.6, -13.6); });
    stroke(ctx, '#c8a060', 1.3, () => { ctx.moveTo(-6.4 * bw, -17); ctx.quadraticCurveTo(0, -15.8, 6.4 * bw, -17); });
    ell(ctx, -4.6 * bw, -14.6, 1.8, 2.2, '#8a5a2a');
    shape(ctx, '#f4ead0', () => { ctx.moveTo(3.6, -16.4); ctx.lineTo(4.6, -12.6); ctx.lineTo(5.2, -16.4); }, LINE, LW * 0.6);
    // A pot belly, ribs, a leather vest (brutes: an iron shoulder plate).
    ell(ctx, 0, -21, 6.6 * bw, 6.4, vgrad(ctx, -27, -15, lt, dk));
    ell(ctx, 0.4, -19.6, 3.6 * bw, 3.4, 'rgba(255,255,220,0.16)', null);
    stroke(ctx, LO, LW * 0.6, () => { for (const y of [-24.4, -22.6]) { ctx.moveTo(-5 * bw, y); ctx.quadraticCurveTo(-3, y + 1, -1.6, y); ctx.moveTo(5 * bw, y); ctx.quadraticCurveTo(3, y + 1, 1.6, y); } });
    for (const sd of [-1, 1]) shape(ctx, sham ? '#8a6a4a' : '#6a4426', () => { ctx.moveTo(sd * 1.6, -27); ctx.lineTo(sd * 6.4 * bw, -26); ctx.lineTo(sd * 6.8 * bw, -18.4); ctx.lineTo(sd * 3.2, -20); });
    stroke(ctx, '#e8d0a0', LW * 0.5, () => { for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { ctx.moveTo(sd * (2.4 + k * 0.3), -26 + k * 1.6); ctx.lineTo(sd * (3.2 + k * 0.3), -25.6 + k * 1.6); } });
    if (brute) { shape(ctx, '#7a7f8a', () => { ctx.ellipse(-6.2 * bw, -25.6, 4.2, 3, -0.3, Math.PI, TAU); }); for (let k = 0; k < 3; k++) shape(ctx, '#c8ccd6', () => { ctx.moveTo(-9 + k * 2.6, -27.4); ctx.lineTo(-8.2 + k * 2.6, -30.6); ctx.lineTo(-7.4 + k * 2.6, -27.4); }, LINE, LW * 0.5); }
    if (sham) for (let k = 0; k < 5; k++) ell(ctx, -3.2 + k * 1.6, -26.6 + Math.abs(k - 2) * 0.8, 0.8, 0.8, ['#ff5a5a', '#5ac8ff', '#ffe04a', '#c8a0ff', '#7aff8a'][k], LINE, 0, LW * 0.4);
    const hand = (f) => { ell(ctx, f.x, f.y, 1.9 * bw, 1.7 * bw, skin); for (let k = -1; k <= 1; k++) ell(ctx, f.x + k * 1.1 * bw, f.y + 1.3 * bw, 0.6 * bw, 0.7 * bw, skin, LINE, 0, LW * 0.5); };
    // The weapon: a notched dagger, a nail-studded club, a bone staff with a little skull.
    const wpn = () => {
      if (held) return;
      ctx.save(); ctx.translate(R.x, R.y);
      const ang = b.wind ? lerp(-0.4, -2.4, b.wind) : b.p >= 0 ? lerp(-2.4, 0.9, b.hit) : seat ? -1.2 + wob * 0.2 : -0.3 - step * 0.15;
      ctx.rotate(ang);
      if (brute) {
        shape(ctx, vgrad(ctx, -3, 3, '#a07040', '#5a3818'), () => { ctx.moveTo(-1.2, -1.6); ctx.lineTo(13, -3.4); ctx.quadraticCurveTo(16.6, 0, 13, 3.4); ctx.lineTo(-1.2, 1.6); });
        for (const [x, y] of [[9, -3], [12, 2.6], [14.6, -1], [11, 0]]) shape(ctx, '#c8ccd6', () => { ctx.moveTo(x - 0.6, y); ctx.lineTo(x, y + (y < 0 ? -2.2 : 2.2)); ctx.lineTo(x + 0.6, y); }, LINE, LW * 0.4);
      } else if (sham) {
        stroke(ctx, '#e8dcc0', 1.4, () => { ctx.moveTo(-3, 0); ctx.lineTo(16, 0); });
        ell(ctx, 17.4, 0, 2.6, 2.4, '#f4ead0'); ell(ctx, 16.8, -0.9, 0.7, 0.7, '#7aff8a', null); ell(ctx, 16.8, 0.9, 0.7, 0.7, '#7aff8a', null);
        glow(ctx, 17.4, 0, 6 + Math.sin(t * 6) * 1.5, '#9dff6a', 0.55);
        for (const sd of [-1, 1]) shape(ctx, sd < 0 ? '#ff6a4a' : '#4ac8ff', () => { ctx.moveTo(14.6, 0); ctx.quadraticCurveTo(13.4, sd * 4, 11, sd * 4.6); ctx.lineTo(13.6, sd * 1); }, LINE, LW * 0.4);
      } else {
        shape(ctx, '#5a3a1a', () => { ctx.rect(-1.6, -1.1, 4, 2.2); });
        stroke(ctx, '#c8a060', LW * 0.6, () => { ctx.moveTo(-0.6, -1.1); ctx.lineTo(0.2, 1.1); ctx.moveTo(1, -1.1); ctx.lineTo(1.8, 1.1); });
        shape(ctx, vgrad(ctx, -2, 2, '#f4f6ff', '#9aa0b4'), () => { ctx.moveTo(2.4, -1.4); ctx.lineTo(9, -1.8); ctx.quadraticCurveTo(11.6, -0.6, 12.4, 0.8); ctx.lineTo(8.4, 0.4); ctx.lineTo(7.6, 1.4); ctx.lineTo(6.6, 0.4); ctx.lineTo(2.4, 1.4); });
      }
      ctx.restore();
    };
    hand(L);
    wpn();
    hand(R);
    // The head: big, warty, long notched ears with rings, a hooked nose and a jagged grin.
    const hy = -32.4 + (seat ? 0 : bob * 0.1), tilt = seat ? Math.sin(t * 2 + seed) * 0.08 : step * 0.05;
    ctx.save(); ctx.translate(0, hy); ctx.rotate(tilt);
    for (const sd of [-1, 1]) {
      const flop = Math.sin(t * 3 + sd + seed) * 0.6;
      shape(ctx, dk, () => { ctx.moveTo(sd * 5.6, -1.6); ctx.quadraticCurveTo(sd * 11, -4.2 + flop, sd * 15.6, -2.4 + flop); ctx.lineTo(sd * 13.4, -1 + flop); ctx.lineTo(sd * 14.2, 0.4 + flop); ctx.quadraticCurveTo(sd * 9.6, 1.6, sd * 5.8, 2.2); });
      shape(ctx, shade(skin, -0.05), () => { ctx.moveTo(sd * 6.4, -0.6); ctx.quadraticCurveTo(sd * 10.4, -2.6 + flop, sd * 13.4, -1.6 + flop); ctx.quadraticCurveTo(sd * 9.6, 0.2, sd * 6.4, 1.2); }, null);
      stroke(ctx, '#ffd23a', LW * 0.8, () => { ctx.arc(sd * 11.4, 0.6 + flop * 0.7, 1, 0, TAU); });
    }
    ell(ctx, 0, 0, 7.2, 6.6, vgrad(ctx, -6.6, 6.6, lt, dk));
    for (const [x, y, r] of [[-4.4, -3.6, 0.7], [3.8, -4.4, 0.5], [5, 2.2, 0.6], [-5.2, 1.6, 0.45]]) ell(ctx, x, y, r, r, dk2, null);
    // Headgear: a dented pot helm (runts), horned iron (brutes), feathers and paint (shamans).
    if (brute) { shape(ctx, vgrad(ctx, -8, -2, '#a0a6b4', '#5a606c'), () => { ctx.ellipse(0, -2.6, 7.4, 5.2, 0, Math.PI, TAU); }); for (const sd of [-1, 1]) shape(ctx, '#f4ead0', () => { ctx.moveTo(sd * 4.6, -6.4); ctx.quadraticCurveTo(sd * 8.8, -10, sd * 8.2, -13.4); ctx.quadraticCurveTo(sd * 6.8, -9.4, sd * 3, -7.4); }); }
    else if (sham) { for (let k = -3; k <= 3; k++) shape(ctx, ['#ff6a4a', '#ffe04a', '#4ac8ff', '#7aff8a'][(k + 3) % 4], () => { ctx.moveTo(k * 1.6 - 0.8, -5); ctx.quadraticCurveTo(k * 2.6, -11 - Math.abs(k) * -0.6, k * 2.2 + 0.6, -12.6 + Math.abs(k) * 1.2); ctx.lineTo(k * 1.6 + 0.8, -5); }, LINE, LW * 0.5); stroke(ctx, '#ffffff', LW, () => { for (const sd of [-1, 1]) { ctx.moveTo(sd * 2, 2.4); ctx.lineTo(sd * 5, 1.4); ctx.moveTo(sd * 2.2, 3.4); ctx.lineTo(sd * 4.8, 2.8); } }); }
    else if (seed % 3 !== 2) { shape(ctx, vgrad(ctx, -9, -3, '#8a8f9a', '#4a4f5a'), () => { ctx.moveTo(-6.8, -3); ctx.quadraticCurveTo(-6.4, -9.6, 0, -9.8); ctx.quadraticCurveTo(6.4, -9.6, 6.8, -3); }); ell(ctx, 2.6, -7.6, 1, 0.6, '#5a5f6a', null); }
    else stroke(ctx, '#2a1a10', LW * 1.2, () => { ctx.moveTo(0, -6.4); ctx.quadraticCurveTo(1.6, -10, 0.4, -11.6); ctx.moveTo(-1, -6.4); ctx.quadraticCurveTo(-2.4, -9.4, -1.6, -11); });
    // Brows, slit-pupil eyes, the hooked nose, a jagged grin.
    stroke(ctx, dk2, LW * 1.4, () => { ctx.moveTo(-5, -2.6); ctx.lineTo(-1.2, -1.6); ctx.moveTo(5, -2.6); ctx.lineTo(1.2, -1.6); });
    eye(ctx, -2.8, -0.6, 1.5, P.eye, 0, 1, true); eye(ctx, 2.8, -0.6, 1.5, P.eye, 0, -1, true);
    shape(ctx, shade(skin, 0.05), () => { ctx.moveTo(-0.8, -0.4); ctx.quadraticCurveTo(1.8, 1.4, 1.2, 4.6); ctx.quadraticCurveTo(0, 4.4, -1.4, 3.4); });
    const open = held ? 1 : Math.max(b.hit, b.wind * 0.6, seat ? 0.3 + wob * 0.2 : 0.15);
    shape(ctx, '#3a0a10', () => { ctx.moveTo(-4.4, 4.2); ctx.quadraticCurveTo(0, 5 + open * 2.6, 4.4, 4.2); ctx.quadraticCurveTo(0, 6.4 + open * 2.6, -4.4, 4.2); });
    shape(ctx, '#f4ead0', () => { ctx.moveTo(-3.8, 4.3); for (let k = 0; k < 6; k++) { ctx.lineTo(-3.8 + k * 1.52 + 0.76, 5.6 + (k % 2) * 0.5); ctx.lineTo(-3.8 + (k + 1) * 1.52, 4.4 + (k === 2 ? 0 : 0.2)); } ctx.lineTo(-3.8, 4.3); }, LINE, LW * 0.4);
    ctx.restore();
    ctx.restore();
  }
  function goblin(ctx, P, look, A) { goblinBody(ctx, P, look, A); }
  /** A runt goblin, for Gorrak's shoulders and fist: exactly the goblin he throws. */
  let runtPal = null;
  function runtPalette() {
    if (runtPal) return runtPal;
    const e = typeof BATTLE_DATA !== 'undefined' && BATTLE_DATA.ENEMIES.goblin_runt;
    runtPal = e && typeof ENEMY_ART !== 'undefined' ? { P: ENEMY_ART.palette(e.look), look: e.look } : { P: { skin: '#7ab84a', cloth: '#5a3a22', eye: '#ffe04a', line: '#1c1426' }, look: { kind: 'runt' } };
    return runtPal;
  }
  function rider(ctx, x, y, s, A, i, held = false) {
    const R = runtPalette();
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const lw = LW; LW = lw / s * 0.9;
    goblinBody(ctx, R.P, R.look, { t: A.t + i * 1.7, walk: 0, atk: -1, seed: i }, held ? { held: true } : { seat: true });
    LW = lw;
    ctx.restore();
  }

  /** Little bands across a limb from a to b (wraps, straps). */
  function bands(ctx, a, b, w, col, at = [0.35, 0.6]) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
    for (const k of at) { const x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k); stroke(ctx, col, w * 0.5, () => { ctx.moveTo(x + Math.cos(ang) * w, y + Math.sin(ang) * w); ctx.lineTo(x - Math.cos(ang) * w, y - Math.sin(ang) * w); }); }
  }

  // ------------------------------------------------------------------ 1. Gorrak the Hulk Goblin
  function hulk(ctx, P, look, A) {
    const g = gait(A, 0.7), b = blow(A.atk), m = A.m, t = A.t;
    const thr = move(A, 'throw'), leap = move(A, 'leap'), slam = move(A, 'slam');
    const crouch = leap.on ? (m.stage === 'wind' ? Math.max(0, 1 - m.k * 6) * 5 : 6 * (1 - m.k)) : slam.act ? 4 * (1 - slam.act) : 0;
    const bob = g.bob * 2.2 + crouch;
    const skin = P.skin, dk = shade(skin, -0.28), dk2 = shade(skin, -0.42), lt = shade(skin, 0.18);
    const rage = m.enraged || m.phase >= 2;
    const tuck = m.air > 0.2 ? 1 : 0;
    ctx.save(); ctx.translate(0, bob);
    // Legs: thick bowed thighs, knees, calves wrapped in leather, big three-toed feet.
    for (const sd of [-1, 1]) {
      const lift = tuck ? 6 : Math.max(0, sd * g.s) * 4;
      const fx = sd * (15 - tuck * 4) + (tuck ? 0 : sd * g.s * 2);
      const hip = { x: sd * 9, y: -26 - bob }, knee = { x: sd * 16, y: -14 - lift * 0.6 - bob * 0.5 }, ank = { x: fx, y: -4.5 - lift - bob };
      leg(ctx, hip, knee, ank, 7.2, dk, dk2, lt);
      bands(ctx, knee, ank, 5, '#6a4426', [0.45, 0.7]);
      foot(ctx, fx + sd * 1.4, -1 - lift - bob, 7.4, dk, '#e8dcb0');
    }
    // The loincloth, stitched and patched, on a wide belt: a skull buckle, pouches, a hanging bone.
    shape(ctx, vgrad(ctx, -30, -12, shade(P.cloth, 0.15), shade(P.cloth, -0.2)), () => { ctx.moveTo(-15, -29); ctx.lineTo(15, -29); ctx.lineTo(13, -14); ctx.lineTo(8, -17); ctx.lineTo(4, -11.5); ctx.lineTo(0, -16); ctx.lineTo(-4, -11.5); ctx.lineTo(-8, -17); ctx.lineTo(-13, -14); });
    shape(ctx, shade(P.cloth, 0.3), () => { ctx.rect(-10, -24, 6, 5); }, LINE, LW * 0.7);
    stitches(ctx, [[-10, -24], [-4, -24], [-4, -19]], '#2a1a10');
    shape(ctx, vgrad(ctx, -32, -26, '#7a5030', '#4a2a14'), () => { ctx.rect(-16.5, -32, 33, 5.4); });
    for (const x of [-13, -8, 8, 13]) ell(ctx, x, -29.3, 0.8, 0.8, '#c8a060', null);
    ell(ctx, -12.5, -25, 2.8, 3.4, '#8a5a2a'); stroke(ctx, '#4a2a14', LW, () => { ctx.moveTo(-15, -26.6); ctx.lineTo(-10, -26.6); });
    shape(ctx, '#efe6d2', () => { ctx.moveTo(11, -26); ctx.lineTo(12.4, -18); ctx.lineTo(13.6, -26); }, LINE, LW * 0.6);
    ell(ctx, 0, -29.3, 3.8, 3.6, '#efe6d2'); ell(ctx, -1.3, -29.8, 1, 1, '#2a1a10', null); ell(ctx, 1.3, -29.8, 1, 1, '#2a1a10', null); stroke(ctx, '#2a1a10', LW * 0.6, () => { ctx.moveTo(-1.4, -27.4); ctx.lineTo(1.4, -27.4); });
    // Where the fists are, for each pose.
    const sh = { l: { x: -23, y: -55 }, r: { x: 23, y: -55 } };
    let L = { x: -31 + g.s * 3, y: -16 }, R = { x: 31 - g.s * 3, y: -16 };
    if (b.p >= 0 || b.wind) {
      const up = { x: 22, y: -84 }, down = { x: 22, y: -4 };
      R = b.wind ? { x: lerp(R.x, up.x, b.wind), y: lerp(R.y, up.y, b.wind) } : { x: lerp(up.x, down.x, b.hit), y: lerp(up.y, down.y, b.hit) };
      if (A.heavy) L = { x: -R.x, y: R.y };
    }
    if (thr.on) {
      if (m.stage === 'wind') { const k = thr.wind; R = k < 0.4 ? { x: lerp(31, 24, k / 0.4), y: lerp(-16, -66, k / 0.4) } : { x: lerp(24, 12, (k - 0.4) / 0.6), y: lerp(-66, -86, (k - 0.4) / 0.6) }; }
      else { const k = ease(Math.min(1, thr.act * 2.5)); R = { x: lerp(12, 34, k), y: lerp(-86, -62, k) }; }
    }
    if (leap.on && m.air > 0.05) { L = { x: -20, y: -88 }; R = { x: 20, y: -88 }; }
    if (slam.on) {
      if (m.stage === 'wind') { const k = slam.wind; L = { x: lerp(-31, -7, k), y: lerp(-16, -94, k) }; R = { x: lerp(31, 7, k), y: lerp(-16, -94, k) }; }
      else { const k = ease(Math.min(1, slam.act * 3)); L = { x: lerp(-7, -16, k), y: lerp(-94, -3, k) }; R = { x: lerp(7, 16, k), y: lerp(-94, -3, k) }; }
    }
    const arm = (s, f, sd) => {
      const ex = lerp(s.x, f.x, 0.5) + sd * 6, ey = lerp(s.y, f.y, 0.5) + 2;
      chain(ctx, [s, { x: ex, y: ey }, f], [7.8, 6.4, 5.4], skin);
      ell(ctx, lerp(s.x, ex, 0.45), lerp(s.y, ey, 0.45), 4.6, 3.6, 'rgba(255,255,220,0.16)', null);
      bands(ctx, { x: ex, y: ey }, f, 6, '#6a4426', [0.45, 0.62, 0.79]);
      if (m.phase >= 1) for (let k = 0; k < 3; k++) { const q = 0.82, cx = lerp(ex, f.x, q), cy = lerp(ey, f.y, q); shape(ctx, '#c8ccd6', () => { ctx.moveTo(cx - 1.4 + (k - 1) * 3, cy); ctx.lineTo(cx + (k - 1) * 3 + sd * 2.6, cy - 4.4); ctx.lineTo(cx + 1.4 + (k - 1) * 3, cy); }, LINE, LW * 0.6); }
      if (rage) stroke(ctx, rgba(look.trim, 0.8), LW * 1.1, () => { ctx.moveTo(s.x, s.y + 3); ctx.quadraticCurveTo(ex + sd * 2, ey, f.x, f.y - 3); });
      fist(ctx, f.x, f.y, 7.2, skin);
    };
    // The torso: a huge hunched barrel; pecs, a belly, scars, a strap with studs.
    shape(ctx, vgrad(ctx, -76, -26, lt, dk), () => { ctx.moveTo(-17, -28); ctx.bezierCurveTo(-30, -36, -34, -62, -20, -72); ctx.bezierCurveTo(-8, -78, 8, -78, 20, -72); ctx.bezierCurveTo(34, -62, 30, -36, 17, -28); ctx.quadraticCurveTo(0, -24, -17, -28); });
    ell(ctx, 0, -41, 12.5, 11, 'rgba(255,255,220,0.12)', null);
    stroke(ctx, dk2, LW * 1.1, () => { ctx.moveTo(-15, -58); ctx.quadraticCurveTo(-7, -51, 0, -55); ctx.quadraticCurveTo(7, -51, 15, -58); });
    stroke(ctx, LO, LW, () => { for (const y of [-47, -41, -35]) { ctx.moveTo(-6, y); ctx.quadraticCurveTo(-3, y + 1.6, -0.6, y); ctx.moveTo(6, y); ctx.quadraticCurveTo(3, y + 1.6, 0.6, y); } ctx.moveTo(0, -53); ctx.lineTo(0, -33); });
    ell(ctx, 0, -32, 1.2, 0.9, dk2, null);
    stroke(ctx, '#e8a0a0', LW * 1.2, () => { ctx.moveTo(8, -50); ctx.lineTo(13, -44); ctx.moveTo(13, -50); ctx.lineTo(8, -44); ctx.moveTo(-14, -40); ctx.lineTo(-8, -36); });
    shape(ctx, '#6a4426', () => { ctx.moveTo(-20, -70); ctx.lineTo(-15, -72); ctx.lineTo(19, -32); ctx.lineTo(14, -30); });
    for (let k = 0; k < 6; k++) ell(ctx, lerp(-16.5, 16.5, k / 5), lerp(-69, -33, k / 5), 0.9, 0.9, '#c8ccd6', LINE, 0, LW * 0.4);
    // A necklace of teeth.
    stroke(ctx, '#4a2a14', LW * 1.2, () => { ctx.moveTo(-14, -66); ctx.quadraticCurveTo(0, -56, 14, -66); });
    for (let k = 0; k < 7; k++) { const x = lerp(-11, 11, k / 6), y = -64 + 7.4 * Math.sin((k / 6) * Math.PI) * 0.9; shape(ctx, '#f4ead0', () => { ctx.moveTo(x - 1, y); ctx.lineTo(x, y + 3.4 + (k % 2)); ctx.lineTo(x + 1, y); }, LINE, LW * 0.5); }
    // Riders on the shoulders and the back of the neck (fewer after a throw): the same goblins he throws.
    const n = m.riders != null ? m.riders : 3;
    const RS = 0.42;
    arm(sh.l, L, -1);
    arm(sh.r, R, 1);
    // Shoulders, then the head, low between them.
    for (const sd of [-1, 1]) { ell(ctx, sd * 22, -62, 10.5, 9.2, vgrad(ctx, -71, -53, shade(skin, 0.3), skin)); stroke(ctx, HI, LW * 2, () => { ctx.arc(sd * 22, -62, 7, -2.4, -1.2); }); }
    if (n > 2) rider(ctx, 0, -76 + 15 * RS, RS, A, 2);
    const hy = -62 + (b.wind ? -2 : 0);
    for (const sd of [-1, 1]) {
      shape(ctx, dk, () => { ctx.moveTo(sd * 6, hy - 3); ctx.lineTo(sd * 21, hy - 9 + Math.sin(t * 2 + sd)); ctx.lineTo(sd * 18, hy - 5); ctx.lineTo(sd * 19, hy - 3); ctx.lineTo(sd * 7, hy + 2); });
      stroke(ctx, '#ffd23a', LW * 1.2, () => { ctx.arc(sd * 15, hy - 3, 1.6, 0, TAU); ctx.moveTo(sd * 18.6, hy - 4); ctx.arc(sd * 17.2, hy - 4, 1.4, 0, TAU); });
    }
    ell(ctx, 0, hy, 9.2, 8.6, vgrad(ctx, hy - 9, hy + 9, lt, dk));
    for (const [x, y, r] of [[-6, hy + 3, 0.8], [6.4, hy - 4, 0.6], [4.6, hy + 4.4, 0.7]]) ell(ctx, x, y, r, r, dk2, null);
    stroke(ctx, '#1a1008', LW * 1.6, () => { ctx.moveTo(-1.6, hy - 8.4); ctx.quadraticCurveTo(-2.4, hy - 13, 0, hy - 14.6); ctx.moveTo(1.2, hy - 8.4); ctx.quadraticCurveTo(2.8, hy - 12, 1.4, hy - 14); });
    ell(ctx, 0, hy - 8.8, 1.6, 0.9, '#6a4426', null);
    shape(ctx, dk, () => { ctx.moveTo(-8, hy - 3); ctx.quadraticCurveTo(0, hy - 8, 8, hy - 3); ctx.quadraticCurveTo(0, hy - 4.5, -8, hy - 3); });
    eye(ctx, -3.4, hy - 1.2, 1.5, rage ? '#ff3a2a' : P.eye, 1, 1); eye(ctx, 3.4, hy - 1.2, 1.5, rage ? '#ff3a2a' : P.eye, 1, -1);
    stroke(ctx, '#e8a0a0', LW, () => { ctx.moveTo(-5.6, hy - 5); ctx.lineTo(-2, hy + 1.6); });
    shape(ctx, shade(skin, 0.06), () => { ctx.moveTo(-2, hy - 0.4); ctx.quadraticCurveTo(0, hy - 1.4, 2, hy - 0.4); ctx.quadraticCurveTo(3, hy + 2.4, 0, hy + 2.6); ctx.quadraticCurveTo(-3, hy + 2.4, -2, hy - 0.4); });
    ell(ctx, -1, hy + 1.8, 0.5, 0.35, dk2, null); ell(ctx, 1, hy + 1.8, 0.5, 0.35, dk2, null);
    const roar = slam.on || thr.on || b.p >= 0 ? 1 : 0;
    shape(ctx, '#3a0a0a', () => { ctx.ellipse(0, hy + 4.6, 5, 1.8 + roar * 2, 0, 0, TAU); });
    shape(ctx, '#f4ead0', () => { ctx.moveTo(-3, hy + 3.4); for (let k = 0; k < 4; k++) { ctx.lineTo(-3 + k * 1.5 + 0.75, hy + 4.4); ctx.lineTo(-3 + (k + 1) * 1.5, hy + 3.4); } }, LINE, LW * 0.4);
    for (const sd of [-1, 1]) shape(ctx, '#f4ead0', () => { ctx.moveTo(sd * 4.4, hy + 5.6 + roar); ctx.lineTo(sd * 3.4, hy + 0.6); ctx.lineTo(sd * 2.4, hy + 5.6 + roar); });
    if (rage) { steam(ctx, -17, hy - 10, t); steam(ctx, 17, hy - 10, t + 0.5); }
    if (n > 0) rider(ctx, -23, -71 + 15 * RS, RS, A, 0);
    if (n > 1 && !(thr.on && m.stage === 'wind' && thr.wind > 0.35)) rider(ctx, 23, -71 + 15 * RS, RS, A, 1);
    // A raised fist (throwing, slamming) goes in front of the head.
    if ((thr.on || slam.on) && R.y < -70) fist(ctx, R.x, R.y, 7.2, skin);
    if (slam.on && L.y < -70) fist(ctx, L.x, L.y, 7.2, skin);
    if (thr.on && m.stage === 'wind' && thr.wind > 0.35) rider(ctx, R.x, R.y - 2 + 14 * RS, RS, A, 5, true);
    ctx.restore();
  }

  // ------------------------------------------------------------------ 2. The Walking Hive
  /** An insect leg: hip, femur, tibia, a hooked foot; hairs on the joints. */
  function insectLeg(ctx, hip, knee, ank, foot2, col, hair) {
    chain(ctx, [hip, knee, ank, foot2], [2.2, 1.7, 1.1, 0.6], col);
    stroke(ctx, hair, LW * 0.6, () => { for (let k = 1; k < 4; k++) { const x = lerp(knee.x, ank.x, k / 4), y = lerp(knee.y, ank.y, k / 4); ctx.moveTo(x, y); ctx.lineTo(x + 1.8, y - 1.4); } });
  }
  function hive(ctx, P, look, A) {
    const g = gait(A, 1.3), b = blow(A.atk), t = A.t, m = A.m;
    const sw = move(A, 'swarm'), st = move(A, 'sting');
    const open = sw.on ? (m.stage === 'wind' ? sw.wind : 1 - Math.min(1, sw.act * 2)) : 0;
    const lunge = b.hit * 5;
    const body = P.skin, dk = shade(body, -0.35), lt = shade(body, 0.2);
    const off = -g.bob * 1.5 + lunge * 0.4;
    for (let i = 0; i < 6; i++) {
      const sd = i < 3 ? -1 : 1, k = i % 3;
      const ph = g.W * TAU + k * 2.1 + (sd > 0 ? Math.PI : 0), up = Math.max(0, Math.sin(ph));
      const hip = { x: sd * (9 + k * 3), y: -26 + k * 2 + off }, knee = { x: sd * (25 + k * 3), y: -33 + k * 3 - up * 4 + off * 0.6 };
      const ank = { x: sd * (24 + k * 6) + Math.cos(ph) * 2, y: -9 - up * 3 }, ft = { x: sd * (22 + k * 6.6) + Math.cos(ph) * 3, y: -up * 3 };
      insectLeg(ctx, hip, knee, ank, ft, '#2a2010', '#6a5a3a');
    }
    ctx.save();
    ctx.translate(0, -g.bob * 1.5 + lunge * 0.4);
    ctx.rotate(Math.sin(g.W * TAU) * 0.03);
    const pump = st.on ? (m.stage === 'wind' ? st.wind : 1 - st.act) : 0;
    // The stinger: a banded tail growing out from under the nest, the barb out as it fires.
    shape(ctx, vgrad(ctx, -26, -6, '#ffcf3a', '#c88a1a'), () => { ctx.moveTo(-8, -27); ctx.quadraticCurveTo(-7, -14, 0, -6 + pump * 5); ctx.quadraticCurveTo(7, -14, 8, -27); });
    stroke(ctx, '#1a1408', 1.8, () => { ctx.moveTo(-6, -17); ctx.quadraticCurveTo(0, -15.4, 6, -17); ctx.moveTo(-4, -11.6); ctx.quadraticCurveTo(0, -10.4, 4, -11.6); });
    shape(ctx, '#1a1408', () => { ctx.moveTo(-1.3, -7.6 + pump * 5); ctx.lineTo(0, -2 + pump * 8); ctx.lineTo(1.3, -7.6 + pump * 5); });
    const top = -82, bot = -18;
    shape(ctx, vgrad(ctx, top, bot, lt, dk), () => { ctx.moveTo(-26, -30); ctx.bezierCurveTo(-34, -58, -20, top - 2, 0, top); ctx.bezierCurveTo(20, top - 2, 34, -58, 26, -30); ctx.quadraticCurveTo(0, bot + 2, -26, -30); });
    // Paper bands and swirls.
    ctx.strokeStyle = 'rgba(58,38,8,0.55)'; ctx.lineWidth = LW * 1.2;
    for (let k = 1; k < 7; k++) { const y = top + k * 9; const w = 28 * Math.sin(Math.min(Math.PI - 0.2, (k / 7) * Math.PI + 0.25)); ctx.beginPath(); ctx.moveTo(-w, y); ctx.quadraticCurveTo(0, y + 3.5, w, y); ctx.stroke(); }
    stroke(ctx, 'rgba(255,240,200,0.3)', LW, () => { for (const [x, y] of [[-18, -62], [16, -70], [20, -40], [-22, -38]]) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 3, y - 3, x + 6, y); ctx.quadraticCurveTo(x + 3, y + 2, x + 1, y); } });
    const hot = 0.5 + 0.2 * Math.sin(t * 4) + m.phase * 0.15 + open * 0.4;
    const cells = [[-12, -60], [-4, -66], [6, -63], [14, -55], [-17, -46], [-7, -50], [4, -48], [13, -41], [-10, -36], [0, -38], [9, -32]];
    cells.forEach(([x, y], i) => {
      const lit = (i + Math.floor(t * 1.5)) % 4 !== 0;
      ctx.beginPath(); for (let a = 0; a < 6; a++) ctx.lineTo(x + Math.cos(a * Math.PI / 3) * 3.4, y + Math.sin(a * Math.PI / 3) * 3.4); ctx.closePath();
      ctx.fillStyle = lit ? rgba(look.trim, Math.min(1, hot)) : '#2a1a06'; ctx.fill(); ctx.strokeStyle = '#3a2608'; ctx.lineWidth = LW * 0.9; ctx.stroke();
      if (!lit) ell(ctx, x, y + 0.6, 1.4, 1.2, '#ffcf3a', null);
      if (lit && i % 3 === 0) { const d = ((t * 0.6 + i * 0.3) % 1); ell(ctx, x, y + 3.6 + d * 5, 0.8, 1.2 + d * 0.6, '#ffb43a', null); }
      if (lit && m.phase >= 2) glow(ctx, x, y, 6, '#ff4a2a', 0.35);
    });
    if (m.phase >= 1) { stroke(ctx, '#ffb43a', LW * 1.1, () => { ctx.moveTo(-6, top + 6); ctx.lineTo(-2, -64); ctx.lineTo(-8, -54); ctx.lineTo(-3, -44); }); }
    if (open > 0.02) {
      glow(ctx, 0, top + 6, 24 * open, look.trim, 0.8);
      for (const sd of [-1, 1]) shape(ctx, lt, () => { ctx.moveTo(0, top + 2); ctx.quadraticCurveTo(sd * 10, top - 4 - open * 10, sd * (14 + open * 10), top + 10 - open * 6); ctx.lineTo(sd * 4, top + 14); });
      for (let i = 0; i < 6; i++) { const a = t * 8 + i; ell(ctx, Math.sin(a) * 10 * open, top - ((t * 40 + i * 9) % 26) * open, 1.6, 1.2, '#1a1408', null); }
    }
    // The face: antennae, two great compound eyes, mandibles that snap.
    for (const sd of [-1, 1]) { stroke(ctx, '#1a1408', 1.1, () => { ctx.moveTo(sd * 4, -36); ctx.quadraticCurveTo(sd * 10, -46 + Math.sin(t * 3 + sd) * 2, sd * 15, -44 + Math.sin(t * 3 + sd) * 3); }); ell(ctx, sd * 15, -44 + Math.sin(t * 3 + sd) * 3, 1.3, 1.3, '#1a1408', null); }
    for (const sd of [-1, 1]) {
      const ex = sd * 7.6, ey = -30;
      glow(ctx, ex, ey, 9, P.eye, 0.4);
      ell(ctx, ex, ey, 3.6, 3, rgrad(ctx, ex, ey, 3.6, shade(P.eye, 0.3), shade(P.eye, -0.4)));
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++) { ctx.beginPath(); ctx.arc(ex + c * 1.5 + (r % 2) * 0.7, ey + r * 1.2, 0.32, 0, TAU); ctx.fill(); }
      ell(ctx, ex - 1.2, ey - 1, 0.8, 0.6, '#ffffff', null);
    }
    const snap = b.hit * 0.6 + (b.wind ? 0.3 : 0) + Math.sin(t * 9) * 0.05;
    for (const sd of [-1, 1]) shape(ctx, '#2a1a06', () => { ctx.moveTo(sd * 3, -24); ctx.quadraticCurveTo(sd * (9 + snap * 6), -20, sd * (4 - snap * 3), -15); ctx.lineTo(sd * (4.6 - snap * 2), -17); ctx.lineTo(sd * (5.4 - snap * 2), -18.6); ctx.lineTo(sd * 2, -20); });
    if (m.burning) for (let i = 0; i < 5; i++) { const x = -18 + i * 9, h = 8 + 4 * Math.sin(t * 12 + i * 2); glow(ctx, x, -60 + (i % 2) * 14, 10, '#ff7a1a', 0.6); shape(ctx, '#ffb43a', () => { ctx.moveTo(x - 3, -55 + (i % 2) * 14); ctx.quadraticCurveTo(x, -55 - h + (i % 2) * 14, x + 3, -55 + (i % 2) * 14); }, null); }
    ctx.restore();
    for (let i = 0; i < 4; i++) { const a = t * (2 + i * 0.3) + i * 1.6, x = Math.cos(a) * 34, y = -50 + Math.sin(a * 1.3) * 22; ell(ctx, x, y, 1.6, 1.1, '#ffcf3a', '#1a1408'); ell(ctx, x - 0.4, y - 1.2, 1, 0.6, 'rgba(255,255,255,0.6)', null); }
  }

  // ------------------------------------------------------------------ 3. Rime the Frost Giant
  function frost(ctx, P, look, A) {
    const g = gait(A, 0.65), b = blow(A.atk), t = A.t, m = A.m;
    const lane = move(A, 'lane'), bould = move(A, 'boulder'), slam = move(A, 'slam');
    const skin = P.skin, dk = shade(skin, -0.3), dk2 = shade(skin, -0.42), lt = shade(skin, 0.3);
    const ice = '#e8fbff', fur = '#e8e0d0';
    ctx.save(); ctx.translate(0, g.bob * 2);
    // Legs: thighs, ice-plated knees, fur boots with straps and toggles.
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, sd * g.s) * 4, fx = sd * 12 + sd * g.s * 2;
      const hip = { x: sd * 8, y: -31 }, knee = { x: sd * 12.6, y: -19 - lift * 0.5 }, ank = { x: fx, y: -9 - lift };
      leg(ctx, hip, knee, ank, 7.2, dk, dk2, lt);
      shape(ctx, vgrad(ctx, knee.y - 5, knee.y + 4, '#ffffff', '#9adcf8'), () => { ctx.moveTo(knee.x - 5, knee.y + 1); ctx.lineTo(knee.x - 2, knee.y - 5); ctx.lineTo(knee.x + 3, knee.y - 4); ctx.lineTo(knee.x + 5, knee.y + 2); ctx.lineTo(knee.x, knee.y + 4); });
      shape(ctx, vgrad(ctx, -12 - lift, -lift, '#5a4a3a', '#3a2a1e'), () => { ctx.moveTo(fx - 7, -11 - lift); ctx.lineTo(fx + 7, -11 - lift); ctx.lineTo(fx + 8.6, -1 - lift); ctx.quadraticCurveTo(fx, 1.4 - lift, fx - 8.6, -1 - lift); });
      for (let k = -3; k <= 3; k++) ell(ctx, fx + k * 2.2, -11.6 - lift, 1.6, 1.8, fur, null);
      stroke(ctx, '#2a1a10', LW * 1.2, () => { ctx.moveTo(fx - 7.4, -6 - lift); ctx.lineTo(fx + 7.4, -7 - lift); });
      ell(ctx, fx + sd * 3, -6.4 - lift, 1, 1, '#c8a060', null);
    }
    // A fur kilt with a belt and a wolf-skull buckle.
    shape(ctx, vgrad(ctx, -40, -20, shade(P.cloth, 0.2), P.cloth), () => { ctx.moveTo(-16, -38); ctx.lineTo(16, -38); ctx.lineTo(18, -24); for (let x = 18; x >= -18; x -= 6) ctx.lineTo(x - 3, -21 + (x % 12 ? 2 : -1)); });
    stroke(ctx, 'rgba(255,255,255,0.25)', LW, () => { for (let x = -14; x <= 14; x += 4) { ctx.moveTo(x, -35); ctx.lineTo(x + 1, -26); } });
    shape(ctx, '#3a2a1e', () => { ctx.rect(-17, -40.4, 34, 4.4); });
    shape(ctx, '#e8f4ff', () => { ctx.moveTo(-3.4, -42); ctx.lineTo(3.4, -42); ctx.lineTo(2.4, -35); ctx.lineTo(0, -33.6); ctx.lineTo(-2.4, -35); });
    ell(ctx, -1.2, -39.6, 0.8, 0.7, '#3ad8ff', null); ell(ctx, 1.2, -39.6, 0.8, 0.7, '#3ad8ff', null);
    let R = { x: 30, y: -34 }, clubA = 1.9, L = { x: -30, y: -34 + g.s * 2 };
    if (b.p >= 0 || b.wind) { const up = -2.6, dn = 1.2; clubA = b.wind ? lerp(1.9, up, b.wind) : lerp(up, dn, b.hit); R = { x: 30 + Math.cos(clubA - 1.6) * 4, y: lerp(-34, -64, b.wind) + b.hit * 26 }; }
    const raise = (lane.on ? (m.stage === 'wind' ? lane.wind : 1 - Math.min(1, lane.act * 3)) : 0) || (slam.on ? (m.stage === 'wind' ? slam.wind : 1 - Math.min(1, slam.act * 3)) : 0);
    if (raise) { R = { x: lerp(30, 10, raise), y: lerp(-34, -92, raise) }; L = { x: lerp(-30, -10, raise), y: lerp(-34, -92, raise) }; clubA = lerp(1.9, -1.6, raise); }
    if ((lane.on || slam.on) && m.stage === 'act') { const k = ease(Math.min(1, (lane.act || slam.act) * 3)); R = { x: lerp(10, 18, k), y: lerp(-92, -10, k) }; L = { x: lerp(-10, 4, k), y: lerp(-92, -14, k) }; clubA = lerp(-1.6, 1.5, k); }
    const boulder = bould.on && m.stage === 'wind' ? bould.wind : 0;
    if (boulder) { L = { x: lerp(-30, -13, boulder), y: lerp(-34, -108, boulder) }; R = { x: lerp(30, 13, boulder), y: lerp(-34, -108, boulder) }; }
    if (bould.on && m.stage === 'act') { const k = ease(Math.min(1, bould.act * 3)); L = { x: lerp(-13, -22, k), y: lerp(-108, -60, k) }; R = { x: lerp(13, 22, k), y: lerp(-108, -60, k) }; }
    const hand = (f) => { ell(ctx, f.x, f.y, 6, 5.4, skin); for (let k = -1.5; k <= 1.5; k++) ell(ctx, f.x + k * 2.6, f.y + 4, 1.4, 2, skin, LINE, 0, LW * 0.6); ell(ctx, f.x - 1.6, f.y - 2, 2, 1.2, 'rgba(255,255,255,0.5)', null); };
    const armTo = (sx, sy, f, sd) => { const ex = (sx + f.x) / 2 + sd * 5, ey = (sy + f.y) / 2 + 3; chain(ctx, [{ x: sx, y: sy }, { x: ex, y: ey }, f], [7, 6, 5.5], skin); shape(ctx, fur, () => { const cx = lerp(ex, f.x, 0.7), cy = lerp(ey, f.y, 0.7); ctx.ellipse(cx, cy, 6.6, 3.6, Math.atan2(f.y - ey, f.x - ex) + Math.PI / 2, 0, TAU); }); hand(f); };
    const club = () => {
      if (boulder || (bould.on && m.stage === 'act')) return;
      ctx.save(); ctx.translate(R.x, R.y); ctx.rotate(clubA);
      shape(ctx, '#5a4a3a', () => { ctx.rect(-4, -2.2, 8, 4.4); });
      stroke(ctx, '#c8a060', LW, () => { ctx.moveTo(-2, -2.2); ctx.lineTo(-1, 2.2); ctx.moveTo(1, -2.2); ctx.lineTo(2, 2.2); });
      shape(ctx, vgrad(ctx, -7, 8, '#ffffff', '#7ac8ec'), () => { ctx.moveTo(3, -3); ctx.lineTo(34, -7.4); ctx.lineTo(37, -11); ctx.lineTo(41, -2); ctx.lineTo(38, 7); ctx.lineTo(31, 8.4); ctx.lineTo(3, 3); });
      stroke(ctx, 'rgba(255,255,255,0.85)', LW, () => { ctx.moveTo(10, -2); ctx.lineTo(30, -4.6); ctx.moveTo(18, 2); ctx.lineTo(28, 1); });
      stroke(ctx, 'rgba(60,140,200,0.6)', LW * 0.8, () => { ctx.moveTo(26, -6); ctx.lineTo(30, 0); ctx.lineTo(27, 5); ctx.moveTo(34, -5); ctx.lineTo(36, 1); });
      if (raise > 0.3 || m.phase >= 1) glow(ctx, 34, 0, 10 + raise * 8, '#7ae8ff', 0.6);
      ctx.restore();
    };
    // The body: broad and shaggy, a fur mantle, ice shards out of the shoulders, cracks of frost.
    shape(ctx, vgrad(ctx, -80, -36, lt, dk), () => { ctx.moveTo(-16, -36); ctx.bezierCurveTo(-30, -46, -28, -72, -18, -78); ctx.quadraticCurveTo(0, -84, 18, -78); ctx.bezierCurveTo(28, -72, 30, -46, 16, -36); });
    stroke(ctx, dk2, LW * 1.1, () => { ctx.moveTo(-14, -60); ctx.quadraticCurveTo(-6, -54, 0, -58); ctx.quadraticCurveTo(6, -54, 14, -60); });
    stroke(ctx, 'rgba(255,255,255,0.45)', LW, () => { ctx.moveTo(-8, -50); ctx.lineTo(-4, -44); ctx.lineTo(-7, -40); ctx.moveTo(9, -48); ctx.lineTo(6, -42); });
    for (let k = 0; k < 11; k++) { const x = lerp(-20, 20, k / 10); ell(ctx, x, -76 + Math.abs(x) * 0.1 + Math.sin(k * 1.7) * 1.2, 3.4, 3, fur, k % 2 ? LINE : null); }
    for (const [x, y, h, a] of [[-20, -78, 14, -0.5], [-14, -82, 18, -0.2], [16, -82, 17, 0.25], [22, -76, 13, 0.55], [0, -86, 10, 0]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); shape(ctx, vgrad(ctx, -h, 0, '#ffffff', '#9adcf8'), () => { ctx.moveTo(-3, 0); ctx.lineTo(0, -h - (m.phase >= 2 ? 4 : 0)); ctx.lineTo(3, 0); }); stroke(ctx, 'rgba(255,255,255,0.8)', LW * 0.7, () => { ctx.moveTo(-0.8, -2); ctx.lineTo(-0.2, -h * 0.7); }); ctx.restore(); }
    if (boulder || (bould.on && m.stage === 'act')) {
      const bx = (L.x + R.x) / 2, by = (L.y + R.y) / 2 - 13;
      ell(ctx, bx, by, 16, 13, rgrad(ctx, bx, by, 16, '#ffffff', '#6ac0e8'));
      stroke(ctx, 'rgba(255,255,255,0.7)', LW, () => { ctx.moveTo(bx - 8, by - 4); ctx.lineTo(bx + 2, by - 8); ctx.lineTo(bx + 6, by + 2); ctx.moveTo(bx - 4, by + 5); ctx.lineTo(bx + 4, by + 7); });
      glow(ctx, bx, by, 22, '#9ae8ff', 0.4);
    }
    club();
    armTo(-21, -72, L, -1);
    // The head: a blue face, frosted brows, a broad nose, a beard and crown of icicles, cold breath.
    const hy = -90;
    ell(ctx, 0, hy, 9.6, 10, vgrad(ctx, hy - 10, hy + 10, lt, skin));
    shape(ctx, shade(skin, 0.1), () => { ctx.moveTo(-1.6, hy - 1); ctx.quadraticCurveTo(0, hy - 2, 1.6, hy - 1); ctx.lineTo(2.6, hy + 3.4); ctx.quadraticCurveTo(0, hy + 4.6, -2.6, hy + 3.4); });
    shape(ctx, '#3a0a1a', () => { ctx.ellipse(0, hy + 6, 3.4, 1 + (raise > 0.4 ? 1.6 : 0), 0, 0, TAU); });
    shape(ctx, '#ffffff', () => { ctx.moveTo(-9.2, hy + 1); for (let x = -9; x <= 9; x += 3) { ctx.lineTo(x + 1.5, hy + 13 + (Math.abs(x) < 4 ? 5 : 1) + Math.sin(x) * 1); ctx.lineTo(x + 3, hy + 3 + (Math.abs(x) < 3 ? 4.6 : 0)); } ctx.lineTo(9.2, hy + 1); ctx.quadraticCurveTo(0, hy + 5, -9.2, hy + 1); });
    stroke(ctx, 'rgba(120,180,220,0.6)', LW * 0.6, () => { for (let x = -7; x <= 7; x += 3.5) { ctx.moveTo(x, hy + 5); ctx.lineTo(x + 0.6, hy + 11); } });
    shape(ctx, '#ffffff', () => { ctx.moveTo(-8.4, hy - 3); ctx.quadraticCurveTo(-4, hy - 7.4, -0.6, hy - 3.6); ctx.lineTo(-2, hy - 2.4); ctx.quadraticCurveTo(-5, hy - 4.6, -8.4, hy - 3); });
    shape(ctx, '#ffffff', () => { ctx.moveTo(8.4, hy - 3); ctx.quadraticCurveTo(4, hy - 7.4, 0.6, hy - 3.6); ctx.lineTo(2, hy - 2.4); ctx.quadraticCurveTo(5, hy - 4.6, 8.4, hy - 3); });
    eye(ctx, -3.6, hy - 1.4, 1.6, P.eye, 0, 1); eye(ctx, 3.6, hy - 1.4, 1.6, P.eye, 0, -1);
    for (let i = -2; i <= 2; i++) shape(ctx, vgrad(ctx, hy - 18, hy - 8, '#ffffff', '#9adcf8'), () => { ctx.moveTo(i * 3.6 - 1.7, hy - 8); ctx.lineTo(i * 3.6, hy - 15 - (i ? 0 : 4) - (m.phase >= 1 ? 2 : 0)); ctx.lineTo(i * 3.6 + 1.7, hy - 8); });
    { const k = (t * 0.6) % 1; ctx.globalAlpha = 0.5 * (1 - k); ell(ctx, 0, hy + 8 + k * 9, 3 + k * 6, 2 + k * 3, ice, null); ctx.globalAlpha = 1; }
    armTo(21, -72, R, 1);
    for (const sd of [-1, 1]) { ell(ctx, sd * 20.5, -73, 7.6, 6, vgrad(ctx, -79, -67, '#ffffff', fur)); for (let k = -2; k <= 2; k++) ell(ctx, sd * 20.5 + k * 2.6, -68.4 + Math.abs(k) * 0.6, 1.6, 1.8, fur, null); }
    if (raise > 0.2) for (let i = 0; i < 6; i++) { const a = t * 3 + (i * TAU) / 6; ell(ctx, R.x + Math.cos(a) * 14 * raise, R.y + Math.sin(a) * 10 * raise, 1.4, 1.4, '#ffffff', null); }
    if (m.enraged) glow(ctx, 0, -60, 40, '#7ae8ff', 0.25);
    ctx.restore();
  }

  // ------------------------------------------------------------------ 4. Trisskar the Three-Headed Serpent
  /** One segment of the serpent: a scaled body ring with a pale belly plate. */
  function seg(ctx, x, y, rx, ry, col, belly, scaleCol, back = false) {
    ell(ctx, x, y, rx, ry, col);
    if (!back) { ell(ctx, x, y + ry * 0.35, rx * 0.55, ry * 0.42, belly, null); stroke(ctx, 'rgba(0,0,0,0.25)', LW * 0.5, () => { ctx.moveTo(x - rx * 0.5, y + ry * 0.35); ctx.lineTo(x + rx * 0.5, y + ry * 0.35); }); }
    stroke(ctx, scaleCol, LW * 0.7, () => { ctx.arc(x - rx * 0.4, y - ry * 0.25, rx * 0.28, 0.3, Math.PI - 0.3); ctx.moveTo(x + rx * 0.68, y - ry * 0.25); ctx.arc(x + rx * 0.4, y - ry * 0.25, rx * 0.28, 0.3, Math.PI - 0.3); });
  }
  function serpentHead(ctx, P, x, y, ang, r, col, open, hornKind, eyeCol, t, idle) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const skin = P.skin, dk = shade(skin, -0.3), lt = shade(skin, 0.2);
    if (hornKind === 'frill') for (let i = -2; i <= 2; i++) shape(ctx, col, () => { ctx.moveTo(-r * 0.6, 0); ctx.lineTo(-r * 1.7, i * r * 0.55); ctx.lineTo(-r * 0.4, i * r * 0.25 + 0.5); });
    if (hornKind === 'horns') for (const sd of [-1, 1]) { shape(ctx, '#f4ead0', () => { ctx.moveTo(-r * 0.4, sd * r * 0.5); ctx.quadraticCurveTo(-r * 1.4, sd * r * 1.3, -r * 1.8, sd * r * 0.6); ctx.lineTo(-r * 0.6, sd * r * 0.2); }); stroke(ctx, 'rgba(0,0,0,0.3)', LW * 0.6, () => { for (let k = 1; k < 4; k++) { ctx.moveTo(-r * (0.5 + k * 0.3), sd * r * (0.5 + k * 0.18)); ctx.lineTo(-r * (0.6 + k * 0.3), sd * r * (0.3 + k * 0.18)); } }); }
    if (hornKind === 'crest') shape(ctx, col, () => { ctx.moveTo(-r * 0.8, -r * 0.6); ctx.lineTo(-r * 0.3, -r * 1.6); ctx.lineTo(r * 0.1, -r * 0.8); ctx.lineTo(r * 0.5, -r * 1.3); ctx.lineTo(r * 0.8, -r * 0.5); });
    // A forked tongue flicking while it waits.
    if (idle && Math.sin(t * 3 + x) > 0.4) stroke(ctx, '#e83a5a', LW * 1.2, () => { const L2 = 1.9 + Math.sin(t * 20) * 0.2; ctx.moveTo(r * 1.5, r * 0.3); ctx.lineTo(r * L2, r * 0.32); ctx.lineTo(r * (L2 + 0.4), r * 0.1); ctx.moveTo(r * L2, r * 0.32); ctx.lineTo(r * (L2 + 0.4), r * 0.5); });
    shape(ctx, dk, () => { ctx.moveTo(-r * 0.4, r * 0.2); ctx.lineTo(r * 1.6, r * 0.25 + open * r * 0.9); ctx.lineTo(r * 1.3, r * 0.55 + open * r * 0.9); ctx.lineTo(-r * 0.3, r * 0.7); });
    if (open > 0.15) { shape(ctx, '#5a0a14', () => { ctx.moveTo(0, r * 0.2); ctx.lineTo(r * 1.5, r * 0.15); ctx.lineTo(r * 1.4, r * 0.2 + open * r * 0.8); }, null); glow(ctx, r * 1.2, r * 0.4, r * 1.6 * open, col, 0.55); for (let k = 0; k < 4; k++) shape(ctx, '#ffffff', () => { const fx = r * (0.3 + k * 0.3); ctx.moveTo(fx, r * 0.25 + open * r * 0.75); ctx.lineTo(fx + r * 0.08, r * 0.05 + open * r * 0.75); ctx.lineTo(fx + r * 0.16, r * 0.25 + open * r * 0.75); }, null); }
    shape(ctx, vgrad(ctx, -r, r, lt, dk), () => { ctx.moveTo(-r * 0.9, -r * 0.6); ctx.quadraticCurveTo(r * 0.6, -r * 1.0, r * 1.8, -r * 0.15); ctx.quadraticCurveTo(r * 1.7, r * 0.3, r * 1.4, r * 0.3); ctx.lineTo(-r * 0.5, r * 0.6); ctx.quadraticCurveTo(-r * 1.1, 0, -r * 0.9, -r * 0.6); });
    stroke(ctx, 'rgba(0,0,0,0.28)', LW * 0.6, () => { for (let k = 0; k < 3; k++) { ctx.moveTo(-r * 0.4 + k * r * 0.4, -r * 0.1); ctx.arc(-r * 0.55 + k * r * 0.4, -r * 0.1, r * 0.15, 0, Math.PI); } });
    if (open > 0.1) for (const fx of [r * 1.0, r * 1.35]) shape(ctx, '#ffffff', () => { ctx.moveTo(fx, r * 0.18); ctx.lineTo(fx + r * 0.1, r * 0.18 + r * 0.5 * open); ctx.lineTo(fx + r * 0.2, r * 0.18); });
    stroke(ctx, col, LW * 2, () => { ctx.moveTo(-r * 0.5, -r * 0.45); ctx.quadraticCurveTo(r * 0.5, -r * 0.75, r * 1.3, -r * 0.25); });
    ell(ctx, r * 1.55, -r * 0.08, r * 0.08, r * 0.05, '#1a0a0a', null);
    shape(ctx, dk, () => { ctx.moveTo(r * 0.2, -r * 0.62); ctx.quadraticCurveTo(r * 0.6, -r * 0.78, r * 0.95, -r * 0.5); ctx.lineTo(r * 0.6, -r * 0.48); }, null);
    eye(ctx, r * 0.55, -r * 0.3, r * 0.26, eyeCol, 0, 1, true);
    ctx.restore();
  }
  function serpent(ctx, P, look, A) {
    const t = A.t, m = A.m, g = gait(A, 0.9);
    const tail = move(A, 'tail'), brood = move(A, 'brood'), charge = move(A, 'charge');
    const skin = P.skin, dk = shade(skin, -0.32), lt = shade(skin, 0.22), belly = '#e8d8a0', sc = 'rgba(10,40,20,0.45)';
    const U = 1 / (1.5 * (A.size || 4));
    const slither = Math.sin(g.W * TAU) * 3;
    const lean = charge.on ? (m.stage === 'wind' ? charge.wind : 1) : 0;
    // The tail, back up the field: raised and lashing for its move, a spiked club at its tip.
    const lash = tail.on ? (m.stage === 'wind' ? -tail.wind : Math.sin(Math.min(1, tail.act * 2) * Math.PI) * 2 - 1) : 0;
    const tp = [];
    for (let i = 0; i <= 12; i++) { const k = i / 12; tp.push([Math.sin(t * 1.6 + k * 4) * (4 + k * 10) + lash * k * k * 30 + 10 * k, -12 - k * 34 - (tail.on ? k * k * 12 : 0)]); }
    tube(ctx, tp.map(([x, y]) => ({ x, y })), tp.map((_, i) => 6.2 - i * 0.42), skin, null, sc);
    for (let i = 0; i < 12; i += 2) { const [x, y] = tp[i], r = 6.2 - i * 0.42; shape(ctx, '#f4ead0', () => { ctx.moveTo(x - 1.2, y - r * 0.8); ctx.lineTo(x, y - r * 0.8 - 2.6); ctx.lineTo(x + 1.2, y - r * 0.8); }, LINE, LW * 0.5); }
    { const [x, y] = tp[12]; ell(ctx, x, y, 3.4, 3, dk); for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + lash; shape(ctx, '#f4ead0', () => { ctx.moveTo(x + Math.cos(a - 0.3) * 3, y + Math.sin(a - 0.3) * 3); ctx.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); ctx.lineTo(x + Math.cos(a + 0.3) * 3, y + Math.sin(a + 0.3) * 3); }, LINE, LW * 0.5); } }
    ctx.save(); ctx.translate(slither * 0.5, 0);
    // The coil on the ground.
    // The coil: two loops lying on the ground, each one smooth body, the upper on the lower.
    for (let ring = 0; ring < 2; ring++) {
      const R = 20 - ring * 6, cy = -7 - ring * 5, w = 6 - ring;
      const loop = () => { ctx.beginPath(); ctx.ellipse(0, cy, R, R * 0.38, 0, 0, TAU); };
      ctx.lineJoin = 'round';
      loop(); ctx.strokeStyle = LINE; ctx.lineWidth = w * 2 + LW * 2; ctx.stroke();
      loop(); ctx.strokeStyle = ring ? skin : dk; ctx.lineWidth = w * 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, cy - w * 0.35, R, R * 0.38, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.strokeStyle = HI; ctx.lineWidth = w * 0.6; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, cy + w * 0.3, R, R * 0.38, 0, 0.15, Math.PI - 0.15); ctx.strokeStyle = 'rgba(232,216,160,0.75)'; ctx.lineWidth = w * 0.7; ctx.stroke();
      ctx.strokeStyle = sc; ctx.lineWidth = LW * 0.7;
      for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU + t * 0.3; const x = Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.38 - w * 0.3; ctx.beginPath(); ctx.arc(x, y, w * 0.3, 0.3, Math.PI - 0.3); ctx.stroke(); }
    }
    // The trunk, with a ridge of spines up its back.
    const sh = { x: slither * 0.4, y: -46 + lean * 14 };
    const trunk = [];
    for (let i = 0; i <= 9; i++) { const k = i / 9; trunk.push({ x: lerp(0, sh.x, k) + Math.sin(k * 3 + t * 2) * 2, y: lerp(-10, sh.y, k) }); }
    trunk.forEach((p, i) => { if (i % 2) for (const sd of [-1, 1]) { const k = i / 9; shape(ctx, shade(skin, -0.45), () => { ctx.moveTo(p.x + sd * (8 - k * 2), p.y - 2); ctx.lineTo(p.x + sd * (12.6 - k * 2), p.y - 5); ctx.lineTo(p.x + sd * (8.6 - k * 2), p.y + 1); }, LINE, LW * 0.5); } });
    tube(ctx, trunk, trunk.map((_, i) => 9.5 - (i / 9) * 2.5), skin, belly, sc);
    ell(ctx, trunk[0].x, trunk[0].y + 1, 9.6, 6, skin, null);
    const kinds = [['crest', 1], ['horns', 0], ['frill', 2]];
    const rest = [{ x: -24, y: -66 }, { x: 0, y: -78 }, { x: 24, y: -66 }];
    const heads = m.heads || [];
    for (const i of [0, 2, 1]) {
      const h = heads[[1, 0, 2][i]] || { dx: 0, dy: 60, k: 0, col: ['#7ad8ff', '#9dff4a', '#ff7a2a'][i] };
      const col = h.col || ['#7ad8ff', '#9dff4a', '#ff7a2a'][i];
      const tx = h.dx * U, ty = h.dy * U - 30;
      const d = Math.hypot(tx - rest[i].x, ty - rest[i].y) || 1;
      const bob = Math.sin(t * 2.4 + i * 2) * 2.5;
      const strike = h.k > 0 ? Math.sin(Math.min(1, (1 - h.k) * 1.6) * Math.PI) : 0;
      const reach = Math.min(d - 4, 26) * strike;
      const hx = rest[i].x + ((tx - rest[i].x) / d) * reach + (lean ? 0 : bob * 0.4), hy = rest[i].y + ((ty - rest[i].y) / d) * reach + bob + lean * 22;
      const cx = lerp(sh.x, hx, 0.5) + (i - 1) * 12, cy = lerp(sh.y, hy, 0.5) + 6;
      const neck = [];
      for (let s = 0; s <= 10; s++) { const k = s / 10, a1 = (1 - k) * (1 - k), a2 = 2 * (1 - k) * k, a3 = k * k; neck.push({ x: a1 * sh.x + a2 * cx + a3 * hx, y: a1 * sh.y + a2 * cy + a3 * hy }); }
      neck.forEach((p, s) => { if (s % 3 === 1) { const k = s / 10; shape(ctx, col, () => { ctx.moveTo(p.x - 1.4, p.y - 4.4 + k * 1.4); ctx.lineTo(p.x, p.y - 7.6 + k * 2); ctx.lineTo(p.x + 1.4, p.y - 4.4 + k * 1.4); }, LINE, LW * 0.5); } });
      tube(ctx, neck, neck.map((_, s) => 5.8 - (s / 10) * 1.8), skin, belly, sc);
      const ang = Math.atan2(ty - hy, tx - hx);
      const face = strike > 0.05 ? ang : (i === 0 ? 2.2 : i === 2 ? 0.94 : Math.PI / 2) + Math.sin(t * 1.5 + i) * 0.15;
      const flip = Math.cos(face) < 0;
      ctx.save(); ctx.translate(hx, hy); if (flip) ctx.scale(-1, 1);
      serpentHead(ctx, P, 0, 0, flip ? Math.PI - face : face, 8.5, col, Math.max(strike, h.heavy && h.k > 0 ? 0.6 : 0, brood.on ? 0.4 : 0), kinds[i][0], ['#bff4ff', '#ffe04a', '#ffcf3a'][i], t + i, strike < 0.05);
      ctx.restore();
      if (m.phase >= 2) glow(ctx, hx, hy, 9, col, 0.3);
    }
    ell(ctx, sh.x, sh.y, 8.6, 7.4, skin, null);
    ell(ctx, sh.x - 2.4, sh.y - 2.4, 4, 2.6, 'rgba(255,255,255,0.18)', null);
    if (brood.on) { glow(ctx, 0, -12, 26 * brood.wind, '#c8ff8a', 0.5); for (let k = 0; k < 3; k++) ell(ctx, -10 + k * 10, -6 - brood.wind * 4, 3, 3.8, '#f0f0d0'); }
    ctx.restore();
  }

  // ------------------------------------------------------------------ 5. Vitriel the Mirror Witch
  function witch(ctx, P, look, A) {
    const t = A.t, m = A.m, b = blow(A.atk);
    const mir = move(A, 'mirror'), clo = move(A, 'clones'), blk = move(A, 'blink');
    const hover = 14 + Math.sin(t * 1.8) * 3;
    const gown = P.cloth, dk = shade(gown, -0.35), lt = shade(gown, 0.25), gold = '#d8b45a';
    ctx.save(); ctx.translate(0, -hover);
    if (blk.on) ctx.globalAlpha *= 1 - 0.7 * Math.sin(Math.min(1, blk.k) * Math.PI);
    function dress() {
      // A layered gown: an outer skirt split over an inner one, runes stitched down it, gems on the hem.
      shape(ctx, vgrad(ctx, -40, 0, shade(gown, 0.45), shade(gown, 0.1)), () => { ctx.moveTo(-5, -34); ctx.bezierCurveTo(-9, -24, -12, -10, -11, 0); for (let x = -11; x <= 11; x += 5.5) ctx.quadraticCurveTo(x + 2.75, 3 + Math.sin(t * 4 + x) * 1.5, x + 5.5, 0); ctx.bezierCurveTo(12, -10, 9, -24, 5, -34); });
      shape(ctx, vgrad(ctx, -62, 0, lt, dk), () => { ctx.moveTo(-6, -50); ctx.bezierCurveTo(-14, -34, -24, -14, -22, 0); ctx.quadraticCurveTo(-18, 3 + Math.sin(t * 4) * 2, -14, 0); ctx.bezierCurveTo(-11, -12, -8, -26, -4, -34); ctx.lineTo(4, -34); ctx.bezierCurveTo(8, -26, 11, -12, 14, 0); ctx.quadraticCurveTo(18, 3 + Math.sin(t * 4 + 2) * 2, 22, 0); ctx.bezierCurveTo(24, -14, 14, -34, 6, -50); });
      stroke(ctx, rgba(look.trim, 0.7), LW, () => { for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) { const y = -30 + k * 6, x = sd * (10 + k * 2); ctx.moveTo(x - 1.2, y); ctx.lineTo(x, y - 1.6); ctx.lineTo(x + 1.2, y); ctx.moveTo(x, y - 1.6); ctx.lineTo(x, y + 1.2); } });
      for (let k = -3; k <= 3; k++) { ell(ctx, k * 6.4, 0.6, 1.1, 1.1, k % 2 ? '#c8b8ff' : '#ffffff', LINE, 0, LW * 0.5); }
    }
    if (clo.on && m.stage === 'wind') for (const sd of [-1, 1]) { ctx.save(); ctx.globalAlpha *= 0.4 * clo.wind; ctx.translate(sd * 26 * clo.wind, 0); dress(); ctx.restore(); }
    const shards = 6, spin = t * 0.7, rx = 42, ry = 10;
    const align = mir.on ? mir.wind : 0;
    const crack = m.phase >= 1;
    const shard = (i, near) => {
      const a = spin + (i / shards) * TAU, z = Math.sin(a);
      if ((z > 0) !== near) return;
      const x = lerp(Math.cos(a) * rx, (i - (shards - 1) / 2) * 7.6, align), y = lerp(-40 + z * ry, -40, align);
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.cos(a) * 0.4 * (1 - align));
      shape(ctx, gold, () => { ctx.moveTo(-5.4, -11.4); ctx.lineTo(5.4, -10.4); ctx.lineTo(6, 10.4); ctx.lineTo(-6, 11.4); });
      shape(ctx, vgrad(ctx, -10, 10, '#ffffff', '#a8b8e8'), () => { ctx.moveTo(-4.2, -10); ctx.lineTo(4.2, -9); ctx.lineTo(4.8, 9); ctx.lineTo(-4.8, 10); }, '#4a3a6a');
      stroke(ctx, 'rgba(255,255,255,0.9)', LW, () => { ctx.moveTo(-2, -6); ctx.lineTo(1.5, -2); ctx.moveTo(-2.6, -2); ctx.lineTo(-1, -0.4); });
      ell(ctx, 0, -11, 1, 1, '#c8b8ff', LINE, 0, LW * 0.5);
      if (crack) stroke(ctx, '#4a3a6a', LW, () => { ctx.moveTo(-3, 2); ctx.lineTo(0, 0); ctx.lineTo(2, 5); ctx.moveTo(0, 0); ctx.lineTo(3, -2); });
      if (m.phase >= 2) glow(ctx, 0, 0, 8, look.trim, 0.4);
      ctx.restore();
    };
    for (let i = 0; i < shards; i++) shard(i, false);
    { const fy0 = -56, sw = Math.sin(t * 1.5) * 2;
      shape(ctx, vgrad(ctx, fy0 - 8, fy0 + 34, '#f8f8ff', '#9a9ad0'), () => { ctx.moveTo(-7, fy0 - 6); ctx.quadraticCurveTo(-17, fy0 + 6, -17 + sw, fy0 + 34); ctx.quadraticCurveTo(-10, fy0 + 27, -5, fy0 + 32); ctx.quadraticCurveTo(0, fy0 + 25, 5, fy0 + 32); ctx.quadraticCurveTo(10, fy0 + 27, 17 - sw, fy0 + 34); ctx.quadraticCurveTo(17, fy0 + 6, 7, fy0 - 6); ctx.quadraticCurveTo(0, fy0 - 12, -7, fy0 - 6); }, '#5a5a8a');
      stroke(ctx, 'rgba(255,255,255,0.6)', LW, () => { ctx.moveTo(-12, fy0 + 4); ctx.quadraticCurveTo(-14, fy0 + 18, -13 + sw, fy0 + 30); ctx.moveTo(12, fy0 + 4); ctx.quadraticCurveTo(14, fy0 + 18, 13 - sw, fy0 + 30); }); }
    dress();
    // A laced bodice, a belt with a crystal, a high collar of mirror spikes.
    shape(ctx, vgrad(ctx, -50, -34, shade(gown, 0.15), dk), () => { ctx.moveTo(-6.4, -50); ctx.lineTo(6.4, -50); ctx.lineTo(5, -34); ctx.lineTo(-5, -34); });
    stroke(ctx, gold, LW * 0.8, () => { for (let k = 0; k < 5; k++) { const y = -48 + k * 3; ctx.moveTo(-1.6, y); ctx.lineTo(1.6, y + 1.5); ctx.moveTo(1.6, y); ctx.lineTo(-1.6, y + 1.5); } });
    shape(ctx, gold, () => { ctx.rect(-6, -35.4, 12, 2.4); });
    shape(ctx, '#c8b8ff', () => { ctx.moveTo(0, -37.6); ctx.lineTo(2, -34.2); ctx.lineTo(0, -31.4); ctx.lineTo(-2, -34.2); }); glow(ctx, 0, -34.4, 5, look.trim, 0.5);
    for (let k = -3; k <= 3; k++) shape(ctx, vgrad(ctx, -60, -50, '#ffffff', '#a8b8e8'), () => { ctx.moveTo(k * 2.2 - 1.2, -50); ctx.lineTo(k * 2.6, -56.4 - Math.abs(k) * 0.9); ctx.lineTo(k * 2.2 + 1.2, -50); }, '#4a3a6a', LW * 0.6);
    // Sleeves and long-fingered hands: one lifts the hand mirror to cast.
    const cast = Math.max(b.wind, b.hit, align);
    const hx = lerp(14, 6, cast), hy = lerp(-32, -62, cast);
    const lhx = -16 - Math.sin(t * 2) * 2, lhy = -34 + cast * -10;
    for (const [sx, sy, fx, fy] of [[-6.4, -48, lhx, lhy], [6.4, -48, hx, hy]]) {
      limb(ctx, sx, sy, fx, fy, 2.4, 2, P.skin);
      const mx = lerp(sx, fx, 0.55), my = lerp(sy, fy, 0.55), sd = Math.sign(fx);
      shape(ctx, vgrad(ctx, my - 5, my + 8, lt, dk), () => { ctx.moveTo(sx, sy - 2); ctx.quadraticCurveTo(mx + sd * 6, my - 2, mx + sd * 3, my + 9 + Math.sin(t * 3) * 1.2); ctx.lineTo(mx - sd * 2, my + 3); ctx.quadraticCurveTo(sx - sd * 2, sy + 2, sx, sy + 2); });
      for (let k = 0; k < 3; k++) stroke(ctx, P.skin, 0.9, () => { ctx.moveTo(fx, fy); ctx.lineTo(fx + sd * (1.6 + k * 0.4), fy - 2.6 + k * 1.6); });
      stroke(ctx, gold, LW * 1.4, () => { const cx = lerp(sx, fx, 0.85), cy = lerp(sy, fy, 0.85); ctx.moveTo(cx - 1.6, cy - 1); ctx.lineTo(cx + 1.6, cy + 1); });
    }
    const fy = -57;
    ell(ctx, 0, fy, 7.2, 8.4, vgrad(ctx, fy - 8, fy + 8, '#ffffff', P.skin));
    shape(ctx, '#f8f8ff', () => { ctx.moveTo(-7.2, fy - 1); ctx.quadraticCurveTo(-6, fy - 9, 0, fy - 8.6); ctx.quadraticCurveTo(6, fy - 9, 7.2, fy - 1); ctx.quadraticCurveTo(3, fy - 6, 0, fy - 5); ctx.quadraticCurveTo(-3, fy - 6, -7.2, fy - 1); }, '#5a5a8a');
    for (const sd of [-1, 1]) { glow(ctx, sd * 2.7, fy - 0.2, 5, look.trim, 0.6); ell(ctx, sd * 2.7, fy - 0.2, 1.5, 1, '#ffffff', LINE); ell(ctx, sd * 2.7, fy - 0.2, 0.6, 0.6, '#6a4aa8', null); stroke(ctx, '#5a5a8a', LW, () => { ctx.moveTo(sd * 1.2, fy - 2.2); ctx.lineTo(sd * 4.6, fy - 2.6); }); ell(ctx, sd * 4.2, fy + 2.4, 1.2, 0.6, 'rgba(255,120,180,0.35)', null); }
    stroke(ctx, '#8a4a6a', LW, () => { ctx.arc(0, fy + 3.4, 1.8, 0.3, Math.PI - 0.3); });
    for (let i = -2; i <= 2; i++) shape(ctx, vgrad(ctx, fy - 18, fy - 6, '#ffffff', '#b8c8f0'), () => { ctx.moveTo(i * 2.6 - 1.3, fy - 7); ctx.lineTo(i * 2.6, fy - 13 - (i ? 0 : 4) + Math.abs(i) * 0.5); ctx.lineTo(i * 2.6 + 1.3, fy - 7); }, '#4a3a6a');
    ell(ctx, 0, fy - 8, 1.1, 1.1, '#c8b8ff', LINE, 0, LW * 0.5);
    // The hand mirror: a gold frame, a glass that shines as she casts.
    ell(ctx, hx, hy - 4.4, 4.8, 5.8, gold); ell(ctx, hx, hy - 4.4, 3.6, 4.6, vgrad(ctx, hy - 9, hy + 1, '#ffffff', '#9ab0e8'), null);
    stroke(ctx, gold, 1.2, () => { ctx.moveTo(hx, hy + 1.4); ctx.lineTo(hx, hy + 5); });
    stroke(ctx, 'rgba(255,255,255,0.9)', LW, () => { ctx.moveTo(hx - 1.8, hy - 7); ctx.lineTo(hx + 0.6, hy - 4.6); });
    if (cast > 0.2) glow(ctx, hx, hy - 4, 14 * cast, '#ffffff', 0.7);
    for (let i = 0; i < shards; i++) shard(i, true);
    if (align > 0.3) glow(ctx, 0, -40, 30 * align, '#e8e0ff', 0.45 * align);
    if (m.shielded) { const was = ctx.globalAlpha; ctx.globalAlpha = was * 0.35; ell(ctx, 0, -36, 30, 40, '#e8e0ff', '#ffffff'); ctx.globalAlpha = was; }
    ctx.restore();
  }

  // ------------------------------------------------------------------ 6, 7. The Twin Titans
  function titan(ctx, P, look, A, sun) {
    const g = gait(A, 0.85), b = blow(A.atk), t = A.t, m = A.m;
    const flare = move(A, 'slam'), beam = move(A, 'beam');
    const skin = P.skin, dk = shade(skin, -0.3), dk2 = shade(skin, -0.42), lt = shade(skin, 0.25), metal = sun ? '#c8902a' : '#a8b0c8', metalD = sun ? '#8a5a10' : '#6a7088';
    const power = (flare.on ? (m.stage === 'wind' ? flare.wind : 1 - Math.min(1, flare.act * 3)) : 0) + (beam.on ? (m.stage === 'wind' ? beam.wind : 1 - Math.min(1, beam.act * 3)) : 0);
    ctx.save(); ctx.translate(0, g.bob * 1.5);
    const hy = -70, hr = 15 + power * 6 + (m.phase >= 1 ? 3 : 0);
    if (sun) {
      glow(ctx, 0, hy, hr * 2, '#ffb43a', 0.5 + power * 0.3);
      ctx.save(); ctx.translate(0, hy); ctx.rotate(t * 0.4);
      shape(ctx, '#ffd65a', () => { for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU, r = i % 2 ? hr : hr * 0.72; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } }, '#c8701a');
      stroke(ctx, '#c8701a', LW, () => { ctx.arc(0, 0, hr * 0.62, 0, TAU); });
      ctx.restore();
      ell(ctx, 0, hy, hr * 0.6, hr * 0.6, '#fff2a0', null);
    } else {
      glow(ctx, 0, hy, hr * 2, '#9ad8ff', 0.45 + power * 0.3);
      shape(ctx, vgrad(ctx, hy - hr, hy + hr, '#ffffff', '#c8d8f0'), () => { ctx.arc(0, hy, hr, 0.6, TAU - 0.6); ctx.arc(hr * 0.55, hy, hr * 0.85, TAU - 0.9, 0.9, true); }, '#6a8ac8');
      for (const [x, y] of [[-hr * 0.7, hy - hr * 0.3], [-hr * 0.5, hy + hr * 0.5], [-hr * 0.85, hy + hr * 0.15]]) ell(ctx, x, y, 1.2, 1.2, '#b8c8e8', null);
    }
    // Legs: thighs, knee guards, greaves, sandals strapped up the shin.
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, sd * g.s) * 3.5, fx = sd * 10 + sd * g.s * 2;
      const hip = { x: sd * 7, y: -31 }, knee = { x: sd * 9.6, y: -17 - lift * 0.5 }, ank = { x: fx, y: -4.6 - lift };
      leg(ctx, hip, knee, ank, 6.4, sun ? dk : shade(P.cloth, 0.2), dk2, lt);
      shape(ctx, vgrad(ctx, knee.y, ank.y, metal, metalD), () => { ctx.moveTo(knee.x - 4, knee.y + 3); ctx.lineTo(knee.x + 4, knee.y + 3); ctx.lineTo(ank.x + 3.2, ank.y - 1); ctx.lineTo(ank.x - 3.2, ank.y - 1); });
      ell(ctx, knee.x, knee.y, 4, 3.4, metal);
      ell(ctx, knee.x, knee.y, 1.4, 1.4, sun ? '#ff6a1a' : '#7ad8ff', null);
      foot(ctx, fx + sd * 0.6, -1 - lift, 5.6, sun ? skin : '#e8ecf4', sun ? '#f4e0b0' : '#ffffff');
      stroke(ctx, '#6a4426', LW * 1.2, () => { ctx.moveTo(fx - 4, -2.4 - lift); ctx.lineTo(fx + 4, -3.6 - lift); });
    }
    // A war skirt of plates; Sol's sun belt, Luna's crescent clasp.
    shape(ctx, vgrad(ctx, -40, -20, metal, metalD), () => { ctx.moveTo(-14, -38); ctx.lineTo(14, -38); ctx.lineTo(16, -24); for (let x = 16; x >= -16; x -= 5.33) ctx.lineTo(x - 2.66, -21 + (Math.round(x) % 2 ? 1 : -1)); });
    stroke(ctx, metalD, LW * 0.8, () => { for (let x = -12; x <= 12; x += 5.33) { ctx.moveTo(x, -36); ctx.lineTo(x * 1.12, -23); } });
    shape(ctx, metalD, () => { ctx.rect(-14.4, -40, 28.8, 3.6); });
    if (sun) { ell(ctx, 0, -38.2, 3.4, 3.4, '#ffd65a'); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; stroke(ctx, '#ffd65a', LW, () => { ctx.moveTo(Math.cos(a) * 3.6, -38.2 + Math.sin(a) * 3.6); ctx.lineTo(Math.cos(a) * 5.2, -38.2 + Math.sin(a) * 5.2); }); } }
    else shape(ctx, '#ffffff', () => { ctx.arc(0, -38.2, 3.4, 0.6, TAU - 0.6); ctx.arc(1.8, -38.2, 2.8, TAU - 0.9, 0.9, true); }, '#6a8ac8');
    if (sun) {
      shape(ctx, vgrad(ctx, -66, -36, lt, dk), () => { ctx.moveTo(-13, -38); ctx.bezierCurveTo(-27, -46, -27, -62, -17, -66); ctx.quadraticCurveTo(0, -70, 17, -66); ctx.bezierCurveTo(27, -62, 27, -46, 13, -38); });
      stroke(ctx, 'rgba(90,42,0,0.5)', LW, () => { ctx.moveTo(-12, -58); ctx.quadraticCurveTo(-6, -52, 0, -56); ctx.quadraticCurveTo(6, -52, 12, -58); ctx.moveTo(0, -55); ctx.lineTo(0, -41); for (const y of [-50, -45]) { ctx.moveTo(-5, y); ctx.quadraticCurveTo(-2.4, y + 1.4, -0.4, y); ctx.moveTo(5, y); ctx.quadraticCurveTo(2.4, y + 1.4, 0.4, y); } });
      for (let i = 0; i < 3; i++) stroke(ctx, '#ff7a1a', LW * 1.2, () => { const a = -1 + i * 0.5; ctx.moveTo(-4 + i * 4, -60); ctx.lineTo(-4 + i * 4 + Math.cos(a) * 3, -60 + Math.sin(a) * 3); });
    } else {
      const sw = Math.sin(t * 1.5) * 2;
      shape(ctx, vgrad(ctx, -76, -30, '#ffffff', '#a8b8e0'), () => { ctx.moveTo(-7, -76); ctx.quadraticCurveTo(-18, -64, -17 + sw, -32); ctx.quadraticCurveTo(-8, -38, 0, -34); ctx.quadraticCurveTo(8, -38, 17 - sw, -32); ctx.quadraticCurveTo(18, -64, 7, -76); }, '#6a7ab8');
      shape(ctx, vgrad(ctx, -64, -22, shade(P.cloth, 0.3), P.cloth), () => { ctx.moveTo(-12, -24); ctx.bezierCurveTo(-20, -44, -19, -58, -12, -64); ctx.quadraticCurveTo(0, -68, 12, -64); ctx.bezierCurveTo(19, -58, 20, -44, 12, -24); });
      stroke(ctx, 'rgba(255,255,255,0.55)', LW, () => { ctx.arc(0, -50, 5, 0.6, TAU - 0.6); });
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; for (const [x, y] of [[-8, -56], [7, -44], [-6, -34], [9, -58], [-10, -42]]) { ctx.beginPath(); ctx.arc(x, y, 0.6, 0, TAU); ctx.fill(); }
    }
    const up = Math.max(power, b.wind);
    const R = sun ? { x: lerp(20, 14, up) + b.hit * 6, y: lerp(-40, -84, up) + b.hit * 30 } : { x: 18, y: lerp(-40, -74, Math.max(up, b.hit)) };
    const L = sun ? { x: lerp(-20, -14, up), y: lerp(-40, -84, up) } : { x: -18, y: -42 };
    const armW = sun ? [5.6, 4.6] : [4.2, 3.4];
    const arm = (s, f, sd) => {
      limb(ctx, s.x, s.y, f.x, f.y, armW[0], armW[1], skin);
      bands(ctx, s, f, armW[0] * 1.1, metal, [0.3, 0.75]);
      if (sun) { fist(ctx, f.x, f.y, 5.2, skin); ell(ctx, sd * 15, -60.5, 6.8, 6.2, vgrad(ctx, -67, -54, shade(skin, 0.4), skin)); } else { ell(ctx, f.x, f.y, 3.8, 3.6, skin); ell(ctx, sd * 13.4, -60.6, 5.4, 4.6, vgrad(ctx, -65, -56, '#e8ecf4', metal)); stroke(ctx, metalD, LW * 0.7, () => { ctx.moveTo(sd * 9.6, -60); ctx.quadraticCurveTo(sd * 13.4, -57.6, sd * 17.2, -60); }); }
    };
    arm({ x: -13, y: -60 }, L, -1);
    if (!sun) {
      stroke(ctx, '#c8d0e8', 1.8, () => { ctx.moveTo(R.x, R.y + 26); ctx.lineTo(R.x, R.y - 14); });
      shape(ctx, '#e8f0ff', () => { ctx.arc(R.x, R.y - 19, 6, 0.4, TAU - 0.4); ctx.arc(R.x + 3.2, R.y - 19, 5, TAU - 0.7, 0.7, true); }, '#6a8ac8');
      ell(ctx, R.x, R.y - 16, 3.4, 3.4, rgrad(ctx, R.x, R.y - 16, 3.4, '#ffffff', '#7ad8ff'));
      glow(ctx, R.x, R.y - 16, 10 + up * 14, '#9ae8ff', 0.6);
    }
    arm({ x: 13, y: -60 }, R, 1);
    if (sun && power > 0.2) glow(ctx, (L.x + R.x) / 2, (L.y + R.y) / 2, 18 * power, '#ffcf3a', 0.8);
    if (sun) for (let i = 0; i < 5; i++) { const x = -5 + i * 2.5; shape(ctx, i % 2 ? '#ff7a1a' : '#ffcf3a', () => { ctx.moveTo(x - 2, hy + 2); ctx.quadraticCurveTo(x + Math.sin(t * 8 + i) * 2, hy - 12 - (i % 2) * 3, x + 2, hy + 2); }, null); }
    ell(ctx, 0, hy + 1, 7, 7.6, vgrad(ctx, hy - 7, hy + 8, lt, skin));
    if (!sun) shape(ctx, '#ffffff', () => { ctx.moveTo(-7, hy + 1); ctx.quadraticCurveTo(-6, hy - 8, 0, hy - 7.4); ctx.quadraticCurveTo(6, hy - 8, 7, hy + 1); ctx.quadraticCurveTo(3, hy - 4, 0, hy - 3.5); ctx.quadraticCurveTo(-3, hy - 4, -7, hy + 1); }, '#6a7ab8');
    else shape(ctx, '#ffcf3a', () => { ctx.moveTo(-6.4, hy - 2); ctx.lineTo(6.4, hy - 2); ctx.lineTo(5.6, hy - 4.4); ctx.lineTo(-5.6, hy - 4.4); }, '#c8701a', LW * 0.6);
    eye(ctx, -2.4, hy, 1.1, P.eye, sun ? 1 : 0, 1); eye(ctx, 2.4, hy, 1.1, P.eye, sun ? 1 : 0, -1);
    stroke(ctx, shade(skin, -0.45), LW, () => { ctx.moveTo(0, hy + 1); ctx.lineTo(0.6, hy + 3); ctx.moveTo(-1.8, hy + 4.6); ctx.quadraticCurveTo(0, hy + (sun ? 4 : 5.6), 1.8, hy + 4.6); });
    ctx.restore();
    if (m.linked) { const was = ctx.globalAlpha; ctx.globalAlpha = was * (0.5 + 0.3 * Math.sin(t * 5)); glow(ctx, 0, -40, 26, sun ? '#ffcf3a' : '#9ad8ff', 0.4); ctx.globalAlpha = was; }
  }
  const twinsol = (ctx, P, look, A) => titan(ctx, P, look, A, true);
  const twinluna = (ctx, P, look, A) => titan(ctx, P, look, A, false);

  // ------------------------------------------------------------------ 8. The Rot Behemoth
  function rot(ctx, P, look, A) {
    const g = gait(A, 0.6), b = blow(A.atk), t = A.t, m = A.m;
    const gas = move(A, 'gas'), rats = move(A, 'swarm');
    const skin = P.skin, dk = shade(skin, -0.35), dk2 = shade(skin, -0.5), lt = shade(skin, 0.2);
    const swell = gas.on ? (m.stage === 'wind' ? gas.wind : 1 - Math.min(1, gas.act * 2)) : 0;
    const wob = Math.sin(t * 3) * 1.2 + g.bob * 1.5;
    // Four stumpy legs: thick, wrinkled, blunt toes with cracked nails; one bandaged.
    [[-17, 0], [-6, Math.PI], [6, 0], [17, Math.PI]].forEach(([x, ph], i) => {
      const lift = Math.max(0, Math.sin(g.W * TAU + ph)) * 3;
      const hip = { x: x * 0.9, y: -16 }, ank = { x: x * 1.1, y: -4 - lift };
      limb(ctx, hip.x, hip.y, ank.x, ank.y, 6, 5.4, i % 2 ? dk : skin);
      stroke(ctx, 'rgba(0,0,0,0.3)', LW * 0.7, () => { for (let k = 1; k < 3; k++) { const y = lerp(hip.y, ank.y, k / 3); ctx.moveTo(ank.x - 3.6, y); ctx.quadraticCurveTo(ank.x, y + 1.2, ank.x + 3.6, y); } });
      if (i === 2) { bands(ctx, hip, ank, 5.6, '#d8d0b0', [0.35, 0.5, 0.65]); stroke(ctx, '#8a3a2a', LW, () => { ctx.moveTo(ank.x + 1, lerp(hip.y, ank.y, 0.45)); ctx.lineTo(ank.x + 2.6, lerp(hip.y, ank.y, 0.55)); }); }
      foot(ctx, ank.x, -0.6 - lift, 6.2, dk, '#c8c098', 3);
    });
    ctx.save(); ctx.translate(0, -wob * 0.5 + b.hit * 4); ctx.scale(1 + swell * 0.12 + b.wind * 0.05, 1 + swell * 0.08 - b.hit * 0.08);
    shape(ctx, vgrad(ctx, -70, -10, lt, dk), () => { ctx.moveTo(-28, -14); ctx.bezierCurveTo(-40, -30, -36, -62, -14, -68); ctx.bezierCurveTo(0, -72, 14, -70, 24, -62); ctx.bezierCurveTo(40, -48, 38, -24, 28, -14); ctx.quadraticCurveTo(0, -6, -28, -14); });
    // Folds, a stitched seam, ribs showing through one side, a rusty hook stuck in it.
    stroke(ctx, 'rgba(42,42,16,0.5)', LW * 1.2, () => { for (const y of [-26, -40, -54]) { ctx.moveTo(-30, y); ctx.quadraticCurveTo(0, y + 6, 30, y - 2); } });
    stitches(ctx, [[-22, -58], [-16, -48], [-18, -38], [-12, -28]], '#2a1a10');
    shape(ctx, '#5a2a2a', () => { ctx.ellipse(20, -40, 6, 8, 0.2, 0, TAU); }, LINE, LW * 0.8);
    stroke(ctx, '#efe6d2', LW * 1.4, () => { for (let k = 0; k < 3; k++) { ctx.moveTo(15, -46 + k * 4.4); ctx.quadraticCurveTo(20, -48 + k * 4.4, 25, -45 + k * 4.4); } });
    stroke(ctx, '#8a5a3a', 1.4, () => { ctx.moveTo(-6, -70); ctx.lineTo(-6, -62); ctx.arc(-3, -62, 3, Math.PI, 0.3, true); });
    const bl = [[-20, -48, 5], [14, -58, 6], [24, -26, 4.5], [-12, -30, 4], [-28, -36, 3.5], [4, -64, 4], [26, -54, 3.5]].slice(0, 4 + m.phase * 1.5);
    bl.forEach(([x, y, r], i) => { const pulse = 1 + 0.12 * Math.sin(t * 4 + i * 1.7) + swell * 0.2; glow(ctx, x, y, r * 2.4, look.trim, 0.45); ell(ctx, x, y, r * pulse, r * pulse * 0.9, rgrad(ctx, x, y, r, '#f4ff9a', '#9aaa2a'), dk2); ell(ctx, x - r * 0.3, y - r * 0.35, r * 0.25, r * 0.2, '#ffffff', null); if (i % 2) { const d = (t * 0.5 + i * 0.3) % 1; ell(ctx, x, y + r + d * 6, 0.8, 1.2, 'rgba(200,255,80,0.8)', null); } });
    for (const [x, y] of [[-6, -46], [8, -34], [-24, -24], [16, -66], [2, -24]]) ell(ctx, x, y, 1.2, 1, dk2, null);
    const open = Math.max(b.hit * 0.8, gas.on && m.stage === 'act' ? 1 - Math.min(1, gas.act * 1.5) : swell * 0.2, rats.on ? 0.6 : 0);
    shape(ctx, '#2a0a10', () => { ctx.ellipse(0, -22, 13, 3 + open * 7, 0, 0, TAU); });
    shape(ctx, '#8a2a3a', () => { ctx.ellipse(0, -20 + open * 4, 7, 1.6 + open * 2, 0, 0, Math.PI); }, null);
    for (let i = -3; i <= 3; i++) shape(ctx, i % 2 ? '#c8c098' : '#e8e0c0', () => { ctx.moveTo(i * 3.4 - 1.3, -24 - open * 3); ctx.lineTo(i * 3.4 + (i % 2) * 0.6, -19.6 - open * 3); ctx.lineTo(i * 3.4 + 1.3, -24 - open * 3); }, LINE, LW * 0.4);
    for (let i = -2; i <= 2; i++) shape(ctx, '#c8c098', () => { ctx.moveTo(i * 4 - 1.1, -20 + open * 7); ctx.lineTo(i * 4, -23 + open * 7); ctx.lineTo(i * 4 + 1.1, -20 + open * 7); }, LINE, LW * 0.4);
    if (open > 0.3) glow(ctx, 0, -20, 14 * open, '#9dff4a', 0.6);
    for (let k = 0; k < 3; k++) { const y = -16 + ((t * 0.7 + k * 0.33) % 1) * 12; ell(ctx, -6 + k * 6, y, 1, 2, 'rgba(200,255,74,0.7)', null); }
    for (let i = 0; i < 5; i++) eye(ctx, -9 + i * 4.5, -36 - Math.abs(i - 2) * 1.5, 1.3 - Math.abs(i - 2) * 0.12, P.eye);
    ctx.restore();
    for (let i = 0; i < 3; i++) { const k = (t * 0.35 + i / 3) % 1; ctx.globalAlpha = 0.35 * (1 - k); ell(ctx, -16 + i * 16 + Math.sin(t + i) * 4, -66 - k * 26, 5 + k * 9, 4 + k * 6, '#9dff4a', null); }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { const a = t * 5 + i * 1.3, x = Math.cos(a) * 30, y = -50 + Math.sin(a * 1.7) * 18; ell(ctx, x, y, 0.9, 0.6, '#1a1a10', null); ell(ctx, x - 0.4, y - 0.8, 0.6, 0.4, 'rgba(220,240,255,0.6)', null); }
  }

  // ------------------------------------------------------------------ 9. The Colossus
  function rune(ctx, x, y, s, col, kind) {
    stroke(ctx, col, LW * 1.1, () => {
      if (kind % 3 === 0) { ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.moveTo(x - s * 0.6, y - s * 0.3); ctx.lineTo(x + s * 0.6, y + s * 0.3); }
      else if (kind % 3 === 1) { ctx.moveTo(x - s * 0.6, y + s); ctx.lineTo(x, y - s); ctx.lineTo(x + s * 0.6, y + s); ctx.moveTo(x - s * 0.3, y + s * 0.2); ctx.lineTo(x + s * 0.3, y + s * 0.2); }
      else { ctx.moveTo(x - s * 0.5, y - s); ctx.lineTo(x + s * 0.5, y); ctx.lineTo(x - s * 0.5, y + s); }
    });
  }
  function colossus(ctx, P, look, A) {
    const g = gait(A, 0.5), b = blow(A.atk), t = A.t, m = A.m;
    const steps = move(A, 'steps'), beam = move(A, 'beam'), quake = move(A, 'slam');
    const stone = P.skin, dk = shade(stone, -0.35), dk2 = shade(stone, -0.5), lt = shade(stone, 0.2), glowC = look.trim;
    const stomp = steps.on ? (m.stage === 'wind' ? steps.wind : 1 - Math.min(1, steps.act * 3)) : 0;
    const charge = beam.on ? (m.stage === 'wind' ? beam.wind : 1 - Math.min(1, beam.act * 2.5)) : 0;
    const runeA = 0.5 + 0.3 * Math.sin(t * 2) + charge * 0.4;
    ctx.save(); ctx.translate(0, g.bob * 1.6);
    const crack = (x1, y1, x2, y2, x3, y3) => { glow(ctx, x2, y2, 4, glowC, 0.3); stroke(ctx, glowC, LW * 1.3, () => { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); }); };
    // Legs: carved pillars with glowing runes, a knee plate, a block of a foot with stone toes.
    for (const sd of [-1, 1]) {
      const lift = (sd > 0 ? stomp * 9 : 0) + Math.max(0, sd * g.s) * 3;
      shape(ctx, vgrad(ctx, -36, 0, lt, dk), () => { ctx.moveTo(sd * 4, -36); ctx.lineTo(sd * 18, -36); ctx.lineTo(sd * 19, -8 - lift); ctx.lineTo(sd * 3, -8 - lift); });
      stroke(ctx, dk2, LW, () => { ctx.moveTo(sd * 4, -28); ctx.lineTo(sd * 18.3, -28); ctx.moveTo(sd * 3.6, -14 - lift * 0.6); ctx.lineTo(sd * 18.8, -14 - lift * 0.6); });
      shape(ctx, vgrad(ctx, -27, -19, lt, stone), () => { ctx.moveTo(sd * 5, -26 - lift * 0.3); ctx.lineTo(sd * 17.4, -26 - lift * 0.3); ctx.lineTo(sd * 15.4, -19 - lift * 0.4); ctx.lineTo(sd * 7, -19 - lift * 0.4); });
      const was = ctx.globalAlpha; ctx.globalAlpha = was * runeA; rune(ctx, sd * 11, -32, 2.2, glowC, sd > 0 ? 1 : 0); rune(ctx, sd * 11, -11 - lift * 0.8, 2, glowC, 2); ctx.globalAlpha = was;
      shape(ctx, dk, () => { ctx.moveTo(sd * 1, -9 - lift); ctx.lineTo(sd * 21, -9 - lift); ctx.lineTo(sd * 23, -lift); ctx.lineTo(sd * -1, -lift); });
      for (let k = 0; k < 3; k++) shape(ctx, lt, () => { const x = sd * (4 + k * 6.6); ctx.rect(x - 2.6, -3.6 - lift, 5.2, 3.8); }, LINE, LW * 0.7);
      crack(sd * 10, -24, sd * 13, -18, sd * 9, -15);
    }
    const qk = quake.on ? (m.stage === 'wind' ? quake.wind : 1 - ease(Math.min(1, quake.act * 3))) : 0;
    const armPos = (sd) => { const up = Math.max(qk, sd > 0 ? b.wind : 0); return { x: sd * lerp(36, 14, up), y: lerp(-32, -112, up) + (sd > 0 ? b.hit * 26 : 0) }; };
    const arm = (sd) => {
      const f = armPos(sd);
      shape(ctx, vgrad(ctx, -80, f.y, lt, dk), () => { ctx.moveTo(sd * 22, -84); ctx.lineTo(sd * 34, -80); ctx.lineTo(f.x + sd * 8, f.y - 6); ctx.lineTo(f.x - sd * 8, f.y - 6); });
      stroke(ctx, dk2, LW, () => { const mx = lerp(sd * 28, f.x, 0.5), my = lerp(-82, f.y - 6, 0.5); ctx.moveTo(mx - 7, my); ctx.lineTo(mx + 7, my); });
      // A fist of stone: knuckle blocks and a thumb.
      shape(ctx, vgrad(ctx, f.y - 10, f.y + 8, lt, stone), () => { ctx.rect(f.x - 9.4, f.y - 9, 18.8, 15); });
      for (let k = 0; k < 4; k++) shape(ctx, lt, () => { ctx.rect(f.x - 9 + k * 4.6, f.y + 2, 4.2, 4.6); }, LINE, LW * 0.6);
      shape(ctx, stone, () => { ctx.rect(f.x - sd * 11.4 - 2.6, f.y - 6, 5, 8); }, LINE, LW * 0.7);
      crack(f.x - 4, f.y - 6, f.x + 1, f.y - 1, f.x - 2, f.y + 1);
    };
    arm(-1);
    // The body: a carved block, a ring of runes about the blazing core, moss and a hanging vine.
    shape(ctx, vgrad(ctx, -108, -30, lt, dk), () => { ctx.moveTo(-22, -32); ctx.lineTo(-28, -92); ctx.lineTo(-16, -104); ctx.lineTo(16, -104); ctx.lineTo(28, -92); ctx.lineTo(22, -32); });
    stroke(ctx, dk2, LW, () => { ctx.moveTo(-26, -86); ctx.lineTo(26, -86); ctx.moveTo(-23, -48); ctx.lineTo(23, -48); ctx.moveTo(-8, -104); ctx.lineTo(-10, -86); ctx.moveTo(8, -104); ctx.lineTo(10, -86); });
    shape(ctx, dk, () => { ctx.moveTo(-26, -42); ctx.lineTo(26, -42); ctx.lineTo(22, -32); ctx.lineTo(-22, -32); });
    for (let k = 0; k < 6; k++) shape(ctx, lt, () => { ctx.rect(-21 + k * 7.2, -41, 5.6, 7.6); }, LINE, LW * 0.5);
    for (const sd of [-1, 1]) { shape(ctx, vgrad(ctx, -98, -78, lt, stone), () => { ctx.ellipse(sd * 28, -86, 11, 9, 0, Math.PI, TAU); ctx.lineTo(sd * 28 + 11, -84); }); stroke(ctx, dk2, LW, () => { ctx.moveTo(sd * 20, -90); ctx.lineTo(sd * 36, -90); }); }
    ctx.fillStyle = 'rgba(74,106,42,0.65)'; ctx.beginPath(); ctx.ellipse(-16, -98, 8, 3.4, 0.3, 0, TAU); ctx.ellipse(18, -54, 6, 2.8, -0.4, 0, TAU); ctx.ellipse(-30, -88, 4, 2.4, 0, 0, TAU); ctx.fill();
    stroke(ctx, '#4a7a2a', LW * 1.4, () => { ctx.moveTo(-18, -96); ctx.quadraticCurveTo(-24, -80, -20, -64 + Math.sin(t) * 1.5); });
    for (const y of [-88, -80, -71]) ell(ctx, -21.6 + (y + 88) * 0.08, y, 1.6, 1, '#6aaa3a', null);
    crack(-18, -86, -12, -78, -16, -70); crack(14, -54, 20, -62, 16, -70);
    if (m.phase >= 2) { crack(-6, -46, -2, -52, -8, -58); crack(24, -88, 18, -82, 22, -74); }
    const coreR = 7 + charge * 3 + Math.sin(t * 4) * 0.6 + m.phase;
    { const was = ctx.globalAlpha; ctx.globalAlpha = was * runeA; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + t * 0.2; rune(ctx, Math.cos(a) * (coreR + 9), -68 + Math.sin(a) * (coreR + 9), 1.6, glowC, i); } ctx.globalAlpha = was; }
    shape(ctx, '#2a2018', () => { for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.lineTo(Math.cos(a) * (coreR + 4), -68 + Math.sin(a) * (coreR + 4)); } });
    glow(ctx, 0, -68, coreR * (3 + charge * 3), glowC, 0.7 + charge * 0.3);
    ell(ctx, 0, -68, coreR, coreR, rgrad(ctx, 0, -68, coreR, '#ffffff', glowC), '#5a3a10');
    // The head: a carved helm with a crest and a burning slit.
    shape(ctx, vgrad(ctx, -126, -104, lt, stone), () => { ctx.moveTo(-10, -104); ctx.lineTo(-11, -118); ctx.lineTo(-5, -125); ctx.lineTo(5, -125); ctx.lineTo(11, -118); ctx.lineTo(10, -104); });
    shape(ctx, dk, () => { ctx.moveTo(-2, -125); ctx.lineTo(0, -132); ctx.lineTo(2, -125); });
    stroke(ctx, dk2, LW, () => { ctx.moveTo(-10, -110); ctx.lineTo(10, -110); ctx.moveTo(0, -110); ctx.lineTo(0, -104); });
    glow(ctx, 0, -114, 10, glowC, 0.7);
    shape(ctx, '#fff2c0', () => { ctx.rect(-7, -115.5, 14, 2.6); }, null);
    arm(1);
    shape(ctx, vgrad(ctx, -98, -78, lt, stone), () => { ctx.ellipse(28, -86, 11, 9, 0, Math.PI, TAU); ctx.lineTo(39, -84); });
    stroke(ctx, dk2, LW, () => { ctx.moveTo(20, -90); ctx.lineTo(36, -90); });
    ctx.restore();
    if (stomp > 0.5) glow(ctx, 12, -2, 16, '#c8b090', 0.3);
  }

  // ------------------------------------------------------------------ 10. Pyraxis the Dragon
  function dragon(ctx, P, look, A) {
    const g = gait(A, 0.7), b = blow(A.atk), t = A.t, m = A.m;
    const br = move(A, 'breath'), tl = move(A, 'tail'), gu = move(A, 'gust');
    const skin = P.skin, dk = shade(skin, -0.38), dk2 = shade(skin, -0.5), lt = shade(skin, 0.22), belly = '#f0b86a', horn = '#f4ead0', sc = 'rgba(60,0,0,0.4)';
    const ang = m.angle != null ? m.angle : Math.PI / 2;
    const look2 = br.on ? Math.cos(ang) : 0;
    const rear = br.on && m.stage === 'wind' ? br.wind : 0;
    const flap = gu.on ? (m.stage === 'wind' ? gu.wind : Math.sin(Math.min(1, gu.act * 2) * Math.PI)) : 0;
    const airy = m.air || 0;
    const wingBeat = Math.sin(t * (airy > 0.05 ? 10 : 1.6)) * (airy > 0.05 ? 0.5 : 0.12) - flap * 0.6 + (m.phase >= 1 ? 0.1 : 0);
    const lash = tl.on ? (m.stage === 'wind' ? -0.8 * tl.wind : lerp(-0.8, 1.4, ease(Math.min(1, tl.act * 2.5)))) : 0;
    // The tail: up the field behind it, spines along it, a spade at the end.
    const tailPts = [];
    for (let i = 0; i <= 12; i++) { const k = i / 12; tailPts.push({ x: Math.sin(t * 1.3 + k * 3) * 4 * k + lash * k * k * 40, y: -22 - k * 34 + lash * lash * k * 6 }); }
    tailPts.forEach((p, i) => { if (i % 2 === 0) { const k = i / 12; shape(ctx, horn, () => { ctx.moveTo(p.x - 1.5, p.y - 5 + k * 2.4); ctx.lineTo(p.x, p.y - 9.4 + k * 3.6); ctx.lineTo(p.x + 1.5, p.y - 5 + k * 2.4); }); } });
    tube(ctx, tailPts, tailPts.map((_, i) => 6.6 - (i / 12) * 4.6), skin, null, sc);
    { const x = lash * 40 + Math.sin(t * 1.3 + 3) * 4, y = -56 + lash * lash * 6; shape(ctx, dk, () => { ctx.moveTo(x - 5.6, y + 2); ctx.lineTo(x, y - 10); ctx.lineTo(x + 5.6, y + 2); ctx.lineTo(x, y - 1); }); stroke(ctx, lt, LW * 0.7, () => { ctx.moveTo(x, y - 8); ctx.lineTo(x, y - 1.6); }); }
    // Wings spread wide: bones, veined membranes (a tear in one), a claw at the wrist.
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(sd * 10, -58); ctx.scale(sd, 1); ctx.rotate(-wingBeat);
      const span = 58;
      shape(ctx, vgrad(ctx, -40, 10, shade(skin, -0.1), shade(P.cloth, 0.1)), () => { ctx.moveTo(0, 0); ctx.lineTo(span * 0.5, -36); ctx.lineTo(span, -22); ctx.quadraticCurveTo(span * 0.85, -8, span * 0.9, 6); ctx.quadraticCurveTo(span * 0.7, -2, span * 0.62, 12); ctx.quadraticCurveTo(span * 0.42, 2, span * 0.32, 16); ctx.quadraticCurveTo(span * 0.2, 6, 0, 10); });
      stroke(ctx, 'rgba(255,160,120,0.28)', LW * 0.6, () => { for (const [x, y] of [[span * 0.75, -12], [span * 0.62, 0], [span * 0.45, 4], [span * 0.3, 6]]) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 6, y + 2, x - 10, y + 6); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2, y + 4, x + 1, y + 8); } });
      if (sd > 0) shape(ctx, 'rgba(20,10,10,0.9)', () => { ctx.moveTo(span * 0.7, -2); ctx.lineTo(span * 0.76, 4); ctx.lineTo(span * 0.72, 6); ctx.lineTo(span * 0.68, 2); }, null);
      stroke(ctx, dk, LW * 2.2, () => { ctx.moveTo(0, 0); ctx.lineTo(span * 0.5, -36); for (const [x, y] of [[span, -22], [span * 0.9, 6], [span * 0.62, 12], [span * 0.32, 16]]) { ctx.moveTo(span * 0.5, -36); ctx.lineTo(x, y); } });
      ell(ctx, span * 0.5, -36, 2, 2, dk, LINE, 0, LW * 0.6);
      shape(ctx, horn, () => { ctx.moveTo(span * 0.5 - 2, -36); ctx.lineTo(span * 0.5 + 1, -43); ctx.lineTo(span * 0.5 + 2.4, -35); });
      ctx.restore();
    }
    ctx.save();
    ctx.translate(0, g.bob * 1.8 - rear * 6);
    // Hind legs: a thick scaled thigh, a spur at the knee, a clawed three-toed foot.
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, sd * g.s) * 4;
      const hip = { x: sd * 12, y: -28 }, knee = { x: sd * 20, y: -15 - lift }, ank = { x: sd * 16 + sd * g.s * 2, y: -5 - lift };
      chain(ctx, [hip, knee, ank], [9, 6.6, 4.4], skin);
      scales(ctx, hip.x - 5, hip.y - 3, hip.x + 5, knee.y - 3, 2.6, sc);
      shape(ctx, horn, () => { ctx.moveTo(knee.x + sd * 4, knee.y - 1); ctx.lineTo(knee.x + sd * 9, knee.y + 1); ctx.lineTo(knee.x + sd * 4.4, knee.y + 3); });
      paw(ctx, ank.x + sd * 0.6, -1 - lift, 6.6, dk, horn, 3);
    }
    shape(ctx, vgrad(ctx, -70, -16, lt, dk), () => { ctx.moveTo(-22, -22); ctx.bezierCurveTo(-30, -38, -26, -60, -12, -66); ctx.quadraticCurveTo(0, -70, 12, -66); ctx.bezierCurveTo(26, -60, 30, -38, 22, -22); ctx.quadraticCurveTo(0, -14, -22, -22); });
    scales(ctx, -22, -60, -11, -26, 3.2, sc); scales(ctx, 11, -60, 22, -26, 3.2, sc);
    for (let r = 0; r < 5; r++) { const y = -28 - r * 7, w = 10 - Math.abs(r - 2) * 1.2; ell(ctx, 0, y, w, 3.6, vgrad(ctx, y - 3.6, y + 3.6, '#ffd890', belly), shade(belly, -0.4)); }
    const heat = rear + (br.on && m.stage === 'act' ? 1 : 0) + (m.phase >= 2 ? 0.25 : 0);
    if (heat > 0.1) glow(ctx, 0, -52, 20 * Math.min(1.4, heat), '#ffb43a', 0.6);
    // Forelegs with scaled bands and a clawed hand (one swipes on its blow).
    const sw = b.wind ? -b.wind : b.hit;
    for (const sd of [-1, 1]) {
      const f = sd > 0 ? { x: 24 + sw * 6, y: -14 - b.wind * 18 + b.hit * 6 } : { x: -24, y: -12 };
      const el2 = { x: sd * 22, y: -34 };
      chain(ctx, [{ x: sd * 16, y: -50 }, el2, f], [6.8, 5.6, 4.4], skin);
      ell(ctx, sd * 15.4, -51, 6.4, 6, vgrad(ctx, -70, -16, lt, dk), null);
      bands(ctx, el2, f, 4.6, sc, [0.3, 0.5, 0.7]);
      paw(ctx, f.x, f.y + 3.4, 5.4, skin, horn, 3);
    }
    // The neck (spines down it) and head, lowered towards you, turning with the breath.
    const nx = look2 * 14, ny = -70 - rear * 10 + (br.on && m.stage === 'act' ? 8 : 0);
    const neckPts = [];
    for (let i = 0; i <= 6; i++) { const k = i / 6; neckPts.push({ x: lerp(0, nx, k), y: lerp(-58, ny, k) }); }
    neckPts.forEach((p, i) => { if (i % 2 === 0 && i < 6) { const k = i / 6; shape(ctx, horn, () => { ctx.moveTo(p.x - 1.6, p.y - 6.4 + k); ctx.lineTo(p.x, p.y - 10.6 + k); ctx.lineTo(p.x + 1.6, p.y - 6.4 + k); }); } });
    tube(ctx, neckPts, neckPts.map((_, i) => 8 - (i / 6) * 1.6), skin, '#f0b86a', sc);
    const hx = nx, hy = ny + 4;
    const jaw = br.on && m.stage === 'act' ? 1 : Math.max(b.hit * 0.7, rear * 0.4);
    for (const sd of [-1, 1]) { shape(ctx, horn, () => { ctx.moveTo(hx + sd * 5, hy - 6); ctx.quadraticCurveTo(hx + sd * 14, hy - 16, hx + sd * 12, hy - 24 - (m.phase >= 1 ? 3 : 0)); ctx.lineTo(hx + sd * 7, hy - 9); }); stroke(ctx, 'rgba(0,0,0,0.3)', LW * 0.6, () => { for (let k = 1; k < 4; k++) { ctx.moveTo(hx + sd * (7 + k * 1.6), hy - 9 - k * 3.4); ctx.lineTo(hx + sd * (9 + k * 1.4), hy - 8 - k * 3.6); } }); shape(ctx, dk, () => { ctx.moveTo(hx + sd * 7, hy - 2); ctx.lineTo(hx + sd * 13, hy - 1 + Math.sin(t * 3) * 0.6); ctx.lineTo(hx + sd * 8, hy + 2); }); }
    shape(ctx, dk, () => { ctx.moveTo(hx - 6, hy + 2); ctx.lineTo(hx - 4, hy + 10 + jaw * 6); ctx.lineTo(hx + 4, hy + 10 + jaw * 6); ctx.lineTo(hx + 6, hy + 2); });
    if (jaw > 0.2) for (let k = -1; k <= 1; k++) shape(ctx, '#ffffff', () => { ctx.moveTo(hx + k * 2.4 - 0.8, hy + 9 + jaw * 6); ctx.lineTo(hx + k * 2.4, hy + 6.6 + jaw * 6); ctx.lineTo(hx + k * 2.4 + 0.8, hy + 9 + jaw * 6); }, null);
    if (jaw > 0.3) { shape(ctx, '#ffcf3a', () => { ctx.moveTo(hx - 4, hy + 4); ctx.lineTo(hx, hy + 8 + jaw * 5); ctx.lineTo(hx + 4, hy + 4); }, null); glow(ctx, hx, hy + 8, 14 * jaw, '#ff7a1a', 0.8); }
    shape(ctx, vgrad(ctx, hy - 10, hy + 6, lt, skin), () => { ctx.moveTo(hx - 8, hy - 6); ctx.quadraticCurveTo(hx, hy - 12, hx + 8, hy - 6); ctx.lineTo(hx + 6, hy + 4); ctx.quadraticCurveTo(hx, hy + 7, hx - 6, hy + 4); });
    scales(ctx, hx - 5, hy - 9, hx + 5, hy - 5, 2.2, sc);
    for (const sd of [-1, 1]) shape(ctx, '#ffffff', () => { ctx.moveTo(hx + sd * 4.6, hy + 3.4); ctx.lineTo(hx + sd * 4, hy + 6.4 + jaw * 2); ctx.lineTo(hx + sd * 3.2, hy + 3.8); }, LINE, LW * 0.5);
    ell(ctx, hx - 2.4, hy + 3, 0.9, 0.7, '#2a0a0a', null); ell(ctx, hx + 2.4, hy + 3, 0.9, 0.7, '#2a0a0a', null);
    eye(ctx, hx - 4.2, hy - 4.5, 1.6, P.eye, 1, 1, true); eye(ctx, hx + 4.2, hy - 4.5, 1.6, P.eye, 1, -1, true);
    if (m.enraged || m.phase >= 2) { steam(ctx, hx - 2.4, hy + 1, t, '#5a4a4a', 2); steam(ctx, hx + 2.4, hy + 1, t + 0.4, '#5a4a4a', 2); }
    ctx.restore();
  }

  // ------------------------------------------------------------------ 11. The Omega Chimera
  /** A lion's leg: a muscled thigh, a tuft of fur at the elbow, a big paw with claws out. */
  function lionLeg(ctx, hip, knee, ank, w, col, dark, light, claws) {
    chain(ctx, [hip, knee, ank], [w, w * 0.76, w * 0.6], col);
    ell(ctx, lerp(hip.x, knee.x, 0.4), lerp(hip.y, knee.y, 0.4), w * 0.55, w * 0.75, 'rgba(255,240,200,0.22)', null);
    stroke(ctx, 'rgba(0,0,0,0.25)', LW * 0.7, () => { for (let k = 1; k < 3; k++) { const x = lerp(knee.x, ank.x, k / 3), y = lerp(knee.y, ank.y, k / 3); ctx.moveTo(x - w * 0.4, y); ctx.lineTo(x - w * 0.15, y + w * 0.3); } });
    paw(ctx, ank.x, ank.y + w * 0.6, w * 0.95, col, '#f4ead0', 4);
    if (claws) for (let k = -1.5; k <= 1.5; k++) shape(ctx, '#ffffff', () => { const x = ank.x + k * w * 0.4; ctx.moveTo(x - w * 0.08, ank.y + w * 0.6); ctx.lineTo(x, ank.y + w * 1.15); ctx.lineTo(x + w * 0.08, ank.y + w * 0.6); }, LINE, LW * 0.4);
  }
  function chimera(ctx, P, look, A) {
    const g = gait(A, 0.85), b = blow(A.atk), t = A.t, m = A.m;
    const roar = move(A, 'roar'), lane = move(A, 'lane'), br = move(A, 'breath'), tl = move(A, 'tail'), pounce = move(A, 'leap');
    const fur = P.skin, dk = shade(fur, -0.35), dk2 = shade(fur, -0.5), lt = shade(fur, 0.22), mane = '#6a3a1a', maneL = '#8a5228', wingC = P.cloth;
    const ph = m.phase || 0;
    // Dragon wings: folded until the last form, then spread; bones and veins.
    const spread = ph >= 2 ? 1 : 0.25;
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(sd * 10, -50); ctx.scale(sd, 1); ctx.rotate(-0.25 - Math.sin(t * 1.8) * 0.1 * spread + (1 - spread) * 0.6);
      const span = 22 + 34 * spread;
      shape(ctx, vgrad(ctx, -30, 10, shade(wingC, 0.25), wingC), () => { ctx.moveTo(0, 0); ctx.lineTo(span * 0.5, -30); ctx.lineTo(span, -16); ctx.quadraticCurveTo(span * 0.8, 0, span * 0.85, 8); ctx.quadraticCurveTo(span * 0.6, 2, span * 0.5, 12); ctx.quadraticCurveTo(span * 0.3, 4, 0, 10); });
      stroke(ctx, 'rgba(255,160,230,0.3)', LW * 0.6, () => { for (const [x, y] of [[span * 0.7, -6], [span * 0.5, 2], [span * 0.3, 4]]) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 4, y + 2, x - 7, y + 5); } });
      stroke(ctx, shade(wingC, -0.4), LW * 1.8, () => { ctx.moveTo(0, 0); ctx.lineTo(span * 0.5, -30); for (const [x, y] of [[span, -16], [span * 0.85, 8], [span * 0.5, 12]]) { ctx.moveTo(span * 0.5, -30); ctx.lineTo(x, y); } });
      shape(ctx, '#f4ead0', () => { ctx.moveTo(span * 0.5 - 1.6, -30); ctx.lineTo(span * 0.5 + 1, -35); ctx.lineTo(span * 0.5 + 2, -29); });
      if (ph >= 2) glow(ctx, span * 0.6, -10, 16, look.trim, 0.3);
      ctx.restore();
    }
    // The serpent tail rising behind: scaled, its head striking for its move.
    const strike = tl.on ? (m.stage === 'wind' ? -tl.wind : ease(Math.min(1, tl.act * 2.5))) : 0;
    let tx = 0, ty = 0;
    const snake = [];
    for (let i = 0; i <= 12; i++) { const k = i / 12; tx = Math.sin(t * 1.4 + k * 3) * 5 * k + 14 * k + strike * k * k * 26; ty = -24 - k * 46 + Math.max(0, strike) * k * k * 34; snake.push({ x: tx, y: ty }); }
    tube(ctx, snake, snake.map((_, i) => 4.6 - (i / 12) * 1.8), '#4aa85a', '#c8e8a0', 'rgba(10,40,20,0.45)');
    ctx.save(); ctx.translate(tx, ty); ctx.rotate(strike > 0 ? 1.4 : -0.6 + Math.sin(t * 2) * 0.2);
    shape(ctx, '#4aa85a', () => { ctx.moveTo(-3, -2); ctx.quadraticCurveTo(4, -5, 8, -1); ctx.lineTo(7, 2); ctx.quadraticCurveTo(2, 4, -3, 3); });
    if (strike > 0.3) { shape(ctx, '#2a5a2a', () => { ctx.moveTo(1, 2); ctx.lineTo(8, 1); ctx.lineTo(6, 5); }); shape(ctx, '#ffffff', () => { ctx.moveTo(5, 1.4); ctx.lineTo(5.6, 3.6); ctx.lineTo(6.2, 1.4); }, null); }
    else if (Math.sin(t * 3) > 0.3) stroke(ctx, '#e83a5a', LW, () => { ctx.moveTo(8, 0); ctx.lineTo(11, 0.2); ctx.lineTo(12, -0.8); ctx.moveTo(11, 0.2); ctx.lineTo(12, 1.2); });
    eye(ctx, 3, -1.5, 0.9, '#ffe04a', 0, 1, true); ctx.restore();
    ctx.save(); ctx.translate(0, g.bob * 2 - (roar.on ? roar.wind * 3 : 0) + pounce.wind * 3);
    // Lion legs: hind pair behind, fore pair in front, muscled, tufted, big clawed paws.
    const claws = b.p >= 0 || pounce.on || roar.on;
    for (const sd of [-1, 1]) { const lift = Math.max(0, Math.sin(g.W * TAU + (sd > 0 ? Math.PI : 0))) * 3.5; lionLeg(ctx, { x: sd * 15, y: -30 }, { x: sd * 20, y: -16 - lift * 0.5 }, { x: sd * 19, y: -6 - lift }, 6.4, dk, dk2, fur, claws); }
    for (const sd of [-1, 1]) { const lift = Math.max(0, Math.sin(g.W * TAU + (sd > 0 ? 0 : Math.PI))) * 3.5; lionLeg(ctx, { x: sd * 9, y: -34 }, { x: sd * 11, y: -16 - lift * 0.5 + pounce.wind * 2 }, { x: sd * 10, y: -6 - lift }, 6.8, fur, dk, lt, claws); }
    // The goat's neck, out of the left shoulder (its head goes on top, below).
    { const fk = lane.on ? (m.stage === 'wind' ? lane.wind : 1 - Math.min(1, lane.act * 2)) : 0; chain(ctx, [{ x: -12, y: -48 }, { x: -17, y: -55 }, { x: -20, y: -58 - fk * 4 }], [5.4, 4.6, 4.2], '#efe8da'); }
    shape(ctx, vgrad(ctx, -60, -18, lt, dk), () => { ctx.moveTo(-24, -22); ctx.bezierCurveTo(-32, -36, -26, -56, -10, -58); ctx.quadraticCurveTo(0, -60, 10, -58); ctx.bezierCurveTo(26, -56, 32, -36, 24, -22); ctx.quadraticCurveTo(0, -16, -24, -22); });
    ell(ctx, 0, -30, 12, 7, 'rgba(255,240,200,0.22)', null);
    stroke(ctx, 'rgba(60,30,10,0.35)', LW, () => { ctx.moveTo(-18, -44); ctx.quadraticCurveTo(-10, -38, -6, -30); ctx.moveTo(18, -44); ctx.quadraticCurveTo(10, -38, 6, -30); for (const y of [-40, -34]) { ctx.moveTo(-20, y); ctx.lineTo(-16, y + 2); ctx.moveTo(20, y); ctx.lineTo(16, y + 2); } });
    // The goat's head on its left shoulder: white, a beard, curled ridged horns, eyes of frost.
    const frostK = lane.on ? (m.stage === 'wind' ? lane.wind : 1 - Math.min(1, lane.act * 2)) : 0;
    const gx = -20, gy = -62 - frostK * 4;
    for (const sd of [-1, 1]) { stroke(ctx, '#c8b890', 2.8, () => { ctx.arc(gx + sd * 4.2, gy - 4.4, 4.2, sd > 0 ? Math.PI * 1.1 : -0.1, sd > 0 ? Math.PI * 2.6 : Math.PI * 1.4 - Math.PI * 2.5, sd < 0); }); stroke(ctx, 'rgba(0,0,0,0.3)', LW * 0.6, () => { for (let k = 0; k < 4; k++) { const a = -1.2 + k * 0.7; ctx.moveTo(gx + sd * 4.2 + Math.cos(a) * 3, gy - 4.4 + Math.sin(a) * 3); ctx.lineTo(gx + sd * 4.2 + Math.cos(a) * 5.4, gy - 4.4 + Math.sin(a) * 5.4); } }); }
    shape(ctx, vgrad(ctx, gy - 8, gy + 9, '#ffffff', '#d8d0c0'), () => { ctx.moveTo(gx - 5, gy - 4); ctx.quadraticCurveTo(gx, gy - 8, gx + 5, gy - 4); ctx.lineTo(gx + 3, gy + 7); ctx.quadraticCurveTo(gx, gy + 9, gx - 3, gy + 7); });
    shape(ctx, '#e8e0d0', () => { ctx.moveTo(gx - 2, gy + 7); ctx.lineTo(gx - 0.6, gy + 14); ctx.lineTo(gx + 0.6, gy + 12); ctx.lineTo(gx + 2, gy + 7); });
    for (const sd of [-1, 1]) shape(ctx, '#e8e0d0', () => { ctx.moveTo(gx + sd * 4.4, gy - 2); ctx.lineTo(gx + sd * 9, gy + 0.6); ctx.lineTo(gx + sd * 4.6, gy + 1.6); });
    ell(ctx, gx - 1, gy + 5.4, 0.6, 0.5, '#5a4a3a', null); ell(ctx, gx + 1, gy + 5.4, 0.6, 0.5, '#5a4a3a', null);
    eye(ctx, gx - 2, gy - 1, 1, ph >= 1 ? '#7ae8ff' : '#c8d8e8', 0, 1, true); eye(ctx, gx + 2, gy - 1, 1, ph >= 1 ? '#7ae8ff' : '#c8d8e8', 0, -1, true);
    if (frostK > 0.1) { glow(ctx, gx, gy, 20 * frostK, '#9ae8ff', 0.7); for (let i = 0; i < 5; i++) { const a = t * 4 + i * 1.25; ell(ctx, gx + Math.cos(a) * 10 * frostK, gy + Math.sin(a) * 8 * frostK, 1, 1, '#ffffff', null); } }
    // The lion's head in front: a layered mane that flares as it roars, a muzzle, whiskers and fangs.
    const roarK = roar.on ? (m.stage === 'wind' ? roar.wind : 1 - Math.min(1, roar.act * 2)) : 0;
    const fireK = br.on ? (m.stage === 'wind' ? br.wind : 1) : 0;
    const look2 = br.on ? Math.cos(m.angle != null ? m.angle : Math.PI / 2) * 10 : 0;
    const lx = 4 + look2, ly = -58 - pounce.wind * 4;
    const maneR = 17 + roarK * 4;
    shape(ctx, mane, () => { for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU, r = i % 2 ? maneR : maneR * 0.76; ctx.lineTo(lx + Math.cos(a) * r, ly + Math.sin(a) * r * 0.95); } });
    shape(ctx, maneL, () => { for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + 0.2, r = i % 2 ? maneR * 0.82 : maneR * 0.62; ctx.lineTo(lx + Math.cos(a) * r, ly + Math.sin(a) * r * 0.95); } }, null);
    stroke(ctx, 'rgba(40,20,5,0.4)', LW * 0.7, () => { for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.moveTo(lx + Math.cos(a) * maneR * 0.6, ly + Math.sin(a) * maneR * 0.58); ctx.lineTo(lx + Math.cos(a) * maneR * 0.9, ly + Math.sin(a) * maneR * 0.86); } });
    ell(ctx, lx, ly + 1, 10, 10.5, vgrad(ctx, ly - 10, ly + 11, lt, fur));
    for (const sd of [-1, 1]) ell(ctx, lx + sd * 8.4, ly - 7.4, 2.6, 2.4, fur);
    ell(ctx, lx, ly + 5.4, 5.6, 4.2, '#f4e0c0', null);
    const open = Math.max(roarK, fireK, b.hit);
    shape(ctx, '#3a1a10', () => { ctx.ellipse(lx, ly + 7, 4.4, 1.2 + open * 4, 0, 0, TAU); });
    if (open > 0.2) for (const sd of [-1, 1]) { shape(ctx, '#ffffff', () => { ctx.moveTo(lx + sd * 2.8, ly + 6); ctx.lineTo(lx + sd * 2.2, ly + 6 + open * 3.4); ctx.lineTo(lx + sd * 1.6, ly + 6); }, LINE, LW * 0.4); shape(ctx, '#ffffff', () => { ctx.moveTo(lx + sd * 2.6, ly + 8 + open * 4); ctx.lineTo(lx + sd * 2, ly + 8 + open * 1.6); ctx.lineTo(lx + sd * 1.4, ly + 8 + open * 4); }, LINE, LW * 0.4); }
    if (fireK > 0.2) glow(ctx, lx, ly + 8, 16 * fireK, '#ff7a1a', 0.8);
    shape(ctx, '#3a1a10', () => { ctx.moveTo(lx - 2.4, ly + 2); ctx.lineTo(lx + 2.4, ly + 2); ctx.lineTo(lx, ly + 4.2); });
    ctx.fillStyle = '#5a3a1a'; for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(lx + sd * (2.6 + (k % 2) * 1.4), ly + 4.8 + k * 0.9, 0.35, 0, TAU); ctx.fill(); }
    stroke(ctx, 'rgba(255,255,255,0.7)', LW * 0.5, () => { for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { ctx.moveTo(lx + sd * 3.4, ly + 5 + k); ctx.lineTo(lx + sd * 9, ly + 4 + k * 2.4); } });
    eye(ctx, lx - 3.6, ly - 2.4, 1.5, P.eye, 1, 1); eye(ctx, lx + 3.6, ly - 2.4, 1.5, P.eye, 1, -1);
    if (roarK > 0.2) for (let k = 1; k <= 3; k++) { const was = ctx.globalAlpha; ctx.globalAlpha = was * roarK * (0.6 - k * 0.15); stroke(ctx, '#ffe8a0', LW * 1.5, () => { ctx.arc(lx, ly + 6, 6 + k * 6 * roarK, 0.3, Math.PI - 0.3); }); ctx.globalAlpha = was; }
    ctx.restore();
    if (m.enraged) glow(ctx, 0, -40, 44, '#ff3a6a', 0.25);
  }

  // ------------------------------------------------------------------ drawing one
  const ARTS = { goblin, hulk, hive, frost, serpent, witch, twinsol, twinluna, rot, colossus, dragon, chimera };
  /** Each giant drawn to about 80 tall before its size: the tallest ones a little smaller. */
  const FIT = { hulk: 0.9, frost: 0.85, colossus: 0.72, dragon: 0.85, witch: 0.95, twinsol: 0.9, twinluna: 0.9 };
  const SHADOW = { goblin: 9 };
  /** One of World 7's: its shadow, lifted while in the air, its body, a flash when hit. */
  function draw(ctx, P, look, pose) {
    const m = pose.mut || {};
    const size = look.size || 4;
    const small = look.art === 'goblin' || look.art === 'egg';
    LW = small ? 0.95 : 2.4 / Math.max(1, size); LINE = P.line;
    const A = { t: pose.t, walk: pose.walkRaw != null ? pose.walkRaw : pose.walk, atk: pose.atk, heavy: pose.heavy, m, size, seed: pose.seed || 0 };
    const air = m.air || 0;
    const k = FIT[look.art] || 1;
    const sw = SHADOW[look.art] || 24;
    ell(ctx, 0, 0, sw * (1 - air * 0.4), sw * 0.23 * (1 - air * 0.4), `rgba(0,0,0,${0.32 * (1 - air * 0.5)})`, null);
    if (m.enraged) glow(ctx, 0, -40 * k, 52 * k, '#ff2a2a', 0.22 + 0.08 * Math.sin(pose.t * 6));
    ctx.save();
    ctx.translate(0, -air * 55);
    if (pose.hurt > 0) ctx.translate(Math.sin(pose.t * 90) * 0.9 * pose.hurt, 0);
    if (pose.capture && small) ctx.translate(0, -Math.abs(Math.sin(pose.t * 9)) * 3);
    ctx.scale(k, k);
    A.size = size * k;
    (ARTS[look.art] || hulk)(ctx, P, look, A);
    ctx.restore();
    if (pose.hurt > 0) { const op = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, (-40 - air * 55) * k * (small ? 0.45 : 1), 44 * k * (small ? 0.5 : 1), '#ffffff', 0.22 * Math.min(1, pose.hurt)); ctx.globalCompositeOperation = op; }
  }

  // The drawing tools, shared with comet_art.js (the comet's beasts are drawn the same way).
  const H = { shape, ell, stroke, vgrad, rgrad, limb, chain, tube, glow, eye, foot, paw, leg, gait, blow, scales, stitches, bands, fist, steam, shade, rgba, lerp, ease, clamp, HI, LO, setLine: (w, line) => { LW = w; LINE = line; }, get LW() { return LW; } };
  return { draw, ARTS, H, FIT, SHADOW };
})();
