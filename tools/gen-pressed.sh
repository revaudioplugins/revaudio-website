#!/usr/bin/env bash
# Generate "pressed" variants of the vintage button assets via gpt-image-1 edits.
# A mask restricts the edit to the red-button region, so the brass plate / bezel /
# screws stay pixel-identical and the rest<->pressed swap doesn't jump.
# Output: src/assets/ui/<slug>-pressed.png
# Usage: OPENAI_API_KEY=... bash tools/gen-pressed.sh [slug ...]
set -euo pipefail
cd "$(dirname "$0")/.."

KEY="${OPENAI_API_KEY:-}"
[ -z "$KEY" ] && [ -f tools/.openai_key.local ] && KEY="$(tr -d ' \r\n' < tools/.openai_key.local)"
if [ -z "$KEY" ]; then echo "ERROR: no OpenAI key"; exit 1; fi

OUT_DIR="src/assets/ui"
TMP="$(mktemp -d)"
W=1536; H=1024; SIZE="1536x1024"

PRESS_PROMPT="Edit only the masked area. The red push-button is now pressed firmly DOWN into its chrome bezel: the red button face sits noticeably lower and recessed, the chrome bezel rim casts a soft dark shadow across the upper portion of the red face, the glossy highlight is dimmed and shifted lower, and the face reads slightly darker overall. Photorealistic, identical lighting, materials and shape. Do NOT change the brass plate, the chrome bezel, or the corner screws."

make_mask() {  # shape leftpct toppct wpct hpct out
  python3 - "$@" <<'PY'
import sys
from PIL import Image, ImageDraw
shape = sys.argv[1]
l, t, w, h = map(float, sys.argv[2:6])
out = sys.argv[6]
W, H = 1536, 1024
img = Image.new("RGBA", (W, H), (255, 255, 255, 255))  # opaque = keep
d = ImageDraw.Draw(img)
x0, y0 = l/100*W, t/100*H
x1, y1 = x0 + w/100*W, y0 + h/100*H
if shape == "round":
    d.ellipse([x0, y0, x1, y1], fill=(0, 0, 0, 0))      # transparent = edit
else:
    d.rounded_rectangle([x0, y0, x1, y1], radius=(y1-y0)/2, fill=(0, 0, 0, 0))
img.save(out)
PY
}

gen_pressed() {  # slug shape leftpct toppct wpct hpct [label]
  local slug="$1" shape="$2" l="$3" t="$4" w="$5" h="$6" label="${7:-}" resp b64 prompt
  prompt="$PRESS_PROMPT"
  # the mask covers the lettering, so the model must repaint it — name the word
  # explicitly or it comes back blank (learned on btn-submit, 2026-06-10)
  [ -n "$label" ] && prompt="$prompt The word '$label' MUST remain engraved once across the centre of the red face in the same cream off-white condensed industrial capitals, slightly dimmer under the press shadow."
  echo "[$slug] pressing..."
  sips -z "$H" "$W" "$OUT_DIR/$slug.png" --out "$TMP/$slug-src.png" >/dev/null
  make_mask "$shape" "$l" "$t" "$w" "$h" "$TMP/$slug-mask.png"
  resp="$(curl -s https://api.openai.com/v1/images/edits \
    -H "Authorization: Bearer $KEY" \
    -F model=gpt-image-1 \
    -F "image=@$TMP/$slug-src.png" \
    -F "mask=@$TMP/$slug-mask.png" \
    -F size="$SIZE" -F quality=high \
    -F "prompt=$prompt")"
  b64="$(python3 -c 'import json,sys; d=json.load(sys.stdin); sys.stdout.write(d["data"][0]["b64_json"]) if d.get("data") else (sys.stderr.write(json.dumps(d)[:900]) or sys.exit(1))' <<<"$resp")"
  python3 -c 'import base64,sys; open(sys.argv[1],"wb").write(base64.b64decode(sys.stdin.read()))' "$TMP/$slug-raw.png" <<<"$b64"
  sips -Z 900 "$TMP/$slug-raw.png" --out "$OUT_DIR/$slug-pressed.png" >/dev/null
  echo "[$slug] saved $OUT_DIR/$slug-pressed.png ($(wc -c < "$OUT_DIR/$slug-pressed.png") bytes)"
}

run_one() {
  case "$1" in
    btn-checkout)    gen_pressed "$1" round 28 13 45 74 "CHECKOUT" ;;
    btn-add-to-cart) gen_pressed "$1" pill  13 29 74 42 "ADD TO CART" ;;
    btn-buy)         gen_pressed "$1" round 28 14 44 72 "BUY" ;;
    btn-notify)      gen_pressed "$1" pill  12 28 76 44 "NOTIFY ME" ;;
    btn-subscribe)   gen_pressed "$1" pill  12 28 76 44 "SUBSCRIBE" ;;
    btn-submit)      gen_pressed "$1" pill  12 28 76 44 "SUBMIT" ;;
    *) echo "unknown: $1"; exit 1 ;;
  esac
}

if [ "$#" -gt 0 ]; then TARGETS=("$@"); else TARGETS=(btn-checkout btn-add-to-cart btn-buy btn-notify); fi
for t in "${TARGETS[@]}"; do run_one "$t"; done
echo "done."
