$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..

Write-Host 'Installing Playwright browsers with OS dependencies...'
npx playwright install --with-deps
