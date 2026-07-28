"use client";

import { useEffect, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/** Wire shape of a todo — createdAt arrives as an ISO string over JSON. */
type Todo = { id: string; title: string; done: boolean; userId: string; createdAt: string };

/**
 * Fetch wrapper for the Elysia API. Non-2xx responses carry a normalized
 * { error: string } body (see the onError hook in src/server/api/index.ts),
 * which is thrown here so callers can hand it straight to sonner.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
    });
  } catch {
    throw new Error("Network error — could not reach the server");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong";
}

export function TodoPanel() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    request<Todo[]>("/api/todos")
      .then(setTodos)
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setPending(true);
    try {
      const todo = await request<Todo>("/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: trimmed }),
      });
      setTodos((prev) => [todo, ...prev]);
      setTitle("");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleToggle(todo: Todo) {
    // Optimistic flip; revert and toast if the server rejects it.
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)));
    try {
      await request<Todo>(`/api/todos/${todo.id}`, {
        method: "PATCH",
        body: JSON.stringify({ done: !todo.done }),
      });
    } catch (err) {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: todo.done } : t)));
      toast.error(errorMessage(err));
    }
  }

  async function handleDelete(todo: Todo) {
    try {
      await request<{ deleted: string }>(`/api/todos/${todo.id}`, { method: "DELETE" });
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos</CardTitle>
        <CardDescription>Backed by the Elysia API at /api/todos — errors surface as toasts.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs doing?"
            maxLength={200}
            aria-label="New todo title"
          />
          <Button type="submit" disabled={pending || !title.trim()}>
            Add
          </Button>
        </form>
        <ul className="space-y-2 text-sm">
          {loading && <li className="text-muted-foreground">Loading…</li>}
          {!loading && todos.length === 0 && <li className="text-muted-foreground">Nothing yet.</li>}
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => handleToggle(todo)}
                aria-label={`Mark "${todo.title}" as ${todo.done ? "not done" : "done"}`}
                className="accent-primary size-4"
              />
              <span className={todo.done ? "text-muted-foreground line-through" : ""}>{todo.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-7"
                onClick={() => handleDelete(todo)}
                aria-label={`Delete "${todo.title}"`}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
