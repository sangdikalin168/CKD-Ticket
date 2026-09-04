/**
 * Create a gate kiosk service account, or reset its password.
 *
 *   npm run kiosk:create-user -- --username gate-checkin --display "Check-in gate"
 *   npm run kiosk:create-user -- --username gate-checkin                 (reset password)
 *   npm run kiosk:create-user:dev -- --username gate-checkin             (dev.env DB)
 *
 * The account gets role "kiosk", which permissions.ts restricts to the
 * check-in / check-out operations, so the login that sits in a gate PC's
 * config.json cannot be used to read or change anything else. One account per
 * gate PC is the intent, so a leaked or retired one can be reset alone.
 *
 * The password is printed once and stored only as a bcrypt hash; re-run to
 * reset it. Refuses to touch an existing account that is not a kiosk.
 */
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { createConnection } from "mysql2/promise";

const KIOSK_ROLE = "kiosk";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const username = arg("username");
  if (!username || !/^[a-z0-9][a-z0-9._-]{2,49}$/i.test(username)) {
    console.error(
      "usage: npm run kiosk:create-user -- --username <name> [--display <label>] [--password <pw>]"
    );
    process.exit(2);
  }
  const display = arg("display") || username;
  const password = arg("password") || randomBytes(16).toString("hex");

  const conn = await createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
  });
  try {
    const [rows] = (await conn.query(
      "SELECT user_id, role FROM users WHERE username = ?",
      [username]
    )) as any[];
    const hashed = await hash(password, 12);

    if (rows.length > 0) {
      const existing = rows[0];
      if (existing.role !== KIOSK_ROLE) {
        console.error(
          `refusing: "${username}" already exists with role "${existing.role}" - not a kiosk account`
        );
        process.exit(1);
      }
      await conn.query(
        "UPDATE users SET password = ?, display_name = ?, is_active = 1 WHERE user_id = ?",
        [hashed, display, existing.user_id]
      );
      console.log(`reset password for kiosk account "${username}" (user_id ${existing.user_id})`);
    } else {
      // users.phone is NOT NULL UNIQUE; a kiosk has none, so tag a placeholder.
      await conn.query(
        "INSERT INTO users (username, password, display_name, phone, role, image, tokenVersion, is_active, created_at) " +
          "VALUES (?, ?, ?, ?, ?, '', 0, 1, NOW())",
        [username, hashed, display, `kiosk:${username}`, KIOSK_ROLE]
      );
      console.log(`created kiosk account "${username}"`);
    }

    console.log('\nPut this in the kiosk config.json under "api":\n');
    console.log(JSON.stringify({ username, password }, null, 2));
    console.log("\nThe password is stored only as a hash - re-run this command to reset it.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
