/**
 * The wire contract between the Node backend and the Python print worker.
 *
 * A document is a list of blocks rather than CKD-POS's flat
 * {header_lines, items, totals} shape, because CKD-Ticket's ticket receipt
 * carries a QR that CKD-Check-In scans at the door, and a flat schema has
 * nowhere to put one.
 *
 * SCHEMA_VERSION is asserted by the worker at startup. The worker is deployed
 * separately from the backend (a running .exe cannot be overwritten by a
 * deploy), so the two CAN drift — this makes that drift fail loudly instead of
 * printing something wrong.
 */
export const SCHEMA_VERSION = 1;

export type Align = "left" | "center" | "right";

export type Block =
    | { type: "text"; text: string; align?: Align; px?: number }
    | { type: "row"; left: string; right: string; px?: number }
    | { type: "rule"; thickness?: number }
    | { type: "space"; dots?: number }
    | { type: "qr"; data: string; module_dots?: number };

export interface ReceiptDoc {
    blocks: Block[];
    font?: string;
    font_px?: number;
    feed_lines?: number;
    cut?: boolean;
    /** Set when the printer ignores GS V B 3 and needs the older GS V 1. */
    cut_fallback?: boolean;
}

export interface PrintCommand {
    cmd: "print";
    job_id: number;
    schema: number;
    copies: number;
    doc: ReceiptDoc;
}

export interface WorkerResult {
    type: "result";
    job_id: number;
    ok: boolean;
    error?: string;
    retryable?: boolean;
    spooler_job_id?: number | null;
    bytes?: number;
}
