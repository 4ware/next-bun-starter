import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // eslint-disable-next-line no-restricted-properties
    url: process.env.DATABASE_URL!,
  },
  casing: "snake_case",
});
