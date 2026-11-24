/**
 * Merge Beasts 1.5: World 8, the Apex Mutants (Sam, 24 Nov), opened by beating World 7.
 *
 * Harder than World 7 in every way: the giants are bigger still, fight in new ways, bring far more
 * peons and other enemies, and often come two or three at once. World 7 can just be beaten with
 * good play and the best beasts of the two solar systems; World 8 is a struggle even for comet
 * beasts, and its last levels want ascended ones (Tier 16 and up), whose passives and specials
 * matter here (Ward against a Mark of doom, Dispel against a hardened shell, Stagger and Anchor to
 * pull the Wardens apart, Unshakeable against tentacles, Frostproof against crystal rain).
 *
 * New damage types (mutants.js): acid (beasts take more for a while), void (saps their blows and
 * mends the caster), sonic (deafens: no specials for a while) and gravity (drags and slows).
 * New moves: a shockwave racing out, meteors raining down, a gravity well, a sweeping laser,
 * erupting spikes, burrowing up under a crowd, draining tethers, grabbing tentacles and pincers, a
 * deafening scream, a hardened shell, egg clutches that hatch, rifts that pour out enemies, chain
 * lightning, orbiting orbs, raising your fallen as thralls, a mark of doom and a stampede.
 *
 * This file is the numbers and rules (the battle and tools/battle_sim.mjs both use it);
 * mutants8_art.js draws the giants.
 */
(() => {
  if (typeof MUTANTS === 'undefined') return;
  const TAU = Math.PI * 2;
  const M = (skin, cloth, trim, eye, x) => Object.assign({ skin, cloth, trim, eye }, x);
  const nearest = (list, x, y) => [...list].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));

  // ------------------------------------------------------------------ the enemies of World 8
  const G = (debut, id, name, size, look, note) => [debut, id, name, 'mutant', Object.assign(look, { plan: 'mutant', size, boss: true }), note];
  const enemies = [
    G(1, 'gravemaw', 'Gravemaw the Abyssal Worm', 5.6, M('#8a6a7a', '#3a2430', '#c8ff2a', '#ffde3a', { art: 'worm' }), 'A worm as long as a river, plated like a beetle, with a mouth of a thousand teeth and a hundred clawed legs down its belly. It dives underground and bursts up under the biggest crowd, and spits acid that eats armour.'),
    G(2, 'brood_queen', 'Vex, the Iron Brood Queen', 5.4, M('#5a6070', '#20242c', '#ff4a3a', '#ff3a2a', { art: 'spider' }), 'A spider queen half made of iron, eight jointed legs of steel and muscle. She lays clutches of eggs that hatch spiderlings, sweeps the field with a laser from her eye cluster, webs the ground and shells your coins with the mortars on her back.'),
    G(3, 'eclipse_moth', 'Nyxara the Eclipse Moth', 5.2, M('#6a5a8a', '#1a1428', '#ffe08a', '#ff5ad8', { art: 'moth' }), 'A moth whose wings blot out the sun, with staring eyes painted on them. Her shriek deafens your beasts so they cannot use their specials, her dust saps their strength, and she drinks their souls through long tethers.'),
    G(4, 'magmaton', 'Magmaton the Volcano Titan', 6.0, M('#4a3a38', '#1a1210', '#ff7a1a', '#ffd23a', { art: 'magma' }), 'A titan with a volcano for a back and rivers of magma for veins. It rains lava bombs that leave the ground burning, erupts in a ring of fire, and grows a shell of obsidian that turns blows aside. Water beasts cool it.'),
    G(5, 'crystal_leviathan', 'The Crystal Leviathan', 5.8, M('#8ad8f0', '#2a5a7a', '#e8fbff', '#7a5aff', { art: 'leviathan' }), 'A whale of living crystal that swims through the air. Its prism beam sweeps across the field, it rains shards of crystal that freeze, sings a song that breaks bones and turns the ground into a whirlpool. Earth cracks it.'),
    G(6, 'storm_bull', 'Thunderhoof the Storm Bull', 5.4, M('#3a3a4a', '#1a1a24', '#7ad8ff', '#fff27a', { art: 'bull' }), 'A bull the size of a hill, with a storm for a mane and lightning between its horns. It stampedes across the field again and again, its lightning jumps from beast to beast, and its hooves shake the ground.'),
    G(7, 'siege_scorpion', 'Skarnox the Siege Scorpion', 5.6, M('#c89a4a', '#5a3a18', '#c8ff2a', '#ff3a2a', { art: 'scorpion' }), 'A scorpion as big as a castle. Its stinger is a mortar that shells your coins with acid, its pincers crush whatever they catch, and its shell turns blows from the front. It burrows through sand to come up behind your line.'),
    G(8, 'warden_gravity', 'The Gravity Warden', 4.4, M('#4a4a7a', '#1a1a3a', '#8a9aff', '#c8d0ff', { art: 'warden', kind: 'gravity' }), 'One of the Three Wardens, a floating sentinel of black stone ringed with orbiting rocks. It drags beasts into wells of gravity and drops stars on them.'),
    G(8, 'warden_void', 'The Void Warden', 4.4, M('#3a2a4a', '#120a1a', '#b06aff', '#e0c0ff', { art: 'warden', kind: 'void' }), 'The second Warden, hollow and humming. Orbs of nothing circle it, and it drains the life out of beasts through dark tethers.'),
    G(8, 'warden_sonic', 'The Sonic Warden', 4.4, M('#5a3a4a', '#2a1020', '#ff8ad8', '#ffe0f0', { art: 'warden', kind: 'sonic' }), 'The third Warden, all bells and ringing plates. Its resonance deafens beasts and its sound waves throw them back. Close together, the Wardens shield one another.'),
    G(9, 'hollow_king', 'Morgrath the Hollow King', 5.4, M('#d8ccb0', '#2a1a3a', '#b06aff', '#9ae8ff', { art: 'lich' }), 'A king who died and would not stop ruling, a giant of bone in a burial robe, with a crown of black iron and a lantern full of souls. Your beasts that fall rise again as his thralls, and the beast he marks for death dies, unless it is warded.'),
    G(10, 'abomination', 'The Abomination', 5.8, M('#b88a7a', '#4a2a2a', '#c8ff2a', '#ffde3a', { art: 'abom' }), 'Many beasts sewn into one, with too many arms. It grabs beasts and slams them down, spills acid bile, and as it weakens it tears into smaller abominations that fight on.'),
    G(10, 'lesser_abomination', 'Lesser Abomination', 3.6, M('#c89a8a', '#5a3030', '#c8ff2a', '#ffde3a', { art: 'abom', kind: 'lesser' }), 'A piece torn off the Abomination, still stitched, still hungry.'),
    G(20, 'world_eater', 'The World-Eater', 6.4, M('#2a1a3a', '#0a0612', '#b06aff', '#ffde3a', { art: 'eater' }), 'A thing from before the stars: a mouth ringed with tentacles and eyes, and moons that circle it like flies. It grabs, drags, rains moons, tears rifts in the sky and unmakes whatever its ray touches. It fights four ways as it weakens. This is the last battle there is.'),
  ];
  const P = (debut, id, name, role, look, note) => [debut, id, name, role, look, note];
  enemies.push(
    P(1, 'maw_grub', 'Maw Grub', 'swarm', M('#c8a0a8', '#5a3040', '#c8ff2a', '#ffde3a', { plan: 'serpent', size: 0.85, trait: null }), 'A young worm, all teeth. They come out of the ground in heaps.'),
    P(2, 'spiderling', 'Iron Spiderling', 'runner', M('#6a7080', '#24282e', '#ff4a3a', '#ff3a2a', { plan: 'crawler', size: 0.9, trait: null }), 'Hatched from the Brood Queen\'s eggs, already half made of iron. They run for your coins.'),
    P(2, 'egg_sac', 'Egg Clutch', 'tank', M('#d8d0b8', '#8a7a5a', '#ff4a3a', '#ff4a3a', { plan: 'mutant', art: 'egg', size: 1.3, trait: null }), 'A clutch of the Brood Queen\'s eggs. Break it before it hatches, or three spiderlings come out.'),
    P(3, 'void_wisp', 'Void Wisp', 'caster', M('#3a2a5a', '#120a1a', '#b06aff', '#ffde3a', { plan: 'float', size: 0.9, body: 'eye', trait: 'slow' }), 'An eye of nothing that drifts out of the dark and chills whatever it stares at.'),
    P(4, 'magma_blob', 'Magma Blob', 'brute', M('#ff7a1a', '#5a1a08', '#ffd23a', '#ffffff', { plan: 'blob', size: 1.25, trait: 'knock' }), 'A lump of living lava that slaps beasts aside.'),
    P(5, 'shardling', 'Shardling', 'caster', M('#bfefff', '#4a8aaa', '#ffffff', '#7a5aff', { plan: 'float', size: 0.9, body: 'star', trait: 'slow' }), 'A splinter of the Leviathan, spinning, chilling what it hits.'),
    P(6, 'abyss_knight', 'Abyss Knight', 'tank', M('#3a3448', '#1a1424', '#b06aff', '#ff5a8a', { plan: 'biped', size: 1.45, build: 'heavy', head: 'helm', weapon: 'halberd', armor: true, trait: 'aura' }), 'A knight in black plate from the courts of the Abyss. Those beside it take a quarter less.'),
    P(7, 'sand_scuttler', 'Sand Scuttler', 'runner', M('#d8b06a', '#6a4a20', '#c8ff2a', '#1a1408', { plan: 'crawler', size: 0.85, trait: null }), 'A little scorpion that comes out of the sand by the dozen.'),
    P(9, 'void_priest', 'Void Priest', 'caster', M('#d8ccb0', '#2a1a3a', '#b06aff', '#9ae8ff', { plan: 'biped', size: 1.05, head: 'hood', body: 'robe', weapon: 'orb_staff', trait: 'heal' }), 'A priest of the Hollow King who mends him and the rest. Get to them first.'),
    P(9, 'bone_thrall', 'Bone Thrall', 'grunt', M('#e0d6bc', '#5a4a3a', '#b06aff', '#9ae8ff', { plan: 'biped', size: 1.05, head: 'bald', weapon: 'claws', trait: null }), 'One of your own fallen beasts, raised as a skeleton to fight for the Hollow King.'),
    P(14, 'rift_stalker', 'Rift Stalker', 'runner', M('#4a3a6a', '#1a1028', '#b06aff', '#ff5ad8', { plan: 'quad', size: 1.15, trait: 'cloak' }), 'A hunter that walks between rifts, unseen until it strikes.'),
  );

  // ------------------------------------------------------------------ how they fight
  const bosses = {
    gravemaw: {
      top: 470, r: 135, speed: 70, reach: 90, hp: 1.2, atk: 1, multi: 3, area: 0.5, type: 'acid', weak: { FIRE: 1.6, LIGHT: 1.3 }, resist: { EARTH: 0.5, WATER: 0.6 },
      moves: [
        { kind: 'burrow', every: 13, first: 6, wind: 1.0, travel: 1.4, r: 210, dmg: 5, knock: 160, range: 1000, type: 'acid', name: 'Burrow' },
        { kind: 'spikes', every: 9, first: 3, wind: 0.9, n: 10, gap: 75, r: 60, dmg: 2.5, range: 1000, type: 'acid', name: 'Acid geysers' },
        { kind: 'meteor', every: 11, first: 9, wind: 0.8, count: [3, 3, 4], r: 90, gap: 0.15, dmg: 1.8, linger: 5, lingerKind: 'acid', aim: 'beasts', range: 900, type: 'acid', pileSec: 0.6, name: 'Acid spit' },
        { kind: 'swarm', every: 12, first: 6, wind: 0.9, count: [3, 4, 6], peon: 'maw_grub', mul: 0.45, phase: 1, name: 'Grubs' },
      ],
      phases: [{ at: 0.66, text: 'Gravemaw sheds its plates!', spawn: [['maw_grub', 3]] }, { at: 0.33, text: 'The maw opens wide!', haste: 0.75 }],
      notes: 'It dives underground and bursts up under the biggest crowd: keep your beasts spread out.',
    },
    brood_queen: {
      top: 430, r: 140, speed: 55, reach: 120, hp: 1.15, atk: 0.95, multi: 2, area: 0.4, type: 'shock', weak: { WATER: 1.6, EARTH: 1.3 }, resist: { FIRE: 0.5, LIGHT: 0.6 },
      moves: [
        { kind: 'eggs', every: 12, first: 4, wind: 1.0, count: [2, 3, 4], peon: 'spiderling', brood: 3, hatch: 9, mul: 0.45, eggMul: 0.35, name: 'Egg clutch' },
        { kind: 'sweep', every: 10, first: 8, wind: 1.3, dur: 1.8, spread: 0.9, len: 1000, w: 70, dmg: 0.9, type: 'shock', name: 'Laser sweep' },
        { kind: 'meteor', every: 11, first: 2, wind: 0.8, count: [2, 2, 3], r: 125, gap: 0.2, dmg: 0.5, linger: 6, lingerKind: 'web', aim: 'beasts', range: 900, type: 'acid', pileSec: 0.2, name: 'Webs' },
        { kind: 'meteor', every: 14, first: 11, wind: 1.2, count: [4, 5, 7], r: 85, gap: 0.18, dmg: 2.5, aim: 'pile', type: 'crush', pileSec: 0.6, phase: 1, name: 'Mortar barrage' },
      ],
      phases: [{ at: 0.66, text: 'Vex unfolds her cannons!' }, { at: 0.33, text: 'The brood swarms out!', spawn: [['spiderling', 4]], haste: 0.8 }],
      notes: 'Break her egg clutches before they hatch.',
    },
    eclipse_moth: {
      top: 470, r: 130, speed: 80, reach: 220, ranged: true, hp: 0.9, atk: 0.9, multi: 1, area: 0.3, type: 'void', weak: { LIGHT: 1.7, FIRE: 1.3 }, resist: { VOID: 0.4, WIND: 0.6 },
      moves: [
        { kind: 'scream', every: 10, first: 5, wind: 1.1, r: 430, spread: 0.7, dmg: 2, knock: 120, type: 'sonic', name: 'Shriek' },
        { kind: 'meteor', every: 9, first: 3, wind: 0.9, count: [3, 4, 5], r: 120, gap: 0.2, dmg: 1, linger: 6, lingerKind: 'voiddust', aim: 'beasts', range: 1000, type: 'void', pileSec: 0.3, name: 'Eclipse dust' },
        { kind: 'drain', every: 12, first: 9, wind: 0.9, count: [2, 3, 3], range: 650, dur: 3.5, dmg: 0.8, type: 'void', name: 'Soul drain' },
        { kind: 'gust', every: 13, first: 15, wind: 1.0, r: 330, knock: 170, phase: 1, name: 'Wing gale' },
      ],
      phases: [{ at: 0.66, text: 'The eclipse deepens!', spawn: [['void_wisp', 3]] }, { at: 0.33, text: 'Nyxara blots out the sky!', haste: 0.75 }],
      notes: 'Her shriek deafens your beasts: use specials before she screams. A stun breaks her drain.',
    },
    magmaton: {
      top: 500, r: 150, speed: 40, reach: 90, hp: 1.45, atk: 1.1, multi: 3, area: 0.6, type: 'fire', weak: { WATER: 1.7 }, resist: { FIRE: 0.3, EARTH: 0.6 },
      moves: [
        { kind: 'meteor', every: 10, first: 5, wind: 1.2, count: [4, 5, 7], r: 95, gap: 0.22, dmg: 3, linger: 5, lingerKind: 'burn', aim: 'mixed', range: 1200, type: 'fire', pileSec: 0.8, name: 'Lava bombs' },
        { kind: 'shockwave', every: 11, first: 8, wind: 1.2, r: 430, dur: 0.9, dmg: 3, knock: 140, type: 'fire', name: 'Eruption' },
        { kind: 'slam', every: 8, first: 3, wind: 1.0, r: 180, dmg: 3.5, knock: 110, type: 'fire', name: 'Magma fist' },
        { kind: 'harden', every: 16, first: 12, wind: 0.8, dur: 6, phase: 1, name: 'Obsidian shell' },
        { kind: 'swarm', every: 13, first: 10, wind: 0.9, count: [2, 3, 4], peon: 'magma_blob', mul: 0.45, name: 'Magma blobs' },
      ],
      phases: [{ at: 0.66, text: 'Magmaton erupts!', burst: { r: 260, dmg: 3, type: 'fire' } }, { at: 0.33, text: 'The volcano blows!', haste: 0.75, burst: { r: 300, dmg: 3.5, type: 'fire' } }],
      notes: 'Its obsidian shell takes most of a blow: Sunder goes through it and Dispel breaks it.',
    },
    crystal_leviathan: {
      top: 500, r: 145, speed: 60, reach: 260, ranged: true, hp: 1.2, atk: 0.95, multi: 1, area: 0.3, type: 'frost', weak: { EARTH: 1.6, FIRE: 1.3 }, resist: { WATER: 0.4, LIGHT: 0.5 },
      moves: [
        { kind: 'sweep', every: 9, first: 6, wind: 1.2, dur: 2.0, spread: 1.0, len: 1200, w: 80, dmg: 1.0, type: 'frost', name: 'Prism beam' },
        { kind: 'meteor', every: 11, first: 9, wind: 1.1, count: [5, 6, 8], r: 75, gap: 0.12, dmg: 2.5, freeze: 1.2, aim: 'beasts', range: 1200, type: 'frost', pileSec: 0.5, name: 'Crystal rain' },
        { kind: 'pull', every: 13, first: 12, wind: 1.2, r: 230, range: 900, dmg: 2, type: 'gravity', phase: 1, name: 'Whirlpool' },
        { kind: 'shockwave', every: 12, first: 15, wind: 1.4, r: 520, dur: 1.1, dmg: 1.5, knock: 80, type: 'sonic', phase: 1, name: 'Leviathan song' },
      ],
      phases: [{ at: 0.66, text: 'Its crystals sing!', spawn: [['shardling', 3]] }, { at: 0.33, text: 'The Leviathan shatters the sky!', haste: 0.75 }],
    },
    storm_bull: {
      top: 430, r: 140, speed: 95, reach: 80, hp: 1.25, atk: 1.15, multi: 2, area: 0.5, type: 'shock', weak: { EARTH: 1.6 }, resist: { WIND: 0.5, COSMIC: 0.6 },
      moves: [
        { kind: 'stampede', every: 13, first: 6, wind: 1.0, count: [1, 2, 3], len: 800, dmg: 3.5, knock: 130, type: 'crush', name: 'Stampede' },
        { kind: 'chain', every: 8, first: 4, wind: 0.9, count: [3, 4, 6], range: 700, jump: 260, dmg: 3, type: 'shock', name: 'Chain lightning' },
        { kind: 'shockwave', every: 10, first: 9, wind: 0.9, r: 340, dur: 0.6, dmg: 2.5, knock: 120, type: 'crush', name: 'Thunder stomp' },
        { kind: 'roar', every: 14, first: 12, wind: 0.8, r: 260, stun: 1.2, phase: 1, name: 'Storm bellow' },
      ],
      phases: [{ at: 0.66, text: 'Thunderhoof\'s mane crackles!', haste: 0.85 }, { at: 0.33, text: 'The storm breaks!', haste: 0.75, speed: 1.25 }],
      notes: 'Lightning jumps between beasts that stand close together.',
    },
    siege_scorpion: {
      top: 470, r: 145, speed: 70, reach: 100, hp: 1.3, atk: 1.05, multi: 2, area: 0.4, type: 'acid', armour: { front: 0.45, side: 1.1, back: 1.5 }, weak: { WATER: 1.5, COSMIC: 1.3 }, resist: { EARTH: 0.5, FIRE: 0.6 },
      moves: [
        { kind: 'meteor', every: 11, first: 6, wind: 1.2, count: [3, 4, 6], r: 90, gap: 0.25, dmg: 3, linger: 4, lingerKind: 'acid', aim: 'pile', type: 'acid', pileSec: 0.7, name: 'Stinger mortar' },
        { kind: 'grab', every: 9, first: 3, wind: 0.8, count: [1, 2, 2], range: 260, r: 75, hold: 2.5, dmg: 3, type: 'crush', look: 'pincer', name: 'Pincer grab' },
        { kind: 'tail', every: 5, first: 3, wind: 0.5, r: 250, dmg: 4.5, knock: 160, type: 'acid', name: 'Stinger lash' },
        { kind: 'burrow', every: 15, first: 14, wind: 1.0, travel: 1.2, r: 200, dmg: 4.5, knock: 140, range: 1000, type: 'crush', phase: 1, name: 'Sand dive' },
      ],
      phases: [{ at: 0.66, text: 'Skarnox digs in!', spawn: [['sand_scuttler', 4]] }, { at: 0.33, text: 'The siege engine rages!', haste: 0.75 }],
      notes: 'Its shell turns blows from the front; it takes more from the sides and behind.',
    },
    warden_gravity: {
      top: 400, r: 115, speed: 55, reach: 200, ranged: true, hp: 0.6, atk: 0.85, multi: 1, area: 0.3, type: 'gravity', weak: { VOID: 1.5 }, resist: { COSMIC: 0.5 }, link: 'wardens',
      moves: [
        { kind: 'pull', every: 10, first: 4, wind: 1.1, r: 220, range: 800, dmg: 2.5, type: 'gravity', name: 'Gravity well' },
        { kind: 'meteor', every: 12, first: 9, wind: 1.0, count: [3, 4, 5], r: 85, gap: 0.2, dmg: 2.5, aim: 'beasts', range: 1000, type: 'gravity', pileSec: 0.5, name: 'Falling stars' },
      ],
      phases: [{ at: 0.5, text: 'The Gravity Warden bends the field!', haste: 0.8 }],
      notes: 'Close together the Wardens shield one another (only two fifths of a blow gets through): pull them apart.',
    },
    warden_void: {
      top: 400, r: 115, speed: 55, reach: 200, ranged: true, hp: 0.6, atk: 0.85, multi: 1, area: 0.3, type: 'void', weak: { LIGHT: 1.5 }, resist: { VOID: 0.5 }, link: 'wardens',
      moves: [
        { kind: 'orbit', every: 12, first: 5, wind: 0.8, dur: 5, r: 170, n: 6, dmg: 1.2, type: 'void', name: 'Void orbs' },
        { kind: 'drain', every: 11, first: 9, wind: 0.9, count: [2, 2, 3], range: 600, dur: 3, dmg: 0.8, type: 'void', name: 'Life drain' },
      ],
      phases: [{ at: 0.5, text: 'The Void Warden hungers!', haste: 0.8 }],
      notes: 'Close together the Wardens shield one another (only two fifths of a blow gets through): pull them apart.',
    },
    warden_sonic: {
      top: 400, r: 115, speed: 55, reach: 200, ranged: true, hp: 0.6, atk: 0.85, multi: 1, area: 0.3, type: 'sonic', weak: { EARTH: 1.5 }, resist: { WIND: 0.5 }, link: 'wardens',
      moves: [
        { kind: 'scream', every: 9, first: 6, wind: 1.0, r: 400, spread: 0.6, dmg: 2, knock: 110, type: 'sonic', name: 'Resonance' },
        { kind: 'shockwave', every: 13, first: 10, wind: 1.1, r: 380, dur: 0.8, dmg: 2, knock: 100, type: 'sonic', name: 'Sound wave' },
      ],
      phases: [{ at: 0.5, text: 'The Sonic Warden rings out!', haste: 0.8 }],
      notes: 'Close together the Wardens shield one another (only two fifths of a blow gets through): pull them apart.',
    },
    hollow_king: {
      top: 480, r: 140, speed: 50, reach: 240, ranged: true, hp: 1.25, atk: 1.0, multi: 2, area: 0.3, type: 'void', weak: { DEITY: 1.7, LIGHT: 1.5 }, resist: { VOID: 0.3, EARTH: 0.7 },
      moves: [
        { kind: 'drain', every: 11, first: 4, wind: 0.9, count: [2, 3, 4], range: 700, dur: 3.5, dmg: 0.9, type: 'void', name: 'Soul siphon' },
        { kind: 'raise', every: 10, first: 7, wind: 1.2, count: [2, 3, 4], peon: 'bone_thrall', mul: 0.5, name: 'Raise the fallen' },
        { kind: 'mark', every: 14, first: 10, wind: 3.0, range: 1000, dmg: 14, type: 'void', name: 'Mark of doom' },
        { kind: 'orbit', every: 13, first: 14, wind: 0.8, dur: 6, r: 190, n: 5, dmg: 1.4, type: 'void', phase: 1, name: 'Soul lanterns' },
        { kind: 'rift', every: 16, first: 18, wind: 1.2, dur: 9, spawnEvery: 2.2, peon: 'void_wisp', mul: 0.4, phase: 2, name: 'Rift' },
      ],
      phases: [{ at: 0.66, text: 'Morgrath calls his court!', spawn: [['abyss_knight', 2]] }, { at: 0.33, text: 'The Hollow King unmasks!', haste: 0.75 }],
      notes: 'Your fallen beasts rise again as his thralls. His mark kills the beast it falls on unless it is warded, or he is stunned first.',
    },
    abomination: {
      top: 480, r: 150, speed: 55, reach: 85, hp: 1.5, atk: 1.05, multi: 3, area: 0.6, type: 'acid', weak: { FIRE: 1.6, DEITY: 1.3 }, resist: { EARTH: 0.5, VOID: 0.6 },
      moves: [
        { kind: 'grab', every: 8, first: 3, wind: 0.8, count: [2, 2, 3], range: 280, r: 75, hold: 2.5, dmg: 2.5, type: 'acid', look: 'arm', name: 'Grasping arms' },
        { kind: 'slam', every: 7, first: 5, wind: 0.9, r: 200, dmg: 3.5, knock: 120, type: 'acid', name: 'Body slam' },
        { kind: 'meteor', every: 11, first: 8, wind: 0.9, count: [3, 4, 4], r: 110, gap: 0.2, dmg: 1.2, linger: 6, lingerKind: 'acid', aim: 'beasts', range: 800, type: 'acid', pileSec: 0.4, name: 'Bile' },
      ],
      phases: [{ at: 0.66, text: 'The Abomination tears in two!', spawn: [['lesser_abomination', 1]] }, { at: 0.33, text: 'It tears again!', spawn: [['lesser_abomination', 1]], haste: 0.8 }],
      notes: 'It tears into smaller abominations as it weakens. Every one of them must fall.',
    },
    lesser_abomination: {
      top: 320, r: 100, speed: 70, reach: 70, hp: 0.45, atk: 0.7, multi: 2, area: 0.4, type: 'acid', weak: { FIRE: 1.6 }, resist: { EARTH: 0.5 },
      moves: [
        { kind: 'slam', every: 8, first: 3, wind: 0.9, r: 160, dmg: 3, knock: 100, type: 'acid', name: 'Slam' },
        { kind: 'grab', every: 10, first: 5, wind: 0.8, count: 1, range: 240, r: 70, hold: 2, dmg: 2, type: 'acid', look: 'arm', name: 'Grab' },
      ],
      phases: [],
    },
    world_eater: {
      top: 560, r: 160, speed: 34, reach: 120, hp: 2.0, atk: 1.2, multi: 3, area: 0.6, type: 'void', weak: { DEITY: 1.4, LIGHT: 1.3 }, resist: { VOID: 0.4, COSMIC: 0.5 }, enrage: 210,
      moves: [
        { kind: 'grab', every: 7, first: 2, wind: 0.9, count: [2, 3, 4, 5], range: 900, r: 75, hold: 2, dmg: 2.5, type: 'void', look: 'tentacle', name: 'Tentacles' },
        { kind: 'pull', every: 11, first: 7, wind: 1.2, r: 260, range: 1000, dmg: 3, type: 'gravity', name: 'Event horizon' },
        { kind: 'meteor', every: 10, first: 5, wind: 1.2, count: [5, 6, 8, 10], r: 90, gap: 0.15, dmg: 3, aim: 'mixed', range: 1400, type: 'crush', pileSec: 0.6, phase: 1, name: 'Falling moons' },
        { kind: 'sweep', every: 12, first: 12, wind: 1.3, dur: 2.2, spread: 1.1, len: 1400, w: 90, dmg: 1.1, type: 'void', phase: 1, name: 'Unmaking ray' },
        { kind: 'rift', every: 15, first: 4, wind: 1.0, dur: 8, spawnEvery: 2.4, peon: 'void_wisp', mul: 0.45, phase: 2, name: 'Rift' },
        { kind: 'orbit', every: 12, first: 6, wind: 0.8, dur: 6, r: 240, n: 8, dmg: 1.5, type: 'void', phase: 2, name: 'Orbiting moons' },
        { kind: 'shockwave', every: 8, first: 2, wind: 1.1, r: 540, dur: 1.0, dmg: 3, knock: 160, type: 'gravity', phase: 3, name: 'Collapse' },
      ],
      phases: [{ at: 0.75, text: 'The World-Eater opens its eyes!' }, { at: 0.5, text: 'Rifts tear the sky!', spawn: [['abyss_knight', 2]] }, { at: 0.25, text: 'It devours the light!', haste: 0.7 }],
      notes: 'Four forms as it weakens: tentacles and gravity, then falling moons and the unmaking ray, then rifts and orbiting moons, then the collapse.',
    },
  };

  // ------------------------------------------------------------------ the new moves
  const MOVES = {
    // A ring racing out from the giant; whatever its front passes is struck once.
    shockwave: {
      begin(K, b, u, m, i, c, cnt, all) {
        if (!K.within(all, u.x, u.y, m.r).length) { u.moveAt[i] = b.time + 1; return false; }
        c.zone = K.zone(b, { shape: 'ring', x: u.x, y: u.y, r: m.r, at: c.at, owner: u.uid, type: m.type, follow: true });
        return true;
      },
      land(K, b, u, c) { Object.assign(c.zone, { shape: 'wave', front: u.r * 0.6, follow: false, until: b.time + c.move.dur + 0.2 }); c.hit = new Set(); },
      tick(K, b, u, dt, c) {
        const m = c.move, now = b.time, k = Math.min(1, (now - c.at) / m.dur), z = c.zone, front = u.r * 0.6 + (m.r - u.r * 0.6) * k;
        z.front = front;
        for (const o of K.beasts(b)) {
          if (c.hit.has(o.uid)) continue;
          if (Math.abs(Math.hypot(o.x - z.x, o.y - z.y) - front) < 40 + o.r * 0.5) { c.hit.add(o.uid); K.blast(b, u, [o], u.light * m.dmg, m.type, { knock: m.knock, kx: z.x, ky: z.y }); }
        }
        if (!c.pileDone && Math.hypot(K.YOUR_PILE.x - z.x, K.YOUR_PILE.y - z.y) - K.PILE_R * 0.8 <= front) { c.pileDone = true; K.takePile(b, 2, u); }
        if (k >= 1) { z.dead = true; u.cast = null; }
      },
    },
    // Things falling out of the sky one after another: on beasts, on your coins, or both.
    meteor: {
      begin(K, b, u, m, i, c, cnt, all) {
        const now = b.time, aim = m.aim || 'beasts';
        const near = all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) <= (m.range || 1100));
        if (aim !== 'pile' && !near.length) { u.moveAt[i] = now + 1; return false; }
        const pts = [];
        for (let k = 0; k < cnt; k++) {
          let x, y;
          if (aim === 'pile' || (aim === 'mixed' && k % 3 === 2) || !near.length) {
            const a = Math.PI + ((k * 0.9 + now * 0.37) % Math.PI), d = 70 + ((k * 53 + Math.floor(now * 11)) % 170);
            x = K.YOUR_PILE.x + Math.cos(a) * d; y = K.YOUR_PILE.y + Math.sin(a) * d * 0.9;
          } else {
            const o = near[(k * 5 + Math.floor(now * 7)) % near.length];
            x = o.x + ((k * 37) % 100) - 50; y = o.y + ((k * 61) % 80) - 40;
          }
          x = K.clampX(x, 50); y = Math.min(K.AH - 50, Math.max(200, y));
          if (pts.some((p) => Math.hypot(p.x - x, p.y - y) < m.r * 0.9)) x = K.clampX(x + m.r * 1.2 * (k % 2 ? 1 : -1), 50);
          pts.push({ x, y });
        }
        const after = m.freeze ? (K2, b2, z, hit) => { for (const o of hit) K2.freeze(b2, o, m.freeze); } : null;
        pts.forEach((p, k) => c.zones.push(K.zone(b, { shape: 'ring', x: p.x, y: p.y, r: m.r, at: c.at + 0.5 + k * (m.gap || 0.15), owner: u.uid, type: m.type, fall: m.lingerKind || m.type, onLand: { dmg: u.light * m.dmg, type: m.type, linger: m.linger, lingerKind: m.lingerKind, move: 'meteor', pileSec: m.pileSec != null ? m.pileSec : 0.6, after } })));
        return true;
      },
      land(K, b, u, c) { c.hold = 0.4; },
    },
    // A well of gravity: everything near it is dragged into the middle, hurt and slowed.
    pull: {
      begin(K, b, u, m, i, c) {
        const p = K.cluster(b, u, m.r * 0.8, m.range);
        if (!p) { u.moveAt[i] = b.time + 1; return false; }
        c.zone = K.zone(b, { shape: 'ring', x: p.x, y: p.y, r: m.r, at: c.at, owner: u.uid, type: 'gravity', swirl: true });
        return true;
      },
      land(K, b, u, c) {
        const m = c.move, z = c.zone, hit = K.within(K.beasts(b), z.x, z.y, m.r * 1.3);
        for (const o of hit) if (!(o.passives && o.passives.unshakeable)) { o.x += (z.x - o.x) * 0.65; o.y += (z.y - o.y) * 0.65; }
        K.blast(b, u, hit, u.light * m.dmg, m.type || 'gravity', { stun: 0.6 });
        K.pileHit(b, z.x, z.y, m.r, 1.5, u);
        z.dead = true; c.hold = 0.4;
        b.events.push({ type: 'mutant', kind: 'pull', unit: u, x: z.x, y: z.y, r: m.r });
      },
    },
    // A beam that sweeps across an arc.
    sweep: {
      begin(K, b, u, m, i, c, cnt, all) {
        const p = K.cluster(b, u, 120, m.len) || nearest(all, u.x, u.y)[0];
        if (!p) { u.moveAt[i] = b.time + 1; return false; }
        const base = Math.atan2(p.y - u.y, p.x - u.x), dir = (u.sweeps = (u.sweeps || 0) + 1) % 2 ? 1 : -1;
        c.a0 = base - dir * m.spread; c.a1 = base + dir * m.spread;
        c.zone = K.zone(b, { shape: 'cone', x: u.x, y: u.y, r: m.len, a: base, spread: m.spread, at: c.at, owner: u.uid, type: m.type, follow: true });
        return true;
      },
      land(K, b, u, c) { c.zone.dead = true; c.angle = c.a0; },
      tick(K, b, u, dt, c) {
        const m = c.move, now = b.time, k = Math.min(1, (now - c.at) / m.dur);
        c.angle = c.a0 + (c.a1 - c.a0) * k;
        if (!(c.nextTick > now)) {
          c.nextTick = now + 0.15;
          for (const o of K.beasts(b).filter((q) => K.inLine(q, u.x, u.y, c.angle, m.len, m.w / 2 + q.r * 0.6))) b.hurt(o, u.light * m.dmg, u, false, m.type);
          if (K.inLine(K.YOUR_PILE, u.x, u.y, c.angle, m.len, m.w / 2 + K.PILE_R * 0.6)) K.takePile(b, 0.3, u);
        }
        if (k >= 1) u.cast = null;
      },
    },
    // A line of geysers erupting one after another from the giant towards a crowd.
    spikes: {
      begin(K, b, u, m, i, c) {
        const tgt = K.cluster(b, u, 100, m.range || 1000) || K.YOUR_PILE;
        const a = Math.atan2(tgt.y - u.y, tgt.x - u.x);
        for (let k = 0; k < (m.n || 9); k++) {
          const d = u.r * 0.9 + (k + 0.5) * (m.gap || 75), x = u.x + Math.cos(a) * d, y = u.y + Math.sin(a) * d;
          if (y > K.AH - 40 || x < 20 || x > K.AW - 20) break;
          c.zones.push(K.zone(b, { shape: 'ring', x, y, r: m.r, at: c.at + k * 0.09, owner: u.uid, type: m.type, spike: true, onLand: { dmg: u.light * m.dmg, type: m.type, move: 'spikes', pileSec: 1 } }));
        }
        c.a = a;
        return c.zones.length > 0;
      },
      land(K, b, u, c) { c.hold = 0.7; },
    },
    // Down into the ground, along under it, and up under a crowd.
    burrow: {
      begin(K, b, u, m, i, c) {
        const p = K.cluster(b, u, m.r * 0.8, m.range);
        if (!p) { u.moveAt[i] = b.time + 1.5; return false; }
        c.to = { x: K.clampX(p.x, u.r + 10), y: Math.min(K.AH - 200, Math.max(u.mutant.top || 220, p.y)) };
        c.zone = K.zone(b, { shape: 'ring', x: c.to.x, y: c.to.y, r: m.r, at: c.at + m.travel, owner: u.uid, type: m.type });
        return true;
      },
      land(K, b, u, c) { u.burrowed = true; c.noStop = true; c.from = { x: u.x, y: u.y }; },
      tick(K, b, u, dt, c) {
        const m = c.move, now = b.time;
        if (!c.up) {
          const k = Math.min(1, (now - c.at) / m.travel);
          u.x = c.from.x + (c.to.x - c.from.x) * k; u.y = c.from.y + (c.to.y - c.from.y) * k;
          if (k >= 1) {
            c.up = now; u.burrowed = false;
            K.blast(b, u, K.within(K.beasts(b), u.x, u.y, m.r), u.light * m.dmg, m.type, { knock: m.knock });
            K.pileHit(b, u.x, u.y, m.r, 3, u);
            c.zone.dead = true;
            b.events.push({ type: 'mutant', kind: 'emerge', unit: u, r: m.r, mtype: m.type });
          }
        } else if (now >= c.up + 0.6) u.cast = null;
      },
    },
    // Tethers to the strongest beasts near it, draining them to mend itself (a stun breaks them).
    drain: {
      begin(K, b, u, m, i, c, cnt, all) {
        const t = all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) <= m.range).sort((a, b2) => b2.hp - a.hp).slice(0, cnt);
        if (!t.length) { u.moveAt[i] = b.time + 1; return false; }
        c.targets = t; c.channel = true;
        return true;
      },
      land(K, b, u, c) { c.until = b.time + c.move.dur; },
      tick(K, b, u, dt, c) {
        const m = c.move, now = b.time;
        c.targets = c.targets.filter((o) => o.state !== 'dying' && Math.hypot(o.x - u.x, o.y - u.y) <= m.range * 1.3);
        if (!(c.nextTick > now)) {
          c.nextTick = now + 0.5;
          for (const o of c.targets) { b.hurt(o, u.light * m.dmg, u, false, m.type || 'void'); u.hp = Math.min(u.maxHp, u.hp + u.light * m.dmg * 0.35); }
        }
        if (now >= c.until || !c.targets.length) u.cast = null;
      },
    },
    // Tentacles, pincers or arms come up under beasts and hold them (Unshakeable slips free).
    grab: {
      begin(K, b, u, m, i, c, cnt, all) {
        const t = nearest(all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) - o.r - u.r <= m.range), u.x, u.y).slice(0, cnt);
        if (!t.length) { u.moveAt[i] = b.time + 1; return false; }
        for (const o of t) c.zones.push(K.zone(b, { shape: 'ring', x: o.x, y: o.y, r: m.r, at: c.at, owner: u.uid, type: m.type, small: true, grab: m.look || 'tentacle' }));
        return true;
      },
      land(K, b, u, c) {
        const m = c.move, all = K.beasts(b), now = b.time;
        c.held = [];
        for (const z of c.zones) {
          z.dead = true;
          const o = all.find((q) => !c.held.includes(q) && Math.hypot(q.x - z.x, q.y - z.y) <= m.r + q.r * 0.5);
          if (!o) continue;
          b.hurt(o, u.light * m.dmg, u, true, m.type);
          if (!(o.passives && o.passives.unshakeable)) Object.assign(o, { stunUntil: Math.max(o.stunUntil, now + m.hold), heldUntil: now + m.hold, heldBy: u.uid, heldLook: m.look || 'tentacle' });
          c.held.push(o);
        }
        c.hold = 0.5;
      },
    },
    // A deafening cone: beasts in it are hurt, thrown back and cannot use their specials for a while.
    scream: {
      begin(K, b, u, m, i, c) {
        const p = K.cluster(b, u, 150, m.r);
        if (!p) { u.moveAt[i] = b.time + 1; return false; }
        c.a = Math.atan2(p.y - u.y, p.x - u.x);
        c.zone = K.zone(b, { shape: 'cone', x: u.x, y: u.y, r: m.r, a: c.a, spread: m.spread, at: c.at, owner: u.uid, type: m.type || 'sonic', follow: true });
        return true;
      },
      land(K, b, u, c) {
        const m = c.move;
        const hit = K.beasts(b).filter((o) => Math.hypot(o.x - u.x, o.y - u.y) - o.r <= m.r && K.angDiff(Math.atan2(o.y - u.y, o.x - u.x), c.a) < m.spread + 0.1);
        K.blast(b, u, hit, u.light * m.dmg, m.type || 'sonic', { knock: m.knock });
        c.zone.dead = true; c.hold = 0.5;
        b.events.push({ type: 'mutant', kind: 'scream', unit: u, a: c.a, r: m.r, spread: m.spread });
      },
    },
    // A shell: three tenths of every blow for a while (Sunder goes through it, Dispel breaks it).
    harden: {
      begin(K, b, u, m, i, c, cnt, all) { if (!K.within(all, u.x, u.y, 500).length) { u.moveAt[i] = b.time + 1; return false; } return true; },
      land(K, b, u, c) { u.hardenUntil = b.time + c.move.dur; b.events.push({ type: 'mutant', kind: 'text', unit: u, text: `🛡 ${c.move.name || 'Hardened'}!`, col: '#ffd0a0' }); },
    },
    // A clutch of eggs set down in front of it, each hatching a few peons unless broken first.
    eggs: {
      begin(K, b, u, m, i, c, cnt) { c.count = cnt; return true; },
      land(K, b, u, c) {
        const m = c.move, now = b.time;
        for (let k = 0; k < c.count; k++) {
          const x = K.clampX(u.x + (k - (c.count - 1) / 2) * 150 + ((k * 37) % 40), 60), y = Math.min(K.AH - 420, u.y + u.r + 90 + (k % 2) * 70);
          const g = K.spawnAt(b, m.egg || 'egg_sac', x, y, m.eggMul || 0.35);
          Object.assign(g, { hatchAt: now + (m.hatch || 9), hatchStart: now, hatchInto: m.peon, hatchN: m.brood || 3, hatchMul: m.mul || 0.45, baseSpeed: 0, speed: 0, noBasic: true });
        }
        c.hold = 0.5;
      },
    },
    // A rift torn open near your line, pouring out enemies for a while.
    rift: {
      begin(K, b, u, m, i, c, cnt, all) {
        const p = all.length ? all[Math.floor(b.time * 7) % all.length] : null;
        const x = p ? K.clampX(p.x + 170 * (p.x < 500 ? 1 : -1), 100) : 200 + ((b.time * 97) % 600);
        const y = p ? Math.max(700, Math.min(1500, p.y - 140)) : 1200;
        c.zone = K.zone(b, { shape: 'ring', x, y, r: 90, at: c.at, owner: u.uid, type: 'void' });
        return true;
      },
      land(K, b, u, c) {
        const m = c.move;
        Object.assign(c.zone, { linger: true, kind: 'rift', until: b.time + m.dur, nextSpawn: b.time + 0.4, spawnEvery: m.spawnEvery || 2.2, peon: m.peon, mul: m.mul || 0.4 });
        c.hold = 0.4;
      },
    },
    // Lightning on the nearest beast, jumping on to the next nearest, and the next.
    chain: {
      begin(K, b, u, m, i, c, cnt, all) {
        const t = nearest(all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) <= m.range), u.x, u.y)[0];
        if (!t) { u.moveAt[i] = b.time + 1; return false; }
        c.first = t; c.count = cnt;
        c.zone = K.zone(b, { shape: 'ring', x: t.x, y: t.y, r: 70, at: c.at, owner: u.uid, type: 'shock', small: true });
        return true;
      },
      wind(K, b, u, dt, c) { if (c.first && c.first.state !== 'dying') { c.zone.x = c.first.x; c.zone.y = c.first.y; } },
      land(K, b, u, c) {
        const m = c.move;
        c.zone.dead = true;
        let cur = c.first && c.first.state !== 'dying' ? c.first : null, dmg = u.light * m.dmg;
        const hits = [], pts = [{ x: u.x, y: u.y - u.r * 2 }];
        while (cur && hits.length < c.count) {
          hits.push(cur); pts.push({ x: cur.x, y: cur.y - cur.r });
          b.hurt(cur, dmg, u, true, m.type || 'shock');
          dmg *= 0.85;
          cur = nearest(K.beasts(b).filter((o) => !hits.includes(o) && Math.hypot(o.x - cur.x, o.y - cur.y) <= (m.jump || 260)), cur.x, cur.y)[0] || null;
        }
        b.events.push({ type: 'mutant', kind: 'chain', unit: u, pts });
        c.hold = 0.4;
      },
    },
    // Orbs that circle the giant for a while, hurting whatever is at their distance.
    orbit: {
      begin(K, b, u, m, i, c, cnt, all) { if (!K.within(all, u.x, u.y, m.r + 150).length) { u.moveAt[i] = b.time + 1; return false; } return true; },
      land(K, b, u, c) { const m = c.move; Object.assign(u, { orbitUntil: b.time + m.dur, orbitR: m.r, orbitN: m.n || 6, orbitType: m.type, orbitDmg: m.dmg, orbitStart: b.time }); c.hold = 0.3; },
    },
    // Your fallen beasts, raised where they fell as its thralls.
    raise: {
      begin(K, b, u, m, i, c, cnt) {
        const f = (b.fallen || []).filter((p) => b.time - p.t < 60);
        if (!f.length) { u.moveAt[i] = b.time + 2; return false; }
        c.spots = f.slice(-cnt);
        for (const p of c.spots) c.zones.push(K.zone(b, { shape: 'ring', x: p.x, y: p.y, r: 60, at: c.at, owner: u.uid, type: 'void', small: true }));
        return true;
      },
      land(K, b, u, c) {
        for (const p of c.spots) { b.fallen = b.fallen.filter((q) => q !== p); const t = K.spawnAt(b, c.move.peon, p.x, p.y, c.move.mul); t.stunUntil = b.time + 0.8; }
        for (const z of c.zones) z.dead = true;
        b.events.push({ type: 'mutant', kind: 'text', unit: u, text: 'The fallen rise!', col: '#c8a0ff' });
        c.hold = 0.5;
      },
    },
    // A mark on the strongest beast; when the wind-up ends, a blow that kills it unless warded.
    mark: {
      begin(K, b, u, m, i, c, cnt, all) {
        const t = all.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) <= m.range).sort((a, b2) => b2.maxHp * b2.light - a.maxHp * a.light)[0];
        if (!t) { u.moveAt[i] = b.time + 1; return false; }
        c.target = t; t.markedUntil = c.at;
        c.zone = K.zone(b, { shape: 'ring', x: t.x, y: t.y, r: t.r + 30, at: c.at, owner: u.uid, type: m.type || 'void', small: true, mark: true });
        b.events.push({ type: 'mutant', kind: 'text', unit: t, text: '☠ Marked!', col: '#c8a0ff' });
        return true;
      },
      wind(K, b, u, dt, c) { const t = c.target; if (t && t.state !== 'dying') { c.zone.x = t.x; c.zone.y = t.y; } },
      land(K, b, u, c) {
        const t = c.target;
        c.zone.dead = true;
        if (t && t.state !== 'dying') { b.hurt(t, u.light * c.move.dmg, u, true, c.move.type || 'void'); b.events.push({ type: 'mutant', kind: 'doom', unit: t }); }
        if (t) t.markedUntil = 0;
        c.hold = 0.5;
      },
    },
    // Charge after charge: at your coins, then at the biggest crowd, then your coins again.
    stampede: {
      begin(K, b, u, m, i, c, cnt) { c.reps = cnt; c.rep = 0; return MOVES.stampede.aim(K, b, u, c, c.at); },
      aim(K, b, u, c, at) {
        const m = c.move, p = K.cluster(b, u, 150, 1200);
        const tgt = c.rep % 2 === 0 || !p ? K.YOUR_PILE : p;
        const a = Math.atan2(tgt.y - u.y, tgt.x - u.x);
        c.a = a; c.len = Math.min(m.len, Math.max(0, Math.hypot(tgt.x - u.x, tgt.y - u.y) - 120));
        if (c.len < 150) return false;
        c.zone = K.zone(b, { shape: 'line', x: u.x, y: u.y, a, len: c.len, w: u.r * 1.8, at, owner: u.uid, type: m.type });
        c.hit = new Set(); c.done = 0; c.runAt = at; c.hitPile = false;
        return true;
      },
      land() {},
      tick(K, b, u, dt, c) {
        const m = c.move, now = b.time;
        if (now < c.runAt) return;
        const sp = 1000 * dt;
        c.done += sp;
        u.x = K.clampX(u.x + Math.cos(c.a) * sp, u.r + 6); u.y = Math.min(K.AH - 220, Math.max(u.mutant.top || 160, u.y + Math.sin(c.a) * sp));
        for (const o of K.beasts(b)) if (!c.hit.has(o.uid) && Math.hypot(o.x - u.x, o.y - u.y) - o.r < u.r * 1.1) { c.hit.add(o.uid); b.hurt(o, u.light * m.dmg, u, true, m.type); K.knockFrom(b, o, u.x, u.y, m.knock); }
        if (!c.hitPile && Math.hypot(K.YOUR_PILE.x - u.x, K.YOUR_PILE.y - u.y) < u.r + K.PILE_R) { c.hitPile = true; K.takePile(b, 2.5, u); }
        if (c.done >= c.len || u.y >= K.AH - 220) {
          c.zone.dead = true; c.rep++;
          if (c.rep >= c.reps || !MOVES.stampede.aim(K, b, u, c, now + 0.55)) u.cast = null;
        }
      },
    },
  };

  // ------------------------------------------------------------------ every step
  function step(K, b) {
    if (b.level.world < 8) return;
    const now = b.time;
    for (const g of b.units) {
      if (g.state === 'dying') continue;
      // Eggs hatch.
      if (g.hatchAt && g.side === 'foe') {
        g.speed = 0; g.baseSpeed = 0;
        if (now >= g.hatchAt) {
          g.hp = 0; g.state = 'dying'; g.dyingT = 0;
          for (let k = 0; k < g.hatchN; k++) K.spawnAt(b, g.hatchInto, g.x + (k - (g.hatchN - 1) / 2) * 40, g.y + 20, g.hatchMul);
          b.events.push({ type: 'mutant', kind: 'hatch', unit: g });
        }
        continue;
      }
      // Orbs circling a giant.
      if (g.orbitUntil > now && !(g.orbitTick > now)) {
        g.orbitTick = now + 0.3;
        for (const o of K.beasts(b).filter((q) => Math.abs(Math.hypot(q.x - g.x, q.y - g.y) - g.orbitR) < 55 + q.r * 0.4)) b.hurt(o, g.light * g.orbitDmg * 0.5, g, false, g.orbitType);
      }
      // A beast held by tentacles, pincers or arms is crushed a little at a time (free if its captor falls).
      if (g.side === 'you' && g.heldUntil > now && !(g.heldTick > now)) {
        g.heldTick = now + 0.5;
        const by = b.units.find((o) => o.uid === g.heldBy && o.state !== 'dying');
        if (by) b.hurt(g, by.light * 0.35, by, false, 'dot'); else { g.heldUntil = 0; g.stunUntil = Math.min(g.stunUntil, now); }
      }
    }
    // Rifts pour out their enemies.
    const foes = b.units.filter((o) => o.side === 'foe' && o.state !== 'dying').length;
    for (const z of b.zones) {
      if (z.kind !== 'rift' || z.dead || now < z.nextSpawn || now >= z.until) continue;
      z.nextSpawn = now + z.spawnEvery;
      if (foes < (b.level.maxEnemies || 24) + 2) { const p = K.spawnAt(b, z.peon, z.x, z.y, z.mul); b.events.push({ type: 'mutant', kind: 'rift-spawn', unit: p }); }
    }
  }
  /** When a Warden falls the others grow desperate. */
  function death(K, b, o) {
    if (!o.mutant || !o.mutant.link) return;
    for (const w of b.units) if (w !== o && w.mutant && w.mutant.link === o.mutant.link && w.state !== 'dying') { w.haste *= 0.8; b.events.push({ type: 'mutant', kind: 'text', unit: w, text: 'The Wardens grow desperate!', col: '#ffb8a8' }); }
  }
  /** For the drawings: sinking into the ground, orbs, a stampede under way, an egg's age. */
  function pose(b, u, out) {
    const c = u.cast, now = b.time;
    if (c && c.move.kind === 'burrow' && c.stage === 'wind') out.sink = out.k;
    if (c && c.move.kind === 'stampede' && c.runAt <= now) out.charging = true;
    if (c && c.move.kind === 'drain' && c.stage === 'act') out.draining = true;
    if (u.orbitUntil > now) out.orbit = { r: u.orbitR, n: u.orbitN, t: now - u.orbitStart, left: u.orbitUntil - now, type: u.orbitType };
    if (u.hatchAt) out.hatch = Math.min(1, (now - (u.hatchStart || now)) / Math.max(1, u.hatchAt - (u.hatchStart || now)));
    if (u.mutant && u.mutant.link) out.linked = b.units.some((x) => x !== u && x.mutant && x.mutant.link === u.mutant.link && x.state !== 'dying' && Math.hypot(x.x - u.x, x.y - u.y) < 380);
  }

  // ------------------------------------------------------------------ the twenty levels
  const W = (a) => [['warden_gravity', 3, 0.25, a], ['warden_void', 3, 0.5, a ? { with: true } : undefined], ['warden_sonic', 3, 0.75, a ? { with: true } : undefined]];
  const levels = [
    { name: 'Gravemaw the Abyssal Worm', tip: 'It comes up under crowds. Keep your beasts spread out, and bring fire.', bosses: [['gravemaw', 3, 0.5]], peons: [[1, 'maw_grub', 0.3], [1.2, 'maw_grub', 0.5], [1.4, 'maw_grub', 0.7]], every: [[20, 'maw_grub', 15]] },
    { name: 'Vex, the Iron Brood Queen', tip: 'Break her egg clutches before they hatch. Water shorts her out.', bosses: [['brood_queen', 3, 0.5]], peons: [[1, 'spiderling', 0.3], [1.3, 'spiderling', 0.7]], every: [[18, 'spiderling', 12]] },
    { name: 'Nyxara the Eclipse Moth', tip: 'Her shriek deafens your specials: use them before she screams. Bring light.', bosses: [['eclipse_moth', 3, 0.5]], peons: [[1, 'void_wisp', 0.35], [1.3, 'void_wisp', 0.65]], every: [[25, 'void_wisp', 20]] },
    { name: 'Magmaton the Volcano Titan', tip: 'Keep off the burning ground. Sunder and Dispel break its obsidian shell.', bosses: [['magmaton', 3, 0.5]], peons: [[1, 'magma_blob', 0.4], [1.2, 'magma_blob', 0.6]], every: [[26, 'magma_blob', 22]] },
    { name: 'The Crystal Leviathan', tip: 'Its prism beam sweeps the field. Earth beasts crack its crystal.', bosses: [['crystal_leviathan', 3, 0.5]], peons: [[1, 'shardling', 0.3], [1.2, 'shardling', 0.7]], every: [[22, 'shardling', 18]] },
    { name: 'Thunderhoof the Storm Bull', tip: 'Its lightning jumps between beasts that stand close, and it stampedes at your coins.', bosses: [['storm_bull', 3, 0.5]], peons: [[1, 'abyss_knight', 0.5]], every: [[30, 'abyss_knight', 25]] },
    { name: 'Skarnox the Siege Scorpion', tip: 'Its mortar shells your coins. Its shell turns blows from the front: hit it from the sides.', bosses: [['siege_scorpion', 3, 0.5]], peons: [[1, 'sand_scuttler', 0.3], [1.2, 'sand_scuttler', 0.5], [1.4, 'sand_scuttler', 0.7]], every: [[20, 'sand_scuttler', 15]] },
    { name: 'The Three Wardens', tip: 'Together they shield each other. Pull them apart with Stagger, Anchor and knockback.', bosses: W(false), peons: [] },
    { name: 'Morgrath the Hollow King', tip: 'Your fallen rise as his thralls, and his mark kills. Ward the marked beast, and bring light.', bosses: [['hollow_king', 3, 0.5]], peons: [[1, 'void_priest', 0.3], [1.3, 'void_priest', 0.7]], every: [[35, 'void_priest', 30]] },
    { name: 'The Abomination', tip: 'It tears into smaller copies as it weakens, and every one must fall.', bosses: [['abomination', 3, 0.5]], peons: [[1, 'bone_thrall', 0.4], [1.2, 'bone_thrall', 0.6]] },
    { name: 'Worm and Brood', tip: 'The worm comes up among the spiderlings. Break the eggs, keep moving.', bosses: [['gravemaw', 3, 0.3], ['brood_queen', 12, 0.7]], peons: [[1, 'spiderling', 0.5], [1.2, 'maw_grub', 0.4], [1.4, 'maw_grub', 0.6]], every: [[18, 'spiderling', 14], [22, 'maw_grub', 20]] },
    { name: 'The Black Storm', tip: 'Lightning and a shriek at once. Keep your specials for the bull.', bosses: [['eclipse_moth', 3, 0.3], ['storm_bull', 10, 0.7]], peons: [[1, 'void_wisp', 0.5]], every: [[25, 'void_wisp', 20]] },
    { name: 'Fire and Crystal', tip: 'Water for the titan, earth for the Leviathan.', bosses: [['magmaton', 3, 0.3], ['crystal_leviathan', 8, 0.7]], peons: [[1, 'magma_blob', 0.4], [1.2, 'shardling', 0.6]], every: [[24, 'magma_blob', 20]] },
    { name: 'The Hollow Court', tip: 'Knights guard the king, priests mend him, and stalkers slip past to your coins.', bosses: [['hollow_king', 3, 0.5]], peons: [[1, 'abyss_knight', 0.3], [1.2, 'abyss_knight', 0.7], [4, 'void_priest', 0.4], [4.3, 'void_priest', 0.6], [8, 'rift_stalker', 0.2], [8.3, 'rift_stalker', 0.8]], every: [[25, 'rift_stalker', 20], [35, 'void_priest', 30]] },
    { name: 'Sand and Flesh', tip: 'The scorpion shells your coins while the Abomination tears itself apart.', bosses: [['siege_scorpion', 3, 0.3], ['abomination', 14, 0.7]], peons: [[1, 'sand_scuttler', 0.4], [1.2, 'sand_scuttler', 0.6]], every: [[20, 'sand_scuttler', 16]] },
    { name: 'The Wardens\' Gate', tip: 'Knights hold the gate while the Wardens shield each other behind them.', bosses: W(false), peons: [[1, 'abyss_knight', 0.35], [1.2, 'abyss_knight', 0.65]], every: [[30, 'abyss_knight', 25], [28, 'rift_stalker', 20]] },
    { name: 'The Long Night', tip: 'Darkness and the dead. Light beasts shine here.', bosses: [['eclipse_moth', 3, 0.3], ['hollow_king', 8, 0.7]], peons: [[1, 'void_wisp', 0.4], [1.2, 'void_priest', 0.6]], every: [[22, 'void_wisp', 18]] },
    { name: 'Three Titans', tip: 'Three giants at once. Choose which falls first.', bosses: [['magmaton', 3, 0.2], ['storm_bull', 3, 0.5], ['crystal_leviathan', 3, 0.8]], peons: [[6, 'magma_blob', 0.5]], every: [[30, 'shardling', 25]] },
    { name: 'The Apex Gauntlet', tip: 'Three fights in turn: the Abomination, the Wardens, then the worm and the king together.', bosses: [['abomination', 3, 0.5], ['warden_gravity', 0, 0.25, { after: true }], ['warden_void', 0, 0.5, { with: true }], ['warden_sonic', 0, 0.75, { with: true }], ['gravemaw', 0, 0.35, { after: true }], ['hollow_king', 0, 0.65, { with: true }]], peons: [] },
    { name: 'The World-Eater', tip: 'The last battle there is. Everything you have learned, at once.', bosses: [['world_eater', 4, 0.5]], peons: [[1, 'abyss_knight', 0.3], [1.2, 'abyss_knight', 0.7], [3, 'void_priest', 0.5]], every: [[30, 'rift_stalker', 25]] },
  ];
  // (The first Wardens level has no 'with': all three come together at the start.)
  levels[7].bosses = levels[7].bosses.map((x) => x.filter((v) => v !== undefined));
  levels[15].bosses = levels[15].bosses.map((x) => x.filter((v) => v !== undefined));

  const short = { gravemaw: 'Gravemaw', brood_queen: 'Vex', eclipse_moth: 'Nyxara', magmaton: 'Magmaton', crystal_leviathan: 'The Leviathan', storm_bull: 'Thunderhoof', siege_scorpion: 'Skarnox', warden_gravity: 'The Gravity Warden', warden_void: 'The Void Warden', warden_sonic: 'The Sonic Warden', hollow_king: 'Morgrath', abomination: 'The Abomination', lesser_abomination: 'A lesser abomination', world_eater: 'The World-Eater' };

  MUTANTS.extend(8, { enemies, bosses, levels, moves: MOVES, step, death, pose, short });
})();
