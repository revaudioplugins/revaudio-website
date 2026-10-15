"""DRIFT Turbo Dash player: Yoni's 10 bounces -> level-matched, padded AAC + baked waveform peaks.

  python tools/drift-player/prep_audio.py "C:/shirimmmmmm"

In:   <src>/<name> bypassed.wav + <name> drift.wav per track (percussion's original is "percussion dry.wav").
Out:  public/audio/drift/<id>-before.m4a, <id>-after.m4a   AAC 160k (house setting, like station-mixer)
      public/audio/drift/peaks.json   per track: loop length, the trim applied, L/R peaks for both versions

Level match (honest A/B): the DRIFT bounces came back quieter than the originals (1 to 4.8 LU). A louder file
always sounds "better", so the ORIGINAL is turned DOWN to the DRIFT file's integrated loudness (EBU R128).
Down, not up: raising DRIFT would push its peaks past 0 dBFS. The DRIFT file is never touched.
Padding: AAC adds encoder delay, so every file is the loop + PAD seconds on both sides taken from the loop
itself; the player loops the window [PAD, PAD + dur] and the seam never lands on a priming gap.
"""
import json, os, re, subprocess, sys
import numpy as np

SRC = sys.argv[1] if len(sys.argv) > 1 else 'C:/shirimmmmmm'
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'audio', 'drift')
SR, PAD, BINS = 48000, 0.25, 176
TRACKS = [  # id, original, DRIFT
    ('vocals', 'Vocal bypassed', 'Vocal drift'),
    ('keys', 'keys bypassed', 'keys drift'),
    ('synth', 'synth bypassed', 'synth drift'),
    ('guitar', 'guitar bypassed', 'guitar drift'),
    ('perc', 'percussion dry', 'percussion drift'),
]

def read(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<f4').reshape(-1, 2).copy()

def lufs(path):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', err)[-1])

def peaks(a):
    n = len(a); out = {}
    for k, ch in (('L', 0), ('R', 1)):
        x = np.abs(a[:, ch])
        out[k] = [round(float(x[int(b * n / BINS):int((b + 1) * n / BINS)].max()), 3) for b in range(BINS)]
    return out

def write(a, name):
    p = int(PAD * SR)
    padded = np.concatenate([a[-p:], a, a[:p]]).astype('<f4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', os.path.join(OUT, name)],
                   input=padded.tobytes(), check=True)

os.makedirs(OUT, exist_ok=True)
manifest = {'pad': PAD, 'sr': SR, 'bins': BINS, 'tracks': {}}
for tid, orig, drift in TRACKS:
    fo, fd = os.path.join(SRC, orig + '.wav'), os.path.join(SRC, drift + '.wav')
    a, b = read(fo), read(fd)
    assert len(a) == len(b), f'{tid}: original and DRIFT lengths differ ({len(a)} vs {len(b)})'
    trim = min(lufs(fd) - lufs(fo), 0.0)            # dB applied to the original; never raise anything
    a *= 10 ** (trim / 20)
    write(a, f'{tid}-before.m4a'); write(b, f'{tid}-after.m4a')
    manifest['tracks'][tid] = {'dur': len(a) / SR, 'trimDb': round(trim, 2),
                               'before': peaks(a), 'after': peaks(b)}
    print(f'{tid:7s} {len(a)/SR:6.2f}s  original trimmed {trim:+.1f} dB  peaks before {20*np.log10(np.abs(a).max()):+.1f} after {20*np.log10(np.abs(b).max()):+.1f} dBFS')

with open(os.path.join(OUT, 'peaks.json'), 'w') as f:
    json.dump(manifest, f, separators=(',', ':'))
size = sum(os.path.getsize(os.path.join(OUT, x)) for x in os.listdir(OUT) if x.endswith('.m4a'))
print(f'wrote {OUT}: 10 m4a {size/1e6:.1f} MB + peaks.json {os.path.getsize(os.path.join(OUT, "peaks.json"))/1e3:.0f} kB')
