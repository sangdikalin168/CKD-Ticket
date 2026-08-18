import { Arg, Ctx, Mutation, Query, Resolver, ID, InterfaceType, ObjectType, UseMiddleware } from "type-graphql";
import { checkAuth } from "../MiddleWare/checkAuth";
import { Users } from "../Entities/Users";
import { GetUser } from "../Types/GetUser";
import { Context } from "../Context/Context";
import { compare, hash } from "bcryptjs";
import { createToken, sendRefreshToken } from "../Utils/auth";
import { RegisterInput } from "../Types/RegisterInput";

import { Field, InputType } from 'type-graphql'

@InputType()
export class LoginInput {
  @Field()
  username: string

  @Field()
  password: string
}

@InterfaceType()
export abstract class IMutationResponse {
  @Field()
  code: number

  @Field()
  success: boolean

  @Field({ nullable: true })
  message?: string
}

@ObjectType({ implements: IMutationResponse })
export class UserMutationResponse implements IMutationResponse {
  code: number
  success: boolean
  message?: string

  @Field({ nullable: true })
  user?: Users

  @Field({ nullable: true })
  accessToken?: string
}

@Resolver()
export class UserResolver {
  @UseMiddleware(checkAuth)
  @Query((_return) => [Users])
  async users(): Promise<Users[]> {
    return await Users.find({ order: { user_id: "DESC" } });
  }

  @UseMiddleware(checkAuth)
  @Query((returns) => GetUser)
  async get_user(@Arg("user_id", (_type) => ID) user_id: number) {
    const user = await Users.findOne({ where: { user_id: user_id } });
    return user;
  }

  @UseMiddleware(checkAuth)
  @Mutation((_return) => UserMutationResponse)
  async create_user(
    @Arg("userInput")
    { username, password, display_name, phone, role }: RegisterInput,
    @Ctx() { }: Context
  ): Promise<UserMutationResponse> {
    const existingUser = await Users.findOne({
      where: [{ username: username }, { phone: phone }],
    });

    if (existingUser) {
      return {
        code: 400,
        success: false,
        message: "User Already Register",
      };
    }

    const hashedPassword = await hash(password, 12);

    await Users.insert({
      username,
      password: hashedPassword,
      phone,
      display_name,
      role,
    });

    return {
      code: 200,
      success: true,
      message: "User Create Success",
    };
  }

  @Mutation((_return) => UserMutationResponse)
  async login(
    @Arg("loginInput") { username, password }: LoginInput,
    @Ctx() { res }: Context
  ): Promise<UserMutationResponse> {
    const existingUser = await Users.findOne({
      where: [{ username: username }, { phone: username }],
    });

    if (!existingUser || !existingUser.is_active) {
      // Deactivated accounts (soft-deleted staff) get the same answer as
      // unknown ones — no probing which usernames still exist.
      return {
        code: 400,
        success: false,
        message: "User not found",
      };
    }
    const isPasswordValid = await compare(password, existingUser.password);

    if (!isPasswordValid) {
      return {
        code: 400,
        success: false,
        message: "Incorrect password",
      };
    }

    sendRefreshToken(res, existingUser);

    return {
      code: 200,
      success: true,
      message: "Logged in successfully",
      user: existingUser,
      accessToken: createToken("accessToken", existingUser),
    };
  }

  /**
   * Log the CALLER out. Requires a valid access token.
   *
   * This used to be `logout: allow` in permissions.ts while taking whatever
   * user_id the caller passed, then bumping that user's tokenVersion — which
   * invalidates their refresh token. Anyone who could reach /graphql (the
   * Cloudflare tunnel makes that the public internet) could therefore log out
   * any user by id, in a loop, without ever authenticating.
   *
   * The id now comes from the verified token via checkAuth, so a session can
   * only ever end itself. The argument is kept, optional and ignored, so any
   * older client still sending it does not break.
   */
  @Mutation((_return) => UserMutationResponse)
  @UseMiddleware(checkAuth)
  async logout(
    @Arg("user_id", (_type) => ID, { nullable: true }) _user_id: number | null,
    @Ctx() { res, user }: Context
  ): Promise<UserMutationResponse> {
    const existingUser = await Users.findOne({ where: { user_id: user.user_id } });

    if (!existingUser) {
      return {
        code: 400,
        success: false,
      };
    }

    existingUser.tokenVersion += 1;

    await existingUser.save();

    res.clearCookie(process.env.REFRESH_TOKEN_COOKIE_NAME as string, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/refresh_token",
    });

    return { code: 200, success: true };
  }
}
