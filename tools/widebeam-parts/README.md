# WIDE BEAM parts kit

Dan's pick D4 C (2026-11-18): every surface on /widebeam is cut from the plugin's own photo,
`src/assets/widebeam/face-base.webp` (3072x2048, a 2x capture). `cut.cjs` makes the parts, and
`src/styles/widebeam/parts.css` holds the classes. No CSS points at the full photo.

```
node tools/widebeam-parts/cut.cjs        # from the repo root; ~2 s; deterministic (same bytes every run)
```

The script uses sharp from the repo's `node_modules` and nothing else. Every crop box in it is in the plugin's units
(1536x1024) and carries a comment naming its part. Each part is WebP q80 at 2x the largest size it is shown at.
The field tile is the one exception at q95: its brushing is about 2 levels of contrast, and q80 flattens it into
blocks.

## How the cut works
- **The steel is cut out of every border piece.** A signed-distance mask follows the plate's inner rounded
  rectangle (trim inside edge: L 46, T 51, R 1489.5, B 842, radius 16). The steel becomes transparent with a soft
  inner shadow. The one steel tile then shows through, so a corner never seams against steel cut from elsewhere.
- **Each run is made seamless.** First its length is flattened: per line, a 24-unit moving average is swapped for
  the line's mean, which keeps the pebble grain but removes any blot that would repeat once per tile. Then it is
  wrap cross-faded: the low part (blurred along the run only) blends linearly, and the grain blends
  power-preserving. Each run window is the measured most even stretch of the photo.
- **Each object keeps the inside of its outline.** Outside it gets a synthetic warm contact shadow (down-right,
  away from the one upper-left light). It never keeps the photo's grey steel, which would show as a halo on the page.

## Parts (bytes from the last run)

| File | px | px/unit | KB | Crop box [x, y, w, h] in plugin units |
|---|---|---|---|---|
| plate.webp | 444x376 | 1 | 7.8 | 9-slice sprite, slices 68 62 68 62. Corners tl [0,0,62,68], tr [1474,0,62,68], bl/br = rows 825-850 + 981-1024 at x 0 / 1474. Runs: top [540,0,380,68], bottom [1005, 825+981, 380, 25+43], left [0,512,62,300], right [1474,422,62,300] |
| field.webp | 180x128 | 1 | 1.5 | [914,624,204,152], high-passed (the photo's light removed), seamless both ways |
| screw-tl / tr / bl / br.webp | 72x72 | 2 | 1.5 each | centres (66,74) (1470,74) (66,818) (1470,818), r 13.8 |
| strap-l.webp | 100x199 | 1 | 2.8 | [0,825,100,199]: the strap's left end + its screw + leather |
| strap-r.webp | 100x199 | 1 | 2.5 | [1436,825,100,199] |
| strap-run.webp | 400x199 | 1 | 6.3 | [170,825,460,199], wrapped to 400 |
| badge.webp | 313x105 | 1.25 | 3.3 | [641,868,250,84], the plate [645.5,871.8 - 886,946.5] |
| lamp-l.webp | 503x456 | 1.5 | 30.4 | [49,142,335,304], bezel [53,146 - 380,441.5] r 16 |
| lamp-r.webp | 503x456 | 1.5 | 30.5 | [1153,142,335,304], bezel [1157,146 - 1483.5,441.5] |
| road.webp | 1245x510 | 1.6 | 32.5 | [379,141,778,319], bezel [383,144.5 - 1152.5,456] r 20 |
| meter.webp | 391x190 | 1.4 | 7.5 | [962,476,279,136], bezel [965.8,479.3 - 1237.6,608.3] r 7 |
| needle.svg | vector | - | 0.4 | the face's own needle path (face.ts) at the meter's 0.75 scale, with its shadow |
| cap.webp | 224x224 | 1.6 | 7.9 | [1302,637,140,140], ring centre (1371.75,706.25) r 65 |

Plate set (plate, field, screws, strap, badge): **30.3 KB** (target ~37). Lamps: **60.9 KB** (~75). Road window:
**32.5 KB** (~37). Meter + needle: **7.9 KB** (~12). Cap: **7.9 KB**.

Vite inlines the files under 4 KB (screws, field, strap ends, badge, needle) into the CSS as base64. `parts.css`
names each url once, so none is shipped twice.

## Classes (`src/styles/widebeam/parts.css`)

| Class | Use |
|---|---|
| `.wb-plate` | Any box, any size. Leather border, brass trim, steel, 4 screws. `--wb-ps` = CSS px per plugin unit (.45; .36 under 600 px; sharp up to .5). `--wb-plate-pad` sets the inner padding (20px 26px). The border takes 68/62 x `--wb-ps` px outside the padding. |
| `.wb-plate--strap` | Adds the stitched oxblood strap under the steel (the bottom band becomes 199 units). |
| `.wb-plate--badge` | Strap + the RevAudio nameplate centred on it (it implies the strap). |
| `.wb-plate-label` | The small labels: the plate's engraved serif small caps (`'WB Serif'`, then Georgia). |
| `.wb-part-lamp-l`, `.wb-part-lamp-r` | A headlamp in its bezel. Give a width. `--wb-lamp` sets the lens exposure only: .1 off, 1 the photo, about 1.6 full beam. |
| `.wb-part-road` | The road window: bezel, night road, trip LCD. Children `.wb-part-road-glass` (the glass box, for a canvas) and `.wb-part-road-lcd` (the LCD box, centres its text). |
| `.wb-part-meter` + child `.wb-part-meter-needle` | The correlation meter. `--wb-needle` = correlation x 50deg (-50deg .. +50deg), as in face.ts. |
| `.wb-part-cap` (+ `.wb-part-cap--down`) | The MONO push cap; `--down` for pressed. |
| `.wb-part-badge` | The nameplate on its own. |

```html
<section class="wb-plate wb-plate--badge" style="--wb-ps:.45">...</section>
<div class="wb-part-lamp-l" style="width:120px; --wb-lamp:.6"></div>
<div class="wb-part-meter" style="width:180px"><i class="wb-part-meter-needle" style="--wb-needle:-12deg"></i></div>
```

Both pseudo-elements of `.wb-plate` are in use (screws, strap). Don't put your own `::before` / `::after` on the
plate box; use a child instead.
