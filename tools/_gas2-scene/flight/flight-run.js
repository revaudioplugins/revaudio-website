// GAS 2 page · the drone intro, the run (loaded by flight.js). The station's 3D set (world.js) on a full-window canvas;
// the scroll runway flies the camera from the hover (img/aerial.webp) down to the page's own frame, which it meets
// pixel-for-pixel; then the canvas fades onto the page, the readings pop, the runway folds away: the page is the page.
import { THREE, makeWorld, loadSet, poseAt, applyPose, makeCamera, POSE_A, POSE_B } from './world.js';
import { makeRoadside } from './roadside.js';

const html = document.documentElement;
// TUNE → Flight (flight.js): runway length in screens, sway strength. Stored per browser, read once per flight.
const TUNE = { len: 4, sway: 1 };
try { Object.assign(TUNE, JSON.parse(localStorage.getItem('gas2page-b:flight') || '{}')); } catch {}
addEventListener('fl:tune', e => Object.assign(TUNE, e.detail));
if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
scrollTo(0, 0);
const scene = document.getElementById('scene');

const fl = document.createElement('div'); fl.className = 'fl'; fl.setAttribute('aria-hidden', 'true');
const canvas = document.createElement('canvas'); fl.appendChild(canvas);
const cue = document.createElement('div'); cue.className = 'fl-cue'; cue.innerHTML = 'Scroll to land<i></i>';
const run = document.createElement('div'); run.className = 'fl-run'; run.style.setProperty('--fl-len', TUNE.len);
document.body.append(fl, cue, run);
const cueTimer = setTimeout(() => scrollY < 8 && cue.classList.add('show'), 1800);
const abandon = () => { clearTimeout(cueTimer); fl.remove(); cue.remove(); run.remove(); html.classList.remove('fl-on', 'fl-hold', 'fl-land'); };

let renderer, world, road;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // the photos' own sRGB values straight through (the landing frame must match the page)
  world = makeWorld(await loadSet({ aerial: `img/aerial-${html.dataset.air || 'blue'}.webp` }));
  road = await makeRoadside(world);                        // the pole sign + the telephone line (3D, behind the landing camera)
} catch (err) { abandon(); throw err; }                     // no WebGL / a photo missing: the page as it was
const cam = makeCamera(POSE_B);

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// the canvas frames the same window into the 3:2 scene as the page does (.scene covers the viewport, centred, or
// right-anchored on tall windows), so the last frame lands exactly on the page's frame at any window size. On windows
// narrower than the scene (phones, tall windows) the hover looks at the station and the window pans home at touchdown
// (flight.css crops the first-paint still the same way).
let frameRect = { w: 1, h: 1, x: 0, y: 0 };
const fit = () => {
  const r = scene.getBoundingClientRect();
  frameRect = { w: r.width, h: r.height, x: -r.left, y: -r.top };
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(innerWidth, innerHeight, false);
  cam.aspect = 1.5;
};
const view = u => {
  const { w, h, x, y } = frameRect, vw = innerWidth;
  let ox = x;
  if (w - vw > 2) { const hover = Math.min(w - vw, Math.max(0, w * .47 - vw / 2)); ox = hover + (x - hover) * smooth(.45, .97, u); }
  cam.setViewOffset(w, h, ox, y, vw, innerHeight);
};
fit(); addEventListener('resize', fit);

const progress = () => { const max = run.offsetHeight + run.offsetTop - innerHeight; return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0; };
// the drone holding its spot in the air: a few slow, unrelated sines (metres / degrees), full at the hover, a breath
// mid-flight, none on the way in to land (the landing frame has to sit still and exact)
const sway = (t, a) => {
  const n = (f1, f2, ph) => .6 * Math.sin(t * f1 + ph) + .4 * Math.sin(t * f2 + ph * 1.7);
  return { x: a * .32 * n(.71, 1.93, .3), y: a * .22 * n(.53, 1.37, 1.1), z: a * .28 * n(.61, 1.61, 2.2),
    yaw: a * .3 * n(.43, 1.19, .7), pitch: a * .24 * n(.57, 1.51, 1.9), roll: a * .4 * n(.37, 1.07, 2.6) };
};
const hoverAmp = u => (1 - .75 * smooth(0, .5, u)) * (1 - smooth(.8, .96, u));

let sDisp = 0, last = performance.now(), born = last, landed = false, shown = false;
const frame = now => {
  if (landed) return;
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const p = progress();
  sDisp += (p - sDisp) * (1 - Math.exp(-dt / .11));     // wheel steps -> a glide; trackpads stay 1:1
  if (Math.abs(p - sDisp) < 1e-4) sDisp = p;
  const u = sDisp + .6 * sDisp * (1 - sDisp);            // answers the first scroll at once, settles soft at touchdown
  const age = (now - born) / 1000, pose = poseAt(u), w = sway(age, TUNE.sway * hoverAmp(u) * smooth(0, 1.6, age));
  pose.pos = [pose.pos[0] + w.x, pose.pos[1] + w.y, pose.pos[2] + w.z];
  pose.yaw += w.yaw; pose.pitch += w.pitch; pose.roll += w.roll;
  applyPose(cam, pose); view(u); world.setS(u); road.update(age);
  renderer.render(world.scene, cam);
  if (!shown) { shown = true; fl.classList.add('gl'); }
  if (p > .01) { clearTimeout(cueTimer); cue.classList.remove('show'); }
  if (p >= .999 && sDisp >= .996) land(); else requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

// touchdown: the canvas shows the page's own frame (exact), fades onto it, the readings pop, the runway folds away
function land() {
  landed = true;
  applyPose(cam, POSE_A); view(1); world.setS(1); renderer.render(world.scene, cam);
  html.style.overflow = 'hidden';                        // no scroll momentum carrying on into the page
  html.classList.add('fl-land'); fl.classList.add('out'); cue.remove();
  setTimeout(pop, 160);
  setTimeout(() => {
    html.classList.remove('fl-on', 'fl-land');           // the stage back in the flow, no runway: the page as it always was
    fl.remove(); run.remove(); scrollTo(0, 0); html.style.overflow = '';
    removeEventListener('resize', fit); renderer.dispose(); renderer.forceContextLoss();
  }, 1700);
}

// the readings pop out (DESIGN.md §6: settle curve, ~90 ms stagger; a pop = a small overshoot). Pre-hidden by opacity
// only (html.fl-hold); the motion rides the individual scale / translate properties, so each element's own transform
// (the script line's -6deg) stays untouched.
function pop() {
  const rd = document.querySelector('.rd'); if (!rd) return html.classList.remove('fl-hold');
  const E = 'cubic-bezier(.22, 1, .36, 1)', go = (el, kf, duration, delay) => el && el.animate(kf, { duration, delay, easing: E, fill: 'backwards' });
  html.classList.remove('fl-hold');                      // the shadow layers fade in by their own transition
  go(rd.querySelector('.ti'), [{ opacity: 0, scale: .78, translate: '0 1.6cqw' }, { opacity: 1, offset: .4 }, { scale: 1.035, translate: '0 -.2cqw', offset: .7 }, { opacity: 1, scale: 1, translate: '0 0' }], 860, 0);
  try {                                                  // the oxide rule under GAS2 draws out (only where ::after can be animated)
    const n = rd.querySelector('.n'), a = n && n.animate([{ scale: '0 1' }, { scale: '1 1' }], { pseudoElement: '::after', duration: 620, delay: 320, easing: E, fill: 'backwards' });
    if (a && a.effect.pseudoElement !== '::after') a.cancel();
  } catch {}
  go(rd.querySelector('.lead'), [{ opacity: 0, translate: '0 1.1cqw' }, { opacity: 1, translate: '0 0' }], 640, 240);
  go(rd.querySelector('.cta'), [{ opacity: 0, scale: .72 }, { opacity: 1, offset: .4 }, { scale: 1.06, offset: .7 }, { opacity: 1, scale: 1 }], 720, 380);
  go(rd.querySelector('.scr'), [{ opacity: 0, clipPath: 'inset(-30% 100% -30% -5%)' }, { opacity: 1, offset: .25 }, { opacity: 1, clipPath: 'inset(-30% -5% -30% -5%)' }], 980, 560);
}
