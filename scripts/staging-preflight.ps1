[CmdletBinding()]
param(
  [string]$EnvFile = '.env.staging',
  [string]$AuthHealthUrl,
  [string]$ObjectStorageHealthUrl,
  [string]$QueueHealthUrl
)

$ErrorActionPreference = 'Stop'
$required = @(
  'DATABASE_URL', 'AUTH_ISSUER_URL', 'AUTH_CLIENT_ID', 'AUTH_CLIENT_SECRET',
  'APP_BASE_URL', 'OBJECT_STORAGE_BUCKET', 'QUEUE_URL', 'ENCRYPTION_KEY'
)

if (-not (Test-Path -LiteralPath $EnvFile)) { throw "Environment file not found: $EnvFile" }
$values = @{}
foreach ($line in Get-Content -LiteralPath $EnvFile) {
  if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$' -and -not $line.TrimStart().StartsWith('#')) {
    $values[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
  }
}

$missing = @($required | Where-Object { -not $values.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($values[$_]) -or $values[$_] -match 'replace(-with)?|example\.com' })
if ($missing.Count -gt 0) { throw "Missing or placeholder staging values: $($missing -join ', ')" }
if ($values['LLM_PROVIDER'] -and $values['LLM_PROVIDER'] -ne 'disabled' -and [string]::IsNullOrWhiteSpace($values['LLM_API_KEY'])) { throw 'LLM_API_KEY is required when LLM_PROVIDER is enabled.' }

if (-not $values['DATABASE_URL'].StartsWith('postgresql://')) { throw 'DATABASE_URL must be a PostgreSQL URL.' }
if ($values['ENCRYPTION_KEY'].Length -lt 32) { throw 'ENCRYPTION_KEY must be at least 32 characters.' }

Write-Output "Configuration OK: $($required.Count) required values present; secrets were not printed."

function Test-Endpoint([string]$Name, [string]$Url) {
  if (-not $Url) { return }
  $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 15
  if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) { throw "$Name health check returned HTTP $($response.StatusCode)." }
  Write-Output "$Name health OK: HTTP $($response.StatusCode)"
}

Test-Endpoint 'Auth provider' $AuthHealthUrl
Test-Endpoint 'Object storage' $ObjectStorageHealthUrl
Test-Endpoint 'Queue/worker' $QueueHealthUrl
