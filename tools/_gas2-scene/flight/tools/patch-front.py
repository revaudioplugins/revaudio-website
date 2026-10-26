# The hover photo's shop-front lettering, made exact (2026-10-26). gpt-image-2 painted the hover photo from the set's
# blockout, and it garbled the words on the shop front: the sign read "REGULAR · PREMIUM · EACH", the posters were
# gibberish. The sign band, the two window panes (round the pump) and the MAIL poster all lie on the front wall, so the
# landing photo (A) maps onto the hover photo (B) exactly by the wall plane's homography; this lays A's own lettering
# there, supersampled, softened and matched to B's light. The pump, the radio and the drum stay B's (they stand in front of
# the wall, and B gave them their volume). Where the canopy hides the wall from the hover, B's own pixels stay:
#   mask  = lab.html?b=0&s=1&minres=30&road=0&mask=1   (white = where A paints, as seen from the hover)
# Usage: python3 -I flight/tools/patch-front.py <aerial> <land.webp> <mask=1 render> <out.png> [softness px, 0.6]
import sys, math
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
air_p, land_p, mask_p, out_p = sys.argv[1:5]
def cam(pos, yaw, pitch, roll, vfov):               # world.js poses (three.js YXZ), the 1536 x 1024 frame
    y, p, r = map(math.radians, (yaw, pitch, roll))
    Ry = np.array([[math.cos(y), 0, math.sin(y)], [0, 1, 0], [-math.sin(y), 0, math.cos(y)]])
    Rx = np.array([[1, 0, 0], [0, math.cos(p), -math.sin(p)], [0, math.sin(p), math.cos(p)]])
    Rz = np.array([[math.cos(r), -math.sin(r), 0], [math.sin(r), math.cos(r), 0], [0, 0, 1]])
    return dict(C=np.array(pos, float), R=Ry @ Rx @ Rz, f=512 / math.tan(math.radians(vfov) / 2))
A = cam([0, 1.328, 6.6], 0, -0.4966, 0, 37.7497)    # POSE_A
B = cam([0, 22, 19.5], 8, -48, 0, 46)               # POSE_B
def proj(c, X):
    Xc = c['R'].T @ (np.asarray(X, float) - c['C']); return (768 + c['f'] * Xc[0] / -Xc[2], 512 - c['f'] * Xc[1] / -Xc[2])
def on_wall(px, py):                                # A pixel -> the front wall, z = 0
    d = A['R'] @ np.array([(px - 768) / A['f'], -(py - 512) / A['f'], -1.0]); return A['C'] + (-A['C'][2] / d[2]) * d
def homog(src, dst):
    M = []
    for (x, y), (u, v) in zip(src, dst): M += [[x, y, 1, 0, 0, 0, -u * x, -u * y, -u], [0, 0, 0, x, y, 1, -v * x, -v * y, -v]]
    h = np.linalg.svd(np.array(M))[2][-1]; return (h / h[-1]).reshape(3, 3)
corners = [(100, 120), (950, 120), (950, 560), (100, 560)]
H = homog(corners, [proj(B, on_wall(*p)) for p in corners])          # A -> B on the wall plane
# what to take from A (1536 x 1024 landing frame): the lettering on the wall, minus what stands in front of it
reg = Image.new('L', (1536, 1024), 0); d = ImageDraw.Draw(reg)
for r in [(35, 113, 948, 202),                       # the sign band, REGULAR · PREMIUM · RACE
          (96, 212, 340, 553), (582, 212, 784, 553),  # the window panes left and right of the pump, their posters
          (803, 203, 950, 423)]:                     # MAIL ME THE KEYS
    d.rectangle(r, fill=255)
pump = Image.open(__file__.rsplit('/', 3)[0] + '/props/pump-cut.png').convert('RGBA')
pw = round(.17643 * 1536); pump = pump.resize((pw, round(pump.height * pw / pump.width)), Image.LANCZOS)
cut = Image.new('L', (1536, 1024), 0); cut.paste(pump.getchannel('A'), (round(.21289 * 1536), round(.20215 * 1024)))
cut = cut.filter(ImageFilter.MaxFilter(9))           # the pump and its globe, with a margin
d.rectangle((696, 505, 860, 1024), fill=0)            # the drum
reg = Image.fromarray(np.where(np.asarray(cut) > 127, 0, np.asarray(reg)).astype('uint8'))
# warp A and the region into B's frame, 4x supersampled, then down (no aliasing on 4x-smaller lettering)
S = 4
SOFT = float(sys.argv[5]) if len(sys.argv) > 5 else 0.6
Hs = np.diag([S, S, 1.0]) @ H; Hi = np.linalg.inv(Hs); Hi /= Hi[2, 2]
land = Image.open(land_p).convert('RGB')
big = land.transform((1536 * S, 1024 * S), Image.PERSPECTIVE, tuple(Hi.flatten()[:8]), Image.BICUBIC)
bigm = reg.transform((1536 * S, 1024 * S), Image.PERSPECTIVE, tuple(Hi.flatten()[:8]), Image.BILINEAR)
front = big.resize((1536, 1024), Image.LANCZOS).filter(ImageFilter.GaussianBlur(SOFT))   # B is a soft painting at this scale
front = np.asarray(front).astype(float)
m = np.asarray(bigm.resize((1536, 1024), Image.BOX)).astype(float) / 255
seen = np.asarray(Image.open(mask_p).convert('L').filter(ImageFilter.MinFilter(3))).astype(float) / 255   # A visible from the hover
M = np.clip(m * seen, 0, 1)
M = np.asarray(Image.fromarray((M * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.7))).astype(float)[..., None] / 255
Bp = np.asarray(Image.open(air_p).convert('RGB')).astype(float)
core = M[..., 0] > 0.6
gain = np.clip(Bp[core].mean(axis=0) / np.maximum(front[core].mean(axis=0), 1), 0.7, 1.3)                 # B's light on it
out = np.clip(Bp * (1 - M) + front * gain * M, 0, 255).round().astype('uint8')
Image.fromarray(out).save(out_p)
ys, xs = np.nonzero(core); print('saved', out_p, 'patched px', int(core.sum()), 'bbox', (int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())), 'gain', gain.round(3))
