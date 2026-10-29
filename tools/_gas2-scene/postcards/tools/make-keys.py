"""GAS 2 postcards - bake-keys.cjs output (raw straight-alpha RGBA + keys.json) -> postcards/img/key{0,1,2}{,-lit}.webp.

  python3 make-keys.py <bake-keys out dir> <scene dir>
"""
import sys, os, json, subprocess
from PIL import Image

src, scene = sys.argv[1], sys.argv[2]
meta = json.load(open(os.path.join(src, "keys.json")))["meta"]
out = os.path.join(scene, "postcards", "img")
for k, m in meta.items():
    im = Image.frombytes("RGBA", (m["w"], m["h"]), open(os.path.join(src, k + ".rgba"), "rb").read())
    tmp = os.path.join(out, "_" + k + ".png")
    im.save(tmp)
    subprocess.run(["cwebp", "-quiet", "-q", "88", "-m", "6", "-sharp_yuv", "-exact", "-alpha_q", "100", tmp, "-o", os.path.join(out, k + ".webp")], check=True)
    os.remove(tmp)
    print(k, im.size, os.path.getsize(os.path.join(out, k + ".webp")) // 1024, "KB")
