import { expect, test } from "@playwright/test";
import { signOut, signUp, uniqueUser } from "./helpers";

test.describe("authentication", () => {
  test("signs up a new account and lands on the dashboard", async ({ page }) => {
    const creds = uniqueUser("signup");
    await signUp(page, creds);

    await expect(page.getByText("Signed in as")).toBeVisible();
    await expect(page.getByText(creds.email)).toBeVisible();
  });

  test("rejects mismatched passwords before submitting", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("Password", { exact: true }).fill("supersecret123");
    await page.getByLabel("Confirm password").fill("something-else");
    await page.getByLabel("Confirm password").blur();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();
  });

  test("signs out and the dashboard is protected again", async ({ page }) => {
    await signUp(page, uniqueUser("signout"));
    await signOut(page);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("rejects a wrong password with a toast, then signs in", async ({ page }) => {
    const creds = uniqueUser("signin");
    await signUp(page, creds);
    await signOut(page);

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(creds.email);
    await page.getByLabel("Password").fill("definitely-wrong-1");
    await page.getByRole("button", { name: "Sign in" }).click();

    // localized better-auth error surfaced via sonner
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);

    await page.getByLabel("Password").fill(creds.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(creds.email)).toBeVisible();
  });
});
