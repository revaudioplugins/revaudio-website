#!/usr/bin/env bash
# Generate the Hear-it dashboard housing FRAME (true-alpha, empty aperture)
# via OpenAI gpt-image-1, matching the RevLimiter ARM module (arm-mount-v3).
# Meant for CSS border-image 9-slice: uniform rails, screwed corners.
# Output: tools/_dash-frame-candidates/dash-frame-<n>.png
# Usage: bash tools/gen-dash-frame.sh [count]
set -euo pipefail
cd "$(dirname "$0")/.."

KEY="${OPENAI_API_KEY:-}"
[ -z "$KEY" ] && [ -f tools/.openai_key.local ] && KEY="$(tr -d ' \r\n' < tools/.openai_key.local)"
if [ -z "$KEY" ]; then echo "ERROR: no OpenAI key (set OPENAI_API_KEY or tools/.openai_key.local)"; exit 1; fi

OUT_DIR="tools/_dash-frame-candidates"
mkdir -p "$OUT_DIR"

STYLE="Warm amber light rakes across the metal with cream-white specular highlights (never saturated yellow). Aged, mechanical, slightly worn race-tuned patina. Even flat studio lighting; no glow, no bloom, no halo, no vignette, no ground shadow, no reflection, no environment. Palette: aged copper-bronze #6a4a2c to #2a1c10, deep espresso walnut #241c14, warm aged brass #c89a48 accents, cream specular #fff4d0. Transparent background."

PROMPT="Photorealistic product render of an EMPTY rectangular vintage muscle-car dashboard bezel frame, orthographic flat front view, perfectly centered, filling the image. A wide flat aged copper-bronze metal instrument-panel surround: brushed dark bronze plate with warm patina, a machined beveled inner lip, and softly rounded outer corners. The frame border is uniform thickness on all four sides, about 12% of the image height. The centre is a large empty rectangular aperture: fully transparent, completely empty, nothing inside it. One small aged slotted screw sits in each of the four corners of the frame, each clocked at a different angle. The four rails between the corners are straight, parallel and uniform, with subtle brushed texture and gentle wear only. $STYLE Strict: the aperture is completely empty and transparent; the frame rails are straight and uniform with no objects, dials, gauges, text, numbers, logos or labels anywhere."

COUNT="${1:-2}"
for i in $(seq 1 "$COUNT"); do
  echo "[dash-frame-$i] generating 1536x1024 (high, transparent)..."
  body="$(python3 -c 'import json,sys; print(json.dumps({"model":"gpt-image-1","prompt":sys.argv[1],"size":"1536x1024","quality":"high","background":"transparent","output_format":"png","n":1}))' "$PROMPT")"
  resp="$(curl -s https://api.openai.com/v1/images/generations -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d "$body")"
  b64="$(python3 -c 'import json,sys; d=json.load(sys.stdin); sys.stdout.write(d["data"][0]["b64_json"]) if d.get("data") else (sys.stderr.write(json.dumps(d)[:900]) or sys.exit(1))' <<<"$resp")"
  python3 -c 'import base64,sys; open(sys.argv[1],"wb").write(base64.b64decode(sys.stdin.read()))' "$OUT_DIR/dash-frame-$i.png" <<<"$b64"
  echo "[dash-frame-$i] saved $OUT_DIR/dash-frame-$i.png ($(wc -c < "$OUT_DIR/dash-frame-$i.png") bytes)"
done
