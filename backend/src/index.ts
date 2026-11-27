require("dotenv").config();
import { ApolloServer } from "apollo-server-express";
import cookieParser from "cookie-parser";
import express from "express";
import { DataSource } from "typeorm";
import { createServer } from "http";
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from "apollo-server-core";
import { buildSchema } from "type-graphql";
import { applyMiddleware } from "graphql-middleware";
import { permissions } from "./permissions";

import refreshTokenRouter from "./Routes/refreshTokenRouter";
import { entities } from "./Entities";
import { Facility } from "./Entities/Facility";
import { Context } from "./Context/Context";
import path from "path";
import { UPLOADS_DIR, UPLOADS_URL_PREFIX, ensureUploadDirs, DESKTOP_DIR, DESKTOP_URL_PREFIX, ensureDesktopDir } from "./Utils/paths";
import { requireAuthForUploads } from "./MiddleWare/requireAuthForUploads";
import { startPrinting } from "./Print/service";
import { buildInfo } from "./Utils/buildInfo";
import { checkinEventsHandler } from "./Utils/changeFeed";

// Production toggles — NODE_ENV=production disables dev-only conveniences.
const isProd = process.env.NODE_ENV === "production";

/** Ensure the default access places exist (idempotent; runs on every boot). */
async function ensureDefaultFacilities() {
  const defaults = [
    { code: "SWIM", name: "Swimming" },
    { code: "GYM", name: "Gym" },
    { code: "STEAM", name: "Steam / Sauna" },
  ];
  for (const d of defaults) {
    const exists = await Facility.findOne({ where: { code: d.code } });
    if (!exists) {
      await Facility.create({ code: d.code, name: d.name, requires_door_access: true }).save();
    }
  }
}


export const MysqlDataSource = new DataSource({
  type: "mysql",
  connectorPackage: "mysql2",
  port: 3306,
  connectTimeout: 24 * 3600,
  acquireTimeout: 60 * 60 * 1000,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false,
  // Never in production: a stray entity change must never auto-alter the live
  // DB — use migrations. In development it is opt-in (DB_SYNCHRONIZE=true):
  // run against a restored production dump, auto-sync tries to rewrite the
  // migration-managed schema (it fails on transfer_request's FK indexes) and
  // leaves half-applied DDL behind, since MariaDB auto-commits DDL.
  synchronize: !isProd && process.env.DB_SYNCHRONIZE === "true",
  entities: [...entities],
  // __dirname-relative, matching either extension: production runs this
  // codebase from src/ via ts-node with no dist/, so the old cwd-relative
  // "dist/migrations/*.js" matched nothing at boot. This glob works from src
  // (ts) and dist (js). Note migrations are NOT applied at boot — see below.
  migrations: isProd ? [`${__dirname}/migrations/*.{ts,js}`] : [],
  migrationsTableName: "typeorm_migrations",
});

const main = async () => {
  // Migrations are DELIBERATELY not run here.
  //
  // This used to be `if (isProd) await runMigrations()` inside a floating
  // .then() that nobody awaited and whose .catch() only logged — so the server
  // went on to listen even if the schema change had failed. MySQL/MariaDB
  // auto-commit DDL, so a failure part-way through leaves committed,
  // half-applied schema that TypeORM does not record as run, announced by one
  // console line while the gym keeps trading. That was survivable only because
  // the migrations glob was broken and the call did nothing.
  //
  // Now that the glob is fixed the call would be live, so it is gone. Apply
  // migrations as an explicit, verified deploy step, before starting the API:
  //
  //     npm run migration:run:prod        (see docs/DEPLOY-transfer-guardrails.md)
  //
  // Startup still fails loudly if the database is unreachable: initialize() is
  // awaited, and a rejection exits non-zero instead of listening on a broken
  // connection.
  try {
    await MysqlDataSource.initialize();
    console.log("Database Connected");
    await ensureDefaultFacilities();
  } catch (err) {
    console.error("FATAL: database initialization failed", err);
    process.exit(1);
  }

  const app = express();

  // Liveness + build identity for the service manager, deploy scripts and the
  // gate kiosks. Registered before the SPA static mount and the "*" fallback
  // so nothing can shadow them. /health round-trips the database, so a wedged
  // connection reads as down rather than as a live server that fails every
  // lookup. Both are unauthenticated: they reveal nothing about the data.
  app.get("/health", async (_req, res) => {
    try {
      await MysqlDataSource.query("SELECT 1");
      res.json({ status: "ok", db: "up", uptime: Math.round(process.uptime()) });
    } catch {
      res.status(503).json({ status: "down", db: "down", uptime: Math.round(process.uptime()) });
    }
  });
  // Live change feed for the gate kiosks (Server-Sent Events): fingerprint
  // saved / membership changed -> the kiosk refreshes that one reader entry.
  app.get("/events/checkin", checkinEventsHandler);

  app.get("/version.json", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(buildInfo());
  });

  // Built SPA. Only used when Node fronts the app directly (Cloudflare Tunnel ->
  // localhost:4000); under docker-compose nginx serves these files instead.
  const SPA_DIR = path.resolve(__dirname, "../../frontend/dist");
  app.use(express.static(SPA_DIR));

  // Serve uploaded files from the server-owned uploads directory (configurable
  // via UPLOADS_DIR so it can live outside the tree a deploy replaces).
  // Behind an auth guard: these are member photos, and static files never pass
  // through graphql-shield.
  ensureUploadDirs();
  app.use(UPLOADS_URL_PREFIX, requireAuthForUploads, express.static(UPLOADS_DIR));

  // Desktop client downloads (CKD-Ticket.exe + latest.json), served
  // unauthenticated on purpose — the updater runs before any login. `maxAge: 0`
  // keeps the manifest from being cached past a release; the exe itself is
  // content-addressed by the sha256 in the manifest, so a stale copy is caught
  // by the checksum rather than trusted.
  ensureDesktopDir();
  app.use(DESKTOP_URL_PREFIX, express.static(DESKTOP_DIR, { maxAge: 0, etag: true }));

  app.use(cookieParser());
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));
  app.use("/refresh_token", refreshTokenRouter);

  const httpServer = createServer(app);

  const apolloServer = new ApolloServer({
    schema: applyMiddleware(
      await buildSchema({
        validate: false,
        resolvers: [`${__dirname}/Resolvers/*.{ts,js}`],
      }),
      permissions
    ),
    cache: "bounded",
    // Schema introspection + Playground only outside production.
    introspection: !isProd,
    // Don't leak internal error details (stack traces, SQL) to clients in prod.
    formatError: (formattedError) => {
      if (isProd && formattedError.extensions?.code === "INTERNAL_SERVER_ERROR") {
        return { message: "Internal server error", extensions: { code: "INTERNAL_SERVER_ERROR" } };
      }
      return formattedError;
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ...(isProd ? [] : [ApolloServerPluginLandingPageGraphQLPlayground]),
    ],
    context: ({ req, res }): Context => <Context>({
      req,
      res,
    }),
  });

  await apolloServer.start();

  const defaultOrigins = [
    "https://studio.apollographql.com",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://192.168.100.30:5173",
    "http://192.168.100.30:5174",
    "http://110.235.252.175:5173",
    "http://110.235.252.175:5174",
  ];
  const corsOriginEnv = process.env.CORS_ORIGIN;
  const corsOrigin = corsOriginEnv === "*"
    ? true
    : corsOriginEnv
      ? corsOriginEnv.split(",").map((o) => o.trim())
      : defaultOrigins;

  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  // SPA fallback: the client uses path-based routes, so any non-API GET that isn't
  // a static file must return index.html. Registered AFTER /graphql, /refresh_token
  // and /uploads so it never shadows them.
  app.get("*", (_req, res) => {
    res.sendFile(path.join(SPA_DIR, "index.html"));
  });

  const PORT = process.env.PORT || 4000;

  await new Promise((resolve) =>
    httpServer.listen({ port: PORT }, resolve as () => void)
  );

  // Receipts are printed by the server, never by the till: this starts the
  // print worker and the queue dispatcher. Safe if the worker is absent —
  // jobs just queue until it appears.
  startPrinting();

  // Typically, http://localhost:4000/graphql
  console.log(
    `SERVER STARTED And PORT ${PORT}`
  );
};

main().catch((err) => {
  console.log(err);
});
