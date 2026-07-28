import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Validated environment, safe to import anywhere: on the client only the
 * `client`/`shared` sections exist — accessing a server var there throws
 * with a descriptive error instead of silently being undefined.
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
    REALTIME_PORT: z.coerce.number().int().default(3001),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
    NEXT_PUBLIC_REALTIME_URL: z.url().default("ws://localhost:3001"),
  },
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  // Next.js inlines NEXT_PUBLIC_*/NODE_ENV at build time, so client-visible
  // vars must be destructured explicitly; server vars are read from process.env.
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_REALTIME_URL: process.env.NEXT_PUBLIC_REALTIME_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
  // bun test registers happy-dom globals, so `window` exists there — without
  // this override t3-env would block server vars during tests.
  isServer: typeof window === "undefined" || process.env.NODE_ENV === "test",
});
