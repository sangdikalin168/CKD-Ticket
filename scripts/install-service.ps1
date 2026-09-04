<#
.SYNOPSIS
    Install (or update) the CKD-Ticket API as a Windows service on the server PC.

.DESCRIPTION
    Run ON the server, in an elevated PowerShell, from a checkout of this repo.
    That PC is the data gateway for the local network: the Ticket web app, the
    GraphQL API, member photos, and the check-in / check-out kiosks all go
    through the service this installs. Kiosks reach it over the LAN only.

    What it does:
      1. Builds the backend (tsc -> dist) and the frontend SPA, which the
         backend serves from frontend\dist. ts-node / nodemon are dev tools;
         the service runs plain "node dist\index.js".
      2. Writes backend\build-info.json (served at /version.json).
      3. Installs or updates the NSSM service: auto-start, restart on crash,
         rotated logs in backend\logs, environment from backend\prod.env.
      4. Opens TCP <Port> in Windows Firewall for the local subnet only.
         Pass -AllowFrom 'LocalSubnet,100.64.0.0/10' to also allow Tailscale.
      5. Starts the service, waits for /health, and prints the api.url each
         kiosk's config.json should use.

    Never touched: prod.env (secrets), the uploads directory, the database.
    Re-running is safe; it updates the existing service in place.

.PARAMETER DbService
    Windows service name of MySQL/MariaDB (e.g. 'MariaDB', 'mysql'). The API
    service is then made dependent on it so it starts after the database. If
    XAMPP's MySQL is started from the control panel rather than as a service,
    install it as a service first (XAMPP Control Panel -> Service column).

.PARAMETER NssmPath
    Path to nssm.exe. Defaults to <repo>\nssm\nssm.exe, then PATH.

.EXAMPLE
    .\scripts\install-service.ps1 -DbService MariaDB
.EXAMPLE
    .\scripts\install-service.ps1 -DryRun          # print what would change
#>
[CmdletBinding()]
param(
    # Repo root; defaults to the parent of this scripts\ folder (resolved below,
    # because $PSScriptRoot is not yet set while parameter defaults evaluate).
    [string]$Root = '',
    [string]$ServiceName = 'ckd-ticket-api',
    [int]$Port = 4000,
    [string]$AllowFrom = 'LocalSubnet',
    [string]$DbService = '',
    [string]$NssmPath = '',
    # Commit the deployed dist was built from. Pass it when deploying a bundle
    # built elsewhere: the server checkout's HEAD is not what is running.
    [string]$Commit = '',
    [switch]$SkipBuild,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

if (-not $Root) { $Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path) }
$Root = (Resolve-Path $Root).Path

$Backend  = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'
$Logs     = Join-Path $Backend 'logs'
$ProdEnv  = Join-Path $Backend 'prod.env'

function Step($m) { Write-Host ""; Write-Host "== $m" -ForegroundColor Cyan }
function Info($m) { Write-Host "   $m" }
function Warn($m) { Write-Host "   !! $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "   !! $m" -ForegroundColor Red; exit 1 }

# Runs a state-changing action, or just describes it under -DryRun.
function Change([string]$what, [scriptblock]$action) {
    if ($DryRun) { Info "[dry-run] $what"; return }
    Info $what
    & $action
}

# Native builds go through Start-Process so Windows PowerShell 5.1 does not
# wrap npm's stderr progress output in NativeCommandError under 'Stop'.
function Invoke-Build([string]$dir, [string]$cmd) {
    $p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/d', '/c', $cmd -WorkingDirectory $dir -NoNewWindow -Wait -PassThru
    if ($p.ExitCode -ne 0) { Die "failed in ${dir}: $cmd (exit $($p.ExitCode))" }
}

# -- 1. Preflight -----------------------------------------------------------
Step 'Preflight'
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin -and -not $DryRun) { Die 'run this from an elevated (Administrator) PowerShell' }

foreach ($exe in @('node', 'npm')) {
    if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) { Die "$exe not on PATH" }
}
$NodeExe = (Get-Command node).Source
$NodeVer = & node --version
Info "node: $NodeExe ($NodeVer)"

if (-not $NssmPath) {
    $candidate = Join-Path $Root 'nssm\nssm.exe'
    if (Test-Path $candidate) { $NssmPath = $candidate }
    elseif (Get-Command nssm -ErrorAction SilentlyContinue) { $NssmPath = (Get-Command nssm).Source }
}
if (-not $NssmPath -or -not (Test-Path $NssmPath)) {
    if ($DryRun) {
        Warn 'nssm.exe not found (needed for a real run): https://nssm.cc/download -> <repo>\nssm\nssm.exe'
        $NssmPath = '<nssm.exe>'
    } else {
        Die 'nssm.exe not found. Download https://nssm.cc/download and place it at <repo>\nssm\nssm.exe (or pass -NssmPath)'
    }
}
Info "nssm: $NssmPath"

if (-not (Test-Path $ProdEnv)) { Die "missing $ProdEnv - the service loads its secrets from there" }
$envText = Get-Content $ProdEnv -Raw
if ($envText -notmatch '(?m)^\s*UPLOADS_DIR\s*=\s*\S+') {
    Warn 'prod.env has no UPLOADS_DIR: member photos live inside the app tree, and a deploy that'
    Warn 'replaces it will delete them. Set UPLOADS_DIR (see scripts/migrate-uploads.py) when convenient.'
}
if ($DbService) {
    $svc = Get-Service -Name $DbService -ErrorAction SilentlyContinue
    if (-not $svc) { Die "database service '$DbService' not found (Get-Service). Omit -DbService or install MySQL as a service." }
    Info "database service: $DbService ($($svc.Status))"
} else {
    Warn 'no -DbService given: the API will not wait for the database at boot. It exits and NSSM'
    Warn 'retries every 5 s until MySQL is up, which works but is noisy in the logs.'
}

# -- 2. Build ---------------------------------------------------------------
if ($SkipBuild) {
    Step 'Build skipped (-SkipBuild)'
    if (-not (Test-Path (Join-Path $Backend 'dist\index.js'))) { Die 'backend\dist\index.js missing; run without -SkipBuild' }
} elseif ($DryRun) {
    Step 'Build (dry-run: not building)'
    Info "would run in ${Backend}: npm ci --no-audit --no-fund && npm run build"
    Info "would run in ${Frontend}: npm ci --no-audit --no-fund && npm run build"
} else {
    Step 'Building backend (tsc -> dist)'
    Invoke-Build $Backend 'npm ci --no-audit --no-fund && npm run build'
    if (-not (Test-Path (Join-Path $Backend 'dist\index.js'))) { Die 'build produced no backend\dist\index.js' }
    Step 'Building frontend SPA (served by the backend from frontend\dist)'
    Invoke-Build $Frontend 'npm ci --no-audit --no-fund && npm run build'
    if (-not (Test-Path (Join-Path $Frontend 'dist\index.html'))) { Die 'build produced no frontend\dist\index.html' }
}

# -- 3. build-info.json (-> /version.json) ----------------------------------
Step 'Writing build-info.json'
# PowerShell variable names are case-insensitive, so this must not be called
# $commit or it would clobber the -Commit parameter.
$buildCommit = $null
if ($Commit) {
    $buildCommit = $Commit
} elseif (Get-Command git -ErrorAction SilentlyContinue) {
    try { $buildCommit = (& git -C $Root rev-parse --short HEAD 2>$null | Out-String).Trim() } catch { $buildCommit = $null }
    if (-not $buildCommit) { $buildCommit = $null }
}
$info = [ordered]@{
    version   = Get-Date -Format 'yyyy.MM.dd.HHmm'
    commit    = $buildCommit
    buildTime = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
}
$infoJson = $info | ConvertTo-Json
Change "backend\build-info.json <- version $($info.version) commit $buildCommit" {
    Set-Content -Path (Join-Path $Backend 'build-info.json') -Value $infoJson -Encoding ascii
}

# -- 4. NSSM service --------------------------------------------------------
Step "Service '$ServiceName'"
Change "ensure log directory $Logs" { New-Item -ItemType Directory -Force $Logs | Out-Null }
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
    Change "stopping existing service (status $($existing.Status))" { & $NssmPath stop $ServiceName | Out-Null }
} else {
    Change "nssm install $ServiceName $NodeExe -r dotenv/config dist\index.js" {
        & $NssmPath install $ServiceName $NodeExe '-r dotenv/config dist\index.js'
        if ($LASTEXITCODE -ne 0) { Die 'nssm install failed' }
    }
}

# dotenv preloads prod.env before index.js runs; index.js's own
# require("dotenv").config() then finds no .env and is a no-op.
$settings = @(
    @('Application',         $NodeExe),
    @('AppParameters',       '-r dotenv/config dist\index.js'),
    @('AppDirectory',        $Backend),
    @('AppEnvironmentExtra', 'NODE_ENV=production', 'DOTENV_CONFIG_PATH=prod.env', "PORT=$Port"),
    @('DisplayName',         'CKD Ticket API'),
    @('Description',         "CKD-Ticket GraphQL API + web app on :$Port. Data gateway for the check-in/check-out kiosks on the LAN."),
    @('Start',               'SERVICE_AUTO_START'),
    @('AppStdout',           (Join-Path $Logs 'service.out.log')),
    @('AppStderr',           (Join-Path $Logs 'service.err.log')),
    @('AppRotateFiles',      '1'),
    @('AppRotateOnline',     '1'),
    @('AppRotateBytes',      '10485760'),
    @('AppExit',             'Default', 'Restart'),
    @('AppRestartDelay',     '5000'),
    @('AppThrottle',         '5000')
)
if ($DbService) { $settings += ,@('DependOnService', $DbService) }
foreach ($s in $settings) {
    $name = $s[0]
    $vals = $s[1..($s.Count - 1)]
    Change "nssm set $name $($vals -join ' ')" {
        & $NssmPath set $ServiceName $name @vals | Out-Null
        if ($LASTEXITCODE -ne 0) { Die "nssm set $name failed" }
    }
}

# -- 5. Firewall: LAN only by default --------------------------------------
Step "Firewall: allow TCP $Port from $AllowFrom"
$ruleName = "CKD Ticket API (TCP $Port)"
$remote = @($AllowFrom -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
Change "replace inbound rule '$ruleName' (RemoteAddress: $($remote -join ', '))" {
    Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP `
        -LocalPort $Port -RemoteAddress $remote -Profile Any | Out-Null
}
# An allow rule scoped to LocalSubnet is not enough on its own: Tailscale installs
# its own allow-everything rule for its adapter, and Windows Firewall permits a
# packet if ANY allow rule matches. Verified 2026-09-04: :4000 answered over
# Tailscale despite the rule above. Block rules win over allow rules, so pin one
# to the Tailscale interface unless the caller opted Tailscale in via -AllowFrom.
$blockName = "$ruleName block Tailscale"
if ($AllowFrom -match '100\.64\.0\.0/10') {
    Change "remove '$blockName' (Tailscale allowed via -AllowFrom)" {
        Get-NetFirewallRule -DisplayName $blockName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
    }
} elseif (Get-NetAdapter -InterfaceAlias Tailscale -ErrorAction SilentlyContinue) {
    Change "replace inbound BLOCK rule '$blockName' on the Tailscale interface" {
        Get-NetFirewallRule -DisplayName $blockName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
        New-NetFirewallRule -DisplayName $blockName -Direction Inbound -Action Block -Protocol TCP `
            -LocalPort $Port -InterfaceAlias Tailscale -Profile Any | Out-Null
    }
}

# -- 6. Start + verify ------------------------------------------------------
Step 'Starting service'
Change "nssm start $ServiceName" { & $NssmPath start $ServiceName | Out-Null }

if (-not $DryRun) {
    $healthy = $false
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 1
        try {
            $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/health" -UseBasicParsing -TimeoutSec 3
            if ($r.StatusCode -eq 200) { $healthy = $true; break }
        } catch { }
    }
    if (-not $healthy) { Die "service did not answer /health within 60 s - see $Logs\service.err.log" }
    $h = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/health" -UseBasicParsing
    $v = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/version.json" -UseBasicParsing
    Info "healthy: $($h.Content)"
    Info "version: $($v.Content)"
}

# -- 7. What the kiosks should point at -------------------------------------
Step 'Kiosk configuration'
$ips = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -notlike '100.*' } |
    Select-Object -ExpandProperty IPAddress)
if ($ips.Count -eq 0) { Warn 'no LAN IPv4 address found; check the network adapter' }
foreach ($ip in $ips) { Info "api.url: http://${ip}:$Port/graphql" }
Info 'Give this PC a fixed LAN address (DHCP reservation) so the kiosks never lose it.'
Info 'Create one kiosk login per gate PC:  npm run kiosk:create-user -- --username gate-checkin'
Info 'Then put url + username + password in that PC''s CKD-Check-In / CKD-Check-Out config.json.'
