$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = ".\backups\hero-webgl-close-before-microfix-$stamp"
New-Item -ItemType Directory -Force -Path $backup | Out-Null
Copy-Item .\hero-bg-3d.js "$backup\hero-bg-3d.CLOSE-BEFORE-MICROFIX.js"
Copy-Item .\styles.css "$backup\styles.CLOSE-BEFORE-MICROFIX.css"
Copy-Item .\index.html "$backup\index.CLOSE-BEFORE-MICROFIX.html"
Write-Output "Backup path: $backup"
Write-Output "STAMP: $stamp"
