# GAS 2 page · the drone intro (`flight/`)

Dan 2026-10-26: the page opens on a drone hovering above the station; scrolling flies it down to the page we have; the
readings pop out; then the visitor is on the page.

## What happens

1. **Hover.** `page-b.html` paints the hover shot first (`flight.css`, `body::before`), then a full-window WebGL canvas
   fades in over the same picture and the drone holds its spot in the air (slow sway). After 1.8 s with no scroll, one
   quiet line: SCROLL TO LAND.
2. **Descent.** A scroll runway (4 screens) flies the camera down, the gimbal tilts up into the sunset, and it glides in
   to the shop front.
3. **Touchdown.** The last frame IS the page's frame (checked: 1.7/255 mean difference, the webp). The canvas fades
   onto the identical page; the readings pop (GAS2 springs up with a small overshoot, its rule draws out, the line
   rises, the button pops, "Fill it up." writes on); the runway folds away and the page is exactly the page (checked:
   0.00 difference against `?flight=0`).

## How the flight is made

`world.js` builds the station as a 3D set in metres (the house, a slanted roof / canopy, the sidewalk, the chalkboard,
ground, sky) and paints it with two photos, like slide projectors:

- **A** `img/land.webp`: the page's own scene at touchdown, rendered from `page-b.html?flight=0` without the readings
  (`tools/render-landing.cjs`). The landing camera POSE_A is calibrated on f6-v17 (f = 1500 px, eye 1.33 m, 6.6 m off the wall).
- **B** `img/aerial.webp`: the hover. Painted by gpt-image-2 from this set's own blockout seen from POSE_B
  (`lab.html?b=0&s=1&minres=30` and `&mask=1`, graded to blue hour by `tools/grade-blockout.py`, then
  `tools/gen-aerial.sh`), so it lines up with the set (0 px shift measured).

A camera standing on a projector sees that photo exactly; in between, each surface takes the sharper photo there.
What neither photo saw: `img/sky.webp` (a dusk panorama re-graded to A's sky by elevation) and `img/ground.webp`
(desert, matched to B), both via `tools/gen-free.sh` + `tools/match-sky-ground.py`; and `img/land-bg.webp` (A's sky
and desert carried on behind the station, `tools/make-landbg.py`) for the sliver past the wall corner near touchdown.

## Files

- `flight.js` boot (in `<head>`, before the page paints) + TUNE → Flight · `flight-run.js` the run · `flight.css`
- `world.js` the set, the shader, the path (POSE_A, POSE_B, `poseAt`) · `lab.html` the bench (pose sliders, path, mix)
- `vendor/` three.js r185 (MIT) · `img/` the five pictures · `tools/` how each picture was made

## Switches

- `?flight=0` = straight onto the page; reduced motion = no flight; `?bench` / `?rbench` skip it.
- TUNE → Flight: Length (screens of scroll, from the next Replay), Sway (live), Replay, Skip, Copy.

## When the page changes

A prop on the page changes (a poster pick, the radio, the chalkboard) → re-render A, then its background plate:

```
cd tools/_gas2-scene && python3 -m http.server 4462 --bind 127.0.0.1 &
PW=<website clone>/node_modules/playwright node flight/tools/render-landing.cjs /tmp/land@2x.png
python3 -I -c "from PIL import Image; Image.open('/tmp/land@2x.png').convert('RGB').resize((1536,1024), Image.LANCZOS).save('/tmp/land.png')"
cwebp -q 94 -m 6 /tmp/land.png -o flight/img/land.webp
python3 -I flight/tools/make-landbg.py /tmp/land.png /tmp/land-bg.png && cwebp -q 88 -m 6 /tmp/land-bg.png -o flight/img/land-bg.webp
```

The chalkboard moved → `CHALK` in `world.js`. The aerial only changes if the station itself does.

## Known limits

- Mid-flight the house's left end comes from the aerial (unlit, away from the porch lamps) and the props are painted
  on the wall, except the chalkboard (its own panel). Both are small on screen by the time they'd show.
- Phones / tall windows: the hover is centred on the station and the window pans to the page's crop at touchdown.
- `img/land.webp` holds the mail poster at its default (#1); a browser with another TUNE pick sees it swap at touchdown.
