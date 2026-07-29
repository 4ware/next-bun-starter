"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { createSignUpSchema } from "@/lib/validators/auth";
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
  const t = useTranslations("AuthForm");
  const tValidation = useTranslations("Validation");
  const schema = useMemo(() => createSignUpSchema(tValidation), [tValidation]);

  const form = useAppForm({
    defaultValues: { name: "", organizationName: "", email: "", password: "", confirmPassword: "" },
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
      });
      if (error) {
        // messages are already localized by the better-auth i18n plugin
        toast.error(error.message ?? t("signUpFailed"));
        return;
      }
      const { error: orgError } = await authClient.organization.create({
        name: value.organizationName,
        slug: toSlug(value.organizationName),
      });
      if (orgError) {
        toast.error(orgError.message ?? t("createOrganizationFailed"));
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
      <form.AppField name="name">{(field) => <field.TextField label={t("name")} autoComplete="name" />}</form.AppField>
      <form.AppField name="organizationName">
        {(field) => <field.TextField label={t("organizationName")} autoComplete="organization" />}
      </form.AppField>
      <form.AppField name="email">
        {(field) => <field.TextField label={t("email")} type="email" autoComplete="email" />}
      </form.AppField>
      <form.AppField name="password">
        {(field) => <field.TextField label={t("password")} type="password" autoComplete="new-password" />}
      </form.AppField>
      <form.AppField name="confirmPassword">
        {(field) => <field.TextField label={t("confirmPassword")} type="password" autoComplete="new-password" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>{t("createAccount")}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
