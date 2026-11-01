"""GAS 2 radio: "Play me" EMBROIDERED into the plate's own grille cloth (Dan 2026-10-26: the SVG stitches "look like CSS ...
make it much more fine ... create an asset ... the same box ... glued together"). A masked gpt-image EDIT of img/radio-lit.webp:
the mask opens only the grille cloth, then compose() lays back ONLY the pixels the stitching changed (a diff mask, dilated +
feathered), so the radio, keys, knobs, dial and every coordinate in radio.css stay pixel-identical. The off plate gets the
same patch through the off/lit ratio of the old plates (the dial lamp's spill), so both states match.
Usage: python player/tools/gen_stitch.py gen [n]       -> img/gen/stitch-<i>.png (gitignored) + img/gen/stitch-sheet.png
       python player/tools/gen_stitch.py compose <i> [--tan]   -> img/radio-lit.webp + img/radio-off.webp, built from the
           plain plates of BASE_REV; the thread is recoloured WHITE (Dan 2026-10-26: "make it white") unless --tan"""
import base64, json, os, subprocess, sys, urllib.request, uuid
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
PLAYER = os.path.dirname(HERE)
IMG = os.path.join(PLAYER, 'img')
GEN = os.path.join(IMG, 'gen')
BASE_REV = 'ec4504e'                   # the last commit whose plates have a plain grille (compose always starts from it)
W, H = 1368, 820                       # the plate, px (radio.css 1u = 1 px of it)
S = 1536 / W                           # plate -> model px
GRILLE = (290, 158, 1085, 400)         # the cloth inside its frame (262..1112 x 148..408) minus a margin, plate px
PROMPT = ("Edit this exact photograph of a vintage 1950s tube radio. On its woven speaker grille cloth, embroider the "
          "words \"Play me\" in a flowing retro script logo, like the Marshall amplifier script, centred on the cloth and "
          "rising slightly to the right. The letters are sewn INTO the grille cloth at the factory with fine ivory cream "
          "thread: delicate, tight, very fine satin stitching that follows each stroke, tiny thread sheen, the stitches "
          "sink into the weave and the cloth texture shows right up to the letter edges, a barely visible soft shadow "
          "under the thread. Subtle and elegant, one piece with the radio: not a patch, not a sticker, no outline, no "
          "border, no badge. Same warm dusk light from the upper right, same colours and film grain. Change nothing else: "
          "keep the wooden cabinet, brass trim, knobs, dial glass, keys and the wall exactly as they are.")


def key():
    """the website clone's local key file first: the shell's OPENAI_API_KEY on Dan's Mac is stale (401, handoff 2026-10-23)"""
    top =subprocess.run(['git', '-C', HERE, 'rev-parse', '--path-format=absolute', '--git-common-dir'],
                         capture_output=True, text=True).stdout.strip()
    for root in (os.path.dirname(top), subprocess.run(['git', '-C', HERE, 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip()):
        p = os.path.join(root, 'tools', '.openai_key.local')   # the website clone's local key file (gitignored)
        if os.path.exists(p):
            return open(p).read().strip()
    return os.environ.get('OPENAI_API_KEY') or sys.exit('no OpenAI key')


def plate(name):
    """the plain plate as committed at BASE_REV, so compose() never stacks a patch on a patched plate"""
    rel = os.path.relpath(os.path.join(IMG, name + '.webp'), subprocess.run(['git', '-C', HERE, 'rev-parse', '--show-toplevel'],
                          capture_output=True, text=True).stdout.strip())
    tmp = os.path.join(GEN, '_base-' + name + '.webp')
    os.makedirs(GEN, exist_ok=True)
    open(tmp, 'wb').write(subprocess.run(['git', '-C', HERE, 'show', BASE_REV + ':' + rel], capture_output=True, check=True).stdout)
    return np.asarray(Image.open(tmp).convert('RGB')).astype(np.float32)


def gen(n):
    lit = Image.fromarray(plate('radio-lit').astype(np.uint8))
    h = round(H * S)                                   # 921: the plate scaled to 1536 wide, the rest = its bottom mirrored
    big = lit.resize((1536, h), Image.LANCZOS)
    canvas = Image.new('RGB', (1536, 1024))
    canvas.paste(big, (0, 0))
    canvas.paste(big.crop((0, h - (1024 - h), 1536, h)).transpose(Image.FLIP_TOP_BOTTOM), (0, h))
    src = os.path.join(GEN, '_stitch-src.png'); msk = os.path.join(GEN, '_stitch-mask.png')
    canvas.save(src)
    m = Image.new('RGBA', (1536, 1024), (0, 0, 0, 255))
    m.paste((0, 0, 0, 0), tuple(round(v * S) for v in GRILLE))   # transparent = repaint
    m.save(msk)
    b = uuid.uuid4().hex
    parts = []
    model = os.environ.get('GEN_MODEL', 'gpt-image-2')   # gpt-image-1 is gone on this key (2026-10-26: "does not exist")
    fields = {'model': model, 'prompt': PROMPT, 'size': '1536x1024', 'quality': 'high', 'n': str(n)}
    if model == 'gpt-image-1':
        fields['input_fidelity'] = 'high'
    for k, v in fields.items():
        parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for name, path in (('image', src), ('mask', msk)):
        parts += [f'--{b}\r\nContent-Disposition: form-data; name="{name}"; filename="{os.path.basename(path)}"\r\nContent-Type: image/png\r\n\r\n'.encode(),
                  open(path, 'rb').read(), b'\r\n']
    parts.append(f'--{b}--\r\n'.encode())
    req = urllib.request.Request('https://api.openai.com/v1/images/edits', data=b''.join(parts),
                                 headers={'Authorization': f'Bearer {key()}', 'Content-Type': f'multipart/form-data; boundary={b}'})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            d = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f'{e.code}: {e.read().decode()[:600]}')
    outs = []
    for i, it in enumerate(d['data'], 1):
        p = os.path.join(GEN, f'stitch-{i}.png'); open(p, 'wb').write(base64.b64decode(it['b64_json'])); outs.append(p)
        print(p)
    print('usage:', json.dumps(d.get('usage', {})))
    # a sheet of the grille crops, plate scale, for picking
    x0, y0, x1, y1 = (round(v * S) for v in (230, 120, 1140, 430))
    tiles = [Image.open(p).convert('RGB').crop((x0, y0, x1, y1)) for p in outs]
    sheet = Image.new('RGB', (tiles[0].width, sum(t.height + 8 for t in tiles)), (20, 14, 10))
    y = 0
    for t in tiles:
        sheet.paste(t, (0, y)); y += t.height + 8
    sheet.save(os.path.join(GEN, 'stitch-sheet.png'))


def whiten(a, region):
    """the take's tan thread -> warm white thread, same stitches. The letters = the thread blurred 2.5 px (stitches + their
    grooves merge into strokes) standing 14+ above the cloth blurred 14 px (the weave's own highlights are too small to
    survive the blur: cloth max 9); inside, each pixel's light maps groove-shade -> white (never pure #fff)"""
    L = a @ np.array([.3, .59, .11], np.float32)
    blur = lambda x, r: np.asarray(Image.fromarray(x.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)
    seed = ((blur(L, 2.5) - blur(L, 14) > 14) & (region > .2)).astype(np.uint8) * 255
    let = Image.fromarray(seed).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1))
    al = (np.asarray(let).astype(np.float32) / 255)[..., None]
    hi = np.percentile(L[al[..., 0] > .9], 97)
    rel = np.clip((L - 30) / (hi - 30), 0, 1)[..., None] ** .85
    shade, wh = np.array([88, 80, 70], np.float32), np.array([247, 242, 232], np.float32)
    return a * (1 - al) + (shade + (wh - shade) * rel) * al


def compose(i, white=True):
    lit, off = plate('radio-lit'), plate('radio-off')
    out = Image.open(os.path.join(GEN, f'stitch-{i}.png')).convert('RGB')
    new = np.asarray(out.crop((0, 0, 1536, round(H * S))).resize((W, H), Image.LANCZOS)).astype(np.float32)
    # where the stitching is: the luminance difference, smoothed, over a threshold, grown to take the thread's shadow
    dl = np.abs((new - lit) @ np.array([.3, .59, .11], np.float32))
    dm = np.asarray(Image.fromarray(np.clip(dl * 4, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32)
    m = Image.fromarray(((dm > 4 * 22) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(2.5))
    box = Image.new('L', (W, H), 0); box.paste(255, GRILLE)
    m = np.asarray(m).astype(np.float32) / 255 * np.asarray(box.filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
    m = m[..., None]
    if white:
        new = whiten(new, m[..., 0])
    lit2 = lit * (1 - m) + new * m
    ratio = np.stack([np.asarray(Image.fromarray(np.clip((off[..., c] + 1) / (lit[..., c] + 1) * 128, 0, 255).astype(np.uint8))
                                 .filter(ImageFilter.GaussianBlur(20))).astype(np.float32) / 128 for c in range(3)], -1)
    off2 = off * (1 - m) + new * np.clip(ratio, .6, 1.2) * m
    Image.fromarray((m[..., 0] * 255).astype(np.uint8)).save(os.path.join(GEN, f'_stitch-{i}-mask-used.png'))
    for name, arr in (('radio-lit', lit2), ('radio-off', off2)):
        im = Image.fromarray(np.clip(arr, 3, 252).astype(np.uint8))   # no pure #000 / #fff
        im.save(os.path.join(IMG, name + '.webp'), quality=86, method=6)
        print(name, im.size, os.path.getsize(os.path.join(IMG, name + '.webp')), 'bytes; patched px:', int((m[..., 0] > .5).sum()))


if __name__ == '__main__':
    if sys.argv[1:2] == ['gen']:
        gen(int(sys.argv[2]) if len(sys.argv) > 2 else 3)
    elif sys.argv[1:2] == ['compose']:
        compose(int(sys.argv[2]), white='--tan' not in sys.argv)
    else:
        print(__doc__)
