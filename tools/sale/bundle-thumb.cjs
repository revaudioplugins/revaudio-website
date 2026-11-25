// The cart's bundle thumbnail: the 8 plugins' hero images, 4 x 2, contain-fit on the cart's dark steel.
// usage (from the repo root): NODE_PATH=node_modules node tools/sale/bundle-thumb.cjs .
const sharp = require('sharp');
const path = require('path');
const repo = process.argv[2];
const files = ['revlimiter-hero.png', 'revfx-hero.png', 'radioroulette-hero.png', 'gas-hero.png', 'gas2-hero.jpg', 'drift-hero.png', 'obdtune-hero.png', 'widebeam-hero.png'];
const W = 576, H = 336, cols = 4, rows = 2, pad = 10;
const cw = W / cols, ch = H / rows;
(async () => {
  const tiles = await Promise.all(files.map(async (f, i) => {
    const buf = await sharp(path.join(repo, 'src/assets/plugins', f))
      .resize({ width: Math.round(cw - pad * 2), height: Math.round(ch - pad * 2), fit: 'inside' })
      .png().toBuffer();
    const m = await sharp(buf).metadata();
    const x = (i % cols) * cw + (cw - m.width) / 2, y = Math.floor(i / cols) * ch + (ch - m.height) / 2;
    return { input: buf, left: Math.round(x), top: Math.round(y) };
  }));
  await sharp({ create: { width: W, height: H, channels: 4, background: '#14110f' } })
    .composite(tiles).png().toFile(path.join(repo, 'src/assets/sale/bundle-thumb.png'));
  console.log('ok');
})();
