"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RealtimeClientMessage, RealtimeEvent, RealtimeUser } from "@/lib/realtime";
import { env } from "@/lib/env";

const REALTIME_URL = env.NEXT_PUBLIC_REALTIME_URL;

const RECONNECT_DELAY_MS = 2500;
const MAX_FEED_ITEMS = 100;

type ConnectionStatus = "connecting" | "open" | "closed";

type FeedItem = Exclude<RealtimeEvent, { type: "hello" }> & { key: string };

function useRealtime() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [users, setUsers] = useState<RealtimeUser[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let keyCounter = 0;

    function connect() {
      setStatus("connecting");
      const ws = new WebSocket(`${REALTIME_URL}/ws`);
      wsRef.current = ws;

      ws.onopen = () => setStatus("open");

      ws.onmessage = (e) => {
        const event = JSON.parse(String(e.data)) as RealtimeEvent;
        if (event.type === "hello") {
          setUsers(event.users);
          return;
        }
        if (event.type === "join") {
          setUsers((prev) => (prev.some((u) => u.id === event.user.id) ? prev : [...prev, event.user]));
        } else if (event.type === "leave") {
          setUsers((prev) => prev.filter((u) => u.id !== event.user.id));
        }
        setFeed((prev) => [...prev, { ...event, key: `${event.at}-${keyCounter++}` }].slice(-MAX_FEED_ITEMS));
      };

      ws.onclose = () => {
        if (disposed) return;
        setStatus("closed");
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  const send = useCallback((message: RealtimeClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return { status, users, feed, send };
}

export function LivePanel() {
  const t = useTranslations("Live");
  const { status, users, feed, send } = useRealtime();
  const [text, setText] = useState("");
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [feed]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    send({ text: trimmed });
    setText("");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className={`size-2 rounded-full ${
                status === "open" ? "bg-emerald-500" : status === "connecting" ? "bg-amber-500" : "bg-destructive"
              }`}
            />
            {status === "open" ? t("connected") : status === "connecting" ? t("connecting") : t("reconnecting")}
          </span>
        </div>
        <CardDescription>
          {users.length === 0 ? t("nobodyOnline") : t("online", { names: users.map((u) => u.name).join(", ") })}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="max-h-64 space-y-2 overflow-y-auto text-sm" role="log" aria-label={t("activityLog")}>
          {feed.length === 0 && <p className="text-muted-foreground">{t("noActivity")}</p>}
          {feed.map((item) => (
            <p key={item.key}>
              {item.type === "chat" ? (
                <>
                  <span className="font-medium">{item.user.name}:</span> {item.text}
                </>
              ) : (
                <span className="text-muted-foreground">
                  {item.type === "join" ? t("joined", { name: item.user.name }) : t("left", { name: item.user.name })}
                </span>
              )}
            </p>
          ))}
          <div ref={feedEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("placeholder")}
            maxLength={500}
            aria-label={t("message")}
          />
          <Button type="submit" disabled={status !== "open" || !text.trim()}>
            {t("send")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
