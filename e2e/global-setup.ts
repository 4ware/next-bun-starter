import { execSync } from "node:child_process";
import { serverEnv } from "./env";

/** Sync the Drizzle schema into the e2e database before the server boots. */
export default function globalSetup() {
  try {
    execSync("bunx drizzle-kit push --force", {
      stdio: "pipe",
      env: { ...process.env, ...serverEnv },
    });
  } catch (err) {
    const detail = err instanceof Error && "stderr" in err ? String((err as { stderr: unknown }).stderr) : String(err);
    throw new Error(
      `Could not prepare the e2e database at ${serverEnv.DATABASE_URL}.\n` +
        `Is Postgres running? See e2e/env.ts for a one-line docker command.\n\n${detail}`,
    );
  }
}
