import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import { IntlWrapper } from "@/test/intl";
import userEvent from "@testing-library/user-event";

const push = mock();
const refresh = mock();
const signUpEmail = mock(async () => ({ data: null, error: null }));
const createOrganization = mock(async () => ({ data: null, error: null }));
const toastError = mock();

mock.module("@/i18n/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

mock.module("@/lib/auth-client", () => ({
  authClient: {
    signUp: { email: signUpEmail },
    organization: { create: createOrganization },
  },
}));

mock.module("sonner", () => ({
  toast: { error: toastError, success: mock(), info: mock(), warning: mock() },
}));

let SignUpForm: typeof import("./sign-up-form").SignUpForm;

beforeAll(async () => {
  ({ SignUpForm } = await import("./sign-up-form"));
});

beforeEach(() => {
  push.mockClear();
  refresh.mockClear();
  signUpEmail.mockClear();
  createOrganization.mockClear();
  toastError.mockClear();
  signUpEmail.mockResolvedValue({ data: null, error: null });
  createOrganization.mockResolvedValue({ data: null, error: null });
});

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Kai");
  await user.type(screen.getByLabelText("Organization name"), "Acme Inc");
  await user.type(screen.getByLabelText("Email"), "kai@example.com");
  await user.type(screen.getByLabelText("Password"), "supersecret");
  await user.type(screen.getByLabelText("Confirm password"), "supersecret");
}

describe("SignUpForm", () => {
  test("shows a validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />, { wrapper: IntlWrapper });

    await user.type(screen.getByLabelText("Password"), "supersecret");
    await user.type(screen.getByLabelText("Confirm password"), "different");
    await user.tab();

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeDisabled();
  });

  test("creates the account and the organization, then redirects", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />, { wrapper: IntlWrapper });

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(signUpEmail).toHaveBeenCalledWith({
      name: "Kai",
      email: "kai@example.com",
      password: "supersecret",
    });
    const [orgArgs] = createOrganization.mock.calls[0] as unknown as [{ name: string; slug: string }];
    expect(orgArgs.name).toBe("Acme Inc");
    expect(orgArgs.slug).toMatch(/^acme-inc-[a-z0-9]+$/);
  });

  test("toasts the error and stops when sign-up fails", async () => {
    signUpEmail.mockResolvedValue({ data: null, error: { message: "Email already in use" } } as never);
    const user = userEvent.setup();
    render(<SignUpForm />, { wrapper: IntlWrapper });

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Email already in use"));
    expect(createOrganization).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  test("toasts the error when organization creation fails", async () => {
    createOrganization.mockResolvedValue({ data: null, error: { message: "Slug already taken" } } as never);
    const user = userEvent.setup();
    render(<SignUpForm />, { wrapper: IntlWrapper });

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Slug already taken"));
    expect(push).not.toHaveBeenCalled();
  });
});
