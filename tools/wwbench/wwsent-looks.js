/* The TV's "Check your inbox", three looks (Dan 2026-11-08 on the TV Sells bench, the sent screen: "make it bigger
   and change the design for this, lets ask our self how it will come on the screen, how it will look with the vibe of
   the brand, go deep"; on the phone: "center it and give it the same treatment as the laptop one").

   Used by /__wwsent (tools/wwbench/wwsent.html, dev only) and by the bench's shot script. Each look lays its own
   block over the REAL sent screen of the TV's on-screen sign-up (WordWall.astro, .ws.is-sent): the page's own
   headline, address and spam line hide; its Resend / Wrong email? keys move into the look (they keep working). The
   words are the same in all three; what differs is the composition and how it comes on:
     A On air   a station card: CHECK YOUR over a giant INBOX, the address as a news lower-third, the channel bug in
                the corner. Round 3 (Dan 2026-11-09: "the headline should be where the ②", "this all section will be
                glitching in"): on a laptop the headline leads, level with the list's first row (apply() measures it);
                it rolls in and locks like a CRT's vertical hold, the section under it glitches in (the TV's own
                glitch: rows torn sideways, the red / cyan fringe, in steps), the bug comes on last.
     B Redline  RevAudio's own instrument: a phosphor rev counter; the needle sweeps up, bounces off the limiter
                (the redline is the threshold) and SENT lights; then the words.
     C Ch 00    the TV changes channel to INBOX: the set's on-screen number, a SENDING bar that fills like the volume
                bar, then the steps drawn as the set's menu rows.
   The TV's two faces only (Bebas, Inter; P01), the channel's own phosphor through the --ww-* inks. Reduced motion: no
   entrance, the look at rest. */
(() => {
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

  // the words, per kind of sign-up (trial / free / beta): the same in every look
  function words(d) {
    const last = d.kind === 'trial' ? `Open ${d.name} in your DAW: the ${d.days} days start then`
      : d.kind === 'free' ? `Open ${d.name} in your DAW. It’s yours to keep.` : `Open ${d.name} in your DAW.`;
    return {
      hl: 'Check your inbox',
      to: `The ${d.name} download is on its way to`,
      steps: ['Open the email on your Mac or PC', 'Pick Mac or Windows: the download starts', last],
      spam: 'Not there in a minute? Look in Promotions or Spam.',
    };
  }

  // the rev counter (B): 0-8 x1000, the red zone 7-8; the needle's angle = value x 22.5 deg from pointing left
  function gauge() {
    const cx = 120, cy = 118, R = 100, pt = (v, r) => {
      const a = Math.PI - (v * Math.PI) / 8;
      return [(cx + r * Math.cos(a)).toFixed(2), (cy - r * Math.sin(a)).toFixed(2)];
    };
    const arc = (v0, v1, r) => { const [x0, y0] = pt(v0, r), [x1, y1] = pt(v1, r); return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`; };
    let ticks = '', nums = '';
    for (let i = 0; i <= 16; i++) {
      const v = i / 2, major = i % 2 === 0;
      const [x0, y0] = pt(v, major ? 86 : 92), [x1, y1] = pt(v, R);
      ticks += `<line class="tick${major ? '' : ' minor'}${v >= 7 ? ' hot' : ''}" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`;
      if (major) { const [nx, ny] = pt(v, 72); nums += `<text class="num" x="${nx}" y="${ny}" dy="5" text-anchor="middle">${v}</text>`; }
    }
    return `<svg viewBox="0 0 240 138" aria-hidden="true">
      <path class="arc" d="${arc(0, 8, R)}"/><path class="red" d="${arc(7, 8, R - 4)}"/>
      ${ticks}${nums}<text class="unit" x="${cx}" y="${cy + 17}" text-anchor="middle">× 1000 RPM</text>
      <g class="needle"><line x1="${cx}" y1="${cy}" x2="${cx - 84}" y2="${cy}"/></g><circle class="hub" cx="${cx}" cy="${cy}" r="6"/>
    </svg>`;
  }

  const LOOKS = {
    a: {
      name: 'On air',
      line: 'A station card: CHECK YOUR over a giant INBOX, level with the list, the address as a news lower-third, the channel bug in the corner. The headline rolls in and locks, the section under it glitches in.',
      html: (d, w) => `
        <h3 class="xa-hl" data-x tabindex="-1"><span>Check your</span>Inbox</h3>
        <div class="xa-tw" data-x><p class="xa-third"><span class="k">Sent to</span><b>${esc(d.addr)}</b></p></div>
        <ol class="xa-steps" data-x>${w.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
        <div class="x-foot" data-x><p>${esc(w.spam)}</p><div class="x-acts"></div></div>
        <p class="xa-bug" aria-hidden="true"><span>${esc(d.name)}</span><i>CH ${d.ch}</i></p>`,
    },
    b: {
      name: 'Redline',
      line: 'RevAudio’s own instrument: a phosphor rev counter. The needle sweeps up, bounces off the limiter and SENT lights; then the words.',
      html: (d, w) => `
        <div class="xb-gauge" data-x>${gauge()}<span class="xb-sent">Sent</span></div>
        <h3 class="xb-hl" data-x tabindex="-1">${esc(w.hl)}</h3>
        <p class="xb-to" data-x>${esc(w.to)} <b>${esc(d.addr)}</b>.</p>
        <p class="xb-next" data-x>${esc(w.steps[0])}, pick Mac or Windows, and the download starts.</p>
        <div class="x-foot" data-x><p>${esc(w.spam)}</p><div class="x-acts"></div></div>`,
    },
    c: {
      name: 'Channel 00',
      line: 'The TV changes channel to INBOX: the set’s on-screen number, a SENDING bar that fills like the volume bar, then the steps as the set’s menu rows.',
      html: (d, w) => `
        <div class="xc-top" data-x>
          <div class="xc-bar" aria-hidden="true"><p class="xc-lbl"><span class="s1">Sending</span><span class="s2">Sent ✓</span></p>
            <p class="xc-segs">${'<i></i>'.repeat(12)}</p></div>
          <p class="xc-osd" aria-hidden="true"><b>00</b><span>Inbox</span></p>
        </div>
        <h3 class="xc-hl" data-x tabindex="-1">${esc(w.hl)}</h3>
        <p class="xc-to" data-x>Sent to <b>${esc(d.addr)}</b></p>
        <ol class="xc-steps" data-x>${w.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
        <div class="x-foot" data-x><p>${esc(w.spam)}</p><div class="x-acts"></div></div>`,
    },
  };

  const CSS = `
  /* ---- all three: over the real sent screen ---- */
  .ws[data-look].is-sent { max-width: none; }
  /* A is built into the TV (Dan picked it 2026-11-09): the bench hides the built card too, so B, C and this A
     prototype still draw on their own */
  .ws[data-look] .ws-sent > :is(.ws-st, .ws-to, .ws-desk, .ws-spam, .ws-tw, .ws-steps, .ws-foot, .ws-bug) { display: none !important; }
  .ws[data-look] .ws-sent:not([hidden]) { display: block; }
  .wsx { --x-red: hsl(354 92% 58%); display: grid; gap: 0.95rem; justify-items: start; font-family: var(--font-body); color: var(--ww-ink); }
  .wsx p, .wsx h3, .wsx ol { margin: 0; }
  .wsx b { color: var(--ww-ink-hot); font-weight: 600; overflow-wrap: anywhere; }
  .wsx .x-foot { display: grid; gap: 0.45rem; font: 500 0.88rem/1.4 var(--font-body); color: hsl(var(--ww-ch-h) 24% 80%); }
  .wsx .x-acts .ws-act { margin: 0; }
  .wsx h3:focus { outline: none; }

  /* ---- A · On air ---- */
  .wsx-a { gap: 1.05rem; }
  /* the channel bug sits in the screen's corner, where a station's bug sits (bottom right; BACK holds the top right) */
  .ws.is-sent[data-look='a'] { position: relative; }
  .xa-bug { position: absolute; right: 0; bottom: 0; display: inline-flex; align-items: center; gap: 0.6rem; font: 400 1.05rem/1 var(--font-display); letter-spacing: 0.16em; text-transform: uppercase; color: var(--ww-ink); }
  .xa-bug i { font-style: normal; padding: 0.26rem 0.42rem 0.14rem; background: var(--ww-ink-hot); color: var(--ww-ink-on); letter-spacing: 0.1em; box-shadow: 0 0 14px var(--ww-glow-hot); }
  .xa-hl { font: 400 clamp(4.8rem, 8.6vw, 7.4rem)/0.8 var(--font-display); letter-spacing: 0.02em; text-transform: uppercase; color: var(--ww-ink-hot); text-shadow: 0 0 14px var(--ww-glow), 0 0 44px var(--ww-glow-soft); }
  .xa-hl span { display: block; margin-bottom: 0.06em; font-size: 0.4em; line-height: 1; letter-spacing: 0.18em; color: var(--ww-ink); text-shadow: 0 0 9px var(--ww-glow); }
  .xa-third { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.15rem 0.75rem; max-width: 100%; padding: 0.6rem 2.3rem 0.52rem 0.95rem; background: var(--ww-ink-hot); color: var(--ww-ink-on); clip-path: polygon(0 0, 100% 0, calc(100% - 1.3rem) 100%, 0 100%); }
  .xa-third .k { font: 400 1.2rem/1 var(--font-display); letter-spacing: 0.16em; text-transform: uppercase; }
  .xa-third b { color: inherit; font: 700 1.04rem/1.25 var(--font-body); }
  .xa-steps { display: grid; gap: 0.45rem; padding: 0; list-style: none; counter-reset: xa; font: 500 1rem/1.35 var(--font-body); color: hsl(var(--ww-ch-h) 30% 92%); }
  .xa-steps li { display: grid; grid-template-columns: 1.65rem minmax(0, 1fr); gap: 0.65rem; align-items: baseline; counter-increment: xa; }
  .xa-steps li::before { content: counter(xa); display: grid; place-items: center; height: 1.6rem; font: 400 1.05rem/1 var(--font-display); color: var(--ww-ink-hot); box-shadow: inset 0 0 0 1.5px var(--ww-ink); }
  /* a laptop: the headline leads, its top level with the list's first row (Dan r2: "where the ②"; apply() measures
     --xa-level); BACK floats in the top right; the panel keeps the glass's height, so the bug has a corner */
  @media (min-width: 861px) {
    .ww-panel.is-signing:has(> .ws.is-sent[data-look='a']) { align-self: stretch; align-content: stretch; }
    .ws.is-sent[data-look='a'] { align-self: stretch; align-content: start; padding-top: var(--xa-level, 0px); }
    .ws.is-sent[data-look='a'] > .ws-head { position: absolute; top: 0; right: 0; width: auto; }
  }

  /* ---- B · Redline ---- */
  .wsx-b { gap: 0.75rem; }
  .xb-gauge { position: relative; width: min(100%, 20rem); margin-bottom: 0.1rem; }
  .xb-gauge svg { display: block; width: 100%; height: auto; overflow: visible; }
  .xb-gauge .arc { fill: none; stroke: var(--ww-ink); stroke-width: 1.6; opacity: 0.5; }
  .xb-gauge .red { fill: none; stroke: var(--x-red); stroke-width: 7; opacity: 0.9; }
  .xb-gauge .tick { stroke: var(--ww-ink); stroke-width: 2.4; stroke-linecap: round; }
  .xb-gauge .tick.minor { stroke-width: 1.3; opacity: 0.6; }
  .xb-gauge .tick.hot { stroke: var(--x-red); }
  .xb-gauge .num { font-family: var(--font-display); font-size: 15px; letter-spacing: 0.04em; fill: var(--ww-ink); }
  .xb-gauge .unit { font-family: var(--font-display); font-size: 8.5px; letter-spacing: 0.26em; fill: var(--ww-ink); opacity: 0.7; }
  .xb-gauge .needle { transform-box: view-box; transform-origin: 120px 118px; }
  .xb-gauge .needle line { stroke: var(--ww-ink-hot); stroke-width: 3.2; stroke-linecap: round; filter: drop-shadow(0 0 4px var(--ww-glow-hot)); }
  .xb-gauge .hub { fill: var(--ww-ink-hot); }
  .xb-sent { position: absolute; left: 50%; bottom: 25%; translate: -50% 0; font: 400 2.3rem/1 var(--font-display); letter-spacing: 0.14em; text-transform: uppercase; color: var(--ww-ink-hot); text-shadow: 0 0 12px var(--ww-glow-hot), 0 0 30px var(--ww-glow-soft); }
  .xb-hl { font: 400 clamp(3.2rem, 5.6vw, 4.6rem)/0.86 var(--font-display); letter-spacing: 0.02em; text-transform: uppercase; color: var(--ww-ink-hot); text-shadow: 0 0 12px var(--ww-glow), 0 0 38px var(--ww-glow-soft); }
  .xb-to { font: 500 1.06rem/1.4 var(--font-body); }
  .xb-next { max-width: 30rem; font: 500 0.98rem/1.4 var(--font-body); color: hsl(var(--ww-ch-h) 30% 92%); }

  /* ---- C · Channel 00 ---- */
  .wsx-c { gap: 0.9rem; justify-items: stretch; }
  .xc-top { display: flex; justify-content: space-between; align-items: end; gap: 1.2rem; }
  .xc-bar { display: grid; gap: 0.45rem; flex: 1; max-width: 16rem; }
  .xc-lbl { position: relative; font: 400 1.05rem/1 var(--font-display); letter-spacing: 0.22em; text-transform: uppercase; color: var(--ww-ink); }
  .xc-lbl .s1 { position: absolute; inset: 0 auto auto 0; visibility: hidden; }
  .xc-lbl .s2 { color: var(--ww-ink-hot); }
  .xc-segs { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 3px; height: 0.95rem; }
  .xc-segs i { background: var(--ww-ink-hot); box-shadow: 0 0 8px var(--ww-glow-hot); }
  .xc-osd { display: grid; justify-items: end; font-family: var(--font-display); text-transform: uppercase; }
  .xc-osd b { font-weight: 400; font-size: 4.6rem; line-height: 0.78; letter-spacing: 0.02em; color: var(--ww-ink-hot); text-shadow: 0 0 12px var(--ww-glow-hot), 0 0 30px var(--ww-glow-soft); }
  .xc-osd span { font-size: 1.1rem; letter-spacing: 0.32em; color: var(--ww-ink); }
  .xc-hl { font: 400 clamp(3.4rem, 6vw, 5rem)/0.86 var(--font-display); letter-spacing: 0.02em; text-transform: uppercase; color: var(--ww-ink-hot); text-shadow: 0 0 12px var(--ww-glow), 0 0 38px var(--ww-glow-soft); }
  .xc-to { font: 500 1.06rem/1.4 var(--font-body); }
  .xc-steps { display: grid; gap: 2px; padding: 0; list-style: none; counter-reset: xc; }
  .xc-steps li { counter-increment: xc; display: grid; grid-template-columns: 1.9rem minmax(0, 1fr); align-items: center; padding: 0.42rem 0.7rem 0.32rem 0.55rem; font: 400 1.18rem/1.1 var(--font-display); letter-spacing: 0.07em; text-transform: uppercase; color: var(--ww-ink); box-shadow: inset 0 -1px 0 hsl(var(--ww-ch-h) var(--ww-gs) 58% / 0.24); }
  .xc-steps li::before { content: counter(xc); color: var(--ww-ink-hot); }
  .xc-steps li:first-child { background: var(--ww-ink-hot); color: var(--ww-ink-on); box-shadow: 0 0 18px var(--ww-glow-hot); }
  .xc-steps li:first-child::before { color: var(--ww-ink-on); }

  /* ---- phones: the look centred in the glass ---- */
  @media (max-width: 860px) {
    .ww[data-ww-view='panel']:has(.ws.is-sent[data-look]) { grid-template-rows: minmax(0, 1fr); }
    .ww-panel.is-signing:has(> .ws.is-sent[data-look]) { align-self: stretch; align-content: stretch; grid-template-rows: minmax(0, 1fr); }
    .ws.is-sent[data-look] { align-self: stretch; grid-template-rows: auto minmax(0, 1fr); }
    .ws.is-sent[data-look] .ws-sent { align-self: center; }
    .wsx { justify-items: center; text-align: center; }
    .wsx .x-acts .ws-act { justify-content: center; }
    .xa-hl { font-size: clamp(4.4rem, 26vw, 6.4rem); }
    .xa-third { clip-path: none; padding: 0.6rem 0.95rem 0.52rem; justify-content: center; }
    .ws.is-sent[data-look='a'] .ws-sent { padding-bottom: 2.6rem; } /* the bug's corner stays clear on a short phone */
    .xa-steps, .xc-steps { justify-self: center; text-align: left; }
    .xb-hl, .xc-hl { font-size: clamp(2.8rem, 13vw, 3.6rem); }
    .xb-next { max-width: 22rem; }
    .xc-top { justify-content: center; }
    .xc-osd b { font-size: 3.8rem; }
  }
  `;

  // the look's entrance, in the TV's own times where it has them (--ww-mv-*); returns the animations
  function enter(root, key, slow = 1) {
    const win = root.ownerDocument.defaultView;
    if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return [];
    const all = [];
    const k = slow;
    const an = (el, frames, o) => { if (!el) return; const a = el.animate(frames, { fill: 'both', ...o, duration: o.duration * k, delay: (o.delay || 0) * k }); all.push(a); return a; };
    const rise = (els, at, gap = 70) => els.forEach((el, i) => an(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: at + i * gap, easing: 'cubic-bezier(.2,.8,.2,1)' }));
    const q = (s) => root.querySelector(s);
    // the TV's own glitch as an entrance (WordWall's glJump: sideways in steps, a red then a cyan fringe, the same two
    // inks), the size of a fault you notice (~20 px over 420 ms; the idle one is 3 px over 150 ms): each row torn its
    // own way, some blink off once, then it locks with a flash. Stepped (each keyframe holds till the next), and the
    // last two keyframes alike: the browser's clock can end a hair short of 1 (1.46 s - 1.04 s), which on a step
    // leaves the one before last up (the flash stayed lit, the bug stayed dark: caught 2026-11-09)
    const RED = '#ff0033', CYAN = '#00e5ff';
    const glitchIn = (els, at) => {
      const amp = [22, -15, 19, -26, 12, -18], lag = [0, 30, 10, 50, 20, 40], blink = [0, 1, 0, 1, 1, 0];
      const s = 'steps(1, end)', fr = (dx, c) => `drop-shadow(${dx.toFixed(1)}px 0px 0px ${c})`;
      els.forEach((el, i) => {
        const a = amp[i % 6];
        an(el, [
          { opacity: 0, translate: `${a}px 0px`, filter: fr(0, RED), easing: s },
          { offset: 0.14, opacity: 1, translate: `${a}px 0px`, filter: fr(-0.4 * a, RED), easing: s },
          { offset: 0.3, opacity: blink[i % 6] ? 0 : 1, translate: `${-0.5 * a}px 0px`, filter: fr(0.3 * a, CYAN), easing: s },
          { offset: 0.46, opacity: 1, translate: `${-0.6 * a}px 0px`, filter: fr(0.4 * a, CYAN), easing: s },
          { offset: 0.64, opacity: 1, translate: `${0.3 * a}px 0px`, filter: fr(-3, RED), easing: s },
          { offset: 0.8, opacity: 1, translate: '0px 0px', filter: 'brightness(1.45)', easing: s },
          { offset: 0.92, opacity: 1, translate: '0px 0px', filter: 'none', easing: s },
          { opacity: 1, translate: '0px 0px', filter: 'none' },
        ], { duration: 420, delay: at + lag[i % 6] });
      });
    };
    if (key === 'a') {
      // the headline rolls in from below and locks (a CRT's vertical hold), the tube flaring as it does (as far as the
      // whole card rolled in round 2)
      const reach = Math.round(root.offsetHeight * 0.46);
      an(q('.xa-hl'), [
        { transform: `translateY(${reach}px)`, opacity: 0, filter: 'brightness(2.2) blur(1.5px)' },
        { transform: `translateY(${Math.round(-reach * 0.09)}px)`, opacity: 1, filter: 'brightness(1.5) blur(0.6px)', offset: 0.55 },
        { transform: `translateY(${Math.round(reach * 0.026)}px)`, filter: 'brightness(1.15) blur(0px)', offset: 0.78 },
        { transform: 'none', opacity: 1, filter: 'none' },
      ], { duration: 560, easing: 'cubic-bezier(.25,.9,.3,1)' });
      // the section under it glitches in (Dan r2: "this all section will be glitching in instead of coming like this")
      glitchIn([q('.xa-tw'), ...root.querySelectorAll('.xa-steps li'), q('.x-foot > p'), q('.x-acts')], 520);
      // the station's bug comes on last, in its corner
      const s = 'steps(1, end)';
      an(q('.xa-bug'), [{ opacity: 0, easing: s }, { offset: 0.3, opacity: 1, easing: s }, { offset: 0.5, opacity: 0.15, easing: s }, { offset: 0.7, opacity: 1, easing: s }, { opacity: 1 }], { duration: 420, delay: 1040 });
    } else if (key === 'b') {
      const g = q('.xb-gauge');
      an(g, [{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
      root.querySelectorAll('.xb-gauge .tick').forEach((t, i) => an(t, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: 60 + i * 18, easing: 'steps(1, end)' }));
      // the sweep revs up (ease-in), then the limiter: it bounces off the redline and settles just under it
      const deg = (v) => `rotate(${(v * 22.5).toFixed(2)}deg)`;
      an(q('.xb-gauge .needle'), [
        { transform: deg(0), easing: 'cubic-bezier(.55,0,.85,.4)' },
        { transform: deg(7.92), offset: 0.52, easing: 'ease-out' },
        { transform: deg(7.42), offset: 0.6, easing: 'ease-in' },
        { transform: deg(7.92), offset: 0.67, easing: 'ease-out' },
        { transform: deg(7.55), offset: 0.74, easing: 'ease-in' },
        { transform: deg(7.92), offset: 0.81, easing: 'ease-out' },
        { transform: deg(7.7), offset: 0.9 },
        { transform: deg(7.78) },
      ], { duration: 1250, delay: 260 });
      an(q('.xb-gauge .red'), [{ opacity: 0.35 }, { opacity: 1, offset: 0.2 }, { opacity: 0.5, offset: 0.4 }, { opacity: 1, offset: 0.6 }, { opacity: 0.9 }], { duration: 520, delay: 910, easing: 'steps(1, end)' });
      an(q('.xb-sent'), [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.4, offset: 0.45 }, { opacity: 1 }], { duration: 420, delay: 920, easing: 'steps(1, end)' });
      rise([q('.xb-hl'), q('.xb-to'), q('.xb-next'), q('.x-foot')], 1180);
    } else if (key === 'c') {
      // the channel goes blank, the set's number comes up, the bar fills like the volume bar, then the page draws
      an(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'steps(1, end)' });
      an(q('.xc-osd'), [{ opacity: 0 }, { opacity: 1 }], { duration: 10, delay: 160 });
      root.querySelectorAll('.xc-segs i').forEach((s, i) => an(s, [{ opacity: 0.12 }, { opacity: 1 }], { duration: 10, delay: 240 + i * 52 }));
      // SENDING while it fills, then SENT ✓ (the resting state)
      an(q('.xc-lbl .s1'), [{ visibility: 'visible' }, { visibility: 'visible' }], { duration: 240 + 12 * 52, fill: 'none' });
      an(q('.xc-lbl .s2'), [{ visibility: 'hidden' }, { visibility: 'hidden' }], { duration: 240 + 12 * 52, fill: 'none' });
      an(q('.xc-segs'), [{ filter: 'brightness(1)' }, { filter: 'brightness(1.8)', offset: 0.4 }, { filter: 'brightness(1)' }], { duration: 260, delay: 240 + 12 * 52 });
      rise([q('.xc-hl'), q('.xc-to')], 920);
      root.querySelectorAll('.xc-steps li').forEach((li, i) => an(li, [{ opacity: 0 }, { opacity: 1 }], { duration: 10, delay: 1080 + i * 90 }));
      rise([q('.x-foot')], 1380);
    }
    return all;
  }

  // lay a look over the sent screen of the lit panel (d: { name, kind, days, addr, ch })
  function apply(doc, key, d, slow = 1) {
    let st = doc.getElementById('wsx-style');
    if (!st) { st = doc.createElement('style'); st.id = 'wsx-style'; st.textContent = CSS; doc.head.append(st); }
    const ws = doc.querySelector('.ww-panel.is-active .ws.is-sent');
    if (!ws) return null;
    const sent = ws.querySelector('.ws-sent');
    const old = sent.querySelector('.wsx');
    const act = ws.querySelector('.ws-act'), msg = ws.querySelector('.ws-msg');
    if (old) { sent.append(act, msg); old.remove(); }
    ws.dataset.look = key;
    ws.style.removeProperty('--xa-level');
    const x = doc.createElement('div');
    x.className = 'wsx wsx-' + key;
    x.innerHTML = LOOKS[key].html(d, words(d));
    x.querySelector('.x-acts').append(act, msg);
    sent.prepend(x);
    if (key === 'a') level(doc, ws, x);
    x.querySelector('h3')?.focus({ preventScroll: true });
    return { root: x, anims: enter(x, key, slow) };
  }

  // A on a laptop: the headline's top level with the list's first row, its name (both Bebas at line-height 1 and
  // about one size, so the boxes' tops are the caps' tops); measured before the entrance moves anything
  function level(doc, ws, x) {
    if (doc.defaultView.matchMedia('(max-width: 860px)').matches) return;
    const row = [...doc.querySelectorAll('[data-ww-pick]')].find((r) => r.offsetParent);
    const name = row?.querySelector('.ww-name'), hl = x.querySelector('.xa-hl');
    if (!name || !hl) return;
    const dy = name.getBoundingClientRect().top - hl.getBoundingClientRect().top;
    ws.style.setProperty('--xa-level', `${Math.max(0, Math.round(dy))}px`);
  }

  window.WWSENT = { LOOKS, words, apply, enter, CSS };
})();
