// the GPU work per frame at walk spots, independent of how busy the Mac is: WebGL draw calls + triangles per frame
//   node drawcalls.mjs [port] [page]   (page: room.html, or room-prev.html = HEAD's copy for a before / after)
import { createRequire } from 'module';
import path from 'path';
const require = createRequire(path.resolve(process.env.PLAYWRIGHT_FROM || '/Users/danavivi/projects/revaudio/revaudio-website') + '/');
const { chromium } = require('playwright');
const [port = '4471', pg = 'room.html'] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome' });
const p = await (await b.newContext({ viewport: { width: 1141, height: 636 }, deviceScaleFactor: 2 })).newPage();
await p.addInitScript(() => {
  const W = window.__dc = { calls: 0, tris: 0 }, P = WebGL2RenderingContext.prototype;
  const tri = (mode, n, inst = 1) => { if (mode === 4) W.tris += (n / 3) * inst; };
  for (const [f, wrap] of [['drawElements', (m, n) => tri(m, n)], ['drawArrays', (m, f0, n) => tri(m, n)],
    ['drawElementsInstanced', (m, n, t, o, i) => tri(m, n, i)], ['drawArraysInstanced', (m, f0, n, i) => tri(m, n, i)]]) {
    const o = P[f]; P[f] = function (...a) { W.calls++; wrap(...a); return o.apply(this, a); };
  }
});
await p.goto(`http://127.0.0.1:${port}/tools/_home-opening/${pg}?expose`, { waitUntil: 'load', timeout: 90000 });
await p.waitForFunction(() => window.__room, null, { timeout: 60000 }); await p.waitForTimeout(6000);
for (const w of [0, 0.3, 0.6, 0.9]) {
  await p.evaluate((w) => window.__room.go(w), w); await p.waitForTimeout(800);
  const r = await p.evaluate(() => new Promise((res) => { const W = window.__dc; let n = 0; const c0 = W.calls, t0 = W.tris;
    const f = () => { if (++n < 30) requestAnimationFrame(f); else res([(W.calls - c0) / 30, (W.tris - t0) / 30]); }; requestAnimationFrame(f); }));
  console.log(`walk ${w}: ${r[0].toFixed(0)} draw calls, ${(r[1] / 1000).toFixed(0)}k triangles per frame`);
}
await b.close();
