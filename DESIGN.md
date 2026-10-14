# revaudio.net — Design Spec

Derived from `shared/wiki/pages/design-language.md` §6 (the constitution). Written 2026-09-06 for
the garage homepage pass. Product pages (`[slug].astro`) already follow it; this file writes down
what they do so the homepage and every future page stay in the same garage.

## 0. Metaphor

THE OBJECT: **the RevAudio garage**, the workshop the plugins are built in. Not a dashboard, not a
showroom: a dark two-bay garage at night, one tube light on, the bench lamp on, a car under cover.

ERA/VIBE: late-'60s muscle-car garage. Oiled walnut wall boards, brass fittings, oxide-red steel,
amber lamps, a little dust in the light.

MAPPING TABLE (every visible part of the site maps to something you could touch in that garage):

| garage object                      | site part                                   | what it does for the visitor             |
|------------------------------------|---------------------------------------------|------------------------------------------|
| the big tach on the wall           | hero gauge medallion (`/` hero)             | the brand in one glance; needle = scroll |
| the back wall (wood + brass rails) | `GarageWall.astro` / `.garage-wall`         | the surface a section hangs on           |
| the parts rack                     | plugin showcase coverflow (`#plugins`)      | what's for sale, price on the tag        |
| stencil sprayed on the wall        | the word wall (`WordWall.astro`, home)      | what the sound does, in five words       |
| the plugin window hung on the wall | RevLimiter UI beside the stencil            | proof: this is the thing                 |
| the truck door with the handle     | BuyButtonCrane (product pages)              | the ONE way in: pull the handle          |
| the "goes with every vehicle" sign | DAW strip                                   | compatibility                            |
| the pit-crew clipboard             | EmailCapture ("Join the pit crew")          | newsletter                               |
| the steel roller door, half up     | closing CTA                                 | leave with the trial                     |

Plain language instructs, the metaphor only orients (PRODUCT.md): every CTA says what it does in
words ("Start your 30-day free trial"); the garage never has to be decoded.

## 1. Theme & atmosphere

You are standing inside the garage after hours. The tube light over the bench is the only cold
light; everything else is the amber of a bench lamp and the red of a tail-light. Surfaces are real:
walnut boards you could pry off, brass rails with rotated screws. Nothing floats; nothing glows
without a lamp to explain it. Depth comes from real surfaces (the wood, the rails, the plugin
window hung on them), not from gradients painted on the page.

## 2. Palette

House tokens, reused verbatim from `src/styles/global.css` `:root`:

- darks: `--bg-0 #0b0a09` (bakelite, the page), `--bg-1 #14110f`, `--bg-2 #1d1916`, `--bg-3 #2a2420`
- inks: `--fg #efe9df` (parchment), `--fg-dim #8a8275`, `--fg-faint #827c74` (AA on bg-0/bg-1)
- brass: `--brass #c9a35c`, `--brass-bright #e8c878`, `--brass-dark #8c6f3a` (3-stop rule: dark, brass, bright)
- chrome: `--chrome #d8d4cc`, `--chrome-dark #76726a`
- oxide: `--oxide #8b3a1f`, `--oxide-deep #5a2410`, `--oxide-text #d4622a` (AA text oxide)
- race-red: `--redline #c8331f`. ONE hero element per page: the `.hh-redline` sweep on `/`, the
  RevLimiter wordmark on product pages. Never on a second element.
- `--emerald #2f6b4a` for "armed / live" pilot lights only.

Additive, page-local: the word wall's DRIFT panel only (`WordWall.astro`, 2026-10-14): one neon hue
`--ww-neon-h` (301 = DRIFT's `--d-lcd` #f24cf0), from which the tube, halo, core, glass and kana colours
are derived so that at 301 they land on the /drift tokens (`--d-neon` #d23cff, `--d-pink-ink` #ffd1f8,
`--d-crt` #d98bff, `--d-fg-dim` #a58cc4). Nowhere else on the house pages.

Forbidden: pure `#000` / `#fff` outside `html.hc`; yellow speculars on red; race-red on buttons;
neon or glow without a lamp (a neon sign IS a lamp: the DRIFT panel's lit tube may glow and spill); the retired tach arc that hue-shifted toward the redline with scroll depth
(out in `c3fc068`, stays out). The smoke it sat on came back on its own (`src/lib/haze.ts`, §5).

## 3. Typography

- Display: `--font-display` Bebas Neue (fallback Oswald, Arial Narrow). Headlines are stamped
  into the wall: `text-shadow: var(--engrave)` on the garage wall, `--engrave-fine` for small caps.
- Body: `--font-body` Inter. Readouts and specs: `--font-mono`, in object units (dB, ms, `$`, `VST3 · AU`).
- Painted copy erodes with wear: stencil words on the wall are outlined brass that fills on hover;
  the filled word is `--oxide-text`, never race-red (Law 5 + one-hero rule).
- Kickers (`.hh-tag`, `.sk-tag`, `.ww-tag`): mono, letter-spaced 0.3em, `--brass`.

## 4. Components

- Cart drawer (2026-09-22 local review): the parts counter, warm dark steel with cream text and brass details. Real catalog thumbnail, readable product name, one-licence/digital-download metadata, formats and aligned price. Subtotal explicitly says USD, with tax deferred to payment. One compact brass key says “Continue to payment”; live text and a full-surface hit target replace the large red image panel. Header and support stay visible while the body scrolls on short screens. Native dialog, consent reader and existing provider handoff remain. Empty state returns to the store. No new licence/update/refund promises.
- Hero gauge medallion: face PNG (static, lit), needle (rotates; the light never rotates), hub (static).
  Needle: -135° min, -90° idle, +90° redline, +135° max; scroll revs it; pointer micro-deflects.
- Garage wall (`GarageWall.astro`): `wall-wood.png` tile 512px, brass rail `wall-rail.png` top +
  bottom (`--rail-h` 30px, 22px at 480px and below), rail cast shadow, `data-drift-y` 24px parallax
  on the wood, warm top light + 38% scrim. Same wall as the product pages' `.garage-wall`.
- Word wall (`WordWall.astro`): five stencil words in Bebas, `-webkit-text-stroke` brass, opacity
  .5 / .72 / 1 / .72 / .5 outward from the filled word; hover fills any word in ~120ms house curve.
  The plugin's window hangs beside it with the shadow stack and one caption line. One panel per
  carousel plugin; `showcase:change` swaps them.
- Word wall, DRIFT panel (first while `drift.homeLead`; 2026-10-14, Dan: the stencil "says nothing
  about DRIFT"). `DRIFT_LOOK` picks `current` (the stencil above) / `neon` / `steer` / `both` (built:
  `both`). Same five words, same blurb, same alt text; only this panel changes.
  - NEON: a neon shop sign bolted to the wood, still Bebas. Unlit words are pale violet-grey glass
    tubes (thin edge, faint body, a fine upper-left specular, 2px off the wall); SLIDING is lit:
    warm near-white core (never #fff), DRIFT-magenta tube skin, a layered glow, and a soft spill on
    the wood behind it (screen-blended, so the grain brightens: Law 4, light leaks). A small vertical
    ドリフト tube burns dim beside the stack (the /drift Japanese subset). Motion = feedback: the lit
    tube powers on with a 600ms three-stutter flicker the first time the panel is seen; hovering a
    word strikes its tube on (~120ms house curve, one stutter; real hover only, so a phone tap never
    leaves a second tube lit).
  - STEER: the hand is the wheel. On a mouse, pointer X over the wall steers the words; each is its
    own damped spring (lower word = heavier, like low bands lagging the highs), SLIDING travels
    furthest, leans with its speed and leaves a burnt-rubber smear on the wood that fades in ~1.2s.
    Travel stops short of the window and the wall's edge. On touch (no hover): one drift-in from the
    side when the panel is first shown, overshoot, settle. rAF only while something moves.
  - BOTH: neon tubes that steer; the lit tube's spill rides with it.
  - The window is the live DRIFT run (`public/drift/wall-run-1440` / `-800`, webm + mp4, poster =
    its first frame through the image pipeline), same box, radius and shadow as the screenshot; it
    plays only while the DRIFT panel is active and on screen, and never under reduced motion.
  - The wall behind it (`DRIFT_BG`, built 'screen'; Dan 2026-10-14: "the whole back a digital
    screen"): /drift's digital screen (the keep-it TV's phosphor tube) full bleed between the brass
    rails, scanlines + grille + glass over the panel, kicker + caption in phosphor violet, the skid
    as phosphor afterglow, a CRT turn-on with the sign; it fades back to the wood when the carousel
    moves on. `.ww-screen` / `.ww-screen-fx` live on `.ww`, outside the panels. 'wood' = the garage wall.
  - The screen's frame (`DRIFT_FRAME`, built '2'; Dan 2026-10-14: "the frame in DRIFT's vibe, a broken
    TV frame"): a beat-up CRT cabinet front 9-sliced round the whole screen in place of the brass rails
    (`tv-broken-1/2/3.png`, AI blank rolls; cracked corner with DRIFT's worn magenta checker, gaffer
    tape, a missing screw, a chunk broken off, all in the corners). The long runs TILE (`round`):
    stretched 3-4x they streak. `--ww-frame-u` = CSS px per cut pixel (bench "Frame size", capped by
    0.0185vw so the side bezel fits the wall's gutter on every width: words never under the bezel, the
    steer stops at the opening). Anchored to the content box, not 100vw (a classic scrollbar would eat
    the right bezel). A magenta power LED in the chin lights with the screen's turn-on (a lamp).
    'rails' = the brass rails as before. Bench: RAILS / BROKEN TV 1-3, Frame size, Wood around the TV.
  - The window (`DRIFT_WIN`, built 'plain'): 'tv' plays the run on /drift's keep-it TV cabinet (`tv-frame-3.png`, 9-sliced, `--ww-tv-size` 0.72
    of /drift's bezel, 0.69 of that on phones), the bulged CRT tube with scanlines + aperture grille +
    glass, the cabinet livery as matte printed ink (laptop only), a CRT turn-on with the neon power-on.
  - Every tunable is a `--ww-*` property on the panel, tuned on the dev bench `/__wwbench`
    (`tools/wwbench`: the real homepage at laptop + phone size, look switch, sliders, REPLAY, COPY
    SETTINGS; "apply ww bench" bakes the values). Reduced motion: lit and still, poster only.
    `html.hc`: plain words like the other panels.
- Trial CTA / buy: flat brass-bright button at the page end on `/`; the crane door on product pages.
- Coverflow showcase, DAW strip, EmailCapture, SubscribeModal, TrialGateModal: unchanged house parts.
- Support chat (`SupportChat.astro`, `/support` only): chat-app thread grammar in house materials —
  visitor right in 3-stop brass, Support left on dark steel with avatar + curved tail on a group's
  last bubble, time stamp inside the bubble, bakelite wallpaper with a brushed diagonal. Answers use
  a fixed grammar (also the worker's reply contract): key words **bold `--oxide-text`**, no wash
  behind them (Dan, 2026-09-08 — highlight was tried and cut); one step per line with a stamped
  badge; paths on engraved mono plates with a copy rivet; `[mac]`/`[win]` blocks shown for the
  visitor's OS with a flip chip; `!` hazard-stripe callout (oxide) and `+` pilot-lamp callout
  (emerald). Key words lamp once as the bubble lands, then settle. Bench: `bench/support-answers-bench.html`.

## 5. Depth & lighting

One light source, upper-left (~35% 25%). On the wall: a warm top light `rgba(255,214,150,.07)` to 0
over the first 32% of height, plus a 38% `--bg-0` scrim so parchment ink passes AA on the wood.
Shadow stack (all raised parts): `0 1px 0 #000` contact + `0 8-24px 24-48px rgba(0,0,0,.5-.6)`.
Hover: lift 1px + shadow grows; press: return, 2px max travel.

The smoke: two screen-blended haze plates (`public/bg/haze1.webp`, `haze2.webp`) on a fixed layer
behind the page at 16% / 10% under a 40% `--bg-0` veil (25% on phones), so the dust in the lamp light
reads through the hero and the translucent footer; solid section panels cover it. Off in `html.hc`.

## 6. Motion

Canon = the crane door (`BuyButtonCrane.astro`): physics, feedback only, in the page. Curves
`--ease-settle cubic-bezier(.22,1,.36,1)` entries 600ms, `--ease-exit` 300ms, stagger 90ms; hover
strikes ~120ms `cubic-bezier(.2,.9,.25,1.25)`. Scroll: needle revs; wood drifts 24px; reveals via
`data-reveal` (top 80%) with a 2.5s force-reveal. The smoke drifts on a slow sine (40/25px and
55/30px orbits), kicks up to 3.5x on a fast scroll and settles, leans up to 14px with the pointer
(desktop only). The word wall's DRIFT panel: neon power-on flicker once, hover strike ~120ms, the
steering springs on a mouse, one drift-in on touch (§4). Reduced motion: everything visible at rest,
no parallax, no needle rev, smoke static.

## 7. Hero + glanceability

THE hero is the gauge medallion with "Engineered, Then Tuned." over it. One glance: brass tach,
red sweep under the headline, "Boutique plugins" above. Everything below is the walk through the
garage: rack, stencil wall, the sign, the clipboard, the door. No second hero, no metric grid, no
card grid.

## 8. Layout

```
+------------------------------------------------------+
| HERO  gauge medallion + 2-line headline               |  ~100svh, vignette
+------------------------------------------------------+
| OUR PLUGINS  coverflow rack (#plugins)                |  unchanged
+------------------------------------------------------+
| WORD WALL  five words per plugin (DRIFT: neon/steer)  |  wood wall + rails; the plugin's UI right
+------------------------------------------------------+
| GOES WITH EVERY VEHICLE  DAW strip                    |  unchanged
| JOIN THE PIT CREW  EmailCapture                       |  unchanged
| HEAR IT ON YOUR OWN MIX  trial CTA                    |  unchanged
+------------------------------------------------------+
```

Base: `--maxw min(1440px, 95vw)`; the word wall collapses to one column at 860px and below,
words first, window under them.

## 9. Do's & don'ts

- DO keep every claim checkable against the plugin source. Stencil words describe the intent of
  the tools, in plain adjectives; the caption line comes from PRODUCT.md / CLAUDE.md.
- DON'T add a second race-red element, a countdown, a star rating, or a press logo (data files are
  empty by design until real ones exist).
- DON'T absolute-position decorative props to pixel coordinates; wall and rails are flow +
  percentages so every viewport works.
- Astro scoped styles: anything injected at runtime or living in another component needs `:global()`.

## 10. History + open questions (for Dan)

- 2026-09-06 garage pass: three photo story rows (car plate, hardware-unit concept render, the
  truck door painted "30 days") were built, reviewed and cut by Dan; only the word wall stays.
  The cut work lives on branch `garage-pass` (commit `7e4b3b6`) if any of it is wanted back.
- 2026-09-06 Dan: "add the vibe of the smoke that we had before": the haze plates from the old
  enginebg layer are back as `src/lib/haze.ts`; the red-shifting arc, embers and waveform are not.
- Stencil words: LOUD / WARM / PUNCHY / GLUED / DEEP. Which one should be the filled (oxide) word?
- 2026-10-14 Dan: the word wall's DRIFT panel looked like every other panel. It got its own looks
  (neon sign / steering springs / both, `DRIFT_LOOK`, built `both`) and the live DRIFT run as its
  window; tuned on `/__wwbench`. RevLimiter, GAS and Radio Roulette panels unchanged.
  Same day, Dan: "more of a TV screen" -> first read as the window on /drift's TV; he meant the whole
  background ("everything behind a digital screen"), so the wall became the screen (DRIFT_BG) and
  the TV window stays a bench option (DRIFT_WIN). Then "the frame in DRIFT's vibe, a broken TV
  frame": the screen sits in a broken CRT cabinet front instead of the rails (DRIFT_FRAME).
