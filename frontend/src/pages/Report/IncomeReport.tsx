import { useEffect, useState } from "react";
import React from "react";
import { gql, useLazyQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";

import LoadingPage from "../../components/LoadingPage/LoadingPage";
import { DateInput } from "@/components/ui/DateInput";
import { Label } from "@/components/ui/Label";
import { DataTable } from "@/components/ui/DataTable";
import type { ColumnDef } from "@/types/datatable";
import { BoardHeader } from "@/components/board/BoardHeader";
import { BoardSection } from "@/components/board/BoardSection";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

const GET_TICKETPAYMENT = gql`
  query GetTicketPayment($dateFrom: String!, $dateTo: String!, $userId: Float!) {
    GetTicketPayment(dateFrom: $dateFrom, dateTo: $dateTo, userId: $userId) {
      payment_date
      price
      qty
    }
  }
`;

const GET_MEMBER_PAYMENT = gql`
  query GetMemberPayments($dateFrom: String!, $dateTo: String!, $userId: Float!) {
    GetMemberPayments(dateFrom: $dateFrom, dateTo: $dateTo, userId: $userId) {
      promotion
      price
      qty
    }
  }
`;

const GET_COUPON_PAYMENT = gql`
  query GetCouponPayments($dateFrom: String!, $dateTo: String!, $userId: Float!) {
    GetCouponPayments(dateFrom: $dateFrom, dateTo: $dateTo, userId: $userId) {
      price
      qty
      card_name
    }
  }
`;

const GET_TRAINNING_PAYMENT = gql`
  query GetTrainningPayments($dateFrom: String!, $userId: Float!, $dateTo: String!) {
    GetTrainningPayments(dateFrom: $dateFrom, userId: $userId, dateTo: $dateTo) {
      promotion
      price
      qty
    }
  }
`;

const GET_SELLER = gql`
  query GetSeller($dateFrom: String!, $dateTo: String!) {
    GetSeller(dateFrom: $dateFrom, dateTo: $dateTo) {
      user_id
      display_name
      phone
      role
    }
  }
`;

const GET_MEMBER_PAYMENT_DETAIL = gql`
  query GetMemberPaymentDetail($dateTo: String!, $dateFrom: String!) {
  GetMemberPaymentDetail(dateTo: $dateTo, dateFrom: $dateFrom) {
    customer_name
    promotion
  }
}
`;

const GET_COUPON_PAYMENT_DETAIL = gql`
  query GetCouponPaymentDetails($dateTo: String!, $dateFrom: String!) {
  GetCouponPaymentDetails(dateTo: $dateTo, dateFrom: $dateFrom) {
    customer_name
    card_name
  }
}
`;

const GET_TRAINNING_PAYMENT_DETAIL = gql`
  query GetTrainningPaymentDetail($dateTo: String!, $dateFrom: String!) {
  GetTrainningPaymentDetail(dateTo: $dateTo, dateFrom: $dateFrom) {
    customer_name
    promotion
  }
}
`;

type IncomeRow = {
  item: string;
  price: number;
  qty: number;
  total: number;
};

type DetailRow = {
  customer_name: string;
  promotion: string;
};

const incomeColumns: ColumnDef<IncomeRow>[] = [
  { key: "item", header: "ទំនិញ", sortable: true },
  { key: "qty", header: "ចំនួន", sortable: true, align: "right" },
  { key: "price", header: "តម្លៃ", sortable: true, align: "right", render: (row) => formatMoney(row.price) },
  { key: "total", header: "សរុប", sortable: true, align: "right", render: (row) => <span className="font-semibold">{formatMoney(row.total)}</span> },
];

const memberDetailColumns: ColumnDef<DetailRow>[] = [
  { key: "customer_name", header: "ឈ្មោះ", sortable: true },
  { key: "promotion", header: "Description", sortable: true },
];

type DetailKind = "member" | "coupon" | "training";

/** A seller written on the board: outline at rest, ink when chosen. */
function SellerChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active ? "border-ink bg-ink text-white" : "border-rule bg-card text-ink hover:bg-tray"
      )}
    >
      {children}
    </button>
  );
}

function IncomeReport() {
  const { t } = useTranslation();

  const [data, setData] = React.useState<IncomeRow[]>(() => []);
  const [GetTicketPayment] = useLazyQuery(GET_TICKETPAYMENT, {
    fetchPolicy: "no-cache",
  });
  const [GetMemberPayment] = useLazyQuery(GET_MEMBER_PAYMENT, {
    fetchPolicy: "no-cache",
  });
  const [GetTrainningPayment] = useLazyQuery(GET_TRAINNING_PAYMENT, {
    fetchPolicy: "no-cache",
  });
  const [GetCouponPayment] = useLazyQuery(GET_COUPON_PAYMENT, {
    fetchPolicy: "no-cache",
  });
  const [GetMemberPaymentDetail, { data: member_payments }] = useLazyQuery(GET_MEMBER_PAYMENT_DETAIL, {
    fetchPolicy: "no-cache",
  });

  const [GetCouopnPaymentDetail, { data: coupon_payments }] = useLazyQuery(GET_COUPON_PAYMENT_DETAIL, {
    fetchPolicy: "no-cache",
  });

  const [GetTrainningPaymentDetail, { data: trainning_payments }] = useLazyQuery(GET_TRAINNING_PAYMENT_DETAIL, {
    fetchPolicy: "no-cache",
  });

  // Which detail ledger is open under the income table.
  const [detail, setDetail] = useState<DetailKind | null>(null);

  function date_time_format(date_time: Date) {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA");
  }

  const CombineData = async (seller_id: number) => {
    setLoading(true);
    setActiveSeller(seller_id);

    const tmp_report: any = [];

    const reuslt1 = await GetTicketPayment({
      variables: {
        dateFrom: selectedDateFrom,
        dateTo: selectedDateTo,
        userId: seller_id,
      },
    });
    if (!reuslt1.loading) {
      await reuslt1.data.GetTicketPayment.map((data: any) => {
        tmp_report.push({
          item: "សំបុត្រ​ " + data.price + " $",
          price: data.price,
          qty: data.qty,
          total: data.qty * data.price,
        });
      });
    }

    const reuslt2 = await GetMemberPayment({
      variables: {
        dateFrom: selectedDateFrom,
        dateTo: selectedDateTo,
        userId: seller_id,
      },
    });

    if (!reuslt2.loading) {
      await reuslt2.data.GetMemberPayments.map((data: any) => {
        tmp_report.push({
          item: data.promotion,
          price: data.price,
          qty: data.qty,
          total: data.qty * data.price,
        });
      });
    }

    const result3 = await GetCouponPayment({
      variables: {
        dateFrom: selectedDateFrom,
        dateTo: selectedDateTo,
        userId: seller_id,
      },
    });

    if (!result3.loading) {
      await result3.data.GetCouponPayments.map((data: any) => {
        tmp_report.push({
          item: data.card_name,
          price: data.price,
          qty: data.qty,
          total: data.qty * data.price,
        });
      });
    }

    const result4 = await GetTrainningPayment({
      variables: {
        dateFrom: selectedDateFrom,
        dateTo: selectedDateTo,
        userId: seller_id,
      },
    });

    if (!result4.loading) {
      await result4.data.GetTrainningPayments.map((data: any) => {
        tmp_report.push({
          item: data.promotion,
          price: data.price,
          qty: data.qty,
          total: data.qty * data.price,
        });
      });
    }

    const sum = tmp_report.reduce((acc: any, object: any) => {
      return acc + object.total;
    }, 0);

    SetTotal(sum);
    setData(tmp_report);
    setLoading(false);
  };

  const [total, SetTotal] = useState(0);
  const [activeSeller, setActiveSeller] = useState(0);

  const [selectedDateTo, setSelectedDateTo] = useState(
    date_time_format(new Date())
  );

  const [selectedDateFrom, setSelectedDateFrom] = useState(
    date_time_format(new Date())
  );

  // DateInput emits YYYY-MM-DD — the format these queries already send. It can
  // also emit '' when the field is cleared, which the old read-only picker could
  // never do; ignoring that keeps the last good date instead of querying on ''.
  const handleChangeDateFrom = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) setSelectedDateFrom(e.target.value);
  };

  const handleChangeDateTo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) setSelectedDateTo(e.target.value);
  };

  const [getSeller] = useLazyQuery(GET_SELLER, {
    fetchPolicy: "no-cache",
  });

  const [loading, setLoading] = useState(false);

  const GetSeller = async () => {
    const result = await getSeller({
      variables: {
        dateFrom: selectedDateFrom,
        dateTo: selectedDateTo,
      },
    });

    const arr1 = getUniqueListBy(result.data.GetSeller, "user_id");
    setSeller(arr1);
  };

  function getUniqueListBy(arr: object[], key: string) {
    return [...new Map(arr.map((item) => [item[key], item])).values()];
  }
  const [seller, setSeller] = useState([]);

  useEffect(() => {
    //detect date_from and date_to changed to get new data
    GetSeller();
    const intervalId = setInterval(() => {
      GetSeller();
      // Fetch Seller every 5 seconds
    }, 5000);
    return () => clearInterval(intervalId);
  }, [selectedDateFrom, selectedDateTo]);

  useEffect(() => {
    setLoading(true);
    CombineData(0);
  }, []);

  const range = { dateTo: selectedDateTo, dateFrom: selectedDateFrom };
  const showDetail = (kind: DetailKind) => {
    setDetail(kind);
    if (kind === "member") GetMemberPaymentDetail({ variables: range });
    if (kind === "coupon") GetCouopnPaymentDetail({ variables: range });
    if (kind === "training") GetTrainningPaymentDetail({ variables: range });
  };

  const detailRows: DetailRow[] =
    detail === "member"
      ? member_payments?.GetMemberPaymentDetail ?? []
      : detail === "coupon"
        ? (coupon_payments?.GetCouponPaymentDetails ?? []).map((r: any) => ({ customer_name: r.customer_name, promotion: r.card_name }))
        : detail === "training"
          ? trainning_payments?.GetTrainningPaymentDetail ?? []
          : [];

  const detailTitle =
    detail === "member" ? "សមាជិក" : detail === "coupon" ? "គូប៉ុន" : detail === "training" ? "ហ្វឹកហាត់" : "";

  return (
    <div className="space-y-6">
      <BoardHeader
        titleKey="reports.income"
        subtitle={`${selectedDateFrom} → ${selectedDateTo}`}
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40 space-y-1.5">
              <Label htmlFor="date-from">ពីថ្ងៃ</Label>
              <DateInput
                id="date-from"
                name="dateFrom"
                value={selectedDateFrom}
                onChange={handleChangeDateFrom}
              />
            </div>
            <div className="w-40 space-y-1.5">
              <Label htmlFor="date-to">ដល់ថ្ងៃ</Label>
              <DateInput
                id="date-to"
                name="dateTo"
                value={selectedDateTo}
                onChange={handleChangeDateTo}
              />
            </div>
          </div>
        }
      />

      {!loading ? (
        <>
          {/* Sellers */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="ជ្រើសរើសអ្នកលក់">
            <span className="mr-1 text-caption text-ink-soft">អ្នកលក់</span>
            <SellerChip active={activeSeller === 0} onClick={() => CombineData(0)}>
              {t("common.all")}
            </SellerChip>
            {seller.map((s: any) => (
              <SellerChip
                key={s.user_id}
                active={activeSeller === parseInt(s.user_id)}
                onClick={() => CombineData(parseInt(s.user_id))}
              >
                {s.display_name}
              </SellerChip>
            ))}
          </div>

          {/* The ledger and its total */}
          <BoardSection
            title="ចំណូល"
            aside={
              <span className="inline-flex items-baseline gap-2">
                <span className="text-caption text-ink-soft">{t("common.total")}</span>
                <span className="text-heading font-black leading-none text-ink">{formatMoney(total)}</span>
              </span>
            }
          >
            <DataTable<IncomeRow>
              data={data}
              columns={incomeColumns}
              currentPage={1}
              pageSize={data.length || 1}
              onPageChange={() => { /* un-paginated */ }}
              onPageSizeChange={() => { /* un-paginated */ }}
              searchable={false}
              exportable={false}
              printable={false}
              densityToggle={false}
              defaultDensity="compact"
            />
          </BoardSection>

          {/* Detail ledgers: who bought what in the range */}
          <BoardSection
            title="លម្អិត"
            aside={
              <div className="flex flex-wrap gap-2" role="group" aria-label="លម្អិត">
                <SellerChip active={detail === "member"} onClick={() => showDetail("member")}>សមាជិក</SellerChip>
                <SellerChip active={detail === "coupon"} onClick={() => showDetail("coupon")}>គូប៉ុន</SellerChip>
                <SellerChip active={detail === "training"} onClick={() => showDetail("training")}>ហ្វឹកហាត់</SellerChip>
              </div>
            }
          >
            {detail ? (
              <DataTable<DetailRow>
                data={detailRows}
                columns={memberDetailColumns}
                currentPage={1}
                pageSize={detailRows.length || 1}
                onPageChange={() => { /* un-paginated */ }}
                onPageSizeChange={() => { /* un-paginated */ }}
                searchable={false}
                exportable={false}
                printable={false}
                densityToggle={false}
                defaultDensity="compact"
                emptyMessage={`${detailTitle}: ${t("common.noData")}`}
              />
            ) : (
              <p className="rounded-lg border border-dashed border-rule bg-card px-4 py-6 text-center text-sm text-ink-soft">
                ជ្រើសរើស សមាជិក / គូប៉ុន / ហ្វឹកហាត់ ដើម្បីមើលអ្នកទិញក្នុងចន្លោះថ្ងៃនេះ
              </p>
            )}
          </BoardSection>
        </>
      ) : (
        <LoadingPage message={t("common.loading")} />
      )}
    </div>
  );
}

export default IncomeReport;
