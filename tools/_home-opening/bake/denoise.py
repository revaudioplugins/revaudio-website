# Denoise baked lightmaps with Intel Open Image Denoise (its lightmap filter "RTLightmap" if present, else "RT" HDR), the library Blender
# itself ships; called through ctypes because Blender 5.2's bake has no denoiser.
#   PY=/Applications/Blender.app/Contents/Resources/5.2/python/bin/python3.13
#   $PY -I denoise.py <bake dir> [group ...]        -> <bake dir>/<group>_dn.exr
# Island edges: OIDN sees the atlas as one picture, so a texel near an island's edge can borrow from the bake margin
# (the margin holds the island's own extended edge, so the borrow is small). After filtering, texels outside the
# islands are refilled from the denoised island edge (the same EXTEND rule the bake uses), and the report gives the
# mean change on the 2-texel edge ring vs. the interior so a bias at the edges shows.
import sys, os, json, ctypes
import numpy as np
import OpenImageIO as oiio

LIB = '/Applications/Blender.app/Contents/Resources/lib/libOpenImageDenoise.dylib'


def read(path):
    return oiio.ImageBuf(path).get_pixels(oiio.FLOAT)


def write(path, arr):
    h, w, c = arr.shape
    out = oiio.ImageOutput.create(path)
    spec = oiio.ImageSpec(w, h, c, 'float')
    spec.attribute('compression', 'zip')
    out.open(path, spec)
    out.write_image(np.ascontiguousarray(arr, dtype=np.float32))
    out.close()


def oidn_lightmap(rgb):
    """RTLightmap when the build has its weights; Blender's build ships only the RT weights, so then RT, HDR."""
    try:
        return _oidn(rgb, b'RTLightmap', False), 'RTLightmap'
    except RuntimeError:
        return _oidn(rgb, b'RT', True), 'RT (hdr)'


def _oidn(rgb, kind, hdr):
    lib = ctypes.CDLL(LIB)
    lib.oidnNewDevice.restype = ctypes.c_void_p
    lib.oidnNewDevice.argtypes = [ctypes.c_int]
    lib.oidnCommitDevice.argtypes = [ctypes.c_void_p]
    lib.oidnNewFilter.restype = ctypes.c_void_p
    lib.oidnNewFilter.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
    lib.oidnSetSharedFilterImage.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_void_p, ctypes.c_int,
                                             ctypes.c_size_t, ctypes.c_size_t, ctypes.c_size_t, ctypes.c_size_t, ctypes.c_size_t]
    lib.oidnSetFilterBool.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_bool]
    lib.oidnCommitFilter.argtypes = [ctypes.c_void_p]
    lib.oidnExecuteFilter.argtypes = [ctypes.c_void_p]
    lib.oidnGetDeviceError.restype = ctypes.c_int
    lib.oidnGetDeviceError.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_char_p)]
    dev = lib.oidnNewDevice(1)            # OIDN_DEVICE_TYPE_CPU: host memory can be shared directly
    lib.oidnCommitDevice(dev)
    src = np.ascontiguousarray(rgb, dtype=np.float32)
    dst = np.zeros_like(src)
    h, w, _ = src.shape
    f = lib.oidnNewFilter(dev, kind)
    if hdr:
        lib.oidnSetFilterBool(f, b'hdr', True)
    FLOAT3 = 3
    lib.oidnSetSharedFilterImage(f, b'color', src.ctypes.data, FLOAT3, w, h, 0, 0, 0)
    lib.oidnSetSharedFilterImage(f, b'output', dst.ctypes.data, FLOAT3, w, h, 0, 0, 0)
    lib.oidnCommitFilter(f)
    lib.oidnExecuteFilter(f)
    msg = ctypes.c_char_p()
    err = lib.oidnGetDeviceError(dev, ctypes.byref(msg))
    if err:
        raise RuntimeError('OIDN error %d: %s' % (err, msg.value))
    return dst


def extend(arr, mask, steps=24):
    """Refill texels outside the islands from their nearest filled neighbours (the bake's EXTEND margin)."""
    a = arr.copy()
    filled = mask.copy()
    for _ in range(steps):
        acc = np.zeros_like(a)
        n = np.zeros(mask.shape, np.float32)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)):
            s = np.roll(np.roll(filled, dy, 0), dx, 1)
            acc += np.roll(np.roll(a, dy, 0), dx, 1) * s[..., None]
            n += s
        grow = (~filled) & (n > 0)
        a[grow] = acc[grow] / n[grow][:, None]
        filled = filled | grow
        if filled.all():
            break
    return a


def ring(mask, px=2):
    inner = mask.copy()
    for _ in range(px):
        inner = inner & np.roll(inner, 1, 0) & np.roll(inner, -1, 0) & np.roll(inner, 1, 1) & np.roll(inner, -1, 1)
    return mask & ~inner, inner


def noise(arr, mask):
    """Texel noise: the median absolute Laplacian of luminance inside the islands, relative to the median level."""
    y = arr[..., 0] * 0.2126 + arr[..., 1] * 0.7152 + arr[..., 2] * 0.0722
    lap = 4 * y - np.roll(y, 1, 0) - np.roll(y, -1, 0) - np.roll(y, 1, 1) - np.roll(y, -1, 1)
    _, inner = ring(mask, 2)
    return float(np.median(np.abs(lap[inner])) / max(np.median(y[inner]), 1e-9))


if __name__ == '__main__':
    d = sys.argv[1]
    info = json.load(open(os.path.join(d, 'bake-info.json')))
    todo = sys.argv[2:] or info['order']
    mask = read(os.path.join(d, 'mask.exr'))[..., 0] > 0.5
    edge, inner = ring(mask, 2)
    rep = {}
    for g in todo:
        raw = read(os.path.join(d, g + '.exr'))[..., :3]
        dn, kind = oidn_lightmap(raw)
        dn = extend(np.where(mask[..., None], dn, 0), mask)
        write(os.path.join(d, g + '_dn.exr'), dn)
        y0 = raw[..., 1]
        y1 = dn[..., 1]
        rep[g] = {'filter': kind, 'noise_raw': round(noise(raw, mask), 4), 'noise_dn': round(noise(dn, mask), 4),
                  'mean_change_interior': round(float(y1[inner].mean() / y0[inner].mean() - 1), 5),
                  'mean_change_edge_ring': round(float(y1[edge].mean() / y0[edge].mean() - 1), 5)}
        print('DENOISED', g, rep[g])
    info.setdefault('denoise', {}).update({'method': 'OIDN (CPU; filter per group), islands re-extended', 'groups': rep})
    json.dump(info, open(os.path.join(d, 'bake-info.json'), 'w'), indent=1)
