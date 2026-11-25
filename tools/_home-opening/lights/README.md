# The loading screen: the lights come on

Dan, 2026-11-09: while the visitor loads the homepage, "the amount of loading = a dark room turning into a lit room, as
if someone turned on the light ... I want it to feel real." His picks: **garage switch** (the order below), **pure
progress** (each light comes on when its part of the load is done), **short after the first** (the full show on the
first visit of a session; after that soft rises, no flicker).

## What the visitor sees

1. Black, then the eyes get used to the dark: the night through the door, the car's red tail lights, the vending
   machine and the GAS globes (their own circuit), the REVAUDIO sign (its own circuit too, lit from the first frame:
   Dan 11-11, "the sign ... is not in the beginning of the loading screen"), a faint camera grain (Dan 11-09: less noise).
   The sign does not wait for the eyes: it is its own picture (`assets/lights/sign.webp`), on at full strength from the
   first painted frame, and the dark room fades up over it (Dan 11-18: "in the loading screen I still don't see
   RevAudio": inside the dark room's picture it faded up from black with it, readable only after 0.6 to 0.8 s).
2. The TV at the end of the aisle comes on first (Dan 11-09: "the small lcd screen to light up first"): standby, the
   backlight on a dark panel, the picture; its glow on the end wall, the desk and the wet floor. Its picture is drawn
   per screen width (`bank-1@1141x636.webp` ...), the one the room's TV will show (CAPS), so the hand-off is the same.
3. The shop light by the door: its ends glow, it tries twice, it strikes.
4. The violet strip buzzes on, then the magenta one: the room appears (the exposure catches up: a short overexposure).
5. The four hanging lamps warm up, front to back toward the TV (the trouble light and the clamp lamp with theirs).
6. The gear: the plugins' objects (their displays and dials), the racks' LEDs and meters, the floor strips.
7. The live room takes over (the same picture). Then the big line.

## How it works

- `window.LIGHT_BANKS` (in room.html's stage markup) is the one list: order, id, kind (`tube` / `neon` / `bulb` /
  `gear`), the lit props on its circuit, its share of the fill (`w`). The 3D reads it too (`BANKS`, `LV`). The live
  room always has every bank on.
- `lights/render.mjs` renders the room at walk 0 with the first k banks on (`room.html?capture=0&lights=k`, k = 0..9;
  the TV off, nothing moving), and `lights/layers.py` turns them into `base.webp` (the dark room) and `bank-<k>.webp`
  (bank k's own light: room k minus the sum so far as encoded, never below 0). 2560x1080, one wide shape for every
  laptop like the still (object-fit cover: the room's view is as tall on every screen, so only the sides are trimmed).
- The pictures come in sets, one per kind of screen (2026-11-20): `window.LIGHT_SETS` in room.html names each set's
  folder (`assets/lights/<set>/`) and the screen it is drawn for. The look draws the room small and scales it up, so
  how sharp the live room is depends on the rows of its drawing buffer (the screen's height x the room's pixel ratio,
  `roomRatio`): 1113 rows on a 1141x636 @2x laptop, 1080 on a 1920x1080 @1x screen, 1520 at 1440x900 @2x. One set for
  all of them was right for the first two and too soft for the third: the room snapped into focus at the hand-off on
  the 1440 to 1512 wide retina laptops. Now `1141` (drawn as a 1141x636 @2x screen draws the room; it serves
  1920x1080 @1x too: 612 against 594 rows of room) and `1440` (as 1440x900 @2x: the retina laptops, 1440p and 4K
  screens). `lights-on.js` takes the set nearest this screen's rows; `render.mjs` renders every set
  (`&flat=<w>x<h>@<dpr>`) and writes the sign's picture from the room's own numbers (the lit word's box).
  25 files, 715 KB in the repo; a visit loads one set and one TV picture: 315 KB (`1141`) or 347 KB (`1440`).
- `lights/lights-on.js` stacks them with `mix-blend-mode: plus-lighter` (light adds: every step is the room as
  rendered) and plays each bank's opacity by its kind. Opacity only, so the compositor plays it while the 3D compiles.
- room.html reports the load (`loaded(phase)`): textures by count, models by bytes, the GPU uploads by count, the
  shader compile; `LOADW` = each phase's share of a cold visit (measured). Bank i comes on at (i + 1) / 10.
- Hand-off: the live room renders its first frame with every bank on and the TV off under the pictures; once the last
  bank has settled, the pictures fade (0.5 s), the walk unlocks, the big line comes in 0.4 s later, the sway and the
  dust come in over 2.5 s. The big line never shows before the hand-off (reduced motion too), and a wheel turned early
  brings it in over 0.3 s, not in one frame. The live room's own clock starts at the hand-off (room.html `liveClock`):
  the neon's dip, the sign's stutter and the dying tube keep quiet for its first 3 s and then fall at this visit's own
  moments, and the traffic light starts on the red the pictures show.
- Flashes: one at a time across the room, the next at least 400 ms after (2.5 a second; WCAG 2.3.1 allows 3, the
  room's rule since 11-04). Reduced motion and the second visit of a session: soft rises, no flicker, no flare.
- The room's look (room.html `LOOKS`, `LOOK_DEFAULT`: VHS since Dan's pick, 2026-11-18): the pictures are rendered in it
  (`&flat`), without the three marks that sit on the screen rather than in the room: the vignette, the scanlines and the
  grain. The loading screen lays the vignette and the scanlines over them itself (`.lo-look`, room.html `lookOverlay`),
  multiplied like the finish multiplies them, in the screen's own CSS pixels; the grain is the loading screen's own.
  The look's lower resolution is drawn as the set's own screen shows the pictures (`object-fit: cover`; the sets,
  above). `?look=today` shows today's room over these (VHS) pictures: a comparison switch, not a visitor's page.
- The slow-connection still (`#still`, `assets/still/room-2560.webp`) is gone from room.html: the loading screen is the
  slow path now. `still.mjs` and its picture are left for whoever still uses them.

## When the room changes

**The rule (Dan 2026-11-11: "lets always chack it if the loeading screen matches the finel page"):** every change that
shows in the room at walk 0 (a model, a material, the car's look, a light, a moved prop, the TV picture) makes the
loading pictures stale. Before the room is pushed or shown to Dan as done, `lights/check.mjs` must print PASS (it exits 1
on FAIL); if it fails, re-render and check again. Never ship a room whose check failed or did not run.

Re-run the pictures (like still.mjs), then the checks:

    python3 -m http.server 4471 --bind 127.0.0.1        # from the worktree root
    node tools/_home-opening/lights/render.mjs --port 4471 [--check]
    node tools/_home-opening/lights/check.mjs --port 4471                              # 1141x636 @2x: must PASS
    node tools/_home-opening/lights/check.mjs --port 4471 --w 1440 --h 900 --dpr 2     # the other set
    node tools/_home-opening/lights/check.mjs --port 4471 --w 1920 --h 1080 --dpr 1

The check's sharpness line is not blurred (the gate is, 4 px, and cannot see a hand-off that snaps into focus): how
sharp the loading picture is against the live room, 1.00 = the same.

A new light: put it in a bank (`props`, or a new bank in `LIGHT_BANKS` and its lines in `lightRoom`), re-render.
A new skin = new pictures from the same script.

## Checks (2026-11-20, real Chrome, the seam round: the sign back at its place, two sets, the sign's own picture)

- Hand-off at 1141x636 @2x (set `1141`): blurred mean 2.12, p99 8, worst area 6.2: PASS. Not blurred, loading picture
  against live room: strong edges 0.93, fine detail 0.78 (the one old set: 0.92 and 0.77).
- 1440x900 @2x (set `1440`): 2.49, 10, 7.0: PASS (the one old set failed there: p99 22). Strong edges 0.92, fine
  detail 0.75 (the one old set: 0.79 and 0.66, the focus snap at the hand-off).
- 1920x1080 @1x (set `1141`): 2.00, 9, 7.5: PASS. Strong edges 1.00 (0.98); the fine detail reads 0.45 there with
  either set: at 1x it measures the live capture's grain, not the picture.
- The layers vs the full room: mean 3.14, p99 14 (`1141`) and 3.42, p99 16 (`1440`). 25 files, 715 KB.
- The sign, a cold visit at 40 Mbit/s, 1141x636 @2x and 1440x900 @2x: lit at full strength in the first painted frame
  (about 0.3 s after the click; 165 against 12 for the wall round it). Before: 0 in that frame, 10 after 0.3 s more,
  46 after 0.6 s.
- Cold 40 Mbit/s: textures 2.0 s, models 5.1 s, uploads 5.8 s, compile 6.0 s; the banks at 0.8 · 1.2 · 1.7 · 2.4 ·
  3.3 · 3.7 · 4.0 · 4.5 · 5.1 s, hand-off 6.1 s; no page errors.

## Checks (2026-11-18, real Chrome, the faster room in VHS, pictures re-rendered with `&flat`)

- Hand-off at 1141x636 @2x: blurred mean 2.17, p99 12, worst area 5.4: PASS (today's room: 3.30, 15, 12.5).
- 1440x900 @2x: blurred mean 3.24, p99 22, worst area 8.3: FAIL on p99 alone (the pictures are softer there). Today's
  room fails there too, by more: 5.51, 24, 30.3.
- 1920x1080 @1x: 2.53, 17, 10.8: PASS (today's: 2.71, 9, 7.2).
- The layers vs the full room: mean 2.95, p99 14. 12 files, 313 KB (were 441 KB).

## Checks (2026-11-11, real Chrome, the room with Dan's car look, `5efaf80` + this render)

- Before the render (pictures one round old): blurred mean 4.52, p99 43, worst area 26.9: FAIL (Dan saw it: "the
  picture not matching the 3d asset in all of the page").
- After: blurred mean 3.28, p99 15, worst area 12.4 (the wet floor): PASS. The layers vs the full room: mean 4.10, p99 22.
- The gate's limits (`layers.py --diff ... gate`): blurred mean 3.8, p99 20, worst area of a 16 x 9 grid 17.

## Checks (2026-11-10, real Chrome, the room at 064d8b9)

- Hand-off at 1141x636 @2x: blurred mean 3.3 levels, p99 14; layers vs the full room mean 3.9, p99 20.
- Cold 40 Mbit/s: textures 2.2 s, models 7.3 s, uploads 8.6 s, compile 8.8 s (the room grew: batches 5-7); the
  banks at 1.0 · 1.5 · 1.8 · 3.2 · 4.7 · 5.3 · 6.0 · 6.6 · 7.9 s, hand-off 8.8 s; no page errors. (Measured shares
  0.25 / 0.58 / 0.15 / 0.02 against LOADW's 0.34 / 0.52 / 0.11 / 0.03: close enough, the Mac was loaded.)

## Checks (2026-11-09, real Chrome)

- Two captures of the full room: 0.00 levels apart (the captures are still, so the layers hold only light).
- The encoded layers added up vs the full room: mean 2.3 levels per channel, +1.25 bias.
- The hand-off at 1141x636 @2x (under the nav, clear of the bench button): blurred 4 px (light and place) mean 2.9
  levels, p99 12; sharp mean 4.6 (edge resampling: the pictures are 2560 wide, the live room 2282 device px). With
  the TV first (round 2): the TV shows the same picture in both.
- A cold first visit at 40 Mbit/s (no cache): phases end at textures 2.2 s, models 5.5 s, uploads 6.7 s, compile 6.9 s;
  the banks came on at 1.0 · 1.5 · 1.9 · 3.1 · 4.0 · 4.7 · 5.0 · 6.1 s, hand-off 7.1 s; no page errors.

## Try it

- `room.html?lights=demo`: a cold first visit's pace (~5.5 s) whatever the real load, always the full show.
- `?lights=calm`: the soft version (reduced motion / a second visit). `?lights=hold`: never hands off.
- `?lights=at3`: held at stage 3 (banks 1..3 on, settled): the review bench's pictures.
- A real cold visit: DevTools > Network > Disable cache + a throttle, or `check.mjs`.
