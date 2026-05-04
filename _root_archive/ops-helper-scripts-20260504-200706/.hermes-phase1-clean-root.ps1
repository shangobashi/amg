$ErrorActionPreference = 'Stop'
Set-Location 'C:\Users\Shango\Documents\Code\bisimwamines\website'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$looseArchive = ".\_root_archive\loose-root-backups-$stamp"
New-Item -ItemType Directory -Force -Path $looseArchive | Out-Null
$protected = @(
  'index.html',
  'styles.css',
  'hero-bg-3d.js',
  'app.js',
  'i18n.js',
  '.env.local',
  'beryllium.html',
  'gold.html',
  'tungsten.html',
  'lithium.html',
  'opportunities.html',
  'data-room.html',
  'privacy.html',
  'responsible-sourcing.html',
  'contact.html'
)
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
$moved = [System.Collections.Generic.List[string]]::new()
foreach ($pattern in $patterns) {
  Get-ChildItem -File -Path . -Filter $pattern | ForEach-Object {
    if ($protected -contains $_.Name) {
      Write-Host "SKIP protected file: $($_.Name)"
    } else {
      $dest = Join-Path $looseArchive $_.Name
      Move-Item -LiteralPath $_.FullName -Destination $dest -Force
      $moved.Add($_.Name)
      Write-Host "MOVED: $($_.Name)"
    }
  }
}
$moved | Set-Content (Join-Path $looseArchive 'MOVED-FILES.txt')
Write-Host '--- ROOT FILES AFTER CLEANUP ---'
Get-ChildItem -File | Sort-Object Name | Select-Object Name, Length | Format-Table -AutoSize
Write-Output "LOOSE_ARCHIVE=$(Resolve-Path $looseArchive)"
