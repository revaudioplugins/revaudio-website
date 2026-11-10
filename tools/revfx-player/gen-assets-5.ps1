# Round 5: (a) the PRESSED state of fsw-up-1 as an edit (same frame), (b) a closer-to-overhead popped-up roll + its
# pressed edit. ASCII only (PS 5.1).
$img = "C:\RevAudio\shared\tools\openai\image.ps1"
$ed = "C:\RevAudio\shared\tools\openai\edit.ps1"
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$press = "The exact same footswitch photo: identical camera angle, framing, position, size, lighting, patina and transparent background. Only change: the switch is now PRESSED DOWN and latched, like a real 3PDT after a stomp: the actuator plunger is pushed down into the nut so only a thin sliver of the plunger shows, the domed cap sits low just above the hex nut. The hex nut and washer stay exactly where they are, same size, same pixels. Every pixel outside the switch fully transparent alpha zero, no cast shadow, no glow."
$top = "A single vintage 3PDT guitar pedal stomp footswitch as mounted on a 1990s boutique pedal, photographed NEARLY STRAIGHT DOWN from above, the camera only about 15 degrees from vertical: the round dome of the actuator reads as a near circle, the hex nut as a near-regular hexagon, and just a thin band of the plunger's side shows below the dome on the near side. RELEASED, popped-up position. Aged nickel-plated steel with real patina: soft grey tarnish, dull satin spots, fine circular scuffs on the dome, a little dark grime in the corners of the nut, no rust, no mirror shine. A plain hexagonal nut on a flat round washer, no toothed washer. Soft key light from the top-left. Centered with an equal transparent margin, the washer about 60 percent of the canvas width. Isolated sticker-style cutout on transparency: every pixel outside the switch fully transparent alpha zero, no background, no cast shadow, no glow."
$j1 = Start-Job -ScriptBlock { param($ed, $p, $src, $dst)
  & $ed -Prompt $p -Image $src -Out $dst -Size 1024x1024 -Quality high -Background transparent -Model gpt-image-1.5 -Fidelity high 2>&1 | Out-Null
  if (Test-Path $dst) { "OK  $dst" } else { "FAIL $dst" } } -ArgumentList $ed, $press, (Join-Path $d "fsw-up-1.png"), (Join-Path $d "fsw-dn-1.png")
$j2 = Start-Job -ScriptBlock { param($img, $ed, $p, $press, $up, $dn)
  & $img -Prompt $p -Out $up -Size 1024x1024 -Quality high -Background transparent -Model gpt-image-1.5 2>&1 | Out-Null
  if (-not (Test-Path $up)) { return "FAIL $up" }
  & $ed -Prompt $press -Image $up -Out $dn -Size 1024x1024 -Quality high -Background transparent -Model gpt-image-1.5 -Fidelity high 2>&1 | Out-Null
  if (Test-Path $dn) { "OK  $up + $dn" } else { "FAIL $dn" } } -ArgumentList $img, $ed, $top, $press, (Join-Path $d "fsw-up-3.png"), (Join-Path $d "fsw-dn-3.png")
@($j1, $j2) | Wait-Job -Timeout 900 | Out-Null
@($j1, $j2) | Receive-Job
@($j1, $j2) | Remove-Job -Force
