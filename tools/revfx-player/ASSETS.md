# RevFX #rfx-hear assets (2026-11-05, Claude Code `revaudio-0d`)

The before/after player on /revfx (`src/components/revfx/RfxHear.astro`) is built from photo-real 90s gear made with
OpenAI (`shared/tools/openai/`). Files: `src/assets/seasons/revfx/hear/`.

| File | What | Made with | Shown |
|---|---|---|---|
| `panel-wide.jpg` | tolex flight-case face, aluminium rails, ball corners (2560x1008 = 2.54:1) | gpt-image-2, edit from roll-1 `panel-2` | laptop panel, stretched 100 % x 100 % |
| `panel-tall.jpg` | the same case, portrait (1024x1616 = 0.63:1) | gpt-image-2, edit | tablets + phones |
| `bay.jpg` | black anodized patchbay plate, 4 screws (0.67:1) | gpt-image-2 (roll-1 `bay-1`) | laptop PLUG IN strip |
| `bay-wide.jpg` | the same plate, wide (3:1) | gpt-image-2, edit | tablets + phones |
| `board-wide.jpg` / `board-mid.jpg` | pedalboard loop-carpet + 2 riveted rails (3:1 / 2.1:1) | gpt-image-2, edit from `board-1` | the STOMP board, laptop / phone |
| `jack.png` | 1/4" jack socket, front-on, true alpha | gpt-image-1.5 (`jack-2`) | the 4 inputs |
| `plug.png` | right-angle plug from the front + purple tweed cable | gpt-image-1.5 (`plug-1`) | the picked input |
| `patch.png` | pancake patch cable, top-down | gpt-image-1.5 (`patch-1`) | between the five |
| `looper.png` | worn black-hammertone 1590B A/B looper pedal with its 3PDT switch + LED hole, top-down (0.742:1 with its side jacks) | gpt-image-1.5 (`gen-assets-3.ps1`, roll 1) | the STOMP switch: the whole pedal is the button |
| `led-lit.png` | chrome LED bezel lit violet | gpt-image-1.5 edit | laid on the looper's bezel (centre 50 % / 14.15 %, 26.4 % wide) |

Prompts: `gen-assets-1.ps1` (8 assets x 2 rolls), `gen-assets-2.ps1` (the plates again at their display ratios,
reference-guided) and `gen-assets-3.ps1` (the bypass pedal: Yoni said the first loose chrome switch "looks toyish"; a
footswitch reads real once it is mounted in a pedal). Each writes next to itself; crop / size with the numbers in the component (alpha bbox, square
crop on round parts, one shared crop box for the two LED states).

Rules learned:
- `gpt-image-1` is retired. `gpt-image-2` = best realism, opaque only, no `input_fidelity`, custom sizes up to 3:1.
  `gpt-image-1.5` = transparent cutouts.
- Make a plate at the ratio it shows at and stretch it. 9-slicing (`border-image ... round`) the first plates left
  visible seams on the rails and plate edges.
- The fader is /drift's (`src/assets/seasons/drift/hear/fader-*.webp`), so the site keeps one fader.
