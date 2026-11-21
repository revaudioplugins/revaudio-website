// The phone deck's seats (D7 B), cut from the plugin's own 2x face photo (face-base.webp, 3072x2048 = 1536x1024 units x2):
// the WIDTH seat with its printed MONO / 100 / 200 scale, and the LOW FOCUS / MIX / REACH seats, each at 2x the CSS px the
// deck draws it at (WIDTH knob 150 px for its 264-unit knob, the others 88 px for 166 / 130 units). One sprite, one request.
// Run from the repo root: node tools/widebeam-clips/cut-seats.cjs   (writes src/assets/widebeam/deck-seats.webp)
const sharp = require('sharp');
const REPO = require('path').resolve(__dirname, '..', '..');
const F = REPO + '/src/assets/widebeam/face-base.webp';
// [name, x0, y0, x1, y1] in plugin units; the knob's own box inside it is the knob's art box on the face (face.ts KNOB_ART)
const CUTS = [
  ['width', 556, 466, 960, 790, 150 / 264],   // knob [634,523,264]
  ['focus', 245, 612, 435, 790, 88 / 166],    // knob [257,622,166]
  ['mix', 425, 612, 615, 790, 88 / 166],      // knob [437,622,166]
  ['reach', 1110, 628, 1275, 785, 88 / 130],  // knob [1127,640,130]
];
(async () => {
  const parts = []; let y = 0; const meta = {};
  for (const [n, x0, y0, x1, y1, s] of CUTS) {
    const w = Math.round((x1 - x0) * s * 2), h = Math.round((y1 - y0) * s * 2);
    let img = sharp(F).extract({ left: x0 * 2, top: y0 * 2, width: (x1 - x0) * 2, height: (y1 - y0) * 2 });
    let buf = await img.png().toBuffer();
    if (n === 'width') {
      // the WIDTH crop catches a sliver of the MIX seat at its lower left: cover it with clean brushed plate from beside
      // the HIGH BEAM seat (the same patch the D7 B mock used)
      const patch = await sharp(F).extract({ left: 1860, top: 1240, width: 100, height: 300 }).toBuffer();
      buf = await sharp(buf).composite([{ input: patch, left: 0, top: 228 }, { input: patch, left: 0, top: 348 }]).png().toBuffer();
    }
    buf = await sharp(buf).resize(w, h, { kernel: 'lanczos3' }).png().toBuffer();
    parts.push({ input: buf, left: 0, top: y }); meta[n] = { y, w, h, units: [x0, y0, x1, y1] }; y += h;
  }
  const W = Math.max(...Object.values(meta).map((m) => m.w));
  await sharp({ create: { width: W, height: y, channels: 3, background: '#17150f' } }).composite(parts).webp({ quality: 80 }).toFile(REPO + '/src/assets/widebeam/deck-seats.webp');
  const st = require('fs').statSync(REPO + '/src/assets/widebeam/deck-seats.webp');
  console.log(JSON.stringify({ W, H: y, bytes: st.size, meta }));
})();
