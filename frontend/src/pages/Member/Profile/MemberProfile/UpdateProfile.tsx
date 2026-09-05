import { useState } from "react";
import {
    useUpdateCustomerMutation,
} from "../../../../generated/graphql";

import { TypeOptions, toast } from "react-toastify";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";


const notify = (
    message: string,
    auto_Close: boolean | number,
    toastType: TypeOptions
) => {
    if (!toast.isActive("alert")) {
        toast(message, {
            autoClose: auto_Close ? 1500 : false,
            toastId: "alert",
            type: toastType,
        });
    }
};


export const UpdateProfile = (props) => {

    const [phone, setPhone] = useState("");

    const [updateCustomer] = useUpdateCustomerMutation();
    const handleSubmit = async (event: any) => {
        event.preventDefault();
        const result = await updateCustomer({
            variables: {
                phone: phone,
                customerId: props.customer_id
            },
        });

        if (result.data?.UpdateCustomer.success) {
            notify("Success", true, "success");
            props.refetch();
            props.setOpen(false);
            return;
        }
        notify("Failed: " + result.data?.UpdateCustomer.message, 5000, "error");
        props.setOpen(false);
        props.refetch();

    };
    return (
        <Dialog open={props.open} onOpenChange={props.setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>កែលេខទូរស័ព្ទ</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="update_form" className="space-y-1.5">
                    <Label htmlFor="update-phone">លេខទូរស័ព្ទថ្មី</Label>
                    <Input
                        id="update-phone"
                        type="text"
                        inputMode="tel"
                        required
                        autoFocus
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </form>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            props.setOpen(false);
                        }}
                    >
                        បោះបង់
                    </Button>
                    <Button
                        type="submit"
                        form="update_form"
                    >
                        យល់ព្រម
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
