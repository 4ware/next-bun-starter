import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { todos } from "@/server/db/schema";

/**
 * Zod schemas for the todos API, derived from the drizzle table where
 * possible so column changes propagate into validation. Only fields the
 * forms actually submit are picked (title/done) — ids, userId, imageId and
 * timestamps are server-managed. Length rules are layered on via the
 * drizzle-zod refinement argument (the DB column is unbounded `text`).
 */

const titleRules = { title: (schema: z.ZodString) => schema.min(1).max(200) };

export const todoIdParamsSchema = createSelectSchema(todos).pick({ id: true });

export const createTodoSchema = createInsertSchema(todos, titleRules).pick({ title: true });

// zod strips unknown keys, so the refine also rejects patches that only
// contained unknown fields — drizzle's .set() cannot handle an empty object
export const patchTodoSchema = createUpdateSchema(todos, titleRules)
  .pick({ title: true, done: true })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field must be provided" });

// not a DB field — the file arrives as multipart and is stored on disk
export const todoImageSchema = z.object({
  file: z
    .file()
    .max(5 * 1024 * 1024, "Image must be 5 MB or smaller")
    .mime(["image/jpeg", "image/png", "image/webp", "image/gif"]),
});
