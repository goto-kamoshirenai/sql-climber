/**
 * SQL文字列に含まれる文の数を数える。
 * 文字列リテラル・引用符付き識別子・コメント内の `;` は区切りとみなさない。
 * 空文（`;;` や末尾の `;`）は数えない。
 */
export function countStatements(sql: string): number {
  let count = 0;
  let hasContent = false;
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i]!;
    const next = sql[i + 1];

    if (ch === "-" && next === "-") {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end + 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      hasContent = true;
      i = skipQuoted(sql, i, ch);
      continue;
    }
    if (ch === ";") {
      if (hasContent) count++;
      hasContent = false;
      i++;
      continue;
    }
    if (!/\s/.test(ch)) hasContent = true;
    i++;
  }

  if (hasContent) count++;
  return count;
}

/** クォートの開始位置から、閉じクォートの直後の位置を返す（`''` のエスケープに対応） */
function skipQuoted(sql: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < sql.length) {
    if (sql[i] === quote) {
      if (sql[i + 1] === quote) {
        i += 2;
        continue;
      }
      return i + 1;
    }
    i++;
  }
  return sql.length;
}
