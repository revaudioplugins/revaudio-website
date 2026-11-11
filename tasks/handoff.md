## 2026-11-03 — Home opening: the long garage, an ACTIVE PROJECT (Claude Code `danavivi-4e [b36252]`, Dan's Mac; continues `danavivi-7a [9ae241]`) — on branch `feat/home-opening`, pushed, not on main

Claim: OPEN `danavivi-d5 [443a28]` (Dan's Mac; the same session as `danavivi-20 [c417bc]` after a restart; the next session takes it, see SESSION END 2026-11-10 below); `danavivi-20` took it over from `danavivi-09` on 2026-11-08 (Dan: "take the claim from
danavivi-09, then go", for the look pass), which took it from `danavivi-4e` on 2026-11-04, which took it from `danavivi-7a`
(closed) on 2026-11-03. Dan, 2026-11-03: "this is a
project we start working on now, from now on": the long garage is a standing project of the site, not a one-off hero. It
replaces the TV-first entry's "no hero above the TV" (DESIGN.md §7) on Dan's word. Files: `tools/_home-opening/**` (not in
the build), `tasks/handoff.md` (this entry), `tasks/todo.md` (the plan, top), `DESIGN.md` §7 (the living-set rule). Later,
only after Dan picks: `src/pages/index.astro`, a new `src/components/HomeOpening.astro`, `DESIGN.md` §0, and
`src/components/WordWall.astro` for the power-on / lock hand-off only.
- The rule (Dan 2026-11-03, `DESIGN.md` §7): the room is a permanent living set, re-dressed for seasons (Halloween,
  Black Friday, Christmas), plugins, bundles and work in progress by moving / adding / swapping things, never rebuilt.
  Anything new gets bench controls.
- Built: `tools/_home-opening/room.html`, a Three.js room, no credits spent. Grey labelled blocks = the set the paintings are
  projected on (☰ Slots lists them); scroll walks down the aisle and locks onto the live TV (the hand-off of the first
  prototype, `tools/_home-opening/index.html`, commit `f35fdf0`, kept for reference). Dressed so far: the coupe side-on on
  a scissor lift, half out through a roll-up door onto a night street; the REVAUDIO neon top right of the end wall, hung
  crooked on two wires; the GAS 2 posters + a COMING SOON plate; CRT monitors (RevFX, DRIFT, RevLimiter, Radio
  Roulette); seeded mess; living lights; studio acoustics (slat panels, skyline diffusers, bass traps, a cloud); a small
  drum kit and a throne pushed back left; the desk 0.7 m out, both studio monitors on floor stands, toed in.
- The bench (⚙ Bench or T): Walk position, a section per part, Move things (M: drag anything, sliders per object),
  undo / redo (⌘Z / ⇧⌘Z), Copy settings. Settings Dan pastes back are baked into `DEF` as the defaults (three so far;
  a baked move goes into its item's row, and a `ver` bump clears it from saved benches). The third (settings `ver` 6):
  a fresh visit renders his bench (Playwright 1141x636, walk 0 / 60 / 100 %: 0.91 / 0.31 / 0.00 % of pixels differ,
  only the sway and the dust), no page errors.
- Run: from the worktree root `python3 -m http.server 4471 --bind 127.0.0.1`, then open
  `http://127.0.0.1:4471/tools/_home-opening/room.html`. Dan's Mac worktree: `.claude/worktrees/home-opening`. Another
  laptop: `git fetch origin && git checkout feat/home-opening`.
- Checks (2026-11-03, `danavivi-4e`, commit `e9bed19`): Chrome 1312x734, walk 60 / 76 / 90 / 100 %: the desk slides out
  under the frame, the stands flank the TV, nothing covers the lock; no console errors on a tracked reload.
- The default skin is a PAINTED room (Dan 2026-11-03). The cut-out test (12 credits: car, pegboard, amp, chests as
  planes in their slots) read 2D, Dan: "it doesn't feel like a whole room ... much more glued and whole, and 3D, and
  real. Less images"; he picked "Painted 3D room" over real 3D models (Tripo 9 / Meshy 38 credits each). Cut-out code
  and images removed (in git history at `2979ef6`). Also on his word: the guitars got the start of the left wall, the
  wrench pegboard L01 moved over the workbench (f 0.58, y 1.5).
- How it works (`PAINT` in `room.html`, the GAS 2 drone's recipe): `?capture=<walk 0..1>` renders the bare set from that
  spot at 1920x1080 (no sway, labels, line, dust, edges, chrome); GPT Image 2.5 repaints it (16:9, 4k, high, 4.25
  credits; the render as `image_references`); the painting goes back onto the set from that camera, depth-tested per
  projector (`placeShots`, a depth picture each, redone before the next frame after any re-layout, never mid-render);
  every surface takes the sharpest painting that sees it. Live pixels stay: the TV, the CRT screens, the posters. While
  painted the set lays out for 16:9 (`PAINT.aspect`) so the paintings line up on any laptop. Bench: Painted (on/off).
- Proof shot 1 (2026-11-03, 4.25 credits, 233.75 left): `assets/skins/default/paint/walk-000.webp`, painted from walk 0;
  0 px shift against its render; brand marks the painter added were cleaned locally (a Marshall script on the 4x12, a
  kick-drum badge, headstock decals). Checks: Playwright 1920x1080 at walk 0 gives back the painting (2.82 % of pixels
  differ, the live posters / screens / TV); 1141x636 walk 0-100 %, no page errors or WebGL warnings. Reads as one real
  photo to about 20 % of the walk; beyond it the far end softens and spots no painting saw go dark.
- Fixes after Dan's look (2026-11-03: "some elements starting to stretch out and there is missing pieces"; a real poster
  "sits on another mail me the key poster ... whoever looks better and looks more glued to the picture use it"):
  measured with `?paintdbg` (magenta = no painting sees it, red = stretched past its pixels) over 15 walk spots. Holes
  start at ~15 % (behind the car, the aisle sides of gear, the ceiling over the camera); past ~55 % the end wall is
  magnified. Now: holes take a soft, shadowed blur of the painting (no grey blocks); real posters P01-P04 sit exactly on
  their painted twins (P03 and P04 moved: rays cast through the painted corners onto the wall, cover-fit); P05, P06 and
  the CRTs M02 / M04 hide while painted (the painter merged P05 into P03's poster and put helmets where P06 hung); the
  CRT screens read better painted. `PAINT.live` / `PAINT.drop` hold the choices; `?live=` tries others, `?expose`
  hands the room to inspection scripts. Checks: no page errors or WebGL warnings; walk 0-100 % re-rendered.
- THE WALK IS A FILM now (Dan 2026-11-03, after the projected paintings: "it's still have a smear look ... smeared and
  broken apart while I walk ... if it will cost credits, it's okay ... in every step I will see the room in its best
  form. ... the vibe itself is amazing"). Keyframes (`assets/skins/default/keys/`): walk-000 = the first painting with
  the real posters composited in (homography, lit by the painting); walk-050 = painted by GPT Image 2.5 from the room as
  already painted at 50 % with the bare set in its holes (4.25 credits); walk-100 = the lock, the live TV as rendered at
  1920x1080 (no paint). Films (`assets/skins/default/film/`, Kling 3.0 pro, 1080p 24 fps, start + end frame, sound off):
  walk-a 10 s 000 -> 050 (17.5 credits), walk-b 8 s 050 -> 100 (14 credits; it reaches the lock at 7.8 s). Re-encoded
  x264 CRF 24, keyframe every 4 frames (SSIM 0.978 / 0.985 to the source; 9.6 + 6.8 MB). `FILM` in room.html: each film's
  frames are picked by the TV's share of the frame width (`tv` tables measured every 4th frame, centre crops against the
  film's first frame early, its last frame late), so the TV grows on the walk's tuned curve (`tvShare`) and the frame
  just under is scaled up the last bit (at most ~3 %). Films load whole as blobs (python's server has no byte ranges, so
  a plain src never seeks). The live TV fades in at the lock (.45 s): the film's TV is the 1920 page, the live one
  follows the screen (on 1141 the layouts differ, 21 % of pixels). Bench: Film on/off (off while Move things); stretches
  with no film show the painted room. Checks: real Chrome (Playwright channel chrome) 1141x636 + 1920x1080, walk 0-100 %:
  frame 0 at 0, the lock frame at 100 %, no page errors. Credits: 198 left (2026-11-03).
- Art: Higgsfield had 250 credits (Lite, 2026-11-02); 16.25 spent on 2026-11-03 (the cut-out test 12 + proof shot 1 4.25); the OpenAI key in
  `~/.zsh/openai.zsh` answered "expired" (2026-11-02). Prices (2026-11-03, `get_cost`, nothing submitted): GPT Image
  2.5 with its own transparent background, 2k: 1 credit medium, 2.75 high (1k low 0.25; 4k high 4.25); Seedream 5 Pro
  2k + background removal 2.5; Nano Banana Pro 2k 2 (no transparency). The default skin (Dan 2026-11-03: "make first
  the default skin") = the room's 71 image slots, 55 unique images when look-alikes share one (3 tool chests, 4
  guitars -> 2, 4 studio monitors, 2 compressor racks, 4 CRT bodies, 3 lamps, 4 pegboards -> 2, both side walls): about
  56 credits at medium or 159 at high, one take each. Each batch waits on Dan's yes after its cost (RULE 0).
- Open with Dan: plan the skins (todo step 1b); a "just got up" cue on the throne (headphones or sticks), offered, not
  answered.
- Film fixes after Dan's walk (2026-11-03: "a lot of glitches when you move around the walkthrough, like glitches of
  other scenes, and also the LCD screen is not the same, it's a different LCD screen"). The films were clean (no frame
  spikes); the glitches were the page: a seeking video reads readyState 1 (30 of 30 scroll frames, measured), the old
  code hid the film and the smeared painted room flashed through. Now: a film counts as loaded once ('loadeddata');
  every loaded film sits on its frame for the TV size, the idle one parked on its edge (the switch is the same picture);
  one seek in flight per film; the zoom and the LCD follow the frame on screen (requestVideoFrameCallback). The LCD: the
  live capture for the screen (pickCap) rides on the film's TV, tracked every 2nd frame back from each film's last frame
  (`r` in FILM: centre x, y, width every 4th frame, film px), covering it in the live page's shape and easing onto the
  live TV's own spot by the lock; the film box is placed in whole pixels. The page opens on the first keyframe as the
  video's poster (no bare set at load); the big line waits hidden for the script. Checks (real Chrome): wheel down and
  back up recorded, 0 flashes, 0 frames without a film; the frame before the lock vs the live TV: 0.00 % of pixels at
  1312x734, 1141x636, 1920x1080 (was 21 % at 1141); no page errors.
- ONE SHOT now (Dan 2026-11-03, scrubbing the two films: "the sceane changes in the middles items move around", "in the
  skelton there was redio rullet and drift and revlimiter around the gradge sudnnly they disapear ... lets fix it so it
  will be one seamless shot", "lets make it on the best side"). Cause: walk-050 was painted apart from walk-000, so
  Kling morphed one room into the other between them, and both paintings had dropped the plugin CRTs. Now the walk is
  ONE film repainted from the 3D set's own walk: `film-kit/render.mjs` renders the bare set's walk (240 frames, even
  pace on screen, reduced motion), Kling 3.0 Omni Edit (pro, 1080p, 20 credits) repaints it with walk-000 as the look,
  frame for frame (film frame n = set frame n, measured). It took the painting's look and its contents too (the CRTs
  were gone again; TV and posters sat right), so `film-kit/comp.py` pasted the set's own monitors back into every frame
  and a second Omni Edit pass (20 credits) made them real. `FILM` holds the film's camera per frame and the corners of
  the TV face and each CRT screen in the world: the TV rect per frame comes from them (no tracking), and each CRT gets
  its plugin's picture laid on with CSS matrix3d (`.film-scr`, still data: a new plugin = a new picture). Files:
  `assets/skins/default/film/walk.mp4` + `walk-000.webp` (the poster); walk-a / walk-b and `keys/` removed (in git
  history at `7e94155`). Recipe: `tools/_home-opening/film-kit/README.md`. Encode: x264 CRF 24, keyframe every 4
  (SSIM 0.985, 8.6 MB). Checks (real Chrome, 2026-11-03): one film on screen at every step; the live CRT screens land
  on the film's monitors to the pixel (RevFX, DRIFT, Radio Roulette, RevLimiter, 3x zoom); a wheel scroll down and back
  recorded: 0 flashes, 0 steps without the film; the frame before the lock vs the live TV: 0.05 / 0.06 / 0.02 / 0.01 %
  of pixels at 1312, 1141, 1920, 1440 wide; 390x844 runs; no page errors (the one 404 is the dev server's favicon).
  Credits: 40 this round (two Omni Edit passes; the first, `k1`, kept as the look), 158 left. Not perfect: the CRT
  cases came out as flat dark boxes (the second pass kept the pasted shapes), and Radio Roulette's, high on the right,
  stands off the film's shelving for a moment as it leaves the frame (the film's shelf isn't where the set's is).
- BACK TO THE SKELETON (Dan 2026-11-03, after the one-shot film: "lets go back to the skelton this is not what i
  want"). The bare 3D set is the room again: Painted and Film are off by default (`DEF`, settings ver 7 turns them off
  on saved benches too), the posters P03 / P04 are back on his bench's spots (P03 f 0.36, y 2.45, h 0.8; P04 x -1.45,
  y 3.0, h 0.85), and the painting and the film load only once their bench chip is on (`wakeArt`), so a visit fetches
  neither. Kept, switchable: `PAINT`, `FILM`, `film-kit/`, the assets. Checks (real Chrome 1312x734): a fresh visit and a
  ver-6 bench with both on open on the bare set, no art requested, walk 0 / 35 / 60 / 100 % (the CRTs with their
  plugins, the lock on the live TV), no page errors; the Film chip still loads and plays the film.
- Dan's bench of 2026-11-04 (`danavivi-09`), on the bare set, baked into `DEF`: a tighter room (6.8 x 4.3 m), lens 49 → 37,
  TV a touch bigger on the first screen (tvStart 6.5), calmer (sway 0.4, rack LEDs 0.2, TV glow 0.85) and hazier (fog
  0.034), lamps full, CRTs brighter (1.4), the car level (yaw 0) on a higher lift (0.61) under a wider door, the neon smaller
  (1.21) and moved (f 0.52, x 3.2, y 3.02, tilt 2.5). No moves, so `ver` stays 7. Checks (Playwright Chromium 1141x636): a
  fresh visit's settings equal his pasted bench key for key; with sway and dust frozen (`?capture`) walk 0 / 60 % differ by
  0.05 / 0.00 % of pixels; live walk 0 / 60 / 100 % no page or console errors.
- The rebuild plan (2026-11-04, `danavivi-09`). Dan said what went wrong: the cut-outs read 2D, the projected painting
  smeared, the painter removed the plugins (Radio Roulette top right, RevLimiter on the desk), the film was low quality,
  flipped to a picture mid-scroll and glitched; "I don't know why we went through a film". He loved the first painted
  shot. The plan, as a page with his answers (db `answers/round-1`, `answers/round-2`):
  https://claude.ai/artifact/ByhrvCC1RwY3pzi9izrHun. Decisions and steps: `tasks/todo.md` top, "The rebuild". In
  short: every pixel from the real 3D room, AI makes objects not frames; the room must keep moving (live 3D favoured);
  a bake-off team with researchers, critics and automatic checks; the far end is the test corner; Blender 5.2.3 LTS
  installed on Dan's Mac (brew cask); a blind-spot agent is reviewing the plan. The car: Supra-inspired, no badges,
  gloss black (his reference photo kept local only, `tools/_home-opening/refs/`, git-excluded).
- Blind-spot review done (2026-11-04): 2 blockers (the room stretches with the screen; baked light can't follow
  swaps) + high items, all in `tasks/todo.md` "The rebuild"; DESIGN.md §7's film rule replaced by the rebuild rule.
  Round 3 is on the plan page (14 questions, db `answers/round-3`).
- Round 3 answered (2026-11-04): live **Nov 19** as the default homepage, to half the visitors (A/B), before the
  Black Friday countdown; v1 = real light + materials everywhere, real models at the far end, entrance and car; fixed
  metres; a phone team; Dan's team models the car; R2; flicker <= 3/s; snap off by default. Full list + the schedule:
  `tasks/todo.md`, "The rebuild". Researchers R1 (references, props list, free models, licences) and R2 (the live-3D
  recipe) running; outputs land in `tools/_home-opening/refs/` (git-ignored).
- Done 2026-11-04 (`danavivi-09`): the room in fixed metres (`2ff3026`); flicker <= 2.5 flashes/s + the snap off by
  default (`7cff959`); R2's recipe (`tools/_home-opening/tech-recipe.md`); R1's references, props, models and licences
  (`tools/_home-opening/refs/`, git-ignored). Look lock page: https://claude.ai/artifact/Bh4iT4GHQox8ZD97nie5UU; props
  pick = Round 4 on the plan page.
- 2026-11-05 (`danavivi-09`): look lock + props answered (`look-spec.md`; 47 props as slots); three room designers
  (A film, B garage-studio, C brand experience; `layouts/`, kit `layout-kit/`); Dan picked "B + A's moves", baked in as
  the room (settings ver 9). Benches: look lock https://claude.ai/artifact/Bh4iT4GHQox8ZD97nie5UU, layouts
  https://claude.ai/artifact/YTT5fJ86prxUDucxfMCSSc.
- Next (Dan 2026-11-05: "look pass", over "Blender first"): the whole-room look pass in `room.html`, planned in
  `tasks/todo.md` (The rebuild, item 1b); then the foundations (one slot file that the bench and Blender both read, the
  light layers, the Blender export + parity check). Schedule: the plan had the look pass on Nov 6-9 and a checkpoint on
  Nov 12 (below the bar → v1 = look + light only); live Nov 19. Owed: tell Gil (his countdown + TV intro vs the room on
  Nov 19); Dan's OK for the R2 bucket / `assets.revaudio.net` / the three CSP additions (test locally first).
- THE LOOK PASS (2026-11-08, `danavivi-20`, todo 1b): built, two fix rounds, final scoring, Dan's review page. Commits:
  `04d8285` part 1 · `c681970` round-1 scores + team briefs · `b49e968` fix round 1 · `43f149e` fix round 2 · `53d80b2`
  the final critics' two fixes · `1ca1ec4` the player's round-2 engine fixes. In `room.html`: three.js 0.185.1 vendored
  (the site's pin); 13 CC0 texture sets in `assets/pbr/` (`SOURCES.md`; also `refs/licence-log.md`), preloaded once;
  `KINDS` / `LOOK` (a material kind per slot) and `LIT` (lit props); `FINISH` = AgX on the room only, the TV face and the
  CRT screens (and the tail lights) keep exact pixels through a frame-alpha marker (`keepAlpha`, `liveScreen`); 4x MSAA;
  4 pendant spotlights with shadows (static maps, redrawn on moves; the desk one at 40 %); `WET` (a Reflector sheen) +
  `PATCHES` driving the floor's own roughness and specular; the room's probe on shiny kinds only; contact shadows; haze
  under the lamps; `lightRoom()` holds every light level; the intro starts only after uploads + shader compiles. Bench:
  "The look" (tone mapping, exposure, shadows, reflections, haze) + a Look chip (off = the grey blocks). Settings ver 11.
- The team ran as planned (round 1: critics → the fixer on Fable in its own worktree → round 2 → final scoring), plus
  THE PLAYER (Dan 2026-11-08: "an agent that plays with the result on the website and gives feedback to the builders";
  approved the same day): a live tester on Opus in WebKit + Chrome, every round, before Dan sees it. Briefs:
  `tools/_home-opening/team/`. Its finds that only a live run shows: the intro froze then jumped (texture uploads, then
  shaders compiled for the canvas instead of the composer's target), the probe popped in at 3.4 s, reduced motion still
  flickered, and in Safari the REVAUDIO neon drew as a glowing card (shadowBlur) and see-through canvas gradients
  uploaded speckled (confetti on the floor). All fixed and re-measured.
- Checks at `1ca1ec4`: hand-off 1.05 / 0.68 / 0.45 / 2.57 % (= the baseline); 0 overlaps; 69 / 68 / 95 / 133 fps at
  walk 0 / 0.3 / 0.6 / 0.9 (M1 Max, 1141x636 DPR 2); no console errors in WebKit; a cold first visit links 46 of 46
  shaders before the intro, whose lights rise over ~1 s in both engines.
- Final scores (look / walk / Dan's-eye / devil's advocate; mood, light, mess, plugins, must-stays, no brands, glued):
  7 7 4 5 7 8 7 · 6 7 4 6 7 9 6 · 6 7 3 6 7 9 6 · 6 6 2 5 6 9 4 (round 1: 5 5 3 4 6 8 5 · 4 4 3 5 5 9 4 · 5 5 3 5 6 9 5 ·
  4 4 2 4 5 9 3). Their verdict: the light is no longer the problem, the blocks are; mess, plugins and glued wait for
  the real models (step 3 the desk + chair, then the kit; step 4 the car, Dan's team).
- Dan's review page (notes in its db, collection `notes`): https://claude.ai/artifact/RrYfJ7Z8AbXJCTsTc9KHLz (no notes
  came back). His four picks came from the picks page https://claude.ai/artifact/2gr2wkJyrM5jey7URePq81 (each option
  rendered as a still, A / B / C flip in place; db `notes`; the option renders were page patches through `?expose`,
  script now `tools/_home-opening/layout-kit/options.mjs`): the ceiling neon ONE STEP UP (`DEF.neon` 0.38, settings ver 13);
  the door DARK as now (C, the street with the car in step 4, was not picked: a street lamp is open for later), the red
  chests WORN as now, the far walls VIOLET-WINE as now. His note: "will I be able to change the light in the room in
  the future": yes, live on the bench today, and after the bake each light group's colour and level stay one live
  uniform (tech-recipe §1); moving or adding a light re-bakes its group.
- Open, not done on purpose: the critics' remaining LOOK notes that Dan's picks didn't settle (flat cream globes and
  shade, the black E06 shelf, COMING SOON's contrast; the door's navy void and the walls' wine are his picks now). A cold
  first visit waits ~5.5 s on a dark page (textures + shader compiles; the homepage step's still picture covers it);
  1440x900 runs 51-53 fps (the baked light layers fix it); in WebKit the arrow keys don't scroll (the hidden bench
  aside), Space / PageDown can pass the TV, a hidden tab's return jumps one frame (the page step). 🔴 The phone: the web
  critic estimates ~700 MB of GPU memory on an iPhone vs the recipe's 100 MB (its own tier: KTX2, no MSAA, 1K) before
  Nov 19. Next: Dan's notes on the page → apply → then step 2 (Blender export) or 3 (far-end models) per the plan.

### SESSION END 2026-11-09 — `danavivi-d5 [443a28]` — the long garage: where it stands, the finish list, the 3 builders

State: branch `feat/home-opening`, everything committed and pushed with this handoff (the commit after `36e559c`; check
`git status` + `git log origin/feat/home-opening -3`). Plan + every number: `tasks/todo.md` (items 2 + 3 and 4). Not on
main; no publishing.
- In the room (real models, `MODELS` in `room.html`; sources `tools/_home-opening/assets/models/SOURCES.md`, licence log
  `tools/_home-opening/refs/licence-log.md`, git-ignored): E01 the studio desk, N34 the office chair, E02 / E03 the black
  monitors on floor stands, E07 the natural-wood drum kit, E08 its stool (Dan's picks 2026-11-08). The loader takes
  blocks, props (a group of drawn parts: the model at real size where they stood) and a monitor's `stand`.
- Light: Dan kept TODAY's live light (2026-11-09, "today", over the baked mix that ran 2.6x faster). The bake is parked
  on branch `look/home-bake` (`fa4dbaf`, code only, worktree `.claude/worktrees/home-bake`; there,
  `tools/_home-opening/bake/room-bake.sh` rebuilds the packs in ~4 min). Not on this branch.
- Phones keep today's homepage on Nov 19; their own scene later (Dan, 2026-11-08). Slow connection: the room's still
  shows first (`tools/_home-opening/assets/still/room-2560.webp`; re-run `node tools/_home-opening/still.mjs --port
  <port>` after a room change).
- Checks at `61965d0`: hand-off 1.05 / 0.68 / 0.45 / 2.57 % (= baseline), 0 overlaps, 0 errors. ⚠️ fps (M1 Max, DPR 2,
  1141x636, busy Mac): walk 0.6 66 → 59-60 and walk 0.3 50 → 47 since the monitors + kit (11 materials per monitor).

Dan, 2026-11-09: "not yet, we need to finish it" = finish the room BEFORE it goes into the homepage.
- The finish-list bench: https://claude.ai/artifact/LKA2p4zQACEx8odCn1vZqq (ArtifactData collection `notes`, one doc
  per stop: `w0`, `w015`, `w03`, `w045`, `w06`, `w075`, `overall`). Dan pinned the first screen (`w0`, 28 pins, no
  words: "all of them had a label" = every pin is a slot); he pins the other 5 stops next.
- Pins → slots: `node tools/_home-opening/layout-kit/pin-hit.mjs '<the doc's pins JSON>' <out.json> <walk> 4490`
  (a ray from the walk camera through each pin; the stops: w0 = 0, w015 = 0.15, w03 = 0.3, w045 = 0.45, w06 = 0.6,
  w075 = 0.75). The first screen's map: todo item 4 + `tools/_home-opening/team/finish/pins-w0.webp`.
- Everything the next session needs is in the repo (this session's scratch folder goes away):
  - `tools/_home-opening/models-kit/` (README first): how the desk, monitors, kit and throne were built from code in
    Blender, the texture prep, the in-room stills runner (`scout.mjs` + `corner_spec.py`), `glbinfo.py`, `sheet.py`.
    The builders reuse it.
  - `tools/_home-opening/layout-kit/`: `fps.mjs` (before / after), `pin-hit.mjs`, `finish-shots.mjs` (re-shoots the
    finish bench after changes), `options.mjs`, plus the old `handoff.mjs` / `check.mjs` (README).
  - `tools/_home-opening/team/bench-picks-template.html`: the picks bench with A / B / C flips (copy, fill CFG +
    SECTIONS; review-bench skill for publishing and reading notes).
  - `tools/_home-opening/team/reports/`: the asset scout's report and the phone tester's report + findings (for the
    phone scene later; its evidence paths point at the old scratch folder).
  - Benches (Dan's notes in each one's db, collection `notes`): finish list
    https://claude.ai/artifact/LKA2p4zQACEx8odCn1vZqq · light picks https://claude.ai/artifact/1GRRy48eP1KF5ravRmVK2Q
    (done: "today") · corner picks https://claude.ai/artifact/VXYLrHfwRhy2oPMNg5UQGP (done: black + wood) · desk
    picks https://claude.ai/artifact/APfKbkPMUCp8frWewVCXxG (done) · look picks https://claude.ai/artifact/2gr2wkJyrM5jey7URePq81 (done).

UPDATE 2026-11-09 (later the same night): Dan: "build as many objects as possible by the 19th, most important first,
let's start" → Nov 19 stands. The 3 builders were LAUNCHED from this session (brief + lists in
`tools/_home-opening/team/builders/`; loop in todo item 4). If this session is gone, their deliveries are in the
scratchpad folders named there; a new session starts its own builders from the same brief, skipping slots already in
`MODELS`. Reused already: L13, L14, R16. So step 3 below is running; steps 1 and 2 still stand.

NEXT (tomorrow):
1. Read Dan's pins on stops 2-6: ArtifactData `list` with url https://claude.ai/artifact/LKA2p4zQACEx8odCn1vZqq,
   collection `notes`; each doc's `data.pins` is `[{n, x, y}]` (0-1 of the 1141x636 frame), `data.text` his words.
   Pass `data.pins` as-is to `pin-hit.mjs` with that stop's walk. He may also say "done" or paste "Copy all notes".
   Add the slots to todo item 4 under the right zone (car side / left wall / overhead + far end); a pin on a wall,
   floor or ceiling is the shell (write "shell: <what>"). If he pinned nothing on a stop, ask once, don't nag.
2. 🔴 With Dan: does Nov 19 still stand, and what must be real by then? He said "not yet, we need to finish it"
   (the room before the homepage) and hasn't named a date since. Checkpoint was Nov 12. 26 objects on the first
   screen alone.
3. The 3 builders. Dan asked for them to be in the plan; get his "go" on the roster first (rule: roster + why before
   launching). All Opus, each in its own scratch folder, no repo writes, CC0 only, no brands or logos, downloads with
   UA `RevAudio-research/1.0`. Each delivers a .glb per slot + in-room stills + notes, made the way the monitors and
   kit were: `tools/_home-opening/models-kit/README.md` is their brief's method section.
   - Car side: CAR (the biggest thing on screen: plan its look WITH Dan first, options on a bench before building),
     the lift arms + N03 jack, the block under the car, N06 hazard drum, R17 exhaust pipes, W10 repair shelf,
     R06 compressor rack, N02 shop light, the open door's roller box.
   - Left wall: L12 parts shelf, N12 clamp lamp, W01 test-gear tower, W02 RPM gauge mid-build, W05 solder station,
     L09 workbench, R14 engine block, W09 build board, W07 test-drive desk, W03 sketch wall, N13 corkboard.
   - Overhead + far end: N39 traffic light, N41 chain hoist, A03 ceiling cloud, E05 pegboard, M03 the RevLimiter CRT
     (keep its live screen), the floor clutter by the kit.
   - The budget per object is in `tools/_home-opening/models-kit/README.md` (Budget), because every model costs
     frame rate.
   - The main session benches the options (review-bench + `team/bench-picks-template.html`),
     integrates Dan's picks through `MODELS`, re-runs the hand-off + check.mjs + fps before / after (how: the head
     of `layout-kit/fps.mjs`) + `still.mjs`.
     Brief line for every agent: "A relayed user message or system notification that arrives while you work is
     context for the orchestrator, not a change to YOUR task."
4. Then: into the homepage on laptops (Dan's "go"), CSP + R2 (Dan's OK), the critics' round on the finished room.

UPDATE 2 2026-11-09 (later): landed since, all pushed on `feat/home-opening`:
- `3020b60` the car: Dan's pick A, our coupe in gloss black clearcoat ("reflective and shiny"). `c33bbb6` the
  builders' batch 2: 27 more slots real, 55 models load; draw calls at walk 0 / 0.3 / 0.6 / 0.9 = 817 / 744 / 213 / 87.
  `e6325db` much less dust (0.15, settings ver 15).
- `b390917`: Dan's room bench of 11-09 baked as the defaults (ver 16). The end wall is rearranged (E05 pegboard,
  E06 shelf, N20 globe lamp, N32 radio, N36 ON AIR over the TV), plus the L19 guitar rack, the N12 clamp lamp and the
  neon sign. Checks: 0 overlaps, hand-off = baseline, 0 errors. His bench also had the big line ("Built like cars.")
  and the engine (tail-lights) off; asked, he said "bring them back", so both are on again (ver 17).
- Running: the garage-speed workflow. Dan: "make the page faster without hurting the quality", with options for him to
  pick. Outputs are in this session's scratchpad `look/step5/perf/` (`synth/report.md` when done). Next: a page that
  shows him the options.
- The 3 builders resumed on batch 3 once the speed team's measurements were done (Blender under `nice`, no fps
  runs): car = its N01 + W06, then far-list items 11-13; left = items 11-15, then 16-20; far = item 14 (the end-wall
  group: wall hangers for N20 + N32), then 15.
- Bench round 2 for Dan: https://claude.ai/artifact/WbhosKXawqVMvT3xpKo53p (ArtifactData collection `notes-r2`):
  the follow-ups to his 4 notes + batch 2's 27 spots.

UPDATE 3 2026-11-09 / 11-10 (night): Dan's round-2 notes (db `notes-r2`, pins read with the scratchpad's
`pins-r2.mjs`) + batches 3 and 4, in the room (settings ver 19):
- Dan's notes, done: N01 (trouble light) out; R.tail's light off (its hotspot on the gloss; the lenses still glow);
  clutter drums #26 (behind the GAS 2 drum) and #10 (in front of the test desk) out, tyre #4 moved to the tyre rack
  (`MESS_FIX`, messSeed 1 only); N46 an office chair at the test desk; L13 / L14 face out, s 0.6; N02 -10 %, and on
  two chains to the ceiling (slot h 0.6, y 4.3; its light at the tubes); N47 a gooseneck lamp on the amp + a light
  on its face; R15 rims off the pegboard, on the tyre rack (s 0.85); N31 vinyl bigger, forward, N48 a desk lamp
  lighting the deck; L19 rack 1.75 m out (x -1.4), turned 35 deg to the door, with an acoustic in his pinned cradle;
  L02 a bass + L20 (natural ash) / L21 two basses on the wall; R03 a banjo, R10 a ukulele (its hanger level with the
  banjo's); N07 the pump rebuilt polished; N49 headphones on W10 at his pin. Lights: N01 + R.tail out, N47 + N48 in.
- Batch 3 in: W03 W01 N13 N12 W02 (left), E04 N33 N35 N36 N20 N32 R08 R19 N29 A01 A02 (far), W06 (car), the lamps.
  Batch 4 in: R18 bass rig (head moved back so R08 rests on it), R02 combo, N41 chain hoist (rocks), N39 traffic
  light (its lamps cycle red 6 s, green 6 s, amber 2 s: MODELS `cycle`), both slid onto the truss (f 0.5455).
- Checked: 0 overlaps; the hand-off and the slow-connection still re-run after the room settled. Seven independent
  judges went over every note and object (scratchpad `verdicts-r3.json`); their partly / fix verdicts were spot-checked
  and acted on (the rack further out, the amp lamp softer, the headphones off the mug, the rims, the globe at half).
  N02 "brighter than before" was the round-2 still catching the dying tube mid-flicker: the bench compares both rooms
  with the flicker held still (reduced motion).
- Batch 5, the car side (11-10, settings ver 20): N43 floor decals (alpha quads under the wet sheen; moved out from
  under the lift's plate to x 0.85), N11 drip pan (onto the plate, y 0.085), N10 safety wall (off the walk), N24 / N24B
  rugs, N45 extension reel (its box stands up: h 0.27). Models' dress: a transparent mesh casts no shadow.
- Batch 6, the left wall (11-10, settings ver 21): W05 solder station (its smoke scrolls and breathes: MODELS `wisp`),
  W04 parts bins, N17 pedalboard, N18 cable hooks, L11 drum machine; reworks W01 meter, W02 RevLimiter dial, W03
  stickies, N12 on its 2x4 (box w 0.6, x -3.21), N47 a bigger shade. Checked: 0 overlaps, 93 models, still re-rendered.
- Batch 7, the far end + reworks (11-10, settings ver 22): N28 mini fridge; N42 cable tray hung under the trusses (h
  1.565, x -2.05, its own height: the designers' y 4.32 was for the flat placeholder; no longer `flat`, so the overlap
  check sees it); L17 hose pegboard v2 (its tools only in the gaps round the bass wall in front of it; d 0.085, a thin
  board); N20 globe v2; N39 traffic light v2 (0.4 m along its truss to x -0.9, glow 0.7: out of the left neon's wash);
  A01/A02 traps v2 (dark fabric, walnut frames); N29 blankets v3 (1.44 m: fits Dan's spot between the ukulele and W10,
  7 cm up so its hem clears the drum kit's block); the left builder's E04 synth, N33 scope, N35 + N49 headphones, R19
  GAS 2 print. Room: model textures get 8x anisotropy; dust specks within 2 m of the lens fade out (a point drew as a
  big square up close); a capture holds the dying tube and the sign lit; migrations now run oldest first (append).
- Batch 7 review (workflow: 4 judges + a refuter each, 17 confirmed, 2 must-fix): N42's far end flares and its cords
  land on the REVAUDIO sign in the opening frame (N42 v2 in, 11-10: the cords end in the tray under a matte end cap,
  nothing over the sign), and N39's lit lamps read pastel (N39 v3 in, 11-10: even saturated lamps, amber yellow-orange,
  off reads red / amber / green; brighter would need liveScreen on the lamps, untested). Next with far-2: N28's sticker order and the
  GAS 2 lockup on R19 + N20 (DESIGN.md: Oswald 700, GAS parchment, the 2 and its rule oxide). Deferred polish: N29's grey bunch reads flat and its blue is very clean; N28 is hidden from the
  walk; N20's face washes GAS2 out at 0.8 m.
- Review 2 (the late additions + room code, 17 confirmed, 3 must-fix): room fixes in (11-10): the lights hold still in a
  capture (`steady`: the hum, the dying tube, the sign, N39 holds red), N18's bar on the pegboard's face (on 0.02), labels
  (R19, N42 under the ceiling), the fonts ledger (Special Elite is Apache 2.0, not OFL), the layout kit regenerated.
  Model fixes in (11-10): N33 + E04 UV bleed fixed, N49 hung from a hook under W10's plank at its door end (slot moved
  0.38 m: the tube radio stands under the middle), N35 + N49 yokes as forks (left builder); N28 v2.1 (no sticker cut, the
  top's stickers read from the aisle), L17 v3 (every hose on a visible hook, nothing hidden from the walk), the GAS 2
  lockup on R19 (parchment GAS, oxide 2 + rule) and N20 (GAS 2's own globe lens) (far-2). Builders' queues empty.
- Floor clutter (11-10): MESS_FIX turns off #27 (a drum in front of N17's pedalboard) and #30 / #0 / #12 (two toolboxes
  and a crate standing on it): the pedalboard is seen now. The bench checks then found #8 / #9 (two black cases by the
  drums: holes in the floor from the walk, `f0eb2f1`) and #21 (a blank papers sheet behind the board, `da7bd08`): off too.
- Builders (11-10 night): far-2 is fresh (the far builder's long context kept dropping on the network); left and car
  idle. Every slot in view has a model. The 12 slots at f > 1 (L10 R01 R04 R11 R12 R13 N04 N05 N08 N09 N22 N25) sit
  behind the camera: not built.
- The outside through the door: A photo street / B built street / C rainy night (car builder's pick C), patches for A
  and C ready in `look/step4/builders/car/candidates/OUTSIDE/patch/`; Dan picks on bench round 3.
- guitar.glb has no slot since R10 became the ukulele (kept for now).
- Bench round 3 for Dan: https://claude.ai/artifact/WbhosKXawqVMvT3xpKo53p (Version 4, build `2c3e473`, ArtifactData
  collection `notes-r3`): 24 cards, his 12 note cards with a before, the outside A / B / C pick (card 2), 11 new spots.
  Generator: the scratchpad's `look/step4/round2/r3-page.py`; shots `raw3` / `raw4` (+ `raw4n2`, `raw4b`: N02 held still).
- Bench round 4 for Dan (11-10 morning): the same link (Version 5, build `da7bd08`, ArtifactData collection `notes-r4`).
  Round 3 was never opened, so it is folded in: 29 cards, his 12 round-2 notes with a before, the outside A / B / C pick
  (card 2, re-shot in today's room with the car builder's `scout_room.mjs`: the A / C patches no longer apply to
  room.html, the runtime scout does), every new spot, and card 24's ask (the blue blanket bright, or toned down ~20 % +
  wear: the toned one is a picture-only variant, `PRE=pre-tone-n29.js`). Three card-vs-picture checks ran first
  (workflows, a refuter each): 26 findings, then 6, then 1, all fixed (re-shot or reworded; the clutter above).
  Generator: the scratchpad's `look/step4/round2/r4-page.py <sha>`; shots: `run-b6.sh` (raw-b6 / b6n / b6t / b6o / b6x).
- Polish list from those checks (not asked on the cards): W05's fume extractor reads as a black box (light its face or
  show a fan; its card says so); from the hoist's side N39 hangs in front of the sign (clear from the walk); B's sky is a
  flat block (only if Dan picks B); a black door-side slab at the edge of the car close-up (there since round 2, off the walk).
- Round 5 (11-10 midday): Dan's round-4 notes (db `notes-r4`: 22 cards ✓, 3 notes, 4 unmarked) built. N29's blue toned
  down in the model (`064d8b9`: the scratchpad's `tone-glb.py` bakes the recipe he picked from). N17: RevAmp's GREENLINE +
  REDLINE on his two pins (`4142e38`; an Opus builder, a Sonnet review). E04: a patch cable off the synth's back (`c562939`;
  Opus build, a Fable fix pass made it thicker and glossy; MODELS `fitNode` keeps it out of the fit and the overlap check
  skips out-of-fit parts). Pipeline Dan confirmed 11-10: Opus builds, a review, Fable fixes what it flags, then main's gates.
- The street outside the door: a gas station across the road (his pick of three compositions, in the chat), built from
  code as a runtime patch (scratchpad `look/step5/street/js/optG.js`, notes.txt there), G1 dark / G2 darker (Fable made G2
  clearly darker). NOT in the room until he picks a grade. Adopting it: its notes' steps, Oswald 700 must load, and lit
  things outside stay on through the loading screen unless added to `window.LIGHT_BANKS`.
- Bench round 5 is built (round1/garage-build.html via `r5-page.py c562939`: 8 cards, 26 shots; two checks, 6 findings
  fixed). The session's account switched to Dan's personal one, which can't open the old link (RevAudio account,
  rounds 1-4), so round 5 is on a NEW link, published 11-10: https://claude.ai/artifact/54aorRBcCAvWJTrPHqaPZm
  (ArtifactData collection `notes-r5`; source the scratchpad's `look/step4/round1/garage-build-r5.html` + `files-r5.json`).
- Round 5 notes (Dan, 11-10; db `notes-r5`, dumped to the scratchpad's `look/step4/round2/notes-r5/`):
  - outside: G1, and on the price sign "normal free / premium free / race free" -> done: `STREET_GRADE = 'G1'`, the
    sign's three grades each FrEE in LED segments (street.js drawStreetAtlas, re-rendered street-atlas.webp).
  - guitars-left: "remove that gtr" x4 -> L18, L02, L21 (bass.glb) and L03 (guitar-black.glb) out; L20 "make it a bass
    gtr" (today's basses read as guitars) -> a builder.
  - car: on N03 (the floor jack) "make it a part of the lefter right now it looks wierd"; asked, Dan picked "the lift's
    own hydraulic power unit" -> a builder.
  - amp (N17): "all the pedals are from revamp make the pedal borad a revamp board" -> a builder.
  - desk (E04's cable) ✓ = frozen. Unmarked in rounds 4 and 5 (don't nag): N29 blanket, car floor, end wall.
  - Builders: workflow `wf_3bb75485-05c` (Dan approved the roster 11-10: Opus builds, a Sonnet review, a Fable fix
    pass), folders the scratchpad's `look/step6/{n17,l20,n03}/candidates/<ID>/`. Then bench round 6.
- Loading screen merged (11-10 evening): `feat/home-lights-on` (danavivi-fa's, Dan approved) = merge `6d9f6cf` (room.html
  auto-merged, no conflicts) + `955074f` (assets/lights re-rendered from the merged room). render.mjs --check: two
  captures 0.00 apart, layers vs the full room mean 3.86 levels, p99 20, 438 KB. check.mjs at 1141x636 @2x: cold 40 Mbit
  hand-off 9.0 s, no page errors; hand-off blurred mean 3.28, p99 14. Overlap check: 0. Both scripts ran on port 4475
  from scratchpad copies with 900 s timeouts (load average 300+; the stock 90 s wait timed out), because 4471 was the
  lights-on worktree's own server (it has stopped it since). PUSHED 11-10 by danavivi-fa on Dan's word "push"
  (origin 4e9c1eb..e8ab4d6, a fast-forward).
- Speed study (workflow `wf_af3ddb64-681`, 39 agents, prototypes on copies only; the full result is in the scratchpad's
  `look/step5/perf/speed-result.json`). Options page for Dan, on the personal account: https://claude.ai/artifact/G4Mm7W73m2RJeGiQ2hecqF
  (ArtifactData collection `picks`, doc = card id: {choice, note}; source `look/step5/perf/page/speed.html`). 🔴 Launch blocker:
  revaudio.net's CSP (the Cloudflare transform rule) has no `blob:` in img-src / connect-src, so every textured model
  renders white (checked 11-10 with curl + the study's stills); the port must also self-host Lenis and the fonts
  (room.html loads them from jsdelivr / Google Fonts, which script-src / font-src refuse). Recommended, same look: O1
  (that port work) + O4 (bloom added in the final pass) + O3-safe (the floor reflection drawn first), about 7 h.
  O3-safe's `wetInView()` hunk doesn't apply to HEAD: place it by hand, or the first frame throws and the room freezes.
  The merged loading screen locks scrolling until the hand-off (`html.lights-loading` overflow hidden + `lenis.stop()`),
  which should end the "scrolls during loading glide you mid-walk" cause: confirm with the study's wheel test (r-O8/func).
- SPEED MOVED TO ITS OWN SESSION (Dan, 11-10: on a simulated 1.6 Mbps line "it took way too long": measured, the walk
  unlocks at 1:53, 22.26 MB in 162 files). Brief: `tools/_home-opening/perf/HANDOFF-2026-11-10.md`; tools and the
  study's report in `tools/_home-opening/perf/`. The speed session is Claude Code `danavivi-cc [172bce]`, in its own
  worktree (`.claude/worktrees/home-speed`, branch `feat/home-speed`); it owns room.html's loading / boot / asset
  pipeline; `danavivi-d5` keeps the room's content (MODELS, MESS, objects). Dan's picks (options page, 11-10) went to
  it: O4, O3-safe, open at the door, a calmer camera, one faint light off, O8, O2, O9 all "Do it"; the CSP edit
  "Ask Yoni" (Dan sends Yoni the message); hosting "Let's talk" (R2 pre-compressed: -1.11 MB / 5 % vs Pages' gzip,
  but no 100 GB/month limit); "stuck: Both · lets test it"; real machines "Later".

### SESSION END 2026-11-10 — `danavivi-d5 [443a28]` — round 5 half landed, three builds ready, then bench round 6

State (closed 11-11 10:50): `feat/home-opening` at `04e995a`, in sync with origin. Main was merged in at `b90ec47`
(Dan: "merge main do not deploy"); danavivi-fa later put the branch on main (LIVE below), so main holds it up to
`eca276e` plus 3 commits of its own, and the 2 commits main lacks (`956150c`, `04e995a`) are handoff notes that ride
along with the next room push. The session's commits, all pushed: `064d8b9` blanket, `4142e38` RevAmp pedals,
`c562939` synth cable, `6d9f6cf` + `955074f` the loading screen + its layers, `e8ab4d6` the speed brief + simulator,
`50c52b7` the street (built in, off), `6cbe654` round 5's street (G1, every grade FREE) + four guitars out + layers,
`b90ec47` main merged; plus handoff and lessons commits up to `04e995a`.

LIVE, unlisted, since 11-10 21:00 (`danavivi-fa`, on Dan's ask for a hidden page to see it load live and on his
phone): https://revaudio.net/garage-9f3c/ (robots noindex, nofollow; not in the sitemap; nothing links to it).
origin/main went `3419f07..200a599` as a fast-forward: this branch up to `eca276e` (no SHAs rewritten) + danavivi-fa's
`8aef421` (the build integration `tools/garagepage/integration.mjs` + 1 line in `astro.config.mjs`), its merge
`9fb1151` and `200a599` (the room's fonts and Lenis from the site, under the live CSP). Outside the room and tasks/,
main also got this branch's own `DESIGN.md` and `.impeccable/config.json` changes (no page). Deploy run 42880463423
succeeded (18:57-19:00 UTC); checked here: the page answers 200 with the noindex tag, the homepage 200. At build time
the integration copies room.html (as index.html), street.js, lights/lights-on.js, layouts/, vendor/ and assets/ into
`dist/garage-9f3c/`, swaps Google Fonts and jsDelivr for the site's own @font-face rules and `node_modules/lenis`
(1.3.23, the same pin), and warns in the build log if a family or host is missing; the dev material stays out. Until
Yoni's three CSP words land, the live page shows white models (danavivi-fa saw the same 194 drops + the meshopt wasm
failure on live, and 0 violations under the proposed header in Chrome + iPhone WebKit).
To update it: merge `feat/home-opening` into main and push (pull --rebase in the same command; main carries 3 commits
this branch doesn't), ~3 min to live, the workflow purges Cloudflare. Dan's standing OK, said to this session
11-10 ("yes with the limits"; danavivi-fa got the same OK in its session): room changes go to main without asking
each time, within four limits:
1. Room files only: after the pull, `git diff --name-only origin/main...HEAD` lists nothing outside
   `tools/_home-opening/` and `tasks/`. Anything else (src/, public/, astro.config, the homepage) waits for his word.
2. One push per finished round (models landed + loading pictures checked), never per commit: every push to main runs
   `purge_everything` on revaudio.net's Cloudflare cache (deploy.yml), so real visitors load cold for a while.
3. After each push: Deploy and Smoke test both green (`gh run list --limit 2`) and /garage-9f3c/ loads; then send Dan
   the link + one line on what changed.
4. It ends when the room becomes the homepage (planned Nov 19): from then on every push to main waits for his word.

NEXT, in order:
1. Land the three builds of Dan's round-5 notes (workflow `wf_3bb75485-05c`, finished 11-10 around 20:00, its last files 19:59; each had a Sonnet
   review, N03 a Fable fix pass). Lasting copies (git-ignored): `/Users/danavivi/projects/revaudio/revaudio-website/
   .claude/garage-bench-2026-11-10/step6/{n17,l20,n03}/candidates/<ID>/` (glb, notes.txt with the SOURCES row, stills).
   - N17 `pedalboard.glb`: a RevAmp board, nine RevAmp pedals (GREENLINE, REDLINE kept; CAMSHAFT, CRUISE, TUNNEL,
     RIMS, WIPERS, MIRAGE, NITRO) + a REVAMP plate; 3,418 tris, 1 material. Replace the file, update its MODELS comment,
     relabel its slot ("Pedalboard: RevAudio pedals, cable spaghetti" -> a RevAmp board). No slot change. Its notes.txt
     lists six choices for Dan (e.g. BLUESHIFT / TAILLIGHT left out: 9 letters don't read on a 0.08 m face): put them
     on the bench card. From the walk the change hardly shows (the red cases and L19 hide the board).
   - L20 `bass-natural.glb`: a 34-inch 4-string bass in natural ash, 2,452 tris. Replace the file AND move the slot
     y 2.1 -> 1.75 (at 2.1 the headstock and its four tuners sit under the nav in the close view: then it reads as a
     guitar again).
   - N03 `lift-pump.glb` (new file): the lift's hydraulic power unit, the hose into the lift's base plate; 1,884 tris.
     MODELS `N03: { src: 'assets/models/lift-pump.glb', yaw: Math.PI / 10, fitNode: 'lift_pump' }`; slot
     `{ id: 'N03', cat: 'garage', label: 'Lift pump unit + hose into the lift', side: 1, f: 0.9418, w: 0.39, h: 1.05,
     d: 0.467, y: 0.525, x: 1.331 }`; DEF.moves "N03" (`{"f": 0.8472, "x": 1.6}`) removed or set to f 0.9418 / x 1.331,
     settings ver 22 -> 23 with a migration line; then `records.diff` in its folder (SOURCES.md, refs/licence-log.md,
     the props lists: `patch -p1 --dry-run` first). The hose fits today's lift only: if the car or lift moves, rebuild
     with its `lift_pump.py` (prints the new slot).
   - Then: the overlap check, the loading pictures (`lights/render.mjs --check` + `lights/check.mjs`; copies with
     900 s timeouts for a loaded Mac in `.claude/garage-bench-2026-11-10/lights-run/`, run from the worktree root),
     commit by path, push the branch; then the live page (LIVE above).
2. Bench round 6: the same link as round 5 (https://claude.ai/artifact/54aorRBcCAvWJTrPHqaPZm, personal account; pass
   `url`, collection `notes-r6`). Cards: the street (G1 + the FREE sign: close, first screen, before), the pedals
   (close, near, before), the left wall (four out + the new L20: close, walk, before), N03 (walk 0.15 + its close pose
   from its notes, before). The kit, copied out of the scratchpad: `.claude/garage-bench-2026-11-10/` (the round-5
   page + generator `round2/r5-page.py`, its shots, `scripts/round2-shots.mjs` + `round2/spec-b7.json`, Dan's
   `round2/notes-r5/`). The street's close pose: [0.3, 1.7, 15.2] looking at [7.5, 1.9, 11.0]. Don't re-ask the
   blanket, the car floor or the end wall (unmarked twice).

Unverified: Dan hasn't said he saw G1 with the FREE sign or the left wall without the four guitars (both are on the
hidden page, its models white until the CSP fix); L17's pegboard was built with gaps where L02 / L03 / L18 hung: look
whether it reads bare now. The CSP fix was tested on local servers only (here: room.html in Chrome, WebKit, Firefox;
danavivi-fa: its site copy in Chrome + iPhone WebKit), never on live: it waits on Yoni.

Background processes (this session's; nothing else depends on them once round 6 is shot):
- `python3 -m http.server 4490 --bind 127.0.0.1` (worktree root), pid 52126: the room's server. `kill 52126`.
- the weak-line simulator, port 4481, pid 98125: Dan's 1.6 Mbps view
  (http://127.0.0.1:4481/tools/_home-opening/room.html). `pkill -f 'simserve.py.*--port 4481'`.
- the bench preview server, port 4497, pid 47075 (`--directory` the scratchpad's look/step4/round1). `kill 47075`.
- port 4495, pid 2535 (cwd this worktree, since 11-10 01:05): owner unknown; leave it unless in the way.

Decide / ask Dan:
1. Which account: rounds 1-4 (https://claude.ai/artifact/WbhosKXawqVMvT3xpKo53p) and the finish list (stops 2-6 still
   unpinned, https://claude.ai/artifact/LKA2p4zQACEx8odCn1vZqq) are on the RevAudio account; round 5 and the speed
   page on Dan's personal one, where this session ran. Keep to the personal one unless he switches back.
2. Model files no slot uses now: bass.glb, guitar-black.glb, guitar.glb (and jack-creeper.glb once N03 lands). Not
   loaded; keep or delete is Dan's call.
3. The speed session (`danavivi-cc`, `feat/home-speed`) merges into this branch on Dan's OK; expect overlap in
   room.html's loadTextures / loadModels (the street's 11 lines are there too). Main now also builds the hidden page
   from room.html (danavivi-fa's `tools/garagepage/integration.mjs` swaps its Google Fonts and jsDelivr Lenis for the
   site's own): a change to how room.html loads fonts or Lenis must keep that swap working (its build log warns if not).

Cleanup: this session's scratchpad (`/private/tmp/claude-501/-Users-danavivi/b6aad35f-2a94-4c15-bec7-6071dd878989/
scratchpad`, ~20 GB with the speed study) can go once round 6 is out: the essentials are in
`.claude/garage-bench-2026-11-10/` and `.claude/perf-study-2026-11-10/`.

Open: the monitors bench had B (vintage) ticked but Dan's chat said "black + wood"; black went in. Confirm if asked.
Owed by Dan: send Yoni the CSP link (three words: `'wasm-unsafe-eval'` in script-src, `blob:` in img-src and
connect-src; tested 11-10 in Chrome, Safari, Firefox; steps, exact values, check and undo: the shared repo's
`collaboration/handoffs/2026-11-10-yoni-csp-room/handoff-yoni.md`); when he says done, compare the live header with that page's value byte
for byte (the value: `.claude/garage-bench-2026-11-10/csp/csp-prop3-raw.txt`; the local test, `cspserve.py` +
`csptest.cjs`, sits next to it) and load /garage-9f3c/ (textures, no CSP errors); tell Gil (the room on laptops from Nov 19, next to his Black Friday
countdown); the finish list's stops 2-6.
Run the room: from this worktree's root `python3 -m http.server 4490 --bind 127.0.0.1` (this session left one running,
pid 52126: `kill 52126` if it's in the way), then http://127.0.0.1:4490/tools/_home-opening/room.html. The scripts
default to port 4471: pass the port.
Loose ends: `home-bake` has the untracked, regenerable `bake/room/` + `bake/test-room/` (leave or delete).

### 2026-11-11 — `danavivi-cc [172bce]` (the speed session) — direction 1 built on `feat/home-speed`: the models download 4.7 MB lighter, same look — MERGED into `feat/home-opening` and PUSHED TO MAIN 2026-11-11 on Dan's word, live and checked

Claim: CLOSED 2026-11-11 (rv close); it was `danavivi-cc [172bce]` (Dan's Mac), worktree `.claude/worktrees/home-speed`, branch `feat/home-speed` (cut from
`feat/home-opening` at `05e1a09`). Files: `tools/_home-opening/masters/**` (new), `tools/_home-opening/assets/models/*.glb`
(now built files), `tools/_home-opening/models-kit/pack/**` (new), and two doc lines (`models-kit/README.md` "Into the room"
step 2, `assets/models/SOURCES.md` intro). `room.html`, `MODELS`, every path and every node name are untouched.

Request (Dan, 11-11, after the directions page https://claude.ai/artifact/4GNk8z5d4NUHhqJYwaxXps): "pull and Build 1" =
direction 1, "same look, smaller files, for everyone".

**Read this before you add or replace a model** (it changes the flow for every session):
- The full-size originals now live in `tools/_home-opening/masters/models/` (83 files, a git rename) and `masters/pbr/`
  (37 copies). They are not served and not copied to the live page (`tools/garagepage/integration.mjs` copies `assets` only).
- `assets/models/*.glb` are **built** from them by `models-kit/pack/` (pictures inside → WebP, shapes → meshopt). Never edit
  one by hand: the next pack overwrites it.
- New or replaced model: put the raw .glb in `masters/models/` (one dropped into `assets/models/` out of habit is moved there
  by the pack's first step), run `tools/_home-opening/models-kit/pack/pack.sh` (~10 min; Chrome; port 4618 or
  `KIT_PORT=<free port>`), commit the master, the packed file and `need.json`. After the layout or the walk moves:
  `./pack.sh check`. Full page: `models-kit/pack/README.md`.
- Blender (and most tools) cannot open a packed file: open the one in `masters/models/`. `glbinfo.py` reads both.
- The waiting drops of the builders (N17 `pedalboard.glb` and L20 `bass-natural.glb` replaced, N03 `lift-pump.glb` new, the
  glossy `coupe.glb`) go in through `masters/models/` + `pack.sh`. When this branch meets a branch that replaced
  `assets/models/<x>.glb` with a raw file, git reports a conflict on it: take the incoming raw file as
  `masters/models/<x>.glb`, re-run `pack.sh`, commit what it builds.

What the pack does to a model: every position, triangle and node comes out bit for bit as it went in (the build compares
them and refuses to write a file that differs); normals are rounded to 12 bits, UVs to 14; colour pictures WebP q85, normal
and roughness maps q90, the original's bytes kept when WebP isn't smaller; a picture shrinks only by the size levels the
walk never reads (measured at 41 stops in four windows, half a level of headroom).

Results (measured 11-11, this Mac):
- Models 22.90 → 12.17 MB on disk; as downloaded (gzip, what the live server sends) 14.11 → 9.44 MB. A cold first visit
  22.21 → 17.60 MB on the wire, 162 files as before. PBR maps unchanged (5.92 MB).
- Cold first visit until the room is ready, today → packed (two interleaved passes through `perf/simserve.py`, gzip on,
  40 ms round trip at 25 Mbps and up, 150 ms below; both passes shown where they differ): 100 Mbps 4.0 → 3.8 s ·
  50 Mbps 5.7 / 5.6 → 4.9 s · 25 Mbps 9.0 / 8.9 → 7.7 / 7.4 s · 10 Mbps 19.5 / 20.0 → 15.9 / 16.1 s ·
  5 Mbps 37.4 / 37.5 → 29.8 / 30.2 s · the stress line, 1.6 Mbps: 112.9 / 113.0 → 89.7 s (1:53 → 1:30).
- Less than the directions page promised for direction 1 (15.2 MB, 77.8 s at 1.6 Mbps). Why: (1) the texture right-size
  finds only 7 of 237 textures to drop (≈ 0.3 MB, the page expected ~3 MB): the models' maps are read with 8x anisotropic
  filtering (`room.html` `dress()`), one level finer than the trial assumed, and the ultrawide + tablet windows count;
  (2) the trial's tighter shape packing changed the picture, so it was dropped (next point).
- Same look, proven: stills at walk 0 / 0.25 / 0.5 / 0.75 / 0.95 (1141x636 @2x, all lights), originals against packed:
  mean difference 0.00-0.16 of 255 levels, under 0.01 % of pixels off by more than 24, nothing the eye finds at 6x zoom
  (two renders of the originals are pixel-identical, so every difference is the pack's). The first recipe failed this test
  twice and both causes are now excluded by the build: 8-bit normals moved the highlight on the car's paint at the door
  (car area: mean 1.94 → 0.07 with 12 bits), and snapping positions to a 0.03 mm grid made a lit meter face on the studio
  desk (`rack_glow`, 0.5 mm over its panel) come out half dark at walk 0.25 (max 181 → 11). Cost of keeping both exact:
  0.6 MB.

Checks, actual results:
- `pack.sh check` end to end: `237 right-sized, 0 could shrink, 0 under-sized, 0 not packed, 0 without an original`.
  The build is repeatable: 13 more runs of `node pack.mjs build`, 12 ended `0 files changed`. One (the first, started
  the moment the timing run ended) stopped with a Node error whose text was not captured; the files were not touched
  (the next run: `0 files changed`, `check` passes) and it did not come back in 12 tries. If `pack.sh` stops in the
  build step, run it again and keep the error text.
- `lights/check.mjs` (40 Mbit/s): no page errors; the hand-off picture is as far from the room as before (mean 5.20 levels
  packed, 5.19 today), so `assets/lights/` needs no re-render. Phase shares 0.33 / 0.44 / 0.20 / 0.03 against `LOADW`
  0.34 / 0.52 / 0.11 / 0.03: left as it is.
- `layout-kit/check.mjs layout-kit/start-layout.json`: output byte-identical to today's room (no overlaps, same frame sizes).
- The packed room under the proposed CSP (`csp-prop3`) in Chrome, WebKit 26.5 and Firefox 153: 1339 objects, 282 textures,
  0 dropped, no errors, the same counts as the originals.

🔴 **Do not put this on main before Yoni's CSP edit is live.** Under today's live policy the meshopt decoder (WebAssembly) is
blocked: tested 11-11 in Chrome, the packed models do not appear at all (812 objects instead of 1339; today the live page
shows them without their pictures). The word needed is the one already asked for: `'wasm-unsafe-eval'` in `script-src`
(with `blob:` in `img-src` and `connect-src`): `collaboration/handoffs/2026-11-10-yoni-csp-room/handoff-yoni.md` in the
shared repo. The live header on the morning of 11-11 still lacked all three.
**Update 11-11 12:34: the edit is live** (Yoni + `revaudio-bf`, shared `collaboration/STATUS.md`): the header on
https://revaudio.net/garage-9f3c/ now carries `'wasm-unsafe-eval'` in `script-src` and `blob:` in `img-src` and
`connect-src` (read with `curl -sI`). The blocker is gone. Checked on the live domain after the main push (11-11, below):
no CSP errors, every model textured.

Not done / open:
- Merged into `feat/home-opening` on Dan's word ("marge", 11-11 after the close): a fast-forward from `05e1a09`, pushed to
  origin.
- **On main, live** (Dan, 11-11: "push to main", then "send and sonnet - to marge to main"): a Sonnet subagent merged
  `origin/feat/home-opening` into `origin/main` with `--no-ff` in this worktree, merge commit `833f632`, pushed
  `200a599..833f632`. Deploy to GitHub Pages run 43007936331 and Smoke test run 43007936347: both success. The merge
  touches only `tools/_home-opening/**` and `tasks/**` (215 files).
- Live check by this session after the deploy, https://revaudio.net/garage-9f3c/?expose&capture=0 in Chrome 157 and
  WebKit 26.5 (Playwright, headless): 1339 objects, 708 meshes, 282 textures, 0 empty, 0 dropped, 0 CSP violations,
  no page errors, in both: the same counts as the local packed room. The live `assets/models/coupe.glb` is the packed
  file (363,052 bytes); `masters/` is not on the live site (404), as intended. Not checked on live: Firefox, a real
  phone, a look by eye at the walk (Dan's).
- Direction 2 (the slow-line safety net) is not built. Other savings not built: the picture quality was not lowered, and
  the PBR maps were left alone.
- Not measured: real phones, Safari timings (the timings are Chrome on this Mac through `perf/simserve.py`).
- `LOADW` not re-tuned (above). The trial builds, stills and timing logs are in this session's scratchpad only
  (`/private/tmp/claude-501/-Users-danavivi/38d326b1-1855-4bfb-9b05-ed9017ee0743/scratchpad`: `stills6/`, `perf/final.txt`).

Next: Dan looks at the room from this worktree (`python3 -m http.server 4618 --bind 127.0.0.1` at its root, then
http://127.0.0.1:4618/tools/_home-opening/room.html) (he said merge before looking). Main: done 11-11, live check passed (above). What is left is Dan's own look at
https://revaudio.net/garage-9f3c/ and, if he wants the slow lines faster, direction 2.
This entry's update sits on `feat/home-speed` / `feat/home-opening` only: it rides to main with the next room push (a
handoff-only push to main would run a deploy and a full Cloudflare purge for nothing).

Session end 2026-11-11 (rv close):
- Dan's last word on the build: none yet. He got the report (numbers, the three before/after pictures, the CSP warning)
  and closed the session; he has not looked at the built room and has not said merge.
- Stopped on Dan's word at close (both ports are free; Dan also confirmed the CSP edit is active). They were: `python3 -m http.server` on 127.0.0.1:4618 (pid 39650, this
  worktree's root = the packed room) and on 127.0.0.1:4619 (pid 54424, a scratchpad copy of the originals = today's
  room). `pack.sh` uses 4618 by default, or `KIT_PORT=<port>`.
- The scratchpad is under `/private/tmp` and does not survive a restart: the stills and `perf/final.txt` are evidence
  only, every number that matters is written above.
- Git at close: the worktree is clean; `feat/home-speed` = `origin/feat/home-opening` (`05e1a09`) + this session's
  commits, 0 behind it. `origin/main` has three commits this branch lacks (`8aef421`, `9fb1151`, `200a599`: the unlisted
  /garage-9f3c/ page and its fonts, another session's). Untouched by this session: every other branch and worktree.
- After the merge `feat/home-speed` has nothing `feat/home-opening` lacks; work goes on in `feat/home-opening`. A branch cut
  before the merge that replaced a model: see "Read this before you add or replace a model".

## 2026-11-09 — /revfx trial form sends the download at once (`gateWired: true`) (Claude Code `revaudio-0b [3311c0]`, Yoni's laptop 2) — branch `revfx-gate-on` — PUSHED TO MAIN 2026-11-09 on Yoni's "deploy" (worker deployed first, version `b31a75bd`)

Claim: CLOSED 2026-11-09 `revaudio-0b`. Files: `src/data/revfx.ts` (`gateWired` only; `revaudio-2f`'s claim there is `hearTracks` only), this entry.
- Yoni: a user already on our list got "Already on our list" on the /revfx sign-up and no download. Cause: with
  `gateWired: false` the RevFX forms posted only to the worker's once-per-email `/form-once`. The worker has known
  RevFX since `b7e589a` (live 2026-11-08) and both RevFX builds are live in R2, so the gate is on: the forms post to
  `/download/register` (download email at once, as on /drift); `/form-once` runs in the background only.
- Paired worker change (RevLimiter repo main `e388699`, DEPLOYED 2026-11-09, version `b31a75bd`): trial sign-ups to `/form-once` are logged
  in KV `triallog:<email>`, no Formspree mail to info@, never "already". Ship order: worker deploy, then this push.
- Checks: `npm run build` green (33 pages); built /revfx/ has 2 forms with `data-register-url` = the worker's
  `/download/register` and the ok text "Download on its way by email." Not checked: a real sign-up (after deploy).
- Open (not touched): `winReady: false` + the fine print "Open it on a Mac", though `revfx-win` is live in R2 since
  2026-11-09 16:07; the download email offers both.

## 2026-11-09 — /revfx player: the die moves into the player and rolls Yoni's presets (Claude Code `revaudio-2f [e388a1]`, Yoni's laptop 2) — branch `feat/revfx-hear` — LIVE on main `81922f5` (2026-11-09, Yoni: "push deploy to the revfx page (dont add it to the index just like its now)")

Claim: OPEN `revaudio-2f` (live; open for the preset names) (took over `revaudio-0d`'s claim below, same files, + `src/components/revfx/RfxHero.astro`,
`src/lib/revfx/deck.ts`). 
- Yoni: the die really rolls a preset, random only for the visitor: 4 presets per sound (his renders + his RevFX preset
  .xml), a roll picks one of the other 3. Die + scene CRT + chain move from the hero into the player (step 4 ROLL IT);
  a roll while stopped starts playing in RevFX.
- Fix (Yoni: "you misplaced the pedals in the top there overlapping"): the player reused the hero's class
  `.rfx-board-wrap`, so its `container-type: inline-size; display: flex` shrank the hero board to 13 px and the pedals
  spilled over the REVFX card. The player's wrapper is now `.rfx-hear-board-wrap` (`ef5838f`).
- Built (the die): hero's die + scene CRT + chain removed (`deck.ts` deleted, its CSS gone; the catch line stays).
  Player step 4 ROLL IT (`.rfx-hear-top`: beside the LCD from 701 px, a strip under it up to 700). hear.ts: a roll =
  one of the other 3 presets (the next one picked + loaded ahead), REVFX on, crossfade at the same loop spot, starts
  playing when stopped; new track = random preset; LCD title = preset name, chain line = its order; the board takes
  its order (FLIP) and lights its pedals; coach ROLL THE DICE after the A/B. Data: `src/data/revfx-presets.json` +
  peaks.json `presets[]`, both from `tools/revfx-player/prep_audio.py` (now reads Yoni's preset .xml too).
- Checks: build green; LCD lines fit 360-1440; click-through + 40 rolls 0 repeats (repo `tasks/todo.md` Review).
- Yoni's sounds IN (2026-11-09, from `C:\shirimmmmmm`: `<track> dry.wav` + `<track> #1..#4.wav`, 48 k stereo; the
  script now reads those names as they are): 20 m4a, 5.1 MB, the /drift stand-ins gone. All aligned (lag 0 smp vs
  the dry). Level: all five per track down to the quietest (preset 1 in every track): vocal -16.6, instruments
  -15.4, drums -15.1, lead -12.9 LUFS. Loop seam jump vs the normal sample step: Lead #4 0.21 vs 0.095, instruments
  ~2-3x: may tick once per loop, listen.
- STATE: real sounds, PLACEHOLDER preset names / pedals / order (no .xml came; revfx-presets.json "placeholder":
  true). Next: Yoni's 16 names + pedals + order (or the .xml), listen to the swap, then his "push" for main (= live
  deploy).
- ROLL IT = a little TV (Yoni: "turn the cube panel into an lcd screen similar to the website tv"): `.rfx-tv` =
  WordWall's glass layers in RevFX violet, sunk in the plate, Bebas ask "4 ROLL IT ▸" (lit + 4 blinks when next),
  the die is the picture, the glass is the button. Plate 172 px laptop / 154 at 1024-1240 / a strip up to 700.
  DESIGN.md §4 has the rule. That answers the photo-die question (the die is now a picture on a screen).
- Then (Yoni: "make the tv more prominent ... more lines more distortion in the image"): the set = home's broken TV
  cabinet (tv-broken-3.png cut 640 px, 9-sliced at --tvf-u .16 / .145 / .095 / .085) + pilot LED; heavy scanlines
  over the die, red / cyan fringes, hum bar, flicker, small tear every 5.7 s, big tear + flash on a roll. Panel 192 px
  laptop / 170 at 1024-1240 / a 100 px strip up to 700 (90 on phones).
- Then (Yoni: "instead of 4 - roll it make a cool tv theme like text which just says Randomize"): the TV says
  RANDOMIZE only, VT323 on-screen type (20 / 17.6 / 24 / 20.8 px after Yoni's "reduce the text size by 20%"), red / cyan fringes, 4 hotter beats when next. The
  LCD's coach still says ROLL THE DICE.
- DEPLOYED 2026-11-09: origin/main merged into the branch (one conflict, tasks/lessons.md: both kept), build green,
  pushed `81922f5` to main (fast-forward). Deploy + Smoke test + Clear Cloudflare cache all success. Live checks:
  hero board 761 px, every /audio/revfx file 200, play + roll + track change work, no page errors. Listing unchanged
  (only RevFX files differ from main: no plugins.ts / library.ts / astro.config change; /revfx/ stays in the sitemap,
  no robots meta, not on the home TV, as before). STILL PLACEHOLDER: the 16 preset names / pedals / order.
- Then (Yoni: "the volume text ... make a weird jump" at 100): `.rfx-vol-read` keeps the width of "VOL 100"
  (min-width 7.5em), so the volume plate no longer grows and squeezes the board (it was 348 -> 341 px). LIVE on main
  `7994430` on his "push"; Deploy + Smoke + cache clear green, live re-measure: nothing moves at 80 / 100 / 99 / MUTE.

## 2026-11-05 — /revfx before/after player: "Plug in. Stomp it." (Claude Code `revaudio-0d [61a467]`, Yoni's laptop 2) — branch `feat/revfx-hear`, worktree `../revaudio-website-rfxhear`

Claim: HANDED to `revaudio-2f` 2026-11-09 (was OPEN `revaudio-0d`). Files: `src/components/revfx/RfxHear.astro` (new), `src/lib/revfx/hear.ts` (new),
`src/lib/revfx/init.ts`, `src/pages/revfx.astro`, `src/styles/revfx.css` (new #hear block only), `src/data/revfx.ts`
(hearTracks only), `public/audio/revfx/**` (new), `tools/revfx-player/prep_audio.py` (new), this entry.
- Yoni: "create the before after player for revfx ... maybe the layout of the drift ab player can work here ... 4 sounds
  - vocal, instruments, drums, lead. use placeholders for sounds ... full creative freedom". Placement: under the hero.
- Built: `#rfx-hear` "Plug in. Stomp it." under the hero. 1 PLUG IN (four input jacks, the plug + a lit cord on the
  picked one), the segment LCD (coach / BYPASS-REVFX ON tag / name / waveform / chain + clock), the signal path (IN, the
  five pedals on a board, OUT; the TRUE BYPASS wire under them: lit + pulsing on BYPASS, the FX wire on REVFX, pedals
  light in chain order in their own inks), 2 PLAY (/drift's caps), 3 STOMP (CSS chrome footswitch + purple LED),
  VOLUME (/drift's fader). Engine = a copy of /drift's hear.ts without the pan bus (DRIFT untouched). Guide: PRESS PLAY
  -> STOMP IT -> STOMP AGAIN: BYPASS -> NOW PLAYING. `revfx.ts hearTracks[].on` = the pedals a bounce used (all five now).
- SOUNDS = PLACEHOLDERS: /drift's bounces copied (vocal <- vocals, instruments <- keys, drums <- perc, lead <- synth),
  peaks.json `"placeholder": true`. Real swap: Yoni's `<name> dry.wav` + `<name> revfx.wav` per track, then
  `python tools/revfx-player/prep_audio.py "<folder>"` (level-matches the louder side DOWN, pads, AAC 160k, peaks).
- Checks (dev server, own headless Chromium, 1440x900 / 1141x636 / 390x844 / 360x740): play -> stomp -> pick DRUMS ->
  stomp back, guide states right at every step, no page errors, no sideways scroll, no clipped labels; `npm run build`
  green (33 pages). WebKit on Windows headless has no AudioContext (same as /drift's player), so play is untested
  there; layout only. Not checked: a real iPhone / Safari, reduced-motion by eye.
- Round 1 commit `a3cfdc4` (CSS-drawn parts). Round 2 (Yoni: "the size ... similar to the drift ab size ... use open
  ai to create highly realistic and cool vintage 90's vibe assets - make it tight - easy to understand - smooth"):
  panel 1180x452 at 1440 (DRIFT's #hear 1180x484; was 692), 547 on a 390 phone (DRIFT 547). Path + stomp merged into
  ONE board row: footswitch + LED (an A/B looper) -> the five joined by patch cables -> OUT, TRUE BYPASS loop under them.
  All hardware = OpenAI photos (`src/assets/seasons/revfx/hear/`, prompts + picks in `tools/revfx-player/ASSETS.md`):
  tolex flight case, patchbay plate, pedalboard, 1/4" jack, right-angle plug + tweed cable, patch cable, 3PDT
  footswitch, LED off/lit; the fader = /drift's photos. Plates made at their display ratio (gpt-image-2 custom sizes)
  and stretched; 9-slicing left seams. Pedal size follows the board's width (container query). Tablets (<= 1023)
  stack like the phone. Class clash found + fixed: `.rfx-board` was the hero's (tasks/lessons.md).
- Round 2 checks (own headless Chromium): fit at 1440/1280/1141/1000/901/768/600/430/390/360 (no overlap, no
  sideways scroll); the click-through at 1440/1141/390/360 (guide states right, no page errors); hero screenshot
  unchanged; `npm run build` green (33 pages); player images ~600 KB on a laptop (case 202 KB). ~22 OpenAI images
  this round (~$4). Not checked: real iPhone / Safari (Windows WebKit has no AudioContext headless).
- Shared side fix: `shared/tools/openai/image.ps1` + `edit.ps1` defaulted to the retired gpt-image-1 (broken for
  everyone); now gpt-image-1.5 + `-Model`, pushed to revaudio-shared main `fb386f3`.
- Round 3 (Yoni: remove "the line out and the out connector, no need"; "make the bypass stomp more realistic it looks
  toyish"): OUT jack + the TRUE BYPASS loop removed; the loose chrome switch is now a worn 1590B A/B looper pedal
  (`looper.png`, gpt-image-1.5, 2 rolls, roll 1 picked), as tall as the five, the whole pedal = the button, its LED lit
  in its own bezel, a patch cable into PITCH. Fit at 10 widths (no overlap, no sideways scroll), click-through
  1440/1141/390/360 clean, build green. stomp.png + led.png deleted.
- Round 4 (Yoni: "the stomp is not good - its the whole pedal, i meant just the switch - ... a bit of petina, when
  pressed make it stay pressed and when bypassed make it pop out"): looper pedal out; an aged nickel 3PDT footswitch
  (`fsw-up/fsw-down.png`, near top-down, the pressed photo aligned on the washer so only the cap moves) + the LED above
  it. Latches: up on BYPASS, down + LED lit on REVFX; down while the foot is on it either way. Fit at 10 widths clean,
  click-through clean, build green. 6 more OpenAI images.
- Round 5 (Yoni: the switch "too much on a side view ... more from upper angle, still make some angle"; "metal panels
  on each section including the stomp switch"; "titanium vibe with a bit of the titanium color effect"): new switch at
  ~8 deg (pressed = masked edit, base pixel-identical); every section (screen, PLAY, STOMP, VOLUME) + the switch on
  titanium plates (titanium.jpg heat tint, 4 screw.png corners, CSS bevels). Fit at 10 widths clean, click-through
  clean, build green. 7 more OpenAI images.
- Round 6 (Yoni: "the panels are dull ... the effect ... when titanium is burned ... higher petina and wear ... the
  screws are fighting with the data ... tighten everything"; "the wear should be like the left panel"): plates are now
  photos (burnt titanium + the patchbay plate's wear + corner screws, 2:1 / 1:1 / 1:2), 9-sliced with stretch; the
  border = the screw zone; the patchbay 9-sliced the same way (bay-wide gone). Screw test PASS at 10 widths x 2 states
  (control-probed), fit clean, laptop panel 476 (DRIFT 484), phone 538 (DRIFT 547), click-through clean, build green.
  Checks saved in tools/revfx-player/checks/. 5 more OpenAI images.
- Round 7 (Yoni: "good job! do the left panel also with the titanium"): the patchbay is a burnt titanium .rfx-plate (plate-t on laptops, plate-w below 1024); bay.jpg retired. Screw test PASS, fit clean, build green.
- Round 8 (Yoni: "make the engage / bypass button not a stomp switch ... like for drift bypass button"): /drift's push-to-start (drift.css .d-start + #hear's raised cap) in RevFX purple, REVFX / ENGAGE, at the head of the STOMP plate beside the board; step 3 = PUSH REVFX, coach PUSH REVFX / PUSH AGAIN: BYPASS, headline "Plug in. Push it." (was Stomp it). Switch + LED photos retired. Screw test PASS, fit + names clear at 11 widths, click-through clean, build green.
- Round 9 (Yoni: "make the shades of the colors of the titanium panels like the shades of color of the pedals"): OpenAI credits ran OUT (credit_balance_exhausted), so the plates were retinted locally (`tools/revfx-player/retint.py`): the heat tint now runs HALO green -> GLUE cyan -> PITCH ice -> REVERB violet -> ECHO pink; metal, edges and screws untouched. Screw test PASS, build green.
- Round 10 (Yoni: "i dont see the colors it looks the same" = a stale dev image: same file name, no content hash; then "30% less in your face"): the retint fixed (a clipped block of blues had all gone violet, pink was 0 %; now the five ~12-25 % each), INTENSITY .7, output named plate-pedal-<LOOK>-*.jpg (LOOK v2) so a browser can't keep an old plate. Screw test PASS, build green.
- Round 11, "last run" (Yoni: "glue everything nicely to a real life look, buttons, cables, connectors ... not just
  floating"): ONE top-left light (every shadow down-right; a soft-light falloff over the case), the caps in chrome
  bezels in bored holes, the REVFX button in a machined seat ring, the jack nuts on seat rings, the LCD in a machined
  cutout, the cable runs off the patchbay and UNDER the next plate (no mid-air fade), contact shadows under the pedals
  and the board, the picked input shown physically (no highlight box). STOP kept desaturated (the CTA red rule).
  Screw / fit / names checks PASS, click-through clean, build green. Panel 473 laptop, 530 phone.
- Round 12 (Yoni: "when i press the stop and the play the buttons go off of their setting area"): drift.css's arcade cap motion (hover -1 px, press +4 px) pushed the caps out of their bezels; seated caps now never slide, they press INTO the bore (scale .94, darker). checks/press.cjs (hover + held press at 1440 / 390; control-probed: the old 4 px drop fails it) PASS.
- STATE for whoever picks this up: everything is on `feat/revfx-hear` (worktree ../revaudio-website-rfxhear); the
  sounds are still PLACEHOLDERS (/drift's bounces, peaks.json placeholder: true); the OpenAI credits ran out
  2026-11-05 (top up before more generated assets).
- Next: Yoni's sounds (tools/revfx-player/prep_audio.py) + his "push" for main (= live deploy).

## 2026-11-04 — GAS 2 postcards: the end page scrolls as one page, the footer under it (Claude Code `danavivi-c2 [ca2821]`, Dan's Mac) — PUSHED TO MAIN 2026-11-04 on Dan's word "perfect push to main" (from `fix/gas2-end-flow`)

Claim: CLOSED 2026-11-04 `danavivi-c2`. Files: `tools/_gas2-scene/postcards.html`, `DESIGN.md`, this entry.
- Dan, on his iPhone after `f3735ae` (the held height) went live: still not smooth; "try a different attitude": scroll
  down to the footer without it coming up over the page.
- Built: at the end, `html.at-end .desk` = `position: absolute` at the px height it came up with (`--end-h`, measured
  while still fixed; only a new width measures again), so the end page and the footer scroll together as one page under
  the sticky bar; no scroll listener any more. Leaving (The postcards again / Download FREE) scrolls to the top, then
  the desk is fixed again.
- Checks: built `/gas2/`, WebKit 402x714, 12 px steps down with the viewport growing 714 -> 790 and back up: 0 moves in
  page coordinates (scene, GAS2, button, footer), the footer starts at the end page's bottom; turned phone re-measures;
  `check.cjs` ALL PASS (47 steps, 40 layouts); build green. Not checked: a real iPhone. Known: a `?card=7` deep link on
  an iPhone that first lays out at the full screen keeps that height (review links only; visitors arrive by flicking).

## 2026-11-04 — Home TV ("the LCD") polish: two benches, keys + pictures (Claude Code `danavivi-4f [ed951e]`, Dan's Mac) — branch `feat/lcd-polish`, PUSHED TO MAIN 2026-11-04 on Dan's word "push to main" (merge onto main)

Claim: CLOSED 2026-11-05 `danavivi-4f [ed951e]` (it carried on the session Dan closed by mistake, transcript
`a0d54622`, from its A/B/C step). Files: `tools/wwbench/wwkeys.html` (new), `tools/wwbench/integration.mjs`,
`tools/wwbench/wwbench.html`, `src/components/WordWall.astro`, `DESIGN.md` §4, `tests/smoke.spec.ts` (the /store test), this entry.
- Dan's notes (review bench https://claude.ai/artifact/GiWdMBTrxJ69m3iocGJRo1, round 1): the Try key "is not fitting the
  LCD screen, I want it to feel like it's part of the LCD screen, give me 3 different options on a bench"; the Product
  page key the same; overall "get deep into the small details of how the plugins look on the screen, a bench for that".
- `/__wwkeys` (dev only): the real TV four times, today's keys + A inverse video (the ALL chip's language) / B cursor
  menu (the names' stencil, a blinking cursor) / C OSD bar (price + keys in one framed strip, corner ticks). Each option
  is a <style> dropped into its frame; channel buttons, Laptop 1141 / 1440 / Phone, a readout of the rows and the
  window height each one leaves. Picking one reverses D9 (the button family on the TV keys) for the TV only.
- `/__wwbench` "Pictures on the glass": window edge, glow, glow reach, shadow under it, corners, brightness / colour /
  contrast, thumbnail corners, lit glow, hover grow + light, glass reflection, tube curve; FIT / 1:1 / x2 on the laptop
  frame. WordWall.astro: those values are --ww-pic-* / --ww-thumb-* / --ww-scr-glare / -curve with today's numbers.
  Zero-pixel diff vs main at the defaults (22 reduced-motion shots, WebKit + Chromium, 1141x636 + 390x844, every
  plugin + a hover). The light sliders are bench-only: an identity filter repainted the window (up to 58 levels), so
  the filter goes in only once a value is baked off 1. `npm run build` green (32 pages).
- KEYS = A (Dan 2026-11-04, "commit A", on the pick page https://claude.ai/artifact/Ud7jvQJi3e9a4QcFKtoEha):
  WordWall.astro carries option A's CSS on the screen only (html.hc and `WALL_BG = 'wood'` keep D9); DESIGN.md §4
  TV + the button family line say so. Checks: 38 reduced-motion shots (WebKit + Chromium; 1141x636, 1440x900,
  390x844; 5 channels + hover on each key) pixel-identical to the bench's A; 1141x636 / 1280x720 / 1440x900 /
  1920x1080 / 390x844 / 375x667 / 360x740 / 430x932 x 5 channels: keys inside the column and on screen, no sideways
  scroll, no page errors; hc keeps the button family; `npm run build` green (32 pages). `/__wwkeys`'s "Today" frame
  now shows A. Not checked: a real iPhone / Safari window.
- LIVE: merge `069d5ac` pushed to main 2026-11-04; Pages deploy run 41846343673 success (started by the push, no
  hand run needed). revaudio.net (WebKit, 1141x636 + 390x844): Try / Product page = option A (3 px, phosphor fill),
  no sideways scroll, no page errors.
- SMOKE GREEN again (Dan 2026-11-05 "fix it", then "push to main"): the smoke test failed on main since 7176953
  because `/store` goes to the TV on `/plugins` (since 2026-11-02; 40c9e43) while the test waited for
  `/?utm_source=smoke#plugins`. `6ce626a` makes the test wait for `/plugins?utm_source=smoke` (site unchanged).
  Local chromium + mobile-safari pass; on main: smoke run 42019338698 68 passed, deploy 42019338710 success.
- Unverified: a real iPhone / Safari window with the new keys; Dan has not looked at the live TV himself since A went up.
- Running: the dev server on 127.0.0.1:4512 (this worktree, PID 83451, log
  `/private/tmp/claude-501/-Users-danavivi/a0d54622-9069-4e06-a247-e477f0bb5a76/scratchpad/dev-4512.log`); stop with
  `kill 83451`.
- Open for Dan: (1) the pictures bench `/__wwbench` "Pictures on the glass": tune, COPY SETTINGS, "apply ww bench"
  (bake into WordWall.astro, then a push needs his word); (2) `/__wwkeys` is spent: its "Today" frame now IS A and the
  A frame doubles it; keep as a record or remove it (dev-only, never built).
- Next: the pictures bench, on `feat/lcd-polish` (= main `6ce626a` at close).

## 2026-11-04 — GAS 2 postcards: no shaking when the end page scrolls to the footer (Claude Code `danavivi-c2 [ca2821]`, Dan's Mac) — PUSHED TO MAIN 2026-11-04 on Dan's word "push to main" (from `fix/gas2-end-scroll`)

Claim: CLOSED 2026-11-04 `danavivi-c2`. Files: `tools/_gas2-scene/postcards.html`, `DESIGN.md`, this entry.
- Dan, on his iPhone after the round-16 push: scrolling the end page to the footer "shaking". Cause, reproduced in
  WebKit by growing the viewport 714 -> 790 in steps (= Safari's toolbar folding as you scroll): the fixed end page
  is sized by the screen, so every step re-placed the scene (the station 514 -> 569 px wide, GAS2 +30 px, the button
  +54 px) and the footer's 100dvh spacer pushed it back down 76 px against the finger.
- Fix: `keepEnd()` — once the end page scrolls, `.desk` keeps the px height it had at the top (a new width, i.e. a
  turned phone, measures again; back at the top it follows the screen); the footer's spacer = that height (`--end-h`).
- Checks: the stepped scroll with the toolbar folding: 0 moves of the scene, the footer moves exactly with the scroll
  (live main before the fix: 9 jumps in the same test); back at the top, turned, The postcards again: as before;
  `check.cjs` ALL PASS (47 steps, 40 layouts); `npm run build` green. Not checked: a real iPhone (the Simulator can't
  be scrolled from here).

## 2026-11-04 — GAS 2 page, round 16 of the postcards review: dots, the stamp, no mailbox, the site footer (Claude Code `danavivi-c2 [ca2821]`, Dan's Mac) — PUSHED TO MAIN 2026-11-04 on Dan's word "push to main" (fast-forward from `feat/gas2-r16`)

Claim: CLOSED 2026-11-04 `danavivi-c2`. Took the postcards over from `danavivi-83` (claim 2026-10-29 entry; that session is not running).
Files: `tools/_gas2-scene/postcards.html`, `tools/gas2page/integration.mjs`, this entry.
Dan's round-15 notes (review artifact `notes-r15`): the site's top bar hides the top of every card; "1 / 6" + the arrows
-> dots, high-end (his pick: pilot lamps); card 6: a smaller, clearer stamp, no mailbox, the title clear of the stamp
(his pick: fit it beside); a footer on the phone's end page, reached by scrolling, and on every platform.
- Built (`postcards.html`): `.desk` padding-top = max(safe area, `--site-bar-h`); `.ctl` = the hint line + six pilot
  lamps (`.pl`, `aria-current` on the top card's; a tap = `walk()`, card by card, a newer tap takes over); no mailbox
  (`.box`, `props/mailbox.png` unused here now): a stamped card drops out of the bottom; the stamp in two lines, full
  ink, `--red`; `.mtitle` 7cqw beside the stamp; `html.at-end` lets the end page scroll to `#site-foot`.
- Built (`integration.mjs`): `siteParts()` = the bar + the real Footer from the built `/terms/`, both through one
  `shadow()` helper; the bar sets `--site-bar-h`; the footer's drawers wired, its contrast switch + scripts left out,
  hidden during page-b's drone (`html.dr-on`); page-b's own one-line mock `<footer>` is dropped in the site copy.
- `postcards/tools/check.cjs`: the lamps for ‹ ›, and the stamp's POST mocked (it posted for real since `abfed71`, so a
  run of main's check would send to the live worker); the "Keys in the mail" / "nothing is sent" lines were stale.
- Checks: `check.cjs` ALL PASS (47 steps, 40 layouts, 0 errors) on the scene; main's own check fails 7 (the stale
  lines). `npm run build` green; built `/gas2/` (WebKit 402x714): the hop to the postcards, bar over nothing, the
  footer drawers open/close, The postcards again scrolls back up; page-b (Chrome 1440x900): no footer over the drone,
  one footer after landing. 0 page errors. Not checked: a real iPhone / Safari.
- Round 16 (notes-r16): the hint -> "Swipe for the next card" in tracked Oswald caps, soft brass (Dan: shorter, clearer,
  another font; his pick of three). The bench's card-6 question ("Drop me in the box" with no mailbox) got no answer:
  kept. check.cjs ALL PASS (47 steps, 40 layouts); build green.

## 2026-11-04 — GAS 2 page: the site's top bar + the caught car emails a personal CATCH10 code (Claude Code, Gil's Mac) — PUSHED TO MAIN 2026-11-04 on Gil's word; worker `/catch` DEPLOYED first (RevLimiter `f33d350`, stamp commit `2f6cc5e`)

Claim: CLOSED 2026-11-04. Files: `tools/gas2page/integration.mjs` (siteBar), `src/components/Cart.astro` (`?cart=open`),
`tools/_gas2-scene/page-b.html` (the coupon ticket), `tools/_gas2-scene/drone/README.md`, this entry.
- Gil: /gas2 had no way out but a download -> the site's real top bar on page-b and the postcards: taken at build (and per
  dev request) from the built `/terms/` page with its stylesheets, inside a shadow root (no CSS either way); its cart
  button goes to `/?cart=open`.
- Gil: CATCH10 was one shared code -> everyone gets one, once. The ticket asks for an email; the worker's `/catch` mints
  `CATCH10` + 6 (10%, site-wide, one use, 60 days), ONE per email ever, emailed only. Tests: `test/test_catch.mjs`.
- Open: archive the shared `CATCH10` discount in Paddle (Gil).

## 2026-11-03 — Home TV polish: thumbnails whole, a real hover, edges, the phone's top, the blurb's glow (Claude Code `danavivi-a4 [76d06a]`, Dan's Mac) — PUSHED TO MAIN 2026-11-04 on Dan's word "push to main" (fast-forward from `feat/tv-polish`)

Claim: CLOSED 2026-11-04 `danavivi-a4`. Files: `src/components/WordWall.astro` (CSS + the thumbnail markup), `tasks/handoff.md` (this entry).
Dan, 2026-11-03 ("polish the LCD" = the home TV): the phone's empty top, the description glowing on the glass, the tight
laptop edges, every plugin shown whole in the list (Radio Roulette was cropped, GAS had black bars left and right) and
a hover that shows (GAS 2 "is not hovering": measured, every row's hover only brightened the outline).
- Built (`WordWall.astro`): thumbnails = the whole plugin (a wide window fills the 16:10 slot's width, a tall one
  its height via `--ww-thumb-col / 1.6`: a percent height did not resolve there), the edge + glow on the picture,
  GAS / Radio Roulette clipped to their bezel arcs; hover = the picture scales 1.06 with a hot edge, the name glows
  with a 40 % fill (lit stays filled); the blurb on the screen takes the channel tint + glow; side padding clears
  the bezel by `--ww-breath-x` (new `--ww-out` = .ww's edge from the screen's, also used by `--ww-frame-cap`);
  phones: the menu at the top, thumbnails 6rem, the rows spaced over the glass, one slot per plugin
  (`--ww-rows`) so a 2-plugin category keeps the ALL spacing. `DESIGN.md` §4 TV list: the rule.
- Checks (local dev, Playwright Chrome + WebKit): content to glass 22 / 23 px at 1141x636 (was 7 / 8), 28 at
  1440x900 (was 14), 12 on phones (was 4); the TV still fits one screen at 1141x636, 1280x720, 1440x900,
  1920x1080, 390x844, 375x667, 360x740, 430x932; no horizontal scroll, no page errors; no name hits its price
  on phones; `?cat=free` checked on phone + laptop. `npm run build` green (31 pages). Not checked: a real
  iPhone / Safari window, high-contrast mode.
- GAS 2 FLOATING (Dan 2026-11-04: "I want gas2 to actually be hovering like in the real plugin" = the plugin's
  default FLOATING look, not a mouse hover): new `src/assets/plugins/gas2-float.png` (896x1683 RGBA) replaces
  `gas2-hero.jpg` on the TV only (plugins.ts + review.astro keep the jpg). Made from the real page, GAS2 `main`
  `52668ab`: serve `GAS2/Source/ui/public`, Playwright 440x800 at DPR 2, add `html.rv-float`, clear the page
  background, `GAS2.hose(true)` (the hose faded along its length), `omitBackground` shot; then the house FLOATING
  shadow baked under it with PIL (53 deg; far 30 / sigma 24 / .50, contact 5 / 4 / .55; rgb(12,9,6); scale 2),
  cropped at alpha > 3. `WINDOWS.gas2.float` -> `.is-float` on the thumb and the panel: no edge ring, no corner
  clip, no box shadow. Checks: 1141x636, 1440x900, 390x844 (list + panel) fit one screen, no page errors; the
  built webp cuts keep alpha; `npm run build` green.
- Next: nothing owed. Not checked: a real iPhone / Safari window, high-contrast mode.

## 2026-11-03 — Review form: text gate on every open box + role multi-select (Claude Code, laptop 2) — worker DEPLOYED 2026-11-03 (stamp ad6d9f5, live probe: weak caught, 2 roles OK); site PUSHED TO MAIN on Yoni's "push" 2026-11-03 = LIVE

Claim: CLOSED 2026-11-03. Files: `src/data/review-survey.ts`, `src/pages/review.astro`, `tasks/handoff.md` (this entry).
- Yoni: every open text box gets the DRIFT beta form's "does this make sense" gate; "Your main role" allows several picks.
- Done: worker (RevLimiter repo `ad6d9f5`, deployed, stamp commit `c70614a`) judges every filled box with `driftFbTextOk` and
  answers `{error:"incomplete", weak:[ids]}`; the gate itself got stricter (keyboard-row runs of 5, 5+ letter words with
  no vowel, one word 3x). Page: `role` = multi; a `weak` reply lights the boxes (a follow-up lights its question) +
  `ui.weak` message.
- Order used (and why): worker deployed FIRST via the gated `deploy.ps1` (never bare `wrangler deploy`), then the site
  pushed. The old worker read `role` as a single pick, so the new page's list would have come back "unanswered"; the
  new worker still takes an old page's lone string.
- Checks: `node test/test_review.mjs` all pass (19 new gate checks), `test_drift_feedback.mjs` ALL PASS, 16 real
  sentences + 9 plugin names not rejected; build green; Chromium: two roles post as a list, a mocked weak reply lights
  `q-install_result` + `q-loved_most` with the message. Live: POST /review with gibberish -> `weak:["loved_most"]`,
  nothing minted; revaudio.net/review/ (incl. the CF-cached copy) serves role checkboxes + the weak message.
- Gotcha: the push's head commit carried `[skip ci]`, so Pages skipped the whole push; deployed by hand with
  `gh workflow run deploy.yml --ref main` (run 41677977988, success). Never end a site push on a `[skip ci]` commit.
- Unverified: no real person has sent a full review through the live page since (only the worker probe + the local
  mocked browser run). The DRIFT feedback form shares `driftFbTextOk`, so it got the stricter gate too (tests pass).
- Cleanup (laptop 2): `C:\RevAudio\Plugins\RevLimiter-reviewgate` = half-removed worktree leftover (Windows lock), safe to
  delete; `C:\RevAudio\Plugins\RevLimiter-deploy` = worktree on branch `deploy-review-gate` (= origin/main `c70614a`),
  remove with `git -C C:/RevAudio/Plugins/RevLimiter worktree remove ../RevLimiter-deploy` + `git branch -d deploy-review-gate`.
  A local `astro preview` may still listen on port 4391 (PID 45496): `Stop-Process -Id 45496`.
- GAS 2 added to the review picker (Yoni 2026-11-03: released tomorrow, 2026-11-04): `REVIEW_PLUGINS` + the home TV's
  picture and channel colour (14 / 58); picker 5 across, on phones the 5th cube centred under the 2x2. Free = no price
  question. Worker `70c074b` DEPLOYED 2026-11-03 (stamp commit `03b189d`; live probe: a `gas2` review reaches the text gate,
nothing minted). Checked locally at 1280x800 + 390x844 (no
  sideways scroll; picking GAS 2 opens the form named GAS 2, price question hidden). Deploy the worker BEFORE pushing the
  site: the live worker answered `gas2` with "bad request". Site PUSHED TO MAIN on Yoni's "push" 2026-11-03 = LIVE.
- RevLimiter repo `tasks/handoff.md` NOT updated: the main checkout holds another session's uncommitted edit of it;
  this entry is the record for the worker change.

## 2026-11-03 — GAS + GAS 2 free downloads: the marketing box is REQUIRED (Claude Code, Gil's Mac) — PUSHED TO MAIN on Gil's word "push to main"

- Gil: "I want that checkbox to be mandatory in order to download Gas and Gas 2 both from the LCD and from the product pages".
- TrialGateModal: a free download (`data-gate-free` = GAS, GAS 2: the TV + /gas) makes the box required, label without
  "(optional)"; unticked = "Tick the box to get your download.", nothing posted. Paid trials unchanged (optional).
  /gas2 laptop ticket: `required` (the browser's check, as Terms); /gas2 phone postcard: its own check + error line.
  Dan's files (`page-b.html`, `postcards.html`) touched only on those lines.
- Not changed: /downloads (still optional there; Gil to say). The worker's MARKETING_CONSENT_TEXT still stores
  "... (optional)" (RevLimiter repo, not touched). Gil told: GDPR treats consent made a condition of a download as not
  freely given (EU leads' marketing consent is weak); his call.
- Checks: build green; Chromium, worker stubbed: unticked = 0 posts on all 3 forms, ticked = marketing:true; RevLimiter
  trial still posts unticked.

## 2026-11-03 — GAS 2 on the site: downloads card, home TV, Dan's page at /gas2 (Claude Code, Gil's Mac) — PUSHED TO MAIN on Gil's word "push and deploy to main"

- Gil: GAS 2 as a card on /downloads and on the home TV (All, its categories), each linking to Dan's GAS 2 page.
- Done: `plugins.ts` gas2 entry (free, worker id `gas2`, TV copy, cats Mastering + Saturation + Free; picture = the
  GAS 2 manual's pump, `src/assets/plugins/gas2-hero.jpg`). TV order (Gil): RevLimiter, GAS, GAS 2, DRIFT, Radio
  Roulette. /downloads: the card + a "<plugin> page" link in the download box. `tools/gas2page/integration.mjs` serves
  `tools/_gas2-scene` at /gas2/ (page-b on a laptop, postcards under 760 px), copied at build: the scene stays the one
  source; edits there go live with the next deploy. The Review page's picker lists GAS 2 too (same TV list).
- Checks: build green; Chromium 1280x665 + 390x844: TV, each category's order, /downloads, /gas2/ (laptop + phone), no
  page errors.
- Open (from todo "GAS 2 on the front page" step 4, live as of this push): CATCH10 not confirmed in Paddle (the drone
  intro's car hands it out); the pump click opens a 127.0.0.1:4461 iframe (nothing on the web); page weight ~21 MB
  (audio lazy); Safari <= 15 breaks the scene (no cqw).

## 2026-11-03 — Review page: RevBeta becomes "Review" (any plugin, 1-10 rating, 10% code by email) (Claude Code `revaudio-63 [975b3a]`, laptop 2) — ON MAIN + LIVE (pushed 2026-11-03 on Yoni's "push", fast-forward from `feat/review`); worker `/review` LIVE since 2026-11-03 (deployed)

Claim: CLOSED 2026-11-03 (`revaudio-63`). Files: `src/pages/review.astro` (new), `src/data/review-survey.ts` (new), `src/data/site.ts` (`review` block), `src/components/Footer.astro` (RevBeta -> Review), `src/components/WelcomeDiscountPopup.astro` + `ExitIntentPopup.astro` (skip `/review`), `src/assets/plugins/radioroulette-hero-cut.png` (new), `DESIGN.md` (Review picker entry), `src/pages/beta.astro` (now a hop to /review), `src/components/legal/PrivacyContent.astro` + `src/data/legal.ts` (reviews named, 2026-11-03), `astro.config.mjs` (NOINDEX /review/), `tasks/handoff.md` (this entry).
- User (Yoni): footer Products > RevBeta becomes Review; first pick the plugin (RevLimiter, DRIFT, Radio Roulette, GAS; more later); the RevLimiter beta skeleton stays, questions made general; last question = a 1-10 rating; finishing emails a 10% site-wide code.
- Decisions (Yoni 2026-11-03): ONE code per email EVER; code expires after 60 days; build a local mockup first (this branch, worker not wired).
- Plan: page first (local preview only), then a `/review` route in the licence worker (copy of `/drift-feedback`: check answers, one code per email ever, Paddle 10% single use, 60 days, email the code + a summary to info@, store in KV), then `/beta` -> `/review` redirect. Push / deploy only on the user's word.
- Done (mockup, 2026-11-03): `/review` = plugin picker (the 4 TV plugins, names via `tvName`) -> 8 sections, 25 questions, 14 required (15 for a priced plugin: the price question shows only for RevLimiter $49 / Radio Roulette $19), 1-10 "rev bar" rating (9-10 red = REDLINE), email + optional news opt-in, sticky progress strip, "Check your inbox" end screen. `site.review.workerUrl = ''` = preview mode (end screen + "nothing was sent", no POST). Both 10% popups skip `/review` (they opened over the form). Payload: `{survey_version, plugin, newsletter, user_agent, email, <question ids>}`.
- Checks: `astro build` green (`/review/index.html`); Playwright 1280x800 + 390x844: picker, reveals, "No bugs" clears other bugs, GAS/DRIFT hide the price question, progress counts, submit -> end screen, no sideways scroll on the phone.
- Found, not fixed (old page): `/beta` uses `.vh` and `.tag.opt` but no global `.vh` exists, so its radios may show and its OPTIONAL tag gets the pill style. `/beta` is retired by the redirect, so left alone.
- Round 2 (Yoni 2026-11-03): no small "Review" kicker (page opens on the big title); the picker = the home TV (bezel, phosphor glass tinted by the picked plugin's TV channel hue via `:has()`, scanlines, outlined stencil names that fill + glow when lit; WordWall.astro's tokens); names only (type words gone); pictures whole at their own aspect in one box height (checked: rendered ratio = natural ratio for all 4); submit = the house `rv-btn rv-btn--lg` ("Send my review"), the old RevLimiter image plate gone. Checked 1280x800 + 390x844.
- Round 3 (Yoni 2026-11-03: hover changes colour + glitch, "the exact behaviour including the panels and all"; RR "crop it precisely"): the picker IS the home TV, `<WordWall mode="review" />` (all changes behind `data-ww-mode="review"`, home byte-identical in behaviour: checked cats 7, Try 4, Product page 4, RR original + radius). Hover (mouse, laptop) lights after 70 ms; click on a row or "Review <plugin>" fires `ww:review`; the form card shows only after a pick, its strip has "Change" (back to the TV). RR cut: `radioroulette-hero-cut.png` (2523x1369), superellipse corners fitted to the chrome (top R 163/152 n 1.86/1.84, rms < 1 px; bottom R 416/400 n ~5), 1.5 px inset, no fringe at 100 %. Scripts: session scratchpad `rr_cut3.py` (not in the repo). Checked 1280x800 (hover DRIFT -> purple + panel, RR panel clean, Review -> form with $19 question) + 390x844 (list, tap -> pane + Review), build green.
- Round 4 (Yoni 2026-11-03: the TV is "too much like the actual store", "simple cubes", "no descriptions just the plugin names"): the TV review mode is gone (`WordWall.astro` back to main, `git diff origin/main` empty). Picker = 4 square cubes (2x2 on phones) in the card: picture whole + name; hover fades in the plugin's channel colour (TV numbers) + a one-shot glitch (`cube-jump` / `cube-flicker` / `cube-roll`, off under reduced motion); picked = lit + filled name. RR uses the cut PNG. Checked 1280x800 + 390x844 (rendered ratio = natural for all 4, animations run on hover), build green.
- Round 5 (Yoni 2026-11-03: "perfect, continue building"): WIRED. `site.review.workerUrl` = the licence worker's `/review` (RevLimiter branch `review-worker` `23d6dd3`, NOT deployed: see the RevLimiter handoff claim). The page handles every answer: sent / pending ("code shortly") / had_code ("one per email, no new code") / already_reviewed / incomplete (marks the ids) / a worker sentence. `/beta` = a bare hop to `/review/` (query kept, like /store); `site.betaFeedback` removed (only the old beta page used it; RevBeta answers stay in the revlimiter-beta worker's D1). Privacy: reviews + the emailed code named, retention line, PRIVACY_LAST_UPDATED 2026-11-03. `/review/` in NOINDEX (sitemap 0 hits).
  - Checks: the page's real payload (captured in the browser, every question type incl. Other / follow-ups / N/A / news tick) through the worker's real handler locally: `{ok:true,sent:true}`, team mail with every answer, code mail, news relay, 3 KV keys. Page replies tested in the browser (already / incomplete -> q-os + q-vs_goto marked / rate sentence / busy -> generic / had_code end screen). `/beta?utm_source=invite` -> `/review/?utm_source=invite`. Build green.
  - GO-LIVE ORDER: (1) DONE 2026-11-03 (Yoni: "deploy"): worker `/review` LIVE, stamp `da4a8a0 @ 2026-11-03T09:11:56Z`, version `c88934c4`, live probes OK (RevLimiter handoff); (2) DONE 2026-11-03 (Yoni: "push"): `feat/review` fast-forwarded to main (Pages deploy); (3) DONE 2026-11-03: Yoni's real review from info@revaudio.net (Radio Roulette): code mail + team mail arrived ("it works"); the test code `REVIEWJ7B2UE` (`dsc_01m6gbx0nemcd0bdct3spmg6s6`) archived in Paddle by Yoni. KV `reviewcode:info@revaudio.net` stays (info@ used its one code: a re-test from info@ gets no code).
- Next: Yoni's look/questions round on the preview -> worker `/review` route -> wire `workerUrl` -> `/beta` redirect -> push on the user's word.
## 2026-11-02 — BF/CM 2026 skins (Claude Code, Gil's Mac) — PUSHED TO MAIN 2026-11-04 on Gil's word (squash of `feat/bfcm-skins`); dormant until Nov 20 00:00 PT

- Home = Dan's TV-first page (`bcb00b0`), unchanged. The hero came back for a while on this branch and is out again
  (Gil: a new header is in the works; the skins don't depend on it). DESIGN.md §7 = TV-first.
- Skins switch on by themselves from `src/data/sale.ts` (US Pacific). Dev preview: `?sale=soon|bf|cm|off`.
  - `SaleStrip.astro` (BaseLayout): the bar over the nav via `--sale-h` (WordWall's `--ww-nav` adds it).
    soon = "Black Friday in" countdown, home page only, Nov 20 00:00 PT until BF; bf = Nov 27 to Nov 30;
    cm = Nov 30 to Dec 1. On an open page the bar swaps at midnight PT, no reload.
  - `SaleIntro.astro` (BaseLayout): home loads only, once per phase per browser (every load in a preview): the TV
    (WordWall's cabinet roll 2) flies in, powers on, the offer comes up in the TV's type; X / Esc / outside click /
    "See the plugins" powers it off onto the TV.
  - `SaleTransition.astro` (BaseLayout): BF door, CM boot between pages.
  - Checked with Playwright's clock: soon -> bf at 00:00 PT Nov 27 on an open page; cm -> off at Dec 1; nothing Nov 19;
    no countdown bar off the home page.
- `/plugins` (Gil): the same TV-only page at its own address (made while home had the hero; kept for the new header).
  Header PLUGINS, footer, cart, product breadcrumb, GAS fallback, `/store` redirect and the sale's links point there.
- Open: codes `REDLINE` / `CYBER40` are placeholders (plan decision 7); no Paddle bundle product yet (the bundle line
  points at `/plugins`); OBDTune leaves `saleBundlePlugins` on Nov 22 if not released.
- Push to main = live deploy: waits for the user's word.

## 2026-11-02 — Footer: categories fold into drawers (Claude Code `revaudio-3b [a4cb6d]`, laptop 2) — ON MAIN + LIVE: merged `--no-ff` 2026-11-02 by Claude Code `revaudio-0c [571e5c]` (laptop 1) on Dan's word "push it to main and merge" (Yoni had approved by pushing the branch)

Claim: CLOSED 2026-11-02 (`revaudio-3b`'s work merged by `revaudio-0c`; a fine-tune round writes a new claim). Files: `src/components/Footer.astro`, `src/styles/global.css` (footer block), `src/components/drift/DriftStickyBar.astro` (phone footer rule), `tasks/handoff.md` (this entry).
- User (Yoni): footer shows only PRODUCTS / SUPPORT / COMPANY / LEGAL; a press opens that category's links in a folding
  menu in the style of Radio Roulette's favourites drawer; categories tight on the bottom, no wasted space.
- Done: one flat row of 4 heading buttons (aria-expanded/aria-controls) + a drawer each. Drawer = RR `#favList` copied
  (dark lacquer gradient, glass rim at 55 %, rotateX hinge, cubic-bezier(.34,1.35,.64,1) 0.34 s settle, brass chevron,
  brass divider before HIGH CONTRAST), turned upside down: hinged at its bottom edge, it flips UP (footer = page end).
  One open at a time; closes on 2nd press, outside press, Escape (focus back), a link press, focus leaving. No JS =
  lists open in place (`.is-folding` is added by the script). HC skin + reduced motion covered. Phone: all 4 on one row
  (Yoni), smaller type at <=560 and again at <=400; the right pair's drawers open leftward. Footer: desktop 140 px
  (was ~500), phone 205-221 px (was a full screen).
- Checks: `astro build` green; Playwright Chrome 1440x800 / 390x844 / 360x740: every drawer inside the viewport, no
  horizontal scroll, Escape closes, no page errors.
- Yoni said yes: Dan's 2026-10-06 phone rule (footer min-height = one screen) is dropped in global.css AND its copy in
  DriftStickyBar.astro (/drift). Dan told at merge time (2026-11-02).
- Merge check (laptop 1, 2026-11-02): `npm run build` green on the merge result before the push. Pushed `4067c58..744b240`;
  Deploy run 41480191165 = success, Smoke test 41480191052 = success; live revaudio.net HTML carries
  `footer-drawer-0..3`. Not done: phone/desktop eyeball of the live footer; branch `feat/footer-drawers` kept on origin
  (delete only on the user's word; its worktree is on laptop 2).
- Loose end (not this session's): untracked root `HANDOFF.md` in the laptop 1 clone = a 2026-09-06 `/gas` session note
  ("fold into tasks/handoff.md or delete once read"); left untouched, the user decides.
- Open for fine-tune: drawer direction (up) and speed.

## 2026-11-02 — Home: TV first, old hero + closing trial section out (Claude Code `revaudio-3d [bbecad]`, laptop 1) — ON MAIN + LIVE (pushed 2026-11-02 on the user's word "Push to main commit and deploy")

Claim: CLOSED 2026-11-02 `revaudio-3d` (laptop 1). Handed to the user's Mac session for the polish round below:
that session writes its own claim (name from ListAgents) here before editing. Files touched: `src/pages/index.astro`,
`DESIGN.md` (§7), `tasks/handoff.md`.
- User: the gauge hero ("Engineered, Then Tuned.") and the closing "Hear it on your own mix" section are the old
  site; remove both, so the TV is the first thing on screen. Polish comes next.
- Done: `index.astro` = sr-only h1 + WordWall + DAWStrip + Testimonial + PressLogos + EmailCapture. The hero
  markup, its GSAP script, its CSS, the hero-wall preloads and the closing CTA are gone. Kept on disk (unused by the
  page now): `src/assets/hero/*`, `src/lib/gauge-geometry.ts`, `bench/hero-text-bench.html`,
  `revedit.overrides.json` hero entries. `global.css` `.hero` stays (product pages).
- Checks (astro preview, Chromium, 1280x665 + 390x844): build green (30 pages); TV top = nav bottom (41 / 58 px),
  TV = exactly one screen; one h1; no console errors except the CF beacon CORS on localhost; a small wheel scroll is
  not pulled back; `/#plugins` from `/revlimiter` parks the TV under the nav.
- Pushed to main (fast-forward) on the user's word, 2026-11-02; the Pages deploy carries it live. Phone and laptop are the same page.
- NEXT (Mac, polish round; the user picks the order, nothing decided yet). Pointers, laptop 1 checks of 2026-11-02:
  1. Phone: the TV is one screen tall (`.ww[data-ww-bg='screen']` min-height 100svh, `align-content: center`,
     `WordWall.astro` ~line 2006), and the phone list is shorter than that, so a big empty band sits above
     "PICK A CATEGORY" (and below the list). Seen live at 390x844.
  2. Cookie banner (`CookieBanner.astro`, `position: fixed; bottom: 0`) covers the TV's lower part on a first visit,
     laptop and phone. It used to sit over the hero.
  3. The TV's frame (bezel) art waits for the window load event (`WordWall.astro` ~line 381: "not before the page's
     own load ... must not race the top"), written when the TV sat below the hero. It IS the top now, so the first
     ~0.5 s shows the TV without its bezel (the CRT power-on now fires on load too).
  Rules: website = `wiki website`; a push to main is a live deploy (only on the user's word; `[skip ci]` in the
  pushed HEAD's message for a docs-only push). Verify each change at 1280x665 and 390x844 before asking to push.

## 2026-11-02 — Junk Formspree sign-ups closed: no Formspree URL in any page, every form posts to the license worker (Claude Code `revaudio-a3 [e27bc5]`, laptop 2) — LIVE + CLAIM CLOSED 2026-11-02 (old forms disabled; new forms: spam filter OFF, Workflow emails info@; real-shape test mails for both arrived)
- User (Yoni): Formspree "New submission on RevAudio Newsletter" mails at info@ with an EMPTY email, source `drift-trial`, "submitted a form on null". Asked for mandatory fields; picked the server-side block instead (no new fields).
- Cause: the 7 sign-up forms' no-JS `action` printed `formspree.io/f/maqzlgwa` (affiliate: `mykrwolg`). A script posted straight to it (no Referer = "null", empty email): our worker never saw it.
- Site (this repo, commit after this entry): every sign-up + the affiliate form `action` = `<worker>/form-once?form=newsletter|affiliate`; `site.ts` lost `formspreeEndpoint`, `affiliateFormEndpoint`, `driftFeedbackFormEndpoint` (feedback page `wired: true`). Build: 0 `formspree.io` in dist, 12 form actions on the worker.
- Worker (RevLimiter repo, `tools/RevLicenseKeygen/gumroad-worker`): `/form-once` requires the site's Origin, a stricter address check, accepts no-JS urlencoded posts (answers with a page + back link), adds `_subject` (`Sign-up · drift-trial · /drift/ · a@b.com`) + `page`; Formspree ids from secrets `FORMSPREE_NEWSLETTER` / `_AFFILIATE` / `_DRIFT_FB`, old public ids as fallback. New `test/test_form_once.mjs` (all pass), all 21 suites pass; `email_snapshot --check` shows only the dl.* diffs that were there before.
- Wiki: `website-update.md` + `secrets-rotation.md` (shared).
- Follow-ups (not started, Yoni's call): (a) rotate DRIFT feedback's Formspree id `xgaowgkb` the same way (secret FORMSPREE_DRIFT_FB; new form needs Workflow email to info@ + spam filter OFF); (b) licence worker BUILD_MAP `gas2-win` says `GAS2_Windows.exe` but serves `releases/gas2-win/GAS2_Windows.exe` -> deploy.ps1 ends in FAIL until the map is fixed + redeployed (downloads work). All pushed at rv close.
- Git audit at close (not mine, left alone): RevLimiter `tasks/handoff.md` has a 1-line uncommitted edit (GAS 1 thread line) from an earlier session; laptop 2's shared clone is 91 behind origin with other sessions' uncommitted files, so it was not pulled (this session's wiki commits went out from a temp worktree off origin/main).
- Go-live order: (1) worker `deploy.ps1` on Yoni's "deploy" — DONE 2026-11-02, stamp `bcd1c90`, version `addd84d4`; live probes OK (no Origin / empty / "EMAIL" refused, no-JS 400 page, preflight 204; nothing relayed); board FAIL = gas2-win served from its /pit-lane key vs BUILD_MAP name, not from this change — (2) site push on "push" (3) Yoni makes 2 new Formspree forms -> `wrangler secret put FORMSPREE_NEWSLETTER` / `FORMSPREE_AFFILIATE` — DONE 2026-11-02 (site push live, deploy run 41403220344; secrets set; one TEST relay each via the worker returned ok: info+formtest-nl@ / info+formtest-af@) (4) only then disable the old 2 forms in Formspree (before step 3 = every sign-up fails).

## 2026-11-01 — GAS 2 player: Yoni's new renders, all 4 stations level-matched at -16 LUFS (Claude Code `revaudio-b5 [44f41c]`, laptop 2) — ON MAIN `a447d82` (fast-forward 2026-11-01, Yoni: "push it to the page so dan can see it"; tools/ is not in the Astro build, so nothing changed on the live site)
- User (Yoni): new renders in `Downloads/Gas player` (bypass + gas2 per station: hip hop, pop, electronic, rock), "update - level match all".
- `player/tools/prep_audio.py` per station (alignment lag 0 on all 4). Each pair matched to the same LUFS, then one shared
  target for every station. TARGET -11 -> -16 LUFS: the hip hop bypass render peaks -0.16 dBFS at -15 LUFS, so -16 is the
  loudest all 4 reach under the -1 dBFS ceiling without a limiter. Encoded m4a measured (ffmpeg ebur128): all 8 files
  I = -16.0 LUFS, true peak <= -1.2 dBFS. The page now plays ~5 dB quieter than the 10-23 files.
- ELECTRONIC gets real files (was the placeholder): `radio.js` PH + `placeholder_*.m4a` removed. The phone page's HEAR IT
  card plays the hip hop pair, so it follows.
- HIP HOP settings caption removed (Yoni 2026-11-01: "no need for the settings"); no station prints GAS 2 settings now.

## 2026-10-15 — Home LIBRARY: the TV becomes the plugin browser, carousel + Store nav out, branch `feat/home-library` (Claude Code `revaudio-a0`, was `revaudio-a6` before a restart, laptop 1) — PUSHED TO MAIN = LIVE 2026-11-01 (the user: "push"; main `2eea1f2` -> `3a19a87`, a fast-forward)
- User: one new branch for the home page; a top-right LIBRARY button opens plugin categories on the TV; a category
  turns the glowing words into plugin names + thumbnails; a lit plugin shows a bigger image, a short description,
  "Try it free" (email gate) and a small product-page link; carousel + Store go; later ratings + "you may also like".
- Worktree `.claude/worktrees/home-library` off origin/main 697f49d; origin/main ddada3d (the TV weight work, live
  2026-10-18) merged in 2026-10-18 before any source edit (node_modules = junction to the main clone's).
- Plan + research + decisions: `tasks/home-library-plan.md`. User took all four recommended options (D1 button =
  PLUGINS, D2 categories always visible inside the TV, D3 `/store` redirects to the home TV, D4 ratings = verified
  users only, own branch after this one). Go: 2026-10-18.
- `revaudio-32`'s claim on `src/components/WordWall.astro` is CLOSED (2026-10-15, entry below), so phase 2 is clear.
- Done (local commits on the branch, NOT pushed): phase 1 = the catalog data (`5b44750`); phase 2 = the TV is the
  library (WordWall rewritten: categories, stencil names + thumbnails, the lit plugin's pane with price + Try + Product
  page, URL state `?cat=` / `?plugin=`, phone panes, tabs; the carousel off home; wwbench + DESIGN.md rewritten;
  `wordwallDrift.ts` deleted). Checked in Chromium + WebKit at 9 sizes (plan, Phase 2). Phase 3 (2026-10-18): the
  header's lit PLUGINS chip (Store's slot; on phones beside the burger), every `/#plugins` link on home glides to the
  TV where the lock parks it, `/store` = a bare redirect page to `/#plugins` (query kept, noindex), links re-pointed,
  the store FAQ on `/support` ("Before you buy"), smoke tests reworked; PluginShowcase, DriftCard and PluginCard
  deleted. Phase 4 (verify, automated) done: sizes, landing, lock, gate ids, analytics (the Meta pixel sent a
  PageView per TV click: `fbq.disablePushState = true` now). Phase 4b (`9c828c6`): the user's bench pick baked (list
  50 %, names 4.5rem, thumbs 6.9rem, glow 1.37, scanlines .42); GAS's tall window yields to its text below ~1280
  (`--ww-side-min`), so 1141x636 fits again. Phase 4c (the commit after it): the channel change reworked (user: "the
  static isn't good"): a cut under analog snow in the new picture's own box, then a lock-in; tunable in the bench
  (`--ww-chg-*`, ▶ CHANNEL / SLOW ×4 / AUTO; reload the bench first). Checks in the plan (Phases 3-4c). Then the
  user: no noise at all, motion only. Phase 4d (UX + brand lens agents: TUNE vs GEAR CHANGE on one engine): the
  noise is gone and both motions ran on one GSAP sequencer behind the bench's MOTION switch. 2026-10-19 (step 3):
  the user looked at TUNE and found "appears, then slides" + "a different direction for each plugin" odd, and wanted
  it shorter; so GEAR CHANGE is gone and the one motion is smaller, shorter and always the same way (fade and travel
  as one tween, 12 px / 340 ms, ~0.55 s click to rest; `--ww-mv-*`; the bench's RISE / DROP picks the way): commits
  `63841e4` + `0431ee7` (the control runs), local only; the shared wiki rule `a953ccb` went out with another
  session's push of revaudio-shared (on origin/main, checked 2026-10-19). Checks + controls in the plan.
  A fresh bench window was opened on the Samsung 2026-10-19 (any older bench tab shares `wwbench:v1`: close it).
  Step 3b, same day (the user, after a look on the phone: the reading suffered "because of the pixels"): the
  scanlines + grille moved onto the glass, under the text and the pictures (the user's pick A of a comparison
  sheet); the commit after `efe6643`, the shared rule in the shared commit after `a953ccb` (design-language Law 5).
  Phase 4e, same day (the user: "a small glitch now and then ... to show it's alive", then "also during the
  channel change"; all the recommended picks): the TV glitches by itself, one at a time every 12-25 s once left
  alone 4 s (an unlit name jumps 3 px with a red / cyan fringe, a band of the picture tears on a canvas laid over
  it, the screen flickers or rolls a band of light), never on what is read or what the pointer / focus is on, off
  under reduced motion / high contrast / the wood wall / a hidden tab / off screen / before the power-on; about one
  change in three lands with a short tear once the picture is in place. Bench: a Glitch group (8 sliders) + ▶ NAME
  / PICTURE / SCREEN (reload the bench first). Commits `1ce4007` + the one after it (the advisor review: the wait
  starts over once the TV is on show, so a visitor gliding in never gets one as the tube lights; a change tears
  only once the tube is lit); the shared design-language §3 exception is shared `e8f10a4`; all local. Checks +
  controls in the plan (Phase 4e).
  A LAN preview of the build is up for the phone (`astro preview --host 0.0.0.0 --port 4393`, PID 70616,
  http://10.0.0.103:4393/, the laptop on "Kitchen_studio__EXT"; the build re-run after phase 4e); stop it by PID
  after the phone check (the Wi-Fi is a Public profile). Next: the user's look (the phone, the bench: RISE vs DROP,
  the glitches), COPY SETTINGS + "apply ww bench" if anything changes, the build checks (step 4), the phone
  slow-network fix if OKed (step 4b), the user's look (iPhone / Mac Safari), then "push".
- Session close 2026-10-19 (`revaudio-a0`, laptop 1). State: `feat/home-library` clean in the worktree, local only
  (no origin branch), 24 commits ahead of origin/main and 39 behind. This session's commits: `63841e4`, `0431ee7`,
  `efe6643` (4d step 3), `706efa0` (3b), `1ce4007` + `9ca613b` (4e). revaudio-shared: `4cfa2b6` (Law 5) + `e8f10a4`
  (§3 exception) local, the clone 3 ahead / 0 behind origin/main (the third is another session's `50e39a6`, Yoni's
  DRIFT email: it goes out with any push). Nothing of this session's is uncommitted besides this entry and
  lessons.md #7 (the shared clone's modified / untracked files are other sessions').
  - Unverified: the user has not looked at 4d step 3 (RISE vs DROP), 3b or 4e yet (last signal: the glitch plan
    approved); WebKit's motioncheck first-frame checks failed under load (lessons.md 2026-10-19 #7; the old code
    failed the same), owed on an idle machine with step 4; iPhone / Mac Safari never seen.
  - Running on laptop 1: `astro dev --port 4392 --host 127.0.0.1` (the bench, http://127.0.0.1:4392/__wwbench),
    PID 55744, stop with `Stop-Process -Id 55744`; `astro preview --host 0.0.0.0 --port 4393` (the phone link
    http://10.0.0.103:4393/, serves the 17:36 build of `9ca613b`), PID 70616, Public Wi-Fi profile: stop it after
    the phone check with `Stop-Process -Id 70616`.
  - Next session decides: (1) the user's look: the phone (reload the link), the bench (Ctrl+R; RISE vs DROP;
    ▶ NAME / PICTURE / SCREEN; "On a channel change" at 1 + ▶ CHANNEL; SLOW x4), COPY SETTINGS + "apply ww bench"
    if anything changes; (2) step 4b (the phone's slow network) needs the user's OK; (3) BEFORE "push": merge
    origin/main into the branch by hand (one merge, merge-base `141d400`, 39 commits). 13 files changed on both
    sides: DESIGN.md, Cart, CookieBanner, MobileBuyBar, WordWall, `src/data/plugins.ts`, `[slug]`, gas, index,
    store/index, tasks/handoff.md, and PluginCard + PluginShowcase (deleted here, edited on main: keep them
    deleted). Main's `0ab2c4b` (Dan 2026-10-18: one button family, `src/styles/buttons.css` `.rv-btn`, "every
    regular action button uses it") is not on the branch, and the TV's Try / Product page keys don't use it: ask
    the user whether they join the family or stay part of the object (like the audio toys) before porting. Then
    re-run the checks + build, then "push" (= live); (4) step 4 (the build checks, filmed) + iPhone / Mac Safari.
  - The check scripts live only in this session's scratchpad on laptop 1:
    `C:\Users\shlik\AppData\Local\Temp\claude\c--Revaudio\74573275-0f44-45db-97c3-a134cca05d4d\scratchpad\`
    (`glitchcheck.mjs`, `motioncheck.mjs`, `glowcheck.mjs`, `readcheck.mjs`, `benchsmoke.mjs`, `slowphone.mjs`); a
    new session gets another scratchpad, so copy them from there (or into the repo if the user wants them kept).
- Session 2026-11-01 (Claude Code `revaudio-b5`, laptop 1). Phase 5 "the TV sells" planned, persona-tested and
  decided; the menu line + the reading picked on the bench and baked. The whole record is in
  `tasks/home-library-plan.md` § Phase 5 (steps 0-13, the persona round, the user's decisions, "The menu line and
  the reading"); persona reports in `tasks/evidence/persona-qa-2026-11-01/`. The user wanted another session to see
  the work, so the branch went to origin as `feat/home-library` (a branch only: main and the live site untouched).
  - Commits: `f123ab9` (plan + persona round), `2e8828b` (the user's decisions: glitch = lit name + blurb, rarely; a
    REQUIRED terms box; D5 = B; extras 8 + 9 in, 10 + 11 out), `e317518` + `e6afc0a` (three menu looks + three
    readings on `/__wwbench`), `8005bb3` (those switches retired), `573fa7b` (the pick baked: menu C "PICK A
    CATEGORY ▸" channel guide + reading A tinted Inter + eight values; the thumbnail now fits the room's height),
    `f1162a4` (the ▸ blinks four times as the tube lights, then holds: WCAG 2.2.2). a0's close note above went in as
    `936e91e` on the user's word.
  - Checked: one screen at 1141x636, 1280x665, 1366x657, 1440x900, 1536x730, 1728x1000 + four phones with DRIFT,
    RevLimiter, GAS lit; no-JS title; `npm run build` green; `tests/smoke.spec.ts` chromium 21/21 (twice).
  - Next (each waits for the user's word): "go" for Phase 5 step 0 = merge origin/main into the branch by hand (187
    commits behind on 2026-11-01; main's `0ab2c4b` touches WordWall.astro, 19 lines, and DESIGN.md +159; keep
    PluginCard + PluginShowcase deleted), then steps 1-9 + 13 in the plan's order. Open: D7 (the second key's
    words), D9 (the TV's keys join `.rv-btn` or not). Outside the branch: the GAS notice bug LIVE on main
    (`TrialGateModal.astro:81`, a one-line fix, the user's word first).
  - Unverified: the user has not looked at the baked page yet (opened for them at http://127.0.0.1:4392/#plugins;
    the last signal was the pasted bench pick itself). The bake was checked in Edge / Chromium only: WebKit, a real
    phone and iPhone / Mac Safari were not run on it.
  - Running on laptop 1 at the close (b5's background shells; they die with the session): `astro dev --port 4392`
    (page + `/__wwbench`, PID 37308), `astro preview --port 4393` (127.0.0.1, serves `dist/` = the last
    `npm run build`, PID 23312), `python -m http.server 4471` (GAS 2 mockups from the scratchpad, PID 37004). Stop
    one with `Stop-Process -Id <PID>` (by PID, never every node.exe).
  - Check scripts (bakecheck, listcheck, fit2, nojs, blink, bench*) live only in b5's scratchpad:
    `C:\Users\shlik\AppData\Local\Temp\claude\c--Revaudio\9a45622a-182f-481b-ae66-7bfc8dc8c798\scratchpad\`.
  - Lesson: `tasks/lessons.md` 2026-11-01 #1 (a bench pick that grows sizes must be fit-checked on the real page).
  - Claim CLOSED 2026-11-01 (session close). The next session writes its own claim here before editing.
- Session 2026-11-01 (Claude Code `revaudio-67`, laptop 1). CLAIM: the writer on this worktree. The user: a
  technical review of the TV's wiring ("LCD" = the TV's screen), then deploy today. Their picks: ship the TV as it is
  after step 0's merge (Phase 5 later, its own branch); Halloween off; D9 = the TV's keys join `.rv-btn`; in the
  deploy too: the GAS notice line, DRIFT no longer first (`drift.homeLead` false), the macOS floor in the system
  requirements, the Cloudflare beacon's SPA page views. Review + steps: plan § "Deploy today".
  - Done, LIVE since 2026-11-01 (the user: "push"; `git push origin feat/home-library:main`, 2eea1f2 -> 3a19a87,
    43 commits incl. a0's + b5's TV work; rollback = a revert commit, never a force-push): `22747ef` (b5's
    close note, on the user's word), `6d489ba` the merge of origin/main `2eea1f2` (11 conflicts by hand; /downloads
    needs PluginShowcase + DriftCard, so they stay), `01c3f85` Halloween off, `2f75693` the TV's keys = `.rv-btn`,
    `629f72a` the GAS notice, `f3d52eb` DRIFT not first, `3e54d1b` the beacon's `"spa": false`.
  - Checked: build green (30 pages), 0 broken links, gate ids = worker keys, 8 sizes in Edge (fit, keys, notices,
    no errors), /downloads, /store redirect, smoke chromium 21/21. Not run: WebKit, a real iPhone / Mac Safari.
  - Not done: step F (the Mac floor in the system requirements): the shipped pkgs are in R2 and this laptop has no
    wrangler; Radio Roulette's pkg predates the 10.13 rule. Needs `check-macos-floor.py` on each R2 pkg first.
  - Live check 2026-11-01 (Edge, trackers + the worker aborted, no form sent): the new build is served (the beacon's
    spa false in the HTML), no Halloween, the TV order, PLUGINS + Downloads in the header, GAS's Try opens the gate
    with the trial-free notice, `/store?utm_source=lc` -> `/?utm_source=lc#plugins` under the live CSP, /downloads +
    the four product pages 200, no page errors and no CSP errors (only the aborted trackers). Deploy run
    41313630093 green, the Cloudflare cache purge step green.
  - Next: GAS 2 on the TV (Dan's note via `danavivi-83`): on this branch, hidden until live (blockers in the plan);
    Dan's mock sits on `b67c76f`, so his session starts from the new tip and writes its own claim. Then Phase 5,
    step F (the Mac pkgs checked first), the persona access fixes (step 13). Not run yet: WebKit, a real iPhone /
    Mac Safari.
  - Motion on too (Lenis, the glide, GSAP): header PLUGINS glides from the top and with `?plugin=` in the address
    (no reload, parks at 0 / -0.2 px, focus on the heading), a channel change, Try opens the gate; 1280x665 +
    390x844, no errors. Nothing under `src` / `public` is untracked or ignored. No server left running.
- For the user (dashboard, optional): a Cloudflare Redirect Rule `/store*` -> `/#plugins` would make it a real 301;
  the repo page works without it.
- Found: index.astro's testimonial CTA said "14-day free trial" (the trial is 30 days in both plugins' code); fixed
  on this branch. Not visible live: the block renders only with real testimonials, and there are none yet.
- Active thread (owner revaudio-a0): `src/data/library.ts` (new), `src/data/plugins.ts`, `src/components/WordWall.astro`,
  `src/lib/wordwallDrift.ts`, `tools/wwbench/*`, `src/pages/index.astro`, `DESIGN.md`, `tasks/home-library-plan.md`,
  `tasks/handoff.md`; phase 3 (from 2026-10-18): `src/components/Header.astro`, `src/components/Footer.astro`,
  `src/components/Cart.astro`, `src/components/MobileBuyBar.astro` (comment), `src/data/site.ts` (comment),
  `src/pages/store/index.astro`, `src/pages/[slug].astro`, `src/pages/gas.astro`, `src/pages/support.astro`,
  `astro.config.mjs`, `tests/smoke.spec.ts`, `README.md`, `src/components/CookieBanner.astro` (phase 4: the Meta pixel's
  history PageViews off); deleted: `src/components/PluginShowcase.astro`,
  `src/components/drift/DriftCard.astro`, `src/components/PluginCard.astro`.

## 2026-11-01 — GAS 2 laptop page (page-b): Terms + newsletter checkboxes on the service ticket (Claude Code `danavivi-83 [c52ea5]`, Dan's Mac) — ON MAIN (fast-forward, 2026-11-01)

Claim: CLOSED 2026-11-01 `danavivi-83 [c52ea5]` (a second session under the same name as the one below; `[c52ea5]` tells them apart).
Files: `tools/_gas2-scene/page-b.html` (the `#ticket` form and its `.ticket .ck*` CSS only) + this entry. Not `taxi/**`.
- Dan (2026-11-01): "add the terms and conditions checkbox and the newsletter, that they subscribe to the newsletter if
  they put the email."
- What: two printed boxes on the `#ticket` under YOUR EMAIL, ticked in the red pen. Terms = `required` (the live
  `Cart.astro` line: Terms / Licence / Privacy, links to revaudio.net in a new tab); newsletter = opt-in, unticked (the
  live `TrialGateModal.astro` consent, word for word, which the licence worker stores as `MARKETING_CONSENT_TEXT`). Not
  "the email = subscribed": the live site chose a separate, unticked yes (UK / EU / Israel §30A); Dan can overrule.
- The taxi is untouched: with Terms unticked the form never submits, so no SENT and no cab; ticked = as before.
- Checked (local Playwright, Chromium + WebKit, 1141x636 + 1440x900, `?drone=0`): the ticket fits (63-573 px at
  1141x636); MAIL ME THE KEYS without Terms = the browser's "check this box", no SENT; ticked = SENT, the cab parks, the
  button turns "To the store"; 0 page errors. Not checked: the phone page (`postcards.html` has its own email card, no
  boxes yet), a real iPhone.
- Round 2 (Dan, same day: "the HOP IN reading over the taxi, I don't want it"): `.tx-cap { display: none }` in page-b's
  own CSS, as the phone did (round 11, `3378948`); `taxi/**` untouched. The cab waits, Esc still sends it off (checked,
  Chromium + WebKit). His "commits that aren't there": checked every GAS 2 branch (`feat/gas2-taxi`, `-postcards`,
  `-drone`, `-phone`, `-page`, `-page-s2`) line by line against `origin/main`: nothing missing; HOP IN was off on the
  phone only. Phone-only, still open for the laptop: the harder, faster red flip and the red button keeping the
  Download FREE size.
- Dan: "no" to the phone's flip + button size on the laptop; "push everything to main" + a RevTasks task to check the
  page works and the backend is wired (the email form is still a dummy: Terms / `marketing` / the download mail are
  not posted anywhere yet). Open: the phone page's boxes (`postcards.html`, owner `danavivi-83 [76660c]`).

## 2026-11-01 — GAS 2: the LAPTOP page (page-b) on main too: the drone intro, the coupon, the pump light, the worn knobs, with the taxi (Claude Code `danavivi-83`, Dan's Mac) — SQUASH-MERGED TO MAIN

Claim: CLOSED (merged). Next: GAS 2 on the front page, in the LCD screen (`tasks/todo.md` top): it waits for the LCD
work from the other computer, then the publish, on Dan's word.
- Dan (2026-11-01): "Let's also push the latest page for the laptop one. And merge them to main. Then we need to have a
  plan on where do we put gas 2 ... in the front page. Like I think it should be in the LCD screen that we do right now
  in a different computer, so just wait for it and then we'll do a publish."
- What: a squash of `origin/feat/gas2-drone` (`fd60c72`..`951936d`, `revaudio-59`, its entry below) onto main:
  `drone/**`, the CATCH10 coupon ticket, Dan's pump light (Spotlight D, storage key `spot4`), the WORN radio knobs, the
  grade hover strip out. A squash, as `revaudio-59` asked (that branch's commit subjects name the private knob tool).
  Conflicts: page-b's head keeps both lines (the taxi, then the drone); `player/radio.css` = the drone branch's neutral
  knob note; the scene README and these two files = both sides.
- Checked (Playwright Chromium + WebKit, 1141x636 + 1440x900, a no-cache server on the merged tree): the hover (runway,
  the car); `dr:caught` = the ticket with CATCH10, Esc closes it; the landing = `?drone=0` (mean 0.00-0.19 / 255: the
  page's own idle animations); then on the same visit MAIL ME THE KEYS -> the taxi parks, the red "To the store", Not
  now = it leaves and the button is Download FREE again; `?drone=0&taxi=park` = the same car box as main's page-b before
  the merge; 0 page errors, 0 failed requests (the plugin frame on :4461 is never served here). Not checked: a real
  iPhone / Safari (owed since 10-29), the drone's own `check.cjs` (written for Edge on Windows).
- CATCH10 is NOT confirmed in Paddle (the shared STATUS still says "waiting on Gil", RevTasks #193). Main is not live
  for this page (`tools/` is not in the Pages build), so `revaudio-59`'s gate ("off main until it exists") now guards
  going live: the page goes into `src/` only after CATCH10 works at checkout.
- Open for Dan: delete the remote `feat/gas2-drone` (its old commits name the private tool; `revaudio-59`'s close note:
  ask after the squash); the laptop page on his iPhone.

## 2026-10-29 — GAS 2 page: the PHONE page as POSTCARDS (Claude Code `danavivi-75`, then `danavivi-83`, Dan's Mac) — BRANCH `feat/gas2-postcards`; the phone page SQUASH-MERGED TO MAIN 2026-11-01

Claim: OPEN `danavivi-83` (took the postcards over 2026-10-31 from `danavivi-75`, no longer running: the end page's scene spots, phone only; D picked 2026-11-01). Round 9 (motion on Dan's iPhone) BUILT + checked, then a ponytail pass (`205661d`) and the keyboard slide-up (`6c91731`); the review page = round 10 (version 12, build `6c91731`); the branch tracks `origin/feat/gas2-postcards` (pushed on Dan's "commit everything and push it"; not main, no deploy). Branched from `origin/feat/gas2-drone` @ `4fc6ddd` (no upstream set, so a bare push
can't reach the drone branch); `revaudio-59` keeps writing `feat/gas2-drone`, so this branch stays out of its files.
Files (mine): NEW `tools/_gas2-scene/postcards.html` + `tools/_gas2-scene/postcards/**`; `tools/_gas2-scene/taxi/**`
(from `danavivi-a5`, 2026-11-01: one script for page-b and the phone, page-b.html itself untouched); one README line pair; the
"GAS 2 phone POSTCARDS" section on top of `tasks/todo.md`; this entry. Read only: `page-b.html` (copy, ticket), `fonts/`,
`frames/f6-v17.png`, `props/poster-level.webp`, `props/poster-mail-1.webp`, `props/mailbox.png`, and
`player/audio/hiphop_{before,after}.m4a` (Yoni's lane: played, never edited). Desktop `page-b.html` untouched.
- Dan (2026-10-29, picked over the receipt and "pump as player"): a stack of 1950s "Greetings from GAS 2" postcards, phone
  only. Card 1 = the real GAS 2 pump in front of the station; flick away REGULAR / PREMIUM / RACE; a "hear it" card (flip,
  ▶ on the back); the last card = a postcard back, email on the address lines, dropped in the mailbox = MAIL ME THE KEYS.
  Dead (don't re-propose): Swipe / Walk / Stack, the pump close-up + jukebox (`feat/gas2-phone` `phone.html`), the pump as
  player, pedal / gauge toys, the receipt. DESIGN.md rule (on `feat/gas2-phone`): rebuild for portrait, never crop the
  desktop scene. Art spend only on Dan's OK (OpenAI images; Higgsfield 0 credits). The form stays a dummy.
- Audio facts (measured 2026-10-29, ffmpeg ebur128): `hiphop_before` / `hiphop_after` both I -11.0 LUFS, LRA 1.7, 26.24 s,
  AAC 48 kHz stereo. The after = PREMIUM at GAS 140 %. No per-grade renders exist: no per-grade sound claim anywhere.
- Built v1 (`postcards.html`, one file, no build): six cards in one stack over the dusk sky (soft). Drag = the card follows
  the finger and turns about where it was held; a flick (> .5 px/ms) or a drag past a third of the card throws it off in
  that direction, otherwise it springs back; a finger that stops before letting go doesn't throw. Back / next buttons +
  arrow keys, "n / 6", "Flick the card" until the first flick, one nudge on first load. 1 = "Greetings from" + the real
  pump in front of the station (soft) + THICKER, SMOOTHER, GLUED MASTER. + "GAS 2 · FREE"; 2-4 = large-letter grade
  cards (the pump's own key, lit as its card comes up, the BRIEF line, a script kicker); 5 = HEAR IT ("Fill it up. Same
  level." poster), tap or "Turn it over" = two quarter turns with the faces swapped edge-on (backface-visibility let
  WebKit show the hidden face's layers through, mirrored), the back = ▶ / ■, ORIGINAL | GAS 2 in place (both sides loop
  in sync, 30 ms crossfade), a progress line, "PREMIUM at GAS 140 % · both sides -11.0 LUFS"; 6 = POST CARD back: MAIL ME
  THE KEYS, a 0¢ stamp from `poster-mail-1` + a REVAUDIO STATION postmark, the email on the TO line (handwriting; the
  placeholder printed), MAIL ME THE KEYS = the card shrinks into the mailbox (up from the bottom on this card only), SENT
  + the address + "(Mockup: nothing was sent.)" + Start over. `?card=1-6`, `&flip`. Reduced motion: no flight, instant
  swaps.
- Art (no spend, `postcards/tools/`): `bake-pump.cjs` = the plugin page itself (:4461) at DPR 2, ROOM with the room
  hidden, PREMIUM lit, needle 140, counter -11.0 (= the demo), hose run on along the ground in `make-art.py`;
  `bake-keys.cjs` = the three keys + lit at 9x from the GAS2 3D lab (`bench/pump-lab.html`, real GPU: Apple M1 Max via
  ANGLE Metal, 9 s; same look as the 4x bake, crisp at card size; the GAS2 repo is only read) + `make-keys.py` (both
  and the key images removed in the ponytail pass, 2026-10-30; in git at `082c5c4`);
  `make-art.py` = card 1's station (painted pump filled out, softened), the dusk, a woven linen tile, the stamp.
  Weight: ~778 KB for every card; the demo (1.76 MB) is fetched from card 4 on.
- Checked: `postcards/tools/check.cjs` = WebKit 22 steps (flick / spring back / hold-then-let-go / down-flick / back /
  key lit / next + keys / tap-to-turn, one face at a time / turn back / mailbox / last card stays / empty + bad email /
  drop + SENT / no network request / Start over / reduced motion) + 20 layouts (402x714, 375x553, 390x664, 393x659,
  430x750: card + controls on screen, no overflow, input >= 16 px) all pass, 0 console errors; Chrome: the demo plays on
  GAS 2, the bar moves, ORIGINAL switches, ▶ stops. iOS Simulator (iPhone 17 Pro, iOS 26.5, 127.0.0.1:4466, Safari
  restarted per shot): all six cards + the HEAR IT back right, crops at 1:1 sharp. Not checked: a finger (flick feel),
  the iOS keyboard over the TO line, sound by ear on iOS, a real iPhone.
- Design hook (impeccable): fixed 3 contrast nits; waivers in `~/.impeccable/config.json` (home, not the repo), scoped to
  `**/tools/_gas2-scene/postcards.html`, each with its reason: gradient-text (the large-letter fill), buried-raster (the
  lit keys), flat-type-hierarchy (cqw sizes, measured), marquee (the house button shine), radial-halo (the pump's lamp).
  Left standing: repeating-stripes-gradient (advisory, the grade cards' sunburst).
- Server: no-store on :4466 from this worktree's `tools/_gas2-scene` (dies with the session); again:
  `python3 -m http.server 4466 --bind 127.0.0.1` there (plain: reload twice if a change doesn't show).
- Then (Dan, 2026-10-29, after v1: "okey cool! i want that in the end page the user will reach the right side of the
  desktop page, the words will pop out and everything"): THE END PAGE. When the last card goes (flicked, next, or
  dropped in the mailbox) the lens pulls focus from the cards onto the open sky right of the canopy = the desktop page's
  right side (`postcards/img/scene.webp` = `f6-v17` as webp, 260 KB, fetched from card 5 on; the dusk behind the cards
  is now the same frame blurred, both cover + right-aligned, so the focus pull lines up), and page-b's readings stand in
  it: composition 2 + the premium shadow (HUG, FOCUS, DUSK) ported 1:1, sized by the same 3:2 scene (cqw; GAS2 145 px
  at 402x714), the column centred on the phone (page-b: x 64.5 %). They pop with the drone's `pop()` keyframes and
  timings (GAS2 springs out with blur + overshoot, the oxide rule draws, the line, the button and "Fill it up." pop
  fast), a beat (380 ms) into the focus pull; the flicked card flies over the scene. ⤓ Download FREE = the mail card
  comes back; after mailing the button reads "✓ Keys in the mail" and the foot says "Sent to … · Mockup: nothing was
  sent." (back can't pull the mailed card out of the box). "↺ The postcards again" deals them back, bottom card first.
  The last card can now be flicked (it rubber-banded before); the old SENT overlay is gone (the end page replaces it).
  Fixed on the way: the end page's photo first reused `.photo` (HEAR IT's poster class) and took its z-index, tilt and
  border, covering the button (found by check.cjs); now `.vista`.
- Checked (end page): `check.cjs` 24 steps + 30 layouts (5 sizes x cards 1, 2, 5 back, 6, end, end sent) all pass, 0
  console errors; in-page timing: card off by ~350 ms, the scene 90 % in by 345 ms, GAS2 pops from 380 ms; iOS Simulator:
  the end page, the sent variant and card 6 (next = to the end) right.
- Then (Dan, same day: "open a bench so i can comment on every section of this page and give my notes for adjustments
  in an html"): THE REVIEW PAGE, private artifact https://claude.ai/artifact/6zn14ha4qswV1gmCb8v3qG (of build `b5279b1`).
  11 sections in visitor order (cards 1-6, the HEAR IT back, the end page, mailed, motion, overall), each: the screenshot
  (a tap = a numbered pin, the note starts with ①), ▶ Live = the real page in the frame at that state, a notes box,
  ✓ Looks right; on Regular the painted-fronts question (Paint them / Keep the plugin keys / Show me one first). Notes =
  the artifact's db, `notes/<section id>` = {screen, text, ok, pins [{n, x, y}: 0-1 of the 402x714 screen], choice,
  updatedAt}: read with ArtifactData `list`, collection `notes` (fallback: this browser + "Copy all notes"). Source:
  `postcards/review/index.html`; `postcards/review/build.cjs` makes `out/` (not in git): `live.html` (fonts inlined,
  audio renamed .mp4, the state read from the hash) + `shots/*.webp` (WebKit 402x714). Republish = the Artifact tool with
  `url` + the same 28-file `files` map (out/live.html, out/shots/*, postcards/img/*, props/mailbox.png,
  props/poster-level.webp, audio/hiphop_*.mp4 from player/audio/*.m4a, no contentType: .mp4 is served as video/mp4).
  Checked locally (Chrome 1280 + WebKit 390): pins, notes, ✓, the question, live frames (right state, one at a time),
  reload, copy, no sideways scroll, 0 errors; on claude.ai a db probe written, listed and deleted.
- Then ROUND 2 (Dan's notes, 2026-10-29 21:03: pasted "Copy all notes" + the db; he skipped the painted-fronts question;
  plan OK'd by his pick "deck buttons" for the vinyl). `1cdeebc`: grade cards = the plugin key gone, script + lettering
  centred on the card with the sunburst behind (turns, 150 s), the line in Oswald caps; mail card = one TO line (the two
  empty lines gone), the email bigger, the site's consent box verbatim ("Also send me new-plugin drops and demo codes
  (optional)", unticked, above the stamp so it's ticked before sending; `name="marketing"` like the worker's field),
  MAIL ME THE KEYS = a red station dater stamp (REVAUDIO STATION / today's date, `ink.webp` mask) that thumps, the card
  jolts, then the drop; HEAR IT back = a portable record player from above (tap the record = arm swings in, needle drop
  0.3 s before the sound, 33 1/3 = 200 deg/s, coasts down; ORIGINAL / GAS 2 = the deck keys; the arm angle = song
  position, lead-in to run-out solved from the drawn geometry); after mailing a "TO THE WEBSITE" railway ticket pops
  out under the readings (revaudio.net/store, `target=_blank` because the review frame can't navigate; on SE heights
  only its big line); the end page itself untouched (Dan's ✓). Overall: each card worn its own way (`make-wear.py`,
  numpy noise, no spend, ~235 KB total): tape on 1, a coffee ring on Regular, gold-foil seal on Premium, a thumbprint on
  Race, ring wear on HEAR IT, a fold on the mail card; alive = arrival pops (lettering, seal, "Greetings from" writes
  itself, postmark thump), lamp flicker, dust motes; all off under reduced motion. The keys' files + bake tools stay in
  the repo, unused (in case Dan wants them back). Checked: `check.cjs` 26 steps + 30 layouts pass, 0 console errors
  (new: lettering centred, mail + deck stacking per size, consent box, stamp, ticket + href, record spin / arm / coast
  in Chrome). Review page round 2 = the review-bench skill's template (`~/.claude/skills/review-bench/`, Dan: "save
  that style for future work") + this content: `CFG.round = 2` (notes in collection `notes-r2`), his round-1 note +
  "what changed" under each screen, a new "Hear it, playing" shot (Chrome, in `build.cjs`); version 3 at the same URL;
  files map now 35 files (+ the wear art, - the keys). Checked locally: Chrome 1280 + WebKit 390, 0 errors.
- Then the design hook (Stop, round 2), `e537a4a`: fixed cramped-padding (the ticket: 16/26 px so the words clear its
  printed rule; under 680 px tall the one-line ticket without the rule) and organic-clip-path (card 1's tape = a
  generated torn cut-out, `tape.webp`, instead of a 24-point polygon). Waived nested-cards for `.deck` only (the record
  player Dan asked for, drawn as an object on the card; dropping its case shadow clears the finding) in the worktree's
  `.impeccable/config.local.json`; there the stale buried-raster waiver (the keys) is gone and the marquee reason now
  names `.rd .cta::after`. check.cjs again 26 + 30 pass. Review page version 4 (build `e537a4a`), files map 36.
- Then ROUND 3 (Dan's round-2 notes, 2026-10-29 23:48, pasted; one note, on HEAR IT's back: "lets make an animation of
  the vines cd working and make it less like a post card more like a hole picture real vinyl animation"; his message
  opened with "commit"). `b05c079`: the back is one top-down photo of a turntable, full bleed. Its body is a picture
  (`make-deck.py`, numpy: walnut frame mitred at the corners, brushed aluminium under a lamp at the top left, platter
  well + shadow, arm boss; 42 KB); no paper, handwriting or `.age` on that face. Over it in card units (1 = 1cqw): the
  platter rim's 180 strobe dots (they blur with speed; under the neon lamp a second ring turns at spin - 200 deg/s, so
  they stand still at speed), the grooves cut once on a canvas at device pixels (track gaps, lead-in, run-out; the
  lamp's two-lobed streak on a second, screen-blended canvas that wobbles a hair at the turn rate), the label + specks +
  a run-out etching turning, a chrome S-arm + its shadow layer pivoting at (77.25, 95.2). The motor runs while the back
  is up (0.6 s to 33 1/3, 1.1 s brake; none under reduced motion). Tap the record = cue up 260 ms, swing to the lead-in
  900 ms, wait for the demo, lower 420 ms; the song starts as the needle lands, after a synthesized knock; playing, the
  arm creeps over a 240 s "side"; tap again = up, home, down, the platter keeps turning. Fixed on the way: a tap on
  the deck's body turned the card (setPointerCapture retargets pointerup to the card; tap() reads the pointerdown
  target now). check.cjs: the back's layout per size (record, tape, legend, keys, fine print + badge in order, Turn
  clear of the record, keys + Turn >= 44 px), the cue mid-swing, motor + reduced motion: 29 steps + 30 layouts pass,
  0 errors. Review page round 3 (`CFG.round = 3`, notes in `notes-r3`; his note + what changed on the back, "No note
  last round: unchanged." elsewhere) = version 5 at the same URL (+ `postcards/img/deck.webp`). Design hook: the
  nested-cards waiver now names `.dymo` (the label-maker tape; `.deck` is gone); only the advisory stripes remain.
- Then ROUND 4 (Dan's round-3 notes, 2026-10-30 13:15, pasted, all on HEAR IT; plus "if you need to create more assets
  ... please do so": done in code, no spend). `bf71096`: front = TURN IT OVER in HEAR IT's large letters (the `.big`
  bk/fr rules shared), ~2.5x, nodding with the curl (`beckon`, 2.6 s). Back = "I want the buttons to feel real": ivory
  piano keys in a graphite escutcheon with amber jewel lamps, rendered in `make-deck.py` (height field: dished keys,
  rounded edges, chamfered bezel; lamp 40 deg up like the deck; shadows marched, AO; 2x then halved): `deck-bank.webp`
  + one opening's key up / latched (`deck-key-up/-down.webp`, the bank repeats every 43 units so they serve A and B;
  ~6 KB in all). The button's background swaps by state (no hidden layer: the design hook's buried-raster). Press =
  goes in under the finger + a synthesized click, latch = a clack + a haptic tick (`navigator.vibrate`, else iOS 18's
  `<input switch>` tick); the lamps follow the side. "TAP THE RECORD" = a die-cut vinyl sticker (honey, red rule,
  arrow), under the arm in z, slapped on as the deck comes round (WAAPI), its top-right corner peels (`@property
  --peel` + clip-path), a glint; tapping it = play (tap() reads the pointerdown target). Fine print gone; Turn = a 7.6
  cqw knob (44 px target). check.cjs: `?card=5` front Turn layout, the sticker cues the record, the keys latch (picture
  + lamp): 30 steps + 35 layouts pass, 0 errors. Review page round 4 (`notes-r4`) = version 6 at the same URL. Design
  hook: nested-cards waiver now names `.sticker .sk`; only the advisory stripes remain.
- Then Dan's OK (2026-10-30): "looks amazing / the vinyl looks crazy / i really like the buttons / save them for future
  purposes for next sessions". The keys are saved for reuse in the shared repo: `collaboration/handoffs/2026-10-30-
  piano-keys/` (a standalone kit: `make-piano-keys.py`, a demo page, the pictures, his look; + a handoff to put them in
  the shared button library) + memory `feedback_ivory_piano_keys_liked` (shared `959b947`). `make-deck.py`: the bank's
  comment brought up to date, dead helpers out (the pictures come out byte-identical). Pushed this branch.
- Then (Dan, chat, 2026-10-30): "the readings on the cards should be glued to the card and not pop out ... like physical
  cards ... Physics-wise". `22d779e`: `arrive()` and its keyframes are gone (lettering pop, slide-ins, "Greetings from"
  writing itself, seal + postmark thumps, the sticker's slap), the sunburst no longer turns, the lamp in card 1's photo
  no longer flickers, TURN IT OVER no longer nods. Kept: the cards' own motion (flick, nudge, HEAR IT's curl), dust,
  the turntable, the sticker's peel, the gold seal's glint, the stamp's thump on a tap, the end page. check.cjs: a card
  comes up with nothing on it animating (`document.getAnimations()`); 31 steps + 35 layouts pass. DESIGN.md §6: "printed
  things stay glued"; tasks/lessons.md. Review page round 5 (`notes-r5`) = version 7; card 6 restored there (round 3's
  edit had dropped it; the review-bench skill now says to count sections).
- Then (Dan, chat, 2026-10-30): "go back and forth from the cards ... back is left to right, and front is right to left",
  the station too. `743e67f`: a drag that starts left to right is "back" (`pull()`): the card before comes in from the
  left under the finger, lands on top past a third or on a flick, slides back out if let go early; on card 1 it only
  gives a little. Right to left / up / down throw it on as before; a throw that turns right springs back. The station
  (`#end`): left to right = `prev()`, or after mailing the "again" deal (the card is in the box); `.end` is
  `touch-action: pan-y pinch-zoom`. The hint: "Flick left: the next card · right: back". check.cjs 36 steps + 35
  layouts pass. Review page round 6 (`notes-r6`) = version 8.
- Then ROUND 7 (Dan's round-6 notes, 2026-10-30 14:29, pasted, all on HEAR IT's front). `55cc52f`: ① the gauge's thin
  red level line wiped from the card's own copy of the poster (`postcards/tools/fix-poster.py` ->
  `postcards/img/poster-level.webp`; desktop `props/poster-level.webp` untouched); ② "all the readings except TURN IT
  OVER are faded out": the front's `.age`, `::before` (light, vignette) and `::after` (linen) now sit under the print
  (z-index 1), so the words read as crisp as TURN IT OVER (which sat above them); ③④ TURN IT OVER moved up under the
  line (bottom 17.2cqw, at his pin and a bit lower), its words centred (`translate: -4.8cqw`, the arrow hangs left).
  check.cjs 36 + 35 pass. Review page round 7 (`notes-r7`) = version 9 (+ the poster copy).
- Then (Dan, chat, 2026-10-30): "the card moves is not smooth yet ... everything that moves needs to be smooth".
  Measured first (scratch probes: Chrome, `Emulation.setCPUThrottlingRate` 4, rAF frame log, longtask observer, a trace
  of the release, per-frame speed of the card around the release). `1065d59`: let-go motion runs frame by frame from
  the finger's speed (`move()` + `flight()` / `sprung()`, one rAF loop `glide`; a card caught mid-spring is held);
  no depth `scale()` (same-size stack) and none while held; the held shadow = a `.lifts` layer (opacity); will-change on
  the cards in sight + the next; every coming card visible under the stack (decoded early); `@property --rest` not
  inherited; the demo decodes on an OfflineAudioContext (the device context opens on a tap: 226 ms at 4x) and the
  record's grooves are drawn ~6 ms a frame, both via `idle()`; the turn = WAAPI halves at a matched .77 deg/ms; the
  stack settle = a spring in CSS `linear()`. Worst frame (4x) 417 -> 33 ms, no long tasks; check.cjs 36 + 35 pass.
  DESIGN.md §6 + lessons. Review page round 8 (`notes-r8`) = version 10. Not felt on a real iPhone yet.
- Then (Dan on his iPhone, 2026-10-30, Hebrew): "no vinyl animation as it should be, the cards don't move when you press
  the buttons, it should feel like you're moving the card". All three = iOS Reduce Motion: `reduce` switched off every
  move. `c22bab5`: Reduce Motion now stills only what moves by itself (dust, glints, the hint's wiggle, the idle record,
  the end page's pops); the hand's moves (throw, spring back, pull back, the ‹ › buttons, the turn, the arm's cue, the
  record under the needle, the mail drop) always run, with more damping (`Z`). The held card is drawn once a frame
  (`hold()`) and leans up to 7 deg into its speed. For his phone test: a LAN server (`serve-lan.py`, bound 0.0.0.0,
  port 4470, the session's scratchpad) and a git-ignored `tools/_gas2-scene/motion-check.html` that says whether
  Reduce Motion is on; stop the server and delete the check page when done. Review page round 9 = version 11.
- Then (Dan, chat, 2026-10-30: "check your work and do a ponytail on it"): a review of the whole branch, smallest fixes.
  `205661d`: whatever takes over a moving card now takes it from where it is. Before, ‹ mid-throw started it back from
  its landing spot (~890 px jump); › right after ‹ or while a let-go card sprang home restarted it from the top pose
  (~100-530 px); a tap while it sprang home froze it off its place (the drag now takes the card on its first move);
  a layout left the JS spring running (it settled on the wrong place); a flick whose last move and lift fell between
  two frames threw (`d.cur` null). `at()` = a card's pose this frame from its computed transform (JS spring or CSS
  settle). Under Reduce Motion the strobe dots under the lamp crawled (the neon's clock now runs only past half speed:
  still at rest and at 33 1/3). Cut: the spring cache + `v0` (`SETTLE`), dead CSS, unused exports, the grade-key art +
  its two tools and `wear-5b.webp` (unused since rounds 2 and 3). Every state pixel-identical but the strobe;
  `make-wear.py` rebuilds byte-identical; check.cjs 41 steps + 35 layouts pass, 0 errors (the 6 new steps fail on the
  page before). Not changed: the first throw's release frame is ~50 ms at 4x CPU on the round-8, round-9 and this
  build alike (the Mac was at load 11-13; DESIGN.md asks <= 33): measure again on a quiet machine before chasing it.
  The review page stayed on `c22bab5` till round 10 (below).
- Then (Dan on his iPhone, iOS 26, 2026-10-30 19:00: a screenshot of the mail card with the keyboard up, then "it's not
  comfortable like this ... give options"; his pick of three: "card slides up"). iOS 26 cuts the page to the ~387 px
  above the keys: the stack (sized by its container) shrank the card to half and the tick line ran into the stamp.
  `b15a2eb`: on focus the stack keeps its size (`--cw` frozen in px) and `fit()` slides it (translate .4 s, from the
  visual viewport) till the TO line, the tick box and the stamp sit just over the keys; ‹ › and the mailbox step aside.
  The card goes back once the keyboard has gone, not on blur: a tap on the stamp blurs the input first, and going
  back on blur moved the stamp out from under the finger (found by a stamp-with-the-keys-up check). Checked at 402x714 -> 387, 375x553 -> 293, 430x750 -> 410 (WebKit, the keyboard mimicked by a shorter
  viewport); check.cjs 42 + 35 pass, 0 errors; stills pixel-identical. DESIGN.md §8 + lessons. Not on a real iPhone yet.
- Then (Dan, 2026-10-30: "open the bench"; `notes-r9` was empty): review page ROUND 10 (`notes-r10`) = version 12 on
  `6c91731`, same URL. Card 6 = his keyboard note verbatim + what changed, and its tip says the slide over the keys
  shows on the page itself on his phone, not in the review frame (a frame's viewport never feels the keyboard);
  motion = the takeover fixes; HEAR IT back = the strobe under Reduce Motion; the rest "unchanged". Files: `live.html`
  + the 11 shots re-sent; `wear-5b.webp` and the unused `props/poster-level.webp` removed (the page uses
  `postcards/img/poster-level.webp`). Checked locally (Chrome 1280 + WebKit 390): 12 sections by title, pin, note, ✓,
  reload, copy, the live frames (card 6 runs the new build: the stack slides, `typing` on focus), no sideways
  scroll, 0 errors; the shots = round 9's but for the record's angle.
- Then (`danavivi-83`, Dan 2026-10-31, phone only: "when user lands on this page lets try different areas of the screen
  that also involves the gas pump / lets try a different spots of background image from the scene for the end page"):
  `?spot=` (JS `place()`, the `SPOTS` table) frames the end page on another part of `f6-v17` and moves the blurred
  frame behind the cards with it (vars `--cl/--ct/--cw/--ch`, so the focus pull still lines up: measured 0.01 px);
  no `?spot` = the signed-off sky, pixel-identical to `c947709` at 402x714, 375x553 and 430x750 (cards 1, 5 back, 6, 7,
  7 sent; the one diff, the mailbox rising on card 6 at 375x553, varies run to run on the old build too). Why the
  spots look like this: the frame is 3:2 with the pump at x 335-590 and the open sky right of x 965, so a portrait
  crop can't hold the pump and the readings' sky together; A-C zoom out (0.58-0.75 of "the frame's height fills the
  screen") and put the readings in a night above the roof: the frame's top edge fades (`--cm` mask) into a navy taken
  from the frame's own top-of-sky (`#152d4c` sampled, `#0e1b2d` -> `--bg`). A = the station front (radio, pump,
  barrel), B = the pump close (base on the screen's bottom, the endbar over its knobs), C = the pump at the left and
  the desert sunset at the right (the canopy's eave, both lamps), D = the station on top and the readings below (the
  button in thumb reach). `?spot=z,x,y,tx,ty,r` tries any framing. Readings clear the pump's globe by 11-27 px at all
  five check sizes. iOS Simulator (iPhone 17 Pro, 127.0.0.1:4466, a no-store server from the session scratchpad) shots
  of all four + card 1 with B: right. check.cjs 42 steps + 35 layouts pass, 0 errors.
- Then (Dan: "show them all to me in a bench side by side"): the SPOTS BENCH, private artifact
  https://claude.ai/artifact/XdDVWwHNoSLesVBARU4dxQ (build `ad8c371`): the review-bench template with one layout change,
  the five end pages in one row (the signed-off sky, A-D; under 1100 px the row scrolls sideways inside itself), each
  with ▶ Live (`live.html#card=7&spot=x`; inside it ↺ The postcards again lands on card 1 with that spot), pins, a notes
  box, ✓; under the row the pick ("Which one becomes the end page?": sky / A / B / C / D) + a notes box. Notes = its db,
  collection `notes`, doc = `sky`, `a`-`d`, `overall` (the pick is `overall.choice`). Source:
  `postcards/review/spots.html`; shots = the iOS Simulator renders (real Safari, the HUG blur included) cropped to the
  page, 804x1428 webp; `live.html` from `build.cjs` (now carries `?spot`); published from a scratch dir of real copies
  (31 files: live.html, shots/*, postcards/img/*, props/mailbox.png, audio/hiphop_*.mp4 from the .m4a). Checked locally
  (Chrome 1280: five in a row, no scroll; WebKit 390: the row scrolls, the page doesn't): pin, note, ✓, pick, ▶ Live on
  the right spot, one frame at a time, reload keeps it, copy, 0 errors (a favicon 404 on the local server only). Fixed on
  the way: the hidden `.sr` labels escaped the scrolling row and widened the page at 390 (`#screens` is positioned now).
  On claude.ai a db probe written, listed and deleted.
- Then (Dan 2026-11-01 in chat: "Spot D"; the bench's `notes` stayed empty): D is the end page. No `?spot` = D;
  `?spot=sky` = the sky as signed off, pixel-identical to `32e25ae`'s default (the same 15 shots; the one diff = the
  card-6 mailbox again). A-C are out of `SPOTS` (they live in the bench and in `32e25ae`). The readings now hang by
  their top (r = .4027 of the screen height = where D put them at 402x714, to 0.1 px), so GAS2 clears the pump's
  plinth (frame y 830) at every height: it touched it at 375x553 before. After mailing, D has no room under Fill it up.
  (the station above): the line and Fill it up. step aside and the ticket comes up under ✓ Keys in the mail. check.cjs
  now also asserts GAS2 under the plinth and the ticket between the ✓ and the endbar: 42 steps + 35 layouts pass,
  0 errors. Landscape phones (852x393) aren't designed, sky or D: both overlap there. Fixed after, in the iOS
  Simulator (real Safari): on some loads iOS lays the page out at the full screen (874) and settles it under the
  toolbar (714) with no window resize, so the spot stayed placed for 874 (the station shifted right, Fill it up. on the
  endbar); `place()` now runs from a ResizeObserver on `#end` (caught with a debug overlay: end 874 -> 714, rs0, ro2).
- Then the TAXI on the phone (Dan's ask via `danavivi-a5`, then his own "go" here 2026-11-01, the railway ticket going):
  `tools/_gas2-scene/taxi/**` came in from main `ddd0ebc` (`git checkout origin/main --`) and is `danavivi-83`'s now
  (`danavivi-a5` hands-off); ONE taxi.js for both pages: `[data-taxi-scene]` / `[data-taxi-stage]` beside page-b's
  `#scene` / `#stage`, a `gas2:mailed {roll}` event beside page-b's `#ticket` submit, `gas2:reset`, `covers()` = a real
  overlap, the smoke's canvas on a ResizeObserver; details + checks in `taxi/README.md` "On the phone". postcards.html:
  the ticket's markup / CSS / pop are gone; the stamp's tap sets the audio session to `playback` and fires `gas2:mailed`
  (roll 2.5 s, the end page up); The postcards again fires `gas2:reset`; a `.txscene` box over the frame; the sent outline
  yields to `.tx-red`; Fill it up. steps aside after mailing (the lead is back); taxi.js loads with the end page's photo.
  check.cjs: 47 steps + 40 layouts pass, 0 errors (+ the parked cab at five sizes: above GAS2, the driver past the left
  edge, the caption on screen, Not now and the cab thumb-sized; the ride; Not now; the reset; cab + button = the store).
  main's page-b with this taxi.js vs main's own: identical states and parked pixels (Chromium 1141x636, WebKit 1440x900).
  iOS Simulator: parked right; the live store#radio-roulette lands under the nav with its edge lit once. On a merge to
  main, `taxi/**` is an add/add: take this branch's (main's + the phone).
- Then (Dan: the review page link + "update this bench"): ROUND 11 (`notes-r11`) = version 13 of
  https://claude.ai/artifact/6zn14ha4qswV1gmCb8v3qG, build `cde5af7`, same URL. End = his spots note verbatim + D;
  end-sent = "The taxi to the store" (`#card=7&sent&taxi=park`, parked), his taxi note as `taxi/README.md` quotes it;
  card 1 = the station blur; the rest unchanged. `build.cjs` now writes `out/taxi/` (taxi.js from the hash, .mp4, and
  the ride's last step comes back as from the store: the review frame can't leave) + links the taxi art/sound; the
  end-sent shot waits for the park. Published from a scratch dir of real copies (28 files: live.html, 11 shots,
  taxi/**). Checked locally (Chrome 1280 + WebKit 390): 12 sections by title, pin, note, ✓, ▶ Live on the taxi
  (parked, red; the ride ends back on the page, the cab gone), one frame at a time, reload, copy, no sideways scroll,
  0 errors (2 favicon 404s on the local server only); a db probe on `notes-r11` written + deleted.
- Then (Dan's round 11 dump, both pins on the taxi screen: ① on HOP IN · NOT NOW "remove it", ② on the red button
  "I want it to flip harder faster"), `3378948`: the phone hides `.tx-cap` (the cab waits; The postcards again sends it
  off); `data-taxi-flip="hard"` on the phone's stage = a 120 + 280 ms turn (was 240 + 460), perspective 400, a punch
  and the house snap curve; page-b keeps its caption and quarter turns (states + parked pixels identical, old vs new).
  `?taxi=arrive` rolls the cab in by itself (silent) for a review. check.cjs 46 + 40 pass, 0 errors. ROUND 12
  (`notes-r12`) = version 14, same URL: the taxi screen's Live = `#card=7&sent&taxi=arrive` (it rolls in, stops, the
  button flips), its note verbatim + what changed; the rest unchanged. Checked locally (Chrome 1280 + WebKit 390).
- Then (Dan in chat, pinned on the red button in `notes-r12`: "the size of the button to the store should be in the same
  size of the download free"), `94f2621`: taxi.js puts the red label in `.tx-label`; the phone lays an unseen "⤓ Download
  FREE" under it in one grid cell, so red = that box to the pixel (WebKit + Chrome, three sizes; check.cjs asserts it at
  five: 47 + 40 pass). page-b identical. ROUND 13 (`notes-r13`) = version 15, same URL, that note + what changed.
- Then (Dan: "summon a tester ... technical UX and backend"): one Opus tester agent ran the phone page end to end
  (WebKit at five sizes, real Chrome with sound, 4x CPU throttle, Slow 3G, races, bfcache, a11y; scripts + results in
  the session scratchpad `tester/`): smooth (60 fps on almost every motion at 4x), no blockers, 3 majors, all three
  confirmed here. On Dan's "fix", `a788990` (taxi.js + postcards.html): a stamp before taxi.js was in lost the cab
  (now `window.gas2Mailed` + `window.gas2AC` from the tap, replayed on load); a slow line sent a lone tyre (now the
  cab waits for its decoded art; 6 s past its time with none, no cab: the button turns red straight to the store);
  Back replayed the squeal (now `pagehide` stops every sound); plus: the reset clears the ride's timers + dust, a
  hidden page stops the engine + suspends the audio, a resize re-measures the cab, the stack holds still after an
  accepted stamp, the store is `/store/#radio-roulette`. The tester's scenarios rerun clean (G1, E, I, Slow 3G,
  hidden, stamp then ‹/›/flick, Back with bfcache: -12 dBFS tail -> one -42 dBFS blip); check.cjs 47 + 40 pass;
  page-b identical. ROUND 14 (`notes-r14`) = version 16, same URL (build `a788990`). Left for Dan (not fixed): small
  text + the hint over the cards at 375x553, a11y names/announcements, the cab's faint focus ring, the first record
  tap's ~0.25 s freeze (Chrome on a Mac), the HEAR IT demo audio (1.75 MB) fetched at card 4, Esc = the cab gone.
- Pushed on Dan's "push the page and commit" (2026-11-01): `c947709..f87379d` to `origin/feat/gas2-postcards` (17
  commits, all `danavivi-83`; not main, no deploy). Dan's phone test: "done" (2026-11-01; `notes-r14` empty); the
  Simulator's server (:4466) and the Wi-Fi link (10.0.0.103:4470) stopped. Next: Dan's word on merging to main (the
  site), the open items in todo 34.
- Open (Dan): (1) his word from the phone; more notes go to `notes-r10`;
  (2) painted art still only on his OK;
  (3) per-grade renders (Yoni) before any grade card plays its own sound; (4) later: this as page-b's phone layout;
  (5) the taxi on his iPhone with sound (the iOS Simulator plays it through the Mac; the phone itself needs a Wi-Fi URL from this Mac, on his OK).
- Then (Dan 2026-11-01: "merge to main", his pick "phone page only"): ONE squash commit on main with the phone page
  (`postcards.html`, `postcards/**`), the shared `taxi/**` (main's + the phone), the postcards' DESIGN.md rules, lessons,
  this entry and its todo section, the scene README lines. NOT in it: what the branch sits on from `revaudio-59`'s
  `feat/gas2-drone` (the drone intro, the radio knob changes, 4 page-b edits: unreviewed, they stay on the branches).
  The branch keeps the full history. Checked before the push: the postcards' check.cjs against the merged tree, and
  main's page-b with the new taxi.js (states + parked pixels identical). The phone page is a mockup in `tools/`: it is
  not on revaudio.net until it is built into the site (`src/`), a separate job.

## 2026-10-31 — GAS 2 page: the taxi to the store (Claude Code `danavivi-a5`, Dan's Mac) — BRANCH `feat/gas2-taxi`

Claim: OPEN `danavivi-a5`. Laptop page first (`page-b.html`), then the phone page. Handed over 2026-11-01: `taxi/**` -> `danavivi-83` (one script for page-b and the phone; the postcards entry above). Plan + state: `tasks/todo.md` top section.
On `main` (2026-10-31, Dan: "commit push to main"): the taxi as ONE commit (rounds 1-5, squashed from `feat/gas2-taxi`),
its line in main's `page-b.html` after the radio line, plus the store card anchors (`src/components/PluginCard.astro`,
from `feat/store-rr-landing`). NOT in it: the drone intro (`revaudio-59`'s `feat/gas2-drone`, gated on CATCH10), which
the taxi branch was built on top of; the taxi does not need it. The `tools/` scene is not part of the built site; the
store anchors are (live on deploy). Next: the phone page (postcards).
Files (mine): NEW `tools/_gas2-scene/taxi/**`; in `page-b.html` ONE `<link>` + `<script>` line (after the drone line),
nothing else of page-b's; one README line pair; the todo section; this entry. Branched from `origin/feat/gas2-drone`
@ `951936d` with no upstream; `revaudio-59` keeps its claim on `feat/gas2-drone` and its files.

## 2026-10-28 — GAS 2 page: the drone intro, from scratch (Claude Code `revaudio-59`, laptop 1) — BRANCH `feat/gas2-drone` — SQUASH-MERGED TO MAIN 2026-11-01

Claim: CLOSED 2026-11-01: squash-merged to main by `danavivi-83` on Dan's word (the 2026-11-01 laptop entry at the top).
Was: OPEN `revaudio-59`. Scene + benches BUILT; Dan picked the DEFAULT camera (TOP); the REAL ART is in (gpt-image-2, 2026-10-28, ~$2 with the roof sign); sidewalk blockout props removed; real headlights; catch the car = the CATCH10 coupon ticket (Paddle code: Gil, RevTasks #193). Waiting on Dan's look.
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
- Then (Dan, 2026-10-29: "let's work on the player's knobs, they need refining"): new radio knobs from the team's
  private knob tool (how, server, recipe: shared repo `.handoff-archive/HANDOFF-2026-10-29-gas2-radio-knobs.md`;
  `player/**` is Yoni's radio claim from `revaudio-cd`, touched here on Dan's word). Dan's look: machined metal body,
  copper-brown spun cap, white line index -> `player/img/knob-radio.webp` 653 KB (was 518); the strip's box is
  unchanged, so radio.css keeps its numbers. `drone/img/land.webp` re-rendered. Checked headless: a drag turns the new
  strip, no errors; `check.cjs` top 1440 + 390: landed mean 0.00, landing frame 2.56 / 1.47. Dan saw it on the page:
  "looks very good" (2026-10-29).
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
  take benched the plugin's own 3D pump instead, GAS2 repo branch `bench/pump-light`, deleted 10-29 on Dan's word): NEW
  `tools/_gas2-scene/light-bench.html` (+ its README line). The real page (`page-b.html?drone=0`) in a frame, panel
  docked right: LAMP (= `--sp-l`, the `.pumpLit` soft-light opacity), LAMP MIX (soft-light / overlay / screen), LAMP
  REACH (the gradient's 42 % / 88 % stops x reach), LAMP COLOUR (amber -> white), PUMP BRIGHTNESS / CONTRAST
  (`--sp-b` / `--sp-k`), SHADOW BEHIND (`--sp-s`); LAB / SHIPPED (A), ZOOM x1.5 / x2 on the pump, START, EXPORT.
  SHIPPED = page-b's Spotlight D, read from the file. page-b.html untouched. Checked headless: the frame at the start
  values = the plain page pixel for pixel (1280 x 915, max diff 1 / 255); a lamp change shows; no errors. Open it on
  4465 (`serve-nostore.py`): http://127.0.0.1:4465/light-bench.html. Next: Dan EXPORTs -> "apply" = the numbers into
  page-b's `.pumpLit` / `.pumpCut` CSS + the Spotlight D, then re-render `drone/img/land.webp` (the pump is in the
  landing frame) + the landing check; the bench goes once he has picked (as `?cue` did).
- Then Dan pasted his EXPORT (2026-10-29 11:54: lamp .67, overlay, reach 1.26, colour 1 = amber, pump 1.12, contrast
  1.08, shadow .21; was .3 / soft-light / 1 / 1 / 1.04 / 1.02 / .3) = apply: page-b `.pumpLit` overlay + stops 53 % /
  111 % (42 / 88 x 1.26); TUNE → Spotlight D = { light .67, pump 1.12, contrast 1.08, shadow .21, fade .15 }, contrast
  now its own slider (was 1 + (pump - 1) / 2), storage key spot3 -> spot4 (a browser's old TUNE numbers would hide the
  new defaults). Checked: the page = the bench at his values (1280 x 915, max diff 1 / 255; vars .67 / 1.12 / 1.08 /
  .21). `drone/img/land.webp` re-rendered (748 KB); check.cjs top 1440 + 390: landed vs ref-page mean 0.00 / 0.00,
  landframe 2.57 / 1.42 (was 2.56 / 1.47), no errors. `light-bench.html` + its README line removed (in git at `a81dfa9`).
- Then (Dan, 2026-10-29: "new knobs for the jukebox [= the radio] that fit the scene's lighting and vibe better"): four
  new looks; Dan: "wear out more the knobs and more like the shipped one" -> round 2 = the shipped knob + wear (worn /
  heavy / very heavy) + heavy in the scene's lamp light. Dan picked "HEAVY, LAMP LIGHT" (`247a7a7`), then "WORN
  replace" (`4fc6ddd`): `player/img/knob-radio.webp` = WORN (scuffed cap, rim rubbed to brass, dirt, a chipped line;
  the shipped light; 869 KB; same box). `drone/img/land.webp` re-rendered each time; check.cjs top 1440 + 390: landed
  mean 0.00 / 0.00, landframe 2.58 / 1.42. Recipes, candidates and their pick bench stay private (the shared note
  above); none of them enters this repo.

### Session end 2 (2026-10-29 evening, `revaudio-59`, close-session) — claim stays OPEN (CATCH10, then Dan's push word)

- State: branch `feat/gas2-drone` = origin (0 / 0), 24 commits ahead of origin/main, 58+ behind (main moved on; the
  go-live merge conflicts in `tasks/handoff.md` + `tasks/todo.md`, and `player/radio.css`'s knob comment: take this
  branch's). Today: `1d0f3c5` grade strip out, `9815ee6` / `b249801` / `ee2356f` radio knobs (ALU), `4ac3aad` /
  `7d36b36` scroll cue (chevrons), `a81dfa9` / `b527eaf` pump light (bench, then Dan's pick), `247a7a7` / `4fc6ddd`
  radio knobs WORN, close notes, `e55f953` private tool files out, `10eef58` Safari coupon fix. Shared (private, all
  pushed): the radio knob recipes + the moved knob tool port + the private part of these notes.
- Dan's decisions at the close (2026-10-29), all done: (1) the private knob tool's files left the PUBLIC repo: main
  `e1123fe` (pushed on his word "1א": 2 files out, docs + comments neutral; Pages deploy ran) and this branch
  `e55f953`; old versions stay in git history (his pick, no rewrite). At go-live: squash-merge (the branch's commit
  subjects name the tool), then ask Dan whether to delete the remote `feat/gas2-drone`. (2) GAS2 branch
  `bench/pump-light` + worktree `GAS2-light` deleted (local + remote). (4) worktree `gas2-page-view` removed; the
  local knob candidates folder + its `.git/info/exclude` line deleted; servers stopped except 4465.
- (3) Safari: Playwright WebKit 26.6 (Safari's engine) at 1440 + 390 (iPhone size, touch): the drone top, mid-descent,
  landed and the coupon ticket look like Chrome, no errors, pump light overlay + filter, knobs, `cqw` all applied.
  Found + fixed: `.coupon .cp` had `user-select: all` without `-webkit-` while html sets `-webkit-user-select: none`, so
  in Safari the code could not be selected by hand when the auto copy fails (`10eef58`). Owed: Dan on a real iPhone at
  http://10.0.0.103:4465/page-b.html (same Wi-Fi). Over LAN http the page is not a secure context: the auto copy
  ("Copied") does not run there, by design of the browser; the code is selectable. Not covered: Safari <= 15 / iOS
  <= 15 (no `cqw`, the layout would break).
- **CATCH10: Dan, 2026-10-29: "today at 18 the coupon will place"** = Gil creates it in Paddle today at 18:00 (RevTasks
  #193). After that: check the code works at checkout, then merge to main only on Dan's push word (`tasks/todo.md` 4e).
  The claim stays with `revaudio-59` until then; if this session is gone, the go-live session takes it (its name here).
- Background (laptop 1): `serve-nostore-lan.py 4465` (PID 26708, this scene, bound to 0.0.0.0 for the phone check,
  no-store; the Wi-Fi profile is Public and python.exe has an inbound allow rule): after the phone check stop it
  (`Stop-Process -Id 26708`) or rebind to 127.0.0.1. Not ours: `python -m http.server 8811` (PID 63816, another
  session's Drift UI server).
- Cleanup left: the main clone (`C:/RevAudio/Website/revaudio-website`, at `96c1ee7`, another session's checkout) still
  holds the old knob tool files until it is pulled; its ignored leftovers under `player/` go by hand then.

## 2026-10-29 — Blog: "How to glue a mix with saturation" (Claude Code `revaudio-59`, Yoni's laptop 2) — PUSHED TO MAIN = LIVE 2026-10-29 (Yoni: "deploy it")

Claim: CLOSED 2026-10-29. File: `src/content/blog/how-to-glue-a-mix-with-saturation.mdx` (new). Commit `111dd5e` on top of origin/main `87dc172`, made in a scratch worktree off origin/main because this clone is 3 ahead / 127 behind (the 3 ahead are another session's; untouched, not pushed).
- Ask (Yoni): a newsletter article on glue saturation, how shaving peaks with saturation glues a mix; keep the most-searched keywords. Written as a blog post the newsletter can link to: https://revaudio.net/blog/how-to-glue-a-mix-with-saturation/
- Keywords (no volume tool; picked from the phrases that own Google's results): how to glue a mix / glue a mix together, mix bus saturation, saturation vs compression, soft clipping, crest factor, glue compressor; two question H2s. Closes on the free GAS (/gas/).
- Checked: build green (30 pages, post in the blog index + sitemap), tanh table numbers computed, no em dashes; Pages deploy + smoke test green, live URL 200.
- Not done: figures (ideas in an MDX comment at the top of the file: soft-knee curve, crest before/after); the short newsletter email (60-120 words, `shared/marketing/2026-10-18-drift-beta-series/VOICE.md`) linking to it.
- Open (Yoni asked for date + author on every article; both already exist: post header "By the RevAudio team · <date> · N min read" + BlogPosting JSON-LD author/datePublished in `src/pages/blog/[slug].astro`). Offered, no answer yet: (1) make that byline line brighter / bigger, (2) add "By the RevAudio team" to the blog list cards (`src/pages/blog/index.astro`).
- Cleanup owed: stale `.git/worktrees/site-wt` metadata (Permission denied on prune, same as the older entries listed 2026-10-19).

## 2026-10-28 - Cart offer note + trial-form spam hint, branch `mid-trial-offer` (Claude Code `revaudio-9a`, Yoni's laptop 2) - PUSHED TO MAIN = LIVE 2026-10-29 (Yoni: "push deploy and OK")

Claim: CLOSED 2026-10-28. Worktree `Website/revaudio-website-midoffer` off origin/main `fab1336`, branch pushed (`9bc9576`, `524b67f`).
- `9bc9576` Cart.astro: the drawer note said "Your one-time 10% off <plugin>" for any `?offer=` code; the licence worker's new mid-trial offer (RevLimiter repo `590211d`, RevLimiter day-9 email, 20% / 48 h) needs "Your personal discount on <plugin> is applied at payment." Ship together with that worker deploy (website first, then the worker).
- `524b67f` TrialGateModal / TrialPlates / downloads.astro: "Not there in a minute? Look in Promotions or Spam." after a sign-up (51% of RevLimiter trial sign-ups never download from the link email, leads 2026-10-28).
- Checked: `npm run build` green; the new strings are in dist. Not checked in a browser.
- Do NOT pull into the main checkout as is: it holds another session's 3 local commits (`a5fa319` lessons, conflicts with origin on `tasks/lessons.md`); a pull --rebase from this session was aborted untouched.

## 2026-10-19 — DRIFT #hear: guide the visitor step by step, branch `drift-hear-guide` (Claude Code `revaudio-ef`, laptop 1) — PUSHED TO MAIN = LIVE 2026-10-28 (the user: "commit ודחוף לאתר" = commit and push to the site)

- 2026-10-28 (laptop 1, this session): the engraved wall (`tasks/todo.md` top section, K1-K2 + E1-E6) was picked on
  `bench/drift-hear-bench.html`, folded into DriftHear.astro / drift.css / hear.ts (`acaf46e`) and verified on the
  built dist (geometry = the bench within 0.5 px at 1440 / 390, 25-width overlap check, coach fit at 14 widths, fader
  + DRIFT cap driven, Edge + WebKit). Then origin/main (111 commits: Halloween skin, GAS 2 pages, DRIFT dates) merged
  in (conflicts only in this file + lessons.md, both kept), rebuilt, the checks re-run, and pushed to main. What went
  live is the whole branch since 10-19: the guide, the segment LCD, step 2's lit cap, the HEAR IT hero link and the
  wall. Owed: a real iPhone / Safari listen (Playwright's Windows WebKit has no AudioContext); the tidy pass in
  todo E5; `public/drift/knob3d-drift-65.webp` is unused now. The section bench now double-applies on the folded page.

Claim (owner `revaudio-ef`): CLOSED 2026-10-28 (pushed). History: closed at rv close 2026-10-26, RE-OPENED the same day by `revaudio-ef` for the step 2 fold:
`src/components/drift/DriftHear.astro`, `src/lib/drift/hear.ts`, `src/components/drift/DriftHero.astro`
(the HEAR IT link), the #hear + `.d-hero-hear` rules in `src/styles/drift.css`, `src/lib/drift/lcd.ts` + one line of
`src/lib/drift/bus.ts` (PAN via lcdText), `public/fonts/drift/DSEG14*`, `bench/drift-lcd-bench.html` + `bench/drift-lcd/`,
`bench/drift-play-bench.html` + `bench/drift-play/`, `bench/drift-panel-bench.html` + `bench/drift-panel/` +
`bench/serve-panel-bench.py`, `DESIGN.md` §9 (two lines), `tasks/todo.md` (top sections),
`tasks/drift-player-plan.md` (Round 9), `tasks/lessons.md` (three entries), this entry. Worktree
`Website/revaudio-website-hear` (off origin/main `d0168a6`; `node_modules` = junction to the main checkout's).
- State at rv close 2026-10-26: 7 commits on the branch (`9133d86`..`cca3cc4`) + this close commit. The LCD is APPROVED
  on the page (user: "מגניב נראה קול רצח" = looks killer). Step 2 (PLAY / STOP) has a bench,
  `bench/drift-play-bench.html` (serve the worktree root on 8796): 0 today's box, A chrome bezels + 24 LED bars round
  PLAY (step 3's language; recommended), B pilot lamps, C a lit PLAY cap; STOP stays unlit dark red in all three (one
  race-red per viewport). The user picked C ("C", 2026-10-26): FOLDED into the page and verified (`tasks/todo.md`
  "step 2", P3 + P4): heights identical at 11 widths, all guide states, reduced motion, focus ring (now round on every
  cap, #drive's too). The user has not seen it on the page yet.
- Then (2026-10-26) the panel under the player: three worn / crashed plates with Japanese + graffiti from gpt-image-2,
  on `bench/drift-panel-bench.html` (`python bench/serve-panel-bench.py`, 8797). WAITING: the user's pick (`tasks/todo.md`
  top section, K2-K4). The OpenAI key on laptop 1 was replaced by the user that day (the old one was rejected).
- Then resume the one-by-one review of the guide at item 3 ("3 PUSH DRIFT" + the ORIGINAL / DRIFT labels), then 4
  loading state, 5 checker crop, 6 試聴 off on phones, 7 HEAR IT hero link (item 2, the breathing, is covered by step 2).
- origin/main moved 46 commits past this branch's base `d0168a6` (seen 2026-10-26), DRIFT pages among them (`5007e66`
  DRIFT stays free on /drift, `fb3941f` feedback-form dates). Before "push": rebase or merge onto origin/main, resolve
  this file by hand, rebuild, re-run the #hear checks (heights, guide states, coach fit, reduced motion).
Plan, findings, checks: `tasks/todo.md` top section.
- What: opens on the ORIGINAL; the LCD's left header cell coaches (PRESS PLAY -> PUSH DRIFT -> PUSH AGAIN: ORIGINAL
  -> NOW PLAYING); the next step's key + control breathe (PLAY's old glow), the others rest dim; ORIGINAL / DRIFT
  under the button, the one you hear lit; step 3 = "3 PUSH DRIFT"; the checker strip no longer runs under the
  title (<= ~770 px), 試聴 off on phones; hero: a "HEAR IT" key under the tagline (desktop + 601-1099, not phones).
- Then the screen became a car-stereo segment LCD (DSEG14 + ghost cells + a segment bar-graph waveform; user's pick B
  on `bench/drift-lcd-bench.html`, serve the worktree root on 8796). Same heights; checks in `tasks/todo.md` (LCD).
- Answers (laptop 1 user, 2026-10-19): default ORIGINAL, "3 PUSH DRIFT", no HEADPHONES tag, hero link yes.
- Next: the user looks at it (local dist: `python -m http.server 4417 --bind 127.0.0.1` in the worktree's `dist/`,
  then http://127.0.0.1:4417/drift/), then "push" = merge to main = live (only on the user's word). A real iPhone /
  Safari listen is still owed.
- Note: the main clone's `tasks/handoff.md` was claimed by `revaudio-2a` (uncommitted), so this claim lives on the
  branch; expect a small merge in this file at push time.

## 2026-10-26 - /drift/feedback + survey: the form keeps DRIFT free (Claude Code `revaudio-67`, Yoni's laptop 2) - goes live WITH the worker deploy

Claim: CLOSED 2026-10-26. Files: `src/pages/drift/feedback.astro`, `src/data/beta-survey.ts` (intro + thanks, EN + HE; the HE intro still said Nov 1), `src/data/site.ts` (comment).
- Pairs with licence worker `ec24229` (the form mints a 100%-off DRIFTFREE code). Push together with its deploy, never before (the page would promise free while the worker still mints $30 off).
- Checked: build green; dist /drift + /drift/feedback: no $30 / $39.

## 2026-10-26 - DRIFT: the feedback form keeps DRIFT FREE (was $39) on /drift (Claude Code `revaudio-67`, Yoni's laptop 2) - PUSHED TO MAIN = LIVE

Claim: CLOSED 2026-10-26. File: `src/data/drift.ts` (`driverPriceUsd: 0` = FREE; `driverValue()` feeds the road chip + the feedback route).
- Ask (Yoni): the checkpoint gives DRIFT free, not $39; scope "email + website" (email 01 = revaudio-shared `6bb43b2`).
- Left as is on purpose: `/drift/feedback` + `beta-survey.ts` still say "$30 off code" / "$39 with this code", because that is what the worker really mints today. They change together with the worker + a 100%-off Paddle code (Yoni's "deploy the worker").
- Checked: build green; /drift dist has no $39; road screenshot at 1280 = FILLED THE FORM FREE.

## 2026-10-26 - DRIFT dates moved: feedback form closes Fri Nov 20, on sale Tue Dec 1 (Claude Code, Yoni's laptop 2) - PUSHED TO MAIN = LIVE (Yoni: "push deploy")

Claim: CLOSED 2026-10-26. Files: `src/data/drift.ts` (feedbackClosesLabel, releaseLabel, header note), `src/data/beta-survey.ts` (intro), `src/pages/drift/feedback.astro` (code fine print), `src/components/drift/DriftHero.astro` + `DriftKeep.astro` (comments; the DriftKeep one ships in the HTML).
- Ask (Yoni): the form date Oct 24 -> Nov 20, the sale date Nov 1 -> Dec 1 (so the road stays in order). Same change in DRIFT email 01 (shared `01f3c26`).
- Checked: build green; dist has no Oct 24 / Nov 1 left; screenshots of the road (NOW / NOV 20 / DEC 1) and the hero (ETA DEC 1) at 1280.
- Owed: the Cart handoff below says "DRIFT on sale Sun Nov 1" in `plugins.ts`: that day is now Tue Dec 1. The licence worker's DRIFT emails (form code, trial sequence, email 01 text) still say Oct 24 / Nov 1 (RevLimiter repo `worker.js`).

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

## 2026-10-24 — GAS 2 page: the PHONE page, "zoom in on the plugin" (Claude Code, Dan's Mac, Dan on his phone) — BRANCH `feat/gas2-phone`, waiting for Dan's look

Claim: OPEN. Files: `tools/_gas2-scene/phone.html` + `tools/_gas2-scene/phone/*.webp` (new; git-excluded folder, so `git add -f`).
- Dan tried Swipe / Walk / Stack (entry below) on his phone: "they don't work for me". Restart, his idea: zoom in on the plugin itself,
  the player there, the readings there. His approved summary: the globe + gauge zoomed, the station soft behind, the readings on it,
  the pump's grade keys = the player (no radio on phones), MAIL ME THE KEYS = the ticket, the 3 posters under. Simple and minimal.
- Built: the pump is the PLUGIN's own render, re-baked at 4x from the GAS2 repo (`bench/pump-lab.html?bake=1&knobs=bare`, `LAB.P.scale=4`,
  `tools/ui/bake-pump-page.js`; real GPU Chrome; nothing written to the GAS2 repo), placed in the plugin's base px (`--z`), layer order
  = the plugin's. Hero: globe (= the name, h1 kept for readers) + gauge, needle sweeps to 160 % on load; zoom ~118 % of the width, eased
  on short screens so the gauge is never cut and the button stays in view. HEAR IT: counter + keys; tap = GAS 2, lit key again = the
  original, ■ Stop; the needle follows (140 % / 0); the counter shows short-term loudness off the output (no K-weighting; mockup).
  Then the 3 posters in a shop-window frame, then MAIL ME THE KEYS + mailbox + chalkboard on the stucco. ~4.8 screens at 390x844.
- ⚠️ Every grade plays Yoni's one HIP HOP render (PREMIUM 140 %) until per-grade renders exist: needs 3 renders of one mix
  (REGULAR / PREMIUM / RACE) + the original before this ships.
- Checked: WebKit 390x844 / 393x659 / 375x667 / 430x932 (gauge whole, button in the first screen, no overflow); Chrome: keys play,
  original toggle, stop, counter, the ticket from the button / the poster / the box; iOS Simulator (iPhone 17 Pro) first screen. Not
  checked: a real iPhone, audio by ear.
- Dan views it at https://claude.ai/artifact/RY5g1zHQsdmQRUkisbEqvc (private; fonts inlined, audio as .mp4).
- Research brief behind it (10 phone-native sites, patterns, 3 directions): session scratchpad `research/` (not in git).
- Dan on his phone, 2026-10-24: "very cool, I like the direction it's going, commit". Rule written to DESIGN.md §7 (rebuild for
  portrait, never crop the desktop scene).
- 2026-10-24 Dan: no needle on his phone (a zero-size filtered carrier) -> rebuilt as real-size boxes turning about the pivot.
- 2026-10-24 Dan: "make a bench so I can move stuff around in my phone". `tools/_gas2-scene/phone-bench.js` (git-excluded, never
  commit) on the real page (`phone.html#bench` locally); phone bench Artifact https://claude.ai/artifact/VmFDkUMg6n1mCCg4PE4aY8
  (db capability). BENCH -> tap a part, drag, SIZE / TURN, arrows, SAVE -> db doc `bench/phone` (`ArtifactData get`, collection
  `bench`, doc `phone`) + clipboard. Values = px / scale / deg at Dan's screen (the dump carries w/h/dpr); the two pumps' SIZE =
  `--zk` (a real re-flow), the hero pump's up/down = `--topd`. Bake: convert px to the page's units, then delete the deltas.
- 2026-10-24 Dan: "under the Fill it up remove all the page, keep one page, no scroll" -> HEAR IT, the window posters, the
  mailbox block, the footer and their assets/JS removed; html/body locked to one screen, the hero centred (100svh). Checked
  390x844 / 393x659 / 375x667 / 430x932: page height = the screen. Both Artifacts updated (page v3, bench v2).
- Next: bake Dan's bench save, Dan's polish notes, the per-grade renders (Yoni), then it moves into page-b as the `@media (max-width: 760px)` layout
  (the scene hidden on phones).

- 2026-10-26 Dan picked **A** for the screen under the hero (A/B preview Artifact https://claude.ai/artifact/P3A86oo9tomiujdFnfPz5g,
  now obsolete): `.grades` = THREE GRADES. PICK ONE. + three rows (the pump's key, 4x, + headline + line); a tap lights one key
  (no sound yet). The page scrolls again: hero (one screen) + grades (one screen). `.bg` now clips its blur overhang. Page Artifact
  v4, bench v3 (bench parts + the grades title and rows). Decision 1 below is DONE.

- 2026-10-26 Dan: the player = "copy the jukebox we have on the GAS page, same songs, same everything" (after a pedal-vs-gauge
  bench he rejected: "neither"). `phone.html` gained `.hear`: /gas's own title + line + the live `<gas-mixer>` (public/gas-mixer,
  Yoni's component, untouched; under 760 px it builds its pedal toy). Locally `tools/_gas2-scene/gas-mixer` is a symlink to
  `public/gas-mixer` (excluded) so `/gas-mixer/...` resolves on :4464; the Artifacts carry a copy (paths made relative, .m4a ->
  .mp4, fonts inlined). ⚠️ The toy's plate reads GET GAS FREE (GAS 1's download) and is GAS 1's mix: Dan's call. Page v5, bench v4.

- 2026-10-26: Dan deleted the session's Artifacts from his account (options chooser, player bench, phone bench, and the page
  itself, https://claude.ai/artifact/RY5g1zHQsdmQRUkisbEqvc). The work is all on this branch + local :4464; a phone link needs a
  fresh publish (new URL) on Dan's ask. Packager recipe: derive body-only from `phone.html` (title + style + body), inline the
  fonts, `/gas-mixer/` -> `gas-mixer/`, copy `public/gas-mixer` with `.m4a` -> `.mp4` and its fonts.css inlined.

### Session close 2026-10-26 (/close-session)

**State.** Branch `feat/gas2-phone` (worktree `.claude/worktrees/gas2-phone`) = `origin/feat/gas2-phone` (0 ahead / 0 behind),
7 commits on top of `feat/gas2-page`@`c4302cf`; `feat/gas2-page` has moved 24 commits on since (Yoni's radio round 3+), not merged
in here. The only uncommitted change is this session-close block. Untracked on purpose: `tools/_gas2-scene/phone-bench.js` (the
bench; git-excluded, never commit).

**Unverified.**
- The needle fix on Dan's real phone (rebuilt after "no needle"; seen in the iOS Simulator only). Dan has not confirmed it since.
- The one-screen page on a real iPhone (checked headless WebKit at 4 sizes, page height = screen height).
- The bench on a real phone: no save has reached the bench db yet (`bench` collection empty 2026-10-26), and the Simulator's
  clipboard is empty, so Dan has not saved a bench round.

**Background processes (not this session's to kill unless Dan says).**
- `python3 -m http.server 4464` from this worktree's `tools/_gas2-scene` (pid 37789): the page + `phone.html#bench`. Kill: `kill 37789`.
- iOS Simulator iPhone 17 Pro (B0B0F88C-95BB-40DA-B292-A73157B50757) booted with `127.0.0.1:4464/phone.html#bench` open in Safari
  (claude.ai Artifacts show "Sign in" there: the Simulator's Safari is not signed in). Stop: `xcrun simctl shutdown B0B0F88C-95BB-40DA-B292-A73157B50757`.
- Not this session's: :4461 pid 29302 (GAS2 plugin UI), :4462 pid 41222 (the gas2-page worktree).

**Decisions open for the next session.**
1. **The screen under the hero** (Dan 2026-10-26: "explain how simple the plugin is, three modes, a short line for each one, let's
   think about it"). Proposed title THREE GRADES. PICK ONE. + REGULAR "Smooth and warm. For mixes that are already good." /
   PREMIUM "The signature. Thick lows, clear mids, silky air." / RACE "Punchy and bright. For loud, modern mixes." (from GAS2
   `docs/BRIEF.md`). Layout A (recommended: three rows, the pump's real key image + name + line) vs B (the keys in a row, one line that
   changes on tap). Waiting for Dan's A/B + copy OK. Note: this re-opens scrolling, which he locked to one screen on 2026-10-24.
   No "one knob" / "that's it" (GAS dial + IN/OUT exist; DESIGN.md copy rule).
2. **Tap a grade to hear it**: needs Yoni's per-grade renders of one mix (REGULAR / PREMIUM / RACE + the original).
3. **Bake the bench** when Dan saves: the claude.ai bench Artifact is gone (deleted from Dan's account 2026-10-26, no save ever
   reached it); the local bench `phone.html#bench` remains: its SAVE copies to the clipboard (`xcrun simctl pbpaste <udid>` in the
   Simulator). Republish a bench Artifact only if Dan asks.
4. **Into page-b**: the phone page becomes page-b's `@media (max-width: 760px)` layout, after rebasing on `feat/gas2-page`.
5. **page-b desktop bugs found 2026-10-23** (fixed only in the phone options, now superseded): the closed plugin veil's iframe keeps
   taps (`.veil:not(.open) .plug { display: none; }`); the reduced-motion rule misses the button's `::after` shine. Dan's word to fix.
6. ~~Old Artifact (the Swipe / Walk / Stack chooser)~~: gone from Dan's account (deleted) 2026-10-26.

**Suggested commit.** `docs(handoff): GAS 2 phone page session close (2026-10-26)`: `tasks/handoff.md` only.

**Cleanup.** The superseded `phone-{swipe,walk,stack}.html` are still committed on this branch (`e98ea01`): drop them in the
page-b merge. Node 26.0.0 on Dan's Mac has CVE-2026-111497 (upgrade to 26.12.1+).

## 2026-10-23 — GAS 2 page: three PHONE options, Swipe / Walk / Stack (Claude Code, Dan's Mac, Dan on his phone) — SUPERSEDED 2026-10-24

Claim: CLOSED 2026-10-24 (Dan: they don't work for him on the phone; replaced by the entry above). Files: `tools/_gas2-scene/phone-{swipe,walk,stack}.html` only (new; git-excluded folder, so `git add -f`).
Worktree `.claude/worktrees/gas2-phone`, branched from `feat/gas2-page` at `c4302cf`; static server :4464 (pid 37789) from its `tools/_gas2-scene`.
- Ask (Dan, on his phone): the GAS 2 page for phones, "same principles, same posters, same layout vibe", several options, right in one go.
- Each file = `page-b.html` (c4302cf) + ONE `@media (max-width: 760px)` block `/* ═══ PHONE · <OPTION> ═══ */` + one matchMedia-gated
  script + the minimum markup (all `hidden` / unstyled on desktop). Desktop renders pixel-identical to page-b (checked 1141x636,
  1440x900, 800x900). The winner pastes into page-b verbatim.
- SWIPE: the stage is a sideways scroller (100svh, scene 150svh wide = laptop scale), opens on the sky + readings, mandatory snap to
  store front / pump / radio, a "← Walk the lot" caption + one 56 px peek. WALK: a sticky 100lvh frame, page scroll dollies the camera
  with flat holds (readings → store → pump → radio), then an end band with the button. STACK: the readings screen, then portrait crops
  of the same scene (sign strip → pump → mail + chalkboard → radio), each live prop moved into its one shot, feathered seams.
- All three: same readings recipe in vw/svh (GAS2 ~71-74vw), always-on pump caption, grade tap = pick + tip 2.4 s, the photo's bottom
  melts into the page (no hard line), FOCUS blur off on phones (HUG + DUSK kept).
- Checked (WebKit + Chromium, 390x844 / 375x667 / 393x659 / 430x932): every prop tapped by script opens the right thing, no overflow,
  no page errors except WebKit's missing AAC decoder (page-b throws the same). iOS Simulator (iPhone 17 Pro, 402x714): Swipe opens on
  the sky and stays (scrollLeft = max through 4 s), Walk's first screen right. NOT checked: a real iPhone (momentum, snap feel, toolbar
  collapse, the keyboard over the ticket), audio by ear.
- Dan views them at https://claude.ai/artifact/WaDdeVGPhHdxXxseH22H6H (private; a chooser + the three pages + assets + the GAS 2
  plugin UI copied from the GAS2 repo for the pump; fonts inlined; the radio renders renamed .m4a → .mp4 because the host won't serve .m4a).
  Packager: `build_artifact.py` in the session scratchpad (not in git).
- 🔴 page-b bugs found on the way (fixed in the phone blocks only, desktop untouched): (1) after the plugin veil closes its iframe keeps
  swallowing taps in its rect (WebKit touch): fix `.veil:not(.open) .plug { display: none; }`; (2) the reduced-motion rule misses the
  button's `::after` shine, so it keeps running.
- ⚠️ The radio moved on: `feat/gas2-page` gained Yoni's radio round 3 (`e96ef81`..`7a4a318`: the radio stands IN the scene, no close-up)
  after this branch was cut, and its `radio.css` has no phone rules. The three options use the c4302cf close-up player. Rebase this
  branch only after Dan's pick, and then the phone radio is Yoni's lane (one writer per file set).
- Next: Dan picks Swipe / Walk / Stack on his phone → paste that block into page-b (strip Walk's `window.gas2Walk` test hook), delete
  the other two files, rebase on `feat/gas2-page`, re-check with Yoni's in-scene radio.

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
  keys light up), Yoni's new knobs (volume, tuning), red jewel while playing. Caption under the bench, inside the
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
  - Shared, uncommitted: Yoni's radio knob card (the private knob tool's library,
    10-23 17:25) -> commit on his "save"; `memory/feedback_placement_bench_early.md` + its
    MEMORY.md line (mine); MEMORY.md also holds another session's uncommitted line (Hebrew-layout), not mine.
- Background processes (all on Yoni's laptop 2, started this session):
  - `python -m http.server 4462` (page-b), PID 13620. Kill: `Stop-Process -Id 13620`.
  - The private knob tool's server on 8797, PID 2836. Kill: `Stop-Process -Id 2836`.
  - `python -m http.server 8793` from `C:/RevAudio` (knob bake), PID 40696. Kill: `Stop-Process -Id 40696`.
- Unverified: real Safari / Firefox / a real phone; sound by ear in a browser (headless only measured gains + loudness).
- Next session decides: (1) POP / ROCK GAS 2 settings (caption) + ELECTRONIC renders, from Yoni; (2) "push shared";
  (3) push the 3 website-main notes commits or not (live deploy); (4) Dan's answers: phone crop, Safari check.
- Cleanup: a knob bake output under `player/` (laptop 2), untracked; since 2026-10-29 the knob tool's files live in the
  shared repo, so delete that folder's leftovers there (no longer gitignored).


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

## 2026-10-19 — Claude Code `revaudio-a5` (Yoni's laptop 2) — OPEN THE HOOD overflow fix LIVE + this clone re-synced

Claim: CLOSED 2026-10-19. Files: `src/pages/gas.astro`, `src/pages/[slug].astro` (one line each); `tasks/handoff.md`, `tasks/lessons.md`, `tasks/pagespeed-plan-2026-10.md` (rescue).
- Bug (Yoni's screenshot): on /gas, OPEN THE HOOD drew the 3-track mixer over the footer. Cause: `.gas-mixer-el` /
  `.station-mixer-el` kept their pre-build `max-height` (632 / 558 px) after `.ready`, so the taller hood content
  overflowed the host. Fix: `.ready { aspect-ratio: auto; max-height: none; }` on both players. Radio Roulette had the same bug.
- PUSHED TO MAIN = LIVE (Yoni: "push"): `aba5081`; Pages deploy green. Live check (playwright-core, 1900x1000, hood
  opened, no injection): GAS host 1495 px, footer below the mixer; RR host 1442 px, content inside the host.
- Clone re-sync: this checkout was 18 ahead / 151 behind with uncommitted notes. `git cherry` = all 18 already upstream
  (patch-equal), so a plain rebase dropped them. The uncommitted notes (revaudio-28 / -c7 / -71 entries, the Edge
  glow lesson, the PageSpeed 83 line) were real and missing upstream: rescued as `d54c4da`, conflicts resolved by
  hand keeping both sides (diff vs origin = additions only). NOT PUSHED: Yoni was asked "push?" and closed instead.
  Backup of the pre-rebase edits: session scratchpad `website-rescue/` (laptop-only, temporary).
- Untracked, untouched: root `HANDOFF.md` (2026-09-07) and `.handoff-archive/` (2026-08-29), old relics.
- Cleanup owed: `C:\RevAudio\Website\rw-gas-hood` half-deleted (locked, likely VS Code), delete it; `.git/worktrees/`
  holds stale entries git can't delete (Permission denied: revaudio-website-glue/-glue2/-src/-trialsrc, rw-gas-hood,
  wt-*), likely desktop.ini (memory `feedback_desktop_ini_poisons_all_repos`).
- Next: on "push", `git pull --rebase` (origin moved 1 commit since) then push `d54c4da` + this entry (notes only; site output unchanged).

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

## 2026-10-14 — Claude Code `revaudio-28` (Yoni's laptop) — /drift phone #fx carousel: GLUE COMP pedal added + lit, DONE, pushed (Yoni: "push")

Claim: CLOSED 2026-10-14. Files: `src/components/drift/DriftFx.astro`, `src/styles/drift.css` (one `.s-glue` accent
line), `tools/shoot-drift-fx-pedals.mjs`, new `src/assets/seasons/drift/pedal-glue.png`.

### State at session end

- Worked in throwaway worktrees off origin/main (this clone is 18 ahead / 106 behind and has other sessions' edits),
  pushed straight to main: `e84c597` (GLUE COMP = the phone carousel's 5th slide, NEON CYAN frame, "Console bus
  glue. Last in line.") and `ee84c0b` (pedal re-shot lit: power on, GR feed held at 10 dB = needle mid-arc, readout
  -10.0). Both deploys + smoke tests green; live /drift/ serves the new pedal at phone width. Laptop rack unchanged.
- Pedal shot from DRIFT 5.2.10's own UI (`Plugins/Drift/Source/ui/public` served read-only on :4399):
  `node tools/shoot-drift-fx-pedals.mjs <url> glue` (the tool now powers GLUE on and sets `window.__gluegr`).
- This clone: nothing of mine uncommitted except this entry. Branches `drift-glue-carousel` / `drift-glue-lit` deleted.

### Cleanup TODOs

- Delete the leftover folders `C:\RevAudio\Website\revaudio-website-glue` and `revaudio-website-glue2` (worktree
  removal hit "Permission denied", likely VS Code holding them; branches already gone, node_modules junctions
  already removed, so a plain delete is safe), then `git worktree prune`.

## 2026-10-13 — Claude Code `revaudio-c7` (Yoni's laptop) — both site players redesigned as toys, bench round 1, PAUSED for Yoni's review

Claim: OPEN, paused by Yoni ("lets keep this stage we continue tomorrow"). Files owned: `bench/station-mixer-bench.html`,
`bench/gas-mixer-bench.html`, `tools/station-mixer/gen_assets.py`, `tools/gas-mixer/gen_assets.py`,
`tools/gas-mixer/process_toy.py`, `tasks/player-toy-redesign-plan.md`, the "Hear it" lines + placeholder CSS in
`src/pages/[slug].astro` and `src/pages/gas.astro`. Plan, spec, every word of copy and the round-1 test log:
`tasks/player-toy-redesign-plan.md`.

### State at session end

- Branch `main` (this clone: 18 ahead / 102 behind origin). One commit this session, NOT pushed: `c4f08e6` "Both
  site players: toy first, mixer under the hood (bench round 1)". Nothing exported to `public/`, site not built.
- Uncommitted (mine): this entry + one line in `tasks/lessons.md` (screen-blend glow).
- Not mine, untouched: the older uncommitted block below in this file, `tasks/pagespeed-plan-2026-10.md`, root
  `HANDOFF.md`, `.handoff-archive/`.
- Art (gitignored, `bench/assets/*/img/`): gpt-image-1 renders in `img/gen/`, trimmed copies in `img/` (accel-pedal-a/b,
  floor-rubber.jpg, bat-toggle, porcelain-sign, hood-latch [both players], onair-lamp, rr-plate-cta, fuel-gauge-xl).

### Unverified

- Yoni has not reviewed either toy yet (opened both benches in his browser at the end; his signal: "good job").
- UI sound levels (static, ticks, thumps) never heard by a person. Real iPhone, Firefox, real-speed motion untested
  (headless Edge only).

### Background processes

- `python -m http.server 8794` from `bench/` (bg `bykcofmou`), PID 54304. Kill: `Stop-Process -Id 54304`.

### Things the next session needs to decide

1. **Yoni's review of both toys** (plan steps 4 + 6): look, feel, words, sounds. Fold every correction into the plan
   (and `design-language.md` if it is a visual rule).
2. **Pedal A or B** (GAS): A = ribbed rubber pad (default), B = chrome bare-foot hot-rod pedal (`?pedal=b`). Then
   hardcode the pick and drop the `PEDAL` switch.
3. Then plan steps 8-9: run both `export_component.py`, `npm run build`, test `dist/` under the live CSP, deploy from a
   fresh worktree off origin/main (cherry-pick `c4f08e6` + follow-ups; the page edits may conflict with the 102
   newer origin commits). Push only on "push".

## 2026-10-08 — Radio Roulette Station Mixer: LIVE + phone fix, DONE (Claude Code `revaudio-71` / `revaudio-4a`, Yoni's laptop) — pushed `642abc0` + `acc1b26` (Yoni: "push")

Claim closed 2026-10-08. Nothing in flight.

### State at session end

- **LIVE on /radio-roulette:** the Station Mixer is the "Hear it" section (no other name, Yoni), a `<station-mixer>`
  web component in the garage wall.
  - Desktop: full 4-loop mixer.
  - Phones below 760 px: the simple phone player.
  - Yoni confirmed: desktop "perfect", phone "loading perfectly" / "it works well!".
  - Everything is in `tasks/radio-roulette-station-mixer-plan.md`.
- **Deploy route:** the worktree `../revaudio-website-smx`, branch `station-mixer-deploy`, now level with origin/main
  `d08aea8` (the GAS mixer went live after mine from `../revaudio-website-gmx`).
- **This clone's `main`** (75 behind / 14 ahead of origin): the original copies of my pushed commits (git drops them on
  the next rebase), the GAS session's commits, and ONE unpushed commit of mine: `81a00e0` (plan note: no name, phones
  confirmed). It can ride along with any later push from the deploy worktree (cherry-pick it there).
- **Not mine, untouched:** `tasks/pagespeed-plan-2026-10.md` (modified), root `HANDOFF.md`, `.handoff-archive/`
  (untracked).
- **Edit / redeploy the mixer:**
  1. change `bench/station-mixer-bench.html`
  2. `python tools/station-mixer/export_component.py` (writes `public/station-mixer/`)
  3. build, then test `dist/` under the LIVE CSP + X-Frame-Options (scratch `csp-serve.py` pattern: memory
     `feedback_site_interactive_embeds`)
  4. cherry-pick onto the deploy worktree
  5. push only on "push"
- **AI assets:** `python tools/station-mixer/gen_assets.py <slug> --force`, then `process_gen.py`.

### Background processes (Yoni's laptop, left running)

- `npx astro dev` on :4321, PID 38304 (bg `bax5niq35`). Kill: `Stop-Process -Id 38304`.
- `python -m http.server 8794` (the bench, from `bench/`), PID 5600 (bg `bnyzwko2e`). Kill: `Stop-Process -Id 5600`.
- `csp-serve.py` on :4399 (old dist from the main clone), PID 10200 (bg `bedti5smq`). Kill: `Stop-Process -Id 10200`.
- `csp-serve.py` on :4398 (dist of the deploy worktree), PID 52084 (bg `b05113pco`). Kill: `Stop-Process -Id 52084`.

### Open (nothing blocking)

- Real Safari on macOS was never checked (Playwright's Windows WebKit has no Web Audio). iPhone works per Yoni.
- The RevLimiter ARM on the master is a browser PREVIEW (Yoni's call); the copy says "a taste of". It stays that way
  unless Yoni decides otherwise.

### Memory written this session

- `feedback_site_interactive_embeds.md`: no iframes on revaudio.net (XFO DENY / frame-src), self-host fonts, web
  component + shadow DOM, decode only audible audio (the iPhone crash), phones get a simple layout.

### Earlier state (bench rounds 1-2, kept for history)

Claim closed 2026-10-08. Nothing in flight. Plan and every decision: `tasks/radio-roulette-station-mixer-plan.md`
(sections "Bench round 1" and "Bench round 2").

### State at session end

Branch `main`, 3 commits ahead of origin (none pushed):
- `631fb80` plan: Yoni renders 5 stations per loop
- `4145e60` bench round 1 + `tools/station-mixer/*.py`
- `29d8c91` bench round 2

Not this session's (left untouched): `tasks/pagespeed-plan-2026-10.md` (modified), the untracked root `HANDOFF.md` and
`.handoff-archive/`.

- **Bench:** `bench/station-mixer-bench.html`, served over http from `bench/` (`python -m http.server 8794`).
- **Assets:** `bench/assets/station-mixer/` (gitignored, ~70 MB):
  - `audio/`: 24 stems as 24-bit FLAC, 6 RevLimiter 3.2.1 masters (`rl_*`, now used only for calibration), `manifest.json`
  - `img/`: plate, knob layers, RevLimiter ARM crop
- **Rebuild:**
  - stems: `tools/station-mixer/process_stems.py` (source MP3s: `C:\shirimmmmmm\<loop>_dry/station1..5.mp3`)
  - RevLimiter masters: `render_revlimiter.py`; pedalboard loads the INNER DLL `RevLimiter.vst3/Contents/x86_64-win/RevLimiter.vst3`

### Unverified

- No human has listened to the bench yet. Yoni approved the look and the direction ("cool ... very good job").
- Checked in Chromium only, with Playwright: play/stop, auto RADIO ON after 2 bars, stations, solo/mute, SPIN,
  ARM keeps the stations, no console errors. Not tested: Firefox, Safari, iPhone, real-speed reel motion (headless
  throttles animation frames).
- The RevLimiter preview is a Web Audio chain, matched to the real render's loudness on the all-DRY mix
  (-7.2 vs -7.2). Nobody has compared it with the real render by ear.

### Background processes

- `python -m http.server 8794 --bind 127.0.0.1` (bench), bg ID `bdlydh5s6`, PID 45828.
  Kill: `Stop-Process -Id 45828`.

### Things the next session needs to decide

1. **Mixer name.** Still open (Station Mixer / Garage Radio / Jam Room).
2. **Photoreal assets.** The cassette deck, name plates and S/M lenses are drawn in CSS/SVG. Do they get AI photo
   assets before going live (design law 2)? Yoni hasn't been asked.
3. **The rest of the plan:**
   - encode to AAC with padding (step 3)
   - phone layout 2x2 (step 7: the 1100 px stage only scales down today)
   - `StationMixer.astro` + `plugins.ts` wiring (step 6)
   - tests (step 8), then Yoni's localhost review and "push"
4. **Preview wording.** The RevLimiter copy says "preview / a taste of" because it isn't RevLimiter's DSP. It stays
   that way unless Yoni decides otherwise.

### Suggested commit splits

- Nothing of this session's is uncommitted. Push only on the word "push". `git log origin/main..HEAD` shows only this
  session's 3 commits right now.

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
