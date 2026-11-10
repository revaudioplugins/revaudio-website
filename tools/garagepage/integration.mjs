/* The long garage on the site, unlisted (Dan 2026-11-10: put the first page "in a hidden place" on the RevAudio
   website, to see how it loads live, on the internet, and on his phone). The room (tools/_home-opening: static HTML,
   no build step) is copied into dist/garage-9f3c/ at build time, the way gas2page does it: one source, the room stays
   where its sessions edit it, the site never carries a stale second copy.

     /garage-9f3c/          room.html: the bench (T), ?lights=demo, ?lights=calm ... all work
     /garage-9f3c/<file>    what the room loads: street.js, lights/lights-on.js, layouts/, vendor/, assets/

   Hidden = unlisted, not private: nothing links to it, it is not in the sitemap (only Astro's own pages are), and its
   head says noindex. The repo is public, so anyone reading it can find the path.
   The site's Content-Security-Policy (a Cloudflare header on every response) allows scripts, styles and fonts from the
   site itself only, so the copy swaps the room's two outside hosts for the site's own files: the Google Fonts link for
   the site's @font-face rules of the same families (from the built CSS, files in /_astro/), jsDelivr's Lenis for
   node_modules/lenis (the site's pin). The textures (blob: URLs) and the meshopt decoder (WebAssembly) need three words
   in that header: the shared repo's collaboration/handoffs/2026-11-10-yoni-csp-room/handoff-yoni.md.
   The room's dev material stays out: the kits, team, perf, blender, gen, notes, and the render and check scripts.
   Build only: in dev, serve the room as before (python3 -m http.server, /tools/_home-opening/room.html). */
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOM = fileURLToPath(new URL('../_home-opening/', import.meta.url));
const LENIS = fileURLToPath(new URL('../../node_modules/lenis/', import.meta.url));
const PATH = 'garage-9f3c';
const FILES = ['street.js', 'lights/lights-on.js'];
const DIRS = ['layouts', 'vendor', 'assets'];
const SKIP = /(\.(md|mjs|py)|\.DS_Store)$/; // layouts' rationale notes

// Served as /garage-9f3c (no slash, a host that does not redirect), every relative URL would miss the folder: the
// page puts the slash back before any of them loads (the same line as gas2page's).
const SLASH = `<script>if (!/(\\/|\\.html)$/.test(location.pathname)) location.replace(location.pathname + '/' + location.search + location.hash);</script>`;
// + the site's icon (the room names none, so the browser asks for /favicon.ico: a 404 on this site)
const HEAD = `<meta name="robots" content="noindex, nofollow">\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n${SLASH}`;

// the site's own @font-face rules for these families, from the built CSS (deduped: some sit in two files)
async function siteFonts(dist, families) {
  const rules = new Map();
  const dir = join(dist, '_astro');
  for (const f of (await readdir(dir)).filter((n) => n.endsWith('.css'))) {
    for (const [r] of (await readFile(join(dir, f), 'utf8')).matchAll(/@font-face\s*\{[^}]*\}/g)) {
      const fam = (r.match(/font-family:\s*["']?([^;"']+)/) || [])[1];
      if (families.includes(fam)) rules.set(r, fam);
    }
  }
  return rules;
}

export default function garagepage() {
  return {
    name: 'garagepage',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const dist = fileURLToPath(dir), out = join(dist, PATH);
        await mkdir(join(out, 'lights'), { recursive: true });
        let html = await readFile(join(ROOM, 'room.html'), 'utf8');
        if (!html.includes('</title>')) throw new Error('garagepage: room.html has no </title> to put the noindex after');
        for (const f of FILES) await cp(join(ROOM, f), join(out, f));
        for (const d of DIRS) await cp(join(ROOM, d), join(out, d), { recursive: true, filter: (src) => !SKIP.test(src) });

        const gf = html.match(/<link[^>]+href="https:\/\/fonts\.googleapis\.com\/css2\?([^"]+)"[^>]*>/);
        if (gf) {
          const fams = [...gf[1].matchAll(/family=([^&:]+)/g)].map((m) => decodeURIComponent(m[1].replace(/\+/g, ' ')));
          const rules = await siteFonts(dist, fams), have = new Set(rules.values());
          const missing = fams.filter((f) => !have.has(f));
          if (missing.length) logger.warn(`the site has no ${missing.join(', ')}: the room keeps Google Fonts, which the live CSP blocks`);
          else html = html.replace(gf[0], `<style>/* the site's own files (the live CSP blocks Google Fonts) */\n${[...rules.keys()].join('\n')}\n</style>`)
            .replace(/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\n?/g, '');
        }
        const ln = html.match(/https:\/\/cdn\.jsdelivr\.net\/npm\/lenis@([\d.]+)\/dist\/lenis\.min\.js/);
        if (ln) {
          const v = JSON.parse(await readFile(join(LENIS, 'package.json'), 'utf8')).version;
          if (v !== ln[1]) logger.warn(`the room asks for Lenis ${ln[1]}, the site has ${v}: it gets the site's`);
          await cp(join(LENIS, 'dist/lenis.min.js'), join(out, 'vendor/lenis.min.js'));
          html = html.replace(ln[0], 'vendor/lenis.min.js');
        }
        const outside = [...new Set([...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]))];
        if (outside.length) logger.warn('outside hosts left, which the live CSP may block: ' + outside.join(' '));

        await writeFile(join(out, 'index.html'), html.replace('</title>', '</title>\n' + HEAD));
        logger.info(`The long garage (unlisted) -> /${PATH}/`);
      },
    },
  };
}
