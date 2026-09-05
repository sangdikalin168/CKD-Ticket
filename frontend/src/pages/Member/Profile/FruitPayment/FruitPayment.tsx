// @ts-nocheck
import { CircleDollarSign } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import DataTable from "../../Component/DataTable";
import {
    useCreateFruitPaymentMutation,
    useGetFruitPriceTableQuery
} from "../../../../generated/graphql";

import { TypeOptions, toast } from "react-toastify";
import { useReactToPrint } from "react-to-print";
import { MemberInvoice } from "../../../../components/ComponentToPrint/MemberInvoice";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

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

type PriceTable = {
    id: number;
    name: string;
    age: string;
    member_type: string;
    month_qty: number;
    price: number;
};
const datetime_format = (date_time: Date) => {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA") + " " + date.toLocaleTimeString();
};

const date_format = (date_time: Date) => {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA");
};

const MONTHS = [1, 3, 6, 12];

export const FruitPayment = (props) => {
    const columnHelperPriceTable = createColumnHelper<PriceTable>();
    const columns_price_table = [
        columnHelperPriceTable.accessor((row) => row.name, {
            id: "ឈ្មោះ Promotion",
            cell: (info) => info.getValue(),
            header: (info) => <span>{info.column.id}</span>,
            footer: (info) => info.column.id,
        }),
        columnHelperPriceTable.accessor((row) => row.age, {
            id: "វ័យ",
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
                        setShift(row.shift);
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

    const { data: price_table, loading } = useGetFruitPriceTableQuery({
        fetchPolicy: "no-cache",
    });

    const [isShowConfirmModal, setIsShowConfirmModal] = useState(false);
    const [member_price_table, setMemberPriceTable] = useState([]);
    const [activeMonth, setActiveMonth] = useState(1);

    const FilterPriceTableByMonth = (month_qty: number) => {
        const result = price_table?.GetFruitPriceTable.filter(
            (p) => p.month_qty == month_qty
        );
        setActiveMonth(month_qty);
        setMemberPriceTable(result ?? []);
    };

    const [month_qty, setMonthQty] = useState(1);
    const [shift, setShift] = useState("");
    const [price, setPrice] = useState(0);
    const [promotion, setPromotion] = useState("");

    useEffect(() => {
        if (price_table?.GetFruitPriceTable.length !== 0) {
            FilterPriceTableByMonth(1);
        }
    }, [price_table])

    return (
        <Dialog
            open={props.open}
            onOpenChange={(open) => {
                if (!open) {
                    props.setOpenFruit(false);
                    setIsShowConfirmModal(false);
                }
            }}
        >
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>ផ្សេងៗ · តារាងតម្លៃ</DialogTitle>
                </DialogHeader>

                {!isShowConfirmModal ? (
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2" role="group" aria-label="ចំនួនខែ">
                            {MONTHS.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    aria-pressed={activeMonth === m}
                                    onClick={() => FilterPriceTableByMonth(m)}
                                    className={cn(
                                        "inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                        activeMonth === m ? "border-ink bg-ink text-white" : "border-rule bg-card text-ink hover:bg-wash"
                                    )}
                                >
                                    {m}ខែ
                                </button>
                            ))}
                        </div>
                        {!loading ? (
                            <DataTable
                                columns={columns_price_table}
                                data={member_price_table}
                            />
                        ) : (
                            <p className="text-sm text-ink-soft">Loading...</p>
                        )}
                    </div>
                ) : (
                    <ConfirmModal
                        setIsShowConfirmModal={setIsShowConfirmModal}
                        old_end={props.details?.end_fruit_date}
                        month_qty={month_qty}
                        promotion={promotion}
                        shift={shift}
                        price={price}
                        customer_id={props.details?.customer_id}
                        user_id={parseInt(
                            localStorage.getItem("user_id")
                        )}
                        customer_name={props.details?.customer_name}
                        phone={props.details?.phone}
                        refetchMemberDetail={props.refetchMemberDetail}
                        refetch={props.refechFruitPayment}
                        setOpen={props.setOpen}
                    />
                )}

                {!isShowConfirmModal && (
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                props.setOpenFruit(false);
                                setIsShowConfirmModal(false);
                            }}
                        >
                            បោះបង់
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

const ConfirmModal = (props: any) => {
    const getRenewalDate = (effectiveDate: Date, month_qty: number) => {
        // Get the current date.
        const today = new Date();
        let duration = 0;
        if (effectiveDate < today) {
            duration = today.getMonth() - today.getMonth() + month_qty;
            // Add the duration to the effective date to get the next renewal date.
            const renewalDate = new Date(today);
            renewalDate.setMonth(renewalDate.getMonth() + duration);
            return renewalDate;
        } else {
            duration = today.getMonth() - effectiveDate.getMonth() + month_qty;
            // Add the duration to the effective date to get the next renewal date.
            const renewalDate = new Date(effectiveDate);
            renewalDate.setMonth(renewalDate.getMonth() + month_qty);
            return renewalDate;
        }
    };

    const effectiveDate = new Date(props.old_end);
    const renewalDate = getRenewalDate(effectiveDate, props.month_qty);
    const [createMemberFruit] = useCreateFruitPaymentMutation();

    const [payment_id, setPaymentID] = useState(0);

    const handleSubmit = async () => {
        const result = await createMemberFruit({
            variables: {
                monthQty: props.month_qty,
                newEnd: date_format(renewalDate),
                oldEnd: props.old_end,
                price: props.price,
                promotion: props.promotion,
                customerId: props.customer_id,
                userId: props.user_id,
            },
        });

        if (result.data?.CreateFruitPayment.success) {
            setPaymentID(result.data.CreateFruitPayment.payment_id);
            notify("Success", true, "success");
            props.refetch();
            props.refetchMemberDetail();
            props.setOpen(false);
            return;
        }
        notify("Failed", true, "error");
    };

    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint1 = async (target: HTMLIFrameElement) => {
        return new Promise(() => {
            console.log("forwarding print request to the main process...");
            const data = target.contentWindow.document.documentElement.outerHTML;
            const blob = new Blob([data], { type: "text/html; charset=utf-8" });
            const url = URL.createObjectURL(blob);
            window.electronAPI.printComponent(url, (response: any) => {
                console.log("Main: ", response);
            });
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
            props.setIsShowConfirmModal(false);
        }
    }, [payment_id]);

    return (
        <div className="space-y-4">
            <button
                className="hidden"
                ref={buttonRef}
                type="button"
                onClick={handlePrint}
            >
                Print
            </button>

            <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-rule p-3">
                    <dt className="text-caption text-ink-soft">សុពលភាពចាស់</dt>
                    <dd className="text-lg font-semibold text-ink">{props.old_end || "—"}</dd>
                </div>
                <div className="rounded-lg border border-rule p-3">
                    <dt className="text-caption text-ink-soft">ថ្ងៃបង់ប្រាក់បន្ទាប់</dt>
                    <dd className="text-lg font-semibold text-ink">{date_format(renewalDate)}</dd>
                </div>
            </dl>

            {/* The slip as it will print. */}
            <div className="overflow-x-auto rounded-lg border border-rule bg-wash p-3">
                <p className="mb-2 text-caption text-ink-soft">វិក្កយបត្រ</p>
                <MemberInvoice
                    ref={componentRef}
                    invoice_id={payment_id}
                    payment_date={datetime_format(new Date())}
                    cashier={localStorage.getItem("display_name")}
                    c_name={props.customer_name}
                    phone={props.phone}
                    promotion={props.promotion}
                    price={props.price}
                    old_end={props.old_end}
                    new_end={date_format(renewalDate)}
                    shift={""}
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
};
