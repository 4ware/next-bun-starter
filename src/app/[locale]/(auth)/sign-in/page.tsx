import { createTranslator } from "next-intl";
import { loadMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "@/components/forms/sign-in-form";

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <SignInContent locale={locale} />;
}

async function SignInContent({ locale }: { locale: string }) {
  "use cache";
  const t = createTranslator({ locale, messages: await loadMessages(locale), namespace: "SignIn" });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <SignInForm />
        <p className="text-muted-foreground text-center text-sm">
          {t("noAccount")}{" "}
          <Link className="underline underline-offset-4" href="/sign-up">
            {t("createOne")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
