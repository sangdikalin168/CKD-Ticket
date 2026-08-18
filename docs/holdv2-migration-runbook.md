# hold_request v2 — migration runbook

Target: the office server (`root@100.94.217.72` over Tailscale), app at
`D:\CKD-System`, XAMPP MySQL, database `sportclub`.

Everything below has been rehearsed on the dev database: the migration was
applied, reverted, and re-applied cleanly, and the full request → approve →
process cycle was exercised through the real GraphQL API.

---

## ⚠ Read this first: migrations run automatically at boot

`backend/src/index.ts` calls `runMigrations()` on startup when
`NODE_ENV=production`. **Deploying the backend runs every pending migration,
not just this one.** As of writing, `src/migrations/` contains two unapplied:

| Migration | Status |
|---|---|
| `1787374800000-HoldRequestV2` | rehearsed, verified, ready |
| `1787418000000-TransferWorkflowGuardrails` | **never run anywhere — not even on dev** |

The Transfer migration `DELETE`s rows from `transfer`, adds a `UNIQUE KEY`, and
rewrites `transfer_request` sentinel columns. It may well be correct — but it
has not been rehearsed, and shipping it to production as a side effect of this
deploy is not the same as choosing to ship it.

**Decide before deploying.** Either:

- **(a) Ship only hold v2** — move `1787418000000-TransferWorkflowGuardrails.ts`
  out of `src/migrations/` for this deploy, then bring it back for its own
  rehearsed deploy later. This is the low-risk default.
- **(b) Ship both** — first rehearse Transfer the same way this one was:
  run it on a restored copy, verify, revert, re-run.

A failed migration does not stop the API from listening; it just leaves a
half-applied schema behind a running server. That is the outcome to avoid.

---

## 1. Back up (non-negotiable)

MySQL DDL auto-commits, so this migration is **not atomic** — a failure
midway leaves partial schema. The backup is the real rollback.

```cmd
cd /d D:\CKD-System
"C:\xampp\mysql\bin\mysqldump.exe" -u root -p --single-transaction ^
  --routines --triggers sportclub > D:\CKD-System-backups\sportclub-pre-holdv2.sql
```

Confirm the file ends with `-- Dump completed` before continuing.

## 2. Preflight (read-only, safe any time)

```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root -p sportclub < scripts\holdv2-preflight.sql
```

Every check prints a verdict. Two can block:

- **Check 3** — `hold_request_v2` already exists. Stop.
- **Check 4** — hold requests referencing deleted customers. The migration
  recreates deleted *staff* automatically but never invents *customers*, so
  `fk_hrv2_customer` would fail. Restore those customer rows, or remove the
  offending hold_request rows, then re-run preflight.

Checks 5 and 6 are informational — deleted staff and duplicate open requests
are both handled automatically.

Note what check 7 predicts; you will compare against it in step 5.

## 3. Deploy the code

Build the frontend on the dev machine and ship both halves (there is no
deploy script for CKD-Ticket yet — the sibling `CKD-POS/scripts/deploy-windows.ps1`
is the model if you want one):

```bash
cd CKD-Ticket/frontend && npm run build      # -> frontend/dist
```

Ship `backend/src` and `frontend/dist` to `D:\CKD-System`, preserving
server-owned state — **never** overwrite `backend\prod.env` or the uploads
junction at `backend\uploads` → `D:\CKD-System\shared\uploads`.

## 4. Restart the backend

However it is currently started (`start_system.bat`, or the `ckd-server`
service if it has been revived). Watch the console: the migration announces
itself.

```
[HoldRequestV2] recreated N deleted-user shell(s) for the audit trail
[HoldRequestV2] N stale duplicate open request(s) backfilled as CANCELLED
Applied 1 migration(s)
```

## 5. Verify

```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root -p sportclub < scripts\holdv2-verify.sql
```

All eight checks must read `OK`, and the counts must match what preflight
check 7 predicted. On the dev rehearsal: 409 rows carried over, 398 PROCESSED
/ 10 REJECTED / 1 PENDING, **zero orphans** where v1 had ~60% orphan
requesters.

Then exercise it once in the UI: raise a hold request for a test member,
approve it from a *different* admin account, and process it. Confirm the
member's end date moves by exactly the hold length.

## 6. If it goes wrong

```cmd
cd /d D:\CKD-System\backend
npx dotenv -e prod.env -- npx typeorm-ts-node-commonjs migration:revert -d src/data-source.ts
```

Rehearsed on dev: drops `hold_request_v2`, removes the deactivated shell
users, drops `users.is_active`, and leaves `hold_request` / `hold` **exactly
as they were**. If the revert itself fails, restore the step-1 dump.

Because the change is additive, the previous backend build also still works
unchanged against the migrated database — rolling back the *code* alone is a
valid holding position.

---

## What actually changes for staff

- **One live hold request per member**, enforced by the database. A second
  one is refused with a clear message instead of silently creating the
  duplicate that produced the double-processed request 265/266.
- **You cannot approve your own request.** In v1, 384 of 398 processed
  requests were processed by their own requester. Two people are now needed —
  confirm the counter staff have separate logins before deploying, or this
  will block real work.
- **The membership extension is computed at processing time**, from the
  member's end date as it stands then. Filing a request early no longer
  grants free days, and a renewal made while a request waits is no longer
  erased.
- **A hold on a lapsed membership runs from today**, not from the date it
  expired.
- Rejected requests leave the pending queue for good.

## Deliberately unchanged

`hold_request` and `hold` remain as a read-only archive; nothing deletes
them. Old invoices still resolve because v2 preserves the original
`request_id` values. The v1 GraphQL resolver is still registered and still
works — the UI simply no longer calls it.
