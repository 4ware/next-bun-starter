import { describe, expect, test } from "bun:test";
import { api } from "./index";

describe("Elysia API", () => {
  test("GET /api/health responds with ok", async () => {
    const res = await api.handle(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  test("GET /api/todos without a session is unauthorized", async () => {
    const res = await api.handle(new Request("http://localhost/api/todos"));
    expect(res.status).toBe(401);
  });
});
