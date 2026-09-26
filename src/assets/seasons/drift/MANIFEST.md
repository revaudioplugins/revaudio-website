> **Pruned 2026-09-26 (Claude Code, main session):** the page uses 30 of the exported files. These 17 were
> moved OUT of the repo (not committed; kept in the session scratchpad `drift-export-unused/`, all re-derivable
> from `Drift/Source/ui/public/assets/` or a fresh render): right_panel, left_panel, gauge_speed, gauge_temp,
> tacho_face, dash-hood, dash-collar, screw, cap_bar_red_s, fx2_cap_lit, graf_fx_{autotune,pitch,echo,reverb,
> tremolo}, fx-rack-full, cockpit-full. The rows below still list them for provenance.
> Added by the main session (not in the export run): `cta-pill.png` (cap_bar_tracks_s.png with the TRACKS
> lettering rebuilt out of its own brushed metal), `panel-face.png` / `panel-checker.png` / `panel-screw.png`
> (crops of arcade/left_panel.png: face 100,78-820,404 · checker strip 108,12-684,64 · screw 22,18-98,94).

# DRIFT product-page asset export — MANIFEST

Source repo (read-only): `/Users/danavivi/projects/revaudio/Drift`
Served for renders at: `http://127.0.0.1:8793/Source/ui/public/index.html`
Generated: 2026-09-26

All "native px" = plugin CSS px (the 1725×912 base canvas). Live-UI renders were
taken at `deviceScaleFactor: 2`, so render/output pixels = native px × 2 unless
noted otherwise.

## 1. Copied as-is (no transform) — from `Source/ui/public/assets/`

| Output | Source | Output W×H | Bytes |
|---|---|---|---|
| wheel.png | jdm/wheel.png | 1000×1000 | 853730 |
| tacho_face.png | jdm/tacho_face.png | 512×512 | 266250 |
| gauge_speed.png | jdm/gauge_speed.png | 384×384 | 187778 |
| gauge_temp.png | jdm/gauge_temp.png | 384×384 | 181859 |
| needle.png | jdm/needle.png | 512×512 | 25828 |
| screw.png | jdm/screw.png | 44×44 | 3800 |
| left_panel.png | arcade/left_panel.png | 920×430 | 739066 |
| right_panel.png | arcade/right_panel.png | 948×576 | 1022050 |
| mm_plate.png | jdm/mm_plate.png | 1188×1324 | 2057076 |
| arcade2_left_plate.png | arcade/arcade2_left_plate.png | 1024×1417 | 3053634 |
| btn_start_off.png | arcade/btn_start_off.png | 256×256 | 88429 |
| btn_start_on.png | arcade/btn_start_on.png | 256×256 | 94415 |
| cap_bar_red_s.png | arcade/cap_bar_red_s.png | 900×512 | 569852 |
| mm_cap_green.png | jdm/mm_cap_green.png | 136×136 | 30475 |
| mm_cap_yellow.png | jdm/mm_cap_yellow.png | 136×136 | 29705 |
| mm_cap_red.png | jdm/mm_cap_red.png | 136×136 | 29675 |
| led_amber_s.png | arcade/led_amber_s.png | 48×48 | 5797 |
| graf_pic_int.png | arcade/graf_pic_int.png | 224×213 | 77204 |
| graf_pic_spd.png | arcade/graf_pic_spd.png | 173×176 | 29227 |
| graf_title_int.png | arcade/graf_title_int.png | 220×65 | 27953 |
| graf_title_spd.png | arcade/graf_title_spd.png | 145×59 | 15980 |
| graf_fx_autotune.png | jdm/graf_fx_autotune.png | 800×353 | 408201 |
| graf_fx_pitch.png | jdm/graf_fx_pitch.png | 784×350 | 637812 |
| graf_fx_echo.png | jdm/graf_fx_echo.png | 800×366 | 436069 |
| graf_fx_reverb.png | jdm/graf_fx_reverb.png | 800×264 | 352952 |
| graf_fx_tremolo.png | jdm/graf_fx_tremolo.png | 800×345 | 371569 |
| val_lcd.png | arcade/val_lcd.png | 498×196 | 133382 |
| val_glass.png | arcade/val_glass.png | 410×132 | 37216 |
| fx2_cap_lit.png | arcade/fx2_cap_lit.png | 256×256 | 85331 |

## 2. Sticker columns — from `jdm/plate.png` (1725×912, opaque)

Measured visually (graffiti/stamp cluster below each neon rail, above the
corner screw). Kept as plain opaque rectangular crops — the page masks the
edges in CSS — with a ~4-6px margin off the real content bbox.

| Output | Source | Crop box (native px, x,y,w,h) | Output W×H | Bytes |
|---|---|---|---|---|
| stickers-left.png | jdm/plate.png | 0, 417, 96, 418 | 96×418 | 70779 |
| stickers-right.png | jdm/plate.png | 1644, 573, 81, 272 | 81×272 | 40640 |

Notes: left column reads 日本 / (graffiti tag) / JDM / (graffiti) / BHBX top-to-bottom;
right column reads DRIFT / 最高 / oni mask / KANST. Left crop starts right after the
neon rail's rounded bottom cap (~y413) and stops before the corner screw (~y838).
Right crop's left edge was pulled in from x1639 to x1644 to clear a faint vertical
hardware-bracket seam at x≈1637 that runs behind the sticker column.

## 3. Plate texture tile — from `jdm/plate.png`

Candidate region in the task brief (x600-1150, y140-420, ~550×280) is itself
only ~280px tall between two structural seams, so no 420×420 clean patch exists
there — confirmed visually (brightness-boosted probes) and by a mirror-repeat
test: an initial 400×300 source crop produced one loud continuous seam line at
the tile's own vertical-flip joint (a faint horizontal scratch sat only ~4px off
the top edge). Final source pulled further inside both seams and off the
corner screws:

| Output | Source | Source crop (native px, x,y,w,h) | Output W×H | Bytes |
|---|---|---|---|---|
| plate-tile.png | jdm/plate.png | 665, 135, 400, 280 | 800×560 | 553577 |

Built by mirror-tiling the 400×280 source 2×2 (TL=original, TR=h-flip,
BL=v-flip, BR=hv-flip). Verified with a 2×2 repeat-test render (at 1.6×
brightness boost, since the real tile is very dark) — no loud repeating line or
feature at any tile boundary. Deviates from the brief's "~420×420 → ~840×840"
guidance in both dimensions (400×280 → 800×560); this was necessary to avoid the
panel seams / corner screws visible under boost — noted here per the
verify-before-report instruction.

## 4. Live-UI renders (Playwright + chromium, deviceScaleFactor 2)

### 4a. FX rack — `index.html?view=fx`, viewport 1360×540

| Output | Crop box (native px, x,y,w,h) | Output W×H | Bytes |
|---|---|---|---|
| fx-rack-full.png | full frame (no crop) | 2720×1080 | 3479274 |
| fx-autotune.png | 16, 30, 256, 502 | 512×1004 | 496784 |
| fx-pitch.png | 284, 30, 256, 502 | 512×1004 | 615813 |
| fx-echo.png | 552, 30, 256, 502 | 512×1004 | 684832 |
| fx-reverb.png | 820, 30, 256, 502 | 512×1004 | 655277 |
| fx-tremolo.png | 1088, 30, 256, 502 | 512×1004 | 605515 |

All five strips share the same y-range (native y30-532) and width (256), cut
on the dark gaps between plates; each includes its neon rim glow and the small
drag-handle tab straddling its own top border. Boundaries confirmed against a
rendered grid overlay (plate edges landed within 2-4px of the brief's suggested
x-starts 16/284/552/820/1088).

### 4b. Gauge cluster (wheel + needles + tooltip hidden), 1725×912

Injected CSS before capture: `.wheelclip{display:none!important}
.gauge .ndl{display:none!important} #driftTip{display:none!important}`.

| Output | Crop box (native px, x,y,w,h) | Output W×H | Bytes |
|---|---|---|---|
| cluster.png | 518, 125, 698, 525 | 1396×1050 | 1639209 |

Deviated from the brief's suggested box (560-1160 × 190-700): the real
`dash_hood.png` alpha content peaks as high as native y=141 (task's suggested
top of 190 would have sliced ~49px off the hood's rounded crest), so the crop
top was raised to y=125. Left/right were pulled in close to the hood's own
alpha bbox (520-1214) because the left/right console panels' neon edge-glow
rails sit immediately outside the hood with almost no clean plate buffer
(confirmed visually) — going further out framed glow spill, not plate. Bottom
(y650) sits past where the column-housing shadow assembly visually fades
(~y650-660), before the left panel's EQ screen / scope panel content.

**Gauge geometry** (from `index.html` CSS/JS — the shared `assets/jdm/needle.png`
sprite is rotated in place by JS, `transform-origin: 50% 50%` i.e. each needle
pivots on its own geometric center, no offset pivot):

| Gauge | Needle native W×H | Pivot in cluster.png (px) | Rotation range | Formula (norm 0-1 → deg) |
|---|---|---|---|---|
| Speed (ndlSpd) | 74×74 | (302, 430) | -135° to +135° (270° sweep) | `-135 + spd*270` |
| Tacho (ndlRpm) | 156×156 | (682, 422) | -135° to +135° (270° sweep); 5k RPM = 0° (top-dead-center); hard rev-limiter clamps live motion to ≤ +81° (norm 0.8 = 8000 RPM, "fuel-cut" bounce oscillates near there) | `-135 + rpm*270`, rpm clamped to ≤0.8 |
| Temp (ndlTmp) | 74×74 | (1094, 454) | -90° to +90° (180° sweep) | `-90 + tmp*180` |

Pivot derivation: absolute native pivot = gauge-div (left,top) + needle-local
(left,top) + half needle W/H — i.e. center of the needle's own box. Speed
gauge div `left:592 top:263 w:154 h:154`, needle `left:40 top:40 w:74 h:74` →
native pivot (669,340). Tacho gauge div `left:734 top:211 w:250 h:250`, needle
`left:47 top:47 w:156 h:156` → native pivot (859,336). Temp gauge div
`left:988 top:275 w:154 h:154`, needle `left:40 top:40 w:74 h:74` → native
pivot (1065,352). Converted to cluster.png px via `(native - (518,125)) * 2`.
Static/rest CSS angles baked in the HTML before JS runs: ndlSpd/ndlRpm = -135°,
ndlTmp = -90° (all needles start pinned at their zero end).

### 4c. SATURATE bay — default render (wheel visible), 1725×912

| Output | Crop box (native px, x,y,w,h) | Output W×H | Bytes |
|---|---|---|---|
| sat-bay.png | 1150, 90, 530, 191 | 1060×382 | 600943 |

Contains the power LED, 4-way TAPE selector, DRIVE flame knob, and both LCD
labels, plus the checkered "スピード" header graphic. Bottom trimmed from the
brief's suggested y290 to y281 to land just above the row divider — y290 was
cutting into the next control row below (two more knob domes peeking in).

### 4d. Full cockpit reference — default render, 1725×912

| Output | Crop box | Output W×H | Bytes |
|---|---|---|---|
| cockpit-full.png | full frame (no crop) | 3450×1824 | 8889471 |

Reference only, per the brief — not intended for shipping on the page.

## 5. Dash overlays — alpha-trimmed (alpha > 8), from `jdm/` (source 1725×912)

| Output | Source | Bbox (native px, x,y,w,h) | Output W×H | Bytes |
|---|---|---|---|---|
| dash-hood.png | jdm/dash_hood.png | 520, 141, 694, 425 | 694×425 | 384785 |
| dash-collar.png | jdm/dash_collar.png | 720, 377, 280, 280 | 280×280 | 96147 |

## 6. Fonts — `public/fonts/drift/`

| Output | Source | Bytes |
|---|---|---|
| Orbitron-SemiBold.ttf | Source/ui/public/fonts/Orbitron-SemiBold.ttf | 38576 |
| PressStart2P-Regular.ttf | Source/ui/public/fonts/PressStart2P-Regular.ttf | 118204 |

No `.woff2` written: `python3 -c "import fontTools, brotli"` failed on this
machine (`ModuleNotFoundError: No module named 'fontTools'`) — kept as `.ttf`
only, per the fallback instruction.

## Budget

**Total (this export's 43 PNGs, this manifest's own scope only): 30,665,361 bytes ≈ 29.24 MB.**
Plus fonts: 156,780 bytes ≈ 153 KB. Grand total ≈ 29.4 MB.

Five largest files:
1. cockpit-full.png — 8,889,471 bytes (reference-only, not for shipping)
2. fx-rack-full.png — 3,479,274 bytes (full FX-rack source render; the 5 strips are the shippable cut)
3. arcade2_left_plate.png — 3,053,634 bytes (copied as-is from source)
4. mm_plate.png — 2,057,076 bytes (copied as-is from source)
5. cluster.png — 1,639,209 bytes

Note: `src/assets/seasons/drift/` also contains four files this export did **not**
create — `cta-pill.png`, `panel-checker.png`, `panel-face.png`, `panel-screw.png`
— written by a concurrent process during this same session (mtimes ~19:11-19:13,
overlapping this run). They are outside this task's file list, were left
untouched, and are excluded from the counts above.
