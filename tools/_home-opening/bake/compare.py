# The parity numbers: Blender (Cycles) vs three.js (test.html), same camera, same 1141 x 636 frame.
#   PY=/Applications/Blender.app/Contents/Resources/5.2/python/bin/python3.13
#   $PY -I compare.py <renders dir> <capture dir (parity.mjs/<browser>)> <surface-ids.png> <out dir>
# Regions come from Blender's own ray per pixel (export_gltf.py ids=), eroded 3 px: the grey card (albedo 0.18) and the
# side wall y = -1.5 (albedo 0.8, the tube along its top). Two comparisons per config:
#   linear:  scene-linear luminance before any tone mapping (three.js: a float render target; Blender: the EXR)
#            -> the engine's parity, and where the pi shows (the "no factor" column = the same frame without x pi:
#            the shader is linear in the uniform, so it is exactly the measured value / pi)
#   display: the finished 8-bit frames (three.js AgX in the finish pass vs Blender's OCIO AgX), compared as display
#            light (sRGB-decoded), split into engine vs tone mapper by cross-applying the two AgX's
# Writes <out>/parity.json and, per config, panel PNGs (Blender | three.js | the linear ratio as a heat map) that
# sidebyside.py assembles.
import sys, os, json
import numpy as np
import OpenImageIO as oiio
import PyOpenColorIO as ocio

rdir, cdir, ids_path, out = sys.argv[1:5]
os.makedirs(out, exist_ok=True)
W, H = 1141, 636
LUMA = np.array([0.2126, 0.7152, 0.0722])
PI = np.pi

cfg = ocio.Config.CreateFromFile('/Applications/Blender.app/Contents/Resources/5.2/datafiles/colormanagement/config.ocio')
BLENDER_AGX = cfg.getProcessor(ocio.DisplayViewTransform(src=cfg.getColorSpace('scene_linear').getName(), display='sRGB', view='AgX')).getDefaultCPUProcessor()


def blender_agx(lin):
    a = np.ascontiguousarray(lin[..., :3], dtype=np.float32).copy()
    BLENDER_AGX.applyRGB(a)
    return np.clip(a, 0, 1)


def three_agx(lin):
    """three.js r185 AgXToneMapping + sRGBTransferOETF (tonemapping_pars_fragment), exposure 1, in numpy."""
    S2R = np.array([[0.6274, 0.3293, 0.0433], [0.0691, 0.9195, 0.0114], [0.0164, 0.0880, 0.8956]])
    R2S = np.array([[1.6605, -0.5876, -0.0728], [-0.1246, 1.1329, -0.0083], [-0.0182, -0.1006, 1.1187]])
    inset = np.array([[0.856627153315983, 0.137318972929847, 0.11189821299995],
                      [0.0951212405381588, 0.761241990602591, 0.0767994186031903],
                      [0.0482516061458583, 0.101439036467562, 0.811302368396859]]).T   # GLSL mat3 is column-major
    outset = np.array([[1.1271005818144368, -0.1413297634984383, -0.14132976349843826],
                       [-0.11060664309660323, 1.157823702216272, -0.11060664309660294],
                       [-0.016493938717834573, -0.016493938717834257, 1.2519364065950405]]).T
    c = lin[..., :3].astype(np.float64) @ S2R.T @ inset.T
    c = (np.log2(np.maximum(c, 1e-10)) + 12.47393) / (4.026069 + 12.47393)
    x = np.clip(c, 0, 1)
    x2, x4 = x * x, x ** 4
    c = 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232
    c = np.power(np.maximum(c @ outset.T, 0), 2.2) @ R2S.T
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def srgb_decode(v):
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)


def read(path):
    return oiio.ImageBuf(path).get_pixels(oiio.FLOAT)


def three_raw(name):
    a = np.fromfile(os.path.join(cdir, name + '.f32'), np.float32).reshape(H, W, 4)
    return a[::-1, :, :3].astype(np.float64)   # WebGL rows run bottom-up


def erode(m, px=3):
    for _ in range(px):
        m = m & np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1)
    return m


ids = read(ids_path)[..., 0]
ids = np.rint(ids * 255 if ids.max() <= 1.0 else ids).astype(int)
REGIONS = {'grey_card': erode(ids == 1), 'white_wall': erode(ids == 2), 'floor': erode(ids == 4), 'prop': erode(ids == 7),
           'tube': erode(ids == 8, 1)}   # the emitter itself: emissive x strength in both, no light maths


def stats(y, m):
    v = y[m]
    return {'mean': float(v.mean()), 'p5': float(np.percentile(v, 5)), 'p50': float(np.percentile(v, 50)), 'p95': float(np.percentile(v, 95))}


def compare(a, b):
    """a = three.js, b = Blender (luminance arrays): per region stats + ratios."""
    r = {}
    for k, m in REGIONS.items():
        sa, sb = stats(a, m), stats(b, m)
        q = lambda x, y: x / y if y > 1e-9 else None   # a dark region (the tube with its group off) has no ratio
        r[k] = {'three': sa, 'blender': sb, 'ratio_mean': q(sa['mean'], sb['mean']),
                'ratio_p5': q(sa['p5'], sb['p5']), 'ratio_p50': q(sa['p50'], sb['p50']), 'ratio_p95': q(sa['p95'], sb['p95']),
                'pixel_ratio_median': float(np.median(a[m] / np.maximum(b[m], 1e-9)))}
    return r


PAIRS = {  # three.js capture -> Blender reference (linear), a sum where the dial moved
    'bake_G1_lamp': {'G1_lamp': 1}, 'bake_G2_neon': {'G2_neon': 1}, 'bake_all': {'all': 1},
    'bake_dial': {'G1_lamp': 0.5, 'G2_neon': 1}, 'live_G1_lamp_direct': {'G1_lamp_direct': 1},
    'bake_all_blender_agx': {'all': 1},
}
res = {'regions_px': {k: int(m.sum()) for k, m in REGIONS.items()}}
for cap, ref in PAIRS.items():
    if not os.path.exists(os.path.join(cdir, cap + '.f32')):
        continue
    t_lin = three_raw(cap)
    b_lin = sum(w * read(os.path.join(rdir, n + '.exr'))[..., :3].astype(np.float64) for n, w in ref.items())
    ty, by = t_lin @ LUMA, b_lin @ LUMA
    lin = compare(ty, by)
    for k in lin:
        lin[k]['ratio_mean_without_pi'] = lin[k]['ratio_mean'] / PI if cap.startswith('bake') and lin[k]['ratio_mean'] and k != 'tube' else None
    # display: the frames as Dan sees them, compared as display light
    t_png = read(os.path.join(cdir, cap + '.png'))[..., :3].astype(np.float64)
    if len(ref) == 1:
        b_png = read(os.path.join(rdir, list(ref)[0] + '.png'))[..., :3].astype(np.float64)
    else:
        b_png = blender_agx(b_lin)
    dy = lambda v: srgb_decode(v) @ LUMA
    disp = compare(dy(t_png), dy(b_png))
    # the split: three.js's linear frame through Blender's AgX (engine only) / Blender's linear through three's AgX
    eng = compare(dy(blender_agx(t_lin)), dy(b_png))
    tm = compare(dy(three_agx(b_lin)), dy(b_png))
    res[cap] = {'reference': ref, 'linear': lin, 'display': disp, 'display_engine_only_(three_linear_through_blender_agx)': eng,
                'tonemapper_only_(blender_linear_through_three_agx)': tm,
                'mean_abs_code_diff_8bit': {k: float(np.abs(t_png - b_png)[m].mean() * 255) for k, m in REGIONS.items()}}
    # panels for the side-by-side
    ratio = ty / np.maximum(by, 1e-6) - 1
    heat = np.zeros((H, W, 3))
    s = np.clip(ratio / 0.1, -1, 1)                  # +-10 % full scale: red = three.js brighter, blue = darker
    heat[..., 0] = np.where(s > 0, s, 0)
    heat[..., 2] = np.where(s < 0, -s, 0)
    heat[..., 1] = 0.0
    heat += (1 - np.abs(s))[..., None] * 0.12
    heat[ids == 8] = 0.5
    heat[(by < 2e-4) & (ty < 2e-4)] = 0.12             # black in both (a face no light reaches): no ratio to show
    for nm, img in (('blender', b_png), ('three', t_png), ('heat', heat)):
        oiio.ImageBuf(np.ascontiguousarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8))).write(os.path.join(out, f'{cap}.{nm}.png'))
    l, d = lin['white_wall'], disp['white_wall']
    print(f"{cap:22s} linear wall {l['ratio_mean']:.4f} card {lin['grey_card']['ratio_mean']:.4f} | display wall {d['ratio_mean']:.4f} card {disp['grey_card']['ratio_mean']:.4f}")
json.dump(res, open(os.path.join(out, 'parity.json'), 'w'), indent=1)
