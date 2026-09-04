import {
    Arg,
    Ctx,
    Field,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    UseMiddleware,
} from "type-graphql";
import { checkAuth } from "../MiddleWare/checkAuth";
import { Context } from "../Context/Context";
import { Customer } from "../Entities/Customer";
import { Entitlement } from "../Entities/Entitlement";
import { Facility } from "../Entities/Facility";
import { CheckIn } from "../Entities/CheckIn";
import { TicketPayment } from "../Entities/TicketPayment";
import { CouponPayment } from "../Entities/CouponPayment";
import { TicketPriceConfig } from "../Entities/TicketPriceConfig";
import { AccessMethod, EntitlementStatus, ProductType } from "../Entities/enums";
import { KIOSK_ROLE } from "../Utils/roles";

/**
 * Door / check-in operations for the CKD-Check-In kiosk app.
 *
 * These mirror, server-side, the raw SQL the Python check-in app used to run
 * directly against MySQL — so the kiosk can talk to the API instead of holding
 * DB credentials. Behavior is intentionally a 1:1 port (no logic changes):
 *  - member "active" is still derived from legacy customer.end_membership_date
 *    (past data isn't backfilled into the entitlement model yet);
 *  - tickets use the unified entitlement / check_in model (already dual-written);
 *  - coupons stay on the legacy coupon_payment / coupon_log tables.
 *
 * User-facing Khmer messages are NOT produced here — the kiosk client formats
 * them from these structured results, keeping localization in one place.
 */

// ─── Output types (shapes match the kiosk's pywebview contract) ───────────────

@ObjectType()
export class CheckinMember {
    @Field() customer_id: number;
    @Field() customer_name: string;
    @Field() phone: string;
    @Field() gender: string;
    @Field() shift: string;
    /** end_membership_date as "YYYY-MM-DD" (or "" if unset). */
    @Field() next_payment: string;
    @Field() active: boolean;
    @Field() key_status: string;
    @Field() towel_status: string;
    /** Stored photo path ("/uploads/members/member_<id>_<ms>.jpg") or null. The
     *  kiosk fetches it through the authenticated /uploads mount. */
    @Field(() => String, { nullable: true }) image_path?: string | null;
}

@ObjectType()
export class CheckinTicket {
    @Field() ticket_code: string;
    @Field() price: number;
    @Field(() => Int) is_check: number;
    @Field(() => [String]) places: string[];
    @Field(() => [String]) place_names: string[];
    @Field(() => Int, { nullable: true }) entries_left?: number | null;
    @Field(() => String, { nullable: true }) status?: string | null;
    @Field() station_place: string;
    @Field() place_allowed: boolean;
    @Field(() => String, { nullable: true }) key_image?: string | null;
    @Field(() => String, { nullable: true }) key_label?: string | null;
}

@ObjectType()
export class CheckinCoupon {
    @Field() coupon_code: string;
    @Field() customer_id: number;
    @Field() customer_name: string;
    @Field() phone: string;
    @Field() gender: string;
    @Field(() => Int) quantity: number;
    @Field() price: number;
    @Field(() => String, { nullable: true }) image_path?: string | null;
}

@ObjectType()
export class CheckinFingerprint {
    @Field() customer_id: number;
    @Field() fingerprint: string;
}

@ObjectType()
export class CheckoutMember {
    @Field() customer_id: number;
    @Field() customer_name: string;
    @Field(() => String, { nullable: true }) phone?: string | null;
    @Field(() => String, { nullable: true }) image_path?: string | null;
    @Field({ nullable: true }) check_in_id?: number;
    @Field(() => String, { nullable: true }) check_in_time?: string | null;
    @Field() key_taken: boolean;
    @Field() towel_taken: boolean;
}

@ObjectType()
export class CheckinResponse {
    @Field() success: boolean;
    @Field({ nullable: true }) message?: string;
}

// ─── Helpers (port of the Python module-level helpers) ────────────────────────

/** Today as "YYYY-MM-DD" in the server's local time (matches date.today()). */
function todayYMD(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/** Normalize a date-ish value to its "YYYY-MM-DD" prefix ("" if empty). */
function ymd(value: unknown): string {
    if (value === null || value === undefined || value === "") return "";
    return String(value).slice(0, 10);
}

/** Default fingerprint-template window for kiosk accounts: members active or
 *  expired within this many days. Set KIOSK_FINGERPRINT_WINDOW_DAYS on the
 *  server to change it; "all" or a negative number disables the filter. */
function kioskFingerprintWindowDays(): number | null {
    const raw = (process.env.KIOSK_FINGERPRINT_WINDOW_DAYS || "90").trim().toLowerCase();
    if (raw === "all") return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(n);
}

/** facility_id of the place a gate guards (null when unset / "*" / not found).
 *  Port of api.py:_station_facility_id. */
async function stationFacilityId(station_place: string): Promise<number | null> {
    const sp = (station_place || "").trim().toUpperCase();
    if (!sp || sp === "*") return null;
    const f = await Facility.findOne({ where: { code: sp } });
    return f ? f.facility_id : null;
}

interface TicketAccess {
    entitlement_id: number;
    places: string[];
    place_names: string[];
    entries_total: number;
    entries_used: number;
    entries_left: number;
    status: string;
}

/** Resolve a ticket's allowed place(s) + entry counts from the unified model
 *  (entitlement -> package_facility -> facility, keyed by access_code).
 *  Returns null when there's no matching ticket entitlement (legacy ticket).
 *  Port of api.py:_ticket_access. */
async function ticketAccess(ticket_code: string): Promise<TicketAccess | null> {
    const rows: any[] = await Entitlement.getRepository().query(
        "SELECT f.code AS place, f.name AS place_name, " +
            "e.entitlement_id AS entitlement_id, e.entries_total AS entries_total, " +
            "e.entries_used AS entries_used, e.status AS status " +
            "FROM entitlement e " +
            "JOIN package_facility pf ON pf.package_id = e.package_id " +
            "JOIN facility f ON f.facility_id = pf.facility_id " +
            "WHERE e.access_code = ? AND e.product_type = 'TICKET'",
        [ticket_code]
    );
    if (!rows || rows.length === 0) return null;
    const first = rows[0];
    const total = first.entries_total !== null && first.entries_total !== undefined
        ? Number(first.entries_total)
        : 1;
    const used = Number(first.entries_used || 0);
    return {
        entitlement_id: Number(first.entitlement_id),
        places: rows.map((r) => r.place),
        place_names: rows.map((r) => r.place_name),
        entries_total: total,
        entries_used: used,
        entries_left: Math.max(0, total - used),
        status: first.status,
    };
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

@Resolver()
export class DoorCheckInResolver {
    // ---- Lookups ----

    /** Port of api.py:lookup_member. active = end_membership_date >= today. */
    @UseMiddleware(checkAuth)
    @Query(() => CheckinMember, { nullable: true })
    async checkinLookupMember(
        @Arg("customer_id") customer_id: number
    ): Promise<CheckinMember | null> {
        const c = await Customer.findOne({ where: { customer_id } });
        if (!c) return null;

        const endYmd = ymd(c.end_membership_date);
        const active = endYmd !== "" && endYmd >= todayYMD();
        return {
            customer_id: c.customer_id,
            customer_name: c.customer_name || "",
            phone: c.phone || "",
            gender: c.gender || "",
            shift: c.shift || "",
            next_payment: endYmd,
            active,
            key_status: c.key_status || "un_take",
            towel_status: c.towel_status || "un_take",
            image_path: c.image_path || null,
        };
    }

    /** Port of api.py:lookup_ticket (+ _ticket_access + _ticket_key). */
    @UseMiddleware(checkAuth)
    @Query(() => CheckinTicket, { nullable: true })
    async checkinLookupTicket(
        @Arg("ticket_code") ticket_code: string,
        @Arg("station_place", { defaultValue: "" }) station_place: string
    ): Promise<CheckinTicket | null> {
        const tp = await TicketPayment.findOne({ where: { ticket_code } });
        if (!tp) return null;

        const sp = (station_place || "").trim().toUpperCase();
        const access = await ticketAccess(ticket_code);

        let places: string[] = [];
        let place_names: string[] = [];
        let entries_left: number | null = null;
        let status: string | null = null;
        let place_allowed = true;
        if (access) {
            places = access.places;
            place_names = access.place_names;
            entries_left = access.entries_left;
            status = access.status;
            place_allowed = !sp || sp === "*" || places.includes(sp);
        }

        const cfg = await TicketPriceConfig.findOne({ where: { price: tp.price } });

        return {
            ticket_code: tp.ticket_code,
            price: tp.price !== null && tp.price !== undefined ? Number(tp.price) : 0,
            is_check: tp.is_check !== null && tp.is_check !== undefined ? Number(tp.is_check) : 0,
            places,
            place_names,
            entries_left,
            status,
            station_place: sp,
            place_allowed,
            key_image: cfg?.key_image ?? null,
            key_label: cfg?.label ?? null,
        };
    }

    /** Port of api.py:lookup_coupon (coupon_payment INNER JOIN customer). */
    @UseMiddleware(checkAuth)
    @Query(() => CheckinCoupon, { nullable: true })
    async checkinLookupCoupon(
        @Arg("coupon_code") coupon_code: string
    ): Promise<CheckinCoupon | null> {
        const rows: any[] = await CouponPayment.getRepository().query(
            "SELECT customer.customer_id AS customer_id, customer.customer_name AS customer_name, " +
                "customer.phone AS phone, customer.gender AS gender, " +
                "customer.image_path AS image_path, " +
                "coupon_payment.quantity AS quantity, coupon_payment.price AS price " +
                "FROM coupon_payment " +
                "INNER JOIN customer ON customer.customer_id = coupon_payment.customer_id " +
                "WHERE coupon_payment.coupon_code = ?",
            [coupon_code]
        );
        if (!rows || rows.length === 0) return null;
        const r = rows[0];
        return {
            coupon_code,
            customer_id: Number(r.customer_id),
            customer_name: r.customer_name || "",
            phone: r.phone || "",
            gender: r.gender || "",
            quantity: r.quantity !== null && r.quantity !== undefined ? Number(r.quantity) : 0,
            price: r.price !== null && r.price !== undefined ? Number(r.price) : 0,
            image_path: r.image_path || null,
        };
    }

    /** Customers with an enrolled fingerprint template. Used by the kiosks to
     *  preload the local SDK matcher and to render the enrolled list.
     *  Port of api.py:list_fingerprints + fingerprint.py:_load_templates_from_db.
     *
     *  active_within_days limits the set to members whose membership is active
     *  or expired at most that many days ago (0 = active only). When omitted,
     *  kiosk accounts get the server default (KIOSK_FINGERPRINT_WINDOW_DAYS,
     *  90) and staff callers get everything: enrolment tooling needs the full
     *  list, while a gate only needs members who could plausibly be let in.
     *  With ~3k enrolled and ~470 inside the window that is an 85% smaller
     *  1:N set. Long-expired members still get in by scanning their member
     *  code; the kiosks tell them so on a no-match. */
    @UseMiddleware(checkAuth)
    @Query(() => [CheckinFingerprint])
    async checkinFingerprints(
        @Arg("active_within_days", () => Int, { nullable: true }) active_within_days?: number | null,
        @Ctx() ctx?: Context
    ): Promise<CheckinFingerprint[]> {
        let windowDays: number | null;
        if (active_within_days !== null && active_within_days !== undefined) {
            windowDays = Math.max(0, Math.floor(active_within_days));
        } else {
            const role = ctx && ctx.user ? ctx.user.role : undefined;
            windowDays = role === KIOSK_ROLE ? kioskFingerprintWindowDays() : null;
        }
        const params: any[] = [];
        let where = "WHERE fingerprint IS NOT NULL AND fingerprint != ''";
        if (windowDays !== null) {
            where += " AND end_membership_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)";
            params.push(windowDays);
        }
        const rows: any[] = await Customer.getRepository().query(
            "SELECT customer_id, fingerprint FROM customer " + where,
            params
        );
        return rows.map((r) => ({
            customer_id: Number(r.customer_id),
            fingerprint: r.fingerprint || "",
        }));
    }

    // ---- Mutations ----

    /** Port of api.py:ticket_check_in WRITES. The kiosk validates place + entries
     *  via checkinLookupTicket first; this performs the consume + log.
     *  Legacy is_check flag + unified-model entry consume + check_in row. */
    @UseMiddleware(checkAuth)
    @Mutation(() => CheckinResponse)
    async checkinTicket(
        @Arg("ticket_code") ticket_code: string,
        @Arg("station_place", { defaultValue: "" }) station_place: string,
        @Ctx() { user }: Context
    ): Promise<CheckinResponse> {
        // Legacy single-use flag (blind update, mirrors the Python behavior).
        await TicketPayment.update({ ticket_code }, { is_check: 1 });

        // Unified model: consume one entry + log the check-in (best-effort).
        try {
            const ent = await Entitlement.findOne({
                where: { access_code: ticket_code, product_type: ProductType.TICKET },
            });
            if (ent) {
                const total = ent.entries_total ?? 1;
                ent.entries_used = ent.entries_used + 1;
                if (ent.entries_used >= total) ent.status = EntitlementStatus.USED_UP;
                await ent.save();

                const facility_id = await stationFacilityId(station_place);
                await CheckIn.create({
                    entitlement_id: ent.entitlement_id,
                    facility_id: facility_id ?? undefined,
                    access_method: AccessMethod.CODE,
                    recorded_by: user?.user_id,
                }).save();
            }
        } catch (e) {
            console.error("ticket unified-model consume/log failed:", e);
        }

        return { success: true };
    }

    /** Port of api.py:member_open_door — update key/towel status only. */
    @UseMiddleware(checkAuth)
    @Mutation(() => CheckinResponse)
    async checkinMember(
        @Arg("customer_id") customer_id: number,
        @Arg("key_status") key_status: string,
        @Arg("towel_status") towel_status: string
    ): Promise<CheckinResponse> {
        await Customer.update({ customer_id }, { key_status, towel_status });
        return { success: true };
    }

    /** Port of api.py:coupon_consume — legacy log + decrement (coupons aren't
     *  dual-written into the unified model yet). */
    @UseMiddleware(checkAuth)
    @Mutation(() => CheckinResponse)
    async checkinConsumeCoupon(
        @Arg("coupon_code") coupon_code: string,
        @Arg("key_qty", () => Int, { defaultValue: 0 }) key_qty: number,
        @Arg("towel_qty", () => Int, { defaultValue: 0 }) towel_qty: number
    ): Promise<CheckinResponse> {
        // coupon_log has a coupon_code column the entity doesn't model, and the
        // CouponLog entity isn't registered in the DataSource — so run a raw insert
        // through an already-connected repository (table name is in the SQL).
        await CouponPayment.getRepository().query(
            "INSERT INTO coupon_log (coupon_code) VALUES (?)",
            [coupon_code]
        );
        await CouponPayment.getRepository().query(
            "UPDATE coupon_payment SET quantity = quantity - 1, " +
                "key_qty = ?, towel_qty = ?, last_update = NOW() WHERE coupon_code = ?",
            [key_qty, towel_qty, coupon_code]
        );
        return { success: true };
    }

    /** Port of api.py:_handle_enroll_complete DB write — persist a fingerprint
     *  template (base64) for a customer. */
    @UseMiddleware(checkAuth)
    @Mutation(() => CheckinResponse)
    async checkinSaveFingerprint(
        @Arg("customer_id") customer_id: number,
        @Arg("template") template: string
    ): Promise<CheckinResponse> {
        await Customer.update({ customer_id }, { fingerprint: template });
        return { success: true };
    }

    // ---- Check-Out operations ----

    /** Look up a member + their most recent check-in for today (used by CKD-Check-Out). */
    @UseMiddleware(checkAuth)
    @Query(() => CheckoutMember, { nullable: true })
    async checkoutLookupMember(
        @Arg("customer_id") customer_id: number
    ): Promise<CheckoutMember | null> {
        const c = await Customer.findOne({ where: { customer_id } });
        if (!c) return null;

        const today = todayYMD();
        const rows: any[] = await CheckIn.getRepository().query(
            "SELECT check_in_id, check_in_time, key_taken, towel_taken " +
            "FROM check_in WHERE customer_id = ? AND DATE(check_in_time) = ? " +
            "ORDER BY check_in_time DESC LIMIT 1",
            [customer_id, today]
        );
        const ci = rows?.[0] ?? null;

        return {
            customer_id: c.customer_id,
            customer_name: c.customer_name || "",
            phone: c.phone || null,
            image_path: c.image_path || null,
            check_in_id: ci ? Number(ci.check_in_id) : undefined,
            check_in_time: ci ? String(ci.check_in_time) : null,
            key_taken: ci ? Boolean(ci.key_taken) : false,
            towel_taken: ci ? Boolean(ci.towel_taken) : false,
        };
    }

    /** Toggle key_taken / towel_taken on a check_in record (CKD-Check-Out). */
    @UseMiddleware(checkAuth)
    @Mutation(() => CheckinResponse)
    async checkoutUpdateItems(
        @Arg("check_in_id", () => Int) check_in_id: number,
        @Arg("key_taken", () => Boolean, { nullable: true }) key_taken?: boolean | null,
        @Arg("towel_taken", () => Boolean, { nullable: true }) towel_taken?: boolean | null
    ): Promise<CheckinResponse> {
        const updates: Record<string, unknown> = {};
        if (key_taken !== undefined && key_taken !== null) updates.key_taken = key_taken;
        if (towel_taken !== undefined && towel_taken !== null) updates.towel_taken = towel_taken;
        if (Object.keys(updates).length === 0) return { success: true };
        await CheckIn.update({ check_in_id }, updates);
        return { success: true };
    }
}
