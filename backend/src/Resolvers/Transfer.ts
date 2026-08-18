import { Customer } from "../Entities/Customer";
import { Transfer } from "../Entities/Transfer";
import { TransferRequest } from "../Entities/TransferRequest";
import { Users } from "../Entities/Users";
import { ApprovalStatus, ProcessStatus } from "../Entities/enums";
import { extendMembershipEntitlement } from "../Utils/access";
import { Arg, Ctx, Field, Float, InterfaceType, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { checkAuth } from "../MiddleWare/checkAuth";
import { Context } from "../Context/Context";

/**
 * Membership transfers, rewritten after a production incident.
 *
 * The old resolver executed any request in any state any number of times
 * (request 1: nine times), trusted the browser for the new membership dates
 * (persisting '0000-00-00' twice), took every actor id from client arguments,
 * and stamped reviews with a NOW constant frozen at server boot.
 *
 * Rules now:
 * - Every actor comes from the verified JWT. No mutation accepts a user id.
 * - Every state transition is ONE guarded UPDATE whose WHERE encodes its own
 *   precondition; affected !== 1 means "someone else got there first", which
 *   is reported, not retried.
 * - Execution is a single transaction: claim the request, lock both customers,
 *   compute the dates server-side from the locked rows, write everything.
 *   Any failure rolls the whole thing back.
 * - Dates are computed HERE, from the customers' CURRENT end dates — never
 *   accepted from the client, never from a stale request-time snapshot.
 */

@InterfaceType()
export abstract class TransferResponse {
    @Field()
    code: number;

    @Field()
    success: boolean;

    @Field({ nullable: true })
    message?: string;

    @Field({ nullable: true })
    transfer_id?: number;
}

@ObjectType({ implements: TransferResponse })
export class TransferMutationResponse implements TransferResponse {
    code: number;
    success: boolean;
    message?: string;
    transfer_id?: number;
}

@ObjectType()
export class TransferJoin extends TransferRequest {
    @Field()
    display_name: string;

    @Field()
    sender_name: string;

    @Field()
    sender_phone: string;

    @Field()
    sender_old_end: string;

    @Field()
    receiver_name: string;

    @Field()
    receiver_phone: string;

    @Field()
    receiver_old_end: string;

    @Field({ nullable: true })
    checker_name: string;

    @Field({ nullable: true })
    approver_name: string;

    @Field({ nullable: true })
    processed_name: string;
}

/** Start of today, as YYYY-MM-DD (matches the DATE columns in play). */
function todayYMD(): string {
    return new Date().toLocaleDateString("fr-CA");
}

/** Whole days from today until `ymd` (negative when already past). */
function daysFromToday(ymd: string): number {
    const today = new Date(todayYMD());
    const end = new Date(ymd);
    return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

function addDays(ymd: string, days: number): string {
    const d = new Date(ymd);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("fr-CA");
}

/** Server-side role gate. The JWT carries only user_id, so the role is read
 *  from the users table — a localStorage string on the client is not a
 *  permission system. */
async function requireRole(userId: number, roles: string[]): Promise<Users> {
    const user = await Users.findOne({ where: { user_id: userId } });
    if (!user || !roles.includes(user.role)) {
        throw new Error("អ្នកមិនមានសិទ្ធិទេ (insufficient role)");
    }
    return user;
}

@Resolver()
export class TransferResolver {

    @UseMiddleware(checkAuth)
    @Query((_return) => [TransferJoin])
    async TransferRequests() {
        // LEFT JOIN on customers as well as users: sender/receiver deletion is
        // now blocked by FKs, but historical rows (requests 1 & 2) already
        // reference a deleted customer and must not vanish from this list.
        const result = await TransferRequest.query(`
        SELECT request_id,request_by,users.display_name,request_date,reason,
        sender_id,sender.customer_name as sender_name, sender.phone as sender_phone,sender.end_membership_date as sender_old_end,
        receiver_id,receiver.customer_name as receiver_name, receiver.phone as receiver_phone,receiver.end_membership_date as receiver_old_end,
        checker_comment,checked_date,checker_status,checked_by,checker.display_name as checker_name,
        approver_comment,approved_date,approver_status,approved_by,approver.display_name as approver_name,
        processed_by,procced.display_name as processed_name,process,processed_date
        FROM transfer_request tr
        LEFT JOIN users ON users.user_id = request_by
        LEFT JOIN users procced ON tr.processed_by = procced.user_id
        LEFT JOIN users checker ON tr.checked_by = checker.user_id
        LEFT JOIN users approver ON tr.approved_by = approver.user_id
        LEFT JOIN customer sender ON tr.sender_id = sender.customer_id
        LEFT JOIN customer receiver ON tr.receiver_id = receiver.customer_id;
        `);
        return JSON.parse(JSON.stringify(result));
    }

    @UseMiddleware(checkAuth)
    @Mutation((_return) => TransferMutationResponse)
    async CreateTransferRequest(
        @Arg("sender_id") sender_id: number,
        @Arg("receiver_id") receiver_id: number,
        @Arg("reason") reason: string,
        @Ctx() { user }: Context
    ): Promise<TransferMutationResponse> {
        if (sender_id === receiver_id) {
            return { code: 400, success: false, message: "Sender and receiver are the same customer" };
        }

        // FKs would reject unknown ids anyway; checking first gives a message
        // instead of a constraint error.
        const [sender, receiver] = await Promise.all([
            Customer.findOne({ where: { customer_id: sender_id } }),
            Customer.findOne({ where: { customer_id: receiver_id } }),
        ]);
        if (!sender) return { code: 404, success: false, message: "Sender not found" };
        if (!receiver) return { code: 404, success: false, message: "Receiver not found" };

        await TransferRequest.create({
            request_by: user.user_id,
            reason,
            sender_id,
            receiver_id,
        }).save();

        return { code: 200, success: true, message: "Create Success" };
    }

    @UseMiddleware(checkAuth)
    @Mutation((_return) => TransferMutationResponse)
    async CheckTransferRequest(
        @Arg("request_id") request_id: number,
        @Arg("checker_comment") checker_comment: string,
        @Arg("checker_status", (_type) => ApprovalStatus) checker_status: ApprovalStatus,
        @Ctx() { user }: Context
    ): Promise<TransferMutationResponse> {
        if (checker_status === ApprovalStatus.Pending) {
            return { code: 400, success: false, message: "A review cannot set the status back to Pending" };
        }
        await requireRole(user.user_id, ["Admin", "Checker"]);

        // Guarded transition: only an unreviewed request can be reviewed, and
        // the evidence (who/when) is stamped in the same statement.
        const result = await TransferRequest.createQueryBuilder()
            .update()
            .set({
                checker_status,
                checker_comment,
                checked_by: user.user_id,
                checked_date: () => "NOW()",
            })
            .where("request_id = :id AND checker_status = :pending", {
                id: request_id,
                pending: ApprovalStatus.Pending,
            })
            .execute();

        if (result.affected !== 1) {
            return { code: 409, success: false, message: "Request not found or already reviewed" };
        }
        return { code: 200, success: true, message: "Success" };
    }

    @UseMiddleware(checkAuth)
    @Mutation((_return) => TransferMutationResponse)
    async ApproveTransferRequest(
        @Arg("request_id") request_id: number,
        @Arg("approver_comment") approver_comment: string,
        @Arg("approver_status", (_type) => ApprovalStatus) approver_status: ApprovalStatus,
        @Ctx() { user }: Context
    ): Promise<TransferMutationResponse> {
        if (approver_status === ApprovalStatus.Pending) {
            return { code: 400, success: false, message: "A review cannot set the status back to Pending" };
        }
        await requireRole(user.user_id, ["Admin"]);

        // Reachable only after the checker approved — the same rule the DB
        // CHECK enforces; encoding it here turns a constraint violation into
        // an orderly message.
        const result = await TransferRequest.createQueryBuilder()
            .update()
            .set({
                approver_status,
                approver_comment,
                approved_by: user.user_id,
                approved_date: () => "NOW()",
            })
            .where(
                "request_id = :id AND checker_status = :checked AND approver_status = :pending",
                { id: request_id, checked: ApprovalStatus.Approved, pending: ApprovalStatus.Pending }
            )
            .execute();

        if (result.affected !== 1) {
            return { code: 409, success: false, message: "Request not checker-approved yet, or already decided" };
        }
        return { code: 200, success: true, message: "Success" };
    }

    /**
     * Execute an approved transfer. Takes ONLY the request id — everything
     * else (parties, dates, remaining days) is derived inside the transaction
     * from rows locked FOR UPDATE.
     */
    @UseMiddleware(checkAuth)
    @Mutation((_return) => TransferMutationResponse)
    async CreateTransfer(
        @Arg("request_id") request_id: number,
        @Arg("fee", (_type) => Float, { defaultValue: 0 }) fee: number,
        @Ctx() { user }: Context
    ): Promise<TransferMutationResponse> {
        await requireRole(user.user_id, ["Admin"]);

        try {
            const transferId = await TransferRequest.getRepository().manager.transaction(
                async (mgr) => {
                    // 1. Claim. The WHERE is the entire legal-state check, and
                    // the row lock it takes serialises concurrent executors:
                    // exactly one caller sees affected === 1. This is what
                    // makes the nine-executions incident structurally
                    // impossible, alongside the UNIQUE key on
                    // transfer.request_id as the second, independent lock.
                    const claim = await mgr
                        .createQueryBuilder()
                        .update(TransferRequest)
                        .set({
                            process: ProcessStatus.Done,
                            processed_by: user.user_id,
                            processed_date: () => "NOW()",
                        })
                        .where(
                            "request_id = :id AND checker_status = :a AND approver_status = :a AND process = :p",
                            { id: request_id, a: ApprovalStatus.Approved, p: ProcessStatus.Pending }
                        )
                        .execute();
                    if (claim.affected !== 1) {
                        throw new Error("Request is not approved, does not exist, or was already executed");
                    }

                    const request = await mgr.findOneOrFail(TransferRequest, {
                        where: { request_id },
                    });

                    // 2. Lock both customers, in id order so two transfers
                    // touching the same pair cannot deadlock.
                    const [firstId, secondId] = [request.sender_id, request.receiver_id].sort((a, b) => a - b);
                    const locked = new Map<number, Customer>();
                    for (const id of [firstId, secondId]) {
                        const row = await mgr
                            .createQueryBuilder(Customer, "c")
                            .setLock("pessimistic_write")
                            .where("c.customer_id = :id", { id })
                            .getOne();
                        if (!row) throw new Error(`Customer ${id} not found`);
                        locked.set(id, row);
                    }
                    const sender = locked.get(request.sender_id)!;
                    const receiver = locked.get(request.receiver_id)!;

                    // 3. Compute the dates HERE, from the locked rows. The
                    // clamp mirrors the old frontend logic, minus its bugs: an
                    // expired sender has nothing to give, and that is now a
                    // refusal instead of a silent no-op receipt.
                    const senderOldEnd = sender.end_membership_date;
                    const receiverOldEnd = receiver.end_membership_date;
                    if (!senderOldEnd) throw new Error("Sender has no membership end date");

                    const remaining = Math.max(0, daysFromToday(senderOldEnd));
                    if (remaining === 0) {
                        throw new Error("Sender's membership has expired — no days remain to transfer");
                    }

                    const senderNewEnd = todayYMD();
                    const receiverNewEnd =
                        !receiverOldEnd || daysFromToday(receiverOldEnd) <= 0
                            ? senderOldEnd // expired receiver inherits the sender's window
                            : addDays(receiverOldEnd, remaining);

                    // 4. The forensic record. The UNIQUE on request_id makes a
                    // second insert for this request impossible even if the
                    // claim above were somehow bypassed.
                    const saved = await mgr.save(
                        mgr.create(Transfer, {
                            request_id,
                            transfer_by: user.user_id,
                            sender_id: request.sender_id,
                            sender_old_date: senderOldEnd,
                            sender_new_end: senderNewEnd,
                            receiver_id: request.receiver_id,
                            receiver_old_end: receiverOldEnd ?? senderNewEnd,
                            receiver_new_end: receiverNewEnd,
                            fee,
                        })
                    );

                    // 5. Move the dates — every write's result is checked.
                    const senderUpdate = await mgr.update(
                        Customer,
                        { customer_id: request.sender_id },
                        { end_membership_date: senderNewEnd }
                    );
                    if (senderUpdate.affected !== 1) throw new Error("Failed to update sender");

                    const receiverUpdate = await mgr.update(
                        Customer,
                        { customer_id: request.receiver_id },
                        { end_membership_date: receiverNewEnd }
                    );
                    if (receiverUpdate.affected !== 1) throw new Error("Failed to update receiver");

                    // 6. Entitlement mirror, INSIDE the transaction: the
                    // unified-model copy commits or rolls back with the legacy
                    // dates, never separately. (The old code swallowed
                    // failures here, letting the two stores diverge silently.)
                    await extendMembershipEntitlement(request.sender_id, senderNewEnd, undefined, mgr);
                    await extendMembershipEntitlement(request.receiver_id, receiverNewEnd, receiverOldEnd ?? undefined, mgr);

                    return saved.transfer_id;
                }
            );

            return { code: 200, success: true, message: "Update Member Success", transfer_id: transferId };
        } catch (err) {
            // Conflicts and validation failures are expected outcomes of the
            // guarded design — report them plainly.
            return { code: 409, success: false, message: err instanceof Error ? err.message : String(err) };
        }
    }
}
