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
  const RANKS = ['COMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE', 'LEGENDARY', 'GODLY', 'DARK_MATTER'];
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

  // ------------------------------------------------------------------ Folded Legends
  /**
   * Beasts you can only earn in battle (never from a crate, the wheel or a merge): paper animals,
   * folded and faceted, nothing like the meadow's. Each has the points a beast of its tier and
   * rarity would have (Tier + 3 + the rarity's bonus), shared lopsidedly on purpose: a crane that
   * hits from far off and folds at a touch, a tiger all teeth and no health. They battle in any
   * world, and do not grow with prestige. legends_art.js draws them.
   */
  const LEGEND_LIST = [
    { id: 'paper_crane', name: 'Paper Crane', tier: 4, rarity: 'RARE', element: 'WIND', motion: 'fly', stats: { atk: 1, hp: 1, spd: 2, rng: 4 }, need: { stars: 10 }, how: 'Earn 10 stars', title: 'the Courier', lore: 'Folded from a winning ticket, it carries the letters nobody else will. It hits from far off and crumples at the first touch.' },
    { id: 'fold_fox', name: 'Fold Fox', tier: 5, rarity: 'RARE', element: 'FIRE', motion: 'walk', stats: { atk: 2, hp: 1, spd: 5, rng: 1 }, need: { clears: 15 }, how: 'Win 15 levels', title: 'the Scout', lore: 'Quick as a page turning, its scarf streaming behind it. It gets to a coin pile before anyone has noticed it go.' },
    { id: 'origami_frog', name: 'Origami Frog', tier: 3, rarity: 'SUPER_RARE', element: 'WATER', motion: 'hop', stats: { atk: 4, hp: 2, spd: 1, rng: 1 }, need: { role: 'swarm', kills: 150 }, how: 'Defeat 150 swarm enemies', title: 'the Samurai', lore: 'A small frog with a sharp sword and a big kick, ready again in three seconds.' },
    { id: 'origami_turtle', name: 'Origami Turtle', tier: 6, rarity: 'SUPER_RARE', element: 'EARTH', motion: 'walk', stats: { atk: 1, hp: 8, spd: 1, rng: 1 }, need: { lowTierWin: true }, how: 'Win a level from level 5 on with no beast above Tier 3', title: 'the Old Sage', lore: 'It has walked every road under that straw hat. It barely hits at all and barely gets hurt at all, so it holds a lane for ages.' },
    { id: 'kite_ray', name: 'Kite Ray', tier: 7, rarity: 'ULTRA_RARE', element: 'WIND', motion: 'fly', stats: { atk: 2, hp: 2, spd: 5, rng: 4 }, need: { flawless: 5 }, how: 'Win 5 levels from level 5 on with your coin pile full', title: 'the Sky Pilot', lore: 'Goggles on and ribbons flying, it flies on a string nobody holds, darting in and out.' },
    { id: 'paper_tiger', name: 'Paper Tiger', tier: 8, rarity: 'SUPER_RARE', element: 'FIRE', motion: 'walk', stats: { atk: 9, hp: 1, spd: 2, rng: 1 }, need: { bosses: 3 }, how: 'Beat 3 bosses', title: 'the Brawler', lore: 'It ties on its headband and roars. Its bite is far worse than its bark, but one good poke and it tears.' },
    { id: 'lantern_koi', name: 'Lantern Koi', tier: 9, rarity: 'ULTRA_RARE', element: 'LIGHT', motion: 'swim', stats: { atk: 3, hp: 2, spd: 2, rng: 8 }, need: { seen: 75 }, how: 'Meet 75 kinds of enemy', title: 'the Lantern Bearer', lore: 'It swims through the air with its lantern held high, throwing its light a long way.' },
    { id: 'folded_stag', name: 'Folded Stag', tier: 10, rarity: 'ULTRA_RARE', element: 'EARTH', motion: 'walk', stats: { atk: 6, hp: 8, spd: 1, rng: 1 }, need: { world: 1, kills: 400 }, how: 'Defeat 400 shadow folk (World 1)', title: 'the Shrine Guardian', lore: 'The keeper of the forest shrine, with sacred rope and paper streamers at its neck. It is slow and proud, with antlers creased sharp enough to cut.' },
    { id: 'paper_bat', name: 'Paper Bat', tier: 11, rarity: 'LEGENDARY', element: 'VOID', motion: 'fly', stats: { atk: 5, hp: 3, spd: 8, rng: 2 }, need: { world: 3, kills: 400 }, how: 'Defeat 400 invaders (World 3)', title: 'the Night Count', lore: 'It bows, smiles and is gone, flapping out of the dark faster than anything on the field.' },
    { id: 'scroll_serpent', name: 'Scroll Serpent', tier: 12, rarity: 'LEGENDARY', element: 'COSMIC', motion: 'swim', stats: { atk: 5, hp: 1, spd: 2, rng: 11 }, need: { stars: 40 }, how: 'Earn 40 stars', title: 'the Scholar', lore: 'It writes its own story as it goes and strikes from the far side of the field. Keep it behind your front.' },
    { id: 'paper_owl', name: 'Paper Owl', tier: 13, rarity: 'LEGENDARY', element: 'LIGHT', motion: 'fly', stats: { atk: 6, hp: 5, spd: 3, rng: 6 }, need: { foe: 'shade_king', kills: 3 }, how: 'Defeat the Shade King 3 times', title: 'the Professor', lore: 'It has read every book there is on the Shade King, sees in the dark he left behind, and does not miss.' },
    { id: 'origami_dragon', name: 'Origami Dragon', tier: 16, rarity: 'GODLY', element: 'FIRE', motion: 'fly', stats: { atk: 9, hp: 5, spd: 2, rng: 8 }, need: { bosses: 12 }, how: 'Beat 12 bosses', title: 'the Warlord', lore: 'A thousand folds, and every one of them a claw.' },
    { id: 'fold_phoenix', name: 'Fold Phoenix', tier: 18, rarity: 'GODLY', element: 'FIRE', motion: 'fly', stats: { atk: 10, hp: 4, spd: 9, rng: 3 }, need: { clears: 120 }, how: 'Win 120 levels', title: 'the Firebird', lore: 'It burns, and folds itself again from the ashes.' },
    { id: 'paper_kirin', name: 'The Paper Kirin', tier: 20, rarity: 'DARK_MATTER', element: 'DEITY', motion: 'walk', stats: { atk: 9, hp: 9, spd: 5, rng: 6 }, need: { allAch: true }, how: 'Earn every other battle achievement', title: 'the Dark Sovereign', lore: 'Folded from every medal you have won, it walks on clouds. Nothing in either universe stands up to it for long.' },
    { id: 'thousand_cranes', name: 'The Thousand Cranes', tier: 20, rarity: 'DARK_MATTER', element: 'DEITY', motion: 'fly', stats: { atk: 8, hp: 4, spd: 5, rng: 12 }, need: { stars: 200 }, how: 'Earn 200 stars', title: 'the Crane Queen', lore: 'A wish folded a thousand times over, her flock always about her. She strikes from further than anything else in either universe.' },
  ];
  const LEGENDS = {};
  for (const l of LEGEND_LIST) LEGENDS[l.id] = { ...l, legend: true, system: 'any', svgParams: {} };
  /** A beast or a legend, by id. */
  const T = (id) => BEAST_TEMPLATES[id] || LEGENDS[id];
  /** Whether a legend's challenge is met by the battle totals `t` (battle.js totals). */
  function legendEarned(id, t) {
    const n = (LEGENDS[id] || {}).need || {};
    if (n.stars) return t.stars >= n.stars;
    if (n.clears) return t.clears >= n.clears;
    if (n.bosses) return t.bosses >= n.bosses;
    if (n.seen) return t.seen >= n.seen;
    if (n.flawless) return t.flawless >= n.flawless;
    if (n.lowTierWin) return !!t.lowTierWin;
    if (n.allAch) return t.achTotal > 0 && t.achDone >= t.achTotal;
    if (n.role) return ((t.killsByRole || {})[n.role] || 0) >= n.kills;
    if (n.world) return ((t.killsByWorld || {})[n.world] || 0) >= n.kills;
    if (n.foe) return ((t.killsOf || {})[n.foe] || 0) >= n.kills;
    return false;
  }
  /** How far along a legend's challenge is, as "12/40". */
  function legendProgress(id, t) {
    const n = (LEGENDS[id] || {}).need || {};
    const have = n.stars ? t.stars : n.clears ? t.clears : n.bosses ? t.bosses : n.seen ? t.seen : n.flawless ? t.flawless
      : n.allAch ? t.achDone || 0 : n.role ? (t.killsByRole || {})[n.role] || 0 : n.world ? (t.killsByWorld || {})[n.world] || 0 : n.foe ? (t.killsOf || {})[n.foe] || 0 : t.lowTierWin ? 1 : 0;
    const want = n.stars || n.clears || n.bosses || n.seen || n.flawless || n.kills || (n.allAch ? t.achTotal : 0) || 1;
    return `${Math.min(have, want)}/${want}`;
  }

  /**
   * A beast's battle stats: 1 in each at Tier 1, one more a tier shared by its look, its rarity's
   * bonus on its highest stat, and one random point (fixed for that beast) for each prestige
   * level it has been owned at.
   */
  function beastStats(id, prestige = 0) {
    if (LEGENDS[id]) return { ...LEGENDS[id].stats };
    const t = BEAST_TEMPLATES[id];
    if (!t) return null;
    const s = share(Math.max(0, t.tier - 1), order(id), { atk: 1, hp: 1, spd: 1, rng: 1 });
    // (1.5: a comet beast has four points more than any other of its tier, a Cosmic one seven more.)
    const bonus = (RARITY_BONUS[t.rarity] || (t.rarity === 'COSMIC' ? 7 : 0)) + (t.comet ? 4 : 0) + (t.limited ? 8 : 0);
    if (bonus) {
      const top = Math.max(...STATS.map((k) => s[k]));
      const tied = STATS.filter((k) => s[k] === top);
      const pick = tied.length === STATS.length ? tied[Math.floor(seeded(hash(id + '|rarity'))() * tied.length)] : order(id).find((k) => tied.includes(k));
      s[pick] += bonus;
    }
    // (1.5: a comet beast is only found by a player at prestige 15 in both solar systems, so it always
    // has those fifteen points, and one more for each of the comet's own prestiges, up to ten.)
    const pts = t.comet ? 15 + Math.min(prestige, 10) : Math.min(prestige, 15);
    for (let k = 1; k <= pts; k++) s[STATS[Math.floor(seeded(hash(id + '|prestige|' + k))() * 4)]]++;
    return s;
  }

  /** Points to the battle: hit points, light hit, speed (units a second) and reach (units). */
  function battleNumbers(s) {
    return {
      maxHp: 60 * s.hp,
      light: 3 * s.atk,
      speed: Math.min(260, 70 + 16 * Math.max(0, s.spd - 1)),
      reach: Math.min(340, 34 + 20 * Math.max(0, s.rng - 1)),
    };
  }

  /** Whether a beast can battle (not the shadow bosses of the meadow). */
  function canBattle(id) {
    if (LEGENDS[id]) return true;
    const t = BEAST_TEMPLATES[id];
    return !!t && !['shadow_fiend', 'shadow_fiend_evolved', 'void_parasite', 'void_parasite_evolved'].includes(id);
  }
  /** A beast's solar system ('any' for a legend, which battles in every world). */
  // (1.5: comet beasts are the comet's, and battle only in World 7.)
  const systemOf = (id) => (LEGENDS[id] || (BEAST_TEMPLATES[id] || {}).relic ? 'any' : (BEAST_TEMPLATES[id] || {}).system === 'low_gravity' ? 'low_gravity' : (BEAST_TEMPLATES[id] || {}).system === 'comet' ? 'comet' : 'prime');
  /** A beast's card rests this long after it is played: its tier in seconds. */
  // (1.5: a comet beast's card rests a quarter longer, to balance its strength, Sam 24 Nov.)
  const COMET_REST = 1.25;
  const cooldownOf = (id) => { const t = T(id) || { tier: 1 }; return t.comet ? Math.round(t.tier * COMET_REST) : t.tier; };

  /**
   * Mana (Sam, 18 Nov, like Clash Royale's elixir and Battle Cats' wallet, so the strongest cards
   * cannot simply be played again and again): you hold at most 50, start with 25, and it fills 10
   * every 5 seconds. Cards still recharge as before. Perks and some levels fill it faster or hold
   * more. A beast costs about half its tier (Tier 1 one, Tier 10 six, Tier 20 eleven). Sam
   * suggested its whole tier, but tested that way a Tier 6 six beat as strong enemies as a Tier 14
   * one (cheap beasts gave more fight for their mana), so merging up would not have helped; at half,
   * Tier 14 and up beat about 40% more than Tier 6 to 10, and the best still cost the most.
   */
  const MANA = { max: 50, start: 25, regen: 2 };
  const costOfTier = (tier) => Math.round(2 + 0.75 * tier);
  // (1.5: a comet beast costs a fifth more mana, as well as resting longer, Sam 24 Nov.)
  const COMET_MANA = 1.2;
  const cometCost = (tier) => Math.round(costOfTier(tier) * COMET_MANA);
  const costOf = (id) => { const t = T(id) || { tier: 1 }; return t.comet ? cometCost(t.tier) : costOfTier(t.tier); };
  /** A beast's stats synced down to a tier and rarity (Sync down), at prestige 0. */
  function syncStats(id, cap) {
    const t = BEAST_TEMPLATES[id];
    if (!t) return beastStats(id, 0);
    const tier = cap.tier ? Math.min(cap.tier, t.tier) : t.tier;
    const rarity = cap.rarity && RANKS.indexOf(t.rarity) > RANKS.indexOf(cap.rarity) ? cap.rarity : t.rarity;
    const s = share(Math.max(0, tier - 1), order(id), { atk: 1, hp: 1, spd: 1, rng: 1 });
    const bonus = RARITY_BONUS[rarity] || 0;
    if (bonus) { const top = Math.max(...STATS.map((k) => s[k])); s[order(id).find((k) => s[k] === top)] += bonus; }
    return s;
  }

  /**
   * How a beast fights (Sam, 18 Nov: "it should say whether beasts are single or area or ranged
   * attack"): Range 3 and up shoots one target from afar; the big-bodied (titans, giants, krakens,
   * hydras, slimes, colossi...) hit an area up close, their blow landing on everything near the
   * target at half strength (never with a long reach or extra attack); the rest hit one target up
   * close.
   */
  const AREA_LOOK = /titan|colossus|giant|glaciator|pyroclasm|magmadon|kraken|hydra|slime|leviathan|gaia|bark|amethyst|volcanis|ent_|supergiant|chitin|arachno/;
  // 1.5 (Sam, 24 Nov: too few area attackers; Low Gravity had one, the comet none, and late on every
  // beast shot single targets): Low Gravity's sharks and gargoyles, and five comet kinds, hit an area
  // too. An area beast keeps it even when it reaches far enough to shoot (its shots burst).
  const AREA_BODY = new Set(['shark', 'gargoyle']);
  const AREA_COMET = new Set(['onyx_wyrm', 'quasar_phoenix', 'mind_leviathan', 'singularity_dragon', 'ouroboros']);
  const areaBeast = (id) => { const t = T(id) || {}; return AREA_LOOK.test(id) || (t.system === 'low_gravity' && AREA_BODY.has((t.svgParams || {}).body)) || !!(t.comet && AREA_COMET.has(t.comet.species)); };
  function attackKind(id, prestige = 0) {
    if (areaBeast(id)) return 'area';
    const s = beastStats(id, prestige);
    if (34 + 20 * Math.max(0, s.rng - 1) >= 74) return 'ranged';
    return 'single';
  }
  /**
   * Enemy abilities, by who they are: leapers jump over your front line once; cloakers turn
   * invisible for a few seconds now and then (nothing can target them, and a blow shows them);
   * burrowers travel underground to the middle of the field and come up there; healers mend those
   * round them; shield bearers make those near them take a quarter less; summoners call up a pair
   * of small ones; chargers rush their first target and hit it hard; frost and stares slow what
   * they hit; heavy hammers and clubs knock beasts back.
   */
  const TRAITS = {
    leap: { icon: '🦘', name: 'Leaps', text: 'Jumps over your front line once.' },
    cloak: { icon: '👻', name: 'Cloaks', text: 'Turns invisible for a few seconds now and then.' },
    burrow: { icon: '🕳', name: 'Burrows', text: 'Travels underground to the middle of the field.' },
    heal: { icon: '✚', name: 'Heals', text: 'Mends the enemies round it.' },
    aura: { icon: '🛡', name: 'Shields', text: 'Enemies near it take a quarter less.' },
    summon: { icon: '🥚', name: 'Summons', text: 'Calls up a pair of small ones.' },
    charge: { icon: '🐂', name: 'Charges', text: 'Rushes its first target and hits it hard.' },
    slow: { icon: '❄', name: 'Slows', text: 'What it hits moves and strikes slower.' },
    knock: { icon: '💢', name: 'Knocks back', text: 'Its heavy blows push beasts back.' },
  };
  const TRAIT_WORDS = [
    ['leap', /goblin|imp|satyr|ninja|jester|hopper|harpy|jet_|dust_devil|powder|comet_imps/],
    ['cloak', /cloaker|thief|phase|void_hunter|night_blade|smuggl|wraith|mirror/],
    ['burrow', /crawler|mite|serpent|digger/],
    ['heal', /priest|oracle|siren|singularity_monk|silent_monk|mountain_monk|^monk$|navigator|bard|lantern_ghost/],
    ['aura', /paladin|command_bot|hive_guard|captain|commander|orbit_guard|shield_drone|herald|black_knight|war_drummer/],
    ['summon', /night_mother|warlock|brood|hive_empress|necro|star_mage|nebula_witch|eclipse_cultist|scarecrow/],
    ['charge', /cavalier|minotaur|berserker|gladiator|viking|chimera|boarder|siege_crew|regolith|night_hound/],
    ['slow', /gorgon|witch|banshee|lunar_wraith|frost|gravity_mage|psi_floater|echo/],
  ];
  const traitCache = {};
  function traitOf(id) {
    if (id in traitCache) return traitCache[id];
    const e = ENEMIES[id];
    let t = null;
    if (e && e.look && 'trait' in e.look) t = e.look.trait;
    else if (e && e.role !== 'boss' && e.role !== 'mutant') {
      for (const [k, re] of TRAIT_WORDS) if (re.test(id)) { t = k; break; }
      if (!t && enemyAttackKind(id) === 'area') t = 'knock';
    }
    traitCache[id] = t;
    return t;
  }

  /** An enemy's: shooters and casters from afar; bosses three at once; heavy hammers and clubs an area. */
  function enemyAttackKind(id) {
    const e = ENEMIES[id];
    if (!e) return 'single';
    if (e.role === 'ranged' || e.role === 'caster') return 'ranged';
    if (e.role === 'boss') return 'area';
    if ((e.role === 'brute' || e.role === 'tank') && ['hammer', 'club', 'pick', 'shovel', 'wrench'].includes(e.look.weapon)) return 'area';
    return 'single';
  }

  /**
   * Evolved forms in battle (Sam, 18 Nov): the same stats as the beast, plus a special, once a
   * battle, set off by tapping its card again while it is on the field (like a Clash Royale
   * champion); up to three evolved forms in a six, and one of each on the field at a time. The
   * special comes from how it moves, its best stat, or else its element. Kept small: a few
   * seconds, or a few light hits' worth.
   */
  const ABILITIES = {
    // A Folded Legend has no evolved form, so no special.
    leap: { name: 'Leap', icon: '🦘', text: 'Jumps onto the nearest enemy ahead, stunning those it lands among.' },
    dash: { name: 'Dash', icon: '💨', text: 'Charges at three times its speed; its first blow is a heavy one.' },
    shield: { name: 'Shield', icon: '🛡', text: 'Takes a fifth of the damage for five seconds.' },
    volley: { name: 'Volley', icon: '🏹', text: 'Hits the five nearest enemies in reach at once.' },
    blast: { name: 'Blast', icon: '🔥', text: 'Burns every enemy close to it.' },
    freeze: { name: 'Freeze', icon: '❄', text: 'Freezes the enemies close to it for two and a half seconds.' },
    gust: { name: 'Gust', icon: '🌪', text: 'Blows the enemies near it back up the field.' },
    quake: { name: 'Quake', icon: '⛰', text: 'Shakes the ground: nearby enemies are hurt and stunned.' },
    heal: { name: 'Heal', icon: '✚', text: 'Heals itself and the beasts near it by two fifths.' },
    gravity: { name: 'Gravity well', icon: '🌀', text: 'Pulls nearby enemies in, hurting and holding them.' },
    starfall: { name: 'Starfall', icon: '☄', text: 'Drops stars on the four nearest enemies.' },
    rally: { name: 'War cry', icon: '📯', text: 'Nearby beasts hit half as hard again for five seconds.' },
    // 1.5: a limited beast's (limited.js).
    blizzard: { name: 'Blizzard', icon: '🌨', text: 'A storm of snow round it: the enemies near it are hurt and frozen for three seconds.' },
    // 1.5: the comet beasts' specials, from Tier 10 (comet.js says which has which).
    stagger: { name: 'Stagger', icon: '💫', text: 'A huge blow that knocks even a giant back up the field and stops the move it was winding up.' },
    anchor: { name: 'Anchor', icon: '⚓', text: 'Holds a boss for six seconds, slowed, so that it cannot start a big attack.' },
    dispel: { name: 'Dispel', icon: '✨', text: 'Cancels an attack a boss is winding up, and strips the shields and war cries from enemies near it.' },
    ward: { name: 'Ward', icon: '🔰', text: 'Shields the beasts around it: the next big blow on each, within ten seconds, does a tenth of its damage.' },
    sunder: { name: 'Sunder', icon: '🗡', text: 'For ten seconds its blows go straight through armour, shields and resistances, and the first is heavy.' },
  };
  function abilityOf(id) {
    const t = T(id);
    if (!t) return null;
    if (t.limited) return t.ability || null;
    // (1.5: a comet beast has its own special from Tier 10, and none before.)
    if (t.comet) return t.tier >= 10 && typeof COMET !== 'undefined' ? COMET.BY_ID[t.comet.species].special : null;
    const s = beastStats(id, 0);
    const top = ['atk', 'hp', 'spd', 'rng'].sort((a, c) => s[c] - s[a])[0];
    // Hunters built to pounce (foxes, cats, wolves, lions, dinosaurs) leap.
    if (['fox', 'cat', 'wolf', 'lion', 'dino'].includes((t.svgParams || {}).body)) return 'leap';
    if (top === 'spd') return 'dash';
    if (top === 'hp') return 'shield';
    if (top === 'rng') return 'volley';
    return { FIRE: 'blast', WATER: 'freeze', WIND: 'gust', EARTH: 'quake', LIGHT: 'heal', VOID: 'gravity', COSMIC: 'starfall', DEITY: 'rally' }[t.element] || 'blast';
  }
  /**
   * How big a beast stands in the arena (radius, in arena units), by tier: its body as drawn, so
   * nothing stands inside anything else (collisions in battle_engine.js). A Tier 1 is 26 across
   * the middle, a Tier 20 about 60 (a Tier 1 was 20 and hard to see: Sam, 17 Nov).
   */
  // (1.5: comet beasts are half as big again as any other beast of their tier, Sam 24 Nov.)
  const beastRadius = (id) => { const t = T(id) || { tier: 1 }, r = Math.min(60, 26 + 1.8 * (t.tier - 1)); return t.comet ? Math.round(r * 1.5) : r; };

  // ------------------------------------------------------------------ enemies
  /**
   * How an enemy's points are shared, by its part in a fight. `points` scales the level's points
   * for it, `hp` its hit points; `multi` is how many it hits at once.
   */
  const ROLES = {
    grunt: { order: ['atk', 'hp', 'spd', 'rng'], split: [0.3, 0.3, 0.25, 0.15], points: 1 },
    tank: { order: ['hp', 'atk', 'spd', 'rng'], split: [0.62, 0.25, 0.08, 0.05], points: 1.15, floor: { hp: 3 } },
    runner: { order: ['spd', 'atk', 'hp', 'rng'], split: [0.5, 0.28, 0.17, 0.05], points: 0.9, floor: { spd: 3 } },
    ranged: { order: ['rng', 'atk', 'hp', 'spd'], split: [0.42, 0.33, 0.15, 0.1], points: 0.95, floor: { rng: 3 } },
    caster: { order: ['rng', 'atk', 'spd', 'hp'], split: [0.45, 0.4, 0.1, 0.05], points: 0.95, floor: { rng: 3 } },
    brute: { order: ['atk', 'hp', 'spd', 'rng'], split: [0.52, 0.33, 0.1, 0.05], points: 1.1, floor: { atk: 3 } },
    swarm: { order: ['spd', 'atk', 'hp', 'rng'], split: [0.4, 0.3, 0.2, 0.1], points: 0.5, floor: { spd: 2 } },
    boss: { order: ['hp', 'atk', 'rng', 'spd'], split: [0.42, 0.36, 0.14, 0.08], points: 1.7, hp: 4, multi: 3 },
    // 1.5: World 7's giants (mutants.js sets their speed and reach; these are their health and blows).
    mutant: { order: ['hp', 'atk', 'rng', 'spd'], split: [0.55, 0.37, 0.05, 0.03], points: 1.5, hp: 7.5, multi: 2 },
  };

  // Looks: plan (body plan), size, colours, head, hat, weapon and extras: enemies.js draws them.
  // Shadow folk are black with glowing eyes and a faint rim.
  const SH = (rim, eye, x) => Object.assign({ skin: '#100d18', cloth: '#16121f', trim: rim, eye, shadow: true }, x);
  const E = [];
  function foe(world, debut, id, name, role, look, note) { E.push({ id, name, world, debut, role, look, note }); }

  // World 1: the Shadow Wilds.
  foe(1, 1, 'shade_peasant', 'Shade Peasant', 'grunt', SH('#4a3d6b', '#ffe066', { plan: 'biped', size: 0.85, hat: 'straw', weapon: 'pitchfork' }), 'A farmhand made of dusk. It wanders out of the trees with a pitchfork, not sure what it is angry about.');
  foe(1, 2, 'shade_wisp', 'Wisp', 'swarm', SH('#6b5cff', '#bff4ff', { plan: 'float', size: 0.75, body: 'orb' }), 'A little puff of shadow. They float about in gangs and nibble.');
  foe(1, 3, 'shade_thief', 'Shade Thief', 'runner', SH('#3f5a7a', '#9df7ff', { plan: 'biped', size: 0.8, head: 'hood', weapon: 'dagger' }), 'It does not want a fight. It wants your coins, and it will run straight past your beasts to get them.');
  foe(1, 4, 'shade_imp', 'Imp', 'swarm', SH('#7a2a3a', '#ff7a5c', { plan: 'biped', size: 0.55, hat: 'horns', tail: true, weapon: 'claws' }), 'A small horned pest that bites ankles. They come in threes.');
  foe(1, 5, 'shade_archer', 'Dusk Archer', 'ranged', SH('#3d5b3a', '#c6ff7a', { plan: 'biped', size: 0.85, head: 'hood', weapon: 'bow' }), 'Shoots arrows of hardened night from behind its friends.');
  foe(1, 6, 'shade_brute', 'Shadow Brute', 'brute', SH('#5a2f2f', '#ff9a3c', { plan: 'biped', size: 1.25, build: 'heavy', weapon: 'club' }), 'A big lump of shadow with a club. It is not clever, but it does not need to be.');
  foe(1, 7, 'night_hound', 'Night Hound', 'runner', SH('#3b2f5c', '#ff4d6d', { plan: 'quad', size: 0.9, spikes: true }), 'A long, lean shape that runs on all fours and never blinks.');
  foe(1, 8, 'shade_guard', 'Shade Guard', 'tank', SH('#3a4a5c', '#ffd6a0', { plan: 'biped', size: 1, head: 'helm', weapon: 'spear', shield: 'tower' }), 'Hides behind a tall shield of solid gloom and pokes over the top.');
  foe(1, 9, 'shade_bats', 'Bat Swarm', 'swarm', SH('#4b2e5c', '#ff6be0', { plan: 'float', size: 0.75, body: 'bat' }), 'A cloud of tiny shadow bats that moves as one and squeaks like a hinge.');
  foe(1, 10, 'hollow_giant', 'Hollow Giant', 'boss', SH('#5c4a2f', '#ffb347', { plan: 'biped', size: 2.3, build: 'heavy', weapon: 'hammer', hat: 'horns', cape: '#1a1420', hollow: true, boss: true }), 'A huge empty giant. Shout into its chest and it shouts back. Its swing clears a whole lane.');
  foe(1, 11, 'moon_witch', 'Moon Witch', 'caster', SH('#4a3a7a', '#d6b8ff', { plan: 'biped', size: 0.9, hat: 'wizard', weapon: 'staff', cape: '#1d1630' }), 'Hums to the moon and throws pale bolts from the back line.');
  foe(1, 12, 'shade_crawler', 'Crawler', 'runner', SH('#2f4a4a', '#7affd4', { plan: 'crawler', size: 0.85 }), 'It has far too many legs and uses all of them to run at your coins.');
  foe(1, 13, 'black_knight', 'Black Knight', 'tank', SH('#3c3c4a', '#ff5c5c', { plan: 'biped', size: 1.1, head: 'helm', weapon: 'sword', shield: 'round', armor: true }), 'An empty suit of armour that still thinks it is on guard duty.');
  foe(1, 14, 'lantern_ghost', 'Lantern Ghost', 'caster', SH('#5a4a2a', '#ffe9a0', { plan: 'float', size: 0.85, body: 'sheet', weapon: 'lantern' }), 'A ghost with a lantern. The light is cold, and it stings.');
  foe(1, 15, 'scarecrow', 'Scarecrow', 'grunt', SH('#4d3d2a', '#ffcf5c', { plan: 'biped', size: 1, hat: 'straw', weapon: 'none', thin: true }), 'Stuffed with shadows instead of straw. It flails its arms about until something stops it.');
  foe(1, 16, 'night_blade', 'Night Blade', 'runner', SH('#2f3f5c', '#5cf2ff', { plan: 'biped', size: 0.85, head: 'hood', weapon: 'dual' }), 'It carries two knives and is always in a hurry. It can reach your pile before you notice.');
  foe(1, 17, 'war_drummer', 'War Drummer', 'grunt', SH('#5c2f4a', '#ff8ad8', { plan: 'biped', size: 1, weapon: 'drum' }), 'Beats a drum made of night. The rest of them march to it.');
  foe(1, 18, 'wraith', 'Wraith', 'brute', SH('#3a2f5c', '#b48aff', { plan: 'float', size: 1.15, body: 'cloak', weapon: 'scythe' }), 'A floating cloak with a scythe and nobody inside it. It hits hard.');
  foe(1, 19, 'pike_shade', 'Pike Shade', 'ranged', SH('#3a4a3a', '#d4ff8a', { plan: 'biped', size: 1, head: 'helm', weapon: 'pike' }), 'Holds a pike so long it fights from two beasts away.');
  foe(1, 20, 'night_mother', 'Night Mother', 'boss', SH('#4a2a6b', '#e08aff', { plan: 'float', size: 2.1, body: 'cloak', hat: 'wizard', weapon: 'staff', boss: true }), 'The witch who sings the shadows awake. Her bolts hit three beasts at once.');
  foe(1, 21, 'puppet', 'Puppet', 'swarm', SH('#5c4a3a', '#ffd28a', { plan: 'biped', size: 0.65, strings: true, weapon: 'none' }), 'Hangs from strings that go up into the dark. Nobody has seen who holds them.');
  foe(1, 22, 'shade_ogre', 'Shade Ogre', 'brute', SH('#4a3a2a', '#ffa05c', { plan: 'biped', size: 1.5, build: 'heavy', weapon: 'hammer' }), 'A big, slow shadow ogre that is very hard to push back.');
  foe(1, 23, 'shade_serpent', 'Shade Serpent', 'runner', SH('#2a4a3a', '#8aff8a', { plan: 'serpent', size: 1 }), 'Pours over the ground like spilled ink and bites with a hiss.');
  foe(1, 24, 'silent_monk', 'Silent Monk', 'grunt', SH('#4a4a3a', '#fff0b0', { plan: 'biped', size: 0.95, head: 'bald', weapon: 'staff' }), 'A monk who never says a word and never misses with his staff.');
  foe(1, 25, 'long_shadow', 'Long Shadow', 'ranged', SH('#2f2f4a', '#ff7a7a', { plan: 'biped', size: 0.95, head: 'hood', weapon: 'crossbow' }), 'A shadow sniper that hangs back and fires bolts from a long way off.');
  foe(1, 26, 'gloom_hulk', 'Gloom Hulk', 'tank', SH('#3a3a3a', '#ffd04a', { plan: 'biped', size: 1.55, build: 'heavy', weapon: 'claws' }), 'A wall of darkness on two stumpy legs. Takes forever to wear down.');
  foe(1, 27, 'banshee', 'Banshee', 'caster', SH('#4a3a5c', '#aef0ff', { plan: 'float', size: 0.95, body: 'sheet', hair: true }), 'Screams, and the scream hurts. Keep her away from your front line.');
  foe(1, 28, 'grave_digger', 'Grave Digger', 'brute', SH('#3a3a2a', '#e0ff8a', { plan: 'biped', size: 1.05, hat: 'cap', weapon: 'shovel' }), 'Digs at night and fights with the same shovel.');
  foe(1, 29, 'stalker', 'Stalker', 'runner', SH('#2a2a4a', '#ff4dff', { plan: 'quad', size: 1.1, long: true }), 'Its legs are very long. By the time you have seen it, it is past your beasts.');
  foe(1, 30, 'eclipse_wyrm', 'Eclipse Wyrm', 'boss', SH('#4a2a2a', '#ff6a3c', { plan: 'serpent', size: 2.2, horns: true, boss: true }), 'A serpent as long as the whole field, black as the moon in an eclipse.');
  foe(1, 31, 'twin_shade', 'Twin Shade', 'grunt', SH('#3a4a5c', '#8ac8ff', { plan: 'biped', size: 0.9, twin: true, weapon: 'sword' }), 'Two shadows sharing one body and arguing about where to go.');
  foe(1, 32, 'grim_jester', 'Grim Jester', 'runner', SH('#5c2f5c', '#ffef5c', { plan: 'biped', size: 0.85, hat: 'jester', weapon: 'dagger' }), 'Cartwheels into fights and laughs without a sound.');
  foe(1, 33, 'warlock', 'Warlock', 'caster', SH('#5c2a2a', '#ff5c8a', { plan: 'biped', size: 1, hat: 'horns', weapon: 'staff', cape: '#2a1018' }), 'Bargained with the dark and got bolts of it in return.');
  foe(1, 34, 'juggernaut', 'Juggernaut', 'tank', SH('#3c3c4c', '#ffffff', { plan: 'biped', size: 1.45, head: 'helm', armor: true, weapon: 'hammer', shield: 'tower' }), 'It wears so much armour it can barely bend. Bring your hardest hitters.');
  foe(1, 35, 'mirror_shade', 'Mirror Shade', 'grunt', SH('#5c5c7a', '#e0e0ff', { plan: 'biped', size: 0.95, head: 'mask', weapon: 'sword' }), 'Wears a blank mask that shows whatever looks at it.');
  foe(1, 36, 'moth_cloud', 'Moth Cloud', 'swarm', SH('#5c4a2a', '#fff2a8', { plan: 'float', size: 0.75, body: 'moth' }), 'Shadow moths drawn to the shine of your coins.');
  foe(1, 37, 'executioner', 'Executioner', 'brute', SH('#4a1f1f', '#ff3c3c', { plan: 'biped', size: 1.3, head: 'hood', weapon: 'axe' }), 'A hooded figure with a huge axe. Its heavy swing is the one to fear.');
  foe(1, 38, 'oracle', 'Oracle', 'caster', SH('#2f4a5c', '#5cffc8', { plan: 'float', size: 0.9, body: 'eye' }), 'One great eye that sees everything and fires at all of it.');
  foe(1, 39, 'shadow_captain', 'Shadow Captain', 'tank', SH('#3a3a5c', '#ffd700', { plan: 'biped', size: 1.2, head: 'helm', weapon: 'sword', shield: 'round', cape: '#2a1f4a', armor: true }), 'Leads the shade army from the front, cape snapping behind.');
  foe(1, 40, 'shade_king', 'The Shade King', 'boss', SH('#5c4a1f', '#ffd700', { plan: 'biped', size: 2.4, hat: 'crown', weapon: 'sword', cape: '#2a1f4a', armor: true, boss: true }), 'The ruler of the Shadow Wilds. Beat him and the sun comes up.');

  // World 2: the Iron Kingdom. People of many kinds, and creatures out of the old stories.
  const P = (skin, cloth, trim, eye, x) => Object.assign({ skin, cloth, trim, eye }, x);
  foe(2, 1, 'farmer', 'Angry Farmer', 'grunt', P('#f0c39a', '#7a9a4a', '#5a3a1a', '#2a1a10', { plan: 'biped', size: 0.95, hat: 'straw', weapon: 'pitchfork' }), 'Someone told him beasts eat crops. He has a pitchfork and he is not listening.');
  foe(2, 2, 'goblin', 'Goblin', 'swarm', P('#7ac24a', '#6a4a2a', '#3a2a1a', '#ffe066', { plan: 'biped', size: 0.6, ears: true, weapon: 'dagger' }), 'Goblins love coins the way moths love lamps, and they come in gangs.');
  foe(2, 3, 'militia', 'Militia', 'grunt', P('#e8b48a', '#a83a3a', '#5a5a6a', '#2a1a10', { plan: 'biped', size: 1, hat: 'cap', weapon: 'spear' }), 'A villager with a spear and a borrowed helmet.');
  foe(2, 4, 'archer', 'Archer', 'ranged', P('#f0c39a', '#3a7a3a', '#2a4a1a', '#2a1a10', { plan: 'biped', size: 0.95, head: 'hood', weapon: 'bow' }), 'Trained at the castle butts. Stays well back and keeps loosing.');
  foe(2, 5, 'dwarf_miner', 'Dwarf Miner', 'tank', P('#e8a87a', '#6a5a4a', '#8a6a2a', '#2a1a10', { plan: 'biped', size: 0.75, build: 'heavy', beard: '#c46a2a', hat: 'helmet', weapon: 'pick' }), 'Short, wide and very hard to knock over.');
  foe(2, 6, 'orc', 'Orc Grunt', 'brute', P('#6a9a4a', '#5a3a2a', '#3a3a3a', '#ff3c2a', { plan: 'biped', size: 1.15, build: 'heavy', tusks: true, weapon: 'axe' }), 'An orc with an axe and a very simple plan.');
  foe(2, 7, 'knight', 'Knight', 'tank', P('#f0c39a', '#b8c0cc', '#2a4a9a', '#2a1a10', { plan: 'biped', size: 1.05, head: 'helm', armor: true, weapon: 'sword', shield: 'round' }), 'Polished plate and a shield with the king\'s colours.');
  foe(2, 8, 'crossbowman', 'Crossbowman', 'ranged', P('#e8b48a', '#4a5a7a', '#8a8a9a', '#2a1a10', { plan: 'biped', size: 0.95, hat: 'cap', weapon: 'crossbow' }), 'Slower than an archer, but every bolt hits harder and flies further.');
  foe(2, 9, 'harpy', 'Harpy', 'runner', P('#e8c09a', '#8a5a9a', '#5a3a6a', '#ffcc00', { plan: 'float', size: 0.9, body: 'harpy', wings: 'feather' }), 'A bird with a woman\'s face and a terrible scream. It swoops straight for your coins.');
  foe(2, 10, 'cyclops_warlord', 'Cyclops Warlord', 'boss', P('#c8a07a', '#6a4a3a', '#aa3a2a', '#ffffff', { plan: 'biped', size: 2.3, build: 'heavy', eyes: 1, weapon: 'club', boss: true }), 'A one-eyed giant with a club and a temper. Its swing hits three beasts at once.');
  foe(2, 11, 'mage', 'Court Mage', 'caster', P('#f0c39a', '#3a4aaa', '#ffd700', '#2a1a10', { plan: 'biped', size: 0.95, hat: 'wizard', weapon: 'staff', beard: '#dddddd' }), 'Throws fizzing blue bolts and complains about the pay.');
  foe(2, 12, 'satyr', 'Satyr', 'runner', P('#d8a07a', '#7a5a3a', '#4a3a2a', '#2a1a10', { plan: 'biped', size: 0.9, hat: 'horns', legs: 'hooves', weapon: 'flute' }), 'Goat-legged and quick. Plays a tune while it runs at you.');
  foe(2, 13, 'pikeman', 'Pikeman', 'ranged', P('#e8b48a', '#8a3a3a', '#8a8a9a', '#2a1a10', { plan: 'biped', size: 1, head: 'helm', weapon: 'pike' }), 'A pike long enough to poke beasts from behind his friends.');
  foe(2, 14, 'troll', 'Troll', 'tank', P('#7a8a6a', '#5a4a3a', '#3a3a2a', '#ffcc33', { plan: 'biped', size: 1.45, build: 'heavy', ears: true, weapon: 'club' }), 'Lives under bridges and hits like one. Shrugs off small hits.');
  foe(2, 15, 'elf_ranger', 'Elf Ranger', 'ranged', P('#f4d8b8', '#2a6a4a', '#d4c06a', '#3a7a3a', { plan: 'biped', size: 1, ears: true, head: 'hood', weapon: 'longbow' }), 'Can hit a coin at the far end of the field. Usually does.');
  foe(2, 16, 'gladiator', 'Gladiator', 'brute', P('#d8a07a', '#aa3a2a', '#c8a03a', '#2a1a10', { plan: 'biped', size: 1.05, head: 'helm', weapon: 'trident' }), 'Fights for a crowd that is not there.');
  foe(2, 17, 'centaur', 'Centaur', 'ranged', P('#e0b08a', '#7a5a3a', '#3a2a1a', '#2a1a10', { plan: 'centaur', size: 1.2, weapon: 'bow' }), 'Half horse, half archer. Shoots on the move and runs faster than most.');
  foe(2, 18, 'viking', 'Raider', 'brute', P('#f0c39a', '#5a6a8a', '#8a8a9a', '#2a1a10', { plan: 'biped', size: 1.1, hat: 'viking', beard: '#e8b030', weapon: 'axe', shield: 'round' }), 'Came over the sea for gold and found beasts guarding it.');
  foe(2, 19, 'pirate', 'Pirate', 'grunt', P('#d8a07a', '#2a2a3a', '#c8a03a', '#2a1a10', { plan: 'biped', size: 1, hat: 'pirate', patch: true, weapon: 'cutlass' }), 'Smells your coins from a mile away. Arr.');
  foe(2, 20, 'minotaur_lord', 'Minotaur Lord', 'boss', P('#8a5a3a', '#5a3a2a', '#c8a03a', '#ff3c2a', { plan: 'biped', size: 2.3, build: 'heavy', hat: 'horns', legs: 'hooves', weapon: 'axe', boss: true }), 'The lord of the maze. It charges in and swings, then swings again, hitting three at a time.');
  foe(2, 21, 'ninja', 'Ninja', 'runner', P('#e8b48a', '#1a1a2a', '#aa2a2a', '#2a1a10', { plan: 'biped', size: 0.9, head: 'mask', weapon: 'katana' }), 'You see it at the top of the field, then at your coins.');
  foe(2, 22, 'samurai', 'Samurai', 'brute', P('#e8b48a', '#aa2a2a', '#2a2a2a', '#2a1a10', { plan: 'biped', size: 1.05, head: 'helm', armor: true, weapon: 'katana' }), 'One perfect cut, every five seconds. Mind the heavy one.');
  foe(2, 23, 'monk', 'Mountain Monk', 'grunt', P('#d8a07a', '#e88a2a', '#aa5a1a', '#2a1a10', { plan: 'biped', size: 0.95, head: 'bald', weapon: 'staff' }), 'Has trained his whole life for this. Mostly for this.');
  foe(2, 24, 'priest', 'Sun Priest', 'caster', P('#f0c39a', '#f4f0e0', '#ffd700', '#2a1a10', { plan: 'biped', size: 0.95, hat: 'mitre', weapon: 'staff' }), 'Calls down light that burns. Very calm about it.');
  foe(2, 25, 'ogre', 'Ogre', 'brute', P('#b8a06a', '#6a4a2a', '#4a3a2a', '#2a1a10', { plan: 'biped', size: 1.5, build: 'heavy', weapon: 'club' }), 'Big, hungry and swinging a tree trunk.');
  foe(2, 26, 'gorgon', 'Gorgon', 'caster', P('#8ab87a', '#5a7a4a', '#c8a03a', '#ffee00', { plan: 'biped', size: 1, hair: 'snakes', weapon: 'bow' }), 'Snakes for hair and a stare that hurts. Do not look at it for long.');
  foe(2, 27, 'bard', 'Bard', 'caster', P('#f0c39a', '#aa3a8a', '#ffd700', '#2a1a10', { plan: 'biped', size: 0.9, hat: 'feather', weapon: 'lute' }), 'His songs are so bad they do real damage.');
  foe(2, 28, 'cavalier', 'Cavalier', 'runner', P('#f0c39a', '#b8c0cc', '#2a4a9a', '#2a1a10', { plan: 'centaur', size: 1.25, rider: true, head: 'helm', weapon: 'lance' }), 'A knight on a charger, lance down, coming fast.');
  foe(2, 29, 'alchemist', 'Alchemist', 'ranged', P('#f0c39a', '#5a3a7a', '#7aff5a', '#2a1a10', { plan: 'biped', size: 0.9, goggles: true, weapon: 'potion' }), 'Throws bottles that go bang. Some of them on purpose.');
  foe(2, 30, 'gorgon_queen', 'Gorgon Queen', 'boss', P('#7ab86a', '#3a5a3a', '#ffd700', '#ffee00', { plan: 'serpent', size: 2.2, torso: true, hair: 'snakes', hat: 'crown', boss: true }), 'A queen with a serpent\'s tail and a stare that hits three beasts at once.');
  foe(2, 31, 'berserker', 'Berserker', 'brute', P('#e8a07a', '#6a3a2a', '#aa2a2a', '#ff2a2a', { plan: 'biped', size: 1.15, beard: '#aa4a1a', weapon: 'dual_axe' }), 'Stopped feeling pain years ago. Stopped thinking too.');
  foe(2, 32, 'paladin', 'Paladin', 'tank', P('#f0c39a', '#f0f0f8', '#ffd700', '#2a1a10', { plan: 'biped', size: 1.1, head: 'helm', armor: true, weapon: 'hammer', shield: 'tower' }), 'Shining armour, a holy hammer, and a shield you cannot get round.');
  foe(2, 33, 'wizard', 'Grand Wizard', 'caster', P('#f0c39a', '#5a2a9a', '#ffd700', '#2a1a10', { plan: 'biped', size: 1, hat: 'wizard', beard: '#ffffff', weapon: 'orb_staff' }), 'An old wizard, very powerful and very cross that there are beasts in his kingdom.');
  foe(2, 34, 'hill_giant', 'Hill Giant', 'tank', P('#c89a7a', '#7a6a4a', '#4a3a2a', '#2a1a10', { plan: 'biped', size: 1.75, build: 'heavy', beard: '#6a4a2a', weapon: 'club' }), 'A giant from the hills, as tough as one.');
  foe(2, 35, 'chimera', 'Chimera', 'brute', P('#c88a3a', '#aa6a2a', '#5a3a1a', '#ff3c2a', { plan: 'quad', size: 1.35, mane: true, tail: true, horns: true }), 'Lion, goat and snake in one bad mood.');
  foe(2, 36, 'stone_troll', 'Stone Troll', 'tank', P('#8a8a8a', '#5a5a5a', '#3a3a3a', '#ff9a2a', { plan: 'biped', size: 1.55, build: 'heavy', spikes: true, weapon: 'claws' }), 'A troll that turned to stone and kept walking.');
  foe(2, 37, 'royal_guard', 'Royal Guard', 'grunt', P('#f0c39a', '#aa2a3a', '#ffd700', '#2a1a10', { plan: 'biped', size: 1.05, hat: 'bearskin', weapon: 'halberd' }), 'Guards the king\'s treasury. Takes it personally.');
  foe(2, 38, 'siege_crew', 'Battering Crew', 'tank', P('#e8b48a', '#6a5a4a', '#8a6a2a', '#2a1a10', { plan: 'ram', size: 1.6 }), 'Four soldiers and a log, headed for your coin pile.');
  foe(2, 39, 'arch_mage', 'Arch Mage', 'caster', P('#f0c39a', '#1a2a6a', '#5cf0ff', '#5cf0ff', { plan: 'float', size: 1.05, body: 'robe', hat: 'wizard', weapon: 'orb_staff' }), 'Floats above the ground because walking is beneath him.');
  foe(2, 40, 'iron_king', 'The Iron King', 'boss', P('#f0c39a', '#5a5a6a', '#ffd700', '#2a1a10', { plan: 'biped', size: 2.4, head: 'helm', hat: 'crown', armor: true, weapon: 'sword', shield: 'tower', cape: '#aa2a3a', boss: true }), 'The king of iron and gold, who wants every coin in the land.');

  // World 3: the Star Invasion. Visitors from far off, and their machines.
  const A = (skin, cloth, trim, eye, x) => Object.assign({ skin, cloth, trim, eye }, x);
  foe(3, 1, 'grey', 'Grey', 'grunt', A('#b8c0c8', '#5a6a7a', '#3a4a5a', '#101018', { plan: 'biped', size: 0.85, head: 'alien', weapon: 'raygun' }), 'Big head, big black eyes, small ray gun. The classic.');
  foe(3, 2, 'scout_drone', 'Scout Drone', 'swarm', A('#8a9aaa', '#5a6a7a', '#ff3c3c', '#ff3c3c', { plan: 'float', size: 0.75, body: 'drone' }), 'A flying camera with a tiny zapper on the front.');
  foe(3, 3, 'goo_trooper', 'Goo Trooper', 'grunt', A('#7aff6a', '#3a5a8a', '#c8d0d8', '#103010', { plan: 'blob', size: 0.9, helmet: true }), 'A blob of green goo in a space suit. It squelches when it walks.');
  foe(3, 4, 'bug_drone', 'Bug Drone', 'swarm', A('#5a8a3a', '#3a5a2a', '#c8ff3a', '#ff3a3a', { plan: 'float', size: 0.75, body: 'bug', wings: 'bug' }), 'Buzzes in swarms from the hive ships.');
  foe(3, 5, 'laser_trooper', 'Laser Trooper', 'ranged', A('#c8d0d8', '#e8e8f0', '#3a7aff', '#3a7aff', { plan: 'biped', size: 1, head: 'visor', armor: true, weapon: 'rifle' }), 'White armour, black visor, red lasers. Terrible aim, lots of shots.');
  foe(3, 6, 'mite', 'Crawler Mite', 'runner', A('#aa5a3a', '#7a3a2a', '#ffa03a', '#ffee00', { plan: 'crawler', size: 0.75 }), 'A six-legged alien tick that runs at anything shiny.');
  foe(3, 7, 'big_brain', 'Big Brain', 'caster', A('#ff9ac8', '#7a4a9a', '#ff5ca8', '#ffffff', { plan: 'float', size: 0.9, body: 'brain' }), 'All brain, no body. Fires thoughts that hurt.');
  foe(3, 8, 'robot', 'Robot Soldier', 'tank', A('#9aa0aa', '#6a707a', '#ffcc33', '#5cf0ff', { plan: 'biped', size: 1.05, head: 'robot', armor: true, weapon: 'claws' }), 'Bolted together on the mothership. Tough and dented.');
  foe(3, 9, 'jet_trooper', 'Jet Trooper', 'runner', A('#c8d0d8', '#3a5a9a', '#ff7a2a', '#5cf0ff', { plan: 'biped', size: 0.95, head: 'visor', jetpack: true, weapon: 'raygun' }), 'Flies low and fast on a smoking jetpack.');
  foe(3, 10, 'tripod_titan', 'Tripod Titan', 'boss', A('#8a9aaa', '#4a5a6a', '#ff3c3c', '#ff3c3c', { plan: 'tripod', size: 2.4, boss: true }), 'A war machine on three long legs. Its beam hits three beasts at once.');
  foe(3, 11, 'mantis', 'Mantis Warrior', 'brute', A('#7ac83a', '#4a8a2a', '#c8ff5a', '#ff3a3a', { plan: 'biped', size: 1.1, head: 'mantis', weapon: 'blades', thin: true }), 'Blade arms and a head that turns all the way round.');
  foe(3, 12, 'eyestalk', 'Eyestalk', 'caster', A('#c86aff', '#7a3aaa', '#ff9aff', '#ffffff', { plan: 'blob', size: 0.95, eyes: 3, stalks: true }), 'Three eyes on stalks, each firing its own beam.');
  foe(3, 13, 'cyborg', 'Cyborg', 'grunt', A('#e0b090', '#4a4a5a', '#ff3c3c', '#ff3c3c', { plan: 'biped', size: 1, head: 'cyborg', armor: true, weapon: 'raygun' }), 'Part alien and part machine, with no sense of humour at all.');
  foe(3, 14, 'plasma_sniper', 'Plasma Sniper', 'ranged', A('#8ac8ff', '#2a3a5a', '#5cf0ff', '#ffffff', { plan: 'biped', size: 0.95, head: 'alien', weapon: 'long_rifle' }), 'Lies at the back and hits from across the field.');
  foe(3, 15, 'hover_tank', 'Hover Tank', 'tank', A('#7a8a6a', '#5a6a4a', '#ffcc33', '#ff3c3c', { plan: 'float', size: 1.35, body: 'tank' }), 'A tank with no wheels, just a hum. Very hard to dent.');
  foe(3, 16, 'tentacle', 'Tentacle Thing', 'brute', A('#aa5aaa', '#7a3a7a', '#ff7aff', '#ffee00', { plan: 'blob', size: 1.2, tentacles: true }), 'Mostly tentacles. Each one wants to hit something.');
  foe(3, 17, 'crystal_alien', 'Crystal Walker', 'tank', A('#7ae0ff', '#3aa0d0', '#e0ffff', '#ffffff', { plan: 'biped', size: 1.15, head: 'crystal', crystal: true, weapon: 'claws' }), 'Made of living crystal. Hits glance off it.');
  foe(3, 18, 'nano_mites', 'Mite Cloud', 'swarm', A('#c8c8c8', '#8a8a8a', '#5cf0ff', '#5cf0ff', { plan: 'float', size: 0.75, body: 'swarm' }), 'A cloud of tiny machines that eat metal and coins.');
  foe(3, 19, 'shield_drone', 'Shield Drone', 'tank', A('#8a9aaa', '#5a6a7a', '#5cf0ff', '#5cf0ff', { plan: 'float', size: 0.95, body: 'drone', shield: 'energy' }), 'Hides behind a shimmering shield of light.');
  foe(3, 20, 'brood_mother', 'Brood Mother', 'boss', A('#8aaa3a', '#5a7a2a', '#ffee00', '#ff3a3a', { plan: 'crawler', size: 2.2, boss: true }), 'The bug queen\'s queen. Her jaws snap at three beasts at once.');
  foe(3, 21, 'mech_walker', 'Mech Walker', 'brute', A('#aa8a5a', '#6a5a3a', '#ff7a2a', '#ffcc33', { plan: 'tripod', size: 1.3 }), 'A small walking cannon. Small for a walking cannon.');
  foe(3, 22, 'psi_floater', 'Psi Floater', 'caster', A('#c8b0ff', '#6a4aaa', '#ff9aff', '#ffffff', { plan: 'float', size: 0.85, body: 'robe', head: 'alien' }), 'Floats on the power of its own mind and throws headaches.');
  foe(3, 23, 'acid_spitter', 'Acid Spitter', 'ranged', A('#aaee3a', '#5a8a2a', '#eeff3a', '#ff3a3a', { plan: 'crawler', size: 0.95, sac: true }), 'Spits green acid from a long way off. Smells awful.');
  foe(3, 24, 'war_robot', 'War Robot', 'brute', A('#7a7a8a', '#4a4a5a', '#ff3c3c', '#ff3c3c', { plan: 'biped', size: 1.35, build: 'heavy', head: 'robot', armor: true, weapon: 'hammer' }), 'Built for one thing, and that thing is hitting.');
  foe(3, 25, 'saucer', 'Mini Saucer', 'ranged', A('#c8d0d8', '#8a9aaa', '#7aff5a', '#7aff5a', { plan: 'float', size: 1, body: 'saucer' }), 'A small flying saucer with a big tractor beam.');
  foe(3, 26, 'hive_guard', 'Hive Guard', 'tank', A('#6a8a3a', '#4a6a2a', '#eeff3a', '#ff3a3a', { plan: 'biped', size: 1.2, head: 'bug', armor: true, weapon: 'spear', shield: 'round' }), 'An armoured bug standing on two legs and guarding the hive.');
  foe(3, 27, 'phase_stalker', 'Phase Stalker', 'runner', A('#5a5aaa', '#3a3a7a', '#aa7aff', '#ff7aff', { plan: 'quad', size: 1, long: true, glitch: true }), 'Flickers in and out of this world. Hard to pin down.');
  foe(3, 28, 'gravity_mage', 'Gravity Mage', 'caster', A('#b8c0c8', '#2a2a4a', '#aa7aff', '#aa7aff', { plan: 'biped', size: 0.95, head: 'alien', hat: 'halo_ring', weapon: 'orb_staff' }), 'Bends the ground under your beasts. It hurts.');
  foe(3, 29, 'nano_swarm', 'Nano Swarm', 'swarm', A('#5cf0ff', '#3a8aaa', '#ffffff', '#ffffff', { plan: 'float', size: 0.75, body: 'swarm' }), 'A smarter, faster cloud of machines.');
  foe(3, 30, 'hive_empress', 'Hive Empress', 'boss', A('#aacc3a', '#6a8a2a', '#ffd700', '#ff3a3a', { plan: 'biped', size: 2.3, head: 'bug', hat: 'crown', wings: 'bug', weapon: 'blades', boss: true }), 'The empress of the swarm, with wings and blades for arms.');
  foe(3, 31, 'star_knight', 'Star Knight', 'tank', A('#c8d0d8', '#e0e8f0', '#ffd700', '#5cf0ff', { plan: 'biped', size: 1.15, head: 'visor', armor: true, weapon: 'laser_sword', shield: 'energy' }), 'A knight from another star, with a sword of light.');
  foe(3, 32, 'void_hunter', 'Void Hunter', 'runner', A('#3a3a5a', '#1a1a2a', '#ff3cff', '#ff3cff', { plan: 'biped', size: 1, head: 'alien', weapon: 'blades', cape: '#2a0a3a' }), 'Hunts across the stars for the rarest beasts. That means yours.');
  foe(3, 33, 'siege_mech', 'Siege Mech', 'tank', A('#8a7a6a', '#5a4a3a', '#ff7a2a', '#ffcc33', { plan: 'tripod', size: 1.7 }), 'Slow and enormous, and it never stops shooting.');
  foe(3, 34, 'plasma_brute', 'Plasma Brute', 'brute', A('#ff7a5a', '#aa3a2a', '#ffee5a', '#ffffff', { plan: 'biped', size: 1.4, build: 'heavy', head: 'alien', weapon: 'claws', glow: true }), 'Glows red hot and punches harder than it glows.');
  foe(3, 35, 'cloaker', 'Cloaker', 'runner', A('#8a9aaa', '#2a2a3a', '#5cf0ff', '#5cf0ff', { plan: 'biped', size: 0.9, head: 'visor', weapon: 'dagger', glitch: true }), 'Wears a cloak that bends light. You see the shimmer, then the knife.');
  foe(3, 36, 'overseer', 'Overseer', 'caster', A('#c8d0d8', '#5a6a7a', '#ff3c3c', '#ff3c3c', { plan: 'float', size: 1.05, body: 'eye', metal: true }), 'A floating metal eye that runs the invasion. It shoots at everything.');
  foe(3, 37, 'cruiser_drone', 'Cruiser Drone', 'brute', A('#7a8a9a', '#4a5a6a', '#ffcc33', '#ffcc33', { plan: 'float', size: 1.3, body: 'saucer', guns: true }), 'A gunship the size of a barn.');
  foe(3, 38, 'quantum_trooper', 'Quantum Trooper', 'grunt', A('#e0e8f0', '#5a3aaa', '#5cf0ff', '#5cf0ff', { plan: 'biped', size: 1.05, head: 'visor', armor: true, weapon: 'rifle', glitch: true }), 'Fights in two places at once. Only one of them hurts.');
  foe(3, 39, 'command_bot', 'Command Bot', 'tank', A('#aab0ba', '#6a707a', '#ffd700', '#5cf0ff', { plan: 'biped', size: 1.4, head: 'robot', armor: true, weapon: 'hammer', shield: 'energy', cape: '#3a4a7a' }), 'Gives the orders. Can take a beating while it does.');
  foe(3, 40, 'overlord', 'Mothership Overlord', 'boss', A('#c8a0ff', '#3a2a5a', '#ffd700', '#ffffff', { plan: 'float', size: 2.5, body: 'brain', hat: 'crown', boss: true, guns: true }), 'The mind behind the whole invasion, sitting on a throne of light.');

  // ---------------------------------------------------------------- the Low Gravity system
  // Battles there use Low Gravity beasts only, from Tier 1 again: a second climb.

  // World 4: the Moon Hollows. Lost astronauts, miners and the moon's own ghosts.
  foe(4, 1, 'moon_miner', 'Moon Miner', 'grunt', P('#f0d0b0', '#c87a3a', '#5a5a6a', '#2a1a10', { plan: 'biped', size: 0.95, hat: 'helmet', weapon: 'pick' }), 'Dug too deep into the moon and came up cross. Still has the pick.');
  foe(4, 2, 'dust_mites', 'Dust Mites', 'swarm', A('#c8c8d0', '#9a9aa8', '#e8e8ff', '#5cf0ff', { plan: 'float', size: 0.75, body: 'swarm' }), 'Moon dust that learned to bite. Comes in clouds.');
  foe(4, 3, 'lost_astronaut', 'Lost Astronaut', 'grunt', A('#f0d0b0', '#f0f0f4', '#ff7a2a', '#2a1a10', { plan: 'biped', size: 1, head: 'astro', armor: true, weapon: 'wrench' }), 'Floated off from a mission long ago. Thinks your coins are his pay.');
  foe(4, 4, 'crater_crawler', 'Crater Crawler', 'runner', A('#9a9aa8', '#6a6a78', '#5cf0ff', '#5cf0ff', { plan: 'crawler', size: 0.85 }), 'Lives in crater shadows and scuttles out at anything shiny.');
  foe(4, 5, 'moon_slinger', 'Moon Slinger', 'ranged', P('#d8c8e8', '#5a6a9a', '#c8d0ff', '#3a3a7a', { plan: 'biped', size: 0.9, head: 'hood', weapon: 'sling' }), 'Throws moon rocks. In low gravity they go a very long way.');
  foe(4, 6, 'regolith_brute', 'Regolith Brute', 'brute', A('#a8a8b0', '#7a7a88', '#5a5a68', '#ffcc33', { plan: 'biped', size: 1.3, build: 'heavy', spikes: true, weapon: 'claws' }), 'A miner who spent so long in the dust that he turned into it.');
  foe(4, 8, 'lunar_wraith', 'Lunar Wraith', 'caster', A('#e8e8ff', '#b8c0e8', '#8ab0ff', '#5cb0ff', { plan: 'float', size: 0.95, body: 'sheet' }), 'A pale ghost of the moon that throws cold light.');
  foe(4, 9, 'jet_scav', 'Jet Scavenger', 'runner', A('#e0b090', '#7a6a5a', '#ff9a2a', '#5cf0ff', { plan: 'biped', size: 0.9, head: 'visor', jetpack: true, weapon: 'dagger' }), 'Strips old landers for parts, and goes for coins on a sputtering jetpack.');
  foe(4, 10, 'crater_colossus', 'Crater Colossus', 'boss', A('#9a9aa8', '#6a6a78', '#ffcc33', '#ffcc33', { plan: 'biped', size: 2.3, build: 'heavy', spikes: true, weapon: 'club', boss: true }), 'A giant of moon rock that woke up when the miners dug too deep. Its swing hits three.');
  foe(4, 12, 'selenite_knight', 'Selenite Knight', 'tank', A('#c8e8ff', '#8ac8f0', '#e8f8ff', '#ffffff', { plan: 'biped', size: 1.1, head: 'crystal', crystal: true, weapon: 'sword', shield: 'round' }), 'Armour grown from moon crystal. Hits slide off it.');
  foe(4, 13, 'moon_moths', 'Moon Moths', 'swarm', A('#f0f0ff', '#c8c8e8', '#ffffff', '#c8b0ff', { plan: 'float', size: 0.75, body: 'moth' }), 'Pale moths that follow the glint of coins across the craters.');
  foe(4, 14, 'rover_bot', 'Rover Bot', 'tank', A('#d8d8e0', '#9aa0aa', '#ffcc33', '#5cf0ff', { plan: 'float', size: 1.2, body: 'tank' }), 'An old moon rover that decided it was in charge.');
  foe(4, 15, 'dust_devil', 'Dust Devil', 'runner', A('#c8c0b0', '#a89a88', '#f0e8d8', '#ff5a3a', { plan: 'float', size: 1, body: 'swirl' }), 'A whirl of grey dust with two red eyes in it. Fast and hard to hit.');
  foe(4, 17, 'crater_sniper', 'Crater Sniper', 'ranged', A('#f0d0b0', '#f0f0f4', '#3a7aff', '#2a1a10', { plan: 'biped', size: 0.95, head: 'astro', weapon: 'long_rifle' }), 'Lies on the crater rim. Low gravity lets the shot carry for ever.');
  foe(4, 18, 'moon_witch_lg', 'Crescent Witch', 'caster', P('#e8e0f0', '#3a3a6a', '#c8d0ff', '#c8d0ff', { plan: 'biped', size: 0.95, hat: 'wizard', weapon: 'orb_staff', cape: '#1a1a3a' }), 'Reads the phases of the moon, and throws the dark ones.');
  foe(4, 20, 'pale_queen', 'The Pale Queen', 'boss', A('#f0f0ff', '#c8d0f0', '#c8b0ff', '#9ab0ff', { plan: 'float', size: 2.2, body: 'robe', head: 'round', hat: 'crown', weapon: 'orb_staff', boss: true }), 'The queen of the moon\'s ghosts. Her cold light hits three beasts at once.');
  foe(4, 22, 'gravity_hopper', 'Gravity Hopper', 'brute', A('#f0d0b0', '#5a5a6a', '#ff7a2a', '#2a1a10', { plan: 'biped', size: 1.15, head: 'astro', armor: true, weapon: 'hammer', jetpack: true }), 'Bounds across the moon in huge leaps and lands hammer first.');
  foe(4, 24, 'tether_guard', 'Tether Guard', 'tank', A('#f0d0b0', '#e0e0e8', '#ff7a2a', '#2a1a10', { plan: 'biped', size: 1.15, head: 'astro', armor: true, weapon: 'spear', shield: 'energy' }), 'Guards the base\'s lifeline and lets nothing past.');
  foe(4, 26, 'echo', 'Echo', 'caster', A('#c8d0ff', '#8a9ae8', '#ffffff', '#ffffff', { plan: 'float', size: 0.9, body: 'eye' }), 'A floating eye that repeats every blow back at you.');
  foe(4, 28, 'moon_ogre', 'Moon Ogre', 'brute', A('#b8b8c8', '#7a7a8a', '#5a5a6a', '#ff9a2a', { plan: 'biped', size: 1.5, build: 'heavy', weapon: 'club', ears: true }), 'An ogre that drifted up from a crater and liked it there.');
  foe(4, 30, 'lunar_leviathan', 'Lunar Leviathan', 'boss', A('#c8c8d8', '#8a8a9a', '#c8b0ff', '#ff5a3a', { plan: 'serpent', size: 2.2, horns: true, boss: true }), 'A great worm that swims through moon dust as if it were water.');
  foe(4, 32, 'orbit_drone', 'Orbit Drone', 'swarm', A('#d8d8e0', '#9aa0aa', '#ff5a3a', '#ff5a3a', { plan: 'float', size: 0.75, body: 'drone' }), 'Little drones that swing round the moon and dive at you.');
  foe(4, 35, 'base_commander', 'Base Commander', 'tank', A('#f0d0b0', '#3a5a9a', '#ffd700', '#2a1a10', { plan: 'biped', size: 1.3, head: 'astro', armor: true, weapon: 'sword', shield: 'tower', cape: '#3a4a7a' }), 'Runs the lost moon base and wants its coins back.');
  foe(4, 40, 'moon_monarch', 'The Moon Monarch', 'boss', A('#f0f0ff', '#8a8ac8', '#ffd700', '#ffffff', { plan: 'biped', size: 2.4, head: 'crystal', hat: 'crown', crystal: true, weapon: 'orb_staff', cape: '#2a2a6a', boss: true }), 'The moon\'s own king, carved from its brightest crystal.');

  // World 5: the Ring Pirates. Pirates, smugglers and hired guns on a planet's rings.
  foe(5, 1, 'deckhand', 'Deckhand', 'grunt', P('#d8a07a', '#3a5a8a', '#c8a03a', '#2a1a10', { plan: 'biped', size: 0.95, hat: 'bandana', weapon: 'cutlass' }), 'Swabs the decks of a pirate ship and fights for its captain.');
  foe(5, 2, 'loot_drones', 'Loot Drones', 'swarm', A('#c8a03a', '#8a6a2a', '#ffd700', '#ff5a3a', { plan: 'float', size: 0.75, body: 'drone' }), 'Little drones built for grabbing coins and flying off with them.');
  foe(5, 3, 'space_pirate', 'Space Pirate', 'grunt', P('#e0b090', '#2a2a3a', '#c8a03a', '#2a1a10', { plan: 'biped', size: 1, hat: 'pirate', patch: true, weapon: 'raygun' }), 'Swapped the sea for the stars and the cutlass for a ray gun.');
  foe(5, 4, 'smuggler', 'Smuggler', 'runner', P('#d8a07a', '#5a4a3a', '#8a7a5a', '#2a1a10', { plan: 'biped', size: 0.9, hat: 'cap', weapon: 'dagger', jetpack: true }), 'Knows every gap in the rings. Slips past you to your coins.');
  foe(5, 5, 'gunner', 'Ring Gunner', 'ranged', P('#e0b090', '#7a3a2a', '#c8a03a', '#2a1a10', { plan: 'biped', size: 1, hat: 'bandana', weapon: 'rifle' }), 'Mans the ship\'s guns and brings one along.');
  foe(5, 6, 'merc_brute', 'Mercenary Brute', 'brute', A('#7a9a6a', '#4a4a5a', '#ff5a3a', '#ff3c2a', { plan: 'biped', size: 1.3, build: 'heavy', tusks: true, armor: true, weapon: 'hammer' }), 'An alien for hire. Paid in coins, which is why it wants yours.');
  foe(5, 8, 'navigator', 'Navigator', 'caster', P('#f0c39a', '#3a3a7a', '#5cf0ff', '#2a1a10', { plan: 'biped', size: 0.9, goggles: true, weapon: 'orb_staff' }), 'Reads the star charts, and throws them at you.');
  foe(5, 9, 'boarder', 'Boarding Crew', 'tank', P('#d8a07a', '#5a5a6a', '#c8a03a', '#2a1a10', { plan: 'ram', size: 1.5 }), 'Four pirates and a battering ram, for getting through hatches.');
  foe(5, 10, 'captain_comet', 'Captain Comet', 'boss', P('#e0b090', '#aa2a2a', '#ffd700', '#2a1a10', { plan: 'biped', size: 2.3, hat: 'pirate', beard: '#3a2a1a', weapon: 'cutlass', cape: '#2a1a3a', jetpack: true, boss: true }), 'The fastest captain in the rings. Her cutlass hits three beasts at once.');
  foe(5, 12, 'quartermaster', 'Quartermaster', 'tank', P('#d8a07a', '#6a4a2a', '#c8a03a', '#2a1a10', { plan: 'biped', size: 1.2, build: 'heavy', beard: '#8a5a2a', weapon: 'axe', shield: 'round' }), 'Counts the loot. Every coin. Very protective of it.');
  foe(5, 13, 'parrot_drone', 'Parrot Bot', 'runner', A('#ff5a3a', '#3aaa5a', '#ffd700', '#ffffff', { plan: 'float', size: 0.8, body: 'drone' }), 'A robot parrot that squawks rude words and pecks.');
  foe(5, 14, 'cannoneer', 'Cannoneer', 'ranged', P('#e0b090', '#3a3a4a', '#c8a03a', '#2a1a10', { plan: 'biped', size: 1.05, hat: 'bandana', weapon: 'cannon' }), 'Carries a small cannon on one shoulder. Not that small.');
  foe(5, 15, 'void_corsair', 'Void Corsair', 'brute', A('#9ab0c8', '#2a2a3a', '#aa7aff', '#aa7aff', { plan: 'biped', size: 1.1, head: 'alien', weapon: 'dual', cape: '#1a1a2a' }), 'An alien pirate with a knife in each hand and no mercy in either.');
  foe(5, 17, 'salvage_mech', 'Salvage Mech', 'tank', A('#aa8a5a', '#6a5a3a', '#ffcc33', '#ffcc33', { plan: 'tripod', size: 1.4 }), 'Built from wrecks. Walks on three legs and shoots from the middle.');
  foe(5, 18, 'siren', 'Ring Siren', 'caster', A('#8ae0d0', '#3a8a9a', '#c8fff4', '#ffffff', { plan: 'float', size: 0.95, body: 'robe', head: 'round', hair: true }), 'Sings to ships to lure them onto the rocks. It hurts to hear.');
  foe(5, 20, 'rust_kraken', 'The Rust Kraken', 'boss', A('#aa5a3a', '#7a3a2a', '#ffa03a', '#ffee00', { plan: 'blob', size: 2.3, tentacles: true, boss: true }), 'A metal kraken that eats ships. Its arms reach three beasts at once.');
  foe(5, 22, 'first_mate', 'First Mate', 'brute', P('#d8a07a', '#aa3a3a', '#c8a03a', '#2a1a10', { plan: 'biped', size: 1.15, hat: 'pirate', weapon: 'dual_axe' }), 'Does the captain\'s fighting while she does the shouting.');
  foe(5, 24, 'ghost_crew', 'Ghost Crew', 'swarm', A('#c8f0ff', '#8ac8e8', '#e8ffff', '#5cf0ff', { plan: 'float', size: 0.75, body: 'orb' }), 'The crew of a lost ship, still looking for their gold.');
  foe(5, 26, 'bounty_hunter', 'Bounty Hunter', 'ranged', A('#c8d0d8', '#5a4a3a', '#ff7a2a', '#ff3c3c', { plan: 'biped', size: 1, head: 'visor', armor: true, weapon: 'long_rifle', cape: '#3a2a1a' }), 'Paid to bring in the rarest beasts. Yours have a price on them.');
  foe(5, 28, 'dreadnought', 'Dreadnought', 'tank', A('#7a8a9a', '#4a5a6a', '#ff5a3a', '#ff5a3a', { plan: 'float', size: 1.4, body: 'saucer', guns: true }), 'A small warship that hovers just off the ground.');
  foe(5, 30, 'admiral_nova', 'Admiral Nova', 'boss', A('#e0b090', '#1a2a5a', '#ffd700', '#5cf0ff', { plan: 'biped', size: 2.3, head: 'visor', hat: 'pirate', armor: true, weapon: 'laser_sword', cape: '#5a1a2a', boss: true }), 'The admiral of the whole pirate fleet. Her blade of light hits three beasts at once.');
  foe(5, 32, 'powder_monkey', 'Powder Runner', 'runner', P('#d8a07a', '#6a5a4a', '#ff5a3a', '#2a1a10', { plan: 'biped', size: 0.8, hat: 'bandana', weapon: 'potion' }), 'Runs the powder to the guns, and throws it when there is no gun.');
  foe(5, 35, 'pirate_lord', 'Pirate Lord', 'tank', P('#e0b090', '#5a2a5a', '#ffd700', '#2a1a10', { plan: 'biped', size: 1.3, hat: 'pirate', beard: '#1a1a1a', armor: true, weapon: 'cutlass', shield: 'round', cape: '#2a0a2a' }), 'Rules a stretch of the rings. Wants the rest of it.');
  foe(5, 40, 'black_comet', 'The Black Comet', 'boss', A('#3a3a5a', '#1a1a2a', '#ff7a2a', '#ff7a2a', { plan: 'float', size: 2.4, body: 'saucer', guns: true, boss: true }), 'The pirates\' flagship, a ship like a falling star.');

  // World 6: the Eclipse Court. Knights, mages and angels of the dark between the stars.
  foe(6, 1, 'eclipse_cultist', 'Eclipse Cultist', 'grunt', P('#d8c8e8', '#2a1a3a', '#aa7aff', '#aa7aff', { plan: 'biped', size: 0.95, head: 'hood', weapon: 'dagger' }), 'Chants for the day the light goes out for good.');
  foe(6, 2, 'void_motes', 'Void Motes', 'swarm', A('#2a1a3a', '#1a0a2a', '#d080ff', '#d080ff', { plan: 'float', size: 0.75, body: 'orb' }), 'Specks of the dark between the stars. They sting.');
  foe(6, 3, 'void_knight', 'Void Knight', 'tank', A('#3a3a5a', '#2a2a3a', '#aa7aff', '#d080ff', { plan: 'biped', size: 1.1, head: 'helm', armor: true, weapon: 'sword', shield: 'tower' }), 'Sworn to the Eclipse. Its armour drinks the light.');
  foe(6, 4, 'star_mage', 'Star Mage', 'caster', P('#f0d8c0', '#2a2a6a', '#ffd700', '#ffd700', { plan: 'biped', size: 0.95, hat: 'wizard', weapon: 'orb_staff', cape: '#1a1a4a' }), 'Pulls stars down out of the sky. Small ones, luckily.');
  foe(6, 5, 'void_hound', 'Void Hound', 'runner', A('#2a2a3a', '#1a1a2a', '#d080ff', '#d080ff', { plan: 'quad', size: 0.95, spikes: true, glitch: true }), 'A hound made of the dark. It flickers as it runs.');
  foe(6, 6, 'gravity_brute', 'Gravity Brute', 'brute', A('#6a5a8a', '#3a2a5a', '#aa7aff', '#ffffff', { plan: 'biped', size: 1.35, build: 'heavy', armor: true, weapon: 'hammer', glow: true }), 'Its hammer weighs as much as a small moon.');
  foe(6, 8, 'seraph', 'Dark Seraph', 'ranged', P('#f0e8f8', '#3a2a4a', '#d080ff', '#d080ff', { plan: 'biped', size: 1, hair: true, wings: 'feather', weapon: 'bow' }), 'A fallen angel who shoots arrows of shadowed light.');
  foe(6, 9, 'shadow_sun', 'Shadow Sun', 'caster', A('#2a1a3a', '#1a0a2a', '#ff7a2a', '#ff7a2a', { plan: 'float', size: 1, body: 'star' }), 'A small dead sun, burning dark.');
  foe(6, 10, 'eclipse_seraph', 'Eclipse Seraph', 'boss', P('#f0e8f8', '#2a1a3a', '#ffd700', '#d080ff', { plan: 'biped', size: 2.3, hair: true, wings: 'feather', weapon: 'laser_sword', armor: true, boss: true }), 'The Court\'s champion, on wings of dusk. Its blade hits three beasts at once.');
  foe(6, 12, 'oath_breaker', 'Oathbreaker', 'brute', A('#3a3a4a', '#2a1a2a', '#ff3c5a', '#ff3c5a', { plan: 'biped', size: 1.15, head: 'helm', armor: true, weapon: 'axe', cape: '#3a0a1a' }), 'A knight who broke every vow but this one: take the coins.');
  foe(6, 13, 'comet_imps', 'Comet Imps', 'swarm', A('#ff9a5a', '#aa4a2a', '#ffd700', '#ffffff', { plan: 'biped', size: 0.6, hat: 'horns', tail: true, weapon: 'claws' }), 'Tiny devils that ride comets down and land in crowds.');
  foe(6, 14, 'horizon_wraith', 'Horizon Wraith', 'brute', A('#1a1a2a', '#0a0a1a', '#d080ff', '#d080ff', { plan: 'float', size: 1.15, body: 'cloak', weapon: 'scythe' }), 'Waits at the edge of a black hole. Nothing comes back from its scythe.');
  foe(6, 15, 'astral_archer', 'Astral Archer', 'ranged', P('#f0d8c0', '#1a3a5a', '#5cf0ff', '#5cf0ff', { plan: 'biped', size: 1, ears: true, head: 'hood', weapon: 'longbow' }), 'An elf of the stars whose arrows cross the whole field.');
  foe(6, 17, 'orbit_guard', 'Orbit Guard', 'tank', A('#c8c0d8', '#5a4a7a', '#ffd700', '#ffffff', { plan: 'biped', size: 1.2, head: 'helm', armor: true, weapon: 'halberd', shield: 'energy' }), 'Circles the Court and lets no one near the throne.');
  foe(6, 18, 'nebula_witch', 'Nebula Witch', 'caster', P('#e8d0f0', '#5a2a6a', '#ff7aff', '#ff7aff', { plan: 'float', size: 1, body: 'robe', head: 'round', hat: 'wizard', weapon: 'staff' }), 'Brews storms out of star dust and pours them on you.');
  foe(6, 20, 'void_emperor', 'The Void Emperor', 'boss', A('#2a1a3a', '#1a0a2a', '#d080ff', '#d080ff', { plan: 'float', size: 2.2, body: 'cloak', hat: 'crown', weapon: 'scythe', boss: true }), 'An empty crown over an empty cloak, with a scythe that cuts three beasts at once.');
  foe(6, 22, 'singularity_monk', 'Singularity Monk', 'grunt', P('#d8c0a8', '#3a2a4a', '#aa7aff', '#aa7aff', { plan: 'biped', size: 0.95, head: 'bald', weapon: 'staff', glow: true }), 'Meditates on the black hole until it meditates back.');
  foe(6, 24, 'star_eater', 'Star Eater', 'brute', A('#3a2a4a', '#1a0a2a', '#ff7a2a', '#ffee00', { plan: 'blob', size: 1.3, tentacles: true }), 'Eats stars. Has moved on to beasts.');
  foe(6, 26, 'eclipse_hound', 'Eclipse Hound', 'runner', A('#1a1a2a', '#0a0a1a', '#ff7a2a', '#ff7a2a', { plan: 'quad', size: 1.1, long: true, mane: true }), 'Hunts in the moment the sun goes out.');
  foe(6, 28, 'cosmic_judge', 'Cosmic Judge', 'caster', A('#e8e0f0', '#3a2a5a', '#ffd700', '#ffffff', { plan: 'float', size: 1.05, body: 'eye', metal: true }), 'Weighs every beast on the field and finds it wanting.');
  foe(6, 30, 'singularity', 'The Singularity', 'boss', A('#0a0a14', '#05050a', '#d080ff', '#ffffff', { plan: 'float', size: 2.3, body: 'star', boss: true }), 'A point of darkness so heavy that light bends round it.');
  foe(6, 32, 'herald', 'Eclipse Herald', 'tank', A('#c8c0d8', '#2a1a3a', '#ffd700', '#d080ff', { plan: 'biped', size: 1.25, head: 'helm', armor: true, weapon: 'lance', shield: 'tower', wings: 'feather' }), 'Announces the Emperor, with wings and a lance.');
  foe(6, 35, 'court_mage', 'Court Astromancer', 'caster', P('#f0d8c0', '#1a1a3a', '#5cf0ff', '#5cf0ff', { plan: 'biped', size: 1, hat: 'halo_ring', beard: '#e8e8ff', weapon: 'orb_staff', cape: '#0a0a2a' }), 'The Court\'s greatest mage. Her orbits spin with whole worlds.');
  foe(6, 40, 'eclipse_emperor', 'The Eclipse Emperor', 'boss', A('#f0e8f8', '#1a0a2a', '#ffd700', '#ffd700', { plan: 'biped', size: 2.5, hat: 'crown', armor: true, wings: 'feather', weapon: 'laser_sword', cape: '#3a0a4a', glow: true, boss: true }), 'The one who would put out every star. This is the last battle.');

  const ENEMIES = {};
  for (const e of E) ENEMIES[e.id] = e;

  /** An enemy's stat points at a level of `points`. */
  /** How far into its own solar system's climb a world sits (Worlds 4 to 6 start again from 1). */
  const stage = (world) => ((world - 1) % 3) + 1;

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
    if (role.floor) for (const [k, v] of Object.entries(role.floor)) s[k] = Math.max(s[k], v);
    return s;
  }
  /** How big an enemy stands (radius, arena units). */
  // (World 7's giants stand as wide as they are drawn: 28 a size, up to 135.)
  const enemyRadius = (id) => { const l = (ENEMIES[id] || {}).look || { size: 1 }; return l.plan === 'mutant' && l.boss ? Math.min(135, 28 * l.size) : Math.min(84, 24 * Math.max(0.85, l.size)); };
  /** An enemy's size as drawn: never under 0.85, so swarms are big enough to see. */
  const enemySize = (id) => Math.max(0.85, ((ENEMIES[id] || {}).look || { size: 1 }).size);

  // ------------------------------------------------------------------ worlds and levels
  const WORLDS = [
    { id: 1, system: 'prime', name: 'Shadow Wilds', theme: 'shadow', levels: 40, base: 3.2, gain: 0.62, chest: { rarity: 'LEGENDARY', tier: 10 } },
    { id: 2, system: 'prime', name: 'Iron Kingdom', theme: 'kingdom', levels: 40, base: 25, gain: 0.7, chest: { rarity: 'GODLY', tier: 12 } },
    { id: 3, system: 'prime', name: 'Star Invasion', theme: 'invasion', levels: 40, base: 48, gain: 0.75, chest: { rarity: 'GODLY', tier: 15 } },
    { id: 4, system: 'low_gravity', name: 'Moon Hollows', theme: 'moon', levels: 40, base: 3.2, gain: 0.62, chest: { rarity: 'LEGENDARY', tier: 10 } },
    { id: 5, system: 'low_gravity', name: 'Ring Pirates', theme: 'rings', levels: 40, base: 25, gain: 0.7, chest: { rarity: 'GODLY', tier: 12 } },
    { id: 6, system: 'low_gravity', name: 'Eclipse Court', theme: 'eclipse', levels: 40, base: 48, gain: 0.75, chest: { rarity: 'GODLY', tier: 15 } },
    // 1.5: World 7, the Universal Mutants (mutants.js): beasts of every system, twenty boss fights.
    { id: 7, system: 'any', name: 'Universal Mutants', theme: 'mutants', levels: 20, base: 70, gain: 1.3, chest: { rarity: 'DARK_MATTER', tier: 20, comet: 'singularity_dragon_20' } },
    // 1.5 (Sam, 24 Nov): World 8, opened by beating World 7; a struggle even for comet beasts.
    { id: 8, system: 'any', name: 'Apex Mutants', theme: 'abyss', levels: 20, base: 90, gain: 1.6, chest: { rarity: 'DARK_MATTER', tier: 20, comet: 'ouroboros_20' } },
  ];
  const BOSS_EVERY = 10;

  /**
   * The collection a player is expected to have reached a level with (the balance tool calibrates
   * against it, and the rules below scale with it): one climb over 120 levels. Sam (18 Nov): "a bit
   * harder, like tier 10 beasts by level 10". So a tier a level up to Tier 10 at level 10, then a
   * fifth of a tier a level: Tier 16 by the end of the first world (before any prestige), Tier 20
   * by the middle of the second, then prestige. Worlds 4 to 6 climb the same way with Low Gravity
   * beasts.
   */
  function expect(world, n) {
    // World 7 is for the end of the game: the best of both systems at prestige 15.
    if (world === 7) return { tier: 20, rarity: 'DARK_MATTER', prestige: 15 };
    // World 8: three comet beasts with the best of both systems, Tier 12 at the start and ascended
    // (Tier 16 and up) from level 12, Tier 20 by the end.
    if (world === 8) return { tier: 20, rarity: 'DARK_MATTER', prestige: 15, comet: { tier: Math.min(20, Math.round(12 + (8 * (n - 1)) / 19)), rarity: n < 8 ? 'LEGENDARY' : n < 15 ? 'GODLY' : 'DARK_MATTER', prestige: Math.min(10, Math.floor(n / 2)) } };
    const i = (stage(world) - 1) * 40 + n;
    const rarity = i < 8 ? 'RARE' : i < 20 ? 'SUPER_RARE' : i < 35 ? 'ULTRA_RARE' : i < 55 ? 'LEGENDARY' : i < 90 ? 'GODLY' : 'DARK_MATTER';
    return { tier: Math.min(20, i <= 10 ? i : 10 + (i - 10) * 0.2), rarity, prestige: i <= 40 ? 0 : Math.floor((i - 40) / 6) };
  }

  /**
   * Rules some levels set on your six, so the same strongest six does not win everything (Sam,
   * 17 Nov): quick cards only, long reach only, swift only, Commons and Rares only, or three beasts.
   */
  const RULES = {
    quick: { name: 'Quick cards', short: (v) => `rest ${v} s or less` },
    range: { name: 'Long reach', short: (v) => `Range ${v} or more` },
    speed: { name: 'Swift', short: (v) => `Speed ${v} or more` },
    rarity: { name: 'Plain stock', short: () => 'Commons and Rares only' },
    three: { name: 'Three only', short: () => 'three beasts at most' },
    slow: { name: 'Slow orders', short: () => 'cards recharge twice as long' },
    spring: { name: 'Mana spring', short: () => 'mana fills half as fast again' },
    few: { name: 'Small band', short: () => 'five on the field at most' },
    tough: { name: 'Thick skin', short: (v) => `Health ${v} or more` },
  };
  /** Rules that limit which beasts you bring (the others change how the battle goes). */
  const DECK_RULES = ['quick', 'range', 'speed', 'rarity', 'three', 'tough'];
  /** Whether a beast with stats `s` may join under a level's rule. */
  function ruleAllows(rule, id, s) {
    if (!rule) return true;
    const t = T(id);
    if (rule.kind === 'quick') return t.tier <= rule.value;
    if (rule.kind === 'range') return s.rng >= rule.value;
    if (rule.kind === 'speed') return s.spd >= rule.value;
    if (rule.kind === 'rarity') return t.rarity === 'COMMON' || t.rarity === 'RARE';
    if (rule.kind === 'tough') return s.hp >= rule.value;
    return true;
  }
  /** Waves of one kind: snipers at the back, swarms, runners, or tanks and brutes. */
  const THEMES = {
    snipers: { name: 'Sniper nest', roles: ['ranged', 'caster'], tip: 'Mostly shooters' },
    swarm: { name: 'Swarm', roles: ['swarm'], tip: 'Crowds of small ones' },
    runners: { name: 'Runners', roles: ['runner'], tip: 'Fast ones after your coins' },
    tanks: { name: 'Heavies', roles: ['tank', 'brute'], tip: 'Tough, hard hitters' },
  };

  /** Enemy points at a level: climbing through a world, a little more on boss levels. */
  function levelPoints(world, n) {
    const w = WORLDS[world - 1];
    return w.base + w.gain * (n - 1);
  }

  /**
   * How a level's enemies come (Sam, 18 Nov: "like Battle Cats, they could all spawn at once"):
   * a stream, a rush of many at once, waves, an ambush from both edges, pairs down the flanks, or
   * shooters behind a tough one. The first two levels are streams and the third a small rush; after
   * that a level never repeats the pattern of the one before.
   */
  const PATTERNS = {
    stream: { name: 'Patrol', tip: 'A steady stream' },
    rush: { name: 'Rush', tip: 'Many at once' },
    waves: { name: 'Waves', tip: 'Bigger and bigger waves' },
    ambush: { name: 'Ambush', tip: 'A crowd from both edges' },
    flanks: { name: 'Flanks', tip: 'Down both edges' },
    escort: { name: 'Escort', tip: 'Shooters behind a tough one' },
    champion: { name: 'Champion', tip: 'One or two huge ones' },
    horde: { name: 'Horde', tip: 'A big crowd of weak ones' },
    fortress: { name: 'Fortress', tip: 'Touch their pile and the garrison comes out' },
    tide: { name: 'Rising tide', tip: 'Faster and faster' },
    boss: { name: 'Boss', tip: 'A boss joins at 20 seconds' },
  };
  const PATTERN_ORDER = {};
  function patternOf(world, n) {
    if (n % BOSS_EVERY === 0) return 'boss';
    if (n <= 2) return 'stream';
    if (n === 3) return 'rush';
    // From level 4, the ten patterns dealt out like cards from a shuffled pack, a fresh pack every
    // ten, so every world gets each of them three or four times; never the same twice running.
    if (!PATTERN_ORDER[world]) {
      const list = ['stream', 'rush', 'waves', 'ambush', 'flanks', 'escort', 'champion', 'horde', 'fortress', 'tide'];
      const r = seeded(hash(`patterns|${world}`));
      const seq = [];
      while (seq.length < 60) {
        const pack = list.slice();
        for (let i = pack.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pack[i], pack[j]] = [pack[j], pack[i]]; }
        if (seq.length && pack[0] === seq[seq.length - 1]) pack.push(pack.shift());
        seq.push(...pack);
      }
      PATTERN_ORDER[world] = seq;
    }
    let k = 0;
    for (let m = 4; m < n; m++) if (m % BOSS_EVERY) k++;
    return PATTERN_ORDER[world][k];
  }

  /**
   * A level: which enemies come, when, and how strong. Made from the world and number with fixed
   * randomness, so a level is always the same.
   */
  function level(world, n) {
    if (world >= 7 && typeof MUTANTS !== 'undefined') return MUTANTS.level(n, world);
    const w = WORLDS[world - 1];
    const r = seeded(hash(`level|${world}|${n}`));
    const boss = n % BOSS_EVERY === 0;
    let pool = E.filter((e) => e.world === world && e.role !== 'boss' && e.debut <= n);
    const fresh = E.find((e) => e.world === world && e.debut === n && e.role !== 'boss');
    const bossFoe = boss ? E.find((e) => e.world === world && e.role === 'boss' && e.debut === n) : null;
    const points = levelPoints(world, n);
    // Recent arrivals more often than old ones, and the newest always shows up early.
    // Rules and themes: from level 4, a rule every tenth level from 4 (quick cards) and from 7
    // (reach, speed, rarity or three only, in turn), a themed wave every tenth level from 5.
    let rule = null, theme = null;
    const k10 = n % 10, round = Math.floor(n / 10);
    if (n >= 4 && k10 === 4) rule = { kind: 'quick', value: Math.max(2, Math.round(expect(world, n).tier * 0.5)) };
    if (n >= 7 && k10 === 7) {
      let kind = ['range', 'speed', 'rarity', 'three'][round % 4], value = 0;
      // The bar is set from what a player is expected to have by then, so that at least three of
      // those beasts pass it; a rule that could not bite yet (everyone at Range 1, or nothing rarer
      // than Rare) becomes three beasts at most.
      const ex = expect(world, n);
      const have = Object.keys(BEAST_TEMPLATES).filter((id) => canBattle(id) && systemOf(id) === w.system && BEAST_TEMPLATES[id].tier <= Math.round(ex.tier) && RANKS.indexOf(BEAST_TEMPLATES[id].rarity) <= RANKS.indexOf(ex.rarity));
      if (kind === 'range' || kind === 'speed') {
        const vals = have.map((id) => beastStats(id, ex.prestige)[kind === 'range' ? 'rng' : 'spd']).sort((a, c) => c - a);
        value = vals.length >= 3 ? vals[2] : 1;
        if (value < (kind === 'range' ? 3 : 2)) kind = 'three';
      }
      if (kind === 'rarity' && RANKS.indexOf(ex.rarity) <= 1) kind = 'three';
      rule = { kind, value };
    }
    if (n >= 12 && k10 === 2) {
      let kind = ['slow', 'few', 'tough'][round % 3], value = 0;
      if (kind === 'tough') {
        const ex = expect(world, n);
        const vals = Object.keys(BEAST_TEMPLATES).filter((id) => canBattle(id) && systemOf(id) === w.system && BEAST_TEMPLATES[id].tier <= Math.round(ex.tier) && RANKS.indexOf(BEAST_TEMPLATES[id].rarity) <= RANKS.indexOf(ex.rarity))
          .map((id) => beastStats(id, ex.prestige).hp).sort((a, c) => c - a);
        value = vals.length >= 3 ? vals[2] : 1;
        if (value < 3) kind = 'slow';
      }
      rule = { kind, value };
    }
    if (n >= 9 && k10 === 9) rule = { kind: 'spring', value: 0 };
    if (n >= 5 && k10 === 5) theme = ['snipers', 'swarm', 'runners', 'tanks'][(round + world) % 4];
    const themed = (e) => theme && THEMES[theme].roles.includes(e.role);
    // 1.4.1, a level's own roster (Sam, 23 Nov: every level showed every enemy met so far): its
    // newest, a few recent ones and one or two older ones, four kinds early in a world and seven by
    // its end, and on a themed level at least two of the theme.
    {
      const size = Math.min(pool.length, 4 + Math.round((3 * (n - 1)) / Math.max(1, w.levels - 1)));
      const roster = fresh ? [fresh] : [];
      for (const e of [...pool].sort((a, c) => c.debut - a.debut).slice(0, 6)) if (roster.length < Math.ceil(size * 0.6) && !roster.includes(e) && r() < 0.75) roster.push(e);
      const rest = pool.filter((e) => !roster.includes(e));
      while (roster.length < size && rest.length) roster.push(rest.splice(Math.floor(r() * rest.length), 1)[0]);
      if (theme) for (const e of pool.filter((x) => themed(x) && !roster.includes(x))) if (roster.filter(themed).length < 2) roster.push(e);
      if (roster.length) pool = roster;
    }
    const weights = pool.map((e) => (1 + Math.max(0, 6 - (n - e.debut)) * 0.5) * (themed(e) ? 7 : 1));
    const pick = () => {
      let x = r() * weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < pool.length; i++) { x -= weights[i]; if (x <= 0) return pool[i]; }
      return pool[pool.length - 1];
    };
    /** One of the given parts (grunts, runners and so on) if the level has any, else anyone. */
    const pickOf = (roles) => {
      const some = pool.filter((e) => roles.includes(e.role));
      return some.length ? some[Math.floor(r() * some.length)] : pick();
    };
    const k = (n - 1) / (w.levels - 1);
    const spawns = [];
    // Crowds and pace by the world's place in its solar system: the Low Gravity worlds start again
    // from Tier 1, so World 4 is paced like World 1.
    const st = stage(world);
    const every = Math.max(2.4, 4.6 - 1.8 * k - (st - 1) * 0.2 + (n <= 3 ? 0.8 : 0));
    const length = 160;
    const lanes = (m) => Array.from({ length: m }, (_, i) => (m === 1 ? 0.5 : 0.1 + (0.8 * i) / (m - 1)));
    const clampX = (x) => Math.min(0.92, Math.max(0.08, x));
    // From level 6 on, now and then an elite: bigger, tougher, harder hitting, with a gold glow.
    const eliteOdds = n >= 6 ? 0.03 + 0.07 * k : 0;
    const add = (t, f, x, extra = {}) => spawns.push({ t, foe: f.id, x: clampX(x), ...(f.role !== 'swarm' && r() < eliteOdds ? { elite: true } : {}), ...extra });
    /** A group of `m` side by side (a swarm comes as three wherever it is). */
    const group = (t, m, x0, spread = 0.09) => {
      const f = pick();
      // A swarm comes as three (two in the first three levels, where three swamped a Tier 1 six).
      const many = f.role === 'swarm' ? (n <= 3 ? 2 : Math.max(3, m)) : m;
      for (let i = 0; i < many; i++) add(t + i * 0.5, i && f.role !== 'swarm' ? pick() : f, x0 + (i - (many - 1) / 2) * spread);
    };
    /** A steady stream: groups of one to three, more often the further in, every `gap` seconds. */
    const stream = (from, to, gap) => {
      let t = from;
      while (t < to) {
        const m = n > 4 && r() < 0.15 + k * 0.25 ? 2 : 1;
        group(t, m, 0.12 + r() * 0.76);
        t += gap * (0.75 + r() * 0.5);
      }
    };
    // How many come at once in a rush: three at first, up to twelve in the later worlds (the old
    // cap of about ten on the field is gone: Sam, 18 Nov, "there can be more leeway there").
    const rushSize = Math.min(12, 3 + Math.floor(n / 6) + 2 * (st - 1));
    const hordeSize = Math.min(22, 8 + Math.floor(n / 3) + 2 * (st - 1));
    const pattern = boss ? 'boss' : patternOf(world, n);
    const garrison = [];
    let onlyRally = null;
    if (fresh && pattern !== 'rush' && pattern !== 'champion') add(2, fresh, 0.35 + r() * 0.3);
    if (pattern === 'stream') stream(4.5, length, every);
    else if (pattern === 'rush') {
      // Everyone at once, in a line across the field (the newest among them), then a slow trickle
      // and a second rush.
      const line = lanes(rushSize);
      line.forEach((x, i) => add(3 + i * 0.15, i === Math.floor(rushSize / 2) && fresh ? fresh : pick(), x, i ? {} : { announce: 'Here they come!' }));
      stream(24, 70, every * 1.6);
      lanes(Math.min(9, rushSize + 1)).forEach((x, i) => add(72 + i * 0.15, pick(), x, i ? {} : { announce: 'Another rush!' }));
      stream(90, length, every * 1.4);
    } else if (pattern === 'waves') {
      // Quiet, then a wave; quiet, then a bigger one.
      let t = 6, wave = 1;
      while (t < length) {
        const m = Math.min(12, 3 + Math.floor(n / 8) + 2 * (st - 1) + Math.floor(wave / 2));
        for (let i = 0; i < m; i++) add(t + i * 0.6, pick(), 0.1 + r() * 0.8, i ? {} : { announce: `Wave ${wave}` });
        t += 24 + r() * 6;
        wave++;
      }
    } else if (pattern === 'ambush') {
      // A trickle of ones, then a crowd from both edges at once.
      stream(5, 38, every * 1.7);
      const m = rushSize;
      for (let i = 0; i < m; i++) add(40 + (i % 2) * 0.2 + Math.floor(i / 2) * 0.4, pick(), i % 2 ? 0.88 - Math.floor(i / 2) * 0.05 : 0.12 + Math.floor(i / 2) * 0.05, i ? {} : { announce: 'Ambush!' });
      stream(52, length, every * 1.15);
    } else if (pattern === 'flanks') {
      // In pairs down both edges, leaving the middle open.
      let t = 4.5;
      while (t < length) {
        add(t, pick(), 0.1 + r() * 0.08);
        add(t + 0.4, pick(), 0.9 - r() * 0.08);
        t += every * 1.25 * (0.8 + r() * 0.4);
      }
    } else if (pattern === 'escort') {
      // A tough one in front with shooters behind it.
      const front = pool.filter((e) => ['tank', 'brute', 'grunt'].includes(e.role));
      const back = pool.filter((e) => ['ranged', 'caster'].includes(e.role));
      let t = 4.5;
      while (t < length) {
        const x = 0.2 + r() * 0.6;
        add(t, front.length ? front[Math.floor(r() * front.length)] : pick(), x);
        const b = Math.min(3, 1 + Math.floor(n / 15));
        for (let i = 0; i < b; i++) add(t + 1.4 + i * 0.3, back.length ? back[Math.floor(r() * back.length)] : pick(), x + (i - (b - 1) / 2) * 0.1);
        t += every * 1.9 * (0.8 + r() * 0.4);
      }
    } else if (pattern === 'champion') {
      // One huge, strong enemy (two side by side from level 15), and nothing else for a long while:
      // a champion has three times the stats, stands a size and a half up and hits two at once.
      const plain = pool.filter((e) => e.role !== 'swarm' && !['burrow', 'cloak'].includes(traitOf(e.id)));
      const big = theme && plain.some(themed) ? plain.filter(themed) : plain;
      const one = () => (big.length ? big[Math.floor(r() * big.length)] : pick());
      const two = n >= 15;
      // The same one or two kinds all level, and they are its only defenders too.
      const a = fresh && fresh.role !== 'swarm' && !['burrow', 'cloak'].includes(traitOf(fresh.id)) ? fresh : one();
      let b = one();
      for (let i = 0; i < 4 && b === a && big.length > 1; i++) b = one();
      const champs = (t, text) => {
        add(t, a, two ? 0.32 : 0.5, { champ: true, mul: two ? 2.3 : 3, elite: false, announce: text });
        if (two) add(t + 0.5, b, 0.68, { champ: true, mul: 2.3, elite: false });
      };
      champs(5, two ? 'Two champions!' : 'A champion!');
      champs(75, two ? 'Two more champions!' : 'Another champion!');
      champs(145, two ? 'Two more champions!' : 'Another champion!');
      onlyRally = two ? [a.id, b.id] : [a.id];
    } else if (pattern === 'horde') {
      // A crowd of weak ones all at once, in rows across the whole width; a lull with a few, then a
      // bigger crowd. Each is a little under half as strong as usual.
      const crowd = (t, m, text) => {
        for (let i = 0; i < m; i++) {
          const row = Math.floor(i / 8), col = i % 8;
          add(t + row * 0.6 + col * 0.04, pickOf(['swarm', 'grunt', 'runner']), 0.08 + (0.84 * col) / 7 + (row % 2 ? 0.05 : 0), { mul: 0.45, wide: true, row, elite: false, ...(i ? {} : { announce: text }) });
        }
      };
      crowd(4, hordeSize, 'A horde!');
      stream(28, 62, every * 2);
      crowd(68, Math.min(24, hordeSize + 3), 'Another horde!');
      stream(92, 126, every * 2);
      crowd(132, Math.min(26, hordeSize + 6), 'A bigger horde!');
    } else if (pattern === 'fortress') {
      // A quiet camp, until your beasts touch their pile: then its whole garrison comes out at once
      // (a champion with it from level 15).
      stream(5, length, every * 2.4);
      const m = Math.min(14, 5 + Math.floor(n / 5) + 2 * (st - 1));
      for (let i = 0; i < m; i++) garrison.push({ foe: pick().id, x: 0.1 + (0.8 * (i % 7)) / 6, row: Math.floor(i / 7), wide: true });
      if (n >= 15) {
        const big = pool.filter((e) => e.role !== 'swarm');
        garrison.push({ foe: (big.length ? big[Math.floor(r() * big.length)] : pick()).id, x: 0.5, row: 2, wide: true, champ: true, mul: 2.3 });
      }
    } else if (pattern === 'tide') {
      // Slow at first, then faster and faster, in bigger groups.
      let t = 5, called = false;
      while (t < length) {
        const f = t / length;
        group(t, Math.min(4, 1 + Math.floor(f * 3 + r() * 0.8)), 0.15 + r() * 0.7);
        if (!called && t > 70) { spawns[spawns.length - 1].announce = 'The tide is rising!'; called = true; }
        t += every * (2.2 - 1.75 * f) * (0.8 + r() * 0.4);
      }
    } else {
      // A boss level: a thin stream, the boss at 20 s with a guard either side, then more.
      stream(4.5, length, every * 1.15);
      spawns.push({ t: 20, foe: bossFoe.id, x: 0.5, boss: true, announce: `${bossFoe.name}!` });
      add(20.5, pick(), 0.32);
      add(20.5, pick(), 0.68);
    }
    if (pattern !== 'horde' && pattern !== 'champion') {
      // An opening group at once, across their camp.
      const m = Math.min(5, 2 + Math.floor(n / 10) + (st - 1));
      for (let i = 0; i < m; i++) add(0.6 + i * 0.25, pick(), 0.15 + (0.7 * i) / Math.max(1, m - 1), i ? {} : { announce: n > 3 ? 'Here they come!' : null });
    }
    if (n >= 4) for (const s of spawns) {
      if (s.boss || s.champ || s.wide || s.t < 3) continue;
      const e = E.find((x) => x.id === s.foe);
      const flier = e.look && e.look.plan === 'float';
      if ((e.role === 'runner' || e.role === 'swarm' || flier) && r() < 0.14 + 0.14 * k) s.side = r() < 0.5 ? 'L' : 'R';
      else if ((e.role === 'caster' || e.role === 'ranged') && r() < 0.1 + 0.1 * k) s.portal = true;
    }
    spawns.sort((a, b) => a.t - b.t);
    // Defenders who come out when their coin pile is being emptied (at 10 s and at 5 s left).
    const rally = onlyRally || (n < 2 ? [pick().id] : [pick().id, pick().id, n > 10 ? pick().id : null, n > 25 ? pick().id : null].filter(Boolean));
    const p = LEVEL_POINTS[`${world}-${n}`];
    // How many of them can be on the field at once: more than before (it was about ten at most),
    // and most on the levels where they come in crowds.
    const room = 6 + Math.floor(n / 6) + 2 * (st - 1);
    const crowded = { rush: rushSize + 3, ambush: rushSize + 3, waves: rushSize + 4, horde: hordeSize + 6, tide: room + 4 }[pattern] || 0;
    return {
      id: `${world}-${n}`, world, n, boss, points: p || points, spawns, rally, garrison, rule, theme,
      maxEnemies: Math.min(28, Math.max(room, crowded)),
      pattern,
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
    { id: 'first_win', name: 'First Blood', desc: 'Win your first battle.', test: (b) => b.clears >= 1, reward: { crates: 1 } },
    { id: 'clear_10', name: 'Warming Up', desc: 'Clear 10 levels.', test: (b) => b.clears >= 10, reward: { crates: 5 } },
    { id: 'clear_40', name: 'Seasoned', desc: 'Clear 40 levels.', test: (b) => b.clears >= 40, reward: { premium: 2, cap: 15 } },
    { id: 'clear_80', name: 'Veteran', desc: 'Clear 80 levels.', test: (b) => b.clears >= 80, reward: { premium: 4, cap: 18 } },
    { id: 'clear_120', name: 'Conqueror', desc: 'Clear 120 levels.', test: (b) => b.clears >= 120, reward: { premium: 10 } },
    { id: 'stars_5', name: 'Quick Paws', desc: 'Earn 5 stars.', test: (b) => b.stars >= 5, reward: { spins: 1 } },
    { id: 'stars_25', name: 'Speed Runner', desc: 'Earn 25 stars.', test: (b) => b.stars >= 25, reward: { premium: 2, cap: 15 } },
    { id: 'stars_60', name: 'Star Hoarder', desc: 'Earn 60 stars.', test: (b) => b.stars >= 60, reward: { premium: 4, cap: 18 } },
    { id: 'stars_120', name: 'Constellation', desc: 'Earn 120 stars.', test: (b) => b.stars >= 120, reward: { premium: 12 } },
    { id: 'boss_1', name: 'Giant Slayer', desc: 'Beat a boss.', test: (b) => b.bosses >= 1, reward: { premium: 1, cap: 15 } },
    { id: 'boss_6', name: 'Boss Hunter', desc: 'Beat 6 bosses.', test: (b) => b.bosses >= 6, reward: { premium: 3, cap: 15 } },
    { id: 'boss_12', name: 'Kingbreaker', desc: 'Beat 12 bosses.', test: (b) => b.bosses >= 12, reward: { premium: 8 } },
    { id: 'world_1', name: 'Dawn', desc: 'Clear the Shadow Wilds.', test: (b) => b.worlds >= 1, reward: { premium: 3, cap: 15 } },
    { id: 'world_2', name: 'Uncrowned', desc: 'Clear the Iron Kingdom.', test: (b) => b.worlds >= 2, reward: { premium: 5, cap: 18 } },
    { id: 'world_3', name: 'Invaders Repelled', desc: 'Clear the Star Invasion.', test: (b) => b.worlds >= 3, reward: { premium: 8 } },
    { id: 'blitz', name: 'Blitz', desc: 'Win a level from level 10 on in under 40 seconds.', test: (b) => b.blitz, reward: { spins: 2 } },
    { id: 'underdog', name: 'Underdog', desc: 'Beat a boss with no beast above Tier 8.', test: (b) => b.underdog, reward: { premium: 3, cap: 15 } },
    { id: 'flawless', name: 'Untouched', desc: 'Win a level from level 5 on with your coin pile full.', test: (b) => b.flawless >= 1, reward: { crates: 3 } },
    { id: 'flawless_10', name: 'Fortress', desc: 'Win 10 levels from level 5 on with your coin pile full.', test: (b) => b.flawless >= 10, reward: { premium: 3, cap: 15 } },
    { id: 'foes_50', name: 'Field Notes', desc: 'Meet 50 kinds of enemy.', test: (b) => b.seen >= 50, reward: { spins: 2 } },
    { id: 'foes_120', name: 'Know Your Enemy', desc: 'Meet 120 kinds of enemy.', test: (b) => b.seen >= 120, reward: { premium: 5, cap: 18 } },
    { id: 'world_4', name: 'Moonrise', desc: 'Clear the Moon Hollows.', test: (b) => b.lgWorlds >= 1, reward: { premium: 3, cap: 15 } },
    { id: 'world_5', name: 'Scuttled', desc: 'Clear the Ring Pirates.', test: (b) => b.lgWorlds >= 2, reward: { premium: 5, cap: 18 } },
    { id: 'world_6', name: 'Dawn Breaks', desc: 'Clear the Eclipse Court.', test: (b) => b.lgWorlds >= 3, reward: { premium: 10 } },
    { id: 'clear_240', name: 'Two Universes', desc: 'Clear all 240 levels.', test: (b) => b.clears >= 240, reward: { premium: 15 } },
    { id: 'boss_24', name: 'Slayer of Kings', desc: 'Beat all 24 bosses.', test: (b) => b.bosses >= 24, reward: { premium: 12 } },
    { id: 'foes_all', name: 'Bestiary Complete', desc: 'Meet every enemy in both systems.', test: (b) => b.seen >= 192, reward: { premium: 8 } },
    { id: 'perk_fury', name: 'Purebred', desc: 'Win a level from level 5 on with beasts of one element.', test: (b) => !!b.perkWon.fury, reward: { perk: 'fury' } },
    { id: 'perk_rally', name: 'Trio', desc: 'Win a level from level 10 on bringing only three beasts.', test: (b) => !!b.perkWon.rally, reward: { perk: 'rally' } },
    { id: 'perk_fortify', name: 'Iron Vault', desc: 'Beat a boss with your coin pile full.', test: (b) => !!b.perkWon.fortify, reward: { perk: 'fortify' } },
    { id: 'perk_wellspring', name: 'Never Idle', desc: 'Win a level from level 10 on without your mana ever filling up.', test: (b) => !!b.perkWon.wellspring, reward: { perk: 'wellspring' } },
    { id: 'perk_deep_pool', name: 'Patience', desc: 'Win a level from level 10 on playing twelve beasts or fewer.', test: (b) => !!b.perkWon.deep_pool, reward: { perk: 'deep_pool' } },
    // (1.5, Sam: late rewards that matter; comet eggs join these once the comet is built.)
    { id: 'world_7', name: 'Mutation Ended', desc: 'Clear the Universal Mutants.', test: (b) => (b.w7 || 0) >= 1, reward: { income: 360, boost: { mult: 1.5, minutes: 180 }, shards: 600 } },
    { id: 'world_8', name: 'Apex Predator', desc: 'Clear the Apex Mutants.', test: (b) => (b.w8 || 0) >= 1, reward: { income: 720, boost: { mult: 2, minutes: 180 }, shards: 1500 } },
    { id: 'apex_bosses', name: 'Giant Slayer', desc: "Beat all eleven of World 8's giants.", test: (b) => (b.apexBosses || 0) >= 11, reward: { income: 480, boost: { mult: 1.5, minutes: 240 }, shards: 900 } },
    { id: 'mutant_bosses', name: 'Monster Hunter', desc: "Beat all ten of World 7's bosses.", test: (b) => (b.mutantBosses || 0) >= 10, reward: { income: 240, boost: { mult: 1.5, minutes: 120 }, shards: 360 } },
    { id: 'all_ach', name: 'Grand Master', desc: 'Earn every other battle achievement.', test: (b) => b.achTotal > 0 && b.achDone >= b.achTotal, reward: { legend: 'paper_kirin' } },
  ];
  /** The highest tier a boss level's premium crate can hold, by world. */
  const BOSS_CRATE_CAP = { 1: 15, 2: 15, 3: 18, 4: 15, 5: 18, 6: 20, 7: 20, 8: 20 };

  /** Perks: one before a battle. */
  const PERKS = [
    { id: 'fury', name: 'Fury', desc: 'Every third swing is a heavy one, not every fifth.', opts: { fury: true }, unlock: (t) => !!(t.perkWon || {}).fury, how: 'Win from level 5 on with beasts of one element' },
    { id: 'rally', name: 'Rally', desc: 'Cards rest a quarter less.', opts: { rest: 0.75 }, unlock: (t) => !!(t.perkWon || {}).rally, how: 'Win from level 10 on bringing only three beasts' },
    { id: 'fortify', name: 'Fortify', desc: 'Your coin pile holds 20 seconds.', opts: { pile: 20 }, unlock: (t) => !!(t.perkWon || {}).fortify, how: 'Beat a boss with your coin pile full' },
    { id: 'wellspring', name: 'Wellspring', desc: 'Mana fills a quarter faster.', opts: { manaRegen: 1.25 }, unlock: (t) => !!(t.perkWon || {}).wellspring, how: 'Win from level 10 on without your mana ever filling up' },
    { id: 'deep_pool', name: 'Deep Pool', desc: 'Hold up to 65 mana.', opts: { manaMax: 65 }, unlock: (t) => !!(t.perkWon || {}).deep_pool, how: 'Win from level 10 on playing twelve beasts or fewer' },
  ];

  return {
    PERKS, BOSS_CRATE_CAP, PATTERNS, patternOf, stage, expect, RULES, DECK_RULES, ruleAllows, THEMES, LEGENDS, LEGEND_LIST, T, legendEarned, legendProgress, enemySize,
    STATS, STAT_NAMES, RARITY_BONUS, ROLES, ENEMIES, ENEMY_LIST: E, WORLDS, BOSS_EVERY, ACHIEVEMENTS, STAR_TIMES, LEVEL_POINTS,
    hash, seeded, order, beastStats, battleNumbers, canBattle, systemOf, cooldownOf, COMET_REST, beastRadius,
    MANA, costOf, costOfTier, cometCost, syncStats, attackKind, enemyAttackKind, ABILITIES, abilityOf, TRAITS, traitOf,
    enemyStats, enemyRadius, level, levelPoints, difficulty, clearMinutes,
  };
})();

if (typeof module !== 'undefined') module.exports = BATTLE_DATA;
