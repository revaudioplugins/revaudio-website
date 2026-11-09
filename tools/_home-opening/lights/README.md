# The loading screen: the lights come on

Dan, 2026-11-09: while the visitor loads the homepage, "the amount of loading = a dark room turning into a lit room, as
if someone turned on the light ... I want it to feel real." His picks: **garage switch** (the order below), **pure
progress** (each light comes on when its part of the load is done), **short after the first** (the full show on the
first visit of a session; after that soft rises, no flicker).

## What the visitor sees

1. Black, then the eyes get used to the dark: the night through the door, the car's red tail lights, the vending
   machine and the GAS globes (their own circuit), a faint camera grain (Dan 11-09: less noise).
2. The TV at the end of the aisle comes on first (Dan 11-09: "the small lcd screen to light up first"): standby, the
   backlight on a dark panel, the picture; its glow on the end wall, the desk and the wet floor. Its picture is drawn
   per screen width (`bank-1@1141x636.webp` ...), the one the room's TV will show (CAPS), so the hand-off is the same.
3. The shop light by the door: its ends glow, it tries twice, it strikes.
4. The violet strip buzzes on, then the magenta one: the room appears (the exposure catches up: a short overexposure).
5. The four hanging lamps warm up, front to back toward the TV (the trouble light and the clamp lamp with theirs).
6. The gear: the REVAUDIO sign, the CRTs, the racks' LEDs and meters, the floor strips.
7. The live room takes over (the same picture). Then the big line.

## How it works

- `window.LIGHT_BANKS` (in room.html's stage markup) is the one list: order, id, kind (`tube` / `neon` / `bulb` /
  `gear`), the lit props on its circuit, its share of the fill (`w`). The 3D reads it too (`BANKS`, `LV`).
- `lights/render.mjs` renders the room at walk 0 with the first k banks on (`room.html?capture=0&lights=k`, k = 0..8;
  the TV off, nothing moving), and `lights/layers.py` turns them into `assets/lights/base.webp` (the dark room) and
  `bank-<k>.webp` (bank k's own light: room k minus the sum so far as encoded, never below 0). 2560x1080, one picture
  for every laptop like the still (object-fit cover). 12 files, 390 KB; a visit loads one TV picture, ~357 KB.
- `lights/lights-on.js` stacks them with `mix-blend-mode: plus-lighter` (light adds: every step is the room as
  rendered) and plays each bank's opacity by its kind. Opacity only, so the compositor plays it while the 3D compiles.
- room.html reports the load (`loaded(phase)`): textures by count, models by bytes, the GPU uploads by count, the
  shader compile; `LOADW` = each phase's share of a cold visit (measured). Bank i comes on at (i + 1) / 10.
- Hand-off: the live room renders its first frame with every bank on and the TV off under the pictures; once the last
  bank has settled, the pictures fade (0.5 s), the walk unlocks, the big line comes in 0.4 s later, the sway and the
  dust come in over 2.5 s.
- Flashes: one at a time across the room, the next at least 400 ms after (2.5 a second; WCAG 2.3.1 allows 3, the
  room's rule since 11-04). Reduced motion and the second visit of a session: soft rises, no flicker, no flare.
- The slow-connection still (`#still`, `assets/still/room-2560.webp`) is gone from room.html: the loading screen is the
  slow path now. `still.mjs` and its picture are left for whoever still uses them.

## When the room changes

Re-run the pictures (like still.mjs), then the checks:

    python3 -m http.server 4471 --bind 127.0.0.1        # from the worktree root
    node tools/_home-opening/lights/render.mjs --port 4471 [--check]
    node tools/_home-opening/lights/check.mjs --port 4471

A new light: put it in a bank (`props`, or a new bank in `LIGHT_BANKS` and its lines in `lightRoom`), re-render.
A new skin = new pictures from the same script.

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
- A real cold visit: DevTools > Network > Disable cache + a throttle, or `check.mjs`.
