# RevFX #rfx-hear v2 assets, round 1: 8 assets x 2 rolls, high, parallel jobs.
# gpt-image-1 is retired (2026-11); gpt-image-2 = opaque textures (no transparency), gpt-image-1.5 = cutouts.
# ASCII only (PS 5.1).
$tool = "C:\RevAudio\shared\tools\openai\image.ps1"
$out = Split-Path -Parent $MyInvocation.MyCommand.Path

$cut = " Isolated sticker-style cutout on transparency: every pixel outside the object fully transparent alpha zero, no background surface, no panel, no vignette, no glow, no cast shadow."
$photo = " Photorealistic studio product photograph of real 1990s music gear, honest light wear and fine scratches, accurate metal reflections, soft key light from the top-left."

$A = @(
  @{ n = "panel"; s = "1536x1024"; b = "opaque"; p = "A 1990s road flight-case front panel photographed straight-on, flat orthographic, filling the whole frame edge to edge: black textured tolex vinyl with a fine pebble grain, framed on all four edges by a narrow brushed aluminium angle extrusion, a chrome ball corner at each of the four corners, small pop rivets spaced along the aluminium, honest road wear: scuffs, one scratched corner, the faint ghost outline of a removed sticker. The whole middle is empty plain tolex: no text, no logos, no handles, no latches, no hardware in the middle. Even, dark, moody lighting." + $photo },
  @{ n = "bay"; s = "1024x1536"; b = "opaque"; p = "A tall vertical 1990s studio rack faceplate photographed straight-on, flat orthographic front view, the plate filling the whole frame edge to edge: black anodized aluminium with a fine vertical brushed grain, slightly rounded edges worn through to bare silver aluminium, small scuffs, one Phillips screw near each of the four corners. The plate is plain and empty: NO text, NO letters, NO holes, NO jacks, NO knobs." + $photo },
  @{ n = "jack"; s = "1024x1024"; b = "transparent"; p = "A single 1/4 inch (6.35 mm) panel-mount audio jack socket seen FLAT ORTHOGRAPHIC from directly in front, camera straight on at 90 degrees, no perspective, no tilt: a chrome hexagonal nut over a knurled chrome washer ring, a deep black hole exactly in the center. Perfectly symmetric, centered exactly in the canvas with an equal transparent margin on all four sides, the nut about 70 percent of the canvas width." + $photo + $cut },
  @{ n = "plug"; s = "1536x1024"; b = "transparent"; p = "A vintage 1990s right-angle (L-shaped) 1/4 inch guitar cable plug, photographed from directly in front exactly as it looks plugged into a vertical panel, flat orthographic, no perspective: on the LEFT we see the round end cap of the right-angle plug head as a near-perfect circle (black ribbed metal with a chrome rim), and from that head a thick woven tweed braided cable in deep purple and black leaves sideways and runs perfectly straight and horizontal to the RIGHT edge of the image, the cable cut off by the right edge. The plug head center sits at the vertical middle of the canvas." + $photo + $cut },
  @{ n = "patch"; s = "1536x1024"; b = "transparent"; p = "A short 1990s guitar pedal patch cable seen from directly above, flat top-down orthographic: two flat low-profile right-angle 1/4 inch pancake plugs in black metal with chrome tips, one at the far left and one at the far right, both on the same horizontal line at the vertical middle, joined by a woven tweed braided cable in deep purple and black that runs between them in a straight line with a very slight sag." + $photo + $cut },
  @{ n = "board"; s = "1536x1024"; b = "opaque"; p = "Top-down flat orthographic photograph of an empty 1990s guitar pedalboard surface filling the whole frame edge to edge: black hook-and-loop carpet with fine fibres, a little worn and dusty, a narrow brushed aluminium road-case edge trim with small rivets running along the very top edge and the very bottom edge. No pedals, no cables, no text, no logos. Dark moody lighting." + $photo },
  @{ n = "stomp"; s = "1024x1024"; b = "transparent"; p = "A single chrome 3PDT guitar pedal stomp footswitch seen FLAT ORTHOGRAPHIC from directly above, camera straight down at 90 degrees, no perspective, no tilt: a domed polished chrome actuator button in the center, seated in a chrome hexagonal mounting nut over a toothed chrome lock washer. The button is a perfect circle, the whole switch centered exactly in the canvas with an equal transparent margin on all four sides, about 75 percent of the canvas width." + $photo + $cut },
  @{ n = "led"; s = "1024x1024"; b = "transparent"; p = "A single 5 mm indicator LED in a chrome panel-mount bezel, seen FLAT ORTHOGRAPHIC from directly in front, no perspective: a knurled chrome ring bezel around a dark unlit dome lens of smoky violet-tinted glass with a small specular highlight. Perfect circle, centered exactly in the canvas with an equal transparent margin on all four sides, about 60 percent of the canvas width." + $photo + $cut }
)

$jobs = @()
foreach ($a in $A) {
  foreach ($r in 1, 2) {
    $dst = Join-Path $out ("{0}-{1}.png" -f $a.n, $r)
    $jobs += Start-Job -ScriptBlock {
      param($tool, $p, $dst, $s, $b)
      $m = if ($b -eq 'transparent') { 'gpt-image-1.5' } else { 'gpt-image-2' }
      $log = & $tool -Prompt $p -Out $dst -Size $s -Quality high -Background $b -Model $m 2>&1 | Out-String
      if (Test-Path $dst) { "OK  $dst" } else { "FAIL $dst :: " + (($log -split "`n" | Select-String 'message' | Select-Object -First 1) -join "") }
    } -ArgumentList $tool, $a.p, $dst, $a.s, $a.b
  }
}
$jobs | Wait-Job -Timeout 900 | Out-Null
$jobs | Receive-Job
$jobs | Remove-Job -Force
