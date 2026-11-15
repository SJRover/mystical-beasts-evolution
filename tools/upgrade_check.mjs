// The 1.2.2 -> 1.3 upgrade, the way a player gets it: plays the old version (checked out with
// `git worktree add old122 dd7dbc3`) until it has a lived-in save, then opens 1.3 on that save with
// the purchase plugin present, as on the phone, and reports whether the game came up.
// `node tools/upgrade_check.mjs path/to/cordova-plugin-purchase/www/store.js` (dev server on 5410).
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const { openTab } = await import(pathToFileURL('C:/Users/Samjo/OneDrive/Desktop/MineToAustralia/scripts/trailer/cdp.mjs').href);
const plugin = readFileSync(process.argv[2] || new URL('../node_modules/cordova-plugin-purchase/www/store.js', import.meta.url), 'utf8');
const t = await openTab({ width: 390, height: 844, scale: 1, mobile: true });

// 1. The old game: past the tutorial, a busy field, incubators in use, a hub visit, a sanctuary.
await t.send('Page.navigate', { url: 'http://localhost:5410/old122/index.html' });
await t.sleep(2500);
await t.evaluate(`localStorage.clear(); 1`);
await t.send('Page.navigate', { url: 'http://localhost:5410/old122/index.html?fresh=1' });
await t.sleep(5000);
const old = await t.evaluate(`(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const click = (t) => { const b = [...document.querySelectorAll('button')].find((b) => b.offsetParent && b.textContent.trim() === t); if (b) b.click(); };
  click('Skip'); await sleep(800); click('Collect Earnings');
  state.isTutorialCompleted = true;
  state.essence = 3.2e9; state.prestigeLevel = 2;
  state.upgrades.meadowCapacity = 8; state.upgrades.crateSpeed = 3; state.upgrades.crateAutoOpener = 2;
  state.unlockedIncubators = [true, true, false];
  state.unlockedBeasts.push('ember', 'dewdrop', 'cinder', 'pyreling', 'ignis', 'chronos', 'phoenix');
  state.sanctuaryBeasts.push('phoenix', 'chronos'); // the game keeps beast ids here
  state.trophyCounts.chronos = 2;
  for (const [id, ev, inf] of [['ember', 0, 0], ['cinder', 1, 0], ['pyreling', 0, 1], ['ignis', 0, 0], ['chronos', 1, 0], ['phoenix', 0, 0], ['shadow_fiend', 0, 0]]) spawnBeastOnField(id, 10 + Math.random() * 70, 20 + Math.random() * 50, !!ev, !!inf);
  if (typeof spawnCrateOnField === 'function') { spawnCrateOnField(); spawnCrateOnField(); }
  state.incubators[0] = { active: true, beastType: 'ignis', timer: 6, maxTime: 15, complete: false, isInfected: false, evolvedState: false };
  state.incubators[1] = { active: true, beastType: 'pyreling', timer: 15, maxTime: 15, complete: true, isInfected: true, evolvedState: false };
  state.lastTrashedBeast = { type: 'ember', evolved: false, infected: false };
  state.lastSaved = Date.now() - 3600 * 1000;
  await sleep(1500);
  saveGame();
  const raw = localStorage.getItem('mystic_beasts_evolution_save');
  // saveGame stamps lastSaved now; push it back an hour so 1.3 also shows offline earnings.
  const s = JSON.parse(raw); s.lastSaved = Date.now() - 3600 * 1000; localStorage.setItem('mystic_beasts_evolution_save', JSON.stringify(s));
  return { beasts: s.primeSystem ? s.primeSystem.beastsOnField.length : (s.beastsOnField || []).length, bytes: raw.length };
})()`);
console.log('1.2.2 save:', JSON.stringify(old));

// 2. 1.3 on that save, with the plugin defined before the game's scripts, as in the iOS app.
await t.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__errs = []; addEventListener('error', (e) => __errs.push(e.message + ' @ ' + (e.filename || '').split('/').pop() + ':' + e.lineno + ':' + e.colno + ' | ' + ((e.error && e.error.stack) || '').split('\\n').slice(1, 6).join(' <- ')));\nwindow.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', Plugins: {} };\n${plugin}` });
await t.send('Page.navigate', { url: 'http://localhost:5410/?upgrade=1' });
await t.sleep(7000);
const r = await t.evaluate(`(() => ({
  booted: !!window.__mbBooted,
  bootError: !!document.getElementById('boot-error'),
  biomePainted: !!document.querySelector('#meadow-bg canvas.biome-canvas'),
  beasts: document.querySelectorAll('.beast-container').length,
  pictures: document.querySelectorAll('.beast-container .beast-sprite').length,
  incubator1: (document.getElementById('incubator-slot-render') || {}).innerHTML ? 'has beast' : 'empty',
  essence: (document.getElementById('essence-display') || {}).textContent,
  popup: [...document.querySelectorAll('button')].filter((b) => b.offsetParent).map((b) => b.textContent.trim()).filter((s) => /Collect|Earn/i.test(s)),
}))()`);
console.log('1.3 on it:', JSON.stringify(r));
console.log('page errors:', t.errors.length ? t.errors : 'none');
console.log('error events:', JSON.stringify(await t.evaluate(`window.__errs || []`)));
await t.close();
process.exit(0);
