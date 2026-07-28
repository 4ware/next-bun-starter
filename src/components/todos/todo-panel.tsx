"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { request } from "@/lib/api";

/** Wire shape of a todo — createdAt arrives as an ISO string over JSON. */
type Todo = { id: string; title: string; done: boolean; userId: string; createdAt: string };

const todosKey = ["todos"] as const;

export function TodoPanel() {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();

  // Failed queries/mutations toast automatically via the QueryClient's
  // global onError (src/components/providers.tsx).
  const { data: todos = [], isPending: loading } = useQuery({
    queryKey: todosKey,
    queryFn: () => request<Todo[]>("/api/todos"),
  });

  const createTodo = useMutation({
    mutationFn: (newTitle: string) =>
      request<Todo>("/api/todos", { method: "POST", body: JSON.stringify({ title: newTitle }) }),
    onSuccess: (todo) => {
      queryClient.setQueryData<Todo[]>(todosKey, (prev = []) => [todo, ...prev]);
      setTitle("");
    },
  });

  const toggleTodo = useMutation({
    mutationFn: (todo: Todo) =>
      request<Todo>(`/api/todos/${todo.id}`, { method: "PATCH", body: JSON.stringify({ done: !todo.done }) }),
    // Optimistic flip; rolled back in onError if the server rejects it.
    onMutate: async (todo) => {
      await queryClient.cancelQueries({ queryKey: todosKey });
      const previous = queryClient.getQueryData<Todo[]>(todosKey);
      queryClient.setQueryData<Todo[]>(todosKey, (prev = []) =>
        prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)),
      );
      return { previous };
    },
    onError: (_err, _todo, context) => {
      queryClient.setQueryData(todosKey, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: todosKey }),
  });

  const deleteTodo = useMutation({
    mutationFn: (todo: Todo) => request<{ deleted: string }>(`/api/todos/${todo.id}`, { method: "DELETE" }),
    onSuccess: (_data, todo) => {
      queryClient.setQueryData<Todo[]>(todosKey, (prev = []) => prev.filter((t) => t.id !== todo.id));
    },
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createTodo.mutate(trimmed);
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
          <Button type="submit" disabled={createTodo.isPending || !title.trim()}>
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
                onChange={() => toggleTodo.mutate(todo)}
                aria-label={`Mark "${todo.title}" as ${todo.done ? "not done" : "done"}`}
                className="accent-primary size-4"
              />
              <span className={todo.done ? "text-muted-foreground line-through" : ""}>{todo.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-7"
                onClick={() => deleteTodo.mutate(todo)}
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
