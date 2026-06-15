# Flood-fill the black background of the STORE plate renders to transparent
# (BFS from the four corners, so interior dark pixels are preserved), then crop
# to the brass bounding box. ASCII only (PS5.1).
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$jobs = @(
  @{ In = Join-Path $root "btn-store-v1.png";      Out = "C:\RevAudio\Website\revaudio-website\src\assets\ui\btn-store.png" },
  @{ In = Join-Path $root "btn-store-pressed.png"; Out = "C:\RevAudio\Website\revaudio-website\src\assets\ui\btn-store-pressed.png" }
)

foreach ($job in $jobs) {
  $bmp = New-Object System.Drawing.Bitmap (Resolve-Path $job.In).Path
  $w = $bmp.Width; $h = $bmp.Height
  $rect = New-Object System.Drawing.Rectangle 0,0,$w,$h
  $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = $data.Stride
  $bytes = New-Object byte[] ($stride * $h)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

  $visited = New-Object bool[] ($w * $h)
  $stack = New-Object System.Collections.Generic.Stack[int]
  $thr = 62  # near-black background threshold

  function PushIfBg($px, $w, $h, $stride, $bytes, $visited, $stack, $thr) {
    # not used; inlined below for speed
  }

  $seeds = @(0, ($w-1), (($h-1)*$w), (($h-1)*$w + ($w-1)))
  foreach ($s in $seeds) { $stack.Push($s) }

  while ($stack.Count -gt 0) {
    $p = $stack.Pop()
    if ($visited[$p]) { continue }
    $visited[$p] = $true
    $x = $p % $w
    $y = [int][math]::Floor($p / $w)
    $i = $y * $stride + $x * 4
    $b = $bytes[$i]; $g = $bytes[$i+1]; $r = $bytes[$i+2]
    $mx = $b; if ($g -gt $mx) { $mx = $g }; if ($r -gt $mx) { $mx = $r }
    if ($mx -ge $thr) { continue }   # hit the brass edge — stop flooding here
    $bytes[$i+3] = 0                 # transparent
    if ($x -gt 0)      { $stack.Push($p - 1) }
    if ($x -lt $w-1)   { $stack.Push($p + 1) }
    if ($y -gt 0)      { $stack.Push($p - $w) }
    if ($y -lt $h-1)   { $stack.Push($p + $w) }
  }

  # bounding box of opaque pixels
  $minX = $w; $minY = $h; $maxX = 0; $maxY = 0
  for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $stride
    for ($x = 0; $x -lt $w; $x++) {
      if ($bytes[$row + $x*4 + 3] -gt 8) {
        if ($x -lt $minX) {$minX=$x}; if ($x -gt $maxX) {$maxX=$x}
        if ($y -lt $minY) {$minY=$y}; if ($y -gt $maxY) {$maxY=$y}
      }
    }
  }

  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
  $bmp.UnlockBits($data)

  $cw = $maxX - $minX + 1; $ch = $maxY - $minY + 1
  $cropRect = New-Object System.Drawing.Rectangle $minX, $minY, $cw, $ch
  $crop = $bmp.Clone($cropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $crop.Save($job.Out, [System.Drawing.Imaging.ImageFormat]::Png)
  $crop.Dispose(); $bmp.Dispose()
  $kb = [math]::Round((Get-Item $job.Out).Length / 1024, 1)
  Write-Host "[transp] $($job.Out)  crop ${cw}x${ch}  ($kb KB)"
}
