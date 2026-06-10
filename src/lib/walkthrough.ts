/* Sticky feature walkthrough (motion plan step 3). The stage column pins via
   CSS position:sticky — JS here only tracks which copy step is in the middle
   of the viewport, highlights it, and crossfades the stage to that step's
   shot (data-shot → [data-walk-shot] index). With a single shot the crossfade
   is a no-op and the stage simply pins.
   Reduced motion / no JS: CSS keeps every step fully visible; shot 0 shows. */
import { gsap, ScrollTrigger, reducedMotion } from './motion';

export function initWalkthrough(): void {
  if (reducedMotion()) return;

  document.querySelectorAll<HTMLElement>('[data-walkthrough]').forEach((root) => {
    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-walk-step]'));
    const shots = Array.from(root.querySelectorAll<HTMLElement>('[data-walk-shot]'));
    if (!steps.length) return;

    const setActive = (idx: number): void => {
      steps.forEach((s, i) => s.classList.toggle('active', i === idx));
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
  });
}
