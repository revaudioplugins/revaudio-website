/* Gauge bench — live control of the hero dial's two darkening circles.

   Why it is not one of the bench/*.html copies: the thing being tuned is a
   composite of a photoreal plate, two gradients, a rotated needle and a
   screen-blended glass sheen. A copy of that is a guess. This runs ON the
   real page, drives the real custom properties, and hands back a block that
   pastes straight over the knob list in index.astro.

   Why it is not a RevEdit manifest entry: RevEdit is one slider per property
   with a 64px label column, and this is 27 knobs across two layers that only
   make sense grouped — plus a live AA readout, which no generic panel can do.

   Safety: `command !== 'dev'` bails, so it can never reach a build. In normal
   dev it is an inert ~15-line inline script; the panel is only fetched when
   the URL carries ?gauge.

   Usage:  http://localhost:4321/?gauge
   Then:   drag knobs · presets for a quick darker/lighter · COPY CSS when
           happy and hand the block back. ?gauge=reset clears saved work. */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const CLIENT = fileURLToPath(new URL('./gaugebench.client.js', import.meta.url));

export default function gaugebench() {
  return {
    name: 'gaugebench',
    hooks: {
      'astro:config:setup': ({ command, updateConfig, injectScript }) => {
        if (command !== 'dev') return;

        updateConfig({
          vite: {
            plugins: [
              {
                name: 'gaugebench-server',
                configureServer(server) {
                  server.middlewares.use(async (req, res, next) => {
                    if ((req.url || '').split('?')[0] !== '/__gauge/gaugebench.js') return next();
                    res.setHeader('Content-Type', 'text/javascript');
                    try {
                      res.end(await readFile(CLIENT, 'utf8'));
                    } catch (e) {
                      res.statusCode = 500;
                      res.end(`console.error("gaugebench: ${e && e.message}")`);
                    }
                  });
                },
              },
            ],
          },
        });

        injectScript(
          'head-inline',
          `(function(){
  var q = new URLSearchParams(location.search);
  if (!q.has('gauge')) return;

  /* Desktop only: the medallion, and therefore both circles, do not exist
     below 861px — the mobile hero uses its own small in-flow dial. */
  if (window.innerWidth < 901) {
    console.warn('gaugebench: desktop only — widen past 900px and reload.');
    return;
  }

  /* ?gauge=reset — drop saved knobs BEFORE the panel reads them, so the bench
     opens mirroring committed source exactly, then strip the value so a
     refresh does not wipe fresh work. */
  if (q.get('gauge') === 'reset') {
    try { localStorage.removeItem('gaugebench:v1'); } catch (e) {}
    var u = new URL(location.href);
    u.searchParams.set('gauge', '');
    history.replaceState(null, '', u.toString().replace('gauge=', 'gauge'));
  }

  var s = document.createElement('script');
  s.src = '/__gauge/gaugebench.js';
  s.defer = true;
  document.head.appendChild(s);
})();`
        );
      },
    },
  };
}
