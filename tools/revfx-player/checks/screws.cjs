// node screws.cjs — every plate's 4 screw corners vs every visible thing inside it, at 10 widths, both states.
// A plate = .rfx-plate or .rfx-hear-bay. Its screw corner = a square of side --sc-box (px, read from CSS) in each corner.
const { chromium } = require(require('os').homedir() + '/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch();
  let bad = 0;
  for (const w of [1440, 1280, 1141, 1024, 1000, 768, 600, 430, 390, 360]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage();
    await p.goto('http://localhost:4399/revfx/', { waitUntil: 'networkidle' });
    for (const state of ['before', 'after']) {
      if (state === 'after') { await p.click('[data-hear-stomp]'); await p.waitForTimeout(900); }
      const hits = await p.evaluate(() => {
        const out = [];
        for (const pl of document.querySelectorAll('#rfx-hear .rfx-plate, #rfx-hear .rfx-hear-bay')) {
          const cs = getComputedStyle(pl), box = parseFloat(cs.borderTopWidth) || 0;
          if (!box) { out.push(`${pl.className}: no --sc-box`); continue; }
          const R = pl.getBoundingClientRect();
          const corners = [[R.left, R.top], [R.right - box, R.top], [R.left, R.bottom - box], [R.right - box, R.bottom - box]];
          const kids = [...pl.querySelectorAll('*')].filter((k) => {
            if (k.closest('.rfx-plate, .rfx-hear-bay') !== pl && !k.closest('.rfx-plate, .rfx-hear-bay').contains(pl)) {
              // a nested plate (the switch plate inside STOMP) counts as one solid thing of the outer plate
              if (k !== k.closest('.rfx-plate')) return false;
            }
            const s = getComputedStyle(k); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false;
            if (k.classList.contains('rfx-jack-plug')) return false;   // the plug cable leaves the plate on purpose
            const r = k.getBoundingClientRect(); return r.width > 1 && r.height > 1 && (k.children.length === 0 || k.matches('button, canvas, img, .rfx-plate, .rfx-hear-board'));
          });
          for (const k of kids) {
            const r = k.getBoundingClientRect();
            for (const [x, y] of corners) if (r.left < x + box - .5 && r.right > x + .5 && r.top < y + box - .5 && r.bottom > y + .5)
              out.push(`${pl.className.split(' ').pop()} corner(${Math.round(x - R.left)},${Math.round(y - R.top)}) vs ${k.tagName.toLowerCase()}.${String(k.className).split(' ')[0]} "${(k.textContent || '').trim().slice(0, 14)}"`);
          }
        }
        return [...new Set(out)];
      });
      if (hits.length) { bad += hits.length; console.log(w, state, hits.join('\n   ')); }
    }
  }
  console.log(bad ? `FAIL ${bad} overlaps` : 'PASS no screw overlaps');
  await b.close();
})();
