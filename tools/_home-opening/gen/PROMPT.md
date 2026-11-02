# Home opening: the room plate

The prototype (`../index.html`) runs on a stand-in (RevAmp's `garage-classic.jpg`). The real plate is the scene
Dan asked for on 2026-11-02: a garage that is also a studio, full of music gear mixed with car gear, retro-cyber
LCD and vintage like DRIFT, with the TV in the middle of the room for the camera to walk into.

Blocked on 2026-11-02: Higgsfield showed 0 credits (free plan) and the OpenAI key in `~/.zsh/openai.zsh` answered
"expired". Either one unblocks this:
- **Higgsfield** (best: 4K, so the walk-in stays sharp): `nano_banana_pro`, `resolution: 4k`, aspect `16:9` (laptop)
  and `9:16` (phone), `count: 2`, the prompts below. Cost-check with `get_cost: true` first (RULE 0 of higgsfield-studio).
- **OpenAI** (fast look tests, 1536 px): `python3 gen-plate.py laptop.txt 1536x1024 2 out/laptop` (and
  `phone.txt 1024x1536`). Needs a live `OPENAI_API_KEY` in the environment.

## Composition rules (both prompts carry them)

- Camera dead centre, square to the back wall, chest height, locked off: the TV is seen face on, so the live TV
  (bezel included) lies over it exactly.
- The TV sits at 56 % across, 52 % down, about 28 % of the width (laptop). Nothing in front of it; open floor
  from the camera to it, so the walk-in passes between things, not through them.
- Above it: the neon REVAUDIO (the brand, baked into the photo) and under that an EMPTY LED dot-matrix board: the
  page writes the ticker (reading A) live into it.
- Depth on purpose: a car at one front edge, tyres and a mic stand at the other, gear on the side walls. Near things
  leave the frame first as the camera walks in.
- The light motivates every glow the page adds: the neon, the bench lamp, the TV, the LCD/VFD readouts.

## After a plate is picked

In `../index.html`, the `PLATE` block: `src`, `w`, `h`, then `neon` / `lamp` / `board` (0..1 across and down,
read off the image) and `floorV`. Then the Tune panel (key T): "TV spot: across / height" until the live TV sits
on the plate's TV, COPY SETTINGS, and bake the numbers into `DEF`.
