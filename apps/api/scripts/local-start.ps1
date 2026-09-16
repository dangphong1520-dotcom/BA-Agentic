$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
Set-Location -LiteralPath $repoRoot

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed (exit $LASTEXITCODE)." }
}

Invoke-Checked 'pnpm' @('install', '--frozen-lockfile')
Invoke-Checked 'pnpm' @('--filter', 'api', 'db:setup')
Invoke-Checked 'docker' @('compose', '-f', 'apps/api/docker-compose.yml', '--env-file', 'apps/api/.env', 'up', '-d', '--wait')
Invoke-Checked 'pnpm' @('--filter', 'api', 'db:generate')
Invoke-Checked 'pnpm' @('--filter', 'api', 'db:migrate')
Invoke-Checked 'pnpm' @('--filter', 'api', 'db:seed')
Write-Host 'Open http://127.0.0.1:3000 . Stop applications with Ctrl+C; PostgreSQL data is preserved.'
Invoke-Checked 'pnpm' @('dev')
