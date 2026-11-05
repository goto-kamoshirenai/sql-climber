import { describe, expect, it } from "vitest";
import type { ProblemSummary } from "@/features/problem/schema";
import {
  INITIAL_PROGRESS,
  type HistoryEntry,
  type Progress,
} from "@/features/storage/progress-schema";
import { newlyUnlocked, unlocked } from "./achievements";
import { climbStats, nextClimb } from "./stats";

const problem = (id: string, grade: ProblemSummary["grade"], altitude: number): ProblemSummary => ({
  id,
  title: `問題${id}`,
  grade,
  altitude,
  datasetId: "base-camp",
  datasetName: "ふもと",
});

const PROBLEMS = [problem("0002", 500, 80), problem("0001", 500, 40), problem("0011", 1500, 600)];

const solved = (solvedAt: string, attempts = 1): HistoryEntry => ({
  status: "solved",
  solvedAt,
  attempts,
  lastQuery: "",
});

const withHistory = (history: Progress["history"]): Progress => ({ ...INITIAL_PROGRESS, history });

// ローカル時刻で日付を作る（日付の区切りは利用者の端末の時刻）
const local = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);
const iso = (y: number, m: number, d: number, h = 12) => local(y, m, d, h).toISOString();

describe("climbStats", () => {
  it("記録がなければすべて 0", () => {
    expect(climbStats(INITIAL_PROGRESS, PROBLEMS, local(2026, 11, 6))).toEqual({
      solved: 0,
      total: 3,
      firstTry: 0,
      recovered: 0,
      currentStreak: 0,
      bestStreak: 0,
      gradesCleared: [],
    });
  });

  it("1回目の提出で登頂した問題と、降参後の登頂を数える", () => {
    const stats = climbStats(
      withHistory({
        "0001": solved(iso(2026, 11, 6)),
        "0002": solved(iso(2026, 11, 6), 3),
        "0011": {
          status: "solved_after_surrender",
          solvedAt: iso(2026, 11, 6),
          attempts: 1,
          lastQuery: "",
        },
      }),
      PROBLEMS,
      local(2026, 11, 6),
    );
    expect(stats.solved).toBe(3);
    expect(stats.firstTry).toBe(1);
    expect(stats.recovered).toBe(1);
    expect(stats.gradesCleared).toEqual([500, 1500]);
  });

  it("連続日数: 同じ日の複数登頂は1日、昨日まで続いていれば継続中", () => {
    const history = {
      "0001": solved(iso(2026, 11, 4, 9)),
      "0002": solved(iso(2026, 11, 5, 23)),
      "0011": solved(iso(2026, 11, 5, 1)),
    };
    const stats = climbStats(withHistory(history), PROBLEMS, local(2026, 11, 6, 8));
    expect(stats.currentStreak).toBe(2);
    expect(stats.bestStreak).toBe(2);
  });

  it("2日以上空くと連続は途切れるが、最長記録は残る", () => {
    const history = {
      "0001": solved(iso(2026, 11, 1)),
      "0002": solved(iso(2026, 11, 2)),
      "0011": solved(iso(2026, 11, 3)),
    };
    const stats = climbStats(withHistory(history), PROBLEMS, local(2026, 11, 6));
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(3);
  });

  it("月をまたいでも連続として数える", () => {
    const history = { "0001": solved(iso(2026, 10, 31)), "0002": solved(iso(2026, 11, 1)) };
    expect(climbStats(withHistory(history), PROBLEMS, local(2026, 11, 1)).currentStreak).toBe(2);
  });
});

describe("nextClimb", () => {
  it("標高の低い順で、まだ登頂していない問題を返す", () => {
    expect(nextClimb(PROBLEMS, INITIAL_PROGRESS)?.id).toBe("0001");
    expect(nextClimb(PROBLEMS, withHistory({ "0001": solved(iso(2026, 11, 6)) }))?.id).toBe("0002");
  });

  it("全問登頂していれば null", () => {
    const all = withHistory(
      Object.fromEntries(PROBLEMS.map((p) => [p.id, solved(iso(2026, 11, 6))])),
    );
    expect(nextClimb(PROBLEMS, all)).toBeNull();
  });
});

describe("achievements", () => {
  it("新たに達成した実績だけを返す", () => {
    const now = local(2026, 11, 6);
    const before = climbStats(INITIAL_PROGRESS, PROBLEMS, now);
    const after = climbStats(withHistory({ "0001": solved(iso(2026, 11, 6)) }), PROBLEMS, now);
    expect(newlyUnlocked(before, after).map((a) => a.id)).toEqual(["first-step", "one-shot"]);
    expect(newlyUnlocked(after, after)).toEqual([]);
  });

  it("全問登頂で難易度帯と全山の実績がそろう", () => {
    const all = withHistory(
      Object.fromEntries(PROBLEMS.map((p) => [p.id, solved(iso(2026, 11, 6))])),
    );
    const ids = unlocked(climbStats(all, PROBLEMS, local(2026, 11, 6))).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(["grade-500", "grade-1500", "all-summits"]));
    expect(ids).not.toContain("grade-2500");
  });
});
