"use client";

import { useSyncExternalStore } from "react";
import type { Dialect } from "@/features/engine/types";
import { applyDraft, applySubmission, applySurrender, type AscentResult } from "./progress-logic";
import {
  BROKEN_KEY,
  INITIAL_PROGRESS,
  STORAGE_KEY,
  progressSchema,
  type Progress,
  type Theme,
} from "./progress-schema";

/**
 * 学習記録ストア。localStorage の読み書きはここに集約する（他から直接触らない）。
 * サーバー描画とハイドレーションでは INITIAL_PROGRESS を使い、その後ブラウザの値に切り替わる。
 */

let state: Progress | null = null;
const listeners = new Set<() => void>();

function read(): Progress {
  if (state) return state;
  state = INITIAL_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = progressSchema.safeParse(JSON.parse(raw));
      if (parsed.success) {
        state = parsed.data;
      } else {
        // 壊れたデータは黙って消さず退避する
        window.localStorage.setItem(BROKEN_KEY, raw);
      }
    }
  } catch {
    // ストレージが使えない環境（プライベートモード等）では初期値で動く
  }
  return state;
}

function write(next: Progress, notify = true) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 保存できなくても画面上の状態は進める
  }
  if (notify) listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      state = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, read, () => INITIAL_PROGRESS);
}

/** ハイドレーション後（ブラウザの値が読めた後）かどうか */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
const noopSubscribe = () => () => {};

export const progressActions = {
  submit(problemId: string, altitude: number, correct: boolean): AscentResult {
    const { progress, ascent } = applySubmission(read(), problemId, altitude, correct, new Date());
    write(progress);
    return ascent;
  },
  surrender(problemId: string) {
    write(applySurrender(read(), problemId));
  },
  /** 書きかけ保存は画面を再描画させない */
  saveDraft(problemId: string, query: string) {
    const next = applyDraft(read(), problemId, query);
    if (next !== read()) write(next, false);
  },
  getDraft(problemId: string): string {
    return read().history[problemId]?.lastQuery ?? "";
  },
  setDialect(dialect: Dialect) {
    write({ ...read(), dialect });
  },
  setTheme(theme: Theme) {
    write({ ...read(), theme });
  },
  /** インポート（全置換）。検証済みのデータを渡すこと */
  replace(progress: Progress) {
    write(progress);
  },
  clear() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 何もしない
    }
    state = INITIAL_PROGRESS;
    listeners.forEach((l) => l());
  },
  exportJson(): string {
    return JSON.stringify(read(), null, 2);
  },
};

export type ImportCheck = { ok: true; progress: Progress } | { ok: false; message: string };

export function parseImport(text: string): ImportCheck {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, message: "このファイルは読み込めません（JSON ではありません）。" };
  }
  const parsed = progressSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "このファイルは読み込めません（SQL Climber の学習記録の形式ではありません）。",
    };
  }
  return { ok: true, progress: parsed.data };
}
