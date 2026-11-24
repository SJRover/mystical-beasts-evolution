// node tools/hardfloor.mjs (after harden.mjs, before hardjs.mjs)
// Levels no deck can win at all: ease them 3% at a time until some deck (incl. six top comets) wins a lane pattern.
import { refDeck, play, DATA as D } from './battle_sim.mjs';
import fs from 'node:fs';
const F = new URL('./calib/hard.json', import.meta.url);
const hard = JSON.parse(fs.readFileSync(F, 'utf8'));
const top6 = (n) => { const c = D.expect(8, n).comet; return ['singularity_dragon', 'ouroboros', 'quasar_phoenix', 'mind_leviathan', 'onyx_wyrm', 'chrononaut'].map((s) => ({ id: `${s}_${c.tier}`, prestige: c.prestige })).filter((x) => D.T(x.id)); };
for (let n = 1; n <= 20; n++) {
  const id = '8-' + n;
  const decks = [refDeck(8, n), refDeck(8, n, 0, { noComet: true }), refDeck(8, n, 0, { allComet: true }), top6(n)];
  const any = (m) => decks.map((d) => [0, 1, 2, 3, 4].filter((v) => play({ ...D.level(8, n), foeMul: m }, d, { variant: v }).result === 'won').length);
  let m = hard[id], r = any(m), s = 0;
  if (r.some((x) => x > 0)) continue;
  while (!r.some((x) => x > 0) && s++ < 15) { m /= 1.03; r = any(m); }
  console.log(id, 'x' + hard[id], '->', 'x' + m.toFixed(3), 'lane patterns won (ref, old, comets, top):', r.join(' '));
  hard[id] = +m.toFixed(3);
}
fs.writeFileSync(F, JSON.stringify(hard));
