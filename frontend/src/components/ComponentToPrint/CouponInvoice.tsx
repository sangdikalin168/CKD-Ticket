import React from "react";

// The slip is paper: layout stays; the faces are named explicitly so the HTML the
// desktop shell prints carries the same Roboto + Nokora pairing as the screen.
const SLIP_FONT = { fontFamily: "'Roboto', 'Nokora', sans-serif" } as const;


// https://reactjs.org/docs/refs-and-the-dom.html#refs-and-function-components
export interface CouponInvoiceProps {
    invoice_id?: number | string | null;
    payment_date?: string | null;
    cashier?: string | null;
    c_name?: string | null;
    phone?: string | null;
    promotion?: string | null;
    price?: number | string | null;
}

export const CouponInvoice = React.forwardRef<HTMLDivElement, CouponInvoiceProps>((props, ref) => {
    return (
        <div ref={ref} style={SLIP_FONT} className="w-[405px] left-0 top-0 z-10 justify-center content-center overflow-auto border-2 border-black">
            <div className="text-center pt-3">
                <p className="text-lg font-semibold text-black">មិង ហួរក្លឹបហាត់ប្រាណ & អាងហែលទឹក</p>
                <p className="text-lg font-semibold text-black">(សាខាចំការដូង)</p>
                <p className="text-lg font-semibold text-black">បង្កាន់ដៃបង់ប្រាក់</p>
            </div>

            <div className="text-lg font-semibold text-black">
                លេខ: <strong >{props.invoice_id}</strong>
            </div>
            <div className="flex text-xs">
                <p className="text-lg font-semibold text-black mr-4">ថ្ងៃបង់ប្រាក់: {props.payment_date}</p>
                <p className="text-lg font-semibold text-black" id="print_cashier">បេឡាក: {props.cashier}</p>
            </div>

            <div className="flex text-xs">
                <p className="text-lg font-semibold text-black mr-4" id="customer">អតិថិជន: {props.c_name}</p>
                <p className="text-lg font-semibold text-black" id="phone_number">លេខទូរស័ព្ទ: {props.phone}</p>
            </div>

            <div>
                <table className="w-full text-lg font-semibold text-black">
                    <thead className="bg-black ">
                        <tr className="text-white">
                            <th className="py-1 w-1/12 text-center">#</th>
                            <th className="py-1 text-left">បរិយាយ</th>
                            <th className="py-1 w-1/12 text-center">ចំនួន</th>
                            <th className="py-1 w-2/12 text-right">តម្លៃ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="text-center">1</td>
                            <td className="text-left">{props.promotion}</td>
                            <td className="text-center">1</td>
                            <td className="text-right">{props.price}$</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <hr className="my-2 bg-black h-[2px]" />
            <div>
                <div className="flex text-lg text-black font-semibold">
                    <div className="flex-grow">សរុបទឹកប្រាក់</div>
                    <div>{props.price}$</div>
                </div>
                <hr className="my-2 bg-black h-[2px]" />
            </div>
            <div className="text-center">
                <p className="text-lg font-semibold text-black">សូមអរគុណ!</p>
                <p className="text-lg font-semibold text-black">012 558 789 / 070 239 789</p>
                <p className="text-lg font-semibold text-black">អាសយដ្ឋានលេខៈ 81AE0E1 ផ្លូវ40D សង្កាត់ដង្កោ</p>
                <p className="text-lg font-semibold text-black">ខណ្ឌដង្កោ រាជធានីភ្នំពេញ</p>
            </div>
        </div>
    );
});