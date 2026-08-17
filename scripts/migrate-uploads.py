"""Move server-owned uploads out of the deployable tree, once, safely.

WHY THIS EXISTS
---------------
Member photos used to live at ``backend/uploads`` — a sibling of ``backend/src``,
i.e. *inside* the directory a deploy replaces. Any deploy that mirrors the app
tree (``robocopy /MIR``, ``rsync --delete``, a release-directory swap, or simply
unzipping a build over the top) deletes every photo on the machine silently,
with no error and no warning.

``backend/src/Utils/paths.ts`` now reads ``UPLOADS_DIR`` so the files can live
anywhere. This script performs the matching one-time move on the server:

    D:\\CKD-System\\backend\\uploads   ->  D:\\CKD-System\\shared\\uploads

and leaves a directory junction behind at the old path.

THE JUNCTION IS THE POINT
-------------------------
The junction is what makes this a zero-downtime change. Code that still resolves
``backend/uploads`` (i.e. any build predating ``UPLOADS_DIR``) keeps working,
because the old path now points at the new location. So this can be run BEFORE
the new backend is deployed, with no restart and no window where photos 404.
Once the new code ships and reads ``UPLOADS_DIR``, the junction is merely
harmless — and a deploy that deletes it destroys only a link, never the data.

SAFETY
------
Nothing is deleted. In order: verify the source, take an MD5-verified backup,
make an MD5-verified copy at the destination, rename the original aside, create
the junction, re-verify every hash *through* the junction, then prove the live
backend still serves a real photo over HTTP. Any mismatch aborts before the next
step; a failed ``mklink`` restores the original name. Two independent copies of
the data exist before anything is moved.

USAGE
-----
Needs ``paramiko`` locally, and an SSH account on the server with local
administrator rights (``mklink /J`` requires it).

    pip install paramiko

    # Preferred: key auth. With your public key in the server's
    # ProgramData\\ssh\\administrators_authorized_keys, no password exists
    # anywhere in the command.
    $env:CKD_SSH_HOST = '<server>'
    $env:CKD_SSH_USER = '<user>'
    python scripts/migrate-uploads.py --dry-run   # inspect, change nothing
    python scripts/migrate-uploads.py

    # Fallback: password auth. Read-Host keeps it out of shell history.
    $env:CKD_SSH_PASS = Read-Host 'SSH password'
    python scripts/migrate-uploads.py
    $env:CKD_SSH_PASS = $null

The script is idempotent: if the junction already exists it reports that and
exits without touching anything.
"""
from __future__ import annotations

import argparse
import os
import sys

try:
    import paramiko
except ImportError:  # pragma: no cover
    sys.exit("paramiko is required:  pip install paramiko")

REMOTE_SCRIPT = r"C:\Windows\Temp\ckd_uploads_migrate.ps1"

# Defaults match the production layout; override if the install moves.
APP_ROOT = os.environ.get("CKD_APP_ROOT", r"D:\CKD-System")
BACKUP_ROOT = os.environ.get("CKD_BACKUP_ROOT", r"D:\CKD-System-backups")
HEALTH_PORT = os.environ.get("CKD_BACKEND_PORT", "4000")

# The remote half. Hashes are compared source-against-destination at run time
# rather than hardcoded here, so the script does not rot as photos are added.
POWERSHELL = r"""
$ErrorActionPreference = 'Stop'
function Die($m)  { Write-Output "ABORT: $m"; exit 1 }
function Step($m) { Write-Output "== $m" }
function Ok($m)   { Write-Output "   ok $m" }

$root    = '__APP_ROOT__'
$dryRun  = [bool]__DRY_RUN__
$uploads = Join-Path $root 'backend\uploads'
$shared  = Join-Path $root 'shared\uploads'
$envFile = Join-Path $root 'backend\prod.env'
$stamp   = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup  = Join-Path '__BACKUP_ROOT__' "uploads-$stamp"

function Inventory($base) {
  $map = @{}
  foreach ($f in (Get-ChildItem $base -Recurse -File -Force -ErrorAction SilentlyContinue)) {
    $map[$f.FullName.Replace($base,'')] = (Get-FileHash $f.FullName -Algorithm MD5).Hash
  }
  return $map
}

function AssertSame($a, $b, $label) {
  foreach ($k in $a.Keys) {
    if (-not $b.ContainsKey($k)) { Die "$label is missing $k" }
    if ($b[$k] -ne $a[$k])       { Die "$label has a different hash for $k" }
  }
  if ($a.Keys.Count -ne $b.Keys.Count) {
    Die "$label has $($b.Keys.Count) files, expected $($a.Keys.Count)"
  }
}

# 0. Preconditions -----------------------------------------------------------
Step 'Preconditions'
if (-not (Test-Path $uploads)) { Die "$uploads does not exist" }
$item = Get-Item $uploads -Force
if ($item.LinkType) {
  Write-Output "   -- $uploads is already a $($item.LinkType) -> $($item.Target)"
  Write-Output '== NOTHING TO DO =='
  exit 0
}
$source = Inventory $uploads
if ($source.Keys.Count -eq 0) { Die "$uploads is empty - refusing to guess" }
$bytes = (Get-ChildItem $uploads -Recurse -File -Force | Measure-Object Length -Sum).Sum
Ok "source: $($source.Keys.Count) files, $bytes bytes"

if ($dryRun) {
  Write-Output ''
  Write-Output 'DRY RUN - would do:'
  Write-Output "  backup      $uploads -> $backup"
  Write-Output "  copy        $uploads -> $shared"
  Write-Output "  rename      $uploads -> $uploads.pre-junction-$stamp"
  Write-Output "  junction    $uploads -> $shared"
  Write-Output "  prod.env    append UPLOADS_DIR=$shared"
  Write-Output '== DRY RUN COMPLETE =='
  exit 0
}

# 1. Backup ------------------------------------------------------------------
Step "Backing up to $backup"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
& robocopy $uploads $backup /E /R:1 /W:1 /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -ge 8) { Die "robocopy to backup failed ($LASTEXITCODE)" }
AssertSame $source (Inventory $backup) 'backup'
Ok 'backup verified'

# 2. Copy to the new home ----------------------------------------------------
Step "Creating $shared"
New-Item -ItemType Directory -Path $shared -Force | Out-Null
& robocopy $uploads $shared /E /R:1 /W:1 /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -ge 8) { Die "robocopy to shared failed ($LASTEXITCODE)" }
AssertSame $source (Inventory $shared) 'shared'
Ok 'copy verified'

# 3. Swap in the junction ----------------------------------------------------
# Renamed, never deleted: if anything below fails the data is still right here.
$aside = "$uploads.pre-junction-$stamp"
Step "Renaming original -> $(Split-Path $aside -Leaf)"
Rename-Item -LiteralPath $uploads -NewName (Split-Path $aside -Leaf)
if (-not (Test-Path $aside)) { Die 'rename failed' }
Ok 'original preserved'

Step 'Creating junction'
$out = & cmd /c mklink /J "$uploads" "$shared" 2>&1
if (-not (Test-Path $uploads)) {
  Rename-Item -LiteralPath $aside -NewName 'uploads'
  Die "mklink failed: $out - original restored"
}
$link = Get-Item $uploads -Force
if ($link.LinkType -ne 'Junction') { Die "expected a Junction, got '$($link.LinkType)'" }
Ok "junction -> $($link.Target)"

# 4. Re-verify through the junction ------------------------------------------
Step 'Verifying through the junction'
AssertSame $source (Inventory $uploads) 'via junction'
Ok 'every file readable through the junction, hashes match'

# 5. Prove the live backend still serves a photo -----------------------------
Step 'Checking the running backend still serves uploads'
$photo = $source.Keys | Where-Object { $_ -match '\.(jpg|jpeg|png)$' } | Select-Object -First 1
if (-not $photo) {
  Ok 'no image files to probe - skipped'
} else {
  $url = "http://127.0.0.1:__PORT__/uploads" + ($photo -replace '\\','/')
  try {
    $r = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 10
    if ($r.StatusCode -ne 200) { Die "$url returned HTTP $($r.StatusCode)" }
    Ok "live backend served $($photo.Trim('\')): $($r.StatusCode), $($r.RawContentLength) bytes"
  } catch { Die "live photo request failed: $($_.Exception.Message)" }
}

# 6. Point the new code at the new location ----------------------------------
# Inert until a build containing Utils/paths.ts is deployed.
Step 'Setting UPLOADS_DIR in prod.env'
if (-not (Test-Path $envFile)) {
  Ok 'prod.env not found - skipped (set UPLOADS_DIR by hand)'
} else {
  Copy-Item $envFile "$envFile.bak-$stamp" -Force
  if ((Get-Content $envFile) -match '^\s*UPLOADS_DIR\s*=') {
    Ok 'UPLOADS_DIR already present - left alone'
  } else {
    Add-Content -Path $envFile -Value '' -Encoding ascii
    Add-Content -Path $envFile -Value '# Server-owned uploads, deliberately outside the deployed tree.' -Encoding ascii
    Add-Content -Path $envFile -Value "UPLOADS_DIR=$shared" -Encoding ascii
    $keys = (Get-Content $envFile | Where-Object { $_ -match '^\s*[A-Za-z_]+\s*=' } |
             ForEach-Object { ($_ -split '=')[0].Trim() })
    if ($keys -notcontains 'UPLOADS_DIR') { Die 'failed to append UPLOADS_DIR' }
    Ok "appended; prod.env backed up as prod.env.bak-$stamp"
  }
}

Write-Output ''
Write-Output '== DONE =='
Write-Output "  data      : $shared"
Write-Output "  junction  : $uploads -> $($link.Target)"
Write-Output "  original  : $aside  (delete once satisfied)"
Write-Output "  backup    : $backup"
Write-Output ''
Write-Output "  rollback  : rmdir `"$uploads`" ; Rename-Item `"$aside`" uploads"
"""


def build_script(dry_run: bool) -> str:
    return (
        POWERSHELL.replace("__APP_ROOT__", APP_ROOT)
        .replace("__BACKUP_ROOT__", BACKUP_ROOT)
        .replace("__PORT__", HEALTH_PORT)
        .replace("__DRY_RUN__", "$true" if dry_run else "$false")
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="inspect and report what would change, without changing anything",
    )
    args = parser.parse_args()

    try:
        host = os.environ["CKD_SSH_HOST"]
        user = os.environ["CKD_SSH_USER"]
    except KeyError as missing:
        print(
            f"missing environment variable {missing}. "
            "Set CKD_SSH_HOST and CKD_SSH_USER (CKD_SSH_PASS only if the "
            "server has no key for you).",
            file=sys.stderr,
        )
        return 2

    # Key auth is the default and the point: with a key installed, no password
    # is present in the environment, the process table, or shell history.
    password = os.environ.get("CKD_SSH_PASS")
    using_key = password is None
    print(f"connecting to {user}@{host} via {'key' if using_key else 'password'} auth\n")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        host, username=user, password=password, timeout=20,
        allow_agent=using_key, look_for_keys=using_key,
    )

    try:
        # Uploaded and run by path: -EncodedCommand would exceed cmd.exe's
        # ~8 KB command-line limit for a script this size.
        sftp = client.open_sftp()
        with sftp.open(REMOTE_SCRIPT, "w") as fh:
            fh.write(build_script(args.dry_run))
        sftp.close()

        _, stdout, stderr = client.exec_command(
            f'powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass '
            f'-File "{REMOTE_SCRIPT}"',
            timeout=600,
        )
        body = stdout.read().decode("utf-8", "replace")
        print(body)
        errors = stderr.read().decode("utf-8", "replace").strip()
        if errors and not errors.startswith("#< CLIXML"):
            print("[stderr]", errors[:1500], file=sys.stderr)
    finally:
        client.exec_command(f'cmd /c del /q "{REMOTE_SCRIPT}"')
        client.close()

    if "ABORT:" in body:
        return 1
    return 0 if any(m in body for m in ("== DONE ==", "NOTHING TO DO", "DRY RUN COMPLETE")) else 1


if __name__ == "__main__":
    sys.exit(main())
