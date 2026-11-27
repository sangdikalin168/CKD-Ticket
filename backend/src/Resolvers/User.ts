import { Arg, Ctx, Mutation, Query, Resolver, ID, InterfaceType, ObjectType, UseMiddleware } from "type-graphql";
import { checkAuth } from "../MiddleWare/checkAuth";
import { Users } from "../Entities/Users";
import { UserPermission } from "../Entities/UserPermission";
import { GetUser } from "../Types/GetUser";
import { Context } from "../Context/Context";
import { compare, hash } from "bcryptjs";
import { createToken, sendRefreshToken } from "../Utils/auth";
import { RegisterInput } from "../Types/RegisterInput";
import {
  PERMISSIONS,
  Permission,
  STAFF_ROLES,
  applyOverrides,
  effectivePermissions,
  isPermission,
  isStaffRole,
  roleDefaults,
} from "../Utils/permissionCatalog";

import { Field, InputType } from 'type-graphql'

// Access control for everything below lives in permissions.ts (graphql-shield):
// the user-management operations need "user.manage"; my_permissions needs any
// staff login; login is public. The checks inside the mutations are the
// business rules (no self-lockout, never zero managers), not authorization.

const MIN_PASSWORD_LENGTH = 6;

@InputType()
export class LoginInput {
  @Field()
  username: string

  @Field()
  password: string
}

@InputType()
export class UpdateUserInput {
  @Field()
  display_name: string

  @Field()
  username: string

  @Field()
  phone: string

  @Field()
  role: string
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

  /** The signed-in user's effective permissions (login only). */
  @Field((_type) => [String], { nullable: true })
  permissions?: string[]
}

@ObjectType()
export class UserPermissionsInfo {
  @Field((_type) => ID)
  user_id: number

  @Field()
  role: string

  /** What the user can do now: role defaults plus their overrides. */
  @Field((_type) => [String])
  permissions: string[]

  /** What their role alone would give them — the page marks differences. */
  @Field((_type) => [String])
  role_defaults: string[]
}

const fail = (message: string, code = 400): UserMutationResponse => ({ code, success: false, message });
const ok = (message: string): UserMutationResponse => ({ code: 200, success: true, message });

/** Active users who would hold "user.manage" if `changed` replaced their
 *  current role / overrides. Used to refuse any change that leaves nobody
 *  able to manage users. */
async function managersAfter(changed: {
  user_id: number;
  role?: string;
  is_active?: number;
  overrides?: { permission: string; allowed: number }[];
}): Promise<number> {
  const users = await Users.find();
  const rows = await UserPermission.find();
  let count = 0;
  for (const u of users) {
    const isChanged = u.user_id === changed.user_id;
    const active = isChanged && changed.is_active !== undefined ? changed.is_active : u.is_active;
    if (active !== 1) continue;
    const role = isChanged && changed.role !== undefined ? changed.role : u.role;
    const overrides =
      isChanged && changed.overrides !== undefined
        ? changed.overrides
        : rows.filter((r) => r.user_id === u.user_id);
    if (applyOverrides(role, overrides).includes("user.manage")) count++;
  }
  return count;
}

const LAST_MANAGER = "At least one active user must keep the Users & permissions access";

function validateProfile(input: { display_name: string; username: string; phone: string; role: string }): string | null {
  if (!input.display_name?.trim()) return "Name is required";
  if (!input.username?.trim()) return "Username is required";
  if (/\s/.test(input.username.trim())) return "Username cannot contain spaces";
  if (!input.phone?.trim()) return "Phone is required";
  if (!isStaffRole(input.role)) return `Role must be one of ${STAFF_ROLES.join(", ")}`;
  return null;
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

  /** The caller's own effective permissions — what the frontend uses to decide
   *  which pages and buttons to show. */
  @UseMiddleware(checkAuth)
  @Query((_return) => [String])
  async my_permissions(@Ctx() { user }: Context): Promise<string[]> {
    return await effectivePermissions(user.user_id);
  }

  @UseMiddleware(checkAuth)
  @Query((_return) => UserPermissionsInfo)
  async user_permissions(@Arg("user_id", (_type) => ID) user_id: number): Promise<UserPermissionsInfo> {
    const u = await Users.findOne({ where: { user_id: Number(user_id) } });
    if (!u) throw new Error("User not found");
    const overrides = await UserPermission.find({ where: { user_id: u.user_id } });
    return {
      user_id: u.user_id,
      role: u.role,
      permissions: applyOverrides(u.role, overrides),
      role_defaults: roleDefaults(u.role),
    };
  }

  @UseMiddleware(checkAuth)
  @Mutation((_return) => UserMutationResponse)
  async create_user(
    @Arg("userInput")
    { username, password, display_name, phone, role }: RegisterInput,
  ): Promise<UserMutationResponse> {
    const invalid = validateProfile({ display_name, username, phone, role });
    if (invalid) return fail(invalid);
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    const existingUser = await Users.findOne({
      where: [{ username: username.trim() }, { phone: phone.trim() }],
    });

    if (existingUser) {
      return fail("User Already Register");
    }

    const hashedPassword = await hash(password, 12);

    await Users.insert({
      username: username.trim(),
      password: hashedPassword,
      phone: phone.trim(),
      display_name: display_name.trim(),
      role,
    });

    return ok("User Create Success");
  }

  @UseMiddleware(checkAuth)
  @Mutation((_return) => UserMutationResponse)
  async update_user(
    @Arg("user_id", (_type) => ID) user_id: number,
    @Arg("input") input: UpdateUserInput,
  ): Promise<UserMutationResponse> {
    const u = await Users.findOne({ where: { user_id: Number(user_id) } });
    if (!u) return fail("User not found", 404);
    // Kiosk service accounts are managed by `npm run kiosk:create-user`, never here.
    if (!isStaffRole(u.role)) return fail("This account cannot be edited here");

    const invalid = validateProfile(input);
    if (invalid) return fail(invalid);

    const clash = await Users.findOne({
      where: [{ username: input.username.trim() }, { phone: input.phone.trim() }],
    });
    if (clash && clash.user_id !== u.user_id) return fail("Username or phone is already used by another user");

    if (input.role !== u.role && (await managersAfter({ user_id: u.user_id, role: input.role })) === 0) {
      return fail(LAST_MANAGER);
    }

    u.display_name = input.display_name.trim();
    u.username = input.username.trim();
    u.phone = input.phone.trim();
    u.role = input.role;
    await u.save();
    return ok("User updated");
  }

  @UseMiddleware(checkAuth)
  @Mutation((_return) => UserMutationResponse)
  async set_user_active(
    @Arg("user_id", (_type) => ID) user_id: number,
    @Arg("active") active: boolean,
    @Ctx() { user }: Context
  ): Promise<UserMutationResponse> {
    const u = await Users.findOne({ where: { user_id: Number(user_id) } });
    if (!u) return fail("User not found", 404);
    if (!active && u.user_id === user.user_id) return fail("You cannot deactivate your own account");
    if (!active && (await managersAfter({ user_id: u.user_id, is_active: 0 })) === 0) {
      return fail(LAST_MANAGER);
    }

    u.is_active = active ? 1 : 0;
    // Deactivating ends every session: the refresh token is tied to tokenVersion.
    if (!active) u.tokenVersion += 1;
    await u.save();
    return ok(active ? "User activated" : "User deactivated");
  }

  @UseMiddleware(checkAuth)
  @Mutation((_return) => UserMutationResponse)
  async reset_user_password(
    @Arg("user_id", (_type) => ID) user_id: number,
    @Arg("new_password") new_password: string,
  ): Promise<UserMutationResponse> {
    const u = await Users.findOne({ where: { user_id: Number(user_id) } });
    if (!u) return fail("User not found", 404);
    if (!isStaffRole(u.role)) return fail("This account cannot be edited here");
    if (!new_password || new_password.length < MIN_PASSWORD_LENGTH) {
      return fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    u.password = await hash(new_password, 12);
    // Sign the user out everywhere, so the old password's sessions end too.
    u.tokenVersion += 1;
    await u.save();
    return ok("Password reset");
  }

  /** Set a user's permissions to exactly `permissions`. Stored as the
   *  differences from their role's defaults, so a later role change still
   *  moves them onto the new role's defaults for everything not overridden. */
  @UseMiddleware(checkAuth)
  @Mutation((_return) => UserMutationResponse)
  async set_user_permissions(
    @Arg("user_id", (_type) => ID) user_id: number,
    @Arg("permissions", (_type) => [String]) permissions: string[],
    @Ctx() { user }: Context
  ): Promise<UserMutationResponse> {
    const u = await Users.findOne({ where: { user_id: Number(user_id) } });
    if (!u) return fail("User not found", 404);
    if (!isStaffRole(u.role)) return fail("This account cannot be edited here");

    const unknown = permissions.filter((p) => !isPermission(p));
    if (unknown.length) return fail(`Unknown permission: ${unknown.join(", ")}`);

    const wanted = new Set(permissions as Permission[]);
    const defaults = new Set(roleDefaults(u.role));
    const overrides = PERMISSIONS.filter((p) => wanted.has(p) !== defaults.has(p)).map((p) => ({
      permission: p,
      allowed: wanted.has(p) ? 1 : 0,
    }));

    if (u.user_id === user.user_id && !wanted.has("user.manage")) {
      return fail("You cannot remove your own Users & permissions access");
    }
    if ((await managersAfter({ user_id: u.user_id, overrides })) === 0) return fail(LAST_MANAGER);

    await UserPermission.delete({ user_id: u.user_id });
    if (overrides.length) {
      await UserPermission.insert(overrides.map((o) => ({ user_id: u.user_id, ...o })));
    }
    return ok("Permissions saved");
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
      permissions: await effectivePermissions(existingUser.user_id),
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
