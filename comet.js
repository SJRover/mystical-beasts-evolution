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
  // What each passive (from the start) and special (from Tier 10) does in World 7 (battle_engine.js).
  const PASSIVES = {
    fireproof: ['Fireproof', 'It never burns, and fire does it only half the damage.'],
    parry: ['Parry', 'Once a battle it survives a blow that would have killed it.'],
    thorns: ['Thorns', 'Anything that strikes it up close is hurt in return.'],
    lifesteal: ['Lifesteal', 'It heals by a share of the damage it deals.'],
    haste: ['Haste aura', 'Beasts near it attack faster.'],
    reflect: ['Reflect', 'Some of the shots fired at it fly back at whoever fired them.'],
    unshakeable: ['Unshakeable', 'Nothing can knock it back or stun it.'],
    revive: ['Revive', 'Once a battle it rises again ten seconds after it falls.'],
    frostproof: ['Frostproof', 'Nothing can slow it or freeze it.'],
  };
  const SPECIALS = {
    stagger: ['Stagger', 'A huge blow that knocks even a giant back up the field.'],
    anchor: ['Anchor', 'It holds a boss for six seconds, so that it cannot start a big attack.'],
    dispel: ['Dispel', 'It cancels an attack that a boss is winding up.'],
    ward: ['Ward', 'It shields the beasts around it against the next big blow.'],
    sunder: ['Sunder', 'For ten seconds its blows go straight through armour.'],
  };
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
  // (Tuned with a model of an active player, 24 Nov, for slow and hard progress: prestige 1 in about
  // an hour, 3 in about seven, 5 in about a day and a bit, 8 in about two hundred hours of play.)
  const PRESTIGE_TARGETS = [2e10, 2e12, 1e14, 5e15, 1e17, 1e18, 1e19, 1e20, 1e21, 1e22];
  const BIOMES = ['Comet Crust', 'Ice Geyser Fields', 'Tail of Light', 'Crystal Hollows', 'Dust Storm Plains', 'Aurora Glacier', 'Chrono Craters', 'Nebula Wake', 'Stardust Sea', 'Heart of the Comet', 'The Origin'];
  /** Egg hatch odds by rarity (Sam: eggs, with a low chance of the rarest). */
  const EGG_ODDS = [['SUPER_RARE', 55], ['ULTRA_RARE', 27], ['LEGENDARY', 12], ['GODLY', 5], ['DARK_MATTER', 0.8], ['COSMIC', 0.2]];
  const SHARDS_PER_EGG = 120;

  const unlocked = () => {
    const p = (k) => (state.currentSolarSystem === k ? state.prestigeLevel : ((k === 'prime' ? state.primeSystem : state.lowGravitySystem) || {}).prestigeLevel) || 0;
    return state.currentSolarSystem === 'comet' || (p('prime') >= 15 && p('low_gravity') >= 15) || !!state.cometUnlocked;
  };
  const inComet = () => state.currentSolarSystem === 'comet' && !state.inBeastHub;

  // A premium crate opened on the comet is a premium egg: Ultra Rare or better, the same odds
  // between those as a comet egg has (these are the numbers the shop shows).
  const PREMIUM_EGG_ODDS = EGG_ODDS.filter(([r]) => RARITY_ORDER.indexOf(r) >= 1);
  const pick = (odds) => {
    const total = odds.reduce((a, [, w]) => a + w, 0);
    let x = Math.random() * total;
    for (const [r, w] of odds) { x -= w; if (x <= 0) return r; }
    return odds[0][0];
  };
  /** A beast of that rarity's species (any of them), at that tier. */
  const ofRarity = (rarity, tier) => {
    const pool = SPECIES.filter((s) => s.rarity === rarity);
    return idOf(pool[Math.floor(Math.random() * pool.length)].id, Math.max(1, Math.min(20, tier)));
  };

  /**
   * A hatched beast: a species by the odds, at a low tier (higher with Egg Quality and prestige).
   * A premium egg (premium crates are bought) is Ultra Rare or better and hatches at Tier 3 to 10.
   */
  function hatch(premium = false) {
    const rarity = pick(premium ? PREMIUM_EGG_ODDS : EGG_ODDS);
    const q = (state.upgrades && state.upgrades.crateQuality) || 0;
    const low = premium ? 3 : 1;
    const top = Math.min(premium ? 10 : 8, (premium ? 5 : 1) + q + Math.floor((state.prestigeLevel || 0) / 2));
    // Skewed low: a high tier is rare even with every upgrade.
    const tier = Math.max(low, Math.min(top, low + Math.floor(Math.pow(Math.random(), premium ? 1.6 : 2.2) * (top - low + 1))));
    return ofRarity(rarity, tier);
  }
  /** The daily spin on the comet: the rarity the wheel landed on (Super Rare at least), a third of its tier. */
  const spinPrize = (tier, rarity) => ofRarity(RARITY_ORDER.includes(rarity) ? rarity : 'SUPER_RARE', Math.ceil(tier / 3));
  /** The premium egg's chances, for the shop (Apple guideline 3.1.1). */
  const premiumOdds = () => {
    const total = PREMIUM_EGG_ODDS.reduce((a, [, w]) => a + w, 0);
    return PREMIUM_EGG_ODDS.map(([r, w]) => ({ rarity: RARITIES[r].name, pct: (w / total) * 100 }));
  };

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

  // ------------------------------------------------------------------ pictures
  /** A comet beast drawn on a canvas `px` square from its artwork (comet_art.js), feet near the bottom, its rarity glowing off it. */
  function canvasFor(id, px, glow = true) {
    const t = BEAST_TEMPLATES[id];
    const raw = document.createElement('canvas'); raw.width = raw.height = px;
    const g = raw.getContext('2d');
    g.translate(px / 2, px * 0.9);
    // (Young ones drawn as big as adults in pictures: their stage shrinks them, and a hatchling
    // was a speck in a menu. Sam, 24 Nov.)
    if (typeof COMET_ART !== 'undefined') COMET_ART.draw(g, t.comet.species, t.comet.stage, { t: 1.3 + (t.tier % 5) * 0.37 }, px * 0.6 * COMET_ART.grow(t.comet.stage, 1));
    if (!glow) return raw;
    const c = document.createElement('canvas'); c.width = c.height = px;
    const ctx = c.getContext('2d');
    ctx.shadowColor = (RARITIES[t.rarity] || {}).glow || 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = px * 0.07; ctx.drawImage(raw, 0, 0);
    ctx.shadowBlur = px * 0.03; ctx.drawImage(raw, 0, 0);
    ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.drawImage(raw, 0, 0);
    return c;
  }
  const svgCache = new Map();
  /** For getBeastSVG (menus, cards, toasts): the picture inside an svg, made once. */
  function svg(id) {
    if (!svgCache.has(id)) svgCache.set(id, `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="overflow:visible"><image href="${canvasFor(id, 192).toDataURL('image/png')}" x="0" y="0" width="100" height="100"/></svg>`);
    return svgCache.get(id);
  }

  /** A comet egg: dark and speckled with stars, a glowing crack across it. */
  function eggSvg(premium = false) {
    // (1.5, Sam 24 Nov: a premium crate on the comet is a premium egg: gold shell, gold glow, a band
    // of gold round it, more stars.)
    const k = premium ? 'P' : '';
    const shell = premium ? ['#ffe9a0', '#b8780a', '#3a2200'] : ['#7a6ad8', '#2a1a5a', '#0a0618'];
    const glow = premium ? '#ffd84a' : '#c8a8ff';
    const stars = [[36, 30, 2.2], [60, 26, 1.6], [66, 70, 2], [40, 74, 1.4], [52, 38, 1.2], [30, 64, 1.2], [70, 40, 1.4], ...(premium ? [[46, 20, 1.3], [74, 58, 1.5], [26, 44, 1.1], [56, 82, 1.3]] : [])];
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="overflow:visible"><defs><radialGradient id="cmEgg${k}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="${shell[0]}"/><stop offset="0.55" stop-color="${shell[1]}"/><stop offset="1" stop-color="${shell[2]}"/></radialGradient><radialGradient id="cmEggGlow${k}" cx="50%" cy="55%" r="50%"><stop offset="0" stop-color="${glow}" stop-opacity="${premium ? 0.85 : 0.65}"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="50" cy="58" rx="${premium ? 52 : 46}" ry="${premium ? 50 : 44}" fill="url(#cmEggGlow${k})"/><ellipse cx="50" cy="94" rx="26" ry="5" fill="rgba(0,0,0,0.3)"/>
      <path d="M50 12 C72 12 82 46 80 64 C78 84 64 94 50 94 C36 94 22 84 20 64 C18 46 28 12 50 12 Z" fill="url(#cmEgg${k})" stroke="#1c1426" stroke-width="3"/>
      ${premium ? '<path d="M21 66 Q50 76 79 66" fill="none" stroke="#fff3c0" stroke-width="5"/><path d="M21 66 Q50 76 79 66" fill="none" stroke="#c88a10" stroke-width="2"/>' + [30, 50, 70].map((x) => `<path d="M${x} ${x === 50 ? 67 : 66} l3 4 l-3 4 l-3 -4 z" fill="#ffffff" stroke="#c88a10" stroke-width="1"/>`).join('') : ''}
      <path d="M28 52 L38 46 L44 56 L54 48 L60 58 L72 50" fill="none" stroke="${premium ? '#fff8d8' : '#ffe8a0'}" stroke-width="3" stroke-linejoin="round"/><path d="M28 52 L38 46 L44 56 L54 48 L60 58 L72 50" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/>
      ${stars.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="0.85"/>`).join('')}
      <ellipse cx="38" cy="28" rx="7" ry="4" fill="#ffffff" opacity="${premium ? 0.55 : 0.35}" transform="rotate(-30 38 28)"/></svg>`;
  }
  /** A cocoon of light, tinted by what is growing inside it. */
  function cocoonSvg(rarity) {
    // (1.5, Sam 24 Nov: a Cosmic one growing is black, rimmed in violet, full of stars.)
    if (rarity === 'COSMIC') return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="overflow:visible" class="cocoon-svg cocoon-cosmic"><defs><radialGradient id="cmCocCosmic" cx="45%" cy="42%" r="70%"><stop offset="0" stop-color="#000000"/><stop offset="0.6" stop-color="#0a0418"/><stop offset="0.85" stop-color="#3a1a7a"/><stop offset="1" stop-color="#b46bff"/></radialGradient><radialGradient id="cmCocCosmicGlow" cx="50%" cy="50%" r="50%"><stop offset="0.55" stop-color="#000000" stop-opacity="0.7"/><stop offset="0.8" stop-color="#7a3cff" stop-opacity="0.35"/><stop offset="1" stop-color="#7a3cff" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="50" cy="52" rx="48" ry="52" fill="url(#cmCocCosmicGlow)"/><ellipse cx="50" cy="94" rx="22" ry="5" fill="rgba(0,0,0,0.4)"/>
      <path d="M50 6 C68 14 74 40 70 62 C66 82 58 94 50 94 C42 94 34 82 30 62 C26 40 32 14 50 6 Z" fill="url(#cmCocCosmic)" stroke="#c8a8ff" stroke-width="2.4"/>
      ${[[44, 30, 1.6, '#ffffff'], [56, 44, 1.2, '#c8a8ff'], [42, 58, 1.4, '#7ad8ff'], [58, 70, 1.6, '#ffffff'], [48, 80, 1.1, '#ffd36b'], [52, 22, 1, '#ffffff'], [62, 56, 1, '#ff9ae8'], [38, 44, 1, '#ffffff']].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('')}
      <path d="M46 30 l1 -4 l1 4 l4 1 l-4 1 l-1 4 l-1 -4 l-4 -1 z" fill="#ffffff"/>
      <path d="M50 6 Q46 0 52 -6" fill="none" stroke="#c8b8ff" stroke-width="2.4"/></svg>`;
    const c = (RARITIES[rarity] || {}).color || '#c8a8ff';
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="overflow:visible" class="cocoon-svg"><defs><radialGradient id="cmCoc${rarity}" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="${c}"/><stop offset="1" stop-color="#1a0a3a"/></radialGradient></defs>
      <ellipse cx="50" cy="94" rx="22" ry="5" fill="rgba(0,0,0,0.3)"/>
      <path d="M50 6 C68 14 74 40 70 62 C66 82 58 94 50 94 C42 94 34 82 30 62 C26 40 32 14 50 6 Z" fill="url(#cmCoc${rarity})" stroke="#1c1426" stroke-width="3"/>
      <path d="M36 30 Q50 38 64 30 M32 50 Q50 60 68 50 M34 70 Q50 80 66 70" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2.4"/>
      <path d="M50 6 Q46 0 52 -6" fill="none" stroke="#c8b8ff" stroke-width="2.4"/></svg>`;
  }

  // ------------------------------------------------------------------ achievements (the Comet tab)
  /**
   * 1.5 (Sam, 24 Nov): the comet's achievements, and the hardest of all in the Mutant Worlds, paying
   * comet eggs, shards, boosts and comet beasts at every stage. Progress comes from saved totals
   * (battle.js cometTotals), so it is never lost: count(c) gives [have, need].
   */
  const ACH = [
    { id: 'c_reach', group: 'comet', name: 'Comet Rider', desc: 'Reach the Interstellar Comet.', count: (c) => [c.reached, 1], reward: { eggs: 3 } },
    { id: 'c_fuse_10', group: 'comet', name: 'Cocoon Keeper', desc: 'Fuse comet beasts 10 times.', count: (c) => [c.fusions, 10], reward: { eggs: 2, boost: { mult: 1.5, minutes: 120 } } },
    { id: 'c_fuse_100', group: 'comet', name: 'Metamorphosis', desc: 'Fuse comet beasts 100 times.', count: (c) => [c.fusions, 100], reward: { comet: 'nebula_jelly_11' } },
    { id: 'c_young', group: 'comet', name: 'Growing Up', desc: 'Grow a comet beast to Tier 6, young.', count: (c) => [c.bestTier, 6], reward: { shards: 300 } },
    { id: 'c_adult', group: 'comet', name: 'Coming of Age', desc: 'Grow a comet beast to Tier 11, adult.', count: (c) => [c.bestTier, 11], reward: { eggs: 4, income: 240 } },
    { id: 'c_ascended', group: 'comet', name: 'Ascension', desc: 'Grow a comet beast to Tier 16, ascended.', count: (c) => [c.bestTier, 16], reward: { shards: 1500, boost: { mult: 2, minutes: 180 } } },
    { id: 'c_species_5', group: 'comet', name: 'Xenobiologist', desc: 'Find 5 kinds of comet beast.', count: (c) => [c.species, 5], reward: { shards: 600 } },
    { id: 'c_species_all', group: 'comet', name: 'Every Star-Born', desc: 'Find all 15 kinds of comet beast.', count: (c) => [c.species, 15], reward: { comet: 'architect_20' } },
    { id: 'c_prestige_5', group: 'comet', name: 'Comet Ascendant', desc: 'Reach comet prestige 5.', count: (c) => [c.prestige, 5], reward: { eggs: 5 } },
    { id: 'c_prestige_10', group: 'comet', name: 'Comet Pinnacle', desc: 'Reach comet prestige 10, the highest.', count: (c) => [c.prestige, 10], reward: { comet: 'gilded_leafwing_18' } },
    { id: 'c_cosmic', group: 'comet', name: 'Born of Two Darknesses', desc: 'Fuse two Tier 20 Dark Matter comet beasts into a Cosmic one.', count: (c) => [c.cosmicFused, 1], reward: { income: 720, boost: { mult: 2, minutes: 360 } } },
    { id: 'c_shards', group: 'comet', name: 'Shardsmith', desc: 'Make 5,000 comet shards in the Shard Incubators.', count: (c) => [c.shardsMade, 5000], reward: { eggs: 4 } },
    { id: 'h_stars_7', group: 'hard', name: 'Untouchable', desc: 'Earn every star in World 7.', count: (c) => [c.w7stars, 20], reward: { comet: 'prism_stag_16', shards: 800 } },
    { id: 'h_stars_8', group: 'hard', name: 'Apex of Apexes', desc: 'Earn every star in World 8.', count: (c) => [c.w8stars, 20], reward: { comet: 'eclipse_seraph_18' } },
    { id: 'h_stars_all', group: 'hard', name: 'A Star on Every Mutant', desc: 'Earn every star in both Mutant Worlds.', count: (c) => [c.w7stars + c.w8stars, 40], reward: { comet: 'astral_sage_20', boost: { mult: 2, minutes: 360 } } },
    { id: 'h_nc_dragon', group: 'hard', name: 'The Old Ways: Pyraxis', desc: 'Beat Pyraxis the Dragon (World 7, level 9) with no comet beasts in your six.', count: (c) => [c.noComet['7-9'] ? 1 : 0, 1], reward: { comet: 'onyx_wyrm_11' } },
    { id: 'h_nc_chimera', group: 'hard', name: 'The Old Ways: the Chimera', desc: 'Beat the Omega Chimera (World 7, level 20) with no comet beasts in your six.', count: (c) => [c.noComet['7-20'] ? 1 : 0, 1], reward: { comet: 'mind_leviathan_14' } },
    // (World 8's three are levels the best old six, specials fired well, can still just win at their
    // tuned strengths; the Wardens, the Hollow King and the World-Eater were out of reach without
    // comet beasts once World 8 was made super hard.)
    { id: 'h_nc_bull', group: 'hard', name: 'The Old Ways: Thunderhoof', desc: 'Beat Thunderhoof the Storm Bull (World 8, level 6) with no comet beasts in your six.', count: (c) => [c.noComet['8-6'] ? 1 : 0, 1], reward: { comet: 'quasar_phoenix_16' } },
    { id: 'h_nc_sand', group: 'hard', name: 'The Old Ways: Sand and Flesh', desc: 'Beat Sand and Flesh (World 8, level 15) with no comet beasts in your six.', count: (c) => [c.noComet['8-15'] ? 1 : 0, 1], reward: { comet: 'void_stalker_17' } },
    { id: 'h_nc_brood', group: 'hard', name: 'The Old Ways: Worm and Brood', desc: 'Beat Worm and Brood (World 8, level 11) with no comet beasts in your six.', count: (c) => [c.noComet['8-11'] ? 1 : 0, 1], reward: { comet: 'chrononaut_20' } },
  ];

  return void Object.assign(window, { COMET: {
    ACH,
    canvasFor, svg, eggSvg, cocoonSvg,
    SPECIES, BY_ID, RARITY_ORDER, STAGE_WORD, PASSIVES, SPECIALS, PRESTIGE_MAX, PRESTIGE_TARGETS, BIOMES, EGG_ODDS, SHARDS_PER_EGG,
    stageOf, idOf, unlocked, inComet, hatch, spinPrize, premiumOdds, fusionTime, cocoonSlots, isComet, fusionOf, shardsFor, shardTime,
  } });
})();
