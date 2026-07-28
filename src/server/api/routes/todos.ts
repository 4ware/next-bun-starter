import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { todos } from "@/server/db/schema";
import { authPlugin } from "../auth-plugin";

export const todosRoutes = new Elysia({ prefix: "/todos" })
  .use(authPlugin)
  .get("/", ({ user }) => db.select().from(todos).where(eq(todos.userId, user.id)).orderBy(desc(todos.createdAt)), {
    authenticated: true,
  })
  .post(
    "/",
    async ({ body, user, status }) => {
      const [todo] = await db.insert(todos).values({ title: body.title, userId: user.id }).returning();
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
      return { deleted: todo.id };
    },
    {
      authenticated: true,
      params: t.Object({ id: t.String({ format: "uuid" }) }),
    },
  );
