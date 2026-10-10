import { z } from "zod";

/** localStorage に保存する学習記録（docs/design/05-storage.md） */

export const STORAGE_KEY = "sql-climber:v1";
export const BROKEN_KEY = "sql-climber:v1:broken";

export const problemStatusSchema = z.enum([
  "attempted",
  "solved",
  "surrendered",
  "solved_after_surrender",
]);

export const historyEntrySchema = z.object({
  status: problemStatusSchema,
  /** 初回正解日時（ISO 8601）。未正解なら null */
  solvedAt: z.string().nullable(),
  /** 提出回数（実行は数えない） */
  attempts: z.number().int().min(0),
  /** エディタの最終入力 */
  lastQuery: z.string(),
});

export const progressSchema = z.object({
  version: z.literal(1),
  dialect: z.enum(["sqlite", "postgres"]),
  theme: z.enum(["light", "dark", "system"]),
  rank: z.number().int().min(0).max(1_000_000),
  history: z.record(z.string().regex(/^\d{4}$/), historyEntrySchema),
});

export type ProblemStatus = z.infer<typeof problemStatusSchema>;
export type HistoryEntry = z.infer<typeof historyEntrySchema>;
export type Progress = z.infer<typeof progressSchema>;
export type Theme = Progress["theme"];

export const INITIAL_PROGRESS: Progress = {
  version: 1,
  dialect: "sqlite",
  theme: "system",
  rank: 0,
  history: {},
};

export function isSolved(entry: HistoryEntry | undefined): boolean {
  return entry?.status === "solved" || entry?.status === "solved_after_surrender";
}
