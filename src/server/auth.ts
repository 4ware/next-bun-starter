import { i18n } from "@better-auth/i18n";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";
import { de } from "@/server/auth-i18n";
import { env } from "@/lib/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  // nextCookies must stay last — makes cookies work in Next.js server actions.
  plugins: [
    organization(),
    // Translates error messages; locale comes from the Accept-Language header
    // or a "locale" cookie, falling back to the built-in English messages.
    i18n({
      translations: { de },
      detection: ["header", "cookie"],
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
