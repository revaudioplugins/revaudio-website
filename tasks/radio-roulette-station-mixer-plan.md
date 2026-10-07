# Radio Roulette page: the Station Mixer (plan, 2026-10-07; execute 2026-10-08)

Idea (Yoni): replace the plain before/after player with a 4-loop jam. Drums, bass, keys and guitar loops in the same key
and BPM. Each loop gets its own station knob, like Radio Roulette's TUNE. The visitor solos one or more loops, flips
stations, then drops the solos and hears the whole beat with every effect on it.

Page style = RevLimiter's (same template already: crane door, facts line, walkthrough, video). The only real gap is
audio: `audioDemos: []` today, so the page has no "Hear it" at all. The Station Mixer fills that slot.

## Non-negotiables

- **Honest sound.** Every station you hear is real Radio Roulette output, rendered offline through the installed VST3
  (`seed` parameter = the station number). No Web Audio imitation of the effects. The station number on screen is the
  real one: the same number in the plugin gives the same sound (the plugin's own claim, "the same station always plays
  back the same result").
- **Same level rules as the plugin.** One gain per stem for all its versions; no extra loudness on the wet versions.
- **Consent rules unchanged.** No new tracking.

## Decisions for Yoni (morning)

1. 🧑 **Loops: who makes them?**
   - Recommended: our own loops (Yoni / Dan / Ilay). Rights are clean.
   - Fallback: a licensed royalty-free pack, but only if its licence allows playback in a web player. Many packs forbid
     "redistributing loops as-is"; a web player is downloadable.
   - Spec: 4 stems (drums, bass, keys, guitar), same key and BPM, 4 bars (example: 95 BPM = 10.1 s). WAV 48 kHz /
     24-bit, dry (no reverb or delay tails baked in), each starts exactly on beat 1, peaks under -6 dBFS.
2. 🧑 **How many stations per loop:** recommended 6 plus DRY, picked by ear. I render ~20 candidates per stem; Yoni picks
   on a listening bench.
3. 🧑 **Name** for the section (examples: "Station Mixer", "Garage Radio", "Jam Room"). `name-the-thing` skill if wanted.

## Build steps

| # | Owner | Step | Done when |
|---|---|---|---|
| 1 | 🤖 | **Render tool** `tools/rr-station-render/` (pedalboard): load `Radio Roulette.vst3`, set `seed`, MIX 100 %, OS 2x. Feed each loop 3x back to back and keep the middle pass, so delay and reverb tails wrap into the start and the loop is seamless. | Script renders a stem at a given station |
| 2 | 🤖 | **Prove render = plugin.** One station rendered by the script vs the same station bounced in a DAW: null test. | Null passes (or the gap is explained) |
| 3 | 🤖 | **Candidates.** ~20 stations per stem plus DRY, LUFS logged per file. | WAVs plus a list of the station numbers |
| 4 | 🧑 | **Listening bench** (local page): pick 6 stations per stem, and check they sound good together. | Picks saved to `stations.json` |
| 5 | 🤖 | **Encode.** AAC `.m4a` ~160 kbps, like the RevLimiter demos. Each file is the loop plus half a bar of padding on both sides. | 28 files, ~8 MB total, ~1.2 MB on first play |
| 6 | 🤖 | **Player engine** (Web Audio, one AudioContext). All stems start at the same context time, looping the exact loop-length window inside the padded file. The content repeats every loop length, so any encoder start offset can't break the loop; all files share the encoder, so the stems stay in sync. Station change = 30 ms crossfade into the new version at the same position. | Seamless loop on Chrome, Firefox, Safari, iPhone |
| 7 | 🤖 | **Mixer UI** `StationMixer.astro`, bench first. Four channels; each has a TUNE knob, a station read-out, SOLO and MUTE buttons, and a level light. Master section: PLAY/STOP; RADIO ON (all stems back to DRY = the before/after); SPIN (a random pick per stem from the chosen set). Look follows wiki `design-language.md` and Radio Roulette's `docs/DESIGN.md` (its TUNE knob and dial glass), not RevLimiter's monitor rack. | Yoni approves the bench look |
| 8 | 🤖 | **Wire into the page.** New `stationMixer` field in `plugins.ts` (stems, stations, files). `[slug].astro` shows it in the garage wall in place of `AudioDemoRack`. The "Hear before/after" facts link then appears on Radio Roulette too. | Build green |
| 9 | 🤖 | **Phones.** iOS audio unlocks on the first tap. Decode lazily, at most 2 decoded versions per stem (~30 MB, not ~110 MB). Channels stack 2x2. Keyboard: arrow keys turn knobs, buttons use `aria-pressed`. | Works on iPhone WebKit plus a 360 px screen |
| 10 | 🤖 | **Tests.** Unit test for solo/mute logic (any solo means only soloed stems play; mute beats solo). Offline seam check: decode a file and compare the samples across the loop point. Playwright: mixer renders, play starts, solo works, RADIO ON swaps to DRY. Visual parity screenshots with RevLimiter's page. | Suite green, screenshots reviewed |
| 11 | 🧑 | **Review on localhost**, then "push". | Live |

## Risks

- **Loop clicks from AAC priming.** Covered by step 6 (padded files, loop window inside). Fallback: WAV for the dry
  stems only.
- **Phone memory.** Covered by lazy decode (step 9).
- **Render vs real plugin drift** (sample rate, OS setting, a random-state reset). Covered by the null test (step 2).
- **Page weight.** Nothing loads until the first press of PLAY; then only DRY plus the current station per stem.

## After it ships

- Google Ads: the Radio Roulette Search test (₪12/day, Ads master plan) was gated on page audio. This clears that gate;
  certification (case 4-6073000041684) is the other gate.
- Same mixer could later serve DRIFT (per-loop pan moves) with only new stems and a new render chain.
