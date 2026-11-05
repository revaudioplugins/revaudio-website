# Layout kit: arrange the long garage with everything the bench can do

For the three room designers (Dan, 2026-11-05): "let them organize the room in size, objects, everything that a bench
can do; the user should have a wow effect when he comes in the website; understand this is a plugin company that
references cars for their plugins."

## The room

RevAudio sells audio plugins, each drawn from a car: RevLimiter is a limiter drawn as an RPM gauge (the redline is the
threshold), GAS 2 a master-bus colour drawn from a gas station's fuel, DRIFT a panner named for the drift, Radio
Roulette a random multi-effect drawn from a car radio, RevFX a rack of effects. The homepage line is "BUILT LIKE CARS.
Step inside." The homepage hero is this room: a long garage that doubles as the studio where the plugins are made.
Scrolling walks the camera down the aisle to the TV on the far wall, which shows the live site, and the walk locks
onto it.

- The skeleton: `tools/_home-opening/room.html` (Three.js). Grey labelled blocks are placeholders for real models.
  You are arranging the SET: composition, scale, depth, light, the reveal along the walk. Textures come later.
- The look and its rules: `tools/_home-opening/look-spec.md` (read it first). Dan's one line: "I want it to feel
  like we making plugins". The must-stay list is in it.
- Dan's references: `tools/_home-opening/look-board.json` (what he loved, with what to take from each).

## What you can change (exactly what the bench changes)

A layout is one JSON object, the bench's "Copy settings" format. Start from `start-layout.json` (Dan's room today).

1. **Settings** (`catalog.json` → `settings`, each with its range): the room's width / height / length, floor,
   mess, acoustics, wood tone, lens, walk length / ease / feel, sway, the TV's size and height, the REVAUDIO neon's
   wall / place / size / tilt, the car (along, out through the door, angle, lift type and height), the door, the
   outside light, LEDs, screens, neon, lamps, TV glow, bloom, haze, dust. Stay inside each range.
2. **Per-object moves** in `moves`: `{ "<id>": { f, x, y, s, r, side } }`, only the fields that object allows
   (`catalog.json` → `items[].moves`):
   - `f`: along the room, share of `L.span` (14.4 m) from the far end wall (0 = the far wall; the camera starts near
     f 1.28). Far-end objects (mount `end`) have no `f`.
   - `x`: across, metres (0 = the middle of the aisle, negative = the left wall).
   - `y`: the object's centre height, metres.
   - `s`: size, 0.4 to 2.5 (keep real-world scale, about 0.8 to 1.25, unless it's a deliberate hero).
   - `r`: turn, degrees.
   - `side`: -1 / 1, which wall (wall pieces).
   `catalog.json` lists every object: id, label, size in metres, centre, `f_now`, which fields move it.
3. Nothing else: no new objects, no code, no files outside your own folder. `mess` sets how much loose clutter is
   scattered. To bring an object into the light or out of the way, move it; you can't delete it.

## The rules

- Must stay, each where it can be seen along the walk: the four plugin CRT monitors M01 RevFX, M02 DRIFT, M03
  RevLimiter (on the desk), M04 Radio Roulette (high on the right); the live TV at the end; the REVAUDIO neon; the
  car on its lift, half out the roll-up door; the drum kit and throne; the studio corner; the GAS 2 posters and the
  COMING SOON plate.
- No collisions: `check.mjs` must report `overlaps: []`. Rugs and decals may lie under things; thin wall boards
  may touch what stands in front of them. Today's room has 10 collisions; clear those too.
- Real scale, real physics: things stand on the floor or on a surface, hang on a wall, or hang from the ceiling.
  Nothing floats.
- The landing stays the TV: the walk ends with the TV filling the screen. Keep the far wall's middle clear around it.
- The look spec's light rules: night, deep blacks, light from things in the room, violet/magenta neon with amber
  lamps, no brands.

## The tools (Node, Playwright and Chrome are on this Mac)

The room is served at `http://127.0.0.1:4471/tools/_home-opening/room.html`. If that port doesn't answer, start
your own server from the worktree root (`/Users/danavivi/projects/revaudio/revaudio-website/.claude/worktrees/home-opening`)
on your own port, `python3 -m http.server <port> --bind 127.0.0.1`, pass `--port <port>` to the tools, and stop it
when you finish.

- `node layout-kit/render.mjs <layout.json> <out-dir> [--walk 0,0.2,0.4,0.6,0.8,1] [--size 1141x636] [--labels]`:
  stills from fixed walk spots (clean: no sway, dust or labels; `--labels` shows the slot labels). 1141x636 is
  Dan's laptop. Look at every still you make.
- `node layout-kit/check.mjs <layout.json>`: collisions, and how big each must-stay piece is on screen at walk
  0 / 35 / 70 / 100 % (`out of frame` or `WxHpx`).

## What to hand in (in your own folder only)

- `layout.json`: your full layout.
- `rationale.md`, 300 words at most: the idea in one line; the first screen (the wow: what the visitor sees in the
  first second and why it stops them); the reveal along the walk; what you changed and why; any trade-offs.
- `shots/`: render.mjs at the default walk spots, plus `--labels` at walk 0 and 0.5, plus one phone still
  (`--size 390x844 --walk 0`).
- `check.json`: the output of check.mjs on your final layout, with no overlaps.
