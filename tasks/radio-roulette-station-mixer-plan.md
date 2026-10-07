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
