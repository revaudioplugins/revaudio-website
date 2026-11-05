| `plate-pedal-v2-w/-s/-t.jpg` | burnt titanium, its heat tint RETINTED to the five pedal colours (HALO green, GLUE cyan, PITCH ice blue, REVERB violet, ECHO pink: `retint.py`, run on the gpt-image-2 originals; Yoni: "like the shades of color of the pedals") with the patchbay plate's wear + a screw in each corner, 2:1 / 1:1 / 1:2 | gpt-image-2 edits with 2 refs: `bay-1` (wear, screws) + `tib-1` (burnt colour) (`gen-assets-9.ps1`; the sheet: `gen-assets-8.ps1`) | every section's plate, 9-sliced (slice 94 / 78 / 94 px; the border = the screw zone) |
# RevFX #rfx-hear assets (2026-11-05, Claude Code `revaudio-0d`)

The before/after player on /revfx (`src/components/revfx/RfxHear.astro`) is built from photo-real 90s gear made with
OpenAI (`shared/tools/openai/`). Files: `src/assets/seasons/revfx/hear/`.

| File | What | Made with | Shown |
|---|---|---|---|
| `panel-wide.jpg` | tolex flight-case face, aluminium rails, ball corners (2560x1008 = 2.54:1) | gpt-image-2, edit from roll-1 `panel-2` | laptop panel, stretched 100 % x 100 % |
| `panel-tall.jpg` | the same case, portrait (1024x1616 = 0.63:1) | gpt-image-2, edit | tablets + phones |
| (`bay-1`, scratchpad only) | black anodized patchbay plate: Yoni's wear benchmark ("the left panel which looks amazing"); the wear reference for the plates. Its `bay.jpg` was retired when the patchbay became titanium too ("do the left panel also with the titanium") | gpt-image-2 | - |
| `board-wide.jpg` / `board-mid.jpg` | pedalboard loop-carpet + 2 riveted rails (3:1 / 2.1:1) | gpt-image-2, edit from `board-1` | the STOMP board, laptop / phone |
| `jack.png` | 1/4" jack socket, front-on, true alpha | gpt-image-1.5 (`jack-2`) | the 4 inputs |
| `plug.png` | right-angle plug from the front + purple tweed cable | gpt-image-1.5 (`plug-1`) | the picked input |
| `patch.png` | pancake patch cable, top-down | gpt-image-1.5 (`patch-1`) | between the five |
| `titanium.jpg` | dark satin titanium sheet with a soft violet-blue heat-tint band + a touch of gold (2:1) | gpt-image-2 (`gen-assets-7.ps1`, roll 2) | every section's plate (screen, PLAY, STOMP, VOLUME, the switch plate), each showing its own patch of the sheet |
| `screw.png` | Phillips pan-head screw, aged nickel, top-down | gpt-image-1.5 (`gen-assets-6.ps1`, roll 1) | the 4 corners of every plate |

Prompts: `gen-assets-1.ps1` (8 assets x 2 rolls), `gen-assets-2.ps1` (the plates again at their display ratios,
reference-guided) `gen-assets-3.ps1` (a looper pedal: Yoni said the first shiny chrome switch "looks toyish"; then "its the whole pedal, i
meant just the switch ... a bit of petina ... when pressed make it stay pressed and when bypassed make it pop out"),
`gen-assets-4.ps1` (the switch at ~45 deg: too side-on for the flat board), `gen-assets-5.ps1` (~15 deg: Yoni "still
too much on a side view"), `gen-assets-6.ps1` (~8 deg, the pick, + plain steel textures and the screws) and
`gen-assets-7.ps1` (titanium, too dull: "the panels are dull"), `gen-assets-8.ps1` (the burnt sheet) and
`gen-assets-9.ps1` (the plates).

Checks (need the dev server on :4399): `node tools/revfx-player/checks/screws.cjs` (every plate's 4 screw corners vs
everything inside it, 10 widths, BYPASS + REVFX; control-probed: a planted element in a corner fails at all 10) and
`node tools/revfx-player/checks/fit.cjs` (switch / pedals / board fit, panel height, sideways scroll). Each writes next to itself; crop / size with the numbers in the component (alpha bbox, square
crop on round parts, one shared crop box for the two LED states).

The REVFX button is no asset: /drift's CSS push-to-start (drift.css `.d-start`) in RevFX purple (Yoni: "make the
engage / bypass button not a stomp switch ... like for drift"); the switch photos (`gen-assets-3..6`) were retired.

Checks also: `node tools/revfx-player/checks/names.cjs` (the pedal names never closer than 4 px).

Retint: `python -I tools/revfx-player/retint.py <folder with plate-w/-s/-t.png>` (the OpenAI originals live in the
session scratchpad; keep a copy before re-running). OpenAI credits ran out 2026-11-05, so this pass is local.

Rules learned:
- A changed image under the SAME file name stays stale in the browser on the dev server (no content hash in the
  /_image URL): every new look gets a new name (retint.py LOOK).
- A heat-tint recolour that keeps a photo real: move only the HUE of the tinted pixels (blend in by saturation, so grey
  metal, worn silver edges and screws stay put), give every target colour an equal plateau of the tint's own area,
  and lift a neon colour's value (a dark pink on dark metal reads violet).
- `gpt-image-1` is retired. `gpt-image-2` = best realism, opaque only, no `input_fidelity`, custom sizes up to 3:1.
  `gpt-image-1.5` = transparent cutouts.
- Make a plate at the ratio it shows at and stretch it. 9-slicing (`border-image ... round`) the first plates left
  visible seams on the rails and plate edges.
- A pressed / lit state made by a plain edit drifts (the washer grew a second edge): mask the edit to the part that
  moves and composite it back into the original's pixels.
- Plates that must fit any box: a PHOTO plate (wear + screws baked in) 9-sliced with `stretch` (not `round`), the slice
  just past the screws, the border width = the screw zone, so content can never reach a screw. A texture + CSS bevels
  + screw layers read flat ("dull"); the wear has to be in the photo.
- "Floating" = shadows that disagree. One key light for the whole rig (shadows all down-right), and every part
  sitting IN something (a bore, a seat ring, a machined cutout; a cable that goes under the next plate instead of
  fading out) glue CSS-placed photos into one object.
- The fader is /drift's (`src/assets/seasons/drift/hear/fader-*.webp`), so the site keeps one fader.
