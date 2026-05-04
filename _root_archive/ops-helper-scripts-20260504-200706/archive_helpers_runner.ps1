$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\Shango\Documents\Code\bisimwamines\website'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dest = ".\_root_archive\ops-helper-scripts-$stamp"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Get-ChildItem -File -Filter '.hermes-*.ps1' | ForEach-Object {
  Move-Item -LiteralPath $_.FullName -Destination (Join-Path $dest $_.Name) -Force
  Write-Host "MOVED: $($_.Name)"
}
Write-Host '--- ROOT FILES AFTER HELPER ARCHIVE ---'
Get-ChildItem -File | Sort-Object Name | Select-Object Name, Length | Format-Table -AutoSize
Write-Output "OPS_ARCHIVE=$(Resolve-Path $dest)"
