/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { CircleDollarSign } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import DataTable from "../../Component/DataTable";
import { useCreateTrainningPaymentMutation, useGetTranningPriceQuery } from "../../../../generated/graphql";
import { TypeOptions, toast } from "react-toastify";
import { useReactToPrint } from "react-to-print";
import { CouponInvoice } from "../../../../components/ComponentToPrint/CouponInvoice";
import { Button } from "@/components/ui/Button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/money";

const notify = (
    message: string,
    auto_Close: boolean | number,
    toastType: TypeOptions
) => {
    if (!toast.isActive("alert")) {
        toast(message, {
            autoClose: auto_Close ? 500 : false,
            toastId: "alert",
            type: toastType,
        });
    }
};

const date_time_format = (date_time: Date) => {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA");
}

type PriceTable = {
    id: number;
    name: string;
    type: string;
    month_qty: number;
    price: number;
};

export const TrainingPaymentForm = ((props) => {

    const columnHelperPriceTable = createColumnHelper<PriceTable>();
    const columns_price_table = [
        columnHelperPriceTable.accessor((row) => row.name, {
            id: "ឈ្មោះ Promotion",
            cell: (info) => info.getValue(),
            header: (info) => <span>{info.column.id}</span>,
            footer: (info) => info.column.id,
        }),
        columnHelperPriceTable.accessor((row) => row.type, {
            id: "ប្រភេទ",
            cell: (info) => info.getValue(),
            header: (info) => <span>{info.column.id}</span>,
            footer: (info) => info.column.id,
        }),
        columnHelperPriceTable.accessor((row) => row.month_qty, {
            id: "ចំនួនខែ",
            cell: (info) => info.getValue(),
            header: (info) => <span>{info.column.id}</span>,
            footer: (info) => info.column.id,
        }),
        columnHelperPriceTable.accessor((row) => row.price, {
            id: "តម្លៃ",
            cell: (info) => <span className="font-semibold">{formatMoney(info.getValue())}</span>,
            header: (info) => <span>{info.column.id}</span>,
            footer: (info) => info.column.id,
        }),
        columnHelperPriceTable.accessor((row) => row.id, {
            id: "Action",
            cell: (info) => (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setIsShowConfirmModal(true);
                        const row = info.row.original;
                        setMonthQty(row.month_qty);
                        setPromotion(row.name);
                        setPrice(row.price);
                        setType(row.type);
                    }}
                >
                    <CircleDollarSign aria-hidden="true" />
                    លក់
                </Button>
            ),
            header: () => <span>Action</span>,
            footer: (info) => info.column.id,
        }),
    ];

    const { data, loading: loading_price_table } = useGetTranningPriceQuery({ fetchPolicy: 'network-only' })
    const [isShowConfirmModal, setIsShowConfirmModal] = useState(false);
    const [month_qty, setMonthQty] = useState(0);
    const [promotion, setPromotion] = useState("");
    const [price, setPrice] = useState(0);
    const [type, setType] = useState("");

    const close = () => { props.setOpenTrainning(false); setIsShowConfirmModal(false) };

    return (
        <Dialog open={props.open_trainning} onOpenChange={(open) => { if (!open) close(); }}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>ហ្វឹកហាត់ · តារាងតម្លៃ</DialogTitle>
                </DialogHeader>

                {!isShowConfirmModal ? (
                    loading_price_table ? (
                        <p className="text-sm text-ink-soft">Loading...</p>
                    ) : (
                        <DataTable columns={columns_price_table} data={data?.GetTranningPrice ?? []} />
                    )
                ) : (
                    <ConfirmModal
                        setIsShowConfirmModal={setIsShowConfirmModal}
                        month_qty={month_qty}
                        promotion={promotion}
                        price={price}
                        customer_id={props.customer_id}
                        user_id={parseInt(localStorage.getItem("user_id"))}
                        customer_name={props.customer_name}
                        phone={props.phone}
                        type={type}
                        refetch={props.refetch_trainning_payment}
                        setOpenTrainning={props.setOpenTrainning}
                    />
                )}

                {!isShowConfirmModal && (
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={close}>
                            បោះបង់
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
});

const ConfirmModal = ((props) => {

    const [createTrainningPayment] = useCreateTrainningPaymentMutation();

    const [payment_id, setPaymentID] = useState(0);

    const handleSubmit = async () => {
        const result = await createTrainningPayment({
            variables: {
                price: props.price,
                promotion: props.promotion,
                customerId: props.customer_id,
                userId: props.user_id,
                type: props.type
            }
        })

        if (result.data?.CreateTrainningPayment.success) {
            setPaymentID(result.data.CreateTrainningPayment.payment_id);
            notify("Success", true, "success");
            props.refetch();
            props.setOpenTrainning(false);
            return;
        }
        notify("Failed", true, "error")
    }

    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint1 = async (target: HTMLIFrameElement) => {
        return new Promise(() => {
            console.log('forwarding print request to the main process...');
            const data = target.contentWindow.document.documentElement.outerHTML;
            const blob = new Blob([data], { type: 'text/html; charset=utf-8' });
            const url = URL.createObjectURL(blob);
            window.electronAPI.printComponent(url, (response: any) => {
                console.log('Main: ', response);
            });

            props.setIsShowConfirmModal(false);
        });
    };
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        print: async (printIframe: HTMLIFrameElement) => {
            // Do whatever you want here, including asynchronous work
            await handlePrint1(printIframe);
        },
    });
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        // This function will be called after the component re-renders
        if (payment_id > 0) {
            buttonRef.current.click();
        }
    }, [payment_id]);

    return (
        <div className="space-y-4">
            <button className="hidden" ref={buttonRef} type="button" onClick={handlePrint}>Print</button>

            {/* The slip as it will print, so the cashier checks it before committing. */}
            <div className="overflow-x-auto rounded-lg border border-rule bg-tray p-3">
                <p className="mb-2 text-caption text-ink-soft">វិក្កយបត្រ</p>
                <CouponInvoice ref={componentRef}
                    invoice_id={payment_id}
                    payment_date={date_time_format(new Date())}
                    cashier={localStorage.getItem("display_name")}
                    c_name={props.customer_name}
                    phone={props.phone}
                    promotion={props.promotion}
                    price={props.price}
                />
            </div>

            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => props.setIsShowConfirmModal(false)}
                >
                    ត្រឡប់
                </Button>
                <Button
                    type="button"
                    variant="commit"
                    onClick={handleSubmit}
                >
                    យល់ព្រម · បោះពុម្ព
                </Button>
            </DialogFooter>
        </div>
    );
})
