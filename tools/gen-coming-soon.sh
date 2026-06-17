#!/usr/bin/env bash
# Generate the "COMING SOON" plate for unreleased plugins (Drift, The AC).
# Uses gpt-image-1 /v1/images/edits with the RevAudio logo plate as the EXACT
# style reference, so the metal/distress/bolt-holes/font match the brand logo —
# only the engraved text changes to "COMING SOON" (two-tone like the logo:
# COMING = worn red, SOON = worn gold).
# Output: src/assets/plugins/coming-soon-plate.png  (true-alpha PNG)
#         plus candidate-N siblings for picking the cleanest text render.
# Usage:  OPENAI_API_KEY=... bash tools/gen-coming-soon.sh [N]   (default N=2)
set -euo pipefail
cd "$(dirname "$0")/.."

KEY="${OPENAI_API_KEY:-}"
[ -z "$KEY" ] && [ -f tools/.openai_key.local ] && KEY="$(tr -d ' \r\n' < tools/.openai_key.local)"
if [ -z "$KEY" ]; then echo "ERROR: no OpenAI key (set OPENAI_API_KEY or tools/.openai_key.local)"; exit 1; fi

REF="src/assets/brand/revaudio-plate.png"
OUT_DIR="src/assets/plugins"
N="${1:-2}"
mkdir -p "$OUT_DIR"

PROMPT="Using the supplied vintage license plate as the EXACT style reference, recreate the SAME aged distressed black-enamel metal license plate: identical proportions and rounded corners, the same heavily weathered and chipped paint, the same rusty scratched patina over dark steel, and the same four small bolt holes in the corners. Keep the SAME bold embossed slab-serif lettering style and the SAME two-tone colour treatment as the reference logo. Change ONLY the engraved text so the plate reads 'COMING' on the upper line in worn race-red enamel (matching the red of 'Rev' in the reference) and 'SOON' on the lower line in aged worn gold/brass (matching 'Audio' in the reference). The letters are raised and embossed with realistic paint chipping and edge highlights, horizontal and centred. FRAMING IS CRITICAL: the COMPLETE license plate must be fully visible and centred, occupying about 78 percent of the frame, with generous EQUAL empty transparent margin on all four sides; all four rounded corners and the entire outer rim must sit well inside the frame — the plate must NOT be cropped, cut off, or bleed off ANY edge, especially the left and right edges. Even flat studio lighting, no glow, no added drop shadow, no reflection, no environment. The entire area OUTSIDE the metal plate must be fully transparent (clean alpha). Strict: the plate shows ONLY the two words 'COMING SOON' exactly once; the words 'Rev', 'Audio' or 'RevAudio' must NOT appear anywhere; no other text, numbers, logos or symbols."

gen_one() {
  local idx="$1"
  local out="$OUT_DIR/coming-soon-candidate-$idx.png"
  local resp b64
  echo "[cand $idx] editing from $REF (high, transparent, 1536x1024)..."
  resp="$(curl -s https://api.openai.com/v1/images/edits \
    -H "Authorization: Bearer $KEY" \
    -F "model=gpt-image-1" \
    -F "image[]=@$REF" \
    -F "prompt=$PROMPT" \
    -F "size=1536x1024" \
    -F "quality=high" \
    -F "background=transparent" \
    -F "output_format=png" \
    -F "n=1")"
  b64="$(python3 -c 'import json,sys; d=json.load(sys.stdin); sys.stdout.write(d["data"][0]["b64_json"]) if d.get("data") else (sys.stderr.write(json.dumps(d)[:1200]) or sys.exit(1))' <<<"$resp")"
  python3 -c 'import base64,sys; open(sys.argv[1],"wb").write(base64.b64decode(sys.stdin.read()))' "$out" <<<"$b64"
  echo "[cand $idx] saved $out ($(wc -c < "$out") bytes)"
}

for i in $(seq 1 "$N"); do gen_one "$i"; done
echo "done. review coming-soon-candidate-*.png, then promote the best to coming-soon-plate.png"
