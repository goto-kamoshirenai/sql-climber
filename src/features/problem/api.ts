"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProblemAnswer, ProblemDetail, ProblemSummary } from "./schema";

/** API から取得したものはページ遷移をまたいでメモリに保持する（内容はデプロイ単位で不変） */
const cache = new Map<string, Promise<unknown>>();

export class FetchError extends Error {
  constructor(readonly status: number) {
    super(status === 404 ? "見つかりませんでした" : "読み込みに失敗しました");
  }
}

function fetchJson<T>(url: string): Promise<T> {
  let promise = cache.get(url) as Promise<T> | undefined;
  if (!promise) {
    promise = fetch(url).then((res) => {
      if (!res.ok) throw new FetchError(res.status);
      return res.json() as Promise<T>;
    });
    promise.catch(() => cache.delete(url));
    cache.set(url, promise);
  }
  return promise;
}

export const fetchProblems = () =>
  fetchJson<{ problems: ProblemSummary[] }>("/api/problems").then((r) => r.problems);
export const fetchProblemDetail = (id: string) => fetchJson<ProblemDetail>(`/api/problems/${id}`);
export const fetchProblemAnswer = (id: string) =>
  fetchJson<ProblemAnswer>(`/api/problems/${id}/answer`);

export type Loadable<T> =
  | { state: "loading" }
  | { state: "error"; error: Error; retry: () => void }
  | { state: "ready"; data: T };

function useLoad<T>(key: string, load: () => Promise<T>): Loadable<T> {
  const [result, setResult] = useState<{ key: string; value: Loadable<T> } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    load().then(
      (data) => alive && setResult({ key, value: { state: "ready", data } }),
      (error: Error) => alive && setResult({ key, value: { state: "error", error, retry } }),
    );
    return () => {
      alive = false;
    };
    // load はキーで一意に決まる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt, retry]);

  return result && result.key === key ? result.value : { state: "loading" };
}

export function useProblems(): Loadable<ProblemSummary[]> {
  return useLoad("problems", fetchProblems);
}

export function useProblemDetail(id: string): Loadable<ProblemDetail> {
  return useLoad(`problem:${id}`, () => fetchProblemDetail(id));
}
