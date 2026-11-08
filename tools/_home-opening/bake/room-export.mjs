// Export the room for the bake (route B, phase 2): room.html's live scene -> Blender files + the run time's UVs.
//   node room-export.mjs [--port 4493] [--out <scratch dir>] [--runtime <bake/room>] [--model N34:assets/models/x.glb:yaw]
//                        [--only N34,E01]   (a slot re-bake: every other mesh keeps its old lightmap UVs)
// Out: <out>/room-bake.glb + bake-scene.json (Blender: bake_room.py), <runtime>/layout.json + uv1.bin (room.html
// ?light=baked). The page is room.html?capture=0&expose (the default room, Dan's DEF, no sway), 1141 x 636.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('/Users/danavivi/projects/revaudio/revaudio-website/');
const { chromium } = require('playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname);
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4493'), out = arg('out', '.'), runtime = arg('runtime', path.join(HERE, 'room'));
const models = process.argv.flatMap((a, i) => (a === '--model' ? [process.argv[i + 1]] : []));
const only = arg('only', null)?.split(',');
fs.mkdirSync(out, { recursive: true }); fs.mkdirSync(runtime, { recursive: true });
const q = ['capture=0', 'expose', ...models.map((m) => 'model=' + m)].join('&');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 1141, height: 636 }, deviceScaleFactor: 1 })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text()); });
await page.goto(`http://127.0.0.1:${port}/tools/_home-opening/room.html?${q}`, { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => window.__room, null, { timeout: 60000 }); await page.waitForTimeout(3500);
const prev = only ? JSON.parse(fs.readFileSync(path.join(runtime, 'layout.json'))) : null;
const prevUv = only ? fs.readFileSync(path.join(runtime, 'uv1.bin')).toString('base64') : null;
const t = Date.now();
const r = await page.evaluate(async ({ prev, prevUv, only }) => {
  const M = await import('/tools/_home-opening/bake/room-scene.js');
  const uv = prevUv ? new Uint16Array(Uint8Array.from(atob(prevUv), (c) => c.charCodeAt(0)).buffer) : null;
  return M.exportRoom({ prev, prevUv: uv, only });
}, { prev, prevUv, only });
await browser.close();
fs.writeFileSync(path.join(out, 'room-bake.glb'), Buffer.from(r.glb, 'base64'));
fs.writeFileSync(path.join(out, 'bake-scene.json'), JSON.stringify(r.scene, null, 1));
fs.writeFileSync(path.join(runtime, 'layout.json'), JSON.stringify(r.layout));
fs.writeFileSync(path.join(runtime, 'uv1.bin'), Buffer.from(r.uv1, 'base64'));
const L = r.layout;
console.log(`exported in ${((Date.now() - t) / 1000).toFixed(1)} s: ${L.meshes.length} baked meshes, ${r.scene.counts.occluders} occluders, ${r.scene.counts.emitters} emitters, ${r.scene.lights.length} lights;`
  + ` ${L.area_m2} m2 baked, ${L.density.toFixed(1)} texels/m (${(100 / L.density).toFixed(2)} cm) at ${L.size} px; ${Object.keys(L.slots).length} slot rectangles`);
console.log('page warnings/errors:', errs.length ? errs.slice(0, 8) : 'none');
