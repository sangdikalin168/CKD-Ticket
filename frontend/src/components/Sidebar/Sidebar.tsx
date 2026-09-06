/**
 * Primary navigation: the app's index.
 *
 * Mechanics are the shadcn sidebar primitives in ui/sidebar.tsx (offcanvas
 * panel on desktop, a Sheet on mobile, the `b` shortcut, collapsible groups
 * that auto-expand onto the active route) with the sign-out action in the
 * footer.
 *
 * Access — the MENU table and its role matching — lives in lib/access.ts and
 * is shared with every other screen that needs to know what a role may
 * reach (the dashboard's quick actions, admin-only tabs and buttons
 * elsewhere). Labels come from i18next (menu.* keys); icons are looked up
 * here by the item's key since MENU itself carries no JSX.
 *
 * A role that cannot be resolved to one of the known values (missing,
 * blank, unrecognized) renders no menu items — the server's permissions
 * are a whitelist, so guessing which items to show would either hide
 * legitimate access or imply access the server will refuse. Instead the
 * group shows an explicit "role not recognized" state with a sign-in-again
 * control, so there is always a visible way forward.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  LogOut,
  Printer,
  ShieldAlert,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";
import JWTManager from "../../utils/jwt";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EmptyState } from "@/components/ui/EmptyState";
import { gql, useMutation } from "@apollo/client";
import { normalizeRole, visibleMenu, type SubMenuItem } from "@/lib/access";

// Ends the session server-side: bumps the user's tokenVersion and clears the
// refresh cookie, so AuthContext.checkAuth cannot silently log them back in.
const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
    }
  }
`;

/** Icons are presentation, not access control, so they stay here keyed by
 *  MENU's item key rather than living on the shared (JSX-free) access table. */
const MENU_ICONS: Record<string, React.ReactNode> = {
  ticket: <Ticket />,
  member: <Users />,
  price: <CircleDollarSign />,
  request: <ClipboardList />,
  report: <BarChart3 />,
  printer: <Printer />,
  user: <UserCog />,
};

export default function SideBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { setIsAuthenticated } = useAuthContext();
  const { isMobile, setOpenMobile } = useSidebar();

  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  const role = normalizeRole(localStorage.getItem("role"));

  // The access table lives in lib/access.ts and is shared with the dashboard
  // and other screens — see that module's doc comment for why an unresolved
  // role deliberately reaches nothing rather than guessing.
  const visibleByRole = useMemo(() => visibleMenu(role), [role]);

  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  // Auto-expand the group containing the active route.
  useEffect(() => {
    const active = visibleByRole.find((m) =>
      m.subItems?.some((s) => s.path === location.pathname)
    );
    if (active) setOpenSubMenu(active.key);
  }, [location.pathname, visibleByRole]);

  const isActiveSubMenu = (subItems?: SubMenuItem[]) =>
    !!subItems?.some((s) => location.pathname === s.path);

  const [logoutMutation] = useMutation(LOGOUT_MUTATION);
  const handleLogout = async () => {
    // Needs the access token, so it goes before the local wipe. Best effort:
    // a network failure must still log the counter out locally.
    try {
      await logoutMutation();
    } catch (e) {
      console.warn("logout mutation failed", e);
    }
    JWTManager.deleteToken();
    localStorage.removeItem("accessToken");
    setIsAuthenticated(false);
  };

  return (
    <SidebarRoot collapsible="offcanvas" id="primary-sidebar" aria-label="Primary navigation">
      <SidebarHeader className="h-12 justify-center border-b border-rule px-4 py-0">
        <Link
          to="/"
          onClick={handleNavigate}
          className="block rounded-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <span className="block text-base font-semibold leading-tight">CKD Ticket</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="pt-1">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-caption font-medium tracking-wider text-ink-soft">
            {t("menu.label")}
          </SidebarGroupLabel>
          {visibleByRole.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title={t("menu.sessionIncomplete.title")}
              description={t("menu.sessionIncomplete.description")}
              action={
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-rule bg-card px-3 text-sm font-medium text-ink transition-colors hover:bg-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {t("menu.sessionIncomplete.action")}
                </button>
              }
            />
          ) : (
            <SidebarMenu>
              {visibleByRole.map((item) => {
                const isActiveParent =
                  isActiveSubMenu(item.subItems) ||
                  (!!item.path && location.pathname === item.path);

                if (item.subItems) {
                  const isExpanded = openSubMenu === item.key;
                  return (
                    <Collapsible
                      key={item.key}
                      asChild
                      open={isExpanded}
                      onOpenChange={() =>
                        setOpenSubMenu((prev) => (prev === item.key ? null : item.key))
                      }
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton isActive={isActiveParent} tooltip={t(item.nameKey)}>
                            {MENU_ICONS[item.key]}
                            <span className="flex-1 truncate">{t(item.nameKey)}</span>
                            <ChevronDown className="ml-auto size-4 text-ink-soft transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="overflow-hidden">
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => {
                              const active = location.pathname === subItem.path;
                              return (
                                <SidebarMenuSubItem key={subItem.path}>
                                  <SidebarMenuSubButton asChild isActive={active}>
                                    <Link to={subItem.path} onClick={handleNavigate}>
                                      <span className="flex-1 truncate">{t(subItem.nameKey)}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActiveParent} tooltip={t(item.nameKey)}>
                      <Link to={item.path!} onClick={handleNavigate}>
                        {MENU_ICONS[item.key]}
                        <span className="flex-1 truncate">{t(item.nameKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-rule">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("common.logout")}
              onClick={handleLogout}
              className="text-void-deep hover:bg-void-tint hover:text-void-deep active:bg-void-tint active:text-void-deep"
            >
              <LogOut />
              <span>{t("common.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarRoot>
  );
}
