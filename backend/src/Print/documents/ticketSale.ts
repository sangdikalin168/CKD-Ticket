import { TicketPayment } from "../../Entities/TicketPayment";
import { Users } from "../../Entities/Users";
import { shopProfile } from "../shopProfile";
import { ReceiptDoc } from "../types";

/**
 * Ticket-sale receipt, built from the database rather than from anything the
 * client sends.
 *
 * Mirrors what components/ComponentToPrint/index.tsx renders today: shop name,
 * branch, a QR of the ticket code (CKD-Check-In scans this), the code as text,
 * date, cashier, the price row, and the towel/locker line staff write on.
 */
export async function buildTicketSale(refId: number): Promise<ReceiptDoc> {
    const payment = await TicketPayment.findOne({ where: { payment_id: refId } });
    if (!payment) throw new Error(`ticket payment ${refId} not found`);

    const cashier = payment.user_id
        ? await Users.findOne({ where: { user_id: payment.user_id } })
        : null;

    // fr-CA gives YYYY-MM-DD, which is what the existing receipt shows.
    const when = new Date(payment.payment_date);
    const stamp = `${when.toLocaleDateString("fr-CA")} ${when
        .toTimeString()
        .slice(0, 5)}`;

    return {
        cut: true,
        blocks: [
            { type: "text", text: shopProfile.name, align: "center", px: 30 },
            { type: "text", text: shopProfile.branch, align: "center", px: 22 },
            { type: "space", dots: 10 },
            { type: "qr", data: payment.ticket_code, module_dots: 8 },
            { type: "text", text: payment.ticket_code, align: "center", px: 22 },
            { type: "space", dots: 8 },
            { type: "row", left: "ការបរិច្ចេទ:", right: stamp },
            { type: "row", left: "Cashier:", right: cashier?.display_name ?? "-" },
            { type: "rule" },
            {
                type: "row",
                left: "តម្លៃសំបុត្រ",
                right: Number(payment.price).toLocaleString("en-US"),
            },
            { type: "rule" },
            { type: "space", dots: 10 },
            { type: "text", text: "កន្សែង:.......... សោរ:.............", px: 22 },
            { type: "space", dots: 10 },
            { type: "text", text: shopProfile.footer, align: "center", px: 24 },
        ],
    };
}
