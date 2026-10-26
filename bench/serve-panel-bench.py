"""Serve the built site (dist/) and this bench folder from one origin, so the panel bench can reach into its iframes.
Usage (from the worktree root, after npm run build): python bench/serve-panel-bench.py  ->  http://127.0.0.1:8797/bench/drift-panel-bench.html
"""
import functools, http.server, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST, BENCH = os.path.join(ROOT, 'dist'), os.path.join(ROOT, 'bench')


class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'   # keep-alive: HTTP/1.0 ran Windows out of sockets on a busy bench

    def translate_path(self, path):
        clean = path.split('?', 1)[0].split('#', 1)[0]
        if clean.startswith('/bench/'):
            return os.path.join(BENCH, *clean[len('/bench/'):].split('/'))
        return super().translate_path(path)


if __name__ == '__main__':
    http.server.ThreadingHTTPServer.request_queue_size = 64
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8797), functools.partial(Handler, directory=DIST))
    print('panel bench: http://127.0.0.1:8797/bench/drift-panel-bench.html')
    srv.serve_forever()
