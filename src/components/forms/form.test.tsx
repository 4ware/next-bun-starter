import { describe, expect, mock, test } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import { IntlWrapper } from "@/test/intl";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import { useAppForm } from "./form";

const schema = z.object({ nickname: z.string().min(3, "At least 3 characters") });

/** Minimal harness exercising the shared TextField + SubmitButton components. */
function TestForm({ onSubmit }: { onSubmit: (value: { nickname: string }) => void }) {
  const form = useAppForm({
    defaultValues: { nickname: "" },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => onSubmit(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="nickname">{(field) => <field.TextField label="Nickname" />}</form.AppField>
      <form.AppForm>
        <form.SubmitButton>Save</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}

describe("form composition (TextField + SubmitButton)", () => {
  test("associates the label with the input", () => {
    render(<TestForm onSubmit={mock()} />, { wrapper: IntlWrapper });
    expect(screen.getByLabelText("Nickname")).toBeInTheDocument();
  });

  test("shows the validation error only after the field was touched", async () => {
    const user = userEvent.setup();
    render(<TestForm onSubmit={mock()} />, { wrapper: IntlWrapper });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Nickname"), "ab");
    await user.tab();

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("At least 3 characters");
    expect(screen.getByLabelText("Nickname")).toHaveAttribute("aria-invalid", "true");
  });

  test("disables the submit button while invalid and enables it when valid", async () => {
    const user = userEvent.setup();
    render(<TestForm onSubmit={mock()} />, { wrapper: IntlWrapper });

    await user.type(screen.getByLabelText("Nickname"), "ab");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    await user.type(screen.getByLabelText("Nickname"), "c");
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
  });

  test("submits the field value", async () => {
    const onSubmit = mock();
    const user = userEvent.setup();
    render(<TestForm onSubmit={onSubmit} />, { wrapper: IntlWrapper });

    await user.type(screen.getByLabelText("Nickname"), "kai");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ nickname: "kai" }));
  });
});
