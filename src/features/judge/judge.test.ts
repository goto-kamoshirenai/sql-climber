import { describe, expect, it } from "vitest";
import type { QueryResult } from "@/features/engine/types";
import { judge, normalizeCell } from "./judge";

const result = (columns: string[], rows: QueryResult["rows"]): QueryResult => ({ columns, rows });
const unordered = { orderSensitive: false };
const ordered = { orderSensitive: true };

describe("judge", () => {
  const expected = result(
    ["name", "altitude"],
    [
      ["高尾山", 599],
      ["筑波山", 877],
    ],
  );

  it("同じ結果なら正解", () => {
    expect(judge(expected, expected, unordered)).toEqual({ correct: true });
  });

  it("行順不問の問題では順序違いも正解", () => {
    const actual = result(
      ["name", "altitude"],
      [
        ["筑波山", 877],
        ["高尾山", 599],
      ],
    );
    expect(judge(actual, expected, unordered)).toEqual({ correct: true });
  });

  it("orderSensitive の問題では順序違いは不正解（理由: order）", () => {
    const actual = result(
      ["name", "altitude"],
      [
        ["筑波山", 877],
        ["高尾山", 599],
      ],
    );
    expect(judge(actual, expected, ordered)).toEqual({ correct: false, reason: "order" });
    expect(judge(expected, expected, ordered)).toEqual({ correct: true });
  });

  it("列名（エイリアス）の違いは不問", () => {
    const actual = result(["山名", "標高"], expected.rows);
    expect(judge(actual, expected, unordered)).toEqual({ correct: true });
  });

  it("列順の違いは不正解", () => {
    const actual = result(
      ["altitude", "name"],
      [
        [599, "高尾山"],
        [877, "筑波山"],
      ],
    );
    expect(judge(actual, expected, unordered).correct).toBe(false);
  });

  it("列数の違いは不正解", () => {
    const actual = result(["name"], [["高尾山"], ["筑波山"]]);
    expect(judge(actual, expected, unordered)).toEqual({ correct: false, reason: "column_count" });
  });

  it("行数の違いは不正解", () => {
    const actual = result(["name", "altitude"], [["高尾山", 599]]);
    expect(judge(actual, expected, unordered)).toEqual({ correct: false, reason: "row_count" });
  });

  it("重複行の数も比較する（多重集合）", () => {
    const e = result(["a"], [[1], [1], [2]]);
    const a = result(["a"], [[1], [2], [2]]);
    expect(judge(a, e, unordered).correct).toBe(false);
  });

  it("NULL を含む行を比較できる", () => {
    const e = result(
      ["a", "b"],
      [
        [null, 1],
        [2, null],
      ],
    );
    const a = result(
      ["a", "b"],
      [
        [2, null],
        [null, 1],
      ],
    );
    expect(judge(a, e, unordered)).toEqual({ correct: true });
  });

  it("NULL と空文字は区別する", () => {
    expect(judge(result(["a"], [[""]]), result(["a"], [[null]]), unordered).correct).toBe(false);
  });

  it("浮動小数の誤差（AVG）を吸収する", () => {
    const e = result(["avg"], [[0.1 + 0.2]]);
    const a = result(["avg"], [[0.3]]);
    expect(judge(a, e, unordered)).toEqual({ correct: true });
  });

  it("PG numeric の文字列表現と数値を同一視する", () => {
    const e = result(["avg"], [["1650.0000000000000000"], ["10.5"]]);
    const a = result(["avg"], [[1650], [10.5]]);
    expect(judge(a, e, unordered)).toEqual({ correct: true });
  });

  it("空結果同士は正解", () => {
    expect(judge(result(["a"], []), result(["a"], []), unordered)).toEqual({ correct: true });
  });

  it("文字列の空白差は不正解（trim しない）", () => {
    expect(judge(result(["a"], [["x "]]), result(["a"], [["x"]]), unordered).correct).toBe(false);
  });
});

describe("normalizeCell", () => {
  it("bigint と boolean を数値にそろえる", () => {
    expect(normalizeCell(10n)).toBe(10);
    expect(normalizeCell(true)).toBe(1);
    expect(normalizeCell(false)).toBe(0);
  });

  it("数値に読めない文字列はそのまま", () => {
    expect(normalizeCell("12a")).toBe("12a");
    expect(normalizeCell("2024-05-01")).toBe("2024-05-01");
  });

  it("undefined は NULL 扱い", () => {
    expect(normalizeCell(undefined)).toBeNull();
  });
});
