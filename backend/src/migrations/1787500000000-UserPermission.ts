import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Per-user permission overrides (see Utils/permissionCatalog.ts).
 *
 * Purely additive: a new, empty table. With no rows every user keeps exactly
 * their role's defaults, which reproduce the access each role had before, so
 * deploying this changes nobody's access.
 *
 * users.user_id is INT; the FK cascades on delete only as a formality — users
 * are deactivated, never deleted (see Entities/Users.ts).
 */
export class UserPermission1787500000000 implements MigrationInterface {
  name = "UserPermission1787500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`user_permission\` (
        \`user_id\`    INT         NOT NULL,
        \`permission\` VARCHAR(64) NOT NULL,
        \`allowed\`    TINYINT     NOT NULL,
        PRIMARY KEY (\`user_id\`, \`permission\`),
        CONSTRAINT \`fk_user_permission_user\` FOREIGN KEY (\`user_id\`)
          REFERENCES \`users\`(\`user_id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS `user_permission`");
  }
}
