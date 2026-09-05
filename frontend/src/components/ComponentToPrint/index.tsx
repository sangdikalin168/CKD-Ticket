
import React from "react";
import QRCode from "react-qr-code";

// The slip is paper: layout stays; the faces are named explicitly so the HTML the
// desktop shell prints carries the same Roboto + Nokora pairing as the screen.
const SLIP_FONT = { fontFamily: "'Roboto', 'Nokora', sans-serif" } as const;


// https://reactjs.org/docs/refs-and-the-dom.html#refs-and-function-components
export interface TicketSlipProps {
    /** Ticket code, printed under the QR and encoded in it. */
    uuid: string;
    date: string;
    /** Cashier's display name. */
    name: string;
    price: number | string;
}

export const ComponentToPrint = React.forwardRef<HTMLDivElement, TicketSlipProps>((props, ref) => {
    return (
        <div ref={ref} style={SLIP_FONT}>
            <div className="w-[405px] left-0 top-0 z-10 justify-center content-center overflow-auto border-2 border-black">
                <div className="m-2">
                    <div className="text-center">
                        <p className="text-lg font-semibold text-black">មិង ហួរក្លឹបហាត់ប្រាណ & អាងហែលទឹក</p>
                        <p className="text-lg font-semibold text-black">(សាខាចំការដូង)</p>
                    </div>

                    <QRCode
                        className="w-[150px] h-[150px] ml-[220px] mt-[10px]"
                        value={props.uuid}
                    />

                    {props.uuid}
                    <p className="text-lg font-semibold text-red-500">ការបរិច្ចេទ: {props.date}</p>
                    <p className="text-lg font-semibold text-black">Cashier: {props.name}</p>
                    <div className="flex text-lg text-black font-semibold">
                        <div className="flex-grow">តម្លៃសំបុត្រ </div><strong>{props.price}</strong>
                    </div>
                    <hr className="my-2 bg-black h-[2px]" />
                    <div className="text-center">
                        <p className="text-lg font-semibold text-black">កន្សែង:.......... សោរ:.............</p>
                    </div>
                </div>
            </div>
        </div>
    );
});
