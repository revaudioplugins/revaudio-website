# Website handoff

Updated: 2026-07-19 (CSP fixed + forms POST successfully — email delivery not yet confirmed)

## 2026-07-19 — CSP connect-src fixed, forms POST successfully; email delivery still unconfirmed
Gil added `https://formspree.io` to the `connect-src` directive in the Cloudflare Transform Rule
("Security Headers", Rules → Transform Rules → Modify Response Header). Verified via curl
(cache-busted) that the edge now serves the updated CSP, then re-tested both forms end-to-end in
a real browser tab (had to cache-bust the tab's own load once — the first retry still hit a
pre-fix cached document even though the edge was already updated):
- **Affiliate form**: real UI submission → success message rendered, POST returned `ok:true`.
- **Newsletter form** (`f/maqzlgwa`): same fix covers it (same connect-src rule) — confirmed with
  a direct POST, `ok:true`.
- **BUT: Gil reports no email received yet at info@revaudio.net.** `ok:true` from Formspree's API
  only means the submission was accepted, not that a notification email actually sent. Likely
  cause: Formspree requires a one-time "confirm this form" click (sent to the notification email)
  on a newly created form's first submission before ANY notifications deliver — same behavior
  noted for the newsletter form back on 2026-06-13 ("Formspree sends owner a one-time confirm
  email on the FIRST submission to activate the form"). **Next step: check info@revaudio.net inbox
  + spam for that confirmation email, click it, then re-test.**
- **Cleanup needed regardless:** several test submissions (names like "CSP Fix Verification...")
  landed in both Formspree forms' Submissions tabs during this diagnosis — clear those out so they
  aren't mistaken for real applicants/subscribers.
- New CSP connect-src for reference: `'self' https://api.paddle.com https://*.lemonsqueezy.com
  https://www.facebook.com https://formspree.io`.

## 2026-07-19 — Affiliate Program Formspree endpoint wired (e0f8160, live)
- `site.affiliateFormEndpoint` now points at the real form: `https://formspree.io/f/mykrwolg`
  ("RevAudio Affiliate Applications" form, created by Gil). No longer a placeholder — the form
  will actually submit.
- Also added (a34dbb4): H1 splits "Affiliate" / "Program" across two lines; an optional
  "Other platforms" textarea lets applicants list more than one channel (one per line) instead
  of being limited to a single URL + platform pick.
- Notification recipient confirmed set to info@revaudio.net in Formspree Settings (2026-07-19).
- **BLOCKER found 2026-07-19: real submissions fail with "Failed to fetch"/"Network hiccup" on the
  LIVE site.** Root cause is the edge Cloudflare CSP (Rules → Transform Rules → Modify Response
  Header) — its `connect-src` is `'self' https://api.paddle.com https://*.lemonsqueezy.com
  https://www.facebook.com` and does NOT include `https://formspree.io`, so the browser blocks the
  fetch() before it reaches Formspree at all. Confirmed via `curl -sI https://revaudio.net/affiliate/`
  and reproducing the fetch directly in-page (TypeError: Failed to fetch). Same class of bug as the
  earlier webfonts/YouTube-frame CSP gaps — dashboard-only fix, Wrangler token is zone:read so CLI
  can't touch Transform Rules. **Fix: add `https://formspree.io` to connect-src.**
  **This almost certainly also breaks the newsletter form** (same fetch-to-formspree.io pattern) —
  re-test both once the CSP is fixed.
- STILL TO DO once CSP is fixed: one real test submission on the live site to confirm the email
  actually lands in the info@revaudio.net inbox end-to-end.

## 2026-07-16 — Affiliate Program page (693e2f3, live)
- New `/affiliate` page (nav label "Affiliates" — full "Affiliate Program" kept as page title/H1;
  "Affiliate Program" alone was the widest nav item by 60px+, so shortened to avoid worsening the
  existing 700px-to-~1074px dead zone where the desktop nav has no burger fallback and can overflow —
  that gap pre-dates this change, not fixed here, just not made worse).
- Application form (name, email, channel URL, platform select, audience size, why) POSTs to
  `site.affiliateFormEndpoint` in `src/data/site.ts`.
- Approval flow is manual-review-only by design (matches how Waves/iZotope-style plugin affiliate
  programs work) — no auto-accept path was built.

## 2026-07-14 — RevLimiter free-trial stamp + Driver's Manual video (2c6e166, live)
- New `TrialStamp.astro`: "GET YOUR FREE 14 DAYS TRIAL" on the door's buy-patch asset (B3 night-plate take), L2 hover lamp, press-in → navigates to the license worker `/download`. Mounted in `[slug].astro` between title and door (`.trial-slot` top 25px / left 48.4%, user-placed).
- Position bench ON the real page: open `/revlimiter/#cranep=1&stampedit=1` → drag stamp / arrow-nudge, readout prints paste-ready CSS. Conditional Astro scripts ship VERBATIM — keep that block plain JS (no TS).
- New "Driver's Manual" section between Hear-it and System requirements — data-driven via `plugins.ts` `tutorialVideo` (+ `trialUrl`); youtube-nocookie embed.
- **BLOCKER: the edge Cloudflare CSP (Transform Rules → Modify Response Header) frame-src only allows lemonsqueezy → the video shows a grey broken frame on live. Fix in CF dashboard: add `https://www.youtube-nocookie.com` to frame-src. Wrangler token is zone:read — CLI can't do it.**
- Pre-existing, FYI Gil: `connect.facebook.net/fbevents.js` (Meta pixel) is also CSP-blocked by script-src.
- Design bench kept at `bench/trial-stamp-test.html`.

## 2026-06-18 — RevLimiter checkout LIVE on Lemon Squeezy
- Back on Lemon Squeezy (Paddle plan dropped); store now activated, RevLimiter live.
- `REVLIMITER_CHECKOUT_URL` in `src/data/plugins.ts` = LS LIVE variant `.../checkout/buy/78885904-8a19-4e23-9510-31b50775ada5` (commit e43bcbf). Single source of truth; Cart/BuyButton read it.
- **Bug fixed (875e8d4):** Cart.astro was persisting `checkoutUrl` in localStorage, so a cart that added RevLimiter before the URL swap kept launching the OLD test link → LS orange TEST banner on-site while the direct link was clean. Now Cart bakes a `slug->checkoutUrl` catalog map (`[data-checkout-map]` JSON) and resolves fresh at checkout; never trusts stored URL. URL changes now take effect for everyone on deploy.
- LS test vs live: same `revaudiopg` subdomain + (here) same variant URL — the TEST banner is store-activation-level, not a separate URL. Don't chase "live variant URLs".
- STILL TO VERIFY (user): real test purchase delivers download + license key; LS-generated key must match plugin LicenseManager format `REVL.<b64>.<sig>` or fulfillment breaks despite checkout working. See memory project_revlimiter_lemonsqueezy_migration.


## Shipped today (all live on revaudio.net)
- **Scroll-scrub background system**: fixed `.page-bg` layer behind everything, brass dashboard art
  (`public/bg/aurora-test.webp`, 2048x6144, 106KB) sweeps top-to-bottom with page scroll.
  Logic in `src/lib/pagebg.ts`, wired in BaseLayout. Art width 90vw, side-fade via `.page-bg::after`.
- **Fluid layout**: `--maxw: min(1240px, 98vw)` (was fixed 1200px), nav follows.
- **Hero tuning**: gauge column `min(38vw, 520px)`; redline/lede/cta offsets via
  `--redline-x/--lede-x/--cta-x` defaults (198/92/218px) in index.astro.
- **Plugin section**: heading centered above card, card 730px, status label removed from PluginCard
  ("Checkout reopening soon" no longer shows on cards; product-page pill untouched).
- **Sections**: DAW strip tightened (2.5rem pad, 1.25rem gap, 1.05rem chips); newsletter 6rem pad,
  150px button, **fully transparent** (sits on bg art); footer 1.25/1.75rem.
- **New pages/nav**: `/terms` T&C page (14 sections, industry standard); nav = Home/Store/About/Support/T&C.

## Benches (the big workflow win)
`public/bench/home-bench.html` — master bench, live on prod too. Every homepage section has
sliders (bg width, hero, page frame, plugin, DAW, testimonials, press, newsletter, footer up/down).
User tunes on THEIR screen, hits COPY VALUES FOR CLAUDE, pastes; Claude bakes values into source
and syncs bench defaults. Also: `layout-bench.html`, `hero-bench.html` (superseded by home-bench).
**Bench defaults must stay synced with shipped CSS** — RESET ALL = production state.

## Open threads
- `aurora-test.webp` is the FINAL art for now but still has the test name — rename when user locks art direction.
- Newsletter/Formspree + Paddle checkout still on placeholder tokens (site.ts / plugins.ts).
- Background asset pipeline: ChatGPT art -> Real-ESRGAN 4x (C:\RevAudio\shared\tools\realesrgan) -> sharp resize 2048w -> webp q84.
- User laptop renders at 1280x665 CSS (sometimes dpr 2) — Playwright-test at 1280x665 FIRST.

## Don't touch
- DSP/plugin repos unaffected. Partner's motion system (lib/motion, reveal, scrub, splittext, walkthrough) untouched except pagebg addition.
