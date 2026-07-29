import { expect, test } from "@playwright/test";

test.describe("i18n routing", () => {
  test("the language switcher toggles between English and German", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();

    await page.getByRole("navigation", { name: "Language" }).getByRole("link", { name: "de" }).click();

    await expect(page).toHaveURL(/\/de$/);
    await expect(page.getByRole("link", { name: "Konto erstellen" })).toBeVisible();

    // back to English — default locale is unprefixed
    await page.getByRole("navigation", { name: "Sprache" }).getByRole("link", { name: "en" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
  });

  test("German pages render translated content under /de", async ({ page }) => {
    await page.goto("/de/sign-in");
    await expect(page.getByText("Mit E-Mail-Adresse und Passwort anmelden.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
    await expect(page.getByLabel("E-Mail")).toBeVisible();

    await page.goto("/de/sign-up");
    await expect(page.getByRole("button", { name: "Konto erstellen" })).toBeVisible();
    await expect(page.getByLabel("Passwort bestätigen")).toBeVisible();
  });

  test("the dashboard redirect keeps the locale", async ({ page }) => {
    await page.goto("/de/dashboard");
    await expect(page).toHaveURL(/\/de\/sign-in/);
  });
});
