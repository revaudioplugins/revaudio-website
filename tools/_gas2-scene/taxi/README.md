# The taxi to the store (GAS 2 page)

Dan, 2026-10-31: "the moment the user finishes downloading GAS 2, a vintage American taxi stops and covers the gas
station and honks twice; on the taxi it says TO THE STORE!; when the user clicks the taxi there's a tyre-screech sound
and a move to the main site; the user lands on the store screen at Radio Roulette." Laptop page first, then the phone.
Round 2 (Dan, same day, on v1): "I like the taxi, it should be bigger, the sizes are not matching real life, and it should
come from right to left" -> real-life size (about the scene's width) and right to left, which also puts its passenger
side at the curb, the way a cab pulls up.
Round 3 (Dan, same day: "stop where you don't see the driver no more", "the window is not transparent, make it
transparent", "very good job, just a few tweaks"): it pulls up until the driver is past the left edge (the rear door in
front of you), the roof sign moved back over that door so its words stay whole, and every window shows the page's own
scene through tinted glass.
Round 4 (Dan, same day: "make this button turn around, become red, bold, reading To the store", "the taxi's sign should
have just TAXI", "the car should shake a bit", "a bit of smoke from the back of the exhaust"): parked, the cab idles (the
body shakes about a pixel, a heavier knock about once a second; small puffs out of a tail pipe added under the rear
bumper), the roof sign says TAXI, and page-b's Download FREE turns over to a red "To the store" that sends the cab
(DESIGN.md §7; it turns back if the cab leaves on Not now).
Round 5 (Dan, same day: "while it's driving it's not shaking and no smoke, then it clicks on exactly when it stops;
make the scene smoother, seamless"): one clock now drives the whole visit (`tick()` + a plan per stretch: `rollIn`,
`waiting`, `peelOff`, `pullAway`). The engine's shake (phases that accumulate, so a change of pace never jumps; road
bumps with speed) and the exhaust (by time, more with throttle, and by distance, so a moving cab leaves a trail) run from
the first frame to the last; the springs carry over from stretch to stretch; the engine's sound idles on under it from
the stop (`idle.m4a`, a seamless loop). The smoke moved to one canvas over the stage (`.tx-fx`): each puff stays where it
was blown out, drifts back, rises, spreads, fades; the loop runs until the last one is gone.

Wired into `page-b.html` with one line (`taxi/taxi.css` + `taxi/taxi.js`, deferred). Nothing else of page-b's changes:
the script listens to the service ticket's own `submit` (page-b stamps SENT first) and closes the ticket itself.

## What happens

1. MAIL ME THE KEYS (a valid email): SENT lands; at 0.8 s an old car is heard coming on the dirt; at 1.35 s the ticket
   closes; at 1.6 s the cab rolls in from the right at a steady speed, then brakes evenly (the nose dips on its springs),
   and stops at the curb with its driver just past the left edge at 3.6 s; two honks (a short one, a longer one). If a
   bigger size or a later stop (bench) puts it over the readings, the lines it half hides step back while it stands
   there (`html.tx-here`); at the default stop it ends at 51 % and the readings stay.
2. Parked: TAXI on the lit roof sign (real text, Bebas, printed ink), the caption HOP IN · NOT NOW over it (a feathered
   blur behind it over the window posters). It idles: `idle()` shakes the body, `smoke()` puffs from `.tx-pipe`.
   ~0.3 s after it parks, page-b's `#cta` turns over to red "To the store" (`turn()`); a click on it rides like a click on
   the cab (caught at the document in the capture phase, before page-b's own click opens the ticket).
   The control is an invisible button the shape of the car (`.tx-hit`, clip-path), keyboard focus = a honey glow round
   the car's own outline.
3. Click / Enter: the tyre squeal; 0.32 s of wheelspin (the rear tyre slips, smoke, the rear squats), then it launches
   left; the dust rolls over the screen, goes dark (the site's `--bg-0`), and at 1.38 s the store opens:
   `https://revaudio.net/store#radio-roulette` (`?store=<url>` overrides it for a local review).
4. Not now / Esc: it pulls away calmly (no squeal). The next MAIL ME THE KEYS brings it back.
5. Reduced motion: no driving, no dust: the cab is just there at the stop, honks; a click goes dark and opens the store.
6. Back from the store (bfcache): the dust is cleared and the cab is gone.

The sound pans with the car (Web Audio, a StereoPanner per voice). Sound starts only after a tap (the ticket's submit is
that tap); the four files are fetched with the page (140 KB) and decoded on the first submit.

Dev: `?taxi=park` shows it parked at load; `?taxi=bench` adds a panel (top left) to size and place it by eye (Size =
its length in cqw, Stop = where its left end parks, Lift; ▶ Arrive replays the roll-in with sound; COPY = the three
numbers for `taxi.css`); `?drone=0` skips the drone intro.

## The art (gpt-image-2, 2026-10-31, one call, 2 takes, ~$1)

- `tools/prompt-taxi.txt` = the prompt; the image = the page frame `frames/f6-v17.png` upscaled to 3072x2048, a mask on
  the lower-left (x 0-62 %, y 40-100 %). gpt-image-2 re-painted the whole frame (its mask is a hint), so only the car is
  kept: take 2 (`take1-1`), a pure side profile, nose right, the scene's dusk light on it.
- Round 3: `tools/make-glass.py car.png car2.png` moves the roof sign 100 px toward the tail (and 8 px down; a dark
  mount fills the few px where the roof drops away under its tail) and turns the four windows into tinted glass:
  the view the AI painted behind them goes see-through (alpha ~.36-.48, a dusk tint, a touch more reflective at the
  top); what's darker than that view stays solid (the driver, the pillars), bright glints stay. Then make-wheels.py on
  car2.png (only `body.webp` changes).
- Lifted out with Apple Vision (`tools/vmask.swift`: `swiftc -O vmask.swift -o vmask; ./vmask take.png m` writes one mask
  per subject); cropped to the car + 8 px = `car.png` 2385 x 894 (kept outside the repo: design-assets, like the drone's).
- `tools/make-wheels.py car.png img/` cuts the layers: `body.webp` (the car with each visible tyre cut out under the
  fender) and per wheel (`r` rear, `f` front): `ring` = the tyre + rim with its light divided out (it turns),
  `ring-*-spin` = the same blurred round its centre (faded in with the wheel's speed), `shade` = that light as a multiply
  layer that stays put, `hub` = the chrome dome, which stays put (a dome's reflections don't turn with the wheel). The tyre's
  hidden top (under the fender) is filled from half a turn away. Parked, ring x shade = the painted tyre.
- Geometry in car.png px: tyre centres rear (512, 727), front (1945, 733), radius 171, dome 84; the roof glass x 816-1306,
  y 18-90 (car2: x 716-1206, y 26-98); headlight (2292, 486), tail light (71, 517); the driver's back at x ~1160.
  The CSS places everything in % of the car box.
- Direction: the art faces right; `HEAD = -1` in `taxi.js` mirrors the car (and the turning wheels with it) and
  counter-mirrors the sign's words, so it drives right to left.
- Size and place (`taxi.css`, `--tx-w` / `--tx-x` / `--tx-lift`): 105 cqw long, its left end 53.8 cqw off the left edge
  (= the driver's back at the edge: (1 - 1162 / 2385) x 105); it was 5 cqw off in round 2, spanning the scene (Dan: real-life size; by the frame's perspective a cab at the curb is ~1.3-1.5x a car standing at the
  wall, where the pump reads ~2 m). Its tyres stand on the stage's visible bottom (the scene is cropped top and bottom on
  wide windows). v1 was 70 cqw, parked short of the readings, driving left to right.

## The sound (CC0, freesound.org: free for commercial use, no credit needed)

| file | what | source |
|---|---|---|
| `arrive.m4a` (3.5 s, -21 LUFS) | an old car rolls in on dirt and stops (stop at 2.5 s) | 675247 "S03-26 Car starts; peels out on dirt; drives off; returns twice; stops ..." by craigsmith, 46.4-49.9 s |
| `honk.m4a` (0.86 s, -15 LUFS) | two blasts: 0.26 s, a 0.14 s beat, 0.45 s | 438612 "G37-07-Ford V-8 Horn" by craigsmith, the blasts at 2.585 s and 4.525 s |
| `peel.m4a` (2.85 s, -15 LUFS) | the tyre squeal over the engine pulling away (8 dB under) | 271337 "Car peels off" by therisingorder + 675247 4.4-7.25 s |
| `leave.m4a` (4 s, -22 LUFS) | pulling away calmly, fading | 675247, 9.0-13.0 s |
| `idle.m4a` (6 s loop, -27 LUFS) | an old car idling, under the scene while the cab waits | 573177 "Old car start idle revs pulls away rumble 180607" by TRP, 8.6-15.0 s |

`tools/make-sounds.py` cuts and balances them (the recordings themselves stay out of the repo).
