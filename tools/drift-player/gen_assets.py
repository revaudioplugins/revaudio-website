"""DRIFT Turbo Dash player: generate the toy's parts with gpt-image-1 (text-only prompts, never RevAudio art uploaded).

  python tools/drift-player/gen_assets.py [part ...]      (no args = every part; OPENAI_API_KEY from the User env)

Writes bench/assets/drift-player/gen/<part>-<n>.png (gitignored originals). NO lettering in any image: every word on
the toy is live HTML. Materials follow the /drift page: worn violet-black painted metal, carbon fibre, purple
metal-flake drift-car paint, dark gunmetal X-head screws, one soft key light upper-left.
"""
import base64, json, os, subprocess, sys, threading, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'bench', 'assets', 'drift-player', 'gen')
COMMON = ('Premium product photography, ultra sharp, high detail, no blur, no grain. One soft key light from the upper '
          'left. NO text, no letters, no numbers, no logos, no decals with writing. Every pixel outside the object is '
          'fully transparent (alpha zero): no background surface, no cast shadow on the ground, no vignette.')
PARTS = {
    'shell': ('1536x1024', '''
A 1980s Japanese tabletop racing-game toy dashboard console (the kind with a steering wheel and a little screen),
re-made as a premium drift-racing collector piece, photographed perfectly straight-on from the front (orthographic,
no perspective), centered, the whole object inside the frame with an empty transparent margin on every side.
Silhouette: wide, about 1.45 times as wide as tall. The upper two thirds is a big flat dashboard fascia with softly
rounded corners and two low rounded pods sitting on its top edge, one above each upper corner. The fascia is worn
violet-black painted metal (#120a1a to #1f1029) with fine scratches, scuffs and edge wear showing darker bare metal,
a faint magenta tint in the grime, and a narrow carbon-fibre weave band running along its top edge. The lower third
is a chunky moulded base tub that sticks out wider than the fascia, painted deep purple metal-flake candy paint like
a drift car (#3a0d63 to #8a2be2 with fine sparkle), glossy clear coat with small chips and scratches, a thick rounded
front lip catching a long highlight. On the base's right end a WIDE squared-off shifter console rises as high as the
middle of the fascia; it is about one fifth of the whole object's width and nearly square from the front, painted the
same purple candy paint, its front face flat and empty.
The fascia face and the plinth face are EMPTY flat surfaces: no openings, no gauges, no screen, no steering wheel, no
buttons, no knobs, no switches, no vents. A thin violet neon rim light grazes the outer edges from behind.
''' + COMMON),
    'plate': ('1024x1024', '''
A square machined shifter base plate for a drift car's open gated shifter, photographed perfectly from directly
above (orthographic top view), centered, filling about 88% of the frame. Thick worn violet-black anodised aluminium
(#140b1c to #231331), softly rounded corners, a crisp chamfered edge catching a thin cool highlight on the top and
left, fine circular machining marks, light scratches and scuffs. Four dark gunmetal X-head screws, one near each
corner, each turned to a different angle. The middle of the plate is completely flat and EMPTY (no slots, no gate,
no holes): a gate pattern will be cut into it later.
''' + COMMON),
    'knob': ('1024x1024', '''
A drift car's gear shift knob photographed from directly above (orthographic top view), centered, the knob filling
about 70% of the frame. A round polished-and-anodised aluminium ball knob in deep violet-purple (#5c1796 to #b46bff),
a bright soft specular highlight upper-left, a dark knurled grip ring around its widest part, a thin black rubber ring
where it would meet the shaft. The flat top face is clean and EMPTY (no engraved shift pattern, no numbers). It reads
clearly as a sphere sticking up toward the camera.
''' + COMMON),
    'horn': ('1024x1024', '''
The round horn button of a racing steering wheel, photographed perfectly front-on (orthographic), centered, filling
about 80% of the frame. A thick matte black rubber pad with a slightly domed face, a thin brushed gunmetal trim ring
around it with six small dark hex screws evenly spaced, soft wear on the rubber where a thumb presses. The face of
the pad is EMPTY (no logo, no emblem, no horn icon) so a printed badge can be added later.
''' + COMMON),
    'volknob': ('1024x1024', '''
A rotary control knob for a car audio head unit, photographed from directly in front (orthographic, looking straight
at its face), centered, filling about 80% of the frame. Dark gunmetal body with a deep coarse knurled grip on its
side wall, a slightly domed brushed violet-purple aluminium cap in the middle. FLAT EVEN LIGHT with no directional
highlight (it will rotate). No pointer line, no marker, no dot, no indicator of any kind.
'''.replace('One soft key light from the upper left. ', '') + COMMON.replace('One soft key light from the upper left. ', '')),
}

def gen(part, n):
    size, prompt = PARTS[part]
    key = os.environ.get('OPENAI_API_KEY') or subprocess.run(
        ['powershell', '-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('OPENAI_API_KEY','User')"],
        capture_output=True, text=True).stdout.strip()
    body = json.dumps({'model': 'gpt-image-1', 'prompt': ' '.join(prompt.split()), 'size': size, 'quality': 'high',
                       'background': 'transparent', 'n': 1}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/images/generations', body,
                                 {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    try:
        d = json.load(urllib.request.urlopen(req, timeout=300))
        path = os.path.join(OUT, f'{part}-{n}.png')
        open(path, 'wb').write(base64.b64decode(d['data'][0]['b64_json']))
        print('saved', path, flush=True)
    except Exception as e:
        print('FAILED', part, n, getattr(e, 'read', lambda: b'')()[:400] or e, flush=True)

os.makedirs(OUT, exist_ok=True)
parts = sys.argv[1:] or list(PARTS)
jobs = []
for p in parts:
    name, _, n = p.partition(':')          # "shell:2" = roll 2
    t = threading.Thread(target=gen, args=(name, n or '1')); t.start(); jobs.append(t)
for t in jobs: t.join()
