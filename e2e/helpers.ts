import { expect, type Page } from "@playwright/test";

/** Storage state written by auth.setup.ts, consumed by todos.e2e.ts. */
export const authFile = "e2e/.auth/user.json";

export type Credentials = {
  name: string;
  organizationName: string;
  email: string;
  password: string;
};

/** Fresh credentials per test so runs never collide with existing rows. */
export function uniqueUser(prefix: string): Credentials {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    name: "E2E User",
    organizationName: `E2E Org ${id}`,
    email: `${prefix}-${id}@example.com`,
    password: "supersecret123",
  };
}

/** Signs up via the UI and waits for the dashboard redirect. */
export async function signUp(page: Page, creds: Credentials) {
  await page.goto("/sign-up");
  await page.getByLabel("Name", { exact: true }).fill(creds.name);
  await page.getByLabel("Organization name").fill(creds.organizationName);
  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Password", { exact: true }).fill(creds.password);
  await page.getByLabel("Confirm password").fill(creds.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
}
