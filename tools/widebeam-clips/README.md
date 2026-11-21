# tools/widebeam-clips

The two scripts that made /widebeam's demo audio and the phone deck's seats. Run both from the repo root. Neither runs in
the build: their output is committed.

## `prep_clips.py`: the four demo clips (Dan's pick P3 B)

```
python3 -I tools/widebeam-clips/prep_clips.py [out_dir]
```

Writes `vocal.m4a`, `guitar.m4a`, `pad.m4a` and `mix.m4a` to `src/assets/widebeam/clips/` (or `out_dir`) and prints the
numbers per clip (loudness, true peak, correlation, the loop seam). Needs `ffmpeg` and `numpy`.

| Clip | Made from (Yoni's DAW renders, already live on the site) | Page |
|---|---|---|
| Vocal (mono) | `public/audio/revfx/vocal-before.m4a`, its whole 12.0 s loop | /revfx |
| Guitar | `public/station-mixer/audio/guitar_dry.m4a`, the first 4 of its 8 bars (a double, L / R) | /radio-roulette |
| Pad | `public/audio/revfx/instruments-before.m4a`, its whole 12.7 s loop | /revfx |
| Full mix | `public/gas-mixer/audio/{drums,bass,instruments}_dry.m4a` summed, the first 4 of its 8 bars | /gas |

Each clip is a seamless loop (a 20 ms crossfade at the seam), set to **-19.3 LUFS** (the page's synth loop at the
engine's input, so every source plays at unity through the same chain), true peak under -1.0 dBTP after the encode
(-1.4 dBTP at most today; a limiter only where the gain needs it), 0.25 s of the loop itself on both sides, AAC 160k,
faststart. Re-running it on today's sources gives byte-identical files (checked 2026-11-20). The page
loops [0.25 s, 0.25 s + the loop] (`TRACKS` in `src/lib/widebeam/sound.ts`; the sample counts there must match the
script's `CLIPS`). The page imports the clips with `?url` (hashed `/_astro/` names, see `docs/assets.md`).

## `cut-seats.cjs`: the phone deck's seats (Dan's pick D7 B)

```
node tools/widebeam-clips/cut-seats.cjs
```

Cuts the WIDTH seat (with its printed MONO / 100 / 200 scale) and the LOW FOCUS, MIX and REACH seats from the plugin's
own 2x face photo, `src/assets/widebeam/face-base.webp`, at 2x the size the deck draws them, into one sprite:
`src/assets/widebeam/deck-seats.webp` (`WbDeck.astro`). Needs `sharp` (in the repo's `node_modules`).
