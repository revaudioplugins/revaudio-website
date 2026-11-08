// the walk at 7 stops (the room as it is, full light) + the biggest drawn (not yet real) things in each frame
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import path from 'path';
const require = createRequire(path.resolve(process.env.PLAYWRIGHT_FROM || '/Users/danavivi/projects/revaudio/revaudio-website') + '/');
const { chromium } = require('playwright');
//   node finish-shots.mjs <out-dir> [port]   (out-dir/shots/w<walk>.webp + the top list on stdout; needs cwebp)
const OUT = process.argv[2], PORT = process.argv[3] || '4471';
if (!OUT) throw new Error('usage: node finish-shots.mjs <out-dir> [port]');
require('fs').mkdirSync(OUT + '/shots', { recursive: true });
const STOPS = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.88];
const b = await chromium.launch({ channel: 'chrome' }); const top = {};
for (const w of STOPS) {
  const p = await (await b.newContext({ viewport: { width: 1141, height: 636 }, deviceScaleFactor: 1 })).newPage();
  await p.goto(`http://127.0.0.1:${PORT}/tools/_home-opening/room.html?capture=${w}&expose`, { waitUntil: 'load', timeout: 90000 });
  await p.waitForFunction(() => window.__room && window.__room.R.items.find((i) => i.id === 'E07').model, null, { timeout: 60000 }); await p.waitForTimeout(4500);
  top[w] = await p.evaluate(async () => {
    const X = window.__room, THREE = await import('three'), cam = X.camera; cam.updateMatrixWorld();
    return X.R.items.filter((i) => i.s && i.s.label && i.obj.visible && !i.model).map((it) => {
      it.obj.updateMatrixWorld(true); const B = new THREE.Box3().setFromObject(it.obj); let x0 = 1, y0 = 1, x1 = -1, y1 = -1, behind = 0;
      for (let c = 0; c < 8; c++) { const v = new THREE.Vector3(c & 1 ? B.max.x : B.min.x, c & 2 ? B.max.y : B.min.y, c & 4 ? B.max.z : B.min.z);
        if (v.clone().applyMatrix4(cam.matrixWorldInverse).z > -0.05) { behind++; continue; } v.project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      const a = behind === 8 ? 0 : Math.max(0, Math.min(1, x1) - Math.max(-1, x0)) * Math.max(0, Math.min(1, y1) - Math.max(-1, y0)) / 4;
      return [it.id, +(100 * a).toFixed(1), it.s.label];
    }).filter((r) => r[1] >= 1.5).sort((a, b) => b[1] - a[1]).slice(0, 8);
  });
  const png = `${OUT}/w${w}.png`; await p.screenshot({ path: png });
  execFileSync('cwebp', ['-quiet', '-q', '82', png, '-o', `${OUT}/shots/w${String(w).replace('.', '')}.webp`]);
  await p.context().close();
}
console.log(JSON.stringify(top));
await b.close();
