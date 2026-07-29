import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

// Test-only env defaults so server modules (db, auth) can be imported.
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET ??= "test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";

// Keep upload files out of the repo during tests.
const { tmpdir } = await import("node:os");
const { join } = await import("node:path");
process.env.UPLOADS_DIR ??= join(tmpdir(), `next-bun-starter-test-uploads-${process.pid}`);

const { afterEach, expect } = await import("bun:test");
const matchers = await import("@testing-library/jest-dom/matchers");
const { cleanup } = await import("@testing-library/react");

expect.extend(matchers.default ?? matchers);

afterEach(() => {
  cleanup();
});
