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
const MUST = ['M01', 'M03', 'M04', 'SIGN', 'CAR', 'E07', 'E08', 'R16', 'P01', 'P02', 'P03', 'P04', 'P06'];
const res = await page.evaluate(async (MUST) => {
  const { R, camera, go } = window.__room;
  const V = camera.position.constructor;
  const box = (o) => { const b = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] }; o.updateWorldMatrix(true, true);
    o.traverse((m) => { if (!m.geometry || m.isLineSegments || m.isSprite) return; for (let a = m; a && a !== o; a = a.parent) if (a.userData.outOfFit || !a.visible) return; // a part a model hangs out of its block by design (E04's cable); a hidden part (the drawn CRT under a plugin's object) takes no room
      let bb; if (m.isInstancedMesh) { if (!m.boundingBox) m.computeBoundingBox(); bb = m.boundingBox; } else { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); bb = m.geometry.boundingBox; } // instanced knobs and feet: every copy, not the one at the origin
      const v = new V();
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
  // the mess on the floor (R.mess: its model, or its placeholder before the model lands), the shown pieces against the
  // standing things and each other: a surface of one passing through the other's box, 1 cm in (a tyre under a desk is
  // fine, a can in a drawer is not; boxes alone can't tell, a desk's box holds the air under it); loose papers may
  // slide under things like a rug
  const triBox = (c, h, t) => { // a triangle against a box (centre c, half sizes h): the 13 axes of Akenine-Möller's test
    const v = t.map((p) => [p.x - c[0], p.y - c[1], p.z - c[2]]);
    for (let i = 0; i < 3; i++) if (Math.min(v[0][i], v[1][i], v[2][i]) > h[i] || Math.max(v[0][i], v[1][i], v[2][i]) < -h[i]) return false;
    const e = [0, 1, 2].map((k) => v[(k + 1) % 3].map((q, i) => q - v[k][i]));
    const sep = (ax) => { const r = h[0] * Math.abs(ax[0]) + h[1] * Math.abs(ax[1]) + h[2] * Math.abs(ax[2]);
      const p = v.map((w) => w[0] * ax[0] + w[1] * ax[1] + w[2] * ax[2]); return Math.min(...p) > r || Math.max(...p) < -r; };
    for (const d of e) if (sep([0, -d[2], d[1]]) || sep([d[2], 0, -d[0]]) || sep([-d[1], d[0], 0])) return false; // each box axis x each edge
    return !sep([e[0][1] * e[1][2] - e[0][2] * e[1][1], e[0][2] * e[1][0] - e[0][0] * e[1][2], e[0][0] * e[1][1] - e[0][1] * e[1][0]]); }; // the triangle's plane
  const M4 = camera.matrixWorld.constructor, IM = new M4(), WM = new M4(), tri = [new V(), new V(), new V()];
  const cuts = (o, b) => { // a surface of o passes through the box b, 1 cm in from its sides
    const c = [0, 1, 2].map((i) => (b.max[i] + b.min[i]) / 2), h = [0, 1, 2].map((i) => (b.max[i] - b.min[i]) / 2 - Math.min(0.01, (b.max[i] - b.min[i]) / 4));
    let found = false;
    o.traverse((m) => { if (found || !m.geometry || m.isLineSegments || m.isSprite || !m.geometry.attributes.position) return;
      for (let a = m; a && a !== o; a = a.parent) if (a.userData.outOfFit || !a.visible) return;
      const pos = m.geometry.attributes.position, idx = m.geometry.index, n = idx ? idx.count : pos.count;
      for (let k = 0; k < (m.isInstancedMesh ? m.count : 1) && !found; k++) {
        if (m.isInstancedMesh) { m.getMatrixAt(k, IM); WM.multiplyMatrices(m.matrixWorld, IM); } else WM.copy(m.matrixWorld);
        for (let t = 0; t + 2 < n && !found; t += 3) {
          for (let q = 0; q < 3; q++) tri[q].fromBufferAttribute(pos, idx ? idx.getX(t + q) : t + q).applyMatrix4(WM);
          found = triBox(c, h, tri); } } });
    return found; };
  const mess = R.mess.map((m, i) => [m, i, m.model && m.model.visible ? m.model : m.mesh.visible ? m.mesh : null])
    .filter(([m, , o]) => o && m.t.k !== 'papers').map(([m, i, o]) => ({ id: `mess${i}:${m.t.k}`, o, b: box(o) }));
  for (let i = 0; i < mess.length; i++) {
    const a = mess[i];
    for (const [it, b] of boxes) if (!thin([it, b]) && hit(a.b, b) && cuts(it.obj, a.b)) overlaps.push([a.id, it.id]);
    for (let j = i + 1; j < mess.length; j++) if (hit(a.b, mess[j].b) && (cuts(mess[j].o, a.b) || cuts(a.o, mess[j].b))) overlaps.push([a.id, mess[j].id]);
  }
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
// pairs looked at and kept (mess seed 1): the cut can't be seen from the walk
const TUCKED = [['mess22:drum', 'N23'], ['mess22:drum', 'N28']]; // the drum tucked against the couch's arm and the fridge's corner: the arm's end is inside the drum (11-11)
const tucked = res.overlaps.filter(([a, b]) => TUCKED.some(([x, y]) => (a === x && b === y) || (a === y && b === x)));
res.overlaps = res.overlaps.filter((o) => !tucked.includes(o));
console.log(JSON.stringify({ ...res, tucked, errors }, null, 1));
process.exit(res.overlaps.length || errors.length ? 1 : 0);
