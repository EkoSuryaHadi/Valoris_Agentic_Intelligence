[CmdletBinding()]
param(
  [string]$ContainerName = 'valoris-postgres',
  [int]$Port = 55433,
  [string]$DatabaseUser = 'valoris',
  [string]$DatabasePassword = 'valoris_local',
  [string]$DatabaseName = 'valoris',
  [switch]$Seed
)

$ErrorActionPreference = 'Stop'
$created = $false

function Invoke-Podman([string[]]$Arguments) {
  & podman @Arguments
  if ($LASTEXITCODE -ne 0) { throw "podman command failed: podman $($Arguments -join ' ')" }
}

$existing = (@(& podman ps -a --filter "name=^$ContainerName$" --format '{{.Names}}') -join '').Trim()
if ($existing -eq $ContainerName) {
  $running = (@(& podman ps --filter "name=^$ContainerName$" --format '{{.Names}}') -join '').Trim()
  if ($running -ne $ContainerName) { Invoke-Podman @('start', $ContainerName) }
} else {
  $created = $true
  Invoke-Podman @('run', '-d', '--name', $ContainerName, '-e', "POSTGRES_USER=$DatabaseUser", '-e', "POSTGRES_PASSWORD=$DatabasePassword", '-e', "POSTGRES_DB=$DatabaseName", '-p', "$Port`:5432", 'docker.io/library/postgres:16-alpine')
}

for ($attempt = 1; $attempt -le 30; $attempt++) {
  & podman exec $ContainerName pg_isready -U $DatabaseUser -d $DatabaseName *> $null
  if ($LASTEXITCODE -eq 0) { break }
  if ($attempt -eq 30) { throw 'PostgreSQL did not become ready within 30 seconds.' }
  Start-Sleep -Seconds 1
}

function Apply-Sql([string]$Path) {
  Get-Content -Raw $Path | podman exec -i $ContainerName psql -v ON_ERROR_STOP=1 -U $DatabaseUser -d $DatabaseName
  if ($LASTEXITCODE -ne 0) { throw "SQL apply failed: $Path" }
}

if ($created) { Apply-Sql 'docs/database/schema.sql' }
Apply-Sql 'database/migrations/004_phase2_transactions.sql'
Apply-Sql 'database/migrations/005_phase3_forecast.sql'
Apply-Sql 'database/migrations/006_phase4_release_readiness.sql'
Apply-Sql 'database/migrations/007_phase24_audit_trail.sql'
if ($Seed) { Apply-Sql 'database/seed.sql' }

Write-Output "PostgreSQL ready: postgresql://$DatabaseUser@127.0.0.1:$Port/$DatabaseName"
