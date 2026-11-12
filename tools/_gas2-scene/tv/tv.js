/* GAS 2 page: the TV on the porch (Gil 2026-11-12). How it works: tv/README.md.
   A 1950s set on splayed legs, right of the chalkboard under the porch lamp. It plays the GAS 2 video silently on a loop;
   a click (or Enter) lifts the cabinet off its legs to the front of the page and plays the video from the top with sound,
   with play / pause, a seek bar, mute, full screen and close. Esc, the close button or a click beside the set puts it back
   on its legs, silent again. The radio stops while the TV has the sound.
   No video yet: VIDEO is empty, so the screen shows a stand-by card (colour bars) in both sizes.
   Dev: ?tv=open opens the theater on load; ?tvvideo=<url> plays a clip before it is wired in (127.0.0.1 / localhost only). */
(() => {
  const Q = new URLSearchParams(location.search), LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  const DIR = document.currentScript.src.replace(/[^/]*$/, '');
  // the clip, H.264 MP4, relative to this folder (e.g. 'video/gas2.mp4'); ?tvvideo=<url> tries one on a local server only
  const VIDEO = (LOCAL && Q.get('tvvideo')) || '';
  const POSTER = '';                                  // optional: its first frame as a .webp, shown until the clip loads
  const scene = document.getElementById('scene');
  if (!scene) return;
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const BARS = `<span class="tvBars" aria-hidden="true"><span class="top">${'<i></i>'.repeat(7)}</span><span class="mid">${'<i></i>'.repeat(7)}</span><span class="low">${'<i></i>'.repeat(5)}</span>
    <span class="tvPlate">GAS <b>2</b> TV<small>Please stand by</small></span></span>`;
  const IMG = DIR + 'img/', ART = '?v=2';            // bump ART when the art in img/ changes: the build can't version names this script writes
  const set = (legs) => `<span class="tvCab"><span class="tvScreen">${VIDEO ? '' : BARS}<img class="tvGlass" src="${IMG}tv-glass.webp${ART}" alt="" draggable="false"></span>
      <img class="tvArt" src="${IMG}tv-cab.webp${ART}" alt="" draggable="false"></span>
    ${legs ? `<img class="tvLegs" src="${IMG}tv-legs.webp${ART}" alt="" draggable="false"><i class="tvShadow"></i><i class="tvSpill"></i>` : ''}`;

  // ── the small set, in the scene ──
  const tv = document.createElement('div');
  tv.className = 'tv';
  tv.innerHTML = `<button class="tvSet" type="button" aria-label="Watch the GAS 2 video" aria-haspopup="dialog">${set(true)}</button><span class="tvCap">Watch it</span>`;
  scene.append(tv);
  const small = tv.querySelector('.tvSet'), smallScreen = small.querySelector('.tvScreen');

  let video = null;
  if (VIDEO) {
    video = document.createElement('video');
    Object.assign(video, { muted: true, loop: true, playsInline: true, preload: 'metadata', src: new URL(VIDEO, DIR).href });
    video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('aria-hidden', 'true');
    if (POSTER) video.poster = new URL(POSTER, DIR).href;
    smallScreen.prepend(video);
    // silent loop only while the set is on screen (and not for reduced motion: then it waits for a click)
    new IntersectionObserver(([e]) => {
      if (open) return;
      if (e.isIntersecting && !still()) video.play().catch(() => {}); else video.pause();
    }).observe(tv);
    video.addEventListener('playing', () => small.classList.add('on'));
    video.addEventListener('pause', () => { if (!open) small.classList.remove('on'); });
  } else small.classList.add('on');

  // ── the theater ──
  const icon = { play: '<path d="M7 5v14l12-7z"/>', pause: '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/>',
    muted: '<path d="M4 9v6h4l5 4V5L8 9zm12.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z"/>',
    full: '<path d="M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 4v-4h2v6h-6v-2z"/>',
    close: '<path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/>' };
  const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icon[k]}</svg>`;
  const th = document.createElement('div');
  th.className = 'tvTheater'; th.hidden = true;
  th.setAttribute('role', 'dialog'); th.setAttribute('aria-modal', 'true'); th.setAttribute('aria-label', 'GAS 2 video');
  th.innerHTML = `<div class="tvSet">${set(false)}</div>
    <div class="tvBar">
      <button type="button" class="tvPlay" aria-label="Pause">${svg('pause')}</button>
      <span class="tvSeek" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i><b></b></i></span>
      <span class="tvTime">0:00 / 0:00</span>
      <button type="button" class="tvMute" aria-label="Mute">${svg('sound')}</button>
      <button type="button" class="tvFull" aria-label="Full screen">${svg('full')}</button>
      <button type="button" class="tvClose" aria-label="Close">${svg('close')}</button>
    </div>`;
  document.body.append(th);
  const big = th.querySelector('.tvSet'), bigScreen = big.querySelector('.tvScreen');
  const $ = (s) => th.querySelector(s);
  const bPlay = $('.tvPlay'), bMute = $('.tvMute'), bFull = $('.tvFull'), bClose = $('.tvClose'), seek = $('.tvSeek'), fill = $('.tvSeek b'), time = $('.tvTime');
  if (!video) { bPlay.disabled = true; bMute.disabled = true; seek.setAttribute('aria-disabled', 'true'); seek.tabIndex = -1; time.textContent = 'Coming soon'; }

  const mmss = (s) => (s = Math.max(0, Math.floor(s || 0)), Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'));
  const paint = () => {
    if (!video) return;
    const d = video.duration || 0, p = d ? video.currentTime / d : 0;
    fill.style.width = (p * 100).toFixed(2) + '%'; seek.setAttribute('aria-valuenow', Math.round(p * 100));
    time.textContent = mmss(video.currentTime) + ' / ' + mmss(d);
    bPlay.innerHTML = svg(video.paused ? 'play' : 'pause'); bPlay.setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
    bMute.innerHTML = svg(video.muted ? 'muted' : 'sound'); bMute.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
  };
  if (video) for (const ev of ['timeupdate', 'play', 'pause', 'volumechange', 'loadedmetadata']) video.addEventListener(ev, () => open && paint());

  // the big set flies from the small one's box (FLIP: it is laid out big, then drawn small and let go)
  const fly = (from, to, done) => {
    if (still()) { done && done(); return; }
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    big.style.transition = 'none';
    big.style.transform = to === big ? `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width})` : 'none';
    big.getBoundingClientRect();
    big.style.transition = 'transform .55s cubic-bezier(.2, .8, .2, 1)';
    big.style.transform = to === big ? 'none' : `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width})`;
    let fired = false; const end = () => { if (fired) return; fired = true; done && done(); };
    big.addEventListener('transitionend', end, { once: true }); setTimeout(end, 700);
  };

  let open = false, back = null;
  const show = () => {
    if (open) return; open = true; back = document.activeElement;
    try { const r = window.gas2Radio; if (r && r.state.playing) r.stop(); } catch (e) {}
    th.hidden = false; document.documentElement.classList.add('tvOpen');
    tv.classList.add('away');
    if (video) { bigScreen.prepend(video); video.loop = false; video.currentTime = 0; video.muted = false; video.volume = 1; video.play().catch(() => {}); }
    fly(small, big);
    requestAnimationFrame(() => th.classList.add('in'));
    paint(); bClose.focus({ preventScroll: true });
  };
  const hide = () => {
    if (!open) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    th.classList.remove('in');
    fly(big, small, () => {
      open = false; th.hidden = true; big.style.transform = ''; big.style.transition = '';
      document.documentElement.classList.remove('tvOpen'); tv.classList.remove('away');
      if (video) { video.muted = true; video.loop = true; smallScreen.prepend(video); if (!still()) video.play().catch(() => {}); else video.pause(); }
      if (back && back.focus) back.focus({ preventScroll: true });
    });
  };

  small.addEventListener('click', show);
  bClose.addEventListener('click', hide);
  th.addEventListener('click', (e) => { if (e.target === th) hide(); });
  const toggle = () => { if (!video) return; if (video.paused) { if (video.ended) video.currentTime = 0; video.play().catch(() => {}); } else video.pause(); };
  bPlay.addEventListener('click', toggle);
  bigScreen.addEventListener('click', toggle);
  bMute.addEventListener('click', () => { if (video) video.muted = !video.muted; });
  const full = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) return (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    if (bigScreen.requestFullscreen) bigScreen.requestFullscreen().catch(() => {});
    else if (bigScreen.webkitRequestFullscreen) bigScreen.webkitRequestFullscreen();
    else if (video && video.webkitEnterFullscreen) video.webkitEnterFullscreen();   // iPhone: only the video itself goes full screen
  };
  bFull.addEventListener('click', full);
  bigScreen.addEventListener('dblclick', full);
  const seekTo = (x) => { if (!video || !video.duration) return; const r = seek.getBoundingClientRect(); video.currentTime = Math.max(0, Math.min(1, (x - r.left) / r.width)) * video.duration; };
  seek.addEventListener('pointerdown', (e) => { if (!video) return; seek.setPointerCapture(e.pointerId); seekTo(e.clientX);
    const mv = (m) => seekTo(m.clientX); seek.addEventListener('pointermove', mv);
    seek.addEventListener('pointerup', () => seek.removeEventListener('pointermove', mv), { once: true }); });
  seek.addEventListener('keydown', (e) => { if (!video) return;
    if (e.key === 'ArrowRight') { video.currentTime = Math.min(video.duration || 0, video.currentTime + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { video.currentTime = Math.max(0, video.currentTime - 5); e.preventDefault(); } });
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape' && !(document.fullscreenElement || document.webkitFullscreenElement)) { hide(); e.preventDefault(); }
    else if (e.key === ' ' && !/^(BUTTON|INPUT)$/.test(document.activeElement.tagName)) { toggle(); e.preventDefault(); }
    else if (e.key === 'Tab') {                         // keep the focus inside the theater
      const f = [...th.querySelectorAll('button:not([disabled]), [tabindex="0"]')];
      const i = f.indexOf(document.activeElement), n = f.length;
      if (n) { f[(i + (e.shiftKey ? n - 1 : 1)) % n].focus(); e.preventDefault(); }
    }
  });
  if (video) video.addEventListener('ended', () => paint());

  if (Q.get('tv') === 'open') addEventListener('load', () => setTimeout(show, 300));
})();
