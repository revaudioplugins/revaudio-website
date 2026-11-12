# The TV on the porch (GAS 2 laptop page)

A 1950s set on splayed legs, right of the chalkboard under the porch lamp (Gil 2026-11-12; reference: a walnut-framed,
cream-faced retro TV with a grille under the screen and tapered legs). `tv.css` + `tv.js`, wired into `page-b.html` with one
`<link>` + `<script>` line. The script adds the set to `#scene` and the theater to `<body>`.

The art (`img/`): a photo made in Higgsfield (Nano Banana Pro, Gil's TV photo for the shape + the scene frame for the
grit and the dusk light, on mid-gray, background removed), cut in two at the cabinet's bottom edge (row 1226 of 1462 x 1736):
`tv-cab` (the glass is a hole: the picture plays behind the real bezel) and `tv-legs` (they stay on the porch when the
cabinet flies to the front). `tv-glass` = the glass's own light, laid back over the picture. The PNGs are the masters
(full size); the page loads the `.webp` (1200 / 600 wide); the build skips `.png`. The hole and the screen box in
`tv.css` are in % of the cabinet art: re-measure them if the art changes.

- In the scene: the video plays muted on a loop while the set is on screen (paused off screen, and for reduced motion).
- Click / Enter: the cabinet lifts off its legs to the front (the room darkens), the video starts from the top with sound.
  Bar: play / pause, seek (arrows = 5 s), mute, full screen (the picture only; double-click the screen does it too), close.
  Esc, close or a click beside the set puts it back, silent. The radio stops when the TV opens.
- No video yet: the screen shows a stand-by card (colour bars, "GAS 2 TV · Please stand by"); the bar says Coming soon.

## Putting the video in

1. Save it as `tv/video/gas2.mp4` (H.264 + AAC, 16:9, `-movflags +faststart`; aim for under ~15 MB at 1080p).
   Optional: its first frame as `tv/video/gas2-poster.webp`.
2. In `tv.js` set `VIDEO = 'video/gas2.mp4'` (and `POSTER`). The build copies `tv/` to `/gas2/tv/`.

Try a clip before wiring it in: `page-b.html?tvvideo=<url>` (local server only). `?tv=open` opens the theater on load.
