// The room's picture for slow connections (room.html's #still): the first screen as the room renders it, at full light.
// One wide still serves every laptop / desktop: the camera's vertical view is the same at every screen width at the
// start of the walk, so object-fit: cover only trims the sides. Re-run it whenever the room changes.
//   node tools/_home-opening/still.mjs --port 4490      (serve the worktree root; needs cwebp)
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire('/Users/danavivi/projects/revaudio/revaudio-website/');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4490'), W = 2560, H = 1080, Q = arg('q', '70');            // 21:9 covers screens up to 2.37:1
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets', 'still');
fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(`http://127.0.0.1:${port}/tools/_home-opening/room.html?capture=0`, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(5000); // the intro's lights at full
const png = path.join(dir, '.still.png'), out = path.join(dir, `room-${W}.webp`);
await page.screenshot({ path: png });
await browser.close();
execFileSync('cwebp', ['-quiet', '-q', Q, '-m', '6', png, '-o', out]); fs.unlinkSync(png);
console.log('%s %s KB%s', out, (fs.statSync(out).size / 1024).toFixed(0), errs.length ? ' page errors: ' + errs.join(' | ') : '');
