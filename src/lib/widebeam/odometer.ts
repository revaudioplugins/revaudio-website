/** /widebeam odometers (lane A): the spec numbers roll up when they come into view. */
import { gsap } from '../motion';

export function initOdometer(page: HTMLElement, reduced: boolean) {
  // ── odometer spec numbers roll up when they come into view ──
  page.querySelectorAll<HTMLElement>('[data-odo]').forEach((el) => {
    const end = Number(el.dataset.odo), dec = Number(el.dataset.dec || 0);
    if (reduced) { el.textContent = end.toFixed(dec); return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true }, onUpdate: () => { el.textContent = o.v.toFixed(dec); } });
  });
}
