# Bake the room's light groups (route B, phase 2), each group ALONE, from room-export.mjs's files.
#   Blender -b --factory-startup -P bake_room.py -- glb=<room-bake.glb> scene=<bake-scene.json> out=<dir>
#           [samples=512] [size=2048] [margin=2] [groups=lamps,neonL] [only=N34,E01] [save=<room.blend>]
# Groups: neonL neonR lamps tv sign door props fill car. Unit dial = today's live level at walk 0 (bake-scene.json):
#   lights: W = cd x 4 pi, white, x the light's own luminance (its colour comes back from the group's colour, luminance 1);
#   spots: size = 2 x three's angle, blend matched to three's smoothstep(cos angle, cos angle(1 - penumbra));
#   three's cutoff window (sign 7 m, TV 9 m, tail 4 m) rebuilt in a light node tree: (1 - (d/D)^4)^2;
#   emitters (tubes, bulbs, inner shades, the sign's card, the night, lit props): white, luminance-matched; they emit
#   but cast no shadow (a light sits inside a bulb);
#   fill: the hemisphere as a two-tone world (sky above, ground below, radiance = colour x intensity / pi), the shell and
#   the outside see-through to every ray (three's hemisphere is unoccluded: here the props still occlude and bounce it);
#   props: their own lit blocks see-through for their group (each light sits inside its block, as in room.html).
# Cycles: Diffuse, Direct + Indirect, Color off; diffuse bounces 8; unclamped. only=: re-bakes those slots' texels into
# the existing EXRs (the rest of the atlas kept; the room around keeps the old slot's shadow until a full bake).
import bpy, sys, os, json, math, time
import numpy as np
import OpenImageIO as oiio
from mathutils import Vector
sys.path.insert(0, os.path.dirname(__file__))
import common

A = common.args()
OUT, SIZE, MARGIN = A['out'], int(A.get('size', 2048)), int(A.get('margin', 2))
SAMPLES = int(A.get('samples', 512))
SC = json.load(open(A['scene']))
ONLY = A['only'].split(',') if A.get('only') else None
ORDER = ['lamps', 'neonL', 'neonR', 'props', 'sign', 'tv', 'door', 'fill', 'car']
PACKS = [{'groups': ['lamps', 'neonL', 'neonR'], 'size': 2048}, {'groups': ['props', 'sign', 'tv'], 'size': 1536},
         {'groups': ['door', 'fill', 'car'], 'size': 1024}]
todo = A['groups'].split(',') if A.get('groups') else ORDER
os.makedirs(OUT, exist_ok=True)
LUM = lambda c: 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
B = lambda p: Vector((p[0], -p[2], p[1]))   # three.js (x, y, z) -> Blender (x, -z, y)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=A['glb'])
scene = bpy.context.scene
common.setup_cycles(scene, SAMPLES)
c = scene.cycles
c.max_bounces, c.diffuse_bounces, c.glossy_bounces, c.transmission_bounces = 12, 8, 2, 2
objs = [o for o in scene.objects if o.type == 'MESH']
targets = [o for o in objs if o.get('role') == 'target']
emitters = [o for o in objs if o.get('group')]
print('IMPORTED', len(objs), 'meshes,', len(targets), 'targets,', len(emitters), 'emitters')

# materials from the extras: albedo (clamped), metal, roughness; emitters own theirs (a white emission per object)
def build(mat, emit=None, transparent=False):
    nt = mat.node_tree; N = nt.nodes
    for n in list(N): N.remove(n)
    out = N.new('ShaderNodeOutputMaterial')
    if transparent:
        add = N.new('ShaderNodeAddShader'); tr = N.new('ShaderNodeBsdfTransparent'); em = N.new('ShaderNodeEmission')
        nt.links.new(tr.outputs[0], add.inputs[0]); nt.links.new(em.outputs[0], add.inputs[1]); nt.links.new(add.outputs[0], out.inputs['Surface'])
        return em.inputs['Strength']
    p = N.new('ShaderNodeBsdfPrincipled'); nt.links.new(p.outputs[0], out.inputs['Surface'])
    # Color off divides by the surface's own diffuse colour: a black or fully metallic closure is dropped and bakes 0,
    # though three.js's maps (metalness, colour) make parts of it diffuse. So: albedo >= 0.02, metallic <= 0.9
    al = [min(0.95, max(0.02, x)) for x in (mat.get('albedo') or [0.5, 0.5, 0.5])]
    p.inputs['Base Color'].default_value = (*(al if emit is None or emit[1] else (0, 0, 0)), 1)
    p.inputs['Metallic'].default_value = min(0.9, float(mat.get('metal', 0)))
    p.inputs['Roughness'].default_value = float(mat.get('rough', 1))
    if emit is not None:
        p.inputs['Emission Color'].default_value = (1, 1, 1, 1)
        return p.inputs['Emission Strength']
    return None

done = set()
EMIT = []          # (socket, white strength, group): kept by material, so they survive the join below
for o in objs:
    grp = o.get('group')
    for slot in o.material_slots:
        m = slot.material
        if not m: continue
        if grp:
            m = m.copy(); slot.material = m   # its own: its emission is its group's
            s = build(m, emit=(grp, o.get('role') == 'target'), transparent=bool(o.get('transparent')))
            EMIT.append((s, float(o.get('emit', 0)), grp))
        elif m.name not in done:
            build(m); done.add(m.name)
for o in emitters:
    if o.get('role') != 'target': o.visible_shadow = False   # a light sits inside its bulb: emitters don't block

# the lights
LIGHTS = []
for L in SC['lights']:
    ld = bpy.data.lights.new(f"{L['group']}_{len(LIGHTS)}", L['type'])
    ld.color = (1, 1, 1)
    ld.shadow_soft_size = L.get('radius', 0.0)
    ld.use_soft_falloff = False
    if L['type'] == 'SPOT':
        a, pn = L['angle'], L['penumbra']
        ld.spot_size = 2 * a
        ld.spot_blend = (math.cos(a * (1 - pn)) - math.cos(a)) / (1 - math.cos(a))
    if L.get('cutoff'):
        D = L['cutoff']; ld.use_nodes = True; nt = ld.node_tree; N = nt.nodes
        em = [x for x in N if x.type == 'EMISSION'][0]
        lf = N.new('ShaderNodeLightFalloff'); lf.inputs['Strength'].default_value = 1.0
        div = N.new('ShaderNodeMath'); div.operation = 'DIVIDE'; nt.links.new(lf.outputs['Constant'], div.inputs[0]); nt.links.new(lf.outputs['Quadratic'], div.inputs[1])
        r = N.new('ShaderNodeMath'); r.operation = 'MULTIPLY'; r.inputs[1].default_value = 1 / (D * D); nt.links.new(div.outputs[0], r.inputs[0])
        sq = N.new('ShaderNodeMath'); sq.operation = 'POWER'; sq.inputs[1].default_value = 2; nt.links.new(r.outputs[0], sq.inputs[0])
        one = N.new('ShaderNodeMath'); one.operation = 'SUBTRACT'; one.inputs[0].default_value = 1; one.use_clamp = True; nt.links.new(sq.outputs[0], one.inputs[1])
        w = N.new('ShaderNodeMath'); w.operation = 'POWER'; w.inputs[1].default_value = 2; nt.links.new(one.outputs[0], w.inputs[0])
        nt.links.new(w.outputs[0], em.inputs['Strength'])
    ob = bpy.data.objects.new(ld.name, ld); scene.collection.objects.link(ob)
    ob.location = B(L['pos'])
    if L['type'] == 'SPOT':
        ob.rotation_mode = 'QUATERNION'; ob.rotation_quaternion = (B(L['target']) - B(L['pos'])).to_track_quat('-Z', 'Y')
    LIGHTS.append((ob, L['group'], 4 * math.pi * L['cd'] * LUM(L['color'])))

# the fill: sky above, ground below, white at their luminance
F = SC['fill']
world = bpy.data.worlds.new('Fill'); scene.world = world
nt = world.node_tree; N = nt.nodes
bg = N['Background']
tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); gt = N.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0
mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'
nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], gt.inputs[0]); nt.links.new(gt.outputs[0], mix.inputs['Factor'])
sky, ground = [LUM(F[k]) * F['intensity'] / math.pi for k in ('sky', 'ground')]
mix.inputs['A'].default_value = (ground, ground, ground, 1); mix.inputs['B'].default_value = (sky, sky, sky, 1)
nt.links.new(mix.outputs['Result'], bg.inputs['Color'])

def set_group(g):
    for ob, grp, watts in LIGHTS: ob.data.energy = watts if grp == g else 0.0
    for sock, k, grp in EMIT: sock.default_value = k if grp == g else 0.0
    bg.inputs['Strength'].default_value = 1.0 if g == 'fill' else 0.0
    for o in scene.objects:
        # the fill: the shell and the outside (the street, the night) see-through to every ray, not only to shadow rays
        # (Cycles mixes light-sampled and BSDF-sampled rays: BSDF rays that still hit the ceiling halve the sky)
        if o.get('bakecat') == 'shell' or o.get('key') in ('R.outGround', 'R.backdrop'):
            on = g != 'fill'
            o.visible_diffuse = o.visible_glossy = o.visible_transmission = on
            o.visible_shadow = on and o.get('key') != 'R.backdrop'   # (the night emits: it never blocks)
        if o.get('bakecat') == 'host': o.visible_shadow = g != 'props'

# the bake: one image node per target material, active
scene.cycles.bake_type = 'DIFFUSE'
b = scene.render.bake
b.use_pass_direct, b.use_pass_indirect, b.use_pass_color = True, True, False
b.margin, b.margin_type, b.target, b.use_selected_to_active = MARGIN, 'EXTEND', 'IMAGE_TEXTURES', False
nodes = []
for o in targets:
    for slot in o.material_slots:
        m = slot.material
        n = next((x for x in m.node_tree.nodes if x.name == 'LIGHTMAP_BAKE'), None)
        if not n:
            n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.name = 'LIGHTMAP_BAKE'; nodes.append(n)
        m.node_tree.nodes.active = n
# one Cycles session per baked object: the targets joined into a few objects by what their shadows do
# (the shell: see-through for the fill; the lit props: for their own group; the rest), the re-baked slots on their own
def join(objs, name, cat, bake):
    if not objs: return None
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    j = bpy.context.view_layer.objects.active; j.name = name; j['bakecat'] = cat; j['bake'] = int(bake)
    return j
picked = lambda o: not ONLY or o.get('slot') in ONLY
cats = {}
for o in targets:
    cat = 'shell' if o.get('shell') else 'host' if o.get('host') else 'rest'
    cats.setdefault((cat, picked(o)), []).append(o)
joined = [join(v, f'BAKE_{cat}_{int(p)}', cat, p) for (cat, p), v in cats.items()]
sel = [j for j in joined if j and j['bake']]
targets = [j for j in joined if j]
print('JOINED', [(j.name, len(j.data.polygons)) for j in targets])

def write_exr(path, arr):
    out = oiio.ImageOutput.create(path); spec = oiio.ImageSpec(arr.shape[1], arr.shape[0], arr.shape[2], 'float'); spec.attribute('compression', 'zip')
    out.open(path, spec); out.write_image(np.ascontiguousarray(arr, dtype=np.float32)); out.close()

if True:  # the island mask (every run: a re-baked slot may have new charts): texel centres inside a target triangle
    mask = np.zeros((SIZE, SIZE), np.uint8)
    for o in targets:
        me = o.data; me.calc_loop_triangles(); uvd = me.uv_layers[0].data
        for t in me.loop_triangles:
            q = np.array([uvd[l].uv[:] for l in t.loops]) * SIZE
            x0, y0 = np.maximum(np.floor(q.min(0)).astype(int), 0); x1, y1 = np.minimum(np.ceil(q.max(0)).astype(int) + 1, SIZE)
            if x1 <= x0 or y1 <= y0: continue
            X, Y = np.meshgrid(np.arange(x0, x1) + 0.5, np.arange(y0, y1) + 0.5)
            (ax, ay), (bx, by), (cx, cy) = q
            d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
            if abs(d) < 1e-12: continue
            l1 = ((by - cy) * (X - cx) + (cx - bx) * (Y - cy)) / d; l2 = ((cy - ay) * (X - cx) + (ax - cx) * (Y - cy)) / d
            mask[y0:y1, x0:x1] |= ((l1 >= -1e-6) & (l2 >= -1e-6) & (1 - l1 - l2 >= -1e-6)).astype(np.uint8)
    write_exr(os.path.join(OUT, 'mask.exr'), mask[::-1].astype(np.float32)[..., None])
    print('MASK', round(mask.mean(), 4))

times = {}
for g in todo:
    img = bpy.data.images.new('LM_' + g, SIZE, SIZE, alpha=False, float_buffer=True)
    prev = os.path.join(OUT, g + '.exr')
    if ONLY and os.path.exists(prev):   # keep the rest of the atlas: bake the slots' texels over it
        a = oiio.ImageBuf(prev).get_pixels(oiio.FLOAT)[::-1, :, :3]
        img.pixels.foreach_set(np.concatenate([a, np.ones(a.shape[:2] + (1,), np.float32)], -1).ravel())
    for n in nodes: n.image = img
    set_group(g)
    bpy.ops.object.select_all(action='DESELECT')
    for o in sel: o.select_set(True)
    bpy.context.view_layer.objects.active = sel[0]
    t = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, margin=MARGIN, margin_type='EXTEND', target='IMAGE_TEXTURES', use_clear=not ONLY)
    times[g] = round(time.time() - t, 1)
    px = np.empty(SIZE * SIZE * 4, np.float32); img.pixels.foreach_get(px)
    write_exr(prev, px.reshape(SIZE, SIZE, 4)[::-1, :, :3])
    print('BAKED', g, times[g], 's', flush=True)
    bpy.data.images.remove(img)

info_path = os.path.join(OUT, 'bake-info.json')
info = json.load(open(info_path)) if os.path.exists(info_path) else {}
info.update({
    'samples': SAMPLES, 'size': SIZE, 'margin_px': MARGIN, 'order': ORDER, 'packs': PACKS,
    'pass': 'Cycles Diffuse, Direct + Indirect, Color off; lights and emitters white, luminance-matched; one group at a time',
    'bounces': {'max': c.max_bounces, 'diffuse': c.diffuse_bounces, 'clamp': 'off'}, 'device': scene.cycles.device,
    'targets': [o.name for o in targets], 'meshes': len(objs),
    'groups': {g: {'color': v['color'], 'lum': v['lum'], 'nominal': v['nominal'], 'ref': v['ref'], 'lights': [L for L in SC['lights'] if L['group'] == g], 'emitters': sum(1 for x in EMIT if x[2] == g)} for g, v in SC['groups'].items()},
})
if ONLY: info.setdefault('slot_rebakes', []).append({'slots': ONLY, 'seconds': times, 'at': time.strftime('%Y-%m-%d %H:%M')})
else: info.update({'bake_seconds': times, 'slot_rebakes': []})   # bake_seconds: the last full bake's, per group
common.write_json(info_path, info)
if A.get('save'): bpy.ops.wm.save_as_mainfile(filepath=A['save'])
