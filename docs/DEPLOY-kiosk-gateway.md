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

`frontend\dist` is **not** in the bundle; it ships separately (see 1b).
Runtime dependencies are unchanged, so **no `npm ci` is needed** (verified:
every module `dist` requires loads from the server's existing `node_modules`).
Skipping it matters on this 3.9 GB box, which had ~900 MB free.

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

### 1b. Frontend (the SPA the API serves and the desktop app loads)

The API serves `D:\CKD-System\frontend\dist` as the web UI, and the desktop
app (`CKD-Ticket.exe`) loads the same pages from `http://localhost:4000`, so
shipping a new `frontend\dist` updates both at once and needs no restart.
Build on the dev machine (`npm run build` in `frontend`, ~3.8 MB), stage it,
then mirror it over the live folder (robocopy never leaves the folder missing
mid-swap):

```powershell
# from the dev machine, in CKD-Ticket
scp -r frontend/dist root@100.94.217.72:D:/CKD-System/frontend/dist.new
ssh root@100.94.217.72 "robocopy D:\CKD-System\frontend\dist.new D:\CKD-System\frontend\dist /mir /r:2 /w:2 /np /nfl /ndl & rmdir /s /q D:\CKD-System\frontend\dist.new & curl -s http://localhost:4000/ | findstr index-"
```

The last line must print the `assets/index-<hash>.js` of the build you just
made (robocopy exit codes 0–7 are success). Verify from the server itself: the
firewall blocks :4000 over Tailscale.

Deployed this way on 2026-09-04: `index-a751e100.js`, which adds the
**Printer** menu page (Sale + Admin). On the till, open Printer once, pick the
receipt printer (`RP80` on the current till, which has no Windows default
printer) and use *Test print*. The choice is saved in `config.json` next to
`CKD-Ticket.exe`, and the desktop app fetches SumatraPDF from
`/desktop/tools/SumatraPDF.exe` on the server the first time it prints.

Later the same day: `index-87d3dbf9.js` fixed the Customer Report page
(its inline `GetCustomers` query lacked the required `limit`/`offset`), made
the counter stay logged in across restarts (the 12 h access token is now
renewed from the 30-day refresh cookie at start-up and five minutes before it
expires; **Log Out** calls the `logout` mutation so the cookie is invalidated
server-side), and desktop 1.0.7 writes
`%LOCALAPPDATA%\CKD-Ticket\logs\desktop.log` on the till (read it over SSH:
`type C:\Users\MHG\AppData\Local\CKD-Ticket\logs\desktop.log`) and
re-injects the print/fingerprint bridge whenever a page reload drops it.

Desktop 1.0.8 fixed the physical receipt. The PDF route rendered a Letter
page that SumatraPDF shrank and centred on the RP80's continuous roll
("80(72.1) x 99999 mm"): a tiny receipt after a long blank feed. Receipts now
go the way Electron sent them: headless Chrome rasterises the ticket at the
printer's DPI (`desktop/ckd_desktop/gdi_print.py`), the bitmap is scaled to
the driver's printable width and drawn top-left on its default paper over
GDI, and the driver cuts after the content. The PDF route stays as fallback
(now with a page sized to the paper and `-print-settings portrait`). Every
print logs `receipt raster WxH px @ dpi -> printer` in `desktop.log`.
`paper_width_mm` in `config.json` only affects the fallback; the raster route
reads the width from the driver.

Desktop 1.0.9 (and kiosks 1.0.2) fixed the update relaunch. The swap batch
file inherited PyInstaller's `_PYI_*` environment from the exiting app, so
the new exe took itself for a child of a running instance, tried to verify
its parent process (cmd.exe, already gone) and died with "Security
validation failure: failed to obtain executable path for parent process".
The updater now strips those variables and sets
`PYINSTALLER_RESET_ENVIRONMENT=1`. The very first update *from* a build older
than this still shows that dialog once: click OK and start the exe by hand.

Frontend `index-9ca90d87.js`: the Renew and Hold dialogs use the same
DateInput as the reports (typed DD/MM/YYYY plus the browser's own date
picker) because the old popup calendar was clipped by the dialog's scroll
box on 1366x768. Tailwind is 3.4 now (the `size-*` utilities the shadcn
components use did not exist in 3.3, so several icons rendered unsized).

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
