// GAS 2 page · the drone flight: the station as a projection-mapped 3D set (three.js, no build step).
// Two photos paint the set like slide projectors. A = the page's own frame at touchdown (img/land.webp, rendered from
// page-b without the readings), B = the drone's hover shot (img/aerial-blue.webp, painted from this set's own blockout seen
// from POSE_B, so it lines up). A camera standing exactly on a projector sees that photo exactly: the flight starts
// pixel-true on B and lands pixel-true on A. In between, every surface takes the sharper photo (texels per metre on the
// worst axis); what neither photo saw is filled from a dusk sky panorama (img/sky.webp, colour-matched to A's sky by
// elevation) and a desert ground texture (img/ground.webp, matched to B's desert), faded to the horizon haze. Near
// touchdown, what the camera sees past the wall corner comes from A's own background plate (img/land-bg.webp).
import * as THREE from './vendor/three.module.min.js';

// ── the set, in metres. The station's front wall is the plane z = 0, the ground y = 0, the landing camera looks down -z.
// Calibrated on f6-v17 (1536 x 1024, f = 1500 px, horizon at row 525): eye 1.33 m, 6.6 m from the wall; the curb at
// z 1.91 (slab top 0.25 m), the wall's right corner x 0.87, the roof's underside 3.5 m. Everything is scale-free except f.
export const HOUSE = [[-6.6, 0, -6], [0.867, 3.5, 0]];   // 7.5 x 6 m: a roadside shack, the shop window is most of its front
// the roof and the sidewalk are prisms (footprint [x, z] corners, y from-to): both their right ends run slanted in the
// photo, and a box there would carry sky / desert pixels on its square corner. The canopy's slanted edge = where the
// landing photo's underside meets the sky, back-projected onto the underside (y 3.5): x = 0.1045 z + 2.4575, a straight
// line within 1 cm over z -6 .. -0.2, + 1.5 cm for the anti-aliased edge (2026-10-26; the f6-v17 measure had it
// 0.2-0.27 m in, so a strip of the dark lip rode on the sky). The sidewalk's end from (1.85, 1.91) back to
// (2.75, -1.29), measured on f6-v17.
const ROOF = { y: [3.5, 3.85], xz: [[-6.9, 0.45], [2.52, 0.45], [1.815, -6.3], [-6.9, -6.3]] };
const ROOFTOP = [[-4.6, -3.6, .7, .45, .7], [-1.9, -4.9, .5, .35, .5]];   // two low vents: x, z, w, h, d (a stove pipe poked above the roof line on the way in)
const SLAB = { y: [0, 0.25], xz: [[-6.9, 1.91], [1.85, 1.91], [2.75, -1.29], [1.7, -6], [-6.9, -6]] };
// occluders for the shader's line-of-sight test: the house as a box (+ the chalkboard's board, added in makeWorld), the
// roof and the sidewalk as their own prisms; for the landing photo the chalkboard is its own cut-out (img/land-chalk.png).
// The roof's and the sidewalk's slanted ends used to be box steps: through the gaps the landing photo's dark canopy edge
// leaked onto the sky as a stepped ghost in the last stretch of the descent (2026-10-26).
const OCCLUDERS = [HOUSE, ...ROOFTOP.map(([x, z, w, h, d]) => [[x, ROOF.y[1], z], [x + w, ROOF.y[1] + h, z + d]])];   // + the vents: the hover
// photo has them (tools/draw-vents.py), so the roof behind one, as the drone sees it from lower down, must not wear its picture
const PRISMS = [ROOF, SLAB];
const ROAD = { z0: 10.5, z1: 17.5 };          // the two-lane highway in front of the apron
const SKY_R = 1450, GROUND_R = 1400;
// img/sky.webp: horizon at 87.8 % of its height, linear in elevation, 35 deg at the top, -4.87 deg at the bottom;
// it spans +-70 deg of azimuth around the view axis (mirrored beyond). HAZE = the far desert under the horizon.
const SKY = { hz: 0.878, top: 35, bot: 4.87, az: 70, haze: [0.17, 0.12, 0.10] };
// page-b's chalkboard (.chalk: left 56.2 %, top 53.4 %, width 11.6 % of the scene; props/chalkboard.png 420 x 627, its
// feet at row 622, its solid board between cols 70-350 / rows 90-440). It stands on the sidewalk right of the wall
// corner, so it gets its own cut-out panel at its own depth instead of smearing across the corner.
// the side door, left of the shop window (x from-to, y to; on the front wall z = 0) and the pane in its upper half
export const DOOR = { x: [-5.5, -4.5], top: 2.35, pane: { c: [-5.0, 1.78], h: [0.27, 0.34] } };
const CHALK = { x: .562 * 1536, y: .534 * 1024, w: .116 * 1536, img: [420, 627], feet: 622, core: [70, 90, 350, 440] };

// poses: position (m), yaw (deg, + = turn left), pitch (deg, + = look up), roll (deg), vertical fov (deg). Frame = 3:2.
export const POSE_A = { pos: [0, 1.328, 6.6], yaw: 0, pitch: -0.4966, roll: 0, vfov: 37.7497 }; // f = 1500 px on 1024
export const POSE_B = { pos: [0, 22, 19.5], yaw: 8, pitch: -48, roll: 0, vfov: 46 };            // the hover: img/aerial-blue.webp was painted from this camera

const D2R = Math.PI / 180;
export function applyPose(cam, p) {
  cam.position.set(p.pos[0], p.pos[1], p.pos[2]);
  cam.rotation.order = 'YXZ';
  cam.rotation.set(p.pitch * D2R, p.yaw * D2R, p.roll * D2R);
  if (cam.fov !== p.vfov) { cam.fov = p.vfov; cam.updateProjectionMatrix(); }
  cam.updateMatrixWorld(true);
}
export function makeCamera(p) {
  const c = new THREE.PerspectiveCamera(p.vfov, 1.5, 0.05, 4000);
  applyPose(c, p); c.updateProjectionMatrix(); return c;
}

// ── the flight path: u = 0 on B, u = 1 on A. Position on a cubic Bezier that leaves B dropping toward the lot and
// arrives along A's own axis at eye level (the last metres are a glide in, the drone settling in front of the pump).
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
export function poseAt(u, B = POSE_B, A = POSE_A) {
  const P0 = B.pos, P3 = A.pos;
  const P1 = [lerp(P0[0], P3[0], .25), P0[1] * .55, lerp(P0[2], P3[2], .42)];   // fall away from the hover, toward the lot
  const P2 = [P3[0] + .2, P3[1] + 1.4, P3[2] + 11];                            // come in level along A's axis
  const k = 1 - u, b0 = k * k * k, b1 = 3 * k * k * u, b2 = 3 * k * u * u, b3 = u * u * u;
  const pos = [0, 1, 2].map(i => b0 * P0[i] + b1 * P1[i] + b2 * P2[i] + b3 * P3[i]);
  const e = ease(Math.min(1, u * 1.08));                                       // the gimbal finishes tilting up just before touchdown
  return { pos, yaw: lerp(B.yaw, A.yaw, ease(u)), pitch: lerp(B.pitch, A.pitch, e), roll: lerp(B.roll, A.roll, ease(u)), vfov: lerp(B.vfov, A.vfov, ease(u)) };
}

// ── the projector shader
const VERT = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const f2 = v => v.toFixed(4);
const NBOX = OCCLUDERS.length + 1;   // + the chalkboard's solid board
const PORCH_LAMP = [1.9, 0.2];       // x, z of the porch lamp under the canopy's front (the landing photo's right lamp)
const CAM_F = 1300;                   // ~ the flight camera's focal on the 1024-high frame (1206 at the hover, 1500 at touchdown)
// a convex prism as planes (inside: dot(n, p) <= d): top, bottom, one per footprint edge -> a GLSL ray-slab clip
function prismHit({ y: [y0, y1], xz }) {
  const cx = xz.reduce((a, p) => a + p[0], 0) / xz.length, cz = xz.reduce((a, p) => a + p[1], 0) / xz.length;
  const pl = [[0, 1, 0, y1], [0, -1, 0, -y0]];
  xz.forEach(([x, z], i) => {
    const [x2, z2] = xz[(i + 1) % xz.length], L = Math.hypot(x2 - x, z2 - z);
    let nx = (z2 - z) / L, nz = -(x2 - x) / L;
    if (nx * (cx - x) + nz * (cz - z) > 0) { nx = -nx; nz = -nz; }
    pl.push([nx, 0, nz, nx * x + nz * z]);
  });
  return pl.map(([a, b, c, d]) => `if (!clipPlane(ro, rd, vec3(${f2(a)}, ${f2(b)}, ${f2(c)}), ${f2(d)}, t0, t1)) return false;`).join('\n  ');
}
const FRAG = /* glsl */`
precision highp float;
uniform sampler2D tA; uniform sampler2D tAbg; uniform sampler2D tB; uniform sampler2D tSky; uniform sampler2D tGround;
uniform mat4 mA; uniform mat4 mB;
uniform vec3 pA; uniform vec3 pB;
uniform float fA; uniform float fB;
uniform float s; uniform float useB; uniform float minRes; uniform float dbg;
uniform int kind;                   // 0 ground, 1 building, 2 sky, 3 the chalkboard panel
uniform vec3 lampP; uniform vec3 lampC; uniform float lampI; uniform float lampR;   // the pole sign (roadside.js)
uniform vec3 doorL; uniform float doorI;                                             // the side door's lamp (roadside.js)
uniform vec3 bmin[${NBOX}]; uniform vec3 bmax[${NBOX}];
uniform sampler2D tChalkA; uniform float chalkZ;   // the chalkboard as the landing photo has it, its plane z = chalkZ
varying vec3 vW; varying vec3 vN; varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }

bool hitBox(vec3 ro, vec3 rd, float tmax, vec3 lo, vec3 hi) {
  vec3 inv = 1.0 / rd, t0 = (lo - ro) * inv, t1 = (hi - ro) * inv;
  vec3 a = min(t0, t1), b = max(t0, t1);
  float tn = max(max(a.x, a.y), a.z), tf = min(min(b.x, b.y), b.z);
  return tf > max(tn, 0.0) && tn < tmax;
}
bool clipPlane(vec3 ro, vec3 rd, vec3 n, float d, inout float t0, inout float t1) {
  float dn = dot(n, rd), dist = d - dot(n, ro);
  if (abs(dn) < 1e-6) return dist >= 0.0;
  if (dn > 0.0) t1 = min(t1, dist / dn); else t0 = max(t0, dist / dn);
  return t0 < t1;
}
${PRISMS.map((P, i) => `bool hitPrism${i}(vec3 ro, vec3 rd, float tmax) {
  float t0 = 0.0, t1 = tmax;
  ${prismHit(P)}
  return true;
}`).join('\n')}
float seen(vec3 w, vec3 n, vec3 p) {          // 1 = nothing of the set stands between this point and the projector
  vec3 d = p - w; float L = length(d); vec3 rd = d / L;
  vec3 ro = w + n * 0.03 + rd * 0.03;
  for (int i = 0; i < ${NBOX}; i++) if (hitBox(ro, rd, L, bmin[i], bmax[i])) return 0.0;
  ${PRISMS.map((P, i) => `if (hitPrism${i}(ro, rd, L)) return 0.0;`).join(' ')}
  return 1.0;
}
// a projector's sharpness on this point (texels per metre on the worst axis), inside its frame, feathered over the
// outer 8 % (never below .02, so a camera ON the projector stays exact). minRes > 0 only for the blockout render the
// aerial is painted from: there A's smeared far ground gives way to the fill.
float sharp(vec4 c, vec2 uv, vec3 p, float f, vec3 N) {
  if (c.w <= 0.0 || any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return 0.0;
  vec2 e = min(uv, 1.0 - uv) / 0.08;
  float edge = max(0.02, smoothstep(0.0, 1.0, min(e.x, e.y)));
  vec3 d = p - vW; float L = length(d); float co = dot(N, d / L);
  if (co <= 0.0) return 0.0;
  float res = f * co / L;
  return edge * res * smoothstep(minRes * 0.5, minRes + 1e-6, res);
}
bool porch() {                                  // under the canopy, right of the house: the floor, its slanted end, the dirt there
  return vW.x > 0.87 && vW.y < 3.45 && vW.z < 0.6 && vW.z > -6.5 && vW.x < 0.1045 * vW.z + 3.05;
}
vec3 skyAt(vec3 dir) {                          // the panorama by azimuth (mirrored past +-${SKY.az} deg) and elevation
  float az = degrees(atan(dir.x, -dir.z)), el = degrees(asin(clamp(dir.y, -1.0, 1.0)));
  float u = az / ${f2(2 * SKY.az)} + 0.5; u = abs(mod(u + 1.0, 2.0) - 1.0);
  float row = el >= 0.0 ? ${f2(SKY.hz)} * (1.0 - min(el / ${f2(SKY.top)}, 1.0))
                        : ${f2(SKY.hz)} + ${f2(1 - SKY.hz)} * min(-el / ${f2(SKY.bot)}, 1.0);
  return texture2D(tSky, vec2(u, 1.0 - row)).rgb;
}
vec3 fallback(vec3 N) {
  if (kind == 2) return skyAt(normalize(vW));
  if (kind == 1) {
    if (N.y > 0.5 && vW.y > 1.0) return vec3(0.29, 0.26, 0.23) * (0.85 + 0.3 * vnoise(vW.xz * 1.7));   // tar-and-gravel roof
    // the slab's top: A's sidewalk concrete; under the porch the canopy's shade, and the porch lamp's warm pool at its front
    if (N.y > 0.5) {
      vec3 cc = textureLod(tA, vec2(0.13, 0.16), 4.0).rgb * (0.82 + 0.3 * vnoise(vW.xz * 2.1) + 0.08 * vnoise(vW.xz * 13.0));
      vec2 pl = vW.xz - vec2(${f2(PORCH_LAMP[0])}, ${f2(PORCH_LAMP[1])});
      float under = (1.0 - smoothstep(-3.0, 0.3, vW.z)) * smoothstep(0.7, 1.1, vW.x);
      return cc * mix(1.0, 0.36, under) + cc * vec3(0.3, 0.21, 0.11) * exp(-dot(pl, pl) / 1.4) * smoothstep(0.7, 1.1, vW.x);
    }
    // stucco: A's own wall colour, mottled at three scales
    float m = 0.5 * vnoise(vW.xy * 1.7) + 0.3 * vnoise(vW.xy * 5.1 + 3.0) + 0.2 * vnoise(vW.xy * 17.0 + 7.0);
    vec3 st = textureLod(tA, vec2(0.06, 0.72), 6.0).rgb * (0.8 + 0.34 * m);
    if (N.z > 0.5 && vW.z < 0.05 && vW.y < 3.5) {                // the front wall left of the shop window, lit like the photo's:
      st *= 1.0 - 0.2 * (1.0 - smoothstep(0.25, 0.8, vW.y));    // splash grime along its foot
      st *= 1.0 - 0.16 * smoothstep(2.9, 3.5, vW.y) * (0.5 + 0.5 * vnoise(vec2(vW.x * 6.0, 0.5)));   // the eave's shadow, streaked
      st *= 0.6 + 0.4 * smoothstep(-6.6, -3.4, vW.x);            // further from the shop's lamps, deeper in the dusk
      if (vW.x > ${f2(DOOR.x[0])} && vW.x < ${f2(DOOR.x[1])} && vW.y < ${f2(DOOR.top)}) {   // the side door, its edges in shadow
        vec2 e = min(vW.xy - vec2(${f2(DOOR.x[0])}, 0.25), vec2(${f2(DOOR.x[1])}, ${f2(DOOR.top)}) - vW.xy);
        st = vec3(0.16, 0.2, 0.17) * (0.9 + 0.12 * vnoise(vW.xy * 9.0)) * (0.55 + 0.45 * smoothstep(0.0, 0.05, min(e.x, e.y)));
        vec2 pn = vec2(abs(vW.x - ${f2((DOOR.x[0] + DOOR.x[1]) / 2)}) - 0.2, vW.y - 0.86);   // two recessed panels under the pane
        float pe = max(abs(pn.x) - 0.15, abs(pn.y) - 0.4);
        st *= 1.0 - 0.35 * (1.0 - smoothstep(0.0, 0.018, abs(pe))) - 0.08 * step(pe, 0.0);
        if (distance(vW.xy, vec2(${f2(DOOR.x[1] - 0.12)}, 1.05)) < 0.032) st = vec3(0.5, 0.38, 0.18);   // the knob
      }
    }
    if (vW.y < 0.26 && abs(N.y) < 0.5)                            // the sidewalk's sides (the curb, the slanted end): A's concrete
      st = textureLod(tA, vec2(0.15, 0.1), 4.0).rgb * (0.8 + 0.3 * m) * (0.75 + 0.25 * smoothstep(0.0, 0.2, vW.y));
    return st;
  }
  vec3 g = texture2D(tGround, vW.xz / 9.0).rgb;
  // the apron: concrete in front of the slab, its outer edge breaking up into the dirt (no ruler edge)
  vec3 asphalt = textureLod(tA, vec2(0.5, 0.025), 5.0).rgb * (0.85 + 0.2 * vnoise(vW.xz * 2.0));
  vec2 q = vec2(abs(vW.x + 2.0) - 6.0, vW.z - 9.6);
  float rr = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) + 1.2 * (vnoise(vW.xz * 0.9) - 0.5);
  g = mix(g, asphalt, (1.0 - smoothstep(-0.4, 0.9, rr)) * step(1.91, vW.z));
  if (vW.z > ${ROAD.z0.toFixed(2)} && vW.z < ${ROAD.z1.toFixed(2)}) {
    g = vec3(0.17, 0.16, 0.155) * (0.85 + 0.25 * vnoise(vW.xz * 1.3));
    if (abs(vW.z - ${((ROAD.z0 + ROAD.z1) / 2).toFixed(2)}) < 0.09 && fract(vW.x / 9.0) < 0.5) g = vec3(0.62, 0.52, 0.27);
  }
  float far = smoothstep(40.0, 900.0, distance(vW, cameraPosition));
  return mix(g, vec3(${SKY.haze.map(f2).join(', ')}), far);
}
void main() {
  vec4 cA = mA * vec4(vW, 1.0);
  vec2 uA = cA.xy / cA.w * 0.5 + 0.5;
  // the chalkboard panel takes its outline from the landing photo's own board (img/land-chalk.png), so the panel and the
  // line of sight behind it (below) agree with the photo to the pixel; the prop's cut-out sat a few pixels off
  if (kind == 3 && textureLod(tChalkA, uA, 0.0).r < 0.5) discard;
  vec3 N = kind == 2 ? -normalize(vW) : normalize(vN);
  bool proxy = minRes > 0.0;
  // ── A, the landing photo. Its sky only comes in over the last stretch (earlier the panorama carries the sky, so no
  // edge of A's frame hangs in the air). Past A's left edge the wall is the aerial's (unlit, away from the porch lamps:
  // A's 8 % edge feather reads as the lamp light falling off); past the wall corner A's background plate shows what
  // the wall hid from A.
  float gA = kind == 2 ? smoothstep(0.8, 1.0, s) : s;
  float shA = sharp(cA, uA, pA, fA, N) * gA;
  float vis = shA > 0.0 ? seen(vW, N, pA) : 0.0;
  // behind the chalkboard's plane, under the board as A has it, A saw the board, not this: its frame and legs no longer
  // ride onto the floor behind (a floating stick near touchdown, 2026-10-26; the box round the board alone missed them)
  if (vis > 0.0 && kind != 3 && vW.z < chalkZ - 0.05 && textureLod(tChalkA, uA, 0.0).r > 0.5) vis = 0.0;
  // A's background plate only for the last stretch (the sliver past the wall corner near touchdown): earlier it painted the
  // dirt behind the porch with A's mirrored desert (a ghost stick, a ghost sidewalk end) all the way down
  float wA = shA * vis, wAbg = (kind == 0 || kind == 2) && !proxy ? shA * (1.0 - vis) * smoothstep(0.8, 0.95, s) : 0.0;
  if (proxy && (vW.z < -0.05 || vW.x < -3.45 || vW.x > 2.4)) wA = 0.0;       // blockout: A paints the shop front only
  // ── B, the hover photo
  vec4 cB = mB * vec4(vW, 1.0);
  vec2 uB = cB.xy / cB.w * 0.5 + 0.5;
  float wB = useB > 0.5 ? sharp(cB, uB, pB, fB, N) * (1.0 - s) : 0.0;
  if (wB > 0.0) wB *= seen(vW, N, pB);
  // the porch (under the canopy, right of the house): the hover photo was painted from a blockout that had no open porch
  // and the landing photo sees its floor edge-on, so mid-flight the porch is the set's own (the fill): the hover photo only
  // leaving the hover, the landing photo only coming in to land
  if (kind == 1 && !proxy && porch()) {
    wB *= 1.0 - smoothstep(0.02, 0.18, s);
    wA *= smoothstep(0.74, 0.94, s); wAbg *= smoothstep(0.74, 0.94, s);
  }
  // a photo much blurrier than the drone's own view of a surface (its texels blown up 2-4.5x on screen: the hover photo on
  // the walls up close, the landing photo on what it saw edge-on, like the floor under the porch) hands over to the fill.
  // On its own projector a photo is 1:1, so the hover and the touchdown stay exact.
  if (kind < 2 && !proxy && (wA > 0.0 || wB > 0.0)) {
    vec3 dc = cameraPosition - vW; float Lc = length(dc);
    float camRes = ${CAM_F.toFixed(1)} * max(dot(N, dc), 0.0) / (Lc * Lc);
    vec3 da = pA - vW, db = pB - vW;
    float keepA = 1.0 - smoothstep(2.0, 4.5, camRes / max(fA * max(dot(N, da), 0.0) / dot(da, da), 1e-3));
    wA *= keepA; wAbg *= keepA;
    wB *= 1.0 - smoothstep(2.0, 4.5, camRes / max(fB * max(dot(N, db), 0.0) / dot(db, db), 1e-3));
  }
  // ── the fill competes in mid-flight (0 on both photos, so each end stays exact): it wins where the photos are smeared
  float wF = kind == 3 || proxy ? 0.0 : (kind == 2 ? 1.0 : kind == 0 ? 3.0 : 1.5) * smoothstep(0.0, 0.3, s) * (1.0 - smoothstep(0.88, 1.0, s));
  // eps only guards the division: at both ends the fill's weight is 0 and a photo's weight can be tiny (the far desert at a
  // grazing angle, in the frame's 8 % edge feather: ~2e-5), and an eps of 1e-4 let the fill win there (a dark streak on the
  // horizon at the right edge of the touchdown frame, 2026-10-26)
  float eps = 1e-8;
  if (dbg > 1.5) { gl_FragColor = vec4(vec3(float(kind < 2 && porch())), 1.0); return; }   // lab ?mask=2: the porch (tools/patch-porch.py)
  if (dbg > 0.5) { gl_FragColor = vec4(vec3(step(0.5, wA / (wA + wAbg + wB + wF + eps))), 1.0); return; }   // lab: where A paints
  vec3 col = fallback(N) * (wF + eps);
  if (wA > 0.0) col += texture2D(tA, uA).rgb * wA;
  if (wAbg > 0.0) col += texture2D(tAbg, uA).rgb * wAbg;
  if (wB > 0.0) col += texture2D(tB, uB).rgb * wB;
  vec3 c = col / (wA + wAbg + wB + wF + eps);
  // the pole sign's light on the lot; gone by touchdown, where the frame has to be the page's own
  if (kind == 0 && lampI > 0.0) { vec2 d = vW.xz - lampP.xz; c += lampC * lampI * exp(-dot(d, d) / (lampR * lampR)) * (1.0 - smoothstep(0.75, 0.95, s)); }
  // the side door's lamp: its light on the wall, the sidewalk and the dirt (only what leaves the shade downward), and the
  // lit pane in the door, over whichever photo paints there. All of it left of x -3.5: the landing frame never looks there.
  if (doorI > 0.0 && kind < 2) {
    vec3 l = doorL - vW; float dd = dot(l, l); vec3 ln = l * inversesqrt(dd);
    float k = doorI * max(dot(N, ln), 0.0) * smoothstep(0.38, 0.62, ln.y) / (0.3 + dd) * (1.0 - smoothstep(-4.1, -3.5, vW.x));
    c += (c * 1.8 + 0.03) * vec3(1.0, 0.64, 0.34) * k;
    vec2 q = (vW.xy - vec2(${f2(DOOR.pane.c[0])}, ${f2(DOOR.pane.c[1])})) / vec2(${f2(DOOR.pane.h[0])}, ${f2(DOOR.pane.h[1])});
    if (kind == 1 && N.z > 0.5 && vW.z < 0.05 && abs(q.x) < 1.0 && abs(q.y) < 1.0) {
      vec2 a = abs(q), aa = fwidth(q);
      float glass = smoothstep(0.06 - aa.x, 0.06 + aa.x, a.x) * smoothstep(0.05 - aa.y, 0.05 + aa.y, a.y)
                  * (1.0 - smoothstep(0.93 - aa.x, 0.93 + aa.x, a.x)) * (1.0 - smoothstep(0.93 - aa.y, 0.93 + aa.y, a.y));   // a cross of bars, a frame
      // each light shows its own stretch of the shop's interior (the landing photo's window right of the radio, x 282-343):
      // jars and the hanging lamp up top, bottles and the kettle below; a little darker, and the dusk faint on the glass
      vec2 l2 = vec2((a.x - 0.06) / 0.87, (q.y > 0.0 ? q.y - 0.05 : q.y + 0.93) / 0.88);
      float row = q.y > 0.0 ? (q.x < 0.0 ? 330.0 : 250.0) : (q.x < 0.0 ? 410.0 : 468.0);
      vec2 uvI = vec2((282.0 + (q.x < 0.0 ? l2.x : 1.0 - l2.x) * 61.0) / 1536.0, 1.0 - (row + (1.0 - l2.y) * 77.0) / 1024.0);
      vec3 inside = texture2D(tA, uvI).rgb * 0.88 + vec3(0.03, 0.035, 0.05) * (1.0 - l2.y);
      c = mix(c, mix(vec3(0.07, 0.085, 0.07), inside, glass), min(1.0, doorI));
    }
  }
  gl_FragColor = vec4(c, 1.0);
}`;

export function makeWorld({ land, landBg, aerial = null, sky, ground, chalkA }) {
  const projA = makeCamera(POSE_A), projB = makeCamera(POSE_B);
  const focal = p => 512 / Math.tan(p.vfov * D2R / 2);   // px on the 1024-high frame
  // the chalkboard panel: rays from A through page-b's .chalk rect, stopped on the board's own plane (feet on the slab)
  const ray = (px, py) => new THREE.Vector3(px / 768 - 1, 1 - py / 512, 0.5).unproject(projA).sub(projA.position).normalize();
  const P = projA.position, k = CHALK.w / CHALK.img[0];
  const feet = ray(CHALK.x + CHALK.w / 2, CHALK.y + CHALK.feet * k), zq = P.z + (0.25 - P.y) / feet.y * feet.z;
  const onBoard = (px, py) => { const d = ray(px, py); return P.clone().addScaledVector(d, (zq - P.z) / d.z); };
  const bx = c => CHALK.x + c * k, by = r => CHALK.y + r * k;
  const corners = [onBoard(bx(0), by(0)), onBoard(bx(420), by(0)), onBoard(bx(0), by(627)), onBoard(bx(420), by(627))];
  const c0 = onBoard(bx(CHALK.core[0]), by(CHALK.core[3])), c1 = onBoard(bx(CHALK.core[2]), by(CHALK.core[1]));
  const boxes = [...OCCLUDERS, [[c0.x, c0.y, zq - 0.02], [c1.x, c1.y, zq + 0.02]]];   // the solid board blocks both photos' view behind it
  const uniforms = {
    tA: { value: land }, tAbg: { value: landBg }, tB: { value: aerial || land }, tSky: { value: sky }, tGround: { value: ground },
    mA: { value: new THREE.Matrix4() }, mB: { value: new THREE.Matrix4() },
    pA: { value: new THREE.Vector3() }, pB: { value: new THREE.Vector3() },
    fA: { value: focal(POSE_A) }, fB: { value: focal(POSE_B) },
    s: { value: 1 }, useB: { value: aerial ? 1 : 0 }, minRes: { value: 0 }, dbg: { value: 0 },
    lampP: { value: new THREE.Vector3() }, lampC: { value: new THREE.Vector3(1, .62, .4) }, lampI: { value: 0 }, lampR: { value: 5 },
    doorL: { value: new THREE.Vector3() }, doorI: { value: 0 },
    tChalkA: { value: chalkA }, chalkZ: { value: zq },
    bmin: { value: boxes.map(b => new THREE.Vector3(...b[0])) },
    bmax: { value: boxes.map(b => new THREE.Vector3(...b[1])) },
  };
  const setProjector = (cam, m, p) => { cam.updateMatrixWorld(true); m.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); p.copy(cam.position); };
  setProjector(projA, uniforms.mA.value, uniforms.pA.value);
  setProjector(projB, uniforms.mB.value, uniforms.pB.value);
  // the uniform objects are shared by every material, so one write reaches all of them
  const mat = kind => new THREE.ShaderMaterial({
    uniforms: { ...uniforms, kind: { value: kind } }, vertexShader: VERT, fragmentShader: FRAG,
    side: kind === 2 ? THREE.BackSide : THREE.FrontSide, toneMapped: false,
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.CircleGeometry(GROUND_R, 96).rotateX(-Math.PI / 2), mat(0)));
  const house = mat(1);
  const [lo, hi] = HOUSE, hm = new THREE.Mesh(new THREE.BoxGeometry(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]), house);
  hm.position.set((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2); scene.add(hm);
  scene.add(new THREE.Mesh(prism(ROOF), house), new THREE.Mesh(prism(SLAB), house));
  const rc = ROOF.xz.reduce((a, p) => [a[0] + p[0] / ROOF.xz.length, a[1] + p[1] / ROOF.xz.length], [0, 0]);
  ROOF.xz.forEach(([x, z], i) => {                       // the parapet: a 16 cm wall, 25 cm high, along every roof edge
    const [x2, z2] = ROOF.xz[(i + 1) % ROOF.xz.length], L = Math.hypot(x2 - x, z2 - z);
    let nx = (z2 - z) / L, nz = -(x2 - x) / L;
    if (nx * (rc[0] - (x + x2) / 2) + nz * (rc[1] - (z + z2) / 2) < 0) { nx = -nx; nz = -nz; }
    scene.add(new THREE.Mesh(prism({ y: [ROOF.y[1], ROOF.y[1] + .25], xz: [[x, z], [x2, z2], [x2 + nx * .16, z2 + nz * .16], [x + nx * .16, z + nz * .16]] }), house));
  });
  for (const [x0, z0, w, h, d] of ROOFTOP) scene.add(new THREE.Mesh(prism({ y: [ROOF.y[1], ROOF.y[1] + h], xz: [[x0, z0], [x0 + w, z0], [x0 + w, z0 + d], [x0, z0 + d]] }), house));
  const board = new THREE.BufferGeometry();
  board.setAttribute('position', new THREE.Float32BufferAttribute(corners.flatMap(v => [v.x, v.y, v.z]), 3));
  board.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  board.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2));
  board.setIndex([0, 2, 1, 2, 3, 1]);
  scene.add(new THREE.Mesh(board, mat(3)));
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(SKY_R, 96, 48), mat(2)));
  return { scene, uniforms, setS(v) { uniforms.s.value = v; } };
}

// a flat-shaded prism from a convex footprint: top, bottom and one quad per side, each face wound to face outward
function prism({ y: [y0, y1], xz }) {
  const pos = [], nor = [], V = THREE.Vector3;
  const face = (pts, n) => {                       // a convex polygon as a fan, flipped if it winds against n
    for (let i = 1; i < pts.length - 1; i++) {
      let [a, b, c] = [pts[0], pts[i], pts[i + 1]];
      if (new V().subVectors(b, a).cross(new V().subVectors(c, a)).dot(n) < 0) [b, c] = [c, b];
      for (const p of [a, b, c]) { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); }
    }
  };
  const top = xz.map(([x, z]) => new V(x, y1, z)), bot = xz.map(([x, z]) => new V(x, y0, z));
  const cx = xz.reduce((a, p) => a + p[0], 0) / xz.length, cz = xz.reduce((a, p) => a + p[1], 0) / xz.length;
  face(top, new V(0, 1, 0)); face(bot, new V(0, -1, 0));
  xz.forEach(([x, z], i) => {
    const [x2, z2] = xz[(i + 1) % xz.length];
    let n = new V(z2 - z, 0, -(x2 - x)).normalize();
    if (n.x * ((x + x2) / 2 - cx) + n.z * ((z + z2) / 2 - cz) < 0) n.negate();
    face([new V(x, y0, z), new V(x2, y0, z2), new V(x2, y1, z2), new V(x, y1, z)], n);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(pos.length / 3 * 2).fill(0), 2));
  return g;
}

export function loadTexture(url, { repeat = false, flip = true } = {}) {
  return new Promise((res, rej) => new THREE.TextureLoader().load(url, t => {
    t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter; t.anisotropy = 8; t.flipY = flip;
    if (repeat) t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
    t.needsUpdate = true; res(t);
  }, undefined, rej));
}
export const loadSet = async ({ aerial = 'img/aerial-blue.webp' } = {}) => {
  const u = p => new URL(p, import.meta.url).href;
  const [land, landBg, sky, ground, chalkA, air] = await Promise.all([
    loadTexture(u('img/land.webp')), loadTexture(u('img/land-bg.webp')),
    loadTexture(u('img/sky.webp'), { repeat: true }), loadTexture(u('img/ground.webp'), { repeat: true }),
    loadTexture(u('img/land-chalk.png')),
    aerial ? loadTexture(u(aerial)).catch(() => null) : null,
  ]);
  return { land, landBg, sky, ground, chalkA, aerial: air };
};
export { THREE };
