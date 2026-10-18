/* TV bench — tune the homepage TV (WordWall.astro: the plugin browser since feat/home-library, 2026-10-18) on laptop
   and phone side by side.

   Why it is not the ?bench harness: the TV lives in two layouts (laptop: the list beside the lit plugin; phone: one
   pane at a time) and part of what it tunes is motion (the static, the power-on). So the bench shows the REAL dev
   homepage twice, in a laptop-size and a phone-size iframe (same origin), scrolled to #plugins, and drives both from
   outside: the wall's data-ww-* attributes, the page's bench hooks (ww:select, ww:replay) and one live <style> per
   frame setting the wall's --ww-* custom properties. Nothing in the page's code paths changes for the bench.

   Safety: `command !== 'dev'` bails, so it can never reach a build.

   Usage:  npm run dev, then http://localhost:4321/__wwbench
   Then:   drag the sliders · pick a category / light a plugin (or click the frames: they are the real page) · REPLAY =
           the power-on · COPY SETTINGS and hand them back ("apply ww bench"). Work autosaves in this browser; RESET
           goes back to the defaults in WordWall.astro. */
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
