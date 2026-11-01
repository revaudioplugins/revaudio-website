# Persona P2 Daniel (mixing / mastering engineer, MacBook) - 2026-11-01

Persona agent report, returned as text and saved by the orchestrator (`revaudio-b5`). Screenshots + scripts (s1-s9):
laptop 1 scratchpad `C:\Users\shlik\AppData\Local\Temp\claude\c--Revaudio\9a45622a-182f-481b-ae66-7bfc8dc8c798\scratchpad\personas\p2-daniel\`.
Site: the branch build (127.0.0.1:4393); blocked: static.cloudflareinsights.com, cdn.paddle.com, the licence worker.

## 1. Who / device
Daniel, 41, 15 years mixing/mastering; owns Pro-L 2, Pro-Q, UAD, Soundtoys; came from a Google search for "mastering limiter plugin"; buys on sound, specs, trust. WebKit 1440x900 DSF 2 first: every screenshot and click hung ("waiting for fonts", a harness hang, not Safari evidence); Edge with the same settings for pixels, WebKit for DOM reads only (they matched: cold load scrolls to #plugins at 798, DRIFT lit, `.ww-more` 122x30 at 12 px). Passes: 1440x900 and 1280x720, DSF 2.

## 2. First impression
- 5 s: a broken TV listing four plugins with screenshots, DRIFT lit; reads as a catalog at once. The banner covers the TV's lower band at 1440x900; the key row stays visible. Declined (01-edge-1440-land-5s.png).
- 60 s: MASTERING -> only RevLimiter; read the blurb, $49, "Try free for 30 days · Full version · no credit card"; then wanted formats, Apple Silicon, a demo and licence terms: the TV gives none; clicked the screenshot to go deeper: nothing (05, 08).

## 3. Pulled in / pushed away
- In: serious screenshots (LUFS, GR, crossover, oversampling); the channel change ~400 ms reads like a TV, not loading (03-edge-1440-change-110ms.png); "Full version · no credit card"; 1280x720 fits.
- Away: no specs on the panel (formats, OS, iLok, machines, refund); no way to hear it from the TV; picture, name, price are dead clicks; the five words are adjectives, a pro wants facts (true-peak, oversampling, LUFS).
- Glitches today: charming, not a gimmick (one roll in ~26-40 s at 1440; none in 26 s at 1280; they hit unlit names and the glass). The one he'd change: the picture tear lands on the GUI he's studying (07-edge-1440-glitch-picture.png).

## 4. Funnel (RevLimiter, 1440x900)
1. Land with DRIFT lit ("Free beta" panner): not what he searched for (0).
2. Decline (1). 3. REVLIMITER (2).
4. Three dead clicks, URL unchanged (s6-deeper.cjs): the screenshot (`.ww-ui`), the name (`.ww-pname`), the lit row again (`cursor:pointer`, `<a href="/revlimiter">`, taken over by the script). Friction #1.
5. Notices "PRODUCT PAGE ->" (6 clicks), ~10-20 s (estimate) after one or two dead clicks: 122x30 vs Try 241x51 (~3.4x less area), 12 px mono in the five words' ink (rgb 255,157,82), no underline until hover: reads as a tag, not a link.
6. /revlimiter top: the strip he wanted on the TV: "HEAR BEFORE/AFTER · FREE 30-DAY TRIAL · $49 · 2 MACHINES · 14-DAY REFUND · NO ILOK" + true-peak at oversampled rate (10-edge-1440-rl-top.png).
7. "Play RevLimiter" works: before/after m4a load (206), play in sync, 85 s (17). (7 clicks)
8. The 10%-off pop-up covers the Driver's Manual (13); close (8). Friction #2. The manual is a video only (no PDF / parameter reference). System requirements: "VST3, AU, AAX · Windows 10/11 64-bit, macOS 12+ · CPU 2 GHz dual-core (Intel/AMD)": nothing on Apple Silicon; on an M-series Mac he stops there. Friction #3. /about names no people (values, Tel Aviv address, info@): costs some trust.
9. BUY NOW (crane door) -> the cart: $49.00 · VST3, AU, AAX, a required "I have read and agree to RevAudio's Terms, Licence & Privacy", "Continue to payment". Clean. Stopped. (9 clicks; 14-edge-1440-buy-1800ms.png)
10. Try from the TV: pop-up (email, optional box, SEND MY LINK): 2 clicks + typing after lighting. "Download 30 days free first" reads oddly: "Try it free for 30 days".
Drop-off: not on the TV but in the 10-20 s hunting for the way deeper; or Try blind without knowing about Apple Silicon.

## 5. The plan
1. Type: clean Inter reading as "a page over the TV" is a feature for him (trustworthy copy). A bitmap face on a $49 mastering tool reads toy-like; long VT323 text is slow.
2. Glitching reading (mock_only): hurts; a $49 that jumps 3 px with red/cyan fringe looks like a broken render; it works today because what he reads holds still. At most the lit name; never the price, specs or blurb.
3. On-screen form: good if it states what you get (macOS + Windows installer, VST3/AU/AAX), keeps "no credit card" and the service line. Backfire: one more required box on a free trial; legal text in VT323.
4. D5: for him the email link is better landing on the product page (installer, requirements, install steps, manual).
5. Way deeper: helps him most; also a second click on the lit row opens the product page.
Missing for a pro: a one-line specs / terms strip on the lit panel (reuse the product page's hero strip); a way to hear it from the TV; a BUY $49 key for paid plugins; optionally the version / last-updated date.
Votes (mock_only): D5 A (B is a live-worker change for charm; C hands downloads to fake emails). D6 a line (he ticks a required box at the cart already; FabFilter-style trials don't ask). D7 "HEAR IT + SPECS ->" (or "DEMOS + SPECS ->"). D8 A (B only for a specs strip / price line; C reads like an arcade).

## 6. Download / buy
Download: yes, the RevLimiter trial (full, no card, no iLok, 2 machines). Buy: $49 after the trial, only if Apple Silicon is confirmed in writing; the before/after demo earns the trial click. Neither the demo nor the iLok/refund facts are findable from the TV alone.

## 7. Findings
1. HIGH - the lit plugin gives no specs or terms; the product page hero has exactly that strip (05, 10). source_ref WordWall.astro `.ww-info` (280-307). Fix: one mono line under the five words, e.g. "VST3 · AU · AAX · MAC + WIN · NO ILOK · 2 MACHINES · 14-DAY REFUND".
2. HIGH - the way deeper is easy to miss and the natural clicks are dead (`.ww-more` 122x30, 12 px; picture, name, price and the re-clicked lit row do nothing; the lit row shows a pointer). Evidence s6-deeper.cjs, 06-edge-1440-buy-row.png. source_ref WordWall.astro :244 `.ww-ui`, :282 `.ww-pname`, :210-215 `.ww-row`, :305 `.ww-more`. Fix: step 5 + a second click on the lit row goes to `/<slug>`.
3. MEDIUM - nothing to hear on the TV (the product page's before/after works). Fix: a small "▶ HEAR IT" on the lit panel playing the same pair, or the second key's words promise audio.
4. MEDIUM - glitching the reading would cost pro trust (mock_only; plan step 2); the picture tear already lands on the GUI (07). Fix: the lit name at most; never price, specs, blurb.
5. MEDIUM - no Buy on the TV for a paid plugin ($49 shown, the only key is Try; ~5 extra clicks via the product page + crane). source_ref `.ww-buy` (:292-306); the cart accepts `[data-add-to-cart][data-cart-open]` (Cart.astro:606-627). Fix: a BUY $49 key on paid plugins opening the existing cart.
6. MEDIUM - Apple Silicon not stated ("CPU 2 GHz dual-core (Intel/AMD)", "macOS 12+"). source_ref src/data/plugins.ts:207-208, support.astro:64. Fix: "Apple Silicon native + Intel (universal)" once confirmed for the shipped build.
7. LOW-MEDIUM - a limiter searcher lands on DRIFT (WordWall.astro:178 `data-ww-on={first}`); `?plugin=revlimiter#plugins` deep-links fine. Fix: send limiter search / ad traffic to `/?plugin=revlimiter#plugins` or `/revlimiter`.
8. LOW - the 10%-off pop-up interrupts the specs read on /revlimiter at 35 % (WelcomeDiscountPopup.astro:67). Fix: later on product pages (after the specs) or exit only.

## 8. Approved-look pushback (owner decides)
- Keep glitches off the lit plugin's screenshot (the image a pro studies).
- Two or three facts beside / instead of the five adjectives ("TRUE-PEAK · 8x OS · LUFS METERS").
- The huge outline names (Radio Roulette ~800 px wide) spend half the screen on four items; won't scale.
- On /revlimiter the BUY NOW crane door never sits still (Playwright: "not stable" for 30 s).
- About: one line on who builds this.

## 9. Not tested
Real WebKit/Safari pixels and clicks; phones / step 6; keyboard + screen reader; the verify link and download landing; Paddle past the cart; GAS / Radio Roulette / DRIFT pages; how the demos sound; reduced motion, high contrast.
