import { shield, rule, allow } from "graphql-shield";
import { verify } from "jsonwebtoken";
import { Context } from "./Context/Context";
import { UserAuthPayload } from "./Context/UserAuthPayload";

import { KIOSK_ROLE } from "./Utils/roles";
import { Permission, effectivePermissions } from "./Utils/permissionCatalog";

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

/** Effective permissions for this request's caller, loaded once per request
 *  (several rules may ask) and read fresh from the database, so a change made
 *  on the Permissions page applies on the user's next request. */
const PERMS_KEY = Symbol("effectivePermissions");
function callerPermissions(ctx: Context): Promise<Permission[]> {
  const bag = ctx as unknown as Record<symbol, Promise<Permission[]>>;
  if (!bag[PERMS_KEY]) {
    const user = decodeToken(ctx);
    bag[PERMS_KEY] = user ? effectivePermissions(user.user_id) : Promise.resolve([]);
  }
  return bag[PERMS_KEY];
}

/** Staff login that holds `permission` (see Utils/permissionCatalog.ts).
 *  One rule instance per permission: graphql-shield refuses two different
 *  rules sharing a name. */
const canRules = new Map<Permission, ReturnType<typeof makeCan>>();
function can(permission: Permission) {
  let r = canRules.get(permission);
  if (!r) {
    r = makeCan(permission);
    canRules.set(permission, r);
  }
  return r;
}
function makeCan(permission: Permission) {
  return rule(`can:${permission}`, { cache: "contextual" })(
    async (_parent, _args, ctx: Context) => {
      const user = decodeToken(ctx);
      if (!user) return new Error("Not authenticated");
      if (user.role === KIOSK_ROLE) return new Error("Not authorized for kiosk accounts");
      return (await callerPermissions(ctx)).includes(permission)
        ? true
        : new Error("អ្នកមិនមានសិទ្ធិទេ (not permitted)");
    }
  );
}

function gate(permission: Permission, names: string[]): Record<string, ReturnType<typeof can>> {
  const r = can(permission);
  return names.reduce<Record<string, ReturnType<typeof can>>>((acc, name) => {
    acc[name] = r;
    return acc;
  }, {});
}

/** The income queries take a userId (0 = every seller). A cashier may always
 *  read their OWN sales (the till's tally); everyone's, or someone else's,
 *  needs "dashboard.view" or "report.view". Cached per argument set, since
 *  the answer depends on userId. */
const ownIncomeOrFigures = rule("income:own-or-figures", { cache: "strict" })(
  async (_parent, args: { userId?: number }, ctx: Context) => {
    const user = decodeToken(ctx);
    if (!user) return new Error("Not authenticated");
    if (user.role === KIOSK_ROLE) return new Error("Not authorized for kiosk accounts");
    if (Number(args.userId) === Number(user.user_id) && Number(args.userId) !== 0) return true;
    const perms = await callerPermissions(ctx);
    return perms.includes("dashboard.view") || perms.includes("report.view")
      ? true
      : new Error("អ្នកមិនមានសិទ្ធិទេ (not permitted)");
  }
);
const INCOME_QUERIES = [
  "GetTicketPayment",
  "GetMemberPayments",
  "GetCouponPayments",
  "GetTrainningPayments",
  "GetFruitPayments",
].reduce<Record<string, typeof ownIncomeOrFigures>>((acc, name) => {
  acc[name] = ownIncomeOrFigures;
  return acc;
}, {});

// Operations that need a specific permission, not just a staff login.
// Everything else stays at "any staff login" ("*" below) — notably price
// reads, which selling needs. The income queries are scoped by
// ownIncomeOrFigures above. The hold / transfer workflow steps check
// their permission inside the resolver instead (HoldV2.ts, Transfer.ts), so
// they keep returning their friendly in-app messages.
const PERMISSION_QUERIES = {
  ...INCOME_QUERIES,
  ...gate("user.manage", ["users", "get_user", "user_permissions"]),
  ...gate("report.view", [
    "activeCustomers",
    "expiringCustomersOnDate",
    "customerScanReport",
    "customersByMembershipDuration",
    "GetSeller",
  ]),
};
const PERMISSION_MUTATIONS = {
  ...gate("user.manage", [
    "create_user",
    "update_user",
    "set_user_active",
    "reset_user_password",
    "set_user_permissions",
  ]),
  ...gate("price.manage", [
    "createMemberPrice",
    "updatePrice",
    "deleteMemberPrice",
    "CreateCouponCard",
    "UpdateCouponCard",
    "DeleteCouponCard",
  ]),
  ...gate("ticket.price", ["UpsertTicketPriceConfig", "DeleteTicketPriceConfig"]),
};

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
      ...PERMISSION_QUERIES,
    },
    Mutation: {
      "*": isStaff,
      ...allowKiosk(KIOSK_MUTATIONS),
      ...PERMISSION_MUTATIONS,
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
