// A short real-time clip of the field, for showing the new art and movement:
// `node tools/record_field.mjs out-folder [seconds]` with the dev server on port 5410.
// Uses the screen-capture helper from the Mine to Australia trailer tools (hidden Edge over CDP).
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const { openTab } = await import(pathToFileURL('C:/Users/Samjo/OneDrive/Desktop/MineToAustralia/scripts/trailer/cdp.mjs').href);
const out = process.argv[2] || 'clip';
const seconds = Number(process.argv[3] || 8);
mkdirSync(out, { recursive: true });

const t = await openTab({ width: 390, height: 844, scale: 2, mobile: true });
await t.send('Page.navigate', { url: 'http://localhost:5410/?clip=1' });
await t.sleep(4000);
// Past the tutorial, then a believable field: early tiers, a few rares, one Legendary, some evolved.
await t.evaluate(`(async () => {
  const skip = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Skip');
  if (skip) skip.click();
  await new Promise((r) => setTimeout(r, 800));
  document.querySelectorAll('.beast-container, .essence-crystal, .crate-container').forEach((e) => e.remove());
  state.beastsOnField.length = 0;
  state.upgrades.meadowCapacity = 20;
  const list = [['sparky', 0], ['sparky', 1], ['ember', 0], ['dewdrop', 0], ['cinder', 0], ['zephyr', 0], ['pyreling', 1], ['aqualet', 0], ['ignis', 0], ['torrent', 0], ['sylph', 0], ['aven', 0], ['phoenix', 1], ['chronos', 0]];
  for (const [id, ev] of list) spawnBeastOnField(id, 8 + Math.random() * 72, 16 + Math.random() * 38, !!ev);
  await new Promise((r) => setTimeout(r, 2500));
  return state.beastsOnField.length;
})()`);
await t.sleep(1500);
const t0 = Date.now();
let n = 0;
while (Date.now() - t0 < seconds * 1000) {
  writeFileSync(`${out}/${String(n++).padStart(5, '0')}.jpg`, await t.shot('jpeg', 88));
}
const fps = n / seconds;
writeFileSync(`${out}/fps.txt`, String(fps));
console.log('frames', n, 'fps', fps.toFixed(1));
await t.close();
process.exit(0);
