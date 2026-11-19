/**
 * /widebeam odometer (lane A, A.4; art-09, motion-11, a11y-12): the real numbers are the HTML ([data-odo], read by a
 * screen reader and shown with no JS); the drums beside them (aria-hidden) are the mechanism. The server renders
 * each drum at its own digit (--d). If the odometer is still below the screen at boot, its drums are set back to 0
 * there, out of sight, and roll once when it comes into view: a full turn plus the digit, the last drum landing last
 * with a small settle. Seen at boot (a deep link), above the screen, or under reduced motion: it just shows the number.
 * Nothing ever writes the number itself, so it never flicks to 0.
 */
export function initOdometer(page: HTMLElement, reduced: boolean) {
  const odo = page.querySelector<HTMLElement>('.wb-odo');
  if (!odo || reduced || !('IntersectionObserver' in window)) return;
  if (odo.getBoundingClientRect().top < innerHeight) return; // on screen or above it: leave the real digits
  const drums = [...odo.querySelectorAll<HTMLElement>('.wb-odo-drum')];
  const strip = (d: HTMLElement) => d.firstElementChild as HTMLElement | null;
  drums.forEach((d) => { const s = strip(d); if (s) { s.style.transition = 'none'; s.style.setProperty('--d', '0'); } });
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    drums.forEach((d, i) => {
      const s = strip(d);
      if (!s) return;
      const to = 10 + Number(d.dataset.d || 0); // one full turn, then the digit (the strip holds 0-9 twice)
      s.style.transition = `transform ${1.5 + i * 0.12}s cubic-bezier(.22, 1, .36, 1) ${i * 0.07}s`;
      s.style.setProperty('--d', String(to));
    });
  }, { threshold: 0.6 });
  io.observe(odo);
}
