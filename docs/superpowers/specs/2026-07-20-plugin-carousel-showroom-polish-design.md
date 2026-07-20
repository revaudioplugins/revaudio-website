# Plugin Carousel — Showroom Polish

**Date:** 2026-07-20 · **Scope:** `src/components/PluginShowcase.astro` only.
**Goal:** keep the existing endless-ring coverflow structure and bench-exact card layout; upgrade the presentation so the carousel reads premium, branded, and alive.

## Context

The homepage carousel shows 5 plugins (RevLimiter, Drift, The AC, GAS, Radio Roulette) as an endless coverflow: current card center, ±1 neighbors peeking, rest hidden. Problems observed at 1280×665 (Dan's laptop viewport, Playwright-verified):

1. Peek neighbors use `blur(3px)` + opacity 0.42 — they read as broken renders, not legible upcoming cards.
2. The card frame is a flat dark box (`1px var(--border-bright)`) — the least "car" element on the page.
3. Arrows rest at `grayscale(0.7) brightness(0.7)` opacity 0.4 — the primary affordance is nearly invisible.
4. Slide switch is a generic 0.52s coverflow fade — nothing mechanical or branded.
5. Carousel is fully static until interaction — nothing signals there are 5 plugins.
6. At 665px viewport height the price / "More Details" / dots fall below the fold while the heading is on screen.

## Design — six changes

### 1. Crisp peeks (kill the blur)
- `.is-peek-prev / .is-peek-next`: remove `blur(3px)`; replace with `filter: saturate(0.55) brightness(0.7)`; opacity → ~0.55.
- Keep existing `translateX(±58%) scale(0.8) rotateY(∓14deg)` geometry.
- Hover on a peek: near-full clarity (`saturate(0.9) brightness(0.9)`, opacity ~0.85). Remove the current hover blur(2px).
- Hidden slides (past ±1) also drop blur — plain scale/fade suffices.

### 2. Brass-trimmed panel (card frame)
- Border reads as machined brass: thin gradient edge, brighter at top (light catch), darker at bottom. Implementation: border-image or a padded gradient wrapper via `background` layering — whichever stays on the `.sc-slide` element without adding DOM inside the bench coordinate space.
- Card face: faint dark texture (pure CSS gradients — no new image assets).
- Soft radial glow behind the shot area (`.sc-shot` region), subtle.
- **Hard constraint:** all style-map coordinates (title/sub/shot/oneliner/price/more left+top) untouched. `/_cardbench` layout parity holds; frame chrome is additive only.

### 3. Alive arrows
- Rest state: `grayscale(0.3) brightness(0.7)`, opacity 0.75 (was 0.7/0.4).
- One glint sweep (brief brightness/drop-shadow pulse) when the section first scrolls into view (IntersectionObserver, fires once). Skipped under `prefers-reduced-motion`.
- Hover/active states unchanged.

### 4. Gear-shift snap (switch animation)
- Transform transition: 0.52s → ~0.4s with overshoot-and-settle bezier `cubic-bezier(0.34, 1.3, 0.35, 1)` — incoming card clunks into place; peeks move in sync (same transition applies to all slides, as today).
- Opacity/filter transitions shorten to match (~0.3s).
- `prefers-reduced-motion`: keeps today's behavior — transitions removed, states snap instantly.

### 5. Auto-advance
- Advances `go(idx + 1)` every 6s, **only while the carousel is in the viewport** (same IntersectionObserver as the arrow glint).
- Pauses while hovered; resumes on leave.
- **Stops permanently on first user interaction**: arrow click, dot click, peek click, swipe, or keyboard arrow.
- Disabled entirely under `prefers-reduced-motion`.
- Runs on mobile too (flow layout) with the same stop rules; hover-pause is a no-op there.
- The aria-live announcer must NOT fire on auto-advances (only on user-driven changes) — otherwise the screen reader narrates every 6 seconds.

### 6. Height-aware fit
- Desktop `fit()`: `scale = min(1, availW / iw, availH / ih)` where `availH` = `window.innerHeight` minus an allowance for the sticky header + dots row (measured, not hardcoded, where practical; a small fixed allowance is acceptable).
- Floor the scale at ~0.7 so the card never shrinks into illegibility on very short windows — below that, scrolling is fine.
- Mobile (≤640px) path unchanged (natural flow).

## Out of scope
- Slide data/content, style maps, `/[slug]` pages, PluginCard, partner's motion system (`lib/motion` etc.), home-bench sliders.
- No new image assets.

## Testing (Playwright, dev server)
1. **1280×665 first** (Dan's viewport rule): full card + dots visible without scrolling; peeks legible; screenshot compare vs current.
2. 390×844 mobile: flow layout intact, auto-advance works and stops on swipe/dot.
3. `prefers-reduced-motion: reduce`: no auto-advance, no glint, instant state snaps.
4. Interaction kill-switch: click an arrow, wait >6s, confirm no auto-advance resumes.
5. Announcer: no aria-live updates during auto-advance; updates on manual change.
6. Keyboard: ArrowLeft/Right still work; focus outline behavior unchanged.
