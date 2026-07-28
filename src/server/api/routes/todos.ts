import { revalidateTag } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { todos } from "@/server/db/schema";
import { todosTag } from "@/server/todos-cache";
import { authPlugin } from "../auth-plugin";

// The Elysia app runs inside a Next.js route handler, where revalidateTag
// invalidates the "use cache" entry from src/server/todos-cache.ts.
// { expire: 0 } expires the entry immediately (read-your-writes) instead of
// "max"'s serve-stale-while-revalidating. The catch keeps the routes usable
// outside a Next request context (e.g. tests).
function revalidateTodosCache(userId: string) {
  try {
    revalidateTag(todosTag(userId), { expire: 0 });
  } catch (err) {
    console.error("[todos] revalidateTag failed:", err);
  }
}

export const todosRoutes = new Elysia({ prefix: "/todos" })
  .use(authPlugin)
  .get("/", ({ user }) => db.select().from(todos).where(eq(todos.userId, user.id)).orderBy(desc(todos.createdAt)), {
    authenticated: true,
  })
  .post(
    "/",
    async ({ body, user, status }) => {
      const [todo] = await db.insert(todos).values({ title: body.title, userId: user.id }).returning();
      revalidateTodosCache(user.id);
      return status(201, todo);
    },
    {
      authenticated: true,
      body: t.Object({ title: t.String({ minLength: 1, maxLength: 200 }) }),
    },
  )
  .patch(
    "/:id",
    async ({ params, body, user, status }) => {
      const [todo] = await db
        .update(todos)
        .set(body)
        .where(and(eq(todos.id, params.id), eq(todos.userId, user.id)))
        .returning();
      if (!todo) return status(404, { error: "Not found" });
      revalidateTodosCache(user.id);
      return todo;
    },
    {
      authenticated: true,
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      // minProperties rejects an empty patch, which drizzle's .set() cannot handle
      body: t.Object(
        { title: t.Optional(t.String({ minLength: 1, maxLength: 200 })), done: t.Optional(t.Boolean()) },
        { minProperties: 1 },
      ),
    },
  )
  .delete(
    "/:id",
    async ({ params, user, status }) => {
      const [todo] = await db
        .delete(todos)
        .where(and(eq(todos.id, params.id), eq(todos.userId, user.id)))
        .returning();
      if (!todo) return status(404, { error: "Not found" });
      revalidateTodosCache(user.id);
      return { deleted: todo.id };
    },
    {
      authenticated: true,
      params: t.Object({ id: t.String({ format: "uuid" }) }),
    },
  );
