"""GAS 2 radio player: the close-up photograph, via OpenAI image EDIT with the scene's own radio as the reference
(so the close-up IS the radio on the station's bench, design-language Law 2: a scene is ONE photograph).
Refs (made here from frames/f6-v17.png, gitignored): tools/ref-radio.png (the radio + bench, 3x) + ref-scene.png.
Picked: radio-c (2026-10-22, Yoni's session; a = small keys, b = darker cabinet). Next: process_art.py.
Output: player/img/gen/<slug>.png. Key: OPENAI_API_KEY (process or Windows User env).
Usage: python player/tools/gen_art.py [slug ...] [--force]   (no slugs = all)   env GEN_MODEL (default gpt-image-1)"""
import base64, json, os, sys, time, urllib.error, urllib.request, uuid

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'img', 'gen')
os.makedirs(OUT, exist_ok=True)


def _key():
    k = os.environ.get('OPENAI_API_KEY')
    if not k and os.name == 'nt':
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, 'Environment') as h:
            k = winreg.QueryValueEx(h, 'OPENAI_API_KEY')[0]
    return k


KEY = _key()

PHOTO = ("A real photograph, not a 3D render and not an illustration: shot on Kodak Portra 800 film, 50 mm lens at f/2.8, "
         "natural film grain, slight halation round the glowing dial, true-to-life colour, deep shadows that keep detail "
         "(never pure black, never pure white). ")
RADIO = ("The SAME vintage 1950s tube radio as in the first reference image: the same walnut-and-brass cabinet with the "
         "rounded brass frame, the same woven tan grille cloth across the top half, the same long horizontal glowing dial "
         "window across the lower front between the SAME two round brass knobs (one left, one right), on the same dark "
         "iron bench against the same cracked stucco wall, at the same desert dusk with the warm shop window behind. ")
DIAL = ("The dial window is a long clean glass strip lit warm amber from inside, its face is BLANK: no numbers, no "
        "letters, no scale marks, only a thin dark red vertical pointer near the left. ")
KEYS = ("Directly BELOW the dial window, centred on the brass bottom rail, a row of exactly TWO wide ivory bakelite piano "
        "keys side by side (1950s radio band keys), both BLANK, each about twice as wide as tall, fingertip-polished, "
        "sitting in a dark slot. ")
CAM = ("Close-up: camera at the radio's height, perfectly straight-on, the radio fills about 78% of the frame width and "
       "sits centred, a little wall and bench around it. One soft warm key light from the upper-left (the porch lamp), the "
       "dial is the second light and spills warm amber onto the brass and the bench. Seventy years old: worn varnish on the "
       "corners, rubbed brass, dust in the grille. Strict: no text, letters, numbers or logos anywhere. ")

PROMPTS = {
    'radio-a': (PHOTO + RADIO + DIAL + KEYS + CAM),
    'radio-b': (PHOTO + RADIO + DIAL + KEYS + CAM + "Slightly lower camera, a touch more of the bench and the warm "
                "window glow behind the radio's top edge."),
    # take A's radio was the match but its keys were too small for the hero (~90 px wide on a laptop): big keys
    'radio-c': (PHOTO + RADIO + DIAL + KEYS.replace("each about twice as wide as tall", "LARGE: each key about one "
                "fifth of the radio's width and about 2.5 times wider than tall, the pair spanning nearly half the "
                "radio, chunky and deep like piano keys, the bottom rail made taller to hold them") + CAM),
}

# round 2 (Yoni 2026-10-23): the picked radio-c gets a 3rd key (play / stop) + a red jewel + a magic-eye tube.
# An EDIT of radio-c itself, so it stays the same photo.
R2 = ("Edit this exact photograph. Keep EVERYTHING the same: the same radio, cabinet, brass frame, grille cloth, dial "
      "window, both knobs, the bench, the wall, the window, the light, the camera, the film grain. Change ONLY these: "
      "(1) the row of ivory bakelite piano keys below the dial now has THREE keys side by side instead of two, the same "
      "style and height, all blank, the row centred; the left key is a little narrower than the other two. (2) A small "
      "round red glass jewel pilot lamp (unlit, deep red) set in the brass rail just left of the key row. (3) In the "
      "centre of the brass bar between the grille cloth and the dial, a small round 'magic eye' tuning tube window: a "
      "dark green glass disc in a thin brass bezel, about the size of a coin, unlit. Strict: no text, letters, numbers "
      "or logos anywhere.")
EDITS = {'radio-d': R2, 'radio-e': R2 + " Make the three keys slightly taller and chunkier."}


def refs():
    from PIL import Image
    im = Image.open(os.path.join(HERE, '..', '..', 'frames', 'f6-v17.png')).convert('RGB')
    W, H = im.size
    c = im.crop((int(W * .035), int(H * .49), int(W * .215), int(H * .78)))
    c.resize((c.width * 3, c.height * 3), Image.LANCZOS).save(os.path.join(HERE, 'ref-radio.png'))
    im.save(os.path.join(HERE, 'ref-scene.png'))


def multipart(fields, files):
    b = uuid.uuid4().hex
    out = []
    for k, v in fields.items():
        out += [f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()]
    for k, path in files:
        out += [f'--{b}\r\nContent-Disposition: form-data; name="{k}"; filename="{os.path.basename(path)}"\r\n'
                f'Content-Type: image/png\r\n\r\n'.encode(), open(path, 'rb').read(), b'\r\n']
    out.append(f'--{b}--\r\n'.encode())
    return b''.join(out), b


def gen(slug):
    path = os.path.join(OUT, slug + '.png')
    if os.path.exists(path) and '--force' not in sys.argv:
        return f'{slug}: exists, skipped'
    model = os.environ.get('GEN_MODEL', 'gpt-image-1')
    fields = {'model': model, 'prompt': PROMPTS.get(slug, ''), 'size': '1536x1024', 'quality': 'high'}
    if model == 'gpt-image-1':
        fields['input_fidelity'] = 'high'
    if slug in EDITS:
        fields['prompt'] = EDITS[slug]
        body, b = multipart(fields, [('image[]', os.path.join(OUT, 'radio-c.png'))])
    else:
        body, b = multipart(fields, [('image[]', os.path.join(HERE, 'ref-radio.png')),
                                     ('image[]', os.path.join(HERE, 'ref-scene.png'))])
    for attempt in range(5):   # 429 = rate limit: wait and retry; any other error: print the API's message
        req = urllib.request.Request('https://api.openai.com/v1/images/edits', data=body,
                                     headers={'Authorization': f'Bearer {KEY}', 'Content-Type': f'multipart/form-data; boundary={b}'})
        try:
            with urllib.request.urlopen(req, timeout=400) as r:
                d = json.load(r)
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode('utf-8', 'replace')[:400]
            if e.code == 429 and 'insufficient_quota' not in msg and attempt < 4:
                time.sleep(20 * (attempt + 1)); continue
            return f'{slug}: HTTP {e.code} {msg}'
    open(path, 'wb').write(base64.b64decode(d['data'][0]['b64_json']))
    return f'{slug}: {os.path.getsize(path)} bytes'


if __name__ == '__main__':
    slugs = [a for a in sys.argv[1:] if not a.startswith('--')] or list(PROMPTS) + list(EDITS)
    refs()
    for s in slugs:               # one at a time: parallel image requests hit the rate limit (429)
        print(gen(s), flush=True)
