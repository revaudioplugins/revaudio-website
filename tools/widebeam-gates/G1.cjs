// G1 Isolation (plan §4 G1): the sections a lane does NOT own stay pixel-identical to the baseline (masked, reduced motion; kit/sections.cjs +
// kit/compare.cjs) at 1141x636 and 390x844 in Chrome + WebKit, and wb-verify.cjs passes 9/9 in both engines.
//   node G1.cjs <base> [--own hero,get,drive,presets,story,manual,specs,notify,footer] [--baseline <dir>] [--engines chromium,webkit] [--sizes L1141,P390] [--skip-verify] [--keep]
// "fold" is always left out (it shows the hero and the top of the plate). A section below an owned one may only MOVE, not change: a diff there is
// reported with its size so the main session can judge it. Proof it can fail: --baseline <a folder from a different build> (e.g. baseline-B0 vs B1).
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const G = require('./Glib.cjs');
const GATE = 'G1';
const A = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
const own = (A('own', '') || '').split(',').filter(Boolean);
const baseline = path.resolve(A('baseline', G.BASELINE));
const sizes = (G.ARGS.sizes || ['L1141', 'P390']).join(','); const engines = G.ARGS.engines.filter((e) => e !== 'firefox');
const tag = 'G1-' + (path.basename(baseline)) + '-' + Date.now().toString(36);
const outDir = path.join(G.GATES, 'runs', tag);

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G1.cjs <base>');
  fs.mkdirSync(path.join(outDir, 'sections'), { recursive: true });
  const env = { ...process.env, NODE_PATH: process.env.NODE_PATH || path.join(G.REPO, 'node_modules'), BASE: G.BASE };
  await Promise.all(engines.map((e) => new Promise((res) => { const p = require('child_process').spawn('node', [path.join(G.KIT, 'sections.cjs'), G.BASE, path.join(outDir, 'sections'), '--sizes', sizes, '--engines', e], { env, stdio: 'ignore' }); p.on('close', res); })));
  const cmp = spawnSync('node', [path.join(G.KIT, 'compare.cjs'), baseline, path.join(outDir, 'sections'), '--out', path.join(outDir, 'diff')], { env, encoding: 'utf8', maxBuffer: 1 << 26 });
  const lines = (cmp.stdout || '').split('\n').filter(Boolean);
  const sizeNames = sizes.split(',');
  const section = (f) => { const m = f.match(/^[A-Z]\d+-(?:chromium|webkit)-(.+)\.png$/); return m ? m[1].replace(/-p\d$/, '') : f; };
  const owned = (f) => own.includes(section(f));
  // sections Dan cut (2026-11-22, page map) that the page under test no longer has: kit/sections.cjs lists them in CUT.json
  const cutList = (() => { try { return JSON.parse(fs.readFileSync(path.join(outDir, 'sections', 'CUT.json'), 'utf8')); } catch { return []; } })();
  for (const c of cutList) G.skip(GATE, `the ${c} section's shots [${sizes}, ${engines.join('+')}]`, 'section cut by Dan 2026-11-22 (page map)');
  const res = { same: 0, diffs: [], skipped: 0 };
  for (const l of lines) {
    const m = l.match(/^(IDENTICAL|DIFF \d+|MISSING|SIZE-CHANGED)\s+(\S+\.png)(.*)$/); if (!m) continue;
    const f = m[2], sec = section(f); if (!sizeNames.some((s) => f.startsWith(s + '-')) || !engines.some((e) => f.includes('-' + e + '-'))) continue;
    if (sec === 'fold' || owned(f) || (cutList.includes(sec) && /not in B/.test(m[3]))) { res.skipped++; continue; }
    if (m[1] === 'IDENTICAL') res.same++; else res.diffs.push(`${f} ${m[1]}${m[3].replace(/ ->.*/, '')}`);
  }
  G.ok(GATE, `sections you do not own are identical to ${path.basename(baseline)} [${sizes}, ${engines.join('+')}]`, res.diffs.length === 0 && res.same > 0, res.diffs.length ? `${res.diffs.length} differ (${res.same} identical, ${res.skipped} skipped as owned/fold): ${res.diffs.slice(0, 5).join(' | ')} (diff pngs: ${path.join(outDir, 'diff')})` : `${res.same} section shots identical (${res.skipped} skipped: fold${own.length ? ', owned ' + own.join('/') : ''})`);
  if (A('skip-verify', null) === null && !process.argv.includes('--skip-verify')) for (const e of engines) {
    const r = spawnSync('node', [path.join(G.KIT, 'checks', 'wb-verify.cjs'), e, G.BASE], { env: { ...env, OUT_DIR: path.join(outDir, 'shots') }, encoding: 'utf8', timeout: 240000 });
    const out = (r.stdout || '') + (r.stderr || ''); const pass = (out.match(/^PASS /gm) || []).length, fail = (out.match(/^FAIL /gm) || []).length;
    G.ok(GATE, `wb-verify.cjs 9/9 [${e}]`, pass >= 9 && fail === 0, `${pass} PASS, ${fail} FAIL${fail ? ': ' + (out.match(/^FAIL .*/gm) || []).slice(0, 3).join(' | ') : ''}`);
  }
  if (!process.argv.includes('--keep')) { /* the shots stay under runs/ for the diff pngs */ }
});
