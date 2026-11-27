import { Users } from "../Entities/Users";
import { UserPermission } from "../Entities/UserPermission";
import { KIOSK_ROLE } from "./roles";

/**
 * Per-user permissions.
 *
 * A user's role ("Admin" / "Sale" / "Checker") gives them a default set of
 * permissions (ROLE_DEFAULTS). An Admin can then grant or revoke individual
 * permissions per user; those exceptions are stored in `user_permission` as
 * overrides (allowed = 1 grants, allowed = 0 revokes). The effective set is
 *
 *     role defaults  ∪  granted overrides  −  revoked overrides
 *
 * Storing only the exceptions means changing someone's role still moves them
 * onto the new role's defaults, and "reset to role defaults" is just deleting
 * their override rows.
 *
 * The role defaults reproduce exactly what each role could do before this
 * existed, so no one gains or loses access on deploy.
 *
 * Keep PERMISSIONS / ROLE_DEFAULTS in step with frontend/src/lib/access.ts.
 */

export const PERMISSIONS = [
  "ticket.sell",       // Sell tickets page
  "ticket.price",      // Ticket price setup tab (UpsertTicketPriceConfig / DeleteTicketPriceConfig)
  "member.manage",     // Member pages
  "price.manage",      // Member / coupon price tables (view + edit)
  "hold.request",      // Hold requests: create and process
  "hold.decide",       // Hold requests: approve / reject
  "transfer.request",  // Transfer requests: create and execute
  "transfer.check",    // Transfer requests: checker review
  "transfer.approve",  // Transfer requests: final approval
  "report.view",       // Income / customer / customer-type reports
  "printer.manage",    // Printers page
  "user.manage",       // Users and permissions pages
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const STAFF_ROLES = ["Admin", "Sale", "Checker"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_DEFAULTS: Record<StaffRole, readonly Permission[]> = {
  Admin: PERMISSIONS,
  Sale: [
    "ticket.sell",
    "member.manage",
    "price.manage",
    "hold.request",
    "transfer.request",
    "printer.manage",
  ],
  Checker: ["transfer.check"],
};

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

/** Role defaults for a stored role string. Unknown roles (and kiosk accounts)
 *  get nothing — kiosks are scoped separately in permissions.ts. */
export function roleDefaults(role: string | null | undefined): Permission[] {
  if (!role || role === KIOSK_ROLE) return [];
  const match = STAFF_ROLES.find((r) => r.toLowerCase() === role.trim().toLowerCase());
  return match ? [...ROLE_DEFAULTS[match]] : [];
}

/** Effective set for a role plus its override rows. */
export function applyOverrides(
  role: string | null | undefined,
  overrides: { permission: string; allowed: boolean | number }[]
): Permission[] {
  const set = new Set<Permission>(roleDefaults(role));
  for (const o of overrides) {
    if (!isPermission(o.permission)) continue;
    if (o.allowed) set.add(o.permission);
    else set.delete(o.permission);
  }
  return PERMISSIONS.filter((p) => set.has(p));
}

/** The user's effective permissions, read fresh from the database so a change
 *  (or a deactivation) applies on the user's very next request. Inactive or
 *  missing users have none. */
export async function effectivePermissions(user_id: number): Promise<Permission[]> {
  const user = await Users.findOne({ where: { user_id } });
  if (!user || user.is_active !== 1) return [];
  const overrides = await UserPermission.find({ where: { user_id } });
  return applyOverrides(user.role, overrides);
}

export async function hasPermission(user_id: number, permission: Permission): Promise<boolean> {
  return (await effectivePermissions(user_id)).includes(permission);
}

/** The message every refused action uses (Khmer first, as elsewhere). */
export const NOT_PERMITTED = "អ្នកមិនមានសិទ្ធិទេ (not permitted)";
