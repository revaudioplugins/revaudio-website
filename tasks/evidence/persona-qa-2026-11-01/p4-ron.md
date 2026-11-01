# Persona P4 Ron (older eyes, keyboard, reduced motion, NVDA) - 2026-11-01

Persona agent report, returned as text and saved by the orchestrator (`revaudio-b5`). Evidence (screenshots, JSON):
laptop 1 scratchpad `C:\Users\shlik\AppData\Local\Temp\claude\c--Revaudio\9a45622a-182f-481b-ae66-7bfc8dc8c798\scratchpad\personas\p4-ron\` (<p4> below).
Site: the branch build (127.0.0.1:4393), fence on. Edge only.

## 1. Who / setup
Ron, 58, guitarist, Reaper on Windows; 150-200 % zoom, keyboard, reduce motion, sometimes NVDA. Pass 1: 640x360 CSS @4 (= 1280x720 @2 at 200 %), extra 150 % (853x480 @3) and 125 % (1024x576). Pass 2: 1280x720 @2 with `reducedMotion: 'reduce'` + a control. Pass 3: `forcedColors: 'active'`, alone and with `contrast: 'more'`. Glitch tests on a sped-up clock (`--ww-gl-min-s:1; --ww-gl-max-s:2; --ww-gl-idle-s:.5`), parked (9999) for contrast shots. At 200 % and 150 % the TV is in the phone layout (<= 860 px).

## 2. First impression
- 5 s (200 %): the cookie banner covers ~2/3 of the screen; header + the TV's top (<p4>\p1-01-land-5s.png).
- 60 s: clear once the banner is gone; big names, type words and prices read as "here are the plugins" (p1-02-tv-list, p1-06-zoom150).

## 3. Pulled in / pushed away
- In: the lit text readable at 200 % (blurb 16 px Inter ~11-12:1); big names, clear prices, Try dark on lit (7-13.5:1); reduced motion really calms it (0 glitches, plain cuts).
- Away: hollow unlit names at .62 look ghosted; lots of 12 px letter-spaced mono caps (five words, type word, categories, Product page); Try's 2nd line 10.56 px at .78; DRIFT's five words under 4.5:1; the cookie banner at zoom and the 10 % pop-up jump over the TV.

Measured contrast (text vs the screen behind it, from pixels; median / worst):
| Text at 200 % | DRIFT | RevLimiter | GAS | Radio Roulette |
|---|---|---|---|---|
| Category key unpressed, 12 px mono | 4.9-5.2 (4.7) | | | |
| Category key pressed | 7.0 | | | |
| Lit list name, 40 px | 6.5-8.0 | | | |
| Unlit list name, hollow, .62 | 3.56 (2.78) | | | |
| List type word, 10.56 px | 12.4 lit / 7.0 unlit | | | |
| Pane type word, 12 px | 5.0 (4.6) | 6.2 | 9.1 | 6.3 |
| Blurb, 16 px Inter, .92 | 11.9 (10.1) | 11.1 (8.1) | 10.8 (7.3) | - |
| Five words, 12 px mono, .85 | 4.2-4.4 (3.99) | 6.9 | 9.0 | 7.1 |
| Price, 27 px | 7.4 | 10.9 | 13.9 | - |
| Try line 1, 17.6 px | 7.3 | 10.7 | 13.5 | - |
| Try 2nd line, 10.56 px, .78 | 5.1 | 6.6 | 7.5 | - |
| Product page, 12 px | 5.2 | 7.7 | 9.3 | - |
| ‹ All plugins, 12 px | 5.4 | | | |
At 100 % DRIFT's five words measure 3.82-3.88:1 (below AA for 12 px). Method: each box shot normal and with the text transparent; text = 90th pct of changed pixels, background = median (95th) of the text-free shot. Data <p4>\p1b.json, p2m.json, pass3.json (pass1.json pane values invalid: under the 10 % pop-up).

## 4. Keyboard funnel
Tab order (200 % and 100 %): skip link, logo, PLUGINS, five menu links (invisible at 200 %), burger (cart at 100 %), ALL (11 presses), 6 category keys, the lit tab (18 at desktop). Focus starts on ACCEPT ALL (`#cookie-accept`); the first Tab goes to body. A category announces "Saturation & Distortion: 1 plugin" (polite live region). Arrows / Home / End light and move, wrapping; Space = Enter. Focus ring 2 px channel colour, 3 px offset, visible on every TV stop.
200 % RevLimiter: Enter opens the pane, focus on the `h3` with no ring; Tab -> Try -> Product page; Try opens the dialog, email focused; Tab: email -> 13x13 checkbox -> Send -> browser chrome -> Close; Esc closes, focus back on Try. Esc in the pane does nothing; Shift+Tab to "‹ All plugins", Enter returns to the list on the RevLimiter tab. No trap (PageDown scrolls on). 100 %: clean; Try has no `aria-haspopup="dialog"`. ~25 key presses to Send + typing; empty submit = only the native "Please fill out this field." (no `aria-invalid`, no own message).
Drop-offs: (a) at 200 % the banner hides everything focused (every TV stop `covered: cb-*`); (b) at 100 % the 10 % pop-up opened 0.4 s after focus reached the tablist and swallowed four ArrowDowns, an Enter and the Tabs (kbd100-05-opened.png; kbd100.json t=25017).
Semantics (ariaSnapshot): heading "Plugins"; group "Categories" with pressed toggles; the live region; tablist "Plugins" with tabs ("DRIFT stereo panner" selected); tabpanel with full alt, h3, type word, blurb, "What it does: …" (sr-only prefix), a bare "Free beta", link "Try free for 30 days Download by email" (-> /drift#try), link "DRIFT Product page". Hidden panels inert + hidden. The dialog is labelled, its field has a visible label, the checkbox the worker's words. Solid.
Reduced motion: glitches in 12 s (sped-up): control 8, reduce 0; a channel change: 22 running animations vs only colour transitions on the category keys; pane open / back at 200 %: 0.

## 5. The plan
1. Screen type: the riskiest for him. Channel colours sit ~5:1 on their screens; tinting the blurb fully would take DRIFT's blurb from ~12:1 to ~5:1 before glow and scanlines. Rules: blurb >= 7:1 (AAA) measured from pixels with the scanlines, every channel; >= 16 px; no opacity on text; the tint a hint (<= ~20 % channel colour into near-white). C (VT323, low x-height) under scanlines: he'd struggle.
2. Glitching the reading: where he'd leave. The 4 s idle gate = reading, so the 3 px jump + fringe lands on the line he reads (6 device px at 200 %). Rules: never the blurb, five words, price or anything smaller than the name; at most the lit name, not within ~20 s of a channel change; off under reduced motion, high contrast AND forced-colors; a visible "glitches off" switch on the set (WCAG 2.2.2 Pause, Stop, Hide; many never set the OS flag); purely visual (no text / aria change, RGB layers aria-hidden, no layout shift); none while the form is open or a field / panel element has focus.
3. On-screen form: better than a pop-up. Visible label above the field; worded errors with `aria-invalid` + `aria-describedby`; focus to the heading or field on open; order email -> terms -> newsletter -> Send -> Back; Esc back, focus to Try; CHECK YOUR INBOX in `role=status` and focused; 24 px+ checkbox targets with clickable labels; the field in a plain face.
4. D5 B: back on the TV where he left off.
5. Second key: needed.
6. The gap shows at 200 % on desktop too (~45 CSS px above "‹ ALL PLUGINS").
Missing: the scroll pop-up on the TV stealing focus; the cookie banner at zoom; a forced-colors glitch gate; desktop at 150 / 200 % zoom in step 7's sizes; NVDA + Windows High Contrast named in step 7.
Votes: D5 B; D6 the line (if the box: 24 px+, clickable label, worded error); D7 "DETAILS & DEMOS ->" (accessible name "RevLimiter details and sound demos"; "SEE + HEAR IT" reads oddly aloud; "FULL DETAILS ->" acceptable); D8 A keeping 7:1 (B only at 16 px+ untracked; never C).

## 6. Download / buy
GAS at once; RevLimiter trial if the form doesn't fight him. Buy RevLimiter $49 after the trial if it sounds good; maybe Radio Roulette $19. Not if the 10 % pop-up jumps in while he arrows through the list.

## 7. Findings
1. HIGH - the 10 % pop-up steals keyboard focus in the TV (opened 0.4 s after focus reached the tablist; also over the pane at 200 %). kbd100-05-opened.png, kbd100.json, p1-05-pane-buy.png. `WelcomeDiscountPopup.astro` (`SCROLL_THRESHOLD = 0.35`, `showModal(); focus()`). Fix: never while focus / pointer is in `[data-wordwall]` or after recent key input; or not on the home TV at all.
2. HIGH - at 200 % the cookie banner covers ~2/3 of the screen and focus starts on ACCEPT ALL; Decline not reached within 90 Tabs. `CookieBanner.astro`. Fix: a compact banner at narrow / zoomed widths (<= 1/3 height), early in the Tab order, no autofocus on Accept, `scroll-padding-bottom`.
3. HIGH (mock_only) - plan step 2 lands the glitch on the text being read (idle gate = reading). Fix: keep glitches off body text and the price; an on-set "glitches off" switch; forced-colors in the gate.
4. MEDIUM (conditional) - glitches fire under `forced-colors: active` alone (8 in 12 s); 0 with `contrast: 'more'` too. `still()` (~561) checks only `html.hc`. Fix: add `matchMedia('(forced-colors: active)').matches` to `still()` / `glShown()`.
5. MEDIUM - forced colours: Try loses its key shape (plain text, no border); the lit name's plate cuts the top of "MASTERING LIMITER". p3-C-forced-buy-crop.png, p3-C-forced-list-crop.png. Fix: `.ww-try` `2px solid ButtonText` under forced-colors; drop the name plate there.
6. MEDIUM - DRIFT's five words fail AA (3.82-3.88:1 at 100 %, 4.18-4.38 at 200 %; others 6.5-9); DRIFT is the first screen. `.ww-pw` opacity .85. Fix: no opacity on `.ww-pw`, or a lighter DRIFT purple for text.
7. MEDIUM - five closed-menu links are invisible Tab stops at <= 860 px (incl. 150-200 % zoom). Header nav drawer. Fix: the closed drawer `inert` / hidden.
8. LOW - small faint type around the buy row (Try 2nd line 10.56 px at .78; 12 px tracked caps); the floating cart button covers the start of "REVLIMITER" and the thumbs at 200 %. Fix: 13-14 px min, no opacity on text; keep the cart button clear of the TV pane at narrow widths.

## 8. Approved-look pushback (owner decides)
- Hollow unlit names (3.56:1, worst 2.78) read ghosted: a filled, dimmed name keeps "unlit".
- 12 px letter-spaced mono caps: less tracking or bigger.
- DRIFT's purple as the first screen: the lowest-contrast channel.
- Scanlines across the reading (keep them under the reading column, as Law 5 intends).
- No ring on the plugin name after opening a pane.

## 9. Not tested
Real NVDA speech; real Windows High Contrast; WebKit, touch; real browser zoom (emulated); DRIFT's live window under reduced motion over time; /drift#try, product pages, cart, checkout, emails; the plan's form (doesn't exist); natural glitch timing; wheel vs the scroll lock (PageDown works).
