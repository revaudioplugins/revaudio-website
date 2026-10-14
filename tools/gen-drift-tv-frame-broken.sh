#!/usr/bin/env bash
# Generate BLANK broken-TV frames for the homepage word wall's DRIFT screen (gpt-image-1), Dan 2026-10-14: "make the
# frame in DRIFT's vibe, a broken TV frame". Same recipe as tools/gen-drift-tv-frame.sh (the /drift keep-it TV):
# text-only prompt (never upload RevAudio art to an external service), NO lettering in the image, and ALL damage in
# the four corners so the page can 9-slice it to any screen size (the long bezel runs get stretched).
# Usage: tools/gen-drift-tv-frame-broken.sh <outDir> [n=3]   -> <outDir>/roll-1.png ... roll-n.png
set -euo pipefail
OUT="${1:?outDir}"; N="${2:-3}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY not set}"
mkdir -p "$OUT"
PY=python3; "$PY" -c 1 >/dev/null 2>&1 || PY=python   # Windows: python3 can be the Microsoft Store stub
read -r -d '' PROMPT <<'P' || true
The front frame of a beat-up, broken retro CRT television cabinet from a Japanese street drift-racing garage,
photographed perfectly straight-on (orthographic front view, no perspective, no tilt), centered, floating on a
transparent background. The frame is a wide rounded rectangle about 1.6 times as wide as it is tall and fills about
94% of the image width, fully inside the picture with an empty transparent margin on every side: nothing is cropped.
Material: worn violet-black painted steel and hard plastic (#120a1a to #1f1029), heavily used: deep scratches,
scuffs, chipped paint showing darker bare metal, grime with a faint magenta tint, a crisp chamfered outer edge
catching a thin cool highlight on the top and left.
It is BROKEN, and every bit of damage lives in the four corners; the long straight runs of the bezel between the
corners stay plain, evenly worn metal so they can be stretched:
top-left corner: the plastic is cracked, a jagged crack runs diagonally across the corner and a small piece is
chipped away; faded remains of a magenta-and-violet checker paint stripe.
top-right corner: a strip of dull silver gaffer tape wrapped over a crack, its edges peeling.
bottom-left corner: the screw is missing, an empty stripped screw hole with a small scorch mark.
bottom-right corner: a chunk of the bezel broken off at the corner, exposing the dark inner edge.
The two corners that still have one keep a small dark gunmetal Phillips-head screw, turned to different angles.
The bezel is thick and even, about 8% of the frame height on every side, around a dark rounded-rectangle screen
opening; the screen area itself is flat solid near-black with no reflections, no cracks and no image.
NO text, no letters, no numbers, no logos, no stickers or decals with writing, no buttons, no knobs.
Lighting: one soft key light from the upper left, even across the bezel; no window reflections; no cast shadow.
Premium product photography, ultra sharp, high detail, no blur, no grain.
Every pixel outside the frame is fully transparent (alpha zero): no drop shadow, no vignette, no background surface.
P
BODY="$("$PY" -c 'import json,sys; print(json.dumps({"model":"gpt-image-1","prompt":sys.argv[1],"size":"1536x1024","quality":"high","background":"transparent","n":int(sys.argv[2])}))' "$PROMPT" "$N")"
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
curl -sS https://api.openai.com/v1/images/generations -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" -d "$BODY" -o "$TMP"
"$PY" - "$TMP" "$OUT" <<'PY'
import base64, json, sys
d = json.load(open(sys.argv[1]))
if not d.get("data"):
    sys.stderr.write(json.dumps(d)[:600] + "\n"); sys.exit(1)
for i, im in enumerate(d["data"], 1):
    p = f"{sys.argv[2]}/roll-{i}.png"
    open(p, "wb").write(base64.b64decode(im["b64_json"]))
    print("saved", p)
PY
