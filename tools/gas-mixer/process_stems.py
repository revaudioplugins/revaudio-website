"""GAS Mixer stems: Yoni's DAW renders through GAS 0.3.1 (MIX 50 %, DRIVE 2/4/6/8, voice per loop).
Loudness-match every knob step to its loop's DRY (Yoni 2026-10-08), fix loop seams, one global trim so the loudest
file peaks at -1 dBTP (4x). Writes 24-bit FLAC + manifest.json + peaks.json (waveform lanes) to bench/assets/gas-mixer/audio/."""
import os, json, numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import resample_poly
SRC = r"C:\shirimmmmmm"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "bench", "assets", "gas-mixer", "audio")
SR = 48000
STEMS = {"drums": ("Drums_{}", "Fuzz"), "bass": ("bass_{}", "Fuzz"), "instruments": ("instruments_{}", "Tape")}
STEPS = ["dry", "2", "4", "6", "8"]
SEAM = 240  # 5 ms bridge ramp at the loop end
meter = pyln.Meter(SR)

def src(stem, k):
    word = ("Dry" if stem == "drums" else "dry") if k == "dry" else k
    return os.path.join(SRC, STEMS[stem][0].format(word) + ".wav")

def seam_fix(x):
    step = x[0] - x[-1]
    w = 0.5 - 0.5 * np.cos(np.pi * np.arange(1, SEAM + 1) / SEAM)
    x[-SEAM:] += w[:, None] * step[None, :]
    return x

def true_peak(x):
    return 20 * np.log10(np.abs(resample_poly(x, 4, 1, axis=0)).max() + 1e-12)

data, rep, L = {}, {}, None
for stem in STEMS:
    dry, sr = sf.read(src(stem, "dry"), dtype="float64")
    assert sr == SR
    L = L or len(dry)
    target = meter.integrated_loudness(dry)
    for k in STEPS:
        x = dry.copy() if k == "dry" else sf.read(src(stem, k), dtype="float64")[0]
        assert len(x) == L, (stem, k, len(x))
        lufs_in = meter.integrated_loudness(x)
        g = target - lufs_in
        data[(stem, k)] = seam_fix(x * 10 ** (g / 20))
        rep[f"{stem}_{k}"] = {"lufs_in": round(lufs_in, 2), "gain_db": round(g, 2)}

tp = {key: true_peak(x) for key, x in data.items()}
trim = -1.0 - max(tp.values())
for key in data: data[key] *= 10 ** (trim / 20)

for (stem, k), x in data.items():
    name = f"{stem}_{k}"
    rep[name].update(lufs_out=round(meter.integrated_loudness(x), 2), tp_out=round(tp[(stem, k)] + trim, 2),
                     seam_step=round(float(np.abs(x[0] - x[-1]).max()), 5))
    sf.write(os.path.join(OUT, name + ".flac"), x, SR, subtype="PCM_24")

mix = {}
for k in STEPS:
    m = sum(data[(s, k)] for s in STEMS)
    mix[k] = {"lufs": round(meter.integrated_loudness(m), 2), "tp": round(true_peak(m), 2)}
# waveform lanes for the bench: max |sample| per column, every stem x knob step (small, loads before PLAY)
COLS = 600
peaks = {f"{st}_{k}": [round(float(c), 3) for c in np.abs(x).max(axis=1)[: L // COLS * COLS].reshape(COLS, -1).max(axis=1)]
         for (st, k), x in data.items()}
json.dump(peaks, open(os.path.join(OUT, "peaks.json"), "w"), separators=(",", ":"))

man = {"sr": SR, "samples": L, "bpm": 70, "bars": 8, "plugin": "GAS 0.3.1, MIX 50 %, OUTPUT TRIM 0, HQ",
       "voices": {s: v for s, (_, v) in STEMS.items()}, "global_trim_db": round(trim, 2), "files": rep, "mix": mix}
json.dump(man, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
print("global trim", round(trim, 2))
for n, r in rep.items():
    print(f"{n:15s} in {r['lufs_in']:7.2f}  gain {r['gain_db']:+6.2f}  out {r['lufs_out']:7.2f}  tp {r['tp_out']:6.2f}  seam {r['seam_step']}")
for k, r in mix.items(): print("MIX", k, r)
