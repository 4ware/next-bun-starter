import { Elysia } from "elysia";
import { auth } from "@/server/auth";

/**
 * Resolves the better-auth session for incoming requests and exposes
 * `user` / `session` in the route context. Routes using this plugin
 * return 401 automatically when no session exists.
 */
export const authPlugin = new Elysia({ name: "auth" }).macro({
  authenticated: {
    async resolve({ status, request }) {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) return status(401, { error: "Unauthorized" });
      return { user: session.user, session: session.session };
    },
  },
});
