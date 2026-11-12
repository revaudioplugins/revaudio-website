# Load speed: a version to compare (2026-11-12, from Gil's Claude Code)

Gil asked for this as an **extra version** for Dan to compare against `feat/home-opening`. It does not touch
`feat/home-opening` or main. Dan (or Dan's Claude) tests both and keeps the better one.

- Branch: `perf/home-opening-load`, cut from `feat/home-opening` at `2380642` (two commits on top).
- Goal: the room ready sooner on a first visit. The look, the models, the photos and every animation stay the same.

## What changed

1. `perf(garage): pack round 6's 22 models`: the 22 models added since the last pack were served raw (7.9 MB). They
   went through `models-kit/pack/pack.sh` with no other change, and the build's bit-for-bit check passed on every
   file. `pack.mjs check` reports 263 right-sized and 0 under-sized. One kit fix: `need()` failed on the RevAudio plate's
   pictures, which are measured under the CAR slot. It now finds them in `revaudio-plate.glb` by picture name.
   The masters were already committed; the other 80 models are byte-identical.
2. `perf(garage): models download right after the textures ...` (`room.html` only, the boot path):
   - The model files are fetched as soon as `loadTextures()` resolves (`prefetchModels`). Before, they also waited
     for the fonts' race and `createRoom()`. Each file is parsed as it lands, and `loadModels()` places them at the
     same point as before, so nothing enters the room earlier.
   - The PBR maps and pictures go to the GPU (`initTexture`) while the models download. Before, they waited for the
     last model. The models' own maps still go up after `loadModels()`.
   - Tried and dropped: fetching the models together with the textures. It took the textures' share of the line,
     and the room ended up 1 s slower at 50 Mbit/s.

## Measured (Gil's Mac, Chrome 1141x636 @2)

Cold first visit through `perf/simserve.py` on a live-style build (the `/garage-9f3c/` integration). Old and new were
interleaved, 2-5 runs each, and every run ended with no page errors. The figure is the time until the room is ready:

| Line | feat/home-opening | this branch |
|---|---|---|
| 50 Mbit/s | 6.2 s | 4.4 s |
| 25 Mbit/s | 9.9 s | 7.6 s |
| 10 Mbit/s | 21.6 s | 17.3 s |

Download: 23.3 MB before, 19.8 MB now.

Stills at walk 0 / 0.25 / 0.5 / 0.75 / 0.95 (`?capture=`) were compared against the old version. The mean difference
is at most 0.12 of 255. Amplified 10x, the only differences are the fan, the scope's wave and the neon's flicker, which
are animation timing (two renders of the old version differ in the same places).

Not measured: real Safari, phones, a weak laptop, and Dan's own look in motion.

## How to compare on Dan's Mac

    git fetch origin
    git worktree add .claude/worktrees/load-speed origin/perf/home-opening-load
    # this branch:      (cd .claude/worktrees/load-speed && python3 -m http.server 4771 --bind 127.0.0.1)
    # feat/home-opening: serve its worktree on another port, as usual

Open both `/tools/_home-opening/room.html` pages. For a fair timing use `perf/simserve.py` + `perf/simvisit.cjs` on
both. On plain localhost the download is instant, so the two feel close.

If a round-6 model changes later (for example M03's colours), put it in `masters/models/` and re-run `pack.sh`, as
always.
