/**
 * Merge Beasts battle mode (1.4): the numbers. A beast's four stats, the enemies of every world,
 * the levels and their rewards. No drawing and no page here: battle_engine.js and the balance
 * tool (tools/battle_sim.mjs) use the same file in Node. See BATTLE_MODE.md.
 */
const BATTLE_DATA = (() => {
  // ------------------------------------------------------------------ fixed randomness
  /** A number from a string, always the same for the same string. */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  /** Random numbers from 0 to 1 that are always the same from the same seed. */
  function seeded(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  // ------------------------------------------------------------------ the four stats
  const STATS = ['atk', 'hp', 'spd', 'rng'];
  const STAT_NAMES = { atk: 'Attack', hp: 'Health', spd: 'Speed', rng: 'Range' };
  const RARITY_BONUS = { COMMON: 0, RARE: 1, SUPER_RARE: 2, ULTRA_RARE: 3, LEGENDARY: 4, GODLY: 5, DARK_MATTER: 6 };
  /** How a beast's extra points (one a tier) are shared over its stats, best first. */
  const SPLIT = [0.4, 0.3, 0.2, 0.1];

  const BODY_LEANS = {
    golem: { hp: 3 }, stone: { hp: 3 }, spiky_stone: { hp: 2, atk: 1 }, shell: { hp: 3 }, tree: { hp: 3 },
    dragon: { atk: 3 }, bull: { atk: 2, hp: 1 }, hydra: { atk: 2, rng: 1 }, lion: { atk: 3 }, wolf: { atk: 2, spd: 1 },
    dino: { atk: 2, hp: 1 }, reptile: { atk: 1, spd: 1 }, spider: { atk: 2, spd: 1 }, griffin: { atk: 2, spd: 1 },
    bird: { spd: 3 }, horse: { spd: 3 }, insect: { spd: 2, atk: 1 }, fox: { spd: 2, atk: 1 }, cat: { spd: 2, atk: 1 },
    lizard: { spd: 2 }, fairy: { rng: 2, spd: 1 }, cloud: { rng: 1, spd: 2 }, jellyfish: { rng: 2, hp: 1 }, droplet: { rng: 1, hp: 1 },
  };
  const ELEMENT_LEANS = {
    FIRE: { atk: 2 }, EARTH: { hp: 2 }, WIND: { spd: 2 }, WATER: { hp: 1, rng: 1 },
    LIGHT: { rng: 2 }, COSMIC: { rng: 2 }, VOID: { atk: 1, spd: 1 }, DEITY: { rng: 1, hp: 1 },
  };

  /** The order a beast's stats grow in, from what it looks like. */
  function order(id) {
    const t = BEAST_TEMPLATES[id];
    const p = (t && t.svgParams) || {};
    const score = { atk: 0, hp: 0, spd: 0, rng: 0 };
    const add = (lean) => { for (const k in lean) score[k] += lean[k]; };
    add(BODY_LEANS[p.body || 'droplet'] || {});
    add(ELEMENT_LEANS[t && t.element] || {});
    if (p.wings) score.spd += 1;
    if (p.horns || p.horn) score.atk += 1;
    if (p.crown || p.halo) score.rng += 1;
    if (p.spikes || p.shell || p.armor) score.hp += 1;
    const r = seeded(hash(id + '|order'));
    for (const k of STATS) score[k] += r() * 0.5;
    return [...STATS].sort((a, b) => score[b] - score[a]);
  }

  /**
   * Points shared over `ord` by SPLIT, whole numbers adding up to `extra`. Speed and Range pay off
   * less the more there is of them, so they take half their share and Attack and Health the rest:
   * a beast that leans to Range still hits and lasts (a Tier 13 cosmic beast had Attack 2).
   */
  function share(extra, ord, onto) {
    const w = SPLIT.map((x, i) => (ord[i] === 'spd' || ord[i] === 'rng' ? x * 0.5 : x));
    const sum = w.reduce((a, b) => a + b, 0);
    const raw = w.map((x) => (x / sum) * extra);
    const whole = raw.map(Math.floor);
    let left = extra - whole.reduce((a, b) => a + b, 0);
    const byRemainder = raw.map((x, i) => [x - whole[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    for (let k = 0; left > 0; k = (k + 1) % 4, left--) whole[byRemainder[k][1]]++;
    ord.forEach((s, i) => { onto[s] += whole[i]; });
    return onto;
  }

  /**
   * A beast's battle stats: 1 in each at Tier 1, one more a tier shared by its look, its rarity's
   * bonus on its highest stat, and one random point (fixed for that beast) for each prestige
   * level it has been owned at.
   */
  function beastStats(id, prestige = 0) {
    const t = BEAST_TEMPLATES[id];
    if (!t) return null;
    const s = share(Math.max(0, t.tier - 1), order(id), { atk: 1, hp: 1, spd: 1, rng: 1 });
    const bonus = RARITY_BONUS[t.rarity] || 0;
    if (bonus) {
      const top = Math.max(...STATS.map((k) => s[k]));
      const tied = STATS.filter((k) => s[k] === top);
      const pick = tied[Math.floor(seeded(hash(id + '|rarity'))() * tied.length)];
      s[pick] += bonus;
    }
    for (let k = 1; k <= prestige; k++) s[STATS[Math.floor(seeded(hash(id + '|prestige|' + k))() * 4)]]++;
    return s;
  }

  /** Points to the battle: hit points, light hit, speed (units a second) and reach (units). */
  function battleNumbers(s) {
    return {
      maxHp: 60 * s.hp,
      light: 3 * s.atk,
      speed: Math.min(150, 55 + 18 * Math.sqrt(Math.max(0, s.spd - 1))),
      reach: 40 + 26 * Math.sqrt(Math.max(0, s.rng - 1)),
    };
  }

  /** Whether a beast can battle (not the shadow bosses of the meadow). */
  function canBattle(id) {
    const t = BEAST_TEMPLATES[id];
    return !!t && !['shadow_fiend', 'shadow_fiend_evolved', 'void_parasite', 'void_parasite_evolved'].includes(id);
  }
  const systemOf = (id) => ((BEAST_TEMPLATES[id] || {}).system === 'low_gravity' ? 'low_gravity' : 'prime');
  /** A beast's card rests this long after it is played: its tier in seconds. */
  const cooldownOf = (id) => (BEAST_TEMPLATES[id] || { tier: 1 }).tier;
  /** How big a beast stands in the arena (radius, in arena units), by tier. */
  const beastRadius = (id) => Math.min(58, 20 + 2 * (((BEAST_TEMPLATES[id] || { tier: 1 }).tier) - 1));

  // ------------------------------------------------------------------ enemies
  /**
   * How an enemy's points are shared, by its part in a fight. `points` scales the level's points
   * for it, `hp` its hit points; `multi` is how many it hits at once.
   */
  const ROLES = {
    grunt: { order: ['atk', 'hp', 'spd', 'rng'], split: [0.3, 0.3, 0.25, 0.15], points: 1 },
    tank: { order: ['hp', 'atk', 'spd', 'rng'], split: [0.62, 0.25, 0.08, 0.05], points: 1.15 },
    runner: { order: ['spd', 'atk', 'hp', 'rng'], split: [0.5, 0.28, 0.17, 0.05], points: 0.9 },
    ranged: { order: ['rng', 'atk', 'hp', 'spd'], split: [0.42, 0.33, 0.15, 0.1], points: 0.95 },
    caster: { order: ['rng', 'atk', 'spd', 'hp'], split: [0.45, 0.4, 0.1, 0.05], points: 0.95 },
    brute: { order: ['atk', 'hp', 'spd', 'rng'], split: [0.52, 0.33, 0.1, 0.05], points: 1.1 },
    swarm: { order: ['spd', 'atk', 'hp', 'rng'], split: [0.4, 0.3, 0.2, 0.1], points: 0.5 },
    boss: { order: ['hp', 'atk', 'rng', 'spd'], split: [0.42, 0.36, 0.14, 0.08], points: 1.7, hp: 4, multi: 3 },
  };

  // Looks: plan (body plan), size, colours, head, hat, weapon and extras: enemies.js draws them.
  // Shadow folk are black with glowing eyes and a faint rim.
  const SH = (rim, eye, x) => Object.assign({ skin: '#100d18', cloth: '#16121f', trim: rim, eye, shadow: true }, x);
  const E = [];
  function foe(world, debut, id, name, role, look, note) { E.push({ id, name, world, debut, role, look, note }); }

  // World 1: the Shadow Wilds.
  foe(1, 1, 'shade_peasant', 'Shade Peasant', 'grunt', SH('#4a3d6b', '#ffe066', { plan: 'biped', size: 0.85, hat: 'straw', weapon: 'pitchfork' }), 'A farmhand made of dusk. It wanders out of the trees with a pitchfork, not sure what it is angry about.');
  foe(1, 2, 'shade_wisp', 'Wisp', 'swarm', SH('#6b5cff', '#bff4ff', { plan: 'float', size: 0.75, body: 'orb' }), 'A scrap of living shadow that drifts in bunches. One is nothing; twenty is a problem.');
  foe(1, 3, 'shade_thief', 'Shade Thief', 'runner', SH('#3f5a7a', '#9df7ff', { plan: 'biped', size: 0.8, head: 'hood', weapon: 'dagger' }), 'Quick, quiet and only interested in your coins. It slips past fights if it can.');
  foe(1, 4, 'shade_imp', 'Imp', 'swarm', SH('#7a2a3a', '#ff7a5c', { plan: 'biped', size: 0.55, hat: 'horns', tail: true, weapon: 'claws' }), 'A small horned pest that bites ankles. They come in threes.');
  foe(1, 5, 'shade_archer', 'Dusk Archer', 'ranged', SH('#3d5b3a', '#c6ff7a', { plan: 'biped', size: 0.85, head: 'hood', weapon: 'bow' }), 'Shoots arrows of hardened night from behind its friends.');
  foe(1, 6, 'shade_brute', 'Shadow Brute', 'brute', SH('#5a2f2f', '#ff9a3c', { plan: 'biped', size: 1.25, build: 'heavy', weapon: 'club' }), 'All shoulders and no thoughts. Its club leaves a smudge on anything it hits.');
  foe(1, 7, 'night_hound', 'Night Hound', 'runner', SH('#3b2f5c', '#ff4d6d', { plan: 'quad', size: 0.9, spikes: true }), 'A long, lean shape that runs on all fours and never blinks.');
  foe(1, 8, 'shade_guard', 'Shade Guard', 'tank', SH('#3a4a5c', '#ffd6a0', { plan: 'biped', size: 1, head: 'helm', weapon: 'spear', shield: 'tower' }), 'Hides behind a tall shield of solid gloom and pokes over the top.');
  foe(1, 9, 'shade_bats', 'Bat Swarm', 'swarm', SH('#4b2e5c', '#ff6be0', { plan: 'float', size: 0.75, body: 'bat' }), 'A cloud of tiny shadow bats that moves as one and squeaks like a hinge.');
  foe(1, 10, 'hollow_giant', 'Hollow Giant', 'boss', SH('#5c4a2f', '#ffb347', { plan: 'biped', size: 2.3, build: 'heavy', weapon: 'club', boss: true }), 'A giant with nothing inside but echoes. Its swing clears a whole lane. Boss.');
  foe(1, 11, 'moon_witch', 'Moon Witch', 'caster', SH('#4a3a7a', '#d6b8ff', { plan: 'biped', size: 0.9, hat: 'wizard', weapon: 'staff', cape: '#1d1630' }), 'Hums to the moon and throws pale bolts from the back line.');
  foe(1, 12, 'shade_crawler', 'Crawler', 'runner', SH('#2f4a4a', '#7affd4', { plan: 'crawler', size: 0.85 }), 'Too many legs, all of them fast. It skitters straight for your coins.');
  foe(1, 13, 'black_knight', 'Black Knight', 'tank', SH('#3c3c4a', '#ff5c5c', { plan: 'biped', size: 1.1, head: 'helm', weapon: 'sword', shield: 'round', armor: true }), 'Armour with nobody inside, still keeping its oath to someone long gone.');
  foe(1, 14, 'lantern_ghost', 'Lantern Ghost', 'caster', SH('#5a4a2a', '#ffe9a0', { plan: 'float', size: 0.85, body: 'sheet', weapon: 'lantern' }), 'Its lantern burns cold. The light it throws stings like frost.');
  foe(1, 15, 'scarecrow', 'Scarecrow', 'grunt', SH('#4d3d2a', '#ffcf5c', { plan: 'biped', size: 1, hat: 'straw', weapon: 'none', thin: true }), 'Stuffed with old shadows instead of straw. It flails, and it does not tire.');
  foe(1, 16, 'night_blade', 'Night Blade', 'runner', SH('#2f3f5c', '#5cf2ff', { plan: 'biped', size: 0.85, head: 'hood', weapon: 'dual' }), 'Two knives and no patience. Fast enough to reach your pile before you notice.');
  foe(1, 17, 'war_drummer', 'War Drummer', 'grunt', SH('#5c2f4a', '#ff8ad8', { plan: 'biped', size: 1, weapon: 'drum' }), 'Beats a drum made of night. The rest of them march to it.');
  foe(1, 18, 'wraith', 'Wraith', 'brute', SH('#3a2f5c', '#b48aff', { plan: 'float', size: 1.15, body: 'cloak', weapon: 'scythe' }), 'A hooded cloak with a scythe and no face at all. Hits hard, then drifts on.');
  foe(1, 19, 'pike_shade', 'Pike Shade', 'ranged', SH('#3a4a3a', '#d4ff8a', { plan: 'biped', size: 1, head: 'helm', weapon: 'pike' }), 'Holds a pike so long it fights from two beasts away.');
  foe(1, 20, 'night_mother', 'Night Mother', 'boss', SH('#4a2a6b', '#e08aff', { plan: 'float', size: 2.1, body: 'cloak', hat: 'wizard', weapon: 'staff', boss: true }), 'The witch who sings the shadows awake. Her bolts strike three at a time. Boss.');
  foe(1, 21, 'puppet', 'Puppet', 'swarm', SH('#5c4a3a', '#ffd28a', { plan: 'biped', size: 0.65, strings: true, weapon: 'none' }), 'Hangs from strings that go up into the dark. Nobody has seen who holds them.');
  foe(1, 22, 'shade_ogre', 'Shade Ogre', 'brute', SH('#4a3a2a', '#ffa05c', { plan: 'biped', size: 1.5, build: 'heavy', weapon: 'hammer' }), 'An ogre-shaped hole in the evening. Slow, and very heavy.');
  foe(1, 23, 'shade_serpent', 'Shade Serpent', 'runner', SH('#2a4a3a', '#8aff8a', { plan: 'serpent', size: 1 }), 'Pours over the ground like spilled ink and bites with a hiss.');
  foe(1, 24, 'silent_monk', 'Silent Monk', 'grunt', SH('#4a4a3a', '#fff0b0', { plan: 'biped', size: 0.95, head: 'bald', weapon: 'staff' }), 'Never speaks, never hurries, never misses with that staff.');
  foe(1, 25, 'long_shadow', 'Long Shadow', 'ranged', SH('#2f2f4a', '#ff7a7a', { plan: 'biped', size: 0.95, head: 'hood', weapon: 'crossbow' }), 'A sniper who stands where the light ends. Its bolts fly a long way.');
  foe(1, 26, 'gloom_hulk', 'Gloom Hulk', 'tank', SH('#3a3a3a', '#ffd04a', { plan: 'biped', size: 1.55, build: 'heavy', weapon: 'claws' }), 'A wall of darkness on two stumpy legs. Takes forever to wear down.');
  foe(1, 27, 'banshee', 'Banshee', 'caster', SH('#4a3a5c', '#aef0ff', { plan: 'float', size: 0.95, body: 'sheet', hair: true }), 'Screams, and the scream hurts. Keep her away from your front line.');
  foe(1, 28, 'grave_digger', 'Grave Digger', 'brute', SH('#3a3a2a', '#e0ff8a', { plan: 'biped', size: 1.05, hat: 'cap', weapon: 'shovel' }), 'Digs at night and fights with the same shovel.');
  foe(1, 29, 'stalker', 'Stalker', 'runner', SH('#2a2a4a', '#ff4dff', { plan: 'quad', size: 1.1, long: true }), 'Long legs, long reach, long stride. Gone past your beasts in a blink.');
  foe(1, 30, 'eclipse_wyrm', 'Eclipse Wyrm', 'boss', SH('#4a2a2a', '#ff6a3c', { plan: 'serpent', size: 2.2, horns: true, boss: true }), 'A serpent as long as the field, made of the moon gone dark. Boss.');
  foe(1, 31, 'twin_shade', 'Twin Shade', 'grunt', SH('#3a4a5c', '#8ac8ff', { plan: 'biped', size: 0.9, twin: true, weapon: 'sword' }), 'Two shadows sharing one body and arguing about where to go.');
  foe(1, 32, 'grim_jester', 'Grim Jester', 'runner', SH('#5c2f5c', '#ffef5c', { plan: 'biped', size: 0.85, hat: 'jester', weapon: 'dagger' }), 'Cartwheels into fights and laughs without a sound.');
  foe(1, 33, 'warlock', 'Warlock', 'caster', SH('#5c2a2a', '#ff5c8a', { plan: 'biped', size: 1, hat: 'horns', weapon: 'staff', cape: '#2a1018' }), 'Bargained with the dark and got bolts of it in return.');
  foe(1, 34, 'juggernaut', 'Juggernaut', 'tank', SH('#3c3c4c', '#ffffff', { plan: 'biped', size: 1.45, head: 'helm', armor: true, weapon: 'hammer', shield: 'tower' }), 'Armour on armour on armour. Bring your strongest hitters.');
  foe(1, 35, 'mirror_shade', 'Mirror Shade', 'grunt', SH('#5c5c7a', '#e0e0ff', { plan: 'biped', size: 0.95, head: 'mask', weapon: 'sword' }), 'Wears a blank mask that shows whatever looks at it.');
  foe(1, 36, 'moth_cloud', 'Moth Cloud', 'swarm', SH('#5c4a2a', '#fff2a8', { plan: 'float', size: 0.75, body: 'moth' }), 'Shadow moths drawn to the shine of your coins.');
  foe(1, 37, 'executioner', 'Executioner', 'brute', SH('#4a1f1f', '#ff3c3c', { plan: 'biped', size: 1.3, head: 'hood', weapon: 'axe' }), 'A hooded figure with a huge axe. Its heavy swing is the one to fear.');
  foe(1, 38, 'oracle', 'Oracle', 'caster', SH('#2f4a5c', '#5cffc8', { plan: 'float', size: 0.9, body: 'eye' }), 'One great eye that sees everything and fires at all of it.');
  foe(1, 39, 'shadow_captain', 'Shadow Captain', 'tank', SH('#3a3a5c', '#ffd700', { plan: 'biped', size: 1.2, head: 'helm', weapon: 'sword', shield: 'round', cape: '#2a1f4a', armor: true }), 'Leads the shade army from the front, cape snapping behind.');
  foe(1, 40, 'shade_king', 'The Shade King', 'boss', SH('#5c4a1f', '#ffd700', { plan: 'biped', size: 2.4, hat: 'crown', weapon: 'sword', cape: '#2a1f4a', armor: true, boss: true }), 'Ruler of the Shadow Wilds. Beat him to bring the dawn. Boss.');

  // World 2: the Iron Kingdom. People of many kinds, and creatures out of the old stories.
  const P = (skin, cloth, trim, eye, x) => Object.assign({ skin, cloth, trim, eye }, x);
  foe(2, 1, 'farmer', 'Angry Farmer', 'grunt', P('#f0c39a', '#7a9a4a', '#5a3a1a', '#2a1a10', { plan: 'biped', size: 0.95, hat: 'straw', weapon: 'pitchfork' }), 'Someone told him beasts eat crops. He has a pitchfork and he is not listening.');
  foe(2, 2, 'goblin', 'Goblin', 'swarm', P('#7ac24a', '#6a4a2a', '#3a2a1a', '#ffe066', { plan: 'biped', size: 0.6, ears: true, weapon: 'dagger' }), 'Small, green and greedy. Goblins run at coins the way moths run at lamps.');
  foe(2, 3, 'militia', 'Militia', 'grunt', P('#e8b48a', '#a83a3a', '#5a5a6a', '#2a1a10', { plan: 'biped', size: 1, hat: 'cap', weapon: 'spear' }), 'A villager with a spear and a borrowed helmet.');
  foe(2, 4, 'archer', 'Archer', 'ranged', P('#f0c39a', '#3a7a3a', '#2a4a1a', '#2a1a10', { plan: 'biped', size: 0.95, head: 'hood', weapon: 'bow' }), 'Trained at the castle butts. Stays well back and keeps loosing.');
  foe(2, 5, 'dwarf_miner', 'Dwarf Miner', 'tank', P('#e8a87a', '#6a5a4a', '#8a6a2a', '#2a1a10', { plan: 'biped', size: 0.75, build: 'heavy', beard: '#c46a2a', hat: 'helmet', weapon: 'pick' }), 'Short, wide and very hard to knock over.');
  foe(2, 6, 'orc', 'Orc Grunt', 'brute', P('#6a9a4a', '#5a3a2a', '#3a3a3a', '#ff3c2a', { plan: 'biped', size: 1.15, build: 'heavy', tusks: true, weapon: 'axe' }), 'Tusks, an axe, and a very simple plan.');
  foe(2, 7, 'knight', 'Knight', 'tank', P('#f0c39a', '#b8c0cc', '#2a4a9a', '#2a1a10', { plan: 'biped', size: 1.05, head: 'helm', armor: true, weapon: 'sword', shield: 'round' }), 'Polished plate and a shield with the king\'s colours.');
  foe(2, 8, 'crossbowman', 'Crossbowman', 'ranged', P('#e8b48a', '#4a5a7a', '#8a8a9a', '#2a1a10', { plan: 'biped', size: 0.95, hat: 'cap', weapon: 'crossbow' }), 'Slower than an archer, harder hitting, and further reaching.');
  foe(2, 9, 'harpy', 'Harpy', 'runner', P('#e8c09a', '#8a5a9a', '#5a3a6a', '#ffcc00', { plan: 'float', size: 0.9, body: 'harpy', wings: 'feather' }), 'Half woman, half bird, all shrieking. Swoops straight for your coins.');
  foe(2, 10, 'cyclops_warlord', 'Cyclops Warlord', 'boss', P('#c8a07a', '#6a4a3a', '#aa3a2a', '#ffffff', { plan: 'biped', size: 2.3, build: 'heavy', eyes: 1, weapon: 'club', boss: true }), 'One eye, one club, one terrible temper. Its swing hits three. Boss.');
  foe(2, 11, 'mage', 'Court Mage', 'caster', P('#f0c39a', '#3a4aaa', '#ffd700', '#2a1a10', { plan: 'biped', size: 0.95, hat: 'wizard', weapon: 'staff', beard: '#dddddd' }), 'Throws fizzing blue bolts and complains about the pay.');
  foe(2, 12, 'satyr', 'Satyr', 'runner', P('#d8a07a', '#7a5a3a', '#4a3a2a', '#2a1a10', { plan: 'biped', size: 0.9, hat: 'horns', legs: 'hooves', weapon: 'flute' }), 'Goat-legged and quick. Plays a tune while it runs at you.');
  foe(2, 13, 'pikeman', 'Pikeman', 'ranged', P('#e8b48a', '#8a3a3a', '#8a8a9a', '#2a1a10', { plan: 'biped', size: 1, head: 'helm', weapon: 'pike' }), 'A pike long enough to poke beasts from behind his friends.');
  foe(2, 14, 'troll', 'Troll', 'tank', P('#7a8a6a', '#5a4a3a', '#3a3a2a', '#ffcc33', { plan: 'biped', size: 1.45, build: 'heavy', ears: true, weapon: 'club' }), 'Lives under bridges and hits like one. Shrugs off small hits.');
  foe(2, 15, 'elf_ranger', 'Elf Ranger', 'ranged', P('#f4d8b8', '#2a6a4a', '#d4c06a', '#3a7a3a', { plan: 'biped', size: 1, ears: true, head: 'hood', weapon: 'longbow' }), 'Can hit a coin at the far end of the field. Usually does.');
  foe(2, 16, 'gladiator', 'Gladiator', 'brute', P('#d8a07a', '#aa3a2a', '#c8a03a', '#2a1a10', { plan: 'biped', size: 1.05, head: 'helm', weapon: 'trident' }), 'Fights for a crowd that is not there.');
  foe(2, 17, 'centaur', 'Centaur', 'ranged', P('#e0b08a', '#7a5a3a', '#3a2a1a', '#2a1a10', { plan: 'centaur', size: 1.2, weapon: 'bow' }), 'Half horse, half archer. Shoots on the move and runs faster than most.');
  foe(2, 18, 'viking', 'Raider', 'brute', P('#f0c39a', '#5a6a8a', '#8a8a9a', '#2a1a10', { plan: 'biped', size: 1.1, hat: 'viking', beard: '#e8b030', weapon: 'axe', shield: 'round' }), 'Came over the sea for gold and found beasts guarding it.');
  foe(2, 19, 'pirate', 'Pirate', 'grunt', P('#d8a07a', '#2a2a3a', '#c8a03a', '#2a1a10', { plan: 'biped', size: 1, hat: 'pirate', patch: true, weapon: 'cutlass' }), 'Smells your coins from a mile away. Arr.');
  foe(2, 20, 'minotaur_lord', 'Minotaur Lord', 'boss', P('#8a5a3a', '#5a3a2a', '#c8a03a', '#ff3c2a', { plan: 'biped', size: 2.3, build: 'heavy', hat: 'horns', legs: 'hooves', weapon: 'axe', boss: true }), 'Lord of the maze. Charges, swings, and swings again. Boss.');
  foe(2, 21, 'ninja', 'Ninja', 'runner', P('#e8b48a', '#1a1a2a', '#aa2a2a', '#2a1a10', { plan: 'biped', size: 0.9, head: 'mask', weapon: 'katana' }), 'You see it at the top of the field, then at your coins.');
  foe(2, 22, 'samurai', 'Samurai', 'brute', P('#e8b48a', '#aa2a2a', '#2a2a2a', '#2a1a10', { plan: 'biped', size: 1.05, head: 'helm', armor: true, weapon: 'katana' }), 'One perfect cut, every five seconds. Mind the heavy one.');
  foe(2, 23, 'monk', 'Mountain Monk', 'grunt', P('#d8a07a', '#e88a2a', '#aa5a1a', '#2a1a10', { plan: 'biped', size: 0.95, head: 'bald', weapon: 'staff' }), 'Has trained his whole life for this. Mostly for this.');
  foe(2, 24, 'priest', 'Sun Priest', 'caster', P('#f0c39a', '#f4f0e0', '#ffd700', '#2a1a10', { plan: 'biped', size: 0.95, hat: 'mitre', weapon: 'staff' }), 'Calls down light that burns. Very calm about it.');
  foe(2, 25, 'ogre', 'Ogre', 'brute', P('#b8a06a', '#6a4a2a', '#4a3a2a', '#2a1a10', { plan: 'biped', size: 1.5, build: 'heavy', weapon: 'club' }), 'Big, hungry and swinging a tree trunk.');
  foe(2, 26, 'gorgon', 'Gorgon', 'caster', P('#8ab87a', '#5a7a4a', '#c8a03a', '#ffee00', { plan: 'biped', size: 1, hair: 'snakes', weapon: 'bow' }), 'Snakes for hair and a stare that hurts. Do not look at it for long.');
  foe(2, 27, 'bard', 'Bard', 'caster', P('#f0c39a', '#aa3a8a', '#ffd700', '#2a1a10', { plan: 'biped', size: 0.9, hat: 'feather', weapon: 'lute' }), 'His songs are so bad they do real damage.');
  foe(2, 28, 'cavalier', 'Cavalier', 'runner', P('#f0c39a', '#b8c0cc', '#2a4a9a', '#2a1a10', { plan: 'centaur', size: 1.25, rider: true, head: 'helm', weapon: 'lance' }), 'A knight on a charger, lance down, coming fast.');
  foe(2, 29, 'alchemist', 'Alchemist', 'ranged', P('#f0c39a', '#5a3a7a', '#7aff5a', '#2a1a10', { plan: 'biped', size: 0.9, goggles: true, weapon: 'potion' }), 'Throws bottles that go bang. Some of them on purpose.');
  foe(2, 30, 'gorgon_queen', 'Gorgon Queen', 'boss', P('#7ab86a', '#3a5a3a', '#ffd700', '#ffee00', { plan: 'serpent', size: 2.2, torso: true, hair: 'snakes', hat: 'crown', boss: true }), 'A queen with a serpent\'s tail and a stare that strikes three. Boss.');
  foe(2, 31, 'berserker', 'Berserker', 'brute', P('#e8a07a', '#6a3a2a', '#aa2a2a', '#ff2a2a', { plan: 'biped', size: 1.15, beard: '#aa4a1a', weapon: 'dual_axe' }), 'Stopped feeling pain years ago. Stopped thinking too.');
  foe(2, 32, 'paladin', 'Paladin', 'tank', P('#f0c39a', '#f0f0f8', '#ffd700', '#2a1a10', { plan: 'biped', size: 1.1, head: 'helm', armor: true, weapon: 'hammer', shield: 'tower' }), 'Shining armour, a holy hammer, and a shield you cannot get round.');
  foe(2, 33, 'wizard', 'Grand Wizard', 'caster', P('#f0c39a', '#5a2a9a', '#ffd700', '#2a1a10', { plan: 'biped', size: 1, hat: 'wizard', beard: '#ffffff', weapon: 'orb_staff' }), 'Old, powerful and furious that beasts are in his kingdom.');
  foe(2, 34, 'hill_giant', 'Hill Giant', 'tank', P('#c89a7a', '#7a6a4a', '#4a3a2a', '#2a1a10', { plan: 'biped', size: 1.75, build: 'heavy', beard: '#6a4a2a', weapon: 'club' }), 'A giant from the hills, as tough as one.');
  foe(2, 35, 'chimera', 'Chimera', 'brute', P('#c88a3a', '#aa6a2a', '#5a3a1a', '#ff3c2a', { plan: 'quad', size: 1.35, mane: true, tail: true, horns: true }), 'Lion, goat and snake in one bad mood.');
  foe(2, 36, 'stone_troll', 'Stone Troll', 'tank', P('#8a8a8a', '#5a5a5a', '#3a3a3a', '#ff9a2a', { plan: 'biped', size: 1.55, build: 'heavy', spikes: true, weapon: 'claws' }), 'A troll that turned to stone and kept walking.');
  foe(2, 37, 'royal_guard', 'Royal Guard', 'grunt', P('#f0c39a', '#aa2a3a', '#ffd700', '#2a1a10', { plan: 'biped', size: 1.05, hat: 'bearskin', weapon: 'halberd' }), 'Guards the king\'s treasury. Takes it personally.');
  foe(2, 38, 'siege_crew', 'Battering Crew', 'tank', P('#e8b48a', '#6a5a4a', '#8a6a2a', '#2a1a10', { plan: 'ram', size: 1.6 }), 'Four soldiers and a log, headed for your coin pile.');
  foe(2, 39, 'arch_mage', 'Arch Mage', 'caster', P('#f0c39a', '#1a2a6a', '#5cf0ff', '#5cf0ff', { plan: 'float', size: 1.05, body: 'robe', hat: 'wizard', weapon: 'orb_staff' }), 'Floats above the ground because walking is beneath him.');
  foe(2, 40, 'iron_king', 'The Iron King', 'boss', P('#f0c39a', '#5a5a6a', '#ffd700', '#2a1a10', { plan: 'biped', size: 2.4, head: 'helm', hat: 'crown', armor: true, weapon: 'sword', shield: 'tower', cape: '#aa2a3a', boss: true }), 'King of iron and gold, who wants every coin in the land. Boss.');

  // World 3: the Star Invasion. Visitors from far off, and their machines.
  const A = (skin, cloth, trim, eye, x) => Object.assign({ skin, cloth, trim, eye }, x);
  foe(3, 1, 'grey', 'Grey', 'grunt', A('#b8c0c8', '#5a6a7a', '#3a4a5a', '#101018', { plan: 'biped', size: 0.85, head: 'alien', weapon: 'raygun' }), 'Big head, big black eyes, small ray gun. The classic.');
  foe(3, 2, 'scout_drone', 'Scout Drone', 'swarm', A('#8a9aaa', '#5a6a7a', '#ff3c3c', '#ff3c3c', { plan: 'float', size: 0.75, body: 'drone' }), 'A flying camera with a tiny zapper. Watching, always watching.');
  foe(3, 3, 'goo_trooper', 'Goo Trooper', 'grunt', A('#7aff6a', '#3a5a8a', '#c8d0d8', '#103010', { plan: 'blob', size: 0.9, helmet: true }), 'A blob of green goo in a space suit. It squelches when it walks.');
  foe(3, 4, 'bug_drone', 'Bug Drone', 'swarm', A('#5a8a3a', '#3a5a2a', '#c8ff3a', '#ff3a3a', { plan: 'float', size: 0.75, body: 'bug', wings: 'bug' }), 'Buzzes in swarms from the hive ships.');
  foe(3, 5, 'laser_trooper', 'Laser Trooper', 'ranged', A('#c8d0d8', '#e8e8f0', '#3a7aff', '#3a7aff', { plan: 'biped', size: 1, head: 'visor', armor: true, weapon: 'rifle' }), 'White armour, black visor, red lasers. Terrible aim, lots of shots.');
  foe(3, 6, 'mite', 'Crawler Mite', 'runner', A('#aa5a3a', '#7a3a2a', '#ffa03a', '#ffee00', { plan: 'crawler', size: 0.75 }), 'A six-legged alien tick that runs at anything shiny.');
  foe(3, 7, 'big_brain', 'Big Brain', 'caster', A('#ff9ac8', '#7a4a9a', '#ff5ca8', '#ffffff', { plan: 'float', size: 0.9, body: 'brain' }), 'All brain, no body. Fires thoughts that hurt.');
  foe(3, 8, 'robot', 'Robot Soldier', 'tank', A('#9aa0aa', '#6a707a', '#ffcc33', '#5cf0ff', { plan: 'biped', size: 1.05, head: 'robot', armor: true, weapon: 'claws' }), 'Bolted together on the mothership. Tough and dented.');
  foe(3, 9, 'jet_trooper', 'Jet Trooper', 'runner', A('#c8d0d8', '#3a5a9a', '#ff7a2a', '#5cf0ff', { plan: 'biped', size: 0.95, head: 'visor', jetpack: true, weapon: 'raygun' }), 'Flies low and fast on a smoking jetpack.');
  foe(3, 10, 'tripod_titan', 'Tripod Titan', 'boss', A('#8a9aaa', '#4a5a6a', '#ff3c3c', '#ff3c3c', { plan: 'tripod', size: 2.4, boss: true }), 'A walking war machine on three long legs. Its beam hits three. Boss.');
  foe(3, 11, 'mantis', 'Mantis Warrior', 'brute', A('#7ac83a', '#4a8a2a', '#c8ff5a', '#ff3a3a', { plan: 'biped', size: 1.1, head: 'mantis', weapon: 'blades', thin: true }), 'Blade arms and a head that turns all the way round.');
  foe(3, 12, 'eyestalk', 'Eyestalk', 'caster', A('#c86aff', '#7a3aaa', '#ff9aff', '#ffffff', { plan: 'blob', size: 0.95, eyes: 3, stalks: true }), 'Three eyes on stalks, each firing its own beam.');
  foe(3, 13, 'cyborg', 'Cyborg', 'grunt', A('#e0b090', '#4a4a5a', '#ff3c3c', '#ff3c3c', { plan: 'biped', size: 1, head: 'cyborg', armor: true, weapon: 'raygun' }), 'Half alien, half machine, all business.');
  foe(3, 14, 'plasma_sniper', 'Plasma Sniper', 'ranged', A('#8ac8ff', '#2a3a5a', '#5cf0ff', '#ffffff', { plan: 'biped', size: 0.95, head: 'alien', weapon: 'long_rifle' }), 'Lies at the back and hits from across the field.');
  foe(3, 15, 'hover_tank', 'Hover Tank', 'tank', A('#7a8a6a', '#5a6a4a', '#ffcc33', '#ff3c3c', { plan: 'float', size: 1.35, body: 'tank' }), 'A tank with no wheels, just a hum. Very hard to dent.');
  foe(3, 16, 'tentacle', 'Tentacle Thing', 'brute', A('#aa5aaa', '#7a3a7a', '#ff7aff', '#ffee00', { plan: 'blob', size: 1.2, tentacles: true }), 'Mostly tentacles. Each one wants to hit something.');
  foe(3, 17, 'crystal_alien', 'Crystal Walker', 'tank', A('#7ae0ff', '#3aa0d0', '#e0ffff', '#ffffff', { plan: 'biped', size: 1.15, head: 'crystal', crystal: true, weapon: 'claws' }), 'Made of living crystal. Hits glance off it.');
  foe(3, 18, 'nano_mites', 'Mite Cloud', 'swarm', A('#c8c8c8', '#8a8a8a', '#5cf0ff', '#5cf0ff', { plan: 'float', size: 0.75, body: 'swarm' }), 'A cloud of tiny machines that eat metal and coins.');
  foe(3, 19, 'shield_drone', 'Shield Drone', 'tank', A('#8a9aaa', '#5a6a7a', '#5cf0ff', '#5cf0ff', { plan: 'float', size: 0.95, body: 'drone', shield: 'energy' }), 'Hides behind a shimmering shield of light.');
  foe(3, 20, 'brood_mother', 'Brood Mother', 'boss', A('#8aaa3a', '#5a7a2a', '#ffee00', '#ff3a3a', { plan: 'crawler', size: 2.2, boss: true }), 'The bug queen\'s queen. Her jaws snap at three beasts at once. Boss.');
  foe(3, 21, 'mech_walker', 'Mech Walker', 'brute', A('#aa8a5a', '#6a5a3a', '#ff7a2a', '#ffcc33', { plan: 'tripod', size: 1.3 }), 'A small walking cannon. Small for a walking cannon.');
  foe(3, 22, 'psi_floater', 'Psi Floater', 'caster', A('#c8b0ff', '#6a4aaa', '#ff9aff', '#ffffff', { plan: 'float', size: 0.85, body: 'robe', head: 'alien' }), 'Floats on the power of its own mind and throws headaches.');
  foe(3, 23, 'acid_spitter', 'Acid Spitter', 'ranged', A('#aaee3a', '#5a8a2a', '#eeff3a', '#ff3a3a', { plan: 'crawler', size: 0.95, sac: true }), 'Spits green acid from a long way off. Smells awful.');
  foe(3, 24, 'war_robot', 'War Robot', 'brute', A('#7a7a8a', '#4a4a5a', '#ff3c3c', '#ff3c3c', { plan: 'biped', size: 1.35, build: 'heavy', head: 'robot', armor: true, weapon: 'hammer' }), 'Built for one thing, and that thing is hitting.');
  foe(3, 25, 'saucer', 'Mini Saucer', 'ranged', A('#c8d0d8', '#8a9aaa', '#7aff5a', '#7aff5a', { plan: 'float', size: 1, body: 'saucer' }), 'A small flying saucer with a big tractor beam.');
  foe(3, 26, 'hive_guard', 'Hive Guard', 'tank', A('#6a8a3a', '#4a6a2a', '#eeff3a', '#ff3a3a', { plan: 'biped', size: 1.2, head: 'bug', armor: true, weapon: 'spear', shield: 'round' }), 'An armoured bug standing on two legs and guarding the hive.');
  foe(3, 27, 'phase_stalker', 'Phase Stalker', 'runner', A('#5a5aaa', '#3a3a7a', '#aa7aff', '#ff7aff', { plan: 'quad', size: 1, long: true, glitch: true }), 'Flickers in and out of this world. Hard to pin down.');
  foe(3, 28, 'gravity_mage', 'Gravity Mage', 'caster', A('#b8c0c8', '#2a2a4a', '#aa7aff', '#aa7aff', { plan: 'biped', size: 0.95, head: 'alien', hat: 'halo_ring', weapon: 'orb_staff' }), 'Bends the ground under your beasts. It hurts.');
  foe(3, 29, 'nano_swarm', 'Nano Swarm', 'swarm', A('#5cf0ff', '#3a8aaa', '#ffffff', '#ffffff', { plan: 'float', size: 0.75, body: 'swarm' }), 'A smarter, faster cloud of machines.');
  foe(3, 30, 'hive_empress', 'Hive Empress', 'boss', A('#aacc3a', '#6a8a2a', '#ffd700', '#ff3a3a', { plan: 'biped', size: 2.3, head: 'bug', hat: 'crown', wings: 'bug', weapon: 'blades', boss: true }), 'Empress of the swarm, with wings and blades. Boss.');
  foe(3, 31, 'star_knight', 'Star Knight', 'tank', A('#c8d0d8', '#e0e8f0', '#ffd700', '#5cf0ff', { plan: 'biped', size: 1.15, head: 'visor', armor: true, weapon: 'laser_sword', shield: 'energy' }), 'A knight from another star, with a sword of light.');
  foe(3, 32, 'void_hunter', 'Void Hunter', 'runner', A('#3a3a5a', '#1a1a2a', '#ff3cff', '#ff3cff', { plan: 'biped', size: 1, head: 'alien', weapon: 'blades', cape: '#2a0a3a' }), 'Hunts across the stars for the rarest beasts. That means yours.');
  foe(3, 33, 'siege_mech', 'Siege Mech', 'tank', A('#8a7a6a', '#5a4a3a', '#ff7a2a', '#ffcc33', { plan: 'tripod', size: 1.7 }), 'Slow, enormous and shooting.');
  foe(3, 34, 'plasma_brute', 'Plasma Brute', 'brute', A('#ff7a5a', '#aa3a2a', '#ffee5a', '#ffffff', { plan: 'biped', size: 1.4, build: 'heavy', head: 'alien', weapon: 'claws', glow: true }), 'Glows red hot and punches harder than it glows.');
  foe(3, 35, 'cloaker', 'Cloaker', 'runner', A('#8a9aaa', '#2a2a3a', '#5cf0ff', '#5cf0ff', { plan: 'biped', size: 0.9, head: 'visor', weapon: 'dagger', glitch: true }), 'Wears a cloak that bends light. You see the shimmer, then the knife.');
  foe(3, 36, 'overseer', 'Overseer', 'caster', A('#c8d0d8', '#5a6a7a', '#ff3c3c', '#ff3c3c', { plan: 'float', size: 1.05, body: 'eye', metal: true }), 'A floating metal eye that runs the invasion. It shoots at everything.');
  foe(3, 37, 'cruiser_drone', 'Cruiser Drone', 'brute', A('#7a8a9a', '#4a5a6a', '#ffcc33', '#ffcc33', { plan: 'float', size: 1.3, body: 'saucer', guns: true }), 'A gunship the size of a barn.');
  foe(3, 38, 'quantum_trooper', 'Quantum Trooper', 'grunt', A('#e0e8f0', '#5a3aaa', '#5cf0ff', '#5cf0ff', { plan: 'biped', size: 1.05, head: 'visor', armor: true, weapon: 'rifle', glitch: true }), 'Fights in two places at once. Only one of them hurts.');
  foe(3, 39, 'command_bot', 'Command Bot', 'tank', A('#aab0ba', '#6a707a', '#ffd700', '#5cf0ff', { plan: 'biped', size: 1.4, head: 'robot', armor: true, weapon: 'hammer', shield: 'energy', cape: '#3a4a7a' }), 'Gives the orders. Can take a beating while it does.');
  foe(3, 40, 'overlord', 'Mothership Overlord', 'boss', A('#c8a0ff', '#3a2a5a', '#ffd700', '#ffffff', { plan: 'float', size: 2.5, body: 'brain', hat: 'crown', boss: true, guns: true }), 'The mind behind the invasion, in a throne of light. Boss.');

  const ENEMIES = {};
  for (const e of E) ENEMIES[e.id] = e;

  /** An enemy's stat points at a level of `points`. */
  function enemyStats(id, points) {
    const e = ENEMIES[id];
    const role = ROLES[e.role];
    const total = Math.max(4, Math.round(points * role.points));
    const s = { atk: 1, hp: 1, spd: 1, rng: 1 };
    const extra = total - 4;
    const raw = role.split.map((w) => w * extra);
    const whole = raw.map(Math.floor);
    let left = extra - whole.reduce((a, b) => a + b, 0);
    const rem = raw.map((x, i) => [x - whole[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    for (let k = 0; left > 0; k = (k + 1) % 4, left--) whole[rem[k][1]]++;
    role.order.forEach((k, i) => { s[k] += whole[i]; });
    return s;
  }
  /** How big an enemy stands (radius, arena units). */
  const enemyRadius = (id) => Math.min(80, 26 * ((ENEMIES[id] || {}).look || { size: 1 }).size);

  // ------------------------------------------------------------------ worlds and levels
  const WORLDS = [
    { id: 1, system: 'prime', name: 'Shadow Wilds', theme: 'shadow', levels: 40, base: 3.2, gain: 0.62, chest: { rarity: 'LEGENDARY', tier: 10 } },
    { id: 2, system: 'prime', name: 'Iron Kingdom', theme: 'kingdom', levels: 40, base: 25, gain: 0.7, chest: { rarity: 'GODLY', tier: 12 } },
    { id: 3, system: 'prime', name: 'Star Invasion', theme: 'invasion', levels: 40, base: 48, gain: 0.75, chest: { rarity: 'GODLY', tier: 15 } },
  ];
  const BOSS_EVERY = 10;

  /** Enemy points at a level: climbing through a world, a little more on boss levels. */
  function levelPoints(world, n) {
    const w = WORLDS[world - 1];
    return w.base + w.gain * (n - 1);
  }

  /**
   * A level: which enemies come, when, and how strong. Made from the world and number with fixed
   * randomness, so a level is always the same.
   */
  function level(world, n) {
    const w = WORLDS[world - 1];
    const r = seeded(hash(`level|${world}|${n}`));
    const boss = n % BOSS_EVERY === 0;
    const pool = E.filter((e) => e.world === world && e.role !== 'boss' && e.debut <= n);
    const fresh = E.find((e) => e.world === world && e.debut === n && e.role !== 'boss');
    const bossFoe = boss ? E.find((e) => e.world === world && e.role === 'boss' && e.debut === n) : null;
    const points = levelPoints(world, n);
    // Recent arrivals more often than old ones, and the newest always shows up early.
    const weights = pool.map((e) => 1 + Math.max(0, 6 - (n - e.debut)) * 0.5);
    const pick = () => {
      let x = r() * weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < pool.length; i++) { x -= weights[i]; if (x <= 0) return pool[i]; }
      return pool[pool.length - 1];
    };
    const k = (n - 1) / (w.levels - 1);
    const spawns = [];
    // A gentle start, then a stream that thickens through the world: groups of one to three,
    // more often the further in.
    const every = Math.max(3.4, 6.2 - 2.2 * k - (world - 1) * 0.2 + (n <= 3 ? 1.5 : 0));
    const length = 160;
    spawns.push({ t: 2, foe: (fresh || pick()).id, x: 0.35 + r() * 0.3 });
    let t = 4.5;
    while (t < length) {
      const f = t > 12 && fresh && r() < 0.18 ? fresh : pick();
      const many = f.role === 'swarm' ? 3 : n > 4 && r() < 0.15 + k * 0.25 ? 2 : 1;
      const lane = 0.12 + r() * 0.76;
      for (let i = 0; i < many; i++) spawns.push({ t: t + i * 0.7, foe: (i && f.role !== 'swarm' ? pick() : f).id, x: Math.min(0.92, Math.max(0.08, lane + (i - (many - 1) / 2) * 0.09)) });
      t += every * (0.75 + r() * 0.5);
    }
    if (bossFoe) spawns.push({ t: 20, foe: bossFoe.id, x: 0.5, boss: true });
    spawns.sort((a, b) => a.t - b.t);
    // Defenders who come out when their coin pile is being emptied (at 10 s and at 5 s left).
    const rally = n < 2 ? [pick().id] : [pick().id, pick().id, n > 10 ? pick().id : null, n > 25 ? pick().id : null].filter(Boolean);
    const p = LEVEL_POINTS[`${world}-${n}`];
    return {
      id: `${world}-${n}`, world, n, boss, points: p || points, spawns, rally,
      maxEnemies: Math.min(12, 5 + Math.floor(n / 8) + (world - 1)),
      pile: 15,
      starTime: STAR_TIMES[`${world}-${n}`] || 90 + Math.round(k * 60),
      fresh: fresh ? fresh.id : null, bossFoe: bossFoe ? bossFoe.id : null,
      name: bossFoe ? bossFoe.name : `${w.name} ${n}`,
    };
  }
  /**
   * Enemy points for each level, set by the balance tool (tools/battle_sim.mjs --calibrate): the
   * most the deck a player would have by then can still beat, times a margin. Levels not listed
   * use levelPoints.
   */
  const LEVEL_POINTS = {};
  /** Star target times, set from the balance tool's clear times (tools/battle_sim.mjs). */
  const STAR_TIMES = {};

  /** Difficulty from half a star to five, from how much an enemy brings when it first appears. */
  function difficulty(id) {
    const e = ENEMIES[id];
    const s = enemyStats(id, levelPoints(e.world, e.debut));
    const n = battleNumbers(s);
    const role = ROLES[e.role];
    const threat = Math.sqrt(n.maxHp * (role.hp || 1) * n.light * (role.multi || 1)) * (1 + n.speed / 300);
    const lo = Math.log(9), hi = Math.log(1500);
    const x = (Math.log(Math.max(9, threat)) - lo) / (hi - lo);
    return Math.max(0.5, Math.min(5, Math.round((0.5 + x * 4.5) * 2) / 2));
  }

  // ------------------------------------------------------------------ rewards
  /** Minutes of current income paid for clearing a level the first time. */
  const clearMinutes = (world, n) => 2 + Math.floor(n / 5) + (world - 1) * 4;

  const ACHIEVEMENTS = [
    { id: 'first_win', name: 'First Blood', desc: 'Win your first battle.', test: (b) => b.clears >= 1, reward: { crates: 2 } },
    { id: 'clear_10', name: 'Warming Up', desc: 'Clear 10 levels.', test: (b) => b.clears >= 10, reward: { crates: 5 } },
    { id: 'clear_40', name: 'Seasoned', desc: 'Clear 40 levels.', test: (b) => b.clears >= 40, reward: { premium: 2 } },
    { id: 'clear_80', name: 'Veteran', desc: 'Clear 80 levels.', test: (b) => b.clears >= 80, reward: { premium: 4 } },
    { id: 'clear_120', name: 'Conqueror', desc: 'Clear all 120 Prime levels.', test: (b) => b.clears >= 120, reward: { premium: 10 } },
    { id: 'stars_5', name: 'Quick Paws', desc: 'Earn 5 stars.', test: (b) => b.stars >= 5, reward: { spins: 1 } },
    { id: 'stars_25', name: 'Speed Runner', desc: 'Earn 25 stars.', test: (b) => b.stars >= 25, reward: { premium: 2 } },
    { id: 'stars_60', name: 'Star Hoarder', desc: 'Earn 60 stars.', test: (b) => b.stars >= 60, reward: { premium: 4 } },
    { id: 'stars_120', name: 'Constellation', desc: 'Earn every Prime star.', test: (b) => b.stars >= 120, reward: { premium: 12 } },
    { id: 'boss_1', name: 'Giant Slayer', desc: 'Beat a boss.', test: (b) => b.bosses >= 1, reward: { premium: 1 } },
    { id: 'boss_6', name: 'Boss Hunter', desc: 'Beat 6 bosses.', test: (b) => b.bosses >= 6, reward: { premium: 3 } },
    { id: 'boss_12', name: 'Kingbreaker', desc: 'Beat all 12 Prime bosses.', test: (b) => b.bosses >= 12, reward: { premium: 8 } },
    { id: 'world_1', name: 'Dawn', desc: 'Clear the Shadow Wilds.', test: (b) => b.worlds >= 1, reward: { premium: 3 } },
    { id: 'world_2', name: 'Uncrowned', desc: 'Clear the Iron Kingdom.', test: (b) => b.worlds >= 2, reward: { premium: 5 } },
    { id: 'world_3', name: 'Invaders Repelled', desc: 'Clear the Star Invasion.', test: (b) => b.worlds >= 3, reward: { premium: 8 } },
    { id: 'blitz', name: 'Blitz', desc: 'Win any level in under 40 seconds.', test: (b) => b.fastest > 0 && b.fastest < 40, reward: { spins: 2 } },
    { id: 'underdog', name: 'Underdog', desc: 'Beat a boss with no beast above Tier 8.', test: (b) => b.underdog, reward: { premium: 3 } },
    { id: 'flawless', name: 'Untouched', desc: 'Win with your coin pile full.', test: (b) => b.flawless >= 1, reward: { crates: 5 } },
    { id: 'flawless_10', name: 'Fortress', desc: 'Win 10 battles with your coin pile full.', test: (b) => b.flawless >= 10, reward: { premium: 3 } },
    { id: 'foes_50', name: 'Field Notes', desc: 'Meet 50 kinds of enemy.', test: (b) => b.seen >= 50, reward: { spins: 2 } },
    { id: 'foes_120', name: 'Know Your Enemy', desc: 'Meet every Prime enemy.', test: (b) => b.seen >= 120, reward: { premium: 5 } },
  ];

  /** Perks: one before a battle, once earned. */
  const PERKS = [
    { id: 'fury', name: 'Fury', desc: 'Every third swing is a heavy one, not every fifth.', opts: { fury: true }, unlock: (t) => t.bosses >= 1, how: 'Beat a boss' },
    { id: 'rally', name: 'Rally', desc: 'Cards rest a quarter less.', opts: { rest: 0.75 }, unlock: (t) => t.stars >= 25, how: 'Earn 25 stars' },
    { id: 'fortify', name: 'Fortify', desc: 'Your coin pile holds 20 seconds.', opts: { pile: 20 }, unlock: (t) => t.flawless >= 1, how: 'Win with your pile full' },
  ];

  return {
    PERKS,
    STATS, STAT_NAMES, RARITY_BONUS, ROLES, ENEMIES, ENEMY_LIST: E, WORLDS, BOSS_EVERY, ACHIEVEMENTS, STAR_TIMES, LEVEL_POINTS,
    hash, seeded, order, beastStats, battleNumbers, canBattle, systemOf, cooldownOf, beastRadius,
    enemyStats, enemyRadius, level, levelPoints, difficulty, clearMinutes,
  };
})();

if (typeof module !== 'undefined') module.exports = BATTLE_DATA;
