# Home TV QA, 2026-11-11 (feat/tv-sells production build, `astro preview` on 127.0.0.1:4491)

Dan: "summon agents to test and check the home tv and see that everything works well in real world and real internet
and that all the buttons work and clickable and everything do what it suposed to". Roster approved by Dan.

- Three Opus testers, each with its own headless browser (Chromium + WebKit) through `qa-helper.cjs`. Everything
  outside 127.0.0.1 was blocked: the licence worker answered fakes (ok / fail / slow / down), Paddle was a recorder,
  and analytics were blocked.
  - laptop: 1141, 1280, 1440, 1728 and 860 wide
  - phone: 390, 360, 375 and 393 wide, plus landscape
  - internet: slow 3G, fast 3G and 4G, with the CPU slowed 4x; WebKit with 150 ms latency
- Main's own checks: the iPhone 17 Pro Simulator (real Safari) at the list, GAS 2 and DRIFT, and a re-check of every
  major finding.
- Result: no blockers; 7 major findings (5 loading, 2 layout), 14 minor, 12 nits. Once loaded, everything a visitor
  does works: every row, key, sign-up path, deep link, Back/Forward, the cart and the checkout call.
- Verified by main:
  - N1, N2 and N5: `global.css:94` hides `[data-reveal-item]` until reveal.ts runs, and the hidden rows stay live
    links.
  - N4: `WordWall.astro:2023` hides unlit panels with `visibility: hidden` and their images are lazy, so a laptop
    loads all five pictures.
  - L1: at 1280x665 the TV is 635.9 px tall in 624 px of room, in both engines.
  - L2: at 860 wide the cookie banner is 325 px (Chromium) and 366 px (WebKit) tall, its text squeezed into a narrow
    column.
  - P1: `WordWall.astro:1599`. `history.back()` fires popstate, which lights the plugin of the older entry.
  - P3 and N11: seen in the Simulator.
- Unverified: P4 (the iPhone keyboard over the email field, an assumed keyboard height) needs a real iPhone.
- Files: laptop.json, phone.json and internet.json (each with "tested", "findings" and "scripts"). The screenshots
  stayed in the session scratchpad.
