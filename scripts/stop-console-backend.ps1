<#
.SYNOPSIS
    Stop the console-launched CKD-Ticket API so the NSSM service can own port 4000.

.DESCRIPTION
    Before the service existed the API ran from an interactive window:
        cmd /K npm start  ->  dotenv -e prod.env nodemon  ->  node ts-node src/index.ts
    Killing only the listener is useless (nodemon restarts it), so this finds the
    npm process at the top of that chain and kills the whole tree. The frontend's
    own `npm start` window (vite --host) is left alone.

    Also sets the old, stopped node-windows wrapper service (ckdserver.exe) to
    Disabled so it cannot start at boot and take the port from the new service.
    Reverse with:  sc config "ckdserver.exe" start= auto
#>
$ErrorActionPreference = 'Continue'

function Parent($p) {
    if (-not $p) { return $null }
    Get-CimInstance Win32_Process -Filter "ProcessId=$($p.ParentProcessId)" -ErrorAction SilentlyContinue
}

$dotenv = Get-CimInstance Win32_Process -Filter "name='node.exe'" |
    Where-Object { $_.CommandLine -match 'dotenv-cli' -and $_.CommandLine -match 'prod\.env' }
if (-not $dotenv) { "no console-launched backend found (dotenv -e prod.env)" }
foreach ($d in $dotenv) {
    $cmd1 = Parent $d          # cmd /d /s /c dotenv -e prod.env nodemon ...
    $npm  = Parent $cmd1       # node npm-cli.js start
    $root = $d
    if ($npm -and $npm.CommandLine -match 'npm-cli\.js') { $root = $npm }
    "killing backend tree from PID $($root.ProcessId): $($root.CommandLine)"
    & taskkill /PID $root.ProcessId /T /F | Out-Null
}
Start-Sleep -Seconds 2

# Anything still holding :4000 (a ts-node server reparented after its cmd died).
Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $p = Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)" -ErrorAction SilentlyContinue
    if ($p -and $p.Name -eq 'node.exe') {
        "killing leftover listener PID $($p.ProcessId): $($p.CommandLine)"
        & taskkill /PID $p.ProcessId /T /F | Out-Null
    }
}
Start-Sleep -Seconds 1
$left = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue
if ($left) { "PORT 4000 STILL IN USE by PID $($left.OwningProcess)"; exit 1 }
"port 4000 free"

$svc = Get-Service -Name 'ckdserver.exe' -ErrorAction SilentlyContinue
if ($svc) {
    & sc.exe config "ckdserver.exe" start= disabled | Out-Null
    "ckdserver.exe service set to Disabled (was $($svc.StartType), status $($svc.Status))"
}
