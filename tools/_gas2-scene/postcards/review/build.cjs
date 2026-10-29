/* The postcards review page (Dan 2026-10-29: "comment on every section of this page"): builds review/out/ for the
   claude.ai artifact made from review/index.html. Serve tools/_gas2-scene (the no-store server on :4466), then:
     NODE_PATH=<revaudio-website>/node_modules node build.cjs [base url]
   1. out/live.html - postcards.html as the artifact can serve it: fonts inlined (the artifact CSP only lets Google Fonts
      faces load), the demo audio renamed .mp4 (.m4a is refused at publish), and the state read from the hash too
      (live.html#card=5&flip), because the artifact's links pass no query string.
   2. out/shots/<id>.webp - each screen in WebKit at Safari's visible viewport on the iPhone 17 Pro (402 x 714).
   3. out/preview.html - index.html in a document skeleton, with links to the scene assets, to try it on localhost. */
const { webkit } = require("playwright");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const SCENE = path.resolve(__dirname, "../..");
const OUT = path.join(__dirname, "out");
const BASE = process.argv[2] || "http://127.0.0.1:4466/postcards.html";
const SHOTS = [                       // id, query, wait (ms after fonts): the end page waits for the pop to finish
  ["card-1", "?card=1", 700], ["card-2", "?card=2", 700], ["card-3", "?card=3", 700], ["card-4", "?card=4", 700],
  ["card-5", "?card=5", 700], ["card-5-back", "?card=5&flip", 700], ["card-6", "?card=6", 700],
  ["end", "?card=7", 2200], ["end-sent", "?card=7&sent", 2200],
];

// 1 · live.html
let html = fs.readFileSync(path.join(SCENE, "postcards.html"), "utf8");
html = html.replace(/url\(fonts\/([\w.-]+\.woff2)\)/g, (m, f) =>
  `url(data:font/woff2;base64,${fs.readFileSync(path.join(SCENE, "fonts", f)).toString("base64")})`);
html = html.replace(/player\/audio\/(hiphop_(?:before|after))\.m4a/g, "audio/$1.mp4");
html = html.replace("new URLSearchParams(location.search)", "new URLSearchParams(location.search || location.hash.slice(1))");
if (/url\(fonts\/|\.m4a|URLSearchParams\(location\.search\)/.test(html)) throw new Error("live.html: a rewrite missed");
fs.mkdirSync(path.join(OUT, "shots"), { recursive: true });
fs.writeFileSync(path.join(OUT, "live.html"), html);

// 3 · preview.html + the links it needs (the artifact gets the same paths through its files map)
const page = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
fs.writeFileSync(path.join(OUT, "preview.html"), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n${page}\n</body></html>\n`);
const link = (to, from) => { const p = path.join(OUT, from); fs.mkdirSync(path.dirname(p), { recursive: true }); try { fs.unlinkSync(p); } catch (e) {} fs.symlinkSync(to, p); };
link(path.join(SCENE, "postcards"), "postcards");
link(path.join(SCENE, "props"), "props");
for (const s of ["before", "after"]) link(path.join(SCENE, "player/audio", `hiphop_${s}.m4a`), `audio/hiphop_${s}.mp4`);

// 2 · the screens
(async () => {
  const wk = await webkit.launch();
  const ctx = await wk.newContext({ viewport: { width: 402, height: 714 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const shot = async (id) => {
    const png = path.join(OUT, "shots", id + ".png");
    await p.screenshot({ path: png });
    execFileSync("cwebp", ["-quiet", "-q", "80", png, "-o", png.replace(/\.png$/, ".webp")]);
    fs.unlinkSync(png);
  };
  for (const [id, q, wait] of SHOTS) {
    await p.goto(BASE + q);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(wait);
    await shot(id);
  }
  // the motion section: card 1 held mid-flick
  await p.goto(BASE + "?card=1");
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const b = document.querySelector(".pc.top").getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height * .4 }; });
  await p.mouse.move(r.x, r.y); await p.mouse.down();
  for (let i = 1; i <= 8; i++) { await p.mouse.move(r.x - 120 * i / 8, r.y - 14 * i / 8); await p.waitForTimeout(25); }
  await p.waitForTimeout(250);
  await shot("motion");
  await p.mouse.up();
  await wk.close();
  console.log(fs.readdirSync(path.join(OUT, "shots")).map((f) => `${f} ${(fs.statSync(path.join(OUT, "shots", f)).size / 1024).toFixed(0)} KB`).join("\n"));
})().catch((e) => { console.error(e); process.exit(1); });
