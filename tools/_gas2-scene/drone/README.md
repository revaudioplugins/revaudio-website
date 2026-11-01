# The drone intro (page-b) — blockout, branch `feat/gas2-drone`

Dan, 2026-10-28: a drone hovers above the station; scrolling brings it down into the page's own scene; then GAS 2 pops
out and the readings pop in fast. A car drives right to left on load with **CATCH YOUR COUPON** on its roof, readable
from the hover. One flight per load (scrolling back up does not fly back). Owner: Claude Code `revaudio-59`.
Catch the car (Dan, 2026-10-28): a click / tap on it (`world.car.hit`, a generous box round the moving car) fires
`dr:caught`; page-b opens the coupon ticket (`#cpVeil`) and copies `CATCH10` = 10% off the whole store. The code must be
a live Paddle discount before this page goes live: Gil, RevTasks #193 (shared `collaboration/STATUS.md`).

State: Dan picked the default camera (TOP). The flight's art is real (gpt-image-2, 2026-10-28): the aerial (field, roof,
road), the close-up road round the landing spot and the car with its roof sign. The walls stay blockout boxes (the TOP
flight never sees them: the page frame takes over first); the sidewalk props are left out, the page frame has them. The angled presets still see past the aerial onto the blockout ground.

## Run it

```
cd tools/_gas2-scene
python -m http.server 4464 --bind 127.0.0.1
```

Open `http://127.0.0.1:4464/page-b.html` and scroll. Any free port works.

| Address | What |
|---|---|
| `page-b.html` | the flight (TOP by default) |
| `?cam` | **the camera bench** (Dan 2026-10-28): drag the scene to turn the hover camera; sliders for the hover (Around, Down, Height, Aim x / z) and the landing (Lands at, Turn from, Arrive); a Scroll slider + readout. It never hands over: scroll up and down freely. Fly = the real flight with these values; Copy = the values to bake in |
| `?angle=top` / `front` / `right` | a hover preset: straight down / 45° down from the front / 45° down and 45° round to the right |
| `?dev`, then TUNE (or T) → Drone | presets (a click flies it), Hover m, Length (screens of scroll), Sway; Camera (opens `?cam`), Fly again, Car, Skip, Copy |
| `?drone=0` | the page without the intro (also with `?bench`, `?rbench` and reduced motion) |
| `?autofly` | flies itself 3 s after the hover (hands-free demos, device checks) |
| `?landhold` | QA: freezes on the exact landing frame instead of handing over |

TUNE settings live in this browser's localStorage (`gas2page-b:drone`) and win over new defaults in the code. If a
change in the code "does nothing", clear that key or press Copy to see what is stored.

## How it works

- `drone.js` — boot. A plain script in `<head>` (one line in page-b), so the readings never flash before the hover.
  Holds the settings + presets, adds `html.dr-on dr-hold`, the TUNE section, then imports `run.js` (and `cam-bench.js`
  with `?cam`). Any failure = the page as it was.
- `cam-bench.js` — the camera bench panel (bench only; the page never loads it without `?cam`).
- `cue.js` — the scroll cue at the bottom of the hover (Dan picked the chevrons from a bench of five, 2026-10-29): in once the hover shows, out with the first scroll (run.js hands it u); CSS in `drone.css`.
- `run.js` — the flight. A full-window WebGL canvas over the page, a scroll runway (`--dr-len` screens), the camera
  path, the hand-off and `pop()` (the readings' entrance, WAAPI).
- `world.js` — the 3D set (three.js r185 in `vendor/`): ground (road, cracks, potholes, field), shop box, roof with
  GAS 2 painted on it, no sidewalk props (the page frame has them), the car, sky, and the **landing quad**: the page frame (`img/land.webp`) on a
  plane 60 m out that exactly fills the landing camera's view.
- The landing camera matches `frames/f6-v17.png`: f = 1500 px on 1536×1024, eye 1.33 m, wall 6.6 m ahead. The canvas
  uses the page's own `.scene` crop (`setViewOffset`), so touchdown lands pixel for pixel at any window size.
- **One path for any hover camera, always exact:** the drone flies a straight line from the hover down onto the
  landing spot (log altitude, there at *Lands at*, default 42 % of the scroll); the camera holds its hover angle until
  *Turn from* (18 %), then turns to face the page looking *Arrive* degrees down (40) by touchdown; from there on it is a
  pure tilt at the landing camera, so the page frame slides in from the top. The quad switches on at touchdown, where
  the frame is still above the top edge (Arrive ≥ 38), so the switch is unseen. The last frame is the page and stays
  fixed; the hover and the landing settings only change how the drone gets there.
- Hand-off: render the exact landing frame, show the page under it, fade the canvas, pop the readings, remove the
  runway, scroll to 0, dispose the renderer. After landing the page equals `?drone=0`.

## The art (how it was made; Dan OK'd the cost 2026-10-28, ~$2 in all: ~$1.50 for three images + ~$0.50 the sign)

1. `node drone/tools/ortho.cjs <out.png> <x0,z0,w,h> 3072x2048` renders the set straight from above (`ortho.html`):
   the layout guide. AER = `-23.5,-19,39,26` (the hover's view with margin), RN = `-6,-6.6,12,8` (round the landing spot).
2. `bash drone/tools/gen-edit.sh <out prefix> 3072x2048 1 <prompt file> <image> [ref]` (gpt-image-2 edit, key from
   `$OPENAI_API_KEY`, prints the token use):
   - aerial = `prompt-aerial.txt` over the AER guide, with the page frame (1536 px) as the light / colour reference;
   - near = `prompt-near.txt` over the aerial's RN crop blown up to 3072 px, with the page photo's bottom as reference.
   - car = `prompt-car.txt` as a plain generation (`/v1/images/generations`, 1536x1024; no transparent background on
     this model, so flat magenta), 2 takes, take 1 kept.
   - the roof sign (Dan: "make it", 2026-10-28) goes into the car photo, not on a drawn board:
     `python -I drone/tools/sign-guide.py guide <car.png> <dir>` draws a flat placeholder board where the old drawn sign
     sat (3.2 x 1.32 m) + a mask; `MASK=<dir>/sign-mask.png bash drone/tools/gen-edit.sh <out> 1536x1024 2
     prompt-car-sign.txt <dir>/sign-guide.png`; read the letters at full size (only CATCH YOUR / COUPON, nothing
     invented); `sign-guide.py compose <car.png> <edit.png> <car-sign.png>` pastes only the board area back onto the
     approved car (the crop and its 2.472 aspect stay). car-sign.png is the `<car>` for step 3. ~$0.50.
3. `python -I drone/tools/post-art.py <aerial> <near> <car> drone/img`: softens the straight edge between the lanes,
   gives the close-up the aerial's tone (no lighter patch in the hover), tames the AI's orange lamp pool on the road to
   the page photo's road colour where the 3D ground meets the photo at touchdown, keys the car, writes the webp files
   (2560 px, q75: aerial ~0.57 MB, near ~1.1 MB, loaded after the hover shows; car ~0.17 MB).
   The originals (q95) are in the design-assets repo, `gas2-drone/`.

AER and RN live in both `world.js` and `post-art.py`: change them together, then re-render the guides and regenerate.

## Tools (node needs `playwright-core` in `%USERPROFILE%/node_modules` + Edge)

- `node drone/tools/render-landing.cjs http://127.0.0.1:4464` — re-renders `img/land.png` (the page scene with the
  readings hidden, 3072×2048); convert to `land.webp` (q90) and delete the PNG. Run it after any change to the frame
  or props in page-b, or touchdown will not match.
- `node drone/tools/check.cjs <out> http://127.0.0.1:4464 1440x900,390x844 top,front,right` — hover + flight shots,
  the landed page, the frozen landing frame, and the `?drone=0` references.
- `python -I drone/tools/diff.py a.png b.png …` — mean / max difference. Pass: landed vs `ref-page` mean 0.00;
  `landframe` vs `ref-land` about 2.5 at 1440×900 and 1.5 on a phone (the page's own resampling noise).
