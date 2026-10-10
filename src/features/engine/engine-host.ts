import type { BatchItem, WorkerRequest, WorkerResponse } from "./protocol";
import type { Dialect } from "./types";

/** クエリ実行のタイムアウト（docs/design/01-overview.md） */
export const QUERY_TIMEOUT_MS = 5000;

export type EngineStatus = "idle" | "loading" | "ready" | "error";

export class QueryTimeoutError extends Error {
  constructor() {
    super(
      "クエリの実行に時間がかかりすぎたため中断しました。結合条件の書き忘れなどで、結果が膨大になっていないか確かめてください。",
    );
    this.name = "QueryTimeoutError";
  }
}

type WorkerRequestBody = WorkerRequest extends infer R
  ? R extends WorkerRequest
    ? Omit<R, "id">
    : never
  : never;

type Pending = {
  resolve: (response: WorkerResponse) => void;
  reject: (error: Error) => void;
};

/**
 * 方言ごとに1つの Worker を保持し、要求を順番に流す。
 * タイムアウトしたら Worker を破棄し、次の要求で作り直す。
 */
class EngineHost {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private seq = 0;
  private pending = new Map<number, Pending>();
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<() => void>();
  status: EngineStatus = "idle";

  constructor(readonly dialect: Dialect) {}

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: EngineStatus) {
    this.status = status;
    this.listeners.forEach((l) => l());
  }

  /** エンジンを読み込む（初回は wasm の取得に数秒かかる） */
  load(): Promise<void> {
    if (this.ready) return this.ready;
    this.setStatus("loading");
    const worker = new Worker(new URL("./engine.worker.ts", import.meta.url), { type: "module" });
    worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      const pending = this.pending.get(event.data.id);
      if (!pending) return;
      this.pending.delete(event.data.id);
      pending.resolve(event.data);
    });
    worker.addEventListener("error", (event) => {
      this.fail(new Error(event.message || "エンジンでエラーが発生しました"));
    });
    this.worker = worker;

    this.ready = this.post({ type: "init", dialect: this.dialect }).then(
      (response) => {
        if (!response.ok) throw new Error(response.error);
        this.setStatus("ready");
      },
      (error: Error) => {
        throw error;
      },
    );
    this.ready.catch(() => {
      this.teardown();
      this.setStatus("error");
    });
    return this.ready;
  }

  /** DB を初期状態に戻してからクエリを順に実行する。要求は直列に処理される */
  batch(ddl: string, data: string, queries: string[]): Promise<BatchItem[]> {
    const run = async () => {
      await this.load();
      const response = await this.post({ type: "batch", ddl, data, queries }, QUERY_TIMEOUT_MS);
      if (!response.ok) throw new Error(response.error);
      return response.items ?? [];
    };
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  private post(request: WorkerRequestBody, timeoutMs?: number): Promise<WorkerResponse> {
    const worker = this.worker;
    if (!worker) return Promise.reject(new Error("engine not loaded"));
    const id = ++this.seq;

    return new Promise<WorkerResponse>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      this.pending.set(id, {
        resolve: (r) => {
          clearTimeout(timer);
          resolve(r);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      if (timeoutMs) {
        timer = setTimeout(() => {
          this.pending.delete(id);
          // 同期実行中の Worker は止められないので丸ごと捨てる
          this.teardown();
          this.setStatus("idle");
          reject(new QueryTimeoutError());
        }, timeoutMs);
      }
      worker.postMessage({ ...request, id } as WorkerRequest);
    });
  }

  private fail(error: Error) {
    this.pending.forEach((p) => p.reject(error));
    this.pending.clear();
    this.teardown();
    this.setStatus("error");
  }

  private teardown() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
  }
}

const hosts = new Map<Dialect, EngineHost>();

export function getEngineHost(dialect: Dialect): EngineHost {
  let host = hosts.get(dialect);
  if (!host) {
    host = new EngineHost(dialect);
    hosts.set(dialect, host);
  }
  return host;
}

export type { EngineHost };
