"use client";

import { useMemo } from "react";
import { useProblems } from "@/features/problem/api";
import type { ProblemSummary } from "@/features/problem/schema";
import { INITIAL_PROGRESS, type Progress } from "@/features/storage/progress-schema";
import { useHydrated, useProgress } from "@/features/storage/progress-store";
import { unlocked, type Achievement } from "./achievements";
import { climbStats, nextClimb, type ClimbStats } from "./stats";

export type Climb = {
  /** 問題一覧とブラウザの記録がそろったか（そろうまでは記録なしとして描く） */
  ready: boolean;
  progress: Progress;
  problems: ProblemSummary[];
  stats: ClimbStats;
  achievements: Achievement[];
  next: ProblemSummary | null;
};

const NO_PROBLEMS: ProblemSummary[] = [];

export function useClimb(): Climb {
  const loadable = useProblems();
  const stored = useProgress();
  const hydrated = useHydrated();
  const progress = hydrated ? stored : INITIAL_PROGRESS;
  const problems = loadable.state === "ready" ? loadable.data : NO_PROBLEMS;

  return useMemo(() => {
    const stats = climbStats(progress, problems, new Date());
    return {
      ready: hydrated && loadable.state === "ready",
      progress,
      problems,
      stats,
      achievements: unlocked(stats),
      next: nextClimb(problems, progress),
    };
  }, [progress, problems, hydrated, loadable.state]);
}
