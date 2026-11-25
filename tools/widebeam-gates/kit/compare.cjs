// Per-file pixel comparison of two folders of PNGs. Usage: NODE_PATH=<repo>/node_modules node compare.cjs <dirA> <dirB> [--out diffdir]
// One line per file: IDENTICAL / DIFF <changed px> / MISSING (in A or B) / SIZE-CHANGED <a vs b>. A red-highlight png per DIFF
// (the B picture dimmed, changed pixels red). Exit 1 if anything is not IDENTICAL.
// A pixel counts as changed when any channel differs (exact; shots are deterministic, so no tolerance).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const argv = process.argv.slice(2);
const oi = argv.indexOf('--out');
const OUT = oi >= 0 ? path.resolve(argv[oi + 1]) : null;
const [A, B] = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--out').map((d) => path.resolve(d));
if (!A || !B) { console.error('usage: compare.cjs <dirA> <dirB> [--out diffdir]'); process.exit(2); }
if (OUT) fs.mkdirSync(OUT, { recursive: true });

const pngs = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.png')) : []);
const raw = async (f) => { const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; };

(async () => {
  const names = [...new Set([...pngs(A), ...pngs(B)])].sort();
  let bad = 0, same = 0;
  for (const n of names) {
    const fa = path.join(A, n), fb = path.join(B, n);
    if (!fs.existsSync(fa)) { console.log(`MISSING  ${n} (not in A)`); bad++; continue; }
    if (!fs.existsSync(fb)) { console.log(`MISSING  ${n} (not in B)`); bad++; continue; }
    const a = await raw(fa), b = await raw(fb);
    if (a.w !== b.w || a.h !== b.h) { console.log(`SIZE-CHANGED  ${n} ${a.w}x${a.h} vs ${b.w}x${b.h}`); bad++; continue; }
    let changed = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    const out = Buffer.alloc(a.data.length);
    for (let i = 0; i < a.data.length; i += 4) {
      const d = a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2] || a.data[i + 3] !== b.data[i + 3];
      if (d) { changed++; const px = (i / 4) % a.w, py = Math.floor(i / 4 / a.w); if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; out[i] = 255; out[i + 1] = 0; out[i + 2] = 0; out[i + 3] = 255; }
      else { out[i] = b.data[i] * 0.3; out[i + 1] = b.data[i + 1] * 0.3; out[i + 2] = b.data[i + 2] * 0.3; out[i + 3] = 255; }
    }
    if (!changed) { console.log(`IDENTICAL  ${n}`); same++; continue; }
    bad++;
    let extra = '';
    if (OUT) { await sharp(out, { raw: { width: a.w, height: a.h, channels: 4 } }).png().toFile(path.join(OUT, 'diff-' + n)); extra = ` -> ${path.join(OUT, 'diff-' + n)}`; }
    console.log(`DIFF ${changed}  ${n} bbox x${x0}-${x1} y${y0}-${y1}${extra}`);
  }
  console.log(`compare: ${same} identical, ${bad} not identical, ${names.length} files`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
