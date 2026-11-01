# Persona P1 Maya (bedroom producer, iPhone 13) - 2026-11-01

Persona agent report, returned as text and saved by the orchestrator (`revaudio-b5`). Screenshots + scripts:
laptop 1 scratchpad `C:\Users\shlik\AppData\Local\Temp\claude\c--Revaudio\9a45622a-182f-481b-ae66-7bfc8dc8c798\scratchpad\personas\p1-maya\`.
Site: the branch build (`astro preview`, 127.0.0.1:4393), live endpoints and trackers route-blocked.

## 1. Who / device
Maya, 24, trap/R&B in FL Studio (Windows), tapped through from an Instagram reel on the bus; never heard of the brand; hates phone forms; burned by "free" plugins that wanted a card. iPhone 13 390x844 DPR 3, isMobile + hasTouch, iPhone Safari UA. WebKit laid the page out but the first screenshot hung on "waiting for fonts": every screenshot is Edge with the same settings. Fence held (the register POST to the worker aborted; Paddle, CF Insights, FB pixel, gtag aborted after Accept).

## 2. First impression
- 5 s: dark garage, "BOUTIQUE PLUGINS / ENGINEERED, THEN TUNED.", brass gauge. No plugin, price or "free" on the first screen; the TV's top peeks at y 651 under the cookie banner (696-844). The PLUGINS chip is the only clear "go here". Looks expensive and serious.
- 60 s: yes, the TV is where the plugins are. One tap on PLUGINS fills the screen with the list (categories, 4 rows: thumb, name, type, price). Scrolling works too (two swipes, it snaps), but on the first swipe the TV is an empty purple box for a second.

## 3. Pulled in / pushed away
- In: the pictures at 3x; honest prices on the list; "TRY FREE FOR 30 DAYS · Full version · no credit card"; the blurb reads well on a bus (16 px Inter, near-white); the channel colours feel like flipping channels.
- Away: GAS pop-up says "no trial clock" then "a heads-up before a trial ends"; DRIFT says FREE BETA but the key says TRY FREE FOR 30 DAYS and throws her to a form that says "YOU JOIN OUR LIST"; lots of empty glass above and below on both phone panes; she never saw a glitch.

## 4. Funnel (Edge, iPhone 13)
1. Land on `/`; banner covers the bottom 148 px; Accept (1 tap).
2. PLUGINS (tap 2): the TV fills the screen, list pane.
3. REVLIMITER (tap 3): 158 px empty above "‹ ALL PLUGINS", ~158 px empty below "PRODUCT PAGE ->"; $49 + Try read at a glance.
4. TRY (tap 4): the pop-up; clear copy; 16 px field (no iOS zoom); the email auto-focuses (`email.focus()`, TrialGateModal.astro:193), so a real iPhone likely opens the keyboard at once.
5. Type + SEND (tap 5): "Network hiccup" (expected: blocked).
6. Real phone: Mail (tap 6), link (tap 7) -> the product page with Mac/Windows installers she can't use on an iPhone.
7. The real download happens days later on her PC, if she remembers.
Back works both ways ("‹ All plugins" keeps the scroll; history back clears `?plugin`). GAS: also 5 taps to "link sent".
Drop-offs: (a) GAS on "heads-up before a trial ends"; (b) DRIFT on "you join our list"; (c) everyone after "check your inbox": nothing says "open this on your PC".

## 5. The plan
1. Type: A keeps today's comfort; B at 16 px on a 350 px column = ~35 chars a line (3 lines -> 5-6); C hardest on a moving bus.
2. Glitching reading: fine at 12-25 s / 150 ms; keep the price and "no credit card" out of the picker (trust words never jitter).
3. On-screen form: on a phone the pane is already the whole screen, so pop-up vs pane feel alike; the win is staying in the TV. Risks: iOS keyboard (visual viewport shrinks, the scroll lock + Lenis fight the focused field; the form ~400+ px vs ~460 px above the keys); two 13x13 boxes with a thumb, links inside the label = a miss opens a tab; Mail and back may reload the tab (the check-inbox state lost, `?plugin` survives). Missing: "We'll email the link. Open it on your Mac or PC."
4. D5: C is useless on an iPhone (desktop installers). A and B both work; the copy "open it on your PC" decides. B never mentions the mobile note for someone who taps the verify link on the phone.
5. Second key: yes, she wants to hear it before giving an email (the product pages have the AudioDemoRack).
6. Phone fix: needed, bigger than planned (the list pane has 204 px empty too, and the gap below remains).
Votes: D5 B (+ "open on your Mac/PC" for phones); D6 the line, not the box; D7 "HEAR IT FIRST ->" (or "HEAR IT ->"); D8 A.

## 6. Download / buy
GAS: yes, if the pop-up stops talking about a trial that ends. RevLimiter trial: maybe. Radio Roulette $19: the one she'd buy after trying, at the PC. DRIFT: confused (beta or trial?), the forced list sign-up pushes her away.

## 7. Findings
1. HIGH - GAS pop-up contradicts itself ("Free forever... no trial clock" vs notice "a heads-up before a trial ends"). Evidence 11-modal-gas-edge.png (`.tg-notice`, 390x844). mock_only false. TrialGateModal.astro:81 (static notice; the free branch at 174-183 swaps title + sub, never the notice). Fix: swap the notice when `data-gate-free`.
2. MEDIUM - empty glass on both phone panes, top and bottom, per plugin: list pane `.ww-osd` top 262 vs `#plugins` 58 (204 px); panels (`[data-ww-back]` - TV top) RevLimiter 158, DRIFT 138, Radio Roulette 124, GAS 70; RevLimiter ~158 px empty below `.ww-more`; first sight on scroll = an empty purple box. Evidence 03-after-chip, 05-revlimiter-panel, 12-drift-panel, 02-scroll-1. WordWall.astro phone media query (~2040). Fix: top-align both panes on phones (or let the TV's height follow the content); fixing only the top moves the gap to the bottom.
3. MEDIUM-HIGH - phone visitor, desktop installers, no "open it on your PC" in the form, the sent state or plan steps 3-4 (the mobile note shows only in the ready state). mock_only true (plan) + false (copy). Fix: on coarse pointers say "We'll email the link. Open it on your Mac or PC." on the form and CHECK YOUR INBOX; carry the mobile note into the TV's ready keys.
4. MEDIUM - pop-up auto-focuses the email; with a keyboard (Chromium approximation 390x464) SEND is clipped (dialog bottom 445, submit bottom 461); the × is 23x34. TrialGateModal.astro:193 (226 already skips focus on coarse). Fix: no autofocus on coarse pointers, 44x44 ×; the on-screen form keeps its key reachable with the keyboard up.
5. MEDIUM - DRIFT: "FREE BETA" vs "TRY FREE FOR 30 DAYS / Download by email"; the key goes to `/drift#try` whose form says "YOU JOIN OUR LIST" (others make the list optional). Evidence 12-drift-panel, 14-drift-try-landing. Fix: one word for DRIFT's deal; the on-screen DRIFT form uses the same optional newsletter box.
6. MEDIUM - D6: a required box is the wrong control for a thumb (native box 13x13; label 284x41 is the real target; links inside the label). mock_only true. Fix: "By sending you agree to the Terms and EULA" under the key; if a box stays: 44 px rows, links outside the label.
7. MEDIUM - step 3: one-screen TV + scroll lock + iOS keyboard; the full form doesn't fit above the keys. mock_only true. Fix: on phones field + key first, boxes + notice below; a real-iPhone keyboard check as a hard gate in step 7.
8. LOW-MEDIUM - the cookie banner covers the TV's bottom 148 px; GAS's FREE DOWNLOAD key (722-774) sits wholly under it until dismissed (geometry; no shot). Fix: a slimmer phone banner (~90 px) or keep the key above it while it shows.

## 8. Approved-look pushback (owner decides)
- Hollow unlit names read greyed out / unavailable at phone size; only DRIFT looks "on".
- The hero sells no plugin: one line near the chip ("4 plugins · 2 free to try").
- The floating cart button overlaps the TV glass bottom-left on the panels and looks part of the set.
- "‹ ALL PLUGINS": 12 px mono, 28 px hit area: small for a thumb.

## 9. Not tested
WebKit pixels / a real iPhone; the real iOS keyboard; glitches (the `ww:glitch` hook showed nothing on the pixels; the 12-25 s clock not waited out); the Mail round-trip, verify link and ready keys; Radio Roulette's pop-up; categories; landscape; reduced motion / high contrast / VoiceOver; product pages beyond the DRIFT jump; checkout and cart.
