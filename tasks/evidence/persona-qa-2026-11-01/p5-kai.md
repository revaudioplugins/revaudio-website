# Persona P5 Kai (free-plugin hunter, Windows laptop) - 2026-11-01

Persona agent report, returned as text and saved by the orchestrator (`revaudio-b5`). Screenshots, scripts, logs:
laptop 1 scratchpad `C:\Users\shlik\AppData\Local\Temp\claude\c--Revaudio\9a45622a-182f-481b-ae66-7bfc8dc8c798\scratchpad\personas\p5-kai\`.
Site: the branch build (127.0.0.1:4393), live endpoints and trackers blocked (register / download POSTs show "Network hiccup").

## 1. Who / device
Kai, 19, FL Studio on a Windows laptop, came from a "best free VST 2026" list for GAS. Edge headless 1366x768 DPR 1. No WebKit.

## 2. First impression
- 5 s (01-land-5s.png): brass gauge + "ENGINEERED, THEN TUNED." + cookie bar; nothing above the fold says free / GAS / a plugin (DOM check: no "free", no "GAS" visible). Only route: the gold PLUGINS.
- ~10 s, 7 wheel notches (02-tv-arrive.png): "oh, it's a store" in ~1 s: names, thumbs, categories, a FREE tab.
- ~1.5 s later (03-tv-settled.png): the TV blurs behind "BEFORE YOU GO BROWSING… GET 10% OFF YOUR FIRST ORDER".

## 3. Pulled in / pushed away
- In: the TV "looks sick" (frame, channel colours, outline names); FREE is one click and lights GAS by itself; the GAS key is obvious ("FREE DOWNLOAD · Mac + Windows", 05-gas-lit.png); channel changes fast (the key fully on ~470 ms after the click); one natural glitch caught in a 30 s idle, a red/cyan fringe on REVLIMITER (12-natural-glitch-1-name.png): subtle, alive, never in the way, not mistaken for a bug.
- Away: the 10% pop-up on arrival; the email wall behind "FREE DOWNLOAD" (not announced); the "check your inbox" dead end; never reads blurbs (GAS: 6 lines in a narrow column).

## 4. Funnel (desktop, today)
| # | Action | Clicks | Note |
|---|---|---|---|
| 0 | Cookie bar | 0-1 | doesn't cover the GAS key (banner top 650, key bottom 582) |
| 1 | Reach the TV | 1 (PLUGINS) or 7 notches | glide 674 ms; wheel ~2.7 s |
| 2 | 10% pop-up, × | 1 (forced) | fired on both routes at scrollY 780, ratio 0.354 |
| 3 | FREE (lights GAS) or the GAS row | 1 | ~1 s |
| 4 | FREE DOWNLOAD -> modal | 1 | focus already in the field |
| 5 | Email + Send | 1 + typing | ~6 s typing; "Check your inbox" (08, success simulated) |
| 6 | Inbox trip | ~3 | delivery wait + spam risk |
| 7 | /gas "EMAIL VERIFIED, DOWNLOAD GAS" (09) | 0 | a different page from the TV |
| 8 | Windows | 1 | MACOS has the focus ring on Windows |
Total today: 9 clicks + typing + the email wait (cookie bar excluded); ~30-40 s on site. Drop-offs: step 2 for some ("it's free, why my email?"), step 5 for most ("FREE DOWNLOAD" = email + inbox), between 5 and 6 most of all (five other tabs with direct freebies; mail not there in ~20 s = gone).
Upsell: the desktop list shows no price / free marker (`.ww-rprice { display:none }`, WordWall.astro:1475; prices are in the DOM). On FREE -> GAS he never sees $49 / $19. DRIFT lit first: "FREE BETA" next to "TRY FREE FOR 30 DAYS · Download by email" = two deals; DRIFT is not under FREE (FREE = `["gas"]`). DRIFT's Try leaves for `/drift#try` (17), where "STREAM IT. GET DRIFT FREE." + 20 % affiliate is the real hook; nothing on the TV hints at it.
/gas: Ctrl+click on the row opens a tab (good). /gas gives what the TV doesn't (16): "VST3, AU, AAX · WINDOWS & MACOS · NO LICENCE KEY, WE EMAIL YOU THE LINK", a 2:46 manual video, the GAS Mixer (hear it: "does it slap?" is his only question). The TV's way there is a 12 px "PRODUCT PAGE ->" link (122x30), noticed only because he looked.

## 5. The plan
1. Type: neutral (he doesn't read the blurb); a shorter blurb helps more than a new font.
2. Glitching: fine on 12-25 s; never the price or the key.
3. On-screen form: right idea, but room at 1366x768: paid panels' text column 554 px wide, starts at y 464-484, the TV ends at 730 = ~250 px; today's form (label to SEND) ~225 px tall at ~374 px wide without title, terms box or Back; GAS's column is 192 px wide (blurb 6 lines, words 3 lines). The plan never mentions the 10% pop-up. The notice reused as is says "trial ends" on free GAS. Moving DRIFT onto the TV form with an optional box changes DRIFT's consent rule: the owner decides on purpose.
4. Download: A and B leave the inbox trip (his biggest drop-off) untouched; B adds and saves no clicks and may add the power-on + glide before the keys; only C removes the trip.
5. Second key: helps; "HEAR IT" gets his click (/gas has the GAS Mixer, `[slug].astro` the AudioDemoRack; DRIFT's page audio not confirmed): per plugin, "FULL DETAILS ->" as the fallback.
Click model (mock_only): Today 9; A 10-11; B 10-11; C 7-8 (with a required terms box + a retry when skipped). With D6 as a line: A and B stay 9, C 6. Fixing the pop-up takes 1 off every column.
Votes: D5 C for GAS, B for the trials (the cost of C on GAS: unverified leads; an owner trade). D6 a line under the key (the site's fastest form is /drift#try: one field, one key, one line). D7 "HEAR IT ->" where the page has audio, else "FULL DETAILS ->". D8 A (mono / VT323 set wider; GAS's 192 px column); B second for the price and the five words only.

## 6. Download / buy
GAS: yes if the link arrives fast; 50/50 with an inbox wait. DRIFT: would try the free beta; "stream it, get it free" is his thing, but the TV never says so. Buy: Radio Roulette at $19-25 after hearing it; RevLimiter $49 is not for him now.

## 7. Findings
1. HIGH (blocker for free seekers) - the 10% pop-up blurs the TV ~1.5 s after arrival on both routes (03-tv-settled, 11-plugins-link-then-popup; open at scrollY 780, ratio 0.354, 1366x768; 0.354 clears 0.35 by a hair here; main / live not compared). source_ref `src/components/WelcomeDiscountPopup.astro` (l.31 excludes only /thank-you, /drift, /buy/; l.67 `SCROLL_THRESHOLD = 0.35`; l.96 arms after 2 s). Fix: never on home or /gas (or while the TV is on screen); add it to Phase 5.
2. HIGH - the email gate is unannounced on the TV: "FREE DOWNLOAD · Mac + Windows" opens an email form; /gas says "WE EMAIL YOU THE LINK" and gas.astro's header says the gate must be "a known cost and not a surprise at click time"; DRIFT's key does say "Download by email". source_ref `src/data/library.ts` tryAction. Fix: sub-label "Mac + Windows · link by email"; better, D5 C for GAS.
3. HIGH - step 3's form won't fit the text column at 1366x768 (~250 px left on paid panels; GAS 192 px wide; the form alone ~225 px). mock_only true (form), sizes measured (measure3.cjs, 06-gate-modal.png). source_ref `.ww-info`. Fix: one field + one key + the terms as a line; let the form take the picture's area, not only the text column.
4. MEDIUM - no price / free marker in the desktop list; DRIFT missing from Free (02, 04; `.ww-rprice` display:none; library.ts `catsOf` from `isFree` only). Fix: the small price tag on desktop rows; open free trials / betas under FREE or a "FREE TO TRY" label.
5. MEDIUM - DRIFT's mixed message + its Try leaves the TV (02, 17; library.ts `priceLine` / `tryAction`). Fix: one wording ("FREE 30-DAY BETA"); a one-line "stream it, keep it free" teaser on the TV.
6. LOW - the free notice promises a trial-end heads-up (TrialGateModal.astro:81). Fix: a per-plugin notice.
7. LOW - the verify landing focuses MACOS for a Windows visitor (09; openReady `first.focus()`). Fix: focus / highlight the visitor's OS; same for the TV keys in B / C.
8. MEDIUM - "Check your inbox" is a dead end: no resend, no "wrong email?", no spam hint (08; `[data-tg-status]`). Fix: "Not there in a minute? Check spam · Resend · Wrong email?".

## 8. Approved-look pushback (owner decides)
- Under FREE the left half is one lonely row in empty glass (05): looks broken, not filtered.
- GAS's text squeezed into a 192 px strip at the far right; the five words wrap into 3 lines.
- The hero says nothing about plugins or free stuff.

## 9. Not tested
WebKit, phones, touch; keyboard / screen reader; real email + verify (landing simulated with a fake `#dl`; download POST blocked); cart / checkout; /gas audio and video; main / live comparison (whether the 10% pop-up hits the TV on main too); forced glitches beyond the one natural name glitch; other viewports.
