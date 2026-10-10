import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

/** 模範解答はテスト側で content/ から直接読む（API の答えに頼らない） */
export function answerOf(id: string): string {
  const file = path.join(process.cwd(), "content", "problems", `${id}.json`);
  return (JSON.parse(readFileSync(file, "utf8")) as { answer: { sql: string } }).answer.sql;
}

export async function waitEngineReady(page: Page) {
  await expect(page.locator('.engine-badge[data-status="ready"]')).toBeVisible({ timeout: 45_000 });
}

/** エディタの内容を置き換える（自動補完や括弧の自動補完の影響を受けないよう貼り付けで入れる） */
export async function fillEditor(page: Page, sql: string) {
  const content = page.locator(".cm-content");
  if (!(await content.isVisible())) {
    await page.getByRole("tab", { name: "エディタ" }).click();
  }
  await content.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Delete");
  await page.keyboard.insertText(sql);
}
