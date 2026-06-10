/* TEST — long-image page background scrub. A fixed .page-bg layer behind all
   content; its background-position Y maps full-document scroll 0→1 onto the
   tall image 0%→100%, so scrolling the page "swipes" through the artwork.
   Reduced motion / no-JS: static top slice. Remove or productionise after the
   look is approved. */
import { gsap, reducedMotion } from './motion';

export function initPageBg(): void {
  const el = document.querySelector<HTMLElement>('.page-bg');
  if (!el || reducedMotion()) return;

  gsap.fromTo(
    el,
    { backgroundPosition: '50% 0%' },
    {
      backgroundPosition: '50% 100%',
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true,
      },
    },
  );
}
