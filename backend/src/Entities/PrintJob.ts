import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";
import { PrintDocType, PrintJobStatus } from "./enums";

/**
 * The print queue.
 *
 * Receipts are printed by the server, never by the till: a client enqueues a row
 * here naming WHAT to print (doc_type) and WHICH RECORD (ref_id), and a
 * dispatcher builds the document from the database and hands it to the print
 * worker. Clients send no layout, no text and no printer name.
 *
 * A table rather than a spool directory, mainly for `idempotency_key`: the
 * UNIQUE index on it is what stops a receipt printing twice. That matters
 * because Ticket.tsx fires a print automatically on every sale, and a retry, a
 * double-tap or a page refresh must not cost a second slip of paper.
 */
@Entity()
@ObjectType()
export class PrintJob extends BaseEntity {
    @PrimaryGeneratedColumn()
    @Field((_type) => ID)
    job_id!: number;

    @Field((_type) => PrintDocType)
    @Column({ type: "varchar", length: 32 })
    doc_type!: PrintDocType;

    /** Primary key of the record being printed (payment_id, hold_id, ...). 0 for SELF_TEST. */
    @Field()
    @Column({ type: "bigint", default: 0 })
    ref_id!: number;

    @Field()
    @Column({ type: "tinyint", default: 1 })
    copies!: number;

    /** Defaults to "<doc_type>:<ref_id>:v1". UNIQUE — this is the anti-double-print lock. */
    @Field()
    @Index({ unique: true })
    @Column({ length: 128 })
    idempotency_key!: string;

    /** Optional flat JSON of values a builder needs that are not persisted. */
    @Column({ type: "varchar", length: 2048, nullable: true })
    extra_json?: string | null;

    /** The built document, stored when the job is claimed — audit + byte-identical reprint. */
    @Column({ type: "mediumtext", nullable: true })
    payload_json?: string | null;

    @Field((_type) => PrintJobStatus)
    @Index()
    @Column({ type: "varchar", length: 16, default: PrintJobStatus.QUEUED })
    status!: PrintJobStatus;

    @Field()
    @Column({ type: "int", default: 0 })
    attempts!: number;

    @Field()
    @Column({ type: "int", default: 5 })
    max_attempts!: number;

    /** Backoff gate: the dispatcher ignores rows until this time has passed. */
    @Column({ type: "datetime", nullable: true })
    next_attempt_at?: Date | null;

    // Explicit () => String: the property type is `string | null`, and
    // type-graphql's reflection cannot infer a GraphQL type from a union.
    // tsc accepts it happily; the failure only appears at boot, as
    // NoExplicitTypeError while the schema is being built.
    @Field((_type) => String, { nullable: true })
    @Column({ type: "varchar", length: 512, nullable: true })
    last_error?: string | null;

    @Column({ type: "int", nullable: true })
    spooler_job_id?: number | null;

    @Column({ type: "int", nullable: true })
    requested_by?: number | null;

    @Field()
    @CreateDateColumn()
    created_at!: Date;

    @Column({ type: "datetime", nullable: true })
    finished_at?: Date | null;
}
