# the studio corner, built from code (no CC0 model fits; Dan: CC0 only):
#   --what monitor --variant m1|m2   a near-field cabinet, exactly the E02/E03 slot box (0.34 w x 0.52 h x 0.32 d)
#   --what stand   --variant m1|m2   its floor stand: single pole, heavy base, 1.29 m (floor to the cabinet's underside)
#   --what kit     --variant k1|k2   a small kit for E07: 20" kick (plain resonant head + port), 12" rack tom, 14" snare on
#                                    its stand, 14" hi-hats on theirs, a 16" crash-ride on an arm off the kick (a compact-kit
#                                    mount, so the kit keeps to the slot's ~1.0 x 0.7 footprint); k1 burgundy, k2 natural wood
#   --what throne                    E08: a round padded seat on a chrome tripod
# Blender 5.2 headless: Blender -b --factory-startup -Y -P studio_corner.py -- --what W [--variant V] --tex DIR --out GLB [--preview DIR]
# glb: metres, origin on the floor at the footprint centre, front = glTF +Z (Blender -Y). Kit: the resonant head faces +Z, the
# drummer sits at -Z (room.html's drumKit() frame: its slot's rot PI/2 turns +Z to the room's +X, "faces right").
import bpy, bmesh, sys, os, math, json, random
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
opt = dict(zip([a.lstrip('-') for a in argv[0::2]], argv[1::2]))
WHAT = opt['what']; VAR = opt.get('variant', ''); TEX = opt['tex']
random.seed(hash((WHAT, VAR)) & 0xffff)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
T = lambda x, y, z: Matrix.Translation((x, y, z))
RX = lambda a: Matrix.Rotation(a, 4, 'X'); RY = lambda a: Matrix.Rotation(a, 4, 'Y'); RZ = lambda a: Matrix.Rotation(a, 4, 'Z')
S3 = lambda x, y, z: Matrix.Diagonal((x, y, z, 1))
I = Matrix.Identity(4)

# ---------- materials ----------
MATS = {}
def principled(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; return m, m.node_tree, m.node_tree.nodes['Principled BSDF']
def img(nt, f, nc):
    n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(os.path.join(TEX, f))
    if nc: n.image.colorspace_settings.name = 'Non-Color'
    return n
def solid(key, rgb, rough, metal=0.0, emit=None, strength=0.0, coat=0.0):
    m, nt, b = principled(key)
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    if coat: b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = 0.06
    m.diffuse_color = (*rgb, 1); m.metallic = metal; m.roughness = rough   # the workbench preview's colours
    MATS[key] = m
PREVIEW_RGB = {'walnut_nat_col.jpg': (0.2, 0.1, 0.05), 'cymbal_col.jpg': (0.55, 0.36, 0.15)}
def textured(key, col, mr=None, nrm=None, coat=0.0, metal=None, rough=None):
    m, nt, b = principled(key)
    m.diffuse_color = (*PREVIEW_RGB.get(col, (0.5, 0.5, 0.5)), 1); m.metallic = 1.0 if 'cymbal' in col else 0.0; m.roughness = 0.3
    c = img(nt, col, False); nt.links.new(c.outputs['Color'], b.inputs['Base Color'])
    if mr:
        a = img(nt, mr, True); s = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(a.outputs['Color'], s.inputs['Color'])
        nt.links.new(s.outputs['Green'], b.inputs['Roughness']); nt.links.new(s.outputs['Blue'], b.inputs['Metallic'])
    if nrm:
        n = img(nt, nrm, True); nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(n.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if metal is not None: b.inputs['Metallic'].default_value = metal
    if rough is not None: b.inputs['Roughness'].default_value = rough
    if coat: b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = 0.06
    MATS[key] = m
WALNUT = ('walnut_nat_col.jpg', 'walnut_nat_arm.jpg', 'walnut_nat_nrm.jpg')

# ---------- geometry: one bmesh, a slot per material ----------
bm = bmesh.new(); UVL = bm.loops.layers.uv.new('UVMap')
def mi(key): keys = list(MATS.keys()); return keys.index(key)
def face(verts, key, uvs, smooth=False):
    f = bm.faces.new(verts); f.material_index = mi(key); f.smooth = smooth
    for l, uv in zip(f.loops, uvs): l[UVL].uv = uv
    return f
def box(M, x0, x1, y0, y1, z0, z1, key, tile=None, uvoff=(0, 0), skip=()):
    P = lambda x, y, z: M @ Vector((x, y, z))
    F = {'front': [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)], 'back': [(x1, y1, z0), (x0, y1, z0), (x0, y1, z1), (x1, y1, z1)],
         'left': [(x0, y1, z0), (x0, y0, z0), (x0, y0, z1), (x0, y1, z1)], 'right': [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)],
         'top': [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], 'bottom': [(x0, y1, z0), (x1, y1, z0), (x1, y0, z0), (x0, y0, z0)]}
    for k, c in F.items():
        if k in skip: continue
        pts = [P(*q) for q in c]; n = (pts[1] - pts[0]).cross(pts[3] - pts[0])
        ax = max(range(3), key=lambda i: abs(n[i]))
        uvs = [((p.x, p.y) if ax == 2 else (p.y, p.z) if ax == 0 else (p.x, p.z)) for p in (Vector(q) for q in c)]
        uvs = [(u / tile + uvoff[0], v / tile + uvoff[1]) for u, v in uvs] if tile else [(0.5, 0.5)] * 4
        face([bm.verts.new(p) for p in pts], key, uvs)
def plate(M, x0, x1, z0, z1, y, cx, cz, r, n, key):
    """a flat rectangle x0..x1, z0..z1 in the plane y, facing -Y (the front), with one round hole (centre cx, cz, radius r)"""
    corners = [(x1, z1), (x0, z1), (x0, z0), (x1, z0)]
    angs = sorted(set([2 * math.pi * j / n for j in range(n)] + [math.atan2(pz - cz, px - cx) % (2 * math.pi) for px, pz in corners]))
    def hit(t):
        c, s = math.cos(t), math.sin(t); best = 1e9
        if c > 1e-9: best = min(best, (x1 - cx) / c)
        if c < -1e-9: best = min(best, (x0 - cx) / c)
        if s > 1e-9: best = min(best, (z1 - cz) / s)
        if s < -1e-9: best = min(best, (z0 - cz) / s)
        return cx + best * c, cz + best * s
    inner = [bm.verts.new(M @ Vector((cx + r * math.cos(t), y, cz + r * math.sin(t)))) for t in angs]
    outer = [bm.verts.new(M @ Vector((hx, y, hz))) for hx, hz in (hit(t) for t in angs)]
    for k in range(len(angs)):
        k2 = (k + 1) % len(angs)
        face([inner[k], outer[k], outer[k2], inner[k2]], key, [(0.5, 0.5)] * 4)
def rbox(M, w, d, h, r, key, segs=3, tile=None, z0=0.0, sides_key=None, front_key=None, open_front=False):
    """a box w x d x h (x, y, z) standing on z0, every edge rounded r; face keys by facing: front (-Y) / sides / rest;
    open_front leaves out the flat front face (a baffle with holes goes there)"""
    t = bmesh.new(); bmesh.ops.create_cube(t, size=1.0)
    for v in t.verts: v.co = Vector((v.co.x * w, v.co.y * d, v.co.z * h + z0 + h / 2))
    bmesh.ops.bevel(t, geom=list(t.edges), offset=r, segments=segs, affect='EDGES', profile=0.5)
    t.normal_update()
    vmap = {v: bm.verts.new(M @ v.co) for v in t.verts}
    for f in t.faces:
        n = f.normal; key_f = key
        if open_front and n.y < -0.9999: continue
        if front_key and n.y < -0.9: key_f = front_key
        elif sides_key and (abs(n.x) > 0.5 or abs(n.z) > 0.5): key_f = sides_key
        ax = max(range(3), key=lambda i: abs(n[i]))
        uvs = []
        for l in f.loops:
            p = l.vert.co; u, v = (p.x, p.y) if ax == 2 else (p.y, p.z) if ax == 0 else (p.x, p.z)
            uvs.append((u / tile, v / tile) if tile else (0.5, 0.5))
        face([vmap[v] for v in f.verts], key_f, uvs, smooth=True)
    t.free()
def lathe(M, prof, keys, segs=40, uv='planar', ruv=1.0, tile=1.0, smooth=True):
    """revolve (r, a) points about the local Z axis; keys[i] = material of segment i; a new ring where the material changes
    uv: 'planar' (top view, radius ruv -> 0..1), 'cyl' (around x along, metres / tile), 'solid'"""
    th = [2 * math.pi * j / segs for j in range(segs)]
    rings = {}
    def ring(i, run):
        if (i, run) not in rings:
            r, a = prof[i][0], prof[i][1]
            rings[(i, run)] = [bm.verts.new(M @ Vector((0.0, 0.0, a)))] if r < 1e-6 else \
                [bm.verts.new(M @ Vector((r * math.cos(t), r * math.sin(t), a))) for t in th]
        return rings[(i, run)]
    run = 0; along = [0.0]
    for i in range(1, len(prof)): along.append(along[-1] + math.dist(prof[i - 1][:2], prof[i][:2]))
    def uvat(i, j):
        r, a = prof[i][0], prof[i][1]; t = 2 * math.pi * j / segs
        if uv == 'planar': return (0.5 + r * math.cos(t) / (2 * ruv), 0.5 + r * math.sin(t) / (2 * ruv))
        if uv == 'cyl': return (j / segs * (2 * math.pi * max(r, 0.01)) / tile, along[i] / tile)
        return (0.5, 0.5)
    for i in range(len(prof) - 1):
        if i > 0 and (keys[i] != keys[i - 1] or (len(prof[i]) > 2 and prof[i][2] == 'S')): run += 1
        A, B = ring(i, run), ring(i + 1, run)
        for j in range(segs):
            j2 = (j + 1) % segs
            if len(A) == 1: face([A[0], B[j2], B[j]], keys[i], [uvat(i, j), uvat(i + 1, j2 if j2 else segs), uvat(i + 1, j)], smooth)
            elif len(B) == 1: face([A[j], A[j2], B[0]], keys[i], [uvat(i, j), uvat(i, j2 if j2 else segs), uvat(i + 1, j)], smooth)
            else: face([A[j], A[j2], B[j2], B[j]], keys[i], [uvat(i, j), uvat(i, j2 if j2 else segs), uvat(i + 1, j2 if j2 else segs), uvat(i + 1, j)], smooth)
def tube(M, p0, p1, r, key, segs=8):
    """a capped cylinder from p0 to p1 (local coords under M)"""
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0; L = d.length
    R = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    lathe(M @ T(*p0) @ R, [(0, 0), (r, 0), (r, L), (0, L)], [key, key, key], segs, uv='solid')

# ---------- instancing ----------
INST = {}
def part(name, build, key):
    global bm, UVL
    keep_bm, keep_uv = bm, UVL
    bm = bmesh.new(); UVL = bm.loops.layers.uv.new('UVMap'); build()
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); bm, UVL = keep_bm, keep_uv
    for s in MATS: me.materials.append(MATS[s])
    holder = bpy.data.objects.new(name + '_set', None); sc.collection.objects.link(holder)
    INST[name] = {'mesh': me, 'holder': holder, 'n': 0}
def place(name, M):
    o = bpy.data.objects.new(f'{name}.{INST[name]["n"]:03d}', INST[name]['mesh']); sc.collection.objects.link(o)
    o.parent = INST[name]['holder']; o.matrix_world = M; INST[name]['n'] += 1

info = {'what': WHAT, 'variant': VAR}
# =====================================================================================================================
if WHAT == 'monitor':
    W, H = 0.34, 0.52
    D = 0.32 - (0.0125 if VAR == "m1" else 0.0065)   # the cabinet, so the drivers' rings (proud of the baffle) keep the whole box to 0.32
    if VAR == 'm1':   # modern black
        solid('cab', (0.018, 0.018, 0.02), 0.62); solid('baffle', (0.013, 0.013, 0.014), 0.55)
        solid('cone', (0.055, 0.056, 0.06), 0.62); solid('surround', (0.02, 0.02, 0.02), 0.45); solid('cap', (0.03, 0.03, 0.032), 0.25)
        solid('frame', (0.03, 0.03, 0.032), 0.3, 0.6); solid('dome', (0.7, 0.7, 0.72), 0.28, 1.0); solid('guide', (0.02, 0.02, 0.022), 0.2)
        solid('hole', (0.004, 0.004, 0.004), 0.9); solid('screw', (0.05, 0.05, 0.05), 0.35, 0.8)
        solid('led', (0.2, 0.12, 0.02), 0.3, 0.0, (1.0, 0.6, 0.15), 3.0)
        RB = 0.014
        rbox(I, W, D, H, RB, 'cab', segs=3, open_front=True)
        yb = -D / 2  # the baffle plane
        BX0, BX1, BZ0, BZ1 = -W / 2 + RB, W / 2 - RB, RB, H - RB
    else:             # m2: a vintage hint: walnut sides, a cream baffle set in, a paper cone, chrome trim
        textured('cab', *WALNUT[:1], mr=WALNUT[1], nrm=WALNUT[2])
        solid('baffle', (0.2, 0.165, 0.11), 0.62); solid('back', (0.02, 0.02, 0.02), 0.6)
        solid('cone', (0.36, 0.25, 0.14), 0.85); solid('surround', (0.03, 0.028, 0.026), 0.7); solid('cap', (0.3, 0.2, 0.11), 0.6)
        solid('frame', (0.75, 0.75, 0.74), 0.2, 1.0); solid('dome', (0.12, 0.1, 0.08), 0.8); solid('guide', (0.75, 0.75, 0.74), 0.2, 1.0)
        solid('hole', (0.004, 0.004, 0.004), 0.9); solid('screw', (0.75, 0.75, 0.74), 0.25, 1.0)
        # the wood wrap (sides, top, bottom) 2 cm thick, the baffle set 6 mm in, a black back
        t = 0.02
        box(I, -W / 2, -W / 2 + t, -D / 2, D / 2, 0, H, 'cab', tile=0.9, uvoff=(0.1, 0.0))
        box(I, W / 2 - t, W / 2, -D / 2, D / 2, 0, H, 'cab', tile=0.9, uvoff=(0.4, 0.2))
        box(I, -W / 2 + t, W / 2 - t, -D / 2, D / 2, H - t, H, 'cab', tile=0.9, uvoff=(0.7, 0.1))
        box(I, -W / 2 + t, W / 2 - t, -D / 2, D / 2, 0, t, 'cab', tile=0.9, uvoff=(0.2, 0.6))
        box(I, -W / 2 + t, W / 2 - t, D / 2 - 0.012, D / 2, t, H - t, 'back', skip=('front',))
        yb = -D / 2 + 0.006   # the cream baffle, set 6 mm into the wood wrap
        BX0, BX1, BZ0, BZ1 = -W / 2 + t, W / 2 - t, t, H - t
    # drivers on the baffle: local Z out of the baffle (-Y), a = distance in front of it
    FR = lambda x, z: T(x, yb, z) @ RX(math.pi / 2)  # local +Z -> -Y
    wz, tz, zs = 0.205, 0.405, 0.34
    # the baffle: two plates, each with a round hole the driver's flange covers (the cones sit behind the baffle plane)
    plate(I, BX0, BX1, BZ0, zs, yb, 0.0, wz, 0.1, 36, 'baffle')
    plate(I, BX0, BX1, zs, BZ1, yb, 0.0, tz, 0.044 if VAR == 'm2' else 0.052, 24, 'baffle')
    box(I, -0.1, 0.1, yb + 0.0005, yb + 0.12, wz - 0.1, wz + 0.1, 'hole', skip=('front',))   # dark behind the cone gaps
    woof =[(0.107, 0.0), (0.107, 0.004), (0.097, 0.006, 'S'), (0.094, 0.006), (0.09, 0.0125), (0.084, 0.0125), (0.08, 0.006), (0.079, 0.005), (0.06, -0.007), (0.042, -0.017), (0.032, -0.021),
            (0.031, -0.02), (0.024, -0.01), (0.013, -0.004), (0.0, -0.003)]
    wkeys = ['frame', 'frame', 'frame', 'surround', 'surround', 'surround', 'surround', 'cone', 'cone', 'cone', 'cone', 'cap', 'cap', 'cap']
    lathe(FR(0, wz), woof, wkeys, 36, uv='planar', ruv=0.11)
    if VAR == 'm1':
        tw = [(0.058, 0.0), (0.058, 0.005), (0.05, 0.004), (0.034, -0.004), (0.018, -0.009), (0.016, -0.009, 'S'), (0.012, -0.004), (0.006, 0.0), (0.0, 0.001)]
        tk = ['guide'] * 5 + ['dome'] * 3
    else:
        tw = [(0.05, 0.0), (0.05, 0.004), (0.042, 0.005), (0.03, 0.004), (0.018, 0.002), (0.016, 0.002, 'S'), (0.012, 0.007), (0.006, 0.01), (0.0, 0.011)]
        tk = ['guide'] * 5 + ['dome'] * 3
    lathe(FR(0, tz), tw, tk, 32, uv='planar', ruv=0.06)
    # the bass port
    if VAR == 'm1':   # a slot port across the bottom: a flared lip, a dark mouth
        pw, ph = 0.2, 0.032; pz = 0.062
        for (x0, x1, z0, z1) in ((-pw / 2 - 0.006, pw / 2 + 0.006, pz + ph / 2, pz + ph / 2 + 0.006), (-pw / 2 - 0.006, pw / 2 + 0.006, pz - ph / 2 - 0.006, pz - ph / 2),
                                 (-pw / 2 - 0.006, -pw / 2, pz - ph / 2, pz + ph / 2), (pw / 2, pw / 2 + 0.006, pz - ph / 2, pz + ph / 2)):
            box(I, x0, x1, yb - 0.005, yb, z0, z1, 'guide', skip=('back',))
        box(I, -pw / 2, pw / 2, yb - 0.0015, yb, pz - ph / 2, pz + ph / 2, 'hole', skip=('back',))
        lathe(FR(0.135, 0.032), [(0.0032, 0.0), (0.0032, 0.0012), (0.0, 0.0012)], ['led', 'led'], 10, uv='solid')  # a power light, no words
    else:              # a round port, chrome ring, dark throat
        lathe(FR(0, 0.075), [(0.038, 0.0), (0.038, 0.003), (0.031, 0.004, 'S'), (0.03, 0.0), (0.03, -0.0005)], ['frame', 'frame', 'hole', 'hole'], 28, uv='solid')
        lathe(FR(0, 0.075), [(0.03, 0.0006), (0.0, 0.0006)], ['hole'], 28, uv='solid')
    # driver screws (instanced)
    part('screw', lambda: lathe(I, [(0.0045, 0.0), (0.0035, 0.002), (0.0, 0.0025)], ['screw', 'screw'], 8, uv='solid'), 'screw')
    for k in range(6):
        a = k * math.pi / 3 + math.pi / 6; place('screw', FR(0.101 * math.cos(a), wz + 0.101 * math.sin(a)) @ T(0, 0, 0.004))
    for k in range(3):
        a = k * 2 * math.pi / 3 + math.pi / 2; place('screw', FR(0.051 * math.cos(a), tz + 0.051 * math.sin(a)) @ T(0, 0, 0.004))
# =====================================================================================================================
elif WHAT == 'stand':
    HS = 1.29
    if VAR == 'm1':
        solid('steel', (0.02, 0.02, 0.022), 0.5, 0.3); solid('spike', (0.3, 0.3, 0.3), 0.3, 1.0)
        rbox(I, 0.30, 0.30, 0.022, 0.004, 'steel', segs=2, z0=0.012)                      # the heavy base plate
        lathe(T(0, 0, 0.034), [(0.0, 0.0), (0.03, 0.0), (0.03, HS - 0.046), (0.0, HS - 0.046)], ['steel'] * 3, 28, uv='solid')
        rbox(I, 0.22, 0.22, 0.012, 0.003, 'steel', segs=2, z0=HS - 0.012)               # the top plate
        part('spike', lambda: lathe(I, [(0.0, 0.0), (0.012, 0.012), (0.0, 0.012)], ['spike', 'spike'], 10, uv='solid'), 'spike')
        for sx in (-1, 1):
            for sy in (-1, 1): place('spike', T(sx * 0.125, sy * 0.125, 0))
    else:
        solid('iron', (0.035, 0.032, 0.03), 0.62, 0.6); solid('pole', (0.03, 0.03, 0.03), 0.35, 0.4)
        textured('wood', *WALNUT[:1], mr=WALNUT[1], nrm=WALNUT[2])
        lathe(I, [(0.0, 0.0), (0.17, 0.0), (0.17, 0.02), (0.15, 0.034), (0.0, 0.034)], ['iron'] * 4, 40, uv='solid')  # a round cast base
        lathe(T(0, 0, 0.034), [(0.0, 0.0), (0.05, 0.0), (0.03, 0.03), (0.026, 0.04), (0.026, HS - 0.075), (0.04, HS - 0.064), (0.0, HS - 0.064)], ['iron', 'iron', 'pole', 'pole', 'pole', 'pole'], 28, uv='solid')
        box(I, -0.115, 0.115, -0.12, 0.12, HS - 0.03, HS, 'wood', tile=0.9)           # a walnut top block
# =====================================================================================================================
elif WHAT == 'kit':
    if VAR == 'k1': solid('shell', (0.075, 0.004, 0.016), 0.3, 0.0, coat=0.7); solid('reso', (0.012, 0.012, 0.013), 0.42)
    else:           textured('shell', 'walnut_nat_col.jpg', mr='walnut_nat_arm.jpg', nrm='walnut_nat_nrm.jpg', coat=1.0); solid('reso', (0.62, 0.53, 0.38), 0.72)
    solid('head', (0.78, 0.76, 0.7), 0.68); solid('chrome', (0.8, 0.8, 0.82), 0.12, 1.0); solid('black', (0.02, 0.02, 0.02), 0.55)
    solid('felt', (0.55, 0.52, 0.47), 0.95); solid('hole', (0.004, 0.004, 0.004), 0.9)
    textured('bronze', 'cymbal_col.jpg', mr='cymbal_mr.jpg')
    def drum(M, R, Dp, top_key='head', bot_key='head', hoop='chrome', lugs=8, rod=True):
        """a drum on its local Z axis, centred; heads at +-Dp/2"""
        h = Dp / 2
        lathe(M, [(R, -h + 0.004), (R, h - 0.004)], ['shell'], 44, uv='cyl', tile=0.9)
        lathe(M, [(R - 0.002, h - 0.0005), (0.0, h)], [top_key], 44, uv='planar', ruv=R)       # the top head
        lathe(M, [(0.0, -h), (R - 0.002, -h + 0.0005)], [bot_key], 44, uv='planar', ruv=R)     # the bottom head
        P = [(R + 0.001, h - 0.012), (R + 0.008, h - 0.012), (R + 0.008, h + 0.006), (R - 0.003, h + 0.006), (R - 0.003, h - 0.003)]
        for prof in (P, [(r, -a) for r, a in reversed(P)]):  # the hoops: the top one, and its mirror (reversed, so it faces out)
            lathe(M, prof, [hoop] * 4, 44, uv='cyl' if hoop == 'shell' else 'solid', tile=0.9)
        for k in range(lugs):
            a = 2 * math.pi * (k + 0.5) / lugs
            place('lug', M @ RZ(a) @ T(R, 0, 0) @ S3(1, 1, max(0.5, Dp / 0.2)))
            if rod:
                for s in (1, -1): place('rod', M @ RZ(a) @ T(R + 0.006, 0, s * h * 0.55) @ S3(1, 1, h * 0.9 / 0.1))
    part('lug', lambda: box(I, -0.004, 0.013, -0.009, 0.009, -0.03, 0.03, 'chrome'), 'chrome')
    part('rod', lambda: lathe(I, [(0.0, -0.05), (0.0028, -0.05), (0.0028, 0.05), (0.0, 0.05)], ['chrome'] * 3, 6, uv='solid'), 'chrome')
    part('leg', lambda: lathe(I, [(0.0, 0.0), (0.009, 0.0), (0.009, 1.0), (0.0, 1.0)], ['chrome'] * 3, 8, uv='solid'), 'chrome')
    part('foot', lambda: lathe(I, [(0.0, 0.0), (0.016, 0.0), (0.016, 0.018), (0.0, 0.03)], ['black'] * 3, 8, uv='solid'), 'black')
    def tripod(cx, cy, r, h_hub, a0=0.0):
        """three legs from a hub on the post down to rubber feet"""
        for k in range(3):
            a = a0 + k * 2 * math.pi / 3; fx, fy = cx + r * math.cos(a), cy + r * math.sin(a)
            p0, p1 = Vector((fx, fy, 0.02)), Vector((cx, cy, h_hub)); d = p1 - p0
            place('leg', T(*p0) @ d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4() @ S3(1, 1, d.length))
            place('foot', T(fx, fy, 0))
    def cymbal(M, R):
        prof = [(R, -0.008), (R * 0.55, 0.004), (0.046, 0.009), (0.034, 0.02), (0.018, 0.029), (0.0, 0.03)]  # edge to bell: faces up
        lathe(M, prof, ['bronze'] * 5, 48, uv='planar', ruv=R)
        lathe(M, [(0.006, 0.02), (0.006, 0.032), (0.0, 0.032)], ['felt', 'felt'], 10, uv='solid')  # the felt / nut on top
    # --- the kick: 20 x 14, on its side, the resonant head to the front (-Y), the batter to the drummer (+Y)
    KR, KD = 0.254, 0.356; kx, ky, kz = -0.1, -0.07, KR + 0.012
    KM = T(kx, ky, kz) @ RX(math.pi / 2)          # local +Z -> -Y: the 'top' head of drum() faces the front
    drum(KM, KR, KD, top_key='reso', bot_key='head', hoop='shell', lugs=10)
    # the port in the resonant head: a dark round hole with a chrome ring, off centre (no logo)
    PM = KM @ T(0.085, -0.075, KD / 2 + 0.0015)
    lathe(PM, [(0.058, 0.0), (0.05, 0.0)], ['chrome'], 36, uv='solid'); lathe(PM, [(0.05, 0.0002), (0.0, 0.0002)], ['hole'], 36, uv='solid')
    for sx in (-1, 1):  # spurs: front legs to the floor
        p0 = Vector((kx + sx * 0.2, ky - 0.08, kz - 0.12)); p1 = Vector((kx + sx * 0.33, ky - 0.2, 0.015)); d = p1 - p0
        place('leg', T(*p0) @ d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4() @ S3(0.8, 0.8, d.length)); place('foot', T(p1.x, p1.y, 0))
    # the pedal on the drummer's side: footboard, posts, beater
    py = ky + KD / 2 + 0.03
    box(I @ T(kx, py + 0.13, 0.02) @ RX(math.radians(-8)), -0.045, 0.045, -0.13, 0.13, 0.0, 0.018, 'black')
    for sx in (-1, 1): tube(I, (kx + sx * 0.045, py + 0.01, 0.0), (kx + sx * 0.045, py + 0.01, 0.2), 0.007, 'chrome', 8)
    tube(I, (kx - 0.05, py + 0.01, 0.2), (kx + 0.05, py + 0.01, 0.2), 0.006, 'chrome', 8)
    tube(I, (kx, py + 0.01, 0.2), (kx, py - 0.02, 0.34), 0.0035, 'chrome', 6)
    lathe(T(kx - 0.022, py - 0.024, 0.35) @ RY(math.pi / 2), [(0.0, 0.0), (0.024, 0.0), (0.024, 0.044), (0.0, 0.044)], ['felt'] * 3, 14, uv='solid')
    # --- the rack tom: 12 x 8 on a post from the kick, tipped toward the drummer
    tube(I, (kx + 0.02, ky + 0.02, kz + KR - 0.01), (kx + 0.02, ky + 0.06, kz + KR + 0.2), 0.011, 'chrome', 10)
    TM = T(kx + 0.07, ky + 0.1, kz + KR + 0.24) @ RX(math.radians(-24)) @ RY(math.radians(10))
    drum(TM, 0.152, 0.203, lugs=6)
    # --- the snare: 14 x 5.5 on its stand, at the drummer's left knee
    sxp, syp, sz = 0.24, 0.2, 0.6
    tripod(sxp, syp, 0.2, 0.2, 0.4)
    tube(I, (sxp, syp, 0.18), (sxp, syp, sz - 0.08), 0.009, 'chrome', 8)
    for k in range(3):  # the basket arms
        a = 0.4 + k * 2 * math.pi / 3
        tube(I, (sxp, syp, sz - 0.085), (sxp + 0.16 * math.cos(a), syp + 0.16 * math.sin(a), sz - 0.06), 0.004, 'chrome', 6)
    drum(T(sxp, syp, sz) @ RX(math.radians(-7)), 0.178, 0.14, lugs=10)
    # --- the hi-hat: 14" pair on its stand, further left, its pedal by the drummer's left foot
    hx, hy = 0.42, 0.04
    tripod(hx, hy, 0.22, 0.24, 0.6)
    tube(I, (hx, hy, 0.2), (hx, hy, 0.88), 0.011, 'chrome', 10); tube(I, (hx, hy, 0.88), (hx, hy, 1.0), 0.0045, 'chrome', 6)
    box(I @ T(hx, hy + 0.17, 0.022) @ RX(math.radians(-9)), -0.04, 0.04, -0.13, 0.13, 0.0, 0.016, 'black')
    cymbal(T(hx, hy, 0.885) @ RX(math.pi), 0.178)    # the bottom one, upside down
    cymbal(T(hx, hy, 0.91), 0.178)
    # --- a 16" crash-ride over the kick's other side, on an arm clamped to the kick (a compact-kit mount: no third tripod)
    rx_, ry_, rz_ = -0.29, 0.02, 0.97
    tube(I, (kx - 0.07, ky - 0.03, kz + KR - 0.01), (kx - 0.12, ky - 0.03, kz + KR + 0.27), 0.011, 'chrome', 10)
    tube(I, (kx - 0.12, ky - 0.03, kz + KR + 0.27), (rx_, ry_, rz_ - 0.01), 0.008, 'chrome', 8)
    cymbal(T(rx_, ry_, rz_) @ RX(math.radians(-14)), 0.203)
# =====================================================================================================================
elif WHAT == 'throne':
    solid('seat', (0.022, 0.02, 0.019), 0.5); solid('chrome', (0.8, 0.8, 0.82), 0.12, 1.0); solid('black', (0.02, 0.02, 0.02), 0.55)
    lathe(T(0, 0, 0.545), [(0.0, 0.0), (0.165, 0.0), (0.175, 0.012), (0.18, 0.04), (0.176, 0.062), (0.16, 0.08), (0.11, 0.09), (0.0, 0.092)], ['seat'] * 7, 44, uv='solid')
    lathe(T(0, 0, 0.53), [(0.0, 0.0), (0.12, 0.0), (0.12, 0.016), (0.0, 0.016)], ['black'] * 3, 32, uv='solid')
    tube(I, (0, 0, 0.16), (0, 0, 0.53), 0.016, 'chrome', 12); tube(I, (0, 0, 0.3), (0, 0, 0.33), 0.022, 'black', 12)  # post + height collar
    tube(I, (0, 0, 0.12), (0, 0, 0.2), 0.024, 'chrome', 12)
    part('leg', lambda: lathe(I, [(0.0, 0.0), (0.011, 0.0), (0.011, 1.0), (0.0, 1.0)], ['chrome'] * 3, 8, uv='solid'), 'chrome')
    part('foot', lambda: lathe(I, [(0.0, 0.0), (0.018, 0.0), (0.018, 0.02), (0.0, 0.032)], ['black'] * 3, 8, uv='solid'), 'black')
    for k in range(3):
        a = k * 2 * math.pi / 3 + math.pi / 2; fx, fy = 0.24 * math.cos(a), 0.24 * math.sin(a)
        for (z0, z1, r0) in ((0.02, 0.16, 1.0),):
            p0, p1 = Vector((fx, fy, z0)), Vector((0, 0, z1)); d = p1 - p0
            place('leg', T(*p0) @ d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4() @ S3(1, 1, d.length)); place('foot', T(fx, fy, 0))
        p0, p1 = Vector((fx * 0.55, fy * 0.55, 0.09)), Vector((0, 0, 0.27)); d = p1 - p0   # the brace
        place('leg', T(*p0) @ d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4() @ S3(0.7, 0.7, d.length))

# ---------- the static object, recentred on its footprint ----------
me = bpy.data.meshes.new(f'{WHAT}_{VAR}'); bm.normal_update(); bm.to_mesh(me); bm.free()
for s in MATS: me.materials.append(MATS[s])
ob = bpy.data.objects.new(f'{WHAT}_{VAR}' if VAR else WHAT, me); sc.collection.objects.link(ob)
pts = [ob.matrix_world @ v.co for v in me.vertices]
for k, v in INST.items():
    for c in v['holder'].children: pts += [c.matrix_world @ p.co for p in v['mesh'].vertices]
mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
shift = Vector((-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z))
me.transform(Matrix.Translation(shift))
for k, v in INST.items():
    for c in v['holder'].children: c.matrix_world = Matrix.Translation(shift) @ c.matrix_world
me.calc_loop_triangles(); static = len(me.loop_triangles)
inst = {}
for k, v in INST.items(): v['mesh'].calc_loop_triangles(); inst[k] = (len(v['mesh'].loop_triangles), v['n'])
info.update({'static_tris': static, 'rendered_tris': static + sum(a * b for a, b in inst.values()), 'unique_tris': static + sum(a for a, b in inst.values()),
             'instances': inst, 'size_xyz': [round(v, 3) for v in (mx - mn)], 'recentred_by': [round(v, 3) for v in shift]})
print('CORNERINFO', json.dumps(info))
if opt.get('preview'):
    pv = opt['preview']; os.makedirs(pv, exist_ok=True)
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'
    sc.render.resolution_x, sc.render.resolution_y = 700, 700
    cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera = cam
    h = mx.z - mn.z; r = max(mx.x - mn.x, mx.y - mn.y, h) * 2.4
    for nm_, ang, el in (('front', 0, 10), ('q34', 40, 25), ('side', 90, 15), ('back', 180, 30)):
        a, e = math.radians(ang), math.radians(el)
        p = Vector((r * math.sin(a) * math.cos(e), -r * math.cos(a) * math.cos(e), h / 2 + r * math.sin(e)))
        cam.location = p; cam.rotation_euler = (Vector((0, 0, h / 2)) - p).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = os.path.join(pv, nm_ + '.png'); bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)
out = opt['out']; os.makedirs(os.path.dirname(out), exist_ok=True)
for o in list(bpy.data.objects):
    if o.type == 'EMPTY' and not o.children: bpy.data.objects.remove(o)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, export_image_format='AUTO', export_yup=True,
                          export_cameras=False, export_lights=False, export_animations=False, export_gpu_instances=True)
print('CORNEROUT', out, os.path.getsize(out))
