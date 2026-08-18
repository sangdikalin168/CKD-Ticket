import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * hold_request v2 — one status machine, real constraints, honest audit stamps.
 *
 * Replaces the four-role hold_request/hold pair whose controls existed only in
 * the UI (see the 2026-08-18 review: 96% of processed requests bypassed the
 * approver, request 265/266 was processed twice, 60% of actor ids point at
 * hard-deleted users, and checked_date was stamped from a boot-time constant).
 *
 * Additive: the old hold_request and hold tables are left untouched as a
 * frozen archive. The v2 table takes over from the moment the resolvers are
 * repointed. Design decisions:
 *
 *  - Single ENUM status. REJECTED/CANCELLED are terminal, so queue queries
 *    stop returning rejected corpses (10 rows sat "Pending" forever in v1).
 *  - Actors are NULLable with FKs to users. "Hasn't happened" is NULL, not 0
 *    and not '2000-01-01'.
 *  - uq_one_active: a STORED generated column that carries customer_id only
 *    while the request is live (PENDING/APPROVED) and NULL otherwise; UNIQUE
 *    ignores NULLs, so the ENGINE rejects a second live request per customer.
 *    This is the exact bug behind all seven duplicate pairs in v1.
 *  - old_end/new_end are written AT PROCESSING TIME from the customer's
 *    current end date (v1 snapshotted them at request time, which both minted
 *    free days and erased renewals made while the request waited).
 *  - fee is DECIMAL(10,2) on the request itself; the separate hold table
 *    recorded nothing but a hardcoded 1.
 *  - legacy flag: backfilled v1 rows are exempt from the two CHECK
 *    constraints (17 v1 rows were self-decided; we keep that history honest
 *    instead of nulling it away).
 *
 * Also: users gains is_active for soft-delete, and the three hard-deleted
 * user ids referenced throughout v1 history (1, 5, 6) are recreated as
 * deactivated shells so the FK backfill resolves and old actions display a
 * name instead of nothing.
 */
export class HoldRequestV21787374800000 implements MigrationInterface {
    name = 'HoldRequestV21787374800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── users: soft delete ────────────────────────────────────────────
        // IF NOT EXISTS: some environments already carry this column from
        // manual experimentation; MariaDB (10.0.2+) makes this a no-op there.
        await queryRunner.query(`
            ALTER TABLE \`users\`
            ADD COLUMN IF NOT EXISTS \`is_active\` tinyint NOT NULL DEFAULT 1
        `);

        // Recreate the hard-deleted actors v1 history points at, deactivated
        // and unable to log in (random bcrypt-shaped junk that verifies never).
        // INSERT IGNORE: harmless if an id was somehow restored already.
        await queryRunner.query(`
            INSERT IGNORE INTO \`users\`
                (\`user_id\`, \`display_name\`, \`phone\`, \`username\`, \`password\`, \`role\`, \`image\`, \`tokenVersion\`, \`is_active\`)
            VALUES
                (1, 'Deleted user #1', 'deleted-1', 'deleted_user_1', '!locked!', 'Sale', '', 0, 0),
                (5, 'Deleted user #5', 'deleted-5', 'deleted_user_5', '!locked!', 'Sale', '', 0, 0),
                (6, 'Deleted user #6', 'deleted-6', 'deleted_user_6', '!locked!', 'Sale', '', 0, 0)
        `);

        // ── the v2 table ──────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE \`hold_request_v2\` (
                \`request_id\`     int NOT NULL AUTO_INCREMENT,
                \`customer_id\`    int NOT NULL,
                \`requested_by\`   int NOT NULL,
                \`requested_at\`   datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`reason\`         varchar(255) NOT NULL,
                \`from_date\`      date NOT NULL,
                \`to_date\`        date NOT NULL,
                \`status\`         enum ('PENDING','APPROVED','REJECTED','PROCESSED','CANCELLED') NOT NULL DEFAULT 'PENDING',
                \`decided_by\`     int NULL,
                \`decided_at\`     datetime NULL,
                \`decision_note\`  varchar(255) NULL,
                \`processed_by\`   int NULL,
                \`processed_at\`   datetime NULL,
                \`old_end\`        date NULL,
                \`new_end\`        date NULL,
                \`fee\`            decimal(10,2) NOT NULL DEFAULT 0.00,
                \`legacy\`         tinyint NOT NULL DEFAULT 0,
                \`active_customer\` int AS (IF(\`status\` IN ('PENDING','APPROVED'), \`customer_id\`, NULL)) STORED,
                PRIMARY KEY (\`request_id\`),
                UNIQUE INDEX \`uq_one_active\` (\`active_customer\`),
                INDEX \`idx_hrv2_customer\` (\`customer_id\`, \`request_id\`),
                INDEX \`idx_hrv2_queue\` (\`status\`, \`requested_at\`),
                CONSTRAINT \`fk_hrv2_customer\` FOREIGN KEY (\`customer_id\`)  REFERENCES \`customer\`(\`customer_id\`),
                CONSTRAINT \`fk_hrv2_req\`      FOREIGN KEY (\`requested_by\`) REFERENCES \`users\`(\`user_id\`),
                CONSTRAINT \`fk_hrv2_dec\`      FOREIGN KEY (\`decided_by\`)   REFERENCES \`users\`(\`user_id\`),
                CONSTRAINT \`fk_hrv2_proc\`     FOREIGN KEY (\`processed_by\`) REFERENCES \`users\`(\`user_id\`),
                CONSTRAINT \`chk_hrv2_dates\`   CHECK (\`legacy\` = 1 OR \`from_date\` <= \`to_date\`),
                CONSTRAINT \`chk_hrv2_duty\`    CHECK (\`legacy\` = 1 OR \`decided_by\` IS NULL OR \`decided_by\` <> \`requested_by\`)
            ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
        `);

        // ── backfill from the v1 pair ─────────────────────────────────────
        // Status map (v1 cross-tab has exactly these shapes):
        //   process='Done'                          -> PROCESSED
        //   checker_status='Rejected'               -> REJECTED  (finally terminal)
        //   otherwise                               -> PENDING
        // Sentinels 0 / '2000-01-01' become NULL. processed_at comes from the
        // hold row's hold_date (the only real processing timestamp v1 has);
        // old_end/new_end are copied as-is for PROCESSED rows because v1
        // applied new_end verbatim — for those rows the snapshot IS what
        // processing did. request_id is preserved so old invoices still match.
        //
        // MAX(hold_date): one v1 request (265/266's sibling) has two hold
        // rows; the later one is when the double-processing actually landed.
        await queryRunner.query(`
            INSERT INTO \`hold_request_v2\`
                (\`request_id\`, \`customer_id\`, \`requested_by\`, \`requested_at\`, \`reason\`,
                 \`from_date\`, \`to_date\`, \`status\`,
                 \`decided_by\`, \`decided_at\`, \`decision_note\`,
                 \`processed_by\`, \`processed_at\`, \`old_end\`, \`new_end\`, \`fee\`, \`legacy\`)
            SELECT
                hr.\`request_id\`,
                hr.\`customer_id\`,
                hr.\`request_by\`,
                hr.\`request_date\`,
                hr.\`reason\`,
                hr.\`from_date\`,
                hr.\`to_date\`,
                CASE
                    WHEN hr.\`process\` = 'Done' THEN 'PROCESSED'
                    WHEN hr.\`checker_status\` = 'Rejected' THEN 'REJECTED'
                    ELSE 'PENDING'
                END,
                NULLIF(hr.\`checked_by\`, 0),
                IF(hr.\`checked_date\` <= '2000-01-01 23:59:59', NULL, hr.\`checked_date\`),
                NULLIF(hr.\`checker_comment\`, ''),
                IF(hr.\`process\` = 'Done', NULLIF(hr.\`processed_by\`, 0), NULL),
                IF(hr.\`process\` = 'Done',
                   COALESCE(h.\`processed_at\`,
                            IF(hr.\`checked_date\` <= '2000-01-01 23:59:59', hr.\`request_date\`, hr.\`checked_date\`)),
                   NULL),
                IF(hr.\`process\` = 'Done', hr.\`old_end\`, NULL),
                IF(hr.\`process\` = 'Done', hr.\`new_end\`, NULL),
                COALESCE(h.\`fee\`, 0.00),
                1
            FROM \`hold_request\` hr
            LEFT JOIN (
                SELECT \`request_id\`, MAX(\`hold_date\`) AS processed_at, MAX(\`fee\`) AS fee
                FROM \`hold\`
                WHERE \`request_id\` <> 0
                GROUP BY \`request_id\`
            ) h ON h.\`request_id\` = hr.\`request_id\`
        `);

        // Keep AUTO_INCREMENT clear of the preserved v1 ids.
        const [{ next }] = await queryRunner.query(
            `SELECT COALESCE(MAX(\`request_id\`), 0) + 1 AS next FROM \`hold_request_v2\``
        );
        await queryRunner.query(
            `ALTER TABLE \`hold_request_v2\` AUTO_INCREMENT = ${Number(next)}`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`hold_request_v2\``);
        // Remove the recreated shells only if they are still the deactivated
        // placeholders this migration inserted (an admin may have revived one).
        await queryRunner.query(`
            DELETE FROM \`users\`
            WHERE \`user_id\` IN (1, 5, 6)
              AND \`is_active\` = 0
              AND \`username\` IN ('deleted_user_1', 'deleted_user_5', 'deleted_user_6')
        `);
        // Note: drops the column even where it pre-dated this migration —
        // acceptable for a rollback; the up() recreates it either way.
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN IF EXISTS \`is_active\``);
    }
}
