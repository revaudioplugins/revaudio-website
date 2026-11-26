// tools/wwbench/bundle-options.cjs: the three rough looks for the bundle inside the TV (A Channel 00, B Teletext page,
// C Live), drawn into the real page on the dev server by cloning the TV's own parts; Dan's pick page 2026-11-25.
// Dev only, not part of the site. Run: npm run dev, then
//   NODE_PATH=node_modules node tools/wwbench/bundle-options.cjs <out dir> [shot-id filter]   (BASE below = the dev port)
// The bundle INSIDE the home/plugins TV: three rough design options, drawn into the real page (dev server) by
// cloning the TV's own parts (so they keep its scoped styles) and adding each option's picture. Throwaway: nothing
// here goes into the repo. Shots: Chromium (Dan's Chrome) at 1312x734 (laptop) and 390x844 (phone), DPR 2.
//   node tv-options.cjs <out dir> [only-id-substring]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2], ONLY = process.argv[3] || '';
const BASE = 'http://127.0.0.1:4392';
fs.mkdirSync(OUT, { recursive: true });

const seed = `(() => { try { localStorage.setItem('ra-cookie-consent','declined'); localStorage.setItem('ra-welcome10','got');
  localStorage.setItem('sale-intro-bf-2026','1'); localStorage.setItem('sale-intro-cm-2026','1'); localStorage.setItem('revaudio_cart_v2','[]'); } catch (e) {} })()`;

const CSS = `
/* ── shared: the BUNDLES tab and the bundle's channel in the strip / list ── */
.ww .bx-cat { outline: 2px solid var(--ww-ink-hot) !important; outline-offset: 3px; animation: bxBlink 1.1s steps(1) 5; }
@keyframes bxBlink { 50% { background: transparent; color: var(--ww-ink-hot); box-shadow: none; } }
@media (prefers-reduced-motion: reduce) { .ww .bx-cat { animation: none; } }
.ww .bx-cat .bx-dot { display: inline-block; width: .5em; height: .5em; margin-right: .35em; border-radius: 50%; background: #ff3b2f; box-shadow: 0 0 8px #ff3b2f, 0 0 18px rgba(255, 59, 47, .6); vertical-align: .12em; }
.ww .bx-cat .bx-pg { font: 400 .62em/1 'VT323', ui-monospace, monospace; letter-spacing: .04em; margin-left: .35em; opacity: .8; vertical-align: .2em; }
.ww .bx-mini { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 2px; width: 100%; height: 100%; padding: 2px; box-sizing: border-box;
  background: rgba(0, 0, 0, .55); border-radius: 3px; box-shadow: 0 0 0 1px var(--ww-ink-hot), 0 0 14px var(--ww-glow); }
.ww .bx-mini img { width: 100% !important; height: 100% !important; object-fit: contain !important; box-shadow: none !important; min-width: 0; min-height: 0; }

/* ── option 1: CHANNEL 00, the multi-view (every channel at once, like a TV's preview grid) ── */
.ww .bx-panel .ww-ui { container-type: size !important; }
.ww .bx-mv { width: 100cqw; height: 100cqh; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: clamp(6px, 1cqw, 12px); }
.ww .bx-mv-t { position: relative; min-width: 0; min-height: 0; display: grid; place-items: center; padding: 18% 8% 20%; border-radius: 4px;
  background: radial-gradient(120% 100% at 50% 40%, hsl(var(--h) 40% 14% / .9), hsl(var(--h) 40% 5% / .95));
  box-shadow: inset 0 0 0 1px hsl(var(--h) var(--s) 58% / .55), 0 0 18px hsl(var(--h) var(--s) 58% / .25); }
html:not(.hc) .ww[data-wordwall][data-ww-bg] > .ww-panel .ww-ui .bx-mv-t img { max-width: 86% !important; max-height: calc((100cqh - 12px) / 2 * .62) !important; width: auto !important; height: auto !important; aspect-ratio: auto !important; object-fit: contain; box-shadow: none !important; filter: drop-shadow(0 4px 8px rgba(0,0,0,.6)); }
.ww .bx-mv-n { position: absolute; left: 7px; top: 5px; font: 400 clamp(.8rem, 1.6cqw, 1.15rem)/1 'VT323', monospace; color: hsl(var(--h) calc(var(--s) * 1% + 25%) 70%); text-shadow: 0 0 6px hsl(var(--h) var(--s) 58% / .7); }
.ww .bx-mv-name { position: absolute; left: 0; right: 0; bottom: 5px; text-align: center; font: 400 clamp(.75rem, 1.5cqw, 1.05rem)/1 var(--font-display); letter-spacing: .08em; text-transform: uppercase;
  color: hsl(var(--h) calc(var(--s) * 1% + 30%) 76%); text-shadow: 0 0 8px hsl(var(--h) var(--s) 58% / .6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ww.bx-cm .bx-mv-t { --h: 150 !important; --s: 70 !important; }

/* ── option 2: the TELETEXT FRONT PAGE (the whole screen is the bundle's page) ── */
@media (min-width: 861px) { .ww.bx-full .ww-list, .ww.bx-full .ww-strip-arrow { display: none !important; } }
.ww .bx-opt2 { grid-template-columns: minmax(0, 1fr) !important; grid-template-areas: 'ui' !important; }
.ww .bx-opt2 .ww-info { display: none !important; }
.ww .bx-opt2 .ww-ui { container-type: size; }
.ww .bx-tt { --tt: var(--ww-ink-hot); --tt-dim: var(--ww-ink); width: 100cqw; height: 100cqh; display: grid; grid-template-rows: auto auto auto 1fr auto auto; gap: clamp(4px, 1.4cqh, 12px);
  font: 400 clamp(1rem, 4.6cqh, 1.7rem)/1.05 'VT323', ui-monospace, monospace; color: var(--tt); text-shadow: 0 0 6px var(--ww-glow); text-transform: uppercase; }
.ww .bx-tt-head { display: flex; gap: 1.2ch; align-items: center; white-space: nowrap; overflow: hidden; }
.ww .bx-tt-head .p { background: var(--tt); color: var(--ww-ink-on); padding: 0 .5ch; text-shadow: none; }
.ww .bx-tt-head .sp { flex: 1; }
.ww .bx-tt-big { display: flex; justify-content: space-between; align-items: end; gap: 2ch; }
.ww .bx-tt-big .dh { display: inline-block; font-size: 2.15em; line-height: .9; transform: scaleY(1.65); transform-origin: bottom; padding-top: .55em; letter-spacing: .02em; }
.ww .bx-tt-big .pr { color: var(--ww-ink-on); background: var(--tt); padding: 0 .35ch; text-shadow: none; box-shadow: 0 0 20px var(--ww-glow-hot); }
.ww .bx-tt-mos { height: .9em; background:
  repeating-linear-gradient(90deg, var(--tt) 0 1.4ch, transparent 1.4ch 2.1ch, var(--tt) 2.1ch 2.8ch, transparent 2.8ch 4.2ch),
  linear-gradient(transparent 45%, var(--tt) 45% 55%, transparent 55%); opacity: .85; box-shadow: 0 0 10px var(--ww-glow); }
.ww .bx-tt-rows { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 3ch; row-gap: .15em; align-content: center; }
.ww .bx-tt-row { display: flex; gap: .6ch; white-space: nowrap; overflow: hidden; color: var(--tt-dim); }
.ww .bx-tt-row b { font-weight: 400; color: var(--tt); }
.ww .bx-tt-row .dots { flex: 1; overflow: hidden; opacity: .5; }
.ww .bx-tt-row .dots::before { content: '..............................................'; }
.ww .bx-tt-note { color: var(--tt-dim); white-space: nowrap; overflow: hidden; }
.ww .bx-tt-fast { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 1ch; }
.ww .bx-tt-fast span { padding: .12em .6ch; color: #120d08; text-shadow: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ww .bx-tt-fast .r { background: #e4553d; box-shadow: 0 0 16px rgba(228, 85, 61, .55); } .ww .bx-tt-fast .g { background: #5fc46e; }
.ww .bx-tt-fast .y { background: #e9c54c; } .ww .bx-tt-fast .c { background: #52bccb; }
.ww .bx-flash { animation: bxFlash 1s steps(1) infinite; } @keyframes bxFlash { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .ww .bx-flash { animation: none; } }

/* ── option 3: LIVE, the shopping channel (the picture runs through the 8 plugins) ── */
.ww .bx-live { position: relative; width: 100cqw; height: 100cqh; display: grid; place-items: center; overflow: hidden; border-radius: 4px; }
.ww .bx-live-pic { position: absolute; inset: 0 0 18% 0; display: grid; place-items: center; }
html:not(.hc) .ww[data-wordwall][data-ww-bg] > .ww-panel .ww-ui .bx-live-pic img { max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important; aspect-ratio: auto !important; }
.ww .bx-live-bug { position: absolute; left: 10px; top: 8px; display: flex; align-items: center; gap: .45em; padding: .2em .6em .1em; font: 400 1.05rem/1 var(--font-display); letter-spacing: .14em; color: #fff3ea; background: rgba(20, 6, 4, .78); box-shadow: inset 0 0 0 1px rgba(255, 90, 70, .7); }
.ww .bx-live-bug i { width: .6em; height: .6em; border-radius: 50%; background: #ff3b2f; box-shadow: 0 0 8px #ff3b2f; }
.ww .bx-live-ch { position: absolute; right: 10px; top: 8px; font: 400 1.05rem/1 'VT323', monospace; color: var(--ww-ink-hot); text-shadow: 0 0 6px var(--ww-glow); text-transform: uppercase; background: rgba(0,0,0,.55); padding: .2em .5em; }
.ww .bx-live-burst { position: absolute; right: 4%; bottom: 23%; rotate: -6deg; display: grid; place-items: center; padding: .35em .7em .25em; font: 400 1rem/1 var(--font-display); letter-spacing: .12em; color: var(--ww-ink-on); background: var(--ww-ink-hot); box-shadow: 0 0 26px var(--ww-glow-hot); text-transform: uppercase; }
.ww .bx-live-burst b { font-weight: 400; font-size: 2.6em; line-height: .9; letter-spacing: .02em; }
.ww .bx-live-l3 { position: absolute; left: 0; right: 0; bottom: 0; height: 16%; min-height: 34px; display: flex; align-items: stretch; background: rgba(0, 0, 0, .72); box-shadow: inset 0 1px 0 var(--ww-ink-hot); overflow: hidden; }
.ww .bx-live-l3 .k { display: grid; place-items: center; padding: 0 .9em; font: 400 1.05rem/1 var(--font-display); letter-spacing: .12em; color: var(--ww-ink-on); background: var(--ww-ink-hot); white-space: nowrap; }
.ww .bx-live-l3 .crawl { display: flex; align-items: center; padding-left: 1em; white-space: nowrap; font: 400 1.25rem/1 'VT323', monospace; color: var(--ww-ink-text); text-shadow: 0 0 6px var(--ww-glow); text-transform: uppercase; }
.ww .bx-live-dots { position: absolute; left: 50%; bottom: 19%; translate: -50% 0; display: flex; gap: 5px; }
.ww .bx-live-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--ww-ink); opacity: .45; } .ww .bx-live-dots i.on { opacity: 1; background: var(--ww-ink-hot); box-shadow: 0 0 6px var(--ww-glow-hot); }

/* phones */
@media (max-width: 860px) {
  .ww .bx-mv { gap: 5px; } .ww .bx-mv-t { padding: 16% 6% 22%; } .ww .bx-mv-name { font-size: .62rem; bottom: 3px; } .ww .bx-mv-n { font-size: .75rem; left: 4px; top: 3px; }
  .ww .bx-opt1 .ww-ui { height: 12.5rem !important; }
  .ww .bx-opt2 .ww-ui { height: 33rem !important; }
  .ww .bx-tt { font-size: 1.05rem; gap: 8px; grid-template-rows: auto auto auto auto auto auto; }
  .ww .bx-tt-big { flex-direction: column; align-items: start; gap: .2em; } .ww .bx-tt-big .dh { font-size: 1.9em; }
  .ww .bx-tt-rows { grid-template-columns: 1fr; }
  .ww .bx-tt-fast { grid-template-columns: 1fr 1fr; } .ww .bx-tt-fast .r { grid-column: 1 / -1; font-size: 1.25em; text-align: center; }
  .ww .bx-tt-note { white-space: normal; }
  .ww .bx-opt3 .ww-ui { height: 13rem !important; }
  .ww .bx-live-l3 .crawl { font-size: 1.05rem; } .ww .bx-live-burst { font-size: .8rem; }
}
`;

// runs in the page
function draw({ opt, phase, view, css }) {
  const ww = document.querySelector('.ww');
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const cm = phase === 'cm';
  const H = cm ? [150, 70] : ({ 1: [44, 24], 2: [36, 88], 3: [40, 74] })[opt];
  ww.style.setProperty('--ww-on-h', H[0]); ww.style.setProperty('--ww-on-s', H[1]);
  ww.dataset.wwOn = 'bundle';
  ww.classList.toggle('bx-cm', cm);
  if (opt === 2) ww.classList.add('bx-full');
  const slugs = ['revlimiter', 'revfx', 'radio-roulette', 'gas', 'gas2', 'drift', 'obdtune', 'widebeam'];
  const names = ['RevLimiter', 'RevFX', 'Radio Roulette', 'GAS', 'GAS 2', 'DRIFT', 'OBDTUNE', 'Wide Beam'];
  const types = ['Mastering limiter', 'Multi-effect rack', 'Lo-fi radio', 'One-knob saturator', 'Master-bus color', 'Stereo panner', 'Pitch correction', 'Stereo widener'];
  const cs = getComputedStyle(ww);
  const hue = (s) => [cs.getPropertyValue(`--ww-ch-${s}-h`).trim() || '38', cs.getPropertyValue(`--ww-ch-${s}-s`).trim() || '28'];
  const thumb = {};
  document.querySelectorAll('[data-ww-item]').forEach((li) => { const i = li.querySelector('.ww-thumb img'); if (i) thumb[li.dataset.wwItem] = i.getAttribute('src'); });
  const big = {};
  document.querySelectorAll('.ww-panel[data-ww-panel]').forEach((p) => { const i = p.querySelector('.ww-ui img'); if (i) big[p.dataset.wwPanel] = i.getAttribute('src'); });

  // the BUNDLES tab, first, pressed (the TV opens on it while the sale is on)
  const all = document.querySelector('.ww-cat');
  const tab = all.cloneNode(true);
  tab.dataset.wwCat = 'bundles'; tab.setAttribute('aria-label', 'Bundles');
  tab.childNodes[0].textContent = 'Bundles';
  tab.querySelector('sup').textContent = '1';
  tab.classList.add('bx-cat');
  if (opt === 3) tab.insertAdjacentHTML('afterbegin', '<i class="bx-dot" aria-hidden="true"></i>');
  if (opt === 2) { tab.querySelector('sup').remove(); tab.insertAdjacentHTML('beforeend', '<span class="bx-pg">P100</span>'); }
  all.before(tab);
  document.querySelectorAll('.ww-cat').forEach((b) => b.setAttribute('aria-pressed', b === tab ? 'true' : 'false'));

  // the bundle's channel, first in the strip (laptop) / list (phone)
  const list = document.querySelector('[data-ww-list]');
  const li = list.querySelector('[data-ww-item]').cloneNode(true);
  li.dataset.wwItem = 'bundle';
  list.querySelectorAll('.ww-row').forEach((r) => r.classList.remove('is-lit'));
  const row = li.querySelector('.ww-row'); row.classList.add('is-lit'); row.removeAttribute('href'); row.id = 'ww-tab-bundle';
  li.querySelector('.ww-name').textContent = 'All 8';
  li.querySelector('.ww-type').textContent = (cm ? 'Cyber Monday' : 'Black Friday') + ' bundle';
  const rp = li.querySelector('.ww-rprice'); if (rp) rp.textContent = '$69';
  const th = li.querySelector('.ww-thumb'); th.classList.remove('is-tall', 'is-float');
  th.innerHTML = '<span class="bx-mini">' + slugs.map((s) => `<img src="${thumb[s] || ''}" alt="">`).join('') + '</span>';
  list.style.overflowAnchor = 'none';
  list.prepend(li);
  list.scrollLeft = 0;
  ww.style.setProperty('--ww-rows', String(list.children.length));

  // the bundle's panel: a clone of the lit one (its scoped styles come with it), the words and the picture swapped
  const act = document.querySelector('.ww-panel.is-active');
  const p = act.cloneNode(true);
  act.classList.remove('is-active'); act.setAttribute('aria-hidden', 'true');
  p.dataset.wwPanel = 'bundle'; p.id = 'ww-ch-bundle';
  p.classList.remove('is-portrait', 'is-float'); p.classList.add('bx-panel', 'bx-opt' + opt);
  p.style.setProperty('--ww-ch-h', H[0]); p.style.setProperty('--ww-ch-s', H[1]);
  p.querySelector('.ww-pname').textContent = 'All 8 plugins';
  p.querySelector('.ww-ptype').textContent = (cm ? 'Cyber Monday' : 'Black Friday') + ' bundle';
  p.querySelector('.ww-blurb').textContent = 'Every RevAudio plugin in one order: 6 licence keys in one email.\nDRIFT’s release build comes free when it ships.';
  const words = p.querySelector('.ww-pwords'); const w0 = words.querySelector('.ww-pw-i');
  words.querySelectorAll('.ww-pw-i').forEach((n) => n.remove());
  ['6 keys', 'GAS + GAS 2 free', cm ? 'ends tonight 23:59 PT' : 'ends Sun 23:59 PT'].forEach((t, k, a) => {
    const n = w0.cloneNode(true); n.querySelector('.ww-pw').textContent = t; n.querySelector('.ww-pw').classList.toggle('is-hot', k === 0);
    const dot = n.querySelector('.ww-pw-dot'); if (dot && k === a.length - 1) dot.remove(); words.append(n, ' ');
  });
  const price = p.querySelector('.ww-price'); if (price) { price.textContent = '$69'; price.classList.remove('is-long'); }
  const tr = p.querySelector('.ww-try'); if (tr) { tr.querySelector('span').textContent = 'Add all 8 to cart'; const sb = tr.querySelector('.rv-btn__sub'); if (sb) sb.textContent = '6 licence keys · one email'; }
  const cart = p.querySelector('.ww-cart'); if (cart) cart.style.display = 'none';
  const more = p.querySelector('.ww-more'); if (more) more.textContent = 'What’s inside →';
  const fig = p.querySelector('.ww-ui');
  if (opt === 1) {
    fig.innerHTML = '<div class="bx-mv">' + slugs.map((s, i) => { const [h, sat] = hue(s); return `<div class="bx-mv-t" style="--h:${h};--s:${sat}"><span class="bx-mv-n">0${i + 1}</span><img src="${thumb[s] || ''}" alt=""><span class="bx-mv-name">${names[i]}</span></div>`; }).join('') + '</div>';
  } else if (opt === 2) {
    const head = cm ? ['P100', 'REVAUDIO TEXT', 'CYBER MONDAY', 'MON 30 NOV'] : ['P100', 'REVAUDIO TEXT', 'BLACK FRIDAY', 'FRI 27 NOV'];
    fig.innerHTML = `<div class="bx-tt">
      <div class="bx-tt-head"><span class="p">${head[0]}</span><span>${head[1]}</span><span class="sp"></span><span>${head[2]}</span><span>${head[3]}</span><span>10:00:00</span></div>
      <div class="bx-tt-big"><span class="dh">All 8 plugins</span><span class="dh pr bx-flash">$69</span></div>
      <div class="bx-tt-mos"></div>
      <div class="bx-tt-rows">${slugs.map((s, i) => `<div class="bx-tt-row"><b>0${i + 1}</b><b>${names[i]}</b><span class="dots"></span><span>${i === 3 || i === 4 ? 'free' : types[i]}</span></div>`).join('')}</div>
      <div class="bx-tt-note">6 licence keys in one email · ${cm ? 'ends tonight 23:59 PT' : 'ends Sun 29 Nov 23:59 PT'} · DRIFT release free</div>
      <div class="bx-tt-fast"><span class="r">▶ Add all 8 to cart</span><span class="g">The plugins</span><span class="y">${cm ? 'Code CYBER40' : 'Code REDLINE'}</span><span class="c">How keys work</span></div>
    </div>`;
  } else {
    fig.innerHTML = `<div class="bx-live">
      <div class="bx-live-pic"><img src="${big.revlimiter || thumb.revlimiter}" alt=""></div>
      <span class="bx-live-bug"><i></i>Live</span><span class="bx-live-ch">Ch 00 · 1/8 RevLimiter</span>
      <span class="bx-live-burst">All 8<b>$69</b></span>
      <span class="bx-live-dots">${slugs.map((s, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</span>
      <div class="bx-live-l3"><span class="k">${cm ? 'Cyber Monday' : 'Black Friday'}</span><span class="crawl">All 8 plugins · $69 · 6 licence keys in one email · GAS + GAS 2 free · ${cm ? 'ends tonight 23:59 PT' : 'ends Sun 23:59 PT'} · </span></div>
    </div>`;
  }
  act.after(p);
  if (view === 'panel') ww.dataset.wwView = 'panel';
  return { cats: [...document.querySelectorAll('.ww-cat')].map((b) => b.textContent.trim().replace(/\s+/g, ' ')).slice(0, 3), lit: document.querySelector('.ww-row.is-lit .ww-name')?.textContent, active: document.querySelector('.ww-panel.is-active')?.dataset.wwPanel };
}

const JOBS = [];
for (const opt of [1, 2, 3]) {
  JOBS.push([`o${opt}-lap-bf`, opt, 'bf', 'list', [1312, 734]]);
  JOBS.push([`o${opt}-lap-cm`, opt, 'cm', 'list', [1312, 734]]);
  JOBS.push([`o${opt}-ph-list`, opt, 'bf', 'list', [390, 844]]);
  JOBS.push([`o${opt}-ph-panel`, opt, 'bf', 'panel', [390, 844]]);
}

(async () => {
  const b = await chromium.launch();
  for (const [id, opt, phase, view, vp] of JOBS) {
    if (ONLY && !id.includes(ONLY)) continue;
    const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    await ctx.addInitScript(seed);
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
    await p.goto(`${BASE}/plugins/?sale=${phase}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    // every TV picture loaded first (the thumbs and windows are lazy)
    await p.evaluate(async () => { for (const i of document.querySelectorAll('.ww img')) { i.loading = 'eager'; } await Promise.all([...document.querySelectorAll('.ww img')].map((i) => i.decode().catch(() => {}))); });
    const r = await p.evaluate(draw, { opt, phase, view, css: CSS });
    await p.evaluate(async () => { await Promise.all([...document.querySelectorAll('.ww img')].map((i) => i.decode().catch(() => {}))); });
    await p.evaluate(() => { const l = document.querySelector('[data-ww-list]'); l.scrollLeft = 0; });
    await p.waitForTimeout(700);
    const info = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, y: Math.round(document.querySelector('.ww').getBoundingClientRect().top) }));
    await p.screenshot({ path: path.join(OUT, id + '.png') });
    console.log(id, JSON.stringify(r), JSON.stringify(info), errs.join(' | '));
    await ctx.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
