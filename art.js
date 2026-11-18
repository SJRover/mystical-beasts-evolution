/**
 * Merge Beasts: the beast artwork (version 1.3 graphics overhaul).
 *
 * Every beast is drawn from its own entry in BEAST_TEMPLATES (beasts.js): its body type, colours,
 * eyes and features (wings, tails, crowns, halos, horns, orbiting moons and so on), so each keeps
 * the identity it always had. Only the drawing is new: a real silhouette for each of the 33 body
 * types, shading, an outline, texture and glossy eyes, with a separate glow for its rarity.
 *
 * On the field each beast is drawn once into a picture (ART.sprite) and the game moves and
 * animates that picture, instead of repainting vector art with blur filters every frame (the old
 * renderer's lag). Menus use the same drawing as a still inline SVG (getBeastSVG below).
 */
const ART = (() => {
  // ---------------------------------------------------------------- colour
  const hex = (h) => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0); };
  const toHex = (r) => '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (h, amt) => { const c = hex(h); return toHex(c.map((v) => (amt > 0 ? v + (255 - v) * amt : v * (1 + amt)))); };
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const lum = (h) => { const [r, g, b] = hex(h); return 0.299 * r + 0.587 * g + 0.114 * b; };

  const ELEMENT_ACCENT = { LIGHT: '#ffe066', FIRE: '#ff7a1a', WATER: '#3fd8ff', EARTH: '#7ad957', WIND: '#b8f5e0', COSMIC: '#b46bff', VOID: '#8a3cff', DEITY: '#fff1b8' };
  const RARITY = {
    COMMON: null,
    RARE: { c: '#46ff6e', c2: '#c9ffd4', rays: 0, glow: 0.55, sparkles: 0 },
    SUPER_RARE: { c: '#3d9bff', c2: '#cfe6ff', rays: 6, glow: 0.65, sparkles: 0 },
    ULTRA_RARE: { c: '#c35cff', c2: '#efd2ff', rays: 8, glow: 0.75, sparkles: 0 },
    LEGENDARY: { c: '#ff9a1f', c2: '#ffe7b0', rays: 12, glow: 0.85, sparkles: 4 },
    GODLY: { c: '#3ff6ff', c2: '#eafeff', rays: 16, glow: 0.95, sparkles: 6 },
    DARK_MATTER: { c: '#ff2fe9', c2: '#ffd0fb', rays: 18, glow: 1, sparkles: 6, dark: true },
  };

  function palette(t, opts) {
    const cols = (t.svgParams && t.svgParams.color) || ['#cccccc', '#888888'];
    let a = cols[0], b = cols[cols.length - 1];
    if (opts.infected) { a = mix(a, '#9b4dff', 0.55); b = mix(b, '#3b0a5c', 0.6); }
    if (opts.shadow) { a = mix(a, '#3a0d18', 0.5); b = mix(b, '#0a0206', 0.6); }
    let light = lum(a) >= lum(b) ? a : b, dark = lum(a) >= lum(b) ? b : a;
    // Very dark beasts (void, dark matter) keep a readable light tone.
    if (lum(light) < 70) light = shade(light, 0.35);
    const accent = opts.infected ? '#9dff4a' : ELEMENT_ACCENT[t.element] || '#ffffff';
    return {
      light, dark, mid: mix(light, dark, 0.5), line: shade(dark, -0.6), deep: shade(dark, -0.3),
      belly: shade(light, 0.5), hi: shade(light, 0.78), rim: shade(light, 0.6), accent,
      detail: shade(dark, -0.35),
    };
  }

  // ---------------------------------------------------------------- small parts
  const f = (n) => Math.round(n * 100) / 100;
  const SW = 3; // outline width
  const path = (d, fill, P, extra = '') => `<path d="${d}" fill="${fill}" stroke="${P.line}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
  const ell = (cx, cy, rx, ry, fill, P, extra = '') => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" stroke="${P.line}" stroke-width="${SW}" ${extra}/>`;
  const line = (d, col, w = 1.6, op = 0.55) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
  const star = (x, y, s, fill, op = 1) => `<path d="M${f(x)} ${f(y - s)} Q${f(x + s * 0.16)} ${f(y - s * 0.16)} ${f(x + s)} ${f(y)} Q${f(x + s * 0.16)} ${f(y + s * 0.16)} ${f(x)} ${f(y + s)} Q${f(x - s * 0.16)} ${f(y + s * 0.16)} ${f(x - s)} ${f(y)} Q${f(x - s * 0.16)} ${f(y - s * 0.16)} ${f(x)} ${f(y - s)} Z" fill="${fill}" opacity="${op}"/>`;
  const gloss = (cx, cy, rx, ry, rot = -28, op = 0.6) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${rot} ${f(cx)} ${f(cy)})" fill="#ffffff" opacity="${op}"/>`;
  const mirror = (s) => `<g transform="translate(120 0) scale(-1 1)">${s}</g>`;

  function eyes(type, A, P, id, opts) {
    const { x: cx, y: cy, gap, r } = A;
    const L = cx - gap, R = cx + gap;
    if (opts.shadow) {
      const e = (x, s) => `<path d="M${f(x - r * 1.2)} ${f(cy - r * 0.2 * s)} L${f(x + r * 1.2)} ${f(cy + r * 0.5 * s)} L${f(x - r * 0.6)} ${f(cy + r * 0.9)} Z" fill="#ff2a2a"/><path d="M${f(x - r * 1.2)} ${f(cy - r * 0.2 * s)} L${f(x + r * 1.2)} ${f(cy + r * 0.5 * s)} L${f(x - r * 0.6)} ${f(cy + r * 0.9)} Z" fill="none" stroke="#ffd0d0" stroke-width="1" opacity="0.8"/>`;
      return e(L, 1) + `<g transform="translate(${f(2 * cx)} 0) scale(-1 1)">${e(L, 1)}</g>` + `<path d="M${f(cx - r * 1.4)} ${f(cy + r * 2)} L${f(cx - r * 0.7)} ${f(cy + r * 2.6)} L${f(cx)} ${f(cy + r * 2)} L${f(cx + r * 0.7)} ${f(cy + r * 2.6)} L${f(cx + r * 1.4)} ${f(cy + r * 2)}" fill="none" stroke="#ff4d4d" stroke-width="1.6" stroke-linejoin="round"/>`;
    }
    if (opts.infected) {
      const sp = (x) => `<circle cx="${f(x)}" cy="${f(cy)}" r="${f(r * 1.05)}" fill="#f4ffe0" stroke="${P.line}" stroke-width="1.6"/><path d="M${f(x)} ${f(cy)} m-${f(r * 0.1)} 0 a${f(r * 0.2)} ${f(r * 0.2)} 0 1 1 ${f(r * 0.3)} 0 a${f(r * 0.45)} ${f(r * 0.45)} 0 1 1 -${f(r * 0.7)} 0 a${f(r * 0.7)} ${f(r * 0.7)} 0 1 1 ${f(r * 1.1)} 0" fill="none" stroke="#5c1a8c" stroke-width="1.5"/>`;
      return sp(L) + sp(R) + `<path d="M${f(cx - r * 0.9)} ${f(cy + r * 2)} Q${f(cx - r * 0.45)} ${f(cy + r * 1.6)} ${f(cx)} ${f(cy + r * 2)} T${f(cx + r * 0.9)} ${f(cy + r * 2)}" fill="none" stroke="${P.line}" stroke-width="1.8" stroke-linecap="round"/><path d="M${f(cx + r * 0.5)} ${f(cy + r * 2.1)} q${f(r * 0.2)} ${f(r * 0.9)} 0 ${f(r * 1.3)}" stroke="#9dff4a" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    }
    const iris = type === 'cosmic' ? `url(#iris-${id})` : `url(#iriss-${id})`;
    const ball = (x) =>
      `<ellipse cx="${f(x)}" cy="${f(cy)}" rx="${f(r)}" ry="${f(r * 1.14)}" fill="#160f22"/>` +
      `<ellipse cx="${f(x)}" cy="${f(cy + r * 0.12)}" rx="${f(r * 0.78)}" ry="${f(r * 0.86)}" fill="${iris}"/>` +
      `<ellipse cx="${f(x)}" cy="${f(cy + r * 0.18)}" rx="${f(r * 0.4)}" ry="${f(r * 0.46)}" fill="#0b0712"/>` +
      (type === 'cosmic'
        ? star(x - r * 0.32, cy - r * 0.36, r * 0.5, '#ffffff')
        : type === 'excited'
          ? star(x - r * 0.3, cy - r * 0.34, r * 0.55, '#ffffff')
          : `<ellipse cx="${f(x - r * 0.32)}" cy="${f(cy - r * 0.38)}" rx="${f(r * 0.4)}" ry="${f(r * 0.44)}" fill="#ffffff"/>`) +
      `<circle cx="${f(x + r * 0.38)}" cy="${f(cy + r * 0.4)}" r="${f(r * 0.17)}" fill="#ffffff" opacity="0.9"/>`;
    const lid = (x) =>
      `<path d="M${f(x - r * 1.18)} ${f(cy - r * 0.05)} Q${f(x)} ${f(cy - r * 1.4)} ${f(x + r * 1.18)} ${f(cy - r * 0.05)} L${f(x + r * 1.18)} ${f(cy - r * 1.45)} L${f(x - r * 1.18)} ${f(cy - r * 1.45)} Z" fill="${P.mid}"/>` +
      `<path d="M${f(x - r * 1.1)} ${f(cy)} Q${f(x)} ${f(cy - r * 0.5)} ${f(x + r * 1.1)} ${f(cy)}" stroke="${P.line}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    const brow = (x, s) => `<path d="M${f(x - r * 1.15 * s)} ${f(cy - r * 1.8)} L${f(x + r * 0.95 * s)} ${f(cy - r * 1.05)}" stroke="${P.line}" stroke-width="2.8" stroke-linecap="round"/>`;
    let out = '';
    if (type === 'sleepy') out = ball(L) + ball(R) + lid(L) + lid(R);
    else if (type === 'wink') out = ball(L) + `<path d="M${f(R - r)} ${f(cy + r * 0.1)} Q${f(R)} ${f(cy - r * 0.9)} ${f(R + r)} ${f(cy + r * 0.1)}" stroke="#160f22" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    else out = ball(L) + ball(R);
    if (type === 'angry') out += brow(L, 1) + brow(R, -1);
    out += `<ellipse cx="${f(L - r * 0.55)}" cy="${f(cy + r * 1.6)}" rx="${f(r * 0.72)}" ry="${f(r * 0.38)}" fill="#ff6b9a" opacity="0.5"/><ellipse cx="${f(R + r * 0.55)}" cy="${f(cy + r * 1.6)}" rx="${f(r * 0.72)}" ry="${f(r * 0.38)}" fill="#ff6b9a" opacity="0.5"/>`;
    if (A.noMouth) return out;
    const my = cy + r * (A.mouthDrop ?? 1.45);
    if (type === 'excited') out += `<path d="M${f(cx - r * 0.75)} ${f(my)} Q${f(cx)} ${f(my + r * 1.2)} ${f(cx + r * 0.75)} ${f(my)} Z" fill="#7a1f3d" stroke="${P.line}" stroke-width="1.4" stroke-linejoin="round"/><path d="M${f(cx - r * 0.35)} ${f(my + r * 0.55)} Q${f(cx)} ${f(my + r * 0.25)} ${f(cx + r * 0.35)} ${f(my + r * 0.55)}" fill="#ff7aa2"/>`;
    else if (type === 'angry') out += `<path d="M${f(cx - r * 0.6)} ${f(my + r * 0.3)} Q${f(cx)} ${f(my - r * 0.2)} ${f(cx + r * 0.6)} ${f(my + r * 0.3)}" stroke="${P.line}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M${f(cx + r * 0.25)} ${f(my + r * 0.12)} l${f(r * 0.18)} ${f(r * 0.45)} l${f(r * 0.18)} -${f(r * 0.38)}" fill="#ffffff" stroke="${P.line}" stroke-width="1"/>`;
    else out += `<path d="M${f(cx - r * 0.5)} ${f(my)} Q${f(cx)} ${f(my + r * 0.55)} ${f(cx + r * 0.5)} ${f(my)}" stroke="${P.line}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    return out;
  }

  // ---------------------------------------------------------------- body types
  // Each returns { back, main, front, A } in a 120 by 120 box, the ground at about y = 108.
  // A: anchors the features hang from. eyes {x, y, gap, r}; top (crown, halo); back (wings);
  // tail {x, y, dir}; chest (cores); horns {x, y, s}; flies (true for fliers); motion.
  const B = {};

  B.droplet = (t, P, id) => {
    const d = 'M60 12 C66 30 93 52 93 77 C93 97 78 107 60 107 C42 107 27 97 27 77 C27 52 54 30 60 12 Z';
    let main = path(d, `url(#body-${id})`, P) + `<path d="${d}" fill="url(#shine-${id})" stroke="none"/>`;
    main += line('M86 66 C92 82 86 98 70 103', P.hi, 3, 0.55) + gloss(45, 56, 6.5, 12) + `<circle cx="52" cy="40" r="2.6" fill="#fff" opacity="0.85"/>`;
    main += `<ellipse cx="60" cy="88" rx="16" ry="8" fill="${P.hi}" opacity="0.25"/>`;
    return { main, A: { eyes: { x: 60, y: 76, gap: 12, r: 6.5 }, top: [60, 12], back: [60, 70, 0.9], tail: [86, 96, 1], chest: [60, 98], horns: [60, 40, 0.8], motion: 'hop' } };
  };

  B.stone = (t, P, id) => {
    const d = 'M26 78 C24 58 36 40 58 38 C82 36 96 54 95 76 C94 96 80 106 60 106 C40 106 27 96 26 78 Z';
    let main = path(d, `url(#body-${id})`, P);
    main += `<path d="M36 52 L52 44 L56 58 L42 64 Z" fill="${P.hi}" opacity="0.35"/><path d="M70 46 L86 56 L78 66 Z" fill="${P.deep}" opacity="0.3"/><path d="M30 84 L44 80 L48 96 L36 98 Z" fill="${P.deep}" opacity="0.3"/><path d="M76 86 L90 80 L86 98 Z" fill="${P.hi}" opacity="0.2"/>`;
    main += line('M52 44 L56 58 L70 60 M56 58 L48 72', P.detail, 1.6, 0.5) + gloss(42, 50, 5, 9, -40, 0.45);
    main += ell(42, 106, 9, 5, P.mid, P) + ell(78, 106, 9, 5, P.mid, P);
    return { main, A: { eyes: { x: 60, y: 74, gap: 12, r: 6.2 }, top: [60, 38], back: [60, 66, 0.9], tail: [92, 92, 1], chest: [60, 90], horns: [60, 44, 0.9], motion: 'hop' } };
  };

  B.spiky_stone = (t, P, id) => {
    const s = B.stone(t, P, id);
    let back = '';
    for (const [x, y, a] of [[34, 50, -40], [48, 40, -15], [64, 37, 5], [80, 44, 30], [92, 60, 55], [26, 66, -65]]) back += `<path d="M${x - 7} ${y + 6} L${x} ${y - 14} L${x + 7} ${y + 6} Z" transform="rotate(${a} ${x} ${y})" fill="${P.deep}" stroke="${P.line}" stroke-width="${SW}" stroke-linejoin="round"/>`;
    s.back = back;
    return s;
  };

  B.cloud = (t, P, id) => {
    const d = 'M28 86 C16 86 14 68 28 66 C26 50 46 44 54 54 C58 38 82 38 86 54 C100 50 108 66 98 74 C108 82 100 96 88 94 C80 104 62 104 56 96 C46 104 30 100 28 86 Z';
    let main = path(d, `url(#body-${id})`, P) + `<path d="${d}" fill="url(#shine-${id})" stroke="none"/>`;
    main += line('M36 70 C40 64 48 64 52 68 M64 56 C70 50 78 52 82 58', P.hi, 2.4, 0.7) + gloss(46, 60, 7, 5, -15, 0.5);
    return { main, A: { eyes: { x: 62, y: 76, gap: 12, r: 6 }, top: [66, 42], back: [62, 72, 1], tail: [96, 86, 1], chest: [62, 88], horns: [64, 48, 0.8], flies: true, motion: 'float' } };
  };

  // Chibi walkers share one frame: a big head over a round body, stubby legs and arms.
  function chibi(P, id, o = {}) {
    const hx = 60, hy = o.hy ?? 48, hr = o.hr ?? 25, by = o.by ?? 86, brx = o.brx ?? 24, bry = o.bry ?? 19;
    let main = '';
    main += ell(hx - 13, 104, 8, 5, P.mid, P) + ell(hx + 13, 104, 8, 5, P.mid, P);
    main += ell(hx, by, brx, bry, `url(#body-${id})`, P);
    main += `<ellipse cx="${hx}" cy="${by + 3}" rx="${brx * 0.58}" ry="${bry * 0.62}" fill="${P.belly}"/>`;
    if (!o.noArms) main += ell(hx - brx + 2, by - 2, 6, 9, `url(#body-${id})`, P, `transform="rotate(20 ${hx - brx + 2} ${by - 2})"`) + ell(hx + brx - 2, by - 2, 6, 9, `url(#body-${id})`, P, `transform="rotate(-20 ${hx + brx - 2} ${by - 2})"`);
    return { main, hx, hy, hr, by };
  }

  B.reptile = (t, P, id) => {
    const c = chibi(P, id);
    let back = path('M78 92 C96 98 110 86 104 72 C101 66 95 68 96 74 C99 80 94 88 80 84 Z', `url(#body-${id})`, P);
    let main = c.main;
    main += `<circle cx="60" cy="48" r="25" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/><circle cx="60" cy="48" r="25" fill="url(#scales-${id})"/>`;
    main += path('M36 40 L26 30 L32 48 Z M84 40 L94 30 L88 48 Z', P.accent, P) + `<path d="M48 24 L52 16 L56 24 L60 15 L64 24 L68 16 L72 24" fill="${P.accent}" stroke="${P.line}" stroke-width="2.2" stroke-linejoin="round"/>`;
    main += gloss(47, 36, 5, 8, -30, 0.5);
    return { back, main, A: { eyes: { x: 60, y: 50, gap: 10, r: 5.6 }, top: [60, 22], back: [60, 74, 0.9], tail: [104, 72, 1], chest: [60, 88], horns: [60, 30, 0.9], motion: 'walk' } };
  };

  B.lizard = (t, P, id) => {
    const r = B.reptile(t, P, id);
    r.main += `<circle cx="48" cy="84" r="3" fill="${P.deep}" opacity="0.4"/><circle cx="72" cy="90" r="2.5" fill="${P.deep}" opacity="0.4"/><circle cx="66" cy="78" r="2" fill="${P.deep}" opacity="0.4"/>`;
    return r;
  };

  B.shell = (t, P, id) => {
    const moss = t.svgParams.shell === 'mossy';
    let main = ell(36, 102, 9, 6, P.belly, P) + ell(84, 102, 9, 6, P.belly, P);
    const dome = 'M18 92 C16 58 36 38 60 38 C84 38 104 58 102 92 Z';
    main += path(dome, `url(#body-${id})`, P);
    main += line('M60 42 L60 92 M34 56 L46 66 L60 62 L74 66 L86 56 M28 80 L46 66 M92 80 L74 66 M46 66 L46 92 M74 66 L74 92', P.detail, 1.8, 0.55);
    main += path('M14 92 L106 92 C104 98 16 98 14 92 Z', P.deep, P);
    if (moss) main += `<path d="M30 54 C34 44 44 42 48 48 C52 40 62 40 64 46 C70 40 80 44 82 52" fill="none" stroke="#5fbf4a" stroke-width="5" stroke-linecap="round" opacity="0.9"/><circle cx="40" cy="48" r="3" fill="#7ad957"/><circle cx="74" cy="46" r="3" fill="#7ad957"/>`;
    main += gloss(40, 58, 6, 10, -40, 0.35);
    // The head, peeking out of the front of the shell.
    main += `<circle cx="60" cy="88" r="17" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/><ellipse cx="60" cy="94" rx="9" ry="5" fill="${P.belly}" opacity="0.8"/>` + gloss(52, 80, 3, 5, -30, 0.5);
    return { main, A: { eyes: { x: 60, y: 86, gap: 7.5, r: 4.4, mouthDrop: 1.5 }, top: [60, 36], back: [60, 62, 0.8], tail: [100, 92, 1], chest: [60, 70], horns: [60, 40, 0.7], motion: 'walk' } };
  };

  function quadHead(P, id, o) {
    // A furry or scaly animal head with ears, a muzzle and cheek fluff.
    const { cx = 60, cy = 50, r = 25, ears = 'point', earCol = P.mid, muzzle = P.belly } = o;
    let s = '';
    if (ears === 'point') s += path(`M${cx - 20} ${cy - 10} L${cx - 26} ${cy - 36} L${cx - 6} ${cy - 22} Z`, earCol, P) + path(`M${cx + 20} ${cy - 10} L${cx + 26} ${cy - 36} L${cx + 6} ${cy - 22} Z`, earCol, P) + `<path d="M${cx - 18} ${cy - 14} L${cx - 22} ${cy - 30} L${cx - 10} ${cy - 21} Z M${cx + 18} ${cy - 14} L${cx + 22} ${cy - 30} L${cx + 10} ${cy - 21} Z" fill="#ff9fb8" opacity="0.8"/>`;
    if (ears === 'round') s += ell(cx - 19, cy - 20, 8, 8, earCol, P) + ell(cx + 19, cy - 20, 8, 8, earCol, P);
    if (ears === 'flame') s += path(`M${cx - 18} ${cy - 12} C${cx - 30} ${cy - 24} ${cx - 22} ${cy - 40} ${cx - 16} ${cy - 44} C${cx - 14} ${cy - 34} ${cx - 6} ${cy - 30} ${cx - 6} ${cy - 20} Z`, '#ff7a1a', P) + path(`M${cx + 18} ${cy - 12} C${cx + 30} ${cy - 24} ${cx + 22} ${cy - 40} ${cx + 16} ${cy - 44} C${cx + 14} ${cy - 34} ${cx + 6} ${cy - 30} ${cx + 6} ${cy - 20} Z`, '#ff7a1a', P) + `<path d="M${cx - 15} ${cy - 18} C${cx - 20} ${cy - 26} ${cx - 17} ${cy - 34} ${cx - 15} ${cy - 37} M${cx + 15} ${cy - 18} C${cx + 20} ${cy - 26} ${cx + 17} ${cy - 34} ${cx + 15} ${cy - 37}" stroke="#ffd43b" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/>`;
    s += `<path d="M${cx - r} ${cy + 6} l-5 3 l6 2 l-4 4 l7 0 M${cx + r} ${cy + 6} l5 3 l-6 2 l4 4 l-7 0" fill="${P.light}" stroke="${P.line}" stroke-width="1.6" stroke-linejoin="round"/>`;
    s += `<ellipse cx="${cx}" cy="${cy + 11}" rx="${r * 0.58}" ry="${r * 0.36}" fill="${muzzle}" stroke="${P.line}" stroke-width="2"/>`;
    s += `<path d="M${cx - 3.5} ${cy + 6} Q${cx} ${cy + 3.5} ${cx + 3.5} ${cy + 6} Q${cx} ${cy + 10} ${cx - 3.5} ${cy + 6} Z" fill="${P.line}"/>`;
    s += gloss(cx - 12, cy - 12, 5, 8, -30, 0.45);
    return s;
  }

  function quadBody(t, P, id, o = {}) {
    let main = '';
    main += ell(44, 103, 7, 5, P.deep, P) + ell(76, 103, 7, 5, P.deep, P);
    main += ell(60, 86, 26, 19, `url(#body-${id})`, P) + `<ellipse cx="60" cy="86" rx="26" ry="19" fill="url(#fur-${id})"/>`;
    main += `<ellipse cx="60" cy="90" rx="13" ry="11" fill="${P.belly}"/>`;
    main += ell(46, 99, 6, 6, P.light, P) + ell(74, 99, 6, 6, P.light, P);
    main += line('M44 102 L44 98 M48 102 L48 98 M72 102 L72 98 M76 102 L76 98', P.line, 1.2, 0.6);
    return main;
  }

  B.fox = (t, P, id) => {
    const back = path('M80 92 C100 94 112 76 104 60 C100 72 92 78 82 80 Z', `url(#body-${id})`, P) + `<path d="M104 60 C108 66 108 72 104 76 C100 72 99 66 104 60 Z" fill="#ffffff" stroke="${P.line}" stroke-width="2"/>`;
    const main = quadBody(t, P, id) + quadHead(P, id, { ears: t.svgParams.ears === 'flame' ? 'flame' : 'point' });
    return { back, main, A: { eyes: { x: 60, y: 47, gap: 10, r: 5.4, mouthDrop: 2.5 }, top: [60, 24], back: [60, 76, 0.9], tail: [104, 66, 1], chest: [60, 88], horns: [60, 28, 0.9], motion: 'walk' } };
  };

  B.wolf = (t, P, id) => {
    const back = path('M80 90 C98 90 110 74 106 58 C100 68 92 74 82 76 Z', `url(#body-${id})`, P);
    let main = quadBody(t, P, id) + quadHead(P, id, { ears: 'point', r: 24 });
    main += path('M38 62 C44 74 52 70 60 76 C68 70 76 74 82 62 C78 80 66 84 60 84 C54 84 42 80 38 62 Z', P.belly, P);
    return { back, main, A: { eyes: { x: 60, y: 47, gap: 10, r: 5.2, mouthDrop: 2.5 }, top: [60, 24], back: [60, 74, 0.9], tail: [106, 60, 1], chest: [60, 88], horns: [60, 28, 0.9], motion: 'walk' } };
  };

  B.cat = (t, P, id) => {
    const back = `<path d="M82 94 C104 98 106 70 96 60 C92 56 88 60 92 64 C98 72 96 88 82 86" fill="none" stroke="${P.line}" stroke-width="12" stroke-linecap="round"/><path d="M82 94 C104 98 106 70 96 60 C92 56 88 60 92 64 C98 72 96 88 82 86" fill="none" stroke="${P.mid}" stroke-width="7" stroke-linecap="round"/>`;
    let main = quadBody(t, P, id) + quadHead(P, id, { ears: 'point' });
    main += line('M36 58 L22 55 M36 62 L22 63 M84 58 L98 55 M84 62 L98 63', P.line, 1.3, 0.7);
    return { back, main, A: { eyes: { x: 60, y: 47, gap: 10, r: 5.6, mouthDrop: 2.5 }, top: [60, 24], back: [60, 76, 0.9], tail: [96, 62, 1], chest: [60, 88], horns: [60, 28, 0.9], motion: 'walk' } };
  };

  B.lion = (t, P, id) => {
    const bubble = t.svgParams.mane === 'bubble';
    let back = path('M80 92 C98 96 104 80 100 70', 'none', P) + `<circle cx="100" cy="68" r="6" fill="${P.deep}" stroke="${P.line}" stroke-width="2.4"/>`;
    let mane = '';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, x = 60 + Math.cos(a) * 30, y = 50 + Math.sin(a) * 30;
      mane += bubble ? `<circle cx="${f(x)}" cy="${f(y)}" r="9" fill="${mix(P.accent, '#ffffff', 0.4)}" stroke="${P.line}" stroke-width="2" opacity="0.95"/><circle cx="${f(x - 3)}" cy="${f(y - 3)}" r="2.5" fill="#fff" opacity="0.8"/>`
        : `<circle cx="${f(x)}" cy="${f(y)}" r="10" fill="${P.deep}" stroke="${P.line}" stroke-width="2.4"/>`;
    }
    const main = quadBody(t, P, id) + mane + quadHead(P, id, { ears: 'round', r: 23 });
    return { back, main, A: { eyes: { x: 60, y: 47, gap: 9.5, r: 5.2, mouthDrop: 2.5 }, top: [60, 18], back: [60, 76, 0.9], tail: [100, 68, 1], chest: [60, 88], horns: [60, 24, 0.9], motion: 'walk' } };
  };

  B.bull = (t, P, id) => {
    let main = quadBody(t, P, id);
    main += path('M36 40 C24 36 16 26 18 14 C24 22 30 26 40 30 Z', '#fff1c1', P) + path('M84 40 C96 36 104 26 102 14 C96 22 90 26 80 30 Z', '#fff1c1', P);
    main += ell(36, 46, 9, 6, P.mid, P, 'transform="rotate(-25 36 46)"') + ell(84, 46, 9, 6, P.mid, P, 'transform="rotate(25 84 46)"');
    main += path('M38 46 C38 28 82 28 82 46 C84 62 76 72 60 72 C44 72 36 62 38 46 Z', `url(#body-${id})`, P);
    main += `<path d="M50 34 C54 30 66 30 70 34 C66 38 54 38 50 34 Z" fill="${P.deep}" opacity="0.6"/>`;
    main += ell(60, 64, 15, 9, P.belly, P) + `<ellipse cx="54" cy="64" rx="2.4" ry="3" fill="${P.line}"/><ellipse cx="66" cy="64" rx="2.4" ry="3" fill="${P.line}"/>`;
    main += `<path d="M54 70 Q60 76 66 70" fill="none" stroke="#ffd43b" stroke-width="2.6" stroke-linecap="round"/>`;
    main += gloss(48, 40, 5, 7, -30, 0.45);
    return { main, A: { eyes: { x: 60, y: 47, gap: 11, r: 5.2, noMouth: true }, top: [60, 26], back: [60, 74, 1], tail: [86, 90, 1], chest: [60, 90], horns: null, motion: 'walk' } };
  };

  B.horse = (t, P, id) => {
    let back = path('M80 88 C96 86 104 98 100 106 C94 100 88 98 82 98 Z', P.accent, P);
    let main = quadBody(t, P, id);
    main += path('M42 30 C40 60 44 76 60 78 C76 76 80 60 78 30 C74 20 46 20 42 30 Z', `url(#body-${id})`, P);
    main += path('M44 30 L40 18 L50 26 Z M76 30 L80 18 L70 26 Z', P.mid, P);
    main += ell(60, 68, 13, 9, P.belly, P) + `<ellipse cx="55" cy="68" rx="2" ry="2.6" fill="${P.line}"/><ellipse cx="65" cy="68" rx="2" ry="2.6" fill="${P.line}"/>`;
    main += path('M50 24 C56 14 70 16 74 26 C70 22 64 22 60 26 C58 22 54 22 50 24 Z', P.accent, P) + path('M78 32 C90 40 88 56 82 62 C82 52 80 44 76 40 Z', P.accent, P);
    main += gloss(50, 36, 4, 8, -20, 0.45);
    return { back, main, A: { eyes: { x: 60, y: 46, gap: 10, r: 5, noMouth: true }, top: [60, 20], back: [60, 76, 1], tail: [100, 104, 1], chest: [60, 90], horns: [60, 22, 0.8], motion: 'walk' } };
  };

  B.dino = (t, P, id) => {
    let back = path('M78 92 C98 98 112 86 106 70 C103 64 97 66 98 72 C100 80 94 88 80 84 Z', `url(#body-${id})`, P);
    if (t.svgParams.back_plates) for (const [x, y] of [[44, 64], [56, 60], [70, 62], [84, 70]]) back += path(`M${x - 6} ${y + 6} L${x} ${y - 10} L${x + 6} ${y + 6} Z`, '#ff7a1a', P);
    let main = chibi(P, id, { noArms: true }).main;
    main += ell(40, 88, 4, 6, P.light, P) + ell(80, 88, 4, 6, P.light, P);
    main += path('M32 50 C32 28 88 28 88 50 C88 62 82 70 60 70 C38 70 32 62 32 50 Z', `url(#body-${id})`, P) + `<path d="M32 50 C32 28 88 28 88 50 C88 62 82 70 60 70 C38 70 32 62 32 50 Z" fill="url(#scales-${id})"/>`;
    main += `<path d="M40 62 L44 67 L48 62 L52 67 L56 62 L60 67 L64 62 L68 67 L72 62 L76 67 L80 62" fill="#ffffff" stroke="${P.line}" stroke-width="1.6" stroke-linejoin="round"/>`;
    main += gloss(44, 40, 5, 8, -30, 0.45);
    return { back, main, A: { eyes: { x: 60, y: 46, gap: 12, r: 5.4, noMouth: true }, top: [60, 32], back: [60, 74, 0.9], tail: [106, 70, 1], chest: [60, 88], horns: [60, 34, 0.9], motion: 'walk' } };
  };

  B.griffin = (t, P, id) => {
    let back = path('M80 94 C96 96 104 86 104 78', 'none', P) + `<path d="M104 78 C110 74 110 66 104 64 C106 70 100 74 104 78 Z" fill="${P.deep}" stroke="${P.line}" stroke-width="2"/>`;
    let main = quadBody(t, P, id);
    main += path('M36 72 C30 56 38 32 60 30 C82 32 90 56 84 72 C76 66 44 66 36 72 Z', '#ffffff', P);
    main += `<circle cx="60" cy="50" r="22" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/>`;
    main += path('M52 56 L68 56 C68 66 62 70 58 72 C60 66 56 62 52 56 Z', '#ffb11a', { line: '#8a4a00' });
    main += `<path d="M48 28 L52 18 L58 28 L64 16 L70 28" fill="${P.accent}" stroke="${P.line}" stroke-width="2.2" stroke-linejoin="round"/>` + gloss(48, 40, 5, 7, -30, 0.45);
    return { back, main, A: { eyes: { x: 60, y: 47, gap: 9, r: 5, noMouth: true }, top: [60, 26], back: [60, 70, 1], tail: [104, 72, 1], chest: [60, 88], horns: [60, 30, 0.8], defaultWings: 'feathered', motion: 'walk' } };
  };

  B.fairy = (t, P, id) => {
    let main = '';
    main += path('M46 100 C48 80 52 72 60 72 C68 72 72 80 74 100 Z', `url(#body-${id})`, P) + line('M50 92 Q60 96 70 92', P.hi, 1.6, 0.6);
    main += ell(46, 80, 4, 8, P.belly, P, 'transform="rotate(25 46 80)"') + ell(74, 80, 4, 8, P.belly, P, 'transform="rotate(-25 74 80)"');
    main += `<circle cx="60" cy="52" r="23" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/><circle cx="60" cy="52" r="23" fill="url(#shine-${id})"/>`;
    main += path('M40 44 C42 26 78 26 80 44 C74 36 66 38 60 34 C54 38 46 36 40 44 Z', P.accent, P) + line('M52 64 L68 64', 'none', 1, 0);
    main += gloss(48, 42, 4.5, 7, -30, 0.5) + `<path d="M52 30 C46 20 40 16 36 18 M68 30 C74 20 80 16 84 18" stroke="${P.line}" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="36" cy="18" r="3" fill="${P.accent}" stroke="${P.line}" stroke-width="1.6"/><circle cx="84" cy="18" r="3" fill="${P.accent}" stroke="${P.line}" stroke-width="1.6"/>`;
    return { main, A: { eyes: { x: 60, y: 54, gap: 9.5, r: 5.6 }, top: [60, 28], back: [60, 66, 1.05], tail: null, chest: [60, 86], horns: [60, 32, 0.7], defaultWings: 'fairy', flies: true, motion: 'fly' } };
  };

  B.angel = (t, P, id) => {
    const a = B.fairy(t, P, id);
    a.A.defaultWings = 'angelic';
    a.main = a.main.replace(/<path d="M52 30 C46 20[^>]*\/><circle[^>]*\/><circle[^>]*\/>/, '');
    return a;
  };

  B.hydra = (t, P, id) => {
    const neck = (x, lean) => `<path d="M${60 + lean * 6} 84 C${60 + lean * 10} 70 ${x} 62 ${x} 48" fill="none" stroke="${P.line}" stroke-width="16" stroke-linecap="round"/><path d="M${60 + lean * 6} 84 C${60 + lean * 10} 70 ${x} 62 ${x} 48" fill="none" stroke="${P.light}" stroke-width="10" stroke-linecap="round"/>`;
    const head = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#scales-${id})"/><ellipse cx="${x}" cy="${y + r * 0.5}" rx="${r * 0.55}" ry="${r * 0.32}" fill="${P.belly}" stroke="${P.line}" stroke-width="1.8"/>` + gloss(x - r * 0.4, y - r * 0.4, r * 0.18, r * 0.3, -30, 0.5);
    let back = path('M78 94 C98 100 112 88 106 74 C103 68 97 70 98 76 C100 82 94 90 80 86 Z', `url(#body-${id})`, P);
    let main = ell(46, 104, 8, 5, P.mid, P) + ell(74, 104, 8, 5, P.mid, P) + ell(60, 90, 28, 18, `url(#body-${id})`, P) + `<ellipse cx="60" cy="94" rx="16" ry="10" fill="${P.belly}"/>`;
    const extra = t.svgParams.double_head;
    main += neck(30, -1) + neck(90, 1) + head(30, 46, 13) + head(90, 46, 13);
    main += neck(60, 0) + head(60, 40, 18);
    let side = eyes('angry', { x: 30, y: 44, gap: 4.5, r: 2.8, noMouth: true }, P, id, {}) + eyes('angry', { x: 90, y: 44, gap: 4.5, r: 2.8, noMouth: true }, P, id, {});
    main += side;
    return { back, main, A: { eyes: { x: 60, y: 38, gap: 7, r: 4.4, mouthDrop: 2.4 }, top: [60, 22], back: [60, 82, 0.9], tail: [106, 74, 1], chest: [60, 92], horns: [60, 24, 0.8], motion: 'walk', extraHeads: !!extra } };
  };

  B.dragon = (t, P, id) => {
    const p = t.svgParams;
    let back = path('M78 92 C97 98 112 86 107 71 C104 63 96 64 96 71 C100 76 99 86 82 82 Z', `url(#body-${id})`, P);
    let main = '';
    main += ell(60, 86, 26, 21, `url(#body-${id})`, P) + `<ellipse cx="60" cy="86" rx="26" ry="21" fill="url(#scales-${id})"/>`;
    main += `<ellipse cx="60" cy="91" rx="15" ry="13" fill="${P.belly}"/>` + line('M47 85 Q60 88 73 85 M48 91 Q60 94 72 91 M50 97 Q60 100 70 97', shade(P.belly, -0.35), 1.6, 0.7);
    main += ell(46, 105, 8, 5, P.mid, P) + ell(74, 105, 8, 5, P.mid, P) + line('M42 107 l0 -3 M46 108 l0 -3 M50 107 l0 -3 M70 107 l0 -3 M74 108 l0 -3 M78 107 l0 -3', '#ffffff', 1.4, 0.8);
    main += ell(38, 84, 5, 8, `url(#body-${id})`, P, 'transform="rotate(25 38 84)"') + ell(82, 84, 5, 8, `url(#body-${id})`, P, 'transform="rotate(-25 82 84)"');
    if (p.sea_fins) main += path('M37 44 L20 34 L32 56 Z', P.belly, P) + path('M83 44 L100 34 L88 56 Z', P.belly, P);
    main += `<circle cx="60" cy="50" r="25" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/><circle cx="60" cy="50" r="25" fill="url(#scales-${id})"/>`;
    main += `<path d="M50 27 L54 18 L58 26 L62 17 L66 26 L70 19" fill="${P.belly}" stroke="${P.line}" stroke-width="2.2" stroke-linejoin="round"/>`;
    main += ell(60, 63, 15, 9.5, P.belly, P) + `<ellipse cx="55" cy="61.5" rx="1.9" ry="1.4" fill="${P.line}"/><ellipse cx="65" cy="61.5" rx="1.9" ry="1.4" fill="${P.line}"/>`;
    main += gloss(47, 38, 5, 8, -30, 0.55);
    return { back, main, A: { eyes: { x: 60, y: 47, gap: 10, r: 5.5, noMouth: true }, top: [60, 22], back: [60, 70, 1], tail: [107, 71, 1], chest: [60, 90], horns: p.sea_fins ? null : [60, 32, 1], defaultWings: 'dragon', motion: 'walk' } };
  };

  B.gargoyle = (t, P, id) => {
    const d = B.dragon(t, P, id);
    d.A.defaultWings = 'stone';
    d.main += `<path d="M44 66 L48 72 L52 66 M68 66 L72 72 L76 66" fill="#ffffff" stroke="${P.line}" stroke-width="1.4"/>` + line('M44 82 L50 90 M70 80 L76 86', P.detail, 1.6, 0.6);
    return d;
  };

  B.bird = (t, P, id) => {
    const p = t.svgParams;
    const fire = p.wings === 'fire_feathers';
    const f1 = fire ? '#ffcf3d' : P.belly, f2 = fire ? '#ff6a1a' : P.mid;
    let back = '';
    for (const [a, len] of [[-30, 34], [0, 40], [30, 34]]) back += `<path d="M60 92 C51 ${92 + len * 0.5} 56 ${92 + len} 60 ${92 + len} C64 ${92 + len} 69 ${92 + len * 0.5} 60 92 Z" transform="rotate(${a + 180} 60 92)" fill="${f2}" stroke="${P.line}" stroke-width="2.4" stroke-linejoin="round"/>`;
    for (const [x, a, len] of [[50, -24, 20], [60, 0, 25], [70, 24, 20]]) back += `<path d="M${x} 40 C${x - 6} ${40 - len * 0.5} ${x - 2} ${40 - len} ${x} ${40 - len} C${x + 2} ${40 - len} ${x + 6} ${40 - len * 0.5} ${x} 40 Z" transform="rotate(${a} ${x} 40)" fill="${f1}" stroke="${P.line}" stroke-width="2.4" stroke-linejoin="round"/>`;
    let main = `<circle cx="60" cy="68" r="31" fill="url(#body-${id})" stroke="${P.line}" stroke-width="3.2"/><circle cx="60" cy="68" r="31" fill="url(#feathers-${id})"/>`;
    main += `<ellipse cx="60" cy="83" rx="19" ry="14" fill="${P.belly}"/>` + line('M48 80 q4 4 8 0 q4 4 8 0 q4 4 8 0 M50 88 q4 4 8 0 q4 4 8 0', shade(P.belly, -0.3), 1.4, 0.6);
    main += gloss(46, 52, 6, 10, -30, 0.5);
    main += `<path d="M53 73 L67 73 L60 84 Z" fill="#ffb11a" stroke="#8a4a00" stroke-width="2.2" stroke-linejoin="round"/><path d="M54 73 L66 73 L60 77 Z" fill="#ffd36b"/>`;
    main += `<path d="M46 98 l-3 6 M50 99 l0 7 M54 98 l3 6 M66 98 l-3 6 M70 99 l0 7 M74 98 l3 6" stroke="#8a4a00" stroke-width="2.4" stroke-linecap="round"/>`;
    return { back, main, A: { eyes: { x: 60, y: 63, gap: 11, r: 6, noMouth: true }, top: [60, 20], back: [60, 72, 1], tail: null, chest: [60, 84], horns: [60, 40, 0.8], defaultWings: fire ? 'fire_feathers' : 'feathered', flies: true, motion: 'fly' } };
  };

  B.eagle = (t, P, id) => {
    let back = '';
    for (const a of [-20, 0, 20]) back += `<path d="M60 92 L52 118 L60 112 L68 118 Z" transform="rotate(${a} 60 92)" fill="${P.deep}" stroke="${P.line}" stroke-width="2.2" stroke-linejoin="round"/>`;
    let main = path('M36 70 C34 50 46 40 60 40 C74 40 86 50 84 70 C84 92 72 102 60 102 C48 102 36 92 36 70 Z', `url(#body-${id})`, P) + `<path d="M36 70 C34 50 46 40 60 40 C74 40 86 50 84 70 C84 92 72 102 60 102 C48 102 36 92 36 70 Z" fill="url(#feathers-${id})"/>`;
    main += `<circle cx="60" cy="44" r="22" fill="#ffffff" stroke="${P.line}" stroke-width="${SW}"/>` + line('M44 56 q4 3 8 0 q4 3 8 0 q4 3 8 0 q4 3 8 0', '#cfd6e0', 1.6, 0.9);
    main += path('M51 49 Q60 43 69 49 Q70 58 61 66 Q61 60 57 58 Q52 55 51 49 Z', '#ffc21a', { line: '#8a5a00' }) + `<path d="M55 48 Q60 45.5 65 48" stroke="#fff2b0" stroke-width="1.6" fill="none" opacity="0.8"/><circle cx="56.5" cy="50" r="1" fill="#8a5a00"/><circle cx="63.5" cy="50" r="1" fill="#8a5a00"/>`;
    main += `<path d="M48 102 l-3 6 M52 103 l0 6 M68 103 l0 6 M72 102 l3 6" stroke="#ffb11a" stroke-width="3" stroke-linecap="round"/>`;
    main += gloss(50, 34, 4, 7, -30, 0.6);
    return { back, main, A: { eyes: { x: 60, y: 42, gap: 9, r: 4.6, noMouth: true }, top: [60, 22], back: [60, 64, 1.1], tail: null, chest: [60, 80], horns: [60, 26, 0.8], defaultWings: 'feathered', flies: true, motion: 'fly' } };
  };

  B.pterodactyl = (t, P, id) => {
    let back = path('M62 34 C70 20 84 12 100 12 C88 20 78 30 70 40 Z', P.accent, P);
    let main = ell(60, 82, 16, 19, `url(#body-${id})`, P) + `<ellipse cx="60" cy="86" rx="9" ry="12" fill="${P.belly}"/>`;
    main += `<circle cx="60" cy="48" r="17" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/>` + gloss(53, 40, 4, 6, -30, 0.5);
    main += path('M53 54 Q60 50 67 54 L61 82 Q60 84 59 82 Z', '#ffd36b', { line: shade('#ffd36b', -0.55) }) + line('M60 56 L60 80', shade('#ffd36b', -0.4), 1.2, 0.7);
    main += `<path d="M52 100 l-3 6 M56 101 l0 6 M64 101 l0 6 M68 100 l3 6" stroke="${P.line}" stroke-width="2.4" stroke-linecap="round"/>`;
    return { back, main, A: { eyes: { x: 60, y: 45, gap: 7.5, r: 4.4, noMouth: true }, top: [60, 31], back: [60, 66, 1.15], tail: null, chest: [60, 92], horns: null, defaultWings: 'membrane', flies: true, motion: 'fly' } };
  };

  B.ray = (t, P, id) => {
    const d = 'M60 34 C76 36 96 52 112 66 C96 70 80 70 72 82 C68 90 64 96 60 96 C56 96 52 90 48 82 C40 70 24 70 8 66 C24 52 44 36 60 34 Z';
    let main = path(d, `url(#body-${id})`, P) + `<path d="${d}" fill="url(#shine-${id})" stroke="none"/>`;
    main += `<path d="M60 44 C72 46 86 56 98 64 C86 64 76 66 70 74 C66 80 62 84 60 84 C58 84 54 80 50 74 C44 66 34 64 22 64 C34 56 48 46 60 44 Z" fill="${P.belly}" opacity="0.45"/>`;
    main += line('M30 60 Q40 56 48 60 M90 60 Q80 56 72 60 M26 64 Q36 61 46 64 M94 64 Q84 61 74 64', P.hi, 1.6, 0.6);
    main += gloss(46, 48, 6, 4, -15, 0.5);
    return { main, A: { eyes: { x: 60, y: 58, gap: 9, r: 5 }, top: [60, 34], back: [60, 64, 0.9], tail: [60, 94, 0], chest: [60, 82], horns: [60, 40, 0.7], flies: true, motion: 'swim' } };
  };

  B.jellyfish = (t, P, id) => {
    let back = '';
    for (let i = 0; i < 6; i++) {
      const x = 38 + i * 9, w = (i % 2 ? 4 : -4);
      back += `<path d="M${x} 74 C${x + w} 84 ${x - w} 94 ${x + w} 104 C${x - w} 110 ${x} 114 ${x + w * 0.5} 116" fill="none" stroke="${P.line}" stroke-width="7" stroke-linecap="round"/><path d="M${x} 74 C${x + w} 84 ${x - w} 94 ${x + w} 104 C${x - w} 110 ${x} 114 ${x + w * 0.5} 116" fill="none" stroke="${P.rim}" stroke-width="3.4" stroke-linecap="round"/>`;
    }
    const dome = 'M26 72 C24 40 44 26 60 26 C76 26 96 40 94 72 Z';
    let main = path(dome, `url(#body-${id})`, P) + `<path d="${dome}" fill="url(#shine-${id})" stroke="none"/>`;
    let frill = 'M22 72';
    for (let i = 0; i < 8; i++) frill += ` Q${26 + i * 9.5} 84 ${31 + i * 9.5} 72`;
    main += path(frill + ' Z', P.belly, P);
    main += line('M40 40 Q36 54 38 68 M60 30 L60 66 M80 40 Q84 54 82 68', P.hi, 1.6, 0.5) + gloss(44, 40, 7, 10, -30, 0.55);
    main += `<circle cx="70" cy="38" r="2.6" fill="#ffffff" opacity="0.8"/>`;
    return { back, main, A: { eyes: { x: 60, y: 54, gap: 10, r: 5.4 }, top: [60, 26], back: [60, 50, 0.9], tail: null, chest: [60, 46], horns: [60, 30, 0.7], flies: true, motion: 'float' } };
  };

  B.dragonfly = (t, P, id) => {
    let main = '';
    for (let i = 0; i < 5; i++) main += ell(60, 70 + i * 8, 7 - i * 0.6, 5, i % 2 ? `url(#body-${id})` : P.mid, P);
    main += ell(60, 62, 11, 9, `url(#body-${id})`, P);
    main += `<circle cx="60" cy="44" r="16" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/>`;
    main += `<path d="M54 30 C50 22 46 18 42 18 M66 30 C70 22 74 18 78 18" stroke="${P.line}" stroke-width="2" fill="none" stroke-linecap="round"/>` + gloss(54, 36, 3.5, 6, -30, 0.5);
    return { main, A: { eyes: { x: 60, y: 44, gap: 8, r: 6.2, noMouth: true }, top: [60, 28], back: [60, 60, 1], tail: null, chest: [60, 64], horns: [60, 30, 0.6], defaultWings: 'dragonfly_wings', flies: true, motion: 'fly' } };
  };

  B.shark = (t, P, id) => {
    const d = 'M24 72 C22 48 40 32 60 32 C80 32 98 48 96 72 C94 94 80 106 60 106 C40 106 26 94 24 72 Z';
    let back = path('M88 80 C100 70 110 58 114 46 C116 62 112 78 104 90 C110 96 114 102 112 108 C104 100 96 94 88 92 Z', P.mid, P);
    back += path('M48 38 L58 10 L72 38 Z', P.mid, P) + line('M56 34 L60 18', P.hi, 1.6, 0.5);
    let main = path(d, `url(#body-${id})`, P) + `<path d="${d}" fill="url(#shine-${id})" stroke="none"/>`;
    main += `<path d="M28 80 C32 98 46 104 60 104 C74 104 88 98 92 80 C82 88 38 88 28 80 Z" fill="${P.belly}"/>`;
    main += path('M28 82 L10 98 L34 92 Z', P.mid, P) + path('M92 82 L110 98 L86 92 Z', P.mid, P);
    main += line('M32 58 l-3 8 M36 60 l-3 8 M88 58 l3 8 M84 60 l3 8', P.line, 1.6, 0.55);
    let teeth = '';
    for (let x = 45; x < 74; x += 5) teeth += `<path d="M${x} 77 L${x + 2.5} 82 L${x + 5} 77 Z" fill="#ffffff"/>`;
    main += `<path d="M43 76 Q60 94 77 76 Q60 81 43 76 Z" fill="#4a0d24" stroke="${P.line}" stroke-width="2" stroke-linejoin="round"/>` + teeth + `<path d="M52 84 Q60 89 68 84" stroke="#ff7aa2" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>`;
    main += gloss(42, 46, 7, 4.5, -20, 0.5);
    return { back, main, A: { eyes: { x: 60, y: 58, gap: 13, r: 5.6, noMouth: true }, top: [60, 32], back: [60, 62, 0.9], tail: null, chest: [60, 96], horns: [60, 36, 0.7], flies: true, motion: 'swim' } };
  };

  B.cobra = (t, P, id) => {
    // A cute coiled snake: a stack of three coils, a short neck, a round chibi head with small hood
    // frills either side, a curled tail and a forked tongue.
    const ring = (cy, rx, ry) => ell(60, cy, rx, ry, `url(#body-${id})`, P) + `<ellipse cx="60" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#scales-${id})"/>` + `<path d="M${60 - rx * 0.8} ${cy + ry * 0.35} Q60 ${cy + ry * 1.05} ${60 + rx * 0.8} ${cy + ry * 0.35}" fill="none" stroke="${P.belly}" stroke-width="${ry * 0.55}" stroke-linecap="round" opacity="0.85"/>` + `<path d="M${60 - rx * 0.55} ${cy - ry * 0.55} Q60 ${cy - ry * 0.95} ${60 + rx * 0.55} ${cy - ry * 0.55}" fill="none" stroke="${P.hi}" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>`;
    let back = path('M88 104 C100 106 108 100 106 92 C104 88 99 89 100 93 C101 97 96 99 90 98 Z', P.mid, P);
    let main = ring(101, 34, 8.5) + ring(91, 27, 8) + ring(82, 20, 7.2);
    main += path('M52 82 C51 72 54 66 60 64 C66 66 69 72 68 82 Z', `url(#body-${id})`, P) + `<path d="M56 81 C55.5 74 57 70 60 68.5 C63 70 64.5 74 64 81 Z" fill="${P.belly}" opacity="0.85"/>`;
    // Hood frills behind the head.
    const frill = 'M42 40 C28 34 20 52 30 64 C34 58 40 54 46 52 Z';
    main += path(frill, P.mid, P) + `<path d="M38 44 C30 44 27 54 31 60" fill="none" stroke="${P.accent}" stroke-width="2.4" stroke-linecap="round" opacity="0.85"/>`;
    main += mirror(path(frill, P.mid, P) + `<path d="M38 44 C30 44 27 54 31 60" fill="none" stroke="${P.accent}" stroke-width="2.4" stroke-linecap="round" opacity="0.85"/>`);
    main += `<circle cx="60" cy="44" r="22" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/><circle cx="60" cy="44" r="22" fill="url(#scales-${id})"/>`;
    main += `<path d="M54 26 Q60 22 66 26 L63 32 Q60 30 57 32 Z" fill="${P.accent}" opacity="0.8"/>` + gloss(50, 34, 4.5, 7, -30, 0.55);
    main += `<ellipse cx="60" cy="54" rx="11" ry="6.5" fill="${P.belly}" opacity="0.7"/>`;
    main += `<path d="M60 58 L60 66 M60 66 L57 70 M60 66 L63 70" stroke="#ff2a4a" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    return { back, main, A: { eyes: { x: 60, y: 43, gap: 9, r: 5.4, mouthDrop: 1.6 }, top: [60, 22], back: [60, 66, 0.9], tail: null, chest: [60, 90], horns: [60, 26, 0.7], motion: 'walk' } };
  };

  B.glider = (t, P, id) => {
    const cape = 'M60 56 C42 56 22 66 12 86 C24 84 32 90 36 98 C44 92 52 92 60 96 C68 92 76 92 84 98 C88 90 96 84 108 86 C98 66 78 56 60 56 Z';
    let main = path(cape, P.mid, P) + line('M36 98 L48 66 M84 98 L72 66', P.line, 1.4, 0.5);
    main += ell(60, 80, 15, 16, `url(#body-${id})`, P) + `<ellipse cx="60" cy="84" rx="9" ry="10" fill="${P.belly}"/>`;
    main += quadHead(P, id, { cy: 48, r: 21, ears: 'round' });
    return { main, A: { eyes: { x: 60, y: 46, gap: 9, r: 6, mouthDrop: 2.4 }, top: [60, 26], back: [60, 70, 0.8], tail: [74, 98, 1], chest: [60, 84], horns: [60, 28, 0.7], flies: true, motion: 'fly' } };
  };

  B.golem = (t, P, id) => {
    const p = t.svgParams;
    const rk = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#rock-${id})"/>`;
    let main = rk(40, 92, 15, 15, 5) + rk(65, 92, 15, 15, 5);
    main += rk(11, 56, 21, 36, 9) + rk(88, 56, 21, 36, 9);
    main += `<rect x="9" y="84" width="25" height="14" rx="6" fill="${P.deep}" stroke="${P.line}" stroke-width="${SW}"/><rect x="86" y="84" width="25" height="14" rx="6" fill="${P.deep}" stroke="${P.line}" stroke-width="${SW}"/>`;
    main += line('M15 91 L30 91 M90 91 L105 91', P.line, 1.4, 0.6);
    main += rk(28, 50, 64, 50, 15);
    main += `<path d="M34 60 L48 56 L52 68 L40 74 Z" fill="${P.hi}" opacity="0.25"/><path d="M74 82 L88 78 L86 94 L72 94 Z" fill="${P.deep}" opacity="0.35"/><path d="M36 86 L46 84 L44 96 L36 94 Z" fill="${P.deep}" opacity="0.3"/>`;
    main += line('M62 54 L58 64 L64 70 L60 80 M80 60 L74 66', P.line, 1.8, 0.6);
    main += `<circle cx="20" cy="54" r="10" fill="${P.deep}" stroke="${P.line}" stroke-width="${SW}"/><circle cx="100" cy="54" r="10" fill="${P.deep}" stroke="${P.line}" stroke-width="${SW}"/>` + gloss(17, 50, 3, 4, -30, 0.35) + gloss(97, 50, 3, 4, -30, 0.35);
    main += `<path d="M38 64 C40 56 46 54 50 56" fill="none" stroke="#6fcf4f" stroke-width="4" stroke-linecap="round" opacity="0.85"/><circle cx="50" cy="56" r="2.2" fill="#9be36d"/>`;
    // Glowing runes across the chest.
    main += `<path d="M44 78 l4 -6 l4 6 M70 70 l6 0 l-3 6 Z" fill="none" stroke="${P.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>`;
    main += rk(36, 18, 48, 38, 13);
    main += `<path d="M40 24 L52 20 L54 30 L42 34 Z" fill="${P.hi}" opacity="0.25"/>` + line('M70 22 L66 30 L72 34', P.line, 1.6, 0.55) + gloss(46, 28, 4, 6, -30, 0.35);
    return { main, A: { eyes: { x: 60, y: 37, gap: 10, r: 5.2, mouthDrop: 1.7 }, top: [60, 18], back: [60, 70, 1.1], tail: null, chest: [60, 76], horns: [60, 22, 0.9], motion: 'walk' } };
  };

  B.spider = (t, P, id) => {
    let back = '';
    for (const [a, s] of [[-50, 1], [-25, 1], [10, 1], [35, 1]]) {
      const leg = `<path d="M50 80 C38 70 26 60 14 ${70 + a * 0.2} L8 ${96 + a * 0.15}" fill="none" stroke="${P.line}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${a * 0.25} 50 80)"/><path d="M50 80 C38 70 26 60 14 ${70 + a * 0.2} L8 ${96 + a * 0.15}" fill="none" stroke="${P.mid}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${a * 0.25} 50 80)"/>`;
      back += leg + mirror(leg);
    }
    let main = ell(60, 88, 28, 20, `url(#body-${id})`, P) + `<path d="M60 72 L52 86 L60 100 L68 86 Z" fill="${P.accent}" opacity="0.8"/>`;
    main += `<circle cx="60" cy="58" r="20" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/>` + gloss(50, 50, 4, 6, -30, 0.5);
    main += `<circle cx="52" cy="48" r="2.4" fill="#160f22"/><circle cx="68" cy="48" r="2.4" fill="#160f22"/><circle cx="56" cy="44" r="1.8" fill="#160f22"/><circle cx="64" cy="44" r="1.8" fill="#160f22"/>`;
    main += `<path d="M54 72 C52 78 54 80 56 80 M66 72 C68 78 66 80 64 80" fill="none" stroke="${P.line}" stroke-width="2.6" stroke-linecap="round"/>`;
    return { back, main, A: { eyes: { x: 60, y: 58, gap: 8, r: 4.8, noMouth: true }, top: [60, 38], back: [60, 78, 0.9], tail: null, chest: [60, 88], horns: [60, 42, 0.7], motion: 'walk' } };
  };

  B.insect = (t, P, id) => {
    let back = '';
    for (const y of [74, 86, 98]) { const leg = `<path d="M44 ${y} L26 ${y - 6} L18 ${y + 6}" fill="none" stroke="${P.line}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`; back += leg + mirror(leg); }
    let main = path('M34 84 C34 62 46 56 60 56 C74 56 86 62 86 84 C86 102 74 108 60 108 C46 108 34 102 34 84 Z', `url(#body-${id})`, P);
    main += line('M60 58 L60 106', P.line, 2, 0.8) + `<path d="M40 70 C44 62 54 60 58 62 M80 70 C76 62 66 60 62 62" fill="none" stroke="${P.hi}" stroke-width="2.4" opacity="0.6"/>`;
    main += gloss(46, 72, 4, 8, -20, 0.45) + gloss(70, 72, 4, 8, 20, 0.35);
    main += `<circle cx="60" cy="48" r="16" fill="url(#body-${id})" stroke="${P.line}" stroke-width="${SW}"/>`;
    main += `<path d="M54 34 C50 24 44 18 38 16 M66 34 C70 24 76 18 82 16" stroke="${P.line}" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="38" cy="16" r="2.6" fill="${P.accent}"/><circle cx="82" cy="16" r="2.6" fill="${P.accent}"/>`;
    return { back, main, A: { eyes: { x: 60, y: 48, gap: 7, r: 4.6, noMouth: true }, top: [60, 32], back: [60, 74, 0.9], tail: null, chest: [60, 86], horns: [60, 34, 0.8], motion: 'walk' } };
  };

  B.tree = (t, P, id) => {
    const bark = mix(P.dark, '#6b4423', 0.6), barkL = shade(bark, 0.25);
    let main = path('M42 108 C40 100 34 98 30 100 C36 92 40 86 42 76 L78 76 C80 86 84 92 90 100 C86 98 80 100 78 108 Z', bark, P);
    main += path('M40 104 C40 80 42 62 46 50 L74 50 C78 62 80 80 80 104 Z', `url(#bark-${id})`, P);
    main += line('M50 56 C48 70 50 86 48 100 M60 54 C62 70 58 86 60 102 M70 56 C72 70 70 88 72 100', shade(bark, -0.4), 1.6, 0.6);
    main += path('M42 72 C30 66 22 60 18 50 M78 72 C90 66 98 60 102 50', 'none', { line: shade(bark, -0.5) });
    main += `<path d="M42 72 C30 66 22 60 18 50 M78 72 C90 66 98 60 102 50" fill="none" stroke="${barkL}" stroke-width="5" stroke-linecap="round"/>`;
    const leaf = mix(P.light, '#4ebc5b', 0.4);
    for (const [x, y, r] of [[60, 30, 22], [38, 38, 15], [82, 38, 15], [48, 20, 13], [72, 20, 13], [20, 48, 7], [100, 48, 7]]) main += `<circle cx="${x}" cy="${y}" r="${r}" fill="${leaf}" stroke="${shade(leaf, -0.6)}" stroke-width="2.6"/>`;
    for (const [x, y] of [[52, 24], [70, 30], [40, 36], [80, 40], [60, 14]]) main += `<circle cx="${x}" cy="${y}" r="4" fill="${shade(leaf, 0.35)}" opacity="0.7"/>`;
    return { main, A: { eyes: { x: 60, y: 66, gap: 8, r: 4.6, mouthDrop: 1.8 }, top: [60, 8], back: [60, 66, 0.9], tail: null, chest: [60, 88], horns: [60, 12, 0.8], motion: 'walk' } };
  };

  // ---------------------------------------------------------------- features
  function wings(kind, A, P, id) {
    const [x, y, s] = A.back;
    const S = (inner) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-60 -70)">${inner}</g>`;
    const both = (w) => S(w + mirror(w));
    const col = { shadow: ['#2a0f3d', '#7b2cbf'], starry: ['#1b2a6b', '#6aa9ff'], golden: ['#ffcf3d', '#fff2b0'], feathered: [P.mid, P.belly], angelic: ['#ffffff', '#e8f4ff'], leafy: ['#4ebc5b', '#b8f08a'], cloudy: ['#ffffff', '#dfe9ff'], windy: ['#b8f5e0', '#ffffff'], fire_feathers: ['#ff6a1a', '#ffcf3d'], dragon: [shade(P.dark, -0.1), P.mid], stone: [P.deep, P.mid], membrane: [P.mid, P.belly], fairy: [mix(P.accent, '#ffffff', 0.5), '#ffffff'], dragonfly_wings: ['#d9f6ff', '#ffffff'] }[kind] || [P.mid, P.belly];
    const ln = shade(col[0], -0.6);
    if (kind === 'feathered' || kind === 'angelic' || kind === 'fire_feathers') {
      let w = '';
      const n = kind === 'angelic' ? 5 : 4;
      for (let i = 0; i < n; i++) {
        const a = -70 + i * 22, len = (kind === 'angelic' ? 44 : 36) - i * 3;
        w += `<path d="M44 66 C${44 - 10} ${66 - len * 0.4} ${44 - 6} ${66 - len} ${44 - 2} ${66 - len} C${44 + 4} ${66 - len} ${44 + 6} ${66 - len * 0.4} 46 66 Z" transform="rotate(${a} 44 66)" fill="${i % 2 ? col[1] : col[0]}" stroke="${ln}" stroke-width="2.4" stroke-linejoin="round"/>`;
      }
      if (kind === 'fire_feathers') w += `<path d="M14 40 C10 34 14 28 18 32 M10 56 C6 50 10 44 14 48" stroke="#ffe066" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      return both(w);
    }
    if (kind === 'fairy' || kind === 'dragonfly_wings') {
      const op = kind === 'dragonfly_wings' ? 0.55 : 0.7;
      let w = `<path d="M46 62 C28 34 6 36 8 52 C10 64 30 66 46 64 Z" fill="${col[0]}" opacity="${op}" stroke="${ln}" stroke-width="2.2"/>` + `<path d="M46 68 C30 74 14 88 22 96 C30 102 42 86 48 72 Z" fill="${col[1]}" opacity="${op}" stroke="${ln}" stroke-width="2.2"/>`;
      w += line('M44 62 C30 50 20 46 12 50 M46 70 C36 80 28 88 24 94', ln, 1.2, 0.5) + `<circle cx="20" cy="50" r="3" fill="#ffffff" opacity="0.8"/>`;
      return both(w);
    }
    if (kind === 'leafy') {
      let w = '';
      for (const [a, l] of [[-60, 34], [-35, 30], [-10, 24]]) w += `<path d="M46 66 C30 ${66 - l * 0.6} 22 ${66 - l} 10 ${66 - l * 0.8} C20 ${66 - l * 0.2} 32 ${66} 46 66 Z" transform="rotate(${a + 40} 46 66)" fill="${col[0]}" stroke="${ln}" stroke-width="2.2" stroke-linejoin="round"/>`;
      return both(w + line('M46 66 L16 40', ln, 1.2, 0.5));
    }
    if (kind === 'cloudy' || kind === 'windy') {
      const w = `<path d="M46 66 C40 50 24 46 16 54 C6 54 4 68 14 70 C10 80 24 84 30 76 C36 82 46 78 46 66 Z" fill="${col[0]}" stroke="${ln}" stroke-width="2.4"/>` + line('M18 62 C24 58 30 60 32 64', ln, 1.4, 0.5);
      return both(w);
    }
    // Bat-like: shadow, starry, golden, dragon, stone, membrane.
    let w = `<path d="M44 66 C30 44 12 42 4 52 C12 53 16 58 13 66 C22 62 28 67 26 76 C32 71 37 73 40 80 Z" fill="url(#wing-${id}-${kind})" stroke="${ln}" stroke-width="2.6" stroke-linejoin="round"/>`;
    w += line('M42 66 L8 54 M42 70 L16 66 M42 74 L28 74', ln, 1.5, 0.6);
    if (kind === 'starry') w += star(22, 58, 2.5, '#ffffff') + star(14, 54, 1.8, '#ffffff') + star(30, 66, 1.6, '#ffffff');
    if (kind === 'golden') w += line('M38 64 L20 54', '#ffffff', 1.6, 0.7);
    return both(w) + `<defs><linearGradient id="wing-${id}-${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${col[1]}"/><stop offset="1" stop-color="${col[0]}"/></linearGradient></defs>`;
  }

  function tail(kind, A, P, id) {
    if (!A.tail) return '';
    const [x, y] = A.tail;
    const at = (s) => `<g transform="translate(${x} ${y})">${s}</g>`;
    switch (kind) {
      case 'flaming': return at(`<path d="M0 0 C6 -10 4 -22 -2 -28 C10 -24 16 -12 12 0 C10 6 2 6 0 0 Z" fill="#ff7a1a" stroke="#8a2a00" stroke-width="2.2"/><path d="M2 -2 C6 -8 6 -14 2 -18 C8 -14 10 -6 6 -1 Z" fill="#ffd43b"/>`);
      case 'triple_flame': return at(['-18', '0', '18'].map((a) => `<path d="M0 0 C6 -10 4 -22 -2 -28 C10 -24 16 -12 12 0 C10 6 2 6 0 0 Z" transform="rotate(${a})" fill="#ff7a1a" stroke="#8a2a00" stroke-width="2"/>`).join('') + `<circle cx="4" cy="-4" r="4" fill="#ffd43b"/>`);
      case 'fin': case 'shark_fin': return at(`<path d="M0 0 L14 -14 L10 2 L16 14 Z" fill="${P.belly}" stroke="${P.line}" stroke-width="2.4" stroke-linejoin="round"/>`);
      case 'serpent': return at(`<path d="M0 0 L12 -10 L8 4 Z" fill="${P.belly}" stroke="${P.line}" stroke-width="2.2" stroke-linejoin="round"/>`);
      case 'wave': return at(`<path d="M-2 0 C6 -6 14 -2 16 -10 C18 -2 12 6 4 6 Z" fill="${mix(P.accent, '#ffffff', 0.3)}" stroke="${P.line}" stroke-width="2" stroke-linejoin="round"/>`);
      case 'leaf': return at(`<path d="M0 0 C6 -14 18 -16 22 -12 C18 -4 10 4 0 0 Z" fill="#6fcf4f" stroke="#245c1a" stroke-width="2"/><path d="M0 0 L18 -11" stroke="#245c1a" stroke-width="1.2"/>`);
      case 'club': return at(`<circle cx="6" cy="-4" r="8" fill="${P.deep}" stroke="${P.line}" stroke-width="2.4"/><path d="M0 -10 l2 -6 l3 6 M10 -10 l3 -5 l2 6 M12 0 l6 1 l-5 3" fill="${P.belly}" stroke="${P.line}" stroke-width="1.6"/>`);
      case 'long_feathers': return at(`<path d="M0 0 C10 6 20 14 22 26 C14 20 6 14 0 0 Z M0 0 C12 0 24 4 30 14 C20 12 10 8 0 0 Z" fill="${P.accent}" stroke="${P.line}" stroke-width="2"/>`);
      case 'whip': return at(`<path d="M0 0 C-4 10 4 18 -2 26" fill="none" stroke="${P.line}" stroke-width="4" stroke-linecap="round"/><path d="M0 0 C-4 10 4 18 -2 26" fill="none" stroke="${P.mid}" stroke-width="1.8" stroke-linecap="round"/><path d="M-5 26 L-2 32 L1 26 Z" fill="${P.accent}"/>`);
      default: return '';
    }
  }

  function crown(kind, A, P) {
    if (!A.top) return '';
    const [x, y] = A.top;
    if (kind === 'spiky') return `<path d="M${x - 19} ${y + 4} L${x - 15} ${y - 9} L${x - 8} ${y + 1} L${x} ${y - 13} L${x + 8} ${y + 1} L${x + 15} ${y - 9} L${x + 19} ${y + 4} Z" fill="#ffd43b" stroke="#8a5a00" stroke-width="2.4" stroke-linejoin="round"/><circle cx="${x}" cy="${y - 2}" r="2.4" fill="#ff3b6b"/>`;
    return `<path d="M${x - 16} ${y + 4} L${x - 16} ${y - 6} L${x - 8} ${y} L${x} ${y - 10} L${x + 8} ${y} L${x + 16} ${y - 6} L${x + 16} ${y + 4} Z" fill="url(#gold-x)" stroke="#8a5a00" stroke-width="2.2" stroke-linejoin="round"/><circle cx="${x}" cy="${y - 1}" r="2.6" fill="#3fd8ff" stroke="#0b4f63" stroke-width="1"/><circle cx="${x - 9}" cy="${y + 1}" r="1.8" fill="#ff3b6b"/><circle cx="${x + 9}" cy="${y + 1}" r="1.8" fill="#ff3b6b"/>`;
  }

  function halo(kind, A) {
    if (!A.top) return '';
    const [x, y] = A.top;
    if (kind === 'triple_gold') return [0, 6, 12].map((d, i) => `<ellipse cx="${x}" cy="${y - 6 - d}" rx="${16 - i * 3}" ry="${4.2 - i * 0.8}" fill="none" stroke="#ffd700" stroke-width="2.6" opacity="${1 - i * 0.15}"/>`).join('');
    if (kind === 'sun') { let s = `<circle cx="${x}" cy="${y + 18}" r="34" fill="none" stroke="#ffd43b" stroke-width="3" opacity="0.85"/>`; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += `<path d="M${f(x + Math.cos(a) * 38)} ${f(y + 18 + Math.sin(a) * 38)} L${f(x + Math.cos(a) * 45)} ${f(y + 18 + Math.sin(a) * 45)}" stroke="#ffd43b" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`; } return s; }
    if (kind === 'leaves') { let s = ''; for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; s += `<ellipse cx="${f(x + Math.cos(a) * 20)}" cy="${f(y + 6 + Math.sin(a) * 9)}" rx="5" ry="2.6" transform="rotate(${f((a * 180) / Math.PI + 90)} ${f(x + Math.cos(a) * 20)} ${f(y + 6 + Math.sin(a) * 9)})" fill="#6fcf4f" stroke="#245c1a" stroke-width="1.2"/>`; } return s; }
    return '';
  }

  function horns(n, A, P) {
    if (!A.horns) return '';
    const [x, y, s] = A.horns;
    const h = `<path d="M${x - 12 * s} ${y + 4 * s} C${x - 15 * s} ${y - 8 * s} ${x - 22 * s} ${y - 14 * s} ${x - 29 * s} ${y - 17 * s} C${x - 25 * s} ${y - 8 * s} ${x - 22 * s} ${y + 2 * s} ${x - 18 * s} ${y + 10 * s} Z" fill="#fff1c1" stroke="#7a5a2a" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x - 16 * s} ${y + 2 * s} l-3 -4 M${x - 19 * s} ${y - 4 * s} l-3 -3" stroke="#c9a66b" stroke-width="1.4"/>`;
    return h + `<g transform="translate(${2 * x} 0) scale(-1 1)">${h}</g>`;
  }

  function uniHorn(kind, A) {
    if (!A.top) return '';
    const [x, y] = A.top;
    const c = kind === 'flame' ? ['#ff7a1a', '#ffd43b', '#8a2a00'] : ['#9ff4ff', '#ffffff', '#1d6f80'];
    return `<path d="M${x - 5} ${y + 6} L${x} ${y - 18} L${x + 5} ${y + 6} Z" fill="${c[0]}" stroke="${c[2]}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${x - 2} ${y} L${x + 3} ${y - 4} M${x - 3} ${y - 6} L${x + 2} ${y - 10}" stroke="${c[1]}" stroke-width="1.6"/>`;
  }

  function extras(t, A, P, id) {
    const p = t.svgParams;
    let back = '', front = '';
    if (p.spikes || p.ice_spikes) { const c = p.ice_spikes ? '#bdf3ff' : P.deep; for (const [x, y, a] of [[34, 70, -60], [30, 84, -80], [86, 70, 60], [90, 84, 80]]) back += `<path d="M${x - 5} ${y + 5} L${x} ${y - 11} L${x + 5} ${y + 5} Z" transform="rotate(${a} ${x} ${y})" fill="${c}" stroke="${P.line}" stroke-width="2.2" stroke-linejoin="round"/>`; }
    if (p.void_core && A.chest) { const [x, y] = A.chest; front += `<circle cx="${x}" cy="${y}" r="9.5" fill="#c35cff" opacity="0.25"/><circle cx="${x}" cy="${y}" r="6.2" fill="url(#core-${id})" stroke="#1a0033" stroke-width="1.8"/><circle cx="${x - 2}" cy="${y - 2}" r="1.6" fill="#ffffff" opacity="0.85"/>`; }
    if (p.crystals && t.svgParams.body !== 'golem') { front += `<path d="M22 92 L27 78 L32 92 Z M88 92 L93 76 L98 92 Z" fill="#7cf7e8" stroke="#0f5c55" stroke-width="2" stroke-linejoin="round"/>`; }
    if (p.crystals && t.svgParams.body === 'golem') front += `<path d="M60 66 L68 78 L60 92 L52 78 Z" fill="#7cf7e8" stroke="#0f5c55" stroke-width="2.4" stroke-linejoin="round"/><path d="M60 66 L60 92" stroke="#ffffff" stroke-width="1.6" opacity="0.8"/><path d="M15 56 L20 42 L26 56 Z M94 56 L100 40 L105 56 Z" fill="#7cf7e8" stroke="#0f5c55" stroke-width="2.2" stroke-linejoin="round"/>`;
    if (p.gills && A.eyes) { const { x, y } = A.eyes; front += line(`M${x - 22} ${y + 2} q-3 4 0 8 M${x - 25} ${y + 4} q-3 4 0 8 M${x + 22} ${y + 2} q3 4 0 8 M${x + 25} ${y + 4} q3 4 0 8`, P.line, 1.6, 0.6); }
    if (p.magma_veins || p.cracks) front += line('M40 80 L48 74 L46 88 L56 92 M74 72 L80 82 L72 90', '#ffb21a', 2.4, 0.95);
    if (p.foliage) front += `<path d="M30 72 C34 64 42 64 44 70 C40 72 34 74 30 72 Z M80 66 C84 58 92 58 94 64 C90 66 84 68 80 66 Z" fill="#6fcf4f" stroke="#245c1a" stroke-width="1.6"/>`;
    if (p.gears) front += `<g transform="translate(92 92)"><circle r="7" fill="#c9a66b" stroke="#5a3a10" stroke-width="2"/><circle r="2.5" fill="#5a3a10"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-1.6" y="-10" width="3.2" height="4" fill="#c9a66b" stroke="#5a3a10" stroke-width="1" transform="rotate(${a})"/>`).join('')}</g>`;
    if (p.insect_horn && A.top) { const [x, y] = A.top; front += `<path d="M${x - 4} ${y + 8} C${x - 6} ${y - 6} ${x} ${y - 14} ${x + 8} ${y - 16} C${x + 2} ${y - 8} ${x + 4} ${y + 2} ${x + 4} ${y + 8} Z" fill="${P.deep}" stroke="${P.line}" stroke-width="2.2"/>`; }
    if (p.feather_crest && A.top) { const [x, y] = A.top; for (const a of [-25, 0, 25]) back += `<path d="M${x} ${y + 6} C${x - 5} ${y - 4} ${x - 2} ${y - 14} ${x} ${y - 16} C${x + 2} ${y - 14} ${x + 5} ${y - 4} ${x} ${y + 6} Z" transform="rotate(${a} ${x} ${y + 6})" fill="${P.accent}" stroke="${P.line}" stroke-width="2"/>`; }
    if (p.fins && A.eyes) { const { x, y } = A.eyes; back += path(`M${x - 24} ${y} L${x - 36} ${y - 8} L${x - 28} ${y + 10} Z`, P.belly, P) + path(`M${x + 24} ${y} L${x + 36} ${y - 8} L${x + 28} ${y + 10} Z`, P.belly, P); }
    if (p.eclipse_ring) back += `<circle cx="60" cy="60" r="44" fill="none" stroke="#1a0a2e" stroke-width="7"/><circle cx="60" cy="60" r="44" fill="none" stroke="#ffd36b" stroke-width="2" opacity="0.9"/>`;
    return { back, front };
  }

  // Sparks, stars, bubbles, steam, swirls and orbiting moons: around the beast, outside its body.
  function surround(t, P) {
    const p = t.svgParams;
    let s = '';
    if (p.sparks) s += star(18, 32, 6.5, P.hi) + star(102, 42, 5, P.hi) + star(100, 96, 4, P.accent) + star(16, 90, 3.6, P.accent);
    if (p.stars) s += star(14, 20, 4.5, '#fff6c8') + star(106, 24, 3.6, '#fff6c8') + star(108, 84, 3, '#fff6c8');
    if (p.bubbles) s += `<circle cx="20" cy="40" r="5.5" fill="none" stroke="${P.hi}" stroke-width="2"/><circle cx="18" cy="38" r="1.5" fill="#fff"/><circle cx="100" cy="56" r="4" fill="none" stroke="${P.hi}" stroke-width="2"/><circle cx="104" cy="34" r="2.6" fill="none" stroke="${P.hi}" stroke-width="1.6"/>`;
    if (p.steam) s += `<path d="M24 36 C18 30 26 24 20 18 M96 34 C102 28 94 22 100 16" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>`;
    if (p.wind_swirls) s += `<path d="M10 50 C18 44 28 48 24 54 C20 58 16 52 20 50 M98 40 C108 36 114 44 108 48" stroke="${P.hi}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.8"/>`;
    if (p.glow) s = `<circle cx="60" cy="66" r="44" fill="${p.glow}" opacity="0.18"/>` + s;
    return s;
  }

  // A ring of moons round the lower body: `half` 'back' draws the far side (behind the beast),
  // 'front' the near side (in front of it, below the face).
  function orbits(t, P, half) {
    const n = Number(t.svgParams.orbits) || 0;
    if (!n) return '';
    const cx = 60, cy = 96, rx = 52, ry = 11;
    let s = `<g transform="rotate(-7 ${cx} ${cy})">`;
    const moons = ['#ffd36b', '#7cf7e8', '#ff8fd1', '#b8a2ff'];
    for (let i = 0; i < n; i++) {
      const a = 0.5 + i * ((Math.PI * 2) / n);
      const far = Math.sin(a) < 0;
      if ((half === 'back') !== far) continue;
      const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, r = far ? 3.4 : 4.6;
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${moons[i % 4]}" stroke="#ffffff" stroke-width="1.1"/><circle cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.35)}" r="${f(r * 0.3)}" fill="#ffffff" opacity="0.8"/>`;
    }
    return s + '</g>';
  }

  // ---------------------------------------------------------------- compose
  const defs = (P, id, t) => `<defs>` +
    `<radialGradient id="body-${id}" cx="36%" cy="28%" r="82%"><stop offset="0%" stop-color="${P.hi}"/><stop offset="38%" stop-color="${P.light}"/><stop offset="100%" stop-color="${P.dark}"/></radialGradient>` +
    `<linearGradient id="shine-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.12"/></linearGradient>` +
    `<radialGradient id="iris-${id}" cx="50%" cy="38%" r="70%"><stop offset="0%" stop-color="#ff8ff2"/><stop offset="55%" stop-color="#6230e0"/><stop offset="100%" stop-color="#140a38"/></radialGradient>` +
    `<radialGradient id="iriss-${id}" cx="50%" cy="30%" r="80%"><stop offset="0%" stop-color="${shade(P.accent, 0.3)}"/><stop offset="100%" stop-color="${shade(P.accent, -0.55)}"/></radialGradient>` +
    `<radialGradient id="core-${id}"><stop offset="0%" stop-color="#ffffff"/><stop offset="35%" stop-color="#d36bff"/><stop offset="100%" stop-color="#16002e"/></radialGradient>` +
    `<linearGradient id="gold-x" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset="1" stop-color="#e0a100"/></linearGradient>` +
    `<radialGradient id="ground-${id}"><stop offset="0%" stop-color="#000" stop-opacity="0.38"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<pattern id="scales-${id}" width="8" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 Q4 0 8 6" fill="none" stroke="${P.detail}" stroke-width="1" opacity="0.28"/></pattern>` +
    `<pattern id="feathers-${id}" width="10" height="7" patternUnits="userSpaceOnUse"><path d="M0 0 Q5 8 10 0" fill="none" stroke="${P.detail}" stroke-width="1" opacity="0.25"/></pattern>` +
    `<pattern id="fur-${id}" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M1 6 L2.5 2 M4.5 6 L5.5 3" stroke="${P.detail}" stroke-width="0.9" opacity="0.25"/></pattern>` +
    `<pattern id="rock-${id}" width="14" height="12" patternUnits="userSpaceOnUse"><path d="M0 4 L5 2 L9 5 L14 3 M2 12 L4 8 L9 9 L12 12" fill="none" stroke="${P.detail}" stroke-width="1" opacity="0.3"/><circle cx="10" cy="8" r="1" fill="${P.hi}" opacity="0.3"/></pattern>` +
    `<linearGradient id="bark-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(mix(P.dark, '#6b4423', 0.6), -0.2)}"/><stop offset="0.45" stop-color="${shade(mix(P.dark, '#6b4423', 0.6), 0.25)}"/><stop offset="1" stop-color="${shade(mix(P.dark, '#6b4423', 0.6), -0.3)}"/></linearGradient>` +
    `</defs>`;

  let uidN = 0;
  /** The beast, without its rarity glow: an SVG string. */
  function beast(id, opts = {}) {
    const t = BEAST_TEMPLATES[id];
    if (!t) return '';
    // 1.4: a Relic is stained glass (relics.js).
    if (t.relic && typeof RELIC_ART !== 'undefined') return RELIC_ART.svg(id, opts);
    const p = t.svgParams || {};
    const shadow = !!(p.shadow_fiend || p.shadow_fiend_evolved || p.void_parasite || p.void_parasite_evolved);
    const o = { infected: !!opts.infected, shadow, evolved: !!opts.evolved };
    const P = palette(t, o);
    const uid = 'b' + (uidN++).toString(36);
    const body = B[p.body] || B.droplet;
    const parts = body(t, P, uid);
    const A = parts.A;
    const ex = extras(t, A, P, uid);
    const vb = opts.pad ? '-15 -15 150 150' : '0 0 120 120';
    let s = `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">` + defs(P, uid, t);
    if (!opts.noGround) s += `<ellipse cx="60" cy="109" rx="30" ry="6" fill="url(#ground-${uid})"/>`;
    s += orbits(t, P, 'back');
    s += ex.back;
    const wingKind = p.wings || A.defaultWings;
    if (wingKind) s += wings(wingKind, A, P, uid);
    if (p.halo === 'sun') s += halo('sun', A);
    s += parts.back || '';
    if (p.tail) s += tail(p.tail, A, P, uid);
    s += parts.main;
    s += ex.front;
    if (A.eyes) s += eyes(p.eyes || 'cute', A.eyes, P, uid, o);
    if (p.horns) s += horns(p.horns, A, P);
    if (p.horn) s += uniHorn(p.horn, A);
    if (p.crown) s += crown(p.crown, A, P);
    if (p.halo && p.halo !== 'sun') s += halo(p.halo, A);
    s += orbits(t, P, 'front');
    s += surround(t, P);
    if (o.infected) s += `<circle cx="38" cy="86" r="4" fill="#9dff4a" opacity="0.75"/><circle cx="82" cy="76" r="3" fill="#9dff4a" opacity="0.75"/><path d="M70 98 q2 6 0 9" stroke="#9dff4a" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8"/>`;
    if (o.evolved) s += star(16, 22, 5.5, '#ffe066') + star(104, 26, 4.5, '#ffe066') + star(102, 100, 3.8, '#ffe066') + star(14, 96, 3.2, '#fff3a8');
    return s + `</svg>`;
  }

  /** The glow behind a beast, for its rarity (or gold when evolved, purple when infected, red for shadows). 200 by 200, drawn larger than the beast. */
  function aura(id, opts = {}) {
    const t = BEAST_TEMPLATES[id];
    if (!t) return '';
    const p = t.svgParams || {};
    const shadow = !!(p.shadow_fiend || p.shadow_fiend_evolved || p.void_parasite || p.void_parasite_evolved);
    let R = RARITY[t.rarity];
    if (opts.infected) R = { c: '#a63dff', c2: '#e2ffb0', rays: 0, glow: 0.7, sparkles: 0 };
    else if (shadow) R = { c: '#ff2a2a', c2: '#ffb3b3', rays: 0, glow: 0.8, sparkles: 0, smoke: true };
    else if (!R && opts.evolved) R = { c: '#ffd700', c2: '#fff3b0', rays: 6, glow: 0.7, sparkles: 2 };
    if (!R) return '';
    const u = 'a' + (uidN++).toString(36);
    let s = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs>` +
      `<radialGradient id="g-${u}"><stop offset="0%" stop-color="${R.c2}" stop-opacity="${R.glow}"/><stop offset="30%" stop-color="${R.c}" stop-opacity="${R.glow * 0.8}"/><stop offset="62%" stop-color="${R.c}" stop-opacity="${R.glow * 0.28}"/><stop offset="100%" stop-color="${R.c}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="r-${u}" cx="100" cy="100" r="98" gradientUnits="userSpaceOnUse"><stop offset="0.2" stop-color="${R.c2}" stop-opacity="${0.75 * R.glow}"/><stop offset="0.6" stop-color="${R.c}" stop-opacity="${0.35 * R.glow}"/><stop offset="1" stop-color="${R.c}" stop-opacity="0"/></radialGradient>` +
      `</defs>`;
    if (R.dark) s += [0, 120, 240].map((a) => `<path d="M100 100 C132 78 152 100 142 132 C134 112 118 104 100 100 Z" fill="#2b0040" opacity="0.5" transform="rotate(${a} 100 100)"/>`).join('');
    s += `<circle cx="100" cy="100" r="98" fill="url(#g-${u})"/>`;
    for (let i = 0; i < R.rays; i++) {
      const a = (i / R.rays) * 360, w = i % 2 ? 9 : 15, len = i % 2 ? 84 : 98;
      s += `<path d="M${100 - w / 2} ${100 - len} Q100 ${100 - len - 6} ${100 + w / 2} ${100 - len} L101.5 100 L98.5 100 Z" fill="url(#r-${u})" transform="rotate(${a} 100 100)"/>`;
    }
    for (let i = 0; i < R.sparkles; i++) { const a = (i / R.sparkles) * Math.PI * 2 + 0.5, r = 74 - (i % 2) * 10; s += star(100 + Math.cos(a) * r, 100 + Math.sin(a) * r, 5 - (i % 2) * 1.4, i % 2 ? '#ffffff' : R.c2, 0.9); }
    if (R.smoke) s += [0, 72, 144, 216, 288].map((a) => `<circle cx="100" cy="34" r="16" fill="#2a0008" opacity="0.35" transform="rotate(${a} 100 100)"/>`).join('');
    return s + `</svg>`;
  }

  /** The colour a beast's own outline glows in (its rarity, gold when evolved, and so on), or null. */
  function glowColour(id, evolved, infected) {
    const t = BEAST_TEMPLATES[id];
    if (!t) return null;
    const p = t.svgParams || {};
    if (p.shadow_fiend || p.shadow_fiend_evolved || p.void_parasite || p.void_parasite_evolved) return '#ff2a2a';
    if (infected) return '#a63dff';
    if (RARITY[t.rarity]) return RARITY[t.rarity].c;
    if (evolved) return '#ffd700';
    return null;
  }

  /** Inline art for menus: the glow and the beast in one SVG (static, no filters). */
  function inline(id, evolved, infected) {
    const a = aura(id, { evolved, infected });
    const b = beast(id, { evolved, infected });
    const col = glowColour(id, evolved, infected);
    if (!a && !col) return b.replace('<svg ', '<svg class="beast-svg" ');
    const inner = b.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    const glow = a ? a.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') : '';
    const f = 'gf' + (uidN++).toString(36);
    return `<svg viewBox="0 0 120 120" class="beast-svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs><filter id="${f}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="3.2" flood-color="${col || '#ffffff'}" flood-opacity="${col ? 0.95 : 0}"/></filter></defs>${glow ? `<g transform="translate(-6 -4) scale(0.66)" opacity="0.95">${glow}</g>` : ''}<g filter="url(#${f})">${inner}</g></svg>`;
  }

  // ---------------------------------------------------------------- pictures for the field
  const cache = new Map();
  const pending = new Map();
  /** A picture (data URL) of the beast or its aura at `px` pixels square, made once. */
  function picture(kind, id, evolved, infected, px, noGround = false, glow = false) {
    const bucket = Math.min(640, Math.max(96, Math.ceil(px / 64) * 64));
    const key = `${kind}|${id}|${evolved ? 1 : 0}|${infected ? 1 : 0}|${bucket}|${noGround ? 1 : 0}|${glow ? 1 : 0}`;
    if (cache.has(key)) return Promise.resolve(cache.get(key));
    if (pending.has(key)) return pending.get(key);
    const svg = kind === 'aura' ? aura(id, { evolved, infected }) : beast(id, { evolved, infected, noGround, pad: glow });
    const gc = kind === 'beast' && glow ? glowColour(id, evolved, infected) : null;
    if (!svg) return Promise.resolve('');
    const job = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = bucket;
        const ctx = c.getContext('2d');
        if (gc) {
          // The rarity's colour glowing off the beast's own outline, then the beast crisp on top.
          ctx.shadowColor = gc;
          ctx.shadowBlur = bucket * 0.075;
          ctx.drawImage(img, 0, 0, bucket, bucket);
          ctx.shadowBlur = bucket * 0.035;
          ctx.drawImage(img, 0, 0, bucket, bucket);
          ctx.shadowBlur = 0;
          ctx.shadowColor = 'rgba(0,0,0,0)';
        }
        ctx.drawImage(img, 0, 0, bucket, bucket);
        const url = c.toDataURL('image/png');
        cache.set(key, url);
        pending.delete(key);
        resolve(url);
      };
      img.onerror = () => { pending.delete(key); resolve(''); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
    pending.set(key, job);
    return job;
  }
  function cached(kind, id, evolved, infected, px, noGround = false, glow = false) {
    const bucket = Math.min(640, Math.max(96, Math.ceil(px / 64) * 64));
    return cache.get(`${kind}|${id}|${evolved ? 1 : 0}|${infected ? 1 : 0}|${bucket}|${noGround ? 1 : 0}|${glow ? 1 : 0}`) || null;
  }

  /** How a body type moves on the field (field.js reads it). */
  function motion(id) {
    const t = BEAST_TEMPLATES[id];
    const body = (t && t.svgParams && t.svgParams.body) || 'droplet';
    const parts = (B[body] || B.droplet)(t, palette(t, {}), 'm');
    return parts.A.motion || 'walk';
  }

  // ---------------------------------------------------------------- coins and crates
  const svgUrl = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  const coinCache = {};
  /** An essence coin: gold with an essence gem set in it; evolved beasts drop a brighter one. */
  function coin(evolved) {
    const k = evolved ? 'e' : 'n';
    if (coinCache[k]) return coinCache[k];
    const gem = evolved ? ['#e8fbff', '#3ff6ff', '#0b6f80'] : ['#fff8d0', '#ffcf3d', '#a66a00'];
    const s = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><defs>` +
      `<radialGradient id="cr" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6b8"/><stop offset="0.45" stop-color="#ffc928"/><stop offset="1" stop-color="#c47f00"/></radialGradient>` +
      `<radialGradient id="cf" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#e09a00"/></radialGradient>` +
      `<linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${gem[0]}"/><stop offset="0.5" stop-color="${gem[1]}"/><stop offset="1" stop-color="${gem[2]}"/></linearGradient>` +
      `<radialGradient id="ch"><stop offset="0" stop-color="${evolved ? '#3ff6ff' : '#ffd43b'}" stop-opacity="0.55"/><stop offset="1" stop-color="${evolved ? '#3ff6ff' : '#ffd43b'}" stop-opacity="0"/></radialGradient></defs>` +
      `<circle cx="20" cy="20" r="19.5" fill="url(#ch)"/>` +
      `<ellipse cx="20" cy="36.5" rx="10" ry="2.2" fill="#000" opacity="0.25"/>` +
      `<circle cx="20" cy="19" r="14" fill="url(#cr)" stroke="#7a4a00" stroke-width="2"/>` +
      `<circle cx="20" cy="19" r="10.2" fill="url(#cf)" stroke="#b47300" stroke-width="1.2"/>` +
      `<path d="M20 11.5 L26 15.5 L26 22.5 L20 26.5 L14 22.5 L14 15.5 Z" fill="url(#cg)" stroke="${gem[2]}" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="M20 11.5 L26 15.5 L20 19 L14 15.5 Z" fill="#ffffff" opacity="0.45"/>` +
      `<ellipse cx="14.5" cy="12.5" rx="3.6" ry="2" transform="rotate(-35 14.5 12.5)" fill="#ffffff" opacity="0.75"/>` +
      (evolved ? `<path d="M33 6 Q33.6 8.4 36 9 Q33.6 9.6 33 12 Q32.4 9.6 30 9 Q32.4 8.4 33 6 Z" fill="#ffffff"/><path d="M7 27 Q7.4 28.6 9 29 Q7.4 29.4 7 31 Q6.6 29.4 5 29 Q6.6 28.6 7 27 Z" fill="#e8fbff"/>` : '') +
      `</svg>`;
    return (coinCache[k] = svgUrl(s));
  }

  /** A crate: a banded wooden chest with a glowing rune seal, or the premium one in magenta and gold. */
  function crate(premium) {
    const wood = premium ? ['#ff5ad8', '#b0179a', '#5a0a52'] : ['#c98b55', '#8a5530', '#4a2a14'];
    const band = premium ? ['#ffe27a', '#b98a00'] : ['#9aa4b4', '#4a5260'];
    const rune = premium ? '#fff3a8' : '#7cf7e8';
    return `<svg class="crate-sprite crate-v2" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs>` +
      `<linearGradient id="cw${premium ? 'p' : ''}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wood[0]}"/><stop offset="1" stop-color="${wood[1]}"/></linearGradient>` +
      `<radialGradient id="cs${premium ? 'p' : ''}"><stop offset="0" stop-color="${rune}" stop-opacity="0.9"/><stop offset="1" stop-color="${rune}" stop-opacity="0"/></radialGradient></defs>` +
      `<ellipse cx="50" cy="93" rx="38" ry="5" fill="#000" opacity="0.28"/>` +
      `<rect x="12" y="38" width="76" height="52" rx="7" fill="url(#cw${premium ? 'p' : ''})" stroke="${wood[2]}" stroke-width="4"/>` +
      `<path d="M14 46 L86 46 M14 62 L86 62 M14 76 L86 76" stroke="${wood[2]}" stroke-width="1.6" opacity="0.45"/>` +
      `<path d="M10 40 C10 18 90 18 90 40 L90 46 L10 46 Z" fill="url(#cw${premium ? 'p' : ''})" stroke="${wood[2]}" stroke-width="4" stroke-linejoin="round"/>` +
      `<path d="M18 34 C22 24 78 24 82 34" stroke="#ffffff" stroke-width="2.4" fill="none" opacity="0.35" stroke-linecap="round"/>` +
      `<rect x="22" y="22" width="9" height="68" rx="2" fill="${band[0]}" stroke="${band[1]}" stroke-width="2.4"/><rect x="69" y="22" width="9" height="68" rx="2" fill="${band[0]}" stroke="${band[1]}" stroke-width="2.4"/>` +
      `<circle cx="26.5" cy="56" r="1.6" fill="${band[1]}"/><circle cx="26.5" cy="80" r="1.6" fill="${band[1]}"/><circle cx="73.5" cy="56" r="1.6" fill="${band[1]}"/><circle cx="73.5" cy="80" r="1.6" fill="${band[1]}"/>` +
      `<circle cx="50" cy="48" r="17" fill="url(#cs${premium ? 'p' : ''})"/>` +
      `<rect x="40" y="38" width="20" height="20" rx="5" fill="${band[0]}" stroke="${band[1]}" stroke-width="2.6"/>` +
      `<path d="M50 42 L55 48 L50 54 L45 48 Z" fill="${rune}" stroke="${premium ? '#b98a00' : '#0f5c55'}" stroke-width="1.4"/>` +
      (premium ? `<circle cx="18" cy="30" r="3" fill="#7cf7e8" stroke="#0f5c55" stroke-width="1.2"/><circle cx="82" cy="30" r="3" fill="#7cf7e8" stroke="#0f5c55" stroke-width="1.2"/><path d="M86 12 Q87 15 90 16 Q87 17 86 20 Q85 17 82 16 Q85 15 86 12 Z" fill="#fff3a8"/>` : '') +
      `</svg>`;
  }

  return { beast, aura, inline, picture, cached, motion, glowColour, coin, crate, shade, mix, RARITY };
})();

// The menus, toasts and modals all draw beasts through getBeastSVG: from here on, the new art.
if (typeof getBeastSVG === 'function') {
  // eslint-disable-next-line no-global-assign
  getBeastSVG = function (beastId, evolved = false, infected = false) { return ART.inline(beastId, evolved, infected); };
}
