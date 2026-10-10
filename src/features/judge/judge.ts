import type { CellValue, QueryResult } from "@/features/engine/types";

export type JudgeOptions = {
  orderSensitive: boolean;
};

export type JudgeVerdict = { correct: true } | { correct: false; reason: JudgeMismatch };

/** 不正解の理由。画面には出さず（考える余地を残す）、テスト・デバッグ用に返す */
export type JudgeMismatch = "column_count" | "row_count" | "values" | "order";

/** 数値比較の丸め桁（REAL と numeric の浮動小数差を吸収する） */
const FLOAT_DIGITS = 6;

type Normalized = null | number | string;

/**
 * 結果セットの比較（docs/design/04-judge-rank.md）。
 * 列数・列順・行数は判定対象、列名は不問、行順は orderSensitive のときのみ。
 */
export function judge(
  actual: QueryResult,
  expected: QueryResult,
  options: JudgeOptions,
): JudgeVerdict {
  if (actual.columns.length !== expected.columns.length) {
    return { correct: false, reason: "column_count" };
  }
  if (actual.rows.length !== expected.rows.length) {
    return { correct: false, reason: "row_count" };
  }

  const a = actual.rows.map(rowKey);
  const e = expected.rows.map(rowKey);

  if (options.orderSensitive) {
    if (a.every((key, i) => key === e[i])) return { correct: true };
    const sameMembers = sameMultiset(a, e);
    return { correct: false, reason: sameMembers ? "order" : "values" };
  }

  return sameMultiset(a, e) ? { correct: true } : { correct: false, reason: "values" };
}

function sameMultiset(a: string[], b: string[]): boolean {
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((key, i) => key === sb[i]);
}

function rowKey(row: CellValue[]): string {
  return JSON.stringify(row.map(normalizeCell));
}

export function normalizeCell(value: CellValue | undefined): Normalized {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return normalizeNumber(value);
  if (typeof value === "bigint") return normalizeNumber(Number(value));
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Uint8Array) return `blob:${Array.from(value).join(",")}`;
  // PGlite は numeric を文字列で返す。数値として読める文字列は数値として扱う
  if (/^\s*-?\d+(\.\d+)?([eE][-+]?\d+)?\s*$/.test(value)) {
    return normalizeNumber(Number(value));
  }
  return value;
}

function normalizeNumber(n: number): number {
  if (Number.isInteger(n)) return n;
  const rounded = Number(n.toFixed(FLOAT_DIGITS));
  return Object.is(rounded, -0) ? 0 : rounded;
}
