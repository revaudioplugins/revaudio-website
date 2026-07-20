# Plugin Carousel Showroom Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the homepage plugin carousel's presentation (crisp peeks, brass frame, alive arrows, gear-shift snap, auto-advance, height-aware fit) without touching its structure or bench-exact layout.

**Architecture:** All changes live in one file, `src/components/PluginShowcase.astro` — CSS state/frame changes plus additive script logic (one shared IntersectionObserver drives an arrow glint and auto-advance; `go()` gains an announce flag; `fit()` gains a height cap). No new DOM inside the bench coordinate space, no new assets.

**Tech Stack:** Astro component (scoped CSS + inline TS module script), verified with the Playwright MCP against the local dev server.

**Spec:** `docs/superpowers/specs/2026-07-20-plugin-carousel-showroom-polish-design.md`

## Global Constraints

- Only `src/components/PluginShowcase.astro` changes. Nothing else in the repo.
- All style-map coordinates (title/sub/shot/oneliner/price/more `left`+`top` values in the `SLIDES` const) stay byte-identical — `/_cardbench` layout parity must hold.
- No new DOM elements inside `.sc-slide`'s coordinate space (pseudo-elements are fine).
- No new image assets; frame/texture/glow are pure CSS gradients.
- Auto-advance: 6s interval, only while in viewport, pauses on hover, stops permanently on any user interaction, fully disabled under `prefers-reduced-motion`, and must NOT update the aria-live announcer.
- `prefers-reduced-motion`: no transitions (instant snaps), no glint, no auto-advance — but the static peek dim treatment (saturate/brightness) STAYS (it's a state, not motion).
- Dev server: already running at `http://localhost:4321/`. Verify at **1280×665 viewport first** (Dan's laptop), then 390×844 mobile.
- Commits: in `~/projects/revaudio/revaudio-website`, identity `-c user.name=shlik -c user.email=hameatbach@gmail.com`. **Never push** — push to main deploys revaudio.net live; Dan pushes explicitly.
- This component's `<script>` is a normal processed Astro module script — TypeScript is fine here (the plain-JS-only rule elsewhere in this repo applies to `is:inline`/conditional scripts in `[slug].astro`, not this file).

**Verification harness used throughout:** the Playwright MCP tools (`browser_navigate`, `browser_resize`, `browser_run_code_unsafe`, `browser_take_screenshot`). "Verify" steps give the exact page-function snippet to run.

---

### Task 1: Crisp peeks + reduced-motion filter fix

**Files:**
- Modify: `src/components/PluginShowcase.astro` (styles only: `.sc-slide` hidden state ~line 364, peek block ~lines 377–389, reduced-motion block ~lines 537–541)

**Interfaces:**
- Consumes: nothing.
- Produces: peek states carry `filter: saturate() brightness()` (no blur anywhere). The reduced-motion block no longer strips filters — later tasks rely on that.

- [ ] **Step 1: Replace the blur-based states**

In `.sc-slide` (the resting hidden state), change:

```css
    transform: scale(0.55);
    filter: blur(2px);
```

to:

```css
    transform: scale(0.55);
```

Replace the peek block:

```css
  .sc-slide.is-peek-prev,
  .sc-slide.is-peek-next {
    visibility: visible;
    opacity: 0.42;
    pointer-events: auto;
    z-index: 2;
    filter: blur(3px);
    cursor: pointer;
  }
  .sc-slide.is-peek-prev { transform: translateX(-58%) scale(0.8) rotateY(14deg); }
  .sc-slide.is-peek-next { transform: translateX(58%) scale(0.8) rotateY(-14deg); }
  .sc-slide.is-peek-prev:hover,
  .sc-slide.is-peek-next:hover { opacity: 0.65; filter: blur(2px); }
```

with:

```css
  .sc-slide.is-peek-prev,
  .sc-slide.is-peek-next {
    visibility: visible;
    opacity: 0.55;
    pointer-events: auto;
    z-index: 2;
    /* Dim + desaturate instead of blur — the neighbors read as real, legible
       cards waiting in the wings, not out-of-focus smudges. */
    filter: saturate(0.55) brightness(0.7);
    cursor: pointer;
  }
  .sc-slide.is-peek-prev { transform: translateX(-58%) scale(0.8) rotateY(14deg); }
  .sc-slide.is-peek-next { transform: translateX(58%) scale(0.8) rotateY(-14deg); }
  .sc-slide.is-peek-prev:hover,
  .sc-slide.is-peek-next:hover { opacity: 0.85; filter: saturate(0.9) brightness(0.9); }
```

- [ ] **Step 2: Keep the dim treatment under reduced motion**

Replace:

```css
  @media (prefers-reduced-motion: reduce) {
    /* Static positions stay (peeks are a layout, not a motion effect) — only
       the animated slide/fade BETWEEN states is removed; states snap instantly. */
    .sc-slide { transition: none; filter: none !important; }
  }
```

with:

```css
  @media (prefers-reduced-motion: reduce) {
    /* Static positions stay (peeks are a layout, not a motion effect) — only
       the animated slide/fade BETWEEN states is removed; states snap instantly.
       The saturate/brightness peek dim is a STATE, not motion — it stays. */
    .sc-slide { transition: none; }
  }
```

- [ ] **Step 3: Verify in the browser**

Resize to 1280×665, navigate to `http://localhost:4321/`, scroll `[data-showcase]` into view (block:'center'), wait 800ms, screenshot. Expected: both side cards legible (titles readable, no blur), noticeably dimmer/greyer than the center card. Hover a peek via `page.hover('.sc-slide.is-peek-next')` + screenshot: it brightens.

- [ ] **Step 4: Commit**

```bash
cd ~/projects/revaudio/revaudio-website && git add src/components/PluginShowcase.astro && git -c user.name=shlik -c user.email=hameatbach@gmail.com commit -m "Carousel: crisp de-blurred peeks (dim+desaturate)"
```

---

### Task 2: Brass-trimmed panel (card frame)

**Files:**
- Modify: `src/components/PluginShowcase.astro` (styles only: `.sc-slide` frame block ~lines 366–369, `.sc-slide:hover` rule ~line 390)

**Interfaces:**
- Consumes: nothing.
- Produces: `.sc-slide` uses a two-layer `background` (padding-box face + border-box brass gradient) with `border: 1px solid transparent`; a `.sc-slide::before` glow sits behind the shot region. The old `border-color` hover no longer exists.

- [ ] **Step 1: Replace the flat frame**

In `.sc-slide`, replace:

```css
    /* card frame — matches PluginCard store aesthetic */
    background: var(--bg-1);
    border: 1px solid var(--border-bright);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.55);
```

with:

```css
    /* card frame — machined-brass edge + faint textured face. Two-layer
       background: face gradient clipped to padding-box, brass gradient clipped
       to border-box showing through the transparent 1px border. Brighter at
       the top (light catch), darkening down. No extra DOM — bench coordinate
       space untouched. */
    border: 1px solid transparent;
    background:
      repeating-linear-gradient(115deg, rgba(255, 255, 255, 0.012) 0 2px, transparent 2px 6px) padding-box,
      linear-gradient(180deg, #17130d 0%, var(--bg-1) 42%, #0d0b08 100%) padding-box,
      linear-gradient(180deg, #d9b36a 0%, #8a6a33 28%, #453518 62%, #6e5527 100%) border-box;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.55);
  }
  /* Soft radial glow grounding the shot region (shot box sits at ~148–343px
     on the 470px stage). First in the tree → paints under every .sec. */
  .sc-slide::before {
    content: "";
    position: absolute;
    left: 30px;
    right: 30px;
    top: 130px;
    height: 240px;
    background: radial-gradient(ellipse 60% 55% at 50% 50%, rgba(255, 170, 60, 0.07), transparent 70%);
    pointer-events: none;
```

(The block above intentionally ends without its own closing brace — it reuses the existing `}` that closed `.sc-slide`, then opens `.sc-slide::before` which closes with the `}` already present on the next rule boundary. After the edit, run a quick sanity check that braces balance — the dev server will hard-error the component if not.)

- [ ] **Step 2: Replace the border-color hover**

The brass border-box gradient makes `border-color` inert. Replace:

```css
  .sc-slide:hover { border-color: var(--brass-dark); }
```

with:

```css
  /* border-color can't show through the border-box gradient — glow instead */
  .sc-slide.is-current:hover { box-shadow: 0 12px 48px rgba(0, 0, 0, 0.55), 0 0 20px rgba(255, 170, 60, 0.14); }
```

- [ ] **Step 3: Verify in the browser**

Same 1280×665 screenshot as Task 1. Expected: card edge reads as a warm brass line, brighter along the top edge; card face has a barely-visible diagonal texture; soft warm glow behind the plugin screenshot. Also check mobile 390×844 (flow layout keeps the same frame). Confirm no layout shift: title/shot positions identical to the Task 1 screenshot.

- [ ] **Step 4: Commit**

```bash
cd ~/projects/revaudio/revaudio-website && git add src/components/PluginShowcase.astro && git -c user.name=shlik -c user.email=hameatbach@gmail.com commit -m "Carousel: brass-trimmed card frame + shot glow"
```

---

### Task 3: Gear-shift snap (switch transition)

**Files:**
- Modify: `src/components/PluginShowcase.astro` (styles only: `.sc-slide` transition ~line 354)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing downstream depends on the timing values.

- [ ] **Step 1: Retune the transition**

Replace:

```css
    transition: transform 0.52s cubic-bezier(0.2, 0.72, 0.2, 1.06), opacity 0.42s ease, filter 0.42s ease, border-color 0.2s var(--ease);
```

with:

```css
    /* Gear-shift snap: fast slide with an overshoot-and-settle spring — the
       incoming card clunks into place. */
    transition: transform 0.4s cubic-bezier(0.34, 1.3, 0.35, 1), opacity 0.3s ease, filter 0.3s ease;
```

(`border-color` is dropped from the list — Task 2 removed the border-color hover.)

- [ ] **Step 2: Verify in the browser**

At 1280×665, click `.sc-next` and watch (or record 3 frames ~150ms apart via successive screenshots): the incoming card should visibly overshoot center slightly and settle. Emulate reduced motion (`page.emulateMedia({ reducedMotion: 'reduce' })`), click an arrow: states snap instantly, no tween.

- [ ] **Step 3: Commit**

```bash
cd ~/projects/revaudio/revaudio-website && git add src/components/PluginShowcase.astro && git -c user.name=shlik -c user.email=hameatbach@gmail.com commit -m "Carousel: gear-shift snap transition (0.4s overshoot spring)"
```

---

### Task 4: Alive arrows + one-time glint (adds the shared IntersectionObserver)

**Files:**
- Modify: `src/components/PluginShowcase.astro` (arrow CSS ~lines 509–516; script — inside the `[data-showcase]` forEach)

**Interfaces:**
- Consumes: nothing.
- Produces (Task 5 relies on these exact names, declared in the script's forEach scope):
  - `const reduced: boolean` — `prefers-reduced-motion` matchMedia result.
  - `let inView: boolean` — maintained by the observer.
  - `const onInView: Array<() => void>` — callbacks run on every intersect-enter (auto-advance hooks in here).
  - The `IntersectionObserver` observing `sc` at threshold 0.35.

- [ ] **Step 1: Brighten the resting arrows + add the glint animation**

Replace:

```css
  .sc-arrow :global(img) {
    width: 100%; height: auto; display: block;
    filter: grayscale(0.7) brightness(0.7);
    opacity: 0.4;
    transition: transform 0.15s var(--ease), filter 0.25s var(--ease), opacity 0.25s var(--ease);
  }
```

with:

```css
  .sc-arrow :global(img) {
    width: 100%; height: auto; display: block;
    filter: grayscale(0.3) brightness(0.7);
    opacity: 0.75;
    transition: transform 0.15s var(--ease), filter 0.25s var(--ease), opacity 0.25s var(--ease);
  }
  /* One glint sweep when the section first scrolls into view (class added by
     the observer in the script; animates filter/opacity only, so .sc-prev's
     scaleX(-1) base transform is unaffected). */
  .sc-arrow.is-glint :global(img) { animation: arrow-glint 0.9s ease 1; }
  @keyframes arrow-glint {
    0%, 100% { filter: grayscale(0.3) brightness(0.7); opacity: 0.75; }
    45% { filter: grayscale(0) brightness(0.85) drop-shadow(0 0 12px rgba(255, 160, 60, 0.55)); opacity: 1; }
  }
```

- [ ] **Step 2: Add the observer + glint to the script**

In the `<script>`, after the swipe block (after the `viewport.addEventListener('click', …, true);` line) and before the `fit()` block, insert:

```ts
    // ── shared in-view observer: one-time arrow glint now; auto-advance
    //    (Task 5) registers via onInView. ──
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let inView = false;
    const onInView: Array<() => void> = [];
    let glinted = false;
    const io = new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (!inView) return;
      if (!glinted && !reduced) {
        glinted = true;
        sc.querySelectorAll('.sc-arrow').forEach((a) => a.classList.add('is-glint'));
      }
      onInView.forEach((f) => f());
    }, { threshold: 0.35 });
    io.observe(sc);
```

- [ ] **Step 3: Verify in the browser**

Fresh navigate at 1280×665, scroll the carousel into view: arrows visible at rest (clearly present, warm-grey), and a single brightness/glow pulse fires once (~0.9s) — scroll away and back: no second glint. Reduced-motion emulation: no glint. Hover an arrow: full-colour hover state unchanged.

- [ ] **Step 4: Commit**

```bash
cd ~/projects/revaudio/revaudio-website && git add src/components/PluginShowcase.astro && git -c user.name=shlik -c user.email=hameatbach@gmail.com commit -m "Carousel: alive arrows + one-time glint on scroll-into-view"
```

---

### Task 5: Auto-advance

**Files:**
- Modify: `src/components/PluginShowcase.astro` (script only: `go()` signature ~line 225, interaction listeners ~lines 240–272, new auto block after the observer from Task 4)

**Interfaces:**
- Consumes: `reduced`, `inView`, `onInView` from Task 4 (exact names above).
- Produces: `go(target: number, announceChange?: boolean)` — default `true`; `killAuto(): void` called by every interaction handler.

- [ ] **Step 1: Give `go()` an announce flag**

Replace the `go` declaration line and its announcer line:

```ts
    const go = (target: number) => {
```

becomes:

```ts
    // announceChange=false for auto-advance — the aria-live region must not
    // narrate every 6 seconds at a screen-reader user.
    const go = (target: number, announceChange = true) => {
```

and

```ts
      if (announce) announce.textContent = slides[idx].getAttribute('aria-label') ?? '';
```

becomes:

```ts
      if (announceChange && announce) announce.textContent = slides[idx].getAttribute('aria-label') ?? '';
```

- [ ] **Step 2: Add the auto-advance block**

Immediately after the `io.observe(sc);` line from Task 4, insert:

```ts
    // ── auto-advance: 6s while in view; pause on hover; die permanently on
    //    first user interaction; never under reduced motion. ──
    let autoTimer: number | null = null;
    let autoDead = reduced;
    let hovering = false;
    const stopAuto = () => { if (autoTimer !== null) { clearInterval(autoTimer); autoTimer = null; } };
    const startAuto = () => {
      if (autoDead || !inView || hovering || autoTimer !== null) return;
      autoTimer = window.setInterval(() => {
        if (!inView || hovering) { stopAuto(); return; }
        go(idx + 1, false);
      }, 6000);
    };
    const killAuto = () => { autoDead = true; stopAuto(); };
    onInView.push(startAuto);
    sc.addEventListener('mouseenter', () => { hovering = true; stopAuto(); });
    sc.addEventListener('mouseleave', () => { hovering = false; startAuto(); });
```

Note: the observer callback from Task 4 only runs `onInView` on enter; on leave the interval self-clears on its next tick via the `!inView` guard.

- [ ] **Step 3: Kill auto on every interaction**

Update the five interaction sites to call `killAuto()` first:

```ts
    sc.querySelector('.sc-prev')?.addEventListener('click', () => { killAuto(); go(idx - 1); });
    sc.querySelector('.sc-next')?.addEventListener('click', () => { killAuto(); go(idx + 1); });
    dots.forEach((d, k) => d.addEventListener('click', () => { killAuto(); go(k); }));
```

In the peek-click handler, inside the `if`:

```ts
        if (s.classList.contains('is-peek-prev') || s.classList.contains('is-peek-next')) {
          e.preventDefault();
          killAuto();
          go(k);
        }
```

In the keydown handler:

```ts
      if (e.key === 'ArrowLeft') { killAuto(); go(idx - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { killAuto(); go(idx + 1); e.preventDefault(); }
```

In the pointerup handler:

```ts
        if (Math.abs(dx) > 40) { killAuto(); go(dx < 0 ? idx + 1 : idx - 1); }
```

`killAuto` is referenced by handlers registered earlier in source than its declaration — that's fine (they only fire after the whole block has run), but keep all of this inside the same forEach scope.

- [ ] **Step 4: Verify in the browser**

At 1280×665 with the carousel in view: wait ~13s → the current slide has advanced twice; the `[data-carousel-announce]` div's textContent is still empty (`page.evaluate` it). Hover the carousel, wait 7s → no advance. Un-hover, wait 7s → advances. Click `.sc-next` once, wait 13s → no further advance (permanent kill). Reduced-motion emulation + reload: wait 8s → no advance. Scroll to top of page, wait 8s → no advance while out of view.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/revaudio/revaudio-website && git add src/components/PluginShowcase.astro && git -c user.name=shlik -c user.email=hameatbach@gmail.com commit -m "Carousel: 6s auto-advance (in-view only, hover pause, dies on interaction)"
```

---

### Task 6: Height-aware fit

**Files:**
- Modify: `src/components/PluginShowcase.astro` (script only: `fit()` ~lines 276–290)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing downstream.

- [ ] **Step 1: Cap the scale by available height**

Replace the body of `fit()`:

```ts
      showcase.style.transform = 'none';
      const iw = showcase.offsetWidth;
      const ih = showcase.offsetHeight;
      const avail = sc.clientWidth;
      const s = Math.min(1, avail / iw);
```

with:

```ts
      showcase.style.transform = 'none';
      const iw = showcase.offsetWidth;
      const ih = showcase.offsetHeight;
      const availW = sc.clientWidth;
      // Height cap: full card + dots should fit the viewport under the sticky
      // header (measured) with a fixed allowance for the dots row + breathing
      // room. Floored at 0.7 — below that legibility loses to just scrolling.
      // The floor applies to the HEIGHT cap only; the width cap stays exact so
      // narrow-but-tall windows never overflow horizontally.
      const headerH = document.querySelector('header')?.getBoundingClientRect().height ?? 64;
      const availH = window.innerHeight - headerH - 110;
      const s = Math.min(1, availW / iw, Math.max(0.7, availH / ih));
```

(The lines after — `showcase.style.transform = \`scale(${s})\`;` etc. — stay as they are.)

- [ ] **Step 2: Verify in the browser**

At 1280×665, scroll so the "Our Plugins" heading tops the viewport: the FULL card (through "More Details") **and the dots row** are on screen simultaneously. `page.evaluate` the computed scale (`document.querySelector('.showcase').style.transform`) — expect roughly `scale(0.85–0.95)`, not 1. At 1280×900: scale returns to 1 (unchanged from before). At 700×500 (extreme): scale bottoms out at the width cap or 0.7 height floor, no horizontal overflow (`document.documentElement.scrollWidth <= 700`). Mobile 390×844: flow layout untouched, `transform: none`.

- [ ] **Step 3: Commit**

```bash
cd ~/projects/revaudio/revaudio-website && git add src/components/PluginShowcase.astro && git -c user.name=shlik -c user.email=hameatbach@gmail.com commit -m "Carousel: height-aware fit — full card + dots on short laptop screens"
```

---

### Task 7: Full verification matrix

**Files:**
- None modified (verification only; fix-forward in `PluginShowcase.astro` if a check fails, amend into a `Carousel: polish fixups` commit).

**Interfaces:** consumes everything above.

- [ ] **Step 1: Desktop 1280×665 sweep**

Fresh navigate. Check in order: (a) full card + dots in view with heading; (b) peeks crisp + dim; (c) brass frame + glow render; (d) arrow glint fires once; (e) auto-advance cycles all 5 slides (wait ~32s, confirm wrap Radio Roulette → RevLimiter is seamless); (f) click a peek → it centers AND auto-advance stays dead; (g) GAS badge + contained portrait shot still render correctly inside the new frame; (h) coming-soon plates (Drift, The AC) still float frameless — the new `::before` glow must not clash (visual check).

- [ ] **Step 2: Mobile 390×844 sweep**

Flow layout: card full-width, no absolute positioning, frame renders, swipe changes slide and kills auto, dots work.

- [ ] **Step 3: Reduced-motion sweep**

`page.emulateMedia({ reducedMotion: 'reduce' })` + reload: no auto-advance (wait 8s), no glint, arrow clicks snap instantly, peeks still dim (saturate/brightness present).

- [ ] **Step 4: A11y + console check**

Keyboard ArrowLeft/Right on the focused section still navigate + announce (textContent updates on MANUAL change only). Browser console: zero new errors/warnings from the component.

- [ ] **Step 5: Report to Dan**

Screenshots (before was captured as `~/carousel-current.jpeg`) + summary. **Do not push** — Dan decides when it goes live.

---

## Self-Review (done at write time)

- **Spec coverage:** spec §1→Task 1, §2→Task 2, §3→Task 4, §4→Task 3, §5→Task 5, §6→Task 6, testing§→Task 7 + per-task verifies. No gaps.
- **Placeholders:** none — every code step shows exact before/after.
- **Type consistency:** `reduced`/`inView`/`onInView` (Task 4) match Task 5's consumption; `go(target, announceChange)` consistent across Tasks 5 call sites; `killAuto` name consistent.
