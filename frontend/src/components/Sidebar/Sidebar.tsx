/**
 * Primary navigation: the board's index.
 *
 * Mechanics are the shadcn sidebar primitives in ui/sidebar.tsx (offcanvas
 * panel on desktop, a Sheet on mobile, the `b` shortcut, collapsible groups
 * that auto-expand onto the active route) with the sign-out action in the
 * footer.
 *
 * Access is the coarse role string in localStorage ("Admin" / "Sale"), which
 * is what the previous sidebar used, so the same items stay visible to the
 * same people. Labels come from i18next (menu.* keys).
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
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";
import JWTManager from "../../utils/jwt";
import { cn } from "@/lib/utils";
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
import { gql, useMutation } from "@apollo/client";

// Ends the session server-side: bumps the user's tokenVersion and clears the
// refresh cookie, so AuthContext.checkAuth cannot silently log them back in.
const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
    }
  }
`;

type Role = "Admin" | "Sale";

interface SubMenuItem {
  nameKey: string;
  path: string;
}

interface MenuItem {
  /** Stable identifier for React keys and open-menu state. */
  key: string;
  nameKey: string;
  path?: string;
  icon: React.ReactNode;
  access: Role[];
  subItems?: SubMenuItem[];
}

const MENU: MenuItem[] = [
  {
    key: "ticket",
    nameKey: "menu.sellTicket",
    path: "/ticket",
    access: ["Sale", "Admin"],
    icon: <Ticket />,
  },
  {
    key: "member",
    nameKey: "menu.member",
    path: "/member",
    access: ["Sale", "Admin"],
    icon: <Users />,
  },
  {
    key: "price",
    nameKey: "menu.priceTable",
    access: ["Admin", "Sale"],
    icon: <CircleDollarSign />,
    subItems: [
      { nameKey: "menu.memberPrice", path: "/member_price_table" },
      { nameKey: "menu.couponPrice", path: "/coupon_price_table" },
    ],
  },
  {
    key: "request",
    nameKey: "menu.request",
    access: ["Admin", "Sale"],
    icon: <ClipboardList />,
    subItems: [
      { nameKey: "menu.holdRequest", path: "/hold_request" },
      { nameKey: "menu.transferRequest", path: "/transfer_request" },
    ],
  },
  {
    key: "report",
    nameKey: "menu.report",
    access: ["Admin"],
    icon: <BarChart3 />,
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
    icon: <Printer />,
  },
  {
    key: "user",
    nameKey: "menu.user",
    access: ["Admin"],
    icon: <UserCog />,
    subItems: [
      { nameKey: "menu.userList", path: "/user" },
      { nameKey: "menu.permissions", path: "/user_authorize" },
    ],
  },
];

/** The small magnet at the end of an index line; ink when the line is the current page. */
function IndexDot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "ml-auto h-2 w-2 shrink-0 rounded-full transition-colors",
        active ? "bg-ink" : "bg-rule"
      )}
    />
  );
}

export default function SideBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { setIsAuthenticated } = useAuthContext();
  const { isMobile, setOpenMobile } = useSidebar();

  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  const role = localStorage.getItem("role") as Role | null;

  const visibleByRole = useMemo(
    () => MENU.filter((item) => !!role && item.access.includes(role)),
    [role]
  );

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
      <SidebarHeader className="px-4 pb-0 pt-4">
        <Link
          to="/"
          onClick={handleNavigate}
          className="block rounded-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <span className="block text-caption font-black uppercase leading-tight tracking-[0.12em]">CKD · Ticket</span>
          <span className="block truncate text-caption text-ink-soft">{t("board.club")}</span>
        </Link>
        <div className="marker-rule mt-3" />
      </SidebarHeader>

      <SidebarContent className="pt-1">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-caption font-black uppercase tracking-[0.12em] text-ink">
            {t("menu.label")}
          </SidebarGroupLabel>
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
                          {item.icon}
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
                                    <IndexDot active={active} />
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
                      {item.icon}
                      <span className="flex-1 truncate">{t(item.nameKey)}</span>
                      <IndexDot active={isActiveParent} />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-rule">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("common.logout")}
              onClick={handleLogout}
              className="text-magnet-rejected hover:bg-magnet-rejected/10 hover:text-magnet-rejected active:bg-magnet-rejected/15 active:text-magnet-rejected"
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
