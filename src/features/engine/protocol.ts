import type { Dialect, QueryResult } from "./types";

/** メインスレッド ⇔ エンジン Worker 間のメッセージ */

export type WorkerRequest =
  | { id: number; type: "init"; dialect: Dialect }
  | { id: number; type: "batch"; ddl: string; data: string; queries: string[] };

export type BatchItem = { ok: true; result: QueryResult } | { ok: false; error: string };

export type WorkerResponse =
  { id: number; ok: true; items?: BatchItem[] } | { id: number; ok: false; error: string };
