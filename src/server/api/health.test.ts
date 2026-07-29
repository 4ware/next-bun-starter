import { describe, expect, test } from "bun:test";
import { NativeRequest } from "@/test/setup";
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

  test("validation errors are English by default", async () => {
    const res = await api.handle(
      new Request("http://localhost/api/todos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "" }),
      }),
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "Title must not be empty" });
  });

  test("validation errors follow the NEXT_LOCALE cookie", async () => {
    // NativeRequest: happy-dom's Request drops the forbidden Cookie header
    const res = await api.handle(
      new NativeRequest("http://localhost/api/todos", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: "NEXT_LOCALE=de" },
        body: JSON.stringify({ title: "" }),
      }),
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "Der Titel darf nicht leer sein" });
  });

  test("validation errors fall back to the Accept-Language header", async () => {
    const res = await api.handle(
      new Request("http://localhost/api/todos/not-a-uuid", {
        method: "DELETE",
        headers: { "accept-language": "de-DE,de;q=0.9,en;q=0.8" },
      }),
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "Ungültige ID" });
  });

  test("unknown API routes return a normalized 404", async () => {
    const res = await api.handle(new Request("http://localhost/api/does-not-exist"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });
});
