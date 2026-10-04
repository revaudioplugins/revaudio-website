#!/usr/bin/env bash
# Generate the BLANK TV frame for the /drift keep-it screen (gpt-image-1), Dan 2026-10-03: "the frame is not
# there yet" -> direction A, the plugin's CRT cabinet (traks2_crt_plate) as a TV bezel. Text-only prompt
# (never upload RevAudio art to an external service); NO lettering in the image: the livery (checker,
# SPEED SOUNDS BETTER, スピード, 走り続ける, R badge, slogans) is live HTML on top. Corner-only details so the
# page can 9-slice it to the screen's size.
# Usage: tools/gen-drift-tv-frame.sh <out.png>
set -euo pipefail
OUT="${1:?out.png}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY not set}"
read -r -d '' PROMPT <<'P' || true
The front frame of a retro CRT monitor cabinet from a Japanese drift-racing arcade machine, photographed perfectly
straight-on (orthographic front view, no perspective, no tilt), centered, floating on a transparent background.
The frame is a wide rounded rectangle about 2.4 times as wide as it is tall and fills about 92% of the frame width,
fully inside the picture with an empty transparent margin on every side: nothing is cropped.
Material: worn violet-black painted metal (#120a1a to #1f1029) with fine scratches, scuffs and edge wear showing
darker bare metal, a faint magenta tint in the grime, a crisp chamfered outer edge catching a thin cool highlight on
the top and left. The bezel is thick and even, about 9% of the frame height on every side, around a dark
rounded-rectangle screen opening; the screen area itself is flat solid near-black with no reflections.
Four small dark gunmetal Phillips-head screws, one in each corner of the bezel, each turned to a different angle.
NO text, no letters, no numbers, no logos, no stickers, no decals, no checker patterns, no buttons, no knobs:
the bezel surface is clean worn metal so live lettering can be printed on it later. Any detail lives in the corners.
Lighting: one soft key light from the upper left, even across the bezel; no window reflections; no cast shadow.
Premium product photography, ultra sharp, high detail, no blur, no grain.
Every pixel outside the frame is fully transparent (alpha zero): no drop shadow, no vignette, no background surface.
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
