/**
 * Merge Beasts 1.5: World 7, the Universal Mutants (Sam, 23 Nov; UPDATE_1.5.md section 2).
 *
 * A late-game world unlike the six before it. Fewer enemies, far bigger and far stronger, each
 * with several attacks of its own; nearly every level is a boss fight, and a level is won by
 * beating its bosses (their camp has no coin pile), and lost if they take yours. Beasts of both
 * solar systems (and the comet's, later) battle here.
 *
 * The bosses' big attacks are telegraphed: the ground where one will land glows for a moment
 * first (a ring for a slam, a cone for a breath, a lane for a frost wave), so placing beasts out of
 * it, or answering with a special, is the strategy. A stun (Freeze, Quake, Leap, Gravity well) while
 * a boss winds up interrupts it. At two thirds and one third of its health a boss changes (a
 * phase): new attacks, faster, or it calls its peons. After three minutes it rages (stronger and
 * faster), so stalling does not win.
 *
 * Damage types: fire burns for a while after, frost slows and freezes, poison lingers, crushing
 * knocks back, shock stuns. A beast's element takes less of some (fire beasts shrug off fire).
 * Bosses are weak to some elements and resist others, and some are armoured in front (the dragon),
 * or have a weak point only shots can reach (the colossus).
 *
 * This file is the numbers and the rules (used by the battle and by tools/battle_sim.mjs in Node);
 * mutants_art.js draws them, battle.js shows the telegraphs.
 */
const MUTANTS = (() => {
  const D = BATTLE_DATA;
  const TAU = Math.PI * 2;
  const AW = 1000, AH = 2000;
  const YOUR_PILE = { x: 500, y: 1880 };
  const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return Math.abs(d); };
  const clampX = (x, r = 20) => Math.max(r, Math.min(AW - r, x));
  const clampY = (y) => Math.max(60, Math.min(AH - 60, y));

  // ------------------------------------------------------------------ damage types
  const TYPES = {
    fire: { name: 'Fire', icon: '🔥', text: 'burns for a few seconds after', col: '#ff7a2a' },
    frost: { name: 'Frost', icon: '❄', text: 'slows, and its big blows freeze', col: '#9ae8ff' },
    poison: { name: 'Poison', icon: '☠', text: 'keeps hurting for a while', col: '#9dff4a' },
    crush: { name: 'Crushing', icon: '💥', text: 'knocks beasts back', col: '#e0b070' },
    shock: { name: 'Shock', icon: '⚡', text: 'stuns for a moment', col: '#fff27a' },
    // 1.5, World 8: four more.
    acid: { name: 'Acid', icon: '🧪', text: 'eats armour: beasts it hits take a quarter more damage for a while', col: '#c8ff2a' },
    void: { name: 'Void', icon: '🕳', text: 'saps strength: beasts it hits strike a third softer, and it mends whoever cast it', col: '#b06aff' },
    sonic: { name: 'Sonic', icon: '🔊', text: 'deafens: beasts it hits cannot use their special for a while', col: '#ff8ad8' },
    gravity: { name: 'Gravity', icon: '🌀', text: 'drags beasts in and slows them', col: '#8a9aff' },
  };
  /** How much of each type a beast takes by its element; a beast that takes less also escapes its after-effect. */
  const RESIST = {
    fire: { FIRE: 0.5, WATER: 0.7 }, frost: { WATER: 0.5, FIRE: 0.7 }, poison: { EARTH: 0.5, VOID: 0.7 },
    crush: { EARTH: 0.6 }, shock: { COSMIC: 0.5, LIGHT: 0.7 },
    acid: { EARTH: 0.6, WATER: 0.7 }, void: { VOID: 0.5, DEITY: 0.6 }, sonic: { WIND: 0.5, COSMIC: 0.7 }, gravity: { COSMIC: 0.5, VOID: 0.7 },
  };
  const ELEMENT_WORD = { FIRE: 'Fire', WATER: 'Water', WIND: 'Wind', EARTH: 'Earth', LIGHT: 'Light', COSMIC: 'Cosmic', VOID: 'Void', DEITY: 'Deity' };
  const elementOf = (u) => (D.T(u.kind) || {}).element;

  // ------------------------------------------------------------------ the enemies of World 7
  const M = (skin, cloth, trim, eye, x) => Object.assign({ skin, cloth, trim, eye }, x);
  const addIn = (world, debut, id, name, role, look, note) => { const e = { id, name, world, debut, role, look, note }; D.ENEMY_LIST.push(e); D.ENEMIES[id] = e; };
  const add = (debut, id, name, role, look, note) => addIn(7, debut, id, name, role, look, note);
  // The ten bosses (a "mutant" body, drawn by mutants_art.js), each first met alone.
  add(1, 'hulk_goblin', 'Gorrak the Hulk Goblin', 'mutant', M('#6fae3a', '#5a3a22', '#c8ff5a', '#ffd23a', { plan: 'mutant', art: 'hulk', size: 4.1, boss: true }), 'A goblin grown as big as a house, with smaller goblins riding on his shoulders. Every few seconds he throws one over your line at your coin pile, and now and then he leaps and comes down with a slam that clears a whole crowd.');
  add(2, 'walking_hive', 'The Walking Hive', 'mutant', M('#e0a23a', '#5a3a10', '#ffe27a', '#ff4a2a', { plan: 'mutant', art: 'hive', size: 3.9, boss: true }), 'A great wasp nest striding about on six legs. Its back splits open to let out swarms, and it spits stings that poison. Fire makes it burn, and a burning hive lets out far fewer.');
  add(3, 'frost_giant', 'Rime the Frost Giant', 'mutant', M('#a8d8f0', '#3a5a7a', '#e8fbff', '#3ad8ff', { plan: 'mutant', art: 'frost', size: 4.3, boss: true }), 'A giant of blue ice with a club of glacier. He sends frost racing down a lane, freezing every beast in it, and hurls ice boulders. Fire beasts melt him; water beasts barely scratch him.');
  add(4, 'three_headed_serpent', 'Trisskar the Three-Headed Serpent', 'mutant', M('#3a8a5a', '#1e4a34', '#c8ff8a', '#ffe04a', { plan: 'mutant', art: 'serpent', size: 4.1, boss: true }), 'Three heads on one long body, and each picks its own target: the green one poisons, the blue one chills, the red one burns. Its tail lashes anything behind it, it is fast, and it hatches babies that race round your line for your coins.');
  add(5, 'mirror_witch', 'Vitriel the Mirror Witch', 'mutant', M('#e8e0f8', '#3a2a5a', '#c8b8ff', '#ffffff', { plan: 'mutant', art: 'witch', size: 3.3, boss: true }), 'She floats behind a ring of mirrors. Whatever special you use last, she copies and throws back at you. She makes glass doubles of herself, and slips away from anything that gets close.');
  add(6, 'twin_sol', 'Sol, the Sun Twin', 'mutant', M('#ffcf5a', '#8a3a10', '#fff2a0', '#ff6a1a', { plan: 'mutant', art: 'twinsol', size: 3.3, boss: true }), 'One of the Twin Titans, burning gold. While his sister is near they mend each other, and if only one of them falls, the other raises them again a few seconds later. Beat them together.');
  add(6, 'twin_luna', 'Luna, the Moon Twin', 'mutant', M('#d8e0f8', '#2a3a6a', '#ffffff', '#7ad8ff', { plan: 'mutant', art: 'twinluna', size: 3.2, boss: true }), 'The other Twin Titan, pale silver. She throws cold moonbeams down the field. Fire hurts her most; her brother hates water.');
  add(7, 'rot_behemoth', 'The Rot Behemoth', 'mutant', M('#8a9a4a', '#4a3a2a', '#c8ff4a', '#ff3a6a', { plan: 'mutant', art: 'rot', size: 4.2, boss: true }), 'A swollen heap of rot on stumpy legs. It coughs clouds of poison that hang over the ground, its blisters burst over whatever is near, and plague rats pour out of it. Light burns it clean.');
  add(8, 'colossus', 'The Colossus', 'mutant', M('#9a8a7a', '#5a4a3a', '#ffb43a', '#ffd86a', { plan: 'mutant', art: 'colossus', size: 4.8, boss: true }), 'A walking statue as tall as a tower. Its footsteps knock everything back, and its stone shrugs off blows. Only its glowing core is weak, and only beasts that shoot can reach it; it fires its core beam at the ones that do.');
  add(9, 'dragon', 'Pyraxis the Dragon', 'mutant', M('#c83a2a', '#5a1410', '#ffb43a', '#ffe04a', { plan: 'mutant', art: 'dragon', size: 4.5, boss: true }), 'The oldest dragon there is. It breathes fire across the field, sweeping from one side of your coin pile to the other, and the fire keeps burning. Its scales turn blows from the front, but beasts that flank it meet its tail.');
  add(20, 'omega_chimera', 'The Omega Chimera', 'mutant', M('#c8a05a', '#4a2a5a', '#ff5ae0', '#ffffff', { plan: 'mutant', art: 'chimera', size: 4.7, boss: true }), 'Every mutant there is, in one body: a lion that roars, a goat that calls the frost, a serpent for a tail and a dragon\'s wings. It fights a different way in each of its three phases. This is the last battle.');
  // Their peons and companions.
  add(1, 'goblin_runt', 'Goblin Runt', 'runner', M('#7ab84a', '#5a3a22', '#c8ff5a', '#ffe04a', { plan: 'mutant', art: 'goblin', kind: 'runt', size: 1, trait: null }), 'One of the small goblins Gorrak carries. Thrown, it lands near your coin pile and goes straight for it.');
  add(10, 'goblin_brute', 'Goblin Brute', 'brute', M('#5a9a3a', '#4a2a1a', '#c8ff5a', '#ff5a3a', { plan: 'mutant', art: 'goblin', kind: 'brute', size: 1.4, trait: 'knock' }), 'A big goblin from Gorrak\'s war band, with a club and no patience.');
  add(10, 'goblin_shaman', 'Goblin Shaman', 'caster', M('#6aa84a', '#3a2a4a', '#c8ff5a', '#c8a0ff', { plan: 'mutant', art: 'goblin', kind: 'shaman', size: 1.05, trait: 'heal' }), 'Chants over Gorrak and the rest, mending them. Get to it first.');
  add(2, 'hive_drone', 'Hive Drone', 'swarm', M('#ffcf3a', '#1a1408', '#ffe27a', '#1a1408', { plan: 'float', size: 0.8, body: 'bug', trait: null }), 'A wasp the size of a cat. They come out of the hive in clouds.');
  add(3, 'frost_sprite', 'Frost Sprite', 'caster', M('#cfefff', '#5a8aaa', '#ffffff', '#3ad8ff', { plan: 'float', size: 0.85, body: 'star', trait: 'slow' }), 'A spark of living ice that follows the giant about, chilling whatever it hits.');
  add(4, 'hatchling', 'Serpent Hatchling', 'runner', M('#4aa86a', '#1e4a34', '#c8ff8a', '#ffe04a', { plan: 'serpent', size: 0.8, trait: null }), 'A baby of the three-headed serpent, born running. They race down the edges of the field for your coins.');
  add(5, 'glass_double', 'Glass Double', 'grunt', M('#e8f0ff', '#8a9ac8', '#ffffff', '#c8b8ff', { plan: 'float', size: 1, body: 'sheet', trait: null }), 'A copy of the Mirror Witch in glass. It shatters easily, but it soaks up blows meant for her.');
  add(7, 'plague_rat', 'Plague Rat', 'swarm', M('#6a6a4a', '#3a3a2a', '#c8ff4a', '#ff3a3a', { plan: 'quad', size: 0.75, trait: null }), 'Rats from the behemoth\'s rot. Small, quick and many.');
  add(7, 'mutant_medic', 'Mutant Medic', 'caster', M('#d8c8a8', '#4a6a4a', '#9dff4a', '#9dff4a', { plan: 'biped', size: 1, head: 'mask', weapon: 'potion', trait: 'heal' }), 'A masked healer who mends the bosses. Leave one alive and the fight goes on for ever.');
  add(8, 'stone_sentry', 'Stone Sentry', 'tank', M('#8a8070', '#5a5040', '#ffb43a', '#ffd86a', { plan: 'biped', size: 1.3, build: 'heavy', head: 'helm', weapon: 'hammer', armor: true, trait: 'aura' }), 'Chipped off the Colossus. It guards the others, who take a quarter less beside it.');
  add(14, 'wyrmling', 'Wyrmling', 'caster', M('#d84a2a', '#5a1410', '#ffb43a', '#ffe04a', { plan: 'float', size: 0.95, body: 'bat', trait: null }), 'A young dragon, already spitting fire from the back line.');

  // ------------------------------------------------------------------ the bosses' ways of fighting
  /**
   * Each boss: its walking speed and reach (fixed: a giant is slow whatever its points), its health
   * and hitting power against the level's points, how many it hits with a swing, the damage type of
   * its blows, the elements it is weak to and resists, its moves and its phases.
   * A move: `every` seconds (`first` the first time), a wind-up of `wind` seconds with its area
   * shown on the ground, damage `dmg` times its blow; `phase` is the first phase it is used in.
   * Counts given as lists are by phase.
   */
  const BOSSES = {
    hulk_goblin: {
      speed: 60, reach: 55, hp: 1, atk: 1, multi: 2, area: 0.5, type: 'crush', weak: { LIGHT: 1.6 }, resist: { EARTH: 0.5 },
      moves: [
        { kind: 'throw', every: 9, first: 5, wind: 0.8, flight: 1.4, count: [1, 1, 2], peon: 'goblin_runt', mul: 0.45, dmg: 1.5 },
        { kind: 'leap', every: 12, first: 10, wind: 1.4, r: 200, dmg: 6, knock: 150, range: 650, type: 'crush' },
        { kind: 'slam', every: 9, first: 3, wind: 1.0, r: 160, dmg: 3.5, knock: 120, phase: 1, type: 'crush' },
      ],
      phases: [{ at: 0.66, text: 'Gorrak bellows for more goblins!', spawn: [['goblin_runt', 2]] }, { at: 0.33, text: 'Gorrak goes berserk!', haste: 0.75, speed: 1.25 }],
    },
    walking_hive: {
      speed: 46, reach: 60, hp: 1.05, atk: 0.7, multi: 2, area: 0.4, type: 'poison', weak: { FIRE: 1.75 }, resist: { WIND: 0.5 },
      moves: [
        { kind: 'swarm', every: 7, first: 3, wind: 1.0, count: [3, 4, 6], peon: 'hive_drone', mul: 0.5 },
        { kind: 'sting', every: 9, first: 6, wind: 0.8, count: [3, 4, 5], range: 520, r: 55, dmg: 2, type: 'poison' },
      ],
      phases: [{ at: 0.66, text: 'The hive splits open!', spawn: [['hive_drone', 4]] }, { at: 0.33, text: 'The queen stirs inside!', haste: 0.75 }],
    },
    frost_giant: {
      speed: 50, reach: 65, hp: 1.15, atk: 1, multi: 2, area: 0.5, type: 'frost', weak: { FIRE: 1.75 }, resist: { WATER: 0.4 },
      moves: [
        { kind: 'lane', every: 10, first: 5, wind: 1.4, w: 170, dmg: 3, freeze: 2, ice: 6, count: [1, 1, 2], type: 'frost' },
        { kind: 'boulder', every: 11, first: 9, wind: 1.5, r: 150, dmg: 5, range: 800, type: 'frost' },
        { kind: 'slam', every: 8, first: 4, wind: 0.9, r: 170, dmg: 2.5, freeze: 1, phase: 1, type: 'frost' },
      ],
      phases: [{ at: 0.66, text: 'The air freezes solid!', spawn: [['frost_sprite', 2]] }, { at: 0.33, text: 'Rime calls the blizzard!', haste: 0.8 }],
    },
    three_headed_serpent: {
      speed: 100, reach: 150, hp: 1, atk: 0.8, multi: 1, area: 0, type: 'poison', weak: { EARTH: 1.6 }, resist: { VOID: 0.5 },
      heads: [{ type: 'poison', col: '#9dff4a' }, { type: 'frost', col: '#7ad8ff' }, { type: 'fire', col: '#ff7a2a' }],
      moves: [
        { kind: 'tail', every: 5, first: 3, wind: 0.6, r: 230, dmg: 4, knock: 150 },
        { kind: 'brood', every: 11, first: 7, wind: 1.0, count: [2, 3, 4], peon: 'hatchling', mul: 0.45 },
        { kind: 'charge', every: 10, first: 12, wind: 1.2, len: 650, dmg: 3.5, knock: 120, phase: 1, type: 'crush' },
      ],
      phases: [{ at: 0.66, text: 'Trisskar sheds its skin!', heal: 0.04, haste: 0.9 }, { at: 0.33, text: 'All three heads rage!', haste: 0.75, heads: 0.7 }],
    },
    mirror_witch: {
      speed: 70, reach: 300, ranged: true, hp: 0.75, atk: 0.85, multi: 1, area: 0, type: 'shock', weak: { VOID: 1.6 }, resist: { LIGHT: 0.4 },
      moves: [
        { kind: 'mirror', every: 9, first: 8, wind: 1.2 },
        { kind: 'clones', every: 14, first: 4, wind: 0.8, count: [2, 2, 3], peon: 'glass_double', mul: 0.5 },
        { kind: 'blink', every: 7, first: 4, wind: 0.3 },
      ],
      phases: [{ at: 0.66, text: 'The mirror cracks!', spawn: [['glass_double', 2]] }, { at: 0.33, text: 'A hall of mirrors!', haste: 0.75, shield: 4 }],
    },
    twin_sol: {
      speed: 75, reach: 60, hp: 0.6, atk: 0.85, multi: 2, area: 0.4, type: 'fire', weak: { WATER: 1.6 }, resist: { FIRE: 0.4 }, twin: 'twin_luna',
      moves: [{ kind: 'slam', every: 8, first: 5, wind: 1.0, r: 170, dmg: 3, type: 'fire', name: 'Solar flare' }],
      phases: [{ at: 0.5, text: 'Sol blazes!', haste: 0.75 }],
    },
    twin_luna: {
      speed: 70, reach: 260, ranged: true, hp: 0.55, atk: 0.85, multi: 1, area: 0, type: 'frost', weak: { FIRE: 1.6 }, resist: { WATER: 0.4 }, twin: 'twin_sol',
      moves: [{ kind: 'beam', every: 8, first: 6, wind: 1.2, w: 110, len: 1100, dmg: 3.5, type: 'frost', aim: 'cluster', name: 'Moonbeam' }],
      phases: [{ at: 0.5, text: 'Luna draws down the moon!', haste: 0.75 }],
    },
    rot_behemoth: {
      speed: 40, reach: 60, hp: 1.3, atk: 0.8, multi: 2, area: 0.6, type: 'poison', weak: { LIGHT: 1.6, DEITY: 1.6 }, resist: { EARTH: 0.5 },
      moves: [
        { kind: 'gas', every: 9, first: 4, wind: 1.0, count: [3, 3, 5], r: 115, dmg: 1, linger: 6, range: 700, type: 'poison' },
        { kind: 'swarm', every: 12, first: 8, wind: 0.9, count: [3, 4, 5], peon: 'plague_rat', mul: 0.45 },
      ],
      phases: [{ at: 0.66, text: 'Its blisters burst!', burst: { r: 230, dmg: 3, type: 'poison' } }, { at: 0.33, text: 'The rot spreads!', haste: 0.8, burst: { r: 260, dmg: 3, type: 'poison' } }],
    },
    colossus: {
      speed: 36, reach: 70, hp: 1.5, atk: 1.1, multi: 2, area: 0.6, type: 'crush', core: { melee: 0.35, ranged: 1.6 }, resist: { EARTH: 0.5 },
      moves: [
        { kind: 'steps', every: 2.6, first: 2, wind: 0.25, r: 150, dmg: 0.6, knock: 90, type: 'crush' },
        { kind: 'beam', every: 11, first: 7, wind: 1.5, w: 120, len: 1400, dmg: 6, type: 'shock', aim: 'shooter', name: 'Core beam' },
        { kind: 'slam', every: 12, first: 10, wind: 1.4, r: 270, dmg: 4, stun: 1, phase: 1, type: 'crush', name: 'Quake' },
      ],
      phases: [{ at: 0.66, text: 'Its core blazes!', spawn: [['stone_sentry', 2]] }, { at: 0.33, text: 'The Colossus tears free!', speed: 1.5, haste: 0.8 }],
    },
    dragon: {
      speed: 60, reach: 85, hp: 1.25, atk: 1.05, multi: 2, area: 0.5, type: 'fire', armour: { front: 0.5, side: 1.15, back: 1.6 }, weak: { WATER: 1.6 }, resist: { FIRE: 0.3 },
      moves: [
        { kind: 'breath', every: 10, first: 6, wind: 1.3, dur: 2.0, spread: Math.PI / 4, range: 700, dmg: 1.2, type: 'fire' },
        { kind: 'tail', every: 4.5, first: 3, wind: 0.5, r: 240, dmg: 5, knock: 170 },
        { kind: 'gust', every: 13, first: 15, wind: 1.0, r: 330, knock: 170, phase: 1 },
        { kind: 'leap', every: 14, first: 4, wind: 1.6, r: 210, dmg: 4, knock: 120, range: 800, type: 'fire', phase: 2, name: 'Dive' },
      ],
      phases: [{ at: 0.66, text: 'Pyraxis spreads its wings!' }, { at: 0.33, text: 'Dragonfire!', haste: 0.65 }],
    },
    omega_chimera: {
      speed: 66, reach: 80, hp: 1.6, atk: 1.15, multi: 3, area: 0.5, type: 'crush', weak: { DEITY: 1.5 }, enrage: 150,
      moves: [
        { kind: 'roar', every: 11, first: 6, wind: 0.8, r: 250, stun: 1.2, upto: 0, name: 'Lion\'s roar' },
        { kind: 'leap', every: 10, first: 3, wind: 1.2, r: 190, dmg: 5, knock: 140, range: 700, type: 'crush', upto: 0, name: 'Pounce' },
        { kind: 'lane', every: 9, first: 2, wind: 1.3, w: 170, dmg: 3, freeze: 2, ice: 6, count: [1, 2, 2], type: 'frost', phase: 1, upto: 1, name: 'Goat\'s frost' },
        { kind: 'roar', every: 12, first: 6, wind: 0.8, r: 250, stun: 1.2, phase: 1, upto: 1, name: 'Lion\'s roar' },
        { kind: 'breath', every: 9, first: 2, wind: 1.2, dur: 2.0, spread: Math.PI / 4, range: 700, dmg: 1.2, type: 'fire', phase: 2 },
        { kind: 'tail', every: 5, first: 3, wind: 0.5, r: 240, dmg: 4.5, knock: 160, type: 'poison', phase: 2 },
        { kind: 'brood', every: 12, first: 6, wind: 1.0, count: [3, 3, 3], peon: 'hatchling', mul: 0.45, phase: 2 },
      ],
      phases: [{ at: 0.66, text: 'The goat\'s head wakes: frost!' }, { at: 0.33, text: 'Wings and fire: the last form!', haste: 0.85 }],
    },
  };

  // ------------------------------------------------------------------ the twenty levels
  /**
   * Built by hand (giants are not dealt like the other worlds' crowds). Each: its name, its bosses
   * ([id, seconds, across, { after: true } to wait for the boss before]), its peons ([seconds, id,
   * across, how strong]), and peons that keep coming ([every, id, from]).
   */
  const LEVELS = [
    { name: 'Gorrak the Hulk Goblin', tip: 'Keep a guard at home: he throws goblins at your coins.', bosses: [['hulk_goblin', 3, 0.5]], peons: [[1, 'goblin_runt', 0.35], [1.3, 'goblin_runt', 0.65]] },
    { name: 'The Walking Hive', tip: 'Fire beasts set it burning, and a burning hive lets out fewer wasps.', bosses: [['walking_hive', 3, 0.5]], peons: [[1, 'hive_drone', 0.4], [1.2, 'hive_drone', 0.5], [1.4, 'hive_drone', 0.6]] },
    { name: 'Rime the Frost Giant', tip: 'Watch for the glowing lane, and bring fire.', bosses: [['frost_giant', 3, 0.5]], peons: [[25, 'frost_sprite', 0.3], [55, 'frost_sprite', 0.7]] },
    { name: 'Trisskar the Three-Headed Serpent', tip: 'Its hatchlings run down the edges: guard both sides of your pile.', bosses: [['three_headed_serpent', 3, 0.5]], peons: [] },
    { name: 'Vitriel the Mirror Witch', tip: 'She throws your last special back at you. Choose which one she sees.', bosses: [['mirror_witch', 3, 0.5]], peons: [[1, 'glass_double', 0.35], [1.3, 'glass_double', 0.65]] },
    { name: 'The Twin Titans', tip: 'Bring them down together, or the fallen one rises again.', bosses: [['twin_sol', 3, 0.3], ['twin_luna', 3, 0.7]], peons: [] },
    { name: 'The Rot Behemoth', tip: 'Stay out of the green clouds, and stop the medics.', bosses: [['rot_behemoth', 3, 0.5]], peons: [[12, 'mutant_medic', 0.3], [12.4, 'mutant_medic', 0.7]], every: [[30, 'mutant_medic', 40]] },
    { name: 'The Colossus', tip: 'Only beasts that shoot can hurt its core. Spread them out: it fires back.', bosses: [['colossus', 3, 0.5]], peons: [[1, 'stone_sentry', 0.3]] },
    { name: 'Pyraxis the Dragon', tip: 'Its fire sweeps toward your pile. Hit it from the sides, not from behind.', bosses: [['dragon', 3, 0.5]], peons: [] },
    { name: 'Gorrak\'s War Band', tip: 'The shamans mend Gorrak. Get to them first.', bosses: [['hulk_goblin', 4, 0.5]], peons: [[1, 'goblin_brute', 0.25], [1.3, 'goblin_brute', 0.75], [5, 'goblin_shaman', 0.35], [5.3, 'goblin_shaman', 0.65]], every: [[25, 'goblin_brute', 30], [35, 'goblin_shaman', 45]] },
    { name: 'Frost on the Hive', tip: 'Two bosses at once: fire hurts them both.', bosses: [['frost_giant', 3, 0.3], ['walking_hive', 12, 0.7]], peons: [[1, 'frost_sprite', 0.5]] },
    { name: 'The Serpent\'s Nest', tip: 'Medics keep the serpent alive. Hatchlings keep coming.', bosses: [['three_headed_serpent', 3, 0.5]], peons: [[6, 'mutant_medic', 0.3], [6.4, 'mutant_medic', 0.7], [10, 'hatchling', 0.2], [10.3, 'hatchling', 0.8]], every: [[22, 'hatchling', 20], [40, 'mutant_medic', 50]] },
    { name: 'Glass and Stone', tip: 'She copies your specials while it hammers your line.', bosses: [['colossus', 3, 0.35], ['mirror_witch', 14, 0.65]], peons: [[1, 'stone_sentry', 0.6]] },
    { name: 'Dragonfire', tip: 'Wyrmlings spit fire from behind it. Water beasts take the heat best.', bosses: [['dragon', 4, 0.5]], peons: [[1, 'wyrmling', 0.3], [1.3, 'wyrmling', 0.7]], every: [[28, 'wyrmling', 30]] },
    { name: 'The Plague Twins', tip: 'Rats and rot while the twins mend each other.', bosses: [['twin_sol', 3, 0.3], ['twin_luna', 3, 0.7]], peons: [[1, 'plague_rat', 0.4], [1.2, 'plague_rat', 0.5], [1.4, 'plague_rat', 0.6], [15, 'mutant_medic', 0.5]], every: [[24, 'plague_rat', 20]] },
    { name: 'The Long Winter', tip: 'Frost lanes and footsteps: keep your line loose.', bosses: [['colossus', 3, 0.3], ['frost_giant', 10, 0.7]], peons: [[1, 'frost_sprite', 0.5]] },
    { name: 'Fire and Fang', tip: 'The serpent is fast and the dragon is armoured. Choose your elements.', bosses: [['three_headed_serpent', 3, 0.3], ['dragon', 18, 0.7]], peons: [] },
    { name: 'The Swarm Queen\'s Mirror', tip: 'Wasps, mirrors and medics. Fire for the hive, Void for the witch.', bosses: [['walking_hive', 3, 0.3], ['mirror_witch', 10, 0.7]], peons: [[14, 'mutant_medic', 0.5]], every: [[40, 'mutant_medic', 50]] },
    { name: 'The Gauntlet', tip: 'Three in turn: Gorrak, then the Twins, then Pyraxis.', bosses: [['hulk_goblin', 3, 0.5], ['twin_sol', 0, 0.3, { after: true }], ['twin_luna', 0, 0.7, { with: true }], ['dragon', 0, 0.5, { after: true }]], peons: [] },
    { name: 'The Omega Chimera', tip: 'Three forms: lion, then goat and frost, then wings and fire.', bosses: [['omega_chimera', 4, 0.5]], peons: [[1, 'mutant_medic', 0.5]] },
  ];
  const LEVEL_COUNT = LEVELS.length;
  const LEVELS_BY = { 7: LEVELS };
  D.PATTERNS.mutant = { name: 'Giant', tip: 'A boss fight: beat the boss to win. Their camp has no coin pile, so guard yours' };

  /** A mutant world's level n (World 7 or 8): its bosses and peons, the battle's settings. */
  function level(n, world = 7) {
    const L = LEVELS_BY[world][n - 1];
    const spawns = [];
    const inTurn = L.bosses.some((x) => x[3] && (x[3].after || x[3].with));
    for (const [id, t, x, o = {}] of L.bosses) {
      const e = D.ENEMIES[id];
      // In turn: the next boss waits for the one before to fall (one that comes with it does not).
      spawns.push({ t: inTurn && (o.after || o.with) ? 0 : t, foe: id, x, boss: true, afterBoss: !!o.after, announce: o.with ? null : `${e.name}!` });
    }
    for (const [t, id, x, mul = 0.6] of L.peons) spawns.push({ t, foe: id, x, mul });
    for (const [every, id, from] of L.every || []) for (let t = from, i = 0; t < 420; t += every, i++) spawns.push({ t, foe: id, x: i % 2 ? 0.3 : 0.7, mul: 0.6 });
    // Bosses in turn keep their order (the queue waits at each); otherwise all by time.
    if (!inTurn) spawns.sort((a, b) => a.t - b.t);
    const bossIds = [...new Set(L.bosses.map((b) => b[0]))];
    const fresh = bossIds.find((id) => D.ENEMIES[id].debut === n && D.ENEMIES[id].world === world) || null;
    const id = `${world}-${n}`;
    return {
      id, world, n, boss: true, points: D.LEVEL_POINTS[id] || D.levelPoints(world, n), spawns, rally: [], garrison: [], rule: null, theme: null,
      maxEnemies: L.max || (world >= 8 ? 24 : 16), pattern: 'mutant', pile: 15, starTime: D.STAR_TIMES[id] || 150 + n * 3,
      fresh, bossFoe: bossIds[0], bossIds, name: L.name, tip: L.tip, win: 'bosses', loop: false,
    };
  }

  // ------------------------------------------------------------------ setting a boss up
  function setup(b, u) {
    const def = BOSSES[u.kind];
    if (!def) return;
    u.mutant = def;
    u.boss = true;
    if (def.r) u.r = def.r;
    u.baseSpeed = u.speed = def.speed;
    u.reach = def.reach;
    u.shooter = !!def.ranged;
    u.maxHp *= def.hp; u.hp = u.maxHp;
    u.light *= def.atk;
    u.multi = def.multi || 1;
    u.area = def.area || 0;
    u.dmgType = def.type || null;
    u.phase = 0;
    u.haste = 1;
    u.spawnT = b.time;
    u.moveAt = {};
    def.moves.forEach((m, i) => { u.moveAt[i] = b.time + (m.first != null ? m.first : m.every); });
    u.facing = Math.PI / 2;
    if (def.heads) { u.noBasic = true; u.heads = def.heads.map((h, i) => ({ ...h, next: b.time + 1 + i * 0.35, target: null, last: -9 })); }
    if (def.twin) u.twin = def.twin;
    b.mutantBosses = (b.mutantBosses || 0) + 1;
  }

  // ------------------------------------------------------------------ helpers over the field
  const beasts = (b) => b.units.filter((o) => o.side === 'you' && o.state !== 'dying' && !o.airborne);
  const foesAlive = (b) => b.units.filter((o) => o.side === 'foe' && o.state !== 'dying');
  const within = (list, x, y, r) => list.filter((o) => Math.hypot(o.x - x, o.y - y) - o.r <= r);
  /** Where the most beasts stand within `r` of one of them (within `range` of the boss). */
  function cluster(b, u, r, range = 9999) {
    const list = beasts(b).filter((o) => Math.hypot(o.x - u.x, o.y - u.y) <= range);
    let best = null, n = 0;
    for (const o of list) { const k = within(list, o.x, o.y, r).length; if (k > n) { n = k; best = o; } }
    return best ? { x: best.x, y: best.y, n } : null;
  }
  /** Short names for the call-outs. */
  const SHORT = { hulk_goblin: 'Gorrak', walking_hive: 'The hive', frost_giant: 'Rime', three_headed_serpent: 'Trisskar', mirror_witch: 'Vitriel', twin_sol: 'Sol', twin_luna: 'Luna', rot_behemoth: 'The behemoth', colossus: 'The Colossus', dragon: 'Pyraxis', omega_chimera: 'The Chimera' };
  const zone = (b, z) => { z.id = (b.zoneN = (b.zoneN || 0) + 1); z.start = b.time; b.zones.push(z); return z; };
  function knockFrom(b, o, x, y, dist) {
    if (o.mutant || dist <= 0 || (o.passives && o.passives.unshakeable)) return;
    if (elementOf(o) === 'EARTH') dist *= 0.4;
    const d = Math.hypot(o.x - x, o.y - y) || 1;
    o.x = clampX(o.x + ((o.x - x) / d) * dist, o.r + 4);
    o.y = Math.max(140, Math.min(AH - 40, o.y + ((o.y - y) / d) * dist));
    o.stunUntil = Math.max(o.stunUntil, b.time + 0.35);
  }
  function blast(b, u, list, dmg, type, extra = {}) {
    for (const o of list) {
      b.hurt(o, dmg, u, true, type);
      if (extra.knock) knockFrom(b, o, extra.kx != null ? extra.kx : u.x, extra.ky != null ? extra.ky : u.y, extra.knock);
      if (extra.stun) o.stunUntil = Math.max(o.stunUntil, b.time + extra.stun);
      if (extra.freeze && o.state !== 'dying') freeze(b, o, extra.freeze);
    }
  }
  /**
   * World 7's giants hurt your coin pile itself (Sam, 23 Nov: they need not kill every beast first):
   * an attack whose area covers the pile takes seconds off it, and a giant within reach of it
   * strikes it as well as whatever is fighting it.
   */
  const PILE_R = 72;
  function takePile(b, sec, u) {
    if (b.result || !(sec > 0)) return;
    b.piles.you = Math.max(0, b.piles.you - sec);
    b.events.push({ type: 'mutant', kind: 'pile', unit: u, sec });
    if (b.piles.you <= 0) b.finish('lost');
  }
  const pileHit = (b, x, y, r, sec, u) => { if (Math.hypot(YOUR_PILE.x - x, YOUR_PILE.y - y) <= r + PILE_R * 0.8) takePile(b, sec, u); };
  function freeze(b, o, sec) {
    const el = elementOf(o);
    if (o.passives && o.passives.frostproof) return;
    if (el === 'WATER' || el === 'FIRE') { o.slowUntil = Math.max(o.slowUntil, b.time + sec); return; }
    o.stunUntil = Math.max(o.stunUntil, b.time + sec); o.frozen = true;
  }
  const spawnAt = (b, id, x, y, mul, extra = {}) => {
    b.spawnFoe({ foe: id, x: 0.5, mul, ...extra });
    const m = b.units[b.units.length - 1];
    m.x = clampX(x, m.r + 10); m.y = clampY(y);
    return m;
  };

  // ------------------------------------------------------------------ each step
  /** A boss's turn: stunned (a wind-up is interrupted), raging, a move under way, or a new one. True: it does nothing else. */
  function think(b, u, dt) {
    const def = u.mutant, now = b.time;
    // Hurled back at a phase change: sliding up the field, then staggered.
    const top = def.top || 200;
    if (u.slide && u.slide.until > now) {
      u.x = clampX(u.x + u.slide.vx * dt, u.r + 10); u.y = Math.max(top, u.y + u.slide.vy * dt);
      return true;
    }
    if (u.y < top) u.y = Math.min(top, u.y + 320 * dt);
    if (u.stunUntil > now) {
      // A giant shakes a stun off quickly, but a stun in a wind-up stops the move.
      if (u.stunUntil > now + 1.2) u.stunUntil = now + 1.2;
      if (u.cast && ((u.cast.stage === 'wind' && !u.cast.noStop) || u.cast.channel)) interrupt(b, u);
      return false;
    }
    if (!u.enraged && now - u.spawnT > (def.enrage || 180)) {
      u.enraged = true; u.light *= 1.4; u.baseSpeed *= 1.15; u.haste *= 0.75;
      b.events.push({ type: 'mutant', kind: 'enrage', unit: u, text: `${SHORT[u.kind]} is enraged!` });
    }
    if (u.twin) twinTick(b, u, dt);
    if (u.cast) { castTick(b, u, dt); return true; }
    if (u.heads) headsTick(b, u, dt);
    // Facing: towards what it fights, else down the field.
    if (u.target && u.target.state !== 'dying') u.facing = Math.atan2(u.target.y - u.y, u.target.x - u.x);
    else u.facing += (Math.PI / 2 - u.facing) * Math.min(1, dt * 2);
    // A move that is ready (the first in the list wins); none while it is anchored (a comet special).
    if (!(u.anchorUntil > now)) for (let i = 0; i < def.moves.length; i++) {
      const m = def.moves[i];
      if ((m.phase || 0) > u.phase || (m.upto != null && u.phase > m.upto) || now < u.moveAt[i]) continue;
      if (begin(b, u, m, i)) return true;
    }
    // Near your coin pile it strikes the pile too, whoever is fighting it; further off, it keeps
    // shouldering on towards the pile as it fights.
    const toPile = Math.hypot(YOUR_PILE.x - u.x, YOUR_PILE.y - u.y);
    if (toPile <= Math.min(u.reach, 90) + u.r + PILE_R * 0.8) {
      if (u.state !== 'capture' && !(u.pileAt > now)) { u.pileAt = now + 1.15 * u.haste; u.pileSwings = (u.pileSwings || 0) + 1; takePile(b, u.pileSwings % 4 === 0 ? 2.5 : 1, u); }
    } else if (u.state === 'fight' && !def.ranged) {
      const sp = u.speed * 0.45 * dt;
      u.x += ((YOUR_PILE.x - u.x) / toPile) * sp; u.y += ((YOUR_PILE.y - u.y) / toPile) * sp;
    }
    return false;
  }

  /** 1.5: comet specials. Stagger hurls a giant back up the field (stopping a wind-up); Dispel cancels one. */
  function stagger(b, o, dist) {
    const dx = o.x - YOUR_PILE.x, dy = o.y - YOUR_PILE.y, d = Math.hypot(dx, dy) || 1;
    dist = Math.min(dist, Math.max(0, o.y - ((o.mutant && o.mutant.top) || 200) - 40));
    o.slide = { vx: ((dx / d) * dist) / 0.45, vy: ((dy / d) * dist) / 0.45, until: b.time + 0.45 };
    if (o.cast && o.cast.stage === 'wind' && !o.cast.noStop) interrupt(b, o);
    b.events.push({ type: 'mutant', kind: 'text', unit: o, text: 'Staggered!', col: '#c8a8ff' });
  }
  function dispel(b, o) {
    if (o.cast) interrupt(b, o);
    b.events.push({ type: 'mutant', kind: 'text', unit: o, text: 'Dispelled!', col: '#c8a8ff' });
  }
  function interrupt(b, u) {
    const c = u.cast;
    if (c.zone) c.zone.dead = true;
    for (const z of c.zones || []) z.dead = true;
    u.airborne = false;
    u.cast = null;
    b.events.push({ type: 'mutant', kind: 'interrupt', unit: u });
  }

  /** Start move m (index i) if it has something to do; false if not now. */
  function begin(b, u, m, i) {
    const now = b.time;
    const wind = m.wind * (u.enraged ? 0.85 : 1);
    const at = now + wind;
    const cnt = Array.isArray(m.count) ? m.count[Math.min(u.phase, m.count.length - 1)] : m.count || 1;
    const all = beasts(b);
    const c = { move: m, i, stage: 'wind', at, zones: [] };
    switch (m.kind) {
      case 'slam': case 'steps': case 'roar': {
        if (!within(all, u.x, u.y, m.r + 40).length) { u.moveAt[i] = now + 1; return false; }
        if (m.kind === 'steps' && u.state !== 'walk' && u.state !== 'fight') return false;
        c.zone = zone(b, { shape: 'ring', x: u.x, y: u.y, r: m.r, at, owner: u.uid, type: m.type || null, follow: true });
        break;
      }
      case 'leap': {
        const p = cluster(b, u, m.r * 0.8, m.range);
        if (!p) { u.moveAt[i] = now + 1.5; return false; }
        c.from = { x: u.x, y: u.y }; c.to = { x: clampX(p.x, u.r + 10), y: Math.min(AH - 160, Math.max(200, p.y)) };
        c.zone = zone(b, { shape: 'ring', x: c.to.x, y: c.to.y, r: m.r, at, owner: u.uid, type: m.type });
        u.airborne = true;
        u.state = 'walk'; u.capturing = false; // (off the pile while in the air)
        c.noStop = true;
        break;
      }
      case 'throw': {
        c.count = cnt; c.thrown = 0;
        break;
      }
      case 'breath': {
        if (!all.length) { u.moveAt[i] = now + 1; return false; }
        const base = Math.atan2(YOUR_PILE.y - u.y, YOUR_PILE.x - u.x);
        const dir = (u.breaths = (u.breaths || 0) + 1) % 2 ? 1 : -1;
        c.a0 = base - dir * m.spread; c.a1 = base + dir * m.spread; c.base = base;
        c.zone = zone(b, { shape: 'cone', x: u.x, y: u.y, r: m.range, a: base, spread: m.spread, at, owner: u.uid, type: 'fire' });
        break;
      }
      case 'tail': {
        // Something behind it or at its sides, close.
        const back = u.facing + Math.PI;
        const behind = all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) - o.r <= m.r && angDiff(Math.atan2(o.y - u.y, o.x - u.x), back) < 1.25);
        if (!behind.length) { u.moveAt[i] = now + 0.5; return false; }
        c.zone = zone(b, { shape: 'cone', x: u.x, y: u.y, r: m.r, a: back, spread: 1.25, at, owner: u.uid, type: m.type || 'crush' });
        break;
      }
      case 'brood': case 'swarm': case 'clones': {
        c.count = cnt;
        break;
      }
      case 'sting': {
        const t = all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) <= m.range).sort((a, b2) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b2.x - u.x, b2.y - u.y)).slice(0, cnt);
        if (!t.length) { u.moveAt[i] = now + 1; return false; }
        for (const o of t) c.zones.push(zone(b, { shape: 'ring', x: o.x, y: o.y, r: m.r, at: at + 0.45, owner: u.uid, type: m.type }));
        break;
      }
      case 'gas': {
        const t = all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) <= m.range);
        if (!t.length) { u.moveAt[i] = now + 1; return false; }
        const picks = [];
        for (let k = 0; k < cnt; k++) {
          const o = t[(k * 7 + Math.floor(now * 3)) % t.length];
          const x = clampX(o.x + (k ? (k % 2 ? 1 : -1) * 60 * Math.ceil(k / 2) : 0), 60), y = o.y + (k % 3) * 30;
          if (picks.some((p) => Math.hypot(p.x - x, p.y - y) < m.r)) continue;
          picks.push({ x, y });
        }
        for (const p of picks) c.zones.push(zone(b, { shape: 'ring', x: p.x, y: p.y, r: m.r, at: at + 0.5, owner: u.uid, type: 'poison' }));
        break;
      }
      case 'lane': {
        // The lane with the most beasts in it (the second, a different one).
        const bins = [];
        for (let x = 90; x <= 910; x += 82) bins.push({ x, n: all.filter((o) => Math.abs(o.x - x) < m.w / 2 + o.r * 0.5 && o.y > u.y).length });
        bins.sort((a, b2) => b2.n - a.n);
        if (!bins[0] || !bins[0].n) { u.moveAt[i] = now + 1; return false; }
        const xs = [bins[0].x];
        if (cnt > 1) { const o = bins.find((q) => Math.abs(q.x - bins[0].x) > m.w * 1.4 && q.n); xs.push(o ? o.x : clampX(bins[0].x + (bins[0].x < 500 ? 1 : -1) * m.w * 2)); }
        for (const x of xs) c.zones.push(zone(b, { shape: 'lane', x, y: u.y, w: m.w, y2: AH, at, owner: u.uid, type: 'frost' }));
        break;
      }
      case 'boulder': {
        const p = cluster(b, u, m.r * 0.8, m.range);
        if (!p) { u.moveAt[i] = now + 1.5; return false; }
        c.to = p;
        c.zone = zone(b, { shape: 'ring', x: p.x, y: p.y, r: m.r, at: at + 0.7, owner: u.uid, type: m.type });
        break;
      }
      case 'beam': {
        let tgt = null;
        if (m.aim === 'shooter') tgt = all.filter((o) => o.reach >= 74).sort((a, b2) => Math.hypot(b2.x - u.x, b2.y - u.y) - Math.hypot(a.x - u.x, a.y - u.y))[0];
        if (!tgt) { const p = cluster(b, u, 120); tgt = p; }
        if (!tgt) { u.moveAt[i] = now + 1; return false; }
        const a = Math.atan2(tgt.y - u.y, tgt.x - u.x);
        c.a = a;
        c.zone = zone(b, { shape: 'line', x: u.x, y: u.y, a, len: m.len, w: m.w, at, owner: u.uid, type: m.type });
        break;
      }
      case 'charge': {
        const a = Math.atan2(YOUR_PILE.y - u.y, YOUR_PILE.x - u.x);
        c.a = a; c.len = Math.min(m.len, Math.hypot(YOUR_PILE.x - u.x, YOUR_PILE.y - u.y) - 200);
        if (c.len < 150) { u.moveAt[i] = now + 2; return false; }
        c.zone = zone(b, { shape: 'line', x: u.x, y: u.y, a, len: c.len, w: u.r * 1.8, at, owner: u.uid, type: m.type });
        c.hit = new Set();
        break;
      }
      case 'gust': {
        const front = all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) - o.r <= m.r && angDiff(Math.atan2(o.y - u.y, o.x - u.x), u.facing) < 0.9);
        if (front.length < 2) { u.moveAt[i] = now + 1; return false; }
        c.zone = zone(b, { shape: 'cone', x: u.x, y: u.y, r: m.r, a: u.facing, spread: 0.9, at, owner: u.uid, type: null });
        break;
      }
      case 'mirror': {
        const s = b.lastSpecial;
        c.copy = s ? s.ability : null;
        const R = { blast: 200, freeze: 220, gust: 250, quake: 230, gravity: 260, rally: 0, heal: 0, shield: 0, dash: 0 }[c.copy];
        c.zone = zone(b, { shape: 'ring', x: u.x, y: u.y, r: R || 120, at, owner: u.uid, type: 'shock', follow: true, label: c.copy ? D.ABILITIES[c.copy].icon : '✦' });
        break;
      }
      case 'blink': {
        const close = all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) - o.r - u.r < 60);
        if (!close.length) { u.moveAt[i] = now + 0.5; return false; }
        break;
      }
      default: {
        // A move of World 8's (mutants8.js): false if it has nothing to do now.
        const x = EXT[m.kind];
        if (!x || !x.begin(K, b, u, m, i, c, cnt, all)) return false;
      }
    }
    u.cast = c;
    u.moveAt[i] = now + m.every * u.haste * (u.enraged ? 0.75 : 1);
    b.events.push({ type: 'mutant', kind: 'cast', unit: u, move: m.kind, name: m.name || null, wind });
    return true;
  }

  /** A move under way: its wind-up, then it lands (and some go on a while: a breath, a charge). */
  function castTick(b, u, dt) {
    const c = u.cast, m = c.move, now = b.time, L = u.light;
    if (m.kind === 'leap' && c.stage === 'wind') {
      const k = Math.min(1, 1 - (c.at - now) / (m.wind * (u.enraged ? 0.85 : 1)));
      u.x = c.from.x + (c.to.x - c.from.x) * k; u.y = c.from.y + (c.to.y - c.from.y) * k;
      u.air = Math.sin(k * Math.PI);
    }
    if (m.kind === 'throw') {
      // One goblin after another, a third of a second apart, after the wind-up.
      if (now >= c.at + c.thrown * 0.35 && c.thrown < c.count) {
        // Over your line to the top of your safe zone, near enough your pile to run at it.
        const x = clampX(YOUR_PILE.x + (c.thrown % 2 ? 1 : -1) * (120 + ((now * 97) % 180)), 80), y = YOUR_PILE.y - 300 - ((now * 53) % 140);
        const z = zone(b, { shape: 'ring', x, y, r: 70, at: now + m.flight, owner: u.uid, type: 'crush', small: true, onLand: { spawn: m.peon, mul: m.mul, dmg: m.dmg } });
        b.events.push({ type: 'mutant', kind: 'throw', unit: u, from: { x: u.x - u.r * 0.6, y: u.y - u.r * 2.4 }, to: { x, y }, dur: m.flight, zone: z.id, peon: m.peon });
        c.thrown++;
      }
      if (c.thrown >= c.count && now >= c.at + c.count * 0.35 + 0.3) u.cast = null;
      return;
    }
    const x = EXT[m.kind];
    if (c.stage === 'wind') {
      if (c.zone && c.zone.follow) { c.zone.x = u.x; c.zone.y = u.y; }
      if (x && x.wind) x.wind(K, b, u, dt, c);
      if (now < c.at) return;
      c.stage = 'act';
      land(b, u, c, L);
      return;
    }
    // Moves that go on after landing.
    if (m.kind === 'breath') {
      const k = Math.min(1, (now - c.at) / m.dur);
      c.angle = c.a0 + (c.a1 - c.a0) * k;
      if (!(c.nextTick > now)) {
        c.nextTick = now + 0.2;
        const hit = beasts(b).filter((o) => { const d = Math.hypot(o.x - u.x, o.y - u.y); return d - o.r < m.range && d > u.r * 0.3 && angDiff(Math.atan2(o.y - u.y, o.x - u.x), c.angle) < 0.2 + o.r / Math.max(80, d); });
        for (const o of hit) b.hurt(o, L * m.dmg, u, false, 'fire');
        { const d = Math.hypot(YOUR_PILE.x - u.x, YOUR_PILE.y - u.y); if (d - PILE_R < m.range && angDiff(Math.atan2(YOUR_PILE.y - u.y, YOUR_PILE.x - u.x), c.angle) < 0.2 + PILE_R / Math.max(80, d)) takePile(b, 0.35, u); }
      }
      if (k >= 1) { u.cast = null; b.events.push({ type: 'mutant', kind: 'breath-end', unit: u }); }
      return;
    }
    if (m.kind === 'charge') {
      const sp = 950 * dt;
      c.done = (c.done || 0) + sp;
      u.x = clampX(u.x + Math.cos(c.a) * sp, u.r + 6); u.y = Math.min(AH - 220, u.y + Math.sin(c.a) * sp);
      for (const o of beasts(b)) if (!c.hit.has(o.uid) && Math.hypot(o.x - u.x, o.y - u.y) - o.r < u.r * 1.1) { c.hit.add(o.uid); b.hurt(o, L * m.dmg, u, true, m.type); knockFrom(b, o, u.x, u.y, m.knock); }
      if (!c.hitPile && Math.hypot(YOUR_PILE.x - u.x, YOUR_PILE.y - u.y) < u.r + PILE_R) { c.hitPile = true; takePile(b, 3, u); }
      if (c.done >= c.len || u.y >= AH - 220) u.cast = null;
      return;
    }
    if (x && x.tick) { x.tick(K, b, u, dt, c); return; }
    if (now >= c.at + (c.hold || 0.25)) u.cast = null;
  }

  /** The move lands. */
  function land(b, u, c, L) {
    const m = c.move, now = b.time, all = beasts(b);
    const done = (z) => { if (z) z.dead = true; };
    switch (m.kind) {
      case 'slam': case 'steps': {
        const hit = within(all, u.x, u.y, m.r);
        blast(b, u, hit, L * m.dmg, m.type, { knock: m.knock, stun: m.stun, freeze: m.freeze });
        pileHit(b, u.x, u.y, m.r, m.kind === 'steps' ? 0.5 : 3, u);
        done(c.zone);
        break;
      }
      case 'roar': {
        const hit = within(all, u.x, u.y, m.r);
        for (const o of hit) o.stunUntil = Math.max(o.stunUntil, now + m.stun);
        for (const o of foesAlive(b)) if (o !== u && Math.hypot(o.x - u.x, o.y - u.y) < 400) { o.buffUntil = now + 5; o.buff = 1.4; }
        done(c.zone);
        break;
      }
      case 'leap': {
        u.x = c.to.x; u.y = c.to.y; u.airborne = false; u.air = 0;
        const hit = within(all, u.x, u.y, m.r);
        blast(b, u, hit, L * m.dmg, m.type, { knock: m.knock });
        pileHit(b, u.x, u.y, m.r, 4, u);
        done(c.zone);
        c.hold = 0.5;
        break;
      }
      case 'breath': done(c.zone); c.angle = c.a0; break;
      case 'tail': {
        const back = u.facing + Math.PI;
        const hit = all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) - o.r <= m.r && angDiff(Math.atan2(o.y - u.y, o.x - u.x), back) < 1.35);
        blast(b, u, hit, L * m.dmg, m.type || 'crush', { knock: m.knock });
        done(c.zone);
        break;
      }
      case 'brood': {
        for (let k = 0; k < c.count; k++) {
          const sd = k % 2 ? 1 : -1;
          const h = spawnAt(b, m.peon, sd < 0 ? 40 : AW - 40, u.y + 60 + Math.floor(k / 2) * 50, m.mul, { side: sd < 0 ? 'L' : 'R' });
          h.y = clampY(u.y + 60 + Math.floor(k / 2) * 50);
        }
        break;
      }
      case 'swarm': {
        let n = c.count;
        if (u.burningUntil > now) { n = Math.max(1, Math.ceil(n / 2)); b.events.push({ type: 'mutant', kind: 'text', unit: u, text: 'The hive burns!', col: '#ff9a3a' }); }
        for (let k = 0; k < n; k++) spawnAt(b, m.peon, u.x + (k - (n - 1) / 2) * 46, u.y + u.r * 0.6 + (k % 2) * 20, m.mul);
        break;
      }
      case 'clones': {
        for (let k = 0; k < c.count; k++) spawnAt(b, m.peon, u.x + (k % 2 ? 1 : -1) * (130 + 40 * Math.floor(k / 2)), u.y + 40, m.mul);
        break;
      }
      case 'sting': case 'gas': case 'lane': case 'boulder': {
        // These land a moment later (a sting in flight, gas drifting down): their zones carry the effect.
        const list = c.zone ? [c.zone] : c.zones;
        for (const z of list) z.onLand = { dmg: L * m.dmg, type: m.type, freeze: m.freeze, ice: m.ice, linger: m.linger, move: m.kind };
        c.hold = 0.6;
        break;
      }
      case 'beam': {
        const hit = all.filter((o) => inLine(o, u.x, u.y, c.a, m.len, m.w / 2 + o.r * 0.6));
        blast(b, u, hit, L * m.dmg, m.type);
        if (inLine({ x: YOUR_PILE.x, y: YOUR_PILE.y }, u.x, u.y, c.a, m.len, m.w / 2 + PILE_R * 0.6)) takePile(b, 3, u);
        c.zone.flash = now + 0.35;
        c.zone.at = now; c.zone.until = now + 0.35;
        c.hold = 0.4;
        b.events.push({ type: 'mutant', kind: 'beam', unit: u, a: c.a, len: m.len, w: m.w, mtype: m.type });
        break;
      }
      case 'charge': done(c.zone); break;
      case 'gust': {
        const hit = all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) - o.r <= m.r && angDiff(Math.atan2(o.y - u.y, o.x - u.x), u.facing) < 1.0);
        for (const o of hit) knockFrom(b, o, u.x, u.y, m.knock);
        done(c.zone);
        break;
      }
      case 'mirror': mirror(b, u, c, L); done(c.zone); break;
      default: if (EXT[m.kind] && EXT[m.kind].land) EXT[m.kind].land(K, b, u, c, L); break;
      case 'blink': {
        const from = { x: u.x, y: u.y };
        u.x = clampX(u.x + (u.x < 500 ? 1 : -1) * 220, u.r + 10);
        u.y = Math.max(220, u.y - 260);
        b.events.push({ type: 'mutant', kind: 'blink', unit: u, from });
        break;
      }
    }
    b.events.push({ type: 'mutant', kind: 'land', unit: u, move: m.kind, x: (c.to || u).x, y: (c.to || u).y, r: m.r || 0, mtype: m.type || null });
  }

  function inLine(o, x, y, a, len, half) {
    const dx = o.x - x, dy = o.y - y;
    const along = dx * Math.cos(a) + dy * Math.sin(a);
    const off = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
    return along > -20 && along < len && off < half;
  }

  /** The Mirror Witch casts your last special back at you. */
  function mirror(b, u, c, L) {
    const all = beasts(b), now = b.time;
    const near = (R) => within(all, u.x, u.y, R);
    const name = c.copy ? D.ABILITIES[c.copy].name : 'Shard storm';
    b.events.push({ type: 'mutant', kind: 'text', unit: u, text: `🪞 ${name}!`, col: '#e0d0ff' });
    switch (c.copy) {
      case 'blast': case 'quake': blast(b, u, near(c.copy === 'blast' ? 200 : 230), L * (c.copy === 'blast' ? 4 : 2), 'shock', { stun: c.copy === 'quake' ? 1.4 : 0 }); break;
      case 'freeze': case 'blizzard': for (const o of near(220).slice(0, 5)) freeze(b, o, 2.5); break;
      case 'gust': for (const o of near(250)) knockFrom(b, o, u.x, u.y, 200); break;
      case 'gravity': for (const o of near(260).slice(0, 5)) { o.x += (u.x - o.x) * 0.5; o.y += (u.y - o.y) * 0.5; b.hurt(o, L * 1.2, u, false, 'shock'); o.stunUntil = Math.max(o.stunUntil, now + 1); } break;
      case 'heal': u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.12); break;
      case 'shield': case 'dash': case 'ward': u.shieldUntil = now + 5; break;
      case 'anchor': for (const o of near(260).slice(0, 4)) o.stunUntil = Math.max(o.stunUntil, now + 2); break;
      case 'dispel': for (const o of all) { o.wardUntil = -1; o.buffUntil = -1; o.shieldUntil = -1; } break;
      case 'rally': for (const o of foesAlive(b)) if (Math.hypot(o.x - u.x, o.y - u.y) < 400) { o.buffUntil = now + 5; o.buff = 1.5; } break;
      case 'starfall': case 'volley': case 'leap': default: {
        // Shards (or stars) on the four nearest beasts.
        const t = all.sort((a, b2) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b2.x - u.x, b2.y - u.y)).slice(0, 4);
        for (const o of t) b.hurt(o, L * 2.5, u, true, 'shock');
        b.events.push({ type: 'mutant', kind: 'shards', unit: u, targets: t });
      }
    }
  }

  /** The serpent's three heads, each striking its own choice of beast. */
  function headsTick(b, u) {
    const now = b.time, all = beasts(b).filter((o) => b.visible(o));
    const inReach = all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) - o.r - u.r <= u.reach);
    if (!inReach.length) return;
    u.state = 'fight';
    const rate = (u.headRate || 1) * u.haste;
    u.heads.forEach((h, i) => {
      if (!h.target || h.target.state === 'dying' || !inReach.includes(h.target)) {
        // The first goes for the nearest, the second the weakest, the third one the others are not on.
        const taken = u.heads.filter((x) => x !== h).map((x) => x.target);
        const byDist = [...inReach].sort((a, c2) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(c2.x - u.x, c2.y - u.y));
        h.target = i === 0 ? byDist[0] : i === 1 ? [...inReach].sort((a, c2) => a.hp - c2.hp)[0] : (byDist.find((o) => !taken.includes(o)) || byDist[0]);
      }
      if (now >= h.next) {
        h.swings = (h.swings || 0) + 1;
        const heavy = h.swings % 4 === 0;
        h.next = now + 1.15 * rate;
        h.last = now; h.heavy = heavy;
        b.events.push({ type: 'swing', unit: u, heavy, targets: [h.target], head: i, ranged: false, splash: [] });
        b.hurt(h.target, u.light * (heavy ? 3 : 1), u, heavy, h.type);
      }
    });
  }

  /** The Twin Titans: close together they mend each other. */
  function twinTick(b, u, dt) {
    const other = b.units.find((o) => o.kind === u.twin && o.state !== 'dying');
    if (other && Math.hypot(other.x - u.x, other.y - u.y) < 420 && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.01 * dt);
    u.linked = !!other && Math.hypot(other.x - u.x, other.y - u.y) < 420;
  }

  /** Zones landing, lingering ice and gas, burns and poison, twins rising again. */
  function step(b, dt) {
    const now = b.time;
    for (const z of b.zones) {
      if (z.dead) continue;
      if (z.onLand && now >= z.at && !z.landed) {
        z.landed = true;
        const all = beasts(b), L = z.onLand, owner = b.units.find((o) => o.uid === z.owner) || null;
        if (L.spawn) {
          for (const o of within(all, z.x, z.y, z.r)) b.hurt(o, (owner ? owner.light : 50) * (L.dmg || 1), owner, true, 'crush');
          pileHit(b, z.x, z.y, z.r, 1, owner);
          // It lands dazed for a moment: time to meet it.
          const g = spawnAt(b, L.spawn, z.x, z.y, L.mul);
          g.stunUntil = now + 1.2;
          z.dead = true;
        } else if (z.shape === 'lane') {
          const hit = all.filter((o) => Math.abs(o.x - z.x) < z.w / 2 + o.r * 0.5 && o.y > z.y - 40);
          blast(b, owner, hit, L.dmg, 'frost', { freeze: L.freeze });
          if (Math.abs(YOUR_PILE.x - z.x) < z.w / 2 + PILE_R * 0.6) takePile(b, 2.5, owner);
          if (L.ice) { z.linger = true; z.until = now + L.ice; z.kind = 'ice'; } else z.dead = true;
        } else {
          const hit = within(all, z.x, z.y, z.r);
          blast(b, owner, hit, L.dmg, L.type);
          pileHit(b, z.x, z.y, z.r, L.pileSec != null ? L.pileSec : L.move === 'sting' ? 1 : 2.5, owner);
          if (L.linger) { z.linger = true; z.until = now + L.linger; z.kind = L.lingerKind || 'gas'; z.dps = L.dmg * 0.5; } else z.dead = true;
          if (L.after) L.after(K, b, z, hit, owner);
        }
        b.events.push({ type: 'mutant', kind: 'zone-land', zone: z, unit: owner });
      }
      if (z.linger) {
        if (now >= z.until) { z.dead = true; continue; }
        if (!(z.tick > now)) {
          z.tick = now + 0.5;
          const all = beasts(b);
          if (z.kind === 'ice') for (const o of all) { if (Math.abs(o.x - z.x) < z.w / 2 && o.y > z.y - 40) o.slowUntil = Math.max(o.slowUntil, now + 0.8); }
          if (z.kind === 'gas') { for (const o of within(all, z.x, z.y, z.r)) poison(b, o, z.dps, z.owner); pileHit(b, z.x, z.y, z.r, 0.2, null); }
          if (z.kind === 'burn' || z.kind === 'acid' || z.kind === 'voiddust') { const ty = { burn: 'fire', acid: 'acid', voiddust: 'void' }[z.kind]; for (const o of within(all, z.x, z.y, z.r)) b.hurt(o, z.dps * 0.5, null, false, ty); pileHit(b, z.x, z.y, z.r, 0.15, null); }
          if (z.kind === 'web') for (const o of within(all, z.x, z.y, z.r)) o.slowUntil = Math.max(o.slowUntil, now + 0.8);
        }
      }
      if (z.until && now >= z.until && !z.linger) z.dead = true;
    }
    b.zones = b.zones.filter((z) => !z.dead);
    for (const f of STEP_HOOKS) f(K, b, dt);
    // Burns and poison: a tick every half second.
    for (const o of b.units) {
      if (o.state === 'dying') continue;
      if (o.burnUntil > now && !(o.dotAt > now)) {
        o.dotAt = now + 0.5;
        b.hurt(o, o.burnDps * 0.5, null, false, 'dot');
      }
      if (o.poisonUntil > now && !(o.poisonAt > now)) {
        o.poisonAt = now + 0.5;
        b.hurt(o, o.poisonDps * 0.5, null, false, 'dot');
      }
    }
    // A fallen twin rises again if the other is still standing six seconds on.
    for (const r of b.revives || []) {
      if (r.done) continue;
      const other = b.units.find((o) => o.kind === r.partner && o.state !== 'dying');
      if (!other) { r.done = true; continue; }
      if (now >= r.at) {
        r.done = true;
        const t = spawnAt(b, r.kind, r.x, r.y, r.mul || 1);
        t.hp = t.maxHp * 0.5;
        b.events.push({ type: 'mutant', kind: 'revive', unit: t, text: `${SHORT[r.kind]} rises again!` });
      }
    }
  }

  function poison(b, o, dps, owner) {
    if (o.side !== 'you') return;
    const el = elementOf(o);
    if (el === 'EARTH' || el === 'VOID' || o.passive === 'antidote') return;
    o.poisonUntil = Math.max(o.poisonUntil || 0, b.time + 4);
    o.poisonDps = Math.max(o.poisonDps || 0, dps);
  }

  // ------------------------------------------------------------------ damage
  /**
   * Damage dealt in World 7: a boss's weaknesses, resistances, armour and weak point against a
   * beast's blows; a damage type's effect on a beast, by its element. Returns { dmg, tag }.
   */
  function modify(b, o, dmg, by, heavy, type) {
    let tag = null;
    const now = b.time;
    if (type === 'dot') return { dmg, tag: 'dot' };
    if (o.mutant && by && by.side === 'you') {
      const def = o.mutant, el = elementOf(by), pierce = by.sunderUntil > now;
      if (def.weak && def.weak[el]) { dmg *= def.weak[el]; tag = 'weak'; }
      else if (def.resist && def.resist[el] && !pierce) { dmg *= def.resist[el]; tag = 'resist'; }
      if (el === 'FIRE') o.burningUntil = now + 3;
      if (def.armour) {
        const a = angDiff(Math.atan2(by.y - o.y, by.x - o.x), o.facing);
        const k0 = a < 0.9 ? def.armour.front : a > 2.2 ? def.armour.back : def.armour.side;
        const k = pierce ? Math.max(1, k0) : k0;
        dmg *= k;
        if (k < 1 && !tag) tag = 'armour'; else if (k > 1.3) tag = 'flank';
      }
      if (def.core) {
        const ranged = by.reach >= 74;
        dmg *= ranged ? def.core.ranged : pierce ? 1 : def.core.melee;
        tag = ranged ? 'core' : tag || 'armour';
      }
      if (o.mirrorShield > now && !pierce) dmg *= 0.4;
      // (World 8: a hardened shell takes three tenths; Wardens close together shield each other.)
      if (o.hardenUntil > now && !pierce) { dmg *= 0.3; tag = 'armour'; }
      if (def.link && b.units.some((x) => x !== o && x.mutant && x.mutant.link === def.link && x.state !== 'dying' && Math.hypot(x.x - o.x, x.y - o.y) < 380)) { dmg *= 0.4; tag = 'linked'; }
    }
    if (o.side === 'you' && o.acidUntil > now) dmg *= 1.25;
    if (o.side === 'you' && by && by.mutant && type === 'void' && by.state !== 'dying') by.hp = Math.min(by.maxHp, by.hp + dmg * 0.15);
    if (o.side === 'you' && type && RESIST[type]) {
      const el = elementOf(o);
      const k = RESIST[type][el] || 1;
      if (k < 1) { dmg *= k; tag = 'resist'; }
      if (o.passives) {
        if (type === 'fire' && o.passives.fireproof) dmg *= 0.5;
        if (type === 'frost' && o.passives.frostproof) dmg *= 0.5;
      }
      if (k >= 1 && o.state !== 'dying') {
        if (type === 'fire' && !(o.passives && o.passives.fireproof)) { o.burnUntil = now + 3; o.burnDps = Math.max(o.burnDps || 0, dmg * 0.12); }
        if (type === 'frost' && !(o.passives && o.passives.frostproof)) { o.slowUntil = Math.max(o.slowUntil, now + 2.5); if (heavy) freeze(b, o, 1.2); }
        if (type === 'poison') poison(b, o, dmg * 0.15, by && by.uid);
        if (type === 'shock') o.stunUntil = Math.max(o.stunUntil, now + 0.35);
        if (type === 'acid') o.acidUntil = now + 4;
        if (type === 'void') o.sapUntil = now + 4;
        if (type === 'sonic') { o.silencedUntil = now + 6; const card = b.cards && b.cards[o.card]; if (card) card.silencedUntil = Math.max(card.silencedUntil || 0, now + 6); }
        if (type === 'gravity') o.slowUntil = Math.max(o.slowUntil, now + 2);
      }
    }
    return { dmg, tag };
  }

  /** After a boss is hurt: its phases. */
  function onHurt(b, o) {
    const def = o.mutant;
    if (!def || !def.phases) return;
    const frac = o.hp / o.maxHp;
    while (o.phase < def.phases.length && frac <= def.phases[o.phase].at) {
      const ph = def.phases[o.phase];
      o.phase++;
      if (ph.haste) o.haste *= ph.haste;
      if (ph.speed) o.baseSpeed *= ph.speed;
      if (ph.heal) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * ph.heal);
      if (ph.heads) o.headRate = ph.heads;
      if (ph.shield) o.mirrorShield = b.time + ph.shield;
      for (const [id, n] of ph.spawn || []) for (let k = 0; k < n; k++) spawnAt(b, id, o.x + (k % 2 ? 1 : -1) * (o.r + 50 + 30 * Math.floor(k / 2)), o.y + 30, 0.6);
      // Knocked hard back up the field (Sam, 23 Nov: a giant at your pile could flatten it), its
      // wind-up stopped, staggered for a moment.
      if (o.cast) interrupt(b, o);
      { const dx = o.x - YOUR_PILE.x, dy = o.y - YOUR_PILE.y, d = Math.hypot(dx, dy) || 1, dist = Math.min(380, Math.max(0, o.y - (def.top || 200) - 40)); o.slide = { vx: ((dx / d) * dist) / 0.45, vy: ((dy / d) * dist) / 0.45, until: b.time + 0.45 }; o.stunUntil = Math.max(o.stunUntil, b.time + 1.6); }
      b.events.push({ type: 'mutant', kind: 'stagger', unit: o });
      if (ph.burst) { const hit = within(beasts(b), o.x, o.y, ph.burst.r); blast(b, o, hit, o.light * ph.burst.dmg, ph.burst.type); pileHit(b, o.x, o.y, ph.burst.r, 2, o); }
      b.events.push({ type: 'mutant', kind: 'phase', unit: o, phase: o.phase, text: ph.text, burst: ph.burst || null });
      // A wind-up in progress goes on; a new phase's moves may start at once.
      def.moves.forEach((m, i) => { if ((m.phase || 0) === o.phase) o.moveAt[i] = Math.min(o.moveAt[i], b.time + 1.5); });
    }
  }

  function onDeath(b, o) {
    if (o.side === 'you') (b.fallen = b.fallen || []).push({ x: o.x, y: o.y, t: b.time, kind: o.kind, r: o.r });
    for (const f of DEATH_HOOKS) f(K, b, o);
    if (o.cast) { if (o.cast.zone) o.cast.zone.dead = true; for (const z of o.cast.zones || []) z.dead = true; o.cast = null; }
    o.airborne = false;
    if (o.twin) {
      const other = b.units.find((x) => x.kind === o.twin && x.state !== 'dying');
      if (other) (b.revives = b.revives || []).push({ kind: o.kind, partner: o.twin, at: b.time + 6, x: o.x, y: o.y });
    }
  }

  /** Whether every boss is down (and none still to come, and no twin about to rise). */
  function won(b) {
    if (b.units.some((u) => u.boss && u.side === 'foe' && u.state !== 'dying')) return false;
    if (b.queue.some((s) => s.boss)) return false;
    if ((b.revives || []).some((r) => !r.done)) return false;
    return (b.mutantBosses || 0) > 0;
  }

  // ------------------------------------------------------------------ for the screen
  /** How a boss stands now, for its drawing. */
  function pose(b, u) {
    const c = u.cast, now = b.time;
    const out = { phase: u.phase || 0, enraged: !!u.enraged, air: u.air || 0, facing: u.facing, linked: !!u.linked, burning: u.burningUntil > now, shielded: u.mirrorShield > now };
    if (c) {
      const wind = c.move.wind * (u.enraged ? 0.85 : 1);
      out.move = c.move.kind;
      out.stage = c.stage;
      out.k = c.stage === 'wind' ? Math.max(0, Math.min(1, 1 - (c.at - now) / wind)) : Math.min(1, (now - c.at) / (c.move.dur || 0.5));
      if (c.angle != null) out.angle = c.angle; else if (c.a0 != null) out.angle = c.a0;
      if (c.a != null) out.angle = c.a;
      if (c.move.kind === 'throw') out.thrown = c.thrown;
    }
    if (u.heads) out.heads = u.heads.map((h) => ({ dx: h.target ? h.target.x - u.x : 0, dy: h.target ? h.target.y - u.y : 60, k: Math.max(0, 1 - (now - h.last) / 0.45), heavy: !!h.heavy, col: h.col }));
    out.hardened = u.hardenUntil > now; out.burrowed = !!u.burrowed;
    for (const f of POSE_HOOKS) f(b, u, out);
    // Goblins on Gorrak's shoulders: fewer after a throw, back one by one.
    if (u.kind === 'hulk_goblin') {
      const i = u.mutant.moves.findIndex((m) => m.kind === 'throw');
      const left = Math.max(0, (u.moveAt[i] - now) / (u.mutant.moves[i].every * u.haste));
      out.riders = c && c.move.kind === 'throw' ? Math.max(0, 3 - c.thrown) : Math.round(3 * (1 - left));
    }
    return out;
  }

  /** One to five bleeding stars, against the other foes of World 7 only (Sam, 23 Nov). */
  function bloodStars(id) {
    const e = D.ENEMIES[id];
    if (!e || e.world < 7) return 0;
    if (e.world >= 8) return e.role === 'mutant' ? 5 : Math.min(5, ({ swarm: 1.5, runner: 2, grunt: 2, caster: 2.5, tank: 3, brute: 3 }[e.role] || 2.5));
    if (e.role === 'mutant') {
      const order = ['hulk_goblin', 'walking_hive', 'frost_giant', 'mirror_witch', 'twin_luna', 'twin_sol', 'rot_behemoth', 'three_headed_serpent', 'colossus', 'dragon', 'omega_chimera'];
      return Math.min(5, 3 + Math.floor((order.indexOf(id) / (order.length - 1)) * 2.01));
    }
    return { swarm: 1, runner: 1.5, grunt: 1.5, caster: 2, tank: 2.5, brute: 2.5 }[e.role] || 2;
  }

  /** What a boss is weak to and resists, in words for the screens. */
  function bossNotes(id) {
    const def = BOSSES[id];
    if (!def) return null;
    const list = (o) => Object.keys(o || {}).map((k) => ELEMENT_WORD[k]).join(' and ');
    return {
      weak: list(def.weak), resist: list(def.resist), type: def.type ? TYPES[def.type] : null,
      armour: def.armour ? 'Scales turn blows from the front; it takes more from behind.' : def.core ? 'Only shots reach its core: blows up close barely hurt.' : null,
      twin: def.twin ? 'Beat both twins within six seconds of each other.' : null,
      extra: def.notes || null,
    };
  }

  // ------------------------------------------------------------------ for World 8 (mutants8.js)
  const EXT = {}, STEP_HOOKS = [], DEATH_HOOKS = [], POSE_HOOKS = [];
  const K = { D, TAU, AW, AH, YOUR_PILE, PILE_R, angDiff, clampX, clampY, elementOf, zone, cluster, beasts, foesAlive, within, knockFrom, blast, takePile, pileHit, freeze, poison, spawnAt, interrupt, inLine, SHORT, TYPES };
  /** World 8 adds its enemies, bosses, levels, moves and rules through this. */
  function extend(world, { enemies = [], bosses = {}, levels = null, moves = {}, step = null, death = null, pose: poseHook = null, short = {} }) {
    for (const [debut, id, name, role, look, note] of enemies) addIn(world, debut, id, name, role, look, note);
    Object.assign(BOSSES, bosses);
    if (levels) LEVELS_BY[world] = levels;
    Object.assign(EXT, moves);
    Object.assign(SHORT, short);
    if (step) STEP_HOOKS.push(step);
    if (death) DEATH_HOOKS.push(death);
    if (poseHook) POSE_HOOKS.push(poseHook);
  }
  const levelCount = (world) => (LEVELS_BY[world] || []).length;

  return { BOSSES, LEVELS, LEVEL_COUNT, LEVELS_BY, TYPES, RESIST, level, levelCount, setup, think, step, modify, onHurt, onDeath, won, pose, bloodStars, bossNotes, ELEMENT_WORD, stagger, dispel, extend, EXT, K };
})();

if (typeof module !== 'undefined') module.exports = MUTANTS;
