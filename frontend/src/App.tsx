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
import { CustomerReport } from "./pages/Report/CustomerReport";
import CustomerTypeReport from "./pages/Report/CustomerTypeReport";
import Printers from "./pages/Settings/Printers";
import { BoardHeader } from "@/components/board/BoardHeader";
import { BoardSection } from "@/components/board/BoardSection";
import { ActionTile } from "@/components/board/ActionTile";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayFigures } from "./hooks/useTodayFigures";
import { formatCount, formatMoney } from "./lib/money";

function NoMatch() {
  const { t } = useTranslation();
  return (
    <main className="board-grid grid min-h-screen place-items-center px-6 py-24">
      <div className="w-full max-w-md rounded-xl border border-rule bg-card p-8 text-center">
        <p className="text-price font-black leading-none text-ink">404</p>
        <div className="marker-rule mx-auto mt-4 w-16" />
        <h1 className="mt-4 text-heading font-black text-ink">{t("notFound.title")}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t("notFound.body")}</p>
        <Button asChild className="mt-6">
          <a href="/">{t("notFound.home")}</a>
        </Button>
      </div>
    </main>
  )
}

/** A figure on the ledger strip: the label written beside the number, not under it. */
function Figure({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="flex min-w-0 items-baseline gap-3 px-4 py-3">
      <span className="truncate text-caption text-ink-soft">{label}</span>
      {loading ? (
        <Skeleton className="h-6 w-16" />
      ) : (
        <span className="text-heading font-black leading-none text-ink">{value}</span>
      )}
    </div>
  );
}

function Dashboard() {
  const { t } = useTranslation();
  const role = localStorage.getItem("role");
  const displayName = localStorage.getItem("display_name");
  const figures = useTodayFigures();

  const reports = [
    { to: "/income_report", title: t("dashboard.reports.income.title"), description: t("dashboard.reports.income.description") },
    { to: "/customer_report", title: t("dashboard.reports.customer.title"), description: t("dashboard.reports.customer.description") },
    { to: "/customer_type_report", title: t("dashboard.reports.type.title"), description: t("dashboard.reports.type.description") },
  ];

  return (
    <div className="space-y-6">
      <BoardHeader
        titleKey="board.title"
        subtitle={t("dashboard.welcome", { name: displayName, role })}
      />

      {/* Today's figures: one ledger strip, figures beside their labels. */}
      <section aria-label={t("board.figures")} className="overflow-x-auto rounded-lg border border-rule bg-card">
        <div className="flex min-w-max divide-x divide-rule">
          <Figure label={t("dashboard.today.tickets")} value={formatCount(figures.ticketsToday)} loading={figures.loading} />
          <Figure label={t("dashboard.today.members")} value={formatCount(figures.members)} loading={figures.loading} />
          <Figure label={t("dashboard.today.income")} value={formatMoney(figures.incomeToday)} loading={figures.loading} />
        </div>
      </section>

      <BoardSection title={t("board.quickActions")}>
        <div className="flex flex-wrap gap-3">
          <ActionTile to="/ticket" icon={<TicketIcon />} label={t("menu.sellTicket")} />
          <ActionTile to="/member" icon={<Users />} label={t("menu.member")} />
          <ActionTile to="/hold_request" icon={<PauseCircle />} label={t("menu.holdRequest")} />
          <ActionTile to="/transfer_request" icon={<ArrowLeftRight />} label={t("dashboard.transfer")} />
          {role === "Admin" && (
            <ActionTile to="/income_report" icon={<BarChart3 />} label={t("menu.incomeReport")} />
          )}
        </div>
      </BoardSection>

      {/* Reports as a marker list — Admin only */}
      {role === "Admin" && (
        <BoardSection title={t("board.reports")}>
          <ul className="divide-y divide-rule rounded-lg border border-rule bg-card">
            {reports.map((r) => (
              <li key={r.to}>
                <Link
                  to={r.to}
                  className="flex items-center gap-3 px-4 py-2.5 text-ink transition-colors hover:bg-tray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
                >
                  <span aria-hidden="true" className="marker-dot" style={{ ["--marker" as string]: "var(--ink)" }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{r.title}</span>
                    <span className="block text-caption text-ink-soft">{r.description}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </BoardSection>
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
      { path: "/hold_request", Component: HoldRequest },
      { path: "/transfer_request", Component: TransferRequest },
      { path: "/income_report", Component: IncomeReport },
      { path: "/customer_report", Component: CustomerReport },
      { path: "/customer_type_report", Component: CustomerTypeReport },
      { path: "/printers", Component: Printers },
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
      className="min-h-screen bg-board"
    >
      <SideBar />
      <SidebarInset className="board-grid min-w-0">
        <NavBar />
        <div className="p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App;
