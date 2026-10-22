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
- Site players (2026-10-13): a glow layer with `mix-blend-mode:screen` on the leather/walnut panel rendered
  invisible in Edge (forcing it red proved it was placed right). A plain alpha radial gradient works. Check a glow
  by a crop screenshot with its animation off, never by computed styles.
- Site players (2026-10-19): a web component's pre-build placeholder (`aspect-ratio` + `max-height` on the host)
  must be fully released on `.ready`. Releasing only `aspect-ratio` left the cap, and OPEN THE HOOD's taller mixer
  painted over the footer. Test every state that changes the component's height (hood open, phone), not just first load.

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


## 2026-10-19 — The TV's glitches (Home LIBRARY phase 4e)
1. An `!important` in a test style freezes whatever an animation drives: important author declarations outrank CSS
   animations in the cascade. The roll experiment overrode the glass's `background` shorthand with `!important`,
   which pinned the band's `background-position` (a longhand of it), so every strength measured 0 lift. Change a test
   value through its custom property, or without `!important`, whenever an animation drives any longhand of it.
2. Measure a subtle effect before baking it: the rolling band at .06 white read fine in the CSS but added ~11 of 255
   on the empty glass and did not show in a still; .1 does (~20). It got a bench slider (`--ww-gl-roll-light`).
3. Read a tunable when it comes due, not when it is armed: the scheduler keeps where its wait ends (a fraction
   between the shortest and the longest) and reads the times at every wake (2 s at most), so the bench's sliders and
   a test's style added after the page loads both take at once. Read once at arming, the shipped 12-25 s wait would
   have let glitches into every older check that sets its style after `goto` (motioncheck, readcheck, glowcheck).
4. A glitch must not touch what the motion animates: an animation's value outranks GSAP's inline `transform` /
   `opacity`, so a `transform` keyframe on the picture would have cancelled the entrance's tween. Glitches animate
   `translate` + `filter` only, and the tear is a canvas laid over the picture, so the picture itself never moves.
   The change's tear waits for the landing: at the entrance's start the picture is at opacity 0, 12 px off, and a
   solid copy of it there would bring back "appears, then slides".
5. A recorder that hands over its log by emptying it (`splice(0)`) between arming a test and finding its event drops
   the one already in progress: WebKit failed "a touch stops it" because the 4 s glitch began in the 400 ms before
   the empty-out, then the wait for a new one ran out. Mark the arming time and look for an event after it
   (`x.t > armed`), never empty the log in between; and let the check prove the touch did it (WebKit: the 4 s
   glitch ended 11 ms into its 4000, not at its natural end).
6. A "now and then" clock that only rerolls when a wait comes due while it is blocked (off screen, not lit) fires
   any time 0-25 s after the thing comes back: a visitor gliding in by the PLUGINS chip could get a glitch as the
   tube lights (the advisor review; measured on `1ce4007`: the first 1510 ms after the tube lit with a 3 s wait).
   Restart the wait at the first look that finds it on show again, and gate every trigger (the clock, a change's
   landing, the bench) on the one "on show and lit" test: a pick while the tube was still lighting tore 320 ms
   before it was lit. Test the arrival, not only the steady state: every earlier check scrolled to the TV first.
7. Headless timing checks are load-sensitive on laptop 1: with Ableton Live and a media player running, headless
   WebKit's frame gap went from ~180 ms to 230-386 ms (Chromium ~26 to ~55 ms) and 11-19 of motioncheck's
   first-frame checks failed. The component of the commit before failed the same checks in the same hour, so it
   was the machine, not the change. Before calling a timing FAIL a regression, run the previous commit as a control
   in the same hour and compare the frame gaps the check prints; re-run on an idle machine for the record.

## 2026-11-01 — The bench pick of the menu line and the reading (Home LIBRARY phase 5)

1. A bench pick that grows a size can break the one-screen rule on a short laptop while the bench looks fine: the
   thumbnail went 6.9 -> 9.8rem and four rows then ran 21 px past a 1280x665 screen, 45 px past 1141x636. The
   bench's own shots after a size change showed an empty list (the reveal runs again when the frame reloads), so
   they could not show it. After "apply ww bench", measure the wall's bottom against the screen on the real page at
   1141x636, 1280x665 and a short phone, and give any size that grows a height term the way the names have one
   (`min(slider, room / rows ...)`), so the pick holds wherever there is room and yields where there is none.

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

## 2026-10-28 — a hand-tuning bench over the real page: Lenis eats the wheel
The #hear section bench drags and resizes parts inside same-origin iframes of the built /drift page. Wheel-to-resize
scrolled the frame instead, even with `preventDefault` in a `{ passive: false }` listener: the site's smooth scroller
(Lenis, `src/lib/motion.ts`) scrolls the page from its own wheel listener. Lenis skips anything inside
`[data-lenis-prevent]`, so the bench sets that attribute on `#hear` while EDIT is on (and stops propagation, or the
VOLUME knob's own wheel handler turns it too). Moves ride on the CSS `translate` property and sizes on `scale`, added to
the part's own translate read with the tune style disabled, so the page never reflows under the hand.

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

## 2026-10-28 - folding a hand-tuned bench layout: positions, not the bench's translates
The #hear section bench was tuned by hand with CSS `translate` / `scale` on top of the page's flow layout, at one deck
width (691 px). Copying those translates would hold only at that width: at 1100 px the pair re-centres in a narrower
step and STOP's +92 px ran into the DRIFT ring. Fold it as layout instead: measure every part's centre on the bench
(a geometry dump in panel coordinates), place the parts absolutely in the controls box at x = place * --s + a share
of the deck's spare width (--e = 100% - the tuned width), the edge part pinned to its edge, and step --s down with a
container query on the deck. Then prove parity by dumping the folded page with the same keys and diffing (here every
part within 0.5 px), plus an overlap sweep over many widths with a forced-overlap control that must fail.

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

## 2026-10-30 - the iOS keyboard shrinks a viewport-sized page

GAS 2 postcards (`danavivi-75`), Dan on his iPhone (iOS 26), a screenshot of the mail card with the keyboard up: "it's
not comfortable like this". iOS 26 cut the fixed full-screen page to the ~387 px above the keys, so the stack (sized
by its container's height) shrank the card to half, and the type with px floors (the input >= 16 px against iOS zoom,
the tick line >= 12 px) ran into the stamp. check.cjs had listed "the iOS keyboard" as not covered. Rule: on focus,
keep the card's size and slide it so the field and its button sit over the keys; check it by focusing the input and
cutting the viewport to the keyboard's leftover (`setViewportSize`), at every phone size.

## 2026-11-01 — A plan's "keep X deleted" goes stale while the branch waits (deploy-today merge, `revaudio-67`)

1. The plan said to keep PluginShowcase deleted in the merge; main had since built `/downloads` on it
   (`<PluginShowcase mode="downloads" />`, which imports DriftCard). Taking the deletion would have broken the
   build. Before resolving a modify/delete, `git grep` the deleted file's name on origin/main for new importers,
   and run `git merge-tree --write-tree --name-only HEAD origin/main` first: it lists the conflicts without
   touching the worktree.
