"""GAS Mixer bench round 3 assets via OpenAI gpt-image-1 (same request shape as tools/station-mixer/gen_assets.py).
Output: bench/assets/gas-mixer/img/gen/<slug>.png (gitignored). Key: OPENAI_API_KEY or tools/.openai_key.local.
Usage: python tools/gas-mixer/gen_assets.py [slug ...] [--force]   (no slugs = all)"""
import base64, json, os, sys, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'bench', 'assets', 'gas-mixer', 'img', 'gen')
os.makedirs(OUT, exist_ok=True)
KEY = os.environ.get('OPENAI_API_KEY') or open(os.path.join(ROOT, 'tools', '.openai_key.local')).read().strip()

# the house lamp (design-language.md Law 4): upper-left key, cream speculars, cool-top / warm-bottom metal reflections
LIGHT = ("One soft warm key light from the upper-left; cream-white speculars (never saturated yellow); cool sky-blue "
         "reflections along the top edges of the metal, warm brass-tinted reflections underneath. No glow, no bloom, no "
         "vignette, no ground shadow, no environment.")

PROMPTS = {
    'tag-blank': ('1536x1024',
        "Photorealistic product photo of a single small vintage 1950s American gas-station pump TAG: a long narrow "
        "rectangular plate of solid stamped BRASS with rounded corners, about 4.2 times wider than tall. A raised "
        "stamped bead border runs around the edge, about 6% of the height in from the rim. One slotted brass screw "
        "near each short end, each screw slot turned to a different angle. The flat middle field is EMPTY, plain "
        "brushed brass, ready for engraving. Aged: honey-gold brass with darker patina in the corners and along the "
        "bead, fine scratches, a few small dents, fingertip polish in the middle, faint green-brown oxidation in the "
        "screw recesses. " + LIGHT + " FLAT ORTHOGRAPHIC front view, camera straight on, no perspective, centered, "
        "the tag fills about 92% of the frame width. Transparent background. Strict: no text, letters, numbers, "
        "logos or symbols anywhere; only ONE tag.", 'transparent'),
    'fuel-gauge': ('1536x1024',
        "Photorealistic product photo of a single vintage 1950s American car dashboard FUEL GAUGE, front view. A "
        "wide rounded-rectangle gauge (about 1.6 times wider than tall) in a thick polished CHROME bezel with a thin "
        "aged-brass inner lip. Behind the glass: a warm cream-ivory painted dial face, slightly yellowed with age. A "
        "single printed arc scale across the upper half, from lower-left to lower-right, with 9 short tick marks; the "
        "left end of the arc is printed in dark oxide red. Printed in dark brown condensed serif capitals: the letter "
        "'E' at the left end of the arc, the fraction '1/2' at the top centre, the letter 'F' at the right end, and "
        "the word 'FUEL' centred in the lower part of the face above a tiny gas-pump pictogram. NO NEEDLE at all: "
        "the needle pivot is just a small dark brass cap at the bottom centre. A faint curved reflection on the glass "
        "at the upper-left. " + LIGHT + " FLAT ORTHOGRAPHIC front view, camera straight on, centered, fills about 92% "
        "of the frame width. Transparent background outside the bezel. Strict: exactly the marks E, 1/2, F and FUEL, "
        "spelled exactly that way, once each; no needle; no other text, numbers or logos.", 'transparent'),
    # ---- transport candidates (Yoni 2026-10-08: "the play and stop buttons need to be way cooler and a bit bigger") ----
    'tkey-chrome': ('1024x1536',
        "Photorealistic product photo of ONE single oversized piano-key transport button from a 1960s American car "
        "cassette / 8-track deck, seen from the front and slightly above. A tall rectangular key about 1.4 times taller "
        "than wide: a thick polished CHROME cap with rounded bevelled edges and a cool sky-blue reflection along the top "
        "edge and a warm reflection underneath, the front face inlaid with a recessed panel of black-brown bakelite "
        "with fine vertical ribbing. The bakelite panel is BLANK. Light wear: micro-scratches on the chrome, a small "
        "dull patch where a thumb presses. " + LIGHT + " FLAT ORTHOGRAPHIC front view, centered, the key fills about "
        "86% of the frame height. Transparent background. Strict: no text, symbols, arrows or logos; only ONE key.", 'transparent'),
    'pbtn-amber': ('1024x1024',
        "Photorealistic product photo of a single large vintage 1950s automobile dashboard PUSH BUTTON: a domed round "
        "jewel lens of deep translucent AMBER glass (honey #c97a14 to #ffb648), faceted like a tail-light lens with a "
        "fine radial star pattern moulded inside, a soft lamp glowing inside it. It sits in a thick knurled polished "
        "CHROME bezel ring with a thin aged-brass outer collar. The lens is BLANK. Light patina, micro-scratches. "
        + LIGHT + " FLAT ORTHOGRAPHIC front view, perfect circle, centered, fills about 88% of the frame. Transparent "
        "background. Strict: only ONE button, no text, symbols or logos.", 'transparent'),
    'pbtn-red': ('1024x1024',
        "Photorealistic product photo of a single large vintage 1950s automobile dashboard PUSH BUTTON: a domed round "
        "jewel lens of deep translucent OXBLOOD-RED glass (#6e140c to #d23a26), faceted like a tail-light lens with a "
        "fine radial star pattern moulded inside, unlit. It sits in a thick knurled polished CHROME bezel ring with a "
        "thin aged-brass outer collar. The lens is BLANK. Light patina, micro-scratches. " + LIGHT + " FLAT "
        "ORTHOGRAPHIC front view, perfect circle, centered, fills about 88% of the frame. Transparent background. "
        "Strict: only ONE button, no text, symbols or logos.", 'transparent'),
    # ---- console frame wear (Yoni 2026-10-08: "the gas edges ... same like rr - patina wear vibes"; RR = chrome-rust.jpg) ----
    'brass-patina': ('1024x1024',
        "Seamless tileable texture: flat top-down macro photograph of old worn BRASS car-dashboard trim. Mostly honey "
        "and dark-gold brass (about 70% clean metal) with fine brushed scratches running mostly horizontally, rubbed "
        "brighter patches where hands touched it, darker brown-black tarnish clouds, and small clusters of dull "
        "green-teal verdigris patina and pitting concentrated in patches, a few dents and nicks. Even flat diffuse "
        "lighting, no highlights, no reflections of a room, no vignette, no perspective. Fills the whole frame edge to "
        "edge; tileable edges.", 'opaque'),
}

def gen(slug):
    size, prompt, bg = PROMPTS[slug]
    path = os.path.join(OUT, slug + '.png')
    if os.path.exists(path) and '--force' not in sys.argv:
        return f'{slug}: exists, skipped'
    body = json.dumps({'model': 'gpt-image-1', 'prompt': prompt, 'size': size, 'quality': 'high',
                       'background': bg, 'output_format': 'png'}).encode()
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
