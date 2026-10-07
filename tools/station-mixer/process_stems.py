"""Station Mixer stems: loudness-match every version to its stem's DRY, fix loop seams,
one global trim so every file peaks <= -1 dBFS (true peak, 4x). Writes 24-bit FLAC + manifest."""
import subprocess, numpy as np, os, json, pyloudnorm as pyln
from scipy.signal import resample_poly
SRC = r"C:\shirimmmmmm"
OUT = r"C:\RevAudio\Website\revaudio-website\bench\assets\station-mixer\audio"
SR, L = 48000, 1024000
STEMS = {"drums": "Drums_{}", "bass": "bass_{}", "keys": "Keys_{}", "guitar": "guitar_{}"}
CAP = {"drums": True, "keys": True, "bass": False, "guitar": False}
VERS = ["dry", "s1", "s2", "s3", "s4", "s5"]
SEAM = 240  # 5 ms bridge ramp at the loop end
meter = pyln.Meter(SR)

def src_name(stem, v):
    word = "dry" if v == "dry" else f"station{v[1]}"
    if CAP[stem]: word = word.capitalize()
    return os.path.join(SRC, STEMS[stem].format(word) + ".mp3")

def load(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "f64le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float64).reshape(-1, 2).copy()
    assert len(x) == L, (f, len(x))
    return x

def seam_fix(x):
    # smooth raised-cosine offset ramp so the last sample meets the first: no step at the wrap
    step = x[0] - x[-1]
    w = 0.5 - 0.5 * np.cos(np.pi * np.arange(1, SEAM + 1) / SEAM)
    x[-SEAM:] += w[:, None] * step[None, :]
    return x

def true_peak(x):
    return 20 * np.log10(np.abs(resample_poly(x, 4, 1, axis=0)).max() + 1e-12)

data, rep = {}, {}
for stem in STEMS:
    dry = load(src_name(stem, "dry"))
    target = meter.integrated_loudness(dry)
    for v in VERS:
        x = load(src_name(stem, v)) if v != "dry" else dry.copy()
        lufs_in = meter.integrated_loudness(x)
        g = target - lufs_in
        x = seam_fix(x * 10 ** (g / 20))
        data[(stem, v)] = x
        rep[f"{stem}_{v}"] = {"lufs_in": round(lufs_in, 2), "gain_db": round(g, 2)}

# one global trim: loudest true peak of all 24 files lands at -1 dBTP
tp = {k: true_peak(x) for k, x in data.items()}
trim = -1.0 - max(tp.values())
for k in data: data[k] *= 10 ** (trim / 20)

for (stem, v), x in data.items():
    name = f"{stem}_{v}"
    rep[name].update(lufs_out=round(meter.integrated_loudness(x), 2), tp_out=round(tp[(stem, v)] + trim, 2),
                     seam_step=round(float(np.abs(x[0] - x[-1]).max()), 5))
    p = subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-",
                        "-c:a", "flac", "-sample_fmt", "s32", "-bits_per_raw_sample", "24", os.path.join(OUT, name + ".flac")],
                       input=x.astype(np.float64).tobytes(), check=True)

# mix check: every stem on the same version, plus all-dry
mix = {}
for v in VERS:
    m = sum(data[(s, v)] for s in STEMS)
    mix[v] = {"lufs": round(meter.integrated_loudness(m), 2), "tp": round(true_peak(m), 2)}
man = {"sr": SR, "samples": L, "bpm": 90, "bars": 8, "global_trim_db": round(trim, 2), "files": rep, "mix": mix}
json.dump(man, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
print("global trim", round(trim, 2))
for k, r in rep.items(): print(f"{k:12s} in {r['lufs_in']:7.2f}  gain {r['gain_db']:+6.2f}  out {r['lufs_out']:7.2f}  tp {r['tp_out']:6.2f}  seam {r['seam_step']}")
for v, r in mix.items(): print("MIX", v, r)
