# Radio Roulette page: the Station Mixer (plan, 2026-10-07; revised 2026-10-08)

Idea (Yoni): replace the plain before/after player with a 4-loop jam. Drums, bass, keys and guitar loops in the same key
and BPM. Each loop has 5 stations of its own, picked on car-radio preset buttons. The visitor solos one or more loops,
flips stations, then drops the solos and hears the whole beat with every effect on it.

Page style = RevLimiter's (same template already: crane door, facts line, walkthrough, video). The only real gap is
audio: `audioDemos: []` today, so the page has no "Hear it" at all. The Station Mixer fills that slot.

## Non-negotiables

- **Honest sound.** Every station you hear is real Radio Roulette output, rendered by Yoni in a DAW through the real
  plugin. No Web Audio imitation of the effects.
- **Same level rules as the plugin.** No extra loudness on the wet versions: plugin output untouched, nothing on the
  master.
- **Consent rules unchanged.** No new tracking.

## Decisions

2026-10-08 (Yoni) replaces the 10-stations-per-loop / TUNE-dial / render-tool route of 2026-10-07:

1. **Yoni picks and renders.** 5 stations per loop, each loop its own 5 (bass station 1 is not drums station 1).
   20 wet files total. Live-in-browser WASM rendering was considered and not taken.
2. **Buttons show "1"-"5", never the long station numbers.** Per channel: DRY 1 2 3 4 5 car-radio preset push buttons
   (the pressed one stays down). Master row 1-5 sets every channel to its own station N at once (whole-beat preset).
3. **DRY = the original loop**, not a render: no plugin, no tail, so the plain loop is already seamless.
4. **Dropped with the long numbers:** the "Like station 456149? Same number in the plugin" line (the CTA stays, as
   "Try it free for 30 days" next to the channels, to `#trial`) and the per-channel lit effect names (they need the
   station number). Can come back if Yoni later sends the numbers privately in `stations.json`.
5. **Kept from the 2026-10-07 review:** one big PLAY; the full beat starts DRY and flips to RADIO ON after 2 bars (or
   RADIO ON pulses); copy says "a few of our favourite stations"; SPIN picks at random among the 5.
6. **Scope cap:** per channel DRY/1-5, SOLO, MUTE; master PLAY, RADIO ON, 1-5, SPIN. No faders, tempo, key or saving.
7. **Name:** still open (examples: "Station Mixer", "Garage Radio", "Jam Room").

## Bench round 1 (2026-10-08)

- **Yoni's renders arrived** as 24 MP3s (320 kbps, 48 kHz) in `C:\shirimmmmmm\`: `<loop>_dry` + `<loop>_station1..5`,
  90 BPM, 8 bars, 21.333 s, all 1,024,000 samples, time-aligned to DRY within 25 samples. One pass each (not the 3-pass
  render), so the loop seams were fixed in processing instead.
- **Yoni: "normalize them, make them tight and volume matching".** This replaces the "no extra loudness on the wet
  versions" rule: every station is now loudness-matched (integrated LUFS) to its own loop's DRY, so before/after is
  a fair comparison. 5 ms seam ramp on every file (wrap step 0). One global trim: loudest file -1 dBTP.
  The player plays the master 3.5 dB down (4 stems summed peak about +2 dBTP) with a safety limiter.
  Tool: `tools/station-mixer/process_stems.py`.
- **Yoni: volume per track** (a photoreal knob per channel, -40 to +6 dB) and **RevLimiter on the master**, linked to
  `/revlimiter` ("Liked the master? That's RevLimiter. Check it out").
  - Honest: 6 real RevLimiter 3.2.1 renders (release build, default program "1. Master Glue"): all DRY and all on
    station N. `tools/station-mixer/render_revlimiter.py`.
  - RevLimiter's output is about 316 samples late; the renders are realigned to the stems.
  - With RevLimiter on, the channels follow the master: channel controls lock, volumes reset, solo and mute are cleared.
  - Played at the same master level, so its +5 LU is audible (it is the point of a limiter).
- **Bench:** `bench/station-mixer-bench.html`, served with `python -m http.server 8794` from `bench/`. Audio and
  image cuts live in `bench/assets/station-mixer/` (gitignored). Every part is cut from the real Radio Roulette plate:
  - power lever = DRY / RADIO
  - keys 1-5 = stations
  - VU = level
  - PLAY and SPIN knobs, plus the dial glass with an 8-bar playhead needle
  - RevLimiter's ARM plate
- **Verified in Chromium:**
  - loads, plays, flips to RADIO ON after 2 bars
  - VUs move
  - RevLimiter locks the channels; its master keys switch the 6 masters
  - solo, mixed stations and SPIN work
  - no console errors
- **Open:** Yoni's look and sound review; the mixer name; the phone layout (step 7: the 1100 px stage only scales
  down today).

## Bench round 2 (2026-10-08)

Yoni's bug list and calls:
1. **No stations on the master;** stations live only in the loops. Arming RevLimiter no longer touches any loop setting.
2. **RevLimiter = a browser PREVIEW chain** (Yoni chose this over rendering all 1,296 combinations). Web Audio:
   drive, glue compressor, tanh saturation, limiter, -1 dBFS clipper. Calibrated so the all-DRY mix lands at the real
   RevLimiter 3.2.1 render's loudness (-7.2 vs -7.2, K-weighted ungated; peaks -0.93 vs -1.1 dBFS),
   `window.calibrateRL()` in the bench. It is not RevLimiter's DSP, so the copy says "preview" / "a taste of" and
   never "this is RevLimiter's sound". The glass shows the preview's live GR.
3. **PLAY = cassette transport:** a deck module with ▶ (latches down) and ■ (pops it up), plus a play lamp.
   Its tape window (Yoni: "more realistic and moving") has:
   - a smoked shell with a centre window and hub holes
   - sprocket hubs turning at real cassette speed (~0.7 rev/s on an empty hub)
   - pack radius following the tape area
   - the tape running past the head opening
   - a 4-minute side with AUTO REVERSE (A then B)
4. **Tighter layout:**
   - column heads engraved once
   - brass stamped name plates
   - chrome-bezel SOLO/MUTE lenses
   - one master bar: RADIO lever, master VU, ARM plate, RevLimiter copy and link, trial CTA
   - the station readout flickers on a change
   - VU faces lamp-lit while playing

## Bench round 3 (2026-10-08): tutorial notes

Yoni: "the design to be more easy to understand, with some notes in the style of revamp papers ... like a tutorial".
- 6 paper notes in the RevAmp paper family (beaten `sl-paper.png`, masking tape, red Permanent Marker titles,
  Gochi Hand body, a coffee ring on one). Hand-drawn marker arrows run from each note to its control.
  - Left = the basics: 1 Press play, 2 Before / after (the lever), 3 Pick a station.
  - Right and below = the extras: Feeling lucky? (SPIN), 4 Your mix (S / M / volume), Finish it on the master (ARM).
  - Arrows 2 and 3 ride the chrome dividers so they never cross the name plates.
- Each note ticks itself off (red check, title struck through) when that step is done.
- A "hide the notes" tag peels them off; the choice is remembered in localStorage.
- Before the first PLAY the deck lamp breathes: the one thing to press.
- The stage is now 1540 wide (mixer 1100 + note margins). The phone layout (notes stacked above the mixer) is still
  step 7.
- Fixes: the loader fetches 4 at a time with retries (24 parallel requests overflowed the bench server); a second
  PLAY while loading no longer crashes; a failed load pops PLAY back up for a retry.

## Bench round 4 (2026-10-08): assets, type, CTA, bezel, arrows

Yoni's fixes:
1. **Badges** are chrome trunk-lid script emblems (gpt-image-1): Drums / Bass / Keys / Guitar / Master, chrome with
   oxblood enamel and a swash. The SVG chrome-script emblems stay as the fallback if a PNG is missing.
2. **RevLimiter** copy is set in Cinzel 700 caps (the faceplate wordmark) with an Oswald "ON THE MASTER" kicker.
3. **Trial CTA** is an ENGINE START button (gpt-image-1: red domed lamp-button, knurled chrome, brass collar) with
   "Radio Roulette / FREE FOR 30 DAYS / Full plugin · Windows & Mac". The trial is really 30 days
   (`LicenseManager.cpp`). It breathes once you have played, flares red on hover (light leaks onto the leather) and
   sinks on press.
4. The radio glass no longer shows any RevLimiter text or gain reduction.
5. **Bezel:** worn chrome with rust and pitting (a gpt-image-1 tile lit through an overlay blend), set into a dark
   dash recess; the dividers use the same metal.
- **Arrows** (Yoni: "not pointing precisely ... make them great"):
  - each ends at a hand-drawn marker ring around its exact control(s): ▶, the drums lever, the 5 keys, SPIN, S + M, ARM
  - pen-pressure taper and a swept, slightly uneven head aimed along the stroke
  - they draw themselves on when the notes appear
- **Assets:** `python tools/station-mixer/gen_assets.py [slug] [--force]` (7 images, sequential, retries on 429;
  ~$1.75), then `python tools/station-mixer/process_gen.py` (trim and size into `bench/assets/station-mixer/img/`).

## On the Radio Roulette page (2026-10-08)

- **Not an iframe:** the live site sends `X-Frame-Options: DENY` and a CSP `frame-src` without 'self', so a framed
  page is blocked on revaudio.net (it only worked on the dev server). The mixer ships as a `<station-mixer>` web
  component instead.
  - Shadow DOM keeps its CSS and the site's apart.
  - It builds itself only when it nears the viewport, and the audio loads only on PLAY.
  - It is generated from the bench by `tools/station-mixer/export_component.py` into `public/station-mixer/`.
- **Under the live CSP:**
  - Fonts are self-hosted (`font-src 'self'`): Permanent Marker, Gochi Hand, Yellowtail, Cinzel; Inter / Oswald / VT323
    come from the site.
  - Audio is AAC 160k with half a bar of loop padding each side; the player loops the window inside (plan steps 3 + 4).
  - Total 16.6 MB, of which ~11 MB is audio fetched on the first PLAY.
- **Page wiring:**
  - `plugins.ts` `stationMixerUrl` makes `[slug].astro` hang the mixer in the garage wall (the wood) as "Hear it".
  - That wall skips wall-fit; HeroFacts' "Hear before/after" link now shows on Radio Roulette.
- **Verified:** `dist/` served with the exact live CSP and X-Frame-Options headers.
  - Chromium 1440 + 390: plays, fonts load, no CSP errors.
  - WebKit (Playwright's Windows build has no Web Audio): no errors, shows NO AUDIO IN THIS BROWSER.
  - Real Safari and iPhone need a check on live.
- **Still open:** the phone layout (at 390 px the whole thing scales to ~237 px tall) and lazy per-stem decode
  (plan step 7).

## Phones (2026-10-08, after the first live day)

Yoni: "on the desktop its perfect. on phone audio works but crashing the site. also the mobile display is too small".
- **Crash = memory.**
  - Before: all 24 versions were decoded (~220 MB of PCM) with 24 sources running, and iPhone Safari killed the tab.
  - Now only what can be heard is decoded and running: each loop's DRY + its current station (8 buffers, ~75 MB).
  - A newly picked station decodes on demand; the old sound plays until the new one takes over at the same spot. The
    replaced one is released.
  - The compressed files (~11 MB) are fetched once.
  - The RevLimiter preview chain is connected only while ARM is on.
  - Verified with `window.__smxDebug()`: 8 decoded / 8 running after rapid switching; rlOn only while armed.
- **Phone layout = "Simple phone player"** (Yoni picked it from 4 options), below 760 px:
  - parts: the "How to play" paper, the dial glass (STATION n / MIXED / DRY + playhead), the same cassette deck, the
    RADIO lever, SPIN, one row of 5 photo station keys for the whole beat (59x75 px on an iPhone), "The full 4-loop
    mixer lives on a computer.", the START trial button
  - no RevLimiter on phones
  - the deck, SPIN and START are moved, not copied: one set of listeners
  - verified with touch taps at 390 and 360 px; desktop unchanged.

## Yoni's export spec

- 4 loops: drums, bass, keys, guitar. Same key and BPM, 4 bars, dry (no baked reverb/delay), all exactly the same
  length, each starts on beat 1, peaks under -6 dBFS. WAV 48 kHz / 24-bit.
- **Dry originals:** `drums.wav`, `bass.wav`, `keys.wav`, `guitar.wav` (one pass of the loop).
- **Wet renders:** the loop played **3 times back to back** through Radio Roulette, all 3 passes rendered (Claude keeps
  the middle pass, so delay and reverb tails wrap into the start and the loop is seamless). MIX 100 %, the same OS
  setting on every render, nothing else on the track or master, output level untouched.
- **Names:** `drums_station1.wav` ... `drums_station5.wav`, same for bass, keys, guitar.
- Total: 4 dry + 20 wet = 24 files.

## Build steps

| # | Owner | Step | Done when |
|---|---|---|---|
| 1 | 🧑 | **Loops + renders** per the export spec. | 24 WAVs delivered |
| 2 | 🤖 | **Check + trim.** Every file the same rate/length, peaks logged, LUFS per file logged; cut the middle pass of each wet render; seam check (samples across the loop point). | Report; 24 loop-length WAVs |
| 3 | 🤖 | **Encode.** AAC `.m4a` ~160 kbps, like the RevLimiter demos. Each file is the loop plus half a bar of padding on both sides. | 24 files, ~7 MB total |
| 4 | 🤖 | **Player engine** (Web Audio, one AudioContext). All stems start at the same context time, looping the exact loop-length window inside the padded file, so encoder priming can't break the loop and stems stay in sync. Station change = 30 ms crossfade at the same position. | Seamless loop on Chrome, Firefox, Safari, iPhone |
| 5 | 🤖 | **Mixer UI** `StationMixer.astro`, bench first. Four channels, each: DRY/1-5 preset buttons, SOLO, MUTE, level light. Master: PLAY/STOP, RADIO ON (all to DRY = the before/after), 1-5, SPIN. CTA inside the mixer. Look follows wiki `design-language.md` and Radio Roulette's `docs/DESIGN.md` (its preset keys and dial glass), not RevLimiter's monitor rack. | Yoni approves the bench look |
| 6 | 🤖 | **Wire into the page.** New `stationMixer` field in `plugins.ts` (stems, files). `[slug].astro` shows it in the garage wall in place of `AudioDemoRack`. The "Hear before/after" facts link then appears on Radio Roulette too. | Build green |
| 7 | 🤖 | **Phones.** iOS audio unlocks on the first tap. Decode lazily, at most 2 decoded versions per stem. Channels stack 2x2. Keyboard: buttons use `aria-pressed`, arrow keys move between presets. | Works on iPhone WebKit plus a 360 px screen |
| 8 | 🤖 | **Tests.** Unit test for solo/mute logic (any solo means only soloed stems play; mute beats solo). Playwright: mixer renders, play starts, solo works, RADIO ON swaps to DRY, master 1-5 sets all channels. Visual parity screenshots with RevLimiter's page. | Suite green, screenshots reviewed |
| 9 | 🧑 | **Review on localhost**, then "push". | Live |

Steps 4-5 can start before step 1 lands, on placeholder loops.

## Risks

- **Loop clicks from AAC priming.** Covered by step 4 (padded files, loop window inside). Fallback: WAV for DRY only.
- **Click at the loop point of a wet render** if the 3-pass render is skipped. Covered by step 2's seam check.
- **Phone memory.** Covered by lazy decode (step 7).
- **Page weight.** Nothing loads until the first press of PLAY; then only DRY plus the current station per stem.

## After it ships

- Google Ads: the Radio Roulette Search test (₪12/day, Ads master plan) was gated on page audio. This clears that gate;
  certification (case 4-6073000041684) is the other gate.
- Same mixer could later serve DRIFT (per-loop pan moves) with only new stems.

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
