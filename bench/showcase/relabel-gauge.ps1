# Relabel the brand-hero gauge face: cover the baked "REVLIMITER" with the flat
# dark dial colour, then draw "REVAUDIO" in a matching tracked cream font.
# ASCII only (PS5.1).
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$src = "C:\RevAudio\Website\revaudio-website\src\assets\hero\rev-gauge-face.png"
$bak = "C:\RevAudio\Website\revaudio-website\bench\showcase\rev-gauge-face-ORIG.png"
$out = "C:\RevAudio\Website\revaudio-website\bench\showcase\rev-gauge-face-revaudio.png"

$bmp = New-Object System.Drawing.Bitmap $src
$W = $bmp.Width; $H = $bmp.Height
if (-not (Test-Path $bak)) { $bmp.Save($bak, [System.Drawing.Imaging.ImageFormat]::Png) }

$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# 1) cover the old text with a vertical gradient matching the dial vignette
$rx = [int]($W * 0.225); $ry = [int]($H * 0.286)
$rw = [int]($W * 0.395); $rh = [int]($H * 0.086)
$rectF = New-Object System.Drawing.RectangleF $rx, ($ry - 1), $rw, ($rh + 2)
$cTop = [System.Drawing.Color]::FromArgb(255, 44, 33, 18)
$cBot = [System.Drawing.Color]::FromArgb(255, 33, 23, 12)
$brushBg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rectF, $cTop, $cBot, 90.0)
$g.FillRectangle($brushBg, $rx, $ry, $rw, $rh)

# 2) draw REVAUDIO centred where the old label sat, tracked like the original
$text = "REVAUDIO"
$col = [System.Drawing.Color]::FromArgb(255, 216, 186, 130)
$brushTx = New-Object System.Drawing.SolidBrush $col
$fontName = "Bahnschrift"
try { $font = New-Object System.Drawing.Font($fontName, 30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel) }
catch { $font = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel) }
$fmt = [System.Drawing.StringFormat]::GenericTypographic
$track = 7.0  # extra px between glyphs

# measure total width with tracking
$chars = $text.ToCharArray()
$total = 0.0
$widths = @()
foreach ($c in $chars) {
  $sz = $g.MeasureString([string]$c, $font, [System.Drawing.PointF]::new(0,0), $fmt)
  $widths += $sz.Width
  $total += $sz.Width + $track
}
$total -= $track

$cx = $W * 0.423
$cy = $H * 0.323
$x = $cx - $total / 2.0
$y = $cy - ($font.Height / 2.0)
for ($i = 0; $i -lt $chars.Length; $i++) {
  $g.DrawString([string]$chars[$i], $font, $brushTx, [single]$x, [single]$y, $fmt)
  $x += $widths[$i] + $track
}

$g.Dispose()
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "[relabel] saved $out  (orig backed up to $bak)"
