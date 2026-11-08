// Lightmap UVs (UV2 / uv1) for room.html's own meshes, made in the browser by the exporter (room-scene.js) and stored
// (bake/room/uv1.bin): the run time loads them, it never re-packs.
// Charts: triangles grouped by the axis their normal faces most (6 buckets) and joined across shared edges, each chart
// projected flat on its axis, in metres (texel density = texels per metre; the ceiling and the near wall at half).
// A chart whose projection folds over itself (an imported model's curve) falls back to one chart per triangle.
// Layout: every slot's charts packed into one rectangle of their own with headroom (re-baking one slot re-packs only
// its rectangle), then the rectangles and the room's own charts shelf-packed into the atlas; the density is searched
// so the atlas fills.

const AX = [[2, 1], [0, 2], [0, 1]]; // the plane each axis projects onto: x -> (z, y), y -> (x, z), z -> (x, y)

// pos: world positions, 9 floats a triangle. -> charts [{ tris, pu, pv (per corner, metres), w, h (metres) }]
export function chartsOf(pos) {
  const nt = pos.length / 9, bucket = new Int8Array(nt);
  for (let t = 0; t < nt; t++) {
    const o = t * 9, ax = pos[o + 3] - pos[o], ay = pos[o + 4] - pos[o + 1], az = pos[o + 5] - pos[o + 2];
    const bx = pos[o + 6] - pos[o], by = pos[o + 7] - pos[o + 1], bz = pos[o + 8] - pos[o + 2];
    const n = [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx], a = n.map(Math.abs);
    const k = a[0] >= a[1] && a[0] >= a[2] ? 0 : a[1] >= a[2] ? 1 : 2;
    bucket[t] = k * 2 + (n[k] < 0 ? 1 : 0);
  }
  // union-find across edges shared by triangles of one bucket (positions quantised to 0.1 mm)
  const parent = Int32Array.from({ length: nt }, (_, i) => i);
  const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const vk = (o) => `${Math.round(pos[o] * 1e4)},${Math.round(pos[o + 1] * 1e4)},${Math.round(pos[o + 2] * 1e4)}`;
  const edges = new Map();
  for (let t = 0; t < nt; t++) {
    const v = [vk(t * 9), vk(t * 9 + 3), vk(t * 9 + 6)];
    for (let e = 0; e < 3; e++) {
      const a = v[e], b = v[(e + 1) % 3], key = (a < b ? a + '|' + b : b + '|' + a) + '#' + bucket[t];
      const s = edges.get(key);
      if (s === undefined) edges.set(key, t); else { const ra = find(s), rb = find(t); if (ra !== rb) parent[ra] = rb; }
    }
  }
  const groups = new Map();
  for (let t = 0; t < nt; t++) { const r = find(t); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(t); }
  const charts = [];
  for (const tris of groups.values()) charts.push(project(pos, tris, AX[bucket[tris[0]] >> 1]));
  return charts;
}

function project(pos, tris, [iu, iv]) {
  const pu = new Float32Array(tris.length * 3), pv = new Float32Array(tris.length * 3);
  let mu = Infinity, mv = Infinity, Mu = -Infinity, Mv = -Infinity;
  tris.forEach((t, j) => { for (let c = 0; c < 3; c++) { const u = pos[t * 9 + c * 3 + iu], v = pos[t * 9 + c * 3 + iv]; pu[j * 3 + c] = u; pv[j * 3 + c] = v; mu = Math.min(mu, u); mv = Math.min(mv, v); Mu = Math.max(Mu, u); Mv = Math.max(Mv, v); } });
  for (let i = 0; i < pu.length; i++) { pu[i] -= mu; pv[i] -= mv; }
  // lying down (wider than tall) packs into shelves without the tall ones leaving the shelf empty above the rest
  if (Mv - mv > Mu - mu) return { tris, pu: pv, pv: pu, w: Mv - mv, h: Mu - mu, axes: [iu, iv] };
  return { tris, pu, pv, w: Mu - mu, h: Mv - mv, axes: [iu, iv] };
}

// does the chart fold over itself at this density? (texel centres well inside two of its triangles)
function folds(c, d) {
  const W = Math.ceil(c.w * d) + 1, H = Math.ceil(c.h * d) + 1;
  if (W * H > 4e6) return false;
  const own = new Int32Array(W * H).fill(-1); let dup = 0, cov = 0;
  for (let j = 0; j < c.tris.length; j++) {
    const ax = c.pu[j * 3] * d, ay = c.pv[j * 3] * d, bx = c.pu[j * 3 + 1] * d, by = c.pv[j * 3 + 1] * d, cx = c.pu[j * 3 + 2] * d, cy = c.pv[j * 3 + 2] * d;
    const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy); if (Math.abs(den) < 1e-9) continue;
    for (let y = Math.max(0, Math.floor(Math.min(ay, by, cy))); y <= Math.min(H - 1, Math.ceil(Math.max(ay, by, cy))); y++)
      for (let x = Math.max(0, Math.floor(Math.min(ax, bx, cx))); x <= Math.min(W - 1, Math.ceil(Math.max(ax, bx, cx))); x++) {
        const px = x + 0.5, py = y + 0.5, l1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / den, l2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / den, l3 = 1 - l1 - l2;
        if (Math.min(l1, l2, l3) < 0.02) continue;
        const i = y * W + x; cov++;
        if (own[i] >= 0 && own[i] !== j) dup++; else own[i] = j;
      }
  }
  return dup > Math.max(2, cov * 0.02);
}

// shelf packing: items [{ w, h }] in px -> sets x, y; false if they don't fit width x height
function shelf(items, width, height) {
  const order = items.map((it, i) => i).sort((a, b) => items[b].h - items[a].h || items[b].w - items[a].w);
  let x = 0, y = 0, rowH = 0;
  for (const i of order) {
    const it = items[i];
    if (it.w > width) return false;
    if (x + it.w > width) { y += rowH; x = 0; rowH = 0; }
    if (y + it.h > height) return false;
    it.x = x; it.y = y; x += it.w; rowH = Math.max(rowH, it.h);
  }
  return true;
}
const sizeOf = (c, d, pad) => ({ w: Math.ceil(c.w * d) + 1 + 2 * pad, h: Math.ceil(c.h * d) + 1 + 2 * pad });

// meshes: [{ key, slot (id or null), weight (density factor), pos (in the mesh's own axes at its world scale: a turned
// box still projects square-on) }] -> { density, slots, uv: Map key -> Float32Array }
// prev + only: keep every mesh's old uv but the `only` slots', re-packed into their old rectangles
export function packRoom(meshes, { size = 2048, pad = 3, headroom = 0.1, prev = null, only = null } = {}) {
  for (const m of meshes) {
    if (!m.charts) m.charts = chartsOf(m.pos);
    m.area = 0; for (const c of m.charts) m.area += c.w * c.h * m.weight * m.weight;
  }
  const slotted = (d) => { // one rectangle per slot (its charts inside), loose charts for the room
    const rects = [], loose = [], bySlot = new Map();
    for (const m of meshes) { if (m.slot) { if (!bySlot.has(m.slot)) bySlot.set(m.slot, []); bySlot.get(m.slot).push(m); } else for (const c of m.charts) loose.push({ ...sizeOf(c, d * m.weight, pad), c, m }); }
    for (const [slot, ms] of bySlot) {
      const items = ms.flatMap((m) => m.charts.map((c) => ({ ...sizeOf(c, d * m.weight, pad), c, m })));
      const area = items.reduce((s, it) => s + it.w * it.h, 0), wide = Math.max(...items.map((it) => it.w));
      const sum = items.reduce((s, it) => s + it.w, 0);
      let best = null; // the tightest rectangle over a range of widths (then packed once more at that width)
      for (let k = 0; k <= 24; k++) {
        const w = Math.round(wide + (Math.max(wide, Math.min(sum, Math.sqrt(area) * 2.5)) - wide) * k / 24);
        shelf(items, w, 1e9);
        const h = Math.max(...items.map((it) => it.y + it.h)), cost = w * h * (1 + 0.05 * Math.abs(Math.log(w / h)));
        if (!best || cost < best.cost) best = { w, h, cost };
      }
      shelf(items, best.w, 1e9);
      rects.push({ slot, w: best.w, h: Math.ceil(best.h * (1 + headroom)), items });
    }
    return { rects, loose };
  };
  const fold = (d) => { // charts that fold over themselves split into triangles (checked once, at the first density)
    for (const m of meshes) {
      const out = [];
      for (const c of m.charts) {
        if (c.tris.length > 1 && folds(c, d * m.weight)) for (const t of c.tris) out.push(project(m.pos, [t], c.axes)); else out.push(c);
      }
      m.charts = out;
    }
  };
  const place = (d) => {
    const { rects, loose } = slotted(d), all = [...rects, ...loose];
    return shelf(all, size, size) ? { rects, loose } : null;
  };
  let d, res;
  if (prev && only) { d = prev.density; res = null; }
  else {
    const total = meshes.reduce((s, m) => s + m.area, 0);
    let lo = 1, hi = Math.sqrt(size * size / total) * 1.2;
    fold(hi * 0.8);
    for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (place(mid)) lo = mid; else hi = mid; }
    d = lo; res = place(d);
  }
  const uv = new Map(), slots = {};
  const write = (m, c, x0, y0, dd) => {
    let a = uv.get(m.key); if (!a) { a = new Float32Array(m.pos.length / 9 * 6); uv.set(m.key, a); }
    c.tris.forEach((t, j) => { for (let k = 0; k < 3; k++) { a[t * 6 + k * 2] = (x0 + pad + 0.5 + c.pu[j * 3 + k] * dd) / size; a[t * 6 + k * 2 + 1] = (y0 + pad + 0.5 + c.pv[j * 3 + k] * dd) / size; } });
  };
  if (res) {
    for (const r of res.rects) { slots[r.slot] = { x: r.x, y: r.y, w: r.w, h: r.h, density: d }; for (const it of r.items) write(it.m, it.c, r.x + it.x, r.y + it.y, d * it.m.weight); }
    for (const it of res.loose) write(it.m, it.c, it.x, it.y, d * it.m.weight);
    return { density: d, slots, uv };
  }
  // a slot re-bake: its charts into its old rectangle (a smaller density if they no longer fit), the rest as before
  Object.assign(slots, prev.slots);
  for (const id of only) {
    const r = prev.slots[id], ms = meshes.filter((m) => m.slot === id);
    if (!r || !ms.length) continue;
    fold(d * 0.8);
    let dd = r.density, items;
    for (let k = 0; k < 40; k++, dd *= 0.95) { items = ms.flatMap((m) => m.charts.map((c) => ({ ...sizeOf(c, dd * m.weight, pad), c, m }))); if (shelf(items, r.w, r.h)) break; }
    for (const it of items) write(it.m, it.c, r.x + it.x, r.y + it.y, dd * it.m.weight);
    slots[id] = { ...r, density: dd };
  }
  return { density: d, slots, uv };
}
