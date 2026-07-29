import { revalidateTag } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { todos, uploads } from "@/server/db/schema";
import { deleteUploadFile, saveUploadFile } from "@/server/storage";
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
  .post(
    "/:id/image",
    async ({ params, body, user, status }) => {
      const [todo] = await db
        .select()
        .from(todos)
        .where(and(eq(todos.id, params.id), eq(todos.userId, user.id)));
      if (!todo) return status(404, { error: "Not found" });

      const data = Buffer.from(await body.file.arrayBuffer());
      const [upload] = await db
        .insert(uploads)
        .values({ userId: user.id, contentType: body.file.type })
        .returning({ id: uploads.id });
      await saveUploadFile(upload!.id, data);
      const [updated] = await db
        .update(todos)
        .set({ imageId: upload!.id })
        .where(eq(todos.id, todo.id))
        .returning();
      // replaced image is no longer referenced — drop row and file
      if (todo.imageId) {
        await db.delete(uploads).where(eq(uploads.id, todo.imageId));
        await deleteUploadFile(todo.imageId);
      }

      revalidateTodosCache(user.id);
      return updated;
    },
    {
      authenticated: true,
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({
        file: t.File({ type: ["image/jpeg", "image/png", "image/webp", "image/gif"], maxSize: "5m" }),
      }),
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
      if (todo.imageId) {
        await db.delete(uploads).where(eq(uploads.id, todo.imageId));
        await deleteUploadFile(todo.imageId);
      }
      revalidateTodosCache(user.id);
      return { deleted: todo.id };
    },
    {
      authenticated: true,
      params: t.Object({ id: t.String({ format: "uuid" }) }),
    },
  );
