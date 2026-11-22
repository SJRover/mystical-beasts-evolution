// Levels too few ways of playing win, or only slowly: their enemy points lowered 8% at a time in
// the calibration (tools/calib/world-N.json, then --merge) until NEED of the six ways in
// tools/strategies.mjs win (2 by default), the fastest within MAXT seconds (any by default). The
// star is then set from the fastest win, as calibration sets it.
//   node tools/ease.mjs 4-31 5-10
//   NEED=3 MAXT=150 node tools/ease.mjs 1-2
//   PMUL=0.5 node tools/ease.mjs 3-34     (with half the expected prestige)
//   POINTS=9.4 node tools/ease.mjs 6-35   (start from these points)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const tools = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(tools, '..');
const need = Number(process.env.NEED || 2), maxT = Number(process.env.MAXT || 999);
const merge = () => execFileSync('node', ['tools/battle_sim.mjs', '--merge'], { cwd: root, encoding: 'utf8' });
const star = (f) => Math.min(150, Math.max(40, Math.ceil((f * 0.9) / 5) * 5));
for (const id of process.argv.slice(2)) {
  const file = path.join(tools, 'calib', `world-${id.split('-')[0]}.json`);
  const calib = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (process.env.POINTS) calib.points[id] = Number(process.env.POINTS);
  const start = calib.points[id];
  for (let k = 0; k < 12; k++) {
    fs.writeFileSync(file, JSON.stringify(calib));
    merge();
    const out = execFileSync('node', [path.join(tools, 'strategies.mjs'), id], { env: process.env, encoding: 'utf8' });
    const wins = [...out.matchAll(/:W(\d+)/g)].map((m) => Number(m[1]));
    console.log(id, calib.points[id], wins.length, out.trim().split('|')[1]);
    if (wins.length >= need && Math.min(...wins) <= maxT) {
      if (calib.points[id] !== start || calib.stars[id] < Math.min(...wins) * 0.9) { calib.stars[id] = star(Math.min(...wins)); console.log('  star', calib.stars[id]); }
      break;
    }
    calib.points[id] = +(calib.points[id] * 0.92).toFixed(2);
  }
  fs.writeFileSync(file, JSON.stringify(calib));
}
merge();
