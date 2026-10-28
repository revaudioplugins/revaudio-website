# DRIFT #hear — a new panel under the player: worn, crashed, Japanese + graffiti (2026-10-26, revaudio-ef, same branch)

Request (laptop 1 user): "the panel that everything sits on is a different panel, use OpenAI for it ... three different
panels that suit the vibe ... wear out a little, like it went through a crash ... a little Japanese and graffiti".
Scope: the outer `.d-panel.d-hear-panel` plate only (step 3's pair plate and the rest of /drift keep the DRIFT steel).

- [x] K1. Three plates from gpt-image-2 (2560 x 1024, high; prompts `bench/drift-panel/PROMPTS.md`): 1 峠 WRECK
  (ドリフト tag, 峠, 限界を超えろ, 夜の走り屋, torn checker, a crease), 2 STENCIL (全開, 試聴, gaffer tape, a crack, skid
  marks), 3 STREET WALL (聴け, ドリフト, 夜, 最高速度で, 逃げ場はない, stickers, a heat-blued scorch). Every Japanese line
  read and correct. Bench `bench/drift-panel-bench.html` = the real built /drift in two frames (1440 / 390), the plate
  swapped live, VEIL + PHONE X sliders, checker + 試聴 toggle (`python bench/serve-panel-bench.py`, port 8797).
- [x] K2. The user's pick: 3, STREET WALL (2026-10-26), with a bigger ask: "the LCD panels and all of those elements
  engraved in that background ... remove LET'S DRIFT from the top, keep it simple ... the panels the elements sit on
  a little worn, same vibe ... the LCD and PICK A TRACK a little broken, worn ... PLAY and PUSH DRIFT upfront, more
  appealing, catch the eye more ... make this whole section glued together".
- [x] E1. Assets (gpt-image-2, prompts in `bench/drift-panel/PROMPTS.md`): `panel3-portrait.webp` (an edit FROM plate
  3, Japanese checked), `crack-lcd.webp` + `crack-crt.webp` (photographed glass crack on black, screen-blended),
  `spray-arrow.webp`. No separate sub-plate: the pocket floors continue the wall itself (FLOOR WALL), darker.
- [x] E2 (bench). Engrave: every part sits in a pocket milled into the plate (dark inner wall top-left, bare-steel chamfer +
  catch-light on the bottom-right lip, the graffiti stops at the cut) instead of a box floating on it.
- [x] E3 (bench). Simple top: LET'S DRIFT. off the screen (kept for screen readers: it names the section), checker strip + 試聴
  sticker off; the plate's own top strip shows instead. The panel gets ~45 px shorter on desktop.
- [ ] E4. PLAY + PUSH DRIFT up front: bigger, their lamps spill on the plate, hand-sprayed marks pointing at them;
  VOLUME steps back. Section bench `bench/drift-hear-bench.html` (same server, port 8797): UPFRONT AS IS / A BIG +
  LIGHT / B A + SPRAY (an arrow at PLAY and at DRIFT, the next one fresh paint), FLOOR WALL / DRIFT STEEL, VEIL,
  PHONE Y. A sprayed ring round DRIFT was tried and dropped (it read as the button's own magenta lamp).
  Picked 2026-10-28 (the user: "commit"): CONTROLS FLUSH (no boxes: "just this section doesn't feel glued"), UPFRONT A
  (B's sprayed arrows dropped: "remove the pink arrows"), FLOOR DRIFT STEEL (was WALL; the user on the bench with
  the framed LCD, 2026-10-28: "Drift wall i like", confirmed = the DRIFT STEEL floor), LAYOUT TIGHT = the user's own hand layout
  (EDIT mode, `bench/drift-hear-tune/yours.json`) on a grid (`tight.json`, its note has the maths). Two micro-moves
  made after TIGHT were left out: "3 PUSH DRIFT" at 94 % (the step names stay one size) and DRIFT 1 px off the axis.
- [x] E4b. The LCD gets the track list's frame (the user: "make a frame for this to lcd"): the same pocket + 5 px
  black bezel, the outer box = today's LCD box so the TIGHT lines hold; slimmer on phones. Bench toggle LCD CUT /
  FRAMED. On the bench 2026-10-28 (FRAMED by default; the user's look owed): desktop frame 445..1136 x 40..243, glass
  457..1124, panel 460 -> 484, rings' bottom = the list pocket's bottom (454). Phone pocket 7 + bezel 4, the glass's
  side padding 12 -> 5 so the readouts keep their width (coach spare 16 px at 390, 18 at 360, same as CUT; the
  too-long control clips); panel +14. Crack still on the glass, 0 page errors.
- [x] E4c. VOLUME = a fader, not a knob (the user, 2026-10-28: "let's use a fader for volume instead of a knob";
  replaces the KNOB LAB knob question). Bench toggle VOLUME KNOB / FADER, FADER by default: the page's #drive fader
  (DriftFader.astro look, violet fill) on the knob's centre line (desktop x 1088), cap travel = the DRIFT ring's height
  (desktop 307..454, phone 416..495; phone cap 34 x 17), readout on ORIGINAL / DRIFT's line. The bench drives
  hear.ts's volume through the hidden knob's keys (5 % steps); tested: drag 75 % / past the bottom = MUTE / End /
  ArrowDown / dblclick = 80, readout + knob aria follow, EDIT ON picks the fader and leaves the volume (control),
  0 page errors. The user's look owed. At the fold: hear.ts drives the fader with faders.ts `initFader` (1 % steps),
  the knob markup + its 65-frame strip go.
- [ ] E5. Fold the pick (DriftHear.astro + drift.css, #hear only; assets via getImage). The LCD frame = a wrapper in
  the markup (`.d-hear-lcdbox` round the screen, as `.d-hear-tv` wraps the list); new heights into the baselines.
- [ ] E6. Verify: every guide state, readouts still read over the graffiti, reduced motion, focus, phone 390 / 360,
  WebKit, 0 errors; heights = before minus the title row.

# DRIFT #hear — step 2 (PLAY / STOP) gets the love (2026-10-19, revaudio-ef, same branch)

Request (laptop 1 user, on a screenshot of the step-2 box): "this is the next area that needs love". Covers the paused
review item 2 (the next-step breath). Found: the cue is a flat magenta outline lit by nothing; the caps float on the
plate with no mount (step 3 sits in chrome + LED bars); STOP is filtered to a muddy brown that reads broken.

- [x] P1. Bench `bench/drift-play-bench.html` (worktree root on 8796): the real box (trial-plate, label, mm caps) at
  186 x 184.5 / 120.6 x 147.5 / 111.4 x 145.8, step 3 crops beside it, guide states cycling, fit + plate-edge
  checks. 0 = today; A = chrome bezels + 24 LED bars round PLAY (step 3's language); B = wells + pilot lamps
  (green PLAY lamp); C = chrome bezels + the PLAY cap lit from inside. STOP = an unlit dark red in A-C (one race-red).
- [x] P2. The user picks: C, LIT CAP (2026-10-26, "C").
- [x] P3. Folded: DriftHear.astro wraps each cap in `.d-hear-mount` (PLAY's also `--play`); drift.css "STEP 2 · LIT
  CAP" block, all under `.d-hear-sec` / the section's [data-next] / [data-playing]: chrome bezel 66 / 48 px (the old
  cap's footprint), cap 52 / 38 px inside it, the lamp (::after in the cap, screen blend) + its spill on the seat
  breathe on next=play and burn while playing; playing = the lamp, not the white pressed ring; STOP brightness .6 /
  saturate .75. The old magenta ring rules are gone; the bench-baked 9 px desktop drop moved from the cap to the bezel.
- [x] P4. Verified on the built dist: #hear + hero + page heights identical to before at 11 widths (heights.cjs);
  bezels / caps sized, centred and 6 px inside the plate at 1440 / 390 / 360 (verify-step2.cjs); lamp + spill =
  d-hear-lamp on open and after STOP, opacity 1 while playing, none + .8 under reduced motion; all guide states and
  coach texts as before (verify-hear.cjs); #drive's caps unchanged (44 px, no bezel, own filters); 0 page errors.
  Found + fixed: hovering the playing cap fell back to the GPS pressed glow (now the hover look); every focused cap's
  ring was a 6 px rounded square (`.drift-page :focus-visible` sets border-radius 6px, it predates this work):
  `.drift-page .d-cap:focus-visible` now keeps 50 %, which fixes #drive's GPS caps too.

# DRIFT #hear — the screen as a real LCD (2026-10-19, revaudio-ef, same branch)

Request (laptop 1 user, on the #hear screen screenshot): "let's design this whole area so it looks like an LCD
screen". Today's screen = dark violet glass + blurred magenta glow on every readout: reads CRT / neon, not LCD.

- [x] L1. Bench `bench/drift-lcd-bench.html` (serve the worktree root: `python -m http.server 8796`): the real
  screen markup at the measured sizes (desktop 691 x 179, phone 314 x 127 / 284 x 127), live guide states on the
  real peaks.json, coach-fits + height checks under each screen. 0 = today, A = dot matrix (negative, magenta,
  cyan/magenta tags kept), B = 14-segment car stereo (DSEG14 italic, RevTune's file, OFL; ghost cells), C =
  reflective positive (lilac reflector, violet ink + 1 px liquid-layer shadow). All: heights = page, coach fits.
- [x] L2. The user's pick: B, segment ("go with your recommendation").
- [x] L3. Folded: drift.css "THE SCREEN" block (`.d-hear-sec .d-hear-screen` only) + `--d-f-seg` / `Drift DSEG14`;
  `src/lib/drift/lcd.ts` (ghost + lcdText: text and data-g together); hear.ts writes coach / title / tag / clock
  through it (words fade in 170 ms like liquid crystal, not under reduced motion) and draw() = the segment bar
  graph from `--seg-*`; bus.ts writes PAN through it; DriftHear.astro ships the first ghosts; font + licence in
  public/fonts/drift.
- [x] L4. Verified on the built dist: #hear panel height = live at 11 widths, the screen's parts identical
  (127 px phone; the 1.75 px at 360 is the earlier "3 PUSH DRIFT" caption, not the screen); all guide states
  (verify-hear.cjs); coach fits beside both tags at 14 widths down to 360 (coachfit.cjs, measured on the lit
  text, with a control); DSEG really loads; ghosts right (`PUSH AGAIN: ORIGINAL` -> `~~~~~~~~~~:~~~~~~~~~`);
  0 console errors; reduced motion = 0 fades. Window: inset only (embed law).

### Review (LCD)
- Below 360 (340 / 320) PUSH AGAIN: ORIGINAL loses its last letters, as the VT323 screen did at 320 before.
- Firefox without CSS alt-text support drops the ghost declaration: the screen then shows no ghosts (lit text intact).
- Not seen yet: a real phone (DPR 3), a real Safari (headless WebKit 2336 renders font, ghosts and arrow right).
- APPROVED on the page (laptop 1 user, 2026-10-19: "cool, looks killer"), told first that the segment D reads
  like ] (DRIFT), V like I/ and S like 5 and that the phone coach is 9.5-10.5 px: kept as is.

# DRIFT #hear — guide the visitor through the test drive (2026-10-19, revaudio-ef)

Request (laptop 1 user, on the live #hear screenshot): "let's open a branch and flesh this out in depth, so people
understand exactly what they need to do". Branch `drift-hear-guide`, worktree `Website/revaudio-website-hear`, off
origin/main `d0168a6`. Local only: a push waits for the word "push".

Constraint: the design picked today cut words (`ea323e0`: the closing line, the L/R letters, the balance bar;
`e5e00a1`: the explanatory headline "SAME TRACK. / FLIP DRIFT." became "LET'S DRIFT."). So the guidance lives INSIDE
the parts already on the panel (the LCD header cell, the step badges, the DRIFT button's own lamp, the breathing glow
PLAY already has). Any new visible words are an ask item (Q1-Q4 below), never part of a plain "go".

Baseline (live revaudio.net/drift, headless Edge, 2026-10-19): #hear panel 539 px tall at 1440, 588 px at 390.
Reference shots: session scratchpad `live/` (desk/phone: fold, idle, playing). Height budget: no growth; diff
every step (snap.ts soft-snaps the page to this panel).

## Findings (live audit)
- F1 Default = DRIFT ON: PLAY plays DRIFT first, so there is no reference; step 3 then turns DRIFT OFF. The story
  runs backwards (it should be: the original -> push DRIFT -> hear it change).
- F2 "3 FLIP" does not say what flips. The button shows only its current state (DRIFT ON or ORIGINAL), so it does
  not read as a two-way switch.
- F3 Once playing, nothing points at step 3 (only PLAY breathes, and only while stopped).
- F4 VOLUME sits inside step 3, so step 3 reads as two jobs.
- F5 Phone 360/390: the headline LET'S DRIFT. sits under the checker strip + sticker (headline 147-173 px vs checker
  145-167 px at 390; the screenshot shows it covered).
- F6 DRIFT is stereo movement: on phone / laptop speakers it barely shows, and nothing says headphones. The A/B is
  level-matched (fair), and nothing says that either.
- F7 Desktop: #hear starts below the first screen and nothing in the hero points to it.

## Steps (decided by the evidence)
- [x] A. Guide state in hear.ts: next = PLAY (stopped) -> DRIFT (ORIGINAL playing, DRIFT never pushed) -> COMPARE
      (heard DRIFT, not yet back to the original) -> none. `root[data-next]` carries it for the CSS.
- [x] B. LCD coach cell: the header's left cell (READY / NOW PLAYING today) names the next action while there is
      one (PRESS PLAY -> PUSH DRIFT -> PUSH AGAIN: ORIGINAL), then NOW PLAYING. Fits beside the tag at 360 px
      (19 px desktop = the readouts' size, 16 px phones, under the tag's 22 px box). One aria-live region (the cell).
- [x] C. Next-step light: the key of the next step lights and its control breathes with the glow PLAY already has
      (same keyframes d-hear-next); the DRIFT button breathes once the original plays (a ring on its bezel). The
      other keys rest dim until both sides were heard. No new animation.
- [x] D. Two-way read on the DRIFT unit: under the button, ORIGINAL and DRIFT side by side, the one you hear lit
      (cyan = the original, as the LCD tag; pink = DRIFT).
- [x] E. Headline (F5): the checker strip is cropped to the room left of the title (it collided up to ~770 px, not
      only on phones); the 試聴 tag is off on phones (it touched the title at 360, as #drive's on Dan 10-04).
- [x] F. Push-first path: pushing DRIFT before PLAY still starts in DRIFT; the coach then asks for the original.
- [x] G. Verify (below).

## Ask items (answered 2026-10-19)
- Q1 Default on load: ORIGINAL (yes).
- Q2 Step 3 caption: "3 PUSH DRIFT" (yes).
- Q3 "HEADPHONES ON" tag: no.
- Q4 A "HEAR IT" link from the hero to #hear: yes. Built as a lit magenta key + "HEAR IT" in the steps' CRT type, in
  the title panel under the tagline. Desktop: it rides in the panel's bottom pad, so the title and CTA panels still
  mirror (both 241 px at 1440, as live). 601-1099: in flow (+35 px on the merged panel). Phones: none, since the
  player starts where the first screen ends (390x844: catch line ends 824, #hear panel starts 860).

## Review (2026-10-19, revaudio-ef)
- Build green (27 pages). Checked on the built dist (python http.server 127.0.0.1:4417, headless Edge):
  - States at 1440x900 / 1366x768 / 820x1180 / 390x844 / 360x740: idle = PRESS PLAY + PLAY and key 2 breathe;
    PLAY = PUSH DRIFT + DRIFT ring and key 3; DRIFT = PUSH AGAIN: ORIGINAL; back = NOW PLAYING, every key lit, no
    breath; STOP = PRESS PLAY again; push-first (fresh page) = DRIFT plays + PUSH AGAIN: ORIGINAL. Coach and step
    captions never clipped; ORIGINAL / DRIFT inside the pair; the checker clears the title glyphs everywhere.
  - Heights vs live at 11 sizes (1920 down to 360): the #hear panel identical (360: 551 vs 552), header row 22 px
    everywhere, desktop hero identical; only 601-1099's hero +35 px (the link in flow). Snap unaffected (it keys on
    the panel height).
  - HEAR IT lands the #hear panel 87 px under the nav, whole panel on screen at 1366x768 (128-592).
  - Reduced motion: no animation (static rings). Keyboard: Tab order tracks > PLAY > STOP > DRIFT > VOLUME; Enter on
    PLAY, Space on DRIFT x2 walk the whole guide.
  - Console: 0 errors (only the Cloudflare RUM requests the test itself blocks).
  - Second pass (review): (1) while the sound loaded, `next()` gave '' = the free-play look (every key lit) for a
    moment after the first press; now 'wait' (coach LOADING, keys dim, nothing breathes, the DRIFT bars chase).
    Proved with every .m4a held back 2 s (390x844), PLAY and push-first both. (2) The HEAR IT key sat on the title
    panel's bottom-left screw and 4 px off its edge at 1100-1280 (the left pad shrinks to 35 px); now indented to
    clear the screw by 10 px and a notch smaller there: 10-12 px off the edge at 1100 / 1199 / 1280, hero panels
    still mirror (heights = live).
- Not checked: real iPhone / Safari / Firefox (the player's open item from 10-15 still stands); a human ear.

# Website — word-wall WEIGHT (checker S4, 2026-10-15, revaudio-32)

Request (Dan): "let's fix the weight", then "is there a way to make it lighter without hurting quality?" -> yes, go.
Baseline (dist, no scroll): laptop 1280x665 first load 2264 KB, phone 390x844@3 1822 KB; the TV = 380 KB of it on both
(frame tv-broken-2 webp 1400 = 248 KB at every width, DRIFT poster webp 1400 = 132 KB, eager, no srcset).

## Steps
- [x] Lazy: the frame + the poster load only once the wall is within one screen (IntersectionObserver, rootMargin
      100%), started after the page's load / the first scroll / 3 s (whichever first), decoded before they swap in;
      no-JS = `<noscript><style is:inline>` with today's 1400 webp.
- [x] Sharp per screen: JS picks the smallest cut that is still pixel-sharp here (frame: roll width x --ww-frame-u x
      DPR, u read off the frame's padding; poster: video CSS width x DPR); cuts frame 640/960/1400, poster
      800/1100/1400; upgrade only on resize / rotate / bench roll switch / carousel swap; 1400 stays the top.
- [x] Frame vars: SSR `--wfN-img:none`; JS sets `--wfN-img` + `--wfN-sl` (slices in the cut's own pixels) for the roll
      on show only. Every roll still gets its cuts in the build (an imported image Astro never transforms ships raw).
- [x] Proved the lazy + cut step on WebP first: laptop 1280@2 pixel-identical to today (Chromium + WebKit).
- [x] AVIF (frame q70, poster q50), WebP when the browser can't decode AVIF (1x1 data-URI probe).
- [x] N2: sizes read via `.clone`: drift-window-wall.png (2 MB) and gas-hero.png (4.3 MB) no longer ship raw.
- [x] Verify (below). Docs, commit by path. Push only on "push".

## Review — WEIGHT (2026-10-15)
- Measured on the built site, both builds on the same plain static server (python http.server, no compression),
  Chromium, homepage, no scroll, load + 4 s: laptop 1280x665@2 2264 -> 1887 KB, phone 390x844@3 1822 -> 1515 KB.
  The TV at the wall: laptop 183 KB (frame avif 111 + poster avif 71, was 380 in the first load); phone 70 KB (frame
  20 + poster 49), and on the phone it now starts after the load event (190 ms vs load 172 ms; was 10-57 ms).
- Quality, the built files vs the source resized (PSNR): frame 640/960/1400 webp 44.41/43.57/43.87 dB -> avif
  44.75/44.45/44.63; poster 800/1100/1400 webp 34.37/35.17/35.86 -> avif 35.78/36.08/36.23. Cut needs measured per
  screen (need.cjs): 390@3 frame 494 / poster 1049 px, 1280@2 1272 / 1231, 1920@1 636 / 736, 932x430@3 1694 (gets
  1400, as before). Side-by-side zoom sheets (checker corner, tape, broken corner + LED, gauges) at 1280@2 and 390@3.
- Reduced-motion shots before/after: laptop 1280@2 pixel-identical on WebP (Chromium + WebKit); headless WebKit on
  Windows has no AVIF, so it took the WebP fallback, still pixel-identical. Other sizes differ only by the cut's
  resampling (heat map: edges only).
- Video plays at the wall with the poster set (Chromium + WebKit, 1280 + 390), no console errors. No JS: frame +
  picture up in both engines (Chromium forces video controls without JS: their panel is hidden in the noscript style).
  `--ww-ar` and the video's width/height identical to 697f49d. Lock test (snapfresh) unchanged. Dev: all three rolls
  switch (first AVIF of a roll takes a few seconds in dev only). Build green, no __wwbench in dist.
- Gotchas met (tasks/lessons.md): a stray `astro preview` on ::1:4431 answered `localhost` with compressed responses
  while python held 127.0.0.1:4431 (unfair first numbers); headless WebKit on Windows never fires `load` (stalled
  videos), so the art never waits on `load` alone.
- Open for Dan: real Safari / iPhone check (AVIF path), as before.
- Pushed to main 2026-10-18 on Dan's "push" (rebased onto edb5049; re-checked after the rebase).

# Website — DRIFT word-wall panel: NEON / STEER looks + HD live window (2026-10-14, revaudio-32)

Request (Dan): the homepage word-wall DRIFT panel (MOVING / STEERED / SLIDING / WIDE / ALIVE + a static
screenshot) "needs a more interesting design". Picks: build both looks, show them on a bench; HD live window.
Rules: motion = feedback only; glow only from a lamp (a neon sign is one); copy unchanged; other panels untouched.

## Steps
- [x] HD live window: record DRIFT 5.2.8 UI (Drift be43857, git archive) with tools/record-drift-arcade-run.mjs,
      encode public/drift/wall-run-1440 + wall-run-800 (webm + mp4), poster src/assets/showcase/drift-window-wall.png.
- [x] WordWall: DRIFT panel `data-ww-look` (neon | steer | both) from one constant; video in the figure
      (plays only while active + in view; reduced motion = poster).
- [x] Look NEON: glass tubes, SLIDING lit (DRIFT magenta), spill on the wood, ドリフト tube, power-on flicker, hover lights.
- [x] Look STEER: pointer = wheel, per-word springs, SLIDING skid smear; phones = one drift-in entrance.
- [x] Look BOTH.
- [x] Bench /__wwbench (dev only): laptop + phone iframes, look switch, sliders, COPY SETTINGS.
- [x] Docs: DESIGN.md, seasons MANIFEST, handoff.
- [x] Verify: build green, bench absent from dist, Chromium + WebKit 1280x665 DPR2 / 1141 / 1440 / 860 / 390 / 360,
      no sideways scroll, other panels unchanged, video plays/pauses right, reduced motion + hc.
- [x] Screen wall (DRIFT_BG) after "the whole back a digital screen"; TV window kept as an option (DRIFT_WIN).
- [x] Broken TV frame round the screen wall (DRIFT_FRAME, 3 rolls, bench switch + size + gap); verified swap,
      scrollbar, steer clamp, Chromium + WebKit.
- [x] Neutral set (Dan: "more neutral, fewer colours"): frames re-cut colourless, LED = house --emerald.
- [x] CHANNELS (Dan 2026-10-14: "every plugin on the TV, only the screen changes when the carousel moves, like
      changing channels"; picks: each plugin its own screen colour, a short burst of static, no channel number):
  - [x] The TV belongs to the whole word wall, not the DRIFT panel: WALL_BG / WALL_FRAME on .ww (were DRIFT_BG /
        DRIFT_FRAME on the DRIFT panel); screen + frame on for every panel, with or without drift.homeLead. (3b5dff0)
  - [x] One phosphor colour per channel (hue + saturation vars on .ww, mapped from the active panel): DRIFT violet
        (as now), RevLimiter amber, GAS brass gold, Radio Roulette warm dial-glass cream. (a5b89c5)
  - [x] RevLimiter / GAS / Radio Roulette (and DRIFT 'current'/'steer'): kicker, stencil words, hot word, caption,
        name and window edge in their channel's phosphor instead of brass on wood. DRIFT neon keeps its own tubes.
  - [x] Channel change: a ~300 ms burst of static over the picture when the carousel moves (canvas noise, only
        during the switch; reduced motion = the plain crossfade; hc = none). (5a1ef8d)
  - [x] Bench: channel hue + saturation sliders x3 (RevLimiter, GAS, Radio Roulette; DRIFT's violet is not on a
        slider), static length; WOOD/SCREEN + frame switches drive .ww.
  - [x] Verify: see the review below.
- [ ] Dan picks + tunes on the bench -> "apply ww bench" -> bake (delete the unpicked rolls) -> commit. Push only on "push".

- [x] Frame checker paint in burnt RevAudio yellow (Dan: "replace the purple with a burnt yellow"); dev cache-bust. (d081341)
- [ ] TV = ONE SCREEN (Dan 2026-10-14: "when I scroll, the site fits the screen exactly, not past the edges top and
      bottom"; pick: only the TV + a scroll lock):
  - [x] A, laptop (>= 861px): #sound = 100svh - the nav (min-height, @supports svh); .ww padding from the bezel + a
        breath; the words + windows sized to the glass (--ww-room): words min(old clamp, (room - tag) / 4.6), windows
        width-capped by their aspect (--ww-ar), GAS max-height; never larger than before. Content centred.
  - [x] Scroll lock: armed only by the user's wheel / touch / scroll keys, fires once scrolling is idle and no finger
        is down, only if the TV fits the screen and its top is within --ww-snap-zone of the nav; lenis.scrollTo.
        None under reduced motion (no Lenis). Bench: Lock zone + Breathing room sliders; toSound = the exact target.
  - [x] Verify A (see the review).
  - [x] B, single column (<= 860px), SEPARATE commit (Dan: "build part B"): words ~74 -> ~46 px, GAS window
        ~384 -> ~150 px on a 390x664 phone (svh).

## Review — CHECKER FIXES before the main push (2026-10-14)
- Dan: "send a checker; if it passes push to main, if not fix then push". revaudio-website-agent on c1dada5: LCP, CLS 0,
  TBT, idle CPU, video gating, carousel, all pages, no __wwbench, reduced motion passed. Found and fixed:
  - B1 (blocker): the lock pulled one wheel notch / arrow tap back to the TV (small steps never got away). Now the lock
    lands only when this gesture brought the TV closer (startY at the gesture's start).
  - S3: no lock on a sideways wheel, Space on a button, a wheel in an open dialog, or in hc (page did not move = bail).
  - S2: the TV layer divs made every panel `:not(:first-child)`, so the first panel's reveal got the swap stagger;
    selector now `.ww-panel ~ .ww-panel`.
  - S1: landscape phones (844x390 / 667x375 / 853x443) rendered 0x0 windows; `--ww-media-h` floor 8rem (there the TV
    is taller than the screen, so it scrolls and the lock stays off).
  - Mine, found re-testing in WebKit: headless WebKit paints scroll every ~190 ms, past the 160 ms idle, so the lock
    saw "page did not move"; it now waits while Lenis is still gliding (`isScrolling === 'smooth'`; native touch untouched).
- Re-checked on the fix (dev server, served code grepped first): lock, fresh page per case, Chromium + WebKit 1280x665:
  near wheel down 140 -> 0, far 420 -> 380 stays, past wheel up -150 -> 0, far past -420 -> -380 stays, near wheel UP
  (away) 100 -> 140 (no pull back), ArrowDown near -> 0, programmatic -> no lock; notches + arrow taps from 0 progress
  both ways (0 -> 100 -> 200 -> 300); sideways wheel -> no lock. Touch (Chromium, laptop + phone): held -> no lock, lift
  -> 0, far stays, tap nothing. Reveal: first panel no swap animation, a swapped-in panel staggers (both engines).
  Fit both engines: 360x640 ... 860x900 and 1024 / 1280 / 1920 laptops exact (section = screen - nav, all inside the
  glass, 0 sideways); landscape phones: windows 86-265 px wide (were 0), section taller than the screen (by design).
  `npm run build` green, no __wwbench in dist.
- Not fixed then (FIXED 2026-10-15, "Review — WEIGHT" above): S4 first load +~369 KB laptop / +~246 KB phone (frame webp 254 KB at every width, DRIFT
  poster 136 KB, no srcset) = the price of the TV; N1 snow +48 ms main thread per channel change (~2.7 ms/frame, no long
  task); N2 6.4 MB raw PNGs in dist never requested (gas-hero.png, drift-window-wall.png: reading `.width` on the import
  marks them used) + unused rolls 1/3 until "apply ww bench"; N3 hc still sizes the TV; N4 an anchor right after a wheel
  can lock; N5 +9 % main thread with the pointer over the wall (steer); N6 the run has no pause button (design call);
  N7 scanlines stripe the phone button (design call). Not checked: real iPhone / Mac Safari, Firefox, Lighthouse.

## Review — ONE SCREEN, part B (2026-10-14)
- Fit, Chromium + WebKit 360x640 / 390x664 / 390x844 / 430x932 / 600x900 / 768x1024 / 860x900 (+ Chromium 360x740),
  all 4 channels: section = innerHeight - nav exactly, everything inside the glass, 0 sideways scroll. First pass was
  5-21 px over: the name + button block is 120-133 px with its margin, not the 112 budgeted; fixed (--ww-go-h).
- Lock on a phone (Chromium 390x664 mobile, CDP touch): finger held -> no lock, lift -> lands at 0; far -> stays; tap
  -> nothing. Laptop sizes unchanged by B (the shared block only moved; laptop rules identical).
- Build green, no __wwbench in dist. Not checked: a real iPhone / Android, Firefox.

## Review — ONE SCREEN, part A (2026-10-14)
- Fit, Chromium 900x700 / 1024x600 / 1141x636 / 1280x665 / 1440x800 / 1728x1000 / 1920x1080 / 2560x1440, WebKit
  1024x600 / 1141x636 / 1280x665 / 1440x800 / 1920x1080, all 4 channels: section height = innerHeight - nav exactly
  (no min-height growth anywhere), everything inside the glass, 0 sideways scroll. Words at 1280x665 115 -> 98 px,
  1141x636 103 -> 92 px; GAS window 544 -> ~382 px tall at 1280. 1728 and up: words capped (134 px), centred with
  room round them (2560x1440: 654 px of content in a 1294 px glass).
- Lock, Chromium + WebKit 1280x665, Chromium 1141x636: wheel stopping 100 px off -> lands at 0; 380 px off -> stays;
  scrolled 110 px past, wheel up -> 0; ArrowDown near -> 0; a script's scrollTo near -> no lock. Reduced motion
  (Chromium): no lock. Touch (Chromium 1280x800, CDP touch events): finger held 700 ms -> no lock while down, lift ->
  0; far -> stays; a tap -> nothing. Bench: Lock zone 0 -> no lock, 30 -> lock; toSound lands at 0.
- Phones / tablet unchanged: 860x900, 390x844, 360x740 section and font sizes identical to before.
- Build green, no __wwbench in dist. Gotcha: the dev server twice missed a quick second edit to WordWall.astro
  (served a stale transform); `touch` the file and re-fetch before trusting a dev test.
- Not checked: a real Mac / iPad, Firefox.

## Review — CHANNELS (2026-10-14)
- Checks that ran on the final commit (5a1ef8d), local dev server:
  - `npm run build` green; `dist/` has no `__wwbench`.
  - Chromium + WebKit at 1141 / 1280 / 1728 / 860 / 390 / 360, each of the 4 channels shown in turn: the kicker,
    words, window, caption and name all inside the TV glass, 0 px sideways scroll.
  - Static: Chromium + WebKit at 1280 + 390: snow on at +120 ms, gone by +820 ms; none with the wall scrolled
    off screen, none when the same panel is picked again; Chromium reduced motion: none.
  - Bench: the Static length slider reads 300; set to 600, the burst lasted 616 ms (Chromium).
  - drift.homeLead off (flag flipped on the dev server, then restored, tree clean): no DRIFT panel, Chromium
    1141-360 all channels inside the glass, 0 sideways scroll; static fires on RevLimiter -> GAS (Chromium 1280)
    and -> Radio Roulette (WebKit 390). Step 1 also checked RevLimiter opens first with the TV on.
  - hc: Chromium + WebKit at 1280 + 390: screen, fx, snow and frame display:none, no snow on a channel change,
    the words plain white (no phosphor stroke or glow).
  - Only console noise: the dev toolbar's 403 through the node_modules junction (dev only, not in the build).
  - Bench, real clicks (Chromium): the header channel button (GAS) switches both frames and plays the snow in both;
    a channel colour slider changes the screen glow in both.
  - Real carousel clicks on the homepage (Chromium; a visitor at the carousel clicks next / a dot):
    1141x636 + 1280x665: the carousel fills the screen, the wall starts below the fold (0 px visible), so the static
    is skipped and the visitor scrolls down to the new channel already on. 390x844 (wall top 170-312 px visible
    under the carousel) and 1728x1000 (126-250 px): the snow plays. With the carousel's bottom at the screen's
    bottom edge: 0 px of wall, no snow, at every size. Open for Dan: keep as is, or play the static when the wall
    scrolls into view after a channel change (not built).
- Not checked: a real iPhone / Mac Safari (WebKit here is Playwright's Windows build), Firefox.
- Left for Dan: pick a frame roll + tune colours, frame size and static length on the bench.

---

# Website — /gas sells more (2026-09-06)

Request (Dan): "lets work on the gas page, lets make it sell more" + "work with psychologic and
make it simple". GAS is free; "sell" = more email-gated downloads. One screen on desktop stays
(Dan 2026-07-30). Honesty rules stay: no fake proof, no invented numbers.

## Psychology used (all honest)
- Outcome first: hook says what you get, not the spec ("One knob. Sounds expensive.").
- Zero-price + risk removal: the "what's the catch?" objection answered next to the button
  (full version / free forever / no trial clock / no credit card / Win + Mac formats).
- Pre-framed friction: the email step is stated under the button BEFORE the modal, so it is
  not a surprise at click time.
- One focal point: brass CTA is the only warm block; the video play dot goes brass too.
- Proof, not claims: the real Driver's Manual video stays, labelled with its true length.

## Steps
- [x] Audit current page + screenshots (before): desktop OK, phone CTA below the fold, OG 404.
- [x] `src/pages/gas.astro`: new copy, risk list, CTA "Get GAS free", pre-framed email line,
      video badge moved after the CTA on phones (grid areas), play dot brass.
- [x] Phone: CTA + fine print above the fold at 390x844 (plate 26svh).
- [x] OG: real `public/og/gas.png` (1200x630) + `public/og-default.png` (site-wide 404 today);
      `BaseLayout.astro` emits an absolute `og:image` URL.
- [x] Better search snippet: `<title>` "GAS: free one-knob saturator", description with formats.
- [x] `npm run build`, screenshots 1280x665 DPR2 + 390x844 + modal, send to Dan.
- [x] Commit LOCAL only (no push until Dan says push). Update `tasks/handoff.md`.

## Not done on purpose (keep it simple)
- No audio A/B rack on /gas (would break the one-screen promise; source audio not on disk).
- No RevLimiter cross-sell on /gas (second ask competes with the one button).

## Review (2026-09-06)
- Build green, 19 pages. Shots 1280x665 DPR2 (cookie banner declined): plate + copy + CTA + fine
  print all inside one screen. 390x844: CTA and fine print above the fold, video badge last.
- Modal opens from the new CTA (TrialGateModal free copy). Video lightbox opens.
- dist check: title "GAS: free one-knob saturator - RevAudio", og:image absolute
  https://revaudio.net/og/gas.png, /og-default.png now a real 1200x630 PNG.
- Committed locally, NOT pushed. Waiting for Dan to review the shots and say "push".
