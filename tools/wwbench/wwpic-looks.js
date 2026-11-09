/* The plugins' pictures INSIDE the TV, three looks (Dan 2026-11-09: "i want them to be inside the tv and not hovering,
   lets start with the html and go down to other elements"). Round 1 = the lit plugin's big picture; the list's
   thumbnails and the rest come after.

   What made them hover: a drop under the picture (0 18px 40px, .55), a lit ring and a halo round a hard-edged card, the
   picture's blacks darker than the glass (holes in the screen), and GAS 2 a cut-out pump on its own baked shadow. Each
   look takes all of that away and puts the picture IN the tube in its own way:
     A On the tube   the TV draws it: half its own colour, half the channel's phosphor; its blacks are the glass's own
                     dark, its highlights bloom, its edges fade into the screen. No lines (Dan's 2026-10-19 pick: the
                     picture stays clean).
     B Under glass   its true colours, set behind the glass: a dark seat and an inner shadow round it, the glass's
                     sheen over it, its blacks lifted a touch to the glass.
     C Phosphor      the TV draws it in its one colour, like the names: a duotone from the glass's dark to the hot
                     phosphor, blooming, the edges fading, and fine lines on the picture only.
   GAS 2 in every look: the pump in its night desert (the plugin's ROOM picture, src/assets/plugins/gas2-hero.jpg) in
   place of the floating cut-out. "today" = the TV as it is.

   Used by the bench's shot script (and any page that loads it): WWPIC.apply(document, 'a' | 'b' | 'c' | 'today'). */
(() => {
  // each channel's phosphor (WordWall.astro, THE CHANNELS): hue, saturation
  const CH = { revlimiter: [26, 78], gas: [46, 62], gas2: [14, 58], 'radio-roulette': [38, 28], drift: [280, 70] };
  const GAS2_ROOM = { src: '/src/assets/plugins/gas2-hero.jpg', ar: 880 / 1600 };

  const hsl = (h, s, l) => {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return [f(0), f(8), f(4)].map((v) => +v.toFixed(4));
  };
  const gsOf = (s) => Math.min(100, s + 20); // the glow's saturation, as the TV's --ww-gs
  const LUM = '0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0';
  const funcs = (tag, per) => ['R', 'G', 'B'].map((c, i) => `<feFunc${c} ${per(i)}/>`).join('');

  /* one filter per channel: lift (the blacks become the glass's dark) -> mix with a duotone of the picture's light
     (glass dark -> phosphor -> hot) by k -> bloom (the bright parts, blurred, added back) */
  function filter(id, [h, s], { k, ground, mid, hot, hotSat, bloom, blur }) {
    const gs = gsOf(s);
    const g = hsl(h, gs, ground), m = hsl(h, gs, mid), t = hsl(h, gs * hotSat, hot);
    return `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
      <feComponentTransfer in="SourceGraphic" result="lift">${funcs('lift', (i) => `type="linear" slope="${(1 - g[i]).toFixed(4)}" intercept="${g[i]}"`)}</feComponentTransfer>
      ${k > 0 ? `<feColorMatrix in="SourceGraphic" type="matrix" values="${LUM}" result="lum"/>
      <feComponentTransfer in="lum" result="duo">${funcs('duo', (i) => `type="table" tableValues="${g[i]} ${m[i]} ${t[i]}"`)}</feComponentTransfer>
      <feComposite in="duo" in2="lift" operator="arithmetic" k1="0" k2="${k}" k3="${(1 - k).toFixed(3)}" k4="0" result="mix"/>` : '<feOffset in="lift" result="mix"/>'}
      ${bloom > 0 ? `<feComponentTransfer in="mix" result="hi">${funcs('hi', () => 'type="table" tableValues="0 0 0 0.35 1"')}</feComponentTransfer>
      <feGaussianBlur in="hi" stdDeviation="${blur}" result="glow"/>
      <feComposite in="glow" in2="mix" operator="arithmetic" k1="0" k2="${bloom}" k3="1" k4="0"/>` : ''}
    </filter>`;
  }

  const SCREEN = "html:not(.hc) .ww[data-ww-bg='screen'] > .ww-panel";
  const PIC = `${SCREEN} .ww-ui :is(img, video)`;
  // the edge fading into the glass: two ramps multiplied, so the corners round off softly
  const FEATHER = `-webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent), linear-gradient(180deg, transparent, #000 7%, #000 93%, transparent);
    -webkit-mask-composite: source-in; mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent), linear-gradient(180deg, transparent, #000 7%, #000 93%, transparent);
    mask-composite: intersect;`;
  const perChannel = (look, prop) => Object.keys(CH).map((slug) =>
    `${SCREEN}[data-ww-panel='${slug}'] .ww-ui :is(img, video) { ${prop}: url(#wwpic-${look}-${slug}) !important; }`).join('\n');

  const LOOKS = {
    today: { name: 'Today', line: 'The TV as it is: a lit card over the glass, a ring, a halo and a drop under it; GAS 2 a floating pump.' },
    a: {
      name: 'On the tube',
      line: 'The TV draws it: half its own colour, half the channel’s phosphor, its blacks the glass’s own dark, the highlights blooming, the edges fading into the screen. No drop, no ring.',
      grade: { k: 0.45, ground: 8, mid: 48, hot: 92, hotSat: 0.55, bloom: 0.3, blur: 7 },
      css: () => `
        ${PIC} { box-shadow: none !important; border-radius: 0 !important; ${FEATHER} }
        ${perChannel('a', 'filter')}`,
    },
    b: {
      name: 'Under the glass',
      line: 'Its true colours, set behind the glass: a dark seat and an inner shadow round it, the glass’s sheen over it, its blacks lifted a touch to the glass. No drop, no halo.',
      grade: { k: 0, ground: 6, bloom: 0 },
      css: () => `
        ${PIC} { box-shadow: none !important; }
        ${SCREEN} .ww-ui { --wwpic-r: calc(var(--ww-pic-r) * 1px); width: fit-content; max-width: 100%; }
        ${SCREEN}[data-ww-panel='gas'] .ww-ui { --wwpic-r: 11% / 7.4%; }
        ${SCREEN}[data-ww-panel='radio-roulette'] .ww-ui { --wwpic-r: 9% 9% 10.6% 10.6% / 16.2% 16.2% 19% 19%; }
        ${SCREEN} .ww-ui::after {
          content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: var(--wwpic-r);
          background: linear-gradient(158deg, rgba(255, 255, 255, 0.075) 0%, rgba(255, 255, 255, 0.02) 24%, transparent 42%);
          box-shadow:
            inset 0 0 0 1px rgba(0, 0, 0, 0.85),
            inset 0 4px 14px rgba(0, 0, 0, 0.6),
            inset 0 0 34px rgba(0, 0, 0, 0.35),
            0 0 0 1px hsl(var(--ww-ch-h) var(--ww-gs) 58% / 0.1);
        }
        ${perChannel('b', 'filter')}`,
    },
    c: {
      name: 'Phosphor',
      line: 'The TV draws it in its one colour, like the names: the glass’s dark to the hot phosphor, blooming, the edges fading, fine lines on the picture only.',
      grade: { k: 1, ground: 7, mid: 46, hot: 92, hotSat: 0.5, bloom: 0.4, blur: 6 },
      css: () => `
        ${PIC} { box-shadow: none !important; border-radius: 0 !important; ${FEATHER} }
        ${SCREEN} .ww-ui::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.26) 0 1px, transparent 1px 3px);
          ${FEATHER}
        }
        ${perChannel('c', 'filter')}`,
    },
  };

  function gas2(doc, room) {
    const panel = doc.querySelector('[data-ww-panel="gas2"]');
    const img = panel?.querySelector('.ww-ui img');
    if (!img) return;
    if (!img.dataset.wwpicSrc) Object.assign(img.dataset, { wwpicSrc: img.getAttribute('src') || '', wwpicSrcset: img.getAttribute('srcset') || '', wwpicAr: panel.style.getPropertyValue('--ww-ar') });
    if (room) {
      img.removeAttribute('srcset');
      img.loading = 'eager';
      img.src = GAS2_ROOM.src;
      panel.classList.remove('is-float');
      panel.style.setProperty('--ww-ar', GAS2_ROOM.ar.toFixed(4));
    } else {
      if (img.dataset.wwpicSrcset) img.setAttribute('srcset', img.dataset.wwpicSrcset);
      img.src = img.dataset.wwpicSrc;
      panel.classList.add('is-float');
      panel.style.setProperty('--ww-ar', img.dataset.wwpicAr);
    }
  }

  function apply(doc, key) {
    const look = LOOKS[key];
    doc.getElementById('wwpic-css')?.remove();
    doc.getElementById('wwpic-svg')?.remove();
    gas2(doc, key !== 'today');
    if (!look.css) return;
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'wwpic-svg';
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    svg.innerHTML = `<defs>${Object.entries(CH).map(([slug, hs]) => filter(`wwpic-${key}-${slug}`, hs, look.grade)).join('')}</defs>`;
    doc.body.append(svg);
    const css = doc.createElement('style');
    css.id = 'wwpic-css';
    css.textContent = look.css();
    doc.head.append(css);
  }

  window.WWPIC = { LOOKS, apply };
})();
