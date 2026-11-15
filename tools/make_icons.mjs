// Captures each app icon option from tools/icon.html at 1024 by 1024:
// `node tools/make_icons.mjs out-folder [first] [last]` with the dev server on port 5410.
// The PNGs keep an alpha channel from the canvas; flatten them to RGB before they go to Apple.
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const { openTab } = await import(pathToFileURL('C:/Users/Samjo/OneDrive/Desktop/MineToAustralia/scripts/trailer/cdp.mjs').href);
const out = process.argv[2] || 'icons';
const first = Number(process.argv[3] || 1), last = Number(process.argv[4] || 6);
mkdirSync(out, { recursive: true });

const t = await openTab({ width: 1024, height: 1024, scale: 1 });
for (let i = first; i <= last; i++) {
  await t.send('Page.navigate', { url: `http://localhost:5410/tools/icon.html?opt=${i}` });
  await t.sleep(1500);
  const r = await t.evaluate(`window.ICON_READY.then(() => document.getElementById('c').toDataURL('image/png'))`);
  const url = r && r.result ? r.result.value : r;
  writeFileSync(`${out}/option-${i}.png`, Buffer.from(String(url).split(',')[1], 'base64'));
  console.log('option', i);
}
if (t.errors && t.errors.length) console.log('errors', t.errors);
await t.close();
process.exit(0);
