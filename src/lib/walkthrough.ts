/* Sticky feature walkthrough (motion plan step 3 + the part-highlighter
   extension, docs/revlimiter-whats-inside-handoff.md). The stage column pins
   via CSS position:sticky — JS here only tracks which copy step is in the
   middle of the viewport, highlights it, and either:
     - crossfades the stage to that step's shot (legacy `[data-walk-shot]`
       path, still the fallback for plugins without a `stage`), or
     - (new) drives a dim mask + brass highlight box onto the matching region
       of a single screenshot, when the section renders in
       `data-walk-mode="stage"`. The screenshot itself never transforms —
       no zoom, no pan — only the box animates left/top/width/height/autoAlpha.
   Reduced motion / no JS: CSS keeps every step fully visible, undimmed, with
   no box, since this function simply never runs. */
import { gsap, ScrollTrigger, reducedMotion } from './motion';

type PartRect = { x: number; y: number; w: number; h: number };

export function initWalkthrough(): void {
  if (reducedMotion()) return;

  document.querySelectorAll<HTMLElement>('[data-walkthrough]').forEach((root) => {
    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-walk-step]'));
    const shots = Array.from(root.querySelectorAll<HTMLElement>('[data-walk-shot]'));
    if (!steps.length) return;

    const isStageMode = root.dataset.walkMode === 'stage';
    const grid = root.querySelector<HTMLElement>('.walk-grid');
    const parts: Record<string, PartRect> | null =
      isStageMode && grid?.dataset.stageParts ? JSON.parse(grid.dataset.stageParts) : null;

    const boxEl = root.querySelector<HTMLElement>('[data-walk-box]');

    const hideStageOverlay = (): void => {
      if (boxEl) gsap.to(boxEl, { autoAlpha: 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    };

    const showStagePart = (rect: PartRect): void => {
      if (!boxEl) return;
      gsap.to(boxEl, {
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.w}%`,
        height: `${rect.h}%`,
        autoAlpha: 1,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    let activeIdx = 0;
    const setActive = (idx: number): void => {
      activeIdx = idx;
      steps.forEach((s, i) => s.classList.toggle('active', i === idx));

      if (isStageMode && parts) {
        const slug = steps[idx].dataset.part;
        const rect = slug ? parts[slug] : undefined;
        const isDesktop = window.matchMedia('(min-width: 901px)').matches;
        if (rect && isDesktop) showStagePart(rect);
        else hideStageOverlay();
        return;
      }

      if (shots.length > 1) {
        const shotIdx = Math.min(Number(steps[idx].dataset.shot) || 0, shots.length - 1);
        shots.forEach((sh, i) => {
          // Base shot (i === 0) stays at opacity 1 underneath; overlays fade.
          if (i === 0) return;
          gsap.to(sh, { opacity: i === shotIdx ? 1 : 0, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
        });
      }
    };
    setActive(0);

    steps.forEach((step, i) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) setActive(i);
        },
      });
    });

    /* Gentle scrubbed drift on the pinned frame — breath, not parallax-show.
       Transform lives on the frame (child), never the sticky element. */
    const stage = root.querySelector('[data-walk-stage]');
    if (stage) {
      gsap.fromTo(
        stage,
        { y: 12 },
        {
          y: -12,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    }

    if (!isStageMode || !parts) return;

    // Disable the box under 900px: the stage un-pins and stacks above the
    // copy there, so a glowing part scrolls off-screen before the reader
    // reaches later steps (see Mobile section of the handoff). The per-step
    // static crop thumbnail (rendered server-side, CSS-only) carries that
    // information instead; re-evaluate on breakpoint crossing.
    const mq = window.matchMedia('(min-width: 901px)');
    const onBreakpoint = () => {
      if (!mq.matches) hideStageOverlay();
      else setActive(activeIdx);
    };
    mq.addEventListener('change', onBreakpoint);

    // The base shot loads lazily; ScrollTrigger measured the section before
    // it had real height, so refresh once it's actually in the DOM/painted.
    const img = root.querySelector<HTMLImageElement>('.stage-frame .walk-shot.base');
    if (img && !img.complete) {
      img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    }
  });
}
