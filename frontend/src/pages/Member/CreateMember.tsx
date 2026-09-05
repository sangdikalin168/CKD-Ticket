import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { DialogFooter } from "@/components/ui/dialog";

const CreateMember = ({ setShow, onSubmit }: any) => {


    const [customer_name, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("ប្រុស");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Create the data object with the necessary information
        const data = {
            customer_name: customer_name,
            phone: phone,
            gender: gender
        };
        // Pass the data to the parent component's onSubmit function
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                <div className="space-y-1.5 sm:col-span-3">
                    <Label htmlFor="new-member-name">ឈ្មោះអតិថិជន</Label>
                    <Input
                        id="new-member-name"
                        type="text"
                        required
                        autoFocus
                        onChange={(e) => setCustomerName(e.target.value)}
                    />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                    <Label htmlFor="new-member-phone">លេខទូរស័ព្ទ</Label>
                    <Input
                        id="new-member-phone"
                        type="text"
                        inputMode="tel"
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                    <Label htmlFor="gender">ភេទ</Label>
                    <select
                        id="gender"
                        className="flex h-9 w-full rounded-md border border-rule bg-card px-3 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        defaultValue="ប្រុស"
                        onChange={(e) => setGender(e.target.value)}
                    >
                        <option value="ប្រុស">ប្រុស</option>
                        <option value="ស្រី">ស្រី</option>
                    </select>
                </div>
            </div>

            {/* The photo is taken on the member's own board once the record exists. */}
            <p className="text-caption text-ink-soft">
                រូបថត និងម្រាមដៃ ថតនៅទំព័រសមាជិកបន្ទាប់ពីរក្សាទុក។
            </p>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShow(false)}>
                    បោះបង់
                </Button>
                <Button type="submit">
                    រក្សាទុក
                </Button>
            </DialogFooter>
        </form>
    )
}

export default CreateMember
