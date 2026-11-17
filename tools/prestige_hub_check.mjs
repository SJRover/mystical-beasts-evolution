// Prestiging from the Beast Hub (Sam, 17 Nov: the showcase's beasts went on into the next prestige).
// `node tools/prestige_hub_check.mjs` with the game served on port 5410. Puts three beasts on the
// field, enters the hub, shows five others there, prestiges from the hub, and lists what is on the
// field and in the hub afterwards. Right: the field holds only the two starting beasts.
import { openTab } from '../../MineToAustralia/scripts/trailer/cdp.mjs';

const t = await openTab({ width: 428, height: 926, scale: 2, mobile: true, headless: false });
await t.send('Network.enable');
await t.send('Network.clearBrowserCache');
await t.send('Network.setCacheDisabled', { cacheDisabled: true });
await t.send('Page.navigate', { url: 'http://localhost:5410/' });
await t.sleep(4000);
const r = await t.evaluate(`(async () => {
  const sleep = (ms) => new Promise((q) => setTimeout(q, ms));
  for (let i = 0; i < 60 && !(window.state && document.getElementById('meadow-viewport')); i++) await sleep(250);
  const src = await (await fetch('/tools/playtest.js')).text(); (0, eval)(src);
  state.isTutorialCompleted = true; PT.dismiss();
  if (state.inBeastHub) toggleBeastHub(false);
  PT.clear();
  const ids = Object.keys(BEAST_TEMPLATES).filter((k) => !isBossBeast(k));
  const fieldKind = ids.find((k) => BEAST_TEMPLATES[k].tier === 3) || ids[3];
  const hubKind = ids.find((k) => BEAST_TEMPLATES[k].tier === 12) || ids[12];
  for (let i = 0; i < 3; i++) { const p = WORLD.viewPct(30 + i * 15, 50); spawnBeastOnField(fieldKind, p.x, p.y, false, false); }
  saveGame();
  const level0 = state.prestigeLevel;
  toggleBeastHub(true); await sleep(300);
  PT.clear();
  for (let i = 0; i < 5; i++) { const p = WORLD.viewPct(20 + i * 12, 40); spawnBeastOnField(hubKind, p.x, p.y, false, false); }
  saveGame();
  state.essence = 1e300;
  const branch = state.currentSolarSystem === 'prime' ? state.primeSystem : state.lowGravitySystem; branch.essence = 1e300;
  executePrestigeAscent(); await sleep(300);
  const tally = () => { const c = {}; state.beastsOnField.forEach((b) => { c[b.type] = (c[b.type] || 0) + 1; }); return c; };
  const after = { inHub: state.inBeastHub, prestige: state.prestigeLevel, onScreen: tally() };
  if (state.inBeastHub) { toggleBeastHub(false); await sleep(300); }
  const field = tally();
  toggleBeastHub(true); await sleep(300);
  const hub = tally();
  toggleBeastHub(false);
  return { fieldKind, hubKind, prestigeBefore: level0, afterPrestige: after, fieldAfterLeavingHub: field, hubAfter: hub, errors: PT.errors };
})()`);
console.log(JSON.stringify(r, null, 1));
await t.close();
process.exit(0);
