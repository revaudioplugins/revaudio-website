# Export the room for three.js and the measuring masks for the parity test.
#   Blender -b <room.blend> -P export_gltf.py -- gltf=<out.gltf> ids=<surface-id.png> [info=<camera.json>]
# glTF: .gltf + .bin (no textures inside), +Y up, metres, every UV map (UV2 -> TEXCOORD_1), the camera (vertical yfov),
# the lights in "Unitless" units (point / spot: W / 4 pi; KHR_lights_punctual), custom properties as extras
# (light_group, bake -> userData).
# ids: one ray per pixel centre of Blender's camera at the render size, the surface it hits (1 grey card, 2 side wall
# y = -1.5, 3 side wall y = +1.5, 4 floor, 5 ceiling, 6 back wall, 7 prop, 8 tube, 0 nothing); the parity regions come
# from it, so a wall pixel hidden by the prop or the tube never counts.
import bpy, sys, os, math
import numpy as np
import OpenImageIO as oiio
from mathutils import Vector
sys.path.insert(0, os.path.dirname(__file__))
import common

A = common.args()
scene = bpy.context.scene
cam = scene.camera

if A.get('gltf'):
    os.makedirs(os.path.dirname(A['gltf']), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=A['gltf'], export_format='GLTF_SEPARATE', export_yup=True, export_apply=True,
                              export_texcoords=True, export_normals=True, export_materials='EXPORT', export_cameras=True,
                              export_lights=True, export_import_convert_lighting_mode='COMPAT', export_extras=True,
                              use_selection=False)
    print('EXPORTED', A['gltf'])

W, H = scene.render.resolution_x, scene.render.resolution_y
if A.get('info'):
    d = cam.data
    common.write_json(A['info'], {'location': list(cam.location), 'rotation_euler': list(cam.rotation_euler),
                                  'yfov_deg': math.degrees(d.angle_y), 'sensor_fit': d.sensor_fit, 'size': [W, H],
                                  'clip': [d.clip_start, d.clip_end]})

if A.get('ids'):
    dg = bpy.context.evaluated_depsgraph_get()
    mw = cam.matrix_world
    tr, br, bl, tl = [mw @ v for v in cam.data.view_frame(scene=scene)]   # top-right, bottom-right, bottom-left, top-left
    o = mw.translation
    ids = np.zeros((H, W), np.uint8)
    room = scene.objects['Room']
    for j in range(H):
        fy = (j + 0.5) / H
        left, right = tl.lerp(bl, fy), tr.lerp(br, fy)
        for i in range(W):
            p = left.lerp(right, (i + 0.5) / W)
            hit, loc, nrm, face, ob, _ = scene.ray_cast(dg, o, (p - o).normalized())
            if not hit:
                continue
            if ob.name == 'Room':
                if room.data.polygons[face].material_index == 1:
                    ids[j, i] = 1
                else:
                    n = room.data.polygons[face].normal
                    ids[j, i] = 2 if n.y > 0.9 else 3 if n.y < -0.9 else 4 if n.z > 0.9 else 5 if n.z < -0.9 else 6
            elif ob.name == 'Prop':
                ids[j, i] = 7
            else:
                ids[j, i] = 8
    oiio.ImageBuf(np.ascontiguousarray(ids[..., None])).write(A['ids'])   # (ImageOutput mis-strides a 2-D array)
    print('IDS', A['ids'], {k: int((ids == k).sum()) for k in range(9)})
