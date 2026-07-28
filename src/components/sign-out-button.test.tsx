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

beforeAll(async () => {
  ({ SignOutButton } = await import("./sign-out-button"));
});

beforeEach(() => {
  push.mockClear();
  refresh.mockClear();
  signOut.mockClear();
});

describe("SignOutButton", () => {
  test("signs out and redirects to the home page", async () => {
    const user = userEvent.setup();
    render(<SignOutButton />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(signOut).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });
});
