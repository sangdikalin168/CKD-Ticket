import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Transfer workflow guardrails.
 *
 * Retrofits the constraints whose absence produced real damage in production:
 * request 1 was executed NINE times (requests 2/11/20 twice each — two pairs
 * with identical timestamps, i.e. a double-click race), each execution
 * rewriting two customers' end_membership_date; two executions persisted a
 * '0000-00-00' receiver date under non-strict sql_mode; and unreviewed rows
 * carried realistic-looking fake audit stamps from DEFAULT CURRENT_TIMESTAMP.
 *
 * Order matters and is load-bearing:
 *   1. Archive surplus executions to transfer_superseded (append-only forensic
 *      record — NEVER deleted, it is the only evidence of what happened).
 *   2. Only then can the UNIQUE key on transfer.request_id exist.
 *   3. Make the audit columns honest (NULL until the event happens) BEFORE the
 *      enum/CHECK tightening that assumes honest values.
 *
 * Constraints deliberately NOT added:
 *   - users FKs: 24 of 37 request_by values (and most checked/approved/
 *     processed/transfer_by) reference users deleted long ago. Audit history
 *     outlives staff accounts; a constraint here could only be satisfied by
 *     destroying the history.
 *   - customer FKs on `transfer`: 11 rows reference customer 1, deleted —
 *     same reasoning, it is an append-only historical record.
 *   - customer FKs on `transfer_request` ARE added (verified zero orphans).
 *
 * MariaDB 10.4 (prod): CHECK constraints are enforced from 10.2, ENUM and
 * ADD CONSTRAINT syntax as used here are supported.
 *
 * MIGRATION HISTORY — verified, do NOT "reconcile" it. The production dump
 * contains `INSERT INTO typeorm_migrations VALUES (1,1786964658879,
 * 'RedesignAdditive1786964658879')` and all of that migration's tables
 * (facility, package, purchase, entitlement, check_in) exist. RedesignAdditive
 * IS applied. Clearing that row would make it re-run and die on its bare
 * `CREATE TABLE facility` (nine CREATE TABLEs, none guarded by IF NOT EXISTS),
 * which would then block this migration too. Verify the table holds exactly
 * that one row and change nothing.
 *
 * ORDERING: 1787374800000-HoldRequestV2 sorts BEFORE this one and runs first in
 * the same batch. TypeORM wraps the batch in one transaction and stops on the
 * first failure — but MySQL/MariaDB AUTO-COMMIT DDL, so a failure part-way
 * leaves committed schema changes that the transaction cannot undo. Rehearse
 * BOTH together against a restored dump, never this one alone.
 */
export class TransferWorkflowGuardrails1787418000000 implements MigrationInterface {
    name = "TransferWorkflowGuardrails1787418000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── 1. Forensic archive for surplus executions ────────────────────
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`transfer_superseded\` (
                \`transfer_id\`     INT NOT NULL,
                \`transfer_by\`     INT NOT NULL,
                \`transfer_date\`   DATETIME NULL,
                \`sender_id\`       INT NOT NULL,
                \`sender_old_date\` DATE NULL,
                \`sender_new_end\`  DATE NULL,
                \`receiver_id\`     INT NOT NULL,
                \`receiver_old_end\` DATE NULL,
                \`receiver_new_end\` DATE NULL,
                \`request_id\`      INT NOT NULL,
                \`fee\`             DOUBLE NOT NULL,
                \`archived_at\`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`note\`            VARCHAR(255) NOT NULL
                    DEFAULT 'duplicate execution archived by TransferWorkflowGuardrails',
                PRIMARY KEY (\`transfer_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Archive every execution except the LAST one per request. Last, not
        // first: customer.end_membership_date holds the final execution's
        // values, so the kept row is the one that matches observable state.
        // The zero-date rows ('0000-00-00') sort earliest and are archived.
        await queryRunner.query(`
            INSERT IGNORE INTO \`transfer_superseded\`
                (transfer_id, transfer_by, transfer_date, sender_id, sender_old_date,
                 sender_new_end, receiver_id, receiver_old_end, receiver_new_end,
                 request_id, fee)
            SELECT t.transfer_id, t.transfer_by, NULLIF(t.transfer_date, '0000-00-00 00:00:00'),
                   t.sender_id, NULLIF(t.sender_old_date, '0000-00-00'),
                   NULLIF(t.sender_new_end, '0000-00-00'),
                   t.receiver_id, NULLIF(t.receiver_old_end, '0000-00-00'),
                   NULLIF(t.receiver_new_end, '0000-00-00'),
                   t.request_id, t.fee
            FROM \`transfer\` t
            JOIN (
                SELECT request_id, MAX(transfer_id) AS keep_id
                FROM \`transfer\`
                GROUP BY request_id
                HAVING COUNT(*) > 1
            ) k ON t.request_id = k.request_id AND t.transfer_id <> k.keep_id
        `);
        await queryRunner.query(`
            DELETE t FROM \`transfer\` t
            JOIN \`transfer_superseded\` s ON s.transfer_id = t.transfer_id
        `);

        // Abort rather than half-apply if duplicates somehow remain.
        const dupes: Array<{ n: number }> = await queryRunner.query(`
            SELECT COUNT(*) AS n FROM (
                SELECT request_id FROM \`transfer\` GROUP BY request_id HAVING COUNT(*) > 1
            ) d
        `);
        if (Number(dupes[0]?.n) > 0) {
            throw new Error(
                `transfer still has ${dupes[0].n} duplicated request_id(s) after archiving — refusing to continue`
            );
        }

        // ── 2. One execution per request, enforced by the database ────────
        await queryRunner.query(`
            ALTER TABLE \`transfer\` ADD UNIQUE KEY \`uq_transfer_request\` (\`request_id\`)
        `);

        // Money is DECIMAL, not DOUBLE. (Historical fee values were hardcoded
        // to 1 by the old resolver and are meaningless either way.)
        await queryRunner.query(`
            ALTER TABLE \`transfer\` MODIFY \`fee\` DECIMAL(10,2) NOT NULL DEFAULT 0.00
        `);

        // ── 3. Honest audit columns on transfer_request ───────────────────
        // NULL until the event happens; no more fake DEFAULT now() stamps and
        // no more load-bearing 0-sentinels.
        await queryRunner.query(`
            ALTER TABLE \`transfer_request\`
                MODIFY \`checked_by\`       INT NULL DEFAULT NULL,
                MODIFY \`approved_by\`      INT NULL DEFAULT NULL,
                MODIFY \`processed_by\`     INT NULL DEFAULT NULL,
                MODIFY \`checked_date\`     DATETIME NULL DEFAULT NULL,
                MODIFY \`approved_date\`    DATETIME NULL DEFAULT NULL,
                MODIFY \`checker_comment\`  VARCHAR(255) NULL DEFAULT NULL,
                MODIFY \`approver_comment\` VARCHAR(255) NULL DEFAULT NULL,
                ADD COLUMN \`processed_date\` DATETIME NULL DEFAULT NULL AFTER \`processed_by\`
        `);

        // Un-lie the existing rows. Reviewed rows keep their (untrusted,
        // boot-frozen) timestamps — they are unrepairable and documented as
        // such; unreviewed rows stop pretending they were reviewed.
        await queryRunner.query(`
            UPDATE \`transfer_request\` SET
                checked_by = NULL, checked_date = NULL, checker_comment = NULL
            WHERE checker_status = 'Pending'
        `);
        await queryRunner.query(`
            UPDATE \`transfer_request\` SET
                approved_by = NULL, approved_date = NULL, approver_comment = NULL
            WHERE approver_status = 'Pending'
        `);
        await queryRunner.query(`
            UPDATE \`transfer_request\` SET processed_by = NULL WHERE processed_by = 0
        `);
        await queryRunner.query(`
            UPDATE \`transfer_request\` SET checked_by = NULLIF(checked_by, 0),
                approved_by = NULLIF(approved_by, 0),
                checker_comment = NULLIF(checker_comment, ''),
                approver_comment = NULLIF(approver_comment, '')
        `);

        // One production row is in the illegal state Rejected/Rejected/Pending
        // (the approver acted on a checker-rejected request — the UI allowed
        // it). The checker rejection already makes it terminal; clear the
        // unreachable approver stage so the ordering CHECK below can exist.
        await queryRunner.query(`
            UPDATE \`transfer_request\`
            SET approver_status = 'Pending', approved_by = NULL,
                approved_date = NULL, approver_comment = NULL
            WHERE checker_status = 'Rejected' AND approver_status <> 'Pending'
        `);

        // ── 4. Enum statuses: six legal states instead of free text ───────
        await queryRunner.query(`
            ALTER TABLE \`transfer_request\`
                MODIFY \`checker_status\`  ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
                MODIFY \`approver_status\` ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
                MODIFY \`process\`         ENUM('Pending','Done') NOT NULL DEFAULT 'Pending'
        `);

        // ── 5. Stage ordering, enforced in the database ───────────────────
        await queryRunner.query(`
            ALTER TABLE \`transfer_request\`
                ADD CONSTRAINT \`chk_tr_approve_after_check\`
                    CHECK (\`approver_status\` = 'Pending' OR \`checker_status\` = 'Approved'),
                ADD CONSTRAINT \`chk_tr_process_after_approve\`
                    CHECK (\`process\` = 'Pending' OR \`approver_status\` = 'Approved')
        `);

        // ── 6. Referential integrity where the data permits it ────────────
        // (verified zero orphans on both sides at migration-authoring time;
        // RESTRICT so a customer with workflow history cannot be deleted —
        // that is exactly how requests 1 and 2 got orphaned and hidden.)
        await queryRunner.query(`
            ALTER TABLE \`transfer_request\`
                ADD CONSTRAINT \`fk_tr_sender\`   FOREIGN KEY (\`sender_id\`)   REFERENCES \`customer\`(\`customer_id\`) ON DELETE RESTRICT,
                ADD CONSTRAINT \`fk_tr_receiver\` FOREIGN KEY (\`receiver_id\`) REFERENCES \`customer\`(\`customer_id\`) ON DELETE RESTRICT
        `);

        // Worklist index: the screens filter on process/status.
        await queryRunner.query(`
            ALTER TABLE \`transfer_request\` ADD INDEX \`IDX_tr_process\` (\`process\`)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transfer_request\` DROP INDEX \`IDX_tr_process\``);
        await queryRunner.query(`ALTER TABLE \`transfer_request\` DROP FOREIGN KEY \`fk_tr_sender\``);
        await queryRunner.query(`ALTER TABLE \`transfer_request\` DROP FOREIGN KEY \`fk_tr_receiver\``);
        await queryRunner.query(`ALTER TABLE \`transfer_request\` DROP CONSTRAINT \`chk_tr_approve_after_check\``);
        await queryRunner.query(`ALTER TABLE \`transfer_request\` DROP CONSTRAINT \`chk_tr_process_after_approve\``);
        await queryRunner.query(`
            ALTER TABLE \`transfer_request\`
                MODIFY \`checker_status\`  VARCHAR(255) NOT NULL DEFAULT 'Pending',
                MODIFY \`approver_status\` VARCHAR(255) NOT NULL DEFAULT 'Pending',
                MODIFY \`process\`         VARCHAR(255) NOT NULL DEFAULT 'Pending',
                MODIFY \`checked_by\`      INT NOT NULL DEFAULT 0,
                MODIFY \`approved_by\`     INT NOT NULL DEFAULT 0,
                MODIFY \`processed_by\`    INT NOT NULL DEFAULT 0,
                MODIFY \`checked_date\`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                MODIFY \`approved_date\`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                MODIFY \`checker_comment\`  VARCHAR(255) NOT NULL DEFAULT '',
                MODIFY \`approver_comment\` VARCHAR(255) NOT NULL DEFAULT '',
                DROP COLUMN \`processed_date\`
        `);
        await queryRunner.query(`ALTER TABLE \`transfer\` MODIFY \`fee\` DOUBLE NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`transfer\` DROP INDEX \`uq_transfer_request\``);
        // transfer_superseded is intentionally NOT restored into transfer and
        // NOT dropped: it is the forensic record of the duplicate executions.
    }
}
