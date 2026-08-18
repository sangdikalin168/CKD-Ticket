import { PrintDocType } from "../../Entities/enums";
import { ReceiptDoc } from "../types";
import { buildTicketSale } from "./ticketSale";
import { buildSelfTest } from "./selfTest";

export type DocumentBuilder = (refId: number, extra: Record<string, unknown>) => Promise<ReceiptDoc>;

/**
 * Only the document types with a builder can be printed. An unregistered type
 * is a permanent failure, not a retryable one — retrying it just burns the
 * job's attempt budget and delays the queue behind it.
 *
 * Builders are added one at a time as each call site is migrated off the old
 * client-side printing path.
 */
export const builders: Partial<Record<PrintDocType, DocumentBuilder>> = {
    [PrintDocType.TICKET_SALE]: (refId) => buildTicketSale(refId),
    [PrintDocType.SELF_TEST]: async () => buildSelfTest(),
};
