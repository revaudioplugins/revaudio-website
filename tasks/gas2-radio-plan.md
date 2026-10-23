# GAS 2 page: the radio player (plan, 2026-10-22)

Owner: Claude Code `revaudio-cd` (Yoni's laptop 2). Branch `feat/gas2-page`, worktree `Website/revaudio-website-g2p`.
Status: round 1 BUILT (2026-10-22), waiting for Yoni's review.

Ask (Yoni, 2026-10-22): forget the jukebox player design (`tasks/gas2-jukebox-plan.md` on laptop 2's unpushed main =
history); the player is the radio in Dan's station scene (`tools/_gas2-scene/page-b.html`, frame v17). Form picked:
**close-up on tap** (like the pump).

Carried over from the jukebox decisions (Yoni, 2026-10-22): level-matched A/B (GAS 2 matched to ORIGINAL's loudness);
every mix starts on ORIGINAL; 5 mixes HIP HOP / ELECTRONIC / ROCK / TRAP / FOLK; real renders = Yoni's 10 files (spec
in the jukebox plan), placeholder audio until then.

## Boundaries (README split)

- Mine: `tools/_gas2-scene/player/**` + the radio block in `page-b.html` (`<!-- 3. radio player -->`, `.radio*` /
  `.dial` CSS, the radio lines in its script). Wiring = one `<link>` + one `<script>` in page-b; the player takes over
  `#radio` / `#radioCap` from its own JS. The old inline radio handler is removed in the same commit (same block).
- Dan's session: everything else in page-b. No edits there.

## Design

- **In the scene:** the photo's radio stays as it is (Law: photo = the plate). Hover/first-pulse as now. Tap = opens
  the close-up. While a mix plays, the scene radio's dial glow breathes and the caption reads `On air: ROCK · GAS 2`;
  closing the close-up keeps it playing (the scene radio = mini status + tap to reopen).
- **The close-up (veil, same pattern as the pump):** a big photo of THIS radio, front-on, at night, warm dial light.
  - Dial glass = the 5 stations, printed live (Oswald, dial ink); the red pointer slides to the picked station
    (the existing `.ptr` motion, scaled up). Tap a station name or turn the right knob (drag / wheel / arrows) = tune.
  - **The hero = two piano keys on the radio's front: ORIGINAL | GAS 2** (1950s band keys: pressed key stays down,
    the other pops up). Swap at the same spot in the song, 30 ms crossfade. Dial light: cooler on ORIGINAL, full warm
    on GAS 2 = the 1-second read. Keys A / B, Space = play/stop.
  - Left knob = volume. A thin "magic eye" tuning tube or the dial's lamp = playing indicator.
  - Under the radio, small type: the GAS 2 settings of the mix on GAS 2 (grade + GAS %), "nothing on the master" on
    ORIGINAL. Station tune = 150 ms fade, starts on ORIGINAL.
  - Phone: the close-up fills the width, keys under the thumb.
- **Art:** one generated hi-res close-up from the frame's radio crop (`shared/tools/openai/edit.ps1`, gpt-image, the
  crop as reference so it IS the same radio), dial glass + key faces left blank so text and pressed states are live.
  0 pure #000 / #fff, trimmed. Est. 2-4 images, ~$1.
- **Engine:** the jukebox/GAS-mixer idea: Web Audio, the picked mix's two files decoded, started on one context time,
  looped; gains swap in 30 ms. Lazy-load per station. Placeholder audio = the jukebox placeholders (GAS mixer loops,
  -17 LUFS each) on all 5 stations until the renders exist.

## Steps

- [x] 🤖 1. Read `wiki design` + the site's `DESIGN.md` (UI gate), then generate the close-up art -> `player/img/`.
- [x] 🤖 2. `player/radio.css` + `player/radio.js` (+ `player/audio/` placeholders): close-up veil, stations, keys,
      knobs, engine, scene caption/glow. Wire into page-b (one link + one script; old inline radio handler out).
- [x] 🤖 3. Headless check desktop + phone (no errors, no 404s, A/B swaps at the same position, gains 0/1),
      screenshots, then open page-b for Yoni.
- [ ] 🧑 4. Yoni's review -> corrections folded in.
- [ ] 🧑 5. Yoni renders the 10 files -> 🤖 process + level-match + swap in.
- [ ] 6. Commit + push the branch (own files only); page moves into `src/` with Dan's page later.

## Round 1 (2026-10-22, `revaudio-cd`)

Open: `cd tools/_gas2-scene && python -m http.server 4462 --bind 127.0.0.1`, then http://127.0.0.1:4462/page-b.html,
tap the radio.

- Art: `player/tools/gen_art.py` (gpt-image-2 EDIT, the scene's own radio crop + the frame as references, 3 takes,
  ~$1): a = the match but small keys, b = darker cabinet, **c = picked** (same brass radio, keys ~140 px at laptop size).
  `process_art.py`: crop 1368 x 820, the baked pointer erased (light ramp + borrowed grain, no seam), the OFF plate made
  from the same photo (glass to tea-brown, warm spill down 38 %), 0 pure #000 / #fff. Raw takes + refs gitignored.
- States: off = OFF plate; ORIGINAL = lit plate at 30 %; GAS 2 = lit 100 % + a screen glow on the glass. The pressed key
  sinks 5 px (scaled) into a dark well, -22 % light. Pointer = live, runs in the scale under the names (house curve).
- Knobs: the photo's caps never move, only a painted cream notch (Law 3). Volume: drag / wheel / arrows. Tuning: 40 px
  of drag = one detent = next station, with a 0.3 s burst of band-passed static.
- Open = power on at the current station on ORIGINAL; the station on air tapped again = off; closing keeps it playing
  (scene radio `.on` / `.b`, caption "On air: GAS 2 · ROCK").
- Phone (<= 760): crop knob to knob, the 5 stations repeated as paper tags under it, keys' hit area grown.
- Wiring: page-b gained ONE line in `<head>` (`player/radio.css` + `player/radio.js` defer). The page's own first-draft
  `radio.onclick` is nulled from radio.js, not edited.

Checks (headless Chromium 1440x900, 1280x720, 390x844 @2x): no page errors, no 404s; open -> playing ORIGINAL (gains
1/0); GAS 2 key -> 0/1; back -> 1/0; ROCK tag/dial -> station 2 on ORIGINAL; `b` -> 0/1; Space -> off; Space -> on;
Esc -> close, scene radio `on b`, caption "On air: GAS 2 · ROCK". Not checked: real ears, Safari / Firefox, a real phone.

Found for Dan's session (not mine to change): on a phone the scene is anchored right, so the radio sits off-screen
(x = -810 at 390 px): phones cannot reach the player from the scene.

### Open questions (Yoni)

1. Close-up look: take c OK? Keys big enough as the hero?
2. ORIGINAL lamp at 30 % vs GAS 2 full: is the difference right, or should ORIGINAL be fully lit too (honest A/B: only
   the sound changes)?
3. The static burst when tuning: keep?
4. Real renders (spec in `tasks/gas2-jukebox-plan.md` on laptop 2's archive branch, repeated here): 5 mixes x
   `<id>_before` / `<id>_after`, sample-aligned, 30-45 s, WAV 48k/24, + GAS 2 settings per mix (GRADE, AMOUNT %).

## Round 2 (2026-10-23, Yoni: play / stop button, KNOB LAB knobs "maybe Radio Roulette style but not identical",
## "more aesthetic and cool, think creative")

Picks (Yoni): play / stop = a 3rd key on the radio + a red jewel lamp; Fly-in from the scene; Magic eye tube.
- [x] 🤖 1. New plate: the same photo (edit of radio-c) with 3 keys [PLAY/STOP] [ORIGINAL] [GAS 2], a red jewel, and
      a magic-eye tube window (dark when off). Re-measure, re-process (lit / off), erase pointer.
- [x] 🤖 2. KNOB LAB page for the radio (`player/knoblab/`, generator + `__klCfg`; the lab code untouched): start look
      = a vintage radio knob in the Radio Roulette family, not identical. Open for Yoni.
- [x] 🧑 3. Yoni tweaks / approves the knob in the lab (save through serve-lab).
- [x] 🤖 4. Bake the look into 129-frame strips (lab's `bake-knob-lab.js`), knobs = strips, the photo's caps covered.
- [x] 🤖 5. Code: play key + jewel; magic eye live from an AnalyserNode (opens with the level); fly-in from the scene
      radio's rect into the close-up and back out (one tween, house curve).
- [ ] 🤖 6. Headless checks + screenshots, open for Yoni.

### Round 2 state (2026-10-23, `revaudio-cd`)

- Plate = radio-e (edit of radio-c: 3 keys, red jewel, magic eye; no baked pointer). radio-d grew 4 keys (dropped).
  Measured (crop px): glass 459..934 x 470..550; keys PLAY 504..591, ORIGINAL 595..717, GAS 2 722..859, y 574..640;
  jewel (428.5, 520); eye (657, 395) r 23; knobs (345, 530) + (1013.5, 530).
- HIP HOP = Yoni's renders (`C:/shirimmmmmm/hip hop dry.wav` + `hip hop gas.wav`, 48k, 26.24 s) via
  `player/tools/prep_audio.py`: lag 0, LUFS -7.20 / -7.26 (already matched; GAS side +0.05 dB), sources peak +1.05 /
  +1.52 dBFS (4x), so both got one shared -2.57 dB: -9.78 LUFS each, peaks -1.53 / -1.00. AAC 256k. Other 4 = placeholder.
- Play key latches down while playing; jewel burns while playing; magic eye = AnalyserNode RMS after the keys (-34..-8
  dB -> shadow 52 deg..6 deg, fast attack / slow release), fades in slower than the lamp (tube warm-up).
- Fly-in: the close-up starts on the bench radio's rect and grows (0.62 s, house curve); Esc / X / backdrop fly back.
  Phone: the radio is off-screen in the scene, so it fades.
- KNOB LAB: `player/knoblab/make-knoblab.py` -> radio-knoblab.html (gitignored), served by
  `serve-lab.py 8797 --pages player`, start look = walnut bakelite SKIRTED with a spun-brass skirt seated in the photo's
  brass ring. Waiting for Yoni's look; then bake (`bake-knob-lab.js <recipe> <out> 256 1 --foot=60,60,84,120`).
- Checks (headless, 1440 / 1280 / 390): no errors, no 404s; flight mid-scale at 120 ms; eye pixel green while playing;
  keys 1/0 -> 0/1; play key stop / start; Esc -> closed; scene caption "On air: GAS 2 · HIP HOP". Not: real ears / Safari.
- Knob (Yoni "done" 2026-10-23): his lab EXPORT `library/saves/gas2radio/gas2radio-knob-recipe-2026-10-23-1725-2.json`
  (copy: `player/knoblab/knob-recipe-yoni-2026-10-23.json`), KNURL, gunmetal knurl, bakelite #442b13 dome, glow index
  #ffd23b, linked (both knobs). Baked 129 x 256 px (`--foot=60,60,84,120`, k3dCss -1.391 / -3.326 / 102.783 %), shipped as
  `img/knob-radio.webp` (192 px frames, 518 KB). Volume = frame per angle 1:1; tuning glides to its detent (380 ms ease-out).
- HIP HOP GAS 2 settings (Yoni): PREMIUM, 140 % -> the caption on GAS 2.
- Magic eye REMOVED (Yoni 2026-10-23: "remove that green thing, its not nice"): the green glow is off-palette on this
  brass + amber radio. Gone from the plate too: `process_art.py` patches its spot from radio-c (radio-e is an edit of
  radio-c, aligned to 0 px there; feathered disc r 44..62), and the analyser / canvas code is out of radio.js / .css.
- 4 stations (Yoni 2026-10-23): HIP HOP (real) / POP / ELECTRONIC / ROCK (placeholders). Fixed on the way: the close-up's
  dark backdrop never applied (page-b's `.veil` won on order); now `.veil.rp-veil`, 0.86 desktop / 0.93 phone.

## Round 3 (2026-10-23, Yoni: "ditch the zoom ... embed it on the page itself ... like 30% bigger, still readable")

- The close-up radio now STANDS ON THE BENCH in the scene (`.rp-dock` in `#scene`), 1.3x the photo's own radio
  (`--rs: 1.3` in radio.css), centred on the photo radio (frame x 192), sitting on the bench (frame y 688); body cut out of
  the plate (crop 212..1148 x 108..663, r 42), drop shadow down-left (the porch lamp is up-right) + a contact shadow.
  The photo's radio + its hotspot are hidden (`#scene #radio`). No veil, no flight, no phone tags.
- 1.3x is about the most that fits: the radio's right edge sits ~7 px before the pump at 1440; left edge 40 px in.
- Printed text is ~2x the photo's proportion so it reads at scene size: dial 30u, keys 28 / 32u, VOLUME / TUNING 23u.
  Measured: 1280x720 dial 8.3 px, keys 7.5 / 8.5, labels 6.1; 1440x900 9.3 / 8.4 / 9.6 / 6.9; 1920x1080 12.4 / 11.2 / 12.8 / 9.2.
- Keys LIGHT UP when down (Yoni): brightness + an amber glow inside and a little spill out; the dial lamp's off-state
  no longer dims a pressed key. VOLUME / TUNING: cream, centred on each knob (letter-spacing balanced with padding-left).
- Start = off ("Press play on the radio"); the caption under the bench says what's on air. Keyboard only while focus is
  on the radio (Space stays page scroll elsewhere).
- Phone: still Dan's layout (the scene crops the radio off-screen).
- Lower bench (Yoni 2026-10-23): `player/tools/bench_patch.py` makes `img/bench-low.webp` from the frame's own pixels
  (top 688 -> 710 frame px, legs squashed to the same floor 792; the frame file untouched), laid under the radio;
  the radio stands on 710 (46.224cqw). Caption moved to the porch floor (top 77.8 %). Dial prints ELEC. (the caption
  keeps ELECTRONIC); sizes kept (Yoni: "keep the original size").
- Caption contained in the radio width (Yoni 2026-10-23): the dock's width + centre, two lines (station / side + settings); measured inside the radio at 1280 / 1440 / 1920.
- Room from the pump (Yoni 2026-10-23, picked "slide the radio left" over moving Dan's pump): radio + bench + caption 23 frame px left (centre 11.0026cqw; bench_patch.py DX); the strip the bench leaves = the clean stucco + floor between the old right leg and the pump (x 323..346). Gap to the pump ~30 px at 1440.
- Key depth fixed (Yoni 2026-10-23: pressed keys read as UP): brightness reads as raised, so a pressed key now sinks 11u into its slot (dark gap above, lip shade, bottom clipped behind the lower lip) and glows amber from its base without extra brightness; an up key has a lit top bevel + a cast shadow below. Same for PLAY/STOP, ORIGINAL, GAS 2.
- Keys keep their size (Yoni 2026-10-23: "keep the before sizes, just flip the up/down"): no clip; pressed = 5u lower +
  the slot's shade on top + an amber glow from the base; up = lit top bevel + cast shadow.
- Radio 20 % smaller (Yoni: room from the page edge): --rs 1.04, back on the bench's own centre (12.5cqw, DX 0); left
  edge 68 px in at 1440, pump gap ~38 frame px. The photo radio no longer hides under it, so `gen_noradio.py` makes a
  masked gpt-image-1 edit of the frame with the radio, its shadow AND the old bench removed (box 52..349 x 515..796,
  2 runs ~$0.4); `bench_patch.py` cuts `img/noradio.webp` from it and lays the lowered bench back on top. The frame file
  is untouched. Text at 1.04x: dial 6.4 / 7.2 / 9.6 px at 1280 / 1440 / 1920 (keys 6-10, VOLUME/TUNING 4.9-7.4).
- Size settled at 1.18x (Yoni: 1.04 "too small", wants just some room on the left), centre 12.3cqw: left edge 44 / 50 /
  66 px at 1280 / 1440 / 1920; dial 7.3 / 8.2 / 10.9 px.
- POP + ROCK = Yoni's renders (`C:/shirimmmmmm/pop|rock dry|gas.wav`, 48k, 37.19 s / 24.00 s; pop lag 1 sample trimmed,
  rock 0; dry vs gas within 0.16 dB). Every station now at ONE loudness, -11.00 LUFS both sides (prep_audio.py TARGET;
  was hip hop -9.8 / pop -10.9 / rock -8.3 = level jumps between stations); peaks -1.08 .. -4.43 dBFS. ELEC. = placeholder.
  GAS 2 settings for POP / ROCK owed by Yoni (the caption shows "GAS 2" alone until then).
- Final size (Yoni 2026-10-23: "+10 %, center it on the stool"): 1.3x, centred on the bench (12.5cqw). Left edge 35 / 40 / 53 px at 1280 / 1440 / 1920, ~8 px from the pump at 1440; dial 8.0 / 9.0 / 12.0 px.
