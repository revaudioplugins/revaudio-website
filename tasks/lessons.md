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

## 2026-10-18 — The TV's motion engine (Home LIBRARY phase 4d)
1. Making a state flip lazy breaks every reader that assumed it was immediate: `data-ww-on` now flips only when a
   change lands, and the bench read the lit plugin back from it right after asking for a change, so every second
   ▶ CHANNEL re-picked the plugin already on its way. Before deferring a flag, grep its readers; read "what was
   asked for" (the lit row) separately from "what is showing" (data-ww-on).
2. Never finish an interrupted cross-fade with `progress(1)`: the rest of it lands in one frame (the screen's colour
   jumped 0.27-0.70 of the light on a pick 250-350 ms into the previous change). Settle it continuously as the
   interrupted thing leaves (to the nearer colour), then start the next from one state.
3. A rAF recorder that is restarted within one frame of a stop keeps the old loop running too (every frame logged
   twice, dt 0): presence checks survive it, rate / jump metrics do not. Give each start a generation and let a loop
   end when its generation is stale. And a jump metric needs its control first: run it on the old code and see it fail.
4. Headless WebKit on laptop 1 paints ~5 fps: an entrance shorter than ~200 ms is done before its first frame, so
   "starts from below / from the right" reads as 0 there. Stretch the motion times (x4, as the bench's SLOW) for that
   engine instead of loosening the check.

## 2026-10-19 — The TV's motion: smaller, shorter, one way (Home LIBRARY phase 4d step 3)
1. A fade quicker than its travel reads as "it appears, then slides": TUNE's picture was solid at 180 ms but kept
   travelling to 600 ms (quint), so the user saw a solid picture sliding. Fade and travel as ONE tween (one time, one
   curve): the picture is solid only once it is in place. The check: at >= 90 % opacity, within 0.15 x the travel.
2. A direction tied to the pick (the list's order, a key, a per-plugin axis) reads as random to someone clicking
   around: three of four changes rose and the wrap dropped. One way for every change of the same kind.
3. "Make it smaller and more elegant" became two concrete defects and a target time after four questions about what
   was SEEN (which motion, where and at what speed, what looked odd, what "smaller" means), with no ms or px in them.
   Ask about the eye, then map each answer to the code.
4. A control on older code must force the mode the new code replaced: the old file defaulted to GEAR, whose
   entrances start below their rest and would have passed the new "from below" check by accident (the advisor caught
   it before the run). Force TUNE (`data-ww-motion`) in the checks; today's code ignores the attribute.


## 2026-10-19 — The TV's text under its scanlines (Home LIBRARY phase 4d step 3b)
1. A texture over type costs the reading: the TV's scanlines (a 1 px line at .42 every 3 px) lay OVER the content, so
   every letter and the Try key were cut in stripes; the user: the reading suffered "because of the pixels". Put a
   screen texture on the glass, under the text and the pictures; only smooth light (reflection, curvature) goes over.
2. The bench draws the phone frame at the laptop's 1x. The user picked the scanlines at .42 against 1-device-px lines;
   a phone (3x) draws each one 3 device px thick, a band across every glyph. Check a texture in a 3x shot (or on the
   phone) before baking it.
3. "Letters identical with the lines on and off" fails on a correct fix: an anti-aliased edge pixel is part glass, so
   a line under the text still shows through it a little (max diff 7-16 of 255). Measure what a line OVER a letter
   does instead: the letter itself goes to ~0.58 of its line-free self at .42 (old code 0.58, new >= 0.94). A flat
   face (the key) and the picture can stay strict (max diff 0). A metric changed after its control run needs a new
   control run.
4. Keeping the lines on the pictures would have needed a layer that moves with the picture: the motion tweens the
   img/video, not `.ww-ui`, so a figure overlay would stand on empty glass while the picture fades in. Check what the
   motion actually moves before hanging a layer on its parent.
