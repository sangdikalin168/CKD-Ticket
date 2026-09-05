import { useMemo, useState } from "react";
import { DateInput } from "@/components/ui/DateInput";
import { useCreateHoldRequestV2Mutation } from "../../../../generated/holdV2";
import Notifications from "../../../../components/Notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const date_format = (date_time: string | Date) => {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA");
};
// DateInput emits YYYY-MM-DD; build a local-midnight Date from it.
const parse_iso = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
};

const HoldForm = ({ open_hold, setOpenHold, customer_id, old_end, onSubmitted }: any) => {

    // setDate returns a timestamp, not a Date — wrap it back up so
    // date_format receives the type it declares.
    const [selectedDateTo, setSelectedDateTo] = useState(
        date_format(new Date(new Date().setDate(new Date().getDate() + 1)))
    );

    const handleChangeDateTo = (selectedDate: Date) => {
        if (selectedDate > new Date(selectedDateFrom)) {
            setSelectedDateTo(date_format(selectedDate));
        } else if (selectedDate < new Date(selectedDateFrom)) {
            Notifications("ថ្ងៃបញ្ចប់មិនត្រឹមត្រូវ", "error")
        }
    };

    const [selectedDateFrom, setSelectedDateFrom] = useState(
        date_format(new Date())
    );
    const handleChangeDateFrom = (selectedDate: Date) => {
        //TODO: Condition Must Bigger Than Present
        //TODO: Compare End Date Between Present
        const currentDate = new Date();
        if (date_format(selectedDate) >= date_format(currentDate)) {
            setSelectedDateFrom(date_format(selectedDate));
        } else if (date_format(selectedDate) < date_format(currentDate)) {
            Notifications("ថ្ងៃចាប់ផ្តើមមិនត្រឹមត្រូវ", "error")
            console.log(date_format(selectedDate), date_format(currentDate));
        }
    };

    const [reason, setReason] = useState("")

    // Inclusive hold length — matches ProcessHoldV2's
    // DATEDIFF(to_date, from_date) + 1, so the member is told the same number
    // the server will actually add.
    const holdDays = useMemo(() => {
        const from = new Date(selectedDateFrom);
        const to = new Date(selectedDateTo);
        const ms = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
                 - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
        return Math.floor(ms / 86400000) + 1;
    }, [selectedDateFrom, selectedDateTo]);

    const [createHoldRequest, { loading: submitting }] = useCreateHoldRequestV2Mutation();

    // No new_end here any more. v1 computed it in the browser from *today*
    // rather than from from_date, which minted free membership days, and the
    // value went stale if the member renewed before the hold was processed.
    // ProcessHoldV2 now derives it server-side at processing time.
    const HandleCreateHoldRequest = async () => {
        if (reason.trim() === "") {
            Notifications("សូមបញ្ចូលមូលហេតុ", "error")
            return;
        }
        if (submitting) return;   // guard the double-click

        const res = await createHoldRequest({
            variables: {
                customerId: customer_id,
                reason: reason,
                fromDate: selectedDateFrom,
                toDate: selectedDateTo,
            }
        })
        // The server answers with a real reason on refusal (already has a live
        // request, bad dates), so surface its message rather than a generic one.
        if (res.data?.CreateHoldRequestV2.success) {
            Notifications("ជោគជ័យ", "success")
            setOpenHold(false)
            onSubmitted?.()   // let the profile re-check the live-request gate
            return;
        }
        Notifications(res.data?.CreateHoldRequestV2.message ?? "បរាជ័យ", "error")
    }

    return (
        <Dialog open={open_hold} onOpenChange={setOpenHold}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>សុំច្បាប់ (ផ្អាកសមាជិកភាព)</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="hold-reason">មូលហេតុនៃការសុំច្បាប់</Label>
                        <Input
                            id="hold-reason"
                            type="text"
                            required
                            autoFocus
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="hold-from">ចាប់ពីថ្ងៃ</Label>
                        <DateInput
                            id="hold-from"
                            name="from_date"
                            value={selectedDateFrom}
                            onChange={(e) => {
                                if (e.target.value) handleChangeDateFrom(parse_iso(e.target.value));
                            }}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="hold-to">ដល់ថ្ងៃទី</Label>
                        <DateInput
                            id="hold-to"
                            name="to_date"
                            value={selectedDateTo}
                            onChange={(e) => {
                                if (e.target.value) handleChangeDateTo(parse_iso(e.target.value));
                            }}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="hold-old-end">សុពលភាពចាស់</Label>
                        <Input id="hold-old-end" className="figure" type="text" readOnly value={old_end ?? ""} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="hold-days">ចំនួនថ្ងៃសុំច្បាប់</Label>
                        <Input
                            id="hold-days"
                            type="text"
                            readOnly
                            className="figure font-semibold"
                            value={holdDays > 0 ? `${holdDays} ថ្ងៃ` : ""}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setOpenHold(false);
                        }}
                    >
                        បោះបង់
                    </Button>
                    <Button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                            HandleCreateHoldRequest()
                        }}
                    >
                        ដាក់ការស្នើរសុំ
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )

}
export default HoldForm
