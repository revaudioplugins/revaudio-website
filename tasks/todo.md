# GAS 2 phone POSTCARDS (branch `feat/gas2-postcards`, 2026-10-29, danavivi-75) — ROUND 9 BUILT (motion on Dan's iPhone) + a ponytail pass, pushed to `origin/feat/gas2-postcards`

Dan's concept (2026-10-29): a stack of 1950s "Greetings from GAS 2" postcards, phone only. State: `tasks/handoff.md` top entry.

## Steps
- [x] 0. Branch + worktree off `origin/feat/gas2-drone` (`4fc6ddd`); claim, plan, README line pair.
- [x] 1. Assets, no spend (`postcards/tools/`): the real pump baked from the plugin page (`Source/ui/public` on :4461, 2x,
      alpha, ROOM hidden, full hose, PREMIUM lit, GAS 140 % = the demo's setting); card 1's backdrop = the station, soft
      (the painted pump filled out, blurred); the page backdrop; a linen tile; the grade keys (the 4x bake on
      `feat/gas2-phone`); a stamp from `poster-mail-1`.
- [x] 2. `postcards.html`: six cards in one stack; flick = drag, throw on velocity / distance, spring back otherwise;
      back / next buttons + arrow keys; counter; one nudge on first load; `?card=1-6` (+ `&flip`) opens on a card (review
      in the Simulator, where we can't flick); reduced motion = a crossfade.
- [x] 3. Cards: 1 Greetings from GAS 2; 2-4 REGULAR / PREMIUM / RACE (the pump's key + the BRIEF grade lines); 5 HEAR IT
      (front: "Fill it up. Same level." poster; tap = flip; back: ▶ + ORIGINAL / GAS 2, "PREMIUM, GAS 140 %, both
      -11.0 LUFS"); 6 the postcard back (email on the address lines; MAIL ME THE KEYS = the card drops into the mailbox,
      SENT postmark; dummy, nothing sent).
- [x] 4. Checks: WebKit 402x714 / 375x553 / 390x664 / 393x659 / 430x750 (fits, no overflow, no page errors), flick +
      buttons + flip + A/B state + form by script (`postcards/tools/check.cjs`: 22 steps + 20 layouts pass); iOS
      Simulator (iPhone 17 Pro, 127.0.0.1) shots of every card.
- [x] 4b. The end page (Dan 2026-10-29: "in the end page the user will reach the right side of the desktop page, the words
      will pop out and everything"): after the last card (flicked, next, or mailed) the lens pulls focus onto the
      desktop's right side and page-b's readings pop as after the drone lands. Checks: 24 steps + 30 layouts pass.
- [x] 4c. The review page (Dan: "open a bench so i can comment on every section of this page"): artifact
      https://claude.ai/artifact/6zn14ha4qswV1gmCb8v3qG, a notes box + pins + ▶ Live per screen, notes in its db.
- [x] 5. Dan's notes in the review page (2026-10-29 21:03, pasted + `notes` in the db; the pins drawn on the shots).
- [x] 6. Commit my files by path on the branch; no push (Dan's word; main = live).

## Round 2 — Dan's notes (plan OK'd 2026-10-29: he picked "deck buttons" for the vinyl; textures drawn in code, no spend)
- [x] 7. Grade cards 2-4: the plugin key goes (①); the script + big lettering centred on the card, the sunburst behind
      them (②); the line under them in the lettering's face, Oswald caps (③).
- [x] 8. Mail card: the two empty address lines go (①②); the email bigger (③④); MAIL ME THE KEYS = a rubber stamp, a
      station / ticket stamp in ink, not a button: tap = it stamps, then the card goes in the box (⑤); a checkbox with
      the site's own consent words, unticked (⑥: "Also send me new-plugin drops and demo codes (optional)").
- [x] 9. End page, mailed: a vintage "TO THE WEBSITE" ticket pops up after the readings, to revaudio.net/store. The end
      page itself is ✓ (frozen).
- [x] 10. HEAR IT back = a turntable seen from above: tap the record = the needle drops and it spins; ORIGINAL / GAS 2 =
      the deck's two speed-style buttons (switch while it plays); the tonearm creeps in with the song (= progress).
- [x] 11. Overall: worn, sun-faded stock + edge wear on every card, each its own (card 1 tape, Regular a coffee ring,
      Premium a gold seal, Race a grease thumbprint, HEAR IT ring wear, the mail card a crease + dog-ear); more alive:
      the lettering pops as its card comes up, the sunburst turns slowly, the postmark thumps, dust in the lamp light.
      Textures made in `postcards/tools/make-wear.py` (numpy, no spend).
- [x] 12. check.cjs updated + all pass; re-shoot; review page round 2 (his note + what changed per screen, fresh
      boxes) republished to the same URL; commit by path; handoff.
- [x] 13. Dan's round-2 notes (2026-10-29 23:48, pasted): one note, on HEAR IT's back.

## Round 3 — Dan's note on the back ("an animation of the vinyl working ... less like a post card, more like a whole
   picture, real vinyl"; his message opened with "commit" = go)
- [x] 14. The back = one photo of a turntable seen from above (`make-deck.py`: walnut + brushed aluminium, no spend);
      it runs while it's up (platter at 33 1/3, strobe dots, the lamp's streak on the grooves stays put); tap the record
      = cue up, swing in, needle down, the song starts as it lands; tap again = home. Keys, fine print, label-maker tape.
- [x] 15. check.cjs 29 steps + 30 layouts pass, 0 errors; review page round 3 = version 5 at the same URL; commits by
      path (`b05c079` + the review/handoff one); no push.
- [x] 16. Dan's round-3 notes (2026-10-30 13:15, pasted, + "if you need to create more assets ... please do so").

## Round 4 — Dan's round-3 notes, all on HEAR IT
- [x] 17. Front: TURN IT OVER in HEAR IT's letters, bigger, nodding with the curl. Back: real keys (ivory piano keys in a
      graphite escutcheon, rendered from a height field in `make-deck.py`, no spend; press click, latch clack, haptic
      tick); TAP THE RECORD = a die-cut sticker (slapped on, peels, glints, plays the record too); no fine print; a
      smaller Turn knob.
- [x] 18. check.cjs 30 steps + 35 layouts pass, 0 errors; review page round 4 = version 6; commits `bf71096` + the review
      one; no push.
- [x] 19. Dan, 2026-10-30: "looks amazing ... the vinyl looks crazy ... i really like the buttons". The keys saved for
      reuse in the shared repo (`collaboration/handoffs/2026-10-30-piano-keys/`: kit + handoff + memory
      `feedback_ivory_piano_keys_liked`, pushed `959b947`); "commit everything and push it": this branch pushed (not main).
- [x] 20. Dan (chat): "the readings should be glued to the card itself ... physics-wise": no arrival pops, no moving
      print (sunburst, lamp flicker, the nod); `22d779e`, DESIGN.md §6. Review page round 5 = version 7 (card 6 back: it
      had dropped out in round 3).
- [x] 21. Dan (chat): "back is left to right, and front is right to left", the station too: `743e67f`; review page round 6
      = version 8.
- [x] 22. Dan's round-6 notes (2026-10-30 14:29, pasted; all on HEAR IT's front): no red level line in the poster,
      the readings crisp (the wear under the print), TURN IT OVER up under the line and centred: `55cc52f`; review page
      round 7 = version 9.
- [x] 23. Dan (chat): "the card moves is not smooth yet ... everything that moves needs to be smooth": measured on a
      4x-slowed CPU, fixed (`1065d59`: let-go motion at the finger's speed, no repaints mid-move, heavy work at idle,
      the turn at one speed); worst frame 417 -> 33 ms. Review page round 8 = version 10.
- [x] 24. Dan on his iPhone (LAN link http://10.0.0.5:4470, a no-store server bound 0.0.0.0 from the session's
      scratchpad): no vinyl animation, the buttons don't move the cards, not smooth = iOS Reduce Motion (all of it was
      switched off for it). `c22bab5`: the hand's moves survive it, calmer; the held card leans with its speed. A temp
      check page `tools/_gas2-scene/motion-check.html` (git-ignored, not committed). Review page round 9 = version 11.
- [x] 25. Dan (chat): "check your work and do a ponytail on it": `205661d` - no card jumps when something takes it over
      (‹ mid-throw, › right after ‹, a tap or a layout while a card springs home, a flick inside one frame), the strobe
      still under Reduce Motion; dead code, CSS and unused art cut. Pixel-identical states, check.cjs 41 + 35 pass.
- [ ] 26. Dan's word from the phone (and the check page: Reduce Motion on or off?).

# GAS 2 drone descent (branch `feat/gas2-drone`, 2026-10-28, revaudio-59) — SCENE + BENCH BUILT, art next

Plan page: https://claude.ai/artifact/NnyBRQchpWfY541CZA1Unn. How it works + bench: `tools/_gas2-scene/drone/README.md`.
Dan's order (2026-10-28): finish the scene with placeholders first, then generate the real elements (OpenAI or Higgsfield).

## Steps
- [x] 0. Dan's answers: the page's own world; roof text "CATCH YOUR COUPON" (he wrote "catch your compon"); car in the
      hover shot; try three hover angles in a bench (top / 45 front / 45 right); no flying back up.
- [x] 2. Flight engine in `tools/_gas2-scene/drone/`: scroll runway, three paths, exact TOP landing, hand-off.
- [x] 3. GAS 2 pop: GAS2 springs out (blur + overshoot), the rule draws, then tagline / button / "Fill it up." pop fast.
- [x] 4a. The car (placeholder box car): right to left once per load, roof board readable from the hover.
- [x] 5a. QA (headless Edge, 1440x900 + 390x844, all three angles): page after landing = `?drone=0` (mean 0.00);
      exact landing frame vs the page scene 2.55 / 1.47; no errors; classes, runway and layer gone, scroll 0.
- [x] 1a. Camera bench (`?cam`): free hover camera + landing timing, one exact path for every angle.
- [x] 1. Dan picked the camera: the default (TOP), 2026-10-28.
- [x] 4b. Real art (Dan OK'd 2026-10-28; ~$1.50, 3 gpt-image-2 images: aerial, close road, car; `drone/README.md` "The art"): near road under the frame (fixes the seam + the close-up
      asphalt), roof + field aerial, the car (top-down sprite). The roof board stays text-only until Dan names a real
      Paddle code and what catching it does.
- [x] 4c. Dan, 2026-10-28: the roof sign photographed into the car (~$0.50, `drone/tools/sign-guide.py`) and the sidewalk
      blockout props (the "css" boxes in the descent) removed. Landing still exact.
- [x] 4d. Real headlight beam + contact shadow; catch the car = the coupon ticket + CATCH10 copied (Dan, 2026-10-28).
- [x] 4f. Scroll cue (Dan, 2026-10-29: "an indicator at the bottom of the hover that tells the user to scroll down; give
      me options in a bench"): `drone/cue.js` + drone.css, bottom centre of the hover, in after the hover shows, out with
      the first scroll. Bench `?cue`: Chevrons / Mouse (Swipe up on touch) / Ticket / Fuel drop / Altimeter (live height,
      stays until near touchdown) / None. Dan picked CHEVRONS (2026-10-29); the other looks + the bench are out.
- [ ] 4e. Gil: the Paddle discount CATCH10, 10% sitewide (RevTasks #193). Gate: the page stays off main until it exists.
- [ ] 5b. QA again + 1141x636, WebKit, reduced motion, no-WebGL, weight <= 2.5 MB, frame time.
- [ ] 6. Dan's Safari + phone look; handoff, commit, push the branch (never main).

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
