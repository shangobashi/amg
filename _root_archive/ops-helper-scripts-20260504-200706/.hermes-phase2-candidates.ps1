$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\Shango\Documents\Code\bisimwamines\website'
$fullSnapshot = 'C:\Users\Shango\Documents\Code\bisimwamines-archives\website-full-chaotic-snapshot-before-final-webgl-20260504-195150'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$candidateDir = ".\_root_archive\golden-webgl-candidates-$stamp"
New-Item -ItemType Directory -Force -Path $candidateDir | Out-Null
$patterns = @(
  'hero-bg-3d.*.js',
  'hero-bg-3d*.bak',
  'hero-bg-3d.test*.js',
  'hero-bg-3d-deployed*.js',
  'index.WORKING*.html',
  'styles.WORKING*.css',
  'styles.BACKUP*.css',
  'styles.before*.css',
  'bisimwa_*.js',
  'bisimwa_*.css',
  'fix_*.py'
)
Write-Host '--- REMAINING LOOSE ROOT MATCHES ---'
$remaining = [System.Collections.Generic.List[string]]::new()
foreach ($pattern in $patterns) {
  Get-ChildItem -File -Path . -Filter $pattern | ForEach-Object {
    $remaining.Add($_.Name)
    Write-Host $_.Name
  }
}
if ($remaining.Count -eq 0) { Write-Host 'NONE' }
$wanted = @(
  'hero-bg-3d.SCREENSHOT-BEAUTIFUL-WEBGL-v1.js',
  'hero-bg-3d.SCREENSHOT-BEAUTIFUL-WEBGL-v2.js',
  'hero-bg-3d.SCREENSHOT-BEAUTIFUL-WEBGL-v3.js',
  'hero-bg-3d.SCREENSHOT-BEAUTIFUL-WEBGL-v4-preserve-buffer.js',
  'hero-bg-3d.SCREENSHOT-BEAUTIFUL-WEBGL-v5-with-fallback.js',
  'hero-bg-3d.GEOLOGICAL-INTELLIGENCE-MESH-WEBGL-v4-dominant-mesh.js',
  'hero-bg-3d.GEOLOGICAL-FIELD-v2-20260503104446.js',
  'hero-bg-3d.SCREENSHOT-BEAUTIFUL-RECOVERED.js',
  'hero-bg-3d.SCREENSHOT-BEAUTIFUL-RECOVERED-FIXED.js'
)
$copied = [System.Collections.Generic.List[string]]::new()
Write-Host '--- CANDIDATE DISCOVERY ---'
foreach ($name in $wanted) {
  $match = Get-ChildItem -Path $fullSnapshot -Recurse -File -Filter $name | Select-Object -First 1
  if ($null -ne $match) {
    Copy-Item -LiteralPath $match.FullName -Destination (Join-Path $candidateDir $match.Name) -Force
    $copied.Add($match.FullName)
    Write-Host "COPIED: $($match.FullName)"
  } else {
    Write-Host "MISSING: $name"
  }
}
$copied | Set-Content (Join-Path $candidateDir 'COPIED-FILES.txt')
Write-Host '--- CANDIDATE DIR CONTENTS ---'
Get-ChildItem -File -Path $candidateDir | Sort-Object Name | Select-Object Name, Length | Format-Table -AutoSize
Write-Output "CANDIDATE_DIR=$(Resolve-Path $candidateDir)"
Write-Output "REMAINING_COUNT=$($remaining.Count)"
