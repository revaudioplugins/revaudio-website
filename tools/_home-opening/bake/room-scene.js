// The room for the bake, taken from room.html's live scene (run in the page by room-export.mjs, ?capture=0&expose).
// It writes what Blender needs and what the run time needs, from one selection (lightmaps.js roomParts):
//   room-bake.glb   every target / occluder / emitter, flattened to world space, uv = its lightmap UV (targets);
//                   extras: key, role, group, emission (white, luminance-matched to its group's colour), albedo per
//                   material (its colour x its colour map's mean, linear), metal, roughness
//   bake-scene.json the lights in Blender units (W = cd x 4 pi; spot size + blend matched to three's smoothstep; the
//                   cutoff windows), the fill (the hemisphere as a two-tone world), the groups (dial source, nominal level)
//   layout.json + uv1.bin  per baked mesh: its key, signature, vertex count and uv1 (uint16), the slot rectangles
// Unit dial = today's live level at walk 0, full warm-up, no flicker or hum (room.html lightRoom()).
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { roomParts, flatGeometry, geoSignature } from './lightmaps.js';
import { packRoom } from './uv2.js';

const LUMA = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const norm = (c) => { const l = LUMA(c) || 1; return c.map((x) => x / l); };

const means = new Map();
function meanColor(tex) { // a colour map's mean, linear (sRGB maps decoded per texel before averaging)
  const img = tex?.image; if (!img || !(img.width || img.videoWidth)) return [1, 1, 1];
  if (means.has(img)) return means.get(img);
  let out = [1, 1, 1];
  try {
    const n = 256, c = new OffscreenCanvas(n, n), g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, n, n);
    const d = g.getImageData(0, 0, n, n).data, srgb = tex.colorSpace === THREE.SRGBColorSpace, acc = [0, 0, 0];
    const dec = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) acc[k] += srgb ? dec(d[i + k] / 255) : d[i + k] / 255;
    out = acc.map((x) => x / (n * n));
  } catch (e) { console.warn('mean', e.message); }
  means.set(img, out);
  return out;
}
const albedo = (m) => { const c = m.color ? m.color.toArray() : [1, 1, 1], t = meanColor(m.map); return c.map((x, i) => x * t[i]); };

export async function exportRoom({ prev = null, prevUv = null, only = null, size = 2048, pad = 2 } = {}) {
  const X = window.__room, R = X.R, S = X.S, scene = R.floor.parent;
  const frame = () => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
  X.go(0); await frame(); scene.updateMatrixWorld(true);
  const parts = roomParts(R, scene);

  // emitters at their nominal (unit-dial) radiance, white, luminance-matched to their group's colour
  const groupColor = {
    neonL: R.neon.find((n) => n.side < 0).lights[0].color.toArray(), neonR: R.neon.find((n) => n.side > 0).lights[0].color.toArray(),
    lamps: R.lamps[0].light.color.toArray(), tv: R.tv.glow.color.toArray(), sign: R.signLight.color.toArray(),
    door: R.outLight.color.toArray(), car: R.tail.color.toArray(), fill: R.hemi.color.toArray(),
  };
  const propC = (R.propLights || []).map((l) => l.color.toArray());
  groupColor.props = propC.reduce((s, c) => s.map((x, i) => x + norm(c)[i] / propC.length), [0, 0, 0]);
  const emitOf = (p) => {
    const m = [p.mesh.material].flat()[0];
    let rad;
    if (R.neon.some((n) => n.tube === p.mesh)) rad = m.userData.base.toArray().map((x) => x * 7 * S.neon);
    else if (R.lamps.some((lp) => lp.bulb === p.mesh)) rad = m.userData.base.toArray().map((x) => x * (0.3 + 3.2 * S.lamps));
    else if (p.mesh === R.sign) rad = meanColor(m.map).map((x) => x * (0.08 + 1.4));
    else if (p.mesh === R.backdrop) rad = m.color.toArray().map((x, i) => x * meanColor(m.map)[i]);
    else rad = m.emissive.toArray().map((x) => x * m.emissiveIntensity); // inner shades, lit props
    return LUMA(rad); // white, so the group's colour (luminance 1) brings back its hue
  };

  // geometry + materials for Blender; lightmap UVs for the targets
  const targets = parts.filter((p) => p.role === 'target');
  const flat = new Map(parts.map((p) => [p, flatGeometry(p.mesh)]));
  const world = new Map(parts.map((p) => [p, flat.get(p).clone().applyMatrix4(p.mesh.matrixWorld)]));
  const weight = (p) => (p.key === 'R.ceil' || p.key === 'R.near' ? 0.5 : 1);
  const slotOf = (p) => (/^(R\.|scene\/)/.test(p.key) ? null : p.key.split('/')[0]);
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  const own = (p) => { p.mesh.matrixWorld.decompose(_p, _q, _s); return flat.get(p).clone().scale(Math.abs(_s.x), Math.abs(_s.y), Math.abs(_s.z)).attributes.position.array; };
  const items = targets.map((p) => ({ key: p.key, slot: slotOf(p), weight: weight(p), pos: own(p) }));
  let packed;
  if (prev && only) {
    const keep = items.filter((m) => !only.includes(m.slot)), redo = items.filter((m) => only.includes(m.slot));
    packed = packRoom(redo, { size, pad, prev, only });
    const old = new Map(prev.meshes.map((e) => [e.key, e]));
    for (const m of keep) { const e = old.get(m.key); if (e) packed.uv.set(m.key, Float32Array.from(prevUv.subarray(e.offset * 2, (e.offset + e.count) * 2), (x) => x / 65535)); }
  } else packed = packRoom(items, { size, pad });

  const mats = new Map(), expMat = (m, own) => {
    if (!own && mats.has(m)) return mats.get(m);
    const e = new THREE.MeshStandardMaterial({ color: new THREE.Color().fromArray(albedo(m)), metalness: m.metalness ?? 0, roughness: m.roughness ?? 1, name: m.name || m.type });
    e.userData = { albedo: albedo(m), metal: m.metalness ?? 0, rough: m.roughness ?? 1 };
    if (!own) mats.set(m, e);
    return e;
  };
  const out = new THREE.Scene(), layoutMeshes = [], uvChunks = []; let offset = 0;
  for (const p of parts) {
    const g = world.get(p);
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    const uv = packed.uv.get(p.key);
    if (p.role === 'target') {
      if (!uv) { console.warn('no uv', p.key); continue; }
      const q = Uint16Array.from(uv, (x) => Math.round(Math.min(1, Math.max(0, x)) * 65535)); // what the run time reads
      g.setAttribute('uv', new THREE.BufferAttribute(Float32Array.from(q, (x) => x / 65535), 2)); // Blender bakes the same UVs (a slot re-bake's kept meshes come back from uv1.bin: their texels stay put)
      const sig = geoSignature(flat.get(p), p.mesh);
      layoutMeshes.push({ key: p.key, slot: slotOf(p), offset, count: sig.count, sig });
      uvChunks.push(q); offset += sig.count;
    }
    const ms = [p.mesh.material].flat().map((m) => expMat(m, !!p.group));
    const mesh = new THREE.Mesh(g, ms.length > 1 ? ms : ms[0]);
    mesh.name = p.key;
    mesh.userData = { key: p.key, role: p.role, group: p.group || '', emit: p.group ? emitOf(p) : 0, transparent: p.role === 'emitter' ? 1 : 0,
      host: p.host ? 1 : 0, shell: p.shell ? 1 : 0, slot: slotOf(p) || '' };
    out.add(mesh);
  }

  // the lights, in three's units; bake_room.py makes them Blender's
  const lights = [], v = new THREE.Vector3();
  const add = (l, group, nominal, extra = {}) => {
    const L = { group, type: l.isSpotLight ? 'SPOT' : 'POINT', pos: l.getWorldPosition(v).toArray(), color: l.color.toArray(), cd: nominal, cutoff: l.distance || 0, decay: l.decay, ...extra };
    if (l.isSpotLight) Object.assign(L, { angle: l.angle, penumbra: l.penumbra, target: l.target.getWorldPosition(new THREE.Vector3()).toArray() });
    lights.push(L);
  };
  for (const n of R.neon) for (const l of n.lights) add(l, n.side < 0 ? 'neonL' : 'neonR', 30 * S.neon, { radius: 0.5 }); // stand-ins for a tube: soft
  for (const lp of R.lamps) add(lp.light, 'lamps', 130 * S.lamps * lp.k, { radius: 0.05 });                          // a bulb in its shade
  add(R.tv.glow, 'tv', 3 * S.tvGlow); add(R.signLight, 'sign', 6); add(R.outLight, 'door', R.outLight.intensity);
  for (const l of R.propLights || []) add(l, 'props', l.userData.cd);
  add(R.tail, 'car', 4);
  const propRef = (R.propLights || []).findIndex((l) => { for (let q = l; q; q = q.parent) if (q.userData?.item) return q.userData.item.id !== 'N02'; return true; }); // not the dying tube
  const ref = {
    neonL: [`neon/${R.neon.findIndex((n) => n.side < 0)}/lights/0`, 30 * S.neon], neonR: [`neon/${R.neon.findIndex((n) => n.side > 0)}/lights/0`, 30 * S.neon],
    lamps: ['lamps/0/light', 130 * S.lamps * R.lamps[0].k], tv: ['tv/glow', 3 * S.tvGlow], sign: ['signLight', 6], door: ['outLight', R.outLight.intensity],
    props: [`propLights/${propRef}`, R.propLights[propRef].userData.cd], fill: ['hemi', R.hemi.intensity], car: ['tail', 4],
  };
  const groups = Object.fromEntries(Object.entries(ref).map(([g, [r, nominal]]) => [g, { ref: r, nominal, color: norm(groupColor[g]), lum: LUMA(groupColor[g]) }]));
  const fill = { sky: R.hemi.color.toArray(), ground: R.hemi.groundColor.toArray(), intensity: R.hemi.intensity };

  const glb = await new GLTFExporter().parseAsync(out, { binary: true });
  const bytes = new Uint8Array(glb); let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const uvAll = new Uint16Array(offset * 2); let o = 0; for (const c of uvChunks) { uvAll.set(c, o); o += c.length; }
  const ub = new Uint8Array(uvAll.buffer); let us = ''; for (let i = 0; i < ub.length; i += 0x8000) us += String.fromCharCode(...ub.subarray(i, i + 0x8000));
  const area = targets.reduce((sum, p) => { const a = world.get(p).attributes.position.array; let t = 0; for (let i = 0; i < a.length; i += 9) { const ax = a[i + 3] - a[i], ay = a[i + 4] - a[i + 1], az = a[i + 5] - a[i + 2], bx = a[i + 6] - a[i], by = a[i + 7] - a[i + 1], bz = a[i + 8] - a[i + 2]; t += Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx) / 2; } return sum + t; }, 0);
  return {
    glb: btoa(s), uv1: btoa(us),
    layout: { size, pad, density: packed.density, slots: packed.slots, meshes: layoutMeshes, groups, query: location.search, area_m2: +area.toFixed(1) },
    scene: { lights, fill, groups, size, counts: { targets: targets.length, occluders: parts.filter((p) => p.role === 'occluder').length, emitters: parts.filter((p) => p.group).length } },
  };
}
