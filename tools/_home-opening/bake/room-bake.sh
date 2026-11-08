#!/bin/zsh
# Route B for the real room, end to end; with slot ids, a slot re-bake (its texels only, the rest of the atlas kept).
#   OUT=<scratch dir> PORT=4493 SAMPLES=1024 MODEL="N34:assets/models/office-chair.glb:3.5915926535897933 E01:assets/models/studio-desk.glb:0:height" ./room-bake.sh
#   OUT=... ./room-bake.sh N34            # one slot: re-export, re-pack N34 in its rectangle, re-bake its texels
# Needs the worktree served on $PORT (python3 -m http.server $PORT --bind 127.0.0.1, from the worktree root).
# Out: bake/room/{layout.json, uv1.bin, manifest.json, pack*.png, pack*.ktx2} (room.html ?light=baked reads them);
#      $OUT/{room-bake.glb, bake-scene.json, bake/*.exr, room.blend} (the scene in Blender, the float bakes).
set -e
HERE=${0:A:h}; RUN=$HERE/room
OUT=${OUT:?set OUT to a scratch folder}; PORT=${PORT:-4493}; SAMPLES=${SAMPLES:-1024}
B=/Applications/Blender.app/Contents/MacOS/Blender
PY=/Applications/Blender.app/Contents/Resources/5.2/python/bin/python3.13
KTX=${KTX:-/Users/danavivi/.local/ktx-software/4.4.2/bin/ktx}
MODELS=(); for m in ${(s: :)MODEL}; do MODELS+=(--model $m); done
ONLY=(); ONLYB=(); if [[ -n "$1" ]]; then ONLY=(--only $1); ONLYB=(only=$1); fi
mkdir -p $OUT
t0=$(date +%s)
node $HERE/room-export.mjs --port $PORT --out $OUT --runtime $RUN $MODELS $ONLY
$B -b --factory-startup -P $HERE/blender/bake_room.py -- glb=$OUT/room-bake.glb scene=$OUT/bake-scene.json out=$OUT/bake samples=$SAMPLES save=$OUT/room.blend $ONLYB 2>&1 | grep -E '^(IMPORTED|JOINED|MASK|BAKED)|Error|Traceback'
$PY -I $HERE/denoise.py $OUT/bake | cut -c1-160
$PY -I $HERE/pack.py $OUT/bake $RUN suffix=_dn | cut -c1-200
if [[ -x $KTX ]]; then  # UASTC + Zstd + mips, next to the PNGs (KTX2Loader in the page; the PNGs stay the default)
  for f in $RUN/pack*.png; do $KTX create --format R8G8B8_SRGB --assign-tf srgb --encode uastc --uastc-quality 2 --uastc-rdo --uastc-rdo-l 0.5 --zstd 18 --generate-mipmap $f ${f:r}.ktx2; done
  ls -l $RUN/*.ktx2
fi
echo "room-bake done in $(( $(date +%s) - t0 )) s"
