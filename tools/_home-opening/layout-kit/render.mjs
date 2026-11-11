// Render a layout (the bench's Copy-settings JSON) from fixed walk spots, so layouts compare like for like.
//   node layout-kit/render.mjs <layout.json> <out-dir> [--walk 0,0.2,0.4,0.6,0.8,1] [--size 1141x636] [--labels] [--port 4471]
// Clean shots use the room's capture mode (no sway, dust or labels); --labels shows the slot labels instead.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(path.resolve(process.env.PLAYWRIGHT_FROM || '/Users/danavivi/projects/revaudio/revaudio-website') + '/');
const { chromium } = require('playwright');
const [layoutPath, outDir, ...rest] = process.argv.slice(2);
if (!layoutPath || !outDir) { console.error('usage: render.mjs <layout.json> <out-dir> [--walk ...] [--size WxH] [--labels] [--port N]'); process.exit(2); }
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const walks = opt('--walk', '0,0.2,0.4,0.6,0.8,1').split(',').map(Number);
const [w, h] = opt('--size', '1141x636').split('x').map(Number);
const port = opt('--port', '4471'), labels = rest.includes('--labels');
const layout = fs.readFileSync(layoutPath, 'utf8'); JSON.parse(layout);
fs.mkdirSync(outDir, { recursive: true });
const url = `http://127.0.0.1:${port}/tools/_home-opening/room.html`;
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
for (const p of walks) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addInitScript((b) => { try { localStorage.setItem('hoRoom:v1', b); } catch (e) {} }, layout);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  if (labels) {
    await page.goto(url + '?expose', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__room, null, { timeout: 20000 });
    await page.waitForTimeout(2600);
    await page.evaluate((p) => window.__room.go(p), p);
    await page.waitForTimeout(1200);
  } else {
    await page.goto(`${url}?capture=${p}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
  }
  const file = path.join(outDir, `walk-${String(Math.round(p * 100)).padStart(3, '0')}${labels ? '-labels' : ''}-${w}x${h}.png`);
  await page.screenshot({ path: file });
  console.log(file);
  await ctx.close();
}
await browser.close();
if (errors.length) { console.error('page errors:', errors); process.exit(1); }
