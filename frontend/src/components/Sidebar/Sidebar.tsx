/**
 * Primary navigation, carried over from NAN-HR's sidebar.
 *
 * Structure, styling and behaviour follow NAN-HR: the shadcn sidebar
 * primitives in ui/sidebar.tsx, collapsible groups that auto-expand onto the
 * active route, and a footer holding the sign-out action.
 *
 * Two things are deliberately NOT carried over, because CKD-Ticket does not
 * have them:
 *   - NAN-HR gates items with <Can permission={...}> / usePermission(). Here
 *     access is the coarse role string in localStorage ("Admin" / "Sale"),
 *     which is what the previous sidebar used, so the same items stay visible
 *     to the same people.
 *   - Labels come from i18next (menu.* keys) so they follow the language
 *     switcher, same as NAN-HR.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { HiOutlineTicket, HiOutlineUserCircle } from "react-icons/hi";
import { FaUserCog } from "react-icons/fa";
import { MdOutlineDashboard } from "react-icons/md";
import { BsChevronDown } from "react-icons/bs";
import { IoLogOutOutline } from "react-icons/io5";
import { RiMoneyDollarCircleLine, RiFileList3Line } from "react-icons/ri";
import { useAuthContext } from "../../context/AuthContext";
import JWTManager from "../../utils/jwt";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

const ICON = "h-5 w-5";

const MENU: MenuItem[] = [
  {
    key: "ticket",
    nameKey: "menu.sellTicket",
    path: "/ticket",
    access: ["Sale", "Admin"],
    icon: <HiOutlineTicket className={ICON} />,
  },
  {
    key: "member",
    nameKey: "menu.member",
    path: "/member",
    access: ["Sale", "Admin"],
    icon: <HiOutlineUserCircle className={ICON} />,
  },
  {
    key: "price",
    nameKey: "menu.priceTable",
    access: ["Admin", "Sale"],
    icon: <RiMoneyDollarCircleLine className={ICON} />,
    subItems: [
      { nameKey: "menu.memberPrice", path: "/member_price_table" },
      { nameKey: "menu.couponPrice", path: "/coupon_price_table" },
    ],
  },
  {
    key: "request",
    nameKey: "menu.request",
    access: ["Admin", "Sale"],
    icon: <RiFileList3Line className={ICON} />,
    subItems: [
      { nameKey: "menu.holdRequest", path: "/hold_request" },
      { nameKey: "menu.transferRequest", path: "/transfer_request" },
    ],
  },
  {
    key: "report",
    nameKey: "menu.report",
    access: ["Admin"],
    icon: <MdOutlineDashboard className={ICON} />,
    subItems: [
      { nameKey: "menu.incomeReport", path: "/income_report" },
      { nameKey: "menu.customerReport", path: "/customer_report" },
      { nameKey: "menu.customerTypeReport", path: "/customer_type_report" },
    ],
  },
  {
    key: "user",
    nameKey: "menu.user",
    access: ["Admin"],
    icon: <FaUserCog className={ICON} />,
    subItems: [
      { nameKey: "menu.userList", path: "/user" },
      { nameKey: "menu.permissions", path: "/user_authorize" },
    ],
  },
];

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

  const handleLogout = () => {
    JWTManager.deleteToken();
    localStorage.removeItem("accessToken");
    setIsAuthenticated(false);
  };

  return (
    <SidebarRoot collapsible="offcanvas" id="primary-sidebar" aria-label="Primary navigation">
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="tracking-[0.18em]">{t("menu.label")}</SidebarGroupLabel>
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
                          <span className="flex-shrink-0">{item.icon}</span>
                          <span className="flex-1 truncate">{t(item.nameKey)}</span>
                          <BsChevronDown className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="overflow-hidden">
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.path}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={location.pathname === subItem.path}
                              >
                                <Link to={subItem.path} onClick={handleNavigate}>
                                  <span className="flex-1 truncate">{t(subItem.nameKey)}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
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
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="flex-1 truncate">{t(item.nameKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("common.logout")}
              onClick={handleLogout}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20"
            >
              <IoLogOutOutline className={ICON} />
              <span>{t("common.logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarRoot>
  );
}
