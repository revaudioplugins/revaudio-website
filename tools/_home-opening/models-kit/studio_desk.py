# "a music studio table with a rack built inside" (Dan, 2026-11-08), built from code, two variants:
#   v1 "studio": walnut-dark top, black painted sides, padded front rail, two 8U 19-inch bays under the top, angled 12 deg
#                toward the chair, a knee space in the middle
#   v2 "garage-built": an angle-iron frame, a plank top, two open steel rack frames bolted in (same angle), rougher
# Blender 5.2 headless:  Blender -b --factory-startup -Y -P studio_desk.py -- --variant v1|v2 --tex DIR --atlas DIR --out GLB [--preview DIR]
# glb: metres, origin on the floor at the footprint centre, front = glTF +Z (Blender -Y); 2.40 x 0.85, top at 0.85 m (flat).
# Knobs, switches, LEDs, jacks, screws, handles, bolts are linked duplicates under Empties -> EXT_mesh_gpu_instancing.
import bpy, bmesh, sys, os, math, json, random
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
opt = dict(zip([a.lstrip('-') for a in argv[0::2]], argv[1::2]))
VAR = opt['variant']; TEX = opt['tex']; ATL = opt['atlas']
random.seed(7 if VAR == 'v1' else 23)
U = 0.04445; PANEL = 0.4826; EARX = 0.4651 / 2
W, D, H = 2.40, 0.85, 0.85
ANG = math.radians(12)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ---------- materials ----------
MATS = {}
def principled(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    return m, m.node_tree, m.node_tree.nodes['Principled BSDF']
def teximg(nt, path, noncolor):
    n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(path)
    if noncolor: n.image.colorspace_settings.name = 'Non-Color'
    return n
def pbr_mat(name, col, nrm, arm, rough_mul=None):
    m, nt, b = principled(name)
    c = teximg(nt, col, False); nt.links.new(c.outputs['Color'], b.inputs['Base Color'])
    a = teximg(nt, arm, True); s = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(a.outputs['Color'], s.inputs['Color'])
    nt.links.new(s.outputs['Green'], b.inputs['Roughness']); nt.links.new(s.outputs['Blue'], b.inputs['Metallic'])
    if nrm:
        n = teximg(nt, nrm, True); nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(n.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    return m
def solid(name, rgb, rough, metal, emit=None, strength=0.0):
    m, nt, b = principled(name)
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    return m
def atlas_mat(name, emissive):
    m, nt, b = principled(name)
    c = teximg(nt, os.path.join(ATL, 'rack_atlas_col.jpg'), False); nt.links.new(c.outputs['Color'], b.inputs['Base Color'])
    a = teximg(nt, os.path.join(ATL, 'rack_atlas_mr.jpg'), True); s = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(a.outputs['Color'], s.inputs['Color'])
    nt.links.new(s.outputs['Green'], b.inputs['Roughness']); nt.links.new(s.outputs['Blue'], b.inputs['Metallic'])
    if emissive:
        nt.links.new(c.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = 1.5  # the VU faces and LED ladders, lit warm
    return m
if VAR == 'v1':
    MATS['wood'] = pbr_mat('walnut_dark', *(os.path.join(TEX, f) for f in ('walnut_dark_col.jpg', 'walnut_nrm.jpg', 'walnut_arm.jpg')))
else:
    MATS['wood'] = pbr_mat('planks', *(os.path.join(TEX, f) for f in ('planks_col.jpg', 'planks_nrm.jpg', 'planks_arm.jpg')))
    MATS['steel'] = pbr_mat('angle_iron', *(os.path.join(TEX, f) for f in ('steel_col.jpg', 'steel_nrm.jpg', 'steel_arm.jpg')))
MATS['face'] = atlas_mat('rack_face', False)
MATS['emis'] = atlas_mat('rack_glow', True)
MATS['knob'] = solid('knob_black', (0.018, 0.018, 0.02), 0.42, 0.0)
MATS['chrome'] = solid('chrome', (0.78, 0.78, 0.8), 0.22, 1.0)
MATS['bolt'] = solid('zinc_bolt', (0.32, 0.32, 0.31), 0.5, 0.85)
MATS['led_r'] = solid('led_red', (0.3, 0.02, 0.02), 0.3, 0.0, (1.0, 0.08, 0.04), 4.0)
MATS['led_g'] = solid('led_green', (0.02, 0.3, 0.05), 0.3, 0.0, (0.15, 1.0, 0.25), 4.0)
MATS['led_a'] = solid('led_amber', (0.3, 0.2, 0.02), 0.3, 0.0, (1.0, 0.55, 0.08), 4.0)

# ---------- atlas regions (px, y down; mirrors rack_atlas.py) ----------
REG = {'silver': (0, 0, 1024, 128), 'black': (0, 128, 1024, 256), 'cream': (0, 256, 1024, 384), 'vent': (0, 384, 1024, 480),
       'patch': (0, 480, 1024, 576), 'vu': (0, 576, 384, 824), 'ledbar': (400, 576, 1024, 640), 'grey': (400, 656, 700, 944),
       'dark': (720, 656, 1024, 944), 'rail': (0, 960, 1024, 1024)}
def ruv(name, frac=None):
    x0, y0, x1, y1 = REG[name]
    if frac: fx0, fx1 = frac; x0, x1 = x0 + (x1 - x0) * fx0, x0 + (x1 - x0) * fx1
    e = 0.5  # half a texel in, against bleeding
    return ((x0 + e) / 1024, 1 - (y1 - e) / 1024, (x1 - e) / 1024, 1 - (y0 + e) / 1024)

# ---------- static geometry: one bmesh, a material slot per kind ----------
SLOTS = list(MATS.keys())
bm = bmesh.new(); UVL = bm.loops.layers.uv.new('UVMap')
def quad(pts, mat, uvs):
    vs = [bm.verts.new(p) for p in pts]; f = bm.faces.new(vs); f.material_index = SLOTS.index(mat)
    for l, uv in zip(f.loops, uvs): l[UVL].uv = uv
    return f
def rect_uvs(r, rot=False, ulen=1.0):
    u0, v0, u1, v1 = r
    if rot:  # u runs along the face's height (bl -> tl): rails
        u1 = u0 + (u1 - u0) * ulen
        return [(u0, v0), (u0, v1), (u1, v1), (u1, v0)]
    return [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
def metric_uvs(pts, n, tile, off=(0, 0), swap=False):
    ax = max(range(3), key=lambda i: abs(n[i])); out = []
    for p in pts:
        u, v = (p.x, p.y) if ax == 2 else (p.y, p.z) if ax == 0 else (p.x, p.z)
        if swap and ax != 0: u, v = v, u
        out.append((u / tile + off[0], v / tile + off[1]))
    return out
def box(M, x0, x1, y0, y1, z0, z1, mat, front=None, other=None, metric=None, skip=()):
    """front: atlas rect for the -Y face (or ('rot', rect, ulen)); other: atlas rect for the rest; metric: (tile, off, swap)"""
    P = lambda x, y, z: M @ Vector((x, y, z))
    faces = {
        'front': [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)], 'back': [(x1, y1, z0), (x0, y1, z0), (x0, y1, z1), (x1, y1, z1)],
        'left': [(x0, y1, z0), (x0, y0, z0), (x0, y0, z1), (x0, y1, z1)], 'right': [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)],
        'top': [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], 'bottom': [(x0, y1, z0), (x1, y1, z0), (x1, y0, z0), (x0, y0, z0)]}
    for k, c in faces.items():
        if k in skip: continue
        pts = [P(*q) for q in c]
        n = (pts[1] - pts[0]).cross(pts[3] - pts[0]).normalized()
        if metric: uvs = metric_uvs(pts, n, *metric)
        elif k == 'front' and front is not None:
            uvs = rect_uvs(front[1], True, front[2]) if isinstance(front, tuple) and front and front[0] == 'rot' else rect_uvs(front)
        else: uvs = rect_uvs(other or ruv('dark'))
        quad(pts, mat, uvs)
def lprofile(M, start, axis, length, fa, fb, mat, a=0.04, t=0.004, tile=0.8):
    """angle iron: corner line from `start` along unit `axis`; flanges along unit vectors fa, fb (perpendicular to axis)"""
    s = Vector(start); ax = Vector(axis); fa = Vector(fa); fb = Vector(fb)
    prof = [Vector((0, 0, 0)), fa * a, fa * a + fb * t, fa * t + fb * t, fa * t + fb * a, fb * a]
    p0 = [M @ (s + p) for p in prof]; p1 = [M @ (s + ax * length + p) for p in prof]
    p2d = [(0, 0), (a, 0), (a, t), (t, t), (t, a), (0, a)]  # counter-clockwise in (fa, fb): outward = (dy, -dx)
    R3 = M.to_3x3()
    for i in range(6):
        j = (i + 1) % 6; pts = [p0[i], p0[j], p1[j], p1[i]]
        dx, dy = p2d[j][0] - p2d[i][0], p2d[j][1] - p2d[i][1]
        want = R3 @ (fa * dy - fb * dx)
        n = (pts[1] - pts[0]).cross(pts[3] - pts[0])
        if n.dot(want) < 0: pts = pts[::-1]; n = -n
        quad(pts, mat, metric_uvs(pts, n.normalized(), tile, (random.random(), random.random())))
    for ring, sgn in ((p0, -1), (p1, 1)):
        for qd in ((0, 1, 2, 3), (0, 3, 4, 5)):
            pts = [ring[k] for k in qd]
            n = (pts[1] - pts[0]).cross(pts[3] - pts[0])
            if n.dot(M.to_3x3() @ ax) * sgn < 0: pts = pts[::-1]; n = -n
            quad(pts, mat, metric_uvs(pts, n.normalized(), tile))

# ---------- instanced parts ----------
INST = {}
def part_mesh(name, build, mat):
    b2 = bmesh.new(); build(b2)
    me = bpy.data.meshes.new(name); b2.to_mesh(me); b2.free()
    me.materials.append(MATS[mat])
    for p in me.polygons: p.use_smooth = True
    holder = bpy.data.objects.new(name + '_set', None); sc.collection.objects.link(holder)
    INST[name] = {'mesh': me, 'holder': holder, 'n': 0}
def cyl_y(b2, r, y0, y1, seg, x=0.0, z=0.0):  # a cylinder along -Y (out of a panel) from y0 to y1
    bmesh.ops.create_cone(b2, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=abs(y1 - y0),
                          matrix=Matrix.Translation((x, (y0 + y1) / 2, z)) @ Matrix.Rotation(math.radians(90), 4, 'X'))
part_mesh('knob', lambda b: cyl_y(b, 0.0085, 0, -0.016, 12), 'knob')
part_mesh('knob_skirt', lambda b: cyl_y(b, 0.0115, 0, -0.003, 12), 'chrome')
def toggle(b):
    cyl_y(b, 0.0048, 0, -0.004, 6)
    bmesh.ops.create_cone(b, cap_ends=True, segments=6, radius1=0.0019, radius2=0.0013, depth=0.016,
                          matrix=Matrix.Translation((0, -0.011, 0.003)) @ Matrix.Rotation(math.radians(70), 4, 'X'))
part_mesh('toggle', toggle, 'chrome')
for c in ('r', 'g', 'a'): part_mesh('led_' + c, lambda b: cyl_y(b, 0.0026, 0, -0.0035, 8), 'led_' + c)
part_mesh('jack', lambda b: cyl_y(b, 0.0045, 0, -0.003, 8), 'chrome')
part_mesh('jack_hole', lambda b: cyl_y(b, 0.0026, -0.0028, -0.0032, 8), 'knob')
part_mesh('screw', lambda b: cyl_y(b, 0.0042, 0, -0.0018, 6), 'chrome')
part_mesh('bolt', lambda b: cyl_y(b, 0.0075, 0, -0.006, 6), 'bolt')
def handle(n):
    L = n * U - 0.014
    def build(b):
        bmesh.ops.create_cone(b, cap_ends=True, segments=6, radius1=0.0042, radius2=0.0042, depth=L, matrix=Matrix.Translation((0, -0.024, 0)))
        for zz in (L / 2 - 0.004, -L / 2 + 0.004):
            bmesh.ops.create_cube(b, size=1, matrix=Matrix.Translation((0, -0.012, zz)) @ Matrix.Diagonal((0.008, 0.024, 0.008, 1)))
    part_mesh(f'handle{n}', build, 'chrome')
handle(2); handle(3)
def place(name, M):
    o = bpy.data.objects.new(f'{name}.{INST[name]["n"]:03d}', INST[name]['mesh']); sc.collection.objects.link(o)
    o.parent = INST[name]['holder']; o.matrix_world = M; INST[name]['n'] += 1

# ---------- rack gear ----------
def unit(M, yR, ztop, n, style, feats):
    """one 19-inch unit, n U tall, its top edge at ztop, mounted on rails whose front plane is y = yR (bay-local, front = -Y)"""
    zb, zt = ztop - n * U, ztop; yf = yR - 0.003; h = n * U
    face = {'silver': ruv('silver'), 'black': ruv('black'), 'cream': ruv('cream'), 'vent': ruv('vent'), 'patch': ruv('patch'), 'blank': ruv('black')}[style]
    box(M, -PANEL / 2, PANEL / 2, yf, yR, zb + 0.0004, zt - 0.0004, 'face', front=face, other=ruv('dark'), skip=('back',))
    holes = [zb + k * U + U / 2 for k in range(n)]
    for z in ([holes[0]] if n == 1 else [holes[0], holes[-1]]):
        for sx in (-1, 1): place('screw', M @ Matrix.Translation((sx * EARX, yf, z)))
    if n >= 2:
        for sx in (-1, 1): place(f'handle{min(n, 3)}', M @ Matrix.Translation((sx * 0.219, yf, (zb + zt) / 2)))
    for f in feats:
        k = f[0]
        if k == 'knob':
            _, x, zr, s = f; T = M @ Matrix.Translation((x, yf, zb + zr * h)) @ Matrix.Rotation(random.uniform(0, 6.28), 4, 'Y') @ Matrix.Scale(s, 4)
            place('knob', T); place('knob_skirt', T)
        elif k == 'tog': place('toggle', M @ Matrix.Translation((f[1], yf, zb + f[2] * h)))
        elif k == 'led': place('led_' + f[3], M @ Matrix.Translation((f[1], yf, zb + f[2] * h)))
        elif k == 'vu':  # a recessed, lit meter: black bezel, warm face, needle
            _, x, zr, w = f; hh = w / 1.55; zc = zb + zr * h
            box(M, x - w / 2 - 0.005, x + w / 2 + 0.005, yf - 0.004, yf, zc - hh / 2 - 0.005, zc + hh / 2 + 0.005, 'face', front=ruv('dark'), other=ruv('dark'), skip=('back',))
            yv = yf - 0.0041
            quad([M @ Vector(p) for p in ((x - w / 2, yv, zc - hh / 2), (x + w / 2, yv, zc - hh / 2), (x + w / 2, yv, zc + hh / 2), (x - w / 2, yv, zc + hh / 2))], 'emis', rect_uvs(ruv('vu')))
            a = math.radians(random.uniform(-38, 12)); px, pz = x, zc - hh / 2 + hh * 0.02; L = hh * 0.8
            d = Vector((math.sin(a), 0, math.cos(a))); nrm = Vector((math.cos(a), 0, -math.sin(a))) * 0.0007
            base = Vector((px, yv - 0.0006, pz)); tip = base + d * L
            quad([M @ p for p in (base - nrm, base + nrm, tip + nrm * 0.6, tip - nrm * 0.6)], 'knob', rect_uvs(ruv('dark')))
        elif k == 'ledbar':
            _, x0, x1, zr0, zr1 = f
            quad([M @ Vector(p) for p in ((x0, yf - 0.0005, zb + zr0 * h), (x1, yf - 0.0005, zb + zr0 * h), (x1, yf - 0.0005, zb + zr1 * h), (x0, yf - 0.0005, zb + zr1 * h))], 'emis', rect_uvs(ruv('ledbar')))
        elif k == 'jacks':
            for zr in (0.687, 0.214):
                for i in range(16):
                    T = M @ Matrix.Translation((-0.2 + i * 0.4 / 15, yf, zb + zr * h)); place('jack', T); place('jack_hole', T)

def bay_rails(M, yR, zb, zt, mat_side):
    for sx in (-1, 1):
        x0, x1 = (0.225, 0.2505) if sx > 0 else (-0.2505, -0.225)
        box(M, x0, x1, yR, yR + 0.0025, zb, zt, 'face', front=('rot', ruv('rail'), (zt - zb) / (16 * U)), other=ruv('rail'))
        xf0, xf1 = (0.248, 0.2505) if sx > 0 else (-0.2505, -0.248)
        box(M, xf0, xf1, yR + 0.0025, yR + 0.018, zb, zt, mat_side, other=ruv('rail'), skip=('front',))

def fill_bay(M, yR, ztop, plan):
    z = ztop
    for n, style, feats in plan:
        if style != 'empty': unit(M, yR, z, n, style, feats)
        z -= n * U

def kn(x, zr, s=1.0): return ('knob', x, zr, s)
PLAN = {
    'v1_left': [
        (2, 'cream', [('vu', -0.12, 0.5, 0.105), ('vu', 0.0, 0.5, 0.105), kn(0.1, 0.62, 1.15), kn(0.16, 0.62, 1.15), kn(0.1, 0.27, 0.9), kn(0.16, 0.27, 0.9), ('tog', 0.205, 0.62), ('led', 0.205, 0.27, 'a')]),
        (1, 'black', [kn(-0.18 + i * 0.055, 0.5, 0.75) for i in range(6)] + [('led', 0.17, 0.5, 'g'), ('led', 0.19, 0.5, 'g')]),
        (1, 'patch', [('jacks',)]),
        (2, 'silver', [('ledbar', -0.2, -0.07, 0.36, 0.64), kn(-0.02, 0.5, 1.55), kn(0.06, 0.5, 1.55), kn(0.14, 0.5, 1.2), ('tog', 0.19, 0.66), ('tog', 0.19, 0.33), ('led', -0.045, 0.82, 'r')]),
        (1, 'empty', []),
        (1, 'vent', []),
    ],
    'v1_right': [
        (3, 'black', [('vu', -0.075, 0.58, 0.115), ('vu', 0.075, 0.58, 0.115), kn(-0.18, 0.62, 1.6), kn(0.18, 0.62, 1.6), kn(-0.18, 0.22, 1.0), kn(0.18, 0.22, 1.0),
                      ('tog', -0.04, 0.17), ('tog', 0.04, 0.17), ('led', 0.0, 0.17, 'a')]),
        (1, 'silver', [('ledbar', -0.2, -0.04, 0.3, 0.7)] + [kn(0.03 + i * 0.06, 0.5, 0.8) for i in range(3)] + [('led', 0.2, 0.5, 'r')]),
        (1, 'patch', [('jacks',)]),
        (2, 'cream', [kn(-0.17 + i * 0.065, 0.62, 1.0) for i in range(6)] + [('tog', -0.15, 0.25), ('tog', -0.09, 0.25), ('led', 0.18, 0.25, 'g')]),
        (1, 'blank', []),
    ],
    'v2_left': [
        (2, 'cream', [('vu', -0.1, 0.5, 0.11), kn(0.03, 0.6, 1.3), kn(0.1, 0.6, 1.3), kn(0.17, 0.6, 1.3), ('tog', 0.03, 0.22), ('tog', 0.1, 0.22), ('led', 0.17, 0.22, 'a')]),
        (1, 'empty', []),
        (2, 'black', [kn(-0.18 + i * 0.072, 0.55, 1.2) for i in range(5)] + [('led', 0.19, 0.55, 'r'), ('tog', 0.19, 0.2)]),
        (1, 'patch', [('jacks',)]),
        (1, 'empty', []),
        (1, 'silver', [kn(-0.15 + i * 0.075, 0.5, 0.8) for i in range(4)] + [('led', 0.17, 0.5, 'g')]),
    ],
    'v2_right': [
        (3, 'silver', [('vu', 0.0, 0.6, 0.15), kn(-0.17, 0.6, 1.7), kn(0.17, 0.6, 1.7), kn(-0.1, 0.17, 0.9), kn(0.1, 0.17, 0.9), ('tog', -0.03, 0.17), ('tog', 0.03, 0.17)]),
        (1, 'vent', []),
        (2, 'black', [('ledbar', -0.19, -0.03, 0.34, 0.66), kn(0.04, 0.5, 1.25), kn(0.11, 0.5, 1.25), kn(0.18, 0.5, 1.25), ('led', -0.11, 0.82, 'g')]),
        (1, 'empty', []),
        (1, 'blank', []),
    ],
}

def place_bay_matrix(sx, w, d, inset_x, front_y):
    """a bay turned toward the knee space; returns its matrix and footprint half-sizes"""
    rz = ANG if sx < 0 else -ANG  # the left bay's front (-Y) turns toward +X, the right one's toward -X
    hx = w / 2 * math.cos(ANG) + d / 2 * math.sin(ANG); hy = d / 2 * math.cos(ANG) + w / 2 * math.sin(ANG)
    cx = sx * (inset_x - hx); cy = front_y + hy
    return Matrix.Translation((cx, cy, 0)) @ Matrix.Rotation(rz, 4, 'Z'), hx, hy, cx, cy

I = Matrix.Identity(4)
info = {'variant': VAR}
if VAR == 'v1':
    TOP_T = 0.04
    # the top: walnut-dark, grain along the desk; a padded, rounded black front rail flush with it
    box(I, -W / 2, W / 2, -D / 2 + 0.064, D / 2, H - TOP_T, H, 'wood', metric=(1.8, (0.17, 0.31), True))
    rb = bmesh.new(); bmesh.ops.create_cube(rb, size=1.0)
    for v in rb.verts: v.co = Vector((v.co.x * W, v.co.y * 0.064 - D / 2 + 0.032, v.co.z * 0.052 + H - 0.026))
    edges = [e for e in rb.edges if all(v.co.y < -D / 2 + 0.01 for v in e.verts) or all((v.co.y < -D / 2 + 0.04 and v.co.z > H - 0.002) for v in e.verts)]
    bmesh.ops.bevel(rb, geom=edges, offset=0.022, segments=4, affect='EDGES')
    vmap = {v: bm.verts.new(v.co) for v in rb.verts}
    for f in rb.faces:
        nf = bm.faces.new([vmap[v] for v in f.verts]); nf.material_index = SLOTS.index('face'); nf.smooth = True
        for l in nf.loops: l[UVL].uv = (ruv('dark')[0] + 0.01, ruv('dark')[1] + 0.01)
    rb.free()
    # modesty panel at the back of the knee space
    box(I, -0.55, 0.55, D / 2 - 0.035, D / 2 - 0.017, 0.12, H - TOP_T, 'face', other=ruv('dark'))
    PW, PD, PH, t = 0.54, 0.62, H - TOP_T, 0.019
    bay_top = PH - 0.03; bay_bot = bay_top - 8 * U
    for sx, plan in ((-1, 'v1_left'), (1, 'v1_right')):
        M, hx, hy, cx, cy = place_bay_matrix(sx, PW, PD, W / 2 - 0.02, -D / 2 + 0.03)
        dk = ruv('dark')
        box(M, -PW / 2, -PW / 2 + t, -PD / 2, PD / 2, 0, PH, 'face', other=dk)            # sides, painted black
        box(M, PW / 2 - t, PW / 2, -PD / 2, PD / 2, 0, PH, 'face', other=dk)
        box(M, -PW / 2 + t, PW / 2 - t, PD / 2 - t, PD / 2, 0, PH, 'face', other=ruv('grey'), skip=('back',))  # back (its inside a shade lighter)
        box(M, -PW / 2 + t, PW / 2 - t, -PD / 2 + 0.05, PD / 2 - t, 0, 0.07, 'face', other=dk)  # recessed plinth
        box(M, -PW / 2 + t, PW / 2 - t, -PD / 2, PD / 2 - t, 0.07, 0.088, 'face', other=dk)
        box(M, -PW / 2 + t + 0.002, PW / 2 - t - 0.002, -PD / 2, -PD / 2 + 0.018, 0.09, bay_bot - 0.022, 'face', other=dk)  # lower door
        px = -sx * (PW / 2 - t - 0.045)  # its pull on the side toward the knee space
        box(M, px - 0.006, px + 0.006, -PD / 2 - 0.016, -PD / 2, bay_bot - 0.15, bay_bot - 0.06, 'chrome', other=dk)
        box(M, -PW / 2 + t, PW / 2 - t, -PD / 2, PD / 2 - t, bay_bot - 0.02, bay_bot, 'face', other=dk)  # shelf under the bay
        box(M, -PW / 2 + t, PW / 2 - t, -PD / 2, -PD / 2 + 0.02, bay_top, PH, 'face', other=dk)    # fascia over it
        yR = -PD / 2 + 0.022
        bay_rails(M, yR, bay_bot, bay_top, 'face')
        fill_bay(M, yR, bay_top, PLAN[plan])
        info[plan] = {'centre': [round(cx, 3), round(cy, 3)], 'half': [round(hx, 3), round(hy, 3)]}
else:
    PT = 0.036; zf = H - PT  # plank bottom = top of the angle-iron frame
    widths = [0.214, 0.2, 0.222, 0.204]; gap = (D - sum(widths)) / 3; y = -D / 2
    for i, wd in enumerate(widths):
        L = [2.40, 2.375, 2.392, 2.364][i]; xo = [0.0, 0.009, -0.004, 0.012][i]
        box(I, -L / 2 + xo, L / 2 + xo, y, y + wd, zf, H, 'wood', metric=(0.55, (random.random(), random.random()), False))
        y += wd + gap
    LX, LY = W / 2 - 0.035, D / 2 - 0.035
    for sx in (-1, 1):
        for sy in (-1, 1):  # legs: the corner outward, flanges in
            lprofile(I, (sx * LX, sy * LY, 0), (0, 0, 1), zf, (-sx, 0, 0), (0, -sy, 0), 'steel')
    for sy in (-1, 1):  # top frame along the desk: horizontal flange under the planks, vertical one down the face
        lprofile(I, (-LX - 0.001, sy * (LY + 0.001), zf), (1, 0, 0), 2 * LX + 0.002, (0, -sy, 0), (0, 0, -1), 'steel')
    for sx in (-1, 1):
        lprofile(I, (sx * (LX + 0.002), -LY, zf - 0.0005), (0, 1, 0), 2 * LY, (-sx, 0, 0), (0, 0, -1), 'steel')
        lprofile(I, (sx * (LX + 0.001), -LY, 0.12), (0, 1, 0), 2 * LY, (-sx, 0, 0), (0, 0, 1), 'steel')  # lower stretchers
    for xx in (-0.36, 0.36):
        lprofile(I, (xx, -LY, zf), (0, 1, 0), 2 * LY, (1, 0, 0), (0, 0, -1), 'steel')  # cross bearers under the planks
    lprofile(I, (-LX, LY + 0.001, 0.15), (1, 0, 0), 2 * LX, (0, -1, 0), (0, 0, 1), 'steel')  # back stretcher
    # bolts: two per leg at the top joint, on the outside faces
    for sx in (-1, 1):
        for sy in (-1, 1):
            for zz in (zf - 0.02, 0.14):  # on the leg's face toward the front (or the back), the flange's middle
                place('bolt', Matrix.Translation((sx * (LX - 0.022), sy * (LY + 0.0015), zz)) @ Matrix.Rotation(0 if sy < 0 else math.pi, 4, 'Z'))
    # open steel rack frames, bolted in, turned toward the chair
    FW, FD = 0.53, 0.42; bay_top = zf - 0.045; bay_bot = bay_top - 8 * U
    for sx, plan in ((-1, 'v2_left'), (1, 'v2_right')):
        M, hx, hy, cx, cy = place_bay_matrix(sx, FW, FD, LX - 0.045, -LY + 0.006)  # just behind the front frame's flange, so the plank edge doesn't hide the top units
        yR = -FD / 2
        bay_rails(M, yR, 0.02, zf - 0.004, 'steel')                       # the front rails run floor to frame
        for xs in (-1, 1):
            x0 = xs * FW / 2
            box(M, min(x0, x0 - xs * 0.025), max(x0, x0 - xs * 0.025), FD / 2 - 0.025, FD / 2, 0.02, zf - 0.004, 'steel', metric=(0.8, (0.3, 0.1), False))  # rear posts
            for zz in (0.02, bay_bot - 0.03, zf - 0.024):                    # side bars, three levels
                box(M, min(x0, x0 - xs * 0.02), max(x0, x0 - xs * 0.02), yR + 0.018, FD / 2 - 0.025, zz, zz + 0.02, 'steel', metric=(0.8, (0.6, 0.2), False))
        for zz in (0.02, zf - 0.024):                                        # back and front bars at the foot and the head
            box(M, -FW / 2, FW / 2, FD / 2 - 0.025, FD / 2 - 0.005, zz, zz + 0.02, 'steel', metric=(0.8, (0.1, 0.5), False))
            box(M, -0.2505, 0.2505, yR + 0.0025, yR + 0.022, zz, zz + 0.02, 'steel', metric=(0.8, (0.7, 0.3), False))
        box(M, -0.2505, 0.2505, yR + 0.0025, yR + 0.02, bay_bot - 0.03, bay_bot - 0.01, 'steel', metric=(0.8, (0.4, 0.4), False))  # sill under the gear
        for zz in (0.06, bay_bot - 0.02, zf - 0.03):                         # the frame's bolts on the rails
            for xs in (-1, 1): place('bolt', M @ Matrix.Translation((xs * 0.2378, yR, zz)) @ Matrix.Scale(0.75, 4))
        fill_bay(M, yR, bay_top, PLAN[plan])
        info[plan] = {'centre': [round(cx, 3), round(cy, 3)], 'half': [round(hx, 3), round(hy, 3)]}

# ---------- the static object ----------
me = bpy.data.meshes.new('desk_' + VAR); bm.normal_update(); bm.to_mesh(me); bm.free()
for s in SLOTS: me.materials.append(MATS[s])
ob = bpy.data.objects.new('studio_desk_' + VAR, me); sc.collection.objects.link(ob)
me.calc_loop_triangles()
static = len(me.loop_triangles)
inst_tris = {}
for k, v in INST.items():
    v['mesh'].calc_loop_triangles(); inst_tris[k] = (len(v['mesh'].loop_triangles), v['n'])
total = static + sum(a * b for a, b in inst_tris.values())
unique = static + sum(a for a, b in inst_tris.values() if b)
# drop unused instance sets
for k, v in list(INST.items()):
    if v['n'] == 0: bpy.data.objects.remove(v['holder'])
info.update({'static_tris': static, 'rendered_tris': total, 'unique_tris': unique, 'instances': {k: v for k, v in inst_tris.items() if v[1]}})
co = [v.co for v in me.vertices]
info['bbox'] = [[round(min(c[i] for c in co), 3) for i in range(3)], [round(max(c[i] for c in co), 3) for i in range(3)]]
print('DESKINFO', json.dumps(info))

if opt.get('preview'):
    pv = opt['preview']; os.makedirs(pv, exist_ok=True)
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'TEXTURE'
    sc.render.resolution_x, sc.render.resolution_y = 900, 600
    cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera = cam
    for nm_, p, tgt in (('front', (0, -3.6, 1.0), (0, 0, 0.5)), ('q34', (2.2, -2.6, 1.6), (0, 0, 0.45)), ('bay', (-0.2, -1.25, 0.75), (-0.85, 0, 0.58))):
        cam.location = p; cam.rotation_euler = (Vector(tgt) - Vector(p)).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = os.path.join(pv, nm_ + '.png'); bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)

out = opt['out']; os.makedirs(os.path.dirname(out), exist_ok=True)
props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
kw = dict(filepath=out, export_format='GLB', export_apply=True, export_image_format='AUTO', export_yup=True,
          export_cameras=False, export_lights=False, export_animations=False)
if 'export_gpu_instances' in props: kw['export_gpu_instances'] = True
bpy.ops.export_scene.gltf(**kw)
print('DESKOUT', out, os.path.getsize(out), 'gpu_instances' if 'export_gpu_instances' in props else 'no-instancing-option')
