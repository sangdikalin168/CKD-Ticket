import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Create the server-side print queue table (Entities/PrintJob.ts).
 *
 * The entity was added without a migration, so production never had the
 * table: the print dispatcher polls it every few seconds and logged
 * "Table 'sportclub.print_job' doesn't exist" on every poll — about 10 MB of
 * service.err.log per hour.
 *
 * The DDL is exactly what TypeORM generates for the entity (including its
 * index names), so synchronize/schema:log see no difference.
 *
 * Behaviour change: none for receipts. The frontend prints through the
 * desktop app's bridge (window.electronAPI) and no client calls
 * enqueuePrintJob today, so the dispatcher just polls an empty queue.
 */
export class PrintJob1787600000000 implements MigrationInterface {
  name = "PrintJob1787600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`print_job\` (
        \`job_id\` int NOT NULL AUTO_INCREMENT,
        \`doc_type\` varchar(32) NOT NULL,
        \`ref_id\` bigint NOT NULL DEFAULT 0,
        \`copies\` tinyint NOT NULL DEFAULT 1,
        \`idempotency_key\` varchar(128) NOT NULL,
        \`extra_json\` varchar(2048) NULL,
        \`payload_json\` mediumtext NULL,
        \`status\` varchar(16) NOT NULL DEFAULT 'QUEUED',
        \`attempts\` int NOT NULL DEFAULT 0,
        \`max_attempts\` int NOT NULL DEFAULT 5,
        \`next_attempt_at\` datetime NULL,
        \`last_error\` varchar(512) NULL,
        \`spooler_job_id\` int NULL,
        \`requested_by\` int NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`finished_at\` datetime NULL,
        UNIQUE INDEX \`IDX_114b3a2c6585bc22bcb25f1d96\` (\`idempotency_key\`),
        INDEX \`IDX_6f26fab4d9290f8f4ac395a0b2\` (\`status\`),
        PRIMARY KEY (\`job_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS `print_job`");
  }
}
