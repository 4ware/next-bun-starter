import { Elysia } from "elysia";
import { auth } from "@/server/auth";
import { env } from "@/lib/env";
import { realtimeClientMessageSchema, type RealtimeEvent, type RealtimeUser } from "@/lib/realtime";

const LOBBY = "lobby";

/** Resolves the connecting user from the upgrade request headers. */
type ResolveUser = (headers: Headers) => Promise<RealtimeUser | null>;

const resolveSessionUser: ResolveUser = async (headers) => {
  const session = await auth.api.getSession({ headers });
  return session ? { id: session.user.id, name: session.user.name } : null;
};

/**
 * Standalone realtime Elysia app. Next.js route handlers cannot upgrade to
 * WebSocket, so this runs as its own Bun server (see serve.ts) and shares
 * the better-auth instance with the rest of the app. The session cookie is
 * sent by the browser on the upgrade request (same host, different port),
 * so auth works exactly like the HTTP API: no session → the upgrade is
 * rejected with 401 before the socket opens.
 *
 * The factory takes the user resolver as a parameter so tests can inject a
 * fake session without mocking the auth module.
 */
export function createRealtime(resolveUser: ResolveUser = resolveSessionUser) {
  /** Connected sockets by ws id — one user can hold several connections (tabs). */
  const connections = new Map<string, RealtimeUser>();

  function onlineUsers(): RealtimeUser[] {
    const byId = new Map<string, RealtimeUser>();
    for (const user of connections.values()) byId.set(user.id, user);
    return [...byId.values()];
  }

  return (
    new Elysia()
      // Registered before .resolve() so it stays public — hooks only apply to
      // routes defined after them.
      .get("/health", () => ({ status: "ok" as const }))
      .resolve(async ({ request, status }) => {
        // WebSocket handshakes are not subject to CORS — reject foreign origins.
        const origin = request.headers.get("origin");
        if (origin && origin !== env.BETTER_AUTH_URL) {
          return status(403, { error: "Forbidden origin" });
        }
        const user = await resolveUser(request.headers);
        if (!user) return status(401, { error: "Unauthorized" });
        return { user };
      })
      .ws("/ws", {
        body: realtimeClientMessageSchema,
        open(ws) {
          const { user } = ws.data;
          const wasOnline = onlineUsers().some((u) => u.id === user.id);
          connections.set(ws.id, user);
          ws.subscribe(LOBBY);
          ws.send({ type: "hello", users: onlineUsers() } satisfies RealtimeEvent);
          if (!wasOnline) {
            ws.publish(LOBBY, { type: "join", user, at: new Date().toISOString() } satisfies RealtimeEvent);
          }
        },
        message(ws, { text }) {
          const event: RealtimeEvent = { type: "chat", user: ws.data.user, text, at: new Date().toISOString() };
          // publish skips the sender — echo back so they see their own message.
          ws.publish(LOBBY, event);
          ws.send(event);
        },
        close(ws) {
          const user = connections.get(ws.id);
          connections.delete(ws.id);
          if (user && !onlineUsers().some((u) => u.id === user.id)) {
            ws.publish(LOBBY, { type: "leave", user, at: new Date().toISOString() } satisfies RealtimeEvent);
          }
        },
      })
  );
}

export const realtime = createRealtime();

export type Realtime = typeof realtime;
