/* GAS 2 postcards - the three grade keys (+ lit) re-rendered sharp for the grade cards, from the plugin's own 3D lab
   (GAS2 repo bench/pump-lab.html, the same rig + layers as tools/ui/bake-pump.js; the GAS2 repo is only read).
     NODE_PATH=<revaudio-website>/node_modules node bake-keys.cjs <GAS2 repo> <out dir> [scale=9]
   Writes key{0,1,2}{,-lit}.rgba + keys.json (w/h per file); make-keys.py turns them into postcards/img/*.webp.
   Real-GPU Chrome (channel "chrome"): SwiftShader gets the PMREM environment wrong (bake-pump.js says the same). */
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const [root, outDir, scaleArg] = process.argv.slice(2);
const S = +(scaleArg || 9);
const MIME = { ".html": "text/html", ".js": "application/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".json": "application/json" };

const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(path.resolve(root)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r);
}).listen(0, "127.0.0.1", async () => {
  const port = srv.address().port;
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--enable-webgl"] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await page.goto(`http://127.0.0.1:${port}/bench/pump-lab.html?bake=1&knobs=bare`);
  await page.waitForFunction(() => window.LAB && (window.LAB.ready || window.LAB.error), null, { timeout: 180000 });
  const gpu = await page.evaluate(() => { const g = document.createElement("canvas").getContext("webgl"); const e = g && g.getExtension("WEBGL_debug_renderer_info"); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : "?"; });
  console.log("GPU:", gpu);
  if (/swiftshader/i.test(gpu)) { console.log("SwiftShader: the environment light would be wrong - stopping"); process.exit(1); }
  const res = await page.evaluate((S) => {
    LAB.P.scale = S; LAB.build();
    const st = PUMP.state, gl = st.renderer.getContext(), W = PUMP.G.W * st.S, H = PUMP.G.H * st.S;
    const grab = () => {
      const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const o = new Uint8ClampedArray(W * H * 4);
      for (let y = 0; y < H; y++) o.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
      for (let i = 0; i < o.length; i += 4) { const a = o[i + 3]; if (a && a < 255) { const k = 255 / a; o[i] *= k; o[i + 1] *= k; o[i + 2] *= k; } }
      return o;
    };
    const out = {};
    for (let i = 0; i < 3; i++) for (const lit of [false, true]) {
      PUMP.render(["key" + i], lit ? "keylit" + i : "lit", { casters: ["kframe"] });
      const d = grab();
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const w = x1 - x0 + 1, h = y1 - y0 + 1, u = new Uint8Array(w * h * 4);
      for (let y = 0; y < h; y++) u.set(d.subarray(((y0 + y) * W + x0) * 4, ((y0 + y) * W + x0 + w) * 4), y * w * 4);
      let s = ""; for (let k = 0; k < u.length; k += 0x8000) s += String.fromCharCode.apply(null, u.subarray(k, k + 0x8000));
      out["key" + i + (lit ? "-lit" : "")] = { w, h, x: x0 / S, y: y0 / S, b64: btoa(s) };
    }
    return { S: st.S, W, H, out };
  }, S);
  fs.mkdirSync(outDir, { recursive: true });
  const meta = {};
  for (const [k, v] of Object.entries(res.out)) { fs.writeFileSync(path.join(outDir, k + ".rgba"), Buffer.from(v.b64, "base64")); meta[k] = { w: v.w, h: v.h, x: v.x, y: v.y }; }
  fs.writeFileSync(path.join(outDir, "keys.json"), JSON.stringify({ S: res.S, gpu, meta }, null, 1));
  console.log(JSON.stringify({ S: res.S, W: res.W, H: res.H, meta }));
  await browser.close(); srv.close();
});
