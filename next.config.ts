import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  typedRoutes: true,
  // Cache Components: everything is dynamic unless marked "use cache";
  // uncached IO (headers/session/db) must render inside <Suspense>.
  cacheComponents: true,
  // Redis-backed incremental cache for production (build + start), shared
  // across instances and surviving restarts. Dev/tests keep the default
  // in-memory cache. cacheMaxMemorySize: 0 disables the in-memory LRU so
  // Redis is the single source of truth.
  ...(process.env.NODE_ENV === "production"
    ? { cacheHandler: path.resolve("cache-handler.cjs"), cacheMaxMemorySize: 0 }
    : {}),
};

export default withNextIntl(nextConfig);
