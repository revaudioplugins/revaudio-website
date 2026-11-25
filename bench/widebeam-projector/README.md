# WIDE BEAM: the projector look (Dan's new direction, 2026-11-22)

A rough, clickable look of the new WIDE BEAM page. It is not the site: nothing here is built into `/widebeam` yet, and
the bench folder is outside the Astro build.

The direction, in Dan's words: no player, no music. Three sections:

1. The car film with the email gate from the start.
2. The manual film, full screen on a projector: vintage, educational, our ElevenLabs voice. Gil provides the film.
   When it ends, the film cuts to its own last title card: the Buy card with the email gate, in the film's black and
   white, under the same grain and flicker (Dan, 2026-11-23: no flip, "the card will be the film"). The earlier
   mechanical flips (F1-F3) and the panel hardware are still in the code, switched off.
3. "Understand it": the plugin's face, presented, with the gate again under it.

- **See it:** https://claude.ai/artifact/KLqSaDnV6Y9nb8p1xSQyge (private to Dan, since 2026-11-24; the earlier links
  `6bbysbnKpcaGSKtCZu7hLL` and `4oWMU9NiWGPcZniDsHee3Y` stopped taking updates, not by us). Its Look controls panel switches
  the projector look (P1-P3) and the phase (before launch / on sale), skips to the end or replays the film, and saves
  a pick with a note.
- **Stand-ins:** `standin.mp4` is cut from the car film and stills of the plugin face, and tagged "STAND-IN · Gil's film
  goes here". `standin-voice.mp4` is the take-2 voice from `revaudio-films/widebeam-1950-ad`. Gil's film replaces both.
- **The rest:** `car*.{mp4,jpg}`, `knob-width.webp` and `parts/` are the site's own files (`public/widebeam/`,
  `src/assets/widebeam/`). `face.webp` is the plugin's face. `title.webp` is the plugin's own WIDE BEAM lettering,
  cut from `face.webp` (x 829-2304, y 71-276 crop) and unmixed from the plate's grey, so it sits on any background.
- **Open it locally:** `index.html` is a page fragment (the Artifact tool adds the doctype), so wrap it first.
  Safari only plays the films from a server that answers range requests; `python3 -m http.server` does not.
- **Type:** two faces on the whole page, Bebas Neue (stamped: headlines, keys, prices, labels) and Gelasio (read:
  everything else). The LCD on the plugin's face keeps the plugin's own screen type.
- **Phone (2026-11-24):** the first screen is the whole film behind the glass card; the name sits over the stars and
  the card at the bottom, where the thumb is. The car drives through between them. The manual's frame is as tall as
  its title card; the 16:9 film plays in the middle, with the captions in the band under it and the sound key in the
  band above. The plugin's face runs edge to edge, with its number coins on it.
- **The email gate (2026-11-24, Dan: "much more precise"):**
  - Each card keeps one size in every state.
  - The field and the key have set sizes: 50 px tall on a laptop; on a phone, 44 px each, stacked.
  - One line under them holds a short message that always fits.
  - A bad address marks the field (orange edge; a dashed edge plus ✕ on the black-and-white title card). It says
    what is missing ("An email needs an @.", "Did you mean …@gmail.com?" fills it in with one tap) and clears as
    soon as the visitor types.
  - A good one turns the field and key into "You're on the list" with the address, which keeps its domain, and a
    Change link.
  - Two Opus reviewers tried to break it; their 14 confirmed points are fixed.
- **Sound (2026-11-24):**
  - The voice is on by default.
  - Browsers allow no sound before the visitor's first click, tap or key on the page, so it starts at that first
    touch, anywhere on the page.
  - If the film is already running silent then, it cuts back to its first frame and plays from the top with the
    voice (Dan's pick A); this happens only the first time.
  - Until that touch, the film plays with live captions and the key says "Tap for sound".
  - Checked in real iPhone Safari (the Simulator, via safaridriver).
- **The film's title card (2026-11-25, Dan: "doesn't look all the way like a film"):** it now takes the film's own look:
  lifted, uneven blacks (a brighter centre), a glow round the white letters, the film's grain on it, no blur (a blur
  filter smeared the letters on a real iPhone). The gate is lettered like the card: the keys are title-card plates
  (film white with a black inner rule), the field is double-ruled like the card's frame, Watch again is underlined.
  Dan's pick: "Intertitle" (Look controls → Title card: Now / Print / Intertitle; saved in `pick/dan`).
