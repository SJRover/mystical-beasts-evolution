// Exports the App Store header, search results and universal art from tools/store_art.html at
// Apple's full sizes: `node tools/make_store_art.mjs` with the dev server on port 5410. Output goes
// to "App Store 1.3/" (not in git); flatten to RGB afterwards (tools/flatten.py).
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const { openTab } = await import(pathToFileURL('C:/Users/Samjo/OneDrive/Desktop/MineToAustralia/scripts/trailer/cdp.mjs').href);
const out = new URL('../App Store 1.3/', import.meta.url);
mkdirSync(out, { recursive: true });
const NAMES = { header: 'Header 3840x1646.png', search: 'Search results 3840x2560.png', universal: 'Universal header and search 5244x2950.png' };
const t = await openTab({ width: 1200, height: 800, scale: 1 });
for (const kind of Object.keys(NAMES)) {
  await t.send('Page.navigate', { url: `http://localhost:5410/tools/store_art.html?kind=${kind}` });
  await t.sleep(2000);
  const url = await t.evaluate(`window.ART_READY.then(() => document.getElementById('c').toDataURL('image/png'))`);
  writeFileSync(new URL(NAMES[kind], out), Buffer.from(String(url).split(',')[1], 'base64'));
  console.log(kind);
}
await t.close();
process.exit(0);
