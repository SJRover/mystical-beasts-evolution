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
  /** A glossy black serpent-dragon on four short clawed legs, molten amber in its cracks. */
  function onyxWyrm(ctx, A) {
    const { shape, ell, stroke, vgrad, tube, chain, glow, eye, paw, lerp, gait, steam } = h;
    const { t, st } = A;
    const g = gait(A, 1.1), k = strikeK(A.atk), sp = A.sp > 0 ? Math.sin(A.sp * Math.PI) : 0;
    const skin = '#24202c', lt = '#5a5670', belly = '#3a3444', sc = 'rgba(160,150,200,0.25)';
    const heat = 0.55 + 0.35 * Math.sin(t * 2.6) + sp * 0.5 + (st >= 4 ? 0.2 : 0);
    const lava = `rgba(255,${150 + Math.round(60 * Math.sin(t * 2.6))},40,${Math.min(1, heat)})`;
    // The body and tail winding back up the field behind it.
    const body = [];
    for (let i = 0; i <= 12; i++) { const q = i / 12; body.push({ x: Math.sin(q * 4 + t * 1.2 + g.W * 2) * 9 * q + 6 * q, y: -16 - q * 40 + Math.sin(q * 3) * 4 }); }
    // Back legs (behind), then the body, then front legs and head.
    for (const sd of [-1, 1]) { const lift = Math.max(0, sd * -g.s) * 3; chain(ctx, [{ x: body[5].x + sd * 6, y: body[5].y + 2 }, { x: body[5].x + sd * 13, y: body[5].y + 8 - lift }, { x: body[5].x + sd * 12, y: body[5].y + 14 - lift }], [3.2, 2.6, 2], skin); paw(ctx, body[5].x + sd * 12, body[5].y + 16 - lift, 2.6, skin, '#d8c8a0', 3); }
    tube(ctx, body, body.map((_, i) => 7 - i * 0.46), skin, belly, sc);
    // Molten cracks and (adult on) a ridge of obsidian spikes along the back.
    body.forEach((p, i) => { if (i % 2 || i > 10) return; const r = 7 - i * 0.46; stroke(ctx, lava, h.LW * 1.3, () => { ctx.moveTo(p.x - r * 0.6, p.y - r * 0.1); ctx.lineTo(p.x - r * 0.1, p.y + r * 0.3); ctx.lineTo(p.x + r * 0.4, p.y - r * 0.2); }); if (st >= 3) shape(ctx, vgrad(ctx, p.y - r - 5, p.y - r, '#8a86a0', '#14101a'), () => { ctx.moveTo(p.x - 1.6, p.y - r * 0.8); ctx.lineTo(p.x + 0.4, p.y - r - 4.6 + i * 0.2); ctx.lineTo(p.x + 1.8, p.y - r * 0.8); }); });
    for (const sd of [-1, 1]) { const lift = Math.max(0, sd * g.s) * 3.4; chain(ctx, [{ x: sd * 6, y: -18 }, { x: sd * 13, y: -11 - lift }, { x: sd * 12, y: -4 - lift }], [4, 3.2, 2.6], skin); paw(ctx, sd * 12.4, -1.4 - lift, 3.4, skin, '#e8d8b0', 3); }
    // The head: long jaws, obsidian horns (young on), amber eyes, smoke from the nostrils.
    const hx = k * 2, hy = -26 + k * 6 - sp * 3;
    if (st >= 2) for (const sd of [-1, 1]) shape(ctx, vgrad(ctx, hy - 20, hy, '#8a86a0', '#14101a'), () => { ctx.moveTo(hx + sd * 4, hy - 5); ctx.quadraticCurveTo(hx + sd * 11, hy - 12, hx + sd * 10, hy - 19 - st * 1.5); ctx.quadraticCurveTo(hx + sd * 7, hy - 11, hx + sd * 2, hy - 7); });
    if (st >= 4) { glow(ctx, hx, hy - 6, 22, '#ff8a2a', 0.35); for (let i = 0; i < 7; i++) { const a = -Math.PI * 0.9 + (i / 6) * Math.PI * 0.8; shape(ctx, lava, () => { ctx.moveTo(hx + Math.cos(a) * 6, hy - 4 + Math.sin(a) * 5); ctx.lineTo(hx + Math.cos(a) * (13 + Math.sin(t * 7 + i) * 1.5), hy - 4 + Math.sin(a) * 11); ctx.lineTo(hx + Math.cos(a + 0.2) * 6, hy - 4 + Math.sin(a + 0.2) * 5); }, null); } }
    const open = Math.max(k, sp);
    shape(ctx, '#14101a', () => { ctx.moveTo(hx - 5, hy + 2); ctx.lineTo(hx - 4, hy + 9 + open * 5); ctx.lineTo(hx + 4, hy + 9 + open * 5); ctx.lineTo(hx + 5, hy + 2); });
    if (open > 0.2) { glow(ctx, hx, hy + 6, 12 * open, '#ff8a2a', 0.8); shape(ctx, '#ffcf6a', () => { ctx.moveTo(hx - 3, hy + 4); ctx.lineTo(hx, hy + 8 + open * 4); ctx.lineTo(hx + 3, hy + 4); }, null); }
    shape(ctx, vgrad(ctx, hy - 9, hy + 6, lt, skin), () => { ctx.moveTo(hx - 7, hy - 3); ctx.quadraticCurveTo(hx, hy - 10, hx + 7, hy - 3); ctx.lineTo(hx + 5, hy + 5); ctx.quadraticCurveTo(hx, hy + 7.4, hx - 5, hy + 5); });
    stroke(ctx, 'rgba(255,255,255,0.35)', h.LW, () => { ctx.moveTo(hx - 4, hy - 6); ctx.quadraticCurveTo(hx, hy - 8, hx + 3, hy - 6.4); });
    stroke(ctx, lava, h.LW, () => { ctx.moveTo(hx - 5.6, hy + 1); ctx.lineTo(hx - 3, hy + 2.4); ctx.moveTo(hx + 5.6, hy + 1); ctx.lineTo(hx + 3, hy + 2.4); });
    eye(ctx, hx - 3.4, hy - 2.4, 1.5, '#ffb43a', 1, 1, true); eye(ctx, hx + 3.4, hy - 2.4, 1.5, '#ffb43a', 1, -1, true);
    ell(ctx, hx - 1.4, hy + 4, 0.5, 0.4, '#ff8a2a', null); ell(ctx, hx + 1.4, hy + 4, 0.5, 0.4, '#ff8a2a', null);
    steam(ctx, hx - 1.4, hy + 3, t, '#6a6070', 2); steam(ctx, hx + 1.4, hy + 3, t + 0.5, '#6a6070', 2);
    if (st >= 4) for (let i = 0; i < 4; i++) { const a = t * 0.8 + i * 1.57, x = Math.cos(a) * 28, y = -36 + Math.sin(a) * 8; if (Math.sin(a) < 0) continue; shape(ctx, vgrad(ctx, y - 6, y + 4, '#8a86a0', '#14101a'), () => { ctx.moveTo(x, y - 6); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 3, y); }); glow(ctx, x, y, 5, '#ff8a2a', 0.4); }
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
    for (let r = 0; r < 4; r++) ell(ctx, 0, -15 - r * 5, 4.6 - Math.abs(r - 1.5) * 0.6, 2, belly, 'rgba(120,80,0,0.6)');
    for (const sd of [-1, 1]) { const f = sd > 0 ? { x: 9 + k * 4, y: -18 - k * 6 } : { x: -9, y: -18 }; chain(ctx, [{ x: sd * 6, y: -30 }, { x: sd * 9.6, y: -24 }, f], [2.4, 2, 1.6], body); paw(ctx, f.x, f.y + 1.6, 2.2, body, '#fff4d0', 3); }
    // The head: a short snout, vine horns curling back, a leaf crest; big green eyes.
    const hx = k * 2, hy = -45 + k * 3;
    for (const sd of [-1, 1]) { stroke(ctx, '#5a7a1a', 1.6, () => { ctx.moveTo(hx + sd * 3.6, hy - 5); ctx.bezierCurveTo(hx + sd * 9, hy - 12, hx + sd * 13, hy - 6, hx + sd * 10, hy - 3); }); if (st >= 2) leaf(ctx, hx + sd * 10, hy - 3, 5, 2.4, sd * 1.9, autumn(12 + sd), 'rgba(120,80,0,0.6)'); }
    if (st >= 3) for (let i = -1; i <= 1; i++) leaf(ctx, hx + i * 2.6, hy - 6.6, 6 + (i ? 0 : 2.4), 2.6, i * 0.4, autumn(20 + i), 'rgba(120,80,0,0.6)');
    shape(ctx, vgrad(ctx, hy - 8, hy + 8, lt, body), () => { ctx.moveTo(hx - 7, hy); ctx.quadraticCurveTo(hx - 6.6, hy - 8, hx, hy - 8.4); ctx.quadraticCurveTo(hx + 6.6, hy - 8, hx + 7, hy); ctx.quadraticCurveTo(hx + 5, hy + 7, hx, hy + 7.4); ctx.quadraticCurveTo(hx - 5, hy + 7, hx - 7, hy); });
    ell(ctx, hx, hy + 4, 3.8, 2.6, '#f4e4a0', null);
    ell(ctx, hx - 1.2, hy + 3.4, 0.45, 0.35, '#5a3a00', null); ell(ctx, hx + 1.2, hy + 3.4, 0.45, 0.35, '#5a3a00', null);
    const open = Math.max(k, sp);
    shape(ctx, '#7a1a1a', () => { ctx.ellipse(hx, hy + 6, 2.2, 0.5 + open * 1.8, 0, 0, TAU); });
    eye(ctx, hx - 3.2, hy - 1.6, 1.9, '#5aff6a'); eye(ctx, hx + 3.2, hy - 1.6, 1.9, '#5aff6a');
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

  const SPECIES = { emerald_serpent: emeraldSerpent, onyx_wyrm: onyxWyrm, gilded_leafwing: gildedLeafwing, grey_envoy: greyEnvoy, nebula_jelly: nebulaJelly };
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
    fn(ctx, { t: pose.t || 0, st, walk: pose.walk || 0, atk: pose.atk == null ? -1 : pose.atk, sp: pose.sp == null ? -1 : pose.sp });
    ctx.restore();
  }
  return { draw, SPECIES, STAGE_K, crystal, coil, leaf, hsl, strikeK, setH: () => { h = MUTANT_ART.H; } };
})();
