#!/usr/bin/env python3
"""RevLimiter's meters for one loop of a real song, for the TV's animation (Dan 2026-11-10: "the revlimiter is just
pumping, lets make it more human and more like real song").

Per 60 Hz tick, the fields the plugin's editor sends on its 'meters' event (Revlimiter Source/PluginEditor.cpp), from
the site's RevLimiter demo in public/audio/revlimiter/ (<song>-before.m4a = the mix into the plugin, -after = its
output). Ballistics follow PluginProcessor.cpp: peak holds with a 300 ms release; GR instant attack and 250 ms
release; the clip shave and heat with instant attack and the 0.08-per-block release; LUFS momentary 400 ms and
short-term 3 s (K-weighted). Comparing before and after window by window is too noisy for a meter (it pinned GR at
7-10 dB), so the GR side is a model fed by the song's real peaks: the drive (the gain the plugin adds where it isn't
limiting, measured) puts the peak over the ceiling, the clipper shaves about a third of the overshoot (up to 2 dB),
the limiter takes the rest; the MB comp works on each band's own level (2:1 above its loud-moment level, up to 6 dB).
The loop is periodic: it is measured on the excerpt played three times and the middle copy is kept.

  python3 tools/tv-anim/song-meters.py <song> find <len_s>
      -> the best loop starts (the second after the loop's end looks like the second after its start)
  python3 tools/tv-anim/song-meters.py <song> <start_s> <len_s> <out.json> [plot.png]
      e.g. revlimiter 63.98 9.24 (4 bars at 103.7 BPM; the phrase ends on a short stop, so the loop reads as one)
Needs ffmpeg, numpy and Pillow (the plot).
"""
import sys, json, subprocess
from pathlib import Path
import numpy as np

SR = 44100
AUDIO = Path(__file__).resolve().parents[2] / 'public' / 'audio' / 'revlimiter'
KW = 'highpass=f=38:poles=2:width_type=q:width=0.5,highshelf=f=1681:g=4:width_type=q:width=0.7071'  # BS.1770 K
CEIL = -0.3     # the output ceiling the readouts show (the demo's AAC overshoots a little past it)
TICK_HZ = 60    # the editor's meter timer
FRAME_TICKS = 4 # a 15 fps frame = 4 ticks: the loop is a whole number of frames

def decode(name, kweight=False):
    af = ['-af', KW] if kweight else []
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(AUDIO / f'{name}.m4a'), *af, '-f', 'f32le', '-ac', '2',
                          '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)

def db(x):
    return 20 * np.log10(np.maximum(x, 1e-9))

def win_ms(x, win, ends):
    """mean square summed over the channels, in `win`-sample windows ending at `ends`"""
    e = (x ** 2).sum(axis=1)
    c = np.concatenate([[0.0], np.cumsum(e)])
    ends = np.clip(ends, win, len(e))
    return (c[ends] - c[ends - win]) / win

def lufs(ms):
    return -0.691 + 10 * np.log10(np.maximum(ms, 1e-12))

def env_db(x, win, hop):
    e = (x ** 2).sum(axis=1)
    c = np.concatenate([[0.0], np.cumsum(e)])
    cen = np.arange(0, len(e), hop)
    a, b = np.clip(cen - win // 2, 0, len(e)), np.clip(cen + win // 2, 0, len(e))
    return 10 * np.log10(np.maximum((c[b] - c[a]) / np.maximum(b - a, 1), 1e-12))

def idle_gain(eb, ea):
    loud = eb > np.percentile(eb, 35)
    return float(np.percentile((ea - eb)[loud], 96))

def integrated_and_lra(ka):
    hop = SR // 10
    m = lufs(win_ms(ka, int(0.4 * SR), np.arange(int(0.4 * SR), len(ka) + 1, hop)))
    g = m[m > -70]
    rel = 10 * np.log10((10 ** (g / 10)).mean()) - 10
    I = 10 * np.log10((10 ** (g[g > rel] / 10)).mean())
    st = lufs(win_ms(ka, 3 * SR, np.arange(3 * SR, len(ka) + 1, hop)))
    st = st[st > -70]
    st = st[st > 10 * np.log10((10 ** (st / 10)).mean()) - 20]
    return float(I), float(np.percentile(st, 95) - np.percentile(st, 10))

def bands(x):
    """zero-phase split at 150 Hz and 4 kHz (raised-cosine edges); x is periodic, so a circular FFT is exact"""
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    ramp = lambda f0, f1: 0.5 - 0.5 * np.cos(np.pi * np.clip((f - f0) / (f1 - f0), 0, 1))
    lo_hi, hi = ramp(110, 200), ramp(3000, 5000)
    return [np.fft.irfft(X * m[:, None], n=len(x), axis=0) for m in (1 - lo_hi, lo_hi * (1 - hi), hi)]

def flux(x):
    hop = SR // 100
    mono = x.mean(axis=1)
    n = len(mono) // hop
    lg = np.log1p(np.abs(np.fft.rfft(mono[:n * hop].reshape(n, hop) * np.hanning(hop), axis=1)) * 10)
    fl = np.maximum(0, np.diff(lg, axis=0)).sum(axis=1)
    fl = fl - np.convolve(fl, np.ones(50) / 50, mode='same')
    return np.concatenate([[0], np.maximum(fl, 0)])

def find(song, L):
    f = flux(decode(f'{song}-before'))
    f = (f - f.mean()) / (f.std() + 1e-9)
    ka = decode(f'{song}-after', True)
    st = lufs(win_ms(ka, 3 * SR, np.arange(0, len(ka), SR // 100) + 3 * SR))
    n, res = int(L * 100), []
    for i in range(300, len(f) - n - 150, 2):
        seam = float((f[i:i + 100] * f[i + n:i + n + 100]).mean())
        loud = float(np.mean(st[i:i + n]))
        if loud < -13: continue
        res.append((seam - 0.15 * abs(st[min(i, len(st) - 1)] - st[min(i + n, len(st) - 1)]) + 0.6 * f[i], i / 100, loud, seam))
    picked = []
    for r in sorted(res, reverse=True):
        if all(abs(r[1] - p[1]) > 3 for p in picked): picked.append(r)
        if len(picked) == 8: break
    for sc, t, loud, seam in picked:
        print(f'  start {t:7.2f}s  score {sc:5.2f}  seam {seam:4.2f}  S-LUFS {loud:5.1f}')

def meters(song, t0, L, out, plot=None):
    b_all, a_all, ka_all = decode(f'{song}-before'), decode(f'{song}-after'), decode(f'{song}-after', True)
    i0, n = int(round(t0 * SR)), int(round(L * SR))
    B, A, KA = (np.concatenate([x[i0:i0 + n]] * 3) for x in (b_all, a_all, ka_all))
    N = int(round(L * TICK_HZ / FRAME_TICKS)) * FRAME_TICKS
    spt = n / N
    ends = np.round((np.arange(3 * N) + 1) * spt).astype(int)
    starts = np.concatenate([[0], ends[:-1]])
    dt = spt / SR
    G = idle_gain(env_db(B, int(0.01 * SR), SR // 1000), env_db(A, int(0.01 * SR), SR // 1000))
    absB, absA = np.abs(B).max(axis=1), np.abs(A).max(axis=1)
    band_lv = [10 * np.log10(np.maximum(win_ms(xb, int(0.02 * SR), ends), 1e-12)) for xb in bands(B)]
    band_thr = [float(np.percentile(lv[N:2 * N], 85)) for lv in band_lv]
    msM, msS = win_ms(KA, int(0.4 * SR), ends), win_ms(KA, 3 * SR, ends)
    I, LRA = integrated_and_lra(ka_all)
    rel300, rel250 = 1 - np.exp(-dt / 0.300), 1 - np.exp(-dt / 0.250)
    rel08 = 1 - (1 - 0.08) ** (spt / 512)  # the plugin's 0.08-per-block release at a 512-sample block
    inH = outH = grE = clipE = heatE = 0.0
    bandE = [0.0, 0.0, 0.0]
    rows = []
    for k in range(3 * N):
        a, z = starts[k], ends[k]
        pin, pout = absB[a:z].max(), min(absA[a:z].max(), 10 ** (CEIL / 20))
        inH = pin if pin > inH else inH + (pin - inH) * rel300
        outH = pout if pout > outH else outH + (pout - outH) * rel300
        over = max(0.0, float(db(pin)) + G - CEIL)
        shave = min(2.0, 0.35 * over)
        gi = -(over - shave)
        grE = gi if gi < grE else grE + (gi - grE) * rel250
        for j in range(3):
            g = -min(6.0, max(0.0, float(band_lv[j][k]) - band_thr[j]) * 0.5)
            bandE[j] = g if g < bandE[j] else bandE[j] + (g - bandE[j]) * rel250
        clipE = shave if shave > clipE else clipE + (shave - clipE) * rel08
        heat = float(np.clip(0.05 + 0.016 * over + 0.02 * shave, 0, 0.24))  # the sat + clip stages' work
        heatE = heat if heat > heatE else heatE + (heat - heatE) * rel08
        rows.append(dict(inputDb=round(float(db(inH)), 2), outputDb=round(float(db(outH)), 2), gr=round(grE, 2),
                         clipGr=round(clipE, 2), lufs=round(float(lufs(msS[k])), 2), truePeak=round(float(db(outH)), 2),
                         heatUse=round(heatE, 4), grLow=round(bandE[0], 2), grMid=round(bandE[1], 2),
                         grHigh=round(bandE[2], 2), lufsM=round(float(lufs(msM[k])), 2)))
    loop = rows[N:2 * N]
    for r in loop:
        r.update(maxIn=round(float(db(absB.max())), 2), maxOut=round(min(CEIL, float(db(absA.max()))), 2),
                 lufsI=round(I, 2), lra=round(LRA, 2))
    meta = dict(song=song, start=t0, len=L, ticks=N, tickMs=round(dt * 1000, 3), idleGain=round(G, 2))
    Path(out).write_text(json.dumps(dict(meta=meta, ticks=loop)))
    print(json.dumps(meta))
    for key in ('lufsM', 'inputDb', 'outputDb', 'gr', 'grLow', 'grMid', 'grHigh', 'clipGr', 'heatUse'):
        v = np.array([r[key] for r in loop])
        print(f'  {key:8s} min {v.min():7.2f}  p50 {np.median(v):7.2f}  max {v.max():7.2f}')
    if plot: draw(loop, plot, f'{song} {t0:.2f} s + {L:.2f} s')

def draw(loop, path, title):
    from PIL import Image, ImageDraw
    W, H = 1400, 760
    im = Image.new('RGB', (W, H), (14, 12, 18))
    d = ImageDraw.Draw(im)
    d.text((10, 6), title, fill=(230, 220, 240))
    lanes = [('lufsM (needle + strip)', 'lufsM', -30, 0, (255, 190, 90)), ('inputDb (IN, ghost)', 'inputDb', -24, 0, (140, 200, 255)),
             ('gr (arc, halo, GR)', 'gr', -12, 0, (255, 80, 60)), ('grLow', 'grLow', -12, 0, (255, 140, 60)),
             ('grMid', 'grMid', -12, 0, (255, 200, 60)), ('grHigh', 'grHigh', -12, 0, (200, 255, 90)),
             ('clipGr (CLIP)', 'clipGr', 0, 4, (255, 100, 200)), ('heatUse (heat needle, x4 on screen)', 'heatUse', 0, 0.25, (255, 120, 40))]
    lh, n = (H - 30) // len(lanes), len(loop)
    for li, (name, key, lo, hi, col) in enumerate(lanes):
        y0 = 26 + li * lh
        d.rectangle([60, y0, W - 10, y0 + lh - 6], outline=(50, 44, 60))
        d.text((64, y0 + 2), name, fill=(170, 160, 190))
        d.line([(60 + i * (W - 70) / (n - 1), y0 + lh - 6 - min(1, max(0, (r[key] - lo) / (hi - lo))) * (lh - 8))
                for i, r in enumerate(loop)], fill=col, width=2)
    im.save(path)

if __name__ == '__main__':
    if len(sys.argv) < 4: sys.exit(__doc__)
    if sys.argv[2] == 'find':
        find(sys.argv[1], float(sys.argv[3]))
    else:
        meters(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4], sys.argv[5] if len(sys.argv) > 5 else None)
