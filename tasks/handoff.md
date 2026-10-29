## 2026-10-28 — GAS 2 page: the drone intro, from scratch (Claude Code `revaudio-59`, laptop 1) — BRANCH `feat/gas2-drone`

Claim: OPEN `revaudio-59`. Scene + benches BUILT; Dan picked the DEFAULT camera (TOP); the REAL ART is in (gpt-image-2, 2026-10-28, ~$2 with the roof sign); sidewalk blockout props removed; real headlights; catch the car = the CATCH10 coupon ticket (Paddle code: Gil, RevTasks #193). Waiting on Dan's look.
Files: NEW `tools/_gas2-scene/drone/**`; in `page-b.html` the `<link>` + `<script>` line (after the radio line) plus
the coupon ticket (`.coupon` CSS after `.ticket.sent .stamp`, `#cpVeil` markup before `#plugVeil`, the `dr:caught`
listener at the end of the IIFE) and the grade hover strip removed (`#gradeTip`), nothing else of page-b's; one README line pair; `tasks/todo.md` (the "GAS 2 drone
descent" section); this entry.
- Dan: a hovering drone above the station; scroll down = it comes down into the final scene, then GAS 2 pops and the right
  side pops in fast "like it pops out of the screen". Every shot must feel like the final scene (same graphics, same vibe:
  "not moving from one type of scene to another"). Side feature: a car right to left on load with a coupon on its roof.
  Use the OpenAI key; plan first; present in dynamic HTML.
- Plan (artifact, private: https://claude.ai/artifact/NnyBRQchpWfY541CZA1Unn): hover straight down at 30 m over the shop
  front; the drop = nadir descent to the landing spot (flat ground = a zoom: each closer level painted from the crop of
  the one above; roof / wall / pump as real-height layers); at eye height (1.33 m) a pure tilt-up rendered from the page
  frame itself (exact, no ghosts); hand-off to the live page; readings pop. Car on the road in the hover shot, code as
  real HTML text on a roof board. Checked in headless Edge: the tilt-up maths lands on `f6-v17` exactly.
- Facts (2026-10-28): OpenAI `/v1/videos` 404 on GET + POST (no video); Higgsfield 0 credits; laptop 1's User-env
  `OPENAI_API_KEY` works with credits (gpt-image-2 / 2.5 listed); no torch on laptop 1 (cv2, numpy, PIL yes).
- Asked in the plan (answered below): Q1 keep the page's world; Q2 the coupon (a real Paddle code, for what); Q3 car route; Q4 old scroll numbers
  as reference; Q5 hover angle; Q6 scroll back up. Cost cap asked: $15 (images only).
- Dan's answers (2026-10-28): the page's own world; roof text "catch your compon" (written CATCH YOUR COUPON); car in
  the hover shot; try three hover angles in a bench: straight down, 45 deg from the front, 45 deg + 45 deg round to the
  right; scrolling up does not fly back; finish the scene first, then generate the real elements (OpenAI or Higgsfield).
- Built (`tools/_gas2-scene/drone/`, README there): three.js r185 set (procedural placeholder textures), the page frame
  re-rendered without the readings (`img/land.webp`, `tools/render-landing.cjs`), TOP / 45 front / 45 right paths,
  TUNE -> Drone bench (an angle click flies it; Hover m / Length / Sway; settings in localStorage), the box car with the
  roof board, the hand-off and the readings pop. TOP: nadir log descent onto the landing spot by u .42 with the gimbal
  starting up from u .18, then a pure tilt (the quad switches on at -40 deg, unseen). 45 front / right = blockout
  (ghosting near touchdown until the shop has textured proxies).
- Checked (headless Edge, `tools/check.cjs` + `diff.py`; 1440x900 + 390x844; top, front, right): page after landing =
  `?drone=0` mean 0.00 (max 27 / 4); exact landing frame vs the page scene with the readings hidden 2.55 / 1.47 (resampling
  noise); no page errors or 4xx; classes, runway, layer gone; scroll 0. TOP after the last choreography change: one
  bare-asphalt sample left (u .45). Not checked: WebKit, 1141x636, a real trackpad / phone, Dan's eye.
- Open (Dan): (1) the hover angle; (2) cost OK for the art (OpenAI images; Higgsfield only for a video descent and it has
  0 credits); (3) the coupon: a real Paddle code + what catching it does (no code until he names one).
- Next: after (1) + (2), the art for the picked path: near road under the frame (the .66-.8 seam and the close-up
  asphalt), roof + field aerial, a top-down car; then QA 5b (todo).
- Camera bench (2026-10-28, Dan: "make me a bench to control the scene's camera angle", then "and the landing"):
  `drone/cam-bench.js`, `?cam` (or TUNE -> Drone -> Camera). Drag the scene to turn the hover camera; sliders for the
  hover (yaw, down angle, height, aim point) and the landing (lands at, turn from, arrive angle); Scroll slider + readout;
  never hands over. The three angle paths became ONE path for any hover (straight line down onto the landing spot, the
  camera turns to face the page looking down, then the pure tilt): every angle now lands exactly, the 45 paths' ghosting
  is gone. Checked headless 1440x900: top / front / right / a custom camera (yaw -60, down 30, 20 m, lands 50 %) all land
  = `?drone=0` (0.00) and their landing frames 2.55 vs the page scene; the bench drags, saves, scrubs to the landing and
  back; no page errors. Weak spot for every angle: bare road around 30-50 % of the scroll (the dive onto the road before
  the tilt-up): Dan can shorten it with Lands at / Turn from; the art (near road) fixes the rest.
- Dan (2026-10-28): "in the end we liked the default" = TOP (yaw 0, down 90, 34 m, aim -4 / -6, lands at 42 %, turn
  from 18 %, arrive 40): nothing to bake, the code defaults stand. Asked OpenAI or Higgsfield for the best result:
  recommended OpenAI images (top-down views of flat ground = an AI orthophoto reads as a real drone shot; edits from the
  page frame keep the light; keeps his camera path + the exact landing; credits there). Higgsfield rechecked: 0 credits,
  free plan; its video (first/last frame) would lose the exact hand-off and the bench path, garble the roof text, and
  need an image-sequence scrub (MBs). Art list + cost asked: aerial orthophoto (roof, field, road), the close road, the
  car top-down (transparent), ~8-10 images with retakes, ~$3-5.
- Art DONE (Dan: "approved", 2026-10-28): 3 gpt-image-2 images, one take each (~$1.50 est. at $40/M output tokens:
  12.7k + 12.7k + 11k): the aerial (3072x2048 over an ortho guide of the set, the page frame as reference), the close
  road (over the aerial's crop, the photo's paving as reference), the car (2 takes, magenta, keyed; take 1). Pipeline +
  commands: `drone/README.md` "The art"; originals q95 in design-assets `gas2-drone/` (`504c75e`). Post fixes: lane
  edge softened, close road toned to the aerial (no patch in the hover), the AI's orange lamp pool on the road tamed to
  the page photo's road colour (seam: near 123/97/72 vs photo 122/97/80). Model facts: gpt-image-2 takes any size in
  multiples of 16 (3072x2048 worked), no transparent background.
- Checked (headless Edge, `check.cjs` top, 1440x900 + 390x844): landed = `?drone=0` mean 0.00; landing frame 2.55 /
  1.47 (unchanged); no errors. Weight now: three 744 KB + land 703 + aerial 569 + car 103 KB (+ near 1.1 MB after the
  hover shows) = ~2.1 MB before the hover, ~3.2 MB in all. Not checked: WebKit, a real phone.
- Then (Dan: "make it", "do what you think is right", 2026-10-28): the roof sign is IN the car photo now (masked
  gpt-image-2 edit over the old drawn board, 2 takes, take 1, ~$0.50; pasted back onto the approved car, so the car and
  its crop are unchanged; `drone/tools/sign-guide.py`, `prompt-car-sign.txt`, README "The art"); the drawn board + frame
  box are gone from `world.js`. Spelling read at full size: CATCH YOUR / COUPON, nothing else. Original q95 in
  design-assets (`2393679`). Readable in the hover at 1440 and at 390 (phone shots taken while the car crosses).
  The sidewalk blockout props (pump, globe, radio, bin, chalkboard boxes) are out too (Dan: "delete the css", a
  screenshot of the descent; `b0ea903`): the page frame has the props after the hand-off.
- Checked again: landed = `?drone=0` mean 0.00 (1440 + 390); landing frame 2.55 / 1.47; no errors. Car 169 KB (was
  103). Art spend in all: ~$2.
- Then (Dan: yes, replace them): the car's headlight beam and shadow are no longer drawn shapes. Beam = two soft cones
  from the lamps, light falling off with distance, blended as road * (1 + beam) so it lights the asphalt (cracks stay
  dark); shadow = a soft contact shadow hugging the footprint (dusk: no sun shadow). Procedural in `world.js`, no new
  file. Landing still mean 0.00 (1440 + 390), no errors.
- Coupon (Dan, 2026-10-28: "10% coupon on the whole site"; picks: code CATCH10, Gil creates it, a ticket + copy):
  catching the car (click / tap) opens a coupon ticket in the page's service-ticket look (`#cpVeil`: YOU CAUGHT IT,
  CATCH10, 10% OFF THE WHOLE STORE, a COPIED stamp) and copies the code. Checked (headless Edge): a miss opens nothing,
  a hit opens it with the clipboard = CATCH10 at 1440 (click) and 390 (tap), Escape closes, no errors.
  The Paddle discount is NOT created yet: Gil, RevTasks #193 (urgent, Sales; bell only, a raw insert sends no email)
  + shared `collaboration/STATUS.md` (`b20a848`). This page must not go live before the code exists.
- Open: Gil's CATCH10 in Paddle; WebKit / a real phone; Dan's look.

### Session end (2026-10-29, `revaudio-59`, close-session) — claim stays OPEN (waiting on Dan's look)

- State: branch `feat/gas2-drone` = origin (0 ahead / 0 behind), clean before this handoff edit. Commits this
  session: `7bb0c43` plan, `fd60c72` scene + bench, `3b7568e` camera bench, `f7c8a86` TOP picked, `c2c7280` the art,
  `b0ea903` props out, `ae41fa8` roof sign, `2081379` beam + shadow, `64f19a3` catch = coupon. Elsewhere, all pushed:
  design-assets `504c75e` + `2393679` (art originals), shared `b20a848` (STATUS: Gil, CATCH10). RevTasks #193 (Gil, urgent).
- Unverified: WebKit / Safari and a real phone (only headless Edge so far); Dan has not seen the beam, the shadow or
  the coupon ticket yet (shots sent, last signal before them: "do what you think is right"); `check.cjs` was not re-run
  after `64f19a3` (event handlers only; the catch test showed no page errors). The car drives once, ~6 s after load:
  offered a replay button, no answer.
- Background (laptop 1, die with the session): `python -m http.server` on 4464 (this worktree's `tools/_gas2-scene`,
  PID 17152), 4462 (worktree `gas2-page-view`, detached `0b58cb0`, PID 38184), 4461 (GAS2 `Source/ui/public`, PID
  38924), 4463 (the plan page in the session scratchpad, PID 45096). Kill: `Stop-Process -Id <PID>`.
- Decide next: (1) Dan's look at beam / shadow / coupon; (2) a "drive again" button or not; (3) going live = merge to
  main only after Gil's CATCH10 exists in Paddle and Dan says push (`tasks/todo.md` 4e).
- Commit: `docs(gas2-drone): session-end handoff (revaudio-59)` — this file only.
- Cleanup: worktree `gas2-page-view` (detached at `0b58cb0` = the page right after the old intro was deleted) was
  served on 4462 to view the page as it was: remove it when no session uses it (`git worktree remove`), not done here.
- Memory: shared `project_revtasks_app.md` + Sales section id = 4 (uncommitted in the shared clone, which is behind 2).
- Then (Dan, 2026-10-29, a screenshot of the strip under the wall sign: "lets remove this section of it"): the grade
  hover strip (`#gradeTip`: "PREMIUM · thick lows, clear mids, silky air, glued · the signature") is gone from
  `page-b.html` with its CSS, its hover handlers and the copy array; a click on REGULAR / PREMIUM / RACE still picks the
  pump's key. `page-a.html` still has it (not asked). Checked headless 1440: hover PREMIUM = no strip, click RACE =
  on, no errors. The tip was hidden at rest, so `img/land.webp` (the landing frame) is unchanged.
- Then (Dan, 2026-10-29: "let's work on the player's knobs, open them in KNOB LAB, they need refining"): the radio's
  lab (`player/knoblab/make-knoblab.py`; `player/**` is Yoni's radio claim from `revaudio-cd`, touched here on Dan's word)
  now opens on the look on the radio today (Yoni's recipe `knob-recipe-yoni-2026-10-23.json`: KNURL, gunmetal knurl,
  brown bakelite dome, glow index), not the first SKIRT look; SHIPPED shows the baked strip `img/knob-radio.webp` on
  the radio at the knob's angle; storage key v2 (so it opens fresh on the shipped look). Server: `serve-lab.py 8798
  --pages <this player folder>` (8797 is another session's panel bench on laptop 1), PID 66712, URL
  http://127.0.0.1:8798/scratch/knoblab/radio-knoblab.html. Checked headless: LIVE 3D KNURL, SHIPPED = the strip, no page
  errors (one console 404 = favicon). Next: Dan's look in the lab -> EXPORT -> bake (`bake-knob-lab.js <recipe> <out>
  256 1 --foot=60,60,84,120`) -> `img/knob-radio.webp` + radio.css `.rp-knob b` k3dCss, then the page check.
- Then (Dan, 2026-10-29: "i exported the knobs"): his EXPORT `shared/tools/knob-lab/library/saves/gas2radio/
  gas2radio-knob-recipe-2026-10-29-1218.json` (the `-2` twin is equal as JSON; copy: `player/knoblab/knob-recipe-
  2026-10-29.json`) = type ALU, linked: machined metal body, copper-brown spun cap (#52301e), white line index, no halo,
  light az 130.6 / el 58.4. Baked (`bake-knob-lab.js ... 256 1 --foot=60,60,84,120`: no clipped edge, no pure #000 /
  #fff; k3dCss unchanged -1.391 / -3.326 / 102.783 %, so radio.css keeps its numbers) -> 192 px frames (premultiplied
  LANCZOS) webp q84 = `player/img/knob-radio.webp` 653 KB (was 518; q88 790 KB for p99 13 vs 14). The lab now opens on
  this recipe. `drone/img/land.webp` re-rendered (the landing frame carries the radio: only the two knob areas changed).
  Checked headless: radio before / after + a drag turns the new strip, no errors; `check.cjs` top 1440 + 390: landed =
  `?drone=0` mean 0.00, landing frame 2.56 / 1.47 (the same noise map as before). Dan saw it on the page: "looks very good" (2026-10-29).
  Shared clone, uncommitted (lab writes, Dan's): `tools/knob-lab/library/knobs.json` (his EXPORT card) +
  `library/saves/gas2radio/` + `library/saves/library/knobs-before-2026-10-29-1218.json`.
- Then (Dan, 2026-10-29: "an indicator at the bottom of the hover that tells the user to scroll down; give me options
  in a bench"): `drone/cue.js` (+ drone.css "the scroll cue", 3 lines in run.js): bottom centre of the hover, in 1.4 s
  after the hover shows, out by 4 % of the scroll; bench `?cue` (panel top left): Chevrons (default until he picks) /
  Mouse (Swipe up on touch) / Ticket ("SCROLL TO LAND", page paper) / Fuel drop / Altimeter (live height, fades by 90 %)
  / None. Checked headless 1440 + 390: every look shows, chevrons gone after 1.2 screens and back at the top, the
  altimeter 34 -> 2 m; landing still mean 0.00 / landframe 2.56 / 1.47; no errors. Dan didn't see it at first: his
  browser kept the old run.js (plain `http.server` = heuristic cache); a no-store server on 4465 fixed it (scratchpad
  `serve-nostore.py`; open the page there). Dan: "perfect, chevrons": the other four looks, the bench and `?cue` are
  out (cue.js = the chevrons only). Checked 1440 + 390 on 4465: in at the hover, 0 after .6 screen, back at the top,
  no panel, no errors; landed = `?drone=0` mean 0.00.
- Then (Dan, 2026-10-29: "a bench only on the light on GAS 2 ... on the GAS on the last page of the site"; a first
  take benched the plugin's own 3D pump instead, GAS2 repo branch `bench/pump-light`, left there): NEW
  `tools/_gas2-scene/light-bench.html` (+ its README line). The real page (`page-b.html?drone=0`) in a frame, panel
  docked right: LAMP (= `--sp-l`, the `.pumpLit` soft-light opacity), LAMP MIX (soft-light / overlay / screen), LAMP
  REACH (the gradient's 42 % / 88 % stops x reach), LAMP COLOUR (amber -> white), PUMP BRIGHTNESS / CONTRAST
  (`--sp-b` / `--sp-k`), SHADOW BEHIND (`--sp-s`); LAB / SHIPPED (A), ZOOM x1.5 / x2 on the pump, START, EXPORT.
  SHIPPED = page-b's Spotlight D, read from the file. page-b.html untouched. Checked headless: the frame at the start
  values = the plain page pixel for pixel (1280 x 915, max diff 1 / 255); a lamp change shows; no errors. Open it on
  4465 (`serve-nostore.py`): http://127.0.0.1:4465/light-bench.html. Next: Dan EXPORTs -> "apply" = the numbers into
  page-b's `.pumpLit` / `.pumpCut` CSS + the Spotlight D, then re-render `drone/img/land.webp` (the pump is in the
  landing frame) + the landing check; the bench goes once he has picked (as `?cue` did).

## 2026-10-26 — GAS 2 page: the drone intro (hover above the station, scroll = descent, land, readings pop) (Claude Code `danavivi-19`, Dan's Mac) — BRANCH `feat/gas2-page`

Claim: CLOSED 2026-10-26 (`danavivi-fb`): DELETED on Dan's word. He flew the finished version and said "this is not good,
clear this, I'll make it from scratch", then picked "delete the drone intro": `tools/_gas2-scene/flight/**` removed, its
`<link>` / `<script>` line out of `page-b.html`, its lines out of `tools/_gas2-scene/README.md`. Everything below is history;
the last state is in git (the commit before the deletion, `6836c35`). Kept in page-b (not the intro's): the `.scene`
half-pixel fix and the TUNE / bench-note opt-in (`?dev` or T). No reason given beyond "not good": ask Dan what he wants
from the new one before building.
(Was: OPEN `danavivi-fb`, taken over 2026-10-26 from `danavivi-19`, which Dan closed: "continue from where you stopped".)
Files: NEW `tools/_gas2-scene/flight/**`; in `page-b.html` ONE `<link>` + `<script>` line in
`<head>` (after the radio line), nothing else of page-b's; one README line pair in `tools/_gas2-scene/README.md`; this entry.
- Dan: "the hovering drone scene for GAS2 page ... above the gas station and then when the user scroll down ... it goes to the
  main page that we have right now. Then all the readings ... on the right side ... pop out. After it the user lands on the page."
- No AI video: Higgsfield = 0 credits (free plan) on this connector, and OpenAI shut the Sora 2 / Videos API on 2026-09-24
  (checked: `/v1/videos` 404, docs say so). So the flight is a real-time three.js fly-through of the station as a 3D set
  painted by two photos (`flight/README.md`): the page's own frame at touchdown (exact) + a new hover aerial (gpt-image-2,
  painted from the set's own blockout, so it lines up). Spent: OpenAI images only, 15 gpt-image-2 images (~90k output tokens, ~$4).
- Flow: hover (sway; "SCROLL TO LAND" after 1.8 s still) -> 4-screen scroll runway = descent, gimbal tilts up into the
  sunset, glide in -> touchdown on the page frame -> canvas fades onto the page -> readings pop (GAS2 overshoot, its rule
  draws, the line rises, the button pops, "Fill it up." writes on) -> runway folds away, scroll back at 0.
- Checked (headless, DPR 2): Chromium 1141x636 + 1440x900 + 390x844, WebKit 1141x636: the flight runs, no console errors;
  last frame vs the page 1.7/255 (webp); after touchdown the page = `?flight=0` (0.00 difference), footer back, scroll 0;
  reduced motion = no flight. Frame time while scrolling: Chromium ~8 ms, WebKit ~17 ms (one 129 ms first-scroll hitch).
- Not checked: Dan's real Safari by eye (opened for him), a real trackpad feel, a real phone.
- Open (Dan's word): (1) the look of the hover shot (a lone lit shack in the dark; regenerate = ~$0.6 / 2 takes); (2) the
  "SCROLL TO LAND" line (DESIGN.md §6 says no UI chrome over a scene: it is text, not a frame; cut it if he says);
  (3) runway length / sway (TUNE → Flight, COPY); (4) DESIGN.md rule for the intro once he signs it off.
- Others on this branch: plain `page-b.html` now opens with the flight; `?flight=0` skips it, `?rbench` (the radio bench)
  skips it too.
- Dan after the first round: "the scroll feels amazing", then "go 1" = the hover shot should read as a real 1950s station
  from above. Done (`roadside.js`): a lit GAS2 pole sign (the readings' lockup in Oswald on cream enamel, neon start, a
  rare buzz, its light on the lot) and a telephone line from the highway back into the desert LEFT of the station (first
  routed along the highway: its wires crossed the shop front on the way down, so moved); both 3D objects, kept out of the
  photos, never in the touchdown frame. Roof: parapet + two vents (a stove pipe poked above the roof line; removed).
  Three hover lights to pick from (TUNE → Flight → Blue / Last light / Lamp, `?air=`): 🔴 the website OpenAI key
  (`tools/.openai_key.local`) came back "invalidated" (401 token_invalidated) mid-session, so the planned re-paint from
  the richer blockout did not run; Last light + Lamp are local grades of the Blue aerial (`tools/mood-grade.py`).
  Re-checked: Chromium all three lights + WebKit, no errors, the page after touchdown = `?flight=0` (0.03).
- Open (Dan's word): (5) which light; (6) a new OpenAI key, then re-paint the picked light from the richer blockout
  (`lab.html?b=0&s=1&minres=30&road=0`, grade, `tools/gen-aerial.sh` with MOOD/EXPO; ~$0.6 for 2 takes).
- `danavivi-fb` took over (Dan: "continue from where you stopped" ... "the drone view scene for gas 2 page"):
  - (5) DONE, Dan picked **Blue** (the same sky the drone lands in). Last light + Lamp, their TUNE buttons, `?air=` and
    `tools/mood-grade.py` are gone: one hover photo, `img/aerial-blue.webp`.
  - (6) 🔴 BLOCKED on money: the key in `~/.zsh/openai.zsh` works (the `tools/.openai_key.local` one is dead, 401), but the
    OpenAI account has no credits (`credit_balance_exhausted`); Higgsfield is at 0 too. `gen-aerial.sh` / `gen-free.sh`
    now take `$OPENAI_API_KEY` first; the prompt no longer asks for a stove pipe. Once there are credits: blockout + mask
    (lab-shot, identical to the old prep) -> `grade-blockout.py ... blue` -> `zsh -c 'source ~/.zsh/openai.zsh && OUT=<dir>
    bash tools/gen-aerial.sh <h-blue.png> Nblue 2'` (~$0.6) -> check the shift (0 px) -> `cwebp -q 92 -m 6` over
    `img/aerial-blue.webp`.
  - Fixed: a dark "ghost" streak in the sky over the canopy in the last stretch (u 0.82-0.97). The line-of-sight test
    used box steps for the slanted roof end and the roof's edge sat 0.2-0.27 m short of the photo's, so A's dark canopy lip
    rode on the sky. Now the roof + sidewalk are exact prisms there, and the roof's slanted edge is fitted to A.
  - Item 3 of the "what's next" list, the house's left end lived in: as the drone closes in, the front wall left of the
    window + the curb hand over from the blown-up hover photo (~28 px/m) to the fill (stucco with grime, eave shadow and
    falloff; a panelled side door with a brass knob; concrete curb). A gooseneck lamp over the door (`roadside.js`) lights
    the wall, sidewalk and dirt; the door's four lights show the shop's interior, cut from A.
  - Checked (headless, DPR 2): page-b in Chromium 1141x636, 1440x900, 390x844 + WebKit 1141x636: no console errors,
    lands, the page after touchdown = `?flight=0` (0.000); lab u=1 vs `land.webp` 0.010 (max diff 0 against before the
    door work). Not checked: Dan's Safari by eye, a real phone.
  - Open (Dan's word): (6) OpenAI credits, then the Blue re-paint; item 2 (the pump's own cut-out layer, one more image
    ~$0.3); item 4 (a DESIGN.md rule for the intro, the phone pass, merge to main) once he signs the look off; (2) and (3).
  - Dan then: "finish the scene so it will be ready for publish ... check pixel by pixel, frame by frame". QA = 41 frames
    of the path at 1536x1024 by eye, a 101-step pop scan (none), both hand-offs read straight off the canvas, page-b in
    Chromium 1141x636 / 1440x900 / 390x844 + WebKit 1141x636. Ghosts found and fixed (all in `world.js` + `flight/README.md`
    "Ghost hunting"): the porch (a grey see-through box u 0.05-0.8: the hover photo's porch was a painted wall; now the
    set's own concrete floor mid-flight, and the hover photo's porch patched from the set's render, `tools/patch-porch.py`);
    A's background plate painting the dirt behind the porch all flight long (a ghost stick, now last stretch only); the
    chalkboard's frame + legs riding onto the floor behind it (now A's own board cut-out, `img/land-chalk.png` via
    `tools/make-chalkmask.py` + `render-landing.cjs` CHALK=bare|off); blown-up photos hand over to the fill (2-4.5x).
  - Numbers: touchdown, the page after = `?flight=0` 0.000 in all four; the last canvas frame vs the live page 3.8/255 at
    1141x636 @2x (a lossless render of the page at 1536 already differs by 3.3: fonts / filters at another size), 2.9 at
    1440, 1.6 on the phone; lab u=1 vs `land.webp` 0.010; hover, still -> first canvas frame 0.7 (Chromium) / 2.5 (WebKit,
    filtering, < 1 level brighter), the 3D sign / poles / door lamp the only real differences. Frame time Chromium 8.3 ms
    median at every size; headless WebKit 17 ms (its 60 Hz cap) with a few ~160 ms hitches even with the flight standing
    still (harness). Reduced motion, `?flight=0` and no-WebGL fall back to the page.
  - Publish-readiness round: the page against itself one pixel narrower / wider differs by 4.1/255 (fonts, filters), so
    the last 3D frame (3.8) sits below the browser's own noise. Real iOS Safari (iPhone 17 Pro Simulator, iOS 26.5) on a
    throwaway production-like copy of page-b (TUNE + bench note hidden, an auto-scroll; deleted after): hover, descent,
    the pan to the phone crop, touchdown, the readings pop. The pump and the roof checked at full size in every frame of
    the path: no flat-decal or roof-edge read (the path never views them from the side). README: "Publishing" (the host
    page contract, weight, re-render the landing frame from the published page). Going live = page-b into `src/` + a push
    to main (a live deploy): Dan's word.
  - Claim widened (`danavivi-fb`, 2026-10-26; page-b's earlier claims are all CLOSED): in `page-b.html` also (1) the dev
    chrome opt-in: the TUNE button + the "WORKING COPY" note hidden unless `?dev` / `?tune` / `?bench` / `?rbench`, or
    for good on a browser once T has opened TUNE; (2) `.scene` on wide windows = `left: 0` (no `translate(-50%)`: it put
    the scene half a device pixel off at odd widths in Chromium, a dark line down the left edge).
  - Last round (the goal check said "not done"): the hover photo's lettering made exact (the AI had painted
    "REGULAR · PREMIUM · EACH" and gibberish posters; `tools/patch-front.py` lays A's own lettering in by the wall's
    homography), the roof vents drawn into it (`tools/draw-vents.py`) and made occluders, a dark streak on the touchdown
    frame's horizon fixed (eps 1e-8), `?autofly` for hands-free device checks. Re-checked: 41 frames by eye, the 101-step
    pop scan (none), both hand-offs in Chromium 1141x636 / 1281x720 / 1440x900 / 390x844 + WebKit 1141x636 / 390x844
    (touchdown mean 1.5-3.2/255, closer than the page to itself one pixel narrower: 4.1; colour off by > 12 levels in
    <= 0.03 % of pixels), the page after = `?flight=0` 0.000, fallbacks, real iOS Safari on page-b itself (fresh origin).
  - Self-contained check: `git archive` of the tree into an empty folder, served alone, page-b in Chromium + WebKit at
    1141x636 + 390x844: flight, touchdown; 0 off-origin requests, 0 failed / 4xx, 0 console errors, EXCEPT the pump's
    plugin face, still `http://127.0.0.1:4461` (the GAS2 checkout). A snapshot of GAS 2's UI beside the page works
    (tested; kept OUT of the repo, in session scratch only): this repo is PUBLIC, GAS2 is PRIVATE, so committing it would
    publish the plugin's UI source. Auto mode refused that push too. Dan's call: keep the URL, bundle, or a built copy.
  - 🔴 Publish blocker found, NOT the flight's, Dan's call: page-b's "Download FREE" opens the service ticket, whose form
    is a mock (`tk.onsubmit` only adds `.sent`: nothing is sent, nothing downloads). GAS 2's public download is owed
    (shared CLAUDE.md: a code-signing cert before public download, R2 / site, Mac 1.0.0), then the form wired to the
    download worker. Live also needs: page-b moved into the site (a route, its nav / analytics), Dan's real-phone look,
    his sign-off and his push word (main = a live deploy).

## 2026-10-26 — GAS 2 page: no copying (Claude Code `danavivi-7e`, Dan's Mac) — BRANCH `feat/gas2-page` PUSHED

Claim: CLOSED 2026-10-26. File: `tools/_gas2-scene/page-b.html` (one `<style>` + one `<script>` block in `<head>`, after the radio line).
- Dan: "I can copy the page and mark it down. I can copy elements and assets ... disable that from users." Now: `user-select: none`
  on the page (inputs / textareas / contenteditable keep it), `-webkit-user-drag: none` on img / svg / video, no iOS long-press
  callout, and `contextmenu` / `dragstart` / `copy` / `cut` / `selectstart` cancelled outside form fields.
- Checked headless 1141: Cmd+A and a mouse drag select nothing; right-click + drag on an image, copy / cut on the page: blocked;
  copy inside the MAIL email field: allowed; the radio plays, A/B, volume drag all work; no errors.
- A deterrent only (screenshots, view-source, the network tab still work). The pump iframe (:4461) is its own page: not covered.
  The live site (`src/`) does not have this; carry it when the page moves into `src/` (Dan's call for the rest of the site).

## 2026-10-24 — GAS 2 page: chalkboard in front of the readings' shadow (Claude Code `danavivi-b4`, Dan's Mac) — BRANCH `feat/gas2-page`

Claim: CLOSED 2026-10-24. File: `tools/_gas2-scene/page-b.html` (`.chalk` gets `z-index: 1`).
- Dan: the chalkboard "sits behind the shadow, I want it in front of it". The readings' FOCUS layer (`.rd::before`, blur +
  brightness .84) reached left over the board's right half. Now the board stacks above `.rd`; no overlap with the readings' type.
- Checked: headless Chrome 1141x636 + 1440x900. Board right half brightness 47 -> 54, edge sharpness 15 -> 21 (= the left half).
  Then Dan: "make it more" -> board brightness .86 -> 1.08 + contrast 1.06. Dan in Safari: "perfect".
- Then the sidewalk out of the shadow too: `props/walk-cut.png` = the slab traced from f6-v17 (same pixels, 1 px feather;
  back edge 71 %, the edge line (68.85, 71) -> (87.9, 85), curb end 88.7 %, curb foot 92 %), laid over FOCUS + DUSK with
  `z-index: 1` (`.walkCut`), under the chalkboard. Measured at 1141: ~10 % brighter + sharper. Dan: "commit".
  Note: moving the readings down in TUNE would put "Fill it up." behind the cut (at default it clears it).
- Pulled first: Yoni's radio round 3 + `?rbench` placement (origin 4bfc117) are on this branch now.

## 2026-10-24 / 26 — GAS 2 radio: the grille nameplate "Play me" (Claude Code `danavivi-7e`, Dan's Mac) — BRANCH `feat/gas2-page` PUSHED

Claim: CLOSED 2026-10-24. Files: `tools/_gas2-scene/player/radio.css` (`.rp-badge` block), `player/radio.js` (badge markup,
badge click = play / stop, `.played` on first play), `DESIGN.md` §3 (script accent: the nameplate exception),
`.impeccable/config.json` (gradient-text waiver, radio.css only). Not page-b.html.
- Dan: a "Play with it"-type line on the speaker grille "like a brand name, like a Marshall", vintage, pops out. Built a raised
  Yellowtail script badge (dark backing + cream enamel face + cast shadow down-left, the porch lamp is up-right), centred on the
  cloth, tilted -5deg; click = play / stop; a glint crosses it every 7 s until the first play (off under reduced motion).
- Dan picked from a `?badge` picker (now removed): **"Give it gas" · Cream · tilted**, then the same day **"Play me"** (170u). Not taken: Give it gas / Play with it /
  Tune in; chrome / brass / honey (lit on play) / oxide + cream (the recipes are in this commit's parent diff if wanted again).
- Then (Dan, same day): "not get closer when user hover" + "more embedded to the net ... look like it is sewn in": the badge is
  now EMBROIDERY: no hover / press move, no float shadow; dark thread edge (.rp-b0), cream satin-stitch thread (.rp-b1), the
  grille's own weave soft-light over it (.rp-b2, cut from radio-lit.webp); tight halo + 1u shadow = thread on fabric. Picked
  from 6 headless variants (too muddy when the weave multiplies the thread: keep the cream bright).
- Then (Dan, same day): "let me see more of the stitches, like Marshall stitch": the badge is now ONE SVG (radio.js badgeSvg):
  dark thread edge + cream satin stitches as a pattern (threads 8u apart at -20deg, each a groove + a sheen) + a lit-top shade
  + a SMIL sheen sweep (hidden on .played / reduced motion). The CSS gradient-text layers (and their impeccable waiver) are gone.
  Default = bigger satin, NO outline. `page-b.html?stitch` = picker for a running-stitch outline (none / cream / gold, a dashed
  stroke under the letters): busy at scene size (stitches land in the letter joins and the a / e counters), so not default.
  Open: Dan's outline pick; then drop the ?stitch picker.
- 2026-10-26 (Dan): the SVG stitches "look like CSS ... make it much more fine ... create an asset of the whole box including
  the stitches ... glued together ... the same box ... not too much". Now IN THE PHOTO: `player/tools/gen_stitch.py gen 3` =
  one masked gpt-image-2 edit of radio-lit.webp (mask = the grille cloth only; gpt-image-1 is gone on this key, and the shell's
  OPENAI_API_KEY is stale, so the script reads the website clone's `tools/.openai_key.local`), 3 takes (~$0.75): 1 fine thin
  script (PICKED), 2 + a swash underline, 3 bolder (`img/gen/stitch-*.png`, gitignored). `compose 1` lays back only the pixels
  the stitching changed (diff mask, grown + feathered, inside the cloth) on the git copies of BOTH plates (off = through the old
  off/lit ratio), so the cabinet, keys, knobs, dial and every radio.css coordinate are pixel-identical. The SVG badge, the sheen
  and the ?stitch picker are gone; `.rp-badge` is now only an invisible hit area over the words (440..935 x 190..375 plate px).
  Checked (headless 1141 + 1440): no errors / 404s, all audio 200; badge -> play ORIGINAL 1/0; GAS 2 key 0/1; ORIGINAL 1/0;
  dial ELEC. -> st 2; tuning knob -> st 3; volume knob -> .62; play key stop / start; badge -> stop; hover moves nothing.
  Not checked: Dan's Safari by eye, real ears.
- 2026-10-26, then (Dan: "cool make it white"): the same take-1 letters, thread recoloured warm white in code (`compose 1`,
  default; `--tan` = the model's tan): letter mask = the take blurred 2.5 px minus blurred 14 px > 14 (the weave's own highlights
  max 9, so no cloth blotches), each stitch's light kept (groove shade -> #f7f2e8). Compose now always starts from BASE_REV
  `ec4504e` (the last plain-grille plates). Checked again headless: all keys / badge / hover as above.
- 2026-10-26 (Dan: "remove the reading" = the caption under the radio, his pick): `#radioCap` is visually hidden in radio.css
  (still in page-b.html, untouched; still written by radio.js), kept as the radio's aria-live status for screen readers
  ("On air: HIP HOP / GAS 2 · PREMIUM 140 %", two blocks = two phrases). Checked headless 1141 + 1440: 1 x 1 px, text updates.
- 2026-10-26 (Dan: VOLUME / TUNING "sitting between the frame of the radio and the box ... more polished ... give me some
  options"): the straight labels (top 601u) crossed the seam where the wood panel ends (y 610) and the frame's brass lip starts
  (612..640). Offered on the page (`?eng`, now removed): wood (inside the panel) / brass (stamped in the lip) / ARC / off.
  Dan picked ARC: one SVG per knob, the word on the lower half of a circle r 76 about the knob centre (ring r 55), Oswald 600
  16.5u, cream + the old 1.2u top shadow. `.rp-eng` and its spans are gone. Checked headless: all controls as above, no errors.
- Picked with the DESIGN.md "ONE script line per screen" rule flagged ("Fill it up." is Yellowtail too): recorded as
  "a nameplate ON a prop is not a line".
- Checked: headless Chromium 1141x636 + 1440x900, no errors / 404s; badge click -> playing ORIGINAL (gains 1/0), glint stops;
  2nd click -> stopped. Not checked: Dan's Safari by eye after the bake, phones (the radio is off-screen there).

## 2026-10-23 — GAS 2 page: MAIL ME THE KEYS poster on the wall (Claude Code `danavivi-2a`, Dan's Mac) — BRANCH `feat/gas2-page` PUSHED

Claim: CLOSED 2026-10-23. Files: `tools/_gas2-scene/page-b.html` (mailbox block: `.mp` poster button + `.mail` moved down,
`.mailCap` slip removed, TUNE → Mail poster script), `props/poster-mail-{1-4}.webp`, README line, DESIGN.md "Poster ON the wall".
- Dan: "just the reading need to be a poster that catches the eye". The slip became a 2:3 poster on the wall above the box
  (x 52.55 % / y 20.6 % / w 9 % of the scene), arrow down into the box. Click = the ticket; hover = the ticket peeks out of the box.
- 4 options, gpt-image-2: 1-2 red with a GAS 2 badge, 3-4 yellow with a FREE starburst (FREE was Claude's addition, not Dan's line).
  Default 1; `?mp=1-4` or TUNE. **Open: Dan's pick**, then delete the other 3 webps and the TUNE row.
- Checked: headless Chromium 1141x636 + 1440x900, no console errors, ticket opens. Not checked: Dan's Safari, phones (the wall is off-screen there).
- `.git/info/exclude` hides `tools/_gas2-scene/`: new files there need `git add -f`.

## 2026-10-23 — GAS 2 page mockup on `main` for Ilay (Claude Code, Dan's Mac) — PUSHED TO MAIN (Dan: "push the page of gas2 to main, Ilay needs it for social media inspiration")

Claim: CLOSED 2026-10-23. `feat/gas2-page` (f72afcc) + `feat/gas2-page-s2` (6a5af16, the spotlight + notes on the glass, Dan picked "both") merged clean.
- 2nd push same day (Dan: "push latest branch"): both branches again, now with the window posters, the pump light and the readings' premium shadow. Only the doc files conflicted (handoff + README), both sides kept.
- Only `tools/_gas2-scene/**`, `DESIGN.md`, `tasks/**`: nothing in `src/` or `public/`, so the live site is unchanged. The page is still a static mockup.
- Ilay: `git pull`, then `cd tools/_gas2-scene && python -m http.server 4462 --bind 127.0.0.1`, open `http://127.0.0.1:4462/page-b.html`. The pump iframe (:4461) and the radio's real audio are not there (placeholder audio only).
- Ilay's note: the posters are in now too. Both branches stay open for more work; rebase them on main before the next push.

## 2026-10-23 — GAS 2 page: window posters + light on the pump (Claude Code `danavivi-59`, Dan's Mac) — BRANCH `feat/gas2-page-s2` PUSHED, NOT IN `feat/gas2-page` YET

Claim: OPEN. Files: in `tools/_gas2-scene/page-b.html` the posters (`.note.poster` `.pk/.pl/.ps`, were the notes `.n1-3`)
+ the pump light (`.pumpCut` / `.pumpLit`, TUNE → Spotlight script at the bottom); `props/poster-{knock,level,start}.webp`,
`props/pump-cut.png`; the README owner line; DESIGN.md ("Posters IN the window", "Making one object pop").
Worktree `.claude/worktrees/gas2-page-s2`, served on :4463 (session 1 keeps :4462). `feat/gas2-page` merged in at `b47fcc6`.
- Pump: `pump-cut.png` = the pump traced from f6-v17 (globe ellipse + cap + body + base, same pixels), laid back over the
  posters so the window art sits behind it; light on the pump only (soft-light top-down, masked to the cut-out, +4 %).
  Dan toned it down twice ("this needs to be subtle", "just keep the light on the GAS 2 itself"): no cone, no pool, no dim.
- Posters (Dan's lines + picks): NO KNOCK. NO KNOB. (fuel filter, knock #2) · FILL IT UP. SAME LEVEL. (auto-level, level #1)
  · START EVERY MIX HERE. (first stop, start #2). gpt-image-2, 2 options each. Left pane one tall, right pane two wide,
  inside the measured glass, no tape / shadow / blur. Unpicked options + prompts + generator: `tools/_gas2-scene/_posters-gen/`
  in Dan's main clone (git-ignored).
- Open: (1) bring this into `feat/gas2-page` on Dan's word (a fast-forward today: push `feat/gas2-page-s2` to
  `feat/gas2-page`); (2) "SAME LEVEL" states auto-level as a claim: same "needs a measured check" as the entry below,
  before it ships; (3) phones: the scene keeps its right edge, so the left-window poster is likely off-screen (not checked).
- Note: the shell's `OPENAI_API_KEY` is stale (401); `tools/.openai_key.local` works.

## 2026-10-23 — Claude Code `danavivi-a3` (Dan's Mac) — GAS 2 page: readings composition 2, premium shadow, notes on the glass

Claim: OPEN (`tools/_gas2-scene/page-b.html` minus the radio block; `DESIGN.md` §3/§5/§7 readings lines). Continues the 2026-10-22 entry below.

### State at session end

Branch `feat/gas2-page` in revaudio-website, worktree `.claude/worktrees/gas2-page`, 0 ahead / 0 behind `origin/feat/gas2-page`;
the only uncommitted change is this handoff entry. Commits this session (all pushed to the branch): 9e52949 branch + mockup,
06c300b bench round 2, 97538ad notes on the glass, 754c25d readings composition 2 (GAS2 in the pump globe's lockup, centred
column, "⤓ Download FREE"), 1cce306 DESIGN.md readings vibe, 1cdaf08 / 643f330 / ad0e2c1 the GAS2 rule gap (2.5 -> 20.5 px at
1141x636), 0fca023 "Fill it up." lights with the button hover, 8c1eed6 button label in Oswald 700, e5a68ed premium shadow (circle
out: HUG / FOCUS / DUSK layers + TUNE checkboxes), bef24e7 Dusk fades in (the "cut"), f72afcc edges subtle, 426052d general shadow
-50% + the shadow hugs the words, 32279f5 DESIGN.md shadow recipe.

🔴 **Diverged from main.** Another session merged `feat/gas2-page`@f72afcc + `feat/gas2-page-s2` (fe5d622 / f2e2f61 / 6a5af16:
the pump in a spotlight, notes toned down, `props/pump-cut.png`) to main (8044e2f + 881d1a7, Dan: "both to main for Ilay").
This branch lacks those 5 main commits; main lacks 426052d + 32279f5. Both sides edit `page-b.html` and the top of this file.

### Unverified

- Dan approved in Safari: composition 2 ("I love you so much", "this is amazing"), the rule gap ("perfect"), the hover ("nice"),
  the shadow at 426052d ("really cool, I like it"). Not checked: phones (390 px: the radio is off-screen), Firefox, the
  Neon / Enamel / Badge looks under the new centred column (the GAS2 lockup + shadow are scoped to the "Now" look only).
- The FOCUS layer (backdrop-filter in a mask) does not render in `wksnap` snapshots: checked in headless Chromium + by Dan's eye only.
- Oswald has no "⤓" glyph, so the arrow falls back to another font (offered Dan a matching SVG icon; no answer yet).

### Background processes

- `python3 -m http.server 4462 --bind 127.0.0.1` from `.claude/worktrees/gas2-page/tools/_gas2-scene` (nohup, pid 41222):
  Dan's Safari tabs point at it. Kill: `kill 41222`.
- Not this session's (left alone): :4461 pid 29302 (GAS2 repo `Source/ui/public`, the pump iframe), :4463 pid 69799
  (the `gas2-page-s2` worktree's server).

### Things the next session needs to decide

1. **Reconcile this branch with main.** Options: rebase `feat/gas2-page` on `origin/main` (main's own handoff asks for that) vs
   merge `origin/main` in. Either way resolve `page-b.html` keeping BOTH the s2 spotlight / notes and the 426052d hug shadow,
   and `tasks/handoff.md` keeping both top entries; re-run the headless checks, push the branch. Whether 426052d + 32279f5 go
   to main is Dan's word (a main push = a site deploy, though `tools/` is not built into the site).
2. **Next section** (Dan picks): phones (the radio can't be reached at 390 px; Yoni flagged it), the wall sign, the mailbox,
   the chalkboard.
3. **The ⤓ arrow:** keep the fallback glyph or draw an SVG in Oswald's weight.
4. **"Same loudness"** stays out of the copy until the auto-level is measured on real mixes.

### Suggested commit splits

- One commit: `docs(handoff): GAS 2 page session 2026-10-23 (danavivi-a3)` — `tasks/handoff.md` only.

### Cleanup TODOs

- Dan's main clone `tools/_gas2-scene/` (git-excluded, the 2026-10-21/22 original): holds the 16 unused frames, the reference
  photos and the frame scripts; the worktree copy is the live one now. Keep as the archive until Dan says otherwise.
- `~/.impeccable/config.json` (home, not a repo) gained two file-scoped waivers for `**/tools/_gas2-scene/*`: `marquee` (the
  house button shine) and `overused-font inter` (the site's body font).
- Bench lesson not written to the shared law book (`revaudio-shared` carries another session's uncommitted `LESSONS.md` /
  `bench.js` edits): when the bench subject sits on the right edge, dock the harness panel left (page-b does it with a CSS
  override, `html.benching .bench-panel`).
- Node 26.0.0 on Dan's Mac has CVE-2026-111497: upgrade to 26.12.1+.

### Memory written this session

- None in auto-memory (venture rules stay in the venture). The design rules went to `DESIGN.md` on this branch: §3 product names
  in the plugin's header lockup + the script line's second use, §5 paper on glass, §7 the readings recipe + its shadow.

## 2026-10-22/23 — GAS 2 page: the radio player (Claude Code `revaudio-cd`, Yoni's laptop 2) — DONE for now, Yoni: "yalla we got it!" (branch pushed)

Claim: OPEN (Yoni's radio). Files: `tools/_gas2-scene/player/**`, ONE `<head>` line in `page-b.html`, `tasks/gas2-radio-plan.md`.
Branch `feat/gas2-page`, worktree `Website/revaudio-website-g2p`. Full state + numbers: `tasks/gas2-radio-plan.md`.
- Now: no pop-up, no zoom. The radio stands IN the scene on the bench (1.3x the photo's radio, slid 23 frame px left for
  room from the pump) and is the player: dial HIP HOP / POP / ELEC. / ROCK, keys PLAY-STOP | ORIGINAL | GAS 2 (pressed
  keys light up), Yoni's KNOB LAB knobs (volume, tuning), red jewel while playing. Caption under the bench, inside the
  radio's width. The photo's radio + `#radio` hotspot are hidden from radio.css (`#scene #radio`); `#radioCap` restyled
  there too. A lower bench is laid over the frame from the frame's own pixels (`img/bench-low.webp`; the frame untouched).
- Since: keys read pressed = DOWN / up = UP at full size; the photo radio, its shadow and the old bench are painted out
  (`img/noradio.webp`, a masked gpt-image-1 edit of the frame, `gen_noradio.py`); the stool is a cut-out of the frame's
  bench (`img/stool.webp`); radio + stool are placed by CSS numbers on #scene (radio.css "WHERE THINGS STAND"), Yoni's
  final pick from the `page-b.html?rbench` placement panel: radio 1.33x at x 11.8 / bottom 49.25cqw, stool x 11.8 /
  floor 54.4 / width .93 / height .75.
- Audio: HIP HOP / POP / ROCK = Yoni's renders, every station -11 LUFS both sides; ELEC. = placeholder. GAS 2 settings
  shown: HIP HOP PREMIUM 140 %; POP / ROCK owed by Yoni.
- For Dan: (1) on phones the scene crops the radio off-screen (x < 0 at 390 px) - your layout; (2) real Safari not
  checked yet; (3) radio.css only touches page-b's `#radio` / `#radioCap`, nothing else of yours.
- Next: Yoni's POP / ELECTRONIC / ROCK renders (dry + gas + grade / amount) -> `player/tools/prep_audio.py <id> dry gas`.
### Session end (2026-10-23, `revaudio-cd`, close-session)

- `feat/gas2-page` = origin (0 / 0), last `4bfc117`; only this note uncommitted. Worktree `Website/revaudio-website-g2p`.
- NOT pushed elsewhere (both wait for Yoni's word):
  - Website main clone: `main` ahead 3 / behind 33: `70f8f8d` + `860e56a` (rescued notes from earlier sessions) + `a5fa319`
    (2 Web Audio lessons from the dropped jukebox). A push to main = live deploy. The jukebox itself is dropped from main
    (Yoni) and kept on LOCAL branches `archive/gas2-jukebox` + `archive/gas2-jukebox-notes` (main clone only).
  - Shared clone: ahead 3 / behind 3: `fa5a1a2` (design-language: a pressed key reads down by depth) on top of
    `9b5a0c4` + `c392a35` from the jukebox session -> Yoni to say "push shared" (merge --no-ff, then push).
  - Shared, uncommitted: `tools/knob-lab/library/knobs.json` = Yoni's radio knob card ("GAS 2 RADIO TUNING · KNURL ·
    10-23 17:25", saved by serve-lab) -> commit on his "save"; `memory/feedback_placement_bench_early.md` + its
    MEMORY.md line (mine); MEMORY.md also holds another session's uncommitted line (Hebrew-layout), not mine.
- Background processes (all on Yoni's laptop 2, started this session):
  - `python -m http.server 4462` (page-b), PID 13620. Kill: `Stop-Process -Id 13620`.
  - `serve-lab.py 8797 --pages .../player` (radio KNOB LAB), PID 2836. Kill: `Stop-Process -Id 2836`.
  - `python -m http.server 8793` from `C:/RevAudio` (knob bake), PID 40696. Kill: `Stop-Process -Id 40696`.
- Unverified: real Safari / Firefox / a real phone; sound by ear in a browser (headless only measured gains + loudness).
- Next session decides: (1) POP / ROCK GAS 2 settings (caption) + ELECTRONIC renders, from Yoni; (2) "push shared";
  (3) push the 3 website-main notes commits or not (live deploy); (4) Dan's answers: phone crop, Safari check.
- Cleanup: `player/knoblab/knob-recipe-yoni-2026-10-23.bake.json` untracked + now gitignored (bake output, fine).


## 2026-10-22 — GAS 2 page: the station mockup on branch `feat/gas2-page` (Claude Code `danavivi-a3`, Dan's Mac) — BRANCH PUSHED, NOT MAIN (Dan: "push this branch so Yoni can work on the player")

Claim: OPEN. Files: `tools/_gas2-scene/**` (static mockup, no build step; README there). Split (one writer per file set):
**Yoni = the player** (the radio block in `page-b.html` + its own files under `tools/_gas2-scene/player/`, wired in with one
`<link>` + one `<script>`); **Dan's session = everything else in `page-b.html`.**
- What: the GAS 2 product page as one scene (final frame v17, desert station at dusk): wall sign = 3 grades, notes, radio =
  player (visual only, no audio yet), mailbox = email signup (dummy ticket, sends nothing), chalkboard = prices, pump = the
  real plugin UI (iframe to :4461). Readings on the right: GAS 2 + FREE, "Thicker, smoother, glued master." (Bebas, honey),
  honey Download button, script "Fill it up." (Dan's picks 2026-10-22: his bench export folded in, measured at his Safari
  1141x636 to 0.2 px; the tag line dropped; the spec line removed). `page-a.html` = frozen 2026-10-22 snapshot; `ab.html`
  = A/B viewer; `?bench` = shared bench harness (bench.js symlink, not committed).
- Not in git (Dan's Mac only): 16 other frame candidates, reference photos, frame-generation scripts.
- Open: "same loudness" / auto-level is NOT in the copy (needs a measured check first); the mailbox form is a dummy
  (real contract = the trial worker's `/download/register`); fonts self-hosted woff2 (OFL); page not yet in `src/`.
- Next: Dan walks the page section by section (readings done); Yoni builds the player.

## 2026-10-19 — /gas "Hear it": desktop shows the 3-track mixer only, the pedal toy stays on phones (Claude Code `revaudio-2a`, laptop 1) — PUSHED TO MAIN = LIVE 2026-10-20 (user: "push to main this session only"; commits `058fa84`..`ec2f4a4` + this handoff line)

Claim: CLOSED 2026-10-19. Files: `bench/gas-mixer-bench.html`, `public/gas-mixer/gas-mixer.js`, `src/pages/gas.astro`, `tasks/handoff.md`, `tasks/player-toy-redesign-plan.md` (a note at the top).
- Ask (laptop 1 user, with two screenshots): remove the pedal toy section, keep the "Under the hood" mixer. Picks: phones keep the toy (the mixer does not fit a phone; the old phone player is gone since `1cf38db`); keep the "Hear it" title, fix the line under it.
- What: the component's `doFit` sets `.hood` on every non-phone width (< 760 = phone, as before); `.hood` hides `#toyfit`, so desktop = the mixer, hood always open; the OPEN THE HOOD handler is gone; the toy's frame work runs only on phones. `#wrap` lost its 30 px top margin (nothing above it now). /gas: line under "Hear it" = "Press play, then give it some gas." (true for the mixer and the phone toy); the space reserved before the component builds = `aspect-ratio: 1600 / 958` (the mixer's stage; was the toy's 1100 / 632, max 632 px).
- `gas-mixer.js` NOT made by a full export: `bench/assets/gas-mixer/` (gitignored) is not on laptop 1. It came from the export script's own text steps (scratch runner: export_component.py up to "write", manifest numbers read from the current js), which first reproduced the committed `gas-mixer.js` byte for byte from the committed bench. So the next real export on laptop 2 gives the same js; audio, images and fonts are untouched.
- Checked on the built dist (headless Edge): 1280 -> reserved 1232x738 = built 1232x738, toy hidden, mixer + note arrow shown, PLAY on the mixer runs (tape counter rolls, fuel needle follows the audio); 1440 -> 1392x833; 390 -> toy 342x830, mixer hidden; 1280 -> 390 -> 1280 while playing swaps both ways; no console / page errors (Cloudflare RUM CORS on localhost aside). Not checked: real Safari / iPhone, sound by ear.
- Then (user: "looks good", move it up so "Hear it" is in the first look): desktop only (>= 901 px), the hero is one screen minus 11rem, its bottom gap 3rem -> 1.5rem, the Hear it top gap 2rem -> 1rem. Measured: the title + its line sit inside the first screen at 1280x720 (line ends 703), 1366x768 (735), 1440x900 (852), 1536x864 (816), 1920x1080 (1032), and the whole hero (plate, button, fine print) still fits above them. Phones unchanged.
- Then (user: shorten the line under "Hear it", sexier, another font from the site's): picked A of 3 on screenshots (Yellowtail script / Permanent Marker / Special Elite). The line is now "Hit play. Give it gas." in Yellowtail, `--brass-bright` + soft glow, `clamp(1.9rem, 3vw, 2.4rem)`. Yellowtail joined the site's own fonts (`src/styles/fonts.css` + `src/styles/fonts/yellowtail-latin.woff2`, the same file `public/station-mixer/fonts/` ships), so /gas does not lean on another player's generated folder. `DESIGN.md` §3 gains the script-accent rule. Checked: font loaded (`document.fonts`), one line at 1440 and 390; the title + line still inside the first screen at all five laptop sizes. The "same loudness" claim left this line (the phone toy's display still says it).
- Then (user: raise it all more, down to the "Under the hood" note): desktop first screen = hero + title + line + the whole note. `--gas-peek: 17rem` on `.gas`; hero min-height = 100svh - nav - peek; the plate's max-height follows the screen, `clamp(25rem, 100svh - nav - 3.5rem - peek, 600px)` (the copy column is 408 px, so the plate never goes below it); line -> mixer gap 1.5rem -> 0.75rem. Measured at real window sizes (screen minus browser bars): note whole at 1440x789, 1440x900, 1920x953, 1920x1080, 2560x1300; title + line in but the note cut at 1536x730 (29 px), 1280x720 (23 px) and 1366x657 (note just starting): the hero (copy column 408 px) does not leave room there. Plate 400-600 px tall (was 475-600).
- Then (2026-10-20, user: "a bench so I can place this area", then "no gap between the line and the mixer"): a local GAS lab bench, `public/gaslab.html` (git-excluded in `.git/info/exclude`, never committed; served by `npx astro dev --port 4430` at `/gaslab.html`): the real dev /gas in four same-origin iframes at real window sizes (1366x657, 1536x730, 1440x789, 1920x953), driven by one live `<style>` each; sliders + drag HEAR IT for RISE; COPY = the desktop @media block. The user's COPY is baked verbatim into gas.astro: peek 24rem, hero top 1.5rem, line size up to 4rem, line top gap 0, line -> mixer -7.625rem (the mixer's empty top strip slides up under the line; the note sits beside it). Plus one line of my own after the user's block: `margin-bottom: max(-7.625rem, -9.5vw)`, because at a 1000 px window the fixed pull ran the console over the line's descenders and the note onto the plate (identical from ~1284 px up). Checked on the real page (no lab style) at 1000x700, 1280x720, 1366x657, 1440x789, 1536x730, 1920x953, 2560x1300: hero whole, note whole in the first screen, console 21-49 px below the line, note clear of the title and line; 390 unchanged (toy). Build green. Lesson in `tasks/lessons.md` (2026-10-20).
- Next: a look at the live /gas on a laptop and a phone (real Safari / iPhone not checked). Delete `public/gaslab.html` (and its exclude line) once the user is done with it.

## 2026-10-18 — Trial-end offer: cart applies `?offer=CODE` locked, branch `trial-offer` (Claude Code `revaudio-70`, Yoni's laptop 2) — PUSHED TO MAIN = LIVE 2026-10-18 (Yoni: "push"; Pages deploy + smoke test green, live /buy/revlimiter/ carries `ra-offer`)

Claim: CLOSED 2026-10-18. File: `src/components/Cart.astro`. Worktree `Website/revaudio-website-offer` (off origin/main 141d400; its `node_modules` is a junction to the main checkout's, same lockfile).
- What: a plugin's one-time trial-over banner -> licence worker `GET /offer` -> `/buy/<slug>/?offer=CODE`. The cart keeps the code for the tab session with that slug, shows "Your one-time 10% off <plugin> is applied at payment" in the drawer, and passes `discountCode` + `settings {showAddDiscounts:false, allowDiscountRemoval:false}` to `Paddle.Checkout.open` while that plugin is in the cart. Popups already skip `/buy/*`. `wiki offer`.
- Checked: build green; Playwright on the built dist with Paddle.js stubbed, 9/9.
- DECIDED (Yoni 2026-10-18): DRIFT goes on sale on Sun Nov 1, not before. That day: DRIFT on sale in `plugins.ts` (status `live`, `introPriceUsd: 69`, `paddlePriceId: 'pri_01m4362j96wvbqtwf2v45k2pt9'`). Without it `/buy/drift/` does not exist and the DRIFT offer link lands on a 404. That is the Nov 1 flip.
- Not checked: a real Paddle sandbox checkout with a real code (that `discountCode` plus the two settings render as expected inside Paddle's overlay).
- Next: Sun Nov 1 = DRIFT on sale in `plugins.ts` (line above); then a real checkout through a banner link (code applied, no code field).

## 2026-10-18 — /revlimiter/ for Google Ads (fixes F + G) (Claude Code `revaudio-75`, Yoni's laptop) — PUSHED TO MAIN = LIVE 2026-10-18 (Yoni: "push", "do all parts and push")

Claim: CLOSED 2026-10-18. Commits on main: `21caf5e` (trial form sends the `ra-src` note with /download/register; privacy text + date 2026-10-18; needs licence worker `3bbefa8`, live), `ef2cc1b` (crane door + BUY patch PNG -> WebP via getImage, both BuyButtonCrane + CraneDropZone, -174 KB), `a4ccea1` (`seoTitle` / `metaDescription` optional plugin fields used only by [slug] <title>/meta; RevLimiter title "RevLimiter – Mastering Limiter Plugin", new description, tagline gains "plugin"; 1% resting floor `max(0.01, …)` on the crane door's light layers so LCP is the hero image, not a light layer that appears at the strike).

- Checks: reference build + screenshots in `C:\RevAudio\Website\pagespeed-ref-2026-10-06\` (`dist-crane-ref`, `shots-crane-ref*`, `shots-crane-new3`): only visible change = the tagline word; door max pixel delta 11/255. Real Chrome, phone viewport, 4x CPU: LCP 3.66 s -> 0.41-0.53 s (hero IMG). Live verified (title, tagline, WebP 68 KB, floors in CSS).
- Not fixed: Lighthouse mobile (simulated) stays 62-65, LCP render delay ~5 s from the 2 render-blocking CSS files + constant animation main-thread work (the 2026-10-06 plan judged splitting the CSS risky). PSI API daily quota was out; 🧑 run pagespeed.web.dev on /revlimiter/ for the official number. Google Ads Quality Score (landing page exp) re-rates over 1-3 weeks.

## 2026-10-15 — Homepage word wall: WEIGHT (checker S4), branch `feat/drift-wordwall` (Claude Code `revaudio-32`, laptop 1) — PUSHED TO MAIN = LIVE 2026-10-18 (Dan: "push")
- Dan: "let's fix the weight" + "lighter without hurting quality" -> go. Plan, numbers and checks: `tasks/todo.md`
  (top section + "Review — WEIGHT").
- Claim CLOSED 2026-10-15: `src/components/WordWall.astro`, `tasks/todo.md`, `tasks/handoff.md`, `tasks/lessons.md`.
- Base: started on origin/main 697f49d; rebased onto edb5049 for the push (main now ddada3d + later commits).
- What changed: the TV frame + DRIFT's poster are no longer in the first load. They load once the page has loaded (or
  the first scroll / 3 s) and the wall is a screen away, in the smallest cut that is still pixel-sharp on that screen
  (frame 640/960/1400, poster 800/1100/1400, picked from DPR x the frame's real scale / the window's width), AVIF with
  a WebP fallback. No JS: a `<noscript>` style puts the 1400 WebP back. N2 fixed too (raw drift-window-wall.png and
  gas-hero.png no longer in dist: sizes read via `.clone`).
- Result (same server, Chromium, load + 4 s): laptop 2264 -> 1887 KB, phone 1822 -> 1515 KB; the TV costs 183 KB on
  a laptop / 70 KB on a phone when it comes into view (was 380 KB up front on both). AVIF PSNR >= the old WebP at
  every cut. Laptop 1280@2 on WebP pixel-identical to before.
- Open: Dan's real iPhone / Mac Safari check (the AVIF path never ran in a real Safari here; headless WebKit on
  Windows has no AVIF and took the WebP fallback).
- Bench note (dev only): the bench's Frame size slider changes the frame's scale without a resize, so the frame cut
  upgrades only at the next resize / roll switch / reload; at DPR 1.25-1.5 a bigger slider value can look a touch soft
  in the bench until then. Reload before judging sharpness there.
- Pushed 2026-10-18 on Dan's "push": rebased onto origin/main edb5049 (the cart attribution commit from another
  session, already live; files apart); only this work's commits went out. Re-checked after the rebase: build green, no
  __wwbench / raw PNGs in dist, reduced-motion shots identical to the checked build, video + frame + poster in Chromium
  (AVIF) and WebKit (WebP fallback), no console errors. Post-deploy check: `curl -I` one live `/_astro/*.avif`
  (content-type image/avif through Cloudflare) + the weight check on the live site. Stale cached HTML is safe: the old
  1400 WebP names are still in the new dist.
- Session end 2026-10-18 (revaudio-32): deploy + smoke test of ddada3d green. Live checks done: the live HTML carries
  `data-ww-art`; `/_astro/*.avif` served as `image/avif` through Cloudflare; Chromium gets the AVIF cuts, WebKit the WebP
  fallback, video plays, no console errors with nothing stubbed (the CF beacon "integrity" errors seen first came from
  the test's own empty-body stub of cloudflareinsights). Live weight (compressed): laptop 1661 KB at load + 4 s, TV 0 KB
  up front / 184 KB at the wall; phone 1201 KB until the load event with the TV at 0, then 73 KB right after load.
  Worktree clean, branch = origin/feat/drift-wordwall, 1 behind origin/main (21caf5e, another session's trial form):
  pull before the next work here. No background processes left running.
- OPEN for Dan (unchanged by this work unless noted): real iPhone + Mac Safari look at the wall (the AVIF path never ran
  in a real Safari); bench pick -> "apply ww bench" (bakes the values, deletes rolls 1 and 3); design calls N6 (video
  pause control) and N7 (scanlines over the phone button); the big-screen word cap; Instagram shots for Yoni.
- Git audit at rv close 2026-10-18 (report only, nothing touched): `feat/drift-wordwall` merged into main;
  `garage-pass` merged; NOT merged and not this session's: `feat/home-library` (d6f0e0c, its own worktree
  `.claude/worktrees/home-library`) and `chore/remove-old-store-code` (71b00d7). The main clone's local `main` sits at
  697f49d, 5 behind origin/main (no tracked changes there; an untracked root `HANDOFF.md` from 2026-09-06, not ours,
  left as is).
- Then, on Dan's picks (2026-10-18, "one by one"): the handoff commit pushed (21caf5e..cc5a1d8, deploy + smoke green);
  the main clone fast-forwarded to origin/main (its untracked root `HANDOFF.md` untouched); `feat/home-library` left
  to its session ("don't touch"); `chore/remove-old-store-code` DELETED ("clean it"): its one commit 71b00d7 had the
  same patch-id as 6d7ec55, already on main (`git cherry main 71b00d7` = "-"); 774a5d9 then removed the second
  old-store engine. Local-only branch, never on GitHub. 71b00d7 is NOT in any reflog; the object stays until `git gc`
  (restore: `git branch chore/remove-old-store-code 71b00d7`).

## 2026-10-14 — Homepage word wall: DRIFT panel, two new looks + HD live window on a bench, branch `feat/drift-wordwall` (Claude Code `revaudio-32`, laptop 1) — PUSHED TO MAIN = LIVE 2026-10-14 (Dan: "send a checker; if it passes push to main, if not fix then push"); bench tuning ("apply ww bench") still open
- Dan: "the DRIFT panel on the word wall needs a more interesting design" -> picks: build BOTH looks (NEON sign / STEER the
  words, + BOTH) and show them on a bench; the window = an HD live video of DRIFT running.
- Worktree `.claude/worktrees/drift-wordwall` off origin/main 6bc09b0 (node_modules = junction to the main clone's).
- ~~Active thread (owner revaudio-32)~~ claim CLOSED 2026-10-14 (session closed by Dan): `src/components/WordWall.astro`, `src/lib/wordwallDrift.ts`, `tools/wwbench/*`,
  `astro.config.mjs` (one line), `public/drift/wall-run-*`, `src/assets/showcase/drift-window-wall.png`,
  `src/assets/seasons/drift/tv-broken-*`, `tools/gen-drift-tv-frame-broken.sh`, `tools/cut-drift-tv-frame-broken.py`,
  `DESIGN.md`, `src/assets/seasons/drift/MANIFEST.md`.
- Plan: `tasks/todo.md` (top section).
- Built: `DRIFT_LOOK` ('current' | 'neon' | 'steer' | 'both', default 'both') in WordWall.astro -> `data-ww-look` on the DRIFT
  panel only; NEON = glass tubes, SLIDING lit magenta + spill on the wood, ドリフト tube, power-on flicker, hover lights;
  STEER = pointer steers per-word springs, SLIDING skid smear, phones = one drift-in; BOTH = both. Logic `src/lib/wordwallDrift.ts`.
  Window = `<video>` of DRIFT 5.2.8 (wall-run-1440 / -800), plays only when the panel is active + in view; reduced motion = poster.
  WordWall falls back to the old `<Image>` if the wall-run files are missing, so they must ship in the same commit (they do).
- Same day, Dan: "more of a TV screen, like we've been doing" -> the run plays on /drift's keep-it TV (tv-frame-3 bezel,
  bulged CRT tube, scanlines, livery ink, CRT turn-on) in every look but 'current' (8a26985).
- Then Dan: "not what I meant, the whole back a digital screen" -> `DRIFT_BG` 'screen' (default): the wall behind the
  DRIFT panel = /drift's phosphor screen between the rails, glass/scanlines over the panel; `DRIFT_WIN` 'plain' (default)
  | 'tv'. Bench: WOOD/SCREEN WALL + PLAIN/TV WINDOW switches, Screen glow + Screen scanlines sliders.
- Then Dan: "the frame in DRIFT's vibe, a broken TV frame" -> `DRIFT_FRAME` ('rails' | '1' | '2' | '3', default '2'): the
  screen wall sits in a broken CRT cabinet front (3 AI rolls, `tools/gen-drift-tv-frame-broken.sh` + `tools/cut-drift-tv-frame-broken.py`,
  `src/assets/seasons/drift/tv-broken-*`), 9-sliced, runs tiled, rails hidden while it shows, emerald pilot LED in the chin.
  Then Dan: "more neutral, fewer colours" (so every plugin can play on the same set, only the screen changing, like
  channels): the frames are re-cut colourless (luminance + a faint warm cast), checker in grey, LED = house --emerald.
  Steer stops at the opening (`.ww-frame-glass` in wordwallDrift.ts). Bench: RAILS / BROKEN TV 1-3 + Frame size + Wood around the TV.
  Frame size is capped by the real side gutter (minus the wood gap): ~0.25 at 1141-1280, more on wide screens, ~0.065 on
  phones (bezel ~16 px, the corner damage barely shows there); the wood gap is laptop-only.
  Checks: build green; Chromium 1141 / 1280 / 1728 / 860 / 390 / 360 (rolls 1-3 x size 0.2 / 0.4, gap 0 / 24 / 48: words,
  kicker and window always inside the glass), WebKit 1280 + 390 (renders the same); swap to RevLimiter / GAS / Radio Roulette
  pixel-identical to the 'rails' setting (rails back, frame gone); left lock at 1141 keeps every word inside the glass; real
  Chromium with a classic scrollbar: frame right = clientWidth, bezels 58.3 / 57.8 px; one page load fetches only
  tv-broken-2 (the others load only when the bench picks them). Unpicked rolls get deleted at "apply ww bench".
- Then Dan's reason for "neutral": "every plugin on the TV, only the screen changes when the carousel moves, like changing
  channels" (picks: each plugin its own screen colour, a short burst of static, no channel number). CHANNELS, 3 commits:
  3b5dff0 the TV moves from the DRIFT panel to the whole word wall (`WALL_BG` / `WALL_FRAME` on `.ww`, were DRIFT_BG /
  DRIFT_FRAME); a5b89c5 one phosphor colour per channel (`--ww-ch-<slug>-h/-s`: RevLimiter amber 26/78, GAS gold 46/62,
  Radio Roulette cream 38/28, DRIFT violet 280/70; words, kicker, caption, name, window edge in that phosphor; DRIFT
  NEON/BOTH keep their tubes); 5a1ef8d a grey-snow burst (`--ww-snow-ms` 300) on every channel change (canvas, rAF only
  during the burst; none under reduced motion / hc / wood / hidden tab / off screen / same panel). This SUPERSEDES the
  "RevLimiter / GAS / Radio Roulette pixel-identical / rails back" checks above and below: those panels now play on the TV.
  Checks on 5a1ef8d: build green, no __wwbench in dist; Chromium + WebKit 1141 / 1280 / 1728 / 860 / 390 / 360 x 4 channels:
  everything inside the glass, 0 sideways scroll; static Chromium + WebKit 1280 + 390 (on at +120 ms, off by +820 ms, none
  off screen / same panel), Chromium reduced motion none; hc Chromium + WebKit 1280 + 390 (no TV, plain words);
  drift.homeLead off (flipped on the dev server, restored): RevLimiter first on the TV, channels inside the glass, static
  fires (Chromium 1280, WebKit 390). Review in `tasks/todo.md`. Not checked: real iPhone / Mac Safari, Firefox.
  Real carousel clicks (Chromium): on 1141x636 / 1280x665 laptops the wall is below the fold when the carousel moves,
  so the static is skipped (the visitor scrolls down to the new channel already on); on 390x844 and 1728x1000 the
  wall's top shows under the carousel and the snow plays. Open question for Dan: keep, or play the static when the
  wall scrolls into view after a channel change (not built). Bench header DRIFT / RevLimiter / GAS / Radio Roulette
  buttons = change channel (plays the static in both frames).
- Then Dan (he still saw the purple-black checker): "replace the purple with a burnt yellow, like RevAudio's colour". The
  checker paint on the top-left corner is now burnt RevAudio yellow (cut script: PAINT_HUE 36 near --brass, each pixel's
  own saturation + value kept, only inside the corner patch); rest of the frame stays grey; tv-broken.json unchanged.
  Why he still saw purple: dev's /_image is served with max-age 1 year under a URL that ignores the file's content, so his
  browser kept the pre-neutral roll. Dev now adds the PNG's mtime to the frame URL (`&v=`); the build's names were
  already content-hashed. Checked: Chromium 1280 DPR2 shots on DRIFT + RevLimiter (yellow checker, no console errors).
- Then Dan: "when I scroll, the site fits the screen exactly, not past the edges top and bottom" (pick: only the TV + a
  scroll lock). Part A (laptop >= 861px): the TV = one screen under the nav, the panel sized to the glass, a scroll lock
  (Lenis) after the visitor's own scrolling. Checks in `tasks/todo.md` (review "ONE SCREEN, part A"). Phones unchanged.
  Part B (phones, <= 860px): Dan "build part B"; checks in `tasks/todo.md` (review "ONE SCREEN, part B"). Origin/main
  (ee84c0b, another session's /drift GLUE COMP work) merged into the branch (c1dada5) before the main push.
- Then Dan: "send a checker that the site's functionality and speed stayed optimal; if it passes push to main, if not fix
  then push". Checker (revaudio-website-agent) found 1 BLOCKER + 4 SHOULD-FIX; fixed: B1 the lock trapped small steps
  (one wheel notch / arrow tap pulled back) -> land only when this gesture brought the TV closer; S3 no lock on a
  sideways wheel / Space on a button / open dialog / hc; S2 the first panel's reveal (layer divs made every panel
  `:not(:first-child)`) -> `.ww-panel ~ .ww-panel`; S1 landscape phones (844x390 ...) had 0x0 windows -> media floor
  8rem (the TV there is taller than the screen: it scrolls, no lock); + WebKit: wait while Lenis still glides. Review
  "CHECKER FIXES" in `tasks/todo.md`. Not fixed then (FIXED 2026-10-15, WEIGHT entry above): S4 first load +~369 KB laptop / +~246 KB phone (the TV
  frame webp 254 KB at every width + the DRIFT poster 136 KB) = the cost of the TV; NITs N1-N7 listed there. Pushed to
  main after the fixes = live.
- OPEN for Dan: phone + laptop check of the live homepage (real iPhone / Mac Safari never checked), bench pick ->
  "apply ww bench" (deletes unpicked rolls 1 + 3), big-screen word cap, his further list, Instagram shots for Yoni.
- Bench: `npm run dev -- --port 4430` in the worktree -> http://localhost:4430/__wwbench (laptop + phone frames, look switch,
  WOOD/SCREEN + RAILS/BROKEN TV 1-3 switches, sliders incl. the channel colours + Static length, COPY SETTINGS ->
  "apply ww bench"). Dev only, absent from dist.
- Checks (website agent): build green; Chromium + WebKit 24/24 (1280 DPR2 / 1141 / 1440 / 860 / 390 / 360 x 4 looks): no sideways
  scroll, no word/window/kana overlap; RevLimiter / GAS / Radio Roulette pixel-identical; video pauses on swap / scroll-away;
  reduced motion + hc OK. Open: real iPhone / Mac Safari check (kana renders thin in Windows WebKit), Dan's taste pick.

## 2026-10-14 — Claude Code `revaudio-12` (Yoni's laptop) — both site players' toy redesign SHIPPED (Yoni: "push those ones to the website and deploy")

Claim: CLOSED 2026-10-14. Took over `revaudio-c7`'s stale claim (session gone) on the toy files: both benches,
`tools/*-mixer/*`, `public/gas-mixer/`, `public/station-mixer/`, `tasks/player-toy-redesign-plan.md`.

- Deployed from worktree `../revaudio-website-toy` (branch `players-toy-deploy`): `81a00e0` + `c4f08e6` cherry-picked
  onto origin/main, both components re-exported, GAS export taught the toy art, pedal A hard-wired. Details + test
  log: `tasks/player-toy-redesign-plan.md` § Ship.
- The main clone `main` still holds the original `81a00e0` / `c4f08e6` (git drops them on its next rebase).
- Open: real ears on the UI sounds, real iPhone, Firefox.

## 2026-10-12 — /drift WATCH! bursts bigger + a laptop/phone placement bench, branch `feat/drift-watch-bubble` (Claude Code, Dan's Mac) — COMMITTED LOCAL, NOT PUSHED
- Dan: "make the video bubble 'watch this' bigger and a bit better placement, a bench for phone and laptop, I'll place it
  and resize it". Branch off origin/main 6c33d31, worktree `.claude/worktrees/drift-watch-bubble` (dev `astro dev --port 4420`).
- `drift.css` (4 placement rules only): laptop 196 → 264 px, pinned a bit lower on the TV corner (right -26, top -54 beta /
  -50 creators) so the tail lands at the end of the headline and the spikes clear the R rail at 1141; phones 178 → 232 px
  (min(232px, 60vw)), translate -4% so the burst body is centred.
- Bench `/__watchbench` (`tools/watchbench/`, dev only, never built): the real /drift in a laptop iframe (1141x636 default;
  1280/1440/1728/1001) + a phone iframe (390x844; 360/430), driven from outside. Drag = move, corner dot = resize, arrows,
  -/+, undo, COPY CSS → "apply watch bench" folds it into the 4 rules. Clicks never start the video.
- Checks: build green (bench absent from dist); Chromium + WebKit at 1001/1141/1440/1728 + 360/390/430: no sideways scroll;
  bench drag/resize/undo/export verified in both engines.
- Open: Dan's own placement in the bench, then apply + push (main = live, his word).

## 2026-10-15 — Claude Code `revaudio-02` (Yoni's laptop) — DRIFT #hear test drive (before/after player), native to /drift

Claim: CLOSED 2026-10-19 — PUSHED + LIVE (Yoni: "lets push to live website the design we made for the drift's a/b
player"). `drift-player` rebased clean onto origin/main `1f7fd5d` (pre-rebase tag `drift-player-prerebase-2026-10-19`),
build green, pushed `1f7fd5d..c4587e5` (only this branch's 25 commits; main's unpushed GAS/Radio player work NOT included).
Deploy + Smoke test green, CF cache purged; live revaudio.net/drift #hear renders, 0 broken images, 0 console errors
under the live CSP. Still unverified: real iPhone / Firefox / Safari (below).
Worktree `../revaudio-website-dpl`, branch `drift-player`. Files owned (until close):
`src/components/drift/DriftHear.astro`, `src/lib/drift/{hear,speakers,snap}.ts`, the #hear block in
`src/styles/drift.css`, the #hear / snap lines in `src/pages/drift.astro` / `src/lib/drift/init.ts` /
`src/data/drift.ts` (demoMode 'real', demoWholeSound true) + `src/lib/drift/bus.ts` (one comment),
`src/data/drift-pods.json`, `public/audio/drift/`, `public/drift/{knob3d-drift-65,pod-l,pod-l-cone,pod-r,pod-r-cone}.webp`,
`tools/drift-player/*`, `bench/drift-{start,neon}-bench.html`, `tasks/drift-player-plan.md`.
Removed: DriftHeadUnit.astro + demo.ts (the structure test), the toy bench + its art (restore from 6e8a72c).

### State at session end

- Branch `drift-player`: 24 commits ahead of origin/main, 0 behind (fetched 18:25). Last: `a9d1ddc`. The saved design is
  tagged locally `drift-hear-design-2026-10-15` (not pushed; `git checkout drift-hear-design-2026-10-15` to see it).
  Nothing pushed. The shared repo has my local commit `b866f9d` (memory note), also unpushed.
- What's built (Yoni, on the way: "great job! beautiful!", "perfect", "that's perfect"): #hear under the hero = "LET'S
  DRIFT." — a track list (5 stems), the magenta LCD (waveform L over R, PAN readout, clock), PLAY/STOP caps, FLIP = a worn
  gunmetal push-to-start with a neon tube (lit = DRIFT, dark = original; bars chase while loading, the tube strikes when it
  plays) + DRIFT's own house knob for VOLUME (bars lit to level), the page's balance screen, two photographed speaker pods
  beside the title (cone pumps per channel along its axis), faint smoke. The measured pan drives the page's pan bus (hero
  wheel + rails). Compact: desktop panel 592 px, phone 689 px. Page-wide soft snap (snap.ts). Details per round:
  `tasks/drift-player-plan.md`.
- Checks run: `npm run build` green after every step; headless Edge desktop 1440/1920/1366 + phone 390 (screenshots, no
  console errors); snap tested with real wheel input (desktop) and native scroll (phone emulation). Live CSP read
  (connect-src 'self', style-src 'unsafe-inline'): nothing the player uses is blocked.

- After the close (same day): the three steps wear three of the page's own panels so they read apart: 1 = the keep-it
  TV bezel round the CRT list, 2 = the trial plate (checker cap), 3 = the #drive section plate (carbon, X screws); the
  inner steel pair plate is gone. Desktop panel 590 px, phone 705 px (fits + snaps: -1 / 0 px).
  Then: Yoni's live-bench round applied (d940a18); the speakers + smoke REMOVED on Yoni's word (speakers.ts, the pod art,
  drift-pods.json, gen/cut_speaker.py deleted; restore from f3e212f). Desktop 555 px, phone 654 px.

### Unverified

- Never heard on a real phone / iPhone Safari (audio decode + memory, touch swipes + the snap's feel). Yoni saw the phone
  layout only in a 390 px desktop window ("that's perfect").
- Firefox / Safari never tested (all checks were Chromium/Edge).
- `dist/` was not served under the live CSP headers (the memory note's pre-push step); only the header values were read.

### Background processes

- `npx astro dev --port 4381 --host 127.0.0.1` in the worktree, bg `btqjln3wm` (this session). Kill: the PID on port
  4381 (`Get-NetTCPConnection -LocalPort 4381 | % OwningProcess | % { Stop-Process -Id $_ }`).
- `python -m http.server 8795` in the worktree, bg `by9vv6vi8` (serves the benches). Kill: same, port 8795.
- An Edge app window (phone size) with a temp profile under the session scratchpad: just close it.

### Things the next session needs to decide

1. ~~**Push**~~ DONE 2026-10-19 (`c4587e5`, see the claim line). Old route, for the record: Route: `git -C ../revaudio-website-dpl pull --rebase`
   (origin/main may have moved), `npm run build`, serve `dist/` under the live CSP, then push `drift-player` to main
   (main = live GitHub Pages deploy). Name any other session's commits that would ride along (none at 17:15).
2. **Shared repo commit `b866f9d`** (memory note) goes out with the next shared push.

### Memory written this session

- `shared/memory/feedback_site_interactive_embeds.md` (+1 bullet, committed `b866f9d`): a season page gets a NATIVE
  section built from its own parts, not a bespoke object.

## 2026-10-09 — /drift #band v2: DRIFT's real BAND SELECT + STEREO IMAGER on a real vocal (same branch, Claude Code, Dan's Mac) — COMMITTED LOCAL, NOT PUSHED
- Dan on v1: "close, not it": real spectrum + real imager from DRIFT, a vocal on the band select, no factory presets, give
  "Below and above the band, your mix stays as it was." more love (his pick: a big two-tone line under the screens).
- `DriftBand.astro` + `src/lib/drift/bandscreens.ts` (replaces band.ts): the plugin's left cabinet cut in two, its live layers
  = ports of the plugin's EQ-panel + imager code (5.2.7 index.html: contour, grid, cut shades, handles, caption layout, drag;
  lissajous, phosphor wipe, CORR bar). Data = `public/drift/band-vocal.bin` (65 KB gzipped, lazy). The imager: stems outside
  the cuts sum as they came (mono line), stems inside get DRIFT's true pan law from the page pan bus (hero wheel / TRACKS),
  a slow sway when idle. Hidden range inputs = keyboard access. Opens on 250 Hz - 4 kHz.
- Checks: build green; Chromium + WebKit 1141x636, 390x844; drag moves the cut + changes what pans; crane still lands.

## 2026-10-09 — /drift #band = BAND SELECT, minimal (same branch `feat/drift-fx-rack`, Claude Code, Dan's Mac) — COMMITTED LOCAL, NOT PUSHED
- Dan: "add that there's a filter that picks the area the effects and the whole plugin work on" → own section between the
  hero and #drive, Band Select look, phones too; then "it needs to be very minimized". `DriftBand.astro` + `src/lib/drift/band.ts`.
- One headline ("Pick the slice. DRIFT plays only there."), one draggable LOW/HIGH CUT strip (arrow keys too), three chips =
  real factory presets' bands (Undercut Bass 800-6k, Banking Keys 3-16k, Paul Ricard 6k-20k), one fine line. ~300 px tall.
- Honesty (Drift 5.2.7 DSP): ONE band from a 3-way LR4 split, not multiband; pan + DRIVE + FX run on it, below/above untouched.
  GLUE COMP in its default last slot is whole-output, so the copy says "PAN · DRIVE · FX", not "everything".
- The #fx phone band strip is gone (it lives in #band now). Checks: build green; drag / chip / keys at 1141 (Chromium + WebKit)
  and 390; the crane still lands.

## 2026-10-09 — /drift #fx = the LIVE RACK (DRIFT 5.2.4), branch `feat/drift-fx-rack` (Claude Code, Dan's Mac) — COMMITTED LOCAL, NOT PUSHED
- Dan: "pull the latest DRIFT, design #fx after it, more invested" → pick "Live rack", laptop only. Branch off origin/main
  f5cc588 in worktree `.claude/worktrees/drift-fx-rack` (upstream unset; dev `astro dev --port 4410`).
- 601 px up: the 5.2.4 FX view rebuilt from its own pixels (`tools/shoot-drift-fx-rack.mjs` → `src/assets/seasons/drift/rack/`)
  and run by the plugin's own code (`src/lib/drift/rack.ts`): the 5 strip screens are the plugin's FXV modules
  (`src/lib/drift/fxv/screen-*.js`, verbatim), RANDOMIZE runs the plugin's dice engine (`fxv/drift-randomizer.js`,
  verbatim): real scenes, strips that sit a roll out go dark, a new chain order slides the strips on the rail (GLUE stays
  last), DICE LOG of 8. Boots when the crane lands (strips roll in, screens power on). Headline "Five effects. Any order."
  (the false "Whole sound pans" is gone, phones too). Band strip + bay/spec foot hidden from 1001 px (fit: panel = #drive 570 at 1141x636).
- Phones: only HALO for TREMOLO (pedal re-shot from 5.2.4) + GLUE COMP row for AUTOTUNE (the unmerged cfb357d's ask).
- Not done: the named modes on the strip photos (SYNC, PLATE/FREE, HALO MODE 2) can't change, so rolls hold them on the
  screens; SNAPSHOT A-D are pixels only. Meta description in `src/pages/drift.astro` still says whole sound + tremolo.
- Checks: `npm run build` green; Chromium + WebKit 1141x636 / 1280x720 / 1440x900 / 820 / 390, reduced motion, scroll-crane boot.
- Same day a parallel session put Drift main at 5.2.7 (9490756): its UI differs from 5.2.4 by one preset tooltip, so the rack
  layers, screens and dice engine are current. But 5.2.7 has 61 factory presets (Green Flag): the "PRESETS 60" row is stale
  if 5.2.7 ships.

## 2026-10-08 — /drift RE-PUBLISHED to main + /drift/feedback (Claude Code, Gil's session) — Gil: "push and commit to main all we have done here including Dan's commits"
- `git revert ebdd081` on main (the 10-03 unpublish, as its TRAP note says), then merged `feat/drift-feedback` =
  Dan's `feat/drift-page` @ `13d79cb` + the beta feedback form (`/drift/feedback`, one response per email through the
  license worker's `/form-once` `drift_feedback`, worker `a10bfd4` deployed 10-08) + the BETA FEEDBACK key over Apply.
- `drift.creatorsVideo: null`: the SAMPLE how-to player does not ship (Dan's handoff item 1, his documented switch).
- OPEN for Dan, shipped as-is: `tasks/drift-handoff-dan-2026-10-07.md` — "Whole sound pans" (#fx headline + meta
  description) and the AUTOTUNE spec row are untrue for Drift 5.0.1; the 30-day vs 14-day trial question for Yoni.
- LIVE 10-08 (`8533bf8` + worker `5a7c7c5`): the form posts to the license worker's POST /drift-feedback, which re-checks
  every answer (required, choices, Other text, follow-ups, filler/mash text), allows one form per email, and on a complete
  form mints a one-use $30-off Paddle code restricted to DRIFT (`pro_01m43610g1qfztcfmb0050zqs7`): shown on the page,
  emailed, team copy + code to Formspree. Worker tests: `test/test_drift_feedback.mjs` (34 checks). The worker's question
  list DRIFT_FB_Q is generated from `src/data/beta-survey.ts`: change a question -> regenerate it there.
- OWED: one real submission to confirm the Paddle mint end to end (only tested against a stub). Gil closes the form Oct 25.
- Handed to Dan (Gil, 10-08: "Dan will deal with the rest"): the 5.0.1 copy items above + the real how-to video.

## 2026-10-07 — Dormant second old-store checkout engine removed (Claude Code `revaudio-96`, laptop 1) — pushed 2026-10-07 (Dan: "push", double-checked)

Dan, 2026-10-07: "למחוק" (delete it). Claim closed 2026-10-07; nothing in flight.
- Paddle is the cart's only checkout now in code too: `site.checkoutEngine` (and its two-engine union type) is gone,
  `Cart.astro` always includes paddle.js, always prints "Payment handled securely by Paddle", always opens the Paddle
  overlay, and no longer emits `data-engine`; the never-live second old-store branch is deleted. `plugins.ts`: the
  per-plugin old-store checkout path field (type + RevLimiter + Radio Roulette values) is gone. Comments updated.
  History docs under `tasks/` that mention that store as NOT USED are left as they are.
- Checks: `npm run build` green (23 pages); that store's name: 0 in `src/` and 0 in `dist/` (was in every built
  page); Playwright suite 68/68 (28 s). Buy-flow probe (Paddle stubbed, paddle.js CDN blocked, `/buy/revlimiter/` +
  `/buy/radio-roulette/`, terms ticked, Checkout clicked) on the local build AND on live revaudio.net gives the same
  result: one `Paddle.Initialize` with the live token + callback, one `Checkout.open` with both price ids and
  `terms_accepted` / `terms_version` 2026-10-07, no page errors. Only difference: no `data-engine` attribute.

## 2026-10-07 — FOR Dan's session `revaudio-96` (legal text, local `56f9a5d` + `0e3228c`): most of it is already LIVE, merge, don't redo

Yoni's session shipped the same privacy/cookie work first (live `1c34cac`, `712281d`; worker `fae16a3` deployed). When you pull you will conflict in `src/components/legal/PrivacyContent.astro` (and maybe `src/data/legal.ts`, `src/components/CookieBanner.astro`). Resolve like this:
- **Keep origin's version** of: Privacy hosting (GitHub Pages), Meta / Google Ads tags only after Accept, providers list (Resend, Formspree, YouTube, Google Ads, Meta), cookie section `#cookies`, `PRIVACY_LAST_UPDATED` (separate from `TERMS_LAST_UPDATED` so the terms stamp on orders doesn't move for privacy-only edits), banner link to Privacy, footer "Cookie settings" (reopen + decline clears ad cookies).
- **Server-side Meta Purchase is now consent-gated** (Yoni: "meta only if user accepts, 100% transparent"): site sends Paddle `customData.ad_consent='granted'` after Accept; worker `fireMetaPurchase` skips sales without it. Privacy says so. So the STATUS note "Meta gets EVERY Paddle sale" is no longer true.
- **Re-apply only what is yours and new:** naming Paddle as merchant of record in Terms / EULA / Privacy (origin still says "our merchant of record" without the name), plus any Terms/EULA edits (bump `TERMS_LAST_UPDATED` for those).
- Lawyer question still open: "we do not sell your personal data" stays; "not for anyone else's advertising" was removed on origin.

## 2026-10-07 — Growth plan Phase 2, RevLimiter page (Claude Code, Yoni's laptop) — committed locally, NOT pushed (Yoni reviews on localhost first)

- Yoni's decisions: RevLimiter goes LAST on the master bus; redline = threshold.
- Files: `src/components/WordWall.astro` (homepage blurb: "early in your master chain" -> "last on your master bus", "redline is the ceiling" -> "threshold"), `src/pages/[slug].astro` (garage wall = Hear it + TrialPlates moved from below the walkthrough to right under the hero; HeroFacts import + phone flex order), new `src/components/HeroFacts.astro` (links to #hear-it / #trial + price, 2 machines, 14-day refund, No iLok; claims mirror BuyButtonCrane's list, change together).
- Verified: build green; Playwright suite 68/68; screenshots 1440x900, 1366x768, 820 tablet, 390 + 360 phones, Radio Roulette desk/phone; no horizontal overflow; Hear-it link lands the section under the nav. Hear it top: desktop 6031 -> 1207, phone 1622 -> 1196.
- Not changed: shared CLAUDE.md still says RevLimiter is "ideally used early in the master chain" (shared repo git is damaged; flagged to Yoni).
- Note: feat/drift-page / qa/drift-page-1005 branches touch `[slug].astro`; the block move may conflict if they merge later.
## 2026-10-07 — Terms + EULA name Paddle as merchant of record; last old-store mentions gone (Claude Code `revaudio-96`, laptop 1) — pushed 2026-10-07 (Dan: "push")
Dan, 2026-10-07: "we are now with paddel" (the legal text must say Paddle). Claim closed 2026-10-07; nothing in flight.
- Correction to the 10-06 / 10-07 `revaudio-f7` entries further down: Terms §7 and the EULA did NOT name the old
  store. `683b934` (2026-10-01) had already made them say "our merchant of record" with no vendor name. This change
  NAMES Paddle; it replaces nothing. Edited: Terms §5 (Paddle introduced: seller of record, Paddle's buyer terms,
  payment details), §7 (refunds executed by Paddle), §16 (purchase = separate contract with Paddle); the EULA
  preamble. No new promise: buyer terms, refund route, tax and refund wording unchanged apart from the name.
- Privacy: Yoni's live rewrite (`1c34cac`) is kept as is; my own Privacy rewrite was dropped (Yoni owns cookie
  consent, Dan 2026-10-07). Per Yoni's merge guide above, Paddle is now NAMED there too, words only: §2 purchase
  paragraph (merchant of record = Paddle; details go to Paddle; Paddle shares order details) and the §5 list item.
  `PRIVACY_LAST_UPDATED` is already 2026-10-07 (Yoni's), so no date change.
- `TERMS_LAST_UPDATED` 2026-10-01 -> 2026-10-07 (the constant's own rule). It now drives only the "Last updated"
  line on /terms and /eula (page + cart legal popup) and the cart checkbox's `data-terms-version`, i.e.
  `terms_version` on new Paddle transactions. Privacy has its own `PRIVACY_LAST_UPDATED` (Yoni's, untouched). No
  re-accept prompt exists: the cart stores slugs only and the box starts unticked on every checkout. The licence
  worker's Paddle path doesn't read `terms_version` (read-only check). The `legal.ts` comment now says
  "Paddle customData terms_version" (no abbreviation).
- 3 placeholder examples on hidden /founders-intake-2yr now say Paddle.
- Checks (rebased onto `a27714e`): `npm run build` green, 23 pages, ~3 s. First retired store's name (char-code
  grep): 0 in src/tests/public and in the built site (origin's own build: 3). Correction: the SECOND retired store's
  name still prints in every built page through the dormant engine below (an agent reported 0; a re-grep found it).
  Dist diff against a build of origin/main: 205/227 files identical; the 22 others differ only by Paddle in
  Terms/EULA, the Terms/EULA date, `data-terms-version` and the founders placeholders. Playwright suite 68/68.
  Rendered /terms, /eula, /privacy from both builds (Playwright script). After `b31bc53` (Privacy names Paddle on
  Yoni's text): build green, Playwright 68/68 (33 s).
- Second dormant checkout engine: removed in the entry at the top (Dan: "למחוק").
  Done elsewhere: the live CSP header has no old-store host (checked 2026-10-07; Yoni's PageSpeed edit). The
  untracked root `HANDOFF.md` is another session's.

## 2026-10-07 — PageSpeed pass (Claude Code, PageSpeed session, Yoni's laptop) — DONE, pushed, claim closed

### State at session end

Branch `main`. All PageSpeed work is pushed (last own commit `af59e16`). The PageSpeed result Yoni reported after the work: **mobile 83** (report 2026-10-06: 70, CWV failed). Plan + results + rollback values: `tasks/pagespeed-plan-2026-10.md`.

- **Code (pushed):**
  - `GarageWall.astro`: wall textures through `getImage()` WebP.
  - `PluginShowcase`, `WordWall`, `PluginCard`: srcset sizes match the real slot (GAS portrait).
  - `index.astro`: hero plate preload.
  - `BaseLayout` + `src/styles/fonts.css` + `fonts/*.woff2`: self-hosted fonts, Bebas + Inter preloaded.
  - `.github/workflows/deploy.yml`: "Clear Cloudflare cache" step (secret `CLOUDFLARE_PURGE_TOKEN`).
- **Cloudflare (dashboard, Yoni):**
  - Cache Rule A: `/_astro/` 1 year.
  - Cache Rule B: pages edge 2 h, browser 10 min.
  - CSP "Security Headers" edited: + Paddle css, + profitwell, + `revlimiter-beta` worker; - Google Fonts, - old-store hosts.
- **Safety net:** tag `ref/pre-pagespeed-2026-10-06` (on origin) + `C:\RevAudio\Website\pagespeed-ref-2026-10-06\`.
  - That folder holds the reference build, screenshots and the check tools: `capture`/`compare`, `measure-imgs`/`imgdiff`, `inp`, `cspcheck`, `livecheck`, `lhsum`.
- **Verified live:** 0 errors / 0 failed requests; screenshots = tested build; checkout overlay opens (cart untouched, so no test purchase); pages `HIT` with TTFB ~0.25 s; deploy purge `"success":true`.
- **NOT mine, in this clone:**
  - `main` is 1 ahead with `1c34cac` (privacy/cookie, "committed locally, NOT pushed" entry below). Any push from this clone ships it.
  - Untracked `HANDOFF.md`, `.handoff-archive/`: another session's.

### Unverified

- Real-visitor Core Web Vitals (28-day window): re-check ~2026-11-03 to see whether mobile now passes.
- INP 379 ms (field) never reproduced in the lab (all taps < 200 ms at 10x CPU slowdown). No code changed for it.

### Things the next session needs to decide

1. **Roll the Cloudflare purge token.** It was pasted in chat once. Options: roll now vs leave (it can only purge). To act: CF → API Tokens → Roll, then paste into GitHub secret `CLOUDFLARE_PURGE_TOKEN` directly.
2. **INP:** 🧑 check CF Web Analytics → Core Web Vitals → INP debug view for the slow element before touching the approved motion.

### Cleanup TODOs

- `C:\RevAudio\_backup\` holds the broken shared `.git` (two copies) + rescued stash files. Delete once nothing is found missing (see shared STATUS).

### Memory written this session

- `reference_revaudio_cloudflare_cache_rules.md`: the two cache rules, purge secret, red-step meaning.
- `feedback_keep_reference_before_risky_changes.md`: tag + ref build + prove every fix (Yoni: "keep current as ref").
- `user_yoni_not_dan.md` + `feedback_no_push_without_explicit_ok.md` reworded: "say push", the user here is Yoni.

## 2026-10-07 — Growth plan Phase 1: privacy + cookie choice match real tracking (Claude Code, Yoni's laptop) — pushed 2026-10-07 (site `712281d` live; worker `fae16a3` deployed, stamp `605299d`)

- Files: `src/components/legal/PrivacyContent.astro`, `src/data/legal.ts` (new `PRIVACY_LAST_UPDATED`, terms stamp untouched), `src/components/CookieBanner.astro`, `src/components/Footer.astro`, `tasks/growth-plan-2026-10.md` (now tracked).
- Privacy now states: Google Ads tag + Meta Pixel only after Accept (gclid on order, hashed email at checkout); server-side hashed sale report to Meta on every sale; trial-request emails; Resend, Formspree, YouTube (nocookie, on play); hosting = GitHub Pages (was "Vercel").
- Banner links Privacy (opens the legal modal). Footer "Cookie settings" reopens the banner; Decline after Accept clears `_gcl*`/`_fbp`/`_fbc`/`_ga*` and reloads.
- Verified on local preview (fresh browser context): 0 Google/Meta requests before choice; 10 after Accept; reopen works; Decline clears ad cookies (others kept), reload has 0 hits, gtag/fbq undefined; Privacy link opens modal above banner. `npm run build` green (23 pages).
- Meta CAPI consent-gated (Yoni: "meta only if user accepts, 100% transparent"): `Cart.astro` sends Paddle `customData.ad_consent='granted'` only after Accept; licence worker (RevLimiter repo) stores `sale.adConsent` and `fireMetaPurchase` returns without it. Privacy text updated to match. Worker tests: test_ads 3 new checks fail on old code, all suites pass. Deploy order: worker first (deploy.ps1, Yoni), then site push.
- Test order PASSED (same day, Yoni, 100% code): CSV row for `txn_01m4bnz1t86vxhrkcpw09ska7n` with gclid `TESTabc123456`. Google will reject that fake click in the daily import for 90 days (until ~2027-01-05); Yoni: leave it, ignore the error. **Phase 1 complete** pending the push.

## 2026-10-07 — trial Sign-up conversion value per product (Claude Code, Yoni's laptop) — DONE, claim closed
Owner: Claude Code. `src/data/plugins.ts` gains `trialConversionValueUsd()` (price × 0.12, assumed trial-to-sale rate);
`TrialPlates.astro` + `TrialStamp.astro` put it on `data-trial-value` and the Google Ads "Sign-up" conversion sends
it in USD (was a flat ₪1 for every product). Checks: build green (23 pages); Playwright on `astro preview` with
consent accepted, `/download/register` stubbed: /revlimiter 2 forms → value 6 USD each, /radio-roulette 2 forms →
value 2 USD each; `npx playwright test` 68/68.
Same day, Google Ads account (Ads master plan Week 0, Yoni present): every conversion action except
"Purchase (server)" set to Secondary (Sign-up count One); Data manager HTTPS connection to the licence worker's
`/ads/conversions.csv` linked to "Purchase (server)", daily 18:00–19:00 IL; auto-tagging on, auto-apply off (already);
my Keyword Planner plan removed; "Free desktop software" certification requested (case 4-6073000041684: RevLimiter +
Radio Roulette, 10 countries). Draft "Radio Roulette videos" (Demand Gen) left alone: needs Yoni's call.

## 2026-10-07 — buy state keyed on the Paddle price, old store's checkout links removed (Claude Code `revaudio-f7`, laptop 1) — `5d4b01b` (was `652df7a`), pushed 2026-10-07 on Dan's "push"
Dan, 2026-10-07: "8. OK" (the TRAP follow-up in the 10-06 entry below). Claim closed 2026-10-07; nothing in flight.
- `isBuyable()` = `status === 'live' && paddlePriceId`. RevLimiter's `statusLabel` ('Available now') and both
  `checkoutPaused` (false) are plain values. `checkoutUrl` is gone from the type, the 5 entries and the 2 constants;
  `data-checkout-url` is gone from the 7 buy components. `Cart.astro`: the stored-link fallback was dead (the cart
  persists slugs only) and is dropped; `checkoutUrlFor` renamed `checkoutTargetFor`. `checkoutPaused` is now a
  hand-set flag: a future live paid plugin without a price id is simply not buyable unless it is set to true.
- `tests/smoke.spec.ts`: the old checkout-URL test now needs >=1 add-to-cart button on /store and a `pri_` id in
  `[data-checkout-map]` for every button's slug. Negative control (RR's price unmapped) fails it with that message.
- Checks: `npm ci` (node_modules lacked @astrojs/mdx), `npm run build` green, 23 pages before and after. Built dist:
  205/227 files identical; the other 22 differ only by 9 removed attributes (/, /store, /revlimiter,
  /radio-roulette) plus the cart script hunk; old-store links in dist 9 -> 0. Playwright suite 68/68 before and
  after. Buy probe (paddle.js routed empty, `Paddle.Checkout.open` stubbed; desktop + 390 px): 19 buttons, both
  /buy links and a 2-item cart give the same labels, page text and Paddle items before and after; unticked terms
  send nothing.
- The 10-06 commits were rebased onto origin `1d2aced` on 2026-10-07: c44d11e -> 7037a62, c15f5eb -> 130492a,
  5b96827 -> eb9e1fc; and again onto `ec74182` before the push: 7037a62 -> 997794e, 130492a -> 6d7ec55,
  eb9e1fc -> 1e3c917, 652df7a -> 5d4b01b, aa57d61 -> b8cdbd7. All five went out in the 2026-10-07 push.
- Still naming the old store (untouched, each needs Dan): 3 placeholders on hidden /founders-intake-2yr, one
  `legal.ts` comment, Terms §7 / EULA, the Cloudflare CSP rule.

## 2026-10-06 — dormant old-store checkout code removed (Claude Code `revaudio-f7`, laptop 1) — `6d7ec55` (was `c15f5eb`), pushed 2026-10-07
Dan, 2026-10-06: "remove whatever is not necessary". Claim closed 2026-10-06; nothing in flight.
- Removed: the old store's script tag, overlay, success handler, checkout branch and engine switch from
  `src/components/Cart.astro` and `src/data/site.ts` (`checkoutEngine`); old-store comments in `src/data/plugins.ts`
  and `src/components/TrialPlates.astro`. `sendPurchaseConversion()` now serves the Paddle path only (the growth-plan
  entry below still says it is shared). Undo: `git revert c15f5eb`.
- Verified on a local build (23 pages): Playwright on /revlimiter and /store, `Paddle.Checkout.open` stubbed (no real
  order): called once with the right price ids + terms fields; unticked terms send nothing. Only the cart script
  changed in the built pages. The "no client-side Purchase pixel" warning in `Cart.astro` was kept as is: the
  growth-plan owner should confirm it once the Meta server-side hookup lands.
- TRAP (resolved 2026-10-07 in `5d4b01b`, entry above), kept on purpose: the old store's two `checkoutUrl` values in `src/data/plugins.ts` still decide whether a
  plugin is buyable (`isBuyable()`, `checkoutPaused`, the "Available now" label, `data-checkout-url` on 7 buy
  components, `tests/smoke.spec.ts` lines 82-83). Deleting them hides every buy button. Follow-up (needs Dan's
  go-ahead, it touches buy-button wiring): make those checks read `paddlePriceId`, then delete the field, the
  attributes and the test lines.
- Still naming the old store: 3 example texts on the hidden `/founders-intake-2yr` form, one comment in
  `src/data/legal.ts`, the Terms §7 / EULA text (waits on Dan) and the Cloudflare CSP rule (outside this repo).
- Local branch `chore/remove-old-store-code` (`71b00d7`, same change on the older base) is redundant: delete it any time.
- `npm ci` is needed before `npm run build` on a clone whose `node_modules` predates `@astrojs/mdx` (blog commit).

## 2026-10-03 — /drift UNPUBLISHED from main (Claude Code) — back to the coming-soon page like /the-ac
Why: the /drift season page reached main and went LIVE 2026-10-01 10:19 UTC (the push of 827b2ec carried 1dd4fbd,
0b0a34a, ccbaa4f, 827b2ec) although Dan's rule for that work was "commit, don't push to main". User asked to revert.
- One commit on main reverts all four: src/pages/drift.astro + src/components/drift/* + src/lib/drift/* +
  src/styles/drift.css + src/data/drift.ts + src/assets/seasons/drift/* + public/fonts/drift/* + public/og/drift.png
  deleted; [slug].astro emits /drift again (status 'in-development', coming-soon plate, waitlist only); popups no
  longer skip /drift (the later /buy/ exclusion kept); plugins.ts DRIFT entry back to the pre-push copy.
- NOT touched: feat/drift-page and feat/drift-mobile (Dan's live work), public/updates/drift.json.
- TRAP for the eventual release merge: those four commits are ancestors of feat/drift-page, so merging it into main
  as-is keeps this revert and silently drops every drift file the branch didn't change again. When Dan says "push":
  `git revert <this commit>` on main first (restores the files), then merge feat/drift-page.
- Catalog copy: the pre-push DRIFT copy says "multiband" / "Autopilot", which 1dd4fbd flagged as wrong against the
  v4.23.0 source. Restored as-is because the copy fix was part of the same unapproved push; re-apply on Dan's word.

## 2026-10-01 — /drift CONVERSION REBUILD (Claude Code) — ~~COMMITTED on feat/drift-page (local only)~~ ended 2026-10-01 (pushed: `ccbaa4f` reached main 2026-10-01 and was reverted 2026-10-03, see the entry above; `feat/drift-page` is on origin too), preview on :4327

## 2026-10-06 — /drift FOOTER END on phones (Claude Code, Dan's iPhone shot: "the black part underneath the footer") — PUSHED feat/drift-page + qa/drift-page-1005; main untouched
DriftStickyBar.astro only (its CSS ships with /drift alone). The house footer's 84 px cart-FAB clearance (global.css, <=900)
is cut here: on /drift the FAB slides off at the footer (or is off with an empty cart). Phones (<=600): the footer fills the
screen under the header at the page end (min-height 100lvh - --d-nav-h, the nav's real height published by the bar script),
links bottom-aligned, so the header sits on the footer's head with nothing under the icons. Checked: iOS Simulator Safari
before/after; 402x760 / 430x830 exact fit (footer top = nav bottom); 1001/1141/1600 pixel-identical (Chrome + WebKit);
768 only 60 px shorter (the band). Other pages keep the band: their cart FAB stays put over the footer.

## 2026-10-05 — /drift SCROLL PERF (Claude Code, Dan: "check the smoothness of the scroll ... make it seamless") — on feat/drift-page (Dan: "commit") + merged into qa/drift-page-1005, both PUSHED (Dan: "push"); main untouched, nothing live
Owner: Claude Code (Dan's session). Branch fix/drift-scroll off feat/drift-page 963672e, worktree .claude/worktrees/drift-scroll
(node_modules symlinked). Files: DriftTracks.astro, trackui.ts, bus.ts, drift.css. No visual change: full-page pixel gate
(node_modules/.cache/drift-qa/scroll/same.mjs, reduced motion) IDENTICAL at 320/402/768/1001/1141/1312/1600 in Chrome + WebKit.
- #drive GPS car: the lapping circle re-rastered the glow-filtered track/plate tiles every frame (Chrome 37 fps on hero + #drive).
  Now a twin svg over the track; while lapping it is a layer moved by a transform delta, at rest no layer (exact old paint).
  pointer-events none (moving, its box swept over the INTENSITY fader / caps: reviewer catch, car-interact.mjs).
- WebKit: the breathing placeholder inside the drop-shadow consoles re-ran the filter every frame (16-21 fps page-wide):
  will-change on both consoles, WebKit only (@supports (font: -apple-system-body)); Blink untouched.
- bus.ts: rails' --pan/--lit-* on .d-rails, not the page root; pan readout text at most 10x a second (iOS WebKit: each new
  string costs a frame). Bars + rails still every frame.
Results (headless, 1141x636 @2, wheel scroll): Chrome dropped frames 13.6% -> 0%; WebKit 46% -> 6%; phone Chrome 0% (same),
phone WebKit 3.5% -> 2%. Gates: crane-gate PASS, car-interact PASS (both engines). Toolkit + traps: node_modules/.cache/drift-qa/scroll/.
Open: WebKit hero zone ~24 ms/frame while scrolling even with all motion paused (content raster, not code); real Safari +
real iPhone check owed (bench page: python3 node_modules/.cache/drift-qa/scroll/real/serve.py <port> <dist> <label>,
open /drift-bench/). Merge to main = live deploy = Dan's word.

## 2026-10-04/05 — /drift PHONE REDESIGN, all six sections (Claude Code, Dan leads) — PUSHED: feat/drift-page 221517a + QA branch qa/drift-page-1005; main untouched, /drift still coming-soon live
Owner: Claude Code (Dan's session). Scope: PHONES ONLY (@media max-width 600px); every width 601-1600 stayed pixel-identical
(gate: node_modules/.cache/drift-qa/nonphone-gate.mjs, baseline np-base-head). Walked on the iOS Simulator (iPhone 17 Pro, 402).
- f9f4117 merged feat/drift-mobile (the 10-02 phone pass) in; kept the 10-04 #fx.
- HERO (e04ecaa, 1bcae1a, 221517a): wheel 215vw off both edges, no gauges, sways ±10° (display only, no drag); tagline behind
  the rim (LET YOUR SOUND white); the offer on the keep-it TV's CRT BEHIND the wheel (Press Start head, VT323 field + red
  digital GET IT on one row); $69 / ETA NOV 1 engraved + paint-filled on the rim in Oswald (#d-engrave), pair centred on $69;
  no ドリフト on the phone hub. Gate: drift-qa/occlusion-gate.mjs (no offer glyph under wheel pixels at ±20°).
- #drive (eba387e, bb910b7, 76e9081): trial-plate 9-slice, no 速度, no faders/value screens, no picker (ONE circuit laps),
  GPS 76% + live pan meter, "40 TRACKS. / SYNCED TO YOUR BPM."; chips renamed to circuit names on ALL screens (gen PICK).
- keep-it TV (77b49b2): the road to Nov 1 runs down the screen; no email box on the TV.
- #fx (a9dc0b2): coverflow carousel of TRUE-ALPHA pedals (tools/shoot-drift-fx-pedals.mjs shoots them from the plugin UI).
- #get (5244f5a, de62eda): the hero's offer on the trial plate; no compat rows/folds; fine print -> fineShort (2 lines).
- #creators (8e022a2, 40971db, fd1c2ea): step-card carousel on car-window GLASS (frit, seal, reflections), APPLY etched into
  the glass, no ON AIR / etch mark. Shared engine src/lib/drift/coverflow.ts (#fx + #creators).
RELEASE: qa/drift-page-1005 = origin/main 09e6465 + REVERT of ebdd081 (the 10-03 unpublish; its own note says revert it before
release) + feat/drift-page. Merges clean, builds clean, smoke PASS. Going live = push that branch's HEAD to main (Dan's word;
auto mode blocks the agent). Rejected this session: page-long CRT, wheel overlapping #drive, B/C variants on every bench.
Open: wheel art is 1000 px (soft at 3x; upscale = paid, Dan's call); phones still fetch the hidden gauge PNGs; dead 10-02
rules + the kicker markup to delete; team QA on qa/drift-page-1005.

## 2026-10-04 — /drift FINISHED from #fx down (Claude Code team) — COMMITTED LOCAL on feat/drift-page (9061a74, 9d5617c, 4d203bf), NOT pushed, dev :4328
Owner: Claude Code (Dan's session). Same branch/worktree as the entries below (one writer). Main untouched, nothing live.
Why: Dan 10-03 "make a team of ui/ux, sales copywriter, brand to finish the page with the same style we made so far. end it"
+ "the work is only from EFFECTS downward, nothing else gets touched". #get = slim closer (orchestrator's pick, Dan didn't object).
How: Workflow wf_e1a29e29-065 (designer + copywriter Opus, brand Sonnet -> Fable art director spec -> 2 Opus builder lanes ->
Sonnet verifier -> Fable fixer) + one Fable polish pass after the orchestrator's review.
- #fx (9061a74): plate S1 chassis like #drive (vector twill face, 周波数 sticker, no new asset); one-row head "WHOLE SOUND PANS.
  FX ON ONE SLICE."; band glass lights "FX PLAY HERE" between the cuts (one phosphor flicker on first view, off under reduced
  motion); 4 real strips; bay + "Also under the hood" spec rows. Old ▶EFFECTS kicker head, catch line and strip hover removed.
- #get (9d5617c): the hero's trial console twin (trial-plate.png 3-sliced >=1001; CSS panel + 試乗 below). Left: "Runs on your
  setup. / 14 days free." (phase-aware) + MAC/WIN compat + Specs/DAWs folds as tabs; right: DriftCapture (id now get-capture).
  #try = the whole console (.d-getin), so the phone sticky bar's jump shows head + compat + field. Field fits its placeholder >=1001.
- #creators (4d203bf): NEW dashcam bezel dashcam-bezel-2.png (tools/gen-drift-dashcam-bezel.sh, gpt-image-1 text-only, roll 2
  of 2, ~$0.50) + live livery (配信 lamp, ON AIR, SPEED SOUNDS BETTER, viewfinder brackets). Dan's head one row (phones: STREAM
  IT. / GET DRIFT FREE.), steps + VIDEO CHECK readout, violet Apply + DRIFT BETA note in caps (address lowercase). The maker line
  moved here under a finish-flag checker strip: the page ends on it.
Verified: scope gate + upper gate PASS (node_modules/.cache/drift-qa/scope-gate.mjs, upper-gate.mjs: hero + #drive + TV
pixel-identical to dc20ae7 under reduced motion at 1312 + 390); astro build clean; no overflow 360-1728; mocked /form-once POST
{form:newsletter, source:drift-trial} + status + nudge; phone jump lands head at 142 px.
Trap: drift.css SECTION 4 (#get) also holds the FORM BASE rules the hero + TV forms use (.d-field*, .d-hp, .d-capture-status*,
.d-capture-next): never rewrite them as #get-only.
Open: Dan's walk of the three sections; dashcam roll 1 vs 2 (roll-1 shot only in the session scratchpad); real phone + WebKit
desktop unchecked; design hook flags .d-band-cut border-right (the cut marker line, intentional, left); feat/drift-mobile unmerged.
Push/merge to main = live: only on Dan's explicit word (pull first).

## 2026-10-03 — /drift section walk, laptop only (Claude Code, Dan leads) — PUSHED to origin/feat/drift-page (dc20ae7), dev :4328
Owner: Claude Code (Dan's session). Same branch/worktree as the entries below (one writer). Main untouched, nothing live.
Why: Dan walks /drift section by section and leads each change; laptop only (1312x740), phones NOT checked.
- #drive (b12f776..cae94e0): 8 iconic circuits, real plugin outlines, COUNTRY names only (never circuit/F1 names);
  head one row "PICK A TRACK. DRIVE YOUR SOUND AROUND."; INTENSITY + SPEED plugin faders either side of the GPS (layout B,
  live braking: DriftFader.astro, lib/drift/faders.ts, circuits.ts); whole section on AI plate S1 (vector twill face);
  inner panels + catch lines removed (AUTO DRIFT now only on the store card).
- Keep-it (c7ebadc..dc20ae7): a TV in the plugin's CRT cabinet (tv-frame-3.png, livery as live type, bent tube); the
  free-trial email gate on the screen (same /form-once contract as the hero, mock-tested only); "TRY IT FREE FOR 14 DAYS."
  red; then THE ROAD TO NOV 1 (drift.ts lapFor): START Oct 10 / CHECKPOINT Oct 24 / FINISH Nov 1 with $0 / $39 / $69
  chips, the video as a SHORTCUT lane over the lap, the GPS car driving it in view (init.ts initLap). 'closed' keeps the boxes.
Verified: production build clean; 1312 DPR2 screenshots; car on the nodes; lap pauses off screen.
Open: PHONE — the lap's SHORTCUT sign is 388 px inside a 244 px screen at 390 (no <900 layout yet); #drive faders/plate and
the TV unchecked on phones; feat/drift-mobile (phone pass off 10cb0e8) not merged in. Page has 3 trial forms (Dan's call on
#get). Plugin should ship the bacinger/f1-circuits MIT notice (Yoni/Gil). Next in the walk: #fx, #get, #creators.
Push/merge to main = live: only on Dan's explicit word (pull first).

## 2026-10-02 — /drift PHONE PASS (Claude Code, Opus orchestrator) — PUSHED to origin/feat/drift-mobile 2026-10-03 (Dan: "commit and push to branch"; main untouched, nothing live), dev :4335
Owner: Claude Code (Dan's session). Own branch + worktree `.claude/worktrees/drift-mobile`, off feat/drift-page 10cb0e8
(the drift-page worktree belongs to another session: it had uncommitted drift.css + DriftTracks.astro edits, not in here).
Why: Dan's mobile-only brief: on a phone the page has ONE job, the trial email (creators second); desktop frozen.
How: inventory → 6-agent debate (designer · touch · editor · CRO · IG buyer · perf, 2 rounds, Fable merge) → Dan's picks →
2 Opus builders (CSS+markup ∥ scripts) → main review → Fable fix pass. Docs: ~/workspace/revaudio/stages/04_website/output/
2026-10-02-drift-mobile-inventory.md + -proposal.md (IDs F1… below are that file's).
Dan's picks: ≈6.3 screens (cockpit kept), JS allowed (phone-gated), nothing under the wheel, kicker "The pan plugin that
drives itself", no linear steer, haze off on phones, car keeps lapping, key stays "Get it ▸", all DO-NOW + H5/H6/D3/G4.
Files: drift.css (ONE block at the end: `PHONE PASS 2026-10-02`, ≤600 only + a ≤355 cap rule + a ≥601 hide block for the
new markup) · DriftTrialStamp (kicker, phone fine line = captureCopyFor().fine, creators nudge, aria) · DriftCapture (input
attrs, aria) · DriftFx (X3 line) · DriftStickyBar (≤600 zones = the hero key, #try's key, #creators, footer, rootMargin 0;
away on email focus + after sign-up; 601-900 keep the old zones) · init.ts (bar → nearest form, Lenis-safe; photo hold
during a jump; key-press sprite prefetch) · capture.ts (joined state on phones: data-drift-joined + sessionStorage) ·
wheel.ts (cancel = no coast; aria ≤2 Hz from the car) · bus.ts (--pan/--lit writes only ≥1100; write-on-change) · trackui.ts.
Verified: build clean; full-page ZERO pixel diff vs 10cb0e8 at 1280/1600 (Chromium + WebKit) and 601/768/900; iPhone 17 Pro
Simulator shots of every changed section (402 default + 350 at 115% zoom, cookie banner up and down); WebKit 350/390/402/430:
no horizontal scroll, ≤1 red per viewport, hero GET IT bottom 417-425 px (was 952-1021) above the first-visit cookie banner;
both forms POST {form:'newsletter', source:'drift-trial'} to /form-once (mocked). Phone DRIFT body 7.7 → 6.45 screens (402),
first load 556 → 489 KB @3x.
Open: real phone + IG in-app check (Dan); on a FIRST visit to /drift#creators the cookie banner covers Apply (402: bottom
28 px, 350: all): Dan's call; Simulator can't tap, so the bar's nearest-form jump + keyboard are probe-verified only.
Push/merge = Dan's word only (merge to main = live). The probes live in the session scratchpad, not the repo.

## 2026-10-02 — /drift: THE HERO'S LAW BELOW THE HERO (Claude Code, Fable orchestrator) — COMMITTED on feat/drift-page (local), dev :4328
Owner: Claude Code (Dan's session). Same branch/worktree as the entries below (one writer).
Why: Dan on 10-01, after the hero pass (3d37174): "fonts and layout, minimize with the catch phrases, really this is what I
love" → apply the hero's principles to the whole page. The law: Orbitron = names + numbers only; Oswald 700 caps = every line
the page says (fine print 500, dim); Press Start = kickers; mono = readouts + inputs; kana = decoration (subset font);
two-line heads white/purple; steel panels with screws, level; one red per viewport; copy = catch phrases, facts exact.
Then Dan's own idea: the page's first catch phrase in the band between the trial console and LET IT DRIVE; copywriter
proposed ten, Dan picked "LEFT. RIGHT. NO HANDS." (own commit, DriftHero.astro + .d-hero-catch).
How: 3 workflows (37 agents): 4 reviewers → merger (spec: scratchpad drift-law/merged-spec.json, session-local) →
helpers + 2 builder lanes → 4 verifiers → Fable fixer ×2 → full re-verify ×3 → orchestrator fix pass.
- #drive: lede → "Pick one. DRIFT drives your whole sound around it." + mono tempo readout; CRT wrapped in a DriftPanel
  level with the GPS panel (2x4 chips ≥1280); AUTO DRIFT line under both; cap focus rings; hover ≠ selected.
- Keep panel: two-line head "After 14 days. / Keep it, three ways."; routes "Post a video ›" FREE · "Feedback form · by
  Oct 24" $39 · "Release · Nov 1" $69 (drift.ts heroCond); sub line hidden ≤900 (the phone bar says it).
- #fx: head "Whole sound pans. / FX on one slice."; strip captions Oswald; prose → dl.d-spec-plate (SATURATE / AUTOTUNE /
  PRESETS); band strip full width; phone hides the sat bay.
- #get: duplicate ladder DELETED (the Keep panel is the one ladder); one panel: MAC/WIN compat rows (compatRows()),
  email, GET IT key in the hero's Oswald (ctaFor().label 'Try it free' → 'Get it' page-wide); fine print
  "Download by email, Sat Oct 10. Open it on a computer. You join our list · unsubscribe anytime."; error lands under
  the key; key keeps its width while sending ('Sending', capture.ts).
- #creators: catch "Film a session with DRIFT. Post it. Anyone on the trial can."; steps on a steel panel (Orbitron
  numerals, min-height 32), VIDEO CHECK glass level with it (one lamp per row on phones); step 3 "It must pass the
  video check."; Apply key Oswald; mail line keeps its case.
- Phone sticky bar: the hero console + footer are CTA zones (never two reds); key 'Get it ▸' Oswald; micro line Oswald;
  panel-steel strip; the cart FAB slides off over the hero key, heads, catch lines, Keep, VIDEO CHECK and the footer;
  bar tap lands #try without focusing the field (init.ts).
- h2.d-headline 64 → 52px at desktop. New helpers .d-catch / .d-fine / .d-readout (drift.css, above SECTION 2).
Verified: build clean; Chromium 1440 + WebKit iPhone 13; hero parity probe = only #drive moved; font-fallback = only the
▸ arrow; console clean; phone scrollWidth 390; ≤1 red per viewport while scrolling; forms mocked (ok / err / already);
page 5.25 screens desktop, 9.4 phone. Probes: node_modules/.cache/drift-qa/{hero-parity,font-fallback,orch-gates}.mjs.
Open (low, for Dan): the Reverb strip image shows a 'FREE' tempo dropdown (plugin screenshot; re-shoot with 1/4 or
accept); phone compat rows leave a '·' at a line end; step 1's lowercase URL inside a caps line; the rails still
leave with #drive (option: run them down the page = move the .d-drivezone close tag); real /form-once POST + a real
phone are still unverified. Dan's verbatim lines untouched.
Push/merge to main = live: only on Dan's explicit "push" (pull first).

## 2026-10-01 — /drift CONVERSION REBUILD (Claude Code) — COMMITTED on feat/drift-page (local only), preview on :4327
Owner: Claude Code. Same branch/worktree/files as the 09-26 entry below (one writer), plus new `DriftCapture.astro`,
`DriftCreators.astro`, `DriftStickyBar.astro`, `public/og/drift.png`, woff2 subsets in `public/fonts/drift/`.
Why: Dan's conversion review brief (2026-09-30) + his decisions the same day: D2/H1 the car pans the WHOLE sound (the
LOW/HIGH CUT band is only where echo/reverb/tremolo/pitch play); offer = 14-day free trial, keep it free with a video
(creator deal via /affiliate, "DRIFT BETA"), $39 with the feedback form, $69 at release Sun Nov 1; no buy button,
checkout, coupon wording or download link before release. Review + architecture (21-agent workflow):
`~/workspace/revaudio/stages/04_website/output/2026-10-01-drift-page-conversion-architecture.md`.
- Page: 10 blocks → hero · #drive · #fx · #get (email capture #try) · #creators + phone sticky bar; #hear slot renders
  only when `drift.demoMode === 'real'` (the browser test synth can no longer ship). Deleted DriftBand/Auto/Sat/Specs
  + band.ts. `assertDriftConfig()` fails the build for phase 'open' without the feedback form (tested), 'released'
  without checkoutUrl or real audio/trial-after-release.
- Capture posts {form:'newsletter', source:'drift-trial'} to the licence worker /form-once (relays every field to
  Formspree); an existing subscriber gets `already` and is told to email info@ (not relayed).
- Verified (build workflow, 26 agents, 2 fix rounds): build clean; copy/honesty, visitors A/B/C, streamer, brand,
  code review, iPhone 17 Pro simulator + mocked capture flow all pass; axe clean; ≤1 red CTA per viewport; phone
  hero CTA bottom 340 px. Desktop 7.2 → ~5.0 screens, phone 11.7 → ~7.8. Phone first load (WebKit) 454 KB, of which
  ~220 KB is site-wide chrome (JS, Inter, haze bgs, Paddle, CF beacon): the 350 KB budget can't be met from /drift alone.
- Open: `src/data/plugins.ts` DRIFT entry corrected to D2/H1 in its OWN commit (drop it if Dan wants the store card
  untouched). Owed outside this page: plugin must pan the whole sound + 14-day trial (Dan working on it), feedback
  form ($39 route), who emails the trial on Oct 10, /affiliate doesn't prefill DRIFT BETA, AAX flag when built.
Push/merge to main = live: only on Dan's explicit "push" (pull first).

## 2026-09-26 — /drift season page, STRUCTURE TEST (Claude Code) — ~~COMMITTED on feat/drift-page (local only)~~ ended 2026-10-01 (`0b0a34a` reached main with the 2026-10-01 push and was reverted 2026-10-03; `feat/drift-page` is on origin), preview on :4327
Owner: Claude Code. Branch `feat/drift-page` in worktree `.claude/worktrees/drift-page` (off origin/main 1776b45).
Dan: "all the style of DRIFT in the page — assets, purple, panels, neon; fresh, not the RevLimiter/RR pages". Plan:
`~/workspace/revaudio/stages/04_website/output/2026-09-26-drift-page.md` (decisions: house shell stays, hero A "driver's
seat", no F1 names/circuits on site, one full build, demo = test structure).
Files (one writer — don't touch): `src/pages/drift.astro`, `src/components/drift/*`, `src/lib/drift/*`,
`src/styles/drift.css`, `src/data/drift.ts`, `src/assets/seasons/drift/*`, `public/fonts/drift/*`; small edits in
`src/pages/[slug].astro` (skip 'drift'), `WelcomeDiscountPopup.astro` + `ExitIntentPopup.astro` (not on /drift),
`src/data/plugins.ts` (DRIFT copy + systemReq corrected against v4.23.0 source).
~~Committed locally on `feat/drift-page` (Dan: "commit, don't push to main"); NOT pushed anywhere.~~ ended 2026-10-01 (see the heading). Push/merge to main = live; only on Dan's explicit "push".
- Verified 2026-09-26: `npm run build` clean; smoke + welcome-popup suites 60/60 (chromium + mobile-safari) against
  `astro preview --port 4327` (4321 belongs to another session — don't trust a run that reuses it); WebKit shots at
  390 / 1280 / 1600, no horizontal overflow; scripted interactions OK (wheel keys/drag/coast/dblclick, TRACKS car +
  STOP-to-centre, test deck play/stop, LOW CUT keys, SAT type, PUSH START). DRIFT JS 7 KB gz; DRIFT images ~860 KB
  desktop / ~690 KB phone.
- TRAP found: `data-drift` is owned by src/lib/scrub.ts (scroll conveyor translateX) — the page root is
  `data-drift-page`; never put a bare `data-drift` on anything that isn't a conveyor.
- Open: CTA not wired (`drift.gateWired=false` until the licence worker has `drift`); demo deck = browser TEST SIGNAL
  until Dan's 3 bounces land (`demoMode`); fonts ship as TTF (no fonttools here for woff2); AAX not claimed
  (`aaxReady=false`); page ~9 laptop screens (target 5-6) — trim after Dan's look.

## 2026-09-22 — cart drawer redesign (Codex)
Owner: Codex. Scope: `src/components/Cart.astro`, cart plan and this handoff, DESIGN.md cart notes.
User approved the design plan with “go”, then explicitly authorized “push to main make it live”. First step (cart drawer) implemented and verified in the existing localhost:4321 dev preview. Release target: `origin/main`; unrelated untracked GAS assets/files preserved.
- New catalog-based thumbnails/name/price/formats, explicit USD subtotal/tax note, compact brass CTA, clearer empty state, focus restoration, consent feedback and missing-SDK/synchronous-open error guidance. Existing checkout completion, consent metadata and analytics contracts retained.
- Verified: npm run build PASS (31 pages; existing background-asset/chunk warnings); design detector [] and git diff --check clean; browser at default 319px, desktop 1280×665 and short mobile 320×480. Both images load, $49+$19=$68, removal updates total/focus, empty state hides checkout, legal reader + Escape work, consent validation focuses checkbox, short-screen CTA reachable by scrolling, no console errors on final store preview.
- VM checks using production function source PASS: old $93/name/image -> catalog $49/current image, dedupe/qty1, malformed storage, slug-only persistence, USD, missing SDK/synchronous error retains cart, mocked Paddle handoff preserves ID + consent version. No payment network request or real purchase in this change's verification.
- Dedicated inline payment page remains next phase after visual review. Paddle's pre-existing asynchronous error on localhost was not fixed/tested. Legal pages still name the old store while active engine is Paddle (pre-existing; requires content review; done since: `683b934` "legal: name no payment vendor in Terms, EULA and Privacy"). Old already-open tabs running previous cart code should be refreshed after slug-only storage writes.
- Browser left on /store with RevLimiter in the redesigned cart; viewport override reset.

## 2026-10-06 — Growth plan Phase 1 (measurement), step 1: committed locally `de2ef94`, NOT pushed
Owner: Claude Code. Repo `revaudio-website`, branch `main`. Plan: `tasks/growth-plan-2026-10.md` (untracked, not mine, not staged).
- `src/components/Cart.astro`: `sendPurchaseConversion()` shared by the Paddle + LS paths. Sends
  `transaction_id`, value = total − tax from the completion event, its currency; cart sum/USD only as fallback.
- `src/components/CookieBanner.astro`: Consent Mode v2 basic (default denied → update granted, queued before
  gtag.js, loads only on Accept). If an edge gtag already exists: denied update on load/decline, granted on Accept.
- Root cause of "gtag before consent": Cloudflare Google tag gateway auto-injects the tag at the top of `<head>`
  (only for `Accept: text/html` requests). 🧑 Dashboard toggle owed: turn off "add tag to pages", KEEP `/nojr/`.
- Checks: `npm run build` green (23 pages; `npm ci` needed for `@astrojs/mdx` from the blog commit).
  Playwright on `astro preview`, 7 cases: fresh = no Google requests, no `gtag`; accept = consent default/update
  then `/nojr/gtag/js`; decline = nothing; Paddle full event → `{value:30, currency:EUR, transaction_id}` +
  redirect to `/purchase?_ptxn=`; bare event → `{value:49, USD}`; edge-tag sim → denied / granted updates.
  Paddle was stubbed, no real order placed. ~3 test Meta pixel hits from localhost reached the live pixel.
- Repo repair this session: 286 `desktop.ini` in `.git` + missing objects → `git fetch --refetch`, then
  deleted refs pointing at missing objects (`ci/actions-node24-bump` tracking ref, 2 archive tags), refetched tags.
- UPDATE same day: pushed (`ad80681`), then `61b0117` = gtag from googletagmanager.com (the gateway has ONE switch,
  no way to keep `/nojr/` without the injection). Yoni turned the CF Google tag gateway OFF. Verified live in fresh
  profiles: no click / decline = 0 Google requests; accept = gtag + hits. Keep the gateway off.
- Next: Paddle webhook (licence worker) → Ads + Meta server-side, privacy text, Ads conversion-action settings.

## 2026-09-06 (late) — /gas CTA iterations, ~~committed locally, NOT pushed~~ pushed 2026-09-06 (all four commits are on origin/main, live as `eadf56f`; see SESSION CLOSE below)
- d6d10a3 original plugins.ts copy restored (Dan: "copywrite is not good"), new layout kept.
- f6a3612 red chunky CTA. 9e930b2 garage CSS pushbutton (brass bezel + screws + race-red body).
- d027c31 true-alpha CTA (house photo plate). Dan: "revert 2 times" -> gas.astro + DESIGN.md back
  to f6a3612 (red chunky CSS CTA). Garage + true-alpha variants stay in git history.
- (history) true-alpha CTA — `btn-mail-gmail.png` house photo plate reused (blank red pill),
  label = live text `.gas-cta-cap`, press-sink per tools/mailbtn-bench.html values. Gate contract
  (`data-trial-gate-open` etc.) untouched. OpenAI image credits EMPTY (credit_balance_exhausted) —
  no new AI assets generated. DESIGN.md §2 exception line updated. Do not push until Dan says push.

# Website handoff

Updated: 2026-09-06 (session close. Everything PUSHED and LIVE as `eadf56f`. Hero plate is live wearing PLACEHOLDER art - real Higgsfield plates still owed. Hero bench reverted and verified clean.)

## SESSION CLOSE 2026-09-06 (Claude Code) - read this first

State: branch `main`, PUSHED and LIVE at `eadf56f`. Do NOT trust any ahead-count written here -
two writers push this branch. Run `git fetch origin && git rev-list --count origin/main..HEAD`.
This file was committed after the push, so expect at least 1 ahead until someone pushes again.
All 12 local commits reached the remote at 2026-09-06 17:40 local.

CORRECTED AT CLOSE - an earlier draft of this block got the push wrong twice, both fixed here from
the root `HANDOFF.md` that the other writer left at 17:47:
  1. THE PUSH WAS AUTHORISED. Dan typed "commit and push this" in the other session immediately
     before it. His standing rule ("never push until i say to push clearly") was NOT broken. This
     session simply could not see that word, because it was said in a different chat.
  2. THE OTHER WRITER WAS A SECOND CLAUDE CODE SESSION, not Codex. Both sessions commit as the
     shared `shlik` identity, so git could not tell them apart and the first draft guessed wrong.
     Read every "Codex" below as "Claude session B (the /gas thread)".
The lesson that outlives this: on a shared branch, an authorisation given in one chat is invisible
to the other. Local-commit-and-wait is NOT a safe hold - a collaborator's authorised push ships
your committed work with it. That is exactly how the placeholder hero art below reached production.

CONSEQUENCE, the part that matters: the hero patina plate shipped to production wearing the
PROCEDURAL STAND-IN art, not Dan Higgsfield plates. revaudio.net now serves
`--plate-d:url(/_astro/hero-wall.CPIqxQSZ_1jT112.webp)`, a 43 KB PIL-generated gunmetal placeholder,
plus the 27 KB portrait one on phones. Pages deploy run `34039918954` succeeded, smoke test
`34039919110` passed. Dropping the real plates at the same two paths corrects it with no code
change. How it actually reads, verified not assumed (headless Edge shot of the live URL at
1280x800): the stand-in reads as a dark warm panelled wall with faint rivets and seams. Headline,
kicker, red sweep and gauge medallion are all legible and on-brand; nothing looks broken. What is
MISSING is every prop from prompt A - no trouble lamp, no headphones, no walnut shelf, no VU
meters, no dust beam. So this is a swap-when-ready, NOT an emergency revert.
Six are this session (`4c65acc` `0be6bf5` `481560c` `8e675ca` `8c6932a` `c551052`), six are
Claude session B (`de69bad` `d6d10a3` `f6a3612` `9e930b2` `d027c31` `eadf56f`). `481560c` and `8e675ca` are the hero
tuning bench: still in history as commits, but their content is undone by `8c6932a`.

Working tree: clean (this file is committed). CLAUDE SESSION B WAS STILL COMMITTING AND THEN PUSHED
WHILE THIS WAS BEING WRITTEN (`d027c31`, `eadf56f`, then the push), so re-check
`git ls-remote origin refs/heads/main` before trusting anything above. It tried a true-alpha
photo-plate CTA on /gas in `d027c31` and reverted it in `eadf56f`; `src/pages/gas.astro` is back to
its `f6a3612` state, byte-identical (`git diff f6a3612 eadf56f -- src/pages/gas.astro DESIGN.md` is
empty, checked here). Session B owns that file - do not stage, commit or revert it.

Session B left its own close notes in an UNTRACKED root `HANDOFF.md` (5.8 KB, 17:47) so the two
sessions would not write this file at once. Everything useful from it is folded in here and its two
factual claims were re-verified independently. It is safe to delete or move to `.handoff-archive/`;
left in place because this session does not delete files.

Background process left running: `astro preview` node pid 52112, 0.0.0.0:4321, serving `dist/`,
LAN `http://10.0.0.102:4321/`. Stop it BY PID only: `taskkill /PID 52112 /F`. Never broad-kill node.

Unverified at close:
- `dist/` IS CURRENT, correcting an earlier line here that called it stale: `dist/gas/index.html`
  and `dist/index.html` are both stamped 17:40:31, the same second as `eadf56f`. Build was green,
  19 pages.
- The /gas red chunky button has NOT been re-screenshotted since the revert build - the scratchpad
  shots `gas-v5-*` / `gas-v6-*` show the true-alpha plate that was reverted away. Ignore them.
- Dan never PICKED a /gas CTA look. "revert 2 times" lands on the red chunky button by elimination,
  not by approval.
- Hero scrim contrast has NOT been re-measured against a real photo plate; the shipping numbers
  (1.18 / 120% / 43% / 61% = 5.16:1) were measured against the procedural stand-in.

Next session decides:
1. FIRST, because placeholder art is live right now: get the two Higgsfield plates onto disk.
   Portrait 9:16 -> `src/assets/hero/hero-wall-m.jpg`, desktop 16:9 -> `src/assets/hero/hero-wall.jpg`.
   Prompts in `tasks/hero-higgsfield-prompts.md`. Dan sent a 1600x2400 portrait in chat on 2026-09-06
   that never reached disk - ask him for the FILE, not the image.
2. Owed the moment real plates land, all still open: re-measure scrim contrast (4.5:1 on kicker and
   lede - the shipping 1.18 / 120% / 43% / 61% = 5.16:1 was measured against the stand-in), plate
   opacity against the smoke, plate under 250 KB at 1920, and the `DESIGN.md` ride-along (0/4/5/7/10).
3. OPENAI IMAGE CREDITS ARE EMPTY. `image.ps1` returned
   `{"error":{"code":"credit_balance_exhausted"}}` this session. No new AI asset can be generated
   until Dan tops up, so every asset need until then comes from existing house art - which is part
   of why the hero plates are still procedural stand-ins.
4. The /gas CTA look. Session B has now tried three: the red chunky button (`f6a3612`), the garage
   anodized pushbutton (`9e930b2`), the true-alpha photo plate (`d027c31`), and landed back on the
   red chunky one (`eadf56f`). Dan has not picked. Session B owns the file.

No commit splits proposed by Claude Code: all of its work is committed and the tree is clean.

## 2026-09-06 (latest) - /gas sells more: DONE, ~~committed locally, NOT pushed~~ pushed 2026-09-06 (live as `eadf56f`; see SESSION CLOSE above)
Owner: Claude Code. Repo `revaudio-website`, branch `main` (local, ahead of `origin/main`).
Dan: "lets work on the gas page, lets make it sell more" + "work with psychologic and make it simple".
GAS is free, so "sell" = more email-gated downloads. One screen on desktop kept (Dan 2026-07-30).
- `src/pages/gas.astro`: hook "One knob. Sounds expensive."; three-line "what is the catch"
  list (full version / free forever / no trial clock / no credit card / Win + Mac + formats);
  CTA "Get GAS free" (still the TrialGateModal gate, never a plain link); fine print under the
  button says the email step BEFORE the modal opens; video badge labelled with its true length
  2:46, play dot brass so the CTA is the only warm block; named grid areas re-order for phones
  (CTA + fine print above the fold at 390x844, badge last). `<title>` "GAS: free one-knob
  saturator", description with formats. Copy pulls `plugin.oneLiner` from plugins.ts, unchanged.
- `src/layouts/BaseLayout.astro`: `og:image` is now an absolute URL (site-wide, one line).
- `public/og/gas.png` (new, 1200x630) + `public/og-default.png` (new; the live site 404ed it).
- Checks: `npm run build` green (19 pages). Headless shots 1280x665 DPR2 + 390x844 with the cookie
  banner declined + modal + video lightbox: all OK, sent to Dan. Nothing invented: no counts,
  stars, quotes, timers.
- Plan + review: `tasks/todo.md`. Not done on purpose: no audio A/B rack, no RevLimiter cross-sell.
- Next: Dan reviews the shots and says "push". Until then: local only.

## 2026-09-06 (later) — hero patina pass "the bench at night": WIRED, stand-in plates, ~~NOT pushed~~ pushed 2026-09-06 with the stand-in plates (live as `eadf56f`; see SESSION CLOSE above)
Owner: Claude Code. Repo `revaudio-website`, branch `main` (local, ahead of `origin/main`).
Dan: "lets see it !" so the wiring is built now with procedural stand-in plates (PIL: gunmetal
panels, seams, rivets, oxide patches, amber lamp top-left, dark centre). They are placeholders only;
Dan's Higgsfield plates replace the two jpgs 1:1 (same paths, same names), no code change needed.
- Built: `src/pages/index.astro` hero: `getImage()` both plates to webp, `--plate-d` / `--plate-m` on
  `.hero-feat`; `.hero-plate` > `.hero-plate-img[data-drift-y=16]` first child; CSS: `isolation:
  isolate` on `.hero-feat`, plate z:-2 full-bleed, `--plate-alpha` .88 (.8 on phones), `::after` =
  lamp spill + 30% `--bg-0` scrim + bottom fade; `html.hc` hides it; ≤860px swaps to the 9:16 plate.
- Checked: `npm run build` green; headless Edge 1280x800 + 390x844 shots: plate full-bleed behind
  gauge, headline contrast holds, phone swap works. Not yet re-measured: scrim knobs vs a REAL plate.
- Dan sent a 1600x2400 portrait image in chat (not on disk anywhere). Asked him to save it as
  `src/assets/hero/hero-wall-m.jpg`; a 16:9 desktop plate is still needed (prompt A).
- Still owed once real plates land: contrast re-measure (4.5:1 on kicker/lede), plate opacity vs smoke,
  `DESIGN.md` §0 / §4 / §5 / §7 / §10, plate size ≤250 KB check.
- Note: `tasks/todo.md` was rewritten by Claude session B (/gas plan, now committed); Step 3
  hero plan text lives in commit `4c65acc`. Not staged by Claude.
Dan, with a screenshot of the live hero: patina / garage vibe on the first screen, keep the gauge and
its readings where they are, show "we are a music plugin company", assets from Higgsfield, creative,
on brand.
- Plan: `tasks/todo.md` Step 3. Prompts for Dan to run: `tasks/hero-higgsfield-prompts.md`.
- Shape: a Higgsfield photo plate behind the hero (patina steel wall, one caged trouble light top-left
  as the light source, headphones on a hook, a shelf with a reel-to-reel + a VU rack unit), full-bleed
  inside `.hero-feat` (isolation: isolate, z:-2, opacity ~.85 so the smoke still reads), a warm rake +
  `--bg-0` scrim over it, `data-drift-y` 16. Gauge / kicker / headline / sweep / lede: not moved.
- Files that WILL change on build: `src/pages/index.astro` (hero only), `src/assets/hero/hero-wall*.jpg`
  (new), `DESIGN.md` (§0 / §4 / §5 / §7 / §10). Nothing else.
- Blocked on: Dan's go on the plan + the two plates from Higgsfield (A 16:9, B 9:16).
- TRIED AND DROPPED, do not rebuild: a RevEdit tuning bench for the plate and the text scrim
  (`hero.plate` manifest entry + `--plate-*` / `--lamp-*` / `--veil` / `--fade-*` / `--scrim-dx`
  knobs, commits `481560c` + `8e675ca`). Dan: "delete this bench, stick with what we already
  committed and live". Reverted by file in `8c6932a`; the hero is exactly `0be6bf5` again.
- Rule still in force: no push without Dan's word "push".
- VERIFIED CLEAN after the revert (Dan: "so you are sure we clean ?"). Eight checks: working tree
  clean; zero diff vs `0be6bf5` on `src/pages/index.astro` and `tools/revedit/revedit.manifest.json`;
  no `--plate-*` / `--lamp-*` / `--scrim-d*` / `hero.plate` string anywhere in `src/` or `tools/`;
  no plate `data-edit` hook (only the pre-existing `hero.text` + subs + `hero.gauge`); port 4430 dead;
  `origin/main` still `18afe01`; `dist/` carries no knob and still ships the plate.
- Clean confirmed IN PRODUCTION too, not only in the working tree: `curl https://revaudio.net/`
  ships exactly two `data-edit` hooks (`hero.text`, `hero.gauge`, both pre-existing) and neither
  live CSS bundle (`index.BzKgap4_.css`, `_slug_.CgmTf5oC.css`) contains `--plate-*`, `--lamp-*`
  or `--scrim-d*`. No bench knob reached the live site.
- One leftover found and cleared: the gitignored `revedit.overrides.json` still held an orphan
  `hero.plate` entry plus its slot in the desktop `order` list, created by the bench discovery pass.
  Removed. The pre-existing `hero.gauge` values (x -12, y 1, needle -135) were preserved. Local-only
  file, so it never reached a build or the live site - but a `git checkout` revert does NOT clean it,
  which is why it was missed on the first pass.

## 2026-09-06 — garage homepage pass: word wall + smoke (pushed as `18afe01`)
Owner: Claude Code. Repo `revaudio-website`, branch `main` (local, ahead of `origin/main`).
Dan's sequence today: "remove the background clock that gradients to red" (done, `c3fc068`, pushed);
"give us your best shot, garage vibe" (built as `/garage` preview, `7e4b3b6`, pushed too early);
"never push until i say to push clearly"; "revert to the website we had before you pushed"
(`3d2e17e` on main); then, pointing at the stencil-words section: "this is the only keeper all
others remove". So:
- **`src/pages/index.astro`** — imports `WordWall` and places `<WordWall />` between
  `<PluginShowcase />` and `<DAWStrip />`. That is the whole homepage change.
- **`src/components/WordWall.astro`** — LOUD / WARM / PUNCHY / GLUED / DEEP stencil words (brass
  outline, PUNCHY filled oxide) beside the RevLimiter window + one caption line, on the wood wall.
- **`src/components/GarageWall.astro`** — the product-page `.garage-wall` (wood tile, brass rails,
  top light, 38% scrim, `data-drift-y` parallax) as a reusable wrapper.
- **`DESIGN.md`** — website design spec per the constitution, trimmed to what ships.
- **Cut, not lost:** the three photo story rows (car plate, unit render, "30 days" door), the
  `/garage` route and `src/assets/garage/*.jpg` live on branch `garage-pass` (= `7e4b3b6`).
- **RULE (Dan, 2026-09-06): no `git push` on this repo until Dan writes "push".** Commit locally,
  report "committed locally, not pushed", wait. `tasks/lessons.md` has the entry.
- **Smoke (Dan, same day: "add the vibe of the smoke that we had before"):** the two haze plates of
  the old enginebg layer are back as their own thing. `src/lib/haze.ts` (drift + scroll-velocity
  blip + desktop pointer lean, reduced motion = static), `.haze` block in `global.css` (fixed,
  z:-1, paints `--bg-0`; body `background: none`; footer translucent again), markup + `initHaze()`
  in `BaseLayout.astro`, plates `public/bg/haze1.webp` + `haze2.webp`. NOT back: the tach arc that
  hue-shifted to red (the thing Dan asked to remove first), embers, waveform, heat curve.
- Checks: `npm run build` clean (19 pages, `/garage` gone), screenshots 1280 + 390 sent to Dan
  (word wall, then the smoke pass). Preview server left up on http://localhost:4321/.
- Pushed on Dan's word as `18afe01` (deploy green, live). Open question in DESIGN.md §10: which
  stencil word should be the filled one (currently PUNCHY).


## 2026-07-30 (later) — /gas left the shared product layout for a one-screen page
Dan, after seeing the walkthrough below: "ditch this revlimiter layout idea, make it a one pager
short like the size of a regular laptop." So GAS is off `[slug].astro` entirely.
- **`src/pages/gas.astro`** — new, owns the route. Portrait plate left, copy right, vertically
  centred, `min-height: calc(100svh - var(--nav-h))`. The plate is capped by HEIGHT
  (`min(66svh, 600px)`) not width — that cap is what keeps it one screen on a short laptop window.
  Content: name + FREE stamp, `plainHook`, `tagline`, three feature names, the download CTA, one
  mono spec line. Nothing else.
- **`src/pages/[slug].astro`** — `getStaticPaths` now filters out `'gas'`. Without that filter two
  files emit `/gas`. Also reverted the `hasStage` relaxation from earlier today: with GAS gone, no
  plugin has a partless feature (audited: revlimiter 13/13, radio-roulette 14/14), so the strict
  every-feature-mapped invariant is back and unused generality is gone.
- **`plugins.ts`** — GAS keeps its 6 features but loses `stage` + all `part` slugs (dead once the
  walkthrough went). Feature ORDER is now editorial: gas.astro prints the first three names as its
  only feature copy, so DRIVE macro / three voices / 8x oversampling lead. There is no second copy
  of that text on the page.
- **The CTA speaks TrialGateModal's trigger contract directly** rather than reusing `BuyButton` —
  BuyButton's bordered card (price block + 3-line `includes` list) is taller than the whole layout.
  Non-gated branch kept, so dropping `trialGateActive` restores the direct download here too.
  **Verified by clicking it:** modal opens with the free-plugin copy ("GAS is free — grab it",
  "Free forever. Full version, no trial clock"), email field present, `data-plugin-slug=gas` and
  the register URL both correct. The `#dl=`/`#p=` verify-email bounce-back still lands here because
  TrialGateModal lives in BaseLayout. **The download funnel is intact — do not "simplify" the CTA
  into a plain `<a href={downloadUrl}>`, that skips the email gate.**
- Measured: **5293px → 856px of content**, 5.3 screens → 1 screen. Everything above the fold at
  1440x900, 1366x768 and 1280x720. Mobile 390x844 also fits, but the plate had to come down to
  `32svh`: at 44svh the CTA landed under the fixed a11y/cart FABs and the spec line fell below the
  fold. `docScreens` still reads ~1.4 because the site Footer sits below the one screen — the page
  itself is one screen. Squeezing the footer in too would mean a ~480px plate; Dan's call.
- Zero console errors. RevLimiter and Radio Roulette both still render `data-walkthrough` (the
  route filter and the gate revert are no-ops for them).
- **Superseded, not deleted:** the part-highlighter work from earlier today is in `1724a27` +
  `daf25ba` with the 5 measured rects, if a future page ever wants them.

## 2026-07-30 — /gas moved from crossfade to the real part-highlighter stage (SUPERSEDED, see above)
GAS was the thinnest product page: one hero, no `stage`, so "What's inside" just pinned a single
shot. It now runs the same highlighter RevLimiter does.
- `src/data/plugins.ts` — GAS gets a `stage` with 5 part rects + `part` slugs on its features, and
  a 6th feature (**Parallel MIX blend**) for the top-left mini knob, which is a real control the
  page never mentioned. Also fixed a wrong claim: the old oversampling desc said "oversampled per
  voice", but `GAS/plugin/Source/GasEngine.h` explicitly uses ONE oversampler at one factor for
  all voices (HQ 8x / Eco 4x) so PDC never changes on a voice switch. Copy now says that.
- `src/pages/[slug].astro` — `hasStage` no longer demands that EVERY feature carry a `part`. It
  needs one resolvable part, and tolerates features with none. GAS's oversampling bullet is the
  Quality parameter, host-side only, with nothing on the panel to box; that step shows the plate
  undimmed. `walkthrough.ts` already did this for a missing `data-part` — only the gate was strict.
  A `part` that IS set but unresolvable still kills the stage (a typo should fail loudly).
- `src/assets/plugins/gas-hero.png` — replaced 802x1192 with a 1600x2380 headless render of the
  real WebView UI (`GAS/plugin/Source/ui/public/index.html`, served over http, Chrome
  `--window-size=1600,2380`; the UI's `applyZoom` scales its 400x595 canvas by innerWidth/400, and
  `inJuce` is false so it renders standalone). Pixel-for-pixel the same panel as before, just 2x
  the master. The stage asks for a 1200px-wide derivative, which was a 1.5x UPSCALE off the old
  source. Repeat the render the same way if the plugin UI changes.
- **Rect recipe for the next plugin:** compute from the UI's own CSS (element left/top/size, then
  fold in inline `translate`/`scale` and `transform-origin`), then verify by drawing the boxes onto
  the actual hero PNG before trusting them. Two of five were visibly off from CSS math alone,
  because `object-fit: contain` art and drop-shadows inset the visible control inside its box.
- Verified in a real browser (Playwright, built output on `astro preview`): stage mode active, all
  6 steps activate, live-measured box rects match plugins.ts exactly (26.8/27.5/46.8/30 etc.), the
  no-part step goes `visibility: hidden` + opacity 0, mobile ≤900px gives 6 carousel cards +
  "06 / 06" counter, zero console errors, RevLimiter still in stage mode (gate change is a no-op
  for it), /store card serves a 480x714 derivative of the new hero.
- **Still missing for true RevLimiter parity, both blocked on content, not code:** `audioDemos`
  (RevLimiter has 3; nothing exists for GAS, and no demos means no "Hear it" AND no garage wall,
  since `hasWall` = demos || trialUrl and GAS is free with no trialUrl) and `tutorialVideo`
  (RevLimiter has one on YouTube). `galleryImages` is NOT a gap — RevLimiter's is empty too.
- **Dead data spotted, not touched:** `StagePart.thumb` is populated for all 10 RevLimiter parts
  (`revlimiter-part-*.png`, ~10 files in `src/assets/plugins/`) but nothing in the templates or
  `walkthrough.ts` reads it. Either the mobile step-preview was dropped or never landed. Left
  alone deliberately — GAS therefore got no part thumbs. Worth a decision: wire it or delete them.

## 2026-07-26 — "What's inside" active card now aligns with the pinned shot (60e3123, live)
Dan reported the walkthrough section reading misaligned. Cause: `.walk-stage` pins high
(`top: sale + nav + 1.5rem` = 68px at 1280x665) but the per-step ScrollTriggers activated on a
hardcoded `top 55%` line at mid-viewport, so from step 2 on every card lit up 118-156px BELOW
the shot it described.
- `src/lib/walkthrough.ts` only — no CSS/markup change. The activation line is now the pinned
  stage's own centre, measured live (`sticky top + .stage-frame offsetHeight / 2`), via
  FUNCTION-BASED `start`/`end` so every `ScrollTrigger.refresh()` re-reads it. Do not re-hardcode
  a percentage here — it has to follow `--nav-h`, the sale banner and the shot's max-height cap.
- Tail runway: the higher line meant the LAST card reached it exactly as the stage unpinned, so
  `.walk-copy` gets a small JS-set `padding-bottom` (`max(0,(frameH-lastCardH)/2)` — 21px at
  1280x665, 0 on tall viewports, 144px on /gas). **Counterintuitive: bigger is worse.** Once the
  stage unpins, card and shot scroll together and hold their offset, so a large spacer only keeps
  the shot still while the card slides past (tested: 24px → last card exits at -2px; 128px → -105px).
  Set from JS + desktop-only on purpose — no-JS and reduced-motion get no highlighting, so a CSS
  spacer would be dead space to them.
- The lazy-shot `load` → `ScrollTrigger.refresh()` moved ABOVE the `if (!isStageMode || !parts) return`
  early return: the crossfade plugins' line depends on the same frame height and never got it before.
- Verified: card-to-shot centre delta went +118..+156px → -3..+14px, all 13 steps activate at their
  own line, at 1280x665 / 1512x950 / 1920x1080 / 1024x600 / 920x700, and on live revaudio.net.
  Drift / The AC / GAS / Radio Roulette (crossfade path) within ±4px after step 0. Step 0 shows a
  bigger delta on tall-shot plugins ((frameH-cardH)/2) — that is the pre-existing in-flow top-aligned
  opening, NOT a regression; it measured the same before the change.
- Residual ±12px wobble is the intentional scrubbed drift tween on `.stage-frame`. Leave it.
- Harness kept out of the repo (scratchpad): playwright scripts that park at each step's alignment
  midpoint and report delta + pinned. Rebuild from this note if the section is touched again.

## 2026-07-24 (later) — RESOLVED: CSP fixed via dashboard; trial funnel human-verified end-to-end
The Transform Rule was updated in the Cloudflare dashboard (Claude drove Dan's Chrome; Dan
approved): `connect-src` += license worker + www.google-analytics.com + googleads.g.doubleclick.net
+ www.googleadservices.com; `script-src` += www.googletagmanager.com. Verified: edge serves the
new header, live submit on /revlimiter#trial stamps PLATES ISSUED, verification email delivered,
**Dan clicked the verify link twice — portal unlocks, funnel works end-to-end.**
Remaining (optional "round 2", Dan aware): Google Ads conversion pings still blocked — needs
`https://www.google.com https://ad.doubleclick.net` in connect-src and
`https://googleads.g.doubleclick.net` in script-src. Until then gtag loads + fires but the
conversion never reaches Google. Meta's *.on.aws / *.run.app beacons also blocked (cosmetic).
Memory: revaudio-shared `reference_revaudio_edge_csp_transform_rule.md` (the recurring trap).

## 2026-07-24 — BLOCKER (resolved above): edge CSP blocks the on-page trial capture (and the Google Ads tag)
TEMP PLATES (#trial on product pages, `5c14c14` + `ba183a3`) POSTs the license worker's
`/download/register` cross-origin. Worker-side CORS is deployed & verified (DLREG_CORS,
version 64e6b84b), BUT the edge Cloudflare CSP (Rules → Transform Rules → Modify Response
Header, "Security Headers" — same rule as the 2026-07-19 Formspree fix) blocks the browser
fetch first: `connect-src` lacks the worker origin. Live behavior today: every submit shows
the graceful fallback ("open the download page instead") — nothing broken, but the plate
never stamps. Console also shows `script-src` blocking `googletagmanager.com/gtag/js`, so
the AW-18334323184 Ads conversion tag has never loaded on this page.
**Fix (dashboard, zone write needed — wrangler OAuth here is zone:read only):**
- `connect-src` add: `https://revlimiter-license.revaudio.workers.dev https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com`
- `script-src` add: `https://www.googletagmanager.com`
Then cache-bust re-test a real submit on https://revaudio.net/revlimiter#trial (expect
screws + PLATES ISSUED stamp, verification email via Resend).

## 2026-07-20 (evening) — Hero: hanging STORE sign SHIPPED & LIVE (4e281b8 + 78196fc)
- Gauge removed from hero. Replaced by a hanging wooden STORE sign off the LEFT edge:
  Higgsfield nano_banana_pro 2k true-alpha asset (bg-removed, green-despilled), sliced into
  `src/assets/hero/sign-beam.png` (static) + `sign-hanger.png` (swings: sway/click-kick/hover,
  links /store). Slice geometry + pivot documented in index.astro comments. Kick must stay ≤6°
  (seam overlap limit). Desktop/tablet only — hidden ≤860px per Dan. Hero↔showcase divider
  removed (scoped; global .hero border untouched elsewhere). Live bundle verified on revaudio.net.
- Local mockup bench `/signlab` (git-excluded) holds the approved CSS mockup lineage.
- NOTE: this session pushed around ANOTHER session's uncommitted enginebg WIP in this same
  worktree (BaseLayout/global.css/src/lib/enginebg.ts/public/bg/*) — those files untouched.


## 2026-07-20 — Plugin carousel "showroom polish" (pushed, live)
Six upgrades to `PluginShowcase.astro` only (spec + plan in `docs/superpowers/`):
- Peeks: blur killed → `saturate(0.55) brightness(0.7)`, legible side cards; hover brightens.
- Brass-trimmed frame: border-box gradient edge + CSS texture + `::before` glow — NO new DOM/assets; bench coords untouched, `/_cardbench` parity holds.
- Switch: 0.4s overshoot spring (`cubic-bezier(0.34,1.3,0.35,1)`).
- Arrows: brighter at rest + one-time glint via IntersectionObserver (skipped reduced-motion).
- Auto-advance: 6s, in-view only, hover pause, dies PERMANENTLY on first interaction, aria-live silent on auto (`go(target, announceChange)`).
- Height-aware `fit()`: measures `.site-nav`/`.sc-heading`/`.sc-dots` (site has NO `<header>` tag — don't `querySelector('header')`); also resets `scaler.style.height='auto'` before measuring — REQUIRED, removing it re-triggers a flex feedback loop that shrinks the stage across refits.
- Emblems (`.sc-emblem` + drift/ac/rev icon imports) removed as dead code.

## 2026-07-20 — Checkout/bundle review done (response to checkout-bundle-handoff.md)
> Superseded 2026-08-31: Paddle Billing is the only store (wiki `store`). FastSpring was evaluated and never went live (NOT USED). History only.
Full verified review + ranked recommendation in **`tasks/checkout-bundle-review.md`**. TL;DR:
- **Now:** stay on the old store; implement GAS-free-bundle via the EXISTING `revlimiter-license`
  Worker (the brief's "no backend exists" premise was wrong) — cart passes
  `checkout[custom][gas_bundle]=1`, webhook grants GAS in the same branded key email. No second
  checkout, no new infra.
- **Later (trigger = second paid plugin live, or LS hard-sunset date):** migrate to **FastSpring** (NOT USED: it never went live)
  (only MoR with confirmed cart + bundles + built-in license fulfillment incl. remote-keygen URL
  + audio-plugin industry base: oeksound, Baby Audio, AudioThing).
- LS is in soft-sunset (Stripe acquisition → Stripe Managed Payments); LS will never ship a cart.
- Open questions for Gil listed in §5 of the review (starts with: why was Paddle dropped —
  evidence says LS just cleared KYC first, not a hard blocker).
Nothing implemented yet — review-only per the brief.

## 2026-07-19 — CSP connect-src fixed, forms POST successfully; email delivery still unconfirmed
Gil added `https://formspree.io` to the `connect-src` directive in the Cloudflare Transform Rule
("Security Headers", Rules → Transform Rules → Modify Response Header). Verified via curl
(cache-busted) that the edge now serves the updated CSP, then re-tested both forms end-to-end in
a real browser tab (had to cache-bust the tab's own load once — the first retry still hit a
pre-fix cached document even though the edge was already updated):
- **Affiliate form**: real UI submission → success message rendered, POST returned `ok:true`.
- **Newsletter form** (`f/maqzlgwa`): same fix covers it (same connect-src rule) — confirmed with
  a direct POST, `ok:true`.
- **BUT: Gil reports no email received yet at info@revaudio.net.** `ok:true` from Formspree's API
  only means the submission was accepted, not that a notification email actually sent. Likely
  cause: Formspree requires a one-time "confirm this form" click (sent to the notification email)
  on a newly created form's first submission before ANY notifications deliver — same behavior
  noted for the newsletter form back on 2026-06-13 ("Formspree sends owner a one-time confirm
  email on the FIRST submission to activate the form"). **Next step: check info@revaudio.net inbox
  + spam for that confirmation email, click it, then re-test.**
- **Cleanup needed regardless:** several test submissions (names like "CSP Fix Verification...")
  landed in both Formspree forms' Submissions tabs during this diagnosis — clear those out so they
  aren't mistaken for real applicants/subscribers.
- New CSP connect-src for reference: `'self' https://api.paddle.com https://*.<old-store-domain>
  https://www.facebook.com https://formspree.io`.

## 2026-07-19 — Affiliate Program Formspree endpoint wired (e0f8160, live)
- `site.affiliateFormEndpoint` now points at the real form: `https://formspree.io/f/mykrwolg`
  ("RevAudio Affiliate Applications" form, created by Gil). No longer a placeholder — the form
  will actually submit.
- Also added (a34dbb4): H1 splits "Affiliate" / "Program" across two lines; an optional
  "Other platforms" textarea lets applicants list more than one channel (one per line) instead
  of being limited to a single URL + platform pick.
- Notification recipient confirmed set to info@revaudio.net in Formspree Settings (2026-07-19).
- **BLOCKER found 2026-07-19: real submissions fail with "Failed to fetch"/"Network hiccup" on the
  LIVE site.** Root cause is the edge Cloudflare CSP (Rules → Transform Rules → Modify Response
  Header) — its `connect-src` is `'self' https://api.paddle.com https://*.<old-store-domain>
  https://www.facebook.com` and does NOT include `https://formspree.io`, so the browser blocks the
  fetch() before it reaches Formspree at all. Confirmed via `curl -sI https://revaudio.net/affiliate/`
  and reproducing the fetch directly in-page (TypeError: Failed to fetch). Same class of bug as the
  earlier webfonts/YouTube-frame CSP gaps — dashboard-only fix, Wrangler token is zone:read so CLI
  can't touch Transform Rules. **Fix: add `https://formspree.io` to connect-src.**
  **This almost certainly also breaks the newsletter form** (same fetch-to-formspree.io pattern) —
  re-test both once the CSP is fixed.
- STILL TO DO once CSP is fixed: one real test submission on the live site to confirm the email
  actually lands in the info@revaudio.net inbox end-to-end.

## 2026-07-16 — Affiliate Program page (693e2f3, live)
- New `/affiliate` page (nav label "Affiliates" — full "Affiliate Program" kept as page title/H1;
  "Affiliate Program" alone was the widest nav item by 60px+, so shortened to avoid worsening the
  existing 700px-to-~1074px dead zone where the desktop nav has no burger fallback and can overflow —
  that gap pre-dates this change, not fixed here, just not made worse).
- Application form (name, email, channel URL, platform select, audience size, why) POSTs to
  `site.affiliateFormEndpoint` in `src/data/site.ts`.
- Approval flow is manual-review-only by design (matches how Waves/iZotope-style plugin affiliate
  programs work) — no auto-accept path was built.

## 2026-07-14 — RevLimiter free-trial stamp + Driver's Manual video (2c6e166, live)
- New `TrialStamp.astro`: "GET YOUR FREE 14 DAYS TRIAL" on the door's buy-patch asset (B3 night-plate take), L2 hover lamp, press-in → navigates to the license worker `/download`. Mounted in `[slug].astro` between title and door (`.trial-slot` top 25px / left 48.4%, user-placed).
- Position bench ON the real page: open `/revlimiter/#cranep=1&stampedit=1` → drag stamp / arrow-nudge, readout prints paste-ready CSS. Conditional Astro scripts ship VERBATIM — keep that block plain JS (no TS).
- New "Driver's Manual" section between Hear-it and System requirements — data-driven via `plugins.ts` `tutorialVideo` (+ `trialUrl`); youtube-nocookie embed.
- **BLOCKER: the edge Cloudflare CSP (Transform Rules → Modify Response Header) frame-src only allows the old store's domain → the video shows a grey broken frame on live. Fix in CF dashboard: add `https://www.youtube-nocookie.com` to frame-src. Wrangler token is zone:read — CLI can't do it.**
- Pre-existing, FYI Gil: `connect.facebook.net/fbevents.js` (Meta pixel) is also CSP-blocked by script-src.
- Design bench kept at `bench/trial-stamp-test.html`.

## 2026-06-18 — RevLimiter checkout LIVE on the old store (history: retired 2026-08-31, Paddle Billing since; wiki `store`)
- Back on the old store (the Paddle plan was dropped then); store now activated, RevLimiter live.
- `REVLIMITER_CHECKOUT_URL` in `src/data/plugins.ts` = LS LIVE variant `.../checkout/buy/78885904-8a19-4e23-9510-31b50775ada5` (commit e43bcbf). Single source of truth; Cart/BuyButton read it.
- **Bug fixed (875e8d4):** Cart.astro was persisting `checkoutUrl` in localStorage, so a cart that added RevLimiter before the URL swap kept launching the OLD test link → LS orange TEST banner on-site while the direct link was clean. Now Cart bakes a `slug->checkoutUrl` catalog map (`[data-checkout-map]` JSON) and resolves fresh at checkout; never trusts stored URL. URL changes now take effect for everyone on deploy.
- LS test vs live: same `revaudiopg` subdomain + (here) same variant URL — the TEST banner is store-activation-level, not a separate URL. Don't chase "live variant URLs".
- STILL TO VERIFY (user): real test purchase delivers download + license key; LS-generated key must match plugin LicenseManager format `REVL.<b64>.<sig>` or fulfillment breaks despite checkout working. See the old RevLimiter store-migration note in `shared/memory/` (history).


## Shipped today (all live on revaudio.net)
- **Scroll-scrub background system**: fixed `.page-bg` layer behind everything, brass dashboard art
  (`public/bg/aurora-test.webp`, 2048x6144, 106KB) sweeps top-to-bottom with page scroll.
  Logic in `src/lib/pagebg.ts`, wired in BaseLayout. Art width 90vw, side-fade via `.page-bg::after`.
- **Fluid layout**: `--maxw: min(1240px, 98vw)` (was fixed 1200px), nav follows.
- **Hero tuning**: gauge column `min(38vw, 520px)`; redline/lede/cta offsets via
  `--redline-x/--lede-x/--cta-x` defaults (198/92/218px) in index.astro.
- **Plugin section**: heading centered above card, card 730px, status label removed from PluginCard
  ("Checkout reopening soon" no longer shows on cards; product-page pill untouched).
- **Sections**: DAW strip tightened (2.5rem pad, 1.25rem gap, 1.05rem chips); newsletter 6rem pad,
  150px button, **fully transparent** (sits on bg art); footer 1.25/1.75rem.
- **New pages/nav**: `/terms` T&C page (14 sections, industry standard); nav = Home/Store/About/Support/T&C.

## Benches (the big workflow win)
`public/bench/home-bench.html` — master bench, live on prod too. Every homepage section has
sliders (bg width, hero, page frame, plugin, DAW, testimonials, press, newsletter, footer up/down).
User tunes on THEIR screen, hits COPY VALUES FOR CLAUDE, pastes; Claude bakes values into source
and syncs bench defaults. Also: `layout-bench.html`, `hero-bench.html` (superseded by home-bench).
**Bench defaults must stay synced with shipped CSS** — RESET ALL = production state.

## Open threads
- `aurora-test.webp` is the FINAL art for now but still has the test name — rename when user locks art direction.
- ~~Newsletter/Formspree + Paddle checkout still on placeholder tokens (site.ts / plugins.ts).~~ ended (Formspree forms POST since 2026-07-19, see that entry; Paddle Billing live since 2026-08-31 with a live client token in `src/data/site.ts`).
- Background asset pipeline: ChatGPT art -> Real-ESRGAN 4x (C:\RevAudio\shared\tools\realesrgan) -> sharp resize 2048w -> webp q84.
- User laptop renders at 1280x665 CSS (sometimes dpr 2) — Playwright-test at 1280x665 FIRST.

## Don't touch
- DSP/plugin repos unaffected. Partner's motion system (lib/motion, reveal, scrub, splittext, walkthrough) untouched except pagebg addition.

## 2026-07-22 — Mobile high-end rebuild on `feat/mobile-high-end` (~~NOT pushed~~ merged: the branch's commits, e.g. `2483b83`, are on origin/main since 2026-07-22; the branch no longer exists)
Branch = full mobile-only rework (~30 commits), reviewed section-by-section with Dan. Desktop
verified pixel-identical throughout. Highlights: lazy demo audio + YouTube facade (product page
~10.5MB → ~1.5MB), hero BUY/TRY buttons, slim cookie sheet, 44px targets, anchor sub-nav,
showcase→coverflow on phones, DAW strip brass logo marks + CSS 3D floor, crane door 322→242px.
- Dan KILLED (components deleted): HotspotTour, RedlineScrub, DawBridge — don't resurrect.
- Content: AAX claims removed from ALL buyer-facing copy (specs/buy/install/support/store/about)
  — AAX is deferred, and Pro Tools dropped from tested DAWs. NOTE: daws.ts still has
  pro-tools tested:true → homepage strip shows a PRO TOOLS chip; Gil to decide.
- Gil's main commits (checkout wiring + GAS badge nudges) cherry-picked in; badge values ported
  to the new coverflow (top:27px right:12px rotate(10deg) scale(.945) + 1.05rem inside stage).
- Touched partner motion files (mobile-scoped, Dan-directed): lib/reveal.ts (force-reveal
  2.5s failsafe), lib/walkthrough.ts (carousel arrow wiring). Desktop paths unchanged.
- Merge to main = live deploy → waits for Dan's explicit OK after a real-iPhone pass.
