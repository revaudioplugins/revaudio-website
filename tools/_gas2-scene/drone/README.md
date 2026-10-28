# The drone intro (page-b) — blockout, branch `feat/gas2-drone`

Dan, 2026-10-28: a drone hovers above the station; scrolling brings it down into the page's own scene; then GAS 2 pops
out and the readings pop in fast. A car drives right to left on load with **CATCH YOUR COUPON** on its roof, readable
from the hover. One flight per load (scrolling back up does not fly back). Owner: Claude Code `revaudio-59`.

State: the scene and the bench are built; the art is placeholder (procedural canvas textures on boxes). The real art
(ground, roof, field, car) is the next step, after Dan picks a hover angle.

## Run it

```
cd tools/_gas2-scene
python -m http.server 4464 --bind 127.0.0.1
```

Open `http://127.0.0.1:4464/page-b.html` and scroll. Any free port works.

| Address | What |
|---|---|
| `page-b.html` | the flight (TOP by default) |
| `?angle=top` / `front` / `right` | the hover angle: straight down / 45° down from the front / 45° down and 45° round to the right |
| `?dev`, then TUNE (or T) → Drone | the bench: angle (a click flies it), Hover m, Length (screens of scroll), Sway; Fly again, Car, Skip, Copy |
| `?drone=0` | the page without the intro (also with `?bench`, `?rbench` and reduced motion) |
| `?autofly` | flies itself 3 s after the hover (hands-free demos, device checks) |
| `?landhold` | QA: freezes on the exact landing frame instead of handing over |

TUNE settings live in this browser's localStorage (`gas2page-b:drone`) and win over new defaults in the code. If a
change in the code "does nothing", clear that key or press Copy to see what is stored.

## How it works

- `drone.js` — boot. A plain script in `<head>` (one line in page-b), so the readings never flash before the hover.
  Adds `html.dr-on dr-hold`, the TUNE section, then imports `run.js`. Any failure = the page as it was.
- `run.js` — the flight. A full-window WebGL canvas over the page, a scroll runway (`--dr-len` screens), the camera
  paths, the hand-off and `pop()` (the readings' entrance, WAAPI).
- `world.js` — the 3D set (three.js r185 in `vendor/`): ground (road, cracks, potholes, field), shop box, roof with
  GAS 2 painted on it, props as boxes, the car, sky, and the **landing quad**: the page frame (`img/land.webp`) on a
  plane 60 m out that exactly fills the landing camera's view.
- The landing camera matches `frames/f6-v17.png`: f = 1500 px on 1536×1024, eye 1.33 m, wall 6.6 m ahead. The canvas
  uses the page's own `.scene` crop (`setViewOffset`), so touchdown lands pixel for pixel at any window size.
- **TOP** lands exactly: the drone sinks onto the landing spot looking down (log altitude, done at u = .42), the gimbal
  starts up on the way, and from there on it is a pure tilt at the landing camera, so the page frame slides in from
  the top. The quad switches on at -40°, where the frame is still above the top edge (unseen).
- **45 front / 45 right** are a Bézier path plus a look-at, with the frame projected onto the boxes near the end.
  Blockout: they ghost near touchdown until the shop has real textured proxies.
- Hand-off: render the exact landing frame, show the page under it, fade the canvas, pop the readings, remove the
  runway, scroll to 0, dispose the renderer. After landing the page equals `?drone=0`.

## Tools (node needs `playwright-core` in `%USERPROFILE%/node_modules` + Edge)

- `node drone/tools/render-landing.cjs http://127.0.0.1:4464` — re-renders `img/land.png` (the page scene with the
  readings hidden, 3072×2048); convert to `land.webp` (q90) and delete the PNG. Run it after any change to the frame
  or props in page-b, or touchdown will not match.
- `node drone/tools/check.cjs <out> http://127.0.0.1:4464 1440x900,390x844 top,front,right` — hover + flight shots,
  the landed page, the frozen landing frame, and the `?drone=0` references.
- `python -I drone/tools/diff.py a.png b.png …` — mean / max difference. Pass: landed vs `ref-page` mean 0.00;
  `landframe` vs `ref-land` about 2.5 at 1440×900 and 1.5 on a phone (the page's own resampling noise).
