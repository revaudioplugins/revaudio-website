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

""" The other plugins (Dan 2026-11-10: "record them"): each screen takes one value from its plugin, measured here the
way the plugin measures it, from that plugin's own demo on the site:
  gas             'heat' (GasEngine.h): RMS of (wet - dry) over RMS of dry, 200 ms smoothing; the gas-mixer stems at
                  drive 6 against their dry takes
  radio-roulette  'level' (PluginEditor.cpp): the output peak, linear (the screen runs its 300 ms ballistics); the
                  station-mixer stems at station 3
  gas2            'meters'.lufs: momentary LUFS (the pump's number drums show it); no GAS 2 demo on the site, so the
                  RevLimiter demo's mix (before), the same phrase as RevLimiter's loop
  revfx           'gluegr' (PluginEditor.cpp): the GLUE COMP's gain reduction in dB, the most since the last tick, at
                  its defaults (glue_gr); the /revfx player's drum loop (before), 4 bars at 90 BPM, the whole file
  python3 tools/tv-anim/song-meters.py <plugin> findmix <len_s>          (gas / radio-roulette)
  python3 tools/tv-anim/song-meters.py <plugin> value <start_s> <len_s> <out.json>
"""
SITE = Path(__file__).resolve().parents[2] / 'public'
STEMS = {'gas': ('gas-mixer/audio', ['bass', 'drums', 'instruments'], '6', 'dry'),
         'radio-roulette': ('station-mixer/audio', ['bass', 'drums', 'guitar', 'keys'], 's3', 'dry')}

def decode_file(path, kweight=False):
    af = ['-af', KW] if kweight else []
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), *af, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)

def lag_of(w, d):
    """samples the take `w` runs behind `d` (cross-correlation over 4 s from 5 s in)"""
    a, b = w.mean(axis=1)[5 * SR:9 * SR], d.mean(axis=1)[5 * SR:9 * SR]
    n = 1 << 19
    c = np.fft.irfft(np.fft.rfft(a, n) * np.conj(np.fft.rfft(b, n)), n)
    k = int(np.argmax(c))
    return k - n if k > n // 2 else k

def stem_mix(plugin, take):
    """the stems summed; a dry take is shifted onto its wet take (the bass dry runs ~52 samples off), or every
    sample would read as heat"""
    d, names, wet, dry = STEMS[plugin]
    xs = []
    for nm in names:
        w = decode_file(SITE / d / f'{nm}_{wet}.m4a')
        if take == 'wet': xs.append(w); continue
        x = decode_file(SITE / d / f'{nm}_{dry}.m4a')
        xs.append(np.roll(x, lag_of(w, x), axis=0))
    n = min(len(x) for x in xs)
    return sum(x[:n] for x in xs)

def findmix(plugin, L):
    x = stem_mix(plugin, 'wet')
    f = flux(x)
    f = (f - f.mean()) / (f.std() + 1e-9)
    ac = [(float((f[:-k] * f[k:]).mean()), k / 100) for k in range(30, 101)]
    beat = max(ac)[1]
    print(f'  {len(x) / SR:.1f} s; beat ~{beat:.2f} s ({60 / beat:.1f} BPM) -> 4 bars ~{16 * beat:.2f} s')
    n, res = int(L * 100), []
    for i in range(0, len(f) - n - 110, 2):
        res.append((float((f[i:i + 100] * f[i + n:i + n + 100]).mean()) + 0.6 * f[i], i / 100))
    picked = []
    for r in sorted(res, reverse=True):
        if all(abs(r[1] - p[1]) > 2 for p in picked): picked.append(r)
        if len(picked) == 6: break
    for sc, t in picked: print(f'  start {t:6.2f}s  score {sc:5.2f}')

def glue_gr(x):
    """RevFX's GLUE COMP at its defaults (RevFX Source/GlueComp.h, PluginProcessor.cpp): threshold -10 dB, 2:1 with a
    10 dB soft knee, attack 10 ms, AUTO release (a 100 ms branch and a slow one that charges in ~400 ms and lets go in
    1.6 s; the larger wins), the envelope smooth-decoupled on the GR in dB. The detector is the stereo power mean (its
    true-peak points are left out); worked on the loudest of every 4 samples. Returns the GR per 4 samples."""
    pw = (x[:, 0] ** 2 + x[:, 1] ** 2) / 2
    n = len(pw) // 4 * 4
    over = 10 * np.log10(pw[:n].reshape(-1, 4).max(axis=1) + 1e-12) + 10.0
    gs = np.where(over <= -5, 0.0, np.where(over >= 5, over / 2, (over + 5) ** 2 / 40))
    a = lambda ms: float(np.exp(-1 / (ms / 1000 * SR / 4)))
    aA, aF, aC, aS = a(10), a(100), a(400), a(1600)
    yA = yF = yS = 0.0
    out = np.empty_like(gs)
    for i, g in enumerate(gs.tolist()):
        yF = max(g, aF * yF + (1 - aF) * g)
        yS = aC * yS + (1 - aC) * g if g > yS else aS * yS + (1 - aS) * g
        yA = aA * yA + (1 - aA) * max(yF, yS)
        out[i] = yA
    return out

def values(plugin, t0, L, out):
    i0, n = int(round(t0 * SR)), int(round(L * SR))
    N = int(round(L * TICK_HZ / FRAME_TICKS)) * FRAME_TICKS
    spt = n / N
    ends = np.round((np.arange(3 * N) + 1) * spt).astype(int)
    starts = np.concatenate([[0], ends[:-1]])
    rows = []
    if plugin == 'revfx':
        x = decode_file(SITE / 'audio/revfx/drums-before.m4a')
        if len(x) < i0 + n: raise SystemExit(f'the drum loop is {len(x) / SR:.4f} s: a {L} s loop from {t0} s runs past it')
        g = glue_gr(np.concatenate([x[i0:i0 + n]] * 3))
        for a, z in zip(starts, ends): rows.append(round(float(g[a // 4:max(a // 4 + 1, z // 4)].max()), 2))
    elif plugin == 'gas2':
        K = np.concatenate([decode('revlimiter-before', True)[i0:i0 + n]] * 3)
        for v in lufs(win_ms(K, int(0.4 * SR), ends)): rows.append(round(float(v), 2))
    else:
        W = np.concatenate([stem_mix(plugin, 'wet')[i0:i0 + n]] * 3)
        if plugin == 'radio-roulette':
            for a, z in zip(starts, ends): rows.append(round(float(min(1.0, np.abs(W[a:z]).max())), 4))
        else:
            D = np.concatenate([stem_mix(plugin, 'dry')[i0:i0 + n]] * 3)
            heat, coef = 0.0, float(np.exp(-spt / (0.2 * SR)))
            for a, z in zip(starts, ends):
                w, d = W[a:z:8], D[a:z:8]
                inst = float(np.sqrt(((w - d) ** 2).sum() / (((d ** 2).sum()) + 1e-9)))
                heat = coef * heat + (1 - coef) * min(1.0, inst)
                rows.append(round(heat, 4))
    loop = rows[N:2 * N]
    meta = dict(plugin=plugin, start=t0, len=L, ticks=N, tickMs=round(spt / SR * 1000, 3))
    Path(out).write_text(json.dumps(dict(meta=meta, ticks=loop)))
    v = np.array(loop)
    print(json.dumps(meta), f'value min {v.min():.3f} p50 {np.median(v):.3f} max {v.max():.3f}')

if __name__ == '__main__':
    if len(sys.argv) < 4: sys.exit(__doc__)
    if sys.argv[2] == 'find':
        find(sys.argv[1], float(sys.argv[3]))
    elif sys.argv[2] == 'findmix':
        findmix(sys.argv[1], float(sys.argv[3]))
    elif sys.argv[2] == 'value':
        values(sys.argv[1], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5])
    else:
        meters(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4], sys.argv[5] if len(sys.argv) > 5 else None)
