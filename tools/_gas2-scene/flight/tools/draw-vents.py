# The two roof vents in the hover photo (2026-10-26). Dan's "go 1" plan had a gravel roof with vents; the set got them
# (world.js ROOFTOP) but the hover photo was never re-painted, so from the hover the roof was bare and mid-flight the vent
# boxes wore plain roof texture. This draws them into the photo in the hover camera's exact perspective (POSE_B), so the
# 3D boxes pick up their own faces from the photo all the way down: galvanised sheet metal, the top catching the sky, the
# right face the afterglow, the front in shade, a soft contact shadow on the roof; toned from the roof around each one.
# Usage: python3 -I flight/tools/draw-vents.py <aerial> <out.png>
import sys, math
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
air_p, out_p = sys.argv[1:3]
ROOF_Y = 3.85
VENTS = [(-4.6, -3.6, .7, .45, .7), (-1.9, -4.9, .5, .35, .5)]      # world.js ROOFTOP: x, z, w, h, d
def cam(pos, yaw, pitch, roll, vfov):
    y, p, r = map(math.radians, (yaw, pitch, roll))
    Ry = np.array([[math.cos(y), 0, math.sin(y)], [0, 1, 0], [-math.sin(y), 0, math.cos(y)]])
    Rx = np.array([[1, 0, 0], [0, math.cos(p), -math.sin(p)], [0, math.sin(p), math.cos(p)]])
    Rz = np.array([[math.cos(r), -math.sin(r), 0], [math.sin(r), math.cos(r), 0], [0, 0, 1]])
    return dict(C=np.array(pos, float), R=Ry @ Rx @ Rz, f=512 / math.tan(math.radians(vfov) / 2))
B = cam([0, 22, 19.5], 8, -48, 0, 46)                               # POSE_B
S = 4                                                               # supersampling
def P(x, y, z):
    Xc = B['R'].T @ (np.array([x, y, z], float) - B['C']); return (S * (768 + B['f'] * Xc[0] / -Xc[2]), S * (512 - B['f'] * Xc[1] / -Xc[2]))
img = np.asarray(Image.open(air_p).convert('RGB')).astype(float)
H, W = img.shape[:2]
layer = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0)); shade = Image.new('L', (W * S, H * S), 0)
dl, ds = ImageDraw.Draw(layer), ImageDraw.Draw(shade)
for x0, z0, w, h, d in VENTS:
    x1, z1, y0, y1 = x0 + w, z0 + d, ROOF_Y, ROOF_Y + h
    # the roof's own tone round the vent (in the photo), for the metal to sit in its light
    cx, cy = P(x0 + w / 2, y0, z0 + d / 2); r = int(26 * S)
    ring = img[max(0, int(cy / S) - 14):int(cy / S) + 14, max(0, int(cx / S) - 14):int(cx / S) + 14].reshape(-1, 3)
    R0 = np.median(ring, axis=0)
    # contact shadow: the footprint grown and pushed a little left (the afterglow is on the right), blurred later
    g = .18
    ds.polygon([P(x0 - g - .12, y0, z0 - g), P(x1 + g - .12, y0, z0 - g), P(x1 + g - .12, y0, z1 + g), P(x0 - g - .12, y0, z1 + g)], fill=150)
    faces = [                                                       # (corners, tone, normal)
        ([(x0, y1, z1), (x1, y1, z1), (x1, y0, z1), (x0, y0, z1)], (0.78, 0.78, 0.84), (0, 0, 1)),     # front, in shade
        ([(x1, y1, z0), (x1, y1, z1), (x1, y0, z1), (x1, y0, z0)], (1.30, 1.12, 0.96), (1, 0, 0)),     # right, the afterglow
        ([(x0, y1, z0), (x0, y1, z1), (x0, y0, z1), (x0, y0, z0)], (0.62, 0.63, 0.70), (-1, 0, 0)),    # left
        ([(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], (1.32, 1.36, 1.46), (0, 1, 0)),     # top, the sky
    ]
    for pts, tone, n in faces:
        c = np.array([sum(p[i] for p in pts) / 4 for i in range(3)])
        if np.dot(np.array(n, float), B['C'] - c) <= 0: continue     # facing away from the drone
        col = tuple(int(min(255, v)) for v in R0 * np.array(tone)) + (255,)
        dl.polygon([P(*p) for p in pts], fill=col)
    # a hairline of light along the top's front and right edges (folded sheet metal)
    hi = tuple(int(min(255, v)) for v in R0 * np.array((1.6, 1.58, 1.62))) + (255,)
    dl.line([P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0)], fill=hi, width=max(1, S // 2))
shade = shade.filter(ImageFilter.GaussianBlur(3.5 * S)).resize((W, H), Image.BOX)
layer = layer.resize((W, H), Image.LANCZOS)
sh = np.asarray(shade).astype(float)[..., None] / 255
out = img * (1 - 0.55 * sh)
L = np.asarray(layer).astype(float); a = L[..., 3:4] / 255
rng = np.random.default_rng(5); grain = rng.normal(0, 3.0, (H, W, 1))
metal = L[..., :3] * (1 + 0.04 * rng.normal(0, 1, (H, W, 1))) + grain
out = np.clip(out * (1 - a) + metal * a, 0, 255).round().astype('uint8')
Image.fromarray(out).save(out_p)
ys, xs = np.nonzero(a[..., 0] > 0.5); print('saved', out_p, 'vent px', len(xs), 'bbox', (int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())))
