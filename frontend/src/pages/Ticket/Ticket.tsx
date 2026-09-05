import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReactToPrint } from "react-to-print";
import { ComponentToPrint } from "../../components/ComponentToPrint/index";
import { v4 as uuidv4 } from "uuid";
import { gql, useQuery } from "@apollo/client";
import { useCreateTicketPaymentMutation } from "../../generated/graphql";
import { TypeOptions, toast } from "react-toastify";
import { Printer, Settings2, Ticket as TicketIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-line";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PriceCard } from "@/components/ui/PriceCard";
import { Section } from "@/components/ui/Section";
import { FacilityDot, FacilityMarks } from "@/components/ui/FacilityMark";
import { FACILITIES, FACILITY_ORDER, facilityGroup, type FacilityRef } from "@/lib/facility";
import { formatMoney, formatTime, todayIso } from "@/lib/money";
import TicketPriceConfigPage from "../TicketConfig/TicketPriceConfig";

/** The desktop shell's print bridge; absent in a plain browser. */
const printBridge = () =>
  (window as unknown as { electronAPI?: { printComponent1?: (url: string, cb: (r: unknown) => void) => void; printComponent?: (url: string, cb: (r: unknown) => void) => void } })
    .electronAPI;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const notify = (message: string, auto_Close: boolean | number, toastType: TypeOptions) => {
  if (!toast.isActive("alert")) {
    toast(message, { autoClose: auto_Close ? 500 : false, toastId: "alert", type: toastType });
  }
};

const datetime_format = (date_time: string | Date) => {
  const date = new Date(date_time);
  return (
    date.toLocaleDateString("fr-CA") +
    " " +
    date.toLocaleTimeString(navigator.language, { hour: "2-digit", minute: "2-digit" })
  );
};

/** One line of today's sales at this counter. */
export interface SaleLine {
  id: string;
  /** ISO timestamp of the sale. */
  at: string;
  seller: string;
  /** The ticket code printed on the slip. */
  code: string;
  facilities: FacilityRef[];
  amount: number;
  printed: boolean;
}

/** Today's tally for one price, from the server: how many sold, at what price. */
interface TallyRow {
  price: number;
  qty: number;
}

/** Today's lines at this counter survive a page change but not the day. */
const linesKey = () => `ticket-lines:${todayIso()}`;
const readLines = (): SaleLine[] => {
  try {
    const raw = sessionStorage.getItem(linesKey());
    return raw ? (JSON.parse(raw) as SaleLine[]) : [];
  } catch {
    return [];
  }
};
const writeLines = (lines: SaleLine[]) => {
  try {
    sessionStorage.setItem(linesKey(), JSON.stringify(lines.slice(0, 200)));
  } catch {
    /* storage full or unavailable: the list just does not persist */
  }
};

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const GET_TICKET_CONFIGS = gql`
  query GetTicketPriceConfigs {
    GetTicketPriceConfigs {
      config_id price label age_group
      facilities { facility_id name code }
    }
  }
`;

// The same aggregate the income report reads: how many tickets at each price
// today, every seller. Keeps this page's tally and the report on one row set.
const TODAY_TALLY = gql`
  query BoardTicketTally($dateFrom: String!, $dateTo: String!, $userId: Float!) {
    GetTicketPayment(dateFrom: $dateFrom, dateTo: $dateTo, userId: $userId) {
      price
      qty
    }
  }
`;

// ─── Sale tab ────────────────────────────────────────────────────────────────

function TicketSale() {
  const { t } = useTranslation();
  const [uuid, setUuid] = useState("");
  const [price, setPrice] = useState(0);
  const [seller, setSeller] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [lines, setLines] = useState<SaleLine[]>(() => readLines());

  const { data: configData, loading: configLoading } = useQuery(GET_TICKET_CONFIGS, {
    fetchPolicy: "no-cache",
  });

  const today = todayIso();
  const { data: tallyData, loading: tallyLoading, refetch: refetchTally } = useQuery(TODAY_TALLY, {
    variables: { dateFrom: today, dateTo: today, userId: 0 },
    fetchPolicy: "network-only",
  });

  const allConfigs: any[] = configData?.GetTicketPriceConfigs ?? [];

  // Prices are filed under the facility they grant; a product that grants more
  // than one is filed under the combination heading. Groups with no prices are
  // not drawn at all — an empty heading teaches nothing.
  const groups = useMemo(
    () =>
      FACILITY_ORDER.map((code) => ({
        code,
        meta: FACILITIES[code],
        label: t(`ticket.column.${code.toLowerCase()}`),
        cards: allConfigs
          .filter((cfg) => facilityGroup(cfg.facilities) === code)
          .sort((a, b) => a.price - b.price),
      })).filter((g) => g.cards.length > 0),
    [allConfigs, t]
  );

  const tally: TallyRow[] = useMemo(() => {
    const rows = (tallyData?.GetTicketPayment ?? []) as { price: number | string; qty: number | string }[];
    return rows
      .map((row) => ({ price: Number(row.price), qty: Number(row.qty) }))
      .sort((a, b) => a.price - b.price);
  }, [tallyData]);

  const soldToday = tally.reduce((n, r) => n + r.qty, 0);
  const totalToday = tally.reduce((n, r) => n + r.qty * r.price, 0);

  useEffect(() => {
    writeLines(lines);
  }, [lines]);

  const componentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handlePrint1 = async (target: HTMLIFrameElement) => {
    return new Promise(() => {
      const data = target.contentWindow!.document.documentElement.outerHTML;
      const blob = new Blob([data], { type: "text/html; charset=utf-8" });
      const url = URL.createObjectURL(blob);
      printBridge()?.printComponent1?.(url, (response) => {
        console.log("Main: ", response);
      });
    });
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    print: async (printIframe: HTMLIFrameElement) => {
      await handlePrint1(printIframe);
    },
  });

  const [createTicketPayment] = useCreateTicketPaymentMutation();

  const handleSelect = async (cfg: any) => {
    setActiveId(cfg.config_id);
    setPrice(cfg.price);
    const sellerName = localStorage.getItem("display_name") || "";
    setSeller(sellerName);
    const uid = (await uuidv4()).slice(0, 16);
    setUuid(uid);
    buttonRef.current?.click();

    const result = await createTicketPayment({
      variables: {
        userId: parseInt(localStorage.getItem("user_id") ?? "0"),
        price: cfg.price,
        ticketCode: uid + "Ticket",
      },
    });

    if (result.data?.CreateTicketPayment.success) {
      notify("Success", true, "success");
      setLines((prev) => [
        {
          id: uid,
          at: new Date().toISOString(),
          seller: sellerName,
          code: uid + "Ticket",
          facilities: cfg.facilities ?? [],
          amount: cfg.price,
          printed: true,
        },
        ...prev,
      ]);
      refetchTally();
      await new Promise((r) => setTimeout(r, 700));
    } else {
      notify(String(result.errors ?? "Error"), 5000, "error");
    }
    setActiveId(null);
  };

  // The hidden slip still holds the newest sale's code, price and seller, so
  // "print again" is the same print with the same paper.
  const handlePrintAgain = () => {
    if (!uuid) return;
    buttonRef.current?.click();
  };

  const isLoading = activeId !== null;
  const newest = lines[0];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="menu.sellTicket" subtitle={t("ticket.sellHint")} />

      {/* Hidden print button */}
      <button ref={buttonRef} className="hidden" onClick={handlePrint} />

      {configLoading ? (
        <div className="space-y-6" role="status" aria-live="polite">
          {[0, 1].map((g) => (
            <div key={g}>
              <Skeleton className="h-5 w-28" />
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[8.5rem] rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : allConfigs.length === 0 ? (
        <div className="rounded-lg border border-rule bg-card">
          <EmptyState
            icon={TicketIcon}
            title={t("ticket.noPrices")}
            description={t("ticket.noPricesHint")}
          />
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.code} aria-label={group.label} className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <FacilityDot code={group.code} />
                <h2 className="text-sm font-semibold text-ink">{group.label}</h2>
                <span className="figure text-caption text-ink-soft">{group.cards.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {group.cards.map((cfg) => (
                  <PriceCard
                    key={cfg.config_id}
                    price={cfg.price}
                    ageGroup={cfg.age_group}
                    facilities={cfg.facilities}
                    busy={activeId === cfg.config_id}
                    disabled={isLoading && activeId !== cfg.config_id}
                    onSelect={() => handleSelect(cfg)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Today's sales: an ordinary table with a scope line, in the compact
          ledger density — every counter's tally above, this counter's lines
          below, so the two are never confused for one another. */}
      <Section
        title={t("ticket.todaySales")}
        aside={
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            <span className="text-caption text-ink-soft">{t("ticket.allCounters")}</span>
            {tallyLoading && tally.length === 0 ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
                <span className="text-caption text-ink-soft">{t("ticket.soldToday")}</span>
                <span className="figure font-semibold text-ink">{soldToday}</span>
                <span className="text-caption text-ink-soft">{t("common.total")}</span>
                <span className="figure font-semibold text-ink">{formatMoney(totalToday)}</span>
              </span>
            )}
          </div>
        }
      >
        <div className="overflow-hidden rounded-lg border border-rule bg-card">
          {lines.length === 0 ? (
            <EmptyState
              icon={TicketIcon}
              title={t("ticket.noSalesYet")}
              description={t("ticket.noSalesYetHint")}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-caption">
                <thead className="border-b border-rule bg-wash text-left text-ink-soft">
                  <tr>
                    <th scope="col" className="px-3 py-1.5 font-medium">{t("ticket.col.time")}</th>
                    <th scope="col" className="px-3 py-1.5 font-medium">{t("ticket.col.customer")}</th>
                    <th scope="col" className="hidden px-3 py-1.5 font-medium sm:table-cell">{t("ticket.col.facility")}</th>
                    <th scope="col" className="px-3 py-1.5 text-right font-medium">{t("common.amount")}</th>
                    <th scope="col" className="hidden px-3 py-1.5 font-medium md:table-cell">{t("ticket.col.printed")}</th>
                    <th scope="col" className="w-px px-3 py-1.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/60">
                  {lines.map((line) => (
                    <tr key={line.id} className="leading-[19px] text-ink transition-colors hover:bg-wash/60">
                      <td className="figure whitespace-nowrap px-3 py-1">{formatTime(line.at)}</td>
                      <td className="whitespace-nowrap px-3 py-1">
                        <span className="font-medium">{t("common.walkIn")}</span>
                        <span className="figure ml-2 text-ink-soft">{line.code.slice(0, 8)}</span>
                        <span className="ml-2 text-ink-soft">· {line.seller}</span>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-1 sm:table-cell">
                        <FacilityMarks facilities={line.facilities} />
                      </td>
                      <td className="figure whitespace-nowrap px-3 py-1 text-right font-medium">
                        {formatMoney(line.amount)}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-1 md:table-cell">
                        {line.printed && <Chip tone="paid">{t("ticket.col.printed")}</Chip>}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1 text-right">
                        {uuid && line === newest && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-caption"
                            onClick={handlePrintAgain}
                          >
                            <Printer aria-hidden="true" />
                            {t("ticket.printAgain")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>

      {/* Hidden print template */}
      <div className="hidden">
        <ComponentToPrint
          ref={componentRef}
          price={price}
          name={seller}
          date={datetime_format(new Date())}
          uuid={uuid + "Ticket"}
        />
      </div>
    </div>
  );
}

// ─── Page: Sale + Config tabs (Config is Admin-only) ─────────────────────────

export default function Ticket() {
  const { t } = useTranslation();
  const role = (typeof localStorage !== "undefined" && localStorage.getItem("role")) || "";
  const isAdmin = role === "Admin";

  // Non-admins (Sale role) only ever see the sale screen — no tabs.
  if (!isAdmin) return <TicketSale />;

  return (
    <Tabs defaultValue="sale" className="space-y-4">
      <TabsList>
        <TabsTrigger value="sale">
          <TicketIcon aria-hidden="true" /> {t("ticket.sale")}
        </TabsTrigger>
        <TabsTrigger value="config">
          <Settings2 aria-hidden="true" /> {t("ticket.priceSetup")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sale">
        <TicketSale />
      </TabsContent>
      <TabsContent value="config">
        <TicketPriceConfigPage />
      </TabsContent>
    </Tabs>
  );
}
