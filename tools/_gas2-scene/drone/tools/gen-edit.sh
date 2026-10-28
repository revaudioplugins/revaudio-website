#!/usr/bin/env bash
# gpt-image-2 edit: paints over a layout guide (image 1) with optional reference images (2..). Key: $OPENAI_API_KEY
# (never printed). Prints the token usage so the spend can be tracked (Dan's cap for the drone art: $15).
#   gen-edit.sh <out prefix> <WxH> <n> <prompt file> <image> [image ...]   -> <out prefix>1.png ...
set -euo pipefail
OUTP="$1"; SIZE="$2"; N="$3"; PROMPT_FILE="$4"; shift 4
ARGS=(); for f in "$@"; do ARGS+=(-F "image[]=@$f"); done
RESP="$OUTP.resp.json"
curl -s https://api.openai.com/v1/images/edits -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F model=gpt-image-2 -F "prompt=<$PROMPT_FILE" -F n="$N" -F size="$SIZE" -F quality=high "${ARGS[@]}" -o "$RESP"
python -I - "$OUTP" "$RESP" <<'PY'
import json, sys, base64, os
outp, resp = sys.argv[1], sys.argv[2]; d = json.load(open(resp))
if not d.get('data'): sys.exit('API error: ' + json.dumps(d)[:800])
for i, it in enumerate(d['data'], 1):
    open(f'{outp}{i}.png', 'wb').write(base64.b64decode(it['b64_json'])); print('saved', f'{outp}{i}.png')
print('usage', json.dumps(d.get('usage', {})))
os.remove(resp)
PY
