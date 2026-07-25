/**
 * Shared types for the realtime WebSocket channel. Imported by both the
 * standalone Elysia WS server (src/server/realtime) and the client hook,
 * so the wire format stays in sync.
 */

export type RealtimeUser = {
  id: string;
  name: string;
};

/** Server → client events. */
export type RealtimeEvent =
  | { type: "hello"; users: RealtimeUser[] }
  | { type: "join"; user: RealtimeUser; at: string }
  | { type: "leave"; user: RealtimeUser; at: string }
  | { type: "chat"; user: RealtimeUser; text: string; at: string };

/** Client → server message (validated server-side via the ws body schema). */
export type RealtimeClientMessage = {
  text: string;
};
