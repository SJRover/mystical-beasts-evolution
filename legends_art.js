/**
 * Merge Beasts battle mode (1.4): the Folded Legends' look. Paper animals made of flat folded
 * facets, light, mid and shadow, like real origami: nothing like the meadow's round beasts nor
 * the enemies. Each is drawn once into a picture (with its rarity's glow round the outline) for
 * the Beastopedia, the deck and the battle. Designs are in a 120 by 120 box facing right, feet on
 * y 104.
 *
 * LEGEND_ART.picture(id, px, locked) gives a data URL (a promise, like ART.picture).
 */
const LEGEND_ART = (() => {
  // Paper colours: [light, mid, shadow, accent, eye].
  const PAPER = {
    paper_crane: ['#fdfaf0', '#e8e2d0', '#c8c0aa', '#e8433a', '#1a1a22'],
    fold_fox: ['#ffb066', '#f08a3a', '#c4602a', '#fff4e4', '#1a1a22'],
    origami_frog: ['#9ee07a', '#6cc254', '#4a9a3c', '#f4ffe8', '#1a1a22'],
    origami_turtle: ['#c8e8a0', '#8cc070', '#5a9050', '#a87a48', '#1a1a22'],
    kite_ray: ['#9ad8ff', '#5ab0f0', '#3a80c8', '#ffd84a', '#1a1a22'],
    paper_tiger: ['#ffc85a', '#f0a030', '#c07818', '#2a2018', '#1a1a22'],
    lantern_koi: ['#ff8a6a', '#f0603a', '#c0402a', '#fff0d0', '#1a1a22'],
    folded_stag: ['#e8c89a', '#c8a070', '#9a7448', '#f4ece0', '#1a1a22'],
    paper_bat: ['#8a7ab0', '#5e4e88', '#3e3060', '#ff5a8a', '#ffe066'],
    scroll_serpent: ['#f4e8c8', '#dcc89a', '#b49a68', '#3a5ab0', '#1a1a22'],
    paper_owl: ['#e8d8b8', '#c8b088', '#9a8058', '#ffd84a', '#1a1a22'],
    origami_dragon: ['#ff7a5a', '#e04a3a', '#a82a2a', '#ffd84a', '#ffe066'],
    fold_phoenix: ['#ffd84a', '#ff9a3a', '#e05a2a', '#ff3a3a', '#1a1a22'],
    thousand_cranes: ['#ffd0ff', '#e080f0', '#a040c0', '#40e0ff', '#1a1a22'],
    paper_kirin: ['#2a2440', '#1a1630', '#0e0a1c', '#ff4ae0', '#ffe066'],
  };
  const RARITY_GLOW = { COMMON: '#b0c4de', RARE: '#1eff00', SUPER_RARE: '#3a8aff', ULTRA_RARE: '#af40ff', LEGENDARY: '#ff8000', GODLY: '#00ffff', DARK_MATTER: '#ff00ff' };

  /** A design: a list of facets [shade, x1, y1, x2, y2, ...] (shade 0 light, 1 mid, 2 shadow, 3 accent). */
  const crane = (ox = 0, oy = 0, s = 1) => [
    [2, 30, 72, 60, 60, 52, 84], // tail side
    [1, 52, 84, 60, 60, 74, 84],
    [0, 60, 60, 46, 22, 66, 64], // near wing
    [1, 60, 60, 66, 64, 82, 30], // far wing
    [2, 74, 84, 66, 64, 92, 46], // neck
    [0, 92, 46, 98, 40, 104, 50], // head
    [1, 30, 72, 14, 60, 36, 70], // tail tip
    [0, 46, 92, 60, 60, 74, 84],
  ].map((f) => [f[0], ...f.slice(1).map((v, i) => (i % 2 ? oy + v * s : ox + v * s))]);
  const D = {
    paper_crane: () => crane(),
    fold_fox: () => [
      [1, 22, 70, 40, 60, 34, 84], [2, 22, 70, 14, 56, 30, 64], // tail
      [0, 34, 84, 40, 60, 72, 62], [1, 34, 84, 72, 62, 70, 90], // body
      [2, 40, 90, 46, 104, 52, 90], [2, 62, 90, 66, 104, 72, 90], // legs
      [0, 72, 62, 70, 90, 84, 74], // chest
      [1, 72, 62, 80, 34, 88, 56], [2, 80, 34, 84, 46, 88, 56], // ear
      [0, 72, 62, 88, 56, 104, 70], [3, 88, 66, 104, 70, 92, 74], // head and muzzle
      [3, 22, 70, 14, 56, 18, 66], // tail tip
    ],
    origami_frog: () => [
      [1, 26, 100, 40, 76, 50, 100], [1, 70, 100, 80, 76, 94, 100], // back legs
      [0, 30, 86, 60, 52, 90, 86], [1, 30, 86, 90, 86, 60, 100], // body
      [2, 38, 100, 46, 92, 52, 102], [2, 68, 102, 74, 92, 82, 100], // front feet
      [0, 42, 60, 50, 44, 58, 58], [0, 62, 58, 70, 44, 78, 60], // eye bumps
      [3, 50, 82, 60, 88, 70, 82],
    ],
    origami_turtle: () => [
      [2, 30, 98, 36, 88, 44, 100], [2, 74, 100, 82, 88, 88, 98], // legs
      [1, 24, 86, 40, 56, 60, 50], [0, 60, 50, 80, 56, 96, 86], [1, 24, 86, 60, 50, 60, 92], [0, 60, 50, 96, 86, 60, 92], // shell
      [3, 44, 70, 60, 58, 76, 70], [3, 44, 70, 60, 82, 76, 70], // shell plate
      [0, 96, 80, 112, 72, 108, 88], // head
      [1, 18, 88, 24, 86, 26, 92], // tail
    ],
    kite_ray: () => [
      [0, 60, 30, 100, 64, 60, 72], [1, 60, 30, 60, 72, 20, 64], // wings
      [2, 60, 72, 100, 64, 60, 90], [1, 60, 72, 60, 90, 20, 64],
      [3, 52, 58, 60, 50, 68, 58],
      [3, 58, 90, 62, 90, 52, 112], // tail string
    ],
    paper_tiger: () => [
      [1, 18, 70, 30, 62, 28, 80], // tail
      [0, 28, 80, 36, 60, 74, 60], [1, 28, 80, 74, 60, 72, 88], // body
      [3, 40, 62, 46, 60, 42, 76], [3, 52, 60, 58, 60, 54, 78], [3, 62, 60, 68, 60, 64, 80], // stripes
      [2, 34, 88, 40, 104, 46, 88], [2, 62, 88, 66, 104, 72, 88],
      [0, 72, 56, 96, 52, 102, 72], [1, 72, 56, 102, 72, 80, 82], // head
      [2, 76, 52, 80, 40, 86, 52], [2, 88, 52, 94, 40, 96, 54], // ears
      [3, 92, 68, 104, 70, 96, 76], // jaw
    ],
    lantern_koi: () => [
      [1, 18, 52, 34, 68, 18, 84], // tail
      [0, 34, 68, 62, 46, 92, 64], [1, 34, 68, 92, 64, 62, 88], // body
      [3, 50, 54, 62, 46, 66, 60], [3, 48, 82, 62, 88, 66, 76], // paper bands
      [2, 62, 46, 70, 32, 76, 52], [2, 60, 88, 68, 100, 74, 82], // fins
      [0, 92, 64, 106, 66, 92, 72],
    ],
    folded_stag: () => [
      [1, 24, 62, 30, 56, 32, 70], // tail
      [0, 30, 72, 40, 56, 76, 58], [1, 30, 72, 76, 58, 74, 82], // body
      [2, 34, 82, 38, 104, 44, 82], [2, 66, 82, 70, 104, 76, 82],
      [0, 74, 58, 84, 38, 92, 54], [1, 84, 38, 102, 46, 92, 54], // neck, head
      [3, 84, 38, 80, 18, 86, 30], [3, 86, 30, 76, 24, 82, 34], [3, 90, 40, 100, 20, 96, 36], [3, 96, 36, 108, 28, 100, 42], // antlers
    ],
    paper_bat: () => [
      [1, 60, 60, 14, 40, 26, 58], [2, 26, 58, 14, 40, 18, 72], [1, 26, 58, 18, 72, 60, 70], // left wing
      [0, 60, 60, 106, 40, 94, 58], [1, 94, 58, 106, 40, 102, 72], [0, 94, 58, 102, 72, 60, 70], // right wing
      [0, 50, 52, 60, 48, 70, 52], [1, 50, 52, 60, 84, 70, 52], // body
      [2, 50, 52, 52, 40, 58, 50], [2, 62, 50, 68, 40, 70, 52], // ears
    ],
    scroll_serpent: () => [
      [1, 14, 92, 30, 86, 30, 100], [0, 30, 86, 48, 74, 48, 92], [1, 48, 74, 64, 76, 60, 92],
      [0, 60, 92, 64, 76, 80, 64], [1, 80, 64, 92, 54, 96, 70], [3, 28, 88, 30, 98, 44, 92], [3, 62, 82, 66, 90, 74, 78],
      [0, 92, 54, 110, 52, 100, 66], [2, 96, 70, 100, 66, 110, 52],
    ],
    paper_owl: () => [
      [1, 34, 96, 40, 52, 60, 46], [0, 60, 46, 80, 52, 86, 96], [1, 34, 96, 60, 46, 60, 100], [0, 60, 46, 86, 96, 60, 100], // body
      [2, 40, 52, 42, 36, 52, 48], [2, 68, 48, 78, 36, 80, 52], // ear tufts
      [3, 44, 56, 60, 52, 52, 68], [3, 60, 52, 76, 56, 68, 68], // eye discs
      [2, 56, 66, 64, 66, 60, 74], // beak
      [2, 46, 100, 50, 106, 54, 100], [2, 66, 100, 70, 106, 74, 100],
    ],
    origami_dragon: () => [
      [1, 10, 84, 24, 78, 26, 92], // tail tip
      [0, 26, 92, 44, 70, 64, 72], [1, 26, 92, 64, 72, 64, 94], // body
      [0, 44, 70, 34, 26, 60, 62], [1, 60, 62, 66, 22, 76, 64], [2, 44, 70, 60, 62, 52, 52], // wings
      [2, 34, 94, 38, 106, 46, 94], [2, 56, 94, 60, 106, 66, 94],
      [0, 64, 72, 84, 52, 92, 70], [1, 64, 72, 92, 70, 64, 94], // neck
      [0, 84, 52, 108, 54, 98, 66], [3, 86, 50, 90, 38, 94, 52], [3, 94, 52, 100, 42, 100, 54], // head, horns
    ],
    fold_phoenix: () => [
      [3, 10, 70, 32, 70, 22, 86], [2, 14, 88, 34, 78, 30, 100], [3, 20, 56, 36, 64, 22, 70], // tail flames
      [0, 34, 74, 58, 60, 72, 74], [1, 34, 74, 72, 74, 56, 90], // body
      [0, 58, 60, 36, 18, 70, 54], [1, 58, 60, 70, 54, 90, 22], // wings
      [2, 72, 74, 84, 54, 92, 66], [0, 84, 54, 104, 56, 94, 68], [3, 84, 54, 86, 44, 92, 52], // neck, head, crest
    ],
    thousand_cranes: () => [...crane(-18, 18, 0.55), ...crane(40, 0, 0.55), ...crane(6, -10, 0.7), ...crane(30, 40, 0.5)],
    // The Paper Kirin: black paper edged in Dark Matter pink, a deer-dragon with a flame tail,
    // a mane of points and two swept horns.
    paper_kirin: () => [
      [3, 6, 50, 22, 62, 14, 70], [3, 4, 72, 24, 66, 16, 84], [1, 14, 70, 26, 60, 28, 76], // flame tail
      [0, 26, 78, 38, 58, 70, 56], [1, 26, 78, 70, 56, 72, 84], [2, 30, 84, 48, 84, 40, 74], // body
      [3, 40, 58, 46, 46, 52, 58], [3, 52, 58, 58, 44, 64, 57], // back spines
      [2, 32, 84, 30, 104, 38, 104], [1, 44, 84, 46, 104, 52, 104], [2, 60, 84, 62, 104, 68, 104], [1, 68, 82, 74, 104, 80, 102], // legs
      [0, 70, 56, 84, 36, 90, 52], [1, 70, 56, 90, 52, 76, 70], // neck
      [3, 74, 50, 70, 34, 80, 42], [3, 80, 42, 76, 26, 86, 36], [3, 86, 36, 86, 22, 92, 34], // mane
      [0, 84, 36, 104, 40, 108, 50], [1, 84, 36, 108, 50, 92, 54], [2, 98, 50, 112, 54, 104, 58], // head and jaw
      [3, 92, 36, 96, 14, 98, 34], [3, 98, 36, 108, 18, 102, 38], // horns
    ],
  };

  function drawDesign(ctx, id, locked) {
    const pal = PAPER[id] || PAPER.paper_crane;
    const facets = (D[id] || D.paper_crane)();
    ctx.lineJoin = 'round';
    for (const f of facets) {
      const col = locked ? ['#3a3450', '#2e2a42', '#242036', '#2e2a42'][f[0]] : pal[f[0]];
      ctx.beginPath();
      ctx.moveTo(f[1], f[2]);
      for (let i = 3; i < f.length; i += 2) ctx.lineTo(f[i], f[i + 1]);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      // Creases: a fine dark line round every facet.
      ctx.strokeStyle = locked ? '#1a1628' : id === 'paper_kirin' ? 'rgba(255,90,230,0.85)' : 'rgba(40,30,30,0.55)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    if (!locked) {
      // An eye on the head (the right-most high point of the design), and a highlight crease.
      const eyes = { paper_crane: [96, 45], fold_fox: [90, 62], origami_frog: [[50, 52], [70, 52]], origami_turtle: [106, 78], kite_ray: [[56, 58], [64, 58]], paper_tiger: [[86, 62], [94, 62]], lantern_koi: [96, 64], folded_stag: [94, 48], paper_bat: [[56, 56], [64, 56]], scroll_serpent: [102, 56], paper_owl: [[52, 59], [68, 59]], origami_dragon: [98, 58], fold_phoenix: [96, 60], thousand_cranes: [], paper_kirin: [98, 44] };
      const list = eyes[id] || [];
      const pts = Array.isArray(list[0]) ? list : list.length ? [list] : [];
      for (const [x, y] of pts) {
        ctx.fillStyle = pal[4];
        ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(x - 0.7, y - 0.8, 0.8, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  const cache = new Map();
  /** The legend's picture at `px` square (with its rarity's glow), or its silhouette while locked. */
  function picture(id, px = 160, locked = false) {
    const key = `${id}|${px}|${locked}`;
    if (cache.has(key)) return Promise.resolve(cache.get(key));
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    const k = px / 150;
    g.scale(k, k);
    g.translate(15, 15);
    const l = BATTLE_DATA.LEGENDS[id];
    if (!locked) {
      // The ground shadow, then the paper with its rarity's colour glowing off the outline.
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.beginPath(); g.ellipse(60, 106, 30, 6, 0, 0, Math.PI * 2); g.fill();
      g.shadowColor = RARITY_GLOW[(l && l.rarity) || 'RARE'];
      g.shadowBlur = 14;
      drawDesign(g, id, false);
      g.shadowBlur = 0;
    }
    drawDesign(g, id, locked);
    const url = c.toDataURL();
    cache.set(key, url);
    return Promise.resolve(url);
  }

  return { picture, PAPER };
})();
