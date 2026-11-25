#!/bin/bash
# Gfixture.sh <open|released|youtube|open-youtube|released-youtube> <port>   starts a dev server that renders that phase.
# Runs from the repo (WB_REPO, default: the repo this folder sits in) with the real code; only src/data/widebeam.ts is swapped, in memory.
# Stop it with:  kill $(lsof -tiTCP:<port> -sTCP:LISTEN)    (only YOUR port)
set -u
FX=${1:?usage: Gfixture.sh <phase> <port>}; PORT=${2:?port}
HERE="$(cd "$(dirname "$0")" && pwd)"
export WB_REPO=${WB_REPO:-$(cd "$HERE/../.." && pwd)}   # the repo this folder sits in
export WB_FIXTURE=$FX WB_CACHE=${WB_CACHE:-$HERE/runs/fixture-vite-$PORT}
mkdir -p "$HERE/runs"
REL=$(python3 -c "import os,sys;print(os.path.relpath(sys.argv[1],sys.argv[2]))" "$HERE/Gfixture.config.mjs" "$WB_REPO")
cd "$WB_REPO" && nohup npx astro dev --config "$REL" --port "$PORT" --host 127.0.0.1 > "$HERE/runs/fixture-$FX-$PORT.log" 2>&1 &
for i in $(seq 1 60); do code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 "http://127.0.0.1:$PORT/widebeam/"); [ "$code" = 200 ] && { echo "fixture $FX on http://127.0.0.1:$PORT (log runs/fixture-$FX-$PORT.log)"; exit 0; }; sleep 2; done
echo "fixture $FX did not come up on $PORT: see $HERE/runs/fixture-$FX-$PORT.log"; tail -20 "$HERE/runs/fixture-$FX-$PORT.log"; exit 1
