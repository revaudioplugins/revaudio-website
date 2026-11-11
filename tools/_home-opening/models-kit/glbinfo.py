# python3 -I glbinfo.py <glb>...: images (mime, bytes, px), materials, triangles, extent, extensions
import sys, json, struct, io
from PIL import Image
for p in sys.argv[1:]:
    b = open(p, 'rb').read()
    assert b[:4] == b'glTF'
    jl = struct.unpack('<I', b[12:16])[0]; js = json.loads(b[20:20 + jl]); off = 20 + jl
    bl = struct.unpack('<I', b[off:off + 4])[0]; binc = b[off + 8: off + 8 + bl]
    imgs = []
    for im in js.get('images', []):
        bv = js['bufferViews'][im['bufferView']]; data = binc[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']]
        sz = Image.open(io.BytesIO(data)).size
        imgs.append((im.get('name'), im.get('mimeType'), bv['byteLength'], sz))
    tris = 0; mn = [1e9] * 3; mx = [-1e9] * 3
    for m in js['meshes']:
        for pr in m['primitives']:
            if 'indices' in pr: tris += js['accessors'][pr['indices']]['count'] // 3
            a = js['accessors'][pr['attributes']['POSITION']]
            mn = [min(x, y) for x, y in zip(mn, a['min'])]; mx = [max(x, y) for x, y in zip(mx, a['max'])]
    print(p.split('/')[-1], 'bytes', len(b), 'tris', tris, 'min', [round(v, 3) for v in mn], 'max', [round(v, 3) for v in mx], 'nodes', len(js['nodes']), 'ext', js.get('extensionsUsed'))
    for i in imgs: print('   img', i)
    for m in js.get('materials', []): print('   mat', m.get('name'), {k: v for k, v in m.get('pbrMetallicRoughness', {}).items() if 'Factor' in k}, 'occl' if 'occlusionTexture' in m else '', 'alpha', m.get('alphaMode'))
