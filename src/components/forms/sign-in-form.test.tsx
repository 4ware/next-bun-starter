import { beforeAll, describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { IntlWrapper } from "@/test/intl";
import userEvent from "@testing-library/user-event";

const push = mock();
const refresh = mock();
const signInEmail = mock(async () => ({ data: null, error: null }));

mock.module("@/i18n/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

mock.module("@/lib/auth-client", () => ({
  authClient: { signIn: { email: signInEmail } },
}));

let SignInForm: typeof import("./sign-in-form").SignInForm;

beforeAll(async () => {
  ({ SignInForm } = await import("./sign-in-form"));
});

describe("SignInForm", () => {
  test("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    render(<SignInForm />, { wrapper: IntlWrapper });

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.tab();

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
  });

  test("disables submit while the form is invalid", async () => {
    const user = userEvent.setup();
    render(<SignInForm />, { wrapper: IntlWrapper });

    await user.type(screen.getByLabelText("Email"), "not-an-email");

    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });

  test("submits valid credentials to better-auth", async () => {
    const user = userEvent.setup();
    render(<SignInForm />, { wrapper: IntlWrapper });

    await user.type(screen.getByLabelText("Email"), "kai@example.com");
    await user.type(screen.getByLabelText("Password"), "supersecret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(signInEmail).toHaveBeenCalledWith({
      email: "kai@example.com",
      password: "supersecret",
    });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });
});
