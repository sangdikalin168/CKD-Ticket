import { shopProfile } from "../shopProfile";
import { ReceiptDoc } from "../types";

/**
 * Diagnostic slip. Goes through the identical queue -> dispatcher -> worker ->
 * spooler path a real sale uses, so "is printing working?" can be answered
 * without making a sale or touching a customer record.
 */
export function buildSelfTest(): ReceiptDoc {
    const now = new Date();
    return {
        cut: true,
        blocks: [
            { type: "text", text: shopProfile.name, align: "center", px: 28 },
            { type: "text", text: "PRINTER SELF TEST", align: "center", px: 24 },
            { type: "space", dots: 8 },
            { type: "row", left: "time:", right: now.toISOString().slice(0, 19).replace("T", " ") },
            { type: "rule" },
            { type: "text", text: "khmer: សូមអរគុណ ក្លឹបហាត់ប្រាណ", px: 24 },
            { type: "text", text: "latin: ABC 123 5,000", px: 24 },
            { type: "space", dots: 6 },
            { type: "qr", data: "CKD-SELFTEST", module_dots: 8 },
            { type: "space", dots: 10 },
            { type: "text", text: "if you can read this, printing works", align: "center", px: 20 },
        ],
    };
}
