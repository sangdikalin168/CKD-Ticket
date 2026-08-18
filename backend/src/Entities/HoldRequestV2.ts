import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Field, ObjectType } from "type-graphql";

/**
 * v2 of the membership-hold workflow. One status machine:
 *
 *   PENDING ──> APPROVED ──> PROCESSED
 *      │
 *      └─────> REJECTED / CANCELLED   (terminal — never in any queue)
 *
 * Rules the schema itself enforces (see migration HoldRequestV2):
 *  - at most one live (PENDING/APPROVED) request per customer (uq_one_active)
 *  - from_date <= to_date, decider != requester (CHECKs; legacy rows exempt)
 *  - every actor column is a real users FK; NULL until the action happens
 *
 * old_end/new_end are written by ProcessHold at processing time from the
 * customer's CURRENT end date — they record what processing actually did,
 * not what the browser predicted weeks earlier.
 */
export type HoldStatus = "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED" | "CANCELLED";

@Entity({ name: "hold_request_v2" })
@ObjectType()
export class HoldRequestV2 extends BaseEntity {
    @PrimaryGeneratedColumn()
    @Field()
    request_id: number;

    @Field()
    @Column()
    customer_id: number;

    @Field()
    @Column()
    requested_by: number;

    @Field()
    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    requested_at: string;

    @Field()
    @Column()
    reason: string;

    @Field()
    @Column({ type: "date" })
    from_date: string;

    @Field()
    @Column({ type: "date" })
    to_date: string;

    @Field()
    @Column({
        type: "enum",
        enum: ["PENDING", "APPROVED", "REJECTED", "PROCESSED", "CANCELLED"],
        default: "PENDING",
    })
    status: HoldStatus;

    @Field((_type) => Number, { nullable: true })
    @Column({ type: "int", nullable: true })
    decided_by: number | null;

    @Field((_type) => String, { nullable: true })
    @Column({ type: "datetime", nullable: true })
    decided_at: string | null;

    @Field((_type) => String, { nullable: true })
    @Column({ type: "varchar", length: 255, nullable: true })
    decision_note: string | null;

    @Field((_type) => Number, { nullable: true })
    @Column({ type: "int", nullable: true })
    processed_by: number | null;

    @Field((_type) => String, { nullable: true })
    @Column({ type: "datetime", nullable: true })
    processed_at: string | null;

    @Field((_type) => String, { nullable: true })
    @Column({ type: "date", nullable: true })
    old_end: string | null;

    @Field((_type) => String, { nullable: true })
    @Column({ type: "date", nullable: true })
    new_end: string | null;

    @Field()
    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    fee: string;

    @Field()
    @Column({ type: "tinyint", default: 0 })
    legacy: number;

    // active_customer is a STORED generated column owned by the database;
    // deliberately not mapped so TypeORM never tries to write it.
}
