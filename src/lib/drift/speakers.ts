/**
 * #hear speakers + smoke (Yoni 2026-10-15: "a pair of speakers ... the membranes moving ... very light, almost not
 * showing smoke that gives movement to the whole page"). Driven by hear.ts every frame with the measured L / R
 * levels: the LEFT speaker moves with the left channel, the RIGHT with the right, so DRIFT's pan is something you
 * see travel between them. The cone pumps (scale), brightens a touch on a hit and lights its LED ring.
 * Smoke: soft violet puffs leave each speaker on its hits, drift outward and up across the section, grow and fade over
 * ~6 s at about 2 % alpha (screen blend, half-resolution canvas, max 45 puffs). Off under reduced motion.
 */
type Puff = { x: number; y: number; vx: number; vy: number; r: number; gr: number; a: number; life: number; age: number };

export function createSpeakers(root: HTMLElement) {
  const spk = { l: root.querySelector<HTMLElement>('[data-hear-spk="l"]'), r: root.querySelector<HTMLElement>('[data-hear-spk="r"]') };
  const cv = root.querySelector<HTMLCanvasElement>('[data-hear-smoke]');
  const g = cv?.getContext('2d') ?? null;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const env = { l: 0, r: 0 }, slow = { l: 0, r: 0 };
  const puffs: Puff[] = [];
  const SCALE = .5;                                   // smoke is soft: half resolution is plenty

  // one soft sprite, tinted DRIFT violet-pink, drawn at any size
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 128;
  { const s = sprite.getContext('2d')!, gr = s.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(232,190,255,1)'); gr.addColorStop(.45, 'rgba(210,120,255,.45)'); gr.addColorStop(1, 'rgba(190,90,255,0)');
    s.fillStyle = gr; s.fillRect(0, 0, 128, 128); }

  const size = () => {
    if (!cv) return;
    const w = Math.round(cv.clientWidth * SCALE), h = Math.round(cv.clientHeight * SCALE);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  };
  addEventListener('resize', size); size();

  const level = (rms: number) => rms > 1e-5 ? Math.max(0, Math.min(1, (20 * Math.log10(rms) + 36) / 30)) : 0;

  /** One frame. L / R = channel RMS (0 when stopped). Returns true while anything still moves. */
  function update(L: number, R: number, dt: number): boolean {
    const box = cv?.getBoundingClientRect();
    for (const side of ['l', 'r'] as const) {
      const t = level(side === 'l' ? L : R), e = env[side];
      env[side] = e + (t - e) * Math.min(1, dt * (t > e ? 28 : 7));      // fast attack, softer release: a cone, not a meter
      slow[side] += (env[side] - slow[side]) * Math.min(1, dt * 3);
      const el = spk[side];
      if (el) el.style.setProperty('--e', env[side].toFixed(3));
      // smoke: a puff on a hit (the level jumps over its own slow average), a thin trickle while it plays loud
      if (!g || !box || !el || calm.matches) continue;
      const hit = env[side] - slow[side] > .12, trickle = Math.random() < env[side] * dt * .7;
      if ((hit || trickle) && puffs.length < 45) {
        const r = el.getBoundingClientRect(), dir = side === 'l' ? -1 : 1;
        const n = 1;
        for (let k = 0; k < n; k++) puffs.push({
          x: (r.left + r.width / 2 - box.left) * SCALE, y: (r.top + r.height / 2 - box.top) * SCALE,
          vx: dir * (26 + Math.random() * 30), vy: -(8 + Math.random() * 14),
          r: r.width * .3 * SCALE, gr: 26 + Math.random() * 16, a: (hit ? .024 : .015) * (.6 + env[side] * .6),
          life: 5 + Math.random() * 2, age: 0,
        });
      }
    }
    if (g && cv) {
      g.clearRect(0, 0, cv.width, cv.height);
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]; p.age += dt;
        if (p.age >= p.life) { puffs.splice(i, 1); continue; }
        const u = p.age / p.life;
        p.vx *= 1 - dt * .25; p.vy -= dt * 2.5;                          // eases off sideways, keeps lifting
        p.x += (p.vx + Math.sin(p.age * 1.3 + i) * 6) * dt; p.y += p.vy * dt; p.r += p.gr * dt;
        g.globalAlpha = p.a * Math.sin(Math.PI * Math.min(1, u * 1.15));  // in and out, never a hard edge
        g.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      g.globalAlpha = 1;
    }
    return env.l > .003 || env.r > .003 || puffs.length > 0;
  }
  return { update };
}
