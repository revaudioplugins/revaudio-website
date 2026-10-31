# GAS 2 page — station mockup (work in progress, not built into the site)

The GAS 2 product page as one interactive scene: a 1950s desert gas station at dusk, every prop on the lot does something.
Static HTML, no build step. Not part of the Astro site yet; it moves into `src/` once the page is signed off.

## Run it

```
cd tools/_gas2-scene
python -m http.server 4462 --bind 127.0.0.1
```

- `page-b.html` — **the working page.** Readings (right side), wall sign = the 3 grades, taped notes, radio = the player,
  mailbox = email signup (+ the MAIL ME THE KEYS poster above it, 4 options in TUNE → Mail poster), chalkboard = prices, pump = opens the real plugin UI (served separately on :4461 from the GAS2
  repo's `Source/ui/public`; optional).
- `page-a.html` — frozen snapshot of 2026-10-22 (read-only), for comparison.
- `ab.html` — A and B side by side (or Flip with A / B / Space) at real window sizes.
- `page-b.html?bench` — the shared RevAudio bench harness on B (click, drag, resize, fonts, colors, EXPORT). Needs
  `bench.js` next to the page: symlink or copy `revaudio-shared/tools/bench/bench.js` here (not committed: machine path).
- The taxi to the store — after MAIL ME THE KEYS a 1950s cab pulls up at the curb, idles, honks; a click (or the button,
  now a red "To the store") = tyre squeal, dust, the store at Radio Roulette. `?taxi=park` shows it parked, `?taxi=bench`
  sizes it. How it works: `taxi/README.md`.
- TUNE (button bottom right, or T) — readings position / size + the 4 looks (Now / Neon / Enamel / Badge).

## Who works on what (one writer per file set)

- **The player (the radio, `<!-- 3. radio player -->` block + its `.radio*` / `.dial` CSS): Yoni.** Build it in its own
  files under `player/` and wire it into `page-b.html` with one `<link>` + one `<script>` line, so the page and the player
  never edit the same lines.
- **Everything else in `page-b.html` (readings, layout, props, copy): Dan's session.**
- **The window posters (were the notes) + the pump spotlight (`.note*` / `.poster` `.pk/.pl/.ps` + `props/poster-*.webp`, `.pumpCut` / `.pumpLit`, TUNE → Spotlight,
  `props/pump-cut.png`): Dan's 2nd session (danavivi-59), branch `feat/gas2-page-s2`, from 2026-10-23.** Merged with
  `feat/gas2-page` into `main` 2026-10-23.
- **The taxi to the store (`taxi/**` + its one `<link>`/`<script>` line in `page-b.html`): Claude Code `danavivi-a5`,
  from 2026-10-31.**
- Claims and state: `tasks/handoff.md` (top entry).

## Not in git

The other 16 candidate frames, the reference photos and the frame-generation scripts stay on Dan's Mac
(`tools/_gas2-scene/` in his main clone). Fonts here are SIL OFL; the frame + props are our own generated art.
