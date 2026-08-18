/**
 * Auth guard for the /uploads static mount.
 *
 * Member photos are personal data, and until now express.static served them to
 * anyone who asked. /graphql sits behind graphql-shield, but static files never
 * touched that layer — so with the Cloudflare tunnel in front, every member
 * photo was fetchable from the public internet by URL. Filenames
 * (member_<id>_<epoch-ms>.jpg) are not secret, just unenumerated.
 *
 * The token is read from the Authorization header rather than a cookie on
 * purpose: the refresh cookie is `secure: true; sameSite: none`, which browsers
 * refuse to send over plain http, and the office tills reach this app over http
 * on a LAN IP. A cookie-based guard would work through the https tunnel and
 * silently break every photo at the counter. Bearer works on both.
 *
 * Because <img src> cannot send headers, the client fetches photos with
 * fetch() + a blob URL — see frontend/src/utils/imageCache.ts.
 */
import { NextFunction, Request, Response } from "express";
import { Secret, verify } from "jsonwebtoken";

export function requireAuthForUploads(req: Request, res: Response, next: NextFunction) {
  const header = req.header("Authorization");
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    verify(token, process.env.ACCESS_TOKEN_SECRET as Secret);
    return next();
  } catch {
    // Same body for malformed, wrong-signature and expired: nothing here should
    // help a caller distinguish "no such file" from "not allowed".
    return res.status(401).json({ error: "Not authenticated" });
  }
}
