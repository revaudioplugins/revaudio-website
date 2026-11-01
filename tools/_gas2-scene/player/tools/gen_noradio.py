"""GAS 2 radio: the scene frame WITHOUT the photo's own radio, only where the live radio no longer covers it (Yoni
2026-10-23: the radio 20 % smaller, so the photo radio's top would peek out above it). A masked gpt-image EDIT of
frames/f6-v17.png (Dan's frame, read only): the mask opens the old radio's body (frame x 70..322, y 522..690), the rest
is kept. Output: img/gen/scene-noradio.png (gitignored); noradio_patch() in bench_patch.py cuts the used piece.
Usage: python player/tools/gen_noradio.py [--force]"""
import base64, json, os, sys, urllib.request, uuid
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SCENE = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(os.path.dirname(HERE), 'img', 'gen', 'scene-noradio.png')
BOX = (52, 515, 349, 796)   # round 2: the radio, its shadow AND the bench (bench_patch.py lays the lowered bench back)
PROMPT = ("Edit this exact photograph. Remove the vintage radio AND the small dark iron bench it stands on, at the "
          "lower left, in front of the shop window. Where they were, show what is behind them: the bottom of the shop "
          "window with its dark wooden frame and sill, the warm-lit shelves of bottles inside, the cracked cream stucco "
          "wall below the window down to the worn concrete porch floor, continuing exactly the lines, colours, dusk "
          "light and film grain around it. Nothing stands there. Change nothing else. No text, letters or logos.")


def key():
    k = os.environ.get('OPENAI_API_KEY')
    if not k and os.name == 'nt':
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, 'Environment') as h:
            k = winreg.QueryValueEx(h, 'OPENAI_API_KEY')[0]
    return k


def main():
    if os.path.exists(OUT) and '--force' not in sys.argv:
        print('exists:', OUT); return
    tmp = os.path.join(os.path.dirname(OUT), '_noradio')
    os.makedirs(tmp, exist_ok=True)
    img = os.path.join(tmp, 'frame.png'); msk = os.path.join(tmp, 'mask.png')
    Image.open(os.path.join(SCENE, 'frames', 'f6-v17.png')).convert('RGBA').save(img)
    m = Image.new('RGBA', (1536, 1024), (0, 0, 0, 255))
    m.paste((0, 0, 0, 0), BOX)                      # transparent = repaint
    m.save(msk)
    b = uuid.uuid4().hex
    parts = []
    for k, v in {'model': 'gpt-image-1', 'prompt': PROMPT, 'size': '1536x1024', 'quality': 'high', 'input_fidelity': 'high'}.items():
        parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for name, path in (('image', img), ('mask', msk)):
        parts += [f'--{b}\r\nContent-Disposition: form-data; name="{name}"; filename="{os.path.basename(path)}"\r\nContent-Type: image/png\r\n\r\n'.encode(),
                  open(path, 'rb').read(), b'\r\n']
    parts.append(f'--{b}--\r\n'.encode())
    req = urllib.request.Request('https://api.openai.com/v1/images/edits', data=b''.join(parts),
                                 headers={'Authorization': f'Bearer {key()}', 'Content-Type': f'multipart/form-data; boundary={b}'})
    with urllib.request.urlopen(req, timeout=400) as r:
        d = json.load(r)
    open(OUT, 'wb').write(base64.b64decode(d['data'][0]['b64_json']))
    print(OUT, os.path.getsize(OUT), 'bytes')


if __name__ == '__main__':
    main()
