import type { TableMeta } from "@/features/problem/schema";

/**
 * dataset.json のテーブル情報から Mermaid の erDiagram を組み立てる。
 * er.mmd を手書きすると dataset.json と二重管理になるため、生成で済ませる。
 */
export function toErDiagram(tables: TableMeta[]): string {
  const lines = ["erDiagram"];

  for (const table of tables) {
    lines.push(`  ${table.name} {`);
    for (const column of table.columns) {
      const isFk = table.foreignKeys.some((fk) => fk.column === column.name);
      const keys = [column.pk ? "PK" : null, isFk ? "FK" : null].filter(Boolean).join(",");
      lines.push(`    ${column.type} ${column.name}${keys ? ` ${keys}` : ""}`);
    }
    lines.push("  }");
  }

  for (const table of tables) {
    for (const fk of table.foreignKeys) {
      // 参照される側 1 : 参照する側 0..n
      lines.push(`  ${fk.references.table} ||--o{ ${table.name} : "${fk.column}"`);
    }
  }

  return lines.join("\n");
}
