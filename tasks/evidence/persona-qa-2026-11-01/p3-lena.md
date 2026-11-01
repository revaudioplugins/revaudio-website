# Persona P3 Lena (privacy-minded producer, Berlin) - 2026-11-01

Persona agent report, returned as text and saved by the orchestrator (`revaudio-b5`). Screenshots, scripts, logs:
laptop 1 scratchpad `C:\Users\shlik\AppData\Local\Temp\claude\c--Revaudio\9a45622a-182f-481b-ae66-7bfc8dc8c798\scratchpad\personas\p3-lena\` (P3\ below).
Site: the branch build (127.0.0.1:4393), every outside host blocked and every POST aborted. Legal points are "for a human to confirm", not legal advice.

## 1. Who / device
Lena, 33, Berlin, Ableton on Windows, UX researcher by day; reads before agreeing, unticks boxes, uses a separate download email. Edge headless 1920x1080 DPR 1, plus 1366x768. No WebKit.

## 2. First impression
- 5 s: a full-height brass gauge hero + the cookie banner; the TV frame only peeks above the banner; only the highlighted PLUGINS nav says "plugins here" (P3\01-landing-5s.png).
- 60 s (after closing a discount popup): the TV is clearly the store; reads honestly (P3\04-tv-revlimiter.png, P3\51-tv-1366-revlimiter.png).

## 3. Pulled in / pushed away
- In: prices up front; no fake urgency, countdowns, struck prices or fake reviews (testimonials empty, `StarRating` hides at 0, no urgency words on /revlimiter, /gas); the marketing box unticked (visually and in code); a real privacy policy (controller, processors, bases, retention, rights); "Cookie settings" in the footer reopens the banner; the glitches read as character, not a hacked page (P3\60-glitch-picture.png).
- Away: a "10% off" email popup lands on the TV as she arrives and blurs the store; DRIFT's download quietly signs her up to the list; neither the modal nor the planned form links to Privacy; GAS "free forever" promises a "heads-up before a trial ends".

## 4. Funnel (1920x1080)
1. Land; Decline (1).
2. Scroll toward the TV: at 0.354 the 10%-off popup opens over the TV (P3\03b-welcome10-over-tv.png); close (2). Drop-off risk #1: email asked "before you go browsing" while browsing, no notice, no privacy link.
3. Pick RevLimiter (3), TRY (4): kicker, copy, field, optional box (unticked), service notice; no Privacy / Terms / EULA link (`links: []`). She'd detour to the footer's PRIVACY (~2 clicks).
4. Send (5): the blocked POST carried `{"email":…,"plugin":"revlimiter","marketing":false,"src_ch":"organic","src_via":"direct"}`.
5. Real flow: email (6), `/revlimiter` + Mac/Windows modal, Windows (7). ~7 clicks + an inbox trip.
6. GAS: 5 clicks; "Free forever … no trial clock" vs "a heads-up before a trial ends" (P3\09-gas-modal.png).
7. DRIFT: the TV key links to `/drift#try` (P3\71); that form says "NOTHING TO PAY TODAY … YOU JOIN OUR LIST · UNSUBSCRIBE ANYTIME" with no box (P3\40-drift-try.png). Drop-off #2. "Free beta" next to "TRY FREE FOR 30 DAYS" = unclear.
At 1366x768 the TV and the modal fit, no clipping.

## 5. The plan
1. Type: fine for the blurb; but legal lines (notice, terms, optional box) in mono / VT323, glowing and small, read as hidden fine print: keep anything legal plain.
2. Glitching: OK only if NOTHING glitches while the form is open (screen flicker / roll and the picture band too): a sign-up box flickering red/cyan feels phishy.
3. On-screen form: good (worker's exact words, unticked, notice kept, "wrong email?", DRIFT gets it). Missing: a Privacy link at the point of collection; a GAS notice without "trial ends"; DRIFT's "You join our list" line goes and the worker lists nobody without the tick; say who is asking and what you get. Trusted wording: "RevAudio will email your download link to this address, plus a few short getting-started emails (and a heads-up before your trial ends). Unsubscribe anytime. How we use your email: Privacy." Backfire: the discount popup's only guard is `dialog[open]`, so it can cover an on-screen form while she types.
5. Second key: helps a lot (specs, requirements, licence before giving an email).
Votes: D5 B (verified inbox owner gets the trial emails, the tick tied to a confirmed address, back to the TV; C mails unconfirmed third parties and weakens the consent record). D6 the line ("By downloading you agree to the Terms & Conditions and the Licence terms") above SEND; a required box beside an optional one makes people wonder if both are required; if kept: "Required", set apart, never "agree to … Privacy". D7 "DETAILS + DEMOS ->" (alt "SPECS + SOUNDS ->"). D8 A.

## 6. Download / buy
GAS yes (download-only email). RevLimiter: the trial, likely buys at $49 if it beats her limiter. Radio Roulette $19: impulse after a trial. DRIFT: no, while the download signs her up to the list.

## 7. Findings
1. HIGH - DRIFT's download bundles the mailing list: every DRIFT form says "You join our list · unsubscribe anytime", no box; privacy §4 says list emails rest on consent (GDPR Art. 7(4) freely given: for a human to confirm); "Free beta" vs "Try free for 30 days". Evidence P3\40-drift-try.png, P3\walk4-log.txt. source_ref `src/components/drift/DriftKeep.astro:59`, `DriftTrialStamp.astro:50`, `DriftVideoGate.astro:33`, `src/data/drift.ts:258`. Fix: the same unticked optional box; the worker lists nobody without it; name the line's removal in step 3.
2. HIGH - the 10%-off popup lands on the TV (scroll 0.354 at 1920x1080), blurs the store, takes an email with no notice / privacy link; also on /revlimiter at 40%; privacy §2 doesn't list it; "We also emailed it to you" (list or not: for a human to confirm). Evidence P3\03b, P3\03c, P3\walk1-log.txt. source_ref `src/components/WelcomeDiscountPopup.astro` (`SCROLL_THRESHOLD` 0.35, `[data-welcome10]`). Fix: never while the TV is in view or after a TV interaction; a notice + Privacy link; add it to privacy §2.
3. HIGH - no Privacy link where the email is collected (modal `links: []`; the plan lists Terms + EULA only). mock_only true for the plan part. Fix: "How we use your email: Privacy" (new tab) in the notice, modal and TV form.
4. MEDIUM - the GAS free notice promises a trial heads-up (`.tg-notice` static; `data-gate-free` swaps only heading + intro). Fix: free notice "We'll send a few short emails about getting started. Unsubscribe anytime."
5. MEDIUM - cookie banner: focus lands on Accept All on load; Accept filled gold + ring vs Decline a ghost in grey (rgb(138,130,117)), equal 38 px heights but unequal weight. Before any click the page requests `static.cloudflareinsights.com/beacon.min.js` (disclosed cookieless) and `cdn.paddle.com/paddle/v2/paddle.js` on home (the policy names Paddle only at checkout). An ad landing writes `localStorage ra-src` before consent. No cookies before consent; Decline sets none. For a human to confirm (ePrivacy). source_ref `src/components/CookieBanner.astro`. Fix: no autofocus on Accept, Decline equal weight, paddle.js only when the cart / checkout opens.
6. MEDIUM - plan risk: the discount popup's guard is only `dialog[open]` (`WelcomeDiscountPopup.astro:119`), so a non-dialog form isn't protected and there's no typing guard; the glitch rule doesn't pause the screen flicker / roll and the picture band (which sits right above the key) while the form is open. mock_only true. Fix: one "form open" flag that pauses all glitches and blocks both marketing popups.
7. LOW - D6 names: the plan says "Terms of Use and the EULA"; the site says "Terms & Conditions" (footer T&C) and "Licence terms" (footer LICENCE); the licence terms don't mention a 30-day trial; the cart says "agree to … Terms, Licence & Privacy" (a privacy notice is acknowledged, not agreed: for a human to confirm). source_ref `src/components/Cart.astro:110`, `src/components/legal/EulaContent.astro`. Fix: the site's page names, Privacy out of any "agree", a trial clause in the licence terms.
8. LOW - privacy policy gaps: §3 says the how-you-found-us note "is not sent to us until you check out", but §2 and the real POST (`src_ch`, `src_via`) send it with a trial sign-up; no retention period for trial emails; the discount popup missing from §2. source_ref `src/components/legal/PrivacyContent.astro`. For a human to confirm.

## 8. Approved-look pushback (owner decides)
- The first screen is all hero gauge; the TV only peeks under the banner: a one-line cue or a slightly shorter hero.
- DRIFT "Free beta" + "TRY FREE FOR 30 DAYS" = two offers: pick one.
- "PRODUCT PAGE ->" is small letter-spaced orange, easy to miss beside the bright Try key (step 5 addresses it).

## 9. Not tested
Phones, WebKit, keyboard-only, screen reader; the real email / verify flow and the worker's consent storage; what paddle.js / CF beacon / Google / Meta set; the Accept path, cart, checkout, the exit-intent popup, DRIFT's submit; the natural 12-25 s glitch cadence (single glitches via `ww:glitch`); the "JOIN THE PIT CREW" newsletter beyond its missing privacy link.
