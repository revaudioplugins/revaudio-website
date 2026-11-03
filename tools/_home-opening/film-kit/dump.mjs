// the live things' corners in the world (16:9 capture layout): the TV face, each CRT screen, each poster picture
import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await page.goto('http://127.0.0.1:4471/tools/_home-opening/room.html?capture=0&expose', { waitUntil: 'load' }); await page.waitForTimeout(5000);
const out = await page.evaluate(() => {
  const { R } = window.__room, V = R.tv.face.position.constructor;
  const corners = (m) => { m.updateWorldMatrix(true, false); return [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]].map(([x, y]) => new V(x, y, 0).applyMatrix4(m.matrixWorld).toArray()); };
  const res = { tv: corners(R.tv.face), monitors: {}, posters: {} };
  for (const it of R.items) {
    if (it.kind === 'monitor') res.monitors[it.id] = { visible: it.obj.visible, pic: it.s.pic, c: corners(it.obj.userData.screen) };
    if (it.kind === 'poster') { let pic = null; it.obj.traverse((o) => { if (o.isMesh && o.material?.map && !pic) pic = o; }); if (pic) res.posters[it.id] = { visible: it.obj.visible, pic: it.s.pic, c: corners(pic) }; }
  }
  return res;
});
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(JSON.stringify(out).slice(0, 1500));
await b.close();
