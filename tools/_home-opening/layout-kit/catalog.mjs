// Regenerate the kit from the room after the room changes: catalog.json (every object: size and centre in metres, the
// fields that move it; every bench setting with its range) and start-layout.json (the room as it opens).
//   node layout-kit/catalog.mjs [--port 4471]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(path.resolve(process.env.PLAYWRIGHT_FROM || '/Users/danavivi/projects/revaudio/revaudio-website') + '/');
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const port = args.includes('--port') ? args[args.indexOf('--port') + 1] : '4471';
const kit = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(kit, '..', 'room.html'), 'utf8');
// the bench's settings, read from its SLIDERS table: [group] or [key, label, min, max, step] or [key, label, options]
const sl = src.slice(src.indexOf('const SLIDERS = ['), src.indexOf('];', src.indexOf('const SLIDERS = [')));
const settings = [];
let group = '';
for (const m of sl.matchAll(/\['([^']+)'(?:, '([^']*)'(?:, (-?[\d.]+), (-?[\d.]+), ([\d.]+)|, (\{[^}]*\}|null))?)?\]/g)) {
  if (m[2] === undefined) { group = m[1]; continue; }
  const row = { key: m[1], label: m[2], group };
  if (m[3] !== undefined) Object.assign(row, { min: +m[3], max: +m[4], step: +m[5] });
  else if (m[6] && m[6] !== 'null') row.options = m[6];
  else if (m[1] === 'signWall') row.options = '{ endRight, endLeft, left, right, aisle }';
  settings.push(row);
}
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1141, height: 636 } });
const page = await ctx.newPage();
await page.goto(`http://127.0.0.1:${port}/tools/_home-opening/room.html?expose`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__room, null, { timeout: 20000 });
await page.waitForTimeout(800);
const { items, start, L } = await page.evaluate(() => {
  const { R, S, L } = window.__room;
  const V = R.items[0].obj.position.constructor;
  const box = (o) => { // world bounds of the object's meshes (not its edge lines or label)
    const b = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] }; o.updateWorldMatrix(true, true);
    o.traverse((m) => {
      if (!m.geometry || m.isLineSegments || m.isSprite) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox, v = new V();
      for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
        v.set(x, y, z).applyMatrix4(m.matrixWorld);
        for (let i = 0; i < 3; i++) { const c = 'xyz'[i]; b.min[i] = Math.min(b.min[i], v[c]); b.max[i] = Math.max(b.max[i], v[c]); }
      }
    });
    return b;
  };
  const r2 = (n) => Math.round(n * 100) / 100;
  const items = R.items.filter((it) => it.id).map((it) => {
    const s = it.s || {}, b = box(it.obj);
    const fields = it.kind === 'car' ? 'bench car sliders (carZ, carOut, carYaw, liftType, liftH)' : it.kind === 'sign' ? 'bench sign sliders (signWall, signF, signX, signY, signScale, signTilt)'
      : ['f', 'x', 'y', 's', ...(it.kind !== 'poster' ? ['r'] : []), ...(it.mount === 'wall' || it.kind === 'side' ? ['side'] : [])].filter((k) => !(it.mount === 'end' && k === 'f')).join(', ');
    return { id: it.id, kind: it.kind, mount: it.mount, label: s.label, cat: s.cat, flat: !!s.flat,
      size_m: [r2(b.max[0] - b.min[0]), r2(b.max[1] - b.min[1]), r2(b.max[2] - b.min[2])],
      center_m: [r2((b.min[0] + b.max[0]) / 2), r2((b.min[1] + b.max[1]) / 2), r2((b.min[2] + b.max[2]) / 2)],
      f_now: r2(it.obj.position.z / L.span), side: it.side ?? s.side ?? null, moves: fields, visible: it.obj.visible };
  });
  const { bench, edit, ...rest } = S;
  return { items, start: rest, L: { span: L.span, roomLen: L.roomLen, d0: L.d0, front: L.front } };
});
await browser.close();
const note = 'Every object in the room today. size_m / center_m in world metres: x across (0 = the aisle, - = left wall), y up, z out from the far end wall (the TV at z 0, the camera starts at z ' + (L.front + L.d0).toFixed(2) + '). f_now = z / ' + L.span.toFixed(2) + ' (the move field f). moves = the per-object fields the bench can change.';
fs.writeFileSync(path.join(kit, 'catalog.json'), JSON.stringify({ note, L, settings, items }, null, 1));
fs.writeFileSync(path.join(kit, 'start-layout.json'), JSON.stringify(start, null, 1));
console.log(items.length, 'items;', settings.length, 'settings; span', L.span);
