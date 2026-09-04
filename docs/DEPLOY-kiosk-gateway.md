# Deploy runbook — kiosk gateway (branch `kiosk-gateway`, commit 6ae5f9d+)

Turns the Ticket server PC into the LAN data gateway for the gate kiosks:

- API runs as a Windows service (`ckd-ticket-api`, NSSM) from compiled
  `backend\dist`, auto-start, restart on crash, logs in `backend\logs`.
- `GET /health` and `GET /version.json` for monitoring and deploy checks.
- Kiosk service accounts (role `kiosk`) that can only call the check-in /
  check-out operations; member photos and a 90-day fingerprint window for gates.
- TCP 4000 opened in Windows Firewall for the **local subnet only**.

Server facts (see the `ckd-ticket-prod-server` notes): Windows 10 Pro,
`root@100.94.217.72` over Tailscale (SSH lands in **cmd.exe**), LAN
`192.168.1.20`, app at `D:\CKD-System`, XAMPP MySQL as service **`mysql`**,
Node 18, no nssm. `prod.env` already has `UPLOADS_DIR=D:\CKD-System\shared\uploads`.

---

## 0. Before you start — is the hold-v2 / transfer work deployed?

This branch sits on top of `main` at `e15e829`, which includes the
hold-request v2 and transfer-guardrail migrations. **Verified 2026-09-04 by a
read-only probe:** `typeorm_migrations` holds all three rows
(RedesignAdditive, HoldRequestV2, TransferWorkflowGuardrails), the
`hold_request_v2` / `facility` / `entitlement` / `check_in` / `transfer*`
tables and `customer.image_path` exist, and the server's `backend\src` matches
`origin/main` (it was file-copied there; its git HEAD lags at `90b5191`, which
is why `git status` shows many "modified" files — that is not drift).
Nothing in this branch adds a migration. If you deploy from a different
commit later, re-check with the same query:

```sql
SELECT id, name FROM typeorm_migrations ORDER BY id;
```

## 1. What to copy to the server

Built on the dev machine (`CKD-Ticket-deploy-<date>.zip` on the Desktop):

```
backend\dist\              compiled API (node dist\index.js)
backend\package.json       adds the kiosk:create-user scripts (deps unchanged)
backend\package-lock.json
scripts\install-service.ps1
scripts\stop-console-backend.ps1
nssm\nssm.exe              NSSM 2.24 win64 (sha256 f689ee9a…)
docs\DEPLOY-kiosk-gateway.md
```

`frontend\dist` is deliberately **not** in the bundle: the server already has
the identical build (`assets/index-66f3ebed.js`, 19 Aug). Runtime dependencies
are unchanged, so **no `npm ci` is needed** (verified: every module `dist`
requires loads from the server's existing `node_modules`). Skipping it matters
on this 3.9 GB box, which had ~900 MB free.

Never overwrite: `backend\prod.env`, `D:\CKD-System\shared\uploads`.

```powershell
# from the dev machine
scp -o BatchMode=yes "$env:USERPROFILE\Desktop\CKD-Ticket-deploy-<date>.zip" root@100.94.217.72:D:/CKD-System-deploy.zip
ssh root@100.94.217.72
```

On the server (the SSH session lands in cmd.exe and is already elevated):

```bat
mkdir D:\CKD-System-backups\deploy-<date>
copy /y D:\CKD-System\backend\package.json D:\CKD-System-backups\deploy-<date>\
copy /y D:\CKD-System\backend\package-lock.json D:\CKD-System-backups\deploy-<date>\
powershell -NoProfile -Command "Expand-Archive -Force D:\CKD-System-deploy.zip D:\CKD-System"
dir D:\CKD-System\backend\dist\index.js D:\CKD-System\nssm\nssm.exe
```

## 2. Stop the console-launched API

Today the API runs from an interactive window: `cmd /K npm start` →
`dotenv -e prod.env nodemon` → `node ts-node src/index.ts` (PID chain seen
2026-09-04; nothing in Task Scheduler / Startup / Run keys starts it, so it is
started by hand after a reboot). Killing only the listener is useless because
nodemon restarts it. This script kills the whole tree, leaves the frontend's
own `npm start` (vite) window alone, confirms :4000 is free, and sets the old
stopped `ckdserver.exe` wrapper service to Disabled so it cannot grab the port
at boot (reverse with `sc config "ckdserver.exe" start= auto`):

```bat
powershell -NoProfile -ExecutionPolicy Bypass -File D:\CKD-System\scripts\stop-console-backend.ps1
```

## 3. Install the service

```bat
cd /d D:\CKD-System
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-service.ps1 -SkipBuild -DbService mysql -Commit d1fab7b
```

`-Commit` stamps `/version.json` with the commit the bundle was built from,
because the server checkout's HEAD is not what is running.

`-SkipBuild` because dist was built on the dev machine (the 4 GB server should
not run tsc/vite). The script writes `build-info.json`, installs/updates the
NSSM service depending on `mysql`, opens TCP 4000 for `LocalSubnet`, starts
the service, waits for `/health`, and prints the LAN `api.url` for the kiosks.

Expected:

```
healthy: {"status":"ok","db":"up",...}
version: {"name":"ckd-ticket-api","version":"2026.09.xx.xxxx","commit":...}
api.url: http://192.168.1.20:4000/graphql
```

The Cloudflare tunnel keeps pointing at `localhost:4000`, so the public web
app is unaffected; only the process behind the port changed.

## 4. Create one kiosk login per gate PC

```bat
cd /d D:\CKD-System\backend
npm run kiosk:create-user:prod -- --username gate-checkin  --display Check-in-gate
npm run kiosk:create-user:prod -- --username gate-checkout --display Check-out-gate
```

Each prints a username + password **once**. Re-run the same command to reset a
password. These accounts cannot use the staff web UI.

## 5. Gate PCs (Check-In / Check-Out)

Bundles on the dev Desktop: `CKD-Check-In-gate-<date>.zip`,
`CKD-Check-Out-gate-<date>.zip` (source + built frontend, no venv, no
`config.json`).

On each gate PC:

1. Unzip over the existing app folder (keep the PC's `.venv`).
2. `.\.venv\Scripts\pip install -r requirements.txt` (PyMySQL is gone; nothing new).
3. Copy `config.example.json` to `config.json`; set `api.url` to
   `http://192.168.1.20:4000/graphql` and the kiosk username/password from step 4.
   Check-In: set `station.place` (`SWIM` / `GYM` / `STEAM` or `""`).
4. Start the app. Status bar should read `Fingerprint ready (~470 templates)`.

Deploy order matters: **server (steps 1–3) before the kiosks** — the new kiosk
build queries fields the old API does not have.

## 6. Verify

```bat
curl http://127.0.0.1:4000/health
curl http://127.0.0.1:4000/version.json
sc query ckd-ticket-api
```

From a gate PC: `curl http://192.168.1.20:4000/health` must answer; from
outside the LAN it must not. Note the LocalSubnet allow rule alone is NOT
enough: Tailscale adds its own allow-all rule for its adapter, so the script
also installs an explicit *block* for TCP 4000 on the Tailscale interface
(verified 2026-09-04: :4000 answered over Tailscale until that block existed).
Pass `-AllowFrom 'LocalSubnet,100.64.0.0/10'` to allow Tailscale instead.

Deployed 2026-09-04 12:57 with this runbook; every check above passed.
Known pre-existing issue seen in `service.err.log`: the print dispatcher polls
`print_job` every 2 s and that table does not exist in production (no
migration creates it; dev relied on synchronize). Receipt printing through
the print worker cannot work until a migration adds the table.

## Rollback

```bat
nssm stop ckd-ticket-api
```

then start the previous process the old way. The database is untouched by this
branch, so no data rollback is needed. To remove the service entirely:
`nssm remove ckd-ticket-api confirm`.
