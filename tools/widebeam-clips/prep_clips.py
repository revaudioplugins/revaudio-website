"""WIDE BEAM demo clips (plan D.3, Dan's pick P3 B): four loops cut from the team's own renders already on the site,
loudness-matched to each other and to the page's synth loop, padded and encoded like the house players.

  python3 -I tools/widebeam-clips/prep_clips.py [out_dir]     (from the repo root; out_dir defaults to the page's
                                                             src/assets/widebeam/clips/, which it overwrites)

Sources (all Yoni's DAW renders, already published on revaudio.net; provenance in the lane D report):
  vocal  public/audio/revfx/vocal-before.m4a        RevFX #hear, the dry vocal: mono (L == R). Its whole 12.0 s loop.
  guitar public/station-mixer/audio/guitar_dry.m4a  Radio Roulette station mixer, the dry guitar: a double (two takes,
                                                    L / R). The first 4 of its 8 bars: its two halves are the same audio.
  pad    public/audio/revfx/instruments-before.m4a  RevFX #hear, the dry instrument bed: sustained, side ~6 dB under mid.
                                                    Its whole 12.7 s loop.
  mix    public/gas-mixer/audio/{drums,bass,instruments}_dry.m4a summed: the GAS mixer's three dry stems = its full mix.
                                                    The first 4 of its 8 bars (bars 5-8 repeat 1-4).
Each source file is a padded loop (the house format: PAD s of the loop itself on both sides); the numbers below are its
loop window in samples at 48 kHz, from the players that use it (peaks.json / process_stems.py / the mixers' PADS).

Per clip: the loop window; the last 20 ms crossfaded into the source's own material just before the loop start (which
flows into bar 1 in the original), so the wrap is seamless; one gain to the synth loop's integrated loudness at the engine
input (TARGET, measured: loop-render.cjs); a lookahead true-peak limiter (4x, FFT-oversampled: exact for a loop) only
where that gain pushes the true peak past CEIL; then PAD s of the loop itself on both sides, AAC 160k (the house setting),
faststart. The page loops [PAD, PAD + dur] (the AAC priming never lands on the seam).
"""
import json, os, re, subprocess, sys, tempfile
import numpy as np

SR, PAD = 48000, 0.25
TARGET = -19.3   # LUFS: the Night Drive synth loop at the engine input (loop-render.cjs, ffmpeg ebur128)
CEIL = -1.5      # dBTP before the encode (AAC adds a little overshoot; the files must stay <= -1.0 dBTP)
XF = 960         # 20 ms seam crossfade

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO, 'src', 'assets', 'widebeam', 'clips')
P = lambda *a: os.path.join(REPO, *a)
CLIPS = [  # id, sources (summed), loop start, loop length (samples)
    ('vocal', ['public/audio/revfx/vocal-before.m4a'], 12000, 576000),
    ('guitar', ['public/station-mixer/audio/guitar_dry.m4a'], 64000, 512000),
    ('pad', ['public/audio/revfx/instruments-before.m4a'], 12000, 610331),
    ('mix', ['public/gas-mixer/audio/drums_dry.m4a', 'public/gas-mixer/audio/bass_dry.m4a', 'public/gas-mixer/audio/instruments_dry.m4a'], 82285, 658286),
]

def read(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f64le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<f8').reshape(-1, 2).copy()

def ebur(a, reps=2):
    """integrated loudness + true peak of a loop (played `reps` times, so the gating blocks see it as it loops)"""
    with tempfile.NamedTemporaryFile(suffix='.f32', delete=False) as f:
        f.write(np.tile(a, (reps, 1)).astype('<f4').tobytes()); name = f.name
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', name, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    os.unlink(name)
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', err)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', err)[-1])
    return I, TP

def tp_env(a):
    """per-sample true-peak envelope of a periodic loop: 4x FFT interpolation, max over channels and the 4 sub-samples"""
    n = len(a); out = np.zeros(n)
    for c in range(2):
        X = np.fft.rfft(a[:, c]); Y = np.zeros(2 * n + 1, complex); Y[:len(X)] = X
        if n % 2 == 0: Y[len(X) - 1] *= 0.5   # split the Nyquist bin
        y = np.fft.irfft(Y, 4 * n) * 4
        out = np.maximum(out, np.abs(y).reshape(n, 4).max(1))
    return out

def limit(a, ceil_db, look=240, rel=0.05):
    """lookahead limiter on a loop (circular): gain <= ceiling / true peak everywhere, attack over `look` samples
    (min over +-look, then a centred mean over +-look: never above the need at any sample), release one-pole `rel` s"""
    n = len(a); c = 10 ** (ceil_db / 20)
    need = np.minimum(1.0, c / np.maximum(tp_env(a), 1e-12))
    if need.min() >= 1.0: return a, 0.0
    t = np.concatenate([need, need, need])
    from numpy.lib.stride_tricks import sliding_window_view as win
    m = win(np.pad(t, look, mode='edge'), 2 * look + 1).min(1)
    k = np.ones(2 * look + 1) / (2 * look + 1)
    s = np.convolve(np.pad(m, look, mode='edge'), k, mode='valid')
    g = np.empty_like(s); g[0] = s[0]; up = 1 - np.exp(-1 / (rel * SR))
    for i in range(1, len(s)):
        v = g[i - 1] + (1 - g[i - 1]) * up
        g[i] = s[i] if s[i] < v else v
    g = g[n:2 * n]
    return a * g[:, None], float(20 * np.log10(g.min()))

def encode(a, path):
    p = int(PAD * SR)
    padded = np.concatenate([a[-p:], a, a[:p]]).astype('<f4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', path], input=padded.tobytes(), check=True)

os.makedirs(OUT, exist_ok=True)
report = {'target_lufs': TARGET, 'pad': PAD, 'sr': SR, 'clips': {}}
for cid, srcs, start, n in CLIPS:
    x = sum(read(P(s)) for s in srcs)
    loop = x[start:start + n].copy()
    pre = x[start - XF:start]                         # what plays just before the loop start in the source (its loop end)
    w = 0.5 - 0.5 * np.cos(np.pi * (np.arange(XF) + 0.5) / XF)
    seam_before = float(np.abs(loop[-1] - loop[0]).max())
    loop[-XF:] = loop[-XF:] * np.sqrt(1 - w)[:, None] + pre * np.sqrt(w)[:, None]
    seam_after = float(np.abs(loop[-1] - loop[0]).max())
    step = float(np.median(np.abs(np.diff(loop, axis=0)).max(1)))
    I0, TP0 = ebur(loop)
    gain = TARGET - I0; y = loop * 10 ** (gain / 20); red = 0.0
    for _ in range(6):                                 # the limiter costs a little loudness: re-aim until within 0.05 LU
        y, red = limit(loop * 10 ** (gain / 20), CEIL)
        I1, TP1 = ebur(y)
        if abs(I1 - TARGET) < 0.05: break
        gain += TARGET - I1
    path = os.path.join(OUT, f'{cid}.m4a'); encode(y, path)
    d = read(path); p = int(PAD * SR); dec = d[p:p + n]
    I2, TP2 = ebur(dec)
    # the wrap in the decoded file: the last sample of the window against the first, as a multiple of the typical step
    wrap = float(np.abs(dec[-1] - dec[0]).max()); dstep = float(np.median(np.abs(np.diff(dec, axis=0)).max(1)))
    L, R = dec[:, 0], dec[:, 1]
    corr = float((L * R).sum() / np.sqrt((L * L).sum() * (R * R).sum() + 1e-20))
    sm = float(10 * np.log10((((L - R) / 2) ** 2).sum() / ((((L + R) / 2) ** 2).sum() + 1e-20) + 1e-20))
    report['clips'][cid] = dict(sources=srcs, loop_start=start, samples=n, dur=round(n / SR, 6), src_lufs=round(I0, 2), src_tp=round(TP0, 2),
                                gain_db=round(gain, 2), limiter_db=round(red, 2), lufs=round(I2, 2), tp=round(TP2, 2), bytes=os.path.getsize(path),
                                corr=round(corr, 3), side_mid_db=round(sm, 1), seam_raw=round(seam_before, 4), seam_xf=round(seam_after, 4),
                                wrap_vs_step=round(wrap / max(dstep, 1e-9), 2))
    print(cid, json.dumps(report['clips'][cid]))
print(json.dumps(report, indent=1))  # the numbers for the record; nothing extra goes into src/assets/
