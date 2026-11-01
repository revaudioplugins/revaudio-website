/* GAS 2 postcards - bake THE PUMP for card 1 from the plugin's own page (no new art, nothing written to the GAS2 repo).
   Serve the GAS2 repo's Source/ui/public first (python -m http.server 4461 --bind 127.0.0.1), then:
     NODE_PATH=<revaudio-website>/node_modules node bake-pump.cjs [out.png] [url]
   ROOM mode (the hose whole), the room photo hidden, PREMIUM lit, GAS 140 % and -11 LUFS on the counter = the demo's
   settings (player/audio/hiphop_after.m4a). 440x800 at DPR 2 = the plugin's own 2x layers, no resampling. */
const { chromium } = require("playwright");
const out = process.argv[2] || "pump-full.png";
const url = process.argv[3] || "http://127.0.0.1:4461/index.html";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 440, height: 800 }, deviceScaleFactor: 2 });
  await page.addInitScript(() => { try { localStorage.setItem("gas2.background", "room"); } catch (e) {} });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "html,body{background:transparent!important} #room,#floatX,#floatGrab{display:none!important}" });
  await page.evaluate(() => {
    document.querySelector('.key[data-i="1"]').dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    document.getElementById("needleCar").style.transform = "rotate(" + (-135 + 140 / 200 * 270) + "deg)";
    if (window.GAS2) GAS2.hose(false);
    if (window.GAS_LOOK) GAS_LOOK.meters(-11);
  });
  await page.waitForTimeout(1500);                 // drums roll to the reading, images decoded
  const st = await page.evaluate(() => window.GAS_LOOK && GAS_LOOK.state());
  await page.locator("#plugin").screenshot({ path: out, omitBackground: true });
  console.log(JSON.stringify({ out, state: st, errors: errs }));
  await browser.close();
})();
