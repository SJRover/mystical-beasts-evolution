// Battle balance: a bot plays every level with the deck a player would have by then, and with a
// weaker one. `node tools/battle_sim.mjs [world] [--weaker 3] [--json out.json]`.
//
// The deck "a player would have" (refDeck) is our assumption of progress, written down here so
// it can be argued with: World 1 from Tier 1 at level 1 to about Tier 17 at level 40, before any
// prestige, Commons and Rares early, better later; World 2 Tier 14 to 20, up to Legendary, a few
// prestiges; World 3 Tier 18 to 20, up to Godly, several prestiges. Every level must be won with
// it; a deck three tiers weaker should lose a fair share, or the level is not a challenge.
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({ console, Math });
ctx.window = ctx;
const calibrate = process.argv.includes('--calibrate');
for (const f of ['beasts.js', 'battle_data.js', 'battle_engine.js', ...(calibrate || !fs.existsSync(path.join(root, 'battle_levels.js')) ? [] : ['battle_levels.js'])]) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const { BATTLE_DATA: D, BattleEngine: BE, BEAST_TEMPLATES: T } = vm.runInContext('({ BATTLE_DATA, BattleEngine, BEAST_TEMPLATES })', ctx);

const args = process.argv.slice(2);
const onlyWorld = Number(args.find((a) => /^\d+$/.test(a))) || 0;
const weaker = args.includes('--weaker') ? Number(args[args.indexOf('--weaker') + 1]) : 3;
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;

const RANK = ['COMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE', 'LEGENDARY', 'GODLY', 'DARK_MATTER'];
export function progress(world, n) {
  // One climb across all 120 Prime levels: Tier 1 at the start to Tier 13 or so by the end of
  // World 1 (before any prestige), Tier 20 by the middle of World 2, then prestige doing the rest.
  const i = (world - 1) * 40 + n;
  const rarity = i < 10 ? 'RARE' : i < 25 ? 'SUPER_RARE' : i < 40 ? 'ULTRA_RARE' : i < 60 ? 'LEGENDARY' : i < 95 ? 'GODLY' : 'DARK_MATTER';
  return { tier: Math.min(20, 1 + (i - 1) * 0.31), rarity, prestige: i <= 40 ? 0 : Math.floor((i - 40) / 6) };
}

/** Six different beasts of the world's system, around tier `tier`, no rarer than `rarity`. */
export function refDeck(world, n, tierShift = 0) {
  const pr = progress(world, n);
  const sys = D.WORLDS[world - 1].system;
  const top = Math.max(1, Math.round(pr.tier) + tierShift);
  const maxRank = RANK.indexOf(pr.rarity);
  const all = Object.keys(T).filter((id) => D.canBattle(id) && D.systemOf(id) === sys);
  const deck = [];
  for (const want of [top, top, top - 1, top - 1, top - 2, top - 3]) {
    const tier = Math.max(1, want);
    const options = all.filter((id) => !deck.includes(id) && T[id].tier <= tier && RANK.indexOf(T[id].rarity) <= maxRank)
      .sort((a, b) => T[b].tier - T[a].tier || RANK.indexOf(T[b].rarity) - RANK.indexOf(T[a].rarity));
    if (options.length) deck.push(options[0]);
  }
  return deck.map((id) => ({ id, prestige: pr.prestige }));
}

/** The bot: plays every ready card, highest tier first, where the most forward enemy is, else across the lanes. */
export function play(level, deck, opts = {}) {
  const b = new BE.Battle(level, deck, opts);
  const lanes = [[0.3, 0.7, 0.5, 0.18, 0.82, 0.42, 0.58], [0.5, 0.25, 0.75, 0.4, 0.6], [0.2, 0.2, 0.8, 0.8, 0.5], [0.15, 0.85, 0.3, 0.7], [0.45, 0.55, 0.35, 0.65, 0.5]][opts.variant || 0];
  let lane = 0;
  const order = deck.map((c, i) => i).sort((a, c) => T[deck[c].id].tier - T[deck[a].id].tier);
  while (!b.result && b.time < 400) {
    for (const i of order) {
      if (!b.canDeploy(i)) continue;
      const near = b.foes.filter((u) => u.y > 900).sort((a, c) => c.y - a.y)[0];
      const x = near ? near.x / BE.ARENA.w : lanes[lane++ % lanes.length];
      b.deploy(i, x);
    }
    b.step(0.05);
    b.drain();
  }
  return { result: b.result || 'timeout', time: Math.round(b.time), pileLeft: +b.piles.you.toFixed(1), foePile: +b.piles.foe.toFixed(1) };
}

/** Whether the deck beats the level at `p` points: two of three ways of playing win with pile to spare. */
function beats(lv, deck, p, need = 2, of = 3) {
  let wins = 0;
  for (let variant = 0; variant < of; variant++) { const r = play({ ...lv, points: p }, deck, { variant }); if (r.result === 'won' && r.pileLeft >= 3) wins++; }
  return wins >= need;
}
/** The strongest enemies (level points) the deck still beats: up in steps until it fails twice running. */
function strongest(lv, deck) {
  let p = 2, last = 2, fails = 0;
  if (!beats(lv, deck, p)) return p;
  while (p < 600 && fails < 2) {
    p *= 1.07;
    if (beats(lv, deck, p)) { last = p; fails = 0; } else fails++;
  }
  return last;
}
/** How close to the most the reference deck can beat each level sits: kind first, tough at bosses. */
function margin(n, boss, levels) {
  if (boss) return 0.9;
  if (n <= 3) return 0.5;
  if (n <= 8) return 0.7;
  return 0.78 + 0.08 * (n / levels);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain && calibrate) {
  const points = {}, stars = {};
  for (const w of D.WORLDS) {
    // The most each level's reference deck beats, then smoothed along the world (a median of five,
    // then never falling more than a little), so the climb is steady.
    const lvls = [], most = [];
    for (let n = 1; n <= w.levels; n++) { const lv = D.level(w.id, n); lvls.push(lv); most.push(strongest(lv, refDeck(w.id, n))); }
    const med = most.map((_, i) => { const a = most.slice(Math.max(0, i - 2), i + 3).sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; });
    for (let i = 1; i < med.length; i++) med[i] = Math.max(med[i], med[i - 1] * 0.97);
    for (let i = 0; i < lvls.length; i++) {
      const lv = lvls[i], n = i + 1, deck = refDeck(w.id, n);
      let p = med[i] * margin(n, lv.boss, w.levels);
      // Every level winnable: three of five ways of playing must win, or it is eased.
      let eased = 0;
      while (!beats(lv, deck, p, 3, 5) && p > 2) { p *= 0.92; eased++; }
      const times = [0, 1, 2, 3, 4].map((variant) => play({ ...lv, points: p }, deck, { variant })).filter((r) => r.result === 'won').map((r) => r.time).sort((x, y) => x - y);
      points[lv.id] = +p.toFixed(2);
      stars[lv.id] = Math.max(30, Math.ceil(((times[Math.floor(times.length / 2)] || 120) * 1.2) / 5) * 5);
      console.log(`${lv.id.padEnd(5)} most ${most[i].toFixed(1).padStart(6)} smooth ${med[i].toFixed(1).padStart(6)} set ${p.toFixed(1).padStart(6)}${eased ? ' eased ' + eased : ''}  wins ${times.length}/5  star ${stars[lv.id]}s`);
    }
  }
  const out = `// Made by tools/battle_sim.mjs --calibrate: each level's enemy points and its star time.
// Do not edit by hand; change the progress model or the margins there and run it again.
Object.assign(BATTLE_DATA.LEVEL_POINTS, ${JSON.stringify(points)});
Object.assign(BATTLE_DATA.STAR_TIMES, ${JSON.stringify(stars)});
`;
  fs.writeFileSync(path.join(root, 'battle_levels.js'), out);
  console.log('wrote battle_levels.js');
} else if (isMain) {
  const rows = [];
  for (const w of D.WORLDS) {
    if (onlyWorld && w.id !== onlyWorld) continue;
    let fails = 0, easy = 0;
    for (let n = 1; n <= w.levels; n++) {
      const lv = D.level(w.id, n);
      const ref = play(lv, refDeck(w.id, n));
      const weak = play(lv, refDeck(w.id, n, -weaker));
      if (ref.result !== 'won') fails++;
      if (weak.result === 'won') easy++;
      const deck = refDeck(w.id, n).map((c) => `${T[c.id].tier}`).join(',');
      rows.push({ level: lv.id, points: +lv.points.toFixed(1), deck, ref, weak });
      console.log(`${lv.id.padEnd(5)} pts ${lv.points.toFixed(1).padStart(5)}${lv.boss ? ' BOSS' : '     '} deck T[${deck}] P${refDeck(w.id, n)[0].prestige}`.padEnd(48),
        `ref ${ref.result} ${String(ref.time).padStart(3)}s pile ${String(ref.pileLeft).padStart(4)}`.padEnd(30),
        `weaker ${weak.result} ${weak.time}s`);
    }
    console.log(`World ${w.id}: ${fails} levels lost with the reference deck, ${easy} of ${w.levels} won by a deck ${weaker} tiers weaker\n`);
  }
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(rows, null, 1));
}
