import { expect, test } from "@playwright/test";

test("問題文のテーブル名・カラム名・値をコピーボタンでコピーできる", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/problem/0022");
  const statement = page.locator(".statement .prose");

  const button = statement.getByRole("button", { name: "'北アルプス' をコピー" });
  await button.click();
  await expect(
    statement.getByRole("button", { name: "'北アルプス' をコピーしました" }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("'北アルプス'");

  await statement.getByRole("button", { name: "huts.price をコピー" }).first().click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("huts.price");
});

test("キーワードや書式の説明にはコピーボタンを付けない", async ({ page }) => {
  await page.goto("/problem/0037");
  const statement = page.locator(".statement .prose");
  await expect(statement.locator("code", { hasText: "ROW_NUMBER" })).toBeVisible();
  await expect(statement.getByRole("button", { name: /ROW_NUMBER/ })).toHaveCount(0);
});
