# Blender's own picture of the room, the parity reference: Cycles, AgX, Look None, exposure 0, 1141 x 636.
#   Blender -b <room.blend> -P render_reference.py -- out=<dir> [samples=1024] [configs=G1_lamp,G2_neon,all,G1_lamp_direct]
# Per config: <out>/<config>.exr (scene-linear, the numbers) and <out>/<config>.png (AgX, what Dan sees).
#   <group>         that group alone, its real colour, all bounces
#   all             every group on (what the bake's sum must equal)
#   <group>_direct  that group alone, direct light only (max bounces 0): what a live three.js light can match
import bpy, sys, os, time, json
sys.path.insert(0, os.path.dirname(__file__))
import common

A = common.args()
OUT = A['out']
SAMPLES = int(A.get('samples', 1024))
scene = bpy.context.scene
snap = common.snapshot(scene)
names = list(common.groups(scene))
configs = (A.get('configs') or ','.join(names + ['all', names[0] + '_direct'])).split(',')
os.makedirs(OUT, exist_ok=True)

common.setup_cycles(scene, SAMPLES)
c = scene.cycles
c.use_adaptive_sampling = True
c.adaptive_threshold = 0.005
c.use_denoising = True
c.denoiser = 'OPENIMAGEDENOISE'
c.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
vs = scene.view_settings
vs.view_transform, vs.look, vs.exposure, vs.gamma = 'AgX', 'None', 0.0, 1.0
scene.display_settings.display_device = 'sRGB'
scene.render.film_transparent = False
bounces = c.max_bounces

times = {}
for cfg in configs:
    direct = cfg.endswith('_direct')
    g = cfg[:-7] if direct else cfg
    common.set_groups(snap, names if g == 'all' else [g])
    c.max_bounces = 0 if direct else bounces
    t = time.time()
    bpy.ops.render.render()
    times[cfg] = round(time.time() - t, 1)
    img = bpy.data.images['Render Result']
    s = scene.render.image_settings
    s.file_format, s.color_mode, s.color_depth, s.exr_codec = 'OPEN_EXR', 'RGB', '32', 'ZIP'
    img.save_render(os.path.join(OUT, cfg + '.exr'), scene=scene)
    s.file_format, s.color_mode, s.color_depth = 'PNG', 'RGB', '8'
    img.save_render(os.path.join(OUT, cfg + '.png'), scene=scene)
    print('RENDERED', cfg, times[cfg], 's')

common.set_groups(snap, names)
c.max_bounces = bounces
common.write_json(os.path.join(OUT, 'render-times.json'), {'samples': SAMPLES, 'adaptive_threshold': 0.005,
                  'denoiser': 'OIDN (albedo+normal)', 'seconds': times, 'view': 'AgX / None / exposure 0 / gamma 1 / sRGB'})
