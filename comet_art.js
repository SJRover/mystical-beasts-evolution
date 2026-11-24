/**
 * Merge Beasts 1.5: the Interstellar Comet's beasts, drawn (Sam, 23 Nov: as detailed and animated
 * as World 7's bosses, true alien beasts, some glowing in ever-changing colours).
 *
 * Each species is one creature that grows through four stages as it climbs its tiers: 1 hatchling,
 * 2 young, 3 adult, 4 ascended. Drawn facing you, feet at (0, 0), about 80 tall when ascended (each
 * stage smaller and simpler), every limb, neck and tail one joined shape (MUTANT_ART's tools).
 * Animated from pose: t (time), walk (distance walked), atk (a blow, 0 to 1 or -1), sp (a special,
 * 0 to 1 or -1).
 *
 * COMET_ART.draw(ctx, id, stage, pose, size): size is how many pixels an ascended one stands.
 */
const COMET_ART = (() => {
  const TAU = Math.PI * 2;
  let h = null;
  const hsl = (hue, s, l, a = 1) => `hsla(${((hue % 360) + 360) % 360},${s}%,${l}%,${a})`;
  /** A strike's reach: in fast, back slower (0 to 1). */
  const strikeK = (atk) => (atk < 0 ? 0 : atk < 0.45 ? -0.25 * (atk / 0.45) : Math.sin(Math.min(1, (atk - 0.45) / 0.55) * Math.PI));
  /** A crystal: a long six-sided gem. */
  function crystal(ctx, x, y, w, len, col, rot = 0, line = true) {
    const { shape, vgrad } = h;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    shape(ctx, vgrad(ctx, -len, 0, '#ffffff', col), () => { ctx.moveTo(-w, 0); ctx.lineTo(-w, -len * 0.7); ctx.lineTo(0, -len); ctx.lineTo(w, -len * 0.7); ctx.lineTo(w, 0); }, line ? undefined : null);
    h.stroke(ctx, 'rgba(255,255,255,0.7)', h.LW * 0.8, () => { ctx.moveTo(-w * 0.3, -len * 0.15); ctx.lineTo(-w * 0.3, -len * 0.7); });
    ctx.restore();
  }
  /** A coil of body lying on the ground (two loops), one smooth shape. */
  function coil(ctx, cx, cy, R, w, skin, dk, belly, sc, t) {
    for (let ring = 0; ring < 2; ring++) {
      const r = R - ring * 5, y = cy - ring * 4.4, ww = w - ring * 0.8;
      const loop = () => { ctx.beginPath(); ctx.ellipse(cx, y, r, r * 0.38, 0, 0, TAU); };
      loop(); ctx.strokeStyle = '#1c1426'; ctx.lineWidth = ww * 2 + h.LW * 2; ctx.stroke();
      loop(); ctx.strokeStyle = ring ? skin : dk; ctx.lineWidth = ww * 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, y - ww * 0.35, r, r * 0.38, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.strokeStyle = h.HI; ctx.lineWidth = ww * 0.6; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, y + ww * 0.3, r, r * 0.38, 0, 0.15, Math.PI - 0.15); ctx.strokeStyle = belly; ctx.lineWidth = ww * 0.7; ctx.stroke();
      ctx.strokeStyle = sc; ctx.lineWidth = h.LW * 0.7;
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + (t || 0) * 0.2; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, y + Math.sin(a) * r * 0.38 - ww * 0.3, ww * 0.3, 0.3, Math.PI - 0.3); ctx.stroke(); }
    }
  }

  // ------------------------------------------------------------------ Emerald Serpent (Super Rare)
  /** A jade serpent with a jewelled hood and crystal horns; its gems drift green to teal when ascended. */
  function emeraldSerpent(ctx, A) {
    const { shape, ell, stroke, vgrad, tube, glow, eye, lerp } = h;
    const { t, st } = A;
    const skin = '#1e9a5a', dk = '#0e5a34', lt = '#4ad08a', belly = '#d0f4c8', sc = 'rgba(0,40,20,0.45)';
    const gem = st >= 4 ? hsl(150 + 28 * Math.sin(t * 1.4), 95, 62) : '#6affb4';
    const k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const sway = Math.sin(t * 1.6) * 4;
    coil(ctx, 0, -6, 18, 5.6, skin, dk, belly, sc, t);
    const hx = sway + k * 3, hy = -60 + k * 14 - sp * 4;
    const pts = [];
    for (let i = 0; i <= 10; i++) { const q = i / 10; pts.push({ x: Math.sin(q * 3 + t * 1.6) * 6 * (1 - q) + lerp(4, hx, q), y: lerp(-10, hy + 9, q) }); }
    // The hood, spread behind the head, jewelled; it flares as it strikes.
    if (st >= 2) {
      const fl = 1 + Math.max(k, sp) * 0.3;
      shape(ctx, vgrad(ctx, hy - 16, hy + 24, lt, dk), () => { ctx.moveTo(hx - 3, hy + 24); ctx.bezierCurveTo(hx - 18 * fl, hy + 16, hx - 21 * fl, hy - 8, hx, hy - 13); ctx.bezierCurveTo(hx + 21 * fl, hy - 8, hx + 18 * fl, hy + 16, hx + 3, hy + 24); });
      stroke(ctx, 'rgba(0,50,25,0.5)', h.LW, () => { for (let r = -2; r <= 2; r++) { ctx.moveTo(hx + r * 1.4, hy + 18); ctx.quadraticCurveTo(hx + r * 6 * fl, hy + 4, hx + r * 7.6 * fl, hy - 6); } });
      for (const [dx, dy, s] of [[-11, 2, 2.2], [11, 2, 2.2], [-7, -5, 1.7], [7, -5, 1.7], [-12, 11, 1.6], [12, 11, 1.6]]) { glow(ctx, hx + dx * fl, hy + dy, s * 3, gem, 0.5); shape(ctx, gem, () => { ctx.moveTo(hx + dx * fl, hy + dy - s); ctx.lineTo(hx + dx * fl + s * 0.7, hy + dy); ctx.lineTo(hx + dx * fl, hy + dy + s); ctx.lineTo(hx + dx * fl - s * 0.7, hy + dy); }); }
    }
    tube(ctx, pts, pts.map((_, i) => 6.4 - i * 0.22), skin, belly, sc);
    // Crystal horns swept back (adult on), a crown of them when ascended.
    if (st >= 3) for (const sd of [-1, 1]) crystal(ctx, hx + sd * 4.4, hy - 5, 1.4, 11, gem, sd * 0.55);
    if (st >= 4) for (let i = -1; i <= 1; i++) crystal(ctx, hx + i * 2.6, hy - 7.4, 1.1, 7 + (i ? 0 : 3), gem, i * 0.25);
    // The head: wedge-shaped, scaled, golden slit eyes; the jaw drops as it strikes; the tongue flicks.
    const open = Math.max(k, sp * 0.8);
    shape(ctx, '#0a4a2a', () => { ctx.moveTo(hx - 4.4, hy + 3); ctx.lineTo(hx - 3.4, hy + 8 + open * 6); ctx.lineTo(hx + 3.4, hy + 8 + open * 6); ctx.lineTo(hx + 4.4, hy + 3); });
    if (open > 0.2) { shape(ctx, '#ffffff', () => { ctx.moveTo(hx - 3, hy + 4); ctx.lineTo(hx - 2.4, hy + 6.4 + open * 2); ctx.lineTo(hx - 1.8, hy + 4); }, null); shape(ctx, '#ffffff', () => { ctx.moveTo(hx + 3, hy + 4); ctx.lineTo(hx + 2.4, hy + 6.4 + open * 2); ctx.lineTo(hx + 1.8, hy + 4); }, null); }
    else if (Math.sin(t * 3.1) > 0.55) stroke(ctx, '#ff4a6a', h.LW * 1.2, () => { const L = 7 + Math.sin(t * 24) * 1.5; ctx.moveTo(hx, hy + 7); ctx.lineTo(hx, hy + 7 + L); ctx.lineTo(hx - 1.6, hy + 9 + L); ctx.moveTo(hx, hy + 7 + L); ctx.lineTo(hx + 1.6, hy + 9 + L); });
    shape(ctx, vgrad(ctx, hy - 9, hy + 8, lt, skin), () => { ctx.moveTo(hx - 7.4, hy - 1); ctx.quadraticCurveTo(hx - 7, hy - 9.4, hx, hy - 9.6); ctx.quadraticCurveTo(hx + 7, hy - 9.4, hx + 7.4, hy - 1); ctx.quadraticCurveTo(hx + 5.4, hy + 7, hx, hy + 8); ctx.quadraticCurveTo(hx - 5.4, hy + 7, hx - 7.4, hy - 1); });
    stroke(ctx, sc, h.LW * 0.7, () => { for (const [x, y] of [[-3, -6], [0, -7], [3, -6], [-1.5, -4], [1.5, -4]]) { ctx.moveTo(hx + x + 1.2, hy + y); ctx.arc(hx + x, hy + y, 1.2, 0, Math.PI); } });
    ell(ctx, hx - 1.4, hy + 5.4, 0.5, 0.35, '#0a2a1a', null); ell(ctx, hx + 1.4, hy + 5.4, 0.5, 0.35, '#0a2a1a', null);
    eye(ctx, hx - 3.6, hy - 1.6, 1.8, '#ffd23a', 0, 1, true); eye(ctx, hx + 3.6, hy - 1.6, 1.8, '#ffd23a', 0, -1, true);
    // Ascended: three shards circling it.
    if (st >= 4) for (let i = 0; i < 3; i++) { const a = t * 0.9 + (i * TAU) / 3, x = Math.cos(a) * 24, y = -44 + Math.sin(a) * 7; if (Math.sin(a) < 0) continue; glow(ctx, x, y, 7, gem, 0.5); crystal(ctx, x, y + 4, 1.4, 8, gem, Math.cos(a) * 0.4); }
  }

  // ------------------------------------------------------------------ Onyx Wyrm (Ultra Rare)
  /**
   * A great serpent-dragon of glossy black stone, rearing up from its coils on four clawed legs,
   * molten amber glowing in its cracks; ascended, an ember mane and shards of obsidian about it.
   */
  function onyxWyrm(ctx, A) {
    const { shape, ell, stroke, vgrad, tube, chain, glow, eye, paw, gait, steam } = h;
    const { t, st } = A;
    const g = gait(A, 1.1), k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const skin = '#2e2838', lt = '#7a7298', belly = '#5a4a44', sc = 'rgba(190,180,230,0.3)';
    const heat = 0.6 + 0.35 * Math.sin(t * 2.6) + sp * 0.5 + (st >= 4 ? 0.2 : 0);
    const lava = `rgba(255,${150 + Math.round(60 * Math.sin(t * 2.6))},40,${Math.min(1, heat)})`;
    const spike = (x, y, len, rot) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); shape(ctx, vgrad(ctx, -len, 0, '#a8a2c8', '#1a1422'), () => { ctx.moveTo(-1.8, 0); ctx.lineTo(0, -len); ctx.lineTo(1.8, 0); }); ctx.restore(); };
    // The tail sweeping out to one side, spiked at its tip.
    const tail = [];
    for (let i = 0; i <= 10; i++) { const q = i / 10; tail.push({ x: 10 + q * 24 + Math.sin(t * 1.3 + q * 3) * 3 * q, y: -6 - q * 10 + Math.sin(q * Math.PI) * -6 }); }
    tube(ctx, tail, tail.map((_, i) => 5 - i * 0.4), skin, belly, sc);
    { const e = tail[10]; for (let i = -1; i <= 1; i++) spike(e.x, e.y, 6, 0.9 + i * 0.5); }
    // Hind legs at the coil, the coil on the ground.
    for (const sd of [-1, 1]) { const lift = Math.max(0, sd * -g.s) * 3; chain(ctx, [{ x: sd * 13, y: -12 }, { x: sd * 19, y: -7 - lift }, { x: sd * 18, y: -2.4 - lift }], [4.4, 3.6, 2.8], skin); paw(ctx, sd * 18.4, -0.6 - lift, 3.4, skin, '#e8d8b0', 3); }
    coil(ctx, 0, -7, 15, 6.4, skin, '#1a1422', belly, sc, t);
    // The body rearing up in an S to its chest and neck.
    const hx = k * 3, hy = -50 + k * 10 - sp * 3;
    const body = [];
    for (let i = 0; i <= 10; i++) { const q = i / 10; body.push({ x: Math.sin(q * 3.4 + t * 1.2) * 6 * (1 - q) + hx * q, y: -12 - q * 34 + k * q * 8 }); }
    body.forEach((p, i) => { if (st >= 3 && i % 2 === 0 && i < 10) spike(p.x + 4, p.y - 3, 5 + st, 0.7); });
    tube(ctx, body, body.map((_, i) => 8.6 - i * 0.32), skin, belly, sc);
    body.forEach((p, i) => { if (i % 2 || i > 9) return; const r = 8.6 - i * 0.32; stroke(ctx, lava, h.LW * 1.3, () => { ctx.moveTo(p.x - r * 0.7, p.y - r * 0.2); ctx.lineTo(p.x - r * 0.2, p.y + r * 0.25); ctx.lineTo(p.x + r * 0.35, p.y - r * 0.25); }); });
    // Forelegs from the chest: thick, scaled, claws of pale bone.
    for (const sd of [-1, 1]) { const f = sd > 0 ? { x: 20 + k * 6, y: -10 - k * 10 } : { x: -20, y: -5 }; chain(ctx, [{ x: hx * 0.6 + sd * 6.5, y: -32 }, { x: sd * 17, y: -24 }, f], [4.2, 3.4, 2.8], skin); paw(ctx, f.x, f.y + 2.2, 3.4, skin, '#e8d8b0', 3); }
    // An ember mane when ascended.
    if (st >= 4) { glow(ctx, hx, hy - 4, 24, '#ff8a2a', 0.35); for (let i = 0; i < 9; i++) { const a2 = -Math.PI * 0.95 + (i / 8) * Math.PI * 0.9; shape(ctx, lava, () => { ctx.moveTo(hx + Math.cos(a2) * 7, hy - 2 + Math.sin(a2) * 6); ctx.lineTo(hx + Math.cos(a2) * (15 + Math.sin(t * 7 + i) * 1.6), hy - 2 + Math.sin(a2) * 13); ctx.lineTo(hx + Math.cos(a2 + 0.18) * 7, hy - 2 + Math.sin(a2 + 0.18) * 6); }, null); } }
    // Horns of obsidian sweeping back (young on), a pair more when adult.
    if (st >= 2) for (const sd of [-1, 1]) { shape(ctx, vgrad(ctx, hy - 22, hy, '#a8a2c8', '#1a1422'), () => { ctx.moveTo(hx + sd * 4.6, hy - 5); ctx.quadraticCurveTo(hx + sd * 12, hy - 12, hx + sd * 11, hy - 20 - st * 1.4); ctx.quadraticCurveTo(hx + sd * 8, hy - 11, hx + sd * 2.6, hy - 7); }); if (st >= 3) spike(hx + sd * 7.4, hy - 1, 6, sd * 1.2); }
    // The head: a long wedge of a dragon's head, glossy, amber-eyed, jaws aglow when it strikes.
    const open = Math.max(k, sp);
    shape(ctx, '#1a1422', () => { ctx.moveTo(hx - 5.4, hy + 3); ctx.lineTo(hx - 4.4, hy + 10 + open * 6); ctx.lineTo(hx + 4.4, hy + 10 + open * 6); ctx.lineTo(hx + 5.4, hy + 3); });
    if (open > 0.2) { glow(ctx, hx, hy + 7, 14 * open, '#ff8a2a', 0.85); shape(ctx, '#ffcf6a', () => { ctx.moveTo(hx - 3.4, hy + 5); ctx.lineTo(hx, hy + 9 + open * 5); ctx.lineTo(hx + 3.4, hy + 5); }, null); for (const sd of [-1, 1]) shape(ctx, '#ffffff', () => { ctx.moveTo(hx + sd * 3.6, hy + 4.6); ctx.lineTo(hx + sd * 3.1, hy + 7.4); ctx.lineTo(hx + sd * 2.6, hy + 4.6); }, null); }
    shape(ctx, vgrad(ctx, hy - 10, hy + 7, lt, skin), () => { ctx.moveTo(hx - 8, hy - 3); ctx.quadraticCurveTo(hx, hy - 11, hx + 8, hy - 3); ctx.lineTo(hx + 5.6, hy + 6); ctx.quadraticCurveTo(hx, hy + 8.6, hx - 5.6, hy + 6); });
    stroke(ctx, 'rgba(255,255,255,0.45)', h.LW * 1.2, () => { ctx.moveTo(hx - 4.4, hy - 7); ctx.quadraticCurveTo(hx, hy - 9, hx + 3.4, hy - 7.4); });
    stroke(ctx, lava, h.LW * 1.1, () => { ctx.moveTo(hx - 6.4, hy + 1); ctx.lineTo(hx - 3.4, hy + 2.6); ctx.moveTo(hx + 6.4, hy + 1); ctx.lineTo(hx + 3.4, hy + 2.6); ctx.moveTo(hx, hy - 9); ctx.lineTo(hx + 0.6, hy - 5.6); });
    eye(ctx, hx - 3.8, hy - 2.6, 1.7, '#ffb43a', 1, 1, true); eye(ctx, hx + 3.8, hy - 2.6, 1.7, '#ffb43a', 1, -1, true);
    ell(ctx, hx - 1.6, hy + 4.4, 0.6, 0.45, '#ff8a2a', null); ell(ctx, hx + 1.6, hy + 4.4, 0.6, 0.45, '#ff8a2a', null);
    steam(ctx, hx - 1.6, hy + 3.4, t, '#6a6070', 2); steam(ctx, hx + 1.6, hy + 3.4, t + 0.5, '#6a6070', 2);
    if (st >= 4) for (let i = 0; i < 4; i++) { const a2 = t * 0.8 + i * 1.57, x = Math.cos(a2) * 30, y = -38 + Math.sin(a2) * 8; if (Math.sin(a2) < 0) continue; shape(ctx, vgrad(ctx, y - 7, y + 5, '#a8a2c8', '#1a1422'), () => { ctx.moveTo(x, y - 7); ctx.lineTo(x + 3.4, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 3.4, y); }); glow(ctx, x, y, 6, '#ff8a2a', 0.45); }
  }

  // ------------------------------------------------------------------ Gilded Leafwing (Legendary)
  /** A miniature dragon with wings of golden leaves; ascended, its leaves turn through the colours of autumn. */
  function leaf(ctx, x, y, len, wid, rot, col, vein) {
    const { shape, stroke } = h;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    shape(ctx, col, () => { ctx.moveTo(0, 0); ctx.quadraticCurveTo(wid, -len * 0.45, 0, -len); ctx.quadraticCurveTo(-wid, -len * 0.45, 0, 0); });
    stroke(ctx, vein, h.LW * 0.7, () => { ctx.moveTo(0, -len * 0.05); ctx.lineTo(0, -len * 0.92); for (let i = 1; i < 4; i++) { const y = -len * (0.2 + i * 0.18); ctx.moveTo(0, y); ctx.lineTo(wid * 0.45, y - len * 0.08); ctx.moveTo(0, y); ctx.lineTo(-wid * 0.45, y - len * 0.08); } });
    ctx.restore();
  }
  function gildedLeafwing(ctx, A) {
    const { shape, ell, stroke, vgrad, chain, tube, glow, eye, paw, lerp, gait } = h;
    const { t, st } = A;
    const g = gait(A, 1.4), k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const hover = st >= 3 ? 8 + Math.sin(t * 2.2) * 2.5 : 0;
    const flap = Math.sin(t * (st >= 3 ? 7 : 3)) * (st >= 3 ? 0.35 : 0.12) + sp * 0.5;
    const autumn = (i) => (st >= 4 ? hsl(44 - 30 * (0.5 + 0.5 * Math.sin(t * 0.8 + i * 0.5)), 90, 55) : i % 3 ? '#e8b830' : '#d4a020');
    const body = '#c89a2a', dk = '#8a6a18', lt = '#f4d870', belly = '#f8eab0';
    // Leaves drifting down about it (adult on).
    if (st >= 3) for (let i = 0; i < 4; i++) { const q = (t * 0.25 + i / 4) % 1; leaf(ctx, Math.sin(i * 2.3 + t) * 26, -70 + q * 72, 5, 2.4, t * 2 + i, autumn(i), 'rgba(120,80,0,0.6)'); }
    ctx.save(); ctx.translate(0, -hover);
    // The tail, curling behind, ending in a leaf.
    const tail = [];
    for (let i = 0; i <= 8; i++) { const q = i / 8; tail.push({ x: Math.sin(t * 1.5 + q * 3) * 4 * q + 12 * q, y: -14 - q * 22 + Math.sin(q * Math.PI) * -4 }); }
    tube(ctx, tail, tail.map((_, i) => 3.6 - i * 0.3), body, belly, 'rgba(90,60,0,0.4)');
    leaf(ctx, tail[8].x, tail[8].y, 9, 4.6, -0.6 + Math.sin(t * 1.5) * 0.3, autumn(9), 'rgba(120,80,0,0.6)');
    // Wings of overlapping golden leaves on a vine of bone.
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(sd * 5, -30); ctx.scale(sd, 1); ctx.rotate(-0.35 - flap);
      const n = 3 + st;
      stroke(ctx, '#6a4a10', 1.6, () => { ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -14, 22 + st * 2, -12); });
      for (let i = 0; i < n; i++) { const q = i / (n - 1), x = lerp(2, 22 + st * 2, q), y = lerp(-2, -12, q) - Math.sin(q * Math.PI) * 4; leaf(ctx, x, y, 9 + st * 1.6 + Math.sin(q * Math.PI) * 4, 3.6 + st * 0.4, 2.6 - q * 1.4, autumn(i + (sd > 0 ? 5 : 0)), 'rgba(120,80,0,0.6)'); }
      ctx.restore();
    }
    // Hind legs and feet, then the body, then the forelegs.
    for (const sd of [-1, 1]) { const lift = st >= 3 ? 2 : Math.max(0, sd * g.s) * 3; chain(ctx, [{ x: sd * 5, y: -14 }, { x: sd * 8.6, y: -8 - lift }, { x: sd * 7.4, y: -3 - lift }], [3.2, 2.4, 1.8], body); paw(ctx, sd * 7.8, -1 - lift, 2.6, body, '#fff4d0', 3); }
    shape(ctx, vgrad(ctx, -38, -10, lt, dk), () => { ctx.moveTo(-8, -12); ctx.bezierCurveTo(-12, -22, -10, -34, -4, -37); ctx.quadraticCurveTo(0, -38.6, 4, -37); ctx.bezierCurveTo(10, -34, 12, -22, 8, -12); ctx.quadraticCurveTo(0, -9, -8, -12); });
    for (let r = 0; r < 4; r++) ell(ctx, 0, -15 - r * 5, 3.4 - Math.abs(r - 1.5) * 0.5, 1.6, belly, 'rgba(120,80,0,0.6)');
    h.scales(ctx, -8, -34, -3, -14, 2.2, 'rgba(120,80,0,0.4)'); h.scales(ctx, 3, -34, 8, -14, 2.2, 'rgba(120,80,0,0.4)');
    for (const sd of [-1, 1]) { const f = sd > 0 ? { x: 9 + k * 4, y: -18 - k * 6 } : { x: -9, y: -18 }; chain(ctx, [{ x: sd * 6, y: -30 }, { x: sd * 9.6, y: -24 }, f], [2.4, 2, 1.6], body); paw(ctx, f.x, f.y + 1.6, 2.2, body, '#fff4d0', 3); }
    // The neck, then the head: vine horns curling back, a leaf crest; big green eyes.
    const hx = k * 2, hy = -52 + k * 4;
    tube(ctx, [{ x: 0, y: -33 }, { x: hx * 0.5, y: -40 }, { x: hx, y: hy + 5 }], [4.2, 3.6, 3.2], body, belly, null);
    for (const sd of [-1, 1]) { stroke(ctx, '#5a7a1a', 1.6, () => { ctx.moveTo(hx + sd * 3.6, hy - 5); ctx.bezierCurveTo(hx + sd * 9, hy - 12, hx + sd * 13, hy - 6, hx + sd * 10, hy - 3); }); if (st >= 2) leaf(ctx, hx + sd * 10, hy - 3, 5, 2.4, sd * 1.9, autumn(12 + sd), 'rgba(120,80,0,0.6)'); }
    if (st >= 3) for (let i = -1; i <= 1; i++) leaf(ctx, hx + i * 2.6, hy - 6.6, 6 + (i ? 0 : 2.4), 2.6, i * 0.4, autumn(20 + i), 'rgba(120,80,0,0.6)');
    // A dragon's head: a golden snout, scaled brow, little fangs, big green eyes.
    const open = Math.max(k, sp);
    shape(ctx, '#8a5a10', () => { ctx.moveTo(hx - 4, hy + 2); ctx.lineTo(hx - 3.2, hy + 7 + open * 4); ctx.lineTo(hx + 3.2, hy + 7 + open * 4); ctx.lineTo(hx + 4, hy + 2); });
    if (open > 0.2) shape(ctx, '#c83a2a', () => { ctx.moveTo(hx - 2.4, hy + 4); ctx.lineTo(hx, hy + 6.6 + open * 3); ctx.lineTo(hx + 2.4, hy + 4); }, null);
    shape(ctx, vgrad(ctx, hy - 9, hy + 7, lt, body), () => { ctx.moveTo(hx - 7.4, hy - 1); ctx.quadraticCurveTo(hx - 7, hy - 9, hx, hy - 9.4); ctx.quadraticCurveTo(hx + 7, hy - 9, hx + 7.4, hy - 1); ctx.quadraticCurveTo(hx + 6, hy + 3, hx + 4.4, hy + 6.6); ctx.quadraticCurveTo(hx, hy + 8.4, hx - 4.4, hy + 6.6); ctx.quadraticCurveTo(hx - 6, hy + 3, hx - 7.4, hy - 1); });
    h.scales(ctx, hx - 5, hy - 8, hx + 5, hy - 4, 2, 'rgba(120,80,0,0.45)');
    ell(ctx, hx, hy + 4.4, 4.2, 2.6, '#f8e4a0', null);
    ell(ctx, hx - 1.5, hy + 3.4, 0.55, 0.4, '#5a3a00', null); ell(ctx, hx + 1.5, hy + 3.4, 0.55, 0.4, '#5a3a00', null);
    for (const sd of [-1, 1]) shape(ctx, '#ffffff', () => { ctx.moveTo(hx + sd * 2.6, hy + 6.2); ctx.lineTo(hx + sd * 2.2, hy + 8 + open * 1.4); ctx.lineTo(hx + sd * 1.8, hy + 6.2); }, h.LW ? undefined : null, h.LW * 0.5);
    for (const sd of [-1, 1]) stroke(ctx, '#8a6a18', h.LW * 1.4, () => { ctx.moveTo(hx + sd * 5.6, hy - 5.2); ctx.lineTo(hx + sd * 1.4, hy - 3.6); });
    eye(ctx, hx - 3.4, hy - 1.6, 2, '#5aff6a'); eye(ctx, hx + 3.4, hy - 1.6, 2, '#5aff6a');
    if (sp > 0.1) { glow(ctx, hx, hy + 6, 16 * sp, '#ffe066', 0.7); for (let i = 0; i < 6; i++) leaf(ctx, hx + Math.cos(i) * 14 * sp, hy + 8 + Math.sin(i) * 8 * sp, 5, 2.4, i, autumn(i), 'rgba(120,80,0,0.6)'); }
    ctx.restore();
  }

  // ------------------------------------------------------------------ Grey Envoy (Super Rare)
  /** An alien of the old stories: a great head, eyes like night, a psionic orb floating between its hands. */
  function greyEnvoy(ctx, A) {
    const { shape, ell, stroke, vgrad, rgrad, chain, glow, foot, lerp, gait } = h;
    const { t, st } = A;
    const g = gait(A, 1), k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const skin = '#a8b4c4', dk = '#6a7688', lt = '#d8e0ea', suit = '#c8ccd8', line = '#3af6ff';
    const lev = st >= 3 ? 6 + Math.sin(t * 2) * 2 : 0;
    const orbCol = hsl(275 + 30 * Math.sin(t * 1.3), 90, 65);
    if (st >= 3) for (let r = 1; r <= 2; r++) { ctx.globalAlpha = 0.5 / r; stroke(ctx, orbCol, h.LW * 1.2, () => { ctx.ellipse(0, -1 - lev * 0.3, 10 + r * 6 + Math.sin(t * 3) * 1.5, (10 + r * 6) * 0.3, 0, 0, TAU); }); ctx.globalAlpha = 1; }
    ctx.save(); ctx.translate(0, -lev);
    // Thin legs, three-toed feet (tucked as it floats).
    for (const sd of [-1, 1]) { const lift = lev ? 3 : Math.max(0, sd * g.s) * 2.6; chain(ctx, [{ x: sd * 3, y: -20 }, { x: sd * 4, y: -11 - lift * 0.5 }, { x: sd * 3.6, y: -2.6 - lift }], [1.8, 1.5, 1.2], skin); foot(ctx, sd * 3.8, -1 - lift, 2.4, skin, '#8a96a8', 3); }
    // A slim body in a fitted suit with glowing lines (young on).
    shape(ctx, vgrad(ctx, -38, -18, st >= 2 ? '#eef0f6' : lt, st >= 2 ? suit : skin), () => { ctx.moveTo(-4.4, -19); ctx.bezierCurveTo(-6.4, -26, -6.4, -34, -3.6, -38); ctx.lineTo(3.6, -38); ctx.bezierCurveTo(6.4, -34, 6.4, -26, 4.4, -19); ctx.quadraticCurveTo(0, -17.4, -4.4, -19); });
    if (st >= 2) { glow(ctx, 0, -30, 6, line, 0.4); stroke(ctx, line, h.LW, () => { ctx.moveTo(0, -37); ctx.lineTo(0, -20); ctx.moveTo(-4.4, -32); ctx.lineTo(4.4, -32); ctx.arc(0, -30, 2, 0, TAU); }); }
    // Long arms; three long fingers each, cupped round the orb (it rises and flies on a blow).
    const orb = { x: lerp(0, 0, k), y: -27 - k * 14 - sp * 10 + Math.sin(t * 2.4) * 1.5 };
    for (const sd of [-1, 1]) {
      const hand = { x: orb.x + sd * 6, y: orb.y + 3 };
      chain(ctx, [{ x: sd * 4.4, y: -36 }, { x: sd * 9, y: -29 }, hand], [1.6, 1.3, 1.1], skin);
      for (let f = -1; f <= 1; f++) stroke(ctx, dk, 1, () => { ctx.moveTo(hand.x, hand.y); ctx.lineTo(hand.x - sd * 2.6, hand.y - 1.6 + f * 1.4); });
    }
    const or = 3.4 + st * 0.5 + sp * 3;
    glow(ctx, orb.x, orb.y, or * 4, orbCol, 0.7);
    ell(ctx, orb.x, orb.y, or, or, rgrad(ctx, orb.x, orb.y, or, '#ffffff', orbCol), null);
    for (let i = 0; i < 3; i++) { const a = t * 4 + (i * TAU) / 3; ell(ctx, orb.x + Math.cos(a) * or * 1.8, orb.y + Math.sin(a) * or * 0.7, 0.7, 0.7, '#ffffff', null); }
    // The head: big and smooth, a thin neck, almond eyes of deep night with stars in them.
    chain(ctx, [{ x: 0, y: -37 }, { x: 0, y: -41 }], [1.6, 1.4], skin, { light: false });
    const hy = -52;
    shape(ctx, rgrad(ctx, 0, hy - 3, 13, lt, skin), () => { ctx.moveTo(0, hy + 10); ctx.quadraticCurveTo(-4.4, hy + 8.4, -6, hy + 3); ctx.bezierCurveTo(-12, hy - 4, -10, hy - 15, 0, hy - 15); ctx.bezierCurveTo(10, hy - 15, 12, hy - 4, 6, hy + 3); ctx.quadraticCurveTo(4.4, hy + 8.4, 0, hy + 10); });
    if (st >= 4) stroke(ctx, orbCol, h.LW, () => { ctx.moveTo(-5, hy - 10); ctx.quadraticCurveTo(0, hy - 13, 5, hy - 10); ctx.moveTo(-3, hy - 7.6); ctx.quadraticCurveTo(0, hy - 9.4, 3, hy - 7.6); });
    const blink = (t * 0.7) % 4 < 0.12 ? 0.15 : 1;
    for (const sd of [-1, 1]) {
      shape(ctx, '#0a0a14', () => { ctx.ellipse(sd * 3.6, hy + 0.4, 3.2, 2 * blink, sd * 0.55, 0, TAU); });
      if (blink > 0.5) { ell(ctx, sd * 3.6 - 1, hy - 0.4, 0.8, 0.5, '#ffffff', null); for (let s = 0; s < 3; s++) ell(ctx, sd * 3.6 + (s - 1) * 1, hy + 0.8 + (s % 2) * 0.6, 0.25, 0.25, orbCol, null); }
    }
    ell(ctx, -0.6, hy + 4.6, 0.3, 0.5, dk, null); ell(ctx, 0.6, hy + 4.6, 0.3, 0.5, dk, null);
    stroke(ctx, dk, h.LW * 0.8, () => { ctx.moveTo(-1.4, hy + 6.8); ctx.quadraticCurveTo(0, hy + 7.4, 1.4, hy + 6.8); });
    ctx.restore();
    // Ascended: three small orbs circling its head.
    if (st >= 4) for (let i = 0; i < 3; i++) { const a = t * 1.6 + (i * TAU) / 3; const x = Math.cos(a) * 14, y = -52 - lev - 14 + Math.sin(a) * 3; glow(ctx, x, y, 5, orbCol, 0.6); ell(ctx, x, y, 1.6, 1.6, '#ffffff', null); }
  }

  // ------------------------------------------------------------------ Nebula Jelly (Super Rare)
  /** A floating jellyfish with a nebula inside its bell, its colours always drifting. */
  function nebulaJelly(ctx, A) {
    const { shape, ell, stroke, glow, eye } = h;
    const { t, st } = A;
    const k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const hue = (t * 40) % 360;
    const float = 18 + Math.sin(t * 1.6) * 4;
    const pulse = 1 + Math.sin(t * 3) * 0.05 + k * 0.08 + sp * 0.12;
    ctx.save(); ctx.translate(0, -float);
    // Trailing tentacles waving, then ruffled arms.
    const n = 4 + st;
    for (let i = 0; i < n; i++) {
      const x0 = (i - (n - 1) / 2) * (16 / n);
      const pts = [];
      for (let s = 0; s <= 8; s++) { const q = s / 8; pts.push({ x: x0 + Math.sin(t * 2.4 + q * 4 + i) * 3 * q + k * q * 6 * (i % 2 ? 1 : -1), y: -16 + q * (18 + st * 3) }); }
      ctx.globalAlpha = 0.8; h.chain(ctx, pts, pts.map((_, s) => 0.9 - s * 0.08), hsl(hue + i * 25, 85, 70), { light: false }); ctx.globalAlpha = 1;
      if (st >= 2 && i % 2 === 0) glow(ctx, pts[8].x, pts[8].y, 3, hsl(hue + 60, 90, 70), 0.8);
    }
    for (const sd of [-1, 0, 1]) { const pts = []; for (let s = 0; s <= 5; s++) { const q = s / 5; pts.push({ x: sd * 4 + Math.sin(t * 2 + q * 5 + sd) * 2.4, y: -17 + q * 14 }); } h.chain(ctx, pts, pts.map((_, s) => 2.2 - s * 0.25), hsl(hue + 30, 70, 78), { light: false }); }
    // The bell: a glassy dome with a nebula and stars in it, a frilled rim, two kind eyes.
    const R = (12 + st * 1.6) * pulse;
    glow(ctx, 0, -26, R * 2.2, hsl(hue, 90, 60), 0.35);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-R, -18); ctx.bezierCurveTo(-R, -18 - R * 1.4, R, -18 - R * 1.4, R, -18); for (let i = 8; i >= 0; i--) { const x = -R + (i / 8) * 2 * R; ctx.quadraticCurveTo(x + R / 8, -15 + (i % 2) * 2, x, -18); } ctx.closePath();
    const g2 = ctx.createRadialGradient(-R * 0.2, -18 - R * 0.8, 1, 0, -22, R * 1.3); g2.addColorStop(0, hsl(hue + 40, 90, 85, 0.95)); g2.addColorStop(0.5, hsl(hue, 80, 55, 0.85)); g2.addColorStop(1, hsl(hue - 50, 80, 30, 0.9));
    ctx.fillStyle = g2; ctx.fill(); ctx.strokeStyle = '#1c1426'; ctx.lineWidth = h.LW; ctx.stroke();
    ctx.clip();
    for (let i = 0; i < 3; i++) glow(ctx, Math.sin(t * 0.5 + i * 2) * R * 0.5, -18 - R * 0.6 + Math.cos(t * 0.4 + i) * R * 0.3, R * 0.6, hsl(hue + i * 70, 90, 65), 0.6);
    if (st >= 3) { ctx.strokeStyle = hsl(hue + 120, 90, 85, 0.6); ctx.lineWidth = h.LW; for (let i = 0; i < 2; i++) { ctx.beginPath(); for (let a = 0; a < TAU * 1.5; a += 0.2) { const r = a * R * 0.12; ctx.lineTo(Math.cos(a + t + i * Math.PI) * r, -18 - R * 0.6 + Math.sin(a + t + i * Math.PI) * r * 0.5); } ctx.stroke(); } }
    for (let i = 0; i < 9; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 5 + i * 1.7); ell(ctx, Math.sin(i * 2.1) * R * 0.7, -18 - R * (0.3 + ((i * 0.37) % 0.8)), 0.35 + tw * 0.4, 0.35 + tw * 0.4, '#ffffff', null); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = h.LW * 1.4; ctx.beginPath(); ctx.arc(-R * 0.3, -18 - R * 0.75, R * 0.45, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
    if (st >= 2) for (let i = 0; i < 5; i++) { const x = -R * 0.75 + i * R * 0.375; glow(ctx, x, -19, 2.4, hsl(hue + 180, 90, 70), 0.9); }
    eye(ctx, -R * 0.34, -18 - R * 0.42, 1.5 + st * 0.15, '#ffffff'); eye(ctx, R * 0.34, -18 - R * 0.42, 1.5 + st * 0.15, '#ffffff');
    stroke(ctx, 'rgba(40,20,60,0.8)', h.LW, () => { ctx.arc(0, -18 - R * 0.22, 1.4, 0.3, Math.PI - 0.3); });
    // Ascended: three little jellies circling it like a crown.
    if (st >= 4) for (let i = 0; i < 3; i++) { const a = t * 1.1 + (i * TAU) / 3, x = Math.cos(a) * (R + 9), y = -18 - R * 1.3 + Math.sin(a) * 4; glow(ctx, x, y, 6, hsl(hue + i * 120, 90, 65), 0.5); shape(ctx, hsl(hue + i * 120, 85, 70, 0.9), () => { ctx.arc(x, y, 3, Math.PI, 0); ctx.quadraticCurveTo(x, y + 1.6, x - 3, y); }); }
    ctx.restore();
  }


  // ------------------------------------------------------------------ Void Stalker (Ultra Rare)
  /** A six-legged hunter: no eyes, a long crested head striped with living light, crystal spines, a bladed tail. */
  function voidStalker(ctx, A) {
    const { shape, ell, stroke, vgrad, tube, chain, glow, gait } = h;
    const { t, st } = A;
    const g = gait(A, 1.6), k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const skin = '#2a2a3e', lt = '#5a5a7a', glowC = hsl(185 + 20 * Math.sin(t * 2), 95, 60);
    const stripe = `rgba(60,240,255,${0.55 + 0.4 * Math.sin(t * 4)})`;
    if (st >= 4) ctx.globalAlpha *= 0.75 + 0.25 * Math.sin(t * 6);
    // The tail, high behind it, a blade (two when ascended) at its tip.
    const tail = [];
    for (let i = 0; i <= 9; i++) { const q = i / 9; tail.push({ x: Math.sin(t * 2 + q * 3) * 6 * q - 4 * q, y: -16 - q * 30 - Math.sin(q * Math.PI) * 6 }); }
    tube(ctx, tail, tail.map((_, i) => 3.6 - i * 0.3), skin, null, 'rgba(120,120,200,0.3)');
    for (let b = 0; b < (st >= 4 ? 2 : 1); b++) { const e = tail[9]; ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(-0.5 + b * 1); shape(ctx, vgrad(ctx, -10, 0, '#e8f0ff', '#7a8ab8'), () => { ctx.moveTo(-1.6, 0); ctx.quadraticCurveTo(-3, -6, 0, -11); ctx.quadraticCurveTo(2.4, -5, 1.6, 0); }); ctx.restore(); }
    // Six legs, three a side, stepping in turn: long, jointed, ending in hooked points.
    for (let i = 0; i < 6; i++) {
      const sd = i < 3 ? -1 : 1, j = i % 3, ph = g.W * TAU + j * 2.1 + (sd > 0 ? Math.PI : 0), up = Math.max(0, Math.sin(ph));
      const hip = { x: sd * 6, y: -20 + j * 3 }, knee = { x: sd * (20 + j * 2), y: -28 + j * 4 - up * 4 }, ft = { x: sd * (17 + j * 5) + Math.cos(ph) * 2, y: -1 - up * 3 };
      chain(ctx, [hip, knee, ft], [2.6, 1.8, 0.6], j === 1 ? lt : skin);
      ell(ctx, knee.x, knee.y, 1.4, 1.4, stripe, null);
    }
    // The body, crystal spines along its back.
    if (st >= 2) for (let i = 0; i < 2 + st; i++) { const x = -8 + (i * 16) / (1 + st); crystalLocal(ctx, x, -27 + Math.abs(x) * 0.2, 1.4, 5 + st * 1.4, hsl(270 + i * 12, 70, 65), x * 0.04); }
    shape(ctx, vgrad(ctx, -32, -12, lt, skin), () => { ctx.ellipse(0, -21, 11, 9, 0, 0, TAU); });
    stroke(ctx, stripe, h.LW * 1.4, () => { for (const y of [-25, -21, -17]) { ctx.moveTo(-8, y); ctx.quadraticCurveTo(0, y + 2.4, 8, y); } });
    // The head: long and crested, low and forward; a mouth that opens into four as it strikes.
    const hx = 0, hy = -14 + k * 8 + sp * 4;
    glow(ctx, hx, hy, 16, glowC, 0.3 + sp * 0.4);
    shape(ctx, vgrad(ctx, hy - 20, hy, lt, skin), () => { ctx.moveTo(hx - 6, hy - 2); ctx.quadraticCurveTo(hx - 8, hy - 14, hx, hy - 24 - st); ctx.quadraticCurveTo(hx + 8, hy - 14, hx + 6, hy - 2); ctx.quadraticCurveTo(hx, hy + 1, hx - 6, hy - 2); });
    stroke(ctx, stripe, h.LW * 1.3, () => { for (const sd of [-1, 1]) { ctx.moveTo(hx + sd * 1.6, hy - 20); ctx.quadraticCurveTo(hx + sd * 5, hy - 12, hx + sd * 4.6, hy - 4); } ctx.moveTo(hx, hy - 22); ctx.lineTo(hx, hy - 6); });
    const open = Math.max(k, sp * 0.8);
    for (const [ax, ay] of [[-1, 0.4], [1, 0.4], [-0.6, 1], [0.6, 1]]) shape(ctx, '#1a1a28', () => { ctx.moveTo(hx + ax * 2, hy - 1); ctx.lineTo(hx + ax * (3 + open * 4), hy + ay * (3 + open * 4)); ctx.lineTo(hx + ax * 1, hy + 1); });
    if (open > 0.2) { glow(ctx, hx, hy + 2, 8 * open, glowC, 0.8); for (let i = -1; i <= 1; i++) shape(ctx, '#ffffff', () => { ctx.moveTo(hx + i * 1.6 - 0.5, hy + 1); ctx.lineTo(hx + i * 1.6, hy + 1 + open * 2.6); ctx.lineTo(hx + i * 1.6 + 0.5, hy + 1); }, null); }
  }
  function crystalLocal(ctx, x, y, w, len, col, rot) { crystal(ctx, x, y, w, len, col, rot); }

  // ------------------------------------------------------------------ Prism Stag (Ultra Rare)
  /** A deer of living crystal; its antlers split light into every colour. */
  function prismStag(ctx, A) {
    const { shape, ell, stroke, vgrad, chain, glow, eye, gait } = h;
    const { t, st } = A;
    const g = gait(A, 1.3), k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const hue = (t * 50) % 360;
    const body = '#cfe8f8', dk = '#7aa8d0', lt = '#ffffff';
    const lev = st >= 4 ? 5 + Math.sin(t * 2) * 1.5 : 0;
    if (sp > 0.05) for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.28; ctx.globalAlpha = 0.45 * sp; stroke(ctx, hsl(hue + i * 60, 95, 65), 2.2, () => { ctx.moveTo(0, -62); ctx.lineTo(Math.cos(a) * 60, -62 + Math.sin(a) * 60); }); ctx.globalAlpha = 1; }
    ctx.save(); ctx.translate(0, -lev);
    // Slender legs, hind pair behind, with hooves of glass (of light, ascended).
    const hoof = (x, y) => { if (st >= 4) { glow(ctx, x, y, 5, hsl(hue, 90, 70), 0.8); } shape(ctx, st >= 4 ? hsl(hue, 90, 80) : '#5a7a9a', () => { ctx.moveTo(x - 2, y - 2.4); ctx.lineTo(x + 2, y - 2.4); ctx.lineTo(x + 2.4, y); ctx.lineTo(x - 2.4, y); }); };
    for (const sd of [-1, 1]) { const lift = Math.max(0, -sd * g.s) * 3; chain(ctx, [{ x: sd * 9, y: -24 }, { x: sd * 12, y: -14 - lift }, { x: sd * 11, y: -3 - lift }], [3, 2, 1.4], dk); hoof(sd * 11, -0.4 - lift); }
    shape(ctx, vgrad(ctx, -40, -18, lt, body), () => { ctx.moveTo(-12, -22); ctx.bezierCurveTo(-15, -30, -10, -38, 0, -38); ctx.bezierCurveTo(10, -38, 15, -30, 12, -22); ctx.quadraticCurveTo(0, -17, -12, -22); });
    // Facets on the body, catching the colours.
    for (const [x, y, s] of [[-6, -30, 3], [4, -33, 2.6], [7, -25, 2.2], [-3, -24, 2]]) { shape(ctx, hsl(hue + x * 10, 80, 85, 0.6), () => { ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 0.6); ctx.lineTo(x - s, y); }, 'rgba(120,160,200,0.6)', h.LW * 0.6); }
    for (const sd of [-1, 1]) { const lift = Math.max(0, sd * g.s) * 3.4; chain(ctx, [{ x: sd * 6, y: -26 }, { x: sd * 7.6, y: -14 - lift }, { x: sd * 7, y: -3 - lift }], [2.8, 1.9, 1.4], body); hoof(sd * 7, -0.4 - lift); }
    // The neck and head (it lowers its antlers to charge on a blow).
    const hy = -50 + k * 8, hx = 0;
    chain(ctx, [{ x: 0, y: -34 }, { x: 0, y: -42 }, { x: hx, y: hy + 3 }], [5, 4, 3.4], body);
    // Antlers of crystal, branching more with each stage, every tine a different colour.
    for (const sd of [-1, 1]) {
      const base = { x: hx + sd * 3.4, y: hy - 6 };
      const tip = { x: hx + sd * (12 + st * 2), y: hy - 18 - st * 4 };
      stroke(ctx, '#1c1426', 3.4, () => { ctx.moveTo(base.x, base.y); ctx.quadraticCurveTo(hx + sd * 6, hy - 14, tip.x, tip.y); });
      stroke(ctx, hsl(hue + sd * 40, 80, 82), 2, () => { ctx.moveTo(base.x, base.y); ctx.quadraticCurveTo(hx + sd * 6, hy - 14, tip.x, tip.y); });
      for (let i = 0; i < st + 1; i++) { const q = 0.35 + i * (0.6 / (st + 1)); const x = base.x + (tip.x - base.x) * q, y = base.y + (tip.y - base.y) * q - 1; crystal(ctx, x, y, 1, 4 + st * 1.2, hsl(hue + i * 55 + sd * 30, 90, 70), sd * (0.3 + i * 0.15)); }
      glow(ctx, tip.x, tip.y, 6, hsl(hue + sd * 90, 90, 70), 0.6);
    }
    shape(ctx, vgrad(ctx, hy - 7, hy + 8, lt, body), () => { ctx.moveTo(hx - 5.6, hy - 3); ctx.quadraticCurveTo(hx, hy - 8, hx + 5.6, hy - 3); ctx.quadraticCurveTo(hx + 3.6, hy + 6, hx, hy + 8); ctx.quadraticCurveTo(hx - 3.6, hy + 6, hx - 5.6, hy - 3); });
    for (const sd of [-1, 1]) shape(ctx, body, () => { ctx.moveTo(hx + sd * 4.4, hy - 3); ctx.lineTo(hx + sd * 9.6, hy - 5.6); ctx.lineTo(hx + sd * 5.4, hy); });
    ell(ctx, hx, hy + 6.2, 1.6, 1.1, '#5a7a9a', null);
    eye(ctx, hx - 2.6, hy - 1.6, 1.4, hsl(hue, 90, 75)); eye(ctx, hx + 2.6, hy - 1.6, 1.4, hsl(hue + 180, 90, 75));
    ctx.restore();
  }

  // ------------------------------------------------------------------ Mind Leviathan (Legendary)
  /** A whale that swims through the air, its glowing brain under a glass dome, eyes all along its sides. */
  function mindLeviathan(ctx, A) {
    const { shape, ell, stroke, vgrad, rgrad, chain, glow, eye } = h;
    const { t, st } = A;
    const k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const skin = '#4a3a8a', lt = '#8a7ac8', belly = '#c8c0e8', brain = hsl(320 + 20 * Math.sin(t * 2), 80, 70);
    const float = 16 + Math.sin(t * 1.3) * 3;
    // Psychic rings spreading as it thinks (and as it strikes).
    for (let r = 0; r < (st >= 3 ? 3 : 1); r++) { const q = (t * 0.5 + r / 3) % 1; ctx.globalAlpha = (1 - q) * (0.45 + k * 0.4 + sp * 0.4); stroke(ctx, brain, h.LW * 1.4, () => { ctx.ellipse(0, -float - 30, 14 + q * 30, (14 + q * 30) * 0.4, 0, 0, TAU); }); ctx.globalAlpha = 1; }
    ctx.save(); ctx.translate(0, -float);
    // Tentacles beneath, waving.
    for (let i = 0; i < 3 + st; i++) {
      const x0 = (i - (2 + st) / 2) * 5, pts = [];
      for (let s = 0; s <= 7; s++) { const q = s / 7; pts.push({ x: x0 + Math.sin(t * 2 + q * 4 + i) * 3 * q, y: -12 + q * (14 + st * 2) }); }
      chain(ctx, pts, pts.map((_, s) => 1.8 - s * 0.2), skin);
      for (let s = 2; s < 7; s += 2) ell(ctx, pts[s].x, pts[s].y, 0.6, 0.6, brain, null);
    }
    // Fins, the body (a broad whale seen head on), its grooved belly.
    const fin = Math.sin(t * 2) * 0.2;
    for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 18, -22); ctx.scale(sd, 1); ctx.rotate(0.4 + fin); shape(ctx, vgrad(ctx, -4, 10, lt, skin), () => { ctx.moveTo(0, -3); ctx.quadraticCurveTo(12, 0, 16, 10); ctx.quadraticCurveTo(8, 6, 0, 4); }); ctx.restore(); }
    shape(ctx, vgrad(ctx, -46, -10, lt, skin), () => { ctx.moveTo(-20, -22); ctx.bezierCurveTo(-24, -36, -14, -46, 0, -46); ctx.bezierCurveTo(14, -46, 24, -36, 20, -22); ctx.bezierCurveTo(16, -12, -16, -12, -20, -22); });
    shape(ctx, belly, () => { ctx.moveTo(-14, -18); ctx.quadraticCurveTo(0, -10, 14, -18); ctx.quadraticCurveTo(0, -14, -14, -18); }, null);
    stroke(ctx, 'rgba(90,70,150,0.6)', h.LW, () => { for (let i = -2; i <= 2; i++) { ctx.moveTo(i * 4.4, -16); ctx.lineTo(i * 4.8, -13.4); } });
    // Eyes along its sides, blinking in turn.
    for (let i = 0; i < 3 + st; i++) { const sd = i % 2 ? 1 : -1, j = Math.floor(i / 2); const x = sd * (10 + j * 3.4), y = -26 - j * 4; const open = Math.sin(t * 2 + i * 1.7) > -0.85 ? 1 : 0.15; ell(ctx, x, y, 1.6, 1.2 * open, '#ffffff'); if (open > 0.5) ell(ctx, x + sd * 0.3, y, 0.6, 0.8, '#2a0a3a', null); }
    // The dome on its back with the brain inside, pulsing.
    const pulse = 1 + 0.06 * Math.sin(t * 4) + sp * 0.15;
    const dy = -44, dr = 12 + st;
    glow(ctx, 0, dy - 4, dr * 1.8, brain, 0.4 + sp * 0.4);
    shape(ctx, rgrad(ctx, 0, dy - 4, dr * pulse, '#ffd8f0', brain), () => { ctx.moveTo(-dr * 0.85, dy + 2); ctx.bezierCurveTo(-dr, dy - dr * 0.9, dr, dy - dr * 0.9, dr * 0.85, dy + 2); ctx.closePath(); });
    stroke(ctx, 'rgba(120,30,90,0.6)', h.LW, () => { ctx.moveTo(0, dy + 1); ctx.lineTo(0, dy - dr * 0.65); for (const sd of [-1, 1]) for (let r = 0; r < 3; r++) { ctx.moveTo(sd * (2 + r * 2.6), dy - 1 - r); ctx.quadraticCurveTo(sd * (4 + r * 2.6), dy - 5 - r * 2, sd * (2.4 + r * 2.4), dy - 8 - r); } });
    shape(ctx, 'rgba(220,240,255,0.25)', () => { ctx.moveTo(-dr - 1.4, dy + 2.6); ctx.bezierCurveTo(-dr - 1.4, dy - dr * 1.1, dr + 1.4, dy - dr * 1.1, dr + 1.4, dy + 2.6); ctx.closePath(); }, 'rgba(200,220,255,0.8)');
    stroke(ctx, 'rgba(255,255,255,0.8)', h.LW * 1.4, () => { ctx.arc(-dr * 0.3, dy - dr * 0.4, dr * 0.5, Math.PI * 1.15, Math.PI * 1.5); });
    // Its main eyes and a wide mouth.
    eye(ctx, -6, -30, 2.4, brain); eye(ctx, 6, -30, 2.4, brain);
    stroke(ctx, '#1c1426', h.LW * 1.2, () => { ctx.moveTo(-10, -22); ctx.quadraticCurveTo(0, -20 + k * 3, 10, -22); });
    ctx.restore();
    if (st >= 4) for (let i = 0; i < 3; i++) { const a = t * 1.2 + (i * TAU) / 3, x = Math.cos(a) * 30, y = -float - 30 + Math.sin(a) * 8; glow(ctx, x, y, 6, brain, 0.6); ell(ctx, x, y, 2.4, 2, brain); }
  }

  // ------------------------------------------------------------------ Quasar Phoenix (Godly)
  /** A bird of living plasma, its flames running through the colours; ascended, beams of light out of it. */
  function quasarPhoenix(ctx, A) {
    const { shape, ell, stroke, vgrad, chain, glow, eye, paw } = h;
    const { t, st } = A;
    const k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const hue = (t * 60) % 360;
    const fire = (o, l = 60, a = 1) => hsl(hue + o, 95, l, a);
    const float = 14 + Math.sin(t * 2) * 3;
    const flap = Math.sin(t * 5) * 0.3 + sp * 0.5;
    if (st >= 4) for (const d of [-1, 1]) { const gr = ctx.createLinearGradient(0, -float - 40, 0, -float - 40 + d * 90); gr.addColorStop(0, fire(0, 85, 0.85)); gr.addColorStop(1, fire(60, 60, 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-4, -float - 40); ctx.lineTo(-1.2, -float - 40 + d * 90); ctx.lineTo(1.2, -float - 40 + d * 90); ctx.lineTo(4, -float - 40); ctx.fill(); }
    ctx.save(); ctx.translate(0, -float);
    // Tail plumes of light streaming down behind.
    for (let i = 0; i < 3 + st; i++) { const pts = []; const x0 = (i - (2 + st) / 2) * 3; for (let s = 0; s <= 8; s++) { const q = s / 8; pts.push({ x: x0 + Math.sin(t * 3 + q * 3 + i) * 4 * q + x0 * q, y: -18 + q * (24 + st * 4) }); } chain(ctx, pts, pts.map((_, s) => 2.6 - s * 0.25), fire(i * 25, 60), { line: false }); glow(ctx, pts[8].x, pts[8].y, 5, fire(i * 25, 70), 0.8); }
    // Wings of flame feathers, spread and beating.
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(sd * 5, -30); ctx.scale(sd, 1); ctx.rotate(-0.25 - flap);
      const n = 4 + st;
      for (let i = n - 1; i >= 0; i--) { const q = i / (n - 1), len = 14 + st * 3 + Math.sin(q * Math.PI) * 8; ctx.save(); ctx.translate(4 + q * (18 + st * 3), -q * 8); ctx.rotate(-0.4 + q * 1.4); shape(ctx, vgrad(ctx, -len, 0, fire(40 + q * 40, 80), fire(q * 30, 55)), () => { ctx.moveTo(-2.4, 0); ctx.quadraticCurveTo(-3.4, -len * 0.6, 0, -len); ctx.quadraticCurveTo(3.4, -len * 0.6, 2.4, 0); }, fire(-20, 30)); ctx.restore(); }
      ctx.restore();
    }
    // Talons, the body of fire, a crest, a bright beak and white-hot eyes.
    for (const sd of [-1, 1]) { chain(ctx, [{ x: sd * 3, y: -18 }, { x: sd * 4.4, y: -10 }, { x: sd * 4, y: -5 }], [1.6, 1.2, 1], fire(20, 45)); paw(ctx, sd * 4.2, -3.6, 2, fire(20, 45), '#fff4d0', 3); }
    shape(ctx, vgrad(ctx, -40, -14, fire(50, 80), fire(0, 52)), () => { ctx.moveTo(-6, -16); ctx.bezierCurveTo(-9, -24, -8, -36, 0, -40); ctx.bezierCurveTo(8, -36, 9, -24, 6, -16); ctx.quadraticCurveTo(0, -12, -6, -16); });
    for (let i = 0; i < 6; i++) { const x = (i % 3 - 1) * 3.2, y = -32 + Math.floor(i / 3) * 7; shape(ctx, fire(30, 75, 0.8), () => { ctx.moveTo(x - 2, y); ctx.quadraticCurveTo(x, y + 4, x + 2, y); ctx.quadraticCurveTo(x, y + 1.4, x - 2, y); }, null); }
    const hy = -44 + k * 4;
    for (let i = -2; i <= 2; i++) shape(ctx, fire(60 + i * 10, 70), () => { ctx.moveTo(i * 1.6 - 1.2, hy - 4); ctx.quadraticCurveTo(i * 3.4, hy - 12 - (2 - Math.abs(i)) * 3 - st, i * 2.6 + Math.sin(t * 8 + i), hy - 15 - (2 - Math.abs(i)) * 3 - st); ctx.lineTo(i * 1.6 + 1.2, hy - 4); }, fire(0, 35), h.LW * 0.6);
    shape(ctx, vgrad(ctx, hy - 7, hy + 6, fire(50, 85), fire(10, 58)), () => { ctx.ellipse(0, hy, 6, 6.4, 0, 0, TAU); });
    const open = Math.max(k, sp);
    shape(ctx, '#ffd23a', () => { ctx.moveTo(-2, hy + 2); ctx.lineTo(0, hy + 7 + open * 1.6); ctx.lineTo(2, hy + 2); });
    if (open > 0.2) { shape(ctx, '#c88a1a', () => { ctx.moveTo(-1.6, hy + 3.6); ctx.lineTo(0, hy + 6 + open * 3); ctx.lineTo(1.6, hy + 3.6); }); glow(ctx, 0, hy + 7, 12 * open, fire(40, 75), 0.8); }
    eye(ctx, -2.6, hy - 1, 1.3, '#ffffff', 1, 1); eye(ctx, 2.6, hy - 1, 1.3, '#ffffff', 1, -1);
    glow(ctx, 0, -28, 26 + sp * 12, fire(20, 60), 0.35);
    ctx.restore();
    if (st >= 3) { ctx.globalAlpha = 0.6; stroke(ctx, fire(90, 75), h.LW * 1.4, () => { ctx.ellipse(0, -float - 28, 26, 7, Math.sin(t) * 0.2, 0, TAU); }); ctx.globalAlpha = 1; }
  }

  // ------------------------------------------------------------------ Chrononaut (Godly)
  /**
   * A human from the far future in a white and gold exosuit, its visor alive with light, a holographic
   * slate at its hand, and its companion: a little floating alien with big eyes. Ascended, clock-rings
   * of time turn about it.
   */
  function chrononaut(ctx, A) {
    const { shape, ell, stroke, vgrad, rgrad, chain, glow, foot, lerp, gait } = h;
    const { t, st } = A;
    const g = gait(A, 1), k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const suit = '#eef0f6', dk = '#a8acbc', gold = '#e0b040', holo = hsl(190 + 15 * Math.sin(t * 2), 95, 65);
    // Rings of time behind it (adult on).
    if (st >= 3) for (let r = 0; r < st - 2; r++) { ctx.save(); ctx.translate(0, -42); ctx.rotate(t * (r ? -0.4 : 0.3)); ctx.globalAlpha = 0.6; stroke(ctx, gold, h.LW * 1.4, () => { ctx.arc(0, 0, 24 + r * 7, 0, TAU); }); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; stroke(ctx, gold, h.LW, () => { ctx.moveTo(Math.cos(a) * (24 + r * 7), Math.sin(a) * (24 + r * 7)); ctx.lineTo(Math.cos(a) * (21 + r * 7), Math.sin(a) * (21 + r * 7)); }); } stroke(ctx, holo, h.LW * 1.2, () => { ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t * 2) * (18 + r * 6), Math.sin(t * 2) * (18 + r * 6)); }); ctx.globalAlpha = 1; ctx.restore(); }
    if (sp > 0.05) for (let i = 1; i <= 2; i++) { ctx.globalAlpha = 0.25 * sp; ctx.save(); ctx.translate(-i * 9 * sp, 0); body(); ctx.restore(); ctx.globalAlpha = 1; }
    body();
    function body() {
      // Legs in armoured boots; the suit with gold trim and a glowing core.
      for (const sd of [-1, 1]) { const lift = Math.max(0, sd * g.s) * 3; chain(ctx, [{ x: sd * 4, y: -26 }, { x: sd * 5, y: -14 - lift * 0.5 }, { x: sd * 4.6, y: -3 - lift }], [3, 2.6, 2.2], suit); shape(ctx, vgrad(ctx, -8 - lift, -lift, '#ffffff', dk), () => { ctx.moveTo(sd * 4.6 - 3, -7 - lift); ctx.lineTo(sd * 4.6 + 3, -7 - lift); ctx.lineTo(sd * 4.6 + 3.6, -lift); ctx.lineTo(sd * 4.6 - 3.6, -lift); }); stroke(ctx, gold, h.LW, () => { ctx.moveTo(sd * 4.6 - 3, -7 - lift); ctx.lineTo(sd * 4.6 + 3, -7 - lift); }); ell(ctx, sd * 5, -14 - lift * 0.5, 2, 1.8, gold); }
      shape(ctx, vgrad(ctx, -46, -24, '#ffffff', dk), () => { ctx.moveTo(-6, -25); ctx.bezierCurveTo(-8, -32, -9, -42, -6, -46); ctx.lineTo(6, -46); ctx.bezierCurveTo(9, -42, 8, -32, 6, -25); ctx.closePath(); });
      stroke(ctx, gold, h.LW * 1.2, () => { ctx.moveTo(-6, -40); ctx.lineTo(-2, -36); ctx.lineTo(2, -36); ctx.lineTo(6, -40); ctx.moveTo(-5.6, -27); ctx.lineTo(5.6, -27); });
      glow(ctx, 0, -33, 6, holo, 0.7); ell(ctx, 0, -33, 2, 2, holo);
      for (const sd of [-1, 1]) ell(ctx, sd * 7.4, -44, 3.6, 2.8, vgrad(ctx, -47, -41, '#ffffff', dk));
      // Arms: one raised to the slate (and sweeping on a blow), the other at its side.
      const hand = { x: lerp(12, 14, k), y: lerp(-34, -44, k) };
      chain(ctx, [{ x: -7.4, y: -43 }, { x: -9.6, y: -35 }, { x: -9, y: -27 }], [2.2, 1.9, 1.7], suit);
      ell(ctx, -9, -26, 2, 2, dk);
      chain(ctx, [{ x: 7.4, y: -43 }, { x: 11, y: -38 }, hand], [2.2, 1.9, 1.7], suit);
      ell(ctx, hand.x, hand.y, 2, 2, dk);
      // The slate: a floating panel of light with lines of writing.
      const sx = hand.x + 7, sy = hand.y - 6;
      ctx.globalAlpha = 0.85; shape(ctx, hsl(190, 90, 70, 0.35), () => { ctx.moveTo(sx - 5, sy - 6); ctx.lineTo(sx + 5, sy - 7); ctx.lineTo(sx + 5, sy + 4); ctx.lineTo(sx - 5, sy + 5); }, holo, h.LW * 0.8); ctx.globalAlpha = 1;
      stroke(ctx, holo, h.LW * 0.6, () => { for (let i = 0; i < 4; i++) { ctx.moveTo(sx - 3.6, sy - 4 + i * 2.2); ctx.lineTo(sx - 3.6 + 3 + ((i * 1.7 + t) % 3), sy - 4.2 + i * 2.2); } });
      // The helmet: smooth, a visor of light that flickers with data.
      const hy = -53;
      ell(ctx, 0, hy, 7, 7.6, vgrad(ctx, hy - 8, hy + 8, '#ffffff', dk));
      stroke(ctx, gold, h.LW * 1.2, () => { ctx.moveTo(-7, hy + 1); ctx.quadraticCurveTo(0, hy - 9, 7, hy + 1); });
      shape(ctx, rgrad(ctx, 0, hy + 1, 7, hsl(190, 95, 80), hsl(220, 80, 30)), () => { ctx.moveTo(-5.6, hy - 1); ctx.quadraticCurveTo(0, hy - 4, 5.6, hy - 1); ctx.quadraticCurveTo(5, hy + 4.6, 0, hy + 5); ctx.quadraticCurveTo(-5, hy + 4.6, -5.6, hy - 1); });
      stroke(ctx, 'rgba(255,255,255,0.8)', h.LW * 0.6, () => { for (let i = 0; i < 3; i++) { const y = hy - 1 + i * 1.8; ctx.moveTo(-4 + ((t * 3 + i) % 2), y); ctx.lineTo(-1 + ((t * 2 + i) % 3), y); } });
      glow(ctx, 0, hy + 1, 9, holo, 0.4);
    }
    // Its companion: a small round alien that floats round it, big eyes, antennae, little fins.
    const ca = t * 1.3, cx = Math.cos(ca) * 18, cy = -46 + Math.sin(ca * 2) * 5;
    const cr = 3.4 + st * 0.5;
    for (const sd of [-1, 1]) { stroke(ctx, '#5a3a8a', h.LW, () => { ctx.moveTo(cx + sd * 1.2, cy - cr * 0.8); ctx.quadraticCurveTo(cx + sd * 2.6, cy - cr - 3, cx + sd * 3.4 + Math.sin(t * 6) * 0.6, cy - cr - 4); }); ell(ctx, cx + sd * 3.4 + Math.sin(t * 6) * 0.6, cy - cr - 4, 0.8, 0.8, '#ff7ad8', null); shape(ctx, '#9a7ae8', () => { ctx.moveTo(cx + sd * cr * 0.8, cy); ctx.lineTo(cx + sd * (cr + 3), cy - 1 + Math.sin(t * 9) * 1.4); ctx.lineTo(cx + sd * cr * 0.8, cy + 1.6); }); }
    ell(ctx, cx, cy, cr, cr * 0.95, rgrad(ctx, cx, cy, cr, '#e8d8ff', '#8a6ad8'));
    ell(ctx, cx - cr * 0.36, cy - 0.4, cr * 0.3, cr * 0.36, '#ffffff'); ell(ctx, cx + cr * 0.36, cy - 0.4, cr * 0.3, cr * 0.36, '#ffffff');
    ell(ctx, cx - cr * 0.32, cy - 0.2, cr * 0.16, cr * 0.2, '#1a0a2a', null); ell(ctx, cx + cr * 0.4, cy - 0.2, cr * 0.16, cr * 0.2, '#1a0a2a', null);
    stroke(ctx, '#3a1a5a', h.LW * 0.7, () => { ctx.arc(cx, cy + cr * 0.35, cr * 0.25, 0.2, Math.PI - 0.2); });
    if (sp > 0.1 || k > 0.3) { glow(ctx, cx, cy, 10, holo, 0.7); stroke(ctx, holo, h.LW * 1.4, () => { ctx.moveTo(cx, cy + cr); ctx.lineTo(cx + 6, cy + 24); }); }
  }


  // ------------------------------------------------------------------ Astral Sage (Dark Matter)
  /** A scholar of the far future in a robe woven of stars, books and a slate floating round her, an alien familiar on her shoulder. */
  function astralSage(ctx, A) {
    const { shape, ell, stroke, vgrad, rgrad, chain, glow, lerp } = h;
    const { t, st } = A;
    const k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const robe = '#1e2a6a', robeL = '#3a4aa8', skin = '#f0d0b8', hair = '#d8d0ff', glowC = hsl(200 + 40 * Math.sin(t * 1.2), 90, 70);
    const lev = st >= 3 ? 6 + Math.sin(t * 1.8) * 2 : 0;
    if (st >= 4) { ctx.globalAlpha = 0.7; const pts = []; for (let i = 0; i < 7; i++) { const a = t * 0.4 + (i * TAU) / 7; pts.push([Math.cos(a) * 30, -44 + Math.sin(a) * 10]); } stroke(ctx, 'rgba(200,220,255,0.5)', h.LW * 0.8, () => { pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }); for (const [x, y] of pts) { glow(ctx, x, y, 4, glowC, 0.8); ell(ctx, x, y, 0.9, 0.9, '#ffffff', null); } ctx.globalAlpha = 1; }
    ctx.save(); ctx.translate(0, -lev);
    // Hair, long, flowing behind, a braid of light.
    const sw = Math.sin(t * 1.5) * 2;
    shape(ctx, vgrad(ctx, -66, -24, '#ffffff', hair), () => { ctx.moveTo(-6, -64); ctx.quadraticCurveTo(-14, -52, -12 + sw, -26); ctx.quadraticCurveTo(-6, -30, 0, -28); ctx.quadraticCurveTo(6, -30, 12 - sw, -26); ctx.quadraticCurveTo(14, -52, 6, -64); });
    // The robe: wide at the hem, constellations on it, a belt of light.
    shape(ctx, vgrad(ctx, -48, 0, robeL, robe), () => { ctx.moveTo(-6, -46); ctx.bezierCurveTo(-10, -30, -16, -12, -15, 0); for (let x = -15; x <= 15; x += 5) ctx.quadraticCurveTo(x + 2.5, 2 + Math.sin(t * 3 + x) * 1.2, x + 5, 0); ctx.bezierCurveTo(16, -12, 10, -30, 6, -46); });
    const stars = [[-9, -10], [-5, -18], [-8, -26], [4, -14], [9, -8], [6, -24], [0, -32]];
    stroke(ctx, 'rgba(200,220,255,0.55)', h.LW * 0.6, () => { stars.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); });
    for (const [x, y] of stars) { const tw = 0.6 + 0.4 * Math.sin(t * 4 + x); ell(ctx, x, y, 0.8 * tw, 0.8 * tw, '#ffffff', null); }
    shape(ctx, glowC, () => { ctx.rect(-6.4, -36, 12.8, 1.8); }, null); glow(ctx, 0, -35, 6, glowC, 0.6);
    // Arms in wide sleeves: one lifts to the floating slate (and casts on a blow), one holds a book.
    const cast = Math.max(k, sp);
    const hand = { x: lerp(11, 12, cast), y: lerp(-34, -50, cast) };
    chain(ctx, [{ x: -6, y: -44 }, { x: -10, y: -36 }, { x: -9, y: -28 }], [1.8, 1.6, 1.4], skin);
    chain(ctx, [{ x: 6, y: -44 }, { x: 10, y: -40 }, hand], [1.8, 1.6, 1.4], skin);
    for (const [sx, sy, fx, fy, sd] of [[-6, -46, -9, -30, -1], [6, -46, hand.x, hand.y + 4, 1]]) shape(ctx, vgrad(ctx, sy, fy + 6, robeL, robe), () => { ctx.moveTo(sx, sy - 1); ctx.quadraticCurveTo(sx + sd * 8, (sy + fy) / 2, fx + sd * 2, fy + 6); ctx.lineTo(fx - sd * 3, fy + 3); ctx.quadraticCurveTo(sx - sd * 1, (sy + fy) / 2 + 2, sx, sy + 3); });
    // A book under one arm, the slate of light above the other.
    shape(ctx, '#6a2a2a', () => { ctx.rect(-13, -30, 6, 8); }); stroke(ctx, '#e0b040', h.LW, () => { ctx.rect(-12.4, -29.4, 4.8, 6.8); });
    const sx2 = hand.x + 4, sy2 = hand.y - 8 + Math.sin(t * 2) * 1.2;
    ctx.globalAlpha = 0.85; shape(ctx, hsl(200, 90, 70, 0.35), () => { ctx.moveTo(sx2 - 4, sy2 - 5); ctx.lineTo(sx2 + 4, sy2 - 6); ctx.lineTo(sx2 + 4.4, sy2 + 4); ctx.lineTo(sx2 - 4, sy2 + 5); }, glowC, h.LW * 0.8); ctx.globalAlpha = 1;
    stroke(ctx, glowC, h.LW * 0.6, () => { ctx.arc(sx2, sy2, 2, 0, TAU); ctx.moveTo(sx2 - 3, sy2 + 3); ctx.lineTo(sx2 + 3, sy2 + 2.6); });
    if (cast > 0.2) glow(ctx, sx2, sy2, 14 * cast, glowC, 0.8);
    // Her face: calm, wide bright eyes, circuit lines of light on her cheeks; a circlet with a star.
    const hy = -54;
    chain(ctx, [{ x: 0, y: -46 }, { x: 0, y: -49 }], [1.8, 1.6], skin, { light: false });
    ell(ctx, 0, hy, 5.6, 6.6, vgrad(ctx, hy - 6, hy + 7, '#fff0e4', skin));
    shape(ctx, '#ffffff', () => { ctx.moveTo(-5.6, hy - 1); ctx.quadraticCurveTo(-5, hy - 7.6, 0, hy - 7.6); ctx.quadraticCurveTo(5, hy - 7.6, 5.6, hy - 1); ctx.quadraticCurveTo(2.4, hy - 4.6, 0, hy - 4); ctx.quadraticCurveTo(-2.4, hy - 4.6, -5.6, hy - 1); }, '#8a80c0');
    stroke(ctx, '#e0b040', h.LW, () => { ctx.moveTo(-5.4, hy - 3.6); ctx.quadraticCurveTo(0, hy - 6.6, 5.4, hy - 3.6); }); glow(ctx, 0, hy - 5.6, 4, '#ffe066', 0.8); ell(ctx, 0, hy - 5.6, 0.9, 0.9, '#ffffff', null);
    for (const sd of [-1, 1]) { ell(ctx, sd * 2.2, hy - 0.4, 1.4, 1.1, '#ffffff', h.LW ? undefined : null, 0, h.LW * 0.6); ell(ctx, sd * 2.2, hy - 0.3, 0.75, 0.85, '#5a4ad8', null); ell(ctx, sd * 2.4, hy - 0.6, 0.3, 0.3, '#ffffff', null); stroke(ctx, '#6a5a8a', h.LW * 0.7, () => { ctx.moveTo(sd * 1.1, hy - 2.2); ctx.quadraticCurveTo(sd * 2.3, hy - 2.8, sd * 3.4, hy - 2.1); }); stroke(ctx, glowC, h.LW * 0.6, () => { ctx.moveTo(sd * 2.6, hy + 2); ctx.lineTo(sd * 4.2, hy + 2.6); ctx.lineTo(sd * 4.2, hy + 3.6); }); }
    stroke(ctx, '#c88a7a', h.LW * 0.7, () => { ctx.arc(0, hy + 2.6, 1.2, 0.3, Math.PI - 0.3); });
    // The familiar on her shoulder: a little fox-like alien, big ears, antennae, a curling tail.
    const fx0 = -8, fy0 = -50 + Math.sin(t * 3) * 0.6;
    stroke(ctx, '#3ac8b0', 1.4, () => { ctx.moveTo(fx0 + 2, fy0 + 1); ctx.quadraticCurveTo(fx0 + 7, fy0 + 4, fx0 + 6 + Math.sin(t * 2) * 1.5, fy0 - 2); });
    ell(ctx, fx0, fy0, 3, 2.6, '#5ae8d0');
    for (const sd of [-1, 1]) shape(ctx, '#3ac8b0', () => { ctx.moveTo(fx0 + sd * 1.6, fy0 - 3.6); ctx.lineTo(fx0 + sd * 3.6, fy0 - 8); ctx.lineTo(fx0 + sd * 2.8, fy0 - 3); });
    ell(ctx, fx0, fy0 - 3.6, 2.8, 2.4, '#7af0e0');
    for (const sd of [-1, 1]) { stroke(ctx, '#2a8a7a', h.LW * 0.6, () => { ctx.moveTo(fx0 + sd * 0.6, fy0 - 5.6); ctx.quadraticCurveTo(fx0 + sd * 1.6, fy0 - 9, fx0 + sd * 2.6, fy0 - 9.4); }); ell(ctx, fx0 + sd * 2.6, fy0 - 9.4, 0.5, 0.5, '#ff7ad8', null); ell(ctx, fx0 + sd * 1, fy0 - 3.8, 0.7, 0.8, '#1a0a2a', null); }
    ctx.restore();
  }

  // ------------------------------------------------------------------ Eclipse Seraph (Dark Matter)
  /** A tall being of gold behind a mask of three eyes, six wings of light, a dark eclipse for a halo. */
  function eclipseSeraph(ctx, A) {
    const { shape, ell, stroke, vgrad, rgrad, chain, glow, lerp } = h;
    const { t, st } = A;
    const k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const gold = '#e8c060', goldD = '#a07a20', white = '#fff8e8', violet = hsl(270 + 20 * Math.sin(t), 80, 70);
    const lev = 10 + Math.sin(t * 1.6) * 2.5;
    ctx.save(); ctx.translate(0, -lev);
    // The eclipse behind its head: a black sun, its corona burning.
    // (Set high behind the head, so the mask sits in front of its lower edge.)
    const hy = -60, er = 11 + st, ey = hy - 9 - st;
    glow(ctx, 0, ey, er * 2.6, '#ffd27a', 0.55 + sp * 0.3);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + t * 0.3, l = er + 3 + (i % 2 ? 4 : 1) + Math.sin(t * 4 + i) * 1.4; stroke(ctx, 'rgba(255,220,140,0.8)', h.LW * 1.2, () => { ctx.moveTo(Math.cos(a) * er, ey + Math.sin(a) * er); ctx.lineTo(Math.cos(a) * l, ey + Math.sin(a) * l); }); }
    ell(ctx, 0, ey, er, er, '#05030a', '#ffe8a0');
    // Six wings of light in three pairs, beating slowly.
    const pairs = Math.min(3, st);
    for (let p = pairs - 1; p >= 0; p--) for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(sd * 4, -44 + p * 10); ctx.scale(sd, 1); ctx.rotate(-0.6 + p * 0.55 - Math.sin(t * 2 + p) * 0.12 - sp * 0.3);
      const L = 26 - p * 4 + st * 2;
      shape(ctx, vgrad(ctx, -6, 6, white, 'rgba(255,220,150,0.6)'), () => { ctx.moveTo(0, -2); ctx.quadraticCurveTo(L * 0.5, -8, L, -2); ctx.quadraticCurveTo(L * 0.6, 2, L * 0.85, 5); ctx.quadraticCurveTo(L * 0.45, 3, L * 0.55, 7); ctx.quadraticCurveTo(L * 0.25, 3, 0, 4); }, goldD);
      stroke(ctx, violet, h.LW * 0.8, () => { ctx.moveTo(2, 0); ctx.lineTo(L * 0.92, -1.6); });
      ctx.restore();
    }
    // A long robe of plates, tapering to nothing (it never touches the ground).
    shape(ctx, vgrad(ctx, -48, 4, white, gold), () => { ctx.moveTo(-6, -46); ctx.bezierCurveTo(-11, -30, -8, -10, 0, 6); ctx.bezierCurveTo(8, -10, 11, -30, 6, -46); });
    stroke(ctx, goldD, h.LW, () => { for (let i = 0; i < 5; i++) { const y = -40 + i * 8, w = 7 - i * 1.2; ctx.moveTo(-w, y); ctx.quadraticCurveTo(0, y + 3, w, y); } });
    glow(ctx, 0, -38, 6, violet, 0.7); shape(ctx, violet, () => { ctx.moveTo(0, -41); ctx.lineTo(2, -38); ctx.lineTo(0, -35); ctx.lineTo(-2, -38); });
    // Arms out, palms up; a sphere of light gathers between them as it strikes.
    for (const sd of [-1, 1]) { const f = { x: sd * lerp(13, 8, Math.max(k, sp)), y: lerp(-34, -42, Math.max(k, sp)) }; chain(ctx, [{ x: sd * 6, y: -45 }, { x: sd * 11, y: -40 }, f], [1.8, 1.5, 1.3], gold); ell(ctx, f.x, f.y, 1.8, 1.4, white); }
    if (Math.max(k, sp) > 0.15) { const r = 3 + 6 * Math.max(k, sp); glow(ctx, 0, -40, r * 3, violet, 0.8); ell(ctx, 0, -40, r, r, rgrad(ctx, 0, -40, r, '#ffffff', violet), null); }
    // The head: a smooth mask of gold with three eyes of violet light.
    chain(ctx, [{ x: 0, y: -46 }, { x: 0, y: -50 }], [2, 1.8], gold, { light: false });
    shape(ctx, vgrad(ctx, hy - 7, hy + 8, white, gold), () => { ctx.moveTo(0, hy - 7.4); ctx.quadraticCurveTo(6, hy - 7, 5.6, hy); ctx.quadraticCurveTo(4.6, hy + 6.4, 0, hy + 8); ctx.quadraticCurveTo(-4.6, hy + 6.4, -5.6, hy); ctx.quadraticCurveTo(-6, hy - 7, 0, hy - 7.4); });
    for (const [x, y] of [[-2.4, hy], [2.4, hy], [0, hy - 4]]) { glow(ctx, x, y, 3.6, violet, 0.8); shape(ctx, '#ffffff', () => { ctx.ellipse(x, y, 1.3, 0.5, 0, 0, TAU); }, null); }
    stroke(ctx, goldD, h.LW * 0.8, () => { ctx.moveTo(0, hy + 2); ctx.lineTo(0, hy + 6); });
    ctx.restore();
  }

  // ------------------------------------------------------------------ The Singularity Dragon (Cosmic)
  /** A dragon made of the night sky, stars moving inside it, a black hole burning in its chest. */
  function singularityDragon(ctx, A) {
    const { shape, ell, stroke, vgrad, rgrad, chain, tube, glow, eye, paw, gait } = h;
    const { t, st } = A;
    const g = gait(A, 0.8), k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const space = '#0a0618', edge = hsl(260 + 30 * Math.sin(t * 0.9), 90, 65), edge2 = hsl(200 + 40 * Math.sin(t * 0.7), 90, 65);
    // Stars twinkling inside a shape (clipped to it).
    const starry = (draw, n, seed) => { ctx.save(); ctx.beginPath(); draw(); ctx.closePath(); ctx.fillStyle = space; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = h.LW * 1.4; ctx.stroke(); ctx.clip(); for (let i = 0; i < n; i++) { const x = Math.sin(seed + i * 12.9898) * 40, y = -40 + Math.cos(seed + i * 78.233) * 40, tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i)); ell(ctx, x, y, 0.5 * tw + 0.2, 0.5 * tw + 0.2, i % 3 ? '#ffffff' : edge2, null); } glow(ctx, Math.sin(t * 0.3 + seed) * 10, -40, 20, edge, 0.25); ctx.restore(); };
    // Wings of nebula: dark membranes lit along their bones.
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(sd * 9, -52); ctx.scale(sd, 1); ctx.rotate(-0.2 - Math.sin(t * 1.4) * 0.15 - sp * 0.3);
      const S = 40 + st * 5;
      starry(() => { ctx.moveTo(0, 0); ctx.lineTo(S * 0.5, -30); ctx.lineTo(S, -18); ctx.quadraticCurveTo(S * 0.85, -4, S * 0.9, 8); ctx.quadraticCurveTo(S * 0.66, 0, S * 0.58, 12); ctx.quadraticCurveTo(S * 0.36, 2, S * 0.28, 14); ctx.quadraticCurveTo(S * 0.15, 6, 0, 10); }, 14, sd * 3);
      stroke(ctx, edge2, h.LW * 1.6, () => { ctx.moveTo(0, 0); ctx.lineTo(S * 0.5, -30); for (const [x, y] of [[S, -18], [S * 0.9, 8], [S * 0.58, 12], [S * 0.28, 14]]) { ctx.moveTo(S * 0.5, -30); ctx.lineTo(x, y); } });
      ctx.restore();
    }
    // The tail behind, starry; legs; the body with the black hole in its chest.
    const tail = [];
    for (let i = 0; i <= 10; i++) { const q = i / 10; tail.push({ x: Math.sin(t * 1.2 + q * 3) * 5 * q + q * 14, y: -18 - q * 30 }); }
    tube(ctx, tail, tail.map((_, i) => 6 - i * 0.48), space, null, null, { lineCol: edge });
    for (const sd of [-1, 1]) { const lift = Math.max(0, sd * g.s) * 3.4; chain(ctx, [{ x: sd * 11, y: -24 }, { x: sd * 17, y: -13 - lift }, { x: sd * 15, y: -3 - lift }], [6, 4.6, 3.4], space, { lineCol: edge }); paw(ctx, sd * 15.4, -1 - lift, 4, space, edge2, 3); }
    starry(() => { ctx.moveTo(-18, -20); ctx.bezierCurveTo(-24, -34, -20, -54, -8, -58); ctx.quadraticCurveTo(0, -60, 8, -58); ctx.bezierCurveTo(20, -54, 24, -34, 18, -20); ctx.quadraticCurveTo(0, -12, -18, -20); }, 30, 7);
    const bh = { x: 0, y: -38 }, br = 6 + st + sp * 3;
    ctx.save(); ctx.translate(bh.x, bh.y); ctx.rotate(-0.25);
    const disc = ctx.createLinearGradient(-br * 2.4, 0, br * 2.4, 0); disc.addColorStop(0, 'rgba(255,120,60,0.1)'); disc.addColorStop(0.3, '#ffb46a'); disc.addColorStop(0.5, '#ffffff'); disc.addColorStop(0.7, '#ff7ad8'); disc.addColorStop(1, 'rgba(120,80,255,0.1)');
    ctx.strokeStyle = disc; ctx.lineWidth = br * 0.55; ctx.beginPath(); ctx.ellipse(0, 0, br * 2.2, br * 0.6, 0, 0, TAU); ctx.stroke();
    ctx.restore();
    glow(ctx, bh.x, bh.y, br * 3, '#b07aff', 0.5);
    ell(ctx, bh.x, bh.y, br, br, '#000000', '#ffd8a0', 0, h.LW * 1.4);
    // Forelegs and the head: horns of light, white-hot eyes; a breath of stars as it strikes.
    for (const sd of [-1, 1]) { const f = sd > 0 ? { x: 19 + k * 5, y: -14 - k * 10 } : { x: -19, y: -12 }; chain(ctx, [{ x: sd * 12, y: -48 }, { x: sd * 18, y: -32 }, f], [5, 4, 3.2], space, { lineCol: edge }); paw(ctx, f.x, f.y + 2.4, 3.6, space, edge2, 3); }
    const hy = -66 + k * 4, open = Math.max(k, sp);
    tube(ctx, [{ x: 0, y: -56 }, { x: 0, y: -60 }, { x: 0, y: hy + 4 }], [7, 6.4, 5.8], space, null, null, { lineCol: edge });
    for (const sd of [-1, 1]) { shape(ctx, vgrad(ctx, hy - 26, hy, '#ffffff', edge), () => { ctx.moveTo(sd * 4.6, hy - 5); ctx.quadraticCurveTo(sd * 13, hy - 14, sd * 11, hy - 24 - st); ctx.quadraticCurveTo(sd * 8.6, hy - 12, sd * 2.6, hy - 7); }); }
    shape(ctx, '#05030a', () => { ctx.moveTo(-5, hy + 2); ctx.lineTo(-4, hy + 9 + open * 6); ctx.lineTo(4, hy + 9 + open * 6); ctx.lineTo(5, hy + 2); }, edge);
    if (open > 0.2) { glow(ctx, 0, hy + 8, 18 * open, '#c8b0ff', 0.9); for (let i = 0; i < 8; i++) ell(ctx, Math.sin(i * 2.4 + t * 6) * 8 * open, hy + 10 + ((i * 4 + t * 30) % 20) * open, 0.8, 0.8, '#ffffff', null); }
    starry(() => { ctx.moveTo(-8, hy - 3); ctx.quadraticCurveTo(0, hy - 11, 8, hy - 3); ctx.lineTo(5.6, hy + 6); ctx.quadraticCurveTo(0, hy + 8.4, -5.6, hy + 6); }, 8, 11);
    for (const sd of [-1, 1]) { glow(ctx, sd * 3.8, hy - 2.4, 5, '#ffffff', 0.9); shape(ctx, '#ffffff', () => { ctx.ellipse(sd * 3.8, hy - 2.4, 2, 0.9, sd * 0.3, 0, TAU); }, null); }
  }

  // ------------------------------------------------------------------ The Ouroboros (Cosmic)
  /** A serpent biting its own tail, its body a ring round a turning galaxy, its scales running through every colour. */
  function ouroboros(ctx, A) {
    const { shape, ell, stroke, rgrad, tube, glow, eye } = h;
    const { t, st } = A;
    const k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const hue = (t * 35) % 360;
    const cy = -40, R = 24 + st * 2 + sp * 3, float = Math.sin(t * 1.4) * 2.5;
    ctx.save(); ctx.translate(0, float);
    // The galaxy inside the ring, turning.
    glow(ctx, 0, cy, R * 1.2, hsl(hue + 200, 80, 60), 0.5);
    for (let arm = 0; arm < 2; arm++) { ctx.strokeStyle = hsl(hue + 260 + arm * 40, 90, 78, 0.8); ctx.lineWidth = h.LW * 1.6; ctx.beginPath(); for (let a = 0; a < TAU * 1.4; a += 0.12) { const r = a * R * 0.11; ctx.lineTo(Math.cos(a + t * 0.8 + arm * Math.PI) * r, cy + Math.sin(a + t * 0.8 + arm * Math.PI) * r * 0.8); } ctx.stroke(); }
    for (let i = 0; i < 24; i++) { const a = i * 2.4 + t * 0.8, r = (i % 8) * R * 0.09 + 2, tw = 0.5 + 0.5 * Math.sin(t * 5 + i); ell(ctx, Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, 0.5 + tw * 0.4, 0.5 + tw * 0.4, '#ffffff', null); }
    glow(ctx, 0, cy, 6, '#ffffff', 0.9);
    // The ring of its body: one smooth scaled tube round the circle, thickest at the head.
    const pts = [];
    const n = 28;
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + 0.35 + (i / n) * (TAU - 0.55); pts.push({ x: Math.cos(a) * R, y: cy + Math.sin(a) * R * 0.9 }); }
    tube(ctx, pts, pts.map((_, i) => 2.2 + (i / n) * 3.6), hsl(hue, 70, 45), hsl(hue + 40, 80, 80), 'rgba(255,255,255,0.35)');
    pts.forEach((p, i) => { if (i % 3) return; glow(ctx, p.x, p.y, 3, hsl(hue + i * 12, 95, 65), 0.6); });
    // The head at the top, biting the tail's tip; horns, a crest, eyes like stars.
    const hx = Math.cos(-Math.PI / 2 + 0.2) * R, hy = cy - R * 0.9 - 1;
    for (const sd of [-1, 1]) shape(ctx, hsl(hue + 60, 80, 75), () => { ctx.moveTo(hx + sd * 3, hy - 4); ctx.quadraticCurveTo(hx + sd * 8, hy - 11, hx + sd * 7, hy - 16 - st); ctx.quadraticCurveTo(hx + sd * 5, hy - 9, hx + sd * 1.2, hy - 5); });
    shape(ctx, rgrad(ctx, hx, hy, 8, hsl(hue + 30, 80, 70), hsl(hue, 70, 40)), () => { ctx.ellipse(hx, hy, 7.4, 6.4, 0, 0, TAU); });
    shape(ctx, hsl(hue, 70, 35), () => { ctx.moveTo(hx - 6, hy + 2); ctx.lineTo(hx - 9 - k * 2, hy + 4); ctx.lineTo(hx - 6, hy + 5); });
    eye(ctx, hx - 2.6, hy - 1.4, 1.4, '#ffffff'); eye(ctx, hx + 2.8, hy - 1.4, 1.4, '#ffffff');
    for (let i = 0; i < 2; i++) ell(ctx, hx + (i ? 2 : -2), hy + 3, 0.5, 0.4, '#1a0a1a', null);
    ctx.restore();
  }

  // ------------------------------------------------------------------ The Architect (Cosmic)
  /** A being drawn in lines of light, three moons circling its head, shaping a turning crystal of worlds in its hands. */
  function architect(ctx, A) {
    const { ell, stroke, glow, lerp } = h;
    const { t, st } = A;
    const k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const hue = (t * 30) % 360, c = (o, l = 75, a = 1) => hsl(hue + o, 90, l, a);
    const lev = 8 + Math.sin(t * 1.5) * 2;
    ctx.save(); ctx.translate(0, -lev);
    glow(ctx, 0, -38, 40, c(0, 80), 0.25);
    // The figure: a frame of glowing lines, layered twice (a soft glow under a bright core).
    const figure = (col, w) => stroke(ctx, col, w, () => {
      ctx.moveTo(-4, -2); ctx.lineTo(-3, -22); ctx.lineTo(0, -26); ctx.lineTo(3, -22); ctx.lineTo(4, -2);
      ctx.moveTo(-3, -22); ctx.lineTo(-7, -44); ctx.lineTo(0, -48); ctx.lineTo(7, -44); ctx.lineTo(3, -22);
      ctx.moveTo(-7, -44); ctx.lineTo(7, -44); ctx.moveTo(0, -48); ctx.lineTo(0, -26);
      const hx = lerp(14, 9, Math.max(k, sp)), hy = lerp(-30, -40, Math.max(k, sp));
      ctx.moveTo(-7, -44); ctx.lineTo(-12, -36); ctx.lineTo(-hx, hy); ctx.moveTo(7, -44); ctx.lineTo(12, -36); ctx.lineTo(hx, hy);
      ctx.moveTo(-3, -50); ctx.lineTo(0, -60); ctx.lineTo(3, -50); ctx.closePath();
    });
    figure(c(0, 70, 0.35), 4.2);
    figure('#ffffff', 1.2);
    for (const [x, y] of [[-7, -44], [7, -44], [0, -26], [-3, -22], [3, -22], [0, -48]]) { glow(ctx, x, y, 3, c(60), 0.9); ell(ctx, x, y, 0.8, 0.8, '#ffffff', null); }
    ell(ctx, 0, -55, 3.2, 4, c(0, 92, 0.35), c(0, 80), 0, h.LW);
    glow(ctx, 0, -55, 6, '#ffffff', 0.9);
    // The crystal of worlds between its hands: an icosahedron of light, turning.
    const pr = 5 + st + Math.max(k, sp) * 5, py = lerp(-30, -42, Math.max(k, sp));
    const vtx = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + t; vtx.push([Math.cos(a) * pr, py + Math.sin(a) * pr * 0.45]); }
    stroke(ctx, c(120, 80), h.LW * 1.1, () => { for (const [x, y] of vtx) { ctx.moveTo(0, py - pr); ctx.lineTo(x, y); ctx.moveTo(0, py + pr); ctx.lineTo(x, y); } vtx.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); });
    glow(ctx, 0, py, pr * 1.8, c(120), 0.5);
    ctx.restore();
    // Three moons circling its head, each with its own ring and colour.
    for (let i = 0; i < 3; i++) {
      const a = t * (0.8 + i * 0.25) + (i * TAU) / 3, x = Math.cos(a) * (18 + i * 4), y = -lev - 55 + Math.sin(a) * 5;
      const mr = 2.4 + i * 0.6;
      glow(ctx, x, y, mr * 3, c(i * 110, 70), 0.6);
      ell(ctx, x, y, mr, mr, c(i * 110, 62));
      stroke(ctx, c(i * 110 + 40, 85), h.LW * 0.8, () => { ctx.ellipse(x, y, mr * 1.9, mr * 0.5, 0.3, 0, TAU); });
    }
  }

  /** The Cosmic rarity's look (Sam, 23 Nov): a black hole behind the beast, stars of every colour flashing and circling it. */
  function cosmicAura(ctx, t, front) {
    const { ell, glow } = h;
    if (!front) {
      const g = ctx.createRadialGradient(0, -40, 4, 0, -40, 46);
      g.addColorStop(0, 'rgba(0,0,0,0.95)'); g.addColorStop(0.45, 'rgba(10,0,30,0.85)'); g.addColorStop(0.7, 'rgba(80,20,140,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -40, 46, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(0, -40); ctx.rotate(-0.3 + Math.sin(t * 0.3) * 0.05);
      const disc = ctx.createLinearGradient(-44, 0, 44, 0); disc.addColorStop(0, 'rgba(120,60,255,0)'); disc.addColorStop(0.3, 'rgba(255,140,80,0.7)'); disc.addColorStop(0.5, 'rgba(255,255,255,0.9)'); disc.addColorStop(0.7, 'rgba(255,90,200,0.7)'); disc.addColorStop(1, 'rgba(80,120,255,0)');
      ctx.strokeStyle = disc; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(0, 0, 42, 9, 0, Math.PI, TAU); ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.save(); ctx.translate(0, -40); ctx.rotate(-0.3 + Math.sin(t * 0.3) * 0.05);
    const disc = ctx.createLinearGradient(-44, 0, 44, 0); disc.addColorStop(0, 'rgba(120,60,255,0)'); disc.addColorStop(0.3, 'rgba(255,140,80,0.75)'); disc.addColorStop(0.5, 'rgba(255,255,255,0.95)'); disc.addColorStop(0.7, 'rgba(255,90,200,0.75)'); disc.addColorStop(1, 'rgba(80,120,255,0)');
    ctx.strokeStyle = disc; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(0, 0, 42, 9, 0, 0, Math.PI); ctx.stroke();
    ctx.restore();
    const cols = ['#ff5a7a', '#ffd23a', '#5af0ff', '#9a7aff', '#7aff8a', '#ff9ad8', '#ffffff', '#5a9aff'];
    for (let i = 0; i < 10; i++) {
      const a = t * (0.5 + (i % 3) * 0.18) + i * 0.63, r = 30 + (i % 4) * 6, x = Math.cos(a) * r, y = -40 + Math.sin(a) * r * 0.42;
      const tw = Math.max(0, Math.sin(t * 4 + i * 1.9));
      if (tw < 0.05) continue;
      const col = cols[i % cols.length];
      glow(ctx, x, y, 4 + tw * 4, col, 0.8 * tw);
      ctx.fillStyle = col; ctx.globalAlpha = tw;
      ctx.beginPath(); const s = 1.2 + tw * 1.8; ctx.moveTo(x, y - s * 2); ctx.lineTo(x + s * 0.4, y - s * 0.4); ctx.lineTo(x + s * 2, y); ctx.lineTo(x + s * 0.4, y + s * 0.4); ctx.lineTo(x, y + s * 2); ctx.lineTo(x - s * 0.4, y + s * 0.4); ctx.lineTo(x - s * 2, y); ctx.lineTo(x - s * 0.4, y - s * 0.4); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  const SPECIES = { emerald_serpent: emeraldSerpent, onyx_wyrm: onyxWyrm, gilded_leafwing: gildedLeafwing, grey_envoy: greyEnvoy, nebula_jelly: nebulaJelly, void_stalker: voidStalker, prism_stag: prismStag, mind_leviathan: mindLeviathan, quasar_phoenix: quasarPhoenix, chrononaut, astral_sage: astralSage, eclipse_seraph: eclipseSeraph, singularity_dragon: singularityDragon, ouroboros, architect };
  /** The Cosmic ones: a black hole behind them, coloured stars circling them. */
  const COSMIC = new Set(['singularity_dragon', 'ouroboros', 'architect']);
  /** Each stage a size of the ascended one. */
  const STAGE_K = [0.62, 0.76, 0.9, 1];
  function draw(ctx, id, stage, pose, size = 80) {
    if (!h) h = MUTANT_ART.H;
    const fn = SPECIES[id];
    if (!fn) return;
    const st = Math.max(1, Math.min(4, stage | 0));
    const s = (size / 80) * STAGE_K[st - 1];
    h.setLine(1.3, '#1c1426');
    ctx.save();
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 5, 0, 0, TAU); ctx.fill();
    const cosmic = COSMIC.has(id);
    if (cosmic) cosmicAura(ctx, pose.t || 0, false);
    fn(ctx, { t: pose.t || 0, st, walk: pose.walk || 0, atk: pose.atk == null ? -1 : pose.atk, sp: pose.sp == null ? -1 : pose.sp });
    if (cosmic) cosmicAura(ctx, pose.t || 0, true);
    ctx.restore();
  }
  /** Undoes part (`k` of 1) of a stage's shrinking, for drawings where a young one would be too small. */
  const grow = (stage, k) => Math.pow(1 / STAGE_K[Math.max(1, Math.min(4, stage | 0)) - 1], k);
  return { draw, grow, SPECIES, COSMIC, STAGE_K, crystal, coil, leaf, hsl, strikeK, setH: () => { h = MUTANT_ART.H; } };
})();
