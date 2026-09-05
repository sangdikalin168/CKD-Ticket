import { useState } from "react";
import { Search } from "lucide-react";
import Modal from "../../../../components/Modal/Modal";
import Notifications from "../../../../components/Notification";
import { useCreateTransferRequestMutation, useGetCustomerDetailLazyQuery } from "../../../../generated/graphql";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { MagnetChip } from "@/components/board/MagnetChip";

const date_format = (date_time: string | Date) => {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA");
};

const Transfer = ({ open, setOpen, sender_data }: any) => {

    const [reason, setReason] = useState("")
    const [customer_id, setCustomerID] = useState(0)
    const [show_customer, setShowCustomer] = useState(false);
    const [receiver, setReceiver] = useState()


    const [getMemberDetail] = useGetCustomerDetailLazyQuery();
    const [createTransferRequest] = useCreateTransferRequestMutation();


    const FindCustomer = async (customer_id: number) => {
        if (customer_id === "") {
            Notifications("Please Input Customer ID", "error")
            return;
        }

        const { data } = await getMemberDetail({
            variables: {
                customerId: parseInt(customer_id)
            }
        })

        if (data.GetCustomerDetail.length <= 0) {
            Notifications("Customer Not Found!!!", "error")
            return;
        }
        setShowCustomer(true)
        setReceiver(data.GetCustomerDetail[0]);

    }

    const SendRequest = async () => {
        const res = await createTransferRequest({
            variables: {
                reason: reason,
                receiverId: receiver.customer_id,
                senderId: sender_data.customer_id,
                requestBy: parseInt(localStorage.getItem("user_id") || "99"),
            }
        })

        if (res.data?.CreateTransferRequest.success) {
            Notifications("Success", "success")
            setOpen(false)
            return;
        }

        Notifications("Error", "error")
    }

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

    function ReceiverNewEnd() {
        const remain_days = countDaysBetweenDates(new Date(), new Date(receiver?.end_membership_date))
        if (remain_days <= 0) {
            return sender_data.end_membership_date
        } else {
            const sender_remain = countDaysBetweenDates(new Date(), new Date(sender_data.end_membership_date))
            return calculateNewEndDate(receiver?.end_membership_date, sender_remain)
        }
    }

    const senderRemain = sender_data ? countDaysBetweenDates(new Date(), new Date(sender_data.end_membership_date)) : 0;

    return (
        <Modal
            open={open}
            setOpen={setOpen}
            title="ផ្ទេរសុពលភាព"
            confirmLabel="ដាក់ការស្នើរសុំ"
            onConfirm={SendRequest}
            onCancel={() => { setShowCustomer(false); setCustomerID(0) }}
        >
            {
                show_customer !== true ? (
                    <form
                        className="space-y-3"
                        onSubmit={(e) => { e.preventDefault(); FindCustomer(customer_id); }}
                    >
                        <div className="space-y-1.5">
                            <Label htmlFor="transfer-receiver">Customer ID (អ្នកទទួល)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="transfer-receiver"
                                    type="number"
                                    autoFocus
                                    value={customer_id}
                                    onChange={(e) => setCustomerID(e.target.value)}
                                />
                                <Button type="submit" variant="outline">
                                    <Search aria-hidden="true" />
                                    ស្វែងរក
                                </Button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {/* Sender */}
                            <div className="rounded-lg border border-rule p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-black text-ink">អ្នកផ្ទេរ</p>
                                    <MagnetChip tone="rejected">−{senderRemain}ថ្ងៃ</MagnetChip>
                                </div>
                                <p className="mt-1 truncate text-sm text-ink">{sender_data?.customer_name}</p>
                                <dl className="mt-2 space-y-1 text-caption text-ink">
                                    <div className="flex justify-between gap-2"><dt className="text-ink-soft">សុពលភាពចាស់</dt><dd>{sender_data.end_membership_date} ({senderRemain}ថ្ងៃ)</dd></div>
                                    <div className="flex justify-between gap-2"><dt className="text-ink-soft">សុពលភាពថ្មី</dt><dd className="font-semibold">{calculateNewEndDate(sender_data.end_membership_date, -senderRemain)}</dd></div>
                                </dl>
                            </div>

                            {/* Receiver */}
                            <div className="rounded-lg border border-rule p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-black text-ink">អ្នកទទួល</p>
                                    <MagnetChip tone="done">+{senderRemain}ថ្ងៃ</MagnetChip>
                                </div>
                                <p className="mt-1 truncate text-sm text-ink">{receiver?.customer_name} · {receiver?.phone}</p>
                                <dl className="mt-2 space-y-1 text-caption text-ink">
                                    <div className="flex justify-between gap-2"><dt className="text-ink-soft">សុពលភាពចាស់</dt><dd>{receiver?.end_membership_date} ({countDaysBetweenDates(new Date(), new Date(receiver?.end_membership_date))}ថ្ងៃ)</dd></div>
                                    <div className="flex justify-between gap-2"><dt className="text-ink-soft">សុពលភាពថ្មី</dt><dd className="font-semibold">{ReceiverNewEnd()}</dd></div>
                                </dl>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="transfer-reason">មូលហេតុនៃការផ្ទេរ</Label>
                            <Input
                                id="transfer-reason"
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>
                )
            }
        </Modal>
    )
}

export default Transfer
