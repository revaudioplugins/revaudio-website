// The room out to Blender (todo step 2): room.html's own scene, written by three.js's GLTFExporter, plus a sidecar
// with what glTF can't carry: the walk camera per screen size, the light groups, the slots' kinds, and every slot's
// box corners projected to pixels by three.js (the parity check's three.js side; build.py does Blender's).
//   node tools/_home-opening/blender/export.mjs --port 4490 --out <dir>
// Out: room.glb (the shell, every slot by id, the lights; materials keep colour / roughness / metal / emission but no
// maps: Blender re-dresses by kind), room-meta.json. Served from the worktree root (python3 -m http.server).
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path';
const require = createRequire('/Users/danavivi/projects/revaudio/revaudio-website/');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const port = arg('port', '4490'), out = arg('out', '.');
const SCREENS = [[1141, 636], [1440, 900], [1920, 1080], [390, 844]]; // Dan's laptop, two desktops, a phone
const STATIONS = [0, 0.25, 0.5, 0.75, 0.97];
const URL = `http://127.0.0.1:${port}/tools/_home-opening/room.html?capture=0&expose`;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const open = async (w, h) => {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(URL, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(3500);
  return { page, errs };
};

// 1. the walk camera at each station, per screen (the camera adapts to the screen; the room doesn't)
const meta = { from: 'room.html', stations: STATIONS, screens: {} };
for (const [w, h] of SCREENS) {
  const { page, errs } = await open(w, h);
  const poses = await page.evaluate(async (stations) => {
    const X = window.__room, cam = X.camera, frame = () => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
    const res = [];
    for (const p of stations) { X.go(p); await frame(); cam.updateMatrixWorld(); res.push({ p, pos: cam.position.toArray(), quat: cam.quaternion.toArray(), fov: cam.fov, aspect: cam.aspect, near: cam.near, far: cam.far }); }
    return res;
  }, STATIONS);
  meta.screens[`${w}x${h}`] = { w, h, stations: poses, errors: errs };
  await page.context().close();
}

// 2. the export, from a copy taken in one tick (the frame loop keeps moving the live room: the car idles, VU bars),
//    and the markers from that same copy, projected through every pose above
const { page, errs } = await open(...SCREENS[0]);
const r = await page.evaluate(async (screens) => {
  const THREE = await import('three');
  const X = window.__room, R = X.R, scene = R.floor.parent;
  const frame = () => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
  X.go(0); await frame(); // the lights at the first screen's levels (the walk dims the far end's)
  const group = new Map();
  R.neon.forEach((n) => { const g = n.side < 0 ? 'neonL' : 'neonR'; group.set(n.tube, g); n.lights.forEach((l) => group.set(l, g)); });
  R.lamps.forEach((lp) => [lp.light, lp.bulb, lp.shade].forEach((o) => o && group.set(o, 'lamps')));
  [R.tv.glow, R.tv.halo].forEach((o) => group.set(o, 'tv'));
  [R.signLight, R.sign].forEach((o) => o && group.set(o, 'sign'));
  [R.outLight, R.backdrop].forEach((o) => group.set(o, 'door'));
  (R.propLights || []).forEach((l) => group.set(l, 'props'));
  if (R.tail) group.set(R.tail, 'car'); // the tail lights (Engine on); the hemisphere fill has no glTF light: 'fill' in the sidecar only
  const slotOf = new Map(); for (const it of R.items) it.obj.traverse((o) => slotOf.set(o, it));
  const lights = []; let n = 0;
  scene.updateMatrixWorld(true);
  // names (slots by id, lights by group), clean extras (userData holds live references), materials without maps
  scene.traverse((o) => {
    const it = slotOf.get(o);
    if (o.isLight) {
      const g = group.get(o) || (it ? 'props' : o.isHemisphereLight ? 'fill' : 'other');
      o.name = `L:${g}:${n++}`;
      const L = { name: o.name, group: g, slot: it?.id || null, type: o.type, color: o.color.toArray(), intensity: o.intensity, distance: o.distance ?? 0, decay: o.decay ?? 2, pos: o.getWorldPosition(new THREE.Vector3()).toArray() };
      if (o.isSpotLight) Object.assign(L, { angle: o.angle, penumbra: o.penumbra, target: o.target.getWorldPosition(new THREE.Vector3()).toArray() });
      if (o.isHemisphereLight) L.ground = o.groundColor.toArray();
      lights.push(L); o.userData = { group: g, ...(L.target ? { target: L.target } : {}) };
      return;
    }
    if (it && o === it.obj) o.name = it.id;
    else if (it && o.isMesh) o.name = `${it.id}:${o.id}`;
    else if (!o.name && o.isMesh) { const k = Object.entries(R).find(([, v]) => v === o); o.name = k ? k[0] : `mesh:${o.id}`; }
    o.userData = { ...(it ? { slot: it.id, kind: it.kind === 'side' || it.kind === 'end' ? (it.s.look || '') : it.kind } : {}), ...(group.has(o) ? { group: group.get(o) } : {}) };
    if (o.isMesh) {
      const strip = (m) => { const c = m.clone(); for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'envMap', 'specularIntensityMap', 'lightMap', 'bumpMap']) if (k in c) c[k] = null; c.userData = {}; return c; };
      o.material = Array.isArray(o.material) ? o.material.map(strip) : strip(o.material);
    }
  });
  const copy = scene.clone(true); copy.updateMatrixWorld(true);
  const broken = [];
  copy.traverse((o) => {
    if (o.isSprite || o.isPoints || o.isLineSegments || o.isLine || o.material === R.shaftMat || o.material === R.blobMat || o.material?.isShaderMaterial) o.visible = false;
    // a transform that isn't a number (a scale of NaN draws nothing in three.js) makes the file invalid for Blender
    else if (o.visible && !o.matrix.elements.every(Number.isFinite)) { o.visible = false; broken.push({ name: o.name, parent: o.parent?.name, scale: o.scale.toArray().map(String) }); }
    if (o.isSpotLight) { o.lookAt(new THREE.Vector3().fromArray(o.userData.target)); const t = new THREE.Object3D(); t.position.set(0, 0, -1); o.add(t); o.target = t; } // glTF lights point down -Z
  });
  copy.updateMatrixWorld(true);

  // markers: each exported slot's box from its real vertices (instances included), the 8 corners in three's order
  const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const markers = {}, v = new THREE.Vector3(), M = new THREE.Matrix4();
  for (const it of R.items) {
    const o = copy.getObjectByName(it.id); if (!o || !shown(o)) continue;
    const b = new THREE.Box3();
    o.traverse((m) => {
      if (!m.isMesh || !shown(m)) return;
      const pos = m.geometry.attributes.position, k = m.isInstancedMesh ? m.count : 1;
      for (let i = 0; i < k; i++) { if (m.isInstancedMesh) { m.getMatrixAt(i, M); M.premultiply(m.matrixWorld); } else M.copy(m.matrixWorld);
        for (let j = 0; j < pos.count; j++) b.expandByPoint(v.fromBufferAttribute(pos, j).applyMatrix4(M)); }
    });
    if (!b.isEmpty()) markers[it.id] = { min: b.min.toArray(), max: b.max.toArray() };
  }
  const px = {};
  for (const [key, sc] of Object.entries(screens)) px[key] = sc.stations.map((st) => {
    const c = new THREE.PerspectiveCamera(st.fov, st.aspect, st.near, st.far); c.position.fromArray(st.pos); c.quaternion.fromArray(st.quat); c.updateMatrixWorld();
    const out = {};
    for (const [id, b] of Object.entries(markers)) { const pts = [];
      for (const x of [b.min[0], b.max[0]]) for (const y of [b.min[1], b.max[1]]) for (const z of [b.min[2], b.max[2]]) { v.set(x, y, z).project(c); pts.push([(v.x + 1) / 2 * sc.w, (1 - v.y) / 2 * sc.h, v.z]); }
      out[id] = pts; }
    return out;
  });

  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  const glb = await new GLTFExporter().parseAsync(copy, { binary: true, onlyVisible: true });
  const bytes = new Uint8Array(glb); let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { markers, px, lights, broken, glb: btoa(s), room: { W: X.S.roomW, L: X.S.roomL, H: X.S.roomH, span: X.L.span } };
}, meta.screens);
await browser.close();
for (const [key, list] of Object.entries(r.px)) list.forEach((p, i) => { meta.screens[key].stations[i].px = p; });
Object.assign(meta, { markers: r.markers, lights: r.lights, room: r.room, broken: r.broken, errors: errs });
fs.writeFileSync(path.join(out, 'room.glb'), Buffer.from(r.glb, 'base64'));
fs.writeFileSync(path.join(out, 'room-meta.json'), JSON.stringify(meta));
const allErrs = [...errs, ...Object.values(meta.screens).flatMap((s) => s.errors)];
console.log(`${Object.keys(r.markers).length} slots, ${r.lights.length} lights, ${r.broken.length} left out (transform not a number)${r.broken.length ? ': ' + JSON.stringify(r.broken) : ''}; page errors: ${allErrs.length ? allErrs.join(' | ') : 'none'}`);
console.log(path.join(out, 'room.glb'), (fs.statSync(path.join(out, 'room.glb')).size / 1e6).toFixed(1) + ' MB');
