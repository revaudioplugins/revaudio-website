// GAS 2 page · drone intro: the scroll cue (Dan 2026-10-29: "an indicator at the bottom of the hover that tells the user
// to scroll down"; he picked the chevrons from a bench of five). Bottom centre of the hover: it comes in once the hover
// shows and goes with the first bit of scroll (run.js hands it u each frame). CSS: drone.css "the scroll cue".
export function mountCue(layer) {
  const el = document.createElement('div');
  el.className = 'cue';
  el.innerHTML = '<div class="in"><span class="w">Scroll</span><span class="chev"><b></b><b></b><b></b></span></div>';
  layer.appendChild(el);
  return u => layer.style.setProperty('--u', u.toFixed(4));
}
