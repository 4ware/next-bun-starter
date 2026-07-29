import { z } from "zod";

/**
 * Zod schemas for the todos API. Elysia 1.4 accepts Standard Schema
 * validators directly in route configs, so these replace TypeBox (t.*).
 */

export const todoIdParamsSchema = z.object({ id: z.uuid() });

export const createTodoSchema = z.object({ title: z.string().min(1).max(200) });

// zod strips unknown keys, so the refine also rejects patches that only
// contained unknown fields — drizzle's .set() cannot handle an empty object
export const patchTodoSchema = z
  .object({ title: z.string().min(1).max(200).optional(), done: z.boolean().optional() })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field must be provided" });

export const todoImageSchema = z.object({
  file: z
    .file()
    .max(5 * 1024 * 1024, "Image must be 5 MB or smaller")
    .mime(["image/jpeg", "image/png", "image/webp", "image/gif"]),
});
