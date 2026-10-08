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

## Build steps

| # | Owner | Step | Done when |
|---|---|---|---|
| 1 | 🧑 | **Loops + renders** per the export spec. | 15 files delivered |
| 2 | 🤖 | **Check + trim** (`tools/gas-mixer/process_stems.py`): same rate/length, alignment to DRY (sample offset), middle pass, seam check, LUFS + true peak per file logged, one global trim. | Report; 15 loop-length FLACs + manifest |
| 3 | 🤖 | **Bench** `bench/gas-mixer-bench.html`: 3 channels (the GAS plugin's knob, 5 steps 0-8, voice tag, SOLO, MUTE, volume, VU), master (PLAY, DRY/GAS lever, RevLimiter preview, trial/download CTA), tutorial notes. Starts DRY, flips to GAS after 2 bars. | Yoni approves look + sound |
| 4 | 🤖 | **Encode** AAC with padding (as Station Mixer step 3). | ~4.5 MB total |
| 5 | 🤖 | **Wire into `/gas`** (`src/pages/gas.astro`, one-screen page) + `plugins.ts`. | Build green |
| 6 | 🤖 | **Phones + tests** (as Station Mixer steps 7-8). | Works on iPhone WebKit + 360 px; suite green |
| 7 | 🧑 | **Review on localhost**, then "push". | Live |

Step 3 can start before step 1 lands, on placeholder loops.

## Open

- Shared code: if both mixers ship, pull the player engine into one shared module instead of two copies.
- Mixer name.
