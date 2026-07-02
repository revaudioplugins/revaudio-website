#!/usr/bin/env bash
# Generate the tileable crane CHAIN strip via gpt-image-1: plumb taut proof-coil
# grey steel, strict ortho, lighting uniform along the full length (critical for
# seamless repeat-y tiling — the tile is extracted by autocorrelation in
# tools/postprocess-crane.py). Palette per the 2026-07-01 art-director spec.
# Output: tools/_crane-candidates/chain-N.png
#
# PROMPT below is the PROVEN winner (2026-07-02): the shipped
# src/assets/plugins/revlimiter-chain.png tile came from this exact prompt at
# quality=medium. The billing pre-estimate counts PROMPT TOKENS — this is the
# compressed form; keep it short.
# Usage:
#   bash tools/gen-crane-chain.sh        # 3 candidates (default)
#   bash tools/gen-crane-chain.sh 2      # custom count
set -euo pipefail
cd "$(dirname "$0")/.."

KEY="${OPENAI_API_KEY:-}"
case "$KEY" in sk-*) ;; *) KEY="" ;; esac
[ -z "$KEY" ] && [ -f tools/.openai_key.local ] && KEY="$(tr -d ' \r\n' < tools/.openai_key.local)"
if [ -z "$KEY" ]; then echo "ERROR: no OpenAI key (set OPENAI_API_KEY or tools/.openai_key.local)"; exit 1; fi

N="${1:-3}"
OUT_DIR="tools/_crane-candidates"
mkdir -p "$OUT_DIR"
SIZE="1024x1536"
QUALITY="${QUALITY:-medium}"   # medium = the shipped asset; high never cleared the org monthly-budget pre-estimate

PROMPT="Photorealistic straight vertical run of heavy proof-coil grey steel chain, perfectly plumb and taut, strict orthographic front view, centered on the vertical axis, identical evenly spaced links alternating front-facing and edge-on, spanning the full frame height and cut off cleanly at top and bottom edges. One warm amber key light from upper left with cream specular highlights, no blue tint; lighting perfectly uniform from top to bottom, no brightness gradient. Dull mill-finish drop-forged steel, no mirror chrome. Transparent background, clean alpha through every link hole. No text, no motion blur, no twist, no sag, no environment."

for i in $(seq 1 "$N"); do
  echo "[crane-chain $i/$N] generating $SIZE ($QUALITY, transparent) ..."
  body="$(python3 -c 'import json,sys; print(json.dumps({"model":"gpt-image-1","prompt":sys.argv[1],"size":sys.argv[2],"quality":sys.argv[3],"background":"transparent","output_format":"png","n":1}))' "$PROMPT" "$SIZE" "$QUALITY")"
  resp="$(curl -s https://api.openai.com/v1/images/generations -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d "$body")"
  if b64="$(python3 -c '
import json,sys
d=json.load(sys.stdin)
if d.get("data"): sys.stdout.write(d["data"][0]["b64_json"])
else: sys.stderr.write(json.dumps(d)[:900]); sys.exit(1)
' <<<"$resp")"; then
    python3 -c 'import base64,sys; open(sys.argv[1],"wb").write(base64.b64decode(sys.stdin.read()))' "$OUT_DIR/chain-$i.png" <<<"$b64"
    echo "[crane-chain $i/$N] saved $OUT_DIR/chain-$i.png ($(wc -c < "$OUT_DIR/chain-$i.png") bytes)"
  else
    echo "[crane-chain $i/$N] FAILED — no image saved"
  fi
  [ "$i" -lt "$N" ] && sleep 2
done
echo "[crane-chain] done — post-process with: python3 tools/postprocess-crane.py chain"
