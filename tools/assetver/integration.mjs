/* assetver: puts ?v=<content hash> on the site's own URLs to the static folders below, after every other step of the build.

   GitHub Pages stamps every file with the deploy time and serves everything outside /_astro/ for 10 minutes, so after each
   deploy a returning visitor downloads all of it again, changed or not. A Cloudflare cache rule keeps a file under FOLDERS
   for a year when its URL carries ?v=; the version is the file's own hash, so a changed file gets a new URL.

   Rewritten: every .html (not the garage page, another session's) and the .css/.js inside FOLDERS. Never _astro/: its
   names are hashes already cached for a year, so its bytes must not change after naming. A file must be fetched under
   one URL only, or the browser downloads it twice: one whose name also turns up some other way keeps its plain URL
   everywhere (see plain below). A miss costs nothing; a wrong rewrite does. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const FOLDERS = ['station-mixer', 'gas-mixer', 'gas2', 'audio', 'fonts', 'drift'];
const FROZEN = /^(_astro|garage-9f3c)\//;
const TEXT = /\.(html|css|m?js|json|svg|xml|txt|vtt|webmanifest)$/;
// A whole URL: after a quote, url(, =, whitespace, a srcset comma or the ; of &quot;. It ends at a quote, ), whitespace,
// a comma, & (&quot;), < >, # (kept after the version) or \ (an escaped quote in a JS string). A URL that goes on with
// a ? already has a query and never matches; neither does a name built in code (`${IMG}x.webp`, AUD + n + EXT).
const URL_RE = /(?<=^|[ \t\n\r\f"'`(=,;])(?:\/|\.\.?\/)?[\w.~%-]+(?:\/[\w.~%-]+)*(?=[ \t\n\r\f"'`)\\,&<>#]|$)/g;

const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 10);
const walk = (root, dir = '') => readdirSync(join(root, dir), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(root, dir + e.name + '/') : [dir + e.name]));
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function assetver() {
  return {
    name: 'assetver',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir), files = walk(root).sort();
        const read = (f) => readFileSync(join(root, f));
        const frozen = files.filter((f) => FROZEN.test(f)).map((f) => [f, hash(read(f))]);
        // latin1 reads and writes every byte back as it was
        const text = new Map(files.filter((f) => TEXT.test(f)).map((f) => [f, read(f).toString('latin1')]));
        const inFolders = (f) => FOLDERS.some((d) => f.startsWith(d + '/'));
        let targets = new Set(files.filter((f) => inFolders(f) && !f.endsWith('.html')));

        const editable = (f) => (f.endsWith('.html') ? !FROZEN.test(f) : inFolders(f) && /\.(css|m?js)$/.test(f));
        // relative URLs only in HTML and CSS: in a script they resolve against whichever page runs it
        const target = (f, url) => {
          if (url[0] !== '/' && !/\.(html|css)$/.test(f)) return null;
          const t = posix.resolve('/', posix.dirname(f), url).slice(1);
          return targets.has(t) && t !== f ? t : null;   // a file cannot carry its own hash: naming itself keeps it plain
        };

        // Once the URLs we rewrite are taken out, a name still there is used some other way: written out by a script
        // (`${IMG}x.webp`), in _astro or the garage page, relative inside a script. So is a name a script builds from a
        // fixed start and end (`poster-mail-${n}.webp`). Such a file keeps its one plain URL everywhere.
        const names = [...new Set([...targets].map((t) => posix.basename(t)))].sort((x, y) => y.length - x.length);   // x.json before x.js
        const NAME_RE = new RegExp(`(?<![\\w.-])(?:${names.map(escape).join('|')})`, 'g');
        const BUILT = /([\w.-]*)(?:\$\{[^}]*\}|['"]\s*\+[^'"\n]*\+\s*['"])([\w.-]*\.\w+)/g;
        const plain = new Set();
        for (const [f, s] of text) {
          const rest = editable(f) ? s.replace(URL_RE, (u) => (target(f, u) ? '' : u)) : s;
          for (const [m] of rest.matchAll(NAME_RE)) plain.add(m);
          for (const [, a, b] of rest.matchAll(BUILT)) {
            if (a || b.lastIndexOf('.') > 0) for (const n of names) if (n.startsWith(a) && n.endsWith(b)) plain.add(n);
          }
        }
        targets = new Set([...targets].filter((t) => !plain.has(posix.basename(t))));

        // A text file's version is taken after its own URLs got theirs, so a changed image also changes the CSS that names it.
        const version = new Map(), busy = new Set(), wrote = new Map();
        let refs = 0, changed = 0;
        const rewrite = (f) => {
          const s = text.get(f).replace(URL_RE, (u) => {
            const t = target(f, u);
            if (!t) return u;
            refs++;
            wrote.set(t, versionOf(t));
            return `${u}?v=${wrote.get(t)}`;
          });
          if (s === text.get(f)) return;
          text.set(f, s);
          writeFileSync(join(root, f), s, 'latin1');
          changed++;
        };
        const versionOf = (t) => {
          if (version.has(t)) return version.get(t);
          if (busy.has(t)) throw new Error(`assetver: ${[...busy, t].join(' -> ')} name each other in a loop`);
          busy.add(t);
          if (editable(t)) rewrite(t);
          busy.delete(t);
          version.set(t, hash(text.has(t) ? Buffer.from(text.get(t), 'latin1') : read(t)));
          return version.get(t);
        };
        for (const t of targets) versionOf(t);
        for (const f of files) if (editable(f) && !version.has(f)) rewrite(f);   // the pages, and scripts kept plain

        for (const [t, v] of wrote) if (hash(read(t)) !== v) throw new Error(`assetver: ${t}?v=${v} is not that file's hash`);
        for (const [f, h] of frozen) if (hash(read(f)) !== h) throw new Error(`assetver: ${f} changed, it must not`);
        logger.info(`${refs} refs in ${changed} files, ${wrote.size} files versioned (${plain.size} names kept plain)`);
      },
    },
  };
}
