import { and, eq } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { Elysia } from "elysia";
import { z } from "zod";
import { db } from "@/server/db";
import { uploads } from "@/server/db/schema";
import { readUploadFile } from "@/server/storage";
import { authPlugin } from "../auth-plugin";

/**
 * Serves uploaded images: ownership + content type come from the DB row,
 * the bytes from the file system. Upload ids are immutable (replacing a
 * todo image creates a new row), so responses can be cached indefinitely —
 * but privately, since they need the session.
 */
export const uploadsRoutes = new Elysia({ prefix: "/uploads" }).use(authPlugin).get(
  "/:id",
  async ({ params, user, status }) => {
    const [upload] = await db
      .select()
      .from(uploads)
      .where(and(eq(uploads.id, params.id), eq(uploads.userId, user.id)));
    if (!upload) return status(404, { error: "Not found" });

    const data = await readUploadFile(upload.id);
    if (!data) return status(404, { error: "Not found" });

    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": upload.contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  },
  {
    authenticated: true,
    params: createSelectSchema(uploads, { id: z.uuid("invalidId") }).pick({ id: true }),
  },
);
