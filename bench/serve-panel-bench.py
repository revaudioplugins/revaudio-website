"""Serve the built site (dist/) and this bench folder from one origin, so the panel bench can reach into its iframes.
Usage (from the worktree root, after npm run build): python bench/serve-panel-bench.py  ->  http://127.0.0.1:8797/bench/drift-panel-bench.html

POST /__bench/save (the #hear section bench, 2026-10-28): the bench's hand-tuned values leave the browser here, as
bench/drift-hear-tune/latest.json + a stamped copy, so Claude reads them from disk (never from the browser profile).
JSON only, 1 MB cap, Host + Origin = this server, header X-Bench-Save: 1.
"""
import datetime, functools, http.server, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST, BENCH = os.path.join(ROOT, 'dist'), os.path.join(ROOT, 'bench')
SAVES = os.path.join(BENCH, 'drift-hear-tune')
PORT = 8797
HOSTS = {f'127.0.0.1:{PORT}', f'localhost:{PORT}'}


class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'   # keep-alive: HTTP/1.0 ran Windows out of sockets on a busy bench

    def translate_path(self, path):
        clean = path.split('?', 1)[0].split('#', 1)[0]
        if clean.startswith('/bench/'):
            return os.path.join(BENCH, *clean[len('/bench/'):].split('/'))
        return super().translate_path(path)

    def _answer(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path.split('?', 1)[0] != '/__bench/save':
            return self._answer(404, {'error': 'no such endpoint'})
        origin = self.headers.get('Origin', '')
        if self.headers.get('Host') not in HOSTS or (origin and origin.split('://', 1)[-1] not in HOSTS) or self.headers.get('X-Bench-Save') != '1':
            return self._answer(403, {'error': 'not from the bench'})
        n = int(self.headers.get('Content-Length') or 0)
        if n <= 0 or n > 1_000_000:
            return self._answer(413, {'error': 'size'})
        raw = self.rfile.read(n)
        try:
            data = json.loads(raw)
        except ValueError:
            return self._answer(400, {'error': 'not json'})
        os.makedirs(SAVES, exist_ok=True)
        text = json.dumps(data, indent=1, ensure_ascii=False)
        latest = os.path.join(SAVES, 'latest.json')
        old = open(latest, encoding='utf-8').read() if os.path.exists(latest) else None
        if text != old:   # a stamped copy only when the values changed: the history of the tuning, never overwritten
            stamp = datetime.datetime.now().strftime('%Y-%m-%d-%H%M%S')
            with open(os.path.join(SAVES, f'tune-{stamp}.json'), 'w', encoding='utf-8') as fh:
                fh.write(text)
            tmp = latest + '.tmp'
            with open(tmp, 'w', encoding='utf-8') as fh:
                fh.write(text)
            os.replace(tmp, latest)
        return self._answer(200, {'saved': 'bench/drift-hear-tune/latest.json'})


if __name__ == '__main__':
    http.server.ThreadingHTTPServer.request_queue_size = 64
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Handler, directory=DIST))
    print(f'panel bench: http://127.0.0.1:{PORT}/bench/drift-panel-bench.html')
    srv.serve_forever()
