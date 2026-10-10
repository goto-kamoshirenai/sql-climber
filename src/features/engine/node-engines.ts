import initSqlJs from "sql.js";
import { PGlite } from "@electric-sql/pglite";
import { createPostgresEngine } from "./postgres-engine";
import { createSqliteEngine } from "./sqlite-engine";
import type { Dialect, Engine } from "./types";

/** Node（検証スクリプト・テスト）用のエンジン生成。ブラウザでは使わない */
export async function createNodeEngine(dialect: Dialect): Promise<Engine> {
  if (dialect === "sqlite") return createSqliteEngine(await initSqlJs());
  return createPostgresEngine(await PGlite.create());
}
