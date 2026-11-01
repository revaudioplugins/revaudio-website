# Home LIBRARY: the TV becomes the plugin browser (branch `feat/home-library`)

- Owner: Claude Code `revaudio-a0` (was `revaudio-a6` before a restart; laptop 1). Status: **IN PROGRESS (user's "go"
  2026-10-18).** Phases 1-4c done (local commits, not pushed). Phase 4d (the noise out, motion only): steps 1-3 + 3b done
  (2026-10-19: the user's answers made it one motion, smaller, shorter and always the same way; GEAR CHANGE gone;
  3b: the scanlines moved under the text and the pictures). Phase 4e done (2026-10-19: the TV glitches now and then,
  by itself and on about one channel change in three). Waiting on the user's look (the phone via the LAN preview,
  the bench: RISE vs DROP, the glitches, the values), then the build checks (step 4), the real devices and "push".
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
- [x] Filmed again on the build, 4 changes (DRIFT -> RevLimiter -> GAS -> Radio Roulette -> DRIFT): one panel per
      frame, the snow exactly on the new picture's box in the channel's colour (Radio Roulette's low saturation
      reads near grey), two frames of full snow, one of the picture through it, then at rest. The list's lit name
      dims a frame after the cut: `.ww-name`'s own 120 ms house snap, left as designed (the row could cut too, if
      wanted).
- [x] The snow stays on the picture for the WHOLE change, not just the click's frame (`boxcheck`: the snow's box vs
      the picture's in every recorded frame with snow up): laptop 1280x665, each plugin in turn, and phone 390x844 +
      390x664, each plugin's pane from the list with Back between. Chromium (10-16 snow frames a change) and WebKit
      (2-3): worst 0.0 px everywhere, no page errors. The phone pane opens by display (no slide), so nothing moves
      under the snow.
- [x] ~~The user's look in the bench~~: superseded by Phase 4d (the user, 2026-10-18: no noise at all).

### Phase 4d: entrances and exits, motion only (planned 2026-10-18; steps 1-3 + 3b done 2026-10-19, the user's look owed)

- The user (2026-10-18, Hebrew): drop the noise entirely, make it pure motion; plan how the plugins enter and leave
  the screen; creative and elegant, not messy; each plugin's entrance stylized, with interesting motion; no glitches,
  no noise; smooth entrances and exits; consult two agents, a UX lens and a brand / identity lens.
- Consulted (2 Plan agents, Opus): the UX lens picked TUNE, the brand lens GEAR CHANGE. Both chose a shared skeleton
  with a per-plugin accent: not 20 choreographies (a mess, plus assets per plugin) and not one anonymous move. Both
  rejected BLINK (a CRT off / on per change: the glitch family being removed; its bright line ten times is a strobe;
  it spends the once-only power-on) and ROLL (a vertical-hold roll: a third of the screen moving ~440 px, half of
  each plugin mid-roll). IGNITION (one part of the object wakes on arrival: RevLimiter's needle sweeps, Radio
  Roulette's pointer scans, GAS's knob turns up) needs a plate-minus-part and a pivoted part layer for every plugin,
  forever: parked as a possible later accent on top of the pick.

**The two candidates.** They differ only in where the entrance comes from, so one engine runs both (a per-plugin
entrance path table). The two axes are never blended: "it rises because you went down, but slides in from the left
because it is Radio Roulette" is the mess the user ruled out.

| | TUNE (UX lens) | GEAR CHANGE (brand lens) |
|---|---|---|
| Idea | one move for every plugin; its direction comes from the list | each plugin arrives along its own object's axis |
| Entrance | down the list the new picture rises from 16 px below, up the list it drops from 16 px above (clicks by index delta in `shown()`; arrows by the key, so a wrap stays forward; category, popstate and restore from below; never scaled by distance) | RevLimiter on a shallow arc (the needle), DRIFT from 28 px right on a drift line, GAS straight up from 28 px and planted, Radio Roulette from 28 px left (a dial scanning the band); a new plugin picks rise / arc / left / right as `enter` in WordWall's `WINDOWS` table (default rise; built there, not in `src/data/plugins.ts`, because it belongs to the plugin's TV window, next to its crop and ratio) |
| Exit | the old panel drifts 8 px the same way and fades, 150 ms `--ease-exit` | the old panel sinks 10 px and dims, 220 ms `--ease-exit`, never sideways; then 40 ms of empty glass |
| Settle | 600 ms `--ease-settle`, opacity in 180 ms | opaque in 150 ms at its start pose, then a solid body travels 600 ms on the crane's curve (`sine.inOut` + a 2 px seat dip over the last 15 %, as `BuyButtonCrane.astro`'s `SEAT_START` .85) |
| Readable | ~0.4 s after the click (the picture ~90 % home by +240 ms), at rest ~0.75 s | visible ~0.4 s, seated ~1.0 s (220 + 40 + 150 + 600) |
| Risk | subtle, so pressure to enlarge it; past ~24 px it needs a clip | past ~28 px it reads as four separate animations |

- My lean: GEAR CHANGE (the user asked for each plugin's own entrance); TUNE if GEAR reads slow or busy. Both are
  cheap on one engine, so the bench decides.
- GEAR's rotations (RevLimiter -1.5 deg about a low pivot, DRIFT's rear stepping out -1.2 deg) are OFF by default,
  behind a bench toggle: rotating a photograph turns its baked light (design-language Law 3, "light never rotates")
  and resamples the screenshots' fine print. The arc and the drift line are translate paths (x and y on different
  eases) instead.

**Shared core (both lenses agree; settled)**

- Strictly sequential: the old panel is fully out before the new one starts; never two plugins on screen (4c found
  the old cross-fade showing two pictures at once).
- At the click: the row lights and `aria-selected` and focus move at once; the leaving panel goes `inert`,
  pointer-events none, under the new one. `data-ww-on` and `writeUrl('replace')` flip at the commit (Safari throttles
  `replaceState`; held arrows today write the URL on every repeat).
- Panel visibility gets its own state: a leaving panel stays visible after it loses `.is-active` (an `.is-leaving`
  class), so the `.is-active` opacity / visibility rules change with it.
- What moves: the img / video and the text blocks. Never `.ww-ui` (the first panel's reveal tween), `.ww-try` (its
  hover transform) or a wrapper round the panels (the `> .ww-panel` selectors would break; clip in flight only, or
  not at all). Transform and opacity only, no layout shift; `will-change` only in flight; at rest every moved
  element computes to `transform: none`, so the screenshots land crisp.
- Text: the blocks rise 8-10 px in reading order (name, blurb, words, the buy row), ~45-60 ms apart, ~400-480 ms
  `--ease-settle`, from +90 ms after the picture starts. The exit and the stagger are shorter than the house 300 /
  90 ms (a 300 ms ease-in barely moves for ~100 ms; 90 ms x 4 seats the Try key past 1 s): new local `--ww-mv-*`
  vars, never the global `--dur-out` / `STAGGER` (CartFab, MobileBuyBar and others use them).
- Interrupts: the last pick wins, from the live pose. A pick mid-exit swaps the target (re-picking the leaver brings
  it back home); mid-entrance the arriving panel exits. Picks under ~150 ms apart (held arrows) keep the glass dark,
  and only the last one enters.
- The screen's colour: one glow layer. The dead `transition: background 320ms` on `.ww-screen-glow` (a gradient
  does not interpolate) becomes a shallow opacity dip during the exit; the hue swaps while it is dim and the glow
  comes back up with the entrance; no dip while skimming (ten whole-screen dips would be the flicker being removed).
  The hue is never interpolated (280 -> 26 runs through green).
- Pictures: after the power-on, every panel picture goes eager + `decode()` (neighbours first), in place of the
  noise tiles' 1.2 s timeout; an entrance waits for its picture's `decode()`, capped at ~100-200 ms. DRIFT pauses on
  its exit, rewinds to 0 once out and plays on the seat (`syncRun()` gates on seated, not lit).
- Engine: GSAP, already in every page's bundle through `src/lib/motion.ts` (WordWall imports `lenis` from it); a
  tween starts from the current value, so interrupts retarget for free. Durations and px are read from the CSS vars
  at each change, so the bench sliders work; SLOW x4 scales every motion duration.
- Reduced motion: opacity only, out 80 ms, in 120 ms (DRIFT stays on its poster). High contrast: a cut. The wood
  keeps its fade.
- Phone (one pane at a time), sequential: open = the list sinks and dims ~200 ms, then the pane enters 16 px from
  the right (its Back key fades in place). Our Back key animates the reverse (a flag the key sets); any other
  popstate cuts (an iOS swipe-back already animates; `hasUAVisualTransition` is not relied on).
- Category change: the list's `is-swapping` stagger and the panel move fire together; checked in the bench.

**Steps**

- [x] 1. Remove the noise, whole: the snow markup (`.ww-snow` + its canvas, `data-ww-snow`), the script
      (makeTiles / placeSnow / endSnow / staticBurst, their calls, the 1.2 s makeTiles timeout, the static-burst
      comments in the glide code), the CSS (the snow block, `--ww-chg-*`, `.is-tuning`, `@keyframes ww-lock-flash`,
      their reduced-motion and hc rules), the bench's STATIC switch, its 6 sliders and `srcSnow` / `snowv`, and
      DESIGN.md §4's "Channel change" bullet and §6's static line. A grep finds none of them left.
- [x] 2. Both candidates on one engine, behind a bench switch MOTION: TUNE / GEAR (only the entrance path table
      changes). Sliders: travel px, exit ms, empty beat ms, enter ms, text rise px, text stagger ms, glow dip, seat
      dip px; GEAR's rotation toggle (off). ▶ CHANNEL, SLOW x4 and AUTO stay. The bench opens on GEAR.
      - Built (2026-10-18): `WALL_MOTION` ('gear') -> `data-ww-motion`; the bench's MOTION seg flips it live. A
        sequencer (rest / out / gap / in) on GSAP: the old scene leaves, the commit waits for the skim gate (120 ms
        since the last pick, no held arrow) and the picture's `decode()` (capped 150 ms), then the entrance's start
        poses are set and the DOM flips in the same task (`tl.from`, so every part ends on its own CSS: the blurb
        rests at .92). A pick mid-entrance sends the arrival out quick (<= 160 ms) from its live pose; re-picking the
        leaver brings it back. The URL is written once, at the flip.
      - The glow: two layers (`.ww-screen-glow` + `.ww-screen-was`), an exact linear cross-fade of the two gradients
        with the dip folded in (the hue itself never interpolates).
      - Glow continuity (found by the advisor review, 2026-10-18): a pick while the newcomer's colour was still
        coming in cut that cross-fade short, so the screen's colour jumped in one frame (B picked, C ~250-350 ms
        later). Now the plugin sent back takes its colour to the nearer of the two as it goes (`glowMix` < .5 ->
        the old colour stays on the was layer, `held`; a phone's Back keeps the new one, which stays lit), and the
        next change starts from that one colour. Scratchpad `glowcheck.mjs` (each gradient's share of the light per
        rAF frame; a jump = one frame far quicker than both neighbours): the old code jumps 0.27-0.70 of the light
        in a frame in 5 of 17 cases (the control: the metric sees it); now 17 / 17 PASS, worst spike 0.014, worst
        step 0.17, and an early interrupt moves the colour about as far as one plain change (travel 1.00-1.17).
        The recorder's own bug found on the way: a start within a frame of a stop left two rAF loops running
        (every frame logged twice); one loop per generation now, in `motioncheck.mjs` too.
      - The bench read the lit plugin back from `data-ww-on`, which now flips only when a change lands, so every
        second ▶ CHANNEL (and AUTO tick) re-picked the plugin already coming on. It reads the page's lit row now.
        Scratchpad `benchsmoke.mjs`: opens on GEAR, TUNE / GEAR reach both frames, ▶ CHANNEL twice mid-change = two
        steps, SLOW x4 scales the times and back, no page errors.
      - `room()`: the travel shrinks to what fits inside the glass (and right of the list on a laptop), so a plugin
        never slides under the bezel. GAS at 1280x665 rises 16 px (the glass has 16 px under it), 28 px at 1141x636.
      - Phone: the list leaves left (half the pane's travel), the pane comes in from the right, its parts cascaded;
        our Back key plays it backwards; the browser's Back cuts (an iOS swipe-back already animates).
      - Checks (scratchpad `motioncheck.mjs`, the dev server; the build's run is step 4): Chromium all pass (one panel
        per frame, each plugin's path and TUNE's direction on the first frame, the old one gone before the new one,
        the picture on the glass and clear of the list, no layout shift, rest = transform none + nothing inline,
        rapid picks, a held arrow, the leaver re-picked, a category change, DRIFT paused until seated, 1141x636,
        reduced motion, hc, a hidden tab, phones 390x844 + 360x740: open / Back key / the browser's Back): 204 / 204
        PASS. WebKit 203 / 203 PASS (headless WebKit paints at ~5 fps here, so its run stretches every motion time
        x4, as the bench's SLOW x4, to still catch the start poses: TUNE's first frame then reads ~11 of its 16 px;
        the reduced-motion timing check is Chromium's only). Both on the code with the glow fix below. `astro
        build` green.
      - Measured (Chromium, 1280x665): GEAR on the glass ~270 ms after the click, readable ~900 ms, at rest
        ~1015 ms; TUNE ~160 / ~360 / ~870 ms; reduced motion over in ~250 ms.
- [x] 3. The user's pick (2026-10-19, four questions in Hebrew, answers): the motion looked at = TUNE, on the laptop
      at real speed; odd = "appears, then slides" + "a different direction for each plugin"; "smaller" = shorter
      (~0.5 s, not ~1 s). Both odd things are what GEAR CHANGE is made of, so GEAR went and TUNE was cut down (plan
      approved the same day):
      - One way, always: `--ww-mv-dir` 1 = everything rises into place (default), -1 = comes down into place (the
        bench's RISE / DROP, for the user's eye). The list order, the keys and a category no longer pick it.
      - The picture fades and travels as ONE tween (`--ww-mv-in-ms` 340, power3.out, from `--ww-mv-px` 12): TUNE's
        fade (180 ms) ended long before its travel (600 ms quint), so a solid picture kept sliding.
      - Shorter: exit 120 ms / 4 px; text 6 px in 340 ms, 20 ms apart, from +40 ms, the same way and curve; the
        colour's cross-fade = the picture's 340 ms; the glow dip .92 (.85 read as a flicker with the quicker exit).
      - Removed: `WALL_MOTION` / `data-ww-motion`, `WINDOWS[].enter` / `data-ww-enter`, the ENTER table, the seat,
        tilt and empty beat, `type Dir` / `dir` (and `light()`'s direction argument), `gapEnd`, every `--ww-tune-*`
        / `--ww-gear-*`: one family, `--ww-mv-*`. The bench: MOTION -> RISE / DROP, one Motion group; motion values
        saved before the retune are dropped once (`st.mv` 2), the rest kept.
      - `enter()` also runs `glowTo` when `held` is set (`|| held`): a held colour is always consumed by the next
        entrance (reachable from the bench: a phone frame's pane-to-pane ▶ CHANNEL, then the leaver picked back with
        THE PLUGIN -> LIST); otherwise calm() at rest would swap the colour in a frame.
      - Checks (dev server; scratchpad): `motioncheck.mjs` rewritten for one way. Every change (down the list, up
        one, up to the top, ArrowDown / ArrowUp and both wraps, a category, back to DRIFT, 1141x636 with GAS) comes
        from the one side, its first frame past 0.4 of the travel the glass allows; the text the same way; never
        solid while it travels (at >= 90 % opacity within 0.15 x 12 + 0.5 px); click to rest < 650 ms (Chromium);
        plus everything kept from step 2. Chromium RISE 233 / 233 PASS and DROP 233 / 233 PASS (rest at +553-579
        ms, on the glass ~+135, readable ~+300; TUNE was ~160 / ~360 / ~870). WebKit (times x4 on the laptop): 210
        PASS on the laptop sections, first frame y 5.7-7.3 of 12 (> 0.4 x travel); its phone section failed 8 x
        "the pane comes in from the right" (first frame x 1.9-3.7, needs > 4):
        headless WebKit paints a newly shown pane's first frame ~0.6 s into the entrance and 340 x 4 ms ends close to
        that, so the phone section is stretched x8 (stretched, not loosened): 68 / 68 PASS (first frame x 6.6-8.8;
        Chromium 12.6-13.2). `glowcheck.mjs` 24 / 24 PASS (cuts at 60 / 150 / 230 / 330 / 430 / 560 ms, picked again
        at 200 / 350, phone Back at 150 / 250 / 400; worst spike 0.020 against the 0.1 limit).
        `benchsmoke.mjs` 11 / 11 PASS (RISE / DROP reach both frames, an old saved state migrates, COPY SETTINGS
        hands back `dir`, SLOW x4 340 -> 1360 and back; again 11 / 11 after the controls).
        Controls (Chromium, the old component swapped in with TUNE forced, then restored from `63841e4`): `4c19a59`
        fails 34 checks, all of them the new ones: 6 x the one way (every pick up the list, ArrowUp and its wrap; first
        frame y -12.7 / -13.0, from above), 14 x never solid while it travels (e.g. opacity 0.91 at 5.0 px), 14 x
        short (rest at +866-900 ms); its other 199 pass. `glowcheck.mjs` on `7e3fe2f` (before the colour fix) fails
        the 230 ms cut (spike 0.357; today 0.016 there).
- [x] 3b. The text under the scanlines (2026-10-19). The user, after a look on the phone: the reading is not easy
      "because of the pixels"; better reading on both platforms. Cause: `.ww-screen-fx` (z 2) laid the scanlines (a 1 px
      line at .42 every 3 px) and the RGB grille OVER the content, so every letter and the Try key were striped; at a
      phone's 3x each line is 3 device px. Two questions in Hebrew with a comparison sheet (today / A: lines on the
      glass only / B: the pictures keep theirs): the user picked A, and no type size change before a look without the
      lines. Done (CSS only): the lines + grille moved to `.ww-screen::after` (on the glass, over its glow, under
      everything on it; a pseudo-element, so the script's reads of `.ww-screen`'s children are untouched; frame /
      rails / hc / wood follow `.ww-screen`); `.ww-screen-fx` keeps the reflection, room light, curvature and seat.
      `--ww-scr-scan` stays .42, now on the glass only; the bench's Scanlines hint says so. (B would have needed a layer
      that moves with the picture: the motion tweens the img/video, not `.ww-ui`.)
      Checks (scratchpad `readcheck.mjs`, Chromium, at rest, shot with `--ww-scr-scan` .42 and 0; 1280x665 + 1920x1080
      @1x, 390x844 @3x on RevLimiter): no letter darkened by a line (the paragraph, the plugin name, the lit list name:
      the darkest letter px at >= 0.94 of its line-free self; a line over it gives ~0.58), the Try key's face and the
      picture identical (max diff 0), the empty glass keeps its lines (rows 0.58-1.00, ~35 % dark), no page errors:
      ALL PASS (20). Control: the component of `efe6643` fails 14 (every letter at 0.57-0.58, key 107, picture
      102-107), its glass passes. Regression: `motioncheck.mjs` Chromium 233 / 233, WebKit 218 / 218; `glowcheck.mjs`
      24 / 24; `benchsmoke.mjs` 11 / 11; `npm run build` green (the LAN preview serves the new CSS).
- [ ] 4. Checks on the build, Chromium + WebKit, the rAF recorder (its snow assertions replaced): at most one panel
      visible per frame; rest transform = identity; rapid picks land on the last; held arrows = one entrance and
      one URL write; no layout shift; the moving picture never leaves the glass or crosses the list (1280x665,
      1141x636 with GAS, phone 360x740 + 390x844); reduced motion and high contrast as above; the phone's Back key vs
      the browser's Back; a category change; a hidden tab; DRIFT plays only seated; no page errors. Filmed (CDP
      contact sheet) for the baked motion. Plus `glowcheck.mjs` (the colour never jumps) and step 3's one-way /
      fade-with-travel / short checks.
- [ ] 4b. Also (advisor review, 2026-10-18): a phone fetches a pane's picture only at the tap (`warm()` is laptops
      only), so on a slow network the pane may slide in with an empty picture box. Measured (scratchpad
      `slowphone.mjs`, Chromium 390x844 @3x, dev server, CDP throttling after the page load): at Lighthouse's mobile
      throttling (150 ms RTT, 1.6 Mbps) the pane is on at ~395 ms and solid at ~645 ms, but its picture lands at
      +864 / +963 / +1208 ms (RevLimiter / GAS / Radio Roulette, the 1400w / 960w WebP): an empty box on a solid
      pane for 0.45-0.8 s. At 60 ms / 9 Mbps: none. Proposed fix (needs the user's OK): on a phone the tapped row
      lights at once but the list stays until the picture is in (capped ~1 s), then the list leaves and the pane
      comes on whole; nothing changes when it is cached or the network is quick. And `warm()` fetches every laptop
      window ~1.2 s after the power-on: measure the wall's transfer against the live WEIGHT baseline (184 KB at the
      wall); it grows with every plugin added.
- [x] 5. DESIGN.md §4 / §6 rewritten (the channel change = motion, one way, fade and travel as one; why the exit and
      the stagger are shorter than the house values); this plan and the handoff updated (2026-10-19; a bench bake
      updates the numbers). The rule went into the shared `design-language.md` §3 too (shared `a953ccb`, not pushed).

### Phase 4e: the TV glitches now and then (2026-10-19; the user's look owed)

- [x] The request (the user, 2026-10-19): "I also want certain elements to glitch now and then, at random, a small
      glitch to show it's alive". Picks (all the recommended ones): the plugin names in the list, the plugin's
      picture, the whole screen; every 12-25 s; only when the TV is left alone. Then "also during the channel
      change". The plan said so in plain words and was approved: about one change in three lands with a short tear,
      the slider 0 = never, 1 = every change. It lifts the 2026-10-18 "no glitches" (DESIGN.md §10) for the change in
      that one way; the entrance's motion is unchanged.
- [x] Built (`WordWall.astro` script + CSS, `tools/wwbench`): one glitch at a time, a random `--ww-gl-min-s` 12 to
      `--ww-gl-max-s` 25 s apart, only after `--ww-gl-idle-s` 4 s without a pointer / finger / key / wheel on the TV;
      touching it stops an idle one at once. Kinds: an unlit name jumps `--ww-gl-px` 3 px with a red / cyan fringe
      (WAAPI on `translate` + `filter`, steps); a band or two of the picture tears (a canvas `.ww-gl-tear` appended to
      `.ww`, z 1 under the glass light, laid over the picture from its rect, copying its pixels with object-fit
      mapping; emptied, unsized and hidden after; a video with no frame yet jolts whole instead); the screen flickers
      (a 6 % dip on `.ww-screen-fx`) or rolls a band of light down the glass (a third, parked layer on
      `.ww-screen::after`, `--ww-gl-roll-ms` 900, `--ww-gl-roll-light` .1: .06 did not show in a pixel check).
      What is on show decides the kind. Gates: reduced motion, high contrast, the wood wall, a hidden tab, the TV off
      screen, before the power-on, and only at rest (`stage === 'rest'`). The change's tear fires from the entrance's
      end (`landed()` = `rest()` + the chance), `leave()` and `cut()` stop any glitch. The times are read when they
      come due (≤ 2 s), so the bench's sliders and a test's style take at once. Bench: a Glitch group (8 sliders;
      SLOW x4 covers the two `-ms`) and ▶ NAME / PICTURE / SCREEN (`ww:glitch`; SCREEN: a flicker, then a roll).
- [x] Checks (scratchpad `glitchcheck.mjs`: a MutationObserver recorder on `data-ww-gl`, since headless WebKit paints
      ~5 fps; the times sped up with test styles). Chromium + WebKit, 60 / 60 each: it fires by itself, every kind
      (Chromium 26 in 14 s: name 8, tear 11, roll 4, flicker 3; WebKit 36 in 19.6 s), one at a time, each ending
      before the next and leaving nothing behind (26/26, 36/36 clean); no glitch crosses what is read (menu, lit
      name, blurb, price, keys, links) and only unlit names jump; a tear's canvas lies exactly over the picture
      (GAS's still, DRIFT's video; headless WebKit has no video frame, so DRIFT jolts there); no layout shift, no
      page errors. Left alone: none while the pointer moves on the TV, the first 1001 ms after it stops (idle 1 s in
      the test); a touch stops a 4 s one at once (17-39 ms after it in Chromium, 3 ms in WebKit, 11 ms into its
      4000). The name under the pointer and the focused one never glitch, the others still do; the picture under the
      pointer never tears. A change at chance 1: one tear on the new picture, only once it is in place (+567 ms
      Chromium, +1222 ms WebKit; nothing leaving, inline transform / opacity cleared), laid exactly over it; the next
      pick stops it at once and lands with its own; chance 0: three changes, none. Off: reduced motion, high
      contrast, the wood wall, a hidden tab, the TV off screen (none, then they come back), none before the
      power-on. Phone: the list = names + the screen, a pane = its picture + the screen. The shipped times
      (Chromium, one run): the first 23.27 s after the script ran (12-25), none while the pointer kept touching the
      TV for 26 s, the next 4008 ms after it stopped. WebKit first failed "a touch stops it" by a race in the test
      (lessons.md, 2026-10-19 #5); fixed in the test, then both engines pass.
      Controls: the component of `706efa0` fails "fires" (0 in 14 s) and 3 more; a mutant whose touch does not stop
      an idle glitch fails "a touch stops it".
      Regression (the glitches off unless said): `motioncheck.mjs` Chromium 233 / 233 (twice), with the change tear
      at chance 1 232 / 233 (its one fail: a first frame after a 74 ms gap); `glowcheck.mjs` 24 / 24;
      `readcheck.mjs` 20 / 20; `benchsmoke.mjs` 15 / 15 (SLOW x4 slows the glitches, the 8 sliders show the
      defaults, ▶ NAME / PICTURE / SCREEN on both TVs, COPY SETTINGS carries the `--ww-gl-*`). WebKit's
      `motioncheck.mjs` failed only its first-frame checks ("from below, the one way" wants the first frame past
      40 % of the travel; "the pane comes in from the right"): 11 and 19 of 218, 18 at chance 1, and the component
      of `706efa0` run between them fails the same 12. Ableton Live and a media player were busy on the laptop:
      headless WebKit's frame gap went from ~180 ms (this morning's 218 / 218) to 229-386 ms for the old and the
      new code alike, Chromium's from ~26 to ~55 ms (still passing). Every other WebKit check passes. Re-run on an
      idle machine with step 4. `npm run build` green; the LAN preview serves the new CSS + script.
- [x] Fix after the advisor review (2026-10-19, the commit after `1ce4007`): two gaps at the TV's first light, both
      measured on `1ce4007` (new `glitchcheck.mjs` cases, Chromium): a late arrival (the wait fixed at 3 s, parked at
      the top 8 s) got its first glitch 1510 ms after the tube lit, because the clock rerolled only when a wait came
      due while the TV was away, so the first came any time 0-25 s after arriving (the PLUGINS chip's glide too); and
      a pick while the tube was still lighting tore 320 ms before it was lit (`landed()` had no power gate). Now one
      test, `glShown()` (no reduced motion, not `still()`, the tube `on`), gates the clock, a change's landing and
      the bench, and the wait starts over at the first look that finds the TV on show (2 s at most). After: the late
      arrival's first 4510 ms after the tube lit in Chromium, 4437 in WebKit (3000-5000); the pick while it lights:
      no tear before it is lit (Chromium: it landed before, none; WebKit: a tear 104 ms after); a cold
      `/?plugin=gas` at chance 1 never tears at the first light; every glitch in every run starts with the tube lit.
      The shipped times (Chromium): the first 23.32 s after the tube lit (12-25 + the look), and a late arrival by
      the PLUGINS chip after 30 s at the top 25.83 s after (12-27); "none while touched" and "4008 ms after the
      pointer stopped" as before. Re-run: `glitchcheck.mjs` Chromium 67 / 67 + the shipped times 5 / 5, WebKit
      68 / 68; `benchsmoke.mjs` 15 / 15; `motioncheck.mjs` at chance 1 Chromium 233 / 233. `npm run build` green,
      the LAN preview serves the new script.

### Phase 5: the TV sells (planned 2026-11-01, Claude Code `revaudio-b5`, laptop 1; waiting for go)

The user, 2026-11-01, after a look at the branch as it is: "as it is, it's great". Then: the reading should glitch
too and sit in the screen's vibe; "Try" takes the email ON the screen, no pop-up, with a terms check and a
newsletter check, so the visitor downloads from the TV without any other window; the way deeper to the product
page is not visible ("I didn't see anywhere in the LCD that there is like referring to the page"). "This is the
main thing that the user is going to use in our website." ("LCD" = the user's word for the TV's screen.)

Facts behind the plan (checked 2026-11-01):
- Today the Try key opens `TrialGateModal` (a `<dialog>` from BaseLayout): email, an optional unchecked marketing
  box (the worker stores its exact wording, `MARKETING_CONSENT_TEXT` in the licence worker: "Also send me
  new-plugin drops and demo codes (optional)"), the service-email notice, "Send my link". POST
  `/download/register` {email, plugin: dlGateId, marketing, + raSaleSource}. No terms box today.
- The download is email-verified: the worker mails a verify link; `handleDownloadVerify` (RevLimiter repo,
  `tools/RevLicenseKeygen/gumroad-worker/src/worker.js`) sends the visitor to `DL_PLUGINS[plugin].sitePath` (the
  product page, e.g. `/revlimiter`) `#dl=<gate>&p=<id>`, where the modal opens on Mac / Windows buttons. It already
  has a second return target: `from: "downloads"` -> `r=dl` -> `/downloads`.
- DRIFT's Try is a plain link to `/drift#try` (leaves the TV); `/drift`'s forms post `/download/register` +
  `/form-once`.
- The branch is 96 commits behind origin/main, 19 files changed on both sides (DESIGN.md, astro.config, Cart,
  CookieBanner, Footer, Header, MobileBuyBar, PluginCard, PluginShowcase, WordWall, plugins.ts, site.ts, `[slug]`,
  gas, index, store/index, support, handoff, lessons).
- Phone (390x844, Edge mobile emulation, cold load, tap RevLimiter): ~130 px of empty glass above "‹ All plugins"
  (`[data-ww-back]` top 216 vs the TV's top 88).

Steps (each one checked before the next):
- [ ] 0. Sync first: merge origin/main into the branch by hand (one merge; keep PluginCard + PluginShowcase
      deleted), the `.rv-btn` question (D9) answered, the old checks + `npm run build` green again. No source edit
      before this. The closed session `revaudio-a0`'s close notes in handoff.md / lessons.md are uncommitted: ask the
      user once before committing them.
- [ ] 1. The reading in the screen's type (D8). Everything in the lit plugin's text column takes the screen's
      phosphor: today the blurb is clean web Inter in near-white and reads as a page laid over the TV. Three
      options on the bench, all in the channel's colour with the names' glow: A = Inter, phosphor-tinted (smallest
      change); B = the house mono (`--font-mono`), an on-screen-display look; C = a screen face (VT323, the arcade
      preset's readout face). Checked at 3x on a phone before baking (Law 5: the scanlines stay under the text).
- [ ] 2. The reading glitches too (overrides "never on what is read": design-language §3 and DESIGN.md §4 updated
      with the user's word, same session). The lit name, the blurb, the five words and the price join the glitch
      picker: the same 3 px jump + red / cyan fringe, ~150 ms, on the same 12-25 s clock once left alone. Never: on
      the open form, a field, a key, what has focus or the pointer, while typing; off under reduced motion / high
      contrast (as today).
- [ ] 3. Try on the screen, no pop-up. The Try key turns the lit plugin's text column (phone: its pane) into the
      set's own sign-up screen, in the screen's type:
      - TRY <NAME> FREE · 30 DAYS (GAS: FREE DOWNLOAD), the email field;
      - [ ] I agree to the Terms of Use and the EULA (new, required; links open in a new tab) (D6);
      - [ ] Also send me new-plugin drops and demo codes (optional) (unchecked, the worker's exact words);
      - the service-email notice line; SEND MY LINK; ‹ Back (and Esc) returns to the plugin.
      - On the screen after: sending -> CHECK YOUR INBOX (the address, "wrong email?" goes back to the field).
      - Same endpoint, honeypot, raSaleSource and `tg:registered` event as the modal. The register + download calls
        move out of TrialGateModal into one small module both use (the modal stays for the product pages).
      - DRIFT: the same on-screen form (plugin `drift`, + `/form-once` as /drift does) instead of the link out;
        check drift.ts' phase and `gateWired` after the merge.
      - Phone keyboard: the TV is one screen tall with a scroll lock; while the field has focus the lock stands down
        and the form slides up over the keys (the pattern on `feat/gas2-postcards`, 2026-10-30).
- [ ] 4. The download on the screen (D5). A = no worker change: the TV takes the sign-up, the email link still lands
      on the product page with its Mac / Windows buttons. B = a small worker change (RevLimiter repo, live worker,
      `wrangler deploy` on the user's word): the form sends `from: "tv"`, the verify link returns to
      `/?plugin=<slug>#dl=...&p=...` (like `r=dl`), and the TV opens on that plugin with Mac / Windows keys on its
      screen. C = instant: the keys show on the screen right after the email, the email still sends a copy; needs a
      worker change that skips the verify, and fake emails then get the download and miss the trial emails (the
      trial clock is in the plugin). Recommended: B.
- [ ] 5. The way deeper. A second key beside Try, same family, outlined not lit (D7: "SEE + HEAR IT ->" or
      "FULL DETAILS ->"); the picture and the name link to the product page too (a modified click still opens a tab).
      Phone: the key full width under Try.
- [ ] 6. Phone: no empty glass above "‹ All plugins" when a plugin's pane opens.
- [ ] 7. Checks: Chromium + WebKit at the 9 sizes; the form by keyboard and screen reader; the form's posts blocked
      in every automated test (never the live worker); `npm run build`; the user's look (bench, phone, iPhone
      keyboard); then "push" (= live).
- [ ] P. Before the go: 5 persona agents (Opus, own headless browsers, live endpoints and trackers blocked) walk
      the branch build and read this phase, each on its own charter; reports in
      `tasks/evidence/persona-qa-2026-11-01/`; their findings fold into this phase.

Decisions for the user:
- D5 the download on the screen: A / B / C (recommended B).
- D6 terms: a required box "I agree to the Terms of Use and the EULA" (as asked) or a line under the key "By
  downloading you agree to ..." (less friction).
- D7 the second key's words.
- D8 the screen type: A / B / C, picked on the bench.
- D9 (open since 2026-10-19) the TV's keys join main's `.rv-btn` family, or stay part of the object.

#### Persona round (2026-11-01, step P done): what it changes

Five Opus persona agents, own headless Edge (WebKit screenshots hung on "waiting for fonts" on this box: every
pixel is Edge), live worker / trackers / Paddle route-blocked. Reports: `tasks/evidence/persona-qa-2026-11-01/`
(p1 Maya, phone from Instagram; p2 Daniel, mastering pro on a Mac; p3 Lena, privacy-minded, Berlin; p4 Ron, 58,
200 % zoom + keyboard + reduced motion; p5 Kai, 19, free-plugin hunter). All five got "this is the store" within
seconds and liked the TV; the losses are around it.

Votes: D5 B x3, A x1 (Daniel: land beside the requirements), "C for GAS, B for trials" x1 (Kai). D6 the line x5
(none wants a required box: a skipped box = a failed send; a thumb on a link inside the label opens a tab). D7
"DETAILS & DEMOS" x2, "HEAR IT + SPECS", "HEAR IT FIRST", "HEAR IT" (people go deeper to hear it and for specs). D8
A x5 (B / C set wider, read toy-like on a $49 tool, and drop contrast; legal lines must stay plain).

Changes to the steps:
- 1: the blurb stays >= 7:1 on every channel measured from pixels with the scanlines (Ron: a full channel tint takes
  DRIFT's blurb from ~12:1 to ~5:1), >= 16 px, no opacity on text; the tint is a hint; the form's text plain.
- 2: four of five push back on the reading glitching (Ron: the 4 s idle gate = reading, he'd lose his line and
  leave; Daniel: a jumping $49 reads as a broken render on a pro tool). Their line: at most the lit name, never the
  blurb, five words, price, "no credit card", keys or form; none within ~20 s of a channel change; nothing at all
  (flicker, roll, picture tear too) while the form is open; add `forced-colors: active` to the gate (today glitches
  fire under it: 8 in 12 s); a "glitches off" switch on the set (WCAG 2.2.2). The user decides the scope.
- 3: the form takes the lit plugin's whole pane, not the text column (1366x768: ~250 px left under the picture,
  GAS's column 192 px wide; today's form alone ~225 px); field + key first, the boxes / notice below; a visible
  label, worded errors (`aria-invalid` + `aria-describedby`), focus to the field, Esc back to Try, 24 px+ targets;
  a Privacy link at the point of collection; the notice per plugin (free GAS never "before a trial ends"); on
  phones "We'll email the link. Open it on your Mac or PC."; CHECK YOUR INBOX (`role=status`) gets "Not there in a
  minute? Check spam · Resend · Wrong email?"; one "form open" flag pauses every glitch and blocks the marketing
  pop-ups; the key's sub-label says the link comes by email (GAS: "Mac + Windows · link by email").
- 3 DRIFT: one deal in one word ("Free beta" beside "Try free for 30 days" reads as two offers); its sign-up says
  "You join our list" with no box (Lena: consent tied to a download, GDPR Art. 7(4), for a human to confirm): the
  TV form gives DRIFT the optional box, and the worker must not list without it (check before shipping); a line
  for the streamer offer; DRIFT under FREE, or a "free to try" mark. `drift.homeLead` says "until Nov 1" (today).
- 4: B for the trials (verified address, back on the TV); GAS: B, or C (no inbox trip, unverified leads) by the
  owner's call. The ready keys focus the visitor's OS (today macOS is focused on Windows).
- 5: the picture, the name and a second click on the lit row open the product page too (all dead today; the lit row
  even shows a pointer).
- 6: top AND bottom, and the list pane too (204 px empty); it shows at 150-200 % desktop zoom as well.
- 7: add desktop at 150 / 200 % zoom (they hit the phone layout), NVDA, Windows High Contrast, and a real-iPhone
  keyboard check as a hard gate.

New steps from the round (each to the user):
- [ ] 8. The 10 %-off pop-up (`WelcomeDiscountPopup.astro`, 35 % scroll) opens ON the TV: four of five hit it, it
      blurs the store and takes keyboard focus mid-arrow (Ron). Never while the TV is in view, the pointer / focus is
      in it, or after a TV interaction (main fires at the same 35 %, so this is the branch's TV landing on it).
- [ ] 9. A one-line specs / terms strip on the lit plugin (formats · Mac + Win · no iLok · 2 machines · 14-day
      refund, from plugins.ts; the product page's hero has it). Apple Silicon only in words once confirmed.
- [ ] 10. (user) A BUY $49 key on paid plugins opening the existing cart (reverses phase 2's "no Add to cart on
      home").
- [ ] 11. (user) ▶ HEAR IT on the lit plugin, playing the product page's before / after pair.
- [ ] 12. The price on the desktop list rows (`.ww-rprice` is hidden on desktop; prices only show per channel).
- [ ] 13. Access fixes: under forced colours the Try key loses its shape and the lit name's plate cuts its type word;
      DRIFT's five words 3.8:1 (AA fail: drop `.ww-pw`'s .85 opacity); Try's second line 10.56 px at .78 (13 px+, no
      opacity); a ring on the pane's name after opening; the closed nav drawer's five links are hidden Tab stops at
      <= 860 px; the floating cart button sits on the TV at narrow widths.

Outside this branch (to the user):
- The GAS notice bug is LIVE on main: `TrialGateModal.astro:81` says "a heads-up before a trial ends" under "Free
  forever ... no trial clock" (the free branch swaps the title and sub, never the notice). A one-line fix on main.
- The cookie banner: focus lands on ACCEPT ALL, Decline is a ghost button, at 200 % zoom it covers ~2/3 of the
  screen; `cdn.paddle.com/paddle.js` loads on home before consent (Lena; for a human to confirm under ePrivacy).
- Privacy policy (Lena, for a human): §3 says the how-you-found-us note goes only at checkout, but the trial
  sign-up sends it; no retention for trial emails; the 10 % pop-up missing from §2. Licence terms: no trial clause.
- System requirements say "CPU 2 GHz dual-core (Intel/AMD)", nothing on Apple Silicon (Daniel stops there on an
  M-series Mac). RevLimiter's `CMakeLists.txt` builds universal (`arm64;x86_64`, checked 2026-11-01), so it is a
  copy fix once the shipped Mac build is checked (`check-macos-floor.py` / `lipo`).
- DRIFT's list consent, checked 2026-11-01: `DriftKeep.astro` posts `/form-once` (the newsletter list) with the
  trial register and prints "You join our list · unsubscribe anytime"; there is no box.
- Findings on files main also changed (CookieBanner, the Header drawer, Cart, MobileBuyBar) were seen on a branch
  96 commits behind: check them again after step 0's merge.
- Screenshots cited above: `tasks/evidence/persona-qa-2026-11-01/shots/` (the full sets stayed in the session's
  scratchpad).

The user's decisions after the round (2026-11-01):
- Step 2 scope: the lit name AND the blurb glitch, rarely; never the price, the keys or the form; everything frozen
  while the form is open; off under reduced motion, high contrast and forced colours. (Over the personas' "name
  only".) The law changes when step 2 is built: design-language §3's exception + DESIGN.md §4, same session.
- D6: a REQUIRED terms box, as asked (over the personas' line). Built to their access notes: a 24 px+ target, the
  links outside the label, a worded error beside it, the site's page names ("Terms & Conditions", "Licence terms");
  Privacy is a notice link, never inside "agree".
- D5: B (the verify link returns to the TV on that plugin with Mac / Windows keys on its screen; the worker change
  goes live only on the user's word).
- Extras: step 8 (the 10 % pop-up off the TV) and step 9 (the specs / terms strip) are IN; step 10 (BUY on the TV)
  and step 11 (HEAR IT on the TV) are OUT.
- Still open: D7 (the second key's words), D8 (the screen type, on the bench), D9 (`.rv-btn`).

Approved-look pushback (taste, the user decides): hollow unlit names read greyed out / unavailable (Maya, Ron:
3.56:1); the hero names no plugin or "free" (Maya, Lena, Kai); GAS's text squeezed into 192 px beside its tall
window; the huge names spend half the screen on four plugins; FREE shows one lonely row; facts beside the five
adjectives (Daniel: "TRUE-PEAK · 8x OS · LUFS METERS"); keep the picture tear off the lit plugin's window.

### Later, each on its own branch

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
