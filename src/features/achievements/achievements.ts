import type { IconName } from "dotterel-ui/icon";
import { GRADES, GRADE_INFO } from "@/features/problem/grades";
import type { ClimbStats } from "./stats";

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  reached: (stats: ClimbStats) => boolean;
};

const GRADE_ACHIEVEMENTS: Achievement[] = GRADES.map((grade) => ({
  id: `grade-${grade}`,
  name: `${GRADE_INFO[grade].label}踏破`,
  description: `${GRADE_INFO[grade].label}の問題をすべて登頂する`,
  icon: "bookmark-filled",
  reached: (s) => s.gradesCleared.includes(grade),
}));

/** 実績の一覧（表示順）。条件は学習記録から求めた集計だけで判定する */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-step",
    name: "はじめの一歩",
    description: "はじめて登頂する",
    icon: "play",
    reached: (s) => s.solved >= 1,
  },
  {
    id: "one-shot",
    name: "一発登頂",
    description: "1回目の提出で登頂する",
    icon: "check",
    reached: (s) => s.firstTry >= 1,
  },
  {
    id: "sharpshooter",
    name: "読図の達人",
    description: "1回目の提出で 10 問登頂する",
    icon: "star",
    reached: (s) => s.firstTry >= 10,
  },
  {
    id: "comeback",
    name: "再挑戦",
    description: "降参した問題に、あとで登頂する",
    icon: "undo",
    reached: (s) => s.recovered >= 1,
  },
  {
    id: "streak-3",
    name: "3日連続",
    description: "3日続けて登頂する",
    icon: "timer",
    reached: (s) => s.bestStreak >= 3,
  },
  {
    id: "streak-7",
    name: "山ごもり",
    description: "7日続けて登頂する",
    icon: "timer",
    reached: (s) => s.bestStreak >= 7,
  },
  {
    id: "ten-summits",
    name: "十座",
    description: "10 問登頂する",
    icon: "checklist",
    reached: (s) => s.solved >= 10,
  },
  ...GRADE_ACHIEVEMENTS,
  {
    id: "all-summits",
    name: "全山踏破",
    description: "すべての問題を登頂する",
    icon: "crown",
    reached: (s) => s.total > 0 && s.solved === s.total,
  },
];

export function unlocked(stats: ClimbStats): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.reached(stats));
}

/** before では未達成で after で達成した実績 */
export function newlyUnlocked(before: ClimbStats, after: ClimbStats): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !a.reached(before) && a.reached(after));
}
