#!/bin/bash
# run-gates.sh <base> [--prod <preview-base>] [--fixtures] [--only G3,G4] [--engines chromium,webkit] [--prove] [--wide]
# Runs every NON-timing check G0..G13 against <base> (a dev server or a preview) and prints ONE summary table: gate, check, PASS/FAIL, the measured value.
# MISSING = a contract hook the check needs is not on the page (counts as FAIL). SKIP = cannot run here and says why (never a pass). Exit 1 on any FAIL/MISSING.
#   --prod <url>   an `astro preview` of a production build: G11's byte counts run there (and G0 reads <repo>/dist)
#   --fixtures     start the phase fixtures (open on 4527, released on 4528, YouTube facade on 4529; Gfixture.sh) for G0's phase checks, G3's tutorial cases and G13's
#                  facade click, then stop them (only those three ports)
#   --prove        instead of the table: run every PLANTED violation and the unfixed-page proofs, and print which gate caught each
#   --only G3,G5   just those gates          --engines  default chromium,webkit (G3 adds firefox)
# Timing checks are NOT here: run-timing.sh.
set -u
BASE=${1:?usage: run-gates.sh <base> [options]}; shift; BASE=${BASE%/}
HERE="$(cd "$(dirname "$0")" && pwd)"; cd "$HERE"
export NODE_PATH=${NODE_PATH:-$(cd "$HERE/../.." && pwd)/node_modules}   # the repo's node_modules (this folder is <repo>/tools/widebeam-gates)
PROD=""; FIX=0; ONLY=""; ENG="chromium,webkit"; PROVE=0; WIDE=""
while [ $# -gt 0 ]; do case "$1" in --prod) PROD=${2%/}; shift 2;; --fixtures) FIX=1; shift;; --only) ONLY=$2; shift 2;; --engines) ENG=$2; shift 2;; --prove) PROVE=1; shift;; --wide) WIDE=--wide; shift;; *) echo "unknown option $1"; exit 2;; esac; done
code=$(curl -s -o /dev/null -w '%{http_code}' -m 15 "$BASE/widebeam/"); [ "$code" = 200 ] || { echo "$BASE/widebeam/ answers $code, not 200"; exit 2; }
want() { [ -z "$ONLY" ] || echo ",$ONLY," | grep -q ",$1,"; }
STAMP=$(date +%m%d-%H%M%S); OUT="$HERE/runs/rg-$STAMP"; mkdir -p "$OUT"
FXPORTS="4527 4528 4529"
stopfx() { for p in $FXPORTS; do pid=$(lsof -tiTCP:$p -sTCP:LISTEN 2>/dev/null); [ -n "$pid" ] && kill $pid 2>/dev/null; done; }
FXOPEN=""; FXREL=""; FXYT=""
if [ $FIX = 1 ]; then
  trap stopfx EXIT
  ./Gfixture.sh open 4527 >/dev/null 2>&1 && FXOPEN=http://127.0.0.1:4527
  ./Gfixture.sh released 4528 >/dev/null 2>&1 && FXREL=http://127.0.0.1:4528
  ./Gfixture.sh youtube 4529 >/dev/null 2>&1 && FXYT=http://127.0.0.1:4529
  echo "fixtures: open=${FXOPEN:-DOWN} released=${FXREL:-DOWN} youtube=${FXYT:-DOWN}"
fi
run() { local g=$1; shift; want "$g" || return 0; echo "[$(date +%T)] $g $*" >&2; node "$@" > "$OUT/$g$SUF.out" 2>"$OUT/$g$SUF.err"; }

if [ $PROVE = 1 ]; then
  P="$HERE/runs/prove-$STAMP"; mkdir -p "$P"; echo "PLANTED VIOLATIONS: each must be caught (a FAIL row) by the gate named. Output: $P"
  prove() { local label=$1 gate=$2; shift 2; local f="$P/$(echo "$label" | tr "/ " "__").out"; node "$@" > "$f" 2>&1; local n; n=$(grep -c "^@@R.*	FAIL	" "$f"); local first; first=$(grep "^@@R.*	FAIL	" "$f" | head -1 | cut -f3,5 | cut -c1-150); [ "$n" -gt 0 ] && echo "CAUGHT    $gate  $label  ($n FAIL rows) e.g. $first" || echo "NOT CAUGHT $gate  $label  <- a hole in the gate"; }
  for pl in aax aax-js buynow notify trialpromise trial-js emaillabel sitemap; do prove "G0 plant $pl" G0 G0.cjs "$BASE" --static --plant $pl; done
  prove "G0 plant buynote (text that only exists after a click)" G0 G0.cjs "$BASE" --engines chromium --plant buynote
  prove "G2 plant buynow via an injecting proxy" G2 G2.cjs "$BASE" --projects chromium --plant buynow
  prove "G3 plant tab-sound (a page that starts the music on Tab)" G3 G3.cjs "$BASE" --engines chromium --only "Tab key" --plant tab-sound
  prove "G4 plant flash (every H flashes the page)" G4 G4.cjs "$BASE" --engines chromium --plant flash --only "held H"
  prove "G5 plant loud (master gain x5: clips, A/B off)" G5 G5.cjs "$BASE" --engines chromium --plant loud --only "A/B"
  prove "G6 plant tallhero (the hero taller than the screen)" G6 G6.cjs "$BASE" --engines chromium --plant tallhero --only "sale=bf"
  prove "G6 plant salestrip (/widebeam wears a live sale strip on the BF / CM clock)" G6 G6.cjs "$BASE" --engines chromium --sizes L1141 --plant salestrip --only "sale dates"
  prove "G6 plant revealstuck (the reveals pinned hidden; only the fonts blocked, so the page script runs)" G6 G6.cjs "$BASE" --engines chromium --sizes L1141 --block '[.]woff2' --plant revealstuck --only "data-reveal"
  prove "G6 plant artbare (the road part without its art; only the fonts blocked)" G6 G6.cjs "$BASE" --engines chromium --sizes L1141 --block '[.]woff2' --plant artbare --only "not bare"
  [ -n "$PROD" ] && prove "G6 the old init.ts-only block regex (blocks nothing on a production build)" G6 G6.cjs "$PROD" --engines chromium --sizes L1141 --only "title shows" --block 'src/lib/widebeam/init[.]ts|_astro/widebeam[.]astro_astro_type_script|_astro/init[.]'
  prove "G7 plant nojs-hide (a block hidden without JS)" G7 G7.cjs "$BASE" --engines chromium --plant nojs-hide --only "no JavaScript"
  prove "G7 plant odo0 (odometers read 0 in the HTML)" G7 G7.cjs "$BASE" --engines chromium --plant odo0 --only "raw HTML"
  prove "G7 plant flash under reduced motion" G7 G7.cjs "$BASE" --engines chromium --plant flash --only "no intro, no HIGH BEAM flash"
  prove "G10 plant lowcontrast (small print greyed out)" G10 G10.cjs "$BASE" --engines chromium --plant lowcontrast --only "AA contrast"
  prove "G11 plant ytframe (a YouTube iframe before any tap)" G11 G11.cjs "$BASE" --plant ytframe --only "tutorial"
  prove "G12 plant jank (a 90 ms stall every 300 ms on /widebeam only; timing gate, ~5 min)" G12 G12.cjs "$BASE" --timing --plant jank
  prove "G13 plant script (an off-list script)" G13 G13.cjs "$BASE" --engines chromium --plant script --only "0 CSP"
  prove "G1 against the wrong baseline (B0 vs this build)" G1 G1.cjs "$BASE" --baseline "$HERE/baseline-B0" --engines chromium --sizes L1141 --skip-verify
  echo "Gates that fail on the unfixed page by themselves (plan §7 numbers): run-gates.sh $BASE and read the FAIL rows of G3-G10."
  exit 0
fi

SUF=""
run G0 G0.cjs "$BASE" --engines "$ENG"
[ -n "$FXOPEN" ] && { SUF=-open; run G0 G0.cjs "$FXOPEN" --phase open --engines chromium; SUF=-released; [ -n "$FXREL" ] && run G0 G0.cjs "$FXREL" --phase released --engines chromium; SUF=""; }
run G1 G1.cjs "$BASE" --engines "$ENG"
run G2 G2.cjs "$BASE"
FXARG=""; [ -n "$FXYT" ] && FXARG="--fixture $FXYT"
run G3 G3.cjs "$BASE" --engines "$ENG,firefox" $FXARG
run G4 G4.cjs "$BASE" --engines "$ENG"
run G5 G5.cjs "$BASE" --engines "$ENG"
run G6 G6.cjs "$BASE" --engines "$ENG"
# the page's own script blocked on the production build too (there it is one /_astro/hoisted.<hash>.js, read from the page): r-gates-initblock
[ -n "$PROD" ] && { SUF=-prod; run G6 G6.cjs "$PROD" --engines "$ENG" --only "init blocked"; SUF=""; }
run G7 G7.cjs "$BASE" --engines "$ENG"
run G8 G8.cjs "$BASE" --engines "$ENG"
run G9 G9.cjs "$BASE" --engines "$ENG"
run G10 G10.cjs "$BASE" --engines "$ENG"
PRODARG=""; B11=$BASE; [ -n "$PROD" ] && { B11=$PROD; PRODARG="--prod"; }
run G11 G11.cjs "$B11" $PRODARG
run G12 G12.cjs "$BASE"
run G13 G13.cjs "$BASE" --engines "$ENG" $FXARG
echo "[$(date +%T)] done -> $OUT" >&2
node Gsum.cjs "$OUT" $WIDE
