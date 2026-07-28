import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RealtimeEvent } from "@/lib/realtime";

/**
 * Minimal stand-in for the browser WebSocket: records sent frames and lets
 * tests drive the lifecycle (open/message) synchronously inside act().
 */
class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  url: string;
  readyState = FakeWebSocket.CONNECTING;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string | URL) {
    this.url = String(url);
    FakeWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  message(event: RealtimeEvent) {
    this.onmessage?.({ data: JSON.stringify(event) });
  }
}

let LivePanel: typeof import("./live-panel").LivePanel;

const originalWebSocket = global.WebSocket;

beforeAll(async () => {
  global.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  ({ LivePanel } = await import("./live-panel"));
});

afterAll(() => {
  global.WebSocket = originalWebSocket;
});

beforeEach(() => {
  FakeWebSocket.instances = [];
});

function renderConnected() {
  render(<LivePanel />);
  const ws = FakeWebSocket.instances[0]!;
  act(() => ws.open());
  return ws;
}

const alice = { id: "1", name: "Alice" };

describe("LivePanel", () => {
  test("shows the connecting state until the socket opens", () => {
    render(<LivePanel />);
    expect(screen.getByText("Connecting…")).toBeInTheDocument();

    act(() => FakeWebSocket.instances[0]!.open());
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  test("lists online users from the hello event", () => {
    const ws = renderConnected();

    act(() => ws.message({ type: "hello", users: [alice, { id: "2", name: "Bob" }] }));
    expect(screen.getByText("Online: Alice, Bob")).toBeInTheDocument();
  });

  test("renders chat messages and join/leave activity in the feed", () => {
    const ws = renderConnected();

    act(() => {
      ws.message({ type: "join", user: alice, at: "2026-07-28T10:00:00Z" });
      ws.message({ type: "chat", user: alice, text: "hi there", at: "2026-07-28T10:00:01Z" });
    });

    expect(screen.getByText("Alice joined")).toBeInTheDocument();
    expect(screen.getByText("Alice:")).toBeInTheDocument();
    expect(screen.getByText(/hi there/)).toBeInTheDocument();

    act(() => ws.message({ type: "leave", user: alice, at: "2026-07-28T10:00:02Z" }));
    expect(screen.getByText("Alice left")).toBeInTheDocument();
    expect(screen.getByText("Nobody online")).toBeInTheDocument();
  });

  test("sends the trimmed message and clears the input", async () => {
    const user = userEvent.setup();
    const ws = renderConnected();

    const input = screen.getByLabelText("Message");
    await user.type(input, "  hello world  ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(ws.sent).toEqual([JSON.stringify({ text: "hello world" })]);
    expect(input).toHaveValue("");
  });

  test("disables send while disconnected", async () => {
    render(<LivePanel />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Message"), "hello");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
