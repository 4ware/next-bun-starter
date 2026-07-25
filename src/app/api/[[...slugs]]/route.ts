import { api } from "@/server/api";

/**
 * Mounts the Elysia app on all /api/* routes (except /api/auth/*,
 * which is matched by the more specific better-auth route).
 */
export const GET = api.handle;
export const POST = api.handle;
export const PATCH = api.handle;
export const PUT = api.handle;
export const DELETE = api.handle;
