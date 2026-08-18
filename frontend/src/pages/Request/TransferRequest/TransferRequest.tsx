import { DataTable } from '@/components/ui/DataTable';
import type { ColumnDef } from '@/types/datatable';
import LoadingPage from '../../../components/LoadingPage/LoadingPage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApproveTransferRequestMutation, useCheckTransferRequestMutation, useCreateTransferMutation, useTransferRequestsQuery } from '../../../generated/graphql';
import Notifications from '../../../components/Notification';
import { PrinterIcon } from '@heroicons/react/20/solid';
import { useReactToPrint } from 'react-to-print';
import { TransferInvoice } from '../../../components/ComponentToPrint/TransferInvoice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type TransferRequest = {
    request_id: number
    request_by: number
    request_date: string
    reason: string
    sender_id: number
    sender_phone: string
    sender_old_end: string
    receiver_id: number
    checked_by: number
    checker_comment: string
    checked_date: string
    checker_status: string
    approved_by: number
    approver_comment: string
    approved_date: string
    approver_status: string
    process: string
    processed_by: number
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

const TransferRequest = () => {
    // Memoised: this 200-line literal used to be rebuilt on every keystroke.
    // The closures only touch useState setters (stable) and pure helpers, so
    // empty deps are safe.
    const columns: ColumnDef<TransferRequest>[] = useMemo(() => [
        {
            key: 'display_name',
            header: 'អ្នកស្នើ',
            sortable: true,
        },
        {
            key: 'request_date',
            header: 'ថ្ងៃស្នើ',
            sortable: true,
            // accessor feeds export/copy/print so the spreadsheet matches the
            // cell. Sorting does NOT use it — the string carries a 12-hour clock
            // ('09:05 AM' / '02:05 PM'), which string-compares out of order, so
            // the comparator below sorts this column on the raw timestamp.
            accessor: (row) => datetime_format(row.request_date),
            render: (row) => datetime_format(row.request_date),
        },
        {
            // The click handlers HoldRequest has here were never ported (they
            // referenced hooks this file does not declare), so these are plain
            // text columns until a customer-detail dialog actually exists.
            key: 'sender_name',
            header: 'ពីឈ្មោះ',
            sortable: true,
        },
        {
            key: 'receiver_name',
            header: 'ទៅឈ្មោះ',
            sortable: true,
        },
        {
            key: 'reason',
            header: 'មូលហេតុ',
            sortable: true,
        },
        {
            key: 'checker_name',
            header: 'អ្នកពិនិត្យ',
            sortable: true,
            // Sort/export mirror the rendered status — the raw checker_name is
            // NULL for exactly the Pending rows a sorter is trying to group.
            accessor: (row) => row.checker_status,
            render: (row) => (
                <>
                    {
                        row.checker_status === "Pending" ?
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-red-600"
                                onClick={() => {
                                    HandleCheckerApprove();
                                    setRequestID(row.request_id)
                                }}
                            >
                                Action
                            </Button>
                            :
                            <>
                                {
                                    row.checker_status === "Approved" ?
                                        <div className="group">
                                            <strong className="text-green-500 visible group-hover:invisible">Approved</strong>
                                            <strong className="text-green-500 invisible group-hover:visible">{row.checker_comment}</strong>
                                        </div>
                                        :
                                        <div className="group">
                                            <strong className="text-red-500 visible group-hover:invisible">Rejected</strong>
                                            <strong className="text-red-500 invisible group-hover:visible">{row.checker_comment}</strong>
                                        </div>
                                }
                            </>

                    }
                </>

            ),
        },
        {
            key: 'approver_name',
            header: 'អ្នកសម្រេច',
            sortable: true,
            accessor: (row) => row.approver_status,
            render: (row) => (
                <>
                    {
                        row.approver_status === "Pending" ?
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-red-600"
                                onClick={() => {
                                    CheckApproverRole();
                                    setRequestID(row.request_id)
                                }}
                            >
                                Action
                            </Button>
                            :
                            <>
                                {
                                    row.approver_status === "Approved" ?
                                        <div className="group">
                                            <strong className="text-green-500 visible group-hover:invisible">Approved</strong>
                                            <strong className="text-green-500 invisible group-hover:visible">{row.approver_comment}</strong>
                                        </div>
                                        :
                                        <div className="group">
                                            <strong className="text-red-500 visible group-hover:invisible">Rejected</strong>
                                            <strong className="text-red-500 invisible group-hover:visible">{row.approver_comment}</strong>
                                        </div>
                                }
                            </>

                    }
                </>

            ),
        },
        {
            key: 'process',
            header: 'Process',
            sortable: true,
            // accessor is what export/copy/print emit and what sorting compares —
            // it must mirror the rendered state, not the request id.
            accessor: (row) =>
                row.checker_status === "Approved" && row.approver_status === "Approved"
                    ? (row.processed_by === 0 ? "" : row.processed_name)
                    : "Pending",
            render: (row_data) => (
                <div className="flex">
                    {
                        row_data.checker_status === "Approved" && row_data.approver_status === "Approved" ?
                            <>
                                {
                                    row_data.processed_by === 0 ?
                                        <span className="hidden sm:block">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
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
                                                }}
                                            >
                                                <PrinterIcon
                                                    className="h-4 w-4 text-gray-500"
                                                    aria-hidden="true"
                                                />
                                            </Button>
                                        </span>
                                        :
                                        <p>{row_data.processed_name}</p>
                                }

                            </>
                            :
                            <>
                                {
                                    <p>Pending</p>
                                }
                            </>
                    }
                </div>
            ),
        },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], []);

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
    const buttonRef = useRef<HTMLButtonElement>(null);
    const InvoiceRef = useRef<HTMLDivElement>(null);
    // Synchronous re-entry guard: state alone can't stop a double-click that
    // lands before React re-renders, and each extra CreateTransfer inserts a
    // second transfer row server-side.
    const processingRef = useRef(false);

    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [page_size, setPageSize] = useState(20)

    const requests = useMemo(
        () => (data?.TransferRequests ?? []) as TransferRequest[],
        [data]
    );

    // The old table filtered internally; the new one only reports the search
    // term, so filter here before slicing the current page.
    const filtered_requests = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return requests;
        return requests.filter((row) =>
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
        );
    }, [requests, search]);

    // Sorting lives here, not in DataTable: the table only ever receives the
    // current page slice, so its built-in sort could only reorder ~20 rows.
    // Passing onSortChange switches it to report-only mode, and the whole
    // filtered set is sorted before slicing.
    const [sort, setSort] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    const sorted_requests = useMemo(() => {
        if (!sort.key) return filtered_requests;
        const col = columns.find((c) => c.key === sort.key);
        if (!col) return filtered_requests;
        const valueOf = (row: TransferRequest) => {
            // The date accessor exists for export formatting; its 12-hour string
            // does not compare chronologically, so sort on the real timestamp.
            if (sort.key === 'request_date') return new Date(row.request_date).getTime();
            return col.accessor ? col.accessor(row) : row[sort.key as keyof TransferRequest];
        };
        return [...filtered_requests].sort((a, b) => {
            const va = valueOf(a);
            const vb = valueOf(b);
            if (va == null && vb == null) return 0;
            if (va == null) return sort.direction === 'asc' ? -1 : 1;
            if (vb == null) return sort.direction === 'asc' ? 1 : -1;
            if (typeof va === 'number' && typeof vb === 'number') {
                return sort.direction === 'asc' ? va - vb : vb - va;
            }
            const cmp = String(va).toLowerCase().localeCompare(String(vb).toLowerCase());
            return sort.direction === 'asc' ? cmp : -cmp;
        });
    }, [filtered_requests, sort, columns]);

    const total_pages = Math.max(1, Math.ceil(sorted_requests.length / page_size));
    const paged_requests = sorted_requests.slice((page - 1) * page_size, page * page_size);

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
            const { sender_id, sender_old_end, sender_new_end, receiver_id, receiver_old_end, receiver_new_end } = invoice_detail

            // processed_by === 0 is this page's "not yet processed" sentinel (and
            // the column default server-side), so a fallback of 0 would commit the
            // transfer yet leave the row looking unprocessed — re-offering the
            // Process button. No valid user id -> refuse to attribute, abort.
            const stored_user = parseInt(localStorage.getItem("user_id") || "", 10);
            if (Number.isNaN(stored_user) || stored_user <= 0) {
                Notifications("មិនស្គាល់អ្នកប្រើប្រាស់ សូមចូលប្រើម្ដងទៀត", "error")
                return;
            }

            const { data } = await createTransfer({
                variables: {
                    requestId: request_id,
                    processedBy: stored_user,
                    receiverNewEnd: receiver_new_end,
                    receiverOldEnd: receiver_old_end,
                    receiverId: receiver_id,
                    senderNewEnd: sender_new_end,
                    senderOldDate: sender_old_end,
                    senderId: sender_id
                }
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

    return (
        <>
            {!loading ? (
                <DataTable<TransferRequest>
                    columns={columns}
                    data={paged_requests}
                    pageInfo={{
                        current_page: page,
                        page_size: page_size,
                        total_items: filtered_requests.length,
                        total_pages: total_pages,
                        has_next: page < total_pages,
                        has_previous: page > 1,
                    }}
                    currentPage={page}
                    pageSize={page_size}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                    pageSizeOptions={[10, 20, 30, 50]}
                    searchValue={search}
                    onSearchChange={(term) => {
                        setSearch(term);
                        setPage(1);
                    }}
                    onSortChange={(key, direction) => setSort({ key, direction })}
                    columnToggle
                    exportData={sorted_requests}
                    exportFileName="transfer_requests.csv"
                />
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

            {/* Checker Approve Or Reject */}
            <Dialog open={open_checker} onOpenChange={setOpenChecker}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>ពិនិត្យសំណើ</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>បរិយាយ</Label>
                        <Input
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="flex-row-reverse gap-2">
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={checker_saving}
                            onClick={async () => {
                                //TODO: Update To Checked
                                const res = await checkerApprove({
                                    variables: {
                                        checkedBy: parseInt(localStorage.getItem("user_id") || "0"),
                                        requestId: request_id,
                                        checkerComment: description,
                                        checkerStatus: "Approved"
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
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={checker_saving}
                            onClick={async () => {
                                //TODO: Update To Checked
                                const res = await checkerApprove({
                                    variables: {
                                        checkedBy: parseInt(localStorage.getItem("user_id") || "0"),
                                        requestId: request_id,
                                        checkerComment: description,
                                        checkerStatus: "Rejected"
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Admin Approve Or Reject */}
            <Dialog open={open_approver} onOpenChange={setOpenApprover}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>សម្រេចសំណើ</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>បរិយាយ</Label>
                        <Input
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="flex-row-reverse gap-2">
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={approver_saving}
                            onClick={async () => {
                                //TODO: Update To Checked
                                const res = await approveTransfer({
                                    variables: {
                                        approvedBy: parseInt(localStorage.getItem("user_id") || "0"),
                                        requestId: request_id,
                                        approverComment: description,
                                        approverStatus: "Approved"
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
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={approver_saving}
                            onClick={async () => {
                                //TODO: Update To Checked
                                const res = await approveTransfer({
                                    variables: {
                                        approvedBy: parseInt(localStorage.getItem("user_id") || "0"),
                                        requestId: request_id,
                                        approverComment: description,
                                        approverStatus: "Rejected"
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
                    <div className="mt-2">
                        <TransferInvoice
                            ref={InvoiceRef}
                            invoice_detail={invoice_detail}
                        />
                    </div>
                    <DialogFooter className="flex-row-reverse gap-2">
                        <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={transfer_saving}
                            onClick={() => { void ProcessTransfer(); }}
                        >
                            Process
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={transfer_saving}
                            onClick={() => setOpenPrint(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default TransferRequest
