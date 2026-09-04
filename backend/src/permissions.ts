import { shield, rule, allow } from "graphql-shield";
import { verify } from "jsonwebtoken";
import { Context } from "./Context/Context";
import { UserAuthPayload } from "./Context/UserAuthPayload";

import { KIOSK_ROLE } from "./Utils/roles";

export { KIOSK_ROLE };

function decodeToken(ctx: Context): UserAuthPayload | null {
  try {
    const authHeader = ctx.req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return null;
    return verify(token, process.env.ACCESS_TOKEN_SECRET as string) as UserAuthPayload;
  } catch {
    return null;
  }
}

/** Any valid access token — staff or kiosk. */
const isAuthenticated = rule({ cache: "contextual" })(
  (_parent, _args, ctx: Context) =>
    decodeToken(ctx) ? true : new Error("Not authenticated")
);

/** A valid token that is NOT a kiosk account. This server is the data gateway
 *  for every gate PC on the LAN, and each of those holds a kiosk login in a
 *  plain config.json — so a kiosk token must not be able to read customers,
 *  change photos, transfer memberships, create users, and so on. */
const isStaff = rule({ cache: "contextual" })(
  (_parent, _args, ctx: Context) => {
    const user = decodeToken(ctx);
    if (!user) return new Error("Not authenticated");
    if (user.role === KIOSK_ROLE) return new Error("Not authorized for kiosk accounts");
    return true;
  }
);

// The operations a gate kiosk actually calls — see CKD-Check-In/ckd_checkin/api.py,
// CKD-Check-Out/ckd_checkout/api.py and both apps' fingerprint.py. Anything not
// listed here falls through to the staff-only "*" rule below. Note that
// checkinSaveFingerprint (enrolment) is deliberately NOT here: enrolment is done
// from the staff desktop app, not at the gate.
const KIOSK_QUERIES = [
  "checkinLookupMember",
  "checkinLookupTicket",
  "checkinLookupCoupon",
  "checkinFingerprints",
  "checkoutLookupMember",
];
const KIOSK_MUTATIONS = [
  "checkinTicket",
  "checkinMember",
  "checkinConsumeCoupon",
  "checkoutUpdateItems",
];

function allowKiosk(names: string[]): Record<string, typeof isAuthenticated> {
  return names.reduce<Record<string, typeof isAuthenticated>>((acc, name) => {
    acc[name] = isAuthenticated;
    return acc;
  }, {});
}

export const permissions = shield(
  {
    Query: {
      // Staff-only by default; a field listed explicitly below overrides "*".
      "*": isStaff,
      ...allowKiosk(KIOSK_QUERIES),
    },
    Mutation: {
      "*": isStaff,
      ...allowKiosk(KIOSK_MUTATIONS),
      // Public — no token needed. `login` is the ONLY unauthenticated mutation:
      // it is the one operation that cannot require a token, because obtaining
      // the token is its whole purpose.
      //
      // `logout` used to be listed here too. It took a caller-supplied user_id
      // and bumped that user's tokenVersion, so anyone on the internet could
      // invalidate any user's session without logging in. It now authenticates
      // like everything else and derives the id from the token.
      login: allow,
    },
  },
  {
    // NOTE: do NOT set `fallbackRule: isAuthenticated` here. The `"*"` rules
    // above already gate every query/mutation; a global fallback also clamps
    // every *response* object subfield, which makes `login` impossible (the
    // client can't read the access token without already having one).
    // graphql-shield's default fallbackRule is `allow`, which is what we want.
    allowExternalErrors: true,
  }
);
