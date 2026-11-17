// A screenshot of a page on the dev server: `node tools/shot.mjs <path?query> out.png [width height scale]`.
import { writeFileSync } from 'node:fs';
import { openTab } from '../../MineToAustralia/scripts/trailer/cdp.mjs';
const [, , url, out, w = 1400, h = 1000, sc = 1] = process.argv;
const t = await openTab({ width: Number(w), height: Number(h), scale: Number(sc), headless: false });
await t.send('Network.enable');
await t.send('Network.setCacheDisabled', { cacheDisabled: true });
await t.send('Page.navigate', { url: 'http://localhost:5410/' + url });
await t.sleep(Number(process.env.WAIT || 2500));
writeFileSync(out, await t.shot('png'));
console.log('errors:', t.errors.length ? t.errors.slice(0, 3) : 'none');
await t.close();
process.exit(0);
