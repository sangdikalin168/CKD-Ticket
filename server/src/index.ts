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

import refreshTokenRouter from "./Routes/refreshTokenRouter";
import { entities } from "./Entities";
import { Context } from "./Context/Context";
import path from "path";


export const MysqlDataSource = new DataSource({
  type: "mysql",
  port: 3306,
  connectTimeout: 24 * 3600,
  acquireTimeout: 60 * 60 * 1000,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false,
  synchronize: true,
  entities: [...entities],
});

const main = async () => {
  MysqlDataSource.initialize()
    .then(() => {
      console.log("Database Connected");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });

  const app = express();
  app.use(express.static(path.resolve(__dirname, "../../client/dist")));
  
  // Serve uploaded files
  app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/refresh_token", refreshTokenRouter);

  const httpServer = createServer(app);

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      validate: false,
      //import multiple resolvers
      resolvers: [`${__dirname}/Resolvers/*.{ts,js}`],
    }),
    cache: "bounded",
    introspection: true,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageGraphQLPlayground,
    ],
    context: ({ req, res }): Context => <Context>({
      req,
      res,
    }),
  });

  await apolloServer.start();

  // Origins allowed to call the API with credentials.
  const ALLOWED_ORIGINS = [
    "https://studio.apollographql.com",
    "https://ckd-ticket.sangdikalin.org",
    "http://110.235.252.175:5173",
    "http://110.235.252.175:5174",
  ];

  // In-office clients are served by the Vite dev server on the LAN, so their origin
  // is whatever IP the machine happens to have that day (192.168.1.20, 192.168.100.30,
  // ...). Match the private ranges by pattern instead of listing every address, so a
  // subnet change does not silently break login.
  const PRIVATE_LAN_ORIGIN =
    /^http:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/;

  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: (origin, callback) => {
        // No Origin header: same-origin request or a non-browser client (curl, Electron).
        if (!origin) return callback(null, true);
        const allowed =
          ALLOWED_ORIGINS.includes(origin) || PRIVATE_LAN_ORIGIN.test(origin);
        return callback(null, allowed);
      },
      credentials: true,
    },
  });

  // SPA fallback: the client uses createBrowserRouter (path-based routes), so any
  // non-API GET that isn't a static file must return index.html. Registered AFTER
  // the /graphql, /refresh_token and /uploads handlers so it never shadows them.
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(__dirname, "../../client/dist/index.html"));
  });

  const PORT = process.env.PORT || 4000;

  await new Promise((resolve) =>
    httpServer.listen({ port: PORT }, resolve as () => void)
  );

  // Typically, http://localhost:4000/graphql
  console.log(
    `SERVER STARTED And PORT ${PORT}`
  );
};

main().catch((err) => {
  console.log(err);
});
