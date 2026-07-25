import { Elysia } from "elysia";
import { todosRoutes } from "./routes/todos";

/**
 * The Elysia app is mounted inside Next.js via the optional catch-all
 * route handler at src/app/api/[[...slugs]]/route.ts.
 *
 * Note: /api/auth/* is handled by better-auth's own route handler
 * (src/app/api/auth/[...all]/route.ts), which takes precedence over
 * this catch-all because it is the more specific route.
 */
export const api = new Elysia({ prefix: "/api" })
  .get("/health", () => ({ status: "ok" as const }))
  .use(todosRoutes);

export type Api = typeof api;
