#!/bin/zsh
# The OBDTUNE page's garage stills (2026-11-27): the home page's 3D room seen from the desk the tool stands on.
# The room is feat/phone-dive @ 14ba0ff (tools/_home-opening/room.html), never edited: serve a DETACHED worktree of it.
#   git worktree add --detach .claude/worktrees/room-render-obd 14ba0ff
#   (cd .claude/worktrees/room-render-obd && python3 -m http.server 4761 --bind 127.0.0.1)
#   zsh tools/obdtune-garage/shots.sh <out dir>      (real Chrome with the GPU; ONE render at a time: parallel runs come out black)
# render.cjs takes the camera over (position.set / rotation.set made no-ops, lookAt + a view offset), so the tool's body
# base B lands at its box (0.63, 0.90) in a 2156 x 1232 frame whose box is 560 px tall at left 672, top 336 (in tool
# heights: box 0.852 x 1 at 1.2 / 0.6 of a 3.85 x 2.2 frame = obdtune.css .obd-garage). &flat=800x1600@1.75 draws the
# VHS look at full density (the home room's pixels per CSS px on a laptop). post.py: focus falls off away from the tool,
# the column's side drops into shadow with its highlights rolled off, a light vignette; render pixels only.
# Then: cp <out>/a-post.jpg src/assets/obdtune/garage-a.jpg (etc.). Lights settle: two shots 4 s apart differ < 1 %.
set -e
cd "$(dirname "$0")"; OUT=${1:?out dir}; mkdir -p $OUT
export NODE_PATH=${NODE_PATH:-/Users/danavivi/projects/revaudio/revaudio-website/node_modules}
F='"W":2156,"H":1232,"boxL":672,"boxT":336,"Tpx":560,"flat":"800x1600@1.75"'
# A the workbench L09 (end of the bench under the clamp lamp N12, the cable over the edge); B the test-drive desk W07
# (front edge, in front of the guitar N16); C the mixing desk E01 (between the RevLimiter console M03 and the synth E04)
(cd $OUT && node $OLDPWD/render.cjs '{"name":"a","B":[-2.70,0.92,13.80],"T":0.40,"yaw":4,"camY":1.40,"fov":30,'"$F"'}')
(cd $OUT && node $OLDPWD/render.cjs '{"name":"b","B":[-2.68,0.75,6.75],"T":0.40,"yaw":10,"camY":1.25,"fov":30,'"$F"'}')
(cd $OUT && node $OLDPWD/render.cjs '{"name":"c","B":[-0.25,0.85,1.38],"T":0.40,"yaw":90,"camY":1.40,"fov":30,'"$F"'}')
for n in a b c; do python3 post.py $OUT/$n.png $OUT/$n-post.jpg; done
