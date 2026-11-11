# writes a scout.mjs spec for the studio corner (task 3): python3 -I corner_spec.py <out.json> <set> [mon=m1|m2|block]
#   [kit=k1|k2|block] [throne=1|0] [shots=walk60,mon,kit,corner]
# The desk (E01) and chair (N34) are the room's own models now (main be853d1), so every still waits for them.
# Monitors go through the room's OWN loader (?model=E02:assets/models/scout/... , served from the scout dir by
# scout.mjs's route), so the fit, the shiny rule and the LED glow are exactly what MODELS will do. The stands, the kit and
# the throne can't (the stand is the block's procedural child; E07/E08 are Groups and the loader reads it.obj.geometry),
# so the patch adds them by hand with the room's rule (shadows; its reflection on parts with metalness > 0.3 or
# roughness < 0.5, intensity S.probe; emissive into R.modelGlow).
import sys, json

out, set_name = sys.argv[1], sys.argv[2]
kv = dict(a.split('=', 1) for a in sys.argv[3:])
mon, kit, throne = kv.get('mon', 'block'), kv.get('kit', 'block'), kv.get('throne', '1' if kv.get('kit', 'block') != 'block' else '0') == '1'
shots = kv.get('shots', 'walk60,mon,kit,corner').split(',')
CAMS = {  # x, y, z, look x, y, z (the room's camera: 43 deg vertical, so a frame ~1.41 x distance wide)
    'mon': (0.03, 1.45, 2.85, 0.03, 1.3, 0.5),         # the pair on their stands, straight on, the TV between
    'kit': (-0.6, 1.4, 2.75, -1.85, 0.5, 1.0),          # the kit three-quarter from the aisle, floor to cymbals
    'kitclose': (-0.85, 1.35, 2.15, -1.85, 0.55, 1.0),  # closer: shells, hoops, lugs, cymbals
    'corner': (-0.3, 1.9, 4.0, -0.6, 0.95, 0.8),        # desk + both monitors + kit + throne + chair
}
for k, v in kv.items():
    if k.startswith('cam_'): CAMS[k[4:]] = tuple(float(x) for x in v.split(','))

query, need = '', ['E01', 'N34']
if mon != 'block':
    src = f'assets/models/scout/candidates/monitor_{mon}/monitor_{mon}.glb'
    query = f'&model=E02:{src}&model=E03:{src}'; need += ['E02', 'E03']
STAND = f"'/__scout/candidates/monitor_{mon}/monitor_stand_{mon}.glb'" if mon != 'block' else 'null'
KIT = f"'/__scout/candidates/drumkit_{kit}/drumkit_{kit}.glb'" if kit != 'block' else 'null'
THRONE = "'/__scout/candidates/drum_throne/drum_throne.glb'" if throne else 'null'

body = r"""
const THREE = await import('three');
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
const load = (url) => new Promise((res, rej) => new GLTFLoader().load(url, res, undefined, rej));
const it = (id) => X.R.items.find((i) => i.id === id), env = X.R.probe.env.texture;
const NEED = %s, STAND = %s, KIT = %s, THRONE = %s;
for (let t = 0; t < 400 && !NEED.every((id) => it(id) && it(id).model); t++) await new Promise((r) => setTimeout(r, 100));
const report = { loaded: NEED.filter((id) => it(id).model), missing: NEED.filter((id) => !it(id).model) };
const tris = (o) => { let n = 0; o.traverse((m) => { if (m.isMesh) n += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3 * (m.isInstancedMesh ? m.count : 1); }); return n; };
const box = (o) => { o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(o, true); return b.min.toArray().concat(b.max.toArray()).map((v) => +v.toFixed(3)); };
function dress(root) { // the room's rule for its models (loadModels): shadows, its reflection on shiny parts only, LEDs power on with it
  root.traverse((o) => { if (!o.isMesh) return; o.castShadow = o.receiveShadow = true;
    for (const mt of [o.material].flat()) {
      if (mt.metalness > 0.3 || mt.roughness < 0.5) { mt.envMap = env; mt.envMapIntensity = X.S.probe; mt.needsUpdate = true; }
      if (mt.emissive && mt.emissive.getHex() && !(X.R.modelGlow ||= []).some((g) => g.m === mt)) X.R.modelGlow.push({ m: mt, k: mt.emissiveIntensity });
    } });
}
if (STAND) {
  const g = (await load(STAND)).scene;
  for (const id of ['E02', 'E03']) {
    const i = it(id), s = i.s, k = i.obj.scale.x, len = (i.obj.position.y - s.h * k / 2) / k, st = g.clone(true);
    dress(st); st.scale.y = len / 1.29; st.position.y = -s.h / 2 - len; st.name = 'scout_stand';
    if (i.stand) i.stand.visible = false;
    i.obj.add(st);
    report[id] = { model: i.model ? tris(i.model) : 0, stand: tris(st), standLen: +len.toFixed(3), toe: +i.obj.rotation.y.toFixed(3) };
  }
}
for (const [id, url] of [['E07', KIT], ['E08', THRONE]]) {
  if (!url) continue;
  const g = (await load(url)).scene, i = it(id);
  dress(g); g.name = 'scout_' + id;
  for (const c of [...i.obj.children]) c.visible = false; // the procedural kit / throne
  i.obj.add(g);
  report[id] = { tris: tris(g), rotY: +i.obj.rotation.y.toFixed(3), at: i.obj.position.toArray().map((v) => +v.toFixed(3)) };
}
X.arrange(); X.R.probe.due = performance.now() + 50;
for (const id of ['E02', 'E03', 'E07', 'E08']) (report.box ||= {})[id] = box(it(id).obj);
""" % (json.dumps(need), STAND, KIT, THRONE)
cam = r"""
const cam = X.camera; cam.position.set = function () { return this; }; cam.rotation.set = function () { return this; };
cam.position.x = %s; cam.position.y = %s; cam.position.z = %s; cam.updateMatrixWorld(); cam.lookAt(%s, %s, %s); cam.updateMatrixWorld();
"""
spec = []
for sh in shots:
    e = {'name': f'{set_name}__{sh}', 'query': query, 'wait': 2600}
    if sh.startswith('walk'):
        e['walk'] = int(sh[4:]) / 100; e['patch'] = body + 'return report;\n'
    else:
        e['walk'] = float(kv.get('closewalk', '0.7')); e['patch'] = body + (cam % CAMS[sh]) + 'return report;\n'
    spec.append(e)
json.dump(spec, open(out, 'w'), indent=1)
print(out, len(spec), 'shots', mon, kit, throne)
