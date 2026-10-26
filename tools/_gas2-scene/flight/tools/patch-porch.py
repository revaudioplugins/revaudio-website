# The hover photo's porch, patched from the set's own render (2026-10-26). gpt-image-2 painted the porch (under the
# canopy, right of the shop) as a grey wall: the blockout it was given had the roof's tar on the porch floor. The set has
# an open floor there, so as the drone left the hover that "wall" smeared into a see-through box. This lays the set's
# own porch, rendered from the hover pose and graded like the photo, into that region, matched to the photo's light
# around it and given its grain. Inputs, all from the hover pose (lab.html, POSE_B):
#   blockout   lab.html?b=0&s=1&minres=30&road=0, graded: tools/grade-blockout.py <blockout> <mask=1 render> <out> blue
#   porch      lab.html?b=0&s=1&minres=30&road=0&mask=2   (white = the porch, world.js porch())
# Usage: python3 -I flight/tools/patch-porch.py <aerial.png|webp> <graded blockout.png> <porch mask.png> <out.png>
import sys
from PIL import Image, ImageFilter
import numpy as np
air_p, blk_p, mask_p, out_p = sys.argv[1:5]
B = np.asarray(Image.open(air_p).convert('RGB')).astype(float)
G = np.asarray(Image.open(blk_p).convert('RGB')).astype(float)
M0 = Image.open(mask_p).convert('L')
M = np.asarray(M0.filter(ImageFilter.GaussianBlur(1.2))).astype(float)[..., None] / 255
core = np.asarray(M0).astype(float) / 255 > 0.5
ring = (np.asarray(M0.filter(ImageFilter.MaxFilter(15))).astype(float) / 255 > 0.5) & ~core   # the photo just around it
gain = B[ring].mean(axis=0) / np.maximum(G[ring].mean(axis=0), 1)
hp = B - np.asarray(Image.fromarray(B.astype('uint8')).filter(ImageFilter.GaussianBlur(1.5))).astype(float)
sd = hp[ring].std(axis=0)                                                                        # its grain
noise = np.random.default_rng(7).normal(0, 1, B.shape[:2])[..., None] * sd * 0.8 + 128
noise = np.asarray(Image.fromarray(np.clip(noise, 0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.6))).astype(float) - 128
out = np.clip(B * (1 - M) + (G * gain + noise) * M, 0, 255).round().astype('uint8')
Image.fromarray(out).save(out_p); print('saved', out_p, 'porch px', int(core.sum()), 'gain', gain.round(3))
