import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReactToPrint } from "react-to-print";
import { ComponentToPrint } from "../../components/ComponentToPrint/index";
import { v4 as uuidv4 } from "uuid";
import { gql, useQuery } from "@apollo/client";
import { useCreateTicketPaymentMutation } from "../../generated/graphql";
import { TypeOptions, toast } from "react-toastify";
import { Settings2, Ticket as TicketIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-line";
import { Skeleton } from "@/components/ui/skeleton";
import { BoardHeader } from "@/components/board/BoardHeader";
import { PriceTile } from "@/components/board/PriceTile";
import { TodayBoard, type BoardLine, type TallyRow } from "@/components/board/TodayBoard";
import { FacilityDot } from "@/components/board/FacilityMark";
import { FACILITIES, FACILITY_ORDER, facilityColumn, facilityColor } from "@/lib/facility";
import { todayIso } from "@/lib/money";
import { cn } from "@/lib/utils";
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

/** Today's lines at this counter survive a page change but not the day. */
const linesKey = () => `board-lines:${todayIso()}`;
const readLines = (): BoardLine[] => {
  try {
    const raw = sessionStorage.getItem(linesKey());
    return raw ? (JSON.parse(raw) as BoardLine[]) : [];
  } catch {
    return [];
  }
};
const writeLines = (lines: BoardLine[]) => {
  try {
    sessionStorage.setItem(linesKey(), JSON.stringify(lines.slice(0, 200)));
  } catch {
    /* storage full or unavailable: the board just does not persist */
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
// today, every seller. Keeps the board's tally and the report on one row set.
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
  const [lines, setLines] = useState<BoardLine[]>(() => readLines());

  const { data: configData, loading: configLoading } = useQuery(GET_TICKET_CONFIGS, {
    fetchPolicy: "no-cache",
  });

  const today = todayIso();
  const { data: tallyData, loading: tallyLoading, refetch: refetchTally } = useQuery(TODAY_TALLY, {
    variables: { dateFrom: today, dateTo: today, userId: 0 },
    fetchPolicy: "network-only",
  });

  const allConfigs: any[] = configData?.GetTicketPriceConfigs ?? [];

  // The four fixed columns of the board, each owned by a facility; a product
  // that grants more than one facility is written in the combination column.
  const columns = useMemo(
    () =>
      FACILITY_ORDER.map((code) => ({
        code,
        meta: FACILITIES[code],
        label: t(`ticket.column.${code.toLowerCase()}`),
        tiles: allConfigs
          .filter((cfg) => facilityColumn(cfg.facilities) === code)
          .sort((a, b) => a.price - b.price),
      })),
    [allConfigs, t]
  );

  // Today's tally, coloured by the tile that sells at that price.
  const tally: TallyRow[] = useMemo(() => {
    const rows = (tallyData?.GetTicketPayment ?? []) as { price: number | string; qty: number | string }[];
    return rows
      .map((row) => ({
        price: Number(row.price),
        qty: Number(row.qty),
        facilities: allConfigs.find((c) => Number(c.price) === Number(row.price))?.facilities ?? [],
      }))
      .sort((a, b) => a.price - b.price);
  }, [tallyData, allConfigs]);

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
      // The board gains a line.
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

  return (
    <div className="space-y-6">
      <BoardHeader titleKey="menu.sellTicket" subtitle={t("board.sellHint")} />

      {/* Hidden print button */}
      <button ref={buttonRef} className="hidden" onClick={handlePrint} />

      {configLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-live="polite">
          {FACILITY_ORDER.map((code) => (
            <div key={code} className="rounded-lg border border-rule bg-card p-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-4 h-28 w-40 rounded-xl" />
              <Skeleton className="mt-3 h-28 w-40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : allConfigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-rule bg-card py-16">
          <TicketIcon className="h-8 w-8 text-ink-soft" aria-hidden="true" />
          <p className="font-semibold text-ink">{t("board.noPrices")}</p>
          <p className="text-caption text-ink-soft">{t("board.noPricesHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {columns.map((col) => (
            <section
              key={col.code}
              aria-label={col.label}
              className={cn("min-w-0 rounded-lg border border-rule p-3", col.meta.tint)}
            >
              <header className="flex items-center gap-2">
                <FacilityDot code={col.code} size={12} />
                <h2 className="marker-caps text-ink">{col.label}</h2>
                <span className="ml-auto text-caption text-ink-soft">{col.tiles.length}</span>
              </header>
              <div className="mt-2 h-0.5 rounded-full" style={{ background: facilityColor(col.code) }} />
              {col.tiles.length === 0 ? (
                <p className="py-6 text-center text-caption text-ink-soft">{t("board.emptyColumn")}</p>
              ) : (
                <div className="mt-3 flex flex-wrap items-stretch gap-3 md:max-h-[calc(100vh-32rem)] md:overflow-y-auto md:pb-1">
                  {col.tiles.map((cfg) => (
                    <PriceTile
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
              )}
            </section>
          ))}
        </div>
      )}

      <TodayBoard
        lines={lines}
        tally={tally}
        tallyLoading={tallyLoading}
        onPrintAgain={uuid ? handlePrintAgain : undefined}
      />

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
