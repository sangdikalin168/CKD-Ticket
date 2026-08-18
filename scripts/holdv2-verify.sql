-- ============================================================================
-- hold_request v2 — POST-MIGRATION VERIFY (read-only)
--
--   "C:\xampp\mysql\bin\mysql.exe" -u root -p sportclub < scripts\holdv2-verify.sql
--
-- Run immediately after the backend has booted and applied the migration.
-- Every line should read OK. Anything else: stop and roll back (see the
-- runbook, docs/holdv2-migration-runbook.md).
-- ============================================================================

SELECT '=== 1. nothing was lost ===' AS ``;
SELECT (SELECT COUNT(*) FROM hold_request)    AS v1_rows,
       (SELECT COUNT(*) FROM hold_request_v2) AS v2_rows,
       IF((SELECT COUNT(*) FROM hold_request) = (SELECT COUNT(*) FROM hold_request_v2),
          'OK — every v1 row carried over', 'MISMATCH — investigate') AS verdict;

SELECT '=== 2. status mapping matches v1 ===' AS ``;
SELECT
  (SELECT COUNT(*) FROM hold_request_v2 WHERE status='PROCESSED')              AS v2_processed,
  (SELECT SUM(process='Done') FROM hold_request)                               AS v1_done,
  (SELECT COUNT(*) FROM hold_request_v2 WHERE status='REJECTED')               AS v2_rejected,
  (SELECT SUM(process<>'Done' AND checker_status='Rejected') FROM hold_request) AS v1_rejected,
  IF((SELECT COUNT(*) FROM hold_request_v2 WHERE status='PROCESSED') = (SELECT SUM(process='Done') FROM hold_request)
     AND (SELECT COUNT(*) FROM hold_request_v2 WHERE status='REJECTED') = (SELECT SUM(process<>'Done' AND checker_status='Rejected') FROM hold_request),
     'OK', 'MISMATCH — investigate') AS verdict;

SELECT '=== 3. referential integrity (the point of the exercise) ===' AS ``;
SELECT
  (SELECT COUNT(*) FROM hold_request_v2 hr LEFT JOIN users u ON u.user_id=hr.requested_by WHERE u.user_id IS NULL) AS orphan_requesters,
  (SELECT COUNT(*) FROM hold_request_v2 hr LEFT JOIN customer c ON c.customer_id=hr.customer_id WHERE c.customer_id IS NULL) AS orphan_customers,
  IF((SELECT COUNT(*) FROM hold_request_v2 hr LEFT JOIN users u ON u.user_id=hr.requested_by WHERE u.user_id IS NULL) = 0
     AND (SELECT COUNT(*) FROM hold_request_v2 hr LEFT JOIN customer c ON c.customer_id=hr.customer_id WHERE c.customer_id IS NULL) = 0,
     'OK — zero orphans (v1 had ~60% orphan requesters)', 'FAIL') AS verdict;

SELECT '=== 4. constraints and indexes present ===' AS ``;
SELECT
  SUM(constraint_name='uq_one_active')   AS uq_one_active,
  SUM(constraint_name='fk_hrv2_customer') AS fk_customer,
  SUM(constraint_name='fk_hrv2_req')      AS fk_requester,
  SUM(constraint_name='chk_hrv2_dates')   AS chk_dates,
  SUM(constraint_name='chk_hrv2_duty')    AS chk_duty
FROM information_schema.table_constraints
WHERE table_schema = DATABASE() AND table_name = 'hold_request_v2';

SELECT '=== 5. one live request per customer (engine-enforced) ===' AS ``;
SELECT COUNT(*) AS customers_with_multiple_live,
       IF(COUNT(*) = 0, 'OK', 'FAIL — uq_one_active is not doing its job') AS verdict
FROM (SELECT customer_id FROM hold_request_v2
      WHERE status IN ('PENDING','APPROVED')
      GROUP BY customer_id HAVING COUNT(*) > 1) d;

SELECT '=== 6. sentinels are gone ===' AS ``;
SELECT
  SUM(decided_by = 0 OR processed_by = 0)                                      AS zero_actor_ids,
  SUM(decided_at = '2000-01-01 00:00:00' OR processed_at = '2000-01-01 00:00:00') AS sentinel_dates,
  IF(SUM(decided_by = 0 OR processed_by = 0) IS NULL
     AND SUM(decided_at = '2000-01-01 00:00:00' OR processed_at = '2000-01-01 00:00:00') IS NULL,
     'OK — NULLs, not sentinels',
     IF(IFNULL(SUM(decided_by = 0 OR processed_by = 0),0)
        + IFNULL(SUM(decided_at='2000-01-01 00:00:00' OR processed_at='2000-01-01 00:00:00'),0) = 0,
        'OK — NULLs, not sentinels', 'FAIL')) AS verdict
FROM hold_request_v2;

SELECT '=== 7. v1 archive untouched ===' AS ``;
SELECT (SELECT COUNT(*) FROM hold_request) AS hold_request_rows,
       (SELECT COUNT(*) FROM hold)         AS hold_rows,
       'archive — read-only from here on' AS note;

SELECT '=== 8. deactivated shells cannot log in ===' AS ``;
SELECT COUNT(*) AS shell_users,
       IF(SUM(is_active <> 0) IS NULL OR SUM(is_active <> 0) = 0,
          'OK — all deactivated', 'FAIL — a shell is active') AS verdict
FROM users WHERE password = '!locked!';
