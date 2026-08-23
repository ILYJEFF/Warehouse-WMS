# Copy WMS to NAS for UGREEN Docker Project (build on NAS)
# Run on your PC in PowerShell:
#   cd "C:\Users\Jeffrey Hammitt\Desktop\Techchefs CRM\wms"
#   .\copy-to-nas.ps1

$source = $PSScriptRoot
$dest = "\\192.168.0.24\docker\wms"

# UGREEN paths vary — try these if the above fails:
# \\192.168.0.24\shared\docker\wms
# \\192.168.0.24\home\docker\wms

Write-Host "Copying WMS to NAS: $dest"
Write-Host "(Skipping node_modules and .next — NAS will build fresh)"

if (-not (Test-Path $dest)) {
  Write-Host ""
  Write-Host "NAS folder not found at $dest"
  Write-Host "Open File Explorer and go to your NAS share, create folder: docker\wms"
  Write-Host "Then edit this script line: `$dest = '\\\\192.168.0.24\\YOUR_SHARE\\docker\\wms'"
  exit 1
}

robocopy $source $dest /E /XD node_modules .next .git /XF .env /NFL /NDL /NJH /NJS /nc /ns /np
if ($LASTEXITCODE -ge 8) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Done. On UGREEN:"
Write-Host "  1. Docker -> Project -> path = that wms folder on NAS"
Write-Host "  2. Paste docker-compose.ugreen.build.yml into compose"
Write-Host "  3. Deploy (first build ~5 min)"
