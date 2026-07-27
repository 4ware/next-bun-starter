"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { signInSchema } from "@/lib/validators/auth";
import { useAppForm } from "./form";

export function SignInForm() {
  const router = useRouter();

  const form = useAppForm({
    defaultValues: { email: "", password: "" },
    validators: {
      // zod schemas are Standard Schema — no adapter needed
      onChange: signInSchema,
    },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      });
      if (error) {
        // message is already localized by the better-auth i18n plugin
        toast.error(error.message ?? "Sign in failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    },
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="email">
        {(field) => <field.TextField label="Email" type="email" autoComplete="email" />}
      </form.AppField>
      <form.AppField name="password">
        {(field) => <field.TextField label="Password" type="password" autoComplete="current-password" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>Sign in</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
