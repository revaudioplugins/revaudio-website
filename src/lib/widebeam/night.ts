/**
 * The hero's road after the intro is the video's own last frame with the car painted out (assets/widebeam/
 * intro-end.jpg), so the scene never changes look. This transparent canvas over it does one thing: it takes the
 * departing car over from the video's last frame and eases its tail lights into the vanishing point (the video's
 * x 965, y 690 on 1920×1080), mapped the way object-fit: cover maps the video and the still, at any screen shape.
 */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function startNight(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, dpr = 1, raf = 0;
  let tail: { x: number; y: number; sep: number; t0: number } | null = null;
  // a 1920×1080 frame as object-fit: cover places it on this canvas
  const cover = () => { const k = Math.max(W / 1920, H / 1080); return { k, ox: (W - 1920 * k) / 2, oy: (H - 1080 * k) / 2 }; };

  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  function frame() {
    raf = 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!tail) return;
    const cv = cover(), vx = cv.ox + 965 * cv.k, hz = cv.oy + 690 * cv.k;
    const p = clamp((performance.now() - tail.t0) / 2600, 0, 1), e = 1 - Math.pow(1 - p, 2.2);
    const x = tail.x + (vx - tail.x) * e, y = tail.y + (hz + 1 - tail.y) * e;
    const sep = tail.sep * Math.pow(1 - e, 1.4) + 1, a = p < 0.65 ? 1 : 1 - (p - 0.65) / 0.35;
    const r = Math.max(1, (tail.sep / 9) * Math.pow(1 - e, 1.2));
    ctx.globalCompositeOperation = 'lighter';
    for (const sg of [-1, 1]) {
      const cx = x + (sg * sep) / 2, g = ctx.createRadialGradient(cx, y, 0, cx, y, r * 5);
      g.addColorStop(0, `rgba(255,90,70,${a})`); g.addColorStop(0.25, `rgba(230,30,24,${0.6 * a})`); g.addColorStop(1, 'rgba(200,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - r * 5, y - r * 5, r * 10, r * 10);
    }
    ctx.globalCompositeOperation = 'source-over';
    if (p >= 1) tail = null;
    raf = requestAnimationFrame(frame);
  }

  return {
    /** take over a departing car at video pixel (x, y), its tail lights `sep` video pixels apart */
    tailLights(x: number, y: number, sep: number) {
      const cv = cover();
      tail = { x: cv.ox + x * cv.k, y: cv.oy + y * cv.k, sep: sep * cv.k, t0: performance.now() };
      if (!raf) raf = requestAnimationFrame(frame);
    },
  };
}
