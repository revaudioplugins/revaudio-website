// GAS 2 page · the drone flight: what stands by the road (Dan 2026-10-26, "go 1": the hover shot should read as a real
// 1950s station from above). A lit GAS2 pole sign at the front of the lot and a telephone line that leaves the highway
// and runs back into the desert left of the station. Real 3D objects with their own materials (not painted by the
// photos): the drone passes them with true depth, and the hover photo (img/aerial-*.webp) is painted WITHOUT them, so
// nothing of theirs lies on the ground twice. None of it can reach the touchdown frame: the sign stands behind the
// landing camera (z > 8); the line runs at x = -20, outside its frame up close and hidden behind the house further out.
import { THREE } from './world.js';

const SIGN = { x: 5.6, z: 9.0, turn: -18, pole: 7.2, w: 3.3, h: 1.65, d: .36, y: 6.5 };   // turned toward the drone's side
const POLES = { x: -20, z0: 12, step: 30, n: 11, h: 8.6, arm: 8.05, sag: .5 };   // from the highway back to the horizon, never across the shop front

const VERT = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * w; }`;
// dusk light in display values (like the photos): sky from above, ground bounce from below, the afterglow low in the west
// (right and behind the station, where the sunset is in the page's frame), the sign's own light up close, distance haze
const DUSK = /* glsl */`
precision highp float;
uniform vec3 albedo; uniform vec3 lampP; uniform vec3 lampC; uniform float lampI;
varying vec3 vW; varying vec3 vN;
void main() {
  vec3 N = normalize(vN);
  vec3 c = albedo * (mix(vec3(0.16, 0.12, 0.09), vec3(0.32, 0.36, 0.52), N.y * 0.5 + 0.5)
                   + vec3(1.0, 0.55, 0.3) * 0.55 * pow(max(dot(N, normalize(vec3(0.75, 0.12, -0.65))), 0.0), 1.5));
  vec3 L = lampP + vec3(0.0, 6.5, 0.0) - vW;
  c += albedo * lampC * lampI * 3.0 * max(dot(N, normalize(L)), 0.0) / (1.0 + dot(L, L) * 0.08);
  gl_FragColor = vec4(mix(c, vec3(0.17, 0.12, 0.10), smoothstep(40.0, 900.0, distance(vW, cameraPosition))), 1.0);
}`;
const FACE = /* glsl */`
precision highp float;
uniform sampler2D map; uniform float lit;
varying vec2 vUv;
void main() { vec3 t = texture2D(map, vUv).rgb; gl_FragColor = vec4(t * (0.22 + 0.95 * lit), 1.0); }`;

// the sign face = the readings' own lockup (Oswald 700, GAS in ink, the 2 in oxide, the oxide rule) on cream enamel
async function drawFace() {
  try { await document.fonts.load('700 200px Oswald'); } catch {}
  const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const bg = g.createRadialGradient(W / 2, H * .45, 40, W / 2, H / 2, W * .62);
  bg.addColorStop(0, '#fff6e0'); bg.addColorStop(1, '#e2d2a8');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.lineWidth = 34; g.strokeStyle = '#b8341e'; g.strokeRect(17, 17, W - 34, H - 34);       // the oxide band
  g.lineWidth = 5; g.strokeStyle = '#3a1a10'; g.strokeRect(46, 46, W - 92, H - 92);
  g.textBaseline = 'alphabetic'; g.font = '700 300px Oswald, "Arial Narrow", sans-serif';
  const gw = g.measureText('GAS').width, tw = g.measureText('2').width, x0 = (W - gw - tw) / 2, base = H * .7;
  g.fillStyle = '#241a12'; g.fillText('GAS', x0, base);
  g.fillStyle = '#b8341e'; g.fillText('2', x0 + gw, base);
  g.fillRect(x0 + 6, base + 26, gw + tw - 12, 26);                                          // the rule under it
  const img = g.getImageData(0, 0, W, H), d = img.data;                                     // enamel wear: speckle + darker edges
  for (let i = 0; i < d.length; i += 4) {
    const p = i / 4, x = p % W, y = (p / W) | 0, e = Math.min(x, W - x, y, H - y) / 90;
    const k = (0.94 + Math.random() * .08) * (0.82 + 0.18 * Math.min(1, e));
    d[i] *= k; d[i + 1] *= k; d[i + 2] *= k;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; return t;
}
function haloTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,232,190,.9)'); r.addColorStop(.35, 'rgba(255,200,140,.35)'); r.addColorStop(1, 'rgba(255,170,110,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}
// several geometries as one mesh (non-indexed, positions + normals + uvs)
function merge(geos) {
  const pos = [], nor = [], uv = [];
  for (const g0 of geos) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); uv.push(...(g.attributes.uv ? g.attributes.uv.array : new Float32Array(g.attributes.position.count * 2)));
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  m.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return m;
}

export async function makeRoadside(world) {
  const U = world.uniforms;
  const dusk = albedo => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: DUSK, toneMapped: false,
    uniforms: { albedo: { value: new THREE.Vector3(...albedo) }, lampP: U.lampP, lampC: U.lampC, lampI: U.lampI } });
  const group = new THREE.Group();

  // the pole sign
  const sign = new THREE.Group(); sign.position.set(SIGN.x, 0, SIGN.z); sign.rotation.y = SIGN.turn * Math.PI / 180;
  const pole = new THREE.BoxGeometry(.22, SIGN.pole, .22).translate(0, SIGN.pole / 2, 0);
  const box = new THREE.BoxGeometry(SIGN.w, SIGN.h, SIGN.d).translate(0, SIGN.y, 0);
  sign.add(new THREE.Mesh(merge([pole, box]), dusk([.13, .11, .1])));
  const face = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FACE, toneMapped: false, uniforms: { map: { value: await drawFace() }, lit: { value: 1 } } });
  for (const side of [1, -1]) {                          // double-sided: the drone sees the front, the highway both
    const f = new THREE.Mesh(new THREE.PlaneGeometry(SIGN.w - .1, SIGN.h - .1), face);
    f.position.set(0, SIGN.y, side * (SIGN.d / 2 + .004)); if (side < 0) f.rotation.y = Math.PI; sign.add(f);
  }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
  halo.scale.set(7.4, 4.2, 1); halo.position.set(0, SIGN.y, .35); sign.add(halo);
  group.add(sign);
  sign.updateMatrixWorld(true);
  const base = new THREE.Vector3(0, 0, .9).applyMatrix4(sign.matrixWorld);   // its light pools in front of the pole
  U.lampP.value.set(base.x, 0, base.z); U.lampR.value = 4.6;

  // the telephone line: poles, crossarms (across the line), three sagging wires per span
  const parts = [], wires = [], P = POLES;
  const zs = Array.from({ length: P.n }, (_, i) => P.z0 - i * P.step);
  for (const z of zs) {
    parts.push(new THREE.CylinderGeometry(.12, .15, P.h, 8).translate(P.x, P.h / 2, z));
    parts.push(new THREE.BoxGeometry(2.3, .12, .12).translate(P.x, P.arm, z));
  }
  const ends = [[P.arm + .08, -.95], [P.arm + .08, .95], [P.h + .02, 0]];
  for (let i = 0; i < zs.length - 1; i++) for (const [y, dx] of ends) {
    const a = new THREE.Vector3(P.x + dx, y, zs[i]), b = new THREE.Vector3(P.x + dx, y, zs[i + 1]);
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, k) => { const t = k / 8; return a.clone().lerp(b, t).add(new THREE.Vector3(0, -P.sag * 4 * t * (1 - t), 0)); }));
    wires.push(new THREE.TubeGeometry(curve, 20, .012, 4, false));
  }
  group.add(new THREE.Mesh(merge(parts), dusk([.2, .15, .11])), new THREE.Mesh(merge(wires), dusk([.08, .07, .065])));
  world.scene.add(group);

  // the neon starts the way page-b's NEON look does (a few stutters, then on), and buzzes once in a while
  const level = t => {
    if (t < .6) return 0;
    const k = (t - .6) / 1.5;
    if (k < 1) return [[.06, .12], [.1, 1], [.18, .15], [.22, 1], [.34, .25], [2, 1]].find(([e]) => k < e)[1];
    const b = (t - 2.1) % 7.3; return (b > 7.0 && b < 7.06) || (b > 7.12 && b < 7.17) ? .35 : 1;
  };
  return {
    group,
    update(t) { const L = level(t); face.uniforms.lit.value = L; halo.material.opacity = .7 * L; U.lampI.value = .55 * L; },
  };
}
