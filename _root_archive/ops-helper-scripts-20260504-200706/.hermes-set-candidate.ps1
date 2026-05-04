param(
  [Parameter(Mandatory=$true)][string]$CandidatePath,
  [Parameter(Mandatory=$true)][string]$CacheBust
)
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Shango\Documents\Code\bisimwamines\website'
Set-Location $root
Copy-Item -LiteralPath $CandidatePath -Destination (Join-Path $root 'hero-bg-3d.js') -Force
$index = Get-Content (Join-Path $root 'index.html') -Raw
$index = [regex]::Replace($index, 'hero-bg-3d\.js\?v=[^"'']+', ('hero-bg-3d.js?v=' + $CacheBust), 1)
Set-Content (Join-Path $root 'index.html') $index
Write-Output ('ACTIVE_CANDIDATE=' + $CandidatePath)
Write-Output ('CACHE_BUST=' + $CacheBust)
