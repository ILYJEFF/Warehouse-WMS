$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$out = Join-Path $root "wms-deploy.zip"

if (Test-Path $out) { Remove-Item $out -Force }

$staging = Join-Path $env:TEMP "wms-deploy-$(Get-Random)"
New-Item -ItemType Directory -Path $staging | Out-Null

robocopy $root $staging /E /XD node_modules .next .git /XF .env wms-deploy.zip /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $out -Force
Remove-Item $staging -Recurse -Force

Write-Host ""
Write-Host "Created: $out"
Write-Host ""
Write-Host "NAS steps:"
Write-Host "  1. Upload wms-deploy.zip via UGREEN Files"
Write-Host "  2. Extract to shared/docker/wms"
Write-Host "  3. Docker -> Project -> path = that folder"
Write-Host "  4. Compose = docker-compose.yml -> Deploy (~5 min first build)"
