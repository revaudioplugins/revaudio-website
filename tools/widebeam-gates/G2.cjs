// G2 Page spec (plan §4 G2): tests/widebeam.spec.ts + the /widebeam smoke test, in chromium + mobile-safari (the house projects) and Firefox (headless),
// through the scratch config pw.config.ts (baseURL from the base argument, no webServer, dev-toolbar 403 filter on). One row per test per project.
//   node G2.cjs <base> [--projects chromium,mobile-safari,firefox] [--plant aax|buynow|...: served through a tiny injecting proxy]
const { spawnSync, spawn } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');
const G = require('./Glib.cjs');
const GATE = 'G2';
const A = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };

// a proxy that plants a violation into the page's HTML (proves the spec can fail without touching the page)
function proxy(upstream, plant) {
  return new Promise((resolve) => {
    const u = new URL(upstream);
    const srv = http.createServer((req, res) => {
      const pr = http.request({ host: u.hostname, port: u.port, path: req.url, method: req.method, headers: { ...req.headers, 'accept-encoding': 'identity' } }, (up) => {
        const ct = up.headers['content-type'] || ''; const chunks = [];
        up.on('data', (c) => chunks.push(c));
        up.on('end', () => { let b = Buffer.concat(chunks); if (/text\/html/.test(ct)) { b = Buffer.from(G.plantText(plant, 'http://x' + req.url, b.toString('utf8'))); } const h = { ...up.headers }; delete h['content-length']; delete h['content-encoding']; delete h['transfer-encoding']; res.writeHead(up.statusCode, h); res.end(b); });
      });
      pr.on('error', () => { res.writeHead(502); res.end(); }); req.pipe(pr);
    });
    // the dev server's HMR websocket goes straight through (a dead socket sends Vite's client into reload loops)
    srv.on('upgrade', (req, socket, head) => { const up = net.connect(+u.port, u.hostname, () => { up.write(`${req.method} ${req.url} HTTP/1.1\r\n` + Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n'); up.write(head); socket.pipe(up); up.pipe(socket); }); up.on('error', () => socket.destroy()); socket.on('error', () => up.destroy()); });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: 'http://127.0.0.1:' + srv.address().port }));
  });
}

G.main(async () => {
  if (!G.BASE) throw new Error('usage: node G2.cjs <base>');
  let base = G.BASE, px = null;
  if (G.ARGS.plant) { px = await proxy(G.BASE, G.ARGS.plant); base = px.url; }
  const projects = (A('projects', 'chromium,mobile-safari,firefox')).split(',');
  const args = ['playwright', 'test', '-c', path.join(G.GATES, 'pw.config.ts'), '--reporter=json', '-g', 'widebeam|/widebeam', ...projects.flatMap((p) => ['--project', p])];
  // async (not spawnSync): the injecting proxy lives in THIS process and must keep answering while playwright runs
  const r = await new Promise((resolve) => { const c = spawn('npx', args, { cwd: G.REPO, env: { ...process.env, BASE_URL: base, WB_REPO: G.REPO, WB_DEV_NOISE: '1' } }); let out = '', err = ''; c.stdout.on('data', (d) => (out += d)); c.stderr.on('data', (d) => (err += d)); const t = setTimeout(() => c.kill(), 2400000); c.on('close', (code) => { clearTimeout(t); resolve({ stdout: out, stderr: err, code }); }); });
  if (px) px.srv.close();
  let json; try { json = JSON.parse(r.stdout); } catch { return G.row(GATE, 'playwright run', 'FAIL', 'no JSON report (exit ' + r.code + '): ' + (r.stderr || r.stdout || '').split('\n').slice(0, 3).join(' | ').slice(0, 250)); }
  const walk = (suite, title = '') => { for (const s of suite.suites || []) walk(s, (title ? title + ' > ' : '') + s.title); for (const sp of suite.specs || []) for (const t of sp.tests) { const res = t.results[t.results.length - 1] || {}; const msg = ((res.error && res.error.message) || '').replace(/\u001b\[[0-9;]*m/g, '').split('\n').filter(Boolean).slice(0, 2).join(' ').slice(0, 220); G.row(GATE, `${t.projectName}: ${path.basename(suite.file || sp.file || '')} ${title ? title + ' > ' : ''}${sp.title}`.replace(/\s+/g, ' '), res.status === 'passed' ? 'PASS' : res.status === 'skipped' ? 'SKIP' : 'FAIL', res.status === 'passed' ? `${res.duration} ms` : res.status === 'skipped' ? 'skipped by the spec for this project' : msg); } };
  for (const s of json.suites || []) walk(s, '');
  if (!G.rows.length) G.row(GATE, 'playwright run', 'FAIL', 'the report held no tests: ' + (r.stderr || '').slice(0, 200));
});
