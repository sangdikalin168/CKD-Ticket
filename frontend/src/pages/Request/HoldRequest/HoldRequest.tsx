import LoadingPage from "../../../components/LoadingPage/LoadingPage"
import { useGetCustomerDetailLazyQuery, useGetMemberPaymentLazyQuery } from "../../../generated/graphql";
import { useDecideHoldRequestV2Mutation, useHoldRequestsV2Query, useProcessHoldV2Mutation } from "../../../generated/holdV2";
import { CheckCircleIcon, PrinterIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { useEffect, useMemo, useRef, useState } from "react";
import Notifications from "../../../components/Notification";
import { HoldInvoice } from "../../../components/ComponentToPrint/HoldInvoice";
import { useReactToPrint } from "react-to-print";
import { DataTable } from "@/components/ui/DataTable";
import type { ColumnDef } from "@/types/datatable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/Card";


type HoldRequestType = {
    request_id: number
    customer_id: number
    customer_name: string
    phone: string
    requested_by: number
    requested_by_name?: string | null
    requested_at: string
    reason: string
    from_date: string
    to_date: string
    status: string
    decided_by?: number | null
    decided_by_name?: string | null
    decided_at?: string | null
    decision_note?: string | null
    processed_by?: number | null
    processed_by_name?: string | null
    processed_at?: string | null
    old_end?: string | null
    new_end?: string | null
    fee: string
    legacy: number
}

const datetime_format = (date_time: string | Date) => {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA") + " " + date.toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' });
};

const date_format = (date_time: string) => {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA");
};


const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
    PENDING:   { text: "មិនទាន់ពិនិត្យ", cls: "bg-yellow-500/10 text-yellow-600" },
    APPROVED:  { text: "ឯកភាព",        cls: "bg-emerald-500/10 text-emerald-600" },
    REJECTED:  { text: "បដិសេធ",        cls: "bg-rose-500/10 text-red-500" },
    PROCESSED: { text: "ដំណើរការរួច",   cls: "bg-sky-500/10 text-sky-600" },
    CANCELLED: { text: "បានលុប",        cls: "bg-gray-500/10 text-gray-500" },
};

const StatusBadge = ({ status }: { status: string }) => {
    const meta = STATUS_LABEL[status];
    // Unknown values are shown verbatim rather than silently bucketed —
    // v1's catch-all rendered every unrecognised status as "pending".
    return <Badge variant="outline" className={meta?.cls ?? ""}>{meta?.text ?? status}</Badge>;
};

const HoldRequest = () => {

    const { data, loading, refetch } = useHoldRequestsV2Query({ fetchPolicy: "no-cache" })

    // One decision mutation replaces check+approve. Permission is checked by
    // the server (DecideHoldRequestV2 verifies the role and refuses
    // self-decision); the client no longer gates on localStorage.
    const [decideRequest, { loading: deciding }] = useDecideHoldRequestV2Mutation();
    const [processHold, { loading: processing }] = useProcessHoldV2Mutation();

    const [getCustomer, { data: member }] = useGetCustomerDetailLazyQuery({ fetchPolicy: "no-cache" });
    const [getCustomerPayment, { data: payment }] = useGetMemberPaymentLazyQuery({ fetchPolicy: "no-cache" });

    const [open, setOpen] = useState(false)
    const cancelButtonRef = useRef(null)
    const [open_print, setOpenPrint] = useState(false)
    const [description, setDescription] = useState("")
    const [request_info, setRequestInfo] = useState({
        request_id: 0,
        customer_id: 0, customer_name: "", phone: "", end_membership_date: "", reason: "",
        from_date: "",
        to_date: "",
        status: ""
    })

    const [open_approve, setOpenApprove] = useState(false)

    const [invoice_detail, setInvoiceDetail] = useState({
        invoice_id: 0,
        payment_date: "",
        cashier: "",
        customer_name: "",
        phone: "",
        start_date: "", end_date: "",
        old_end: "", new_end: ""
    })

    const HoldInvoiceRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    async function ProcessHold(): Promise<void> {
        if (processing) return;   // double-click guard; the server CAS is the real one
        // Only request_id crosses the wire. customer_id and new_end are
        // derived server-side from the request row and the customer's CURRENT
        // end date, so a renewal made while this sat in the queue survives.
        const res = await processHold({ variables: { requestId: request_info.request_id } });
        const out = res.data?.ProcessHoldV2;

        if (out?.success) {
            // Print the date the server actually applied, not a prediction.
            setInvoiceDetail({
                ...invoice_detail,
                invoice_id: request_info.request_id,
                new_end: date_format(out.new_end ?? ""),
            })
            return;
        }
        Notifications(out?.message ?? "បរាជ័យ", "error")
    }

    const handlePrint = useReactToPrint({
        content: () => HoldInvoiceRef.current,
        print: async (printIframe: HTMLIFrameElement) => {
            // Do whatever you want here, including asynchronous work
            await handlePrint1(printIframe);
        }
    });

    const handlePrint1 = async (target: HTMLIFrameElement) => {
        return new Promise(() => {
            console.log("forwarding print request to the main process...");
            const data = target.contentWindow.document.documentElement.outerHTML;
            const blob = new Blob([data], { type: "text/html; charset=utf-8" });
            const url = URL.createObjectURL(blob);
            window.electronAPI.printComponent1(url, (response: any) => {
                console.log("Main: ", response);
            });
        });
    };

    useEffect(() => {
        // This function will be called after the component re-renders
        if (invoice_detail.invoice_id > 0) {
            Notifications("ជោគជ័យ", "success")
            buttonRef.current.click();
            setOpenPrint(false);
            refetch()
        }
    }, [invoice_detail]);

    // Table state — the new DataTable only reports search/page changes;
    // the parent filters and slices the rows itself.
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    const requests = useMemo(
        () => (data?.HoldRequestsV2 ?? []) as HoldRequestType[],
        [data]
    );

    // The old table's global search covered the column values (customer name + reason).
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return requests;
        return requests.filter((row) =>
            row.customer_name.toLowerCase().includes(term)
            || row.reason.toLowerCase().includes(term)
        );
    }, [requests, search]);

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const pagedRequests = filtered.slice((page - 1) * pageSize, page * pageSize);

    const columns: ColumnDef<HoldRequestType>[] = [
        {
            key: "customer_name",
            header: "អតិថិជន",
            sortable: true,
            render: (row) => <div className="flex items-center"
                onClick={() => {
                    setRequestInfo({
                        request_id: row.request_id,
                        customer_id: row.customer_id,
                        customer_name: row.customer_name,
                        phone: row.phone,
                        end_membership_date: row.old_end ?? "",
                        reason: row.reason,
                        from_date: row.from_date,
                        to_date: row.to_date,
                        status: row.status
                    })
                    setOpenApprove(true)
                }}
            >
                <a href="#" className="text-gray-600 text-sm font-medium hover:text-blue-500 truncate">{row.customer_name}</a>
            </div>,
        },
        {
            key: "reason",
            header: "មូលហេតុ",
            sortable: true,
        },
        {
            key: "status",
            header: "ស្ថានភាព",
            sortable: true,
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            key: "process",
            header: "Process",
            sortable: false,
            // Only an APPROVED request can be processed — same condition the
            // server enforces, so the button never offers an action that fails.
            render: (row) => row.status === "APPROVED" ? (
                <button
                    type="button"
                    title="ដំណើរការ"
                    className="inline-block p-1 rounded bg-emerald-500/10"
                    onClick={() => {
                        setOpenPrint(true)
                        setRequestInfo({ ...request_info, customer_id: row.customer_id, request_id: row.request_id })
                        setInvoiceDetail({
                            invoice_id: 0,
                            payment_date: datetime_format(new Date()),
                            cashier: localStorage.getItem("display_name") ?? "",
                            customer_name: row.customer_name,
                            phone: row.phone,
                            start_date: date_format(row.from_date),
                            end_date: date_format(row.to_date),
                            old_end: date_format(row.old_end ?? ""),
                            new_end: "",   // filled from the server's answer
                        })
                    }}
                >
                    <PrinterIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                </button>
            ) : row.status === "PROCESSED" ? (
                <span className="inline-block p-1 rounded bg-emerald-500/10">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                </span>
            ) : (
                <span className="inline-block p-1 rounded bg-rose-500/10">
                    <XCircleIcon className="h-4 w-4 text-red-500" aria-hidden="true" />
                </span>
            ),
        },
    ];

    return (
        <>
            {!loading ? (
                <div className="grid grid-cols-1 gap-6 mb-6">
                    <Card>
                        <CardContent className="p-2">
                        {/* <div className="flex items-center mb-4">
                            <button type="button" className=" bg-gray-50 text-sm font-medium text-gray-600 py-2 px-4 rounded-tl-md rounded-bl-md hover:text-gray-900 active">Pending</button>
                            <button type="button" className="bg-gray-50 text-sm font-medium text-gray-600 py-2 px-4 hover:text-gray-900">Approved</button>
                            <button type="button" className="bg-gray-50 text-sm font-medium text-gray-600 py-2 px-4 hover:text-gray-900">Rejected</button>
                            <button type="button" className="bg-gray-50 text-sm font-medium text-gray-600 py-2 px-4 rounded-tr-md rounded-br-md hover:text-gray-900">All</button>
                        </div> */}


                        <DataTable<HoldRequestType>
                            data={pagedRequests}
                            columns={columns}
                            pageInfo={{
                                current_page: page,
                                page_size: pageSize,
                                total_items: totalItems,
                                total_pages: totalPages,
                                has_next: page < totalPages,
                                has_previous: page > 1,
                            }}
                            currentPage={page}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                            pageSizeOptions={[10, 20, 30, 50]}
                            searchValue={search}
                            onSearchChange={(term) => { setSearch(term); setPage(1); }}
                            columnToggle
                            exportFileName="hold_requests.csv"
                            printTitle="សំណើសុំច្បាប់"
                        />
                        </CardContent>

                        {/* <div className="overflow-x-auto">
                            <table className="w-full min-w-[540px]">
                                <thead>
                                    <tr className="w-full">
                                        <th className="text-[12px] uppercase tracking-wide font-medium text-gray-600 py-2 px-4 bg-gray-200 text-left rounded-tl-md rounded-bl-md">ឈ្មោះអតិថិជន</th>
                                        <th className="text-[12px] uppercase tracking-wide font-medium text-gray-600 py-2 px-4 bg-gray-200 text-left">មូលហេតុ</th>

                                        <th className="text-[12px] uppercase tracking-wide font-medium text-gray-600 py-2 px-4 bg-gray-200 text-center">ស្ថានភាព</th>
                                        <th className="text-[12px] uppercase tracking-wide font-medium text-gray-600 py-2 px-4 bg-gray-200 text-center rounded-tr-md rounded-br-md">សកម្មភាព</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        data?.HoldRequests.map((request) => {
                                            return (
                                                <tr key={request.request_id}>
                                                    <td className="py-2 px-2 border-b border-b-gray-50 w-10">
                                                        <div className="flex items-center"
                                                            onClick={() => {
                                                                CheckApproverRole()
                                                                setRequestInfo({
                                                                    request_id: request.request_id,
                                                                    customer_id: request.customer_id,
                                                                    customer_name: request.customer_name,
                                                                    phone: request.phone,
                                                                    end_membership_date: request.old_end,
                                                                    reason: request.reason,
                                                                    from_date: request.from_date,
                                                                    to_date: request.to_date,
                                                                    new_end: request.new_end,
                                                                    checker_status: request.checker_status
                                                                })
                                                            }}
                                                        >
                                                            <a href="#" className="text-gray-600 text-sm font-medium hover:text-blue-500 ml-2 truncate">{request.customer_name}</a>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-4 border-b border-b-gray-50 text-left w-10">
                                                        <span className="text-[13px] font-medium text-black">{request.reason}</span>
                                                    </td>

                                                    <td className="py-2 px-4 border-b border-b-gray-50 text-center w-10" >
                                                        {
                                                            request.checker_status === "Approved" ?
                                                                <span className="inline-block p-1 rounded bg-emerald-500/10 text-emerald-500 font-medium text-[12px] leading-none">
                                                                    Approved
                                                                </span>
                                                                :
                                                                <>
                                                                    {
                                                                        request.checker_status === "Rejected" ?
                                                                            <span className="inline-block p-1 rounded bg-rose-500/10 text-red-500 font-medium text-[12px] leading-none">
                                                                                Rejected
                                                                            </span>
                                                                            :
                                                                            <span className="inline-block p-1 rounded bg-emerald-500/10 text-yellow-500 font-medium text-[12px] leading-none">
                                                                                មានទាន់ពិនិត្យ
                                                                            </span>
                                                                    }

                                                                </>

                                                        }
                                                    </td>
                                                    <td className="py-2 px-4 border-b border-b-gray-50 text-center w-4">
                                                        {
                                                            request.checker_status === "Approved" ?
                                                                <>
                                                                    {
                                                                        request.process === "Pending" ?
                                                                            <span className="inline-block p-1 rounded bg-emerald-500/10 text-emerald-500 font-medium text-[12px] leading-none" onClick={() => {
                                                                                setOpenPrint(true)
                                                                                setInvoiceDetail({
                                                                                    invoice_id: 0,
                                                                                    payment_date: datetime_format(new Date()),
                                                                                    cashier: localStorage.getItem("display_name"),
                                                                                    customer_name: request.customer_name,
                                                                                    phone: request.phone,
                                                                                    start_date: date_format(request.from_date),
                                                                                    end_date: date_format(request.to_date),
                                                                                    old_end: date_format(request.old_end),
                                                                                    new_end: date_format(request.new_end)
                                                                                })
                                                                            }}
                                                                            >
                                                                                <PrinterIcon
                                                                                    className="h-4 w-4 text-gray-500"
                                                                                    aria-hidden="true"
                                                                                />
                                                                            </span>
                                                                            :
                                                                            <span className="inline-block p-1 rounded bg-emerald-500/10 text-emerald-500 font-medium text-[12px] leading-none">
                                                                                <CheckCircleIcon
                                                                                    className="h-4 w-4 text-emerald-500"
                                                                                    aria-hidden="true"
                                                                                />
                                                                            </span>

                                                                    }

                                                                </>
                                                                :
                                                                <span className="inline-block p-1 rounded bg-emerald-500/10 text-yellow-500 font-medium text-[12px] leading-none">
                                                                    <XCircleIcon
                                                                        className="h-4 w-4 text-red-500"
                                                                        aria-hidden="true"
                                                                    />
                                                                </span>
                                                        }
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>
                            </table>
                        </div> */}
                    </Card>

                </div>
            ) : (
                <LoadingPage message={"Loading"} />
            )}

            <Button
                className="hidden"
                ref={buttonRef}
                type="button"
                onClick={handlePrint}
            >
                Print
            </Button>

            {/*Approve Or Reject */}
            <Dialog open={open_approve} onOpenChange={setOpenApprove}>
                <DialogContent className="sm:max-w-[350px] w-[350px]">
                    <DialogHeader>
                        <DialogTitle>សំណើសុំច្បាប់</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="w-full space-y-1">
                            <Label>ឈ្មោះអតិថិជន</Label>
                            <Input
                                type="text"
                                readOnly
                                disabled
                                value={request_info.customer_name}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-x-4">
                            <div className="col-span-1 space-y-1">
                                <Label>លេខទូរស័ព្ទ</Label>
                                <Input
                                    type="text"
                                    readOnly
                                    disabled
                                    value={request_info.phone}
                                />
                            </div>

                            <div className="col-span-1 space-y-1">
                                <Label>ថ្ងៃផុតសពលភាពចាស់</Label>
                                <Input
                                    type="text"
                                    readOnly
                                    disabled
                                    value={date_format(request_info.end_membership_date)}
                                />
                            </div>
                        </div>

                        <div className="w-full space-y-1">
                            <Label>មូលហេតុនៃការសុំច្បាប់</Label>
                            <Input
                                type="text"
                                readOnly
                                disabled
                                value={request_info.reason}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-x-4">
                            <div className="col-span-1 space-y-1">
                                <Label>ចាប់ពីថ្ងៃ</Label>
                                <Input
                                    type="text"
                                    readOnly
                                    disabled
                                    value={date_format(request_info.from_date)}
                                />
                            </div>

                            <div className="col-span-1 space-y-1">
                                <Label>ដល់ថ្ងៃទី</Label>
                                <Input
                                    type="text"
                                    readOnly
                                    disabled
                                    value={date_format(request_info.to_date)}
                                />
                            </div>
                        </div>

                        <div className="w-full space-y-1">
                            <Label>មូលហេតុ</Label>
                            <Input type="text" readOnly disabled value={request_info.reason} />
                        </div>

                        <div className="w-full space-y-1">
                            <Label>មិតិយោបល់</Label>
                            <Input
                                autoFocus
                                type="text"
                                required
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-row-reverse gap-2">
                        {
                            request_info.status !== "PENDING" ?
                                <Button
                                    type="button"
                                    variant="default"
                                    onClick={async () => {
                                        //TODO: Update To Checked
                                        setOpenApprove(false);
                                    }}
                                >
                                    Close
                                </Button>
                                :
                                <>
                                    <Button
                                        type="button"
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={deciding}
                                        onClick={async () => {
                                            const res = await decideRequest({
                                                variables: {
                                                    requestId: request_info.request_id,
                                                    approve: true,
                                                    note: description,
                                                }
                                            })
                                            const out = res.data?.DecideHoldRequestV2;
                                            if (out?.success) {
                                                Notifications(out.message ?? "Approved", "success")
                                                setOpenApprove(false);
                                                refetch();
                                                return;
                                            }
                                            // Server explains: no permission, own request, already decided.
                                            Notifications(out?.message ?? "Failed", "error")
                                        }}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        disabled={deciding}
                                        onClick={async () => {
                                            const res = await decideRequest({
                                                variables: {
                                                    requestId: request_info.request_id,
                                                    approve: false,
                                                    note: description,
                                                }
                                            })
                                            const out = res.data?.DecideHoldRequestV2;
                                            if (out?.success) {
                                                setOpenApprove(false);
                                                refetch();
                                                Notifications(out.message ?? "Rejected", "success")
                                                return;
                                            }
                                            Notifications(out?.message ?? "Failed", "error")
                                        }}
                                    >
                                        Reject
                                    </Button>
                                </>
                        }
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Customer Payment */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>ពត៌មានអតិថិជន</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    payment?.GetMemberPayment.map((payment, index) => {
                                        return (
                                            <tr key={index} className="odd:bg-white even:bg-gray-100 text-left">
                                                <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-800">{date_format(payment.payment_date)}</td>
                                                <td>{payment.promotion}</td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Receiptionist Print Payment */}
            <Dialog open={open_print} onOpenChange={setOpenPrint}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>វិក្កយបត្រ</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2">
                        <HoldInvoice
                            ref={HoldInvoiceRef}
                            invoice_detail={invoice_detail}
                        >
                        </HoldInvoice>
                    </div>
                    <DialogFooter className="flex-row-reverse gap-2">
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={processing}
                            onClick={() => ProcessHold()}
                        >
                            យល់ព្រម
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setOpenPrint(false)}
                        >
                            ចាកចេញ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default HoldRequest