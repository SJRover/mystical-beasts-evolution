/**
 * Merge Beasts battle mode (1.4): the Folded Legends' look. Paper characters made of flat folded
 * facets, light, mid and shadow, like real origami, nothing like the meadow's round beasts nor the
 * enemies. Sam (18 Nov): "so they actually look like origami characters, like they're supposed to
 * be someone or something, not just folded paper". So each one is a character with a face, an
 * outfit and a prop, all folded from paper of its own colours:
 *
 *   Paper Crane, the courier (red cap, sash and a sealed letter in its beak)
 *   Fold Fox, the scout (a blue scarf streaming behind as it runs)
 *   Origami Frog, the samurai (helmet with a gold crest, a little sword)
 *   Origami Turtle, the old sage (straw hat, long beard, a bundle on its shell)
 *   Kite Ray, the sky pilot (goggles, a red scarf, a kite tail with bows)
 *   Paper Tiger, the brawler (red headband, a roar with fangs)
 *   Lantern Koi, the lantern bearer (a glowing paper lantern on a stick)
 *   Folded Stag, the shrine guardian (sacred rope and paper streamers round its neck)
 *   Paper Bat, the night count (a cape lined red, a high collar, a bow tie and fangs)
 *   Scroll Serpent, the scholar (its body a written scroll, a scholar's hat, a brush)
 *   Paper Owl, the professor (spectacles, a mortarboard, a book)
 *   Origami Dragon, the warlord (gold horns, wings, a breath of fire)
 *   Fold Phoenix, the firebird (wings of flame, a crest)
 *   The Thousand Cranes, the crane queen (a crown, her flock and strings of cranes)
 *   The Paper Kirin, the dark sovereign (black paper edged pink, a mane of flame, a brow gem,
 *   walking on clouds)
 *
 * Each is drawn once into a picture (with its rarity's glow round the outline) for the
 * Beastopedia, the deck and the battle. Designs are in a 120 by 120 box facing right, feet on y 104.
 *
 * LEGEND_ART.picture(id, px, locked) gives a data URL (a promise, like ART.picture).
 */
const LEGEND_ART = (() => {
  // Papers: [light, mid, shadow, accent, eye, second, third, fourth].
  const PAPER = {
    paper_crane: ['#fdfaf0', '#e8e2d0', '#c8c0aa', '#e8433a', '#1a1a22', '#fff2c8', '#ffd43b', '#9a2a22'],
    fold_fox: ['#ffb066', '#f08a3a', '#c4602a', '#fff4e4', '#1a1a22', '#3a7aff', '#2448b0', '#ffe066'],
    origami_frog: ['#9ee07a', '#6cc254', '#4a9a3c', '#f4ffe8', '#1a1a22', '#3a3a5a', '#ffd43b', '#dfe6f0'],
    origami_turtle: ['#c8e8a0', '#8cc070', '#5a9050', '#a87a48', '#1a1a22', '#c8985a', '#e8cc78', '#ffffff'],
    kite_ray: ['#9ad8ff', '#5ab0f0', '#3a80c8', '#ffd84a', '#1a1a22', '#ff5a5a', '#8a5a2a', '#d8f4ff'],
    paper_tiger: ['#ffc85a', '#f0a030', '#c07818', '#2a2018', '#1a1a22', '#e8433a', '#fff4e0', '#7a1a14'],
    lantern_koi: ['#ffffff', '#f0e8e0', '#d4c8bc', '#f0503a', '#1a1a22', '#ffcc4a', '#e8433a', '#fff2a0'],
    folded_stag: ['#e8c89a', '#c8a070', '#9a7448', '#f4ece0', '#1a1a22', '#d8b070', '#ffffff', '#c8302a'],
    paper_bat: ['#8a7ab0', '#5e4e88', '#3e3060', '#d8304a', '#ffe066', '#1a1428', '#ffffff', '#ffd43b'],
    scroll_serpent: ['#f4e8c8', '#dcc89a', '#b49a68', '#3a5ab0', '#1a1a22', '#8a5a2a', '#1a1a22', '#d8302a'],
    paper_owl: ['#e8d8b8', '#c8b088', '#9a8058', '#f6ecd6', '#1a1a22', '#22223a', '#ff6a3a', '#3a6ad0'],
    origami_dragon: ['#ff7a5a', '#e04a3a', '#a82a2a', '#ffd84a', '#ffe066', '#ffc8a0', '#ffb030', '#6a1414'],
    fold_phoenix: ['#ffd84a', '#ff9a3a', '#e05a2a', '#ff3a3a', '#1a1a22', '#fff2a0', '#ff6a1a', '#c02010'],
    thousand_cranes: ['#ffd0ff', '#e080f0', '#a040c0', '#40e0ff', '#1a1a22', '#ffd43b', '#7af0a0', '#ff8a5a'],
    paper_kirin: ['#2a2440', '#1a1630', '#0e0a1c', '#ff4ae0', '#ffe066', '#40e0ff', '#e8e0ff', '#ffd43b'],
  };
  const RARITY_GLOW = { COMMON: '#b0c4de', RARE: '#1eff00', SUPER_RARE: '#3a8aff', ULTRA_RARE: '#af40ff', LEGENDARY: '#ff8000', GODLY: '#00ffff', DARK_MATTER: '#ff00ff' };

  // The parts a design is made of. A paper is a number (0 light, 1 mid, 2 shadow, 3 to 7 the
  // legend's other papers) or a colour.
  /** A flat folded facet. */
  const P = (s, ...pts) => ({ k: 'P', s, pts });
  /** A facet printed with a pattern (dots, waves, scales, stripes, text). */
  const Pp = (s, pat, ...pts) => ({ k: 'P', s, pts, pat });
  /** A soft-edged piece (scarves, flames, clouds): the points smoothed into curves. */
  const S = (s, ...pts) => ({ k: 'S', s, pts });
  /** A line (legs, strings, whiskers, stitched folds). */
  const L = (s, w, ...pts) => ({ k: 'L', s, w, pts });
  /** A round piece (lenses, seals, gems, puffs); `ring` an outline paper instead of a fill. */
  const C = (s, x, y, r, ring) => ({ k: 'C', s, x, y, r, ring });
  /** An eye with a brow: mood fierce, sly, wise, calm, happy or sleepy; side 0 for a face in
   *  profile, -1 or 1 for the left or right eye of a face looking out. */
  const E = (x, y, r, mood = 'calm', side = 0) => ({ k: 'E', x, y, r, mood, side });
  /** A glow behind a piece (the lantern, the gem, the fire). */
  const G = (col, x, y, r) => ({ k: 'G', col, x, y, r });

  const move = (parts, ox, oy, s, papers) => parts.map((p) => {
    const q = { ...p };
    if (papers && typeof q.s === 'number' && papers[q.s] != null) q.s = papers[q.s];
    if (q.pts) q.pts = q.pts.map((v, i) => (i % 2 ? oy + v * s : ox + v * s));
    if (q.x != null) { q.x = ox + q.x * s; q.y = oy + q.y * s; q.r *= s; }
    if (q.w != null) q.w *= s;
    return q;
  });

  /** A plain crane facing right (for the Thousand Cranes' flock). */
  const crane = () => [
    P(1, 12, 54, 48, 68, 42, 80), P(2, 12, 54, 42, 80, 34, 78), // tail
    P(1, 58, 66, 74, 64, 90, 16), P(2, 58, 66, 90, 16, 68, 44), // far wing
    P(0, 44, 70, 62, 62, 76, 72, 60, 78), P(1, 44, 70, 60, 78, 76, 72, 66, 88, 50, 86), // body
    P(0, 46, 68, 62, 64, 34, 14), P(1, 46, 68, 34, 14, 32, 42), // near wing
    P(1, 70, 72, 76, 70, 96, 32), P(2, 72, 76, 78, 72, 96, 32), // neck
    P(0, 92, 34, 98, 26, 104, 34), P(1, 98, 26, 112, 42, 104, 34), // head
  ];

  const D = {
    // The courier: a white crane in a red cap and sash with a sealed letter in its beak.
    paper_crane: () => [
      L('#8a6a4a', 2.4, 55, 84, 53, 103), L('#8a6a4a', 2.4, 63, 84, 66, 103),
      P('#8a6a4a', 46, 104, 53, 100, 58, 104), P('#8a6a4a', 60, 104, 66, 100, 72, 104),
      ...crane(),
      P(3, 64, 64, 71, 66, 52, 88, 45, 84), P(7, 64, 64, 71, 66, 69, 68, 63, 66), // sash
      P(3, 92, 27, 94, 17, 104, 17, 105, 26), P(6, 92, 23, 105, 22, 105, 25, 92, 26), P(7, 104, 26, 112, 28, 104, 29), // cap
      P(5, 106, 38, 119, 35, 122, 46, 109, 49), L('#c8b080', 0.8, 106, 38, 114, 43, 119, 35), C(3, 114, 43, 2.6), // letter
      E(99, 31, 2.3, 'calm'),
    ],
    // The scout: a fox at full stretch, a blue scarf streaming behind.
    fold_fox: () => [
      S(6, 74, 58, 58, 46, 40, 50, 24, 40, 34, 54, 56, 58), S(5, 76, 60, 62, 54, 46, 62, 30, 58, 44, 68, 62, 64), // scarf ends
      P(1, 34, 66, 10, 44, 20, 70), P(2, 34, 66, 20, 70, 30, 76), P(3, 10, 44, 18, 42, 19, 54), // tail
      P(2, 38, 78, 16, 90, 22, 96, 44, 84), P(1, 44, 80, 30, 98, 38, 100, 52, 86), // back legs
      P(0, 34, 66, 74, 58, 80, 74, 44, 84), P(1, 44, 84, 80, 74, 70, 88), // body
      P(2, 72, 78, 92, 92, 88, 96, 66, 84), P(1, 70, 80, 98, 86, 96, 92, 68, 88), // front legs
      P(3, 74, 60, 84, 64, 80, 78), // chest
      P(2, 82, 48, 88, 28, 94, 46), P(1, 76, 50, 76, 26, 87, 46), P('#ffe0c8', 79, 46, 79, 33, 85, 45), // ears
      P(0, 74, 58, 78, 46, 96, 48, 100, 58), P(1, 96, 48, 113, 60, 100, 58), P(3, 84, 64, 100, 58, 113, 60, 98, 67), // head
      C(4, 113, 60, 1.9),
      Pp(5, 'dots', 72, 56, 82, 50, 87, 62, 78, 68), // the scarf round its neck
      E(92, 52, 2.3, 'sly'),
    ],
    // The samurai: a frog in a dark helmet with a gold crest, a little sword held up.
    origami_frog: () => [
      P(1, 28, 100, 32, 72, 58, 84, 54, 100), P(2, 24, 104, 56, 104, 50, 97, 30, 97), // haunch, foot
      P(0, 38, 92, 44, 56, 76, 54, 82, 92), P(1, 38, 92, 60, 102, 82, 92), // body
      P(3, 54, 62, 72, 60, 76, 90, 58, 95), L(2, 0.8, 56, 72, 74, 70), L(2, 0.8, 57, 82, 75, 80), // belly
      L('#2a1a10', 3.6, 88, 77, 78, 88), P(6, 81, 81, 90, 71, 93, 74, 84, 84), L(7, 3.2, 90, 73, 114, 40), P(7, 112, 38, 117, 34, 115, 42), // sword
      P(1, 66, 70, 84, 72, 84, 80, 66, 79), C(0, 87, 76, 4.4), // arm and hand
      P(0, 40, 58, 44, 42, 86, 42, 92, 56, 78, 63), L(4, 1.5, 62, 58, 88, 53), // head and mouth
      C(3, 60, 48, 6.2), C(3, 79, 48, 6.2), E(60, 48, 3.3, 'fierce', -1), E(79, 48, 3.3, 'fierce', 1),
      P(5, 44, 40, 50, 25, 80, 25, 86, 40), P(5, 36, 42, 46, 35, 84, 35, 94, 42, 88, 45, 42, 45), // helmet
      L('#8a8ab0', 0.9, 50, 30, 80, 30), C(6, 65, 31, 3.2),
      S(6, 50, 28, 40, 8, 54, 20, 65, 24, 76, 20, 90, 8, 80, 28, 65, 31), C(6, 65, 27, 3), // crest
    ],
    // The old sage: a turtle in a straw hat with a long beard and a bundle on its shell.
    origami_turtle: () => [
      P(1, 10, 90, 20, 87, 22, 94), // tail
      P(2, 26, 90, 38, 90, 36, 104, 24, 104), P(1, 34, 92, 46, 92, 46, 104, 34, 104), // back legs
      P(2, 76, 90, 88, 90, 90, 104, 78, 104), P(1, 84, 92, 96, 90, 100, 104, 88, 104), // front legs
      P(2, 16, 92, 102, 92, 98, 99, 20, 99), // shell rim
      P(3, 18, 92, 30, 62, 60, 52, 90, 62, 102, 92), // shell
      P(5, 34, 88, 38, 70, 54, 66, 56, 88), P(5, 62, 88, 62, 66, 78, 70, 84, 88), P(5, 42, 66, 60, 56, 76, 64, 60, 64), // plates
      L(2, 0.9, 30, 78, 92, 78),
      P('#8a4ab0', 46, 58, 52, 44, 70, 44, 76, 58), C('#b070d8', 61, 44, 4.2), Pp('#8a4ab0', 'dots', 46, 58, 52, 44, 70, 44, 76, 58), // bundle
      P(1, 92, 82, 98, 70, 108, 72, 106, 88), // neck
      P(0, 98, 70, 104, 60, 117, 64, 118, 74, 106, 79), // head
      P(7, 104, 77, 116, 76, 112, 96, 108, 88), L('#d8d8d8', 0.8, 108, 79, 111, 92), // beard
      P(6, 90, 63, 106, 46, 122, 63), L('#b89a48', 1, 98, 55, 114, 55), P('#c8aa58', 90, 63, 122, 63, 116, 65, 96, 65), // hat
      E(111, 68, 2.1, 'sleepy'), L(7, 1.6, 107, 64, 114, 64),
    ],
    // The sky pilot: a ray kite with goggles up on its brow, a red scarf and a tail of bows.
    kite_ray: () => [
      L('#5a4a7a', 1.4, 60, 84, 55, 94, 63, 104, 57, 116),
      P(5, 52, 90, 58, 93, 52, 96), P(5, 64, 90, 58, 93, 64, 96), P(5, 51, 104, 57, 107, 51, 110), P(5, 63, 104, 57, 107, 63, 110),
      P(0, 60, 26, 104, 58, 60, 66), P(1, 60, 26, 60, 66, 16, 58), P(2, 60, 66, 104, 58, 60, 86), P(1, 60, 66, 60, 86, 16, 58), // wings
      P(3, 64, 34, 94, 55, 90, 57, 64, 40), P(3, 56, 34, 26, 55, 30, 57, 56, 40), // stripes
      L(2, 0.8, 60, 26, 60, 86),
      S(1, 50, 32, 48, 20, 56, 22, 60, 30), S(1, 70, 32, 72, 20, 64, 22, 60, 30), // head fins, curled in
      L(5, 2.2, 104, 58, 112, 66, 106, 74, 114, 82), L(5, 2.2, 16, 58, 8, 66, 14, 74, 6, 82), // wingtip ribbons
      P(5, 109, 62, 115, 60, 113, 66), P(5, 11, 62, 5, 60, 7, 66),
      E(52, 50, 2.6, 'happy', -1), E(68, 50, 2.6, 'happy', 1), L(4, 1.4, 54, 58, 60, 61, 66, 58),
      L(6, 3, 42, 39, 78, 39), C(7, 53, 38, 5.2), C(6, 53, 38, 5.2, true), C(7, 67, 38, 5.2), C(6, 67, 38, 5.2, true), // goggles
      C('#ffffff', 51, 36, 1.4), C('#ffffff', 65, 36, 1.4),
    ],
    // The brawler: a tiger crouched to spring, roaring, a red headband with its ends flying.
    paper_tiger: () => [
      S(1, 26, 66, 12, 52, 14, 38, 22, 46, 22, 58, 32, 62), P(3, 14, 44, 20, 44, 18, 50), // tail
      P(2, 28, 72, 40, 66, 44, 90, 38, 104, 28, 104, 32, 88), // far back leg
      P(1, 30, 66, 52, 60, 50, 86, 40, 92), // haunch
      P(0, 30, 64, 50, 54, 80, 58, 76, 80, 48, 84), P(1, 48, 84, 76, 80, 70, 90, 50, 90), // body
      P(3, 42, 57, 48, 55, 44, 70), P(3, 55, 55, 61, 55, 57, 72), P(3, 67, 56, 73, 57, 69, 72), P(3, 36, 70, 42, 72, 36, 80), // stripes
      S(5, 82, 50, 70, 46, 58, 50, 46, 44, 52, 54, 66, 54, 80, 55), S(7, 80, 53, 68, 54, 56, 60, 48, 58, 56, 64, 70, 59, 80, 57), // headband ends
      P(2, 68, 78, 80, 78, 84, 104, 72, 104), P(1, 78, 76, 90, 76, 97, 104, 86, 104), // front legs
      P(6, 97, 104, 100, 99, 102, 104), P(6, 91, 104, 94, 99, 96, 104), // claws
      P(1, 84, 44, 83, 31, 93, 40), P(2, 96, 42, 101, 31, 104, 45), // ears
      P(0, 76, 52, 88, 40, 104, 44, 111, 59, 96, 72, 80, 68), // head
      P(3, 89, 42, 92, 49, 95, 42), P(3, 80, 58, 86, 60, 80, 64), // head stripes
      P(6, 96, 56, 113, 56, 108, 64, 94, 64), P(7, 97, 63, 113, 60, 106, 73), // muzzle and open jaw
      P(6, 102, 61, 104, 67, 106, 61), P(6, 107, 62, 109, 66, 110, 61), C(4, 112, 55, 1.8), // fangs, nose
      P(5, 79, 49, 104, 42, 106, 48, 81, 55), // headband
      E(96, 50, 2.5, 'fierce'),
    ],
    // The lantern bearer: a red and white koi holding up a glowing lantern on a stick.
    lantern_koi: () => [
      P(0, 28, 62, 6, 40, 12, 56), P(3, 28, 62, 12, 56, 10, 68), P(1, 28, 62, 10, 68, 6, 86), // tail fin
      L(2, 0.6, 26, 62, 9, 47), L(2, 0.6, 26, 62, 9, 77),
      P(2, 52, 46, 58, 28, 72, 46), // back fin
      P(0, 26, 62, 56, 44, 88, 52, 96, 64, 60, 80), P(1, 26, 62, 60, 80, 96, 64, 84, 76, 50, 82), // body
      Pp(3, 'scales', 38, 52, 56, 44, 66, 46, 52, 62), P(3, 70, 48, 84, 52, 80, 62, 70, 58), P(3, 42, 70, 54, 72, 46, 78), // red patches
      P(1, 62, 74, 56, 94, 74, 80), // side fin
      P(0, 88, 52, 102, 57, 104, 68, 95, 72), P(3, 88, 52, 98, 54, 93, 61), // head
      L('#c08060', 1, 102, 66, 112, 74), L('#c08060', 1, 100, 68, 104, 80), // whiskers
      L('#7a4a20', 2.2, 102, 62, 116, 42), L('#5a3a20', 0.9, 116, 42, 116, 50), // stick and cord
      G('#fff2a0', 116, 64, 22),
      S(5, 108, 50, 124, 50, 127, 64, 123, 79, 109, 79, 105, 64), P(6, 109, 48, 123, 48, 122, 52, 110, 52), P(6, 109, 78, 123, 78, 122, 82, 110, 82),
      L(6, 0.8, 106, 58, 126, 58), L(6, 0.8, 105, 66, 127, 66), L(6, 0.8, 106, 73, 125, 73), // lantern
      L(6, 1, 116, 82, 116, 88), C(6, 116, 89, 1.6),
      E(96, 59, 2.3, 'happy'),
    ],
    // The shrine guardian: a stag with sacred rope and white paper streamers round its neck.
    folded_stag: () => [
      P(3, 24, 62, 31, 57, 30, 70), // tail
      P(2, 34, 82, 40, 82, 40, 104, 34, 104), P(2, 64, 82, 70, 82, 72, 104, 66, 104), // far legs
      P(0, 28, 72, 40, 56, 78, 58, 74, 82, 34, 84), P(1, 34, 84, 74, 82, 70, 88, 38, 88), // body
      P(1, 40, 84, 47, 84, 48, 104, 42, 104), P(1, 70, 82, 77, 82, 80, 104, 74, 104), // near legs
      P(4, 41, 104, 48, 104, 48, 100, 42, 100), P(4, 74, 104, 81, 104, 80, 100, 74, 100), P(4, 33, 104, 40, 104, 40, 101, 34, 101), P(4, 66, 104, 72, 104, 72, 101, 66, 101),
      P(1, 72, 60, 84, 38, 94, 44, 82, 66), // neck
      P(2, 86, 34, 76, 27, 89, 30), // ear
      P(0, 84, 38, 96, 30, 108, 40, 98, 50), P(1, 100, 36, 111, 44, 102, 49), C(4, 110, 43, 1.7), // head
      L(3, 3, 91, 31, 87, 14, 81, 4), L(3, 2.4, 88, 19, 79, 15), L(3, 2.4, 86, 10, 91, 4), // antlers
      L(3, 3, 96, 30, 100, 13, 108, 4), L(3, 2.4, 99, 18, 108, 15), L(3, 2.4, 102, 9, 98, 3),
      S(5, 74, 50, 90, 44, 94, 50, 78, 58), L('#a8803a', 0.9, 80, 49, 82, 55), L('#a8803a', 0.9, 85, 47, 87, 53), L('#a8803a', 0.9, 90, 46, 91, 51), // rope
      P(6, 80, 55, 84, 55, 81, 61, 86, 61, 82, 69, 82, 63, 78, 63), P(6, 89, 52, 93, 52, 90, 58, 95, 58, 91, 66, 91, 60, 87, 60), // streamers
      E(97, 38, 2.1, 'calm'),
    ],
    // The night count: a bat in a cape lined red, high collar, bow tie, a grin with fangs.
    paper_bat: () => [
      P(1, 60, 62, 8, 34, 16, 50, 6, 60, 20, 64, 14, 80, 60, 78), P(1, 60, 62, 112, 34, 104, 50, 114, 60, 100, 64, 106, 80, 60, 78), // cape
      P(3, 56, 64, 18, 44, 24, 54, 16, 62, 27, 67, 22, 76, 56, 74), P(3, 64, 64, 102, 44, 96, 54, 104, 62, 93, 67, 98, 76, 64, 74), // lining
      L(2, 0.9, 60, 62, 16, 50), L(2, 0.9, 60, 62, 104, 50),
      P(2, 54, 86, 56, 94, 58, 86), P(2, 62, 86, 64, 94, 66, 86), // feet
      P(0, 48, 52, 72, 52, 70, 86, 50, 86), // body
      P(5, 52, 52, 60, 58, 68, 52, 66, 86, 54, 86), // waistcoat
      P(3, 53, 60, 60, 63, 53, 66), P(3, 67, 60, 60, 63, 67, 66), C(7, 60, 63, 1.4), // bow tie
      P(5, 42, 54, 48, 36, 56, 52), P(5, 78, 54, 72, 36, 64, 52), // collar
      P(1, 48, 34, 42, 12, 57, 30), P(1, 72, 34, 78, 12, 63, 30), P(3, 48, 30, 45, 18, 53, 29), P(3, 72, 30, 75, 18, 67, 29), // ears
      P(0, 46, 42, 52, 30, 68, 30, 74, 42, 66, 52, 54, 52), P(2, 56, 30, 60, 38, 64, 30), // head
      E(54, 41, 2.7, 'sly', -1), E(66, 41, 2.7, 'sly', 1),
      L(5, 1.4, 54, 46, 60, 49.5, 66, 46), P(6, 56, 47, 57.5, 51.5, 59, 48), P(6, 61, 48, 62.5, 51.5, 64, 47), // grin and fangs
    ],
    // The scholar: a serpent whose body is a written scroll, in a scholar's hat, brush in mouth.
    scroll_serpent: () => [
      P(5, 4, 96, 12, 89, 18, 96, 10, 103), C(5, 6, 98, 3.4), // roller
      Pp(0, 'text', 12, 92, 34, 86, 36, 100, 14, 104), Pp(1, 'text', 34, 86, 56, 84, 56, 100, 36, 100), Pp(0, 'text', 56, 84, 70, 74, 78, 88, 56, 100),
      Pp(1, 'text', 70, 74, 74, 58, 90, 64, 78, 88), P(0, 74, 58, 82, 44, 96, 50, 90, 64), // body and neck
      L(3, 2, 14, 104, 36, 100, 56, 100, 78, 88, 90, 64, 96, 50), L(3, 1.4, 12, 92, 34, 86, 56, 84, 70, 74, 74, 58, 82, 44), // borders
      P(7, 40, 90, 47, 90, 47, 97, 40, 97), // seal
      P(0, 82, 44, 96, 36, 112, 44, 102, 54, 90, 52), P(1, 96, 50, 112, 44, 104, 56), // head
      L(5, 2.4, 104, 50, 120, 60), P(4, 118, 58, 126, 65, 120, 62), // brush
      P(6, 86, 38, 88, 27, 102, 27, 104, 36), L(6, 2.2, 87, 31, 75, 28), L(6, 2.2, 103, 31, 115, 28), P(3, 88, 35, 102, 35, 102, 37, 88, 37), // hat
      E(100, 43, 2.2, 'wise'),
    ],
    // The professor: an owl in spectacles and a mortarboard, a book under its wing.
    paper_owl: () => [
      P(2, 46, 100, 50, 106, 54, 100), P(2, 66, 100, 70, 106, 74, 100), // feet
      P(1, 34, 96, 40, 52, 60, 46, 60, 100), P(0, 60, 46, 80, 52, 86, 96, 60, 100), // body
      L(2, 1, 50, 80, 54, 84, 58, 80), L(2, 1, 62, 80, 66, 84, 70, 80), L(2, 1, 56, 90, 60, 94, 64, 90), // breast marks
      P(2, 34, 58, 24, 88, 38, 94), // wing
      P(7, 68, 72, 92, 66, 96, 88, 72, 94), P('#ffffff', 72, 90, 95, 84, 96, 88, 73, 94), L('#ffd43b', 1, 82, 69, 85, 90), // book
      P(2, 86, 58, 94, 82, 84, 86), // wing over the book
      P(2, 40, 52, 39, 34, 51, 47), P(2, 80, 52, 81, 34, 69, 47), // ear tufts
      P(3, 42, 58, 60, 52, 78, 58, 74, 72, 60, 76, 46, 72), // face
      P(2, 57, 66, 63, 66, 60, 73), // beak
      E(51, 62, 3, 'wise', -1), E(69, 62, 3, 'wise', 1),
      C('rgba(220,240,255,0.25)', 51, 62, 6.5), C(4, 51, 62, 6.5, true), C('rgba(220,240,255,0.25)', 69, 62, 6.5), C(4, 69, 62, 6.5, true), L(4, 1.2, 57, 61, 63, 61),
      P(5, 48, 40, 72, 40, 70, 48, 50, 48), P(5, 38, 35, 60, 28, 84, 35, 60, 42), // mortarboard
      L(6, 1.4, 60, 35, 78, 38, 80, 48), P(6, 78, 48, 82, 48, 80, 55), C(6, 60, 35, 1.6),
    ],
    // The warlord: a red dragon with gold horns, wings spread and a breath of fire.
    origami_dragon: () => [
      S(1, 30, 90, 14, 86, 4, 72, 10, 62, 14, 76, 30, 82), P(3, 4, 64, 12, 60, 8, 70), // tail
      P(2, 50, 62, 64, 12, 84, 40, 68, 64), L(7, 1, 60, 60, 66, 22), L(7, 1, 64, 62, 76, 32), // far wing
      P(0, 40, 64, 26, 12, 50, 28, 58, 58), P(1, 40, 64, 26, 12, 32, 46), L(2, 1, 44, 60, 36, 22), L(2, 1, 50, 58, 44, 26), // near wing
      P(3, 36, 66, 40, 58, 44, 66), P(3, 46, 64, 50, 56, 54, 64), // back spikes
      P(0, 28, 90, 44, 64, 70, 64, 76, 92), // body
      Pp(5, 'stripes', 50, 70, 66, 68, 70, 90, 52, 92), // belly plates
      P(2, 34, 90, 44, 90, 42, 104, 30, 104), P(1, 60, 90, 72, 90, 74, 104, 62, 104), // legs
      P(3, 62, 104, 65, 100, 67, 104), P(3, 68, 104, 71, 100, 74, 104), // claws
      P(1, 66, 66, 78, 46, 88, 50, 76, 74), // neck
      P(0, 78, 42, 96, 38, 110, 46, 104, 56, 86, 56), P(1, 90, 52, 110, 50, 104, 60, 92, 58), // head, jaw
      P(3, 82, 42, 74, 22, 88, 38), P(3, 88, 40, 84, 20, 95, 38), // horns
      L(6, 1.3, 106, 56, 116, 64, 122, 60), L(6, 1.3, 98, 58, 102, 68, 96, 74), // whiskers
      G('#ffb030', 120, 50, 15), P(6, 107, 50, 122, 38, 119, 46, 133, 41, 124, 50, 136, 54, 123, 56, 130, 64, 114, 57), P(3, 109, 51, 120, 44, 118, 49, 127, 49, 117, 54, 123, 58, 112, 55), // fire
      E(97, 46, 2.5, 'fierce'),
    ],
    // The firebird: a phoenix rising, wings of flame, a crest like a crown.
    fold_phoenix: () => [
      // Three long tail plumes sweeping down and back, each ending in an eye of flame.
      S(7, 44, 72, 28, 70, 12, 72, 2, 66, 12, 66, 28, 66), S(3, 46, 74, 30, 84, 14, 96, 2, 94, 12, 88, 28, 78),
      S(6, 48, 78, 36, 94, 22, 108, 8, 110, 20, 100, 36, 86),
      C(5, 5, 68, 3.4), C(3, 5, 68, 1.6), C(5, 5, 93, 3.6), C(7, 5, 93, 1.7), C(5, 11, 108, 3.6), C(3, 11, 108, 1.7),
      P(1, 56, 60, 44, 6, 38, 18, 30, 10, 30, 26, 20, 22, 26, 40, 16, 40, 40, 62), // far wing
      P(3, 44, 6, 40, 16, 38, 18), P(3, 30, 10, 31, 22, 30, 26), P(3, 20, 22, 25, 34, 26, 40),
      P(0, 46, 76, 58, 58, 72, 58, 70, 78), P(5, 55, 64, 68, 62, 67, 76, 57, 76), // body
      P(0, 62, 60, 70, 4, 78, 16, 86, 8, 88, 24, 98, 18, 94, 36, 106, 34, 82, 62), // near wing
      P(1, 62, 60, 70, 4, 72, 40), P(6, 70, 4, 76, 14, 78, 16), P(6, 86, 8, 87, 20, 88, 24), P(6, 98, 18, 95, 30, 94, 36), P(6, 106, 34, 96, 40, 94, 36),
      P(1, 70, 58, 80, 36, 86, 38, 78, 62), // neck
      P(0, 78, 34, 88, 28, 98, 34, 88, 40), P('#ffe680', 96, 32, 106, 35, 96, 37), // head, beak
      L(3, 1.2, 84, 30, 78, 14), L(3, 1.2, 87, 29, 88, 10), L(3, 1.2, 90, 30, 98, 14), // crest
      C(3, 78, 13, 2.6), C(6, 88, 9, 2.8), C(3, 98, 13, 2.6),
      E(89, 33, 2.1, 'fierce'),
    ],
    // The crane queen: a crowned crane among her flock, and strings of a thousand cranes.
    thousand_cranes: () => [
      L('#ffe8a0', 0.8, 10, 0, 10, 100), L('#ffe8a0', 0.8, 112, 0, 112, 96),
      ...[0, 1, 2, 3].flatMap((i) => move(crane(), 0, 8 + i * 24, 0.2, ['#7af0ff', '#40c0e0', '#2090b0'])),
      ...[0, 1, 2, 3].flatMap((i) => move(crane(), 102, 4 + i * 23, 0.2, ['#ffe066', '#ffc030', '#d09010'])),
      ...move(crane(), 14, 2, 0.32, ['#9af0b0', '#60d080', '#40a060']),
      ...move(crane(), 78, 64, 0.3, ['#ffb08a', '#ff8a5a', '#d06030']),
      ...move(crane(), 70, 4, 0.26, ['#c8b0ff', '#a080f0', '#7050c0']),
      ...move(crane(), 18, 24, 0.75, null),
      P(5, 85, 44, 85, 35, 89, 40, 92, 32, 95, 40, 99, 35, 99, 44), C(3, 92, 41, 1.4), // crown
      L(5, 1.2, 50, 80, 54, 92), L(5, 1.2, 56, 80, 62, 90), // ribbons
      E(92.5, 47.5, 2, 'calm'),
    ],
    // The dark sovereign: a kirin of black paper edged pink, a mane of flame, a gem on its brow,
    // walking on clouds.
    paper_kirin: () => [
      S(3, 24, 66, 8, 52, 12, 64, 2, 68, 14, 74, 6, 86, 26, 78), // flame tail
      S(6, 22, 104, 30, 98, 40, 100, 46, 104), S(6, 54, 104, 62, 98, 72, 100, 80, 104), // clouds
      P(2, 32, 84, 30, 102, 38, 102), P(2, 60, 84, 62, 102, 68, 102), // far legs
      Pp(0, 'waves', 26, 78, 38, 58, 70, 56, 72, 84, 30, 86), P(1, 30, 86, 72, 84, 66, 90, 36, 90), // body
      P(3, 40, 58, 46, 46, 52, 58), P(3, 52, 58, 58, 44, 64, 57), // back spines
      P(1, 44, 86, 46, 102, 52, 102), P(1, 68, 82, 74, 102, 80, 100), // near legs
      P(7, 45, 102, 53, 102, 52, 99, 46, 99), P(7, 73, 102, 81, 100, 80, 97, 74, 98), // gold hooves
      P(1, 70, 56, 84, 36, 90, 52, 76, 70), // neck
      S(3, 72, 52, 66, 36, 76, 40, 76, 24, 86, 34, 90, 22, 92, 36), // flame mane
      P(0, 84, 36, 104, 40, 108, 50, 92, 54), P(2, 96, 50, 112, 54, 104, 58), // head and jaw
      P(3, 92, 37, 95, 13, 99, 35), P(3, 98, 37, 108, 17, 102, 39), // horns
      L(3, 1.2, 108, 54, 118, 60, 122, 56), // whisker
      G('#40e0ff', 96, 38, 7), C(5, 96, 38, 2.4), // brow gem
      E(100, 45, 2.3, 'fierce'),
    ],
  };

  /** A paper's colour: a number from the legend's papers, else the colour given. */
  const paper = (pal, s) => (typeof s === 'number' ? pal[s] : s);
  const SIL = ['#3a3450', '#2e2a42', '#242036', '#2e2a42', '#242036', '#2e2a42', '#2e2a42', '#2e2a42'];
  const silOf = (s) => (typeof s === 'number' ? SIL[s] : '#2e2a42');

  function tracePoly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
  }
  function traceSmooth(ctx, pts) {
    const n = pts.length / 2;
    const mid = (i) => [(pts[(i % n) * 2] + pts[((i + 1) % n) * 2]) / 2, (pts[(i % n) * 2 + 1] + pts[((i + 1) % n) * 2 + 1]) / 2];
    ctx.beginPath();
    const m0 = mid(n - 1);
    ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const m = mid(i); ctx.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], m[0], m[1]); }
    ctx.closePath();
  }
  function bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
    return { x0, y0, x1, y1 };
  }

  /** A print on a facet: polka dots, waves, scales, stripes or lines of writing. */
  function printOn(ctx, pat, b, col) {
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 0.8;
    if (pat === 'dots') for (let y = b.y0; y < b.y1; y += 4.5) for (let x = b.x0 + ((y / 4.5) % 2) * 2.2; x < b.x1; x += 4.5) { ctx.beginPath(); ctx.arc(x, y, 0.9, 0, Math.PI * 2); ctx.fill(); }
    else if (pat === 'waves') for (let y = b.y0 + 4; y < b.y1 + 6; y += 5) for (let x = b.x0 + ((y / 5) % 2) * 3; x < b.x1 + 6; x += 6) { ctx.beginPath(); ctx.arc(x, y, 3, Math.PI, Math.PI * 2); ctx.stroke(); }
    else if (pat === 'scales') for (let y = b.y0; y < b.y1 + 4; y += 3.5) for (let x = b.x0 + ((y / 3.5) % 2) * 2; x < b.x1 + 4; x += 4) { ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI); ctx.stroke(); }
    else if (pat === 'stripes') for (let y = b.y0 + 3; y < b.y1; y += 4) { ctx.beginPath(); ctx.moveTo(b.x0, y); ctx.lineTo(b.x1, y - 1); ctx.stroke(); }
    else if (pat === 'text') {
      // Brush writing in short strokes, in columns.
      ctx.lineWidth = 1; ctx.lineCap = 'round';
      let k = 0;
      for (let x = b.x0 + 3; x < b.x1 - 1; x += 4.5) for (let y = b.y0 + 3; y < b.y1 - 2; y += 5) {
        k++;
        ctx.beginPath();
        if (k % 3 === 0) { ctx.moveTo(x - 1.4, y); ctx.lineTo(x + 1.4, y); ctx.moveTo(x, y - 1.6); ctx.lineTo(x, y + 1.6); }
        else if (k % 3 === 1) { ctx.moveTo(x - 1.5, y - 1); ctx.lineTo(x + 1.5, y - 1.3); ctx.moveTo(x - 1, y + 1.2); ctx.lineTo(x + 1.2, y + 1); }
        else { ctx.moveTo(x - 1.2, y - 1.4); ctx.lineTo(x + 1, y + 1.5); }
        ctx.stroke();
      }
    }
  }

  function drawEye(ctx, p, col) {
    const { x, y, r, mood, side } = p;
    const flip = side === 1 ? -1 : 1;
    ctx.lineCap = 'round';
    if (mood === 'happy') {
      ctx.strokeStyle = col; ctx.lineWidth = r * 0.75;
      ctx.beginPath(); ctx.arc(x, y + r * 0.4, r * 0.95, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      return;
    }
    // A white rim round the eye so it reads on any paper, the eye, a highlight.
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.ellipse(x, y, r * 1.45, r * 1.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x + (side ? 0 : r * 0.15), y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.35, r * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = Math.max(1, r * 0.55);
    if (mood === 'sleepy' || mood === 'sly') {
      // A lid down over the top half.
      ctx.fillStyle = 'rgba(30,20,30,0.8)';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.5, r * 1.35, 0, Math.PI, Math.PI * 2); ctx.fill();
      if (mood === 'sleepy') return;
    }
    ctx.beginPath();
    if (mood === 'fierce') { ctx.moveTo(x - flip * r * 1.6, y - r * 2.1); ctx.lineTo(x + flip * r * 1.4, y - r * 1.15); }
    else if (mood === 'sly') { ctx.moveTo(x - flip * r * 1.6, y - r * 1.4); ctx.quadraticCurveTo(x, y - r * 2.6, x + flip * r * 1.6, y - r * 2); }
    else if (mood === 'wise') { ctx.moveTo(x - r * 1.5, y - r * 1.7); ctx.quadraticCurveTo(x, y - r * 2.6, x + r * 1.5, y - r * 1.7); }
    else { ctx.moveTo(x - r * 1.3, y - r * 2); ctx.quadraticCurveTo(x, y - r * 2.5, x + r * 1.3, y - r * 2); }
    ctx.stroke();
  }

  function drawDesign(ctx, id, locked) {
    const pal = PAPER[id] || PAPER.paper_crane;
    const parts = (D[id] || D.paper_crane)();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const crease = id === 'paper_kirin' ? 'rgba(255,90,230,0.9)' : 'rgba(40,30,30,0.5)';
    for (const p of parts) {
      if (p.k === 'E') { if (!locked) drawEye(ctx, p, pal[4]); continue; }
      if (p.k === 'G') {
        if (locked) continue;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, p.col); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 0.75; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        continue;
      }
      const col = locked ? silOf(p.s) : paper(pal, p.s);
      if (p.k === 'L') {
        ctx.strokeStyle = col; ctx.lineWidth = p.w;
        ctx.beginPath(); ctx.moveTo(p.pts[0], p.pts[1]);
        for (let i = 2; i < p.pts.length; i += 2) ctx.lineTo(p.pts[i], p.pts[i + 1]);
        ctx.stroke();
        continue;
      }
      if (p.k === 'C') {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        if (p.ring) { ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.2, p.r * 0.28); ctx.stroke(); }
        else { ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = locked ? '#1a1628' : crease; ctx.lineWidth = 0.8; ctx.stroke(); }
        continue;
      }
      // A facet or a soft piece: the paper, a print, light from above, the crease round it and a
      // bright fold along its first edge.
      const trace = () => (p.k === 'S' ? traceSmooth(ctx, p.pts) : tracePoly(ctx, p.pts));
      trace();
      ctx.fillStyle = col; ctx.fill();
      if (!locked) {
        const b = bbox(p.pts);
        ctx.save();
        trace(); ctx.clip();
        if (p.pat) printOn(ctx, p.pat, b, p.pat === 'text' ? 'rgba(30,24,40,0.7)' : 'rgba(255,255,255,0.4)');
        const g = ctx.createLinearGradient(0, b.y0, 0, b.y1);
        g.addColorStop(0, 'rgba(255,255,255,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0.12)');
        ctx.fillStyle = g; ctx.fillRect(b.x0 - 1, b.y0 - 1, b.x1 - b.x0 + 2, b.y1 - b.y0 + 2);
        ctx.restore();
      }
      trace();
      ctx.strokeStyle = locked ? '#1a1628' : crease;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      if (!locked && p.k === 'P') {
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(p.pts[0], p.pts[1]); ctx.lineTo(p.pts[2], p.pts[3]); ctx.stroke();
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
      g.beginPath(); g.ellipse(60, 106, 32, 6, 0, 0, Math.PI * 2); g.fill();
      g.save();
      g.shadowColor = RARITY_GLOW[(l && l.rarity) || 'RARE'];
      g.shadowBlur = 14;
      drawDesign(g, id, true);
      g.restore();
    }
    drawDesign(g, id, locked);
    const url = c.toDataURL();
    cache.set(key, url);
    return Promise.resolve(url);
  }

  return { picture, PAPER, LIST: Object.keys(D) };
})();
