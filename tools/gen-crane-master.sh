#!/usr/bin/env bash
# Generate the photoreal crane-buycard MASTER asset via gpt-image-1: the rusty
# race-red pickup door + welded lifting eye + grey forged-steel hook threaded
# THROUGH the eye + baked chain links + blank red-enamel CTA pill — ONE render
# so lighting/perspective/contact-occlusion are physically coherent.
# Palette/vibe per the 2026-07-01 art-director spec (site tokens, no blue, umber
# rust, faded race-red enamel). Output: tools/_crane-candidates/master-N.png
#
# PROMPT below is the PROVEN winner (2026-07-02): the shipped
# src/assets/plugins/revlimiter-crane-master.png came from this exact prompt at
# quality=medium. The billing pre-estimate counts PROMPT TOKENS, so this is the
# compressed form — resist re-expanding it; the long art-director draft never
# fit the org budget window and the short one produced better geometry anyway.
# Usage:
#   bash tools/gen-crane-master.sh        # 4 candidates (default)
#   bash tools/gen-crane-master.sh 2      # custom count
set -euo pipefail
cd "$(dirname "$0")/.."

KEY="${OPENAI_API_KEY:-}"
# Ignore a malformed/non-sk- env key (a stale shell export) and fall through
# to the gitignored local file, which is the intended store.
case "$KEY" in sk-*) ;; *) KEY="" ;; esac
[ -z "$KEY" ] && [ -f tools/.openai_key.local ] && KEY="$(tr -d ' \r\n' < tools/.openai_key.local)"
if [ -z "$KEY" ]; then echo "ERROR: no OpenAI key (set OPENAI_API_KEY or tools/.openai_key.local)"; exit 1; fi

N="${1:-4}"
OUT_DIR="tools/_crane-candidates"
mkdir -p "$OUT_DIR"
SIZE="1024x1536"
QUALITY="${QUALITY:-medium}"   # medium = the shipped asset; high never cleared the org monthly-budget pre-estimate

PROMPT="Photorealistic vintage 1940s pickup truck door, aged faded race-red enamel paint with restrained dark-umber rust at seams, bolt heads and bottom edge (never bright orange), window rolled down so the opening is empty, hanging vertically from a grey drop-forged steel crane hook threaded through a heavy welded lifting eye on its top rail, three proof-coil chain links rising straight up under tension, dark contact occlusion where hook bears the eye. A completely blank glossy red vitreous-enamel pill badge with thin steel bezel on the lower body panel. One warm amber key light from upper left with cream specular highlights, no blue tint. Near-orthographic frontal view, portrait, 5 percent empty margin all sides. Transparent background, clean alpha through the window opening and chain links. No text, no logos, no ground shadow, no environment, no people."

for i in $(seq 1 "$N"); do
  echo "[crane-master $i/$N] generating $SIZE ($QUALITY, transparent) ..."
  body="$(python3 -c 'import json,sys; print(json.dumps({"model":"gpt-image-1","prompt":sys.argv[1],"size":sys.argv[2],"quality":sys.argv[3],"background":"transparent","output_format":"png","n":1}))' "$PROMPT" "$SIZE" "$QUALITY")"
  resp="$(curl -s https://api.openai.com/v1/images/generations -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d "$body")"
  if b64="$(python3 -c '
import json,sys
d=json.load(sys.stdin)
if d.get("data"): sys.stdout.write(d["data"][0]["b64_json"])
else: sys.stderr.write(json.dumps(d)[:900]); sys.exit(1)
' <<<"$resp")"; then
    python3 -c 'import base64,sys; open(sys.argv[1],"wb").write(base64.b64decode(sys.stdin.read()))' "$OUT_DIR/master-$i.png" <<<"$b64"
    echo "[crane-master $i/$N] saved $OUT_DIR/master-$i.png ($(wc -c < "$OUT_DIR/master-$i.png") bytes)"
  else
    echo "[crane-master $i/$N] FAILED — no image saved"
  fi
  [ "$i" -lt "$N" ] && sleep 2
done
echo "[crane-master] done — post-process with: python3 tools/postprocess-crane.py master"
