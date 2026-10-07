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
- [x] Cache Rule A: `/_astro/*` → 1 year browser + edge. Live 2026-10-07 (`max-age=31536000`, HTML + other files unchanged). Gotcha: Field must be **URI Path**; "URI Full" is the whole https://… address and never matches `/_astro/`.
- [x] Cache Rule B "Cache pages at the edge": `(http.host eq "revaudio.net" and not starts_with(http.request.uri.path, "/_astro/"))`, edge 2 h, browser 10 min (= origin 600). Live 2026-10-07: pages HIT, TTFB ~1.3 s -> ~0.25 s from here.
- [x] `deploy.yml` step "Clear Cloudflare cache" (purge_everything) after each deploy, secret `CLOUDFLARE_PURGE_TOKEN` (account token, Cache Purge on revaudio.net only; cannot read DNS). Commit `1d2aced`, first run `"success":true`; purge -> MISS proven. Token was pasted in chat once: roll it later.
- [x] 🤖 verified with curl: `/_astro/` max-age=31536000, pages HIT max-age=600.

### Phase 4 — INP trace 🤖 (start in parallel with Phase 1)
- [x] Probed (inp.mjs) at 4× and 10× CPU slowdown: cookie accept/decline, menu, demo play/A-B/stop, add to cart. All < 200 ms (worst 176 ms at 10×). Handlers ~0 ms; cost = ~45 ms busy main thread (constant animation) + paint.
- [ ] NOT fixed: lab cannot reproduce 379 ms. Field number is 28-day, site-wide, and includes the pre-consent CF-gateway gtag removed today. Next: 🧑 Cloudflare → Web Analytics → Core Web Vitals → INP debug view (shows the slow element), re-check after ~2026-11-03. Touching the approved motion only with evidence.
- [x] Checkout regression (live, 2026-10-07): add to cart -> tick terms -> Paddle overlay opens, RevLimiter $49. Cart code untouched, so no test purchase. Pre-existing CSP warnings seen (not from this work): `style-src` lacks `https://cdn.paddle.com` (paddle.css) and `script-src` lacks `https://public.profitwell.com`; overlay works anyway. Separate small CSP fix.

### Phase 5 — ship + verify 🤖
- [x] Pushed 2026-10-07 on Yoni's "push" (main e683fb3). Live smoke: 0 errors / 0 failed requests, live screenshots = tested build (0.00%), home on phone 537 KiB transferred.
- [x] PageSpeed API quota exhausted again; Lighthouse 12.8 mobile ×3. Live from this laptop: median 68 -> 74 (best 84), CLS 0.153 -> 0, server response 220 -> 80 ms; LCP noisy (3.9-5.5 s) from home connection. Fair A/B, same compressed local server: OLD 72 / LCP 4.2 s / FCP 3.4 s vs NOW 93 / LCP 3.2 s / FCP 1.5 s / CLS 0. Font preloads tested: removing them is worse (87-88, CLS back), so kept. Official PageSpeed re-run: 🧑 run pagespeed.web.dev once the quota resets.
- [ ] Field data (CWV pass/fail) needs ~28 days to roll over — re-check ~2026-11-03.
- [ ] Wiki `website-update.md`: BLOCKED 2026-10-07, the shared repo's git is damaged (`fatal: unable to read tree 24872f10...`, fsck: missing blobs, bad reflog; stash `v0.37.2 shared docs` from another session). Not repaired here. Paste this section into the page once the repo is fixed:

  > ## Speed + caching (PageSpeed pass 2026-10-07)
  > - **Fonts are self-hosted**: `src/styles/fonts.css` + `src/styles/fonts/*.woff2` (hashed into `/_astro/`). No Google Fonts link. New font = add the woff2 there + an `@font-face`; preload only first-screen faces (BaseLayout).
  > - **CSS-background images must go through `getImage()`**: `import x from '...png'` + `x.src` ships the raw master (that cost 1.9 MB on the home page).
  > - **srcset `sizes` must match the real slot**: portrait or capped images (GAS) get their own sizes. Check with `pagespeed-ref-2026-10-06/measure-imgs.mjs` (+ `imgdiff.py`): no image may get fewer pixels than its slot.
  > - **Cloudflare Cache Rules** (Caching → Cache Rules): A `Long cache for _astro files` = URI **Path** starts with `/_astro/` → edge + browser 1 year. B `Cache pages at the edge` = `(http.host eq "revaudio.net" and not starts_with(http.request.uri.path, "/_astro/"))` → edge 2 h, browser 10 min. Gotcha: "URI Full" is the whole https:// address and never matches a path.
  > - **Deploy clears the Cloudflare cache**: `deploy.yml` step "Clear Cloudflare cache" (purge_everything) with secret `CLOUDFLARE_PURGE_TOKEN` (account token, Cache Purge on revaudio.net only). If that step goes red, visitors see old pages for up to 2 h: fix the token, or purge by hand (Caching → Configuration → Purge Everything).
  > - CSP: `fonts.googleapis.com` / `fonts.gstatic.com` are no longer needed. Missing today: `https://cdn.paddle.com` in style-src (paddle.css) and `https://public.profitwell.com` in script-src.

## Not doing
- Changing host (TTFB fix is edge caching first; re-measure before any move).
- Removing the texture/wall look — compress it, keep it.
- Re-adding `display=swap` (already there; self-hosting replaces the link anyway).

## CSP edit 2026-10-07 (rollback value)
Before (live until the 2026-10-07 edit), paste back into Rules → Transform Rules → Security Headers → Content-Security-Policy to undo:
```
default-src 'self'; script-src 'self' 'unsafe-inline' https://assets.lemonsqueezy.com https://static.cloudflareinsights.com https://connect.facebook.net https://www.googletagmanager.com https://cdn.paddle.com https://googleads.g.doubleclick.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.paddle.com https://*.lemonsqueezy.com https://www.facebook.com https://formspree.io https://revlimiter-license.revaudio.workers.dev https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://cloudflareinsights.com https://www.google.com https://ad.doubleclick.net; frame-src https://*.lemonsqueezy.com https://*.paddle.com https://www.youtube-nocookie.com https://www.google.com
```
DONE 2026-10-07, live-verified (pagespeed-ref-2026-10-06/cspcheck.mjs): fonts load, gtag+fbq after Accept, Paddle overlay opens, beta worker reachable (204), 0 console errors. Change: + cdn.paddle.com (style-src), + public.profitwell.com (script-src), + revlimiter-beta worker (connect-src; /beta form fetch was blocked live); - Google Fonts hosts (self-hosted now), - retired store hosts.
