import { test as setup } from "@playwright/test";
import { authFile, signUp, uniqueUser } from "./helpers";

/** Creates the user the todo CRUD spec runs as and persists its session. */
setup("sign up the shared e2e user", async ({ page }) => {
  await signUp(page, uniqueUser("todos"));
  await page.context().storageState({ path: authFile });
});
