import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { NativeWebSocket } from "@/test/setup";
import { createRealtime } from "./index";

// Fake session injected via the factory — no auth/module mocking involved.
const realtime = createRealtime(async () => ({ id: "u1", name: "Alice" }));
let port: number;

beforeAll(() => {
  realtime.listen(0);
  port = realtime.server!.port!;
});

afterAll(async () => {
  try {
    // true → force-close remaining connections instead of waiting for them
    await realtime.stop(true);
  } catch {}
});

type Received = Record<string, unknown> & { type?: string };

async function connect(): Promise<{ ws: WebSocket; received: Received[] }> {
  // Bun-specific second argument: send the app origin so the server's
  // origin check accepts the handshake.
  const ws = new NativeWebSocket(`ws://localhost:${port}/ws`, {
    headers: { origin: process.env.BETTER_AUTH_URL! },
  } as unknown as string[]);
  const received: Received[] = [];
  ws.onmessage = (e) => {
    try {
      received.push(JSON.parse(String(e.data)) as Received);
    } catch {
      received.push({ type: "non-json", raw: String(e.data) });
    }
  };
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error("connection failed"));
  });
  return { ws, received };
}

async function until(predicate: () => boolean, timeoutMs = 2000) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error("condition not met in time");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe("realtime ws server", () => {
  test("greets with the online users and echoes chat messages", async () => {
    const { ws, received } = await connect();

    await until(() => received.some((m) => m.type === "hello"));
    ws.send(JSON.stringify({ text: "hi there" }));
    await until(() => received.some((m) => m.type === "chat"));

    const chat = received.find((m) => m.type === "chat")!;
    expect(chat.text).toBe("hi there");
    expect(chat.user).toEqual({ id: "u1", name: "Alice" });
    ws.close();
  });

  test("rejects messages failing the zod schema but keeps the socket alive", async () => {
    const { ws, received } = await connect();
    await until(() => received.some((m) => m.type === "hello"));

    ws.send(JSON.stringify({ text: "" })); // fails min(1)
    ws.send(JSON.stringify({ nope: true })); // missing text
    ws.send(JSON.stringify({ text: "still works" }));

    await until(() => received.some((m) => m.type === "chat"));
    const chats = received.filter((m) => m.type === "chat");
    expect(chats).toHaveLength(1);
    expect(chats[0]!.text).toBe("still works");
    ws.close();
  });
});
