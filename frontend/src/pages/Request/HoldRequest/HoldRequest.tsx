import LoadingPage from "../../../components/LoadingPage/LoadingPage"
import { useGetCustomerDetailLazyQuery, useGetMemberPaymentLazyQuery } from "../../../generated/graphql";
import { useDecideHoldRequestV2Mutation, useHoldRequestsV2Query, useProcessHoldV2Mutation } from "../../../generated/holdV2";
import { FileSpreadsheet, Printer } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Notifications from "../../../components/Notification";
import { HoldInvoice } from "../../../components/ComponentToPrint/HoldInvoice";
import { useReactToPrint } from "react-to-print";
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
import { BoardHeader } from "@/components/board/BoardHeader";
import { RequestColumns, type RequestCard } from "@/components/board/RequestColumns";
import { statusTone } from "@/components/board/MagnetChip";
import { exportToExcel } from "@/utils/excelExport";
import { showSuccessToast, showErrorToast } from "@/utils/toast";


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


const STATUS_LABEL: Record<string, string> = {
    PENDING:   "មិនទាន់ពិនិត្យ",
    APPROVED:  "ឯកភាព",
    REJECTED:  "បដិសេធ",
    PROCESSED: "ដំណើរការរួច",
    CANCELLED: "បានលុប",
};

/** Which column of the board a request sits in. */
const columnOf = (status: string) =>
    status === "PENDING" ? "requested" : status === "PROCESSED" ? "processed" : "checked";

const HoldRequest = () => {
    const { t } = useTranslation();

    const { data, loading, refetch } = useHoldRequestsV2Query({ fetchPolicy: "no-cache" })

    // One decision mutation replaces check+approve. Permission is checked by
    // the server (DecideHoldRequestV2 verifies the role and refuses
    // self-decision); the client no longer gates on localStorage.
    const [decideRequest, { loading: deciding }] = useDecideHoldRequestV2Mutation();
    const [processHold, { loading: processing }] = useProcessHoldV2Mutation();

    const [getCustomer, { data: member }] = useGetCustomerDetailLazyQuery({ fetchPolicy: "no-cache" });
    const [getCustomerPayment, { data: payment }] = useGetMemberPaymentLazyQuery({ fetchPolicy: "no-cache" });
    void getCustomer; void member; void getCustomerPayment;

    const [open, setOpen] = useState(false)
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
            const data = target.contentWindow!.document.documentElement.outerHTML;
            const blob = new Blob([data], { type: "text/html; charset=utf-8" });
            const url = URL.createObjectURL(blob);
            (window as any).electronAPI.printComponent1(url, (response: any) => {
                console.log("Main: ", response);
            });
        });
    };

    useEffect(() => {
        // This function will be called after the component re-renders
        if (invoice_detail.invoice_id > 0) {
            Notifications("ជោគជ័យ", "success")
            buttonRef.current?.click();
            setOpenPrint(false);
            refetch()
        }
    }, [invoice_detail]);

    const [search, setSearch] = useState("")

    const requests = useMemo(
        () => (data?.HoldRequestsV2 ?? []) as HoldRequestType[],
        [data]
    );

    // The old table's global search covered the column values (customer name + reason).
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        const list = term
            ? requests.filter((row) =>
                row.customer_name.toLowerCase().includes(term)
                || row.reason.toLowerCase().includes(term)
                || (row.phone ?? "").toLowerCase().includes(term))
            : requests;
        // Newest first within each column.
        return [...list].sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
    }, [requests, search]);

    // What the Excel export writes — the same fields the old table carried.
    const exportColumns: ColumnDef<HoldRequestType>[] = [
        { key: "customer_name", header: "អតិថិជន" },
        { key: "phone", header: "ទូរស័ព្ទ" },
        { key: "reason", header: "មូលហេតុ" },
        { key: "from_date", header: "ចាប់ពីថ្ងៃ", accessor: (r) => date_format(r.from_date) },
        { key: "to_date", header: "ដល់ថ្ងៃទី", accessor: (r) => date_format(r.to_date) },
        { key: "status", header: "ស្ថានភាព", accessor: (r) => STATUS_LABEL[r.status] ?? r.status },
        { key: "requested_by_name", header: "អ្នកស្នើ", accessor: (r) => r.requested_by_name ?? "" },
        { key: "requested_at", header: "ថ្ងៃស្នើ", accessor: (r) => datetime_format(r.requested_at) },
        { key: "decided_by_name", header: "អ្នកសម្រេច", accessor: (r) => r.decided_by_name ?? "" },
        { key: "processed_by_name", header: "អ្នកដំណើរការ", accessor: (r) => r.processed_by_name ?? "" },
    ];

    const handleExport = () => {
        try {
            if (filtered.length === 0) { showErrorToast(t("ui.dataTable.noExportData")); return; }
            exportToExcel(filtered, exportColumns, "hold_requests.xlsx");
            showSuccessToast(t("ui.dataTable.exportSuccess", { count: filtered.length }));
        } catch (err) {
            showErrorToast(t("ui.dataTable.exportFailed"));
            console.error("Export error:", err);
        }
    };

    const openDecision = (row: HoldRequestType) => {
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
        setDescription("")
        setOpenApprove(true)
    };

    const openProcess = (row: HoldRequestType) => {
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
    };

    const cards: RequestCard[] = filtered.map((row) => ({
        id: row.request_id,
        column: columnOf(row.status),
        title: row.customer_name,
        subtitle: row.phone,
        lines: [
            `${date_format(row.from_date)} → ${date_format(row.to_date)}`,
            row.reason,
            row.requested_by_name ? t("requests.requestedBy", { name: row.requested_by_name }) : datetime_format(row.requested_at),
        ],
        tone: statusTone(row.status),
        toneLabel: STATUS_LABEL[row.status] ?? row.status,
        onClick: () => openDecision(row),
        // Only an APPROVED request can be processed — same condition the
        // server enforces, so the button never offers an action that fails.
        actions: row.status === "PENDING" ? (
            <Button size="sm" variant="outline" onClick={() => openDecision(row)}>
                {t("requests.decide")}
            </Button>
        ) : row.status === "APPROVED" ? (
            <Button size="sm" variant="commit" onClick={() => openProcess(row)}>
                <Printer aria-hidden="true" />
                {t("requests.process")}
            </Button>
        ) : undefined,
    }));

    return (
        <>
            <BoardHeader
                titleKey="requests.hold"
                actions={
                    <>
                        <Input
                            type="search"
                            placeholder={t("common.searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-56"
                            aria-label={t("common.search")}
                        />
                        <Button variant="outline" onClick={handleExport} title={t("ui.dataTable.exportToExcel")}>
                            <FileSpreadsheet aria-hidden="true" />
                            {t("common.export")}
                        </Button>
                    </>
                }
            />

            {!loading ? (
                <RequestColumns
                    columns={[
                        { key: "requested", label: t("requests.requested") },
                        { key: "checked", label: t("requests.checked") },
                        { key: "processed", label: t("requests.processed") },
                    ]}
                    cards={cards}
                    emptyLabel={t("requests.empty")}
                />
            ) : (
                <LoadingPage message={t("common.loading")} />
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>សំណើសុំច្បាប់</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="w-full space-y-1.5">
                            <Label>ឈ្មោះអតិថិជន</Label>
                            <Input
                                type="text"
                                readOnly
                                value={request_info.customer_name}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>លេខទូរស័ព្ទ</Label>
                                <Input
                                    type="text"
                                    readOnly
                                    value={request_info.phone}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>ថ្ងៃផុតសពលភាពចាស់</Label>
                                <Input
                                    type="text"
                                    readOnly
                                    value={date_format(request_info.end_membership_date)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>ចាប់ពីថ្ងៃ</Label>
                                <Input
                                    type="text"
                                    readOnly
                                    value={date_format(request_info.from_date)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>ដល់ថ្ងៃទី</Label>
                                <Input
                                    type="text"
                                    readOnly
                                    value={date_format(request_info.to_date)}
                                />
                            </div>
                        </div>

                        <div className="w-full space-y-1.5">
                            <Label>មូលហេតុ</Label>
                            <Input type="text" readOnly value={request_info.reason} />
                        </div>

                        {request_info.status === "PENDING" && (
                            <div className="w-full space-y-1.5">
                                <Label htmlFor="hold-note">មិតិយោបល់</Label>
                                <Input
                                    id="hold-note"
                                    autoFocus
                                    type="text"
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        {
                            request_info.status !== "PENDING" ?
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={async () => {
                                        //TODO: Update To Checked
                                        setOpenApprove(false);
                                    }}
                                >
                                    {t("common.close")}
                                </Button>
                                :
                                <>
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
                                    <Button
                                        type="button"
                                        variant="success"
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
                    <div className="overflow-hidden rounded-lg border border-rule">
                        <table className="min-w-full text-caption">
                            <thead className="bg-tray text-left text-ink-soft">
                                <tr>
                                    <th scope="col" className="px-2 py-1.5 font-medium">Date</th>
                                    <th scope="col" className="px-2 py-1.5 font-medium">Item</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-rule/60">
                                {
                                    payment?.GetMemberPayment.map((payment, index) => {
                                        return (
                                            <tr key={index} className="text-left text-ink">
                                                <td className="whitespace-nowrap px-2 py-[3px]">{date_format(payment.payment_date)}</td>
                                                <td className="px-2 py-[3px]">{payment.promotion}</td>
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
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            {t("common.close")}
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
                    <div className="overflow-x-auto rounded-lg border border-rule bg-tray p-3">
                        <HoldInvoice
                            ref={HoldInvoiceRef}
                            invoice_detail={invoice_detail}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenPrint(false)}
                        >
                            ចាកចេញ
                        </Button>
                        <Button
                            type="button"
                            variant="commit"
                            disabled={processing}
                            onClick={() => ProcessHold()}
                        >
                            <Printer aria-hidden="true" />
                            យល់ព្រម · បោះពុម្ព
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default HoldRequest
