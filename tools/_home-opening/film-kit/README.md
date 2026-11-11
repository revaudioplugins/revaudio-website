# The walk film, from the set

How `assets/skins/default/film/walk.mp4` was made (2026-11-03). A new skin, a moved thing or a new room slider value
means a new film: the film must keep the set's camera and every object's place frame by frame (the live LCD and the
CRT screens are laid on it from the set's own numbers).

Run in a scratch folder (the scripts read and write `./`), with the room served on 4471 (`python3 -m http.server
4471 --bind 127.0.0.1` from the worktree root) and Playwright importable as `playwright`:

1. `node render.mjs ./src 240` renders the bare set's walk (capture mode, reduced motion), 1920x1080, frames spaced for
   an even pace on screen, plus `src/cams.json` (the camera per frame). `node render.mjs ./nomon 240 '' nomon` renders
   the same walk without the CRT monitors.
2. `node dump.mjs world.json` writes the corners of the TV face, each CRT screen and each poster in the world;
   `python3 project.py` projects them per frame (`quads.json`); `python3 filmdata.py` prints the `cam:` and `live:`
   entries for `FILM` in room.html.
3. Encode `src/` (24 fps, CRF 14) and repaint it with Kling 3.0 Omni Edit (pro, 20 credits / 10 s), the room's
   painting as the image reference: one shot, frame n = the set's frame n.
4. The image reference wins where it disagrees with the set (the CRTs vanished): extract the repaint's frames to
   `out-k1/`, `python3 comp.py` pastes the set's monitors back in (where `src` and `nomon` differ, kept to each
   monitor's box), encode `comp/` and run a second Omni Edit pass that makes them real (no image reference).
5. Encode the result for scrubbing: `ffmpeg -framerate 24 -i %03d.png -frames:v 240 -c:v libx264 -preset slow -crf 24
   -g 4 -keyint_min 4 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart -an walk.mp4`, and its frame 0 as
   `walk-000.webp` (the poster).
