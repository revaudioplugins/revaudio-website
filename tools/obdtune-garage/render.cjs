// The OBDTUNE page garage stills: see shots.sh (how to run, the three cameras).
// node render.cjs '<json cfg>'  -> renders the room from a taken-over camera; prints where the tool's anchor landed
// cfg: { name, capture, B:[x,y,z] (body base centre on the surface), T (world height of the unit box), yaw (deg, + = camera to +z, looks toward -z),
//        camY, fov, W, H, boxL, boxT (box left/top in px), Tpx (box height px), est (true = establishing shot: cam/aim given) }
const { chromium } = require('playwright');
const cfg = JSON.parse(process.argv[2]);
(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: cfg.W, height: cfg.H }, deviceScaleFactor: 1 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://127.0.0.1:4761/tools/_home-opening/room.html?capture=${cfg.capture ?? 0}&expose${cfg.flat ? '&flat=' + cfg.flat : ''}`, { waitUntil: 'load', timeout: 90000 });
  await p.waitForFunction(() => window.__room, null, { timeout: 120000 });
  await p.waitForTimeout(cfg.settle ?? 6000);
  const info = await p.evaluate(async (cfg) => {
    const THREE = await import('three'); const { camera } = window.__room;
    camera.position.set = function () { return this; }; camera.rotation.set = function () { return this; };
    const V = (a) => new THREE.Vector3(...a);
    if (cfg.est) { camera.position.copy(V(cfg.cam)); camera.lookAt(V(cfg.aim)); camera.fov = cfg.fov; camera.aspect = cfg.W / cfg.H; camera.clearViewOffset(); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true); const q = V(cfg.B).project(camera); return { est: true, B_px: [Math.round((q.x + 1) / 2 * cfg.W), Math.round((1 - q.y) / 2 * cfg.H)] }; }
    const B = V(cfg.B), a = cfg.yaw * Math.PI / 180, bodyH = 0.844 * cfg.T; // the body spans 0.056..0.90 of the box
    const aim = B.clone().add(V([0, bodyH / 2, 0]));
    camera.fov = cfg.fov; camera.aspect = cfg.W / cfg.H; camera.clearViewOffset(); camera.updateProjectionMatrix();
    let D = 1.3; const px = (v) => { const q = v.clone().project(camera); return [(q.x + 1) / 2 * cfg.W, (1 - q.y) / 2 * cfg.H]; };
    for (let i = 0; i < 12; i++) {
      camera.position.copy(B.clone().add(V([D * Math.cos(a), cfg.camY - B.y, D * Math.sin(a)])));
      camera.lookAt(aim); camera.updateMatrixWorld(true);
      const h = px(B)[1] - px(B.clone().add(V([0, cfg.T, 0])))[1]; D *= h / cfg.Tpx;
    }
    camera.position.copy(B.clone().add(V([D * Math.cos(a), cfg.camY - B.y, D * Math.sin(a)]))); camera.lookAt(aim); camera.updateMatrixWorld(true);
    // shift the frame so the body base lands at the box's (0.63, 0.90)
    const [bx, by] = px(B), want = [cfg.boxL + 0.63 * 0.852 * cfg.Tpx, cfg.boxT + 0.90 * cfg.Tpx];
    const fw = cfg.W + 2 * Math.abs(bx - want[0]), fh = cfg.H + 2 * Math.abs(by - want[1]);
    // full frame centred on the aim: set an offset frame of the same pixel scale
    camera.setViewOffset(fw, fh, (fw - cfg.W) / 2 + (bx - want[0]), (fh - cfg.H) / 2 + (by - want[1]), cfg.W, cfg.H);
    // setViewOffset with a bigger full frame changes the scale (fov spans fh): compensate the fov so a pixel stays a pixel
    camera.fov = 2 * Math.atan(Math.tan(cfg.fov * Math.PI / 360) * fh / cfg.H) * 180 / Math.PI; camera.aspect = fw / fh; camera.updateProjectionMatrix();
    const got = px(B), top = px(B.clone().add(V([0, cfg.T, 0])));
    return { D: +D.toFixed(3), cam: camera.position.toArray().map(n => +n.toFixed(3)), B_px: got.map(Math.round), want: want.map(Math.round), boxPx: Math.round(got[1] - top[1]) };
  }, cfg);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${cfg.name}.png` });
  await p.waitForTimeout(4000);
  const again = cfg.est ? null : await p.evaluate(async (cfg) => { const THREE = await import('three'); const { camera } = window.__room; const q = new THREE.Vector3(...cfg.B).project(camera); return [Math.round((q.x + 1) / 2 * cfg.W), Math.round((1 - q.y) / 2 * cfg.H)]; }, cfg);
  await p.screenshot({ path: `${cfg.name}-t2.png` });
  info.B_px_late = again;
  console.log(JSON.stringify(info), errs.length ? 'ERR ' + errs.join(' | ') : '');
  await b.close();
})();
