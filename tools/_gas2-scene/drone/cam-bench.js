// GAS 2 page · drone intro: the camera bench (?cam, or TUNE -> Drone -> Camera; Dan 2026-10-28: "a bench to control
// the scene's camera angle", "and the landing"). Live: drag the scene to turn the hover camera, sliders for the hover
// and the landing, a flight scrubber (the bench never hands over: scroll back up and down freely) and a readout. The
// landing's last frame is the page itself and stays fixed; the bench sets how the drone gets there. Values save in this
// browser like TUNE -> Drone; Copy hands them over to bake in as the defaults (drone.js).
const T = window.__droneTune, PRESETS = window.__dronePresets, D = window.__droneDefaults, K = 'gas2page-b:drone';
const save = () => { try { localStorage.setItem(K, JSON.stringify(T)); } catch (e) { /* this browser only */ } };
const wrap = a => ((a + 180) % 360 + 360) % 360 - 180;
const CAMERA = ['yaw', 'tilt', 'alt', 'ax', 'az', 'down', 'gimbal', 'arrive'];
// [key, label, min, max, step, shown as % of the scroll]
const HOVER = [['yaw', 'Around °', -180, 180, 1], ['tilt', 'Down °', 15, 90, 1], ['alt', 'Height m', 8, 80, 1], ['ax', 'Aim x m', -15, 10, .5], ['az', 'Aim z m', -20, 10, .5]];
const LANDING = [['down', 'Lands at', 25, 70, 1, true], ['gimbal', 'Turn from', 0, 60, 1, true], ['arrive', 'Arrive °', 38, 90, 1]];

const box = document.createElement('div');
box.className = 'tune open drcam'; box.dataset.benchIgnore = '';                  // page-b's TUNE look, on the left
const css = document.createElement('style');
css.textContent = '.tune.drcam { left: 12px; right: auto; top: 12px; bottom: auto; width: 300px; max-height: calc(100vh - 24px); overflow: auto; }'
  + ' .tune.drcam label { grid-template-columns: 72px 1fr 52px; }';
document.head.appendChild(css);
const rows = list => list.map(([k, l, a, b, st, pct]) => `<label>${l}<input type="range" data-k="${k}" min="${a}" max="${b}" step="${st}"${pct ? ' data-pct' : ''}><output></output></label>`).join('');
box.innerHTML = '<h4>Camera</h4>'
  + '<div class="row looks" data-dr="angle"><button type="button" data-v="top">Top</button><button type="button" data-v="front">45 front</button><button type="button" data-v="right">45 right</button></div>'
  + '<p style="margin:8px 0 0;opacity:.7">Drag the scene to turn the camera.</p>'
  + '<h4 style="margin-top:12px">Hover</h4>' + rows(HOVER)
  + '<h4 style="margin-top:12px">Landing</h4>' + rows(LANDING)
  + '<h4 style="margin-top:12px">Flight</h4><label>Scroll<input type="range" data-scrub min="0" max="100" step=".5" value="0"><output></output></label>'
  + '<p data-read style="margin:6px 0 0;font-variant-numeric:tabular-nums;color:#e8c878"></p>'
  + '<div class="row"><button type="button" data-a="fly">Fly</button><button type="button" data-a="car">Car</button><button type="button" data-a="copy">Copy</button><button type="button" data-a="reset">Reset</button></div>';
if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
document.body.appendChild(box);

const inputs = [...box.querySelectorAll('input[data-k]')];
const show = i => { const v = T[i.dataset.k]; i.nextElementSibling.textContent = i.hasAttribute('data-pct') ? Math.round(v * 100) + ' %' : v; };
const sync = () => {
  inputs.forEach(i => { const v = T[i.dataset.k]; i.value = i.hasAttribute('data-pct') ? v * 100 : v; show(i); });
  box.querySelectorAll('[data-dr="angle"] button').forEach(b => b.classList.toggle('on', b.dataset.v === T.angle));
};
const edit = (k, v) => {                                     // any hand edit = a custom camera; turn-from stays before lands-at
  T[k] = v; T.angle = 'custom';
  if (T.gimbal > T.down - .02) T.gimbal = Math.max(0, T.down - .02);
  sync(); save();
};
inputs.forEach(i => i.oninput = () => edit(i.dataset.k, i.hasAttribute('data-pct') ? +i.value / 100 : +i.value));
box.querySelectorAll('[data-dr="angle"] button').forEach(b => b.onclick = () => { Object.assign(T, PRESETS[b.dataset.v], { angle: b.dataset.v }); sync(); save(); });
sync();

// drag the scene: left / right = round the station, up / down = more or less straight down
let drag = null;
addEventListener('pointerdown', e => { if (!e.target.closest || !e.target.closest('.dr')) return; drag = { x: e.clientX, y: e.clientY }; e.preventDefault(); });
addEventListener('pointermove', e => {
  if (!drag) return;
  T.yaw = Math.round(wrap(T.yaw - (e.clientX - drag.x) * .3)); T.tilt = Math.min(90, Math.max(15, Math.round(T.tilt + (e.clientY - drag.y) * .25)));
  drag = { x: e.clientX, y: e.clientY }; T.angle = 'custom'; sync();
});
addEventListener('pointerup', () => { if (drag) { drag = null; save(); } });

// the flight scrubber + readout
const scrub = box.querySelector('[data-scrub]'), read = box.querySelector('[data-read]');
let scrubbing = false;
scrub.onpointerdown = () => scrubbing = true; addEventListener('pointerup', () => scrubbing = false);
scrub.oninput = () => { const r = document.querySelector('.dr-run'); if (r) scrollTo(0, Math.round((r.offsetHeight + r.offsetTop - innerHeight) * scrub.value / 100)); scrub.nextElementSibling.textContent = scrub.value + ' %'; };
(function tick() {
  const s = window.__droneState;
  if (s) {
    if (!scrubbing) { scrub.value = (s.u * 100).toFixed(1); scrub.nextElementSibling.textContent = Math.round(s.u * 100) + ' %'; }
    const phase = s.u < .002 ? 'hover' : s.u < T.down ? 'coming down' : s.u < .999 ? 'tilting up to the page' : 'landed (the page frame)';
    read.textContent = `${phase} · ${s.h.toFixed(1)} m up · ${Math.round(-s.pitch)}° down · ${Math.round(s.yaw)}° round`;
  }
  requestAnimationFrame(tick);
})();

box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
  const a = b.dataset.a;
  if (a === 'car') return dispatchEvent(new CustomEvent('dr:car'));
  if (a === 'reset') { CAMERA.forEach(k => T[k] = D[k]); T.angle = D.angle; sync(); save(); return; }
  if (a === 'copy') {
    const out = { section: 'drone-camera' }; CAMERA.forEach(k => out[k] = T[k]);
    try { navigator.clipboard.writeText(JSON.stringify(out)); } catch (e) { /* no clipboard */ }
    b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1200); return;
  }
  const nq = new URLSearchParams(location.search); ['cam', 'angle', 'drone'].forEach(k => nq.delete(k));   // Fly = the real flight, hand-off and all
  scrollTo(0, 0); location.href = location.pathname + (nq.toString() ? '?' + nq.toString().replace(/=(&|$)/g, '$1') : '');
});
