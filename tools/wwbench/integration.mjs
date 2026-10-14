/* Word-wall bench — tune the homepage word wall's DRIFT panel (WordWall.astro) on laptop and phone side by side.

   Why it is not the ?bench harness: the DRIFT panel has four looks (current / neon / steer / both) and lives in two
   layouts (laptop: words beside the window; phone: words over it, a touch entrance instead of pointer steering), and
   most of its tunables are motion, not placement. So the bench shows the REAL dev homepage twice, in a laptop-size and
   a phone-size iframe (same origin), scrolled to #sound with the DRIFT panel showing, and drives both from outside:
   the look attribute + one live <style> per frame setting the panel's --ww-* custom properties. The page's own code
   reads those properties when a gesture starts, so a slider change is live on the next hover / replay. Nothing in
   the page's code paths changes for the bench.

   Safety: `command !== 'dev'` bails, so it can never reach a build.

   Usage:  npm run dev, then http://localhost:4321/__wwbench
   Then:   pick a look · drag the sliders · hover the laptop frame to steer · REPLAY = power-on flicker (+ the phone's
           drift-in) · COPY SETTINGS and hand them back ("apply ww bench"). Work autosaves in this browser; RESET goes
           back to the defaults in WordWall.astro. */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PAGE = fileURLToPath(new URL('./wwbench.html', import.meta.url));

export default function wwbench() {
  return {
    name: 'wwbench',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        if (command !== 'dev') return;
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'wwbench-server',
                configureServer(server) {
                  server.middlewares.use(async (req, res, next) => {
                    if (!/^\/__wwbench\/?$/.test((req.url || '').split('?')[0])) return next();
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    try {
                      res.end(await readFile(PAGE, 'utf8'));
                    } catch (e) {
                      res.statusCode = 500;
                      res.end(`wwbench: ${e && e.message}`);
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
