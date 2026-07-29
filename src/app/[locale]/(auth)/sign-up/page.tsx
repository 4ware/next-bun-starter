import { createTranslator } from "next-intl";
import { loadMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUpForm } from "@/components/forms/sign-up-form";

export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <SignUpContent locale={locale} />;
}

async function SignUpContent({ locale }: { locale: string }) {
  "use cache";
  const t = createTranslator({ locale, messages: await loadMessages(locale), namespace: "SignUp" });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <SignUpForm />
        <p className="text-muted-foreground text-center text-sm">
          {t("alreadyRegistered")}{" "}
          <Link className="underline underline-offset-4" href="/sign-in">
            {t("signIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
