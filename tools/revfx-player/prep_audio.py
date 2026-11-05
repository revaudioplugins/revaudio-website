"""RevFX #hear player (src/components/revfx/RfxHear.astro): the bounces -> level-matched, padded AAC + baked peaks.

  python tools/revfx-player/prep_audio.py "C:/path/to/revfx-bounces"     the real sounds
  python tools/revfx-player/prep_audio.py --placeholder                   stand-ins from /drift's bounces

In (real):  <src>/<name> dry.wav + <name> revfx.wav for each track below (same length, same start; any sample rate).
Out:        public/audio/revfx/<id>-before.m4a (dry), <id>-after.m4a (RevFX)   AAC 160k (house setting)
            public/audio/revfx/peaks.json   per track: loop length, the trim applied, L/R peaks of both versions

Same rules as tools/drift-player/prep_audio.py (the /drift player, kept in step on purpose):
Level match (honest A/B): a louder file always sounds "better", so whichever side is LOUDER is turned DOWN to the
other's integrated loudness (EBU R128). Down, never up: raising a file could push its peaks past 0 dBFS. RevFX can
come back louder (glue makeup, reverb tail) or quieter, so unlike DRIFT either side may be the one trimmed.
Padding: AAC adds encoder delay, so every file is the loop + PAD seconds on both sides taken from the loop itself;
the player loops the window [PAD, PAD + dur] and the seam never lands on a priming gap.

--placeholder: copies /drift's finished files under RevFX's ids (vocal <- vocals, instruments <- keys, drums <- perc,
lead <- synth) and marks peaks.json "placeholder": true. DRIFT, not RevFX, is what you hear: swap before launch.
"""
import json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'audio', 'revfx')
SR, PAD, BINS = 48000, 0.25, 176
TRACKS = [  # id, dry file, RevFX file (without .wav), the /drift stand-in
    ('vocal', 'vocal dry', 'vocal revfx', 'vocals'),
    ('instruments', 'instruments dry', 'instruments revfx', 'keys'),
    ('drums', 'drums dry', 'drums revfx', 'perc'),
    ('lead', 'lead dry', 'lead revfx', 'synth'),
]


def placeholder():
    src = os.path.join(ROOT, 'public', 'audio', 'drift')
    with open(os.path.join(src, 'peaks.json')) as f:
        drift = json.load(f)
    os.makedirs(OUT, exist_ok=True)
    manifest = {'pad': drift['pad'], 'sr': drift['sr'], 'bins': drift['bins'], 'placeholder': True, 'tracks': {}}
    for tid, _, _, stand in TRACKS:
        for v in ('before', 'after'):
            shutil.copyfile(os.path.join(src, f'{stand}-{v}.m4a'), os.path.join(OUT, f'{tid}-{v}.m4a'))
        manifest['tracks'][tid] = drift['tracks'][stand]
        print(f'{tid:12s} <- drift/{stand}')
    return manifest


def real(src):
    import numpy as np

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
    for tid, dry, wet, _ in TRACKS:
        fo, fw = os.path.join(src, dry + '.wav'), os.path.join(src, wet + '.wav')
        a, b = read(fo), read(fw)
        assert len(a) == len(b), f'{tid}: dry and RevFX lengths differ ({len(a)} vs {len(b)}): bounce both the same length'
        d = lufs(fw) - lufs(fo)                      # > 0: RevFX is louder
        trimB, trimA = min(-d, 0.0), min(d, 0.0)     # the louder one comes down; the other is untouched
        b *= 10 ** (trimB / 20); a *= 10 ** (trimA / 20)
        write(a, f'{tid}-before.m4a'); write(b, f'{tid}-after.m4a')
        manifest['tracks'][tid] = {'dur': len(a) / SR, 'trimDb': round(trimA, 2), 'trimAfterDb': round(trimB, 2),
                                   'before': peaks(a), 'after': peaks(b)}
        print(f'{tid:12s} {len(a)/SR:6.2f}s  dry {trimA:+.1f} dB  revfx {trimB:+.1f} dB  '
              f'peaks dry {20*np.log10(np.abs(a).max()):+.1f} revfx {20*np.log10(np.abs(b).max()):+.1f} dBFS')
    return manifest


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    manifest = placeholder() if sys.argv[1] == '--placeholder' else real(sys.argv[1])
    with open(os.path.join(OUT, 'peaks.json'), 'w') as f:
        json.dump(manifest, f, separators=(',', ':'))
    files = [x for x in os.listdir(OUT) if x.endswith('.m4a')]
    size = sum(os.path.getsize(os.path.join(OUT, x)) for x in files)
    print(f'wrote {OUT}: {len(files)} m4a {size/1e6:.1f} MB + peaks.json'
          f'{" (PLACEHOLDER: /drift sounds)" if manifest.get("placeholder") else ""}')
