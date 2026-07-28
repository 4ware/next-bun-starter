import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = mock();
const refresh = mock();
const signOut = mock(async () => ({}));

mock.module("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

mock.module("@/lib/auth-client", () => ({
  authClient: { signOut },
}));

let SignOutButton: typeof import("./sign-out-button").SignOutButton;
let Providers: typeof import("./providers").Providers;
let QUERY_CACHE_STORAGE_KEY: string;

beforeAll(async () => {
  ({ SignOutButton } = await import("./sign-out-button"));
  ({ Providers, QUERY_CACHE_STORAGE_KEY } = await import("./providers"));
});

beforeEach(() => {
  push.mockClear();
  refresh.mockClear();
  signOut.mockClear();
  window.localStorage.clear();
});

describe("SignOutButton", () => {
  test("signs out, clears the persisted cache, and redirects home", async () => {
    window.localStorage.setItem(QUERY_CACHE_STORAGE_KEY, '{"cached":"data"}');
    const user = userEvent.setup();
    render(
      <Providers>
        <SignOutButton />
      </Providers>,
    );

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(signOut).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
    expect(window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY)).toBeNull();
  });
});
