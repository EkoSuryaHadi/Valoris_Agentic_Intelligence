[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ApiBaseUrl,
  [string]$BearerToken,
  [string]$ProjectId
)

$ErrorActionPreference = 'Stop'
$base = $ApiBaseUrl.TrimEnd('/')

function Get-Json([string]$Url, [hashtable]$Headers = @{}) {
  $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -Headers $Headers
  [pscustomobject]@{ Status = [int]$response.StatusCode; Headers = $response.Headers; Body = $response.Content }
}

$health = Get-Json "$base/health"
if ($health.Status -ne 200) { throw "Health check failed with HTTP $($health.Status)." }
if ($health.Headers['x-content-type-options'] -ne 'nosniff') { throw 'Missing x-content-type-options security header.' }
if (-not $health.Headers['x-request-id']) { throw 'Missing x-request-id correlation header.' }
Write-Output "Health OK: HTTP $($health.Status), request ID $($health.Headers['x-request-id'])"

if ($BearerToken) {
  $headers = @{ Authorization = "Bearer $BearerToken" }
  $projects = Get-Json "$base/api/v1/projects" $headers
  if ($projects.Status -ne 200) { throw "Authenticated project read failed with HTTP $($projects.Status)." }
  Write-Output "Authenticated project boundary OK: HTTP $($projects.Status)"

  if ($ProjectId) {
    $wbs = Get-Json "$base/api/v1/projects/$ProjectId/wbs" $headers
    if ($wbs.Status -ne 200) { throw "Project-scoped WBS read failed with HTTP $($wbs.Status)." }
    Write-Output "Project scope OK: $ProjectId WBS read returned HTTP $($wbs.Status)"
    $baselines = Get-Json "$base/api/v1/projects/$ProjectId/baselines" $headers
    if ($baselines.Status -ne 200) { throw "Project-scoped baseline read failed with HTTP $($baselines.Status)." }
    Write-Output "Project scope OK: $ProjectId baseline read returned HTTP $($baselines.Status)"
  }
} else {
  Write-Output 'Authenticated checks skipped: provide -BearerToken for staging identity verification.'
}
