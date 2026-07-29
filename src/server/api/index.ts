import { Elysia } from "elysia";
import { todosRoutes } from "./routes/todos";
import { uploadsRoutes } from "./routes/uploads";

/**
 * The Elysia app is mounted inside Next.js via the optional catch-all
 * route handler at src/app/api/[[...slugs]]/route.ts.
 *
 * Note: /api/auth/* is handled by better-auth's own route handler
 * (src/app/api/auth/[...all]/route.ts), which takes precedence over
 * this catch-all because it is the more specific route.
 */
export const api = new Elysia({ prefix: "/api" })
  // Normalize every error into { error: string } so clients can toast it directly.
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      // zod (Standard Schema) issues carry `message`; TypeBox ones `summary`
      const [first] = error.all as unknown as Array<Record<string, unknown>>;
      const message =
        (typeof first?.message === "string" && first.message) ||
        (typeof first?.summary === "string" && first.summary) ||
        "Invalid request";
      return { error: message };
    }
    if (code === "PARSE") {
      set.status = 400;
      return { error: "Invalid request body" };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Not found" };
    }
    console.error(error);
    set.status = 500;
    return { error: "Internal server error" };
  })
  .get("/health", () => ({ status: "ok" as const }))
  .use(todosRoutes)
  .use(uploadsRoutes);

export type Api = typeof api;
