/**
 * Fetch wrapper for the Elysia API. Non-2xx responses carry a normalized
 * { error: string } body (see the onError hook in src/server/api/index.ts),
 * which is thrown here so TanStack Query's error handling picks it up.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
