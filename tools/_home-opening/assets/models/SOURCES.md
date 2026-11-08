# The real models in the room's slots (step 3, 2026-11-08, `danavivi-20`)

All CC0 (public domain): free to ship and to send to every visitor, no credit line needed (Dan, 2026-11-08: CC0 only
for v1). Downloaded with a plain user agent (`RevAudio-research/1.0`) by the asset scout, prepared in Blender (metres,
origin on the floor at the footprint's centre, front on +Z, 1k JPEG textures inside the .glb). Also logged in
`refs/licence-log.md` on Dan's Mac (git-ignored). `room.html` places them through `MODELS`.

| file | slot | source | author | licence | checked | changed |
|---|---|---|---|---|---|---|
| office-chair.glb | N34, the desk chair (Dan's pick 2026-11-08) | OpenGameArt "Office chair" https://opengameart.org/content/office-chair-1 (original 3dmodelscc0.com/model/office-chair, Wayback 2022-05-20: "CC0 1.0, Tris 4674") | 3DModelsCC0 (uploaded by nisu) | CC0 1.0 | 2026-11-08 (the page: "License(s): CC0") | FBX → glb, 2k PNG → 1k JPEG, turned 180° |
| studio-desk.glb | E01, the studio desk with racks built in (Dan's pick 2026-11-08) | ours: built from code in Blender by the asset scout (`studio_desk.py` + `rack_atlas.py`, in the session scratchpad); the rack gear is made up, no names or logos. Its top: Poly Haven "Walnut Veneer" https://polyhaven.com/a/walnut_veneer | geometry + gear atlas: RevAudio; walnut: Jenelle van Heerden | ours; walnut CC0 | 2026-11-08 (the page: "CC0 License") | walnut darkened (x 0.27 / 0.235 / 0.21); knobs, LEDs, jacks, screws instanced (EXT_mesh_gpu_instancing); meters + LEDs emissive |
| studio-monitor.glb + monitor-stand.glb | E02 + E03, the studio monitors on floor stands (Dan's pick 2026-11-08: "black") | ours: built from code in Blender by the asset scout (`studio_corner.py --what monitor/stand --variant m1`, in the session scratchpad); made-up drivers, no names or logos | RevAudio | ours | 2026-11-08 | no textures; the amber power LED emissive; the stand stretched to the floor by `placeItem` |
| drum-kit.glb | E07, the drum kit (Dan's pick 2026-11-08: "wood") | ours: built from code in Blender by the asset scout (`studio_corner.py --what kit --variant k2`); the cymbal bronze texture drawn by us (numpy). Its shells: Poly Haven "Walnut Veneer" https://polyhaven.com/a/walnut_veneer | geometry + cymbals: RevAudio; walnut: Jenelle van Heerden | ours; walnut CC0 | 2026-11-08 (the page: "CC0 License") | walnut recoloured (x 0.5 / 0.45 / 0.42); lugs, rods, legs instanced (EXT_mesh_gpu_instancing); placed where the drawn kit stood |
| drum-throne.glb | E08, the drum stool | ours: built from code in Blender by the asset scout (`studio_corner.py --what throne`) | RevAudio | ours | 2026-11-08 | none |
