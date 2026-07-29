import { describe, expect, test } from "bun:test";
import { createTodoSchema, patchTodoSchema, todoIdParamsSchema } from "./todos";

describe("createTodoSchema (derived from drizzle)", () => {
  test("accepts a valid title and strips non-form fields", () => {
    const result = createTodoSchema.safeParse({ title: "Water the plants", userId: "u1", done: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ title: "Water the plants" });
  });

  test("rejects an empty title", () => {
    expect(createTodoSchema.safeParse({ title: "" }).success).toBe(false);
  });

  test("rejects an overlong title", () => {
    expect(createTodoSchema.safeParse({ title: "x".repeat(201) }).success).toBe(false);
  });
});

describe("patchTodoSchema (derived from drizzle)", () => {
  test("accepts partial updates of form fields", () => {
    expect(patchTodoSchema.safeParse({ done: true }).success).toBe(true);
    expect(patchTodoSchema.safeParse({ title: "New title" }).success).toBe(true);
  });

  test("rejects an empty patch, including one of only unknown fields", () => {
    expect(patchTodoSchema.safeParse({}).success).toBe(false);
    expect(patchTodoSchema.safeParse({ userId: "sneaky" }).success).toBe(false);
  });

  test("rejects an invalid title in a patch", () => {
    expect(patchTodoSchema.safeParse({ title: "" }).success).toBe(false);
  });
});

describe("todoIdParamsSchema (derived from drizzle)", () => {
  test("accepts a uuid and rejects non-uuids", () => {
    expect(todoIdParamsSchema.safeParse({ id: "6f1f0f0a-0000-4000-8000-000000000001" }).success).toBe(true);
    // the uuid column must map to real uuid validation, not a plain string
    expect(todoIdParamsSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
  });
});
