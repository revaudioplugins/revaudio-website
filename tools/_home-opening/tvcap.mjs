// The room's pictures of the homepage (CAPS in room.html): the TV (the first screen under the nav), the nav, and the
// page below the TV, per screen size, from a homepage that is live (default https://revaudio.net/) or served locally.
// The room shows them until it becomes the homepage itself; re-run when the home TV changes (Dan 11-11: "the main TV is
// not updated to the current TV"), then the loading pictures (lights/render.mjs: bank 1 is the TV).
//   node tools/_home-opening/tvcap.mjs [--url https://revaudio.net/] [--only 1141x636]
// No tracking: the cookie banner answered "declined" before the page loads, the popups marked shown for the session,
// Cloudflare's beacon blocked. Writes tools/_home-opening/assets/{tv-<w>x<h>,nav-<w>,below-<w>}.webp (cwebp q90).
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire('/Users/danavivi/projects/revaudio/revaudio-website/');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const url = arg('url', 'https://revaudio.net/'), only = arg('only', null);
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tvcap-'));
const SIZES = [ // as CAPS: the three laptop widths at 2x, the phone at 3x
  { w: 1141, h: 636, dpr: 2, nav: 41 }, { w: 1440, h: 900, dpr: 2, nav: 41 }, { w: 1920, h: 1080, dpr: 2, nav: 41 },
  { w: 390, h: 844, dpr: 3, nav: 58, phone: true },
].filter((s) => !only || only === `${s.w}x${s.h}`);
const webp = (png, file) => execFileSync('cwebp', ['-quiet', '-q', '90', '-m', '6', png, '-o', path.join(out, file)]);
const browser = await chromium.launch({ channel: 'chrome' });
for (const s of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dpr, isMobile: !!s.phone, hasTouch: !!s.phone });
  await ctx.addInitScript(() => { try {
    localStorage.setItem('ra-cookie-consent', 'declined');
    for (const k of ['ra-welcome10-s', 'ra-exit-gas-s', 'ra-popup-shown-s']) sessionStorage.setItem(k, '1');
  } catch (e) {} });
  await ctx.route(/cloudflareinsights\.com|\/cdn-cgi\/rum/, (r) => r.abort());
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(4000); // the TV's power-on and its pictures
  // the TV: the first screen under the nav (the room shows it from --nav-h down, as the old captures did: 1 px under)
  const tvTop = s.nav - 1, tag = `${s.w}x${s.h}`;
  await p.screenshot({ path: path.join(tmp, 'tv.png'), clip: { x: 0, y: tvTop, width: s.w, height: s.h - tvTop } });
  await p.screenshot({ path: path.join(tmp, 'nav.png'), clip: { x: 0, y: 0, width: s.w, height: s.nav } });
  // below: the page from the end of the first screen to the end of the page
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.screenshot({ path: path.join(tmp, 'below.png'), fullPage: true, clip: { x: 0, y: s.h, width: s.w, height: H - s.h } });
  webp(path.join(tmp, 'tv.png'), `tv-${tag}.webp`); webp(path.join(tmp, 'nav.png'), `nav-${s.w}.webp`); webp(path.join(tmp, 'below.png'), `below-${s.w}.webp`);
  console.log(`${tag}: page ${H} px, below ${H - s.h} px`);
  await ctx.close();
}
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });
