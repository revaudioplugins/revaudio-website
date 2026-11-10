# Round 9: the section plates as photos (Yoni: "the wear should be like the left panel which looks amazing" = bay-1),
# in the burnt titanium of tib-1, at 3 shapes for the 9-slice. gpt-image-2 edits with 2 refs. ASCII only (PS 5.1).
$ed = "C:\RevAudio\shared\tools\openai\edit.ps1"
$d = Split-Path -Parent $MyInvocation.MyCommand.Path
$p = "Make one new equipment faceplate photograph. Take the WEAR, the construction and the screws from the FIRST reference image exactly: a flat metal plate seen straight-on (flat orthographic), filling the whole frame edge to edge, slightly rounded edges worn through to bare bright silver metal with chips and nicks, fine scratches, scuffs, honest years-of-touring patina, and one Phillips pan-head screw near each of the four corners, every screw at the same small inset from its two edges (about 6 percent of the plate's short side). Take the MATERIAL and COLOUR from the SECOND reference image: real burnt titanium, dark satin titanium grey with a fine horizontal brushed grain and natural heat-tint blooms running straw gold, bronze, magenta-purple and deep cobalt blue, the colour a little deeper and darker than in the second image so white lettering would read on it, still vivid where the heat was strongest. The middle of the plate is plain and empty: NO holes, NO jacks, NO text, NO logos. Soft studio key light from the top-left."
$A = @(@{ n = "plate-w"; s = "2048x1024" }, @{ n = "plate-s"; s = "1024x1024" }, @{ n = "plate-t"; s = "1024x2048" })
$refs = @((Join-Path $d "bay-1.png"), (Join-Path $d "tib-1.png"))
$jobs = @()
foreach ($a in $A) {
  $o = Join-Path $d ($a.n + ".png")
  $jobs += Start-Job -ScriptBlock { param($ed, $p, $refs, $o, $s)
    $log = & $ed -Prompt $p -Image $refs -Out $o -Size $s -Quality high -Model gpt-image-2 -Fidelity '' 2>&1 | Out-String
    if (Test-Path $o) { "OK  $o" } else { "FAIL $o :: " + (($log -split "`n" | Select-String 'message|ERROR' | Select-Object -First 2) -join " ") } } -ArgumentList $ed, $p, $refs, $o, $a.s
}
$jobs | Wait-Job -Timeout 900 | Out-Null
$jobs | Receive-Job
$jobs | Remove-Job -Force
