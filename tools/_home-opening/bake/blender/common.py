# Shared helpers for the bake scripts (Blender 5.2, run inside Blender: -b --factory-startup -P <script> -- <args>).
#
# The conventions a scene follows to be baked (the test room and, in phase 2, the real far-end corner):
#   - a light belongs to a group by the custom property  light_group = "<name>"  on the LIGHT object;
#   - an emissive mesh (a neon tube, a screen) the same, on the MESH object: its materials' emission is the group's;
#   - a mesh to bake carries  bake = "<pack name>"  (all baked meshes share one atlas on the UV map "UV2").
import bpy, sys, os, json, math

LM_UV = 'UV2'


def args():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    out = {}
    for x in a:
        k, _, v = x.partition('=')
        out[k.lstrip('-')] = v if v != '' else '1'
    return out


def setup_cycles(scene, samples, gpu=True):
    """Cycles, unclamped and with deep diffuse bounces, so the bake and the reference render share one light transport."""
    scene.render.engine = 'CYCLES'
    if gpu:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'METAL'
        prefs.refresh_devices()
        for d in prefs.devices:
            d.use = d.type == 'METAL'
        scene.cycles.device = 'GPU'
    c = scene.cycles
    c.samples = samples
    c.sample_clamp_direct = 0.0      # no clamping: it biases bright near-field light (the tube) differently per path
    c.sample_clamp_indirect = 0.0
    c.max_bounces = 24
    c.diffuse_bounces = 16           # a white room: 4 (the default) drops a visible share of the bounce light
    c.glossy_bounces = 4
    c.transmission_bounces = 4
    c.transparent_max_bounces = 8
    c.volume_bounces = 0
    c.caustics_reflective = False
    c.caustics_refractive = False
    c.light_sampling_threshold = 0.0
    c.seed = 7


def groups(scene=None):
    """{group: {'lights': [obj], 'emitters': [obj]}} from the light_group custom properties."""
    scene = scene or bpy.context.scene
    g = {}
    for o in scene.objects:
        name = o.get('light_group')
        if not name:
            continue
        e = g.setdefault(name, {'lights': [], 'emitters': []})
        (e['lights'] if o.type == 'LIGHT' else e['emitters']).append(o)
    return dict(sorted(g.items()))


def _emission_sockets(mat):
    """(color socket, strength socket) pairs of a material's emission: Principled BSDF or Emission nodes."""
    out = []
    if not mat or not mat.node_tree:
        return out
    for n in mat.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            out.append((n.inputs['Emission Color'], n.inputs['Emission Strength']))
        elif n.type == 'EMISSION':
            out.append((n.inputs['Color'], n.inputs['Strength']))
    return out


def snapshot(scene=None):
    """The scene's own light values, to restore after a bake or a group render."""
    snap = {'lights': {}, 'emit': {}}
    for name, e in groups(scene).items():
        for o in e['lights']:
            snap['lights'][o.name] = (o.data.energy, tuple(o.data.color))
        for o in e['emitters']:
            for slot in o.material_slots:
                for i, (c, s) in enumerate(_emission_sockets(slot.material)):
                    snap['emit'][(slot.material.name, i)] = (tuple(c.default_value), s.default_value)
    return snap


def set_groups(snap, on, white=False, scene=None):
    """Only the groups in `on` emit (at their own power); white=True makes their colour white (the bake: the
    colour comes back live from the uniform)."""
    for name, e in groups(scene).items():
        k = name in on
        for o in e['lights']:
            energy, color = snap['lights'][o.name]
            o.data.energy = energy if k else 0.0
            o.data.color = (1.0, 1.0, 1.0) if (white and k) else color
        for o in e['emitters']:
            for slot in o.material_slots:
                for i, (c, s) in enumerate(_emission_sockets(slot.material)):
                    color, strength = snap['emit'][(slot.material.name, i)]
                    s.default_value = strength if k else 0.0
                    c.default_value = (1.0, 1.0, 1.0, 1.0) if (white and k) else color


def group_info(snap, scene=None):
    """What each group is in Blender units (for the manifest): lights in W, emitters as colour x strength."""
    info = {}
    for name, e in groups(scene).items():
        lights = [{'object': o.name, 'type': o.data.type, 'watts': snap['lights'][o.name][0],
                   'color': list(snap['lights'][o.name][1]), 'radius': o.data.shadow_soft_size} for o in e['lights']]
        emit = []
        for o in e['emitters']:
            for slot in o.material_slots:
                for i, _ in enumerate(_emission_sockets(slot.material)):
                    color, strength = snap['emit'][(slot.material.name, i)]
                    emit.append({'object': o.name, 'material': slot.material.name, 'color': list(color[:3]), 'strength': strength})
        # the group's colour: its lights' (or its emitters') linear colour; every member of a group shares one colour
        src = lights[0]['color'] if lights else (emit[0]['color'] if emit else [1, 1, 1])
        info[name] = {'lights': lights, 'emitters': emit, 'color': list(src[:3])}
    return info


def bake_targets(scene=None):
    scene = scene or bpy.context.scene
    return [o for o in scene.objects if o.type == 'MESH' and o.get('bake')]


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(data, f, indent=1)
