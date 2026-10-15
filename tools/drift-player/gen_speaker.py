"""#hear speakers: generate the speaker-pod art with gpt-image-1 (text-only prompts, never RevAudio art uploaded, no lettering).

  python tools/drift-player/gen_speaker.py right:1 right:2 left:1 ...      (OPENAI_API_KEY from the User env)

Round 2 (Yoni 2026-10-15: the CSS-built 3D "looks unrealistic"): a photographed speaker POD already at the angle the
page needs, hung high and aimed down at the player. 'right' = the pod faces down and to the RIGHT (the LEFT speaker on
the page); 'left' = faces down and to the LEFT (the RIGHT speaker). Light from the upper left in both.
Writes bench/assets/drift-player/gen/pod-<dir>-<roll>.png (gitignored originals).
"""
import base64, json, os, subprocess, sys, threading, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'bench', 'assets', 'drift-player', 'gen')

def prompt(d):
    other = 'left' if d == 'right' else 'right'
    return ' '.join(f'''
A single car-audio speaker pod, photographed as a premium product shot, centered, the whole object inside the frame
with a transparent margin on every side. The pod is a short round cylindrical enclosure (as deep as a third of its
width) in dark textured black-violet metal with a worn gunmetal front trim ring and six small dark hex screws, holding
a 6.5 inch woofer: glossy black rubber surround, a deep violet-purple woven cone (#3d0b70 to #8a2be2), a domed black
dust cap. It hangs from a short dark steel mounting bracket that comes down from the top edge of the frame to the
pod's upper back. THREE-QUARTER VIEW: the speaker is aimed DOWN and to the {d.upper()}, as if hung high above a stage
and pointed at a panel below it on the {d} side: its round front face appears as a tilted ellipse turned toward the
lower {d}, and the cylinder's side wall is visible on the upper {other} of the pod. Japanese drift-car audio style,
dark, premium, a little worn (scratches, scuffs on the trim). One soft key light from the upper left, a faint violet
rim light. NO text, no letters, no logos, no brand marks. Ultra sharp, photorealistic, high detail. Every pixel
outside the object is fully transparent (alpha zero): no background, no floor, no cast shadow, no glow.
'''.split())

def gen(job):
    d, _, roll = job.partition(':')
    key = os.environ.get('OPENAI_API_KEY') or subprocess.run(
        ['powershell', '-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('OPENAI_API_KEY','User')"],
        capture_output=True, text=True).stdout.strip()
    body = json.dumps({'model': 'gpt-image-1', 'prompt': prompt(d), 'size': '1024x1024', 'quality': 'high',
                       'background': 'transparent', 'n': 1}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', body,
                                 {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=300))
        path = os.path.join(OUT, f'pod-{d}-{roll or 1}.png')
        open(path, 'wb').write(base64.b64decode(r['data'][0]['b64_json']))
        print('saved', path, flush=True)
    except Exception as e:
        print('FAILED', job, getattr(e, 'read', lambda: b'')()[:400] or e, flush=True)

os.makedirs(OUT, exist_ok=True)
jobs = sys.argv[1:] or ['right:1', 'right:2', 'right:3', 'right:4', 'left:1', 'left:2', 'left:3', 'left:4']
ts = [threading.Thread(target=gen, args=(j,)) for j in jobs]
for t in ts: t.start()
for t in ts: t.join()
