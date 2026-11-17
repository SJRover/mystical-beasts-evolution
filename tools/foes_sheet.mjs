// The enemies' pictures as one sheet: `node tools/foes_sheet.mjs out.png [world] [pose] [k] [size]`
// (pose walk, atk, heavy, hurt or die; k how far through it). Reads the canvases of tools/foes.html.
import { writeFileSync } from 'node:fs';
import { openTab } from '../../MineToAustralia/scripts/trailer/cdp.mjs';
const [, , out, world = '1', pose = 'walk', k = '0.5', size = '120'] = process.argv;
const t = await openTab({ width: 1300, height: 900, scale: 1, headless: false });
await t.send('Network.enable');
await t.send('Network.setCacheDisabled', { cacheDisabled: true });
await t.send('Page.navigate', { url: `http://localhost:5410/tools/foes.html?world=${world}&still=1&size=${size}&pose=${pose}&k=${k}&t=0.35` });
await t.sleep(2500);
const url = await t.evaluate(`(() => {
  const cells = [...document.querySelectorAll('.cell')]; const cols = 10, S = ${size}, rows = Math.ceil(cells.length / cols);
  const c = document.createElement('canvas'); c.width = cols * S; c.height = rows * (S + 16); const g = c.getContext('2d');
  g.fillStyle = '#5a6a5e'; g.fillRect(0, 0, c.width, c.height); g.font = '11px sans-serif'; g.textAlign = 'center';
  cells.forEach((d, i) => { const x = (i % cols) * S, y = Math.floor(i / cols) * (S + 16); g.fillStyle = (Math.floor(i / cols) + i) % 2 ? '#667a6c' : '#5e7064'; g.fillRect(x, y, S, S + 16); g.drawImage(d.querySelector('canvas'), x, y); g.fillStyle = '#fff'; g.fillText(d.textContent.split(' (')[0], x + S / 2, y + S + 12); });
  return c.toDataURL('image/png');
})()`);
writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
console.log('errors:', t.errors.length ? t.errors.slice(0, 3) : 'none');
await t.close();
process.exit(0);
