import { request } from "@/lib/api";

/** Wire shape of a todo — createdAt arrives as an ISO string over JSON. */
export type Todo = { id: string; title: string; done: boolean; userId: string; createdAt: string };

/** Shared between the client panel and the server-side prefetch. */
export const todosKey = ["todos"] as const;

export function fetchTodos() {
  return request<Todo[]>("/api/todos");
}
