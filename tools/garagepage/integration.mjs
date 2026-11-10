/* The long garage on the site, unlisted (Dan 2026-11-10: put the first page "in a hidden place" on the RevAudio
   website, to see how it loads live, on the internet, and on his phone). The room (tools/_home-opening: static HTML,
   no build step) is copied into dist/garage-9f3c/ at build time, the way gas2page does it: one source, the room stays
   where its sessions edit it, the site never carries a stale second copy.

     /garage-9f3c/          room.html, as is: the bench (T), ?lights=demo, ?lights=calm ... all work
     /garage-9f3c/<file>    what the room loads: street.js, lights/lights-on.js, layouts/, vendor/, assets/

   Hidden = unlisted, not private: nothing links to it, it is not in the sitemap (only Astro's own pages are), and its
   head says noindex. The repo is public, so anyone reading it can find the path.
   The room's dev material stays out: the kits, team, perf, blender, gen, notes, and the render and check scripts.
   Build only: in dev, serve the room as before (python3 -m http.server, /tools/_home-opening/room.html). */
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOM = fileURLToPath(new URL('../_home-opening/', import.meta.url));
const PATH = 'garage-9f3c';
const FILES = ['street.js', 'lights/lights-on.js'];
const DIRS = ['layouts', 'vendor', 'assets'];
const SKIP = /(\.(md|mjs|py)|\.DS_Store)$/; // layouts' rationale notes

// Served as /garage-9f3c (no slash, a host that does not redirect), every relative URL would miss the folder: the
// page puts the slash back before any of them loads (the same line as gas2page's).
const SLASH = `<script>if (!/(\\/|\\.html)$/.test(location.pathname)) location.replace(location.pathname + '/' + location.search + location.hash);</script>`;
// + the site's icon (the room names none, so the browser asks for /favicon.ico: a 404 on this site)
const HEAD = `<meta name="robots" content="noindex, nofollow">\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n${SLASH}`;

export default function garagepage() {
  return {
    name: 'garagepage',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(new URL(PATH + '/', dir));
        await mkdir(join(out, 'lights'), { recursive: true });
        const html = await readFile(join(ROOM, 'room.html'), 'utf8');
        if (!html.includes('</title>')) throw new Error('garagepage: room.html has no </title> to put the noindex after');
        await writeFile(join(out, 'index.html'), html.replace('</title>', '</title>\n' + HEAD));
        for (const f of FILES) await cp(join(ROOM, f), join(out, f));
        for (const d of DIRS) await cp(join(ROOM, d), join(out, d), { recursive: true, filter: (src) => !SKIP.test(src) });
        logger.info(`The long garage (unlisted) -> /${PATH}/`);
      },
    },
  };
}
