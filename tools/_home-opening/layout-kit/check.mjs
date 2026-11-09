// Check a layout: objects that collide (flat things like rugs and decals may sit under others, thin wall boards may
// touch what stands in front of them), and which must-stay
// pieces are in frame at the first screen and along the walk.
//   node layout-kit/check.mjs <layout.json> [--size 1141x636] [--port 4471]      prints JSON; exit 1 on overlaps
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(path.resolve(process.env.PLAYWRIGHT_FROM || '/Users/danavivi/projects/revaudio/revaudio-website') + '/');
const { chromium } = require('playwright');
const [layoutPath, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const [w, h] = opt('--size', '1141x636').split('x').map(Number);
const port = opt('--port', '4471');
const layout = fs.readFileSync(layoutPath, 'utf8'); JSON.parse(layout);
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: w, height: h } });
await ctx.addInitScript((b) => { try { localStorage.setItem('hoRoom:v1', b); } catch (e) {} }, layout);
const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`http://127.0.0.1:${port}/tools/_home-opening/room.html?expose`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__room, null, { timeout: 20000 });
await page.waitForTimeout(800);
const MUST = ['M01', 'M02', 'M03', 'M04', 'SIGN', 'CAR', 'E07', 'E08', 'R16', 'P01', 'P02', 'P03', 'P04', 'P06'];
const res = await page.evaluate(async (MUST) => {
  const { R, camera, go } = window.__room;
  const V = camera.position.constructor;
  const box = (o) => { const b = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] }; o.updateWorldMatrix(true, true);
    o.traverse((m) => { if (!m.geometry || m.isLineSegments || m.isSprite) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox, v = new V();
      for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) { v.set(x, y, z).applyMatrix4(m.matrixWorld);
        for (let i = 0; i < 3; i++) { const c = 'xyz'[i]; b.min[i] = Math.min(b.min[i], v[c]); b.max[i] = Math.max(b.max[i], v[c]); } } });
    return b; };
  const tol = 0.02, hit = (a, b) => [0, 1, 2].every((i) => a.min[i] + tol < b.max[i] && b.min[i] + tol < a.max[i]);
  const items = R.items.filter((it) => it.obj && it.id && it.obj.visible && !(it.s && it.s.flat));
  const boxes = items.map((it) => [it, box(it.obj)]);
  // a thin board on a wall (a pegboard, a poster, a plate, a slat panel) and the neon may touch what stands in front
  const thin = ([it, b]) => it.id === 'SIGN' || Math.min(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]) <= 0.06;
  // a thing that stands ON another by design (its row says sits: '<id>': the monitors and the guitar on the test desk W07)
  const sits = (a, b) => (a.s && a.s.sits === b.id) || (b.s && b.s.sits === a.id);
  const overlaps = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++)
    if (!thin(boxes[i]) && !thin(boxes[j]) && !sits(boxes[i][0], boxes[j][0]) && hit(boxes[i][1], boxes[j][1])) overlaps.push([boxes[i][0].id, boxes[j][0].id]);
  const seen = {};
  for (const p of [0, 0.35, 0.7, 1]) {
    go(p); await new Promise((r) => setTimeout(r, 450)); camera.updateMatrixWorld();
    seen[p] = {};
    for (const id of MUST) {
      const it = R.items.find((x) => x.id === id); if (!it || !it.obj.visible) { seen[p][id] = 'hidden'; continue; }
      const b = box(it.obj), v = new V(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, front = false;
      for (const x of [b.min[0], b.max[0]]) for (const y of [b.min[1], b.max[1]]) for (const z of [b.min[2], b.max[2]]) {
        v.set(x, y, z).project(camera); if (v.z < 1) front = true;
        const sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); }
      const vx = Math.max(0, Math.min(innerWidth, x1) - Math.max(0, x0)), vy = Math.max(0, Math.min(innerHeight, y1) - Math.max(0, y0));
      seen[p][id] = front && vx * vy > 0 ? `${Math.round(vx)}x${Math.round(vy)}px` : 'out of frame';
    }
  }
  return { overlaps, seen };
}, MUST);
await browser.close();
console.log(JSON.stringify({ ...res, errors }, null, 1));
process.exit(res.overlaps.length || errors.length ? 1 : 0);
