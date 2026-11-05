# Round 7 (Yoni: "maybe use titanium vibe with a bit of the titanium color effect"): the section panels' metal.
# ASCII only (PS 5.1).
$img = "C:\RevAudio\shared\tools\openai\image.ps1"
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$tex = @(
  "A flat orthographic photograph of a sheet of brushed titanium, filling the whole frame edge to edge with no edges, no borders, no screws, no holes, no text: cool dark titanium grey with fine straight horizontal brushing, and a SUBTLE natural titanium heat-tint colour effect: soft iridescent blooms drifting through straw gold, bronze, violet-purple and steel blue in a few areas, like a burnt titanium exhaust tip but gentle and mostly grey, the colour never covering more than about a third of the sheet. Honest light wear: a few faint scratches and soft scuffs. Even soft studio light. A realistic premium 1990s music equipment faceplate material.",
  "A flat orthographic photograph of a sheet of bead-blasted and lightly brushed titanium, filling the whole frame edge to edge with no edges, no borders, no screws, no holes, no text: dark satin titanium grey with a fine horizontal grain, and a SUBTLE anodized titanium colour effect: a gentle iridescent shift from violet-purple to deep blue with faint gold at one edge, low saturation, mostly grey metal, the colour reading like oil on water only where the light catches it. Honest light wear: a few faint scratches. Even soft studio light. A realistic premium 1990s music equipment faceplate material."
)
$jobs = @()
for ($i = 0; $i -lt 2; $i++) {
  $o = Join-Path $d ("ti-{0}.png" -f ($i + 1))
  $jobs += Start-Job -ScriptBlock { param($img, $p, $o)
    & $img -Prompt $p -Out $o -Size 2048x1024 -Quality high -Background opaque -Model gpt-image-2 2>&1 | Out-Null
    if (Test-Path $o) { "OK  $o" } else { "FAIL $o" } } -ArgumentList $img, $tex[$i], $o
}
$jobs | Wait-Job -Timeout 900 | Out-Null
$jobs | Receive-Job
$jobs | Remove-Job -Force
