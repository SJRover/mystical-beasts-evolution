// node tools/oldways.mjs [8-6,8-11,...]: can the best old six (no comet beasts) win these levels at their tuned strengths?
// The Old Ways levels with the best old six, the first three evolved and their specials fired as
// tools/strategies.mjs 'evolved' does (crowds, bosses near, or the beast hurt). Five lane patterns.
import { refDeck, DATA as D, ENGINE as BE } from './battle_sim.mjs';
import fs from 'node:fs';
const hard = JSON.parse(fs.readFileSync(new URL('./calib/hard.json', import.meta.url), 'utf8'));
function playSp(level, deck, variant) {
  const b = new BE.Battle(level, deck, {});
  const lanes = [[0.3, 0.7, 0.5, 0.18, 0.82, 0.42, 0.58], [0.5, 0.25, 0.75, 0.4, 0.6], [0.2, 0.2, 0.8, 0.8, 0.5], [0.15, 0.85, 0.3, 0.7], [0.45, 0.55, 0.35, 0.65, 0.5]][variant];
  let lane = 0;
  while (!b.result && b.time < 400) {
    for (let i = 0; i < b.cards.length; i++) {
      if (!b.canDeploy(i)) continue;
      const near = b.foes.filter((u) => u.y > 900).sort((a, c) => c.y - a.y)[0];
      b.deploy(i, near ? near.x / BE.ARENA.w : lanes[lane++ % lanes.length]);
    }
    for (let i = 0; i < b.cards.length; i++) {
      if (!b.canSpecial(i)) continue;
      const crowd = (u) => b.foes.filter((o) => Math.hypot(o.x - u.x, o.y - u.y) < 260).length;
      const u = b.onField(i).sort((a, c) => crowd(c) - crowd(a))[0];
      if (crowd(u) >= 2 || b.foes.some((o) => o.boss && Math.hypot(o.x - u.x, o.y - u.y) < 300) || u.hp < u.maxHp * 0.4) b.special(i, u);
    }
    b.step(0.05); b.drain();
  }
  return b.result || 'timeout';
}
for (const id of (process.argv[2] || "7-9,7-20,8-8,8-9,8-20").split(",")) {
  const [w, n] = id.split('-').map(Number);
  const plain = refDeck(w, n, 0, { noComet: true });
  const evo = plain.map((c, i) => ({ ...c, evolved: i < 3 }));
  const res = (deck, mul) => [0, 1, 2, 3, 4].map((v) => playSp({ ...D.level(w, n), foeMul: mul }, deck, v) === 'won' ? 'W' : '-').join('');
  const out = [`plain ${res(plain, hard[id])}`, `evolved+specials ${res(evo, hard[id])}`];
  // How much weaker the level would have to be for the evolved old six to win a pattern.
  let m = hard[id]; for (let s = 0; s < 12 && !res(evo, m).includes('W'); s++) m /= 1.03;
  console.log(id, 'x' + hard[id], out.join('  '), ' evolved old six first wins at x' + m.toFixed(3));
}
