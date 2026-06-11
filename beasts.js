/**
 * Mystic Beasts Evolution - Beast Database & Visual Renderers
 * Defines the 45 beasts, elements, stats, and procedural SVG graphics.
 */

const ELEMENTS = {
  LIGHT: { name: 'Light', color: '#ffd700', theme: 'light' },
  FIRE: { name: 'Fire', color: '#ff4500', theme: 'fire' },
  WATER: { name: 'Water', color: '#00ced1', theme: 'water' },
  EARTH: { name: 'Earth', color: '#4ebc5b', theme: 'earth' },
  WIND: { name: 'Wind', color: '#a8e6cf', theme: 'wind' },
  COSMIC: { name: 'Cosmic', color: '#8a2be2', theme: 'cosmic' },
  VOID: { name: 'Void', color: '#4b0082', theme: 'void' },
  DEITY: { name: 'Deity', color: '#e6e6fa', theme: 'deity' }
};

const RARITIES = {
  COMMON: { name: 'Common', color: '#b0c4de', multiplier: 1, glow: 'none' },
  RARE: { name: 'Rare', color: '#1eff00', multiplier: 1.5, glow: 'rgba(30, 255, 0, 0.4)' },
  SUPER_RARE: { name: 'Super Rare', color: '#0070dd', multiplier: 4, glow: 'rgba(0, 112, 221, 0.6)' },
  ULTRA_RARE: { name: 'Ultra Rare', color: '#af40ff', multiplier: 15, glow: 'rgba(175, 64, 255, 0.8)' },
  LEGENDARY: { name: 'Legendary', color: '#ff8000', multiplier: 50, glow: 'rgba(255, 128, 0, 0.9)' },
  GODLY: { name: 'Godly', color: '#00ffff', multiplier: 200, glow: 'rgba(0, 255, 255, 0.95)' },
  DARK_MATTER: { name: 'Dark Matter', color: '#ff00ff', multiplier: 1000, glow: 'rgba(255, 0, 255, 0.95)' }
};

// 45 Beasts definition
const BEAST_TEMPLATES = {
  // TIER 1
  sparky: {
    id: 'sparky',
    name: 'Sparky',
    tier: 1,
    rarity: 'COMMON',
    element: 'LIGHT',
    baseCps: 1,
    lore: 'A tiny floating spark of raw mystical energy. It bobs around aimlessly, warm to the touch.',
    cost: 10,
    evolutions: [{ to: 'ember', weight: 90 }, { to: 'dewdrop', weight: 10 }],
    svgParams: { body: 'droplet', eyes: 'cute', color: ['#fff9db', '#ffd43b'], glow: '#ffd43b', sparks: true }
  },

  // TIER 2
  ember: {
    id: 'ember',
    name: 'Ember',
    tier: 2,
    rarity: 'COMMON',
    element: 'FIRE',
    baseCps: 5,
    lore: 'A glowing coal that has developed a friendly consciousness. Often leaves tiny charcoal footprints.',
    cost: 80,
    evolutions: [{ to: 'cinder', weight: 90 }, { to: 'sprout', weight: 9 }, { to: 'zephyr', weight: 1 }],
    svgParams: { body: 'stone', eyes: 'sleepy', color: ['#e8590c', '#ff922b'], cracks: true }
  },
  dewdrop: {
    id: 'dewdrop',
    name: 'Dewdrop',
    tier: 2,
    rarity: 'RARE',
    element: 'WATER',
    baseCps: 8,
    lore: 'A floating water droplet that shimmers in daylight. It squeaks when squeezed gently.',
    cost: 150,
    evolutions: [{ to: 'sprout', weight: 80 }, { to: 'zephyr', weight: 19 }, { to: 'cinder', weight: 1 }],
    svgParams: { body: 'droplet', eyes: 'excited', color: ['#15aabf', '#22b8cf'], bubbles: true }
  },

  // TIER 3
  cinder: {
    id: 'cinder',
    name: 'Cinder',
    tier: 3,
    rarity: 'COMMON',
    element: 'FIRE',
    baseCps: 25,
    lore: 'Volcanic rock hardened around a beating lava core. Spits small, harmless sparks when happy.',
    cost: 600,
    evolutions: [{ to: 'pyreling', weight: 90 }, { to: 'aqualet', weight: 9 }, { to: 'terrapin', weight: 1 }],
    svgParams: { body: 'spiky_stone', eyes: 'angry', color: ['#c92a2a', '#e03131'], spikes: true }
  },
  sprout: {
    id: 'sprout',
    name: 'Sprout',
    tier: 3,
    rarity: 'RARE',
    element: 'EARTH',
    baseCps: 40,
    lore: 'A small vine that coiled into a shape of a beast. Leaves trail of flower petals in its wake.',
    cost: 1200,
    evolutions: [{ to: 'aqualet', weight: 70 }, { to: 'terrapin', weight: 25 }, { to: 'pyreling', weight: 5 }],
    svgParams: { body: 'droplet', eyes: 'cute', color: ['#2b8a3e', '#37b24d'], foliage: true, tail: 'leaf' }
  },
  zephyr: {
    id: 'zephyr',
    name: 'Zephyr',
    tier: 3,
    rarity: 'SUPER_RARE',
    element: 'WIND',
    baseCps: 110,
    lore: 'Formed from soft summer winds. It behaves like a playful puppy made of pure white mist.',
    cost: 2500,
    evolutions: [{ to: 'terrapin', weight: 60 }, { to: 'aqualet', weight: 30 }, { to: 'pyreling', weight: 10 }],
    svgParams: { body: 'cloud', eyes: 'wink', color: ['#e3faf2', '#c3fae8'], wind_swirls: true, wings: 'cloudy' }
  },

  // TIER 4
  pyreling: {
    id: 'pyreling',
    name: 'Pyreling',
    tier: 4,
    rarity: 'COMMON',
    element: 'FIRE',
    baseCps: 120,
    lore: 'A small flame lizard that runs around frantically, leaving scorching lines in the dirt.',
    cost: 5000,
    evolutions: [{ to: 'ignis', weight: 90 }, { to: 'torrent', weight: 9 }, { to: 'sylph', weight: 1 }],
    svgParams: { body: 'reptile', eyes: 'excited', color: ['#e63946', '#f1faee'], horns: 2, tail: 'flaming' }
  },
  aqualet: {
    id: 'aqualet',
    name: 'Aqualet',
    tier: 4,
    rarity: 'RARE',
    element: 'WATER',
    baseCps: 180,
    lore: 'An axolotl-like water spirit. It loves floating upside down, blowing glowing blue bubbles.',
    cost: 9000,
    evolutions: [{ to: 'torrent', weight: 75 }, { to: 'sylph', weight: 20 }, { to: 'ignis', weight: 5 }],
    svgParams: { body: 'lizard', eyes: 'cute', color: ['#0077b6', '#90e0ef'], gills: true, tail: 'fin' }
  },
  terrapin: {
    id: 'terrapin',
    name: 'Terrapin',
    tier: 4,
    rarity: 'SUPER_RARE',
    element: 'EARTH',
    baseCps: 500,
    lore: 'A moss-backed tortoise. It moves extremely slowly but has an ancient, wise gaze.',
    cost: 20000,
    evolutions: [{ to: 'sylph', weight: 60 }, { to: 'torrent', weight: 35 }, { to: 'ignis', weight: 5 }],
    svgParams: { body: 'shell', eyes: 'sleepy', color: ['#795548', '#8d6e63'], shell: 'mossy' }
  },

  // TIER 5
  ignis: {
    id: 'ignis',
    name: 'Ignis',
    tier: 5,
    rarity: 'COMMON',
    element: 'FIRE',
    baseCps: 600,
    lore: 'A mystical fox born from campfire embers. Its three tails wave like flickering torches.',
    cost: 45000,
    evolutions: [{ to: 'magmadon', weight: 90 }, { to: 'hydradon', weight: 8 }, { to: 'aven', weight: 1.9 }, { to: 'frostbite', weight: 0.1 }],
    svgParams: { body: 'fox', eyes: 'wink', color: ['#d9480f', '#ff922b'], ears: 'flame', tail: 'triple_flame' }
  },
  torrent: {
    id: 'torrent',
    name: 'Torrent',
    tier: 5,
    rarity: 'RARE',
    element: 'WATER',
    baseCps: 900,
    lore: 'A water wolf whose fur flows like a river stream. It leaves behind puddles of sparkling dew.',
    cost: 80000,
    evolutions: [{ to: 'hydradon', weight: 70 }, { to: 'aven', weight: 24.9 }, { to: 'magmadon', weight: 5 }, { to: 'frostbite', weight: 0.1 }],
    svgParams: { body: 'wolf', eyes: 'angry', color: ['#0b7285', '#15aabf'], fins: true, tail: 'wave' }
  },
  sylph: {
    id: 'sylph',
    name: 'Sylph',
    tier: 5,
    rarity: 'SUPER_RARE',
    element: 'WIND',
    baseCps: 2600,
    lore: 'A delicate wind fairy that rides on breeze currents. It leaves glowing trails of dandelion seeds.',
    cost: 175000,
    evolutions: [{ to: 'aven', weight: 65 }, { to: 'hydradon', weight: 29.9 }, { to: 'magmadon', weight: 5 }, { to: 'frostbite', weight: 0.1 }],
    svgParams: { body: 'fairy', eyes: 'cute', color: ['#e2f0d9', '#a9d08e'], wings: 'leafy', halo: 'leaves' }
  },

  // TIER 6
  magmadon: {
    id: 'magmadon',
    name: 'Magmadon',
    tier: 6,
    rarity: 'COMMON',
    element: 'FIRE',
    baseCps: 3100,
    lore: 'A heavy molten dinosaur. The plates on its back heat up to extreme temperatures when it roars.',
    cost: 380000,
    evolutions: [{ to: 'volcanis', weight: 90 }, { to: 'geon', weight: 8 }, { to: 'nebulon', weight: 1.9 }, { to: 'gargoyle', weight: 0.1 }],
    svgParams: { body: 'dino', eyes: 'angry', color: ['#862e9c', '#f783ac'], back_plates: 'molten', tail: 'club' }
  },
  hydradon: {
    id: 'hydradon',
    name: 'Hydradon',
    tier: 6,
    rarity: 'RARE',
    element: 'WATER',
    baseCps: 4700,
    lore: 'A twin-headed sea serpent. The two heads often argue about which way to crawl.',
    cost: 700000,
    evolutions: [{ to: 'geon', weight: 70 }, { to: 'nebulon', weight: 24.9 }, { to: 'volcanis', weight: 5 }, { to: 'gargoyle', weight: 0.1 }],
    svgParams: { body: 'hydra', eyes: 'excited', color: ['#1c7ed6', '#72c3fc'], double_head: true, tail: 'fin' }
  },
  aven: {
    id: 'aven',
    name: 'Aven',
    tier: 6,
    rarity: 'SUPER_RARE',
    element: 'WIND',
    baseCps: 13000,
    lore: 'A storm griffin that commands lightning. Sparks crackle between its razor-sharp sky feathers.',
    cost: 1500000,
    evolutions: [{ to: 'nebulon', weight: 65 }, { to: 'geon', weight: 29.9 }, { to: 'volcanis', weight: 5 }, { to: 'gargoyle', weight: 0.1 }],
    svgParams: { body: 'griffin', eyes: 'angry', color: ['#ffc9c9', '#ff8787'], wings: 'feathered', feather_crest: true }
  },
  frostbite: {
    id: 'frostbite',
    name: 'Frostbite',
    tier: 6,
    rarity: 'RARE',
    element: 'WATER',
    baseCps: 6200,
    lore: 'An ice-breathing lizard that chills the air around it. It loves taking naps on snowbanks.',
    cost: 1100000,
    evolutions: [{ to: 'geon', weight: 65 }, { to: 'nebulon', weight: 25 }, { to: 'volcanis', weight: 9.9 }, { to: 'gargoyle', weight: 0.1 }],
    svgParams: { body: 'reptile', eyes: 'cute', color: ['#a5f3fc', '#0284c7'], ice_spikes: true, tail: 'fin' }
  },

  // TIER 7 (PRESTIGE 1)
  volcanis: {
    id: 'volcanis',
    name: 'Volcanis',
    tier: 7,
    rarity: 'COMMON',
    element: 'FIRE',
    baseCps: 16000,
    lore: 'A raging bull wrapped in dark ash clouds. Its hooves leave burning footprints in the ground.',
    cost: 3500000,
    evolutions: [{ to: 'blazehorn', weight: 90 }, { to: 'aqualion', weight: 8 }, { to: 'aeris', weight: 1.9 }, { to: 'chronos', weight: 0.1 }],
    svgParams: { body: 'bull', eyes: 'angry', color: ['#c92a2a', '#f03e3e'], horns: 2, steam: true }
  },
  geon: {
    id: 'geon',
    name: 'Geon',
    tier: 7,
    rarity: 'RARE',
    element: 'EARTH',
    baseCps: 24000,
    lore: 'A rocky construct floating around hovering crystal columns. It hums with deep resonance.',
    cost: 6000000,
    evolutions: [{ to: 'aqualion', weight: 70 }, { to: 'aeris', weight: 25 }, { to: 'blazehorn', weight: 4.9 }, { to: 'chronos', weight: 0.1 }],
    svgParams: { body: 'golem', eyes: 'sleepy', color: ['#5c940d', '#94d82d'], crystals: true }
  },
  nebulon: {
    id: 'nebulon',
    name: 'Nebulon',
    tier: 7,
    rarity: 'SUPER_RARE',
    element: 'COSMIC',
    baseCps: 65000,
    lore: 'A space-faring feline made of cosmic gas. It bats at tiny orbiting asteroids like toy yarn.',
    cost: 15000000,
    evolutions: [{ to: 'aeris', weight: 65 }, { to: 'aqualion', weight: 25 }, { to: 'blazehorn', weight: 9.9 }, { to: 'chronos', weight: 0.1 }],
    svgParams: { body: 'cat', eyes: 'cute', color: ['#ae3ec9', '#da77f2'], stars: true, orbits: 2 }
  },
  gargoyle: {
    id: 'gargoyle',
    name: 'Gargoyle',
    tier: 7,
    rarity: 'RARE',
    element: 'EARTH',
    baseCps: 31000,
    lore: 'A stone watcher that came to life. It remains perfectly still when observed, pretending to be a statue.',
    cost: 10000000,
    evolutions: [{ to: 'aqualion', weight: 65 }, { to: 'aeris', weight: 25 }, { to: 'blazehorn', weight: 9.9 }, { to: 'chronos', weight: 0.1 }],
    svgParams: { body: 'stone', eyes: 'angry', color: ['#4b5563', '#9ca3af'], horns: 2, wings: 'shadow' }
  },

  // TIER 8 (PRESTIGE 2)
  blazehorn: {
    id: 'blazehorn',
    name: 'Blazehorn',
    tier: 8,
    rarity: 'COMMON',
    element: 'FIRE',
    baseCps: 82000,
    lore: 'A majestic horse of flame. Its horn burns with a pure white light that can incinerate anything.',
    cost: 32000000,
    evolutions: [{ to: 'pyroclasm', weight: 90 }, { to: 'glaciator', weight: 8 }, { to: 'astral', weight: 1.9 }, { to: 'aether', weight: 0.1 }],
    svgParams: { body: 'horse', eyes: 'excited', color: ['#d9480f', '#ffa94d'], horn: 'flame', tail: 'flaming' }
  },
  aqualion: {
    id: 'aqualion',
    name: 'Aqualion',
    tier: 8,
    rarity: 'RARE',
    element: 'WATER',
    baseCps: 125000,
    lore: 'A water lion with a flowing mane made of bubbling sea foam. Its roar sounds like rolling ocean waves.',
    cost: 60000000,
    evolutions: [{ to: 'glaciator', weight: 70 }, { to: 'astral', weight: 25 }, { to: 'pyroclasm', weight: 4.9 }, { to: 'aether', weight: 0.1 }],
    svgParams: { body: 'lion', eyes: 'angry', color: ['#1864ab', '#4dabf7'], mane: 'bubble', tail: 'wave' }
  },
  aeris: {
    id: 'aeris',
    name: 'Aeris',
    tier: 8,
    rarity: 'SUPER_RARE',
    element: 'WIND',
    baseCps: 340000,
    lore: 'A legendary bird that summons massive tornadoes when flapping its bright wind-shimmering wings.',
    cost: 140000000,
    evolutions: [{ to: 'astral', weight: 65 }, { to: 'glaciator', weight: 25 }, { to: 'pyroclasm', weight: 9.9 }, { to: 'aether', weight: 0.1 }],
    svgParams: { body: 'bird', eyes: 'wink', color: ['#087f5b', '#38d9a9'], wings: 'windy', tail: 'long_feathers' }
  },
  chronos: {
    id: 'chronos',
    name: 'Chronos',
    tier: 8,
    rarity: 'ULTRA_RARE',
    element: 'COSMIC',
    baseCps: 1300000,
    lore: 'A golden dragon of time. It manipulates time, accelerating the essence collection around it.',
    cost: 500000000,
    evolutions: [{ to: 'aether', weight: 50 }, { to: 'astral', weight: 35 }, { to: 'glaciator', weight: 14 }, { to: 'pyroclasm', weight: 1 }],
    svgParams: { body: 'dragon', eyes: 'cosmic', color: ['#f59f00', '#ffe066'], gears: true, wings: 'golden' }
  },

  // TIER 9 (PRESTIGE 3)
  pyroclasm: {
    id: 'pyroclasm',
    name: 'Pyroclasm',
    tier: 9,
    rarity: 'COMMON',
    element: 'FIRE',
    baseCps: 450000,
    lore: 'An active lava titan. When it moves, the ground turns to magma and ash drifts float into the air.',
    cost: 950000000,
    evolutions: [{ to: 'phoenix', weight: 90 }, { to: 'leviathan', weight: 8 }, { to: 'eclipse', weight: 1.9 }, { to: 'genesis', weight: 0.1 }],
    svgParams: { body: 'golem', eyes: 'angry', color: ['#5f3dc4', '#b197fc'], magma_veins: true, crown: 'spiky' }
  },
  glaciator: {
    id: 'glaciator',
    name: 'Glaciator',
    tier: 9,
    rarity: 'RARE',
    element: 'WATER',
    baseCps: 680000,
    lore: 'An ancient ice giant. Its body is constructed from glacier ice that never melts.',
    cost: 1800000000,
    evolutions: [{ to: 'leviathan', weight: 70 }, { to: 'eclipse', weight: 25 }, { to: 'phoenix', weight: 4.9 }, { to: 'genesis', weight: 0.1 }],
    svgParams: { body: 'stone', eyes: 'sleepy', color: ['#1971c2', '#a5d8ff'], ice_spikes: true }
  },
  astral: {
    id: 'astral',
    name: 'Astral',
    tier: 9,
    rarity: 'SUPER_RARE',
    element: 'COSMIC',
    baseCps: 1800000,
    lore: 'A pegasus born from the stellar winds of a dying star. Constellations drift across its body.',
    cost: 4200000000,
    evolutions: [{ to: 'eclipse', weight: 65 }, { to: 'leviathan', weight: 25 }, { to: 'phoenix', weight: 9.9 }, { to: 'genesis', weight: 0.1 }],
    svgParams: { body: 'horse', eyes: 'cosmic', color: ['#e599f7', '#f3d9fa'], wings: 'starry', horn: 'crystal' }
  },
  aether: {
    id: 'aether',
    name: 'Aether',
    tier: 9,
    rarity: 'ULTRA_RARE',
    element: 'VOID',
    baseCps: 7500000,
    lore: 'An entity from the void dimension. Its body bends light and leaves a dark star trail.',
    cost: 12000000000,
    evolutions: [{ to: 'genesis', weight: 50 }, { to: 'eclipse', weight: 35 }, { to: 'leviathan', weight: 14 }, { to: 'phoenix', weight: 1 }],
    svgParams: { body: 'droplet', eyes: 'cosmic', color: ['#212529', '#343a40'], void_core: true, wings: 'shadow' }
  },

  // TIER 10 (PRESTIGE 4)
  phoenix: {
    id: 'phoenix',
    name: 'Phoenix',
    tier: 10,
    rarity: 'COMMON',
    element: 'FIRE',
    baseCps: 2500000,
    lore: 'The legendary firebird of rebirth. Its blazing wings illuminate the dark clearing with holy warmth.',
    cost: 25000000000,
    evolutions: [{ to: 'titan', weight: 90 }, { to: 'hydrasaur', weight: 7.9 }, { to: 'supernova', weight: 2 }, { to: 'cosmos', weight: 0.1 }],
    svgParams: { body: 'bird', eyes: 'excited', color: ['#e8590c', '#ffe3e3'], wings: 'fire_feathers', halo: 'sun' }
  },
  leviathan: {
    id: 'leviathan',
    name: 'Leviathan',
    tier: 10,
    rarity: 'RARE',
    element: 'WATER',
    baseCps: 3800000,
    lore: 'The giant sea dragon of legend. Shimmers with sea energy and controls the tides.',
    cost: 50000000000,
    evolutions: [{ to: 'hydrasaur', weight: 70 }, { to: 'supernova', weight: 24.9 }, { to: 'titan', weight: 5 }, { to: 'cosmos', weight: 0.1 }],
    svgParams: { body: 'dragon', eyes: 'angry', color: ['#0b7285', '#96f2d7'], sea_fins: true, tail: 'serpent' }
  },
  eclipse: {
    id: 'eclipse',
    name: 'Eclipse',
    tier: 10,
    rarity: 'SUPER_RARE',
    element: 'VOID',
    baseCps: 10000000,
    lore: 'A dragon born during a total solar eclipse. It floats in a corona halo of black fire.',
    cost: 120000000000,
    evolutions: [{ to: 'supernova', weight: 65 }, { to: 'hydrasaur', weight: 24.9 }, { to: 'titan', weight: 10 }, { to: 'cosmos', weight: 0.1 }],
    svgParams: { body: 'dragon', eyes: 'cosmic', color: ['#1a1b1f', '#ff922b'], eclipse_ring: true, wings: 'shadow' }
  },
  genesis: {
    id: 'genesis',
    name: 'Genesis',
    tier: 10,
    rarity: 'ULTRA_RARE',
    element: 'DEITY',
    baseCps: 45000000,
    lore: 'The creator deity of all mystical beasts. Orbiting celestial rings weave the essence of creation.',
    cost: 300000000000,
    evolutions: [{ to: 'cosmos', weight: 50 }, { to: 'supernova', weight: 34.9 }, { to: 'hydrasaur', weight: 15 }, { to: 'titan', weight: 0.1 }],
    svgParams: { body: 'fairy', eyes: 'cosmic', color: ['#f8f9fa', '#e8f7ff'], wings: 'angelic', halo: 'triple_gold', orbits: 3 }
  },
  siren: {
    id: 'siren',
    name: 'Siren',
    tier: 10,
    rarity: 'RARE',
    element: 'WATER',
    baseCps: 6200000,
    lore: 'A mystical water dancer whose singing heals the surrounding ecosystem. Attracts golden bubbles.',
    cost: 85000000000,
    evolutions: [{ to: 'hydrasaur', weight: 65 }, { to: 'supernova', weight: 25 }, { to: 'titan', weight: 9.9 }, { to: 'cosmos', weight: 0.1 }],
    svgParams: { body: 'fairy', eyes: 'wink', color: ['#0c8599', '#66d9e8'], wings: 'leafy', tail: 'fin' }
  },

  // TIER 11 (PRESTIGE 5)
  titan: {
    id: 'titan',
    name: 'Titan',
    tier: 11,
    rarity: 'COMMON',
    element: 'EARTH',
    baseCps: 120000000,
    lore: 'An ancient mountain titan that carries forests on its back. The ground shakes with every step it takes.',
    cost: 750000000000,
    evolutions: [{ to: 'gigaslime', weight: 90 }, { to: 'stormcolossus', weight: 8 }, { to: 'supergiant', weight: 1.9 }, { to: 'singularity', weight: 0.1 }],
    svgParams: { body: 'golem', eyes: 'sleepy', color: ['#0f766e', '#134e4a'], crystals: true, crown: 'spiky' }
  },
  hydrasaur: {
    id: 'hydrasaur',
    name: 'Hydrasaur',
    tier: 11,
    rarity: 'RARE',
    element: 'WATER',
    baseCps: 185000000,
    lore: 'A three-headed prehistoric dragon. Each head controls a different element of storm, water, and frost.',
    cost: 1500000000000,
    evolutions: [{ to: 'stormcolossus', weight: 70 }, { to: 'supergiant', weight: 24.9 }, { to: 'gigaslime', weight: 5 }, { to: 'singularity', weight: 0.1 }],
    svgParams: { body: 'hydra', eyes: 'excited', color: ['#2563eb', '#38bdf8'], double_head: true, horns: 2, tail: 'serpent' }
  },
  supernova: {
    id: 'supernova',
    name: 'Supernova',
    tier: 11,
    rarity: 'SUPER_RARE',
    element: 'COSMIC',
    baseCps: 520000000,
    lore: 'Born from a collapsing star, its core burns with incandescent stellar power. Do not look directly at it.',
    cost: 3500000000000,
    evolutions: [{ to: 'supergiant', weight: 65 }, { to: 'stormcolossus', weight: 24.9 }, { to: 'gigaslime', weight: 10 }, { to: 'singularity', weight: 0.1 }],
    svgParams: { body: 'cloud', eyes: 'cosmic', color: ['#db2777', '#fbcfe8'], stars: true, orbits: 3 }
  },
  cosmos: {
    id: 'cosmos',
    name: 'Cosmos',
    tier: 11,
    rarity: 'ULTRA_RARE',
    element: 'DEITY',
    baseCps: 2100000000,
    lore: 'A celestial beast whose body contains a micro-galaxy. It weaves space and time like silk threads.',
    cost: 10000000000000,
    evolutions: [{ to: 'singularity', weight: 50 }, { to: 'supergiant', weight: 34.9 }, { to: 'stormcolossus', weight: 15 }, { to: 'gigaslime', weight: 0.1 }],
    svgParams: { body: 'fairy', eyes: 'cosmic', color: ['#4f46e5', '#818cf8'], wings: 'starry', halo: 'triple_gold', orbits: 4 }
  },

  // TIER 12 (PRESTIGE 6)
  gigaslime: {
    id: 'gigaslime',
    name: 'Giga-Slime',
    tier: 12,
    rarity: 'COMMON',
    element: 'EARTH',
    baseCps: 6200000000,
    lore: 'A colossus of pure glowing jelly. It moves like rolling lava and splits sparkles when divided.',
    cost: 35000000000000,
    evolutions: [{ to: 'overlord', weight: 90 }, { to: 'wyrm', weight: 8 }, { to: 'nebulatitan', weight: 1.9 }, { to: 'omega', weight: 0.1 }],
    svgParams: { body: 'droplet', eyes: 'cute', color: ['#ffd43b', '#ffa800'], bubbles: true }
  },
  stormcolossus: {
    id: 'stormcolossus',
    name: 'Storm-Colossus',
    tier: 12,
    rarity: 'RARE',
    element: 'WIND',
    baseCps: 9800000000,
    lore: 'A cloud elemental built around lightning rods. Its footsteps sound like booming thunderclaps.',
    cost: 72000000000000,
    evolutions: [{ to: 'wyrm', weight: 70 }, { to: 'nebulatitan', weight: 24.9 }, { to: 'overlord', weight: 5 }, { to: 'omega', weight: 0.1 }],
    svgParams: { body: 'golem', eyes: 'angry', color: ['#22b8cf', '#0b7285'], steam: true }
  },
  supergiant: {
    id: 'supergiant',
    name: 'Supergiant',
    tier: 12,
    rarity: 'SUPER_RARE',
    element: 'COSMIC',
    baseCps: 28000000000,
    lore: 'A massive star entity on the verge of collapsing. Emits extreme radiation and magnetic flares.',
    cost: 180000000000000,
    evolutions: [{ to: 'nebulatitan', weight: 65 }, { to: 'wyrm', weight: 24.9 }, { to: 'overlord', weight: 10 }, { to: 'omega', weight: 0.1 }],
    svgParams: { body: 'cloud', eyes: 'cosmic', color: ['#f783ac', '#e64980'], stars: true, orbits: 3 }
  },
  singularity: {
    id: 'singularity',
    name: 'Singularity',
    tier: 12,
    rarity: 'ULTRA_RARE',
    element: 'VOID',
    baseCps: 110000000000,
    lore: 'A dragon coiling around a black hole core. It draws light, essence, and nearby cosmic waves into itself.',
    cost: 500000000000000,
    evolutions: [{ to: 'omega', weight: 50 }, { to: 'nebulatitan', weight: 34.9 }, { to: 'wyrm', weight: 15 }, { to: 'overlord', weight: 0.1 }],
    svgParams: { body: 'dragon', eyes: 'cosmic', color: ['#1c1c1c', '#343a40'], void_core: true, wings: 'shadow' }
  },

  // TIER 13 (PRESTIGE 7)
  overlord: {
    id: 'overlord',
    name: 'Overlord',
    tier: 13,
    rarity: 'COMMON',
    element: 'VOID',
    baseCps: 380000000000,
    lore: 'A dark demonic commander that rules the netherworld layers. Its shadow presence chills other elements.',
    cost: 2500000000000000,
    evolutions: [{ to: 'ifrit', weight: 100 }],
    svgParams: { body: 'bull', eyes: 'angry', color: ['#1a1b1f', '#e03131'], horns: 2, wings: 'shadow' }
  },
  wyrm: {
    id: 'wyrm',
    name: 'Wyrm',
    tier: 13,
    rarity: 'RARE',
    element: 'COSMIC',
    baseCps: 590000000000,
    lore: 'An ancient stellar worm that burrows through black holes, weaving fabric layers of the multiverse.',
    cost: 6200000000000000,
    evolutions: [{ to: 'kraken', weight: 100 }],
    svgParams: { body: 'dragon', eyes: 'cosmic', color: ['#ae3ec9', '#d0bfff'], tail: 'serpent', orbits: 2 }
  },
  nebulatitan: {
    id: 'nebulatitan',
    name: 'Nebula-Titan',
    tier: 13,
    rarity: 'SUPER_RARE',
    element: 'COSMIC',
    baseCps: 1800000000000,
    lore: 'A titan composed entirely of glowing cosmic gas and infant stars. It shapes planetary clearing spheres.',
    cost: 15000000000000000,
    evolutions: [{ to: 'archon', weight: 100 }],
    svgParams: { body: 'golem', eyes: 'cosmic', color: ['#862e9c', '#f783ac'], stars: true, orbits: 3 }
  },
  omega: {
    id: 'omega',
    name: 'Omega Deity',
    tier: 13,
    rarity: 'ULTRA_RARE',
    element: 'DEITY',
    baseCps: 8500000000000,
    lore: 'The ultimate final-form cosmic deity. It governs creation, loops time scales, and controls all essence.',
    cost: 50000000000000000,
    evolutions: [{ to: 'gaia', weight: 100 }],
    svgParams: { body: 'fairy', eyes: 'cosmic', color: ['#f8f9fa', '#fff5b8'], wings: 'angelic', halo: 'triple_gold', orbits: 4 }
  },
  aurelion: {
    id: 'aurelion',
    name: 'Aurelion',
    tier: 14,
    rarity: 'LEGENDARY',
    element: 'DEITY',
    baseCps: 25000000000000,
    lore: 'A divine celestial dragon that flows with the light of a thousand newborn stars. Simply witnessing it causes space to bend.',
    cost: 100000000000000000,
    evolutions: [],
    svgParams: { body: 'dragon', eyes: 'cosmic', color: ['#ffd700', '#ff007f'], wings: 'golden', orbits: 4, stars: true }
  },
  voidwalker: {
    id: 'voidwalker',
    name: 'Voidwalker',
    tier: 14,
    rarity: 'LEGENDARY',
    element: 'VOID',
    baseCps: 50000000000000,
    lore: 'An ethereal entity that steps between reality and the dark void. Its core holds a tiny collapsing wormhole.',
    cost: 250000000000000000,
    evolutions: [],
    svgParams: { body: 'droplet', eyes: 'cosmic', color: ['#1c1c1c', '#a800ff'], void_core: true, wings: 'shadow', orbits: 2 }
  },
  ragnarok: {
    id: 'ragnarok',
    name: 'Ragnarok',
    tier: 14,
    rarity: 'LEGENDARY',
    element: 'DEITY',
    baseCps: 99000000000000,
    lore: 'The Harbinger of the End and Beginning. Its presence burns with pure white and red alchemical fire, rewriting the laws of the biome.',
    cost: 500000000000000000,
    evolutions: [],
    svgParams: { body: 'bull', eyes: 'angry', color: ['#c92a2a', '#ffd700'], crown: true, horns: 2, wings: 'feathered', orbits: 4 }
  },
  ifrit: {
    id: 'ifrit',
    name: 'Ifrit',
    tier: 14,
    rarity: 'COMMON',
    element: 'FIRE',
    baseCps: 1800000000000,
    lore: 'A blazing fire lord born in the deepest volcanic veins. Its body radiates intense solar heat.',
    cost: 80000000000000000,
    evolutions: [{ to: 'apocalypse', weight: 100 }],
    svgParams: { body: 'bull', eyes: 'angry', color: ['#e8590c', '#ff922b'], horns: 2, steam: true, tail: 'flaming' }
  },
  kraken: {
    id: 'kraken',
    name: 'Kraken',
    tier: 14,
    rarity: 'RARE',
    element: 'WATER',
    baseCps: 2800000000000,
    lore: 'An ancient multi-tentacled leviathan of the deep ocean. It commands massive tidal whirlpools.',
    cost: 160000000000000000,
    evolutions: [{ to: 'zenith', weight: 100 }],
    svgParams: { body: 'hydra', eyes: 'excited', color: ['#0b7285', '#15aabf'], tail: 'serpent', gills: true }
  },
  archon: {
    id: 'archon',
    name: 'Archon',
    tier: 14,
    rarity: 'SUPER_RARE',
    element: 'LIGHT',
    baseCps: 8000000000000,
    lore: 'A holy guardian of crystalline light spires. It emits a blinding protective radiance.',
    cost: 450000000000000000,
    evolutions: [{ to: 'seraph', weight: 100 }],
    svgParams: { body: 'fairy', eyes: 'cosmic', color: ['#ffd700', '#fff5b8'], wings: 'golden', halo: 'triple_gold', sparks: true }
  },
  gaia: {
    id: 'gaia',
    name: 'Gaia Spirit',
    tier: 14,
    rarity: 'ULTRA_RARE',
    element: 'EARTH',
    baseCps: 35000000000000,
    lore: 'The living essence of the planet itself. Forests grow and minerals crystalize in its presence.',
    cost: 1200000000000000000,
    evolutions: [{ to: 'amethyst', weight: 100 }],
    svgParams: { body: 'golem', eyes: 'sleepy', color: ['#2b8a3e', '#795548'], crystals: true, foliage: true }
  },
  apocalypse: {
    id: 'apocalypse',
    name: 'Apocalypse',
    tier: 15,
    rarity: 'COMMON',
    element: 'VOID',
    baseCps: 15000000000000,
    lore: 'The final executor of cosmic decay. A void dragon that consumes stars and realities.',
    cost: 8000000000000000000,
    evolutions: [{ to: 'arachnomorph', weight: 100 }],
    svgParams: { body: 'dragon', eyes: 'angry', color: ['#1c1c1c', '#a800ff'], void_core: true, wings: 'shadow' }
  },
  zenith: {
    id: 'zenith',
    name: 'Zenith Deity',
    tier: 15,
    rarity: 'RARE',
    element: 'DEITY',
    baseCps: 25000000000000,
    lore: 'The ultimate deity of balance and ascension. Its presence is felt across all dimensions.',
    cost: 15000000000000000000,
    evolutions: [{ to: 'scarab', weight: 100 }],
    svgParams: { body: 'fairy', eyes: 'cosmic', color: ['#f8f9fa', '#e8f7ff'], wings: 'angelic', halo: 'triple_gold', orbits: 4 }
  },
  seraph: {
    id: 'seraph',
    name: 'Seraph Angel',
    tier: 15,
    rarity: 'SUPER_RARE',
    element: 'LIGHT',
    baseCps: 75000000000000,
    lore: 'A six-winged celestial angel of burning light. Cleanses the meadow with pure solar flares.',
    cost: 50000000000000000000,
    evolutions: [{ to: 'ent_guardian', weight: 100 }],
    svgParams: { body: 'fairy', eyes: 'wink', color: ['#fff9db', '#ffd700'], wings: 'feathered', halo: 'sun', sparks: true }
  },
  amethyst: {
    id: 'amethyst',
    name: 'Amethyst Titan',
    tier: 15,
    rarity: 'ULTRA_RARE',
    element: 'COSMIC',
    baseCps: 300000000000000,
    lore: 'A giant crystal titan coiling around space and time, shimmering with stellar energy.',
    cost: 150000000000000000000,
    evolutions: [{ to: 'webspinner', weight: 100 }],
    svgParams: { body: 'golem', eyes: 'cosmic', color: ['#ae3ec9', '#da77f2'], crystals: true, orbits: 3 }
  },
  aurelion_prime: {
    id: 'aurelion_prime',
    name: 'Aurelion Prime',
    tier: 15,
    rarity: 'LEGENDARY',
    element: 'DEITY',
    baseCps: 150000000000000,
    lore: 'The prime ascended form of Aurelion, flowing with the raw light of a supercluster.',
    cost: 10000000000000000000,
    evolutions: [{ to: 'insectoid_prime', weight: 100 }],
    svgParams: { body: 'dragon', eyes: 'cosmic', color: ['#ffd700', '#ff007f'], wings: 'golden', orbits: 4, stars: true, crown: true }
  },
  voidwalker_prime: {
    id: 'voidwalker_prime',
    name: 'Voidwalker Prime',
    tier: 15,
    rarity: 'LEGENDARY',
    element: 'VOID',
    baseCps: 300000000000000,
    lore: 'The prime ascended form of Voidwalker, controlling the space between dimensions.',
    cost: 25000000000000000000,
    evolutions: [{ to: 'insectoid_prime', weight: 100 }],
    svgParams: { body: 'droplet', eyes: 'cosmic', color: ['#1c1c1c', '#a800ff'], void_core: true, wings: 'shadow', orbits: 3, crown: true }
  },
  ragnarok_prime: {
    id: 'ragnarok_prime',
    name: 'Ragnarok Prime',
    tier: 15,
    rarity: 'LEGENDARY',
    element: 'DEITY',
    baseCps: 600000000000000,
    lore: 'The prime ascended form of Ragnarok, burning with eternal alchemical fire.',
    cost: 50000000000000000000,
    evolutions: [{ to: 'insectoid_prime', weight: 100 }],
    svgParams: { body: 'bull', eyes: 'angry', color: ['#c92a2a', '#ffd700'], crown: true, horns: 2, wings: 'feathered', orbits: 4, steam: true }
  },
  infinity: {
    id: 'infinity',
    name: 'Infinity Deity',
    tier: 15,
    rarity: 'GODLY',
    element: 'DEITY',
    baseCps: 1500000000000000,
    lore: 'The absolute representation of endless space and time. Its form hums with the song of creation.',
    cost: 1000000000000000000000,
    evolutions: [],
    svgParams: { body: 'fairy', eyes: 'cosmic', color: ['#00ffff', '#ffffff'], wings: 'angelic', halo: 'triple_gold', orbits: 4, sparks: true, crown: true }
  },
  abyssus: {
    id: 'abyssus',
    name: 'Abyssus Sovereign',
    tier: 15,
    rarity: 'GODLY',
    element: 'VOID',
    baseCps: 3000000000000000,
    lore: 'The sovereign of the eternal dark void, drawing all light and essence into its infinite core.',
    cost: 2500000000000000000000,
    evolutions: [],
    svgParams: { body: 'dragon', eyes: 'cosmic', color: ['#00ffff', '#1c1c1c'], void_core: true, wings: 'shadow', orbits: 4, crown: true }
  },
  solaris: {
    id: 'solaris',
    name: 'Solaris Sovereign',
    tier: 15,
    rarity: 'GODLY',
    element: 'LIGHT',
    baseCps: 6000000000000000,
    lore: 'The supreme solar deity, illuminating the cosmos with the heat of a billion suns.',
    cost: 5000000000000000000000,
    evolutions: [],
    svgParams: { body: 'bird', eyes: 'excited', color: ['#00ffff', '#ffd700'], wings: 'golden', halo: 'sun', sparks: true, crown: true }
  },
  arachnomorph: {
    id: 'arachnomorph',
    name: 'Arachnomorph',
    tier: 16,
    rarity: 'COMMON',
    element: 'EARTH',
    baseCps: 15000000000000000,
    lore: 'A skittering crystal-legged spider that weaves webs of raw earth elements.',
    cost: 10000000000000000000,
    evolutions: [{ to: 'scarab', weight: 100 }],
    svgParams: { body: 'spider', eyes: 'angry', color: ['#2b8a3e', '#5c940d', '#1e2022'] }
  },
  scarab: {
    id: 'scarab',
    name: 'Gilded Scarab',
    tier: 16,
    rarity: 'RARE',
    element: 'LIGHT',
    baseCps: 45000000000000000,
    lore: 'An insect-like beetle wrapped in blinding solar shells. It shines with divine rays.',
    cost: 50000000000000000000,
    evolutions: [{ to: 'ent_guardian', weight: 100 }],
    svgParams: { body: 'insect', eyes: 'excited', color: ['#ffd700', '#ff922b', '#f0a500'], insect_horn: true }
  },
  ent_guardian: {
    id: 'ent_guardian',
    name: 'Ent Guardian',
    tier: 17,
    rarity: 'RARE',
    element: 'EARTH',
    baseCps: 200000000000000000,
    lore: 'A scary walking tree construct protecting the ancient forest layers.',
    cost: 300000000000000000000,
    evolutions: [{ to: 'bark_titan', weight: 100 }],
    svgParams: { body: 'tree', eyes: 'sleepy', color: ['#5c4033', '#8b5a2b', '#1e3820'], foliage: true }
  },
  bark_titan: {
    id: 'bark_titan',
    name: 'Bark Titan',
    tier: 17,
    rarity: 'SUPER_RARE',
    element: 'EARTH',
    baseCps: 800000000000000000,
    lore: 'A gargantuan wooden mountain monster that commands root vines and stone spires.',
    cost: 2000000000000000000000,
    evolutions: [{ to: 'webspinner', weight: 100 }],
    svgParams: { body: 'tree', eyes: 'angry', color: ['#8b5a2b', '#3e2723', '#000000'], foliage: true }
  },
  webspinner: {
    id: 'webspinner',
    name: 'Nebula Webspinner',
    tier: 18,
    rarity: 'SUPER_RARE',
    element: 'VOID',
    baseCps: 5000000000000000000,
    lore: 'A void-weaving spider that floats between stars, spinning webs of cosmic dust.',
    cost: 15000000000000000000000,
    evolutions: [{ to: 'chitin_dread', weight: 100 }],
    svgParams: { body: 'spider', eyes: 'cosmic', color: ['#8a2be2', '#4b0082', '#ff00ff', '#0a0015'], sparks: true }
  },
  chitin_dread: {
    id: 'chitin_dread',
    name: 'Chitin Dread',
    tier: 18,
    rarity: 'ULTRA_RARE',
    element: 'COSMIC',
    baseCps: 25000000000000000000,
    lore: 'A massive armored insect clad in super-hard cosmic alloys. Its shell absorbs starlight.',
    cost: 100000000000000000000000,
    evolutions: [{ to: 'venom_dragon', weight: 100 }],
    svgParams: { body: 'insect', eyes: 'cosmic', color: ['#da77f2', '#7950f2', '#1a0033'], insect_horn: true, orbits: 2 }
  },
  venom_dragon: {
    id: 'venom_dragon',
    name: 'Venom Chitin Dragon',
    tier: 19,
    rarity: 'ULTRA_RARE',
    element: 'VOID',
    baseCps: 150000000000000000000,
    lore: 'An insect-dragon chimera covered in toxic scales that slowly dissolve the surrounding area.',
    cost: 1000000000000000000000000,
    evolutions: [{ to: 'insectoid_prime', weight: 100 }],
    svgParams: { body: 'dragon', eyes: 'angry', color: ['#00ff66', '#00b54e', '#051f00'], wings: 'shadow', tail: 'serpent' }
  },
  insectoid_prime: {
    id: 'insectoid_prime',
    name: 'Insectoid Prime',
    tier: 19,
    rarity: 'LEGENDARY',
    element: 'DEITY',
    baseCps: 1000000000000000000000,
    lore: 'The ultimate prime insect deity, glowing with holy starlight and carrying celestial orbits.',
    cost: 20000000000000000000000000,
    evolutions: [{ to: 'void_monarch', weight: 100 }],
    svgParams: { body: 'insect', eyes: 'cosmic', color: ['#ff007f', '#ffd700', '#82c91e', '#e64980'], wings: 'golden', orbits: 4, crown: true, insect_horn: true }
  },
  void_monarch: {
    id: 'void_monarch',
    name: 'Void Monarch',
    tier: 20,
    rarity: 'LEGENDARY',
    element: 'VOID',
    baseCps: 5000000000000000000000,
    lore: 'The supreme ruler of the void layers. A spider deity that anchors the edges of the universe.',
    cost: 250000000000000000000000000,
    evolutions: [],
    svgParams: { body: 'spider', eyes: 'cosmic', color: ['#00ffff', '#7928ca', '#0a0a0a'], wings: 'shadow', crown: true, orbits: 3 }
  },
  dark_matter_leviathan: {
    id: 'dark_matter_leviathan',
    name: 'Singularity Devourer',
    tier: 20,
    rarity: 'DARK_MATTER',
    element: 'COSMIC',
    baseCps: 1000000000000000000000000,
    lore: 'A supreme being of pure Dark Matter, formed from the fusion of a thousand Tier 20 entities. It bends space and time, consuming the outer boundaries of reality.',
    cost: 0,
    evolutions: [],
    svgParams: { body: 'dragon', eyes: 'cosmic', color: ['#05000a', '#2c004d', '#7b00ad', '#d500f9'], wings: 'starry', orbits: 4, crown: true }
  },
  shadow_fiend: {
    id: 'shadow_fiend',
    name: 'Shadow Fiend',
    tier: 14,
    rarity: 'COMMON',
    element: 'VOID',
    baseCps: 0,
    lore: 'A shadowy manifestation of dark corruption. It hungers for mystical beasts.',
    cost: 0,
    evolutions: [],
    svgParams: { body: 'spiky_stone', eyes: 'angry', color: ['#1c1c1c', '#000000'], spikes: true, horns: 2, wings: 'shadow', shadow_fiend: true }
  },
  shadow_fiend_evolved: {
    id: 'shadow_fiend_evolved',
    name: 'Evolved Shadow Fiend',
    tier: 15,
    rarity: 'COMMON',
    element: 'VOID',
    baseCps: 0,
    lore: 'An empowered, highly volatile shadow abomination. It consumes life force at an alarming rate.',
    cost: 0,
    evolutions: [],
    svgParams: { body: 'dragon', eyes: 'cosmic', color: ['#0d0d0d', '#1a0000'], spikes: true, horns: 2, wings: 'shadow', shadow_fiend_evolved: true }
  }
};

/**
 * Procedurally generates a beautiful, expressive cartoon/paper-style SVG string for a beast.
 * Uses high-resolution shapes, gradients, drop-shadows, and neat features.
 * Supports evolved visual wrapping (golden crown, glowing ring, double size).
 * Supports infected visual wrapping (purple dripping toxic slime, glowing red eyes, sludge bubbles).
 */
function getBeastSVG(beastId, evolved = false, infected = false) {
  const template = BEAST_TEMPLATES[beastId];
  if (!template) return '';

  const p = template.svgParams;
  const elementColor = ELEMENTS[template.element].color;
  const uid = Math.random().toString(36).substring(2, 8);
  const gradientId = `grad-${beastId}${evolved ? '-evo' : ''}${infected ? '-inf' : ''}-${uid}`;
  const shadowId = `shadow-${uid}`;
  const glowId = `glow-${uid}`;
  const goldGradId = `gold-grad-${uid}`;
  const goldGlowId = `gold-glow-${uid}`;
  const toxicGlowId = `toxic-glow-${uid}`;
  const shadowRedGlowId = `shadow-red-glow-${uid}`;
  
  // Custom filter for paper cutout depth
  let svg = `
    <svg viewBox="0 0 120 120" class="beast-svg element-${template.element.toLowerCase()} ${evolved ? 'evolved-beast' : ''} ${infected ? 'infected-beast' : ''}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
          ${infected ? `
            <stop offset="0%" stop-color="#5c108c" />
            <stop offset="100%" stop-color="#1b002c" />
          ` : template.rarity === 'DARK_MATTER' ? `
            <stop offset="0%" stop-color="#05000a" />
            <stop offset="30%" stop-color="#2c004d" />
            <stop offset="70%" stop-color="#7b00ad" />
            <stop offset="100%" stop-color="#d500f9" />
          ` : p.color.length > 2 ? p.color.map((col, index) => {
              const offset = Math.round((index / (p.color.length - 1)) * 100);
              return `<stop offset="${offset}%" stop-color="${col}" />`;
            }).join('\n') : `
            <stop offset="0%" stop-color="${p.color[0]}" />
            <stop offset="100%" stop-color="${p.color[1]}" />
          `}
        </linearGradient>
        
        <filter id="${shadowId}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/>
        </filter>
        
        <filter id="${glowId}" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <linearGradient id="${goldGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffd700" />
          <stop offset="50%" stop-color="#fff5b8" />
          <stop offset="100%" stop-color="#ffa500" />
        </linearGradient>
        
        <filter id="${goldGlowId}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#ffd700" flood-opacity="0.8"/>
        </filter>
        
        <filter id="${toxicGlowId}" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#a800ff" flood-opacity="0.85"/>
        </filter>
        
        <filter id="${shadowRedGlowId}" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ff0000" flood-opacity="0.85"/>
        </filter>
      </defs>
  `;

  // Evolved Background Golden Halo
  if (evolved) {
    svg += `
      <circle cx="60" cy="60" r="48" fill="none" stroke="#ffd700" stroke-width="1.2" filter="url(#${goldGlowId})" />
      <circle cx="60" cy="60" r="48" fill="rgba(255, 215, 0, 0.04)" />
    `;
  }

  // Infected Background Toxic Purple Aura
  if (infected) {
    svg += `
      <circle cx="60" cy="60" r="46" fill="rgba(168, 0, 255, 0.15)" filter="url(#${toxicGlowId})" />
    `;
  }

  // Shadow enemy warning backdrop glow
  if (beastId === 'shadow_fiend' || beastId === 'shadow_fiend_evolved') {
    svg += `
      <circle cx="60" cy="60" r="46" fill="rgba(255, 0, 0, 0.15)" filter="url(#${shadowRedGlowId})" />
    `;
  }

  // Draw background elements (Glows, auras, circles, wings)
  if (template.rarity !== 'COMMON' && !infected) {
    const glowColor = RARITIES[template.rarity].glow;
    svg += `<circle cx="60" cy="60" r="45" fill="${glowColor}" filter="url(#${glowId})" opacity="0.6" />`;
    if (template.rarity === 'GODLY') {
      svg += `
        <circle cx="60" cy="60" r="49" fill="none" stroke="#00ffff" stroke-dasharray="8, 4" stroke-width="1.5" filter="url(#${glowId})" class="anim-spin" style="animation-duration: 8s" />
        <circle cx="60" cy="60" r="48" fill="rgba(0, 255, 255, 0.05)" />
      `;
    } else if (template.rarity === 'DARK_MATTER') {
      svg += `
        <circle cx="60" cy="60" r="49" fill="none" stroke="#d500f9" stroke-dasharray="12, 6" stroke-width="2" filter="url(#${glowId})" class="anim-spin" style="animation-duration: 4s" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="#00ffff" stroke-dasharray="6, 12" stroke-width="1.2" filter="url(#${glowId})" class="anim-spin" style="animation-duration: 6s; animation-direction: reverse;" />
        <circle cx="60" cy="60" r="48" fill="rgba(213, 0, 249, 0.05)" />
      `;
    }
  }

  // Draw wings if they exist
  if (p.wings) {
    let wingColor = p.color[0];
    if (p.wings === 'golden') wingColor = `url(#${goldGradId})`;
    if (p.wings === 'shadow' || infected) wingColor = '#212529';
    if (p.wings === 'starry') wingColor = template.rarity === 'DARK_MATTER' ? '#d500f9' : '#8a2be2';
    
    if (p.wings === 'cloudy' && !infected) {
      svg += `
        <g fill="#ffffff" filter="url(#${shadowId})" opacity="0.9" class="anim-wing-left">
          <path d="M 35 60 C 10 50, 10 30, 30 30 C 40 30, 45 40, 45 50 Z" />
        </g>
        <g fill="#ffffff" filter="url(#${shadowId})" opacity="0.9" class="anim-wing-right">
          <path d="M 85 60 C 110 50, 110 30, 90 30 C 80 30, 75 40, 75 50 Z" />
        </g>
      `;
    } else if (p.wings === 'leafy' && !infected) {
      svg += `
        <g fill="#74b816" filter="url(#${shadowId})" class="anim-wing-left">
          <path d="M 40 60 C 15 45, 20 20, 45 35 C 50 38, 48 50, 40 60 Z" />
        </g>
        <g fill="#74b816" filter="url(#${shadowId})" class="anim-wing-right">
          <path d="M 80 60 C 105 45, 100 20, 75 35 C 70 38, 72 50, 80 60 Z" />
        </g>
      `;
    } else if (p.wings === 'feathered' || p.wings === 'windy' || p.wings === 'starry' || p.wings === 'golden' || p.wings === 'fire_feathers' || p.wings === 'shadow' || p.wings === 'angelic' || infected) {
      svg += `
        <!-- Left Wing -->
        <g fill="${wingColor}" filter="url(#${shadowId})" class="anim-wing-left">
          <path d="M 45 65 C 10 55, 5 25, 30 25 C 40 25, 45 40, 45 65 M 45 50 C 20 40, 25 30, 35 30" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
        </g>
        <!-- Right Wing -->
        <g fill="${wingColor}" filter="url(#${shadowId})" class="anim-wing-right">
          <path d="M 75 65 C 110 55, 115 25, 90 25 C 80 25, 75 40, 75 65 M 75 50 C 100 40, 95 30, 85 30" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
        </g>
      `;
    }
  }

  // Draw Tail
  if (p.tail) {
    let tailColor = p.color[0];
    if (p.tail === 'flaming' || p.tail === 'triple_flame') {
      svg += `
        <g fill="${infected ? '#5a1288' : '#ff922b'}" filter="url(#${shadowId})" class="anim-tail">
          <path d="M 45 80 C 30 95, 25 110, 15 105 C 10 100, 20 85, 40 75 Z" fill="${infected ? '#3f0463' : '#ff4500'}" />
          <path d="M 45 80 C 35 90, 30 100, 22 98 C 18 95, 25 85, 40 78 Z" fill="${infected ? '#a800ff' : '#ffbe0b'}" />
        </g>
      `;
    } else if (p.tail === 'leaf' && !infected) {
      svg += `
        <g fill="#5c940d" filter="url(#${shadowId})" class="anim-tail">
          <path d="M 45 80 C 30 95, 20 95, 25 85 C 30 75, 40 75, 45 80 Z" />
          <path d="M 25 85 L 35 80" stroke="#a9e34b" stroke-width="2" />
        </g>
      `;
    } else if (p.tail === 'fin' || p.tail === 'wave' || p.tail === 'serpent' || infected) {
      svg += `
        <g fill="${infected ? '#5a1288' : '#15aabf'}" filter="url(#${shadowId})" class="anim-tail">
          <path d="M 45 80 C 25 90, 20 105, 30 110 C 40 115, 45 95, 45 80 Z" fill="${infected ? '#1b002c' : tailColor}" />
          <path d="M 30 110 C 25 115, 20 110, 25 105 Z" fill="${infected ? '#a800ff' : '#22b8cf'}" />
        </g>
      `;
    }
  }

  // Draw main body shape
  let bodyPath = '';
  if (p.body === 'droplet') {
    bodyPath = 'M 60 25 C 85 55, 85 95, 60 95 C 35 95, 35 55, 60 25 Z';
  } else if (p.body === 'stone' || p.body === 'spiky_stone') {
    bodyPath = 'M 60 30 C 85 30, 95 45, 90 70 C 85 92, 75 95, 60 95 C 45 95, 35 92, 30 70 C 25 45, 35 30, 60 30 Z';
  } else if (p.body === 'cloud') {
    bodyPath = 'M 60 40 C 45 40, 35 50, 40 65 C 35 75, 45 85, 60 85 C 75 85, 85 75, 80 65 C 85 50, 75 40, 60 40 Z';
  } else if (p.body === 'reptile' || p.body === 'lizard' || p.body === 'dino') {
    bodyPath = 'M 60 35 C 78 35, 85 45, 85 75 C 85 95, 75 98, 60 98 C 45 98, 35 95, 35 75 C 35 45, 42 35, 60 35 Z';
  } else if (p.body === 'fox' || p.body === 'wolf' || p.body === 'cat' || p.body === 'lion') {
    bodyPath = 'M 60 35 C 80 35, 85 50, 85 75 C 85 95, 75 95, 60 95 C 45 95, 35 95, 35 75 C 35 50, 40 35, 60 35 Z';
  } else if (p.body === 'shell') {
    bodyPath = 'M 60 30 C 85 30, 95 50, 90 75 C 85 90, 75 95, 60 95 C 45 95, 35 90, 30 75 C 25 50, 35 30, 60 30 Z';
  } else if (p.body === 'griffin' || p.body === 'bird') {
    bodyPath = 'M 60 30 C 78 30, 85 45, 85 75 C 85 95, 73 95, 60 95 C 47 95, 35 95, 35 75 C 35 45, 42 30, 60 30 Z';
  } else if (p.body === 'bull' || p.body === 'golem' || p.body === 'horse' || p.body === 'dragon') {
    bodyPath = 'M 60 25 C 82 25, 90 40, 90 75 C 90 98, 75 98, 60 98 C 45 98, 30 98, 30 75 C 30 40, 38 25, 60 25 Z';
  } else if (p.body === 'hydra') {
    bodyPath = 'M 60 40 C 75 35, 85 45, 85 75 C 85 95, 75 98, 60 98 C 45 98, 35 95, 35 75 C 35 45, 45 35, 60 40 Z';
  } else if (p.body === 'spider') {
    bodyPath = 'M 60 35 C 75 35, 78 45, 75 58 C 88 65, 88 88, 60 92 C 32 88, 32 65, 45 58 C 42 45, 45 35, 60 35 Z';
  } else if (p.body === 'insect') {
    bodyPath = 'M 60 32 C 72 32, 74 42, 70 48 C 76 50, 76 62, 70 65 C 75 70, 75 88, 60 94 C 45 88, 45 70, 50 65 C 44 62, 44 50, 50 48 C 46 42, 48 32, 60 32 Z';
  } else if (p.body === 'tree') {
    bodyPath = 'M 50 30 C 58 32, 62 32, 70 30 C 75 45, 82 65, 78 80 C 88 92, 78 98, 70 95 C 65 92, 55 92, 50 95 C 42 98, 32 92, 42 80 C 38 65, 45 45, 50 30 Z';
  } else {
    bodyPath = 'M 60 30 C 85 30, 90 50, 90 75 C 90 95, 80 95, 60 95 C 40 95, 30 95, 30 75 C 30 50, 35 30, 60 30 Z';
  }

  // Draw spider legs background overlay if spider body
  if (p.body === 'spider') {
    const legStroke = infected ? '#862e9c' : `url(#${gradientId})`;
    svg += `
      <g stroke="${legStroke}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#${shadowId})" opacity="0.95">
        <!-- Left Legs -->
        <path d="M 45 50 Q 25 32, 12 45" />
        <path d="M 45 60 Q 20 52, 8 70" />
        <path d="M 45 70 Q 22 72, 10 92" />
        <path d="M 45 80 Q 25 92, 18 106" />
        <!-- Right Legs -->
        <path d="M 75 50 Q 95 32, 108 45" />
        <path d="M 75 60 Q 100 52, 112 70" />
        <path d="M 75 70 Q 98 72, 110 92" />
        <path d="M 75 80 Q 95 92, 102 106" />
      </g>
    `;
  }

  svg += `<path d="${bodyPath}" fill="url(#${gradientId})" filter="url(#${shadowId})" stroke="${infected ? '#862e9c' : 'rgba(255,255,255,0.15)'}" stroke-width="2" />`;

  // Draw overlay details (magma veins, cracks, crystals, foliage)
  if (p.cracks && !infected) {
    svg += `
      <g stroke="#ffa94d" stroke-width="1.5" stroke-linecap="round" opacity="0.8">
        <line x1="45" y1="55" x2="52" y2="65" />
        <line x1="52" y1="65" x2="48" y2="75" />
        <line x1="75" y1="58" x2="68" y2="70" />
        <line x1="68" y1="70" x2="72" y2="80" />
      </g>
    `;
  }

  if (p.body === 'insect' || p.insect_horn) {
    const hornColor = infected ? '#a800ff' : `url(#${gradientId})`;
    svg += `
      <!-- Antennae / Horns -->
      <g stroke="${hornColor}" stroke-width="3" stroke-linecap="round" fill="none" filter="url(#${shadowId})">
        <path d="M 50 35 Q 38 18, 30 18" />
        <path d="M 70 35 Q 82 18, 90 18" />
      </g>
      <circle cx="30" cy="18" r="2" fill="${infected ? '#ff0000' : elementColor}" filter="url(#${glowId})" />
      <circle cx="90" cy="18" r="2" fill="${infected ? '#ff0000' : elementColor}" filter="url(#${glowId})" />
    `;
    if (p.insect_horn) {
      svg += `
        <path d="M 60 32 C 60 15, 50 18, 52 10 C 58 14, 60 22, 60 32 Z" fill="${hornColor}" filter="url(#${shadowId})" />
      `;
    }
  }

  if (p.body === 'tree') {
    const branchColor = infected ? '#1b002c' : `url(#${gradientId})`;
    svg += `
      <!-- Wooden Branch Arms -->
      <g stroke="${branchColor}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#${shadowId})">
        <!-- Left Arm Branch -->
        <path d="M 40 55 Q 18 48, 12 35 M 18 48 Q 20 40, 15 38" />
        <!-- Right Arm Branch -->
        <path d="M 80 55 Q 102 48, 108 35 M 102 48 Q 100 40, 105 38" />
      </g>
    `;
    if (!infected) {
      svg += `
        <!-- Wood grain textures -->
        <g stroke="rgba(0,0,0,0.25)" stroke-width="1.5" stroke-linecap="round" fill="none">
          <path d="M 52 48 Q 60 54, 68 48" />
          <path d="M 48 68 Q 60 76, 72 68" />
          <path d="M 50 82 Q 60 88, 70 82" />
          <line x1="60" y1="35" x2="60" y2="45" />
        </g>
      `;
    }
  }

  if (p.foliage && !infected) {
    svg += `
      <path d="M 50 40 Q 60 35, 70 40 Q 60 48, 50 40 Z" fill="#74b816" opacity="0.9" />
      <circle cx="60" cy="38" r="3" fill="#e8590c" />
    `;
  }

  if (p.spikes) {
    const spikeColor = infected ? '#3f0463' : (template.element === 'FIRE' ? '#e03131' : '#343a40');
    svg += `
      <path d="M 28 50 L 18 53 L 29 62" fill="${spikeColor}" filter="url(#${shadowId})" />
      <path d="M 92 50 L 102 53 L 91 62" fill="${spikeColor}" filter="url(#${shadowId})" />
      <path d="M 60 28 L 60 15 L 68 28" fill="${spikeColor}" filter="url(#${shadowId})" />
    `;
  }

  if (p.horns) {
    svg += `
      <path d="M 40 32 C 30 20, 25 22, 28 12 C 34 18, 38 25, 42 30 Z" fill="${infected ? '#1b002c' : '#f1faee'}" filter="url(#${shadowId})" />
      <path d="M 80 32 C 90 20, 95 22, 92 12 C 86 18, 82 25, 78 30 Z" fill="${infected ? '#1b002c' : '#f1faee'}" filter="url(#${shadowId})" />
    `;
  }

  if (p.gills && !infected) {
    svg += `
      <path d="M 33 45 Q 18 40, 25 32 Q 30 38, 35 44 Z" fill="#ff8787" opacity="0.9" />
      <path d="M 87 45 Q 102 40, 95 32 Q 90 38, 85 44 Z" fill="#ff8787" opacity="0.9" />
    `;
  }

  if (p.ears === 'flame' && !infected) {
    svg += `
      <path d="M 38 38 C 25 15, 30 10, 42 28 Z" fill="#ff922b" />
      <path d="M 82 38 C 95 15, 90 10, 78 28 Z" fill="#ff922b" />
    `;
  }

  if (p.crystals && !infected) {
    svg += `
      <polygon points="20,70 12,50 25,58" fill="#da77f2" filter="url(#${shadowId})" class="anim-float" />
      <polygon points="100,70 108,50 95,58" fill="#da77f2" filter="url(#${shadowId})" class="anim-float" style="animation-delay:-1s" />
      <polygon points="60,18 67,5 53,5" fill="#da77f2" filter="url(#${shadowId})" />
    `;
  }

  if (p.magma_veins && !infected) {
    svg += `
      <g stroke="#ff3e3e" stroke-width="2" stroke-linecap="round" opacity="0.9" filter="url(#${glowId})">
        <path d="M 45 50 Q 60 70, 75 50 M 50 65 Q 60 85, 70 65" fill="none" />
      </g>
    `;
  }

  if (p.ice_spikes && !infected) {
    svg += `
      <path d="M 26 40 L 12 35 L 28 55" fill="#e7f5ff" />
      <path d="M 94 40 L 108 35 L 92 55" fill="#e7f5ff" />
    `;
  }

  // Draw Hydra double heads
  if (p.double_head) {
    svg += `
      <g fill="url(#${gradientId})" filter="url(#${shadowId})">
        <path d="M 45 55 C 30 40, 20 25, 32 15 C 44 25, 45 42, 45 55 Z" />
        <path d="M 75 55 C 90 40, 100 25, 88 15 C 76 25, 75 42, 75 55 Z" />
      </g>
    `;
    if (!infected) {
      svg += `
        <circle cx="30" cy="22" r="2" fill="#212529" />
        <circle cx="28" cy="21" r="0.75" fill="#fff" />
        <circle cx="90" cy="22" r="2" fill="#212529" />
        <circle cx="92" cy="21" r="0.75" fill="#fff" />
      `;
    }
  }

  // Draw Face (Eyes) - OVERLAY TOXIC GLOWING RED EYES IF INFECTED or SHADOW ENEMIES
  let faceOffset = 0;
  if (p.body === 'insect') faceOffset = -16;
  else if (p.body === 'tree') faceOffset = -12;
  else if (p.body === 'spider') faceOffset = -10;

  svg += `<g class="beast-face" ${faceOffset !== 0 ? `transform="translate(0, ${faceOffset})"` : ''}>`;
  if (infected || beastId === 'shadow_fiend' || beastId === 'shadow_fiend_evolved') {
    svg += `
      <!-- Toxic glowing red eyes -->
      <circle cx="48" cy="58" r="6.5" fill="#ff0000" filter="url(#${glowId})" />
      <circle cx="72" cy="58" r="6.5" fill="#ff0000" filter="url(#${glowId})" />
      <circle cx="48" cy="58" r="2" fill="#fff" />
      <circle cx="72" cy="58" r="2" fill="#fff" />
      <!-- Angry expression slash -->
      <path d="M 40 48 L 52 53" stroke="#212529" stroke-width="2" />
      <path d="M 80 48 L 68 53" stroke="#212529" stroke-width="2" />
      <path d="M 52 68 Q 60 62, 68 68" stroke="#1b002c" stroke-width="2.5" stroke-linecap="round" fill="none" />
    `;
  } else if (p.eyes === 'cute') {
    svg += `
      <ellipse cx="48" cy="58" rx="6" ry="8" fill="#212529" />
      <circle cx="46" cy="55" r="2.5" fill="#ffffff" />
      <circle cx="50" cy="61" r="1" fill="#ffffff" />
      
      <ellipse cx="72" cy="58" rx="6" ry="8" fill="#212529" />
      <circle cx="70" cy="55" r="2.5" fill="#ffffff" />
      <circle cx="74" cy="61" r="1" fill="#ffffff" />

      <path d="M 57 66 Q 60 69, 63 66" stroke="#212529" stroke-width="2" stroke-linecap="round" fill="none" />
      <circle cx="42" cy="64" r="3" fill="#ff8787" opacity="0.6" />
      <circle cx="78" cy="64" r="3" fill="#ff8787" opacity="0.6" />
    `;
  } else if (p.eyes === 'sleepy') {
    svg += `
      <path d="M 42 60 Q 48 64, 54 60" stroke="#212529" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M 66 60 Q 72 64, 78 60" stroke="#212529" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M 58 67 Q 60 69, 62 67" stroke="#212529" stroke-width="1.5" stroke-linecap="round" fill="none" />
      <circle cx="42" cy="64" r="2.5" fill="#ff8787" opacity="0.4" />
      <circle cx="78" cy="64" r="2.5" fill="#ff8787" opacity="0.4" />
    `;
  } else if (p.eyes === 'angry') {
    svg += `
      <path d="M 40 50 L 52 56 M 52 56 L 44 62" stroke="#212529" stroke-width="3" stroke-linecap="round" fill="none" />
      <circle cx="47" cy="57" r="2" fill="#e03131" />
      
      <path d="M 80 50 L 68 56 M 68 56 L 76 62" stroke="#212529" stroke-width="3" stroke-linecap="round" fill="none" />
      <circle cx="73" cy="57" r="2" fill="#e03131" />

      <path d="M 56 68 Q 60 64, 64 68" stroke="#212529" stroke-width="2" stroke-linecap="round" fill="none" />
    `;
  } else if (p.eyes === 'excited') {
    svg += `
      <path d="M 48 48 L 50 54 L 56 56 L 50 58 L 48 64 L 46 58 L 40 56 L 46 54 Z" fill="#ffa800" />
      <path d="M 72 48 L 74 54 L 80 56 L 74 58 L 72 64 L 70 58 L 64 56 L 70 54 Z" fill="#ffa800" />
      
      <path d="M 54 66 Q 60 74, 66 66 Z" fill="#c92a2a" />
      <path d="M 56 69 Q 60 73, 64 69" fill="#ff8787" />
    `;
  } else if (p.eyes === 'wink') {
    svg += `
      <path d="M 42 58 Q 48 50, 54 58" stroke="#212529" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <ellipse cx="72" cy="58" rx="6" ry="8" fill="#212529" />
      <circle cx="70" cy="55" r="2" fill="#ffffff" />
      
      <path d="M 56 65 Q 59 68, 60 65 Q 61 68, 64 65" stroke="#212529" stroke-width="2" stroke-linecap="round" fill="none" />
      <circle cx="42" cy="63" r="3" fill="#ff8787" opacity="0.6" />
      <circle cx="78" cy="63" r="3" fill="#ff8787" opacity="0.6" />
    `;
  } else if (p.eyes === 'cosmic') {
    svg += `
      <circle cx="48" cy="58" r="6" fill="#ffffff" filter="url(#${glowId})" />
      <circle cx="72" cy="58" r="6" fill="#ffffff" filter="url(#${glowId})" />
      <circle cx="48" cy="58" r="2.5" fill="${elementColor}" />
      <circle cx="72" cy="58" r="2.5" fill="${elementColor}" />
      <path d="M 55 68 Q 60 72, 65 68" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" />
    `;
  }
  svg += `</g>`;

  // Draw Foreground/Orbiting effects
  if (p.sparks && !infected) {
    svg += `
      <g fill="#ffd43b" class="anim-float">
        <circle cx="30" cy="40" r="2.5" />
        <circle cx="90" cy="45" r="1.5" />
        <circle cx="40" cy="85" r="2" />
        <circle cx="80" cy="80" r="3" />
      </g>
    `;
  }

  if (p.bubbles && !infected) {
    svg += `
      <g fill="#22b8cf" stroke="#ffffff" stroke-width="0.5" opacity="0.7" class="anim-float">
        <circle cx="25" cy="50" r="3.5" />
        <circle cx="95" cy="40" r="2" />
        <circle cx="35" cy="80" r="4.5" />
        <circle cx="85" cy="85" r="2.5" />
      </g>
    `;
  }

  if (p.orbits && !infected) {
    svg += `
      <ellipse cx="60" cy="60" rx="55" ry="15" stroke="rgba(255,255,255,0.2)" stroke-width="1" fill="none" transform="rotate(-15 60 60)" />
      <ellipse cx="60" cy="60" rx="50" ry="20" stroke="rgba(255,255,255,0.15)" stroke-width="1" fill="none" transform="rotate(30 60 60)" />
      <circle cx="10" cy="50" r="4" fill="#ff922b" class="anim-orbit-1" />
      <circle cx="110" cy="70" r="5" fill="#4dabf7" class="anim-orbit-2" />
    `;
  }

  if (p.gears && !infected) {
    svg += `
      <g fill="url(#${goldGradId})" stroke="#d9480f" stroke-width="0.5" opacity="0.95" class="anim-spin" transform="translate(60, 60)">
        <circle cx="-35" cy="-35" r="8" />
        <path d="M -35 -45 L -35 -25 M -45 -35 L -25 -35 M -42 -42 L -28 -28 M -42 -28 L -28 -42" stroke="url(#${goldGradId})" stroke-width="2.5" />
        <circle cx="-35" cy="-35" r="4" fill="#212529" />
      </g>
    `;
  }

  if (p.halo && !infected) {
    let haloColor = `url(#${goldGradId})`;
    if (p.halo === 'leaves') haloColor = '#5c940d';
    if (p.halo === 'sun') haloColor = '#ff4500';
    
    if (p.halo === 'triple_gold') {
      svg += `
        <ellipse cx="60" cy="22" rx="25" ry="6" stroke="url(#${goldGradId})" stroke-width="2" fill="none" filter="url(#${shadowId})" class="anim-float" />
        <ellipse cx="60" cy="18" rx="18" ry="4.5" stroke="url(#${goldGradId})" stroke-width="1.5" fill="none" filter="url(#${shadowId})" class="anim-float" style="animation-delay:-0.5s" />
        <ellipse cx="60" cy="14" rx="12" ry="3" stroke="url(#${goldGradId})" stroke-width="1" fill="none" filter="url(#${shadowId})" class="anim-float" style="animation-delay:-1s" />
      `;
    } else {
      svg += `<ellipse cx="60" cy="22" rx="22" ry="6" stroke="${haloColor}" stroke-width="2.5" fill="none" filter="url(#${shadowId})" class="anim-float" />`;
    }
  }

  if (p.eclipse_ring && !infected) {
    svg += `
      <circle cx="60" cy="18" r="10" fill="#212529" stroke="#ff922b" stroke-width="3" filter="url(#${glowId})" class="anim-float" />
    `;
  }

  if (p.crown && !infected) {
    svg += `
      <polygon points="48,22 53,10 60,18 67,10 72,22 60,28" fill="url(#${goldGradId})" stroke="#d9480f" stroke-width="0.5" filter="url(#${shadowId})" />
    `;
  }

  if (template.rarity === 'DARK_MATTER' && !infected) {
    svg += `
      <!-- Dark Matter Glittering Lava Particles -->
      <g fill="#d500f9" filter="url(#${glowId})" class="anim-float">
        <circle cx="25" cy="35" r="2.2" />
        <polygon points="95,28 97,33 102,35 97,37 95,42 93,37 88,35 93,33" fill="#00ffff" />
        <circle cx="35" cy="85" r="1.8" />
        <polygon points="85,82 87,85 90,87 87,89 85,92 83,89 80,87 83,85" fill="#ff00ff" />
        <!-- Shimmering lava bubbles -->
        <circle cx="50" cy="88" r="2.5" fill="#7b00ad" opacity="0.6" />
        <circle cx="70" cy="90" r="3" fill="#2c004d" opacity="0.8" />
      </g>
    `;
  }

  // --- EVOLVED STATE STYLING overlays ---
  if (evolved && !infected) {
    svg += `
      <g filter="url(#${shadowId})" class="anim-float" style="animation-duration: 2.2s">
        <path d="M 46 22 L 48 8 L 54 16 L 60 6 L 66 16 L 72 8 L 74 22 Z" fill="url(#${goldGradId})" stroke="#d9480f" stroke-width="0.8" />
        <circle cx="48" cy="6" r="1.5" fill="#fff" />
        <circle cx="60" cy="4" r="2" fill="#fff" />
        <circle cx="72" cy="6" r="1.5" fill="#fff" />
      </g>
      <g fill="#ffd700" class="anim-float" style="animation-delay: -0.5s">
        <circle cx="20" cy="30" r="1.5" />
        <circle cx="100" cy="35" r="1.5" />
        <circle cx="95" cy="85" r="1" />
      </g>
    `;
  }

  // --- TOXIC OUTBREAK DRIZZLE SLIME IF INFECTED ---
  if (infected) {
    svg += `
      <!-- Purple slime drops dripping down -->
      <path d="M 32 68 Q 30 75, 27 75 Q 24 75, 26 68 Z" fill="#a800ff" opacity="0.9" filter="url(#${toxicGlowId})" />
      <path d="M 88 68 Q 90 75, 93 75 Q 96 75, 94 68 Z" fill="#a800ff" opacity="0.9" filter="url(#${toxicGlowId})" />
      <path d="M 60 88 Q 60 96, 57 96 Q 54 96, 56 88 Z" fill="#a800ff" opacity="0.9" filter="url(#${toxicGlowId})" />
      
      <!-- Sludge spots on head -->
      <circle cx="60" cy="38" r="5" fill="#5a1288" />
      <circle cx="44" cy="45" r="3" fill="#5a1288" />
      <circle cx="76" cy="45" r="3.5" fill="#5a1288" />
      
      <!-- Floating disease skulls/sparks -->
      <g fill="#a800ff" class="anim-float" style="animation-duration: 1.8s">
        <circle cx="24" cy="45" r="2" />
        <circle cx="96" cy="40" r="1.5" />
        <circle cx="34" cy="80" r="2.5" />
        <circle cx="86" cy="80" r="1" />
      </g>
    `;
  }

  svg += `</svg>`;
  return svg;
}

// Export modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BEAST_TEMPLATES, ELEMENTS, RARITIES, getBeastSVG };
} else {
  window.BEAST_TEMPLATES = BEAST_TEMPLATES;
  window.ELEMENTS = ELEMENTS;
  window.RARITIES = RARITIES;
  window.getBeastSVG = getBeastSVG;
}
