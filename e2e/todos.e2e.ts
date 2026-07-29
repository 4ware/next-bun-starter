import { expect, test } from "@playwright/test";
import { authFile } from "./helpers";
import { generatePicture } from "../src/server/picture";

// Runs as the user created in auth.setup.ts.
test.use({ storageState: authFile });

// The three tests walk one todo through create → update → delete, so they
// must run in order and share the same title.
//
// Assertions go through getByRole/filter on listitems: role queries skip
// hidden elements, which matters because dev-mode PPR streaming leaves a
// hidden duplicate of the suspended content in the DOM.
test.describe.serial("todo CRUD", () => {
  const title = `Buy oat milk ${Date.now()}`;
  const todoItem = (page: import("@playwright/test").Page) =>
    page.getByRole("listitem").filter({ hasText: title });

  test("creates a todo and persists it", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("textbox", { name: "New todo title" }).fill(title);
    await page.getByRole("button", { name: "Add" }).click();

    await expect(todoItem(page)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "New todo title" })).toHaveValue("");

    // survives a reload, i.e. actually hit the database
    await page.reload();
    await expect(todoItem(page)).toBeVisible();
  });

  test("toggles the todo done and persists the state", async ({ page }) => {
    await page.goto("/dashboard");
    // the flip is optimistic, so wait for the PATCH to land before reloading
    const patched = page.waitForResponse(
      (res) => res.request().method() === "PATCH" && res.url().includes("/api/todos/") && res.ok(),
    );
    // click, not check(): the accessible name flips to "…as not done" mid-action
    await page.getByRole("checkbox", { name: `Mark "${title}" as done` }).click();
    await patched;

    const checkbox = page.getByRole("checkbox", { name: `Mark "${title}" as not done` });
    await expect(checkbox).toBeChecked();

    await page.reload();
    await expect(page.getByRole("checkbox", { name: `Mark "${title}" as not done` })).toBeChecked();
  });

  test("uploads an image via react-uploady and persists it", async ({ page }) => {
    await page.goto("/dashboard");

    // slow the upload down so the progress indicator is observable
    await page.route("**/api/todos/*/image", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      await route.continue();
    });

    const [chooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("button", { name: `Upload image for "${title}"` }).click(),
    ]);
    await chooser.setFiles({ name: "art.png", mimeType: "image/png", buffer: generatePicture(64) });

    // progress indicator replaces the upload button while in flight …
    await expect(page.getByRole("progressbar", { name: `Uploading image for "${title}"` })).toBeVisible();

    const thumbnail = page.getByRole("img", { name: `Image for "${title}"` });
    await expect(thumbnail).toBeVisible();
    // … and disappears once the upload finished
    await expect(page.getByRole("progressbar")).toHaveCount(0);
    await page.unroute("**/api/todos/*/image");

    // survives a reload, i.e. the image is stored server-side
    await page.reload();
    await expect(thumbnail).toBeVisible();
    const src = await thumbnail.getAttribute("src");
    const res = await page.request.get(src!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
  });

  test("deletes the todo", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: `Delete "${title}"` }).click();

    await expect(todoItem(page)).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("listitem").filter({ hasText: "Nothing yet." })).toBeVisible();
    await expect(todoItem(page)).toHaveCount(0);
  });
});
