// GAS 2 page · drone intro: the scroll cue (Dan 2026-10-29: "an indicator at the bottom of the hover that tells the user
// to scroll down", options in a bench). Bottom centre of the hover: it comes in once the hover shows and goes with the
// first bit of scroll (run.js hands it u each frame); the altimeter stays and counts the descent down. Bench: ?cue (a
// panel on the left: pick a look, Replay); the pick stays in this browser. The looks' CSS: drone.css "the scroll cue".
const K = 'gas2page-b:cue', BENCH = new URLSearchParams(location.search).has('cue');
const touch = matchMedia('(pointer: coarse)').matches;
const LOOKS = {
  chev: ['Chevrons', '<span class="w">Scroll</span><span class="chev"><b></b><b></b><b></b></span>'],
  mouse: ['Mouse', `<span class="mouse${touch ? ' touch' : ''}"><b></b></span><span class="w">${touch ? 'Swipe up' : 'Scroll'}</span>`],
  tag: ['Ticket', '<span class="tag"><i></i>Scroll to land<span class="ar">&darr;</span></span>'],
  drop: ['Fuel drop', '<span class="drip"><b></b></span><span class="w">Scroll</span>'],
  alt: ['Altimeter', '<span class="alt"><span class="lb">Alt</span><span class="v">34</span><span class="un">m</span><span class="ar">&#9662;</span><span class="lb">Scroll to land</span></span>'],
};
let pick = 'chev';
try { pick = localStorage.getItem(K) || pick; } catch (e) { /* this browser only */ }

export function mountCue(layer) {
  const el = document.createElement('div'); let v = null, last = -1;
  const put = id => {
    pick = id; el.className = 'cue cue-' + id; el.innerHTML = LOOKS[id] ? '<div class="in">' + LOOKS[id][1] + '</div>' : '';
    v = el.querySelector('.v'); last = -1;
    try { localStorage.setItem(K, id); } catch (e) { /* this browser only */ }
  };
  put(LOOKS[pick] || pick === 'none' ? pick : 'chev');
  layer.appendChild(el);
  if (BENCH) bench(layer, put);
  return (u, h) => {
    layer.style.setProperty('--u', u.toFixed(4));
    if (v) { const m = Math.max(1, Math.round(h)); if (m !== last) v.textContent = last = m; }   // the altimeter: metres up
  };
}

function bench(layer, put) {
  layer.classList.add('cue-bench');                                                  // no entry wait while picking
  const box = document.createElement('div'); box.className = 'tune open cuebench'; box.dataset.benchIgnore = '';
  const ids = [...Object.keys(LOOKS), 'none'];
  box.innerHTML = '<h4>Scroll cue</h4><div class="looks">'
    + ids.map(id => `<button type="button" data-v="${id}">${LOOKS[id] ? LOOKS[id][0] : 'None'}</button>`).join('')
    + '</div><div class="row"><button type="button" data-a="replay">Replay</button></div>';
  const mark = () => box.querySelectorAll('[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === pick));
  box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { put(b.dataset.v); mark(); });
  box.querySelector('[data-a="replay"]').onclick = () => { scrollTo(0, 0); location.reload(); };
  mark(); document.body.appendChild(box);
}
