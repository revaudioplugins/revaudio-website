# Website — PageSpeed fix plan (2026-10-06)

Source: `RevAudio_PageSpeed_Fix_Plan.pdf` (PageSpeed report, 06 Oct 2026 14:33 GMT+3).
Mobile 70 / CWV FAILED (LCP 3.3 s field, 6.0 s lab; INP 379 ms; TTFB 1.5 s). Desktop 89 / PASSED.
Goal: mobile LCP <= 2.5 s, INP <= 200 ms, CLS stays <= 0.10, checkout still works.

🤖 = Claude (repo) · 🧑 = Yoni/Dan (Cloudflare dashboard; wrangler token is zone:read)

## What the code + live headers say (checked 2026-10-06)

| Report item | Root cause found | Fix |
|---|---|---|
| wall-wood 1,503 KiB, wall-rail 373 KiB | `GarageWall.astro` + `[slug].astro` use `import ... .png` → `wallImg.src` = raw PNG, never optimized. Wood is a 1024² tile drawn at 512 px; rail 1264×262. | `getImage()` → WebP (wood 1024 w, rail at its size), q≈75. Expect ~1.8 MiB → ~150-250 KiB. |
| Hero LCP late + no priority | `.hero-plate-img` is a CSS background via a `--plate-m` var. Browser finds it only after CSS parses. Files already WebP (small). | `<link rel="preload" as="image" fetchpriority="high">` for each plate with `media` queries (desktop / ≤860 px), from index.astro `slot="head"`. Check the hero entrance animation does not hide the plate. |
| 6 font families render-blocking | One Google Fonts CSS link in `BaseLayout.astro`. Special Elite used only in `AudioDemoRack`; VT323 in 2 components. | Self-host WOFF2 (`public/fonts/`, `@font-face` + `font-display:swap`), preload only Bebas Neue + Inter 400/700. Drop unused weights. Removes 2 third-party hops (googleapis + gstatic). |
| 2 render-blocking CSS files | Astro bundle (`index.*.css`, `_slug_.*.css`). | Try `build.inlineStylesheets: 'auto'` (inlines small sheets). Measure before going further. No hand-split critical CSS unless numbers demand it. |
| GAS image 800×1190 for 138×205 slot | `WordWall.astro` `sizes="(max-width: 860px) 92vw, 50vw"`, but the panel is ~140 px on phones. | Correct `sizes` to the real rendered width; add a 300 px candidate to `widths`. Same check on `PluginCard` + `PluginShowcase`. |
| Static cache 4 h | Live: GitHub sends `max-age=600`; Cloudflare "Browser Cache TTL" overrides it to `14400`. Not fixable in repo (GitHub Pages can't set headers). | Cloudflare Cache Rule: path starts with `/_astro/` → Browser TTL 1 year, Edge TTL 1 year. (Astro hashes those filenames.) |
| TTFB 1.5 s | Live: HTML `cf-cache-status: DYNAMIC` → every page request goes to GitHub Pages (fra). curl from here: ~1.3 s. | Cloudflare Cache Rule: HTML eligible for edge cache, Edge TTL ~2 h, Browser TTL short (respect origin). Purge cache after each deploy. Exclude nothing dynamic (site is static; checkout is a Paddle overlay). |
| `/nojr/` script (part of the 124 KiB unused JS) | CF Google tag gateway. **Already fixed today** (gateway OFF, gtag loads after consent). | None. Re-test will drop it. |
| INP 379 ms | Unknown. Suspects: `lenis` smooth scroll + gsap scroll scrub (`motion.ts`, `data-drift-y`), haze plates, crane door, carousel. | Measure first (below). Fix the trace's worst handler. |

## Steps

## SAFETY: reference kept (Yoni 2026-10-06: "keep current as ref ... I want the fixes to be SAFE")
- Git tag `ref/pre-pagespeed-2026-10-06` (47210f1 = live site before any change). All work on branch `perf/pagespeed-2026-10`, one commit per fix.
- `C:\RevAudio\Website\pagespeed-ref-2026-10-06\` (outside the repo): full reference build `dist-ref/`, reference screenshots (6 pages × phone + desktop),
  reference Lighthouse runs, and the check tools (`capture.mjs` + `compare.py` screenshots, `measure-imgs.mjs` + `imgdiff.py` image sharpness,
  `inp.mjs` tap timing, `lhsum.py`). README there = rollback steps.
- Every fix passes: screenshots 0.00% changed vs reference, no image smaller than its slot, Lighthouse A/B same server.

### Phase 0 — baseline 🤖
- [x] PageSpeed API quota was exhausted → local Lighthouse 12.8 mobile ×3 on live `/`: median score 68, LCP 4.5 s, CLS 0.153, 2,812 KiB.

### Phase 1 — bytes (small, safe) 🤖
- [x] Wall wood + rail → WebP via `getImage()` in `GarageWall.astro` (`[slug].astro` already did it, same settings reused).
- [x] Fix `sizes`/`widths` on WordWall, PluginCard, PluginShowcase images (GAS portrait was the waste; first try broke Radio Roulette's store card, caught by the check, fixed via `cardThumbMaxWidthPct`).
- [x] Checked: screenshots 0.00% changed, 199 image checks no regression. Home on phone 3,073 → 1,008 KiB. Commit `0a2ad61`.

### Phase 2 — first screen 🤖
- [x] Preload the hero plate (media-split, `fetchpriority="high"`). Hero load delay 257 → 7 ms.
- [x] Self-host fonts (same Google files, all subsets kept → zero visual change), preload Bebas Neue + Inter latin. Weights NOT dropped (all in use; safety).
- [x] `inlineStylesheets: 'auto'` was already on. Splitting the 2 big CSS files skipped: risky, ~1 s lab gain at best.
- [x] CSP fine (fonts now `'self'`). A/B Lighthouse: score 65 → 74, FCP 3.9 → 3.0 s, LCP 6.6 → 5.6 s, CLS 0.092 → 0. Commit `9bd1d2c`.

### Phase 3 — Cloudflare (dashboard) 🧑
- [ ] Cache Rule A: `/_astro/*` → 1 year browser + edge.
- [ ] Cache Rule B: HTML edge cache, short browser TTL.
- [ ] Add "Purge everything" after deploy: either by hand, or a step in `deploy.yml` (needs a CF API token with Cache Purge — new secret; Dan's call).
- [ ] 🤖 verify with `curl -sI`: `cf-cache-status: HIT`, `Cache-Control: max-age=31536000` on `/_astro/`.

### Phase 4 — INP trace 🤖 (start in parallel with Phase 1)
- [x] Probed (inp.mjs) at 4× and 10× CPU slowdown: cookie accept/decline, menu, demo play/A-B/stop, add to cart. All < 200 ms (worst 176 ms at 10×). Handlers ~0 ms; cost = ~45 ms busy main thread (constant animation) + paint.
- [ ] NOT fixed: lab cannot reproduce 379 ms. Field number is 28-day, site-wide, and includes the pre-consent CF-gateway gtag removed today. Next: 🧑 Cloudflare → Web Analytics → Core Web Vitals → INP debug view (shows the slow element), re-check after ~2026-11-03. Touching the approved motion only with evidence.
- [ ] Checkout regression: Paddle overlay opens; real test purchase only if Cart/checkout code is touched (wiki rule).

### Phase 5 — ship + verify 🤖
- [ ] Commit per phase, push only when Dan says push.
- [ ] Re-run PageSpeed ×3, record median vs Phase 0.
- [ ] Field data (CWV pass/fail) needs ~28 days to roll over — re-check ~2026-11-03.
- [ ] Wiki `website-update.md`: add the cache rules + image/font rules (ride-along).

## Not doing
- Changing host (TTFB fix is edge caching first; re-measure before any move).
- Removing the texture/wall look — compress it, keep it.
- Re-adding `display=swap` (already there; self-hosting replaces the link anyway).
