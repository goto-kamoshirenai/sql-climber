import { expect, test } from "@playwright/test";
import { waitEngineReady } from "./helpers";

test("スマホでは問題・エディタ・結果を全画面で切り替え、入力補助バーで書ける", async ({ page }) => {
  await page.goto("/problem/0001");
  const bar = page.getByRole("navigation", { name: "表示の切り替え" });

  // 最初は問題ビュー
  await expect(page.locator(".info-panel")).toBeVisible();
  await expect(page.locator(".sql-editor")).toBeHidden();

  await bar.getByRole("button", { name: "エディタ" }).click();
  await expect(page.locator(".info-panel")).toBeHidden();
  await waitEngineReady(page);

  await page.locator(".cm-content").click();
  const chips = page.getByRole("toolbar", { name: "SQL 入力補助" });
  for (const chip of ["SELECT", "*", "FROM", "mountains"]) {
    await chips.getByRole("button", { name: chip, exact: true }).click();
  }
  await expect(page.locator(".cm-content")).toContainText("SELECT * FROM mountains");

  // 実行すると結果ビューへ
  await page.getByRole("button", { name: "実行" }).click();
  await expect(page.locator(".result-table")).toBeVisible();
  await expect(bar.getByRole("button", { name: "結果" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "提出" }).click();
  await expect(page.getByRole("heading", { name: "登頂しました" })).toBeVisible();
});

test("スマホのホームは横にはみ出さない", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".grade-card")).toHaveCount(4);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
