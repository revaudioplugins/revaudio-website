/**
 * The projector page's bottom edge (the old furniture.ts stack, without the SOUND key and the phone bar): while the
 * cookie banner is up its measured height is --wbp-lift on <html>, else 0. Section 1's glass card on a phone and the
 * cart FAB ride it (projector/s1.css, projector/page.css), so the gate is never under the banner. The lift drops only
 * after the banner's own .4 s slide-out, so nothing dips under it on the way out.
 * Where the banner would still cover the card's consent line (and its Privacy link: the basis for marketing:true) —
 * Safari at 115 % (1141x636), a short phone — the name and the card ride up just enough to clear it (--wbp-s1-up, never
 * above the band's top), and settle back when the banner goes.
 * A first visit (no choice stored) gets its banner from CookieBanner.astro at 800 ms, after the card's rise: its height
 * is taken at boot and the lift set then, so the card rises straight into its lifted place instead of jumping after.
 */
const CONSENT_KEY = 'ra-cookie-consent'; // CookieBanner.astro

export function initLift(reduced: boolean, s1: HTMLElement | null) {
  const html = document.documentElement;
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  const inner = s1?.querySelector<HTMLElement>('.wbp-s1-in');
  const lock = s1?.querySelector<HTMLElement>('.wbp-lock');
  const line = s1?.querySelector<HTMLElement>('.wbp-plate--glass .wbp-consent');
  const clear = (h: number) => {
    if (!s1 || !inner || !lock || !line) return;
    let up = 0;
    if (h) {
      // from the layout boxes (offsetTop): the rise's transform does not count; the shift (a relative top on .wbp-s1-in,
      // read as it is right now, mid-transition included) is taken back out. Page coordinates, the first view.
      const shift = parseFloat(getComputedStyle(inner).top) || 0;
      const y = (el: HTMLElement) => {
        let t = -shift;
        for (let e: HTMLElement | null = el; e && e !== s1; e = e.offsetParent as HTMLElement | null) t += e.offsetTop;
        return t;
      };
      const top = s1.getBoundingClientRect().top + scrollY;
      const need = top + y(line) + line.offsetHeight - (innerHeight - h - 10);
      up = Math.max(0, Math.min(need, y(lock) - 12));
    }
    s1.style.setProperty('--wbp-s1-up', Math.round(up) + 'px');
  };
  let up = false, off = 0, early = 0;
  const set = (h: number) => {
    h = Math.min(h, Math.max(0, innerHeight - 120));
    html.style.setProperty('--wbp-lift', h + 'px');
    clear(h);
  };
  const read = () => {
    const now = banner.classList.contains('cb--visible') && !banner.hidden;
    if (early) { if (!now) return; clearTimeout(early); early = 0; } // the boot preset holds until the banner is up
    clearTimeout(off);
    if (!now && up) off = window.setTimeout(() => { up = false; set(0); }, reduced ? 0 : 420);
    else { up = now; set(now ? banner.offsetHeight : 0); }
  };
  let stored = '';
  try { stored = localStorage.getItem(CONSENT_KEY) || ''; } catch { /* the banner shows then too */ }
  if (banner.hidden && stored !== 'accepted' && stored !== 'declined') {
    const preset = () => {
      if (!banner.hidden) return;
      // unhidden for one synchronous read: it sits below the screen (translateY 100 %) and is never painted
      banner.hidden = false;
      const h = banner.offsetHeight;
      banner.hidden = true;
      if (inner) inner.style.transition = 'none';
      set(h);
      if (inner) { void getComputedStyle(inner).top; inner.style.transition = ''; }
    };
    up = true;
    preset();
    // a cold load can boot before the faces are in (the consent line, the banner's own text wrapped in a fallback):
    // measured again with the swap itself, not later when the banner comes
    document.fonts?.ready.then(() => { if (early) preset(); });
    early = window.setTimeout(() => { early = 0; read(); }, 3000); // a banner that never comes lets it go
  }
  new MutationObserver(read).observe(banner, { attributes: true, attributeFilter: ['class', 'hidden'] });
  new ResizeObserver(read).observe(banner, { box: 'border-box' }); // its padding holds the safe-area inset
  addEventListener('resize', read); // a window that gets shorter or taller with the banner up
  read();
}
