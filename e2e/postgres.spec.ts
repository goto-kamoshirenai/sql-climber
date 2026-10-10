import { expect, test } from "@playwright/test";
import { answerOf, fillEditor, waitEngineReady } from "./helpers";

test("PostgreSQL に切り替えて解ける（numeric の平均も正しく判定される）", async ({ page }) => {
  await page.goto("/problem/0014");
  await page
    .locator(".site-header")
    .getByRole("radio", { name: /PostgreSQL/ })
    .click();
  await expect(page.locator(".engine-badge")).toContainText("PostgreSQL");
  await waitEngineReady(page);

  await fillEditor(page, answerOf("0014"));
  await page.getByRole("button", { name: "実行" }).click();
  await expect(page.locator(".result-table")).toBeVisible();

  await page.getByRole("button", { name: "提出" }).click();
  await expect(page.getByRole("heading", { name: "登頂しました" })).toBeVisible();
});
