# Round 6 (Yoni: the switch "too much on a side view ... more from upper angle, still make some angle"; "metal panels on
# each section including the stomp switch"). Parallel: 2 switches (+ their pressed edits), 2 metal textures, 2 screws.
# ASCII only (PS 5.1).
$img = "C:\RevAudio\shared\tools\openai\image.ps1"
$ed = "C:\RevAudio\shared\tools\openai\edit.ps1"
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$cut = " Isolated sticker-style cutout on transparency: every pixel outside the object fully transparent alpha zero, no background surface, no panel, no vignette, no glow, no cast shadow."
$sw = "A single vintage 3PDT guitar pedal stomp footswitch, photographed from ALMOST DIRECTLY ABOVE: the camera is tilted only about 8 degrees from straight down. The round top of the domed cap is a near-perfect circle sitting almost centred over the hex nut, only a thin sliver of the cap's side shows on its near (bottom) edge, the plunger is hidden under the cap, and the hex nut and flat round washer read as a near-regular hexagon on a near-circle. The 3D feel comes from soft shading and a gentle highlight on the dome, not from perspective. RELEASED, popped-up position. Aged nickel-plated steel with real patina: soft grey tarnish, dull satin spots, fine circular scuffs on the cap, a little dark grime in the corners of the nut, no rust, no mirror shine. Soft key light from the top-left. Centered with an equal transparent margin, the washer about 62 percent of the canvas width." + $cut
$press = "The exact same footswitch photo: identical camera angle, framing, position, size, lighting, patina and transparent background. Only change: the switch is now PRESSED DOWN and latched, like a real 3PDT after a stomp: the domed cap is pushed down so it sits lower and a touch smaller, right on top of the hex nut, its thin side band gone. The hex nut and washer stay exactly where they are, same size, same pixels. Every pixel outside the switch fully transparent alpha zero, no cast shadow, no glow."
$tex = "A flat orthographic photograph of a piece of dark gunmetal-grey brushed steel sheet, filling the whole frame edge to edge with no edges, no borders, no screws, no holes, no text: fine straight horizontal brushing, honest light wear (a few faint scratches, soft scuffs, faint fingerprints and a little dull patina in places), even soft studio light with a gentle falloff. It must read as a realistic metal panel texture for a 1990s music equipment faceplate."
$scr = "A single steel Phillips pan-head panel screw head seen FLAT ORTHOGRAPHIC from directly above, camera straight down: a slightly domed round head with a cross recess, aged nickel with light patina and a little dark grime in the cross, a tiny ring of shadow where it meets the panel is NOT included. Perfect circle, centered exactly with an equal transparent margin, about 70 percent of the canvas width. Soft key light from the top-left." + $cut
$jobs = @()
foreach ($r in 1, 2) {
  $jobs += Start-Job -ScriptBlock { param($img, $ed, $p, $press, $up, $dn)
    & $img -Prompt $p -Out $up -Size 1024x1024 -Quality high -Background transparent -Model gpt-image-1.5 2>&1 | Out-Null
    if (-not (Test-Path $up)) { return "FAIL $up" }
    & $ed -Prompt $press -Image $up -Out $dn -Size 1024x1024 -Quality high -Background transparent -Model gpt-image-1.5 -Fidelity high 2>&1 | Out-Null
    if (Test-Path $dn) { "OK  $up + dn" } else { "FAIL $dn" } } -ArgumentList $img, $ed, $sw, $press, (Join-Path $d "fsw6-up-$r.png"), (Join-Path $d "fsw6-dn-$r.png")
  $jobs += Start-Job -ScriptBlock { param($img, $p, $o)
    & $img -Prompt $p -Out $o -Size 2048x1024 -Quality high -Background opaque -Model gpt-image-2 2>&1 | Out-Null
    if (Test-Path $o) { "OK  $o" } else { "FAIL $o" } } -ArgumentList $img, $tex, (Join-Path $d "metal-$r.png")
  $jobs += Start-Job -ScriptBlock { param($img, $p, $o)
    & $img -Prompt $p -Out $o -Size 1024x1024 -Quality high -Background transparent -Model gpt-image-1.5 2>&1 | Out-Null
    if (Test-Path $o) { "OK  $o" } else { "FAIL $o" } } -ArgumentList $img, $scr, (Join-Path $d "screw-$r.png")
}
$jobs | Wait-Job -Timeout 900 | Out-Null
$jobs | Receive-Job
$jobs | Remove-Job -Force
