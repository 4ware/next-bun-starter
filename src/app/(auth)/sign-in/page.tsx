import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "@/components/forms/sign-in-form";

export default function SignInPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your email and password to sign in.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <SignInForm />
        <p className="text-muted-foreground text-center text-sm">
          No account yet?{" "}
          <Link className="underline underline-offset-4" href="/sign-up">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
