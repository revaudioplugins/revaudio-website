// The loading screen's pictures (lights/README.md): the room at walk 0 as its light banks come on one by one (room.html
// ?capture=0&lights=k, k = 0..banks), then layers.py turns them into the dark room (base.webp) and each bank's own light
// (bank-k.webp = room k minus room k-1, never below 0) that lights-on.js adds back up. One wide picture serves every
// laptop, like still.mjs: object-fit cover only trims the sides. Re-run it whenever the room changes.
//   node tools/_home-opening/lights/render.mjs --port 4471 [--q 82] [--check]   (serve the worktree root; cwebp, dwebp, python3 numpy + PIL)
//   --check renders the full room twice first: the two must match (a capture that moves would smear every layer)
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire('/Users/danavivi/projects/revaudio/revaudio-website/');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4471'), W = 2560, H = 1080, Q = arg('q', '82');
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '..', 'assets', 'lights');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lights-'));
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', timeout: 300000 }); // (a busy Mac starts Chrome slowly)
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
async function shot(k, file) {
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/tools/_home-opening/room.html?capture=0&lights=${k}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__lightsReady, null, { timeout: 90000 });
  await page.waitForTimeout(2500); // the pictures land after the first layout, the probe redraws
  const banks = await page.evaluate(() => window.LIGHT_BANKS);
  await page.screenshot({ path: file });
  await page.close();
  if (errs.length) console.log('  page errors at %s: %s', k, errs.join(' | '));
  return banks;
}
const banks = await shot(0, path.join(tmp, 'room-0.png')), n = banks.length;
const caps = Object.fromEntries(banks.map((b, i) => [i + 1, b.caps]).filter(([, c]) => c)); // banks drawn per screen width
if (process.argv.includes('--check')) {
  await shot(n, path.join(tmp, 'check-a.png')); await shot(n, path.join(tmp, 'check-b.png'));
  execFileSync('python3', ['-I', path.join(here, 'layers.py'), '--diff', path.join(tmp, 'check-a.png'), path.join(tmp, 'check-b.png')], { stdio: 'inherit' });
}
for (let k = 1; k <= n; k++) {
  await shot(k, path.join(tmp, `room-${k}.png`)); // the room's own pick at 2560 wide: the chain the later banks build on
  for (const tag of caps[k] || []) await shot(`${k}&tvcap=${tag}`, path.join(tmp, `room-${k}@${tag}.png`));
  process.stdout.write(`  room ${k}/${n}\n`);
}
await browser.close();
for (const f of fs.readdirSync(out)) if (/^(base|bank-\d+(@[\dx]+)?)\.webp$/.test(f)) fs.unlinkSync(path.join(out, f)); // no stale bank left
execFileSync('python3', ['-I', path.join(here, 'layers.py'), tmp, out, String(n), Q, JSON.stringify(caps)], { stdio: 'inherit' });
if (!process.argv.includes('--keep')) fs.rmSync(tmp, { recursive: true, force: true }); else console.log('renders kept in', tmp);
