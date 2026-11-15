// App Store screenshots for 1.3, captured from the real game in a hidden Edge (dev server on 5410):
// `node tools/store_shots.mjs [size ...]` with sizes from SIZES below (default: all of them).
// Each scene is staged by tools/store_scenes.js. Output goes to "App Store 1.3/" (not in git),
// flattened to RGB by tools/flatten.py afterwards, because Apple rejects images with transparency.
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const { openTab } = await import(pathToFileURL('C:/Users/Samjo/OneDrive/Desktop/MineToAustralia/scripts/trailer/cdp.mjs').href);
const SIZES = {
  iphone: { dir: 'iPhone 1206x2622', width: 402, height: 874, scale: 3 },
  ipad: { dir: 'iPad 2064x2752', width: 1032, height: 1376, scale: 2 },
  duo_inner: { dir: 'iPhone Duo inner 2007x2853', width: 669, height: 951, scale: 3 },
  duo_outer: { dir: 'iPhone Duo outer 1398x2034', width: 466, height: 678, scale: 3 },
};
const SCENES = ['field', 'merge', 'premium', 'biomes', 'zoom', 'spin', 'beastopedia'];
const pick = process.argv.slice(2);
const sizes = pick.length ? pick : Object.keys(SIZES);
const root = new URL('../App Store 1.3/', import.meta.url);

for (const key of sizes) {
  const S = SIZES[key];
  const out = new URL(`${S.dir}/`, root);
  mkdirSync(out, { recursive: true });
  const t = await openTab({ width: S.width, height: S.height, scale: S.scale, mobile: true });
  await t.send('Page.navigate', { url: 'http://localhost:5410/' });
  await t.sleep(1500);
  await t.evaluate(`localStorage.clear(); 1`);
  // A fresh save with the tutorial already done (skipping it later would reset discoveries).
  await t.send('Page.navigate', { url: 'http://localhost:5410/?store=1' });
  await t.sleep(5000);
  await t.evaluate(`(async () => { const b = [...document.querySelectorAll('button')].find((b) => b.offsetParent && b.textContent.trim() === 'Skip'); if (b) b.click(); await new Promise((r) => setTimeout(r, 600)); state.isTutorialCompleted = true; saveGame(); return 1; })()`);
  await t.send('Page.navigate', { url: 'http://localhost:5410/?store=2' });
  await t.sleep(5000);
  await t.evaluate(`(async () => { for (const s of ['/tools/playtest.js', '/tools/store_scenes.js']) { const x = await (await fetch(s + '?t=' + Date.now())).text(); (0, eval)(x); } return 1; })()`);
  for (let i = 0; i < SCENES.length; i++) {
    await t.evaluate(`SCENES.run('${SCENES[i]}')`);
    await t.sleep(800);
    writeFileSync(new URL(`${String(i + 1).padStart(2, '0')} ${SCENES[i]}.png`, out), await t.shot('png'));
    console.log(key, SCENES[i]);
  }
  if (t.errors.length) console.log('page errors', t.errors);
  await t.close();
  await t.sleep(1500);
}
process.exit(0);
