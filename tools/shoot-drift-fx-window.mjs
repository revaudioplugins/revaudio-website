/**
 * shoot-drift-fx-window.mjs — the /drift #fx screen: the whole DRIFT plugin window with its FX rack open, shot
 * from the plugin's own UI (website rule: product images come from the real UI). Dan 2026-10-08: #fx shows the
 * plugin itself, smaller, inside a digital screen.
 *
 *   cd ~/projects/revaudio/Drift/Source/ui/public && python3 -m http.server 4399 --bind 127.0.0.1
 *   node tools/shoot-drift-fx-window.mjs [http://127.0.0.1:4399/index.html]
 *
 * Opens the plugin page standalone (no JUCE: the page's own fallback) at its native 1725x912 stage (scale 1),
 * opens the FX rack (window.FXBAY), waits for the crane to land and shoots the #stage box at DPR 1.5
 * (2588x1368: the site serves it up to ~940 css px wide). Re-shoot whenever the rack changes (5.1.0: HALO).
 * Writes src/assets/seasons/drift/fx-window.png.
 */
import { chromium } from 'playwright';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.argv[2] ?? 'http://127.0.0.1:4399/index.html';
const out = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/seasons/drift/fx-window.png');

const br = await chromium.launch();
const p = await (await br.newContext({ viewport: { width: 1725, height: 912 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce' })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.evaluate(() => { document.body.classList.add('ui-ready'); window.FXBAY && window.FXBAY.open(); });
await p.waitForTimeout(2500);
const box = await p.evaluate(() => {
  if (!window.FXBAY || !window.FXBAY.isOpen()) throw new Error('FX rack did not open');
  const s = getComputedStyle(document.getElementById('plugin')).transform;
  if (s !== 'none' && s !== 'matrix(1, 0, 0, 1, 0, 0)') throw new Error(`stage not at scale 1: ${s}`);
  return document.getElementById('stage').getBoundingClientRect().toJSON();
});
await p.screenshot({ path: out, clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
console.log(`${out} ${box.width}x${box.height} css px`);
if (errs.length) console.log('page errors:', errs);
await br.close();
