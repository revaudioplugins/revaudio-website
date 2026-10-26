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
- **B** `img/aerial-blue.webp`: the hover, blue hour (Dan's pick 2026-10-26, over a warm "last light" and a night grade:
  the same sky the drone lands in). Painted by gpt-image-2 from this set's own blockout seen from POSE_B
  (`lab.html?b=0&s=1&minres=30&road=0` and `&mask=1`, graded to blue hour by `tools/grade-blockout.py`, then
  `tools/gen-aerial.sh`), so it lines up with the set (0 px shift measured).

A camera standing on a projector sees that photo exactly; in between, each surface takes the sharper photo there.
What neither photo saw: `img/sky.webp` (a dusk panorama re-graded to A's sky by elevation) and `img/ground.webp`
(desert, matched to B), both via `tools/gen-free.sh` + `tools/match-sky-ground.py`; and `img/land-bg.webp` (A's sky
and desert carried on behind the station, `tools/make-landbg.py`) for the sliver past the wall corner near touchdown.

By the road (`roadside.js`, Dan 2026-10-26 "go 1"): a lit GAS2 pole sign (the readings' own lockup, drawn in Oswald on
cream enamel; neon start, a rare buzz; its light on the lot) and a telephone line from the highway back into the desert
left of the station. Real 3D objects with their own materials, NOT in the hover photo (so nothing of theirs is painted
on the ground twice), and none of them can reach the touchdown frame (the sign is behind the landing camera; the line
is outside its frame up close and behind the house further out). The roof got a parapet and two vents.

The house's left end (2026-10-26, "lived in"): the hover photo has only ~28 px a metre on the front wall left of the
shop window, so as the drone closes in (its view 2-4.5x sharper than that) the wall and the curb below it hand over
from the photo to the fill: stucco in A's own wall colour (mottled, grime along the foot, the eave's shadow, darker
away from the shop's lamps), the side door (two panels, a brass knob; its four lights show the shop's own interior,
cut from A's window), concrete for the curb. Over the door hangs a gooseneck lamp like the porch lamps in A
(`roadside.js`); its light on the wall, the sidewalk and the dirt and the door's lit pane are `world.js`'s
(`doorL` / `doorI`), all of it left of x -3.5, where the landing frame never looks.

The occluders (what blocks a projector's line of sight) are the house box and the roof and sidewalk as their own
prisms. The canopy's slanted edge is fitted to where A's underside meets the sky (a stepped box version and an edge
0.2-0.27 m short let A's dark canopy lip ride on the sky as a ghost in the last stretch).

## Files

- `flight.js` boot (in `<head>`, before the page paints) + TUNE → Flight · `flight-run.js` the run · `flight.css`
- `world.js` the set, the shader, the path (POSE_A, POSE_B, `poseAt`) · `roadside.js` the sign, the telephone line, the door lamp
- `lab.html` the bench (pose sliders, path, mix; `?road=0` without the roadside, `?bimg=` another hover photo)
- `vendor/` three.js r185 (MIT) · `img/` the pictures · `tools/` how each picture was made

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

- The hover photo was painted before the set got its parapet and vents, so the roof edge in the photo is its own, not
  the set's. The re-paint from today's blockout is ready to run (`tools/gen-aerial.sh` on the graded blockout, ~$0.6 for
  2 takes) and waits on OpenAI credits (2026-10-26: the account is at 0).
- The props are painted on the wall, except the chalkboard (its own panel): the pump reads flat from above. A cut-out
  layer for it needs a picture of the wall without the pump (OpenAI, ~$0.3).
- Under the porch canopy's right end the two photos disagree mid-flight (a see-through look around the post); a hover
  photo painted from today's blockout should line that up.
- Phones / tall windows: the hover is centred on the station and the window pans to the page's crop at touchdown.
- `img/land.webp` holds the mail poster at its default (#1); a browser with another TUNE pick sees it swap at touchdown.
