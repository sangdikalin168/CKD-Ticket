/**
 * The one place the app reads "who is allowed to do this" from.
 *
 * The stored role is a coarse string in localStorage ("Admin" / "Sale" /
 * "Checker") set at login. It is matched trimmed and case-insensitively — a
 * UI convenience only, since the server re-checks every mutation against its
 * own whitelist regardless of what the client shows or hides. A role that
 * cannot be resolved to one of the known values (missing, blank, a typo, a
 * retired role like "Kiosk") normalizes to `null` — deliberately not any of
 * the app's roles — rather than guessing, which could either hide legitimate
 * access or imply access the server will refuse.
 *
 * `MENU` is the single access table: every screen that decides what a role
 * may see or do (the sidebar, the dashboard's quick actions, a component's
 * own admin-only tab) reads it here instead of keeping its own copy that can
 * drift out of sync with what the sidebar shows.
 */

export type Role = "Admin" | "Sale" | "Checker";

export const KNOWN_ROLES: Role[] = ["Admin", "Sale", "Checker"];

/** Trims and case-folds the stored role against the known set, so "admin",
 *  " Admin ", "ADMIN" and "Admin" all resolve the same way. Anything that
 *  doesn't match one of the known roles (missing, blank, "Kiosk", a typo)
 *  comes back null. */
export function normalizeRole(raw: string | null | undefined): Role | null {
  const trimmed = raw?.trim().toLowerCase();
  if (!trimmed) return null;
  return KNOWN_ROLES.find((known) => known.toLowerCase() === trimmed) ?? null;
}

/** The normalized role for the signed-in user, read straight from storage.
 *  Every screen that used to do `localStorage.getItem("role")` and compare
 *  it as an exact string should read it through here instead — that raw
 *  compare is the bug class a stray case or whitespace difference exploits. */
export function currentRole(): Role | null {
  return normalizeRole(localStorage.getItem("role"));
}

/** Whether a (possibly unresolved) role is one of the given allowed roles. */
export function hasRole(role: Role | null, allowed: Role[]): boolean {
  return role != null && allowed.includes(role);
}

export interface SubMenuItem {
  nameKey: string;
  path: string;
  /** Defaults to the parent item's `access` when omitted. Set explicitly
   *  when a role should reach some, but not all, of a group's sub-items
   *  (e.g. Checker and the transfer queue below). */
  access?: Role[];
}

export interface MenuItem {
  /** Stable identifier for React keys, open-menu state, and icon lookups. */
  key: string;
  nameKey: string;
  path?: string;
  access: Role[];
  subItems?: SubMenuItem[];
}

export const MENU: MenuItem[] = [
  {
    key: "ticket",
    nameKey: "menu.sellTicket",
    path: "/ticket",
    access: ["Sale", "Admin"],
  },
  {
    key: "member",
    nameKey: "menu.member",
    path: "/member",
    access: ["Sale", "Admin"],
  },
  {
    key: "price",
    nameKey: "menu.priceTable",
    access: ["Admin", "Sale"],
    subItems: [
      { nameKey: "menu.memberPrice", path: "/member_price_table" },
      { nameKey: "menu.couponPrice", path: "/coupon_price_table" },
    ],
  },
  {
    key: "request",
    nameKey: "menu.request",
    // The group's own access is the union of what any sub-item allows —
    // each sub-item then narrows further below. A Checker's only backend
    // grant here is CheckTransferRequest (Transfer.ts requireRole(["Admin",
    // "Checker"])); they have no role in the hold workflow (HoldV2.ts
    // requireAdmin is Admin-only), so they get the transfer queue and not
    // the hold queue.
    access: ["Admin", "Sale", "Checker"],
    subItems: [
      { nameKey: "menu.holdRequest", path: "/hold_request", access: ["Admin", "Sale"] },
      { nameKey: "menu.transferRequest", path: "/transfer_request", access: ["Admin", "Sale", "Checker"] },
    ],
  },
  {
    key: "report",
    nameKey: "menu.report",
    access: ["Admin"],
    subItems: [
      { nameKey: "menu.incomeReport", path: "/income_report" },
      { nameKey: "menu.customerReport", path: "/customer_report" },
      { nameKey: "menu.customerTypeReport", path: "/customer_type_report" },
    ],
  },
  {
    key: "printer",
    nameKey: "menu.printer",
    path: "/printers",
    access: ["Sale", "Admin"],
  },
  {
    key: "user",
    nameKey: "menu.user",
    access: ["Admin"],
    subItems: [
      { nameKey: "menu.userList", path: "/user" },
      { nameKey: "menu.permissions", path: "/user_authorize" },
    ],
  },
];

/** A group with sub-items is included if ANY sub-item is reachable, and only
 *  those reachable sub-items are kept — a role can have the parent item
 *  (e.g. Checker under "request") without having every path inside it. An
 *  unresolved role (`null`) reaches nothing, on purpose — see the module
 *  doc comment. */
export function visibleMenu(role: Role | null): MenuItem[] {
  if (!role) return [];
  return MENU.reduce<MenuItem[]>((acc, item) => {
    if (!item.subItems) {
      if (item.access.includes(role)) acc.push(item);
      return acc;
    }
    const subItems = item.subItems.filter((sub) => (sub.access ?? item.access).includes(role));
    if (subItems.length > 0) acc.push({ ...item, subItems });
    return acc;
  }, []);
}

/** Whether a role can reach a given route, per the MENU table above — checks
 *  both top-level items and sub-items so a page (the dashboard's quick
 *  actions, a report link) can gate a link without keeping its own copy of
 *  the access table. */
export function canReachPath(role: Role | null, path: string): boolean {
  if (!role) return false;
  return MENU.some((item) => {
    if (item.path === path) return item.access.includes(role);
    return item.subItems?.some((sub) => sub.path === path && (sub.access ?? item.access).includes(role)) ?? false;
  });
}
