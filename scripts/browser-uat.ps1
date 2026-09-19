[CmdletBinding()]
param(
  [string]$BaseUrl = 'http://127.0.0.1:4175'
)

$ErrorActionPreference = 'Stop'
$cli = @('--yes', '--package', '@playwright/cli', 'playwright-cli')

function Invoke-Playwright([string[]]$Arguments) {
  $output = & npx.cmd @cli @Arguments 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) { throw "Playwright CLI failed: $output" }
  return $output
}

Invoke-Playwright @('open', "$BaseUrl/#overview") | Out-Null
$expression = '(async()=>{const links=[...document.getElementsByTagName(String.fromCharCode(97))].filter(x=>x.dataset.screen);const views=[...document.getElementsByTagName(String.fromCharCode(115,101,99,116,105,111,110))].filter(x=>x.dataset.view);const results=[];for(const link of links){link.click();await new Promise(resolve=>setTimeout(resolve,0));const visible=views.find(x=>!x.classList.contains(String.fromCharCode(105,115,45,104,105,100,100,101,110)));results.push(link.dataset.screen+String.fromCharCode(61)+visible.dataset.view)}return results.join(String.fromCharCode(44))})()'
$result = Invoke-Playwright @('eval', $expression)

foreach ($screen in @('overview','structure','baseline','imports','transactions','forecast','evm','changes','cash-flow','risks','audit')) {
  $expected = ('{0}={0}' -f $screen)
  if ($result -notmatch [regex]::Escape($expected)) { throw "Browser UAT failed for screen: $screen" }
}

$console = Invoke-Playwright @('console')
if ($console -match 'Errors:\s*[1-9]' -or $console -match '\[ERROR\]') { throw "Browser console contains errors: $console" }
Write-Output 'Browser UAT passed: 11 screens and console checks are clean.'
