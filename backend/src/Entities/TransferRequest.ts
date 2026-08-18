import { BaseEntity, Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { ApprovalStatus, ProcessStatus } from "./enums";
import { Customer } from "./Customer";

/**
 * A request to move one customer's remaining membership days to another.
 *
 * Flow: filed by a Sale user -> reviewed by a checker -> approved by an
 * approver -> executed, which writes a Transfer row and moves both customers'
 * end dates. Redesigned after a production incident in which one request was
 * executed nine times (see Transfer.request_id's unique index and the guarded
 * transitions in Resolvers/Transfer.ts).
 *
 * Design rules this table now enforces IN THE DATABASE:
 * - Statuses are enums, not free text. Six legal states, not eighteen.
 * - Stage ordering is a CHECK: nothing reaches the approver before the checker
 *   approves; nothing executes before the approver approves.
 * - Event columns (who/when/comment per stage) are NULL until the stage
 *   actually happens. They used to default to 0 / CURRENT_TIMESTAMP, which
 *   made every unreviewed row carry a realistic-looking fake audit trail.
 * - sender/receiver are real FKs to customer (RESTRICT: a customer with
 *   workflow history cannot be silently deleted — request 1 & 2's sender was,
 *   which hid them from the list UI forever).
 *
 * Deliberately NOT foreign keys: the four users columns. 24 of the 37
 * historical rows reference users that have since been deleted — audit history
 * outlives staff accounts here, and destroying it to satisfy a constraint
 * would be backwards.
 */
@Entity()
@ObjectType()
// Stage ordering. MariaDB enforces CHECK from 10.2; prod is 10.4.
@Check("chk_tr_approve_after_check", `approver_status = 'Pending' OR checker_status = 'Approved'`)
@Check("chk_tr_process_after_approve", `process = 'Pending' OR approver_status = 'Approved'`)
export class TransferRequest extends BaseEntity {
    @PrimaryGeneratedColumn()
    @Field()
    request_id!: number;

    @Field()
    @Column()
    request_by!: number;

    @Field()
    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    request_date!: string;

    @Field()
    @Column()
    reason!: string;

    @Field()
    @Column()
    sender_id!: number;

    @Field()
    @Column()
    receiver_id!: number;

    // ── checker stage ─────────────────────────────────────────────────────
    @Field((_type) => ApprovalStatus)
    @Column({ type: "enum", enum: ApprovalStatus, default: ApprovalStatus.Pending })
    checker_status!: ApprovalStatus;

    @Field((_type) => Number, { nullable: true })
    @Column({ type: "int", nullable: true })
    checked_by?: number | null;

    @Field((_type) => String, { nullable: true })
    @Column({ type: "varchar", length: 255, nullable: true })
    checker_comment?: string | null;

    @Field((_type) => String, { nullable: true })
    @Column({ type: "datetime", nullable: true })
    checked_date?: string | null;

    // ── approver stage ────────────────────────────────────────────────────
    @Field((_type) => ApprovalStatus)
    @Column({ type: "enum", enum: ApprovalStatus, default: ApprovalStatus.Pending })
    approver_status!: ApprovalStatus;

    @Field((_type) => Number, { nullable: true })
    @Column({ type: "int", nullable: true })
    approved_by?: number | null;

    @Field((_type) => String, { nullable: true })
    @Column({ type: "varchar", length: 255, nullable: true })
    approver_comment?: string | null;

    @Field((_type) => String, { nullable: true })
    @Column({ type: "datetime", nullable: true })
    approved_date?: string | null;

    // ── execution stage ───────────────────────────────────────────────────
    @Field((_type) => ProcessStatus)
    @Index()
    @Column({ type: "enum", enum: ProcessStatus, default: ProcessStatus.Pending })
    process!: ProcessStatus;

    @Field((_type) => Number, { nullable: true })
    @Column({ type: "int", nullable: true })
    processed_by?: number | null;

    /** Execution previously recorded no timestamp at all. */
    @Field((_type) => String, { nullable: true })
    @Column({ type: "datetime", nullable: true })
    processed_date?: string | null;

    // DB-only FK relations (no @Field).
    @ManyToOne(() => Customer, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "sender_id" })
    sender!: Customer;

    @ManyToOne(() => Customer, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "receiver_id" })
    receiver!: Customer;
}
