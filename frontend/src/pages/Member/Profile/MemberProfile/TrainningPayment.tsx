/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "../../Component/DataTable";
import { formatMoney } from "@/lib/money";

type TrainningPayment = {
  payment_id: number;
  promotion: string;
  price: number;
  payment_date: string;
};

/** The member's training ledger. Read-only: training payments have no edit flow. */
export const TrainningPayment = (props: any) => {
  const trainningPaymentcolumnHelper = createColumnHelper<TrainningPayment>();
  const trainningPaymencolumns = [
    trainningPaymentcolumnHelper.accessor((row) => row.payment_id, {
      id: "ID",
      meta: { nowrap: true },
      cell: (info) => <span className="figure text-ink-soft">{info.getValue()}</span>,
      header: (info) => <span>{info.column.id}</span>,
      footer: (info) => info.column.id,
    }),
    trainningPaymentcolumnHelper.accessor((row) => row.payment_date, {
      id: "ថ្ងៃបង់ប្រាក់",
      meta: { nowrap: true },
      cell: (info) => <span className="figure">{info.getValue()}</span>,
      header: (info) => <span>{info.column.id}</span>,
      footer: (info) => info.column.id,
    }),
    trainningPaymentcolumnHelper.accessor((row) => row.promotion, {
      id: "Promotion",
      cell: (info) => info.getValue(),
      header: (info) => <span>{info.column.id}</span>,
      footer: (info) => info.column.id,
    }),
    trainningPaymentcolumnHelper.accessor((row) => row.price, {
      id: "តម្លៃ",
      meta: { align: "right", nowrap: true },
      cell: (info) => <span className="figure font-medium">{formatMoney(info.getValue())}</span>,
      header: (info) => <span>{info.column.id}</span>,
      footer: (info) => info.column.id,
    }),
  ];

  return (
    <DataTable
      columns={trainningPaymencolumns}
      data={props.trainning_payment?.GetTrainningPayment ?? props.trainning_payment ?? []}
    />
  );
};

export default TrainningPayment;
