# Models kit: how the room's real models are made (step 3, 2026-11-08)

The asset scout's method for the studio desk, the monitors + stands, the drum kit and the throne. Every model is either
ours, built from code in Blender (no brands, no logos, no text), or a CC0 download (Dan, 2026-11-08: CC0 only for v1).
The builders of step 4 (the finish list in `tasks/todo.md` item 4) work the same way.

## A builder's folder

Each builder works in its own scratch folder `<sc>` and never writes the repo:

- `<sc>/dl/<asset>/`: CC0 downloads (Poly Haven, ambientCG, OpenGameArt CC0, …), fetched with the user agent
  `RevAudio-research/1.0`. Keep the page's licence line for the notes.
- `<sc>/work/`: prepared textures. `prep_tex.py <sc>` → `work/desk_tex` (walnut, worn planks, steel ARM);
  `corner_tex.py <sc>` → `work/corner_tex` (our cymbal bronze + the mid walnut). `rack_atlas.py <dir>` = our rack-gear atlas.
- `<sc>/candidates/<name>/`: the .glb, its in-room stills, `notes.txt` (size, tris, licence, how it goes into the room).

## Build

Blender 5.2 is at `/Applications/Blender.app/Contents/MacOS/Blender` on Dan's Mac.

    Blender -b --factory-startup -Y -P studio_corner.py -- --what monitor|stand|kit|throne [--variant m1|m2|k1|k2] --tex <sc>/work/corner_tex --out <glb> [--preview <dir>]
    Blender -b --factory-startup -Y -P studio_desk.py -- --variant v1|v2 --tex <sc>/work/desk_tex --atlas <dir> --out <glb> [--preview <dir>]
    python3 -I glbinfo.py <glb>      # images, materials, triangles, extent, extensions

Conventions: metres; origin on the floor at the footprint's centre; front = glTF +Z; 1k JPEG textures inside the .glb;
repeated hardware (screws, knobs, lugs) as linked duplicates → `EXT_mesh_gpu_instancing`. Keep materials few: every
material is a draw call, and the monitors' 11 each cost the room ~10 % frame rate at walk 0.6.

## Budget (per object; the room has ~120 slots)

- Materials: 4 at most for furniture, 2 for small props; share one texture atlas inside a zone where you can.
- Triangles: small props ≤ 3k, furniture ≤ 8k, the car ≤ 40k; repeats instanced.
- Textures: 1k JPEG inside the .glb (2k only for the car's body if Dan asks).
- Frame rate: the room on Dan's Mac (M1 Max, 1141x636, DPR 2, `layout-kit/fps.mjs`) was 50 / 47 / 60 / 97 fps at
  walk 0 / 0.3 / 0.6 / 0.9 on 2026-11-09. A batch may not take a walk spot more than 10 % below that; if it does,
  merge materials (the monitors' 11 each first) before adding more.

## See it in the room (no repo edits)

Serve the worktree root (`python3 -m http.server <port> --bind 127.0.0.1`), then

    SCOUT_ROOT=<sc> node scout.mjs <out-dir> <spec.json> 1141x636 <port>
    python3 -I corner_spec.py <spec.json> <set> mon=m1 kit=k2 shots=walk60,mon,kit,corner   # a spec for the studio corner
    python3 -I sheet.py <out.png> <cols> <cellW> <cellH> label=<png> ...                    # a contact sheet

`scout.mjs` serves `<sc>` to the page at `/__scout/<path>` and at `assets/models/scout/<path>`, so the room's own loader
takes a candidate through `?model=<slot>:assets/models/scout/candidates/<name>/<file>.glb[:yaw][:height]`; a patch in the
spec can add what `MODELS` can't yet.

## Into the room (the main session)

1. Dan picks on a review bench (`team/bench-picks-template.html`: A / B / C flipped in place).
2. Copy the .glb to `assets/models/`, add a row to `assets/models/SOURCES.md` and to `refs/licence-log.md`
   (git-ignored, Dan's Mac).
3. A line in `MODELS` (`room.html`): a block slot fits the model into its box (`fit: 'height'` keeps the shape); a prop
   slot (a group of drawn parts, e.g. E07) takes the model at real size where its parts stood; `stand:` adds a
   monitor's floor stand, stretched to the floor by `placeItem`.
4. Re-run the checks: `layout-kit/handoff.mjs` (baseline 1.05 / 0.68 / 0.45 / 2.57 %), `layout-kit/check.mjs`
   (0 overlaps), `layout-kit/fps.mjs` before / after in turns, and `still.mjs` (the slow-connection picture).
