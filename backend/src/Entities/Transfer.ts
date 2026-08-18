import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { ColumnNumericTransformer } from "./enums";

/**
 * An EXECUTED membership transfer — the financial/forensic record of what a
 * TransferRequest actually did to two customers' end dates.
 *
 * Append-only: corrections are compensating rows, never edits or deletes.
 *
 * The unique index on request_id is the anti-double-execution lock. It exists
 * because production data showed request 1 executed NINE times and requests
 * 2/11/20 twice each (two pairs with identical timestamps — a double-click
 * race), each execution rewriting both customers' membership dates. The 11
 * surplus rows were moved to transfer_superseded by the guardrails migration.
 *
 * Deliberately NO customer/user FKs: this is history, and its subjects
 * (customer 1, most of the acting users) have already been deleted. A
 * constraint here could only be satisfied by destroying the record.
 */
@Entity()
@ObjectType()
export class Transfer extends BaseEntity {
    @PrimaryGeneratedColumn()
    @Field()
    transfer_id!: number;

    @Field()
    @Column()
    transfer_by!: number;

    @Field()
    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    transfer_date!: string;

    @Field()
    @Column()
    sender_id!: number;

    @Field()
    @Column({ type: "date" })
    sender_old_date!: string;

    @Field()
    @Column({ type: "date" })
    sender_new_end!: string;

    @Field()
    @Column()
    receiver_id!: number;

    @Field()
    @Column({ type: "date" })
    receiver_old_end!: string;

    @Field()
    @Column({ type: "date" })
    receiver_new_end!: string;

    /** One execution per request, enforced by the database. */
    @Field()
    @Index("uq_transfer_request", { unique: true })
    @Column()
    request_id!: number;

    /**
     * DECIMAL, not DOUBLE: money. Historically hardcoded to 1 by the resolver,
     * so sums over old rows are meaningless — real fees start at the redesign.
     */
    @Field()
    @Column({ type: "decimal", precision: 10, scale: 2, transformer: new ColumnNumericTransformer() })
    fee!: number;
}
