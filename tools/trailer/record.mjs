// Films the 1.4 gameplay trailer from the real game, one frame at a time (dev server on 5410):
// `node record.mjs [shot ...]`. Each shot's frames go to frames/<shot>/0000.jpg ...; build.py
// puts them together with the music. The page runs on tw.js's clock, so every frame is exact.
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const { openTab } = await import(pathToFileURL('C:/Users/Samjo/OneDrive/Desktop/MineToAustralia/scripts/trailer/cdp.mjs').href);
const FPS = 30;
// The shots in order, with how many frames each is filmed for and how many it runs unseen first.
// Cuts sit on the bars of the music (110 bpm, a bar 2.183 s; see build.py).
export const PLAN = [
  { name: 'meadow', frames: 112 },
  { name: 'merge', frames: 131 },
  { name: 'crate', frames: 66 },
  { name: 'collection', frames: 65 },
  { name: 'worlds', frames: 66 },
  { name: 'battle', frames: 131, pre: 60 },
  { name: 'horde', frames: 131, pre: 75 },
  { name: 'boss', frames: 131, pre: 0, until: 'boss' },
  { name: 'end', frames: 67 },
];
const pick = process.argv.slice(2);
const tw = readFileSync(path.join(here, 'tw.js'), 'utf8');
const t = await openTab({ width: 443, height: 960, scale: 2, mobile: true, headless: true });
await t.send('Page.addScriptToEvaluateOnNewDocument', { source: tw });
const ev = (code) => t.evaluate(`(async () => { try { ${code} } catch (e) { return 'ERR ' + e.message + ' ' + e.stack; } })()`);
await t.send('Page.navigate', { url: 'http://localhost:5410/' });
await t.sleep(1500);
await ev(`localStorage.clear(); return 1;`);
await t.send('Page.navigate', { url: 'http://localhost:5410/?trailer=1' });
await t.sleep(6000);
console.log(await ev(`
  for (let i = 0; i < 80 && !(window.state && window.BATTLE); i++) await __TW.wait(250);
  for (const s of ['/tools/playtest.js', '/tools/store_scenes.js', '/tools/trailer/shots.js']) { const x = await (await fetch(s + '?t=' + Date.now())).text(); (0, eval)(x); }
  const b = [...document.querySelectorAll('button')].find((b) => b.offsetParent && b.textContent.trim() === 'Skip'); if (b) b.click();
  state.isTutorialCompleted = true;
  if (window.audio) { audio.musicEnabled = false; audio.sfxEnabled = false; if (audio.stopMusic) audio.stopMusic(); }
  return 'ready';
`));
for (const shot of PLAN) {
  if (pick.length && !pick.includes(shot.name)) continue;
  const dir = path.join(here, 'frames', shot.name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  console.log(shot.name, await ev(`__TW.autoRun(); return await TRAILER.run('${shot.name}');`));
  await ev(`__TW.manual(); return 1;`);
  // Unseen frames first (the countdown, the wait for a crowd), stepping the clock and the shot.
  let f0 = -(shot.pre || 0);
  if (shot.until === 'boss') {
    // Run on until the boss is out, then film.
    for (let i = 0; i < 1500; i++) {
      const out = await ev(`TRAILER.act(${f0}); __TW.step(1000 / ${FPS}); return !!(BATTLE.run && BATTLE.run.battle.units.some((u) => u.boss)) ;`);
      f0++;
      if (out === true) break;
    }
    f0 = Math.max(f0, 0);
  } else {
    for (; f0 < 0; f0++) await ev(`TRAILER.act(${f0}); __TW.step(1000 / ${FPS}); return 1;`);
  }
  for (let f = 0; f < shot.frames; f++) {
    await ev(`TRAILER.act(${f + f0}); __TW.step(1000 / ${FPS}); return 1;`);
    writeFileSync(path.join(dir, `${String(f).padStart(4, '0')}.jpg`), await t.shot('jpeg', 95));
  }
  console.log(shot.name, 'filmed', shot.frames);
}
if (t.errors.length) console.log('page errors', t.errors.slice(0, 5));
await t.close();
process.exit(0);
