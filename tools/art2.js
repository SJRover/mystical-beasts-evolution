// Prototype of the new beast art (graphics overhaul, 14 Nov 2026). Each beast keeps its own
// colours, eyes and features from BEAST_TEMPLATES; only the drawing changes: a real silhouette
// for its body type, soft shading, an outline, glossy eyes and a rarity aura. Drawn once into a
// picture and reused (see rasterize), never redrawn live with filters.
(() => {
  const hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const toHex = (r) => '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  // amt > 0 towards white, < 0 towards black.
  const shade = (h, amt) => { const c = hex(h); return toHex(c.map((v) => (amt > 0 ? v + (255 - v) * amt : v * (1 + amt)))); };
  const lum = (h) => { const [r, g, b] = hex(h); return 0.299 * r + 0.587 * g + 0.114 * b; };
  const RARITY_AURA = { RARE: '#4cff6a', SUPER_RARE: '#3d9bff', ULTRA_RARE: '#c06bff', LEGENDARY: '#ffa53a', GODLY: '#48f4ff', DARK_MATTER: '#ff3cf0' };

  function palette(t) {
    const cols = t.svgParams.color;
    const a = cols[0], b = cols[cols.length - 1];
    const light = lum(a) >= lum(b) ? a : b, dark = lum(a) >= lum(b) ? b : a;
    return { light, dark, mid: shade(dark, 0.25), line: shade(dark, -0.55), belly: shade(light, 0.45), hi: shade(light, 0.75) };
  }

  function eyes(type, cx, cy, gap, r, P, id) {
    const L = cx - gap, R = cx + gap;
    const ball = (x) => `<ellipse cx="${x}" cy="${cy}" rx="${r}" ry="${r * 1.12}" fill="#1b1424"/>` +
      `<ellipse cx="${x - r * 0.3}" cy="${cy - r * 0.38}" rx="${r * 0.42}" ry="${r * 0.46}" fill="#fff"/>` +
      `<circle cx="${x + r * 0.36}" cy="${cy + r * 0.36}" r="${r * 0.18}" fill="#fff" opacity="0.9"/>`;
    const cosmic = (x) => `<ellipse cx="${x}" cy="${cy}" rx="${r}" ry="${r * 1.12}" fill="url(#iris-${id})"/>` +
      `<path d="M${x - r * 0.35} ${cy - r * 0.4} l${r * 0.12} ${r * 0.3} l${r * 0.3} ${r * 0.12} l-${r * 0.3} ${r * 0.12} l-${r * 0.12} ${r * 0.3} l-${r * 0.12} -${r * 0.3} l-${r * 0.3} -${r * 0.12} l${r * 0.3} -${r * 0.12} z" fill="#fff"/>` +
      `<circle cx="${x + r * 0.38}" cy="${cy + r * 0.4}" r="${r * 0.16}" fill="#fff" opacity="0.85"/>`;
    const lid = (x, flip) => `<path d="M${x - r * 1.15} ${cy - r * 0.15} Q${x} ${cy - r * 1.35} ${x + r * 1.15} ${cy - r * 0.15} L${x + r * 1.15} ${cy - r * 1.4} L${x - r * 1.15} ${cy - r * 1.4} Z" fill="${P.mid}"/>` +
      `<path d="M${x - r * 1.1} ${cy - r * 0.1} Q${x} ${cy - r * 0.55} ${x + r * 1.1} ${cy - r * 0.1}" stroke="${P.line}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    const brow = (x, s) => `<path d="M${x - r * 1.1 * s} ${cy - r * 1.75} L${x + r * 0.9 * s} ${cy - r * 1.05}" stroke="${P.line}" stroke-width="2.8" stroke-linecap="round"/>`;
    let out = '';
    if (type === 'sleepy') out = ball(L) + ball(R) + lid(L) + lid(R);
    else if (type === 'cosmic') out = cosmic(L) + cosmic(R);
    else if (type === 'wink') out = ball(L) + `<path d="M${R - r} ${cy} Q${R} ${cy - r} ${R + r} ${cy}" stroke="#1b1424" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    else out = ball(L) + ball(R);
    if (type === 'angry') out += brow(L, 1) + brow(R, -1);
    // Blush and mouth.
    out += `<ellipse cx="${L - r * 0.6}" cy="${cy + r * 1.55}" rx="${r * 0.75}" ry="${r * 0.4}" fill="#ff6b9a" opacity="0.45"/>` +
      `<ellipse cx="${R + r * 0.6}" cy="${cy + r * 1.55}" rx="${r * 0.75}" ry="${r * 0.4}" fill="#ff6b9a" opacity="0.45"/>`;
    if (type === 'excited') out += `<path d="M${cx - r * 0.7} ${cy + r * 1.35} Q${cx} ${cy + r * 2.5} ${cx + r * 0.7} ${cy + r * 1.35} Z" fill="#7a1f3d" stroke="${P.line}" stroke-width="1.4" stroke-linejoin="round"/>`;
    else if (type === 'angry') out += `<path d="M${cx - r * 0.55} ${cy + r * 1.75} Q${cx} ${cy + r * 1.3} ${cx + r * 0.55} ${cy + r * 1.75}" stroke="${P.line}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    else out += `<path d="M${cx - r * 0.5} ${cy + r * 1.4} Q${cx} ${cy + r * 1.9} ${cx + r * 0.5} ${cy + r * 1.4}" stroke="${P.line}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    return out;
  }

  const star = (x, y, s, fill) => `<path d="M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z" fill="${fill}"/>`;

  const BODIES = {
    droplet(t, P, id) {
      const p = t.svgParams;
      let s = `<path d="M60 12 C66 30 93 52 93 77 C93 97 78 107 60 107 C42 107 27 97 27 77 C27 52 54 30 60 12 Z" fill="url(#body-${id})" stroke="${P.line}" stroke-width="3.5" stroke-linejoin="round"/>`;
      s += `<path d="M86 66 C92 82 86 98 70 103" stroke="${P.hi}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.55"/>`;
      s += `<ellipse cx="45" cy="56" rx="6.5" ry="12" transform="rotate(-24 45 56)" fill="#fff" opacity="0.75"/><circle cx="52" cy="40" r="2.6" fill="#fff" opacity="0.85"/>`;
      s += eyes(p.eyes, 60, 76, 12, 6.5, P, id);
      if (p.sparks) s += star(20, 34, 7, P.hi) + star(100, 46, 5.5, P.hi) + star(97, 98, 4, P.light) + star(18, 88, 4, P.light);
      if (p.bubbles) s += `<circle cx="22" cy="40" r="5" fill="none" stroke="${P.hi}" stroke-width="2"/><circle cx="99" cy="58" r="3.5" fill="none" stroke="${P.hi}" stroke-width="2"/>`;
      return s;
    },
    dragon(t, P, id) {
      const p = t.svgParams;
      const wing = p.wings === 'golden' ? '#ffcf3d' : shade(P.dark, -0.15), wingLine = shade(wing, -0.5);
      let s = '';
      // Tail, wings (behind), body, belly, feet, head, snout, horns or fins.
      s += `<path d="M78 90 C97 96 112 84 107 69 C104 61 96 62 96 69 C100 74 99 84 82 80 Z" fill="url(#body-${id})" stroke="${P.line}" stroke-width="3" stroke-linejoin="round"/>`;
      if (p.sea_fins || p.tail === 'serpent') s += `<path d="M104 66 L116 56 L110 72 Z" fill="${P.belly}" stroke="${P.line}" stroke-width="2.4" stroke-linejoin="round"/>`;
      else s += `<path d="M103 63 L112 60 L108 70 Z" fill="${P.line}"/>`;
      const wingPath = 'M44 66 C30 46 13 44 6 54 C14 55 18 60 15 67 C23 63 29 68 28 76 C33 72 38 74 40 80 Z';
      s += `<path d="${wingPath}" fill="${wing}" stroke="${wingLine}" stroke-width="2.6" stroke-linejoin="round"/>`;
      s += `<path d="${wingPath}" transform="translate(120 0) scale(-1 1)" fill="${wing}" stroke="${wingLine}" stroke-width="2.6" stroke-linejoin="round"/>`;
      s += `<path d="M40 64 L15 66 M40 70 L27 74" stroke="${wingLine}" stroke-width="1.6" opacity="0.6"/><path d="M80 64 L105 66 M80 70 L93 74" stroke="${wingLine}" stroke-width="1.6" opacity="0.6"/>`;
      s += `<ellipse cx="60" cy="85" rx="26" ry="21" fill="url(#body-${id})" stroke="${P.line}" stroke-width="3.2"/>`;
      s += `<ellipse cx="60" cy="90" rx="15" ry="13" fill="${P.belly}"/><path d="M48 86 Q60 89 72 86 M49 93 Q60 96 71 93" stroke="${shade(P.belly, -0.3)}" stroke-width="1.6" fill="none"/>`;
      s += `<ellipse cx="47" cy="104" rx="8" ry="5" fill="${P.mid}" stroke="${P.line}" stroke-width="2.6"/><ellipse cx="73" cy="104" rx="8" ry="5" fill="${P.mid}" stroke="${P.line}" stroke-width="2.6"/>`;
      if (p.sea_fins) {
        s += `<path d="M37 44 L20 34 L32 56 Z" fill="${P.belly}" stroke="${P.line}" stroke-width="2.6" stroke-linejoin="round"/><path d="M83 44 L100 34 L88 56 Z" fill="${P.belly}" stroke="${P.line}" stroke-width="2.6" stroke-linejoin="round"/>`;
      } else {
        const horn = '#fff1c1', hl = shade('#fff1c1', -0.55);
        s += `<path d="M47 33 C44 22 38 16 31 13 C35 22 37 30 41 38 Z" fill="${horn}" stroke="${hl}" stroke-width="2.4" stroke-linejoin="round"/>`;
        s += `<path d="M73 33 C76 22 82 16 89 13 C85 22 83 30 79 38 Z" fill="${horn}" stroke="${hl}" stroke-width="2.4" stroke-linejoin="round"/>`;
      }
      s += `<circle cx="60" cy="50" r="25" fill="url(#body-${id})" stroke="${P.line}" stroke-width="3.2"/>`;
      s += `<path d="M52 26 L56 19 L60 26 L64 19 L68 26" fill="${P.belly}" stroke="${P.line}" stroke-width="2.2" stroke-linejoin="round"/>`;
      s += `<ellipse cx="60" cy="63" rx="15" ry="9.5" fill="${P.belly}" stroke="${P.line}" stroke-width="2.4"/><ellipse cx="55" cy="61.5" rx="1.8" ry="1.3" fill="${P.line}"/><ellipse cx="65" cy="61.5" rx="1.8" ry="1.3" fill="${P.line}"/>`;
      s += `<ellipse cx="47" cy="38" rx="5" ry="8" transform="rotate(-30 47 38)" fill="#fff" opacity="0.55"/>`;
      s += eyes(p.eyes === 'excited' ? 'cute' : p.eyes, 60, 47, 10, 5.5, P, id).replace(/<path d="M[^"]*Q[^"]*Z" fill="#7a1f3d"[^>]*>/, '');
      return s;
    },
    bird(t, P, id) {
      const p = t.svgParams;
      const flame = p.wings === 'fire_feathers';
      const f1 = flame ? '#ffcf3d' : P.belly, f2 = flame ? '#ff6a1a' : P.mid;
      let s = '';
      if (p.halo === 'sun') {
        s += `<circle cx="60" cy="44" r="34" fill="none" stroke="#ffd43b" stroke-width="3" opacity="0.9"/>`;
        for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += `<path d="M${60 + Math.cos(a) * 38} ${44 + Math.sin(a) * 38} L${60 + Math.cos(a) * 45} ${44 + Math.sin(a) * 45}" stroke="#ffd43b" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`; }
      }
      // Tail feathers fanned behind.
      for (const [a, len] of [[-28, 34], [0, 38], [28, 34]]) s += `<path d="M60 92 C${60 - 9} ${92 + len * 0.5} ${60 - 4} ${92 + len} 60 ${92 + len} C${60 + 4} ${92 + len} ${60 + 9} ${92 + len * 0.5} 60 92 Z" transform="rotate(${a + 180} 60 92)" fill="${f2}" stroke="${P.line}" stroke-width="2.4" stroke-linejoin="round"/>`;
      // Crest.
      for (const [x, a, len] of [[50, -22, 20], [60, 0, 24], [70, 22, 20]]) s += `<path d="M${x} 40 C${x - 6} ${40 - len * 0.5} ${x - 2} ${40 - len} ${x} ${40 - len} C${x + 2} ${40 - len} ${x + 6} ${40 - len * 0.5} ${x} 40 Z" transform="rotate(${a} ${x} 40)" fill="${f1}" stroke="${P.line}" stroke-width="2.4" stroke-linejoin="round"/>`;
      s += `<circle cx="60" cy="68" r="31" fill="url(#body-${id})" stroke="${P.line}" stroke-width="3.4"/>`;
      s += `<ellipse cx="60" cy="82" rx="19" ry="14" fill="${P.belly}" opacity="0.95"/>`;
      // Wings, a little raised.
      const w = 'M33 66 C18 62 10 74 14 86 C20 82 26 84 28 90 C32 84 36 82 38 80 Z';
      s += `<path d="${w}" fill="${f2}" stroke="${P.line}" stroke-width="2.6" stroke-linejoin="round"/><path d="${w}" transform="translate(120 0) scale(-1 1)" fill="${f2}" stroke="${P.line}" stroke-width="2.6" stroke-linejoin="round"/>`;
      if (flame) s += `<path d="M16 84 C14 78 18 72 22 76 M104 84 C106 78 102 72 98 76" stroke="#ffd43b" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      s += `<ellipse cx="46" cy="52" rx="6" ry="10" transform="rotate(-30 46 52)" fill="#fff" opacity="0.5"/>`;
      s += eyes(p.eyes, 60, 63, 11, 6, P, id).replace(/<path d="M[^"]*Q[^"]*Z" fill="#7a1f3d"[^>]*>/, '');
      s += `<path d="M53 73 L67 73 L60 83 Z" fill="#ffb11a" stroke="#8a4a00" stroke-width="2.2" stroke-linejoin="round"/>`;
      s += `<ellipse cx="51" cy="99" rx="5" ry="3.5" fill="#ffb11a" stroke="#8a4a00" stroke-width="2"/><ellipse cx="69" cy="99" rx="5" ry="3.5" fill="#ffb11a" stroke="#8a4a00" stroke-width="2"/>`;
      return s;
    },
    golem(t, P, id) {
      const p = t.svgParams;
      const rock = P.mid, rockLine = P.line;
      let s = '';
      s += `<rect x="40" y="92" width="15" height="15" rx="5" fill="${rock}" stroke="${rockLine}" stroke-width="3"/><rect x="65" y="92" width="15" height="15" rx="5" fill="${rock}" stroke="${rockLine}" stroke-width="3"/>`;
      s += `<rect x="13" y="56" width="20" height="38" rx="9" fill="url(#body-${id})" stroke="${rockLine}" stroke-width="3"/><rect x="87" y="56" width="20" height="38" rx="9" fill="url(#body-${id})" stroke="${rockLine}" stroke-width="3"/>`;
      s += `<rect x="29" y="52" width="62" height="48" rx="15" fill="url(#body-${id})" stroke="${rockLine}" stroke-width="3.4"/>`;
      s += `<path d="M36 64 L48 60 L52 70 L42 76 Z" fill="${shade(rock, -0.2)}" opacity="0.6"/><path d="M74 82 L86 78 L84 92 L72 92 Z" fill="${shade(rock, -0.2)}" opacity="0.6"/>`;
      s += `<path d="M62 56 L58 66 L64 72 L60 82" stroke="${rockLine}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/>`;
      if (p.crystals) {
        const c = '#7cf7e8', cl = '#0f5c55';
        s += `<path d="M60 70 L67 80 L60 92 L53 80 Z" fill="${c}" stroke="${cl}" stroke-width="2.4" stroke-linejoin="round"/><path d="M60 70 L60 92" stroke="#fff" stroke-width="1.6" opacity="0.7"/>`;
        s += `<path d="M18 56 L22 44 L27 56 Z M93 56 L98 42 L103 56 Z" fill="${c}" stroke="${cl}" stroke-width="2.2" stroke-linejoin="round"/>`;
      }
      s += `<rect x="37" y="20" width="46" height="38" rx="13" fill="url(#body-${id})" stroke="${rockLine}" stroke-width="3.4"/>`;
      if (p.crown === 'spiky') s += `<path d="M41 22 L45 9 L52 19 L60 6 L68 19 L75 9 L79 22 Z" fill="#ffd43b" stroke="#8a5a00" stroke-width="2.4" stroke-linejoin="round"/>`;
      s += `<ellipse cx="47" cy="30" rx="4.5" ry="7" transform="rotate(-30 47 30)" fill="#fff" opacity="0.4"/>`;
      s += eyes(p.eyes, 60, 38, 10, 5.2, P, id);
      return s;
    },
  };

  function newBeastSVG(id, evolved = false) {
    const t = BEAST_TEMPLATES[id];
    const P = palette(t);
    const body = BODIES[t.svgParams.body];
    if (!body) return null;
    const uid = id + (evolved ? 'e' : '');
    const aura = RARITY_AURA[t.rarity];
    let s = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs>` +
      `<radialGradient id="body-${uid}" cx="38%" cy="30%" r="80%"><stop offset="0%" stop-color="${P.hi}"/><stop offset="35%" stop-color="${P.light}"/><stop offset="100%" stop-color="${P.dark}"/></radialGradient>` +
      `<radialGradient id="iris-${uid}" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#ff7bf0"/><stop offset="55%" stop-color="#5a2bd6"/><stop offset="100%" stop-color="#120a33"/></radialGradient>` +
      (aura ? `<radialGradient id="aura-${uid}"><stop offset="0%" stop-color="${aura}" stop-opacity="0.55"/><stop offset="60%" stop-color="${aura}" stop-opacity="0.18"/><stop offset="100%" stop-color="${aura}" stop-opacity="0"/></radialGradient>` : '') +
      `<radialGradient id="shadow-${uid}"><stop offset="0%" stop-color="#000" stop-opacity="0.35"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>` +
      `</defs>`;
    if (aura) s += `<circle cx="60" cy="62" r="58" fill="url(#aura-${uid})"/>`;
    if (evolved) s += `<circle cx="60" cy="60" r="52" fill="none" stroke="#ffd700" stroke-width="2.2" opacity="0.9"/><circle cx="60" cy="60" r="56" fill="none" stroke="#fff3a8" stroke-width="1" opacity="0.6"/>`;
    s += `<ellipse cx="60" cy="109" rx="30" ry="6" fill="url(#shadow-${uid})"/>`;
    s += body(t, P, uid);
    if (t.svgParams.orbits) s += `<ellipse cx="60" cy="62" rx="54" ry="16" fill="none" stroke="${P.hi}" stroke-width="1.6" opacity="0.7" transform="rotate(-14 60 62)"/>` + star(10, 54, 4, '#fff') + star(108, 70, 3.5, '#fff');
    if (t.svgParams.stars) s += star(16, 20, 4.5, '#fff6c8') + star(104, 24, 3.5, '#fff6c8');
    if (evolved) s += star(18, 22, 5, '#ffe066') + star(102, 28, 4, '#ffe066') + star(100, 100, 3.5, '#ffe066');
    return s + `</svg>`;
  }

  // Into a picture once, at the size it is shown times the screen's pixel ratio.
  function rasterize(svg, px) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = px;
        c.getContext('2d').drawImage(img, 0, 0, px, px);
        resolve(c.toDataURL('image/png'));
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  window.ART2 = { newBeastSVG, rasterize, shade };
})();
