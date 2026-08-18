-- ============================================================================
-- hold_request v2 — PREFLIGHT (read-only, safe to run any time)
--
--   "C:\xampp\mysql\bin\mysql.exe" -u root -p sportclub < scripts\holdv2-preflight.sql
--
-- Run this on the target database BEFORE deploying the backend. The migration
-- runs unattended at server boot, so anything that would abort it must be
-- known in advance. Every check prints VERDICT = OK or a specific problem.
-- ============================================================================

SELECT '=== 1. server capability ===' AS ``;
-- Needs >= 10.2: STORED generated columns (uq_one_active), CHECK enforcement,
-- ROW_NUMBER (backfill dedupe). Prod was 10.4 at last inspection.
SELECT VERSION() AS server_version,
       IF(SUBSTRING_INDEX(VERSION(),'.',1) > 10
          OR (SUBSTRING_INDEX(VERSION(),'.',1) = 10
              AND SUBSTRING_INDEX(SUBSTRING_INDEX(VERSION(),'.',2),'.',-1) >= 2),
          'OK', 'TOO OLD — needs MariaDB 10.2+') AS verdict;

SELECT '=== 2. has this migration already run? ===' AS ``;
SELECT IF(COUNT(*) = 0, 'OK — not yet applied', 'ALREADY APPLIED — nothing to do') AS verdict
FROM typeorm_migrations WHERE name = 'HoldRequestV21787374800000';

SELECT '=== 3. target table must not pre-exist ===' AS ``;
SELECT IF(COUNT(*) = 0, 'OK — clear', 'BLOCKER — hold_request_v2 already exists; drop it or skip') AS verdict
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'hold_request_v2';

SELECT '=== 4. BLOCKER CHECK: requests pointing at deleted customers ===' AS ``;
-- fk_hrv2_customer has no self-heal: the migration recreates deleted USERS but
-- never invents customers. Any row here aborts the migration mid-way.
SELECT COUNT(*) AS orphan_customer_rows,
       IFNULL(GROUP_CONCAT(DISTINCT customer_id ORDER BY customer_id), '-') AS missing_customer_ids,
       IF(COUNT(*) = 0, 'OK', 'BLOCKER — see remedy note below') AS verdict
FROM hold_request hr
WHERE NOT EXISTS (SELECT 1 FROM customer c WHERE c.customer_id = hr.customer_id);
-- Remedy if non-zero: either restore those customer rows, or delete/park the
-- offending hold_request rows, before deploying.

SELECT '=== 5. deleted staff the migration will recreate as shells ===' AS ``;
-- Informational: handled automatically (deactivated, cannot log in).
SELECT COUNT(*) AS shells_to_create,
       IFNULL(GROUP_CONCAT(uid ORDER BY uid), '-') AS user_ids,
       'OK — handled automatically' AS verdict
FROM (
    SELECT DISTINCT uid FROM (
        SELECT request_by   AS uid FROM hold_request UNION
        SELECT checked_by         FROM hold_request UNION
        SELECT approved_by        FROM hold_request UNION
        SELECT processed_by       FROM hold_request
    ) ids
    WHERE uid <> 0 AND uid NOT IN (SELECT user_id FROM users)
) x;

SELECT '=== 6. duplicate open requests (v2 permits one per customer) ===' AS ``;
-- Informational: the newest stays PENDING, older ones backfill as CANCELLED.
SELECT COUNT(*) AS customers_with_multiple_open,
       'OK — newest kept, older become CANCELLED' AS verdict
FROM (
    SELECT customer_id FROM hold_request
    WHERE process <> 'Done' AND checker_status <> 'Rejected'
    GROUP BY customer_id HAVING COUNT(*) > 1
) d;

SELECT '=== 7. expected result after migration ===' AS ``;
SELECT COUNT(*) AS rows_to_migrate,
       SUM(process = 'Done')                                    AS expect_processed,
       SUM(process <> 'Done' AND checker_status = 'Rejected')    AS expect_rejected,
       SUM(process <> 'Done' AND checker_status <> 'Rejected')   AS expect_pending_plus_cancelled
FROM hold_request;

SELECT '=== 8. users.is_active (added if absent) ===' AS ``;
SELECT IF(COUNT(*) = 0, 'will be added', 'already present — no-op') AS verdict
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'is_active';

SELECT '=== 9. OTHER PENDING MIGRATIONS — read before deploying ===' AS ``;
-- The backend runs ALL pending migrations at boot, not just this one.
SELECT name AS already_applied FROM typeorm_migrations ORDER BY id;
