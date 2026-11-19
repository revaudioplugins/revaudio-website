/**
 * The hero's road after the intro is the video's own last frame with the car painted out (assets/widebeam/
 * intro-end.jpg), so the scene never changes look. This transparent canvas over it does one thing: it takes the
 * departing car's tail lights over from the film's last frame and eases them into the vanishing point (the master's
 * x 965, y 690 on 1920x1080), mapped the way object-fit: cover maps the playing file at any screen shape.
 *
 * The hand-off (motion-05, plan H.3, one mover): the canvas starts with the film's own lamps, two bars (about 26 x 4
 * master px at 943 / 996, y 699 on the last frame), drawn right over them while the film dissolves (.3 s, hero.css).
 * In that same .3 s the bars dissolve into two points on the spot; only then do the points move, so the car's body
 * never fades in place while a second pair of lights slides out of it.
 */
import type { Frame } from './intro';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const DISSOLVE = 300; // ms: bars -> points, nothing moves
const TRAVEL = 2600; // ms: the points ease to the vanishing point
const BAR_W = 26, BAR_H = 4; // master px

export function startNight(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, dpr = 1, raf = 0;
  let tail: { x: number; y: number; sep: number; frame: Frame; t0: number } | null = null;
  // the part of the master the playing file shows (x, y, w, h), placed on this canvas as object-fit: cover places it
  const cover = (f: Frame) => {
    const k = Math.max(W / f[2], H / f[3]);
    const ox = (W - f[2] * k) / 2 - f[0] * k, oy = (H - f[3] * k) / 2 - f[1] * k;
    return (x: number, y: number) => [ox + x * k, oy + y * k, k] as const;
  };

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  // a red lamp as a round point: the radial glow the tail lights travel as
  const point = (cx: number, cy: number, r: number, a: number) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 5);
    g.addColorStop(0, `rgba(255,90,70,${a})`); g.addColorStop(0.25, `rgba(230,30,24,${0.6 * a})`); g.addColorStop(1, 'rgba(200,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - r * 5, cy - r * 5, r * 10, r * 10);
  };
  // a red lamp as the film draws it: a hot bar with a red bloom
  const bar = (cx: number, cy: number, w: number, h: number, a: number) => {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = 'rgba(255,36,24,.9)'; ctx.shadowBlur = Math.max(4, h * 2.5);
    ctx.fillStyle = 'rgba(255,70,52,1)';
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,214,200,.85)';
    ctx.fillRect(cx - w / 2 + h * 0.4, cy - h * 0.2, w - h * 0.8, h * 0.4);
    ctx.restore();
  };

  function draw() {
    raf = 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!tail) return;
    const map = cover(tail.frame);
    const [x0, y0, k] = map(tail.x, tail.y), [vx, hz] = map(965, 690);
    const sep0 = tail.sep * k, r0 = Math.max(1, sep0 / 9);
    const el = performance.now() - tail.t0;
    ctx.globalCompositeOperation = 'lighter';
    if (el < DISSOLVE) {
      // the film's bars dissolve into points where they stand
      const m = el / DISSOLVE, e = m * m * (3 - 2 * m);
      for (const sg of [-1, 1]) {
        const cx = x0 + (sg * sep0) / 2;
        bar(cx, y0, BAR_W * k, Math.max(1.5, BAR_H * k), 1 - e);
        point(cx, y0, r0, e);
      }
    } else {
      const p = clamp((el - DISSOLVE) / TRAVEL, 0, 1), e = 1 - Math.pow(1 - p, 2.2);
      const x = x0 + (vx - x0) * e, y = y0 + (hz + 1 - y0) * e;
      const sep = sep0 * Math.pow(1 - e, 1.4) + 1, a = p < 0.65 ? 1 : 1 - (p - 0.65) / 0.35;
      const r = Math.max(1, r0 * Math.pow(1 - e, 1.2));
      for (const sg of [-1, 1]) point(x + (sg * sep) / 2, y, r, a);
      if (p >= 1) tail = null;
    }
    ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(draw);
  }

  return {
    /** take over the departing car at master pixel (x, y), its two lamps `sep` master px apart, from the file showing `frame` */
    tailLights(x: number, y: number, sep: number, frame: Frame = [0, 0, 1920, 1080]) {
      tail = { x, y, sep, frame, t0: performance.now() };
      if (!raf) raf = requestAnimationFrame(draw);
    },
  };
}
