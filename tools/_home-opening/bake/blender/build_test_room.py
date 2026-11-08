# Phase 1 test room for the baked-light engine (route B).
#   Blender -b --factory-startup -P build_test_room.py -- out=<file.blend> [lm=1024]
# A 4 x 3 x 3 m box (Blender: x 4 m long, y 3 m wide, z 3 m high), white-ish walls/floor/ceiling (albedo 0.8),
# the far wall (x = +2) a mid-grey card (0.18), a 0.8 x 0.5 x 1.0 m box prop (0.5), and two light groups:
#   G1_lamp: an amber point lamp (like room.html's pendants), a true point (radius 0) so a live three.js PointLight can match it
#   G2_neon: a violet emissive tube along the ceiling edge of the y = -1.5 wall (like the neon strips)
# Materials are pure Lambert (Principled, Specular IOR Level 0, roughness 1): the bake carries diffuse light only, so the
# parity test compares like with like. UV1 = materials, UV2 = the lightmap atlas (all baked meshes packed together).
import bpy, bmesh, math, sys, os
from mathutils import Vector
sys.path.insert(0, os.path.dirname(__file__))
import common

A = common.args()
OUT = A.get('out') or '/tmp/test-room.blend'
LM = int(A.get('lm', 1024))

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0

# a black world: all light comes from the two groups
world = bpy.data.worlds.get('World') or bpy.data.worlds.new('World')
scene.world = world
bg = world.node_tree.nodes.get('Background')
bg.inputs['Color'].default_value = (0, 0, 0, 1)
bg.inputs['Strength'].default_value = 0.0


def lambert(name, albedo, emission=None, strength=0.0):
    m = bpy.data.materials.new(name)
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*albedo, 1)
    p.inputs['Roughness'].default_value = 1.0
    p.inputs['Metallic'].default_value = 0.0
    p.inputs['Specular IOR Level'].default_value = 0.0   # no specular: exports as KHR_materials_specular factor 0
    if emission:
        p.inputs['Emission Color'].default_value = (*emission, 1)
        p.inputs['Emission Strength'].default_value = strength
    return m


M_WHITE = lambert('M_White', (0.8, 0.8, 0.8))
M_GREY = lambert('M_GreyCard', (0.18, 0.18, 0.18))
M_PROP = lambert('M_Prop', (0.5, 0.5, 0.5))
NEON_RGB = (0.55, 0.15, 1.0)   # room.html's violet strip, linear
M_NEON = lambert("M_Neon", (0, 0, 0), NEON_RGB, 4.0)


def mesh_object(name, bm, mats):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    return o


# the room shell: a box seen from inside (normals in)
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1.0)
for v in bm.verts:
    v.co = Vector((v.co.x * 4.0, v.co.y * 3.0, v.co.z * 3.0 + 1.5))
bmesh.ops.reverse_faces(bm, faces=bm.faces)
for f in bm.faces:
    f.material_index = 1 if f.calc_center_median().x > 1.99 else 0   # the far wall is the grey card
room = mesh_object('Room', bm, [M_WHITE, M_GREY])

# the prop: 0.8 (x) x 0.5 (y) x 1.0 (z) on the floor, no bottom face
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1.0)
for v in bm.verts:
    v.co = Vector((v.co.x * 0.8 + 0.9, v.co.y * 0.5 + 0.4, v.co.z * 1.0 + 0.5))
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.normal.z < -0.9], context='FACES')
prop = mesh_object('Prop', bm, [M_PROP])

# G2: the violet tube, radius 2.4 cm (room.html's), 3.6 m along the ceiling edge of the y = -1.5 wall
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.024, radius2=0.024, depth=3.6)
for v in bm.verts:
    v.co = Vector((v.co.z, v.co.y - 1.42, -v.co.x + 2.93))   # its axis along x (a rotation: normals stay out)
tube = mesh_object('NeonTube', bm, [M_NEON])
tube['light_group'] = 'G2_neon'

# G1: the amber lamp, a true point light (radius 0, no soft falloff) hanging 0.55 m under the ceiling
ld = bpy.data.lights.new('Lamp', 'POINT')
ld.energy = 20.0                     # W
ld.color = (1.0, 0.45, 0.15)         # amber, linear (room.html's pendant 0xffa04a is (1, 0.35, 0.07) linear)
ld.shadow_soft_size = 0.0
ld.use_soft_falloff = False
lamp = bpy.data.objects.new('Lamp', ld)
lamp.location = (0.2, 0.2, 2.45)
scene.collection.objects.link(lamp)
lamp['light_group'] = 'G1_lamp'

# the camera: one end of the room, looking down it at the grey card, the lit side wall on the right
cd = bpy.data.cameras.new('Cam')
cd.sensor_fit = 'VERTICAL'           # glTF stores yfov: with vertical fit the exporter passes Blender's angle through
cd.angle_y = math.radians(50.0)
cd.clip_start, cd.clip_end = 0.05, 100.0
cam = bpy.data.objects.new('Cam', cd)
cam.location = Vector((-1.85, 1.05, 1.45))
cam.rotation_mode = 'QUATERNION'
cam.rotation_quaternion = (Vector((2.0, -0.45, 1.3)) - cam.location).to_track_quat('-Z', 'Y')
cam.rotation_mode = 'XYZ'
scene.collection.objects.link(cam)
scene.camera = cam
scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 1141, 636, 100

for o in (room, prop):
    o['bake'] = 'pack0'

# UVs: UV1 (materials; unused by the test room but present so TEXCOORD_1 is the second map, as in a real scene),
# UV2 the lightmap atlas, every baked mesh packed into one 0..1 square with a margin
bpy.ops.object.select_all(action='DESELECT')
for o in (room, prop):
    o.data.uv_layers.new(name='UV1')
    o.data.uv_layers.new(name=common.LM_UV)
    o.select_set(True)
bpy.context.view_layer.objects.active = room
for uv in ('UV1', common.LM_UV):
    for o in (room, prop):
        o.data.uv_layers.active = o.data.uv_layers[uv]
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0, scale_to_bounds=False)
    if uv == common.LM_UV:
        # one atlas for both objects; 12 px between islands at LM px (the bake's margin fills them)
        bpy.ops.uv.pack_islands(udim_source='CLOSEST_UDIM', rotate=True, scale=True, margin_method='FRACTION',
                                margin=12.0 / LM, shape_method='AABB')
    bpy.ops.object.mode_set(mode='OBJECT')
for o in (room, prop):
    o.data.uv_layers.active = o.data.uv_layers['UV1']
    o.data.uv_layers['UV1'].active_render = True

bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('BUILT', OUT)
