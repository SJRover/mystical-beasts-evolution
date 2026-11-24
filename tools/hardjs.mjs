// battle_hard.js from tools/calib/hard.json (tools/harden.mjs writes the JSON).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const j = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'calib', 'hard.json'), 'utf8'));
fs.writeFileSync(path.join(root, 'battle_hard.js'), `// Made by tools/harden.mjs (then tools/hardjs.mjs): how much stronger each World 7 and 8 level's\n// enemies are than calibrated, so the levels are super hard. Do not edit by hand.\nBATTLE_DATA.LEVEL_MUL = ${JSON.stringify(j)};\n`);
console.log('wrote battle_hard.js', Object.keys(j).length, 'levels');
