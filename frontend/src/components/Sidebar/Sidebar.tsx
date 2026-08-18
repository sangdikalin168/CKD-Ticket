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
 *   - NAN-HR pulls labels from i18next. CKD-Ticket's labels are Khmer
 *     literals, exactly as the old sidebar had them.
 */
import React, { useEffect, useMemo, useState } from "react";
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
  name: string;
  path: string;
}

interface MenuItem {
  /** Stable identifier for React keys and open-menu state. */
  key: string;
  name: string;
  path?: string;
  icon: React.ReactNode;
  access: Role[];
  subItems?: SubMenuItem[];
}

const ICON = "h-5 w-5";

const MENU: MenuItem[] = [
  {
    key: "ticket",
    name: "លក់សំបុត្រ",
    path: "/ticket",
    access: ["Sale", "Admin"],
    icon: <HiOutlineTicket className={ICON} />,
  },
  {
    key: "member",
    name: "សមាជិក",
    path: "/member",
    access: ["Sale", "Admin"],
    icon: <HiOutlineUserCircle className={ICON} />,
  },
  {
    key: "price",
    name: "តារាងតម្លៃ",
    access: ["Admin", "Sale"],
    icon: <RiMoneyDollarCircleLine className={ICON} />,
    subItems: [
      { name: "តម្លៃសមាជិក", path: "/member_price_table" },
      { name: "តម្លៃគូប៉ុន", path: "/coupon_price_table" },
    ],
  },
  {
    key: "request",
    name: "សំណើ",
    access: ["Admin", "Sale"],
    icon: <RiFileList3Line className={ICON} />,
    subItems: [
      { name: "សំណើសុំច្បាប់", path: "/hold_request" },
      { name: "សំណើផ្ទេរសុពលភាព", path: "/transfer_request" },
    ],
  },
  {
    key: "report",
    name: "របាយការណ៍",
    access: ["Admin"],
    icon: <MdOutlineDashboard className={ICON} />,
    subItems: [
      { name: "ចំណូល", path: "/income_report" },
      { name: "អតិថិជន", path: "/customer_report" },
      { name: "ប្រភេទសមាជិក", path: "/customer_type_report" },
    ],
  },
  {
    key: "user",
    name: "អ្នកប្រើប្រាស់",
    access: ["Admin"],
    icon: <FaUserCog className={ICON} />,
    subItems: [
      { name: "អ្នកប្រើប្រាស់", path: "/user" },
      { name: "កំណត់សិទ្ធិ", path: "/user_authorize" },
    ],
  },
];

export default function SideBar() {
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
          <SidebarGroupLabel className="tracking-[0.18em]">ម៉ឺនុយ</SidebarGroupLabel>
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
                        <SidebarMenuButton isActive={isActiveParent} tooltip={item.name}>
                          <span className="flex-shrink-0">{item.icon}</span>
                          <span className="flex-1 truncate">{item.name}</span>
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
                                  <span className="flex-1 truncate">{subItem.name}</span>
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
                  <SidebarMenuButton asChild isActive={isActiveParent} tooltip={item.name}>
                    <Link to={item.path!} onClick={handleNavigate}>
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="flex-1 truncate">{item.name}</span>
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
              tooltip="ចាកចេញ"
              onClick={handleLogout}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20"
            >
              <IoLogOutOutline className={ICON} />
              <span>ចាកចេញ</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarRoot>
  );
}
