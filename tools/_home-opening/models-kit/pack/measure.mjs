// Step 1 of the pack (README.md): which size the walk reads each texture at. Per walk stop (41 stops, 0 .. 0.99) and per
// material slot it renders a pass whose pixels carry the mip level the graphics chip would sample there
// (lambda = log2(Pmax / min(ceil(Pmax/Pmin), aniso)), with the texture's own size, UV transform and anisotropy), behind
// the real depth, so hidden surfaces don't count. The page loads the full-size originals (masters/) whatever assets/
// holds, so the answer never depends on an earlier pack. The page gets its extra handles in memory only.
//   node measure.mjs <out.json> <vw> <vh> <dpr>     env KIT_PORT: a server on the worktree root (pack.sh starts one)
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire(path.resolve(process.env.PLAYWRIGHT_FROM || '/Users/danavivi/projects/revaudio/revaudio-website') + '/');
const { chromium } = require('playwright');
const ROOM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), MASTERS = path.join(ROOM, 'masters');
const PORT = process.env.KIT_PORT || '4618';
const [out, vw = 1440, vh = 900, dpr = 2] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', headless: true, timeout: 0, args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: +vw, height: +vh }, deviceScaleFactor: +dpr });
const withHandles = (html) => html.replace(/(window\.__room = \{ R, camera, L, S, walkDist, arrange, go: \(p\) => jumpTo\(p \* L\.walkPx\))( \};)/, '$1, renderer, composer, scene, THREE, MODELS$2');
await ctx.route('**/tools/_home-opening/room.html*', async (r) => {
  const html = await (await r.fetch()).text(), ext = withHandles(html);
  if (ext === html) throw new Error('measure: no ?expose line to extend in room.html');
  return r.fulfill({ body: ext, contentType: 'text/html' });
});
await ctx.route(/\/tools\/_home-opening\/assets\/(models|pbr)\/[^/?]+\.(glb|webp)(\?.*)?$/, (r) => { // the originals, not the packed copies
  const m = new URL(r.request().url()).pathname.match(/assets\/(models|pbr)\/([^/]+)$/), f = path.join(MASTERS, m[1], decodeURIComponent(m[2]));
  return fs.existsSync(f) ? r.fulfill({ path: f, contentType: m[1] === 'models' ? 'model/gltf-binary' : 'image/webp' }) : r.continue();
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(`http://127.0.0.1:${PORT}/tools/_home-opening/room.html?capture=0&expose`, { timeout: 0 });
await page.waitForFunction(() => window.__room && window.__room.renderer && (!document.getElementById('still') || document.getElementById('still').dataset.done !== undefined), null, { timeout: 0 });
await page.waitForTimeout(2500);
const stops = []; for (let p = 0; p <= 0.9951; p += 0.025) stops.push(+p.toFixed(3)); stops.push(0.99);
const setup = await page.evaluate(() => {
  const { THREE, renderer, scene, R } = window.__room;
  const SLOTS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'specularIntensityMap', 'clearcoatMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap', 'bumpMap', 'lightMap', 'sheenColorMap', 'transmissionMap'];
  const VS = `uniform mat3 uT; varying vec2 vUv;
    #include <common>
    void main() { vUv = (uT * vec3(uv, 1.0)).xy;
    #include <begin_vertex>
    #include <project_vertex>
    }`;
  const FS = `uniform vec3 uId; uniform vec2 uSize; uniform float uAniso; varying vec2 vUv;
    void main() { vec2 dx = dFdx(vUv) * uSize, dy = dFdy(vUv) * uSize; float px = length(dx), py = length(dy);
      float pmax = max(px, py), pmin = max(min(px, py), 1e-6); float n = min(ceil(pmax / pmin), uAniso);
      float lambda = log2(max(pmax / n, 1e-6)); gl_FragColor = vec4(uId, clamp((lambda + 4.0) / 12.0, 0.0, 1.0)); }`;
  const IDVS = `#include <common>
    void main() {
    #include <begin_vertex>
    #include <project_vertex>
    }`;
  const IDFS = `uniform vec3 uId; void main() { gl_FragColor = vec4(uId, 1.0); }`;
  const enc = (n) => new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  const occluder = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: { uT: { value: new THREE.Matrix3() }, uId: { value: new THREE.Vector3(0, 0, 0) }, uSize: { value: new THREE.Vector2(1, 1) }, uAniso: { value: 1 } } });
  const skipMat = new THREE.MeshBasicMaterial({ visible: false });
  // owners: a slot (its block or prop, or its model) or a named part of the room (R.<key>)
  const byObj = new Map();
  for (const it of R.items) { if (it.obj) byObj.set(it.obj, it.id); if (it.model) byObj.set(it.model, it.id + ':model'); if (it.standModel) byObj.set(it.standModel, it.id + ':stand'); }
  for (const [k, v] of Object.entries(R)) {
    if (v && v.isObject3D && !byObj.has(v)) byObj.set(v, 'R.' + k);
    else if (Array.isArray(v)) for (const x of v) if (x && x.isObject3D && !byObj.has(x)) byObj.set(x, 'R.' + k);
  }
  const owner = (o) => { for (let p = o; p; p = p.parent) if (byObj.has(p)) return byObj.get(p); return 'other'; };
  const W = (window.__mip = { passes: {}, mats: [], tex: {}, meshes: [], owners: [], ownerIdx: {}, occluder, skipMat, idMats: {} });
  const vizCache = new Map();
  let id = 1;
  const skipped = (m) => !m || m.visible === false || (m.transparent && !m.depthWrite) || (m.colorWrite === false && m.depthWrite === false);
  W.skipped = skipped;
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const list = [o.material].flat();
    const ow = owner(o);
    if (!(ow in W.ownerIdx)) { W.ownerIdx[ow] = W.owners.length + 1; W.owners.push(ow); }
    const oi = W.ownerIdx[ow];
    const rec = { o, orig: o.material, viz: {}, hide: list.every(skipped), owner: ow };
    // the id pass: one flat material per owner and side
    rec.idm = list.map((m) => {
      if (skipped(m)) return skipMat;
      const key = oi + '|' + (m.side || 0);
      return (W.idMats[key] ||= new THREE.ShaderMaterial({ vertexShader: IDVS, fragmentShader: IDFS, side: m.side, uniforms: { uId: { value: enc(oi) } } }));
    });
    if (!Array.isArray(o.material)) rec.idm = rec.idm[0];
    for (const slot of SLOTS) {
      let any = false;
      const vm = list.map((m) => {
        if (skipped(m)) return skipMat;
        const t = m && m[slot];
        const im = t && (t.source?.data || t.image);
        if (!t || !t.isTexture || !im || !im.width) return occluder;
        any = true;
        const key = m.uuid + '|' + slot;
        if (!vizCache.has(key)) {
          t.updateMatrix();
          const mid = id++;
          const sm = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, side: m.side,
            uniforms: { uT: { value: t.matrix.clone() }, uId: { value: enc(mid) },
              uSize: { value: new THREE.Vector2(im.width, im.height) }, uAniso: { value: Math.min(t.anisotropy || 1, renderer.capabilities.getMaxAnisotropy()) } } });
          vizCache.set(key, sm);
          const label = (im.currentSrc || im.src || '').replace(location.origin, '') || (t.name || '');
          W.mats[mid] = { mid, slot, src: t.source.uuid, w: im.width, h: im.height, label, owner: ow, aniso: Math.min(t.anisotropy || 1, renderer.capabilities.getMaxAnisotropy()), mipmaps: t.generateMipmaps, minFilter: t.minFilter };
          W.tex[t.source.uuid] ||= { w: im.width, h: im.height, label, owners: new Set(), isCanvas: !!(im.getContext) };
          W.tex[t.source.uuid].owners.add(ow);
        }
        return vizCache.get(key);
      });
      if (any) { rec.viz[slot] = Array.isArray(o.material) ? vm : vm[0]; W.passes[slot] = (W.passes[slot] || 0) + 1; }
    }
    W.meshes.push(rec);
  });
  for (const k of Object.keys(W.tex)) W.tex[k].owners = [...W.tex[k].owners];
  return { passes: W.passes, mats: W.mats.filter(Boolean).length, tex: Object.keys(W.tex).length, meshes: W.meshes.length, owners: W.owners.length };
});
console.log('setup', JSON.stringify(setup));
const result = { stops, vw: +vw, vh: +vh, dpr: +dpr, per: {}, cam: {} };
for (const p of stops) {
  await page.evaluate((p) => window.__room.go(p), p);
  await page.waitForTimeout(350);
  const h = await page.evaluate(() => {
    const { THREE, renderer, scene, camera } = window.__room, W = window.__mip;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2()), w = size.x, hh = size.y;
    W.rt ||= new THREE.WebGLRenderTarget(w, hh, { depthBuffer: true });
    const buf = (W.buf ||= new Uint8Array(w * hh * 4));
    const bg = scene.background, fog = scene.fog; scene.background = null; scene.fog = null;
    const prevRT = renderer.getRenderTarget(), prevClear = renderer.getClearColor(new THREE.Color()), prevA = renderer.getClearAlpha();
    const prevSM = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false;
    const others = [];
    scene.traverse((o) => { if ((o.isPoints || o.isLine || o.isSprite) && o.material) { others.push([o, o.material]); o.material = W.skipMat; } });
    const hist = {}, own = {};
    camera.updateMatrixWorld();
    const passes = ['__id', ...Object.keys(W.passes)];
    for (const slot of passes) {
      for (const r of W.meshes) r.o.material = r.hide ? W.skipMat : slot === '__id' ? r.idm : (r.viz[slot] || (Array.isArray(r.orig) ? r.orig.map((m) => (W.skipped(m) ? W.skipMat : W.occluder)) : (W.skipped(r.orig) ? W.skipMat : W.occluder)));
      renderer.setRenderTarget(W.rt); renderer.setClearColor(0x000000, 1); renderer.clear(true, true, true);
      renderer.render(scene, camera);
      renderer.readRenderTargetPixels(W.rt, 0, 0, w, hh, buf);
      for (let i = 0; i < buf.length; i += 4) {
        const mid = (buf[i] << 16) | (buf[i + 1] << 8) | buf[i + 2]; if (!mid) continue;
        if (slot === '__id') { own[mid] = (own[mid] || 0) + 1; continue; }
        const bin = Math.min(47, Math.max(0, Math.floor((buf[i + 3] / 255 * 12) * 4)));
        const a = (hist[mid] ||= new Array(48).fill(0)); a[bin]++;
      }
    }
    for (const r of W.meshes) r.o.material = r.orig;
    for (const [o, m] of others) o.material = m;
    scene.background = bg; scene.fog = fog; renderer.shadowMap.enabled = prevSM;
    renderer.setRenderTarget(prevRT); renderer.setClearColor(prevClear, prevA);
    const ownNamed = {}; for (const [k, v] of Object.entries(own)) ownNamed[W.owners[+k - 1]] = v;
    return { w, h: hh, hist, own: ownNamed, cam: camera.position.toArray().map((x) => +x.toFixed(3)) };
  });
  result.per[p] = { hist: h.hist, own: h.own };
  result.cam[p] = h.cam;
  result.size = [h.w, h.h];
  process.stdout.write(`${p} `);
}
result.mats = await page.evaluate(() => window.__mip.mats.filter(Boolean));
result.tex = await page.evaluate(() => window.__mip.tex);
result.owners = await page.evaluate(() => window.__mip.owners);
result.models = await page.evaluate(() => Object.fromEntries(Object.entries(window.__room.MODELS).flatMap(([k, v]) => [[k, v.src], ...(v.stand ? [[k + ':stand', v.stand]] : [])])));
fs.writeFileSync(out, JSON.stringify(result));
console.log('\nwrote', out, 'drawing buffer', result.size);
await browser.close();
