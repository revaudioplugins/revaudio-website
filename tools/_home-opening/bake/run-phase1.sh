#!/bin/zsh
# Phase 1 end to end: build the test room, bake each group alone, denoise, pack, export, render Blender's reference,
# capture test.html, compare. Big outputs go to $OUT (not the repo); the page's small assets to bake/test-room/.
#   OUT=<scratch dir> PORT=4493 SAMPLES=1024 REF_SAMPLES=2048 ./run-phase1.sh
# Needs the worktree served on $PORT:  python3 -m http.server $PORT --bind 127.0.0.1  (from the worktree root)
set -e
HERE=${0:A:h}
OUT=${OUT:?set OUT to a scratch folder}
PORT=${PORT:-4493}; SAMPLES=${SAMPLES:-1024}; REF_SAMPLES=${REF_SAMPLES:-2048}
B=/Applications/Blender.app/Contents/MacOS/Blender
PY=/Applications/Blender.app/Contents/Resources/5.2/python/bin/python3.13
mkdir -p $OUT
$B -b --factory-startup -P $HERE/blender/build_test_room.py -- out=$OUT/test-room.blend
$B -b $OUT/test-room.blend -P $HERE/blender/bake_groups.py -- out=$OUT/bake samples=$SAMPLES
$PY -I $HERE/denoise.py $OUT/bake
$PY -I $HERE/pack.py $OUT/bake $HERE/test-room suffix=_dn
$B -b $OUT/test-room.blend -P $HERE/blender/export_gltf.py -- gltf=$HERE/test-room/test-room.gltf ids=$OUT/surface-ids.png info=$OUT/camera.json
$B -b $OUT/test-room.blend -P $HERE/blender/render_reference.py -- out=$OUT/renders samples=$REF_SAMPLES
node $HERE/parity.mjs $OUT/capture port=$PORT browsers=chrome,webkit perf=1
for br in chrome webkit; do
  $PY -I $HERE/compare.py $OUT/renders $OUT/capture/$br $OUT/surface-ids.png $OUT/compare-$br
  python3 $HERE/sidebyside.py $OUT/compare-$br
done
