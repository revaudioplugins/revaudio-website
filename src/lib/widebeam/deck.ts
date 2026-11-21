/**
 * /widebeam phone deck (lane D, D.4 = Dan's pick D7 B; mobile-04, a11y-d03): WbDeck.astro under the face, held upright
 * under 901 px (DECK_MQ). It drives the same store as the face (source 'deck'), so the face above stays the live display:
 * its lamps, road, needle and LCDs follow every turn here. While the deck shows, the face is inert (out of the tab order
 * and the accessibility tree: one set of controls, not two).
 *
 * Each knob is a native <input type=range> (0-100 = the knob's travel; its aria-valuetext says the value) under the
 * knob's own art: a phone screen reader adjusts it with its own gestures (a11y-d03), and a key acts as on the face (one
 * key map: arrows 1 %, Page Up / Down 8 %, Home / End). A finger or a mouse turns the art itself with the face's rules
 * (face.ts): 200 CSS px for the whole travel; on touch a direction lock (hold until 8 px: a sideways drag turns it, a
 * vertical swipe on a knob not picked yet scrolls the page, a tapped knob takes both); the wheel only on a picked knob.
 * The readout prints what the face's trip LCD prints (the reading of the control in hand, the coach's line, dark glass
 * when the face is cold or POWER is off). Art: the face's own strip files, in the tier the face's loader picked for both
 * (face.ts); the seats (deck-seats.webp) once the deck nears.
 */
import { PRESETS, presetValues, type Store } from './state';
import type { WbParams } from './audio';
import { S, KEYSTEP, stripGrid, stripPos, toNorm, knobValue, valueText, KNOBS, releasePick, fitLine, onRefit, type Face, type KnobId, type Part } from './face';
import { DECK_MQ } from './drive-to';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const reducedNow = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initDeck(page: HTMLElement, store: Store, face: Face) {
  const deck = page.querySelector<HTMLElement>('[data-wb-deck]');
  if (!deck) return;
  const mq = matchMedia(DECK_MQ);
  const on = () => mq.matches;

  // ── the face above: the live display, inert while the deck holds the controls ──
  const mode = () => face.root.toggleAttribute('inert', on());
  mq.addEventListener?.('change', mode);
  mode();

  // ── the art: the face's strips (swapped in with the face's, wb:art), the seats once the deck nears ──
  const strips = [...deck.querySelectorAll<HTMLElement>('[data-wb-deck-art]')].map((box) => {
    const part = box.dataset.wbDeckArt as Exclude<Part, 'base'>;
    const els = [...box.querySelectorAll<HTMLElement>('.wb-deck-strip')];
    els.forEach((el) => stripGrid(el, S[part]));
    return { box, part, els };
  });
  const setArt = () => {
    let any = false;
    for (const { part, els } of strips) { const u = face.artUrl(part); if (u) { els.forEach((el) => { el.style.backgroundImage = `url(${u})`; }); any = true; } }
    deck.classList.toggle('is-art', any);
  };
  addEventListener('wb:art', setArt);
  setArt();
  const seatsUrl = deck.dataset.wbSeats;
  new IntersectionObserver((entries, io) => {
    if (!entries.some((e) => e.isIntersecting) || !on()) return;
    io.disconnect();
    if (!seatsUrl) return;
    const im = new Image(); im.decoding = 'async'; im.src = seatsUrl;
    im.decode().catch(() => {}).then(() => deck.classList.add('is-near')); // CSS lays the seats in (drive.css)
  }, { rootMargin: '100% 0px' }).observe(deck);

  // ── the knobs ──
  const get = (k: KnobId) => store.get()[k] as number;
  const setN = (k: KnobId, n: number) => store.set({ [k]: knobValue(k, n) } as Partial<WbParams>, 'deck');
  const knobs = (['tilt', 'width', 'focus', 'mix', 'reach'] as KnobId[]).map((k) => {
    const box = deck.querySelector<HTMLElement>(`[data-wb-deck-ctl="${k}"]`)!;
    const input = box.querySelector<HTMLInputElement>('input')!;
    const strip = box.querySelector<HTMLElement>('.wb-deck-strip')!;
    bindKnob(box, input, k);
    return { k, box, input, strip };
  });

  function bindKnob(box: HTMLElement, input: HTMLInputElement, k: KnobId) {
    type Drag = { id: number; touch: boolean; sx: number; sy: number; x: number; y: number; n: number; mode: 'pending' | 'turn' | 'off'; axis: 'x' | 'y' | 'any'; wasPicked: boolean };
    let p: Drag | null = null;
    const picked = () => box.classList.contains('is-picked') || document.activeElement === input;
    const startTurn = (e: PointerEvent) => { try { box.setPointerCapture(e.pointerId); } catch {} box.classList.add('is-turning'); face.drag(k); };
    box.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const touchy = e.pointerType !== 'mouse';
      p = { id: e.pointerId, touch: touchy, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, n: toNorm(k, get(k)), mode: touchy ? 'pending' : 'turn', axis: touchy ? 'y' : 'any', wasPicked: picked() };
      if (!touchy) { e.preventDefault(); input.focus({ preventScroll: true }); startTurn(e); }
    });
    box.addEventListener('pointermove', (e) => {
      if (!p || e.pointerId !== p.id) return;
      if (p.mode === 'pending') {
        const dx = e.clientX - p.sx, dy = e.clientY - p.sy;
        if (Math.hypot(dx, dy) < 8) return; // hold until the finger has said which way
        if (Math.abs(dx) > Math.abs(dy)) p.axis = 'x';
        else if (p.wasPicked) p.axis = 'y';
        else { p.mode = 'off'; return; } // a vertical swipe on a knob not picked yet is the page's scroll (pan-y)
        p.mode = 'turn'; p.x = e.clientX; p.y = e.clientY; p.n = toNorm(k, get(k));
        startTurn(e);
        return;
      }
      if (p.mode !== 'turn') return;
      const mx = e.clientX - p.x, my = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      const d = p.axis === 'x' ? mx : p.axis === 'y' ? -my : Math.abs(mx) > Math.abs(my) ? mx : -my;
      p.n = clamp(p.n + (d / 200) * (e.shiftKey || e.altKey ? 0.2 : 1), 0, 1); // 200 CSS px = the whole travel
      setN(k, p.n);
    });
    const end = (e: PointerEvent) => {
      if (!p || e.pointerId !== p.id) return;
      const tap = p.touch && p.mode === 'pending' && e.type === 'pointerup';
      if (p.mode === 'turn') face.drag(null);
      p = null;
      box.classList.remove('is-turning');
      if (tap) { box.classList.add('is-picked'); input.focus({ preventScroll: true }); face.touch(k); } // picked: vertical drags turn it too
    };
    // a tap's compatibility mousedown would move focus off the range (the knob's box is not focusable) and drop the pick
    box.addEventListener('mousedown', (e) => e.preventDefault());
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    box.addEventListener('lostpointercapture', () => { if (box.classList.contains('is-turning')) { box.classList.remove('is-turning'); face.drag(null); } });
    box.addEventListener('wheel', (e) => {
      if (document.activeElement !== input) return; // only a picked knob takes the wheel
      e.preventDefault();
      const notches = e.deltaMode === 1 ? e.deltaY / 3 : e.deltaMode === 2 ? e.deltaY : e.deltaY / 100;
      setN(k, toNorm(k, get(k)) - notches * 0.03 * (e.shiftKey ? 0.2 : 1));
      face.touch(k);
    }, { passive: false });
    input.addEventListener('keydown', (e) => {
      let n: number | null = null;
      if (e.key === 'Home') n = 0; else if (e.key === 'End') n = 1;
      else if (KEYSTEP[e.key]) n = toNorm(k, get(k)) + KEYSTEP[e.key] * 0.01;
      if (n === null) return;
      e.preventDefault(); // only these keys: Tab, letters and Space keep their own jobs
      setN(k, n);
      face.touch(k);
    });
    // a screen reader's own adjust (VoiceOver's swipe, TalkBack's) arrives as the range's native input event
    input.addEventListener('input', () => { setN(k, Number(input.value) / 100); face.touch(k); });
    input.addEventListener('focus', () => { box.setAttribute('data-lenis-prevent-wheel', ''); face.touch(k); });
    input.addEventListener('blur', () => { box.removeAttribute('data-lenis-prevent-wheel'); box.classList.remove('is-picked'); });
    releasePick(box, input);
    box.addEventListener('dblclick', () => store.set({ [k]: presetValues(PRESETS[0])[k] } as Partial<WbParams>, 'deck'));
  }

  // ── the keys: HIGH BEAM and SIDE (the plugin's bat toggles, on the face's over-centre spring), MONO, POWER ──
  const sw = (key: string) => deck.querySelector<HTMLButtonElement>(`[data-wb-deck-sw="${key}"]`);
  const high = sw('high'), side = sw('side'), mono = sw('mono'), power = sw('power');
  high?.addEventListener('click', () => { store.set({ high: !store.get().high }, 'deck'); face.touch('high'); });
  side?.addEventListener('click', () => { store.set({ side: !store.get().side }, 'deck'); face.touch('side'); });
  mono?.addEventListener('click', () => { store.set({ mono: !store.get().mono }, 'deck'); face.touch('mono'); });
  power?.addEventListener('click', () => store.set({ power: !store.get().power }, 'deck'));
  const spring = (btn: HTMLElement | null, key: 'high' | 'side') => {
    const strip = btn?.querySelector<HTMLElement>('.wb-deck-strip');
    if (!strip) return () => {};
    let ang = store.get()[key] ? 35 : -35, vel = 0, raf = 0, T = 0;
    const paint = () => { strip.style.backgroundPosition = stripPos(S.toggle, Math.round(((ang + 35) / 70) * 28)); };
    const step = (now: number) => {
      raf = 0; const dt = Math.min(0.02, (now - T) / 1000); T = now;
      const goal = store.get()[key], stop = goal ? 35 : -35, dir = Math.sign(stop - ang) || (goal ? 1 : -1);
      vel += dir * 9000 * dt; ang += vel * dt;
      if (goal ? ang >= 35 : ang <= -35) { ang = stop; vel = -vel * 0.22; if (Math.abs(vel) < 40) vel = 0; }
      paint();
      if (vel !== 0 || ang !== stop) raf = requestAnimationFrame(step);
    };
    paint();
    return () => { if (reducedNow()) { ang = store.get()[key] ? 35 : -35; paint(); return; } if (!raf) { T = performance.now(); raf = requestAnimationFrame(step); } };
  };
  const highKick = spring(high, 'high'), sideKick = spring(side, 'side');
  const [rocker, lit] = [...(power?.querySelectorAll<HTMLElement>('.wb-deck-strip') ?? [])];
  lit?.style.setProperty('background-position', stripPos(S.power, 15)); // the lit jewel's frame

  // ── PRESET ‹ name › (the 16 factory presets, as the console's) ──
  const presetName = deck.querySelector<HTMLElement>('[data-wb-deck-preset]');
  deck.querySelectorAll<HTMLButtonElement>('[data-wb-deck-step]').forEach((b) => b.addEventListener('click', () => face.stepPreset(Number(b.dataset.wbDeckStep))));

  // ── the readout: the face's trip LCD, printed big ──
  const read = deck.querySelector<HTMLElement>('[data-wb-deck-read]');
  let readLen = -1; // refitted when the line's length changes (monospace), not on every frame of a drag
  const fitRead = (force = false) => {
    if (!read) return;
    const t = read.textContent || '', w = read.clientWidth - 22;
    if (!force && t.length === readLen) return;
    readLen = t.length;
    fitLine(read, t && w > 0 ? `${Math.floor(clamp((w / t.length - 1) / 0.6, 15, 30) * 10) / 10}px` : '');
  };
  face.onTrip((t) => {
    if (!read) return;
    read.textContent = t;
    // Courier New is 0.6 em a glyph (+1 px tracking): 30 px, smaller for a long line so it stays on the glass
    fitRead();
  });

  // ── paint: every store change ──
  const paint = (ch: Partial<WbParams> | null) => {
    const s = store.get();
    for (const { k, input, strip } of knobs) {
      if (ch && !(k in ch)) continue;
      const v = s[k] as number;
      input.value = String(Math.round(toNorm(k, v) * 100));
      input.setAttribute('aria-valuetext', valueText(k, v));
      // the frame as the face shows it (face.ts paintStatic: a knob's frame follows its value, the wheel its TILT)
      if (k === 'tilt') strip.style.backgroundPosition = stripPos(S.wheel, Math.round(((s.tilt + 100) / 200) * 80));
      else { const d = KNOBS[k], m = S[k === 'reach' ? 'mix' : k]; strip.style.backgroundPosition = stripPos(m, Math.round(((v - d.min) / (d.max - d.min)) * (m.frames - 1))); }
    }
    high?.setAttribute('aria-checked', String(s.high));
    side?.setAttribute('aria-checked', String(s.side));
    mono?.setAttribute('aria-pressed', String(s.mono));
    mono?.classList.toggle('is-down', s.mono);
    power?.setAttribute('aria-pressed', String(s.power));
    if (rocker) rocker.style.backgroundPosition = stripPos(S.power, s.power ? 14 : 0);
    deck.classList.toggle('is-off', !s.power);
    const nm = PRESETS[store.preset].name.toUpperCase() + (store.edited ? '*' : '');
    if (presetName && presetName.textContent !== nm) { presetName.textContent = nm; fitLine(presetName); }
  };
  onRefit(() => { fitRead(true); if (presetName) fitLine(presetName); });
  // the deck shows only upright under 901 px: a name painted while it was hidden is fitted once it shows
  mq.addEventListener?.('change', () => requestAnimationFrame(() => { fitRead(true); if (presetName) fitLine(presetName); }));
  store.on((s, ch) => {
    if ('high' in ch) highKick();
    if ('side' in ch) sideKick();
    paint(ch);
  });
  paint(null);
  // the jewel lights with the face (the plugin's accessory circuit: dark until the ignition)
  face.onIgnite(() => deck.classList.add('is-lit'));
}
