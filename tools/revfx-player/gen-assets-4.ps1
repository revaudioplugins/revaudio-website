# Round 4: the bypass footswitch alone, with patina, in two latch states (Yoni: "just the switch ... a bit of patina,
# when pressed make it stay pressed and when bypassed make it pop out, like a real pedal"). gpt-image-1.5 cutouts.
# ASCII only (PS 5.1).
$tool = "C:\RevAudio\shared\tools\openai\image.ps1"
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$p = "A single vintage 3PDT guitar pedal stomp footswitch as mounted on a 1990s boutique pedal, photographed from a high angle about 20 degrees off straight-down, so the round side of the actuator plunger is just visible. The switch is in its RELEASED, popped-up position: the domed actuator button stands clearly above the hex nut on its short plunger. Aged nickel-plated steel with real patina: soft grey tarnish, dull satin spots, fine circular scuffs on the dome from years of boot stomps, a little dark grime in the corners of the nut, no rust, no chrome mirror shine. A plain hexagonal nut seated on a flat round washer (no toothed washer, no gear teeth). Muted satin reflections, soft key light from the top-left. The switch centered in the canvas with an equal transparent margin, the nut about 55 percent of the canvas width. Isolated sticker-style cutout on transparency: every pixel outside the switch fully transparent alpha zero, no background surface, no panel, no vignette, no glow, no cast shadow."
$jobs = @()
foreach ($r in 1, 2) {
  $dst = Join-Path $d ("fsw-up-{0}.png" -f $r)
  $jobs += Start-Job -ScriptBlock {
    param($tool, $p, $dst)
    $log = & $tool -Prompt $p -Out $dst -Size 1024x1024 -Quality high -Background transparent -Model gpt-image-1.5 2>&1 | Out-String
    if (Test-Path $dst) { "OK  $dst" } else { "FAIL $dst :: " + (($log -split "`n" | Select-String 'message' | Select-Object -First 1) -join "") }
  } -ArgumentList $tool, $p, $dst
}
$jobs | Wait-Job -Timeout 600 | Out-Null
$jobs | Receive-Job
$jobs | Remove-Job -Force
