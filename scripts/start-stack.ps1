#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$backend = Join-Path $repoRoot "enterpriseplatform"
$ui = Join-Path $repoRoot "ui_enterpriseplatform"

Write-Host "Starting Django (8001) and UI (8002) in new windows…" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backend'; .\scripts\dev.ps1"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ui'; npm run dev"
Write-Host "Wait ~30s for servers, then: cd testing; npm test" -ForegroundColor Green
