# WIDE BEAM: the projector look (Dan's new direction, 2026-11-22)

A rough, clickable look of the new WIDE BEAM page. It is not the site: nothing here is built into `/widebeam` yet, and
the bench folder is outside the Astro build.

The direction, in Dan's words: no player, no music. Three sections:

1. The car film with the email gate from the start.
2. The manual film, full screen on a projector: vintage, educational, our ElevenLabs voice. Gil provides the film.
   When it ends, the panel turns over mechanically to the Buy plate with the email gate.
3. "Understand it": the plugin's face, presented, with the gate again under it.

- **See it:** https://claude.ai/artifact/4oWMU9NiWGPcZniDsHee3Y (private to Dan; the first link,
  `6bbysbnKpcaGSKtCZu7hLL`, was deleted on 2026-11-23). Its Look controls panel switches
  the projector look (P1-P3), the flip (F1-F3) and the phase (before launch / on sale), and saves a pick with a note.
- **Stand-ins:** `standin.mp4` is cut from the car film and stills of the plugin face, and tagged "STAND-IN · Gil's film
  goes here". `standin-voice.mp4` is the take-2 voice from `revaudio-films/widebeam-1950-ad`. Gil's film replaces both.
- **The rest:** `car*.{mp4,jpg}`, `knob-width.webp` and `parts/` are the site's own files (`public/widebeam/`,
  `src/assets/widebeam/`). `face.webp` is the plugin's face. `title.webp` is the plugin's own WIDE BEAM lettering,
  cut from `face.webp` (x 829-2304, y 71-276 crop) and unmixed from the plate's grey, so it sits on any background.
- **Open it locally:** `index.html` is a page fragment (the Artifact tool adds the doctype), so wrap it first.
  Safari only plays the films from a server that answers range requests; `python3 -m http.server` does not.
- **Type:** two faces on the whole page, Bebas Neue (stamped: headlines, keys, prices, labels) and Gelasio (read:
  everything else). The LCD on the plugin's face keeps the plugin's own screen type.
