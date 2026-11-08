# revaudio.net — Design Spec

Derived from `shared/wiki/pages/design-language.md` §6 (the constitution). Written 2026-09-06 for
the garage homepage pass. Product pages (`[slug].astro`) already follow it; this file writes down
what they do so the homepage and every future page stay in the same garage.

## 0. Metaphor

THE OBJECT: **the RevAudio garage**, the workshop the plugins are built in. Not a dashboard, not a
showroom: a dark two-bay garage at night, one tube light on, the bench lamp on, a car under cover.

ERA/VIBE: late-'60s muscle-car garage. Oiled walnut wall boards, brass fittings, oxide-red steel,
amber lamps, a little dust in the light.

MAPPING TABLE (every visible part of the site maps to something you could touch in that garage):

| garage object                      | site part                                   | what it does for the visitor             |
|------------------------------------|---------------------------------------------|------------------------------------------|
| the big tach on the wall           | hero gauge medallion (`/` hero)             | the brand in one glance; needle = scroll |
| the back wall (wood + brass rails) | `GarageWall.astro` / `.garage-wall`         | the surface a section hangs on           |
| the old TV on the wall             | the plugin TV (`WordWall.astro`, `#plugins`) | every plugin; picking one = changing channel |
| the set's on-screen menu           | the TV's categories (ALL first)             | narrow it down without leaving the TV    |
| the channel guide on the screen    | the list: stencil names + a thumbnail       | what there is, at a glance               |
| the picture on the screen          | the lit plugin's window, text, Try key      | proof: this is the thing; try it         |
| the truck door with the handle     | BuyButtonCrane (product pages)              | the ONE way in: pull the handle          |
| the "goes with every vehicle" sign | DAW strip                                   | compatibility                            |
| the pit-crew clipboard             | EmailCapture ("Join the pit crew")          | newsletter                               |
| the steel roller door, half up     | closing CTA                                 | leave with the trial                     |

Plain language instructs, the metaphor only orients (PRODUCT.md): every CTA says what it does in
words ("Start your 30-day free trial"); the garage never has to be decoded.

## 1. Theme & atmosphere

You are standing inside the garage after hours. The tube light over the bench is the only cold
light; everything else is the amber of a bench lamp and the red of a tail-light. Surfaces are real:
walnut boards you could pry off, brass rails with rotated screws. Nothing floats; nothing glows
without a lamp to explain it. Depth comes from real surfaces (the wood, the rails, the plugin
window hung on them), not from gradients painted on the page.

## 2. Palette

House tokens, reused verbatim from `src/styles/global.css` `:root`:

- darks: `--bg-0 #0b0a09` (bakelite, the page), `--bg-1 #14110f`, `--bg-2 #1d1916`, `--bg-3 #2a2420`
- inks: `--fg #efe9df` (parchment), `--fg-dim #8a8275`, `--fg-faint #827c74` (AA on bg-0/bg-1)
- brass: `--brass #c9a35c`, `--brass-bright #e8c878`, `--brass-dark #8c6f3a` (3-stop rule: dark, brass, bright)
- chrome: `--chrome #d8d4cc`, `--chrome-dark #76726a`
- oxide: `--oxide #8b3a1f`, `--oxide-deep #5a2410`, `--oxide-text #d4622a` (AA text oxide)
- race-red: `--redline #c8331f`. ONE hero element per page: the `.hh-redline` sweep on `/`, the
  RevLimiter wordmark on product pages. Never on a second element.
- `--emerald #2f6b4a` for "armed / live" pilot lights only.

Additive, page-local: the home TV's channels (`WordWall.astro`): one hue + saturation per plugin
(`--ww-ch-<slug>-h` / `-s`, §4); the type on the screen is that hue's phosphor. Nowhere else on the house pages.

Forbidden: pure `#000` / `#fff` outside `html.hc`; yellow speculars on red; race-red on buttons;
neon or glow without a lamp (a lit CRT IS a lamp: the TV's phosphor type may glow); the retired tach arc that hue-shifted toward the redline with scroll depth
(out in `c3fc068`, stays out). The smoke it sat on came back on its own (`src/lib/haze.ts`, §5).

## 3. Typography

- Display: `--font-display` Bebas Neue (fallback Oswald, Arial Narrow). Headlines are stamped
  into the wall: `text-shadow: var(--engrave)` on the garage wall, `--engrave-fine` for small caps.
- Body: `--font-body` Inter. Readouts and specs: `--font-mono`, in object units (dB, ms, `$`, `VST3 · AU`).
- Script accent: Yellowtail (retro car-badge script), `--brass-bright` with a soft amber glow, for ONE short
  line under a section title, never body copy. First use: the /gas "Hear it" line "Hit play. Give it gas."
  (2026-10-19, picked over a marker and a typewriter look: "shorter and sexier").
  Second use: the GAS 2 page's "Fill it up." as a signature under the hero button (§7), tilted -6deg,
  offset right. Still ONE script line per screen. A nameplate ON a prop is not a line: the GAS 2 radio's grille
  badge "Play me" (Dan 2026-10-24, picked with this rule flagged, "like a Marshall"): embroidered IN the radio photo
  itself, fine satin stitch sunk into the weave, rising to the right, click = play, no hover move. Dan 2026-10-26: CSS / SVG
  stitches "look like CSS"; texture on a photographed prop is baked into the photo asset, never drawn over it.
- **A product name wears its plugin's own header lockup (Dan 2026-10-23).** The title on a product page is
  set in the face, colour split and rule of the plugin's own header, lifted from the plugin's render code,
  never the house Bebas: GAS 2 = the pump globe's GAS2 (Oswald 700, set tight, the 2 in oxide, an oxide
  rule under it; GAS2 repo `bench/pump-render.js` texGlobeLens), turned light-on-dark on a dark photo
  (GAS in parchment `#efe3c6`, the 2 and the rule `#b8341e`; the rule sits ~.13em under the letters (Dan
  2026-10-23, by eye: 2.5 px touching -> 29 px too much -> 20 px), never touching them). Why: the page and the plugin read as the same
  object; the site's display face made the name generic.
- Painted copy erodes with wear: stencil type on the wall is outlined brass that fills on hover;
  the filled one is `--oxide-text`, never race-red (Law 5 + one-hero rule). On the TV the same
  stencil is outlined in the channel's phosphor; the lit plugin's name is filled.
- Kickers (`.hh-tag`, `.sk-tag`, `.ww-tag`): mono, letter-spaced 0.3em, `--brass`.

## 4. Components

- Cart drawer (2026-09-22 local review): the parts counter, warm dark steel with cream text and brass details. Real catalog thumbnail, readable product name, one-licence/digital-download metadata, formats and aligned price. Subtotal explicitly says USD, with tax deferred to payment. One compact brass key says “Continue to payment”; live text and a full-surface hit target replace the large red image panel. Header and support stay visible while the body scrolls on short screens. Native dialog, consent reader and existing provider handoff remain. Empty state returns to the store. No new licence/update/refund promises.
- Hero gauge medallion: face PNG (static, lit), needle (rotates; the light never rotates), hub (static).
  Needle: -135° min, -90° idle, +90° redline, +135° max; scroll revs it; pointer micro-deflects.
- Garage wall (`GarageWall.astro`): `wall-wood.png` tile 512px, brass rail `wall-rail.png` top +
  bottom (`--rail-h` 30px, 22px at 480px and below), rail cast shadow, `data-drift-y` 24px parallax
  on the wood, warm top light + 38% scrim. Same wall as the product pages' `.garage-wall`.
- Review picker (`/review`, Yoni 2026-11-03): four small square screens ("cubes"), the plugin's picture whole
  + its name only. NOT the home TV (Yoni: "too much like the actual store ... still it's a different page"; the
  TV in review mode was built, then dropped the same day). Kept from the TV: each plugin's channel colour (the TV's
  hue / saturation numbers) fades up on hover, a one-shot glitch as it tunes in (picture jump + tear, glass
  flicker, the hum bar rolls), the picked one stays lit with its name filled. Radio Roulette's picture =
  `radioroulette-hero-cut.png`, cut along its chrome (fitted superellipse corners; Yoni: "crop it precisely").
- Plugin TV (`WordWall.astro`, `#plugins`; branch feat/home-library, built 2026-10-18; the user: switching
  between the plugins lives in the TV, only there, only on home). One broken CRT set on the garage wall
  (Dan 2026-10-14: "every plugin on the TV, only the screen changes, like changing channels"). The
  carousel and the Store nav item went. On the screen, the set's own menu and a channel guide:
  - Menu (`.ww-osd`), a channel guide (the user's bench pick of 2026-11-01, option C of three; asked
    for "more visible ... the user should understand exactly what to do there", bigger and bolder, in the
    brand, after the GAS 2 and DRIFT pages): the ask "PICK A CATEGORY ▸" in big Bebas (the ▸ blinks like
    a set's cursor, four times as the tube lights, then holds; steady under reduced motion), then the categories (`src/data/library.ts`: ALL first,
    then every category a plugin on the TV sits in; an empty one is hidden) as big Bebas words, short
    labels everywhere (the full name stays the key's aria-label), each with how many plugins it holds as
    a small superscript, the picked one in inverse video (a lit key, dark type). Buttons and the ask show
    only once the script runs; without it the title is a plain PLUGINS (the heading keeps "Plugins" for a
    screen reader either way). One row on every laptop from 1141 (smaller there), wrapping on phones.
  - List (left, `--ww-list-share` 46 % of the screen): one row per plugin = a window thumbnail
    (`--ww-thumb-w` 9.8rem, 6 on phones; less on a short laptop: it fits the room's height for four
    rows as the names do). The thumbnail shows the WHOLE plugin, never cropped or letterboxed (Dan
    2026-11-03: Radio Roulette was cut, GAS had black bars): a wide window fills the slot's width, a tall one
    its height, on the bare glass, the plates clipped to their own bezel arcs. Hover (laptop) must SHOW: the
    picture comes forward with a hot edge, the name glows with a faint fill, short of lit. The content
    clears the bezel on every side by a breath (`--ww-breath-x`); on phones the menu sits at the top and the
    rows space out over the glass, one slot per plugin (Dan 2026-11-03: no bare glass over the menu).
    A FLOATING plugin (design-language §3b; GAS 2) plays on the TV as it opens in a session: the object
    alone, cut on its outline, its hose faded, the house shadow baked under it, nothing rectangular round
    it in the list or the window (Dan 2026-11-04: "gas2 to actually be hovering like in the real plugin").
    The picture is shot from the plugin's own page (`WINDOWS[slug].float` in WordWall.astro).
    The name in the stencil the five words used to be (Bebas, outlined in the
    channel's phosphor, `--ww-dim` 1 = the unlit ones at full strength, the lit one filled + glowing) and
    a plain type word ("one-knob saturator"). All names share one size: min(`--ww-name-max` 5.5rem, what
    the column fits, what the room's height fits for four rows). Values: the user's bench pick of
    2026-11-01. The rows are real links to the product
    pages (crawlable; no JS = a plain list); the script makes them tabs (arrows / Home / End light and
    move, a modified click still opens the page).
  - The lit plugin (right; every panel in one grid cell, so a swap never moves the page): its window
    (DRIFT's is the live run: it plays only while lit and on screen, never under reduced motion), the
    name + type word, the blurb, the five words as one line (the hot word lit; a line breaks between
    words, never before a dot), the price (`$49` / `$19` / `Free` / `Free beta`), ONE key
    "Try free for 30 days" (the sign-up on the screen below, with the licence-worker id; GAS "Free download"
    the same; DRIFT's "Try the free beta" too, `/drift#try` without JS) and a "Product page ->" key. On the screen both keys are
    light on the glass, inverse video like the lit ALL key (the user's pick 2026-11-04, option A of three on
    `/__wwkeys`: the Try key "is not fitting the LCD screen, I want it to feel like it's part of the LCD
    screen"): Try = a block of the channel's phosphor with dark words, two lines; Product page = a phosphor
    outline; no plate, depth or lift. That replaces D9 on the TV only; off the screen (high contrast, or
    `WALL_BG = 'wood'`) they
    stay the button family (D9, the user 2026-11-01): Try = brass (honey when free), Product page = small ghost. GAS's tall panel
    stands beside its text (at least `--ww-side-min` 16rem wide, 17 on a small laptop). No Add to cart on
    home: buying stays on the product page.
    - Reading (the user's bench pick of 2026-11-01, option A of three; asked for "sexier and much more
      comfortable to understand"): bigger and bolder, still the house faces. The name in Bebas up to
      2.7rem; the type word and the five words in Oswald 600; the blurb in Inter 500 at
      1.1rem, tinted with the channel (`hsl(ch-h 30% 92%)`); the price 2.15rem.
      Bigger type takes height from the window (it takes what the text leaves): on a tight screen (a
      small laptop to 1200 wide, a phone under 760 tall) the text keeps its look at about its old size,
      and the small laptop keeps the price row on one line (wrapped, DRIFT's window went 195 -> 54 px
      tall). The two mono readings (Share Tech Mono, VT323) read more like a screen but less easily.
    - Try, on the screen (Phase 5 step 3; the user's pick 2026-11-08, look A "Channel page" of three on
      `/__wwsignup`, over B a set-up menu over the dimmed picture and C a typed prompt): with the script, Try
      never opens a pop-up or leaves the TV. The lit plugin's pane turns into its sign-up the way a channel
      changes (the window and the reading step off, the form comes on in reading order, the --ww-mv-* times):
      TRY <NAME> FREE (GAS / GAS 2 "<NAME>: FREE DOWNLOAD", DRIFT "TRY THE DRIFT FREE BETA") with ‹ BACK
      (and Esc) on its row, the deal line, the paid trial's 30-day line, YOUR EMAIL in a phosphor outline,
      the terms box (required, D6; Terms & Conditions + Licence terms outside its label), the newsletter box
      (optional on a trial, required on a free download, the worker's exact words), Send my link (the lit
      Try key's inverse video; the button family off the screen), the notice + Privacy. Then "Check your
      inbox", Sent to <address>, on a touch screen "Open it on your Mac or PC to install.", Resend ·
      Wrong email? (P01). The screen's two faces only (Bebas, Inter); each refusal at its field in one red
      the channels never take (hsl 352 100% 76%), the focus on the first. While it is open: no glitch at
      all, no pop-up, no snap, DRIFT's run paused; another channel puts the plugin back. A plugin verified
      in the last 24 h still gets TrialGateModal's Mac / Windows keys (until step 4 puts them on the
      screen). No JS: Try keeps the pop-up / DRIFT's link. Forced colours: the real checkboxes.
  - Channels (Dan's pick: each plugin its own screen colour): one hue + saturation per plugin on `.ww`
    (`--ww-ch-<slug>-h` / `-s`): RevLimiter amber 26 / 78 (kept above ~20 so it never reads as
    race-red), GAS brass gold 46 / 62, Radio Roulette warm dial-glass cream 38 / 28, DRIFT violet
    280 / 70 (its screen glow stays /drift's tube). The lit plugin is `data-ww-on` on `.ww`: the screen
    glow, the menu and the list take its phosphor; each panel keeps its own, so a fading panel keeps its
    colour. A plugin with no channel plays in neutral cream. `hsl(... / a)`, not color-mix (older Safari).
  - Channel change: motion only (the user 2026-10-18: "no noise at all, just motion ... each plugin's
    entrance stylized, elegant and smooth"; plan Phase 4d; the analog static it replaces is gone), then
    smaller, shorter and one way (the user 2026-10-19 on the bench: TUNE's picture "appears, then
    slides" and "a different direction for each plugin" felt odd; GEAR CHANGE, each plugin along its own
    object's axis and solid before it travelled, went). Never two plugins on the glass: the one on it
    leaves first (inert from the click, the row lit at once), then the next comes on.
    - One way, always: `--ww-mv-dir` 1 = everything rises into place (the default), -1 = it comes down
      into place (the crane's door; the bench's RISE / DROP). Never from the list's order, a key or a
      category: a direction that changes with the pick reads as random.
    - The leaver drifts `--ww-mv-out-px` 4 the way the motion runs as it fades in `--ww-mv-out-ms` 120.
      The newcomer comes from `--ww-mv-px` 24 the other side, fading and travelling as ONE tween
      (`--ww-mv-in-ms` 560, power3.out; the user's bench pick of 2026-11-01, was 12 / 340), so it is solid only once it is in place: a fade quicker than
      its travel (TUNE's 180 vs 600ms) read as a solid picture sliding. `room()` caps the travel so the
      picture stays on the glass.
    - The text follows in reading order (name, blurb, words, price row), the same way and on the same
      curve: `--ww-mv-text-px` 6 in `--ww-mv-text-ms` 340, `--ww-mv-text-gap-ms` 20 apart, from
      `--ww-mv-text-at-ms` 40. About 0.55s from the click to everything at rest (TUNE was 0.87s),
      readable at ~0.3s. The exit and the stagger are quicker than the house 300 / 90ms on purpose (a
      300ms ease-in hardly moves for 100ms; 90ms x 4 would seat the Try key past a second) and stay
      local to the TV.
    - The screen's colour changes as the newcomer comes on (in `--ww-mv-in-ms`), the old glow
      cross-fading over the new (two layers: a gradient can't transition and a hue must not
      interpolate, 280 -> 26 runs through green); the tube dims to `--ww-mv-glow-dip` .92 while the
      glass is empty (.85 read as a flicker once the exit got quicker). The colour never jumps: a
      plugin sent back while its colour is still coming in takes it to the nearer of the two colours as
      it goes (the old one when it had barely started; on a phone's Back the new one, which stays lit),
      so the next change starts from one colour and the colour moves as little as it can.
    - The last pick wins, from wherever things are: the leaver picked again comes back; a pick while one
      comes on sends that one out. Picks under 120ms apart, or a held arrow, keep the glass dark until
      they stop, and only the last comes on; `?plugin=` is written then, once. Only the pictures and the
      text blocks move (never `.ww-ui`, the first window's reveal, nor `.ww-try`, its hover), transform +
      opacity only, cleared at rest so the window lands crisp. Every window is decoded after the
      power-on (laptops), and an entrance waits up to 150ms for its own. DRIFT's run pauses as it
      leaves, rewinds, and plays once seated. Reduced motion: a quick fade (80 / 120ms). High contrast,
      the wood (its own fade), a hidden tab or the wall off screen: a cut. Phones: a tap slides the list
      out left and the pane in from the right (`--ww-mv-pane-px` 16, the list's exit `--ww-mv-pane-ms`
      200, the pane's entrance on the text's times); the pane's Back key runs it backwards; the
      browser's own Back cuts (an iOS swipe already animates).
    No channel number (Dan: no). A category change re-strikes the rows that stay, 60ms apart.
  - Power-on: the first time the TV comes into view the tube opens from a bright line (a CRT turn-on,
    700ms) and the pilot LED lights with it. JS arms it, so no JS / reduced motion = lit at rest.
  - Glitches (the user 2026-10-19: "a small glitch now and then, on certain elements, at random, to show
    it's alive", then "also during the channel change"; design-language §3's exception): the old set's own
    small faults, one at a time, a random `--ww-gl-min-s` 12 to `--ww-gl-max-s` 25 s apart, and only once
    the TV has been left alone for `--ww-gl-idle-s` 4 s (no pointer, finger, key or wheel on it); touching
    it stops one at once. What is on show decides: a phone's list = a name or the screen, its plugin = the
    picture or the screen.
    - A name: an unlit one jumps `--ww-gl-px` 3 px sideways and back in three steps, a red then a cyan
      fringe (the house split #ff0033 / #00e5ff of DRIFT's creators, far smaller), `--ww-gl-ms` 150.
    - The picture: a band or two of it tears sideways, tinted, in three or four steps. A canvas laid
      exactly over the picture copies its own pixels (DRIFT's run too), so the picture itself never moves;
      the canvas is emptied and unsized after. A picture with nothing to copy yet (the run before its first
      frame) jolts whole instead.
    - The screen: one 6 % dip of the light (on the glass's light layer), or a soft band of light
      (`--ww-gl-roll-light` .1) rolling down the glass in `--ww-gl-roll-ms` 900, under the text like the
      lines (a CRT's hum bar; .06 did not show).
    - A channel change lands with a short tear about one time in three (`--ww-gl-chg-chance` .33), only
      once its picture is in place and the tube is lit: the change's motion never changes, and the next
      pick stops it. The first light is not a change (a cold `?plugin=` cuts, never tears).
    - The reading, rarely (Dan 2026-11-01, Phase 5: "the reading should glitch too", over the test
      visitors' "name only"): the lit name (the panel's, and the lit row's on a laptop) or the blurb jumps
      like a name, `--ww-gl-read-chance` .25 of the picks, and only once the plugin has been on the glass
      `--ww-gl-read-after-s` 20 s; never with the pointer on or the focus in its panel.
    - Never on the menu, the five words, the price, the keys, the links or a form, never on what the
      pointer is on or the focus is in. Stepped (`steps(1, end)`), `translate` + `filter` only
      (never transform or opacity: the motion's), nothing left behind. No noise, no snow. Off under
      reduced motion, high contrast, forced colours (Windows High Contrast), the wood wall, a hidden tab, the TV off screen and before the
      power-on, and the wait starts over once the TV is on show again: a visitor who glides in from the
      top (the PLUGINS chip) gets a full 12-25 s before the first, never one as the tube lights (it used to
      come any time 0-25 s after). The times are read when they come due, so the bench's sliders take
      within 2 s.
  - URL: `?cat=` = one history entry per category, `?plugin=` updates the current one, so a reload or a
    return from a product page lands on the same channel. The rest of the address is kept (utm / gclid
    for the cart; the trial gate's `#dl=...&p=` return link, which is why the TV never uses `p`).
  - Phones + small tablets (<= 860px): one pane at a time. The menu, then full-width rows (thumbnail,
    name, type word, the price on the right); a tap opens the lit plugin as its own view (a history
    entry, a "‹ All plugins" key); Back returns to the list with the focus on its row.
  - `WALL_BG` (built 'screen' | 'wood'): /drift's digital screen (the keep-it TV's phosphor tube) full
    bleed behind the content: the scanlines + grille ON the glass (`.ww-screen::after`), UNDER the text and
    the pictures; only the glass's smooth light (reflection, room light, curvature) lies over everything
    (glow `--ww-scr-bright` 1.37, scanlines `--ww-scr-scan` .2). The glow is the user's bench pick of
    2026-10-18 (`/__wwbench`); the scanlines, list share, name size and thumbnail width of 2026-11-01. 2026-10-19 the user:
    the reading suffered "because of the pixels". Over everything, a 1 px line every 3 px crossed every
    letter and the Try key; on a phone (3 device px per CSS px) each line was a band. The text and the
    plugin's picture are clean now (the user's pick over keeping the lines on the pictures); the empty glass
    keeps the lines (.2 since 2026-11-01). `.ww-screen`, `.ww-screen-fx` and `.ww-frame` live on
    `.ww`, outside the panels. 'wood' = the garage wall, brass type.
  - `WALL_FRAME` (built '2' | '1' | '3' | 'rails'): a beat-up CRT cabinet front 9-sliced round the
    screen in place of the brass rails (`tv-broken-1/2/3.png`, AI blank rolls; cracked corner with a
    worn checker, gaffer tape, a missing screw, a chunk broken off, all in the corners). The long runs
    TILE (`round`): stretched 3-4x they streak. `--ww-frame-u` = CSS px per cut pixel (bench "Frame
    size"), capped by the wall's real side gutter minus the wood gap, so the side bezel never covers the
    menu, a name or the window (~0.25 at 1141-1280, more on wide screens, ~0.065 on phones). Anchored to
    the content box, not 100vw (a classic scrollbar would eat the right bezel). Colourless charcoal
    (Dan: "more neutral, fewer colours"): only the screen changes per channel. One brand mark stays:
    the worn checker paint on the top-left corner is burnt RevAudio yellow, the house brass hue (Dan:
    "replace the purple with a burnt yellow, like RevAudio's colour"), the same on every channel. The
    cut script recolours it; it is not a plugin colour. The house pilot light (`--emerald`, "armed /
    live") in the chin, dark until the TV powers on. 'rails' = the brass rails.
  - One screen (Dan 2026-10-14: "when I scroll, the site fits the screen exactly, not past the edges top
    and bottom"): the TV section is `100svh - --site-nav-h` tall (min-height, behind `@supports (height:
    100svh)`), `.ww` pads from the rails to the opening + `--ww-breath` (15px), and the content is sized
    to the glass (`--ww-room`): the names as above; each window width-capped by its aspect (`--ww-ar`)
    to the height its panel's text leaves (`--ww-info-h`, with the menu's `--ww-osd-h`: the script
    measures both, the CSS values are the no-JS estimates); GAS height-capped. Measured 2026-10-18: it
    fits from 1141x636 to 1728x992 and on 390x664 / 360x640 phones; at 1280x665 the window is ~460px
    wide; on a 360x640 phone GAS's panel is ~150px tall. The scroll lock lands it: armed only by the
    visitor's wheel, a moved finger or scroll keys, it fires once scrolling is idle and no finger is
    down, if the TV fits and its top stopped within `--ww-snap-zone` % (30) of the screen; Lenis glides
    it under the nav (0.55s, easeOutQuart) and never pulls back against the visitor. No lock under
    reduced motion (no Lenis). iOS: with Safari's bars hidden a strip of the next section shows under
    the TV (svh, chosen over a TV that resizes mid-scroll).
  - The way in (phase 3, 2026-10-18): the header's PLUGINS, the one lit nav item (the brass chip Store
    had; outside the link list, so on phones it stays on the bar beside the menu button as a 44px chip)
    and every other `/#plugins` link: the footer's Plugins, the cart's "Explore the plugins", the closing
    CTA, the product pages' "<- All plugins"; `/store` redirects here (a bare page: script first, so the
    query string reaches the cart; meta refresh without JS; noindex + canonical). On home the links
    glide to the TV (0.7s, Lenis; a jump under reduced motion) instead of loading the page; from another
    page the browser's own jump lands it. Both park it where the lock does: a whole pixel, rounded up,
    so the TV's top edge tucks under the nav by less than a pixel and no strip of the page above ever
    shows. `#plugins`' scroll-margin-top takes back global.css's anchor padding (`--nav-h` + 0.75rem)
    and adds the real bar (`--site-nav-h`, 41px laptop / 58px phone). Focus moves to the TV's PLUGINS
    heading; a phone's open plugin goes back to the list. Measured (Chromium + WebKit, 1280 + 390, every
    way in, reduced motion too): the TV's top 0.2-0.3px under the nav line.
  - Bench `/__wwbench` (`tools/wwbench`, dev only: the real homepage at laptop + phone size): WOOD /
    SCREEN, RAILS / BROKEN TV 1-3, RISE / DROP (the motion's one way), REPLAY (the power-on), the
    categories and plugins as buttons, the phone's pane, ▶ CHANNEL / SLOW ×4 (every motion and glitch
    time) / AUTO, ▶ NAME / PICTURE / SCREEN (one glitch now; SCREEN: a flicker, then a roll on the next
    press); sliders: list width, biggest name, thumbnail, unlit names (laptop), screen glow + scanlines, the
    channel colours, the motion's times and distances (picture, exit, text, glow dip, phone), the glitches
    (how often, left alone for, jump, times, roll light, chance on a change), frame size + wood around the
    TV, breathing room + lock zone. COPY SETTINGS; "apply ww bench" bakes the values.
    The phone frame is drawn at the laptop's 1x: a texture is checked at 3x (a real phone, or a 3x shot)
    before it is baked. The scanlines picked against it were a third as thick as a phone shows them.
  - Keyboard + screen reader: the list is a vertical tablist (aria-selected, roving tabindex), each
    panel a tabpanel; a category change is announced (a polite live region). `html.hc`: no screen or
    frame; plain type, the lit name in oxide.
- Trial CTA / buy: the button family's large brass with the shine at the page end on `/`; the crane door on product pages.
- **Buttons (Dan 2026-10-18): one family, `src/styles/buttons.css` (`.rv-btn`), tuned on `/buttonlab`.** The grammar
  of the /gas button: one warm fill with dark ink words, no outline, a lit top edge and a soft darker bottom edge,
  a 1px lip, the contact shadow plus a long low ambient one, sentence case, Inter 700, 4px grid. Hover lifts 1px
  (mouse only); press drops 1px with a shorter shadow, 80ms in / 160ms out, held >= 120ms (`src/lib/press.ts`).
  Tones: **brass** = trial / buy, **honey** = a free download (GAS), **ghost** = the second choice (dark steel,
  thin brass line). Sizes 64 / 56 / 48 / 40. The **shine** (a faint lamp band every 8s) only on the page's ONE
  main action. Every regular action button uses it (the home TV's keys only off the screen: on it they are
  light on the glass, the user 2026-11-04, §4 TV); a
  new one opts in by class, never restyles a copy. Stays out:
  the crane door + BUY NOW squares, the audio toys (demo rack, GAS pedal, station mixer), DRIFT's own world,
  image-plate buttons (SubscribeModal, /beta), the support chat, icon buttons (×, menu, cart, arrows, dots),
  the GAS 2 page's ticket stub (next item). /gas keeps its own copy of the honey CTA (its bench is `/gasctalab`).
- **A paper form speaks paper (the GAS 2 page's service ticket, Dan 2026-10-23: fewer fonts, and the button in
  "the same language as the note"; approved: "commit and push").** Two faces only: Bebas for what the station
  printed (title, stub label, SENT stamp), the typewriter Elite for what got typed (rows, labels, input, fine
  print, ×); no Inter on paper. The submit is the ticket's own tear-off stub, not a house button: a perforation
  with a scissors mark, a punched hole at each end, the honey "customer copy" (honey = a free download) with the
  ticket's zigzag edge. Hover = it starts to peel and the scissors slide along the line; submit = it tears off
  and drops, then the SENT stamp lands in rubber-stamp ink.
- DAW strip, EmailCapture, SubscribeModal, TrialGateModal: unchanged house parts. (The coverflow
  showcase left the home page with feat/home-library: the TV is the one place to browse. It stays only on
  `/downloads`, as that page's picker, `mode="downloads"`.)
- Support chat (`SupportChat.astro`, `/support` only): chat-app thread grammar in house materials —
  visitor right in 3-stop brass, Support left on dark steel with avatar + curved tail on a group's
  last bubble, time stamp inside the bubble, bakelite wallpaper with a brushed diagonal. Answers use
  a fixed grammar (also the worker's reply contract): key words **bold `--oxide-text`**, no wash
  behind them (Dan, 2026-09-08 — highlight was tried and cut); one step per line with a stamped
  badge; paths on engraved mono plates with a copy rivet; `[mac]`/`[win]` blocks shown for the
  visitor's OS with a flip chip; `!` hazard-stripe callout (oxide) and `+` pilot-lamp callout
  (emerald). Key words lamp once as the bubble lands, then settle. Bench: `bench/support-answers-bench.html`.

## 5. Depth & lighting

One light source, upper-left (~35% 25%). On the wall: a warm top light `rgba(255,214,150,.07)` to 0
over the first 32% of height, plus a 38% `--bg-0` scrim so parchment ink passes AA on the wood.
Shadow stack (all raised parts): `0 1px 0 #000` contact + `0 8-24px 24-48px rgba(0,0,0,.5-.6)`.
Hover: lift 1px + shadow grows; press: return, 2px max travel.

Paper ON glass (the GAS 2 page's window notes, Dan 2026-10-22: "the notes are hovering, I want them to
feel like they're on the glass"): no drop shadow (paper taped to a window throws none you can see from
outside), only a paper edge and a curl shade at the loose corners; the paper takes the scene's grade like
every other prop; the glass sheen lies OVER the paper; the tape is translucent. A drop shadow on anything
flat against a surface reads as floating.

Posters IN the window (the GAS 2 page, Dan 2026-10-23, the notes became three 1950s gas posters: "smaller,
fit the window better ... like it's stuck to the window, part of the picture, no need for tape", then "too
blurred"): pasted flat inside the pane, so no tape, no shadow, near-square to the frame (≤ 0.4°); sized
inside the measured pane glass with a margin, never touching the frame; they take the room's light (warm
top, falling off to the sill) and a light glass sheen, and stay sharp: a blur reads as a bad photo, not
depth. Poster copy = one short catchphrase per feature, period ad-speak (NO KNOCK. NO KNOB.).

Poster ON the wall (the GAS 2 page's mailbox, Dan 2026-10-23: "just the reading need to be a poster that
catches the eye"): a CTA's paper label becomes a 1950s poster pasted on the stucco right above its prop, a
big arrow pointing into it. Outside the glass it keeps full ink (no sheen, no fade): the wall's texture shows
through faintly and the porch lamp lights it from its side. Poster and prop are one control: both open the
same form, and hovering the poster moves the prop.

Painted wall sign (the GAS 2 page's grades, Dan 2026-10-23: "remove that line under premium"): the picked
grade shows by its brighter red only, no underline. Paint on a wall has no web-link underline.

Making one object pop (the GAS 2 pump, Dan 2026-10-23: "tone down all ... this needs to be subtle", then
"just keep the light on the GAS 2 itself"): light the object only, from its own motivated lamp (a soft
warm top-down light masked to its cut-out + ~4% brightness); no light cone, no floor pool, no darkening
of the rest of the scene. Start subtle and let Dan raise it.

The smoke: two screen-blended haze plates (`public/bg/haze1.webp`, `haze2.webp`) on a fixed layer
behind the page at 16% / 10% under a 40% `--bg-0` veil (25% on phones), so the dust in the lamp light
reads through the hero and the translucent footer; solid section panels cover it. Off in `html.hc`.

## 6. Motion

Canon = the crane door (`BuyButtonCrane.astro`): physics, feedback only, in the page. Curves
`--ease-settle cubic-bezier(.22,1,.36,1)` entries 600ms, `--ease-exit` 300ms, stagger 90ms; hover
strikes ~120ms `cubic-bezier(.2,.9,.25,1.25)`. Scroll: needle revs; wood drifts 24px; reveals via
`data-reveal` (top 80%) with a 2.5s force-reveal. The smoke drifts on a slow sine (40/25px and
55/30px orbits), kicks up to 3.5x on a fast scroll and settles, leans up to 14px with the pointer
(desktop only). The plugin TV: the CRT power-on once, a ~120ms hover strike on the names, a channel
change by motion alone (the old plugin off the glass, then the new one on, always the same way, fade and
travel as one, ~0.55s: §4), the rows re-striking on a category change, a small glitch of its own now and
then (a name, the picture or the screen, every 12-25 s when left alone: §4). Reduced motion: everything visible at rest, no parallax, no needle rev, smoke static, no glitches.

No UI chrome drawn over a scene (the GAS 2 page, Dan 2026-10-23, on the first-visit gold frames that
flashed around every live prop: "what is this square line around the elements, remove it"): a prop shows
it's alive by itself (its own hover, its poster, its caption), never by a web outline around the photo.
The one frame allowed is the keyboard focus ring.

Printed things stay glued (the GAS 2 phone page's postcards, Dan 2026-10-30: "the readings should be glued to the
card itself ... physics-wise"): on a physical object (a card, a poster, a label) the print never moves on its own:
no pops, slides or write-ons as it comes up, no turning sunburst, no flickering lamp in a photo. Motion belongs to the
object (a flick, a curling corner, a sticker's lifting edge), to a real mechanism (a turntable), or to light (a glint).

Let-go motion keeps the finger's speed (the postcards, Dan 2026-10-30: "everything that moves needs to be smooth"): a
thrown or released object leaves at the speed the finger had, never a jump or a stop (a CSS animation takes a frame or
two to start: drive a let-go frame by frame from that speed, springs not fixed curves); nothing that moves changes scale
(a scale change repaints the layer); a held object's deeper shadow fades in on its own layer; heavy work (decoding,
drawing a canvas) waits for a still hand and runs a few ms a frame. Measure on a 4x-slowed CPU: no frame over 33 ms.

A button that turns over to a new job turns hard and fast (the GAS 2 phone page's taxi, Dan 2026-11-01: "I want it to
flip harder faster"): about 0.4 s, a deep turn that lands with a punch and the house snap curve. And it keeps its size
and place whatever the new label says (same day: "To the store" the same size as "Download FREE").

## 7. Hero + glanceability

THE first screen is the plugin TV (2026-11-02, the user's call: the gauge medallion with "Engineered,
Then Tuned." and the closing "Hear it on your own mix" trial section were the old site and came out).
The TV sits right under the nav and fills one screen; the page's h1 is visually hidden. No hero above
it, no metric grid, no card grid.

**Product-page hero = "the readings" (canon: the GAS 2 page, composition 2; Dan 2026-10-23: "I love you
so much", "this is amazing"; `tools/_gas2-scene/page-b.html` on `feat/gas2-page`).** The vibe to repeat:
- **Fill the open space.** One centred column sized to the scene's empty area (GAS 2: the dusk sky right
  of the canopy, 31 % of the scene wide), everything BIG; no small left-aligned text block floating in it.
  No scrim shape behind the column (the radial circle was rejected 2026-10-23: "not a regular circle ... a premium
  shadow"). The shadow HUGS THE WORDS: per letter a contact shadow, an even close halo and a short soft drop
  (CSS drop-shadow on the title, the line and the script); the general shadow stays faint (the sky behind the
  column a touch out of focus and ~15 % down, feathered with no edge; the frame edges ~5-8 % darker). Every
  layer fades out on all sides: a gradient band that starts at a hard element edge reads as a cut (Dan,
  same day). Approved: "really cool, I like it".
- **Four parts, top to bottom, nothing else:** the name in the plugin's header lockup (§3), huge
  (13.5 cqw); ONE outcome line in Bebas, honey `#f6c85d`, letter-spaced .05em ("THICKER, SMOOTHER, GLUED
  MASTER."); the house honey button, large, with the shine, "⤓ Download FREE" (FREE in caps on a free
  product; the label in the title's own face, Oswald 700, case exactly as written: Dan 2026-10-23,
  the one exception to the family's Inter label); the Yellowtail signature line under it ("Fill it up.").
- **Copy: punchy and minimal.** No tagline when the signature carries it, no spec line, no FREE tag (the
  button says it), no claim that needs a footnote (no "one dial" when there are three controls).
- Tuned at Dan's Safari 1141x636 and checked at 1440x900 / 1920x953: the column stays in the open sky.
- **After the download (the GAS 2 page's taxi, Dan 2026-10-31: "make this button turn around, become red, bold, reading
  To the store").** When the cab pulls up, the honey button turns over (a quarter turn out, a quarter turn back, ~0.7 s)
  and comes back red, bold, "To the store": the GAS 2 red of the 2 and its rule (#b8341e), the house button's own
  lighting, the label in the title's face. It sends the waiting cab. The one red button in the house, by Dan's word: the
  "no race-red on buttons" rule (§2) stands everywhere else. The cab's roof sign says just TAXI.

**A product page on a phone is rebuilt for portrait, never a crop of the desktop scene (the GAS 2 page, Dan
2026-10-24).** Three ways of showing the wide station photo on a phone (a sideways swipe, a scroll-driven camera,
stacked crops) "don't work for me"; the zoom-in on the plugin itself did ("very cool, I like the direction"). The
recipe (`tools/_gas2-scene/phone.html`): the plugin's own render re-baked sharp for the zoom (its parts in the
plugin's base px, its layer order), the globe as the name, the readings under the gauge, the station only as a soft
backdrop. ONE screen, no scroll (Dan, same day: "under the Fill it up remove all the page, keep one page, no scroll"):
the pump + the four readings centred as one group, the zoom easing off on short screens so nothing is cut; the button
opens the service ticket; no player, posters or mailbox on phones. Then one more screen (Dan 2026-10-26, "how simple the plugin
is, three modes, a short line for each", A picked over B): THREE GRADES. PICK ONE. as three rows, the pump's own grade key +
a Bebas honey headline + one Inter line, all readable at once (B, the key bank with one line that changes on tap, hid two of
the three lines).
Why: a portrait phone shows a third of a 3:2 scene, the photo goes soft, and the props turn into hunt-the-hotspot.

## 8. Layout

```
+------------------------------------------------------+
| HERO  gauge medallion + 2-line headline               |  ~100svh, vignette
+------------------------------------------------------+
| PLUGINS  the TV (#plugins): menu, list, lit plugin    |  one screen; the broken CRT set
+------------------------------------------------------+
| GOES WITH EVERY VEHICLE  DAW strip                    |  unchanged
| JOIN THE PIT CREW  EmailCapture                       |  unchanged
| HEAR IT ON YOUR OWN MIX  trial CTA                    |  unchanged
+------------------------------------------------------+
```

Base: `--maxw min(1440px, 95vw)`; at 860px and below the TV shows one pane at a time (the list,
then the lit plugin).

Typing on a phone (the GAS 2 postcards, Dan 2026-10-30, on his iPhone: "it's not comfortable like this"): the keyboard
never shrinks the thing you write on. iOS 26 cuts the page to what's above the keys, so a layout sized by the viewport
halves and its px-floored type runs together. Keep the object's size on focus and slide it up until the field, its
options and its button sit just over the keys; the page's own controls step aside until the keyboard goes.

A product page's end on a phone frames the subject, not the desktop's open sky (the GAS 2 postcards, Dan 2026-11-01,
picked from four spots on a bench): a portrait crop can't hold the pump and the sky together, so the station and its
pump go on top and the readings hang under them on the dark ground, their top just under the pump's base at every
screen height. The blur behind the cards is the same spot, so the focus pull lands on it.

A scene page is still a page of the site (the GAS 2 postcards, Dan 2026-11-04, review round 15): the site's top bar never
covers it (the scene starts under the bar's measured height), and the site's real footer is under it on every platform,
reached by scrolling (page-b: under the scene once the drone has landed; the phone: under the end page; the cards
themselves never scroll). Where the cards are is told by six pilot lamps, the top card's lit, not by "n / 6" and arrows:
the flick is the way through, the lamps only say where you are (a tap walks there). A stamp that sends is small enough to
read as one thing to press and inked in full: across the whole card it read as decoration.
A phone page that scrolls scrolls as one page (Dan 2026-11-04, on his iPhone, the footer under the end page: first
"shaking", then still "not smooth"): no footer sliding up over a still scene; the end page goes up and the footer follows
it. Safari folds its toolbar as you scroll, so the screen grows a few px a frame: whatever scrolls keeps the px size it
came up with, or it rescales under the finger.

## 9. Do's & don'ts

- DO keep every claim checkable against the plugin source. The five words describe the intent of
  the tools, in plain adjectives; the blurb comes from PRODUCT.md / CLAUDE.md (each plugin's
  `library` entry in `src/data/plugins.ts`).
- DON'T add a second race-red element, a countdown, a star rating, or a press logo (data files are
  empty by design until real ones exist).
- DON'T absolute-position decorative props to pixel coordinates; wall and rails are flow +
  percentages so every viewport works.
- Astro scoped styles: anything injected at runtime or living in another component needs `:global()`.
- DO make a screen read as the part it is. An LCD does not bloom: crisp segments, every unlit segment faintly there
  (ghost cells), an even backlight, a bezel inside the window. A blurred glow on every letter reads CRT / neon instead.
  /drift #hear's screen = the car-stereo 14-segment LCD (DSEG14, RevTune's face), picked on `bench/drift-lcd-bench.html`
  over a dot-matrix and a reflective LCD (laptop 1 user, 2026-10-19: "design this whole area so it looks like an LCD
  screen"); the PICK A TRACK list beside it stays a CRT, so the two read as two different parts. Approved on the page
  ("looks killer") with the segment letter shapes as they are (D reads like ], V like I/): that is the car-stereo look.
- DO light a "press this next" cue from a real lamp inside the part, never a painted ring lit by nothing. /drift #hear
  step 2 = each arcade cap seated in a small chrome bezel (step 3's metal) and the PLAY cap itself is the lamp: it
  breathes from inside when PLAY is next and burns while playing; STOP = real red plastic, just off, not a filtered
  brown. Picked on `bench/drift-play-bench.html` over LED bars round PLAY (A) and pilot lamps (B) (laptop 1 user,
  2026-10-26: "C").
- DON'T paint arrows at a control to say "press this". Hand-sprayed magenta arrows at PLAY and the DRIFT button (fresh
  paint on the step that is next) were tried on `bench/drift-hear-bench.html` and dropped (laptop 1 user, 2026-10-28:
  "remove the pink arrows"); the lamp-lit breath above stays the only "next" cue. A sprayed ring round DRIFT had already
  gone: on a lamp-lit button it read as the button's own magenta light.
- DO give a level a fader, and give one part one control language. /drift #hear's VOLUME is the page's own #drive fader
  (`DriftFader.astro` look: the plugin's vertical slot, chrome cap, violet fill, so it stays a step behind DRIFT's
  magenta), not a round knob beside the round DRIFT button (laptop 1 user, 2026-10-28: "let's use a fader for volume
  instead of a knob"). It stands on the knob's old centre line, its cap travelling the DRIFT ring's height; the
  VOLUME readout sits on ORIGINAL / DRIFT's line. Tried on `bench/drift-hear-bench.html` (VOLUME KNOB / FADER).
  Then made a real part (the user, same day: "make it like it comes from the same vibe, make it wear out broken and
  3d"): a photographed crash-worn slot plate screwed onto the wall (its own shadow) and a heavy black-and-chrome cap
  worn to bare metal, chipped and cracked, throwing its shadow down-right; the violet light lives inside the cut
  (VOLUME WORN, CAP 1 / 2, PLATE 1 / 2; prompts in `bench/drift-panel/PROMPTS.md`). The cap's travel = the plate's
  cut. Placed as a channel strip ("make it bigger and place somewhere better"): on the deck's right edge line (the
  LCD frame's right edge; PLAY's left edge sits on its left one), as tall as the controls, from the step names' top
  line to the pocket's bottom line (phone: from just under "3 PUSH DRIFT", which runs over its column).
- DO make a push button stand proud: a convex cap that throws its shadow onto what is around it, its legend printed on
  the cap so both travel in together when pressed. /drift #hear's DRIFT push-start had a dark lens sunk in the bezel
  (inset shadow only) and read as a gauge; on `bench/drift-hear-bench.html` (DRIFT BTN CAP) it became a raised cap
  (laptop 1 user, 2026-10-28: "i want it to feel more like a button and polish it").

## 10. History + open questions (for Dan)

- 2026-09-06 garage pass: three photo story rows (car plate, hardware-unit concept render, the
  truck door painted "30 days") were built, reviewed and cut by Dan; only the word wall stays.
  The cut work lives on branch `garage-pass` (commit `7e4b3b6`) if any of it is wanted back.
- 2026-09-06 Dan: "add the vibe of the smoke that we had before": the haze plates from the old
  enginebg layer are back as `src/lib/haze.ts`; the red-shifting arc, embers and waveform are not.
- Stencil words: LOUD / WARM / PUNCHY / GLUED / DEEP. Which one should be the filled (oxide) word?
- 2026-10-14 Dan: the word wall's DRIFT panel looked like every other panel. It got its own looks
  (neon sign / steering springs / both, `DRIFT_LOOK`, built `both`) and the live DRIFT run as its
  window; tuned on `/__wwbench`.
  Same day, Dan: "more of a TV screen" -> first read as the window on /drift's TV; he meant the whole
  background ("everything behind a digital screen"), so the wall became the screen (then DRIFT_BG) and
  the TV window stays a bench option (DRIFT_WIN). Then "the frame in DRIFT's vibe, a broken TV
  frame": the screen sits in a broken CRT cabinet front instead of the rails (then DRIFT_FRAME).
  Then "more neutral, fewer colours", because every plugin should play on the same TV, only the
  screen changing when the carousel moves, like channels: the frame went colourless, the TV moved to
  the whole word wall (WALL_BG / WALL_FRAME), each plugin got its own phosphor colour, and a channel
  change is a short burst of static. So RevLimiter, GAS and Radio Roulette now play on the TV too.
- 2026-10-15 the user (branch feat/home-library, built 2026-10-18): the TV becomes the plugin
  browser. The carousel and the Store nav item go (a PLUGINS button leads to the TV, `/store` redirects
  to it); categories on the screen, ALL first; the plugin names replace the five words on the left, and
  the five words move under the blurb as one line; the lit plugin shows a bigger window, the blurb, the
  price, "Try free" and a small "Product page". DRIFT's neon / steer looks and the TV window
  (DRIFT_LOOK / DRIFT_WIN, `src/lib/wordwallDrift.ts`) went with the words they worked on. Plan:
  `tasks/home-library-plan.md`.
- 2026-10-18 the user, after the reworked static: "no noise at all, just motion"; each plugin's
  entrance stylized, elegant and smooth, no glitches. A UX lens and a brand lens both chose one shared
  sequence with a per-plugin accent and rejected a CRT blink per change (a power cycle, not a channel
  change; a strobe at ten switches; it spends the once-only power-on). They differ only in where an
  entrance comes from: TUNE (the list's direction) vs GEAR CHANGE (each object's own axis). Both are on
  the bench (`WALL_MOTION`) until the user picks; the static is gone (§4).
- 2026-10-19 the user, after the one-motion pass and the scanlines' move: "I want certain elements to glitch
  now and then, at random, a small glitch to show it's alive". Picks: the names, the picture and the whole
  screen; every 12-25 s; only when the TV is left alone. Then "also during the channel change". That lifts
  the 2026-10-18 "no glitches" in one place only: the entrance's motion is unchanged, and the new picture
  locks in with a short tear about one time in three once it is in place (§4). Built as phase 4e;
  design-language §3 gained the exception (a broken object's own faults, small and rare).
