import "reflect-metadata";
import { DataSource } from "typeorm";
import { entities } from "./Entities";

// CLI (dev): typeorm-ts-node-commonjs runs .ts files directly → src/ paths.
// Docker (prod): compiled JS lives in dist/ → dist/ paths.
const isProd = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "mysql",
  connectorPackage: "mysql2",
  port: 3306,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false,
  synchronize: false,
  entities: [...entities],
  // __dirname-relative so the glob survives any working directory — the old
  // cwd-relative form is exactly what made prod's migrations a silent no-op.
  migrations: [`${__dirname}/migrations/*.{ts,js}`],
  migrationsTableName: "typeorm_migrations",
});
