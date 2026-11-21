// The room's picture of the TV, taken on the home page (2026-11-21). Loaded by the home page's garage only
// (src/components/HomeOpening.astro, after the library beside it), never by the room itself.
// The room's TV at the end of the walk has to be this page's TV to the pixel. The TV is laid out by the window's
// width AND height, and its small type is drawn by the visitor's own browser, so a photo saved ahead (the room's
// three, tvcap.mjs) fits only the screen it was taken on: at 1312x734 the categories, the plugin's picture, the keys
// and the type all jumped at the lock. So the page photographs its own TV here, while the room loads:
// modern-screenshot 4.7.0 (MIT; tools/_home-opening/vendor/modern-screenshot/) copies the TV's elements with the
// styles the browser worked out for them into an SVG picture, which is drawn on a canvas: the screen from the nav
// down to its end, which is the room's TV face at the lock, at 2 device px per px (less on a screen over 2048 px
// wide). (The saved photos start 1 px higher, under the nav's last row, and the room squeezes that row in: cut at
// the nav itself the lock measured a third closer, 1.65 -> 1.10 at 1366x768.) The room gets the canvas (room.html,
// liveTv) and puts it up where the change can't be seen, or is small; a resize takes a new one.
// The copy is the TV as it stands at the lock, which the page reaches only there. Put right in the copy, never on
// the page: it is seen (the wall is at opacity 0 here); its tube and LED are lit (WordWall's power-on waits for the
// TV to come into view); its bezel's picture is up (WordWall's dress() loads it a screen away: the same cut, from
// data-ww-art); what a reveal brings in has come in; the wall's wood stands where the scroll will have drifted it.
// What is hidden with all it holds (the other plugins' panels) is left out, and so is DRIFT's video.
// The copy is laid out at the page's own scale, and nothing in it wraps by itself: each line of type ends where the
// page's ends, each row of boxes holds what the page's holds (lines(), rows(); a word that went down a line was the
// whole hand-off off, 11-21). ?tv=wide is the test's switch for that. WebKit's upside-down shadows are turned back.
// The copying goes in slices with a breath between them (in one go it held the page, and the room in it, for
// about 0.3 s): 4 ms of work at a time once the room is on show, 16 ms under the loading screen (the room's own
// loading holds the page for longer than that, and the photo is done sooner). Two steps can't be sliced, the
// browser reading the picture and drawing it (about 50 ms each in Chrome, more in Safari): each goes at a moment
// it won't show where it can (calm()). On a usual visit the photo is done while the loading screen is still up, a
// second or two before the room. One that takes over 15 s, or misses a font or a picture, is dropped: the saved
// photo stays. window.__hoTv says how it went (the checks read it).
window.__hoTvPhoto = function (frame, navTotal) {
  if (!window.modernScreenshot) return; // (the library did not load: the page has said so)
  var H = document.documentElement, wall = null;
  var SHOT_LIMIT = 15000, NOTES = ['data-honw', 'data-horow', 'data-hofix', 'data-hooff', 'data-hobr', 'data-hobb'];
  // a test's switch, never on for a visitor: ?tv=wide sets the copy's type 0.01 px a letter wider than the page's (a
  // third of a px on the plugin's tag line, ten times the hair that wrapped it), and each box in a row that may wrap
  // 0.05 px wider. The photo has to come out with the page's lines and rows all the same
  var TV_WIDE = /[?&]tv=wide(&|$)/;
  // what stands in a line as one box
  var BOX = /^(IMG|svg|CANVAS|VIDEO|IFRAME|OBJECT|EMBED|INPUT|SELECT|TEXTAREA|BUTTON|METER|PROGRESS)$/;
  var shot = null, shooting = false, shotTimer = 0, tv = null, wallSeen = false, scrolledAt = -1e4;
  var blink = /Chrome|Chromium|Edg\//.test(navigator.userAgent), webkit = /AppleWebKit/.test(navigator.userAgent) && !blink;
  // a moment a 50 ms hold won't show: the loading screen is up (its lights are the compositor's), the room is hidden
  // (past the lock), or the scroll has been at rest for 0.2 s. Mid-walk it depends on the room: while its TV is still
  // small enough to take the photo (room.html, TV_FAR) the step goes at once, hold or not, so that the lock is the same
  // picture; once the TV is too large for that the photo can't go up before the room is hidden, so the step waits for
  // one of the moments above (4 s at most)
  function calm() {
    var t0 = performance.now();
    return new Promise(function (ok) { (function ask() {
      var now = performance.now(), hurry = true;
      try { hurry = frame.contentWindow.__garageTvNow(); } catch (e) {}
      if (hurry || H.classList.contains('ho-loading') || H.classList.contains('ho-past') || !H.classList.contains('ho-on') || now - scrolledAt > 200 || now - t0 > 4000) ok(); else setTimeout(ask, 50);
    })(); });
  }
  // WebKit draws a shadow that lies lower than its box (or its letters) higher than it instead, in a picture like the
  // copy (11-21: the dark drop under the plugin's picture lay over the picture, and the wood under it stayed light;
  // box-shadow, inset too, and text-shadow; not a filter's drop-shadow). Asked of the browser itself, once: a box with
  // a hard shadow under it, and where the shadow lands (a filled box: WebKit draws an empty one's shadow nowhere).
  // Where it lands above, the copy's shadows are written the other way up (turned())
  var flips = null;
  function shadowsFlip() {
    return flips || (flips = new Promise(function (ok) {
      var im = new Image();
      im.onload = function () { try { var c = document.createElement('canvas'); c.width = 16; c.height = 48; var g = c.getContext('2d'); g.drawImage(im, 0, 0); ok(g.getImageData(8, 8, 1, 1).data[3] > 128); } catch (e) { ok(false); } };
      im.onerror = function () { ok(false); };
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="48"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="zoom:2;width:8px;height:8px;margin-top:8px;background:#000;box-shadow:0 8px 0 0 #000"></div></foreignObject></svg>');
    }));
  }
  function turned(shadows) {
    return shadows.split(/,(?![^(]*\))/).map(function (s) { return s.replace(/(-?[\d.]+px\s+)(-?)([\d.]+px)/, function (m, x, up, y) { return x + (up || !parseFloat(y) ? '' : '-') + y; }); }).join(',');
  }
  // the width the photo is for: the room's frame during the walk, which is the page's width without a scrollbar that
  // takes room (Windows, a Mac with a mouse). Not the window's: under the loading screen the page doesn't scroll, the
  // scrollbar's place is kept empty (scrollbar-gutter) and the frame lies over it too, so the room is that much wider
  // until it is ready. The room keeps a photo that doesn't fit it yet and takes it when its frame gets that width
  function shotW() { return document.body.clientWidth || H.clientWidth; }
  function giveTv() { try { var w = frame.contentWindow; if (shot && w && w.__garageTv) w.__garageTv(shot.pic, { w: shot.w, h: shot.h, nav: shot.nav }); } catch (e) {} }
  // the TV's own measuring (WordWall's fit(): the menu's and the text's heights, a frame after a text box changes)
  function tvSig() {
    var s = wall.offsetHeight + '|' + tv.getAttribute('style'), p = tv.querySelectorAll('[data-ww-panel]');
    for (var i = 0; i < p.length; i++) s += '|' + (p[i].getAttribute('style') || '');
    return s;
  }
  // once the TV's script has run, its fonts are in and its sizes have held still for two frames; not in a hidden tab
  function shootSoon(ms) { clearTimeout(shotTimer); shotTimer = setTimeout(shootWhenReady, ms || 0); }
  function shootWhenReady() {
    if (shooting || !H.classList.contains('ho-on')) return;
    wall = wall || document.querySelector('.garage-wall');
    tv = wall && wall.querySelector('[data-wordwall]');
    // the TV's box changed with no resize of the window (where the browser keeps no place for the scrollbar, Safari,
    // the page gets narrower when the loading screen goes and the scrollbar comes back): its photo again
    if (wall && !wallSeen && 'ResizeObserver' in window) {
      wallSeen = true;
      new ResizeObserver(function () { if (shot && (shot.w !== shotW() || shot.h !== innerHeight)) { shot = null; shootSoon(300); } }).observe(wall);
    }
    if (!window.modernScreenshot || !tv || tv.dataset.wwLib !== 'on' || tv.dataset.wwPower === 'powering' || document.hidden || !wall.offsetHeight || !document.fonts || document.fonts.status !== 'loaded') { shootSoon(120); return; } // (powering: the tube's 0.75 s of coming on, when a resize finds the TV in view)
    var sig = tvSig();
    shooting = true;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      if (tvSig() !== sig || document.fonts.status !== 'loaded') { shooting = false; shootSoon(60); return; }
      var t0 = performance.now(), W = shotW(), Hh = innerHeight;
      new Promise(function (ok) { ok(shootTv()); }).then(function (s) {
        shooting = false;
        if (!H.classList.contains('ho-on')) return;
        if (s.w !== shotW() || s.h !== innerHeight) { shootSoon(300); return; } // the window changed meanwhile
        shot = s; s.T.at = Math.round(performance.now()); s.T.took = Math.round(performance.now() - t0);
        window.__hoTv = { state: 'taken', w: s.w, h: s.h, nav: s.nav, T: s.T };
        giveTv();
      }, function (e) { shooting = false; window.__hoTv = { state: 'failed', why: String(e && e.message || e), w: W, h: Hh }; }); // (the room keeps its saved photo)
    }); });
  }
  function shootTv() {
    var ms = window.modernScreenshot, nav = navTotal(), W = shotW(), Hh = innerHeight, d = Math.min(2, 4096 / W);
    // the scale the copy is laid out at: the page's own. Chrome (and Edge: Blink) lays a page out in the screen's px,
    // so on a 2x screen every width is a multiple of 1/128 px and type is measured at twice its size; the copy, a
    // picture, was laid out at 1x, where the same line of type came out 0.03 px wider than the box it had just filled
    // on the page, and its last word went down a line (11-21, "DEEP"). WebKit lays a page out at 1x on any screen;
    // there the copy is laid out at the photo's scale for another reason (a picture drawn larger than it is, below).
    // Firefox: 1x, its page's scale (laid out larger its copy came out wrong, 3.39 at the gate against 1.05)
    var z = webkit ? d : blink ? window.devicePixelRatio || 1 : 1;
    var wide = TV_WIDE.test(location.search) ? 0.01 : 0, flip = false;
    var rc = wall.getBoundingClientRect(), wallH = wall.offsetHeight, cutH = Math.min(wallH, Hh - nav);
    var t0 = performance.now(), T = {}, fixes = [], marked = [], over = false, styleOf = new Map(), brs = new Map(), kept = 0, i, n, p;
    var attr = function (el, k, v) { if (over) return; el.setAttribute(k, v); marked.push(el); };
    // (the copy's callback sees only the copy: the page's element carries the note across)
    var fix = function (el, css) { if (!el || over) return; var x = el.getAttribute('data-hofix'); if (x == null) attr(el, 'data-hofix', fixes.push(css) - 1); else for (var k in css) fixes[+x][k] = css[k]; };
    var clean = function () { for (var i = 0; i < marked.length; i++) for (var k = 0; k < NOTES.length; k++) marked[i].removeAttribute(NOTES[k]); marked.length = 0; };
    var breath = function () { return new Promise(function (r) { var c = new MessageChannel(); c.port1.onmessage = function () { c.port1.close(); r(); }; c.port2.postMessage(0); }); };
    var dataUrl = function (blob) { return new Promise(function (done, fail) { var fr = new FileReader(); fr.onload = function () { done(fr.result); }; fr.onerror = fail; fr.readAsDataURL(blob); }); };
    // all of it within SHOT_LIMIT, with every picture in it, or no photo (the room keeps its saved one): a font or a
    // picture that stalls or fails would else hold it for good, or leave a hole in a photo that looks taken
    var box = null, missed = null, limit = new Promise(function (ok, no) { setTimeout(function () { no(new Error('over ' + SHOT_LIMIT / 1000 + ' s')); }, SHOT_LIMIT); });
    var tidy = function () { over = true; clean(); if (box) box.remove(); }; // (the notes and the empty frame never stay on the page, whatever is still under way)
    limit.catch(function () {});
    try { return Promise.race([copy(), limit]).then(function (s) { tidy(); return s; }, function (e) { tidy(); throw e; }); } catch (e) { tidy(); throw e; }

    // type that can wrap, and the rule that keeps it from wrapping (its spaces and line ends as they were)
    function wraps(cs) { var w = cs.whiteSpace; return w === 'normal' ? 'nowrap' : w === 'pre-wrap' || w === 'break-spaces' ? 'pre' : ''; }
    // what stands in n's lines, in order: its runs of type and the boxes among them (a key, a picture), through the
    // spans around them. null = where a line ends by itself (a <br>, a block)
    function leaves(n, out) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { if (/\S/.test(c.data)) out.push(c); continue; }
        var s = c.nodeType === 1 && styleOf.get(c);
        if (!s || s.display === 'none' || s.position === 'absolute' || s.position === 'fixed' || s.cssFloat !== 'none') continue; // (not in the line)
        if (c.nodeName === 'BR') out.push(null);
        else if ((s.display === 'inline' && !BOX.test(c.nodeName)) || s.display === 'contents') {
          if (wraps(s) && s.whiteSpace !== styleOf.get(c.parentNode).whiteSpace) attr(c, 'data-honw', wraps(s)); // (its own rule, which the copy carries)
          leaves(c, out);
        } else out.push(s.display.slice(0, 6) === 'inline' ? c : null);
      }
    }
    // the first letter of the run that stands under the height y (a space the line end swallowed has no place: the next
    // letter's counts)
    function under(run, y) {
      var rg = document.createRange(), lo = 0, hi = run.length;
      var low = function (o) { for (; o < run.length; o++) { rg.setStart(run, o); rg.setEnd(run, o + 1); for (var q = rg.getClientRects(), i = 0; i < q.length; i++) if (q[i].width > 0) return q[i].top > y; } return true; };
      while (lo < hi) { var m = (lo + hi) >> 1; if (low(m)) hi = m; else lo = m + 1; }
      return lo;
    }
    // a block of type: where each of its lines ends on the page (the next piece starts further left, or wholly lower),
    // noted on the piece's parent as the run's place among its runs and the letter (data-hobr), or on the box that
    // starts the line (data-hobb). Type that lies straight in a row of boxes is only kept from wrapping, on one line
    function lines(n, cs) {
      var w = wraps(cs), out = [], prev = null, found = [], rg = document.createRange(), a, b;
      leaves(n, out);
      for (a = 0; a < out.length; a++) {
        var L = out[a]; if (!L) { prev = null; continue; }
        var q = L.nodeType === 3 ? (rg.selectNodeContents(L), rg.getClientRects()) : L.getClientRects(), f = [];
        for (b = 0; b < q.length; b++) if (q[b].width > 0) f.push(q[b]);
        for (b = 0; b < f.length; b++) {
          if (prev && (f[b].left < prev.right - Math.min(0.5, prev.width / 2) || f[b].top >= prev.bottom - 0.5) && (!b || f[b].top - f[b - 1].top >= 1)) found.push([L, b ? under(L, (f[b - 1].top + f[b].top) / 2) : 0]);
          prev = f[b];
        }
      }
      if (!out.some(Boolean)) return;
      // (left to wrap by itself, under its own rule and not the one a block around it was given here: type on several
      // lines straight in a row of boxes, where a <br> would be a box, and type whose line ends are its own, pre-line)
      if ((found.length && /flex|grid/.test(cs.display)) || cs.whiteSpace === 'pre-line') { attr(n, 'data-honw', cs.whiteSpace); return; }
      if (w) attr(n, 'data-honw', w);
      for (a = 0; a < found.length; a++) {
        var L = found[a][0], P = L.parentNode, list = brs.get(P) || [], k = 0;
        if (L.nodeType === 1) { attr(L, 'data-hobb', ''); if (list.indexOf('b') < 0) list.push('b'); }
        else { for (var c = L.previousSibling; c; c = c.previousSibling) if (c.nodeType === 3) k++; list.push(k + ':' + found[a][1] + ':' + L.length); }
        brs.set(P, list); kept++;
      }
    }
    // a row of boxes that may wrap. One row on the page: one row (it does not wrap). Several: a row that the page's
    // widths leave within 1 px of losing its last box, or of taking the next row's first, gets that px, in the right
    // margin of its last box (where it moves nothing; only rows that start at the left)
    function rows(n, cs) {
      var k = [], r = [], bottom = 0, i, c, s;
      var m = function (c, side) { return parseFloat(styleOf.get(c)[side]) || 0; };
      // (both names of that margin: the copy carries each, and the one written last would win)
      var push = function (c, by) { var v = (m(c, 'marginRight') + by).toFixed(3) + 'px'; fix(c, { 'margin-right': v, 'margin-inline-end': v }); };
      for (c = n.firstElementChild; c; c = c.nextElementSibling) { s = styleOf.get(c); if (s && s.display !== 'none' && s.position !== 'absolute' && s.position !== 'fixed') k.push(c); }
      for (i = 0; i < k.length; i++) { var q = k[i].getBoundingClientRect(); if (!i || q.top >= bottom - 0.5) { r.push([]); bottom = q.bottom; } r[r.length - 1].push(k[i]); bottom = Math.max(bottom, q.bottom); }
      if (r.length < 2 && k.length > 1) attr(n, 'data-horow', '');
      var by = new Map(); // (the test's switch: each box 0.05 px wider too)
      if (wide) k.forEach(function (c) { by.set(c, 5 * wide); });
      if (r.length > 1 && cs.flexDirection === 'row' && cs.flexWrap === 'wrap' && cs.direction === 'ltr' && /^(normal|flex-start|start|left)$/.test(cs.justifyContent)) {
        var edge = n.getBoundingClientRect().right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight), gap = parseFloat(cs.columnGap) || 0;
        for (i = 0; i < r.length; i++) {
          var last = r[i][r[i].length - 1], next = r[i + 1] && r[i + 1][0], room = edge - last.getBoundingClientRect().right - m(last, 'marginRight');
          var need = next ? next.getBoundingClientRect().width + m(next, 'marginLeft') + m(next, 'marginRight') + gap : Infinity;
          var to = Math.min(Math.max(room, Math.min(1, need / 2)), Math.max(need - 1, need / 2)); // (room for the row, never for the next box)
          if (Math.abs(to - room) > 0.001) { by.set(last, (by.get(last) || 0) + room - to); T.rows = (T.rows || 0) + 1; }
        }
      }
      by.forEach(function (px, c) { push(c, px); });
    }

    // the page's line ends, put into the copy of a piece that holds some (its runs and boxes are in it by now): a <br>
    // at the noted letter of the noted run, and before each noted box. A run that is not the page's stays as it is
    function breaks(c) {
      var list = c.getAttribute('data-hobr').split(','), runs = [], i, k;
      for (k = c.firstChild; k; k = k.nextSibling) if (k.nodeType === 3) runs.push(k); else if (k.nodeType === 1 && k.hasAttribute('data-hobb')) runs.push(k);
      var boxes = runs.filter(function (k) { return k.nodeType === 1; }); runs = runs.filter(function (k) { return k.nodeType === 3; });
      var size = runs.map(function (k) { return k.length; });
      for (i = list.length - 1; i >= 0; i--) { // (from the end: a cut leaves the letters before it in place)
        if (list[i] === 'b') { boxes.forEach(function (k) { c.insertBefore(document.createElement('br'), k); }); continue; }
        var at = list[i].split(':'), run = runs[+at[0]];
        if (!run || size[+at[0]] !== +at[2]) { T.lost = (T.lost || 0) + 1; continue; }
        c.insertBefore(document.createElement('br'), +at[1] ? run.splitText(+at[1]) : run);
      }
    }

    function copy() {
    // the wall's wood drifts with the scroll (src/lib/scrub.ts, data-drift-y): its place with the TV under the nav
    wall.querySelectorAll('[data-drift-y]').forEach(function (el) {
      var amp = parseFloat(el.dataset.driftY) || 24, box = el.parentElement || el;
      fix(el, { transform: 'translate(0px, ' + (-amp + 2 * amp * (Hh - nav) / (Hh + box.offsetHeight)).toFixed(3) + 'px)' });
    });
    // the tube lit (WordWall.astro, "Power-on"): the lit glass and LED, read off the page with the TV on for a
    // moment that is never painted
    if (tv.dataset.wwPower === 'armed') {
      var lit = Array.prototype.slice.call(tv.querySelectorAll('.ww-screen-glow, .ww-frame-led')), was = tv.dataset.wwPower;
      lit.forEach(function (el) { el.style.transition = 'none'; });
      tv.dataset.wwPower = 'on';
      var vals = lit.map(function (el) { var cs = getComputedStyle(el); return { opacity: cs.opacity, 'background-image': cs.backgroundImage, 'box-shadow': cs.boxShadow }; });
      tv.dataset.wwPower = was;
      lit.forEach(function (el, i) { void getComputedStyle(el).opacity; el.style.transition = ''; fix(el, vals[i]); });
    }
    // what comes in with a reveal (src/lib/reveal.ts) has come in
    wall.querySelectorAll('[data-reveal], [data-reveal-item], [data-reveal-accent]').forEach(function (el) {
      if (!el.classList.contains('revealed') || el.style.opacity || el.style.transform) fix(el, { opacity: '1', transform: 'none', translate: 'none', scale: 'none' });
    });
    // what shows: a part hidden with all it holds (the other plugins' panels) keeps its box and loses its insides
    var all = wall.querySelectorAll('*'), css = [], seen = new Set();
    styleOf.set(wall, getComputedStyle(wall));
    for (i = 0; i < all.length; i++) { css[i] = getComputedStyle(all[i]); styleOf.set(all[i], css[i]); if (css[i].display !== 'none' && css[i].visibility !== 'hidden') for (p = all[i]; p && p !== wall && !seen.has(p); p = p.parentNode) seen.add(p); }
    for (i = 0; i < all.length; i++) {
      n = all[i];
      if (!seen.has(n)) { if (css[i].display !== 'none' && (n.parentNode === wall || seen.has(n.parentNode))) attr(n, 'data-hooff', ''); continue; }
      // every line ends where the page's does, and every row holds what the page's holds. A box in the copy has the
      // page's width, and what is in it is measured again: where it had just fitted, a hair more (the scale above; the
      // width, written to a thousandth of a px; another browser's type) sent the last word down a line, or the last key
      // of a row. So nothing in the copy wraps by itself: a block of type gets a real line break at each of the page's
      // line ends (lines()), a row of boxes stays the row or rows it is (rows())
      if (!(n instanceof HTMLElement) || n.nodeName === 'TEXTAREA' || n.nodeName === 'SELECT') continue; // (a drawing's parts, a field's own text)
      if (css[i].display.indexOf('flex') >= 0 && css[i].flexWrap !== 'nowrap') rows(n, css[i]);
      if (css[i].display !== 'inline' && css[i].display !== 'contents') lines(n, css[i]);
    }
    brs.forEach(function (list, el) { attr(el, 'data-hobr', list.join(',')); });
    T.lines = kept; T.wide = wide || undefined;
    // the bezel's picture, the cut the page will put up itself (WordWall's dress(): the smallest still sharp here,
    // AVIF where this browser shows it)
    var bezelEl = tv.querySelector('.ww-frame'), art = null, bezel = Promise.resolve();
    try { art = JSON.parse(tv.dataset.wwArt || '{}'); } catch (e) {}
    var roll = art && art.frame && art.frame[tv.dataset.wwFrame];
    if (bezelEl && roll && getComputedStyle(bezelEl).borderImageSource === 'none') {
      var u = parseFloat(getComputedStyle(bezelEl).paddingLeft) / parseFloat(getComputedStyle(tv).getPropertyValue('--wf-zl'));
      var need = roll.w * u * (window.devicePixelRatio || 1), cut = roll.cuts.filter(function (c) { return c[0] >= need; })[0] || roll.cuts[roll.cuts.length - 1];
      bezel = new Promise(function (done) { var im = new Image(); im.onload = function () { done(cut[1]); }; im.onerror = function () { done(cut[2]); }; im.src = cut[1]; })
        .then(function (url) { fix(bezelEl, { 'border-image-source': 'url("' + new URL(url, location.href).href + '")', 'border-image-slice': cut[3] || '' }); });
    }
    // the fonts this page has loaded, and only those, go into the picture (the library's own way takes every
    // @font-face of a family: 1.4 MB of subsets nobody reads here)
    var key = function (a, b, c, e) { return [a, b, c, e].join('|').replace(/["'\s]/g, '').toLowerCase(); }, have = {}, rules = [], files = {};
    document.fonts.forEach(function (f) { if (f.status === 'loaded') have[key(f.family, f.weight, f.style, f.unicodeRange)] = 1; });
    var walk = function (list) { for (var i = 0; i < list.length; i++) { var r = list[i], s = r.style;
      if (r.constructor.name === 'CSSFontFaceRule') { if (have[key(s.getPropertyValue('font-family'), s.getPropertyValue('font-weight') || '400', s.getPropertyValue('font-style') || 'normal', s.getPropertyValue('unicode-range') || 'U+0-10FFFF')]) rules.push(r); }
      else if (r.cssRules) walk(r.cssRules); } };
    for (i = 0; i < document.styleSheets.length; i++) try { walk(document.styleSheets[i].cssRules); } catch (e) {} // (a sheet from another host can't be read)
    var fonts = Promise.all(rules.map(function (r) {
      var m = /url\((['"]?)([^'")]+)\1\)/.exec(r.style.getPropertyValue('src')); if (!m) return '';
      var url = new URL(m[2], (r.parentStyleSheet && r.parentStyleSheet.href) || location.href).href;
      files[url] = files[url] || fetch(url).then(function (res) { if (!res.ok) throw new Error('font ' + res.status); return res.blob(); }).then(dataUrl);
      return files[url].then(function (data) { return r.cssText.replace(m[0], 'url(' + data + ')'); });
    })).then(function (list) { return list.join('\n'); });

    var names = [], cs0 = getComputedStyle(wall); for (i = 0; i < cs0.length; i++) if (cs0[i].slice(0, 2) !== '--') names.push(cs0[i]); // (the custom properties are worked into the values already)
    // the library reads each element's styles against a bare one's, in an empty frame of its own. Made here and waited
    // for: its own comes up while the copy is under way, and a slice that met it half loaded failed
    box = document.createElement('iframe'); var boxed = new Promise(function (ok) { box.onload = ok; });
    box.width = box.height = '0'; box.tabIndex = -1; box.setAttribute('aria-hidden', 'true'); box.style.cssText = 'position:fixed;visibility:hidden;border:0';
    box.srcdoc = '<!DOCTYPE html><meta charset="UTF-8"><title></title><body>'; document.body.appendChild(box);
    var last = 0, longest = 0;
    return Promise.all([bezel, fonts, boxed, shadowsFlip()]).then(function (pre) {
      T.pre = Math.round(performance.now() - t0); flip = pre[3]; T.flip = flip || undefined;
      // (an empty stand-in for the library's start: given the wall, it first waits for every lazy picture and the
      // video in it, each for its whole time limit)
      return ms.createContext(document.createElement('div'), {
        scale: d, timeout: 10000, font: pre[1] ? { cssText: pre[1] } : undefined, includeStyleProperties: names,
        // (the library puts a blank in for a picture it could not fetch and goes on: fetched here, a miss is known)
        fetchFn: function (url) { return fetch(url).then(function (res) { if (!res.ok) throw new Error(res.status); return res.blob(); }).then(dataUrl).catch(function (e) { missed = missed || url; throw e; }); },
        filter: function (n) {
          if (n.parentNode.hasAttribute && n.parentNode.hasAttribute('data-hooff')) return false;
          return n.nodeType !== 1 || (n.nodeName !== 'VIDEO' && n.nodeName !== 'NOSCRIPT' && getComputedStyle(n).display !== 'none'); // (a <noscript>'s style came out as text)
        },
        onCloneEachNode: function (c) {
          if (c.nodeType === 1) {
            if (c.nodeName === 'IMG') c.setAttribute('decoding', 'sync'); // (WebKit left a picture that decodes on its own time out of the first draw)
            var f = c.getAttribute('data-honw'); if (f) c.style.whiteSpace = f;
            if (c.hasAttribute('data-horow')) c.style.flexWrap = 'nowrap';
            if (c.hasAttribute('data-hobr')) breaks(c);
            if (wide && c.style.letterSpacing) c.style.letterSpacing = (parseFloat(c.style.letterSpacing) || 0) + wide + 'px';
            var x = c.getAttribute('data-hofix'); if (x != null) { var css = fixes[+x]; for (var p in css) if (css[p]) c.style.setProperty(p, css[p]); }
            if (flip) { var bs = c.style.boxShadow, ts = c.style.textShadow; if (bs && bs !== 'none') c.style.boxShadow = turned(bs); if (ts && ts !== 'none') c.style.textShadow = turned(ts); }
          }
          var now = performance.now();
          if (now - last > (H.classList.contains('ho-loading') ? 16 : 4)) { longest = Math.max(longest, now - last); return breath().then(function () { last = performance.now(); }); }
        },
        // the wall whole, where it stands at the lock: seen, and cut by the photo's edge, not squeezed into it
        onCloneNode: function (root) {
          root.style.setProperty('width', rc.width + 'px', 'important'); root.style.setProperty('height', wallH + 'px', 'important');
          root.style.position = 'relative'; root.style.opacity = '1'; root.style.translate = 'none';
          if (wide && !root.style.letterSpacing) root.style.letterSpacing = wide + 'px';
        },
      });
    }).then(function (ctx) {
      ctx.node = wall; ctx.width = rc.width; ctx.height = cutH; ctx.sandbox = box;
      last = performance.now();
      return ms.domToForeignObjectSvg(ctx).then(function (svg) {
        T.copy = Math.round(performance.now() - t0); T.slice = Math.round(longest); T.z = z;
        clean();
        ms.destroyContext(ctx); // (takes the empty frame away)
        if (missed) throw new Error('no picture: ' + missed);
        // the copy laid out at its scale (z, above): the picture that much larger, the copy zoomed to fill it (CSS
        // zoom lays out again, at that scale). In WebKit that is the photo's own scale, so the picture is drawn 1:1:
        // drawn larger than it is, WebKit put a smear beside every glow and lost the outlined keys' outlines
        if (z !== 1) { svg.setAttribute('width', rc.width * z); svg.setAttribute('height', cutH * z); svg.setAttribute('viewBox', '0 0 ' + rc.width * z + ' ' + cutH * z); svg.querySelector('foreignObject').firstElementChild.style.zoom = z; }
        var xml = new XMLSerializer().serializeToString(svg);
        T.kb = Math.round(xml.length / 1024);
        return dataUrl(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
      });
    }).then(function (url) {
      return calm().then(function () { // the browser reads the picture
        var im = new Image(); im.decoding = 'async'; im.src = url;
        return (im.decode ? im.decode() : new Promise(function (ok, no) { im.onload = ok; im.onerror = no; })).then(function () { return im; });
      });
    }).then(function (im) {
      T.decode = Math.round(performance.now() - t0);
      var o = document.createElement('canvas'); o.width = Math.round(W * d); o.height = Math.round((Hh - nav) * d);
      var g = o.getContext('2d'), bg = getComputedStyle(document.body).backgroundColor;
      var draw = function () { g.fillStyle = bg; g.fillRect(0, 0, o.width, o.height); g.drawImage(im, Math.round(rc.left * d), 0, Math.round(rc.width * d), Math.round(cutH * d)); };
      var out = function () { return { pic: o, w: W, h: Hh, nav: nav, T: T }; };
      // ...and draws it (and the room, handed it in the same breath, puts it on its TV). WebKit once more a moment
      // later: a picture inside the picture that it had not decoded yet is not in its first draw (the test WebKit
      // had them all in the first, with the sync decoding above; Safari itself was not tried)
      return calm().then(draw).then(function () {
        return !webkit ? out() : new Promise(function (r) { setTimeout(r, 120); }).then(calm).then(draw).then(out);
      });
    });
    }
  }
  // the room asks for the photo as it starts and again as it takes over (it may be taken already); a resize lays the
  // TV out anew: its photo again
  addEventListener('message', function (e) {
    if (e.origin === location.origin && e.source === frame.contentWindow && e.data && (e.data.garage === 'boot' || e.data.garage === 'ready')) giveTv();
  });
  addEventListener('scroll', function () { scrolledAt = performance.now(); }, { passive: true });
  addEventListener('resize', function () { shot = null; shootSoon(400); });
  shootSoon(0);
};
