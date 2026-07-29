import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Upload metadata only — the bytes live on the file system under
 * UPLOADS_DIR, named by upload id (see src/server/storage.ts).
 */
export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Upload = typeof uploads.$inferSelect;
