"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/validators/auth";
import { useAppForm } from "./form";

function toSlug(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // Random suffix keeps the slug unique without an extra availability check.
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SignUpForm() {
  const router = useRouter();

  const form = useAppForm({
    defaultValues: { name: "", organizationName: "", email: "", password: "", confirmPassword: "" },
    validators: {
      onChange: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
      });
      if (error) {
        // messages are already localized by the better-auth i18n plugin
        toast.error(error.message ?? "Sign up failed");
        return;
      }
      const { error: orgError } = await authClient.organization.create({
        name: value.organizationName,
        slug: toSlug(value.organizationName),
      });
      if (orgError) {
        toast.error(orgError.message ?? "Failed to create organization");
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
      <form.AppField name="name">{(field) => <field.TextField label="Name" autoComplete="name" />}</form.AppField>
      <form.AppField name="organizationName">
        {(field) => <field.TextField label="Organization name" autoComplete="organization" />}
      </form.AppField>
      <form.AppField name="email">
        {(field) => <field.TextField label="Email" type="email" autoComplete="email" />}
      </form.AppField>
      <form.AppField name="password">
        {(field) => <field.TextField label="Password" type="password" autoComplete="new-password" />}
      </form.AppField>
      <form.AppField name="confirmPassword">
        {(field) => <field.TextField label="Confirm password" type="password" autoComplete="new-password" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>Create account</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
