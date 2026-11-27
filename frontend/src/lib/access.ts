/**
 * The one place the app reads "who is allowed to do this" from.
 *
 * Access is per user: each user has a set of permissions — their role's
 * defaults, adjusted per person on the Permissions page. The server is the
 * source of truth: it sends the signed-in user's effective permissions at
 * login (and again via `my_permissions` whenever the app loads), and it
 * re-checks every protected operation itself. What this module shows or
 * hides is a UI convenience only.
 *
 * `MENU` is the single access table: every screen that decides what the user
 * may see (the sidebar, the dashboard's quick actions, the route guard, a
 * component's own admin-only tab) reads it here instead of keeping a copy.
 *
 * Keep PERMISSIONS / ROLE_DEFAULTS in step with
 * backend/src/Utils/permissionCatalog.ts.
 */
import { useSyncExternalStore } from "react";

export type Role = "Admin" | "Sale" | "Checker";

export const KNOWN_ROLES: Role[] = ["Admin", "Sale", "Checker"];

export const PERMISSIONS = [
  "ticket.sell",
  "ticket.price",
  "member.manage",
  "price.manage",
  "hold.request",
  "hold.decide",
  "transfer.request",
  "transfer.check",
  "transfer.approve",
  "report.view",
  "printer.manage",
  "user.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Grouping for the Permissions page. */
export const PERMISSION_GROUPS: { key: string; permissions: Permission[] }[] = [
  { key: "sales", permissions: ["ticket.sell", "ticket.price", "member.manage", "price.manage"] },
  { key: "requests", permissions: ["hold.request", "hold.decide", "transfer.request", "transfer.check", "transfer.approve"] },
  { key: "admin", permissions: ["report.view", "printer.manage", "user.manage"] },
];

export const ROLE_DEFAULTS: Record<Role, Permission[]> = {
  Admin: [...PERMISSIONS],
  Sale: ["ticket.sell", "member.manage", "price.manage", "hold.request", "transfer.request", "printer.manage"],
  Checker: ["transfer.check"],
};

/** Trims and case-folds the stored role against the known set. Anything that
 *  doesn't match (missing, blank, "kiosk", a typo) comes back null. */
export function normalizeRole(raw: string | null | undefined): Role | null {
  const trimmed = raw?.trim().toLowerCase();
  if (!trimmed) return null;
  return KNOWN_ROLES.find((known) => known.toLowerCase() === trimmed) ?? null;
}

/** The normalized role for the signed-in user — a label only; access comes
 *  from permissions. */
export function currentRole(): Role | null {
  return normalizeRole(localStorage.getItem("role"));
}

// ─── The signed-in user's permissions ────────────────────────────────────────

const STORAGE_KEY = "permissions";
const CHANGE_EVENT = "permissions-changed";

function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && (PERMISSIONS as readonly string[]).includes(value);
}

let cache: { raw: string | null; role: string | null; value: Permission[] } | null = null;

/** The signed-in user's permissions as last sent by the server. A session
 *  from before permissions existed has none stored yet; until the app's
 *  `my_permissions` refresh lands, it falls back to the role's defaults so the
 *  menu doesn't flash empty. */
export function currentPermissions(): Permission[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  const role = localStorage.getItem("role");
  if (cache && cache.raw === raw && cache.role === role) return cache.value;
  let value: Permission[];
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    value = Array.isArray(parsed)
      ? parsed.filter(isPermission)
      : (() => {
          const r = normalizeRole(role);
          return r ? [...ROLE_DEFAULTS[r]] : [];
        })();
  } catch {
    value = [];
  }
  cache = { raw, role, value };
  return value;
}

export function setPermissions(list: readonly string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.filter(isPermission)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Re-renders when the permissions change (refresh from the server, or an
 *  Admin editing their own permissions). */
export function usePermissions(): Permission[] {
  return useSyncExternalStore(subscribe, currentPermissions);
}

export function can(perms: readonly Permission[], needed: Permission | Permission[]): boolean {
  const list = Array.isArray(needed) ? needed : [needed];
  return list.some((p) => perms.includes(p));
}

// ─── The menu / route access table ───────────────────────────────────────────

export interface SubMenuItem {
  nameKey: string;
  path: string;
  /** Any one of these opens the page. Defaults to the parent's. */
  permission?: Permission | Permission[];
}

export interface MenuItem {
  /** Stable identifier for React keys, open-menu state, and icon lookups. */
  key: string;
  nameKey: string;
  path?: string;
  /** Any one of these shows the item. For a group, the default for its
   *  sub-items; the group itself shows when any sub-item is reachable. */
  permission: Permission | Permission[];
  subItems?: SubMenuItem[];
}

export const MENU: MenuItem[] = [
  { key: "ticket", nameKey: "menu.sellTicket", path: "/ticket", permission: ["ticket.sell", "ticket.price"] },
  { key: "member", nameKey: "menu.member", path: "/member", permission: "member.manage" },
  {
    key: "price",
    nameKey: "menu.priceTable",
    permission: "price.manage",
    subItems: [
      { nameKey: "menu.memberPrice", path: "/member_price_table" },
      { nameKey: "menu.couponPrice", path: "/coupon_price_table" },
    ],
  },
  {
    key: "request",
    nameKey: "menu.request",
    permission: [],
    subItems: [
      { nameKey: "menu.holdRequest", path: "/hold_request", permission: ["hold.request", "hold.decide"] },
      {
        nameKey: "menu.transferRequest",
        path: "/transfer_request",
        permission: ["transfer.request", "transfer.check", "transfer.approve"],
      },
    ],
  },
  {
    key: "report",
    nameKey: "menu.report",
    permission: "report.view",
    subItems: [
      { nameKey: "menu.incomeReport", path: "/income_report" },
      { nameKey: "menu.customerReport", path: "/customer_report" },
      { nameKey: "menu.customerTypeReport", path: "/customer_type_report" },
    ],
  },
  { key: "printer", nameKey: "menu.printer", path: "/printers", permission: "printer.manage" },
  {
    key: "user",
    nameKey: "menu.user",
    permission: "user.manage",
    subItems: [
      { nameKey: "menu.userList", path: "/user" },
      { nameKey: "menu.permissions", path: "/user_authorize" },
    ],
  },
];

/** A group is included if ANY sub-item is reachable, keeping only those. */
export function visibleMenu(perms: readonly Permission[]): MenuItem[] {
  return MENU.reduce<MenuItem[]>((acc, item) => {
    if (!item.subItems) {
      if (can(perms, item.permission)) acc.push(item);
      return acc;
    }
    const subItems = item.subItems.filter((sub) => can(perms, sub.permission ?? item.permission));
    if (subItems.length > 0) acc.push({ ...item, subItems });
    return acc;
  }, []);
}

/** Whether a path in the MENU table is reachable. Paths the table doesn't
 *  list (the dashboard) are open to every signed-in user. */
export function canReachPath(perms: readonly Permission[], path: string): boolean {
  for (const item of MENU) {
    if (item.path === path) return can(perms, item.permission);
    const sub = item.subItems?.find((s) => s.path === path);
    if (sub) return can(perms, sub.permission ?? item.permission);
  }
  return true;
}
