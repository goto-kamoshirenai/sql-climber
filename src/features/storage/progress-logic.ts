import { nextRank } from "@/features/rank/rank";
import type { HistoryEntry, Progress } from "./progress-schema";
import { isSolved } from "./progress-schema";

/** 学習記録の状態遷移（純関数）。保存は progress-store が行う */

const emptyEntry = (): HistoryEntry => ({
  status: "attempted",
  solvedAt: null,
  attempts: 0,
  lastQuery: "",
});

export type AscentResult = {
  /** この提出で初めて正解したか（ランク更新はこのときだけ） */
  firstAscent: boolean;
  rankBefore: number;
  rankAfter: number;
};

/** 提出結果を記録する */
export function applySubmission(
  progress: Progress,
  problemId: string,
  altitude: number,
  correct: boolean,
  now: Date,
): { progress: Progress; ascent: AscentResult } {
  const entry = progress.history[problemId] ?? emptyEntry();
  const rankBefore = progress.rank;
  const updated: HistoryEntry = { ...entry, attempts: entry.attempts + 1 };
  let rankAfter = rankBefore;
  let firstAscent = false;

  if (correct && !isSolved(entry)) {
    firstAscent = true;
    const surrendered = entry.status === "surrendered";
    rankAfter = nextRank(rankBefore, altitude, surrendered);
    updated.status = surrendered ? "solved_after_surrender" : "solved";
    updated.solvedAt = now.toISOString();
  }

  return {
    progress: {
      ...progress,
      rank: rankAfter,
      history: { ...progress.history, [problemId]: updated },
    },
    ascent: { firstAscent, rankBefore, rankAfter },
  };
}

/** 降参を記録する。正解済みの問題では何もしない */
export function applySurrender(progress: Progress, problemId: string): Progress {
  const entry = progress.history[problemId] ?? emptyEntry();
  if (isSolved(entry) || entry.status === "surrendered") return progress;
  return {
    ...progress,
    history: { ...progress.history, [problemId]: { ...entry, status: "surrendered" } },
  };
}

/** エディタの書きかけを記録する */
export function applyDraft(progress: Progress, problemId: string, query: string): Progress {
  const entry = progress.history[problemId] ?? emptyEntry();
  if (entry.lastQuery === query) return progress;
  return {
    ...progress,
    history: { ...progress.history, [problemId]: { ...entry, lastQuery: query } },
  };
}
