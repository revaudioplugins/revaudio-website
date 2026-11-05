# Round 2: the plates at their real display ratios (no 9-slice seams), reference-guided from the picked roll-1 files.
# ASCII only (PS 5.1).
$tool = "C:\RevAudio\shared\tools\openai\edit.ps1"
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$keep = " Keep exactly the same materials, colours, wear, lighting and photographic realism as the reference photo. Flat orthographic straight-on view, filling the whole frame edge to edge, no text, no logos."
$A = @(
  @{ n = "panel-wide"; ref = "panel-2.png"; s = "2560x1008"; p = "The same 1990s road flight-case front panel as the reference, re-photographed as a much wider panel: black pebble-grain tolex framed on all four edges by the same narrow brushed aluminium angle extrusion with small pop rivets evenly spaced along it, a chrome ball corner at each of the four corners, the rails the same thickness on all four sides. The middle is plain empty tolex with subtle scuffs and the faint ghost of a removed sticker." + $keep },
  @{ n = "panel-tall"; ref = "panel-2.png"; s = "1024x1616"; p = "The same 1990s road flight-case front panel as the reference, re-photographed as a tall portrait panel: black pebble-grain tolex framed on all four edges by the same narrow brushed aluminium angle extrusion with small pop rivets evenly spaced along it, a chrome ball corner at each of the four corners, the rails the same thickness on all four sides. The middle is plain empty tolex with subtle scuffs." + $keep },
  @{ n = "bay-wide"; ref = "bay-1.png"; s = "1824x608"; p = "The same black anodized aluminium rack faceplate as the reference, re-photographed as a long horizontal strip: fine horizontal brushed grain, edges worn through to bare silver aluminium, one Phillips screw near each of the four corners. Plain and empty: no holes, no jacks, no text." + $keep },
  @{ n = "board-wide"; ref = "board-1.png"; s = "2208x736"; p = "The same empty 1990s pedalboard surface as the reference, re-photographed as a long wide strip seen from directly above: black hook-and-loop carpet, a narrow brushed aluminium edge rail with small evenly spaced rivets running along the very top edge and the very bottom edge, both rails the same thickness. No pedals, no cables." + $keep },
  @{ n = "board-mid"; ref = "board-1.png"; s = "1600x768"; p = "The same empty 1990s pedalboard surface as the reference, re-photographed seen from directly above: black hook-and-loop carpet, a narrow brushed aluminium edge rail with small evenly spaced rivets running along the very top edge and the very bottom edge, both rails the same thickness. No pedals, no cables." + $keep }
)
$jobs = @()
foreach ($a in $A) {
  $dst = Join-Path $d ($a.n + ".png"); $ref = Join-Path $d $a.ref
  $jobs += Start-Job -ScriptBlock {
    param($tool, $p, $ref, $dst, $s)
    $log = & $tool -Prompt $p -Image $ref -Out $dst -Size $s -Quality high -Model gpt-image-2 -Fidelity '' 2>&1 | Out-String
    if (Test-Path $dst) { "OK  $dst" } else { "FAIL $dst :: " + (($log -split "`n" | Select-String 'message|ERROR' | Select-Object -First 2) -join " ") }
  } -ArgumentList $tool, $a.p, $ref, $dst, $a.s
}
$jobs | Wait-Job -Timeout 900 | Out-Null
$jobs | Receive-Job
$jobs | Remove-Job -Force
