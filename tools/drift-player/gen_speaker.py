"""#hear speakers: generate the speaker art with gpt-image-1 (text-only prompt, never RevAudio art uploaded, no lettering).

  python tools/drift-player/gen_speaker.py [roll ...]        (OPENAI_API_KEY from the User env)

Writes bench/assets/drift-player/gen/speaker-<roll>.png (gitignored originals). cut_speaker.py makes the web file.
"""
import base64, json, os, subprocess, sys, threading, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'bench', 'assets', 'drift-player', 'gen')
PROMPT = ' '.join('''
A single car-audio speaker (a 6.5 inch component woofer) photographed perfectly straight-on from the front
(orthographic, no perspective, no tilt), centered, the whole round speaker inside the frame with a transparent margin.
From the outside in: a thin dark gunmetal trim ring with six small dark hex screws, worn and lightly scratched; a glossy
black rubber surround (the roll) catching a soft highlight on its upper-left curve; a deep violet-purple woven cone
(#3d0b70 to #8a2be2, fine carbon-like weave texture, faint concentric ribs); a domed black dust cap with a soft
specular highlight upper left. Japanese drift-car audio style, dark, premium, a little worn. One soft key light from
the upper left. NO text, no letters, no logos, no brand marks anywhere. Ultra sharp product photography, high detail.
Every pixel outside the speaker is fully transparent (alpha zero): no background, no cast shadow, no glow.
'''.split())

def gen(roll):
    key = os.environ.get('OPENAI_API_KEY') or subprocess.run(
        ['powershell', '-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('OPENAI_API_KEY','User')"],
        capture_output=True, text=True).stdout.strip()
    body = json.dumps({'model': 'gpt-image-1', 'prompt': PROMPT, 'size': '1024x1024', 'quality': 'high',
                       'background': 'transparent', 'n': 1}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', body,
                                 {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    try:
        d = json.load(urllib.request.urlopen(req, timeout=300))
        path = os.path.join(OUT, f'speaker-{roll}.png')
        open(path, 'wb').write(base64.b64decode(d['data'][0]['b64_json']))
        print('saved', path, flush=True)
    except Exception as e:
        print('FAILED', roll, getattr(e, 'read', lambda: b'')()[:400] or e, flush=True)

os.makedirs(OUT, exist_ok=True)
ts = [threading.Thread(target=gen, args=(r,)) for r in (sys.argv[1:] or ['1', '2', '3'])]
for t in ts: t.start()
for t in ts: t.join()
