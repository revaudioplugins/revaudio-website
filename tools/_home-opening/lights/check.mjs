// Checks for the loading screen (lights/README.md), in real Chrome:
//  1. a cold first visit over a throttled line (--mbps, default 40): when each load phase ends (the LOADW weights in
//     room.html should match these shares) and when each bank came on; page errors
//  2. the hand-off: the loading screen's last picture (?lights=hold) vs the live room at the same moment
//     (?capture=0&lights=<all>: every bank on, the TV off), pixels apart, then PASS / FAIL (exit 1 on FAIL): run it
//     after every change to the room and before every push of it
//   node tools/_home-opening/lights/check.mjs --port 4471 [--w 1141 --h 636 --dpr 2] [--mbps 40] [--out dir]
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire('/Users/danavivi/projects/revaudio/revaudio-website/');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4471'), W = +arg('w', 1141), H = +arg('h', 636), DPR = +arg('dpr', 2), MBPS = +arg('mbps', 40);
const here = path.dirname(fileURLToPath(import.meta.url)), out = arg('out', fs.mkdtempSync(path.join(os.tmpdir(), 'lights-check-')));
const url = (qs) => `http://127.0.0.1:${port}/tools/_home-opening/room.html${qs}`;
const browser = await chromium.launch({ channel: 'chrome', timeout: 300000 }); // (a busy Mac starts Chrome slowly)
const fresh = () => browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });

// 1. a cold first visit
{
  const ctx = await fresh(), page = await ctx.newPage(), errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (MBPS > 0) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 25, downloadThroughput: MBPS * 125000, uploadThroughput: 20 * 125000 });
  await page.goto(url(''), { waitUntil: 'commit', timeout: 120000 });
  await page.waitForFunction(() => window.lightsOn && window.lightsOn.log.some(([, w]) => w === 'hand-off'), null, { timeout: 180000 });
  const r = await page.evaluate(() => ({
    marks: Object.fromEntries(performance.getEntriesByType('mark').filter((m) => m.name.startsWith('lights:')).map((m) => [m.name.slice(7), Math.round(m.startTime)])),
    log: window.lightsOn.log, calm: window.lightsOn.calm,
  }));
  const ph = ['tex', 'models', 'upload', 'compile'], ends = ph.map((k) => r.marks[k]), total = ends[3];
  console.log(`cold first visit, ${MBPS || 'unthrottled'} Mbit/s, ${W}x${H} @${DPR}x (calm: ${r.calm})`);
  console.log('  phase ends (ms):', ph.map((k, i) => `${k} ${ends[i]}`).join(' · '));
  console.log('  shares (LOADW):', ph.map((k, i) => `${k} ${((ends[i] - (i ? ends[i - 1] : 0)) / total).toFixed(2)}`).join(' · '));
  console.log('  the lights (ms from the script):', r.log.map(([t, w]) => `${t} ${w}`).join(' · '));
  console.log('  page errors:', errs.length ? errs.join(' | ') : 'none');
  await ctx.close();
}
// 2. the hand-off
{
  const ctx = await fresh();
  const a = await ctx.newPage(); await a.goto(url('?lights=hold'), { waitUntil: 'load', timeout: 120000 });
  await a.waitForFunction(() => window.lightsOn.log.some(([, w]) => w === 'ready'), null, { timeout: 120000 });
  await a.waitForTimeout(400); await a.screenshot({ path: path.join(out, 'loader.png') });
  const n = await a.evaluate(() => window.LIGHT_BANKS.length);
  const b = await ctx.newPage(); await b.goto(url(`?capture=0&lights=${n}`), { waitUntil: 'load', timeout: 120000 });
  await b.waitForFunction(() => window.__lightsReady, null, { timeout: 120000 });
  await b.waitForTimeout(2500); await b.screenshot({ path: path.join(out, 'live.png') });
  console.log(`the hand-off at ${W}x${H} @${DPR}x (${out}):`);
  // under the nav (the capture hides it), clear of the bench button
  const band = [41, 200, 45].map((v) => String(v * DPR));
  // the gate (Dan 2026-11-11: always check that the loading screen matches the final page): PASS / FAIL, exit 1 on FAIL
  try { execFileSync('python3', ['-I', path.join(here, 'layers.py'), '--diff', path.join(out, 'loader.png'), path.join(out, 'live.png'), ...band, 'gate'], { stdio: 'inherit' }); }
  catch (e) { process.exitCode = 1; }
  await ctx.close();
}
await browser.close();
