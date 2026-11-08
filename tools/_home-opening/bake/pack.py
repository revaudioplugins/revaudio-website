# Pack baked light groups, three per 8-bit sRGB PNG, plus the manifest lightmaps.js reads.
#   PY=/Applications/Blender.app/Contents/Resources/5.2/python/bin/python3.13
#   $PY -I pack.py <bake dir> <out dir> [suffix=_dn] [name=pack]
# Per group: luminance of its (white-light) bake, scaled by its 99.9th percentile over the island texels (the scale is
# kept in the manifest), clipped to 1, sRGB-encoded, dithered (+-0.5 LSB uniform, fixed seed), rounded to 8 bits; groups
# go R, G, B in bake order, three per image. Coloured light comes back from the group's colour in the uniform.
# What packing loses: the bounce's own colour. With white emitters and neutral surfaces the bake has no chroma at all
# (checked below: 'chroma'); with coloured surfaces, a group's bounce off a red wall comes back in the group's colour.
import sys, os, json, zlib, struct
import numpy as np
import OpenImageIO as oiio

LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)   # Rec.709 / linear sRGB


def srgb_oetf(x):
    return np.where(x <= 0.0031308, 12.92 * x, 1.055 * np.power(np.maximum(x, 0), 1 / 2.4) - 0.055)


def srgb_eotf(v):
    return np.where(v <= 0.04045, v / 12.92, np.power((v + 0.055) / 1.055, 2.4))


def write_png(path, rgb8):
    """A plain 8-bit RGB PNG with no colour chunks (no gAMA / iCCP): the browser must not convert the data."""
    h, w, _ = rgb8.shape
    raw = b''.join(b'\x00' + rgb8[y].tobytes() for y in range(h))
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
                + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    opt = dict(a.split('=', 1) for a in sys.argv[3:])
    suffix, name = opt.get('suffix', '_dn'), opt.get('name', 'pack')
    os.makedirs(out, exist_ok=True)
    info = json.load(open(os.path.join(src, 'bake-info.json')))
    mask = oiio.ImageBuf(os.path.join(src, 'mask.exr')).get_pixels(oiio.FLOAT)[..., 0] > 0.5
    order = info['order']
    rng = np.random.default_rng(1)
    # the packs: bake-info's own (the room: three sizes) or three groups each at the bake's size (the test room)
    layout = info.get('packs') or [{'groups': order[p:p + 3], 'size': mask.shape[0]} for p in range(0, len(order), 3)]
    packs, groups = [], []
    for pk in layout:
        names, size = pk['groups'], pk['size']
        chans = []
        for c, g in enumerate(names):
            f = os.path.join(src, g + suffix + '.exr')
            if not os.path.exists(f):
                f = os.path.join(src, g + '.exr')
            rgb = oiio.ImageBuf(f).get_pixels(oiio.FLOAT)[..., :3]
            y = rgb @ LUMA
            chroma = float(np.abs(rgb - y[..., None])[mask].max() / max(y[mask].max(), 1e-9))
            chroma_e = round(float(np.abs(rgb[mask] - y[mask][:, None]).sum() / max(3 * y[mask].sum(), 1e-9)), 4) # light-weighted
            # the scale: 8 bits can't hold every group's range (a prop lamp's hot spot is 90x its 99.9th percentile), so
            # each group's scale is the one with the least light lost: clipped above it + quantised (and dithered) below
            vm = y[mask]; tot = max(float(vm.sum()), 1e-12); p999 = float(np.percentile(vm, 99.9)); trial = np.random.default_rng(2)
            def lost(sc):
                bk = srgb_eotf(np.floor(srgb_oetf(np.clip(vm / sc, 0, 1)) * 255 + trial.random(vm.shape)).clip(0, 255) / 255.0) * sc
                return float(np.maximum(vm - sc, 0).sum() / tot), float(np.abs(np.minimum(vm, sc) - bk).sum() / tot)
            tried = [(sum(lost(p999 * 2 ** (k / 2))), p999 * 2 ** (k / 2)) for k in range(-2, 15)]
            scale = min(tried)[1]
            m = mask
            if size != y.shape[0]:   # a smaller pack: the same atlas, sampled down (its margins are extended already)
                y = oiio.ImageBufAlgo.resize(oiio.ImageBuf(np.ascontiguousarray(y[..., None], dtype=np.float32)), roi=oiio.ROI(0, size, 0, size, 0, 1, 0, 1)).get_pixels(oiio.FLOAT)[..., 0]
                m = oiio.ImageBufAlgo.resize(oiio.ImageBuf(np.ascontiguousarray(mask[..., None], dtype=np.float32)), roi=oiio.ROI(0, size, 0, size, 0, 1, 0, 1)).get_pixels(oiio.FLOAT)[..., 0] > 0.5
            v = srgb_oetf(np.clip(y / scale, 0, 1))
            q = np.clip(np.floor(v * 255 + rng.random(v.shape)), 0, 255).astype(np.uint8)
            back = srgb_eotf(q / 255.0) * scale            # what the GPU's sRGB decode gives back
            mm = m & (y > 1e-6)
            rel = np.abs(back[mm] - y[mm]) / y[mm]
            dark = mm & (y < np.percentile(y[mm], 10))
            gi = info['groups'][g]
            groups.append({
                'name': g, 'pack': len(packs), 'channel': c, 'scale': scale, 'color': gi['color'],
                'source': {k: gi[k] for k in ('lights', 'emitters', 'nominal', 'ref', 'lum') if k in gi},
                'bake_seconds': info['bake_seconds'].get(g), 'file': os.path.basename(f),
                'stats': {'max_over_scale': round(float(y[m].max() / scale), 3), 'clipped': round(float((y[m] > scale).mean()), 5),
                          'quant_err_median': round(float(np.median(rel)), 5), 'quant_err_p99': round(float(np.percentile(rel, 99)), 5),
                          'quant_err_darkest10pct_median': round(float(np.median(np.abs(back[dark] - y[dark]) / y[dark])), 5),
                          'chroma': round(chroma, 6),
                          # light-weighted: what the packing loses where the group actually lights something
                          'chroma_lost_energy': chroma_e,
                          'quant_err_energy': round(float(np.abs(back[mm] - y[mm]).sum() / max(y[mm].sum(), 1e-9)), 5),
                          'clipped_energy': round(float(np.maximum(y[m] - scale, 0).sum() / max(y[m].sum(), 1e-9)), 5),
                          'p999_over_scale': round(p999 / scale, 4)},
            })
            chans.append(q)
        while len(chans) < 3:
            chans.append(np.zeros_like(chans[0]))
        fn = '%s%d.png' % (name, len(packs))
        write_png(os.path.join(out, fn), np.stack(chans, -1))
        packs.append({'file': fn, 'size': [size, size], 'colorSpace': 'srgb', 'groups': names,
                      'bytes': os.path.getsize(os.path.join(out, fn)), 'gpu_bytes_rgba8_mips': int(size * size * 4 * 4 / 3)})
    manifest = {
        'version': 1,
        'uv': 'TEXCOORD_1 (Blender UV map "UV2"), loaded as uv1, texture.channel = 1, flipY false',
        'units': 'texel (decoded, linear) x scale = Cycles Diffuse light (Direct + Indirect, Color off) for a white emitter '
                 'of the group\'s Blender power; three.js irradiance = that x color x intensity x BAKE_TO_IRRADIANCE (lightmaps.js)',
        'targets': info['targets'], 'packs': packs, 'groups': groups, 'gpu_mb': round(sum(p['gpu_bytes_rgba8_mips'] for p in packs) / 2**20, 1),
        'bake': {k: info[k] for k in ('samples', 'size', 'margin_px', 'pass', 'bounces', 'texels_per_metre', 'coverage',
                                      'overlap_texels', 'baked_area_m2', 'device') if k in info} | {'denoise': info.get('denoise')},
    }
    json.dump(manifest, open(os.path.join(out, 'manifest.json'), 'w'), indent=1)
    for g in groups:
        print('PACKED', g['name'], 'pack', g['pack'], 'ch', g['channel'], 'scale %.4f' % g['scale'], g['stats'])
