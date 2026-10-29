/* GAS 2 postcards - the checks. Serve tools/_gas2-scene (any static server), then:
     NODE_PATH=<revaudio-website>/node_modules node check.cjs [base url] [shots dir]
   WebKit (the engine of the phones we target): layout at five phone viewports + every interaction by script.
   Chrome (channel "chrome"): the demo audio, because Playwright's WebKit build has no AAC decoder.
   Not covered here: a real finger (momentum, iOS edge swipes), the iOS keyboard, sound by ear - that is the
   Simulator / a real iPhone. */
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

async function drag(p, dx, dy, ms, hold) {               // a finger-like drag with the mouse (pointer events)
  const r = await p.evaluate(() => { const b = document.querySelector(".pc.top").getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height * .4 }; });
  await p.mouse.move(r.x, r.y); await p.mouse.down();
  const n = 8; for (let i = 1; i <= n; i++) { await p.mouse.move(r.x + dx * i / n, r.y + dy * i / n); await p.waitForTimeout(ms / n); }
  if (hold) await p.waitForTimeout(hold);
  await p.mouse.up(); await p.waitForTimeout(650);
}

(async () => {
  const wk = await webkit.launch();

  // ── layout: every card fits, nothing overflows, the controls are on screen ──
  for (const [w, h] of SIZES) {
    const p = await page(wk, w, h);
    for (const q of ["?card=1", "?card=2", "?card=5&flip", "?card=6", "?card=7", "?card=7&sent"]) {
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
        return { sw: document.documentElement.scrollWidth, iw: innerWidth, ih: innerHeight, card: [Math.round(top.left), Math.round(top.top), Math.round(top.width), Math.round(top.height)],
                 cardBottom: Math.round(top.bottom), ctlTop: Math.round(ctl.top), ctlBottom: Math.round(ctl.bottom), sendH: Math.round(send.height),
                 input: parseFloat(getComputedStyle(document.getElementById("em")).fontSize),
                 // the mail card, top to bottom: the TO line, the consent box, the stamp; the HEAR IT back: the deck, the fine print, Turn back
                 mail: [y(".addr"), y(".opt"), y(".send .ink")], hear: [y("#hear .deck"), y("#hear .keys"), y("#hear .back .fine"), y("#hear .back .turn")] };
      });
      const inOrder = (rows) => rows.every((r, i) => i === 0 || r[0] >= rows[i - 1][1] - 1);
      const pass = m.sw <= m.iw && m.card[0] >= 0 && m.card[1] >= 0 && m.cardBottom <= m.ctlTop + 2 && m.ctlBottom <= m.ih && m.input >= 16 &&
        (q !== "?card=6" || (inOrder(m.mail) && m.mail[2][1] <= m.cardBottom)) &&
        (q !== "?card=5&flip" || (m.hear[1][1] <= m.hear[0][1] && inOrder([m.hear[0], m.hear[2], m.hear[3]]) && m.hear[3][1] <= m.cardBottom));
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
  await drag(p, 30, 260, 110);
  ok("flick down throws too", (await cur(p)) === 2);
  await p.click("#prev"); await p.waitForTimeout(650);
  ok("back brings the last card back", (await cur(p)) === 1);
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
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/flow-end.png` });
  await p.click("#cta"); await p.waitForTimeout(900);
  ok("⤓ Download FREE brings the mail card back", (await cur(p)) === 5 && !(await p.evaluate(() => document.getElementById("desk").classList.contains("ended"))));

  // ── MAIL ME THE KEYS: empty + bad address stop it, a good one drops the card in the box (nothing sent) ──
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
  await p.waitForTimeout(1400);
  await p.waitForTimeout(800);
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

  // ── reduced motion: no flight, the same states ──
  const r = await page(wk, 402, 714, { reducedMotion: "reduce" });
  await go(r, "");
  await r.click("#next"); await r.waitForTimeout(100);
  const rm = { afterNext: await cur(r) };
  await r.goto(BASE + "?card=5"); await r.waitForTimeout(500);
  await r.click("#hear .front [data-turn]"); await r.waitForTimeout(80);
  rm.flippedAt80ms = await r.evaluate(() => document.getElementById("hear").classList.contains("flipped"));
  rm.nudge = await r.evaluate(() => document.querySelectorAll(".pc.nudge").length);
  out.reduced = rm;
  ok("reduced motion: next + flip are instant, no nudge", rm.afterNext === 1 && rm.flippedAt80ms && rm.nudge === 0, rm);
  await r.context().close();
  await wk.close();

  // ── the demo (Chrome, it decodes AAC): plays, switches sides in place, stops ──
  const ch = await chromium.launch({ channel: "chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
  const a = await page(ch, 402, 714);
  await go(a, "?card=5&flip");
  await a.click("#play");
  await a.waitForFunction(() => window.gas2Postcards.audio.on, null, { timeout: 8000 }).catch(() => {});
  const s1 = await a.evaluate(() => ({ on: gas2Postcards.audio.on, side: gas2Postcards.audio.side, label: document.getElementById("play").getAttribute("aria-label") }));
  await a.waitForTimeout(1500);
  const d1 = await a.evaluate(() => ({ angle: gas2Postcards.deck.angle, lead: gas2Postcards.deck.LEAD, run: gas2Postcards.deck.RUN, speed: gas2Postcards.deck.speed, pos: gas2Postcards.audio.pos }));
  await a.click('#player .ab [data-side="a"]'); await a.waitForTimeout(200);
  const s2 = await a.evaluate(() => ({ side: gas2Postcards.audio.side, on: gas2Postcards.audio.on, pressed: document.querySelector('#player [data-side="a"]').getAttribute("aria-pressed") }));
  await a.click("#play", { force: true }); await a.waitForTimeout(2500);   // force: a spinning record never holds still for Playwright
  const s3 = await a.evaluate(() => ({ on: gas2Postcards.audio.on, angle: gas2Postcards.deck.angle, speed: gas2Postcards.deck.speed }));
  out.audio = { s1, d1, s2, s3 };
  ok("tap the record: the demo plays on GAS 2, it spins at 33 1/3, the arm is in the grooves and moving in", s1.on && s1.side === "b" && s1.label === "Stop the demo" &&
     d1.speed > 150 && d1.pos > 0 && d1.angle > d1.lead && d1.angle < d1.run, out.audio);
  ok("ORIGINAL switches the side while it plays", s2.side === "a" && s2.on && s2.pressed === "true");
  ok("tap the record again: it stops, coasts to a halt, the arm goes back to its rest", !s3.on && s3.speed === 0 && s3.angle < .5);
  await a.click('#player .back [data-turn], #hear .back [data-turn]').catch(() => {});
  await a.context().close();
  await ch.close();

  const failed = out.steps.filter((s) => !s.pass).length + out.layout.filter((l) => !l.pass).length;
  console.log(JSON.stringify(out, null, 1));
  console.log(failed ? `FAILED: ${failed}` : `ALL PASS (${out.steps.length} steps, ${out.layout.length} layouts), errors: ${out.errors.length}`);
  process.exit(failed || out.errors.length ? 1 : 0);
})();
