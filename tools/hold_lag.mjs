// Frame rate while holding a beast on a crowded field (Sam, 17 Nov: "when there are lots of beasts
// on the screen and u hold one to look for merge potential ... the game lags").
// `node tools/hold_lag.mjs [count] [throttle]` with the game served on port 5410.
//
// An off-screen Edge (the Mine to Australia trailer's DevTools client) at an iPhone 14 Plus's
// screen, processor slowed THROTTLE times. Fills the field with COUNT beasts of one tier (so they
// all match the one held), then times frames idle and while a finger holds one and moves a little.
import { openTab } from '../../MineToAustralia/scripts/trailer/cdp.mjs';

const COUNT = Number(process.argv[2] ?? 40);
const THROTTLE = Number(process.argv[3] ?? 4);
const t = await openTab({ width: 428, height: 926, scale: 3, mobile: true, headless: false });
await t.send('Network.enable');
await t.send('Network.clearBrowserCache');
await t.send('Network.setCacheDisabled', { cacheDisabled: true });
await t.send('Page.navigate', { url: 'http://localhost:5410/' });
await t.sleep(4000);
const ready = await t.evaluate(`(async () => {
  for (let i = 0; i < 60 && !(window.state && document.getElementById('meadow-viewport')); i++) await new Promise((r) => setTimeout(r, 250));
  const src = await (await fetch('/tools/playtest.js')).text(); (0, eval)(src);
  state.isTutorialCompleted = true;
  document.querySelectorAll('.modal.active, .modal-overlay.active').forEach((m) => m.classList.remove('active'));
  PT.dismiss(); PT.clear();
  // (PRESTIGE=n BEAST=id: a biome and a beast to test with, 25 Nov: lag at prestige 13.)
  ${process.env.PRESTIGE ? `state.prestigeLevel = ${Number(process.env.PRESTIGE)}; applyBiomeBg(state.prestigeLevel); await new Promise((r) => setTimeout(r, 1500));` : ''}
  for (let i = 0; i < ${COUNT}; i++) { const p = WORLD.viewPct(8 + (i % 8) * 11, 18 + Math.floor(i / 8) * 13); spawnBeastOnField('${process.env.BEAST || 'sparky'}', p.x, p.y, false, false); }
  await new Promise((r) => setTimeout(r, 1500));
  return state.beastsOnField.length;
})()`);
console.log('beasts on the field:', ready);
if (process.env.CSS) await t.evaluate(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(process.env.CSS)}; document.head.appendChild(s); return 1; })()`);
await t.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
const fps = (holding) => t.evaluate(`(async () => {
  const touch = (type, target, x, y) => { const tt = new Touch({ identifier: 1, target, clientX: x, clientY: y }); target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [tt], targetTouches: type === 'touchend' ? [] : [tt], changedTouches: [tt] })); };
  const b = state.beastsOnField[0]; const r = b.dom.getBoundingClientRect(); const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
  if (${holding}) { touch('touchstart', b.dom, x0, y0); for (let i = 1; i <= 4; i++) { mouseX = x0 + i * 3; mouseY = y0 + i * 3; window.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [new Touch({ identifier: 1, target: document.body, clientX: mouseX, clientY: mouseY })] })); await new Promise((q) => setTimeout(q, 16)); } }
  const times = []; let last = performance.now(); const end = last + 5000; let k = 0;
  await new Promise((res) => { const f = (now) => { times.push(now - last); last = now; k++;
    if (${holding} && k % 3 === 0) { mouseX = x0 + 12 + Math.sin(k / 9) * 20; mouseY = y0 + 12; window.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [new Touch({ identifier: 1, target: document.body, clientX: mouseX, clientY: mouseY })] })); }
    if (now < end) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
  if (${holding}) { touch('touchend', document.body, mouseX, mouseY); window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: mouseX, clientY: mouseY })); }
  times.shift(); const s = [...times].sort((a, c) => c - a);
  return { meanFps: +(times.length / 5).toFixed(1), worstMs: Math.round(s[0]), highlighted: document.querySelectorAll('.hovering-compatible').length };
})()`);
console.log('idle   ', JSON.stringify(await fps(false)));
console.log('holding', JSON.stringify(await fps(true)));
console.log('idle   ', JSON.stringify(await fps(false)));
await t.close();
process.exit(0);
