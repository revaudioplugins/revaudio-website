/* The GAS 2 page on the site: Dan's station scene (tools/_gas2-scene, static HTML, no build step) served at /gas2/.

   One source: the scene stays where Dan's sessions edit it; this copies what the two pages load into dist/gas2/ at
   build time (and serves the same files from the dev server), so the site never carries a stale second copy.

     /gas2/                 page-b.html (the laptop page); a phone-width window goes on to postcards.html
     /gas2/postcards.html   the phone page
     /gas2/<asset>          fonts/, frames/, props/, player/, taxi/, drone/, postcards/img/ (no tools, reviews, notes)

   Both pages keep their relative URLs (player/radio.js, fonts/...), so they must be served from /gas2/ WITH the slash:
   GitHub Pages (and the dev server here) redirects /gas2 to /gas2/, so the TV's and the downloads' /gas2 links land right.
   What changes in the copy: the <title> + description (the files say "Mockup B"), the phone hop on the index, and the
   site's top bar on both pages (siteBar below). */
import { cp, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, normalize, extname } from 'node:path';

const SCENE = fileURLToPath(new URL('../_gas2-scene/', import.meta.url));
const DIRS = ['fonts', 'frames', 'props', 'player', 'taxi', 'drone', 'postcards/img'];
// inside DIRS: the art tools, review pages, notes and dev benches stay out of the site
const SKIP = /(^|\/)(tools|review|README\.md|\.gitignore|bench\.js|cam-bench\.js)(\/|$)/;

const TITLE = 'GAS 2 · Free master-bus color plugin · RevAudio';
const DESC = 'GAS 2: a free master-bus color plugin. One GAS dial, three grades of fuel. Thicker, smoother, glued master.';
// the laptop page is a 3:2 scene; under this width the postcards are the page (the same line as the phone layouts)
const PHONE_MQ = '(max-width: 760px)';

// Served as /gas2 (no slash: a host that does not redirect, like `astro preview`), every relative URL would miss the
// folder (/fonts/... 404, the scene loads bare). Before any of them loads, the page puts the slash back.
const SLASH = `<script>if (!/(\\/|\\.html)$/.test(location.pathname)) location.replace(location.pathname + '/' + location.search + location.hash);</script>`;

const head = (html, extra = '') =>
  html.replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>\n${SLASH}\n<meta name="description" content="${DESC}">${extra}`);

// The site's top bar (Gil 2026-11-04: without it the page has no way out but a download). Not a copy: the real
// Header, taken from a built site page (BAR_FROM: in the nav, so no link reads as the current page), with that page's
// stylesheets. It lives in a shadow root, so the site's global CSS and the scene's never touch each other. In there,
// :root never matches, so the token rules are repeated on :host; @font-face only works in the document, so those
// rules are lifted out. Header's own script looks for the nav in the document, so the menu button is wired here.
// The cart drawer is not on this page: its button goes to the home page's cart instead of doing nothing.
const BAR_FROM = 'terms/';
function siteBar(src) {
  const nav = (src.match(/<nav class="site-nav"[\s\S]*?<\/nav>/) || [])[0];
  if (!nav) return '';
  const headPart = src.slice(0, src.indexOf('</head>'));
  const css = [...headPart.matchAll(/<link[^>]+rel="stylesheet"[^>]*>|<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]).join('');
  return `<div id="site-bar" style="position:sticky;top:0;z-index:9"></div>
<template id="site-bar-t">${css}${nav}</template>
<script>(() => {
  const host = document.getElementById('site-bar'), sr = host.attachShadow({ mode: 'open' });
  sr.append(document.getElementById('site-bar-t').content.cloneNode(true));
  const extra = new CSSStyleSheet(), fonts = document.createElement('style');
  const lift = (rules, wrap) => { for (const r of rules) {
    if (r instanceof CSSFontFaceRule) fonts.textContent += r.cssText;
    else if (r instanceof CSSStyleRule && /:root/.test(r.selectorText)) { const t = r.cssText.replace(/:root/g, ':host'); try { extra.insertRule(wrap ? wrap(t) : t, extra.cssRules.length); } catch {} }
    else if (r instanceof CSSMediaRule) lift(r.cssRules, (t) => '@media ' + r.conditionText + '{' + t + '}');
  } };
  const done = () => { for (const sh of sr.styleSheets) try { lift(sh.cssRules); } catch {} sr.adoptedStyleSheets = [extra]; document.head.append(fonts); };
  const links = [...sr.querySelectorAll('link[rel=stylesheet]')];
  Promise.all(links.map((l) => l.sheet ? 0 : new Promise((ok) => { l.onload = l.onerror = ok; }))).then(done);
  const nav = sr.querySelector('[data-site-nav]'), burger = sr.querySelector('[data-nav-toggle]');
  const setOpen = (o) => { nav.classList.toggle('nav-open', o); burger && burger.setAttribute('aria-expanded', o ? 'true' : 'false'); };
  if (burger) burger.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!nav.classList.contains('nav-open')); });
  sr.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', (e) => { if (!e.composedPath().includes(host)) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('nav-open')) { setOpen(false); burger.focus(); } });
  const cart = sr.querySelector('[data-cart-toggle]');
  if (cart) cart.addEventListener('click', () => { location.href = '/?cart=open'; });
})();</script>`;
}
const withBar = (html, bar) => (bar ? html.replace(/<body[^>]*>/, (m) => m + '\n' + bar) : html);

async function page(name, bar = '') {
  const html = withBar(await readFile(join(SCENE, name), 'utf8'), bar);
  if (name === 'page-b.html') {
    return head(html, `\n<link rel="canonical" href="https://revaudio.net/gas2/">\n<script>if (matchMedia('${PHONE_MQ}').matches) location.replace('postcards.html' + location.search + location.hash);</script>`);
  }
  return head(html, `\n<link rel="canonical" href="https://revaudio.net/gas2/">`);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.m4a': 'audio/mp4', '.glb': 'model/gltf-binary',
  '.json': 'application/json', '.svg': 'image/svg+xml',
};

export default function gas2page() {
  return {
    name: 'gas2page',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        if (command !== 'dev') return;
        updateConfig({
          vite: {
            plugins: [{
              name: 'gas2page-server',
              configureServer(server) {
                server.middlewares.use(async (req, res, next) => {
                  const path = (req.url || '').split('?')[0];
                  if (path === '/gas2') { res.statusCode = 301; res.setHeader('Location', '/gas2/'); return res.end(); }
                  if (!path.startsWith('/gas2/')) return next();
                  const rel = normalize(decodeURIComponent(path.slice(6)) || 'index.html');
                  try {
                    if (rel === 'index.html' || rel === 'postcards.html') {
                      let bar = '';
                      try { bar = siteBar(await (await fetch(`http://${req.headers.host}/${BAR_FROM}`)).text()); } catch {}
                      res.setHeader('Content-Type', TYPES['.html']);
                      return res.end(await page(rel === 'index.html' ? 'page-b.html' : rel, bar));
                    }
                    if (rel.startsWith('..') || SKIP.test(rel) || !DIRS.some((d) => rel.startsWith(d + '/'))) return next();
                    const file = join(SCENE, rel);
                    if (!(await stat(file)).isFile()) return next();
                    res.setHeader('Content-Type', TYPES[extname(rel)] || 'application/octet-stream');
                    res.end(await readFile(file));
                  } catch {
                    next();
                  }
                });
              },
            }],
          },
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(new URL('gas2/', dir));
        await mkdir(out, { recursive: true });
        let bar = '';
        try { bar = siteBar(await readFile(fileURLToPath(new URL(BAR_FROM + 'index.html', dir)), 'utf8')); } catch {}
        if (!bar) logger.warn('GAS 2 page: no site top bar (no ' + BAR_FROM + ' page to take it from)');
        await writeFile(join(out, 'index.html'), await page('page-b.html', bar));
        await writeFile(join(out, 'postcards.html'), await page('postcards.html', bar));
        for (const d of DIRS) {
          await cp(join(SCENE, d), join(out, d), { recursive: true, filter: (src) => !SKIP.test(src.slice(SCENE.length)) });
        }
        logger.info('GAS 2 page -> /gas2/');
      },
    },
  };
}
