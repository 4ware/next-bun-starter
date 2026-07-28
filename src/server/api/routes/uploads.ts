import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { uploads } from "@/server/db/schema";
import { authPlugin } from "../auth-plugin";

/**
 * Serves uploaded images, scoped to the owning user. Upload ids are
 * immutable (replacing a todo image creates a new row), so responses can
 * be cached indefinitely — but privately, since they need the session.
 */
export const uploadsRoutes = new Elysia({ prefix: "/uploads" }).use(authPlugin).get(
  "/:id",
  async ({ params, user, status }) => {
    const [upload] = await db
      .select()
      .from(uploads)
      .where(and(eq(uploads.id, params.id), eq(uploads.userId, user.id)));
    if (!upload) return status(404, { error: "Not found" });

    return new Response(new Uint8Array(upload.data), {
      headers: {
        "Content-Type": upload.contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  },
  {
    authenticated: true,
    params: t.Object({ id: t.String({ format: "uuid" }) }),
  },
);
