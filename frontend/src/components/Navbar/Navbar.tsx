import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { LogOut, PanelLeft } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";
import JWTManager from "../../utils/jwt";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

/** Route to the menu key shown in the breadcrumb. */
const ROUTE_KEYS: Record<string, string> = {
    "/ticket": "menu.sellTicket",
    "/member": "menu.member",
    "/member_price_table": "menu.memberPrice",
    "/coupon_price_table": "menu.couponPrice",
    "/hold_request": "menu.holdRequest",
    "/transfer_request": "menu.transferRequest",
    "/income_report": "menu.incomeReport",
    "/customer_report": "menu.customerReport",
    "/customer_type_report": "menu.customerTypeReport",
    "/printers": "menu.printer",
    "/user": "menu.userList",
    "/user_authorize": "menu.permissions",
};

/** Up to two initials from a display name; works for Khmer as well as Latin. */
function initials(name: string | null): string {
    if (!name) return "?";
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => Array.from(w)[0] ?? "")
        .join("")
        .toUpperCase();
}

export default function NavBar() {
    const { t } = useTranslation();
    const location = useLocation();
    // toggleSidebar, not the raw desktop flag: it routes to the offcanvas panel
    // on desktop and the Sheet on mobile, which a plain setExpanded cannot do.
    const { toggleSidebar } = useSidebar();
    const { setIsAuthenticated } = useAuthContext();
    const display_name = localStorage.getItem("display_name");
    const role = localStorage.getItem("role");
    const currentKey = ROUTE_KEYS[location.pathname];

    const signOut = () => {
        JWTManager.deleteToken();
        setIsAuthenticated(false);
    };

    return (
        <header className="sticky left-0 top-0 z-30 flex h-12 items-center gap-2 border-b border-rule bg-card px-3">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="sidebar-toggle text-ink"
                onClick={toggleSidebar}
                aria-label={t("ui.sidebar.toggle")}
            >
                <PanelLeft aria-hidden="true" />
            </Button>

            <nav aria-label="Breadcrumb" className="min-w-0">
                <ol className="flex items-center gap-2 text-sm">
                    <li>
                        <Link to="/" className="font-medium text-ink-soft hover:text-ink hover:underline">
                            {t("nav.home")}
                        </Link>
                    </li>
                    {currentKey && (
                        <>
                            <li aria-hidden="true" className="text-ink-soft">/</li>
                            <li className="truncate font-medium text-ink" aria-current="page">
                                {t(currentKey)}
                            </li>
                        </>
                    )}
                </ol>
            </nav>

            <div className="ml-auto flex items-center gap-2">
                {/* The login page has its own picker; this is the only way to change
                    language once the app shell has taken over. */}
                <LanguageSwitcher align="end" />

                <Separator orientation="vertical" className="h-6 bg-rule" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-2 rounded-full pr-1 text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                        >
                            <span className="sr-only">Open user menu</span>
                            <span
                                aria-hidden="true"
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-rule bg-wash text-caption font-medium text-ink"
                            >
                                {initials(display_name)}
                            </span>
                            <span className="hidden max-w-[12rem] truncate text-sm font-medium sm:block">{display_name}</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="font-normal">
                            <span className="block truncate text-sm font-medium text-ink">{display_name}</span>
                            <span className="block text-caption text-ink-soft">{t("nav.role")}: {role}</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={signOut}
                            className="cursor-pointer text-void-deep focus:bg-void-tint focus:text-void-deep"
                        >
                            <LogOut aria-hidden="true" />
                            {t("nav.signOut")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
