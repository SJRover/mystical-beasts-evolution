// Battle mode in the real game on the iPhone 14 Plus stand-in: the Battle tab, a world, a level's
// screen, then a battle with cards played, with screenshots of each.
// `node tools/battle_check.mjs out-dir [world] [level] [seconds]` with the game on port 5410.
import { mkdirSync, writeFileSync } from 'node:fs';
import { openTab } from '../../MineToAustralia/scripts/trailer/cdp.mjs';

const [, , out = 'battle-check', world = '1', lvl = '1', secs = '25'] = process.argv;
mkdirSync(out, { recursive: true });
const t = await openTab({ width: 428, height: 926, scale: 2, mobile: true, headless: false });
await t.send('Network.enable');
await t.send('Network.clearBrowserCache');
await t.send('Network.setCacheDisabled', { cacheDisabled: true });
await t.send('Page.navigate', { url: 'http://localhost:5410/' });
await t.sleep(4500);
const snap = async (name) => { writeFileSync(`${out}/${name}.png`, await t.shot('png')); };
const ev = (code) => t.evaluate(`(async () => { const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); ${code} })()`);

console.log(await ev(`
  for (let i = 0; i < 60 && !(window.state && window.BATTLE); i++) await sleep(250);
  const src = await (await fetch('/tools/playtest.js')).text(); (0, eval)(src);
  state.isTutorialCompleted = true; PT.dismiss(); BATTLE.B().howSeen = true;
  // A save with a few beasts discovered, as a player some way in would have.
  const prime = Object.keys(BEAST_TEMPLATES).filter((id) => BATTLE_DATA.canBattle(id) && BATTLE_DATA.systemOf(id) === 'prime');
  const maxTier = ${world} > 1 ? 20 : Math.max(2, Math.ceil(${lvl} * 0.45) + 1);
  // TIER=n: only beasts up to Tier n discovered (a newer player); else add up to the level's tier.
  if (${process.env.TIER ? 1 : 0}) { state.unlockedBeasts = prime.filter((id) => BEAST_TEMPLATES[id].tier <= ${Number(process.env.TIER || 0)}).concat(['floaty_ray']); BATTLE.B().decks.prime = []; BATTLE.B().best = {}; BATTLE.B().bestPrestige = {}; }
  else for (const id of prime) if (BEAST_TEMPLATES[id].tier <= maxTier && !state.unlockedBeasts.includes(id)) state.unlockedBeasts.push(id);
  if (${world} > 1) for (let n = 1; n <= 40; n++) for (let w = 1; w < ${world}; w++) BATTLE.B().best[w + '-' + n] = 60;
  for (let n = 1; n < ${lvl}; n++) BATTLE.B().best['${world}-' + n] = 60;
  document.querySelectorAll('.modal-overlay.active').forEach((m) => m.classList.remove('active'));
  document.getElementById('sidebar-panel').classList.add('active');
  switchTab('sanctuary'); BATTLE.renderTab();
  return 'unlocked ' + state.unlockedBeasts.length;
`));
await t.sleep(800);
await snap('1-tab');
await ev(`BATTLE.openWorld(BATTLE_DATA.WORLDS[${world} - 1]); await sleep(400); return 1;`);
await snap('2-world');
await ev(`BATTLE.openLevel(BATTLE_DATA.WORLDS[${world} - 1], ${lvl}); await sleep(900); return 1;`);
await snap('3-level');
console.log(await ev(`document.querySelector('.bt-sheet:last-child .bt-go').click(); await sleep(1500); return !!document.getElementById('battle-screen');`));
// THROTTLE=4 slows the processor as the phone stand-in does (Mine to Australia's iphone.mjs).
if (process.env.THROTTLE) await t.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.THROTTLE) });
// Play: a card whenever one is ready, the marker moved about the zone now and then.
const playFor = Number(secs);
const r = await ev(`
  const cards = [...document.querySelectorAll('.bt-cardbtn')];
  const tap = (el) => { const b = el.getBoundingClientRect(); const o = { bubbles: true, pointerId: 7, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2, isPrimary: true }; el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new PointerEvent('pointerup', o)); };
  const end = performance.now() + ${playFor} * 1000; let k = 0, fps = [], last = performance.now();
  const loop = () => new Promise((res) => requestAnimationFrame((now) => { fps.push(now - last); last = now; res(); }));
  while (performance.now() < end && BATTLE.run && !BATTLE.run.battle.result) {
    await loop();
    if (++k % 20 === 0) { const run = BATTLE.run; run.marker = [0.25, 0.75, 0.4, 0.6][Math.floor(k / 20) % 4]; for (const c of cards) if (c.classList.contains('ready')) tap(c); }
  }
  const b = BATTLE.run ? BATTLE.run.battle : null;
  fps.shift(); const mean = fps.length / (fps.reduce((a, x) => a + x, 0) / 1000);
  return b ? { time: Math.round(b.time), result: b.result, yours: b.yours.length, foes: b.foes.length, piles: b.piles, fps: Math.round(mean) } : 'no battle';
`);
console.log('battle', JSON.stringify(r));
await snap('4-battle');
await ev(`if (BATTLE.run) { BATTLE.run.cam.zoom = BATTLE.run.max; BATTLE.run.cam.y = 1700; } await sleep(500); return 1;`);
await snap('5-zoomed');
console.log('page errors:', t.errors.length ? t.errors.slice(0, 5) : 'none');
await t.close();
process.exit(0);
