# Deploy runbook — transfer workflow guardrails

Applies `HoldRequestV21787374800000` and `TransferWorkflowGuardrails1787418000000`
to production, plus the backend and frontend changes that go with them.

**Status: prepared, not deployed.** Rehearsed end-to-end against a restored copy
of `backups/sportclub-20260817-210141.sql`; production has not been touched.

---

## Why this exists

Production data showed a membership transfer request executed **nine times**
(requests 2, 11 and 20 twice each — two pairs share a timestamp to the second,
i.e. a double-click race). Every execution rewrote two customers'
`end_membership_date`. Two executions persisted `receiver_new_end = '0000-00-00'`;
customer 59 never received their transferred days.

Nothing in the database prevented any of it: no unique key, no state check, no
transaction, no foreign keys, and every actor id came from the client.

---

## Pre-flight

Run these first. If any answer differs, **stop** and re-read this document.

```sql
-- 1. Migration ledger must hold EXACTLY this one row.
SELECT * FROM typeorm_migrations;
--    expected: (1, 1786964658879, 'RedesignAdditive1786964658879')
```

`RedesignAdditive` **is** applied in production — its row exists and all five of
its tables (`facility`, `package`, `purchase`, `entitlement`, `check_in`) are
present. Do **not** "reconcile" or clear that row: it would re-run and die on its
unguarded `CREATE TABLE facility`, blocking both new migrations.

```sql
-- 2. Expected shape of the data being migrated.
SELECT COUNT(*) FROM transfer_request;   -- 37
SELECT COUNT(*) FROM transfer;           -- 41
SELECT COUNT(*) FROM hold_request;       -- 409
SELECT request_id, COUNT(*) FROM transfer GROUP BY request_id HAVING COUNT(*) > 1;
--    expected: 1 -> 9, 2 -> 2, 11 -> 2, 20 -> 2   (the 11 surplus rows)
```

```powershell
# 3. Server reachable, printer idle, backup written.
ssh -o BatchMode=yes root@100.94.217.72 "hostname"
```

---

## Backup — non-negotiable

```powershell
# On the server. This is the only way back if a DDL step fails part-way:
# MySQL/MariaDB AUTO-COMMIT DDL, so TypeORM's transaction CANNOT roll back a
# failed ALTER. There is no undo except restore.
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
& 'C:\xampp\mysql\bin\mysqldump.exe' -u root --single-transaction --routines sportclub `
  > "D:\CKD-System-backups\pre-transfer-guardrails-$stamp.sql"
```

Verify the dump is non-trivial (~63 MB) before continuing.

---

## Order of operations

Migrations first, then backend, then frontend. The backend is written against
the new schema and the frontend against the new GraphQL contract, so they must
land together — but the migration is backward-compatible with the OLD backend
(it only adds constraints and nulls sentinels), which is what makes this order
safe.

### 1. Stop the API

Transfers must not be executed while the schema changes.

### 2. Apply migrations explicitly

```powershell
cd D:\CKD-System\backend
npm run migration:show:prod    # expect: [X] RedesignAdditive, [ ] HoldRequestV2, [ ] TransferWorkflowGuardrails
npm run migration:run:prod
```

Migrations are **no longer applied at boot**. That path used to be a floating
promise whose `.catch()` only logged, so the server would listen even after a
failed schema change. Apply them here, read the output, and only then start the
API.

Expected final ledger: three rows.

### 3. Post-migration verification

```sql
SELECT checker_status, approver_status, process, COUNT(*)
FROM transfer_request GROUP BY 1,2,3;
--    expected: Approved/Approved/Done 30, Approved/Approved/Pending 4,
--              Rejected/Pending/Pending 3

SELECT (SELECT COUNT(*) FROM transfer)            AS live,       -- 30
       (SELECT COUNT(*) FROM transfer_superseded) AS archived;   -- 11

SELECT status, COUNT(*) FROM hold_request_v2 GROUP BY status;
--    expected: PROCESSED 398, REJECTED 10, PENDING 1  (v1 hold_request untouched: 409)
```

`transfer_superseded` is the forensic record of the duplicate executions.
**Never delete it** — it is the only evidence of what happened to those members.

### 4. Deploy backend + frontend, start the API

The frontend must ship with this backend: four GraphQL documents changed
(actor ids removed, `ApprovalStatus` enum, `CreateTransfer` reduced to
`request_id` + optional `fee`) and `graphql.tsx` was regenerated.

### 5. Smoke test on the real system

1. Open the transfer list — all 37 requests visible, including the two whose
   sender was deleted (the query now LEFT JOINs customers).
2. The four `Approved/Approved/Pending` requests must still show a working
   **Process** button. If they show as already-processed, the `processed_by`
   sentinel fix did not ship.
3. File → check → approve → execute one real transfer. Confirm the dates move
   by exactly the sender's remaining days.
4. Press Process twice quickly. The second must fail with
   *"Request is not approved, does not exist, or was already executed"*.

---

## Rollback

**Schema:** `npm run migration:revert:prod` twice (guardrails, then HoldRequestV2).
`down()` deliberately does **not** restore `transfer_superseded` rows into
`transfer` and does not drop the table — the archive survives a revert.

If a migration fails **part-way**, revert is not enough: DDL already committed.
Restore the pre-migration dump.

**Code:** redeploy the previous backend and frontend together. The old backend
works against the new schema for reads, but its `CreateTransfer` sends columns
the new schema still has — with the addition that `uq_transfer_request` will now
refuse a second execution. That is the desired behaviour even during a rollback.

---

## Known limitations, deliberately accepted

- **`checked_date` / `approved_date` on historical rows are fiction.** They were
  stamped from a module-level `NOW` constant frozen at process boot. Unrepairable;
  treat pre-migration review timestamps as untrusted.
- **No FKs on `users` columns.** 24 of 37 `request_by` values reference deleted
  staff accounts. Audit history outlives staff; a constraint could only be
  satisfied by destroying it.
- **No customer FKs on `transfer`.** 11 rows reference customer 1, deleted. Same
  reasoning — it is an append-only historical record.
- **The already-damaged rows are not repaired here.** Requests 1, 2, 11 and 20
  moved dates multiple times. Assess separately: the first row of each chain in
  `transfer_superseded` anchors the intended values. Customer 59's lost days are
  a commercial decision, not a technical one.
- **`fee` was hardcoded to 1** by the old resolver, so sums over historical rows
  are meaningless. New transfers record a real value (default 0).
