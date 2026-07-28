import { generatePicture, PICTURE_SIZES } from "@/server/picture";

/**
 * Statically cached image route (outside /api so the Elysia catch-all does
 * not own it). With cacheComponents, a handler with generateStaticParams and
 * no dynamic IO is prerendered: the PNG responses land in Next's incremental
 * cache — in production that is the Redis cache handler (cache-handler.cjs),
 * so the bytes are generated once and shared across instances.
 */
export function generateStaticParams() {
  return PICTURE_SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!PICTURE_SIZES.some((s) => s === size)) {
    return new Response("Not found", { status: 404 });
  }
  const png = generatePicture(size);

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
