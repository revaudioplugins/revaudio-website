// Renders the street's signs (street-atlas.html) to assets/pics/street-atlas.webp, lossless (the lockup's parchment and
// oxide stay exact).   node tools/_home-opening/street-atlas.mjs --port <a static server of the worktree root>
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire('/Users/danavivi/projects/revaudio/revaudio-website/');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, 'assets', 'pics', 'street-atlas.webp');
const b = await chromium.launch({ channel: 'chrome', timeout: 600000 }), p = await b.newPage(), errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(`http://127.0.0.1:${arg('port', '4471')}/tools/_home-opening/street-atlas.html`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.atlasPNG || null, null, { timeout: 120000 }).catch(() => {});
const url = await p.evaluate(() => window.atlasPNG);
await b.close();
if (!url) { console.error('no picture:', errs.join(' | ') || 'atlasPNG never set'); process.exit(1); }
const png = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'street-')), 'atlas.png');
fs.writeFileSync(png, Buffer.from(url.split(',')[1], 'base64'));
execFileSync('cwebp', ['-quiet', '-lossless', '-z', '9', png, '-o', out]);
console.log('street-atlas.webp', Math.round(fs.statSync(out).size / 1024), 'KB');
