# Round 3: the bypass footswitch as a real pedal (Yoni: "the bypass stomp ... looks toyish"). gpt-image-1.5 cutouts.
# ASCII only (PS 5.1).
$tool = "C:\RevAudio\shared\tools\openai\image.ps1"
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$p = "A real 1990s boutique true-bypass A/B looper guitar pedal photographed from DIRECTLY ABOVE, flat top-down orthographic, no perspective, no tilt. A small Hammond 1590B die-cast aluminium enclosure standing upright in the frame (taller than wide), finished in worn black hammertone paint with chipped edges showing bare aluminium, fine scratches and scuffs from years on a gig board, four small corner screws on the lid. In the lower half, one real nickel-plated 3PDT stomp footswitch: a short domed actuator with fine wear on a hex nut and a flat washer, in correct scale for the enclosure (the nut about 35 percent of the enclosure width). In the upper third, one small empty round hole with a thin chrome bezel ring for an LED (the LED itself not lit, the hole dark). Two 1/4 inch jacks visible on the left and right side edges. NO text, NO logos, NO labels, NO knobs. Soft key light from the top-left, realistic contact shadows on the lid only. The pedal centered in the canvas with an equal transparent margin. Isolated sticker-style cutout on transparency: every pixel outside the pedal fully transparent alpha zero, no background surface, no vignette, no glow, no cast shadow outside the pedal."
$jobs = @()
foreach ($r in 1, 2) {
  $dst = Join-Path $d ("looper-{0}.png" -f $r)
  $jobs += Start-Job -ScriptBlock {
    param($tool, $p, $dst)
    $log = & $tool -Prompt $p -Out $dst -Size 1024x1536 -Quality high -Background transparent -Model gpt-image-1.5 2>&1 | Out-String
    if (Test-Path $dst) { "OK  $dst" } else { "FAIL $dst :: " + (($log -split "`n" | Select-String 'message' | Select-Object -First 1) -join "") }
  } -ArgumentList $tool, $p, $dst
}
$jobs | Wait-Job -Timeout 600 | Out-Null
$jobs | Receive-Job
$jobs | Remove-Job -Force
