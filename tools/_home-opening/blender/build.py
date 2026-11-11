# The room in Blender (todo step 2), from export.mjs's room.glb + room-meta.json:
#   Blender -b --factory-startup -P tools/_home-opening/blender/build.py -- <room.glb> <room-meta.json> <out.blend> <parity.json>
# Imports the room (glTF +Y up -> Blender +Z up, metres; lights Unitless: W = cd x 4 pi, tech-recipe s7), puts each light
# group in its own collection (neonL, neonR, lamps, tv, sign, door, props: the bake's groups), makes the walk camera
# per screen size at each station, then the parity check: every slot's box corners projected by Blender's camera vs
# three.js's own projection of the same corners (room-meta.json), in pixels. Pass = under 0.5 px.
import bpy, json, sys, math
from mathutils import Matrix, Quaternion, Vector
from bpy_extras.object_utils import world_to_camera_view

glb, meta_path, out_blend, out_json = sys.argv[sys.argv.index('--') + 1:]
meta = json.load(open(meta_path))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb, export_import_convert_lighting_mode='COMPAT')
scene = bpy.context.scene

# light groups -> collections (a light's name is L:<group>:<n>; a mesh may carry a 'group' extra)
def coll(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in scene.collection.children: scene.collection.children.link(c)
    return c
for o in list(scene.objects):
    g = o.name.split(':')[1] if o.type == 'LIGHT' and o.name.startswith('L:') else o.get('group')
    if g:
        c = coll('light_' + g)
        for u in list(o.users_collection): u.objects.unlink(o)
        c.objects.link(o)

# three.js (x, y, z) -> Blender (x, -z, y); cameras look down -Z in both, so the rotation carries over through C
C = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))
cams = coll('cameras')
report = {'screens': {}, 'pass_px': 0.5}
for key, sc in meta['screens'].items():
    w, h = sc['w'], sc['h']
    scene.render.resolution_x, scene.render.resolution_y, scene.render.pixel_aspect_x = w, h, 1
    for st in sc['stations']:
        cd = bpy.data.cameras.new(f'CAM_{key}_{st["p"]}')
        cd.sensor_fit = 'VERTICAL'; cd.angle_y = math.radians(st['fov']); cd.clip_start, cd.clip_end = st['near'], st['far']
        cam = bpy.data.objects.new(cd.name, cd); cams.objects.link(cam)
        x, y, z, qw = st['quat'][0], st['quat'][1], st['quat'][2], st['quat'][3]
        rot = C @ Quaternion((qw, x, y, z)).to_matrix()
        cam.matrix_world = Matrix.Translation(C @ Vector(st['pos'])) @ rot.to_4x4()
        bpy.context.view_layer.update()
        errs = []
        for sid, three_px in st['px'].items():
            o = bpy.data.objects.get(sid)
            if not o: errs.append((1e9, sid, 'missing')); continue
            pts = [d.matrix_world @ v.co for d in [o, *o.children_recursive] if d.type == 'MESH' for v in d.data.vertices]
            if not pts: errs.append((1e9, sid, 'no mesh')); continue
            mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
            mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
            # three's corner order: x [min, max] > y [min, max] > z [min, max]; its y = Blender z, its z = -Blender y
            i = 0
            for bx in (mn.x, mx.x):
                for bz in (mn.z, mx.z):
                    for by in (mx.y, mn.y):
                        tx, ty, tz = three_px[i]; i += 1
                        v = world_to_camera_view(scene, cam, Vector((bx, by, bz)))
                        if v.z <= cam.data.clip_start or not (-1 < tz < 1): continue   # behind the camera
                        if not (-0.5 < v.x < 1.5 and -0.5 < v.y < 1.5): continue          # far off screen: no use
                        errs.append((math.hypot(v.x * w - tx, (1 - v.y) * h - ty), sid, ''))
        errs.sort(reverse=True)
        good = [e[0] for e in errs if e[0] < 1e8]
        per = {}
        for e, sid, _ in errs: per[sid] = max(per.get(sid, 0), e)
        report['screens'].setdefault(key, []).append({'p': st['p'], 'points': len(good), 'max_px': round(max(good), 3) if good else None,
            'p95_px': round(sorted(good)[int(0.95 * (len(good) - 1))], 3) if good else None,
            'over': sorted(((round(v, 2), k) for k, v in per.items() if v > report['pass_px']), reverse=True)})
scene.camera = bpy.data.objects.get(f'CAM_1141x636_0')
scene.render.resolution_x, scene.render.resolution_y = 1141, 636
scene.view_settings.view_transform = 'AgX'
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
json.dump(report, open(out_json, 'w'), indent=1)
print('PARITY', json.dumps({k: [s['max_px'] for s in v] for k, v in report['screens'].items()}))
print('COLLECTIONS', [(c.name, len(c.objects)) for c in bpy.data.collections])
