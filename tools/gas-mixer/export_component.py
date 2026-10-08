"""Export the GAS Mixer bench as a native web component for revaudio.net: public/gas-mixer/.

Same route as tools/station-mixer/export_component.py (read its header for the why: the live site blocks framing and
serves fonts only from itself). Output, all served from revaudio.net:
  gas-mixer.js       <gas-mixer> custom element: shadow DOM, built only when it scrolls near the viewport, audio only
                     on PLAY. Generated from bench/gas-mixer-bench.html, so the bench stays the single source.
  fonts.css + fonts/ Permanent Marker, Gochi Hand, Cinzel 700, Oswald 500/600 (latin woff2). Inter, VT323 and
                     Oswald 400 come from the site's own fonts.css.
  audio/*.m4a        AAC 160k, each file = the loop + half a bar of padding both sides (taken from the loop itself);
                     the player loops the window inside, so encoder priming can never click at the loop point.
  audio/peaks.json   the waveform lanes (loads before PLAY, 53 KB).
  img/               the bench images, resized to 2x their largest display size; the big GAS plugin PNGs become WebP.
Usage: python tools/gas-mixer/export_component.py"""
import json, os, re, subprocess, urllib.request
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BENCH = os.path.join(ROOT, 'bench')
SRC = os.path.join(BENCH, 'assets', 'gas-mixer')
OUT = os.path.join(ROOT, 'public', 'gas-mixer')
URL = '/gas-mixer/'
man = json.load(open(os.path.join(SRC, 'audio', 'manifest.json')))
SR, L = man['sr'], man['samples']
PAD = L // man['bars'] // 2                   # half a bar

html = open(os.path.join(BENCH, 'gas-mixer-bench.html'), encoding='utf-8').read().replace('\r\n', '\n')
css = re.search(r'<style>(.*?)</style>', html, re.S).group(1)
body = re.search(r'<body>(.*?)<script>', html, re.S).group(1)
script = re.search(r'<script>\s*(.*?)</script>\s*</body>', html, re.S).group(1)

def sub(s, a, b, count=None):
    assert a in s, a[:80]
    return s.replace(a, b) if count is None else s.replace(a, b, count)

# ---- images: name -> (output name, max width in px). Display sizes x2 (the rows show the knob at .3647 scale) ----
IMGS = {
    'dash-walnut.png':                   ('dash-walnut.webp', 1240),
    'ring-tank.png':                     ('ring-tank.webp', 256),
    'threshold-mount-v9.png':            ('threshold-mount-v9.webp', 160),
    'knob-skirt.png':                    ('knob-skirt.webp', 128),
    'knob-skirtshade.png':               ('knob-skirtshade.webp', 128),
    'knob-dome-base.png':                ('knob-dome-base.webp', 128),
    'knob-dome-spin.png':                ('knob-dome-spin.webp', 128),
    'knob-dome-shade.png':               ('knob-dome-shade.webp', 128),
    'knob-dome-shine.png':               ('knob-dome-shine.webp', 128),
    'mix-knob-photo-oai-body-v1.png':    ('mix-knob-body.webp', 128),
    'mix-knob-photo-oai-ringflat-v1.png': ('mix-knob-ringflat.webp', 128),
    'mix-knob-photo-oai-ringlight-v1.png': ('mix-knob-ringlight.webp', 128),
    'mode-btn-cut.png':                  ('mode-btn-cut.webp', 192),
    'rl-arm-plate.png':                  ('rl-arm-plate.webp', 128),
    'start-button.png':                  ('start-button.webp', 208),
    'sl-paper.png':                      ('sl-paper.webp', 472),
    'tag-blank.png':                     ('tag-blank.webp', 320),
    'fuel-gauge.png':                    ('fuel-gauge.webp', 340),
}
def reimg(t):
    t = t.replace('assets/gas-mixer/img/', URL + 'img/')
    for a, (b, _) in IMGS.items():
        t = t.replace(URL + 'img/' + a, URL + 'img/' + b)
    return t

# ---- CSS: page selectors -> :host ----
css = sub(css, ':root{', ':host{', 1)
css = sub(css, "html,body{background:var(--page);color:var(--ink);font-family:Inter,'Segoe UI',Arial,sans-serif}",
          ":host{display:block;color:var(--ink);font-family:Inter,'Segoe UI',Arial,sans-serif}")
css = sub(css, 'body{min-height:100vh;padding:28px 16px 60px}', '')
css = re.sub(r'body(\.[\w-]+|:not\(\.[\w-]+\))', lambda m: f':host({m.group(1)})', css)
assert not re.search(r'(^|[}\s,])body[\s.:{,]', re.sub(r'/\*.*?\*/', '', css, flags=re.S)), 'a body selector survived'
css = reimg(css)

# ---- markup ----
body = re.sub(r'<div class="benchhead">.*?</div>', '', body, count=1, flags=re.S)
body = sub(body, '<p class="note" id="note"></p>', '')
body = reimg(body)

# ---- script: document -> shadow root, audio -> padded m4a ----
s = script
s = sub(s, "const $ = s => document.querySelector(s);", "const $ = s => root.querySelector(s);")
s = s.replace('document.querySelectorAll(', 'root.querySelectorAll(').replace('document.querySelector(', 'root.querySelector(')
s = s.replace('document.body.classList', 'host.classList')
s = s.replace('document.addEventListener(', 'root.addEventListener(')
s = sub(s, "const IMG = 'assets/gas-mixer/img/', AUD = 'assets/gas-mixer/audio/';",
        f"const IMG = '{URL}img/', AUD = '{URL}audio/', PADS = {PAD}/{SR};   // loop window inside the padded file")
s = reimg(s)
s = sub(s, "const r=await fetch(AUD+n+'.flac');", "const r=await fetch(AUD+n+'.m4a');")
s = sub(s, "src.loop=true; src.loopStart=0; src.loopEnd=LOOP; src.connect(nodes.stems[i].vers[v]); src.start(t0);",
        "src.loop=true; src.loopStart=PADS; src.loopEnd=PADS+LOOP; src.connect(nodes.stems[i].vers[v]); src.start(t0, PADS);")
# image names built at runtime in the track template
for a, (b, _) in IMGS.items():
    s = s.replace('${IMG}' + a, '${IMG}' + b)
assert not re.search(r'(\$\{IMG\}|/gas-mixer/img/)[\w.-]+\.png', s), 'a png path survived in the script'
# fonts load lazily inside the component: wait for the ones the notes / plates / LCD measure with
s = sub(s, "(document.fonts ? document.fonts.ready : Promise.resolve())",
        "(document.fonts ? Promise.all(['17px \"Gochi Hand\"','19px \"Permanent Marker\"','700 16px Cinzel','27px VT323','500 11px Oswald','600 14px Oswald'].map(f => document.fonts.load(f).catch(() => null))).then(() => document.fonts.ready) : Promise.resolve())")
# the bench-only levels note; LOOP is exact from the export instead
s = re.sub(r"fetch\(AUD\+'manifest\.json'\).*?\.catch\(\(\)=>\{\}\);\n", '', s, flags=re.S)
s = sub(s, "let LOOP = 1316571 / SR, BAR = LOOP / BARS;        // corrected from manifest.json",
        f"let LOOP = {L} / SR, BAR = LOOP / BARS;")
assert "AUD+'manifest.json'" not in s and 'document.query' not in s and 'document.body' not in s

js = f"""/* GAS Mixer: <gas-mixer> web component.
   GENERATED by tools/gas-mixer/export_component.py from bench/gas-mixer-bench.html. Edit the bench, re-export. */
(() => {{
const CSS = {json.dumps(css)};
const HTML = {json.dumps(body)};
class GasMixer extends HTMLElement {{
  connectedCallback() {{
    if (this._armed) return; this._armed = true;
    // build only when it comes near the viewport: its images never slow the page's first paint
    const io = new IntersectionObserver(es => {{ if (es.some(e => e.isIntersecting)) {{ io.disconnect(); this.build(); }} }}, {{ rootMargin: '800px 0px' }});
    io.observe(this);
  }}
  build() {{
    const host = this, root = this.attachShadow({{ mode: 'open' }});
    root.innerHTML = `<style>${{CSS}}</style>` + HTML;
    host.classList.add('ready');
{s}
  }}
}}
customElements.define('gas-mixer', GasMixer);
}})();
"""

# ---- write ----
for d in ('audio', 'img', 'fonts'):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)
for dp, _, fns in os.walk(OUT):               # generated folder: clear our own files (Windows desktop.ini stays)
    for fn in fns:
        if fn.lower() != 'desktop.ini':
            os.remove(os.path.join(dp, fn))
open(os.path.join(OUT, 'gas-mixer.js'), 'w', encoding='utf-8').write(js)

used = set(re.findall(r'/gas-mixer/img/([\w.-]+)', css + body + s)) | set(re.findall(r'\$\{IMG\}([\w.-]+)', s))
for a, (b, w) in IMGS.items():
    if b not in used:
        continue
    im = Image.open(os.path.join(SRC, 'img', a)).convert('RGBA')
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    if a == 'dash-walnut.png':
        im.convert('RGB').save(os.path.join(OUT, 'img', b), 'WEBP', quality=82, method=6)
    else:
        im.save(os.path.join(OUT, 'img', b), 'WEBP', quality=88, method=6)
missing = used - {b for b, _ in IMGS.values()}
assert not missing, f'images referenced but not exported: {missing}'

# fonts: latin woff2 from Google Fonts, served from the site
fams = {'Permanent Marker': 'Permanent+Marker', 'Gochi Hand': 'Gochi+Hand', 'Cinzel': 'Cinzel:wght@700', 'Oswald': 'Oswald:wght@500;600'}
ua = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'}
faces = []
for fam, q in fams.items():
    cssg = urllib.request.urlopen(urllib.request.Request(f'https://fonts.googleapis.com/css2?family={q}&display=swap', headers=ua)).read().decode()
    for subset, blk in re.findall(r'/\* (\S+) \*/\s*@font-face \{(.*?)\}', cssg, re.S):
        if subset != 'latin':
            continue
        weight = re.search(r'font-weight: (\d+)', blk).group(1)
        url = re.search(r'url\((https://[^)]+\.woff2)\)', blk).group(1)
        name = f"{fam.lower().replace(' ', '-')}-{weight}-latin.woff2"
        if not os.path.exists(os.path.join(OUT, 'fonts', name)):
            open(os.path.join(OUT, 'fonts', name), 'wb').write(urllib.request.urlopen(urllib.request.Request(url, headers=ua)).read())
        urange = re.search(r'unicode-range: ([^;]+);', blk).group(1)
        faces.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{weight};font-display:swap;"
                     f"src:url('{URL}fonts/{name}') format('woff2');unicode-range:{urange}}}")
open(os.path.join(OUT, 'fonts.css'), 'w', encoding='utf-8').write(
    '/* GAS Mixer fonts (latin, self-hosted: the live CSP is font-src self). Generated by export_component.py */\n' + '\n'.join(faces) + '\n')

# audio: loop + half a bar each side, AAC 160k
n = 0
for f in sorted(os.listdir(os.path.join(SRC, 'audio'))):
    if not f.endswith('.flac'):
        continue
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(SRC, 'audio', f), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
    assert len(x) == L, (f, len(x))
    padded = np.concatenate([x[-PAD:], x, x[:PAD]])
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', os.path.join(OUT, 'audio', f[:-5] + '.m4a')],
                   input=padded.astype(np.float32).tobytes(), check=True)
    n += 1
with open(os.path.join(SRC, 'audio', 'peaks.json'), 'rb') as a, open(os.path.join(OUT, 'audio', 'peaks.json'), 'wb') as b:
    b.write(a.read())

size = sum(os.path.getsize(os.path.join(dp, fn)) for dp, _, fns in os.walk(OUT) for fn in fns if fn.lower() != 'desktop.ini')
img = sum(os.path.getsize(os.path.join(OUT, 'img', fn)) for fn in os.listdir(os.path.join(OUT, 'img')) if fn.endswith('.webp'))
print(f'exported {OUT}: {n} m4a, {len(used)} images ({img/1e3:.0f} KB), {len(faces)} font faces, {size/1e6:.1f} MB total')
