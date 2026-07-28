import { expect, test } from "@playwright/test";
import { authFile } from "./helpers";

test.use({ storageState: authFile });

test("dashboard shows the generated image at multiple sizes", async ({ page }) => {
  await page.goto("/dashboard");

  const images = page.getByRole("img", { name: /Generated artwork/ });
  await expect(images).toHaveCount(3);
  await images.last().scrollIntoViewIfNeeded();

  // every instance loaded a real bitmap (not a broken image)
  await expect
    .poll(async () =>
      images.evaluateAll((els) => els.map((el) => (el as HTMLImageElement).naturalWidth > 0)),
    )
    .toEqual([true, true, true]);

  // the cached source route serves a PNG
  const res = await page.request.get("/picture/128");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  // unknown sizes are not routable (dynamicParams = false)
  expect((await page.request.get("/picture/999")).status()).toBe(404);
});
