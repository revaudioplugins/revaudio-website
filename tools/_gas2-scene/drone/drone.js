// GAS 2 page · drone intro v2 (revaudio-59, 2026-10-28; Dan: a drone hovers above the station, scrolling brings it
// down into the page's own scene, then GAS 2 pops out). Boot only: a plain script in <head>, so the readings never
// flash before the hover. The flight (three.js) loads as a module from run.js. ?drone=0 = straight onto the page, as
// do reduced motion and the benches (?bench, ?rbench).
// The bench: TUNE (?dev, then T) -> Drone: hover presets (top / 45 front / 45 right; a click flies it), hover height,
// runway length, sway; Camera (the camera bench, ?cam: drone/cam-bench.js), Fly again, Car, Skip, Copy. Settings stay
// in this browser (localStorage), over new defaults. ?angle=top|front|right picks a preset from the address bar.
(() => {
  const q = new URLSearchParams(location.search), K = 'gas2page-b:drone';
  // the hover camera: yaw = degrees round the station (0 = from the road, + = to the right), tilt = degrees down,
  // alt = height (m), ax / az = the ground point it looks at. The landing: down = share of the scroll where it reaches
  // the landing spot, gimbal = where the camera starts turning, arrive = degrees down on arrival (38+: the page frame
  // must still be above the top edge there, so its switch-on is unseen)
  const PRESETS = { top: { yaw: 0, tilt: 90, ax: -4, az: -6 }, front: { yaw: 0, tilt: 45, ax: -1.5, az: -7 }, right: { yaw: 45, tilt: 45, ax: -1.5, az: -7 } };
  const D = { angle: 'top', alt: 34, len: 4, sway: 1, ...PRESETS.top, down: .42, gimbal: .18, arrive: 40 }, T = { ...D };
  try { const s = JSON.parse(localStorage.getItem(K) || '{}'); Object.assign(T, PRESETS[s.angle] || {}, s); } catch (e) { /* defaults */ }
  if (PRESETS[q.get('angle')]) Object.assign(T, PRESETS[q.get('angle')], { angle: q.get('angle') });
  window.__droneTune = T; window.__dronePresets = PRESETS; window.__droneDefaults = D;

  document.addEventListener('DOMContentLoaded', () => {
    const tune = document.getElementById('tune'); if (!tune) return;
    const box = document.createElement('div');
    box.innerHTML = '<h4 style="margin-top:14px">Drone</h4>'
      + '<div class="row looks" data-dr="angle"><button type="button" data-v="top">Top</button><button type="button" data-v="front">45 front</button><button type="button" data-v="right">45 right</button></div>'
      + '<label>Hover m<input type="range" data-k="alt" min="8" max="80" step="1"><output></output></label>'
      + '<label>Length<input type="range" data-k="len" min="2" max="8" step=".5"><output></output></label>'
      + '<label>Sway<input type="range" data-k="sway" min="0" max="2" step=".05"><output></output></label>'
      + '<div class="row"><button type="button" data-a="cam">Camera</button><button type="button" data-a="fly">Fly again</button><button type="button" data-a="car">Car</button></div>'
      + '<div class="row"><button type="button" data-a="skip">Skip</button><button type="button" data-a="copy">Copy</button></div>';
    tune.appendChild(box);
    const save = () => { try { localStorage.setItem(K, JSON.stringify(T)); } catch (e) { /* this browser only */ } };
    const fly = (drone, cam) => {
      const nq = new URLSearchParams(location.search); nq.delete('angle');
      drone ? nq.delete('drone') : nq.set('drone', '0'); cam ? nq.set('cam', '') : nq.delete('cam');
      scrollTo(0, 0); location.href = location.pathname + (nq.toString() ? '?' + nq.toString().replace(/=(&|$)/g, '$1') : '');
    };
    box.querySelectorAll('[data-dr="angle"] button').forEach(b => {
      b.classList.toggle('on', b.dataset.v === T.angle);
      b.onclick = () => { Object.assign(T, PRESETS[b.dataset.v], { angle: b.dataset.v }); save(); fly(true, q.has('cam')); };   // a preset click flies it straight away
    });
    box.querySelectorAll('input').forEach(i => {
      i.value = T[i.dataset.k]; i.nextElementSibling.textContent = T[i.dataset.k];
      i.oninput = () => { T[i.dataset.k] = +i.value; i.nextElementSibling.textContent = i.value; save(); };
    });
    box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'car') return dispatchEvent(new CustomEvent('dr:car'));
      if (a === 'copy') { try { navigator.clipboard.writeText(JSON.stringify({ section: 'drone', ...T })); } catch (e) { /* no clipboard */ } b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1200); return; }
      fly(a !== 'skip', a === 'cam');
    });
  });

  if (q.get('drone') === '0' || q.has('bench') || q.has('rbench') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const html = document.documentElement;
  html.classList.add('dr-on', 'dr-hold');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const base = document.currentScript.src;
  import(new URL('run.js', base).href).catch(err => {
    console.error('[drone]', err); html.classList.remove('dr-on', 'dr-hold');   // no flight: the page as it was
  });
  if (q.has('cam')) import(new URL('cam-bench.js', base).href).catch(err => console.error('[drone cam]', err));
})();
