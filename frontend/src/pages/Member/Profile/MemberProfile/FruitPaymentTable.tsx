import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "../../Component/DataTable";
import { formatMoney } from "@/lib/money";

type MemberPayment = {
    payment_id: number;
    promotion: string;
    price: number;
    old_end: string;
    new_end: string;
    payment_date: string;
};

const datetime_format = (date_time: string) => {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA") + " " + date.toLocaleTimeString();
};

/** The member's fruit / extras ledger. Read-only: these payments have no edit flow. */
export const FruitPaymentTable = (props: any) => {
    const columnHelper = createColumnHelper<MemberPayment>();
    const columns = [
        columnHelper.accessor((row) => row.payment_id, {
            id: "ID",
            cell: (info) => <span className="text-ink-soft">{info.getValue()}</span>,
            header: (info) => <span>{info.column.id}</span>,
            footer: (info) => info.column.id,
        }),
        columnHelper.accessor((row) => row.payment_date, {
            id: "ថ្ងៃបង់ប្រាក់",
            cell: (info) => datetime_format(info.getValue()),
            header: (info) => <span>{info.column.id}</span>,
            footer: (info) => info.column.id,
        }),
        columnHelper.accessor((row) => row.promotion, {
            id: "Promotion",
            cell: (info) => info.getValue(),
            header: (info) => <span>{info.column.id}</span>,
            footer: (info) => info.column.id,
        }),
        columnHelper.accessor((row) => row.price, {
            id: "តម្លៃ",
            cell: (info) => <span className="font-medium">{formatMoney(info.getValue())}</span>,
            header: (info) => <span>{info.column.id}</span>,
            footer: (info) => info.column.id,
        }),
        columnHelper.accessor((row) => row.old_end, {
            id: "Old",
            cell: (info) => info.getValue(),
            header: (info) => <span>{info.column.id}</span>,
            footer: (info) => info.column.id,
        }),
        columnHelper.accessor((row) => row.new_end, {
            id: "New",
            cell: (info) => info.getValue(),
            header: (info) => <span>{info.column.id}</span>,
            footer: (info) => info.column.id,
        }),
    ];

    return (
        <DataTable columns={columns} data={props.fruit_payment?.GetFruitPayment ?? []} />
    );
};

export default FruitPaymentTable;
