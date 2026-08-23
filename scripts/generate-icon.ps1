param([string]$OutputDirectory = "build")

Add-Type -AssemblyName System.Drawing
$resolvedOutput = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\$OutputDirectory"))
[System.IO.Directory]::CreateDirectory($resolvedOutput) | Out-Null
$bitmap = [System.Drawing.Bitmap]::new(256, 256, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::Transparent)

$backgroundPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
$radius = 48
$backgroundPath.AddArc(8, 8, $radius, $radius, 180, 90)
$backgroundPath.AddArc(200, 8, $radius, $radius, 270, 90)
$backgroundPath.AddArc(200, 200, $radius, $radius, 0, 90)
$backgroundPath.AddArc(8, 200, $radius, $radius, 90, 90)
$backgroundPath.CloseFigure()
$backgroundBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  [System.Drawing.Point]::new(20, 20),
  [System.Drawing.Point]::new(236, 236),
  [System.Drawing.Color]::FromArgb(255, 24, 27, 38),
  [System.Drawing.Color]::FromArgb(255, 8, 9, 14)
)
$graphics.FillPath($backgroundBrush, $backgroundPath)
$graphics.DrawPath([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 48, 53, 70), 5), $backgroundPath)

$hex = [System.Drawing.PointF[]]@(
  [System.Drawing.PointF]::new(128, 48),
  [System.Drawing.PointF]::new(192, 85),
  [System.Drawing.PointF]::new(192, 171),
  [System.Drawing.PointF]::new(128, 208),
  [System.Drawing.PointF]::new(64, 171),
  [System.Drawing.PointF]::new(64, 85)
)
$graphics.FillPolygon([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(28, 129, 114, 245)), $hex)
$markPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 139, 125, 255), 9)
$markPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$graphics.DrawPolygon($markPen, $hex)
$letterPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 244, 243, 255), 11)
$letterPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$letterPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$graphics.DrawLine($letterPen, 93, 169, 128, 91)
$graphics.DrawLine($letterPen, 128, 91, 163, 169)
$graphics.DrawLine($letterPen, 105, 143, 151, 143)

$pngPath = Join-Path $resolvedOutput "icon.png"
$icoPath = Join-Path $resolvedOutput "icon.ico"
$bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$iconHandle = $bitmap.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$stream = [System.IO.File]::Create($icoPath)
$icon.Save($stream)
$stream.Close()
$icon.Dispose()
$graphics.Dispose()
$bitmap.Dispose()
$backgroundBrush.Dispose()
$backgroundPath.Dispose()
$markPen.Dispose()
$letterPen.Dispose()

Write-Output $icoPath
