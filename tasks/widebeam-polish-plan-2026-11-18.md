<!-- Copied from the design team's scratchpad on 2026-11-18 (Claude Code `Wide Beam page tour [3eef2b]`, Dan's Mac) so it
     outlives the session. Dan's picks came in the same day (below); the build follows them. -->

# Dan's picks (2026-11-18 ~16:10, on the pick page, no notes). These override every "my pick" below.

| Id | Dan picked | What it means for the build |
|---|---|---|
| D1 | B, the four readings | Lockup, ONE line, ONE shine key "Take it for a drive", signature "Open the road.". Nothing else in the hero. |
| D2 | **B: "WIDER MIX. BASS DEAD CENTRE."** (not the lead's A) | This is the hero line, word for word. Keep the body copy exact around it: the side below LOW FOCUS (120 Hz by default, 20-1000) is removed at any WIDTH; MIX under 100 blends the dry (its side bass included) back. |
| D3 | B, the plate's satin brass | 3 brass tones sampled from the plugin, raised letters, the sans sub line between brass rules, live type, still opens with WIDTH. |
| D4 | C, cut from the plugin, engraved serif labels | Plates / story window / spec card cut from the plugin's photo (parts kit); small labels in the plate's engraved serif caps; headlines stay Bebas. |
| D5 | A, the console column | At >= 1100 px the console stands beside the face; face + every control on one screen at 1141x636. |
| D6 | A, the Owner's Manual | The screen in a small copy of the plugin's face with the oxblood strap + badge; six chapters on owner's-card stock beside it. |
| D7 | B, the phone deck | The face on top as the live display (inert), a deck of big native-range controls under it. |
| D8 | B, the portrait cut that follows the car | Dan chose it knowing it bends DESIGN.md §7 ("never a crop of the desktop scene"). Build B; note the exception in the page's DESIGN notes. |
| P1 (= D10) | A, launch after Black Friday | "Price at launch"; no BUY; the Black Friday strip is hidden on /widebeam until it can be bought. WIDE BEAM leaves the bundle on Nov 22 by Gil's rule: that is a `sale.ts` line on main, Gil's (with OBDTune), NOT this branch. |
| P2 (= D11) | B, the first touch of the demo | The allow-list in lane D.1. |
| P3 (= D12) | B, 3-4 real clips through the live demo | A mono vocal, a double / lead, a pad or instrument bed, a full mix. Source: the team's own material already published on the site (`public/audio/revfx/*-before.m4a`, `public/gas-mixer/audio/*_dry.m4a`, `public/audio/revlimiter/*-before.m4a`), cut to <= 0.4 MB each in `public/widebeam/clips/`. Dan confirms by ear. |
| P4 (= D13) | A, a partner records the film | The Owner's Manual ships in stand-by; one data field turns on the YouTube facade. |
| P5 | A, "Mac VST3 · AU · Windows VST3" | No AAX anywhere; `assertWidebeamConfig()` refuses `released` while `winReady` isn't confirmed. |

D9, D14 and D15 stand as the lead wrote them ("choices made" on the pick page; Dan vetoed none).

# Read first: what changed after the lead wrote this plan (2026-11-18)

**Status.** The ten designers' plan is below, as the lead wrote it. A completeness critic and one verifier per bug then
checked it: 46 of 53 bugs reproduced, 6 partly (mobile-02 on 390 px, perf-01/03 cause, motion-d02 laptop half, a11y-10
phone sizes, art-d04), 1 not (demo-15). Dan's picks are collected on a private pick page:
https://claude.ai/artifact/CnPheXrffMYYjpPcN6Dr8Y (8 looks + 5 plain calls; picks are saved in its database, collection
`picks`). The decision ids there differ from Part 1 below: D1-D8 are the same, P1 = D10 (Black Friday, reframed),
P2 = D11, P3 = D12, P4 = D13, P5 = the formats line (new). D9, D14 and D15 became "choices made" on the page (say-no
list).

**Corrections the critic found (fold in before lane F; a "Step 0.5"):**
- Copy: "100 leaves your track exactly as it was" is false (the side below LOW FOCUS is removed at any WIDTH and the dry
  is allpass-rotated): it comes off. "Solid in mono" holds as "whole", but CRUISE (on by default) lowers mono by
  -2.04 dB at WIDTH 200 (-0.53 dB at 136). "6 dB more side at full beam" reads as a HIGH BEAM claim: say "at WIDTH 200".
- D10 is not a fresh pick: main's `sale.ts` (Nov 17) already has "Wide Beam ($9)" in the bundle, out on Nov 22 unless
  released. The Black Friday strip on /widebeam (Nov 27-30) needs its own decision (P1 on the pick page).
- D8: the pan-crop (B) bends DESIGN.md §7 ("never a crop of the desktop scene"); the house recipe (zoom-in on the
  plugin) was added as D8-C. Mocked: B puts 77 % of the headlight light on screen (today 15 %).
- The launch checklist (section 6) misses the money chain: WIDE BEAM's own licence worker deployed (README: "source
  only"), the hub's PADDLE_PRICE_MAP / LICENSE_TARGETS / service binding / admin token, signed builds on R2 (the signed
  installer has never been run), the /purchase download, and the mandatory real test purchase (wiki store-paddle,
  website-update step 6). Also the home TV entry and the /plugins card have no owner.
- Chapter links (`<a href="#wb-step-0N">` + `driveTo`) will fight Lenis's own anchor handling (`motion.ts:39`
  `anchors`): stop propagation, one mover.
- The cookie banner (A.5) is Yoni's component (lessons 2026-10-07): write it up for Yoni, don't change it here.
- Gates that could not fail as written: G0's honesty grep must also read the page's JS chunks and the rendered text
  after interaction (copy-02 lives in `init.ts`); G8/G11 need DPR 2 (laptop) / 3 (phone) and a simulated keyboard; add
  1920x953, 901-1099 px and iPad sizes; Firefox runs headless here (add it to smoke and the music matrix); render the
  open / released phases and the YouTube facade from a dev fixture; test takeovers between two movers; measure the first
  sound's long task (new AudioContext + engine on the first knob touch).
- Small: WbDeck needs a stub in F's shell (or renders inside WbDrive); lane ports must be script arguments (19 check
  scripts hard-code 4392); intro URLs built in code must reuse the stamped `<source>` src (assetver); `:global(iframe)`
  for the facade; re-run demo/power2.cjs 20x in WebKit (one POWER click in four was lost); "Where it stops" gets the two
  README limits it misses (TRACTION is single-band; the bypass / MIX 0 dry is phase-rotated around LOW FOCUS).

---

# WIDE BEAM (/widebeam): the plan to the DRIFT / GAS 2 bar

Lead designer, 2026-11-18. Built from the ten designers' study and debate (`team/reports/*.md`) and my own check of the
running page (`team/lead/verify.cjs`, Chrome + WebKit on http://127.0.0.1:4392, worker and analytics stubbed, nothing
sent). Nothing in the repo was touched. Branch `feat/widebeam-page` at `26ebedb`: 9 commits ahead of `origin/main`,
8 behind (as of the 14:13 fetch; main gained the Black Friday bundle with "Wide Beam" in it and the home-garage A/B).

---

# Part 1 · For Dan

**Bottom line:** the dash, the stereo road and the presets are the richest demo on the site, but the page is not at the
house bar yet. It promises a trial, AAX and a CRUISE the plugin can't back. Its main button lands on an empty screen with
the music on. It has no tutorial place, no closing "get it" console and no ask on phones. The plan keeps the page's world
(the car, the live face, the road), builds every surface from the plugin's own photo, and adds the Owner's Manual and the
closer. 8 picks are visual and go side by side on one pick page; 7 are plain choices.

## What you will see, top to bottom (with my picks)

1. **Hero: the night drive.** The car sweeps past and drives off, as now, on every load. When it leaves, the sky holds
   four things (GAS 2's "readings"): WIDE BEAM in the plugin's satin brass with its shadow back; one honey line,
   "WIDE ON HEADPHONES. SOLID IN MONO."; one shining key, "Take it for a drive"; and "Open the road." in script.
   - The car now leaves into open road. Today it drives behind the two buttons on your laptop.
   - Skip / Replay move to the top right, out of the car's path and out from under the cookie banner.
   - On a slow line the name is up by about 6.5 s at the latest. Today it takes 10 to 30 s.
   - On an upright phone, a portrait cut that follows the car through the headlight sweep.
2. **The ask plate, right under the hero.** One plate made of the plugin itself: brushed charcoal, brass trim, screws
   each turned differently, the stitched oxblood strap.
   - Before launch it asks one honest thing: "Email me at launch". That means one email when the trial opens, and you
     join our list. A Privacy link sits right there.
   - There is no BUY NOW until Paddle has a price. The plate says "Own it · price at launch" and shows the true formats:
     Mac VST3 · AU · Windows VST3 · no Pro Tools yet.
   - The day the trial opens, one switch in the data file turns this into the trial form, and the hero key becomes
     "Start your free trial".
3. **The dash.** The real face, live, as now. "Take it for a drive" now lands the face centred, and the lamps cough on
   as it arrives.
   - On a laptop the console sits beside the face, not under it, and is made of the plugin's own parts: an
     ORIGINAL | WIDE BEAM bat switch (the before/after), a MONO CHECK cap, PRESET ‹ name ›, VOLUME and the rear-view
     mirror's stereo picture.
   - Start the engine stays brass, with a green pilot lamp when it runs. It never turns red.
   - On a first visit the trip LCD coaches: DRAG WIDTH UP, then NOW PRESS MONO, then POWER OFF = ORIGINAL.
   - The music starts the first time the visitor touches the demo (a knob, a key, Start, "Take it for a drive"). It
     never starts on the cookie banner, Tab, Skip or a form.
   - With licensed material approved, it plays real music clips with real width.
4. **The glove box**, moved up right under the dash. The 16 presets are owner's cards in an open glove box. A card
   glides the knobs one short scroll away, and the console's PRESET ‹ › steps through them without leaving the dash.
   Today trying a preset is a 9,500 px round trip.
5. **The stereo road.** The same scroll story, seen through the plugin's own road window with its real panel meter
   (not the drawn gauge the plugin itself rejected).
   - Every claim is fixed: CRUISE is a switch, TRACTION is named, MONO and SIDE are described truthfully, and WIDTH
     opens at 136.
   - It reads on a phone. Today a phone hides each step while it is lit.
6. **NEW: the Owner's Manual (the tutorial place).** A screen in the plugin's plate, with the oxblood strap and the
   RevAudio badge under it and six chapters beside it.
   - Until the film exists it says honestly "MANUAL · BEING FILMED. It plays right here when it's ready", and each
     chapter takes the visitor to that control on the page.
   - Once the film is ready, one data field turns it into a click-to-load YouTube player. Nothing downloads before the
     tap, and it has captions and a transcript.
   - The plugin's own MANUAL button can open /widebeam/#manual straight onto it.
7. **The closer, "Runs on your setup."** It replaces the blue spec wall and the second form.
   - The plugin's two real headlamps. They follow your WIDTH and go to full beam when an email is accepted.
   - MAC / WIN rows and one odometer that rolls.
   - Folds: Runs on · After 30 days? · Licence · Where it stops · Specs (the trip-computer table, printed on the owner's
     card).
   - The same single ask as the plate.
8. **The parts that are always there.** The SOUND key never covers a link, the cookie banner or the iPhone's home bar.
   On phones it is a round 44 px key, and a slim bar at the bottom carries the ask ("Email me at launch ▸") once the
   plate has scrolled away. DRIFT's ask was on screen 15 % of the time before its bar and 91 % after.

## What is broken today (the plan fixes all of it)

I re-ran most of this on the page myself (`team/lead/verify.cjs`); the rest comes from the designers' own runs. The full
list with repros is Part 2, section 7.

- 🔴 **Claims the plugin can't back.**
  - The plate sells a free trial with getting-started emails and a trial-ends heads-up.
  - BUY NOW says "Start the free trial now and it rolls straight into the full version".
  - AAX appears twice, and CRUISE says "Always on".
  - The email field tells screen readers "we send the WIDE BEAM download link here".
  - The trial form's address goes into a log nobody mails. The launch form then answers "already on the list", so a
    visitor who uses both forms is on no list (the copy designer ran the worker's own code with a fake store).
- **"Take it for a drive" lands on an empty screen with the music on.** On your laptop the face is 0 % visible after the
  click.
- **The music starts on the wrong things:** Tab, cookie Decline, Skip intro and BUY NOW.
- **The letter keys work everywhere.** H / M / S / P flip the dash from anywhere on the page. Holding H flashes the whole
  screen about 14 times a second (12 flashes in 0.85 s).
- **A preset glide overshoots:** WIDTH goes to -10 % and 214 %, and the LCD shows it.
- **The hero on your laptop:** the car drives off behind the buttons (vanishing point y 430, buttons 394-458), Skip intro
  sits under the cookie banner, and the wordmark's shadow is wiped.
- **Without JavaScript, or if the script fails,** 9 blocks and the hero title stay invisible, and the odometers read 0.
- **The SOUND pill covers the footer's X and Facebook links.**
- **Phones:**
  - A scroll swipe that starts on a knob turns the knob.
  - Sideways, the dash the page asked you to turn the phone for doesn't fit (418 px tall in a 390 px screen).
  - The cookie banner held sideways is 625 px tall in that 390 px screen. That is site-wide, and /drift has it too.
- **The page is in the public sitemap while it says noindex** (seen in today's `dist/sitemap-0.xml`).

## Your picks

**Visual: one pick page at 1141x636 and 390x844, the options side by side, the controls on it**

| # | Question | My pick | Why |
|---|---|---|---|
| D1 | The hero after the car leaves | **B, the readings**: lockup, one line, ONE shining key "Take it for a drive" (it becomes "Start your free trial" at launch), "Open the road." | DESIGN.md §7, the hero you signed off on GAS 2. Measured: anything more lands on the car at your size. |
| D2 | The hero line | **"WIDE ON HEADPHONES. SOLID IN MONO."** | It names a widener buyer's fear (mono collapse) and the plugin backs every word. |
| D3 | The WIDE BEAM lockup | **B, the plate's satin brass**, raised letters, the sans sub-line between brass rules | It is the plugin's own brass, crisp at every size, and still opens with WIDTH. |
| D4 | What the page is made of | **C**: every plate, the story window and the spec card cut from the plugin's photo; labels in the plate's engraved serif small caps; Bebas headlines | DRIFT's bar is "cut from the plugin's own assets, in its own world". 0 credits. |
| D5 | The dash on a laptop | **A**: the console as a column beside the face, made of the plugin's own parts | Knob, sound and proof on one screen at 1141x636, like DRIFT's #hear. |
| D6 | The tutorial's frame | **A, the Owner's Manual** plate + strap, chapters on owner's-card stock | One world, free. The road window already belongs to the story. |
| D7 | The dash on a phone | **B**: the face as the live display, big controls under it | DESIGN.md §7: rebuilt for portrait, not shrunk (5-8 px LCDs today). ~1 day, +1.1 MB only when it nears. |
| D8 | The intro on an upright phone | **B**: a free portrait pan-crop that follows the car | Today the headlight sweep happens off-screen. A new AI clip only if B looks soft on your phone. |

**Plain choices**

| # | Question | My pick | Why |
|---|---|---|---|
| D9 | Before launch, what the page asks | **One ask: the launch email.** No BUY button, no trial words. | Every word is true today, and launch is one switch. |
| D10 | Price and Black Friday (**decide by Nov 22**) | **"Price at launch"**, and WIDE BEAM out of the bundle unless a Paddle price and a signed build exist by Nov 22 | Today the strip says "50 % OFF EVERYTHING" over a page that can't sell. |
| D11 | When the music starts | **The first act on the demo** (knob, console key, Start, "Take it for a drive"). Never cookies, Tab, Skip or forms. | It keeps Gil's "it just plays" and drops every accidental start. |
| D12 | What the demo plays | **3-4 real licensed clips** through the live chain | The synth loop is almost mono (correlation 0.98), so WIDTH barely shows. Needs material from the team. |
| D13 | Who makes the tutorial and where it lives | **A partner records WideBeam in a DAW in their own voice**, with real captions, on YouTube **Unlisted** until launch | Free and honest. The voice-over also covers WCAG audio description. |
| D14 | The plugin's MANUAL button | **Point it at /widebeam/#manual** (one line for Ilay before the release build) | It is baked into every shipped copy. |
| D15 | Trust lines by the price | **"No iLok · key by email · 2 computers · 14-day refund"** once buyable, **plus a "Where it stops" fold** now | A published limit is the strongest proof a brand with no reviews has. |

## Choices I made (say no to any)

- **Page order:** the glove box moves right under the dash. The demo designer wins over the motion designer: comparing
  presets is a 9,500 px round trip today.
- **The hero holds only the four parts.** No email row and no second key in it. The ask sits in the plate under the hero
  and in the phone bar.
- **The car's exit is cleared by at least 40 px** at 1141x636 and 1280x665, with the lockup about 15 % smaller on screens
  under 700 px tall.
- **The car's last moment (the hand-off):** the bar lamps turn into points with a short dissolve. That removes today's
  ghost car. A cut-out car driving on stays a later option, because a sharp cut-out over soft film reads as pasted on.
- **Left out of this round:** headlight beams lit on the hero road (no one would see them react) and the road "spine"
  between sections.
- **Story steps that are not lit dim to 75 %**, not 28 %. That passes contrast.
- **Small grey print is lifted** to pass AA, with a 13 px floor on phones. Card hover lifts 1 px.
- **One shared ask everywhere:** the hero key, the plate, the phone bar, the line under the manual and the closer read
  one phase from the data file.
- **The closer keeps one rolling odometer** in view. Only the trip-computer table folds away.
- **The closer's lamps:** steady, following WIDTH, full beam on a sign-up, and no page flash.
- **ORIGINAL | WIDE BEAM switches the live chain**, and the page says plainly that it is a browser sketch. The film is
  where the real plugin is heard.
- **The cookie banner held sideways gets a layout fix,** layout only and site-wide, in its own commit for you to see.
  Yoni's text is untouched.
- **The social card** is the lit dash plus the lockup, not the intro's last frame (that frame is nearly black).

## What other people owe (outside this build)

- **Gil:** the Paddle price id (D10) and `DL_PLUGINS.widebeam` on the licence worker (that opens the trial).
  `OFFER_PLUGINS.widebeam` in the worker too: today the plugin's own "10 % OFF" strip sends people to the home page
  with no code.
- **Ilay:** MANUAL_URL to `/widebeam/#manual` (D14). Plugin renders for the demo clips if D12 B uses team material.
- **A partner:** the manual recording (D13).
- **Someone with Cloudflare dashboard access:** add `widebeam/` to the long-cache rule.
- **The launch-day checklist** is in Part 2, section 6.

## Not checked yet

A real iPhone (safe areas, sticky hover, the silent switch, VoiceOver turning a knob, the keyboard over the form), your
own Safari at 115 %, Firefox, Windows, the sound by ear, and the deployed worker (only its source was run).

**NEXT:** make the 8 visual picks on the pick page, and answer D9-D15. D10 (price and Black Friday) has to be answered
by Nov 22.

---

# Part 2 · Build detail for the team

## 0. Before any lane (main session)

1. **Merge `origin/main` into `feat/widebeam-page`.** Work in a temporary worktree, check `git merge-tree` first, then
   merge, never rebase (guidelines-20). Expect a conflict only in `tasks/handoff.md`. Re-check that `/widebeam` is still
   excluded in `WelcomeDiscountPopup.astro` / `ExitIntentPopup.astro` after the home-garage commits land.
2. **Baselines.** Run `npm run build`. Then take section screenshots at 1141x636, 1280x665, 1440x900, 1728x1000,
   390x844, 360x740 and 844x390, in Chrome (`channel:'chrome'`) and WebKit, with reduced motion and with the canvas and
   video masked, into `team/gates/baseline/`. Also run `scratchpad/wb-verify.cjs` (today's 9 checks) in both engines.
3. **The pick page (D1-D8).** One agent, about half a day, in the scratchpad only, 0 credits.
   - Reuse what exists: `team/lead/shots/hero-1141.png` (D1-A), `team/hero/r2/mock-B-four-part-short-*.png` (D1-B,
     with D2's three lines set in place), `team/art/shots/lockup-options.png` (D3), and
     `team/video/mock/mock.html?d=a|b|c` (D6). Before Dan sees D6, fix its stand-by line (video-d03): it promises the
     manual by email.
   - Mock what's missing: a plate cut from `face-base.webp` against today's CSS card (D4); the console column against
     the strip against today (D5); the phone deck (D7); a 5 s portrait pan-crop of `public/widebeam/intro-1080.mp4`
     made with ffmpeg (D8).
   - Publish it as a private page with the choice controls on it (the `review-bench` pattern).
4. **Collect D9-D15.** D10 has a deadline (Nov 22). Then start the lanes.

## 1. The contract every lane builds on (made by lane F)

**`src/data/widebeam.ts`: one phase drives every ask** (the drift.ts / revfx.ts pattern)

```ts
phase: 'preopen' | 'open' | 'released'   // preopen now
trialDays 30 · priceUsd null · paddlePriceId null · gateWired false · gateId 'widebeam'
aaxReady false (README: PACE wcguid not created) · winReady true (README: Windows x64 VST3; confirm at go-live) · listed false
heroLine / signature (D2) · STEPS · SPECS · FOLDS (Runs on, After 30 days?, Licence, Where it stops, Specs) · ODOMETER
manual { title, youtubeId|null, src|null, length|null, poster|null, chapters[{label, step, at|null}], transcript|null }
formatsMac() · formatsWin() · formatsLine() · compatRows()      // every format string reads aaxReady / winReady
askFor(phase) -> { label, key, micro, consent, ok, already, source, registerUrl, sticky, manualLine, closerTitle }
buyable() · assertWidebeamConfig()
```

**Pre-open words.** These are defaults. The copy lens owns the final wording; the honesty rule is fixed.

| Part | Words |
|---|---|
| Label | "Get the 30-day trial the day it opens" |
| Key | "Email me at launch ▸" |
| Micro | "Full version · no credit card" |
| Consent | "One email when the trial opens. You join our list · unsubscribe anytime · Privacy" (link) |
| OK | "You're on the list. We email you the day the trial opens." |
| Already | "You're already on the list. We email you the day the trial opens." |
| Source | `widebeam-notify`. The list relay is reached and nothing is swallowed (copy-01). |
| Buy side | "Own it" / "Price at launch" + `formatsLine()`. No button. |

**Open and released.** In `open`, the trial words come back, the getting-started and trial-end line comes back (true
only once the worker's WIDE BEAM drip runs), and `registerUrl` is used. `released` adds "Buy WIDE BEAM · $X" and the
trust strip (D15).

**What `assertWidebeamConfig()` fails the build on:**
- `open` without `gateWired`;
- `released` without `buyable()`;
- `listed` before `released`;
- a `widebeam` entry in `plugins.ts` while `/widebeam` is not excluded from `[slug].astro` (guidelines-12, d02).

The go-live list sits in the header comment (section 6 below).

**Data attributes:** each lane adds them in its own components; the readers own the code that reads them.

| Attribute | Means | Read by |
|---|---|---|
| `data-wb-demo` | an act on it may start the sound (allow-list) | D `sound.ts` |
| `data-wb-manual` | never starts sound; the page keys ignore it; play stops the engine | D `sound.ts`, `keys.ts` |
| `data-wb-cta` | an ask zone; the phone bar steps away | A `furniture.ts` |
| `data-wb-watch` | the SOUND key and the cart FAB step aside over it | A `furniture.ts` |
| `data-reveal="fade"` | the house reveal (replaces `data-wb-reveal`) | `src/lib/reveal.ts` (house) |

**Module APIs** (F creates them with today's behaviour; the owner lane refines them):

| Module | API | Owner |
|---|---|---|
| `drive-to.ts` | `driveTo(target, { align: 'face' \| 'top', onArrive })`: a number for Lenis (the init.ts:205 maths); duration .7 s + .1 s per 1000 px, capped at 1.2 s; instant under reduced motion | D |
| `sound.ts` | `requestSound(srcEl)`, `stopForFilm()`, `isPlaying()`, `onChange(fn)` | D |
| `face.ts` | `loadPreset(i, { afterArrive })`, `presetName()`, `whenArtReady()` | D |
| `audio.ts` | `engine.setVolume(db)`, `engine.setSource(...)` | D |
| `furniture.ts` | `watch(el)`, `ctaZone(el)`, a `--wb-lift` CSS var stack | A |

**File split (F creates; each lane then owns its own):**
- **Components:** `src/components/widebeam/` holds `WbHero`, `WbGet`, `WbDrive`, `WbConsole`, `WbGlove`, `WbStory`,
  `WbManual`, `WbCloser`, `WbStickyBar` and `WbSound`.
- **Styles:** `src/styles/widebeam/` holds `base`, `parts`, `hero`, `get`, `drive`, `glove`, `story`, `manual`, `closer`
  and `furniture`. Each `.css` carries its own phone and reduced-motion rules; `widebeam.css` becomes an index of
  `@import`s.
- **Scripts:** `src/lib/widebeam/` gains `hero`, `keys`, `sound`, `drive-to`, `presets`, `manual`, `capture`,
  `furniture` and `odometer` (`.ts`); `init.ts` becomes a thin boot.
- **Rules for every class:** every class carries the `wb-` prefix plus its section (lessons 2026-10-22, 2026-11-09).
  Grep for a name before adding it. Hover rules sit only under `@media (hover:hover) and (pointer:fine)` (mobile-d02).
- **The shell never changes after F.** F places every section in its final order: hero · plate · dash · glove box ·
  story · manual · closer · phone bar.
  - New parts start as moves of today's markup: `WbConsole` holds today's console; `WbCloser` holds today's specs +
    launch list until A rebuilds it. So the page works at every step.
  - `WbManual` and `WbStickyBar` start as empty stubs.
  - F also puts the contract attributes on every element that exists today (`data-wb-demo` on the hero key, the play
    key, the SOUND pill and the preset cards; `data-wb-cta` on the hero column, the plate and the closer).

## 2. Lanes

The order: **Step 0 (main)**, then **F alone**, then **H, D, S, A and T in parallel**, then the gates (main). No lane
runs `npm run build`, commits or pushes. The main session commits each lane by exact pathspec. Separate worktrees per
lane, cut from the F commit, each with its own dev server port, avoid hot-reload churn during the lanes' own browser
checks. The files are disjoint, so the lanes merge clean.

**Every lane, every change:**
- check 1141x636 first, then the other sizes;
- reach a spot with `mouse.wheel`, never a native `scrollIntoView` (Lenis goes stale);
- re-run `wb-verify.cjs` plus `team/demo/gestures.cjs` and `touch.cjs` in Chrome and WebKit after touching `face.ts`,
  `keys.ts` or `sound.ts`;
- report the exact files changed.

### Lane F · Foundation: data, structure, page tokens, parts kit (Opus, high; first and alone)

Owns: `src/data/widebeam.ts`, `src/pages/widebeam.astro` (it becomes a shell), it creates every
`src/components/widebeam/*`, `src/styles/widebeam.css` + `src/styles/widebeam/{base,parts}.css`,
`src/lib/widebeam/init.ts` (boot), `src/assets/widebeam/parts/*`, `tools/widebeam-parts/cut.*`, `astro.config.mjs` (the
NOINDEX line), `src/pages/[slug].astro` (an OWN_ROUTE guard, only if one is needed).

1. **F.1 Split with no visual change.** Move the markup into the components, the CSS into the partials and the script
   into the modules, in today's order. Gate: pixel-identical sections (masked) against the Step 0 baseline, and
   `wb-verify.cjs` 9/9 in both engines. Then reorder the shell (the glove box under the dash) and add the stubs, as a
   second commit.
2. **F.2 Data and honesty (the blockers first):**
   - the phase model and `askFor`; the plate reads it; no BUY button pre-open; a correct BUY note when buyable;
   - the field is named by its `<label>` only, and the phase words tie to it with `aria-describedby` (copy-d01);
   - the launch-list promise is fixed (copy-06);
   - the formats come from the flags (guidelines-02, copy-03);
   - STEPS + SPECS fixed: CRUISE is a switch, on by default, -2 dB at WIDTH 200; a TRACTION row; SIDE solos the stereo
     side; MONO / SIDE are checks the DAW can't automate and a preset switches off; WIDTH opens at 136;
     "6 dB more side at full beam" (guidelines-03, copy-04/05/14/15);
   - the head copy (copy-13 "Every knob works. Go wide."), the demo disclaimer (copy-12), the idle line (copy-21), the
     "nothing is uploaded" line (copy-d03), the touch wording (mobile-11);
   - the fold copy (copy-08, copy-22 per D15) and the hero line options (copy-10 per D2);
   - `assertWidebeamConfig` and the go-live list (guidelines-12, d02, d03).
3. **F.3 Page tokens:**
   - `--ivory-3` to about `#9c927f`, so it passes AA on the plate steel (art-18, a11y-10); a 13 px phone floor
     (mobile-10);
   - one spacing token between sections (art-16); one-line heads at clamp(2.2rem, 3.6vw, 3.2rem) (art-14);
   - no text glow without a lamp (art-15); status colours `--emerald` / `--oxide-text` (art-19);
   - kickers per D4 (art-21), with the late `h3` override removed;
   - `--wb-lcd` = `'Courier New'` with a bundled Courier Prime subset, `--wb-read` = `--font-mono`, VT323 off all
     readable text (art-07, Law 5);
   - `@font-face 'WB Serif'`: `local('Georgia')` first, then a Gelasio subset, A-Z 0-9 · (hero-d02);
   - a page-level `html.hc .wb-page` token block (a11y-d02).
4. **F.4 House reveal.** `data-reveal="fade"` replaces `data-wb-reveal`, with the opacity-only pre-hide under
   `html.motion-ok` and the 2.5 s force reveal (motion-06/07, a11y-05). The real numbers go in the HTML.
5. **F.5 Parts kit (perf-d01, art-01).**
   - A free script cuts the parts from the 3072 px `face-base.webp` at 2x, WebP q80, into `src/assets/widebeam/parts/`:
     corners, a brushed field tile, trim, the stitched strap, the badge (plate set ~37 KB), lamp L/R (~75 KB), the road
     window (~37 KB), the panel meter (~12 KB), the MONO cap.
   - `.wb-plate` is a 9-sliced part in `parts.css`.
   - No CSS anywhere points at `face-base.webp`.
6. **F.6 Sitemap.** Add `'/widebeam/'` to `NOINDEX` in `astro.config.mjs` until launch (guidelines-d01).
   `/drift/feedback/` has the same leak: noted, left alone.

### Lane H · Hero + intro (Opus, high; after F)

Owns: `WbHero.astro`, `styles/widebeam/hero.css`, `lib/widebeam/{intro,night,hero}.ts`, `src/assets/widebeam/intro-*`,
`public/widebeam/intro-*.mp4` (the portrait cut, D8), `public/og/widebeam.png`. Consumes: `driveTo` (the hero key),
`data-wb-demo` on the key, `askFor().key` for the open phase.

1. **H.1 Bugs:**
   - **One intro rule** in `intro.ts`:
     - A video that is not playing 2.5 s after `start()` bails to the road.
     - The title comes at video 5 s, or 6.5 s after `play()`, whichever is first.
     - A hidden tab waits for `visibilitychange`.
     - An error on the last `<source>` hides Replay.
     - A bail drops the sources and calls `load()`; Replay restores them.
     - A hash aimed below the hero skips the intro and its download.
     - On a laptop with `downlink < 3`, the 720 file.
     - Findings: hero-04/12/13, perf-03/06/08, video-12.
   - **A CSS-only failsafe** shows the title at 8.5 s if no script ran (hero-d01).
   - **Skip / Replay** move to the hero's top right and sit inside the safe area; focus goes to the h1 after Skip and to
     Skip after Replay (hero-d03, hero-02, hero-10).
   - **The wordmark filter** is tweened to its full string, or `clearProps` is used, so the shadow and the WIDTH glow
     come back (hero-01).
   - **The hero's min-height** subtracts `--sale-h` (hero-14).
2. **H.2 The readings (D1, D2, D3):**
   - the lockup in satin brass (art-06), the outcome line, ONE brass shine key and the signature;
   - the lede and "How it works" go; the hero key gets `data-wb-demo` and calls `driveTo('#wb-drive', {align:'face'})`;
   - at `open` the trial key takes the shine and the drive becomes a small link in the same slot (guidelines-06,
     hero-06/07, copy-10, copy-11 is rejected);
   - the column's bottom sits ≥ 40 px above the computed vanishing point at 1141x636 and 1280x665, with the lockup
     about 15 % smaller under 700 px of height (art-03, hero-03, motion-04, art-d02);
   - the road feathers into the page (art-04); no parallax on the text (motion-14); forced colours fixed (art-d04).
3. **H.3 The hand-off:** the canvas lamps start as the video's bars and become points, with a ~0.3 s dissolve. One mover
   (motion-05, option C).
4. **H.4 Phones:**
   - the portrait pan-crop, with `night.ts` `cover()` kept in step (D8, hero-09);
   - the lockup across the full column width (art-22) and the sub line at 12 px or more (hero-15);
   - a sideways branch for `(orientation: landscape) and (max-height: 500px)`: tighter padding, and the key on screen
     (mobile-13).
5. **H.5 (last):** `og/widebeam.png` 1200x630, the lit dash plus the lockup, 0 credits (art-d03, guidelines-16,
   copy-19). JSON-LD and the meta description wait for launch.

### Lane D · The dash: face, engine, keys, console, phone deck (Opus, max; after F; the critical path)

Owns: `WbDrive.astro`, `WbConsole.astro`, `WbDeck.astro` (D7), `styles/widebeam/drive.css`,
`lib/widebeam/{face,audio,state,keys,sound,drive-to,console,deck,snap}.ts`, `src/assets/widebeam/face-still.webp` and
the size tiers, `public/widebeam/clips/*` (D12). May run as two agents in sequence on the same files (D.1-D.2, then
D.3-D.5).

1. **D.1 Behaviour:**
   - **Music start allow-list** (D11):
     - sound starts only from `[data-wb-demo]` acts: a pointer on a dash or console control; Enter / Space / an arrow on
       a focused dash control; Start; SOUND; "Take it for a drive"; a preset card;
     - never on Tab, the cookie banner, a form, Skip / Replay, the nav, the cart or `[data-wb-manual]`;
     - no AudioContext and no probe at load; "Sound on" is announced;
     - `stopForFilm()` stops the engine and nothing restarts it by itself.
     - Findings: demo-08, a11y-01/16, perf-05, mobile-07, hero-11, copy-17, guidelines-09, video-03.
   - **Keys:**
     - they act only while focus is inside `#wb-drive` (the dash and the console);
     - inputs, `iframe`, `video` and `[data-wb-manual]` are skipped, and `e.repeat` is ignored;
     - each change is announced;
     - the HIGH BEAM flash fires at most once a second: off under reduced motion and `html.hc`, and `will-change:
       opacity` from load;
     - findings: demo-01, a11y-03/04, motion-02/15, video-04.
   - **Knob input:**
     - every glided and set value is clamped, and an end stop lands without overshoot (motion-01);
     - touch: `pan-y` plus a direction lock (hold until 8 px; vertical on an unpicked knob lets the page scroll;
       horizontal turns it; a tapped knob also takes vertical) (demo-02, mobile-05/d03);
     - one key map for all five sliders (arrows ±1, PageUp/PageDown ±8, Home/End, `preventDefault` only for those);
       ~0.03 of the range per wheel notch with `deltaMode` handled; ~200 CSS px for the full range at every size;
       reading order inside `role=group` (demo-10/11/13, a11y-06/15);
     - 44 px invisible hits, with the preset LCD halves stepping, and a note on SAVE (demo-09, a11y-14);
     - a counter-scaled outline focus ring that forced colours can paint (a11y-13, a11y-d01);
     - the announcer builds from what changed (a11y-07);
     - the rAF loops are gated to on-screen (a11y-17).
   - **The arrival as one sequence:**
     - one face-art loader: no head preload; it starts at the first of the intro hand-off + idle, the dash within
       1.5 screens, an intent click, or 8 s (perf-01, hero-05, guidelines-15);
     - a size tier per part from that part's rendered size × DPR; Dan's 115 % laptop gets the full art (perf-02,
       art-d01);
     - `decode()`, then all strips swapped in one frame over a dark default-state still (perf-04);
     - the face stays dark until ignition, and the lamps cough only after decode and landing (motion-03);
     - the rise plays once (rotateX + y, opacity 1, no scale), not as a scrub (motion-10, motion-d02);
     - `driveTo` lands the face centred and the preset glide runs on arrival (motion-09, motion-d01).
   - **Sideways fit:** `(min-width: 901px), (orientation: landscape) and (max-height: 600px)` sizes the face by height.
     The "turn sideways" line shows only when that is true (guidelines-08, demo-07, mobile-06).
2. **D.2 Console (D5):**
   - a column at ≥ 1100 px, beside the face (demo-06);
   - ORIGINAL | WIDE BEAM on the plugin's bat-switch strip bound to POWER, and MONO CHECK on the cut cap (demo-03; the
     look per art's Law 7 objection);
   - PRESET ‹ name › with 44 px keys (demo-d01);
   - VOLUME as a fader (DESIGN.md §9), an own file RMS-normalised to the loop, the loop lifted ~6 dB, and a limiter
     after the master on both sides of the A/B (demo-d02);
   - the mirror as a chrome housing (art-12);
   - the engine key brass with an emerald pilot lamp, turning once, never red (art-11, guidelines-11, motion-18);
   - the coach on the trip LCD and a breathing lamp on the next control, static under reduced motion and `html.hc`,
     with a polite live region (demo-05);
   - CORR smoothing with τ 300 ms (demo-18), a beam shelf so HIGH BEAM leans ≤ 2 dB like the plugin (demo-14), the own
     track resumes and a cancelled chooser re-arms (demo-16), `navigator.audioSession` set to 'playback' with a device
     check owed (demo-17);
   - EQ bars on `transform` (motion-18); the dash LCDs in the plugin's face (art-07); the "Factory Cruise" note
     (copy-18); console padding on phones (demo-15).
3. **D.3 (once D12's clips exist):** a track picker; one file per clip, ≤ 0.4 MB each, fetched on the pick, with URLs
   versioned through a Vite `?url` import (demo-04, perf-d02).
4. **D.4 (if D7 = B):** the phone deck.
   - It drives the same store, and the face above stays live but `inert`.
   - Native `<input type=range>` controls skinned with the plugin's strips, with the plugin's own LCD face for the
     readout.
   - It sits on `.wb-plate`, and the full strips load only when the deck nears.
   - Findings: mobile-04, a11y-d03.
5. **D.5 (late):** a WIDE BEAM copy of DRIFT's soft snap for the dash only, never pulling against the visitor (lessons
   2026-10-14) (motion-17).

### Lane S · Glove box, stereo road, Owner's Manual (Opus, high; after F)

Owns: `WbGlove.astro`, `WbStory.astro`, `WbManual.astro`, `styles/widebeam/{glove,story,manual}.css`,
`lib/widebeam/{presets,story,manual}.ts`, `src/assets/widebeam/manual-*`. Consumes: `driveTo`, `face.loadPreset`,
`sound.stopForFilm`, `askFor().manualLine`.

1. **S.1 The Owner's Manual, stand-by first** (Dan's ask; video-01, guidelines-04, copy-07, art-20):
   - `#manual` sits after the story and before the closer, with the frame per D6;
   - glass at about 600x338, so the title, frame and strap fit 1141x636 (video-d02);
   - the stand-by words as in Part 1, with no play icon, length, poster, date or email promise;
   - the chapters are `<a href="#wb-step-0N">` links (they work without JS); with JS they `driveTo` the middle of
     that step's own trigger range (video-08, a11y R2, motion R2);
   - the frame carries `data-wb-manual` and `data-wb-watch`;
   - the house facade code path is ready behind `manual.youtubeId`: our own poster through `getImage` (lazy, ≤ 30 KB at
     1x), a `<button>` labelled with the length, `youtube-nocookie ?autoplay=1&rel=0&cc_load_policy=1&cc_lang_pref=en`,
     no `playsinline`, focus moved into the iframe, chapters reloading with `&start=N`, and a `<details>` transcript;
   - on play, `stopForFilm()`; the trial line under the frame comes from the phase;
   - a `gtag` `video_start` only if consent gave `gtag`;
   - a self-hosted ≤ 90 s cut path with `preload=none`, `<track>` and the DriftVideoGate end card;
   - findings: video-02/05/06/07/09/10/11/13, video-d05, a11y-19, perf-09, mobile-12.
2. **S.2 The story:**
   - on a phone in portrait, each step gets the free height under the stage, centred, with the trigger at the stage's
     bottom edge;
   - sideways, the two-column layout;
   - the stage at most 45 svh and the bezel at most 8 px on phones (mobile-02, mobile R2);
   - under reduced motion it draws once per step change; otherwise the drawn parameters ease across step edges
     (motion-08/16, a11y-09);
   - unlit steps at 75 %, LEVEL readable (a11y-10).
3. **S.3 The glove box,** moved under the dash (demo-d01):
   - an open compartment in the plate's materials, the cards on owner's-card stock, the picked card in the plugin's
     `#2894fa` 25 % band (art-10);
   - hover a 1 px lift in 120 ms, the light changing and not the print, only on a real pointer (motion-12, mobile-d02);
   - `aria-pressed` on the cards; after the glide, focus goes to the face's preset control with `preventScroll`
     (a11y-08);
   - a click calls `driveTo` and then `loadPreset` on arrival.
4. **S.4 The road window** (art-02, D4):
   - the plugin's road-window bezel and its trip LCD;
   - the sources over the plugin's night-road picture;
   - the real panel meter cut from the face, with its needle on top.

### Lane A · Ask surfaces and furniture: plate, closer, phone bar, SOUND key, cookie banner (Opus, high; after F)

Owns: `WbGet.astro`, `WbCloser.astro` (it replaces specs + notify), `WbStickyBar.astro`, `WbSound.astro`,
`styles/widebeam/{get,closer,furniture}.css`, `lib/widebeam/{capture,furniture,odometer}.ts`,
`src/components/CookieBanner.astro` (sideways layout only, its own commit), `src/data/sale.ts` (one line, after D10).

1. **A.1 Capture:**
   - one contract for the plate, the closer, the phone bar and the manual line, all from `askFor(phase)`;
   - a sign-up shows the done state on every surface, and the bar leaves;
   - `aria-invalid` and `aria-describedby` on errors (a11y-18);
   - the Privacy link (guidelines-17);
   - StartTrial and gtag wired, but firing only when `gateWired` is true, `/download/register` answered ok and consent
     was given; nothing fires pre-open (guidelines-14);
   - the plate cut from `.wb-plate` (art-01).
2. **A.2 Furniture** (the bottom edge has one owner):
   - one stack, in order: the cookie banner's measured height, the phone bar, the safe-area inset;
   - the SOUND key and the cart FAB ride on that stack, and step aside over `[data-wb-watch]` and the footer (Skip /
     Replay leave the bottom edge: lane H moves them to the hero's top right);
   - the SOUND key is never hidden while sound plays (a11y R2);
   - `scroll-padding-bottom` equals the stack, so a focused control clears it;
   - an empty cart's FAB slides off the edge;
   - the SOUND key's name is its visible text, with `aria-pressed`; on phones it is a 44 px round key;
   - findings: guidelines-10, mobile-01/08/09/d01, hero-02, a11y-02/11/20, demo-12/15, video-d01.
3. **A.3 The phone bar** at ≤ 900 px, on DriftStickyBar's mechanics (guidelines-05, mobile-03):
   - `askFor().sticky`;
   - away beside `[data-wb-cta]` (the hero, plate and closer), the manual frame and the footer;
   - hidden while the cookie banner is up; it lifts the FAB.
4. **A.4 The closer** (guidelines-07/18, copy-08/09/16/22, art-08/09/13, motion-11/13, a11y-12):
   - "Runs on your setup." with `compatRows()`;
   - the folds: Runs on, After 30 days?, Licence, Where it stops (D15), and Specs (the trip table on owner's-card
     stock);
   - one odometer: the real values in the HTML, plus aria-hidden drums that roll once;
   - the lamps cut from the parts kit, dipped, steady, following `--wb-w` and HIGH BEAM, going to full beam with the
     halogen lag on an accepted email, with no page flash;
   - the same ask; the trust strip only when buyable.
5. **A.5** `CookieBanner.astro`: a `(max-height: 500px)` branch with the slim sheet. Layout only; its own commit, shown
   to Dan as a site-wide change (hero-08, mobile-14).
6. **A.6** `sale.ts` per D10: WIDE BEAM out of the bundle, or spelled "WIDE BEAM" if it stays (guidelines-19, copy-20,
   hero-14).

### Lane T · Tests and gate scripts (Sonnet, high; after F, written in parallel, run last)

Owns: `tests/widebeam.spec.ts` (new), `tests/smoke.spec.ts` (`/widebeam` added), `team/gates/*.cjs` (scratchpad).

- Run against the dev server through a scratch Playwright config (baseURL `http://127.0.0.1:4392`, no webServer), so no
  lane builds. The main session runs the house config, which builds.
- The worker and analytics are stubbed in every context.
- It turns every gate in section 4 into a script. It covers guidelines-13, plus a regression guard for every bug in the
  bug list.

## 3. Disagreements and who wins

| Topic | Positions | Winner and why |
|---|---|---|
| Hero ask | guidelines R1: a trial key in the hero; hero R1: an email row; copy: a second key or link; art / hero R2 / mobile / guidelines R2: four parts only | **Four parts, one phase-driven shine key.** §7 says "nothing else". Measured: a fifth element lands on the car (hero mock C -50 px, art r2 "on the VP again"). A trial key pre-open sells a download that doesn't exist. |
| Vanishing-point margin | hero: ≥ 20 px; art / motion / guidelines / a11y: ≥ 40 px | **40 px (art).** The tail-light glow is ~18 px in radius at the hand-off, and real spacing left only 27 px. |
| Skip / Replay vs the banner | hero-02 / a11y-02: lift them by the banner's height; hero-d03: move them | **Move them to the top right (hero-d03).** Lifted, Skip lands on the vanishing point (417-452 vs 426). |
| Music start | guidelines: press only; hero: a deny-list; a11y: click/tap only; mobile: phones wait; copy: not in forms; video R2: explicit sound keys only; demo: an allow-list incl. knobs | **The allow-list including a knob touch (demo), for Dan as D11.** Start sits off-screen at 1141x636 while you turn a knob, so the knob is the play key. Video's worry is met by `stopForFilm`. |
| Where the tutorial goes | guidelines: right after the dash; video / copy / art / mobile: after the story | **After the story (video).** Two players back to back invite overlapping sound, and the story raises the question the film answers. |
| Tutorial frame | art / copy: the road-window bezel; video R2: the plate + strap | **Plate + strap (video) in art's materials and type.** The road window belongs to the story right above it. Shown as D6. |
| Show the place before the film? | copy R1: render only with an id; everyone else: an honest stand-by | **Stand-by (copy agreed in R2).** Dan asked for the place, and the plugin's MANUAL link needs an anchor. No date, no email promise (copy's objection kept). |
| Chapter semantics | video: tabs; a11y: links, then buttons; motion: one scroll helper | **Links → `driveTo` → seek buttons** later. They work without JS and land on the step's own trigger. |
| Closer specs | guidelines-18: fold the odometer and the table; art / motion / copy: keep one odometer visible | **One odometer visible, table folded.** A mechanism has to be seen rolling; the page still loses ~1,000 px. |
| Closer lamps | art-13: lamps + page flash; motion / a11y: no page flash; guidelines: don't spend on the old card | **The lamps stay on the closer, no page flash, steady, no breathing.** |
| A/B keys | demo: `.rv-btn` keys; art: the plugin's own parts | **The plugin's parts (art).** Law 7, and §4 keeps "audio toys" out of the button family. The engine key stays brass `.rv-btn` (art agreed). |
| Demo audio | demo: real clips through the live chain; guidelines: the A/B must be the real plugin's bounces | **Live chain with real clips (D12 B), labelled as a browser sketch; the real plugin in the film.** A fixed bounce behind live knobs would make the knobs lie. Bounces remain D12 C. |
| Phone dash | mobile / art / demo / a11y: the deck with conditions; guidelines: fixes first, deck later | **Fixes now in D.1; the deck as D7 with every condition** (same store, inert face, native ranges, LCD face, lazy full strips, ≤ 2.7 MB). |
| Asset tiers | perf: by the face's width; art: per part | **Per part (art; perf agreed in R2).** Dan's 115 % Safari gets the full tier. |
| Presets placement | motion: keep the order and fix the glide; demo: move under the console + a stepper | **Move it, plus the stepper (demo).** Comparison is the job; DRIFT and GAS 2 keep the picker on the player. |
| Hand-off car | motion / hero: drive a cut-out; art: paste-up risk | **Bars → points dissolve now (motion's option C).** It fixes the measured two-lamps-at-once; a cut-out only if Dan asks. |
| Hero beams (art-05) and road spine (art-17) | art: ideas; hero / motion / perf / mobile: objections | **Deferred.** Not seen reacting; a second mover; furniture collisions on phones. |
| Card hover | motion R1 / mobile R2: 4-6 px; motion R2 / art: 1 px | **1 px (DESIGN.md §5).** Motion corrected itself. |
| Hiding the SOUND key | mobile-09 / guidelines-10: step aside or fade; a11y: never hidden while playing | **Moves, never hidden while sound plays (a11y).** It is the only stop control. |
| Contrast fix | art: swap to `--ivory-2` on plates; a11y: lift `--ivory-3` page-wide | **Lift the token (a11y; art agreed in R2).** |
| Social card source | guidelines / copy: the intro's last frame; art: it's near-black (luma 22.6/255) | **The lit dash + lockup (art).** |
| Load-time audio probe | perf: defer it to idle; demo / a11y: delete it | **Delete it.** Under D11 nothing autoplays, so the probe has no job. |
| Cookie banner sideways | hero: fix it here; mobile R1: flag only | **Fix it (layout only, its own commit, shown to Dan).** It is the whole first screen of every sideways visit. |

## 4. Gates: the proof of "no bugs" (main session; lane T writes the scripts)

- **G0 Static:**
  - `npm run build` green, and `assertWidebeamConfig()` passes for the shipped phase;
  - `dist/sitemap-0.xml` has no `/widebeam/`;
  - honesty greps on `dist/widebeam/index.html`: no "AAX" while `aaxReady` is false; no "Buy now" while not buyable; no
    "Notify me"; no trial-download promise pre-open; the email field's accessible name is "Your email".
- **G1 Isolation:**
  - F.1: pixel-identical sections (canvas and video masked, reduced motion) against the Step 0 baseline at 1141x636
    and 390x844, Chrome + WebKit;
  - after each lane, the sections it doesn't own are unchanged at the same sizes;
  - `wb-verify.cjs` 9/9 in both engines.
- **G2 Page spec** (`tests/widebeam.spec.ts`, chromium + mobile-safari) and smoke with `/widebeam`. No console or page
  errors.
- **G3 Music matrix** (Chrome + WebKit, a fresh context per case):
  - **never starts on:** Tab, cookie Accept and Decline, Skip, Replay, email-field focus and typing, a plate / closer /
    bar click, nav, cart, a footer link, a touch scroll over a knob, the tutorial play;
  - **starts on:** a knob drag, an arrow on a focused knob, a console key, Start, SOUND, "Take it for a drive", a preset
    card;
  - a tutorial play stops it.
- **G4 Keys:**
  - "m" at the hero does nothing; inside `#wb-drive` it toggles and announces;
  - holding H gives ≤ 1 flash per second;
  - End / Home on a focused knob go to max / min with no page scroll;
  - the wheel turns only a picked knob, by ≤ 5 % per notch.
- **G5 Demo:**
  - a preset glide keeps WIDTH in 0-200, FOCUS in 20-1000 and MIX / REACH in 0-100, and the LCD never shows out of
    range;
  - "Take it for a drive" leaves the face ≥ 95 % visible within 1.5 s at 1141x636, 1280x665, 1440x900 and 390x844,
    the lamps ignite after landing, and nothing moves 300 ms after arrival;
  - the A/B stays level-matched within 1 dB;
  - no clip, and a peak ≤ -0.3 dBFS at WIDTH 200 + TILT -100 + HIGH BEAM.
- **G6 Hero:**
  - the column bottom sits ≥ 40 px above the computed vanishing point at 1141x636 and 1280x665 (≥ 40 at 1440 and
    1728);
  - the title is up ≤ 6.5 s after `play()` on a 4 Mbit/s profile;
  - with `init.ts` blocked the h1 is visible by 9 s;
  - Skip / Replay hit-test to themselves with the banner up;
  - `/widebeam/#manual` lands on the section with no intro request.
- **G7 No-JS and reduced motion:** 0 blocks at opacity 0 and the real odometer numbers in the HTML; under reduced
  motion, an identical story-canvas hash over 1 s at rest, no flash and no intro.
- **G8 Furniture:**
  - at the page end every footer link hit-tests to itself at all 7 sizes;
  - the SOUND key is never under the cookie banner, the phone bar or the home bar (CDP safe-area override portrait
    59/34 and sideways 59/21);
  - no fixed part covers a focused field or key.
- **G9 Phone:**
  - after a real Decline tap, an ask visible on ≥ 80 % of 200 px scroll steps at 390x844 and 360x740 (DRIFT 91.7 %);
  - every story step lit and fully readable for ≥ 120 px of scroll at 390x844 and ≥ 60 px at 360x740;
  - at 844x390 the face fits under the nav, the hero key is on screen and the cookie banner fits the screen;
  - a CDP swipe from a knob scrolls ≥ 100 px with the value unchanged, and a horizontal drag turns it;
  - the deck's controls are native ranges, and the face's hits are inert.
- **G10 a11y:**
  - axe-core 4.10 (`team/a11y/axe/axe.min.js`), WCAG 2.0 / 2.1 A + AA, plus `label-content-name-mismatch`: 0
    violations at 1141x636 and 390x844, Chrome + WebKit, banner up and down, after sound on, a preset picked and the
    manual reached;
  - a keyboard walk (`team/a11y/kb-walk.cjs`) passes, and the focus never lands on `body`;
  - forced colours show a ring on every face control (pixel diff > 0);
  - `contrast: more` brings in `html.hc` (small print in ivory, steps at opacity 1);
  - AA contrast measured on painted pixels for every text node under 18 px.
- **G11 Weight and speed** (paired runs, `team/perf/measure.cjs`, with `BLOCK_FACE=1` and /drift in the same minute):
  - first view ≤ 1.9 MB on the laptop and ≤ 1.0 MB on a phone;
  - full visit ≤ 3.3 MB on a laptop up to 1440, ≤ 1.8 MB on a phone (≤ 2.7 MB with the deck);
  - on a 4 Mbit/s line the car starts ≤ 1.5 s with 0 stalls;
  - no face-art request before the dash nears or the hand-off;
  - the tutorial costs 0 bytes until near, and only the poster before a tap;
  - no long task over 100 ms at load; CLS ≤ 0.01.
- **G12 Motion:** at 4x CPU, no frame over 33 ms through the hand-off, the dash arrival, HIGH BEAM and the preset glide,
  judged against /drift in the same minute.
- **G13 CSP:** under the live header (lessons 2026-11-10) 0 violations, the YouTube facade click included.
- **G14 Look:**
  - a `review-bench` page of every section at 1141x636 and 390x844 for Dan;
  - Dan's own Safari at 115 % for the hero and the dash;
  - an iPhone check: safe areas, sticky hover, the silent switch, VoiceOver adjusting a knob, the keyboard over the plate
    form, the sharpness of the pan-crop. Until someone sees those on the phone they are reported as "built, not seen".

## 5. Every finding, and where it goes

**Lane F:**
- guidelines-01, 02, 03, 12, d01, d02, d03
- copy-01, 02, 03, 04, 05, 06, 08 (copy), 10 (data), 12, 13, 14, 15, 21, 22 (copy), d01, d02, d03
- motion-06, 07 · a11y-05, a11y-10 (token) · mobile-10, mobile-11 · hero-d02 · a11y-d02 (base)
- art-01 (kit), art-07 (token), art-14, art-15, art-16, art-18, art-19, art-21 · perf-d01

**Lane H:**
- hero-01, 02 (Skip/Replay), 03, 04, 06, 07, 09, 10, 12, 13, 14 (`--sale-h`), 15, d01, d03
- art-03, 04, 06, 22, d02, d03, d04
- motion-04, 05, 14 · perf-03, 06, 08 · video-12 · mobile-13 · guidelines-06, 16 · copy-19 (og)

**Lane D:**
- demo-01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 13, 14, 16, 17, 18, d01 (stepper), d02
- motion-01, 02, 03, 09, 10, 15, 17, 18, d01, d02
- a11y-01, 03, 04, 06, 07, 13, 14, 15, 16, 17, d01, d03
- perf-01, 02, 04, 05, d02 · hero-05, hero-11
- guidelines-08, 09, 11, 15 · art-07 (dash LCDs), art-11, art-12, art-d01
- copy-17, 18 · mobile-04, 05, 06, 07, d03 · video-03 (`stopForFilm`), video-04

**Lane S:**
- guidelines-04 · video-01, 02 (anchor), 05, 06, 07, 08, 09, 10, 11, 13 (data path), d02, d05 · copy-07
- art-02, 10, 20 · motion-08, 12, 16 · mobile-02, 12 · a11y-08, 09, 10 (75 % steps), 19 · perf-09
- demo-d01 (glove box) · mobile-d02 (cards)

**Lane A:**
- guidelines-05, 07, 10, 14, 17, 18, 19 · copy-09, 16, 20 · art-08, 09, 13 · motion-11, 13
- mobile-01, 03, 08, 09, 14, d01 · hero-02 (pill), hero-08, hero-14 (sale.ts)
- a11y-02, 11, 12, 18, 20 · demo-12, 15 · video-d01

**Lane T:** guidelines-13, plus the gates.

**Main session:** guidelines-20 (merge) · video-d03 (fix the mock before the pick page).

**Decisions or people:** video-13, video-14, video-d04 (D13) · video-02 (D14, Ilay) · perf-07 (Cloudflare rule) ·
copy-11 (rejected: §7).

**Deferred:** art-05, art-17. **No action:** perf-10 (Paddle's script is site furniture, 17 KB).

## 6. Launch-day checklist (outside this build; in the `widebeam.ts` header)

1. **Gil:** `DL_PLUGINS.widebeam` and the R2 builds, then `gateWired: true`, `phase: 'open'` (the build refuses `open`
   without the gate).
2. **Paddle:** the price id + `priceUsd`, a `plugins.ts` entry with the same id, `'widebeam'` in OWN_ROUTE, then
   `phase: 'released'`.
   - Once downloads exist, `released` has to come within 30 days of the first download: the worker's day-31 "KEEP
     WIDE BEAM" email sends people to this page to pay (guidelines-d03).
   - `OFFER_PLUGINS.widebeam` with `buyPath /buy/widebeam/` in the licence worker (RevLimiter repo, guidelines-d02).
   - The smoke test asserts `/buy/widebeam/` exists.
3. **Confirm the formats:** `winReady` (the README says the Windows install test is still owed) and `aaxReady` (PACE
   wcguid).
4. **Ilay:** MANUAL_URL to `/widebeam/#manual` before the release build (D14). The film goes from Unlisted to Public.
5. **Listing:** `listed: true` (the home TV and `/plugins` entry), remove `/widebeam/` from NOINDEX, `index` on,
   canonical, the 153-character meta description, SoftwareApplication JSON-LD with no rating.
6. **Cloudflare:** add `widebeam/` to the long-cache rule.
7. **Black Friday:** `sale.ts` per D10.

## 7. Bugs broken today, with repros

Base http://127.0.0.1:4392, Chrome (`channel:'chrome'`) at 1141x636 unless a row says otherwise. Worker and analytics
are stubbed in every context. "lead" = re-run by me today in `team/lead/verify.cjs`; any other name = that designer's
own script (re-run it before calling a fix done).

| Id (merged) | Sev | Repro, then what happens | Seen by |
|---|---|---|---|
| guidelines-01 | blocker | Read `.wb-get-label` / `.wb-get-notice` (`gateWired` false): "Get your free 30-day trial … getting-started emails and a heads-up before your trial ends". | lead |
| copy-01 | blocker | Submit the trial form: it posts `source:'widebeam-trial'` to /form-once. `team/copy/formonce-repro.mjs` (worker source 50266aa, fake KV): trial → 0 relays (triallog only); the launch form with the same email → `already:true`, 0 relays. The visitor is on no list. Not run against the deployed worker. | copy |
| copy-02 | blocker | Click `[data-wb-buy-soon]`; `#wb-buy-note` = "Checkout opens on launch day. Start the free trial now and it rolls straight into the full version." The click also starts the music. | lead |
| guidelines-02 (copy-03) | blocker | Count /AAX/ in `[data-wb-page]`: 2 (the plate micro line, the FORMATS row). README: the PACE wcguid is not created. | lead |
| guidelines-03 (copy-04, 05, 14) | high | Spec row CRUISE "Always on"; step 06 "CRUISE is always on"; no TRACTION anywhere; step 05 "never get printed into your mix"; step 01 omits the 136 default. | lead |
| copy-d01 | high | `#wb-trial-email` aria-label = "Your email, we send the WIDE BEAM download link here", with no link sent pre-open. | lead |
| copy-06 | high | The launch card says "Nothing else unless you ask for it", but the form joins the general newsletter. | copy |
| motion-d01 | high | Escape, hide the banner, click `[data-wb-start]`, wait 1.8 s: face top 671, 0 % visible, SOUND on, no ignition. | lead |
| demo-08 (a11y-01, mobile-07, hero-11, copy-17, guidelines-09) | high | A fresh context per case, after 2.2 s: Tab / `#cookie-decline` / `[data-wb-skip]` / `[data-wb-buy-soon]` → `[data-wb-sound]` aria-pressed false → true in all 4. Accept All on a phone too (mobile). | lead |
| demo-01 (a11y-03, guidelines-09) | high | At scrollY 0 with focus blurred, press m: Mono aria-pressed false → true with the dash off screen, nothing announced (p turns POWER off, per demo). | lead |
| motion-02 (a11y-04) | high | Count animationstart on `[data-wb-flash]` over 24 h keydowns 33 ms apart: 12 full-page flashes in 850 ms. | lead |
| motion-01 | high | Watch Width's aria-valuenow and `.wb-lcd--trip`; click `[data-preset="3"]`, then `[data-preset="11"]`: min −10 (LCD "WIDTH −7%"), max 214 (LCD "WIDTH 214%"). | lead |
| motion-06 (a11y-05) | high | `javaScriptEnabled:false`: 9 `[data-wb-reveal]` blocks at opacity 0; `[data-odo]` = 0 0 0 0. | lead |
| hero-d01 | high | `route('**/src/lib/widebeam/init.ts*', abort)`, wait 12 s: `.wb-hero-inner` visibility hidden, the h1 out of the a11y tree. | hero |
| hero-01 | high | After the reveal, `.wb-mark-row i` inline filter = `blur(0px)`: the contact shadow and the WIDTH glow are gone. | lead |
| art-03 (hero-03, motion-04) | high | The vanishing point (video 969,697, mapped as object-fit cover) is at y 430; `.wb-ctas` 394-458. At 1280x665: 451 vs 424-488. | lead |
| hero-02 (a11y-02) | high | Banner up, 2.6 s: elementFromPoint at the centre of `[data-wb-skip]` (572-607) → `#cookie-banner`; the SOUND pill likewise. | lead |
| guidelines-10 (mobile-01) | high | Decline, Escape, wheel to the end (8283/8283): the centres of footer `a[href*=x.com]` and `a[href*=facebook]` hit `[data-wb-sound]`. | lead |
| guidelines-08 (demo-07, mobile-06) | high | WebKit 844x390 isMobile: the face is 731x418 in a 390 px screen (Chrome isMobile 812x541); the pill sits over SIDE. | lead |
| hero-08 (mobile-14) | high | WebKit 844x390: `#cookie-banner` 625 px tall, top −235. /drift is identical. | lead |
| motion-03 | high | Wheel slowly toward the dash, sampling the lamp `feFuncR` slope: 0.78 (lit) at 2-27 % visible, 0.09 in one frame at ~39 %, then the cough. | motion |
| demo-02 (mobile-05, mobile-d03) | high | 390x844 isMobile, a CDP touch swipe up 160-200 px starting on WIDTH: 136 → 200, page moved 0-7 px. With `pan-y` injected: still 136 → 171. | demo, mobile |
| mobile-02 | high | 8 px wheel steps through #wb-story; count px where a step is `.is-on` and fully readable: 390x844 120/64/96/80/56/64; 360x740 40/8/16/32/0/8; 844x390 all 0. | mobile |
| perf-01 | high | CDP ~4 Mbit/s, a cold load: the car starts 2.4-2.8 s with 3 stalls; with the face art aborted, 1.28 s and 0 stalls. Slow 4G phone: the car never plays. Load-affected, compare pairs. | perf |
| perf-03 | high | Slow 4G phone, shots at 2 / 4 / 8 / 12 s: no title or keys at 8 s, present at ~12 s (watchdog). DRIFT on the same line: about 1 s. | perf |
| art-11 (guidelines-11) | medium | Click `[data-wb-play]`: background rgb(201, 72, 58), race red. | lead |
| motion-09 | medium | Click "Tight Lane" in the lane and log WIDTH per frame: the glide settles at 511 ms, while the face is only 30 % visible at 244 ms. | motion |
| motion-d02 | medium | 390x844 after the dash is fully on screen: opacity 0.845, rotateX ~7°, scale 0.974 (1440x900: 0.705, ~13°). | motion |
| demo-11 (a11y-06) | medium | Focus MIX, press End: the value stays at 100 and the page jumps to 8283. TILT ignores ArrowRight / PageUp / Home. | demo, a11y |
| demo-10 | medium | Click WIDTH, then 4 wheel notches: 136 → 0. | demo |
| demo-12 (a11y-11) | medium | `[data-wb-sound]` aria-label "Music", visible "Sound off". axe `label-content-name-mismatch`. | a11y |
| a11y-07 | medium | Focus HIGH BEAM, Enter: the announcer says "TILT +0.6dB"; preset loads and letter keys say nothing. | a11y |
| a11y-08 | medium | Tab to card 09, Enter: the page glides to the dash and focus stays on the card; the next Tab drags the page back (y 6173). | a11y |
| a11y-10 (art-18, mobile-10) | medium | Painted-pixel contrast: "price announced at launch" 4.21:1 at 12 px; unlit steps 1.70:1; LEVEL 1.44:1. Phone sizes: 10.9 / 12.2 / 7 px text. | a11y, art, mobile |
| motion-08 (a11y-09) | medium | `reducedMotion:'reduce'`, at story step 1: canvas pixels differ 700 ms apart with no input (60 redraws/s). | motion, a11y |
| hero-10 | medium | Tab to Skip, Enter: `activeElement` BODY (WebKit: MAIN); the same after Replay. | hero |
| hero-14 | medium | `?sale=bf`: `.wb-hero` runs to y 679 on a 636 screen. | hero |
| guidelines-d01 | medium | `grep widebeam dist/sitemap-0.xml` (this branch's 13:38 build): https://revaudio.net/widebeam/ is listed while the page serves robots noindex. | lead |
| a11y-d01 | medium | `forcedColors:'active'`, WIDTH focused by keyboard: 0 changed pixels against unfocused. | a11y |
| mobile-d01 | medium | `Emulation.setSafeAreaInsetsOverride` 59/34: the pill's bottom is at 826 vs the safe edge 810; sideways it is 41 px into the right inset. | mobile |
| demo-09 (a11y-14) | medium | 390x844 hit rects: preset ‹ › 5.6x11 / 5.1x11, POWER 13.4x16.6, SIDE 18.5x17.3. | demo |
| mobile-08 | medium | 390 / 360: the empty cart FAB over the trial email + Get it (27x28) and Notify me (27x38). | mobile |
| perf-06 | medium | Slow 4G: after the bail the paused intro keeps loading until ~19.5 s (449 KB phone / 897 KB laptop). | perf |
| a11y-16 (perf-05) | low | longtask observer at load: one 246-273 ms task from `new WideBeamEngine()` (init.ts:122). | a11y, perf |
| hero-13 | low | Route intro-*.mp4 to 404: the title comes only at ~3.7 s, and Replay is offered for a missing video. | hero |
| demo-15 | low | 390x844: the console line reads "ine off. Headphones make it" between the cart and the pill. | demo |
| demo-16 | low | Own WAV, SOUND off, then on → the Night Drive loop. Cancel the file chooser, then click MONO → no sound. | demo |
| demo-d02 | low | A mastered bed at WIDTH 200 + TILT −100 + HIGH BEAM: +2.3 dBFS at the meter tap (~+1.4 out). An own file is 13.6 dB louder than the loop. | demo |
| demo-14 | low | HIGH BEAM, REACH 100: L −25.5 / R −28.2 dBFS (the plugin leans 1-2 dB). | demo |
| a11y-17 | low | With the engine on and the page at the hero: 732 rAF callbacks per 3 s vs 372 with it off. | a11y |
| mobile-d02 | low | 390x844 (hover:none), tap card 02, wait 3.5 s: still `:hover`, −8 px, −0.6°. | mobile |
| art-d04 | low | `forcedColors:'active'`: the lockup is 8 white tiles. | art |
| a11y-18 | low | Submit "nope": the status says "That email looks off" but the input gets no aria-invalid or aria-describedby. | a11y |
