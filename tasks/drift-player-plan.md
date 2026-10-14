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

## Open questions for Yoni

- Default switch position on load: DRIFT ON (now) or BYPASS?
- Loop the track (now) or play once and stop?
- A download / trial plate on the toy, or leave the page's own CTA?
- Remove the "SPEED SOUNDS BETTER" sticker / bottom lip text?
- Even out the 5 tracks' levels with each other (synth is ~10 LU louder than perc)?
- OK to keep the originals turned down to match DRIFT (fair A/B), or play the raw levels?
