// Every level of a world played six ways, with the six a player would have by then (as
// tools/battle_sim.mjs chooses it: the strongest allowed beasts of the expected tier, rarity and
// prestige), with mana, evolved specials and the level's rules: to find levels one way of playing
// walks through or that no way wins.
//   node tools/strategies.mjs 3            a whole world
//   node tools/strategies.mjs 3 --weaker 3 the same with a six three tiers weaker
//   node tools/strategies.mjs 3-34         one level
// PMUL=0.5 plays with half the expected prestige (Quick cards levels, where prestige is all).
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.ENG || path.join(path.dirname(fileURLToPath(import.meta.url)), '..') + path.sep;
const ctx = vm.createContext({ console, Math }); ctx.window = ctx;
for (const f of ['beasts.js', 'battle_data.js', 'battle_engine.js', 'battle_levels.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const { BATTLE_DATA: D, BattleEngine: BE, BEAST_TEMPLATES: T } = vm.runInContext('({ BATTLE_DATA, BattleEngine, BEAST_TEMPLATES })', ctx);
const RANK = ['COMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE', 'LEGENDARY', 'GODLY', 'DARK_MATTER'];
const arg = process.argv[2] || '1';
const weaker = process.argv.includes('--weaker') ? Number(process.argv[process.argv.indexOf('--weaker') + 1]) : 0;
const pmul = process.env.PMUL ? Number(process.env.PMUL) : 1;

export function deckFor(w, n, shift = 0) {
  const pr = { ...D.expect(w, n) };
  pr.prestige = Math.round(pr.prestige * pmul);
  const sys = D.WORLDS[w - 1].system;
  const rule = D.level(w, n).rule;
  const top = Math.max(1, Math.round(pr.tier) + shift);
  const all = Object.keys(T).filter((id) => D.canBattle(id) && D.systemOf(id) === sys && D.ruleAllows(rule, id, D.beastStats(id, pr.prestige)));
  const pw = (id) => { const s = D.beastStats(id, pr.prestige); return s.atk * s.hp * (1 + 0.12 * (s.spd + s.rng)); };
  const deck = all.filter((id) => T[id].tier <= top && RANK.indexOf(T[id].rarity) <= RANK.indexOf(pr.rarity)).sort((a, b) => pw(b) - pw(a) || T[b].tier - T[a].tier);
  return deck.slice(0, rule && rule.kind === 'three' ? 3 : 6).map((id) => ({ id, prestige: pr.prestige }));
}

const fx = (u) => u.x / BE.ARENA.w;
/** The six ways of playing. Each is called every tick with the battle; it plays cards (b.deploy). */
const STRATS = {
  // Everything as soon as it is ready, the dearest first, where the nearest enemy is.
  spam(b) {
    const order = b.cards.map((c, i) => i).sort((a, c) => b.cards[c].cost - b.cards[a].cost);
    for (const i of order) if (b.canDeploy(i)) { const near = b.foes.filter((u) => u.y > 900).sort((a, c) => c.y - a.y)[0]; b.deploy(i, near ? fx(near) : 0.3 + Math.random() * 0.4); }
  },
  // The cheapest cards first, a flood across the lanes.
  cheap(b, s) {
    const order = b.cards.map((c, i) => i).sort((a, c) => b.cards[a].cost - b.cards[c].cost);
    for (const i of order) if (b.canDeploy(i)) b.deploy(i, [0.2, 0.5, 0.8][s.k++ % 3]);
  },
  // Save mana, then send a wave of the strongest together in one lane.
  save(b, s) {
    if (!s.wave && b.mana >= b.manaMax - 2) s.wave = true;
    if (s.wave) {
      const order = b.cards.map((c, i) => i).sort((a, c) => b.cards[c].cost - b.cards[a].cost);
      let played = 0;
      for (const i of order) if (b.canDeploy(i)) { b.deploy(i, s.lane); played++; }
      if (!played || b.mana < 3) { s.wave = false; s.lane = [0.3, 0.7, 0.5][s.k++ % 3]; }
    }
    // Anything at the pile is answered at once with the cheapest ready card.
    const danger = b.foes.find((u) => u.y > 1500);
    if (danger) { const i = b.cards.map((c, j) => j).filter((j) => b.canDeploy(j)).sort((a, c) => b.cards[a].cost - b.cards[c].cost)[0]; if (i != null) b.deploy(i, fx(danger)); }
  },
  // Hold until enemies are in your half, meet them there, then push with everything.
  defend(b, s) {
    const coming = b.foes.filter((u) => u.y > 1000).sort((a, c) => c.y - a.y);
    const pushing = b.foes.length === 0 || b.yours.length >= 5;
    for (let i = 0; i < b.cards.length; i++) {
      if (!b.canDeploy(i)) continue;
      if (coming.length) { b.deploy(i, fx(coming[0])); continue; }
      if (pushing || b.mana >= b.manaMax - 1) b.deploy(i, [0.3, 0.7][s.k++ % 2]);
    }
  },
  // Spam, with the first three as evolved forms, their specials used on crowds.
  evolved(b) {
    STRATS.spam(b);
    for (let i = 0; i < b.cards.length; i++) {
      if (!b.canSpecial(i)) continue;
      const crowd = (u) => b.foes.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) < 260).length;
      const u = b.onField(i).sort((a, c) => crowd(c) - crowd(a))[0];
      if (crowd(u) >= 2 || b.foes.some((o) => o.boss && Math.hypot(o.x - u.x, o.y - u.y) < 300) || u.hp < u.maxHp * 0.4) b.special(i, u);
    }
  },
  // Sneak: everything down the lane furthest from the enemies.
  lane(b) {
    const avg = b.foes.length ? b.foes.reduce((a, u) => a + u.x, 0) / b.foes.length : 500;
    const x = avg < 500 ? 0.9 : 0.1;
    for (let i = 0; i < b.cards.length; i++) if (b.canDeploy(i)) b.deploy(i, x);
  },
};

function play(level, deck, strat, evo) {
  const cards = deck.map((c, i) => ({ ...c, evolved: evo && i < 3 && !D.LEGENDS[c.id] }));
  const b = new BE.Battle(level, cards, {});
  const s = { k: 0, lane: 0.5, wave: false };
  while (!b.result && b.time < 300) { STRATS[strat](b, s); b.step(0.05); b.drain(); }
  return { r: b.result || 'stall', t: Math.round(b.time) };
}
const row = (lv, deck) => Object.keys(STRATS).map((k) => { const r = play(lv, deck, k, k === 'evolved'); return `${k}:${r.r === 'won' ? 'W' + r.t : r.r === 'lost' ? 'L' + r.t : 'S'}`; });

if (arg.includes('-')) {
  const [w, n] = arg.split('-').map(Number);
  const lv = D.level(w, n);
  console.log(lv.id, lv.points.toFixed(2), '|', row(lv, deckFor(w, n, -weaker)).join(' '));
} else {
  const world = Number(arg);
  const w = D.WORLDS[world - 1];
  console.log(`World ${world} ${weaker ? `(six ${weaker} tiers weaker)` : ''}${pmul !== 1 ? ` (prestige x${pmul})` : ''}: level pattern rule star | ` + Object.keys(STRATS).join(' '));
  const tally = Object.fromEntries(Object.keys(STRATS).map((k) => [k, 0]));
  for (let n = 1; n <= w.levels; n++) {
    const lv = D.level(world, n);
    const res = row(lv, deckFor(world, n, -weaker));
    res.forEach((x) => { if (x.includes(':W')) tally[x.split(':')[0]]++; });
    const wins = res.filter((x) => x.includes(':W')).length;
    const fastest = Math.min(...res.filter((x) => x.includes(':W')).map((x) => Number(x.split(':W')[1])), 999);
    const flag = wins === 0 ? ' << NONE WIN' : wins < 2 ? ' << one way' : fastest > 150 ? ' << slow' : '';
    console.log(`${lv.id.padEnd(5)} ${lv.pattern.padEnd(9)}${(lv.rule ? lv.rule.kind : '').padEnd(7)} ${String(lv.starTime).padStart(3)}s | ${res.join(' ')}${flag}`);
  }
  console.log('wins of', w.levels, JSON.stringify(tally));
}
