// Records the real DRIFT UI (served from the Drift repo, no host) while a scripted hand steers the wheel,
// for the homepage carousel's arcade screen (src/components/drift/DriftCard.astro). Centre to centre, so it loops.
// Frames via CDP screencast -> outDir/f_00000.jpg + durations.txt (ffmpeg concat list).
//   1. python3 -m http.server 8793 --bind 127.0.0.1   (in Drift/Source/ui/public)
//   2. node tools/record-drift-arcade-run.mjs <outDir>
//   3. cd <outDir> && ffmpeg -f concat -safe 0 -i durations.txt -vf "fps=30,scale=640:-2:flags=lanczos,format=yuv420p" \
//        -c:v libx264 -preset slow -crf 25 -movflags +faststart -an public/drift/arcade-run.mp4
//      ffmpeg -i public/drift/arcade-run.mp4 -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 -an public/drift/arcade-run.webm
//      ffmpeg -i <outDir>/f_00000.jpg src/assets/showcase/drift-window-init.png   (the still = frame 0)
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const outDir = process.argv[2];
mkdirSync(outDir, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1725, height: 912 }, deviceScaleFactor: 1 });
await p.goto('http://127.0.0.1:8793/index.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);

const CX = 861, CY = 503, R = 338;               // hub centre + a radius on the rim (plugin px)
const at = (deg) => [CX + R * Math.sin((deg * Math.PI) / 180), CY - R * Math.cos((deg * Math.PI) / 180)];
const wheelDeg = () => p.evaluate(() => {
  const t = document.querySelector('[data-wheel] .ind').style.transform || 'rotate(0deg)';
  return parseFloat(t.replace(/[^-0-9.]/g, '')) || 0;
});
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
// grab the rim at the top, swing the hand by `by` degrees over `ms`, release (slow end = little coast)
async function swing(by, ms, hold = 120) {
  const steps = Math.max(8, Math.round(ms / 16));
  let [x, y] = at(0);
  await p.mouse.move(x, y);
  await p.mouse.down();
  for (let i = 1; i <= steps; i++) {
    [x, y] = at(by * ease(i / steps));
    await p.mouse.move(x, y);
    await p.waitForTimeout(ms / steps);
  }
  await p.waitForTimeout(hold);
  await p.mouse.up();
}
// a flick: fast at the end, so the wheel coasts on under the plugin's own friction
async function flick(by, ms) {
  const steps = Math.max(6, Math.round(ms / 16));
  let [x, y] = at(0);
  await p.mouse.move(x, y);
  await p.mouse.down();
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    [x, y] = at(by * t * t);
    await p.mouse.move(x, y);
    await p.waitForTimeout(ms / steps);
  }
  await p.mouse.up();
}

// pre-roll: touch the wheel once so the readout shows its value (C), as it does at the loop's end
await swing(6, 200, 60);
await swing(-(await wheelDeg()), 200, 300);
await p.waitForTimeout(600);

const cdp = await p.context().newCDPSession(p);
const frames = [];
cdp.on('Page.screencastFrame', async (f) => {
  frames.push({ data: f.data, t: f.metadata.timestamp });
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1725, maxHeight: 912, everyNthFrame: 1 });

await p.waitForTimeout(500);
await swing(80, 1100);                 // ease right, hold
await p.waitForTimeout(500);
await flick(-150, 420);                // flick left: it coasts and settles
await p.waitForTimeout(1300);
await swing(110, 1200);                // back over to the right
await p.waitForTimeout(450);
const back = -(await wheelDeg());      // home to dead centre so the loop closes
await swing(back, 1300, 250);
await p.waitForTimeout(700);

await cdp.send('Page.stopScreencast');
await p.waitForTimeout(200);
console.log('frames', frames.length, 'final deg', await wheelDeg());
const list = [];
frames.forEach((f, i) => {
  const name = `f_${String(i).padStart(5, '0')}.jpg`;
  writeFileSync(`${outDir}/${name}`, Buffer.from(f.data, 'base64'));
  const d = i < frames.length - 1 ? frames[i + 1].t - f.t : 1 / 30;
  list.push(`file '${name}'`, `duration ${Math.max(0.005, d).toFixed(4)}`);
});
list.push(`file 'f_${String(frames.length - 1).padStart(5, '0')}.jpg'`);
writeFileSync(`${outDir}/durations.txt`, list.join('\n'));
console.log('span', (frames.at(-1).t - frames[0].t).toFixed(2), 's');
await b.close();
