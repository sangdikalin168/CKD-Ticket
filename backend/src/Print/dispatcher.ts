import { IsNull, LessThanOrEqual } from "typeorm";
import { PrintJob } from "../Entities/PrintJob";
import { PrintJobStatus } from "../Entities/enums";
import { builders } from "./documents";
import { PrintWorker } from "./worker";

/**
 * Drains the print queue, one job at a time.
 *
 * Single-flight on purpose: it makes ordering, retry and spooler serialisation
 * free, and at ticket-counter volumes there is no throughput problem to solve.
 *
 * Backoff is deliberately short at the start. A receipt that arrives four
 * minutes late is often worse than one that never arrives, because by then the
 * customer has walked away — so early retries are quick and the cap is low.
 */
const BACKOFF_MS = [2_000, 5_000, 15_000, 60_000, 120_000];
const POLL_MS = 2_000;

export class PrintDispatcher {
    private timer: NodeJS.Timeout | null = null;
    private running = false;
    private busy = false;

    constructor(private readonly worker: PrintWorker) {}

    start(): void {
        if (this.running) return;
        this.running = true;
        this.timer = setInterval(() => void this.tick(), POLL_MS);
        console.log("[print] dispatcher started");
    }

    stop(): void {
        this.running = false;
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    }

    async tick(): Promise<void> {
        if (this.busy || !this.running) return;
        this.busy = true;
        try {
            await this.drainOne();
        } catch (err) {
            console.error("[print] dispatcher error:", err);
        } finally {
            this.busy = false;
        }
    }

    private async drainOne(): Promise<void> {
        const now = new Date();

        // Oldest eligible job. A row still waiting on backoff is skipped rather
        // than blocked on, so one sick job cannot stall everything behind it.
        const job = await PrintJob.findOne({
            where: [
                { status: PrintJobStatus.QUEUED, next_attempt_at: IsNull() },
                { status: PrintJobStatus.QUEUED, next_attempt_at: LessThanOrEqual(now) },
            ],
            order: { job_id: "ASC" },
        });
        if (!job) return;

        if (!this.worker.available) return; // try again next tick

        job.status = PrintJobStatus.PRINTING;
        job.attempts += 1;
        await job.save();

        const builder = builders[job.doc_type];
        if (!builder) {
            await this.fail(job, `no builder registered for ${job.doc_type}`, false);
            return;
        }

        let doc;
        try {
            const extra = job.extra_json ? JSON.parse(job.extra_json) : {};
            doc = await builder(Number(job.ref_id), extra);
        } catch (err) {
            // Missing or malformed data will not fix itself on a retry.
            await this.fail(job, `build failed: ${err}`, false);
            return;
        }

        // Kept for audit and for a byte-identical reprint later.
        job.payload_json = JSON.stringify(doc);

        const result = await this.worker.print({
            job_id: job.job_id,
            copies: job.copies,
            doc,
        });

        if (result.ok) {
            job.status = PrintJobStatus.DONE;
            job.finished_at = new Date();
            job.last_error = null;
            job.spooler_job_id = result.spooler_job_id ?? null;
            await job.save();
            console.log(`[print] job ${job.job_id} (${job.doc_type}) printed`);
            return;
        }

        await this.fail(job, result.error ?? "unknown worker error", result.retryable !== false);
    }

    private async fail(job: PrintJob, error: string, retryable: boolean): Promise<void> {
        job.last_error = error.slice(0, 500);

        if (!retryable || job.attempts >= job.max_attempts) {
            job.status = PrintJobStatus.FAILED;
            job.finished_at = new Date();
            console.error(
                `[print] job ${job.job_id} FAILED after ${job.attempts} attempt(s): ${error}`
            );
        } else {
            const delay = BACKOFF_MS[Math.min(job.attempts - 1, BACKOFF_MS.length - 1)];
            job.status = PrintJobStatus.QUEUED;
            job.next_attempt_at = new Date(Date.now() + delay);
            console.warn(
                `[print] job ${job.job_id} attempt ${job.attempts} failed (${error}); retrying in ${delay}ms`
            );
        }
        await job.save();
    }
}
