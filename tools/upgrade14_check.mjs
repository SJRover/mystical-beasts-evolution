// 1.3 to 1.4: a lived-in 1.3 save opened in 1.4 (battle mode). Needs `git worktree add old13 9f05ee8`
// (1.3) in the project folder and the dev server on 5410. Remove the worktree afterwards.
import { openTab } from '../../MineToAustralia/scripts/trailer/cdp.mjs';
const t = await openTab({ width: 428, height: 926, scale: 1, mobile: true, headless: false });
await t.send('Network.enable');
await t.send('Network.setCacheDisabled', { cacheDisabled: true });
await t.send('Page.navigate', { url: 'http://localhost:5410/old13/index.html' });
await t.sleep(4000);
const before = await t.evaluate(`(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 60 && !window.state; i++) await sleep(250);
  state.isTutorialCompleted = true;
  for (const id of ['ember', 'cinder', 'dewdrop', 'sprout']) { if (!state.unlockedBeasts.includes(id)) state.unlockedBeasts.push(id); }
  state.beastsOnField.forEach((b) => b.dom.remove()); state.beastsOnField = [];
  for (const id of ['ember', 'cinder', 'cinder', 'dewdrop']) spawnBeastOnField(id, 30 + Math.random() * 40, 40 + Math.random() * 20);
  state.essence = 123456; state.premiumCratesCount = 2;
  saveGame();
  return { field: state.beastsOnField.map((b) => b.type), unlocked: state.unlockedBeasts.length, essence: state.essence, hasBattle: typeof BATTLE };
})()`);
console.log('1.3 save:', JSON.stringify(before));
await t.send('Page.navigate', { url: 'http://localhost:5410/index.html' });
await t.sleep(4500);
const after = await t.evaluate(`(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 60 && !(window.state && window.BATTLE); i++) await sleep(250);
  await sleep(500);
  return { field: state.beastsOnField.map((b) => b.type), unlocked: state.unlockedBeasts.length, essence: Math.round(state.essence), premium: state.premiumCratesCount,
    tab: document.querySelector('#tab-sanctuary span').textContent, section: !!document.getElementById('battle-section'),
    bestPrestige: BATTLE.B().bestPrestige, saved: JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => /mystic|beast|save/i.test(k)) || 'x') || 'null') ? 'ok' : 'no key' };
})()`);
console.log('1.4 opened:', JSON.stringify(after));
console.log('page errors:', t.errors.length ? t.errors.slice(0, 4).map((e) => String(e).split('\n')[0]) : 'none');
await t.close();
process.exit(0);
