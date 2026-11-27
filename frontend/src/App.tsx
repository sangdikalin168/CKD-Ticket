import { useEffect } from "react";
import Ticket from "./pages/Ticket/Ticket";
import { Member } from "./pages/Member/Member";
import Login from "./pages/Login/Login";
import { useAuthContext } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HoldRequest from "./pages/Request/HoldRequest/HoldRequest";
import TransferRequest from "./pages/Request/TransferRequest/TransferRequest";
import { useSideBarContext } from "./context/SideBarContext";
import SideBar from "./components/Sidebar/Sidebar";
import NavBar from "./components/Navbar/Navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { createBrowserRouter, Link, Outlet, RouterProvider } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeftRight,
  BarChart3,
  ChevronRight,
  PauseCircle,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import IncomeReport from "./pages/Report/IncomeReport";
import { MemberPriceTable } from "./pages/PriceTable/MemberPriceTable";
import { CouponPriceTable } from "./pages/PriceTable/CouponPriceTable";
import { CustomerReport } from "./pages/Report/CustomerReport";
import CustomerTypeReport from "./pages/Report/CustomerTypeReport";
import Printers from "./pages/Settings/Printers";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/button";
import { FigureStrip } from "@/components/ui/FigureStrip";
import { useTodayFigures } from "./hooks/useTodayFigures";
import { formatCount, formatMoney } from "./lib/money";
import { can, canReachPath, currentRole, setPermissions, usePermissions } from "./lib/access";
import UsersPage from "./pages/Users/Users";
import Permissions from "./pages/Users/Permissions";
import { EmptyState } from "@/components/ui/EmptyState";
import { gql, useQuery } from "@apollo/client";
import { useLocation } from "react-router-dom";
import { Lock } from "lucide-react";

function NoMatch() {
  const { t } = useTranslation();
  return (
    <main className="grid min-h-screen place-items-center bg-floor px-6 py-24">
      <div className="w-full max-w-md rounded-lg border border-rule bg-card p-8 text-center">
        <p className="figure text-2xl font-semibold leading-none text-ink-soft">404</p>
        <h1 className="mt-3 text-xl font-semibold text-ink">{t("notFound.title")}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t("notFound.body")}</p>
        <Button asChild className="mt-6">
          <a href="/">{t("notFound.home")}</a>
        </Button>
      </div>
    </main>
  )
}

function Dashboard() {
  const { t } = useTranslation();
  // Normalized, not the raw stored string — see lib/access.ts. The same
  // MENU table the sidebar reads decides which links below are real, so an
  // unresolved role (the sidebar's "role not recognized" dead end) never
  // shows a Checker or a stale session a working-looking link the server
  // would refuse.
  const role = currentRole();
  const permissions = usePermissions();
  const displayName = localStorage.getItem("display_name");
  // Whole-gym figures are a permission of their own ("dashboard.view").
  const showFigures = can(permissions, "dashboard.view");
  const figures = useTodayFigures({ enabled: showFigures });

  // Either piece can be missing (a stale or incomplete session — see
  // Sidebar.tsx) and the greeting must not print "Welcome, ·" around a gap:
  // join only what is actually present, and fall back to a bare greeting
  // when neither is.
  const identity = [displayName, role].map((v) => v?.trim()).filter(Boolean).join(" · ");
  const welcome = identity ? t("dashboard.welcome", { value: identity }) : t("dashboard.welcomeGeneric");

  const reports = [
    { to: "/income_report", title: t("dashboard.reports.income.title"), description: t("dashboard.reports.income.description") },
    { to: "/customer_report", title: t("dashboard.reports.customer.title"), description: t("dashboard.reports.customer.description") },
    { to: "/customer_type_report", title: t("dashboard.reports.type.title"), description: t("dashboard.reports.type.description") },
  ].filter((r) => canReachPath(permissions, r.to));

  const quickActions = [
    { to: "/ticket", icon: TicketIcon, label: t("menu.sellTicket") },
    { to: "/member", icon: Users, label: t("menu.member") },
    { to: "/hold_request", icon: PauseCircle, label: t("menu.holdRequest") },
    { to: "/transfer_request", icon: ArrowLeftRight, label: t("dashboard.transfer") },
    { to: "/income_report", icon: BarChart3, label: t("menu.incomeReport") },
  ].filter((a) => canReachPath(permissions, a.to));

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="dashboard.title"
        subtitle={welcome}
      />

      {/* Today's figures: one ruled strip, never a grid of same-size cards.
          Only with "dashboard.view" — it is the whole gym's takings. */}
      {showFigures && (
        <FigureStrip
          aria-label={t("dashboard.figures")}
          loading={figures.loading}
          items={[
            { label: t("dashboard.today.tickets"), value: formatCount(figures.ticketsToday) },
            { label: t("dashboard.today.members"), value: formatCount(figures.members) },
            { label: t("dashboard.today.income"), value: formatMoney(figures.incomeToday) },
          ]}
        />
      )}

      {/* Quick actions: a row of ordinary secondary buttons, not tiles.
          Hidden, not empty, when the role reaches none of them — an
          unresolved role gets no working-looking links here, only the
          sidebar's "role not recognized" dead end. */}
      {quickActions.length > 0 && (
        <Section title={t("dashboard.quickActions")}>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <Button key={a.to} asChild variant="outline">
                <Link to={a.to}>
                  <a.icon aria-hidden="true" />
                  {a.label}
                </Link>
              </Button>
            ))}
          </div>
        </Section>
      )}

      {/* Reports — same MENU access as the sidebar's report group (Admin only) */}
      {reports.length > 0 && (
        <Section title={t("dashboard.reportsTitle")}>
          <ul className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-card">
            {reports.map((r) => (
              <li key={r.to}>
                <Link
                  to={r.to}
                  className="flex items-center gap-3 px-4 py-2.5 text-ink transition-colors hover:bg-wash/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{r.title}</span>
                    <span className="block text-caption text-ink-soft">{r.description}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="text-caption text-ink-soft">{t("dashboard.info.body")}</p>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: "*",
    Component: NoMatch,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { path: "/", Component: Dashboard },
      { path: "/ticket", Component: Ticket },
      { path: "/member", Component: Member },
      { path: "/member_price_table", Component: MemberPriceTable },
      { path: "/coupon_price_table", Component: CouponPriceTable },
      { path: "/hold_request", Component: HoldRequest },
      { path: "/transfer_request", Component: TransferRequest },
      { path: "/income_report", Component: IncomeReport },
      { path: "/customer_report", Component: CustomerReport },
      { path: "/customer_type_report", Component: CustomerTypeReport },
      { path: "/printers", Component: Printers },
      { path: "/user", Component: UsersPage },
      { path: "/user_authorize", Component: Permissions },
    ],
  },
]);

function App() {
  const { checkAuth, isAuthenticated, setIsLoading } = useAuthContext();

  const authenticate = async () => {
    setIsLoading(true);
    await checkAuth();
    setIsLoading(false);
  };

  useEffect(() => {
    authenticate();
  }, []);

  if (!isAuthenticated) return <Login />;

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  )
}

function Layout() {
  // SideBarContext stays the source of truth for the desktop open/closed state
  // so anything already reading it keeps working; SidebarProvider mirrors it.
  // The provider owns the mobile state separately (a Sheet), which is why the
  // hand-rolled backdrop and the md:ml-64 margin maths are gone — the
  // provider's flex layout and SidebarInset handle both.
  const { expanded, setExpanded } = useSideBarContext();
  return (
    <SidebarProvider
      open={expanded}
      onOpenChange={setExpanded}
      className="min-h-screen bg-floor"
    >
      <SideBar />
      <SidebarInset className="min-w-0 bg-floor">
        <NavBar />
        <div className="p-3 md:p-4">
          <PermissionGate />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

const MY_PERMISSIONS = gql`
  query MyPermissions {
    my_permissions
  }
`;

/** Renders the page only if the signed-in user may open it (lib/access.ts
 *  MENU), so typing a URL doesn't open a page the menu hides. Also refreshes
 *  the user's permissions from the server on every app load, so a change an
 *  Admin made applies without signing out. The server checks every protected
 *  operation regardless. */
function PermissionGate() {
  const { t } = useTranslation();
  const location = useLocation();
  const permissions = usePermissions();
  const { data } = useQuery<{ my_permissions: string[] }>(MY_PERMISSIONS, { fetchPolicy: "network-only" });

  useEffect(() => {
    if (data?.my_permissions) setPermissions(data.my_permissions);
  }, [data]);

  if (!canReachPath(permissions, location.pathname)) {
    return (
      <EmptyState
        icon={Lock}
        title={t("access.deniedTitle")}
        description={t("access.deniedBody")}
        action={{ label: t("notFound.home"), to: "/" }}
      />
    );
  }
  return <Outlet />;
}

export default App;
