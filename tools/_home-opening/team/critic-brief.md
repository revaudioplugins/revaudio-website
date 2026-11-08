# Critic brief: the long garage (written for the look pass, round 1, 2026-11-08; reuse per round)

## What you're judging
RevAudio sells audio plugins drawn from cars. Its homepage opening is a long 3D garage-studio (Three.js): the visitor
scrolls and walks down the aisle to a TV on the far wall that shows the live site; the walk locks onto it.
Code: `/Users/danavivi/projects/revaudio/revaudio-website/.claude/worktrees/home-opening/tools/_home-opening/room.html`
(branch `feat/home-opening`). This round's change is commit `04d8285` ("the look pass, part 1").

The look pass (plan item 1b in `tasks/todo.md`, "The rebuild") puts real light and materials on the existing set:
CC0 PBR textures (`assets/pbr/`, one material per kind of slot), AgX tone mapping on the room (the TV face and CRT
screens keep their exact pixels), amber pendant lamps with shadows, violet / magenta neon strips, the REVAUDIO neon,
a wet sealed-concrete sheen, the room's own reflections on shiny things, contact shadows, haze under the lamps,
a few lit props. **The props are still simple dressed blocks**: real models come later (step 3: the far end; step 4:
entrance + car, the car modelled by Dan's team). Judge what the look pass can carry, and tag every note:
- **LOOK** = fixable now in light, colour, exposure, bloom, haze, reflections, which material a slot gets, a light's
  place or strength, texture scale;
- **MODEL** = needs real geometry (later steps). Still say it if it hurts the read.

## Read first
1. `tools/_home-opening/look-spec.md`: the rulebook and Dan's own words; its 7 scored lines are your score sheet.
2. The painting, the mood reference: `painting-walk-000.webp` in the pack (painted from the 3 Nov room: different layout,
   purple car; take its light, colour, grime, not its layout).
3. Optional: `tools/_home-opening/look-board.json` (what Dan loved in each reference) and the photos in
   `tools/_home-opening/refs/board/` (local only).

## The pack
The folder named in your round's prompt (renders made with `room.html?capture=<walk>` at each size):
- `walk-000 ... walk-097-1141x636.png`: the walk at Dan's laptop size (1141x636), every 10 % (0 = the first screen,
  97 = just before the TV lock); `walk-sheet-1141.png` = all of them in one sheet.
- `walk-*-1920x1080.png`, `walk-*-390x844.png` (phone: its own camera path is a later step; note only blockers).
- `before-lookpass-walk-000.png`: the same spot before this round. `painting-walk-000.webp`: the mood reference.
Stills are clean captures (no sway, dust, labels; the page's big line "BUILT LIKE CARS." and nav hidden).
The live room: `http://127.0.0.1:4471/tools/_home-opening/room.html` (Playwright with `channel: 'chrome'`, require it
from `/Users/danavivi/projects/revaudio/revaudio-website/`); `?capture=<0..1>` = a clean still at that walk spot.

## Rules
- Read only. Don't edit, create or delete anything in the repo; write scratch files only under
  the scratch folder named in your round's prompt.
- No image generation, no paid APIs, no network beyond the local server.
- Look at the images yourself; don't guess from the code what a frame shows.

## What to hand back (under 500 words)
1. Scores 0-10 for the look spec's 7 lines, one line of reason each.
2. At most 8 fixes, ranked by how much they move the look: the image + region (e.g. "walk-030, top-left shelf"),
   what's wrong, the fix in concrete words (which light / material / value, more or less), LOOK or MODEL, how sure
   (high / medium / low).
3. One sentence: the single biggest thing between this and the painting's mood.
