/**
 * Merge Beasts 1.5: the Interstellar Comet, the third world for beasts (UPDATE_1.5.md sections 3
 * and 5). It opens once both Prime and Low Gravity reach prestige 15.
 *
 * - Its beasts are fifteen alien species (comet_art.js draws them), every one Super Rare or rarer,
 *   the three rarest of a new rarity, Cosmic. Each species grows through Tiers 1 to 20 (a beast
 *   template per tier: `emerald_serpent_7`), its look in four stages.
 * - They come from comet eggs, not crates: eggs fall slowly on the comet's meadow, and shards
 *   (from the Shard Incubators in Prime and Low Gravity at prestige 15) buy more.
 * - Fusion, not merging: two comet beasts of one tier wrap themselves in a cocoon and come out a
 *   tier up, as the rarer of the two, after a wait that grows each tier; only a few cocoons at once.
 * - The comet earns its own essence and has its own prestige (0 to 10), which keeps its beasts.
 */
(() => {
  // ------------------------------------------------------------------ the Cosmic rarity
  // A reflecting, starry black (Sam, 23 Nov); its name and aura are drawn specially (style.css .rarity-cosmic, comet_art.js).
  RARITIES.COSMIC = { name: 'Cosmic', color: '#c8a8ff', multiplier: 5000, glow: 'rgba(160, 110, 255, 0.95)', cosmic: true };

  const SPECIES = [
    { id: 'emerald_serpent', name: 'Emerald Serpent', rarity: 'SUPER_RARE', element: 'EARTH', motion: 'swim', passive: 'thorns', special: 'anchor', lore: 'A jade serpent that hatched on the comet\'s first pass of a dead sun. The gems in its hood remember every world it has crossed.' },
    { id: 'grey_envoy', name: 'Grey Envoy', rarity: 'SUPER_RARE', element: 'COSMIC', motion: 'walk', passive: 'reflect', special: 'dispel', lore: 'It has visited a thousand worlds and spoken to none of them. The orb in its hands thinks faster than it does.' },
    { id: 'nebula_jelly', name: 'Nebula Jelly', rarity: 'SUPER_RARE', element: 'WATER', motion: 'float', passive: 'frostproof', special: 'ward', lore: 'There is a small nebula inside its bell, and it is still forming stars.' },
    { id: 'onyx_wyrm', name: 'Onyx Wyrm', rarity: 'ULTRA_RARE', element: 'FIRE', motion: 'walk', passive: 'fireproof', special: 'stagger', lore: 'Glossy black stone outside, molten rock within. It sleeps in the comet\'s core and wakes when it is warm.' },
    { id: 'void_stalker', name: 'Void Stalker', rarity: 'ULTRA_RARE', element: 'VOID', motion: 'walk', passive: 'lifesteal', special: 'sunder', lore: 'It has no eyes. It does not need them. The light along its body is how it talks to the rest of its pack.' },
    { id: 'prism_stag', name: 'Prism Stag', rarity: 'ULTRA_RARE', element: 'LIGHT', motion: 'walk', passive: 'haste', special: 'ward', lore: 'Its antlers split starlight into every colour there is, and a few there are not.' },
    { id: 'gilded_leafwing', name: 'Gilded Leafwing', rarity: 'LEGENDARY', element: 'WIND', motion: 'fly', passive: 'unshakeable', special: 'stagger', lore: 'A dragon no bigger than a dog, with wings of golden leaves that never fall in the same autumn twice.' },
    { id: 'mind_leviathan', name: 'Mind Leviathan', rarity: 'LEGENDARY', element: 'COSMIC', motion: 'float', passive: 'reflect', special: 'anchor', lore: 'A whale that swims through thought. Its brain is the size of a moon, and it is always listening.' },
    { id: 'quasar_phoenix', name: 'Quasar Phoenix', rarity: 'GODLY', element: 'FIRE', motion: 'fly', passive: 'revive', special: 'sunder', lore: 'A bird of living plasma. When it dies it burns brighter than a galaxy, and then it is born again.' },
    { id: 'chrononaut', name: 'Chrononaut', rarity: 'GODLY', element: 'DEITY', motion: 'walk', passive: 'parry', special: 'dispel', lore: 'A human from a very far future, with a little alien friend who keeps the time for them. Neither will say how they met.' },
    { id: 'astral_sage', name: 'Astral Sage', rarity: 'DARK_MATTER', element: 'LIGHT', motion: 'float', passive: 'haste', special: 'ward', lore: 'A scholar who read every book in the universe and wrote the rest. Her familiar has read them too, and has opinions.' },
    { id: 'eclipse_seraph', name: 'Eclipse Seraph', rarity: 'DARK_MATTER', element: 'DEITY', motion: 'float', passive: 'parry', special: 'stagger', lore: 'It wears an eclipse for a halo. Nobody has seen what is behind the mask, and lived to describe it badly.' },
    { id: 'singularity_dragon', name: 'The Singularity Dragon', rarity: 'COSMIC', element: 'VOID', motion: 'fly', passive: 'revive', special: 'sunder', lore: 'A dragon made of the night sky, with a black hole for a heart. Stars are born and die inside it as it breathes.' },
    { id: 'ouroboros', name: 'The Ouroboros', rarity: 'COSMIC', element: 'COSMIC', motion: 'float', passive: 'lifesteal', special: 'anchor', lore: 'The serpent that eats its own tail, coiled round a turning galaxy. It was here before the comet, and will be after.' },
    { id: 'architect', name: 'The Architect', rarity: 'COSMIC', element: 'DEITY', motion: 'float', passive: 'unshakeable', special: 'dispel', lore: 'A being drawn in lines of light, who shapes worlds in its hands for practice. The three moons are its first attempts.' },
  ];
  const BY_ID = {}; for (const s of SPECIES) BY_ID[s.id] = s;
  const RARITY_ORDER = ['SUPER_RARE', 'ULTRA_RARE', 'LEGENDARY', 'GODLY', 'DARK_MATTER', 'COSMIC'];
  const RARITY_CPS = { SUPER_RARE: 1, ULTRA_RARE: 1.6, LEGENDARY: 2.5, GODLY: 4, DARK_MATTER: 7, COSMIC: 12 };
  /** A tier's look: hatchling (1-5), young (6-10), adult (11-15), ascended (16-20). */
  const stageOf = (tier) => (tier <= 5 ? 1 : tier <= 10 ? 2 : tier <= 15 ? 3 : 4);
  const STAGE_WORD = ['', 'Hatchling', 'Young', 'Adult', 'Ascended'];
  const idOf = (species, tier) => `${species}_${tier}`;

  // Every species at every tier, as a beast template (system 'comet').
  for (const s of SPECIES) for (let tier = 1; tier <= 20; tier++) {
    BEAST_TEMPLATES[idOf(s.id, tier)] = {
      id: idOf(s.id, tier), name: s.name, tier, rarity: s.rarity, element: s.element, system: 'comet',
      baseCps: Math.round(2000 * Math.pow(3.2, tier - 1) * RARITY_CPS[s.rarity]),
      cost: 0, lore: s.lore, comet: { species: s.id, stage: stageOf(tier) },
      evolutions: tier < 20 ? [{ to: idOf(s.id, tier + 1), weight: 100 }] : [],
      svgParams: { body: s.motion === 'fly' ? 'bird' : s.motion === 'float' ? 'jellyfish' : 'dragon', eyes: 'cute', color: ['#ffffff', '#888888'] },
    };
  }

  // ------------------------------------------------------------------ the comet's own numbers
  const PRESTIGE_MAX = 10;
  const PRESTIGE_TARGETS = [1e8, 3e9, 1e11, 3e12, 1e14, 3e15, 1e17, 3e18, 1e20, 3e21];
  const BIOMES = ['Comet Crust', 'Ice Geyser Fields', 'Tail of Light', 'Crystal Hollows', 'Dust Storm Plains', 'Aurora Glacier', 'Chrono Craters', 'Nebula Wake', 'Stardust Sea', 'Heart of the Comet', 'The Origin'];
  /** Egg hatch odds by rarity (Sam: eggs, with a low chance of the rarest). */
  const EGG_ODDS = [['SUPER_RARE', 55], ['ULTRA_RARE', 27], ['LEGENDARY', 12], ['GODLY', 5], ['DARK_MATTER', 0.8], ['COSMIC', 0.2]];
  const SHARDS_PER_EGG = 120;

  const unlocked = () => {
    const p = (k) => (state.currentSolarSystem === k ? state.prestigeLevel : ((k === 'prime' ? state.primeSystem : state.lowGravitySystem) || {}).prestigeLevel) || 0;
    return state.currentSolarSystem === 'comet' || (p('prime') >= 15 && p('low_gravity') >= 15) || !!state.cometUnlocked;
  };
  const inComet = () => state.currentSolarSystem === 'comet' && !state.inBeastHub;

  /** A hatched beast: a species by the odds, at a low tier (higher with Egg Quality and prestige). */
  function hatch() {
    let x = Math.random() * 100, rarity = 'SUPER_RARE';
    for (const [r, w] of EGG_ODDS) { x -= w; if (x <= 0) { rarity = r; break; } }
    const pool = SPECIES.filter((s) => s.rarity === rarity);
    const s = pool[Math.floor(Math.random() * pool.length)];
    const q = (state.upgrades && state.upgrades.crateQuality) || 0;
    const top = Math.min(8, 1 + q + Math.floor((state.prestigeLevel || 0) / 2));
    // Skewed low: a high tier is rare even with every upgrade.
    const tier = Math.max(1, Math.min(top, 1 + Math.floor(Math.pow(Math.random(), 2.2) * top)));
    return idOf(s.id, tier);
  }

  // ------------------------------------------------------------------ fusion
  /** How long a cocoon takes to a tier (seconds): 20 s a tier, less with Fusion Speed. */
  const fusionTime = (toTier) => Math.round(20 * toTier * Math.pow(0.85, (state.upgrades && state.upgrades.fusionSpeed) || 0));
  /** Cocoons growing at once: two, a third at comet prestige 3, a fourth at 6. */
  const cocoonSlots = () => 2 + ((state.prestigeLevel || 0) >= 3 ? 1 : 0) + ((state.prestigeLevel || 0) >= 6 ? 1 : 0);
  const isComet = (id) => !!(BEAST_TEMPLATES[id] && BEAST_TEMPLATES[id].comet);
  /** The beast two comet beasts fuse into, or null with the reason. */
  function fusionOf(a, b) {
    const ta = BEAST_TEMPLATES[a], tb = BEAST_TEMPLATES[b];
    if (!ta || !tb || !ta.comet || !tb.comet) return { why: 'Only comet beasts fuse with comet beasts.' };
    if (ta.tier !== tb.tier) return { why: 'Comet beasts fuse only with another of the same tier.' };
    if (ta.tier >= 20) {
      // Two Tier 20 Dark Matter comet beasts make a Cosmic one (the only fusion that can).
      if (ta.rarity === 'DARK_MATTER' && tb.rarity === 'DARK_MATTER') { const c = SPECIES.filter((s) => s.rarity === 'COSMIC'); return { to: idOf(c[Math.floor(Math.random() * c.length)].id, 20) }; }
      return { why: 'Tier 20 is as high as a comet beast grows.' };
    }
    const ra = RARITY_ORDER.indexOf(ta.rarity), rb = RARITY_ORDER.indexOf(tb.rarity);
    const keep = ta.comet.species === tb.comet.species ? ta : ra > rb ? ta : rb > ra ? tb : Math.random() < 0.5 ? ta : tb;
    return { to: idOf(keep.comet.species, ta.tier + 1) };
  }

  // ------------------------------------------------------------------ the Shard Incubator (Prime and Low Gravity, prestige 15)
  /** Shards for a beast: about 2^(tier/3) times its rarity (Common 1 to Dark Matter 13), twice if evolved. */
  function shardsFor(id, evolved) {
    const t = BEAST_TEMPLATES[id];
    if (!t || t.comet) return 0;
    const r = { COMMON: 1, RARE: 1.5, SUPER_RARE: 2, ULTRA_RARE: 3, LEGENDARY: 5, GODLY: 8, DARK_MATTER: 13 }[t.rarity] || 1;
    return Math.max(1, Math.round(Math.pow(2, t.tier / 3) * r * (evolved ? 2 : 1)));
  }
  /** Seconds a beast takes to break down: a minute, longer for the big ones. */
  const shardTime = (id) => 30 + 6 * ((BEAST_TEMPLATES[id] || { tier: 1 }).tier);

  return void Object.assign(window, { COMET: {
    SPECIES, BY_ID, RARITY_ORDER, STAGE_WORD, PRESTIGE_MAX, PRESTIGE_TARGETS, BIOMES, EGG_ODDS, SHARDS_PER_EGG,
    stageOf, idOf, unlocked, inComet, hatch, fusionTime, cocoonSlots, isComet, fusionOf, shardsFor, shardTime,
  } });
})();
