// Super hard (Sam, 24 Nov): after calibration, each World 7 and 8 level is made stronger or weaker
// until the simulator's bot (no specials, no aiming at weaknesses) wins it about as often as wanted:
// World 7 about one game in five with the best old beasts ("just about" with maxed beasts), World 8
// about one in ten with whatever deck does best there. In World 8 the bot tries three decks, the
// reference deck (three comet beasts, three old), the best six old beasts, and six comet beasts at the
// tier and rarity expected by then, and the level is judged by whichever does best, so no deck walks
// through it (the first version used only the reference deck, and the old six won the last levels
// every time). Battles have some chance in them, so each strength is judged over twelve games, and
// the one chosen is checked again over twenty-four fresh games and nudged if those disagree (a search
// that stops at the first good-looking twelve stops on lucky runs). Writes tools/calib/hard.json
// (level id: enemy multiplier); tools/hardjs.mjs turns it into battle_hard.js, which battle.js applies.
// node tools/harden.mjs [world] [--levels 7-4,8-1]   (starts each level from its current value)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { refDeck, play, DATA as D } from './battle_sim.mjs';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const only = Number(process.argv[2]) || 0;
const pick = process.argv.includes('--levels') ? process.argv[process.argv.indexOf('--levels') + 1].split(',') : null;
const GAMES = 12;
const WANT = { 7: [2, 3], 8: [1, 2] }; // wins of twelve: at least, at most
const CHECK = { 7: [3, 6], 8: [1, 4] }; // wins of the twenty-four checking games
const file = path.join(root, 'tools', 'calib', 'hard.json');
const out = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
for (const w of [7, 8]) {
  if (only && w !== only) continue;
  const [lo, hi] = WANT[w], [clo, chi] = CHECK[w];
  for (let n = 1; n <= 20; n++) {
    const base = D.level(w, n);
    if (pick && !pick.includes(base.id)) continue;
    const decks = w === 8 ? [refDeck(w, n), refDeck(w, n, 0, { noComet: true }), refDeck(w, n, 0, { allComet: true })] : [refDeck(w, n)];
    const winsWith = (m, deck, games) => Array.from({ length: games }, (_, v) => v).filter((v) => play({ ...base, foeMul: m }, deck, { variant: v % 5 }).result === 'won').length;
    const wins = (m, games = GAMES) => Math.max(...decks.map((d) => winsWith(m, d, games)));
    // Down from the start until the bot can win (it must be beatable), then up while it still wins too often.
    let m = out[base.id] || (w === 7 ? 1.1 : 1.0), k = wins(m), steps = 0;
    while (k < lo && m > 0.6 && steps++ < 20) { m /= 1.05; k = wins(m); }
    while (k > hi && m < 3 && steps++ < 30) {
      const m2 = m * 1.05, k2 = wins(m2);
      if (k2 < lo) {
        // One step more and the bot could not win it: look between the two more finely.
        let a = m, z = m2;
        for (let i = 0; i < 6; i++) {
          const mid = Math.sqrt(a * z), km = wins(mid);
          if (km > hi) a = mid; else if (km < lo) z = mid; else { m = mid; k = km; break; }
          if (i === 5) { m = a; k = wins(a); }
        }
        break;
      }
      m = m2; k = k2;
    }
    // The check: twenty-four fresh games; nudged a little until they agree.
    let c = wins(m, 24), nudges = 0;
    while ((c > chi || c < clo) && nudges++ < 8) { m = c > chi ? m * 1.03 : m / 1.03; c = wins(m, 24); }
    out[base.id] = +m.toFixed(3);
    console.log(`${base.id.padEnd(5)} ${base.name.padEnd(34)} x${m.toFixed(2)}  best deck wins ${c}/24`);
  }
}
fs.writeFileSync(file, JSON.stringify(out));
console.log('wrote', file);
