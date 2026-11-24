// Films the 1.4 gameplay trailer from the real game, one frame at a time (dev server on 5410):
// `node record.mjs [shot ...]`. Each shot's frames go to frames/<shot>/0000.jpg ...; build.py
// puts them together with the music. The page runs on tw.js's clock, so every frame is exact.
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const { openTab } = await import(pathToFileURL('C:/Users/Samjo/OneDrive/Desktop/MineToAustralia/scripts/trailer/cdp.mjs').href);
const FPS = 30;
// The shots in order, with how many frames each is filmed for and how many it runs unseen first.
// Cuts sit on the bars of the music (110 bpm, a bar 65.45 frames; build.py starts it on the bar at
// 47.04 s where the full band comes in), so each cut lands on a downbeat.
export const PLAN = [
  { name: 'meadow', frames: 65 },
  { name: 'merge', frames: 98 },
  { name: 'crate', frames: 66 },
  { name: 'collection', frames: 98 },
  { name: 'worlds', frames: 66 },
  { name: 'battle', frames: 65, pre: 300 },
  { name: 'kingdom', frames: 66, pre: 0, until: 'boss', after: 90 },
  { name: 'moon', frames: 65, pre: 330 },
  { name: 'eclipse', frames: 66, pre: 360 },
  { name: 'hive', frames: 65, pre: 0, until: 'boss', after: 100 },
  { name: 'emperor', frames: 98, pre: 0, until: 'boss', after: 100 },
  { name: 'end', frames: 65 },
];
// The battle showcase (Sam, 23 Nov): `node record.mjs --showcase [shot ...]`. Its music is
// Sam's PrimeSolarSystemCasualBattleMusicVariant2 from the drop at 103.59 s (102 bpm, a bar is
// 70.55 frames), so its cuts sit on bars too.
export const SHOWCASE = [
  { name: 'sc_wide', frames: 71, pre: 280 },
  { name: 'sc_minotaur', frames: 70, pre: 0, until: 'boss', after: 90 },
  { name: 'sc_freeze', frames: 71, pre: 360 },
  { name: 'sc_horde', frames: 70, pre: 300 },
  { name: 'sc_moon', frames: 71, pre: 330 },
  { name: 'sc_gravity', frames: 70, pre: 330 },
  { name: 'sc_pirates', frames: 71, pre: 380 },
  { name: 'sc_fortress', frames: 70, pre: 480 },
  { name: 'sc_gorgon', frames: 71, pre: 0, until: 'boss', after: 80 },
  { name: 'sc_starfall', frames: 71, pre: 330 },
  { name: 'sc_emperor', frames: 141, pre: 0, until: 'boss', after: 60 },
  { name: 'sc_legend', frames: 70, pre: 0, until: 'result', after: 25 },
  { name: 'sc_relic', frames: 71 },
  { name: 'sc_crate', frames: 70 },
  { name: 'end', frames: 141 },
];
// 1.5, the giants and the comet (Sam, 24 Nov): `node record.mjs --giants [shot ...]`. Music: Sam's
// BattleWorld7Music2 from 104.925 s (two beats before the hit at 106.7; about 135 bpm, a bar of four
// half-time beats is 3.558 s, 107 frames), then CometWorldMusic from its drop at 74.0 s (64 bpm, four
// beats 3.75 s, 112 frames), crossfaded at the cut to the comet (build.py --giants).
export const GIANTS = [
  { name: 'g_chimera', frames: 160, pre: 0, until: 'deep', after: 60 },
  { name: 'g_dragon', frames: 107, pre: 0, until: 'boss', after: 120 },
  { name: 'g_titans', frames: 107, pre: 0, until: 'deep', after: 150 },
  { name: 'g_eater', frames: 107, pre: 0, until: 'boss', after: 200 },
  { name: 'g_special', frames: 107, pre: 0, until: 'deep', after: 60 },
  { name: 'g_comet', frames: 112 },
  { name: 'g_cosmic', frames: 112 },
  { name: 'g_end', frames: 85 },
];
const GIANT = process.argv.includes('--giants');
const SHOW = process.argv.includes('--showcase');
const pick = process.argv.slice(2).filter((a) => !a.startsWith('--'));
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
for (const shot of GIANT ? GIANTS : SHOW ? SHOWCASE : PLAN) {
  if (pick.length && !pick.includes(shot.name)) continue;
  const dir = path.join(here, 'frames', GIANT ? `giants-${shot.name}` : SHOW ? `showcase-${shot.name}` : shot.name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  console.log(shot.name, await ev(`__TW.autoRun(); return await TRAILER.run('${shot.name}');`), await ev(`return JSON.stringify({ battle: BATTLE.run ? BATTLE.run.level.id + (BATTLE.run.battle.result ? ' ' + BATTLE.run.battle.result : '') : null, modal: !!document.querySelector('.bt-modal'), sheets: document.querySelectorAll('.bt-sheet').length });`));
  await ev(`__TW.manual(); return 1;`);
  // Unseen frames first (the countdown, the wait for a crowd), stepping the clock and the shot.
  let f0 = -(shot.pre || 0);
  if (shot.until) {
    // Run on until the boss is out, then film.
    // The shot's own frames count from when filming starts (its caption shows then), so the
    // waiting frames are numbered far below zero.
    let w = -100000;
    for (let i = 0; i < 1500; i++) {
      // ('deep': a giant well into the field, so it shows whole, not half off the top.)
      const cond = shot.until === 'result' ? `!!document.querySelector('.bt-modal [data-a=map]')` : shot.until === 'deep' ? `!!(BATTLE.run && BATTLE.run.battle.units.some((u) => u.boss && u.state !== 'dying' && u.y > 640))` : `!!(BATTLE.run && BATTLE.run.battle.units.some((u) => u.boss))`;
      const out = await ev(`TRAILER.act(${w}); __TW.step(1000 / ${FPS}); return ${cond};`);
      w++;
      if (out === true) break;
    }
    // A moment more, so the boss is in the fight when filming starts.
    for (let i = 0; i < (shot.after || 0); i++) { await ev(`TRAILER.act(${w}); __TW.step(1000 / ${FPS}); return 1;`); w++; }
    f0 = 0;
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
