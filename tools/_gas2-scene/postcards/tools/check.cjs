/* GAS 2 postcards - the checks. Serve tools/_gas2-scene (any static server), then:
     NODE_PATH=<revaudio-website>/node_modules node check.cjs [base url] [shots dir]
   WebKit (the engine of the phones we target): layout at five phone viewports + every interaction by script.
   Chrome (channel "chrome"): the demo audio, because Playwright's WebKit build has no AAC decoder.
   Not covered here: a real finger (momentum, iOS edge swipes), the real iOS keyboard (mimicked: a shorter screen, as
   iOS 26 cuts the page to what's above the keys), sound by ear - that is a real iPhone. */
const { webkit, chromium } = require("playwright");
const fs = require("fs");
const BASE = process.argv[2] || "http://127.0.0.1:4466/postcards.html";
const SHOTS = process.argv[3] || null;
const SIZES = [[402, 714], [375, 553], [390, 664], [393, 659], [430, 750]];   // Safari's visible viewport, toolbar up
const out = { layout: [], steps: [], audio: null, reduced: null, errors: [] };
const ok = (name, pass, info) => { out.steps.push({ name, pass: !!pass, info }); };
const KNOWN = /Decoding failed|EncodingError/;   // Playwright WebKit: no AAC decoder (iOS Safari has one)

async function page(browser, w, h, extra) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, extra || {}));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => out.errors.push(`${w}x${h} pageerror ${e.message}`));
  p.on("console", (m) => { if (m.type() === "error" && !KNOWN.test(m.text())) out.errors.push(`${w}x${h} console ${m.text()}`); });
  return p;
}
const go = async (p, q) => { await p.goto(BASE + (q || "")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700); };
const cur = (p) => p.evaluate(() => window.gas2Postcards.cur);

async function drag(p, dx, dy, ms, hold, after = 650) {   // a finger-like drag with the mouse (pointer events)
  const r = await p.evaluate(() => { const b = document.querySelector(".pc.top").getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height * .4 }; });
  await p.mouse.move(r.x, r.y); await p.mouse.down();
  const n = 8; for (let i = 1; i <= n; i++) { await p.mouse.move(r.x + dx * i / n, r.y + dy * i / n); await p.waitForTimeout(ms / n); }
  if (hold) await p.waitForTimeout(hold);
  await p.mouse.up(); await p.waitForTimeout(after);
}

(async () => {
  const wk = await webkit.launch();

  // ── layout: every card fits, nothing overflows, the controls are on screen ──
  for (const [w, h] of SIZES) {
    const p = await page(wk, w, h);
    for (const q of ["?card=1", "?card=2", "?card=5", "?card=5&flip", "?card=6", "?card=7", "?card=7&sent"]) {
      await go(p, q);
      if (q.startsWith("?card=7")) {
        await p.waitForTimeout(1500);                    // the focus pull + the pop
        const e = await p.evaluate(() => {
          const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
          const op = (s) => getComputedStyle(document.querySelector(s)).opacity;
          const tk = document.getElementById("toSite");
          return { sw: document.documentElement.scrollWidth, iw: innerWidth, ih: innerHeight, rd: r(".rd"), n: r(".rd .n"), cta: r(".rd .cta"), bar: r(".endbar"),
                   ended: document.getElementById("desk").classList.contains("ended"), end: op(".end"), ti: op(".rd .ti"), scr: op(".rd .scr"),
                   gas2px: parseFloat(getComputedStyle(document.querySelector(".rd .n")).fontSize), label: document.querySelector(".rd .cta").innerText.trim(),
                   ticket: getComputedStyle(tk).display === "none" ? null : r("#toSite .tk"), href: tk.href };
        });
        const pass = e.ended && e.end === "1" && e.ti === "1" && e.scr === "1" && e.sw <= e.iw && e.rd[0] >= 0 && e.rd[2] <= e.iw && e.n[1] >= 0 && e.cta[3] < e.bar[1] &&
          (q.endsWith("sent") ? e.label === "✓ Keys in the mail" && e.ticket && e.ticket[0] >= 0 && e.ticket[2] <= e.iw && e.ticket[3] < e.bar[1] && e.href === "https://revaudio.net/store"
                              : e.label === "⤓ Download FREE" && !e.ticket);
        out.layout.push({ size: `${w}x${h}`, q, pass, m: e });
        if (SHOTS) await p.screenshot({ path: `${SHOTS}/${w}x${h}-${q.replace(/[?&=]/g, "")}.png` });
        continue;
      }
      const m = await p.evaluate(() => {
        const top = document.querySelector(".pc.top").getBoundingClientRect(), ctl = document.querySelector(".ctl").getBoundingClientRect();
        const send = document.querySelector(".send .ink").getBoundingClientRect(), y = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; };
        const box = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
        return { sw: document.documentElement.scrollWidth, iw: innerWidth, ih: innerHeight, card: [Math.round(top.left), Math.round(top.top), Math.round(top.width), Math.round(top.height)],
                 cardBottom: Math.round(top.bottom), ctlTop: Math.round(ctl.top), ctlBottom: Math.round(ctl.bottom), sendH: Math.round(send.height),
                 input: parseFloat(getComputedStyle(document.getElementById("em")).fontSize),
                 // the mail card, top to bottom: the TO line, the consent box, the stamp. The HEAR IT back (round 3): the record, the
                 // sticker (the maker's badge beside it), the legend, the keys; Turn back up in a corner. Its front: Turn it over, big
                 mail: [y(".addr"), y(".opt"), y(".send .ink")], hearCard: box("#hear"), keyH: Math.round(document.querySelector("#hear .keys button").getBoundingClientRect().height),
                 hear: ["#hear .disc", "#hear .sticker", "#hear .legend", "#hear .keys", "#hear .maker", "#hear .back .turn"].map(box),
                 front: [box("#hear .front .hline"), box("#hear .front .turn")] };
      });
      const inOrder = (rows) => rows.every((r, i) => i === 0 || r[0] >= rows[i - 1][1] - 1);
      const deckOk = (() => {
        const [disc, sticker, legend, keys, maker, turn] = m.hear, c = m.hearCard, r = (disc[2] - disc[0]) / 2, cx = (disc[0] + disc[2]) / 2, cy = (disc[1] + disc[3]) / 2;
        const inside = m.hear.every((b) => b[0] >= c[0] - 1 && b[1] >= c[1] - 1 && b[2] <= c[2] + 1 && b[3] <= c[3] + 1);
        const stacked = [disc, sticker, legend, keys].every((b, i, a) => i === 0 || b[1] >= a[i - 1][3] - 1) && maker[0] >= sticker[2] && maker[3] <= legend[1] + 1;
        const turnClear = Math.hypot(Math.max(turn[0] - cx, 0, cx - turn[2]), Math.max(turn[1] - cy, 0, cy - turn[3])) > r;   // the corner button never sits on the record
        return inside && stacked && turnClear && m.keyH >= 44 && turn[2] - turn[0] >= 44;
      })();
      const pass = m.sw <= m.iw && m.card[0] >= 0 && m.card[1] >= 0 && m.cardBottom <= m.ctlTop + 2 && m.ctlBottom <= m.ih && m.input >= 16 &&
        (q !== "?card=6" || (inOrder(m.mail) && m.mail[2][1] <= m.cardBottom)) &&
        (q !== "?card=5&flip" || deckOk) &&
        (q !== "?card=5" || (m.front[1][1] >= m.front[0][3] - 1 && m.front[1][3] <= m.cardBottom && m.front[1][0] >= m.card[0] && m.front[1][2] <= m.card[0] + m.card[2] && m.front[1][3] - m.front[1][1] >= 44));
      out.layout.push({ size: `${w}x${h}`, q, pass, m });
      if (SHOTS) await p.screenshot({ path: `${SHOTS}/${w}x${h}-${q.replace(/[?&=]/g, "")}.png` });
    }
    await p.context().close();
  }

  // ── the stack: flick, spring back, buttons, keys, the last card stays ──
  const p = await page(wk, 402, 714);
  await go(p, "");
  ok("first load = card 1, back disabled", (await cur(p)) === 0 && await p.evaluate(() => document.getElementById("prev").disabled));
  await drag(p, -40, 4, 400);
  ok("slow short drag springs back", (await cur(p)) === 0);
  await drag(p, -110, 0, 80, 300);
  ok("a quick drag that stops before letting go springs back", (await cur(p)) === 0);
  await drag(p, -190, -20, 120);
  ok("flick left throws card 1", (await cur(p)) === 1);
  const gone = await p.evaluate(() => getComputedStyle(document.querySelectorAll(".pc")[0]).visibility);
  ok("thrown card is hidden after it lands", gone === "hidden", gone);
  const moving = await p.evaluate(() => { const c = document.querySelector(".pc.top");   // the card itself may settle; its print may not
    return document.getAnimations().filter((x) => { const t = x.effect && x.effect.target; return t && t !== c && c.contains(t) && !t.classList.contains("lifts"); })
      .map((x) => (x.effect.target.className || x.effect.target.tagName) + (x.effect.pseudoElement || "")); });
  ok("a card comes up whole (Dan, 2026-10-30: the readings glued to the card): nothing printed on it pops or moves", moving.length === 0, moving);
  await drag(p, 30, 260, 110);
  ok("flick down throws too", (await cur(p)) === 2);
  await p.click("#prev"); await p.waitForTimeout(650);
  ok("back brings the last card back", (await cur(p)) === 1);
  await drag(p, 150, 6, 160);                                 // left to right (Dan, 2026-10-30): back
  const b1 = await p.evaluate(() => ({ cur: window.gas2Postcards.cur, top: document.querySelector(".pc.top") === document.querySelectorAll(".pc")[0] }));
  ok("a flick from left to right brings the card before back on top", b1.cur === 0 && b1.top, b1);
  await drag(p, 150, 6, 160);
  ok("on card 1 a flick right only gives a little: nothing before it, nothing thrown", (await cur(p)) === 0 &&
     await p.evaluate(() => getComputedStyle(document.querySelectorAll(".pc")[0]).visibility === "visible"));
  await drag(p, 40, 2, 400);
  await drag(p, -190, -20, 120);
  ok("right to left still throws it on", (await cur(p)) === 1);
  // whatever takes over a moving card takes it from where it is: no jumps (Dan, 2026-10-30: "everything ... smooth")
  const jump1 = await p.evaluate(async () => {
    const c = document.querySelectorAll(".pc")[1], x = () => Math.round(c.getBoundingClientRect().left);
    const frames = async (n) => { for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r)); };
    document.getElementById("next").click(); await frames(5);
    const a = x(); document.getElementById("prev").click(); const b = x();     // called back mid-flight...
    await frames(5);
    const c1 = x(); document.getElementById("next").click(); return { a, b, c: c1, d: x() };   // ...and on again on its way back
  });
  await p.waitForTimeout(700);
  ok("back mid-flight, then next on its way back: each time it turns round where it is, no jump", (await cur(p)) === 2 &&
     Math.abs(jump1.b - jump1.a) < 2 && Math.abs(jump1.d - jump1.c) < 2, jump1);
  await p.click("#prev"); await p.waitForTimeout(700);
  await drag(p, -80, 0, 320, 150, 0);                       // let go still: it springs home...
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(1400);   // ...and a tap on the way (it nudges)
  const home = await p.evaluate(() => { const m = new DOMMatrix(getComputedStyle(document.querySelector(".pc.top")).transform); return { x: +m.m41.toFixed(1), y: +m.m42.toFixed(1) }; });
  ok("a tap while a let-go card springs home doesn't stop it there: it gets home", Math.abs(home.x - .9) < .5 && Math.abs(home.y) < .5, home);
  await drag(p, -80, 0, 320, 150, 0);                       // let go still: it springs home, and next comes before it's there
  const jump2 = await p.evaluate(() => { const c = document.querySelector(".pc.top"), x = () => Math.round(c.getBoundingClientRect().left);
    const a = x(); document.getElementById("next").click(); return { a, b: x() }; });
  await p.waitForTimeout(700);
  ok("next while a let-go card springs home: it flies from where it is", (await cur(p)) === 2 && Math.abs(jump2.b - jump2.a) < 2, jump2);
  await p.click("#prev"); await p.waitForTimeout(700);
  await drag(p, -80, 0, 320, 150, 0);
  await p.evaluate(() => document.getElementById("prev").click());
  await p.waitForTimeout(900);
  const under = await p.evaluate(() => ({ cur: window.gas2Postcards.cur, ty: +new DOMMatrix(getComputedStyle(document.querySelectorAll(".pc")[1]).transform).m42.toFixed(1) }));
  ok("back while a let-go card springs home: it settles as the second card, under the one brought back", under.cur === 0 && Math.abs(under.ty - 9) < .6, under);
  await p.click("#next"); await p.waitForTimeout(700);
  const quick = await p.evaluate(() => new Promise((done) => {   // the finger up before the next frame
    const c = document.querySelector(".pc.top"), r = c.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height * .4;
    c.setPointerCapture = () => {};                         // synthetic events have no pointer to capture
    const ev = (type, dx) => c.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 7, isPrimary: true, clientX: x + dx, clientY: y }));
    ev("pointerdown", 0); ev("pointermove", -40); ev("pointerup", -90);
    delete c.setPointerCapture;
    setTimeout(() => done(window.gas2Postcards.cur), 700);
  }));
  ok("a flick quicker than a frame still throws", quick === 2, quick);
  await go(p, "?card=2");                                    // the rest starts on card 2 whatever happened above
  const g = await p.evaluate(() => { const c = document.querySelector(".pc.top"), r = c.getBoundingClientRect(), b = c.querySelector(".big").getBoundingClientRect();
    return { key: !!c.querySelector(".key"), mid: +(((b.top + b.bottom) / 2 - r.top) / r.height).toFixed(3), line: getComputedStyle(c.querySelector(".gline")).fontFamily }; });
  ok("grade card (Dan, round 2): no key, the lettering centred, the line in its face", !g.key && Math.abs(g.mid - .5) < .04 && /Oswald/.test(g.line), g);
  await p.click("#next"); await p.click("#next"); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(650);
  ok("next + ArrowRight reach HEAR IT", (await cur(p)) === 4);

  // ── HEAR IT turns over (tap on the card, then the Turn back button) ──
  const box5 = await p.evaluate(() => { const b = document.getElementById("hear").getBoundingClientRect(); return { x: b.left + b.width * .3, y: b.top + b.height * .62 }; });
  await p.mouse.click(box5.x, box5.y); await p.waitForTimeout(900);
  const f1 = await p.evaluate(() => ({ flipped: document.getElementById("hear").classList.contains("flipped"),
    back: getComputedStyle(document.querySelector("#hear .back")).visibility, front: getComputedStyle(document.querySelector("#hear .front")).visibility }));
  ok("tap turns HEAR IT over (one face at a time)", f1.flipped && f1.back === "visible" && f1.front === "hidden", f1);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/flow-hear-back.png` });
  const body = await p.evaluate(() => { const b = document.getElementById("hear").getBoundingClientRect(); return { x: b.left + b.width * .5, y: b.top + b.height * .655 }; });
  await p.mouse.click(body.x, body.y); await p.waitForTimeout(700);
  const f2 = await p.evaluate(() => ({ flipped: document.getElementById("hear").classList.contains("flipped"), grooves: document.getElementById("vinyl").width,
    speed: gas2Postcards.deck.speed, mode: gas2Postcards.deck.mode }));
  ok("the back up: the record is cut, the motor runs, the arm rests; a tap on the deck's body doesn't turn the card", f2.flipped && f2.grooves > 300 && f2.speed > 150 && f2.mode === "rest", f2);
  const st = await p.evaluate(() => { const b = document.getElementById("sticker").getBoundingClientRect(); return { x: b.left + b.width * .4, y: b.top + b.height * .6 }; });
  await p.mouse.click(st.x, st.y); await p.waitForTimeout(150);
  const f3 = await p.evaluate(() => ({ mode: gas2Postcards.deck.mode, flipped: document.getElementById("hear").classList.contains("flipped") }));
  ok("the sticker is a way in (round 3): a tap on it cues the record, the card stays turned", f3.mode === "cue" && f3.flipped, f3);
  await p.waitForTimeout(2600);                              // WebKit here can't decode the demo: the arm goes home, the note says so
  await p.click("#hear .back [data-turn]"); await p.waitForTimeout(900);
  ok("Turn back shows the front again", !(await p.evaluate(() => document.getElementById("hear").classList.contains("flipped"))));
  await p.click("#next"); await p.waitForTimeout(700);
  ok("card 6 is up, the mailbox with it", (await cur(p)) === 5 && await p.evaluate(() => document.getElementById("box").classList.contains("up")));
  const grab6 = await p.evaluate(() => { const b = document.querySelector(".pc.top .mtitle").getBoundingClientRect(); return { x: b.left + 10, y: b.top + 10 }; });
  await p.mouse.move(grab6.x, grab6.y); await p.mouse.down();
  for (let i = 1; i <= 8; i++) { await p.mouse.move(grab6.x - 30 * i, grab6.y - 3 * i); await p.waitForTimeout(12); }
  await p.mouse.up(); await p.waitForTimeout(1500);
  const end1 = await p.evaluate(() => ({ cur: window.gas2Postcards.cur, ended: document.getElementById("desk").classList.contains("ended"),
    ti: getComputedStyle(document.querySelector(".rd .ti")).opacity, ctl: getComputedStyle(document.querySelector(".ctl")).opacity, box: document.getElementById("box").classList.contains("up") }));
  ok("flicking the last card = the end page, the readings popped, the counter + mailbox gone", end1.cur === 6 && end1.ended && end1.ti === "1" && end1.ctl === "0" && !end1.box, end1);
  await p.mouse.move(120, 360); await p.mouse.down();
  for (let i = 1; i <= 8; i++) { await p.mouse.move(120 + 22 * i, 362); await p.waitForTimeout(14); }
  await p.mouse.up(); await p.waitForTimeout(900);
  const st1 = await p.evaluate(() => ({ cur: window.gas2Postcards.cur, ended: document.getElementById("desk").classList.contains("ended") }));
  ok("on the station, left to right brings the last card back", st1.cur === 5 && !st1.ended, st1);
  const grab7 = await p.evaluate(() => { const b = document.querySelector(".pc.top .mtitle").getBoundingClientRect(); return { x: b.left + 10, y: b.top + 10 }; });
  await p.mouse.move(grab7.x, grab7.y); await p.mouse.down();
  for (let i = 1; i <= 8; i++) { await p.mouse.move(grab7.x - 30 * i, grab7.y - 3 * i); await p.waitForTimeout(12); }
  await p.mouse.up(); await p.waitForTimeout(1500);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/flow-end.png` });
  await p.click("#cta"); await p.waitForTimeout(900);
  ok("⤓ Download FREE brings the mail card back", (await cur(p)) === 5 && !(await p.evaluate(() => document.getElementById("desk").classList.contains("ended"))));

  // ── MAIL ME THE KEYS: empty + bad address stop it, a good one drops the card in the box (nothing sent) ──
  // the keyboard (Dan's iPhone, iOS 26: it cut the page to ~387 px and the card shrank to half): the card keeps its size
  // and slides up, the TO line, the tick box and the stamp in sight above the keys; ‹ › aside till it goes
  await p.click("#em"); await p.setViewportSize({ width: 402, height: 387 }); await p.waitForTimeout(700);
  const kb = await p.evaluate(() => { const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; };
    return { w: Math.round(document.querySelector(".pc-mail").getBoundingClientRect().width), to: r(".addr"), opt: r(".opt"), ink: r(".send .ink"), ctl: getComputedStyle(document.querySelector(".ctl")).opacity }; });
  await p.evaluate(() => document.activeElement.blur()); await p.setViewportSize({ width: 402, height: 714 }); await p.waitForTimeout(700);
  const kb2 = await p.evaluate(() => ({ slide: document.getElementById("stack").style.translate, w: Math.round(document.querySelector(".pc-mail").getBoundingClientRect().width), ctl: getComputedStyle(document.querySelector(".ctl")).opacity }));
  ok("typing the address: the card keeps its size and slides up, TO line + tick box + stamp in sight and clear of each other; the keyboard down, it's back",
     kb.w >= 350 && kb.to[0] >= 0 && kb.opt[0] >= kb.to[1] - 1 && kb.ink[0] >= kb.opt[1] - 1 && kb.ink[1] <= 387 && kb.ctl === "0" && kb2.slide === "" && kb2.w === kb.w && kb2.ctl === "1", { kb, kb2 });
  let netMail = 0; p.on("request", (r) => { if (!/\.(webp|png|woff2|m4a|html)(\?|$)/.test(r.url())) netMail++; });
  await p.click(".send"); await p.waitForTimeout(200);
  ok("empty address: the error shows", await p.evaluate(() => !document.getElementById("err").hidden));
  await p.fill("#em", "dan@"); await p.click(".send"); await p.waitForTimeout(200);
  ok("bad address: the error shows", await p.evaluate(() => !document.getElementById("err").hidden));
  const mk0 = await p.evaluate(() => document.getElementById("mk").checked);
  await p.click(".opt"); await p.waitForTimeout(100);
  ok("the consent box starts unticked and ticks", !mk0 && await p.evaluate(() => document.getElementById("mk").checked));
  await p.fill("#em", "dan@example.com"); await p.click(".send"); await p.waitForTimeout(200);
  ok("the stamp comes down (thump) and can't be stamped twice", await p.evaluate(() => { const s = document.querySelector(".send"); return s.classList.contains("thump") && s.disabled; }));
  await p.waitForTimeout(2200);
  const sent = await p.evaluate(() => ({ ended: document.getElementById("desk").classList.contains("ended"), sent: document.getElementById("desk").classList.contains("sent"),
    note: document.getElementById("sentNote").textContent, cta: document.querySelector(".rd .cta").innerText.trim(), cardOpacity: getComputedStyle(document.querySelectorAll(".pc")[5]).opacity }));
  ok("good address: the card goes in the box, then the end page says the keys are in the mail", sent.ended && sent.sent && sent.note.includes("dan@example.com") && sent.cta === "✓ Keys in the mail" && sent.cardOpacity === "0", sent);
  await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(300);
  ok("after mailing, back doesn't pull the mailed card out of the box", (await cur(p)) === 6);
  ok("nothing is sent (no request besides assets)", netMail === 0, netMail);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/flow-sent.png` });
  await p.click("#again"); await p.waitForTimeout(1200);
  const re = await p.evaluate(() => ({ cur: window.gas2Postcards.cur, ended: document.getElementById("desk").classList.contains("ended"), sent: document.getElementById("desk").classList.contains("sent"),
    o6: getComputedStyle(document.querySelectorAll(".pc")[5]).opacity, top: document.querySelector(".pc.top").getBoundingClientRect().left,
    mk: document.getElementById("mk").checked, stamp: document.querySelector(".send").disabled }));
  ok("The postcards again: dealt back, card 1 on top, the form fresh", re.cur === 0 && !re.ended && !re.sent && re.o6 === "1" && re.top > 0 && !re.mk && !re.stamp, re);
  await p.context().close();

  // ── mailed: the card is in the box, so left to right on the station deals the postcards again ──
  const ms = await page(wk, 402, 714);
  await go(ms, "?card=7&sent"); await ms.waitForTimeout(1500);
  await ms.mouse.move(120, 360); await ms.mouse.down();
  for (let i = 1; i <= 8; i++) { await ms.mouse.move(120 + 22 * i, 362); await ms.waitForTimeout(14); }
  await ms.mouse.up(); await ms.waitForTimeout(1200);
  const ms1 = await ms.evaluate(() => ({ cur: window.gas2Postcards.cur, sent: document.getElementById("desk").classList.contains("sent") }));
  ok("mailed, left to right on the station deals the postcards again", ms1.cur === 0 && !ms1.sent, ms1);
  await ms.context().close();

  // ── reduced motion: no flight, the same states ──
  const r = await page(wk, 402, 714, { reducedMotion: "reduce" });
  await go(r, "");
  await r.click("#next"); await r.waitForTimeout(100);
  const rm = { afterNext: await cur(r) };
  await r.goto(BASE + "?card=5"); await r.waitForTimeout(500);
  await r.click("#hear .front [data-turn]"); await r.waitForTimeout(900);
  rm.flipped = await r.evaluate(() => document.getElementById("hear").classList.contains("flipped"));
  rm.nudge = await r.evaluate(() => document.querySelectorAll(".pc.nudge").length);
  await r.waitForTimeout(600);
  rm.speed = await r.evaluate(() => gas2Postcards.deck.speed);
  rm.strobe = await r.evaluate(() => document.getElementById("strobeDots").style.transform === document.getElementById("dots").style.transform);
  out.reduced = rm;
  ok("reduced motion (Dan's iPhone): the hand's moves still happen (next, the turn), nothing moves by itself (no nudge, the idle record and its strobe dots still)",
     rm.afterNext === 1 && rm.flipped && rm.nudge === 0 && rm.speed === 0 && rm.strobe, rm);
  await r.context().close();
  await wk.close();

  // ── the demo (Chrome, it decodes AAC): plays, switches sides in place, stops ──
  const ch = await chromium.launch({ channel: "chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
  const a = await page(ch, 402, 714);
  await go(a, "?card=5&flip");
  await a.click("#play");
  await a.waitForTimeout(520);
  const c1 = await a.evaluate(() => ({ lift: gas2Postcards.deck.lift, angle: gas2Postcards.deck.angle, lead: gas2Postcards.deck.LEAD, on: gas2Postcards.audio.on, mode: gas2Postcards.deck.mode }));
  ok("the cue (round 3): the arm lifts and swings in before the needle drops, the song not yet on", c1.mode === "cue" && c1.lift > .9 && c1.angle > 0 && c1.angle < c1.lead && !c1.on, c1);
  await a.waitForFunction(() => window.gas2Postcards.audio.on, null, { timeout: 8000 }).catch(() => {});
  const s1 = await a.evaluate(() => ({ on: gas2Postcards.audio.on, side: gas2Postcards.audio.side, label: document.getElementById("play").getAttribute("aria-label") }));
  await a.waitForTimeout(1500);
  const d1 = await a.evaluate(() => ({ angle: gas2Postcards.deck.angle, lead: gas2Postcards.deck.LEAD, run: gas2Postcards.deck.RUN, speed: gas2Postcards.deck.speed, pos: gas2Postcards.audio.pos }));
  await a.click('#player .ab [data-side="a"]'); await a.waitForTimeout(200);
  const s2 = await a.evaluate(() => { const o = (s) => /key-down/.test(getComputedStyle(document.querySelector(s)).backgroundImage) ? "in" : "out";
    return { side: gas2Postcards.audio.side, on: gas2Postcards.audio.on, pressed: document.querySelector('#player .keys [data-side="a"]').getAttribute("aria-pressed"),
      a: o('#player .keys [data-side="a"]'), b: o('#player .keys [data-side="b"]'), lamp: document.querySelector("#player .pilot.a").classList.contains("on") }; });
  await a.click("#play", { force: true }); await a.waitForTimeout(2500);   // force: a spinning record never holds still for Playwright
  const s3 = await a.evaluate(() => ({ on: gas2Postcards.audio.on, angle: gas2Postcards.deck.angle, speed: gas2Postcards.deck.speed, mode: gas2Postcards.deck.mode }));
  out.audio = { s1, d1, s2, s3 };
  ok("tap the record: the demo plays on GAS 2, it spins at 33 1/3, the arm is in the grooves and moving in", s1.on && s1.side === "b" && s1.label === "Stop the demo" &&
     d1.speed > 150 && d1.pos > 0 && d1.angle > d1.lead && d1.angle < d1.run, out.audio);
  ok("ORIGINAL switches the side while it plays: its key latches in, GAS 2's comes up, its lamp lights", s2.side === "a" && s2.on && s2.pressed === "true" && s2.a === "in" && s2.b === "out" && s2.lamp, s2);
  ok("tap the record again: it stops, the arm lifts and goes back to its rest, the platter keeps turning", !s3.on && s3.angle < .5 && s3.mode === "rest" && s3.speed > 150, s3);
  await a.click("#hear .back [data-turn]"); await a.waitForTimeout(1800);
  const s4 = await a.evaluate(() => ({ flipped: document.getElementById("hear").classList.contains("flipped"), speed: gas2Postcards.deck.speed, on: gas2Postcards.audio.on }));
  ok("turned back over: the motor stops", !s4.flipped && s4.speed === 0 && !s4.on, s4);
  await a.context().close();
  await ch.close();

  const failed = out.steps.filter((s) => !s.pass).length + out.layout.filter((l) => !l.pass).length;
  console.log(JSON.stringify(out, null, 1));
  console.log(failed ? `FAILED: ${failed}` : `ALL PASS (${out.steps.length} steps, ${out.layout.length} layouts), errors: ${out.errors.length}`);
  process.exit(failed || out.errors.length ? 1 : 0);
})();
