import type { Database, SqlJsStatic } from "sql.js";
import { SqlError, type Engine, type QueryResult } from "./types";

/** sql.js アダプタ。ブラウザ（Worker）と Node（検証スクリプト）の両方で動く */
export function createSqliteEngine(SQL: SqlJsStatic): Engine {
  let db: Database | null = null;

  return {
    dialect: "sqlite",
    async reset(ddl, data) {
      db?.close();
      db = new SQL.Database();
      db.exec(ddl);
      db.exec(data);
    },
    async query(sql): Promise<QueryResult> {
      if (!db) throw new Error("engine not initialized");
      try {
        const results = db.exec(sql);
        const last = results.at(-1);
        if (!last) return { columns: [], rows: [] };
        return { columns: last.columns, rows: last.values };
      } catch (error) {
        throw new SqlError(error instanceof Error ? error.message : String(error));
      }
    },
    async dispose() {
      db?.close();
      db = null;
    },
  };
}
