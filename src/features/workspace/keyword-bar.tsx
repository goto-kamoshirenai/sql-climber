"use client";

const KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "ORDER BY",
  "DESC",
  "GROUP BY",
  "HAVING",
  "JOIN",
  "ON",
  "AS",
  "COUNT(",
  "LIMIT",
];
const SYMBOLS = ["*", "=", "'", ",", "(", ")", "<", ">", ";"];

/** モバイル用の SQL 入力補助バー。ワンタップでカーソル位置に挿入する */
export function KeywordBar({
  tables,
  onInsert,
}: {
  tables: string[];
  onInsert: (text: string) => void;
}) {
  const chips = [...KEYWORDS, ...tables, ...SYMBOLS];
  return (
    <div className="keyword-bar" role="toolbar" aria-label="SQL 入力補助">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          className="keyword-bar__chip"
          data-kind={
            KEYWORDS.includes(chip) ? "keyword" : SYMBOLS.includes(chip) ? "symbol" : "table"
          }
          // フォーカスをエディタから奪わない（キーボードを閉じさせない）
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => onInsert(chip)}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
