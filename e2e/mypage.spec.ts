import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { answerOf, fillEditor, waitEngineReady } from "./helpers";

test("学習記録を書き出し、消して、読み込み直せる", async ({ page }) => {
  await page.goto("/problem/0004");
  await waitEngineReady(page);
  await fillEditor(page, answerOf("0004"));
  await page.getByRole("button", { name: "提出" }).click();
  await expect(page.getByRole("heading", { name: "登頂しました" })).toBeVisible();

  await page.goto("/mypage");
  await expect(page.locator(".rank-panel__value")).toContainText("170");

  // 書き出し
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "書き出す（JSON）" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^sql-climber-export-\d{8}\.json$/);
  const file = await download.path();
  expect(JSON.parse(await readFile(file, "utf8")).rank).toBe(170);

  // 全削除
  await page.getByRole("button", { name: "記録をすべて消す" }).click();
  await page.getByRole("button", { name: "消す", exact: true }).click();
  await expect(page.locator(".rank-panel__value")).toContainText("0");

  // 読み込み → 比較して確認 → 置き換え
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByRole("alertdialog")).toContainText("0m → 170m");
  await page.getByRole("button", { name: "置き換える" }).click();
  await expect(page.locator(".rank-panel__value")).toContainText("170");
});

test("壊れたファイルは読み込まない", async ({ page }) => {
  await page.goto("/mypage");
  await page.locator('input[type="file"]').setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"rank":"高い"}'),
  });
  await expect(page.locator(".notice--error")).toContainText("読み込めません");
});

test("テーマと SQL の種類の設定が保存される", async ({ page }) => {
  await page.goto("/mypage");
  await page.getByRole("radio", { name: "夜（暗い）" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .locator(".settings")
    .getByRole("radio", { name: /PostgreSQL/ })
    .click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.locator(".settings").getByRole("radio", { name: /PostgreSQL/ }),
  ).toHaveAttribute("aria-checked", "true");
});
