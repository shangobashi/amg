$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\Shango\Documents\Code\bisimwamines'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$src = 'C:\Users\Shango\Documents\Code\bisimwamines\website'
$archiveRoot = 'C:\Users\Shango\Documents\Code\bisimwamines-archives'
$fullSnapshot = Join-Path $archiveRoot ("website-full-chaotic-snapshot-before-final-webgl-$stamp")
New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null
robocopy $src $fullSnapshot /E /XD node_modules .vercel .git | Out-Null
if ($LASTEXITCODE -gt 7) { throw "robocopy failed with exit code $LASTEXITCODE" }
$hashes = Get-ChildItem $fullSnapshot -Recurse -File |
  Get-FileHash -Algorithm SHA256 |
  Select-Object Path, Hash
$hashes | Export-Csv (Join-Path $fullSnapshot 'SHA256-MANIFEST.csv') -NoTypeInformation
@"
IMMUTABLE FULL SNAPSHOT.
Created before final WebGL restoration.
Do not edit this directory.
Do not deploy from this directory.
Do not overwrite this directory.
"@ | Set-Content (Join-Path $fullSnapshot 'DO-NOT-TOUCH.txt')
Set-Location 'C:\Users\Shango\Documents\Code\bisimwamines\website'
Write-Host '--- GIT STATUS BEFORE CHECKPOINT ---'
git status --short
Write-Host '--- GIT COMMIT ---'
git add .
$commitOutput = git commit -m "checkpoint: full chaotic root before final WebGL restoration" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host 'No commit created'
  Write-Host $commitOutput
} else {
  Write-Host $commitOutput
}
$tag = "afriplan-before-final-webgl-restoration-$stamp"
git tag $tag
Write-Output "STAMP=$stamp"
Write-Output "FULL_SNAPSHOT=$fullSnapshot"
Write-Output "GIT_TAG=$tag"
