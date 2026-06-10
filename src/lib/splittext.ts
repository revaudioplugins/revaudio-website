/* Headline word-splitting (motion plan step 4 — Larose technique 5).
   Any element with data-split gets its words masked and risen from below on
   viewport entry (80ms stagger, expo.out — bible text-reveal timing), then the
   split is fully reverted so the DOM ends exactly as authored: no resize
   re-flow bugs, nothing left for screen readers to trip on (SplitText's
   aria:"auto" covers the brief animated window).
   Headlines only — never paragraphs (a11y + cost). Reduced motion / no-JS:
   nothing splits, text is static. Waits for fonts so word boxes are measured
   against the real display face, not the fallback. */
import { gsap, ScrollTrigger, reducedMotion } from './motion';
import { SplitText } from 'gsap/SplitText';

export async function initSplitHeadlines(): Promise<void> {
  if (reducedMotion()) return;
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-split]'));
  if (!els.length) return;

  gsap.registerPlugin(SplitText);
  await document.fonts.ready;

  els.forEach((el) => {
    const split = SplitText.create(el, { type: 'words', mask: 'words', aria: 'auto' });
    gsap.fromTo(
      split.words,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 0.6,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        onComplete: () => split.revert(),
      },
    );
  });
}
