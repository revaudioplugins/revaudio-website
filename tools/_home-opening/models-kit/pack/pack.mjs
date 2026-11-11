// The pack (README.md): the full-size originals in masters/ → the files the room serves in assets/. Same paths, same
// look; smaller downloads. Steps (pack.sh runs them in order):
//   node pack.mjs adopt                    a raw .glb dropped into assets/models/ moves to masters/models/; a new assets/pbr map gets a master
//   node pack.mjs need <measure.json ...>  → need.json: per original texture, how many size levels the walk never reads
//   node pack.mjs build                    masters/ + need.json → assets/models/*.glb and assets/pbr/*.webp
//   node pack.mjs check [need.json]        guard: every original is served, and no served texture is smaller than the walk reads
// Models: every picture re-saved as WebP at the size the walk reads (the original's bytes stay when WebP isn't smaller);
// shapes packed with meshopt, which the room's loader already decodes. Every position, triangle and node comes out
// bit for bit as it went in (the build stops if one differs): the room spins, fits and matches parts by node, and
// thin layers (a meter's lit face 0.5 mm over its panel) swap or flicker when positions move by even 0.03 mm.
// Only the directions the light reads (normals, 12 bits) and the picture coordinates (14 bits) are rounded.
import fs from 'fs'; import path from 'path'; import zlib from 'zlib'; import crypto from 'crypto'; import { fileURLToPath } from 'url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression, EXTTextureWebP } from '@gltf-transform/extensions';
import { quantize } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOM = path.resolve(HERE, '../..');
const MASTERS = path.join(ROOM, 'masters'), SERVED = path.join(ROOM, 'assets'), NEED = path.join(HERE, 'need.json');
const MARGIN = +(process.env.MARGIN ?? 0.5);   // levels of headroom kept above what the walk reads (a bench can move a little)
const UNSEEN_DROP = 0;                          // a texture no stop ever shows keeps its full size
const NORMAL_BITS = 12;                        // normals: 8 bits moved the highlights on the car's paint (stills of 11-11); 12 does not
const Q_COLOUR = 85, Q_DATA = 90;               // WebP quality: colour / emissive pictures; normal + roughness-metal maps
const [mode, ...args] = process.argv.slice(2);
const MB = (n) => (n / 1e6).toFixed(2);
const list = (dir, ext) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(ext)).sort() : []);
const glbJson = (file) => { const b = fs.readFileSync(file); return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8')); };
const packed = (file) => (glbJson(file).extensionsUsed || []).includes('EXT_meshopt_compression');
const quiet = { debug() {}, info() {}, warn() {}, error: console.error };
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const read = async (file) => { const doc = await io.read(file); doc.setLogger(quiet); return doc; };
const dims = async (buf) => { const m = await sharp(buf).metadata(); return [m.width, m.height]; };
const dropOf = (q) => (q === null ? UNSEEN_DROP : q - MARGIN >= 1 ? Math.floor(q - MARGIN) : 0);

// ---- adopt -------------------------------------------------------------------------------------------------------
function adopt() {
  fs.mkdirSync(path.join(MASTERS, 'models'), { recursive: true }); fs.mkdirSync(path.join(MASTERS, 'pbr'), { recursive: true });
  for (const f of list(path.join(SERVED, 'models'), '.glb')) {
    if (packed(path.join(SERVED, 'models', f))) continue;
    fs.renameSync(path.join(SERVED, 'models', f), path.join(MASTERS, 'models', f)); console.log(`adopted the original models/${f}`);
  }
  for (const f of list(path.join(SERVED, 'pbr'), '.webp')) {
    if (fs.existsSync(path.join(MASTERS, 'pbr', f))) continue;
    fs.copyFileSync(path.join(SERVED, 'pbr', f), path.join(MASTERS, 'pbr', f)); console.log(`adopted the original pbr/${f}`);
  }
}

// ---- need --------------------------------------------------------------------------------------------------------
function q001(hist) { // the level below which only 0.1 % of the texture's on-screen pixels fall (measure.mjs: quarter levels from -4)
  const n = hist.reduce((a, b) => a + b, 0); if (!n) return null;
  for (let i = 0, c = 0; i < hist.length; i++) { c += hist[i]; if (c > n * 0.001) return i / 4 - 4; }
  return 8;
}
function labelOf(t, models) { // a measured texture → its original: pbr/<file> or models/<file.glb>/<picture name>
  if (t.isCanvas || !t.label) return null;
  if (t.label.includes('/assets/pbr/')) return 'pbr/' + t.label.split('/').pop().split('?')[0];
  if (t.label.includes('/assets/')) return null; // assets/pics (plugin screens, posters) are not packed
  for (const o of t.owners) { const [id, part] = o.split(':'), src = (part === 'stand' && models[id + ':stand']) || models[id]; if (src) return 'models/' + src.split('/').pop() + '/' + t.label; }
  return null;
}
async function need(files) {
  if (!files.length) throw new Error('need: give the measure.mjs outputs');
  const q = new Map(), runs = [];
  for (const f of files) { // the most demanding window wins, texture by texture
    const d = JSON.parse(fs.readFileSync(f)), mats = Object.fromEntries(d.mats.map((m) => [m.mid, m])), H = {};
    runs.push(`${d.vw}x${d.vh}@${d.dpr}`);
    for (const s of Object.values(d.per)) for (const [mid, a] of Object.entries(s.hist)) { const h = (H[mats[mid].src] ||= new Array(48).fill(0)); a.forEach((v, i) => { h[i] += v; }); }
    for (const [src, t] of Object.entries(d.tex)) {
      const lab = labelOf(t, d.models), v = lab && H[src] ? q001(H[src]) : null;
      if (v !== null) q.set(lab, Math.min(q.get(lab) ?? Infinity, v));
    }
  }
  const rows = [];
  for (const f of list(path.join(MASTERS, 'models'), '.glb')) {
    for (const t of (await read(path.join(MASTERS, 'models', f))).getRoot().listTextures()) {
      const [w, h] = await dims(t.getImage()), label = `models/${f}/${t.getName()}`;
      rows.push({ label, w, h, bytes: t.getImage().byteLength, q: q.get(label) ?? null });
    }
  }
  for (const f of list(path.join(MASTERS, 'pbr'), '.webp')) {
    const b = fs.readFileSync(path.join(MASTERS, 'pbr', f)), [w, h] = await dims(b);
    rows.push({ label: `pbr/${f}`, w, h, bytes: b.length, q: q.get(`pbr/${f}`) ?? null });
  }
  const known = new Set(rows.map((r) => r.label)), lost = [...q.keys()].filter((l) => !known.has(l));
  if (lost.length) throw new Error('need: measured in the room but no original in masters/: ' + lost.join(', '));
  for (const r of rows) r.drop = dropOf(r.q);
  const out = args.find((a) => a.startsWith('--out='))?.slice(6) || NEED;
  fs.writeFileSync(out, `{"margin": ${MARGIN}, "windows": ${JSON.stringify(runs)}, "rows": [\n${rows.map((r) => JSON.stringify(r)).join(',\n')}\n]}\n`);
  const by = {}; for (const r of rows) { const k = r.q === null ? 'never on screen' : `drop ${r.drop}`; (by[k] ||= [0, 0])[0]++; by[k][1] += r.bytes; }
  console.log(`${rows.length} textures, windows ${runs.join(' ')}, margin ${MARGIN} → ${path.relative(ROOM, out)}`);
  for (const k of Object.keys(by).sort()) console.log(`  ${k}: ${by[k][0]} textures, ${MB(by[k][1])} MB of originals`);
}
const needRows = (file = NEED) => new Map(JSON.parse(fs.readFileSync(file)).rows.map((r) => [r.label, r]));

// ---- build -------------------------------------------------------------------------------------------------------
async function shrink(buf, drop) { // raw pixels, halved `drop` times by 2x2 averaging (what the graphics chip's own smaller levels are)
  let { data, info: { width: w, height: h, channels: c } } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  for (; drop > 0 && w > 1 && h > 1; drop--) {
    const W = w >> 1, H = h >> 1, out = Buffer.alloc(W * H * c);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let k = 0; k < c; k++) {
      const i = (2 * y * w + 2 * x) * c + k;
      out[(y * W + x) * c + k] = (data[i] + data[i + c] + data[i + w * c] + data[i + w * c + c] + 2) >> 2;
    }
    data = out; w = W; h = H;
  }
  return sharp(data, { raw: { width: w, height: h, channels: c } });
}
const webp = (img, colour) => img.webp({ quality: colour ? Q_COLOUR : Q_DATA, alphaQuality: 100, effort: 6, smartSubsample: !colour }).toBuffer();
const ROUNDED = /^(NORMAL|TANGENT|TEXCOORD|JOINTS|WEIGHTS|COLOR)(_\d+)?$/; // never POSITION
const shape = (doc) => { // what must come out as it went in: every node's name and transform, the pictures' names, every position and triangle
  const r = doc.getRoot(), h = crypto.createHash('sha1');
  for (const m of r.listMeshes()) for (const p of m.listPrimitives()) {
    const pos = p.getAttribute('POSITION'), ix = p.getIndices();
    if (pos) h.update(Buffer.from(pos.getArray().buffer, pos.getArray().byteOffset, pos.getArray().byteLength));
    if (ix) { const t = Uint32Array.from(ix.getArray()); // the packer may start a triangle at another of its corners: same triangle, same facing
      if (p.getMode() === 4) for (let i = 0; i + 2 < t.length; i += 3) { const [x, y, z] = [t[i], t[i + 1], t[i + 2]], k = x <= y && x <= z ? 0 : y <= z ? 1 : 2; if (k) [t[i], t[i + 1], t[i + 2]] = k === 1 ? [y, z, x] : [z, x, y]; }
      h.update(Buffer.from(t.buffer)); }
  }
  return [r.listNodes().map((n) => [n.getName(), ...n.getTranslation(), ...n.getRotation(), ...n.getScale()].join(' ')).sort().join('\n'),
    r.listTextures().map((t) => t.getName()).sort().join('\n'), r.listAnimations().length, h.digest('hex')].join('\n--\n');
};
async function build() {
  const rows = needRows(), tot = { m: [0, 0, 0, 0], p: [0, 0], wrote: 0 };
  const put = (file, bytes) => { if (!fs.existsSync(file) || !fs.readFileSync(file).equals(bytes)) { fs.writeFileSync(file, bytes); tot.wrote++; } };
  fs.mkdirSync(path.join(SERVED, 'models'), { recursive: true });
  for (const f of list(path.join(MASTERS, 'models'), '.glb')) {
    const src = path.join(MASTERS, 'models', f), doc = await read(src), before = shape(doc);
    let webps = 0;
    for (const t of doc.getRoot().listTextures()) {
      const row = rows.get(`models/${f}/${t.getName()}`); if (!row) throw new Error(`build: models/${f}/${t.getName()} is not in need.json: run pack.sh`);
      const colour = doc.getGraph().listParentEdges(t).some((e) => /baseColor|emissive|sheenColor|specularColor|diffuse/.test(e.getName()));
      const out = await webp(await shrink(t.getImage(), row.drop), colour);
      if (row.drop || out.length < t.getImage().byteLength) { t.setImage(out).setMimeType('image/webp'); webps++; }
    }
    if (webps) doc.createExtension(EXTTextureWebP).setRequired(true);
    await doc.transform(quantize({ pattern: ROUNDED, patternTargets: ROUNDED, quantizeTexcoord: 14, quantizeNormal: NORMAL_BITS })); // vertex order kept: re-ordering made the gzip download bigger
    doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE }); // its FILTER method fixes normals at 8 bits
    const bytes = Buffer.from(await io.writeBinary(doc)), after = shape(await io.readBinary(bytes));
    if (after !== before) throw new Error(`build: ${f} came out with different nodes, pictures, positions or triangles: not written`);
    put(path.join(SERVED, 'models', f), bytes);
    const orig = fs.readFileSync(src); tot.m[0] += orig.length; tot.m[1] += bytes.length; tot.m[2] += zlib.gzipSync(orig, { level: 6 }).length; tot.m[3] += zlib.gzipSync(bytes, { level: 6 }).length;
  }
  for (const f of list(path.join(MASTERS, 'pbr'), '.webp')) {
    const row = rows.get(`pbr/${f}`); if (!row) throw new Error(`build: pbr/${f} is not in need.json: run pack.sh`);
    const orig = fs.readFileSync(path.join(MASTERS, 'pbr', f));
    const bytes = row.drop ? await webp(await shrink(orig, row.drop), /_col\.webp$/.test(f)) : orig;
    put(path.join(SERVED, 'pbr', f), bytes); tot.p[0] += orig.length; tot.p[1] += bytes.length;
  }
  console.log(`models: ${MB(tot.m[0])} → ${MB(tot.m[1])} MB (as downloaded, gzip: ${MB(tot.m[2])} → ${MB(tot.m[3])} MB) · pbr maps: ${MB(tot.p[0])} → ${MB(tot.p[1])} MB · ${tot.wrote} files changed`);
}

// ---- check -------------------------------------------------------------------------------------------------------
async function check(file) {
  const rows = needRows(file), under = [], slack = [], missing = [], stray = [];
  const size = (r, w, h) => { const want = [Math.max(1, r.w >> r.drop), Math.max(1, r.h >> r.drop)];
    if (w < want[0] || h < want[1]) under.push(`${r.label}: served ${w}x${h}, the walk reads ${want[0]}x${want[1]}`);
    else if (w > want[0] && r.q !== null) slack.push(`${r.label}: served ${w}x${h}, the walk reads ${want[0]}x${want[1]}`); };
  for (const f of list(path.join(MASTERS, 'models'), '.glb')) {
    const s = path.join(SERVED, 'models', f);
    if (!fs.existsSync(s) || !packed(s)) { missing.push(`models/${f}`); continue; }
    const served = new Map(); for (const t of (await read(s)).getRoot().listTextures()) served.set(t.getName(), await dims(t.getImage()));
    for (const t of (await read(path.join(MASTERS, 'models', f))).getRoot().listTextures()) {
      const r = rows.get(`models/${f}/${t.getName()}`), d = served.get(t.getName());
      if (!r || !d) missing.push(`models/${f}/${t.getName()}`); else size(r, ...d);
    }
  }
  for (const f of list(path.join(MASTERS, 'pbr'), '.webp')) {
    const s = path.join(SERVED, 'pbr', f), r = rows.get(`pbr/${f}`);
    if (!fs.existsSync(s) || !r) missing.push(`pbr/${f}`); else size(r, ...(await dims(fs.readFileSync(s))));
  }
  for (const f of list(path.join(SERVED, 'models'), '.glb')) if (!fs.existsSync(path.join(MASTERS, 'models', f))) stray.push(`models/${f}`);
  for (const l of under) console.log('UNDER-SIZED  ' + l);
  for (const l of missing) console.log('NOT PACKED   ' + l);
  for (const l of stray) console.log('NO ORIGINAL  ' + l + ' (served, but nothing in masters/)');
  for (const l of slack) console.log('could shrink ' + l);
  console.log(`${rows.size - under.length - slack.length - missing.length} right-sized, ${slack.length} could shrink, ${under.length} under-sized, ${missing.length} not packed, ${stray.length} without an original`);
  if (under.length || missing.length || stray.length) { console.log('→ run models-kit/pack/pack.sh'); process.exit(1); }
}

if (mode === 'adopt') adopt();
else if (mode === 'need') await need(args.filter((a) => !a.startsWith('--')));
else if (mode === 'build') await build();
else if (mode === 'check') await check(args[0]);
else { console.log('node pack.mjs adopt | need <measure.json ...> [--out=file] | build | check [need.json]'); process.exit(2); }
