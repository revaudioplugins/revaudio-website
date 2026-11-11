# A weak-connection simulator for the long garage (Dan, 11-10: "add a delay typical for someone with very weak internet").
# Serves the worktree the way GitHub Pages does (gzip for text and models; checked on a live Pages .glb: content-encoding
# gzip), but through ONE shared slow line: --mbps down for every connection together, --rtt ms before each response's
# first byte, nothing cached (every load is a cold first visit). Default = Lighthouse's mobile profile (1.6 Mbps, 150 ms).
# room.html gets a small corner badge (the clock, each light as it comes on, when the room is ready) and a reset of the
# loading screen's once-per-session flag, so every reload plays the full first visit.
#   python3 -I simserve.py --root <worktree> [--port 4481] [--mbps 1.6] [--rtt 150] [--no-gzip] [--no-badge]
import argparse, gzip, http.server, mimetypes, os, threading, time, urllib.parse

ap = argparse.ArgumentParser()
ap.add_argument('--root', required=True)
ap.add_argument('--port', type=int, default=4481)
ap.add_argument('--mbps', type=float, default=1.6)
ap.add_argument('--rtt', type=float, default=150)
ap.add_argument('--no-gzip', action='store_true')
ap.add_argument('--no-badge', action='store_true')
A = ap.parse_args()
ROOT = os.path.realpath(A.root)
RATE = A.mbps * 1e6 / 8                       # bytes a second, shared by every connection
CHUNK = 16384
ZIP = {'.html', '.js', '.mjs', '.css', '.json', '.glb', '.gltf', '.svg', '.txt', '.wasm', '.bin'}
TYPES = {'.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.js': 'text/javascript', '.mjs': 'text/javascript',
         '.webp': 'image/webp', '.wasm': 'application/wasm', '.json': 'application/json', '.css': 'text/css',
         '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.ktx2': 'image/ktx2', '.bin': 'application/octet-stream'}

lock = threading.Lock()
line = {'free': time.monotonic(), 'bytes': 0}
cache = {}                                     # path -> (mtime, raw, gzipped)

def send_slow(wfile, data):
    for i in range(0, len(data), CHUNK):
        part = data[i:i + CHUNK]
        with lock:                             # book this chunk's slot on the one line; a late wake-up (a busy Mac)
            now = time.monotonic()             # catches up instead of losing line time, an idle line restarts now
            start = line['free'] if now - line['free'] < 0.25 else now
            line['free'] = start + len(part) / RATE; due = line['free']
            line['bytes'] += len(part)
        wait = due - time.monotonic()
        if wait > 0: time.sleep(wait)
        wfile.write(part)

BADGE = r'''<script>/* weak-connection simulator (scratchpad sim/simserve.py): not part of the page */
try { sessionStorage.removeItem('ra:lightsOn'); } catch (e) {}
(() => { // mounted as soon as <body> exists: DOMContentLoaded can wait for the room's module
  const b = document.createElement('div'), seen = [], fmt = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;font:12px/1.5 ui-monospace,Menlo,monospace;color:#efe9df;background:rgba(8,8,10,.78);border:1px solid rgba(255,255,255,.16);border-radius:6px;padding:8px 10px;max-width:290px;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)';
  const mount = () => (document.body ? document.body.appendChild(b) : requestAnimationFrame(mount)); mount();
  let ready = null, hidden = false;
  b.addEventListener('click', (e) => { const a = e.target.dataset && e.target.dataset.a; if (!a) return; e.preventDefault(); if (a === 'again') location.reload(); if (a === 'hide') { hidden = true; b.remove(); } });
  const tick = () => {
    if (hidden) return;
    const now = performance.now(), log = (window.lightsOn && window.lightsOn.log) || [];
    while (seen.length < log.length) seen.push([now, log[seen.length][1]]);           // stamp each light as it shows up
    if (ready == null && log.some(([, w]) => w === 'hand-off')) ready = now;
    const rows = seen.filter(([, w]) => w !== 'ready' && w !== 'hand-off').map(([t, w]) => fmt(t) + '  ' + w.replace(/ \((tube|neon|bulb|gear|screen)\)/, '')).join('<br>');
    b.innerHTML = '<div style="color:#f0a83c;font-weight:600">Weak connection · SPEED Mbps · RTT ms</div>'
      + '<div style="font-size:15px;margin:2px 0 4px">' + (ready != null ? 'Room ready at ' + fmt(ready) : 'Loading… ' + fmt(now)) + '</div>'
      + (rows ? '<div style="opacity:.8">' + rows + '</div>' : '')
      + '<div style="margin-top:6px;display:flex;gap:12px"><a href="#" data-a="again" style="color:#f0a83c">↻ again</a><a href="#" data-a="hide" style="color:#9aa">hide</a></div>';
    setTimeout(tick, ready != null ? 1000 : 250);
  };
  tick();
})();
</script>
'''.replace('SPEED', f'{A.mbps:g}').replace('RTT', f'{A.rtt:g}')

class H(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def log_message(self, *a): pass
    def body(self):
        rel = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path).lstrip('/')
        p = os.path.realpath(os.path.join(ROOT, rel))
        if not (p == ROOT or p.startswith(ROOT + os.sep)) or not os.path.isfile(p): return None, None, None
        ext = os.path.splitext(p)[1].lower(); m = os.path.getmtime(p)
        hit = cache.get(p)
        if not hit or hit[0] != m:
            raw = open(p, 'rb').read()
            if p.endswith(os.path.join('tools', '_home-opening', 'room.html')) and not A.no_badge:
                raw = raw.replace(b'<head>', b'<head>\n' + BADGE.encode(), 1)
            gz = gzip.compress(raw, 6) if ext in ZIP and not A.no_gzip else None
            hit = cache[p] = (m, raw, gz)
        ctype = TYPES.get(ext) or mimetypes.guess_type(p)[0] or 'application/octet-stream'
        return hit, ctype, ext
    def go(self, head):
        hit, ctype, ext = self.body()
        time.sleep(A.rtt / 1000)               # the request's way there and the first byte's way back
        if hit is None:
            msg = b'not found'; self.send_response(404); self.send_header('Content-Type', 'text/plain'); self.send_header('Content-Length', str(len(msg))); self.end_headers()
            if not head: self.wfile.write(msg)
            return
        _, raw, gz = hit
        use_gz = gz is not None and 'gzip' in (self.headers.get('Accept-Encoding') or '')
        data = gz if use_gz else raw
        self.send_response(200)
        self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        if gz is not None: self.send_header('Vary', 'Accept-Encoding')
        if use_gz: self.send_header('Content-Encoding', 'gzip')
        self.end_headers()
        if not head: send_slow(self.wfile, data)
    def do_GET(self):
        try: self.go(False)
        except (BrokenPipeError, ConnectionResetError): pass
    def do_HEAD(self):
        try: self.go(True)
        except (BrokenPipeError, ConnectionResetError): pass

class S(http.server.ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 64

print(f'simulating {A.mbps:g} Mbps, {A.rtt:g} ms, gzip {"off" if A.no_gzip else "on"}: http://127.0.0.1:{A.port}/tools/_home-opening/room.html', flush=True)
S(('127.0.0.1', A.port), H).serve_forever()
