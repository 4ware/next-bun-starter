import { z } from "zod";

/** Keys into the "Validation" message namespace (messages/{locale}.json). */
export type ValidationMessageKey = "email" | "passwordMin" | "nameMin" | "organizationNameMin" | "passwordsMismatch";

type Translate = (key: ValidationMessageKey) => string;

const englishMessages: Record<ValidationMessageKey, string> = {
  email: "Enter a valid email address",
  passwordMin: "Password must be at least 8 characters",
  nameMin: "Name must be at least 2 characters",
  organizationNameMin: "Organization name must be at least 2 characters",
  passwordsMismatch: "Passwords do not match",
};

const defaultTranslate: Translate = (key) => englishMessages[key];

/** Factories so forms can inject next-intl's t for localized messages. */
export function createSignInSchema(t: Translate = defaultTranslate) {
  return z.object({
    email: z.email(t("email")),
    password: z.string().min(8, t("passwordMin")),
  });
}

export function createSignUpSchema(t: Translate = defaultTranslate) {
  return z
    .object({
      name: z.string().min(2, t("nameMin")),
      organizationName: z.string().min(2, t("organizationNameMin")),
      email: z.email(t("email")),
      password: z.string().min(8, t("passwordMin")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsMismatch"),
      path: ["confirmPassword"],
    });
}

export const signInSchema = createSignInSchema();
export const signUpSchema = createSignUpSchema();

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
