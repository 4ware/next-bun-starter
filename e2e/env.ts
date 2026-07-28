export const PORT = 3000;
export const BASE_URL = `http://localhost:${PORT}`;

/**
 * Env for the app under test. Real env vars win (e.g. CI provides its own
 * DATABASE_URL); the fallbacks target a throwaway local Postgres on 55432,
 * out of the way of any dev database on the default port:
 *
 *   docker run -d --name next-bun-starter-e2e-pg -p 55432:5432 \
 *     -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=next_bun_starter_e2e \
 *     postgres:16-alpine
 */
export const serverEnv = {
  DATABASE_URL: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:55432/next_bun_starter_e2e",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "e2e-only-secret-not-for-production",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? BASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? BASE_URL,
};
