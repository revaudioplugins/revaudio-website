# #hear panel plates: prompts (gpt-image-2, 2560x1024, quality high, 2026-10-26)

Made with a UTF-8 wrapper around the images API (the shared `tools/openai/image.ps1` sends a string body, which PS 5.1 encodes as ISO-8859-1: Japanese would arrive as `?`). Each prompt = BASE + its own paragraph.

## panel1

```text
Straight-on, perfectly flat orthographic photograph of one wide steel dashboard panel plate that fills the entire frame edge to edge: no background, no border, no frame, no perspective, no shadow around it. Material: beat-up violet-black gunmetal steel with a fine brushed grain, the plate of a Japanese arcade street-racing cabinet from the 90s night drift scene. Soft even studio light from the upper left, no hotspots, no glare. Overall the plate stays DARK (deep violet-black) so bright parts mounted on it later still read; colours only from the house palette: hot magenta (#ff4fd8), electric cyan (#5ee7ff), chalky white, black. Equipment will be bolted over the middle of this plate later, so put the strongest graffiti and the Japanese lettering along the top edge strip and down the left and right edges; the middle is quieter worn metal with faint old marks. No screws, no bolts, no buttons, no knobs, no screens, no logos, no English words, no other lettering than the Japanese specified. Ultra-detailed, photographic, real materials.

The plate has been through a car crash on a mountain pass: a long dented crease runs across the lower right, the paint is scraped down to bare silver steel along the edges and corners, deep gouges and scratches, chipped violet paint, road dust and grime in the grain. Graffiti: a big hand-sprayed hot-magenta spray-paint tag of the Japanese katakana word "ドリフト" along the top left, with drips and overspray, partly scraped away by the crash; a smaller chalky-white spray-painted kanji "峠" near the top right edge. Faded remains of a torn magenta-and-black racing checker sticker on one edge. Every Japanese character must be correct and clearly legible.
```

## panel2

```text
Straight-on, perfectly flat orthographic photograph of one wide steel dashboard panel plate that fills the entire frame edge to edge: no background, no border, no frame, no perspective, no shadow around it. Material: beat-up violet-black gunmetal steel with a fine brushed grain, the plate of a Japanese arcade street-racing cabinet from the 90s night drift scene. Soft even studio light from the upper left, no hotspots, no glare. Overall the plate stays DARK (deep violet-black) so bright parts mounted on it later still read; colours only from the house palette: hot magenta (#ff4fd8), electric cyan (#5ee7ff), chalky white, black. Equipment will be bolted over the middle of this plate later, so put the strongest graffiti and the Japanese lettering along the top edge strip and down the left and right edges; the middle is quieter worn metal with faint old marks. No screws, no bolts, no buttons, no knobs, no screens, no logos, no English words, no other lettering than the Japanese specified. Ultra-detailed, photographic, real materials.

Crash-damaged and repaired in a hurry: the top edge is bent and dented, a hairline crack runs from one corner, paint scuffed and scraped, strips of torn silver gaffer tape over the left and right edges, black tyre-rubber skid marks streaked across it. Paint: electric-cyan military stencil spray lettering of the Japanese kanji "全開" at the top left and a hot-magenta stencil "試聴" at the top right, both eroded, scratched and partly worn through by the wear, overspray halos around the stencil edges. Every Japanese character must be correct and clearly legible.
```

## panel3

```text
Straight-on, perfectly flat orthographic photograph of one wide steel dashboard panel plate that fills the entire frame edge to edge: no background, no border, no frame, no perspective, no shadow around it. Material: beat-up violet-black gunmetal steel with a fine brushed grain, the plate of a Japanese arcade street-racing cabinet from the 90s night drift scene. Soft even studio light from the upper left, no hotspots, no glare. Overall the plate stays DARK (deep violet-black) so bright parts mounted on it later still read; colours only from the house palette: hot magenta (#ff4fd8), electric cyan (#5ee7ff), chalky white, black. Equipment will be bolted over the middle of this plate later, so put the strongest graffiti and the Japanese lettering along the top edge strip and down the left and right edges; the middle is quieter worn metal with faint old marks. No screws, no bolts, no buttons, no knobs, no screens, no logos, no English words, no other lettering than the Japanese specified. Ultra-detailed, photographic, real materials.

Like a Tokyo highway-underpass wall bolted to a racing cabinet: layers of overlapping old spray tags in faded magenta, cyan and white along the edges, peeling paper stickers, black tyre-rubber marks swept across it, one corner scorched and heat-blued from the crash, dents and scrapes to bare steel. A bold chalky-white hand-sprayed Japanese "聴け" across the top left with drips, and a small hot-magenta katakana "ドリフト" tag at the top right. Every Japanese character must be correct and clearly legible.
```


## panel3-portrait (2026-10-26, the phone plate)

`/v1/images/edits` with `panel3.png` as the input image, gpt-image-2, 1024 x 1536. The Japanese came back correct
(聴け, ドリフト, 夜, 最高速度で, 逃げ場はない), checked by eye.

```text
Recompose this exact graffiti steel plate as a tall PORTRAIT plate: the same wall, the same violet-black worn gunmetal, the same tags, stickers, tyre marks, scorched heat-blued corner, dents and scrapes, the same colours and lighting, straight-on and flat, filling the whole frame edge to edge with no border and no background. Keep the Japanese lettering exactly as written, correct and legible: the big white spray-painted "聴け" at the top, the magenta katakana "ドリフト" tag, "夜", "最高速度で" and "逃げ場はない" running down the left and right edges. Most graffiti hugs the top strip and the left and right edges; the middle is quieter worn metal. No screws, no bolts, no buttons, no other lettering.
```

## crack-lcd / crack-crt (2026-10-26, the broken glass on the LCD and the track list)

gpt-image-2, generated on black, cut into two crops, used with `mix-blend-mode: screen`.

```text
Macro photograph of cracked glass on a PURE BLACK background, made to be used as a screen-blend overlay layer. One crack system in a thin glass screen: a small impact point near the right edge with a tight star of fine radial cracks, and three long thin branching hairline cracks running from it to the left and down across the frame, each catching the light as a thin bright silvery-white line with a faint dark shadow line beside it and a hint of prismatic edge. Some short secondary branches. Everything else is pure black (#000000): no glass texture, no reflections, no dust, no frame, no text, no colour cast.
```

## spray-arrow (2026-10-26, variant B's arrows at PLAY and DRIFT)

gpt-image-2, generated on black; the left half = the arrow. The right half (a sprayed ring) was tried round the DRIFT
button and dropped: a magenta ring there reads as the button's own lamp (magenta = DRIFT on).

```text
Hand-sprayed graffiti marks in hot magenta (#ff4fd8) aerosol spray paint on a PURE BLACK background, photographed flat and straight-on, made to be used as a screen-blend overlay layer. Left half: one bold curved arrow sprayed in a single fast stroke, sweeping from the upper left and pointing down to the lower right, with a soft overspray mist halo, fine paint speckles, thicker paint where the stroke starts and two paint drips running straight down. Right half: one rough hand-sprayed circle ring, open at the top where the stroke started and ended, like a tagger circling a target, with overspray and two drips. Real aerosol paint texture. Nothing else: pure black background (#000000), no wall, no texture, no text, no letters.
```
