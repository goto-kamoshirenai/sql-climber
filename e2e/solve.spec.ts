import { expect, test } from "@playwright/test";
import { answerOf, fillEditor, waitEngineReady } from "./helpers";

test("ホームから問題を選び、正解するとランクが上がり、再読み込み後も残る", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /〜500m級/ }).click();
  await expect(page).toHaveURL(/\/problems\/500$/);
  await page.locator(".problem-row").nth(3).click();
  await expect(page).toHaveURL(/\/problem\/0004$/);
  await waitEngineReady(page);

  // 実行: 結果タブに表が出る
  await fillEditor(page, answerOf("0004"));
  await page.getByRole("button", { name: "実行" }).click();
  await expect(page.locator(".result-table")).toBeVisible();
  await expect(page.getByRole("tab", { name: "実行結果" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  // 提出: 登頂
  await page.getByRole("button", { name: "提出" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "登頂しました" })).toBeVisible();
  await expect(dialog.getByRole("region", { name: "解説" })).toBeVisible();
  await expect(page.locator(".rank-chip")).toContainText("170 m");

  // 再読み込みしてもランクと書きかけが残る
  await page.reload();
  await expect(page.locator(".rank-chip")).toContainText("170 m");
  await expect(page.locator(".cm-content")).toContainText("altitude >= 1900");

  // 問題一覧に登頂が付く
  await page.goto("/problems/500");
  await expect(page.locator('.problem-row[data-status="solved"]')).toHaveCount(1);
});

test("同じ問題に2回正解してもランクは変わらない", async ({ page }) => {
  await page.goto("/problem/0004");
  await waitEngineReady(page);
  for (const expected of ["登頂しました", "正解です"]) {
    await fillEditor(page, answerOf("0004"));
    await page.getByRole("button", { name: "提出" }).click();
    await expect(page.getByRole("heading", { name: expected })).toBeVisible();
    await page.getByRole("button", { name: "エディタに戻る" }).click();
  }
  await expect(page.locator(".rank-chip")).toContainText("170 m");
});

test("不正解なら再挑戦でき、降参すると解説が見られ、あとの正解は半分になる", async ({ page }) => {
  await page.goto("/problem/0004");
  await waitEngineReady(page);

  await fillEditor(page, "SELECT name FROM mountains");
  await page.getByRole("button", { name: "提出" }).click();
  await expect(page.getByRole("heading", { name: "まだ山頂ではありません" })).toBeVisible();

  // 回答を残して再挑戦
  await page.getByRole("button", { name: "再挑戦（回答を残す）" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".cm-content")).toContainText("SELECT name FROM mountains");

  // 降参
  await page.getByRole("button", { name: "提出" }).click();
  await page.getByRole("button", { name: "降参して解説を見る" }).click();
  await page.getByRole("button", { name: "降参する" }).click();
  await expect(page.getByRole("region", { name: "解説" })).toBeVisible();
  await page.getByRole("button", { name: "エディタに戻る" }).click();

  // 降参後の正解は 170 の半分
  await fillEditor(page, answerOf("0004"));
  await page.getByRole("button", { name: "提出" }).click();
  await expect(page.getByRole("heading", { name: "登頂しました" })).toBeVisible();
  await expect(page.locator(".rank-chip")).toContainText("85 m");
});

test("SQL エラーは判定せずにメッセージを出す・複数の文は提出できない", async ({ page }) => {
  await page.goto("/problem/0001");
  await waitEngineReady(page);

  await fillEditor(page, "SELEC * FROM mountains");
  await page.getByRole("button", { name: "提出" }).click();
  await expect(page.locator(".outcome--error")).toContainText("SQL エラー");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await fillEditor(page, "SELECT 1; SELECT * FROM mountains");
  await page.getByRole("button", { name: "提出" }).click();
  await expect(page.locator(".outcome--error")).toContainText("1つの文だけ");
});

test("ヒントは段階的に開く", async ({ page }) => {
  await page.goto("/problem/0001");
  await page.getByRole("tab", { name: "ヒント" }).click();
  await expect(page.getByRole("button", { name: "ヒント2を開く" })).toHaveCount(0);
  await page.getByRole("button", { name: "ヒント1を開く" }).click();
  await page.getByRole("button", { name: "ヒント2を開く" }).click();
  await expect(page.getByRole("tab", { name: "ヒント 2/3" })).toBeVisible();
});

test("テーブル情報・E-R図・サンプルデータのタブが表示できる", async ({ page }) => {
  await page.goto("/problem/0021");
  await page.getByRole("tab", { name: "テーブル情報" }).click();
  await expect(page.locator(".table-card")).toHaveCount(6);
  await page.getByRole("tab", { name: "E-R図" }).click();
  await expect(page.locator(".er__img--light")).toBeVisible();
  await page.getByRole("tab", { name: "サンプルデータ" }).click();
  await expect(page.locator(".samples__table")).toHaveCount(6);
});

test("終わらないクエリは時間切れで止まり、その後も実行できる", async ({ page }) => {
  await page.goto("/problem/0001");
  await waitEngineReady(page);

  await fillEditor(
    page,
    "WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c) SELECT COUNT(*) FROM c",
  );
  await page.getByRole("button", { name: "実行" }).click();
  await expect(page.locator(".outcome--error")).toContainText("時間切れ", { timeout: 20_000 });

  // Worker を作り直して、続けて実行できる
  await fillEditor(page, "SELECT COUNT(*) FROM mountains");
  await page.getByRole("button", { name: "実行" }).click();
  await expect(page.locator(".result-table")).toContainText("20");
});
