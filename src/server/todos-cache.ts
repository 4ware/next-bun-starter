import { cacheLife, cacheTag } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { todos } from "@/server/db/schema";
import type { Todo } from "@/lib/todos";

/** Cache tag for one user's todo list; revalidated by the mutation routes. */
export function todosTag(userId: string) {
  return `todos-${userId}`;
}

/**
 * Per-user todo list as a Cache Component ("use cache"): the result is cached
 * with userId in the cache key, tagged so the Elysia mutation routes can
 * revalidate it, and kept for hours since every write invalidates explicitly.
 * Returns the same wire shape the /api/todos route produces.
 */
export async function getTodosForUser(userId: string): Promise<Todo[]> {
  "use cache";
  cacheTag(todosTag(userId));
  cacheLife("hours");

  const rows = await db.select().from(todos).where(eq(todos.userId, userId)).orderBy(desc(todos.createdAt));
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}
