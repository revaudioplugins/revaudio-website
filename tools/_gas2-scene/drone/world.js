// GAS 2 page · drone intro v2 (revaudio-59, 2026-10-28): the station as a 3D set in metres. x = east (the page's
// right), y = up, z = south (behind the landing camera). The landing camera is the page's own: f = 1500 px on the
// 1536 x 1024 frame, eye 1.33 m, the shop wall 6.6 m ahead.
// The art (2026-10-28, gpt-image-2, drone/tools/: ortho guide -> gen-edit.sh -> post-art.py): img/aerial.webp = the set
// from straight above (ground, sidewalk and roof tops, AER), img/near.webp = the ground round the landing spot close up
// (RN, loads after the hover shows), img/car.webp = the car from above. The walls stay blockout boxes: the TOP
// flight never sees them (the page frame takes over first); the sidewalk props are left out (the page frame has them).
// Exact: img/land.webp (page-b's own scene, drone/tools/render-landing.cjs) on a quad that fills the landing camera's
// view, so any frame from the landing spot IS the page.
import * as THREE from './vendor/three.module.min.js';
export { THREE };

THREE.ColorManagement.enabled = false;   // colours and textures straight through, like the page's own pixels

export const EYE = 1.33, WALL = 6.6, FPX = 1500;
export const VFOV = 2 * Math.atan(512 / FPX) * 180 / Math.PI;
export const LAND_POS = new THREE.Vector3(0, EYE, 0);

const FIELD = '#5b4a36';
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// ---- the ground, drawn once in world metres (the caller's transform maps metres to canvas pixels)
function groundBits() {
  const R = rng(7), tufts = [], cracks = [];
  for (let i = 0; i < 9000; i++) {
    const x = -80 + 160 * R(), z = -80 + 160 * R();
    if (z > -4.9 && z < 6.3) continue;                                  // road + shoulder
    if (x > -12.6 && x < 3.1 && z > -15.6 && z < -4.7) continue;        // station + sidewalk
    tufts.push([x, z, .22 + .6 * R() * R() + .15 * R(), R()]);
  }
  const addCracks = (n, x0, x1, z0, z1, l0, l1) => {
    for (let i = 0; i < n; i++) {
      let x = x0 + (x1 - x0) * R(), z = z0 + (z1 - z0) * R(), a = R() * 6.283; const pts = [[x, z]];
      for (let j = 0, m = 4 + (R() * 8 | 0); j < m; j++) { a += (R() - .5) * 1.4; const L = l0 + (l1 - l0) * R(); x += Math.cos(a) * L; z += Math.sin(a) * L; pts.push([x, z]); }
      cracks.push(pts);
    }
  };
  addCracks(220, -80, 80, -4.7, 5.9, .25, .9);
  addCracks(90, -6, 6, -4.7, 2.4, .06, .3);                              // finer, denser at the landing spot
  const holes = [[-12, 2.2, 1.1, .7], [9, -1.5, .8, .55], [2.6, 3.9, .6, .4], [-3.1, -2.6, .5, .35], [1.3, -.4, .3, .2], [-24, -2, 1.4, .8], [31, 3, 1, .6]];
  return { tufts, cracks, holes };
}
const BITS = groundBits();

function drawGround(g, vb, fine) {
  g.fillStyle = FIELD; g.fillRect(vb.x0, vb.z0, vb.x1 - vb.x0, vb.z1 - vb.z0);
  const R = rng(11);
  for (let i = 0; i < (fine ? 900 : 2600); i++) {                       // dirt mottling
    const x = vb.x0 + (vb.x1 - vb.x0) * R(), z = vb.z0 + (vb.z1 - vb.z0) * R(), r = (fine ? .3 : 1.5) + R() * (fine ? .8 : 4);
    g.fillStyle = R() < .5 ? 'rgba(120,96,66,.10)' : 'rgba(40,30,20,.10)'; g.beginPath(); g.ellipse(x, z, r, r * .7, R() * 3, 0, 6.283); g.fill();
  }
  for (const [x, z, r, s] of BITS.tufts) {
    if (x < vb.x0 - 1 || x > vb.x1 + 1 || z < vb.z0 - 1 || z > vb.z1 + 1) continue;
    g.fillStyle = 'rgba(12,8,4,.32)'; g.beginPath(); g.ellipse(x - r * .45, z + r * .1, r, r * .75, 0, 0, 6.283); g.fill();
    g.fillStyle = s < .5 ? '#4b4430' : s < .8 ? '#6b5d3b' : '#7d6c47'; g.beginPath(); g.ellipse(x, z, r, r * .85, 0, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(230,190,120,.10)'; g.beginPath(); g.ellipse(x + r * .25, z - r * .2, r * .45, r * .35, 0, 0, 6.283); g.fill();
  }
  const W = vb.x1 - vb.x0;
  g.fillStyle = '#6a5640'; g.fillRect(vb.x0, 5.9, W, 1.4);             // the dirt shoulder
  g.fillStyle = '#4a4540'; g.fillRect(vb.x0, -4.8, W, 10.7);           // the road
  g.fillStyle = 'rgba(150,138,120,.35)'; g.fillRect(vb.x0, -4.8, W, 4.3);   // the lane by the shop, sun-bleached
  g.fillStyle = 'rgba(255,255,255,.035)'; for (const z of [-3.6, -1.4, 2.0, 4.3]) g.fillRect(vb.x0, z, W, .8);
  g.fillStyle = 'rgba(210,166,72,.5)'; for (let x = Math.floor(vb.x0 / 6) * 6; x < vb.x1; x += 6) g.fillRect(x, .72, 3, .13);
  for (const [x, z, rx, rz] of BITS.holes) { g.fillStyle = 'rgba(18,15,12,.62)'; g.beginPath(); g.ellipse(x, z, rx, rz, .3, 0, 6.283); g.fill(); }
  g.strokeStyle = 'rgba(20,17,14,.62)'; g.lineWidth = fine ? .016 : .05; g.lineCap = g.lineJoin = 'round';
  for (const pts of BITS.cracks) { if (pts[0][0] < vb.x0 - 5 || pts[0][0] > vb.x1 + 5 || pts[0][1] < vb.z0 - 5 || pts[0][1] > vb.z1 + 5) continue; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.stroke(); }
  g.fillStyle = '#8a8174'; g.fillRect(-12, -6.6, 15, 1.8);              // the sidewalk (its own box is drawn on top; this is under it)
  for (const lx of [-1.25, 1.25]) {                                      // the two lamps' light on the ground
    const gr = g.createRadialGradient(lx, -5.4, 0, lx, -5.4, 3.6); gr.addColorStop(0, 'rgba(255,186,105,.40)'); gr.addColorStop(1, 'rgba(255,186,105,0)');
    g.fillStyle = gr; g.fillRect(lx - 3.7, -9, 7.4, 7.4);
  }
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.needsUpdate = true;
  return t;
}
function groundTex(r, px) {   // r = {x0, z0, w, h} in metres
  return canvasTex(Math.round(r.w * px), Math.round(r.h * px), g => { g.setTransform(px, 0, 0, px, -r.x0 * px, -r.z0 * px); drawGround(g, { x0: r.x0, z0: r.z0, x1: r.x0 + r.w, z1: r.z0 + r.h }, px > 60); });
}

// ---- one material for the whole set: a base (colour, its own texture, or a top-down ground texture by world x/z),
// then the landing frame projected from the landing camera, faded in by uA near touchdown
const VS = `varying vec3 vW; varying vec3 vN; varying vec2 vUv;
void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vUv = uv; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FS = `uniform sampler2D map, mapM, mapN, mapA; uniform vec3 color, eyeA, fogCol; uniform vec4 rect, rectM, rectN; uniform mat4 projA;
uniform float mode, hasMid, hasNear, uA, ground, fogNear, fogFar;
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
void main() {
  vec3 c = color;
  if (mode > .5) {
    vec2 uv = mode > 1.5 ? vec2((vW.x - rect.x) / rect.z, 1. - (vW.z - rect.y) / rect.w) : vUv;
    c = (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) ? color : texture2D(map, uv).rgb;
    if (hasMid > .5) {
      vec2 um = vec2((vW.x - rectM.x) / rectM.z, 1. - (vW.z - rectM.y) / rectM.w);
      float e = min(min(um.x, 1. - um.x), min(um.y, 1. - um.y));
      if (e > 0.) c = mix(c, texture2D(mapM, um).rgb, smoothstep(0., .02, e));
    }
    if (hasNear > .5) {
      vec2 un = vec2((vW.x - rectN.x) / rectN.z, 1. - (vW.z - rectN.y) / rectN.w);
      float e = min(min(un.x, 1. - un.x), min(un.y, 1. - un.y));
      if (e > 0.) c = mix(c, texture2D(mapN, un).rgb, smoothstep(0., .05, e));
    }
  }
  if (uA > 0.) {
    vec4 p = projA * vec4(vW, 1.); vec2 a = p.xy / p.w * .5 + .5;
    float vis = step(0., p.w) * step(0., a.x) * step(a.x, 1.) * step(0., a.y) * step(a.y, 1.) * step(.02, dot(vN, normalize(eyeA - vW)));
    if (ground > .5 && vW.z < -6.6 && vW.x * 6.6 / -vW.z < .85) vis = 0.;    // ground the shop hides from the landing camera
    c = mix(c, texture2D(mapA, a).rgb, uA * vis);
  }
  c = mix(c, fogCol, smoothstep(fogNear, fogFar, distance(cameraPosition, vW)));
  gl_FragColor = vec4(c, 1.);
}`;

export async function buildWorld() {
  const scene = new THREE.Scene();
  const land = await new THREE.TextureLoader().loadAsync(new URL('img/land.webp', import.meta.url).href);
  land.minFilter = THREE.LinearMipmapLinearFilter; land.anisotropy = 8;   // drawn at ~0.5x on a 1x screen: mipmaps keep it clean
  try { await Promise.all([document.fonts.load('700 120px Oswald'), document.fonts.load('400 120px Bebas')]); } catch (e) { /* fallbacks */ }

  // the landing camera, as a projector
  const camA = new THREE.PerspectiveCamera(VFOV, 1.5, .05, 2000);
  camA.position.copy(LAND_POS); camA.updateMatrixWorld(); camA.updateProjectionMatrix();
  const projA = new THREE.Matrix4().multiplyMatrices(camA.projectionMatrix, camA.matrixWorldInverse);

  const shared = { mapA: { value: land }, projA: { value: projA }, eyeA: { value: LAND_POS.clone() }, uA: { value: 0 },
    fogCol: { value: new THREE.Color('#4a3d36') }, fogNear: { value: 70 }, fogFar: { value: 260 } };
  const mats = [];
  const mat = (o = {}) => {
    const m = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: { ...shared,
      map: { value: o.map || null }, mapM: { value: o.mapM || null }, mapN: { value: o.mapN || null }, color: { value: new THREE.Color(o.color || FIELD) },
      rect: { value: new THREE.Vector4(...(o.rect || [0, 0, 1, 1])) }, rectM: { value: new THREE.Vector4(...(o.rectM || [0, 0, 1, 1])) },
      rectN: { value: new THREE.Vector4(...(o.rectN || [0, 0, 1, 1])) },
      mode: { value: o.rect ? 2 : o.map ? 1 : 0 }, hasMid: { value: o.mapM ? 1 : 0 }, hasNear: { value: o.mapN ? 1 : 0 }, ground: { value: o.ground ? 1 : 0 } } });
    mats.push(m); return m;
  };

  // ground: a far blockout texture (160 m, ~5 cm a pixel; only the angled hovers see past the aerial), the aerial
  // (39 x 26 m round the hover, ~1.5 cm a pixel) and the close-up round the landing spot (12 x 8 m, ~5 mm a pixel)
  const RF = [-80, -80, 160, 160], AER = [-23.5, -19, 39, 26], RN = [-6, -6.6, 12, 8];   // AER + RN: as drone/tools/post-art.py
  const gFar = groundTex({ x0: RF[0], z0: RF[1], w: RF[2], h: RF[3] }, 19.2);
  const art = name => { const t = new THREE.TextureLoader().loadAsync(new URL(`img/${name}.webp`, import.meta.url).href); return t.then(x => { x.anisotropy = 8; return x; }); };
  const [aerial, carTex] = await Promise.all([art('aerial'), art('car')]);
  const groundMat = mat({ map: gFar, rect: RF, mapM: aerial, rectM: AER, rectN: RN, ground: true });
  art('near').then(t => { groundMat.uniforms.mapN.value = t; groundMat.uniforms.hasNear.value = 1; }).catch(() => { /* the aerial carries it */ });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), groundMat);
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  const box = (x0, x1, y0, y1, z0, z1, m) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m);
    b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); scene.add(b); return b;
  };
  // BoxGeometry material order: +x, -x, +y, -y, +z, -z

  // the shop: front wall (blockout: stucco, three lit windows, the sign band, a door), a flat roof with an overhang
  const wallTex = canvasTex(1286, 360, g => {
    g.fillStyle = '#8f8678'; g.fillRect(0, 0, 1286, 360);
    const R = rng(3); for (let i = 0; i < 1400; i++) { g.fillStyle = R() < .5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)'; g.fillRect(R() * 1286, R() * 360, 2 + R() * 9, 1 + R() * 4); }
    g.fillStyle = '#c98a3c'; g.fillRect(900, 100, 300, 140);              // windows (x -3.0 .. 0.05 m, from the right end)
    g.strokeStyle = '#2b2118'; g.lineWidth = 8; g.strokeRect(900, 100, 300, 140); g.beginPath(); g.moveTo(1000, 100); g.lineTo(1000, 240); g.moveTo(1100, 100); g.lineTo(1100, 240); g.stroke();
    g.fillStyle = '#d8cdb5'; g.fillRect(820, 46, 440, 36);               // sign band
    g.fillStyle = '#9b3b26'; g.font = '400 30px Bebas, Oswald, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('REGULAR · PREMIUM · RACE', 1040, 66);
    g.fillStyle = '#5a4634'; g.fillRect(720, 120, 70, 240);              // a side door
  });
  const stucco = mat({ color: '#7f7668' }), dark = mat({ color: '#2f2a25' });
  box(-12, .85, 0, 3.6, -15.5, -6.6, [stucco, stucco, dark, dark, mat({ map: wallTex }), stucco]);
  const fascia = mat({ color: '#3a3530' });   // the roof top = the aerial (its painted GAS2, vents and parapet)
  box(-12.5, 2.6, 3.6, 4.1, -15.5, -5.5, [fascia, fascia, mat({ map: aerial, rect: AER }), mat({ color: '#2a2622' }), fascia, fascia]);
  const curb = mat({ color: '#9b9183' });
  box(-12, 3.0, 0, .18, -6.6, -4.8, [curb, curb, groundMat, curb, curb, curb]);
  // nothing stands on the sidewalk: the blockout props (pump, radio, bin, chalkboard) read as flat boxes from above
  // next to the photo art (Dan, 2026-10-28); the page frame shows the real ones after the hand-off

  // the two lamps under the eave: a warm bulb and a soft glow (glow sprites read from any angle)
  const glowTex = canvasTex(128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,226,170,1)'); gr.addColorStop(.18, 'rgba(255,196,120,.55)'); gr.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  for (const lx of [-1.25, 1.25]) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.position.set(lx, 3.38, -6.1); s.scale.set(1.6, 1.6, 1); scene.add(s);
  }

  // the dusk sky (a dome; only the angled flights see it before touchdown)
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `varying vec3 vD; void main(){
      float h = vD.y, glow = pow(max(0., dot(normalize(vD.xz), normalize(vec2(.75, -.66)))), 3.);
      vec3 zen = vec3(.16, .22, .40), hor = mix(vec3(.42, .33, .38), vec3(.93, .50, .22), glow);
      vec3 c = mix(hor, zen, smoothstep(0., .42, h)); c = mix(c, vec3(.29, .24, .21), smoothstep(0., -.02, h));
      gl_FragColor = vec4(c, 1.); }` }));
  sky.renderOrder = -1; scene.add(sky);

  // the landing frame on a quad that exactly fills the landing camera's view (60 m out); shown from the landing spot
  const D = 60, qh = 2 * D * 512 / FPX;
  const quadMat = new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false,
    uniforms: { map: { value: land }, opacity: { value: 0 }, feather: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D map; uniform float opacity, feather; varying vec2 vUv;
      void main(){ float a = opacity * (feather > 0. ? smoothstep(0., feather, vUv.y) : 1.); gl_FragColor = vec4(texture2D(map, vUv).rgb, a); }` });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(qh * 1.5, qh), quadMat);
  quad.position.set(0, EYE, -D); quad.renderOrder = 10; quad.frustumCulled = false; scene.add(quad);

  const car = makeCar(scene, carTex);
  return {
    scene, car,
    set(o) {
      shared.uA.value = o.uA;
      quadMat.uniforms.opacity.value = o.quad; quadMat.uniforms.feather.value = o.feather;
      quad.visible = o.quad > 0;
    },
  };
}

// ---- the car (Dan: right to left on the road, once per load, "CATCH YOUR COUPON" on the roof, read from the drone)
function makeCar(scene, carTex) {
  const g = new THREE.Group(); g.position.set(40, 0, -2.4); g.visible = false; scene.add(g);
  const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  const shadow = canvasTex(256, 128, c => { const gr = c.createRadialGradient(128, 64, 10, 128, 64, 128); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 128); });
  const sh = add(new THREE.PlaneGeometry(6.4, 3), basic(0xffffff, { map: shadow, transparent: true, depthWrite: false }), .3, .02, .35); sh.rotation.x = -Math.PI / 2;
  const beam = canvasTex(256, 128, c => { const gr = c.createLinearGradient(256, 0, 0, 0); gr.addColorStop(0, 'rgba(255,214,140,.55)'); gr.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(256, 44); c.lineTo(0, 0); c.lineTo(0, 128); c.lineTo(256, 84); c.fill(); });
  const bm = add(new THREE.PlaneGeometry(9, 4.2), basic(0xffffff, { map: beam, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), -7, .03, 0); bm.rotation.x = -Math.PI / 2;
  // the car from above with its roof sign in the photo (img/car.webp; the sign: drone/tools/sign-guide.py)
  const body = add(new THREE.PlaneGeometry(5, 5 / 2.472), basic(0xffffff, { map: carTex, transparent: true, depthWrite: false }), 0, 1.2, 0);
  body.rotation.x = -Math.PI / 2;
  let t0 = null;
  return {
    start(delay = 900) { t0 = performance.now() + delay; },
    update(now) {
      if (t0 === null) return;
      const k = (now - t0) / 6000;
      if (k < 0 || k > 1) { g.visible = false; if (k > 1) t0 = null; return; }
      g.visible = true; g.position.x = 26 - 52 * k;
    },
  };
}
