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

## 2026-10-19 — overlap checks: measure the GLYPHS, and keep pseudo-elements out of :is()
1. "Does the title hit the checker strip?" An element box answers wrong: `#d-hear-h` is a full-width block, so its box
   overlaps everything on its row at every width. Measure the text itself (`range.selectNodeContents(h)`,
   `range.getBoundingClientRect()`) against the other part's box, at a sweep of widths: the #hear checker really did
   run under LET'S DRIFT. up to ~770 px, not only on phones as the screenshot suggested.
2. `:is(.a::after, .b .c)` is invalid (pseudo-elements are not allowed inside `:is()` / `:where()`), and the browser
   drops the WHOLE rule with no build error. Write a pseudo-element selector out in full, once per rule.

## 2026-10-19 — a ghost layer blinds scrollWidth: measure the lit text
The LCD's ghost cells are an absolutely positioned `::before` inside the coach cell (`overflow: hidden`). An absolute
child counts toward scrollable overflow, so `scrollWidth > clientWidth` turned true for EVERY coach line at every
width (verify-hear.cjs's coachClipped said "clipped" everywhere, a blind metric). Measure the lit text instead:
`range.selectNodeContents(el)` -> its right edge vs the cell's right edge, plus a control string that must fail
(coachfit.cjs). The real check then found the one true clip: 2-6 px at 360, fixed with letter-spacing 0.

## 2026-10-26 — bench files, font fallbacks and WebKit: three traps from the #hear LCD work
1. `bench/assets/` is gitignored (big AI originals). A bench's own crops / fonts put there never reach git, and a
   partner gets a bench with broken images. Give each bench its own folder (`bench/drift-lcd/`, `bench/drift-play/`)
   and check `git status --short bench/` shows the files before the commit.
2. A Playwright screenshot waits for web fonts, so it can never show a `font-display: swap` fallback. To judge the
   fallback, block the font request and capture through CDP (`Page.captureScreenshot`), which does not wait.
3. playwright-core 1.63 asks for `webkit-2359`; laptop 1 has `webkit-2336`. Launch it with
   `executablePath: %LOCALAPPDATA%/ms-playwright/webkit-2336/Playwright.exe` instead of downloading. Windows WebKit has no
   `AudioContext`, so the #hear player stays on its no-audio path there: WebKit checks the look, not the sound.
