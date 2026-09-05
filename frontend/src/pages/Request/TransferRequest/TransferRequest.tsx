import type { ColumnDef } from '@/types/datatable';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApprovalStatus, useApproveTransferRequestMutation, useCheckTransferRequestMutation, useCreateTransferMutation, useTransferRequestsQuery } from '../../../generated/graphql';
import Notifications from '../../../components/Notification';
import { ArrowLeftRight, Columns3, FileSpreadsheet, Printer, Rows3, type LucideIcon } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { TransferInvoice } from '../../../components/ComponentToPrint/TransferInvoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { RequestColumns, type RequestCard } from '@/components/ui/RequestColumns';
import { Chip, statusTone, type ChipTone } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { FigureStrip } from '@/components/ui/FigureStrip';
import { Skeleton, SkeletonRows } from '@/components/ui/skeleton';
import { formatCount } from '@/lib/money';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/utils/excelExport';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

type TransferRequest = {
    request_id: number
    request_by: number
    request_date: string
    reason: string
    sender_id: number
    sender_phone: string
    sender_old_end: string
    receiver_id: number
    checked_by: number | null
    checker_comment: string
    checked_date: string
    checker_status: string
    approved_by: number | null
    approver_comment: string
    approved_date: string
    approver_status: string
    process: string
    processed_by: number | null
    display_name: string
    sender_name: string
    receiver_name: string
    receiver_old_end: string
    receiver_phone: string
    checker_name: string
    approver_name: string
    processed_name: string

}

const datetime_format = (date_time: string | Date) => {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA") + " " + date.toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' });
};

const date_format = (date_time: string | Date) => {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA");
};

const DECISION_LABEL: Record<string, string> = {
    Pending: "មិនទាន់",
    Approved: "ឯកភាព",
    Rejected: "បដិសេធ",
};

/** Which stage column a transfer sits in. */
const columnOf = (r: TransferRequest) =>
    r.processed_by != null ? "processed" : r.checker_status === "Pending" ? "requested" : "checked";

/** The card's headline state: the furthest the request has got. */
const overallTone = (r: TransferRequest): { tone: ChipTone; label: string } => {
    if (r.processed_by != null) return { tone: "paid", label: "ដំណើរការរួច" };
    if (r.checker_status === "Rejected" || r.approver_status === "Rejected") return { tone: "void", label: "បដិសេធ" };
    if (r.checker_status === "Approved" && r.approver_status === "Approved") return { tone: "notice", label: "រង់ចាំដំណើរការ" };
    if (r.checker_status === "Approved") return { tone: "pending", label: "រង់ចាំសម្រេច" };
    return { tone: "pending", label: "រង់ចាំពិនិត្យ" };
};

/** The same rows read two ways: by stage, or as one flat ledger. */
type RequestView = "columns" | "table";

function ViewToggle({
    view,
    onChange,
    columnsLabel,
    tableLabel,
}: {
    view: RequestView;
    onChange: (next: RequestView) => void;
    columnsLabel: string;
    tableLabel: string;
}) {
    const item = (value: RequestView, label: string, Icon: LucideIcon, first: boolean) => (
        <button
            type="button"
            onClick={() => onChange(value)}
            aria-pressed={view === value}
            title={label}
            aria-label={label}
            className={cn(
                "inline-flex h-9 w-9 items-center justify-center transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                !first && "border-l border-rule",
                view === value ? "bg-ink text-chalk" : "text-ink-soft hover:bg-wash"
            )}
        >
            <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
    );

    return (
        <div className="inline-flex overflow-hidden rounded-md border border-rule bg-card" role="group">
            {item("columns", columnsLabel, Columns3, true)}
            {item("table", tableLabel, Rows3, false)}
        </div>
    );
}

const TransferRequest = () => {
    const { t } = useTranslation();

    function countDaysBetweenDates(startDate: Date, endDate: Date) {
        // Convert both dates to UTC to ensure accurate calculation
        const utcStartDate = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const utcEndDate = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        // Calculate the difference in milliseconds
        const timeDifference = utcEndDate - utcStartDate;

        // Convert the difference from milliseconds to days
        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        return daysDifference;
    }

    function calculateNewEndDate(startDate: string, daysToAdd: number) {
        // Clone the start date to avoid modifying the original date
        const endDate = new Date(startDate);
        // Use setDate to add the specified number of days
        endDate.setDate(endDate.getDate() + daysToAdd);
        return date_format(endDate);
    }

    /** Days the sender has left to give away. An expired membership has none —
     *  without the clamp a negative remainder used to REVIVE the sender (their
     *  end date minus a negative count) while debiting the receiver. */
    function SenderRemainingDays(sender_old_end: string) {
        return Math.max(0, countDaysBetweenDates(new Date(), new Date(sender_old_end)));
    }

    function SenderNewEnd(old_end: string) {
        const remain = SenderRemainingDays(old_end);
        // Nothing left to transfer: the expired end date stays where it was.
        if (remain === 0) return date_format(old_end);
        return calculateNewEndDate(old_end, -remain);
    }

    function ReceiverNewEnd(sender_old_end: string, receiver_old_end: string) {
        const sender_remain = SenderRemainingDays(sender_old_end);
        // Expired sender transfers zero days — the receiver keeps their date.
        if (sender_remain === 0) return date_format(receiver_old_end);
        const receiver_remain = countDaysBetweenDates(new Date(), new Date(receiver_old_end));
        if (receiver_remain <= 0) {
            // Receiver already expired: they inherit the sender's window
            // (today → sender's end date), same day count the sender gave up.
            return date_format(sender_old_end);
        }
        return calculateNewEndDate(receiver_old_end, sender_remain);
    }

    const HandleCheckerApprove = async () => {
        //TODO: Check Permission
        const userRole = localStorage.getItem("role");
        if (userRole === "Admin" || userRole === "Checker") {
            // Clear the previous request's comment — the input is controlled, so
            // stale text can no longer be submitted invisibly.
            setDescription("")
            setOpenChecker(true)
            return;
        }
        Notifications("អ្នកមិនមានសិទ្ធិទេ", "error")
    }

    const CheckApproverRole = async () => {
        //TODO: Check Permission
        const userRole = localStorage.getItem("role");
        if (userRole === "Admin") {
            setDescription("")
            setOpenApprover(true)
            return;
        }
        Notifications("អ្នកមិនមានសិទ្ធិទេ", "error")
    }

    const [checkerApprove, { loading: checker_saving }] = useCheckTransferRequestMutation();
    const [approveTransfer, { loading: approver_saving }] = useApproveTransferRequestMutation();
    const [createTransfer, { loading: transfer_saving }] = useCreateTransferMutation();
    const { data, loading, refetch } = useTransferRequestsQuery({ fetchPolicy: "no-cache" })

    const [open_checker, setOpenChecker] = useState(false)
    const [open_approver, setOpenApprover] = useState(false)
    const [request_id, setRequestID] = useState(0)
    const [description, setDescription] = useState("")
    const [open_print, setOpenPrint] = useState(false)
    const [view, setView] = useState<RequestView>("columns")
    const buttonRef = useRef<HTMLButtonElement>(null);
    const InvoiceRef = useRef<HTMLDivElement>(null);
    // Synchronous re-entry guard: state alone can't stop a double-click that
    // lands before React re-renders, and each extra CreateTransfer inserts a
    // second transfer row server-side.
    const processingRef = useRef(false);

    const [search, setSearch] = useState("")

    const requests = useMemo(
        () => (data?.TransferRequests ?? []) as TransferRequest[],
        [data]
    );

    // The header only reports the search term; filter here, newest first.
    const filtered_requests = useMemo(() => {
        const term = search.trim().toLowerCase();
        const list = term
            ? requests.filter((row) =>
                [
                    row.display_name,
                    row.request_date,
                    row.sender_name,
                    row.receiver_name,
                    row.reason,
                    row.checker_name,
                    row.approver_name,
                    String(row.request_id),
                ].some((value) => (value ?? "").toLowerCase().includes(term))
            )
            : requests;
        return [...list].sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
    }, [requests, search]);

    // One strip of aggregates over whatever the search left, so the table view
    // carries the same stage counts the columns show on their headings.
    const figures = useMemo(() => {
        const inStage = (key: string) => filtered_requests.filter((row) => columnOf(row) === key).length;
        return [
            { label: t("common.total"), value: formatCount(filtered_requests.length) },
            { label: t("requests.requested"), value: formatCount(inStage("requested")) },
            { label: t("requests.checked"), value: formatCount(inStage("checked")) },
            { label: t("requests.processed"), value: formatCount(inStage("processed")), tone: "paid" as const },
        ];
    }, [filtered_requests, t]);

    // What the Excel export writes — the same fields the old table carried.
    const exportColumns: ColumnDef<TransferRequest>[] = [
        { key: 'request_id', header: 'ID' },
        { key: 'display_name', header: 'អ្នកស្នើ' },
        { key: 'request_date', header: 'ថ្ងៃស្នើ', accessor: (row) => datetime_format(row.request_date) },
        { key: 'sender_name', header: 'ពីឈ្មោះ' },
        { key: 'receiver_name', header: 'ទៅឈ្មោះ' },
        { key: 'reason', header: 'មូលហេតុ' },
        { key: 'checker_name', header: 'អ្នកពិនិត្យ', accessor: (row) => row.checker_status },
        { key: 'checker_comment', header: 'មតិអ្នកពិនិត្យ', accessor: (row) => row.checker_comment ?? '' },
        { key: 'approver_name', header: 'អ្នកសម្រេច', accessor: (row) => row.approver_status },
        { key: 'approver_comment', header: 'មតិអ្នកសម្រេច', accessor: (row) => row.approver_comment ?? '' },
        {
            key: 'process',
            header: 'Process',
            accessor: (row) =>
                row.checker_status === "Approved" && row.approver_status === "Approved"
                    ? (row.processed_by == null ? "" : row.processed_name)
                    : "Pending",
        },
    ];

    const handleExport = () => {
        try {
            if (filtered_requests.length === 0) { showErrorToast(t("ui.dataTable.noExportData")); return; }
            exportToExcel(filtered_requests, exportColumns, "transfer_requests.xlsx");
            showSuccessToast(t("ui.dataTable.exportSuccess", { count: filtered_requests.length }));
        } catch (err) {
            showErrorToast(t("ui.dataTable.exportFailed"));
            console.error("Export error:", err);
        }
    };

    const [invoice_detail, setInvoiceDetail] = useState({
        invoice_id: 0, cashier: "", payment_date: "",
        sender_id: 0, sender_name: "", sender_phone: "", sender_old_end: "", sender_new_end: "",
        receiver_id: 0, receiver_name: "", receiver_phone: "", receiver_old_end: "", receiver_new_end: "",
    })

    const handlePrint = useReactToPrint({
        content: () => InvoiceRef.current,
        print: (printIframe: HTMLIFrameElement) => SendToElectronPrinter(printIframe),
        // Without this, react-to-print's post-print cleanup is a no-op and the
        // hidden print iframe lingers in document.body until the next print.
        removeAfterPrint: true,
        // Without this, a print failure (e.g. running in a plain browser, where
        // window.electronAPI does not exist) was swallowed with only a console
        // line — the transfer was committed but no invoice appeared and no one
        // was told.
        onPrintError: () => Notifications("មិនអាចបោះពុម្ពវិក្កយបត្របានទេ", "error"),
    });

    const SendToElectronPrinter = (target: HTMLIFrameElement) => {
        // Must settle: react-to-print awaits this promise before running its
        // cleanup (iframe removal); the old executor never resolved, so every
        // print leaked the hidden iframe and its blob URL.
        return new Promise<void>((resolve, reject) => {
            const doc = target.contentWindow?.document;
            if (!doc) {
                reject(new Error("print frame not ready"));
                return;
            }
            const blob = new Blob([doc.documentElement.outerHTML], { type: "text/html; charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const api = (window as { electronAPI?: { printComponent1: (u: string, cb: (r: unknown) => void) => void } }).electronAPI;
            if (!api?.printComponent1) {
                URL.revokeObjectURL(url);
                reject(new Error("printing is only available in the desktop app"));
                return;
            }
            api.printComponent1(url, (response) => {
                console.log("Main: ", response);
                URL.revokeObjectURL(url);
                resolve();
            });
        });
    };

    async function ProcessTransfer(): Promise<void> {
        // Ref, not state: a double-click lands before React re-renders, and each
        // extra CreateTransfer inserts a second transfer row server-side.
        if (processingRef.current) return;
        processingRef.current = true;

        try {
            // Only the request id travels now. The server loads the request,
            // locks both customers FOR UPDATE, and computes the new end dates
            // itself — the browser's copies (sender_new_end etc.) are a stale
            // snapshot taken when the list was last fetched, and trusting them
            // is how a '0000-00-00' end date reached a live customer.
            // processed_by comes from the JWT, so there is no id to send.
            const { data } = await createTransfer({
                variables: { requestId: request_id }
            })
            const res = data?.CreateTransfer;
            if (res?.success) {
                if (res.transfer_id != null && res.transfer_id > 0) {
                    // The effect below prints and closes once the id lands in state.
                    setInvoiceDetail({ ...invoice_detail, invoice_id: res.transfer_id })
                } else {
                    // Committed server-side but no id came back — finish the flow
                    // anyway. Leaving the dialog open looking idle invited a retry,
                    // which double-processed the transfer.
                    Notifications("ជោគជ័យ", "success")
                    setOpenPrint(false);
                    refetch();
                }
                return;
            }
            Notifications("បរាជ័យ", "error")
        } catch {
            // Network/GraphQL rejection used to escape as an unhandled promise —
            // no toast, dialog frozen, and the natural retry created duplicates.
            Notifications("បរាជ័យ", "error")
        } finally {
            processingRef.current = false;
        }
    }

    useEffect(() => {
        // This function will be called after the component re-renders
        if (invoice_detail.invoice_id > 0) {
            Notifications("ជោគជ័យ", "success")
            buttonRef.current?.click();
            setOpenPrint(false);
            refetch();
        }
    }, [invoice_detail]);

    const openProcess = (row_data: TransferRequest) => {
        // A zero-day transfer (sender already expired) would mark the
        // request Done and print an invoice for a move that never
        // happens — refuse up front instead.
        if (SenderRemainingDays(row_data.sender_old_end) === 0) {
            Notifications("សមាជិកភាពអ្នកផ្ទេរផុតកំណត់ហើយ — គ្មានថ្ងៃនៅសល់សម្រាប់ផ្ទេរទេ", "error")
            return;
        }
        setOpenPrint(true)
        setRequestID(row_data.request_id)

        setInvoiceDetail({
            invoice_id: 0,
            cashier: localStorage.getItem("display_name") || "",
            payment_date: datetime_format(new Date()),
            sender_id: row_data.sender_id,
            sender_name: row_data.sender_name,
            sender_phone: row_data.sender_phone,
            sender_old_end: row_data.sender_old_end,
            sender_new_end: SenderNewEnd(row_data.sender_old_end),
            receiver_id: row_data.receiver_id,
            receiver_name: row_data.receiver_name,
            receiver_phone: row_data.receiver_phone,
            receiver_old_end: row_data.receiver_old_end,
            // Raw value on purpose: date-only strings parse as UTC midnight
            // while datetimes parse as local, so pre-formatting here made the
            // two sides of the transfer measure different calendar days.
            receiver_new_end: ReceiverNewEnd(row_data.sender_old_end, row_data.receiver_old_end),
        })
    };

    /** Can this request still be turned into a transfer? Both decisions in, not
     *  processed yet — the same condition the server enforces. */
    const canProcess = (row: TransferRequest) =>
        row.checker_status === "Approved" && row.approver_status === "Approved" && row.processed_by == null;

    // The next step for one request, shared by the stage cards and the table so
    // the two views can never offer different actions.
    const rowActions = (row: TransferRequest) => {
        const processable = canProcess(row);
        if (row.checker_status !== "Pending" && row.approver_status !== "Pending" && !processable) return null;
        return (
            <>
                {row.checker_status === "Pending" && (
                    <Button size="sm" variant="outline" onClick={() => { HandleCheckerApprove(); setRequestID(row.request_id) }}>
                        {t("requests.checker")}
                    </Button>
                )}
                {row.approver_status === "Pending" && (
                    <Button size="sm" variant="outline" onClick={() => { CheckApproverRole(); setRequestID(row.request_id) }}>
                        {t("requests.decide")}
                    </Button>
                )}
                {processable && (
                    <Button size="sm" onClick={() => openProcess(row)}>
                        <Printer aria-hidden="true" />
                        {t("requests.process")}
                    </Button>
                )}
            </>
        );
    };

    const cards: RequestCard[] = filtered_requests.map((row) => {
        const overall = overallTone(row);
        return {
            id: row.request_id,
            column: columnOf(row),
            title: `${row.sender_name} → ${row.receiver_name}`,
            subtitle: `${row.display_name} · ${datetime_format(row.request_date)}`,
            lines: [row.reason, row.processed_name ? `${t("requests.processed")}: ${row.processed_name}` : null].filter(Boolean) as string[],
            tone: overall.tone,
            toneLabel: overall.label,
            extra: (
                <>
                    <Chip tone={statusTone(row.checker_status)} title={row.checker_comment || undefined}>
                        {t("requests.checker")} · {DECISION_LABEL[row.checker_status] ?? row.checker_status}
                    </Chip>
                    <Chip tone={statusTone(row.approver_status)} title={row.approver_comment || undefined}>
                        {t("requests.approver")} · {DECISION_LABEL[row.approver_status] ?? row.approver_status}
                    </Chip>
                </>
            ),
            actions: rowActions(row) ?? undefined,
        };
    });

    return (
        <>
            <PageHeader
                titleKey="requests.transfer"
                actions={
                    <>
                        <ViewToggle
                            view={view}
                            onChange={setView}
                            columnsLabel={t("requests.viewColumns")}
                            tableLabel={t("requests.viewTable")}
                        />
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

            <FigureStrip items={figures} loading={loading} className="mb-4" />

            {loading ? (
                view === "table" ? (
                    <div className="overflow-hidden rounded-lg border border-rule bg-card" role="status" aria-live="polite">
                        <div className="h-8 border-b border-rule bg-wash" />
                        <SkeletonRows rows={6} className="p-1" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3" role="status" aria-live="polite">
                        {[0, 1, 2].map((col) => (
                            <div key={col} className="min-w-0 space-y-2">
                                <Skeleton className="h-5 w-24" />
                                {[0, 1, 2].map((i) => (
                                    <Skeleton key={i} className="h-[6.5rem] rounded-lg" />
                                ))}
                            </div>
                        ))}
                    </div>
                )
            ) : filtered_requests.length === 0 ? (
                <div className="rounded-lg border border-rule bg-card">
                    <EmptyState
                        icon={ArrowLeftRight}
                        title={t("requests.empty")}
                        action={
                            search ? (
                                <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                                    {t("common.clear")}
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => void refetch()}>
                                    {t("common.refresh")}
                                </Button>
                            )
                        }
                    />
                </div>
            ) : view === "table" ? (
                <div className="overflow-hidden rounded-lg border border-rule bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-caption">
                            <thead className="border-b border-rule bg-wash text-left text-ink-soft">
                                <tr>
                                    <th scope="col" className="px-3 py-1.5 text-right font-medium">#</th>
                                    <th scope="col" className="whitespace-nowrap px-3 py-1.5 font-medium">
                                        {t("common.from")} → {t("common.to")}
                                    </th>
                                    <th scope="col" className="hidden px-3 py-1.5 font-medium md:table-cell">{t("requests.requested")}</th>
                                    <th scope="col" className="hidden px-3 py-1.5 font-medium sm:table-cell">{t("requests.checker")}</th>
                                    <th scope="col" className="hidden px-3 py-1.5 font-medium sm:table-cell">{t("requests.approver")}</th>
                                    <th scope="col" className="px-3 py-1.5 font-medium">{t("common.status")}</th>
                                    <th scope="col" className="w-px px-3 py-1.5">
                                        <span className="sr-only">{t("common.actions")}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-rule/60">
                                {filtered_requests.map((row) => {
                                    const overall = overallTone(row);
                                    return (
                                        <tr key={row.request_id} className="leading-[19px] text-ink transition-colors hover:bg-wash/60">
                                            <td className="figure whitespace-nowrap px-3 py-1 text-right text-ink-soft">{row.request_id}</td>
                                            <td className="px-3 py-1">
                                                <span className="whitespace-nowrap font-medium">
                                                    {row.sender_name} → {row.receiver_name}
                                                </span>
                                                {row.reason && (
                                                    <span className="ml-2 text-ink-soft" title={row.reason}>· {row.reason}</span>
                                                )}
                                            </td>
                                            <td className="hidden whitespace-nowrap px-3 py-1 md:table-cell">
                                                {row.display_name}
                                                <span className="figure ml-2 text-ink-soft">{datetime_format(row.request_date)}</span>
                                            </td>
                                            <td className="hidden whitespace-nowrap px-3 py-1 sm:table-cell">
                                                <Chip tone={statusTone(row.checker_status)} title={row.checker_comment || undefined}>
                                                    {DECISION_LABEL[row.checker_status] ?? row.checker_status}
                                                </Chip>
                                            </td>
                                            <td className="hidden whitespace-nowrap px-3 py-1 sm:table-cell">
                                                <Chip tone={statusTone(row.approver_status)} title={row.approver_comment || undefined}>
                                                    {DECISION_LABEL[row.approver_status] ?? row.approver_status}
                                                </Chip>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-1">
                                                <Chip tone={overall.tone}>{overall.label}</Chip>
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-1">
                                                <div className="flex items-center justify-end gap-2">{rowActions(row)}</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <RequestColumns
                    columns={[
                        { key: "requested", label: t("requests.requested") },
                        { key: "checked", label: t("requests.checked") },
                        { key: "processed", label: t("requests.processed") },
                    ]}
                    cards={cards}
                    emptyLabel={t("requests.empty")}
                />
            )}

            <Button
                className="hidden"
                ref={buttonRef}
                type="button"
                onClick={handlePrint}
            >
                Print
            </Button>

            {/* Checker Approve Or Reject */}
            <Dialog open={open_checker} onOpenChange={setOpenChecker}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>ពិនិត្យសំណើ</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label htmlFor="checker-note">បរិយាយ</Label>
                        <Input
                            id="checker-note"
                            type="text"
                            required
                            autoFocus
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={checker_saving}
                            onClick={async () => {
                                //TODO: Update To Checked
                                const res = await checkerApprove({
                                    variables: {
                                        requestId: request_id,
                                        checkerComment: description,
                                        checkerStatus: ApprovalStatus.Rejected
                                    }
                                })

                                if (res.data?.CheckTransferRequest.success) {
                                    setOpenChecker(false)
                                    refetch();
                                    Notifications("Rejected", "success")
                                    return;
                                }

                                Notifications("Failed", "error")

                            }}
                        >
                            Reject
                        </Button>
                        <Button
                            type="button"
                            variant="paid"
                            disabled={checker_saving}
                            onClick={async () => {
                                //TODO: Update To Checked
                                const res = await checkerApprove({
                                    variables: {
                                        requestId: request_id,
                                        checkerComment: description,
                                        checkerStatus: ApprovalStatus.Approved
                                    }
                                })

                                if (res.data?.CheckTransferRequest.success) {
                                    Notifications("Approved", "success")
                                    setOpenChecker(false);
                                    refetch();
                                    return;
                                }

                                Notifications("Failed", "error")

                            }}
                        >
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Admin Approve Or Reject */}
            <Dialog open={open_approver} onOpenChange={setOpenApprover}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>សម្រេចសំណើ</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label htmlFor="approver-note">បរិយាយ</Label>
                        <Input
                            id="approver-note"
                            type="text"
                            required
                            autoFocus
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={approver_saving}
                            onClick={async () => {
                                //TODO: Update To Checked
                                const res = await approveTransfer({
                                    variables: {
                                        requestId: request_id,
                                        approverComment: description,
                                        approverStatus: ApprovalStatus.Rejected
                                    }
                                })

                                if (res.data?.ApproveTransferRequest.success) {
                                    Notifications("Rejected", "success")
                                    refetch();
                                    setOpenApprover(false);
                                    return;
                                }

                                Notifications("Failed", "error")

                            }}
                        >
                            Reject
                        </Button>
                        <Button
                            type="button"
                            variant="paid"
                            disabled={approver_saving}
                            onClick={async () => {
                                //TODO: Update To Checked
                                const res = await approveTransfer({
                                    variables: {
                                        requestId: request_id,
                                        approverComment: description,
                                        approverStatus: ApprovalStatus.Approved
                                    }
                                })

                                if (res.data?.ApproveTransferRequest.success) {
                                    Notifications("Approved", "success")
                                    setOpenApprover(false);
                                    refetch();
                                    return;
                                }

                                Notifications("Failed", "error")

                            }}
                        >
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Receiptionist Print Payment */}
            {/* Closing (X/Esc/overlay included) is blocked while the mutation is
                in flight: unmounting the dialog nulls InvoiceRef, and the print
                triggered after commit would silently become a no-op. */}
            <Dialog open={open_print} onOpenChange={(open) => { if (!transfer_saving) setOpenPrint(open); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>វិក្កយបត្រ</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-x-auto rounded-lg border border-rule bg-wash p-3">
                        <TransferInvoice
                            ref={InvoiceRef}
                            invoice_detail={invoice_detail}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={transfer_saving}
                            onClick={() => setOpenPrint(false)}
                        >
                            {t("common.close")}
                        </Button>
                        <Button
                            type="button"
                            variant="commit"
                            disabled={transfer_saving}
                            onClick={() => { void ProcessTransfer(); }}
                        >
                            <Printer aria-hidden="true" />
                            {t("requests.process")} · បោះពុម្ព
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default TransferRequest
