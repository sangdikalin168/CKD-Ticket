import { MemberPayment } from "../Entities/MemberPayment";
import { Users } from "../Entities/Users";
import { TicketPayment } from "../Entities/TicketPayment";
import { CouponPayment } from "../Entities/CouponPayment";
import { TrainningPayment } from "../Entities/TrainningPayment";
import { Customer } from "../Entities/Customer";
import { MemberScan } from "../Entities/MemberScan";
import { TicketLog } from "../Entities/TicketLog";
import { CouponLog } from "../Entities/CouponLog";
import {
    Arg,
    Field,
    InterfaceType,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    UseMiddleware,
} from "type-graphql";
import { checkAuth } from "../MiddleWare/checkAuth";
import { __Type } from "graphql";
import { FruitPayment } from "../Entities/FruitPayment";
import { MysqlDataSource } from "../index";
import moment from "moment";

/**
 * The report's date range as [start, end): from 00:00 on dateFrom up to (not
 * including) 00:00 on the day AFTER dateTo, so every sale on dateTo counts.
 *
 * This used to stop at `${dateTo} 23:00:00`, silently dropping every sale
 * made between 23:00 and midnight from the income report, the dashboard's
 * figures and the till's tally.
 */
function dayRange(dateFrom: String, dateTo: String): { from: string; to: string } {
    const from = moment(String(dateFrom), "YYYY-MM-DD", true);
    const to = moment(String(dateTo), "YYYY-MM-DD", true);
    if (!from.isValid() || !to.isValid()) throw new Error("Dates must be YYYY-MM-DD");
    return {
        from: from.format("YYYY-MM-DD 00:00:00"),
        to: to.clone().add(1, "day").format("YYYY-MM-DD 00:00:00"),
    };
}


@ObjectType()
class TicketType {

    @Field()
    price: number

    @Field()
    qty: number

    @Field()
    payment_date: String
}

@ObjectType()
class MemberType {

    @Field()
    price: number

    @Field()
    qty: number

    @Field()
    promotion: String

    @Field()
    customer_name: String
}

@ObjectType()
class CouponType {

    @Field()
    price: number

    @Field()
    qty: number

    @Field()
    card_name: String

    @Field()
    customer_name: String
}

@ObjectType()
class TrainningType {

    @Field()
    price: number

    @Field()
    qty: number

    @Field()
    promotion: String

    @Field()
    customer_name: String
}


@Resolver()
export class IncomeReportResolver {

    @Query((_return) => [Users])
    async GetSeller(
        @Arg(("dateFrom")) dateFrom: String,
        @Arg(("dateTo")) dateTo: String
    ) {
        // Everyone who sold ANYTHING in the range — this used to join only
        // ticket_payment, so a cashier who sold only memberships, coupons,
        // training or fruit never appeared as a seller to filter by.
        const { from, to } = dayRange(dateFrom, dateTo);
        const tables = ["ticket_payment", "member_payment", "coupon_payment", "trainning_payment", "fruit_payment"];
        const union = tables
            .map((t) => `SELECT user_id FROM \`${t}\` WHERE payment_date >= ? AND payment_date < ?`)
            .join(" UNION ");
        const rows: { user_id: number }[] = await MysqlDataSource.query(
            `SELECT DISTINCT user_id FROM (${union}) s`,
            tables.flatMap(() => [from, to])
        );
        const ids = rows.map((r) => r.user_id).filter((id) => id != null);
        if (ids.length === 0) return [];
        return await Users.createQueryBuilder("users")
            .where("users.user_id IN (:...ids)", { ids })
            .orderBy("users.display_name")
            .getMany();
    }

    @Query((_return) => [TicketType])
    async GetTicketPayment(
        @Arg(("dateFrom")) dateFrom: String,
        @Arg(("dateTo")) dateTo: String,
        @Arg(("userId")) userId: number
    ) {

        if (userId === 0) {
            const results = await TicketPayment
                .createQueryBuilder("ticket_payment")
                .select(["price", "payment_date"])
                .addSelect("COUNT(ticket_payment.price)", "qty")
                .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo))
                .groupBy("price")
                .getRawMany()
            return results;
        } else {
            const results = await TicketPayment
                .createQueryBuilder("ticket_payment")
                .select(["price", "payment_date"])
                .addSelect("COUNT(ticket_payment.price)", "qty")
                .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo))
                .andWhere("user_id = :user_id", { user_id: userId })
                .groupBy("price")
                .getRawMany()
            return results;
        }
    }

    @Query((_return) => [MemberType])
    async GetMemberPayments(
        @Arg(("dateFrom")) dateFrom: String,
        @Arg(("dateTo")) dateTo: String,
        @Arg(("userId")) userId: number
    ) {

        if (userId === 0) {
            const result = await MemberPayment
                .createQueryBuilder("member_payment")
                .select(["promotion", "price"])
                .addSelect("COUNT(member_payment.price)", "qty")
                .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo))
                .groupBy("promotion").addGroupBy("price")
                .getRawMany()
            return result;
        }
        else {
            const result = await MemberPayment
                .createQueryBuilder("member_payment")
                .select(["promotion", "price"])
                .addSelect("COUNT(member_payment.price)", "qty")
                .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo))
                .andWhere("user_id = :user_id", { user_id: userId })
                .groupBy("promotion").addGroupBy("price")
                .getRawMany()
            return result;
        }
    }

    @Query((_return) => [TrainningType])
    async GetTrainningPayments(
        @Arg(("dateFrom")) dateFrom: String,
        @Arg(("dateTo")) dateTo: String,
        @Arg(("userId")) userId: number
    ) {
        if (userId === 0) {
            const result = await TrainningPayment
                .createQueryBuilder("trainning_payment")
                .select(["price", "promotion"])
                .addSelect("COUNT(trainning_payment.price)", "qty")
                .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo))
                .groupBy("promotion").addGroupBy("price")
                .getRawMany()
            return result;
        }
        else {
            const result = await TrainningPayment
                .createQueryBuilder("trainning_payment")
                .select(["price", "promotion"])
                .addSelect("COUNT(trainning_payment.price)", "qty")
                .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo))
                .andWhere("user_id = :user_id", { user_id: userId })
                .groupBy("promotion").addGroupBy("price")
                .getRawMany()
            return result;
        }
    }

    @Query((_return) => [CouponType])
    async GetCouponPayments(
        @Arg(("dateFrom")) dateFrom: String,
        @Arg(("dateTo")) dateTo: String,
        @Arg(("userId")) userId: number
    ) {

        if (userId === 0) {
            const result = await CouponPayment
                .createQueryBuilder("coupon_payment")
                .select(["price", "card_name"])
                .addSelect("COUNT(coupon_payment.price)", "qty")
                .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo))
                .groupBy("card_name").addGroupBy("price")
                .getRawMany()
            return result;
        } else {
            const result = await CouponPayment
                .createQueryBuilder("coupon_payment")
                .select(["price", "card_name"])
                .addSelect("COUNT(coupon_payment.price)", "qty")
                .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo))
                .andWhere("user_id = :user_id", { user_id: userId })
                .groupBy("card_name").addGroupBy("price")
                .getRawMany()
            return result;
        }
    }
    @Query((_return) => [CouponType])
    async GetCouponPaymentDetails(
        @Arg(("dateFrom")) dateFrom: String,
        @Arg(("dateTo")) dateTo: String,
    ) {
        const result = await Customer
            .createQueryBuilder("customer")
            .innerJoinAndSelect(CouponPayment, "coupon_payment", "coupon_payment.customer_id = customer.customer_id")
            .select(["customer_name", "payment_date", "card_name", "price"])
            .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo))
            .getRawMany();
        return result;
    }

    @Query((_return) => [MemberType])
    async GetMemberPaymentDetail(
        @Arg(("dateFrom")) dateFrom: String,
        @Arg(("dateTo")) dateTo: String,
    ) {
        const result = await Customer
            .createQueryBuilder("customer")
            .innerJoinAndSelect(MemberPayment, "member_payment", "member_payment.customer_id = customer.customer_id")
            .select(["customer_name", "payment_date", "promotion", "price"])
            .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo))
            .getRawMany();
        return result;
    }

    @Query((_return) => [MemberType])
    async GetTrainningPaymentDetail(
        @Arg(("dateFrom")) dateFrom: String,
        @Arg(("dateTo")) dateTo: String,
    ) {
        const result = await Customer
            .createQueryBuilder("customer")
            .innerJoinAndSelect(TrainningPayment, "trainning_payment", "trainning_payment.customer_id = customer.customer_id")
            .select(["customer_name", "payment_date", "promotion", "price"])
            .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo))
            .getRawMany();
        return result;
    }

    /** Fruit sales — previously missing from the income report entirely. */
    @Query((_return) => [TrainningType])
    async GetFruitPayments(
        @Arg(("dateFrom")) dateFrom: String,
        @Arg(("dateTo")) dateTo: String,
        @Arg(("userId")) userId: number
    ) {
        const q = FruitPayment
            .createQueryBuilder("fruit_payment")
            .select(["price", "promotion"])
            .addSelect("COUNT(fruit_payment.price)", "qty")
            .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo));
        if (userId !== 0) q.andWhere("user_id = :user_id", { user_id: userId });
        return await q.groupBy("promotion").addGroupBy("price").getRawMany();
    }

    @Query((_return) => [MemberType])
    async GetFruitPaymentDetail(
        @Arg(("dateFrom")) dateFrom: String,
        @Arg(("dateTo")) dateTo: String,
    ) {
        return await Customer
            .createQueryBuilder("customer")
            .innerJoinAndSelect(FruitPayment, "fruit_payment", "fruit_payment.customer_id = customer.customer_id")
            .select(["customer_name", "payment_date", "promotion", "price"])
            .andWhere("payment_date >= :from AND payment_date < :to", dayRange(dateFrom, dateTo))
            .getRawMany();
    }
}
