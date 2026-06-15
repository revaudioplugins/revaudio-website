# Derive a pressed-state plate from btn-store-v1.png by darkening/recessing the
# red button region only. Bezel/screws stay pixel-identical so the crossfade is clean.
# ASCII only (PS5.1).
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $root "btn-store-v1.png"
$dst  = Join-Path $root "btn-store-pressed.png"

$bmp = New-Object System.Drawing.Bitmap (Resolve-Path $src).Path
$w = $bmp.Width; $h = $bmp.Height
$rect = New-Object System.Drawing.Rectangle 0,0,$w,$h
$data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $data.Stride
$bytes = New-Object byte[] ($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

# Pass 1: bounding box of "red button" pixels (B,G,R,A order in memory).
$minX = $w; $minY = $h; $maxX = 0; $maxY = 0
for ($y=0; $y -lt $h; $y++) {
  $row = $y * $stride
  for ($x=0; $x -lt $w; $x++) {
    $i = $row + $x*4
    $b = $bytes[$i]; $g = $bytes[$i+1]; $r = $bytes[$i+2]
    if ($r -gt 110 -and $r -gt ($g*1.5) -and $r -gt ($b*1.5)) {
      if ($x -lt $minX) {$minX=$x}; if ($x -gt $maxX) {$maxX=$x}
      if ($y -lt $minY) {$minY=$y}; if ($y -gt $maxY) {$maxY=$y}
    }
  }
}
Write-Host "[pressed] button bbox: x $minX..$maxX  y $minY..$maxY"
$bw = $maxX - $minX; $bh = $maxY - $minY

# Pass 2: within bbox, darken button enamel + gold text, add a top inner shadow
# (recess) gradient so it reads as pushed-in. Outside bbox untouched.
for ($y=$minY; $y -le $maxY; $y++) {
  $row = $y * $stride
  # top-of-button shadow: strongest at top edge, fades over top 45% of height
  $ty = ($y - $minY) / [double]$bh
  $shadow = 0.0
  if ($ty -lt 0.45) { $shadow = (0.45 - $ty) / 0.45 * 0.45 }  # up to 45% extra darken at very top
  for ($x=$minX; $x -le $maxX; $x++) {
    $i = $row + $x*4
    $b = $bytes[$i]; $g = $bytes[$i+1]; $r = $bytes[$i+2]
    $isRed  = ($r -gt 100 -and $r -gt ($g*1.4) -and $r -gt ($b*1.4))
    $isGold = ($r -gt 150 -and $g -gt 120 -and $b -lt ($r*0.85))  # cream/gold text + highlights
    if ($isRed) {
      $f = 0.5 * (1.0 - $shadow)        # darken enamel to ~50%, more at top
      $bytes[$i]   = [byte]([math]::Min(255,[math]::Max(0,$b*$f)))
      $bytes[$i+1] = [byte]([math]::Min(255,[math]::Max(0,$g*$f)))
      $bytes[$i+2] = [byte]([math]::Min(255,[math]::Max(0,$r*$f)))
    } elseif ($isGold) {
      $f = 0.42                          # sink the text/highlights
      $bytes[$i]   = [byte]([math]::Min(255,[math]::Max(0,$b*$f)))
      $bytes[$i+1] = [byte]([math]::Min(255,[math]::Max(0,$g*$f)))
      $bytes[$i+2] = [byte]([math]::Min(255,[math]::Max(0,$r*$f)))
    }
  }
}

[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
$bmp.UnlockBits($data)
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$kb = [math]::Round((Get-Item $dst).Length / 1024, 1)
Write-Host "[pressed] saved: $dst ($kb KB)"
