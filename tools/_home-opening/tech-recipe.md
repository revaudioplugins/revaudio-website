# Long garage v1: live-3D recipe (Researcher 2, 2026-11-04)

**Summary for Dan: the decisions this implies**
1. Light: each light group baked alone in Blender; three groups per 8-bit KTX2, mixed live by one shared uniform (colour × flicker); a swap re-bakes only its slot.
2. Colour: AgX in Blender and three.js; TV and CRT screens drawn after tone mapping (pixel-exact); posters are lit decals.
3. Pipeline: Blender glTF → gltf-transform (destructive defaults off) → R2 on `assets.revaudio.net`, hashed, immutable. The LCP is a still the room renders of itself.
4. CSP: three additions (`'wasm-unsafe-eval'`, `worker-src 'self' blob:`, the R2 origin); no Draco, no textures inside .glb.
5. Phones: own tier (DPR ≤ 2, ≤ 100 MB textures, load once), crash-loop marker → still, a pause button, reduced motion = still. Splats: not in v1.

## 1. Layered baked light
**Bake (Blender 5.2).** Collections per light group (neon left/right, lamps, TV, CRTs, door) and per prop slot. Light Groups are render passes, not a bake option [B1, B2], so a script bakes each group alone: other groups off, props hidden, its emitters white. Light adds linearly (Blender: group passes "Add" into the full render [B2]): the live sum equals the all-on bake, bounces included.
- Diffuse, Direct + Indirect, Color off, render samples [B1]; margin ≥ 8 px; 32-bit EXR; lightmap UV active while baking (unverified).
- UV2 exports as `TEXCOORD_1` [X], loads as `uv1` [T], read via `texture.channel = 1` [M].
- Denoise: the 5.2 bake page has none [B1]: compositor Denoise (OIDN) per EXR, check island edges ([L] automates it; 5.2 unverified).

**Store.** three.js dropped RGBM and LogLuv [M]. UASTC HDR loads in r185 but, without a GPU ASTC-HDR profile, becomes BC6H or half-float at 8 bytes a pixel [T]; the iPhone's profile is unverified. So 8-bit: scale each group by its 99.9th percentile (kept in the manifest), take luminance, pack three groups into R/G/B, sRGB-encode with dither, then UASTC + RDO + Zstd (suits unlike channels [K]). sRGB gives darks most codes; concrete noise and output dither hide the rest. A group that still bands gets UASTC HDR on desktop.

**Combine (three.js r185, WebGLRenderer).** Per baked material: `lightMap = packA` (compiles the lightmap path), `lightMapIntensity = 0`, and `onBeforeCompile` appending after `#include <lights_fragment_maps>`: `irradiance += a.r*uG[0] + … + b.b*uG[5];` (`a`, `b` = both packs at `vLightMapUv`). `uG` is one uniform shared by all materials (colour × intensity × scale × π): one write per frame drives flicker, warm-up and skins. The π: three.js reads the map as irradiance and Lambert divides by π [T], while Cycles bakes radiance; the r155 notes agree [F] (derived; the parity test settles it).
- Precedent: Bruno Simon's *My Room in 3D* ships three lights in R/G/B of one map, recoloured live [S]; Unity's shadow mask packs "up to four lights per texel" [U]. Packing loses only coloured bounce.
- Phone cost: two reads a pixel; 2 × 2048² ASTC ≈ 11 MB.
- Props bake in their slot the same way; a swap touches only that slot. Contact shadow: AO baked onto a plane under the prop [B1] → black `MeshBasicMaterial` + `alphaMap`, transparent, no depth write.
- Live: the car (clearcoat, room env map, 2–4 lights, shadow card) and glossy reflections.

**glTF.** No lightmap extension in the Khronos registry [G1]; vendor ones: `MOZ_lightmap` [G2], `NEEDLE_lightmaps` [G3]. Use none: Blender custom properties → extras [B3] → `userData` [T]; a manifest maps slots to KTX2 files.

## 2. Tone mapping and colour
- three.js has AgX since r160 (2023-12-22) [R]: Filament's port of Blender's, no "look", clamped gamut [T]; Blender's default since 4.0 [B4]. B frames: AgX, Look None; compare a colour chart in both (close, not identical: unverified).
- `toneMapped: false` "is ignored when rendering to a render target or using post processing" [T]. With bloom, AgX runs in OutputPass; then the TV and CRT screens draw straight to the canvas (`toneMapped: false`), discarding fragments behind the room via a `DepthTexture` shared by both composer targets (untested). Phone fallback: no composer, in-material AgX, additive halo cards.
- Bloom threshold ≈ 1.0 catches tubes and bulbs, not baked walls, so bloom flickers with the groups.
- Posters: real artwork on decals reusing their wall's UV2, lit like paper; skins swap the image. For brand-exact colour, Khronos Neutral (r162 [R]) is near-linear below ~0.8 [T]: a look-lock choice.
- Banding: half-float until the end, ±½/255 dither on the final write.

## 3. Compression and budgets
- Mesh: meshopt (r185 reads EXT_ and KHR_ [T]; Blender 5.2 writes both [B3]). Textures: ETC1S for flat colour; UASTC for normal, ORM and packed maps [K]; needs KTX-Software [C].
- 🔴 `gltf-transform optimize` defaults simplify, merge materials, join meshes and prune unused attributes [C], deleting our `TEXCOORD_1`. Use `meshopt` + `etc1s`/`uastc` by pattern, or `--simplify false --palette false --join false --flatten false --prune-attributes false`.
- GPU memory per 2048² with mips: RGBA8 22 MB; ASTC 4×4 or BC7 5.6 MB; ETC2/BC1 2.8 MB.
- Budgets (judgement; anchors: Khronos' asset auditor defaults ≤ 5,120 KB a model, ≤ 2048 textures [K2]; §5; runtime measured 456 KB gzipped: three 188, Basis transcoder 260, meshopt 8). Laptop: still ≤ 250 KB, 3D files ≤ 12 MB, GPU textures ≤ 250 MB, textures ≤ 2048, DPR ≤ 2 and ≤ 3.7 MP. iPhone (4 GB): still ≤ 120 KB, files ≤ 6 MB, textures ≤ 100 MB and ≤ 1024 (lightmaps 2048), DPR ≤ 2 (≈ 1.3 MP).
- Load order: a canvas is never an LCP candidate [W1]. First paint: a `<picture>` still the room renders of itself at walk 0 per breakpoint (`fetchpriority="high"`). After `load`: room JS → manifest → all assets visible at walk 0 → `compileAsync` + `initTexture` [T] → crossfade. Early scrollers keep the still.

## 4. The CSP
Live (curl, 2026-11-04 12:16 GMT): no `worker-src`; `script-src` lacks `blob:` and `'wasm-unsafe-eval'`; `connect-src` lacks R2; `img-src` has `https: data:`.
From r185 source [T, F2]: KTX2Loader fetches its transcoder, runs it in a Blob-URL worker, compiles wasm; MeshoptDecoder compiles wasm (workers only via `useWorkers()`); DRACOLoader needs both (skip Draco); GLTFLoader turns images embedded in a .glb into `blob:` URLs.
Additions (dashboard Transform Rule "Security Headers"):
- `script-src 'wasm-unsafe-eval'`: WebAssembly compiling, not JS eval; low risk beside the existing `'unsafe-inline'`. Chrome 97, Firefox 102, Safari 16 [D]; older browsers keep the still. Avoidable only by shipping uncompressed. Blob workers take the page's policy, so the transcoder needs it too (HTML spec; untested).
- `worker-src 'self' blob:`: low risk, keeps `blob:` out of `script-src`; Safari 15.5+ [D]. Avoidable by forking KTX2Loader to a same-origin worker file.
- `connect-src https://assets.revaudio.net`: risk = whoever holds the R2 write token.
- Separate texture files (`.gltf` + `.bin` + `.ktx2`) need no `blob:` anywhere.

## 5. iPhone robustness
- iOS kills heavy tabs without a JS signal; Safari reloads, then shows "a problem repeatedly occurred" [WK3]. Texture load/unload crashes persist into iOS 26 betas, even at ~300 MB [WK1]; one iOS 26 log shows a 2,048 MB WebContent limit [F3]. Load once, never dispose mid-visit.
- Crash loop: set `room-boot` in sessionStorage (localStorage backup) before WebGL starts, clear it after ~8 s of good frames; a marker found on load → still for the session (survival of the kill unverified: test on Dan's iPhone).
- Context loss: stop, show the still, don't restore (three.js only rebuilds state [T]; on iOS 18 a lost context could need a Safari restart [WK2]).
- Gates: WebGL2; `saveData` → still (Chromium only; Safari has no data-saver signal [D]).
- Reduced motion: no sway, dust, flicker, shake or dolly; the still crossfades to the TV. A pause button for all: WCAG 2.2.2 (Level A) requires one for motion that starts itself and runs over 5 s [W2]. Flicker ≤ 3 flashes a second, all groups together (2.3.1 [W2]).

## 6. R2
- Custom domain: r2.dev "is rate-limited and should only be used for development"; caching and WAF need one [CF1].
- .glb, .gltf, .ktx2, .wasm, .json aren't cached by default [CF2]: add a Cache Rule. Upload via `wrangler r2 object put` with `--cache-control "public, max-age=31536000, immutable"` and `--content-type` [CF3] into content-hashed folders; never purged.
- CORS: R2 sends CORS headers only when the request has `Origin` [CF4], and the edge may replay a copy without them (community reports, unverified). Fix: one response-header rule always sending `Access-Control-Allow-Origin: *`; test by curl with and without `Origin`.
- `model/gltf-binary` and `image/ktx2` aren't compressed by default [CF5]; KTX2 is Zstd already; geometry: gltfpack `-cz` [P] or a compression rule.
- Cost (page dated 2026-10-30): $0.015/GB-month, Class A $4.50 and B $0.36 per million, egress free; free monthly: 10 GB, 1 M A, 10 M B [CF6]. For us ≈ $0.
- Astro: the upload script commits `src/data/room-assets.json` (base URL, paths), imported at build; the Pages build needs no R2 secret.

## 7. three.js ↔ Blender parity
- glTF: right-handed, +Y up, metres [G4]; "+Y Up" export converts Blender's Z-up [B3]; unit scale 1.
- Camera: glTF stores vertical `yfov`; with Sensor Fit Vertical the exporter passes Blender's angle through [X]; three.js uses it as `fov` [T]. No lens shift (glTF can't carry it).
- Lights: three.js PointLight is in candela [T]; exporter Standard = W ÷ 4π × 683, Unitless = W ÷ 4π [X]. Use Unitless, `distance: 0` (today's cut off at 9–10 m), `decay: 2`.
- Check (CI): corners and slot markers exported as empties; Blender `world_to_camera_view` [B5] per walk station and breakpoint → pixel JSON; Playwright projects the same names (`Vector3.project`) → fail above 0.5 px. Then one lamp on a white wall in both: pixels within 2 % (settles π and units).

## 8. Splat check (World Labs Marble + Spark)
- Splats carry baked light: ratified `KHR_gaussian_splatting` says lighting, exposure and tone mapping "generally do not affect rendered splats" [G5]: no live groups, no recolouring.
- Spark 2.4.0 mixes splats with three.js meshes via Rust wasm [SP]; Marble exports SPZ/PLY, commercial rights on Pro [WL].
- A removed prop leaves a hole; poster text smears.
- Verdict: no for v1; maybe later for the static street outside.

## Sources (read 2026-11-04)
- T: unpkg.com/three@0.185.1. M: github.com/mrdoob/three.js/wiki/Migration-Guide. R: github.com/mrdoob/three.js/releases.
- F, F2, F3: discourse.threejs.org/t/53733, /t/16741, /t/86978 (2025-09-14).
- B1–B3: docs.blender.org/manual/en/latest/ render/cycles/baking, render/layers/passes, addons/scene_gltf2 (5.2 LTS). B4: developer.blender.org/docs/release_notes/4.0/color_management. B5: docs.blender.org/api/current/bpy_extras.object_utils.html.
- X: github.com/KhronosGroup/glTF-Blender-IO. C: github.com/donmccurdy/glTF-Transform cli.ts. P: github.com/zeux/meshoptimizer gltf/README.md. K: github.com/KhronosGroup/3D-Formats-Guidelines KTXArtistGuide.md. K2: npmjs.com/package/@khronosgroup/gltf-asset-auditor.
- G1: github.com/KhronosGroup/glTF extensions/README.md. G2: github.com/takahirox/MOZ_lightmap. G3: engine.needle.tools/docs/explanation/architecture/technical-overview. G4: registry.khronos.org/glTF/specs/2.0/glTF-2.0.html. G5: KhronosGroup/glTF extensions/2.0/Khronos/KHR_gaussian_splatting.
- S: github.com/brunosimon/my-room-in-3d. U: docs.unity.com (Unity 6.6, Lighting Mode). L: github.com/Naxela/The_Lightmapper.
- D: github.com/mdn/browser-compat-data. W1: web.dev/articles/lcp. W2: w3.org/WAI/WCAG22/Understanding/ pause-stop-hide, three-flashes-or-below-threshold.
- WK1–3: bugs.webkit.org/show_bug.cgi?id=261685, 289601, 300782.
- CF1–6: developers.cloudflare.com/ r2/buckets/public-buckets, cache/concepts/default-cache-behavior, workers/wrangler/commands/r2, r2/buckets/cors, speed/optimization/content/compression, r2/pricing.
- SP: github.com/sparkjsdev/spark (2.4.0). WL: docs.worldlabs.ai/marble/export/gaussian-splat.

**NEXT:** Dan's OK for the dashboard work (R2 bucket + `assets.revaudio.net`, cache/CORS rules, three CSP additions) before the Nov 4–6 CSP test.
