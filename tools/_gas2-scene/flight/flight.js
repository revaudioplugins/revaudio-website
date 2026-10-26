// GAS 2 page · the drone intro (Dan 2026-10-26: "the hovering drone ... above the gas station, and when the user scrolls
// down it goes to the main page we have right now; then the readings on the right pop out; after it the user lands on
// the page"). Boot only: runs in <head> before the page paints, so the readings never flash before the flight. The
// flight itself (three.js) loads as a module from flight-run.js. ?flight=0 = straight onto the page, as does reduced
// motion; the benches (?bench, ?rbench) skip it too.
(() => {
  const q = new URLSearchParams(location.search), K = 'gas2page-b:flight', KA = 'gas2page-b:air', AIRS = ['blue', 'last', 'lamp'];
  // the hover photo's light (Dan picks, 2026-10-26): ?air= wins (screenshots), then the last TUNE pick, then blue
  let air = q.get('air'); if (!AIRS.includes(air)) { try { air = localStorage.getItem(KA); } catch {} }
  document.documentElement.dataset.air = AIRS.includes(air) ? air : 'blue';
  // TUNE → Flight: runway length (screens of scroll) + sway, fly it again, skip it (?flight=0 is the switch), COPY the numbers
  document.addEventListener('DOMContentLoaded', () => {
    const tune = document.getElementById('tune'); if (!tune) return;
    const D = { len: 4, sway: 1 }, v = { ...D };
    try { Object.assign(v, JSON.parse(localStorage.getItem(K) || '{}')); } catch {}
    const box = document.createElement('div');
    box.innerHTML = '<h4 style="margin-top:14px">Flight</h4>'
      + '<label>Length<input type="range" data-k="len" min="2" max="8" step=".5"><output></output></label>'
      + '<label>Sway<input type="range" data-k="sway" min="0" max="2" step=".05"><output></output></label>'
      + '<div class="row"><button type="button" data-fl="1">Replay</button><button type="button" data-fl="0">Skip</button><button type="button" data-fl="c">Copy</button></div>'
      + '<div class="row looks" id="fl-air"><button type="button" data-air="blue">Blue</button><button type="button" data-air="last">Last light</button><button type="button" data-air="lamp">Lamp</button></div>';
    tune.appendChild(box);
    const save = () => { try { localStorage.setItem(K, JSON.stringify(v)); } catch {} dispatchEvent(new CustomEvent('fl:tune', { detail: { ...v } })); };
    box.querySelectorAll('input').forEach(i => {
      i.value = v[i.dataset.k]; i.nextElementSibling.textContent = v[i.dataset.k];
      i.oninput = () => { v[i.dataset.k] = +i.value; i.nextElementSibling.textContent = i.value; save(); };   // length counts from the next Replay
    });
    box.querySelectorAll('#fl-air button').forEach(b => {     // the hover's light: a pick reloads the flight with it
      b.style.borderColor = b.dataset.air === document.documentElement.dataset.air ? '#e8c878' : '';
      b.onclick = () => { try { localStorage.setItem(KA, b.dataset.air); } catch {} const n = new URLSearchParams(location.search); n.delete('air'); n.delete('flight');
        scrollTo(0, 0); location.href = location.pathname + (n.toString() ? '?' + n : ''); };
    });
    box.querySelectorAll('.row:not(.looks) button').forEach(b => b.onclick = () => {
      if (b.dataset.fl === 'c') { try { navigator.clipboard.writeText(JSON.stringify({ section: 'flight', ...v })); } catch {} b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1200); return; }
      const n = new URLSearchParams(location.search); b.dataset.fl === '1' ? n.delete('flight') : n.set('flight', '0');
      scrollTo(0, 0); location.href = location.pathname + (n.toString() ? '?' + n : '');
    });
  });
  if (q.get('flight') === '0' || q.has('bench') || q.has('rbench') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const html = document.documentElement;
  html.classList.add('fl-on', 'fl-hold');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  import(new URL('flight-run.js', document.currentScript.src).href).catch(err => {
    console.error('[flight]', err); html.classList.remove('fl-on', 'fl-hold');   // no flight: the page as it was
  });
})();
