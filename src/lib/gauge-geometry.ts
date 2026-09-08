/* The hero gauge's needle/hub geometry — the ONE definition, imported by
   everything that draws the dial: src/pages/index.astro (ships) and the
   local-only benches src/pages/herolab.astro and src/pages/balancelab.astro.

   This module exists because these numbers used to be copy-pasted into all
   three files. On 2026-09-07 the benches were found two generations stale —
   still on the original 50/50 pivot and the plugin's wider hub box — so they
   were quietly lying about where the needle sits, which is the one thing a
   composition bench is for. Import from here; never re-type the constants.

   PIVOT is the centre of the cap's RIM CIRCLE on the plate, least-squares fitted
   by design-assets/instagram/revaudio-gauge/cut-hub.py, which prints both PIVOT
   and HW ready to paste. It is NOT 50/50 — the Higgsfield plate puts the cap off
   the bezel centre, so a needle spun about the geometric centre visibly orbits.
   And it is NOT the cap's bright-pixel centroid either: a lit dome is brightest
   toward the lamp, so that centroid sits ~1/4 radius up-left of the machined
   centre-mark — 9 css px at a 640px dial, which is exactly the "needle pivots
   beside the button" fault this replaced. Re-run cut-hub.py for any new plate.

   Everything below is a % of the SQUARE dial box, so it scales with the dial at
   any size. Both benches and the hero rely on that — do not introduce px here. */

/** Centre of the cap's fitted rim circle, as % of the dial box. */
export const PIVOT = { x: 49.9, y: 51.055 };

/** Needle image: 40% of the dial wide, pivoting at 49.877%/83.32% of its own box
    (the plugin's 406-viewBox <image> x122 y67.69 w162.4). */
export const NW = 40;
export const NOX = 0.49877;
export const NOY = 0.8332;

/** Hub overlay width, as % of the dial box. This is the cut's own box — the
    fitted rim plus a 3px feather — NOT the plugin's 45.5/406 hub box, which was
    a third wider than the cap and laid opaque face pixels over the needle root. */
export const HW = 9.974;

/** Needle wrapper: absolute left/top/width plus its transform-origin. */
export const N = {
  left: `${(PIVOT.x - NW * NOX).toFixed(3)}%`,
  top: `${(PIVOT.y - NW * NOY).toFixed(3)}%`,
  w: `${NW}%`,
  ox: `${(NOX * 100).toFixed(3)}%`,
  oy: `${(NOY * 100).toFixed(2)}%`,
};

/** Hub overlay: absolute left/top/width, centred on the same pivot. */
export const H = {
  left: `${(PIVOT.x - HW / 2).toFixed(3)}%`,
  top: `${(PIVOT.y - HW / 2).toFixed(3)}%`,
  w: `${HW}%`,
};
