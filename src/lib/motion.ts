/* Motion foundation — Lenis smooth scroll wired to GSAP ScrollTrigger, plus the
   shared timing/easing tokens every animation on the site must use.
   Spec: docs/motion-plan.md. Physics values follow the Sam John style bible
   (entry slower than exit, overshoot ≤ 8%, stagger ≥ 50ms). */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register at module scope so any script importing from here can use
// ScrollTrigger regardless of execution order relative to initMotion().
gsap.registerPlugin(ScrollTrigger);

/* Tokens (seconds — GSAP units). CSS mirrors live in global.css :root. */
export const DUR_IN = 0.6;
export const DUR_OUT = 0.3;
export const STAGGER = 0.09;
export const EASE_REVEAL = 'expo.out'; // viewport entrances
export const EASE_ACCENT = 'back.out(1.05)'; // badges/accents — ~5% overshoot
export const EASE_SCRUB = 'none'; // scrubbed tweens: the scroll IS the easing
export const DUR_ANCHOR = 0.7; // in-page anchor jumps (Lenis, seconds)

export const reducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export let lenis: Lenis | null = null;

/* Idempotent. Called once per page from BaseLayout. Under reduced motion this
   registers GSAP (so later code can no-op cleanly) but starts no smoothing —
   native scroll only, and every effect must also check reducedMotion() itself. */
export function initMotion(): void {
  if (reducedMotion() || lenis) return;

  /* Anchor jumps get an explicit duration/easing. Lenis's default is 1.2s of
     `1.001 - 2^(-10t)`, which asymptotes: it covers ~78% of the distance in the
     first 250ms and then crawls the remaining 22% for a further second, so the
     page reads as arrived-but-still-creeping. easeOutQuart keeps the fast-out
     character of EASE_REVEAL but actually terminates. */
  lenis = new Lenis({
    anchors: { duration: DUR_ANCHOR, easing: (t: number) => 1 - Math.pow(1 - t, 4) },
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export { gsap, ScrollTrigger };
