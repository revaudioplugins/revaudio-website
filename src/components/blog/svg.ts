// Tiny helpers for the blog's build-time SVG figures.

export type Pt = [number, number];

/** Polyline path ("M x y L x y ...") from points already in SVG units. */
export function linePath(pts: Pt[]): string {
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

/** Linear map from a data range onto an SVG range. */
export function scale(d0: number, d1: number, r0: number, r1: number) {
  return (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

export const dB = (g: number) => 20 * Math.log10(g);

/** Fixed-point number with a real minus sign for figure labels. */
export const num = (v: number, digits = 1) => v.toFixed(digits).replace('-', '−');
