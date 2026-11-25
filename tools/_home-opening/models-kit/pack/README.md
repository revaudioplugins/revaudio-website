# The pack: originals in, web-sized files out (2026-11-11, the speed session)

The room downloads every model and texture on a first visit, so what sits in `assets/` is what a visitor waits for.
From now on the full-size originals live in `tools/_home-opening/masters/` (not served, not copied to the live page)
and `assets/models/*.glb` + `assets/pbr/*.webp` are **built from them** by this folder. Same paths, same names, same
look: `MODELS` and the room's code don't change.

    cd tools/_home-opening/models-kit/pack && ./pack.sh        # ~10 min; needs Chrome + the site's playwright
    ./pack.sh check                                            # the guard: is anything served smaller than the walk reads?

## When to run it

- **A new or replaced model:** put the raw .glb in `masters/models/` (a raw .glb copied to `assets/models/` out of
  habit is moved there by the first step), then `./pack.sh`. Commit the master, the packed file and `need.json`.
- **A new or replaced PBR map:** the original goes in `masters/pbr/`, then `./pack.sh`.
- **After the layout or the walk moves** (a bench closer to the aisle, a new camera path): `./pack.sh check`. It
  fails with `UNDER-SIZED` when a texture is now read sharper than the file served; `./pack.sh` fixes it.
- Never edit a file in `assets/models/` or `assets/pbr/` by hand: the next pack overwrites it.

## What it does

1. `pack.mjs adopt`: raw .glb files found in `assets/models/` move to `masters/models/`.
2. `measure.mjs`: walks the room (41 stops) in four window shapes (1440x900@2, 1280x960@2, 3440x1440@1,
   820x1180@2) with the originals loaded, and records per texture the size level the graphics chip samples.
3. `pack.mjs need` → `need.json` (committed, the record): per texture, the levels the walk never reads. Rule: the
   0.1 % sharpest on-screen pixels decide, the most demanding window wins, half a level of headroom is kept
   (`MARGIN`), a texture never seen keeps its full size (it may be a see-through overlay the measure skips).
4. `pack.mjs build`:
   - pictures inside models → WebP (colour q85; normal and roughness / metal maps q90 with sharp chroma), shrunk
     by the levels in `need.json`; when the WebP isn't smaller the original's bytes stay. Alpha is kept.
   - shapes → meshopt (`EXT_meshopt_compression`; the room's loader has the decoder). **Every position, triangle
     and node comes out bit for bit as it went in**: the build compares them (plus every node's name and
     transform and the picture names) before / after and refuses to write a file that differs (the room spins,
     fits and matches parts by node). Only the directions the light reads (normals, 12 bits) and the picture
     coordinates (UVs, 14 bits) are rounded; the vertex order is kept.
     Why not tighter (stills of 11-11): 8-bit normals moved the highlights on the car's paint at the door, and
     snapping positions to a 0.03 mm grid made a lit meter face on the studio desk (a layer 0.5 mm over its
     panel) come out half dark. Tighter costs the look and saves 0.6 MB: don't.
   - PBR maps: copied as they are unless `need.json` drops a level (then WebP q90).
   The build is repeatable: the same masters give the same bytes, so a re-run changes no file.
5. `pack.mjs check`: every original is served packed, and no served texture is under the size the walk reads.

## Numbers (2026-11-11, 83 models, 37 PBR maps)

- Models 22.9 → 12.2 MB on disk; as downloaded (gzip, what the live server sends) 14.1 → 9.4 MB. PBR maps unchanged
  (5.9 MB). Stills at five walk stops, originals against packed: no difference the eye finds (mean under 0.2 of
  255 levels).
- The right-size finds little today: 7 of 237 textures drop a level (≈ 0.3 MB). The study of 11-10 expected ~3 MB,
  but the models' maps have since gone to 8x anisotropic filtering (sharper at grazing angles: they are now read
  one level finer) and the ultrawide + tablet windows count too. The saving is the WebP + meshopt.
- 🔴 The live page needs `'wasm-unsafe-eval'` in its CSP `script-src` for the meshopt decoder (and `blob:` in
  `img-src` + `connect-src`, as before). Without it packed models do not load there.

Dependencies are pinned in `package.json` (`npm install` here; `node_modules/` and `work/` are git-ignored).
