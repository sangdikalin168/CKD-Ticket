import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver, UseMiddleware } from "type-graphql";
import { MysqlDataSource } from "../index";
import { HoldRequestV2 } from "../Entities/HoldRequestV2";
import { Users } from "../Entities/Users";
import { extendMembershipEntitlement } from "../Utils/access";
import { checkAuth } from "../MiddleWare/checkAuth";
import { Context } from "../Context/Context";
import { emitChange } from "../Utils/changeFeed";
import { NOT_PERMITTED, hasPermission } from "../Utils/permissionCatalog";

/**
 * v2 hold workflow. Every rule the v1 resolver left to the browser is
 * enforced here or in the schema:
 *
 *  - the actor is ALWAYS context.user.user_id — never a client argument
 *  - state transitions are compare-and-set UPDATEs (`WHERE status = ...`),
 *    so a double-click or two admins produce exactly one winner
 *  - the membership extension is computed HERE, at processing time: inclusive
 *    hold length, DATEDIFF(to_date, from_date) + 1 days, added to the LATER of
 *    the customer's current end date and today (so a hold on an already-lapsed
 *    membership runs from today rather than from the date it expired)
 *  - deciding your own request is refused (the schema CHECK backs this up)
 *  - one live request per customer is the engine's job (uq_one_active);
 *    the duplicate-key error is translated into a friendly message
 */

@ObjectType()
export class HoldV2Response {
    @Field()
    code: number;

    @Field()
    success: boolean;

    @Field({ nullable: true })
    message?: string;

    @Field({ nullable: true })
    new_end?: string;
}

@ObjectType()
export class HoldRequestV2Row extends HoldRequestV2 {
    @Field()
    customer_name: string;

    @Field()
    phone: string;

    @Field({ nullable: true })
    requested_by_name?: string;

    @Field({ nullable: true })
    decided_by_name?: string;

    @Field({ nullable: true })
    processed_by_name?: string;
}

const ok = (message: string, new_end?: string): HoldV2Response =>
    ({ code: 200, success: true, message, new_end });
const fail = (message: string): HoldV2Response =>
    ({ code: 400, success: false, message });

/** DATE columns arrive as JS Date; emit a plain local YYYY-MM-DD. */
const asISODate = (v: unknown): string | undefined => {
    if (!v) return undefined;
    if (v instanceof Date) {
        const p = (n: number) => String(n).padStart(2, "0");
        return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
    }
    return String(v);
};
const isDuplicateActive = (e: unknown) =>
    e instanceof Error && /uq_one_active|ER_DUP_ENTRY|Duplicate entry/i.test(e.message);

// Workflow permissions (Utils/permissionCatalog.ts): deciding needs
// "hold.decide" (Admin by default); requesting and processing need
// "hold.request" (Sale and Admin by default).

@Resolver()
export class HoldV2Resolver {

    /** The whole ledger, newest first — names resolved via the FKs. */
    @UseMiddleware(checkAuth)
    @Query((_return) => [HoldRequestV2Row])
    async HoldRequestsV2() {
        const rows = await MysqlDataSource.query(`
            SELECT hr.*,
                   c.customer_name, c.phone,
                   ru.display_name AS requested_by_name,
                   du.display_name AS decided_by_name,
                   pu.display_name AS processed_by_name
            FROM hold_request_v2 hr
            JOIN customer c   ON c.customer_id = hr.customer_id
            JOIN users ru     ON ru.user_id = hr.requested_by
            LEFT JOIN users du ON du.user_id = hr.decided_by
            LEFT JOIN users pu ON pu.user_id = hr.processed_by
            ORDER BY hr.request_id DESC
        `);
        return JSON.parse(JSON.stringify(rows));
    }

    /** The customer's live request, if any — drives the profile-page gate. */
    @UseMiddleware(checkAuth)
    @Query((_return) => [HoldRequestV2])
    async GetActiveHoldRequestV2(@Arg("customer_id") customer_id: number) {
        const rows = await MysqlDataSource.query(
            `SELECT * FROM hold_request_v2
             WHERE customer_id = ? AND status IN ('PENDING','APPROVED')
             ORDER BY request_id DESC LIMIT 1`,
            [customer_id]
        );
        return JSON.parse(JSON.stringify(rows));
    }

    @UseMiddleware(checkAuth)
    @Mutation((_return) => HoldV2Response)
    async CreateHoldRequestV2(
        @Arg("customer_id") customer_id: number,
        @Arg("reason") reason: string,
        @Arg("from_date") from_date: string,
        @Arg("to_date") to_date: string,
        @Ctx() { user }: Context
    ): Promise<HoldV2Response> {
        if (!(await hasPermission(user.user_id, "hold.request"))) return fail(NOT_PERMITTED);
        if (!reason.trim()) return fail("មូលហេតុត្រូវតែបំពេញ"); // reason required
        if (from_date > to_date) return fail("ថ្ងៃចាប់ផ្ដើមត្រូវមុនថ្ងៃបញ្ចប់"); // from must precede to

        try {
            // The engine's uq_one_active does the duplicate check atomically —
            // no read-then-write race like v1's stale GetHoldRequest gate.
            await MysqlDataSource.query(
                `INSERT INTO hold_request_v2 (customer_id, requested_by, reason, from_date, to_date)
                 VALUES (?, ?, ?, ?, ?)`,
                [customer_id, user.user_id, reason.trim(), from_date, to_date]
            );
            return ok("បានដាក់សំណើ");
        } catch (e) {
            if (isDuplicateActive(e)) return fail("អតិថិជននេះមានសំណើកំពុងរង់ចាំរួចហើយ"); // already has a live request
            throw e;
        }
    }

    /** Checker verdict. Admin only; never on your own request. */
    @UseMiddleware(checkAuth)
    @Mutation((_return) => HoldV2Response)
    async DecideHoldRequestV2(
        @Arg("request_id") request_id: number,
        @Arg("approve") approve: boolean,
        @Arg("note", { nullable: true }) note: string,
        @Ctx() { user }: Context
    ): Promise<HoldV2Response> {
        if (!(await hasPermission(user.user_id, "hold.decide"))) return fail(NOT_PERMITTED);

        // CAS from PENDING; the WHERE also refuses self-decision so the
        // answer is a clean message instead of a CHECK-violation error.
        const res = await MysqlDataSource.query(
            `UPDATE hold_request_v2
                SET status = ?, decided_by = ?, decided_at = NOW(), decision_note = ?
              WHERE request_id = ? AND status = 'PENDING' AND requested_by <> ?`,
            [approve ? "APPROVED" : "REJECTED", user.user_id, note ?? null, request_id, user.user_id]
        );
        if (!res.affectedRows) {
            const [row] = await MysqlDataSource.query(
                `SELECT status, requested_by FROM hold_request_v2 WHERE request_id = ?`, [request_id]);
            if (!row) return fail("រកមិនឃើញសំណើ"); // no such request
            if (row.requested_by === user.user_id) return fail("មិនអាចសម្រេចលើសំណើរបស់ខ្លួនឯង"); // own request
            return fail(`សំណើនេះ ${row.status} រួចហើយ`); // already decided
        }
        return ok(approve ? "បានឯកភាព" : "បានបដិសេធ");
    }

    /**
     * Apply an APPROVED hold: extend the membership by the hold's inclusive
     * length, computed from the CURRENT end date inside one transaction.
     */
    @UseMiddleware(checkAuth)
    @Mutation((_return) => HoldV2Response)
    async ProcessHoldV2(
        @Arg("request_id") request_id: number,
        @Arg("fee", { nullable: true }) fee: number,
        @Ctx() { user }: Context
    ): Promise<HoldV2Response> {
        if (!(await hasPermission(user.user_id, "hold.request"))) return fail(NOT_PERMITTED);
        const runner = MysqlDataSource.createQueryRunner();
        await runner.connect();
        await runner.startTransaction();
        try {
            // CAS + snapshot + computation in a single statement: exactly one
            // caller can move APPROVED -> PROCESSED, and old_end/new_end are
            // written from what the customer's end date IS right now.
            const res = await runner.query(
                `UPDATE hold_request_v2 hr
                   JOIN customer c ON c.customer_id = hr.customer_id
                    SET hr.status       = 'PROCESSED',
                        hr.processed_by = ?,
                        hr.processed_at = NOW(),
                        hr.fee          = ?,
                        hr.old_end      = c.end_membership_date,
                        -- GREATEST(..., CURDATE()): a hold on a LAPSED membership
                        -- runs from today, not from the date it expired on. Without
                        -- it a member 60 days expired gets an extension that is
                        -- still 60 days in the past. old_end above still records the
                        -- real prior end date, so the audit trail stays honest.
                        hr.new_end      = DATE_ADD(GREATEST(c.end_membership_date, CURDATE()),
                                          INTERVAL DATEDIFF(hr.to_date, hr.from_date) + 1 DAY)
                  WHERE hr.request_id = ? AND hr.status = 'APPROVED'`,
                [user.user_id, fee ?? 0, request_id]
            );
            if (!res.affectedRows) {
                await runner.rollbackTransaction();
                return fail("សំណើមិនទាន់ឯកភាព ឬដំណើរការរួចហើយ"); // not approved, or already processed
            }

            await runner.query(
                `UPDATE customer c
                   JOIN hold_request_v2 hr ON hr.customer_id = c.customer_id
                    SET c.end_membership_date = hr.new_end
                  WHERE hr.request_id = ?`,
                [request_id]
            );

            const [row] = await runner.query(
                `SELECT customer_id, new_end FROM hold_request_v2 WHERE request_id = ?`,
                [request_id]
            );
            await runner.commitTransaction();
            emitChange("member", row.customer_id);

            // Dual-write to the unified entitlement model, same as renewals do.
            // Outside the transaction on purpose: a sync failure must not void
            // the processed hold; it is logged and reconcilable.
            try {
                await extendMembershipEntitlement(row.customer_id, row.new_end);
            } catch (e) {
                console.error("Unified-model dual-write failed (hold v2):", e);
            }

            return ok("ជោគជ័យ", asISODate(row.new_end));
        } catch (e) {
            await runner.rollbackTransaction();
            throw e;
        } finally {
            await runner.release();
        }
    }

    /** A requester may withdraw their own still-pending request. */
    @UseMiddleware(checkAuth)
    @Mutation((_return) => HoldV2Response)
    async CancelHoldRequestV2(
        @Arg("request_id") request_id: number,
        @Ctx() { user }: Context
    ): Promise<HoldV2Response> {
        const res = await MysqlDataSource.query(
            `UPDATE hold_request_v2
                SET status = 'CANCELLED', decided_by = NULL, decided_at = NOW()
              WHERE request_id = ? AND status = 'PENDING' AND requested_by = ?`,
            [request_id, user.user_id]
        );
        return res.affectedRows
            ? ok("បានលុបសំណើ")
            : fail("លុបបានតែសំណើរបស់ខ្លួនឯង ដែលកំពុងរង់ចាំប៉ុណ្ណោះ"); // only your own pending request
    }
}
