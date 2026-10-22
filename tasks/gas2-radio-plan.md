# GAS 2 page: the radio player (plan, 2026-10-22)

Owner: Claude Code `revaudio-cd` (Yoni's laptop 2). Branch `feat/gas2-page`, worktree `Website/revaudio-website-g2p`.
Status: PLAN, waiting for Yoni's go.

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

- [ ] 🤖 1. Read `wiki design` + the site's `DESIGN.md` (UI gate), then generate the close-up art -> `player/img/`.
- [ ] 🤖 2. `player/radio.css` + `player/radio.js` (+ `player/audio/` placeholders): close-up veil, stations, keys,
      knobs, engine, scene caption/glow. Wire into page-b (one link + one script; old inline radio handler out).
- [ ] 🤖 3. Headless check desktop + phone (no errors, no 404s, A/B swaps at the same position, gains 0/1),
      screenshots, then open page-b for Yoni.
- [ ] 🧑 4. Yoni's review -> corrections folded in.
- [ ] 🧑 5. Yoni renders the 10 files -> 🤖 process + level-match + swap in.
- [ ] 6. Commit + push the branch (own files only); page moves into `src/` with Dan's page later.
