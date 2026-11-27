import { gql, useQuery } from "@apollo/client";
import { useGetCustomersCountQuery } from "../generated/graphql";
import { todayIso } from "../lib/money";

/**
 * Today's figures for the dashboard: tickets sold, members on the books, and
 * the day's income across every kind of sale. Built on the same report
 * queries the income report uses (userId 0 = every seller), so the dashboard
 * strip and the end-of-day report derive from the same rows.
 */
const TODAY_FIGURES = gql`
  query DashboardTodayFigures($dateFrom: String!, $dateTo: String!, $userId: Float!) {
    GetTicketPayment(dateFrom: $dateFrom, dateTo: $dateTo, userId: $userId) {
      price
      qty
    }
    GetMemberPayments(dateFrom: $dateFrom, dateTo: $dateTo, userId: $userId) {
      price
      qty
    }
    GetCouponPayments(dateFrom: $dateFrom, dateTo: $dateTo, userId: $userId) {
      price
      qty
    }
    GetTrainningPayments(dateFrom: $dateFrom, dateTo: $dateTo, userId: $userId) {
      price
      qty
    }
    GetFruitPayments(dateFrom: $dateFrom, dateTo: $dateTo, userId: $userId) {
      price
      qty
    }
  }
`;

interface Row {
  price: number;
  qty: number | string;
}

const sum = (rows?: Row[] | null) =>
  (rows ?? []).reduce((n, r) => n + Number(r.qty) * Number(r.price), 0);

export interface TodayFigures {
  ticketsToday: number;
  ticketRows: Row[];
  incomeToday: number;
  members: number;
  loading: boolean;
  refetch: () => Promise<unknown>;
}

export function useTodayFigures(): TodayFigures {
  const today = todayIso();
  const { data, loading, refetch } = useQuery(TODAY_FIGURES, {
    variables: { dateFrom: today, dateTo: today, userId: 0 },
    fetchPolicy: "network-only",
  });
  const { data: countData, loading: countLoading } = useGetCustomersCountQuery({
    variables: { search: "" },
    fetchPolicy: "network-only",
  });

  const ticketRows: Row[] = data?.GetTicketPayment ?? [];
  const ticketsToday = ticketRows.reduce((n, r) => n + Number(r.qty), 0);
  const incomeToday =
    sum(ticketRows) +
    sum(data?.GetMemberPayments) +
    sum(data?.GetCouponPayments) +
    sum(data?.GetTrainningPayments) +
    sum(data?.GetFruitPayments);

  return {
    ticketsToday,
    ticketRows,
    incomeToday,
    members: countData?.GetCustomersCount ?? 0,
    loading: loading || countLoading,
    refetch,
  };
}
