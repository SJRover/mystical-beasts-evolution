const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, 'www');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 1.4: the battle music files at the root (any MP3 with "battle", "victory" or "defeat" in its
// name), listed for battle_audio.js by solar system and kind: Low Gravity if the name says so, a
// boss track if it says boss, victory and defeat music for the end of a battle; everything else
// is a Prime battle track.
// 1.5: World 7's own tracks (Sam: "BattleWorld7Music..."), by "world7" or "mutant" in the name.
const music = { prime: { casual: [], boss: [] }, low_gravity: { casual: [], boss: [] }, mutants: [], victory: [], defeat: [] };
for (const f of fs.readdirSync(__dirname).sort()) {
  const n = f.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!f.toLowerCase().endsWith('.mp3') || !(n.includes('battle') || n.includes('victory') || n.includes('defeat'))) continue;
  if (n.includes('victory') || n.includes('win')) { music.victory.push(f); continue; }
  if (n.includes('defeat') || n.includes('lose')) { music.defeat.push(f); continue; }
  if (n.includes('world7') || n.includes('mutant')) { music.mutants.push(f); continue; }
  const sys = n.includes('lowgravity') ? 'low_gravity' : 'prime';
  music[sys][n.includes('boss') ? 'boss' : 'casual'].push(f);
}
fs.writeFileSync(path.join(__dirname, 'battle_music.json'), JSON.stringify(music, null, 1));
console.log('battle_music.json:', JSON.stringify(music));

const files = fs.readdirSync(__dirname).filter(file => {
  const ext = path.extname(file).toLowerCase();
  return ['.html', '.css', '.js', '.png', '.mp3', '.json'].includes(ext) && !['package.json', 'package-lock.json', 'capacitor.config.json'].includes(file) && file !== 'build.js' && file !== 'generate_native_icon.js';
});

files.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(destDir, file);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${file} to www/`);
});
console.log('Build complete: Web assets synchronized to www/');
