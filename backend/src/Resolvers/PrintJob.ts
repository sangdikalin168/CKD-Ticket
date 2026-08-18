import {
    Arg,
    Ctx,
    Field,
    ID,
    InputType,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    UseMiddleware,
} from "type-graphql";
import { PrintJob } from "../Entities/PrintJob";
import { PrintDocType, PrintJobStatus } from "../Entities/enums";
import { checkAuth } from "../MiddleWare/checkAuth";
import { Context } from "../Context/Context";
import { printing } from "../Print/service";

@InputType()
class PrintJobInput {
    @Field((_type) => PrintDocType)
    doc_type!: PrintDocType;

    @Field((_type) => Int, { defaultValue: 0 })
    ref_id!: number;

    @Field((_type) => Int, { defaultValue: 1 })
    copies!: number;

    /**
     * Defaults to "<doc_type>:<ref_id>:v1". Pass your own only when a second
     * copy of the same record is genuinely wanted.
     */
    @Field((_type) => String, { nullable: true })
    idempotency_key?: string;
}

@ObjectType()
class PrintJobResponse {
    @Field()
    success!: boolean;

    @Field((_type) => ID, { nullable: true })
    job_id?: number;

    @Field((_type) => String, { nullable: true })
    message?: string;

    /** True when the key already existed, i.e. this receipt is already queued or printed. */
    @Field()
    duplicate!: boolean;
}

@ObjectType()
class PrinterStatus {
    @Field()
    worker_available!: boolean;

    @Field((_type) => String, { nullable: true })
    worker_error?: string;

    @Field((_type) => Int)
    queued!: number;

    @Field((_type) => Int)
    failed!: number;
}

@Resolver()
export class PrintJobResolver {
    /**
     * Queue a receipt. The client names a document type and a record id — never
     * layout, text, the shop name, copies of anything, or a printer.
     */
    @Mutation((_return) => PrintJobResponse)
    @UseMiddleware(checkAuth)
    async enqueuePrintJob(
        @Arg("input") input: PrintJobInput,
        @Ctx() { user }: Context
    ): Promise<PrintJobResponse> {
        const key = input.idempotency_key || `${input.doc_type}:${input.ref_id}:v1`;

        const existing = await PrintJob.findOne({ where: { idempotency_key: key } });
        if (existing) {
            // Not an error. Ticket.tsx fires a print automatically on every sale,
            // so a retry, a double-tap or a refresh lands here — returning the
            // original job is what stops a second slip coming out.
            return {
                success: true,
                duplicate: true,
                job_id: existing.job_id,
                message: `already ${existing.status}`,
            };
        }

        const job = PrintJob.create({
            doc_type: input.doc_type,
            ref_id: input.ref_id,
            copies: Math.max(1, Math.min(5, input.copies || 1)),
            idempotency_key: key,
            status: PrintJobStatus.QUEUED,
            requested_by: user?.user_id ?? null,
        });
        await job.save();

        // Print now rather than waiting for the next poll tick.
        void printing.dispatcher?.tick();

        return { success: true, duplicate: false, job_id: job.job_id };
    }

    /**
     * Diagnostic slip down the identical path a real sale takes, so "is
     * printing working?" can be answered without making a sale.
     */
    @Mutation((_return) => PrintJobResponse)
    @UseMiddleware(checkAuth)
    async printSelfTest(@Ctx() { user }: Context): Promise<PrintJobResponse> {
        const job = PrintJob.create({
            doc_type: PrintDocType.SELF_TEST,
            ref_id: 0,
            copies: 1,
            // Timestamped so a self test can always be run again.
            idempotency_key: `SELF_TEST:${Date.now()}`,
            status: PrintJobStatus.QUEUED,
            requested_by: user?.user_id ?? null,
        });
        await job.save();

        void printing.dispatcher?.tick();

        return { success: true, duplicate: false, job_id: job.job_id };
    }

    @Query((_return) => PrinterStatus)
    @UseMiddleware(checkAuth)
    async printerStatus(): Promise<PrinterStatus> {
        const [queued, failed] = await Promise.all([
            PrintJob.count({ where: { status: PrintJobStatus.QUEUED } }),
            PrintJob.count({ where: { status: PrintJobStatus.FAILED } }),
        ]);

        return {
            worker_available: printing.worker?.available ?? false,
            worker_error: printing.worker?.error ?? undefined,
            queued,
            failed,
        };
    }
}
