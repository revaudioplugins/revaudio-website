// GAS 2 page · drone intro v2, the run (loaded by drone.js). A full-window WebGL canvas over the page; a scroll
// runway flies the drone from the hover down to the page's own frame; at touchdown the canvas fades onto the identical
// page, the readings pop out, the runway folds away and the page is the page (one flight per load: Dan 2026-10-28).
// The hover is any camera (drone.js: presets top / 45 front / 45 right, or the camera bench, ?cam); every hover lands
// exactly: the drone flies a straight line down onto the landing spot while the camera turns to look down the road,
// then a pure tilt-up at the landing camera brings the page frame in.
import { THREE, EYE, VFOV, LAND_POS, buildWorld } from './world.js';

const html = document.documentElement;
const T = window.__droneTune || { alt: 34, len: 4, sway: 1, yaw: 0, tilt: 90, ax: -4, az: -6, down: .42, gimbal: .18, arrive: 40 };
if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
scrollTo(0, 0);
const sceneEl = document.getElementById('scene');

const layer = document.createElement('div'); layer.className = 'dr'; layer.setAttribute('aria-hidden', 'true');
const canvas = document.createElement('canvas'); layer.appendChild(canvas);
const runway = document.createElement('div'); runway.className = 'dr-run'; runway.style.setProperty('--dr-len', T.len);
document.body.append(layer, runway);
const abandon = () => { layer.remove(); runway.remove(); html.classList.remove('dr-on', 'dr-hold', 'dr-land'); };

let renderer, world;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // the land frame's own sRGB values straight through
  world = await buildWorld();
} catch (err) { abandon(); throw err; }                     // no WebGL / a file missing: the page as it was
const cam = new THREE.PerspectiveCamera(VFOV, 1.5, .05, 2000);

const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const DEG = Math.PI / 180;

// ---- the path: u (0 hover .. 1 touchdown) -> camera position, orientation, and whether the landing frame shows
const E = new THREE.Euler(0, 0, 0, 'YXZ');
const herm = (u, u0, p0, m0, u1, p1, m1) => { const h = u1 - u0, s = (u - u0) / h, s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * h * m0 + (3 * s2 - 2 * s3) * p1 + (s3 - s2) * h * m1; };
const wrap = a => ((a + 180) % 360 + 360) % 360 - 180;
// The drop ends on the landing spot at T.down (altitude: log toward a 4 m offset, slow off the hover and still sinking
// on arrival, so little scroll goes on bare road close up); the camera holds the hover angle until T.gimbal, then turns
// to T.arrive degrees down, facing the page, by T.down; from there on it is a pure tilt at the landing camera, so the
// page frame shows exactly. The quad switches on at T.down, where the whole page frame is still above the top edge
// (it shows from about -37.6 deg), so the switch is unseen.
function poseAt(u) {
  const DOWN = T.down, G = Math.min(T.gimbal, DOWN - .02), P = -T.arrive, m = 1.5 * T.arrive / (1 - DOWN);   // deg per unit u: the turn runs on into the tilt-up
  const yaw0 = wrap(T.yaw) * DEG, d = T.tilt >= 89.9 ? 0 : T.alt / Math.tan(T.tilt * DEG);
  const hx = T.ax + d * Math.sin(yaw0), hz = T.az + d * Math.cos(yaw0);          // the hover, on the line of sight to the aim point
  const s = Math.min(1, u / DOWN), t = 2.5 * s * s - 1.5 * s * s * s, C = 4, top = T.alt - EYE + C;
  const h = EYE - C + top * Math.pow(C / top, t), k = (h - EYE) / (T.alt - EYE);
  const pitch = u <= G ? -T.tilt : u <= DOWN ? herm(u, G, -T.tilt, 0, DOWN, P, m) : herm(u, DOWN, P, m, 1, 0, 0);
  const yaw = yaw0 * (1 - smooth(G, DOWN, u));
  E.set(pitch * DEG, yaw, 0);
  return { pos: new THREE.Vector3(hx * k, h, hz * k), quat: new THREE.Quaternion().setFromEuler(E), pitch, yaw: yaw / DEG, quad: u >= DOWN ? 1 : 0 };
}

// ---- framing: the canvas shows the same window into the 3:2 frame as the page's .scene, so touchdown lands on the
// page pixel for pixel at any window size. Narrower than the scene (phones): the hover is centred, then pans home.
let rect = { w: 1, h: 1, x: 0, y: 0 };
function fit() {
  const r = sceneEl.getBoundingClientRect();
  rect = { w: r.width, h: r.height, x: -r.left, y: -r.top };
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(innerWidth, innerHeight, false);
}
function view(u) {
  let ox = rect.x;
  if (rect.w - innerWidth > 2) { const hover = Math.min(rect.w - innerWidth, Math.max(0, rect.w * .5 - innerWidth / 2)); ox = hover + (rect.x - hover) * smooth(.45, .97, u); }
  cam.setViewOffset(rect.w, rect.h, ox, rect.y, innerWidth, innerHeight);
}
fit(); addEventListener('resize', fit);

// ---- the hover: slow, unrelated sines; full at the hover, gone by the touchdown (T.down): the landing must sit still and exact
const n = (t, f1, f2, ph) => .6 * Math.sin(t * f1 + ph) + .4 * Math.sin(t * f2 + ph * 1.7);
const swayQ = new THREE.Quaternion();
function applySway(pose, t, a) {
  if (a <= 0) return;
  pose.pos.add(new THREE.Vector3(a * .3 * n(t, .71, 1.93, .3), a * .25 * n(t, .61, 1.61, 2.2), a * .22 * n(t, .53, 1.37, 1.1)));
  E.set(a * .2 * DEG * n(t, .57, 1.51, 1.9), a * .25 * DEG * n(t, .43, 1.19, .7), a * .35 * DEG * n(t, .37, 1.07, 2.6));
  pose.quat.multiply(swayQ.setFromEuler(E));
}

// ---- the loop
const progress = () => { const max = runway.offsetHeight + runway.offsetTop - innerHeight; return max > 0 ? clamp01(scrollY / max) : 0; };
const CAM = new URLSearchParams(location.search).has('cam');   // the camera bench (cam-bench.js)
let shown = false, landed = false, sDisp = 0, last = performance.now();
const born = last;
world.car.start();
addEventListener('dr:car', () => world.car.start(0));
function frame(now) {
  if (landed) return;
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const p = progress();
  sDisp += (p - sDisp) * (1 - Math.exp(-dt / .11));         // wheel steps glide; trackpads stay 1:1
  if (Math.abs(p - sDisp) < 1e-4) sDisp = p;
  const u = sDisp, age = (now - born) / 1000;
  const pose = poseAt(u);
  applySway(pose, age, T.sway * (1 - .7 * smooth(0, .3, u)) * (1 - smooth(T.down - .2, T.down, u)) * smooth(0, 1.5, age));
  cam.position.copy(pose.pos); cam.quaternion.copy(pose.quat); cam.updateMatrixWorld();
  view(u);
  world.set({ uA: 0, quad: pose.quad, feather: .04 * Math.min(1, -pose.pitch / 10) });
  if (CAM) window.__droneState = { u, h: pose.pos.y, pitch: pose.pitch, yaw: pose.yaw };
  world.car.update(now);
  renderer.render(world.scene, cam);
  if (!shown) { shown = true; layer.classList.add('on'); }
  if (!CAM && p >= .999 && sDisp >= .997) land(); else requestAnimationFrame(frame);   // the camera bench never lands: scroll back up
}
requestAnimationFrame(frame);

// ?autofly: flies itself after the hover (device checks, hands-free demos)
if (new URLSearchParams(location.search).has('autofly')) setTimeout(() => {
  const t0 = performance.now(), D = 7000;
  const step = now => { const k = Math.min(1, (now - t0) / D); scrollTo(0, Math.round((html.scrollHeight - innerHeight) * k * k * (3 - 2 * k))); if (k < 1 && !landed) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}, 3000);

// ---- touchdown: the exact landing frame, the canvas fades onto the identical page, the readings pop, the runway goes
function land() {
  landed = true;
  cam.position.copy(LAND_POS); cam.quaternion.identity(); cam.updateMatrixWorld(); view(1);
  world.set({ uA: 0, quad: 1, feather: 0 });
  renderer.render(world.scene, cam);
  if (new URLSearchParams(location.search).has('landhold')) return;   // QA: freeze on the exact landing frame (drone/tools/check.cjs)
  html.style.overflow = 'hidden';                            // no scroll momentum carrying on into the page
  html.classList.add('dr-land'); layer.classList.add('out');
  setTimeout(pop, 120);
  setTimeout(() => {
    html.classList.remove('dr-on', 'dr-land');               // the stage back in the flow, no runway: the page as it always was
    layer.remove(); runway.remove(); scrollTo(0, 0); html.style.overflow = '';
    removeEventListener('resize', fit); renderer.dispose(); renderer.forceContextLoss();
    dispatchEvent(new CustomEvent('dr:landed'));
  }, 1300);
}

// ---- the readings pop out of the screen (Dan 2026-10-28): GAS2 springs out first, the rest pops in fast behind it.
// Pre-hidden by opacity only (html.dr-hold); the motion rides scale / translate / filter, so each element's own
// transform stays untouched.
export function pop() {
  const rd = document.querySelector('.rd'); if (!rd) return html.classList.remove('dr-hold');
  const EASE = 'cubic-bezier(.2, 1, .3, 1)', go = (el, kf, duration, delay) => el && el.animate(kf, { duration, delay, easing: EASE, fill: 'backwards' });
  html.classList.remove('dr-hold');                          // the readings' shadow fades in by its own transition (drone.css)
  go(rd.querySelector('.ti'), [{ opacity: 0, scale: .5, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0)', offset: .35 }, { scale: 1.07, offset: .62 }, { opacity: 1, scale: 1, filter: 'blur(0)' }], 620, 0);
  try {                                                      // the oxide rule under GAS2 draws out
    const nn = rd.querySelector('.n'), a = nn && nn.animate([{ scale: '0 1' }, { scale: '1 1' }], { pseudoElement: '::after', duration: 420, delay: 200, easing: EASE, fill: 'backwards' });
    if (a && a.effect.pseudoElement !== '::after') a.cancel();
  } catch (e) { /* no pseudo-element animation here: the rule just shows */ }
  const fast = [{ opacity: 0, scale: .82 }, { opacity: 1, offset: .5 }, { scale: 1.03, offset: .75 }, { opacity: 1, scale: 1 }];
  go(rd.querySelector('.lead'), fast, 340, 230);
  go(rd.querySelector('.cta'), fast, 360, 290);
  go(rd.querySelector('.scr'), fast, 380, 350);
}
