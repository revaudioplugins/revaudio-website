# Round 8 (Yoni: "the panels are dull, lets add the effect a little bit when titanium is burned that create those
# colors. also higher petina and wear"). Burnt titanium sheets, gpt-image-2 opaque. ASCII only (PS 5.1).
$img = "C:\RevAudio\shared\tools\openai\image.ps1"
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$base = "A flat orthographic close-up photograph of a sheet of real BURNT TITANIUM used as a 1990s boutique music equipment faceplate, filling the whole frame edge to edge with no edges, no borders, no screws, no holes, no text. Dark satin titanium grey with a fine straight horizontal brushed grain. "
$wear = " Heavy honest patina and wear from years of touring: many fine scratches in all directions, a few deeper gouges catching the light, soft scuffs, dull worn patches, faint fingerprint smudges, a little dark grime settled into the grain, small dings. Realistic metal, crisp micro detail, soft studio key light from the top-left with a gentle sheen across the sheet."
$tex = @(
  $base + "Several natural HEAT-TINT zones from the titanium being burned, spread across the whole sheet (one in each third so any crop catches colour): each zone a smooth oily bloom running straw gold to bronze to magenta-purple to deep cobalt blue, the colours vivid where the heat was strongest and fading softly into the bare grey metal, like a burnt titanium exhaust tip or a weld halo." + $wear,
  $base + "Rich natural HEAT-TINT colour from the titanium being burned, flowing in soft diagonal bands across the whole sheet: straw gold and bronze in places, then violet-purple and deep cobalt blue, the iridescent colour strongest in the bands and fading into bare grey titanium between them, like a heat-treated titanium bike frame or a burnt exhaust." + $wear
)
$jobs = @()
for ($i = 0; $i -lt 2; $i++) {
  $o = Join-Path $d ("tib-{0}.png" -f ($i + 1))
  $jobs += Start-Job -ScriptBlock { param($img, $p, $o)
    & $img -Prompt $p -Out $o -Size 2048x1024 -Quality high -Background opaque -Model gpt-image-2 2>&1 | Out-Null
    if (Test-Path $o) { "OK  $o" } else { "FAIL $o" } } -ArgumentList $img, $tex[$i], $o
}
$jobs | Wait-Job -Timeout 900 | Out-Null
$jobs | Receive-Job
$jobs | Remove-Job -Force
