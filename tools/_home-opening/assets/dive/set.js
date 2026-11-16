// The set dressing on and round the parts bench: one file, loaded by room.html for EVERY view of the room.
// Dan 2026-11-15: "Everything we add to the phone page is included also in the website laptop page ... it's like the same scene, just different angle";
// and, once the guitar and the deck were in: "so it will match the computer. It's the same garage."
// What it adds: the phone lying on the bench (the phone opening dives into its screen: phone-dive.html), the light it throws, the room's black
// electric opened up for a repair, the vinyl cabinet's deck on the GAS drum with a record turning, a combo amp and the leads between them,
// and a second ceiling fan over the bench. Everything stands where the bench (R07) and the drum (N06) stand: move those and it goes with them.
// It lives under assets/ because the site's build copies only room.html, street.js, lights/lights-on.js, layouts/, vendor/ and assets/.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z), clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
// metres, the room's axes (x across, y up, z from the TV wall), with the bench where the room's own layout has it (its corner at 2.65, 6.974)
const SET = {
  phone: { x: 2.93, z: 7.9, yaw: 62, from: 1.2 },   // where it was tossed on the parts bench, and how far it turned (deg); from: the height its resting place is looked for from
  fan: { x: 2.36, z: 7.2 },                          // the second fan's hub: 0.9 m from the phone camera's way down, its tips pass beside the lens
  screen: { w: 0.0693, h: 0.15, nav: 58 / 844, t: 0.009 },
};

// R, scene: the room's; model(name): a copy of assets/models/<name>.glb through the room's own loader (its files are shared, not fetched twice); liveScreen(material): a screen whose pixels the finishing pass leaves alone; shiny(material): takes the room's reflection, up with its lamps;
// glowOf(material): a pilot light that comes on with the room's gear. Returns what the phone page needs, or null when the room has no parts bench.
export async function dress({ R, scene, liveScreen, shiny, glowOf, model }) {
  const benchIt = R.items.find((i) => i.id === 'R07' && i.obj); if (!benchIt) return null;
  scene.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(benchIt.obj), O = { x: bb.min.x - 2.65, z: bb.min.z - 6.974 }, plank = benchIt.obj.getObjectByName('bench_1'), TOP = plank ? new THREE.Box3().setFromObject(plank).max.y : bb.max.y;
  let look = 'brass';   // Dan's pick, 2026-11-16 (shop and radio stay reachable with ?look=; only the shown look is ever built)

  // ---- the phone: the site's phone capture as its screen, in a body built three ways (?look=brass|shop|radio; ?looks = buttons on the picture); BRASS is Dan's pick (2026-11-16) ----
  // Every look keeps the screen where it is (the lock's sums stand on it): only what lies round it changes. Parts round the screen may stand proud of it, never over it.
  const S = SET.screen, phone = new THREE.Group(), shell = new THREE.Group();
  const LOOKS = {};
  {
    const img = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('picture ' + src)); i.src = src; });
    const tex = async (src) => { const t = new THREE.Texture(await img(src)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; };
    // (liveScreen, the room's own way for a screen: its finishing pass leaves these pixels as they are, so at the phone's lock the 3D screen IS the site's picture)
    const face = (t, h, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(S.w, h), liveScreen(new THREE.MeshBasicMaterial({ map: t, toneMapped: false, fog: false }))); m.rotation.x = -Math.PI / 2; m.position.set(0, S.t + 0.0006, z); return m; };
    const navH = S.h * S.nav;
    phone.add(shell, face(await tex('assets/nav-390.webp'), navH, -S.h / 2 + navH / 2), face(await tex('assets/tv-390x844.webp'), S.h - navH, navH / 2));
    scene.add(phone);

    // -- what the looks are made of --
    const rnd = (seed) => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const paint = (wd, ht, draw, srgb) => { const c = document.createElement('canvas'); c.width = wd; c.height = ht; draw(c.getContext('2d'), wd, ht); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
    // wear, as roughness: a used surface is rubbed dull in patches and carries hairline scratches (seeded: the same phone every load)
    const wearMap = (seed, base, n) => paint(256, 512, (g, W, H) => {
      const r = rnd(seed); g.fillStyle = `rgb(${base},${base},${base})`; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, q = 20 + r() * 70, v = base + (r() - 0.35) * 90, gr = g.createRadialGradient(x, y, 0, x, y, q); gr.addColorStop(0, `rgba(${v},${v},${v},.5)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = gr; g.fillRect(x - q, y - q, 2 * q, 2 * q); }
      for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, l = 8 + r() * 90, v = 150 + r() * 105; g.strokeStyle = `rgba(${v},${v},${v},${0.25 + r() * 0.5})`; g.lineWidth = 0.5 + r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    }, false);
    const mat = ({ envK = 1, ...o }) => { const m = new THREE.MeshStandardMaterial(o); if (m.metalness > 0.3 || m.roughness < 0.5) { m.userData.env = envK; shiny(m); } return m; }; // the room's own reflection on the shiny parts, as its own things have
    const put = (g, x, y, z, ry) => { const m = new THREE.Mesh(g[0], g[1]); m.position.set(x, y, z); if (ry) m.rotation.y = ry * Math.PI / 180; m.castShadow = m.receiveShadow = true; return m; };
    // a rounded block standing on the bench (y 0) up to `top`, wd across, dp along, at (x, z)
    const block = (wd, dp, top, rad, m, x = 0, z = 0, y0 = 0) => put([new RoundedBoxGeometry(wd, top - y0, dp, 4, Math.min(rad, (top - y0) / 2 - 1e-4)), m], x, (top + y0) / 2, z);
    const plate = (wd, dp, y, m, x, z, ry) => { const p = put([new THREE.PlaneGeometry(wd, dp), m], x, y, z); p.rotation.set(-Math.PI / 2, 0, (ry || 0) * Math.PI / 180); p.castShadow = false; return p; };
    const glass = () => mat({ color: '#07070a', metalness: 0.2, roughness: 0.16 });
    const bezel = (grow, m) => block(S.w + grow, S.h + grow, S.t + 0.0003, 0.003, m || glass()); // the dark glass round the picture, a hair under it
    const letters = (txt, wd, ht, bg, ink, edge) => paint(wd, ht, (g, W, H) => {
      g.fillStyle = bg; g.fillRect(0, 0, W, H); if (edge) { g.strokeStyle = edge; g.lineWidth = H * 0.07; g.strokeRect(H * 0.09, H * 0.09, W - H * 0.18, H - H * 0.18); }
      g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `400 ${Math.round(H * 0.6)}px "Bebas Neue", "Arial Narrow", sans-serif`;
      if ('letterSpacing' in g) g.letterSpacing = Math.round(H * 0.09) + 'px'; g.fillText(txt, W / 2 + H * 0.045, H * 0.54);
    }, true);
    try { await document.fonts.load('400 48px "Bebas Neue"'); } catch { /* the plate falls back to a narrow sans */ }
    const hw = S.w / 2, hh = S.h / 2;

    // 1 · BRASS PLATE: a machined brass frame like a RevAudio faceplate, four slotted screws, the name on an enamel plate under the screen
    LOOKS.brass = () => {
      const brass = mat({ color: '#a8823c', metalness: 0.95, roughness: 0.62, roughnessMap: wearMap(11, 150, 240), envK: 1.3 });
      const out = [block(S.w + 0.014, S.h + 0.038, S.t, 0.0042, brass, 0, 0.009), bezel(0.005)];
      out.push(plate(0.046, 0.0105, S.t + 0.0002, mat({ map: letters('REVAUDIO', 512, 116, '#16110d', '#d9b662', '#8f6f33'), metalness: 0.55, roughness: 0.42 }), 0, hh + 0.0165));
      const steel = mat({ color: '#b5afa2', metalness: 0.9, roughness: 0.34 }), slot = mat({ color: '#15110d', metalness: 0.3, roughness: 0.7 });
      [[-1, -1, 13], [1, -1, -7], [-1, 1, 19], [1, 1, 41]].forEach(([sx, sz, a]) => { const x = sx * (hw + 0.0046), z = sz < 0 ? -hh - 0.0062 : hh + 0.0245; // (each screw turned its own few degrees: aligned screws read as drawn)
        out.push(put([new THREE.CylinderGeometry(0.0017, 0.0019, 0.0008, 20), steel], x, S.t + 0.0003, z), put([new THREE.BoxGeometry(0.003, 0.0003, 0.00045), slot], x, S.t + 0.00068, z, a)); });
      return out;
    };
    // 2 · SHOP BUMPER: the phone a mechanic carries: black rubber with fat corners, an oxide-red line round the glass, a webbing strap left lying on the bench
    LOOKS.shop = () => {
      const rubber = mat({ color: '#141518', metalness: 0, roughness: 0.95, roughnessMap: wearMap(23, 215, 120) }), corner = mat({ color: '#0c0d0f', metalness: 0, roughness: 0.82 }), red = mat({ color: '#b13a25', metalness: 0, roughness: 0.62 }); 
      const out = [block(S.w + 0.021, S.h + 0.026, S.t, 0.007, rubber), bezel(0.0038, red), bezel(0.001)]; // (the red shows as a 1.4 mm line between glass and rubber)
      const rim = S.t + 0.0034, side = 0.0062, end = 0.0078;
      for (const sx of [-1, 1]) out.push(block(side, S.h + 0.003, rim, 0.0012, rubber, sx * (hw + 0.0019 + side / 2 + 0.0006), 0));
      for (const sz of [-1, 1]) out.push(block(S.w + 0.016, end, rim, 0.0012, rubber, 0, sz * (hh + 0.0019 + end / 2 + 0.0006)));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(block(0.0125, 0.018, S.t + 0.0048, 0.0022, corner, sx * (hw + 0.0078), sz * (hh + 0.0085)));
      out.push(plate(0.03, 0.0052, rim + 0.0001, new THREE.MeshStandardMaterial({ map: letters('REVAUDIO', 384, 66, '#141518', '#b9ad92'), roughness: 0.9 }), 0, hh + 0.0064));
      const web = new THREE.MeshStandardMaterial({ color: '#7e2a1c', roughness: 0.92 }), ring = mat({ color: '#9a958b', metalness: 0.9, roughness: 0.4 });
      out.push(put([new THREE.TorusGeometry(0.0052, 0.0009, 8, 24), ring], -hw - 0.011, 0.0012, hh + 0.016)); out[out.length - 1].rotation.x = Math.PI / 2;
      out.push(put([new THREE.BoxGeometry(0.011, 0.0014, 0.062), web], -hw - 0.028, 0.0008, hh + 0.042, 34), put([new THREE.BoxGeometry(0.011, 0.0016, 0.03), web], -hw - 0.05, 0.0019, hh + 0.073, 78)); // the strap, folded once where it fell
      return out;
    };
    // 3 · DASH RADIO: the phone as a car radio: a chrome body, a cream surround, two knurled knobs and a lit name window under the screen
    LOOKS.radio = () => {
      const chrome = mat({ color: '#e3e3e0', metalness: 1, roughness: 0.52, roughnessMap: wearMap(37, 140, 160), envK: 1.8 }), cream = mat({ color: '#b3a686', metalness: 0, roughness: 0.62 }), dark = mat({ color: '#1a1210', metalness: 0.1, roughness: 0.42, envK: 0.6 });
      const cz = hh + 0.0215, out = [block(S.w + 0.018, S.h + 0.052, S.t, 0.006, chrome, 0, 0.013), bezel(0.0075, cream), bezel(0.0022), block(S.w + 0.0075, 0.03, S.t + 0.0003, 0.003, dark, 0, cz)];
      const skirt = new THREE.MeshStandardMaterial({ color: '#191513', roughness: 0.55, flatShading: true }), cap = mat({ color: '#d5d8da', metalness: 1, roughness: 0.22, envK: 1.6 }), notch = new THREE.MeshStandardMaterial({ color: '#e6dcc2', roughness: 0.6 });
      [[-0.0225, -38], [0.0225, 112]].forEach(([x, a]) => { const k = new THREE.Group(); k.position.set(x, S.t, cz); k.rotation.y = a * Math.PI / 180; // (the knobs left where a hand last turned them)
        k.add(put([new THREE.CylinderGeometry(0.0068, 0.0074, 0.0062, 26), skirt], 0, 0.0031, 0), put([new THREE.CylinderGeometry(0.0052, 0.0056, 0.001, 26), cap], 0, 0.0067, 0), put([new THREE.BoxGeometry(0.0009, 0.0004, 0.0032), notch], 0, 0.0073, -0.003)); out.push(k); });
      out.push(plate(0.0245, 0.0092, S.t + 0.0005, new THREE.MeshBasicMaterial({ map: letters('REVAUDIO', 384, 144, '#ffab52', '#2a1608', '#3a2210'), toneMapped: false, color: '#c9c9c9' }), 0, cz)); // lit from inside, like the room's own meters
      return out;
    };
  }
  // Each look is built once and then only shown or hidden. Nothing is thrown away on a switch: the room compiles its shaders over several frames as it
  // boots, and a material disposed under it stops that compile dead ("Cannot read properties of undefined (reading 'isReady')": the room stayed dark).
  const built = {};
  function setLook(name) {
    if (!LOOKS[name]) return;
    if (!built[name]) { built[name] = new THREE.Group(); built[name].add(...LOOKS[name]()); shell.add(built[name]); }
    for (const k in built) built[k].visible = k === name;
    look = name;
  }
  setLook(look);
  // tossed, not placed: it rests on whatever lies under its footprint (the bench, the edge of the cutting mat, a spool)
  {
    scene.updateMatrixWorld(true); // the room may not have drawn a frame yet: the rays need every object where it stands
    const solids = R.items.filter((i) => i.obj && i.id !== 'N40').map((i) => i.obj), rc = new THREE.Raycaster(), down = V(0, -1, 0);
    const seen = (o) => { if (!o.isMesh || (o.material && (o.material.visible === false || o.material.opacity === 0))) return false; for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    const hitY = (x, z) => { rc.set(V(x, SET.phone.from, z), down); const h = rc.intersectObjects(solids, true).find((q) => seen(q.object)); return h ? h.point.y : 0; };
    const x = SET.phone.x + O.x, z = SET.phone.z + O.z, yaw = SET.phone.yaw * Math.PI / 180, c = Math.cos(yaw), s = Math.sin(yaw), pts = [];
    for (let i = -3; i <= 3; i++) for (let j = -6; j <= 6; j++) { const lx = i / 3 * (S.w / 2 + 0.01), lz = 0.012 + j / 6 * (S.h / 2 + 0.024); /* every look's body fits inside this: one resting place for all three */ pts.push([lx, lz, hitY(x + lx * c + lz * s, z - lx * s + lz * c)]); }
    let sx = 0, sz = 0, sy = 0, sxx = 0, szz = 0, sxy = 0, szy = 0; const n = pts.length; // the plane of best fit, then lifted clear of every point
    for (const [lx, lz, y] of pts) { sx += lx; sz += lz; sy += y; sxx += lx * lx; szz += lz * lz; sxy += lx * y; szy += lz * y; }
    const lim = Math.tan(12 * Math.PI / 180);
    const a = clamp((sxy - sx * sy / n) / (sxx - sx * sx / n), -lim, lim), b = clamp((szy - sz * sy / n) / (szz - sz * sz / n), -lim, lim);
    let d = -1e9; for (const [lx, lz, y] of pts) d = Math.max(d, y - a * lx - b * lz);
    const nrm = V(-a, 1, -b).normalize();
    phone.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), nrm).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw)));
    phone.position.set(x, d + 0.0005, z);
    SET.phone.tilt = +(Math.acos(nrm.y) * 180 / Math.PI).toFixed(1);
    // the screen's light on the bench: a soft pool of amber lying level just over the bench top, not a lamp (a lamp 12 cm over the phone lit the phone's own body
    // far harder than the bench: black rubber came out brown, an ivory surround burned white)
    const c2 = document.createElement('canvas'); c2.width = c2.height = 256; const g2 = c2.getContext('2d'), gr = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,170,96,1)'); gr.addColorStop(0.22, 'rgba(255,160,84,.55)'); gr.addColorStop(0.55, 'rgba(255,150,70,.14)'); gr.addColorStop(1, 'rgba(255,150,70,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 256, 256);
    const pt = new THREE.CanvasTexture(c2); pt.colorSpace = THREE.SRGBColorSpace;
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: pt, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.2 }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(x, d + 0.004, z); scene.add(pool);
    // and the warm light the mat had from that lamp, now from over the mat itself (its ring lamp's side, 0.3 m up): the mat keeps its green, the phone's body gets a twentieth of what it got
    // (on the clamp lamp's circuit, N12: it comes on with the lamp over the bench when the room's lights come on)
    const lampAt = new THREE.Object3D(); lampAt.userData.item = { id: 'N12' }; lampAt.position.set(3.075 + O.x, d + 0.3, 8.185 + O.z); scene.add(lampAt);
    const glow = new THREE.PointLight('#ffb060', 0.3, 1.0, 2); glow.userData.cd = 0.3; lampAt.add(glow); (R.propLights ||= []).push(glow);
  }

  // ---- things added to the room for this opening: all of them the room's own models, re-used ----
  const gltf = model || (async (name) => (await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('assets/models/' + name + '.glb')).scene);
  const pm = (o) => { const m = o.isMaterial ? o : new THREE.MeshStandardMaterial(o); if (m.metalness > 0.3 || m.roughness < 0.5) shiny(m); return m; }; // the room's own reflection, on shiny parts only (as its own things have)
  const add = (to, geo, m, x, y, z, rot) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (rot) o.rotation.set(...rot); o.castShadow = o.receiveShadow = true; to.add(o); return o; };
  const cord = (to, pts, r, m, seg = 48) => add(to, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => (q.isVector3 ? q : V(...q)))), seg, r, 6), m, 0, 0, 0);
  const steel = pm({ color: '#b3aea2', metalness: 0.95, roughness: 0.36 });
  // A model made as one mesh, taken apart: its vertices welded by place (a seam in its picture is not a gap in the part), split by connection.
  // sort(kind) hands each piece's box to kind() and bins its triangles under the name it returns (null = the piece is left out); cut(name) is that bin as its own mesh, centred on itself.
  const apart = (mesh) => {
    const P = mesh.geometry.attributes.position, N = mesh.geometry.attributes.normal, U = mesh.geometry.attributes.uv, I = mesh.geometry.index, par = [], at = new Map(), root = new Int32Array(P.count), bins = {};
    const find = (a) => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; }, pt = (i) => V(P.getX(i), P.getY(i), P.getZ(i));
    for (let i = 0; i < P.count; i++) { const k = Math.round(P.getX(i) * 2e4) + ',' + Math.round(P.getY(i) * 2e4) + ',' + Math.round(P.getZ(i) * 2e4); if (!at.has(k)) { at.set(k, par.length); par.push(par.length); } root[i] = at.get(k); }
    for (let i = 0; i < I.count; i += 3) { const a = find(root[I.getX(i)]); par[find(root[I.getX(i + 1)])] = a; par[find(root[I.getX(i + 2)])] = a; }
    const boxes = new Map(); for (let i = 0; i < I.count; i++) { const v = I.getX(i), c = find(root[v]); let b = boxes.get(c); if (!b) boxes.set(c, b = new THREE.Box3()); b.expandByPoint(pt(v)); }
    const names = new Map(); for (const [c, b] of boxes) names.set(c, kind0(b));
    function kind0() { return null; }
    return { P, N, U, root, bins,
      sort(kind) { for (const [c, b] of boxes) names.set(c, kind(b, b.getSize(V()), b.getCenter(V()))); for (let i = 0; i < I.count; i += 3) { const k = names.get(find(root[I.getX(i)])); if (k) (bins[k] ||= []).push(I.getX(i), I.getX(i + 1), I.getX(i + 2)); } return this; },
      cut(k, m = mesh.material) { const ids = bins[k], g = new THREE.BufferGeometry(), F = Float32Array, p = new F(ids.length * 3), n = new F(ids.length * 3), u = new F(ids.length * 2);
        ids.forEach((v, j) => { p.set([P.getX(v), P.getY(v), P.getZ(v)], j * 3); n.set([N.getX(v), N.getY(v), N.getZ(v)], j * 3); u.set([U.getX(v), U.getY(v)], j * 2); });
        g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(n, 3)); g.setAttribute('uv', new THREE.BufferAttribute(u, 2));
        g.computeBoundingBox(); const c = g.boundingBox.getCenter(V()); g.translate(-c.x, -c.y, -c.z); const o = new THREE.Mesh(g, m); o.position.copy(c); o.castShadow = o.receiveShadow = true; return o; } };
  };

  // ---- the guitar on the bench: the room's black electric (the rack's), laid on its back and opened up for a repair ----
  // (Dan 2026-11-15: "put a guitar on top of the table ... a studio vibe ... open like it's getting fixed"; then "make the guitar wear out a bit. It's too polished")
  // Its 45 parts do not touch: the strings and the wall hanger leave, the bridge pickup and two knobs come off, the body gets a played finish of its own.
  const GTR = { x: 2.95 + O.x, z: 7.34 + O.z, yaw: 30, top: TOP, pad: 0.007 }; // its middle on the bench, its head towards the TV wall and the aisle (it runs down to the phone), the pad under its body
  const guitar = new THREE.Group();
  {
    let whole; (await gltf('guitar-black')).traverse((m) => { if (m.isMesh) whole = m; });
    const gm = pm(whole.material); if (gm.map) gm.map.anisotropy = 8;
    // which piece is what, by where it sits (model: x across, y along from the body's end 0 to the head 0.99, z out of the face)
    const A = apart(whole).sort((b, s, c) => {
      if (s.y > 0.6 && s.x < 0.012) return null;                                               // a string
      if (b.min.y > 0.75 && b.max.y < 0.88 && b.min.z < 0) return null;                        // the wall hanger it hung from
      if (s.x > 0.3) return 'wood';                                                            // the body itself
      if (b.min.y > 0.184 && b.max.y < 0.226 && b.min.z > 0.025) return 'pickup';              // the bridge pickup (its ring stays on the body)
      if (Math.abs(s.x - 0.022) < 0.003 && Math.abs(s.y - 0.022) < 0.003 && c.y > 0.12 && b.min.z > 0.02) return c.y > 0.15 ? 'knobB' : 'knobA';
      return 'rest'; });
    const FACE = 0.022, { P, N, U } = A;

    // -- on the guitar itself (the model's own axes: it lies on its back, so z is up) --
    const gM = new THREE.Group(); gM.rotation.x = -Math.PI / 2; gM.position.set(0, FACE + GTR.pad, 0.495); guitar.add(gM);
    gM.add(A.cut('rest'));
    const wood = A.cut('wood'); gM.add(wood);
    { // The body's finish, played for years. Painted into copies of the model's own pictures, placed by where things are on the face (the face's triangles give the picture's spot for a spot on the body).
      const ids = A.bins.wood, tris = []; for (let i = 0; i < ids.length; i += 3) if (N.getZ(ids[i]) > 0.7 && N.getZ(ids[i + 1]) > 0.7 && N.getZ(ids[i + 2]) > 0.7) tris.push([ids[i], ids[i + 1], ids[i + 2]]);
      const uvAt = (x, y) => { for (const [a, b, c] of tris) { const x1 = P.getX(a), y1 = P.getY(a), x2 = P.getX(b), y2 = P.getY(b), x3 = P.getX(c), y3 = P.getY(c), d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3); if (Math.abs(d) < 1e-12) continue;
        const l1 = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / d, l2 = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / d, l3 = 1 - l1 - l2; if (l1 < -1e-4 || l2 < -1e-4 || l3 < -1e-4) continue;
        return [l1 * U.getX(a) + l2 * U.getX(b) + l3 * U.getX(c), l1 * U.getY(a) + l2 * U.getY(b) + l3 * U.getY(c)]; } return null; };
      const Wd = 1024, mk = (img) => { const c = document.createElement('canvas'); c.width = c.height = Wd; const g = c.getContext('2d'); g.drawImage(img, 0, 0, Wd, Wd); g.lineCap = 'round'; return [c, g]; };
      const [cc, col] = mk(gm.map.image), [rc, orm] = mk(gm.roughnessMap.image); // colour; and gloss (its green = roughness, its blue = metal: paint is "255, rough, 0")
      const px = (x, y) => { const q = uvAt(x, y); return q && [q[0] * Wd, q[1] * Wd]; }, a0 = px(0, 0.1), a1 = px(0.1, 0.1), K = a0 && a1 ? Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) / 0.1 : 2000; // K: picture px per metre of body
      let sd = 41; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647, on = () => [(rnd() - 0.5) * 0.33, rnd() * 0.448];
      const line = (g, pts, wd, style) => { g.strokeStyle = style; g.lineWidth = wd; g.beginPath(); let pen = false; for (const [x, y] of pts) { const q = px(x, y); if (!q) { pen = false; continue; } pen ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); pen = true; } g.stroke(); };
      const blob = (g, x, y, r, c0, c1) => { const q = px(x, y); if (!q) return; const rr = r * K, gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(q[0] - rr, q[1] - rr, 2 * rr, 2 * rr); };
      // the gloss gone: a dull haze over all of it, duller where it was handled, a little shine left where an arm polished it
      orm.fillStyle = 'rgba(255,150,0,.62)'; orm.fillRect(0, 0, Wd, Wd);
      for (let i = 0; i < 90; i++) { const [x, y] = on(), dull = rnd() < 0.75; blob(orm, x, y, 0.015 + rnd() * 0.04, dull ? 'rgba(255,215,0,.5)' : 'rgba(255,70,0,.4)', dull ? 'rgba(255,215,0,0)' : 'rgba(255,70,0,0)'); }
      col.fillStyle = 'rgba(120,110,96,.05)'; col.fillRect(0, 0, Wd, Wd); // dust: black lacquer is never black for long
      // hairline scratches everywhere, and the pick's arcs round the pickups
      const arc = (cx, cy, r, a0r, len) => { const pts = []; for (let t = 0; t <= 1; t += 0.2) pts.push([cx + Math.cos(a0r + t * len) * r, cy + Math.sin(a0r + t * len) * r]); return pts; };
      for (let i = 0; i < 300; i++) { const [x, y] = on(), pts = arc(x, y, 0.02 + rnd() * 0.12, rnd() * 6.3, (0.1 + rnd() * 0.5) * (rnd() < 0.5 ? 1 : -1)); line(orm, pts, 1, 'rgba(255,240,0,.6)'); line(col, pts, 0.8, `rgba(196,186,170,${0.08 + rnd() * 0.12})`); }
      for (let i = 0; i < 150; i++) { const pts = arc(0.035 + (rnd() - 0.5) * 0.03, 0.27 + (rnd() - 0.5) * 0.05, 0.025 + rnd() * 0.075, -1.9 + rnd() * 1.1, 0.5 + rnd() * 0.9); line(orm, pts, 1.2, 'rgba(255,245,0,.7)'); line(col, pts, 0.9, `rgba(205,195,178,${0.1 + rnd() * 0.14})`); }
      // the finish worn through to the wood where a forearm lay, on the bout away from the knobs
      { const path = [[-0.126, 0.04, 0.02], [-0.14, 0.08, 0.028], [-0.147, 0.125, 0.03], [-0.143, 0.165, 0.026], [-0.13, 0.205, 0.018]]; // (many soft touches along the arm's line: one patch, not a row of spots)
        for (let i = 0; i <= 40; i++) { const f = i / 40 * (path.length - 1), k = Math.min(path.length - 2, Math.floor(f)), t = f - k, [x, y, r] = path[k].map((v, j) => v + (path[k + 1][j] - v) * t), jx = (rnd() - 0.5) * 0.006;
          blob(col, x + jx, y, r * 1.5, 'rgba(70,48,28,.16)', 'rgba(70,48,28,0)'); blob(col, x - 0.007 + jx, y, r * 0.75, 'rgba(142,104,62,.3)', 'rgba(120,86,50,0)'); blob(orm, x, y, r * 1.4, 'rgba(255,225,0,.3)', 'rgba(255,225,0,0)'); } }
      // its edge rubbed bare, here and there (the face's own outline: the edges only one face triangle owns)
      const seen = new Map(); for (const t of tris) for (let k = 0; k < 3; k++) { const a = t[k], b = t[(k + 1) % 3], key = Math.min(A.root[a], A.root[b]) + '_' + Math.max(A.root[a], A.root[b]); seen.set(key, seen.has(key) ? null : [a, b]); }
      for (const e of seen.values()) { if (!e || rnd() < 0.42) continue; const [a, b] = e, q0 = [U.getX(a) * Wd, U.getY(a) * Wd], q1 = [U.getX(b) * Wd, U.getY(b) * Wd];
        for (const [g, st, wd] of [[col, `rgba(150,112,70,${0.5 + rnd() * 0.4})`, 1.6 + rnd() * 2.4], [orm, 'rgba(255,225,0,.8)', 3]]) { g.strokeStyle = st; g.lineWidth = wd; g.beginPath(); g.moveTo(...q0); g.lineTo(...q1); g.stroke(); } }
      // dings and chips: mostly along the bottom edge and round the controls, a few anywhere
      for (let i = 0; i < 22; i++) { const [x, y] = i < 9 ? [(rnd() - 0.5) * 0.3, 0.004 + rnd() * 0.05] : i < 15 ? [0.06 + rnd() * 0.09, 0.05 + rnd() * 0.16] : on(), q = px(x, y); if (!q) continue; const r = (0.0012 + rnd() * 0.003) * K;
        for (const [g, st] of [[col, '#a07c4c'], [orm, 'rgb(255,230,0)']]) { g.fillStyle = st; g.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283, rr = r * (0.55 + rnd() * 0.7); g[k ? 'lineTo' : 'moveTo'](q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr); } g.closePath(); g.fill(); }
        col.strokeStyle = 'rgba(16,11,7,.7)'; col.lineWidth = 1; col.stroke(); }
      const tx = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.flipY = false; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = gm.map.wrapS; t.wrapT = gm.map.wrapT; return t; }; // (flipY off: a model's pictures are not flipped)
      const wm = gm.clone(); wm.map = tx(cc, true); wm.roughnessMap = wm.metalnessMap = tx(rc, false); wood.material = wm;
      // a strip of masking tape with the fault pencilled on it, as a tech leaves it
      const tape = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 200; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#d9cfae'; g.fillRect(0, 0, 200, 64); g.fillStyle = 'rgba(120,100,60,.18)'; for (let i = 0; i < 40; i++) g.fillRect(rnd() * 200, 0, 1, 64);
        g.fillStyle = '#3a3630'; g.font = 'italic 600 22px "Bradley Hand", "Segoe Print", cursive'; g.fillText('BRIDGE P.U.', 12, 27); g.font = 'italic 600 19px "Bradley Hand", "Segoe Print", cursive'; g.fillText('dead - rewire', 20, 52); return c; })()); tape.colorSpace = THREE.SRGBColorSpace;
      add(gM, new THREE.PlaneGeometry(0.058, 0.0186), new THREE.MeshStandardMaterial({ map: tape, roughness: 0.92 }), -0.03, 0.075, FACE + 0.0005, [0, 0, 0.16]).castShadow = false;
    }
    // the bridge pickup out of its ring, lying on the body on its lead; the rout it left, with the wires down in it
    const pu = A.cut('pickup'); pu.position.set(-0.09, 0.212, FACE + 0.0045); pu.rotation.set(0.1, 0, 0.5); gM.add(pu);
    const rout = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 140; c.height = 76; const g = c.getContext('2d');
      g.fillStyle = '#6b4a2c'; g.fillRect(0, 0, 140, 76); g.fillStyle = '#0d0907'; g.beginPath(); g.roundRect(5, 5, 130, 66, 8); g.fill();
      g.fillStyle = '#1c130c'; g.beginPath(); g.roundRect(14, 14, 112, 48, 5); g.fill(); g.fillStyle = '#060403'; for (const x of [9, 131]) { g.beginPath(); g.arc(x, 38, 3, 0, 7); g.fill(); } return c; })()); rout.colorSpace = THREE.SRGBColorSpace;
    add(gM, new THREE.PlaneGeometry(0.069, 0.037), new THREE.MeshStandardMaterial({ map: rout, roughness: 0.95 }), 0, 0.205, FACE + 0.0045); // (a hair over the ring's own top: the model's ring is a solid plate)
    cord(gM, [[0.012, 0.2, FACE + 0.005], [0.0, 0.214, FACE + 0.02], [-0.04, 0.222, FACE + 0.017], [-0.074, 0.215, FACE + 0.007]], 0.0013, pm({ color: '#8f887a', metalness: 0.7, roughness: 0.55 }), 24); // the braided lead
    cord(gM, [[-0.012, 0.209, FACE + 0.005], [-0.02, 0.196, FACE + 0.014], [-0.05, 0.19, FACE + 0.006], [-0.064, 0.186, FACE + 0.002]], 0.0008, new THREE.MeshStandardMaterial({ color: '#a8281c', roughness: 0.6 }), 24); // a red wire unsoldered, its end bare on the body
    // two knobs pulled: bare pot shafts with their nuts stand where they were
    const shaft = new THREE.CylinderGeometry(0.003, 0.003, 0.013, 12), nut = new THREE.CylinderGeometry(0.0062, 0.0062, 0.002, 6);
    for (const [x, y] of [[0.112, 0.133], [0.088, 0.168]]) { add(gM, shaft, steel, x, y, FACE + 0.0065, [Math.PI / 2, 0, 0]); add(gM, nut, steel, x, y, FACE + 0.001, [Math.PI / 2, 0.4, 0]); }

    // -- on the bench round it (the guitar's own floor plan: x across it, + towards the wall; z along it, + towards its body's end) --
    // a canvas pad under the body, so a black guitar reads on a dark bench and nothing scratches its back
    const padT = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 256; c.height = 320; const g = c.getContext('2d'); let s = 7; const r = () => { s = s * 16807 % 2147483647; return s / 2147483647; };
      g.fillStyle = '#857b66'; g.fillRect(0, 0, 256, 320); for (let i = 0; i < 1400; i++) { const v = 100 + r() * 60; g.fillStyle = `rgba(${v},${v * 0.93},${v * 0.78},.25)`; g.fillRect(r() * 256, r() * 320, 1 + r() * 3, 1); }
      g.strokeStyle = 'rgba(58,50,38,.55)'; g.lineWidth = 1.5; for (let y = -256; y < 320; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y + 256); g.stroke(); g.beginPath(); g.moveTo(256, y); g.lineTo(0, y + 256); g.stroke(); } // quilting
      for (const [x, y, q] of [[70, 210, 46], [190, 90, 30]]) { const gr = g.createRadialGradient(x, y, 0, x, y, q); gr.addColorStop(0, 'rgba(40,30,20,.5)'); gr.addColorStop(1, 'rgba(40,30,20,0)'); g.fillStyle = gr; g.fillRect(x - q, y - q, 2 * q, 2 * q); } // oil, from other jobs
      g.strokeStyle = '#3a3226'; g.lineWidth = 7; g.strokeRect(3, 3, 250, 314); return c; })()); padT.colorSpace = THREE.SRGBColorSpace;
    add(guitar, new RoundedBoxGeometry(0.4, GTR.pad, 0.5, 2, 0.003), new THREE.MeshStandardMaterial({ map: padT, roughness: 0.97 }), 0.012, GTR.pad / 2, 0.262, [0, 0.05, 0]);
    // a neck rest: a wood block with a cork saddle, under the neck where a hand would have slid it
    const neckY = FACE + GTR.pad + 0.014;
    add(guitar, new RoundedBoxGeometry(0.11, neckY - 0.004, 0.046, 2, 0.003), new THREE.MeshStandardMaterial({ color: '#8a6842', roughness: 0.8 }), 0, (neckY - 0.004) / 2, -0.19, [0, 0.12, 0]);
    add(guitar, new RoundedBoxGeometry(0.075, 0.004, 0.046, 2, 0.0015), new THREE.MeshStandardMaterial({ color: '#b08e62', roughness: 0.95 }), 0, neckY - 0.002, -0.19, [0, 0.12, 0]);
    // the old strings, wound off and coiled as they come off a guitar
    const strM = pm({ color: '#b9b0a0', metalness: 0.95, roughness: 0.32 }), coil = new THREE.Group(); coil.position.set(-0.25, 0.002, 0.2); guitar.add(coil);
    [[0.052, 0, 0, 0.02], [0.048, 0.004, 0.003, -0.03], [0.055, -0.003, 0.002, 0.05], [0.044, 0.002, -0.004, 0], [0.05, -0.002, 0.004, -0.06], [0.058, 0.003, 0.001, 0.03]].forEach(([r, x, z, tilt], i) => add(coil, new THREE.TorusGeometry(r, i < 3 ? 0.0009 : 0.0005, 5, 40), strM, x, 0.001 + i * 0.0006, z, [Math.PI / 2 + tilt, tilt, i]));
    cord(coil, [[0.05, 0.002, 0], [0.075, 0.004, 0.02], [0.1, 0.002, 0.012], [0.118, 0.001, 0.03]], 0.0006, strM, 24); // one end sprung loose
    // a steel parts dish with the two knobs and the screws in it, and the screwdriver beside it
    const dish = new THREE.Group(); dish.position.set(0.2, 0, -0.13); guitar.add(dish);
    add(dish, new THREE.LatheGeometry([[0, 0.0012], [0.034, 0.0012], [0.047, 0.006], [0.052, 0.013], [0.054, 0.013]].map((q) => new THREE.Vector2(...q)), 36), pm({ color: '#9aa1a4', metalness: 0.95, roughness: 0.5, side: THREE.DoubleSide }), 0, 0, 0);
    const kA = A.cut('knobA'), kB = A.cut('knobB'); kA.rotation.x = -Math.PI / 2; kA.position.set(-0.012, 0.0095, 0.008); kB.rotation.set(0, 0.6, Math.PI / 2 + 0.25); kB.position.set(0.016, 0.0125, -0.012); dish.add(kA, kB); // one on its base, one on its side
    for (const [x, z, a] of [[0.005, 0.026, 0.3], [-0.024, -0.016, 1.9], [0.027, 0.012, 2.7], [-0.004, -0.028, 0.9]]) add(dish, new THREE.CylinderGeometry(0.0011, 0.0011, 0.011, 6), steel, x, 0.0026, z, [Math.PI / 2, 0, a]);
    const drv = new THREE.Group(); drv.position.set(0.12, 0.011, 0.02); drv.rotation.y = -0.9; guitar.add(drv);
    add(drv, new THREE.CylinderGeometry(0.011, 0.0095, 0.085, 10), new THREE.MeshStandardMaterial({ color: '#9c3220', roughness: 0.42 }), 0, 0, 0.0425, [Math.PI / 2, 0, 0]);
    add(drv, new THREE.CylinderGeometry(0.0024, 0.0024, 0.1, 8), steel, 0, -0.004, -0.05, [Math.PI / 2, 0, 0]);
    guitar.position.set(GTR.x, GTR.top, GTR.z); guitar.rotation.y = GTR.yaw * Math.PI / 180; scene.add(guitar);
  }

  // ---- the turntable on the GAS drum, a record turning on it, cabled to a combo amp on the floor by the bench ----
  // (Dan 2026-11-15: a DJ's record deck "on top of the barrel, the gas barrel, and run cables and connect it to a back something over there")
  // The deck is the one on the room's vinyl cabinet (N31) lifted off it; the amp is the room's combo amp (R02) again.
  const DJ = { drum: 'N06', yaw: -22, amp: { x: 2.43 + O.x, z: 7.9 + O.z, yaw: -96 }, strip: { x: 1.93, z: 8.36, yaw: 24 } };
  let platter = null;
  if (R.items.some((i) => i.id === DJ.drum && i.obj)) {
    const drum = R.items.find((i) => i.id === DJ.drum), db = new THREE.Box3().setFromObject(drum.obj), dc = db.getCenter(V());
    const Od = { x: dc.x - 2.2, z: dc.z - 8.815 }, W = (x, y, z) => V(x + Od.x, y, z + Od.z); // (the leads' way across the floor was laid out with the drum at 2.2, 8.815: it goes with the drum)
    const lid = new THREE.Raycaster(V(dc.x, db.max.y + 1, dc.z), V(0, -1, 0)).intersectObject(drum.obj, true)[0], lidY = lid ? lid.point.y : db.max.y; // (a drum's lid sits a little under its rim)
    // -- the deck: the cabinet's pieces above its top (plate, platter with its record, arm), on a plinth of the cabinet's own walnut --
    let n31, walnut; (await gltf('vinyl-cabinet')).traverse((m) => { if (!m.isMesh) return; if (m.material.name === 'n31') n31 = m; else walnut = m.material; });
    pm(n31.material); if (n31.material.map) n31.material.map.anisotropy = 8;
    const T = apart(n31).sort((b, s) => (b.min.y > 0.425 && b.max.y < 0.5 && b.max.x < 0.05 ? (s.x > 0.25 && s.y > 0.03 ? 'platter' : 'deck') : null));
    const PL = 0.07, tt = new THREE.Group(), tm = new THREE.Group(); tm.position.set(0.17, PL - 0.43, -0.02); tt.add(tm); // (the plate's middle is at -0.17, 0.02 in the cabinet's model, its underside at 0.43)
    platter = T.cut('platter'); tm.add(T.cut('deck'), platter);
    add(tt, new RoundedBoxGeometry(0.43, PL, 0.34, 3, 0.008), walnut || new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: 0.6 }), 0, PL / 2 + 0.006, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(tt, new THREE.CylinderGeometry(0.02, 0.022, 0.012, 14), new THREE.MeshStandardMaterial({ color: '#0d0d0e', roughness: 0.85 }), sx * 0.17, 0.006, sz * 0.13);
    // a label of its own on the record, off-round on purpose: a turning record shows only by what is not the same all the way round
    const lab = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#9a2d1c'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
      g.fillStyle = '#e2d6b6'; g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 126, -0.5, 0.35); g.closePath(); g.fill(); g.fillStyle = '#9a2d1c'; g.beginPath(); g.arc(128, 128, 62, 0, 7); g.fill();
      g.fillStyle = '#e2d6b6'; g.font = '400 40px "Bebas Neue", "Arial Narrow", sans-serif'; g.textAlign = 'center'; g.fillText('REVAUDIO', 128, 92); g.font = '400 20px "Bebas Neue", "Arial Narrow", sans-serif'; g.fillText('SIDE A · 33', 128, 178);
      g.fillStyle = '#0a0808'; g.beginPath(); g.arc(128, 128, 9, 0, 7); g.fill(); return c; })()); lab.colorSpace = THREE.SRGBColorSpace;
    const top = platter.geometry.boundingBox.max.y - platter.geometry.boundingBox.getCenter(V()).y, lm = add(platter, new THREE.CircleGeometry(0.05, 40), new THREE.MeshStandardMaterial({ map: lab, roughness: 0.7 }), 0, top + 0.0006, 0, [-Math.PI / 2, 0, 0]); lm.castShadow = false;
    (R.modelAnims ||= []).push({ o: platter, axis: 'y', speed: -3.49 }); // 33 1/3 turns a minute, the way a record turns
    tt.position.set(dc.x, lidY, dc.z); tt.rotation.y = DJ.yaw * Math.PI / 180; scene.add(tt); tt.updateMatrixWorld(true);
    // -- the amp, its face to the aisle, its back to the bench --
    const amp = await gltf('combo-amp'); amp.traverse((m) => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; pm(m.material); if (m.material.emissive && m.material.emissive.getHex()) glowOf(m.material); } }); // (its pilot light comes on with the room's gear)
    amp.position.set(DJ.amp.x, 0, DJ.amp.z); amp.rotation.y = DJ.amp.yaw * Math.PI / 180; scene.add(amp); amp.updateMatrixWorld(true);
    // -- a power strip on the floor between them, on an orange extension lead that runs off down the aisle --
    const strip = new THREE.Group(); strip.position.set(DJ.strip.x + Od.x, 0, DJ.strip.z + Od.z); strip.rotation.y = DJ.strip.yaw * Math.PI / 180; scene.add(strip);
    add(strip, new RoundedBoxGeometry(0.26, 0.04, 0.055, 2, 0.006), new THREE.MeshStandardMaterial({ color: '#cfc5aa', roughness: 0.6 }), 0, 0.02, 0);
    for (const x of [-0.07, -0.02, 0.03]) add(strip, new THREE.BoxGeometry(0.03, 0.002, 0.03), new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.7 }), x, 0.041, 0);
    glowOf(add(strip, new THREE.BoxGeometry(0.022, 0.006, 0.014), new THREE.MeshStandardMaterial({ color: '#b3261a', emissive: '#ff3a1c', emissiveIntensity: 1.6, roughness: 0.4 }), 0.095, 0.042, 0).material);
    strip.updateMatrixWorld(true);
    // -- the leads (world: the floor is y 0) --
    const at = (o, x, y, z) => o.localToWorld(V(x, y, z)), F = 0.006;
    const cream = new THREE.MeshStandardMaterial({ color: '#cdbf9e', roughness: 0.75 }), black = new THREE.MeshStandardMaterial({ color: '#141312', roughness: 0.6 }), orange = new THREE.MeshStandardMaterial({ color: '#c4601c', roughness: 0.65 });
    const rimTo = (x, z, out = 0) => { const d = V(x - dc.x, 0, z - dc.z).normalize(), r = (db.max.x - db.min.x) / 2 + out; return V(dc.x + d.x * r, 0, dc.z + d.z * r); }; // the point of the drum's rim towards (x, z)
    // the signal lead: out of the deck's back, a slack loop on the lid, over the rim, down to the floor, across it in a lazy S and up the amp's face to its input
    const jack = at(amp, -0.2, 0.69, 0.115), r1 = rimTo(2.0 + Od.x, 8.0 + Od.z), r1o = rimTo(2.0 + Od.x, 8.0 + Od.z, 0.02);
    cord(scene, [at(tt, 0.13, PL * 0.6, -0.172), at(tt, 0.16, 0.012, -0.26), at(tt, 0.02, 0.008, -0.31), at(tt, -0.14, 0.008, -0.27), V(r1.x, db.max.y + 0.006, r1.z), V(r1o.x, 0.55, r1o.z), V(r1o.x - 0.02, 0.05, r1o.z - 0.03), W(2.02, F, 8.2), W(1.9, F, 8.02), W(2.02, F, 7.86), V(jack.x - 0.1, F, jack.z + 0.03), V(jack.x - 0.035, 0.3, jack.z + 0.01), V(jack.x - 0.02, jack.y - 0.03, jack.z), jack], 0.0045, cream, 140);
    add(scene, new THREE.CylinderGeometry(0.007, 0.007, 0.03, 10), steel, jack.x - 0.008, jack.y, jack.z, [0, 0, Math.PI / 2]); // its plug
    // the deck's and the amp's mains leads to the strip, and the orange lead away
    const s1 = at(strip, -0.07, 0.045, 0), s2 = at(strip, 0.03, 0.045, 0), r2 = rimTo(DJ.strip.x + Od.x, DJ.strip.z + Od.z), r2o = rimTo(DJ.strip.x + Od.x, DJ.strip.z + Od.z, 0.02), ab = at(amp, 0.24, 0.1, -0.175);
    cord(scene, [at(tt, -0.12, PL * 0.5, -0.172), at(tt, -0.2, 0.01, -0.25), V(r2.x, db.max.y + 0.005, r2.z), V(r2o.x, 0.5, r2o.z), V(r2o.x - 0.03, 0.03, r2o.z - 0.02), V((r2o.x + s1.x) / 2 - 0.05, F, (r2o.z + s1.z) / 2 + 0.04), V(s1.x, 0.1, s1.z), s1], 0.0035, black, 90);
    cord(scene, [ab, V(ab.x + 0.02, F, ab.z + 0.1), W(2.3, F, 8.3), W(2.12, F, 8.28), V(s2.x + 0.03, 0.09, s2.z - 0.02), s2], 0.0035, black, 70);
    const e0 = at(strip, -0.13, 0.02, 0);
    cord(scene, [e0, V(e0.x - 0.08, F + 0.002, e0.z - 0.03), W(1.72, F + 0.002, 8.42), W(1.6, F + 0.002, 8.75), W(1.69, F + 0.002, 9.1), W(1.58, F + 0.002, 9.45), W(1.66, F + 0.002, 9.85), W(1.6, F + 0.002, 10.3)], 0.0055, orange, 120);
  }

  // ---- the second fan: the room's own ceiling fan again, over the bench (N40 stays where it hangs). Dan's pick 2026-11-16: a second fan, NOT moving N40 ----
  let fan2 = null;
  {
    const src = R.items.find((i) => i.id === 'N40');
    if (src && src.obj) {
      // (clone() copies userData through JSON, and the room's point back at their item: set aside for the copy)
      const kept = []; src.obj.traverse((m) => { kept.push([m, m.userData]); m.userData = {}; });
      fan2 = src.obj.clone(true); for (const [m, u] of kept) m.userData = u;
      fan2.position.x = SET.fan.x + O.x; fan2.position.z = SET.fan.z + O.z;
      fan2.traverse((m) => { if (m.isMesh) m.castShadow = false; }); // the room's shadows are drawn once: a still blade shadow under a turning fan would lie
      scene.add(fan2);
      const rotor = fan2.getObjectByName('fan_rotor'); if (rotor) { fan2.userData.rotor = rotor; (R.modelAnims ||= []).push({ o: rotor, axis: 'y', speed: 2 }); }
    }
  }

  return { THREE, screen: S, place: SET.phone, phone, looks: Object.keys(LOOKS), setLook, get look() { return look; }, fan2, platter, guitar };
}
