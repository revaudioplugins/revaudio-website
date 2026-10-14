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
