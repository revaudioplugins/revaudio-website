// The TV hand-off: the walk's last 3D frame against the live TV that replaces it at the lock, per screen size. Tone
// mapping, bloom or haze on the TV face would show as a jump at the lock, so the look pass re-runs this.
//   node layout-kit/handoff.mjs [layout.json] [--tol 24] [--out <dir>] [--port 4471]
// Prints, per size, the share of pixels where any channel differs by more than --tol (0-255); --out keeps both frames
// and a mask of the pixels that differ (red). Without a layout it checks the room as it opens.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(path.resolve(process.env.PLAYWRIGHT_FROM || '/Users/danavivi/projects/revaudio/revaudio-website') + '/');
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const layoutPath = args[0] && !args[0].startsWith('--') ? args[0] : null;
const layout = layoutPath ? fs.readFileSync(layoutPath, 'utf8') : null;
if (layout) JSON.parse(layout);
const tol = +opt('--tol', '24'), out = opt('--out', null), port = opt('--port', '4471');
if (out) fs.mkdirSync(out, { recursive: true });
const url = `http://127.0.0.1:${port}/tools/_home-opening/room.html?expose`;
const browser = await chromium.launch({ channel: 'chrome' });
for (const [w, h] of [[1141, 636], [1440, 900], [1920, 1080], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  if (layout) await ctx.addInitScript((b) => { try { localStorage.setItem('hoRoom:v1', b); } catch (e) {} }, layout);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__room, null, { timeout: 20000 });
  await page.waitForTimeout(3200);                                                    // past the power-on intro
  await page.evaluate(() => window.__room.go(0.998)); await page.waitForTimeout(1500); // the last 3D frame
  const a = await page.screenshot();
  await page.evaluate(() => window.__room.go(1)); await page.waitForTimeout(1500);     // the live TV, faded in
  const b = await page.screenshot();
  const r = await page.evaluate(async ({ a, b, tol, mask }) => {
    const img = async (s) => createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob());
    const [A, B] = await Promise.all([img(a), img(b)]);
    const c = new OffscreenCanvas(A.width, A.height), g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, A.width, A.height).data;
    g.drawImage(B, 0, 0); const im = g.getImageData(0, 0, A.width, A.height), db = im.data;
    let n = 0;
    for (let i = 0; i < da.length; i += 4) {
      const off = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])) > tol;
      if (off) n++;
      if (mask) { db[i] = off ? 255 : db[i] >> 2; db[i + 1] = off ? 40 : db[i + 1] >> 2; db[i + 2] = off ? 40 : db[i + 2] >> 2; }
    }
    let png = null;
    if (mask) {
      g.putImageData(im, 0, 0);
      const bl = await c.convertToBlob();
      png = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.readAsDataURL(bl); });
    }
    return { pct: n / (da.length / 4) * 100, png };
  }, { a: a.toString('base64'), b: b.toString('base64'), tol, mask: !!out });
  if (out) {
    fs.writeFileSync(path.join(out, `handoff-${w}x${h}-3d.png`), a);
    fs.writeFileSync(path.join(out, `handoff-${w}x${h}-live.png`), b);
    fs.writeFileSync(path.join(out, `handoff-${w}x${h}-diff.png`), Buffer.from(r.png, 'base64'));
  }
  console.log(`${w}x${h}`.padEnd(10), `${r.pct.toFixed(2)} % of pixels differ (> ${tol})`, errors.length ? errors : 'no page errors');
  await ctx.close();
}
await browser.close();
