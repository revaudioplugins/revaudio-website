#!/usr/bin/env bash
# (OUT=<dir> = where the files land; key: $OPENAI_API_KEY (source ~/.zsh/openai.zsh), else tools/.openai_key.local of the website clone; never printed)
# gpt-image-2 generation (no input image). Usage: gen-free.sh <tag> <size> <n> "<prompt>"  -> free-<tag><k>.png
set -euo pipefail
cd "${OUT:-.}"
TAG="$1"; SIZE="$2"; N="$3"; PROMPT="$4"
KEY="${OPENAI_API_KEY:-$(tr -d '[:space:]' < "$HOME/projects/revaudio/revaudio-website/tools/.openai_key.local")}"
python3 -c 'import json,sys; print(json.dumps({"model":"gpt-image-2","prompt":sys.argv[1],"n":int(sys.argv[2]),"size":sys.argv[3],"quality":"high"}))' "$PROMPT" "$N" "$SIZE" > "req-$TAG.json"
curl -s https://api.openai.com/v1/images/generations -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d @"req-$TAG.json" -o "resp-$TAG.json"
python3 - "$TAG" <<'PY'
import json, sys, base64
t = sys.argv[1]; d = json.load(open(f'resp-{t}.json'))
if not d.get('data'): sys.exit('API error: ' + json.dumps(d)[:800])
for i, it in enumerate(d['data'], 1):
    open(f'free-{t}{i}.png', 'wb').write(base64.b64decode(it['b64_json'])); print('saved', f'free-{t}{i}.png')
PY
rm -f "resp-$TAG.json" "req-$TAG.json"
