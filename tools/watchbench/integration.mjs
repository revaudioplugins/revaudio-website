/* Watch bench — place + size the /drift "WATCH!" bursts (DriftPlayBurst) on laptop and phone side by side.

   Why it is not the ?bench harness: that one is desktop only (it bails under 901 px) and edits one page at one
   width. This bubble lives in four rules across two layouts (laptop: pinned to the TV's corner; phone: in flow),
   so the bench shows the REAL dev page twice, in a laptop-size and a phone-size iframe (same origin), and drives
   both from outside with one live <style> per frame. Nothing is injected into the page itself.

   Safety: `command !== 'dev'` bails, so it can never reach a build.

   Usage:  npm run dev, then http://localhost:4321/__watchbench
   Then:   click a bubble · drag = move · blue corner dot = resize · arrows / -+ for fine steps · COPY CSS and hand
           it back ("apply watch bench"). Work autosaves in this browser; "Reset all" goes back to drift.css. */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PAGE = fileURLToPath(new URL('./watchbench.html', import.meta.url));

export default function watchbench() {
  return {
    name: 'watchbench',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        if (command !== 'dev') return;
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'watchbench-server',
                configureServer(server) {
                  server.middlewares.use(async (req, res, next) => {
                    if (!/^\/__watchbench\/?$/.test((req.url || '').split('?')[0])) return next();
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    try {
                      res.end(await readFile(PAGE, 'utf8'));
                    } catch (e) {
                      res.statusCode = 500;
                      res.end(`watchbench: ${e && e.message}`);
                    }
                  });
                },
              },
            ],
          },
        });
      },
    },
  };
}
