import { describe, expect, test } from "bun:test";
import { signInSchema, signUpSchema } from "./auth";

describe("signInSchema", () => {
  test("accepts valid credentials", () => {
    const result = signInSchema.safeParse({ email: "kai@example.com", password: "supersecret" });
    expect(result.success).toBe(true);
  });

  test("rejects an invalid email", () => {
    const result = signInSchema.safeParse({ email: "not-an-email", password: "supersecret" });
    expect(result.success).toBe(false);
  });

  test("rejects a short password", () => {
    const result = signInSchema.safeParse({ email: "kai@example.com", password: "short" });
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  test("rejects mismatched passwords", () => {
    const result = signUpSchema.safeParse({
      name: "Kai",
      email: "kai@example.com",
      password: "supersecret",
      confirmPassword: "different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirmPassword"))).toBe(true);
    }
  });
});
