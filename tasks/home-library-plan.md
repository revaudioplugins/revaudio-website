# Home LIBRARY: the TV becomes the plugin browser (branch `feat/home-library`)

- Owner: Claude Code `revaudio-a0` (was `revaudio-a6` before a restart; laptop 1). Status: **IN PROGRESS (user's "go"
  2026-10-18).** Phases 1-4c done (local commits, not pushed). Waiting on the user's look (bench + real devices) and "push".
- origin/main `141d400` (crane WebP, trial source, /revlimiter/ Ads fixes) merged in 2026-10-18 before phase 3 (`d80e459`).
- Worktree: `.claude/worktrees/home-library` off origin/main `697f49d`; origin/main `ddada3d` (the TV weight work)
  merged in 2026-10-18 (`8ca4938`). `node_modules` = junction to the main clone's.
- "apply ww bench" (the TV frame roll pick) now lands on THIS branch: WordWall.astro is rewritten here, so never
  apply it to main's copy.
- Push: nothing goes live without the word "push" (main = live).

## The request (user, 2026-10-15)

- Home page only. The carousel (`PluginShowcase`) and the Store nav item go. Switching between plugins lives
  in the TV (`WordWall`) and only there.
- A LIBRARY button top right opens plugin categories on the TV (Mastering, Modulation, Distortion, ... + FREE).
- Picking a category: the TV's glowing words become plugin names with a thumbnail. Clicking one lights it and shows
  a bigger image, a short description, "Try it free" (email gate) and a smaller "Go to product page".
- More plugins later: the list scrolls, plus a search.
- Later: product pages get "If you like this one you may also like".
- Soon: a 1-5 star rating on every product page, with insights.

## Coordination

- `revaudio-32` holds an ACTIVE claim on `src/components/WordWall.astro` (the TV weight fix, 2026-10-15, in
  `.claude/worktrees/drift-wordwall`). Phase 2 rewrites that file, so it starts only after that claim closes and
  this branch has their commit.
- "apply ww bench" (the TV frame roll pick) is still open. The frame stays in this design, so that pick still applies.

## Decisions (user, 2026-10-15; all four took the recommended option)

- D1 Button label: **PLUGINS** (not LIBRARY: peers use "Library" for a customer's own downloads). "LIBRARY" may
  still appear as the heading inside the TV; decide on the bench.
- D2 Categories: **inside the TV, always visible.** The TV opens on the ALL channel with the category buttons in it;
  the header button scrolls to the TV. (Confirms "על המסך" = on the TV, not an overlay over the page.)
- D3 `/store`: **redirect to the home TV** (`/#plugins`; ALL is the TV's default, so no parameter). Note: the research synthesis leaned the other way (keep a
  catalog page, drop only the nav item: every readable peer except Kilohearts and Denise keeps one). The user took
  the redirect: the catalog is 4 live plugins, the product pages carry search and ads, and one place to browse.
- D4 Ratings: **verified users only, on its own branch after this one.** Stars show from ~5 ratings, with the
  count; insights = a team page, not public.

Go: answers are not a go. Source work starts only on the user's explicit "go".

Defaults taken unless the user objects: a price line in the preview (`$49` / `$19` / `Free download` /
`Beta: free 30-day trial`), no Add to cart on home (buying stays on the product page); plugins in development
without an open trial (The AC) stay off the TV; the TV never changes by itself (no auto-cycling).

## Phases

### Phase 1: catalog data (no visual change)

- [x] `src/data/library.ts`: the category list (id, label, short label, order); `tvCats()` hides a category with no
      plugin on the TV. `tvPlugins()`: on the TV = has a `library` entry AND (live OR `trialOpen`); order DRIFT first
      while `drift.homeLead`, then revlimiter, gas, drift, radio-roulette.
- [x] `plugins.ts`: per plugin `library: { cats, typeWord, words, blurb, alt, name? }` (new fields only; `name`
      = DRIFT in capitals on the TV). The claim had closed, so WordWall.astro already reads its panels from it.
      Proof of "no visual change": `dist/` byte-identical to the pre-edit build (463 files, `diff -rq` empty,
      index.html rewritten at build time).
- [x] Starting categories (research taxonomy; every plugin listed wherever it truly does the job):
      ALL (default) | Mastering: RevLimiter | Vocals: DRIFT | Saturation & Distortion: GAS |
      Modulation & Stereo: DRIFT | Creative FX: Radio Roulette, DRIFT | Free: GAS (from `isFree`, never listed).
      Hidden until a plugin ships: Reverb & Delay, EQ & Dynamics, Guitar & Bass, Instruments.
- [x] `tryAction(p)` + `priceLine(p)` in library.ts: paid live = trial gate with `dlGateId(p)`; GAS = the free gate
      (`data-gate-free`, "Free download") while `trialGateActive`, else its plain download link; DRIFT = `/drift#try`.
      Trial length checked in source 2026-10-18: RevLimiter + Radio Roulette `trialDaysRemaining()` = 30 days
      (`PAID_TRIAL_DAYS`); DRIFT = `drift.trialDays`. Found: index.astro's testimonial CTA says "14-day free trial"
      (wrong: the code says 30) — told the user, fixed on this branch with the home page rework.

### Phase 2: the TV becomes the library (done 2026-10-18)

- [x] Category buttons on the TV: ALL (default, every live plugin, zero clicks) + every non-empty category.
      A one-plugin category opens with that plugin already lit. Its one row stays in the list (on a phone,
      opening the pane by itself would hide the categories behind a Back).
- [x] Left: plugin names in the glowing stencil style + a small thumbnail + a plain type word
      ("one-knob saturator"); the selected one is lit.
- [x] Right: the big image, name, short description, the price line, "Try free for N days" (main button),
      "Product page" (small link).
- [x] The five glowing words left the left column to the plugin names; they are one small line under the
      description (the user may drop them instead). `DESIGN.md` sections 0, 2, 3, 4, 6-10 rewritten.
- [x] Switching = a channel change: the static burst (over the lit plugin's picture; the bench can switch it to
      the whole screen) + each plugin's own phosphor colour (`data-ww-on` on `.ww`, no `:has`).
- [x] The list is real `<a href>` links in the HTML (crawlable); the script only enhances it (tabs).
- [x] URL state: one history entry per category (`/?cat=free`), the lit plugin updates the current entry
      (`&plugin=gas`), so one Back leaves the category; coming back from a product page restores the lit plugin.
      Not `c` / `p`: TrialGateModal reads its `p` (the gate id) from the hash AND the query string.
- [x] Phones: one pane at a time. Category chips, then full-width rows (thumbnail, name, type word, price);
      a tap opens the preview as its own view with a history entry, Back returns to the list (focus on the row).
      No hover-only states.
- [ ] Longer lists (later): the TV pages with CH+ / CH- instead of an inner scrollbar (no scroll trap inside the
      scroll-locked TV); a search from ~10 plugins.
- [x] Keyboard + screen reader: real buttons and links, arrow keys move the selection, `aria-selected`, visible
      focus, a polite live region for the category; reduced motion = no static; high contrast = a plain list.
- [x] The dev bench `/__wwbench` drives the new TV (categories, plugins, the phone's pane, STATIC picture/whole,
      list sliders); same storage key, so a frame pick saved before survives. Tuning by eye = the user's.
- [x] Removed with the words: DRIFT's neon / steer looks, the TV window, `src/lib/wordwallDrift.ts` (its video
      sync is in WordWall now); `<PluginShowcase />` off `index.astro` (the file goes in Phase 3).
- [x] Checks 2026-10-18 (`npm run build` + node Playwright, Chromium AND WebKit, 1280x665@2, 1141x636, 1440x789,
      1728x992@2, 860x1000, 390x664, 360x640, 375x667, 393x852): the TV fits one screen at every size (list view
      and both phone panes), no sideways scroll, no name overflow, category / plugin / Back / keyboard flows right,
      no console errors besides the local preview's Cloudflare RUM beacon. The window sizes off the measured text
      height (`--ww-info-h`, `--ww-osd-h`). On a 360x640 phone GAS's pane is ~150px tall (the text needs the room).
- [x] Follow-up checks 2026-10-18: reduced motion (no static, no power-on, the run paused), no JS (a plain list of
      links, no categories, no pane; the desktop shows DRIFT's pane), `html.hc` (plain list, lit name in oxide) at
      1280 + 390. A late GAS image (held back 2.5s, WebKit + Chromium) now keeps its box (set height + `aspect-ratio`),
      so the text never jumps. The names size by the real row count (`--ww-rows`). WebKit's DPR2 "window 260px low"
      was Playwright's click scrolling the page (an in-page `el.click()` does not move it). Repo suite
      (`npx playwright test`): 57 passed; the 11 failures are all mobile-safari `page.goto` waiting for "load", which
      never fires in WebKit on laptop 1 on the pre-change build either (checked against the baseline dist): a
      laptop/WebKit issue, not this branch.

### Phase 3: header + removals (done 2026-10-18)

- [x] Header: a PLUGINS button (D1) takes the lit "Store" slot. On home it scrolls to the TV (the categories are
      already visible there, D2); on every other page it goes to `/#plugins`. Phones: visible next to the menu button.
      Built: the chip sits outside the link list (a block holding an inline link, Store's li > a shape, so the bar
      keeps 41px / 58px); on phones a 44px chip beside the burger, and tapping it closes the menu. On home ONE
      delegated handler in WordWall takes every `a[href="/#plugins"]` (header, footer, cart drawer, closing CTA):
      no navigation (with `?cat=` the link would reload the page; the native jump would fire popstate), it closes
      the cart drawer, sends a phone's open plugin back to the list, glides (Lenis 0.7s; a jump under reduced
      motion) to `landY()` = the lock's own target, and moves focus to the TV's heading. `stopPropagation`: Lenis's
      window listener ignores preventDefault and would run a second scroll. Arrivals from other pages land by
      `#plugins { scroll-margin-top: calc(--site-nav-h - --nav-h - 0.75rem) }` (undoes global.css's anchor padding;
      -15px on a laptop, 2px on a phone; negative is valid, both engines read it).
      Found on the way (WebKit): a fractional scroll target is floored (a 1px strip of the page showed above the
      TV), so `landY()` rounds UP to a whole pixel, for the lock too; and with frames starved (5 fps in headless
      WebKit) Lenis's copy of the scroll can miss a native jump, so the handler syncs it
      (`scrollTo(scrollY, { immediate: true })`) and passes a number, not the element.
- [x] `PluginShowcase` off the home page; the file is deleted once nothing imports it. Deleted with it:
      `drift/DriftCard.astro` (only the carousel used it) and `PluginCard.astro` (only /store used it). Left alone:
      the dead `.plugin-card` / `.plugin-grid` rules in global.css, the assets (not imported = not shipped),
      `public/drift/arcade-run.*` (~800 KB, now unused, still copied into dist), lineage comments in /drift files.
- [x] `/store` redirects to `/#plugins` (D3). Old links must keep working, including the licence worker's `https://revaudio.net/store`
      link (RevLimiter repo, `gumroad-worker/src/worker.js`). GitHub Pages cannot send a real 301: the redirect is
      either a meta-refresh page in the repo (with a canonical link) or a Cloudflare Redirect Rule (dashboard only).
      Never promise a "301" without the Cloudflare rule.
      Built: a bare page (no BaseLayout = no page_view, popup or consent banner for the hop):
      `location.replace('/' + location.search + '#plugins')` first (keeps utm / gclid; no Back trap), a meta
      refresh in `<noscript>`, canonical = the home page, robots noindex, a visible link; `/store/` in NOINDEX (out
      of the sitemap). A real 301 = a Cloudflare Redirect Rule, the user's call (dashboard).
- [x] Internal links re-pointed: Footer "Store" -> "Plugins", Cart "Explore the plugins", home closing CTA "Browse the store"
      -> "Browse the plugins", product page breadcrumb "Back to store" -> "All plugins", the `gas.astro` fallback.
- [x] The store FAQ (what you get, trial, Mac/Windows, refund, payment) moves to a page that stays: `/support`,
      "Before you buy" (after "What you need", in the section rail), verbatim, as the page's own `<details>`
      questions; "Need help?" dropped (it pointed at /support itself).
- [x] Ride-along: `DESIGN.md` section 4 + wiki `website-update.md`. Also stale comments (plugins.ts order note, Cart,
      site.ts / MobileBuyBar / index.astro PluginCard mentions, astro.config's wwbench note), README pages list,
      `tests/smoke.spec.ts` (no /store page test; the TV rows each return 200; /store keeps the query string; the
      Paddle add-to-cart check now walks the product pages).
- [x] Checks 2026-10-18 (`npm run build` + node Playwright, Chromium AND WebKit): the bar is 41px / 58px as before
      at 1280 / 390 / 360 / 320 (one row, no sideways scroll, one PLUGINS link). The TV's top lands 0.2-0.3px under
      the nav at 1280 + 390 for: the chip from the top, the chip with `?cat=` set (no reload, no popstate), the
      closing CTA and the footer from the bottom, the cart drawer's link (drawer closes), a phone's open plugin
      (back to the list), the breadcrumb from /revlimiter, the chip on /about, `/store?utm_source=t&gclid=g`
      (query kept, history.length 2); reduced motion too; no console errors. The lock still parks the TV from above
      and below (1280: -0.2, 1440: -0.8). Repo suite: 57 passed, the same 11 mobile-safari "load" failures.

### Phase 4: verify (done 2026-10-18, automated part)

- [x] `npm run build` green; no bench in `dist/` (only `dist/bench`, copied from `public/bench`, as on main; no
      `__wwbench`).
- [x] Playwright Chromium + WebKit at 1280x665 DPR2, 1141, 1440, 1728, 860, 390, 360: no sideways scroll, every
      category, every plugin, Back button, a deep link, keyboard only. Re-run after phase 3 (+ 375x667, 393x852):
      the TV fits one screen at all 9 sizes in both engines, no sideways scroll, no name overflow, both phone panes
      fit. (WebKit at DPR2 reports GAS's window low after a Playwright click: the click scrolls the page, as found in
      phase 2.)
- [x] Scroll lock: small steps both ways from the TV are never pulled back (lesson 2026-10-14). Wheel 60 / 120 away
      from the landed TV, both directions, both engines: kept. Toward it from 140px above / below: parked (-0.2 at
      1280, -0.8 at 1440).
- [x] Every "Try it free" sends the right gate id (network log): RevLimiter `revlimiter`, Radio Roulette
      `radioroulette`, GAS `gas` (the free gate), DRIFT = a link to `/drift#try`. Both engines; the POSTs were
      caught and answered locally (nothing reached the worker, no email went out).
- [ ] Console: only the 4 known Meta CSP errors (baseline taken 2026-10-15 on the live site). Locally: no errors in
      either engine (no CSP there); the live check waits for the push.
- [x] Analytics (consent accepted, the real gtag.js / fbevents.js, every hit caught locally, page served as
      revaudio.net with a normal user agent: the pixel sends nothing to a headless one): the Google Ads tag sends no
      extra hit for the TV's URL state. The Meta pixel sent a PageView for every history change (browsing the TV = 5
      extra), so `CookieBanner.astro` sets `fbq.disablePushState = true` before init: now one PageView per real page
      load. Side effect, wanted: /drift's hash changes and the trial gate's `#dl=` cleanup stop sending PageViews too.
      Left as is: Meta's automatic SubscribedButtonClick on the category buttons (it fires for every button on the
      site; an Events Manager setting).
- [ ] People (not agents): real iPhone + Mac Safari, the look.

### Phase 4b: the user's bench pick (done 2026-10-18)

- [x] Baked the user's `/__wwbench` export (2026-10-18 13:26 UTC) into `WordWall.astro`: list share 40 -> 50 %, name
      max 4.2 -> 4.5rem, thumbnail 6.5 -> 6.9rem (laptop values), screen glow 1 -> 1.37, scanlines 0.3 -> 0.42, snow
      300 -> 100 ms. `WALL_BG` 'screen', `WALL_FRAME` '2', snow 'picture' and the channel colours were already built.
- [x] Found with it: at 1141x636 the list at half the screen squeezed the text beside GAS's tall window to 145 px
      (473 px tall) and the TV outgrew the screen by 61 px. GAS's window now yields width first (`--ww-side-min`
      11rem, container units on the panel); nothing changes at 1280 and up. Re-checked on the build: the 9 sizes fit
      one screen in Chromium AND WebKit, no sideways scroll, no name overflow.

### Phase 4c: the channel change (done 2026-10-18; the user's look owed)

- [x] The user: "the static isn't good now". Filmed the old change (CDP screencast, 1280x665, ~27 ms a frame): both
      plugins' panels cross-faded (two pictures at once), the grey box took the new picture's size so the old picture
      showed round it (GAS's tall window over RevLimiter's wide one), and the snow was gone before the panels finished
      swapping.
- [x] Reworked in `WordWall.astro`: a cut. The panels swap in the click's own frame (no opacity transition on the
      screen wall; the wood keeps its fade) and in that frame the new picture goes to analog snow in its own box and
      corners: full snow for `--ww-chg-snow-ms` (90), then the picture locks in through thinning snow over
      `--ww-chg-lock-ms` (140), settling from a flash (`--ww-chg-flash` .45; light only, a move would show past the
      snow's edge). The snow: 3 noise tiles made once after the power-on (smeared along the line, a gain per line),
      one at a random offset per frame, `--ww-chg-grain` 1.5 px a dot, the channel's colour at `--ww-chg-tint` .35, a
      rolling band (`--ww-chg-band` .5). The frame clock is `performance.now()`, so late frames never stretch it.
      `--ww-snow-ms` is gone.
- [x] Bench: a "Channel change: the static" group (the 6 `--ww-chg-*` sliders), ▶ CHANNEL (the next plugin), SLOW ×4
      (the two durations x4 in the frames only; COPY SETTINGS keeps the real values) and AUTO. A saved `--ww-snow-ms`
      is pruned on load.
- [x] Checks on the build, Chromium + WebKit, a rAF DOM recorder: exactly one panel visible in every frame; the swap
      in the click's frame with the snow opaque over the new picture, same box and radius (RevLimiter 6px, GAS and
      Radio Roulette their percent radii); rapid clicks land on the last pick; category FREE, Back, high contrast,
      hidden tab, wall off screen, reduced motion (the cut alone) and the phone pane; no page errors. Chromium: over
      in 230 ms by its own clock (267-282 ms as recorded: the recorder runs a frame late). Headless WebKit on laptop 1
      runs rAF at ~5 fps, so it is not timed. 4x CPU throttle: idle frames median 24 ms, the click frame worst 58 ms.
- [x] Filmed again on the build, 4 changes (DRIFT -> RevLimiter -> GAS -> Radio Roulette -> DRIFT): one plugin per
      frame, the snow exactly on the new picture's box in the channel's colour (Radio Roulette's low saturation
      reads near grey), two frames of full snow, one of the picture through it, then at rest.
- [ ] The user's look in the bench (reload it first: the old saved snow setting is dropped).

### Phase 5: later, each on its own branch

- [ ] Ratings (D4, decided: verified only, after the TV): ask verified users only (after a Paddle purchase, at the end of a trial, weeks after a GAS
      download), tag each rating bought / trial / free; show stars from ~5 ratings with the count; publish low
      ones too; a real quote until then; team insights page; Cloudflare Worker + D1; the worker goes into the edge
      CSP `connect-src` (dashboard only); `AggregateRating` markup on product pages only.
- [ ] "You may also like": 1-2 hand-picked per product with a one-line reason (job or place in the chain).
- [ ] Search, from ~10 plugins.
- [ ] Trial gate (idea, weak evidence): show the download at once and email it too, instead of "check your inbox".

## Research (2026-10-15, workflow `wf_9c38e794-abe`, 3 researchers + 1 synthesis, web fetches only)

- Nav label: none of 12 peer catalog labels says "Library". Seen: Plug-ins (FabFilter, Softube), Products
  (Soundtoys, Baby Audio, Plugin Boutique), Plugins (Denise), Shop (Kilohearts), Single Plugins (Plugin Alliance).
  Where buyers meet "Library" it means what they already own: Plugin Boutique's header has "Library" (a log-in for
  owned downloads) beside "Products"; Native Access "Library", Splice "Your Library", Kontakt libraries (search
  results). NN/g menu checklist: no made-up or abstract labels.
- Small catalogs often have no categories (Soundtoys, Kilohearts, Denise, whose home page IS the catalog);
  FabFilter uses 3 groups for 14 plugins; one plugin may sit in several categories (iZotope).
- Free: its own nav item or category (Plugin Alliance "FREE", Baby Audio "Freebies"); "Free download" sits where
  the price goes (iZotope).
- Tiles: image + name + a plain type word + one action; most show the price; the trial button names its length
  (Kilohearts "Start a 10-day trial" + "Buy $199"; Plugin Alliance "Get a 14-day trial").
- No quick view / list + preview was seen at any plugin store (text fetches can miss script UI); the model is the
  list-detail layout (side by side on big screens, one pane at a time on phones, Back returns to the list).
- Stars only at catalog-scale stores (iZotope, Plugin Boutique, Waves), always with a count; boutique brands show
  quotes, press verdicts and awards instead. Spiegel: 5 reviews = +270% purchase likelihood vs none; likelihood
  peaks at 4.0-4.7 stars. Google: self-serving review rule names LocalBusiness / Organization only, so Product
  ratings on our own pages look eligible (inference).
- Carousels: people scroll past them (NN/g), which backs dropping it. Inline scroll areas trap touch users (Baymard,
  search summary).
- Full output: the workflow journal (session transcript dir); unverified items are listed there.
