export type Dialect = "sqlite" | "postgres";

export const DIALECT_LABEL: Record<Dialect, string> = {
  sqlite: "SQLite",
  postgres: "PostgreSQL",
};

export type CellValue = string | number | bigint | boolean | null | Uint8Array;

export type QueryResult = {
  columns: string[];
  rows: CellValue[][];
};

/** 方言ごとの実行環境。アプリはこのインターフェースだけに依存する（ADR-0001） */
export interface Engine {
  readonly dialect: Dialect;
  /** DDL とデータでDBをまっさらに作り直す */
  reset(ddl: string, data: string): Promise<void>;
  /**
   * SQLを実行し、最後に結果列を持った文の結果を返す。
   * 列を返す文がなければ columns: [] の結果を返す。
   */
  query(sql: string): Promise<QueryResult>;
  dispose(): Promise<void>;
}

export class SqlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SqlError";
  }
}
