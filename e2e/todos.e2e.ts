import { expect, test } from "@playwright/test";
import { authFile } from "./helpers";

// Runs as the user created in auth.setup.ts.
test.use({ storageState: authFile });

// The three tests walk one todo through create → update → delete, so they
// must run in order and share the same title.
test.describe.serial("todo CRUD", () => {
  const title = `Buy oat milk ${Date.now()}`;

  test("creates a todo and persists it", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByLabel("New todo title").fill(title);
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await expect(page.getByLabel("New todo title")).toHaveValue("");

    // survives a reload, i.e. actually hit the database
    await page.reload();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  });

  test("toggles the todo done and persists the state", async ({ page }) => {
    await page.goto("/dashboard");
    // click, not check(): the accessible name flips to "…as not done" mid-action
    await page.getByRole("checkbox", { name: `Mark "${title}" as done` }).click();

    const checkbox = page.getByRole("checkbox", { name: `Mark "${title}" as not done` });
    await expect(checkbox).toBeChecked();

    await page.reload();
    await expect(page.getByRole("checkbox", { name: `Mark "${title}" as not done` })).toBeChecked();
  });

  test("deletes the todo", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: `Delete "${title}"` }).click();

    await expect(page.getByText(title, { exact: true })).toHaveCount(0);

    await page.reload();
    await expect(page.getByText("Nothing yet.")).toBeVisible();
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  });
});
