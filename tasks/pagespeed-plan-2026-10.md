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

### Phase 0 — baseline 🤖
- [ ] Run PageSpeed mobile ×3 on `/` and `/revlimiter/` today, save the median numbers here (after today's gateway change, so the baseline is honest).

### Phase 1 — bytes (small, safe) 🤖
- [ ] Wall wood + rail → WebP via `getImage()` in `GarageWall.astro` and `[slug].astro`.
- [ ] Fix `sizes`/`widths` on WordWall, PluginCard, PluginShowcase images.
- [ ] Build, Playwright compare before/after at 390 px + 1280 px (texture must look the same).

### Phase 2 — first screen 🤖
- [ ] Preload the hero plate (media-split, `fetchpriority="high"`).
- [ ] Self-host fonts, preload the 2 hero fonts, drop unused weights.
- [ ] `inlineStylesheets: 'auto'`, measure.
- [ ] Check CSP still fine (fonts become `'self'`; no new origins).

### Phase 3 — Cloudflare (dashboard) 🧑
- [ ] Cache Rule A: `/_astro/*` → 1 year browser + edge.
- [ ] Cache Rule B: HTML edge cache, short browser TTL.
- [ ] Add "Purge everything" after deploy: either by hand, or a step in `deploy.yml` (needs a CF API token with Cache Purge — new secret; Dan's call).
- [ ] 🤖 verify with `curl -sI`: `cf-cache-status: HIT`, `Cache-Control: max-age=31536000` on `/_astro/`.

### Phase 4 — INP trace 🤖 (start in parallel with Phase 1)
- [ ] Playwright + CPU throttle 4× on a phone viewport: tap menu, carousel arrows, audio demo play, Add to cart, Buy (crane), cookie banner. Record event timings (`PerformanceObserver` `event` entries).
- [ ] Fix the slowest handler(s) found. Likely candidates: scroll scrub doing layout reads per frame, Lenis on touch (could disable on touch devices).
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
