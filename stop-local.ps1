$ErrorActionPreference = 'Stop'
$pidPath = Join-Path $PSScriptRoot 'artifacts\dev-server.pid'
if (Test-Path -LiteralPath $pidPath) {
  $serverPid = [int](Get-Content -LiteralPath $pidPath)
  $server = Get-CimInstance Win32_Process -Filter "ProcessId = $serverPid"
  $expectedVite = Join-Path $PSScriptRoot 'node_modules\vite\bin\vite.js'
  if ($server -and $server.CommandLine.Contains($expectedVite) -and $server.CommandLine.Contains('--port 5173')) {
    Stop-Process -Id $serverPid
    Write-Output 'Ticketlab local server stopped.'
  } else { Write-Output 'No matching Ticketlab server is running.' }
} else { Write-Output 'No Ticketlab server PID file was found.' }
