param(
  [ValidateSet('thinkspace', 'positive', 'negative')]
  [string]$Suite = 'thinkspace',
  [switch]$Headed,
  [switch]$Debug
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..

if (-not (Test-Path '.env') -and (Test-Path '.env.example')) {
  Write-Warning 'No testing/.env found. Copy .env.example to .env and configure credentials.'
}

$args = @('playwright', 'test', 'tests/thinkspace/workflow', '--project=erp-authenticated', '--project=chromium-guest')

switch ($Suite) {
  'positive' { $args += '--grep', '@positive' }
  'negative' { $args += '--grep', '@negative' }
  default { }
}

if ($Headed) { $args += '--headed' }
if ($Debug) { $args += '--debug' }

Write-Host "npx $($args -join ' ')" -ForegroundColor Cyan
& npx @args
exit $LASTEXITCODE
