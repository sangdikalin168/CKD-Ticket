import { useEffect } from "react";
import React from "react";
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
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import IncomeReport from "./pages/Report/IncomeReport";
import { MemberPriceTable } from "./pages/PriceTable/MemberPriceTable";
import { CouponPriceTable } from "./pages/PriceTable/CouponPriceTable";
import { CustomerReport } from "./pages/Report/CustomerReport";
import CustomerTypeReport from "./pages/Report/CustomerTypeReport";
import Printers from "./pages/Settings/Printers";

function NoMatch() {
  return (
    <>
      <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <p className="text-base font-semibold text-indigo-600">404</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Page not found</h1>
          <p className="mt-6 text-base leading-7 text-gray-600">Sorry, we couldn&apos;t find the page you&apos;re looking for.</p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a href="/" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
              Go back home
            </a>
            <a href="#" className="text-sm font-semibold text-gray-900">
              Contact support <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </main>
    </>
  )
}

function StatCard({ title, value, description, icon, linkTo, linkLabel }: {
  title: string; value: string; description: string; icon: React.ReactNode; linkTo: string; linkLabel: string;
}) {
  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <a href={linkTo} className="text-xs text-primary font-medium hover:underline mt-auto">{linkLabel} →</a>
    </div>
  );
}

function QuickAction({ label, to, icon }: { label: string; to: string; icon: React.ReactNode }) {
  return (
    <a href={to} className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-center shadow-sm">
      <span className="text-2xl text-primary">{icon}</span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </a>
  );
}

function Dashboard() {
  const { t } = useTranslation();
  const role = localStorage.getItem("role");
  const displayName = localStorage.getItem("display_name");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("dashboard.welcome", { name: displayName, role })}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={t("dashboard.members.title")}
          value={t("dashboard.members.value")}
          description={t("dashboard.members.description")}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          linkTo="/member"
          linkLabel={t("dashboard.members.link")}
        />
        <StatCard
          title={t("dashboard.tickets.title")}
          value={t("dashboard.tickets.value")}
          description={t("dashboard.tickets.description")}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>}
          linkTo="/ticket"
          linkLabel={t("dashboard.tickets.link")}
        />
        <StatCard
          title={t("dashboard.hold.title")}
          value={t("dashboard.hold.value")}
          description={t("dashboard.hold.description")}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          linkTo="/hold_request"
          linkLabel={t("dashboard.hold.link")}
        />
        <StatCard
          title={t("dashboard.report.title")}
          value={t("dashboard.report.value")}
          description={t("dashboard.report.description")}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          linkTo="/income_report"
          linkLabel={t("dashboard.report.link")}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-4">{t("dashboard.quickActions")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <QuickAction label={t("menu.sellTicket")} to="/ticket"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>} />
          <QuickAction label={t("menu.member")} to="/member"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
          <QuickAction label={t("menu.holdRequest")} to="/hold_request"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <QuickAction label={t("dashboard.transfer")} to="/transfer_request"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>} />
          <QuickAction label={t("menu.incomeReport")} to="/income_report"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
        </div>
      </div>

      {/* Reports grid — Admin only */}
      {role === "Admin" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/income_report" className="block bg-card border rounded-lg p-5 shadow-sm hover:bg-accent transition-colors">
            <div className="font-semibold text-sm mb-1">{t("dashboard.reports.income.title")}</div>
            <div className="text-xs text-muted-foreground">{t("dashboard.reports.income.description")}</div>
          </a>
          <a href="/customer_report" className="block bg-card border rounded-lg p-5 shadow-sm hover:bg-accent transition-colors">
            <div className="font-semibold text-sm mb-1">{t("dashboard.reports.customer.title")}</div>
            <div className="text-xs text-muted-foreground">{t("dashboard.reports.customer.description")}</div>
          </a>
          <a href="/customer_type_report" className="block bg-card border rounded-lg p-5 shadow-sm hover:bg-accent transition-colors">
            <div className="font-semibold text-sm mb-1">{t("dashboard.reports.type.title")}</div>
            <div className="text-xs text-muted-foreground">{t("dashboard.reports.type.description")}</div>
          </a>
        </div>
      )}

      {/* Info */}
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <h2 className="text-base font-semibold mb-2">{t("dashboard.info.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.info.body")}
        </p>
      </div>
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
      className="min-h-screen bg-gray-50"
    >
      <SideBar />
      <SidebarInset className="min-w-0 bg-gray-50">
        <NavBar />
        <div className="p-3">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App;
