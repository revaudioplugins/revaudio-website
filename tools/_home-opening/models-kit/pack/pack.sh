#!/bin/zsh
# The pack, start to end (README.md). Run it after a model or a PBR map is added or replaced, and after the layout moves.
#   ./pack.sh          adopt → measure the walk in four window shapes (~10 min) → need.json → build → check
#   ./pack.sh check    measure the room as it is now and check the served files against it; nothing in assets/ is written
set -e
mode=$1; cd "$(dirname "$0")"; ROOT=$(cd ../../../.. && pwd); PORT=${KIT_PORT:-4618}
[ -d node_modules ] || npm install --no-audit --no-fund
if curl -s -o /dev/null "http://127.0.0.1:$PORT/"; then echo "port $PORT is taken: KIT_PORT=<a free port> ./pack.sh"; exit 1; fi
mkdir -p work; [ "$mode" = check ] || node pack.mjs adopt
(cd "$ROOT" && exec python3 -m http.server $PORT --bind 127.0.0.1) > /dev/null 2>&1 & srv=$!
trap "kill $srv" EXIT; sleep 1
for vp in "1440 900 2" "1280 960 2" "3440 1440 1" "820 1180 2"; do   # laptop, 4:3, ultrawide, tablet upright
  set -- ${=vp}; KIT_PORT=$PORT node measure.mjs work/mip-$1x$2@$3.json $1 $2 $3 | tail -1
done
if [ "$mode" = check ]; then node pack.mjs need work/mip-*.json --out=work/need-now.json && node pack.mjs check work/need-now.json
else node pack.mjs need work/mip-*.json && node pack.mjs build && node pack.mjs check; fi
