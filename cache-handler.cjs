/**
 * Redis-backed Next.js incremental cache handler (ISR pages, fetch data
 * cache, revalidateTag/revalidatePath). Wired up in next.config.ts for
 * production only; dev and tests keep Next's default in-memory cache.
 *
 * Plain CommonJS because Next.js require()s this file at runtime — it cannot
 * go through the TS build, so REDIS_URL is read from process.env directly
 * instead of src/lib/env.ts.
 */
const { createClient } = require("redis");

const KEY_PREFIX = "next-cache:";
const TAG_INDEX_PREFIX = "next-cache-tag:"; // set of cache keys per tag
const TAG_TS_PREFIX = "next-cache-tag-ts:"; // last revalidation time per tag

// Safety cap so unused entries don't pile up forever. ISR re-generates
// entries long before this; Next decides staleness itself via lastModified.
const TTL_SECONDS = 60 * 60 * 24 * 7;

let clientPromise = null;
let unavailableLogged = false;

function getClient() {
  if (!clientPromise) {
    const client = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:6379" });
    client.on("error", () => {}); // failures surface as rejected commands in withRedis
    clientPromise = client.connect().then(() => client);
  }
  return clientPromise;
}

/** Run a Redis operation, degrading to a cache miss when Redis is down. */
async function withRedis(fn, fallback) {
  try {
    return await fn(await getClient());
  } catch (err) {
    if (!unavailableLogged) {
      unavailableLogged = true;
      console.warn(`[cache-handler] Redis unavailable, serving cache misses: ${err?.message ?? err}`);
    }
    return fallback;
  }
}

// Route/page bodies contain Buffers, which JSON.stringify turns into
// { type: "Buffer", data: [...] } — revive them on the way out.
function reviveBuffers(_key, value) {
  if (value && typeof value === "object" && value.type === "Buffer" && Array.isArray(value.data)) {
    return Buffer.from(value.data);
  }
  return value;
}

module.exports = class RedisCacheHandler {
  async get(key, ctx = {}) {
    return withRedis(async (redis) => {
      const raw = await redis.get(KEY_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw, reviveBuffers);
      // Treat the entry as gone if any of its tags — or the request's
      // implicit soft tags (revalidatePath) — were revalidated after it
      // was stored.
      const tags = [...(entry.tags ?? []), ...(ctx.softTags ?? [])];
      if (tags.length > 0) {
        const stamps = await redis.mGet(tags.map((tag) => TAG_TS_PREFIX + tag));
        if (stamps.some((ts) => ts && Number(ts) >= entry.lastModified)) return null;
      }
      return { value: entry.value, lastModified: entry.lastModified };
    }, null);
  }

  async set(key, value, ctx = {}) {
    await withRedis(async (redis) => {
      const entry = { value, lastModified: Date.now(), tags: ctx.tags ?? [] };
      await redis.set(KEY_PREFIX + key, JSON.stringify(entry), { EX: TTL_SECONDS });
      for (const tag of entry.tags) {
        await redis.sAdd(TAG_INDEX_PREFIX + tag, key);
        await redis.expire(TAG_INDEX_PREFIX + tag, TTL_SECONDS);
      }
    }, undefined);
  }

  async revalidateTag(tagOrTags) {
    const tags = [tagOrTags].flat();
    await withRedis(async (redis) => {
      for (const tag of tags) {
        // Timestamp first: entries tagged only implicitly (softTags) are
        // invalidated through the comparison in get().
        await redis.set(TAG_TS_PREFIX + tag, String(Date.now()), { EX: TTL_SECONDS });
        const keys = await redis.sMembers(TAG_INDEX_PREFIX + tag);
        if (keys.length > 0) await redis.del(keys.map((key) => KEY_PREFIX + key));
        await redis.del(TAG_INDEX_PREFIX + tag);
      }
    }, undefined);
  }

  resetRequestCache() {}
};
