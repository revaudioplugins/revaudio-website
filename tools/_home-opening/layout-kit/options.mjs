// option stills for Dan's picks: room.html?capture=<walk>&expose, then a patch run in the page, then a still
//   node options.mjs <out-dir> <spec.json> [WxH] [port]
// spec: [{ name, walk, patch: "<js body; window.__room is in scope as X>" }]
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path';
const require = createRequire(path.resolve(process.env.PLAYWRIGHT_FROM || '/Users/danavivi/projects/revaudio/revaudio-website') + '/');
const { chromium, webkit } = require('playwright');
const [out, specPath, size = '1141x636', port = '4490'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number); fs.mkdirSync(out, { recursive: true });
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const browser = process.env.ENGINE === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
const msgs = new Set();
for (const s of spec) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => msgs.add('PAGEERROR ' + String(e).slice(0, 400)));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') msgs.add(m.type() + ' ' + m.text().slice(0, 300)); });
  for (let a = 0; a < 3; a++) { try { await page.goto(`http://127.0.0.1:${port}/tools/_home-opening/room.html?capture=${s.walk}&expose`, { waitUntil: 'load', timeout: 45000 }); break; } catch (e) { console.log('retry', s.name, String(e).slice(0, 80)); } }
  await page.waitForTimeout(3600);
  if (s.patch) await page.evaluate(`(() => { const X = window.__room; ${s.patch}; X.R.probe.due = 1; })()`);
  await page.waitForTimeout(1400);
  const f = path.join(out, `${s.name}.png`);
  await page.screenshot({ path: f }); console.log(f);
  await ctx.close();
}
await browser.close();
for (const m of msgs) console.log(m);
