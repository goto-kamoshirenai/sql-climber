import type { PGlite } from "@electric-sql/pglite";
import { SqlError, type CellValue, type Engine, type QueryResult } from "./types";

/**
 * PGlite アダプタ。インスタンス生成は重い（数百ms〜）ので1つを使い回し、
 * reset はスキーマの作り直しで行う（学習用データ規模なら数十ms）。
 */
export function createPostgresEngine(pg: PGlite): Engine {
  async function resetSchema(ddl: string, data: string) {
    // 前回の実行で残った途中のトランザクションを片付ける
    await pg.exec("ROLLBACK").catch(() => undefined);
    await pg.exec("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
    await pg.exec(ddl);
    await pg.exec(data);
  }

  return {
    dialect: "postgres",
    async reset(ddl, data) {
      await resetSchema(ddl, data);
    },
    async query(sql): Promise<QueryResult> {
      try {
        const results = await pg.exec(sql, { rowMode: "array" });
        const last = [...results].reverse().find((r) => r.fields.length > 0);
        if (!last) return { columns: [], rows: [] };
        return {
          columns: last.fields.map((f) => f.name),
          rows: last.rows as unknown as CellValue[][],
        };
      } catch (error) {
        throw new SqlError(formatPgError(error));
      }
    },
    async dispose() {
      await pg.close();
    },
  };
}

function formatPgError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const e = error as { message: string; hint?: string; position?: string };
    let message = e.message;
    if (e.position) message += `（位置: ${e.position}文字目）`;
    if (e.hint) message += `\nHINT: ${e.hint}`;
    return message;
  }
  return String(error);
}
