/* TV bench — tune the homepage TV (WordWall.astro: the plugin browser since feat/home-library, 2026-10-18) on laptop
   and phone side by side.

   Why it is not the ?bench harness: the TV lives in two layouts (laptop: the list beside the lit plugin; phone: one
   pane at a time) and part of what it tunes is motion (the channel change, the power-on). So the bench shows the REAL dev
   homepage twice, in a laptop-size and a phone-size iframe (same origin), scrolled to #plugins, and drives both from
   outside: the wall's data-ww-* attributes, the page's bench hooks (ww:select, ww:replay) and one live <style> per
   frame setting the wall's --ww-* custom properties. Nothing in the page's code paths changes for the bench.

   Safety: `command !== 'dev'` bails, so it can never reach a build.

   Usage:  npm run dev, then http://localhost:4321/__wwbench
   Then:   drag the sliders · pick a category / light a plugin (or click the frames: they are the real page) · REPLAY =
           the power-on · ▶ CHANNEL = the next plugin, a channel change (SLOW ×4 to study it, AUTO to keep changing) ·
           COPY SETTINGS and hand them back ("apply ww bench"). Work autosaves in this browser; RESET goes back to the
           defaults in WordWall.astro. */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/* /__wwkeys (Dan 2026-11-04): the TV's Try + Product page keys, today beside three on-screen options, on the real page */
const PAGES = {
  __wwbench: fileURLToPath(new URL('./wwbench.html', import.meta.url)),
  __wwkeys: fileURLToPath(new URL('./wwkeys.html', import.meta.url)),
  /* /__wwsignup (Dan 2026-11-08, Phase 5 step 2): three looks for the sign-up on the TV's screen, on the real page */
  __wwsignup: fileURLToPath(new URL('./wwsignup.html', import.meta.url)),
};

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
                    const m = /^\/(__wwbench|__wwkeys|__wwsignup)\/?$/.exec((req.url || '').split('?')[0]);
                    if (!m) return next();
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    try {
                      res.end(await readFile(PAGES[m[1]], 'utf8'));
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
