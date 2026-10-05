# /drift laptop work — handoff to Gil (2026-10-05)

From Dan's design sessions (Claude Code on Dan's Mac). Branch **`feat/drift-drive-fit`** (pushed to origin), built on `f9f4117` (feat/drift-page as of 10-04 morning). Merge to main = live deploy → **Dan's explicit OK only**.

## What's on the branch

Laptop only (≥ 1001 px). Phones, tablets and the 1000 px view are pixel-identical to before.

| Commit | What |
|---|---|
| `875848b` | #drive panel fits one laptop screen (height knob `--t`) |
| `78325be` | #fx panel fits one laptop screen |
| `7108d65` | **FX crane**: scrolling pins #drive and the plugin's FX-bay crane pulls #fx down onto the same box; keep-it TV moves after #fx (`src/lib/drift/crane.ts`) |
| `6576096` | GPS caps: PAUSE and STOP in full colour |
| `eac03f1` | #creators: reading centred |
| `9c4c2cb` | #creators ON AIR monitor = video-player look, ▶ plays a how-to inside the monitor (glitch in, end screen = APPLY), pixel mesh over the text |

## Try it

- QA preview (production build of `9c4c2cb`, not live, noindex): https://drift-crane.revaudio-qa.pages.dev/drift/ on a laptop, Safari and Chrome. Don't submit the email forms: they hit the real backend.
- Local: `npm run dev`, then `/drift/`.

## Open, before main

1. 🔴 **The how-to video is a SAMPLE** (`public/drift/creators-howto-sample.mp4` + `.vtt`, "SAMPLE" on screen). When Dan's real screen recording exists:
   - encode H.264 MP4 (`-pix_fmt yuv420p -movflags +faststart`, ~1280×720) and write a WebVTT captions file;
   - put both in `public/drift/`, point `drift.creatorsVideo` in `src/data/drift.ts` at them (path without extension) and update `creatorsVideoLength`;
   - delete the sample files.
   Or set `creatorsVideo: null` to ship without the player.
2. **Merge into `feat/drift-page`** (pushed, `a5a4231`: the phone redesign). A trial merge (`git merge-tree`, 10-05) conflicts in two files only: `src/lib/drift/trackui.ts` and `src/components/drift/DriftCreators.astro`. `drift.css` and `drift.ts` merge cleanly. Keep both sides: the phone pass's changes + this branch's `drift:covered` gate (trackui) and the player markup/script (DriftCreators, laptop-only, hidden on phones).
3. Team QA on the preview. Fixes go on this branch, then rebuild and redeploy the preview (recipe below).
4. Merge to main: Dan's word.
5. After QA: delete the preview project.

## Don't undo (each one was a measured fix)

- `crane.ts` starts the FX panel just hidden behind the nav, not a window height up: that out-of-sight travel was dead scroll (~1 s of a stuck page on a slow trackpad).
- `.d-crane-stage { clip-path: inset(-100vh 0 -40px 0) }`: without it Chrome re-rasters the GPS car/track drop-shadow glows ~2× per frame inside the sticky layer (idle 25 → 39 fps). It clips nothing visible.
- Reduced motion = no crane. #fx moves INSIDE `.d-drivezone` right after #drive, so the neon rails' sticky tail still falls on the keep-it TV.
- The player look uses no YouTube logo, name or icon (trademark): the vibe only.
- Never name a hook `data-drift` (`scrub.ts` owns it); use `data-drift-*`.

## Known and accepted

- The freeze check flags the top ~25 px of #get on laptop: the FX panel's own drop shadow used to fall there. #get itself is identical.
- Keyboard users tabbing back up (Shift+Tab) skip the #drive controls while the FX panel covers them (they're inert by design); scrolling up restores them.
- Phones keep the grey STOP cap (the phone session's call).

## Checks used

On Dan's Mac only, in `node_modules/.cache/drift-qa/fx-crane/` (not in git):
- `scope-gate.mjs`
- `freeze-gate.mjs compare base <dir>`
- `crane-gate.mjs <dir>`: WebKit + Chromium, 4 laptop sizes, reduced motion, 1000 px
- the `drive-fit` / `fx-fit` fit gates

Ask Dan's session to commit them if you want them.

## QA preview recipe

Cloudflare Pages project `revaudio-qa`, account info@revaudio.net. Build in a throwaway checkout: wrangler 4.14x's `pages project create` rewrote the repo (Workers autoconfig) and emptied `dist`. The project exists now, so plain `pages deploy` is safe.

```sh
git worktree add --detach /tmp/qa <sha> && cd /tmp/qa && npm ci && npx astro build
printf '/*\n  X-Robots-Tag: noindex, nofollow\n' > dist/_headers
find dist -type f | wc -l   # expect ~238; "Uploaded 0 files" = an empty dist
npx wrangler pages deploy dist --project-name revaudio-qa --branch drift-crane --commit-hash <sha>
# teardown after QA:
npx wrangler pages project delete revaudio-qa
```
