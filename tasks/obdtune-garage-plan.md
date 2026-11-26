# OBDTUNE page: the tool sits in our 3D garage (plan, approved by Dan 2026-11-27)

Branch `feat/obdtune-onepager`, worktree `.claude/worktrees/obd-onepager`. State and push rules: the top entry of
`tasks/handoff.md`.

## What Dan asked
- 11-27: "C put the background look like it's on a desk". He chose to see all three desks, then: "think like this plugin
  sits somewhere in the 3D garage we build" and "keep the same room we have ... in the last branch".
- So the page background is a view of the long garage, rendered from the 3D set itself. The live OBDTUNE stands on a
  surface in that view.
- Three options, one per real spot. He picks one. Then it goes live (his push word: the handoff entry).

## The room: `feat/phone-dive` at `14ba0ff`
- The newest room. Its last room change is `e5a8f30` (11-24), and it has `feat/garage-home` merged in.
- The file is `tools/_home-opening/room.html`. Not main's, and not `feat/home-opening`'s: those are older.
- Render from a **detached temp worktree** of that commit under `.claude/worktrees/`. The `phone-dive` worktree belongs to
  another session.
- Remove the temp worktree when you're done.
- The room's files and data are never edited. No new lamps.
- AI makes no frames. No Higgsfield credits are needed.

## The three spots (slots and moves as at `14ba0ff`)

| | Spot | Slots | Also in the frame |
|---|---|---|---|
| **A**, Claude's pick | the wood workbench L09 (vice, soldering), 2.6 x 0.92 x 0.75 m, at the left wall (side -1), moved to f 0.8299 | the clamp lamp N12 at f 0.9484, x -3.21, y 1.55 (light bank `lamp1`); the pegboard L01 and the parts shelf L12 behind | RevFX's lunchbox M01 (f 0.7695), the test gear W01 (0.816), the solder station W05 (0.8507), the RPM-gauge build W02 (0.8854) |
| **B** | the test-drive desk W07 (DAW + code screens), 1.4 m, at the left wall, f 0.441 | the vintage monitors L13 and L14 on it | the screens |
| **C** | the mixing desk E01 on the end wall (studio-desk.glb) | the monitors E02 and E03, the synth E04 | the RevLimiter console M03 at x -0.8, z 0.97-1.05 |

- The room has no steel bench: the red tool chests carry the VU racks. So B is the room's real second desk, and the
  handoff says so to Dan.
- Why A: a scan tool belongs on the workbench, and N12 can sit up and to the left of the tool. That is the same side as the
  light baked into the plugin's photos.
- The aisle runs along z. The camera walks toward a smaller z at x≈0. f maps roughly to z: f 0.063 → z≈1, f 0.77 → z≈9.2.
- Facing the left wall (looking at -x), screen-right is -z, so a lamp at a larger z appears on the LEFT.
- For A, N12 sits at about z 11.3, the far end of a bench that spans about z 8.8-11.4. Stand the tool at about z 10.2-10.8,
  so the lamp is up and to its left.

## Rendering
**Open the room**
- Serve the temp worktree with `python3 -m http.server <port> --bind 127.0.0.1`.
- Open `tools/_home-opening/room.html?capture=<walk 0..1 near the spot>&expose`.
  - `capture` holds the lights steady, turns the frame governor off and hides the nav.
  - `expose` sets `window.__room = { R, camera, L, S, walkDist, arrange, go, renderer, composer }`.

**The script**
- A Playwright script in the session scratchpad, modelled on `tools/_home-opening/still.mjs` (an ESM file: `goto` with
  `waitUntil: 'load'`, then a fixed `waitForTimeout(5000)` for the intro's lights; it has no ready flag).
- Add your own "everything is in" check, so no model or texture is still loading: for example, wait until two screenshots
  a second apart are identical.
- Real Chrome (`channel: 'chrome'`) with `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`. Without those, WebGL
  falls back to software.
- Playwright comes from `/Users/danavivi/projects/revaudio/revaudio-website/node_modules`. Run it with NODE_PATH and a
  .cjs file.

**The camera**
- `frame()` rewrites the camera each frame (`camera.position.set(...)`, `camera.rotation.set(...)`).
- Take it over: `camera.matrixAutoUpdate = false`, then set `camera.matrix` from your own position, aim and fov, set
  `matrixWorldNeedsUpdate`, and call `updateProjectionMatrix`.
- If something fights that, patch only the served copy with Playwright `page.route`. Never edit the file.

**The look**
- Keep the room's own look, VHS (`LOOK_DEFAULT`, Dan's pick for the home page).

**Prove A first, before B and C**
- Make one rough frame and lay the live tool over it at laptop size. The tool is `--obd-unit-h`, about 86% of the stage
  height.
- Check three things:
  - the camera take-over works;
  - the light falls from the tool's upper left;
  - with so little scene above and below the tool, it still reads as the garage.
- If it only reads with a smaller tool, that changes the layout Dan approved: ask him.

**Framing**
- The camera is about chest high and faces the spot, tilted slightly down. The surface's front edge runs across the frame.
- The tool stands **upright, facing the camera**, at the front of the surface. Its live UI is a flat front-on photo, so the
  camera has to face it.
- Leave its spot empty in the render.
- The right side, where the column sits, falls into calm shadow.
- The frame covers windows up to about 2560x1440. The far garage is softly out of focus, so the tool is the one sharp
  thing.
- Save one establishing shot per spot as well: where it is in the room.

**The image files**
- Post-processing uses only the render's own pixels: a light softening and darkening behind the column, baked into the
  file.
- Save to `src/assets/obdtune/garage-{a,b,c}.png` and serve as webp through `getImage`. `docs/assets.md` says pictures go
  in `src/assets/`, never `public/`.
- That file sets no size budget. Keep each frame small (aim for at most about 300 KB WebP at 2x) and tell Dan the number.
- The page loads one image, never the room.

## The page (`src/styles/obdtune.css`, `src/pages/obdtune.astro`, `src/lib/obdtune/init.ts`)
**The render follows the tool, not the viewport**
- The tool is `clamp(380px, 86% of stage, 700px)` in a centred grid capped at 1240px. If the render is scaled by stage
  height, it breaks in tall windows.
- So place the render as an absolutely positioned image inside `.obd-unitwrap`, with its size and offset in
  `--obd-unit-h` units, measured from the empty spot in the render. The surface line then stays under the tool at every
  size.
- No clipping is set today (`.obd` is only `position: relative`). Add `overflow: clip` to `.obd` or `.obd-stage`, so the
  render can never cause a sideways scroll.
- Where the frame runs out, its edges fade into the house dark.

**The tool stands still**
- Remove the `obd-hover` bob and the pointer lean (the tilt loop in `init.ts`).
- `.obd-floor` becomes a flat contact shadow under its base.
- **Do not add another drop-shadow.** The plugin already paints the house FLOATING shadow on its own root:
  `public/obdtune/ui/obdtune.css` `.obd`, `filter: drop-shadow(3px 4px 8px rgba(12,9,6,.55)) drop-shadow(18px 24px 48px
  rgba(12,9,6,.5))`, scaled with the tool.
- Judge on the render whether that shadow reads right against the wall and bench. If it must change, change it in the
  page's CSS over the shadow root's host, never in the synced plugin files.

**The column**
- Screen C keeps its rubber well.
- The name, index and fine print get the GAS 2 per-letter halo, so they hold AA contrast on the render.
- The keys are unchanged.

**Switching options**
- A dev-only `?desk=a|b|c` switcher (`import.meta.env.DEV`), read before the first paint. Same shape as the old screen
  switcher: fixed at the top right.

**Phone (≤860 px)**
- The same rule: the render follows the unit's box, with the column below on the fade.

## Checks
**Sizes**
- Chromium 1312x734 (Dan's Chrome), WebKit 1141x636 with the sale strip on (Dan's Safari), 1920x1080 and 2560x1440.
- Chromium and WebKit at phone sizes.

**At each size**
- One screen, with nothing clipped.
- The tool's base sits on the surface line.
- No bare edge: the frame fades.
- All 18 readings fit screen C. The fit probe injects each reading the way `fill()` does and measures the spare space in
  `.obd-glass`.
- Presses switch the reading.
- No page errors. The dev toolbar's 403 is dev only.
- No sideways scroll.

**Contrast and build**
- AA contrast sampled behind the name, the index and the fine print.
- `astro build` green.
- tsc on `init.ts`.

**For Dan**
- A pick page artifact: the three whole-page stills side by side, each with its establishing shot and its "also in the
  frame" line, the pick (A), pick keys, and notes in db `picks/desk1`.
- Open `/obdtune/?desk=a` in Dan's Safari. Real Safari is the check: Playwright WebKit missed the 11-26 width bug.

**After his pick**
- Keep that render. Delete the other two and the switcher.
- Commit by explicit paths.
- Then the push (handoff entry).
