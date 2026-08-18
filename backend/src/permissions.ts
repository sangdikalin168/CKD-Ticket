import { shield, rule, allow, deny } from "graphql-shield";
import { verify } from "jsonwebtoken";
import { Context } from "./Context/Context";

const isAuthenticated = rule({ cache: "contextual" })(
  (_parent, _args, ctx: Context) => {
    try {
      const authHeader = ctx.req.header("Authorization");
      const token = authHeader && authHeader.split(" ")[1];
      if (!token) return new Error("Not authenticated");
      verify(token, process.env.ACCESS_TOKEN_SECRET as string);
      return true;
    } catch {
      return new Error("Not authenticated");
    }
  }
);

export const permissions = shield(
  {
    Query: {
      "*": isAuthenticated,
    },
    Mutation: {
      "*": isAuthenticated,
      // Public — no token needed. `login` is the ONLY unauthenticated mutation:
      // it is the one operation that cannot require a token, because obtaining
      // the token is its whole purpose.
      //
      // `logout` used to be listed here too. It took a caller-supplied user_id
      // and bumped that user's tokenVersion, so anyone on the internet could
      // invalidate any user's session without logging in. It now authenticates
      // like everything else and derives the id from the token.
      login: allow,
    },
  },
  {
    // NOTE: do NOT set `fallbackRule: isAuthenticated` here. The `"*"` rules
    // above already gate every query/mutation; a global fallback also clamps
    // every *response* object subfield, which makes `login` impossible (the
    // client can't read the access token without already having one).
    // graphql-shield's default fallbackRule is `allow`, which is what we want.
    allowExternalErrors: true,
  }
);
