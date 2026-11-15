// Starts the game the way the iOS app does, with the real purchase plugin (CdvPurchase) already
// defined before the game's own scripts run, and reports whether the game came up. The browser
// never has the plugin, so it never ran this path; on the phone it froze 1.3 at launch (15 Nov:
// `store.onError` does not exist in cordova-plugin-purchase 13, and the throw stopped startup).
// `node tools/native_check.mjs [path/to/store.js]` with the dev server on port 5410.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const { openTab } = await import(pathToFileURL('C:/Users/Samjo/OneDrive/Desktop/MineToAustralia/scripts/trailer/cdp.mjs').href);
const plugin = readFileSync(process.argv[2] || new URL('../node_modules/cordova-plugin-purchase/www/store.js', import.meta.url), 'utf8');
const save = process.argv[3] ? readFileSync(process.argv[3], 'utf8') : null;

const t = await openTab({ width: 390, height: 844, scale: 1, mobile: true });
// A stand-in for Capacitor saying "native iOS", then the plugin itself, both before any page script.
await t.send('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', Plugins: {} };\n${plugin}\n` +
    (save ? `try { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); const s = ${JSON.stringify(save)}; for (const [k, v] of Object.entries(JSON.parse(s))) localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } } catch (e) {}` : ''),
});
await t.send('Page.navigate', { url: 'http://localhost:5410/?native=1' });
await t.sleep(6000);
const r = await t.evaluate(`(() => ({
  plugin: typeof CdvPurchase,
  world: !!document.getElementById('world'),
  biomePainted: !!document.querySelector('#meadow-bg canvas.biome-canvas'),
  beasts: document.querySelectorAll('.beast-container').length,
  essenceText: (document.getElementById('essence-display') || {}).textContent,
}))()`);
console.log(JSON.stringify(r));
console.log('page errors:', t.errors.length ? t.errors : 'none');
await t.close();
process.exit(0);
