# What the section shots leave out (and why)

Section shots (`sections.cjs`) are taken with reduced motion on, so the page itself removes the intro video, shows the road at
once, starts no Lenis and tweens nothing. Everything below is what still moves or cannot be compared pixel for pixel.

| Element | How it is left out | Why |
|---|---|---|
| `canvas[data-wb-night]` (hero night sky, full-bleed) | `visibility:hidden` only (NO mask box) | A mask box over a full-bleed canvas would paint over the title and the two buttons; hidden, the road still and all text stay in the shot |
| `canvas[data-wb-scope]` (dash scope) | Playwright `mask` (magenta box) + `visibility:hidden` | Live waveform drawing |
| `canvas[data-story-canvas]` (story stage) | Playwright `mask` + `visibility:hidden` | Canvas animation. The mask box alone was not enough: on the very tall story element shot (phones, 11-12k px) Chrome paints the sticky stage somewhere other than where the box was computed and the canvas leaked round its edge (2 flaky shots, max 3 colour steps) |
| every `<video>` (`video.wb-intro`) | Playwright `mask` + `visibility:hidden` | Removed under reduced motion; masked in case a refactor keeps it |
| CSS animations | Playwright `animations: 'disabled'` | Finite ones jump to their end state, infinite ones to the start |
| Cookie banner, `.cart-fab`, `.cart-tip`, `.haze`, `.ss`, `.si`, `.st` | `display:none` | Site chrome (Yoni's banner, cart), not the page under test |
| `.site-nav`, `.wb-sound` | `visibility:hidden` in section shots; visible in the `-fold` shot | Fixed bars sit on top of whatever scrolls under them |

Other determinism choices (not masks): Chrome is launched with `--disable-gpu --force-color-profile=srgb` (software raster, so
gradients and shadows do not wobble by +-1 between runs; without it one card border differed by 1 colour step in 2 pixels);
every shot scrolls the section to the top of the screen first; fonts and displayed images are awaited and decoded; the page
is walked top to bottom once first so lazy images and reveal observers have fired.

Not covered by these shots (use the behaviour checks): the intro video and the hand-off to the road, anything under
motion, the live face while the engine plays, hover and focus states, open/released phases, the no-JS page.
Section selectors (`sections.cjs`, `SECTIONS`): `.wb-hero`, `#wb-get`, `#wb-drive`, `#wb-story`, `#wb-presets`,
`#wb-specs`, `#wb-notify`, `footer.site-footer`. Also `-fold` (first screen with nav + SOUND pill) and `-story-p0..p4`
(the sticky story stage at five scroll points). A refactor that renames one of these ids/classes shows up as MISSING.
