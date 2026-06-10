# Website handoff

Updated: 2026-06-10 (laptop 2 session close)

## Shipped today (all live on revaudio.net)
- **Scroll-scrub background system**: fixed `.page-bg` layer behind everything, brass dashboard art
  (`public/bg/aurora-test.webp`, 2048x6144, 106KB) sweeps top-to-bottom with page scroll.
  Logic in `src/lib/pagebg.ts`, wired in BaseLayout. Art width 90vw, side-fade via `.page-bg::after`.
- **Fluid layout**: `--maxw: min(1240px, 98vw)` (was fixed 1200px), nav follows.
- **Hero tuning**: gauge column `min(38vw, 520px)`; redline/lede/cta offsets via
  `--redline-x/--lede-x/--cta-x` defaults (198/92/218px) in index.astro.
- **Plugin section**: heading centered above card, card 730px, status label removed from PluginCard
  ("Checkout reopening soon" no longer shows on cards; product-page pill untouched).
- **Sections**: DAW strip tightened (2.5rem pad, 1.25rem gap, 1.05rem chips); newsletter 6rem pad,
  150px button, **fully transparent** (sits on bg art); footer 1.25/1.75rem.
- **New pages/nav**: `/terms` T&C page (14 sections, industry standard); nav = Home/Store/About/Support/T&C.

## Benches (the big workflow win)
`public/bench/home-bench.html` — master bench, live on prod too. Every homepage section has
sliders (bg width, hero, page frame, plugin, DAW, testimonials, press, newsletter, footer up/down).
User tunes on THEIR screen, hits COPY VALUES FOR CLAUDE, pastes; Claude bakes values into source
and syncs bench defaults. Also: `layout-bench.html`, `hero-bench.html` (superseded by home-bench).
**Bench defaults must stay synced with shipped CSS** — RESET ALL = production state.

## Open threads
- `aurora-test.webp` is the FINAL art for now but still has the test name — rename when user locks art direction.
- Newsletter/Formspree + Paddle checkout still on placeholder tokens (site.ts / plugins.ts).
- Background asset pipeline: ChatGPT art -> Real-ESRGAN 4x (C:\RevAudio\shared\tools\realesrgan) -> sharp resize 2048w -> webp q84.
- User laptop renders at 1280x665 CSS (sometimes dpr 2) — Playwright-test at 1280x665 FIRST.

## Don't touch
- DSP/plugin repos unaffected. Partner's motion system (lib/motion, reveal, scrub, splittext, walkthrough) untouched except pagebg addition.
