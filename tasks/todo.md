# Home opening: the long garage (Dan 2026-11-02, danavivi-7a; danavivi-4e from 2026-11-03) — ACTIVE PROJECT (Dan 2026-11-03: "from now on"); step 1 built, dressed with Dan round by round

Dan (2026-11-02): the first screen = a long rectangular room (מלבן) packed with detail: guitars, synths, garage
tools, a car; at the far end a small TV; scrolling walks down the room to it and locks into the live TV (the LCD).
Restarted from scratch after the first prototype (`tools/_home-opening/`, one wall + a zoom, commit `f35fdf0`): its
lock-in hand-off is reused, its room is not. Dan: plan with him first, then one piece at a time, shown before the next.

## The rebuild (Dan 2026-11-04, `danavivi-09`): real 3D, AI makes objects, never frames
Why: the 3 Nov art failed. Cut-outs read flat; the projected painting smeared as the camera moved; the AI repaints
swapped the plugin CRTs for props and garbled poster text; the film was 1080p-soft and flipped to a still mid-scroll.
Dan loved the first painted shot (`assets/skins/default/paint/walk-000.webp`): it is the look reference. Plan page
(rounds 1 + 2 answered, answers in its db `answers/round-1`, `answers/round-2`):
https://claude.ai/artifact/ByhrvCC1RwY3pzi9izrHun

Decisions (Dan, rounds 1-2, 2026-11-04):
- Every pixel is rendered from the real 3D room; AI only makes single objects / textures / posters. One delivery mode
  for the whole walk, no film, no switching.
- Must stay, checked on every render: RevLimiter's CRT on the desk, Radio Roulette's CRT high right, DRIFT's CRT, the
  live TV, the REVAUDIO neon, the coupe on its lift half out the door, the drum kit + throne, the studio corner.
  RevFX's CRT and the GAS 2 posters + COMING SOON plate stay too, removable "smartly without changing the whole
  room" (a slot removal, part of the swap test).
- The room must keep moving (sway, dust, flicker, the car idling): live 3D (way A) is the favourite; pre-rendered (B)
  stays in the bake-off as the true-light quality bar. Splat world (C): research only.
- Tests = automatic checks on every version: plugins present at every walk step, no flashes scrolling down and up,
  sharp at 1920 / 1440 / 1141 + iPhone, matches the bench, swap / remove test, size + speed.
- Team: the bake-off + 2 researchers (assets + the car; live-3D techniques + the splat check). Builder = the main
  session; Tester A (live) + Tester B (pre-rendered) on Opus; critics: look (Fable), walk, Dan's-eye, devil's advocate,
  web (Opus); a fixer (Fable). Up to 2 fix rounds; Dan sees what passed, with the critics' notes. First a blind-spot
  agent reviews the whole plan (Dan's ask).
- Test corner: the far end (desk, plugin CRTs, TV). Phones: the same room, lighter. Credits: up to 40 for the test
  phase. Blender on Dan's Mac: yes. Night by default; a skin may change the time. The look lock comes before the critics.
- Car (Dan 2026-11-04): Supra-inspired, no badges, gloss black like his reference (a black Supra MK4 / A80 photo): big
  rear wing, round quad taillights, deep-dish wheels, a RevAudio plate, the shape slightly ours; no Toyota or Supra
  marks (trademark). The photo is third-party: kept local only in `tools/_home-opening/refs/` (git-excluded), a
  reference, never shipped or textured from.
- Blender 5.2.3 LTS installed on Dan's Mac (brew cask, 2026-11-04).

Steps:
- [x] Plan page, rounds 1 + 2 answered (2026-11-04).
- [x] The car questions (gloss black, Supra-inspired, no badges), 2026-11-04.
- [x] Blind-spot review of the plan (agent, 2026-11-04; its main claims re-checked by hand). Blockers: the room
      stretches with the screen (19.9 m at 1141x636, 22.1 m at 1440x900, 22.8 m on a 390x844 phone where the TV is
      1.4 x 2.8 m: `layoutCamera`), so a Blender room needs one size in metres; baked light can't follow swaps,
      removals, flicker or bench moves (light in layers instead). High: the live CSP (a Cloudflare rule) blocks the
      3D decoders (no `'wasm-unsafe-eval'`, no blob: workers / images); no home for big files (repo ~0.5 GB; R2
      proposed); "every plugin at every step" can't pass (side-wall CRTs are behind the camera near the end); the far
      end skips the risks and the painting is the 3 Nov room (7.6 x 4.6 m, lens 49); Black Friday / Cyber Monday on
      main (27-30 Nov, countdown + a TV intro); the power-on flicker (55 ms steps, ~9 flashes/s; WCAG 2.3.1 allows
      3); the 6 % scroll snap; phones see ~27 deg across; look-alikes and asset licences. Round 3 on the plan page:
      findings, corrections and 14 questions (db `answers/round-3`).
- [x] Round 3 answered (2026-11-04) + four follow-ups in chat. Decisions:
      - The room is the DEFAULT homepage, not a skin. Live on **Nov 19**, before the Black Friday countdown (Nov 20),
        to half the visitors (A/B test = how we tell if it sells).
      - v1 = real light and materials everywhere; real models at the far end, the entrance and the car; the other
        props stay dressed simple shapes until after Black Friday.
      - One fixed size in metres; overnight re-bakes are fine; re-bakes run on Dan's Mac (Claude).
      - Phones: their own portrait camera path, and a phone team (phone designer + phone tester, Opus) working with
        everyone else.
      - Look: today's room; the painting is the mood reference. The room is its own era: "new with hints of
        elements from the past, like the GAS 2 vibe, a vintage retro garage / music studio", from real garages and
        real messy retro studios. More elements go into the skeleton: Claude proposes a list, Dan picks.
      - The car: Dan's team models it in Blender (they are 3D artists), Claude helps; the Supra signatures (round quad
        taillights, hoop wing) are made our own.
      - Plugins visible wherever each is in view; the landing is the TV. Shipped 3D files on Cloudflare R2.
      - Flicker at most 3 flashes a second. The scroll snap is off by default, kept as a bench option.
- [ ] Researchers running (2026-11-04, Opus): R1 = real references (board in `tools/_home-opening/refs/board/`),
      the new-props list, free model sources, a licence log; R2 = the live-3D recipe (light layers, compression,
      phone budget, CSP, R2, parity, the splat check) in `refs/tech-recipe.md`. Both git-ignored.
- [ ] Tell Gil: the room goes live Nov 19 as the homepage (A/B); his Black Friday countdown (from Nov 20) and the TV
      intro must work with it (the walk lands on the TV, which carries the live page).
- Schedule to Nov 19 (tight; checkpoint Nov 12: if the look pass isn't at the bar, v1 = look + light only):
  - Nov 4-6: foundations (the room in metres + one slot file, the light-layer design, tone mapping, a CSP test, R2);
    round 4 page = the look lock (pins on the painting) + the reference board + the props pick.
  - Nov 6-9: the whole-room look pass; the Blender export + bake pipeline; the far-end bake-off (testers, critics).
  - Nov 9-14: real models at the far end and the entrance; the car (Dan's team); the phone path (phone team).
  - Nov 14-17: into the homepage behind a switch + the A/B split; CSP + R2 live set-up (Dan's OK); flicker,
    reduced motion, a skip link, the crash fallback; all checks.
  - Nov 18: Dan's sign-off. Nov 19: live to half the visitors (a push to main = live, Dan's word).
- [x] R1 (2026-11-04, spot-checked): 32 real references with licences (`tools/_home-opening/refs/board/`, git-ignored),
      45 new props N01-N45 by zone (`refs/props.md`), free model sources (`refs/models.md`), a licence log
      (`refs/licence-log.md`). Traps: Fab's Standard licence forbids assets visitors can extract (live 3D sends the
      files), so only CC0 / CC BY there; CC BY needs a credits page; generic shapes only. R1 slipped once: its first two
      requests to the Wikimedia Commons / Openverse APIs carried Dan's email in a header (told Dan).
- [ ] 1. Look lock: the review page https://claude.ai/artifact/Bh4iT4GHQox8ZD97nie5UU (db `notes`: the painting + 3
      close-ups to pin, 32 references with Love it / Some of it / Not this) and Round 4 on the plan page (the props
      pick, db `answers/round-4`). Then: the look spec + the what-should-be-visible table.
      - [x] Look lock answered (2026-11-04): Love it on 28 of 32 references, Some of it on 01 / 02 / 26 / 32, none
            rejected, no pins on the painting; on 01 "can we get more references on it"; overall: "I want it to feel
            like we making plugins". The look spec (the critics' rulebook): `tools/_home-opening/look-spec.md`; the
            board's sources: `look-board.json`. R1 is finding more references like 01 + "we make plugins here"
            references and props (W01...), to add to round 4 and to a look-lock round 2.
      - [x] R1 round 2 (2026-11-04): board 33-52 (33-42 more like 01; 43-52 where gear gets made), workshop props
            W01-W11 (`tools/_home-opening/props-workshop.md`; the first list is `props-candidates.md`). R1 flagged the
            gold record R19 as a possible fake award (honesty rule): a question in round 4. Look-lock round 2 (db
            `notes-r2`) carries the 20 new references.
      - [x] Round 4 answered (2026-11-05): 47 props ticked (N01-N13, N15-N18, N20, N22-N26, N28-N36, N39-N43, N45,
            W01-W07, W09, W10; left out N14, N19, N21, N27, N37, N38, N44, W08, W11); the gold record R19 becomes a framed
            print of our first faceplate. All 47 are slots in the skeleton (`room.html` SIDE + END, 49 rows: the rugs
            and the mic stands come in pairs), placed where R1 suggested, then de-overlapped by a script with wall
            pieces kept on the wall and bench pieces on their bench: 0 overlaps with any other slot (Playwright,
            2026-11-05). Dan arranges them on the bench (Move things) and pastes back his settings.
- [x] Three room designers (Dan 2026-11-05: "summon 3 agents that specialize in 3D room design ... the user should have
      a wow effect ... a plugin company that references cars"; Opus, each alone): A film production designer, B real
      garage-studio builder, C brand-experience designer. Kit: `tools/_home-opening/layout-kit/` (brief, catalogue,
      start layout, render.mjs, check.mjs). Their layouts: `tools/_home-opening/layouts/{a,b,c}.json` + rationales;
      walk any one live with `room.html?layout=a` (view only, nothing saved). Re-checked by hand: each 0 collisions
      (today's room had 10), every must-stay in frame at the first screen, no page errors. The bench:
      https://claude.ai/artifact/YTT5fJ86prxUDucxfMCSSc (db `notes`).
- [x] Dan's pick (2026-11-05): "B + A's moves" = B's zoned garage + A's 4.6 m ceiling, A's brighter street (outside 3.0)
      and 3.5 m door, the lens at 43; the five ceiling-hung props raised 0.6 m with the ceiling. `layouts/b-plus-a.json`:
      0 collisions, every must-stay in frame, no errors. Bench round 2 (same URL, db `notes-r2`).
- [x] Baked (Dan 2026-11-05: "nice next step commit"): `b-plus-a` is the room's DEF (24 settings + 101 per-object moves
      in `DEF.moves`; settings ver 9 opens the new room on every saved bench once). Checks (Playwright Chrome 1141x636):
      a fresh visit vs `?layout=b-plus-a`: 0.00 % / 0.01 % of pixels at walk 0 / 50 %; an old ver-7 bench migrates;
      0 collisions; no page errors. The layout kit's start layout + catalogue regenerated from it.
      - [x] Look-lock round 2 answered (2026-11-04): Love it on 16 of 20, Some of it on 38 / 43 / 44, Not this on 40
            (inside a car looking out). Folded into `look-spec.md`.
- [x] Foundation 1 (2026-11-04): the room has ONE size in metres (`roomL` 19.9 m, `tvH` 0.73 m, both on the bench);
      only the camera adapts per screen: it starts 1.5 m in front of the near wall and ends where the TV face covers
      the screen below the nav (width or height, whichever fits first). The live page sits on the part of the TV face
      that screen shows at the lock, so the hand-off lines up. Checks (Playwright Chrome): Dan's laptop 1141x636
      renders as before (0.00-0.05 % of pixels, walk 0 / 60 %); the room is 19.9 m at 1141x636, 1440x900, 1920x1080 and
      390x844; the last 3D frame vs the live TV: 0.60 % at 1141, 0.38 % at 1440 (both unchanged), 1.90 % on the phone
      (was 19.08 %); no page errors.
- [x] R2's live-3D recipe (2026-11-04, its claims about our code re-checked): `tools/_home-opening/tech-recipe.md`.
      It implies: each light group baked alone in Blender, three groups per 8-bit KTX2 (R/G/B), mixed live by one
      shared uniform (colour x flicker), a swap re-bakes only its slot; AgX in both; the TV / CRT screens drawn after
      tone mapping; glTF + meshopt + KTX2 (no Draco, textures as separate files) on R2 at `assets.revaudio.net`
      (hashed, immutable, a CORS rule); three CSP additions (`'wasm-unsafe-eval'`, `worker-src 'self' blob:`, the R2
      origin) = production changes, Dan's OK first; phones get their own tier (DPR <= 2, <= 100 MB of textures),
      a crash-loop marker falls back to a still, a pause button (WCAG 2.2.2), reduced motion = a still; the first
      paint is a still of the room per breakpoint (the LCP). Also: room.html vendors three r170 while the site pins
      0.185.1, and room.html loads Google Fonts, which the live CSP blocks (the site self-hosts the same fonts).
      Splats: not in v1.
- [x] Round 3 quick fixes (2026-11-04): the power-on flicker steps 200 ms (at most 2.5 flashes a second, was up to
      7.5); the scroll snap off by default (settings ver 8), still a bench option.
- [ ] 1b. The whole-room look pass (Dan 2026-11-05: "look pass", picked over "Blender first"), in `room.html`, before
      the Blender export. To `look-spec.md`, with the painting as the mood:
      - Real materials for the shell (sealed concrete floor with oil stains and a long soft reflection, sooty walls,
        the ceiling, steel trusses, the ribbed door) from CC0 PBR sets (Poly Haven / ambientCG, each logged in
        `refs/licence-log.md`), and one material per kind of slot (red enamel chests, chrome, wood, amp tolex, fabric,
        cardboard, rubber) with bevelled edges; no slot labels or wire edges in the look view.
      - AgX tone mapping (exposure on the bench); the TV face and the CRT screens drawn after it, untouched. Today the
        composer (RenderPass → UnrealBloomPass → OutputPass) tone-maps the whole frame in OutputPass, so a material's
        `toneMapped: false` won't protect them. The hand-off to the live TV must stay ≈ 0.6 % of pixels at 1141x636.
      - Night light: shadows from the amber lamps (none today), pools with deep falloff, the neon + amber pair, the
        street through the door; a probe of the room itself as the environment, so chrome and the car catch the neon;
        contact shadows / AO; MSAA (the composer's target has none today).
      - The critics team (decisions above) scores the renders on the look spec's 7 lines (7+ each, up to 2 fix rounds);
        then Dan sees what passed, with their notes.
      - Checks: `layout-kit/check.mjs` (must-stays at walk 0 / 35 / 70 / 100 %); `layout-kit/handoff.mjs` (the TV
        hand-off; baseline 2026-11-08: 1.05 / 0.68 / 0.45 / 2.57 % of pixels at 1141 / 1440 / 1920 / phone differ by
        more than 24, all on sharp edges, from resampling; the look pass must not raise it); no page errors; the frame
        rate on Dan's laptop.
      - Downloads (texture sets etc.): a plain user agent (`RevAudio-research/1.0`), never Dan's email (R1 slipped once).
      - [x] Part 1 built (2026-11-08, `danavivi-20`, commit `04d8285`): three.js 0.185.1 vendored (the site's pin; r170
            vs r185 renders within 0.3 % of pixels); 13 CC0 sets in `assets/pbr/` (`SOURCES.md`); `KINDS` + `LOOK` (a
            kind per slot), `LIT` (lit props); AgX in a finish pass, the screens marked in the frame's alpha (hand-off
            1.05 / 0.68 / 0.45 / 2.57 %, = the baseline); 4x MSAA; lamp spotlights with shadows (redrawn only on
            moves); the wet sheen (`WET`, a Reflector); the probe on shiny kinds only (on matte ones it counted the
            lights twice); contact shadows; haze under the lamps; bench: Look chip + "The look" (tone, exposure,
            shadows, reflections, haze), settings ver 10 (look on, labels off). 80 fps at the door, 110-146 toward the
            TV (M1 Max, DPR 2; live lights are the cost: 3 per neon strip, 3 prop lamps). 0 overlaps, no page errors.
      - [ ] Critics round 1, fixes, Dan's look. Round 1 scores (look / walk / Dan's-eye / devil, lines 1-7): 5 5 3 4 6 8 5
            · 4 4 3 5 5 9 4 · 5 5 3 5 6 9 5 · 4 4 2 4 5 9 3. All four agree: past 40 % of the walk the violet + amber
            pair dies into red-black murk; the door is a flat bright-blue card; bulbs and tubes burn white; the lit
            globes read as paper discs; the floor lacks amber pools and contrast; the reflections pop in ~3 s after
            load. MODEL (later steps): the car, the drum kits, the mess.
      - [ ] The player (Dan 2026-11-08: "an agent that plays with the result on the website and gives feedback to the
            builders"; approved the same day): a live tester on Opus, a standing member from this round on. It plays
            the room like a visitor in real engines (WebKit at Dan's 1141x636, Chrome 1141 / 1440 / 1920, the iOS
            Simulator via `?capture=`), records video, and reports motion, loading, input and engine problems the
            stills can't show (findings.json with repros). Runs every round after the fixer, before Dan sees it; the
            main session verifies each finding before a fix. Briefs: `tools/_home-opening/team/player-brief.md`
            (and the critics' `critic-brief.md` beside it).
- [ ] 2. The skeleton exported to Blender (geometry, slot names, camera walk, lights); parity check against the
      bench. (Blender itself: installed 2026-11-04.)
- [ ] Owed Dan's OK (production): an R2 bucket + `assets.revaudio.net`, its cache / CORS rules, the three CSP
      additions. Test locally first, with the live CSP served by a local server.
- [ ] Research: assets + the car; live-3D techniques + the splat check.
- [ ] 3. The far-end corner built once, shown live (A) and pre-rendered (B); checks + critics; Dan picks.
- [ ] 4. The rest, zone by zone: entrance + car, workbench wall, studio corner.
- [ ] 5. Into the page, with the checks.
- [ ] 6. A test skin: swap one object and remove one (RevFX or a poster), end to end.

## Decisions (Dan's picks, 2026-11-02)
- Look: photoreal, graded with DRIFT's violet/magenta neon + amber lamps (house law: photographic realism).
- The TV at the far end: about 5 % of the screen width (~55 px on a 1141 laptop), so the walk-in is ~20x.
- Layout: music gear and garage gear mixed on both walls.
- Car: a JDM coupe parked midway along one side; the camera passes beside it. Then (Dan, same day): side-on, nose to
  the right of the screen, half out through an open roll-up garage door in the right wall, on a low scissor lift,
  engine off; the night outside. All on the bench (car along / through the door / angle, lift type + height, door
  width / height / open, outside light, Engine on).
- Brand: a REVAUDIO neon from the first ceiling truss, near the camera (proposed). Dan, same day: not in your face, high
  on the left wall, movable on the bench (left / right wall / over the aisle, along, height, size).
- Same round (Dan): a real garage floor, not a mirror (worn concrete default; checker tiles + the old mirror on the bench);
  the GAS 2 posters + a COMING SOON plate (future plugins) framed on the walls, CRT monitors showing plugins; more mess;
  retro-cyber and alive (aisle LED strips with a pulse to the TV, rack LEDs, VU bars, flickering screens); a move tool
  (click anything, drag it; sliders for along / across / height / size / turn; per-object moves saved in the settings).
- Engine: Three.js, a real 3D room (Dan 2026-11-02, over CSS 3D planes).
- The room is a permanent living set (Dan 2026-11-03): re-dressed for seasons (Halloween, Black Friday, Christmas),
  products, bundles and work in progress by moving / adding / swapping things, never by rebuilding it. Contents =
  data (base room + skins) the engine places and the bench edits. DESIGN.md §7 carries the rule.
- Dressing rounds (Dan 2026-11-03): the neon on the end wall, top right of the TV, 50 % bigger, hung crooked on two
  wires; the road look off the floor (lane lines + aisle LED strips off, kept on the bench); studio acoustics (wooden
  slat panels, skyline diffusers, bass traps, a cloud); a small drum kit (kick, snare, hi-hat) left of the desk facing
  right + a throne pushed back left ("someone just got up"); the desk 0.7 m out with both monitors on floor stands;
  undo / redo on the bench; three of his benches baked in as the defaults (the third: a wider, taller room 7.6 x 4.6 m,
  lens 49, a 360 % walk, TV glow 2.5, the pegboard a little toward the start of the walk).
- Final art: a PAINTED room (Dan 2026-11-03, over cut-outs that "feel like a 2D"): GPT Image paints the bare set from
  spots along the walk, each painting projected back onto the set (the GAS 2 drone's recipe); TV, CRT screens and
  posters stay live pixels. Higgsfield: 250 credits (Lite) on 2026-11-02; 233.75 left on 2026-11-03.

## Steps
- [x] 1. The 3D skeleton, no credits: `tools/_home-opening/room.html`. The room as a real box; a grey labelled block
      per future image (music + garage mixed on both walls, the coupe midway right, the REVAUDIO neon on the first
      truss); real light (neon strips + glow, amber lamps, haze, a glossy floor); the live TV at ~5 % at the far end;
      scroll = the walk, locking onto the live TV (the first prototype's hand-off); sliders + a neon-wireframe toggle.
      Built 2026-11-02; Dan keeps dressing and tuning it on the bench (Decisions above).
- [ ] 1a. Offered 2026-11-03, not answered: a "just got up" cue on the throne (headphones or sticks).
- [ ] 1b. The room as data: a base manifest + skins (season / product / bundle / work in progress) that the engine reads
      and the bench edits, adds to and exports; plan it with Dan first.
- [ ] 2. SUPERSEDED 2026-11-04 by the rebuild (top). The slot list out of the skeleton: each prop / wall's size, angle
      and light = its Higgsfield prompt (cut-out, transparent background). Plan + Dan's OK.
- [ ] 3. SUPERSEDED 2026-11-04 by the rebuild (top). The default skin, painted (cost-checked per shot, RULE 0). Cut-out test 2026-11-03 (12 credits) read 2D and
      was dropped. Proof shot 1 done 2026-11-03 (walk 0, 4.25 credits): one real photo to ~20 % of the walk. Next, on
      Dan's yes: 4 more shots. Done 2026-11-03 (free): soft hole fill, real posters onto their painted twins.
      Then (Dan: projected paintings "smeared and broken apart"; credits OK): the walk became a FILM between painted
      keyframes (Kling 3.0, 2 films, 35.75 credits), framed by the TV's size. Then (Dan: "the sceane changes in the
      middles items move around", the plugin CRTs gone; "one seamless shot"): ONE film repainted from the 3D set's own
      walk (Kling 3.0 Omni Edit, 2 passes, 40 credits), the plugin CRTs back in place with live screens on them.
      Then Dan: "lets go back to the skelton this is not what i want": the bare set is the room again (Painted / Film
      off by default, kept as bench switches). Next: what he didn't want, before more art.
- [ ] 4. Movement, the readings, the phone version: each planned with Dan first.
- [ ] 5. Into the site (`index.astro` + a new component, the live TV at the lock, reduced motion, weight), DESIGN.md
      §0 + §7; main only on Dan's word (= live).

# GAS 2 on the front page: in the LCD screen (Dan 2026-11-01, danavivi-83) — PLAN, waits for the LCD screen

Dan (2026-11-01): "where do we put gas 2 ... in the front page. Like I think it should be in the LCD screen that we do
right now in a different computer, so just wait for it and then we'll do a publish." Both GAS 2 pages are on main
(`tools/_gas2-scene/`: page-b = laptop, postcards = phone), not in the site yet.

## Steps
- [ ] 1. ⏸ The LCD screen lands (the other computer's session; nothing on origin yet, 2026-11-01). Read its handoff
      entry first: how it takes content (one product or several, slides, a channel per plugin).
- [ ] 2. GAS 2 on the LCD, in the LCD's own look: the name, FREE, one line ("Thicker, smoother, glued master."), the
      station art; a click or tap = the GAS 2 page. A review bench for Dan's notes before it ships.
- [ ] 3. The GAS 2 page into the site (`src/`): one address, page-b on a laptop, the postcards on a phone. Dan picks
      the address (`/gas2`? `/gas` is GAS 1 today).
- [ ] 4. Gates before the publish: CATCH10 live in Paddle and tried at checkout (RevTasks #193); MAIL ME THE KEYS sends
      the real download (both pages' forms are dummies today); the weight (the drone intro ~3.2 MB) and old Safari
      (15 and older has no `cqw`: the scene breaks).
- [ ] 5. Publish = main on Dan's word (= live): Deploy + Smoke test green, then a live look on his phone and laptop.

# GAS 2 phone POSTCARDS (branch `feat/gas2-postcards`, 2026-10-29, danavivi-75, then danavivi-83) — squash-merged to main 2026-11-01 (the phone page only)

Dan's concept (2026-10-29): a stack of 1950s "Greetings from GAS 2" postcards, phone only. State: `tasks/handoff.md` top entry.

## Steps
- [x] 0. Branch + worktree off `origin/feat/gas2-drone` (`4fc6ddd`); claim, plan, README line pair.
- [x] 1. Assets, no spend (`postcards/tools/`): the real pump baked from the plugin page (`Source/ui/public` on :4461, 2x,
      alpha, ROOM hidden, full hose, PREMIUM lit, GAS 140 % = the demo's setting); card 1's backdrop = the station, soft
      (the painted pump filled out, blurred); the page backdrop; a linen tile; the grade keys (the 4x bake on
      `feat/gas2-phone`); a stamp from `poster-mail-1`.
- [x] 2. `postcards.html`: six cards in one stack; flick = drag, throw on velocity / distance, spring back otherwise;
      back / next buttons + arrow keys; counter; one nudge on first load; `?card=1-6` (+ `&flip`) opens on a card (review
      in the Simulator, where we can't flick); reduced motion = a crossfade.
- [x] 3. Cards: 1 Greetings from GAS 2; 2-4 REGULAR / PREMIUM / RACE (the pump's key + the BRIEF grade lines); 5 HEAR IT
      (front: "Fill it up. Same level." poster; tap = flip; back: ▶ + ORIGINAL / GAS 2, "PREMIUM, GAS 140 %, both
      -11.0 LUFS"); 6 the postcard back (email on the address lines; MAIL ME THE KEYS = the card drops into the mailbox,
      SENT postmark; dummy, nothing sent).
- [x] 4. Checks: WebKit 402x714 / 375x553 / 390x664 / 393x659 / 430x750 (fits, no overflow, no page errors), flick +
      buttons + flip + A/B state + form by script (`postcards/tools/check.cjs`: 22 steps + 20 layouts pass); iOS
      Simulator (iPhone 17 Pro, 127.0.0.1) shots of every card.
- [x] 4b. The end page (Dan 2026-10-29: "in the end page the user will reach the right side of the desktop page, the words
      will pop out and everything"): after the last card (flicked, next, or mailed) the lens pulls focus onto the
      desktop's right side and page-b's readings pop as after the drone lands. Checks: 24 steps + 30 layouts pass.
- [x] 4c. The review page (Dan: "open a bench so i can comment on every section of this page"): artifact
      https://claude.ai/artifact/6zn14ha4qswV1gmCb8v3qG, a notes box + pins + ▶ Live per screen, notes in its db.
- [x] 5. Dan's notes in the review page (2026-10-29 21:03, pasted + `notes` in the db; the pins drawn on the shots).
- [x] 6. Commit my files by path on the branch; no push (Dan's word; main = live).

## Round 2 — Dan's notes (plan OK'd 2026-10-29: he picked "deck buttons" for the vinyl; textures drawn in code, no spend)
- [x] 7. Grade cards 2-4: the plugin key goes (①); the script + big lettering centred on the card, the sunburst behind
      them (②); the line under them in the lettering's face, Oswald caps (③).
- [x] 8. Mail card: the two empty address lines go (①②); the email bigger (③④); MAIL ME THE KEYS = a rubber stamp, a
      station / ticket stamp in ink, not a button: tap = it stamps, then the card goes in the box (⑤); a checkbox with
      the site's own consent words, unticked (⑥: "Also send me new-plugin drops and demo codes (optional)").
- [x] 9. End page, mailed: a vintage "TO THE WEBSITE" ticket pops up after the readings, to revaudio.net/store. The end
      page itself is ✓ (frozen).
- [x] 10. HEAR IT back = a turntable seen from above: tap the record = the needle drops and it spins; ORIGINAL / GAS 2 =
      the deck's two speed-style buttons (switch while it plays); the tonearm creeps in with the song (= progress).
- [x] 11. Overall: worn, sun-faded stock + edge wear on every card, each its own (card 1 tape, Regular a coffee ring,
      Premium a gold seal, Race a grease thumbprint, HEAR IT ring wear, the mail card a crease + dog-ear); more alive:
      the lettering pops as its card comes up, the sunburst turns slowly, the postmark thumps, dust in the lamp light.
      Textures made in `postcards/tools/make-wear.py` (numpy, no spend).
- [x] 12. check.cjs updated + all pass; re-shoot; review page round 2 (his note + what changed per screen, fresh
      boxes) republished to the same URL; commit by path; handoff.
- [x] 13. Dan's round-2 notes (2026-10-29 23:48, pasted): one note, on HEAR IT's back.

## Round 3 — Dan's note on the back ("an animation of the vinyl working ... less like a post card, more like a whole
   picture, real vinyl"; his message opened with "commit" = go)
- [x] 14. The back = one photo of a turntable seen from above (`make-deck.py`: walnut + brushed aluminium, no spend);
      it runs while it's up (platter at 33 1/3, strobe dots, the lamp's streak on the grooves stays put); tap the record
      = cue up, swing in, needle down, the song starts as it lands; tap again = home. Keys, fine print, label-maker tape.
- [x] 15. check.cjs 29 steps + 30 layouts pass, 0 errors; review page round 3 = version 5 at the same URL; commits by
      path (`b05c079` + the review/handoff one); no push.
- [x] 16. Dan's round-3 notes (2026-10-30 13:15, pasted, + "if you need to create more assets ... please do so").

## Round 4 — Dan's round-3 notes, all on HEAR IT
- [x] 17. Front: TURN IT OVER in HEAR IT's letters, bigger, nodding with the curl. Back: real keys (ivory piano keys in a
      graphite escutcheon, rendered from a height field in `make-deck.py`, no spend; press click, latch clack, haptic
      tick); TAP THE RECORD = a die-cut sticker (slapped on, peels, glints, plays the record too); no fine print; a
      smaller Turn knob.
- [x] 18. check.cjs 30 steps + 35 layouts pass, 0 errors; review page round 4 = version 6; commits `bf71096` + the review
      one; no push.
- [x] 19. Dan, 2026-10-30: "looks amazing ... the vinyl looks crazy ... i really like the buttons". The keys saved for
      reuse in the shared repo (`collaboration/handoffs/2026-10-30-piano-keys/`: kit + handoff + memory
      `feedback_ivory_piano_keys_liked`, pushed `959b947`); "commit everything and push it": this branch pushed (not main).
- [x] 20. Dan (chat): "the readings should be glued to the card itself ... physics-wise": no arrival pops, no moving
      print (sunburst, lamp flicker, the nod); `22d779e`, DESIGN.md §6. Review page round 5 = version 7 (card 6 back: it
      had dropped out in round 3).
- [x] 21. Dan (chat): "back is left to right, and front is right to left", the station too: `743e67f`; review page round 6
      = version 8.
- [x] 22. Dan's round-6 notes (2026-10-30 14:29, pasted; all on HEAR IT's front): no red level line in the poster,
      the readings crisp (the wear under the print), TURN IT OVER up under the line and centred: `55cc52f`; review page
      round 7 = version 9.
- [x] 23. Dan (chat): "the card moves is not smooth yet ... everything that moves needs to be smooth": measured on a
      4x-slowed CPU, fixed (`1065d59`: let-go motion at the finger's speed, no repaints mid-move, heavy work at idle,
      the turn at one speed); worst frame 417 -> 33 ms. Review page round 8 = version 10.
- [x] 24. Dan on his iPhone (LAN link http://10.0.0.5:4470, a no-store server bound 0.0.0.0 from the session's
      scratchpad): no vinyl animation, the buttons don't move the cards, not smooth = iOS Reduce Motion (all of it was
      switched off for it). `c22bab5`: the hand's moves survive it, calmer; the held card leans with its speed. A temp
      check page `tools/_gas2-scene/motion-check.html` (git-ignored, not committed). Review page round 9 = version 11.
- [x] 25. Dan (chat): "check your work and do a ponytail on it": `205661d` - no card jumps when something takes it over
      (‹ mid-throw, › right after ‹, a tap or a layout while a card springs home, a flick inside one frame), the strobe
      still under Reduce Motion; dead code, CSS and unused art cut. Pixel-identical states, check.cjs 41 + 35 pass.
- [x] 26. Dan on his iPhone (a screenshot, "it's not comfortable like this ... give options"): the keyboard shrank the
      mail card to half and the tick line ran into the stamp. His pick "card slides up": `b15a2eb`, the card keeps its
      size and slides up over the keys; check.cjs 42 + 35 pass.
- [x] 27. Dan: "open the bench": review page round 10 (`notes-r10`) = version 12 on `6c91731`.
- [ ] 28. Dan's word from the phone + his round-10 notes (and the check page: Reduce Motion on or off?).
- [x] 29. Dan (2026-10-31, phone only: "lets try different spots of background image from the scene for the end page",
      spots with the pump in them): `?spot=a-d` frames the end page (and the blurred frame behind the cards) elsewhere;
      no spot = the signed-off sky, pixel-identical. A the station front, B the pump close, C the pump + the desert,
      D the station on top with the button low; A-C put the readings in a navy night above the roof. check.cjs 42 + 35 pass.
- [x] 30. Dan picked D (2026-11-01): the default end page (`?spot=sky` = the sky, pixel-identical); the readings hang by
      their top under the station; after mailing the line + Fill it up. step aside, the ticket comes up under the ✓.
      check.cjs 42 + 35 pass (+ GAS2 under the pump's plinth, the ticket between the ✓ and the endbar).
- [ ] 31. The laptop page's taxi on the phone (Dan, via `danavivi-a5`, 2026-11-01; `taxi/` on main `ddd0ebc`): after
      mailing the cab pulls up in front of the station, the button turns to red "To the store"; it replaces the ticket.
      Phone size + stop for D (`?taxi=bench`), the audio unlocked in the stamp's tap (iOS), thumb-sized taps; iOS
      Simulator, then Dan's iPhone with sound; the store landing on a phone. page-b keeps working. Dan: "go" (2026-11-01):
  - [x] a. `taxi/` into this branch from main (`git checkout origin/main -- tools/_gas2-scene/taxi`, new files
        `add -f`); `taxi/**` claimed by `danavivi-83` (handed over by `danavivi-a5`).
  - [x] b. One taxi.js for both pages, not a fork: the trigger = a page event (the phone fires it on a valid stamp,
        inside the tap, so iOS lets the sound play, and with `navigator.audioSession.type = 'playback'` as HEAR IT already
        sets it, so it sounds with the ring switch on silent; page-b keeps its `#ticket` submit + `#veil`); `covers()` = a real
        overlap (the phone's cab stands above the readings, not beside them); The postcards again sends it home.
        page-b.html untouched, checked on main's page-b (states + parked pixels identical, old vs new).
  - [x] c. Phone: a frame-sized `#scene` box where the vista sits (the taxi's cqw = the frame's, as on page-b), the end
        page = `#stage`; size + stop for D by eye on `?taxi=bench` (in front of the station, tyres on the forecourt
        above GAS2, the driver past the left edge); Not now a 44 px tap; the ✓ turns over to red "To the store".
        page-b's 105 / -53.8 cqw fit as they are (D's frame starts at the screen's edge); tyres at 17 % (frame y 850).
  - [x] d. The railway ticket goes (the cab + the red button do its job); `?card=7&sent&taxi=park` = the review state.
  - [ ] e. ✓ check.cjs 47 + 40 (the cab parks, the red button, Not now turns it back, a tap on the cab = the store URL, no
        errors); ✓ iOS Simulator; ✓ the store landing (`revaudio.net/store#radio-roulette`) on the Simulator; open: Dan's
        iPhone with sound (a Wi-Fi URL from this Mac, on his OK).
- [x] 32. Dan's notes on the taxi (rounds 11-12): no HOP IN · NOT NOW, a harder faster flip, red = Download FREE size.
- [x] 33. A tester agent's run (Dan's ask): 3 majors + 5 quick fixes done on his "fix" (`a788990`); round 14 up.
- [ ] 34. Left for Dan: small text + hint at 375x553, a11y names/announcements, the cab's focus ring, the record's
        first-tap freeze, the demo audio fetched at card 4, Esc = the cab gone (handoff, the tester's run).

# GAS 2 taxi to the store (branch `feat/gas2-taxi`, 2026-10-31, danavivi-a5) — LAPTOP PAGE FIRST, phone after

Dan (2026-10-31): "the moment the user finishes downloading GAS 2, a vintage American taxi stops and covers the gas
station and honks twice; on the taxi it says TO THE STORE!; when the user clicks the taxi there's a tyre-screech sound and
a move to the main site; the user lands on the store screen at Radio Roulette". Then: "do it on the laptop page, then the
phone", "use whatever tools you need for the best result".

## Steps
- [x] 0. Branch `feat/gas2-taxi` off `origin/feat/gas2-drone` @ `951936d` (no upstream: a bare push can't reach the
      drone branch). Mine: NEW `tools/_gas2-scene/taxi/**`, ONE `<link>` + `<script>` line in `page-b.html`, one README
      line pair, this section, the handoff entry. `drone/**` (revaudio-59) and `player/**` (Yoni) untouched.
- [x] 1. Sound (CC0 recordings from freesound.org, commercial use OK, no credit needed; sources in `taxi/README.md`):
      arrive (an old car rolls in on dirt and stops), honk (two blasts of an old Ford V-8 horn), peel (tyre squeal over
      the engine pulling away). Cut + balanced: -21 / -15 / -15 LUFS, 91 KB in all.
- [x] 2. Art (gpt-image-2, ~$1, one call, 2 takes; take 2 kept): the taxi painted INTO the scene (the page frame as the
      image, so its light is the page's), lifted out with Apple Vision, the wheels cut out to roll (ring turns, shade + dome
      stay put), blank lit roof sign (TO THE STORE! is real text). `taxi/README.md` "The art".
- [x] 3. v1 built + checked headless (Chromium + WebKit 1141x636 / 1440x900: parked, no errors; Chromium: send -> roll-in
      -> park -> click -> dust -> the store URL). `taxi.js` + `taxi.css`: after SENT the ticket closes, the taxi drives in from the left (wheels roll, the nose
      dips on the brake), parks in front of the station, honks twice; click / Enter = squeal, wheelspin, it peels off
      right, the dust fills the screen, then the store at Radio Roulette. Sound pans with the car. Reduced motion: it is
      just there; no drive. A quiet "not now" / Esc sends it away calmly (the radio and pump sit behind it).
- [ ] 4. The landing: `/store#radio-roulette` (the store page needs an id on the Radio Roulette card; separate small
      change off `main`, Dan's word before it ships).
- [ ] 5. QA: Chromium + WebKit at 1141x636 / 1440x900 / 1920x1080, no errors, reduced motion, keyboard; Dan's Safari.
- [ ] 6. Dan's look, then the phone page (postcards end page).

# GAS 2 drone descent (branch `feat/gas2-drone`, 2026-10-28, revaudio-59) — ON MAIN 2026-11-01 (squash, danavivi-83)

Plan page: https://claude.ai/artifact/NnyBRQchpWfY541CZA1Unn. How it works + bench: `tools/_gas2-scene/drone/README.md`.
Dan's order (2026-10-28): finish the scene with placeholders first, then generate the real elements (OpenAI or Higgsfield).

## Steps
- [x] 0. Dan's answers: the page's own world; roof text "CATCH YOUR COUPON" (he wrote "catch your compon"); car in the
      hover shot; try three hover angles in a bench (top / 45 front / 45 right); no flying back up.
- [x] 2. Flight engine in `tools/_gas2-scene/drone/`: scroll runway, three paths, exact TOP landing, hand-off.
- [x] 3. GAS 2 pop: GAS2 springs out (blur + overshoot), the rule draws, then tagline / button / "Fill it up." pop fast.
- [x] 4a. The car (placeholder box car): right to left once per load, roof board readable from the hover.
- [x] 5a. QA (headless Edge, 1440x900 + 390x844, all three angles): page after landing = `?drone=0` (mean 0.00);
      exact landing frame vs the page scene 2.55 / 1.47; no errors; classes, runway and layer gone, scroll 0.
- [x] 1a. Camera bench (`?cam`): free hover camera + landing timing, one exact path for every angle.
- [x] 1. Dan picked the camera: the default (TOP), 2026-10-28.
- [x] 4b. Real art (Dan OK'd 2026-10-28; ~$1.50, 3 gpt-image-2 images: aerial, close road, car; `drone/README.md` "The art"): near road under the frame (fixes the seam + the close-up
      asphalt), roof + field aerial, the car (top-down sprite). The roof board stays text-only until Dan names a real
      Paddle code and what catching it does.
- [x] 4c. Dan, 2026-10-28: the roof sign photographed into the car (~$0.50, `drone/tools/sign-guide.py`) and the sidewalk
      blockout props (the "css" boxes in the descent) removed. Landing still exact.
- [x] 4d. Real headlight beam + contact shadow; catch the car = the coupon ticket + CATCH10 copied (Dan, 2026-10-28).
- [x] 4f. Scroll cue (Dan, 2026-10-29: "an indicator at the bottom of the hover that tells the user to scroll down; give
      me options in a bench"): `drone/cue.js` + drone.css, bottom centre of the hover, in after the hover shows, out with
      the first scroll. Bench `?cue`: Chevrons / Mouse (Swipe up on touch) / Ticket / Fuel drop / Altimeter (live height,
      stays until near touchdown) / None. Dan picked CHEVRONS (2026-10-29); the other looks + the bench are out.
- [ ] 4e. Gil: the Paddle discount CATCH10, 10% sitewide (RevTasks #193). Gate (moved 2026-11-01, when Dan merged the page to main):
      main is not live for `tools/`; the page goes LIVE (into `src/`) only after CATCH10 works at checkout.
- [ ] 5b. QA again + 1141x636, WebKit, reduced motion, no-WebGL, weight <= 2.5 MB, frame time.
- [ ] 6. Dan's Safari + phone look.
- [x] 7. On main (Dan 2026-11-01: "push the latest page for the laptop one. And merge them to main"): a squash, the
      taxi's line kept; checked Chromium + WebKit (handoff, the 2026-11-01 laptop entry).

# DRIFT #hear — a new panel under the player: worn, crashed, Japanese + graffiti (2026-10-26, revaudio-ef, same branch)

Request (laptop 1 user): "the panel that everything sits on is a different panel, use OpenAI for it ... three different
panels that suit the vibe ... wear out a little, like it went through a crash ... a little Japanese and graffiti".
Scope: the outer `.d-panel.d-hear-panel` plate only (step 3's pair plate and the rest of /drift keep the DRIFT steel).

- [x] K1. Three plates from gpt-image-2 (2560 x 1024, high; prompts `bench/drift-panel/PROMPTS.md`): 1 峠 WRECK
  (ドリフト tag, 峠, 限界を超えろ, 夜の走り屋, torn checker, a crease), 2 STENCIL (全開, 試聴, gaffer tape, a crack, skid
  marks), 3 STREET WALL (聴け, ドリフト, 夜, 最高速度で, 逃げ場はない, stickers, a heat-blued scorch). Every Japanese line
  read and correct. Bench `bench/drift-panel-bench.html` = the real built /drift in two frames (1440 / 390), the plate
  swapped live, VEIL + PHONE X sliders, checker + 試聴 toggle (`python bench/serve-panel-bench.py`, port 8797).
- [x] K2. The user's pick: 3, STREET WALL (2026-10-26), with a bigger ask: "the LCD panels and all of those elements
  engraved in that background ... remove LET'S DRIFT from the top, keep it simple ... the panels the elements sit on
  a little worn, same vibe ... the LCD and PICK A TRACK a little broken, worn ... PLAY and PUSH DRIFT upfront, more
  appealing, catch the eye more ... make this whole section glued together".
- [x] E1. Assets (gpt-image-2, prompts in `bench/drift-panel/PROMPTS.md`): `panel3-portrait.webp` (an edit FROM plate
  3, Japanese checked), `crack-lcd.webp` + `crack-crt.webp` (photographed glass crack on black, screen-blended),
  `spray-arrow.webp`. No separate sub-plate: the pocket floors continue the wall itself (FLOOR WALL), darker.
- [x] E2 (bench). Engrave: every part sits in a pocket milled into the plate (dark inner wall top-left, bare-steel chamfer +
  catch-light on the bottom-right lip, the graffiti stops at the cut) instead of a box floating on it.
- [x] E3 (bench). Simple top: LET'S DRIFT. off the screen (kept for screen readers: it names the section), checker strip + 試聴
  sticker off; the plate's own top strip shows instead. The panel gets ~45 px shorter on desktop.
- [ ] E4. PLAY + PUSH DRIFT up front: bigger, their lamps spill on the plate, hand-sprayed marks pointing at them;
  VOLUME steps back. Section bench `bench/drift-hear-bench.html` (same server, port 8797): UPFRONT AS IS / A BIG +
  LIGHT / B A + SPRAY (an arrow at PLAY and at DRIFT, the next one fresh paint), FLOOR WALL / DRIFT STEEL, VEIL,
  PHONE Y. A sprayed ring round DRIFT was tried and dropped (it read as the button's own magenta lamp).
  Picked 2026-10-28 (the user: "commit"): CONTROLS FLUSH (no boxes: "just this section doesn't feel glued"), UPFRONT A
  (B's sprayed arrows dropped: "remove the pink arrows"), FLOOR DRIFT STEEL (was WALL; the user on the bench with
  the framed LCD, 2026-10-28: "Drift wall i like", confirmed = the DRIFT STEEL floor), LAYOUT TIGHT = the user's own hand layout
  (EDIT mode, `bench/drift-hear-tune/yours.json`) on a grid (`tight.json`, its note has the maths). Two micro-moves
  made after TIGHT were left out: "3 PUSH DRIFT" at 94 % (the step names stay one size) and DRIFT 1 px off the axis.
- [x] E4b. The LCD gets the track list's frame (the user: "make a frame for this to lcd"): the same pocket + 5 px
  black bezel, the outer box = today's LCD box so the TIGHT lines hold; slimmer on phones. Bench toggle LCD CUT /
  FRAMED. On the bench 2026-10-28 (FRAMED by default; the user's look owed): desktop frame 445..1136 x 40..243, glass
  457..1124, panel 460 -> 484, rings' bottom = the list pocket's bottom (454). Phone pocket 7 + bezel 4, the glass's
  side padding 12 -> 5 so the readouts keep their width (coach spare 16 px at 390, 18 at 360, same as CUT; the
  too-long control clips); panel +14. Crack still on the glass, 0 page errors.
- [x] E4c. VOLUME = a fader, not a knob (the user, 2026-10-28: "let's use a fader for volume instead of a knob";
  replaces the knob question). Bench toggle VOLUME KNOB / FADER, FADER by default: the page's #drive fader
  (DriftFader.astro look, violet fill) on the knob's centre line (desktop x 1088), cap travel = the DRIFT ring's height
  (desktop 307..454, phone 416..495; phone cap 34 x 17), readout on ORIGINAL / DRIFT's line. The bench drives
  hear.ts's volume through the hidden knob's keys (5 % steps); tested: drag 75 % / past the bottom = MUTE / End /
  ArrowDown / dblclick = 80, readout + knob aria follow, EDIT ON picks the fader and leaves the volume (control),
  0 page errors. The user's look owed. At the fold: hear.ts drives the fader with faders.ts `initFader` (1 % steps),
  the knob markup + its 65-frame strip go.
- [x] E4d. The fader as a worn real part (the user, 2026-10-28: "lets make that fader with open ai ... same vibe ...
  wear out broken and 3d vibe"). gpt-image-2 x 4 (two caps, two slot plates) on chroma green, keyed out
  (`bench/drift-panel/fader-cap1/2.webp`, `fader-plate1/2.webp`; prompts + recipe in PROMPTS.md). Bench VOLUME WORN
  (default) + CAP 1 / 2 (default 2) + PLATE 1 / 2 (default 1): the plate fills the DRIFT ring's height (clear of the
  readout), the cap travels the plate's cut, the violet fill glows inside the cut. Desktop cap 46 px, phone 30 px.
  Same drag / keys / dblclick / EDIT-ON control tests pass, 0 page errors.
  Then (the user: "i like it make it bigger and place somewhere better ... you got this"): a channel strip on the
  deck's right edge line, as tall as the controls. Desktop plate 1084..1120 x 267..454 (top = the step names' line,
  bottom = the pocket's line), cap 58 px, readout 1068..1136 (right edge = the LCD frame's 1136) on ORIGINAL /
  DRIFT's line. Phone plate 409..495 (just under "3 PUSH DRIFT", which runs over the column), cap 36 px, readout's
  right edge = the LCD frame's 336. Tests pass again, 0 page errors.
- [x] E4e. The DRIFT push-start feels like a button (the user, 2026-10-28: "i want it to feel more like a button and
  polish it"). Bench DRIFT BTN AS IS / CAP (default CAP): the sunk lens becomes a raised convex cap, 64 % of the bezel
  (was 59 %), lit top-left with a gloss on its shoulder, its rim shaded bottom-right, standing proud of the light ring
  and shading it; hover brightens the rim; pressed, the cap AND its legend travel in together (translateY 1.5 px +
  scale .965; before, only the lens shrank and the legend stayed put). Shot off / on / pressed vs AS IS, 0 page errors.
  The user's look owed.
- [x] E5. Folded (2026-10-28, the user: "commit ודחוף לאתר"). DriftHear.astro: DriftPanel without sticker / checker,
  `.d-hear-lcdbox` round the screen, a `.d-hear-crack` span in each glass, PLAY / STOP wrapped in `.d-hear-bore`, a
  `.d-hear-bore--start` under the DRIFT ring, the knob replaced by `.d-hear-unit--vol` (a `.d-fad-slot` slider with the
  plate, fill and cap + the readout). Assets: `src/assets/seasons/drift/hear/` (wall 2000 px q72, wall-portrait 1024,
  cracks, fader cap + plate) through getImage, as `--hear-*` custom properties on the section. hear.ts: VOLUME =
  faders.ts `initFader` (1 % steps, PageUp/Down 10 %, Home = MUTE, dblclick = 80; gain = level squared as before);
  the 65-frame knob code and every `.d-vol*` rule are gone (`public/drift/knob3d-drift-65.webp` is now unused).
  drift.css: one "THE ENGRAVED WALL" block at the end of #hear (`#hear`-scoped, no !important), the bench's generated
  CSS with the picked defaults. TIGHT is real layout, not the bench's translates: on desktop every control part is
  placed in the controls box from the bench's 1440 measures, x = place * --s + a share of the deck's spare width
  (--e: 21 % to STOP, 55 % to DRIFT, the fader holds the right edge), and `@container hear-deck` steps --s to .86
  (deck < 620) and .78 (deck < 540). Phones keep the bench's flow layout; the fader column is placed on the controls'
  right edge and the pair keeps the old knob's 80 px so DRIFT stays put. Not folded: the bench's cookie-banner hide.
  Follow-up (not done): the older #hear rules the wall now overrides (step plates, the 10-15 bench translates, the
  pair plate) can be deleted in a tidy pass; the section bench double-applies on top of the folded page now.
- [x] E6. Verified on the built dist (127.0.0.1:8797, no bench): geometry vs the bench dump at 1440 and 390, every
  part within 0.5 px (panel 1180 x 483.9 / 358 x 546.5, same as the bench); shots vs the bench shots identical except
  the DRIFT cap (the CAP pick, made after those shots). Overlap check at 25 widths 1920 -> 320 (control parts >= 4 px
  apart, inside the panel; a forced overlap control fails): all pass. Desktop deck / --s / panel height: 1440 691 / 1 /
  484, 1280 636 / 1 / 479, 1180 576 / .86 / 450, 1100 529 / .78 / 432, 1024 556 / .86 / 442, 1000 (one column) 856 / 1 /
  751, 820 702 / 1 / 747, 700 599 / .86 / 723, 601 509 / .78 / 710; phones 547 (600-390), 545 (375-320). Coach fit at
  14 widths: all fit after one fix, 320 px ran PUSH AGAIN: ORIGINAL 18 px into the tag (the segment LCD, older than
  this fold) -> <= 340 px: coach 8 px, header gap 4, tag padding 4 (the too-long control still clips). Fader: drag
  50 / 100 / 25 %, ArrowUp, PageDown, Home = MUTE, End, dblclick = 80, aria-valuenow / valuetext + readout + fill + cap
  follow, cap centre at 0.80 of the slot, keyboard focus ring; DRIFT cap pressed = matrix(.965, 0, 0, .965, 0, 1.5),
  released none. Edge 1440 + 390 and WebKit (Playwright 2336) 1440 + 390: same layout; WebKit's only errors =
  no AudioContext in Playwright's Windows WebKit (environment). `grep -r /bench/ dist` empty. 0 page errors in Edge.

# DRIFT #hear — step 2 (PLAY / STOP) gets the love (2026-10-19, revaudio-ef, same branch)

Request (laptop 1 user, on a screenshot of the step-2 box): "this is the next area that needs love". Covers the paused
review item 2 (the next-step breath). Found: the cue is a flat magenta outline lit by nothing; the caps float on the
plate with no mount (step 3 sits in chrome + LED bars); STOP is filtered to a muddy brown that reads broken.

- [x] P1. Bench `bench/drift-play-bench.html` (worktree root on 8796): the real box (trial-plate, label, mm caps) at
  186 x 184.5 / 120.6 x 147.5 / 111.4 x 145.8, step 3 crops beside it, guide states cycling, fit + plate-edge
  checks. 0 = today; A = chrome bezels + 24 LED bars round PLAY (step 3's language); B = wells + pilot lamps
  (green PLAY lamp); C = chrome bezels + the PLAY cap lit from inside. STOP = an unlit dark red in A-C (one race-red).
- [x] P2. The user picks: C, LIT CAP (2026-10-26, "C").
- [x] P3. Folded: DriftHear.astro wraps each cap in `.d-hear-mount` (PLAY's also `--play`); drift.css "STEP 2 · LIT
  CAP" block, all under `.d-hear-sec` / the section's [data-next] / [data-playing]: chrome bezel 66 / 48 px (the old
  cap's footprint), cap 52 / 38 px inside it, the lamp (::after in the cap, screen blend) + its spill on the seat
  breathe on next=play and burn while playing; playing = the lamp, not the white pressed ring; STOP brightness .6 /
  saturate .75. The old magenta ring rules are gone; the bench-baked 9 px desktop drop moved from the cap to the bezel.
- [x] P4. Verified on the built dist: #hear + hero + page heights identical to before at 11 widths (heights.cjs);
  bezels / caps sized, centred and 6 px inside the plate at 1440 / 390 / 360 (verify-step2.cjs); lamp + spill =
  d-hear-lamp on open and after STOP, opacity 1 while playing, none + .8 under reduced motion; all guide states and
  coach texts as before (verify-hear.cjs); #drive's caps unchanged (44 px, no bezel, own filters); 0 page errors.
  Found + fixed: hovering the playing cap fell back to the GPS pressed glow (now the hover look); every focused cap's
  ring was a 6 px rounded square (`.drift-page :focus-visible` sets border-radius 6px, it predates this work):
  `.drift-page .d-cap:focus-visible` now keeps 50 %, which fixes #drive's GPS caps too.

# DRIFT #hear — the screen as a real LCD (2026-10-19, revaudio-ef, same branch)

Request (laptop 1 user, on the #hear screen screenshot): "let's design this whole area so it looks like an LCD
screen". Today's screen = dark violet glass + blurred magenta glow on every readout: reads CRT / neon, not LCD.

- [x] L1. Bench `bench/drift-lcd-bench.html` (serve the worktree root: `python -m http.server 8796`): the real
  screen markup at the measured sizes (desktop 691 x 179, phone 314 x 127 / 284 x 127), live guide states on the
  real peaks.json, coach-fits + height checks under each screen. 0 = today, A = dot matrix (negative, magenta,
  cyan/magenta tags kept), B = 14-segment car stereo (DSEG14 italic, RevTune's file, OFL; ghost cells), C =
  reflective positive (lilac reflector, violet ink + 1 px liquid-layer shadow). All: heights = page, coach fits.
- [x] L2. The user's pick: B, segment ("go with your recommendation").
- [x] L3. Folded: drift.css "THE SCREEN" block (`.d-hear-sec .d-hear-screen` only) + `--d-f-seg` / `Drift DSEG14`;
  `src/lib/drift/lcd.ts` (ghost + lcdText: text and data-g together); hear.ts writes coach / title / tag / clock
  through it (words fade in 170 ms like liquid crystal, not under reduced motion) and draw() = the segment bar
  graph from `--seg-*`; bus.ts writes PAN through it; DriftHear.astro ships the first ghosts; font + licence in
  public/fonts/drift.
- [x] L4. Verified on the built dist: #hear panel height = live at 11 widths, the screen's parts identical
  (127 px phone; the 1.75 px at 360 is the earlier "3 PUSH DRIFT" caption, not the screen); all guide states
  (verify-hear.cjs); coach fits beside both tags at 14 widths down to 360 (coachfit.cjs, measured on the lit
  text, with a control); DSEG really loads; ghosts right (`PUSH AGAIN: ORIGINAL` -> `~~~~~~~~~~:~~~~~~~~~`);
  0 console errors; reduced motion = 0 fades. Window: inset only (embed law).

### Review (LCD)
- Below 360 (340 / 320) PUSH AGAIN: ORIGINAL loses its last letters, as the VT323 screen did at 320 before.
- Firefox without CSS alt-text support drops the ghost declaration: the screen then shows no ghosts (lit text intact).
- Not seen yet: a real phone (DPR 3), a real Safari (headless WebKit 2336 renders font, ghosts and arrow right).
- APPROVED on the page (laptop 1 user, 2026-10-19: "cool, looks killer"), told first that the segment D reads
  like ] (DRIFT), V like I/ and S like 5 and that the phone coach is 9.5-10.5 px: kept as is.

# DRIFT #hear — guide the visitor through the test drive (2026-10-19, revaudio-ef)

Request (laptop 1 user, on the live #hear screenshot): "let's open a branch and flesh this out in depth, so people
understand exactly what they need to do". Branch `drift-hear-guide`, worktree `Website/revaudio-website-hear`, off
origin/main `d0168a6`. Local only: a push waits for the word "push".

Constraint: the design picked today cut words (`ea323e0`: the closing line, the L/R letters, the balance bar;
`e5e00a1`: the explanatory headline "SAME TRACK. / FLIP DRIFT." became "LET'S DRIFT."). So the guidance lives INSIDE
the parts already on the panel (the LCD header cell, the step badges, the DRIFT button's own lamp, the breathing glow
PLAY already has). Any new visible words are an ask item (Q1-Q4 below), never part of a plain "go".

Baseline (live revaudio.net/drift, headless Edge, 2026-10-19): #hear panel 539 px tall at 1440, 588 px at 390.
Reference shots: session scratchpad `live/` (desk/phone: fold, idle, playing). Height budget: no growth; diff
every step (snap.ts soft-snaps the page to this panel).

## Findings (live audit)
- F1 Default = DRIFT ON: PLAY plays DRIFT first, so there is no reference; step 3 then turns DRIFT OFF. The story
  runs backwards (it should be: the original -> push DRIFT -> hear it change).
- F2 "3 FLIP" does not say what flips. The button shows only its current state (DRIFT ON or ORIGINAL), so it does
  not read as a two-way switch.
- F3 Once playing, nothing points at step 3 (only PLAY breathes, and only while stopped).
- F4 VOLUME sits inside step 3, so step 3 reads as two jobs.
- F5 Phone 360/390: the headline LET'S DRIFT. sits under the checker strip + sticker (headline 147-173 px vs checker
  145-167 px at 390; the screenshot shows it covered).
- F6 DRIFT is stereo movement: on phone / laptop speakers it barely shows, and nothing says headphones. The A/B is
  level-matched (fair), and nothing says that either.
- F7 Desktop: #hear starts below the first screen and nothing in the hero points to it.

## Steps (decided by the evidence)
- [x] A. Guide state in hear.ts: next = PLAY (stopped) -> DRIFT (ORIGINAL playing, DRIFT never pushed) -> COMPARE
      (heard DRIFT, not yet back to the original) -> none. `root[data-next]` carries it for the CSS.
- [x] B. LCD coach cell: the header's left cell (READY / NOW PLAYING today) names the next action while there is
      one (PRESS PLAY -> PUSH DRIFT -> PUSH AGAIN: ORIGINAL), then NOW PLAYING. Fits beside the tag at 360 px
      (19 px desktop = the readouts' size, 16 px phones, under the tag's 22 px box). One aria-live region (the cell).
- [x] C. Next-step light: the key of the next step lights and its control breathes with the glow PLAY already has
      (same keyframes d-hear-next); the DRIFT button breathes once the original plays (a ring on its bezel). The
      other keys rest dim until both sides were heard. No new animation.
- [x] D. Two-way read on the DRIFT unit: under the button, ORIGINAL and DRIFT side by side, the one you hear lit
      (cyan = the original, as the LCD tag; pink = DRIFT).
- [x] E. Headline (F5): the checker strip is cropped to the room left of the title (it collided up to ~770 px, not
      only on phones); the 試聴 tag is off on phones (it touched the title at 360, as #drive's on Dan 10-04).
- [x] F. Push-first path: pushing DRIFT before PLAY still starts in DRIFT; the coach then asks for the original.
- [x] G. Verify (below).

## Ask items (answered 2026-10-19)
- Q1 Default on load: ORIGINAL (yes).
- Q2 Step 3 caption: "3 PUSH DRIFT" (yes).
- Q3 "HEADPHONES ON" tag: no.
- Q4 A "HEAR IT" link from the hero to #hear: yes. Built as a lit magenta key + "HEAR IT" in the steps' CRT type, in
  the title panel under the tagline. Desktop: it rides in the panel's bottom pad, so the title and CTA panels still
  mirror (both 241 px at 1440, as live). 601-1099: in flow (+35 px on the merged panel). Phones: none, since the
  player starts where the first screen ends (390x844: catch line ends 824, #hear panel starts 860).

## Review (2026-10-19, revaudio-ef)
- Build green (27 pages). Checked on the built dist (python http.server 127.0.0.1:4417, headless Edge):
  - States at 1440x900 / 1366x768 / 820x1180 / 390x844 / 360x740: idle = PRESS PLAY + PLAY and key 2 breathe;
    PLAY = PUSH DRIFT + DRIFT ring and key 3; DRIFT = PUSH AGAIN: ORIGINAL; back = NOW PLAYING, every key lit, no
    breath; STOP = PRESS PLAY again; push-first (fresh page) = DRIFT plays + PUSH AGAIN: ORIGINAL. Coach and step
    captions never clipped; ORIGINAL / DRIFT inside the pair; the checker clears the title glyphs everywhere.
  - Heights vs live at 11 sizes (1920 down to 360): the #hear panel identical (360: 551 vs 552), header row 22 px
    everywhere, desktop hero identical; only 601-1099's hero +35 px (the link in flow). Snap unaffected (it keys on
    the panel height).
  - HEAR IT lands the #hear panel 87 px under the nav, whole panel on screen at 1366x768 (128-592).
  - Reduced motion: no animation (static rings). Keyboard: Tab order tracks > PLAY > STOP > DRIFT > VOLUME; Enter on
    PLAY, Space on DRIFT x2 walk the whole guide.
  - Console: 0 errors (only the Cloudflare RUM requests the test itself blocks).
  - Second pass (review): (1) while the sound loaded, `next()` gave '' = the free-play look (every key lit) for a
    moment after the first press; now 'wait' (coach LOADING, keys dim, nothing breathes, the DRIFT bars chase).
    Proved with every .m4a held back 2 s (390x844), PLAY and push-first both. (2) The HEAR IT key sat on the title
    panel's bottom-left screw and 4 px off its edge at 1100-1280 (the left pad shrinks to 35 px); now indented to
    clear the screw by 10 px and a notch smaller there: 10-12 px off the edge at 1100 / 1199 / 1280, hero panels
    still mirror (heights = live).
- Not checked: real iPhone / Safari / Firefox (the player's open item from 10-15 still stands); a human ear.

# Website — word-wall WEIGHT (checker S4, 2026-10-15, revaudio-32)

Request (Dan): "let's fix the weight", then "is there a way to make it lighter without hurting quality?" -> yes, go.
Baseline (dist, no scroll): laptop 1280x665 first load 2264 KB, phone 390x844@3 1822 KB; the TV = 380 KB of it on both
(frame tv-broken-2 webp 1400 = 248 KB at every width, DRIFT poster webp 1400 = 132 KB, eager, no srcset).

## Steps
- [x] Lazy: the frame + the poster load only once the wall is within one screen (IntersectionObserver, rootMargin
      100%), started after the page's load / the first scroll / 3 s (whichever first), decoded before they swap in;
      no-JS = `<noscript><style is:inline>` with today's 1400 webp.
- [x] Sharp per screen: JS picks the smallest cut that is still pixel-sharp here (frame: roll width x --ww-frame-u x
      DPR, u read off the frame's padding; poster: video CSS width x DPR); cuts frame 640/960/1400, poster
      800/1100/1400; upgrade only on resize / rotate / bench roll switch / carousel swap; 1400 stays the top.
- [x] Frame vars: SSR `--wfN-img:none`; JS sets `--wfN-img` + `--wfN-sl` (slices in the cut's own pixels) for the roll
      on show only. Every roll still gets its cuts in the build (an imported image Astro never transforms ships raw).
- [x] Proved the lazy + cut step on WebP first: laptop 1280@2 pixel-identical to today (Chromium + WebKit).
- [x] AVIF (frame q70, poster q50), WebP when the browser can't decode AVIF (1x1 data-URI probe).
- [x] N2: sizes read via `.clone`: drift-window-wall.png (2 MB) and gas-hero.png (4.3 MB) no longer ship raw.
- [x] Verify (below). Docs, commit by path. Push only on "push".

## Review — WEIGHT (2026-10-15)
- Measured on the built site, both builds on the same plain static server (python http.server, no compression),
  Chromium, homepage, no scroll, load + 4 s: laptop 1280x665@2 2264 -> 1887 KB, phone 390x844@3 1822 -> 1515 KB.
  The TV at the wall: laptop 183 KB (frame avif 111 + poster avif 71, was 380 in the first load); phone 70 KB (frame
  20 + poster 49), and on the phone it now starts after the load event (190 ms vs load 172 ms; was 10-57 ms).
- Quality, the built files vs the source resized (PSNR): frame 640/960/1400 webp 44.41/43.57/43.87 dB -> avif
  44.75/44.45/44.63; poster 800/1100/1400 webp 34.37/35.17/35.86 -> avif 35.78/36.08/36.23. Cut needs measured per
  screen (need.cjs): 390@3 frame 494 / poster 1049 px, 1280@2 1272 / 1231, 1920@1 636 / 736, 932x430@3 1694 (gets
  1400, as before). Side-by-side zoom sheets (checker corner, tape, broken corner + LED, gauges) at 1280@2 and 390@3.
- Reduced-motion shots before/after: laptop 1280@2 pixel-identical on WebP (Chromium + WebKit); headless WebKit on
  Windows has no AVIF, so it took the WebP fallback, still pixel-identical. Other sizes differ only by the cut's
  resampling (heat map: edges only).
- Video plays at the wall with the poster set (Chromium + WebKit, 1280 + 390), no console errors. No JS: frame +
  picture up in both engines (Chromium forces video controls without JS: their panel is hidden in the noscript style).
  `--ww-ar` and the video's width/height identical to 697f49d. Lock test (snapfresh) unchanged. Dev: all three rolls
  switch (first AVIF of a roll takes a few seconds in dev only). Build green, no __wwbench in dist.
- Gotchas met (tasks/lessons.md): a stray `astro preview` on ::1:4431 answered `localhost` with compressed responses
  while python held 127.0.0.1:4431 (unfair first numbers); headless WebKit on Windows never fires `load` (stalled
  videos), so the art never waits on `load` alone.
- Open for Dan: real Safari / iPhone check (AVIF path), as before.
- Pushed to main 2026-10-18 on Dan's "push" (rebased onto edb5049; re-checked after the rebase).

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
- [x] Screen wall (DRIFT_BG) after "the whole back a digital screen"; TV window kept as an option (DRIFT_WIN).
- [x] Broken TV frame round the screen wall (DRIFT_FRAME, 3 rolls, bench switch + size + gap); verified swap,
      scrollbar, steer clamp, Chromium + WebKit.
- [x] Neutral set (Dan: "more neutral, fewer colours"): frames re-cut colourless, LED = house --emerald.
- [x] CHANNELS (Dan 2026-10-14: "every plugin on the TV, only the screen changes when the carousel moves, like
      changing channels"; picks: each plugin its own screen colour, a short burst of static, no channel number):
  - [x] The TV belongs to the whole word wall, not the DRIFT panel: WALL_BG / WALL_FRAME on .ww (were DRIFT_BG /
        DRIFT_FRAME on the DRIFT panel); screen + frame on for every panel, with or without drift.homeLead. (3b5dff0)
  - [x] One phosphor colour per channel (hue + saturation vars on .ww, mapped from the active panel): DRIFT violet
        (as now), RevLimiter amber, GAS brass gold, Radio Roulette warm dial-glass cream. (a5b89c5)
  - [x] RevLimiter / GAS / Radio Roulette (and DRIFT 'current'/'steer'): kicker, stencil words, hot word, caption,
        name and window edge in their channel's phosphor instead of brass on wood. DRIFT neon keeps its own tubes.
  - [x] Channel change: a ~300 ms burst of static over the picture when the carousel moves (canvas noise, only
        during the switch; reduced motion = the plain crossfade; hc = none). (5a1ef8d)
  - [x] Bench: channel hue + saturation sliders x3 (RevLimiter, GAS, Radio Roulette; DRIFT's violet is not on a
        slider), static length; WOOD/SCREEN + frame switches drive .ww.
  - [x] Verify: see the review below.
- [ ] Dan picks + tunes on the bench -> "apply ww bench" -> bake (delete the unpicked rolls) -> commit. Push only on "push".

- [x] Frame checker paint in burnt RevAudio yellow (Dan: "replace the purple with a burnt yellow"); dev cache-bust. (d081341)
- [ ] TV = ONE SCREEN (Dan 2026-10-14: "when I scroll, the site fits the screen exactly, not past the edges top and
      bottom"; pick: only the TV + a scroll lock):
  - [x] A, laptop (>= 861px): #sound = 100svh - the nav (min-height, @supports svh); .ww padding from the bezel + a
        breath; the words + windows sized to the glass (--ww-room): words min(old clamp, (room - tag) / 4.6), windows
        width-capped by their aspect (--ww-ar), GAS max-height; never larger than before. Content centred.
  - [x] Scroll lock: armed only by the user's wheel / touch / scroll keys, fires once scrolling is idle and no finger
        is down, only if the TV fits the screen and its top is within --ww-snap-zone of the nav; lenis.scrollTo.
        None under reduced motion (no Lenis). Bench: Lock zone + Breathing room sliders; toSound = the exact target.
  - [x] Verify A (see the review).
  - [x] B, single column (<= 860px), SEPARATE commit (Dan: "build part B"): words ~74 -> ~46 px, GAS window
        ~384 -> ~150 px on a 390x664 phone (svh).

## Review — CHECKER FIXES before the main push (2026-10-14)
- Dan: "send a checker; if it passes push to main, if not fix then push". revaudio-website-agent on c1dada5: LCP, CLS 0,
  TBT, idle CPU, video gating, carousel, all pages, no __wwbench, reduced motion passed. Found and fixed:
  - B1 (blocker): the lock pulled one wheel notch / arrow tap back to the TV (small steps never got away). Now the lock
    lands only when this gesture brought the TV closer (startY at the gesture's start).
  - S3: no lock on a sideways wheel, Space on a button, a wheel in an open dialog, or in hc (page did not move = bail).
  - S2: the TV layer divs made every panel `:not(:first-child)`, so the first panel's reveal got the swap stagger;
    selector now `.ww-panel ~ .ww-panel`.
  - S1: landscape phones (844x390 / 667x375 / 853x443) rendered 0x0 windows; `--ww-media-h` floor 8rem (there the TV
    is taller than the screen, so it scrolls and the lock stays off).
  - Mine, found re-testing in WebKit: headless WebKit paints scroll every ~190 ms, past the 160 ms idle, so the lock
    saw "page did not move"; it now waits while Lenis is still gliding (`isScrolling === 'smooth'`; native touch untouched).
- Re-checked on the fix (dev server, served code grepped first): lock, fresh page per case, Chromium + WebKit 1280x665:
  near wheel down 140 -> 0, far 420 -> 380 stays, past wheel up -150 -> 0, far past -420 -> -380 stays, near wheel UP
  (away) 100 -> 140 (no pull back), ArrowDown near -> 0, programmatic -> no lock; notches + arrow taps from 0 progress
  both ways (0 -> 100 -> 200 -> 300); sideways wheel -> no lock. Touch (Chromium, laptop + phone): held -> no lock, lift
  -> 0, far stays, tap nothing. Reveal: first panel no swap animation, a swapped-in panel staggers (both engines).
  Fit both engines: 360x640 ... 860x900 and 1024 / 1280 / 1920 laptops exact (section = screen - nav, all inside the
  glass, 0 sideways); landscape phones: windows 86-265 px wide (were 0), section taller than the screen (by design).
  `npm run build` green, no __wwbench in dist.
- Not fixed then (FIXED 2026-10-15, "Review — WEIGHT" above): S4 first load +~369 KB laptop / +~246 KB phone (frame webp 254 KB at every width, DRIFT
  poster 136 KB, no srcset) = the price of the TV; N1 snow +48 ms main thread per channel change (~2.7 ms/frame, no long
  task); N2 6.4 MB raw PNGs in dist never requested (gas-hero.png, drift-window-wall.png: reading `.width` on the import
  marks them used) + unused rolls 1/3 until "apply ww bench"; N3 hc still sizes the TV; N4 an anchor right after a wheel
  can lock; N5 +9 % main thread with the pointer over the wall (steer); N6 the run has no pause button (design call);
  N7 scanlines stripe the phone button (design call). Not checked: real iPhone / Mac Safari, Firefox, Lighthouse.

## Review — ONE SCREEN, part B (2026-10-14)
- Fit, Chromium + WebKit 360x640 / 390x664 / 390x844 / 430x932 / 600x900 / 768x1024 / 860x900 (+ Chromium 360x740),
  all 4 channels: section = innerHeight - nav exactly, everything inside the glass, 0 sideways scroll. First pass was
  5-21 px over: the name + button block is 120-133 px with its margin, not the 112 budgeted; fixed (--ww-go-h).
- Lock on a phone (Chromium 390x664 mobile, CDP touch): finger held -> no lock, lift -> lands at 0; far -> stays; tap
  -> nothing. Laptop sizes unchanged by B (the shared block only moved; laptop rules identical).
- Build green, no __wwbench in dist. Not checked: a real iPhone / Android, Firefox.

## Review — ONE SCREEN, part A (2026-10-14)
- Fit, Chromium 900x700 / 1024x600 / 1141x636 / 1280x665 / 1440x800 / 1728x1000 / 1920x1080 / 2560x1440, WebKit
  1024x600 / 1141x636 / 1280x665 / 1440x800 / 1920x1080, all 4 channels: section height = innerHeight - nav exactly
  (no min-height growth anywhere), everything inside the glass, 0 sideways scroll. Words at 1280x665 115 -> 98 px,
  1141x636 103 -> 92 px; GAS window 544 -> ~382 px tall at 1280. 1728 and up: words capped (134 px), centred with
  room round them (2560x1440: 654 px of content in a 1294 px glass).
- Lock, Chromium + WebKit 1280x665, Chromium 1141x636: wheel stopping 100 px off -> lands at 0; 380 px off -> stays;
  scrolled 110 px past, wheel up -> 0; ArrowDown near -> 0; a script's scrollTo near -> no lock. Reduced motion
  (Chromium): no lock. Touch (Chromium 1280x800, CDP touch events): finger held 700 ms -> no lock while down, lift ->
  0; far -> stays; a tap -> nothing. Bench: Lock zone 0 -> no lock, 30 -> lock; toSound lands at 0.
- Phones / tablet unchanged: 860x900, 390x844, 360x740 section and font sizes identical to before.
- Build green, no __wwbench in dist. Gotcha: the dev server twice missed a quick second edit to WordWall.astro
  (served a stale transform); `touch` the file and re-fetch before trusting a dev test.
- Not checked: a real Mac / iPad, Firefox.

## Review — CHANNELS (2026-10-14)
- Checks that ran on the final commit (5a1ef8d), local dev server:
  - `npm run build` green; `dist/` has no `__wwbench`.
  - Chromium + WebKit at 1141 / 1280 / 1728 / 860 / 390 / 360, each of the 4 channels shown in turn: the kicker,
    words, window, caption and name all inside the TV glass, 0 px sideways scroll.
  - Static: Chromium + WebKit at 1280 + 390: snow on at +120 ms, gone by +820 ms; none with the wall scrolled
    off screen, none when the same panel is picked again; Chromium reduced motion: none.
  - Bench: the Static length slider reads 300; set to 600, the burst lasted 616 ms (Chromium).
  - drift.homeLead off (flag flipped on the dev server, then restored, tree clean): no DRIFT panel, Chromium
    1141-360 all channels inside the glass, 0 sideways scroll; static fires on RevLimiter -> GAS (Chromium 1280)
    and -> Radio Roulette (WebKit 390). Step 1 also checked RevLimiter opens first with the TV on.
  - hc: Chromium + WebKit at 1280 + 390: screen, fx, snow and frame display:none, no snow on a channel change,
    the words plain white (no phosphor stroke or glow).
  - Only console noise: the dev toolbar's 403 through the node_modules junction (dev only, not in the build).
  - Bench, real clicks (Chromium): the header channel button (GAS) switches both frames and plays the snow in both;
    a channel colour slider changes the screen glow in both.
  - Real carousel clicks on the homepage (Chromium; a visitor at the carousel clicks next / a dot):
    1141x636 + 1280x665: the carousel fills the screen, the wall starts below the fold (0 px visible), so the static
    is skipped and the visitor scrolls down to the new channel already on. 390x844 (wall top 170-312 px visible
    under the carousel) and 1728x1000 (126-250 px): the snow plays. With the carousel's bottom at the screen's
    bottom edge: 0 px of wall, no snow, at every size. Open for Dan: keep as is, or play the static when the wall
    scrolls into view after a channel change (not built).
- Not checked: a real iPhone / Mac Safari (WebKit here is Playwright's Windows build), Firefox.
- Left for Dan: pick a frame roll + tune colours, frame size and static length on the bench.

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
