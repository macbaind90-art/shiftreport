Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host 'Installing dependencies...'
npm install

Write-Host 'Building portable Windows EXE...'
npm run build:win

Write-Host 'Done. Check the dist folder.'
