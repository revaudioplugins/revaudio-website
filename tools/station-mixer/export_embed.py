"""Export the Station Mixer bench as an embeddable page: public/station-mixer/index.html + its audio and images.
The product page shows it in an iframe inside the garage wall (src/pages/[slug].astro, plugins.ts stationMixerUrl).
Transparent background (the wood shows through), links open in the top page, the page reports its height to the
parent. Local preview: public/station-mixer/ holds ~70 MB of FLAC, so it is excluded from git (.git/info/exclude)
until the AAC encode (plan step 3).  Usage: python tools/station-mixer/export_embed.py"""
import os, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BENCH = os.path.join(ROOT, 'bench')
SRC_ASSETS = os.path.join(BENCH, 'assets', 'station-mixer')
OUT = os.path.join(ROOT, 'public', 'station-mixer')

s = open(os.path.join(BENCH, 'station-mixer-bench.html'), encoding='utf-8').read()
def rep(a, b):
    global s
    assert a in s, a[:80]
    s = s.replace(a, b)

rep('assets/station-mixer/audio/', 'audio/')
s = s.replace('assets/station-mixer/img/', 'img/')
start = s.index('<div class="benchhead">'); end = s.index('</div>', start) + len('</div>')
s = s[:start] + s[end:]
rep('<p class="note" id="note"></p>', '')
rep('<a class="start" href=', '<a class="start" target="_top" href=')
rep('<a href="/revlimiter">', '<a href="/revlimiter" target="_top">')
rep('<title>Station Mixer Bench</title>', '<title>Radio Roulette Station Mixer</title>')
rep('</style>', '''/* embed: no page chrome, transparent so the garage wall's wood shows through */
:root{color-scheme:normal}
html,body{background:transparent!important}
body{padding:6px 0 10px!important;min-height:0!important;overflow:hidden}
</style>''')
rep('</body>', '''<script>
/* tell the product page how tall we are (it sizes the iframe) */
(() => { const send = () => parent.postMessage({ smx: 'h', h: document.documentElement.scrollHeight }, '*');
  new ResizeObserver(send).observe(document.body); addEventListener('load', send); })();
</script>
</body>''')

os.makedirs(os.path.join(OUT, 'audio'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'img'), exist_ok=True)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(s)
n = 0
for f in os.listdir(os.path.join(SRC_ASSETS, 'audio')):
    if f.endswith('.flac') and not f.startswith('rl_') or f == 'manifest.json':
        shutil.copy2(os.path.join(SRC_ASSETS, 'audio', f), os.path.join(OUT, 'audio', f)); n += 1
for f in os.listdir(os.path.join(SRC_ASSETS, 'img')):
    p = os.path.join(SRC_ASSETS, 'img', f)
    if os.path.isfile(p) and f.lower().endswith(('.png', '.jpg')):
        shutil.copy2(p, os.path.join(OUT, 'img', f)); n += 1
print('exported', OUT, n, 'files')
