/* Viewport-entrance reveals (motion plan step 2). Declarative via data attrs:
     data-reveal            — single element; values: "" (default) | "card" | "fade"
     data-reveal-accent     — child of a [data-reveal]; pops 120ms after it settles
     data-reveal-group      — container; staggers its [data-reveal-item] children
     data-stagger           — per-group override, seconds (default STAGGER)
   Pre-hide lives in global.css under html.motion-ok, set by an inline head
   script only when JS runs AND prefers-reduced-motion is not reduce — so
   no-JS / reduced-motion users always get static, fully visible content. */
import { gsap, reducedMotion, DUR_IN, STAGGER, EASE_REVEAL, EASE_ACCENT } from './motion';

/* Entries animate scale+opacity together, anchored bottom-centre. "fade" is
   opacity+drift only — for logo rows, where scaling reads as distortion. */
const VARIANTS: Record<string, gsap.TweenVars> = {
  default: { y: 24, scale: 0.97, opacity: 0 },
  card: { y: 32, scale: 0.92, opacity: 0 },
  fade: { y: 12, opacity: 0 },
};

const TRIGGER_START = 'top 80%';

/* Safety net: the pre-hide (opacity:0) and gsap's `from` state gate content on
   ScrollTrigger firing. If it never does — an observer/scroll misfire, a hidden
   ancestor at init, a bfcache restore mid-hide — gated sections would stay
   invisible forever. Force-reveal anything still hidden: clear gsap's inline
   styles and add .revealed (drops the CSS pre-hide). Skips already-revealed
   elements, so an in-flight or completed entrance is never disturbed. */
function forceRevealAll(): void {
  const stuck = document.querySelectorAll<HTMLElement>(
    '[data-reveal]:not(.revealed), [data-reveal-item]:not(.revealed)',
  );
  stuck.forEach((el) => {
    gsap.killTweensOf(el);
    gsap.set(el, { clearProps: 'all' });
    el.classList.add('revealed');
  });
  // Accents ride their parent's timeline; if it never ran they're still at 0.
  document.querySelectorAll<HTMLElement>('[data-reveal-accent]').forEach((a) => {
    gsap.set(a, { clearProps: 'all' });
  });
}

const REVEAL_FALLBACK_MS = 2500;

/* CSS hover transitions fight gsap's per-frame style writes — park them for
   the duration of the entrance, restore after. */
function freezeTransitions(els: Element[]): void {
  els.forEach((el) => ((el as HTMLElement).style.transition = 'none'));
}
function thawTransitions(els: Element[]): void {
  els.forEach((el) => ((el as HTMLElement).style.transition = ''));
}

export function initReveals(): void {
  if (reducedMotion()) return;

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const variant = VARIANTS[el.dataset.reveal || 'default'] ?? VARIANTS.default;
    const accents = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal-accent]'));
    if (accents.length) gsap.set(accents, { opacity: 0 }); // no flash before their beat

    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: TRIGGER_START, once: true },
      onStart: () => {
        el.classList.add('revealed');
        freezeTransitions([el, ...accents]);
      },
      onComplete: () => thawTransitions([el, ...accents]),
    });
    tl.fromTo(
      el,
      { ...variant, transformOrigin: '50% 100%' },
      { y: 0, scale: 1, opacity: 1, duration: DUR_IN, ease: EASE_REVEAL, clearProps: 'transform' },
    );
    if (accents.length) {
      tl.fromTo(
        accents,
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, ease: EASE_ACCENT, stagger: 0.08, clearProps: 'transform' },
        '+=0.12',
      );
    }
  });

  document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
    const items = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal-item]'));
    if (!items.length) return;
    const variant = VARIANTS[group.dataset.revealGroup || 'default'] ?? VARIANTS.default;
    const stagger = parseFloat(group.dataset.stagger || '') || STAGGER;

    gsap.fromTo(
      items,
      { ...variant, transformOrigin: '50% 100%' },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: DUR_IN,
        ease: EASE_REVEAL,
        stagger,
        clearProps: 'transform',
        scrollTrigger: { trigger: group, start: TRIGGER_START, once: true },
        onStart: () => {
          items.forEach((i) => i.classList.add('revealed'));
          freezeTransitions(items);
        },
        onComplete: () => thawTransitions(items),
      },
    );
  });

  // If ScrollTrigger hasn't revealed everything by now, something misfired —
  // reveal whatever is still gated so no section is ever stranded at opacity:0.
  window.setTimeout(forceRevealAll, REVEAL_FALLBACK_MS);
  // bfcache restores the DOM as-is: a page frozen mid-hide comes back hidden.
  window.addEventListener('pageshow', (e) => {
    if ((e as PageTransitionEvent).persisted) forceRevealAll();
  });
}
