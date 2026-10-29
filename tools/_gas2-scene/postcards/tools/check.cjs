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
    for (const q of ["?card=1", "?card=2", "?card=5&flip", "?card=6"]) {
      await go(p, q);
      const m = await p.evaluate(() => {
        const top = document.querySelector(".pc.top").getBoundingClientRect(), ctl = document.querySelector(".ctl").getBoundingClientRect();
        const send = document.querySelector(".send").getBoundingClientRect();
        return { sw: document.documentElement.scrollWidth, iw: innerWidth, ih: innerHeight, card: [Math.round(top.left), Math.round(top.top), Math.round(top.width), Math.round(top.height)],
                 cardBottom: Math.round(top.bottom), ctlTop: Math.round(ctl.top), ctlBottom: Math.round(ctl.bottom), sendH: Math.round(send.height),
                 input: parseFloat(getComputedStyle(document.getElementById("em")).fontSize) };
      });
      const pass = m.sw <= m.iw && m.card[0] >= 0 && m.card[1] >= 0 && m.cardBottom <= m.ctlTop + 2 && m.ctlBottom <= m.ih && m.input >= 16;
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
  const lit = await p.evaluate(() => getComputedStyle(document.querySelector(".pc.top .key .on")).opacity);
  ok("the grade key is lit on its card", parseFloat(lit) > .95, lit);
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
  await drag(p, -220, 0, 100);
  ok("the last card can't be thrown", (await cur(p)) === 5);

  // ── MAIL ME THE KEYS: empty + bad address stop it, a good one drops the card in the box (nothing sent) ──
  let netMail = 0; p.on("request", (r) => { if (!/\.(webp|png|woff2|m4a|html)(\?|$)/.test(r.url())) netMail++; });
  await p.click(".send"); await p.waitForTimeout(200);
  ok("empty address: the error shows", await p.evaluate(() => !document.getElementById("err").hidden));
  await p.fill("#em", "dan@"); await p.click(".send"); await p.waitForTimeout(200);
  ok("bad address: the error shows", await p.evaluate(() => !document.getElementById("err").hidden));
  await p.fill("#em", "dan@example.com"); await p.click(".send"); await p.waitForTimeout(1400);
  const sent = await p.evaluate(() => ({ done: document.getElementById("desk").classList.contains("done"), sent: !document.getElementById("sent").hidden,
    to: document.getElementById("sentTo").textContent, cardOpacity: getComputedStyle(document.querySelectorAll(".pc")[5]).opacity }));
  ok("good address: the card goes in the box, SENT shows the address", sent.done && sent.sent && sent.to === "dan@example.com" && sent.cardOpacity === "0", sent);
  ok("nothing is sent (no request besides assets)", netMail === 0, netMail);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/flow-sent.png` });
  await p.click("#again"); await p.waitForTimeout(500);
  ok("Start over restacks on card 1", (await cur(p)) === 0 && await p.evaluate(() => getComputedStyle(document.querySelectorAll(".pc")[5]).opacity === "1"));
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
  await a.waitForTimeout(600);
  const w1 = await a.evaluate(() => parseFloat(document.getElementById("prog").style.width));
  await a.click('#player .ab [data-side="a"]'); await a.waitForTimeout(200);
  const s2 = await a.evaluate(() => ({ side: gas2Postcards.audio.side, pressed: document.querySelector('#player [data-side="a"]').getAttribute("aria-pressed") }));
  await a.click("#play"); await a.waitForTimeout(250);
  const s3 = await a.evaluate(() => gas2Postcards.audio.on);
  out.audio = { s1, progressPct: w1, s2, onAfterStop: s3 };
  ok("demo plays on GAS 2, the bar moves", s1.on && s1.side === "b" && s1.label === "Stop the demo" && w1 > 0, out.audio);
  ok("ORIGINAL switches the side", s2.side === "a" && s2.pressed === "true");
  ok("▶ again stops it", s3 === false);
  await a.click('#player .back [data-turn], #hear .back [data-turn]').catch(() => {});
  await a.context().close();
  await ch.close();

  const failed = out.steps.filter((s) => !s.pass).length + out.layout.filter((l) => !l.pass).length;
  console.log(JSON.stringify(out, null, 1));
  console.log(failed ? `FAILED: ${failed}` : `ALL PASS (${out.steps.length} steps, ${out.layout.length} layouts), errors: ${out.errors.length}`);
  process.exit(failed || out.errors.length ? 1 : 0);
})();
