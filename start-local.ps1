param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectPath = $PSScriptRoot
$runtimeNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (Test-Path -LiteralPath $runtimeNode) { $nodePath = $runtimeNode } else { $nodePath = (Get-Command node -ErrorAction Stop).Source }
$vitePath = Join-Path $projectPath 'node_modules\vite\bin\vite.js'
if (-not (Test-Path -LiteralPath $vitePath)) {
  Push-Location -LiteralPath $projectPath
  try {
    & npm.cmd install --ignore-scripts
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
  } finally { Pop-Location }
}
$url = 'http://127.0.0.1:5173/'
$running = $false
try { $running = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch {}
if (-not $running) {
  $logPath = Join-Path $projectPath 'artifacts'
  New-Item -ItemType Directory -Path $logPath -Force | Out-Null
  $arguments = '"' + $vitePath + '" --host 127.0.0.1 --port 5173 --strictPort'
  $process = Start-Process -FilePath $nodePath -ArgumentList $arguments -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logPath 'dev-server.log') -RedirectStandardError (Join-Path $logPath 'dev-server-error.log') -PassThru
  Set-Content -LiteralPath (Join-Path $logPath 'dev-server.pid') -Value $process.Id
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Milliseconds 500
    try { if ((Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200) { $running = $true; break } } catch {}
  }
  if (-not $running) { throw 'Local server did not start. Check artifacts/dev-server-error.log.' }
}
Write-Output "Ticketlab is running at $url"
if (-not $NoBrowser) { Start-Process $url }
