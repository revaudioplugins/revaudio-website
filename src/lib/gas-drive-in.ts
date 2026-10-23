/* GAS drive-in — the page-terminus moment: a cel-shaded muscle car slides in
   off the desert highway, power-slides 90°, drives at the viewer and stops
   nose-on with NEED GAS? on the plate; an email form rolls out from under the
   bumper.

   Ported from the take-5 bench (src/pages/gasmock.astro, git-excluded) on
   2026-08-09 — the bench stays as the tuning rig, this is the shipped copy.
   Everything below is the bench verbatim EXCEPT: the lab controls are gone,
   the end-frame numbers Dan locked are baked in as constants, and a
   reduced-motion path renders the parked end frame once instead of driving.

   Architecture (why it looks alive without a mountain of keyframes): only the
   PATH is authored — x(t), z(t), yaw(t) with slope-matched CustomEases.
   Everything else derives live per frame:
   - accelerations (finite diff + lowpass) drive damped 2nd-order springs, so
     brake dive, throttle squat, outboard lean and the post-stop settle all
     emerge rather than being hand-keyed (research §6: 1.3–2.2 Hz, ζ≈0.3).
   - wheels spin from ground speed; the rear pair over-spins in the slide.
   - front wheels counter-steer by aiming at the velocity vector.
   - slip angle (velocity dir vs heading) drives smoke AND world-space skid
     marks, so the parked frame keeps the story on the tarmac.
   - physics clock = timeline time, so any timeScale stays consistent.

   This module is loaded DYNAMICALLY by GasDriveIn.astro once the section is
   within ~a viewport of the fold — three.js and the GLB are the heaviest
   things on the site and must not sit in the homepage's critical bundle. */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CustomEase } from 'gsap/CustomEase';
import { gsap, ScrollTrigger, EASE_ACCENT } from './motion';

export function initGasDriveIn(root: HTMLElement, opts: { reduced?: boolean } = {}): void {
  gsap.registerPlugin(CustomEase);

  const roadEl = root.querySelector<HTMLElement>('[data-gas-road]')!;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-gas-canvas]')!;
  const plateEl = root.querySelector<HTMLElement>('[data-gas-plate]')!;
  const pumpEl = root.querySelector<HTMLElement>('[data-gas-pump]')!;
  const pumpInner = root.querySelector<HTMLElement>('[data-gas-pump-inner]')!;
  const glows = Array.from(root.querySelectorAll<HTMLElement>('[data-gas-glow]'));
  const smokeEl = root.querySelector<HTMLElement>('[data-gas-smoke]')!;

  const CAR_LEN = 4; // 1 u ≈ 1.25 m
  const DEG = Math.PI / 180;
  const T_STOP = 3.012;
  const T_END = 4.7; // dummy tail keeps the physics clock running through the settle
  /* end-frame tuning — LOCKED by Dan on the bench, 2026-08-05 (bench sliders
     "close / aim / cam"). Change these on the bench first, then copy here. */
  const Z_END = 4.18, TGT_Y_END = 0.48, CAM_Y_END = 0.3;
  /* narrow stages can't hold Dan's face-full stop — the car would crop hard
     left/right. Pull the stop back just enough for ~1.9 u of visible width;
     on the desktop band this returns Z_END untouched. */
  let endZ = () => Z_END; // real impl after the camera exists

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  endZ = () => {
    const fit = 7.13 - CAR_LEN / 2 - Math.max(0.95, 1.9 / (2 * Math.tan(17 * DEG) * camera.aspect));
    return Math.min(Z_END, fit);
  };

  // House light: warm amber key upper-left, cream fill + rim, no blue.
  scene.add(new THREE.AmbientLight(0x3a2f24, 1.5));
  const key = new THREE.DirectionalLight(0xffc978, 3.0);
  key.position.set(-4, 5, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xf2e2c4, 0.85);
  fill.position.set(3, 2, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xf2e2c4, 1.0);
  rim.position.set(0, 3, -5);
  scene.add(rim);

  /* ── cel look: 3-step toon ramp (Borderlands house line) ── */
  const gradientMap = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat);
  gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  const toon = (color: number, emissive = 0) =>
    new THREE.MeshToonMaterial({ color, gradientMap, emissive, emissiveIntensity: emissive ? 1 : 0 });

  /* ── desert-dusk scene: sky, half-set sun, mesas, sand, the highway the
     car arrives on, poles, saguaros. Unlit silhouette flats (a cel matte
     painting) except the cacti, which take the toon light. ── */
  const flat = (color: number) => new THREE.MeshBasicMaterial({ color });
  const skyTex = (() => {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 256;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#0e0b09');
    grad.addColorStop(0.55, '#221510');
    grad.addColorStop(0.8, '#47281a');
    grad.addColorStop(0.93, '#7a4527');
    grad.addColorStop(1, '#9c5c2e');
    g.fillStyle = grad;
    g.fillRect(0, 0, 2, 256);
    return new THREE.CanvasTexture(c);
  })();
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(200, 14), new THREE.MeshBasicMaterial({ map: skyTex }));
  sky.position.set(0, 6, -28);
  scene.add(sky);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), flat(0xe0a35c));
  sun.position.set(-5, 0.35, -27.8);
  scene.add(sun);
  // mesas — flat-topped silhouettes in two tones for depth
  ([[-14, 2.6, 10, 0x1a120c], [-2, 1.8, 7, 0x170f0a], [9, 3.2, 12, 0x1a120c], [18, 1.4, 6, 0x170f0a]] as [number, number, number, number][]).forEach(([x, h, w, col]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2), flat(col));
    m.position.set(x, h / 2, -22);
    scene.add(m);
  });
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(84, 0.5, 1.5), flat(0x20160e));
  ridge.position.set(0, 0.25, -14);
  scene.add(ridge);
  // sand, then the highway strip running along x with cream dashes
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(200, 70), flat(0x251a11));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, -0.01, -5);
  scene.add(sand);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(90, 2.6), flat(0x191411));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.002, -0.4);
  scene.add(road);
  for (let x = -38; x <= 28; x += 5.2) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.1), new THREE.MeshBasicMaterial({ color: 0xd8c9a8, transparent: true, opacity: 0.55 }));
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x, 0.004, -0.4);
    scene.add(dash);
  }
  // telephone poles receding along the far shoulder
  [-16, -8.5, -1, 6.5, 14].forEach((x) => {
    const pole = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.6, 0.09), flat(0x17100c));
    post.position.y = 1.3;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.07, 0.07), flat(0x17100c));
    bar.position.y = 2.3;
    pole.add(post, bar);
    pole.position.set(x, 0, -2.4);
    scene.add(pole);
  });
  // saguaros — mid-ground, lit
  const cactusMat = toon(0x2a3319);
  const saguaro = (x: number, z: number, s: number) => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.5, 8), cactusMat);
    trunk.position.y = 0.75;
    g.add(trunk);
    ([[-1, 0.55], [1, 0.8]] as [number, number][]).forEach(([side, h]) => {
      const elbow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.08), cactusMat);
      elbow.position.set(side * 0.17, h, 0);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.5, 8), cactusMat);
      arm.position.set(side * 0.26, h + 0.25, 0);
      g.add(elbow, arm);
    });
    g.scale.setScalar(s);
    g.position.set(x, 0, z);
    scene.add(g);
  };
  saguaro(-9, -7, 1.1);
  saguaro(-3.5, -10, 1.4);
  saguaro(4.2, -8, 0.9);
  saguaro(10, -6.5, 1.25);

  /* rig = path (x/z + yaw). car = sprung body. Wheels are unsprung → rig. */
  const rig = new THREE.Group();
  scene.add(rig);
  const car = new THREE.Group();
  rig.add(car);

  /* ── the primitive muscle car (+X = nose) — cel bodywork with inverted-
     hull ink outlines. Shows until the GLB below lands, then only the
     VISUALS swap; the rig, physics and anchors are untouched. ── */
  const RED = 0xc22820, DARK = 0x1c1512, GLASS = 0x241a14, CREAM = 0xe8dcc2, CHROME = 0xc9c2b6;
  const inkMat = new THREE.MeshBasicMaterial({ color: 0x0d0a08, side: THREE.BackSide });
  const INK_T = 0.035; // outline thickness in scene units, even on every axis
  const ink = (m: THREE.Mesh, w: number, h: number, d: number) => {
    const sh = new THREE.Mesh(m.geometry, inkMat);
    sh.position.copy(m.position);
    sh.rotation.copy(m.rotation);
    sh.scale.set(1 + INK_T / w, 1 + INK_T / h, 1 + INK_T / d);
    m.parent!.add(sh);
  };
  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, rz = 0, outline = false) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.z = rz;
    car.add(m);
    if (outline) ink(m, w, h, d);
    return m;
  };
  const bodyMat = toon(RED);
  box(4.0, 0.5, 1.5, bodyMat, 0, 0.55, 0, 0, true);              // body slab
  box(0.7, 0.14, 1.66, bodyMat, 1.25, 0.71, 0, 0, true);         // front fender flares
  box(0.7, 0.14, 1.66, bodyMat, -1.02, 0.71, 0, 0, true);        // rear fender flares
  box(1.58, 0.07, 1.42, bodyMat, 1.22, 0.845, 0, -0.065, true);  // hood, sloping to the nose
  box(0.45, 0.1, 0.34, bodyMat, 1.05, 0.92, 0, -0.065, true);    // hood scoop
  [-0.13, 0.13].forEach((z) => box(1.56, 0.02, 0.13, toon(CREAM), 1.22, 0.9, z, -0.065)); // racing stripes
  box(1.05, 0.34, 1.26, toon(GLASS), -0.5, 0.97, 0, 0, true);    // glasshouse
  box(0.62, 0.05, 1.28, toon(GLASS), 0.175, 1.0, 0, -0.47, true); // windshield
  box(1.0, 0.06, 1.3, bodyMat, -0.55, 1.17, 0, 0, true);         // roof
  box(0.96, 0.05, 1.32, bodyMat, -1.5, 0.96, 0, 0.342, true);    // fastback slope
  box(0.06, 0.3, 1.12, toon(DARK), 2.0, 0.62, 0, 0, true);       // tall grille — THE front tell
  [0.53, 0.62, 0.71].forEach((y) => box(0.02, 0.025, 1.06, toon(CHROME), 2.035, y, 0)); // grille bars
  box(0.1, 0.12, 1.58, toon(CHROME), 2.02, 0.42, 0, 0, true);    // chrome bumper
  box(0.04, 0.26, 0.52, toon(CREAM), 2.08, 0.44, 0);             // plate mounted proud of the bumper
  box(0.05, 0.1, 1.2, toon(0x7a1010, 0x3a0505), -2.01, 0.6, 0);  // taillight strip — the rear tell
  const lensMats: THREE.MeshToonMaterial[] = [];
  [-0.55, 0.55].forEach((z) => {
    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.04, 14), toon(CHROME));
    bezel.rotation.z = Math.PI / 2;
    bezel.position.set(2.0, 0.72, z);
    car.add(bezel);
    const mat = toon(CREAM, 0xffd68c);
    lensMats.push(mat);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.07, 14), mat);
    l.rotation.z = Math.PI / 2;
    l.position.set(2.03, 0.72, z);
    car.add(l);
  });
  [-0.45, 0.45].forEach((z) => {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 10), toon(CHROME));
    ex.rotation.z = Math.PI / 2;
    ex.position.set(-2.02, 0.22, z);
    car.add(ex);
  });

  /* wheels: spin group (rotation.z = roll) inside a steer group (front only) */
  let WHEEL_R = 0.32;
  const tireMat = toon(0x141010), hubMat = toon(CREAM), spokeMat = toon(0xb08c4f);
  const makeWheel = () => {
    const spin = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.24, 18), tireMat);
    tire.rotation.x = Math.PI / 2;
    const tireInk = new THREE.Mesh(tire.geometry, inkMat);
    tireInk.rotation.x = Math.PI / 2;
    tireInk.scale.set(1 + INK_T / (2 * WHEEL_R), 1 + INK_T / 0.24, 1 + INK_T / (2 * WHEEL_R));
    spin.add(tireInk);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.26, 12), hubMat);
    hub.rotation.x = Math.PI / 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.055, 0.27), spokeMat); // makes spin readable
    spin.add(tire, hub, spoke);
    return spin;
  };
  const TIRE: Record<string, [number, number, number]> = {
    RL: [-1.02, WHEEL_R, -0.66], RR: [-1.02, WHEEL_R, 0.66],
    FL: [1.25, WHEEL_R, -0.66], FR: [1.25, WHEEL_R, 0.66],
  };
  const rearWheels = (['RL', 'RR'] as const).map((k) => {
    const w = makeWheel();
    w.position.set(...TIRE[k]);
    rig.add(w);
    return w;
  });
  const steerGroups = (['FL', 'FR'] as const).map((k) => {
    const g = new THREE.Group();
    g.position.set(...TIRE[k]);
    const w = makeWheel();
    g.add(w);
    rig.add(g);
    return { g, w };
  });

  /* DOM overlay anchors (car-local) — the GLB swap retargets these */
  const ANCHOR = {
    plate: new THREE.Vector3(2.08, 0.44, 0),
    plateHW: 0.26, // plate half-width, sizes the DOM text box
    glowX: 2.06, glowY: 0.72, glowZ: 0.55,
    formY: 0.34, // pump-form hang height on the static rig
  };

  /* ── REAL CAR: take-5 option C printed to 3D (multi_image_to_3d, textured).
     The GLB is one fused mesh, so the wheels are cut out geometrically:
     mesh-space facts measured offline (python vertex clustering) — nose=−X,
     length 1.899, ground y=−0.3095, front axle x=−0.5845, rear x=+0.5245,
     tire r≈0.14, tire+rim band |z|=0.24..0.392. After the bake below
     (rotate π about Y so nose=+X, scale to CAR_LEN, lift ground to y=0)
     those become the cylinder tests in rig units. ── */
  new GLTFLoader().load('/models/gas-car5.glb', (gltf) => {
    let src: THREE.Mesh | null = null;
    gltf.scene.traverse((o) => { if (!src && (o as THREE.Mesh).isMesh) src = o as THREE.Mesh; });
    if (!src) return;
    const S = CAR_LEN / 1.899;
    const geo = (src as THREE.Mesh).geometry.clone();
    const bake = new THREE.Matrix4().makeScale(S, S, S).multiply(new THREE.Matrix4().makeRotationY(Math.PI));
    bake.setPosition(0, 0.3095 * S, 0);
    geo.applyMatrix4(bake);

    // wheel cylinders in baked units (axis along z)
    const HUB_Y = 0.14 * S, CUT_R = 0.156 * S, Z_IN = 0.237 * S, Z_OUT = 0.392 * S;
    const AXLE_X = { F: 0.5845 * S, R: -0.5245 * S };
    const TRACK_Z = 0.327 * S;
    const pos = geo.attributes.position;
    const idx = geo.index!;
    const wheelOf = (vi: number): string | null => {
      const x = pos.getX(vi), y = pos.getY(vi), z = pos.getZ(vi);
      const az = Math.abs(z);
      if (az < Z_IN || az > Z_OUT) return null;
      for (const [fk, ax] of [['F', AXLE_X.F], ['R', AXLE_X.R]] as [string, number][]) {
        const dx = x - ax, dy = y - HUB_Y;
        if (dx * dx + dy * dy < CUT_R * CUT_R) return fk + (z < 0 ? 'L' : 'R');
      }
      return null;
    };
    const buckets: Record<string, number[]> = { body: [], FL: [], FR: [], RL: [], RR: [] };
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
      const wa = wheelOf(a);
      const bucketKey = wa && wa === wheelOf(b) && wa === wheelOf(c) ? wa : 'body';
      buckets[bucketKey].push(a, b, c);
    }

    // inflated positions for the inverted-hull ink (normal offset, one bake)
    const nrm = geo.attributes.normal;
    const inkPos = new THREE.BufferAttribute(new Float32Array(pos.array as Float32Array), 3);
    const INK_D = 0.016;
    for (let i = 0; i < pos.count; i++) {
      inkPos.setXYZ(i, pos.getX(i) + nrm.getX(i) * INK_D, pos.getY(i) + nrm.getY(i) * INK_D, pos.getZ(i) + nrm.getZ(i) * INK_D);
    }
    const subGeo = (indices: number[], attr: THREE.BufferAttribute) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', attr);
      g.setAttribute('normal', nrm);
      g.setAttribute('uv', geo.attributes.uv);
      g.setIndex(indices);
      return g;
    };
    const srcMat = (src as THREE.Mesh).material as THREE.MeshStandardMaterial;
    const carMat = new THREE.MeshToonMaterial({ map: srcMat.map, gradientMap });

    // body swap
    car.clear();
    car.add(new THREE.Mesh(subGeo(buckets.body, pos), carMat));
    car.add(new THREE.Mesh(subGeo(buckets.body, inkPos), inkMat));

    // wheel swap — keep the spin/steer group structure, retarget positions
    WHEEL_R = 0.14 * S;
    const newTire: Record<string, [number, number, number]> = {
      RL: [AXLE_X.R, HUB_Y, -TRACK_Z], RR: [AXLE_X.R, HUB_Y, TRACK_Z],
      FL: [AXLE_X.F, HUB_Y, -TRACK_Z], FR: [AXLE_X.F, HUB_Y, TRACK_Z],
    };
    (Object.keys(newTire) as (keyof typeof newTire)[]).forEach((k) => { TIRE[k] = newTire[k]; });
    const dressWheel = (spin: THREE.Group, k: string) => {
      spin.clear();
      const [ax, ay, az] = TIRE[k];
      const m = new THREE.Mesh(subGeo(buckets[k], pos), carMat);
      m.position.set(-ax, -ay, -az);
      const ik = new THREE.Mesh(subGeo(buckets[k], inkPos), inkMat);
      ik.position.copy(m.position);
      spin.add(m, ik);
    };
    (['RL', 'RR'] as const).forEach((k, i) => {
      rearWheels[i].position.set(...TIRE[k]);
      dressWheel(rearWheels[i], k);
    });
    (['FL', 'FR'] as const).forEach((k, i) => {
      steerGroups[i].g.position.set(...TIRE[k]);
      dressWheel(steerGroups[i].w, k);
    });

    // overlay anchors onto the GLB's real nose. Plate face measured from the
    // mesh: center (−0.909, −0.146), half-width 0.070 → baked units below.
    ANCHOR.plate.set(0.909 * S, 0.1635 * S, 0);
    ANCHOR.plateHW = 0.07 * S;
    ANCHOR.glowX = 1.98; ANCHOR.glowY = 0.66; ANCHOR.glowZ = 0.63;
    ANCHOR.formY = 0.25; // hang just under the baked plate's bottom edge

    // reduced motion never starts a ticker, so the swap has to repaint itself
    if (opts.reduced) renderParked();
  });

  const radialTex = (stops: [number, string][]) => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 6, 64, 64, 62);
    stops.forEach(([o, col]) => grad.addColorStop(o, col));
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  };

  // contact shadow blob — stretches with speed, rides the rig
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(CAR_LEN * 1.15, CAR_LEN * 0.55),
    new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.01;
  rig.add(blob);

  /* static tarmac scuffs — ground parallax reference (research §8.3) */
  const scuffTex = (() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.35, 'rgba(8,6,5,0.55)');
    grad.addColorStop(0.65, 'rgba(8,6,5,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.filter = 'blur(6px)';
    g.fillStyle = grad;
    g.fillRect(0, 12, 256, 40);
    return new THREE.CanvasTexture(c);
  })();
  [
    { x: -6.2, z: -0.9, r: 0.12, w: 1.5, o: 0.22 },
    { x: -3.4, z: 0.3, r: -0.25, w: 1.1, o: 0.16 },
    { x: -1.2, z: -1.1, r: 0.05, w: 1.7, o: 0.2 },
    { x: 0.8, z: 0.9, r: 0.9, w: 1.2, o: 0.18 },
    { x: 2.1, z: -0.2, r: -0.5, w: 0.9, o: 0.14 },
    { x: -8.6, z: 0.8, r: 0.3, w: 1.3, o: 0.15 },
  ].forEach((s) => {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(s.w, s.w * 0.22),
      new THREE.MeshBasicMaterial({ map: scuffTex, transparent: true, opacity: s.o, depthWrite: false })
    );
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = s.r;
    p.position.set(s.x, 0.005, s.z);
    scene.add(p);
  });

  /* dynamic skid marks — deposited in WORLD space wherever tires slip */
  const marks: THREE.Group[] = [];
  let markElev = 0;
  const dropMark = (wx: number, wz: number, ang: number, len: number, wid: number, op: number) => {
    const g = new THREE.Group();
    g.rotation.y = ang;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(len, wid),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: op, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    g.add(m);
    markElev = (markElev + 1) % 500;
    g.position.set(wx, 0.007 + markElev * 0.00001, wz);
    scene.add(g);
    marks.push(g);
    if (marks.length > 420) scene.remove(marks.shift()!);
  };
  const clearMarks = () => { marks.splice(0).forEach((m) => scene.remove(m)); };

  /* ── pose proxy: GSAP tweens x/z/yaw + camera; physics derives the rest ── */
  const pose = {
    x: -15, z: -0.4, yaw: 0,
    camY: 0.72, camZ: 7.2, tgtX: -2.0, tgtY: 0.5, tgtZ: -0.6,
  };

  /* physics state — all driven from the pose deltas in SHOT time */
  let prevX = pose.x, prevZ = pose.z, prevT = 0;
  let speed = 0, aLong = 0, aLat = 0, slip = 0, steer = 0;
  let pvx = 0, pvz = 0;
  let wheelSpin = 0, frontSpin = 0;
  let smokeAcc = 0, skidAcc = 0, brakeAcc = 0, chirpAcc = 0;
  let idleAmp = 0; // V8 idle lope, eased in after the stop
  let wallT = 0; // real clock — idle + exhaust keep living after the timeline ends
  let exhAcc = 0.8, exhSide = 1;
  let joltT0 = -1, done = false, stopped = false;
  const sPitch = { p: 0, v: 0 }, sRoll = { p: 0, v: 0 }, sHeave = { p: 0, v: 0 };
  const spring = (s: { p: number; v: number }, target: number, hz: number, zeta: number, dt: number) => {
    const w = 2 * Math.PI * hz;
    s.v += (w * w * (target - s.p) - 2 * zeta * w * s.v) * dt;
    s.p += s.v * dt;
  };
  const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  const RAKE = -1.0; // static muscle-car nose-down, deg

  /* road jitter bands (research §1.3) — speed-scaled, non-harmonic.
     Cut to ~5% of the original 08-05 per Dan: "shake less… like 90% less". */
  const BANDS = {
    heave: [[0.00045, 1.35, 0.7], [0.00018, 11.5, 2.1], [0.0001, 7.3, 4.4]],
    yaw: [[0.028, 0.9, 5.1], [0.011, 2.3, 1.8]],
    wander: [[0.0015, 0.75, 3.2]],
  };
  const band = (rows: number[][], t: number, s: number) =>
    rows.reduce((a, [A, f, ph]) => a + s * A * Math.sin(2 * Math.PI * f * t + ph), 0);

  /* slope-matched joins (research §6.1) — velocity never jumps */
  CustomEase.create('e2brake', 'M0,0 C0.333,0.397 0.667,0.731 1,1');
  CustomEase.create('slideX', 'M0,0 C0.333,0.528 0.667,0.896 1,1');
  CustomEase.create('slideZ', 'M0,0 C0.333,0 0.667,0.268 1,1');
  CustomEase.create('approachZ', 'M0,0 C0.333,0.259 0.667,0.585 1,1');

  function resize() {
    const w = roadEl.clientWidth, h = roadEl.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', () => {
    resize();
    // the animated path repaints itself every frame; the parked frame doesn't
    if (opts.reduced) renderParked();
  });

  const v3 = new THREE.Vector3();
  const project = (wx: number, wy: number, wz: number) => {
    v3.set(wx, wy, wz).project(camera);
    return { x: (v3.x * 0.5 + 0.5) * roadEl.clientWidth, y: (-v3.y * 0.5 + 0.5) * roadEl.clientHeight };
  };
  const lp = new THREE.Vector3();
  const projectLocal = (obj: THREE.Object3D, x: number, y: number, z: number) => {
    lp.set(x, y, z).applyMatrix4(obj.matrixWorld).project(camera);
    return { x: (lp.x * 0.5 + 0.5) * roadEl.clientWidth, y: (-lp.y * 0.5 + 0.5) * roadEl.clientHeight };
  };

  /* live plate text + headlight glows — anchored to the car's real matrix */
  function placePlate() {
    car.updateMatrixWorld(true);
    const P = ANCHOR.plate;
    const pc = projectLocal(car, P.x + 0.03, P.y, P.z);
    const pl = projectLocal(car, P.x + 0.03, P.y, P.z - ANCHOR.plateHW);
    const pw = Math.abs(pc.x - pl.x) * 2;
    const ph = pw * 0.5;
    plateEl.style.left = `${pc.x - pw / 2}px`;
    plateEl.style.top = `${pc.y - ph / 2}px`;
    plateEl.style.width = `${pw}px`;
    plateEl.style.height = `${ph}px`;
    glows.forEach((g, i) => {
      const side = i === 0 ? -1 : 1;
      const p = projectLocal(car, ANCHOR.glowX, ANCHOR.glowY, side * ANCHOR.glowZ);
      const d = pw * 0.55;
      g.style.left = `${p.x - d / 2}px`;
      g.style.top = `${p.y - d / 2}px`;
      g.style.width = g.style.height = `${d}px`;
    });
    // the pump form hangs from the bumper line but anchors to the STATIC
    // rig, not the idling body — a form that wobbles while you type is wrong
    const pb = projectLocal(rig, 2.07, ANCHOR.formY, 0);
    const pe = projectLocal(rig, 2.07, ANCHOR.formY, -0.62);
    const fw = Math.abs(pb.x - pe.x) * 2;
    pumpEl.style.left = `${pb.x - fw / 2}px`;
    /* The band clips (it's a window), and under ~430px the form stacks into
       two rows — hanging it off the bumper there pushes the submit button
       past the bottom edge. Clamp so the form is always fully inside; on the
       desktop band there's slack and this changes nothing. */
    const maxTop = roadEl.clientHeight - pumpEl.offsetHeight - 4;
    pumpEl.style.top = `${Math.min(pb.y + 6, Math.max(0, maxTop))}px`;
    pumpEl.style.width = `${fw}px`;
  }

  /* smoke puffs — DOM, spawned at the tire's WORLD point, drift in world space */
  const puffW = new THREE.Vector3();
  const rnd = (base: number) => base * (0.65 + Math.random() * 0.7);
  function spawnPuff(tire: string, alpha: number, scale: number, life: number) {
    const [tx, ty, tz] = TIRE[tire];
    rig.updateMatrixWorld(true);
    puffW.set(tx, ty, tz).applyMatrix4(rig.matrixWorld);
    const at = project(puffW.x, puffW.y, puffW.z);
    const to = project(puffW.x + 0.35 * life, puffW.y + 0.3 * life, puffW.z + 0.15 * life);
    const el = document.createElement('i');
    el.className = 'puff';
    const base = 200 * scale;
    el.style.width = el.style.height = `${base}px`;
    el.style.left = `${at.x - base / 2}px`;
    el.style.top = `${at.y - base / 2}px`;
    smokeEl.appendChild(el);
    gsap.fromTo(el, { opacity: 0, scale: 1 }, { opacity: alpha, duration: 0.16, ease: 'power2.out' });
    gsap.to(el, { opacity: 0, duration: life * 0.85, ease: 'power1.in', delay: 0.16 + life * 0.15 });
    gsap.to(el, { scale: 3.2, duration: life, ease: 'power1.out' });
    gsap.to(el, { left: `${to.x - base / 2}px`, top: `${to.y - base / 2}px`, duration: life, ease: 'power1.out', onComplete: () => el.remove() });
  }

  /* idle exhaust — soft wisps curling out from under the rear corners */
  const exhW = new THREE.Vector3();
  function spawnExhaust(side: number, alpha: number, scale: number, life: number) {
    rig.updateMatrixWorld(true);
    exhW.set(-1.9, 0.14, side * 0.85).applyMatrix4(rig.matrixWorld);
    const at = project(exhW.x, exhW.y, exhW.z);
    exhW.set(-2.2, 0.6, side * 1.6).applyMatrix4(rig.matrixWorld);
    const to = project(exhW.x, exhW.y, exhW.z);
    const el = document.createElement('i');
    el.className = 'puff';
    const base = 200 * scale;
    el.style.width = el.style.height = `${base}px`;
    el.style.left = `${at.x - base / 2}px`;
    el.style.top = `${at.y - base / 2}px`;
    smokeEl.appendChild(el);
    gsap.fromTo(el, { opacity: 0, scale: 0.8 }, { opacity: alpha, duration: 0.3, ease: 'power2.out' });
    gsap.to(el, { opacity: 0, duration: life * 0.8, ease: 'power1.in', delay: 0.3 + life * 0.2 });
    gsap.to(el, { scale: 2.4, duration: life, ease: 'power1.out' });
    gsap.to(el, { left: `${to.x - base / 2}px`, top: `${to.y - base / 2}px`, duration: life, ease: 'power1.out', onComplete: () => el.remove() });
  }

  /* ── per-frame: derive physics from the path, compose, render ── */
  let tl: gsap.core.Timeline | null = null;
  let rendering = false;

  const resync = () => {
    prevX = pose.x; prevZ = pose.z;
    pvx = 0; pvz = 0; speed = 0; aLong = 0; aLat = 0; slip = 0;
  };

  const tick = () => {
    const dtr = Math.min(gsap.ticker.deltaRatio(60) / 60, 0.1);
    wallT += dtr;
    // idle exhaust keeps puffing for as long as the car sits there
    if (stopped) {
      exhAcc -= dtr;
      if (exhAcc <= 0) {
        exhAcc = 0.55 + Math.random() * 0.5;
        exhSide = -exhSide;
        spawnExhaust(exhSide, 0.15 + Math.random() * 0.08, 0.17 + Math.random() * 0.08, 2.0 + Math.random() * 0.8);
      }
    }
    const t = tl ? tl.time() : 0;
    let dts = t - prevT;
    prevT = t;
    if (dts < 0 || dts > 0.25) { resync(); dts = 0; }
    dts = Math.min(dts, 1 / 24);

    if (dts > 0) {
      const vx = (pose.x - prevX) / dts, vz = (pose.z - prevZ) / dts;
      prevX = pose.x; prevZ = pose.z;
      speed = Math.hypot(vx, vz);
      const k = 1 - Math.exp(-dts * 10);
      const rawAx = (vx - pvx) / dts, rawAz = (vz - pvz) / dts;
      pvx = vx; pvz = vz;
      // car frame: heading h, right r (R_y(yaw) maps +X → (cos, 0, −sin))
      const hx = Math.cos(pose.yaw), hz = -Math.sin(pose.yaw);
      const rx = Math.sin(pose.yaw), rz = Math.cos(pose.yaw);
      aLong += (rawAx * hx + rawAz * hz - aLong) * k;
      aLat += (rawAx * rx + rawAz * rz - aLat) * k;
      // slip: velocity direction vs heading (angles about Y: θ = atan2(−z, x))
      if (speed > 0.5) {
        const thV = Math.atan2(-vz, vx);
        slip += (wrap(thV - pose.yaw) - slip) * (1 - Math.exp(-dts * 14));
      } else {
        slip *= Math.exp(-dts * 6);
      }
      // suspension springs driven by acceleration (research §6: ~1.9 Hz, ζ≈0.3)
      spring(sPitch, RAKE + Math.max(-6, Math.min(4.5, 0.5 * aLong)), 1.9, 0.3, dts);
      spring(sRoll, Math.max(-6, Math.min(6, -0.45 * aLat)), 1.7, 0.3, dts);
      spring(sHeave, -Math.min(0.03, 0.0035 * (Math.abs(aLong) + 0.7 * Math.abs(aLat))), 1.6, 0.35, dts);
      // counter-steer: front wheels aim at the velocity vector
      const steerTarget = Math.max(-0.6, Math.min(0.6, slip)) * 0.9;
      steer += (steerTarget - steer) * (1 - Math.exp(-dts * 8));
      // wheel roll; rear over-spins while power-sliding
      const sliding = Math.abs(slip) > 0.22 && speed > 1.2;
      frontSpin += (speed * Math.cos(slip) / WHEEL_R) * dts;
      wheelSpin += (speed / WHEEL_R + (sliding ? 12 : 0)) * dts;

      // smoke — rate follows slip × speed; outside (left) rear carries ~2×
      if (!stopped && sliding) {
        smokeAcc += Math.min(26, 3 + speed * Math.abs(slip) * 2.6) * dts;
        while (smokeAcc >= 1) {
          smokeAcc--;
          const outer = slip > 0 ? 'RL' : 'RR';
          const tire = Math.random() < 0.62 ? outer : (outer === 'RL' ? 'RR' : 'RL');
          spawnPuff(tire, Math.min(0.52, rnd(tire === outer ? 0.42 : 0.24)), rnd(0.36), rnd(2.0));
        }
        // skid marks along the slide, one per ~0.12 u of travel
        skidAcc += speed * dts;
        if (skidAcc > 0.12) {
          skidAcc = 0;
          rig.updateMatrixWorld(true);
          const ang = Math.atan2(-pvz, pvx);
          (['RL', 'RR'] as const).forEach((tk) => {
            puffW.set(...TIRE[tk]).applyMatrix4(rig.matrixWorld);
            dropMark(puffW.x, puffW.z, ang, 0.34, 0.15, 0.3);
          });
        }
      }
      // front-tire chirp smoke under the final hard brake
      if (!stopped && aLong < -6 && speed > 2) {
        chirpAcc += 18 * dts;
        while (chirpAcc >= 1) {
          chirpAcc--;
          spawnPuff(Math.random() < 0.5 ? 'FL' : 'FR', rnd(0.2), rnd(0.24), rnd(1.1));
        }
      }
      // brake scuff under hard straight-line braking (front tires)
      if (!stopped && aLong < -4.5 && speed > 1.5 && Math.abs(slip) < 0.22) {
        brakeAcc += speed * dts;
        if (brakeAcc > 0.14) {
          brakeAcc = 0;
          rig.updateMatrixWorld(true);
          const ang = Math.atan2(-pvz, pvx);
          (['FL', 'FR'] as const).forEach((tk) => {
            puffW.set(...TIRE[tk]).applyMatrix4(rig.matrixWorld);
            dropMark(puffW.x, puffW.z, ang, 0.22, 0.12, 0.18);
          });
        }
      }
      // the stop: one jolt, headlights flash, then the springs settle
      if (!stopped && t > 2 && speed < 0.05) {
        stopped = true;
        joltT0 = t;
        lensMats.forEach((m) => {
          gsap.fromTo(m, { emissiveIntensity: 1 }, { emissiveIntensity: 2.6, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' });
          gsap.to(m, { emissiveIntensity: 1.6, delay: 0.26, duration: 0.5, ease: 'power1.out' });
        });
        gsap.fromTo(glows, { opacity: 0 }, { opacity: 0.9, duration: 0.15, ease: 'power2.out', stagger: 0.05 });
        gsap.to(glows, { opacity: 0.32, delay: 0.3, duration: 0.8, ease: 'power2.inOut' });
        // settle chuff — a couple of thicker exhaust puffs right at the stop
        spawnExhaust(1, 0.24, 0.22, 1.8);
        spawnExhaust(-1, 0.2, 0.18, 2.0);
        // the pump form rolls out from behind the bumper once things settle
        gsap.set(pumpEl, { opacity: 1, delay: 0.38 });
        gsap.fromTo(pumpInner, { yPercent: -115 }, { yPercent: 0, duration: 0.6, ease: 'power3.out', delay: 0.4 });
      }
      // idle lope fades in once parked — the car stays alive
      idleAmp += ((stopped ? 1 : 0) - idleAmp) * (1 - Math.exp(-dts * 3));
    }

    /* compose */
    const s = Math.min(1, speed / 10.05);
    rig.position.set(pose.x, 0, pose.z + band(BANDS.wander, t, s));
    rig.rotation.y = pose.yaw + band(BANDS.yaw, t, s) * DEG;
    // V8 idle lope: ~8.6 Hz shake + slow 4 Hz breathe, only while parked —
    // barely-there per Dan's 90%-less note. Runs on wallT so it never
    // freezes when the timeline ends.
    const lope = idleAmp * Math.sin(2 * Math.PI * 8.6 * wallT);
    car.rotation.z = sPitch.p * DEG + lope * 0.009 * DEG;
    car.rotation.x = sRoll.p * DEG + idleAmp * 0.006 * DEG * Math.sin(2 * Math.PI * 8.6 * wallT + 2.1);
    car.position.y = sHeave.p + band(BANDS.heave, t, s) + idleAmp * (0.00028 * Math.sin(2 * Math.PI * 8.6 * wallT + 0.5) + 0.00013 * Math.sin(2 * Math.PI * 4.1 * wallT + 1.3));
    rearWheels.forEach((w) => { w.rotation.z = wheelSpin; });
    steerGroups.forEach(({ g, w }) => { g.rotation.y = steer; w.rotation.z = frontSpin; });
    blob.scale.x = 1 + 0.15 * s;

    camera.position.set(0, pose.camY, pose.camZ);
    camera.lookAt(pose.tgtX, pose.tgtY, pose.tgtZ);
    if (joltT0 >= 0) {
      const tau = t - joltT0;
      if (tau >= 0 && tau < 0.32) {
        const env = Math.exp(-0.32 * 2 * Math.PI * 14 * tau);
        camera.position.y += 0.035 * env * Math.sin(2 * Math.PI * 14 * tau);
        camera.rotateZ(0.25 * DEG * env * Math.sin(2 * Math.PI * 14 * tau + 0.6));
      }
    }

    if (done || stopped) placePlate();
    renderer.render(scene, camera);
  };
  const startRendering = () => {
    if (!rendering) { rendering = true; gsap.ticker.add(tick); }
  };

  /* ── the run: ONLY x/z/yaw + camera are authored (research §5.1–5.3, §5.7) ── */
  const drive = () => {
    tl?.kill();
    gsap.killTweensOf(pose);
    smokeEl.innerHTML = '';
    clearMarks();
    done = false; stopped = false; joltT0 = -1;
    smokeAcc = 0; skidAcc = 0; brakeAcc = 0; chirpAcc = 0; idleAmp = 0;
    exhAcc = 0.8; exhSide = 1;
    sPitch.p = RAKE; sPitch.v = 0; sRoll.p = 0; sRoll.v = 0; sHeave.p = 0; sHeave.v = 0;
    steer = 0; slip = 0; prevT = 0;
    gsap.killTweensOf(lensMats);
    lensMats.forEach((m) => { m.emissiveIntensity = 1; });

    Object.assign(pose, {
      x: -15, z: -0.4, yaw: 0,
      camY: 0.72, camZ: 7.2, tgtX: -2.0, tgtY: 0.5, tgtZ: -0.6,
    });
    resync();
    gsap.killTweensOf(glows);
    gsap.killTweensOf([pumpEl, pumpInner]);
    gsap.set(plateEl, { opacity: 0, scale: 0.85 });
    gsap.set(glows, { opacity: 0 });
    gsap.set(pumpEl, { opacity: 0 });
    gsap.set(pumpInner, { yPercent: -115 });
    startRendering();

    tl = gsap.timeline();
    const K = (prop: 'x' | 'z' | 'yaw', rows: [number, number, string][]) => {
      let t0 = 0;
      rows.forEach(([t1, val, ease]) => {
        if (t1 > t0) tl!.to(pose, { [prop]: val, duration: t1 - t0, ease }, t0);
        else tl!.set(pose, { [prop]: val }, t1);
        t0 = t1;
      });
    };

    // path x — cruise in, brake, slide, tail decay
    K('x', [
      [0.55, -9.472, 'none'],
      [1.15, -4.41, 'e2brake'],
      [2.12, -0.243, 'slideX'],
      [2.44, -0.027, 'power1.out'],
      [T_STOP, 0, 'power1.out'],
    ]);
    // path z — slide arc, throttle out at the viewer, lunge to the tuned
    // end frame. finalBrake's start slope is re-derived from the run-out
    // length so velocity stays continuous whatever stop the aspect picks.
    const ZE = endZ();
    CustomEase.create('finalBrake', `M0,0 C0.333,${Math.min(0.9, (4.03 * 0.572) / (ZE - 1.747) / 3).toFixed(3)} 0.667,1 1,1`);
    K('z', [
      [1.15, -0.4, 'none'],
      [2.12, 0.711, 'slideZ'],
      [2.44, 1.747, 'approachZ'],
      [T_STOP, ZE, 'finalBrake'],
      [3.24, ZE - 0.014, 'power2.out'],
      [3.5, ZE - 0.007, 'power1.inOut'],
    ]);
    // yaw — slide with 9° over-rotation, counter-catch, −87.8° imperfect rest
    K('yaw', [
      [1.15, 0, 'none'],
      [1.3, -7 * DEG, 'power2.in'],
      [1.48, -33 * DEG, 'power1.in'],
      [1.66, -64 * DEG, 'none'],
      [1.84, -88 * DEG, 'none'],
      [1.97, -97.5 * DEG, 'power1.out'],
      [2.05, -99 * DEG, 'power2.out'],
      [2.2, -93.5 * DEG, 'power1.inOut'],
      [2.36, -86.6 * DEG, 'power1.inOut'],
      [2.54, -88.3 * DEG, 'sine.inOut'],
      [2.74, -87.6 * DEG, 'sine.inOut'],
      [2.92, -87.9 * DEG, 'sine.inOut'],
      [T_STOP, -87.8 * DEG, 'power1.out'],
    ]);
    // camera — drop to menace height, pan with the run, then whip down onto
    // the tuned end frame; tiny pushback at the stop
    tl.to(pose, { camY: CAM_Y_END, duration: 0.9, ease: 'power2.inOut' }, 0);
    tl.to(pose, { tgtX: 0, tgtY: 0.62, tgtZ: 2.9, duration: 2.6, ease: 'power2.inOut' }, 0);
    tl.to(pose, { tgtY: TGT_Y_END, tgtZ: 5.0, duration: T_STOP - 2.6, ease: 'power2.inOut' }, 2.6);
    tl.to(pose, { camZ: 7.13, duration: 0.35, ease: 'power2.out' }, T_STOP);

    // landing reveals
    tl.call(() => { done = true; }, [], 3.4);
    tl.to(plateEl, { opacity: 1, scale: 1, duration: 0.35, ease: EASE_ACCENT }, 3.2);
    tl.to({}, { duration: T_END - 3.5 }, 3.5); // physics clock runs through the settle
  };

  /* ── reduced motion: no drive, no ticker, no smoke. Paint the parked end
     frame once — the visitor still gets the car, the plate and the form,
     just without the 3-second stunt. Re-painted on resize and when the GLB
     swaps in, since nothing else is repainting. ── */
  function renderParked() {
    stopped = true; done = true; idleAmp = 0; joltT0 = -1;
    sPitch.p = RAKE; sPitch.v = 0; sRoll.p = 0; sRoll.v = 0; sHeave.p = 0; sHeave.v = 0;
    steer = 0; slip = 0; speed = 0;
    Object.assign(pose, {
      x: 0, z: endZ() - 0.007, yaw: -87.8 * DEG,
      camY: CAM_Y_END, camZ: 7.13, tgtX: 0, tgtY: TGT_Y_END, tgtZ: 5.0,
    });
    rig.position.set(pose.x, 0, pose.z);
    rig.rotation.y = pose.yaw;
    car.rotation.set(0, 0, sPitch.p * DEG);
    car.position.y = 0;
    lensMats.forEach((m) => { m.emissiveIntensity = 1.6; });
    camera.position.set(0, pose.camY, pose.camZ);
    camera.lookAt(pose.tgtX, pose.tgtY, pose.tgtZ);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    placePlate();
    gsap.set(plateEl, { opacity: 1, scale: 1 });
    gsap.set(glows, { opacity: 0.32 });
    gsap.set(pumpEl, { opacity: 1 });
    gsap.set(pumpInner, { yPercent: 0 });
  }

  resize();
  if (opts.reduced) {
    renderParked();
  } else {
    /* The module only loads once the section is near the fold, so by the time
       ScrollTrigger is created the start line may already be behind us (deep
       link, refresh at the bottom, fast flick). Check first, then fall back
       to the trigger — `once` triggers do not fire retroactively. */
    if (root.getBoundingClientRect().top < innerHeight * 0.65) drive();
    else ScrollTrigger.create({ trigger: root, start: 'top 65%', once: true, onEnter: drive });
  }

  /* 🔴 DUMMY SUBMIT — deliberately NOT wired to the live gate. Dan deferred
     the wiring to right before the first push of this section, because a real
     address here sends a REAL email. Production contract, when he says go:
       POST site.downloadGate.workerUrl + '/download/register'
       {email, plugin: 'gas', marketing: false}   ← same as TrialGateModal
       then dispatch 'tg:registered' on success.
     Until then this only swaps in the success bar locally. */
  const form = root.querySelector<HTMLFormElement>('[data-gas-form]');
  const doneEl = root.querySelector<HTMLElement>('[data-gas-done]');
  const status = root.querySelector<HTMLElement>('[data-gas-status]');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.querySelector<HTMLInputElement>('.hp')?.value) return;
    const email = form.querySelector<HTMLInputElement>('input[type=email]')?.value.trim() || '';
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      if (status) { status.textContent = 'That email doesn’t look right.'; status.hidden = false; }
      return;
    }
    if (status) status.hidden = true;
    form.hidden = true;
    if (doneEl) {
      doneEl.hidden = false;
      gsap.fromTo(doneEl, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
    }
  });
}
