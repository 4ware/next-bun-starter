"use client";

import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

/**
 * Reusable text field bound to the surrounding form via context.
 * Shows validation errors once the field has been touched.
 */
function TextField({ label, type = "text", ...props }: { label: string } & React.ComponentProps<typeof Input>) {
  const field = useFieldContext<string>();
  const errors = field.state.meta.isTouched ? field.state.meta.errors : [];
  const errorId = `${field.name}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={errors.length > 0}
        aria-describedby={errors.length > 0 ? errorId : undefined}
        {...props}
      />
      {errors.length > 0 && (
        <p id={errorId} role="alert" className="text-destructive text-sm">
          {errors.map((error) => (typeof error === "string" ? error : error?.message)).join(", ")}
        </p>
      )}
    </div>
  );
}

/** Submit button that disables itself while the form is submitting or invalid. */
function SubmitButton({ children }: { children: React.ReactNode }) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={!canSubmit || isSubmitting} className="w-full">
          {isSubmitting ? "Submitting…" : children}
        </Button>
      )}
    </form.Subscribe>
  );
}

/**
 * App-level form hook (TanStack Form composition pattern).
 * Add more field components here as the app grows.
 */
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
  },
  formComponents: {
    SubmitButton,
  },
});
