// GAS 2 page · drone intro v2 (revaudio-59, 2026-10-28; Dan: a drone hovers above the station, scrolling brings it
// down into the page's own scene, then GAS 2 pops out). Boot only: a plain script in <head>, so the readings never
// flash before the hover. The flight (three.js) loads as a module from run.js. ?drone=0 = straight onto the page, as
// do reduced motion and the benches (?bench, ?rbench).
// The bench: TUNE (?dev, then T) -> Drone: hover angle (top / 45 front / 45 right; a click flies it), hover height,
// runway length, sway; Fly again, Car, Skip, Copy. Settings stay in this browser (localStorage), over new defaults.
// ?angle=top|front|right picks the angle from the address bar.
(() => {
  const q = new URLSearchParams(location.search), K = 'gas2page-b:drone';
  const D = { angle: 'top', alt: 34, len: 4, sway: 1 }, T = { ...D };
  try { Object.assign(T, JSON.parse(localStorage.getItem(K) || '{}')); } catch (e) { /* defaults */ }
  if (['top', 'front', 'right'].includes(q.get('angle'))) T.angle = q.get('angle');
  window.__droneTune = T;

  document.addEventListener('DOMContentLoaded', () => {
    const tune = document.getElementById('tune'); if (!tune) return;
    const box = document.createElement('div');
    box.innerHTML = '<h4 style="margin-top:14px">Drone</h4>'
      + '<div class="row looks" data-dr="angle"><button type="button" data-v="top">Top</button><button type="button" data-v="front">45 front</button><button type="button" data-v="right">45 right</button></div>'
      + '<label>Hover m<input type="range" data-k="alt" min="15" max="60" step="1"><output></output></label>'
      + '<label>Length<input type="range" data-k="len" min="2" max="8" step=".5"><output></output></label>'
      + '<label>Sway<input type="range" data-k="sway" min="0" max="2" step=".05"><output></output></label>'
      + '<div class="row"><button type="button" data-a="fly">Fly again</button><button type="button" data-a="car">Car</button><button type="button" data-a="skip">Skip</button><button type="button" data-a="copy">Copy</button></div>';
    tune.appendChild(box);
    const save = () => { try { localStorage.setItem(K, JSON.stringify(T)); } catch (e) { /* this browser only */ } };
    const fly = drone => { const nq = new URLSearchParams(location.search); nq.delete('angle'); drone ? nq.delete('drone') : nq.set('drone', '0'); scrollTo(0, 0); location.href = location.pathname + (nq.toString() ? '?' + nq : ''); };
    box.querySelectorAll('[data-dr="angle"] button').forEach(b => {
      b.classList.toggle('on', b.dataset.v === T.angle);
      b.onclick = () => { T.angle = b.dataset.v; save(); fly(true); };                  // an angle click flies it straight away
    });
    box.querySelectorAll('input').forEach(i => {
      i.value = T[i.dataset.k]; i.nextElementSibling.textContent = T[i.dataset.k];
      i.oninput = () => { T[i.dataset.k] = +i.value; i.nextElementSibling.textContent = i.value; save(); };
    });
    box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'car') return dispatchEvent(new CustomEvent('dr:car'));
      if (a === 'copy') { try { navigator.clipboard.writeText(JSON.stringify({ section: 'drone', ...T })); } catch (e) { /* no clipboard */ } b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1200); return; }
      fly(a === 'fly');
    });
  });

  if (q.get('drone') === '0' || q.has('bench') || q.has('rbench') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const html = document.documentElement;
  html.classList.add('dr-on', 'dr-hold');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  import(new URL('run.js', document.currentScript.src).href).catch(err => {
    console.error('[drone]', err); html.classList.remove('dr-on', 'dr-hold');   // no flight: the page as it was
  });
})();
