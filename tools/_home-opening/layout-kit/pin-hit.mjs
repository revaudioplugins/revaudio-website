// which room slot is under each of Dan's pins: a ray from the walk camera through the pin (light cones skipped)
//   node pin-hit.mjs '<pins JSON: [{n, x, y}], 0-1 of a 1141x636 frame, as a review bench stores them>' <out.json> [walk] [port]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(path.resolve(process.env.PLAYWRIGHT_FROM || '/Users/danavivi/projects/revaudio/revaudio-website') + '/');
const { chromium } = require('playwright');
const pins = JSON.parse(process.argv[2]), walk = process.argv[4] || '0', port = process.argv[5] || '4471';
const b = await chromium.launch({ channel: 'chrome' }); const p = await (await b.newContext({ viewport: { width: 1141, height: 636 }, deviceScaleFactor: 1 })).newPage();
await p.goto(`http://127.0.0.1:${port}/tools/_home-opening/room.html?capture=${walk}&expose`, { waitUntil: 'load', timeout: 90000 });
await p.waitForFunction(() => window.__room && window.__room.R.items.find((i) => i.id === 'E07').model, null, { timeout: 60000 }); await p.waitForTimeout(4500);
const res = await p.evaluate(async (pins) => {
  const X = window.__room, THREE = await import('three'), cam = X.camera, rc = new THREE.Raycaster(); cam.updateMatrixWorld();
  let root = X.R.items[0].obj; while (root.parent) root = root.parent;
  const owner = new Map(); for (const it of X.R.items) it.obj.traverse((o) => { if (!owner.has(o)) owner.set(o, it); });
  return pins.map((pn) => {
    rc.setFromCamera(new THREE.Vector2(pn.x * 2 - 1, 1 - pn.y * 2), cam);
    const hits = rc.intersectObject(root, true).filter((h) => h.object.visible && (h.object.isMesh) && !(h.object.material && (h.object.material.isShaderMaterial || (h.object.material.transparent && !h.object.material.depthWrite))));
    const out = [];
    for (const h of hits.slice(0, 6)) { let o = h.object, it = null; while (o && !it) { it = owner.get(o); o = o.parent; } const m = h.object.material || {}; out.push([it ? it.id : (h.object.name || h.object.type), +h.distance.toFixed(2), it && it.s && it.s.label ? it.s.label.slice(0, 50) : [h.object.geometry.type, m.type, m.transparent ? 'T' + (m.opacity ?? '').toString().slice(0, 4) : 'O', m.blending, m.depthWrite ? 'dw' : 'nodw', h.point.toArray().map((v) => v.toFixed(1)).join(','), (h.object.parent && (h.object.parent.name || h.object.parent.type)) || ''].join(' ')]); }
    return { n: pn.n, hits: out };
  });
}, pins);
fs.writeFileSync(process.argv[3], JSON.stringify(res, null, 1));
for (const r of res) console.log(r.n, r.hits.slice(0, 3).map((h) => h.join(' ')).join(' | '));
await b.close();
