import { Customer } from "../Entities/Customer";
import {
    Arg,
    Field,
    Int,
    InterfaceType,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    UseMiddleware,
} from "type-graphql";
import { Like } from "typeorm";
import { checkAuth } from "../MiddleWare/checkAuth";
import { MEMBER_PHOTOS_DIR, resolveUploadPath } from "../Utils/paths";
import { MutationResponseBase } from "../Types/MutationResponse";
import * as fs from "fs";
import * as path from "path";

@ObjectType()
export class CustomerMutationResponse extends MutationResponseBase {}

/**
 * WHERE clause for the member search box: staff search by name, phone or ID.
 * The list is paginated server-side (20 rows/page over ~3.7k members), so
 * filtering has to happen here — a client-side filter would only ever see the
 * current page.
 *
 * Returns an array, which TypeORM treats as OR across the fields.
 * `undefined` means "no filter", i.e. the plain paginated list.
 */
const customerSearchWhere = (search?: string | null) => {
    const term = search?.trim();
    if (!term) return undefined;
    // Escape LIKE wildcards so a literal % or _ typed by the user isn't a wildcard.
    const escaped = term.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    const pattern = `%${escaped}%`;
    const where: Record<string, unknown>[] = [
        { customer_name: Like(pattern) },
        { phone: Like(pattern) },
        { customer_code: Like(pattern) },
    ];
    // A digits-only term is also matched against the numeric member ID. Exact
    // rather than LIKE: customer_id is the indexed PK, and a substring match
    // would make typing "1" return every id containing a 1. Phone stays a
    // substring match above, so digits still find partial phone numbers.
    if (/^\d+$/.test(term)) {
        const id = Number(term);
        if (Number.isSafeInteger(id)) where.push({ customer_id: id });
    }
    return where;
};



@Resolver()
export class CustomerResolver {
    @UseMiddleware(checkAuth)
    @Query((_return) => [Customer])
    async GetCustomers(
        @Arg("limit", () => Int) limit: number,
        @Arg("offset", () => Int) offset: number,
        @Arg("search", () => String, { nullable: true }) search?: string,
    ): Promise<Customer[]> {
        return await Customer.find({
            where: customerSearchWhere(search),
            order: { customer_id: "DESC" },
            take: limit,
            skip: offset,
        });
    }

    @UseMiddleware(checkAuth)
    @Query((_return) => Int)
    // Must take the same search term as GetCustomers, otherwise the pager would
    // still show page counts for the full 3.7k list while the table shows matches.
    async GetCustomersCount(
        @Arg("search", () => String, { nullable: true }) search?: string,
    ): Promise<number> {
        return await Customer.count({ where: customerSearchWhere(search) });
    }

    @UseMiddleware(checkAuth)
    @Query((_return) => [Customer])
    async GetCustomerDetail(@Arg("customer_id") customer_Id: number): Promise<Customer[]> {
        return await Customer.find({ where: { customer_id: customer_Id } });
    }


    @UseMiddleware(checkAuth)
    @Mutation((_return) => CustomerMutationResponse)
    async CreateCustomer(
        @Arg("customer_name") customer_name: string,
        @Arg("phone") phone: string,
        @Arg("gender") gender: string,
        @Arg("created_by") created_by: number,
    ): Promise<CustomerMutationResponse> {
        const isExist = await Customer.findOne({
            where: [{ customer_name: customer_name }, { phone: phone }],
        });

        if (isExist) {
            return {
                code: 400,
                success: false,
                message: "Already Exist",
            };
        }
        await Customer.create({
            customer_name: customer_name,
            phone: phone,
            gender: gender,
            created_by: created_by
        }).save();

        return {
            code: 200,
            success: true,
            message: "Create Success",
        };
    }

    @UseMiddleware(checkAuth)
    @Mutation((_return) => CustomerMutationResponse)
    async UpdateCustomer(
        @Arg("customer_id") customer_id: number,
        @Arg("phone") phone: string,
    ): Promise<CustomerMutationResponse> {

        const existPhone = await Customer.findOne({ where: { phone: phone } })

        if (existPhone?.customer_id) {
            return {
                code: 200,
                success: false,
                message: "លេខនេះមានរួចហើយ!!!",
            };
        }

        const update = await Customer.update({
            customer_id: customer_id,
        }, {
            phone: phone
        })
        if (update.affected) {
            return {
                code: 200,
                success: true,
                message: "Update Member Success",
            };
        }
        //Return Failed
        return {
            code: 200,
            success: false,
            message: "Update Member Failed",
        };
    }

    @UseMiddleware(checkAuth)
    @Mutation((_return) => CustomerMutationResponse)
    async UpdateCustomerPhoto(
        @Arg("customer_id") customer_id: number,
        @Arg("image_path") image_path: string,
    ): Promise<CustomerMutationResponse> {
        try {
            const customer = await Customer.findOne({ where: { customer_id } });
            
            if (!customer) {
                return {
                    code: 404,
                    success: false,
                    message: "Customer not found",
                };
            }

            // Create uploads directory if it doesn't exist. MEMBER_PHOTOS_DIR
            // honours UPLOADS_DIR, so photos can live outside the tree a deploy
            // replaces — see Utils/paths.ts.
            if (!fs.existsSync(MEMBER_PHOTOS_DIR)) {
                fs.mkdirSync(MEMBER_PHOTOS_DIR, { recursive: true });
            }

            // Generate unique filename
            const fileName = `member_${customer_id}_${Date.now()}.jpg`;
            const filePath = path.join(MEMBER_PHOTOS_DIR, fileName);

            // Extract base64 data and save to file
            const base64Data = image_path.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");
            fs.writeFileSync(filePath, buffer);

            // Delete old image if exists. resolveUploadPath refuses anything
            // that escapes the uploads directory, so a malformed stored path
            // can't unlink a file elsewhere on disk.
            const oldFilePath = resolveUploadPath(customer.image_path);
            if (oldFilePath && fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }

            // Store relative path in database
            const dbPath = `/uploads/members/${fileName}`;
            const update = await Customer.update(
                { customer_id },
                { image_path: dbPath }
            );

            if (update.affected) {
                return {
                    code: 200,
                    success: true,
                    message: "Photo updated successfully",
                };
            }

            return {
                code: 400,
                success: false,
                message: "Failed to update photo",
            };
        } catch (error) {
            console.error("Error updating photo:", error);
            return {
                code: 500,
                success: false,
                message: "Server error",
            };
        }
    }
}