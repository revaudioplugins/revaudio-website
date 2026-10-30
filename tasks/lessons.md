# Lessons (revaudio-website)

Patterns from user corrections. Read at session start before website work.

## 2026-09-06 - never push until Dan says push clearly

The garage homepage pass went to origin/main as a noindex /garage preview before Dan had
reviewed it. Dan: "never push until i say to push clearly."

Rule: commit locally after each verified step; do NOT `git push` until the user in this session writes "push" in
plain words (rule set by Dan; on the Yoni laptop the user is Yoni). Report "committed locally, not pushed". A preview route still deploys on push
(GitHub Pages) and lands on partner clones, so "noindex" is not a reason to push early.
The "rv close" ritual is an explicit push instruction and still counts.

## 2026-10-07 — Don't call the user "Dan"
- On the `C:\Users\Yoni` laptop the user is Yoni. I asked for "push from Dan" a third time because the push-rule memory was titled "until Dan says push". The memory now says "the user".
- Rule: when asking for go-ahead, write "say push". Before sending, every "Dan" that means "you" gets changed to "you".

## 2026-10-07 — removing a catalog field: prove it with the built pages, not the build
- Astro does not type-check `.astro` templates at build time, so a leftover `plugin.someField` just renders as
  nothing and `npm run build` stays green. Rule: after deleting a field from `src/data/*.ts`, grep `src/` and
  `tests/` for it, then diff the built pages before and after (strip only the attribute you meant to remove) and
  expect nothing else to change.
- `npx playwright install` (needed after `npm ci` bumps @playwright/test) deletes every browser revision no
  remaining install links to, including ones other tools pinned by path. Rule: point scripts at the newest
  `ms-playwright` folder, never at a fixed revision.

## 2026-10-07 — scripted edits can eat CSS escapes
- A Python heredoc edit turned `content: '\00b7'` into a NUL byte (`' b7'` on screen); the build stayed green and the dot just vanished.
- Rule: after any scripted edit that writes a backslash escape, check that exact line with `od -c` (or grep the escape) before building. For anything with backslashes, write the script to a file in the scratchpad, or use Edit.
## 2026-10-07 — a "still open" list in the handoff can already be done: re-grep each item first
- The 10-06/10-07 handoffs said Terms §7 and the EULA still named the old store. They had been vendor-neutral since
  `683b934` (2026-10-01); the item was copied forward without a fresh grep. Rule: before planning from a handoff's
  open-items list, grep each item in the current tree and say which ones are already done.
- Terms and the EULA share one date constant (`TERMS_LAST_UPDATED`; Privacy has its own `PRIVACY_LAST_UPDATED`
  since `1c34cac`): a Terms/EULA edit re-dates both and changes `data-terms-version` in the cart. The cart's legal
  popup sits on every page, so expect ~22 built pages to differ. Verify with a word-level dist diff, not a page count.
- The Playwright MCP browser can be held by another session ("Browser is already in use"). Render with a node
  script that requires the repo's `node_modules/@playwright/test` instead; don't run `npx playwright install`.

## 2026-10-07 — privacy text: check the server side, the live site, and who owns consent
- The site's ad tags were consent-gated, but until Yoni's worker change (RevLimiter `fae16a3`) the licence worker
  sent Meta a server-side Purchase for every sale whatever the cookie choice. Rule: before writing or reviewing
  tracker text, read the browser code (CookieBanner, Cart, trial components) AND the worker's webhook path, check
  which secrets are set (names only), and load the live site in a fresh browser with ad hosts recorded and aborted.
- Two sessions rewrote the Privacy page in parallel on 2026-10-07; Yoni's (`1c34cac`) went live first and won.
  Yoni owns cookie consent (Dan, 2026-10-07). Rule: before touching Privacy or cookie text, fetch origin and read
  the newest handoff entries for an owner.

## 2026-10-14 - Playwright WebKit on Windows vs the homepage (DRIFT word wall)

Cost 30+ minutes in one session; set these up front for any WebKit verify of `/`:
1. `goto(url, { waitUntil: 'domcontentloaded' })` + poll `document.fonts.status === 'loaded'` + env
   `PW_TEST_SCREENSHOT_NO_FONTS_READY=1`: the homepage `load` event never fires in WebKit-on-Windows (a
   `<video preload="none">` is enough), and screenshots hang on fonts.ready.
2. Headless WebKit runs rAF at ~17 fps: physics caps dt (~0.1 s) and snaps on settle; settle checks poll up to ~4 s.
3. WebKit + `hasTouch` = coarse pointer (touch paths run). Chromium mobile needs `isMobile` + `hasTouch`.
4. WebKit reports a non-zero `currentTime` on a video that never played: prove "did not play" with play-event counts.
5. A `writing-mode: vertical-rl` item in an `auto` grid column wraps into two columns in WebKit at phone widths
   (Chromium doesn't): `white-space: nowrap`. A `maxRight > viewport` check passed it; compare per-element rects
   across engines, not just "no overflow".
6. 'Drift JP' (variable Noto Sans JP subset) renders thin in Windows WebKit although the face loads: real Mac /
   iPhone Safari check owed before trusting it.
7. Local preview logs Cloudflare RUM (`cloudflareinsights`) CORS errors: stub that route before counting console errors.

## 2026-10-14 - "הרגע" was "הרקע": ask when one Hebrew word decides the whole design

Dan wrote "I want the רגע (moment) to be more like a TV screen". It was a typo for רקע (background). I read
it as "the window" and built a TV around the plugin window; he meant the whole wall behind the panel.
Rule: when a key word in a Hebrew request doesn't parse, or one letter would change the meaning
(רגע/רקע, כאן/כן), ask one short question with both readings before building.

## 2026-10-14 — A scroll lock must never pull back against the visitor
The word-wall TV lock (WordWall.astro) landed the TV whenever scrolling went idle within the zone, so one wheel notch
or an arrow tap away from the TV was pulled straight back: small steps could never leave it (checker blocker B1).
Rule: remember scrollY at the gesture's start; bail if the page did not move (sideways wheel, Space on a button, a
wheel inside a dialog); land only when this gesture brought the target closer (|off| < |off + moved|). Test small
steps both ways from the landed spot, each case on a FRESH page: after Lenis finishes it swallows the next native
scrollTo, so a test's own scrollTo leaves Lenis stale and fakes results. Headless WebKit paints scroll every ~190 ms:
an idle timer shorter than that fires before Lenis moved; wait while `lenis.isScrolling === 'smooth'`.

## 2026-10-15 — Weight work: measure fair, and what makes Astro ship raw PNGs
1. Before/after byte counts only on the SAME kind of server, by IP: a stray `astro preview` on `::1:4431` answered
   `localhost` with compressed responses while python held `127.0.0.1:4431`, so the first "after" looked 300 KB
   lighter than it was. Check the port's owner (`Get-NetTCPConnection -LocalPort N`), use `127.0.0.1`, and build the
   old commit in a temp worktree for the baseline instead of trusting an old number.
2. Astro ships the raw source file (MBs) for an imported image when (a) code reads a property straight off the import
   (`img.width`; read `img.clone.width`, the proxy's escape hatch) or (b) it is imported but never transformed (an
   eager glob of bench rolls you stop running through getImage). Judge by `ls dist/_astro/*.png`, not by reasoning.
3. Lazy art must not wait on `load` alone: a stalled video can hold `load` back for good (the WebKit lesson above, item 1: headless
   WebKit never fires it). Start on load OR first scroll OR a timeout.
4. A video's no-JS fallback: Chromium forces media controls when scripting is off and paints their grey panel over a
   poster-less video; hide `::-webkit-media-controls` in the `<noscript>` style or the picture never shows.
5. "Smaller on phones" must come from the screen's real need, not a guess: the phone poster needed ~1050 device px
   (390@3), not 800; measure CSS size x DPR per device before choosing cuts.

## 2026-10-20 - a bench value tuned at laptop widths can break narrower ones

The GAS lab bench (real /gas in 1366-1920 px frames) gave a fixed `margin-bottom: -7.625rem` that pulls the
width-scaled <gas-mixer> up under the "Hear it" line. At a 1000 px window the mixer is smaller, so the same pull ran the
console over the line and the note onto the plate. Rule: after baking a bench offset that works against a component
that scales with the width, check the narrowest desktop width (~1000 px) too; scale the offset with the width
(`max(<tuned>, -<n>vw)`) so the tuned look stays exact where it was tuned.

## 2026-10-22 - A component dropped into someone else's page: prefix EVERY class

- The GAS 2 radio's tuning knob (`.rp-knob.tune`) rendered 0 x 0: page-b's own TUNE panel is `.tune { display: none }`.
  Generic names (`tune`, `vol`, `on`, `open`, `key`) collide with the host page's CSS. Every class of a player that
  lives in another writer's page carries its prefix (`rp-`), states included where the host styles them; check an
  invisible part with `getBoundingClientRect()` first (0 x 0 = a host rule, not your code).

## 2026-10-23 — GAS 2 page mockup (`danavivi-a3`): checking a page Dan views in Safari
- A gradient layer that starts at a hard element edge shows as a "cut": the Dusk layer's top/bottom band had no
  horizontal fade. My Chromium screenshots missed it by eye; a column-luminance scan across the band found it (a step of
  ~9 at the layer's left edge). Rule: before showing any overlay / shadow layer, scan luminance across it (or the darkening
  ratio against a layers-off render), and mask every layer so it fades out on all sides.
- Never `screencapture` after activating Safari: it steals focus while Dan types and captured his editor instead of the
  page. Rule: check Safari rendering offscreen with `wksnap` (`revaudio-shared/tools/wksnap/wksnap.swift`, built into the
  scratchpad). It does not render `backdrop-filter`, so those layers need Chromium + Dan's eye.
- A live-page bench (`?bench`) keeps its deltas in localStorage, so after an export is folded into the source they apply
  on top again (doubled offsets). Rule: park the stored copy once behind a stamp (page-b's loader, `gas2page-b:folded`), and
  set that stamp in probes that inject deltas, or the probe's fresh profile parks them too.
- New TUNE defaults do nothing for a viewer whose localStorage already holds the old values. Rule: a new composition gets a
  new storage key (`gas2page-b:tune2`).
- Same day, the second half of it: equal specificity loses to the host's LATER stylesheet. The radio's `<link>` sits
  above page-b's own `<style>`, so `.rp-veil { background }` lost to the page's `.veil { background }` (0.62, not 0.86 /
  0.93) and nobody saw it for two rounds. Style a shared base class as `.veil.rp-veil`, and check a component's key
  rules with `getComputedStyle` in the host page, not by reading the CSS.

## 2026-10-30 - pointer capture moves the pointerup's target

GAS 2 postcards (`danavivi-75`): the stack calls `setPointerCapture` on pointerdown, so the matching pointerup arrives
with `e.target` = the capturing card, never the child under the finger. Round 2's "a tap on the deck doesn't turn the
card" (`e.target.closest('.deck')` on pointerup) never worked; round 3's check caught it. Rule: keep the pointerdown
target and test that, and write a check that taps the exact spot.

## 2026-10-30 - a physical object's print doesn't animate

GAS 2 postcards (`danavivi-75`): round 2's "make everything feel much more alive" became arrival pops on every card
(the lettering popped, seals and postmarks thumped, "Greetings from" wrote itself), a turning sunburst and a
flickering lamp in a photo. Dan, round 5: "the readings should be glued to the card itself ... physics-wise". Rule:
on a physical metaphor, life comes from the object and its real mechanisms (the card's flick and curl, the turntable,
a sticker's corner, light), never from its printed content moving. DESIGN.md §6.

## 2026-10-30 - "not smooth": measure frames on a slowed CPU before touching the motion

GAS 2 postcards (`danavivi-75`), Dan: "the card moves are not smooth yet ... everything that moves needs to be smooth".
Chrome with `Emulation.setCPUThrottlingRate` 4 + a rAF frame log + a `longtask` observer found what eyes alone would not:
a thrown card left at ~3x the finger's speed (a fixed cubic-bezier over a fixed distance) and a CSS transition held it
still for a frame or two first; a box-shadow swap on the held card and a depth `scale()` repainted whole cards;
`new AudioContext()` took 226 ms (4x) while warming the demo (decode on an `OfflineAudioContext` instead; open the
device on the tap); a 1M-pixel canvas loop blocked 240 ms (slice it, a few ms a frame). Sample the moving element's
speed per frame around the release to prove there's no jump. DESIGN.md §6.

## 2026-10-30 - two movers on one element: whoever takes it over starts from where it is

GAS 2 postcards (`danavivi-75`, the ponytail pass): a let-go card moves frame by frame in JS while the stack settles in
CSS. Five paths took a moving card over without reading where it was: ‹ mid-throw (an ~890 px jump), › on its way
back or while it sprang home, a tap mid-spring (frozen off its place), a layout mid-spring (settled on the wrong
place), and a flick whose move and lift fell inside one frame (state set only in rAF: a TypeError). Rule: one mover at
a time; the one taking over stops the other and starts from the pose this frame (the computed transform covers both
movers); state the release reads is set synchronously. Test each takeover by reading the rect just before and just
after it, and fire down/move/up in one task for the sub-frame flick (`check.cjs`).
