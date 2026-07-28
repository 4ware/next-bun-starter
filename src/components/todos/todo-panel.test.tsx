import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const toastError = mock();

mock.module("sonner", () => ({
  toast: { error: toastError, success: mock(), info: mock(), warning: mock() },
}));

let TodoPanel: typeof import("./todo-panel").TodoPanel;
let Providers: typeof import("../providers").Providers;

const originalFetch = global.fetch;
const fetchMock = mock<typeof fetch>();

beforeAll(async () => {
  ({ TodoPanel } = await import("./todo-panel"));
  ({ Providers } = await import("../providers"));
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  fetchMock.mockReset();
  toastError.mockClear();
  // drop any query cache persisted to localStorage by a previous test
  window.localStorage.clear();
});

const aTodo = (over: Partial<{ id: string; title: string; done: boolean; imageId: string | null }> = {}) => ({
  id: "6f1f0f0a-0000-4000-8000-000000000001",
  title: "Water the plants",
  done: false,
  userId: "u1",
  imageId: null,
  createdAt: new Date().toISOString(),
  ...over,
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** Each render gets a fresh Providers instance, i.e. a fresh QueryClient/cache. */
function renderPanel() {
  return render(
    <Providers>
      <TodoPanel />
    </Providers>,
  );
}

describe("TodoPanel", () => {
  test("lists todos from the API", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([aTodo(), aTodo({ id: "2", title: "Ship it", done: true })]));
    renderPanel();

    expect(await screen.findByText("Water the plants")).toBeInTheDocument();
    expect(screen.getByText("Ship it")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Ship it/ })).toBeChecked();
  });

  test("shows the empty state when there are no todos", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    renderPanel();

    expect(await screen.findByText("Nothing yet.")).toBeInTheDocument();
  });

  test("creates a todo and prepends it to the list", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("Nothing yet.");

    fetchMock.mockResolvedValueOnce(jsonResponse(aTodo({ title: "Buy milk" }), 201));
    await user.type(screen.getByLabelText("New todo title"), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Buy milk")).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("/api/todos");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ title: "Buy milk" });
    // input is cleared after a successful create
    expect(screen.getByLabelText("New todo title")).toHaveValue("");
  });

  test("toasts the server error when creating fails", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("Nothing yet.");

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Expected string length greater or equal to 1" }, 422));
    await user.type(screen.getByLabelText("New todo title"), "x");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Expected string length greater or equal to 1"),
    );
  });

  test("toggles a todo optimistically via PATCH", async () => {
    const todo = aTodo();
    fetchMock.mockResolvedValueOnce(jsonResponse([todo]));
    const user = userEvent.setup();
    renderPanel();
    const checkbox = await screen.findByRole("checkbox", { name: /Water the plants/ });

    fetchMock.mockResolvedValueOnce(jsonResponse({ ...todo, done: true }));
    // refetch triggered by onSettled invalidation
    fetchMock.mockResolvedValueOnce(jsonResponse([{ ...todo, done: true }]));
    await user.click(checkbox);

    await waitFor(() => expect(screen.getByRole("checkbox", { name: /Water the plants/ })).toBeChecked());
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`/api/todos/${todo.id}`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ done: true });
  });

  test("rolls back the optimistic toggle and toasts when the server rejects", async () => {
    const todo = aTodo();
    fetchMock.mockResolvedValueOnce(jsonResponse([todo]));
    const user = userEvent.setup();
    renderPanel();
    const checkbox = await screen.findByRole("checkbox", { name: /Water the plants/ });

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Not found" }, 404));
    // refetch triggered by onSettled invalidation restores the server state
    fetchMock.mockResolvedValueOnce(jsonResponse([todo]));
    await user.click(checkbox);

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Not found"));
    await waitFor(() => expect(screen.getByRole("checkbox", { name: /Water the plants/ })).not.toBeChecked());
  });

  test("offers an image upload button per todo and shows the uploaded image", async () => {
    const withImage = aTodo({ imageId: "9a1f0f0a-0000-4000-8000-000000000009" });
    fetchMock.mockResolvedValueOnce(jsonResponse([withImage]));
    renderPanel();

    const image = await screen.findByAltText('Image for "Water the plants"');
    expect(image).toHaveAttribute("src", `/api/uploads/${withImage.imageId}`);
    expect(screen.getByRole("button", { name: 'Upload image for "Water the plants"' })).toBeInTheDocument();
  });

  test("deletes a todo", async () => {
    const todo = aTodo();
    fetchMock.mockResolvedValueOnce(jsonResponse([todo]));
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("Water the plants");

    fetchMock.mockResolvedValueOnce(jsonResponse({ deleted: todo.id }));
    await user.click(screen.getByRole("button", { name: /Delete "Water the plants"/ }));

    await waitFor(() => expect(screen.queryByText("Water the plants")).not.toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`/api/todos/${todo.id}`);
    expect(init.method).toBe("DELETE");
  });
});
