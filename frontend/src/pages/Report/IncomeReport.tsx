import { useEffect, useState } from "react";
import React from "react";
import { gql, useLazyQuery } from "@apollo/client";

import LoadingPage from "../../components/LoadingPage/LoadingPage";
import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DateInput";
import { Label } from "@/components/ui/Label";
import { DataTable } from "@/components/ui/DataTable";
import type { ColumnDef } from "@/types/datatable";
// import { ItemDetailModal } from "./pages/sportclub/ItemDetailModal";

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

type MemberPaymentDetailRow = {
  customer_name: string;
  promotion: string;
};

const incomeColumns: ColumnDef<IncomeRow>[] = [
  { key: "item", header: "ទំនិញ", sortable: true },
  { key: "qty", header: "ចំនួន", sortable: true },
  { key: "price", header: "តម្លៃ", sortable: true, render: (row) => `$${row.price}` },
  { key: "total", header: "សរុប", sortable: true, render: (row) => `$${row.total}` },
];

const memberDetailColumns: ColumnDef<MemberPaymentDetailRow>[] = [
  { key: "customer_name", header: "ឈ្មោះ", sortable: true },
  { key: "promotion", header: "Description", sortable: true },
];

function IncomeReport() {

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




  function date_time_format(date_time: Date) {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA");
  }

  const CombineData = async (seller_id: number) => {
    setLoading(true);

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

  const [getSeller, { loading: seller_loading }] = useLazyQuery(GET_SELLER, {
    fetchPolicy: "no-cache",
  });

  const [sale_detail, setSaleDetail] = useState([])


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
    const intervalId = setInterval(() => {
      GetSeller();
      // Fetch Seller every 1 seconds
    }, 5000);
    return () => clearInterval(intervalId);
  }, [selectedDateFrom, selectedDateTo]);

  useEffect(() => {
    setLoading(true);
    CombineData(0);
  }, []);

  return (
    <>
      {!loading ? (
        <div className="select-none">
          {/* CheckBox */}

          <div className="p-2">
            <legend className="text-sm font-semibold leading-6 text-gray-900">
              ជ្រើសរើសអ្នកលក់
            </legend>
            <div className="space-x-2 flex">
              {seller.map((seller: any) => {
                return (
                  <div key={seller.user_id}>
                    <Button
                      type="button"
                      onClick={() => CombineData(parseInt(seller.user_id))}
                    >
                      {seller.display_name}
                    </Button>
                  </div>
                );
              })}

              <div>
                <Button
                  type="button"
                  onClick={() => CombineData(0)}
                >
                  ទាំងអស់
                </Button>
              </div>
            </div>
          </div>

          {/* Date range — the two fields were previously unlabelled and identical,
              so which one bounded which end was guesswork. */}
          <div className="flex flex-wrap items-end gap-3 p-2">
            <div className="w-44 space-y-1.5">
              <Label htmlFor="date-from">ពីថ្ងៃ</Label>
              <DateInput
                id="date-from"
                name="dateFrom"
                value={selectedDateFrom}
                onChange={handleChangeDateFrom}
              />
            </div>

            <div className="w-44 space-y-1.5">
              <Label htmlFor="date-to">ដល់ថ្ងៃ</Label>
              <DateInput
                id="date-to"
                name="dateTo"
                value={selectedDateTo}
                onChange={handleChangeDateTo}
              />
            </div>
          </div>

          <div className="p-2 flex space-x-2">
            <Button
              type="button"
              onClick={() => GetMemberPaymentDetail({
                variables: {
                  dateTo: selectedDateTo,
                  dateFrom: selectedDateFrom
                }
              })}
            >
              សមាជិក
            </Button>

            <Button
              type="button"
            >
              គូប៉ុន
            </Button>

            <Button
              type="button"
            >
              ហ្វឹកហាត់
            </Button>
          </div>

          <div className="p-2">
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
            />
            {/* DataTable has no footer/summary row, so the old <TableFooter>
                total renders here. Same `total` state, same value. */}
            <div className="pt-2 text-right text-md font-bold">សរុប $ {total} </div>
          </div>


          {/* Member Details Table */}
          <>
            {
              member_payments ? (
                <div className="p-2">
                  <DataTable<MemberPaymentDetailRow>
                    data={member_payments.GetMemberPaymentDetail}
                    columns={memberDetailColumns}
                    currentPage={1}
                    pageSize={member_payments.GetMemberPaymentDetail.length || 1}
                    onPageChange={() => { /* un-paginated */ }}
                    onPageSizeChange={() => { /* un-paginated */ }}
                    searchable={false}
                    exportable={false}
                    printable={false}
                    densityToggle={false}
                  />
                </div>
              ) : null
            }

          </>

          {/* Member Details Table — DUPLICATE: this renders exactly the same
              GetMemberPaymentDetail rows, with the same headers, as the block
              above. Kept as-is during the DataTable conversion; the page also has
              unused coupon/training queries and two dead buttons (គូប៉ុន /
              ហ្វឹកហាត់), so a human should decide whether this block was meant to
              show one of those instead, or simply be deleted. */}
          <>
            {
              member_payments ? (
                <div className="p-2">
                  <DataTable<MemberPaymentDetailRow>
                    data={member_payments.GetMemberPaymentDetail}
                    columns={memberDetailColumns}
                    currentPage={1}
                    pageSize={member_payments.GetMemberPaymentDetail.length || 1}
                    onPageChange={() => { /* un-paginated */ }}
                    onPageSizeChange={() => { /* un-paginated */ }}
                    searchable={false}
                    exportable={false}
                    printable={false}
                    densityToggle={false}
                  />
                </div>
              ) : null
            }

          </>
        </div >
      ) :
        <LoadingPage message={"Loading"} />
      }
    </>
  );
}

export default IncomeReport;
