import type { CellValue, QueryResult } from "@/features/engine/types";

/** 表示は先頭1000行まで（判定は全行で行う） */
export const DISPLAY_ROW_LIMIT = 1000;

export function formatCell(value: CellValue): string {
  if (value === null) return "NULL";
  if (value instanceof Uint8Array) return `[BLOB ${value.length} bytes]`;
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function ResultTable({
  result,
  caption,
  limit = DISPLAY_ROW_LIMIT,
}: {
  result: QueryResult;
  caption?: string;
  limit?: number;
}) {
  if (result.columns.length === 0) {
    return <p className="muted result-empty">実行しました（結果の列を返さない文です）。</p>;
  }
  const rows = result.rows.slice(0, limit);
  return (
    <div className="result-table-wrap">
      <table className="result-table">
        {caption && <caption className="visually-hidden">{caption}</caption>}
        <thead>
          <tr>
            <th scope="col" className="result-table__index">
              #
            </th>
            {result.columns.map((c, i) => (
              <th key={i} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              <td className="result-table__index">{r + 1}</td>
              {row.map((cell, c) => (
                <td
                  key={c}
                  className={
                    cell === null
                      ? "is-null"
                      : typeof cell === "number" || typeof cell === "bigint"
                        ? "is-num"
                        : undefined
                  }
                >
                  {formatCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="muted result-empty">0 行でした。</p>}
    </div>
  );
}
