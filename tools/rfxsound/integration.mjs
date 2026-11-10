/* RevFX scroll-sound bench — hear the #pedals knobs (MEET THE FIVE, "Scroll is the knob") on the real /revfx page.

   Why its own page: the thing being tuned is sound that follows the scroll, so the bench shows the REAL dev /revfx in a
   same-origin iframe (scroll it like a visitor), reads which pedal is on stage and where its knob is, and feeds that to
   the engine (src/lib/revfx/scrollsound.ts) running in the bench page. The page's own code is unchanged: nothing in
   /revfx imports the engine until the sound is approved.

   Safety: `command !== 'dev'` bails, so it can never reach a build.

   Usage:  npm run dev, then http://localhost:4321/__rfxsound
   Then:   SOUND ON · scroll inside the frame (or TOUR / the KNOB slider / 01-05) · tune the sliders · COPY SETTINGS and
           hand them back ("apply rfx sound bench"). Work autosaves in this browser; RESET = the engine's defaults. */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PAGE = fileURLToPath(new URL('./rfxsound.html', import.meta.url));

export default function rfxsound() {
  return {
    name: 'rfxsound',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        if (command !== 'dev') return;
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'rfxsound-server',
                configureServer(server) {
                  server.middlewares.use(async (req, res, next) => {
                    if (!/^\/__rfxsound\/?$/.test((req.url || '').split('?')[0])) return next();
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    try {
                      res.end(await readFile(PAGE, 'utf8'));
                    } catch (e) {
                      res.statusCode = 500;
                      res.end(`rfxsound: ${e && e.message}`);
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
