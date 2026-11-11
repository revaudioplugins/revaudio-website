"""RevFX #hear player (src/components/revfx/RfxHear.astro): the bounces + Yoni's presets -> level-matched, padded AAC,
baked peaks and the preset list the die rolls through.

  python tools/revfx-player/prep_audio.py "C:/path/to/revfx-bounces"     the real sounds
  python tools/revfx-player/prep_audio.py --placeholder                   stand-ins from /drift's bounces

In (real), per track below (same length, same start; any sample rate; names in any case, "#" optional, the track
name singular or plural: "vocals #1.wav" = "vocal 1.wav"):
            <src>/<name> dry.wav            the dry bounce
            <src>/<name> 1.wav .. 4.wav     the same bounce through RevFX preset 1..4
            <src>/<name> 1.xml .. 4.xml     those presets, as RevFX saved them (%APPDATA%/RevAudio/RevFX/Presets/);
                                            missing = the track keeps its preset names / pedals / order from
                                            revfx-presets.json and that file says "placeholder": true
Out:        public/audio/revfx/<id>-before.m4a (dry), <id>-p1.m4a .. <id>-p4.m4a (RevFX)   AAC 160k (house setting)
            public/audio/revfx/peaks.json   per track: loop length, the trims, L/R peaks of every version
            src/data/revfx-presets.json     per track: each preset's name, the pedals it uses, its chain order

The die (src/lib/revfx/hear.ts) only ever plays these 4 per track: it looks random to the visitor, but every roll is
a preset Yoni made (Yoni 2026-11-09: "only for the user its random").

Same rules as tools/drift-player/prep_audio.py (the /drift player, kept in step on purpose):
Level match (honest A/B): a louder file always sounds "better", so all five versions of a track come DOWN to the
quietest one's integrated loudness (EBU R128). Down, never up: raising a file could push its peaks past 0 dBFS.
Padding: AAC adds encoder delay, so every file is the loop + PAD seconds on both sides taken from the loop itself;
the player loops the window [PAD, PAD + dur] and the seam never lands on a priming gap.

Preset .xml -> the page (RevFX Source/PresetManager.cpp writes <RevFXPreset name=...><Param id= value=/>):
  on    = BYP_<fx> is 0 and <fx>_MIX > 0 (PITCH also needs PITCH_ST or FORMANT_ST off 0: at 0 st it does nothing)
  order = PITCH / ECHO / REVERB / HALO by their ORD_* slot, GLUE COMP before slot ORD_GLUE (4 = last), as
          PluginProcessor.cpp's MODULAR FX CHAIN builds it

--placeholder: copies /drift's finished files under RevFX's ids (vocal <- vocals, instruments <- keys, drums <- perc,
lead <- synth), every preset plays <id>-after.m4a, the preset names are the dice engine's scene names, and both
JSON files say "placeholder": true. DRIFT, not RevFX, is what you hear: swap before launch.
"""
import json, os, re, shutil, subprocess, sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'audio', 'revfx')
PRESETS = os.path.join(ROOT, 'src', 'data', 'revfx-presets.json')
SR, PAD, BINS, N = 48000, 0.25, 176, 4
TRACKS = [  # id, the bounce's file name stem, the /drift stand-in
    ('vocal', 'vocal', 'vocals'),
    ('instruments', 'instruments', 'keys'),
    ('drums', 'drums', 'perc'),
    ('lead', 'lead', 'synth'),
]
# the page's pedal ids <- RevFX's parameter stems (HALO's order slot is still called ORD_TREM: it replaced TREMOLO)
FX = {'pitch': ('PITCH', 'ORD_PITCH'), 'echo': ('DLY', 'ORD_ECHO'), 'reverb': ('VERB', 'ORD_VERB'), 'halo': ('HALO', 'ORD_TREM')}
BYP = {'pitch': 'BYP_PITCH', 'echo': 'BYP_DLY', 'reverb': 'BYP_VERB', 'halo': 'BYP_HALO', 'glue': 'BYP_GLUE'}


def find(src, stem, tag, ext):
    """<src>/<stem> <tag>.<ext>, forgiving: any case, '#' before the number optional, stem singular or plural."""
    want = {f'{st} {pre}{tag}.{ext}'.lower() for st in (stem, stem + 's') for pre in ('', '#')}
    for f in os.listdir(src):
        if f.lower() in want:
            return os.path.join(src, f)
    return None


def read_preset(path):
    root = ET.parse(path).getroot()
    p = {e.get('id'): float(e.get('value')) for e in root.iter('Param')}
    mix = {'pitch': 'PITCH_MIX', 'echo': 'DLY_MIX', 'reverb': 'VERB_MIX', 'halo': 'HALO_MIX', 'glue': 'GLUE_MIX'}
    on = [fx for fx in BYP if p.get(BYP[fx], 0) < .5 and p.get(mix[fx], 0) > .001]
    if 'pitch' in on and abs(p.get('PITCH_ST', 0)) < .01 and abs(p.get('FORMANT_ST', 0)) < .01:
        on.remove('pitch')
    four = sorted(FX, key=lambda fx: p.get(FX[fx][1], 0))
    four.insert(min(4, max(0, round(p.get('ORD_GLUE', 4)))), 'glue')
    return {'name': (root.get('name') or os.path.splitext(os.path.basename(path))[0]).strip().upper(),
            'on': [fx for fx in four if fx in on], 'order': four}


# stand-in presets: the plugin's own dice scene names (src/lib/drift/fxv/drift-randomizer.js), plausible pedals
def _ph(name, on, order):
    return {'name': name, 'on': [x for x in order if x in on], 'order': order}
PLACEHOLDER_PRESETS = {
    'vocal': [_ph('DOUBLE', 'pitch halo glue', ['halo', 'pitch', 'echo', 'reverb', 'glue']),
              _ph('SPACE', 'echo reverb glue', ['glue', 'echo', 'reverb', 'pitch', 'halo']),
              _ph('SLAPBACK', 'echo glue', ['echo', 'glue', 'pitch', 'halo', 'reverb']),
              _ph('ANGEL WINGS', 'pitch halo reverb glue', ['pitch', 'halo', 'reverb', 'echo', 'glue'])],
    'instruments': [_ph('SHEEN', 'halo reverb glue', ['halo', 'reverb', 'pitch', 'echo', 'glue']),
                    _ph('WIDE PING', 'echo halo glue', ['echo', 'halo', 'glue', 'pitch', 'reverb']),
                    _ph('DREAM', 'pitch echo reverb halo glue', ['pitch', 'echo', 'halo', 'reverb', 'glue']),
                    _ph('VELVET', 'halo reverb glue', ['glue', 'halo', 'reverb', 'pitch', 'echo'])],
    'drums': [_ph('BIG ROOM', 'reverb glue', ['glue', 'reverb', 'pitch', 'echo', 'halo']),
              _ph('TRIPLET GROOVE', 'echo glue', ['echo', 'glue', 'pitch', 'halo', 'reverb']),
              _ph('BROKEN MACHINE', 'pitch echo glue', ['pitch', 'echo', 'glue', 'halo', 'reverb']),
              _ph('HAUNTED', 'pitch reverb glue', ['reverb', 'pitch', 'glue', 'echo', 'halo'])],
    'lead': [_ph('NIGHT DRIVE', 'echo reverb halo glue', ['halo', 'echo', 'reverb', 'pitch', 'glue']),
             _ph('OCTAVE', 'pitch glue', ['pitch', 'glue', 'echo', 'halo', 'reverb']),
             _ph('SPACE WARP', 'pitch echo reverb glue', ['pitch', 'echo', 'reverb', 'glue', 'halo']),
             _ph('ALIEN RADIO', 'pitch echo halo glue', ['echo', 'pitch', 'halo', 'glue', 'reverb'])],
}


def placeholder():
    src = os.path.join(ROOT, 'public', 'audio', 'drift')
    with open(os.path.join(src, 'peaks.json')) as f:
        drift = json.load(f)
    os.makedirs(OUT, exist_ok=True)
    manifest = {'pad': drift['pad'], 'sr': drift['sr'], 'bins': drift['bins'], 'placeholder': True, 'tracks': {}}
    for tid, _, stand in TRACKS:
        for v in ('before', 'after'):
            shutil.copyfile(os.path.join(src, f'{stand}-{v}.m4a'), os.path.join(OUT, f'{tid}-{v}.m4a'))
        t = drift['tracks'][stand]
        manifest['tracks'][tid] = {'dur': t['dur'], 'trimDb': t.get('trimDb', 0), 'before': t['before'],
                                   'presets': [{'file': f'{tid}-after', 'trimDb': 0, **t['after']} for _ in range(N)]}
        print(f'{tid:12s} <- drift/{stand}')
    return manifest, {'placeholder': True, 'tracks': PLACEHOLDER_PRESETS}


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
    with open(PRESETS) as f:
        known = json.load(f)['tracks']                         # what the page shows today, kept where no .xml came
    presets = {'tracks': {}}
    for tid, stem, _ in TRACKS:
        tags = ['dry'] + [str(k) for k in range(1, N + 1)]
        paths = [find(src, stem, t, 'wav') for t in tags]
        xmls = [find(src, stem, str(k), 'xml') for k in range(1, N + 1)]
        missing = [f'{stem} {t}.wav' for t, p in zip(tags, paths) if not p]
        assert not missing, f'{tid}: missing ' + ', '.join(missing)
        audio = [read(p) for p in paths]
        assert len({len(a) for a in audio}) == 1, f'{tid}: the 5 bounces differ in length ({[len(a) for a in audio]}): bounce all the same length'
        loud = [lufs(p) for p in paths]
        target = min(loud)                                     # all five come down to the quietest
        trims = [target - l for l in loud]
        for a, t in zip(audio, trims):
            a *= 10 ** (t / 20)
        write(audio[0], f'{tid}-before.m4a')
        for k in range(1, N + 1):
            write(audio[k], f'{tid}-p{k}.m4a')
        manifest['tracks'][tid] = {'dur': len(audio[0]) / SR, 'trimDb': round(trims[0], 2), 'before': peaks(audio[0]),
                                   'presets': [{'file': f'{tid}-p{k}', 'trimDb': round(trims[k], 2), **peaks(audio[k])}
                                               for k in range(1, N + 1)]}
        presets['tracks'][tid] = [read_preset(x) if x else known[tid][k] for k, x in enumerate(xmls)]
        if not all(xmls):
            presets['placeholder'] = True
            print(f'{tid:12s} no preset .xml for ' + ', '.join(str(k + 1) for k, x in enumerate(xmls) if not x)
                  + ': names / pedals / order kept from revfx-presets.json')
        print(f'{tid:12s} {len(audio[0])/SR:6.2f}s  {target:.1f} LUFS  trims ' + ' '.join(f'{t:+.1f}' for t in trims)
              + '  peaks ' + ' '.join(f'{20*np.log10(max(np.abs(a).max(), 1e-9)):+.1f}' for a in audio) + ' dBFS')
        for p in presets['tracks'][tid]:
            print(f'{"":12s} {p["name"]:20s} {" > ".join(x.upper() for x in p["order"])}   on: {" ".join(p["on"]) or "none"}')
    return manifest, presets


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    manifest, presets = placeholder() if sys.argv[1] == '--placeholder' else real(sys.argv[1])
    with open(os.path.join(OUT, 'peaks.json'), 'w') as f:
        json.dump(manifest, f, separators=(',', ':'))
    with open(PRESETS, 'w') as f:
        json.dump(presets, f, indent=1)
    if not manifest.get('placeholder'):   # the stand-ins' after files go once the real presets are in
        for tid, _, _ in TRACKS:
            old = os.path.join(OUT, f'{tid}-after.m4a')
            if os.path.isfile(old):
                os.remove(old)
    files = [x for x in os.listdir(OUT) if x.endswith('.m4a')]
    size = sum(os.path.getsize(os.path.join(OUT, x)) for x in files)
    print(f'wrote {OUT}: {len(files)} m4a {size/1e6:.1f} MB + peaks.json, {PRESETS}'
          f'{" (PLACEHOLDER: /drift sounds)" if manifest.get("placeholder") else ""}')
