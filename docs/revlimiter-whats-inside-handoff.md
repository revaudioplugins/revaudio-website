# TASK — Scroll-linked "What's Inside" part-highlighter (RevLimiter)

## Goal
On the plugin detail page's **"What's inside"** section, as each feature description scrolls into
focus, highlight the matching physical PART of the RevLimiter interface shown pinned alongside it.
Per active step: **dim the rest of the plugin, glow the active part, push-zoom onto it, and draw a
connector line from the feature text to that part.** Scroll-driven, enhancement-only.

This is an EVOLUTION of machinery that already works — do not rebuild from scratch.

## Repo
Astro 4 static site: `C:\RevAudio\Website\revaudio-website\`
Build check (must stay green): `npm run build`

## Files you own
- `src/pages/[slug].astro` — the `<section class="features" data-walkthrough>` block + its scoped
  `<style>`. Today: left `.walk-copy` = `[data-walk-step]` feature blocks; right `.walk-stage` =
  `position:sticky` frame that crossfades screenshot images (`[data-walk-shot]`). **Upgrade this.**
- `src/lib/walkthrough.ts` — the existing scroll engine (gsap + ScrollTrigger). It already toggles
  `.active` on the correct step via per-step ScrollTriggers (`start:'top 55%'`), early-returns under
  `reducedMotion()`, and applies its drift tween to the FRAME CHILD, never the sticky element.
  **Extend this file; keep its reduced-motion early-return and its frame-child transform rule.**
- `src/lib/motion.ts` — exports `gsap`, `ScrollTrigger`, `reducedMotion()`. Reuse; do not add libs.
- `src/data/plugins.ts` — `features[]` per plugin. You will add an optional per-plugin `stage` config
  here (see "Reusable architecture").
- `src/styles/global.css` — brand tokens (`--brass`, `--brass-bright`, `--fg-dim`, `--oxide`, `--bg-2`).

## Decisions already made (do not relitigate)
1. **Stage = the existing screenshot, NOT an SVG rebuild.** Use the real screenshot
   (`src/assets/plugins/revlimiter-hero.png` — verify it shows the full UI; if not, request the
   correct full-panel shot before building). Overlay a dim mask + a brass highlight box positioned by
   PERCENTAGE coordinates over the active region. This stays pixel-true to the shipped plugin forever.
   **Do not hand-build an SVG likeness** — it drifts from the baked UI and reads as "not the plugin."
2. **Keep the connector line AND the push-zoom** — but under the hard mandates in "Motion rules".
3. **Build RevLimiter now, but architect it reusable** so a future plugin plugs in by adding data only.

## Reusable architecture (RevLimiter now, any plugin later)
Make the section DATA-DRIVEN. Add to each plugin in `plugins.ts` an optional field:

```ts
stage?: {
  shot: string;              // imported screenshot asset of the full plugin UI
  parts: Record<string,      // slug -> region rect as PERCENTAGES of the shot (0-100)
    { x: number; y: number; w: number; h: number }>;
};
```
And add an optional `part?: string` to each `Feature`. The astro section logic:
- If the plugin has `stage` AND its features carry `part` slugs → render the interactive overlay
  (mask + highlight box + connector + zoom) driven by the part rects.
- Else → fall back to the CURRENT image-crossfade behaviour, untouched.
This way "do the same for the next plugin" = add a `stage` block + `part` slugs. No code changes.

## RevLimiter feature → part map (author this in plugins.ts)
Anchor slugs verified against the real revui (`C:\RevAudio\Plugins\RevLimiter\Source\ui\public\index.html`).
You must translate each to a PERCENTAGE rect on the screenshot (measure against the actual image;
the revui ids below tell you WHICH control each targets):

| # | Feature | Part slug | Target region (revui anchor) |
|---|---------|-----------|------------------------------|
| 1 | True-peak limiting | `ceiling` | `#ceiling` knob + `#thresholdCol` / ceiling readout cluster |
| 2 | Adaptive multi-band release | `bands` | the 3 band knobs / `#grMeterLow`+`#grMeterMid`+`#grMeterHigh` cluster |
| 3 | Analog-modelled saturation | `saturation` | **ORPHAN — no discrete control.** Fallback: box the whole processing/knob row |
| 4 | Pro-tier metering | `meters` | LUFS/GR numeric readouts + `#grMeter*` (the metering cluster) |
| 5 | Up to 32× oversampling | `oversampling` | `#osCombo` selector |
| 6 | Visual rev gauge | `gauge` | `#needleWrap` / `#grOuterArc` / `#needle` (the gauge) |
| 7 | A/B compare | `ab` | `#abToggle` + `#abCopy` |
| 8 | Lookahead with PDC | `lookahead` | **ORPHAN — no discrete control.** Fallback: box the whole unit (gentle, no deep zoom) |

**Orphan rule (features 3 & 8):** when a `part` rect covers the whole unit / a cluster rather than one
control, DO NOT deep-zoom (it looks broken). Use a soft full-frame dim-lift + a large loose box, zoom ≤1.05×.

## Motion rules (mandatory — these are the guardrails that keep connector+zoom from glitching)
- **Sticky containing block:** never put `transform`, `filter`, `perspective`, or `will-change` on
  `.walk-stage` OR on any ancestor it shares (`.walk-grid`, the `.features` section, any `data-reveal`).
  Any of those silently converts sticky → scrolls-away. Dim mask, highlight box, and zoom live ONLY on
  elements INSIDE `.stage-frame` (the frame child), which is already the house pattern in this file.
- **Zoom:** small push-in only, **≤1.15×** (≤1.05× for orphan/whole-unit parts). Transform the inner
  frame/image, never the sticky wrapper. Animate with gsap, `overwrite:'auto'`, ~0.45s power2.out to
  match the existing crossfade feel. Keep `transform-origin` at the active part's center.
- **Connector line:**
  - Render it in a **`position:fixed`** SVG overlay across the viewport (NOT absolutely inside the
    scrolling `.walk-grid`).
  - Recompute BOTH endpoints every tick via `getBoundingClientRect` (source = active step's inner
    edge; target = active highlight box center). Do not compute once.
  - Hook the redraw to the **existing gsap.ticker / ScrollTrigger update cycle**, not a standalone
    `requestAnimationFrame` — a separate rAF desyncs from Lenis smooth-scroll and jitters 1 frame.
  - Mark the SVG `aria-hidden="true"`. During the pinned phase the target endpoint is static while the
    source scrolls — that's expected; keep the line thin/brass so it reads as a callout, not a seam.
- Call `ScrollTrigger.refresh()` after the screenshot is loaded/in the DOM so triggers aren't
  miscomputed against a zero-height image.

## Accessibility & fallback (mandatory)
- **CSS default state = full, undimmed, unzoomed, no box, no line.** All highlight/dim/zoom/connector
  is added by JS only. So no-JS AND `reducedMotion()` users see the whole plugin screenshot statically
  with every feature at full strength (the engine already early-returns under reduced motion — keep that).
- **Text emphasis stays color-based** (`--fg-dim` → `--brass-bright`), never opacity — the file already
  refuses opacity dimming on text for WCAG 1.4.3 (there's a comment saying opacity:0.35 failed 4.5:1).
- The screenshot `<img>` keeps a real `alt`; the mask/box/connector are decorative
  (`aria-hidden`). Nothing (no info, no CTA) may exist ONLY in the glowing/zoomed state.
- Dim mask opacity **moderate (~0.55, matching the existing frame shadow language)** and keep the active
  region at full brightness — do not crush the rest to near-black (low-vision / prefers-reduced-transparency).

## Mobile (<900px)
The stage already un-pins (`position:static; order:-1`) and stacks ABOVE the copy. A glowing part
scrolls off-screen before you read step 5 — so on mobile **disable connector + zoom**, and either
(a) show a small inline part-thumbnail (cropped to the part rect) inside each `[data-walk-step]`, or
(b) keep the static full screenshot with no linkage. Pick (a) if feasible; never "glow a part nobody
can see". State which you chose.

## Deliverable
1. `plugins.ts`: RevLimiter `stage` block (shot + 8 part rects) + `part` slug on each feature.
2. `[slug].astro`: data-driven overlay markup (mask, highlight box, fixed connector SVG) + scoped CSS,
   with clean fallback to the current image path when a plugin has no `stage`.
3. `walkthrough.ts`: extended to drive mask/box/zoom/connector from the active step's `part`, honoring
   every Motion rule above and the existing reduced-motion early-return.
4. `npm run build` green. Degrades cleanly with JS off and under reduced motion.
5. **Show a screenshot** of one feature active (dimmed rest + brass box on the part + connector +
   subtle zoom) AND one of the reduced-motion/no-JS state (full, undimmed) before declaring done.

## Do NOT
- Rebuild the UI as SVG. Add JS libraries. Put transforms on the sticky ancestor chain. Introduce
  opacity dimming on text. Invent part rects without measuring the real screenshot. Ship a mobile
  state that glows an off-screen element. Touch plugin source or DSP.
