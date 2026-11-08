# Bake each light group ALONE into the shared UV2 atlas: Cycles, Diffuse, Direct + Indirect, Color off, the group's
# emitters white (its colour comes back live from the uniform), every other group dark but present (so the parts add
# up exactly to the all-on render, bounces included).
#   Blender -b <room.blend> -P bake_groups.py -- out=<dir> [samples=1024] [lm=1024] [margin=16] [groups=G1_lamp,G2_neon]
# Writes <out>/<group>.exr (float32 RGB, top row = v 1, i.e. the orientation of a normal image file), <out>/mask.exr
# (1 = a texel inside a UV island) and <out>/bake-info.json (groups in Blender units, times, texel density).
import bpy, sys, os, time, math
import numpy as np
import OpenImageIO as oiio
sys.path.insert(0, os.path.dirname(__file__))
import common

A = common.args()
OUT = A['out']
SAMPLES = int(A.get('samples', 1024))
LM = int(A.get('lm', 1024))
MARGIN = int(A.get('margin', 16))
scene = bpy.context.scene
snap = common.snapshot(scene)
all_groups = list(common.groups(scene))
todo = A['groups'].split(',') if A.get('groups') else all_groups
targets = common.bake_targets(scene)
os.makedirs(OUT, exist_ok=True)

common.setup_cycles(scene, SAMPLES)
scene.cycles.bake_type = 'DIFFUSE'
b = scene.render.bake
b.use_pass_direct, b.use_pass_indirect, b.use_pass_color = True, True, False
b.margin, b.margin_type, b.target = MARGIN, 'EXTEND', 'IMAGE_TEXTURES'
b.use_clear, b.use_selected_to_active = True, False

# the lightmap UV is the active one (and the render one) while baking; the file is never saved, so the export keeps UV1
for o in targets:
    uv = o.data.uv_layers[common.LM_UV]
    o.data.uv_layers.active = uv
    uv.active_render = True

# every baked material gets one unconnected Image Texture node, active: Cycles bakes into the active image node
mats = {s.material for o in targets for s in o.material_slots if s.material}
nodes = {}
for m in mats:
    n = m.node_tree.nodes.new('ShaderNodeTexImage')
    n.name = n.label = 'LIGHTMAP_BAKE'
    m.node_tree.nodes.active = n
    nodes[m] = n


def write_exr(path, arr):
    h, w, c = arr.shape
    out = oiio.ImageOutput.create(path)
    spec = oiio.ImageSpec(w, h, c, 'float')
    spec.attribute('compression', 'zip')
    out.open(path, spec)
    out.write_image(np.ascontiguousarray(arr, dtype=np.float32))
    out.close()


# the island mask and the texel density, from UV2's triangles (texel centres inside a triangle)
mask = np.zeros((LM, LM), np.uint16)
area3d = 0.0
for o in targets:
    me = o.data
    me.calc_loop_triangles()
    uvd = me.uv_layers[common.LM_UV].data
    mw = o.matrix_world
    for t in me.loop_triangles:
        p = [mw @ me.vertices[i].co for i in t.vertices]
        area3d += ((p[1] - p[0]).cross(p[2] - p[0])).length / 2
        q = np.array([uvd[l].uv[:] for l in t.loops]) * LM   # pixel units, v up
        x0, y0 = np.floor(q.min(0)).astype(int)
        x1, y1 = np.ceil(q.max(0)).astype(int)
        x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, LM), min(y1, LM)
        if x1 <= x0 or y1 <= y0:
            continue
        X, Y = np.meshgrid(np.arange(x0, x1) + 0.5, np.arange(y0, y1) + 0.5)
        (ax, ay), (bx, by), (cx, cy) = q
        d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(d) < 1e-12:
            continue
        l1 = ((by - cy) * (X - cx) + (cx - bx) * (Y - cy)) / d
        l2 = ((cy - ay) * (X - cx) + (ax - cx) * (Y - cy)) / d
        inside = (l1 >= 0) & (l2 >= 0) & (1 - l1 - l2 >= 0)
        mask[y0:y1, x0:x1] += inside
mask = mask[::-1]                     # top row = v 1, like the EXRs
covered = int((mask > 0).sum())
texel_per_m = math.sqrt(covered / area3d)
write_exr(os.path.join(OUT, 'mask.exr'), (mask > 0).astype(np.float32)[..., None])

times = {}
for g in todo:
    img = bpy.data.images.new('LM_' + g, LM, LM, alpha=False, float_buffer=True)
    for n in nodes.values():
        n.image = img
    common.set_groups(snap, [g], white=True)
    bpy.ops.object.select_all(action='DESELECT')
    for o in targets:
        o.select_set(True)
    bpy.context.view_layer.objects.active = targets[0]
    t = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, margin=MARGIN, margin_type='EXTEND',
                        target='IMAGE_TEXTURES', use_clear=True)
    times[g] = round(time.time() - t, 1)
    px = np.empty(LM * LM * 4, np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(LM, LM, 4)[::-1, :, :3]   # Blender's rows run bottom-up
    write_exr(os.path.join(OUT, g + '.exr'), px)
    print('BAKED', g, times[g], 's', 'mean', float(px[mask > 0].mean()))

common.set_groups(snap, all_groups)
info = {
    'blend': bpy.data.filepath, 'samples': SAMPLES, 'size': LM, 'margin_px': MARGIN,
    'pass': 'Cycles Diffuse, Direct + Indirect, Color off; emitters white; other groups dark but present',
    'bounces': {'max': scene.cycles.max_bounces, 'diffuse': scene.cycles.diffuse_bounces, 'clamp': 'off'},
    'targets': [o.name for o in targets], 'groups': common.group_info(snap, scene), 'order': all_groups,
    'bake_seconds': times, 'device': scene.cycles.device,
    'texels_per_metre': round(texel_per_m, 1), 'coverage': round(covered / LM / LM, 4),
    'overlap_texels': int((mask > 1).sum()), 'baked_area_m2': round(area3d, 3),
}
prev = os.path.join(OUT, 'bake-info.json')
if os.path.exists(prev) and A.get('groups'):     # a partial re-bake keeps the other groups' times
    import json
    old = json.load(open(prev))
    old['bake_seconds'].update(times)
    info['bake_seconds'] = old['bake_seconds']
common.write_json(prev, info)
print('INFO', info['texels_per_metre'], 'texels/m, coverage', info['coverage'], 'overlap', info['overlap_texels'])
