#!/usr/bin/env bash
# Generate the FREE GAS? drive-in car assets via gpt-image-1, in the crane's
# proven house style (faded race-red enamel, umber rust, warm amber key, no
# blue, transparent bg, blank plate for LIVE text overlay — never baked type).
#
# Two assets, two prompts (gaslab composites them as layers so the wheels can
# spin — see src/pages/gaslab.astro):
#   car   -> tools/_gas-car-candidates/car-N.png    (rear view, landscape)
#   wheel -> tools/_gas-car-candidates/wheel-N.png  (straight-on wheel face, square)
#
# Usage:
#   bash tools/gen-gas-car.sh          # 3 car + 2 wheel candidates (default)
#   bash tools/gen-gas-car.sh 4 3      # custom counts: cars wheels
set -euo pipefail
cd "$(dirname "$0")/.."

KEY="${OPENAI_API_KEY:-}"
case "$KEY" in sk-*) ;; *) KEY="" ;; esac
[ -z "$KEY" ] && [ -f tools/.openai_key.local ] && KEY="$(tr -d ' \r\n' < tools/.openai_key.local)"
if [ -z "$KEY" ]; then echo "ERROR: no OpenAI key (set OPENAI_API_KEY or tools/.openai_key.local)"; exit 1; fi

N_CAR="${1:-3}"
N_WHEEL="${2:-2}"
OUT_DIR="tools/_gas-car-candidates"
mkdir -p "$OUT_DIR"
QUALITY="${QUALITY:-medium}"   # house standard — high never cleared the org budget window

CAR_PROMPT="Photorealistic straight-on rear view of a vintage 1960s American muscle car, aged faded race-red enamel paint with restrained dark-umber rust at seams and lower edges (never bright orange), low wide stance, fat rear slick tires poking out past the body on both sides, dulled chrome rear bumper, twin round tail lights, a completely blank cream vitreous-enamel license plate with thin steel bezel centered on the rear bumper. One warm amber key light from upper left with cream specular highlights, no blue tint. Near-orthographic rear view, landscape, the complete car fully in frame with 8 percent empty margin on all sides. Transparent background. No text, no logos, no ground shadow, no environment, no people."

WHEEL_PROMPT="Photorealistic single vintage muscle car rear wheel seen perfectly straight-on from the side, fat blackwall drag slick tire, five-spoke steel rim in dark gunmetal with a small dulled brass center cap, aged patina matching a faded race-red hot rod, one warm amber key light from upper left with cream specular highlights, no blue tint. Near-orthographic, the complete wheel centered with 10 percent empty margin on all sides. Transparent background. No text, no logos, no ground shadow, no environment."

gen() { # gen <label> <prompt> <size> <count>
  local label="$1" prompt="$2" size="$3" count="$4" i body resp b64
  for i in $(seq 1 "$count"); do
    echo "[$label $i/$count] generating $size ($QUALITY, transparent) ..."
    body="$(python3 -c 'import json,sys; print(json.dumps({"model":"gpt-image-1","prompt":sys.argv[1],"size":sys.argv[2],"quality":sys.argv[3],"background":"transparent","output_format":"png","n":1}))' "$prompt" "$size" "$QUALITY")"
    resp="$(curl -s https://api.openai.com/v1/images/generations -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d "$body")"
    if b64="$(python3 -c '
import json,sys
d=json.load(sys.stdin)
if d.get("data"): sys.stdout.write(d["data"][0]["b64_json"])
else: sys.stderr.write(json.dumps(d)[:900]); sys.exit(1)
' <<<"$resp")"; then
      python3 -c 'import base64,sys; open(sys.argv[1],"wb").write(base64.b64decode(sys.stdin.read()))' "$OUT_DIR/$label-$i.png" <<<"$b64"
      echo "[$label $i/$count] saved $OUT_DIR/$label-$i.png ($(wc -c < "$OUT_DIR/$label-$i.png") bytes)"
    else
      echo "[$label $i/$count] FAILED — no image saved"
    fi
    [ "$i" -lt "$count" ] && sleep 2
  done
}

gen car "$CAR_PROMPT" "1536x1024" "$N_CAR"
gen wheel "$WHEEL_PROMPT" "1024x1024" "$N_WHEEL"
echo "[gas-car] done — candidates in $OUT_DIR/"
