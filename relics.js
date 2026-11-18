/**
 * Merge Beasts 1.4: the Relics, and the merge achievements that win them (Sam, 18 Nov: "achievements
 * and special rewards such as unique beasts for doing stuff in the merge part of the game ... some
 * of the rewards are unique looking high tier rare or rarer beasts, achievement beasts are
 * automatically evolved unless they're two part achievements, so the second achievement unlocks the
 * evolved form").
 *
 * Six beasts of stained glass, nothing like the meadow's round beasts or the battle's paper Folded
 * Legends: bright panes of coloured glass held in dark lead, glowing; an evolved one's lead is gold,
 * with a halo. They are beasts like any other in the meadow (they wander and make essence, and
 * battle in every world) but never merge, never go in an incubator, and never come from crates,
 * spins or the shop: only from these achievements. Their solar system is 'relic', so every list of
 * buyable or droppable beasts (which picks a system) leaves them out.
 *
 * Loaded after beasts.js and before art.js and game.js: it adds the Relics to BEAST_TEMPLATES, and
 * art.js and getBeastSVG draw them with RELIC_ART.svg.
 */
const RELICS = [
  { id: 'glasswing', name: 'Glasswing', tier: 9, rarity: 'SUPER_RARE', element: 'LIGHT', baseCps: 2.5e6, lore: 'A moth made of church windows. It flies towards lamps, and lamps fly towards it.' },
  { id: 'prism_wolf', name: 'Prism Wolf', tier: 11, rarity: 'ULTRA_RARE', element: 'WIND', baseCps: 3e9, lore: 'A wolf of cut glass. When it howls, the light in the meadow splits into rainbows.' },
  { id: 'rosette_whale', name: 'Rosette Whale', tier: 13, rarity: 'LEGENDARY', element: 'WATER', baseCps: 1.2e13, lore: 'It swims through the air very slowly, and the sun shines through it in colours onto the grass.' },
  { id: 'cathedral_peacock', name: 'Cathedral Peacock', tier: 15, rarity: 'GODLY', element: 'DEITY', baseCps: 4e15, lore: 'Its tail is a rose window. It opens it for visitors, and it is very hard to look away.' },
  { id: 'sunwindow_lion', name: 'Sunwindow Lion', tier: 17, rarity: 'GODLY', element: 'FIRE', baseCps: 1.2e18, lore: 'A lion whose mane is a window facing the sunrise. It is warm to stand next to.' },
  { id: 'rose_window', name: 'The Rose Window', tier: 20, rarity: 'DARK_MATTER', element: 'COSMIC', baseCps: 5e23, lore: 'A dragon asleep in a great round window of dark glass. Twenty thousand merges woke it.' },
];
if (typeof BEAST_TEMPLATES !== 'undefined') {
  for (const r of RELICS) {
    BEAST_TEMPLATES[r.id] = { ...r, cost: 0, evolutions: [], system: 'relic', relic: true, svgParams: { body: 'relic', eyes: 'normal', color: '#ffffff', glow: true } };
  }
}
const isRelic = (id) => !!(typeof BEAST_TEMPLATES !== 'undefined' && BEAST_TEMPLATES[id] && BEAST_TEMPLATES[id].relic);

/**
 * The merge achievements: test(s) on the merge counts (state.mergeStats), the Beastopedia and
 * prestige; reward as in battle (crates, premium crates with a top tier, spins), or a Relic, given
 * evolved unless `relic.evolved` is false (the first part of a two-part achievement).
 */
const MERGE_ACH = [
  { id: 'm_merge_25', name: 'Getting Started', desc: 'Merge 25 times.', count: (s) => [s.merges, 25], reward: { crates: 3 } },
  { id: 'm_merge_500', name: 'Busy Paws', desc: 'Merge 500 times.', count: (s) => [s.merges, 500], reward: { relic: 'glasswing', evolved: true } },
  { id: 'm_merge_2000', name: 'Merge Machine', desc: 'Merge 2,000 times.', count: (s) => [s.merges, 2000], reward: { premium: 3, cap: 15 } },
  { id: 'm_merge_20000', name: 'Twenty Thousand', desc: 'Merge 20,000 times.', count: (s) => [s.merges, 20000], reward: { relic: 'rose_window', evolved: true } },
  { id: 'm_sparky_100', name: 'Spark Collector', desc: 'Merge Sparkys together 100 times.', count: (s) => [(s.mergesOf || {}).sparky || 0, 100], reward: { spins: 3 } },
  { id: 'm_discover_20', name: 'Naturalist', desc: 'Discover 20 beasts.', count: (s, x) => [x.discovered, 20], reward: { crates: 5 } },
  { id: 'm_discover_60', name: 'Explorer', desc: 'Discover 60 beasts.', count: (s, x) => [x.discovered, 60], reward: { relic: 'cathedral_peacock', evolved: false } },
  { id: 'm_discover_all', name: 'Every Beast', desc: 'Discover every beast in both solar systems.', count: (s, x) => [x.discovered, x.allBeasts], reward: { relic: 'cathedral_peacock', evolved: true } },
  { id: 'm_mutate_10', name: 'Lucky Mutation', desc: 'Find 10 rare mutations when merging.', count: (s) => [s.mutations, 10], reward: { spins: 2 } },
  { id: 'm_mutate_50', name: 'Mutation Hunter', desc: 'Find 50 rare mutations when merging.', count: (s) => [s.mutations, 50], reward: { relic: 'rosette_whale', evolved: true } },
  { id: 'm_cure_25', name: 'Plague Doctor', desc: 'Cure 25 plagued beasts.', count: (s) => [s.cures, 25], reward: { relic: 'prism_wolf', evolved: false } },
  { id: 'm_cure_100', name: 'Cure-All', desc: 'Cure 100 plagued beasts.', count: (s) => [s.cures, 100], reward: { relic: 'prism_wolf', evolved: true } },
  { id: 'm_evolve_1', name: 'Evolution', desc: 'Evolve a beast (100 incubations of one kind).', count: (s) => [s.evolved, 1], reward: { premium: 3, cap: 15 } },
  { id: 'm_evolve_3', name: 'Living Proof', desc: 'Evolve 3 beasts.', count: (s) => [s.evolved, 3], reward: { relic: 'sunwindow_lion', evolved: true } },
  { id: 'm_prestige_3', name: 'Ascendant', desc: 'Reach prestige 3.', count: (s, x) => [x.prestige, 3], reward: { premium: 2, cap: 15 } },
  { id: 'm_prestige_9', name: 'Starfarer', desc: 'Reach prestige 9.', count: (s, x) => [x.prestige, 9], reward: { premium: 5, cap: 18 } },
];

const RELIC_ART = (() => {
  const LEAD = '#1d1626', GOLD = '#f0c050';
  // The parts: a pane of glass (a colour and its corners), a round pane, a lead line, an eye.
  const P = (c, ...pts) => ({ k: 'P', c, pts });
  const C = (c, x, y, r) => ({ k: 'C', c, x, y, r });
  const L = (w, ...pts) => ({ k: 'L', w, pts });
  const E = (x, y, r = 2.6) => ({ k: 'E', x, y, r });
  const mirror = (parts) => parts.map((p) => (p.pts ? { ...p, pts: p.pts.map((v, i) => (i % 2 ? v : 120 - v)) } : p.x != null ? { ...p, x: 120 - p.x } : p));
  // A ring of panes round a centre, from radius r0 to r1, n of them between two angles.
  function ring(cx, cy, r0, r1, n, a0, a1, cols) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const p = a0 + ((a1 - a0) * i) / n, q = a0 + ((a1 - a0) * (i + 1)) / n, m = (p + q) / 2;
      out.push(P(cols[i % cols.length], cx + Math.cos(p) * r0, cy + Math.sin(p) * r0, cx + Math.cos(m) * r1, cy + Math.sin(m) * r1, cx + Math.cos(q) * r0, cy + Math.sin(q) * r0));
    }
    return out;
  }
  // Wedge-shaped panes between two radii (a rose window's petals, a peacock's fan).
  function wedges(cx, cy, r0, r1, n, a0, a1, cols) {
    const out = [];
    const at = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    for (let i = 0; i < n; i++) {
      const p = a0 + ((a1 - a0) * i) / n, q = a0 + ((a1 - a0) * (i + 1)) / n, m = (p + q) / 2;
      out.push(P(cols[i % cols.length], ...at(p, r0), ...at(p, r1), ...at(m, r1 * 1.03), ...at(q, r1), ...at(q, r0)));
    }
    return out;
  }

  const D = {
    // A moth spread like a window: amber, teal, rose and violet panes, eye spots, feathered feelers.
    glasswing: () => {
      const half = [
        P('#ffcf4a', 55, 48, 22, 18, 34, 46), P('#3ad0c8', 55, 48, 34, 46, 9, 38), P('#ff6a9a', 55, 48, 9, 38, 13, 60, 55, 60),
        P('#9a6aff', 55, 62, 16, 66, 22, 88), P('#ffcf4a', 55, 62, 22, 88, 44, 94, 55, 74),
        C('#2a4aff', 28, 46, 4.6), L(1.4, 56, 40, 46, 22, 42, 16), L(1, 50, 30, 46, 30), L(1, 48, 25, 44, 26),
      ];
      return [...half, ...mirror(half), P('#e8d0ff', 60, 34, 66, 42, 64, 80, 60, 86, 56, 80, 54, 42), C('#fff2b0', 60, 38, 6.5), E(57.5, 38, 1.8), E(62.5, 38, 1.8)];
    },
    // A wolf of cut glass in ice blues, whites and lavender, howling.
    prism_wolf: () => [
      P('#b0a0ff', 14, 48, 30, 58, 26, 70), P('#e8f8ff', 14, 48, 22, 46, 30, 58), // tail
      P('#40c0e0', 36, 80, 42, 80, 42, 104, 36, 104), P('#8ad8ff', 46, 82, 52, 82, 52, 104, 46, 104), P('#40c0e0', 62, 82, 68, 82, 68, 104, 62, 104), P('#8ad8ff', 72, 80, 78, 80, 78, 104, 72, 104), // legs
      P('#8ad8ff', 28, 60, 52, 54, 52, 70), P('#e8f8ff', 52, 54, 74, 52, 52, 70), P('#b0a0ff', 28, 60, 52, 70, 36, 82), P('#40c0e0', 52, 70, 74, 52, 78, 80), P('#e8f8ff', 36, 82, 52, 70, 78, 80), // body
      P('#b0a0ff', 74, 52, 84, 34, 90, 58), P('#e8f8ff', 74, 52, 90, 58, 78, 80), // neck and chest
      P('#8ad8ff', 84, 34, 92, 22, 100, 30), P('#40c0e0', 86, 30, 88, 16, 94, 26), // ear
      P('#e8f8ff', 84, 34, 100, 30, 106, 40, 90, 46), P('#b0a0ff', 100, 30, 116, 22, 112, 34, 106, 40), P('#8ad8ff', 90, 46, 106, 40, 112, 34, 104, 48), // head, snout lifted to howl
      E(96, 36, 2.4),
    ],
    // A whale floating in the air, its body a rosette of blue, teal and gold, spouting.
    rosette_whale: () => {
      const out = [P('#2a8aff', 18, 64, 2, 48, 10, 62), P('#3ad0c8', 18, 64, 4, 82, 12, 68)]; // tail flukes
      const rim = [[18, 64], [32, 50], [56, 42], [84, 44], [104, 54], [110, 66], [100, 78], [72, 86], [42, 84], [24, 76]];
      const cols = ['#2a6aff', '#3ad0c8', '#ffcf4a', '#2a8aff', '#7ae0ff', '#2a6aff', '#3ad0c8', '#ffcf4a', '#9a6aff', '#7ae0ff'];
      rim.forEach(([x, y], i) => { const [u, v] = rim[(i + 1) % rim.length]; out.push(P(cols[i], 62, 64, x, y, u, v)); });
      out.push(C('#fff2b0', 62, 64, 7), C('#ff6a9a', 62, 64, 3.2));
      out.push(P('#2a6aff', 58, 82, 48, 98, 72, 86)); // flipper
      out.push(C('#bfe8ff', 92, 30, 3.5), C('#bfe8ff', 98, 24, 3), C('#bfe8ff', 86, 24, 3), L(1.5, 92, 44, 92, 34));
      out.push(E(98, 58, 2.6));
      return out;
    },
    // A peacock whose fan is a rose window of emerald, sapphire, gold and violet, each with an eye.
    cathedral_peacock: () => {
      const fan = wedges(46, 70, 10, 46, 9, Math.PI * 1.02, Math.PI * 1.98, ['#2ad08a', '#2a6aff', '#ffd040', '#9a6aff']);
      const eyes = [];
      for (let i = 0; i < 9; i++) { const a = Math.PI * 1.02 + (Math.PI * 0.96 * (i + 0.5)) / 9; eyes.push(C('#1a2a8a', 46 + Math.cos(a) * 32, 70 + Math.sin(a) * 32, 3.4)); }
      return [
        ...fan, ...eyes, C('#ffd040', 46, 70, 9),
        L(2, 58, 86, 56, 104), L(2, 66, 86, 68, 104),
        P('#2a6aff', 48, 80, 58, 62, 74, 66, 70, 88, 54, 90), P('#2ad08a', 58, 62, 74, 66, 70, 76), // body
        P('#2a6aff', 70, 66, 78, 40, 84, 42, 76, 70), P('#3ad0c8', 78, 40, 86, 32, 92, 40, 84, 46), P('#ffd040', 92, 38, 100, 40, 92, 43), // neck, head, beak
        L(1, 84, 34, 80, 24), L(1, 86, 33, 86, 22), L(1, 88, 34, 92, 24), C('#ffd040', 80, 23, 2), C('#2ad08a', 86, 21, 2), C('#ffd040', 92, 23, 2), // crest
        E(87, 37, 2),
      ];
    },
    // A lion with a mane of sun rays in orange, gold and red round its head.
    sunwindow_lion: () => [
      P('#ff8a2a', 14, 64, 24, 70, 18, 76), C('#c0302a', 12, 62, 4), // tail and tuft
      P('#ffb030', 28, 72, 52, 60, 52, 84, 32, 90), P('#ff8a2a', 52, 60, 74, 62, 72, 86, 52, 84), // body
      P('#ffcf4a', 32, 90, 38, 90, 38, 104, 30, 104), P('#ff8a2a', 44, 86, 50, 86, 50, 104, 44, 104), P('#ffcf4a', 62, 86, 68, 86, 68, 104, 62, 104), P('#ff8a2a', 70, 84, 76, 84, 78, 104, 70, 104), // legs
      ...ring(86, 50, 12, 30, 14, 0, Math.PI * 2, ['#ff6a2a', '#ffcf4a', '#c0302a', '#ffb030']), // the mane, a sun window
      C('#ffd890', 86, 50, 12.5), P('#ffb030', 90, 54, 100, 52, 96, 60, 88, 60), C(LEAD, 99, 52, 1.6), // face and nose
      E(84, 46, 2.2), E(92, 45, 2.2),
    ],
    // A dragon asleep in a great round window of dark glass, wings to either side.
    rose_window: () => [
      ...wedges(60, 58, 27, 46, 12, 0, Math.PI * 2, ['#2a1a6a', '#6a1a8a', '#1a2a8a', '#a01a7a']),
      ...wedges(60, 58, 9, 27, 8, Math.PI / 8, Math.PI * 2 + Math.PI / 8, ['#ff4ae0', '#40e0ff', '#ffd040', '#9a6aff']),
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => C('#40e0ff', 60 + Math.cos((i + 0.5) * Math.PI / 6) * 37, 58 + Math.sin((i + 0.5) * Math.PI / 6) * 37, 2.6)),
      C('#ffd040', 60, 58, 9),
      P('#2a1a6a', 30, 48, 4, 26, 14, 52, 2, 60, 22, 62), P('#2a1a6a', 90, 48, 116, 26, 106, 52, 118, 60, 98, 62), // wings
      P('#ffd040', 52, 54, 60, 40, 68, 54, 64, 70, 56, 70), P('#f0a030', 60, 40, 72, 36, 76, 44, 68, 54), // head
      P('#ffd040', 62, 36, 60, 24, 66, 34), P('#ffd040', 70, 36, 74, 26, 74, 38), // horns
      E(66, 45, 2), L(2, 60, 104, 60, 104),
    ],
  };

  let uid = 0;
  /** A Relic as an SVG (the same frame as art.js's beasts: 120 square, or 150 with `pad`). */
  function svg(id, opts = {}) {
    const parts = (D[id] || D.glasswing)();
    const evo = !!opts.evolved;
    const lead = evo ? GOLD : LEAD;
    const u = `rl${++uid}`;
    const vb = opts.pad ? '-15 -15 150 150' : '0 0 120 120';
    let s = `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs>`
      + `<linearGradient id="${u}s" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.08"/><stop offset="1" stop-color="#000000" stop-opacity="0.18"/></linearGradient>`
      + `<radialGradient id="${u}h"><stop offset="0" stop-color="${evo ? '#fff2b0' : '#ffffff'}" stop-opacity="${evo ? 0.75 : 0.35}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`
      + `<radialGradient id="${u}g"><stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>`;
    if (!opts.noGround) s += `<ellipse cx="60" cy="108" rx="32" ry="6" fill="url(#${u}g)"/>`;
    // Light shining through: a soft glow behind it (a golden halo when evolved).
    s += `<circle cx="60" cy="58" r="${evo ? 58 : 44}" fill="url(#${u}h)"/>`;
    for (const p of parts) {
      if (p.k === 'P') {
        const pts = p.pts.map((v) => v.toFixed(1)).join(' ');
        s += `<polygon points="${pts}" fill="${p.c}" stroke="${lead}" stroke-width="2.4" stroke-linejoin="round"/><polygon points="${pts}" fill="url(#${u}s)"/>`;
      } else if (p.k === 'C') {
        s += `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${p.c}" stroke="${lead}" stroke-width="${p.r > 3 ? 2 : 1.2}"/>`;
      } else if (p.k === 'L') {
        s += `<polyline points="${p.pts.join(' ')}" fill="none" stroke="${lead}" stroke-width="${p.w}" stroke-linecap="round" stroke-linejoin="round"/>`;
      } else if (p.k === 'E') {
        s += `<circle cx="${p.x}" cy="${p.y}" r="${p.r * 1.35}" fill="#ffffff" stroke="${lead}" stroke-width="1"/><circle cx="${p.x + p.r * 0.15}" cy="${p.y}" r="${p.r}" fill="#1a1426"/><circle cx="${p.x - p.r * 0.3}" cy="${p.y - p.r * 0.35}" r="${p.r * 0.38}" fill="#ffffff"/>`;
      }
    }
    if (evo) for (const [x, y, r] of [[18, 20, 2.4], [104, 16, 2], [12, 90, 1.8], [110, 88, 2.2]]) s += `<path d="M${x} ${y - r * 2}L${x + r * 0.5} ${y - r * 0.5}L${x + r * 2} ${y}L${x + r * 0.5} ${y + r * 0.5}L${x} ${y + r * 2}L${x - r * 0.5} ${y + r * 0.5}L${x - r * 2} ${y}L${x - r * 0.5} ${y - r * 0.5}Z" fill="#fff6c0"/>`;
    return s + '</svg>';
  }
  return { svg, LIST: Object.keys(D) };
})();
