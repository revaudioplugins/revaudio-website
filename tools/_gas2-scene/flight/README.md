# GAS 2 page · the drone intro (`flight/`)

Dan 2026-10-26: the page opens on a drone hovering above the station; scrolling flies it down to the page we have; the
readings pop out; then the visitor is on the page.

## What happens

1. **Hover.** `page-b.html` paints the hover shot first (`flight.css`, `body::before`), then a full-window WebGL canvas
   fades in over the same picture and the drone holds its spot in the air (slow sway). After 1.8 s with no scroll, one
   quiet line: SCROLL TO LAND.
2. **Descent.** A scroll runway (4 screens) flies the camera down, the gimbal tilts up into the sunset, and it glides in
   to the shop front.
3. **Touchdown.** The last frame IS the page's frame (checked 2026-10-26 straight off the canvas at 1141x636 @2x:
   3.8/255 mean against the live page, where a lossless render of the page itself at 1536 wide already differs by
   3.3 — fonts and filters land a hair differently at another window size; the phone 1.6). The canvas fades onto the
   identical page; the readings pop (GAS2 springs up with a small overshoot, its rule draws out, the line
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
  `tools/gen-aerial.sh`), so it lines up with the set (0 px shift measured). Then made exact where the AI went wrong
  (2026-10-26), in this order: `tools/patch-porch.py` (the porch, painted as a wall), `tools/patch-front.py` (the
  shop-front lettering: the sign had come out "REGULAR · PREMIUM · EACH" and the posters as gibberish; now A's own sign,
  posters and MAIL poster, mapped by the front wall's homography, supersampled and matched to B's light) and
  `tools/draw-vents.py` (the two roof vents of Dan's "go 1" plan, drawn in the hover camera's exact perspective so the
  3D vent boxes pick up their own faces all the way down).

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

The occluders (what blocks a projector's line of sight) are the house box, the chalkboard's board and the roof and
sidewalk as their own prisms. The canopy's slanted edge is fitted to where A's underside meets the sky (a stepped box
version and an edge 0.2-0.27 m short let A's dark canopy lip ride on the sky as a ghost in the last stretch).

Ghost hunting, 2026-10-26 (Dan: "check pixel by pixel, frame by frame"; 101 steps of the path, a pop scan, both ends
measured):

- **A photo blown up on screen hands over to the fill.** Where the drone's view of a surface is 2-4.5x sharper than a
  photo's texels there (the hover photo on the walls up close, the landing photo on what it saw edge-on), that photo
  gives way to the fill. On its own projector a photo is 1:1, so the hover and the touchdown stay exact.
- **The porch** (under the canopy, right of the house; `porch()` in `world.js`): the hover photo had been painted from a
  blockout with the roof's tar on the porch floor, so gpt-image-2 made it a grey wall, which smeared into a see-through
  box as the drone left the hover; the landing photo sees that floor edge-on. Mid-flight the porch floor is now the
  set's own (concrete from A's sidewalk, dimmer deep under the canopy, the porch lamp's warm pool at its front): the hover
  photo only leaving the hover, the landing photo only coming in to land. The hover photo's porch itself was patched
  from the set's render (`tools/patch-porch.py`, its mask = `lab.html?...&mask=2`).
- **A's background plate** (`img/land-bg.webp`) only over the last stretch, as meant: earlier it painted the dirt behind
  the porch with A's mirrored desert (a ghost stick, a ghost sidewalk end) all the way down.
- **The chalkboard** takes its outline from the landing photo's own board (`img/land-chalk.png`,
  `tools/make-chalkmask.py`): the panel's cut-out, and for the landing photo's line of sight, what lies behind the
  board's plane under it. The prop file's cut-out sits a few pixels off the board as the photo has it, and a box round
  the board alone let its frame and legs ride onto the floor behind (a floating stick near touchdown).
- The sidewalk's top and sides are concrete in the fill (A's own), not the roof's tar / the wall's stucco.
- The vents are occluders too: the hover photo has them, so the roof behind one, seen from lower down, must not wear
  their picture.
- The division's eps is 1e-8: at both ends the fill's weight is 0, and on the far desert at a grazing angle inside the
  frame's edge feather a photo's weight is only ~2e-5, so an eps of 1e-4 let the fill win there (a dark streak on the
  horizon at the touchdown frame's right edge).
- page-b itself: on wide windows `.scene` starts at `left: 0` instead of being centred with `translate(-50%)`, which put
  it half a device pixel off at odd widths in Chromium (a dark line down the page's left edge at 1141, 1281, 1439 ...).

## Files

- `flight.js` boot (in `<head>`, before the page paints) + TUNE → Flight · `flight-run.js` the run · `flight.css`
- `world.js` the set, the shader, the path (POSE_A, POSE_B, `poseAt`) · `roadside.js` the sign, the telephone line, the door lamp
- `lab.html` the bench (pose sliders, path, mix; `?road=0` without the roadside, `?bimg=` another hover photo,
  `?mask=1` where A paints, `?mask=2` the porch)
- `vendor/` three.js r185 (MIT) · `img/` the pictures · `tools/` how each picture was made

## Switches

- `?flight=0` = straight onto the page; reduced motion = no flight; `?bench` / `?rbench` skip it; `?autofly` = the drone
  flies itself after 3 s (device checks where nobody can scroll, a hands-free demo).
- TUNE → Flight: Length (screens of scroll, from the next Replay), Sway (live), Replay, Skip, Copy.

## Publishing

The flight is self-contained in `flight/`. From its host page it needs `#scene` (the 3:2 scene box: the canvas frames
the same window into it, so touchdown lands on it), `.stage` (pinned during the flight), `.rd` with `.ti` / `.lead` /
`.cta` / `.scr` (the readings it pops) and a `footer`; `#tune` is optional (dev only: TUNE → Flight). Hook-up = one
`<link>` + one `<script>` in `<head>` (as in `page-b.html`, after the radio line). Checked 2026-10-26 on a
production-like copy of page-b, then on page-b itself once its dev chrome went opt-in (`?dev`, `?tune`, `?bench`,
`?rbench`, or for good on a browser once T has opened TUNE), in real iOS Safari (iPhone 17 Pro Simulator, iOS 26.5, a
fresh origin, `?autofly`): hover, descent, the pan to the phone's crop, touchdown, the readings pop. Weight: the pictures ~1.2 MB (webp), three.js
r185 ~180 KB gzipped as vendored (a bundler tree-shakes it further), our own code ~50 KB. When the page moves into the
site (`src/`), re-render `img/land.webp`, `land-bg.webp` and `land-chalk.png` from the published page ("When the page
changes"): touchdown is exact only against the page the landing frame was rendered from.

How exact the hand-offs are (2026-10-26, straight off the canvas, DPR 2; Chromium 1141x636 / 1281x720 / 1440x900 /
390x844 and WebKit 1141x636 / 390x844):

- After touchdown the page IS the page: 0.000 against `?flight=0` in every setup.
- The last 3D frame against the live page: mean 3.2 / 3.1 / 2.9 / 1.5 and 3.0 / 1.7 (/255). Colour, region by region
  (6 px blur): 0.33-0.73; more than 12 levels apart in at most 0.03 % of pixels (the chalkboard's lettering, which the
  page itself draws through an SVG filter). The rest is edge sharpness. For scale, the page against itself one pixel
  narrower: mean 4.1, colour 0.78. The landing frame is closer to the page than the page is to itself.
- The landing frame in the lab against `img/land.webp`: mean 0.002, max 29, no pixel more than 40 apart.
- The hover: the first canvas frame against the CSS still under it, mean 0.7 (Chromium) / 2.5 and 1.4 (WebKit's texture
  filtering); without the 3D sign, poles and door lamp the lab's hover is the photo exactly (0.00).

## When the page changes

A prop on the page changes (a poster pick, the radio, the chalkboard) → re-render A, then its background plate (and
the chalkboard's cut-out if the board changed or moved):

```
cd tools/_gas2-scene && python3 -m http.server 4462 --bind 127.0.0.1 &
PW=<website clone>/node_modules/playwright node flight/tools/render-landing.cjs /tmp/land@2x.png
python3 -I -c "from PIL import Image; Image.open('/tmp/land@2x.png').convert('RGB').resize((1536,1024), Image.LANCZOS).save('/tmp/land.png')"
cwebp -q 94 -m 6 /tmp/land.png -o flight/img/land.webp
python3 -I flight/tools/make-landbg.py /tmp/land.png /tmp/land-bg.png && cwebp -q 88 -m 6 /tmp/land-bg.png -o flight/img/land-bg.webp
CHALK=bare PW=... node flight/tools/render-landing.cjs /tmp/bare@2x.png && CHALK=off PW=... node flight/tools/render-landing.cjs /tmp/off@2x.png
python3 -I flight/tools/make-chalkmask.py /tmp/bare@2x.png /tmp/off@2x.png flight/img/land-chalk.png
```

The chalkboard moved → `CHALK` in `world.js` too. The aerial only changes if the station itself does; a new one goes
through `tools/patch-porch.py` (if its porch came out a wall), `tools/patch-front.py` and `tools/draw-vents.py`. The
lettering patch reads `img/land.webp`, so a new landing frame (a new poster pick) means re-running it on the aerial.

## Known limits

- The parapet is in the set but not drawn into the hover photo (the photo's own roof lip paints it; frame by frame it
  reads as one roof all the way down).
- The props are painted on the wall, except the chalkboard (its own panel). Checked frame by frame (2026-10-26): on this
  path, which never views them from the side, the pump, the radio and the drum read as standing in front of the window.
  A side view would need the pump on its own layer and the wall behind it (no picture has it: the pump is painted into
  f6-v17, and `props/pump-cut.png` is traced from those same pixels).
- Phones / tall windows: the hover is centred on the station and the window pans to the page's crop at touchdown.
- `img/land.webp` holds the mail poster at its default (#1); a browser with another TUNE pick sees it swap at touchdown.
