// The room's saved pictures of the homepage (CAPS in room.html): the TV (the first screen under the nav), the nav, and
// the page below the TV, per screen size, from a homepage that is live (default https://revaudio.net/) or served locally.
// Where they show: on the room's own page (/garage-9f3c/), and in the loading screen's pictures (lights/render.mjs:
// bank 1 is the TV). On the home page the room's TV is NOT one of these any more (2026-11-21): the page photographs
// its own TV in the visitor's browser, at the visitor's window size, and hands the room that (tv-photo.js, which
// HomeOpening.astro loads); the saved TV photo there is only the stand-in until that photo is taken, or if it
// fails. Re-run when the home TV changes (Dan 11-11: "the main TV is not updated to the current TV"), then the loading
// pictures.
//   node tools/_home-opening/tvcap.mjs [--url https://revaudio.net/] [--only 1141x636]
// The sale strip over the nav (src/data/sale.ts: "Black Friday in ..." from Nov 20, then Black Friday, Cyber Monday)
// moves the TV 46 px down and lays it out for a shorter screen; the room in the home page's frame has its own set for then:
//   node tools/_home-opening/tvcap.mjs --url http://127.0.0.1:4804/?home=tv --at 2026-11-28T12:00:00-08:00 --suffix sale
// --at <ISO date> = the page's clock (its sale state); --suffix <name> writes only tv-<w>x<h>-<name>.webp (never the nav
// or below pictures). The TV's top is read from the page (--site-nav-h + --sale-h).
// No tracking: the cookie banner answered "declined" before the page loads, the popups marked shown for the session,
// Cloudflare's beacon blocked. Writes tools/_home-opening/assets/{tv-<w>x<h>,nav-<w>,below-<w>}.webp (cwebp q90).
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire('/Users/danavivi/projects/revaudio/revaudio-website/');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const url = arg('url', 'https://revaudio.net/'), only = arg('only', null), at = arg('at', null), suffix = arg('suffix', null);
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
  if (at) { // the page's date: its sale state; the sale's first-visit intro (SaleIntro) counted as seen
    await ctx.clock.install({ time: new Date(at) });
    await ctx.addInitScript(() => { try { for (const p of ['bf', 'cm']) localStorage.setItem(`sale-intro-${p}-2026`, '1'); } catch (e) {} });
  }
  await ctx.addInitScript(() => { try {
    localStorage.setItem('ra-cookie-consent', 'declined');
    for (const k of ['ra-welcome10-s', 'ra-exit-gas-s', 'ra-popup-shown-s']) sessionStorage.setItem(k, '1');
  } catch (e) {} });
  await ctx.route(/cloudflareinsights\.com|\/cdn-cgi\/rum/, (r) => r.abort());
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(6000); // the TV's power-on and its pictures, and the heading's arrow blinking out its 4 x 1.1 s (WordWall ww-blink): the room shows the TV settled, arrow on (11-20)
  // the TV: the first screen under the nav (the room shows it from --nav-h down, as the old captures did: 1 px under);
  // the nav (+ the sale strip) as the page lays it out
  const nav = await p.evaluate(() => { const cs = getComputedStyle(document.documentElement), v = (k) => parseFloat(cs.getPropertyValue(k)) || 0;
    return Math.round(v('--site-nav-h') + v('--sale-h')); }) || s.nav;
  const tvTop = nav - 1, tag = `${s.w}x${s.h}`;
  if (nav !== s.nav) console.log(`${tag}: the page's nav is ${nav} px (SIZES says ${s.nav})`);
  await p.screenshot({ path: path.join(tmp, 'tv.png'), clip: { x: 0, y: tvTop, width: s.w, height: s.h - tvTop } });
  if (suffix) { webp(path.join(tmp, 'tv.png'), `tv-${tag}-${suffix}.webp`); console.log(`${tag}: tv-${tag}-${suffix}.webp, TV from ${tvTop} px`); await ctx.close(); continue; }
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
