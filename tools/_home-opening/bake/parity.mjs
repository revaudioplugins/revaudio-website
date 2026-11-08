// Capture test.html for the parity test and time it (headless Playwright, never the MCP browser).
//   node parity.mjs <out dir> [port=4493] [browsers=chrome,webkit] [perf=1] [configs=none]
// Per config: <out>/<browser>/<config>.f32 (scene-linear float32 RGBA, rows bottom-up, before the finish) and
// <config>.png (the finished canvas, AgX), plus info.json (GPU, uniform values) and perf.json (ms per frame).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('/Users/danavivi/projects/revaudio/revaudio-website/');
const { chromium, webkit } = require('playwright');

const [out, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.map((a) => a.split('=')));
const port = opt.port || 4493;
const base = `http://127.0.0.1:${port}/tools/_home-opening/bake/test.html`;
const CONFIGS = {
  bake_G1_lamp: 'g1=1&g2=0',
  bake_G2_neon: 'g1=0&g2=1',
  bake_all: 'g1=1&g2=1',
  bake_dial: 'g1=0.5&g2=1',            // a dial: must equal 0.5 x Blender's G1 + G2 (light adds linearly)
  live_G1_lamp_direct: 'mode=live&g1=1&g2=0',
  bake_all_blender_agx: 'g1=1&g2=1&finish=blender', // the finish swapped for Blender's own AgX (a LUT)
};

for (const name of (opt.browsers || 'chrome,webkit').split(',')) {
  const browser = name === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome', args: ['--ignore-gpu-blocklist', '--enable-gpu'] });
  const dir = path.join(out, name); fs.mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1141, height: 636 }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  const info = {};
  for (const [cfg, q] of Object.entries(opt.configs === 'none' ? {} : CONFIGS)) { // configs=none: perf only
    if (name === 'webkit' && !['bake_all', 'live_G1_lamp_direct', 'bake_all_blender_agx'].includes(cfg)) continue;
    await page.goto(`${base}?${q}&ui=0&shot=1`);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
    const raw = await page.evaluate(() => window.__raw());
    fs.writeFileSync(path.join(dir, cfg + '.f32'), Buffer.from(raw, 'base64'));
    const png = await page.evaluate(() => window.__shot());
    fs.writeFileSync(path.join(dir, cfg + '.png'), Buffer.from(png.split(',')[1], 'base64'));
    info[cfg] = await page.evaluate(() => window.__info());
    console.log(name, cfg, 'ok');
  }
  // the dials on screen, for the hand-back
  await page.goto(`${base}?g1=0.5&g2=1`);
  await page.waitForFunction(() => window.__ready === true);
  await page.screenshot({ path: path.join(dir, 'dials-ui.png') });
  if (opt.perf) {
    const perf = {};
    for (const [w, h] of [[1141, 636], [1920, 1080], [2560, 1440]]) {
      await page.goto(`${base}?mode=perf&ui=0&w=${w}&h=${h}`);
      await page.waitForFunction(() => window.__ready === true);
      const r = { unlit: [], bake: [], live: [] };
      for (let k = 0; k < 5; k++) { // interleaved: the Mac is shared, so each variant gets the same load
        for (const v of Object.keys(r)) r[v].push(await page.evaluate((v) => window.__perf(150, v), v));
      }
      const best = Object.fromEntries(Object.entries(r).map(([v, a]) => [v + '_ms', Math.min(...a)]));
      perf[`${w}x${h}`] = { ...best, runs: r };
      console.log(name, 'perf', w, h, Object.entries(best).map(([k, v]) => k + ' ' + v.toFixed(2)).join('  '));
    }
    fs.writeFileSync(path.join(dir, 'perf.json'), JSON.stringify(perf, null, 1));
  }
  if (opt.configs !== 'none') fs.writeFileSync(path.join(dir, 'info.json'), JSON.stringify({ info, logs }, null, 1));
  await browser.close();
}
