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

  test("POST /api/todos with an empty title returns a normalized 422", async () => {
    const res = await api.handle(
      new Request("http://localhost/api/todos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "" }),
      }),
    );
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string };
    expect(typeof body.error).toBe("string");
    expect(body.error.length).toBeGreaterThan(0);
  });

  test("PATCH /api/todos/:id with an empty body returns 422", async () => {
    const res = await api.handle(
      new Request("http://localhost/api/todos/6f1f0f0a-0000-4000-8000-000000000000", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ error: expect.any(String) });
  });

  test("unknown API routes return a normalized 404", async () => {
    const res = await api.handle(new Request("http://localhost/api/does-not-exist"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });
});
