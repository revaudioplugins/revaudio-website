// frame rate of the room at walk spots: node fps.mjs [WxH] [dpr] [extra-query] [port] [page]
// before / after: `git show HEAD:tools/_home-opening/room.html > tools/_home-opening/room-prev.html`, then run with page
// room-prev.html and room.html in turns (the Mac's load moves the numbers; compare runs made together), delete room-prev.html
import { createRequire } from 'module';
import path from 'path';
const require = createRequire(path.resolve(process.env.PLAYWRIGHT_FROM || '/Users/danavivi/projects/revaudio/revaudio-website') + '/');
const { chromium } = require('playwright');
const [size = '1141x636', dpr = '2', extra = '', port = '4471', pg = 'room.html'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: +dpr });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${port}/tools/_home-opening/${pg}?expose${extra}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__room, null, { timeout: 20000 }); await page.waitForTimeout(3500);
const gpu = await page.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; });
console.log('gpu', gpu);
for (const p of [0, 0.3, 0.6, 0.9]) {
  await page.evaluate((p) => window.__room.go(p), p); await page.waitForTimeout(600);
  const r = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); }));
  console.log(`walk ${p}: ${r.toFixed(1)} fps`);
}
await browser.close();
