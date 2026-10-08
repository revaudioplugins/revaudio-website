#!/usr/bin/env bash
# Generate the BLANK dashcam bezel for the /drift #creators section (gpt-image-1), 2026-10-03 page finish:
# the car's dashcam monitor, ON AIR. A copy of tools/gen-drift-tv-frame.sh with a new prompt. Text-only prompt
# (never upload RevAudio art to an external service); NO lettering in the image: the livery (the 配信 tally lamp,
# ON AIR, stripes, SPEED SOUNDS BETTER) is live HTML on top. Corner-only details so the page can 9-slice it.
# Usage: tools/gen-drift-dashcam-bezel.sh <out.png>
set -euo pipefail
OUT="${1:?out.png}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY not set}"
read -r -d '' PROMPT <<'P' || true
The rear monitor housing of a premium car dashcam, photographed perfectly straight-on (orthographic front view, no perspective, no tilt), centered, floating on a transparent background. A wide rounded rectangle about 2.1 times as wide as it is tall, filling about 92% of the frame width, fully inside the picture with an empty transparent margin on every side: nothing is cropped. Material: matte black soft-touch rubberized plastic (#0d0a12 to #1a1422) with a thin glossy black inner trim around the screen and a crisp chamfered outer edge catching a thin cool highlight on the top and left. The bezel is slim and even, about 7% of the housing height on every side, around a flat screen that is solid near-black (#08060c), completely empty, no reflections, no interface, no glow. Four tiny dark gunmetal hex screws, one in each corner of the bezel, each turned to a different angle. NO text, no letters, no numbers, no logos, no stickers, no decals, no buttons, no icons, no lenses, no LEDs: the bezel surface is clean so live lettering can be printed on it later. Any detail lives in the corners. One soft key light from the upper left, even across the bezel; no window reflections; no cast shadow. Premium product photography, ultra sharp, high detail, no blur, no grain. Every pixel outside the housing is fully transparent (alpha zero): no drop shadow, no vignette, no background surface.
P
BODY="$(python3 -c 'import json,sys; print(json.dumps({"model":"gpt-image-1","prompt":sys.argv[1],"size":"1536x1024","quality":"high","background":"transparent","n":1}))' "$PROMPT")"
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
curl -sS https://api.openai.com/v1/images/generations -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" -d "$BODY" -o "$TMP"
python3 - "$TMP" "$OUT" <<'PY'
import base64, json, sys
d = json.load(open(sys.argv[1]))
if not d.get("data"):
    sys.stderr.write(json.dumps(d)[:600] + "\n"); sys.exit(1)
open(sys.argv[2], "wb").write(base64.b64decode(d["data"][0]["b64_json"]))
print("saved", sys.argv[2])
PY
