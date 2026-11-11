// The coupe's look as data (Dan 2026-11-11: "a bench for the car ... control over wear, texture and other").
// One settings object (CAR_DEF) drives the paint, the glass, the chrome, the trim, the wear, the decals, the tail lamps
// and the plate. The wear is drawn in the materials' own shaders from the car's position (the coupe has no UVs), so
// every value is live and nothing is painted or paid for; a painted picture can be laid over the paint (the slot).
// Used by car-bench.html on the real room (room.html?expose). To put a look in the room for visitors:
//   import { createCarLook } from './car-look.js';
//   const carLook = createCarLook({ car: R.car, tailMat: R.tailMat }); carLook.set(<the bench's copied settings>);
//   and carLook.tick() once a frame before the render.
// At CAR_DEF the car is the room's car as built (every wear and decal at 0).
import * as THREE from 'three';

export const CAR_DEF = {
  // paint
  paintCol: '#141417', paintRough: 0.12, paintMetal: 0, coat: 1, coatRough: 0.05, paintEnv: 2.6,
  flake: 0, flakeSize: 1.2, flakeCol: '#c9ccd4',
  // wear, drawn by code (each 0..1; wear = the master)
  wear: 1, seed: 1, grain: 1,
  dust: 0, dustCol: '#8f8474', mud: 0, mudH: 0.45, mudCol: '#3b2f23',
  swirls: 0, scratches: 0, chips: 0, rust: 0, rustCol: '#7d3f1c', fade: 0, streaks: 0,
  // the painted texture slot (a picture over the paint, laid on from three sides)
  texSrc: '', texAmt: 0, texScale: 1, texMode: 0, texMatte: 0.5, // texMode: 0 paint over · 1 screen (lighter) · 2 multiply (darker)
  // glass, chrome + wheels, trim + tyres
  glassCol: '#1a1d22', glassRough: 0.03, glassEnv: 2.2, glassWear: 1,
  chromeCol: '#e5e5e8', chromeRough: 0.14, chromeEnv: 1.4, chromeWear: 1,
  trimCol: '#181819', trimRough: 0.62, trimWear: 1,
  // decals
  stripe: 0, stripeW: 0.16, stripeGap: 0.06, stripeX: 0, stripeCol: '#e9e3d2',
  num: 0, numText: '27', numZ: -0.25, numY: 0.62, numSize: 0.5, numBg: '#f1ead8', numFg: '#141414', numSide: 0,
  stk: 0, stkSrc: '', stkZ: 0.9, stkY: 0.6, stkSize: 0.3, stkRot: 0, stkSide: 0, // sides: 0 both · 1 aisle side · 2 far side · 3 on top
  decalWear: 0,
  // lamps + plate
  tail: 1, tailCol: '#ff3930', plate: 1, plateWear: 1,
};

const ROLES = { paint: 0, black: 1, glass: 2, metal: 3, plate: 4, plate_bolt: 4 };
const VERT_PARS = /* glsl */`
uniform mat4 uCarInv;
varying vec3 vCarP;
varying vec3 vCarN;
`;
const VERT_MAIN = /* glsl */`
vec4 carP4 = vec4( transformed, 1.0 ); vec3 carN3 = objectNormal;
#ifdef USE_INSTANCING
  carP4 = instanceMatrix * carP4; carN3 = mat3( instanceMatrix ) * carN3;
#endif
vCarP = ( uCarInv * modelMatrix * carP4 ).xyz;
vCarN = mat3( uCarInv ) * mat3( modelMatrix ) * carN3;
`;
const FRAG_PARS = /* glsl */`
varying vec3 vCarP;
varying vec3 vCarN;
uniform float uWear, uSeed, uGrain, uRoleWear;
uniform float uDust, uMud, uMudH, uSwirls, uScratches, uChips, uRust, uFade, uStreaks;
uniform vec3 uDustCol, uMudCol, uRustCol;
uniform float uFlake, uFlakeSize; uniform vec3 uFlakeCol;
uniform sampler2D uTex; uniform float uTexAmt, uTexScale, uTexMode, uTexMatte;
uniform float uStripe, uStripeW, uStripeGap, uStripeX; uniform vec3 uStripeCol;
uniform sampler2D uNumTex; uniform float uNum, uNumSize, uNumSide; uniform vec2 uNumPos;
uniform sampler2D uStkTex; uniform float uStk, uStkSize, uStkRot, uStkSide, uStkAspect; uniform vec2 uStkPos;
uniform float uDecalWear;
float carCoat = 1.0, carCoatRough = 0.0, carBump = 0.0; // carBump: the layers' relief, in metres
vec3 carFlakeN = vec3( 0.0 );
float cH( vec3 p ) { p = fract( p * 0.3183099 + vec3( 0.1, 0.2, 0.3 ) ); p *= 17.0; return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) ); }
float cN( vec3 x ) { vec3 i = floor( x ), f = fract( x ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( mix( cH( i ), cH( i + vec3( 1, 0, 0 ) ), f.x ), mix( cH( i + vec3( 0, 1, 0 ) ), cH( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
              mix( mix( cH( i + vec3( 0, 0, 1 ) ), cH( i + vec3( 1, 0, 1 ) ), f.x ), mix( cH( i + vec3( 0, 1, 1 ) ), cH( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z ); }
float cF( vec3 p ) { float a = 0.5, s = 0.0; for ( int i = 0; i < 4; i ++ ) { s += a * cN( p ); p = p * 2.03 + vec3( 7.1, 3.3, 5.7 ); a *= 0.5; } return s / 0.9375; }
// thin lines running one way (dir), every 1 / freq metres; fades to its mean where a line is thinner than a pixel
float cLines( vec3 P, vec3 dir, vec3 along, float freq, float thin ) {
  float c = dot( P, dir ) * freq, l = cN( vec3( c, dot( P, along ) * freq * 0.012, dot( P, cross( dir, along ) ) * freq * 0.012 ) );
  float line = smoothstep( 1.0 - thin, 1.0 - thin * 0.4, l ), vis = clamp( 1.0 - fwidth( c ) * 1.1, 0.0, 1.0 );
  return mix( thin * 0.55, line, vis );
}
// a picture on the car's sides (read left to right from outside, on both) or on top; pos = along the car (z), up (y) or across (x)
vec4 cDecal( sampler2D t, vec3 P, vec3 N, vec2 pos, float size, float aspect, float rot, float side ) {
  vec2 uv; float m;
  if ( side > 2.5 ) { uv = vec2( - ( P.z - pos.x ), - ( P.x - pos.y ) ); m = smoothstep( 0.3, 0.55, N.y ); }
  else { float sg = N.x > 0.0 ? 1.0 : - 1.0; uv = vec2( - sg * ( P.z - pos.x ), P.y - pos.y ); m = smoothstep( 0.3, 0.55, abs( N.x ) );
    if ( side > 0.5 && side < 1.5 && sg < 0.0 ) m = 0.0; if ( side > 1.5 && sg > 0.0 ) m = 0.0; }
  float c = cos( rot ), s = sin( rot ); uv = mat2( c, - s, s, c ) * uv / size; uv.x /= aspect; uv += 0.5;
  vec4 d = texture2D( t, clamp( uv, 0.0, 1.0 ) );
  vec2 e = fwidth( uv ) + 1e-5, in2 = smoothstep( vec2( 0.0 ), e, uv ) * smoothstep( vec2( 0.0 ), e, 1.0 - uv );
  d.a *= m * in2.x * in2.y; return d;
}
`;
// after the material's own colour, roughness and metalness: the layers, bottom to top
const FRAG_LOOK = /* glsl */`
{
  vec3 P = vCarP, N = normalize( vCarN ), col = diffuseColor.rgb;
  vec3 q = P * uGrain + uSeed * vec3( 3.7, 1.3, 5.1 );
  float W = uWear * uRoleWear, up = clamp( N.y, 0.0, 1.0 ), side = 1.0 - abs( N.y );
  float rough = roughnessFactor, metal = metalnessFactor, chip = 0.0, fadeM = 0.0;
  #if CAR_ROLE == 0
    if ( uFlake > 0.001 ) { // metal flake under the lacquer: bright specks, each tilted its own way
      vec3 fp = P * ( 1000.0 / uFlakeSize ), fc = floor( fp ); float fm = step( 0.62, cH( fc ) );
      float fv = clamp( 1.0 - length( fwidth( fp ) ) * 0.45, 0.0, 1.0 ), fa = uFlake * mix( 0.3, fm, fv );
      col = mix( col, uFlakeCol, fa * 0.45 ); metal = mix( metal, 1.0, fa ); rough = mix( rough, max( rough, 0.3 ), fa );
      carFlakeN = ( vec3( cH( fc + 11.0 ), cH( fc + 23.0 ), cH( fc + 37.0 ) ) - 0.5 ) * uFlake * fm * fv * 0.9;
    }
    if ( uTexAmt > 0.001 ) { // the painted picture, from three sides
      vec3 w = pow( abs( N ), vec3( 4.0 ) ); w /= w.x + w.y + w.z; vec3 tp = P * uTexScale;
      vec3 t = texture2D( uTex, tp.zy ).rgb * w.x + texture2D( uTex, tp.xz ).rgb * w.y + texture2D( uTex, tp.xy ).rgb * w.z;
      vec3 m = uTexMode < 0.5 ? t : uTexMode < 1.5 ? 1.0 - ( 1.0 - col ) * ( 1.0 - t ) : col * t * 2.0;
      col = mix( col, m, uTexAmt ); float k = uTexAmt * uTexMatte;
      rough = mix( rough, 0.85, k ); carCoat *= 1.0 - k; metal *= 1.0 - k;
    }
    { // decals: stripes over the top, a number on the doors, a sticker
      float dw = 1.0;
      if ( uDecalWear > 0.001 ) { float dn = cF( q * 7.0 + 4.0 ) * 0.7 + cN( q * 60.0 ) * 0.3; dw = 1.0 - smoothstep( 1.0 - uDecalWear * 0.75, 1.03 - uDecalWear * 0.75, dn ); }
      if ( uStripe > 0.001 ) {
        float sx = abs( P.x - uStripeX ), e = fwidth( P.x ) + 1e-5, a = uStripeGap * 0.5, b = a + uStripeW;
        float st = smoothstep( a - e, a + e, sx ) * ( 1.0 - smoothstep( b - e, b + e, sx ) );
        if ( uStripeGap < 0.002 ) st = 1.0 - smoothstep( b - e, b + e, sx );
        st *= ( 1.0 - smoothstep( 0.8, 0.95, abs( N.x ) ) ) * smoothstep( 0.2, 0.3, P.y ) * dw * uStripe;
        col = mix( col, uStripeCol, st );
      }
      if ( uNum > 0.001 ) { vec4 d = cDecal( uNumTex, P, N, uNumPos, uNumSize, 1.0, 0.0, uNumSide ); float a = d.a * dw * uNum; col = mix( col, d.rgb, a ); metal *= 1.0 - a; }
      if ( uStk > 0.001 ) { vec4 d = cDecal( uStkTex, P, N, uStkPos, uStkSize, uStkAspect, uStkRot, uStkSide ); float a = d.a * dw * uStk; col = mix( col, d.rgb, a ); metal *= 1.0 - a; }
    }
    if ( uFade * W > 0.001 ) { // the lacquer gone in patches, from the sun-facing panels down: dull paint, a chalky edge
      float f = uFade * W, m = cF( q * 0.9 + 2.0 ) * 0.85 + up * 0.5 - 0.2, th = 1.12 - f * 1.05;
      fadeM = smoothstep( th, th + 0.07, m ); float ring = fadeM * ( 1.0 - fadeM ) * 4.0;
      col = mix( col, col * 0.9 + 0.035, fadeM ); col = mix( col, vec3( 0.42, 0.41, 0.39 ), ring * 0.55 );
      rough = mix( rough, 0.72, fadeM ); carCoat *= 1.0 - fadeM; carCoatRough += ring * 0.4 + f * 0.12 * up; carBump += fadeM * 0.0002;
    }
    if ( uSwirls * W > 0.001 ) { // wash swirls: hairlines in the lacquer, they haze the reflections
      float s = cLines( q, vec3( 0.80, 0.10, 0.59 ), vec3( 0.0, 1.0, 0.0 ), 1400.0, 0.5 ) + cLines( q, vec3( 0.31, 0.74, - 0.60 ), vec3( 1.0, 0.0, 0.0 ), 1100.0, 0.5 ) + cLines( q, vec3( - 0.52, 0.42, 0.74 ), vec3( 0.0, 0.0, 1.0 ), 1700.0, 0.5 );
      carCoatRough += uSwirls * W * ( 0.06 + 0.15 * s ) * ( 0.6 + 0.8 * cF( q * 1.6 ) );
    }
    if ( uScratches * W > 0.001 ) { // key and brush scratches: down to the primer
      float k = uScratches * W, thin = 0.03 + 0.1 * k;
      float s = max( cLines( q, vec3( 0.12, 0.99, 0.05 ), vec3( 0.0, 0.0, 1.0 ), 150.0, thin ), max( cLines( q, vec3( 0.45, 0.80, 0.39 ), vec3( 1.0, 0.0, 0.0 ), 110.0, thin ), cLines( q + 3.0, vec3( 0.70, 0.10, - 0.70 ), vec3( 0.0, 1.0, 0.0 ), 90.0, thin * 0.7 ) ) );
      s *= smoothstep( 0.35, 0.6, cF( q * 1.3 + 9.0 ) + k * 0.35 );
      col = mix( col, vec3( 0.36, 0.36, 0.35 ), s * 0.85 ); rough = mix( rough, 0.6, s ); carCoat *= 1.0 - s; metal *= 1.0 - s;
    }
    if ( uChips * W > 0.001 ) { // stone chips: the nose and the sills first
      float k = uChips * W, nose = clamp( ( 0.6 - P.z ) / 2.8, 0.0, 1.0 ) * clamp( 0.35 - N.z, 0.0, 1.0 ), low = 1.0 - smoothstep( 0.22, 0.6, P.y );
      float wgt = clamp( 0.12 + nose * 0.9 + low * 0.55, 0.0, 1.0 ), c = cN( q * 85.0 ) * 0.75 + cN( q * 31.0 ) * 0.25, th = 1.0 - k * wgt * 0.46;
      chip = smoothstep( th, th + 0.035, c ) * clamp( 1.0 - length( fwidth( q * 85.0 ) ) * 0.3, 0.25, 1.0 );
      col = mix( col, mix( vec3( 0.34, 0.33, 0.31 ), vec3( 0.05 ), smoothstep( th + 0.03, th + 0.1, c ) ), chip ); rough = mix( rough, 0.7, chip ); carCoat *= 1.0 - chip; metal *= 1.0 - chip; carBump -= chip * 0.0005;
    }
  #endif
  #if CAR_ROLE == 1
    if ( uFade * W > 0.001 ) { float f = uFade * W * ( 0.45 + 0.55 * up ); col = mix( col, vec3( 0.13, 0.13, 0.125 ), f * ( 0.35 + 0.4 * cF( q * 2.0 ) ) ); rough = mix( rough, 0.92, f ); } // sun-greyed plastic and rubber
  #endif
  #if CAR_ROLE == 2
    if ( uSwirls * W > 0.001 ) rough += uSwirls * W * 0.08 * ( 0.4 + cLines( q, vec3( 0.80, 0.10, 0.59 ), vec3( 0.0, 1.0, 0.0 ), 1400.0, 0.5 ) ); // wiper haze
  #endif
  #if CAR_ROLE == 0 || CAR_ROLE == 3
    if ( uRust * W > 0.001 ) { // rust: up from the sills and the arches, out of the chips and the peeled patches; pitting on the chrome
      float k = uRust * W;
      #if CAR_ROLE == 3
        float m = cF( q * 22.0 + 11.0 ) * 0.55 + cN( q * 150.0 ) * 0.5, th = 1.0 - k * 0.42;
      #else
        float m = cF( q * 1.7 + 11.0 ) * 0.6 + cF( q * 8.0 + 3.0 ) * 0.22 + ( 1.0 - smoothstep( 0.18, 0.8, P.y ) ) * 0.45 + chip * 0.3 + fadeM * 0.14, th = 1.22 - k * 0.9;
      #endif
      float r = smoothstep( th, th + 0.09, m ), edge = r * ( 1.0 - r ) * 4.0;
      float rg = cN( q * 150.0 ); vec3 rc = mix( uRustCol * 0.25, uRustCol * 1.3, cF( q * 13.0 ) ) * ( 0.6 + 0.8 * rg );
      col = mix( col, rc, r ); col = mix( col, uRustCol * 0.12, edge * 0.5 ); rough = mix( rough, 0.96, r ); metal *= 1.0 - r; carCoat *= 1.0 - r; carCoatRough += edge * 0.3; carBump += r * ( 0.0004 + rg * 0.0011 + cF( q * 34.0 ) * 0.0012 );
    }
  #endif
  if ( uStreaks * W > 0.001 ) { // rain and dirt run down the sides
    float h = P.z * N.x - P.x * N.z, s = smoothstep( 0.5, 0.95, cN( vec3( h * 26.0 + uSeed, P.y * 1.3, 2.0 ) ) * 0.7 + cN( vec3( h * 71.0, P.y * 2.6, 5.0 ) ) * 0.4 );
    s *= side * side * uStreaks * W * ( 0.55 + 0.45 * smoothstep( 0.2, 1.1, P.y ) );
    col = mix( col, uDustCol * 0.8, s * 0.5 ); rough = mix( rough, 0.8, s * 0.7 ); carCoatRough += s * 0.45; carCoat *= 1.0 - s * 0.5;
  }
  if ( uMud * W > 0.001 ) { // road grime and mud: thrown up from the wheels, thinning with height
    float k = uMud * W, wz = min( abs( P.z - 1.3 ), abs( P.z + 1.3 ) ), hgt = uMudH * ( 1.0 + 0.45 * ( 1.0 - smoothstep( 0.25, 0.95, wz ) ) );
    float body = 1.0 - smoothstep( 0.0, hgt, P.y + ( cF( q * 2.3 + 5.0 ) - 0.5 ) * hgt * 0.9 );
    float spl = smoothstep( 0.66, 0.74, cN( q * 21.0 ) * 0.6 + cN( q * 9.0 ) * 0.4 ) * ( 1.0 - smoothstep( hgt * 0.5, hgt * 1.9, P.y ) );
    float m = clamp( max( body * ( 0.55 + 0.6 * cF( q * 6.0 ) ), spl * 0.9 ) * k * 1.7, 0.0, 1.0 );
    float mg = cF( q * 48.0 ); col = mix( col, uMudCol * ( 0.55 + 0.6 * cF( q * 13.0 ) + 0.4 * mg ), m ); rough = mix( rough, 0.97, m ); metal *= 1.0 - m; carCoat *= 1.0 - m; carBump += m * ( 0.001 + mg * 0.003 );
  }
  if ( uDust * W > 0.001 ) { // dust: settles on what faces up, a film on the rest
    float d = clamp( uDust * W * ( 0.2 + 0.9 * pow( up, 0.7 ) ) * ( 0.45 + 1.0 * cF( q * 3.1 + 8.0 ) ) * ( 0.8 + 0.4 * cN( q * 26.0 ) ) * 1.3, 0.0, 1.0 );
    col = mix( col, uDustCol * ( 0.85 + 0.3 * cN( q * 40.0 ) ), d * 0.9 ); rough = mix( rough, 0.92, d ); metal *= 1.0 - d * 0.85; carCoat *= 1.0 - d * 0.9; carCoatRough += d * 0.5;
  }
  diffuseColor.rgb = col; roughnessFactor = clamp( rough, 0.0, 1.0 ); metalnessFactor = clamp( metal, 0.0, 1.0 );
}
`;
const FRAG_NORMAL = /* glsl */`
normal = normalize( normal + carFlakeN );
{ // the layers' relief (rust scale, caked mud, chip pits) tilts the paint's normal; the lacquer over it stays smooth
  vec3 sx = dFdx( - vViewPosition ), sy = dFdy( - vViewPosition ), r1 = cross( sy, normal ), r2 = cross( normal, sx );
  float det = dot( sx, r1 ); vec3 g = sign( det ) * ( dFdx( carBump ) * r1 + dFdy( carBump ) * r2 );
  normal = normalize( abs( det ) * normal - g );
}
`;
const FRAG_COAT = /* glsl */`
#ifdef USE_CLEARCOAT
  material.clearcoat *= carCoat;
  material.clearcoatRoughness = clamp( material.clearcoatRoughness + carCoatRough, 0.005, 1.0 );
#endif
`;

export function createCarLook({ car, tailMat }) {
  const u = (v) => ({ value: v }), col = () => u(new THREE.Color());
  const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 0]), 1, 1); blank.needsUpdate = true;
  const U = {
    uCarInv: u(new THREE.Matrix4()), uWear: u(1), uSeed: u(1), uGrain: u(1),
    uDust: u(0), uMud: u(0), uMudH: u(0.45), uSwirls: u(0), uScratches: u(0), uChips: u(0), uRust: u(0), uFade: u(0), uStreaks: u(0),
    uDustCol: col(), uMudCol: col(), uRustCol: col(),
    uFlake: u(0), uFlakeSize: u(1), uFlakeCol: col(),
    uTex: u(blank), uTexAmt: u(0), uTexScale: u(1), uTexMode: u(0), uTexMatte: u(0.5),
    uStripe: u(0), uStripeW: u(0.16), uStripeGap: u(0.06), uStripeX: u(0), uStripeCol: col(),
    uNumTex: u(blank), uNum: u(0), uNumSize: u(0.5), uNumSide: u(0), uNumPos: u(new THREE.Vector2()),
    uStkTex: u(blank), uStk: u(0), uStkSize: u(0.3), uStkRot: u(0), uStkSide: u(0), uStkAspect: u(1), uStkPos: u(new THREE.Vector2()),
    uDecalWear: u(0),
  };
  // the car's own materials by name (the room's drawn stand-in parts are unnamed and hidden); one wear uniform per role
  const M = {}, roleWear = [u(1), u(1), u(1), u(1), u(1)]; let plateRoot = null;
  car.traverse((o) => {
    if (!o.isMesh) return;
    const mt = o.material, role = mt && ROLES[mt.name];
    if (role == null) return;
    if (role === 4) plateRoot = o.parent;
    (M[mt.name] ||= []).includes(mt) || M[mt.name].push(mt);
    if (mt.userData.carLook) return;
    mt.userData.carLook = true;
    mt.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U, { uRoleWear: roleWear[role] });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VERT_PARS).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VERT_MAIN);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n#define CAR_ROLE ' + role + '\n' + FRAG_PARS)
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n' + FRAG_LOOK)
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + FRAG_NORMAL)
        .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n' + FRAG_COAT);
    };
    mt.customProgramCacheKey = () => 'carLook5:' + role;
    mt.needsUpdate = true;
  });
  const each = (name, fn) => (M[name] || []).forEach(fn);
  const loader = new THREE.TextureLoader(), pics = {};
  const picture = (key, src, uni, repeat, done) => { // a picture slot: loaded once per source, the blank one while empty
    if (pics[key] === src) return; pics[key] = src;
    if (!src) { uni.value = blank; done && done(null); return; }
    loader.load(src, (t) => { if (pics[key] !== src) { t.dispose(); return; }
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
      uni.value = t; done && done(t); }, undefined, () => console.warn('car look: no picture at', String(src).slice(0, 80)));
  };
  // the door number: a roundel and its digits, drawn here (Bebas Neue, the room's own face)
  const numCv = document.createElement('canvas'); numCv.width = numCv.height = 512;
  const numTex = new THREE.CanvasTexture(numCv); numTex.colorSpace = THREE.SRGBColorSpace; numTex.anisotropy = 8; U.uNumTex.value = numTex;
  let numKey = '';
  const drawNum = (s) => {
    const key = [s.numText, s.numBg, s.numFg].join('|'); if (key === numKey) return; numKey = key;
    const g = numCv.getContext('2d'), txt = String(s.numText ?? '').slice(0, 3);
    g.clearRect(0, 0, 512, 512); g.fillStyle = s.numBg; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
    g.fillStyle = s.numFg; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    let px = 400; do { g.font = `400 ${px}px "Bebas Neue", Impact, sans-serif`; px -= 10; } while (g.measureText(txt).width > 370 && px > 60);
    const mt = g.measureText(txt), h = mt.actualBoundingBoxAscent + mt.actualBoundingBoxDescent;
    g.fillText(txt, 256, 256 + h / 2 - mt.actualBoundingBoxDescent);
    numTex.needsUpdate = true;
  };
  if (document.fonts && document.fonts.load) document.fonts.load('400 100px "Bebas Neue"').then(() => { numKey = ''; if (last) drawNum(last); }).catch(() => {});
  const tailOff = new THREE.Color(0.02, 0.003, 0.002), tailOn = new THREE.Color();
  let last = null;
  function set(s) {
    last = s = { ...CAR_DEF, ...s };
    each('paint', (m) => { m.color.set(s.paintCol); m.roughness = s.paintRough; m.metalness = s.paintMetal; m.clearcoat = Math.max(0.001, s.coat); m.clearcoatRoughness = s.coatRough; m.userData.env = s.paintEnv; });
    each('glass', (m) => { m.color.set(s.glassCol); m.roughness = s.glassRough; m.userData.env = s.glassEnv; });
    each('metal', (m) => { m.color.set(s.chromeCol); m.roughness = s.chromeRough; m.userData.env = s.chromeEnv; });
    each('black', (m) => { m.color.set(s.trimCol); m.roughness = s.trimRough; });
    [1, s.trimWear, s.glassWear, s.chromeWear, s.plateWear].forEach((v, i) => { roleWear[i].value = v; });
    for (const [k, key] of [['uWear', 'wear'], ['uSeed', 'seed'], ['uGrain', 'grain'], ['uDust', 'dust'], ['uMud', 'mud'], ['uMudH', 'mudH'], ['uSwirls', 'swirls'], ['uScratches', 'scratches'],
      ['uChips', 'chips'], ['uRust', 'rust'], ['uFade', 'fade'], ['uStreaks', 'streaks'], ['uFlake', 'flake'], ['uFlakeSize', 'flakeSize'], ['uTexAmt', 'texAmt'], ['uTexScale', 'texScale'],
      ['uTexMode', 'texMode'], ['uTexMatte', 'texMatte'], ['uStripe', 'stripe'], ['uStripeW', 'stripeW'], ['uStripeGap', 'stripeGap'], ['uStripeX', 'stripeX'], ['uNum', 'num'],
      ['uNumSize', 'numSize'], ['uNumSide', 'numSide'], ['uStk', 'stk'], ['uStkSize', 'stkSize'], ['uStkSide', 'stkSide'], ['uDecalWear', 'decalWear']]) U[k].value = +s[key];
    for (const [k, key] of [['uDustCol', 'dustCol'], ['uMudCol', 'mudCol'], ['uRustCol', 'rustCol'], ['uFlakeCol', 'flakeCol'], ['uStripeCol', 'stripeCol']]) U[k].value.set(s[key]);
    U.uNumPos.value.set(s.numZ, s.numY); U.uStkPos.value.set(s.stkZ, s.stkY); U.uStkRot.value = s.stkRot * Math.PI / 180;
    if (!s.texSrc) U.uTexAmt.value = 0; if (!s.stkSrc) U.uStk.value = 0;
    picture('tex', s.texSrc, U.uTex, true);
    picture('stk', s.stkSrc, U.uStkTex, false, (t) => { U.uStkAspect.value = t ? t.image.width / t.image.height : 1; });
    drawNum(s);
    if (plateRoot) plateRoot.visible = !!s.plate;
    tailOn.set(s.tailCol);
  }
  function tick() { // once a frame, after the room has placed the car and set its lamps
    U.uCarInv.value.copy(car.matrixWorld).invert();
    if (tailMat && last) { const c = tailMat.color.copy(tailOn).multiplyScalar(last.tail); c.r = Math.max(c.r, tailOff.r); c.g = Math.max(c.g, tailOff.g); c.b = Math.max(c.b, tailOff.b); }
  }
  set(CAR_DEF);
  return { set, tick, uniforms: U, materials: M, get plate() { return plateRoot; } };
}
