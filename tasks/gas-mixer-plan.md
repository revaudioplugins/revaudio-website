# GAS page: the GAS Mixer (plan, 2026-10-08)

Owner: Claude Code `revaudio-7f` (Yoni's laptop). Files: this plan, `bench/gas-mixer-bench.html`, `tools/gas-mixer/*`,
`bench/assets/gas-mixer/` (gitignored). Not touched: the Station Mixer files (`bench/station-mixer-bench.html`,
`tools/station-mixer/*`, `tasks/radio-roulette-station-mixer-plan.md`), which another session is working on.

Idea (Yoni): the Radio Roulette Station Mixer, but for GAS. Three loops (drums, bass, instruments) start DRY; each loop
has a GAS knob that applies GAS to it. The visitor solos loops, turns the knobs and hears what GAS does to the whole beat.

## Decisions (Yoni, 2026-10-08)

1. **Yoni renders in the DAW** through the real GAS plugin, the same way as Radio Roulette.
2. **GAS knob = 5 steps: 0, 2, 4, 6, 8** (revised by Yoni the same day; was 6 steps to 10). Same knob as the GAS plugin.
   0 = the original DRY loop (GAS off), 2-8 = real GAS renders at DRIVE 0.2 / 0.4 / 0.6 / 0.8, **MIX 50 %** on every
   render. The knob snaps to the steps; a step change is a
   30 ms crossfade at the same position. In-between positions are never faked by blending dry with a full render,
   because DRIVE changes the character, not just the amount.
3. **One voice per loop, fixed.** Yoni picks the best voice (Tube / Tape / Fuzz) for each loop; the channel shows it.
4. **Loudness-match every step to its DRY** (Yoni, after seeing the raw levels; first call was "keep GAS's output",
   see Bench round 1). Plus one global safety trim, the same on every file.
5. **Reuse the Station Mixer player** (loop sync, crossfade, solo/mute, volume, cassette transport, tutorial notes,
   RevLimiter preview on the master) where it fits. Look follows `design-language.md` and GAS's own design (fuel-gauge
   dial, check-engine lamp), not Radio Roulette's plate.

## Yoni's export spec

- **3 loops: drums, bass, instruments.** Same key and BPM, all exactly the same length, each starts on beat 1, peaks
  under -6 dBFS, dry (no baked reverb/delay).
- **Plugin: GAS 0.3.1**, the version the site gives away. This laptop has 0.2.3 installed, so install 0.3.1 first.
- **Settings on every render:** your chosen VOICE for that loop, MIX 50 %, OUTPUT TRIM 0, quality HQ (the default),
  DRIVE on 2 / 4 / 6 / 8 (= 0.2 / 0.4 / 0.6 / 0.8), nothing else on the track or master.
- **Seamless loop:** play the loop 3 times back to back and render all 3 (Claude keeps the middle pass). One pass also
  works; Claude fixes the seam in processing, as on Radio Roulette.
- **Format:** WAV 48 kHz / 24-bit (MP3 320 also accepted).
- **Names:** `<loop>_dry`, `<loop>_2`, `<loop>_4`, `<loop>_6`, `<loop>_8` (e.g. `bass_6.wav`); voice per loop in a
  note.
- **Total:** 3 dry + 12 wet = 15 files.

## Bench round 1 (2026-10-08)

- **Yoni's renders arrived** in `C:\shirimmmmmm\`: `Drums_Dry/2/4/6/8`, `bass_*`, `instruments_*` (15 WAVs, 48 kHz /
  24-bit, all 1,316,571 samples = 8 bars at 70 BPM). Voices: drums Fuzz, bass Fuzz, instruments Tape (Yoni's T/A/F
  letters). GAS 0.3.1 per Yoni.
- **Checks:** every render lines up with its DRY to the sample (high-passed cross-correlation, lag 0); every step is a
  distinct render (step-to-step difference -12.9 to -24.5 dB).
- **Levels: decision 4 reversed by Yoni the same day.** The raw renders moved the level a lot (instruments +4.1 to
  +6.4 LU louder than DRY, drums 1.8 to 2.6 LU quieter), which contradicts the GAS page's "changes character, never
  volume". Yoni: match every step to its DRY. One global trim -0.41 dB (loudest file -1 dBTP), 5 ms seam ramp.
  Tool: `tools/gas-mixer/process_stems.py`. Full mix: -14.47 LUFS dry, -13.65 at 6 (stems add up a bit hotter).
- **Bench** `bench/gas-mixer-bench.html` (assets in `bench/assets/gas-mixer/`, gitignored; art copied from the GAS
  repo's origin/main `plugin/Source/ui/public/assets`):
  - three GAS faceplates (walnut plate, DRIVE knob in its brass mount, glass fuel tube in the voice colour,
    check-engine lamp at 8)
  - the knob: 5 detents 0 2 4 6 8, eased ~200 ms; drag, wheel, arrow keys, or click a number
  - GAS's MIX knob + amber LCD = loop volume (-40..+6 dB)
  - jewels: S, the voice (lit, not a button), M
  - master bar in a brass frame: cassette deck, GAS jewel (all loops dry / back), status LCD, VU, RevLimiter
    preview ARM, ENGINE START = "Get GAS free" (`/gas`)
  - tutorial notes: the Station Mixer recipe
  - one-tap default: DRY for 2 bars, then every knob turns to 6
- **Verified in headless Chromium** (playwright-core script; the MCP browser was busy with another session):
  - loads, plays DRY, turns to 6 after 2 bars
  - clicking "8" lights the check-engine lamp
  - solo and mute dim the silent plates
  - drag moves detents
  - GAS jewel bypasses every loop to dry and back
  - no console errors
- **Open:**
  - Yoni's look and sound review
  - the RevLimiter preview chain still carries the Station Mixer calibration (no RevLimiter render of this mix yet)
  - phone layout

## Bench round 2 (2026-10-08): DAW track view

Yoni on round 1: "not the vibe i planned". He wants it like a DAW, with the tracks visible as in the Radio Roulette
mixer. Each track gets only solo, mute, volume and the GAS knob; no three full GAS plugins.
- One console (GAS walnut in a brass frame, brass rules between rows):
  - engraved column heads plus a bar ruler 1-8
  - three track rows: brass name plate + "gas voice Fuzz/Tape", volume (GAS's MIX knob + LCD in dB), S and M
    jewels, the GAS knob (DRIVE knob + fuel tube, scaled into the row, numbers drawn larger)
  - each row ends in a **lane**: the waveform of what the track is playing right now (cream = dry, voice colour =
    GAS, hot red at 8). It crossfades in ~220 ms when the knob moves.
  - one red playhead runs across all lanes
  - master row as before
- Peaks: `process_stems.py` now also writes `peaks.json` (600 columns per file, 53 KB). It loads before PLAY, so the
  lanes show at once. Each lane is scaled to its own track's loudest version.
- Notes renumbered: 1 play, 2 GAS knob, 3 mix (S/M/volume), 4 before/after, plus "Watch it" (the lane) and the
  RevLimiter note.
- Verified in headless Chromium (same script as round 1, new selectors):
  - auto turn to 6 after 2 bars
  - "8" click works
  - solo/mute dim the row and its lane
  - drag moves detents
  - GAS bypass works
  - 0 console errors

## On the GAS page, local (2026-10-08)

Yoni: "lets embedd it in the gas page locally".
- `tools/gas-mixer/export_component.py` turns the bench into a `<gas-mixer>` web component in `public/gas-mixer/`.
  It follows the Station Mixer exporter: shadow DOM, built only near the viewport, audio only on PLAY, no iframe
  (live X-Frame-Options DENY), self-hosted fonts (live `font-src 'self'`).
  - It also resizes the GAS art to 2x its display size as WebP: 13 MB of PNGs become 192 KB.
  - Audio: 15 AAC 160k loops with half a bar of padding each side, 10 MB, fetched on PLAY. `peaks.json` is 53 KB.
- `src/pages/gas.astro`: a "Hear it" section under the one-screen hero (the hero is unchanged).
- On the GAS page, START ("Get GAS free") clicks the page's own `.gas-cta`, so it opens the email-gate download
  modal instead of reloading `/gas`.
- Verified in headless Chromium:
  - **dev server** (`127.0.0.1:4321/gas`): builds on scroll, plays, turns to 6 after 2 bars, solo works, START opens
    `tg-modal`, no horizontal scroll, 0 errors
  - **production build with the live CSP + X-Frame-Options**: `astro build` into the scratchpad (not `dist/`, which
    another session serves), the same play test at 1440x900 and 390x844. The only failed request is the Cloudflare
    RUM beacon (no CORS on localhost); 0 CSP refusals.
- Open:
  - phones: the 1600 px stage only scales down (unreadable at 390 px); step 6
  - pushed live 2026-10-08 (see the phone section below)

## Bench round 3 (2026-10-08): knob numbers, tightness pass, new art

Yoni: "the numbers on the knob are not aligned well, align them so it will be centered and non intrusive / make a
tightness check and maybe create some new assets just to make it more tight and sexy and unique".
- **Knob numbers.** They were centred on the PNG box, but the tube and knob sit ~3 css px higher (the ring-tank
  photo is shot from slightly below), so 0/8 sat low on the rim and 4 was clipped. Fix: `numPos()` puts each number at
  the middle of the brass band along its own ray from the knob axis (band measured from ring-tank.png: outer rim r
  165 about (170,170), inner = the tube's outer wall COUT). They are now engraved small (23 px dial units ~ 8.4 css px,
  dark fill + light lip) and only the set detent lights (amber; 8 in red; 0 lit when the GAS jewel is off). Measured:
  0/8 and 2/6 are mirror-symmetric to 0.5 px. Rule folded into wiki design-language.md (Law 5).
- **Tightness audit** (script measures every control's box):
  - track row before: control centres spread from 51 to 67 px; gaps 14-20 px. After: every control on y 66, 16 px
    gaps (S-M pair 10), 18 px margins both sides. Column heads re-centred over their controls.
  - master row before: centres 86-108, gaps 36-44 px, right margin 106 vs left 24. After: every block centred on
    y 103, 62 px gaps, 18 px margins.
- **New art** (`tools/gas-mixer/gen_assets.py` + `process_gen.py`, gpt-image-1, house lamp prompt):
  - `tag-blank`: a blank stamped brass gas-pump tag with two screws; the track names are engraved into it in CSS.
    Replaces the CSS name plates.
  - `fuel-gauge`: a 1950s chrome fuel gauge, E · 1/2 · F · FUEL + pump icon, no needle. Replaces the VU as the master
    meter: E = quiet, F = loud. The needle is code: it pivots on the printed brass cap (50.76 % / 77.03 %) and swings
    +/-45 deg to the printed arc ends (measured on the render).
- Re-exported to `public/gas-mixer/` (18 images, 232 KB). Verified on the dev server GAS page: plays, 0 errors.

## Phone player + iPhone memory fix, pushed live (2026-10-08)

Yoni: "lets deploy and push with the mobile fix like rr as well". Pattern and lessons from the Station Mixer session
(revaudio-4a), which shipped the same on /radio-roulette and Yoni confirmed on his iPhone.
- **Memory.** Only each track's DRY + its current knob step is decoded and running (at most 6 buffers, ~60 MB PCM,
  instead of 15). A new step decodes when the knob reaches it; the old sound keeps playing until it takes over at the
  same loop position, then it is released (`fetchRaw` / `getBuf` / `wanted` / `prune` / `startAt`;
  `window.__gmxDebug()` lists decoded / running). The RevLimiter preview's input is wired only while ARM is on.
- **Phone player** below 760 px of width (`#phone`, `renderPhone`, `doFit`), 380 px design scaled to the column:
  - a taped "How to play" note
  - an amber display (bar ruler, playhead, DRY / GAS n / MIXED)
  - ONE big GAS knob for the whole beat (0 2 4 6 8, drag or tap a number)
  - the deck, the GAS jewel and the fuel gauge
  - "The full 3-track mixer lives on a computer."
  - Get GAS free
  The deck, GAS jewel, fuel gauge and START are moved in, not copied. No per-track controls and no RevLimiter on
  phones.
- **Deploy:** from a worktree (`../revaudio-website-gmx`, branch `gas-mixer-deploy` = origin/main + the 5 GAS
  commits cherry-picked), because local `main` had drifted from origin (Station Mixer commits re-landed under other
  SHAs). Same route as the Station Mixer.
- **Verified on that build** (`astro build`, served with the live CSP + X-Frame-Options), headless Chromium:
  - desktop 1440x900: plays, turns to 6 after 2 bars, START opens the download gate, no horizontal scroll
  - phone 390x844 (touch): phone player shown, plays DRY then GAS 6, tap 8 -> GAS 8, GAS jewel -> DRY, page width
    390, decoded never above 6
  - 0 CSP refusals and 0 page errors (only the Cloudflare RUM beacon fails on localhost)
- **Not checked:** a real iPhone, Safari and Firefox. Yoni to check on his phone.

## Build steps

| # | Owner | Step | Done when |
|---|---|---|---|
| 1 | 🧑 | **Loops + renders** per the export spec. | 15 files delivered |
| 2 | 🤖 | **Check + trim** (`tools/gas-mixer/process_stems.py`): same rate/length, alignment to DRY (sample offset), middle pass, seam check, LUFS + true peak per file logged, one global trim. | Report; 15 loop-length FLACs + manifest |
| 3 | 🤖 | **Bench** `bench/gas-mixer-bench.html`: 3 channels (the GAS plugin's knob, 5 steps 0-8, voice tag, SOLO, MUTE, volume, VU), master (PLAY, DRY/GAS lever, RevLimiter preview, trial/download CTA), tutorial notes. Starts DRY, flips to GAS after 2 bars. | Yoni approves look + sound |
| 4 | 🤖 | **Encode** AAC with padding (as Station Mixer step 3). ✅ done 2026-10-08 (export_component.py) | 10 MB |
| 5 | 🤖 | **Wire into `/gas`** (`src/pages/gas.astro`, one-screen page) + `plugins.ts`. | Build green |
| 6 | 🤖 | **Phones + tests** (as Station Mixer steps 7-8). | Works on iPhone WebKit + 360 px; suite green |
| 7 | 🧑 | **Review on localhost**, then "push". | Live |

Step 3 can start before step 1 lands, on placeholder loops.

## Open

- Shared code: if both mixers ship, pull the player engine into one shared module instead of two copies.
- Mixer name.

## New PLAY / STOP: XL chrome piano keys, live on both players (2026-10-08, Claude Code revaudio-7f)

- **Request.** Yoni: "the play and stop button doesn't get the attention they need ... way cooler and a bit bigger ...
  for both gas and rr players".
- **Pick.** `bench/transport-bench.html` showed three candidates on walnut, leather and phone: A chrome piano keys,
  B dash jewels, C one big starter. Yoni: "a piano keys".
- **What shipped.** The deck keeps its cassette window. Two big chrome keys with ribbed bakelite faces (art: gpt-image-1
  `tkey-chrome`, drawn through CSS `border-image` so the chrome corners keep their shape at any size). PLAY latches
  down with an amber lamp glowing through; STOP is momentary. A 3-digit mechanical tape counter rolls while playing.
  The deck grew from 176x172 to 236x206.
  - GAS: full size, with the master row raised to 230 px.
  - Radio Roulette: beside the dial glass at scale .82.
  - Phones: GAS .55, Radio Roulette .58.
- **Same push, GAS only:** the console's brass frame and row rules are worn brass (gpt-image-1 `brass-patina` tile under
  the house light gradient, Radio Roulette's chrome-rust bezel recipe). Yoni: "the gas edges ... same like rr - patina
  wear vibes".
- **Verified.** On the deploy build under the live CSP, then on revaudio.net, desktop 1440 and phone 390, for both
  /gas and /radio-roulette: plays, PLAY latches, the counter rolls, no horizontal scroll, 0 errors.
