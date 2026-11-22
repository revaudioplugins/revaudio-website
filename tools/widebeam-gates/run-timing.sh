#!/bin/bash
# run-timing.sh <base> [--prod <preview-base>]   THE TIMING CHECKS, one at a time, for a QUIET machine (stage 4). Nothing else may run while it does.
#   G5   "Take it for a drive" leaves the face >= 95 % visible within 1.5 s at 1141x636, 1280x665, 1440x900, 390x844 (+ lamps after landing, still after)
#   G6   the title is up <= 6.5 s after play() on a 4 Mbit/s line
#   G11  on 4 Mbit/s the car starts <= 1.5 s with 0 stalls, paired with the face art blocked and with /drift in the same minute; no long task over 100 ms at load
#   G12  frame times at 4x CPU through the hand-off, the dash arrival, HIGH BEAM, the preset glide, judged against /drift in the same minute
#   G3   the first sound's long task (a new AudioContext + the engine on the first knob touch) <= 100 ms
# Prints one table. Run it twice and trust a result only when both runs agree (the plan: paired runs).
set -u
BASE=${1:?usage: run-timing.sh <base> [--prod <preview-base>]}; shift; BASE=${BASE%/}
HERE="$(cd "$(dirname "$0")" && pwd)"; cd "$HERE"
export NODE_PATH=${NODE_PATH:-$(cd "$HERE/../.." && pwd)/node_modules}   # the repo's node_modules (this folder is <repo>/tools/widebeam-gates)
PROD=""; [ "${1:-}" = "--prod" ] && PROD=${2%/}
B=${PROD:-$BASE}
code=$(curl -s -o /dev/null -w '%{http_code}' -m 15 "$B/widebeam/"); [ "$code" = 200 ] || { echo "$B/widebeam/ answers $code"; exit 2; }
OUT="$HERE/runs/rt-$(date +%m%d-%H%M%S)"; mkdir -p "$OUT"
uptime | sed 's/^/machine load: /' >&2
t() { local g=$1; shift; echo "[$(date +%T)] $g $*" >&2; node "$@" > "$OUT/$g.out" 2>"$OUT/$g.err"; }
t G5 G5.cjs "$B" --engines chromium --timing --sizes L1141,L1280,L1440,P390
t G6 G6.cjs "$B" --engines chromium --timing
t G11 G11.cjs "$B" --timing
t G12 G12.cjs "$B" --timing
t G3 G3.cjs "$B" --engines chromium --timing
node Gsum.cjs "$OUT" --wide
