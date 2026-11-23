/**
 * Merge Beasts battle mode (1.4): the enemies' look. Every enemy is drawn on the battle canvas
 * from parts (a body plan, a head, a hat, a weapon, a shield, a cape, wings...) as described in
 * battle_data.js, posed each frame: walking, a light or heavy attack, being hit, dying, taking
 * coins. Shadow folk are black with glowing eyes and a coloured rim. Nothing here looks like a
 * beast: people, monsters, aliens and machines, drawn upright and side-on to the beasts' round shapes.
 *
 * ENEMY_ART.draw(ctx, id, pose, px) draws enemy `id` with its feet at (0, 0), `px` pixels tall
 * for a size-1 enemy. pose: { t, walk (0-1 cycle), atk (0-1 through a swing, or -1), heavy,
 * hurt (0-1 flash), dying (0-1), capture (bool), seed }.
 */
const ENEMY_ART = (() => {
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = (k) => k * k * (3 - 2 * k);

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }

  /** The colours of one enemy: fill, a darker and lighter fill, outline, rim and eyes. */
  function palette(look) {
    const sh = !!look.shadow;
    return {
      shadow: sh,
      skin: look.skin, skinD: shade(look.skin, sh ? 0.06 : -0.22), skinL: shade(look.skin, sh ? 0.1 : 0.25),
      cloth: look.cloth, clothD: shade(look.cloth, sh ? 0.05 : -0.25), clothL: shade(look.cloth, sh ? 0.12 : 0.22),
      trim: look.trim, trimD: shade(look.trim, -0.3),
      line: sh ? shade(look.trim, 0.2) : '#1c1426',
      eye: look.eye,
      metal: sh ? '#1a1626' : '#c8ccd6', metalD: sh ? '#120f1c' : '#8a90a0', wood: sh ? '#1d1828' : '#8a5a2a',
    };
  }

  // ------------------------------------------------------------------ drawing helpers
  function path(ctx, fill, line, lw, draw) {
    ctx.beginPath();
    draw();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (line) { ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function ellipse(ctx, x, y, rx, ry, fill, line, lw, rot = 0) {
    path(ctx, fill, line, lw, () => ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU));
  }
  function rrect(ctx, x, y, w, h, r, fill, line, lw) {
    path(ctx, fill, line, lw, () => {
      r = Math.min(r, w / 2, h / 2);
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    });
  }
  function limb(ctx, x1, y1, x2, y2, w, col, line) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = line;
    ctx.lineWidth = w + 2.4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  /**
   * A soft glow (no shadowBlur, which is slow on phones): a radial gradient spot, drawn once per
   * colour into a small picture and stamped from then on (a dozen enemies made fifty gradients a frame).
   */
  const glows = new Map();
  function glowSprite(col) {
    let c = glows.get(col);
    if (!c) {
      c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, col);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 64);
      glows.set(col, c);
    }
    return c;
  }
  function glow(ctx, x, y, r, col, a = 0.8) {
    if (r <= 0) return;
    ctx.globalAlpha *= a;
    ctx.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha /= a;
  }
  /** Eyes: glowing for shadow folk and machines, white with a pupil for people. */
  function eyes(ctx, P, x, y, gap, r, kind, n = 2) {
    const pts = n === 1 ? [[x, y]] : n === 3 ? [[x - gap, y + r * 0.3], [x, y - r * 0.6], [x + gap, y + r * 0.3]] : [[x - gap / 2, y], [x + gap / 2, y]];
    for (const [ex, ey] of pts) {
      if (P.shadow || kind === 'glow') {
        glow(ctx, ex, ey, r * 3.2, P.eye, 0.55);
        ellipse(ctx, ex, ey, r * 1.05, r * 0.75, P.eye, null);
        ellipse(ctx, ex, ey, r * 0.45, r * 0.32, '#ffffff', null);
      } else if (kind === 'black') {
        ellipse(ctx, ex, ey, r * 1.25, r * 1.6, '#0c0c14', null, 0, ex < x ? 0.35 : -0.35);
        ellipse(ctx, ex - r * 0.3, ey - r * 0.5, r * 0.35, r * 0.4, '#ffffff', null);
      } else {
        ellipse(ctx, ex, ey, r, r * 1.1, '#ffffff', P.line, 1);
        ellipse(ctx, ex, ey + r * 0.15, r * 0.55, r * 0.6, P.eye, null);
        ellipse(ctx, ex - r * 0.2, ey - r * 0.2, r * 0.2, r * 0.2, '#ffffff', null);
      }
    }
  }

  // ------------------------------------------------------------------ weapons
  /** A weapon in a hand at (hx, hy), pointing along `ang` (radians, 0 = right, -PI/2 = up). */
  function weapon(ctx, P, look, kind, hx, hy, ang, s, heavy) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(ang);
    const L = P.line, lw = 1.4;
    const metal = P.metal, wood = P.wood;
    const glowCol = P.shadow ? P.trim : look.trim;
    switch (kind) {
      case 'sword': case 'cutlass': case 'katana': case 'laser_sword': {
        const len = kind === 'katana' ? 26 : 22;
        const blade = kind === 'laser_sword' ? look.trim : metal;
        if (kind === 'laser_sword') glow(ctx, len * 0.55 * s, 0, 9 * s, look.trim, 0.7);
        rrect(ctx, 0, -1.8 * s, len * s, 3.6 * s, 1.5 * s, blade, L, lw);
        rrect(ctx, -2 * s, -4 * s, 2.6 * s, 8 * s, 1, P.trim, L, lw);
        rrect(ctx, -7 * s, -1.4 * s, 5 * s, 2.8 * s, 1, wood, L, lw);
        break;
      }
      case 'dagger': case 'dual':
        rrect(ctx, 0, -1.4 * s, 11 * s, 2.8 * s, 1, metal, L, lw);
        rrect(ctx, -4 * s, -1.2 * s, 4 * s, 2.4 * s, 1, wood, L, lw);
        break;
      case 'spear': case 'pike': case 'pitchfork': case 'trident': case 'halberd': case 'lance': {
        const len = kind === 'pike' ? 46 : kind === 'lance' ? 42 : 34;
        rrect(ctx, -10 * s, -1.3 * s, (len + 10) * s, 2.6 * s, 1, wood, L, lw);
        ctx.save(); ctx.translate(len * s, 0);
        if (kind === 'pitchfork' || kind === 'trident') {
          for (const dy of [-3.5, 0, 3.5]) rrect(ctx, 0, (dy - 0.8) * s, 8 * s, 1.6 * s, 0.8, metal, L, 1);
          rrect(ctx, -1 * s, -4.4 * s, 2 * s, 8.8 * s, 1, metal, L, 1);
        } else if (kind === 'halberd') {
          path(ctx, metal, L, lw, () => { ctx.moveTo(-4 * s, -1); ctx.lineTo(4 * s, -9 * s); ctx.lineTo(8 * s, -2 * s); ctx.lineTo(10 * s, 0); ctx.lineTo(0, 2 * s); ctx.closePath(); });
        } else if (kind === 'lance') {
          path(ctx, look.trim, L, lw, () => { ctx.moveTo(-14 * s, -4.5 * s); ctx.lineTo(10 * s, 0); ctx.lineTo(-14 * s, 4.5 * s); ctx.closePath(); });
        } else {
          path(ctx, metal, L, lw, () => { ctx.moveTo(0, -3.5 * s); ctx.lineTo(10 * s, 0); ctx.lineTo(0, 3.5 * s); ctx.closePath(); });
        }
        ctx.restore();
        break;
      }
      case 'axe': case 'dual_axe':
        rrect(ctx, -6 * s, -1.4 * s, 26 * s, 2.8 * s, 1, wood, L, lw);
        path(ctx, metal, L, lw, () => { ctx.moveTo(14 * s, -1.5 * s); ctx.quadraticCurveTo(22 * s, -12 * s, 26 * s, -7 * s); ctx.quadraticCurveTo(22 * s, 0, 26 * s, 7 * s); ctx.quadraticCurveTo(22 * s, 12 * s, 14 * s, 1.5 * s); ctx.closePath(); });
        break;
      case 'club':
        path(ctx, wood, L, lw, () => { ctx.moveTo(-4 * s, -2 * s); ctx.lineTo(18 * s, -6 * s); ctx.quadraticCurveTo(28 * s, 0, 18 * s, 6 * s); ctx.lineTo(-4 * s, 2 * s); ctx.closePath(); });
        for (const k of [12, 18, 23]) ellipse(ctx, k * s, (k % 2 ? -4 : 4) * s, 1.4 * s, 1.4 * s, P.shadow ? P.trim : '#d8d0c0', null);
        break;
      case 'hammer':
        rrect(ctx, -6 * s, -1.4 * s, 26 * s, 2.8 * s, 1, wood, L, lw);
        rrect(ctx, 18 * s, -7 * s, 9 * s, 14 * s, 2 * s, metal, L, lw);
        break;
      case 'pick':
        rrect(ctx, -6 * s, -1.4 * s, 24 * s, 2.8 * s, 1, wood, L, lw);
        path(ctx, metal, L, lw, () => { ctx.moveTo(16 * s, -1); ctx.quadraticCurveTo(20 * s, -12 * s, 10 * s, -16 * s); ctx.lineTo(19 * s, -2 * s); ctx.quadraticCurveTo(20 * s, 12 * s, 10 * s, 16 * s); ctx.lineTo(16 * s, 1); ctx.closePath(); });
        break;
      case 'scythe':
        rrect(ctx, -10 * s, -1.4 * s, 40 * s, 2.8 * s, 1, wood, L, lw);
        path(ctx, P.shadow ? P.trim : metal, L, lw, () => { ctx.moveTo(30 * s, 0); ctx.quadraticCurveTo(28 * s, -18 * s, 8 * s, -20 * s); ctx.quadraticCurveTo(22 * s, -12 * s, 27 * s, 0); ctx.closePath(); });
        break;
      case 'shovel':
        rrect(ctx, -6 * s, -1.3 * s, 26 * s, 2.6 * s, 1, wood, L, lw);
        path(ctx, metal, L, lw, () => { ctx.moveTo(18 * s, -5 * s); ctx.lineTo(28 * s, -5 * s); ctx.quadraticCurveTo(32 * s, 0, 28 * s, 5 * s); ctx.lineTo(18 * s, 5 * s); ctx.closePath(); });
        break;
      case 'staff': case 'orb_staff':
        rrect(ctx, -8 * s, -1.4 * s, 36 * s, 2.8 * s, 1, wood, L, lw);
        glow(ctx, 30 * s, 0, (heavy ? 13 : 9) * s, glowCol, 0.75);
        ellipse(ctx, 30 * s, 0, 4 * s, 4 * s, kind === 'orb_staff' ? look.trim : shade(glowCol, 0.4), L, 1);
        break;
      case 'lantern':
        rrect(ctx, 0, -1, 10 * s, 2, 1, P.metalD, L, 1);
        glow(ctx, 14 * s, 0, 14 * s, look.eye, 0.85);
        rrect(ctx, 10 * s, -5 * s, 8 * s, 10 * s, 2 * s, shade(look.eye, -0.2), L, lw);
        break;
      case 'bow': case 'longbow': {
        const h = kind === 'longbow' ? 18 : 14;
        ctx.strokeStyle = L; ctx.lineWidth = 3.4 * s;
        ctx.beginPath(); ctx.arc(0, 0, h * s, -1.2, 1.2); ctx.stroke();
        ctx.strokeStyle = wood; ctx.lineWidth = 2 * s;
        ctx.beginPath(); ctx.arc(0, 0, h * s, -1.2, 1.2); ctx.stroke();
        ctx.strokeStyle = P.shadow ? P.trim : '#eee'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(Math.cos(-1.2) * h * s, Math.sin(-1.2) * h * s); ctx.lineTo(-4 * s, 0); ctx.lineTo(Math.cos(1.2) * h * s, Math.sin(1.2) * h * s); ctx.stroke();
        break;
      }
      case 'crossbow':
        rrect(ctx, -4 * s, -2 * s, 20 * s, 4 * s, 1, wood, L, lw);
        ctx.strokeStyle = P.metalD; ctx.lineWidth = 2.4 * s;
        ctx.beginPath(); ctx.arc(14 * s, 0, 9 * s, -1.9, 1.9, true); ctx.stroke();
        break;
      case 'raygun': case 'rifle': case 'long_rifle': {
        const len = kind === 'long_rifle' ? 30 : kind === 'rifle' ? 22 : 12;
        rrect(ctx, -3 * s, -2.6 * s, len * s, 5.2 * s, 2 * s, P.metal, L, lw);
        rrect(ctx, -2 * s, 0, 4 * s, 7 * s, 1.5 * s, P.metalD, L, lw);
        ellipse(ctx, len * s, 0, 2.6 * s, 2.6 * s, look.trim, L, 1);
        glow(ctx, len * s, 0, 6 * s, look.trim, 0.6);
        break;
      }
      case 'blades':
        path(ctx, P.shadow ? P.trim : shade(look.cloth, 0.3), L, lw, () => { ctx.moveTo(0, -2 * s); ctx.quadraticCurveTo(14 * s, -12 * s, 26 * s, -4 * s); ctx.quadraticCurveTo(14 * s, -4 * s, 0, 2 * s); ctx.closePath(); });
        break;
      case 'claws':
        for (const dy of [-3, 0, 3]) path(ctx, P.shadow ? P.trim : '#f0e8d8', L, 1, () => { ctx.moveTo(2 * s, (dy - 1) * s); ctx.quadraticCurveTo(9 * s, dy * s, 11 * s, (dy + 3) * s); ctx.lineTo(3 * s, (dy + 1) * s); ctx.closePath(); });
        break;
      case 'wrench':
        rrect(ctx, -4 * s, -1.8 * s, 20 * s, 3.6 * s, 1.5 * s, P.metal, L, lw);
        path(ctx, P.metal, L, lw, () => { ctx.arc(19 * s, 0, 5 * s, 0.9, Math.PI * 2 - 0.9); ctx.lineTo(19 * s, 0); ctx.closePath(); });
        break;
      case 'sling':
        ctx.strokeStyle = P.shadow ? P.trim : '#8a6a4a'; ctx.lineWidth = 1.2 * s;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8 * s, -10 * s, 14 * s, -4 * s); ctx.stroke();
        ellipse(ctx, 14 * s, -4 * s, 3.2 * s, 3 * s, '#c8c8d0', L, 1);
        break;
      case 'cannon':
        rrect(ctx, -6 * s, -4.5 * s, 24 * s, 9 * s, 4 * s, '#3a3a44', L, lw);
        ellipse(ctx, 18 * s, 0, 4.5 * s, 4.5 * s, '#1a1a22', L, 1);
        rrect(ctx, -2 * s, 3 * s, 6 * s, 6 * s, 2 * s, P.wood, L, 1);
        break;
      case 'drum':
        ellipse(ctx, 6 * s, 6 * s, 8 * s, 6 * s, P.trim, L, lw);
        rrect(ctx, 0, 0, 2 * s, 12 * s, 1, wood, L, 1);
        break;
      case 'flute':
        rrect(ctx, 0, -1.2 * s, 16 * s, 2.4 * s, 1, P.trim, L, 1);
        break;
      case 'lute':
        ellipse(ctx, 10 * s, 0, 7 * s, 6 * s, P.wood, L, lw);
        rrect(ctx, 14 * s, -1.2 * s, 12 * s, 2.4 * s, 1, P.wood, L, 1);
        break;
      case 'potion':
        ellipse(ctx, 4 * s, 0, 5 * s, 5 * s, look.trim, L, lw);
        rrect(ctx, 8 * s, -1.6 * s, 4 * s, 3.2 * s, 1, '#d8c8a8', L, 1);
        glow(ctx, 4 * s, 0, 8 * s, look.trim, 0.4);
        break;
      default: break;
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ heads and hats
  function head(ctx, P, look, x, y, r, pose) {
    const L = P.line;
    const kind = look.head || 'round';
    const skin = P.skin;
    if (look.hair === 'snakes') for (let i = 0; i < 7; i++) {
      const a = -Math.PI + (i / 6) * Math.PI;
      const wob = Math.sin(pose.t * 6 + i) * 0.25;
      limb(ctx, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, x + Math.cos(a + wob) * r * 1.55, y + Math.sin(a + wob) * r * 1.4, r * 0.22, shade(look.skin, -0.1), L);
    }
    if (look.hair === true) for (let i = 0; i < 5; i++) limb(ctx, x + (i - 2) * r * 0.4, y - r * 0.4, x + (i - 2) * r * 0.55 + Math.sin(pose.t * 3 + i) * 2, y + r * 1.6, r * 0.32, P.cloth, L);
    if (look.ears) {
      for (const side of [-1, 1]) path(ctx, P.skinD, L, 1.2, () => { ctx.moveTo(x + side * r * 0.8, y - r * 0.2); ctx.lineTo(x + side * r * 1.75, y - r * 0.75); ctx.lineTo(x + side * r * 0.85, y + r * 0.35); ctx.closePath(); });
    }
    switch (kind) {
      case 'alien':
        ellipse(ctx, x, y - r * 0.2, r * 1.15, r * 1.25, skin, L, 1.6);
        ellipse(ctx, x - r * 0.3, y - r * 0.6, r * 0.4, r * 0.25, P.skinL, null);
        eyes(ctx, P, x, y + r * 0.05, r * 0.95, r * 0.42, 'black');
        return;
      case 'mantis':
        path(ctx, skin, L, 1.6, () => { ctx.moveTo(x - r * 1.2, y - r * 0.6); ctx.quadraticCurveTo(x, y - r * 0.9, x + r * 1.2, y - r * 0.6); ctx.lineTo(x, y + r * 1.1); ctx.closePath(); });
        eyes(ctx, P, x, y - r * 0.4, r * 1.3, r * 0.42, 'glow');
        limb(ctx, x - r * 0.4, y - r * 0.8, x - r * 0.9, y - r * 1.9, 1.4, skin, L);
        limb(ctx, x + r * 0.4, y - r * 0.8, x + r * 0.9, y - r * 1.9, 1.4, skin, L);
        return;
      case 'bug':
        ellipse(ctx, x, y, r * 1.05, r * 0.95, skin, L, 1.6);
        eyes(ctx, P, x, y - r * 0.1, r * 1.0, r * 0.38, 'glow');
        limb(ctx, x - r * 0.5, y - r * 0.8, x - r * 1.0, y - r * 1.7, 1.2, P.skinD, L);
        limb(ctx, x + r * 0.5, y - r * 0.8, x + r * 1.0, y - r * 1.7, 1.2, P.skinD, L);
        ellipse(ctx, x - r * 1.0, y - r * 1.75, 1.6, 1.6, look.trim, null);
        ellipse(ctx, x + r * 1.0, y - r * 1.75, 1.6, 1.6, look.trim, null);
        return;
      case 'robot':
        rrect(ctx, x - r, y - r, r * 2, r * 1.9, r * 0.35, P.metal, L, 1.6);
        rrect(ctx, x - r * 0.75, y - r * 0.4, r * 1.5, r * 0.6, r * 0.25, '#14161e', null);
        eyes(ctx, P, x, y - r * 0.1, r * 0.7, r * 0.22, 'glow');
        limb(ctx, x, y - r, x, y - r * 1.5, 1.2, P.metalD, L);
        ellipse(ctx, x, y - r * 1.55, 1.8, 1.8, look.trim, null);
        return;
      case 'crystal':
        path(ctx, skin, L, 1.6, () => { ctx.moveTo(x, y - r * 1.4); ctx.lineTo(x + r, y - r * 0.2); ctx.lineTo(x + r * 0.6, y + r); ctx.lineTo(x - r * 0.6, y + r); ctx.lineTo(x - r, y - r * 0.2); ctx.closePath(); });
        path(ctx, P.skinL, null, 0, () => { ctx.moveTo(x, y - r * 1.4); ctx.lineTo(x + r * 0.3, y - r * 0.1); ctx.lineTo(x - r * 0.2, y + r * 0.2); ctx.closePath(); });
        eyes(ctx, P, x, y + r * 0.1, r * 0.7, r * 0.22, 'glow');
        return;
      default: break;
    }
    // Faces of people and shadow folk.
    ellipse(ctx, x, y, r, r * 1.02, skin, L, 1.6);
    if (!P.shadow) ellipse(ctx, x - r * 0.35, y - r * 0.4, r * 0.35, r * 0.22, P.skinL, null);
    else { ctx.strokeStyle = P.trim; ctx.lineWidth = 1.2; ctx.globalAlpha *= 0.8; ctx.beginPath(); ctx.arc(x, y, r * 0.92, -2.6, -0.6); ctx.stroke(); ctx.globalAlpha /= 0.8; }
    const n = look.eyes || 2;
    if (kind === 'hood') {
      path(ctx, P.clothD, L, 1.6, () => { ctx.moveTo(x - r * 1.15, y + r * 0.6); ctx.quadraticCurveTo(x - r * 1.25, y - r * 1.4, x, y - r * 1.45); ctx.quadraticCurveTo(x + r * 1.25, y - r * 1.4, x + r * 1.15, y + r * 0.6); ctx.quadraticCurveTo(x, y - r * 0.35, x - r * 1.15, y + r * 0.6); ctx.closePath(); });
    }
    if (kind === 'mask') path(ctx, P.shadow ? '#d8d8f0' : P.clothD, L, 1.2, () => { ctx.ellipse(x, y + r * 0.1, r * 0.85, r * 0.5, 0, 0, TAU); });
    if (kind === 'visor') { rrect(ctx, x - r * 0.95, y - r * 0.45, r * 1.9, r * 0.75, r * 0.3, '#151822', L, 1.2); glow(ctx, x, y - r * 0.08, r * 0.9, look.trim, 0.35); }
    if (kind === 'cyborg') { rrect(ctx, x, y - r * 0.6, r * 0.95, r * 1.1, r * 0.2, P.metal, L, 1.2); }
    if (kind !== 'visor') eyes(ctx, P, x, y + (kind === 'hood' ? r * 0.12 : 0), r * 0.7, r * (P.shadow ? 0.2 : 0.22), P.shadow ? 'glow' : (kind === 'cyborg' ? 'person' : 'person'), n);
    if (kind === 'cyborg') { glow(ctx, x + r * 0.45, y, r * 0.6, look.eye, 0.6); ellipse(ctx, x + r * 0.45, y, r * 0.2, r * 0.2, look.eye, null); }
    if (look.patch) { rrect(ctx, x + r * 0.05, y - r * 0.25, r * 0.55, r * 0.45, r * 0.15, '#111', null); limb(ctx, x - r, y - r * 0.6, x + r, y - r * 0.15, 0.8, '#111', '#111'); }
    if (look.goggles) { ellipse(ctx, x - r * 0.35, y, r * 0.35, r * 0.32, 'rgba(160,255,140,0.5)', '#333', 2); ellipse(ctx, x + r * 0.35, y, r * 0.35, r * 0.32, 'rgba(160,255,140,0.5)', '#333', 2); }
    if (!P.shadow && kind !== 'mask' && kind !== 'visor') {
      // A mouth: a frown for most, tusks for orcs.
      ctx.strokeStyle = L; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y + r * 0.7, r * 0.28, -2.6, -0.5); ctx.stroke();
      if (look.tusks) for (const sd of [-1, 1]) path(ctx, '#f6f0dc', L, 0.8, () => { ctx.moveTo(x + sd * r * 0.35, y + r * 0.62); ctx.lineTo(x + sd * r * 0.42, y + r * 0.25); ctx.lineTo(x + sd * r * 0.2, y + r * 0.6); ctx.closePath(); });
    }
    if (look.beard) path(ctx, look.beard, L, 1.2, () => { ctx.moveTo(x - r * 0.85, y + r * 0.2); ctx.quadraticCurveTo(x - r * 0.6, y + r * 1.8, x, y + r * 1.9); ctx.quadraticCurveTo(x + r * 0.6, y + r * 1.8, x + r * 0.85, y + r * 0.2); ctx.quadraticCurveTo(x, y + r * 0.85, x - r * 0.85, y + r * 0.2); ctx.closePath(); });
    if (kind === 'helm') {
      path(ctx, P.metal, L, 1.6, () => { ctx.moveTo(x - r * 1.08, y + r * 0.15); ctx.quadraticCurveTo(x - r * 1.1, y - r * 1.3, x, y - r * 1.3); ctx.quadraticCurveTo(x + r * 1.1, y - r * 1.3, x + r * 1.08, y + r * 0.15); ctx.lineTo(x + r * 0.55, y + r * 0.15); ctx.lineTo(x + r * 0.55, y - r * 0.2); ctx.lineTo(x - r * 0.55, y - r * 0.2); ctx.lineTo(x - r * 0.55, y + r * 0.15); ctx.closePath(); });
      limb(ctx, x, y - r * 1.3, x, y - r * 0.25, 1.4, P.metalD, P.metalD);
      if (look.armor) path(ctx, P.trim, null, 0, () => { ctx.ellipse(x, y - r * 1.38, r * 0.25, r * 0.5, 0, 0, TAU); });
    }
    if (kind === 'bald' && !P.shadow) ellipse(ctx, x, y - r * 0.7, r * 0.5, r * 0.15, P.skinL, null);
    if (kind === 'astro') {
      ctx.globalAlpha *= 0.35; ellipse(ctx, x, y - r * 0.05, r * 1.45, r * 1.42, '#c8e8ff', null); ctx.globalAlpha /= 0.35;
      ellipse(ctx, x, y - r * 0.05, r * 1.45, r * 1.42, null, '#e8f4ff', 1.8);
      ellipse(ctx, x - r * 0.6, y - r * 0.6, r * 0.35, r * 0.2, 'rgba(255,255,255,0.8)', null, 0, -0.6);
      rrect(ctx, x - r * 1.1, y + r * 1.15, r * 2.2, r * 0.5, r * 0.2, P.cloth, P.line, 1.2);
    }
    hat(ctx, P, look, x, y, r, pose);
  }

  function hat(ctx, P, look, x, y, r, pose) {
    const L = P.line;
    const h = look.hat;
    if (!h) return;
    switch (h) {
      case 'straw':
        ellipse(ctx, x, y - r * 0.6, r * 1.7, r * 0.42, P.shadow ? P.cloth : '#e8c86a', L, 1.4);
        path(ctx, P.shadow ? P.clothL : '#f0d47a', L, 1.4, () => { ctx.ellipse(x, y - r * 0.85, r * 0.85, r * 0.6, 0, Math.PI, TAU); ctx.closePath(); });
        break;
      case 'wizard': case 'mitre': {
        const col = h === 'mitre' ? '#f4f0e0' : P.clothD;
        path(ctx, col, L, 1.6, () => { ctx.moveTo(x - r * 1.3, y - r * 0.55); ctx.quadraticCurveTo(x + r * 0.1, y - r * 3.3 + Math.sin(pose.t * 2) * 1.5, x + r * 0.6, y - r * 3.0); ctx.lineTo(x + r * 1.3, y - r * 0.55); ctx.closePath(); });
        ellipse(ctx, x, y - r * 0.6, r * 1.45, r * 0.3, col, L, 1.4);
        if (h === 'wizard' && !P.shadow) for (const [sx, sy] of [[-0.3, -1.4], [0.3, -2.1]]) ellipse(ctx, x + sx * r, y + sy * r, 1.5, 1.5, '#ffd700', null);
        if (h === 'mitre') limb(ctx, x, y - r * 0.8, x + r * 0.2, y - r * 2.6, 1.6, '#ffd700', '#ffd700');
        break;
      }
      case 'horns':
        for (const sd of [-1, 1]) path(ctx, P.shadow ? P.trim : '#e8dcc4', L, 1.3, () => { ctx.moveTo(x + sd * r * 0.45, y - r * 0.75); ctx.quadraticCurveTo(x + sd * r * 1.25, y - r * 1.1, x + sd * r * 1.05, y - r * 1.9); ctx.quadraticCurveTo(x + sd * r * 0.85, y - r * 1.2, x + sd * r * 0.15, y - r * 0.95); ctx.closePath(); });
        break;
      case 'cap':
        path(ctx, P.clothD, L, 1.4, () => { ctx.ellipse(x, y - r * 0.45, r * 1.02, r * 0.75, 0, Math.PI, TAU); ctx.closePath(); });
        ellipse(ctx, x + r * 0.5, y - r * 0.42, r * 0.75, r * 0.18, P.clothD, L, 1.2);
        break;
      case 'helmet':
        path(ctx, P.shadow ? P.clothL : '#e8c040', L, 1.4, () => { ctx.ellipse(x, y - r * 0.35, r * 1.1, r * 0.95, 0, Math.PI, TAU); ctx.closePath(); });
        glow(ctx, x, y - r * 0.95, r * 0.6, '#fff4b0', 0.7);
        ellipse(ctx, x, y - r * 0.95, r * 0.22, r * 0.18, '#fffbe0', L, 1);
        break;
      case 'crown': {
        const g = P.shadow ? '#5c4a1f' : '#ffd23a';
        path(ctx, g, L, 1.4, () => { ctx.moveTo(x - r * 0.95, y - r * 0.6); for (let i = 0; i <= 4; i++) { const px = x - r * 0.95 + (i / 4) * r * 1.9; ctx.lineTo(px, y - r * (i % 2 ? 1.25 : 1.75)); } ctx.lineTo(x + r * 0.95, y - r * 0.6); ctx.closePath(); });
        for (const k of [-0.5, 0, 0.5]) ellipse(ctx, x + k * r, y - r * 0.85, 1.6, 1.6, P.shadow ? look.eye : '#ff3c5a', null);
        if (P.shadow) glow(ctx, x, y - r * 1.2, r, look.eye, 0.35);
        break;
      }
      case 'jester':
        for (const sd of [-1, 1]) {
          path(ctx, sd < 0 ? P.trim : P.clothL, L, 1.3, () => { ctx.moveTo(x, y - r * 0.8); ctx.quadraticCurveTo(x + sd * r * 1.4, y - r * 2.2, x + sd * r * 1.8, y - r * 1.2); ctx.lineTo(x + sd * r * 0.8, y - r * 0.5); ctx.closePath(); });
          ellipse(ctx, x + sd * r * 1.85, y - r * 1.15, 2.4, 2.4, P.shadow ? look.eye : '#ffd700', L, 1);
        }
        break;
      case 'feather':
        path(ctx, P.clothD, L, 1.3, () => { ctx.ellipse(x, y - r * 0.6, r * 1.15, r * 0.5, -0.1, Math.PI, TAU); ctx.closePath(); });
        limb(ctx, x + r * 0.4, y - r * 0.9, x + r * 1.5, y - r * 2.1, 2.4, look.trim, L);
        break;
      case 'viking':
        path(ctx, P.metal, L, 1.4, () => { ctx.ellipse(x, y - r * 0.35, r * 1.1, r * 1.0, 0, Math.PI, TAU); ctx.closePath(); });
        for (const sd of [-1, 1]) path(ctx, '#f0e6d0', L, 1.2, () => { ctx.moveTo(x + sd * r * 0.9, y - r * 0.8); ctx.quadraticCurveTo(x + sd * r * 1.8, y - r * 1.0, x + sd * r * 1.6, y - r * 2.0); ctx.quadraticCurveTo(x + sd * r * 1.3, y - r * 1.2, x + sd * r * 0.7, y - r * 1.15); ctx.closePath(); });
        break;
      case 'pirate':
        path(ctx, '#1c1c24', L, 1.4, () => { ctx.moveTo(x - r * 1.5, y - r * 0.5); ctx.quadraticCurveTo(x, y - r * 2.4, x + r * 1.5, y - r * 0.5); ctx.quadraticCurveTo(x, y - r * 0.9, x - r * 1.5, y - r * 0.5); ctx.closePath(); });
        ellipse(ctx, x, y - r * 1.1, 2, 2, '#f0f0f0', null);
        break;
      case 'bearskin':
        path(ctx, '#18141c', L, 1.4, () => { ctx.ellipse(x, y - r * 1.2, r * 1.0, r * 1.6, 0, Math.PI * 0.95, Math.PI * 2.05); ctx.closePath(); });
        break;
      case 'bandana':
        path(ctx, look.trim, L, 1.3, () => { ctx.ellipse(x, y - r * 0.5, r * 1.02, r * 0.62, 0, Math.PI, TAU); ctx.closePath(); });
        limb(ctx, x + r * 0.9, y - r * 0.5, x + r * 1.5, y - r * 0.1 + Math.sin(pose.t * 5) * 1.5, 2.2, look.trim, L);
        for (const [dx, dy] of [[-0.4, -0.75], [0.2, -0.85], [0.6, -0.6]]) ellipse(ctx, x + dx * r, y + dy * r, 1.2, 1.2, '#ffffff', null);
        break;
      case 'halo_ring':
        ctx.strokeStyle = look.trim; ctx.lineWidth = 2;
        glow(ctx, x, y - r * 1.6, r, look.trim, 0.4);
        ctx.beginPath(); ctx.ellipse(x, y - r * 1.6, r * 0.9, r * 0.28, 0, 0, TAU); ctx.stroke();
        break;
      default: break;
    }
  }

  /**
   * How each weapon is used (Sam, 18 Nov: more kinds of attack). Blades slash in an arc with a
   * swoosh, heavy tools come down from overhead, spears lunge, daggers jab twice, claws rake, bows
   * are drawn and loosed, guns kick back with a flash, staffs are raised to charge over a glowing
   * ring and swung forward, slings whirl, potions are thrown, instruments are played.
   */
  const STYLE = {
    sword: 'slash', cutlass: 'slash', katana: 'slash', laser_sword: 'slash', axe: 'slash', dual_axe: 'slash', scythe: 'slash', blades: 'slash',
    spear: 'thrust', pike: 'thrust', pitchfork: 'thrust', trident: 'thrust', halberd: 'thrust', lance: 'thrust',
    hammer: 'smash', club: 'smash', pick: 'smash', shovel: 'smash', wrench: 'smash',
    dagger: 'stab', dual: 'stab', claws: 'claw',
    bow: 'bow', longbow: 'bow', crossbow: 'gun', raygun: 'gun', rifle: 'gun', long_rifle: 'gun', cannon: 'gun',
    staff: 'magic', orb_staff: 'magic', lantern: 'magic', potion: 'throw', sling: 'sling',
    flute: 'music', lute: 'music', drum: 'music', none: 'punch',
  };
  const styleOf = (w) => STYLE[w || 'none'] || 'punch';
  const lerp = (a, b, k) => a + (b - a) * k;

  /**
   * How a person walks (Sam, 18 Nov: "improved walking or running animation ... depending on
   * their stats or who they are"). Thieves and ninjas sneak low and quick with their arms swept
   * back; soldiers and knights march with high knees and stiff arms; pirates and vikings swagger
   * with a rolling sway; scarecrows and grave diggers shamble, dragging a leg with the head lolling;
   * robots clank in steps, never bobbing, the head twitching; jesters, imps and goblins skip; the
   * moon's people bound in its low gravity, legs tucked at the top of each leap; the big and heavy
   * stomp; runners sprint; casters glide; swarms scurry. `cad` is how quickly the steps come.
   */
  const GAITS = {
    walk: { stride: 5, bob: 1.6, arms: 0.3, sway: 0.025, cad: 1 },
    sprint: { stride: 7.5, bob: 2.4, arms: 0.7, sway: 0.02, cad: 1.15 },
    sneak: { stride: 7, bob: 1.1, arms: 0.12, sway: 0.01, cad: 1.3, crouch: 5, swept: true, weave: 2.5 },
    march: { stride: 5, bob: 1.1, arms: 0.6, sway: 0, cad: 1, knee: 2.2 },
    stomp: { stride: 4.5, bob: 3.2, arms: 0.22, sway: 0.07, cad: 0.85 },
    swagger: { stride: 5, bob: 1.8, arms: 0.45, sway: 0.1, cad: 0.9, wide: 0.3 },
    shamble: { stride: 4, bob: 1.3, arms: 0.1, sway: 0.09, cad: 0.7, drag: true, loll: true },
    mech: { stride: 4.5, bob: 0, arms: 0.1, sway: 0, cad: 0.9, steps: true },
    bound: { stride: 6, bob: 9, arms: 0.5, sway: 0.02, cad: 0.55, tuck: true, balance: true },
    skip: { stride: 5, bob: 4.5, arms: 0.65, sway: 0.05, cad: 1.1, tuck: true },
    glide: { stride: 1.6, bob: 0.5, arms: 0.1, sway: 0, hover: 2.5, cad: 1 },
    scurry: { stride: 4, bob: 1.9, arms: 0.4, sway: 0.03, cad: 1.45 },
  };
  const GAIT_WORDS = [
    ['sneak', /thief|ninja|cloak|smuggl|night_blade|jet_scav|cultist/],
    ['swagger', /pirate|deckhand|corsair|first_mate|quartermaster|gunner|bounty|viking|gladiator|captain_comet|berserker/],
    ['march', /knight|guard|militia|pike|trooper|paladin|herald|commander|captain|royal|crossbow|archer|samurai/],
    ['shamble', /scarecrow|grave|puppet|peasant|mummy|zombie|ghoul|farmer/],
    ['mech', /robot|cyborg|command_bot|droid/],
    ['skip', /jester|satyr|bard|imp|goblin|powder_monkey/],
  ];
  const gaits = new Map();
  /** An enemy's walk: from its name, its world (the moon's low gravity) or its part in a fight. */
  function gaitOf(e) {
    if (gaits.has(e.id)) return gaits.get(e.id);
    let g = null;
    for (const [k, re] of GAIT_WORDS) if (re.test(e.id)) { g = k; break; }
    if (!g && e.world === 4 && e.role !== 'caster' && e.role !== 'boss') g = 'bound';
    if (!g) g = e.role === 'runner' ? 'sprint' : e.role === 'caster' ? 'glide' : e.role === 'swarm' ? 'scurry'
      : e.role === 'tank' || e.role === 'brute' || e.role === 'boss' || e.look.build === 'heavy' ? 'stomp' : 'walk';
    gaits.set(e.id, g);
    return g;
  }
  /**
   * How a person attacks besides its weapon's own swing, from who it is and its part (so its
   * stats): runners leap in; quick blades slash twice; spinning weapons spin on a heavy blow; the
   * heavy jump and pound the ground; shield bearers bash with the shield; marksmen kneel to shoot;
   * bosses roar with their arms flung wide before a heavy blow; staffs with orbs spin them up.
   */
  function flairOf(e, style, heavy) {
    const w = e.look.weapon || 'none';
    const melee = ['slash', 'smash', 'thrust', 'stab', 'claw', 'punch'].includes(style);
    if (e.role === 'boss' && heavy) return 'roar';
    if (heavy && ['dual_axe', 'blades', 'scythe', 'dual', 'laser_sword'].includes(w)) return 'spin';
    if (heavy && style === 'smash' && (e.look.build === 'heavy' || e.role === 'brute' || e.role === 'tank')) return 'pound';
    if (e.look.shield && melee && !heavy) return 'bash';
    if (style === 'slash' && (e.role === 'runner' || e.role === 'swarm')) return 'double';
    if (melee && (e.role === 'runner' || gaitOf(e) === 'sneak' || gaitOf(e) === 'skip')) return 'leap';
    if ((style === 'gun' || style === 'bow') && (/long_|sniper|crossbow|longbow/.test(w + e.id))) return 'kneel';
    if (w === 'orb_staff') return 'orbs';
    return null;
  }

  // ------------------------------------------------------------------ body plans
  /**
   * A person standing up (and shadow folk, robots, aliens on two legs). How it walks comes from its
   * part in a fight: runners stride long and pump their arms, the heavy stomp and sway, casters
   * glide with their feet barely moving, swarms scurry. How it attacks comes from its weapon (STYLE).
   */
  function biped(ctx, P, look, pose) {
    const L = P.line;
    const heavy = look.build === 'heavy';
    const thin = !!look.thin;
    const bw = heavy ? 15 : thin ? 8.5 : 11;
    const role = pose.role || 'grunt';
    const w = look.weapon || 'none';
    const style = styleOf(w);
    const gName = pose.gait || (role === 'runner' ? 'sprint' : role === 'caster' ? 'glide' : role === 'swarm' ? 'scurry' : role === 'tank' || role === 'brute' || role === 'boss' || heavy ? 'stomp' : 'walk');
    const gait = GAITS[gName] || GAITS.walk;
    const walking = pose.atk < 0 && !pose.capture;
    // The walk's phase: from the distance walked, at the gait's own pace (each enemy a little
    // different, so a crowd does not step in time).
    const W = (pose.walkRaw != null ? pose.walkRaw : pose.walk) * gait.cad * (0.92 + ((pose.seed || 0) % 7) * 0.025);
    let step = Math.sin(W * TAU);
    if (gait.steps) step = Math.round(step * 2) / 2;
    // A leap (bound, skip) rises the whole way up and down each step; a walk bobs.
    const air = gait.tuck && walking ? Math.abs(Math.sin(W * TAU)) : 0;
    let bob = gait.tuck ? (walking ? air * gait.bob : 0) : Math.abs(Math.cos(W * TAU)) * gait.bob;
    bob += gait.hover ? gait.hover + Math.sin(pose.t * 3) * 1.2 : 0;
    if (!walking && !gait.hover) bob *= 0.3;
    const atk = pose.atk;
    const hv = pose.heavy ? 1.45 : 1;
    const flair = atk >= 0 ? pose.flair || null : null;
    // An attack: a wind-up (atk 0 to 0.45), then the blow (p 0 to 1): fast in, slower back.
    const wind = atk < 0 ? 0 : atk < 0.45 ? ease(atk / 0.45) : 0;
    const p = atk < 0.45 ? -1 : (atk - 0.45) / 0.55;
    const hitIn = p < 0 ? 0 : p < 0.3 ? ease(p / 0.3) : 1;
    const back = p < 0.3 ? 0 : ease((p - 0.3) / 0.7);
    const hit = p < 0 ? 0 : hitIn * (1 - back);
    // Arms at rest swing with the walk; an attack moves them (aim is the weapon arm's angle from
    // the shoulder, 0 to the right and PI/2 straight down; reach how far the hand is out).
    let aim = 1.3 - step * gait.arms, reach = 13, offA = 1.95 + step * gait.arms, offReach = 12;
    let wAng = null, lean = step * gait.sway, lunge = 0, squash = 1;
    let swoosh = null, glyph = 0, charge = 0, flash = 0, string = 0, hideWeapon = false, offWeapon = null;
    let lift = 0, spin = 1, kneel = 0, crouch = walking ? gait.crouch || 0 : 0, weave = 0, headTilt = 0, ring = 0, orbs = 0;
    if (walking) {
      // Arms by gait: swept back low (sneak), held out for balance in the air (bound), stiff and
      // high (march), out wide (swagger), hanging limp (shamble).
      if (gait.swept) { aim = 0.75 - step * 0.12; offA = Math.PI - 0.75 - step * 0.12; reach = 14; offReach = 13; }
      if (gait.balance) { const k = air; aim = lerp(aim, 0.15, k); offA = lerp(offA, Math.PI - 0.15, k); }
      if (gait.wide) { aim -= gait.wide; offA += gait.wide; }
      if (gait.weave) weave = Math.sin(W * TAU * 0.5) * gait.weave;
      if (gait.loll) { headTilt = 0.22 + Math.sin(W * TAU * 0.5) * 0.12; lean += Math.sin(W * TAU * 0.5) * 0.05; }
      if (gait.steps) headTilt = Math.floor(pose.t * 1.7 + (pose.seed || 0)) % 4 === 0 ? 0.14 : 0;
    }
    const restRanged = 0.9;
    if (atk >= 0) {
      switch (style) {
        case 'slash': {
          const up = 1.3 - 1.9 * hv;
          aim = p < 0 ? lerp(1.3, up, wind) : lerp(lerp(up, 2.35, hitIn), 1.3, back);
          lean = p < 0 ? -0.08 * wind * hv : 0.15 * hit * hv;
          if (p >= 0 && p < 0.5) swoosh = { from: up, to: aim, a: (1 - p / 0.5) * 0.6 };
          break;
        }
        case 'smash': {
          aim = p < 0 ? lerp(1.3, -1.55, wind) : lerp(lerp(-1.55, 1.65, p < 0.22 ? ease(p / 0.22) : 1), 1.3, back);
          wAng = aim - Math.PI / 2 - 0.1;
          lean = p < 0 ? -0.12 * wind * hv : 0.22 * hit * hv;
          if (p >= 0.18 && p < 0.5) squash = 1 - 0.07 * hv * Math.sin(((p - 0.18) / 0.32) * Math.PI);
          if (p >= 0 && p < 0.3) swoosh = { from: -1.55, to: aim, a: (1 - p / 0.3) * 0.5 };
          break;
        }
        case 'thrust': {
          aim = p < 0 ? lerp(1.1, 0.15, wind) : lerp(0.15, 0.8, hit);
          reach = p < 0 ? lerp(13, 9, wind) : lerp(9, 21, hit);
          wAng = p < 0 ? lerp(0.5, 0.05, wind) : lerp(0.05, 0.45, hit);
          lunge = (p < 0 ? -1.5 * wind : 4.5 * hit) * hv;
          lean = p < 0 ? -0.06 * wind : 0.1 * hit;
          break;
        }
        case 'stab': {
          // Two quick jabs, one with each hand when it holds two.
          const j1 = p < 0 ? 0 : Math.sin(Math.min(1, p / 0.45) * Math.PI);
          const j2 = p < 0.45 ? 0 : Math.sin(Math.min(1, (p - 0.45) / 0.45) * Math.PI);
          aim = p < 0 ? lerp(1.3, 1.75, wind) : 1.0 - 0.3 * j1;
          reach = 11 + 8 * j1;
          offA = p < 0 ? lerp(1.95, 1.4, wind) : 2.1 + 0.3 * j2;
          offReach = 12 + (w === 'dual' ? 8 * j2 : 0);
          lunge = 2.5 * Math.max(j1, j2) * hv;
          lean = -0.05 * wind;
          if (w !== 'dual' && j2) { aim = 1.0 - 0.3 * j2; reach = 11 + 8 * j2; }
          break;
        }
        case 'claw': {
          aim = p < 0 ? lerp(1.3, -0.7, wind) : lerp(-0.7, 2.5, hitIn) * (1 - back) + 1.3 * back;
          offA = p < 0 ? lerp(1.95, 3.9, wind) : lerp(3.9, 0.7, hitIn) * (1 - back) + 1.95 * back;
          lean = p < 0 ? -0.1 * wind : 0.12 * hit;
          lunge = 3 * hit * hv;
          if (p >= 0 && p < 0.45) swoosh = { from: -0.7, to: aim, a: (1 - p / 0.45) * 0.45, claw: true };
          break;
        }
        case 'bow': {
          aim = 0.3;
          wAng = -0.25;
          string = p < 0 ? wind : 0;
          lean = p < 0 ? -0.04 * wind : -0.08 * (1 - hitIn);
          break;
        }
        case 'gun': {
          const kick = p >= 0 && p < 0.3 ? 1 - p / 0.3 : 0;
          aim = 0.3 - 0.4 * kick * hv;
          wAng = -0.25 - 0.3 * kick * hv;
          lean = -0.07 * kick * hv;
          flash = kick;
          if (p < 0) aim = lerp(restRanged, 0.3, wind), wAng = lerp(-0.22, -0.25, wind);
          break;
        }
        case 'magic': {
          aim = p < 0 ? lerp(1.2, -1.15, wind) : lerp(lerp(-1.15, 0.45, hitIn), 1.2, back);
          wAng = p < 0 ? lerp(-1.35, -1.55, wind) : lerp(lerp(-1.55, 0.15, hitIn), -1.35, back);
          glyph = p < 0 ? wind : 1 - hitIn * 0.6 - back * 0.4;
          charge = p < 0 ? wind * hv : (1 - hitIn) * hv;
          lean = p < 0 ? -0.05 * wind : 0.1 * hit;
          break;
        }
        case 'throw': {
          aim = p < 0 ? lerp(1.3, -1.2, wind) : lerp(lerp(-1.2, 0.6, hitIn), 1.3, back);
          wAng = aim - Math.PI / 2;
          hideWeapon = p >= 0.12 && p < 0.75;
          lean = p < 0 ? -0.1 * wind : 0.14 * hit;
          break;
        }
        case 'sling': {
          aim = p < 0 ? lerp(1.3, -1.35, wind) : lerp(-1.35, 0.45, hitIn) * (1 - back) + 1.3 * back;
          wAng = p < 0 ? pose.t * 16 : -0.2;
          lean = p >= 0 ? 0.1 * hit : 0;
          break;
        }
        case 'music': {
          aim = 0.8 + Math.sin(pose.t * 10) * 0.12;
          offA = 1.6 + Math.sin(pose.t * 10 + 1.5) * 0.15;
          lean = Math.sin(pose.t * 8) * 0.07;
          wAng = -0.35;
          charge = p >= 0 ? 1 - p : wind * 0.5;
          break;
        }
        default: { // a punch
          aim = p < 0 ? lerp(1.3, 1.7, wind) : lerp(1.7, 0.75, hit);
          reach = p < 0 ? lerp(13, 9, wind) : lerp(9, 18, hit);
          lunge = 3 * hit * hv;
          lean = p < 0 ? -0.06 * wind : 0.08 * hit;
        }
      }
    } else if (['bow', 'gun', 'magic', 'throw', 'music'].includes(style)) {
      aim = style === 'magic' ? 1.2 - step * 0.1 : restRanged - step * 0.12;
    }
    if (flair) {
      switch (flair) {
        case 'leap': // a hop in at the target: crouch, spring up and forward, land
          if (p < 0) { crouch = 4 * wind; squash = 1 - 0.06 * wind; }
          else { lift = Math.sin(Math.min(1, p / 0.7) * Math.PI) * 9 * hv; lunge += 3 * hit; }
          break;
        case 'double': { // a slash, then a backhand on the way back
          if (p >= 0.5) {
            const q = (p - 0.5) / 0.5;
            aim = lerp(2.35, -0.5, ease(Math.min(1, q / 0.6)));
            lean = -0.12 * Math.sin(q * Math.PI);
            swoosh = q < 0.6 ? { from: 2.35, to: aim, a: (1 - q / 0.6) * 0.55 } : null;
          }
          break;
        }
        case 'spin': // a whirl: the whole body turns once with the blow
          if (p >= 0) { spin = Math.cos(Math.min(1, p / 0.75) * TAU); lift = Math.sin(Math.min(1, p / 0.75) * Math.PI) * 3; }
          break;
        case 'pound': // up into the air on the wind-up, down on the ground with a ring of dust
          if (p < 0) lift = 7 * wind;
          else { lift = p < 0.15 ? 7 * (1 - p / 0.15) : 0; ring = p >= 0.15 && p < 0.75 ? (p - 0.15) / 0.6 : 0; }
          break;
        case 'bash': // the shield shoved out in front
          offA = p < 0 ? lerp(1.95, 2.6, wind) : lerp(2.6, 0.9, hitIn) * (1 - back) + 1.95 * back;
          offReach = p < 0 ? 10 : 12 + 8 * hit;
          aim = 1.5; lunge = 3.5 * hit; lean = -0.1 * hit;
          break;
        case 'kneel': // down on one knee to take aim
          kneel = p < 0 ? wind : p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
          break;
        case 'roar': // arms flung wide and head back, then the blow
          if (p < 0) { aim = lerp(aim, -0.55, wind); offA = lerp(offA, Math.PI + 0.55, wind); headTilt = -0.25 * wind; lift = 2 * wind; ring = wind > 0.5 ? (wind - 0.5) * 2 : 0; }
          break;
        case 'orbs': // orbs circle the staff faster and faster, then fly
          orbs = p < 0 ? wind : p < 0.25 ? 1 - p / 0.25 : 0;
          break;
      }
    }
    const hipY = -22 - bob + crouch * 0.8 + kneel * 6 - lift;
    const legs = look.legs || 'legs';
    ctx.save();
    if (weave) ctx.translate(weave, 0);
    // A whirl turns the whole figure (drawn as it narrows to edge-on and opens again).
    if (spin !== 1) ctx.scale(Math.max(0.08, Math.abs(spin)) * Math.sign(spin || 1), 1);
    // The ground pounded: a ring of dust spreading from the feet.
    if (ring > 0) {
      ctx.save();
      ctx.globalAlpha *= (1 - ring) * 0.8;
      ctx.strokeStyle = P.shadow ? P.trim : '#e8dcc0'; ctx.lineWidth = 2.4 * (1 - ring) + 0.6;
      ctx.beginPath(); ctx.ellipse(0, 0, 10 + ring * 34, 3 + ring * 9, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    // Stomping heavies squash a little as each foot lands.
    if (squash !== 1 || (walking && gait.bob > 3)) {
      const k = squash !== 1 ? squash : gait.tuck ? 1 - 0.07 * Math.pow(1 - air, 6) : 1 - 0.025 * Math.max(0, Math.cos(W * TAU * 2));
      ctx.scale(2 - k, k);
    }
    ctx.translate(0, lunge);
    // Legs: a stride, the shin a shade darker than the thigh, and a boot.
    for (const sd of [-1, 1]) {
      const dragged = gait.drag && sd < 0;
      const sw = (walking ? step : 0) * sd * gait.stride * (dragged ? 0.35 : 1);
      let fx = sd * (bw * 0.45 + crouch * 0.5) + sw * 0.4, fy = -2 + (dragged ? 0 : Math.max(0, sw) * -0.55 * (gait.knee || 1)) - lift;
      let kx = sd * (bw * 0.42 + crouch * 0.9) + sw * 0.25, ky = (hipY + 4 + fy) / 2 - Math.max(0, sw) * 0.4 * (gait.knee || 1);
      if (air > 0.3) { fy -= (air - 0.3) * 6; ky -= (air - 0.3) * 3; kx += sd * (air - 0.3) * 3; }
      if (kneel > 0 && sd < 0) { fx = lerp(fx, -bw * 0.2, kneel); fy = lerp(fy, -1, kneel); kx = lerp(kx, -bw * 0.5, kneel); ky = lerp(ky, -2, kneel); }
      if (kneel > 0 && sd > 0) { kx = lerp(kx, bw * 0.9, kneel); ky = lerp(ky, hipY + 2, kneel); }
      limb(ctx, sd * bw * 0.4, hipY + 4, kx, ky, heavy ? 6.4 : 4.8, P.clothD, L);
      limb(ctx, kx, ky, fx, fy, heavy ? 5.6 : 4.2, P.shadow ? P.clothD : shade(look.cloth, -0.35), L);
      if (legs === 'hooves') ellipse(ctx, fx, fy, 3.2, 2.2, '#2a2018', L, 1);
      else {
        rrect(ctx, fx - 3.8, fy - 2.6, 7.6, 4.2, 1.8, P.shadow ? P.cloth : '#3a2a20', L, 1);
        if (!P.shadow) rrect(ctx, fx - 2.6, fy - 2.2, 3.4, 1.2, 0.6, 'rgba(255,255,255,0.18)', null);
      }
    }
    ctx.save();
    ctx.translate(0, hipY + 6);
    ctx.rotate(lean);
    ctx.translate(0, -(hipY + 6));
    // Cape behind, rippling more when walking fast.
    if (look.cape) path(ctx, look.cape, L, 1.4, () => { const fl = Math.sin(pose.t * (walking ? 7 : 4)) * (walking ? 3 : 2); ctx.moveTo(-bw * 0.9, hipY - 18); ctx.quadraticCurveTo(-bw * 1.6 + fl, hipY + 4, -bw * 1.3 + fl, hipY + 18); ctx.lineTo(bw * 1.3 + fl, hipY + 18); ctx.quadraticCurveTo(bw * 1.6 + fl, hipY + 4, bw * 0.9, hipY - 18); ctx.closePath(); });
    if (look.jetpack) { rrect(ctx, -bw * 0.9, hipY - 20, bw * 1.8, 16, 4, P.metalD, L, 1.2); glow(ctx, 0, hipY + 2, 8 + Math.sin(pose.t * 20) * 1.5, '#ffa040', 0.9); }
    if (look.wings) wings(ctx, P, look, 0, hipY - 14, 1, pose);
    // A glowing ring at the feet while a spell is charged.
    if (glyph > 0) {
      ctx.save();
      ctx.globalAlpha *= 0.75 * glyph;
      ctx.translate(0, -hipY - 6 - 1);
      glow(ctx, 0, hipY + 6, 20, look.trim, 0.4);
      ctx.strokeStyle = look.trim; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(0, hipY + 6, 19, 5.5, 0, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, hipY + 6, 13, 3.8, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = pose.t * 2 + (i * TAU) / 6; ellipse(ctx, Math.cos(a) * 16, hipY + 6 + Math.sin(a) * 4.6, 1.4, 1.4, '#ffffff', null); }
      ctx.restore();
    }
    // Body, shaded on one side, with a collar and a buckle.
    const top = hipY - 20;
    path(ctx, P.cloth, L, 1.8, () => { ctx.moveTo(-bw, top + 4); ctx.quadraticCurveTo(-bw - 1.5, hipY + 2, -bw * 0.8, hipY + 6); ctx.lineTo(bw * 0.8, hipY + 6); ctx.quadraticCurveTo(bw + 1.5, hipY + 2, bw, top + 4); ctx.quadraticCurveTo(0, top - 2, -bw, top + 4); ctx.closePath(); });
    path(ctx, P.clothD, null, 0, () => { ctx.moveTo(bw * 0.35, top + 2); ctx.quadraticCurveTo(bw + 0.5, top + 4, bw, top + 6); ctx.quadraticCurveTo(bw + 1.2, hipY + 2, bw * 0.8, hipY + 5); ctx.lineTo(bw * 0.4, hipY + 5); ctx.closePath(); });
    if (!P.shadow) path(ctx, P.clothL, null, 0, () => { ctx.ellipse(-bw * 0.4, top + 9, bw * 0.35, 5, -0.3, 0, TAU); });
    if (look.armor) { rrect(ctx, -bw * 0.75, top + 5, bw * 1.5, 12, 4, P.metal, L, 1.2); if (!P.shadow) { limb(ctx, -bw * 0.5, top + 9, bw * 0.5, top + 9, 0.8, P.metalD, P.metalD); ellipse(ctx, -bw * 0.35, top + 8, bw * 0.25, 2, 'rgba(255,255,255,0.35)', null); } }
    else if (!P.shadow) path(ctx, P.clothD, null, 0, () => { ctx.moveTo(-3, top + 1); ctx.lineTo(0, top + 6); ctx.lineTo(3, top + 1); ctx.closePath(); });
    rrect(ctx, -bw * 0.85, hipY - 1, bw * 1.7, 3.4, 1.5, P.trim, L, 1);
    rrect(ctx, -2.2, hipY - 1.6, 4.4, 4.6, 1, P.shadow ? P.trim : P.metal, L, 0.8);
    if (P.shadow) { ctx.strokeStyle = P.trim; ctx.lineWidth = 1.3; ctx.globalAlpha *= 0.7; ctx.beginPath(); ctx.moveTo(-bw + 1, top + 6); ctx.quadraticCurveTo(-bw - 0.5, hipY - 2, -bw * 0.8 + 1, hipY + 4); ctx.stroke(); ctx.globalAlpha /= 0.7; }
    if (look.strings) for (const sx of [-bw * 0.8, bw * 0.8, 0]) { ctx.strokeStyle = 'rgba(220,210,255,0.5)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(sx, top); ctx.lineTo(sx * 1.4, top - 90); ctx.stroke(); }
    if (look.tail) limb(ctx, bw * 0.5, hipY + 2, bw * 1.8, hipY - 6 + Math.sin(pose.t * 5) * 3, 2.4, P.skinD, L);
    // Arms.
    const shoulderY = top + 6;
    const offHand = [-bw - 1 + Math.cos(offA) * offReach, shoulderY + Math.sin(offA) * offReach];
    const wHand = [bw + 1 + Math.cos(aim) * reach, shoulderY + Math.sin(aim) * reach];
    // A bow drawn: the off hand pulls the string back to the cheek.
    if (string > 0) { offHand[0] = lerp(offHand[0], wHand[0] - 6 - 10 * string, 0.8); offHand[1] = lerp(offHand[1], wHand[1] - 1, 0.8); }
    limb(ctx, -bw + 1, shoulderY, offHand[0], offHand[1], heavy ? 5.6 : 4.2, P.cloth, L);
    ellipse(ctx, offHand[0], offHand[1], 2.8, 2.8, P.skin, L, 1);
    if (look.twin) { ctx.globalAlpha *= 0.55; ellipse(ctx, -bw - 3, top - 6, 7, 7, P.skin, L, 1.2); ctx.globalAlpha /= 0.55; }
    // Head: it nods with a heavy step and dips into a blow.
    const hr = heavy ? 9.5 : thin ? 8 : 9;
    const hy = top - hr + 2 + Math.sin(pose.t * 2.5) * 0.4 + hit * 1.2;
    if (headTilt) { ctx.save(); ctx.translate(0, hy + hr); ctx.rotate(headTilt); ctx.translate(0, -(hy + hr)); }
    head(ctx, P, look, 0, hy, hr, pose);
    if (headTilt) ctx.restore();
    if (look.shield === 'round') ellipse(ctx, offHand[0] + 2, offHand[1] - 3, 8.5, 9.5, P.shadow ? P.cloth : look.trim, L, 1.6), ellipse(ctx, offHand[0] + 2, offHand[1] - 3, 2.6, 2.6, P.metal, L, 1), (!P.shadow && ellipse(ctx, offHand[0] - 0.5, offHand[1] - 6.5, 3, 2, 'rgba(255,255,255,0.3)', null));
    if (look.shield === 'tower') rrect(ctx, offHand[0] - 7, offHand[1] - 16, 15, 24, 4, P.shadow ? P.cloth : look.trim, L, 1.6), rrect(ctx, offHand[0] - 3.5, offHand[1] - 12, 8, 16, 3, P.metal, null);
    if (look.shield === 'energy') { glow(ctx, offHand[0] + 2, offHand[1] - 4, 15, look.trim, 0.45 + 0.15 * Math.sin(pose.t * 5)); ctx.strokeStyle = look.trim; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(offHand[0] + 2, offHand[1] - 4, 11, -1.9, 1.9); ctx.stroke(); }
    // A heavy blow building: the weapon hand glows.
    if (pose.heavy && wind > 0) glow(ctx, wHand[0], wHand[1], 6 + 12 * wind, look.trim, 0.55 * wind);
    // The swoosh of a blade (or claws) through the air behind it.
    if (swoosh && swoosh.a > 0.02) {
      ctx.save();
      ctx.globalAlpha *= swoosh.a;
      const R = reach + (swoosh.claw ? 8 : 20);
      const a0 = Math.min(swoosh.from, swoosh.to), a1 = Math.max(swoosh.from, swoosh.to);
      ctx.strokeStyle = P.shadow ? P.trim : swoosh.claw ? '#ffe8e0' : '#ffffff';
      ctx.lineCap = 'round';
      for (const [rr, lw] of swoosh.claw ? [[R - 3, 1.4], [R, 1.6], [R + 3, 1.4]] : [[R, pose.heavy ? 5 : 3.5], [R - 4, 1.5]]) {
        ctx.lineWidth = lw;
        ctx.beginPath(); ctx.arc(bw + 1, shoulderY, rr, a0, a1); ctx.stroke();
      }
      ctx.restore();
    }
    limb(ctx, bw - 1, shoulderY, wHand[0], wHand[1], heavy ? 5.6 : 4.2, P.cloth, L);
    if (w === 'dual' || w === 'dual_axe') weapon(ctx, P, look, w === 'dual' ? 'dagger' : 'axe', offHand[0], offHand[1], offA + 0.3 - (style === 'stab' ? 1.6 : 0), 0.9, pose.heavy);
    const ranged = ['bow', 'gun', 'magic', 'throw', 'music'].includes(style);
    const ang = wAng != null ? wAng : ranged ? -0.25 + (1 - aim) * 0.3 : aim - Math.PI / 2 - 0.4;
    if (w !== 'none' && !hideWeapon) weapon(ctx, P, look, w === 'dual' ? 'dagger' : w === 'dual_axe' ? 'axe' : w, wHand[0], wHand[1], ang, 1, pose.heavy);
    // The bowstring pulled, with an arrow on it.
    if (string > 0) {
      const h = (w === 'longbow' ? 18 : 14);
      const tip = (k) => [wHand[0] + Math.cos(ang + k * 1.2) * h, wHand[1] + Math.sin(ang + k * 1.2) * h];
      const [ax, ay] = tip(-1), [bx, by] = tip(1);
      ctx.strokeStyle = P.shadow ? P.trim : '#f4f0e8'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(offHand[0], offHand[1]); ctx.lineTo(bx, by); ctx.stroke();
      limb(ctx, offHand[0], offHand[1], wHand[0] + Math.cos(ang) * 8, wHand[1] + Math.sin(ang) * 8, 1, P.shadow ? P.trim : '#c8a070', L);
    }
    // A muzzle flash as a gun goes off.
    if (flash > 0) {
      const len = w === 'long_rifle' ? 30 : w === 'rifle' ? 22 : w === 'cannon' ? 22 : w === 'crossbow' ? 20 : 12;
      const mx = wHand[0] + Math.cos(ang) * len, my = wHand[1] + Math.sin(ang) * len;
      glow(ctx, mx, my, (8 + 6 * hv) * flash, w === 'crossbow' ? '#ffffff' : '#fff2a0', 0.9);
      if (w !== 'crossbow') path(ctx, '#fff8d0', null, 0, () => { for (let i = 0; i < 5; i++) { const a = ang + (i - 2) * 0.45; ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(a) * 8 * flash, my + Math.sin(a) * 8 * flash); ctx.lineTo(mx + Math.cos(a + 0.2) * 3, my + Math.sin(a + 0.2) * 3); } });
    }
    // A spell gathering at the top of the staff (or a note in the air for a player).
    if (charge > 0) {
      const len = w === 'lantern' ? 14 : style === 'music' ? 10 : 30;
      const cx = wHand[0] + Math.cos(ang) * len, cy = wHand[1] + Math.sin(ang) * len;
      glow(ctx, cx, cy, (5 + 11 * charge), look.trim, 0.85);
      for (let i = 0; i < 4; i++) { const a = pose.t * 5 + (i * TAU) / 4; ellipse(ctx, cx + Math.cos(a) * 7 * charge, cy + Math.sin(a) * 7 * charge, 1.1, 1.1, '#ffffff', null); }
    }
    if (orbs > 0) {
      const cx = wHand[0] + Math.cos(ang) * 28, cy = wHand[1] + Math.sin(ang) * 28;
      for (let i = 0; i < 3; i++) {
        const a = pose.t * (6 + orbs * 14) + (i * TAU) / 3;
        const rr = 13 - orbs * 7;
        glow(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.6, 5, look.trim, 0.8);
        ellipse(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.6, 2, 2, '#ffffff', null);
      }
    }
    ellipse(ctx, wHand[0], wHand[1], 2.9, 2.9, P.skin, L, 1);
    if (look.glow) glow(ctx, 0, top + 10, bw * 1.6, look.trim, 0.35 + 0.15 * Math.sin(pose.t * 6));
    // A hollow chest: a dark hole with a glow and echoes rippling out of it.
    if (look.hollow) {
      glow(ctx, 0, top + 11, bw * 1.3, look.trim, 0.55 + 0.2 * Math.sin(pose.t * 3));
      ellipse(ctx, 0, top + 11, bw * 0.42, 6.5, '#05030a', look.trim, 1.4);
      for (let i = 0; i < 2; i++) { const k = (pose.t * 0.8 + i * 0.5) % 1; ctx.globalAlpha *= 1 - k; ellipse(ctx, 0, top + 11, bw * (0.42 + k * 0.6), 6.5 + k * 6, null, look.trim, 1); ctx.globalAlpha /= Math.max(0.01, 1 - k); }
    }
    ctx.restore();
    ctx.restore();
  }

  function wings(ctx, P, look, x, y, s, pose) {
    const L = P.line;
    const flap = Math.sin(pose.t * (look.wings === 'bug' ? 30 : 9)) * 0.35;
    for (const sd of [-1, 1]) {
      ctx.save();
      ctx.translate(x + sd * 4 * s, y);
      ctx.rotate(sd * (0.35 + flap));
      if (look.wings === 'bug') { ctx.globalAlpha *= 0.55; ellipse(ctx, sd * 13 * s, -4 * s, 13 * s, 5.5 * s, '#e8fff4', L, 1, sd * 0.2); ctx.globalAlpha /= 0.55; }
      else if (look.wings === 'feather') path(ctx, P.clothL, L, 1.3, () => { ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * 18 * s, -18 * s, sd * 30 * s, -10 * s); ctx.lineTo(sd * 24 * s, -2 * s); ctx.lineTo(sd * 26 * s, 3 * s); ctx.lineTo(sd * 16 * s, 2 * s); ctx.lineTo(sd * 14 * s, 8 * s); ctx.closePath(); });
      else path(ctx, P.clothD, L, 1.3, () => { ctx.moveTo(0, 0); ctx.lineTo(sd * 26 * s, -14 * s); ctx.quadraticCurveTo(sd * 22 * s, -4 * s, sd * 26 * s, 4 * s); ctx.quadraticCurveTo(sd * 16 * s, 0, sd * 14 * s, 8 * s); ctx.quadraticCurveTo(sd * 8 * s, 2 * s, 0, 6 * s); ctx.closePath(); });
      ctx.restore();
    }
  }

  /** Floating things: wisps, ghosts, drones, eyes, saucers, brains, swarms. */
  /**
   * Floating things attack by their part too: swarms dart in with a buzz, fliers swoop down and
   * across, floating tanks kick back as they fire, and casters and bosses send rings pulsing out.
   */
  function floater(ctx, P, look, pose) {
    const atk = pose.atk;
    if (atk < 0) { floaterBody(ctx, P, look, pose); return; }
    const wind = atk < 0.45 ? ease(atk / 0.45) : 0;
    const p = atk < 0.45 ? -1 : (atk - 0.45) / 0.55;
    const hit = p < 0 ? 0 : Math.sin(Math.min(1, p / 0.6) * Math.PI);
    const role = pose.role;
    ctx.save();
    if (role === 'swarm') ctx.translate(Math.sin(pose.t * 40) * 2.5 * (wind + hit), hit * 10 - wind * 3);
    else if (role === 'runner') ctx.translate(Math.sin(Math.max(0, p) * Math.PI) * 6, hit * 8 - wind * 5);
    else if (role === 'tank') ctx.translate(0, -hit * 4 + wind * 2);
    floaterBody(ctx, P, look, pose);
    ctx.restore();
    if ((role === 'caster' || role === 'boss' || pose.ranged) && p >= 0 && p < 0.7) {
      const cy = -26 + Math.sin(pose.t * 2.6 + pose.seed) * 3;
      for (let i = 0; i < 2; i++) {
        const k = p / 0.7 - i * 0.25;
        if (k <= 0 || k >= 1) continue;
        ctx.save();
        ctx.globalAlpha *= (1 - k) * 0.8;
        ctx.strokeStyle = look.trim; ctx.lineWidth = 2 * (1 - k) + 0.5;
        ctx.beginPath(); ctx.ellipse(0, cy, 8 + k * 26, 6 + k * 18, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
    }
  }
  function floaterBody(ctx, P, look, pose) {
    const L = P.line;
    const hover = -26 + Math.sin(pose.t * 2.6 + pose.seed) * 3;
    const lunge = pose.atk >= 0 ? Math.sin(Math.min(1, pose.atk) * Math.PI) * (pose.heavy ? 7 : 4) : 0;
    const y = hover + lunge;
    ellipse(ctx, 0, -1, 9, 3, 'rgba(0,0,0,0.18)', null);
    const body = look.body || 'orb';
    switch (body) {
      case 'orb': case 'swarm': case 'moth': case 'bat': case 'bug': {
        const many = body === 'orb' ? 3 : 5;
        for (let i = 0; i < many; i++) {
          const a = pose.t * (body === 'swarm' ? 3 : 1.6) + i * (TAU / many) + pose.seed;
          const ox = Math.cos(a) * 15, oy = Math.sin(a * 1.3) * 9;
          ctx.save(); ctx.translate(ox, y + oy); ctx.scale(1.6, 1.6); ctx.translate(-ox, -(y + oy));
          if (body === 'orb') { glow(ctx, ox, y + oy, 10, P.trim, 0.6); ellipse(ctx, ox, y + oy, 5, 5, P.skin, P.trim, 1.2); eyes(ctx, P, ox, y + oy, 3.2, 0.9, 'glow'); }
          else if (body === 'bat' || body === 'moth') {
            const fl = Math.sin(pose.t * 18 + i) * 0.6;
            for (const sd of [-1, 1]) path(ctx, body === 'moth' ? P.clothL : P.cloth, P.trim, 0.8, () => { ctx.moveTo(ox, y + oy); ctx.lineTo(ox + sd * 7, y + oy - 4 - fl * 3); ctx.lineTo(ox + sd * 5, y + oy + 3); ctx.closePath(); });
            ellipse(ctx, ox, y + oy, 2.6, 3.2, P.skin, P.trim, 0.8);
            eyes(ctx, P, ox, y + oy - 0.5, 2, 0.6, 'glow');
          } else if (body === 'bug') {
            ctx.globalAlpha *= 0.6; for (const sd of [-1, 1]) ellipse(ctx, ox + sd * 4, y + oy - 3, 4, 2, '#e8fff4', null, 0, sd * 0.4); ctx.globalAlpha /= 0.6;
            ellipse(ctx, ox, y + oy, 3.4, 4, P.skin, L, 0.9);
            eyes(ctx, P, ox, y + oy - 1, 2.2, 0.7, 'glow');
          } else { glow(ctx, ox, y + oy, 6, P.trim, 0.5); rrect(ctx, ox - 2, y + oy - 2, 4, 4, 1, P.skin, L, 0.7); }
          ctx.restore();
        }
        return;
      }
      case 'sheet': case 'cloak': case 'robe': {
        const sway = Math.sin(pose.t * 3) * 3;
        const col = body === 'robe' ? P.cloth : P.skin;
        if (look.hair) for (let i = 0; i < 6; i++) limb(ctx, -10 + i * 4, y - 20, -14 + i * 5.6 + sway * 1.4, y + 12 + (i % 2) * 6, 2.6, P.trim, P.line);
        path(ctx, col, L, 1.6, () => {
          ctx.moveTo(-12, y - 6);
          ctx.quadraticCurveTo(-13, y + 14, -10 + sway, y + 22);
          for (let i = 0; i <= 4; i++) ctx.lineTo(-10 + sway + i * 5, y + 22 + (i % 2 ? -4 : 0));
          ctx.quadraticCurveTo(13, y + 14, 12, y - 6);
          ctx.quadraticCurveTo(12, y - 26, 0, y - 26);
          ctx.quadraticCurveTo(-12, y - 26, -12, y - 6);
          ctx.closePath();
        });
        if (P.shadow) { ctx.strokeStyle = P.trim; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, y - 10, 10, -2.6, -0.5); ctx.stroke(); }
        if (body === 'cloak') { path(ctx, '#05040a', null, 0, () => ctx.ellipse(0, y - 12, 7, 8, 0, 0, TAU)); eyes(ctx, P, 0, y - 12, 6, 1.6, 'glow'); }
        else if (body === 'robe') head(ctx, P, look, 0, y - 30, 8, pose);
        else eyes(ctx, P, 0, y - 12, 7, 1.9, 'glow');
        if (look.hat && body !== 'robe') hat(ctx, P, look, 0, y - 18, 10, pose);
        if (look.weapon) {
          const a = pose.atk >= 0 ? -1.2 + Math.sin(pose.atk * Math.PI) * (pose.heavy ? 2.2 : 1.4) : -0.6;
          limb(ctx, 10, y - 4, 18, y + 2, 3.4, col, L);
          weapon(ctx, P, look, look.weapon, 18, y + 2, a, 0.9, pose.heavy);
        }
        return;
      }
      case 'swirl': {
        for (let i = 0; i < 7; i++) {
          const k = i / 6, w = 6 + k * 14, a = pose.t * 9 + i;
          ctx.globalAlpha *= 0.75;
          ellipse(ctx, Math.sin(a) * (2 + k * 3), y + 14 - k * 34, w, 3.5 + k * 2, i % 2 ? P.skin : P.skinD, null);
          ctx.globalAlpha /= 0.75;
        }
        eyes(ctx, P, 0, y - 6, 7, 1.7, 'glow');
        return;
      }
      case 'star': {
        glow(ctx, 0, y - 6, 30, look.trim, 0.55 + 0.15 * Math.sin(pose.t * 4));
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * TAU + pose.t * 0.8;
          path(ctx, look.trim, null, 0, () => { ctx.moveTo(Math.cos(a - 0.12) * 13, y - 6 + Math.sin(a - 0.12) * 13); ctx.lineTo(Math.cos(a) * 21, y - 6 + Math.sin(a) * 21); ctx.lineTo(Math.cos(a + 0.12) * 13, y - 6 + Math.sin(a + 0.12) * 13); ctx.closePath(); });
        }
        ellipse(ctx, 0, y - 6, 14, 14, P.skin, look.trim, 2);
        eyes(ctx, P, 0, y - 7, 9, 2.2, 'glow');
        return;
      }
      case 'eye': {
        const look2 = pose.atk >= 0 ? 0.7 : 0.3;
        glow(ctx, 0, y - 6, 22, look.eye, 0.4);
        ellipse(ctx, 0, y - 6, 14, 13, look.metal ? P.metal : P.skin, L, 1.8);
        ellipse(ctx, 0, y - 4, 10, 8 * (0.6 + look2 * 0.4), '#f4f4f8', L, 1);
        ellipse(ctx, 0, y - 3, 4.6, 4.6, look.eye, null);
        ellipse(ctx, 0, y - 3, 2, 2, '#05050a', null);
        for (const sd of [-1, 1]) limb(ctx, sd * 10, y + 4, sd * 16 + Math.sin(pose.t * 3 + sd) * 3, y + 16, 2.4, P.skinD, L);
        return;
      }
      case 'drone': {
        ellipse(ctx, 0, y - 4, 12, 7, P.metal, L, 1.6);
        rrect(ctx, -6, y - 6, 12, 4, 2, '#151822', null);
        eyes(ctx, P, 0, y - 4, 0, 1.6, 'glow', 1);
        for (const sd of [-1, 1]) { limb(ctx, sd * 10, y - 6, sd * 16, y - 12, 1.6, P.metalD, L); ctx.globalAlpha *= 0.5; ellipse(ctx, sd * 16, y - 13, 8 * Math.abs(Math.sin(pose.t * 30)), 1.4, '#e0e8f0', null); ctx.globalAlpha /= 0.5; }
        if (look.shield === 'energy') { glow(ctx, 0, y + 6, 18, look.trim, 0.4); ctx.strokeStyle = look.trim; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, y - 2, 17, 0.2, Math.PI - 0.2); ctx.stroke(); }
        return;
      }
      case 'harpy': {
        wings(ctx, P, { wings: 'feather' }, 0, y - 6, 0.9, pose);
        path(ctx, P.cloth, L, 1.6, () => ctx.ellipse(0, y, 9, 12, 0, 0, TAU));
        for (const sd of [-1, 1]) limb(ctx, sd * 4, y + 10, sd * 6, y + 18, 2, '#c8a040', L);
        head(ctx, P, { ...look, head: 'round', hair: true }, 0, y - 16, 7.5, pose);
        return;
      }
      case 'brain': {
        if (look.guns) for (const sd of [-1, 1]) { rrect(ctx, sd * 18 - 4, y - 2, 8, 12, 3, P.metal, L, 1.2); glow(ctx, sd * 18, y + 10, 5, look.trim, 0.6); }
        rrect(ctx, -12, y - 2, 24, 14, 6, P.cloth, L, 1.6);
        glow(ctx, 0, y - 10, 20, look.trim, 0.35);
        path(ctx, P.skin, L, 1.6, () => ctx.ellipse(0, y - 12, 15, 12, 0, 0, TAU));
        ctx.strokeStyle = P.skinD; ctx.lineWidth = 1.4;
        for (const [a, b] of [[-8, -16], [0, -20], [7, -14], [-4, -8], [5, -6]]) { ctx.beginPath(); ctx.arc(a, y + b + 6, 4, 0.2, 2.6); ctx.stroke(); }
        eyes(ctx, P, 0, y + 4, 8, 1.8, 'glow');
        if (look.hat) hat(ctx, P, look, 0, y - 16, 10, pose);
        return;
      }
      case 'tank': {
        ellipse(ctx, 0, y + 6, 22, 7, P.clothD, L, 1.6);
        rrect(ctx, -18, y - 8, 36, 14, 6, P.cloth, L, 1.8);
        rrect(ctx, -9, y - 16, 18, 10, 4, P.clothL, L, 1.4);
        const ang = pose.atk >= 0 ? -0.3 + Math.sin(pose.atk * Math.PI) * 0.15 : -0.1;
        ctx.save(); ctx.translate(6, y - 11); ctx.rotate(Math.PI / 2 + ang); rrect(ctx, -2, 0, 4, 20, 2, P.metal, L, 1.2); ctx.restore();
        glow(ctx, 0, y + 12, 14, look.trim, 0.5);
        eyes(ctx, P, -4, y - 12, 0, 1.3, 'glow', 1);
        return;
      }
      case 'saucer': {
        glow(ctx, 0, y + 10, 18, look.trim, pose.atk >= 0 ? 0.8 : 0.4);
        path(ctx, P.metal, L, 1.8, () => ctx.ellipse(0, y, 22, 7, 0, 0, TAU));
        path(ctx, 'rgba(160,240,255,0.55)', L, 1.4, () => { ctx.ellipse(0, y - 4, 10, 8, 0, Math.PI, TAU); ctx.closePath(); });
        if (look.guns) for (const sd of [-1, 1]) rrect(ctx, sd * 16 - 3, y + 2, 6, 6, 2, P.metalD, L, 1);
        for (let i = 0; i < 5; i++) ellipse(ctx, -16 + i * 8, y + 1, 1.5, 1.5, (Math.floor(pose.t * 6) + i) % 2 ? look.trim : '#ffffff', null);
        eyes(ctx, P, 0, y - 6, 4, 1.3, 'black');
        return;
      }
      default: break;
    }
  }

  /** Four legs: hounds, stalkers, chimeras (and the body under a centaur or a cavalier). */
  function quad(ctx, P, look, pose) {
    const L = P.line;
    const long = look.long ? 1.35 : 1;
    const walking = pose.atk < 0 && !pose.capture;
    const step = (pose.walkRaw != null ? pose.walkRaw : pose.walk) * 1.2 * TAU;
    const atk = pose.atk;
    const wind = atk >= 0 && atk < 0.45 ? ease(atk / 0.45) : 0;
    const p = atk >= 0.45 ? (atk - 0.45) / 0.55 : -1;
    const hit = p < 0 ? 0 : Math.sin(Math.min(1, p / 0.7) * Math.PI);
    // The pounce: down on its haunches, then up and at it.
    const leap = !pose.heavy && p >= 0 ? hit * 8 : 0;
    const lunge = atk >= 0 ? (pose.heavy ? hit * 5 : hit * 6) - wind * 2 : 0;
    const shake = pose.heavy && p >= 0 && p < 0.8 ? Math.sin(p * 40) * 0.35 * (1 - p) : 0;
    const gallop = walking ? Math.sin(step) : 0;
    ctx.save();
    ctx.translate(0, -leap + wind * 3);
    ctx.rotate(gallop * 0.07 - (p >= 0 ? hit * 0.12 : 0));
    const y = -16 * long - (walking ? Math.abs(Math.sin(step)) * 2.5 : 0);
    // Front legs together, then back legs together (a gallop); stretched out in a pounce.
    for (const [lx, ph] of [[-11, 0], [-6, 0.35], [11, Math.PI], [6, Math.PI + 0.35]]) {
      const sw = walking ? Math.sin(step + ph) * 5.5 : p >= 0 ? (lx > 0 ? 5 : -5) * hit : 0;
      limb(ctx, lx, y + 4, lx + sw * 0.7, -1 - Math.max(0, Math.cos(step + ph)) * (walking ? 2 : 0) + leap * 0.4, 3.4, P.skinD, L);
    }
    if (look.tail) limb(ctx, -14, y - 2, -24, y - 10 + Math.sin(pose.t * 5) * 3, 2.6, P.skinD, L);
    path(ctx, P.skin, L, 1.8, () => ctx.ellipse(0, y, 15, 8.5, 0, 0, TAU));
    if (look.spikes || P.shadow) for (let i = 0; i < 5; i++) path(ctx, P.shadow ? P.trim : P.skinD, null, 0, () => { const sx = -9 + i * 4.5; ctx.moveTo(sx - 2, y - 7); ctx.lineTo(sx, y - 12 - (i % 2) * 2); ctx.lineTo(sx + 2, y - 7); ctx.closePath(); });
    if (look.mane) path(ctx, look.trim, L, 1.2, () => ctx.ellipse(13, y - 6, 9, 9, 0, 0, TAU));
    // A long head low and forward (down the screen: towards you).
    ctx.save();
    ctx.translate(12 + lunge, y - 4 + lunge * 0.4);
    ctx.rotate(shake);
    path(ctx, P.skin, L, 1.6, () => { ctx.ellipse(0, 0, 8, 6.5, 0.2, 0, TAU); });
    path(ctx, P.skinD, L, 1.3, () => { ctx.ellipse(6, 3, 5.5, 3.5, 0.3, 0, TAU); });
    if (pose.atk >= 0) path(ctx, '#2a0a10', null, 0, () => ctx.ellipse(7, 5, 3.5, 1.4 + Math.sin(pose.atk * Math.PI) * 2, 0.3, 0, TAU));
    for (const sd of [-1, 1]) path(ctx, P.skinD, L, 1, () => { ctx.moveTo(-3, -4); ctx.lineTo(-1 + sd, -11); ctx.lineTo(2, -4); ctx.closePath(); });
    if (look.horns) for (const sd of [-1, 1]) limb(ctx, -1, -5, -4 + sd * 3, -11, 2, '#e8dcc4', L);
    eyes(ctx, P, 0, -1, 5, P.shadow ? 1.4 : 1.6, P.shadow ? 'glow' : 'person');
    ctx.restore();
    if (look.glitch) { ctx.globalAlpha *= 0.3; ctx.translate(Math.sin(pose.t * 37) * 3, 0); path(ctx, look.trim, null, 0, () => ctx.ellipse(0, y, 15, 8.5, 0, 0, TAU)); ctx.translate(-Math.sin(pose.t * 37) * 3, 0); ctx.globalAlpha /= 0.3; }
    ctx.restore();
  }

  /** A horse body with a person on top: a centaur, or a knight on a charger. */
  function centaur(ctx, P, look, pose) {
    const L = P.line;
    const horse = look.rider ? { ...P, skin: '#f0f0f4', skinD: '#c8c8d4' } : P;
    quad(ctx, horse, { ...look, horns: false, tail: true }, pose);
    ctx.save();
    ctx.translate(-2, -24);
    const top = { ...look, legs: 'none' };
    const upper = (c) => {
      const bw = 9;
      path(c, P.cloth, L, 1.6, () => { c.moveTo(-bw, -18); c.quadraticCurveTo(-bw - 1, -2, -bw * 0.8, 2); c.lineTo(bw * 0.8, 2); c.quadraticCurveTo(bw + 1, -2, bw, -18); c.quadraticCurveTo(0, -22, -bw, -18); c.closePath(); });
      if (look.armor || look.rider) rrect(c, -7, -16, 14, 10, 3, P.metal, L, 1.2);
      const atk = pose.atk;
      const aim = atk >= 0 ? 0.2 : 0.7;
      const hand = [bw + 1 + Math.cos(aim) * 11, -14 + Math.sin(aim) * 11];
      limb(c, bw - 1, -14, hand[0], hand[1], 3.8, P.cloth, L);
      weapon(c, P, look, look.weapon, hand[0], hand[1], look.weapon === 'lance' ? 0.15 + (atk >= 0 ? -Math.sin(atk * Math.PI) * 0.3 : 0) : -0.2, 1, pose.heavy);
      ellipse(c, hand[0], hand[1], 2.6, 2.6, P.skin, L, 1);
      head(c, P, top, 0, -27, 8, pose);
    };
    upper(ctx);
    ctx.restore();
  }

  /** Many legs, low and fast: crawlers, mites, the brood mother. */
  function crawler(ctx, P, look, pose) {
    const L = P.line;
    const atk = pose.atk;
    const wind = atk >= 0 && atk < 0.45 ? ease(atk / 0.45) : 0;
    const p = atk >= 0.45 ? (atk - 0.45) / 0.55 : -1;
    const hit = p < 0 ? 0 : Math.sin(Math.min(1, p / 0.5) * Math.PI);
    const walking = atk < 0 && !pose.capture;
    const jitter = walking ? Math.sin(pose.t * 47 + (pose.seed || 0)) * 0.8 : 0;
    // Rearing: the front lifts on the wind-up and comes down on the strike.
    const rear = wind * (pose.heavy ? 0.42 : 0.28) - hit * 0.1;
    ctx.save();
    ctx.translate(jitter, -wind * 4 + hit * 3);
    ctx.translate(0, -12); ctx.rotate(-rear); ctx.translate(0, 12);
    const y = -12;
    for (let i = 0; i < 6; i++) {
      const sd = i < 3 ? -1 : 1;
      const k = i % 3;
      const ph = pose.walk * TAU * 2 + k * 2 + (sd > 0 ? Math.PI : 0);
      const kx = sd * (14 + k * 2), ky = y - 6 + k * 5;
      limb(ctx, sd * 6, y + k * 3, kx, ky + Math.sin(ph) * 3, 2.2, P.skinD, L);
      limb(ctx, kx, ky + Math.sin(ph) * 3, kx + sd * 5, -1, 2, P.skinD, L);
    }
    if (look.sac) { glow(ctx, -6, y - 6, 12, look.trim, 0.5); path(ctx, look.trim, L, 1.2, () => ctx.ellipse(-6, y - 5, 8, 7, 0, 0, TAU)); }
    path(ctx, P.skin, L, 1.8, () => ctx.ellipse(0, y, 12, 9, 0, 0, TAU));
    if (P.shadow) { ctx.strokeStyle = P.trim; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, y, 10, -2.6, -0.6); ctx.stroke(); }
    else ellipse(ctx, -4, y - 4, 5, 2.5, P.skinL, null);
    const bite = pose.atk >= 0 ? Math.sin(pose.atk * Math.PI) : 0;
    for (const sd of [-1, 1]) path(ctx, P.shadow ? P.trim : '#f0e8d0', L, 1, () => { ctx.moveTo(sd * 3, y + 7); ctx.quadraticCurveTo(sd * (7 + bite * 3), y + 12, sd * 2, y + 15); ctx.lineTo(sd * 1.5, y + 9); ctx.closePath(); });
    eyes(ctx, P, 0, y + 1, 7, 1.5, 'glow', 3);
    // A spitter's glob gathering at its mouth.
    if (pose.ranged && (wind > 0 || (p >= 0 && p < 0.25))) { const k = wind > 0 ? wind : 1 - p / 0.25; glow(ctx, 0, y + 14, 6 + 6 * k, look.trim, 0.8 * k); ellipse(ctx, 0, y + 14, 2.6 * k, 2.6 * k, look.trim, null); }
    ctx.restore();
  }

  /** A serpent (and the gorgon queen's serpent tail): segments in an S that slither. */
  function serpent(ctx, P, look, pose) {
    const L = P.line;
    const segs = 9;
    for (let i = segs - 1; i >= 0; i--) {
      const k = i / segs;
      const sx = Math.sin(pose.walk * TAU * 2 + i * 0.75) * (5 + k * 12);
      const sy = -6 - i * 6.2;
      const r = 8 - k * 4;
      ellipse(ctx, sx, sy + 12, r * 1.2, r * 0.9, i % 2 ? P.skin : P.skinD, L, 1.4);
      if (!P.shadow) ellipse(ctx, sx, sy + 12 + r * 0.35, r * 0.6, r * 0.3, P.skinL, null);
      if (P.shadow && i % 2) { ctx.strokeStyle = P.trim; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx, sy + 12, r * 0.8, -2.5, -0.7); ctx.stroke(); }
    }
    const satk = pose.atk;
    const swind = satk >= 0 && satk < 0.45 ? ease(satk / 0.45) : 0;
    const sp = satk >= 0.45 ? (satk - 0.45) / 0.55 : -1;
    const shit = sp < 0 ? 0 : Math.sin(Math.min(1, sp / 0.5) * Math.PI);
    const lunge = satk >= 0 ? (shit * (pose.heavy ? 14 : 9) - swind * 7) : 0;
    if (look.torso) {
      ctx.save(); ctx.translate(0, -24);
      biped(ctx, P, { ...look, legs: 'none', head: look.head || 'round', weapon: 'bow' }, { ...pose, walk: 0 });
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(Math.sin(pose.walk * TAU * 2) * 4, -2 + lunge);
    path(ctx, P.skin, L, 1.6, () => ctx.ellipse(0, 0, 10, 8, 0, 0, TAU));
    if (look.horns) for (const sd of [-1, 1]) limb(ctx, sd * 5, -5, sd * 10, -13, 2.4, P.shadow ? P.trim : '#e8dcc4', L);
    eyes(ctx, P, 0, -2, 8, 1.7, 'glow');
    if (pose.atk >= 0) path(ctx, P.shadow ? P.trim : '#ff5c7a', null, 0, () => { ctx.moveTo(-1, 6); ctx.lineTo(0, 12 + lunge); ctx.lineTo(1, 6); ctx.closePath(); });
    ctx.restore();
  }

  /** Blobs: goo in a suit, the eyestalk, the tentacle thing. */
  function blob(ctx, P, look, pose) {
    const L = P.line;
    const walking = pose.atk < 0 && !pose.capture;
    const hop = walking ? Math.abs(Math.sin((pose.walkRaw != null ? pose.walkRaw : pose.walk) * TAU * 1.5)) : 0;
    const batk = pose.atk;
    const bwind = batk >= 0 && batk < 0.45 ? ease(batk / 0.45) : 0;
    const bp = batk >= 0.45 ? (batk - 0.45) / 0.55 : -1;
    const flat = bp < 0 ? 0 : Math.sin(Math.min(1, bp / 0.5) * Math.PI);
    // In the air it stretches; landing and slamming squash it flat.
    const squish = walking ? (hop > 0.25 ? -0.1 * hop : 0.14 * (1 - hop / 0.25)) : -0.16 * bwind + 0.24 * flat;
    const lunge = batk >= 0 ? Math.sin(Math.min(1, batk) * Math.PI) : 0;
    ctx.translate(0, -hop * 7 - bwind * 4);
    if (flat > 0.3) { ctx.save(); ctx.globalAlpha *= flat * 0.7; ctx.strokeStyle = P.shadow ? P.trim : look.trim || '#e8dcc0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, 4 + bwind * 4, 14 + flat * 14, 4 + flat * 3, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    if (look.tentacles) for (let i = 0; i < 6; i++) {
      const a = Math.PI * (0.15 + i * 0.14);
      const len = 16 + (pose.atk >= 0 && i % 2 ? lunge * 10 : 0);
      limb(ctx, Math.cos(a) * 10, -10, Math.cos(a) * (10 + len * 0.6) + Math.sin(pose.t * 4 + i) * 3, -10 + Math.sin(a) * len, 3, P.skinD, L);
    }
    path(ctx, P.skin, L, 1.8, () => ctx.ellipse(0, -14, 15 * (1 + squish), 14 * (1 - squish), 0, 0, TAU));
    ellipse(ctx, -5, -21, 5, 3, P.skinL, null);
    if (look.helmet) {
      path(ctx, 'rgba(200,240,255,0.32)', '#c8d8e8', 1.6, () => ctx.ellipse(0, -16, 17, 17, 0, 0, TAU));
      rrect(ctx, -14, -6, 28, 6, 3, P.cloth, L, 1.4);
    }
    if (look.stalks) for (let i = 0; i < 3; i++) {
      const sx = (i - 1) * 7, top = -34 - (i === 1 ? 5 : 0) + Math.sin(pose.t * 3 + i) * 2;
      limb(ctx, sx, -24, sx * 1.4, top, 2.2, P.skinD, L);
      ellipse(ctx, sx * 1.4, top, 4, 4, '#ffffff', L, 1);
      ellipse(ctx, sx * 1.4, top + 0.5, 1.8, 1.8, '#111', null);
    } else eyes(ctx, P, 0, -15, 8, 2.4, look.helmet ? 'person' : 'glow');
  }

  /** Three tall machine legs under a body: tripods, mech walkers, siege mechs. */
  function tripod(ctx, P, look, pose) {
    const L = P.line;
    const h = 30;
    for (let i = 0; i < 3; i++) {
      const sx = (i - 1) * 14;
      const lift = Math.max(0, Math.sin(pose.walk * TAU + i * 2.1)) * 4;
      limb(ctx, sx * 0.4, -h, sx, -h * 0.5 - lift, 3, P.metalD, L);
      limb(ctx, sx, -h * 0.5 - lift, sx * 1.15, -lift * 0.5, 2.6, P.metal, L);
    }
    const lunge = pose.atk >= 0 ? Math.sin(Math.min(1, pose.atk) * Math.PI) * 3 : 0;
    path(ctx, P.cloth, L, 1.8, () => ctx.ellipse(0, -h - 6 + lunge, 18, 10, 0, 0, TAU));
    path(ctx, P.clothL, null, 0, () => { ctx.ellipse(-4, -h - 10 + lunge, 9, 4, 0, 0, TAU); });
    rrect(ctx, -10, -h - 4 + lunge, 20, 6, 3, '#151822', null);
    eyes(ctx, P, 0, -h - 1 + lunge, 0, 2.2, 'glow', 1);
    glow(ctx, 0, -h - 1 + lunge, 10, look.trim, pose.atk >= 0 ? 0.9 : 0.4);
    for (const sd of [-1, 1]) rrect(ctx, sd * 18 - 3, -h - 6 + lunge, 6, 12, 2, P.metal, L, 1.2);
  }

  /** Four soldiers carrying a log: the battering crew. */
  function ram(ctx, P, look, pose) {
    const L = P.line;
    const push = pose.atk >= 0 ? Math.sin(pose.atk * Math.PI) * (pose.heavy ? 8 : 4) : 0;
    rrect(ctx, -26, -24 + push, 52, 9, 4, P.wood, L, 1.6);
    path(ctx, P.metal, L, 1.4, () => ctx.ellipse(0, -14 + push, 6, 5, 0, 0, TAU));
    for (const [sx, sy] of [[-16, -6], [16, -6], [-8, 2], [8, 2]]) {
      ctx.save(); ctx.translate(sx, sy); ctx.scale(0.55, 0.55);
      biped(ctx, P, { ...look, plan: 'biped', weapon: 'none', head: 'helm', hat: null }, { ...pose, atk: -1, walk: pose.walk + sx * 0.01 });
      ctx.restore();
    }
  }

  // 1.5: World 7's giants are drawn by mutants_art.js (loaded after this file).
  const mutant = (ctx, P, look, pose) => { if (typeof MUTANT_ART !== 'undefined') MUTANT_ART.draw(ctx, P, look, pose); };
  const PLANS = { biped, float: floater, quad, centaur, crawler, serpent, blob, tripod, ram, mutant };

  /**
   * Draw enemy `id` with its feet at (0, 0). `px` is how many pixels a size-1 enemy stands; the
   * enemy's own size scales it. Dying shrinks and fades it (shadow folk melt into wisps; the
   * caller adds the bursts); being hit flashes it white.
   */
  function draw(ctx, id, pose, px) {
    const e = BATTLE_DATA.ENEMIES[id];
    if (!e) return;
    const look = e.look;
    const P = palette(look);
    const s = (px / 60) * (look.size || 1);
    pose = { ...pose, role: e.role, gait: gaitOf(e), flair: pose.atk >= 0 ? flairOf(e, styleOf(look.weapon), pose.heavy) : null };
    ctx.save();
    const d = pose.dying || 0;
    if (d > 0) {
      ctx.globalAlpha *= clamp(1 - d * 1.15, 0, 1);
      if (P.shadow) ctx.scale(1 + d * 0.4, 1 - d * 0.7);
      else { ctx.rotate(d * 1.2 * (pose.seed % 2 ? 1 : -1)); ctx.translate(0, d * 6); }
    }
    if (pose.hurt > 0 && look.plan !== 'mutant') {
      // A white flash over the enemy alone: drawn on a canvas of its own first, then whitened
      // where it is (on the battle canvas that would whiten the ground behind it too).
      const w = Math.ceil(150 * s), h = Math.ceil(160 * s);
      const off = flashCanvas(w, h);
      const o = off.getContext('2d');
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.globalAlpha = 1;
      o.clearRect(0, 0, w, h);
      o.translate(w / 2, h * 0.86);
      o.scale(s, s);
      body(o, P, look, pose);
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.globalCompositeOperation = 'source-atop';
      o.globalAlpha = Math.min(1, pose.hurt) * 0.65;
      o.fillStyle = '#ffffff';
      o.fillRect(0, 0, w, h);
      o.globalCompositeOperation = 'source-over';
      o.globalAlpha = 1;
      ctx.drawImage(off, 0, 0, w, h, -w / 2, -h * 0.86, w, h);
    } else {
      ctx.scale(s, s);
      body(ctx, P, look, pose);
    }
    ctx.restore();
  }

  /** The ground shadow, then the enemy (bobbing as it takes coins). */
  function body(ctx, P, look, pose) {
    // A World 7 giant draws its own shadow and moves (mutants_art.js).
    if (look.plan === 'mutant') { PLANS.mutant(ctx, P, look, pose); return; }
    ellipse(ctx, 0, 0, 16, 4.5, 'rgba(0,0,0,0.28)', null);
    if (pose.capture) ctx.translate(0, Math.abs(Math.sin(pose.t * 9)) * -3);
    const plan = look.plan || 'biped';
    const atk = pose.atk;
    if (plan !== 'biped' && atk >= 0) {
      // Not a person: gather (a crouch, or a glow for something that shoots), then spring.
      const wind = atk < 0.45 ? ease(atk / 0.45) : 0;
      const p = atk < 0.45 ? -1 : (atk - 0.45) / 0.55;
      const hit = p < 0 ? 0 : Math.sin(Math.min(1, p / 0.6) * Math.PI);
      const hv = pose.heavy ? 1.5 : 1;
      const sq = 1 - 0.08 * wind * hv + 0.1 * hit * hv;
      ctx.save();
      ctx.scale(2 - sq, sq);
      ctx.translate(0, hit * 3 * hv);
      (PLANS[plan] || biped)(ctx, P, look, pose);
      ctx.restore();
      if (pose.ranged && (wind > 0 || (p >= 0 && p < 0.3))) {
        const k = wind > 0 ? wind : 1 - p / 0.3;
        const cy = plan === 'float' ? -28 : -18;
        glow(ctx, 0, cy, (6 + 12 * k) * hv, look.trim, 0.7 * k);
        ellipse(ctx, 0, cy, 2.5 * k * hv, 2.5 * k * hv, '#ffffff', null);
      } else if (pose.heavy && wind > 0) glow(ctx, 0, -16, 16 * wind, look.trim, 0.5 * wind);
      return;
    }
    (PLANS[plan] || biped)(ctx, P, look, pose);
  }

  let flashC = null;
  function flashCanvas(w, h) {
    if (!flashC) flashC = document.createElement('canvas');
    if (flashC.width < w) flashC.width = w;
    if (flashC.height < h) flashC.height = h;
    return flashC;
  }

  /** A still picture of an enemy, for the wiki and the level screen (cached). */
  const stills = new Map();
  function still(id, size = 96, silhouette = false) {
    const key = `${id}|${size}|${silhouette}`;
    if (stills.has(key)) return stills.get(key);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const e = BATTLE_DATA.ENEMIES[id];
    const big = (e && e.look.size) || 1;
    ctx.translate(size / 2, size * 0.86);
    // (A World 7 giant spreads wider, wings and all: drawn a little smaller to fit.)
    draw(ctx, id, { t: 0.4, walk: 0.1, atk: -1, heavy: false, hurt: 0, dying: 0, seed: 1 }, ((size * 0.62) / Math.max(1, big)) * (e && e.look.plan === 'mutant' && e.look.boss ? 0.72 : 1));
    if (silhouette) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#5a5480';
      ctx.fillRect(0, 0, size, size);
    }
    const url = c.toDataURL();
    stills.set(key, url);
    return url;
  }

  /** A still already made, or null. */
  const stillReady = (id, size = 96, silhouette = false) => stills.get(`${id}|${size}|${silhouette}`) || null;
  return { draw, still, stillReady, palette, glowSprite, styleOf };
})();
