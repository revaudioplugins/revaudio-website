// the walk as the 3D set sees it, for the film to be painted over: N frames, 1920x1080, capture mode (no nav, labels,
// line, sway), reduced motion (LEDs, pulse and flicker held still). Frames are spaced for an even pace on screen:
// steady metres while the room is long ahead, then a steady growth of the far wall (s(d) below), eased in and out.
import { chromium } from 'playwright';
import fs from 'fs';
const out = process.argv[2], N = +(process.argv[3] || 240), extra = process.argv[4] || '', C = 3;
const URL = `http://127.0.0.1:4471/tools/_home-opening/room.html?capture=0${extra}&expose`;
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(6000);
if (process.argv[5] === 'nomon') await page.evaluate(() => { for (const it of window.__room.R.items) if (it.kind === 'monitor') it.obj.visible = false; });
const K = 20000, tab = await page.evaluate((K) => { const t = []; for (let i = 0; i <= K; i++) t.push(window.__room.walkDist(i / K)); return t; }, K);
const s = (d) => (d >= C ? d / C : 1 + Math.log(d / C)), sInv = (v) => (v >= 1 ? v * C : C * Math.exp(v - 1));
const pOf = (d) => { let i = 0; while (i < K && tab[i + 1] > d) i++; if (i >= K) return 1; const u = (tab[i] - d) / (tab[i] - tab[i + 1]); return (i + u) / K; };
const sm = (u) => u * u * (3 - 2 * u), s0 = s(tab[0]), s1 = s(tab[K]);
const cams = [];
for (let i = 0; i < N; i++) {
  const u = i / (N - 1), v = 0.7 * u + 0.3 * sm(u), p = i === N - 1 ? 1 : pOf(sInv(s0 + (s1 - s0) * v));
  await page.evaluate((p) => window.__room.go(p), p);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
  cams.push(await page.evaluate((p) => { const c = window.__room.camera; return { want: p, z: c.position.z, y: c.position.y, x: c.position.x, fov: c.fov, aspect: c.aspect }; }, p));
  await page.locator('#gl').screenshot({ path: `${out}/${String(i).padStart(3, '0')}.png` });
}
fs.writeFileSync(`${out}/cams.json`, JSON.stringify(cams));
console.log('frames', N, 'd0', tab[0].toFixed(3), 'dEnd', tab[K].toFixed(3), 'errors', JSON.stringify(errs.slice(0, 5)));
await b.close();
