"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { createSignInSchema } from "@/lib/validators/auth";
import { useAppForm } from "./form";

export function SignInForm() {
  const router = useRouter();
  const t = useTranslations("AuthForm");
  const tValidation = useTranslations("Validation");
  const schema = useMemo(() => createSignInSchema(tValidation), [tValidation]);

  const form = useAppForm({
    defaultValues: { email: "", password: "" },
    validators: {
      // zod schemas are Standard Schema — no adapter needed
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      });
      if (error) {
        // message is already localized by the better-auth i18n plugin
        toast.error(error.message ?? t("signInFailed"));
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
        {(field) => <field.TextField label={t("email")} type="email" autoComplete="email" />}
      </form.AppField>
      <form.AppField name="password">
        {(field) => <field.TextField label={t("password")} type="password" autoComplete="current-password" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>{t("signIn")}</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
