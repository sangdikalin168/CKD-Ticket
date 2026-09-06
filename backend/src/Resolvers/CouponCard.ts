import {
    Arg,
    Field,
    InterfaceType,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    UseMiddleware,
} from "type-graphql";
import { Like } from "typeorm";
import { checkAuth } from "../MiddleWare/checkAuth";
import { CouponCard } from "../Entities/CouponCard";
import { MutationResponseBase } from "../Types/MutationResponse";

@ObjectType()
export class CouponCardMutationResponse extends MutationResponseBase {
    @Field((_type) => CouponCard, { nullable: true })
    couponCard?: CouponCard;
}

/**
 * WHERE clause for the coupon-price-table search box: matches card_name or
 * coupon_code, optionally narrowed to a status. Returns an array, which
 * TypeORM treats as OR across the fields (mirrors CustomerResolver's
 * customerSearchWhere).
 */
const couponCardSearchWhere = (status?: string | null, search?: string | null) => {
    const term = search?.trim();
    const statusFilter = status ? { status } : {};
    if (!term) return status ? statusFilter : undefined;
    // Escape LIKE wildcards so a literal % or _ typed by the user isn't a wildcard.
    const escaped = term.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    const pattern = `%${escaped}%`;
    return [
        { ...statusFilter, card_name: Like(pattern) },
        { ...statusFilter, coupon_code: Like(pattern) },
    ];
};

@Resolver()
export class CouponCardResolver {

    @UseMiddleware(checkAuth)
    @Query((_return) => [CouponCard])
    async GetCouponCard(@Arg("coupon_code") coupon_code: string): Promise<CouponCard[]> {
        return await CouponCard.find({ where: { coupon_code: coupon_code, status: "Pending" } });
    }

    @UseMiddleware(checkAuth)
    @Query((_return) => [CouponCard])
    async GetCouponCards(
        @Arg("status", () => String, { nullable: true }) status?: string,
        @Arg("search", () => String, { nullable: true }) search?: string,
    ): Promise<CouponCard[]> {
        return await CouponCard.find({
            where: couponCardSearchWhere(status, search),
            order: { id: "DESC" },
        });
    }

    @UseMiddleware(checkAuth)
    @Mutation((_return) => CouponCardMutationResponse)
    async CreateCouponCard(
        @Arg("card_name") card_name: string,
        @Arg("coupon_code") coupon_code: string,
        @Arg("price") price: number,
        @Arg("quantity", () => Int) quantity: number,
    ): Promise<CouponCardMutationResponse> {
        const name = card_name.trim();
        const code = coupon_code.trim();

        if (!name || !code) {
            return { code: 400, success: false, message: "Name and coupon code are required" };
        }
        if (price < 0) {
            return { code: 400, success: false, message: "Price cannot be negative" };
        }
        if (quantity < 1) {
            return { code: 400, success: false, message: "Quantity must be at least 1" };
        }

        const existing = await CouponCard.findOne({ where: { coupon_code: code } });
        if (existing) {
            return { code: 400, success: false, message: "Coupon code already exists" };
        }

        const created = await CouponCard.create({
            card_name: name,
            coupon_code: code,
            price,
            quantity,
        }).save();

        return { code: 200, success: true, message: "Create Success", couponCard: created };
    }

    @UseMiddleware(checkAuth)
    @Mutation((_return) => CouponCardMutationResponse)
    async UpdateCouponCard(
        @Arg("id", () => Int) id: number,
        @Arg("card_name", () => String, { nullable: true }) card_name?: string,
        @Arg("price", () => Number, { nullable: true }) price?: number,
        @Arg("quantity", () => Int, { nullable: true }) quantity?: number,
    ): Promise<CouponCardMutationResponse> {
        const card = await CouponCard.findOne({ where: { id } });
        if (!card) {
            return { code: 404, success: false, message: "Coupon card not found" };
        }

        if (card_name !== undefined) {
            const name = card_name.trim();
            if (!name) {
                return { code: 400, success: false, message: "Name and coupon code are required" };
            }
            card.card_name = name;
        }
        if (price !== undefined) {
            if (price < 0) {
                return { code: 400, success: false, message: "Price cannot be negative" };
            }
            card.price = price;
        }
        if (quantity !== undefined) {
            if (quantity < 1) {
                return { code: 400, success: false, message: "Quantity must be at least 1" };
            }
            card.quantity = quantity;
        }

        await card.save();
        return { code: 200, success: true, message: "Update Success", couponCard: card };
    }

    @UseMiddleware(checkAuth)
    @Mutation((_return) => CouponCardMutationResponse)
    async DeleteCouponCard(@Arg("id", () => Int) id: number): Promise<CouponCardMutationResponse> {
        const card = await CouponCard.findOne({ where: { id } });
        if (!card) {
            return { code: 404, success: false, message: "Coupon card not found" };
        }
        if (card.status !== "Pending") {
            return { code: 400, success: false, message: "Only unsold coupons can be deleted" };
        }

        await card.remove();
        return { code: 200, success: true, message: "Delete Success" };
    }
}