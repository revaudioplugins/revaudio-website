# Both site players: toy first, mixer under the hood (plan, 2026-10-12)

Owner: Claude Code `revaudio-c7` (Yoni's laptop). Status: PLAN, waiting for Yoni's "go".
Files this work will touch: this plan, `bench/station-mixer-bench.html`, `bench/gas-mixer-bench.html`,
`tools/station-mixer/*`, `tools/gas-mixer/*`, `public/station-mixer/`, `public/gas-mixer/`,
the "Hear it" intro lines in `src/pages/[slug].astro` and `src/pages/gas*` (wherever `<gas-mixer>` sits).
Not touched: `tasks/handoff.md` + `tasks/pagespeed-plan-2026-10.md` (uncommitted, another session's), root `HANDOFF.md`.

Request (Yoni): "redesign the radio roulette & GAS a/b players. texts more clear, design user friendly ... like a toy,
fun to use, same vibe, creative and cool".

## Why (what the live players get wrong, checked 2026-10-12 on revaudio.net, desktop 1440 + phone 390)

- Too many controls at once: Radio Roulette ~45, GAS ~20. Law 6: few controls, one hero. Today nothing is the hero.
- The before/after (the whole point) is a small lever per row (RR) or a small GAS button.
- 6 sticky notes + 8 red circles: the tutorial competes with the player.
- Jargon: DRY · RADIO, S / M, ARM, ON THE MASTER, SPIN, COUNTER, GAS VOICE FUZZ.
- Two "go" buttons: the round red START (= download) looks like play; PLAY sits small in the deck corner.

## Decisions (Yoni, 2026-10-12)

1. **Toy + hood.** Visitors see one big toy; the full mixer stays behind an **OPEN THE HOOD** lever, relabelled in
   plain words. Desktop and phone open on the same toy.
2. **GAS hero = accelerator pedal.** Push down in 5 detents 0 2 4 6 8 (the existing renders), big fuel gauge follows,
   check-engine lamp at the floor (8). Pedal up = the original. Pedal stays where you leave it (no spring back).
3. **RR hero = flick-the-dial.** Big glass tuning dial: flick -> needle sweeps with ratchet ticks, slows like a
   roulette wheel, lands on a station. Preset keys 1-5 under it pick directly. RADIO OFF / ON power knob = before/after.
4. **Subtle UI sounds: yes.** Tuning static between stations, key clunk, pedal click. Very short, quiet, only while
   switching, never under the music. The music itself stays the real renders (copy still says "no tricks").

## Shared toy rules (same garage)

- **The display talks:** `YOU'RE HEARING: ORIGINAL` / `RADIO ROULETTE · STATION 3` / `GAS · 6`.
- **Next-step lamp replaces the notes:** the next thing to touch glows (PLAY -> before/after -> dial/pedal); one
  short hint on the display at a time. No sticky notes on the toy (the hood may keep one small note).
- **PLAY is the biggest key.** STOP beside it, smaller.
- **Download = a painted plate**, not a round red button: "Get Radio Roulette — free for 30 days" / "Get GAS free".
- **Words:** DRY -> ORIGINAL · S -> ONLY THIS · M -> MUTE · ARM -> "+ RevLimiter (louder, glued)" · voice
  (FUZZ / TAPE) -> a small tag inside the hood only.
- **Toy audio:** one station / one GAS step for the whole beat (each loop's own render at that number), the engine
  of today's phone player: only ORIGINAL + the current setting decoded (the iPhone memory rule stays).
- Motion is feedback only (design-language §3): needle ease-out ~450 ms, key snap ~120 ms with the house overshoot,
  pedal tracks the hand 1:1 while dragging.

## Design spec (step 1)

Build route: the toy lives INSIDE each existing bench (one file, one sound engine, so `export_component.py` keeps
working). New top-level `#toy` view; today's `#fit` stage becomes the hood (desktop only, hidden until opened). The
toy drives every loop together, like today's phone player (`masterLever`, `setAll`). Phones see the toy only; the
hood lever there reads "Full mixer on a computer". Two arrangements of the same parts: desktop landscape
(design width 1100, scales down), phone portrait (design width 380, scales to the column).

### Radio Roulette toy: "Flick the dial"

| Radio part | Job |
|---|---|
| Dial glass (cut from the real RR plate) | HERO. Scale = ORIGINAL · 1 · 2 · 3 · 4 · 5 (stations, not bars). Red needle = where you are tuned. Click a number = tune there. Drag the needle = tune by hand (static while between stations, snaps on release). |
| FLICK knob (today's SPIN knob, bigger) | Flick it: the needle whips across the glass with ratchet ticks, slows like a roulette wheel, lands on a random station (never the same one twice). |
| Preset keys 1-5 (the plate's keys, XL) | Pick a station directly. The lit key = the station playing. |
| POWER knob + ON AIR lamp | Before/after. OFF = the original track, ON = through Radio Roulette. ON AIR glows while it is on. |
| PLAY / STOP piano keys (XL) | Start / stop. PLAY is the biggest key on the panel. |
| Readout line in the glass | Talks: what you hear + the next step. |
| Painted CTA plate | Download. |
| Hood latch (pull handle) | Opens today's 4-track mixer below the toy. |
| + RevLimiter toggle (ARM plate, small) | Browser preview on the master (Yoni's existing call). |

Desktop layout (1100 design px):
```
.----------------------------------- chrome bezel ------------------------------------.
| YOU'RE HEARING                                                              ( ON AIR ) |
| [ ORIGINAL ...... 1 ...... 2 ...... 3 ...... 4 ...... 5 ]  dial glass     .-------.    |
| [                 |needle                              ]                | FLICK |    |
| [  RADIO ROULETTE · STATION 3      flick the dial ->    ]                '-------'    |
|----------------------------------------------------------------------------------- |
|  [ > PLAY ][ STOP ]      [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ]          RADIO  (POWER) OFF/ON  |
|----------------------------------------------------------------------------------- |
|  [ARM] + RevLimiter        [ Get Radio Roulette - free for 30 days ]   [=] OPEN THE HOOD |
'---------------------------------------------------------------------------------------'
```
Phone: glass on top, PLAY/STOP + POWER in one row, keys row, FLICK, CTA, footer.

Copy (every visible word):
- Section intro (page): "Press **play**, then turn the radio **on** and flick the dial. Real Radio Roulette renders, no tricks."
- Glass top label: `YOU'RE HEARING`
- Glass big line: `PRESS PLAY` (before) · `TUNING IN 42%` (loading) · `ORIGINAL` · `STATION 3`
- Glass hint line, one at a time, in order of the next-step lamp:
  1. `PRESS PLAY` (PLAY lamp breathes)
  2. after 2 bars the radio comes on by itself -> `THAT'S RADIO ROULETTE. TURN IT OFF TO COMPARE` (POWER lamp)
  3. after the first compare -> `NOW FLICK THE DIAL` (FLICK lamp)
  4. after the first flick -> `PICK A STATION, 1 TO 5` (keys lamp), then no more hints
- Under the POWER knob: `OFF = ORIGINAL` / `ON = RADIO ROULETTE`
- FLICK knob label: `FLICK` (engraved script, as SPIN today) + small `random station`
- ARM: `+ RevLimiter` / `louder, glued`
- CTA plate: `Get Radio Roulette` / `FREE FOR 30 DAYS` / `Windows & Mac`
- Hood latch: `OPEN THE HOOD` / `the full 4-track mixer` (open: `CLOSE THE HOOD`)
- Hood mixer: columns `track · volume · original / radio · station · level · only this · mute`; S -> ONLY THIS,
  M -> MUTE; the lever's lower label `original`; master lever `radio on, all tracks / original`; the 6 notes cut to
  ONE note: "Every track has its own 5 stations. ONLY THIS = hear one track. MUTE = drop it."

### GAS toy: "Step on it"

| Car part | Job |
|---|---|
| Accelerator pedal in a rubber-matted footwell | HERO. 5 detents 0 2 4 6 8 (the real renders). Drag down / click a mark / wheel / arrow keys. Hinged at the floor: pressing tilts the pad away and the shadow shortens. Stays where you leave it. 0 = the original. |
| Big FUEL gauge (the GAS fuel gauge art, large) | Shows the pedal: E = 0 (original) ... F = 8. Needle swings with weight. |
| Check-engine lamp | Lights at 8 (floor). |
| BEFORE / AFTER bat toggle | Instant compare: BEFORE = original at once, AFTER = back to your pedal step. |
| PLAY / STOP piano keys (XL) | Same as RR. |
| Amber LCD | Talks (same rules as the RR glass). |
| Porcelain gas-station sign | Download. |
| Hood latch | Opens today's 3-track mixer. |
| + RevLimiter toggle | As RR. |

Desktop layout:
```
.------------------------------- worn brass frame, walnut ---------------------------------.
|  .--------------------.        .------------ LCD ------------.                           |
|  |  E    1/2    F     |        | YOU'RE HEARING  GAS 6       |        BEFORE | AFTER     |
|  |      FUEL  needle  |        | push the pedal all the way  |          [bat toggle]     |
|  '--------------------' (CHK)  '-----------------------------'                           |
|  [ > PLAY ][ STOP ]           footwell: .-------.  8 -                                    |
|                                         | pedal |  6 -                                    |
|                                         |  ///  |  4 -   detent marks on the rail         |
|                                         '-------'  2 -                                    |
|                                                    0 - ORIGINAL                           |
|  [ARM] + RevLimiter        [ porcelain sign: Get GAS free ]          [=] OPEN THE HOOD     |
'-------------------------------------------------------------------------------------------'
```
Copy:
- Section intro: "Press **play**, then step on the **pedal**. Real GAS renders, loudness-matched: you hear the
  colour, not just louder."
- LCD: `YOU'RE HEARING` + `PRESS PLAY` / `FILLING UP 42%` / `ORIGINAL` / `GAS 2` ... `GAS 8`
- Hints in order: `PRESS PLAY` -> (after 2 bars the pedal goes to 6 by itself) `THAT'S GAS. FLIP TO BEFORE TO
  COMPARE` -> `PUSH THE PEDAL ALL THE WAY` -> at 8 `FLOORED! CHECK ENGINE`; then none.
- Rail marks: `0 ORIGINAL` · `2` · `4` · `6` · `8`
- Toggle: `BEFORE` / `AFTER`
- Sign: `GET GAS` / `FREE` / `Windows & Mac`
- Hood: as RR, `the full 3-track mixer`; GAS VOICE tag stays only in the hood, written `voice: fuzz`.

### UI sounds (both, Web Audio, synthesized: no files)
- Tuning static: band-passed noise, ~-30 dB under the music, only while the needle is between stations (<= 250 ms).
- Ratchet tick: 4 ms click per station mark the needle passes during a flick.
- Key / toggle clunk: 25 ms low thump. Pedal detent: soft click; floor (8): a slightly heavier thunk.
- Never while stopped except the clunks; never on the music path (separate gain -> destination, not through
  RevLimiter).

### Art to generate (OpenAI gpt-image-1, house light upper-left, wear, transparent background)
- GAS: accelerator pedal x2 candidates (`accel-pedal-a` rubber pad on a chrome arm, `accel-pedal-b` hot-rod
  chrome foot pedal with rubber ribs), `floor-rubber` (ribbed rubber mat, tileable), `bat-toggle` (chrome
  bat-handle toggle on a round bezel), `porcelain-sign` (blank 1950s porcelain gas sign), `hood-latch`.
- RR: `onair-lamp` (blank red glass lamp in chrome bezel), `rr-plate-cta` (blank red enamel badge with chrome
  rim), `hood-latch` (shared look). Dial glass, keys, knobs = the existing RR plate art (same garage).

## Steps

- [x] 1. 🤖 Short design spec per toy in this file: part -> function table, hero, layout ASCII, every line of copy.
- [x] 2. 🤖 New art generated with OpenAI (Yoni 2026-10-12: "use cool assets generate with open ai"; gpt-image-1 via
      `tools/*/gen_assets.py`, key `tools/.openai_key.local`, then `process_gen.py`), photoreal, house light upper-left,
      wear: accelerator pedal (+ press frames), tuning-dial glass + needle, RADIO power knob, painted download plates.
      Generate several candidates per part, pick the best in the bench.
- [x] 3. 🤖 RR toy in `bench/station-mixer-bench.html` (toy on top, hood lever reveals today's mixer).
- [x] 4. 🧑 Yoni reviews the RR toy bench (look, feel, words, sounds).
- [x] 5. 🤖 GAS toy in `bench/gas-mixer-bench.html`, same pattern (built before step 4 so both are reviewed together).
- [x] 6. 🧑 Yoni reviews the GAS toy bench (2026-10-14: "push those ones to the website and deploy"; no pick made, so
      pedal A ships, hard-wired in the bench; `accel-pedal-b.png` stays in `bench/assets/` if B is wanted later).
- [x] 7. 🤖 Hood pass on both mixers: plain words, notes cut to one, START -> plate.
- [x] 8. 🤖 Export both components, `npm run build`, test `dist/` under the live CSP + X-Frame-Options, phone width
      390, no console errors, keyboard reachable (Tab / Space / arrows on dial + pedal).
- [x] 9. 🤖 Commit by path; deploy via a fresh worktree off origin/main. 🧑 "push" = live.

## Verify (how we know it worked)

- A first-time visitor gets sound and hears before/after in 2 taps (PLAY, then the switch).
- Every visible word reads without knowing audio jargon.
- Phone: no crash, toy fills the column, same toy as desktop.

## Bench round 1 (2026-10-13)

Built (served from `bench/`: `python -m http.server 8794`):
- `http://localhost:8794/station-mixer-bench.html`: the RR toy on top, the hood (today's mixer) below its latch.
- `http://localhost:8794/gas-mixer-bench.html`: the GAS toy (pedal A); `?pedal=b` = the chrome bare-foot pedal.
- Art (gpt-image-1, `tools/*/gen_assets.py`, trimmed by `tools/gas-mixer/process_toy.py`): accel-pedal-a/b,
  floor-rubber, bat-toggle, porcelain-sign, hood-latch (both players), onair-lamp, rr-plate-cta, fuel-gauge-xl.
- The old phone players are gone: the toy IS the phone player (same engine rule: only the original + the current
  setting decoded). Phones get no RevLimiter preview (the GAS rule, now both).

Verified in headless Edge (playwright-core, `bench_shot.js` in the session scratchpad), 1440 and 390 wide:
- RR: PLAY -> ORIGINAL, radio on by itself after 2 bars (STATION 1), OFF -> ORIGINAL, FLICK lands on a NEW station
  (flick from 1 landed on 2), key 3 -> STATION 3, hood opens. `__smxDebug` showed only `dry + current` decoded.
- GAS: PLAY -> ORIGINAL, GAS 6 by itself after 2 bars, BEFORE -> ORIGINAL with the pedal kept at 6, a pedal press
  -> GAS 8 (floored: CHECK ENGINE lamp, needle to F, hint), rail 0 -> ORIGINAL, rail 8 -> GAS 8. `__gmxDebug` ok.
- Next-step glow + hints move PLAY -> compare -> flick/pedal -> keys/floor. No console errors (only the bench's
  missing favicon 404).
- Fixed on the way: glow invisible with `mix-blend-mode:screen` (plain alpha layer works); hint text lagging after
  OFF; a flick could land on the same station; GAS pedal click counted from 0 on BEFORE instead of from where the
  pedal visibly is.

Not verified yet: real ears on the UI sounds (static / ticks / thumps levels), real phone (iPhone Safari), Firefox,
real-speed motion (headless throttles frames). Page placeholders updated in `[slug].astro` + `gas.astro` (new
intro lines + toy shapes); site not built yet.

## Ship (2026-10-14, Claude Code `revaudio-12`)

- Worktree `../revaudio-website-toy` (branch `players-toy-deploy` off origin/main `ee84c0b`), `81a00e0` + `c4f08e6`
  cherry-picked clean. `bench/assets` and `node_modules` are junctions into the main clone (art is gitignored there).
- `tools/gas-mixer/export_component.py` did not know the toy art (assert: "images referenced but not exported"):
  8 images added to `IMGS` at 2x display size (WebP). Any new bench image needs a line there before export.
- `npm run build` clean. `dist/` served with the live CSP + X-Frame-Options headers, headless Edge, 1440 + 390:
  both toys render, no broken images, no horizontal scroll, PLAY -> ORIGINAL -> STATION 1 / GAS 6 by itself after
  2 bars. Only console error: the Cloudflare insights beacon (offline, not ours).
- Still unverified: real ears on the UI sounds, a real iPhone, Firefox.
