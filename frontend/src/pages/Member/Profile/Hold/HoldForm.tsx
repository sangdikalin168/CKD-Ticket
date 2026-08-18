import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useMemo, useRef, useState } from "react";
import { DateTimePicker } from "../../../../components/DateTimePicker/DateTimePicker";
import { useCreateHoldRequestV2Mutation } from "../../../../generated/holdV2";
import Notifications from "../../../../components/Notification";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const date_format = (date_time: string | Date) => {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA");
};

const HoldForm = ({ open_hold, setOpenHold, customer_id, old_end, onSubmitted }: any) => {

    const cancelButtonRef = useRef(null);
    const [showDateTo, setShowDateTo] = useState(false);

    const handleCloseDateTo = (state: boolean) => {
        setShowDateTo(state);
    };
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

    const [showDateFrom, setShowDateFrom] = useState<boolean>(false);
    const handleCloseDateFrom = (state: boolean) => {
        setShowDateFrom(state);
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
        <Transition.Root show={open_hold} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-10"
                initialFocus={cancelButtonRef}
                onClose={setOpenHold}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="">
                                        <div className="mt-3">
                                            <div className="grid grid-cols-1 gap-x-2 gap-y-2 sm:grid-cols-6">

                                                <div className="sm:col-span-2">
                                                    <Label className="block text-sm font-medium leading-6 text-gray-900">
                                                        មូលហេតុនៃការសុំច្បាប់
                                                    </Label>
                                                    <div className="mt-2">
                                                        <Input
                                                            type="text"
                                                            required
                                                            onChange={(e) => setReason(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* DateTime Picker */}
                                                <div className="col-span-2 mr-1">
                                                    <Label className="mb-2 block text-sm font-medium leading-6 text-gray-900">
                                                        ចាប់ពីថ្ងៃ
                                                    </Label>

                                                    <DateTimePicker
                                                        onChange={handleChangeDateFrom}
                                                        value={selectedDateFrom}
                                                        show={showDateFrom}
                                                        setShow={handleCloseDateFrom}
                                                        classNames={"top-[-62px]"}
                                                    />
                                                </div>

                                                {/* DateTime Picker */}
                                                <div className="col-span-2">
                                                    <Label className="mb-2 block text-sm font-medium leading-6 text-gray-900">
                                                        ដល់ថ្ងៃទី
                                                    </Label>
                                                    <DateTimePicker
                                                        onChange={handleChangeDateTo}
                                                        value={selectedDateTo}
                                                        show={showDateTo}
                                                        setShow={handleCloseDateTo}
                                                        classNames={"top-[-62px]"}
                                                    />
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <Label className="block text-sm font-medium leading-6 text-gray-900">
                                                        Old End
                                                    </Label>
                                                    <div className="mt-2">
                                                        <Input
                                                            type="text"
                                                            readOnly
                                                            value={old_end}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <Label className="block text-sm font-medium leading-6 text-gray-900">
                                                        ចំនួនថ្ងៃសុំច្បាប់
                                                    </Label>
                                                    <div className="mt-2">
                                                        <Input
                                                            type="text"
                                                            readOnly
                                                            value={holdDays > 0 ? `${holdDays} ថ្ងៃ` : ""}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                                    <Button
                                        type="button"
                                        className="bg-blue-600 hover:bg-green-500 text-white"
                                        disabled={submitting}
                                        onClick={() => {
                                            HandleCreateHoldRequest()
                                        }}
                                    >
                                        ដាក់ការស្នើរសុំ
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => {
                                            setOpenHold(false);
                                        }}
                                    >
                                        បោះបង់
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )

}
export default HoldForm