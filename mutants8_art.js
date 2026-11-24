/**
 * Merge Beasts 1.5: World 8's giants, drawn (mutants8.js has their numbers and moves).
 *
 * The same way as World 7's (mutants_art.js, whose drawing tools these use): from shapes, facing
 * down the field towards your coin pile, feet at (0, 0), about 80 to 110 units tall before their
 * size; every limb, neck, tail and tentacle one joined shape (outlines first, then fills); legs
 * jointed with knees, feet, toes and claws; posed every frame by walking, their blows and each of
 * their moves as it winds up and lands (pose.mut from MUTANTS.pose: the move, its stage and
 * progress, the phase, raging, sinking, orbs, a hardened shell, an egg's age).
 */
(() => {
  if (typeof MUTANT_ART === 'undefined') return;
  const H = MUTANT_ART.H;
  const { shape, ell, stroke, vgrad, rgrad, limb, chain, tube, glow, eye, paw, foot, gait, blow, scales, stitches, bands, steam, shade, rgba, lerp, ease, clamp, HI, LO } = H;
  const TAU = Math.PI * 2;
  const lw = () => H.LW;
  /** A move under way: { on, wind (0 to 1), act (its progress after landing), k }. */
  const mv = (A, kind) => { const m = A.m; if (m.move !== kind) return { on: false, wind: 0, act: 0, k: 0 }; return { on: true, wind: m.stage === 'wind' ? ease(m.k) : 1, act: m.stage === 'act' ? m.k : 0, k: m.k }; };
  /** A wind-up that peaks and lets go: rising through the wind-up, falling away after. */
  const surge = (x) => (x.on ? (x.act ? 1 - Math.min(1, x.act * 2.5) : x.wind) : 0);
  /** A jointed leg of three parts (thigh, shin, foot) as one shape, a plate on the thigh, a claw. */
  function bugLeg(ctx, pts, w, col, plate, claw) {
    chain(ctx, pts, pts.map((_, i) => w * (1 - (i / (pts.length - 1)) * 0.65)), col);
    for (let i = 1; i < pts.length - 1; i++) ell(ctx, pts[i].x, pts[i].y, w * 0.62, w * 0.55, plate, undefined, 0, lw() * 0.7);
    const a = pts[pts.length - 2], b = pts[pts.length - 1], ang = Math.atan2(b.y - a.y, b.x - a.x);
    shape(ctx, claw, () => { ctx.moveTo(b.x + Math.cos(ang + 1.4) * w * 0.3, b.y + Math.sin(ang + 1.4) * w * 0.3); ctx.quadraticCurveTo(b.x + Math.cos(ang) * w * 1.4, b.y + Math.sin(ang) * w * 1.4, b.x + Math.cos(ang - 0.4) * w * 1.6, b.y + Math.sin(ang - 0.4) * w * 1.6); ctx.lineTo(b.x + Math.cos(ang - 1.4) * w * 0.3, b.y + Math.sin(ang - 1.4) * w * 0.3); }, undefined, lw() * 0.6);
  }
  /** A drip of acid or lava hanging and falling. */
  function drips(ctx, x, y, w, col, t, n = 3) {
    for (let i = 0; i < n; i++) {
      const k = (t * 0.7 + i / n) % 1, dx = x + (i - (n - 1) / 2) * w;
      ctx.globalAlpha = 0.9 * (1 - k);
      ell(ctx, dx, y + k * 14, 1.1 + (1 - k) * 0.6, 1.6 + k * 1.2, col, null);
    }
    ctx.globalAlpha = 1;
  }
  /** Teeth round a ring (a maw seen from the front), pointing in. */
  function toothRing(ctx, x, y, r, n, len, col, rot = 0) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rot, c = Math.cos(a), s = Math.sin(a), q = 0.5 * (TAU / n);
      shape(ctx, col, () => { ctx.moveTo(x + Math.cos(a - q) * r, y + Math.sin(a - q) * r * 0.9); ctx.lineTo(x + c * (r - len), y + s * (r - len) * 0.9); ctx.lineTo(x + Math.cos(a + q) * r, y + Math.sin(a + q) * r * 0.9); }, undefined, lw() * 0.5);
    }
  }

  // ------------------------------------------------------------------ 1. Gravemaw the Abyssal Worm
  function worm(ctx, P, look, A) {
    const t = A.t, m = A.m, g = gait(A, 0.6), b = blow(A.atk);
    const bur = mv(A, 'burrow'), spk = mv(A, 'spikes'), spit = mv(A, 'meteor');
    const skin = P.skin, dk = shade(skin, -0.4), lt = shade(skin, 0.25), plate = shade(P.cloth, 0.15), acid = look.trim;
    const sink = (m.sink || 0) * 110;
    const rear = surge(spk) * 8 + surge(spit) * 5;
    // It rises out of a hole in the ground (and sinks back into it): everything below the ground is hidden.
    ell(ctx, 0, 3, 40, 13, '#1e120c', null);
    ctx.save();
    ctx.beginPath(); ctx.rect(-400, -600, 800, 610); ctx.clip();
    ctx.translate(0, sink);
    // The tail, coiling away up the field behind it, plated, with a barbed tip.
    const tail = [];
    for (let i = 0; i <= 14; i++) { const k = i / 14; tail.push({ x: Math.sin(t * 1.1 + k * 4) * 10 * k + Math.sin(k * 3) * 26, y: -6 - k * 52 + Math.cos(t * 1.1 + k * 3) * 3 * k }); }
    tube(ctx, tail, tail.map((_, i) => 12 - (i / 14) * 8), dk, shade(skin, 0.1), 'rgba(0,0,0,0.25)');
    tail.forEach((p, i) => { if (i % 2 === 0 && i < 13) { const r = 12 - (i / 14) * 8; shape(ctx, plate, () => { ctx.ellipse(p.x, p.y - r * 0.35, r * 0.95, r * 0.55, 0, Math.PI, TAU); }, undefined, lw() * 0.7); } });
    { const p = tail[14]; shape(ctx, '#e8dcc0', () => { ctx.moveTo(p.x - 4, p.y + 2); ctx.lineTo(p.x, p.y - 10); ctx.lineTo(p.x + 4, p.y + 2); }); }
    // The upright front: from the ground up to the maw, swaying, plated rings down it.
    const sway = Math.sin(t * 0.9) * 6 + (b.hit ? b.hit * 4 : 0);
    const body = [];
    for (let i = 0; i <= 10; i++) { const k = i / 10; body.push({ x: Math.sin(k * 2.2 + t * 0.9) * 6 * k + sway * k * k, y: -k * (92 + rear) + Math.sin(k * 3.1) * 4 }); }
    const rad = body.map((_, i) => 21 - (i / 10) * 5 + (i > 8 ? 3 : 0));
    // The clawed legs down its belly, both sides, rippling as it moves (drawn behind the body).
    for (let i = 1; i < 8; i++) {
      const p = body[i], r = rad[i];
      for (const sd of [-1, 1]) {
        const ph = t * 4 + i * 0.9 + (sd > 0 ? Math.PI : 0);
        const reach = 1 + 0.25 * Math.sin(ph);
        const hip = { x: p.x + sd * r * 0.8, y: p.y + 2 }, knee = { x: p.x + sd * (r + 10 * reach), y: p.y - 4 + Math.cos(ph) * 2 }, toe = { x: p.x + sd * (r + 13 * reach), y: p.y + 8 + Math.sin(ph) * 2 };
        bugLeg(ctx, [hip, knee, toe], 2.6, dk, shade(P.cloth, 0.05), '#e8dcc0');
      }
    }
    tube(ctx, body, rad, skin, lt, null);
    for (let i = 1; i < 10; i++) { const p = body[i], r = rad[i]; shape(ctx, vgrad(ctx, p.y - r, p.y + r * 0.3, shade(plate, 0.2), plate), () => { ctx.ellipse(p.x, p.y - r * 0.2, r * 1.02, r * 0.5, 0, Math.PI * 1.02, TAU * 0.99); ctx.ellipse(p.x, p.y - r * 0.2, r * 0.78, r * 0.3, 0, TAU * 0.99, Math.PI * 1.02, true); }, undefined, lw() * 0.7); if (i % 2) for (const sd of [-1, 1]) shape(ctx, '#e8dcc0', () => { ctx.moveTo(p.x + sd * r * 0.75, p.y - r * 0.55); ctx.lineTo(p.x + sd * r * 1.05, p.y - r * 1.0); ctx.lineTo(p.x + sd * r * 0.95, p.y - r * 0.45); }, undefined, lw() * 0.5); }
    // The maw, facing you: a lip ring, three rings of teeth turning, acid in the throat, eyes round it.
    const hd = body[10], open = 0.75 + 0.15 * Math.sin(t * 2.2) + surge(spit) * 0.25 + b.hit * 0.2;
    const R = 23 + rear * 0.6;
    ell(ctx, hd.x, hd.y, R + 4, (R + 4) * 0.92, vgrad(ctx, hd.y - R, hd.y + R, lt, dk));
    for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; ell(ctx, hd.x + Math.cos(a) * (R + 1), hd.y + Math.sin(a) * (R + 1) * 0.92, 4.2, 3.4, plate, undefined, a, lw() * 0.6); }
    ell(ctx, hd.x, hd.y, R * open, R * open * 0.9, '#2a0a14');
    glow(ctx, hd.x, hd.y, R * open * 1.2, acid, 0.45 + surge(spit) * 0.4);
    ell(ctx, hd.x, hd.y, R * open * 0.35, R * open * 0.3, rgrad(ctx, hd.x, hd.y, R * 0.35, '#ffffc0', acid), null);
    toothRing(ctx, hd.x, hd.y, R * open, 16, 7, '#f4ead0', t * 0.3);
    toothRing(ctx, hd.x, hd.y, R * open * 0.72, 12, 5.5, '#e8dcc0', -t * 0.5);
    toothRing(ctx, hd.x, hd.y, R * open * 0.5, 9, 4, '#d8ccb0', t * 0.8);
    for (let k = 0; k < 8; k++) { const a = -Math.PI * 0.95 + (k / 7) * Math.PI * 0.9; eye(ctx, hd.x + Math.cos(a) * (R + 9), hd.y + Math.sin(a) * (R + 9) * 0.9, k % 3 === 0 ? 1.8 : 1.2, P.eye, 0, 1, true); }
    drips(ctx, hd.x, hd.y + R * open * 0.8, 5, acid, t, 3);
    if (m.phase >= 1) for (let i = 0; i < 3; i++) glow(ctx, body[3 + i * 2].x, body[3 + i * 2].y, 9, acid, 0.35);
    ctx.restore();
    // The crater's front lip: churned earth and broken rock heaped where it broke through.
    shape(ctx, vgrad(ctx, 0, 22, '#7a5a3e', '#3a2618'), () => { ctx.ellipse(0, 4, 44, 17, 0, 0, Math.PI); ctx.ellipse(0, 4, 31, 6, 0, Math.PI, 0, true); });
    for (let i = 0; i < 10; i++) { const a = 0.12 + (i / 9) * (Math.PI - 0.24); ell(ctx, Math.cos(a) * 37, 6 + Math.sin(a) * 12, 5.2 - (i % 3), 3.8 - (i % 3) * 0.6, i % 2 ? '#8a6a4a' : '#6a4e34'); }
    if (sink > 1) for (let i = 0; i < 4; i++) { const k = (t * 1.5 + i / 4) % 1; ctx.globalAlpha = 0.5 * (1 - k); ell(ctx, (i - 1.5) * 18, -k * 26, 6 + k * 8, 4 + k * 5, '#8a6a48', null); ctx.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ 2. Vex, the Iron Brood Queen
  function spider(ctx, P, look, A) {
    const t = A.t, m = A.m, g = gait(A, 0.9), b = blow(A.atk);
    const sw = mv(A, 'sweep'), eg = mv(A, 'eggs'), mortar = mv(A, 'meteor');
    const iron = P.skin, dk = shade(iron, -0.45), lt = shade(iron, 0.3), flesh = '#7a3a4a', red = look.trim;
    const gun = mortar.on && (m.k >= 0) ? surge(mortar) : 0;
    ctx.save(); ctx.translate(0, -10 + g.bob * 1.2 - surge(eg) * 3);
    // The abdomen behind: iron plates over a glowing egg sac, two mortar barrels on top.
    const ay = -66;
    ell(ctx, 0, ay, 36, 27, vgrad(ctx, ay - 27, ay + 27, shade(iron, 0.1), dk));
    for (let r = 0; r < 4; r++) shape(ctx, vgrad(ctx, ay - 26 + r * 9, ay - 16 + r * 9, lt, iron), () => { ctx.ellipse(0, ay - 20 + r * 10, 30 - Math.abs(r - 1.5) * 5, 7, 0, Math.PI, TAU); }, undefined, lw() * 0.7);
    for (let k = 0; k < 7; k++) { const a = -Math.PI * 0.9 + (k / 6) * Math.PI * 0.8; ell(ctx, Math.cos(a) * 30, ay + Math.sin(a) * 22, 1.6, 1.6, '#d8d0c0', undefined, 0, lw() * 0.5); }
    const sac = 0.55 + 0.25 * Math.sin(t * 3) + surge(eg) * 0.5;
    glow(ctx, 0, ay + 12, 26, red, sac * 0.6);
    ell(ctx, 0, ay + 12, 16, 10, rgrad(ctx, 0, ay + 12, 16, '#ffb0a0', flesh));
    for (let k = 0; k < 5; k++) ell(ctx, -9 + k * 4.5, ay + 12 + Math.sin(k * 2) * 2, 2.4, 2.8, rgba('#ffd0c0', 0.5 + sac * 0.3), null);
    for (const sd of [-1, 1]) {
      const rec = gun * 5;
      ctx.save(); ctx.translate(sd * 15, ay - 22); ctx.rotate(sd * 0.25);
      shape(ctx, vgrad(ctx, -18, 0, lt, dk), () => { ctx.rect(-4.5, -16 + rec, 9, 18); }, undefined, lw() * 0.7);
      shape(ctx, dk, () => { ctx.rect(-5.5, -18 + rec, 11, 4); }, undefined, lw() * 0.6);
      ell(ctx, 0, -18 + rec, 3.4, 1.4, '#120808', null);
      if (gun > 0.6) glow(ctx, 0, -20, 10, '#ffb43a', gun);
      ctx.restore();
    }
    // Eight legs, iron over muscle, high-kneed, spread wide: the back four first.
    const legs = [[-1, 0], [1, 0], [-1, 1], [1, 1], [-1, 2], [1, 2], [-1, 3], [1, 3]];
    const legDraw = (sd, i) => {
      const ph = g.W * TAU + i * 1.6 + (sd > 0 ? Math.PI : 0), lift = Math.max(0, Math.sin(ph)) * 6;
      const spread = [0.9, 1.0, 1.0, 0.85][i], baseY = -34 + i * 5;
      const hip = { x: sd * (12 + i * 2), y: baseY }, knee = { x: sd * (36 + 10 * spread + i * 3), y: baseY - 34 - i * 2 - lift }, ank = { x: sd * (54 + 12 * spread + i * 2), y: -16 + i * 3 - lift * 0.6 }, toe = { x: sd * (58 + 12 * spread + i * 2), y: -1 + i * 1.5 };
      chain(ctx, [hip, knee], [5.2, 4.2], flesh);
      bugLeg(ctx, [hip, knee, ank, toe], 4.4, iron, lt, '#d8d0c0');
      stroke(ctx, dk, lw() * 0.8, () => { for (const q of [0.3, 0.55]) { const x = lerp(knee.x, ank.x, q), y = lerp(knee.y, ank.y, q); ctx.moveTo(x - 3, y - 1); ctx.lineTo(x + 3, y + 1); } });
      ell(ctx, knee.x, knee.y, 2, 2, red, undefined, 0, lw() * 0.4);
    };
    for (const [sd, i] of legs) if (i >= 2) legDraw(sd, i);
    // The head and thorax: a plated dome, a crown of eyes (two great ones), fangs and palps.
    shape(ctx, vgrad(ctx, -58, -16, lt, dk), () => { ctx.moveTo(-22, -24); ctx.bezierCurveTo(-28, -40, -20, -56, 0, -58); ctx.bezierCurveTo(20, -56, 28, -40, 22, -24); ctx.quadraticCurveTo(0, -12, -22, -24); });
    stroke(ctx, dk, lw(), () => { ctx.moveTo(-18, -44); ctx.quadraticCurveTo(0, -52, 18, -44); ctx.moveTo(-20, -34); ctx.quadraticCurveTo(0, -40, 20, -34); });
    for (const [sd, i] of legs) if (i < 2) legDraw(sd, i);
    const eyeGlow = 0.6 + surge(sw) * 0.8;
    glow(ctx, 0, -42, 22 * eyeGlow, red, 0.5);
    for (const sd of [-1, 1]) { eye(ctx, sd * 6, -42, 4, P.eye, 1, -sd); eye(ctx, sd * 13, -46, 2.2, P.eye, 0); eye(ctx, sd * 4, -50, 1.8, P.eye, 0); eye(ctx, sd * 15, -38, 1.6, P.eye, 0); }
    const bite = b.hit * 0.6;
    for (const sd of [-1, 1]) {
      chain(ctx, [{ x: sd * 6, y: -28 }, { x: sd * 9, y: -20 }, { x: sd * (5 - bite * 2), y: -12 }], [3.6, 2.8, 1.6], dk);
      shape(ctx, '#e8dcc0', () => { ctx.moveTo(sd * (5 - bite * 2) - 1.2, -13); ctx.quadraticCurveTo(sd * (2 - bite * 3), -7, sd * (1 - bite), -9); ctx.lineTo(sd * (5 - bite * 2) + 1.2, -13); }, undefined, lw() * 0.5);
      chain(ctx, [{ x: sd * 14, y: -28 }, { x: sd * 20, y: -22 + Math.sin(t * 3 + sd) * 2 }, { x: sd * 17, y: -14 }], [2.2, 1.8, 1.4], iron);
    }
    if (sw.on && m.stage === 'act') glow(ctx, 0, -44, 30, red, 0.9);
    ctx.restore();
  }

  // ------------------------------------------------------------------ 3. Nyxara the Eclipse Moth
  function moth(ctx, P, look, A) {
    const t = A.t, m = A.m, b = blow(A.atk);
    const sc = mv(A, 'scream'), dust = mv(A, 'meteor'), dr = mv(A, 'drain'), gu = mv(A, 'gust');
    const fur = P.skin, dk = shade(fur, -0.45), lt = shade(fur, 0.3), wingC = P.cloth, gold = look.trim, pink = P.eye;
    const hover = -38 + Math.sin(t * 2) * 3;
    const flap = Math.sin(t * 5) * 0.18 - surge(gu) * 0.5 + surge(sc) * 0.25;
    ell(ctx, 0, 0, 30, 6, 'rgba(0,0,0,0.25)', null);
    ctx.save(); ctx.translate(0, hover);
    // Four wings: the hind pair with long tails, the fore pair huge with staring eyespots.
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(sd * 6, -14); ctx.scale(sd, 1); ctx.rotate(-flap * 0.7);
      shape(ctx, vgrad(ctx, -10, 50, shade(wingC, 0.15), shade(wingC, -0.2)), () => { ctx.moveTo(0, 0); ctx.bezierCurveTo(26, 4, 44, 18, 40, 34); ctx.quadraticCurveTo(36, 48, 30, 60); ctx.quadraticCurveTo(24, 46, 14, 40); ctx.quadraticCurveTo(4, 30, 0, 12); });
      stroke(ctx, rgba(gold, 0.6), lw() * 0.8, () => { ctx.moveTo(4, 8); ctx.quadraticCurveTo(24, 18, 34, 34); ctx.moveTo(4, 14); ctx.quadraticCurveTo(16, 28, 22, 44); });
      ell(ctx, 28, 30, 6, 5, gold, undefined, 0.3, lw() * 0.6); ell(ctx, 28, 30, 3, 2.6, '#1a0a1a', null);
      ctx.restore();
      ctx.save(); ctx.translate(sd * 6, -24); ctx.scale(sd, 1); ctx.rotate(-flap);
      shape(ctx, vgrad(ctx, -60, 20, shade(wingC, 0.3), shade(wingC, -0.1)), () => { ctx.moveTo(0, 0); ctx.bezierCurveTo(14, -34, 52, -58, 78, -46); ctx.quadraticCurveTo(86, -30, 76, -14); ctx.quadraticCurveTo(66, 0, 48, 6); ctx.quadraticCurveTo(26, 12, 0, 8); });
      shape(ctx, rgba(dk, 0.5), () => { ctx.moveTo(56, -44); ctx.quadraticCurveTo(80, -46, 80, -30); ctx.quadraticCurveTo(70, -36, 56, -44); }, null);
      stroke(ctx, rgba(gold, 0.55), lw() * 0.8, () => { for (const [x, y] of [[70, -40], [72, -20], [52, -4], [30, 4]]) { ctx.moveTo(4, 2); ctx.quadraticCurveTo(x * 0.5, y * 0.6 - 6, x, y); } });
      // The eyespot: rings of gold and black, a pupil that seems to follow you, a glint.
      const ex = 44, ey = -24, stare = 0.5 + 0.5 * Math.sin(t * 1.3) + surge(sc);
      ell(ctx, ex, ey, 14, 12, gold, undefined, -0.3); ell(ctx, ex, ey, 10.5, 9, '#1a0a1a', null, -0.3); ell(ctx, ex, ey, 7.5, 6.5, pink, null, -0.3);
      ell(ctx, ex + Math.sin(t) * 1.4, ey, 3.6, 4.4, '#0a0408', null); ell(ctx, ex - 2, ey - 2.6, 1.6, 1.2, '#ffffff', null);
      glow(ctx, ex, ey, 18 * stare, pink, 0.25 * stare);
      for (let k = 0; k < 6; k++) ell(ctx, 18 + k * 9, -6 - Math.sin(k) * 4, 1.8, 1.4, rgba('#ffffff', 0.3), null);
      ctx.restore();
    }
    // Six thin legs hanging under it, jointed, with hooked feet, swinging as it hovers.
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
      const sw2 = Math.sin(t * 2 + i + sd) * 3;
      const hip = { x: sd * (4 + i), y: -18 + i * 6 }, knee = { x: sd * (12 + i * 3) + sw2, y: -8 + i * 7 }, ank = { x: sd * (10 + i * 4) + sw2 * 1.4, y: 6 + i * 6 };
      chain(ctx, [hip, knee, ank], [1.8, 1.4, 1], dk);
      stroke(ctx, dk, lw() * 0.7, () => { ctx.moveTo(ank.x, ank.y); ctx.quadraticCurveTo(ank.x + sd * 3, ank.y + 3, ank.x + sd * 1, ank.y + 5); });
      for (let k = 1; k < 4; k++) stroke(ctx, rgba(lt, 0.6), lw() * 0.5, () => { const x = lerp(hip.x, knee.x, k / 4), y = lerp(hip.y, knee.y, k / 4); ctx.moveTo(x, y); ctx.lineTo(x + sd * 2, y + 1.5); });
    }
    // The furry body: a thorax with a ruff, a banded abdomen, the head with great eyes and plumes.
    const ab = [];
    for (let i = 0; i <= 6; i++) ab.push({ x: Math.sin(t * 2 + i * 0.5) * 1.2, y: -16 + i * 5.2 });
    tube(ctx, ab, ab.map((_, i) => 9 - Math.abs(i - 2) * 1.1), shade(fur, -0.15), null, null);
    for (let i = 1; i < 6; i++) stroke(ctx, rgba(gold, 0.55), lw() * 1.2, () => { ctx.ellipse(ab[i].x, ab[i].y, 7.6 - Math.abs(i - 2), 2, 0, 0.2, Math.PI - 0.2); });
    ell(ctx, 0, -24, 13, 12, vgrad(ctx, -36, -12, lt, fur));
    for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; stroke(ctx, lt, lw() * 1.4, () => { ctx.moveTo(Math.cos(a) * 9, -24 + Math.sin(a) * 9); ctx.lineTo(Math.cos(a) * 15, -24 + Math.sin(a) * 14); }); }
    const hy = -38 - surge(sc) * 2;
    ell(ctx, 0, hy, 9, 8, fur);
    for (const sd of [-1, 1]) {
      const plume = [];
      for (let i = 0; i <= 6; i++) { const k = i / 6; plume.push({ x: sd * (3 + k * 16 + Math.sin(t * 2 + k) * 1.5), y: hy - 6 - k * 18 + k * k * 8 }); }
      chain(ctx, plume, plume.map(() => 0.9), dk, { light: false });
      plume.forEach((p, i) => { if (i) stroke(ctx, rgba(gold, 0.8), lw() * 0.6, () => { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + sd * 3, p.y - 4); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - sd * 1.5, p.y - 4.5); }); });
      ell(ctx, sd * 6, hy + 1, 4.6, 5.2, rgrad(ctx, sd * 6, hy + 1, 5, shade(pink, 0.4), shade(pink, -0.4)));
      for (let k = 0; k < 4; k++) ell(ctx, sd * (5 + (k % 2) * 2), hy - 1 + Math.floor(k / 2) * 3, 0.7, 0.7, rgba('#ffffff', 0.45), null);
    }
    const mouth = surge(sc);
    if (mouth > 0.05) { ell(ctx, 0, hy + 6, 2.6 * mouth + 0.5, 3.4 * mouth, '#1a0a14', null); for (let k = 1; k <= 3; k++) { ctx.globalAlpha = mouth * (0.7 - k * 0.18); stroke(ctx, '#ff8ad8', lw() * 1.6, () => { ctx.arc(0, hy + 6, 6 + k * 7 * mouth, 0.4, Math.PI - 0.4); }); ctx.globalAlpha = 1; } }
    stroke(ctx, dk, lw() * 0.9, () => { ctx.moveTo(-1.5, hy + 5); ctx.quadraticCurveTo(-3, hy + 10, -1, hy + 13); ctx.moveTo(1.5, hy + 5); ctx.quadraticCurveTo(3, hy + 10, 1, hy + 13); });
    if (dust.on || m.phase >= 1) for (let i = 0; i < 8; i++) { const k = (t * 0.5 + i / 8) % 1; ctx.globalAlpha = 0.6 * (1 - k); ell(ctx, Math.sin(i * 7) * 60, -30 + k * 40, 1.4, 1.4, '#e0c0ff', null); ctx.globalAlpha = 1; }
    if (dr.on) glow(ctx, 0, hy, 30, pink, 0.4);
    ctx.restore();
  }

  // ------------------------------------------------------------------ 4. Magmaton the Volcano Titan
  function magma(ctx, P, look, A) {
    const t = A.t, m = A.m, g = gait(A, 0.45), b = blow(A.atk);
    const bomb = mv(A, 'meteor'), wave = mv(A, 'shockwave'), sl = mv(A, 'slam'), hard = mv(A, 'harden');
    const rock = P.skin, dk = shade(rock, -0.5), lt = shade(rock, 0.25), lava = look.trim, hot = '#ffe27a';
    const shell = m.hardened ? 1 : surge(hard);
    const erupt = surge(bomb) + (m.phase >= 2 ? 0.3 : 0);
    const both = surge(wave);
    const vein = (pts, w = 1.6) => { glow(ctx, pts[1][0], pts[1][1], 5, lava, 0.35); stroke(ctx, lava, lw() * w, () => { ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); }); stroke(ctx, hot, lw() * w * 0.4, () => { ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); }); };
    ctx.save(); ctx.translate(0, g.bob * 1.8 - both * 4);
    // The volcano on its back: a cone rising behind the shoulders, lava in the crater, smoke.
    shape(ctx, vgrad(ctx, -150, -80, shade(rock, 0.1), dk), () => { ctx.moveTo(-34, -86); ctx.lineTo(-14, -142); ctx.lineTo(14, -142); ctx.lineTo(34, -86); });
    vein([[-8, -140], [-12, -122], [-6, -108], [-14, -92]]); vein([[8, -140], [12, -118], [18, -100]]);
    ell(ctx, 0, -142, 14, 4.2, '#2a1008'); ell(ctx, 0, -142.5, 11, 3, rgrad(ctx, 0, -142, 11, hot, lava), null);
    glow(ctx, 0, -146, 22 + erupt * 26, lava, 0.5 + erupt * 0.4);
    for (let i = 0; i < 4; i++) { const k = (t * 0.35 + i / 4) % 1; ctx.globalAlpha = 0.5 * (1 - k); ell(ctx, Math.sin(t + i * 2) * 6 + k * 8, -150 - k * 40, 7 + k * 10, 5 + k * 8, '#5a4a48', null); ctx.globalAlpha = 1; }
    if (erupt > 0.2) for (let i = 0; i < 6; i++) { const k = (t * 1.6 + i / 6) % 1; ell(ctx, (i - 2.5) * 9 * k, -148 - k * 44 + k * k * 30, 3, 3, i % 2 ? lava : hot, '#5a1a08'); }
    // Legs: pillars of cooled rock with magma in the cracks, obsidian knee plates, broad toed feet.
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, sd * g.s) * 5;
      const hip = { x: sd * 17, y: -44 }, knee = { x: sd * 21, y: -24 - lift }, ank = { x: sd * 20, y: -7 - lift };
      chain(ctx, [hip, knee, ank], [14, 12, 10], rock);
      vein([[sd * 14, -40], [sd * 18, -32], [sd * 15, -26]]); vein([[sd * 23, -20 - lift], [sd * 19, -14 - lift], [sd * 22, -9 - lift]], 1.2);
      shape(ctx, vgrad(ctx, knee.y - 7, knee.y + 6, '#4a4a5a', '#121218'), () => { ctx.moveTo(knee.x - 9, knee.y - 4); ctx.lineTo(knee.x, knee.y - 9); ctx.lineTo(knee.x + 9, knee.y - 4); ctx.lineTo(knee.x + 6, knee.y + 5); ctx.lineTo(knee.x - 6, knee.y + 5); });
      shape(ctx, vgrad(ctx, -10 - lift, 0, lt, dk), () => { ctx.moveTo(ank.x - 15, -1 - lift); ctx.quadraticCurveTo(ank.x - 14, -12 - lift, ank.x, -12 - lift); ctx.quadraticCurveTo(ank.x + 14, -12 - lift, ank.x + 15, -1 - lift); ctx.closePath(); });
      for (let k = 0; k < 4; k++) { const x = ank.x - 10.5 + k * 7; ell(ctx, x, -2.6 - lift, 3.4, 2.6, rock); shape(ctx, '#1a1418', () => { ctx.moveTo(x - 1.8, -0.8 - lift); ctx.lineTo(x, 1.6 - lift); ctx.lineTo(x + 1.8, -0.8 - lift); }, undefined, lw() * 0.4); }
    }
    // The body: a hunched mass of rock, magma running down it, a molten heart showing through.
    shape(ctx, vgrad(ctx, -112, -36, lt, dk), () => { ctx.moveTo(-30, -40); ctx.bezierCurveTo(-46, -60, -46, -98, -26, -108); ctx.quadraticCurveTo(0, -118, 26, -108); ctx.bezierCurveTo(46, -98, 46, -60, 30, -40); ctx.quadraticCurveTo(0, -30, -30, -40); });
    vein([[-20, -100], [-26, -84], [-20, -70], [-28, -56]]); vein([[22, -96], [16, -82], [24, -64]]); vein([[-6, -48], [4, -56], [-2, -64]]);
    const heart = 0.6 + 0.3 * Math.sin(t * 3) + erupt * 0.4;
    glow(ctx, 0, -76, 18 * heart, lava, 0.7);
    shape(ctx, rgrad(ctx, 0, -76, 10, hot, lava), () => { ctx.moveTo(-8, -84); ctx.lineTo(-3, -70); ctx.lineTo(6, -66); ctx.lineTo(9, -80); ctx.lineTo(2, -88); }, '#5a1a08');
    // Arms: boulders for shoulders, rock forearms, molten fists (raised for a slam or a stamp).
    const up = Math.max(surge(sl), both * 0.9);
    for (const sd of [-1, 1]) {
      const raise = sd > 0 ? Math.max(up, b.wind) : both * 0.9;
      const hitK = sd > 0 ? b.hit : 0;
      const sh = { x: sd * 36, y: -96 }, el = { x: sd * lerp(52, 40, raise), y: lerp(-70, -118, raise) + hitK * 10 }, fs = { x: sd * (lerp(48, 28, raise) - hitK * 12), y: lerp(-44, -138, raise) + hitK * 22 };
      chain(ctx, [sh, el, fs], [12, 10.5, 9], rock);
      vein([[sh.x, sh.y + 6], [lerp(sh.x, el.x, 0.6), lerp(sh.y, el.y, 0.6)], [el.x, el.y + 2]], 1.2);
      ell(ctx, sh.x, sh.y - 2, 15, 12, vgrad(ctx, sh.y - 14, sh.y + 10, lt, rock));
      shape(ctx, '#1a1418', () => { ctx.moveTo(sh.x - 8, sh.y - 12); ctx.lineTo(sh.x - 3, sh.y - 22); ctx.lineTo(sh.x + 2, sh.y - 12); }, undefined, lw() * 0.6);
      glow(ctx, fs.x, fs.y, 14, lava, 0.6 + raise * 0.3);
      ell(ctx, fs.x, fs.y, 11, 10, rgrad(ctx, fs.x, fs.y, 11, hot, lava), '#5a1a08');
      for (let k = -1; k <= 1; k++) ell(ctx, fs.x + k * 5.4, fs.y - 6.5, 3, 2.6, shade(lava, -0.2), '#5a1a08', 0, lw() * 0.6);
      drips(ctx, fs.x, fs.y + 9, 5, lava, t + sd, 2);
    }
    // The head: sunk between the shoulders, a jaw of rock, eyes and mouth of fire.
    shape(ctx, vgrad(ctx, -126, -100, lt, rock), () => { ctx.moveTo(-14, -102); ctx.lineTo(-16, -116); ctx.lineTo(-8, -126); ctx.lineTo(8, -126); ctx.lineTo(16, -116); ctx.lineTo(14, -102); });
    for (const sd of [-1, 1]) shape(ctx, '#1a1418', () => { ctx.moveTo(sd * 10, -122); ctx.lineTo(sd * 20, -134); ctx.lineTo(sd * 14, -118); }, undefined, lw() * 0.6);
    glow(ctx, 0, -114, 14, lava, 0.6);
    for (const sd of [-1, 1]) shape(ctx, hot, () => { ctx.moveTo(sd * 3, -117); ctx.lineTo(sd * 10, -119); ctx.lineTo(sd * 8, -114); }, null);
    const jaw = Math.max(b.hit, erupt * 0.6, both);
    shape(ctx, '#2a1008', () => { ctx.rect(-7, -109, 14, 2 + jaw * 5); }, null);
    if (jaw > 0.2) shape(ctx, lava, () => { ctx.rect(-6, -108.5, 12, jaw * 4.4); }, null);
    // An obsidian shell: black glass plates over it all, glinting.
    if (shell > 0.05) {
      ctx.globalAlpha = Math.min(1, shell) * 0.85;
      for (const [x, y, w, h] of [[-24, -96, 18, 22], [6, -100, 20, 24], [-18, -66, 16, 18], [8, -62, 18, 20], [-40, -100, 14, 16], [26, -100, 14, 16], [-22, -38, 12, 16], [10, -38, 12, 16]]) shape(ctx, vgrad(ctx, y, y + h, '#5a5a7a', '#0a0a12'), () => { ctx.moveTo(x, y + h * 0.3); ctx.lineTo(x + w * 0.5, y); ctx.lineTo(x + w, y + h * 0.3); ctx.lineTo(x + w * 0.8, y + h); ctx.lineTo(x + w * 0.2, y + h); }, '#000000', lw() * 0.7);
      ctx.globalAlpha = 1;
      stroke(ctx, 'rgba(255,255,255,0.6)', lw() * 0.8, () => { for (const [x, y] of [[-18, -92], [12, -96], [-14, -62]]) { ctx.moveTo(x, y); ctx.lineTo(x + 5, y - 3); } });
    }
    ctx.restore();
    if (both > 0.8 && wave.act) glow(ctx, 0, -4, 40, lava, 0.5);
  }

  // ------------------------------------------------------------------ 5. The Crystal Leviathan
  function leviathan(ctx, P, look, A) {
    const t = A.t, m = A.m, b = blow(A.atk);
    const sw = mv(A, 'sweep'), rain = mv(A, 'meteor'), pull = mv(A, 'pull'), song = mv(A, 'shockwave');
    const cr = P.skin, dk = shade(P.cloth, -0.1), lt = shade(cr, 0.5), ice = look.trim, vio = P.eye;
    const swim = Math.sin(t * 1.4), hover = -44 + swim * 4;
    ell(ctx, 0, 0, 40, 8, 'rgba(0,0,0,0.25)', null);
    ctx.save(); ctx.translate(0, hover);
    const facet = (x, y, w, h, a = 0) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); shape(ctx, vgrad(ctx, -h, h, lt, cr), () => { ctx.moveTo(0, -h); ctx.lineTo(w, -h * 0.2); ctx.lineTo(w * 0.6, h); ctx.lineTo(-w * 0.6, h); ctx.lineTo(-w, -h * 0.2); }, dk, lw() * 0.6); stroke(ctx, 'rgba(255,255,255,0.7)', lw() * 0.6, () => { ctx.moveTo(-w * 0.5, -h * 0.3); ctx.lineTo(0, -h * 0.85); }); ctx.restore(); };
    // The tail fluke up the field behind it, beating slowly.
    const tail = [];
    for (let i = 0; i <= 8; i++) { const k = i / 8; tail.push({ x: Math.sin(t * 1.4 - k * 2) * 10 * k, y: -20 - k * 74 }); }
    chain(ctx, tail, tail.map((_, i) => 16 - i * 1.4), shade(cr, -0.15));
    { const p = tail[8], fl = Math.sin(t * 1.4 - 2) * 0.3; for (const sd of [-1, 1]) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(sd * (0.4 + fl)); shape(ctx, vgrad(ctx, -20, 0, lt, ice), () => { ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * 18, -10, sd * 30, -4); ctx.quadraticCurveTo(sd * 20, 2, 0, 4); }, dk); ctx.restore(); } }
    // The body: a great faceted whale of crystal, light moving inside it.
    shape(ctx, vgrad(ctx, -50, 14, lt, shade(cr, -0.2)), () => { ctx.moveTo(0, -48); ctx.bezierCurveTo(36, -46, 46, -12, 30, 8); ctx.quadraticCurveTo(0, 22, -30, 8); ctx.bezierCurveTo(-46, -12, -36, -46, 0, -48); }, dk);
    const inner = 0.5 + 0.5 * Math.sin(t * 2) + surge(rain) * 0.6;
    glow(ctx, Math.sin(t) * 10, -20, 30, vio, 0.25 * inner);
    for (const [x, y, w, h, a] of [[-18, -32, 10, 9, -0.3], [0, -36, 11, 10, 0], [18, -32, 10, 9, 0.3], [-24, -12, 9, 9, -0.5], [24, -12, 9, 9, 0.5], [-10, -18, 9, 8, -0.1], [10, -18, 9, 8, 0.1]]) facet(ctx, x, y, w, h, a);
    // Crystal spines down its back, shimmering (they launch as crystal rain).
    for (let k = 0; k < 7; k++) { const x = (k - 3) * 9, h = 14 - Math.abs(k - 3) * 2.4 + Math.sin(t * 3 + k) * 1.2 + surge(rain) * 4; shape(ctx, vgrad(ctx, -46 - h, -44, '#ffffff', ice), () => { ctx.moveTo(x - 3.4, -44); ctx.lineTo(x, -46 - h); ctx.lineTo(x + 3.4, -44); }, dk, lw() * 0.6); if (surge(rain) > 0.3) glow(ctx, x, -46 - h, 6, ice, 0.6); }
    // The pectoral fins, wide wings of crystal, rowing the air.
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(sd * 30, -10); ctx.scale(sd, 1); ctx.rotate(-0.3 + Math.sin(t * 1.4 + 1) * 0.25 - surge(song) * 0.4);
      shape(ctx, vgrad(ctx, -10, 16, lt, ice), () => { ctx.moveTo(0, -6); ctx.quadraticCurveTo(30, -8, 50, 6); ctx.lineTo(42, 12); ctx.lineTo(34, 9); ctx.lineTo(26, 14); ctx.lineTo(18, 10); ctx.quadraticCurveTo(6, 10, 0, 6); }, dk);
      stroke(ctx, 'rgba(255,255,255,0.6)', lw() * 0.6, () => { for (const x of [14, 26, 38]) { ctx.moveTo(4, 0); ctx.lineTo(x, 8); } });
      ctx.restore();
    }
    // The head: a jaw of crystal plates, a prism horn, eyes deep in it; the mouth opens for the whirlpool.
    const jaw = Math.max(surge(pull), b.hit * 0.6, surge(song) * 0.7);
    // (A whale's mouth: a long flat upper lip with baleen hanging from it, a deep lower jaw with throat
    // pleats, opening wide for the whirlpool.)
    shape(ctx, vgrad(ctx, 0, 30, shade(cr, 0.1), shade(cr, -0.3)), () => { ctx.moveTo(-30, 1); ctx.quadraticCurveTo(0, 6 + jaw * 4, 30, 1); ctx.lineTo(25, 12 + jaw * 6); ctx.quadraticCurveTo(0, 30 + jaw * 16, -25, 12 + jaw * 6); ctx.closePath(); }, dk);
    stroke(ctx, rgba('#ffffff', 0.55), lw() * 0.7, () => { for (let k = -4; k <= 4; k++) { const x = k * 5; ctx.moveTo(x, 9 + jaw * 6 + Math.abs(k) * -0.4); ctx.quadraticCurveTo(x * 1.05, 18 + jaw * 10, x * 0.9, 25 + jaw * 14 - Math.abs(k) * 1.4); } });
    if (jaw > 0.1) { ell(ctx, 0, 8 + jaw * 6, 18 * jaw + 2, 4 * jaw + 1, '#0a1428', null); if (pull.on) for (let k = 0; k < 3; k++) { ctx.globalAlpha = 0.6; stroke(ctx, '#8a9aff', lw(), () => { ctx.arc(0, 8 + jaw * 6, 5 + k * 5 + ((t * 20) % 5), t * 4 + k, t * 4 + k + 4); }); ctx.globalAlpha = 1; } }
    shape(ctx, vgrad(ctx, -2, 6, lt, cr), () => { ctx.moveTo(-31, 0); ctx.quadraticCurveTo(0, 5 + jaw * 4, 31, 0); ctx.quadraticCurveTo(0, 2, -31, 0); }, dk, lw() * 0.7);
    for (let k = 0; k < 13; k++) { const x = -24 + k * 4, y = 2.6 + (1 - Math.abs(x) / 30) * (3 + jaw * 4); stroke(ctx, '#e8fbff', lw() * 0.7, () => { ctx.moveTo(x, y); ctx.lineTo(x + 0.4, y + 3 + jaw * 2); }); }
    // Eyes deep under brows of crystal, looking down at you.
    for (const sd of [-1, 1]) {
      eye(ctx, sd * 17, -6, 2.4, vio, 0, -sd);
      shape(ctx, vgrad(ctx, -13, -7, '#ffffff', ice), () => { ctx.moveTo(sd * 9, -11); ctx.lineTo(sd * 25, -12); ctx.lineTo(sd * 22, -8); ctx.lineTo(sd * 11, -7.5); }, dk, lw() * 0.6);
      for (let k = 0; k < 3; k++) ell(ctx, sd * (24 + k * 3), 8 - k * 4, 1.6 - k * 0.3, 1.4 - k * 0.3, rgba('#ffffff', 0.7), dk, 0, lw() * 0.4);
    }
    const horn = 0.5 + surge(sw);
    shape(ctx, vgrad(ctx, -70, -44, '#ffffff', ice), () => { ctx.moveTo(-5, -44); ctx.lineTo(0, -72 - surge(sw) * 4); ctx.lineTo(5, -44); }, dk);
    stroke(ctx, 'rgba(255,255,255,0.8)', lw() * 0.6, () => { ctx.moveTo(-1.5, -48); ctx.lineTo(0, -66); });
    glow(ctx, 0, -62, 12 * horn + (sw.act ? 20 : 0), ['#ff7a7a', '#ffe27a', '#7affc8', '#7ad8ff', '#c87aff'][Math.floor(t * 4) % 5], 0.5 + horn * 0.3);
    if (song.on) for (let k = 1; k <= 3; k++) { ctx.globalAlpha = surge(song) * (0.6 - k * 0.15); stroke(ctx, '#ff8ad8', lw() * 1.6, () => { ctx.ellipse(0, -20, 40 + k * 14, 30 + k * 10, 0, 0, TAU); }); ctx.globalAlpha = 1; }
    ctx.restore();
  }

  // ------------------------------------------------------------------ 6. Thunderhoof the Storm Bull
  function bull(ctx, P, look, A) {
    const t = A.t, m = A.m, b = blow(A.atk);
    const charging = !!m.charging;
    const g = gait(A, charging ? 2.2 : 0.8);
    const ch = mv(A, 'chain'), st = mv(A, 'shockwave'), ro = mv(A, 'roar'), sp = mv(A, 'stampede');
    const hide = P.skin, dk = shade(hide, -0.45), lt = shade(hide, 0.3), bolt = look.trim, yel = P.eye, horn = '#e8dcc0';
    const rear = surge(st);
    const low = charging ? 1 : surge(sp) * 0.6;
    const zap = (x1, y1, x2, y2, col, n = 5) => { ctx.strokeStyle = col; ctx.lineWidth = lw() * 1.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); for (let i = 1; i < n; i++) { const k = i / n; ctx.lineTo(lerp(x1, x2, k) + (Math.sin(t * 40 + i * 7) * 4), lerp(y1, y2, k) + Math.cos(t * 37 + i * 5) * 3); } ctx.lineTo(x2, y2); ctx.stroke(); };
    ctx.save(); ctx.translate(0, g.bob * (charging ? 4 : 2) - rear * 10);
    // Hind legs and haunches behind: thick, a hock, a cloven hoof with runes.
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, sd * g.s) * (charging ? 9 : 4);
      const hip = { x: sd * 22, y: -52 }, knee = { x: sd * 26, y: -34 - lift * 0.5 }, hock = { x: sd * 24, y: -22 - lift }, ank = { x: sd * 25, y: -8 - lift };
      chain(ctx, [hip, knee, hock, ank], [12, 8, 6, 5.4], dk);
      shape(ctx, '#2a2420', () => { ctx.moveTo(ank.x - 6, ank.y + 1); ctx.lineTo(ank.x - 6, ank.y + 7); ctx.lineTo(ank.x - 0.6, ank.y + 7); ctx.lineTo(ank.x - 0.6, ank.y + 2); ctx.moveTo(ank.x + 0.6, ank.y + 2); ctx.lineTo(ank.x + 0.6, ank.y + 7); ctx.lineTo(ank.x + 6, ank.y + 7); ctx.lineTo(ank.x + 6, ank.y + 1); });
    }
    // The body, broad and humped, storm cloud mane over the shoulders.
    shape(ctx, vgrad(ctx, -86, -30, lt, dk), () => { ctx.moveTo(-30, -36); ctx.bezierCurveTo(-42, -52, -40, -80, -20, -86); ctx.quadraticCurveTo(0, -92, 20, -86); ctx.bezierCurveTo(40, -80, 42, -52, 30, -36); ctx.quadraticCurveTo(0, -28, -30, -36); });
    stroke(ctx, rgba('#000000', 0.25), lw(), () => { for (const sd of [-1, 1]) { ctx.moveTo(sd * 12, -40); ctx.quadraticCurveTo(sd * 24, -56, sd * 18, -72); } ctx.moveTo(-8, -46); ctx.quadraticCurveTo(0, -50, 8, -46); });
    for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI, r = 30 + Math.sin(t * 2 + i) * 2; ell(ctx, Math.cos(a) * r, -76 + Math.sin(a) * 16, 11 + (i % 3) * 2, 9, vgrad(ctx, -100, -60, '#6a6a80', '#2a2a3a'), '#1a1a24'); }
    for (let i = 0; i < 3; i++) if (Math.sin(t * 7 + i * 3) > 0.6) zap(-24 + i * 22, -92, -18 + i * 20 + Math.sin(t * 9) * 6, -70, bolt, 4);
    // Forelegs: lifted for a stomp, pumping in a charge; feathered fetlocks, hooves.
    for (const sd of [-1, 1]) {
      const lift = (charging ? Math.max(0, -sd * g.s) * 14 : Math.max(0, -sd * g.s) * 4) + rear * 18;
      const sh = { x: sd * 20, y: -54 }, knee = { x: sd * 23, y: -30 - lift * 0.6 }, ank = { x: sd * 21, y: -10 - lift };
      chain(ctx, [sh, knee, ank], [11, 7.4, 6], hide);
      for (let k = 0; k < 4; k++) stroke(ctx, '#4a4a5a', lw() * 1.2, () => { ctx.moveTo(ank.x - 5 + k * 3, ank.y - 3); ctx.lineTo(ank.x - 6 + k * 3.4, ank.y + 3); });
      shape(ctx, '#2a2420', () => { ctx.moveTo(ank.x - 6.4, ank.y + 1); ctx.lineTo(ank.x - 6.4, ank.y + 8); ctx.lineTo(ank.x - 0.6, ank.y + 8); ctx.lineTo(ank.x - 0.6, ank.y + 2); ctx.moveTo(ank.x + 0.6, ank.y + 2); ctx.lineTo(ank.x + 0.6, ank.y + 8); ctx.lineTo(ank.x + 6.4, ank.y + 8); ctx.lineTo(ank.x + 6.4, ank.y + 1); });
      stroke(ctx, bolt, lw() * 0.8, () => { ctx.moveTo(ank.x - 4, ank.y + 5); ctx.lineTo(ank.x - 2, ank.y + 3); ctx.lineTo(ank.x - 3, ank.y + 6); });
    }
    // The head, low and wide: horns sweeping up and out with lightning between, a nose ring, fierce eyes.
    const hy = -58 + low * 14 + b.hit * 6, hx = 0;
    shape(ctx, vgrad(ctx, hy - 18, hy + 22, lt, hide), () => { ctx.moveTo(hx - 16, hy - 12); ctx.quadraticCurveTo(hx, hy - 20, hx + 16, hy - 12); ctx.lineTo(hx + 12, hy + 12); ctx.quadraticCurveTo(hx, hy + 24, hx - 12, hy + 12); });
    ell(ctx, hx, hy + 14, 10, 7, shade(hide, 0.15));
    ell(ctx, hx - 4, hy + 15, 1.8, 2.2, '#1a1418', null); ell(ctx, hx + 4, hy + 15, 1.8, 2.2, '#1a1418', null);
    stroke(ctx, '#d8b04a', lw() * 1.6, () => { ctx.arc(hx, hy + 19, 4.4, 0.2, Math.PI - 0.2); });
    if (ro.on || charging) steam(ctx, hx - 4, hy + 16, t, '#c8d0e8', 2), steam(ctx, hx + 4, hy + 16, t + 0.5, '#c8d0e8', 2);
    for (const sd of [-1, 1]) {
      const hp = [{ x: hx + sd * 13, y: hy - 10 }, { x: hx + sd * 30, y: hy - 14 }, { x: hx + sd * 40, y: hy - 30 }, { x: hx + sd * 38, y: hy - 46 }];
      chain(ctx, hp, [5.6, 4.6, 3.2, 1.2], horn);
      stroke(ctx, 'rgba(0,0,0,0.25)', lw() * 0.6, () => { for (let k = 1; k < 3; k++) { const p = hp[k]; ctx.moveTo(p.x - 3, p.y); ctx.lineTo(p.x + 3, p.y + 1); } });
      shape(ctx, shade(hide, -0.2), () => { ctx.moveTo(hx + sd * 15, hy - 4); ctx.lineTo(hx + sd * 24, hy - 1); ctx.lineTo(hx + sd * 16, hy + 3); });
      eye(ctx, hx + sd * 7, hy - 4, 2.2, yel, 1, -sd);
    }
    const arc = 0.4 + surge(ch) * 1.2 + (m.phase >= 1 ? 0.3 : 0);
    if (arc > 0.5 || Math.sin(t * 5) > 0.3) { zap(hx - 38, hy - 46, hx + 38, hy - 46, bolt, 8); glow(ctx, hx, hy - 46, 20 * arc, bolt, 0.4); }
    if (surge(ch) > 0.3) { zap(hx - 38, hy - 46, hx - 10, hy - 70, '#ffffff', 5); zap(hx + 38, hy - 46, hx + 12, hy - 72, '#ffffff', 5); }
    ctx.restore();
    if (charging) for (let i = 0; i < 2; i++) ell(ctx, (Math.random() - 0.5) * 50, -2, 8, 3, 'rgba(160,140,120,0.35)', null);
  }

  // ------------------------------------------------------------------ 7. Skarnox the Siege Scorpion
  function scorpion(ctx, P, look, A) {
    const t = A.t, m = A.m, g = gait(A, 1.0), b = blow(A.atk);
    const gr = mv(A, 'grab'), mo = mv(A, 'meteor'), tl = mv(A, 'tail'), bu = mv(A, 'burrow');
    const shell = P.skin, dk = shade(shell, -0.45), lt = shade(shell, 0.3), acid = look.trim, red = P.eye;
    const sink = (m.sink || 0) * 50;
    ctx.save(); ctx.translate(0, sink + g.bob);
    // The tail: up from the back over its body, segment by segment, the stinger a mortar barrel.
    const rec = surge(mo), lash = tl.on ? (m.stage === 'wind' ? -tl.wind : lerp(-1, 1.2, ease(Math.min(1, tl.act * 2.5)))) : 0;
    // (Up from its back, leaning to one side, over the top and curling forward so the stinger hangs over its head.)
    const tp = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8, up = k < 0.6 ? Math.sin((k / 0.6) * Math.PI / 2) : 1, fwd = k < 0.55 ? 0 : (k - 0.55) / 0.45;
      tp.push({ x: 20 * up - 12 * fwd + Math.sin(t * 1.2) * 3 * k + lash * 26 * k * k, y: -44 - up * 72 + fwd * fwd * 40 + rec * 6 * k + lash * lash * 8 * k });
    }
    for (let i = 0; i < 8; i++) { const a = tp[i], q = tp[i + 1], r1 = 11.6 - i * 0.75, r2 = 11 - i * 0.75; chain(ctx, [a, q], [r1, r2], i % 2 ? shell : shade(shell, -0.1)); stroke(ctx, dk, lw(), () => { const ang = Math.atan2(q.y - a.y, q.x - a.x); ctx.arc(q.x, q.y, r2, ang + Math.PI * 0.55, ang + Math.PI * 1.45); }); if (i % 2 === 0) shape(ctx, dk, () => { ctx.moveTo(q.x - 2, q.y - r2 * 0.6); ctx.lineTo(q.x + 3, q.y - r2 - 3); ctx.lineTo(q.x + 2, q.y - r2 * 0.4); }, undefined, lw() * 0.5); }
    { const s = tp[8], a = Math.atan2(s.y - tp[7].y, s.x - tp[7].x) - Math.PI / 2; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(a);
      ell(ctx, 0, 0, 10, 8, vgrad(ctx, -8, 8, lt, dk));
      shape(ctx, '#2a2420', () => { ctx.rect(-4, 4, 8, 12 + rec * 3); }, undefined, lw() * 0.7);
      ell(ctx, 0, 16 + rec * 3, 4, 1.6, '#120808', null);
      shape(ctx, '#e8dcc0', () => { ctx.moveTo(-3, -6); ctx.quadraticCurveTo(-2, -16, 4, -20); ctx.quadraticCurveTo(2, -12, 3, -6); }, undefined, lw() * 0.6);
      if (rec > 0.5) glow(ctx, 0, 18, 12, acid, rec);
      ctx.restore(); }
    // Eight legs, four a side: spiked, jointed, clawed at the tips.
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
      const ph = g.W * TAU + i * 1.7 + (sd > 0 ? 1.2 : 0), lift = Math.max(0, Math.sin(ph)) * 5;
      const hip = { x: sd * (16 + i * 1.5), y: -30 + i * 6 }, knee = { x: sd * (40 + i * 4), y: -44 + i * 4 - lift }, ank = { x: sd * (54 + i * 3), y: -16 + i * 3 - lift * 0.5 }, toe = { x: sd * (57 + i * 3), y: -1 + i };
      bugLeg(ctx, [hip, knee, ank, toe], 3.6, shell, lt, '#2a2420');
      for (const q of [0.35, 0.7]) shape(ctx, dk, () => { const x = lerp(knee.x, ank.x, q), y = lerp(knee.y, ank.y, q); ctx.moveTo(x, y - 2); ctx.lineTo(x + sd * 4, y - 3); ctx.lineTo(x, y + 1); }, undefined, lw() * 0.5);
    }
    // The carapace: broad plates, ridges, a cluster of eyes at the front.
    shape(ctx, vgrad(ctx, -58, -12, lt, dk), () => { ctx.moveTo(-24, -16); ctx.bezierCurveTo(-32, -30, -28, -50, -14, -56); ctx.quadraticCurveTo(0, -60, 14, -56); ctx.bezierCurveTo(28, -50, 32, -30, 24, -16); ctx.quadraticCurveTo(0, -8, -24, -16); });
    for (let r = 0; r < 4; r++) stroke(ctx, dk, lw() * 1.1, () => { const y = -50 + r * 9; ctx.moveTo(-22 + r, y); ctx.quadraticCurveTo(0, y - 4, 22 - r, y); });
    stroke(ctx, 'rgba(255,255,255,0.25)', lw(), () => { ctx.moveTo(-12, -52); ctx.quadraticCurveTo(-18, -36, -14, -20); });
    for (const [x, y, r] of [[-5, -22, 2.4], [5, -22, 2.4], [-11, -25, 1.4], [11, -25, 1.4], [-2, -27, 1.2], [2, -27, 1.2]]) eye(ctx, x, y, r, red, 0, 1, true);
    // The pincers, held forward: an arm, a heavy claw that opens and snaps on a grab.
    const snap = gr.on ? (m.stage === 'wind' ? gr.wind : 1 - Math.min(1, gr.act * 3)) : b.wind;
    for (const sd of [-1, 1]) {
      const reach = gr.on ? 12 * gr.wind : b.hit * 10 * (sd > 0 ? 1 : 0);
      const sh = { x: sd * 20, y: -22 }, el = { x: sd * 40, y: -32 + reach * 0.2 }, wr = { x: sd * (46 + reach * 0.4), y: -14 + reach * 0.5 };
      chain(ctx, [sh, el, wr], [6.6, 5.6, 5.8], shell);
      bands(ctx, el, wr, 5.4, dk, [0.4, 0.7]);
      const open = 0.2 + snap * 0.7;
      // (The claw held out and down to the side, a size up.)
      ctx.save(); ctx.translate(wr.x, wr.y + 2); ctx.scale(sd * 1.25, 1.25); ctx.rotate(-0.55);
      shape(ctx, vgrad(ctx, -6, 22, lt, shell), () => { ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-12, 8, -6, 20); ctx.quadraticCurveTo(-1, 12, 2, 4 + open * 4); ctx.lineTo(6, -4); });
      ctx.rotate(open * 0.7);
      shape(ctx, vgrad(ctx, -2, 18, lt, dk), () => { ctx.moveTo(2, -2); ctx.quadraticCurveTo(10, 8, 6, 18); ctx.quadraticCurveTo(3, 10, 0, 4); });
      ctx.restore();
      for (let k = 0; k < 3; k++) ell(ctx, wr.x + sd * (-3 + k * 2), wr.y + 4, 0.8, 0.8, '#e8dcc0', null);
    }
    if (m.phase >= 1) drips(ctx, tp[8].x, tp[8].y + 18, 4, acid, t, 2);
    ctx.restore();
    if (sink > 1) { ell(ctx, 0, 0, 40, 10, '#8a6a3a', null); for (let i = 0; i < 10; i++) ell(ctx, Math.cos(i) * 34, -Math.abs(Math.sin(i)) * 6, 5, 3, '#b8945a'); }
  }

  // ------------------------------------------------------------------ 8. The Three Wardens
  function warden(ctx, P, look, A) {
    const t = A.t, m = A.m, b = blow(A.atk), kind = look.kind || 'gravity';
    const stone = P.skin, dk = shade(stone, -0.5), lt = shade(stone, 0.35), core = look.trim, pale = P.eye;
    const hover = -40 + Math.sin(t * 1.8 + kind.length) * 4;
    const cast = m.move ? (m.stage === 'wind' ? ease(m.k) : 1 - Math.min(1, (m.k || 0) * 2)) : 0;
    ell(ctx, 0, 0, 24, 6, 'rgba(0,0,0,0.25)', null);
    if (m.linked) glow(ctx, 0, -40, 50, core, 0.18 + 0.08 * Math.sin(t * 4));
    ctx.save(); ctx.translate(0, hover);
    // The halo behind: a ring turning, with kind-marks on it.
    ctx.save(); ctx.translate(0, -44); ctx.scale(1, 0.4); ctx.rotate(t * 0.6);
    stroke(ctx, dk, lw() * 3.6, () => { ctx.arc(0, 0, 34, 0, TAU); }); stroke(ctx, core, lw() * 1.4, () => { ctx.arc(0, 0, 34, 0, TAU); });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ell(ctx, Math.cos(a) * 34, Math.sin(a) * 34, 3, 3, lt, undefined, 0, lw() * 0.6); }
    ctx.restore();
    // The body: a tall carved monolith, tapering to a point that hovers over the ground.
    shape(ctx, vgrad(ctx, -84, 10, lt, dk), () => { ctx.moveTo(-16, -78); ctx.lineTo(16, -78); ctx.lineTo(20, -40); ctx.lineTo(8, -6); ctx.lineTo(0, 10); ctx.lineTo(-8, -6); ctx.lineTo(-20, -40); });
    stroke(ctx, dk, lw(), () => { ctx.moveTo(-18, -60); ctx.lineTo(18, -60); ctx.moveTo(-19, -40); ctx.lineTo(19, -40); ctx.moveTo(-10, -20); ctx.lineTo(10, -20); });
    for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2 + i); stroke(ctx, core, lw() * 0.9, () => { const y = -70 + i * 14; ctx.moveTo(-12, y); ctx.lineTo(-8, y - 3); ctx.lineTo(-4, y); ctx.moveTo(4, y); ctx.lineTo(8, y + 3); ctx.lineTo(12, y); }); ctx.globalAlpha = 1; }
    // Arms of stacked stone blocks on chains of light, ending in open hands (raised as it casts).
    for (const sd of [-1, 1]) {
      const up = cast * (sd > 0 ? 1 : 0.7) + (sd > 0 ? b.wind : 0);
      const sh = { x: sd * 22, y: -66 }, el = { x: sd * (34 + up * 2), y: lerp(-48, -76, up) }, hd = { x: sd * lerp(36, 28, up), y: lerp(-28, -96, up) + (sd > 0 ? b.hit * 20 : 0) };
      chain(ctx, [sh, el, hd], [4.4, 3.8, 3.4], shade(stone, -0.2));
      for (const q of [0.3, 0.7]) { const x = lerp(sh.x, el.x, q), y = lerp(sh.y, el.y, q); shape(ctx, vgrad(ctx, y - 5, y + 5, lt, stone), () => { ctx.rect(x - 5, y - 4.5, 10, 9); }, undefined, lw() * 0.7); }
      { const x = lerp(el.x, hd.x, 0.5), y = lerp(el.y, hd.y, 0.5); shape(ctx, vgrad(ctx, y - 5, y + 5, lt, stone), () => { ctx.rect(x - 4.5, y - 4.5, 9, 9); }, undefined, lw() * 0.7); }
      ell(ctx, sh.x, sh.y, 7, 6, vgrad(ctx, sh.y - 6, sh.y + 6, lt, stone));
      for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + (k - 1.5) * 0.45; chain(ctx, [{ x: hd.x, y: hd.y }, { x: hd.x + Math.cos(a) * 6, y: hd.y + Math.sin(a) * 6 - 2 }, { x: hd.x + Math.cos(a) * 10, y: hd.y + Math.sin(a) * 9 - 4 * up }], [2, 1.6, 1.1], stone); }
      ell(ctx, hd.x, hd.y, 5, 4.4, vgrad(ctx, hd.y - 5, hd.y + 5, lt, stone));
      if (cast > 0.2) glow(ctx, hd.x, hd.y - 6, 12 * cast, core, 0.7);
    }
    // The face: a mask carved in the stone, eyes of light; the core in its chest, by kind.
    shape(ctx, vgrad(ctx, -82, -64, lt, stone), () => { ctx.moveTo(-9, -82); ctx.lineTo(9, -82); ctx.lineTo(8, -68); ctx.lineTo(0, -64); ctx.lineTo(-8, -68); });
    for (const sd of [-1, 1]) { glow(ctx, sd * 4, -75, 6, pale, 0.7); shape(ctx, pale, () => { ctx.moveTo(sd * 1.5, -76); ctx.lineTo(sd * 7, -77); ctx.lineTo(sd * 6, -73.5); }, null); }
    const cy = -46, pulse = 0.7 + 0.3 * Math.sin(t * 3) + cast * 0.5;
    if (kind === 'void') {
      ell(ctx, 0, cy, 11, 11, '#000000', core, 0, lw() * 1.4);
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.6; stroke(ctx, core, lw(), () => { ctx.arc(0, cy, 6 + i * 2.5, t * 2 + i * 2, t * 2 + i * 2 + 3.6); }); ctx.globalAlpha = 1; }
      glow(ctx, 0, cy, 26 * pulse, core, 0.4);
    } else if (kind === 'sonic') {
      glow(ctx, 0, cy, 24 * pulse, core, 0.5);
      for (const sd of [-1, 0, 1]) { const x = sd * 9, y = cy + 2 + Math.abs(sd) * 3, sw2 = Math.sin(t * 6 + sd) * 0.3 * (1 + cast); ctx.save(); ctx.translate(x, y - 6); ctx.rotate(sw2); shape(ctx, vgrad(ctx, 0, 10, '#ffe8a0', '#b8862a'), () => { ctx.moveTo(-3, 0); ctx.quadraticCurveTo(-4, 8, -5.5, 10); ctx.lineTo(5.5, 10); ctx.quadraticCurveTo(4, 8, 3, 0); }, undefined, lw() * 0.7); ell(ctx, 0, 10.5, 1.4, 1.4, '#6a4a10', null); ctx.restore(); }
      if (cast > 0.3) for (let k = 1; k <= 3; k++) { ctx.globalAlpha = cast * (0.6 - k * 0.15); stroke(ctx, core, lw() * 1.4, () => { ctx.arc(0, cy, 14 + k * 8, 0, TAU); }); ctx.globalAlpha = 1; }
    } else {
      glow(ctx, 0, cy, 24 * pulse, core, 0.55);
      ell(ctx, 0, cy, 9, 9, rgrad(ctx, 0, cy, 9, '#ffffff', core), dk);
      for (let i = 0; i < 5; i++) { const a = t * (1.2 + i * 0.2) + i * 1.3, r = 22 + i * 3; const x = Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.45; shape(ctx, vgrad(ctx, y - 4, y + 4, lt, dk), () => { ctx.moveTo(x - 4, y); ctx.lineTo(x - 1, y - 4); ctx.lineTo(x + 4, y - 1); ctx.lineTo(x + 2, y + 3); ctx.lineTo(x - 3, y + 3); }, undefined, lw() * 0.6); }
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ 9. Morgrath the Hollow King
  function lich(ctx, P, look, A) {
    const t = A.t, m = A.m, g = gait(A, 0.55), b = blow(A.atk);
    const ra = mv(A, 'raise'), mk = mv(A, 'mark'), dr = mv(A, 'drain'), ri = mv(A, 'rift');
    const bone = P.skin, boneD = shade(bone, -0.35), robe = P.cloth, robeL = shade(robe, 0.25), soul = look.trim, eyeC = P.eye, iron = '#2a2a34';
    const arms = Math.max(surge(ra), surge(ri) * 0.8);
    ctx.save(); ctx.translate(0, g.bob * 1.2);
    // The cape behind, tattered, stirring.
    shape(ctx, vgrad(ctx, -96, 0, shade(robe, -0.2), '#08040c'), () => { ctx.moveTo(-26, -92); ctx.quadraticCurveTo(-46, -50, -40, -4); for (let i = 0; i <= 8; i++) { const x = -40 + i * 10, y = -4 + (i % 2 ? -10 : 2) + Math.sin(t * 2 + i) * 2; ctx.lineTo(x, y); } ctx.quadraticCurveTo(46, -50, 26, -92); });
    // Bony feet under the robe's hem: long toes, claws.
    for (const sd of [-1, 1]) { const lift = Math.max(0, sd * g.s) * 3; for (let k = 0; k < 4; k++) { const x = sd * (8 + k * 3.4); chain(ctx, [{ x: sd * 9, y: -6 - lift }, { x, y: -2 - lift }, { x: x + sd * 1.2, y: 0.5 - lift }], [1.8, 1.4, 1], bone); } ell(ctx, sd * 9, -7 - lift, 5, 3, boneD); }
    // The robe: long, layered, a belt of skulls, the ribcage showing at the open chest.
    shape(ctx, vgrad(ctx, -92, -4, robeL, robe), () => { ctx.moveTo(-18, -88); ctx.quadraticCurveTo(-30, -40, -28, -8); for (let i = 0; i <= 7; i++) ctx.lineTo(-28 + i * 8, -8 + (i % 2 ? 4 : 0)); ctx.quadraticCurveTo(30, -40, 18, -88); });
    stroke(ctx, rgba('#000000', 0.3), lw(), () => { for (const x of [-14, -4, 6, 16]) { ctx.moveTo(x * 0.6, -80); ctx.quadraticCurveTo(x, -40, x * 1.2, -10); } });
    stroke(ctx, soul, lw() * 0.8, () => { ctx.moveTo(-17, -86); ctx.lineTo(-26, -10); ctx.moveTo(17, -86); ctx.lineTo(26, -10); });
    shape(ctx, iron, () => { ctx.rect(-20, -50, 40, 5); }, undefined, lw() * 0.7);
    for (let k = 0; k < 4; k++) { const x = -12 + k * 8; ell(ctx, x, -45, 2.6, 2.6, bone, undefined, 0, lw() * 0.5); ell(ctx, x - 0.9, -45.4, 0.6, 0.7, '#1a1018', null); ell(ctx, x + 0.9, -45.4, 0.6, 0.7, '#1a1018', null); }
    shape(ctx, '#140a1a', () => { ctx.moveTo(-11, -84); ctx.lineTo(11, -84); ctx.lineTo(7, -54); ctx.lineTo(-7, -54); });
    for (let r = 0; r < 5; r++) for (const sd of [-1, 1]) stroke(ctx, bone, lw() * 1.6, () => { const y = -80 + r * 5.6; ctx.moveTo(sd * 1, y); ctx.quadraticCurveTo(sd * 8, y - 1, sd * 9.5, y + 3); });
    stroke(ctx, bone, lw() * 2, () => { ctx.moveTo(0, -84); ctx.lineTo(0, -56); });
    glow(ctx, 0, -70, 9, soul, 0.5 + 0.2 * Math.sin(t * 3));
    // Arms of bone from the sleeves: the left holds the lantern of souls on a chain, the right a staff.
    for (const sd of [-1, 1]) {
      const up = sd > 0 ? Math.max(arms, b.wind, surge(mk) * 0.6) : arms;
      const sh = { x: sd * 20, y: -84 }, el = { x: sd * lerp(30, 32, up), y: lerp(-62, -94, up) }, hd = { x: sd * lerp(30, 24, up), y: lerp(-42, -116, up) + (sd > 0 ? b.hit * 20 : 0) };
      shape(ctx, vgrad(ctx, sh.y - 6, el.y + 10, robeL, robe), () => { ctx.moveTo(sh.x - sd * 6, sh.y - 4); ctx.quadraticCurveTo(el.x + sd * 4, el.y - 6, el.x + sd * 7, el.y + 6); ctx.lineTo(el.x - sd * 5, el.y + 8); ctx.quadraticCurveTo(sh.x, sh.y + 6, sh.x - sd * 4, sh.y + 6); });
      chain(ctx, [el, { x: lerp(el.x, hd.x, 0.5), y: lerp(el.y, hd.y, 0.5) }, hd], [2.4, 2, 1.8], bone);
      for (let k = 0; k < 4; k++) { const a = Math.PI / 2 + (k - 1.5) * 0.4 + (up > 0.5 ? Math.PI : 0); chain(ctx, [hd, { x: hd.x + Math.cos(a) * 4, y: hd.y + Math.sin(a) * 4 }, { x: hd.x + Math.cos(a) * 7, y: hd.y + Math.sin(a) * 7 + 1 }], [1.1, 0.9, 0.7], bone); }
      if (sd < 0) {
        const lx = hd.x - 2 + Math.sin(t * 1.5) * 2, ly = hd.y + 18;
        stroke(ctx, '#5a5a64', lw() * 0.8, () => { ctx.moveTo(hd.x, hd.y + 2); ctx.lineTo(lx, ly - 7); });
        shape(ctx, iron, () => { ctx.moveTo(lx - 5, ly - 7); ctx.lineTo(lx + 5, ly - 7); ctx.lineTo(lx + 6, ly + 6); ctx.lineTo(lx - 6, ly + 6); });
        const sl = 0.6 + 0.3 * Math.sin(t * 4) + surge(dr) * 0.6;
        glow(ctx, lx, ly, 14 * sl, soul, 0.6);
        ell(ctx, lx, ly, 4, 5, rgrad(ctx, lx, ly, 5, '#ffffff', soul), null);
        for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2.1; ell(ctx, lx + Math.cos(a) * 2.4, ly + Math.sin(a) * 3, 0.9, 1.2, '#ffffff', null); }
        stroke(ctx, iron, lw(), () => { ctx.moveTo(lx - 3, ly - 7); ctx.lineTo(lx - 3, ly + 6); ctx.moveTo(lx + 3, ly - 7); ctx.lineTo(lx + 3, ly + 6); });
      } else {
        stroke(ctx, '#3a2a1a', lw() * 2.4, () => { ctx.moveTo(hd.x, hd.y - 20); ctx.lineTo(hd.x + 1, hd.y + 34); });
        const sy2 = hd.y - 26; ell(ctx, hd.x, sy2, 5, 5.4, bone); ell(ctx, hd.x - 1.6, sy2 - 0.4, 1.3, 1.6, '#1a1018', null); ell(ctx, hd.x + 1.6, sy2 - 0.4, 1.3, 1.6, '#1a1018', null);
        glow(ctx, hd.x, sy2, 8 + surge(mk) * 14, eyeC, 0.5);
      }
    }
    // The skull: long-jawed, sockets burning, a crown of black iron spikes.
    const hy = -98, jaw = Math.max(b.hit, surge(ra) * 0.8);
    ell(ctx, 0, hy, 11, 12, vgrad(ctx, hy - 12, hy + 12, shade(bone, 0.15), boneD));
    shape(ctx, boneD, () => { ctx.moveTo(-8, hy + 6); ctx.lineTo(-6, hy + 15 + jaw * 4); ctx.lineTo(6, hy + 15 + jaw * 4); ctx.lineTo(8, hy + 6); });
    for (let k = -3; k <= 3; k++) { shape(ctx, '#f4ead0', () => { ctx.rect(k * 1.9 - 0.8, hy + 6, 1.6, 2.6); }, undefined, lw() * 0.3); shape(ctx, '#f4ead0', () => { ctx.rect(k * 1.9 - 0.8, hy + 12 + jaw * 4, 1.6, 2.2); }, undefined, lw() * 0.3); }
    ell(ctx, 0, hy + 3, 1.4, 2, '#1a1018', null);
    const burn = 0.7 + surge(mk) * 0.8 + (m.phase >= 2 ? 0.4 : 0);
    for (const sd of [-1, 1]) { ell(ctx, sd * 4.4, hy - 1, 3.2, 3.6, '#0a0410', null); glow(ctx, sd * 4.4, hy - 1, 8 * burn, eyeC, 0.8); ell(ctx, sd * 4.4, hy - 1, 1.2, 1.4, '#ffffff', null); }
    stroke(ctx, rgba('#000000', 0.3), lw() * 0.6, () => { ctx.moveTo(-6, hy - 8); ctx.lineTo(-3, hy - 5); ctx.lineTo(-5, hy - 3); });
    shape(ctx, iron, () => { ctx.moveTo(-11, hy - 8); for (let k = 0; k <= 6; k++) { const x = -11 + k * (22 / 6); ctx.lineTo(x, hy - 9 - (k % 2 ? 4 : 12 - Math.abs(k - 3) * 2)); } ctx.lineTo(11, hy - 8); ctx.closePath(); }, '#000000', lw() * 0.7);
    for (const x of [-7.3, 0, 7.3]) ell(ctx, x, hy - 10, 1.3, 1.3, soul, null);
    if (m.phase >= 2) for (let i = 0; i < 3; i++) steam(ctx, -6 + i * 6, hy - 20, t + i, '#c8a0ff', 2);
    ctx.restore();
    if (arms > 0.3) for (let i = 0; i < 6; i++) { const k = (t + i / 6) % 1; ctx.globalAlpha = arms * (1 - k) * 0.7; ell(ctx, (i - 2.5) * 12, -k * 30, 2, 3, soul, null); ctx.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ 10. The Abomination (and its lesser pieces)
  function abom(ctx, P, look, A) {
    const t = A.t, m = A.m, g = gait(A, 0.6), b = blow(A.atk), lesser = look.kind === 'lesser';
    const gr = mv(A, 'grab'), sl = mv(A, 'slam'), bile = mv(A, 'meteor');
    const f1 = P.skin, f2 = shade(P.skin, -0.2), f3 = '#9aa07a', f4 = '#c8a8b0', dk = shade(P.skin, -0.45), acid = look.trim;
    const up = surge(sl), reach = surge(gr);
    ctx.save(); ctx.translate(0, g.bob * 2);
    // Stubby legs of different hides, bandaged, with toes.
    for (const sd of [-1, 1]) {
      const lift = Math.max(0, sd * g.s) * 4, col = sd > 0 ? f2 : f3;
      const hip = { x: sd * 15, y: -34 }, knee = { x: sd * 20, y: -18 - lift }, ank = { x: sd * 18, y: -6 - lift };
      chain(ctx, [hip, knee, ank], [12, 10, 8.4], col);
      bands(ctx, knee, ank, 8.6, '#e8dcc0', [0.3, 0.55]);
      foot(ctx, ank.x, -lift, 9, col, '#c8b89a', 4);
      stitches(ctx, [[hip.x - 6, hip.y + 4], [knee.x - 4, knee.y - 2], [knee.x + 4, knee.y + 2]]);
    }
    // The body: lumps of different flesh sewn together, tubes of acid, a hook through it.
    shape(ctx, vgrad(ctx, -104, -28, shade(f1, 0.2), dk), () => { ctx.moveTo(-30, -32); ctx.bezierCurveTo(-48, -50, -44, -92, -20, -102); ctx.quadraticCurveTo(4, -110, 24, -100); ctx.bezierCurveTo(48, -88, 44, -48, 28, -32); ctx.quadraticCurveTo(0, -24, -30, -32); });
    shape(ctx, f3, () => { ctx.moveTo(-26, -96); ctx.quadraticCurveTo(-8, -102, -2, -84); ctx.quadraticCurveTo(-10, -66, -34, -66); ctx.quadraticCurveTo(-40, -82, -26, -96); }, undefined, lw() * 0.7);
    shape(ctx, f4, () => { ctx.moveTo(10, -60); ctx.quadraticCurveTo(32, -64, 36, -46); ctx.quadraticCurveTo(22, -34, 6, -40); }, undefined, lw() * 0.7);
    stitches(ctx, [[-26, -96], [-14, -94], [-4, -86], [-8, -72], [-22, -66], [-34, -68]]);
    stitches(ctx, [[10, -60], [22, -62], [34, -54], [32, -44], [18, -38], [8, -42]]);
    stitches(ctx, [[-4, -50], [4, -44], [2, -32]]);
    for (const [x1, y1, x2, y2] of [[-30, -70, -18, -42], [26, -90, 30, -64]]) { stroke(ctx, '#3a3a2a', lw() * 3, () => { ctx.moveTo(x1, y1); ctx.quadraticCurveTo(x1 - 8, (y1 + y2) / 2, x2, y2); }); stroke(ctx, acid, lw() * 1.6, () => { ctx.moveTo(x1, y1); ctx.quadraticCurveTo(x1 - 8, (y1 + y2) / 2, x2, y2); }); glow(ctx, x2, y2, 6, acid, 0.5); }
    stroke(ctx, '#8a8a94', lw() * 2.2, () => { ctx.arc(-6, -106, 8, Math.PI * 0.2, Math.PI * 1.1); }); stroke(ctx, '#8a8a94', lw() * 2.2, () => { ctx.moveTo(-12, -112); ctx.lineTo(-10, -100); });
    // Arms: two great ones and (unless lesser) two smaller from its sides, each a different beast's.
    const armSet = lesser ? [[-1, 0], [1, 0]] : [[-1, 1], [1, 1], [-1, 0], [1, 0]];
    for (const [sd, small] of armSet) {
      const col = small ? (sd > 0 ? f4 : f3) : (sd > 0 ? f2 : f1);
      const lift = Math.max(up, b.wind * (sd > 0 ? 1 : 0.5)) * (small ? 0.7 : 1), grab = reach * (small ? 1 : 0.6);
      const sh = { x: sd * (small ? 26 : 34), y: small ? -60 : -88 };
      const el = { x: sd * (small ? 40 : 50) + sd * grab * 6, y: lerp(small ? -48 : -64, small ? -84 : -112, lift) + grab * 10 };
      const hd = { x: sd * (small ? 44 : 46) + sd * grab * 14, y: lerp(small ? -30 : -36, small ? -100 : -138, lift) + grab * 26 + (sd > 0 && !small ? b.hit * 16 : 0) };
      chain(ctx, [sh, el, hd], small ? [6, 5, 4.4] : [11, 9.5, 8.4], col);
      stitches(ctx, [[sh.x, sh.y - 4], [lerp(sh.x, el.x, 0.5) + 3, lerp(sh.y, el.y, 0.5)], [el.x, el.y + 3]]);
      const fr = small ? 5 : 8.6;
      ell(ctx, hd.x, hd.y, fr, fr * 0.9, col);
      for (let k = 0; k < (small ? 3 : 4); k++) { const a = Math.PI / 2 + (k - 1.5) * 0.45 + (lift > 0.5 ? Math.PI : 0); const open = 0.6 + grab * 0.6; chain(ctx, [{ x: hd.x + Math.cos(a) * fr * 0.6, y: hd.y + Math.sin(a) * fr * 0.6 }, { x: hd.x + Math.cos(a) * fr * 1.2 * open, y: hd.y + Math.sin(a) * fr * 1.2 * open }, { x: hd.x + Math.cos(a + 0.4) * fr * 1.6 * open, y: hd.y + Math.sin(a + 0.4) * fr * 1.6 * open }], [fr * 0.26, fr * 0.22, fr * 0.16], col); }
    }
    // Heads: the great one in the middle (a grin of mismatched teeth, one eye bigger), small faces on its shoulder.
    const hy = -100, mouth = Math.max(surge(bile), b.hit * 0.6);
    ell(ctx, 4, hy, 15, 13, vgrad(ctx, hy - 13, hy + 13, shade(f1, 0.2), f2));
    stitches(ctx, [[-8, hy - 10], [0, hy - 4], [10, hy - 11]]);
    shape(ctx, '#2a0a10', () => { ctx.ellipse(4, hy + 5 + mouth * 2, 9, 3 + mouth * 5, 0.05, 0, TAU); }, null);
    for (let k = 0; k < 6; k++) { shape(ctx, k % 2 ? '#e8dcc0' : '#d8c890', () => { const x = -3 + k * 2.8; ctx.moveTo(x - 1, hy + 2 + mouth); ctx.lineTo(x, hy + 5 + mouth * 2 + (k % 3)); ctx.lineTo(x + 1, hy + 2 + mouth); }, undefined, lw() * 0.3); }
    if (mouth > 0.3) { glow(ctx, 4, hy + 8, 12, acid, mouth); drips(ctx, 4, hy + 12, 3, acid, t, 3); }
    eye(ctx, -2, hy - 3, 3.2, P.eye, 1, 1); eye(ctx, 11, hy - 4, 1.8, '#9ae8ff', 0, -1);
    if (!lesser) for (const [x, y, s] of [[-30, -86, 6], [32, -72, 5]]) { ell(ctx, x, y, s, s * 0.9, f4); eye(ctx, x - s * 0.3, y - s * 0.2, s * 0.22, P.eye, 0); eye(ctx, x + s * 0.3, y - s * 0.2, s * 0.22, P.eye, 0); stroke(ctx, dk, lw() * 0.8, () => { ctx.arc(x, y + s * 0.4, s * 0.35, 0.2, Math.PI - 0.2); }); }
    ctx.restore();
  }

  // ------------------------------------------------------------------ 11. The World-Eater
  function eater(ctx, P, look, A) {
    const t = A.t, m = A.m, b = blow(A.atk);
    const gr = mv(A, 'grab'), pu = mv(A, 'pull'), mo = mv(A, 'meteor'), sw = mv(A, 'sweep'), sh = mv(A, 'shockwave');
    const flesh = P.skin, dk = shade(flesh, -0.5), lt = shade(flesh, 0.35), vio = look.trim, gold = P.eye;
    const hover = -64 + Math.sin(t * 0.9) * 4;
    const squeeze = surge(sh);
    ell(ctx, 0, 0, 56, 12, 'rgba(0,0,0,0.3)', null);
    // Tentacles down to the ground and out, writhing; they lash forward to grab.
    const lash = surge(gr);
    for (let i = 0; i < 8; i++) {
      const sd = i % 2 ? 1 : -1, j = Math.floor(i / 2), base = { x: sd * (10 + j * 10), y: hover + 18 };
      const pts = [];
      for (let k = 0; k <= 9; k++) { const q = k / 9; const wav = Math.sin(t * 2.2 + i + q * 4) * 8 * q; pts.push({ x: base.x + sd * q * (20 + j * 12) + wav + sd * lash * q * q * 20, y: base.y + q * (-hover - 14 + j * 3) + lash * q * q * 18 }); }
      chain(ctx, pts, pts.map((_, k) => 7 - k * 0.6), i % 3 ? flesh : dk);
      pts.forEach((p, k) => { if (k > 1 && k < 9 && k % 2) ell(ctx, p.x - sd * 2, p.y + 1, 1.6, 1.3, '#e8c8d8', undefined, 0, lw() * 0.4); });
    }
    ctx.save(); ctx.translate(0, hover);
    ctx.scale(1 - squeeze * 0.08, 1 + squeeze * 0.06);
    // Horns crowning it, curving up.
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32, r0 = 40, x0 = Math.cos(a) * r0, y0 = Math.sin(a) * r0 * 0.9 - 6; chain(ctx, [{ x: x0, y: y0 }, { x: x0 * 1.3, y: y0 * 1.25 - 6 }, { x: x0 * 1.45 + (i - 3) * 2, y: y0 * 1.55 - 12 }], [4.4, 3, 1], '#2a2030'); }
    // The body: a great orb of dark flesh, veined, studded with eyes that open as it weakens.
    ell(ctx, 0, -6, 44, 40, rgrad(ctx, 0, -6, 46, lt, dk));
    stroke(ctx, rgba(vio, 0.45), lw() * 1.2, () => { for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.moveTo(Math.cos(a) * 12, -6 + Math.sin(a) * 10); ctx.quadraticCurveTo(Math.cos(a + 0.4) * 28, -6 + Math.sin(a + 0.4) * 24, Math.cos(a + 0.2) * 40, -6 + Math.sin(a + 0.2) * 36); } });
    const eyes = [[-26, -26, 3.2], [24, -30, 3.6], [-34, -2, 2.6], [34, 4, 2.8], [-18, -36, 2.2], [14, -40, 2.4], [-30, 14, 2.2], [28, 20, 2], [0, -42, 2.6], [-8, -32, 1.8]];
    const open = 4 + (m.phase || 0) * 2;
    eyes.forEach(([x, y, r], i) => { const lid = i < open ? 1 : 0.15; const blink = Math.sin(t * 0.7 + i * 2.3) > 0.97 ? 0.1 : 1; ell(ctx, x, y, r * 1.3, r * 1.1, dk); ell(ctx, x, y, r, r * lid * blink, gold, null); if (lid * blink > 0.5) ell(ctx, x, y, r * 0.25, r * 0.8, '#0a0408', null); });
    // The maw: a vertical slit of teeth down its middle, opening wide to pull; a beam eye above it.
    const maw = 0.4 + surge(pu) * 1.0 + b.hit * 0.4 + surge(mo) * 0.3;
    shape(ctx, '#0a0410', () => { ctx.ellipse(0, 2, 7 + maw * 10, 22 + maw * 4, 0, 0, TAU); }, '#000000');
    glow(ctx, 0, 2, 20 * maw, vio, 0.5);
    for (let k = 0; k < 9; k++) for (const sd of [-1, 1]) { const y = -16 + k * 4.4, x = sd * (6 + maw * 9) * Math.cos((y - 2) / 26); shape(ctx, '#f0e4d0', () => { ctx.moveTo(x, y - 1.6); ctx.lineTo(x - sd * (3 + maw), y); ctx.lineTo(x, y + 1.6); }, undefined, lw() * 0.3); }
    if (pu.on) for (let k = 0; k < 3; k++) { ctx.globalAlpha = 0.5; stroke(ctx, '#8a9aff', lw() * 1.2, () => { ctx.arc(0, 2, 10 + k * 7, t * 3 + k, t * 3 + k + 3.6); }); ctx.globalAlpha = 1; }
    const beam = surge(sw) + (sw.on && m.stage === 'act' ? 1 : 0);
    ell(ctx, 0, -24, 7, 6, '#1a0a20'); ell(ctx, 0, -24, 5, 4.4, rgrad(ctx, 0, -24, 5, '#ffffff', vio), null);
    glow(ctx, 0, -24, 10 + beam * 18, vio, 0.6 + beam * 0.3);
    ctx.restore();
    // Moons circling it (they fall as meteors).
    for (let i = 0; i < 3; i++) {
      const a = t * (0.5 + i * 0.15) + i * 2.1, r = 64 + i * 8, x = Math.cos(a) * r, y = hover - 6 + Math.sin(a) * r * 0.3, front = Math.sin(a) > 0;
      if (!front) continue;
      const mr = 6 - i;
      ell(ctx, x, y, mr, mr, rgrad(ctx, x, y, mr, '#d8d0e8', '#5a5070'));
      ell(ctx, x - mr * 0.3, y + mr * 0.2, mr * 0.25, mr * 0.2, '#4a4060', null);
      if (surge(mo) > 0.3) glow(ctx, x, y, mr * 3, '#ffe27a', surge(mo) * 0.6);
    }
  }

  // ------------------------------------------------------------------ the egg clutch
  function egg(ctx, P, look, A) {
    const t = A.t, m = A.m, k = m.hatch || 0;
    const shellC = P.skin, vein = look.trim;
    ell(ctx, 0, 0, 20, 5, 'rgba(0,0,0,0.25)', null);
    stroke(ctx, 'rgba(230,230,240,0.55)', H.LW * 0.7, () => { for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI; ctx.moveTo(0, -4); ctx.lineTo(Math.cos(a) * 22, -Math.sin(a) * 10 - 2); } ctx.ellipse(0, -4, 14, 5, 0, 0, TAU); ctx.ellipse(0, -4, 20, 8, 0, 0, TAU); });
    const wob = k > 0.7 ? Math.sin(t * 30) * (k - 0.7) * 4 : 0;
    for (const [x, y, r, i] of [[-8, -10, 8, 0], [8, -11, 8.5, 1], [0, -20, 9, 2]]) {
      ctx.save(); ctx.translate(x + (i === 1 ? wob : -wob * 0.5), y); ctx.rotate(wob * 0.04);
      ell(ctx, 0, 0, r * 0.82, r, vgrad(ctx, -r, r, shade(shellC, 0.2), shade(shellC, -0.25)));
      glow(ctx, 0, 1, r * (0.8 + k), vein, 0.25 + k * 0.5);
      stroke(ctx, rgba(vein, 0.5 + k * 0.4), H.LW * 0.8, () => { ctx.moveTo(-r * 0.5, -r * 0.6); ctx.quadraticCurveTo(-r * 0.1, -r * 0.1, -r * 0.4, r * 0.6); ctx.moveTo(r * 0.3, -r * 0.7); ctx.quadraticCurveTo(r * 0.6, 0, r * 0.2, r * 0.7); });
      if (k > 0.35) { ctx.globalAlpha = (k - 0.35) * 1.2; for (const sd of [-1, 1]) stroke(ctx, '#1a1418', H.LW * 0.8, () => { ctx.moveTo(sd * 1.5, 0); ctx.lineTo(sd * 5, -3); ctx.moveTo(sd * 1.5, 1.5); ctx.lineTo(sd * 5.4, 2); ctx.moveTo(sd * 1.5, 3); ctx.lineTo(sd * 4.4, 6); }); ell(ctx, 0, 1.5, 2.6, 3.4, '#1a1418', null); ctx.globalAlpha = 1; }
      if (k > 0.75) stroke(ctx, '#2a1a10', H.LW, () => { ctx.moveTo(-r * 0.3, -r * 0.8); ctx.lineTo(-r * 0.05, -r * 0.45); ctx.lineTo(-r * 0.25, -r * 0.2); ctx.lineTo(r * 0.1, r * 0.1); });
      ctx.restore();
    }
  }

  Object.assign(MUTANT_ART.ARTS, { worm, spider, moth, magma, leviathan, bull, scorpion, warden, lich, abom, eater, egg });
  // Each drawn about 80 to 110 tall: brought to the same scale as World 7's.
  Object.assign(MUTANT_ART.FIT, { worm: 0.62, spider: 0.72, moth: 0.69, magma: 0.5, leviathan: 0.52, bull: 0.76, scorpion: 0.6, warden: 0.67, lich: 0.66, abom: 0.6, eater: 0.56 });
  // (The fliers draw their own shadow on the ground below them.)
  Object.assign(MUTANT_ART.SHADOW, { egg: 12, moth: 0.01, leviathan: 0.01, warden: 0.01, eater: 0.01 });
})();
