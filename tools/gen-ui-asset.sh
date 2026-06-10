#!/usr/bin/env bash
# Generate vintage muscle-car UI assets (buttons / toggles) for the RevAudio site
# via OpenAI gpt-image-1, matching the RevLimiter plugin panel.
# Output: src/assets/ui/<slug>.png  (true-alpha PNG, transparent background)
# Usage:
#   OPENAI_API_KEY=... bash tools/gen-ui-asset.sh                 # all assets
#   OPENAI_API_KEY=... bash tools/gen-ui-asset.sh btn-checkout toggle-on
set -euo pipefail
cd "$(dirname "$0")/.."

KEY="${OPENAI_API_KEY:-}"
[ -z "$KEY" ] && [ -f tools/.openai_key.local ] && KEY="$(tr -d ' \r\n' < tools/.openai_key.local)"
if [ -z "$KEY" ]; then echo "ERROR: no OpenAI key (set OPENAI_API_KEY or tools/.openai_key.local)"; exit 1; fi

OUT_DIR="src/assets/ui"
mkdir -p "$OUT_DIR"

# Shared house style — keep every control in the same RevLimiter family.
STYLE="Warm amber light rakes across the metal with cream-white specular highlights (never saturated yellow). Aged, mechanical, slightly worn race-tuned patina, fine machined knurling where collars meet plates. Even flat studio lighting; no glow, no bloom, no halo, no vignette, no ground shadow, no reflection, no environment. Palette: race-red enamel #9e1b1b to #e83a3a, chrome #9aa3ad with cool #b8c8d8 and warm #c8a878 reflections, aged brass #c89a48 to #e6c078, cream specular #fff4d0, phenolic black #1a1c1f. Transparent background; solid pure flat black behind the part only where needed for a clean alpha cut."

CHECKOUT_PROMPT="Photorealistic product render of a single vintage muscle-car dashboard push-button, orthographic flat front view, perfectly centered, filling the frame. A horizontal rounded-rectangle (pill) button bolted into a brushed aged-brass dashboard plate with a polished chrome bezel and fine knurled outer collar; a thin race-red anodized accent line sits just inside the chrome. One small aged slotted brass screw at the far left and one at the far right, each clocked at a slightly different angle. The button face is deep race-red glossy enamel with a soft bright specular highlight top-left and deeper crimson toward the edges. The word 'CHECKOUT' is engraved once across the centre of the red face in clean bold capitals, cream off-white condensed industrial slab font, single line. $STYLE The button fills about 92% of the frame width. Strict: only ONE button; 'CHECKOUT' appears once and only on the red face; no other text, numbers, logos or labels anywhere."

TOGGLE_ON_PROMPT="Photorealistic product render of a single vintage chrome bat-handle toggle flip-switch in the ON position (handle pointing up), orthographic flat front view, centered, filling the frame. The polished chrome bat handle catches a long cream-white specular highlight; it threads through a knurled chrome collar nut into a small rounded-square brushed aged-brass plate with machined bevels and one tiny aged slotted brass screw top and bottom. A thin race-red anodized ring glows at the base of the toggle. $STYLE Subject fills about 85% of the frame. Strict: only ONE toggle switch; no text, numbers, labels or logos anywhere."

TOGGLE_OFF_PROMPT="Photorealistic product render of a single vintage chrome bat-handle toggle flip-switch in the OFF position (handle pointing down), orthographic flat front view, centered, filling the frame. The polished chrome bat handle points downward with a cream-white specular highlight; it threads through a knurled chrome collar nut into a small rounded-square brushed aged-brass plate with machined bevels and one tiny aged slotted brass screw top and bottom. The base ring is dark and unlit (no red glow). $STYLE Subject fills about 85% of the frame. Strict: only ONE toggle switch; no text, numbers, labels or logos anywhere."

ADDCART_PROMPT="Photorealistic product render of a single vintage muscle-car dashboard push-button, orthographic flat front view, centered, filling the frame. A WIDE horizontal rounded-rectangle long pill/lozenge push-button bolted into a brushed aged-brass dashboard plate with a polished chrome bezel and fine knurled edge; a thin race-red anodized accent line just inside the chrome. One small aged slotted brass screw at the far left and one at the far right, each clocked at a slightly different angle. The pill face is deep race-red glossy enamel with a soft bright specular highlight top-left and deeper crimson toward the edges. The words 'ADD TO CART' are engraved once across the centre of the red pill in clean bold capitals, cream off-white condensed industrial slab font, on a SINGLE line, evenly spaced, comfortably fitting inside the pill. $STYLE The button is a wide pill (about 3.5 times wider than tall) filling about 94% of the frame width. Strict: only ONE button; 'ADD TO CART' appears once, only on the red pill, one single line; no other text, numbers, logos or labels anywhere."

BUY_PROMPT="Photorealistic product render of a single vintage muscle-car dashboard push-button, orthographic flat front view, perfectly centered, filling the frame. A round chunky push-button bolted into a brushed aged-brass dashboard plate with a polished chrome bezel and fine knurled outer collar; a thin race-red anodized accent line just inside the chrome. One small aged slotted brass screw at the far left and one at the far right, each clocked differently. The button face is deep race-red glossy enamel with a soft bright specular highlight top-left. The word 'BUY' is engraved once across the centre of the red button in clean bold capitals, cream off-white condensed industrial slab font, single line. $STYLE The button fills about 92% of the frame width. Strict: only ONE button; 'BUY' appears once and only on the red face; no other text, numbers, logos or labels anywhere."

NOTIFY_PROMPT="Photorealistic product render of a single vintage muscle-car dashboard push-button, orthographic flat front view, centered, filling the frame. A WIDE horizontal rounded-rectangle long pill/lozenge push-button bolted into a brushed aged-brass dashboard plate with a polished chrome bezel and fine knurled edge; a thin race-red anodized accent line just inside the chrome. One small aged slotted brass screw at the far left and one at the far right, clocked differently. The pill face is deep race-red glossy enamel with a soft bright specular highlight top-left. The words 'NOTIFY ME' are engraved once across the centre of the red pill in clean bold capitals, cream off-white condensed industrial slab font, on a SINGLE line. $STYLE The button is a wide pill (about 3.2 times wider than tall) filling about 94% of the frame width. Strict: only ONE button; 'NOTIFY ME' appears once, only on the red pill, one line; no other text, numbers, logos or labels anywhere."

SUBSCRIBE_PROMPT="Photorealistic product render of a single vintage muscle-car dashboard push-button, orthographic flat front view, centered, filling the frame. A WIDE horizontal rounded-rectangle long pill/lozenge push-button bolted into a brushed aged-brass dashboard plate with a polished chrome bezel and fine knurled edge; a thin race-red anodized accent line just inside the chrome. One small aged slotted brass screw at the far left and one at the far right, clocked differently. The pill face is deep race-red glossy enamel with a soft bright specular highlight top-left. The word 'SUBSCRIBE' is engraved once across the centre of the red pill in clean bold capitals, cream off-white condensed industrial slab font, on a SINGLE line. $STYLE The button is a wide pill (about 3.2 times wider than tall) filling about 94% of the frame width. Strict: only ONE button; 'SUBSCRIBE' appears once, only on the red pill, one line; no other text, numbers, logos or labels anywhere."

SUBMIT_PROMPT="Photorealistic product render of a single vintage muscle-car dashboard push-button, orthographic flat front view, centered, filling the frame. A WIDE horizontal rounded-rectangle long pill/lozenge push-button bolted into a brushed aged-brass dashboard plate with a polished chrome bezel and fine knurled edge; a thin race-red anodized accent line just inside the chrome. One small aged slotted brass screw at the far left and one at the far right, clocked differently. The pill face is deep race-red glossy enamel with a soft bright specular highlight top-left. The word 'SUBMIT' is engraved once across the centre of the red pill in clean bold capitals, cream off-white condensed industrial slab font, on a SINGLE line. $STYLE The button is a wide pill (about 3.2 times wider than tall) filling about 94% of the frame width. Strict: only ONE button; 'SUBMIT' appears once, only on the red pill, one line; no other text, numbers, logos or labels anywhere."

CARTICON_PROMPT="Photorealistic product render of a small round aged-brass medallion badge, orthographic flat front view, perfectly centered, isolated. A circular brushed aged-brass disc with a thin polished chrome rim and fine knurled edge. Embossed in the centre is one simple BOLD chrome shopping-cart glyph (a minimal cart silhouette), high contrast, clean and legible, with a tiny race-red enamel dot accent. Minimal fine detail so it stays readable when shown very small. $STYLE The medallion fills about 90% of the frame. Strict: only ONE medallion and ONE simple cart glyph; no text, numbers, letters or other symbols anywhere."

gen() {
  local slug="$1" size="$2" prompt="$3" body resp b64
  echo "[$slug] generating $size (high, transparent)..."
  body="$(python3 -c 'import json,sys; print(json.dumps({"model":"gpt-image-1","prompt":sys.argv[1],"size":sys.argv[2],"quality":"high","background":"transparent","output_format":"png","n":1}))' "$prompt" "$size")"
  resp="$(curl -s https://api.openai.com/v1/images/generations -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d "$body")"
  b64="$(python3 -c 'import json,sys; d=json.load(sys.stdin); sys.stdout.write(d["data"][0]["b64_json"]) if d.get("data") else (sys.stderr.write(json.dumps(d)[:900]) or sys.exit(1))' <<<"$resp")"
  python3 -c 'import base64,sys; open(sys.argv[1],"wb").write(base64.b64decode(sys.stdin.read()))' "$OUT_DIR/$slug.png" <<<"$b64"
  echo "[$slug] saved $OUT_DIR/$slug.png ($(wc -c < "$OUT_DIR/$slug.png") bytes)"
}

run_one() {
  case "$1" in
    btn-checkout)    gen "$1" "1536x1024" "$CHECKOUT_PROMPT" ;;
    btn-add-to-cart) gen "$1" "1536x1024" "$ADDCART_PROMPT" ;;
    btn-buy)         gen "$1" "1536x1024" "$BUY_PROMPT" ;;
    btn-notify)      gen "$1" "1536x1024" "$NOTIFY_PROMPT" ;;
    btn-subscribe)   gen "$1" "1536x1024" "$SUBSCRIBE_PROMPT" ;;
    btn-submit)      gen "$1" "1536x1024" "$SUBMIT_PROMPT" ;;
    icon-cart)       gen "$1" "1024x1024" "$CARTICON_PROMPT" ;;
    toggle-on)       gen "$1" "1024x1024" "$TOGGLE_ON_PROMPT" ;;
    toggle-off)      gen "$1" "1024x1024" "$TOGGLE_OFF_PROMPT" ;;
    *) echo "unknown asset: $1"; exit 1 ;;
  esac
}

if [ "$#" -gt 0 ]; then TARGETS=("$@"); else TARGETS=(btn-checkout toggle-on toggle-off); fi
for t in "${TARGETS[@]}"; do run_one "$t"; done
echo "done."
