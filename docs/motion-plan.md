# RevAudio.net — Motion Design Plan

**Date:** 2026-06-10 · **Status:** steps 1–2 implemented 2026-06-10. Step 1: `src/lib/motion.ts` + tokens in `global.css`, wired in `BaseLayout`. Step 2: `src/lib/reveal.ts` declarative viewport reveals (`data-reveal` / `data-reveal-accent` / `data-reveal-group`+`data-reveal-item`), pre-hide gated by `html.motion-ok` inline head script. Note: testimonials + press data arrays are empty (never-invent rule) so those reveals are dormant until real data lands. Step 3: sticky feature walkthrough on `/[slug]` — `src/lib/walkthrough.ts` + restructured features section (sticky stage column, scrolling copy steps with active highlight + scrubbed drift); per-step shot crossfade wired via `data-shot`, dormant until `galleryImages` gets real entries (currently 1 shot). Step 4 (= plan's "text splitting"): `src/lib/splittext.ts` — `data-split` headlines word-split via GSAP SplitText (mask rise, 80ms stagger, aria:"auto", waits for fonts, full revert after entrance so DOM/resize/a11y stay clean); applied to section h2s site-wide + store h1; sections restructured to "h2 splits, body reveals". Hero-motion step still blocked on the new hero UI (/herolab) — `data-split` is ready for its headline. Step 6 polish (partial): `src/lib/scrub.ts` generic `data-drift` scrub — applied to DAWStrip (±4% conveyor, overflow clipped); EmailCapture success-state settle-pop (CSS-only, motion-ok gated). Verified WebKit+Chromium incl. reduced-motion.
**Hero motion SHIPPED 2026-06-10 (commit `5e6e484`)**: real RevLimiter REV gauge hero (face captured from plugin UI; plugin's own needle/hub PNGs, −135°…+135° around (203,203)) — entrance rev-blip → idle, scroll-scrubbed rev toward redline, lerp pointer micro-deflection, split headline; SUBSCRIBE plate CTA → SubscribeModal (name+email, shared Formspree token in site.ts). Designed in the local git-excluded `/herolab` bench — iterate there, then port.
**Remaining, all data-blocked:** audio-demo meter map (needs bounced A/B files), testimonial/press/gallery-crossfade reveals (wired, dormant until data).
**Sources:** Olivier Larose "Top 5 Techniques for Web Animation" (youtube 9eHEOAn2FOA — techniques + tools) × Sam John UI Animation Style Bible (physics, timing, anti-patterns — `~/workspace/research/sources/2026-05-sam-john-ui-animation-style-bible.md`).

## Motion identity

The site sells vintage-voiced hardware-feel plugins. Motion must read **mechanical, weighted, damped** — like a needle settling on a VU meter or a relay engaging — never floaty SaaS-parallax. Sam John's rules apply with one brand twist: prefer the **Heavy Settle** end of the spring spectrum everywhere.

Binding rules (from the bible, non-negotiable):
- Spring-feel easing, never linear; overshoot 3–8% max.
- Scale (88→100%) + opacity together on every entry; anchor bottom/centre.
- Stagger groups 60–120ms; never simultaneous.
- Entry slower than exit (~600ms in / ~300ms out).
- `prefers-reduced-motion: reduce` → kill all scroll-linked + entrance motion, keep instant states. Every effect in this plan ships behind this guard.

## Stack decision

Astro static islands, no React → **GSAP** (now 100% free incl. bonus plugins since 3.13) + **Lenis** smooth scroll. Framer Motion is out (React-only). No new framework.

| Video technique | Tool here |
|---|---|
| 1 · Scroll tracking | GSAP `ScrollTrigger` (`scrub`) + **Lenis** (`lenis.on('scroll', ScrollTrigger.update)`) |
| 2 · Viewport detection | `ScrollTrigger` (non-scrub, `once: true` for reveals) |
| 3 · Sticky position | native CSS `position: sticky` + ScrollTrigger `pin` only where CSS can't |
| 4 · Easings | tokens below, in `global.css` + a shared `motion.ts` |
| 5 · Text splitting | GSAP `SplitText` (free now; handles a11y `aria-label` + resize re-split) |
| Bonus · map | `gsap.utils.mapRange` / CSS `clamp()` |
| Bonus · lerp | tiny rAF lerp helper for hero pointer-follow |
| Bonus · shaders | **deferred** — wrong cost/benefit for a single-product store; revisit if a 3D plugin render ever lands |

One shared module `src/lib/motion.ts`: inits Lenis, registers ScrollTrigger, exports easing/duration tokens + the reduced-motion guard. Loaded as a single deferred script from `BaseLayout.astro`; per-page code stays in small inline `<script>` islands. Budget: ≤ ~60KB gz total added JS.

**Easing tokens**

```css
--ease-settle:  cubic-bezier(0.22, 1, 0.36, 1);   /* entries — heavy, damped */
--ease-exit:    cubic-bezier(0.32, 0, 0.67, 0);    /* exits — accelerate out */
--dur-in: 600ms; --dur-out: 300ms; --stagger: 90ms;
```
GSAP side: `ease: 'expo.out'` for reveals, `'back.out(1.05)'` (≈5% overshoot) for accents, `'none'` for scrubbed tweens (the scroll is the easing).

## Page-by-page

### Homepage

| Section | Technique(s) | Spec |
|---|---|---|
| **Hero (`.hero-canvas` — currently empty, new UI pending)** | scroll tracking + lerp + map | Design the new hero motion-first. Plate/unit render enters once on load: y +40px → 0, scale 88→100%, opacity 0→1, 800ms Heavy Settle. Pointer-follow: lerp (factor ~0.08) drives a brass glow/highlight ±6px on the plate — felt, not seen. On scroll, `mapRange(0→1, …)` scrubs the unit slightly up + a needle/meter element sweeps — the "rev" moment. |
| Hero headline (when text returns) | text splitting | SplitText to words; rise 100% from below `overflow: hidden` masks, 80ms stagger, expo.out. Lede fades in after, single block. |
| SaleBanner | easing only | No entrance animation (it's above the fold and informational). Keep instant. |
| "The plugin" card | viewport detection | Card reveal at 70% viewport: y+scale+opacity, once. Price/badge pops 120ms after card settles (`back.out`). |
| DAWStrip | scroll tracking | Slow horizontal drift scrubbed to scroll (±4% translateX) — subtle conveyor feel. Logos at rest otherwise. |
| TestimonialBlock | viewport + stagger | Quotes cascade, 90ms stagger, bottom-anchored. |
| PressLogos | viewport + stagger | 50ms cascade (7+ items rule), opacity 0→1 + y 12px only — no scale on logos. |
| EmailCapture | viewport | Single reveal; submit-success state gets the one allowed "confirmation" accent (soft scale pop on the thank-you). |

### Product page (`/[slug]` — RevLimiter)

| Section | Technique(s) | Spec |
|---|---|---|
| Gallery / unit shots | **sticky** + scroll tracking | The signature move: image column `position: sticky` while feature copy scrolls past; each copy block crossfades the active shot (scrubbed). This is the technique-3 showpiece. |
| Feature list | viewport + text splitting | Section `h2`s split to words (mask-rise); body copy plain fade — split headlines only, never paragraphs (a11y + cost). |
| AudioDemo | map + easing | Play-state meter/progress driven via `mapRange`; transport buttons keep the existing `.press` pressed-frame swap (already correct tactile motion — don't touch). |
| BuyButton | easing only | Hover: brass brighten 150ms; active: existing pressed-asset swap. No entrance dance on the money button — it's there instantly. |

### Store + about/support
Viewport reveals on cards/sections only (same tokens). Nothing scrubbed. Low-traffic pages stay cheap.

## What we deliberately do NOT do

- No shaders/WebGL (deferred, above).
- No scroll-jacking; Lenis smooths, never hijacks. Native anchor/keyboard scroll must keep working.
- No parallax on text, no rotation as primary motion, no animation on legal/checkout flows.
- No re-animating on every viewport entry — reveals fire `once`.
- Cart/Gumroad iframe area: zero motion (don't animate around payment).

## Build order

1. **Foundation** — `motion.ts` (Lenis + ScrollTrigger + tokens + reduced-motion kill-switch), wire into `BaseLayout`. Verify scroll feel in Safari first (WKWebView parity habit), then Chrome.
2. **Reveals pass** — viewport entrances site-wide (cheapest, biggest lift in perceived quality).
3. **Sticky gallery** on the product page.
4. **Hero motion** — build alongside the new hero UI (don't animate the empty canvas; design the two together, via /herolab).
5. **Text splitting** on hero + section h2s.
6. **Polish** — DAWStrip scrub, lerp pointer-follow, audio-demo map.

Each step ships independently; stop anywhere and the site is still coherent.

## Acceptance checklist (per step)

- [ ] Safari + Chrome parity (test Safari first)
- [ ] `prefers-reduced-motion` honored — zero movement, content fully readable
- [ ] No CLS: reveals animate transform/opacity only, space pre-reserved
- [ ] Lighthouse perf ≥ current baseline (measure before step 1)
- [ ] Overshoot ≤ 8%, group staggers ≥ 50ms, entry > exit duration
- [ ] Keyboard scroll + anchor links unaffected by Lenis
