"""Mean / max colour difference between two screenshots (0..255), and the share of pixels off by more than 12 levels.
Usage: python -I drone/tools/diff.py a.png b.png [a2.png b2.png ...]"""
import sys
import numpy as np
from PIL import Image

args = sys.argv[1:]
for a, b in zip(args[0::2], args[1::2]):
    A = np.asarray(Image.open(a).convert('RGB'), dtype=np.int16)
    B = np.asarray(Image.open(b).convert('RGB'), dtype=np.int16)
    if A.shape != B.shape:
        print(f'{a} vs {b}: sizes differ {A.shape} {B.shape}')
        continue
    d = np.abs(A - B)
    print(f'{a.split("/")[-1]} vs {b.split("/")[-1]}: mean {d.mean():.2f}, max {d.max()}, >12 levels {(d.max(axis=2) > 12).mean() * 100:.2f} %')
