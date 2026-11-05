import { GRADES, type Grade } from "@/features/problem/grades";
import type { ProblemSummary } from "@/features/problem/schema";
import { isSolved, type Progress } from "@/features/storage/progress-schema";

/** 学習記録から求める山行の集計。保存はせず、表示のたびに計算する */
export type ClimbStats = {
  solved: number;
  total: number;
  /** 1回目の提出で登頂した問題の数（登頂後に再提出した問題は数えられない） */
  firstTry: number;
  /** 降参したあとで登頂した問題の数 */
  recovered: number;
  /** 登頂した日が何日続いているか（今日か昨日まで続いていれば継続中） */
  currentStreak: number;
  bestStreak: number;
  /** すべて登頂した難易度帯 */
  gradesCleared: Grade[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** ローカル時刻の日付（0時）を通し番号にする */
function dayNumber(date: Date): number {
  return Math.round(
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / DAY_MS,
  );
}

function streaks(solvedDates: Date[], now: Date): { current: number; best: number } {
  const days = [...new Set(solvedDates.map(dayNumber))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1]! + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const last = days.at(-1);
  const today = dayNumber(now);
  const current = last !== undefined && today - last <= 1 ? run : 0;
  return { current, best };
}

export function climbStats(progress: Progress, problems: ProblemSummary[], now: Date): ClimbStats {
  const entries = problems.map((p) => ({ problem: p, entry: progress.history[p.id] }));
  const solvedEntries = entries.filter(({ entry }) => isSolved(entry));
  const { current, best } = streaks(
    solvedEntries.flatMap(({ entry }) => (entry?.solvedAt ? [new Date(entry.solvedAt)] : [])),
    now,
  );
  const gradesCleared = GRADES.filter((grade) => {
    const inGrade = entries.filter(({ problem }) => problem.grade === grade);
    return inGrade.length > 0 && inGrade.every(({ entry }) => isSolved(entry));
  });

  return {
    solved: solvedEntries.length,
    total: problems.length,
    firstTry: solvedEntries.filter(
      ({ entry }) => entry?.status === "solved" && entry.attempts === 1,
    ).length,
    recovered: solvedEntries.filter(({ entry }) => entry?.status === "solved_after_surrender")
      .length,
    currentStreak: current,
    bestStreak: best,
    gradesCleared,
  };
}

/** 次に登る問題: 標高の低い順で、まだ登頂していない最初の問題。全問登頂済みなら null */
export function nextClimb(problems: ProblemSummary[], progress: Progress): ProblemSummary | null {
  return (
    [...problems]
      .sort((a, b) => a.altitude - b.altitude)
      .find((p) => !isSolved(progress.history[p.id])) ?? null
  );
}
