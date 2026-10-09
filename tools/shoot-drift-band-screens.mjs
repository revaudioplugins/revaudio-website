/**
 * shoot-drift-band-screens.mjs — the /drift #band screens, shot from the DRIFT plugin's own UI (website rule: product
 * images come from the real UI). Dan 2026-10-09: "bring the real spectrum of drift and the imager from real drift".
 *
 *   cd ~/projects/revaudio/Drift/Source/ui/public && python3 -m http.server 4399 --bind 127.0.0.1
 *   node tools/shoot-drift-band-screens.mjs [http://127.0.0.1:4399/index.html]
 *
 * The plugin's left cabinet (#lPlateWell + #lPlate + #lPlateShade: BAND SELECT over STEREO IMAGER) with its live
 * layers hidden (#eqPanel: spectrum canvas + cut handles; #scopePanel: lissajous), at DPR 2, cut at the seam between
 * the two screens into band-glass.png (BAND SELECT) and imager-glass.png (STEREO IMAGER). The page draws the live layers
 * with the plugin's own drawing code (src/lib/drift/bandscreens.ts) at the rects in band.json (stage px, per piece).
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.argv[2] ?? 'http://127.0.0.1:4399/index.html';
const outDir = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/seasons/drift/band');
const DPR = 2;
const SEAM = 554;   // stage y between the band screen's bezel and the STEREO IMAGER title

const br = await chromium.launch();
const p = await (await br.newContext({ viewport: { width: 1725, height: 912 }, deviceScaleFactor: DPR, reducedMotion: 'reduce' })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.evaluate(() => document.body.classList.add('ui-ready'));
await p.waitForTimeout(800);

const geo = await p.evaluate(() => {
  const r = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
  const s = document.createElement('style');
  s.textContent = `html, body { background: transparent !important; } body * { visibility: hidden !important; }
    #lPlateWell, #lPlate, #lPlateShade { visibility: visible !important; }`;
  document.head.appendChild(s);
  return { plate: r('lPlate'), eq: r('eqPanel'), scope: r('scopePanel') };
});
await p.waitForTimeout(300);
const full = join(outDir, '_cabinet.png');
await p.screenshot({ path: full, clip: { x: geo.plate.x, y: geo.plate.y, width: geo.plate.w, height: geo.plate.h }, omitBackground: true });

const px = (v) => Math.round(v * DPR);
const seam = SEAM - geo.plate.y;
await sharp(full).extract({ left: 0, top: 0, width: px(geo.plate.w), height: px(seam) }).png().toFile(join(outDir, 'band-glass.png'));
await sharp(full).extract({ left: 0, top: px(seam), width: px(geo.plate.w), height: px(geo.plate.h - seam) }).png().toFile(join(outDir, 'imager-glass.png'));
const { unlinkSync } = await import('node:fs'); unlinkSync(full);

// the plugin's own boxes: #eqPanel = a 410x156 box at scale .68/.70 (plot 410x134 inside); #scopePanel = 286x254 holding a
// 352x304 canvas at its top left (the plugin draws inside the glass, canvas x 9..289 / y 16..240)
const out = {
  w: geo.plate.w,
  band: { h: seam, eq: { x: geo.eq.x - geo.plate.x, y: geo.eq.y - geo.plate.y, w: 410, h: 156, sx: 0.68, sy: 0.70 } },
  imager: { h: geo.plate.h - seam, scope: { x: geo.scope.x - geo.plate.x, y: geo.scope.y - SEAM, w: 352, h: 304 } },
};
writeFileSync(join(outDir, 'band.json'), JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify(out));
if (errs.length) console.log('page errors:', errs);
await br.close();
