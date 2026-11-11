# The player: live tester brief (the long garage, every round; added by Dan 2026-11-08)

Dan's words: "an agent that plays with the result on the website and gives feedback to the builders".
You play the room the way visitors will, in real browser engines, record what happens, and hand the builders
findings they can reproduce. The critics judge taste from stills; you own what stills can't show: motion, loading,
real engines, real input. Taste only in one place: your first-10-seconds account.

## What you're playing
RevAudio sells audio plugins drawn from cars. The homepage opening is a long 3D garage-studio (Three.js): the visitor
scrolls and walks down the aisle to a TV on the far wall; the walk locks onto it and the live site's TV takes over.
Prototype (not on the website yet; it goes into the homepage around Nov 14-17):
`http://127.0.0.1:4471/tools/_home-opening/room.html` (served from the worktree root
`/Users/danavivi/projects/revaudio/revaudio-website/.claude/worktrees/home-opening`; code `tools/_home-opening/room.html`).
In the prototype the nav, the big line, the TV at the lock and the page below it are PICTURES of the real site:
"the TV isn't clickable" or "the page below is an image" are not findings. The "⚙ Bench" button is the team's editor.
Useful: `?expose` gives `window.__room` (`go(p)` jumps the walk to p in 0..1, `S` = settings, `L` = layout, `R` = the
room's parts); `?capture=<p>` = a clean still at walk p (no sway, dust, labels; also what to open in the Simulator).
The intro (lights power on) runs for about 2.6 s after load.

## Rules
- Read only in the repo: don't edit, create or delete anything there. Scripts, videos, frames and notes go under the
  folder named in your round's prompt (in the scratchpad).
- Your own browsers only: plain Playwright scripts with node, `require` resolved from
  `/Users/danavivi/projects/revaudio/revaudio-website/` (e.g. `createRequire('/Users/danavivi/projects/revaudio/revaudio-website/')`).
  Never the Playwright MCP browser (it's one browser shared by every agent). Headless only: no windows on Dan's screen.
- Chrome = `chromium.launch({ channel: 'chrome' })`; Safari's engine = `webkit.launch()` (installed).
- The server on 4471 is shared: never stop it. If it doesn't answer, start your own from the worktree root on another
  port (`python3 -m http.server <port> --bind 127.0.0.1`) and stop it when you finish.
- Other agents may be running browsers at the same time: treat frame rates as approximate and re-measure any slow-frame
  finding once before you report it.
- No network beyond localhost, no paid APIs, no image generation.
- iOS Simulator (real mobile Safari): `xcrun simctl list devices booted`; if none is booted, boot one headless
  (`xcrun simctl boot <UDID>`, don't open Simulator.app) and shut it down when you finish. Kill Safari before each shot
  (`xcrun simctl terminate <UDID> com.apple.mobilesafari`), then `xcrun simctl openurl <UDID> "<url>"`, wait ~6 s,
  `xcrun simctl io <UDID> screenshot <path>`, and look at the image. The Simulator can't scroll: open `?capture=0`,
  `0.5`, `0.9`. It runs on the Mac's GPU, so it says nothing about an iPhone's memory limits.

## Play (each scenario: what you did, what happened, numbers, pass / fail)
1. **First visit on a slow connection** (Chrome, CDP `Network.emulateNetworkConditions`, about 10 Mbit/s down, 80 ms
   latency, cache off): what's on screen each second until the room is fully dressed (black? untextured? a pop?),
   seconds to fully dressed, total bytes. Then the same on a normal connection.
2. **The intro** (load, 0-5 s, sampled every ~50 ms): flashes per second (proxy: the mean relative luminance of the
   frame changes by more than 0.1 between samples, over more than a quarter of the screen; the rule is at most 3 a
   second), and any pop after the lights settle.
3. **Scroll the whole walk like a person** with the mouse wheel: bursts with pauses down to the TV lock, wait 3 s,
   then back up to the start; then one fast fling; then a trackpad-style scroll (many small deltas). Record a video
   (`recordVideo`) and sample frames; log frame times (rAF timestamps) and flag frames over 33 ms and 50 ms; flag any
   jump in brightness or a thing appearing / vanishing / jumping between neighbouring frames. Note how long the walk
   takes and whether the landing on the TV is clean in both directions.
4. **Stop halfway and idle 6 s**: the room should stay alive (sway, dust, flicker, LEDs) and never pop.
5. **Keys**: Space, PageDown, arrow down, then back up (visitors use them).
6. **Resize mid-walk** (1141x636 → 1440x900 → 1141x636): no errors, the walk position kept, no black frames.
7. **Leave and come back**: a second page brought to front for 5 s, then back: no jump, no burst of catch-up motion.
8. **Reduced motion** (`reducedMotion: 'reduce'`): no flicker, sway, dust or snap; the walk still lands on the TV.
9. **Engines and sizes**: run 2-3 in WebKit at Dan's 1141x636 (DPR 2) and in Chrome at 1141x636 (DPR 2), 1440x900 and
   1920x1080; WebKit iPhone emulation (390x844, DPR 3, touch) for blockers only (the phone path is a later step);
   the Simulator stills. Anything that renders differently between engines (black frames, missing materials,
   wrong colours on the TV or the CRT screens, shader errors in the console) is high priority.

## Hand back
1. `findings.json` in your folder: `{ round, build, scenarios: [{ id, name, pass, numbers, notes }], findings: [{ id,
   severity: blocker|major|minor, tag: BUG|PERF|LOOK, engine, size, dpr, walk, direction, t_since_load, what,
   evidence: [paths], suspected_cause, fix_idea }] }`. Play first; read the code only afterwards, to name a suspected cause.
2. A report under 600 words: the first 10 seconds as a first-time visitor would live them (3-4 sentences); the
   scenario table (pass / fail with the key number); findings ranked by severity, each with its repro and evidence
   path. Say plainly what you could not test and why.
