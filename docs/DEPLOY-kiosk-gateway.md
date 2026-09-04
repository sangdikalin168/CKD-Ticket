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
hold-request v2 and transfer-guardrail migrations that
[DEPLOY-transfer-guardrails.md](DEPLOY-transfer-guardrails.md) marks
**"prepared, not deployed"**. Check on the server:

```bat
git -c safe.directory=* -C D:\CKD-System log -1 --oneline
```

If that commit is older than `e15e829`, the compiled `dist` in this bundle
expects tables the production database may not have. **Follow the
transfer-guardrails runbook first** (backup, pre-flight, `migration:run:prod`),
then come back here. Nothing in this branch adds a migration of its own.

## 1. What to copy to the server

Built on the dev machine (`CKD-Ticket-deploy-<date>.zip` on the Desktop):

```
backend\dist\              compiled API (node dist\index.js)
backend\package.json       adds the kiosk:create-user scripts
backend\package-lock.json
frontend\dist\             SPA, served by the API
scripts\install-service.ps1
nssm\nssm.exe              NSSM 2.24 win64 (sha256 f689ee9a…)
docs\DEPLOY-kiosk-gateway.md
```

Never overwrite: `backend\prod.env`, `D:\CKD-System\shared\uploads`.

```powershell
# from the dev machine
scp -o BatchMode=yes "$env:USERPROFILE\Desktop\CKD-Ticket-deploy-<date>.zip" root@100.94.217.72:D:\CKD-System-deploy.zip
ssh root@100.94.217.72
```

On the server (cmd.exe):

```bat
powershell -NoProfile -Command "Expand-Archive -Force D:\CKD-System-deploy.zip D:\CKD-System"
cd /d D:\CKD-System\backend
npm ci --omit=dev --no-audit --no-fund
```

## 2. Stop whatever serves :4000 today

The API currently runs outside a service manager (the old `ckd-server`
node-windows service is *Stopped*). Find and stop it, and remove whatever
starts it at logon (Task Scheduler / Startup folder), or the new service will
fail to bind port 4000 after the next reboot.

```bat
netstat -ano | findstr :4000 | findstr LISTENING
wmic process where "name='node.exe'" get processid,commandline
taskkill /PID <pid> /F
```

## 3. Install the service (elevated PowerShell)

```powershell
cd D:\CKD-System
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-service.ps1 -SkipBuild -DbService mysql
```

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
outside the LAN it must not (firewall rule is LocalSubnet only).

## Rollback

```bat
nssm stop ckd-ticket-api
```

then start the previous process the old way. The database is untouched by this
branch, so no data rollback is needed. To remove the service entirely:
`nssm remove ckd-ticket-api confirm`.
