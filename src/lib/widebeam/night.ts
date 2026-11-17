/**
 * The hero's night road: a canvas behind the wordmark. The car rolls toward a vanishing point; the two headlight cones
 * open with WIDTH, HIGH BEAM throws them to the horizon, POWER off puts them out, MONO folds them onto the centre line.
 * The pointer steers a little. Dust drifts through the beams and is only lit inside them. It pauses off-screen.
 * The horizon and the vanishing point are the intro video's (public/widebeam/intro-*.mp4, horizon at y 690 and the
 * road's centre at x 965 of 1920×1080), mapped the way the video's object-fit: cover maps them, so the video can
 * dissolve into the road at any screen shape; tailLights() carries the video's departing car on to the horizon.
 */
import type { Store } from './state';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function startNight(canvas: HTMLCanvasElement, store: Store) {
  const ctx = canvas.getContext('2d')!;
  let W = 0, H = 0, dpr = 1, visible = true, raf = 0, last = 0, t = 0;
  let steer = 0, steerGoal = 0, spread = 0, power = 0, high = 0, ign = 0;
  let tail: { x: number; y: number; sep: number; t0: number } | null = null;
  // the intro video's frame as object-fit: cover places it on this canvas
  const cover = () => { const k = Math.max(W / 1920, H / 1080); return { k, ox: (W - 1920 * k) / 2, oy: (H - 1080 * k) / 2 }; };
  const motes = Array.from({ length: 140 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), s: Math.random() }));
  const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random() * 0.95, r: Math.random() * 1.1 + 0.2, p: Math.random() * 6 }));
  const trees = Array.from({ length: 160 }, (_, i) => 0.5 + 0.5 * Math.sin(i * 1.7) * Math.cos(i * 0.37) + Math.random() * 0.4);

  const resize = () => {
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  canvas.parentElement?.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    steerGoal = ((e.clientX - r.left) / r.width - 0.5) * 2;
  });
  canvas.parentElement?.addEventListener('pointerleave', () => { steerGoal = 0; });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) go(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); });

  function draw(dt: number) {
    const s = store.get(), k = 1 - Math.exp(-dt * 5);
    t += dt * (s.power ? 1 : 0.35);
    steer += (steerGoal - steer) * (1 - Math.exp(-dt * 2));
    const wGoal = s.power ? (s.mono ? 0.05 : s.width / 200) : 0;
    spread += (wGoal - spread) * k;
    power += ((s.power ? 1 : 0) - power) * k;
    high += ((s.high && s.power ? 0.4 + 0.6 * s.reach / 100 : 0) - high) * k;
    ign = Math.min(1, ign + dt * 0.9);
    const lit = power * ign * (0.92 + 0.08 * Math.sin(t * 37) * Math.sin(t * 11) * (ign < 1 ? 1 : 0.1));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cv = cover(), hz = cv.oy + 690 * cv.k, vx = cv.ox + 965 * cv.k + steer * W * 0.06;

    // sky + stars
    const sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, '#060c16'); sky.addColorStop(0.65, '#0c1828'); sky.addColorStop(1, '#13223a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hz + 1);
    for (const st of stars) {
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 1.3 + st.p);
      ctx.fillStyle = '#e9e4d6';
      ctx.fillRect(st.x * W, st.y * hz, st.r, st.r);
    }
    ctx.globalAlpha = 1;

    // ground + the far hills (the video's: rising from a low pass at the vanishing point to both edges)
    const gr = ctx.createLinearGradient(0, hz, 0, H);
    gr.addColorStop(0, '#15120e'); gr.addColorStop(1, '#090807');
    ctx.fillStyle = gr; ctx.fillRect(0, hz, W, H - hz);
    ctx.fillStyle = '#080a0f';
    ctx.beginPath(); ctx.moveTo(0, hz);
    for (let i = 0; i <= 96; i++) {
      const x = (i / 96) * W, d = Math.abs(x - vx) / (1920 * cv.k);
      const rise = Math.pow(clamp((d - 0.035) / 0.4, 0, 1), 0.7);
      const h = cv.k * (6 + 128 * rise) * (0.9 + 0.1 * trees[i % trees.length]);
      ctx.lineTo(x, hz - h);
    }
    ctx.lineTo(W, hz); ctx.closePath(); ctx.fill();

    // road
    const roadHalf = (y: number) => ((y - hz) / (H - hz)) * W * 0.62 + 2;
    ctx.fillStyle = '#17181b';
    ctx.beginPath(); ctx.moveTo(vx - 2, hz); ctx.lineTo(W / 2 - roadHalf(H), H); ctx.lineTo(W / 2 + roadHalf(H), H); ctx.lineTo(vx + 2, hz); ctx.closePath(); ctx.fill();

    // world point at depth z (0 = horizon, 1 = at the bumper) → screen
    const proj = (lane: number, z: number) => { const y = hz + (H - hz) * z * z; const cx = vx + (W / 2 - vx) * z * z; return [cx + lane * roadHalf(y), y] as const; };

    // beams: two warm cones from the lamps, additive
    ctx.globalCompositeOperation = 'lighter';
    // each cone runs from its lamp (below the frame) to the road ahead; WIDTH swings the outer edge out,
    // HIGH BEAM throws the tip from a third of the way down the road to the horizon
    const tipY = hz + (H - hz) * (0.3 - high * 0.3) + 2;
    ctx.filter = `blur(${Math.round(Math.min(W, H) * 0.025)}px)`;
    for (const sg of [-1, 1]) {
      const lx = W / 2 + sg * W * 0.2, ly = H + 30;
      const tipX = vx + (W / 2 - vx) * 0.3 + sg * 6;
      const outX = tipX + sg * (W * 0.04 + spread * W * 0.34);
      const g = ctx.createLinearGradient(0, ly, 0, tipY);
      g.addColorStop(0, `rgba(255,236,196,${0.2 * lit})`);
      g.addColorStop(0.6, `rgba(255,232,190,${(0.07 + high * 0.06) * lit})`);
      g.addColorStop(1, `rgba(255,240,210,${(0.015 + high * 0.12) * lit})`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(lx - sg * 70, ly); ctx.lineTo(tipX - sg * 4, tipY); ctx.lineTo(outX, tipY + (H - tipY) * 0.05); ctx.lineTo(lx + sg * (120 + spread * W * 0.25), ly); ctx.closePath(); ctx.fill();
    }
    ctx.filter = 'none';
    // the pool of light on the asphalt
    const pool = ctx.createRadialGradient(W / 2, H * 1.02, 10, W / 2, H, Math.max(W, H) * (0.35 + spread * 0.35));
    pool.addColorStop(0, `rgba(255,232,190,${0.22 * lit})`); pool.addColorStop(1, 'rgba(255,232,190,0)');
    ctx.fillStyle = pool; ctx.fillRect(0, hz, W, H - hz);
    // high beam: the horizon lights up
    if (high > 0.01) {
      const hg = ctx.createRadialGradient(vx, hz, 2, vx, hz, W * 0.35);
      hg.addColorStop(0, `rgba(255,246,222,${0.5 * high * lit})`); hg.addColorStop(1, 'rgba(255,246,222,0)');
      ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';

    // lit amount at a lane / depth: inside the cones
    const litAt = (lane: number, z: number) => {
      const inCone = clamp(1 - (Math.abs(lane) - (0.2 + spread * 0.9)) / 0.3, 0, 1);
      const far = z < Math.sqrt(0.3 * (1 - high)) ? 0.15 : 1;
      return clamp(inCone * far * lit, 0, 1) * (0.25 + 0.75 * z);
    };

    // centre dashes + edge lines + reflector posts, rushing in
    const speed = 0.45;
    for (let i = 0; i < 14; i++) {
      const z0 = ((i / 14 + t * speed * 0.25) % 1), z1 = z0 + 0.025;
      const [xa, ya] = proj(0, z0), [xb, yb] = proj(0, Math.min(1, z1));
      const wdt = 1 + 8 * z0 * z0;
      ctx.strokeStyle = `rgba(236,223,189,${0.15 + 0.85 * litAt(0, z0)})`;
      ctx.lineWidth = wdt; ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke();
    }
    for (const lane of [-0.93, 0.93]) {
      ctx.beginPath();
      for (let z = 0; z <= 1.0001; z += 0.05) { const [x, y] = proj(lane, z); z === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.strokeStyle = `rgba(220,214,200,${0.04 + 0.25 * litAt(lane * 0.8, 0.6)})`; ctx.lineWidth = 1.5; ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      for (const lane of [-1.18, 1.18]) {
        const z = ((i / 6 + t * speed * 0.18 + (lane > 0 ? 0.08 : 0)) % 1);
        const [x, y] = proj(lane, z), h = 4 + 60 * z * z, w = 1 + 7 * z * z;
        const l = litAt(lane * 0.85, z);
        ctx.fillStyle = `rgba(232,226,212,${0.06 + 0.8 * l})`; ctx.fillRect(x - w / 2, y - h, w, h);
        ctx.fillStyle = `rgba(255,170,70,${0.15 + 0.85 * l})`; ctx.fillRect(x - w / 2, y - h * 0.86, w, h * 0.16);
      }
    }

    // dust in the beams
    ctx.globalCompositeOperation = 'lighter';
    for (const m of motes) {
      m.z += dt * (0.05 + m.s * 0.08) * (s.power ? 1 : 0.3); if (m.z > 1) { m.z = 0; m.x = Math.random() * 2 - 1; m.y = Math.random() * 2 - 1; }
      m.x += Math.sin(t + m.s * 9) * dt * 0.02;
      const z = m.z, y = hz + (H - hz) * z * z * 0.9 - (m.y + 1) * 60 * z, x = W / 2 + m.x * W * 0.6 * z * (1.2 + spread);
      const lane = (x - W / 2) / Math.max(1, roadHalf(Math.max(hz + 1, y)));
      const a = litAt(lane, z) * (0.2 + 0.8 * m.s);
      if (a < 0.02) continue;
      ctx.fillStyle = `rgba(255,240,205,${a * 0.7})`;
      const r = 0.5 + z * 2.2 * m.s;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // the intro's car, carried on from where the video left it: tail lights easing into the vanishing point
    if (tail) {
      const p = clamp((performance.now() - tail.t0) / 2600, 0, 1), e = 1 - Math.pow(1 - p, 2.2);
      const x = tail.x + (vx - tail.x) * e, y = tail.y + (hz + 1 - tail.y) * e;
      const sep = tail.sep * Math.pow(1 - e, 1.4) + 1, a = p < 0.65 ? 1 : 1 - (p - 0.65) / 0.35;
      const r = Math.max(1, (tail.sep / 9) * Math.pow(1 - e, 1.2));
      ctx.globalCompositeOperation = 'lighter';
      for (const sg of [-1, 1]) {
        const cx = x + sg * sep / 2, g = ctx.createRadialGradient(cx, y, 0, cx, y, r * 5);
        g.addColorStop(0, `rgba(255,90,70,${a})`); g.addColorStop(0.25, `rgba(230,30,24,${0.6 * a})`); g.addColorStop(1, 'rgba(200,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(cx - r * 5, y - r * 5, r * 10, r * 10);
      }
      ctx.globalCompositeOperation = 'source-over';
      if (p >= 1) tail = null;
    }

    // vignette
    const v = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.8);
    v.addColorStop(0, 'rgba(5,5,6,0)'); v.addColorStop(1, 'rgba(5,5,6,.85)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  function loop(now: number) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now;
    draw(dt);
    if (!reduced()) raf = requestAnimationFrame(loop);
  }
  function go() { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }
  store.on(() => { if (reduced()) { ign = 1; spread = store.get().width / 200; power = store.get().power ? 1 : 0; draw(1); } });
  if (reduced()) { ign = 1; spread = store.get().width / 200; power = 1; draw(1); } else go();

  return {
    /** the lamps cough on again (the intro hands over to the road) */
    ignite() { ign = 0; go(); },
    /** take over a departing car at video pixel (x, y) with its tail lights `sep` video pixels apart */
    tailLights(x: number, y: number, sep: number) {
      const cv = cover();
      tail = { x: cv.ox + x * cv.k, y: cv.oy + y * cv.k, sep: sep * cv.k, t0: performance.now() };
      go();
    },
  };
}
