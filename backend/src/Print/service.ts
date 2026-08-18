import { PRINT_WORKER_EXE } from "../Utils/paths";
import { PrintDispatcher } from "./dispatcher";
import { PrintWorker } from "./worker";

/**
 * Process-wide handles for the print subsystem.
 *
 * Deliberately failure-tolerant: if the worker binary is missing or will not
 * start, the backend still boots and serves everything else, and print jobs
 * simply sit in the queue until it comes back. A gym that cannot print is
 * inconvenienced; a gym whose API will not start is closed.
 */
export const printing: {
    worker: PrintWorker | null;
    dispatcher: PrintDispatcher | null;
} = {
    worker: null,
    dispatcher: null,
};

export function startPrinting(): void {
    if (printing.worker) return;

    // PRINT_WORKER_ARGS lets development point at python.exe with
    // ["-m","ckd_print"]; production needs no arguments.
    const args = process.env.PRINT_WORKER_ARGS
        ? JSON.parse(process.env.PRINT_WORKER_ARGS)
        : [];
    const worker = new PrintWorker(PRINT_WORKER_EXE, args);
    worker.start();

    const dispatcher = new PrintDispatcher(worker);
    dispatcher.start();

    printing.worker = worker;
    printing.dispatcher = dispatcher;
}

export function stopPrinting(): void {
    printing.dispatcher?.stop();
    printing.worker?.stop();
    printing.worker = null;
    printing.dispatcher = null;
}
