import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

/** In-memory stand-in for the node-redis client used by cache-handler.cjs. */
const store = new Map<string, string>();
const sets = new Map<string, Set<string>>();
let failMode = false;

function guard() {
  if (failMode) throw new Error("connection refused");
}

const fakeClient = {
  on: () => fakeClient,
  connect: async () => fakeClient,
  get: async (key: string) => (guard(), store.get(key) ?? null),
  set: async (key: string, value: string) => (guard(), void store.set(key, value)),
  mGet: async (keys: string[]) => (guard(), keys.map((key) => store.get(key) ?? null)),
  sAdd: async (key: string, member: string) => {
    guard();
    if (!sets.has(key)) sets.set(key, new Set());
    sets.get(key)!.add(member);
  },
  sMembers: async (key: string) => (guard(), [...(sets.get(key) ?? [])]),
  expire: async () => 1,
  del: async (keyOrKeys: string | string[]) => {
    guard();
    for (const key of [keyOrKeys].flat()) {
      store.delete(key);
      sets.delete(key);
    }
  },
};

mock.module("redis", () => ({ createClient: () => fakeClient }));

type Handler = {
  get(key: string, ctx?: { softTags?: string[] }): Promise<{ value: unknown; lastModified: number } | null>;
  set(key: string, value: unknown, ctx?: { tags?: string[] }): Promise<void>;
  revalidateTag(tagOrTags: string | string[]): Promise<void>;
};

let handler: Handler;

beforeAll(async () => {
  const { default: RedisCacheHandler } = await import("../../cache-handler.cjs");
  handler = new RedisCacheHandler();
});

beforeEach(() => {
  store.clear();
  sets.clear();
  failMode = false;
});

describe("RedisCacheHandler", () => {
  test("round-trips an entry with its lastModified timestamp", async () => {
    await handler.set("page:/", { kind: "APP_PAGE", html: "<h1>hi</h1>" }, { tags: [] });

    const entry = await handler.get("page:/");
    expect(entry?.value).toEqual({ kind: "APP_PAGE", html: "<h1>hi</h1>" });
    expect(entry?.lastModified).toBeNumber();
  });

  test("misses on unknown keys", async () => {
    expect(await handler.get("nope")).toBeNull();
  });

  test("revives Buffers that went through JSON", async () => {
    await handler.set("route:/api", { body: Buffer.from("hello") });

    const entry = await handler.get("route:/api");
    const body = (entry?.value as { body: Buffer }).body;
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(body.toString()).toBe("hello");
  });

  test("revalidateTag removes tagged entries and leaves the rest", async () => {
    await handler.set("a", { v: 1 }, { tags: ["todos"] });
    await handler.set("b", { v: 2 }, { tags: ["other"] });

    await handler.revalidateTag("todos");

    expect(await handler.get("a")).toBeNull();
    expect((await handler.get("b"))?.value).toEqual({ v: 2 });
  });

  test("invalidates entries via soft tags (revalidatePath)", async () => {
    await handler.set("page:/dashboard", { v: 1 });
    await handler.revalidateTag("_N_T_/dashboard");

    expect(await handler.get("page:/dashboard", { softTags: ["_N_T_/dashboard"] })).toBeNull();
    // without the soft tag the entry is still there
    expect((await handler.get("page:/dashboard"))?.value).toEqual({ v: 1 });
  });

  test("degrades to cache misses when Redis is down", async () => {
    await handler.set("a", { v: 1 });
    failMode = true;

    expect(await handler.get("a")).toBeNull();
    await expect(handler.set("b", { v: 2 })).resolves.toBeUndefined();
    await expect(handler.revalidateTag("todos")).resolves.toBeUndefined();
  });
});
