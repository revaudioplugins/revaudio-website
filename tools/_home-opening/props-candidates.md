# New props for the long garage: candidates to tick

Researcher 1, 2026-11-04. Tick `[x]` the ones you want; each gets its own named slot (the `N` id), so a season or a launch can swap or remove it later.

- **Board refs** = the photos in `refs/board/` by number (`board.json` has the source, licence and "what to take" for each).
- **Where** uses today's slot ids from `room.html` (`SIDE` / `END` / `PROPS` / `ACOUSTIC` / `POSTERS` / `MONITORS`). `f` = position along the walk (0 = far end wall, 1 = by the camera). Room today: 6.8 m wide, 4.3 m high, 19.9 m long; the car sits at the start on the right (`carZ` 0.95), half out of the 3.95 m roll-up door (the opening runs from about f 0.8 to the camera), on a 0.61 m scissor lift. Places are proposals: check each against the bench before it gets a slot.
- **Vibe**: vintage (GAS 2's 1950s, enamel, chrome, tube glow) / 90s (CRTs, road cases, stickers) / modern (LED, today's gear). Dan's brief: new, with hints of the past.
- **Pri**: must (adds the most for v1, or ties the room to GAS 2) / nice.
- **Moves** = what keeps the room alive (sway, flicker, spin, a needle); flashes stay at or under 3 a second.
- **No brand marks, no iconic trade-dress shapes.** Guitars, amps, synths, monitors and drums stay generic. RevAudio and GAS 2 marks are ours and fine.

## If you tick only 12 (my order)

N34 chair pushed back · N35 "just got up" kit · N01 caged trouble light · N02 flickering shop light · N07 GAS 2 pump by the door · N20 GAS 2 globe lamp · N06 GAS 2 hazard drum · N24 rugs · N22 road cases · N33 oscilloscope · N17 pedalboard of plugin pedals · N43 floor decals

## Already in the room (don't duplicate)

- **Guitars and bass**: L02, L03, R03, R10 (hanging), L18 bass, L19 guitar rack (five).
- **Amps and speakers**: L04 amp stack, R02 combo, R18 bass cab, R11 PA stack, studio monitors L13, L14, E02, E03 (E02/E03 on stands).
- **Racks**: L06, L08, R06 compressor/EQ racks (VU meters, LEDs).
- **Keys and electronics**: L10 synth keys, L11 drum machine, R08 modular, E04 synth on the desk, L16 reel-to-reel, M01 to M04 CRT monitors (plugin screens).
- **Drums**: R16 drum kit, E07 small kit, E08 drum throne.
- **Desk**: E01 mixing desk (no chair yet).
- **Garage**: L01, L17, R09, E05 pegboards; L05, L07, R05 red tool chests; R12 rolling tool cabinet; L09 workbench (vice, soldering); R07 parts bench (carb); L12, R01 parts shelves; R04 helmets/wheels shelf; L15 tyre rack; R13 tyre stack; R14 engine block on a stand; R15 rims; R17 exhaust pipes; E06 shelf (oil cans, tape reels); R19 gold record.
- **Studio treatment**: A01 to A15 (bass traps, cloud, skyline diffusers, slat panels).
- **Pictures**: P01 to P06 (GAS 2 posters, the pump picture, COMING SOON plate).
- **Set pieces in code**: the car, scissor lift or jack stands, roll-up door, the night outside (street lamp, city glow), REVAUDIO neon on two wires, the TV, 24 trusses, violet/magenta neon strips, cyan aisle LED strips (off), 3 amber pendant lamps, dust, haze.
- **Mess types** (scattered by `buildMess`): crate, toolbox, paint can, oil drum, tyre, cable coil, papers, traffic cone, guitar case.

## Entrance + car (the door end, f 0.8 to 1.0)

| ✓ | ID | Prop | Why (board) | Size m (W×D×H) | Where | Vibe | Pri | Swap-friendly | In room today |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | N01 | Caged trouble light hung into the coupe's open bay on its cord. **Moves: sways.** | 03, 29, 01 | 0.12×0.12×0.35 + 3 m cord | right, on the CAR / lift | vintage | must | bulb gel per skin (orange Halloween, red Black Friday) | new |
| [ ] | N02 | Twin-tube shop light on chains over the car, one tube dying. **Moves: flicker (≤ 3/s).** | 03, 06, 32 | 1.25×0.25×0.1 + chains | ceiling above the CAR | 90s | must | off / on, colour temperature per skin | new |
| [ ] | N03 | The scissor lift's own hydraulic power unit at its side (motor on top, orange tank, UP / DOWN box) with a hose into the lift's base. Was "floor jack and a creeper half under the car" until Dan's round-5 note of 2026-11-10 (make it part of the lift) | 03, 06 | 0.40×0.31×1.05 | floor at the lift's aisle-end corner, walk side | any | nice | a seasonal thing hung on the unit | lift-pump.glb since 11-10 (was jack-creeper.glb) |
| [ ] | N04 | Engine hoist (shop crane), chain and hook. **Moves: hook sways.** | 03, 06 | 1.6×0.9×1.9 | right wall by R14 engine block | vintage | nice | the hook carries the season or launch object (pumpkin, gift box, a plugin box) | new |
| [ ] | N05 | Air compressor (tank), coiled yellow hose, pressure gauge. **Moves: needle, a shake when it cycles.** | 06, 07 | 0.5×0.5×1.2 | left wall front, on the floor under L02 / L03 guitars | vintage | nice | decal on the tank | new |
| [ ] | N06 | GAS 2 hazard drum: rusty drum with the GAS 2 scene's yellow/black chevrons | 04, 06 + GAS 2 scene | Ø0.6×0.9 | just inside the door, aisle side | vintage | must | chevron band repainted per skin; lid holds a prop | partly: re-dress one mess "drum" |
| [ ] | N07 | GAS 2 pump as a real 3D object by the door (globe lit) | 04, 16 + GAS 2 pump art | 0.45×0.4×1.6 (+0.4 globe) | right side, against the door's far jamb (the TV side), aisle side | vintage | must | becomes the "hero by the door" slot: the season's or launch's object stands here | partly: P05 is only a framed picture (dropped in the paint) |
| [ ] | N08 | Lit vending / soda machine, our own label ("GAS 2 FUEL"), no red-script look. **Moves: hum flicker of its panel.** | 16, 31, 06 | 0.85×0.75×1.8 | left wall front, by L05 red tool chest | vintage | nice | front panel art per season or launch | new |
| [ ] | N09 | A-frame chalkboard sign facing the walk | 16, 06 | 0.9×0.76×1.5 | just inside the door | vintage | nice | chalk text = this week's message (cheapest swap in the room) | new |
| [ ] | N10 | Fire extinguisher, first-aid box, the door's up/down pendant on a cable | 06, 08 | 0.2×0.2×0.6; 0.3×0.1×0.25; 0.1×0.06×0.2 | right wall on the door rail | modern | nice | none (realism) | new |
| [ ] | N11 | Oil drip pan and a dark stain under the car | 32, 06 | 0.6×0.6×0.05 + decal | floor under the CAR | any | must | none | new |

## Left wall (workbench wall, f 0.15 to 0.8)

| ✓ | ID | Prop | Why (board) | Size m (W×D×H) | Where | Vibe | Pri | Swap-friendly | In room today |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | N12 | Clamp-on balanced-arm task lamp, warm pool on the bench | 10, 12, 13, 08 | arm 0.8, head 0.2 | on L09 under L01 | vintage | must | bulb tint | new |
| [ ] | N13 | Corkboard / flyer wall: gig flyers, photos, receipts, a calendar | 12, 13, 11 | 1.2×0.03×0.8 | between L01 and L12, over L09 | 90s | must | every flyer is a texture slot: launches, bundles, seasons | new |
| [ ] | N14 | Small-parts drawer cabinet (dozens of plastic drawers) | 08, 13, 18 | 0.5×0.16×0.6 | on L12 shelf or over L09 | 90s | nice | none | new |
| [ ] | N15 | Bench grinder and a drill press on the bench | 08, 11 | grinder 0.4×0.3×0.35; press 0.3×0.5×0.9 | on L09 | vintage | nice | none | partly: L09 has vice + soldering |
| [ ] | N16 | A guitar mid-repair, clamped on the bench (generic body) | 12 | 1.0×0.35×0.12 | on L09 near L10 | vintage | nice | finish colour = a plugin's livery or the season | new (guitars only hang today) |
| [ ] | N17 | Pedalboard on the floor, 5 to 6 RevAudio "floating" pedals, cable spaghetti | 22, 18 | 0.7×0.35×0.1 | floor in front of L04 amp stack | modern | must | each pedal = a RevAudio plugin (RevTune, DRIFT FX...); a new plugin = a new pedal texture | new |
| [ ] | N18 | Coiled cables and patch leads on wall hooks | 22, 23, 18 | 0.3×0.1×0.6 per hook | by L17 / L19 | any | nice | none | partly: mess "coil" on the floor, E05 "cables" |

## Right wall (f 0.06 to 0.8)

| ✓ | ID | Prop | Why (board) | Size m (W×D×H) | Where | Vibe | Pri | Swap-friendly | In room today |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | N19 | Neon-ring wall clock on real time. **Moves: second hand.** | 16 | Ø0.45×0.08 | above R04 or R02 | vintage | nice | clock face art per season | new |
| [ ] | N20 | Pump-globe lamp (milk glass, lit) with our GAS 2 globe art | 16, 04 | Ø0.4×0.45 | top of R01 (or E06) | vintage | must | globe art = the plugin of the moment | new |
| [ ] | N21 | Enamel tin signs, our own parody brands (GAS 2 motor oil, "Redline Service") | 06, 15, 16 | 0.6×0.02×0.4 each, 3 to 5 | over R07 / R09, left over L12 | vintage | nice | each sign face is a texture: season, launch | partly: P01 to P06 are framed pictures, not metal signs |
| [ ] | N22 | Road cases (flight cases) stacked, stencilled lids | 07, 18 | 1.0×0.6×0.6 each, 2 to 3 | by R11 PA stack | 90s | must | stencil text = launch name, "BLACK FRIDAY", bundle name | new |
| [ ] | N23 | Worn couch with a throw | 17, 18, 22 | 2.0×0.9×0.85 | right wall, studio half, between R08 (f 0.33) and R11 (f 0.22) | vintage | nice | throw and cushions per season | new |
| [ ] | N24 | Worn round rug under the drums, a second under the desk | 17, 18, 22, 25 | Ø2.0; 2.4×1.7 | under R16, and under E01 + E07 | vintage | must | rug pattern per skin | new |
| [ ] | N25 | Steel filing cabinet, a drawer half open, papers | 18, 28 | 0.47×0.62×1.3 | by R12 | 90s | nice | magnets / stickers per skin | new |
| [ ] | N26 | Boom mic stands with mics round the kit | 07, 18, 19 | base Ø0.6, 1.6 h | round R16 and E07 | any | nice | none | new |
| [ ] | N27 | Bicycle leaning on the wall | 18, 19 | 1.7×0.6×1.0 | by R13 tyre stack | 90s | nice | a seasonal thing on the handlebar | new |
| [ ] | N28 | Mini fridge covered in stickers | 07, 18 | 0.5×0.5×0.85 | by R11 / R12 | 90s | nice | stickers = plugin logos, season | new |

## Studio corner (far third: L13 to L19, R08 to R13, the A panels)

| ✓ | ID | Prop | Why (board) | Size m (W×D×H) | Where | Vibe | Pri | Swap-friendly | In room today |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | N29 | Moving blankets hung on a rail as DIY treatment | 18, 19, 17 | 2.0×0.05×1.6 | left wall by L16 / L17 | vintage | nice | blanket colour / print | partly: A01 to A15 are the "pro" treatment |
| [ ] | N30 | Pedestal fan, oscillating. **Moves: blades spin, head turns.** | 07, 28 | 0.45×0.45×1.3 | by E07 kit or R11 | vintage | nice | none | new |
| [ ] | N31 | Vinyl crate and a turntable on a low cabinet | 24, 28 | crate 0.35×0.35×0.3; deck 0.45×0.35×0.12 | by L16 or under E06 | vintage | nice | sleeves facing out = plugin art, seasonal records | new |
| [ ] | N32 | Tube radio (GAS 2's radio), dial glowing; or a console radio cabinet | 28, 24 + GAS 2 page radio | table 0.45×0.25×0.3; console 1.0×0.45×0.9 | on E06, or on the floor left of E01 | vintage | must | dial text / station per launch | new |
| [ ] | N33 | Oscilloscope with a live green trace. **Moves: the trace.** | 23 | 0.35×0.4×0.25 | corner of E01, or on R08 | vintage | must | trace colour per skin; trace follows the page audio when it plays | new |

## Far end (the desk and the TV)

| ✓ | ID | Prop | Why (board) | Size m (W×D×H) | Where | Vibe | Pri | Swap-friendly | In room today |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | N34 | Worn swivel desk chair, pushed back, turned a little (someone just got up) | 20, 26, 22 | 0.65×0.65×1.0 | behind E01, toward the visitor | 90s | must | a jacket or scarf over the back per season | new (no chair slot today) |
| [ ] | N35 | "Just got up" kit: headphones on the desk, sticks on the throne, a mug, lyric sheets | 22, 26, 13 | 0.2 to 0.3 each | on E01 and E08 | any | must | the mug per season; the sheets = launch notes. Answers open item 1a | new |
| [ ] | N36 | ON AIR box sign, lights at the TV lock | 27 | 0.6×0.12×0.2 | far wall, left of the TV (keep clear of the REVAUDIO neon) | 90s | nice | text: ON AIR / LIVE / BLACK FRIDAY | new |
| [ ] | N37 | Desk lamp on the console | 26, 28, 10 | arm 0.6 | E01 left end | vintage | nice | bulb tint | new |
| [ ] | N38 | 19-inch rack tower beside the desk, blinking | 20, 23 | 0.55×0.6×1.2 | E01 right end, by E03 | 90s | nice | rack faces = plugin faceplates (a GAS 2 1U, a RevLimiter 1U) | partly: L06 / L08 / R06 racks on the side walls, none at the desk |

## Ceiling

| ✓ | ID | Prop | Why (board) | Size m (W×D×H) | Where | Vibe | Pri | Swap-friendly | In room today |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | N39 | Traffic light hung as decor. **Moves: slow red / amber / green.** | 31 | 0.3×0.3×0.95 | over the aisle between lamps f 0.55 and 0.2 | vintage | nice | lit colour per season (red for Black Friday) | new |
| [ ] | N40 | Slow industrial ceiling fan. **Moves: spin, sweeping shadows.** | 28 | Ø1.46×0.5 | over the studio half, f ≈ 0.2 (clear of A03) | vintage | nice | none | new |
| [ ] | N41 | Chain hoist on a truss, hook. **Moves: sway.** | 03, 06 | 0.3×0.2×1.5 | truss over the car | vintage | nice | the hook holds a seasonal thing | new |
| [ ] | N42 | Cable trays, conduit, a few hanging extension cords along the trusses | 31, 30 | 0.3 wide, full length | ceiling | 90s | nice | none | partly: the CEIL surface asks for trays in its texture, no geometry |

## Floor

| ✓ | ID | Prop | Why (board) | Size m (W×D×H) | Where | Vibe | Pri | Swap-friendly | In room today |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | N43 | Floor decals: oil stains, tyre marks, a drain grate, faded yellow bay lines at the car only | 32, 06, 03 | 0.3 to 2 m each | round the CAR and L09 | any | must | a season layer on top (leaves, fake snow, confetti) | partly: floor lines exist but are off (Dan 11-03); these are bay lines at the car, not a road |
| [ ] | N44 | Rubber anti-fatigue mat at the bench | 08 | 1.5×0.9×0.02 | floor at L09 | modern | nice | none | new |
| [ ] | N45 | Extension reel, power strips, daisy-chained cords running to the studio | 18, 22, 23 | reel Ø0.3; cords long | floor along the left wall to E01 | 90s | nice | none | partly: mess "coil" |

## Notes

- **The loved painting (`walk-000.webp`) shows two famous guitar body shapes** (a single-cut and a double-cut with a 3-a-side look). The 3D guitars, amps and synths must be generic shapes; the painting is the mood reference, not the models.
- **GAS 2 hints in one place**: N06, N07, N20, N21, N32 and N08's label carry GAS 2's world (1950s enamel, cream and oxide red, chrome bezels, globes, a tube radio, chevrons) without turning the garage into a gas station.
- **Motion budget**: N01, N04, N41 sway; N02 flickers; N30, N40 spin; N05, N19, N33 have needles or traces; N39 cycles. With the dust, haze and neon that is enough life; pick a few, not all.
