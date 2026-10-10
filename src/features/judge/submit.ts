import { QueryTimeoutError, type EngineHost } from "@/features/engine/engine-host";
import { countStatements } from "@/features/engine/statements";
import type { QueryResult } from "@/features/engine/types";
import type { ProblemAnswer, ResolvedDataset } from "@/features/problem/schema";
import { judge } from "./judge";

/** 実行・提出の結果。判定まで進まなかったケースも型で区別する */
export type ExecutionOutcome =
  | { kind: "result"; result: QueryResult; elapsedMs: number }
  | { kind: "sql_error"; message: string }
  | { kind: "timeout"; message: string }
  | { kind: "rejected"; message: string };

export type SubmitOutcome =
  ExecutionOutcome | { kind: "judged"; correct: boolean; result: QueryResult };

/** 実行: 判定はせず結果を返す。複数の文も許可（最後の結果を表示） */
export async function runQuery(
  host: EngineHost,
  dataset: ResolvedDataset,
  sql: string,
): Promise<ExecutionOutcome> {
  if (countStatements(sql) === 0) return { kind: "rejected", message: "SQL を入力してください。" };
  const started = performance.now();
  return execute(host, dataset, [sql], (result) => ({
    kind: "result",
    result,
    elapsedMs: Math.round(performance.now() - started),
  }));
}

/**
 * 提出: ユーザーの SQL と模範解答を、それぞれまっさらな DB で実行して比較する（ADR-0002）。
 * SQL エラーは不正解として扱わない（提出回数にも数えない）。
 */
export async function submitQuery(
  host: EngineHost,
  dataset: ResolvedDataset,
  sql: string,
  answer: ProblemAnswer,
): Promise<SubmitOutcome> {
  const statements = countStatements(sql);
  if (statements === 0) return { kind: "rejected", message: "SQL を入力してください。" };
  if (statements > 1) {
    return {
      kind: "rejected",
      message: "提出できるのは1つの文だけです。不要な文を消してから提出してください。",
    };
  }

  const withVerify = (q: string) => (answer.verifyQuery ? [q, answer.verifyQuery] : [q]);

  const actual = await execute(host, dataset, withVerify(sql), (result) => ({
    kind: "result" as const,
    result,
    elapsedMs: 0,
  }));
  if (actual.kind !== "result") return actual;

  const expected = await execute(host, dataset, withVerify(answer.sql), (result) => ({
    kind: "result" as const,
    result,
    elapsedMs: 0,
  }));
  if (expected.kind !== "result") {
    // 模範解答が動かないのはコンテンツ側の不具合
    return {
      kind: "sql_error",
      message: `模範解答の実行に失敗しました。お手数ですが不具合として報告してください。\n${"message" in expected ? expected.message : ""}`,
    };
  }

  const verdict = judge(actual.result, expected.result, { orderSensitive: answer.orderSensitive });
  return { kind: "judged", correct: verdict.correct, result: actual.result };
}

async function execute(
  host: EngineHost,
  dataset: ResolvedDataset,
  queries: string[],
  onResult: (result: QueryResult) => ExecutionOutcome,
): Promise<ExecutionOutcome> {
  try {
    const items = await host.batch(dataset.ddl, dataset.data, queries);
    for (const item of items) {
      if (!item.ok) return { kind: "sql_error", message: item.error };
    }
    const last = items.at(-1);
    if (!last || !last.ok) return { kind: "sql_error", message: "結果を取得できませんでした。" };
    return onResult(last.result);
  } catch (error) {
    if (error instanceof QueryTimeoutError) return { kind: "timeout", message: error.message };
    return { kind: "sql_error", message: error instanceof Error ? error.message : String(error) };
  }
}
