# Worn paper: the parts tag and the index card

**Status: saved for a future site update, not on any page.** Dan, 2026-11-24, on the home TV's cart keys bench
(`/__wwcart`, round 2): "I like the wearing text and the wearing tag ... make sure that you save it for future updates in
the website." The TV took Fastext for its Product page / Add to cart keys for now (`WordWall.astro`); this look waits for
its place. It is the garage's own paper: the cart drawer is "the parts counter", and a parts tag is what hangs on a part.

What it is (working, live on the dev bench: `npm run dev`, then `/__wwcart`, the first TV; bench code in
`tools/wwbench/wwcart.html`, `PAPER` + `PAPER_SETUP`, commit `e6cb107` on `feat/home-tv-layout`):

- **Two papers taped to a surface.** Add to cart = a manila parts tag with a punched end and a brass eyelet. Product
  page = a ruled index card with a faded red head rule, blue lines and its top-right corner folded over. Each is held by
  a strip of masking tape (the GAS 2 postcards' `tools/_gas2-scene/postcards/img/tape.webp`, inlined below).
- **The wear** (what Dan liked): an edge cut rough by an SVG displacement map (the shape is the mask), fine paper grain
  and uneven ageing (two SVG `feTurbulence` layers), yellowed, darker edges, a fold crease, a grease thumbprint on the
  tag, a coffee ring's arc and a thumb smudge on the card. The typing is Special Elite in dark ink with a slight bleed;
  "In your cart" is stamped in oxide ink.
- **It behaves like paper.** Hover: a draft catches it and it sways from the tape, its shadow opening. Press: flat
  against the surface. Click: the tape lets go, it swings on one corner, then flutters down off the screen (the fall
  below) and a fresh one is taped on in its place (Add to cart reads "In your cart" by then). A link (Product page)
  follows once the card has fallen (650 ms); a modified click (new tab) opens at once. Reduced motion: nothing falls.
- Everything is drawn in code (SVG noise, gradients, one 3 KB tape picture). If it ever has to look more real up close,
  the next step is photographed paper and tape textures (Photographic realism, design-language Law 2), cut out with
  alpha, the typing kept live on top.

## The CSS

Markup: a container with class `paper-keys`, holding `.paper-card` (a link) and/or `.paper-tag` (a button). Both use
`--ww-ink-hot` for the focus ring (the TV's ink; set it, or swap in the page's own focus colour). Fonts: Special Elite
(in `src/styles/fonts.css`).

```css
.paper-keys :is(.paper-card, .paper-tag) {
  min-height: 0; padding: 0; border: 0; border-radius: 0; background: none; box-shadow: none; text-shadow: none; filter: none;
  transform: none; overflow: visible; isolation: auto; position: relative; display: inline-flex; align-items: center;
  text-transform: uppercase; text-decoration: none; cursor: pointer;
  transition: color 120ms ease, background-color 120ms ease, box-shadow 160ms ease, filter 160ms ease, transform 160ms ease;
}
.paper-keys :is(.paper-card, .paper-tag):is(:hover, :active, .is-pressed) { transform: none; background-color: transparent; box-shadow: none; } /* today's hover fill off; an option's own layers stay */
.paper-keys :is(.paper-card, .paper-tag):focus-visible { outline: 2px solid var(--ww-ink-hot); outline-offset: 5px; }

.paper-keys :is(.paper-card, .paper-tag) {
  --tilt: -1.6deg;
  isolation: isolate; gap: .4rem; color: rgb(38 27 16 / .92);
  font-family: 'Special Elite', 'Courier New', monospace; font-size: 1.02rem; line-height: 1; letter-spacing: .04em;
  text-shadow: 0 0 .6px rgb(38 27 16 / .55);
  transform: rotate(var(--tilt)); transform-origin: 55% 0;
  filter: drop-shadow(0 2px 1.5px rgb(0 0 0 / .45)) drop-shadow(0 6px 6px rgb(0 0 0 / .28));
}
.paper-keys .paper-card [aria-hidden] { font-family: 'Special Elite', monospace; font-size: 1em; vertical-align: 0; }
/* the paper itself (behind the typing): its shape and rough edge are the mask */
.paper-keys :is(.paper-card, .paper-tag)::before {
  content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  -webkit-mask: var(--shape) 0 0 / 100% 100% no-repeat; mask: var(--shape) 0 0 / 100% 100% no-repeat;
}
/* the index card: off-white, a faded red head rule and blue lines, yellowed edges, a coffee ring's arc, a thumb
   smudge, one crease, the top-right corner folded over */
.paper-keys .paper-card { padding: .66rem 1.05rem .52rem .85rem; --tilt: -1.8deg; }
.paper-keys .paper-card::before {
  --shape: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%20160%2044'%20preserveAspectRatio%3D'none'%3E%3Cfilter%20id%3D'r'%20x%3D'-6%25'%20y%3D'-12%25'%20width%3D'112%25'%20height%3D'124%25'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.42'%20numOctaves%3D'2'%20seed%3D'5'%20result%3D't'%2F%3E%3CfeDisplacementMap%20in%3D'SourceGraphic'%20in2%3D't'%20scale%3D'2.4'%20xChannelSelector%3D'R'%20yChannelSelector%3D'G'%2F%3E%3C%2Ffilter%3E%3Cpath%20filter%3D'url(%23r)'%20d%3D'M1.6%201.6H146.5L158.4%2013.5V42.4H1.6Z'%2F%3E%3C%2Fsvg%3E");
  background:
    linear-gradient(225deg, transparent 0 .52rem, #9d927c .52rem .58rem, #d9d0bb .58rem .78rem, transparent .78rem) 100% 0 / 1.3rem 1.3rem no-repeat,
    linear-gradient(104deg, transparent 63%, rgb(255 255 255 / .35) 63.4%, rgb(70 50 20 / .16) 64%, transparent 65%),
    radial-gradient(circle at 88% 118%, transparent 0 34%, rgb(120 70 25 / .32) 36%, rgb(120 70 25 / .12) 39%, transparent 42%),
    radial-gradient(ellipse 22% 38% at 14% 74%, rgb(80 60 40 / .14), transparent 70%),
    url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'140'%20height%3D'140'%3E%3Cfilter%20id%3D'n'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.92'%20numOctaves%3D'2'%20seed%3D'7'%20stitchTiles%3D'stitch'%2F%3E%3CfeColorMatrix%20values%3D'0%200%200%200%20.32%20%200%200%200%200%20.22%20%200%200%200%200%20.1%20%20.55%200%200%200%20-.12'%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23n)'%2F%3E%3C%2Fsvg%3E"),
    url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'300'%20height%3D'120'%20preserveAspectRatio%3D'none'%3E%3Cfilter%20id%3D'b'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.035%20.08'%20numOctaves%3D'3'%20seed%3D'11'%2F%3E%3CfeColorMatrix%20values%3D'0%200%200%200%20.42%20%200%200%200%200%20.28%20%200%200%200%200%20.1%20%20.9%200%200%200%20-.38'%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23b)'%2F%3E%3C%2Fsvg%3E") 0 0 / 100% 100%,
    radial-gradient(ellipse at 50% 45%, transparent 52%, rgb(150 115 55 / .38) 100%),
    linear-gradient(transparent .42rem, rgb(185 90 70 / .5) .42rem .5rem, transparent .5rem),
    repeating-linear-gradient(transparent 0 calc(.5rem + .56rem), rgb(110 140 185 / .32) calc(.5rem + .56rem) calc(.5rem + .62rem)),
    linear-gradient(176deg, #efe9da, #e3dac4);
}
/* the parts tag: manila, a punched end with a brass eyelet, a grease thumbprint, the edge gone soft and dark */
.paper-keys .paper-tag { padding: .62rem 1rem .5rem 1.85rem; --tilt: 2.3deg; transform-origin: 62% 0; }
.paper-keys .paper-tag::before {
  --shape: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%20170%2044'%20preserveAspectRatio%3D'none'%3E%3Cfilter%20id%3D'r'%20x%3D'-6%25'%20y%3D'-12%25'%20width%3D'112%25'%20height%3D'124%25'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.42'%20numOctaves%3D'2'%20seed%3D'3'%20result%3D't'%2F%3E%3CfeDisplacementMap%20in%3D'SourceGraphic'%20in2%3D't'%20scale%3D'2.4'%20xChannelSelector%3D'R'%20yChannelSelector%3D'G'%2F%3E%3C%2Ffilter%3E%3Cpath%20filter%3D'url(%23r)'%20d%3D'M12%201.6H168.4V42.4H12L1.6%2032.6V11.4Z'%2F%3E%3C%2Fsvg%3E");
  -webkit-mask:
    var(--shape) 0 0 / 100% 100% no-repeat,
    radial-gradient(circle at .78rem 50%, #000 .17rem, transparent .19rem);
  -webkit-mask-composite: source-out;
  mask:
    var(--shape) 0 0 / 100% 100% no-repeat subtract,
    radial-gradient(circle at .78rem 50%, #000 .17rem, transparent .19rem);
  background:
    radial-gradient(circle at .78rem 50%, transparent .19rem, #6f5428 .2rem, #e8c878 .26rem, #a3843f .31rem, #5b4520 .36rem, transparent .38rem),
    linear-gradient(97deg, transparent 54%, rgb(255 245 220 / .3) 54.4%, rgb(70 45 15 / .18) 55%, transparent 56%),
    radial-gradient(ellipse 13% 30% at 74% 66%, rgb(60 40 20 / .26), rgb(60 40 20 / .1) 60%, transparent 72%),
    url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'140'%20height%3D'140'%3E%3Cfilter%20id%3D'n'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.92'%20numOctaves%3D'2'%20seed%3D'7'%20stitchTiles%3D'stitch'%2F%3E%3CfeColorMatrix%20values%3D'0%200%200%200%20.32%20%200%200%200%200%20.22%20%200%200%200%200%20.1%20%20.55%200%200%200%20-.12'%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23n)'%2F%3E%3C%2Fsvg%3E"),
    url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'300'%20height%3D'120'%20preserveAspectRatio%3D'none'%3E%3Cfilter%20id%3D'b'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.035%20.08'%20numOctaves%3D'3'%20seed%3D'11'%2F%3E%3CfeColorMatrix%20values%3D'0%200%200%200%20.42%20%200%200%200%200%20.28%20%200%200%200%200%20.1%20%20.9%200%200%200%20-.38'%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23b)'%2F%3E%3C%2Fsvg%3E") 0 0 / 100% 100%,
    radial-gradient(ellipse at 52% 46%, transparent 48%, rgb(120 82 30 / .5) 100%),
    linear-gradient(172deg, #dcc596, #cdb07a);
}
/* the masking tape that holds it to the glass */
.paper-keys :is(.paper-card, .paper-tag)::after {
  content: ''; position: absolute; top: -.46rem; left: 55%; width: 2.7rem; height: .78rem; translate: -50% 0; rotate: -5deg;
  background: url("data:image/webp;base64,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") center / 100% 100% no-repeat; opacity: .9; pointer-events: none;
  filter: sepia(.25) brightness(1.02) drop-shadow(0 1px 1px rgb(0 0 0 / .25));
}
.paper-keys .paper-tag::after { left: 62%; rotate: 6deg; }
/* a draft catches it: it sways from the tape, the shadow opens under it */
.paper-keys :is(.paper-card, .paper-tag):hover {
  transform: rotate(var(--tilt));
  filter: drop-shadow(0 3px 2px rgb(0 0 0 / .42)) drop-shadow(0 12px 10px rgb(0 0 0 / .3));
  animation: wwp-draft 1.6s ease-in-out infinite;
}
@keyframes wwp-draft { 0%, 100% { rotate: 0deg; } 30% { rotate: 1.6deg; } 65% { rotate: -.7deg; } }
/* pressed flat against the glass */
.paper-keys :is(.paper-card, .paper-tag):is(:active, .is-pressed) { transform: rotate(var(--tilt)) scale(.985); filter: drop-shadow(0 1px 1px rgb(0 0 0 / .55)); animation: none; transition-duration: 60ms; }
/* once it's in the cart, the new tag says so in stamp ink */
.paper-keys .paper-tag.is-in-cart { color: rgb(130 38 16 / .9); text-shadow: 0 0 .8px rgb(130 38 16 / .6); letter-spacing: .06em; }
/* the paper that fell is gone; a fresh one is slapped on in its place */
.paper-keys :is(.paper-card, .paper-tag).wwp-gone { visibility: hidden; }
.paper-keys :is(.paper-card, .paper-tag).wwp-stick { animation: wwp-stick 420ms cubic-bezier(.2, .9, .3, 1.15) both; }
.paper-keys :is(.paper-card, .paper-tag).wwp-stick::after { animation: wwp-tape 420ms steps(1, end) both; }
@keyframes wwp-stick {
  0% { opacity: 0; transform: rotate(calc(var(--tilt) + 7deg)) translateY(-10px) scale(1.1); filter: drop-shadow(0 16px 12px rgb(0 0 0 / .35)); }
  55% { opacity: 1; transform: rotate(var(--tilt)) scale(.98); filter: drop-shadow(0 2px 1.5px rgb(0 0 0 / .5)); }
  100% { transform: rotate(var(--tilt)) scale(1); }
}
@keyframes wwp-tape { 0%, 50% { opacity: 0; } 51%, 100% { opacity: .9; } }
@media (prefers-reduced-motion: reduce) { .paper-keys :is(.paper-card, .paper-tag):hover { animation: none; } .paper-keys :is(.paper-card, .paper-tag).wwp-stick, .paper-keys :is(.paper-card, .paper-tag).wwp-stick::after { animation: none; } }
```

## The fall (JS)

```js
/* The fall: a press lets the tape go. The paper swings on the corner still stuck (0.24 s), then flutters down
   like paper: gravity against air drag (it settles near 480 px/s), a sway and a wobble on one rhythm, a tilt toward
   and away from the surface, the shadow opening as it leaves, faded out after ~2 s. A COPY falls, in a fixed layer
   over the whole page (nothing on the way clips it); the real key hides, then a fresh paper is taped on in its place.
   Reduced motion: nothing falls. `wrapClass` = the class the CSS hangs on (.paper-keys), so the copy keeps its look. */
export function installPaperFall(root = document, { wrapClass = 'paper-keys', restickMs = 700, follow } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const drop = (key) => {
    const r = key.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;';
    const wrap = document.createElement('div');
    wrap.className = wrapClass;
    wrap.style.cssText = 'position:absolute;left:0;top:0;will-change:transform;';
    const paper = key.cloneNode(true);
    paper.removeAttribute('id');
    paper.classList.remove('wwp-gone', 'wwp-stick');
    // a cart key's copy is not a cart key: Cart.astro relabels every [data-add-to-cart] on the page
    ['data-add-to-cart', 'data-cart-label', 'data-slug'].forEach((a) => paper.removeAttribute(a));
    paper.style.animation = 'none';
    wrap.appendChild(paper); layer.appendChild(wrap); document.body.appendChild(layer);
    const c = paper.getBoundingClientRect();
    wrap.style.left = `${r.left - c.left}px`;
    wrap.style.top = `${r.top - c.top}px`;
    const side = Math.random() < 0.5 ? -1 : 1; // which corner the tape keeps a moment longer
    wrap.style.transformOrigin = side > 0 ? '8% 0' : '92% 0';
    const g = 2500, drag = 5.2, f = 1.35 + Math.random() * 0.45, amp = 20 + Math.random() * 12;
    let t = 0, x = 0, y = 0, vy = 0, phase = Math.random() * Math.PI, last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now; t += dt;
      let rot, rx = 0;
      if (t < 0.24) { const k = t / 0.24; rot = side * 30 * Math.sin((k * Math.PI) / 2); y = 4 * k * k; }
      else {
        vy += (g - drag * vy) * dt;
        phase += 2 * Math.PI * f * dt;
        x += (side * 36 + 150 * Math.cos(phase)) * dt;
        y += vy * dt;
        rot = side * 30 + amp * Math.sin(phase);
        rx = 48 * Math.sin(phase * 1.3);
      }
      const away = Math.min(1, y / 260);
      paper.style.filter = `drop-shadow(0 ${2 + away * 16}px ${1.5 + away * 12}px rgb(0 0 0 / ${0.45 - away * 0.25}))`;
      wrap.style.transform = `perspective(700px) translate(${x}px, ${y}px) rotate(${rot}deg) rotateX(${rx}deg)`;
      wrap.style.opacity = String(t > 2.1 ? Math.max(0, 1 - (t - 2.1) / 0.5) : 1);
      if (r.top + y > innerHeight + 40 || t > 2.6) layer.remove(); else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  root.addEventListener('click', (e) => {
    const key = e.target.closest?.(`.${wrapClass} :is(.paper-card, .paper-tag)`);
    if (!key || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // a modified click opens at once
    if (key.classList.contains('is-in-cart')) return; // already in the cart: its own action (the drawer)
    const href = key.getAttribute('href');
    if (href && follow !== false) { e.preventDefault(); setTimeout(() => { location.href = href; }, 650); } // a link: go once it has fallen
    drop(key);
    key.classList.add('wwp-gone');
    setTimeout(() => {
      key.classList.remove('wwp-gone');
      key.classList.add('wwp-stick');
      setTimeout(() => key.classList.remove('wwp-stick'), 480);
    }, restickMs);
  }, true); // capture: before the key's own click handlers (Cart.astro's add still runs and flips the label)
}
```
