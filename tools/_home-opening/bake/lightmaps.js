// Baked light groups, mixed live (route B of the long garage; tech-recipe.md §1). Three.js 0.185.1.
//
// Each light group was baked ALONE in Cycles (Diffuse, Direct + Indirect, Color off, its emitters white) and packed as
// luminance into one channel of an 8-bit sRGB texture, three groups per texture (bake/pack.py). Here every baked
// material keeps three.js's lightMap path compiled (lightMap = pack 0, lightMapIntensity = 0) and onBeforeCompile adds,
// after <lights_fragment_maps>:
//     irradiance += pack0.r * uBakeG[0] + pack0.g * uBakeG[1] + pack0.b * uBakeG[2]  (+ pack1 into uBakeG[3..5])
// uBakeG is ONE uniform shared by every material: one setGroup() moves flicker, warm-up and Dan's dials room-wide.
//   uBakeG[i] = colour (linear) x intensity x the group's pack scale x BAKE_TO_IRRADIANCE
//
// Units: Cycles bakes "diffuse light" = the radiance a white Lambert surface sends out, E / pi. Three.js reads a
// lightmap as irradiance E and shades it with BRDF_Lambert = albedo / pi. So the texel goes in x pi
// (parity test 2026-11-08, scene-linear vs Cycles: walls 0.998-1.003 with x pi, 0.318 without).
// Live lights that must match their baked selves: three.js PointLight / SpotLight candela = Blender W / (4 pi)
// (= the glTF exporter's "Unitless" mode), decay 2, distance 0 (LIVE_PER_WATT).
// Metals: diffuseContribution = albedo x (1 - metalness), so baked light vanishes on full metals (they need the env map).
import * as THREE from 'three';

export const BAKE_TO_IRRADIANCE = Math.PI;
export const LIVE_PER_WATT = 1 / (4 * Math.PI);

const MAX_PACKS = 2; // 6 groups: neon L, neon R, lamps, TV, CRTs, door

export class BakedLight {
  constructor(manifest, textures) {
    this.manifest = manifest;
    this.textures = textures; // one THREE.Texture per pack, in manifest order
    this.groups = manifest.groups.map((g) => ({ ...g, slot: g.pack * 3 + g.channel }));
    if (manifest.packs.length > MAX_PACKS) throw new Error(`lightmaps.js: ${manifest.packs.length} packs, max ${MAX_PACKS}`);
    this.uniform = { value: Array.from({ length: MAX_PACKS * 3 }, () => new THREE.Vector3()) };
    this.materials = new Set();
    for (const g of this.groups) this.setGroup(g.name, g.color, 1);
  }

  // manifest + its pack textures, from a folder URL (the textures: sRGB, no flip, UV channel 1, mipmapped)
  static async load(baseUrl, { anisotropy = 4 } = {}) {
    const base = new URL(baseUrl, location.href);
    const manifest = await (await fetch(new URL('manifest.json', base))).json();
    const loader = new THREE.TextureLoader();
    const textures = await Promise.all(manifest.packs.map(async (p) => {
      const t = await loader.loadAsync(new URL(p.file, base).href);
      t.flipY = false; // glTF UVs (the exporter flips v; pack.py writes the image top row = v 1)
      t.colorSpace = THREE.SRGBColorSpace; // the GPU decodes to linear before filtering
      t.channel = 1; // uv1 = TEXCOORD_1 = Blender's UV2
      t.anisotropy = anisotropy;
      t.needsUpdate = true;
      return t;
    }));
    return new BakedLight(manifest, textures);
  }

  // which meshes are baked: the glTF extras (Blender custom property bake = "pack0") on the node or an ancestor,
  // else the manifest's target names
  isBaked(obj) {
    for (let o = obj; o; o = o.parent) {
      if (o.userData?.bake) return true;
      if (this.manifest.targets?.includes(o.name)) return true;
    }
    return false;
  }

  apply(root) {
    root.traverse((o) => {
      if (!o.isMesh || !this.isBaked(o)) return;
      if (!o.geometry.attributes.uv1) { console.warn('lightmaps.js: no uv1 on', o.name); return; }
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) this.setup(m);
    });
    return this.materials.size;
  }

  setup(m) {
    if (this.materials.has(m)) return m;
    const packs = this.textures.length;
    m.lightMap = this.textures[0];
    m.lightMapIntensity = 0; // the stock path adds nothing; the packed groups go in below
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      prev?.call(m, sh, r);
      sh.uniforms.uBakeG = this.uniform; // the same object for every material
      if (packs > 1) sh.uniforms.uBakeB = { value: this.textures[1] };
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\nuniform vec3 uBakeG[ ${MAX_PACKS * 3} ];${packs > 1 ? '\nuniform sampler2D uBakeB;' : ''}`)
        .replace('#include <lights_fragment_maps>', `#include <lights_fragment_maps>
	{
		vec3 bakeA = texture2D( lightMap, vLightMapUv ).rgb;
		irradiance += bakeA.r * uBakeG[ 0 ] + bakeA.g * uBakeG[ 1 ] + bakeA.b * uBakeG[ 2 ];${packs > 1 ? `
		vec3 bakeB = texture2D( uBakeB, vLightMapUv ).rgb;
		irradiance += bakeB.r * uBakeG[ 3 ] + bakeB.g * uBakeG[ 4 ] + bakeB.b * uBakeG[ 5 ];` : ''}
	}`);
    };
    const prevKey = m.customProgramCacheKey.bind(m);
    m.customProgramCacheKey = () => prevKey() + '|bake' + packs;
    m.needsUpdate = true;
    this.materials.add(m);
    return m;
  }

  group(i) { return typeof i === 'number' ? this.groups[i] : this.groups.find((g) => g.name === i); }

  // colour: THREE.Color or [r, g, b], LINEAR (Blender's light colour as is); intensity: 1 = the baked power
  setGroup(i, color, intensity = 1) {
    const g = this.group(i);
    if (!g) return;
    const k = intensity * g.scale * BAKE_TO_IRRADIANCE;
    const [r, gg, b] = color?.isColor ? [color.r, color.g, color.b] : color ?? g.color;
    this.uniform.value[g.slot].set(r * k, gg * k, b * k);
  }

  dispose() { for (const t of this.textures) t.dispose(); }
}

// =====================================================================================================================
// The room (phase 2): room.html's own meshes, lit by the baked groups (?light=baked). Shared by the exporter
// (room-scene.js, which bakes the same selection in Blender) and the run time, so both pick the same meshes by the
// same keys.
// =====================================================================================================================

const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
const matsOf = (o) => [o.material].flat().filter(Boolean);
const litKind = (m) => m.isMeshStandardMaterial || m.isMeshPhysicalMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial;

// R's named parts (one level into arrays and records), for keys that survive a change elsewhere in the room
function namesOf(R) {
  const n = new Map();
  for (const [k, v] of Object.entries(R)) {
    if (v?.isObject3D) { if (!n.has(v)) n.set(v, k); continue; }
    const list = Array.isArray(v) ? v.map((x, i) => [`${k}[${i}]`, x]) : v && typeof v === 'object' && !v.isMaterial && !v.isTexture ? Object.entries(v).map(([j, x]) => [`${k}.${j}`, x]) : [];
    for (const [kk, x] of list) {
      if (x?.isObject3D) { if (!n.has(x)) n.set(x, kk); }
      else if (x && typeof x === 'object' && !Array.isArray(x)) for (const [j, y] of Object.entries(x)) if (y?.isObject3D && !n.has(y)) n.set(y, `${kk}.${j}`);
    }
  }
  return n;
}
const pathFrom = (root, o) => { const p = []; for (let q = o; q && q !== root; q = q.parent) p.push(q.parent ? q.parent.children.indexOf(q) : -1); return p.reverse().join('/'); };

// every mesh the bake knows, with its role:
//   target   baked (gets uv1 and the packs): static, opaque, front-sided, physically lit
//   emitter  gives off its group's light in Blender (neon tubes, bulbs, inner shades, the sign's card, the night, lit props)
//   occluder solid in Blender but not baked (the car, the screens, the street, double-sided things): stays live here
export function roomParts(R, scene) {
  const names = namesOf(R);
  const live = new Set(), mark = (o) => o?.traverse?.((c) => live.add(c));
  [R.car, R.tail, R.tv?.face, R.tv?.line, R.tv?.halo, R.leds, ...(R.vus || [])].forEach(mark);
  for (const it of R.items) if (it.kind === 'monitor') { mark(it.obj.userData.screen); mark(it.obj.userData.lines); }
  const emit = new Map(); // mesh -> group
  for (const n of R.neon || []) emit.set(n.tube, n.side < 0 ? 'neonL' : 'neonR');
  for (const lp of R.lamps || []) { emit.set(lp.bulb, 'lamps'); for (const c of lp.shade.children) if (c.isMesh) emit.set(c, 'lamps'); }
  if (R.sign) emit.set(R.sign, 'sign');
  if (R.backdrop) emit.set(R.backdrop, 'door');
  const hosts = new Set();
  for (const l of R.propLights || []) {
    const h = l.parent; if (!h?.isMesh) continue; if (matsOf(h).some((x) => x.visible)) hosts.add(h);
    for (const m of [h, ...h.children]) if (m.isMesh && matsOf(m).some((x) => x.visible && x.emissive && x.emissiveIntensity > 0 && x.emissive.getHex())) { emit.set(m, 'props'); hosts.add(m); } // the light sits inside: see-through for its own group
  }
  const keyOf = new Map(), out = [];
  const key = (o) => {
    for (let p = o; p; p = p.parent) if (p.userData?.item) return `${p.userData.item.id}/${pathFrom(p, o)}`;
    if (names.has(o)) return 'R.' + names.get(o);
    for (let p = o.parent; p; p = p.parent) if (names.has(p)) return `R.${names.get(p)}/${pathFrom(p, o)}`;
    return 'scene/' + pathFrom(scene, o);
  };
  const inModel = (o) => { for (let p = o; p; p = p.parent) if (p.userData?.item) return !!p.userData.item.model; return false; };
  scene.traverse((o) => {
    if (!o.isMesh || !shown(o)) return;
    const ms = matsOf(o);
    if (!ms.length || !ms.some((m) => m.visible)) return;
    const solid = ms.every((m) => !m.transparent && m.blending === THREE.NormalBlending && !m.isShaderMaterial && m.visible);
    const group = emit.get(o);
    let role = null;
    if (live.has(o)) role = solid || o === R.tv?.face ? 'occluder' : null;
    else if (solid && ms.every(litKind) && (ms.every((m) => m.side === THREE.FrontSide) || inModel(o)) && o !== R.outGround && !(o.isInstancedMesh && !ms.every(litKind))) role = 'target';
    else if (solid) role = 'occluder';
    if (!role && !group) return;
    const k = key(o); keyOf.set(o, k);
    out.push({ mesh: o, key: k, role: role || 'emitter', group: group || null, host: hosts.has(o), shell: [R.left, ...(R.rightParts || []), R.ceil, R.end, R.near, R.floor].includes(o) });
  });
  return out;
}

// a mesh's triangles as their own vertices (no index; instances merged), in its own space: uv1 is per corner, so a
// chart's edge never shares a vertex with its neighbour's
export function flatGeometry(o) {
  const strip = (g) => { const c = g.index ? g.toNonIndexed() : g.clone(); for (const k of Object.keys(c.attributes)) if (!['position', 'normal', 'uv'].includes(k)) c.deleteAttribute(k); return c; };
  if (!o.isInstancedMesh) return strip(o.geometry);
  const base = strip(o.geometry), parts = [], M = new THREE.Matrix4();
  for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M); parts.push(base.clone().applyMatrix4(M)); }
  const n = parts.reduce((s, g) => s + g.attributes.position.count, 0), merged = new THREE.BufferGeometry();
  for (const k of Object.keys(base.attributes)) {
    const sz = base.attributes[k].itemSize, arr = new Float32Array(n * sz); let off = 0;
    for (const g of parts) { arr.set(g.attributes[k].array, off); off += g.attributes[k].array.length; }
    merged.setAttribute(k, new THREE.BufferAttribute(arr, sz));
  }
  return merged;
}
export const geoSignature = (g, o) => {
  g.computeBoundingBox(); const b = g.boundingBox, t = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
  return { count: g.attributes.position.count, min: b.min.toArray().map((x) => +x.toFixed(4)), max: b.max.toArray().map((x) => +x.toFixed(4)), at: t.toArray().map((x) => +x.toFixed(3)) };
};
const sameSig = (a, b) => a.count === b.count && [...a.min, ...a.max].every((x, i) => Math.abs(x - [...b.min, ...b.max][i]) < 2e-3) && a.at.every((x, i) => Math.abs(x - b.at[i]) < 1e-2);

// the live lights by group (the same groups the bake has)
export function liveLights(R) {
  const g = { neonL: [], neonR: [], lamps: [], tv: [R.tv.glow], sign: [R.signLight], door: [R.outLight], props: [...(R.propLights || [])], fill: [R.hemi], car: [R.tail] };
  for (const n of R.neon) g[n.side < 0 ? 'neonL' : 'neonR'].push(...n.lights);
  for (const lp of R.lamps) g.lamps.push(lp.light);
  return g;
}

// a light's dial source: a path into R ('lamps/0/light'), its intensity over the baked one = the group's dial
const at = (R, path) => path.split('/').reduce((o, k) => o?.[/^\d+$/.test(k) ? +k : k], R);

export class BakedRoom {
  // spec: true = the live lights keep their specular on baked surfaces (highlights, wet floor) and drop their diffuse
  // (the bake has it); false = baked surfaces take no scene light at all (the fast variant: no per-light cost there);
  // 'mix' = the fast variant everywhere but the floor, which keeps the live highlights (the lamps' pools in the wet)
  // ktx2: the packs as UASTC KTX2 (pack*.ktx2 next to the PNGs; ASTC / BC7 on the GPU: a quarter of the memory)
  static async attach({ R, scene, SHINY, base, spec = true, gleamK = 0.6, anisotropy = 8, ktx2 = false, renderer = null }) {
    const url = (f) => new URL(f, new URL(base, location.href)).href;
    const [layout, manifest, uvBuf] = await Promise.all([
      fetch(url('layout.json')).then((r) => r.json()), fetch(url('manifest.json')).then((r) => r.json()), fetch(url('uv1.bin')).then((r) => r.arrayBuffer())]);
    let loader = new THREE.TextureLoader();
    if (ktx2) {
      const { KTX2Loader } = await import('three/addons/loaders/KTX2Loader.js');
      loader = new KTX2Loader().setTranscoderPath(new URL('../vendor/three/examples/jsm/libs/basis/', import.meta.url).href).detectSupport(renderer);
    }
    const textures = await Promise.all(manifest.packs.map(async (p) => {
      const t = await loader.loadAsync(url(ktx2 ? p.file.replace(/\.png$/, '.ktx2') : p.file));
      Object.assign(t, { flipY: false, channel: 1, anisotropy }); if (!ktx2) t.colorSpace = THREE.SRGBColorSpace; // (a KTX2 says its own: sRGB)
      t.needsUpdate = true;
      return t;
    }));
    return new BakedRoom(R, scene, SHINY, layout, manifest, new Uint16Array(uvBuf), textures, spec, gleamK);
  }

  constructor(R, scene, SHINY, layout, manifest, uv, textures, spec, gleamK = 0.6) {
    Object.assign(this, { R, SHINY, layout, manifest, textures, spec, on: true });
    this.groups = manifest.groups.map((g) => ({ ...g, slot: g.pack * 3 + g.channel, src: layout.groups[g.name] }));
    this.uniform = { value: Array.from({ length: 9 }, () => new THREE.Vector3()) };
    // the fast path's gleam: each group's baked light seen as a uniform glow by the specular lobe (the split-sum's DFG),
    // for the lights only (A's hemisphere fill has no highlights) and scaled by gleamK (the bake holds the bounce too;
    // 0.6 = B mix's mean light within 5 % of A at walk 0.3 / 0.6 / 0.8 / 0.97, its median within 10 %)
    this.gleam = { value: Array.from({ length: 9 }, () => new THREE.Vector3()) }; this.gleamK = gleamK;
    this.clones = new Map(); this.swapped = []; // clones: material -> its baked twins { s: with the live highlights, f: without } this.soloGroup = null; this.live = liveLights(R);
    this.stats = { baked: 0, missing: [], changed: [] };
    const byKey = new Map(layout.meshes.map((m) => [m.key, m]));
    scene.updateMatrixWorld(true); // (at boot the matrices are those of the last render, not yet of the arranged room)
    for (const p of roomParts(R, scene)) {
      if (p.role !== 'target' && !(p.role === 'emitter' && byKey.get(p.key))) continue;
      const e = byKey.get(p.key);
      if (!e) { this.stats.missing.push(p.key); continue; } // not in this bake (a model added since): stays live
      const g = flatGeometry(p.mesh);
      if (!sameSig(geoSignature(g, p.mesh), e.sig)) { this.stats.changed.push(p.key); g.dispose(); continue; } // re-bake the slot
      const a = new Float32Array(e.count * 2);
      for (let i = 0; i < a.length; i++) a[i] = uv[e.offset * 2 + i] / 65535;
      g.setAttribute('uv1', new THREE.BufferAttribute(a, 2));
      let mesh = p.mesh;
      if (mesh.isInstancedMesh) { // instances become one mesh: each block has its own place in the lightmap
        const m = new THREE.Mesh(g, mesh.material); m.castShadow = mesh.castShadow; m.receiveShadow = mesh.receiveShadow;
        m.position.copy(mesh.position); m.quaternion.copy(mesh.quaternion); m.scale.copy(mesh.scale);
        mesh.parent.add(m); mesh.visible = false; mesh = m;
      } else mesh.geometry = g;
      const sw = { mesh, orig: mesh.material, spec: this.spec === 'mix' ? p.mesh === R.floor : !!this.spec };
      sw.mat = mesh.material = this.bakedOf(sw.orig, sw.spec);
      this.swapped.push(sw);
      this.stats.baked++;
    }
    this.update();
  }

  bakedOf(mat, spec, fresh) { return Array.isArray(mat) ? mat.map((m) => this.baked(m, spec, fresh)) : this.baked(mat, spec, fresh); }

  // one baked twin per material and path (a material can be shared with a live thing: the car's rubber and chrome; the
  // floor's with nothing, but its twin is its own either way); fresh: cloned again, the original's props as they are now
  baked(m, spec, fresh = false) {
    const k = spec ? 's' : 'f', twins = this.clones.get(m) ?? {}, SHINY = this.SHINY, G = this.R.modelGlow;
    this.clones.set(m, twins);
    if (twins[k] && !fresh) return twins[k];
    if (twins[k]) { SHINY?.delete(twins[k]); if (G) G.splice(0, G.length, ...G.filter((g) => g.m !== twins[k])); }
    const c = m.clone(), packs = this.textures.length;
    if (SHINY?.has(m)) SHINY.add(c);
    const glow = G?.find((g) => g.m === m); if (glow) G.push({ m: c, k: glow.k }); // a model's meters power on with the room (lightRoom)
    c.lightMap = this.textures[0]; c.lightMapIntensity = 0; c.aoMapIntensity = 0; // the bake carries the occlusion
    const maps = THREE.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );', ''); // the probe's diffuse would count the room twice
    // fast: the stock chunk with its light loops compiled out (three swaps NUM_* tokens textually after this hook, so
    // the counts are written in as 0 here, before it does); the gleam the lights gave rough surfaces comes back as the
    // baked light seen as a uniform glow (the split-sum's DFG on it: the walls' grazing sheen, not the lamps' hot spots)
    const begin = spec ? '#include <lights_fragment_begin>'
      : THREE.ShaderChunk.lights_fragment_begin.replace(/\bNUM_(POINT|SPOT|DIR|RECT_AREA|HEMI)_LIGHTS\b/g, '0');
    const sum = (u) => ['bA', 'bB', 'bC'].slice(0, packs).flatMap((x, i) => ['r', 'g', 'b'].map((ch, j) => `${x}.${ch} * ${u}[ ${i * 3 + j} ]`)).join(' + ');
    c.onBeforeCompile = (sh) => {
      sh.uniforms.uBakeG = this.uniform; sh.uniforms.uGleam = this.gleam;
      if (packs > 1) sh.uniforms.uBakeB = { value: this.textures[1] };
      if (packs > 2) sh.uniforms.uBakeC = { value: this.textures[2] };
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\nuniform vec3 uBakeG[ 9 ];\nuniform vec3 uGleam[ 9 ];${packs > 1 ? '\nuniform sampler2D uBakeB;' : ''}${packs > 2 ? '\nuniform sampler2D uBakeC;' : ''}`)
        .replace('#include <lights_fragment_begin>', `${begin}\n\tirradiance = vec3( 0.0 ); // no hemisphere, no ambient: the fill is baked`)
        .replace('#include <lights_fragment_maps>', `${maps}
	{
		vec3 bA = texture2D( lightMap, vLightMapUv ).rgb;${packs > 1 ? '\n\t\tvec3 bB = texture2D( uBakeB, vLightMapUv ).rgb;' : ''}${packs > 2 ? '\n\t\tvec3 bC = texture2D( uBakeC, vLightMapUv ).rgb;' : ''}
		irradiance += ${sum('uBakeG')};${spec ? '' : `
		#if defined( RE_IndirectSpecular )
			radiance += ( ${sum('uGleam')} ) * RECIPROCAL_PI; // fast: the lights' broad gleam, from the light they baked here
		#endif`}
	}`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>${spec ? '\n\treflectedLight.directDiffuse = vec3( 0.0 ); // live lights: their highlights only' : ''}`);
    };
    c.customProgramCacheKey = () => m.customProgramCacheKey() + `|room-bake${packs}${spec ? 's' : 'f'}`;
    c.needsUpdate = true;
    return (twins[k] = c);
  }

  setGroup(name, color, dial = 1) {
    const g = this.groups.find((x) => x.name === name); if (!g) return;
    const k = dial * g.scale * BAKE_TO_IRRADIANCE, [r, gg, b] = color ?? g.color;
    this.uniform.value[g.slot].set(r * k, gg * k, b * k);
    const kg = name === 'fill' ? 0 : k * this.gleamK; this.gleam.value[g.slot].set(r * kg, gg * kg, b * kg);
  }

  // checks: solo(g) = one group alone, live and baked alike (null: all); useBaked(false) = the live materials back
  solo(g) { this.soloGroup = g; }
  useBaked(on) { this.on = on; for (const e of this.swapped) e.mesh.material = on ? e.mat : e.orig; }

  // the dials follow the live lights lightRoom() just set (warm-up, flicker, the far end's dimming): one write a frame
  update() {
    // arrange() hands some meshes their live material again (the floor's, on every resize): baked again, as it is now
    if (this.on) for (const e of this.swapped) if (e.mesh.material !== e.mat) { e.orig = e.mesh.material; e.mat = e.mesh.material = this.bakedOf(e.orig, e.spec, true); }
    if (this.soloGroup) for (const [g, ls] of Object.entries(this.live)) if (g !== this.soloGroup) for (const l of ls) if (l) l.intensity = 0;
    for (const g of this.groups) {
      const l = g.src && at(this.R, g.src.ref);
      const dial = l ? (l.visible === false ? 0 : l.intensity / g.src.nominal) : 1;
      this.setGroup(g.name, null, dial);
    }
  }
}
