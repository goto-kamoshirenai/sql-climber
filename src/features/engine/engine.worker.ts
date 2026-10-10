/// <reference lib="webworker" />
import type { BatchItem, WorkerRequest, WorkerResponse } from "./protocol";
import type { Dialect, Engine } from "./types";

/**
 * SQL エンジンを UI スレッドから切り離して動かす Worker。
 * 暴走したクエリはメインスレッド側が Worker ごと terminate する。
 */

declare const self: DedicatedWorkerGlobalScope;

let engine: Engine | null = null;

async function loadWasm(path: string): Promise<WebAssembly.Module> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} の取得に失敗しました（${response.status}）`);
  return WebAssembly.compile(await response.arrayBuffer());
}

async function createEngine(dialect: Dialect): Promise<Engine> {
  if (dialect === "sqlite") {
    const [{ default: initSqlJs }, { createSqliteEngine }] = await Promise.all([
      import("sql.js"),
      import("./sqlite-engine"),
    ]);
    const SQL = await initSqlJs({ locateFile: (file: string) => `/wasm/${file}` });
    return createSqliteEngine(SQL);
  }

  const [{ PGlite }, { createPostgresEngine }, pgliteWasmModule, initdbWasmModule, fsBundle] =
    await Promise.all([
      import("@electric-sql/pglite"),
      import("./postgres-engine"),
      loadWasm("/wasm/pglite.wasm"),
      loadWasm("/wasm/initdb.wasm"),
      fetch("/wasm/pglite.data").then((r) => r.blob()),
    ]);
  const pg = await PGlite.create({ pgliteWasmModule, initdbWasmModule, fsBundle });
  return createPostgresEngine(pg);
}

async function handle(request: WorkerRequest): Promise<WorkerResponse> {
  if (request.type === "init") {
    engine ??= await createEngine(request.dialect);
    return { id: request.id, ok: true };
  }

  if (!engine) throw new Error("engine not initialized");
  await engine.reset(request.ddl, request.data);

  const items: BatchItem[] = [];
  for (const sql of request.queries) {
    try {
      items.push({ ok: true, result: await engine.query(sql) });
    } catch (error) {
      items.push({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { id: request.id, ok: true, items };
}

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  handle(event.data)
    .then((response) => self.postMessage(response))
    .catch((error: unknown) =>
      self.postMessage({
        id: event.data.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      } satisfies WorkerResponse),
    );
});
