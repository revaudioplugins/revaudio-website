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
- [ ] Dan picks + tunes on the bench -> "apply ww bench" -> bake -> commit. Push only on "push".

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
