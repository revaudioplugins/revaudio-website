"""Station Mixer bench round 4 assets via OpenAI gpt-image-1 (same request shape as tools/gen-ui-asset.sh).
Output: bench/assets/station-mixer/img/gen/<slug>.png (gitignored). Key: OPENAI_API_KEY or tools/.openai_key.local.
Usage: python tools/station-mixer/gen_assets.py [slug ...]   (no args = all)"""
import base64, json, os, sys, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'bench', 'assets', 'station-mixer', 'img', 'gen')
os.makedirs(OUT, exist_ok=True)
KEY = os.environ.get('OPENAI_API_KEY') or open(os.path.join(ROOT, 'tools', '.openai_key.local')).read().strip()

LIGHT = ("One soft warm key light from the upper-left; cream-white speculars (never saturated yellow); cool sky-blue "
         "reflections along the tops of the chrome, warm brass-tinted reflections underneath. No glow, no bloom, no "
         "vignette, no ground shadow, no environment.")

def emblem(word, spelled):
    return (f"Photorealistic product photo of a single vintage 1950s American automobile trunk-lid script emblem: the word "
            f"'{word}' in flowing, connected, hand-lettered chrome cursive script, thick die-cast polished chrome letters "
            f"with rounded bevelled edges and a thin line of deep oxblood-red enamel inlaid along the top of each letter. "
            f"A long swash tail sweeps from the last letter back under the word. Aged: fine micro-scratches, a few pits "
            f"and dull spots in the chrome, as if it rode on a car for decades. {LIGHT} FLAT ORTHOGRAPHIC front view, no "
            f"perspective, centered, the emblem fills about 90% of the frame width. Transparent background. Strict: "
            f"exactly the single word '{word}' spelled {spelled}, once; no other text, letters, numbers, logos, badge "
            f"plates or backgrounds.")

PROMPTS = {
    'emblem-drums':  ('1536x1024', emblem('Drums', 'D-r-u-m-s'), 'transparent'),
    'emblem-bass':   ('1536x1024', emblem('Bass', 'B-a-s-s'), 'transparent'),
    'emblem-keys':   ('1536x1024', emblem('Keys', 'K-e-y-s'), 'transparent'),
    'emblem-guitar': ('1536x1024', emblem('Guitar', 'G-u-i-t-a-r'), 'transparent'),
    'emblem-master': ('1536x1024', emblem('Master', 'M-a-s-t-e-r'), 'transparent'),
    'start-button': ('1024x1024',
        "Photorealistic product photo of a single vintage race-car ENGINE START push button. A large round domed button "
        "of glossy deep race-red translucent enamel (#9e1b1b to #e83a3a) with a soft lamp lit inside it, the word "
        "'START' engraved once across the face in cream off-white condensed bold capitals. It sits in a thick knurled "
        "polished chrome bezel ring with a thin aged-brass outer collar; two small slotted screws on the collar, each "
        "clocked at a different angle. Light patina, micro-scratches on the chrome. " + LIGHT + " FLAT ORTHOGRAPHIC "
        "front view, camera straight on, perfect circle silhouette, centered with equal transparent margin on all "
        "sides, filling about 88% of the frame. Transparent background. Strict: only ONE button, the word START once, "
        "no other text, numbers or logos.", 'transparent'),
    'chrome-rust': ('1024x1024',
        "Seamless tileable texture: flat top-down macro photograph of old worn chrome-plated steel car trim. Brushed "
        "chrome with fine micro-scratches running mostly horizontally, pitting, small clusters of orange-brown surface "
        "rust and dark oxidised spots, a few chips where the chrome flaked off to dull grey steel. Mostly still "
        "chrome (about 75% clean metal), the rust concentrated in patches. Even flat diffuse lighting, no highlights, "
        "no reflections of a room, no vignette, no perspective. Fills the whole frame edge to edge; tileable edges.",
        'opaque'),
}

def gen(slug):
    size, prompt, bg = PROMPTS[slug]
    body = json.dumps({'model': 'gpt-image-1', 'prompt': prompt, 'size': size, 'quality': 'high',
                       'background': bg, 'output_format': 'png', 'n': 1}).encode()
    path = os.path.join(OUT, slug + '.png')
    if os.path.exists(path) and '--force' not in sys.argv:
        return f'{slug}: exists, skipped'
    for attempt in range(5):   # 429 = rate limit: wait and retry; any other error: print the API's message
        req = urllib.request.Request('https://api.openai.com/v1/images/generations', data=body,
                                     headers={'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
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
    slugs = [a for a in sys.argv[1:] if not a.startswith('--')] or list(PROMPTS)
    for s in slugs:               # one at a time: parallel image requests hit the rate limit (429)
        print(gen(s), flush=True)
