import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { gql, useQuery } from "@apollo/client";
import { useCreateCustomerPaymentMutation } from "../../../../generated/graphql";
import { TypeOptions, toast } from "react-toastify";
import { useReactToPrint } from "react-to-print";
import { ArrowLeft, Tags } from "lucide-react";
import { MemberInvoice } from "../../../../components/ComponentToPrint/MemberInvoice";
import { DateInput } from "@/components/ui/DateInput";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { FacilityMarks } from "@/components/ui/FacilityMark";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

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

const date_format = (date_time: Date) => new Date(date_time).toLocaleDateString("fr-CA");
// DateInput emits YYYY-MM-DD; build a local-midnight Date from it (new Date("YYYY-MM-DD")
// would be UTC midnight, a day off in some time zones).
const parse_iso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const datetime_format = (date_time: Date) =>
  new Date(date_time).toLocaleDateString("fr-CA") + " " + new Date(date_time).toLocaleTimeString();

const ageLabel  = (a: string) => a === "Kid" ? "តូច" : "ធំ";
const shiftLabel = (s: string) => s === "Morning" ? "ព្រឹក" : "Full";

// ─── GraphQL ──────────────────────────────────────────────────────────────────

const GET_ALL_PRICES = gql`
  query getAllMemberPriceTable {
    getAllMemberPriceTable {
      id description ageGroup customerType shift monthQty price entryQty key_image
      facilities { facility_id name code }
    }
  }
`;

/** One option in a filter: outline at rest, the amber mark when chosen. */
const Choice = ({ active, onClick, children }: any) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      active ? "border-amber-deep bg-amber text-ink" : "border-rule bg-card text-ink hover:bg-wash"
    )}
  >
    {children}
  </button>
);

// ─── RenewForm ────────────────────────────────────────────────────────────────

export const RenewForm = (props: any) => {
  const { t } = useTranslation();
  const { data: price_table, loading } = useQuery(GET_ALL_PRICES, { fetchPolicy: "no-cache" });

  const [selectedPrice, setSelectedPrice] = useState<any | null>(null);
  const [age, setAge]     = useState("Adult");
  const [shift, setShift] = useState("Full");
  const [monthQty, setMonthQty] = useState<number | null>(null);

  const allPrices: any[] = price_table?.getAllMemberPriceTable ?? [];

  // Derive dynamic month options from DB
  const monthOptions = [...new Set(allPrices.map((p) => p.monthQty))].sort((a, b) => a - b);

  const filtered = allPrices.filter((p) =>
    p.ageGroup === age &&
    p.shift === shift &&
    (monthQty === null || p.monthQty === monthQty)
  );
  // Same rule as the price table: no key photos in this set, no Key column.
  const showKey = filtered.some((p) => !!p.key_image);

  return (
    <Dialog open={props.open_member} onOpenChange={props.setOpenMember}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{selectedPrice ? "បន្តសមាជិកភាព" : "តារាងតម្លៃសមាជិក"}</DialogTitle>
        </DialogHeader>

        {selectedPrice ? (
          /* ── Confirm step ── */
          <ConfirmModal
            price={selectedPrice}
            old_end={props.details?.end_membership_date}
            customer_id={props.details?.customer_id}
            user_id={parseInt(localStorage.getItem("user_id") ?? "0")}
            customer_name={props.details?.customer_name}
            phone={props.details?.phone}
            refetchMemberDetail={props.refetchMemberDetail}
            refetch={props.refechMemberPayment}
            setOpenMember={props.setOpenMember}
            onBack={() => setSelectedPrice(null)}
          />
        ) : (
          /* ── Price picker step ── */
          <div className="space-y-4">

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="text-caption text-ink-soft">វ័យ</span>
                <Choice active={age === "Adult"} onClick={() => setAge("Adult")}>ធំ</Choice>
                <Choice active={age === "Kid"}   onClick={() => setAge("Kid")}>តូច</Choice>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-caption text-ink-soft">វេន</span>
                <Choice active={shift === "Full"}    onClick={() => setShift("Full")}>Full</Choice>
                <Choice active={shift === "Morning"} onClick={() => setShift("Morning")}>ព្រឹក</Choice>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-caption text-ink-soft">ខែ</span>
                <Choice active={monthQty === null} onClick={() => setMonthQty(null)}>ទាំងអស់</Choice>
                {monthOptions.map((m) => (
                  <Choice key={m} active={monthQty === m} onClick={() => setMonthQty(m)}>
                    {m}ខែ
                  </Choice>
                ))}
              </div>
            </div>


            {/* Price list */}
            {loading ? (
              <div className="space-y-2" role="status" aria-live="polite">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-rule bg-card">
                <EmptyState
                  icon={Tags}
                  title="គ្មានតម្លៃត្រូវនឹងការជ្រើស"
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => { setAge("Adult"); setShift("Full"); setMonthQty(null); }}
                    >
                      ទាំងអស់
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-rule">
                <div className={cn("grid items-center gap-4 bg-wash px-4 py-1.5 text-caption text-ink-soft", showKey ? "grid-cols-[2.5rem_1fr_auto_4rem_5rem]" : "grid-cols-[1fr_auto_4rem_5rem]")}>
                  {showKey && <span>{t("prices.key")}</span>}
                  <span>{t("prices.promotion")}</span>
                  <span className="text-center">{t("ticket.col.facility")}</span>
                  <span className="text-right">ខែ</span>
                  <span className="text-right">តម្លៃ</span>
                </div>
                <ul className="divide-y divide-rule">
                  {filtered.map((p) => {
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedPrice(p)}
                          className={cn("grid w-full items-center gap-4 bg-card px-4 py-2.5 text-left transition-colors hover:bg-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink", showKey ? "grid-cols-[2.5rem_1fr_auto_4rem_5rem]" : "grid-cols-[1fr_auto_4rem_5rem]")}
                        >
                          {showKey && (
                            <span>
                              {p.key_image
                                ? <img src={p.key_image} alt={t("prices.key")} className="h-8 w-8 rounded border border-rule object-cover" />
                                : <span className="block h-8 w-8 rounded bg-wash" />
                              }
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-ink">{p.description || "—"}</span>
                            <span className="block text-caption text-ink-soft">{ageLabel(p.ageGroup)} · {shiftLabel(p.shift)}</span>
                          </span>
                          <span className="justify-self-center">
                            <FacilityMarks facilities={p.facilities} names={false} />
                          </span>
                          <span className="figure whitespace-nowrap text-right text-sm font-semibold text-ink">{p.monthQty}ខែ</span>
                          <span className="figure whitespace-nowrap text-right text-lg font-semibold text-ink">{formatMoney(p.price)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                props.setOpenMember(false);
                setSelectedPrice(null);
              }}>
                បោះបង់
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─── Confirm step ─────────────────────────────────────────────────────────────

const ConfirmModal = (props: any) => {
  const { price: selectedPrice, old_end } = props;

  const getRenewalDate = (effectiveDate: Date, month_qty: number) => {
    const today = new Date();
    if (month_qty === 1.5) {
      const base = effectiveDate < today ? new Date(today) : new Date(effectiveDate);
      base.setDate(base.getDate() + 15);
      base.setMonth(base.getMonth() + 1);
      return base;
    }
    const base = effectiveDate < today ? new Date(today) : new Date(effectiveDate);
    base.setMonth(base.getMonth() + month_qty);
    return base;
  };

  const oldEndDate = new Date(old_end);
  const [start_date, setStartDate] = useState(date_format(new Date()));
  const [renewalDate, setRenewalDate] = useState(getRenewalDate(oldEndDate, selectedPrice.monthQty));
  const [payment_id, setPaymentID] = useState(0);

  const [createMemberPayment] = useCreateCustomerPaymentMutation();
  const componentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handlePrint1 = async (target: HTMLIFrameElement) => {
    return new Promise(() => {
      const data = target.contentWindow!.document.documentElement.outerHTML;
      const blob = new Blob([data], { type: "text/html; charset=utf-8" });
      const url = URL.createObjectURL(blob);
      printBridge()?.printComponent?.(url, (response) => { console.log("Main:", response); });
    });
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    print: async (printIframe: HTMLIFrameElement) => { await handlePrint1(printIframe); },
  });

  useEffect(() => {
    if (payment_id > 0) {
      buttonRef.current?.click();
      props.setOpenMember(false);
    }
  }, [payment_id]);

  const CalculateNewEnd = (effectiveDate: Date, month_qty: number) => {
    const d = new Date(effectiveDate);
    d.setMonth(d.getMonth() + month_qty);
    return d;
  };

  const handleChangeStartDate = (selectedDate: Date) => {
    setStartDate(date_format(selectedDate));
    setRenewalDate(CalculateNewEnd(selectedDate, selectedPrice.monthQty));
  };

  const handleSubmit = async () => {
    const result = await createMemberPayment({
      variables: {
        monthQty: selectedPrice.monthQty,
        shift: selectedPrice.shift,
        newEnd: date_format(renewalDate),
        oldEnd: old_end,
        price: selectedPrice.price,
        promotion: selectedPrice.description,
        customerId: props.customer_id,
        userId: props.user_id,
        startDate: start_date,
      },
    });
    if (result.data?.CreateCustomerPayment.success) {
      setPaymentID(result.data.CreateCustomerPayment.payment_id);
      notify("Success", true, "success");
      props.refetch();
      props.refetchMemberDetail();
      return;
    }
    notify("Failed", true, "error");
  };

  return (
    <div className="space-y-4">
      {/* Hidden print button */}
      <button className="hidden" ref={buttonRef} type="button" onClick={handlePrint} />

      {/* The chosen price */}
      <div className="flex items-center gap-4 rounded-lg border border-rule bg-card p-4">
        {selectedPrice.key_image && (
          <img src={selectedPrice.key_image} alt="key" className="h-14 w-14 rounded-lg border border-rule object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <div className="figure text-2xl font-semibold leading-none text-ink">{formatMoney(selectedPrice.price)}</div>
          <div className="mt-1 text-sm text-ink">
            {selectedPrice.description}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 text-caption text-ink-soft">
            <span><span className="figure">{selectedPrice.monthQty}ខែ</span> · {shiftLabel(selectedPrice.shift)} · {ageLabel(selectedPrice.ageGroup)}</span>
            <FacilityMarks facilities={selectedPrice.facilities} textClassName="text-ink-soft" />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={props.onBack}>
          <ArrowLeft aria-hidden="true" />
          ផ្លាស់ប្តូរ
        </Button>
      </div>

      {/* Dates */}
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-rule p-3">
          <dt className="text-caption text-ink-soft">សុពលភាពចាស់</dt>
          <dd className="figure text-lg font-semibold text-ink">{old_end || "—"}</dd>
        </div>
        <div className="rounded-lg border border-rule p-3">
          <dt className="text-caption text-ink-soft">សុពលភាពថ្មី</dt>
          <dd className="figure text-lg font-semibold text-ink">{date_format(renewalDate)}</dd>
        </div>
      </dl>

      {/* Start date picker */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-ink">ថ្ងៃចាប់ផ្តើម</span>
        <div className="w-44">
          <DateInput
            name="start_date"
            value={start_date}
            onChange={(e) => {
              if (e.target.value) handleChangeStartDate(parse_iso(e.target.value));
            }}
          />
        </div>
        <span className="text-sm text-ink-soft">→</span>
        <span className="figure text-sm font-semibold text-ink">{date_format(renewalDate)}</span>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={props.onBack}>ត្រឡប់</Button>
        <Button variant="commit" onClick={handleSubmit}>
          យល់ព្រម · បោះពុម្ព
        </Button>
      </DialogFooter>

      {/* Hidden print template */}
      <div className="hidden">
        <MemberInvoice
          ref={componentRef}
          invoice_id={payment_id}
          payment_date={datetime_format(new Date())}
          cashier={localStorage.getItem("display_name")}
          c_name={props.customer_name}
          phone={props.phone}
          promotion={selectedPrice.description}
          price={selectedPrice.price}
          start_date={start_date}
          old_end={old_end}
          new_end={date_format(renewalDate)}
          shift={selectedPrice.shift}
        />
      </div>
    </div>
  );
};
