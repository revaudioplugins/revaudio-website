// G0 Static + honesty (plan §4 G0, with the "Read first" corrections: the JS chunks and the text after interaction are read too).
//   node G0.cjs <base> [--engines chromium,webkit] [--plant aax|aax-js|buynow|notify|trialpromise|trial-js|emaillabel|sitemap]
//   node G0.cjs <fixtureBase> --phase open|released     (the phase fixture: Gfixture.sh)
//   [--sitemap <file-or-url>] [--dist <dir>]
// Checks: the page's HTML, EVERY js file it loads (followed through imports; comments stripped), the rendered text after
// interaction (hero key, engine, keys, presets, both forms with a bad and a good email), the field's accessible name,
// robots noindex, the sitemap, assertWidebeamConfig() on the data module (the shipped config passes, bad configs throw).
const fs = require('fs');
const path = require('path');
const G = require('./Glib.cjs');
const A = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i < 0 ? d : process.argv[i + 1]; };
const GATE = 'G0';
const PHASE_ARG = A('phase', null);

const dataSrc = () => fs.readFileSync(path.join(G.REPO, 'src/data/widebeam.ts'), 'utf8');
const flagOf = (name) => { const m = dataSrc().match(new RegExp(name + ':\\s*([^,\\s]+)')); return m ? m[1] : null; };
const phaseOnPage = PHASE_ARG || (dataSrc().match(/phase:\s*'(\w+)'\s+as WidebeamPhase/) || [])[1] || 'preopen';
const aaxReady = flagOf('aaxReady') === 'true';
const buyable = phaseOnPage === 'released';

// text a visitor can read or a screen reader gets: the HTML without script/style bodies, comments kept out, attributes kept
// the WIDE BEAM page's own markup only: the footer, the cart catalogue and the legal modal are site furniture (they name AAX for other plugins)
const pageSubtree = (html) => {
  const clean = html.replace(/<script[\s\S]*?<\/script>/g, (m) => ' '.repeat(0)).replace(/<style[\s\S]*?<\/style>/g, '');
  const i = clean.search(/<div[^>]*\sdata-wb-page[\s>]/); if (i < 0) return '';
  let depth = 0; const re = /<div\b|<\/div>/g; re.lastIndex = i; let m;
  while ((m = re.exec(clean))) { depth += m[0] === '</div>' ? -1 : 1; if (depth === 0) return clean.slice(i, m.index + 6); }
  return clean.slice(i);
};
const headMeta = (html) => (html.match(/<title>[\s\S]*?<\/title>|<meta[^>]*(?:description|og:|twitter:)[^>]*>/g) || []).join(' ');
const visibleHtml = (html) => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/&middot;|&#183;/g, '·').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');

const CRUISE_SWITCH = /CRUISE[^.]{0,40}\b(is a switch|switch(es)? (it )?off|turn(s)? (it )?off|on\/off|off by default)|\b(switch|turn) (CRUISE|TRACTION) (on|off)/i;
const TRACTION_CONTROL = /TRACTION(?! (is gone|was removed|is removed|has gone))/;
// banned in EVERY phase (a chunk may hold the words of a phase it is not in, so the chunks are only judged on these)
const ALWAYS = [
  [/Buy now/i, '"Buy now"'], [/Notify me/i, '"Notify me"'], [/rolls straight into the full version/i, 'trial rolls into the full version'],
  [/download link here/i, 'field name promises a download link'],
  // CRUISE has no control since 0.10.0 and is always on (README), and TRACTION is gone: the stale claims are 0.9.0's switches
  [CRUISE_SWITCH, 'CRUISE as a switch (0.9.0; no control since 0.10.0)'], [TRACTION_CONTROL, 'TRACTION as a control (removed in 0.10.0)'],
  [/leaves your track exactly as it was/i, '"100 leaves your track exactly as it was"'],
  [/never get printed into your mix/i, '"never get printed into your mix"'],
];
// banned while nothing can be downloaded (preopen)
const PREOPEN = [[/getting-started|getting started emails/i, 'getting-started emails'], [/heads-up before your trial ends|trial-ends|your trial ends/i, 'trial-end heads-up'], [/Start (your )?free trial|Start the free trial/i, 'start-the-trial key'], [/Get your free \d+-day trial/i, '"Get your free 30-day trial"'], [/check your inbox/i, 'a download link is "on its way"']];
const scanText = (txt, { aax, js }) => {
  const bad = [];
  let t = txt;
  if (js) t = t.replace(/VST3 · AU · AAX|VST3 · AAX|VST3 \\u00b7 AU \\u00b7 AAX|VST3 \\u00b7 AAX/g, ''); // the two phase-gated format literals the data module owns
  if (aax && /AAX/.test(t)) bad.push('AAX x' + (t.match(/AAX/g) || []).length);
  for (const [re, name] of ALWAYS) if (re.test(t)) bad.push(name);
  if (!buyable && !js) for (const [re, name] of [[/Buy now/i, 'Buy now']].slice(0, 0)) if (re.test(t)) bad.push(name);
  if (phaseOnPage === 'preopen' && !js) for (const [re, name] of PREOPEN) if (re.test(t)) bad.push(name);
  return [...new Set(bad)];
};

// ---- a tiny loader for the data module (esbuild is in the repo's node_modules) ----
function loadData(mutate) {
  const esbuild = require('esbuild');
  let src = dataSrc(); if (mutate) src = mutate(src);
  const out = esbuild.transformSync(src, { loader: 'ts', format: 'cjs' }).code;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', out)((id) => { if (/site$/.test(id)) return { site: { downloadGate: { workerUrl: 'https://worker.invalid' } } }; throw new Error('data module imports ' + id); }, mod, mod.exports);
  return mod.exports;
}

G.main(async () => {
  const base = G.BASE; if (!base) throw new Error('usage: node G0.cjs <base>');
  const tag = PHASE_ARG ? `[phase ${PHASE_ARG}] ` : '';
  const home = await G.fetchText(base + '/widebeam/');
  let html = home.body; if (G.ARGS.plant) html = G.plantText(G.ARGS.plant, base + '/widebeam/', html);
  G.ok(GATE, tag + 'page answers 200', home.status === 200, 'HTTP ' + home.status);
  const sub = pageSubtree(html);
  if (sub.length < 5000) return G.missing(GATE, tag + 'page markup', '[data-wb-page] subtree not found in the HTML (' + sub.length + ' chars)');
  const vis = visibleHtml(sub + ' ' + headMeta(html));

  // 1 honesty on the HTML
  await G.step(GATE, tag + 'honesty: HTML text + attributes', async () => {
    const bad = scanText(vis, { aax: !aaxReady, js: false });
    if (!buyable && /data-add-to-cart/.test(vis)) bad.push('an add-to-cart button while not buyable');
    if (!buyable && /\bBuy\b[^<]{0,40}\$\d/.test(vis)) bad.push('a "Buy ... $price" key');
    if (/data-wb-buy-soon|wb-buy-note/.test(vis)) bad.push('the old BUY placeholder');
    G.ok(GATE, tag + 'honesty: HTML text + attributes', bad.length === 0, bad.length ? 'found: ' + bad.join(', ') : `phase ${phaseOnPage}, aaxReady ${aaxReady}: clean`);
  });

  // 1b the email fields' accessible names, read from the markup (label[for] or aria-label)
  await G.step(GATE, tag + 'email field name in the HTML is "Your email"', async () => {
    const fields = [...sub.matchAll(/<input\b[^>]*type="email"[^>]*>/g)].map((m) => m[0]);
    if (!fields.length) return G.missing(GATE, tag + 'email field name in the HTML is "Your email"', 'no input[type=email] in the page');
    const names = fields.map((f) => { const id = (f.match(/\sid="([^"]+)"/) || [])[1]; const al = (f.match(/\saria-label="([^"]*)"/) || [])[1]; const l = id && sub.match(new RegExp('<label[^>]*for="' + id + '"[^>]*>([\\s\\S]*?)</label>')); return { id, name: (al != null ? al : (l ? l[1].replace(/<[^>]+>/g, '') : '')).trim(), aria: al != null }; });
    const wrong = names.filter((n) => n.name !== 'Your email');
    G.ok(GATE, tag + 'email field name in the HTML is "Your email"', wrong.length === 0, names.map((n) => `${n.id}="${n.name}"${n.aria ? ' (aria-label)' : ''}`).join('; '));
  });

  // 2 honesty on the JS the page loads
  await G.step(GATE, tag + 'honesty: every JS file the page loads', async () => {
    const { files, inline } = await G.crawlJs(base, html, G.ARGS.plant);
    const wb = files.filter((f) => /widebeam|_astro\//i.test(f.url) && !/node_modules/.test(f.url));
    if (wb.length < 3) return G.missing(GATE, tag + 'honesty: every JS file the page loads', `crawl found only ${wb.length} widebeam script files (expected the boot + modules)`);
    const bad = [];
    const ours = (f) => /widebeam/i.test(f.url) || /data-wb-|WideBeam|wb-page|wb-hit/.test(f.body);
    for (const f of [...files.filter((f) => !/node_modules/.test(f.url)), ...inline.map((b, i) => ({ url: 'inline#' + i, body: b }))].filter(ours)) {
      const hits = scanText(G.stripComments(f.body), { aax: !aaxReady, js: true });
      if (hits.length) bad.push(`${f.url.split('?')[0].split('/').slice(-2).join('/')}: ${hits.join(', ')}`);
    }
    G.ok(GATE, tag + 'honesty: every JS file the page loads', bad.length === 0, bad.length ? bad.join(' | ') : `${files.length} js files read, ${wb.length} widebeam ones judged, clean`);
  });

  // 3 robots noindex (+ the sitemap)
  await G.step(GATE, tag + 'robots noindex on the page', async () => {
    const m = html.match(/<meta[^>]*name="robots"[^>]*>/i);
    G.ok(GATE, tag + 'robots noindex on the page', !!m && /noindex/i.test(m[0]), m ? m[0].slice(0, 90) : 'no robots meta');
  });
  if (!PHASE_ARG) await G.step(GATE, 'sitemap has no /widebeam/', async () => {
    let src = null, where = '';
    const arg = A('sitemap', null);
    if (arg) { src = /^https?:/.test(arg) ? (await G.fetchText(arg)).body : fs.readFileSync(arg, 'utf8'); where = arg; }
    if (src == null) { const r = await G.fetchText(base + '/sitemap-0.xml').catch(() => null); if (r && r.status === 200 && /<urlset/.test(r.body)) { src = r.body; where = base + '/sitemap-0.xml'; } }
    const dist = A('dist', path.join(G.REPO, 'dist'));
    if (src == null && fs.existsSync(path.join(dist, 'sitemap-0.xml'))) { src = fs.readFileSync(path.join(dist, 'sitemap-0.xml'), 'utf8'); where = path.join(dist, 'sitemap-0.xml'); }
    if (G.ARGS.plant === 'sitemap') src = (src || '<urlset>') + '<url><loc>https://revaudio.net/widebeam/</loc></url>';
    if (src == null) return G.skip(GATE, 'sitemap has no /widebeam/', 'no sitemap to read: the dev server has none and dist/ is not built (pass --sitemap or build first)');
    const locs = [...src.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const hit = locs.filter((l) => /\/widebeam(\/|$)/.test(l));
    G.ok(GATE, 'sitemap has no /widebeam/', hit.length === 0, `${locs.length} urls in ${where.replace(/^.*\/(dist\/)/, '$1')}${hit.length ? ', LISTS ' + hit.join(' ') : ''}`);
  });

  // 4 dist (the built page and its chunks), when a build exists
  if (!PHASE_ARG) await G.step(GATE, 'dist build: honesty on dist/widebeam + its chunks', async () => {
    const dist = A('dist', path.join(G.REPO, 'dist')); const f = path.join(dist, 'widebeam', 'index.html');
    if (!fs.existsSync(f)) return G.skip(GATE, 'dist build: honesty on dist/widebeam + its chunks', 'dist/widebeam/index.html not built');
    let h = fs.readFileSync(f, 'utf8'); if (G.ARGS.plant) h = G.plantText(G.ARGS.plant, 'dist', h);
    const bad = scanText(visibleHtml(pageSubtree(h) + ' ' + headMeta(h)), { aax: !aaxReady, js: false });
    // chunks the built page loads (script src + modulepreload) and their imports
    const seen = new Set(); const q = [...h.matchAll(/(?:src|href)="(\/_astro\/[^"?]+\.js)/g)].map((m) => m[1]); let n = 0;
    while (q.length && n++ < 200) { const u = q.shift(); if (seen.has(u)) continue; seen.add(u); const p = path.join(dist, u); if (!fs.existsSync(p)) continue; let b = fs.readFileSync(p, 'utf8'); if (G.ARGS.plant === 'aax-js' && /widebeam|init/i.test(u)) b += 'const x="Pro Tools (AAX)"'; for (const m of b.matchAll(/["'](?:\.\/|\/_astro\/)([\w.-]+\.js)["']/g)) q.push('/_astro/' + m[1]); if (!/widebeam|data-wb-|WideBeam|wb-page|wb-hit/i.test(u + b.slice(0, 60000))) continue; const hits = scanText(G.stripComments(b), { aax: !aaxReady, js: true }); if (hits.length) bad.push(u.split('/').pop() + ': ' + hits.join(', ')); }
    G.ok(GATE, 'dist build: honesty on dist/widebeam + its chunks', bad.length === 0, bad.length ? bad.join(' | ') : `dist page + ${seen.size} chunks, clean`);
  });

  // 5 assertWidebeamConfig + the format flags + the pre-open words, on the data module itself
  if (!PHASE_ARG) await G.step(GATE, 'assertWidebeamConfig: ships green, refuses bad configs', async () => {
    const d = loadData();
    let shipped = 'ok'; try { d.assertWidebeamConfig(); } catch (e) { shipped = 'THROWS ' + e.message; }
    const cases = [
      ['open without gateWired', { phase: 'open', gateWired: false }],
      ['released without a price', { phase: 'released', gateWired: true, winInstallTested: true, priceUsd: null, paddlePriceId: null }],
      ['released without winInstallTested', { phase: 'released', gateWired: true, priceUsd: 9, paddlePriceId: 'pri_x', winInstallTested: false }],
      ['released without gateWired', { phase: 'released', gateWired: false, priceUsd: 9, paddlePriceId: 'pri_x', winInstallTested: true }],
      ['listed before released', { phase: 'open', gateWired: true, listed: true }],
      ['an unknown phase', { phase: 'beta' }],
    ];
    const notRefused = [];
    for (const [name, patch] of cases) { let threw = false; try { d.assertWidebeamConfig({ ...d.widebeam, ...patch }); } catch { threw = true; } if (!threw) notRefused.push(name); }
    let routeClash = false; try { d.assertWidebeamConfig(d.widebeam, { pluginSlugs: ['widebeam'], ownRoute: [] }); } catch { routeClash = true; }
    if (!routeClash) notRefused.push('plugins.ts entry without OWN_ROUTE');
    let goodReleased = 'ok'; try { d.assertWidebeamConfig({ ...d.widebeam, phase: 'released', gateWired: true, priceUsd: 9, paddlePriceId: 'pri_x', winInstallTested: true }); } catch (e) { goodReleased = 'THROWS ' + e.message; }
    G.ok(GATE, 'assertWidebeamConfig: ships green, refuses bad configs', shipped === 'ok' && !notRefused.length && goodReleased === 'ok', `shipped: ${shipped}; not refused: ${notRefused.join(', ') || 'none'}; a complete released config: ${goodReleased}`);
    const d2 = loadData((s) => s.replace('aaxReady: false', 'aaxReady: true'));
    const on = d2.formatsLine(), off = d.formatsLine();
    G.ok(GATE, 'formats come from the flags (no AAX while aaxReady is false)', !/AAX/.test(off) && /AAX/.test(on), `aaxReady false: "${off}"; true: "${on}"`);
    const pre = d.askFor('preopen'); const preTxt = Object.values(pre).filter((v) => typeof v === 'string').join(' | ');
    const bad = PREOPEN.filter(([re]) => re.test(preTxt)).map(([, n]) => n);
    G.ok(GATE, 'pre-open words make no trial-download promise', bad.length === 0, bad.length ? bad.join(', ') : 'askFor(preopen) is clean');
  });

  // 6 the rendered text after interaction + the field's accessible name (browser)
  for (const engine of (process.argv.includes('--static') ? [] : G.ARGS.engines)) await G.step(GATE, `${tag}rendered text after interaction [${engine}]`, async () => {
    const b = await G.launch(engine);
    try {
      const { ctx, page } = await G.page(b, engine, 'L1141', { plant: G.ARGS.plant });
      await G.goto(page, base, '/widebeam', 2000);
      await page.keyboard.press('Escape'); await G.hideCookie(page);
      // the field's accessible name: exactly "Your email", from the label (read before the forms hide themselves)
      const names = await page.evaluate(() => [...document.querySelectorAll('[data-wb-page] input[type=email]')].map((e) => { const al = e.getAttribute('aria-label'); const l = e.id && document.querySelector(`label[for="${e.id}"]`); return { id: e.id, name: (al || (l && l.textContent) || '').trim(), viaAria: !!al }; }));
      const roles = await page.locator('[data-wb-page]').getByRole('textbox', { name: 'Your email', exact: true }).count();
      const wrong = names.filter((n) => n.name !== 'Your email');
      G.ok(GATE, `${tag}email field accessible name is "Your email" [${engine}]`, names.length > 0 && wrong.length === 0 && roles === names.length, names.length ? `${names.length} field(s): ` + names.map((n) => `${n.id || '?'}="${n.name}"${n.viaAria ? ' (aria-label)' : ''}`).join('; ') + `; by role: ${roles}` : 'no email field found');
      let seen = '';
      const harvest = async () => { seen += '\n' + (await page.evaluate(() => {
        const root = document.querySelector('[data-wb-page]') || document.body;
        const out = [root.innerText];
        root.querySelectorAll('[aria-label],[title],[alt],[aria-description],[data-msg-ok],[data-msg-already]').forEach((e) => out.push(['aria-label', 'title', 'alt', 'aria-description', 'data-msg-ok', 'data-msg-already'].map((a) => e.getAttribute(a) || '').join(' ')));
        root.querySelectorAll('[aria-describedby],[aria-labelledby]').forEach((e) => { for (const a of ['aria-describedby', 'aria-labelledby']) (e.getAttribute(a) || '').split(/\s+/).forEach((id) => { const t = document.getElementById(id); if (t) out.push(t.textContent); }); });
        root.querySelectorAll('[role=status],[aria-live]').forEach((e) => out.push(e.textContent));
        return out.join('\n');
      })); };
      await harvest();
      const tryDo = async (fn) => { try { await fn(); } catch {} await G.sleep(500); await harvest(); };
      await tryDo(() => page.click('[data-wb-start]', { timeout: 2500 }));
      await tryDo(() => page.click('[data-wb-sound]', { timeout: 2500 })); // was the engine key (removed 2026-11-21): SOUND stops what the drive started
      for (const k of ['h', 'm', 's', 'p']) await tryDo(() => page.keyboard.press(k));
      for (const i of [3, 11]) await tryDo(() => page.evaluate((i) => document.querySelector(`[data-preset="${i}"]`).click(), i));
      await tryDo(() => page.click('[data-wb-buy-soon]', { timeout: 800 }));
      for (const [inp, form] of [['#wb-trial-email', '[data-wb-trial]'], ['#wb-email', '[data-wb-form]'], ['form input[type=email] >> nth=0', 'form']]) {
        if (!(await page.locator(inp).count())) continue;
        for (const email of ['nope', `gate-${Date.now() % 1e6}@example.com`]) {
          await tryDo(async () => { await page.locator(inp).first().evaluate((e) => e.scrollIntoView({ block: 'center' })); await page.fill(inp, email); await page.press(inp, 'Enter'); await G.sleep(700); });
        }
      }
      const bad = scanText(seen, { aax: !aaxReady, js: false });
      // the visible BUY note a buy placeholder used to print
      if (!buyable && /rolls straight|Checkout opens on launch day/i.test(seen)) bad.push('a BUY placeholder note');
      G.ok(GATE, `${tag}rendered text after interaction [${engine}]`, bad.length === 0, bad.length ? 'found: ' + bad.join(', ') : `${seen.length} chars of text + labels + live regions read after hero key, engine, keys, presets, both forms: clean`);

      await ctx.close();
    } finally { await b.close(); }
  });

  // 7 the phase fixture: every surface reads the one phase
  if (PHASE_ARG) await G.step(GATE, tag + 'one ask across hero key / plate / closer / bar', async () => {
    const b = await G.launch('chromium');
    try {
      const { ctx, page } = await G.page(b, 'chromium', 'P390');
      await G.goto(page, base, '/widebeam', 2000); await G.hideCookie(page);
      const r = await page.evaluate(() => {
        const t = (s) => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
        return { hero: t('[data-wb-start] [data-face]') || t('[data-wb-start]'), plate: t('[data-wb-trial] button[type=submit]'), closer: t('[data-wb-form] button[type=submit]'), bar: (document.querySelector('[data-wb-bar],[data-wb-sticky],.wb-bar,.wb-sticky-bar,.wb-stickybar') || {}).textContent, buy: !!document.querySelector('[data-add-to-cart]'), buyText: t('.wb-buy'), body: document.body.innerText };
      });
      const want = PHASE_ARG === 'preopen' ? /Email me at launch/ : /Start your free trial/;
      const bad = [];
      if (!want.test(r.plate || '')) bad.push(`plate key "${r.plate}"`);
      if (!want.test(r.closer || '')) bad.push(`closer key "${r.closer}"`);
      if (r.bar && !want.test(r.bar)) bad.push(`bar "${r.bar.trim().slice(0, 40)}"`);
      if (PHASE_ARG === 'open' && !/Start your free trial/i.test(r.hero || '') && !/Start your free trial/.test(r.body)) bad.push('the trial key is not on the page');
      if (PHASE_ARG === 'open' && r.buy) bad.push('a BUY key while only open');
      if (PHASE_ARG === 'released' && !r.buy) bad.push('no BUY key in released');
      if (PHASE_ARG === 'released' && !/\$\d/.test(r.buyText || '')) bad.push(`BUY key shows no price: "${r.buyText}"`);
      if (PHASE_ARG === 'released' && !/No iLok/.test(r.body)) bad.push('no trust strip');
      if (/AAX/.test(r.body) && !aaxReady) bad.push('AAX');
      G.ok(GATE, tag + 'one ask across hero key / plate / closer / bar', bad.length === 0, bad.length ? bad.join('; ') : `hero "${r.hero}" | plate "${r.plate}" | closer "${r.closer}" | bar ${r.bar ? 'yes' : 'none yet'}`);
      await ctx.close();
    } finally { await b.close(); }
  });
});
