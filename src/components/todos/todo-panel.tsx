"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { forwardRef, useState } from "react";
import { ImagePlusIcon, Trash2Icon } from "lucide-react";
import Uploady, { useItemErrorListener, useItemFinishListener } from "@rpldy/uploady";
import { asUploadButton } from "@rpldy/upload-button";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { request } from "@/lib/api";
import { fetchTodos, todosKey, type Todo } from "@/lib/todos";

/** react-uploady trigger styled as our ghost icon button. */
const AttachImageButton = asUploadButton(
  forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(function AttachTrigger(props, ref) {
    return <Button {...props} ref={ref} type="button" variant="ghost" size="icon" className="size-7" />;
  }),
);

/** Bridges react-uploady events into the query cache + sonner. */
function UploadEvents() {
  const queryClient = useQueryClient();
  const t = useTranslations("Todos");

  useItemFinishListener(() => {
    void queryClient.invalidateQueries({ queryKey: todosKey });
    toast.success(t("imageUploaded"));
  });

  useItemErrorListener((item) => {
    const data = item.uploadResponse?.data as { error?: string } | string | undefined;
    const message =
      typeof data === "object" && data?.error
        ? data.error
        : t("uploadFailed", { reason: item.uploadStatus || "network error" });
    toast.error(message);
  });

  return null;
}

export function TodoPanel() {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();
  const t = useTranslations("Todos");

  // Failed queries/mutations toast automatically via the QueryClient's
  // global onError (src/components/providers.tsx).
  const { data: todos = [], isPending: loading } = useQuery({
    queryKey: todosKey,
    queryFn: fetchTodos,
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
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("placeholder")}
            maxLength={200}
            aria-label={t("newTodoTitle")}
          />
          <Button type="submit" disabled={createTodo.isPending || !title.trim()}>
            {t("add")}
          </Button>
        </form>
        <Uploady autoUpload multiple={false} accept="image/*">
          <UploadEvents />
          <ul className="space-y-2 text-sm">
            {loading && <li className="text-muted-foreground">{t("loading")}</li>}
            {!loading && todos.length === 0 && <li className="text-muted-foreground">{t("empty")}</li>}
            {todos.map((todo) => (
              <li key={todo.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleTodo.mutate(todo)}
                  aria-label={todo.done ? t("markNotDone", { title: todo.title }) : t("markDone", { title: todo.title })}
                  className="accent-primary size-4"
                />
                {todo.imageId && (
                  // plain <img>: the route needs the session cookie, which the
                  // next/image optimizer would not forward
                  <img
                    src={`/api/uploads/${todo.imageId}`}
                    alt={t("imageFor", { title: todo.title })}
                    className="size-8 rounded object-cover"
                  />
                )}
                <span className={todo.done ? "text-muted-foreground line-through" : ""}>{todo.title}</span>
                <span className="ml-auto flex items-center gap-1">
                  <AttachImageButton
                    destination={{ url: `/api/todos/${todo.id}/image` }}
                    extraProps={{
                      "aria-label": t("uploadImage", { title: todo.title }),
                      children: <ImagePlusIcon className="size-4" />,
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => deleteTodo.mutate(todo)}
                    aria-label={t("delete", { title: todo.title })}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </Uploady>
      </CardContent>
    </Card>
  );
}
