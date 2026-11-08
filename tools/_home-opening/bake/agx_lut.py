# Blender's own AgX (5.2's OCIO config: view AgX, look None, display sRGB) as a 3D LUT for three.js.
# Three.js's AgXToneMapping is Filament's port of the older AgX: on a grey ramp it renders mid-grey 0.18 at code 128
# where Blender 5.2 gives 118 (parity test), so a Blender frame and a three.js frame differ even when the light matches.
# This LUT lets a finish pass reproduce Blender's exactly (test.html ?finish=blender).
#   PY=/Applications/Blender.app/Contents/Resources/5.2/python/bin/python3.13
#   $PY -I agx_lut.py <out.bin> [n=48]
# Layout: n^3 RGB, uint16 (0..65535 = display code 0..1, sRGB-encoded), red fastest; input shaper per channel:
#   s = clamp((log2(max(linear, 2^-12.47393)) + 12.47393) / 16.5, 0, 1), the AgX log range.
import sys
import numpy as np
import PyOpenColorIO as ocio

out = sys.argv[1]
n = int(dict(a.split('=') for a in sys.argv[2:]).get('n', 48))
cfg = ocio.Config.CreateFromFile('/Applications/Blender.app/Contents/Resources/5.2/datafiles/colormanagement/config.ocio')
proc = cfg.getProcessor(ocio.DisplayViewTransform(src=cfg.getColorSpace('scene_linear').getName(), display='sRGB', view='AgX')).getDefaultCPUProcessor()
MIN, RANGE = -12.47393, 16.5
s = np.arange(n) / (n - 1)
lin = np.power(2.0, s * RANGE + MIN)
b, g, r = np.meshgrid(lin, lin, lin, indexing='ij')          # r fastest in memory
rgb = np.ascontiguousarray(np.stack([r, g, b], -1).reshape(-1, 3), dtype=np.float32)
proc.applyRGB(rgb)
np.round(np.clip(rgb, 0, 1) * 65535).astype('<u2').tofile(out)
print('LUT', out, n, 'grey 0.18 ->', end=' ')
x = np.array([[0.18, 0.18, 0.18]], np.float32); proc.applyRGB(x); print(x)
