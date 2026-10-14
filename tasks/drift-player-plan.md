# DRIFT before/after player: "Turbo Dash" toy (plan, 2026-10-14)

Owner: Claude Code `revaudio-02` (Yoni's laptop). Worktree `../revaudio-website-dpl`, branch `drift-player` (off
origin/main e84c597). Everything LOCAL until Yoni says "push".

Request (Yoni): a before/after player for the DRIFT page, designed like the vintage tabletop racing toys (Tomy Turbo
photo). The screen shows the waveforms of Vocals, Keys, Synth, Guitar, Percussion. Play/stop, engage a pre-rendered
DRIFT setup, bypass. One track at a time (not a mix like the RR / GAS players). DRIFT fonts + colours, "sexy like a
cool toy". Sounds come later; design first.

## Toy part -> job (Law 1)

| Toy part | Job |
|---|---|
| Steering wheel hub (DRIFT's own wheel.png) | HERO. START / STOP. The wheel turns toward where the sound sits (damped spring, max 50 deg). |
| Gear shifter (5 4 3 2 1 N) | Pick the track: 1 VOCALS · 2 KEYS · 3 SYNTH · 4 GUITAR · 5 PERC. N = stop. Shifting while playing keeps the time position. |
| DRIFT / BYPASS bat toggle | Up = DRIFT ON (the pre-rendered DRIFT file), down = BYPASS (the original). 12 ms crossfade, both files run in sync. |
| CRT (DRIFT's tv-frame-3.png) | Top: the track's waveform, L above the line, R below (BYPASS = mirror image, DRIFT = it moves). Bottom: race road; the car sits where the sound sits, smoke when it swings. Stopped = PRESS START attract screen. |
| LCD cluster | TACHO = level, SPEED = level (toy), FUEL = clip left, TRIP = time, PAN meter, DRIFT / BYPASS lamps. |
| VOLUME knob | Volume (desktop only; phones use the device volume). |

## Steps

1. [x] Bench round 1: `bench/drift-player-bench.html` (desktop 1100 design px + phone 420; placeholder sounds made in the browser, bench only).
2. [ ] Yoni reviews the look, feel, words. Fold corrections in.
3. [x] Yoni's audio (2026-10-14, `C:\shirimmmmmm`, 10 WAVs 48k/24-bit, pairs equal length): `tools/drift-player/prep_audio.py`
   -> `public/drift-player/audio/*.m4a` (AAC 160k, padded 0.25 s both sides, 2.8 MB) + `peaks.json` (21 kB).
   The DRIFT bounces were quieter (vocals/keys -1.0, synth -3.1, guitar -3.5, perc -4.8 LU), so each ORIGINAL is
   turned down to its DRIFT file's loudness (pairs now within 0.1 LU). Tracks are NOT matched to each other:
   synth -13.3 LUFS vs perc -23.7 (open question).
4. [ ] Export to a `<drift-player>` web component (like `tools/station-mixer/export_component.py`), self-hosted fonts, no iframe; mount it in the `#hear` slot (replaces DriftHeadUnit; `drift.demoMode` / `demoWholeSound` flags).
5. [ ] `npm run build`, test `dist/` under the live CSP, desktop + real phone. Push only on "push".

## Round 3 (2026-10-14): matched to the /drift page + H-pattern gearbox (Yoni: "volumes are great", "pump the design
matching the drift page", "change the gear selector to a manual gear knob of a drift car")

- Art: `tools/drift-player/gen_assets.py` (gpt-image-1, text-only prompts, no lettering) -> `bench/assets/drift-player/gen/`
  (gitignored), picks cut + sized by `tools/drift-player/process_assets.py` -> `public/drift-player/img/*.webp`:
  shell = shell-3 (Tomy silhouette, violet-black fascia, purple metal-flake candy tub; rolls 1, 2, 4 rejected),
  plate = plate-1 (gate plate, X screws), knob = knob-2 (violet ball on a knurled collar; knob-1 rejected),
  horn = horn-1 (horn pad = START / STOP), volknob = volknob-1 (flat light, so the whole knob may turn).
  gpt-image-1's "transparent" leaves a near-opaque haze; every part is re-cut with GrabCut (shell: hand-set box).
- Reused from the page: section-plate-s1 (9-sliced round the cluster, the DRIFT/BYPASS toggle, the phone dash),
  tv-frame-3 (CRT), wheel.png; page livery as live HTML (kanji chips 速度 / 音量, magenta checker, SPEED SOUNDS BETTER).
- Gearbox: H gate 1-3-5 / 2-4, N in the middle = stop. The plate is tilted in CSS 3D; the knob rides the projected
  gate, travels out to the neutral rail, across and in (~2 ms per gate px); drag is held to the slots, release snaps
  to the nearest gear (or N). A shift-pattern tag under it names the tracks and is the keyboard radiogroup.
- Phone: no shell; the page's plate is the dash, same parts stacked (screen, cluster, wheel + toggle, gearbox).

## Round 4 (2026-10-14): PLAY/STOP off the wheel, the plugin's wheel 1:1, 80s synthwave (Yoni)

- PLAY / STOP: DRIFT's own arcade caps (mm_cap_green / mm_cap_red) in a well right under the CRT (screen ->
  transport, like a console). PLAY pulses while stopped; the CRT attract says PLAY BUTTON BELOW.
- Wheel: a 1:1 copy of the plugin's (Drift Source/ui/public/index.html "steering wheel (PAN)", 5.2.10): same art
  (md5 fb8a981e), the 790 px build, the fixed light (.wlight / .wlfix counter-rotation), the live DRIFT ドリフト hub
  mark, the glow; scaled as one module. It turns with where the sound sits; grab it to steer, it springs back.
- Synthwave: striped amber -> pink -> violet sun rising behind the dash, wireframe mountains, neon grid floor that
  scrolls while it plays, neon tube rim round the toy, speed stripes on the tub, chrome italic DRIFT logo; CRT gets
  the same sun, mountains and a grid ground; tacho runs cyan -> magenta -> red.

## Round 5 (2026-10-14): 8-bit shift knob (Yoni: "extra cool gear knob ... really look digital 8 bit and fun")

- The knob is a 26 x 32 pixel sprite drawn in JS at 3.5x, `image-rendering: pixelated`: dithered violet ball lit
  upper-left (2x2 Bayer over the DRIFT palette), cyan synthwave rim light lower-right, knurled cyan pixel collar,
  the gear in a 3 x 5 pixel font on its face (N in cyan). Landing in a gear: squash + stretch, 16 pixel sparks,
  an arcade pop-up ("3 SYNTH!", stepped animation). While it plays: engine shake with the level and a pixel shine
  sweep every 2.6 s. Reduced motion: no sparks. The AI photo knob (knob-2, public/drift-player/img/knob.webp) is retired.

## Round 6 (2026-10-14): gate frame + DRIFT switch in the same 8-bit style (Yoni)

- Gate frame: a flat 60 x 60 pixel plate drawn x4 (dithered violet steel, lit top-left pixel bevel, pixel X-screws),
  the H slots cut out with a neon pixel outline (pink in gear, cyan in N). The 3D tilt is gone (flat = pixel-true;
  the gate sits on the 4 px grid: columns 80/120/160, rows 68/120/172). Gear numbers + the shift-pattern tag use the
  pixel font with hard drop shadows; the knob's shadow is a stepped pixel ellipse. AI plate-1 retired.
- DRIFT switch: a 40 x 44 pixel sprite drawn x4 on the same plate: pixel lamps (pink DRIFT / cyan BYPASS, 1 px halo),
  octagonal chrome nut, cylinder-shaded bat lever with a ball tip, flipped in 3 frames (up, toward you, down,
  70 ms) with the same pixel spark burst + pop-up ("DRIFT ON!" / "BYPASS"). Words in the pixel font.
- Shared 8-bit toolkit in the page: pxPlate / pxScrew / pxBurst (one look for every pixel part).

## Open questions for Yoni

- Default switch position on load: DRIFT ON (now) or BYPASS?
- Loop the track (now) or play once and stop?
- A download / trial plate on the toy, or leave the page's own CTA?
- Remove the "SPEED SOUNDS BETTER" sticker / bottom lip text?
- Even out the 5 tracks' levels with each other (synth is ~10 LU louder than perc)?
- OK to keep the originals turned down to match DRIFT (fair A/B), or play the raw levels?
